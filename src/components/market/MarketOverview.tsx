import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Sparkles, 
  Radio, 
  Target, 
  Filter, 
  ArrowRight, 
  Layers, 
  Gauge, 
  Activity,
  ArrowUpDown,
  Bell,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { TRADING_SIGNALS } from '../../data/mockData';
import { CryptoAsset, WebSocketProviderId } from '../../types';
import { WEBSOCKET_PROVIDERS } from '../../services/marketDataService';

export const MarketOverview: React.FC = () => {
  const { 
    cryptoAssets, 
    setSelectedAssetId, 
    setCurrentTab,
    openPriceAlertModal,
    priceAlerts,
    isLiveFeedActive,
    toggleLiveFeed,
    liveFeedStatus,
    liveFeedSource,
    lastLiveUpdate,
    refreshMarketData,
    lastPriceTick,
    engineLatencyMs,
    formatCurrency,
    webSocketProvider,
    setWebSocketProvider
  } = useTrading();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortField, setSortField] = useState<'price' | 'change24h' | 'volume24h' | 'marketCap'>('marketCap');
  const [sortAsc, setSortAsc] = useState(false);

  // Filter and sort crypto assets
  const filteredAssets = cryptoAssets
    .filter(asset => {
      if (selectedCategory !== 'All' && asset.category !== selectedCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return asset.name.toLowerCase().includes(q) || asset.symbol.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      return sortAsc ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });

  const handleSort = (field: 'price' | 'change24h' | 'volume24h' | 'marketCap') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleTradeAsset = (assetId: string) => {
    setSelectedAssetId(assetId);
    setCurrentTab('spot');
  };

  return (
    <div className="space-y-6">
      {/* Real-time Crypto Market Data Stream Banner */}
      <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-r from-[#0a0f22] via-[#090e1d] to-[#0d142b] p-4 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center space-x-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
            isLiveFeedActive && liveFeedStatus === 'connected'
              ? 'border-emerald-500/40 bg-emerald-950/60 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
              : !isLiveFeedActive
              ? 'border-slate-700 bg-slate-900 text-slate-400'
              : 'border-amber-500/40 bg-amber-950/60 text-amber-400'
          }`}>
            {isLiveFeedActive ? (
              liveFeedStatus === 'connected' ? <Wifi className="h-4 w-4" /> : <Activity className="h-4 w-4 animate-spin" />
            ) : (
              <WifiOff className="h-4 w-4" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-white font-bold text-sm">
                {isLiveFeedActive ? liveFeedSource : 'Live Feed Suspended (Offline Mode)'}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                isLiveFeedActive && liveFeedStatus === 'connected'
                  ? 'bg-emerald-950/80 border border-emerald-700/60 text-emerald-300'
                  : !isLiveFeedActive
                  ? 'bg-slate-800 border border-slate-700 text-slate-400'
                  : 'bg-amber-950/80 border border-amber-700/60 text-amber-300 animate-pulse'
              }`}>
                {isLiveFeedActive && liveFeedStatus === 'connected' && (
                  <span className="relative flex h-1.5 w-1.5 mr-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                )}
                {isLiveFeedActive ? liveFeedStatus.toUpperCase() : 'PAUSED'}
              </span>

              {/* Easy Access Tag */}
              <span className="bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 text-xs px-2 py-0.5 rounded font-mono">
                Open Access (No Geo-Blocks)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time order books, sub-second trades, and 24h market stats via high-speed WebSockets (Coinbase, Binance, Kraken) with instant fallback.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* WebSocket Provider Dropdown Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-900/90 border border-slate-700 rounded-xl px-2.5 py-1">
            <span className="text-slate-400 text-xs hidden sm:inline">Stream:</span>
            <select
              id="market-websocket-provider-select"
              value={webSocketProvider}
              onChange={(e) => setWebSocketProvider(e.target.value as WebSocketProviderId)}
              className="bg-transparent text-cyan-300 text-xs font-mono font-medium focus:outline-none cursor-pointer"
              title="Select your preferred WebSocket stream provider"
            >
              {WEBSOCKET_PROVIDERS.map(p => (
                <option key={p.id} value={p.id} className="bg-[#090e1d] text-white">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden lg:flex items-center space-x-3 text-xs text-slate-400 border-r border-slate-800 pr-3">
            <span>Latency: <strong className="text-emerald-400 font-mono">{engineLatencyMs}ms</strong></span>
            <span>Last Sync: <strong className="text-slate-200">{lastLiveUpdate ? lastLiveUpdate.toLocaleTimeString() : 'Connecting...'}</strong></span>
          </div>

          <button
            id="market-sync-refresh-btn"
            onClick={() => refreshMarketData()}
            className="flex items-center space-x-1.5 rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-200 hover:border-purple-500 hover:text-white transition-all shadow"
            title="Force refresh 24h ticker snapshots from open price feeds"
          >
            <RefreshCw className="h-3.5 w-3.5 text-cyan-400" />
            <span>Sync Prices</span>
          </button>

          <button
            id="market-feed-toggle-btn"
            onClick={toggleLiveFeed}
            className={`flex items-center space-x-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all shadow ${
              isLiveFeedActive
                ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50'
                : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isLiveFeedActive ? 'Pause Stream' : 'Resume Live Stream'}
          </button>
        </div>
      </div>

      {/* 1. Global Live Market Indicators Header */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 font-mono text-xs">
        <div className="rounded-2xl border border-slate-800/80 bg-[#090e1d]/90 p-4 backdrop-blur-xl shadow-xl">
          <div className="text-slate-400 text-xs uppercase">Global Market Cap</div>
          <div className="text-white font-bold text-base mt-1">$2.84 Trillion</div>
          <div className="text-emerald-400 text-xs font-semibold mt-0.5">+2.42% (24h)</div>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-[#090e1d]/90 p-4 backdrop-blur-xl shadow-xl">
          <div className="text-slate-400 text-xs uppercase">24h Global Volume</div>
          <div className="text-white font-bold text-base mt-1">$94.85 Billion</div>
          <div className="text-purple-300 text-xs mt-0.5">Spot & Derivatives</div>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-[#090e1d]/90 p-4 backdrop-blur-xl shadow-xl">
          <div className="text-slate-400 text-xs uppercase">Bitcoin Dominance</div>
          <div className="text-cyan-300 font-bold text-base mt-1">54.20%</div>
          <div className="text-slate-400 text-xs mt-0.5">ETH Dominance: 14.8%</div>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-[#090e1d]/90 p-4 backdrop-blur-xl shadow-xl">
          <div className="text-slate-400 text-xs uppercase">Ethereum Gas Metric</div>
          <div className="text-emerald-400 font-bold text-base mt-1">12 Gwei</div>
          <div className="text-slate-400 text-xs mt-0.5">Fast: 0.14s</div>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-[#090e1d]/90 p-4 backdrop-blur-xl shadow-xl col-span-2 sm:col-span-1">
          <div className="text-slate-400 text-xs uppercase">Sentiment Index</div>
          <div className="text-emerald-400 font-bold text-base mt-1">68 (Greed)</div>
          <div className="text-slate-400 text-xs mt-0.5">Risk Appetite Strong</div>
        </div>
      </div>

      {/* 2. Trading Possibility & Quant Signals Section */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#090e1d]/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/70 gap-2">
          <div className="flex items-center space-x-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-950/80 border border-purple-800/60 text-purple-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Algorithmic Trading Possibility Signals</h3>
              <p className="text-xs text-slate-400">Machine learning pattern recognition, momentum, and risk/reward setups</p>
            </div>
          </div>
          <span className="text-xs font-mono text-purple-400 bg-purple-950/60 border border-purple-800/40 px-2.5 py-1 rounded-full">
            5 High-Probability Setups Live
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
          {TRADING_SIGNALS.map(sig => {
            const assetSym = sig.pair.split('/')[0];
            const assetObj = cryptoAssets.find(a => a.symbol === assetSym);

            return (
              <div 
                key={sig.id}
                className="rounded-xl border border-slate-800 bg-[#060a14] p-4 space-y-3 transition-all hover:border-purple-500/40 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-sm">{sig.pair}</span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-300">
                      {sig.timeframe}
                    </span>
                  </div>
                  <div className="rounded-full bg-emerald-950 border border-emerald-800/60 px-2 py-0.5 text-xs font-bold text-emerald-300">
                    {sig.probability}% Probability
                  </div>
                </div>

                <div className="space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Signal Pattern:</span>
                    <span className="text-purple-300 font-semibold">{sig.signalType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Target Take-Profit:</span>
                    <span className="text-emerald-400 font-bold">${sig.targetPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Stop-Loss Level:</span>
                    <span className="text-rose-400 font-bold">${sig.stopLossPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">RSI / MACD:</span>
                    <span>{sig.rsi} • {sig.macdStatus}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Risk / Reward Ratio:</span>
                    <span className="text-cyan-300 font-bold">{sig.riskRewardRatio}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (assetObj) {
                      handleTradeAsset(assetObj.id);
                    }
                  }}
                  className="w-full flex items-center justify-center space-x-1.5 rounded-lg border border-purple-500/40 bg-purple-950/40 py-2 font-bold text-purple-200 hover:bg-purple-900/50 hover:border-purple-400 transition-all"
                >
                  <span>Trade {sig.pair} Signal</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Full Cryptomarket Price Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#090e1d]/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
        {/* Search & Category Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800/70">
          <div className="flex items-center space-x-2">
            <Radio className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white font-mono">LIVE CRYPTO PRICE ENGINE</h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search coin or symbol..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="rounded-xl border border-slate-700/80 bg-slate-900/90 pl-9 pr-4 py-1.5 text-xs font-mono text-white placeholder-slate-500 outline-none focus:border-purple-500 w-56"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center space-x-1 font-mono text-xs">
              {['All', 'Layer 1', 'DeFi', 'AI & Data', 'Layer 2', 'Infrastructure'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-lg px-2.5 py-1 transition-colors ${
                    selectedCategory === cat 
                      ? 'bg-purple-900/60 text-purple-200 font-bold border border-purple-700/50' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Full Price Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-xs">
                <th className="pb-3 font-semibold">Asset Name</th>
                <th 
                  onClick={() => handleSort('price')}
                  className="pb-3 font-semibold cursor-pointer hover:text-white"
                >
                  <div className="flex items-center space-x-1">
                    <span>Current Price</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('change24h')}
                  className="pb-3 font-semibold cursor-pointer hover:text-white"
                >
                  <div className="flex items-center space-x-1">
                    <span>24h Change</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="pb-3 font-semibold">24h High / Low</th>
                <th 
                  onClick={() => handleSort('volume24h')}
                  className="pb-3 font-semibold cursor-pointer hover:text-white"
                >
                  <div className="flex items-center space-x-1">
                    <span>24h Volume</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('marketCap')}
                  className="pb-3 font-semibold cursor-pointer hover:text-white"
                >
                  <div className="flex items-center space-x-1">
                    <span>Market Cap</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="pb-3 font-semibold">24h Trend</th>
                <th className="pb-3 font-semibold text-right">Terminal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAssets.map(asset => (
                <tr key={asset.id} className="hover:bg-slate-800/30 transition-colors">
                  {/* Asset name & symbol */}
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-white text-xs shadow"
                        style={{ backgroundColor: asset.iconBg }}
                      >
                        {asset.symbol.substring(0, 3)}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{asset.name}</div>
                        <div className="text-xs text-slate-400">
                          {asset.symbol} • <span className="text-purple-400">{asset.category}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Current Price with Live Tick Flash */}
                  <td className="py-3.5 font-bold text-white text-sm font-mono">
                    <span className={`inline-block px-1.5 py-0.5 rounded transition-all duration-300 ${
                      lastPriceTick?.symbol === asset.symbol
                        ? lastPriceTick.direction === 'up'
                          ? 'bg-emerald-500/20 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                          : 'bg-rose-500/20 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                        : ''
                    }`}>
                      ${asset.price.toLocaleString(undefined, { minimumFractionDigits: asset.price > 50 ? 2 : 4 })}
                    </span>
                  </td>

                  {/* 24h Change */}
                  <td className="py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                      asset.change24h >= 0 ? 'bg-emerald-950/60 text-emerald-300' : 'bg-rose-950/60 text-rose-300'
                    }`}>
                      {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
                    </span>
                  </td>

                  {/* 24h High/Low */}
                  <td className="py-3.5 text-slate-300">
                    <div>H: ${asset.high24h.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    <div className="text-slate-400 text-xs">L: ${asset.low24h.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  </td>

                  {/* 24h Volume */}
                  <td className="py-3.5 text-slate-300">
                    ${(asset.volume24h / 1e6).toFixed(2)}M
                  </td>

                  {/* Market Cap */}
                  <td className="py-3.5 text-slate-300">
                    ${(asset.marketCap / 1e9).toFixed(2)}B
                  </td>

                  {/* 24h Sparkline Mini SVG */}
                  <td className="py-3.5 w-28">
                    <div className="h-6 w-24 flex items-end space-x-1">
                      {asset.sparkline.map((val, idx) => {
                        const min = Math.min(...asset.sparkline);
                        const max = Math.max(...asset.sparkline);
                        const h = Math.max(15, Math.min(100, ((val - min) / (max - min || 1)) * 100));
                        return (
                          <div 
                            key={idx}
                            className={`flex-1 rounded-t-xs ${asset.change24h >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                            style={{ height: `${h}%` }}
                          />
                        );
                      })}
                    </div>
                  </td>

                  {/* Actions: Alert & Trade Spot */}
                  <td className="py-3.5 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openPriceAlertModal(asset);
                        }}
                        title={`Set Price Alert for ${asset.symbol}`}
                        className="rounded-lg border border-slate-800 bg-slate-900/80 p-1.5 text-slate-400 hover:border-purple-500/60 hover:bg-purple-950/40 hover:text-purple-300 transition-all"
                      >
                        <Bell className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => handleTradeAsset(asset.id)}
                        className="rounded-lg border border-purple-500/40 bg-purple-950/40 px-3 py-1 text-xs font-semibold text-purple-300 hover:bg-purple-900/60 hover:border-purple-400 transition-all shadow-sm"
                      >
                        Trade Spot
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
