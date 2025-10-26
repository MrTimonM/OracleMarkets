import { Link } from 'react-router-dom';
import { PushUniversalAccountButton, usePushWalletContext } from '@pushchain/ui-kit';
import { TrendingUp, Trophy, Sparkles, Plus } from 'lucide-react';
import { useState } from 'react';
import CreateMarketModal from './CreateMarketModal';

export default function Header() {
  const { account, isConnected } = usePushWalletContext();
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 glass backdrop-blur-xl">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/40 transition-all" />
              <Sparkles className="h-8 w-8 text-primary relative z-10" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                OracleMarkets
              </h1>
              <p className="text-xs text-muted-foreground">Powered by PushChain</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className="flex items-center space-x-2 text-foreground/80 hover:text-foreground transition-colors"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Explore</span>
            </Link>
            
            {isConnected && (
              <>
                <Link 
                  to="/dashboard" 
                  className="flex items-center space-x-2 text-foreground/80 hover:text-foreground transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Dashboard</span>
                </Link>
                
                <Link 
                  to="/badges" 
                  className="flex items-center space-x-2 text-foreground/80 hover:text-foreground transition-colors"
                >
                  <Trophy className="h-4 w-4" />
                  <span>Badges</span>
                </Link>
              </>
            )}
          </nav>

          {/* Connect Button */}
          <div className="flex items-center space-x-4">
            {isConnected && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary font-semibold text-white shadow-lg shadow-primary/50 hover:shadow-primary/70 transition-all"
              >
                <Plus className="h-4 w-4" />
                Create Market
              </button>
            )}
            <PushUniversalAccountButton />
          </div>
        </div>
      </div>

      {/* Create Market Modal */}
      {showCreateModal && (
        <CreateMarketModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            window.location.reload(); // Refresh to show new market
          }}
        />
      )}
    </header>
  );
}
