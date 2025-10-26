import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePushWalletContext, usePushChainClient } from '@pushchain/ui-kit';
import { TrendingUp, Trophy, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { CONTRACTS } from '../config/contracts';
import OracleMarketsABI from '../../../contracts/artifacts/contracts/OracleMarkets.sol/OracleMarkets.json';

export default function Dashboard() {
  const { account, isConnected } = usePushWalletContext();
  const { pushChainClient } = usePushChainClient();
  const [myBets, setMyBets] = useState([]);
  const [myMarkets, setMyMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [stats, setStats] = useState({
    totalBets: 0,
    activeBets: 0,
    wonBets: 0,
    totalWagered: '0',
    totalWon: '0',
  });

  useEffect(() => {
    if (isConnected && account) {
      loadDashboard();
    }
  }, [isConnected, account]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      
      const provider = new ethers.JsonRpcProvider('https://evm.rpc-testnet-donut-node1.push.org');
      const contract = new ethers.Contract(CONTRACTS.ORACLE_MARKETS, OracleMarketsABI.abi, provider);

      // Load user's bets
      const betIds = await contract.getUserBets(account.address);
      const betsList = [];
      let totalWagered = 0;
      let wonCount = 0;
      let activeCount = 0;

      for (const betId of betIds) {
        const bet = await contract.getBet(betId);
        const market = await contract.getMarket(bet.marketId);
        
        const betData = {
          id: Number(betId),
          marketId: Number(bet.marketId),
          marketTitle: market.title,
          outcome: Number(bet.outcome),
          amount: ethers.formatEther(bet.amount),
          timestamp: Number(bet.timestamp),
          claimed: bet.claimed,
          marketState: Number(market.state),
          marketResolution: Number(market.resolution),
        };

        betsList.push(betData);
        totalWagered += parseFloat(betData.amount);

        if (betData.marketState === 1) activeCount++;
        if (betData.marketState === 3 && 
            ((betData.outcome === 0 && betData.marketResolution === 1) ||
             (betData.outcome === 1 && betData.marketResolution === 2))) {
          wonCount++;
        }
      }

      setMyBets(betsList);
      setStats({
        totalBets: betsList.length,
        activeBets: activeCount,
        wonBets: wonCount,
        totalWagered: totalWagered.toFixed(4),
        totalWon: '0', // Would calculate from actual payouts
      });

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimPayout = async (betId) => {
    try {
      setSuccessMessage('');
      setErrorMessage('');
      
      const iface = new ethers.Interface(OracleMarketsABI.abi);
      const data = iface.encodeFunctionData('claimPayout', [betId]);

      const txResponse = await pushChainClient.universal.sendTransaction({
        to: CONTRACTS.ORACLE_MARKETS,
        value: BigInt(0),
        data: data,
      });

      await txResponse.wait();
      loadDashboard();
      setSuccessMessage('Payout claimed successfully!');
      
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error claiming payout:', error);
      setErrorMessage('Failed to claim payout: ' + error.message);
      
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center glass rounded-2xl p-12">
          <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-muted-foreground">
            Connect your wallet to view your dashboard and track your bets.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Dashboard</h1>
          <p className="text-muted-foreground">
            Track your bets and claim your winnings
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-green-500/20 border border-green-500/50 flex items-center gap-3"
          >
            <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
            <div className="text-sm text-green-400">{successMessage}</div>
          </motion.div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/50 flex items-center gap-3"
          >
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <div className="text-sm text-red-400">{errorMessage}</div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">Total Bets</span>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="text-3xl font-bold">{stats.totalBets}</div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">Active Bets</span>
              <Clock className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="text-3xl font-bold">{stats.activeBets}</div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">Won Bets</span>
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold">{stats.wonBets}</div>
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">Total Wagered</span>
              <Trophy className="h-5 w-5 text-secondary" />
            </div>
            <div className="text-3xl font-bold">{stats.totalWagered} PC</div>
          </div>
        </div>

        {/* My Bets */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-6">My Bets</h2>
          
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="glass rounded-xl p-4 h-24 shimmer" />
              ))}
            </div>
          ) : myBets.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No bets yet</h3>
              <p className="text-muted-foreground mb-4">
                Start betting on markets to see them here
              </p>
              <Link
                to="/"
                className="inline-block px-6 py-3 rounded-xl gradient-primary font-semibold text-white"
              >
                Explore Markets
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myBets.map((bet) => {
                const isWon = bet.marketState === 3 && 
                  ((bet.outcome === 0 && bet.marketResolution === 1) ||
                   (bet.outcome === 1 && bet.marketResolution === 2));
                const canClaim = isWon && !bet.claimed;

                return (
                  <div key={bet.id} className="glass rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Link to={`/market/${bet.marketId}`} className="hover:text-primary transition-colors">
                          <h3 className="font-semibold mb-2">{bet.marketTitle}</h3>
                        </Link>
                        <div className="flex items-center gap-4 text-sm">
                          <span className={`px-3 py-1 rounded-full ${
                            bet.outcome === 0 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {bet.outcome === 0 ? 'YES' : 'NO'}
                          </span>
                          <span className="text-muted-foreground">
                            {bet.amount} PC
                          </span>
                          <span className="text-muted-foreground">
                            {new Date(bet.timestamp * 1000).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {bet.marketState === 3 && (
                          <div className={`px-3 py-1 rounded-full text-sm ${
                            isWon 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {isWon ? 'Won' : 'Lost'}
                          </div>
                        )}

                        {canClaim && (
                          <button
                            onClick={() => claimPayout(bet.id)}
                            className="px-4 py-2 rounded-lg gradient-primary font-semibold text-white shadow-lg shadow-primary/50 hover:shadow-primary/70 transition-all"
                          >
                            Claim Payout
                          </button>
                        )}

                        {bet.claimed && (
                          <div className="px-3 py-1 rounded-full text-sm bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            Claimed
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
