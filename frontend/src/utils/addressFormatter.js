/**
 * Format address based on chain type
 * For Solana, show different format
 * For EVM chains, show 0x format
 */
export function formatAddress(address, chainNamespace) {
  if (!address) return 'Unknown';
  
  // Check if it's a Solana chain
  if (chainNamespace?.startsWith('solana:')) {
    // For Solana UEA addresses, show as base58-style format
    // Since PushChain uses UEA, the address is actually the same across chains
    // but we can format it differently for better UX
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }
  
  // For EVM chains (Ethereum, BNB, PushChain)
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Get chain info from namespace
 */
export function getChainInfo(chainNamespace) {
  if (!chainNamespace) return null;
  
  if (chainNamespace.startsWith('solana:')) {
    return { type: 'solana', name: 'Solana' };
  } else if (chainNamespace.startsWith('eip155:')) {
    const chainId = chainNamespace.split(':')[1];
    const chainMap = {
      '1': 'Ethereum',
      '11155111': 'Sepolia',
      '56': 'BNB Chain',
      '97': 'BNB Testnet',
      '42101': 'PushChain',
    };
    return { type: 'evm', name: chainMap[chainId] || 'EVM Chain' };
  }
  
  return { type: 'unknown', name: 'Unknown' };
}

/**
 * Get wallet type label
 */
export function getWalletLabel(chainNamespace) {
  const info = getChainInfo(chainNamespace);
  if (!info) return 'Wallet';
  
  switch (info.type) {
    case 'solana':
      return 'Solana Wallet';
    case 'evm':
      return 'UEA';
    default:
      return 'Wallet';
  }
}
