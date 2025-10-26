const { GoogleGenerativeAI } = require("@google/generative-ai");
const { ethers } = require("ethers");
const axios = require("axios");
require("dotenv").config();

const OracleMarketsABI = require("../../contracts/artifacts/contracts/OracleMarkets.sol/OracleMarkets.json").abi;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

// Initialize ethers provider and signer
const provider = new ethers.JsonRpcProvider(process.env.PUSHCHAIN_RPC);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const oracleMarkets = new ethers.Contract(
  process.env.ORACLE_MARKETS_ADDRESS,
  OracleMarketsABI,
  wallet
);

// Configuration
const CONFIDENCE_THRESHOLD = parseFloat(process.env.CONFIDENCE_THRESHOLD) || 0.7;
const MIN_ODDS = parseInt(process.env.MIN_ODDS) || 9000;
const MAX_ODDS = parseInt(process.env.MAX_ODDS) || 9500;

/**
 * Main oracle resolver service
 */
class OracleResolver {
  constructor() {
    this.isListening = false;
    this.processedMarkets = new Set();
  }

  /**
   * Start listening to MarketEnded events
   */
  async start() {
    console.log("🔮 OracleMarkets Resolver starting...");
    console.log(`📍 Contract: ${process.env.ORACLE_MARKETS_ADDRESS}`);
    console.log(`🌐 Network: PushChain Donut (${process.env.PUSHCHAIN_CHAIN_ID})`);

    this.isListening = true;

    // Listen for MarketEnded events
    oracleMarkets.on("MarketEnded", async (marketId, timestamp, event) => {
      console.log(`\n📢 MarketEnded event detected: Market #${marketId}`);
      await this.handleMarketEnded(marketId);
    });

    // Also check for any markets that ended but weren't resolved
    await this.scanForEndedMarkets();

    console.log("✅ Oracle resolver is now listening for events...\n");
  }

  /**
   * Scan for markets that have ended but not been resolved
   */
  async scanForEndedMarkets() {
    try {
      console.log("🔍 Scanning for ended markets...");
      
      // Get total markets (you'd need to add this view function to contract)
      // For now, we'll check markets 1-100
      for (let i = 1; i <= 100; i++) {
        try {
          const market = await oracleMarkets.getMarket(i);
          
          // Check if market ended but not resolved
          if (market.state === 2 && !this.processedMarkets.has(i)) { // State 2 = Ended
            console.log(`Found ended market: #${i}`);
            await this.handleMarketEnded(i);
          }
        } catch (error) {
          // Market doesn't exist, stop scanning
          if (error.message.includes("Market does not exist")) {
            break;
          }
        }
      }
    } catch (error) {
      console.error("Error scanning markets:", error.message);
    }
  }

  /**
   * Handle MarketEnded event
   */
  async handleMarketEnded(marketId) {
    if (this.processedMarkets.has(marketId)) {
      console.log(`⏭️  Market #${marketId} already processed, skipping...`);
      return;
    }

    try {
      console.log("\n" + "=".repeat(60));
      console.log(`🎯 Processing Market #${marketId}`);
      console.log("=".repeat(60));

      // Fetch market details
      const market = await oracleMarkets.getMarket(marketId);
      console.log(`📝 Title: ${market.title}`);
      console.log(`📋 Description: ${market.description}`);
      console.log(`🏷️  Category: ${market.category}`);

      // Fetch external data based on category
      const externalData = await this.fetchExternalData(market);

      // Build prompt for Gemini
      const prompt = this.buildResolutionPrompt(market, externalData);

      // Query Gemini for resolution
      console.log("\n🤖 Querying Gemini AI for resolution...");
      const resolution = await this.queryGemini(prompt, market);

      console.log(`\n📊 Resolution Result:`);
      console.log(`   Outcome: ${resolution.outcome}`);
      console.log(`   Confidence: ${(resolution.confidence * 100).toFixed(1)}%`);
      console.log(`   Reasoning: ${resolution.reasoning}`);

      // Check confidence threshold
      if (resolution.confidence >= CONFIDENCE_THRESHOLD) {
        console.log(`\n✅ Confidence above threshold (${CONFIDENCE_THRESHOLD}), submitting resolution...`);
        await this.submitResolution(marketId, resolution);
        this.processedMarkets.add(marketId);
      } else {
        console.log(`\n⚠️  Confidence below threshold (${CONFIDENCE_THRESHOLD}), marking for manual review...`);
        // In production, you'd trigger a manual review process
      }

      console.log("=".repeat(60) + "\n");

    } catch (error) {
      console.error(`❌ Error processing market #${marketId}:`, error.message);
    }
  }

