import { PushChain } from '@pushchain/core';
import { ethers } from 'ethers';

/**
 * Initialize PushChain client with universal signer
 */
export async function initializePushChain(wallet) {
  try {
    const universalSigner = await PushChain.utils.signer.toUniversal(wallet);
    
    const pushChainClient = await PushChain.initialize(universalSigner, {
      network: PushChain.CONSTANTS.PUSH_NETWORK.TESTNET,
    });

    return pushChainClient;
  } catch (error) {
    console.error('Error initializing PushChain:', error);
    throw error;
  }
}

/**
 * Get chain info from namespace
 */
export function getChainInfo(namespace) {
  const chains = {
    'eip155:42101': { name: 'PushChain', symbol: 'PC', icon: '⚡' },
    'eip155:11155111': { name: 'Ethereum Sepolia', symbol: 'ETH', icon: '🔷' },
    'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1': { name: 'Solana Devnet', symbol: 'SOL', icon: '◎' },
    'eip155:97': { name: 'BNB Testnet', symbol: 'BNB', icon: '🟡' },
  };

  return chains[namespace] || { name: 'Unknown', symbol: '?', icon: '❓' };
}

/**
 * Format timestamp to readable string
 */
export function formatTimestamp(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate time remaining
 */
export function getTimeRemaining(endTime) {
  const now = Date.now();
  const end = endTime * 1000;
  const diff = end - now;

  if (diff < 0) return { ended: true, display: 'Ended' };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return { ended: false, display: `${days}d ${hours}h` };
  if (hours > 0) return { ended: false, display: `${hours}h ${minutes}m` };
  return { ended: false, display: `${minutes}m` };
}

/**
 * Format odds from basis points to percentage
 */
export function formatOdds(basisPoints) {
  return (basisPoints / 100).toFixed(1) + '%';
}

/**
 * Truncate address
 */
export function truncateAddress(address, chars = 4) {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Calculate potential payout
 */
export function calculatePayout(betAmount, odds, totalPool, winningPool, creatorFee = 100, platformFee = 200) {
  if (!betAmount || !totalPool || !winningPool) return 0;

  const bet = parseFloat(betAmount);
  const total = parseFloat(totalPool);
  const winning = parseFloat(winningPool);

  if (winning === 0) return 0;

  // Gross payout = (betAmount / winningPool) * totalPool
  const grossPayout = (bet / winning) * total;

  // Deduct fees (basis points)
  const fees = (grossPayout * (creatorFee + platformFee)) / 10000;
  const netPayout = grossPayout - fees;

  return netPayout;
}

/**
 * Get market state label
 */
export function getMarketStateLabel(state) {
  const labels = ['Draft', 'Active', 'Ended', 'Resolved', 'Cancelled', 'Refunded'];
  return labels[state] || 'Unknown';
}

/**
 * Get resolution label
 */
export function getResolutionLabel(resolution) {
  const labels = ['Undecided', 'YES', 'NO'];
  return labels[resolution] || 'Unknown';
}

/**
 * Check if bet won
 */
export function didBetWin(betOutcome, marketResolution) {
  // betOutcome: 0 = YES, 1 = NO
  // marketResolution: 0 = Undecided, 1 = YES, 2 = NO
  if (marketResolution === 0) return false;
  return (betOutcome === 0 && marketResolution === 1) || (betOutcome === 1 && marketResolution === 2);
}

/**
 * Share market to social media
 */
export function shareMarket(market, platform = 'twitter') {
  const text = `Check out this prediction market: ${market.title}`;
  const url = window.location.href;

  if (platform === 'twitter') {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank');
  }
}

/**
 * Copy to clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
}

/**
 * Format large numbers
 */
export function formatNumber(num) {
  const n = parseFloat(num);
  if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(2) + 'K';
  return n.toFixed(4);
}
