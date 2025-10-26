import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PushUniversalWalletProvider, PushUI } from '@pushchain/ui-kit';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import MarketPage from './components/MarketPage';
import Dashboard from './components/Dashboard';
import NFTBadgeGallery from './components/NFTBadgeGallery';

function App() {
  // Push Wallet Configuration
  const walletConfig = {
    network: PushUI.CONSTANTS.PUSH_NETWORK.TESTNET,
    login: {
      email: true,
      google: true,
      wallet: {
        enabled: true,
      },
      appPreview: true,
    },
    modal: {
      appPreview: true,
      loginLayout: 'vertical',
      connectedLayout: 'compact',
    },
  };

  const appMetadata = {
    logoUrl: window.location.origin + '/oracle.png',
    title: 'OracleMarkets',
    description: 'Bet on anything from any chain - AI-powered cross-chain prediction markets',
  };

  return (
    <PushUniversalWalletProvider 
      config={walletConfig}
      app={appMetadata}
      themeMode={PushUI.CONSTANTS.THEME.DARK}
    >
      <Router>
        <div className="min-h-screen bg-background">
          <Header />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/market/:id" element={<MarketPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/badges" element={<NFTBadgeGallery />} />
          </Routes>
        </div>
      </Router>
    </PushUniversalWalletProvider>
  );
}

export default App;
