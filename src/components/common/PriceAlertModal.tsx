import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  Trash2, 
  RotateCcw, 
  Zap, 
  Volume2, 
  VolumeX, 
  SlidersHorizontal,
  ChevronDown,
  Info,
  PlusCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { CryptoAsset, PriceAlertCondition } from '../../types';

export const PriceAlertModal: React.FC = () => {
  const { 
    isPriceAlertModalOpen, 
    setIsPriceAlertModalOpen,
    targetAlertAsset,
    selectedAsset,
    cryptoAssets,
    priceAlerts,
    activeAlertsCount,
    triggeredAlertsCount,
    addPriceAlert,
    removePriceAlert,
    togglePriceAlert,
    rearmPriceAlert,
    clearTriggeredAlerts,
    simulateTriggerAlert,
    soundEnabled,
    setSoundEnabled
  } = useTrading();

  // Tab: 'create' | 'manage'
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  
  // Alert Creation Form State
  const [selectedSymbol, setSelectedSymbol] = useState<string>(selectedAsset.symbol);
  const [condition, setCondition] = useState<PriceAlertCondition>('above');
  const [targetPriceInput, setTargetPriceInput] = useState<string>('');
  const [customNote, setCustomNote] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Manage Filter: 'all' | 'active' | 'triggered'
  const [manageFilter, setManageFilter] = useState<'all' | 'active' | 'triggered'>('all');

  // Sync selected asset when modal opens or targetAlertAsset changes
  useEffect(() => {
    if (isPriceAlertModalOpen) {
      const asset = targetAlertAsset || selectedAsset;
      setSelectedSymbol(asset.symbol);
      // Default to 2% above current price if condition is 'above', or 2% below if 'below'
      const defaultPrice = (asset.price * 1.02).toFixed(asset.price > 50 ? 2 : 4);
      setTargetPriceInput(defaultPrice);
      setCondition('above');
      setCustomNote('');
      setFeedbackMsg(null);
    }
  }, [isPriceAlertModalOpen, targetAlertAsset, selectedAsset]);

  if (!isPriceAlertModalOpen) return null;

  const currentAsset = cryptoAssets.find(a => a.symbol === selectedSymbol) || selectedAsset;
  const targetPriceNum = parseFloat(targetPriceInput) || 0;

  // Percentage difference calculation
  const diffUsd = targetPriceNum - currentAsset.price;
  const diffPct = currentAsset.price > 0 ? (diffUsd / currentAsset.price) * 100 : 0;
  const isConditionOpposite = condition === 'above' ? diffUsd < 0 : diffUsd > 0;

  // Preset offsets
  const applyPreset = (pct: number) => {
    const factor = 1 + (pct / 100);
    const calculated = currentAsset.price * factor;
    setTargetPriceInput(calculated.toFixed(currentAsset.price > 50 ? 2 : 4));
    if (pct > 0) setCondition('above');
    if (pct < 0) setCondition('below');
  };

  const applyHighLow = (type: 'high' | 'low') => {
    if (type === 'high') {
      setTargetPriceInput(currentAsset.high24h.toFixed(currentAsset.price > 50 ? 2 : 4));
      setCondition('above');
    } else {
      setTargetPriceInput(currentAsset.low24h.toFixed(currentAsset.price > 50 ? 2 : 4));
      setCondition('below');
    }
  };

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(targetPriceNum) || targetPriceNum <= 0) {
      setFeedbackMsg({ type: 'error', text: 'Please enter a valid price threshold greater than 0.' });
      return;
    }

    addPriceAlert({
      assetSymbol: selectedSymbol,
      targetPrice: targetPriceNum,
      condition,
      note: customNote
    });

    setFeedbackMsg({ 
      type: 'success', 
      text: `Alert saved for ${selectedSymbol} when price is ${condition === 'above' ? '≥' : '≤'} $${targetPriceNum.toLocaleString(undefined, { minimumFractionDigits: 2 })}!` 
    });

    setTimeout(() => {
      setFeedbackMsg(null);
      setActiveTab('manage');
    }, 1200);
  };

  // Filtered alerts
  const filteredAlerts = priceAlerts.filter(alert => {
    if (manageFilter === 'active') return alert.isActive && !alert.isTriggered;
    if (manageFilter === 'triggered') return alert.isTriggered;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div 
        id="price-alert-modal-container"
        className="w-full max-w-xl rounded-2xl border border-slate-800/90 bg-[#090e1d]/95 p-6 backdrop-blur-2xl shadow-2xl relative overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-950/80 border border-purple-700/60 text-purple-400 shadow-inner">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold font-mono text-white tracking-wide">
                  CUSTOM PRICE ALERTS
                </h2>
                {activeAlertsCount > 0 && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-slate-400">
                Real-time price threshold notifications with local persistence
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Alert Chime Enabled' : 'Alert Chime Muted'}
              className={`rounded-lg p-2 transition-colors border ${
                soundEnabled 
                  ? 'bg-purple-950/50 border-purple-800/50 text-purple-300 hover:bg-purple-900/60' 
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={() => setIsPriceAlertModalOpen(false)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800/60 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 mt-4 relative z-10 font-mono text-xs">
          <button
            id="tab-create-alert-btn"
            onClick={() => setActiveTab('create')}
            className={`flex items-center space-x-2 px-4 py-2.5 font-bold transition-all border-b-2 -mb-[1px] ${
              activeTab === 'create'
                ? 'border-purple-500 text-white bg-purple-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlusCircle className="h-3.5 w-3.5 text-purple-400" />
            <span>Create Alert</span>
          </button>

          <button
            id="tab-manage-alerts-btn"
            onClick={() => setActiveTab('manage')}
            className={`flex items-center space-x-2 px-4 py-2.5 font-bold transition-all border-b-2 -mb-[1px] ${
              activeTab === 'manage'
                ? 'border-purple-500 text-white bg-purple-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-purple-400" />
            <span>Manage Alerts</span>
            <span className="ml-1 rounded-full bg-slate-800 px-2 py-0.5 text-xs text-purple-300">
              {priceAlerts.length}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 relative z-10 pr-1">
          {/* TAB 1: CREATE ALERT */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateAlert} className="space-y-4">
              {/* Asset Selection */}
              <div>
                <label className="text-xs font-mono text-slate-300 uppercase tracking-wider block mb-1.5">
                  Target Crypto Asset
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {cryptoAssets.slice(0, 8).map(asset => {
                    const isSelected = asset.symbol === selectedSymbol;
                    return (
                      <button
                        type="button"
                        key={asset.id}
                        onClick={() => {
                          setSelectedSymbol(asset.symbol);
                          const newPrice = condition === 'above' 
                            ? (asset.price * 1.02).toFixed(asset.price > 50 ? 2 : 4)
                            : (asset.price * 0.98).toFixed(asset.price > 50 ? 2 : 4);
                          setTargetPriceInput(newPrice);
                        }}
                        className={`flex items-center space-x-2 p-2 rounded-xl border text-left font-mono transition-all ${
                          isSelected
                            ? 'bg-purple-950/60 border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        <div 
                          className="h-6 w-6 rounded-md flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm"
                          style={{ backgroundColor: asset.iconBg }}
                        >
                          {asset.symbol.substring(0, 3)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-white truncate">{asset.symbol}</div>
                          <div className="text-xs text-slate-300 truncate">
                            ${asset.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Current Market Price Banner */}
              <div className="rounded-xl border border-slate-800/80 bg-[#060a14] p-3 flex items-center justify-between font-mono text-xs">
                <div>
                  <span className="text-slate-300 text-xs">Current Live Market Price ({currentAsset.symbol}):</span>
                  <div className="text-base font-bold text-white flex items-center space-x-2 mt-0.5">
                    <span>${currentAsset.price.toLocaleString(undefined, { minimumFractionDigits: currentAsset.price > 50 ? 2 : 4 })}</span>
                    <span className={`text-xs flex items-center font-semibold ${
                      currentAsset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {currentAsset.change24h >= 0 ? <TrendingUp className="h-3.5 w-3.5 mr-0.5" /> : <TrendingDown className="h-3.5 w-3.5 mr-0.5" />}
                      {currentAsset.change24h >= 0 ? '+' : ''}{currentAsset.change24h}%
                    </span>
                  </div>
                </div>

                <div className="text-right text-xs text-slate-300">
                  <div>24h High: <span className="text-white font-semibold">${currentAsset.high24h.toLocaleString()}</span></div>
                  <div>24h Low: <span className="text-white font-semibold">${currentAsset.low24h.toLocaleString()}</span></div>
                </div>
              </div>

              {/* Condition Selection: Rises Above vs Drops Below */}
              <div>
                <label className="text-xs font-mono text-slate-300 uppercase tracking-wider block mb-1.5">
                  Notification Condition
                </label>
                <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setCondition('above');
                      if (diffUsd < 0) {
                        setTargetPriceInput((currentAsset.price * 1.02).toFixed(currentAsset.price > 50 ? 2 : 4));
                      }
                    }}
                    className={`flex items-center justify-center space-x-2 p-3 rounded-xl border font-bold transition-all ${
                      condition === 'above'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                    <span>Price Rises Above (≥)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCondition('below');
                      if (diffUsd > 0) {
                        setTargetPriceInput((currentAsset.price * 0.98).toFixed(currentAsset.price > 50 ? 2 : 4));
                      }
                    }}
                    className={`flex items-center justify-center space-x-2 p-3 rounded-xl border font-bold transition-all ${
                      condition === 'below'
                        ? 'bg-rose-950/60 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <ArrowDownRight className="h-4 w-4 text-rose-400" />
                    <span>Price Drops Below (≤)</span>
                  </button>
                </div>
              </div>

              {/* Target Price Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-mono text-slate-300 uppercase tracking-wider">
                    Threshold Target Price (USDT)
                  </label>
                  {targetPriceNum > 0 && (
                    <span className={`text-xs font-mono font-semibold ${
                      diffPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {diffPct >= 0 ? '+' : ''}{diffPct.toFixed(2)}% from current
                    </span>
                  )}
                </div>

                <div className="relative rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2.5 text-sm font-mono text-white focus-within:border-purple-500 shadow-inner flex items-center">
                  <span className="text-slate-500 mr-2 font-bold">$</span>
                  <input
                    id="target-price-input"
                    type="number"
                    step="any"
                    required
                    value={targetPriceInput}
                    onChange={e => setTargetPriceInput(e.target.value)}
                    placeholder="Enter threshold price..."
                    className="w-full bg-transparent outline-none text-white placeholder-slate-600 font-bold"
                  />
                  <span className="text-slate-400 text-xs font-semibold ml-2">USDT</span>
                </div>

                {isConditionOpposite && (
                  <div className="mt-1.5 flex items-center space-x-1.5 text-xs font-mono text-amber-400/90">
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      Notice: Current price is already {condition === 'above' ? 'above' : 'below'} this threshold.
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Offset Presets */}
              <div>
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                  Quick Percentage Presets
                </div>
                <div className="grid grid-cols-6 gap-1.5 font-mono text-xs">
                  {condition === 'above' ? (
                    <>
                      <button type="button" onClick={() => applyPreset(1)} className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 hover:border-emerald-500 hover:text-white transition-colors text-center">+1%</button>
                      <button type="button" onClick={() => applyPreset(2)} className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 hover:border-emerald-500 hover:text-white transition-colors text-center">+2%</button>
                      <button type="button" onClick={() => applyPreset(5)} className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 hover:border-emerald-500 hover:text-white transition-colors text-center">+5%</button>
                      <button type="button" onClick={() => applyPreset(10)} className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 hover:border-emerald-500 hover:text-white transition-colors text-center">+10%</button>
                      <button type="button" onClick={() => applyPreset(20)} className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 hover:border-emerald-500 hover:text-white transition-colors text-center">+20%</button>
                      <button type="button" onClick={() => applyHighLow('high')} className="p-1.5 rounded-lg border border-purple-800/40 bg-purple-950/40 text-purple-300 hover:border-purple-400 hover:text-white transition-colors text-center font-bold">24h High</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => applyPreset(-1)} className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 hover:border-rose-500 hover:text-white transition-colors text-center">-1%</button>
                      <button type="button" onClick={() => applyPreset(-2)} className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 hover:border-rose-500 hover:text-white transition-colors text-center">-2%</button>
                      <button type="button" onClick={() => applyPreset(-5)} className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 hover:border-rose-500 hover:text-white transition-colors text-center">-5%</button>
                      <button type="button" onClick={() => applyPreset(-10)} className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 hover:border-rose-500 hover:text-white transition-colors text-center">-10%</button>
                      <button type="button" onClick={() => applyPreset(-20)} className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 hover:border-rose-500 hover:text-white transition-colors text-center">-20%</button>
                      <button type="button" onClick={() => applyHighLow('low')} className="p-1.5 rounded-lg border border-purple-800/40 bg-purple-950/40 text-purple-300 hover:border-purple-400 hover:text-white transition-colors text-center font-bold">24h Low</button>
                    </>
                  )}
                </div>
              </div>

              {/* Custom Note / Strategy Tag */}
              <div>
                <label className="text-xs font-mono text-slate-300 uppercase tracking-wider block mb-1.5">
                  Custom Strategy Note (Optional)
                </label>
                <input
                  type="text"
                  value={customNote}
                  onChange={e => setCustomNote(e.target.value)}
                  placeholder="e.g. Take-Profit Level 1, Resistance breakout test, Buy dip..."
                  maxLength={60}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs font-mono text-white placeholder-slate-600 outline-none focus:border-purple-500"
                />

                {/* Quick chip suggestions */}
                <div className="flex flex-wrap gap-1.5 mt-2 font-mono text-xs">
                  {['Take Profit 🎯', 'Buy the Dip 📉', 'Breakout Level 🚀', 'Stop Loss Watch 🛡️'].map(tag => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => setCustomNote(tag)}
                      className="rounded-md border border-slate-800 bg-slate-900/50 px-2.5 py-1 text-slate-300 hover:text-white hover:border-purple-500 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Alert */}
              {feedbackMsg && (
                <div className={`rounded-xl p-3 text-xs font-mono flex items-center space-x-2 ${
                  feedbackMsg.type === 'success'
                    ? 'bg-emerald-950/80 border border-emerald-800/60 text-emerald-300'
                    : 'bg-rose-950/80 border border-rose-800/60 text-rose-300'
                }`}>
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{feedbackMsg.text}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                id="save-price-alert-btn"
                className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 py-3 text-xs font-bold font-mono tracking-wider text-white shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-all flex items-center justify-center space-x-2"
              >
                <Bell className="h-4 w-4" />
                <span>SET PRICE ALERT FOR {selectedSymbol}</span>
              </button>
            </form>
          )}

          {/* TAB 2: MANAGE ALERTS */}
          {activeTab === 'manage' && (
            <div className="space-y-4">
              {/* Filter controls & Batch actions */}
              <div className="flex items-center justify-between font-mono text-xs border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setManageFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                      manageFilter === 'all' 
                        ? 'bg-purple-900/60 text-white border border-purple-600/50' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({priceAlerts.length})
                  </button>
                  <button
                    onClick={() => setManageFilter('active')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                      manageFilter === 'active' 
                        ? 'bg-purple-900/60 text-white border border-purple-600/50' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Active ({activeAlertsCount})
                  </button>
                  <button
                    onClick={() => setManageFilter('triggered')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                      manageFilter === 'triggered' 
                        ? 'bg-purple-900/60 text-white border border-purple-600/50' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Triggered ({triggeredAlertsCount})
                  </button>
                </div>

                {triggeredAlertsCount > 0 && (
                  <button
                    onClick={clearTriggeredAlerts}
                    className="text-xs text-slate-400 hover:text-rose-400 transition-colors flex items-center space-x-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Clear Triggered</span>
                  </button>
                )}
              </div>

              {/* Alerts List */}
              {filteredAlerts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center font-mono">
                  <Bell className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-300 font-bold">No price alerts found</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {manageFilter === 'all' 
                      ? "You haven't set any custom price thresholds yet." 
                      : `No ${manageFilter} alerts available.`}
                  </p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="mt-4 inline-flex items-center space-x-1.5 rounded-lg border border-purple-500/50 bg-purple-950/40 px-3 py-1.5 text-xs text-purple-300 hover:bg-purple-900/60 transition-colors font-bold"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>Create Your First Alert</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredAlerts.map(alert => {
                    const asset = cryptoAssets.find(a => a.symbol === alert.assetSymbol);
                    const curPrice = asset?.price || alert.initialPrice;
                    const diff = alert.targetPrice - curPrice;
                    const diffP = curPrice > 0 ? (diff / curPrice) * 100 : 0;

                    return (
                      <div
                        key={alert.id}
                        className={`rounded-xl border p-3.5 font-mono transition-all ${
                          alert.isTriggered
                            ? 'border-amber-700/50 bg-amber-950/20'
                            : alert.isActive
                              ? 'border-slate-800 bg-[#060a14] hover:border-slate-700'
                              : 'border-slate-800/40 bg-slate-900/20 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          {/* Asset & Condition */}
                          <div className="flex items-center space-x-3">
                            <div 
                              className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-sm shrink-0"
                              style={{ backgroundColor: asset?.iconBg || '#7c3aed' }}
                            >
                              {alert.assetSymbol.substring(0, 3)}
                            </div>

                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-white text-sm">{alert.assetSymbol}</span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                  alert.condition === 'above'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                                    : 'bg-rose-950 text-rose-300 border border-rose-800/50'
                                }`}>
                                  {alert.condition === 'above' ? '≥' : '≤'} ${alert.targetPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                              </div>

                              {alert.note && (
                                <p className="text-xs text-purple-300/90 mt-0.5 flex items-center space-x-1">
                                  <span>{alert.note}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Status Badge & Action Controls */}
                          <div className="flex items-center space-x-2 shrink-0">
                            {alert.isTriggered ? (
                              <span className="rounded-full bg-amber-950/80 border border-amber-700/60 px-2 py-0.5 text-xs font-bold text-amber-300 flex items-center space-x-1">
                                <Sparkles className="h-3 w-3" />
                                <span>Triggered</span>
                              </span>
                            ) : alert.isActive ? (
                              <span className="rounded-full bg-emerald-950/80 border border-emerald-700/60 px-2 py-0.5 text-xs font-bold text-emerald-300 flex items-center space-x-1">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span>Active</span>
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                                Paused
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Middle info bar: Current Price, Distance, Trigger info */}
                        <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2">
                          <div className="flex items-center space-x-3 text-xs">
                            <span>
                              Live: <span className="text-white font-semibold">${curPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </span>
                            {!alert.isTriggered && (
                              <span className={diffP >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                ({diffP >= 0 ? '+' : ''}{diffP.toFixed(2)}% away)
                              </span>
                            )}
                            {alert.isTriggered && alert.triggeredPrice && (
                              <span className="text-amber-300 font-semibold">
                                Hit: ${alert.triggeredPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>

                          {/* Action Toolbar */}
                          <div className="flex items-center space-x-1.5">
                            {/* Test simulation button */}
                            {!alert.isTriggered && alert.isActive && (
                              <button
                                type="button"
                                onClick={() => simulateTriggerAlert(alert.id)}
                                title="Test Trigger (Instant Simulation)"
                                className="flex items-center space-x-1 rounded-lg border border-purple-800/50 bg-purple-950/40 px-2 py-1 text-xs text-purple-300 hover:bg-purple-900/60 transition-colors font-bold"
                              >
                                <Zap className="h-3 w-3 text-yellow-400" />
                                <span>Test Trigger</span>
                              </button>
                            )}

                            {/* Re-arm button */}
                            {alert.isTriggered && (
                              <button
                                type="button"
                                onClick={() => rearmPriceAlert(alert.id)}
                                title="Re-arm this alert"
                                className="flex items-center space-x-1 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:text-white transition-colors"
                              >
                                <RotateCcw className="h-3 w-3" />
                                <span>Re-arm</span>
                              </button>
                            )}

                            {/* Toggle active button */}
                            {!alert.isTriggered && (
                              <button
                                type="button"
                                onClick={() => togglePriceAlert(alert.id)}
                                className={`rounded-lg px-2 py-1 text-xs font-semibold transition-colors ${
                                  alert.isActive
                                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                                }`}
                              >
                                {alert.isActive ? 'Pause' : 'Resume'}
                              </button>
                            )}

                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={() => removePriceAlert(alert.id)}
                              title="Delete alert"
                              className="rounded-lg p-1 text-slate-500 hover:bg-rose-950/60 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Timestamp detail */}
                        <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>Created: {alert.createdAt}</span>
                          </span>
                          {alert.triggeredAt && (
                            <span className="text-amber-400/80">Triggered: {alert.triggeredAt}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
