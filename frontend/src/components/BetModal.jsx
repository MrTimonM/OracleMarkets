import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { usePushChainClient } from '@pushchain/ui-kit';
import { ethers } from 'ethers';
import { CONTRACTS, SUPPORTED_CHAINS } from '../config/contracts';
import OracleMarketsABI from '../../../contracts/artifacts/contracts/OracleMarkets.sol/OracleMarkets.json';

export default function BetModal({ market, outcome, onClose, onSuccess }) {
  const { pushChainClient, isInitialized } = usePushChainClient();
  const [amount, setAmount] = useState('');
  const [selectedChain, setSelectedChain] = useState(SUPPORTED_CHAINS[0]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (!pushChainClient || !isInitialized) {
        throw new Error('Wallet not properly initialized. Please reconnect.');
      }

      const amountWei = ethers.parseEther(amount);

      // Encode function call
      const iface = new ethers.Interface(OracleMarketsABI.abi);
      const data = iface.encodeFunctionData('placeBet', [
        market.id,
        outcome,
        selectedChain.namespace,
      ]);

      console.log('🎲 Placing bet...');
      console.log('Amount:', amount, 'PC');
      console.log('Outcome:', outcome === 0 ? 'YES' : 'NO');
      console.log('Origin Chain:', selectedChain.name);

      // Send transaction via PushChain Universal Transaction
      const txResponse = await pushChainClient.universal.sendTransaction({
        to: CONTRACTS.ORACLE_MARKETS,
        value: amountWei,
        data: data,
      });

      console.log('✅ Transaction sent:', txResponse.hash);
      
      // Wait for confirmation
      const receipt = await txResponse.wait();
      
      console.log('✅ Bet confirmed! Block:', receipt.blockNumber);
      
      // Show success message
      setSuccessMessage(`Bet placed successfully! Tx: ${txResponse.hash.slice(0, 10)}...`);
      
      // Wait a moment for user to see the message, then close
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error placing bet:', error);
      setErrorMessage(error.message || 'Failed to place bet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const outcomeLabel = outcome === 0 ? 'YES' : 'NO';
  const outcomeColor = outcome === 0 ? 'green' : 'red';
  const odds = outcome === 0 ? market.oddsYes : market.oddsNo;
  const potentialWin = amount ? (parseFloat(amount) * (odds / 10000)).toFixed(4) : '0.00';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg glass rounded-2xl p-6 border border-white/10 my-8 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Place Bet</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg glass-hover transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Success Message */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 rounded-xl bg-green-500/20 border border-green-500/50 flex items-center gap-3"
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
              className="mb-4 p-4 rounded-xl bg-red-500/20 border border-red-500/50 flex items-center gap-3"
            >
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <div className="text-sm text-red-400">{errorMessage}</div>
            </motion.div>
          )}

          {/* Outcome Badge */}
          <div className={`mb-6 p-4 rounded-xl border-2 ${
            outcome === 0 
              ? 'bg-green-500/10 border-green-500/30' 
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${
                outcome === 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {outcomeLabel}
              </div>
              <div className="text-sm text-muted-foreground">
                Odds: {(odds / 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium mb-2">Bet Amount</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  placeholder="0.00"
                  className="w-full px-4 py-3 pr-16 rounded-xl glass border border-white/10 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  PC
                </div>
              </div>
            </div>

            {/* Chain Selector */}
            <div>
              <label className="block text-sm font-medium mb-2">Pay with</label>
              <div className="grid grid-cols-2 gap-3">
                {SUPPORTED_CHAINS.map((chain) => (
                  <button
                    key={chain.namespace}
                    type="button"
                    onClick={() => setSelectedChain(chain)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedChain.namespace === chain.namespace
                        ? 'border-primary bg-primary/10'
                        : 'border-white/10 glass-hover'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-2">
                      {chain.logo ? (
                        <img src={chain.logo} alt={chain.name} className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="text-2xl">{chain.icon}</div>
                      )}
                    </div>
                    <div className="text-sm font-medium">{chain.name}</div>
                    <div className="text-xs text-muted-foreground">{chain.symbol}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Potential Win */}
            <div className="glass rounded-xl p-4 border border-primary/30">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Potential Return</span>
                <span className="text-2xl font-bold text-primary">{potentialWin} PC</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Includes your bet amount × odds (before fees)
              </div>
            </div>

            {/* Cross-Chain Info */}
            <div className="flex items-start gap-2 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-blue-400 mb-1">Cross-Chain Betting</div>
                <div className="text-muted-foreground">
                  Your bet will be processed through PushChain's Universal Accounts.
                  Payouts can be withdrawn back to your origin chain.
                </div>
              </div>
            </div>

            {/* Submit */}
            {!isInitialized ? (
              <div className="text-center p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                <div className="text-yellow-400 font-medium mb-2">Wallet Not Connected</div>
                <div className="text-sm text-muted-foreground">
                  Please connect your wallet using the button in the header to place bets.
                </div>
              </div>
            ) : (
              <button
                type="submit"
                disabled={loading || !amount || parseFloat(amount) <= 0}
                className="w-full py-4 rounded-xl gradient-primary font-semibold text-white shadow-lg shadow-primary/50 hover:shadow-primary/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Placing Bet...
                  </>
                ) : (
                  `Place ${amount || '0'} PC on ${outcomeLabel}`
                )}
              </button>
            )}
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
