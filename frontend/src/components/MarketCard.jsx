import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TrendingUp, Clock, Users, DollarSign } from 'lucide-react';

const STATE_LABELS = ['Draft', 'Active', 'Ended', 'Resolved', 'Cancelled', 'Refunded'];

export default function MarketCard({ market }) {
  const totalPool = parseFloat(market.totalYesPool) + parseFloat(market.totalNoPool);
  const timeLeft = market.endTime * 1000 - Date.now();
  const isActive = market.state === 1 && timeLeft > 0;
  const isEnded = market.state >= 2;

  const formatTimeLeft = (ms) => {
    if (ms < 0) return 'Ended';
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return 'Ending soon';
  };

  const oddsYesPercent = (market.oddsYes / 100).toFixed(1);
  const oddsNoPercent = (market.oddsNo / 100).toFixed(1);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
    >
      <Link to={`/market/${market.id}`}>
        <div className="glass glass-hover rounded-2xl p-6 h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30">
              {market.category}
            </span>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              isActive ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
              isEnded ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' :
              'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            }`}>
              {STATE_LABELS[market.state]}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {market.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
            {market.description}
          </p>

          {/* Odds Display */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="glass rounded-lg p-3 border border-green-500/30">
              <div className="text-xs text-muted-foreground mb-1">YES Odds</div>
              <div className="text-lg font-bold text-green-400">{oddsYesPercent}%</div>
            </div>
            <div className="glass rounded-lg p-3 border border-red-500/30">
              <div className="text-xs text-muted-foreground mb-1">NO Odds</div>
              <div className="text-lg font-bold text-red-400">{oddsNoPercent}%</div>
            </div>
          </div>

          {/* Pool & Stats */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Total Pool</span>
              </div>
              <span className="font-semibold">{totalPool.toFixed(4)} PC</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Time Left</span>
              </div>
              <span className="font-semibold">{formatTimeLeft(timeLeft)}</span>
            </div>
          </div>

          {/* Pool Distribution Bar */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>YES: {market.totalYesPool} PC</span>
              <span>NO: {market.totalNoPool} PC</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden glass">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all"
                style={{ 
                  width: totalPool > 0 
                    ? `${(parseFloat(market.totalYesPool) / totalPool) * 100}%` 
                    : '50%' 
                }}
              />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
