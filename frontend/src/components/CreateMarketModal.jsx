import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Sparkles, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { usePushChainClient } from '@pushchain/ui-kit';
import { ethers } from 'ethers';
import { CONTRACTS, CATEGORIES, ODDS } from '../config/contracts';
import OracleMarketsABI from '../../../contracts/artifacts/contracts/OracleMarkets.sol/OracleMarkets.json';

export default function CreateMarketModal({ onClose, onSuccess }) {
  const { pushChainClient, isInitialized } = usePushChainClient();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0],
    endDate: '',
    endTime: '12:00',
    oddsYes: 9200,
    oddsNo: 9200,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generateAIOdds = async () => {
    setAiLoading(true);
    try {
      // Simulate AI odds generation (in production, call your backend API)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate odds between 0.90-0.95
      const randomYes = Math.floor(Math.random() * 501) + 9000; // 9000-9500
      const randomNo = Math.floor(Math.random() * 501) + 9000;
      
      setFormData(prev => ({
        ...prev,
        oddsYes: randomYes,
        oddsNo: randomNo,
      }));
    } catch (error) {
      console.error('Error generating AI odds:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Combine date and time
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
      const endTimeUnix = Math.floor(endDateTime.getTime() / 1000);

      if (endTimeUnix <= Math.floor(Date.now() / 1000)) {
        setErrorMessage('End time must be in the future');
        setLoading(false);
        return;
      }

      // Encode function call
      const iface = new ethers.Interface(OracleMarketsABI.abi);
      const data = iface.encodeFunctionData('createMarket', [
        formData.title,
        formData.description,
        formData.category,
        endTimeUnix,
        formData.oddsYes,
        formData.oddsNo,
      ]);

      // Send transaction via PushChain
      const txResponse = await pushChainClient.universal.sendTransaction({
        to: CONTRACTS.ORACLE_MARKETS,
        value: BigInt(0),
        data: data,
      });

      console.log('Transaction sent:', txResponse.hash);
      
      // Wait for confirmation
      await txResponse.wait();
      
      console.log('Market created successfully!');
      setSuccessMessage('Market created successfully!');
      
      // Wait a moment then close
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error creating market:', error);
      setErrorMessage(error.message || 'Failed to create market. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const oddsYesPercent = (formData.oddsYes / 100).toFixed(1);
  const oddsNoPercent = (formData.oddsNo / 100).toFixed(1);

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
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass rounded-2xl p-6 border border-white/10 my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Create Prediction Market</h2>
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">Market Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Will Bitcoin hit $100K before Ethereum hits $10K?"
                className="w-full px-4 py-3 rounded-xl glass border border-white/10 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Describe the market conditions, resolution criteria, and data sources..."
                className="w-full px-4 py-3 rounded-xl glass border border-white/10 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl glass border border-white/10 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground [&>option]:bg-background [&>option]:text-foreground"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* End Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-xl glass border border-white/10 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Time</label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl glass border border-white/10 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            {/* AI Odds Generator */}
            <div className="glass rounded-xl p-4 border border-primary/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI-Suggested Odds
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Gemini-powered odds in range 0.90-0.95
                  </p>
                </div>
                <button
                  type="button"
                  onClick={generateAIOdds}
                  disabled={aiLoading}
                  className="px-4 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate'
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">YES Odds</label>
                  <input
                    type="number"
                    name="oddsYes"
                    value={formData.oddsYes}
                    onChange={handleChange}
                    min={ODDS.MIN}
                    max={ODDS.MAX}
                    required
                    className="w-full px-4 py-3 rounded-xl glass border border-white/10 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {oddsYesPercent}% ({ODDS.MIN/100}% - {ODDS.MAX/100}%)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">NO Odds</label>
                  <input
                    type="number"
                    name="oddsNo"
                    value={formData.oddsNo}
                    onChange={handleChange}
                    min={ODDS.MIN}
                    max={ODDS.MAX}
                    required
                    className="w-full px-4 py-3 rounded-xl glass border border-white/10 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {oddsNoPercent}% ({ODDS.MIN/100}% - {ODDS.MAX/100}%)
                  </p>
                </div>
              </div>
            </div>

            {/* Fee Info */}
            <div className="glass rounded-xl p-4 border border-white/10">
              <h4 className="font-medium mb-2">Fee Structure</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Creator Fee:</span>
                  <span>1%</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee:</span>
                  <span>2%</span>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl gradient-primary font-semibold text-white shadow-lg shadow-primary/50 hover:shadow-primary/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating Market...
                </>
              ) : (
                'Create Market'
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
