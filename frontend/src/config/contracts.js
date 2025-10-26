// Contract addresses (update after deployment)
export const CONTRACTS = {
  ORACLE_MARKETS: import.meta.env.VITE_ORACLE_MARKETS_ADDRESS || '',
  MARKET_FACTORY: import.meta.env.VITE_MARKET_FACTORY_ADDRESS || '',
  MARKET_TOKEN_VAULT: import.meta.env.VITE_MARKET_TOKEN_VAULT_ADDRESS || '',
  NFT_BADGE: import.meta.env.VITE_NFT_BADGE_ADDRESS || '',
};

// PushChain configuration
export const PUSHCHAIN_CONFIG = {
  RPC_URL: 'https://evm.rpc-testnet-donut-node1.push.org',
  CHAIN_ID: 42101,
  CURRENCY_SYMBOL: 'PC',
  EXPLORER_URL: 'https://donut.push.network',
  NETWORK_NAME: 'Push Chain Donut Testnet',
};

// Supported chains for cross-chain betting
export const SUPPORTED_CHAINS = [
  {
    name: 'PushChain',
    namespace: 'eip155:42101',
    symbol: 'PC',
    icon: '⚡',
    logo: '/push.jpg',
  },
  {
    name: 'Ethereum Sepolia',
    namespace: 'eip155:11155111',
    symbol: 'ETH',
    icon: '🔷',
    logo: '/eth.png',
  },
  {
    name: 'Solana Devnet',
    namespace: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
    symbol: 'SOL',
    icon: '◎',
    logo: '/sol.png',
  },
  {
    name: 'BNB Chain',
    namespace: 'eip155:97',
    symbol: 'BNB',
    icon: '🟡',
    logo: '/bnb.png',
  },
];

// Market categories
export const CATEGORIES = [
  'Crypto Price',
  'DeFi',
  'Politics',
  'Crypto Listing',
  'Blockchain Tech',
  'Sports',
  'Entertainment',
  'Other',
];

// Odds constraints
export const ODDS = {
  MIN: 9000, // 0.90
  MAX: 9500, // 0.95
  BASIS_POINTS: 10000,
};