  /**
   * Fetch external data based on market category
   */
  async fetchExternalData(market) {
    const data = {
      timestamp: Date.now(),
      sources: []
    };

    try {
      if (market.category.toLowerCase().includes("price") || 
          market.category.toLowerCase().includes("crypto")) {
        // Fetch crypto prices
        const btcPrice = await this.fetchCryptoPrice("bitcoin");
        const ethPrice = await this.fetchCryptoPrice("ethereum");
        
        data.sources.push({
          type: "price_data",
          bitcoin: btcPrice,
          ethereum: ethPrice
        });
      }

      // Add more data sources based on category
      if (market.category.toLowerCase().includes("defi")) {
        data.sources.push({
          type: "tvl_data",
          note: "Would fetch from DeFiLlama API in production"
        });
      }

    } catch (error) {
      console.log("⚠️  Error fetching external data:", error.message);
    }

    return data;
  }

  /**
   * Fetch crypto price from CoinGecko
   */
  async fetchCryptoPrice(coinId) {
    try {
      const response = await axios.get(
        `${process.env.COINGECKO_API || 'https://api.coingecko.com/api/v3'}/simple/price`,
        {
          params: {
            ids: coinId,
            vs_currencies: 'usd'
          }
        }
      );
      return response.data[coinId]?.usd || null;
    } catch (error) {
      console.log(`Error fetching ${coinId} price:`, error.message);
      return null;
    }
  }

  /**
   * Build prompt for Gemini
   */
  buildResolutionPrompt(market, externalData) {
    return `You are an oracle resolver for a prediction market. Analyze the following market and provide a resolution.

MARKET DETAILS:
Title: ${market.title}
Description: ${market.description}
Category: ${market.category}
End Time: ${new Date(Number(market.endTime) * 1000).toISOString()}
Current Time: ${new Date().toISOString()}

EXTERNAL DATA:
${JSON.stringify(externalData, null, 2)}

TASK:
1. Determine if the market should resolve to YES or NO
2. Provide a confidence score (0.0 to 1.0)
3. Suggest odds within the range 0.90-0.95 (9000-9500 basis points)
4. Provide clear reasoning

Respond in JSON format:
{
  "outcome": "YES" or "NO" or "UNDECIDED",
  "confidence": 0.0-1.0,
  "suggestedOddsYes": 9000-9500,
  "suggestedOddsNo": 9000-9500,
  "reasoning": "Clear explanation of your decision",
  "evidenceSources": ["list", "of", "sources"]
}`;
  }

  /**
   * Query Gemini for resolution
   */
  async queryGemini(prompt, market) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in Gemini response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Enforce odds constraints
      parsed.suggestedOddsYes = Math.max(MIN_ODDS, Math.min(MAX_ODDS, parsed.suggestedOddsYes));
      parsed.suggestedOddsNo = Math.max(MIN_ODDS, Math.min(MAX_ODDS, parsed.suggestedOddsNo));

      return parsed;

    } catch (error) {
      console.error("Error querying Gemini:", error.message);
      
      // Return a default response
      return {
        outcome: "UNDECIDED",
        confidence: 0.0,
        suggestedOddsYes: 9200,
        suggestedOddsNo: 9200,
        reasoning: "Error querying AI - requires manual review",
        evidenceSources: []
      };
    }
  }

  /**
   * Submit resolution to smart contract
   */
  async submitResolution(marketId, resolution) {
    try {
      // Convert outcome to enum value (0 = Undecided, 1 = Yes, 2 = No)
      let outcomeValue;
      if (resolution.outcome === "YES") {
        outcomeValue = 1;
      } else if (resolution.outcome === "NO") {
        outcomeValue = 2;
      } else {
        outcomeValue = 0;
      }

      // Create evidence hash
      const evidenceData = {
        outcome: resolution.outcome,
        confidence: resolution.confidence,
        reasoning: resolution.reasoning,
        sources: resolution.evidenceSources,
        timestamp: Date.now()
      };
      const evidenceHash = ethers.keccak256(
        ethers.toUtf8Bytes(JSON.stringify(evidenceData))
      );

      console.log("\n📤 Submitting resolution to blockchain...");
      const tx = await oracleMarkets.resolveMarket(
        marketId,
        outcomeValue,
        evidenceHash
      );

      console.log(`⏳ Transaction hash: ${tx.hash}`);
      console.log("⏳ Waiting for confirmation...");

      const receipt = await tx.wait();

      console.log(`✅ Resolution submitted! Block: ${receipt.blockNumber}`);
      console.log(`🔍 Explorer: https://donut.push.network/tx/${tx.hash}`);

    } catch (error) {
      console.error("❌ Error submitting resolution:", error.message);
      throw error;
    }
  }

  /**
   * Stop the resolver
   */
  stop() {
    console.log("\n⏹️  Stopping oracle resolver...");
    this.isListening = false;
    oracleMarkets.removeAllListeners();
    console.log("✅ Oracle resolver stopped");
  }
}

// Start the resolver
const resolver = new OracleResolver();

// Handle graceful shutdown
process.on("SIGINT", () => {
  resolver.stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  resolver.stop();
  process.exit(0);
});

// Start
resolver.start().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

module.exports = OracleResolver;
