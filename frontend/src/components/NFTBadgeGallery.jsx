import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePushWalletContext } from '@pushchain/ui-kit';
import { Trophy, Award, Star, Zap, Crown } from 'lucide-react';
import { ethers } from 'ethers';
import { CONTRACTS } from '../config/contracts';
import NFTBadgeABI from '../../../contracts/artifacts/contracts/NFTBadge.sol/NFTBadge.json';

const BADGE_TYPES = {
  0: { name: 'Top Predictor', icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  1: { name: 'Winning Streak', icon: Zap, color: 'text-orange-400', bg: 'bg-orange-500/20' },
  2: { name: 'Market Master', icon: Star, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  3: { name: 'Oracle Sage', icon: Award, color: 'text-purple-400', bg: 'bg-purple-500/20' },
  4: { name: 'Prophet Legend', icon: Trophy, color: 'text-pink-400', bg: 'bg-pink-500/20' },
};

export default function NFTBadgeGallery() {
  const { account, isConnected } = usePushWalletContext();
  const [badges, setBadges] = useState([]);
  const [stats, setStats] = useState({
    correctPredictions: 0,
    currentStreak: 0,
    totalBadges: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected && account) {
      loadBadges();
    }
  }, [isConnected, account]);

  const loadBadges = async () => {
    try {
      setLoading(true);
      
      const provider = new ethers.JsonRpcProvider('https://evm.rpc-testnet-donut-node1.push.org');
      const contract = new ethers.Contract(CONTRACTS.NFT_BADGE, NFTBadgeABI.abi, provider);

      // Get user stats
      const userStats = await contract.getUserStats(account.address);
      setStats({
        correctPredictions: Number(userStats.totalCorrect),
        currentStreak: Number(userStats.streak),
        totalBadges: Number(userStats.totalBadges),
      });

      // Get user badges
      const badgeIds = await contract.getUserBadges(account.address);
      const badgesList = [];

      for (const tokenId of badgeIds) {
        const badge = await contract.getBadge(tokenId);
        badgesList.push({
          tokenId: Number(tokenId),
          badgeType: Number(badge.badgeType),
          marketId: Number(badge.marketId),
          awardedAt: Number(badge.awardedAt),
          metadata: badge.metadata,
        });
      }

      setBadges(badgesList);
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center glass rounded-2xl p-12">
          <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-muted-foreground">
            Connect your wallet to view your NFT badges and achievements.
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
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Trophy className="h-16 w-16 mx-auto mb-4 text-primary" />
          </motion.div>
          <h1 className="text-4xl font-bold mb-2">Achievement Badges</h1>
          <p className="text-muted-foreground">
            Earn exclusive NFT badges for your prediction skills
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="glass rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold text-primary mb-2">
              {stats.correctPredictions}
            </div>
            <div className="text-muted-foreground">Correct Predictions</div>
          </div>

          <div className="glass rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold text-secondary mb-2">
              {stats.currentStreak}
            </div>
            <div className="text-muted-foreground">Current Streak</div>
          </div>

          <div className="glass rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold text-accent mb-2">
              {stats.totalBadges}
            </div>
            <div className="text-muted-foreground">Total Badges</div>
          </div>
        </div>

        {/* Badge Types */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Available Badges</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(BADGE_TYPES).map(([typeId, badge]) => {
              const BadgeIcon = badge.icon;
              const earned = badges.filter(b => b.badgeType === parseInt(typeId)).length;

              return (
                <motion.div
                  key={typeId}
                  className={`glass rounded-2xl p-6 border-2 ${
                    earned > 0 ? 'border-primary/50' : 'border-white/10'
                  }`}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-4 rounded-xl ${badge.bg}`}>
                      <BadgeIcon className={`h-8 w-8 ${badge.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold">{badge.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {earned > 0 ? `Earned ${earned}x` : 'Not earned'}
                      </p>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {typeId === '0' && 'Awarded to top 3 predictors in a market'}
                    {typeId === '1' && 'Win 5 predictions in a row'}
                    {typeId === '2' && 'Make 10 correct predictions'}
                    {typeId === '3' && 'Make 25 correct predictions'}
                    {typeId === '4' && 'Make 50 correct predictions'}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* My Badges */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-6">My Badges ({badges.length})</h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="glass rounded-xl p-6 h-48 shimmer" />
              ))}
            </div>
          ) : badges.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No badges yet</h3>
              <p className="text-muted-foreground mb-4">
                Start making correct predictions to earn badges!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {badges.map((badge) => {
                const badgeInfo = BADGE_TYPES[badge.badgeType];
                const BadgeIcon = badgeInfo.icon;

                return (
                  <motion.div
                    key={badge.tokenId}
                    className="glass rounded-2xl p-6 border border-primary/30"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className={`p-6 rounded-2xl ${badgeInfo.bg} mb-4 relative`}>
                        <BadgeIcon className={`h-12 w-12 ${badgeInfo.color}`} />
                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold">
                          #{badge.tokenId}
                        </div>
                      </div>

                      <h3 className="font-bold text-lg mb-2">{badgeInfo.name}</h3>
                      
                      <p className="text-sm text-muted-foreground mb-4">
                        Awarded {new Date(badge.awardedAt * 1000).toLocaleDateString()}
                      </p>

                      {badge.marketId > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Market #{badge.marketId}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Milestones */}
        <div className="mt-12 glass rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-6">Upcoming Milestones</h2>
          <div className="space-y-4">
            {stats.currentStreak < 5 && (
              <div className="flex items-center justify-between p-4 rounded-xl glass">
                <div className="flex items-center gap-3">
                  <Zap className="h-6 w-6 text-orange-400" />
                  <div>
                    <div className="font-semibold">Winning Streak</div>
                    <div className="text-sm text-muted-foreground">
                      Win {5 - stats.currentStreak} more in a row
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{stats.currentStreak}/5</div>
                  <div className="text-xs text-muted-foreground">Progress</div>
                </div>
              </div>
            )}

            {stats.correctPredictions < 10 && (
              <div className="flex items-center justify-between p-4 rounded-xl glass">
                <div className="flex items-center gap-3">
                  <Star className="h-6 w-6 text-blue-400" />
                  <div>
                    <div className="font-semibold">Market Master</div>
                    <div className="text-sm text-muted-foreground">
                      Make {10 - stats.correctPredictions} more correct predictions
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{stats.correctPredictions}/10</div>
                  <div className="text-xs text-muted-foreground">Progress</div>
                </div>
              </div>
            )}

            {stats.correctPredictions >= 10 && stats.correctPredictions < 25 && (
              <div className="flex items-center justify-between p-4 rounded-xl glass">
                <div className="flex items-center gap-3">
                  <Award className="h-6 w-6 text-purple-400" />
                  <div>
                    <div className="font-semibold">Oracle Sage</div>
                    <div className="text-sm text-muted-foreground">
                      Make {25 - stats.correctPredictions} more correct predictions
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{stats.correctPredictions}/25</div>
                  <div className="text-xs text-muted-foreground">Progress</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
