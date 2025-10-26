import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePushWalletContext } from '@pushchain/ui-kit';
import { Clock, TrendingUp, Users, DollarSign, Share2, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import BetModal from './BetModal';
import { CONTRACTS, SUPPORTED_CHAINS } from '../config/contracts';
import { ethers } from 'ethers';
import OracleMarketsABI from '../../../contracts/artifacts/contracts/OracleMarkets.sol/OracleMarkets.json';

const STATE_LABELS = ['Draft', 'Active', 'Ended', 'Resolved', 'Cancelled', 'Refunded'];
const RESOLUTION_LABELS = ['Undecided', 'YES', 'NO'];

export default function MarketPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isConnected, account } = usePushWalletContext();
  const [market, setMarket] = useState(null);
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBetModal, setShowBetModal] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState(null);
  const [shareMessage, setShareMessage] = useState('');

  useEffect(() => {
    loadMarket();
    loadBets();
  }, [id]);

  const loadMarket = async () => {
    try {
      const provider = new ethers.JsonRpcProvider('https://evm.rpc-testnet-donut-node1.push.org');
      const contract = new ethers.Contract(CONTRACTS.ORACLE_MARKETS, OracleMarketsABI.abi, provider);
      
      const marketData = await contract.getMarket(id);
      
      setMarket({
        id: Number(marketData.id),
        creator: marketData.creator,
        title: marketData.title,
        description: marketData.description,
        category: marketData.category,
        endTime: Number(marketData.endTime),
        createdAt: Number(marketData.createdAt),
        state: Number(marketData.state),
        resolution: Number(marketData.resolution),
        oddsYes: Number(marketData.oddsYes),
        oddsNo: Number(marketData.oddsNo),
        totalYesPool: ethers.formatEther(marketData.totalYesPool),
        totalNoPool: ethers.formatEther(marketData.totalNoPool),
      });
    } catch (error) {
      console.error('Error loading market:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBets = async () => {
    try {
      const provider = new ethers.JsonRpcProvider('https://evm.rpc-testnet-donut-node1.push.org');
      const contract = new ethers.Contract(CONTRACTS.ORACLE_MARKETS, OracleMarketsABI.abi, provider);
      
      const betIds = await contract.getMarketBets(id);
      const betsList = [];
      
      for (const betId of betIds) {
        const bet = await contract.getBet(betId);
        betsList.push({
          id: Number(betId),
          bettor: bet.bettor,
          outcome: Number(bet.outcome),
          amount: ethers.formatEther(bet.amount),
          timestamp: Number(bet.timestamp),
          originChain: bet.originChain,
          claimed: bet.claimed,
        });
      }
      
      setBets(betsList);
    } catch (error) {
      console.error('Error loading bets:', error);
    }
  };

  const handleBet = (outcome) => {
    // No need to check here - BetModal will handle wallet state
    setSelectedOutcome(outcome);
    setShowBetModal(true);
  };

  const shareMarket = () => {
    const text = `Check out this prediction market: ${market.title}`;
    const url = window.location.href;
    
    if (navigator.share) {
      navigator.share({ title: market.title, text, url });
    } else {
      navigator.clipboard.writeText(url);
      setShareMessage('Link copied to clipboard!');
      
      setTimeout(() => setShareMessage(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="glass rounded-2xl p-8 h-96 shimmer" />
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Market not found</h2>
          <p className="text-muted-foreground">This market doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const totalPool = parseFloat(market.totalYesPool) + parseFloat(market.totalNoPool);
  const timeLeft = market.endTime * 1000 - Date.now();
  const isActive = market.state === 1 && timeLeft > 0;
  const isResolved = market.state === 3;

  return (
    <div className="container mx-auto px-4 py-16">
      <motion.div 
        className="max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 px-4 py-2 rounded-xl glass-hover transition-all group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Markets</span>
        </button>

        {/* Share Message */}
        {shareMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-green-500/20 border border-green-500/50 flex items-center gap-3"
          >
            <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
            <div className="text-sm text-green-400">{shareMessage}</div>
          </motion.div>
        )}

        {/* Header */}
        <div className="glass rounded-2xl p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="px-4 py-2 rounded-full text-sm font-medium bg-primary/20 text-primary border border-primary/30">
                {market.category}
              </span>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                isActive ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                isResolved ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                'bg-gray-500/20 text-gray-400 border border-gray-500/30'
              }`}>
                {STATE_LABELS[market.state]}
              </span>
            </div>
            <button
              onClick={shareMarket}
              className="p-2 rounded-lg glass-hover transition-colors"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>

          <h1 className="text-3xl font-bold mb-4">{market.title}</h1>
          <p className="text-muted-foreground mb-6">{market.description}</p>

          {/* Resolution Badge */}
          {isResolved && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${
              market.resolution === 1 ? 'bg-green-500/20 border border-green-500/30' :
              market.resolution === 2 ? 'bg-red-500/20 border border-red-500/30' :
              'bg-gray-500/20 border border-gray-500/30'
            }`}>
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">
                Resolved: {RESOLUTION_LABELS[market.resolution]}
              </span>
            </div>
          )}
        </div>

        {/* Betting Interface */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* YES Bet */}
          <motion.button
            onClick={() => handleBet(0)}
            disabled={!isActive}
            className={`glass rounded-2xl p-6 border-2 transition-all ${
              isActive 
                ? 'border-green-500/50 hover:border-green-500 hover:bg-green-500/10' 
                : 'border-white/10 opacity-50 cursor-not-allowed'
            }`}
            whileHover={isActive ? { scale: 1.02 } : {}}
            whileTap={isActive ? { scale: 0.98 } : {}}
          >
            <div className="text-center">
              <div className="text-5xl font-bold text-green-400 mb-2">YES</div>
              <div className="text-sm text-muted-foreground mb-4">
                Odds: {(market.oddsYes / 100).toFixed(1)}%
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pool:</span>
                  <span className="font-semibold">{market.totalYesPool} PC</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden glass">
                  <div 
                    className="h-full bg-green-500"
                    style={{ width: totalPool > 0 ? `${(parseFloat(market.totalYesPool) / totalPool) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            </div>
          </motion.button>

          {/* NO Bet */}
          <motion.button
            onClick={() => handleBet(1)}
            disabled={!isActive}
            className={`glass rounded-2xl p-6 border-2 transition-all ${
              isActive 
                ? 'border-red-500/50 hover:border-red-500 hover:bg-red-500/10' 
                : 'border-white/10 opacity-50 cursor-not-allowed'
            }`}
            whileHover={isActive ? { scale: 1.02 } : {}}
            whileTap={isActive ? { scale: 0.98 } : {}}
          >
            <div className="text-center">
              <div className="text-5xl font-bold text-red-400 mb-2">NO</div>
              <div className="text-sm text-muted-foreground mb-4">
                Odds: {(market.oddsNo / 100).toFixed(1)}%
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pool:</span>
                  <span className="font-semibold">{market.totalNoPool} PC</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden glass">
                  <div 
                    className="h-full bg-red-500"
                    style={{ width: totalPool > 0 ? `${(parseFloat(market.totalNoPool) / totalPool) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            </div>
          </motion.button>
        </div>

        {/* Market Stats */}
        <div className="glass rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Market Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Total Pool</div>
              <div className="text-2xl font-bold">{totalPool.toFixed(4)} PC</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Total Bets</div>
              <div className="text-2xl font-bold">{bets.length}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">End Time</div>
              <div className="text-sm font-semibold">
                {new Date(market.endTime * 1000).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Created</div>
              <div className="text-sm font-semibold">
                {new Date(market.createdAt * 1000).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Bets */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Recent Bets ({bets.length})</h2>
            <div className="text-xs text-muted-foreground bg-primary/10 px-3 py-1 rounded-full border border-primary/30">
              UEA = Universal Executor Account
            </div>
          </div>
          <div className="space-y-3">
            {bets.slice(0, 10).map((bet) => {
              const chain = SUPPORTED_CHAINS.find(c => c.namespace === bet.originChain);
              return (
                <div key={bet.id} className="glass rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      bet.outcome === 0 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {bet.outcome === 0 ? 'YES' : 'NO'}
                    </div>
                    <div>
                      <div className="font-mono text-sm">{bet.bettor.slice(0, 6)}...{bet.bettor.slice(-4)}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(bet.timestamp * 1000).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <div className="font-bold">{bet.amount} PC</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                        {chain && chain.logo && (
                          <img src={chain.logo} alt={chain.name} className="w-3 h-3 rounded-full" />
                        )}
                        <span>{chain?.name || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {bets.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No bets placed yet. Be the first!
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Bet Modal */}
      {showBetModal && market && (
        <BetModal
          market={market}
          outcome={selectedOutcome}
          onClose={() => setShowBetModal(false)}
          onSuccess={() => {
            setShowBetModal(false);
            loadMarket();
            loadBets();
          }}
        />
      )}
    </div>
  );
}
