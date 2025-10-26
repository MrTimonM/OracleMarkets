import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePushWalletContext, usePushChainClient } from '@pushchain/ui-kit';
import { Plus, TrendingUp, Clock, Filter, Search, Sparkles } from 'lucide-react';
import MarketCard from './MarketCard';
import CreateMarketModal from './CreateMarketModal';
import { CONTRACTS, CATEGORIES } from '../config/contracts';
import { ethers } from 'ethers';
import OracleMarketsABI from '../../../contracts/artifacts/contracts/OracleMarkets.sol/OracleMarkets.json';

export default function LandingPage() {
  const { pushChainClient, isInitialized } = usePushChainClient();
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('trending');

  useEffect(() => {
    loadMarkets();
  }, []);

  const loadMarkets = async () => {
    try {
      setLoading(true);
      
      // Create provider
      const provider = new ethers.JsonRpcProvider('https://evm.rpc-testnet-donut-node1.push.org');
      const contract = new ethers.Contract(
        CONTRACTS.ORACLE_MARKETS,
        OracleMarketsABI.abi,
        provider
      );

      const marketsList = [];
      
      // Fetch markets (1-100)
      for (let i = 1; i <= 100; i++) {
        try {
          const market = await contract.getMarket(i);
          marketsList.push({
            id: Number(market.id),
            creator: market.creator,
            title: market.title,
            description: market.description,
            category: market.category,
            endTime: Number(market.endTime),
            createdAt: Number(market.createdAt),
            state: Number(market.state),
            resolution: Number(market.resolution),
            oddsYes: Number(market.oddsYes),
            oddsNo: Number(market.oddsNo),
            totalYesPool: ethers.formatEther(market.totalYesPool),
            totalNoPool: ethers.formatEther(market.totalNoPool),
          });
        } catch (error) {
          // Market doesn't exist, stop
          break;
        }
      }

      setMarkets(marketsList);
    } catch (error) {
      console.error('Error loading markets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMarkets = markets
    .filter(m => selectedCategory === 'All' || m.category === selectedCategory)
    .filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                 m.description.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'trending') {
        const poolA = parseFloat(a.totalYesPool) + parseFloat(a.totalNoPool);
        const poolB = parseFloat(b.totalYesPool) + parseFloat(b.totalNoPool);
        return poolB - poolA;
      } else if (sortBy === 'endingSoon') {
        return a.endTime - b.endTime;
      } else if (sortBy === 'newest') {
        return b.createdAt - a.createdAt;
      }
      return 0;
    });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <motion.div 
          className="container mx-auto relative z-10 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="inline-block mb-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="inline-flex items-center px-4 py-2 rounded-full glass border border-primary/30 text-sm">
              <Sparkles className="h-4 w-4 mr-2 text-primary" />
              Bet from Any Chain • AI-Powered Odds
            </span>
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Universal Prediction
            </span>
            <br />
            <span className="text-foreground">Markets</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Bet on anything from any chain. Solana, Ethereum, BNB, and more.
            <br />
            Powered by PushChain's Universal Accounts.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isInitialized ? (
              <motion.button
                onClick={() => setShowCreateModal(true)}
                className="px-8 py-4 rounded-xl gradient-primary font-semibold text-white shadow-lg shadow-primary/50 hover:shadow-primary/70 transition-all flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="h-5 w-5" />
                Create Market
              </motion.button>
            ) : (
              <div className="px-8 py-4 rounded-xl glass border border-primary/30">
                <p className="text-sm text-muted-foreground">Connect wallet to create markets</p>
              </div>
            )}
            
            <motion.button
              onClick={() => document.getElementById('markets').scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 rounded-xl glass glass-hover border border-white/10 font-semibold flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <TrendingUp className="h-5 w-5" />
              Explore Markets
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* Markets Section */}
      <section id="markets" className="py-16 px-4">
        <div className="container mx-auto">
          {/* Filters & Search */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search markets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl glass border border-white/10 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              {/* Sort */}
              <div className="flex items-center gap-4">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 rounded-xl glass border border-white/10 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <option value="trending">🔥 Trending</option>
                  <option value="endingSoon">⏰ Ending Soon</option>
                  <option value="newest">✨ Newest</option>
                </select>
              </div>
            </div>

            {/* Categories */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <Filter className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              {['All', ...CATEGORIES].map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    selectedCategory === category
                      ? 'bg-primary text-white'
                      : 'glass glass-hover'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Markets Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="glass rounded-2xl p-6 h-80 shimmer" />
              ))}
            </div>
          ) : filteredMarkets.length === 0 ? (
            <div className="text-center py-20">
              <div className="glass rounded-2xl p-12 max-w-md mx-auto">
                <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No markets found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || selectedCategory !== 'All'
                    ? 'Try adjusting your filters'
                    : 'Be the first to create a market!'}
                </p>
              </div>
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.1
                  }
                }
              }}
            >
              {filteredMarkets.map((market) => (
                <MarketCard key={market.id} market={market} />
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Create Market Modal */}
      {showCreateModal && (
        <CreateMarketModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadMarkets();
          }}
        />
      )}
    </div>
  );
}
