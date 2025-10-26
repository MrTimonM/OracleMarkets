# OracleMarkets - Universal Cross-Chain Prediction Market

**The Dark Horse**: A production-ready, beautiful prediction market platform where anyone can create markets and bet using tokens from **any supported chain** (Solana, Ethereum, BNB, Polygon, etc.), powered by PushChain's Universal Accounts.

## 🌟 Features

### Core Functionality
- ✅ **Universal Cross-Chain Betting**: Bet from Ethereum, Solana, BNB Chain, or any supported network
- 🤖 **AI-Powered Odds**: Gemini 2.0 Flash generates intelligent odds (0.90-0.95 range)
- 🔮 **Hybrid LLM+Oracle Resolution**: Automated market resolution with confidence scoring
- 💎 **NFT Achievement Badges**: Earn exclusive NFTs for top predictions
- ⚡ **PushChain Integration**: Universal Accounts, Fee Abstraction, Multicall, Notifications
- 🎨 **Beautiful Glassmorphic UI**: Dark mode, Framer Motion animations, shadcn/ui components

### Technical Highlights
- **No MetaMask Required**: Uses Push Wallet Kit exclusively
- **Token Return Guarantee**: Withdraw payouts back to your origin chain
- **Gas-Efficient**: Multicall batching for complex operations
- **Fair Odds**: LLM-enforced odds in 0.90-0.95 range
- **Transparent Resolution**: Evidence hashes stored on-chain

---

## 🏗️ Architecture

```
OracleMarkets/
├── contracts/              # Solidity smart contracts
│   ├── OracleMarkets.sol   # Main prediction market logic
│   ├── MarketFactory.sol   # Market deployment & indexing
│   ├── MarketTokenVault.sol # Cross-chain token management
│   └── NFTBadge.sol        # Achievement NFT system
├── frontend/               # React + Tailwind + Push UI Kit
│   ├── components/         # Beautiful glassmorphic components
│   └── config/             # Contract addresses & chain configs
├── backend/                # Oracle resolver with Gemini AI
│   ├── oracle-resolver/    # Event listener & LLM integration
│   └── api/                # Optional REST API for caching
└── deployments/            # Deployment artifacts
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- npm or yarn
- Gemini API key (for oracle resolver)

### 1. Clone & Install

```bash
git clone https://github.com/MrTimonM/OracleMarkets.git
cd OracleMarkets
npm run install:all
```

### 2. Set Up Environment Variables

**Backend**:
```bash
cd backend
cp .env.example .env
# Edit .env and add your keys
```

**Frontend**:
```bash
cd frontend
cp .env.example .env
# Contract addresses will be auto-updated after deployment
```

### 3. Deploy Contracts to PushChain Donut Testnet

```bash
cd contracts
npm install
npm run deploy
```

**✅ Contracts will be deployed to:**
- **Network**: PushChain Donut Testnet
- **Chain ID**: 42101
- **RPC**: https://evm.rpc-testnet-donut-node1.push.org
- **Explorer**: https://donut.push.network

The deployment script will:
1. Deploy all 4 contracts (OracleMarkets, MarketFactory, MarketTokenVault, NFTBadge)
2. Create 5 sample markets
3. Save addresses to `deployments/pushchain-donut.json`
4. Auto-update `.env` files in backend and frontend

### 4. Start Backend Oracle Resolver

```bash
cd backend
npm install
npm run dev
```

The resolver will:
- Listen for `MarketEnded` events
- Query Gemini AI for resolution
- Submit results on-chain when confidence ≥ 0.7

### 5. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

---

## 📖 User Workflow

### Creating a Market
1. Connect wallet via **Push Universal Wallet**
2. Click "Create Market"
3. Fill in title, description, category, end date
4. Generate AI-suggested odds (or set manually in 0.90-0.95 range)
5. Submit transaction
6. Market goes live immediately!

### Placing a Bet
1. Browse active markets
2. Select market and choose YES or NO
3. Enter bet amount
4. **Choose origin chain** (Ethereum, Solana, BNB, etc.)
5. PushChain handles cross-chain execution
6. Bet is recorded on-chain

### Market Resolution
1. Market end time passes
2. Oracle resolver detects `MarketEnded` event
3. Gemini AI analyzes market + external data
4. If confidence ≥ 70%, auto-resolves
5. Winners can claim payouts

### Claiming Payouts
1. Go to Dashboard
2. See all your bets
3. Click "Claim Payout" on winning bets
4. Funds returned to origin chain!

---

## 🎯 Demo Markets (Pre-Created)

1. **BTC vs ETH Price Race**
   - "Will Bitcoin hit $100K before Ethereum hits $10K?"
   - Category: Crypto Price
   - Duration: 6 months

2. **Cross-Chain TVL Battle**
   - "Will Base protocol X have more TVL than Solana protocol Y?"
   - Category: DeFi
   - End: Dec 31, 2025

3. **Election Prediction**
   - "Will Candidate X win Election Y?"
   - Category: Politics
   - Real-world oracle aggregation

4. **Token Listing**
   - "Will Token XYZ be listed on Binance by March 2026?"
   - Category: Crypto Listing

5. **AI-Suggested ETH Upgrade**
   - "Will Ethereum's next upgrade be delayed past Q2 2026?"
   - Category: Blockchain Tech
   - Gemini-generated market

---

## 🔗 Cross-Chain Betting Guide

### Supported Chains

| Chain | Namespace | Symbol | Status |
|-------|-----------|--------|--------|
| PushChain Donut | `eip155:42101` | PC | ✅ Active |
| Ethereum Sepolia | `eip155:11155111` | ETH | ✅ Active |
| Solana Devnet | `solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1` | SOL | ✅ Active |
| BNB Chain Testnet | `eip155:97` | BNB | ✅ Active |

### How It Works

1. **Connect with any wallet** (MetaMask, Phantom, etc.) via Push Wallet Kit
2. **Universal Executor Account (UEA)** created on PushChain for you
3. **Sign transaction** on your origin chain
4. **PushChain routes** it through Universal Gateway
5. **Bet recorded** with `originChain` metadata
6. **Payouts** can be withdrawn back to origin chain

**Example**: Bet 0.1 SOL from Phantom wallet on a market. When you win, claim payout and receive SOL back!

---

## 🤖 AI Oracle Integration

### Gemini 2.0 Flash Integration

The oracle resolver uses **Google Gemini 2.0 Flash** for:

#### 1. Initial Odds Generation
- Analyzes market title + description
- Suggests odds within 0.90-0.95 range
- Returns confidence score

#### 2. Market Resolution
- Fetches external data (CoinGecko, Chainlink, etc.)
- Builds comprehensive prompt
- Determines YES/NO/UNDECIDED
- Provides reasoning + evidence sources

#### 3. Confidence Scoring
- Only auto-resolves if confidence ≥ 0.7
- Low confidence → triggers manual review
- Evidence hash stored on-chain

### Example Resolution Prompt

```
MARKET: "Will Bitcoin hit $100K before Ethereum hits $10K?"

