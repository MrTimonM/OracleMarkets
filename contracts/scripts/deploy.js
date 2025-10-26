const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying OracleMarkets to PushChain Donut Testnet...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📍 Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "PC\n");

  // Deploy OracleMarkets
  console.log("📦 Deploying OracleMarkets contract...");
  const OracleMarkets = await ethers.getContractFactory("OracleMarkets");
  const oracleMarkets = await OracleMarkets.deploy();
  await oracleMarkets.waitForDeployment();
  const oracleMarketsAddress = await oracleMarkets.getAddress();
  console.log("✅ OracleMarkets deployed to:", oracleMarketsAddress);

  // Deploy MarketFactory
  console.log("\n📦 Deploying MarketFactory contract...");
  const MarketFactory = await ethers.getContractFactory("MarketFactory");
  const marketFactory = await MarketFactory.deploy(oracleMarketsAddress);
  await marketFactory.waitForDeployment();
  const marketFactoryAddress = await marketFactory.getAddress();
  console.log("✅ MarketFactory deployed to:", marketFactoryAddress);

  // Deploy MarketTokenVault (using zero address as placeholder for universal token)
  console.log("\n📦 Deploying MarketTokenVault contract...");
  const MarketTokenVault = await ethers.getContractFactory("MarketTokenVault");
  const marketTokenVault = await MarketTokenVault.deploy(ethers.ZeroAddress);
  await marketTokenVault.waitForDeployment();
  const marketTokenVaultAddress = await marketTokenVault.getAddress();
  console.log("✅ MarketTokenVault deployed to:", marketTokenVaultAddress);

  // Deploy NFTBadge
  console.log("\n📦 Deploying NFTBadge contract...");
  const NFTBadge = await ethers.getContractFactory("NFTBadge");
  const nftBadge = await NFTBadge.deploy();
  await nftBadge.waitForDeployment();
  const nftBadgeAddress = await nftBadge.getAddress();
  console.log("✅ NFTBadge deployed to:", nftBadgeAddress);

  // Save deployment addresses
  const deploymentInfo = {
    network: "PushChain Donut Testnet",
    chainId: 42101,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      OracleMarkets: oracleMarketsAddress,
      MarketFactory: marketFactoryAddress,
      MarketTokenVault: marketTokenVaultAddress,
      NFTBadge: nftBadgeAddress,
    },
    explorer: {
      OracleMarkets: `https://donut.push.network/address/${oracleMarketsAddress}`,
      MarketFactory: `https://donut.push.network/address/${marketFactoryAddress}`,
      MarketTokenVault: `https://donut.push.network/address/${marketTokenVaultAddress}`,
      NFTBadge: `https://donut.push.network/address/${nftBadgeAddress}`,
    }
  };

  console.log("\n" + "=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("=".repeat(60));

  // Save to file
  const fs = require("fs");
  const path = require("path");
  const deploymentsDir = path.join(__dirname, "../deployments");
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(deploymentsDir, "pushchain-donut.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\n✅ Deployment info saved to deployments/pushchain-donut.json");
  
  // Create sample markets
  console.log("\n🎯 Creating sample markets...");
  
  try {
    // Market 1: BTC vs ETH price race
    const tx1 = await oracleMarkets.createMarket(
      "Will Bitcoin hit $100K before Ethereum hits $10K?",
      "Price oracle market tracking BTC and ETH milestones. Resolves YES if BTC reaches $100,000 before ETH reaches $10,000, NO otherwise.",
      "Crypto Price",
      Math.floor(Date.now() / 1000) + 180 * 24 * 60 * 60, // 6 months
      9200, // 0.92 odds for YES
      9300  // 0.93 odds for NO
    );
    await tx1.wait();
    console.log("✅ Market 1 created: BTC vs ETH Price Race");

    // Market 2: Cross-chain TVL
    const tx2 = await oracleMarkets.createMarket(
      "Will Base protocol X have more TVL than Solana protocol Y by Dec 31, 2025?",
      "Cross-chain TVL comparison between Base and Solana DeFi protocols.",
      "DeFi",
      Math.floor(new Date("2025-12-31").getTime() / 1000),
      9100,
      9400
    );
    await tx2.wait();
    console.log("✅ Market 2 created: Cross-chain TVL Comparison");

    // Market 3: Election
    const tx3 = await oracleMarkets.createMarket(
      "Will Candidate X win Election Y?",
      "Real-world political event oracle aggregation.",
      "Politics",
      Math.floor(new Date("2026-03-15").getTime() / 1000),
      9000,
      9500
    );
    await tx3.wait();
    console.log("✅ Market 3 created: Election Prediction");

    // Market 4: Token Listing
    const tx4 = await oracleMarkets.createMarket(
      "Will Token XYZ be listed on Binance by March 2026?",
      "Token listing prediction using on-chain verification and news aggregation.",
      "Crypto Listing",
      Math.floor(new Date("2026-03-01").getTime() / 1000),
      9250,
      9250
    );
    await tx4.wait();
    console.log("✅ Market 4 created: Token Listing Prediction");

    // Market 5: AI-Suggested
    const tx5 = await oracleMarkets.createMarket(
      "Will Ethereum's next upgrade be delayed past Q2 2026?",
      "AI-suggested market based on trending blockchain development news.",
      "Blockchain Tech",
      Math.floor(new Date("2026-06-30").getTime() / 1000),
      9150,
      9350
    );
    await tx5.wait();
    console.log("✅ Market 5 created: AI-Suggested ETH Upgrade Market");

    console.log("\n🎉 All sample markets created successfully!");

  } catch (error) {
    console.error("\n❌ Error creating sample markets:", error.message);
  }

  console.log("\n✨ Deployment complete!");
  console.log("\n🔗 Next steps:");
  console.log("1. Update frontend/src/config/contracts.js with deployed addresses");
  console.log("2. Update backend/.env with contract addresses");
  console.log("3. Run: cd backend && npm install && npm run dev");
  console.log("4. Run: cd frontend && npm install && npm run dev");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