EXTERNAL DATA:
- BTC Price: $67,430
- ETH Price: $3,245
- Time remaining: 150 days

TASK: Determine resolution + confidence (0.0-1.0)
```

**Gemini Response**:
```json
{
  "outcome": "UNDECIDED",
  "confidence": 0.45,
  "reasoning": "Neither milestone reached yet. Insufficient time elapsed.",
  "suggestedOddsYes": 9200,
  "suggestedOddsNo": 9300
}
```

---

## 🏆 NFT Badge System

### Badge Types

| Badge | Requirement | Rarity |
|-------|-------------|--------|
| 🏆 **Top Predictor** | Top 3 in a market | Limited Edition |
| ⚡ **Winning Streak** | 5 consecutive wins | Uncommon |
| ⭐ **Market Master** | 10 correct predictions | Rare |
| 🎖️ **Oracle Sage** | 25 correct predictions | Epic |
| 👑 **Prophet Legend** | 50 correct predictions | Legendary |

### IPFS Integration

Badge metadata stored on IPFS via Pinata:
- SVG artwork
- Achievement stats
- Market references
- Timestamp

---

## 🛠️ Development

### Smart Contract Testing

```bash
cd contracts
npm run test
```

### Local Development

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend  
cd frontend
npm run dev
```

### Build for Production

```bash
cd frontend
npm run build
```

---

## 📝 Smart Contract Reference

### OracleMarkets.sol

**Key Functions**:
- `createMarket()` - Create new prediction market
- `placeBet()` - Place cross-chain bet
- `resolveMarket()` - Oracle resolves market (YES/NO)
- `claimPayout()` - Claim winnings
- `cancelMarket()` - Emergency cancel + refunds

**Events**:
- `MarketCreated`
- `BetPlaced`
- `MarketEnded`
- `MarketResolved`
- `PayoutClaimed`

### Market States
0. Draft
1. Active (betting open)
2. Ended (awaiting resolution)
3. Resolved (payouts available)
4. Cancelled (refunds available)
5. Refunded (emergency state)

### Odds Constraints
- **MIN**: 9000 basis points (0.90 = 90%)
- **MAX**: 9500 basis points (0.95 = 95%)
- **Enforced**: Both on creation and resolution

---

## 🔐 Security Features

- ✅ ReentrancyGuard on all fund transfers
- ✅ Pausable contract for emergencies
- ✅ Oracle address access control
- ✅ Pull-over-push payout pattern
- ✅ Evidence hash for resolution transparency
- ✅ Time-window validation for markets
- ✅ Origin chain attribution for fraud prevention

---

## 🌐 Deployment Info

### PushChain Donut Testnet
- **RPC**: https://evm.rpc-testnet-donut-node1.push.org
- **Chain ID**: 42101
- **Explorer**: https://donut.push.network
- **Faucet**: https://faucet.push.org

### Get Test Tokens
1. Visit https://faucet.push.org
2. Connect wallet
3. Request PC tokens
4. Start betting!

---

---

## 🎨 UI/UX Highlights

- **Glassmorphic Design**: Modern blur effects & transparent cards
- **Dark Mode**: Default theme optimized for crypto users
- **Framer Motion**: Smooth micro-interactions & page transitions
- **Responsive**: Mobile-first design
- **Push UI Kit**: Native wallet integration components
- **Real-time Updates**: Live pool updates, countdown timers
- **Chain Indicators**: Visual origin chain badges

---

## 🚀 Future Enhancements

- [ ] DAO governance for dispute resolution
- [ ] Advanced market types (conditional, multi-outcome)
- [ ] Social features (follow predictors, market comments)
- [ ] Push Protocol notifications for market updates
- [ ] Leaderboard & reputation system
- [ ] Mobile app (React Native)
- [ ] L2 support (Arbitrum, Optimism, Base)

---

## 📄 License

MIT License - see LICENSE file

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📞 Support

- **Discord**: [PushChain Community](https://discord.gg/pushchain)
- **Docs**: https://push.org
- **Twitter**: [@PushChain](https://twitter.com/pushchain)

---

## ⚠️ Disclaimer

This is a testnet demo application. Do not use with real funds on mainnet without proper audits and testing.

---

**Built with ❤️ using PushChain's Universal Accounts**

*Bet from anywhere. Win everywhere.* 🌍✨
