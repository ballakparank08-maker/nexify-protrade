import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ChevronDown, 
  SlidersHorizontal, 
  Maximize2, 
  BarChart2, 
  Clock, 
  ArrowDown, 
  ArrowUp,
  X,
  AlertCircle,
  CheckCircle2,
  Layers,
  Sparkles,
  Bell,
  RefreshCw,
  Wifi,
  WifiOff,
  History,
  ListFilter
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { CryptoAsset, CandleStick, WebSocketProviderId } from '../../types';
import { DepthChart } from './DepthChart';
import { OrderHistory } from './OrderHistory';

export const SpotTradingTerminal: React.FC = () => {
  const { 
    selectedAsset, 
    setSelectedAssetId, 
    cryptoAssets, 
    candles, 
    orderBook, 
    marketTrades, 
    timeframe, 
    setTimeframe,
    wallet,
    placeOrder,
    userOrders,
    orderHistory,
    cancelOrder,
    circuitBreakerActive,
    openPriceAlertModal,
    priceAlerts,
    isLiveFeedActive,
    toggleLiveFeed,
    liveFeedStatus,
    liveFeedSource,
    lastPriceTick,
    refreshMarketData,
    engineLatencyMs,
    webSocketProvider,
    setWebSocketProvider
  } = useTrading();

  // Chart View Mode: Candlestick vs. Depth Chart
  const [chartViewMode, setChartViewMode] = useState<'candlestick' | 'depth'>('candlestick');

  // Bottom Panel Tab: Open Orders vs Order History
  const [bottomPanelTab, setBottomPanelTab] = useState<'open_orders' | 'order_history'>('open_orders');

  // Quick Buy Ratio computed from live order book
  const quickBuyRatio = useMemo(() => {
    const bidVol = orderBook.bids.reduce((acc, b) => acc + b.amount, 0);
    const askVol = orderBook.asks.reduce((acc, a) => acc + a.amount, 0);
    const total = (bidVol + askVol) || 1;
    return Math.round((bidVol / total) * 100);
  }, [orderBook]);

  // Order Form State
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'limit' | 'market' | 'stop_limit'>('limit');
  const [inputPrice, setInputPrice] = useState<string>(selectedAsset.price.toString());
  const [inputAmount, setInputAmount] = useState<string>('0.1');
  const [sliderPct, setSliderPct] = useState<number>(25);
  const [orderNotification, setOrderNotification] = useState<{ success: boolean; message: string } | null>(null);

  // Technical Indicator Overlays
  const [showEma, setShowEma] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [hoveredCandle, setHoveredCandle] = useState<CandleStick | null>(null);

  const assetAlertsCount = useMemo(() => {
    return priceAlerts.filter(a => a.assetSymbol === selectedAsset.symbol && a.isActive && !a.isTriggered).length;
  }, [priceAlerts, selectedAsset.symbol]);

  // Sync price when asset switches
  React.useEffect(() => {
    setInputPrice(selectedAsset.price.toString());
  }, [selectedAsset.id]);

  // Handle Quick Percent Slider
  const handlePercentClick = (pct: number) => {
    setSliderPct(pct);
    if (orderSide === 'buy') {
      const availableUsdt = wallet.usdtBalance;
      const targetCost = (availableUsdt * (pct / 100));
      const price = parseFloat(inputPrice) || selectedAsset.price;
      const calculatedAmt = (targetCost / price);
      setInputAmount(calculatedAmt.toFixed(selectedAsset.price > 100 ? 4 : 2));
    } else {
      const curBal = wallet.assets[selectedAsset.symbol] || 0;
      const calculatedAmt = (curBal * (pct / 100));
      setInputAmount(calculatedAmt.toFixed(4));
    }
  };

  // Submit Order
  const handleExecuteOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const price = orderType === 'market' ? selectedAsset.price : parseFloat(inputPrice);
    const amount = parseFloat(inputAmount);

    if (isNaN(price) || price <= 0 || isNaN(amount) || amount <= 0) {
      setOrderNotification({ success: false, message: 'Please enter a valid price and amount.' });
      return;
    }

    const res = placeOrder({
      type: orderSide,
      orderType,
      price,
      amount
    });

    setOrderNotification(res);
    setTimeout(() => setOrderNotification(null), 4000);
  };

  // Chart coordinate calculations
  const chartData = useMemo(() => {
    if (!candles || candles.length === 0) return null;
    const minPrice = Math.min(...candles.map(c => c.low));
    const maxPrice = Math.max(...candles.map(c => c.high));
    const priceRange = (maxPrice - minPrice) || 1;
    const maxVolume = Math.max(...candles.map(c => c.volume)) || 1;

    // Calculate simple moving averages (EMA approximations)
    const ema20: number[] = [];
    const ema50: number[] = [];
    let k20 = 2 / (20 + 1);
    let prevEma20 = candles[0].close;

    candles.forEach((c, idx) => {
      if (idx === 0) {
        ema20.push(c.close);
        ema50.push(c.close);
      } else {
        prevEma20 = c.close * k20 + prevEma20 * (1 - k20);
        ema20.push(prevEma20);
      }
    });

    return { minPrice, maxPrice, priceRange, maxVolume, ema20 };
  }, [candles]);

  const activeCandle = hoveredCandle || (candles.length > 0 ? candles[candles.length - 1] : null);

  return (
    <div className="space-y-4">
      {/* 1. Pair Header & Key Statistics Bar */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#090e1d]/90 p-4 backdrop-blur-xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        {/* Pair Selector Dropdown */}
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <button className="flex items-center space-x-2 rounded-xl border border-slate-700/80 bg-slate-800/80 px-3 py-1.5 text-sm font-bold font-mono text-white transition-all hover:border-purple-500/50">
              <div 
                className="h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold text-white shadow"
                style={{ backgroundColor: selectedAsset.iconBg }}
              >
                {selectedAsset.symbol.substring(0, 2)}
              </div>
              <span>{selectedAsset.symbol} / USDT</span>
              <ChevronDown className="h-4 w-4 text-slate-400 group-hover:rotate-180 transition-transform" />
            </button>

            {/* Quick Pair Selector Dropdown */}
            <div className="absolute left-0 top-full mt-1.5 hidden group-hover:block w-64 rounded-xl border border-slate-800 bg-[#0c1122]/95 p-2 shadow-2xl backdrop-blur-2xl z-50 max-h-72 overflow-y-auto">
              <div className="text-xs font-mono text-slate-400 px-2 py-1 uppercase">Spot Markets</div>
              {cryptoAssets.map(asset => (
                <button
                  key={asset.id}
                  onClick={() => setSelectedAssetId(asset.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs font-mono transition-colors ${
                    selectedAsset.id === asset.id ? 'bg-purple-950/60 text-purple-200 font-bold border border-purple-800/40' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <span className="font-bold">{asset.symbol}</span>
                    <span className="text-xs text-slate-400">/ USDT</span>
                  </span>
                  <div className="text-right">
                    <div>${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    <div className={`text-xs ${asset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Current Live Price with Sub-Second Tick Flash */}
          <div className="flex items-baseline space-x-2">
            <span className={`text-2xl font-black font-mono tracking-tight transition-all duration-300 px-1.5 py-0.5 rounded ${
              lastPriceTick?.symbol === selectedAsset.symbol
                ? lastPriceTick.direction === 'up'
                  ? 'bg-emerald-500/20 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                  : 'bg-rose-500/20 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.35)]'
                : 'text-white'
            }`}>
              ${selectedAsset.price.toLocaleString(undefined, { minimumFractionDigits: selectedAsset.price > 50 ? 2 : 4 })}
            </span>
            <span className={`text-xs font-mono font-bold flex items-center ${
              selectedAsset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {selectedAsset.change24h >= 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
              {selectedAsset.change24h >= 0 ? '+' : ''}{selectedAsset.change24h}%
            </span>
          </div>
        </div>

        {/* 24h Stats & Live Data Feed Indicator */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          {/* Live WebSocket Connection Pill */}
          <div className="flex items-center space-x-1.5 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1">
            <button
              onClick={toggleLiveFeed}
              title={isLiveFeedActive ? `${liveFeedSource} active. Click to pause.` : "Live feed paused. Click to stream."}
              className="flex items-center space-x-1.5 text-xs"
            >
              {isLiveFeedActive && liveFeedStatus === 'connected' ? (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              ) : isLiveFeedActive ? (
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
              ) : (
                <span className="h-2 w-2 rounded-full bg-slate-500"></span>
              )}
              <span className={isLiveFeedActive && liveFeedStatus === 'connected' ? 'text-emerald-300 font-semibold' : 'text-slate-400'}>
                {isLiveFeedActive ? (liveFeedStatus === 'connected' ? (webSocketProvider === 'auto' ? 'Auto WS' : webSocketProvider.toUpperCase() + ' WS') : 'Connecting') : 'Paused'}
              </span>
              <span className="text-xs text-slate-400">({engineLatencyMs}ms)</span>
            </button>

            {/* Quick Provider Picker */}
            <select
              value={webSocketProvider}
              onChange={(e) => setWebSocketProvider(e.target.value as WebSocketProviderId)}
              title="Change WebSocket stream provider"
              className="bg-transparent text-xs text-cyan-400 font-mono focus:outline-none cursor-pointer border-l border-slate-800 pl-1.5"
            >
              <option value="auto" className="bg-slate-900 text-white">Auto (Failover)</option>
              <option value="coinbase" className="bg-slate-900 text-white">Coinbase</option>
              <option value="binance" className="bg-slate-900 text-white">Binance</option>
              <option value="kraken" className="bg-slate-900 text-white">Kraken</option>
              <option value="coincap" className="bg-slate-900 text-white">CoinCap (REST)</option>
            </select>

            <button
              onClick={() => refreshMarketData()}
              title="Sync Snapshot"
              className="text-slate-500 hover:text-cyan-300 p-0.5 rounded transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>

          <div>
            <div className="text-slate-400 text-xs">24h High</div>
            <div className="text-white font-semibold">${selectedAsset.high24h.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="border-l border-slate-800 pl-4">
            <div className="text-slate-400 text-xs">24h Low</div>
            <div className="text-white font-semibold">${selectedAsset.low24h.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="border-l border-slate-800 pl-4">
            <div className="text-slate-400 text-xs">24h Volume ({selectedAsset.symbol})</div>
            <div className="text-white font-semibold">{(selectedAsset.volume24h / selectedAsset.price).toFixed(0)}</div>
          </div>
          <div className="border-l border-slate-800 pl-4">
            <div className="text-slate-400 text-xs">24h Turnover (USDT)</div>
            <div className="text-purple-300 font-semibold">${(selectedAsset.volume24h / 1e6).toFixed(2)}M</div>
          </div>

          {/* Quick Price Alert Shortcut */}
          <div className="border-l border-slate-800 pl-4 ml-auto">
            <button
              id="terminal-set-alert-btn"
              onClick={() => openPriceAlertModal(selectedAsset)}
              className="flex items-center space-x-1.5 rounded-xl border border-purple-500/40 bg-purple-950/40 px-3 py-1.5 text-xs font-mono font-semibold text-purple-200 hover:bg-purple-900/60 hover:border-purple-400 transition-all shadow-[0_0_12px_rgba(168,85,247,0.15)]"
              title={`Set Custom Price Alert for ${selectedAsset.symbol}`}
            >
              <Bell className="h-3.5 w-3.5 text-purple-400" />
              <span>Set Alert</span>
              {assetAlertsCount > 0 && (
                <span className="rounded-full bg-purple-600 px-1.5 py-0.2 text-xs font-bold text-white">
                  {assetAlertsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Terminal Grid: Chart (Left) + Order Book / Trades (Center) + Order Placement (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT & CENTER: Interactive Candlestick / Depth Chart (7 cols) */}
        <div className="lg:col-span-7 flex flex-col rounded-2xl border border-slate-800/80 bg-[#090e1d]/90 p-4 backdrop-blur-xl shadow-xl">
          {/* Chart Header: View Switcher (Candles vs Market Depth) & Controls */}
          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
            {/* View Mode Tabs */}
            <div className="flex items-center rounded-xl bg-slate-900/90 p-1 border border-slate-800 font-mono text-xs">
              <button
                type="button"
                id="terminal-chart-candlestick-tab"
                onClick={() => setChartViewMode('candlestick')}
                className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 transition-all ${
                  chartViewMode === 'candlestick'
                    ? 'bg-purple-600 text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart2 className="h-3.5 w-3.5" />
                <span>Price Chart</span>
              </button>

              <button
                type="button"
                id="terminal-chart-depth-tab"
                onClick={() => setChartViewMode('depth')}
                className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 transition-all ${
                  chartViewMode === 'depth'
                    ? 'bg-purple-600 text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Market Depth</span>
                <span className={`rounded-full px-1.5 py-0.2 text-xs font-bold ${
                  quickBuyRatio >= 50
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                    : 'bg-rose-950 text-rose-300 border border-rose-800/60'
                }`}>
                  {quickBuyRatio}% Buy
                </span>
              </button>
            </div>

            {/* Candlestick Controls (Timeframe & Overlays) */}
            {chartViewMode === 'candlestick' ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center space-x-1 font-mono text-xs">
                  <span className="text-slate-400 mr-1 text-xs">TF:</span>
                  {['1m', '5m', '15m', '1h', '4h', '1D'].map(tf => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`rounded px-2 py-0.5 text-xs transition-colors ${
                        timeframe === tf ? 'bg-purple-900/60 text-purple-200 font-bold border border-purple-700/50' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-2 text-xs font-mono">
                  <button
                    onClick={() => setShowEma(!showEma)}
                    className={`flex items-center space-x-1 px-2 py-0.5 rounded transition-colors ${
                      showEma ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/40' : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <span>EMA (20)</span>
                  </button>
                  <button
                    onClick={() => setShowVolume(!showVolume)}
                    className={`flex items-center space-x-1 px-2 py-0.5 rounded transition-colors ${
                      showVolume ? 'bg-purple-950/60 text-purple-300 border border-purple-800/40' : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <span>VOL</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Real-Time Recharts Order Book Depth</span>
              </div>
            )}
          </div>

          {/* Conditional View: Depth Chart vs Candlestick Chart */}
          {chartViewMode === 'depth' ? (
            <div className="mt-3 flex-1 flex flex-col">
              <DepthChart
                selectedAsset={selectedAsset}
                orderBook={orderBook}
                onSelectPrice={price => setInputPrice(price.toString())}
              />
            </div>
          ) : (
            <>
              {/* Active Candle Hover Info Bar */}
              {activeCandle && (
                <div className="py-2 flex flex-wrap items-center gap-3 text-xs font-mono border-b border-slate-800/40 text-slate-400">
                  <span>Time: <strong className="text-slate-200">{activeCandle.time}</strong></span>
                  <span>O: <strong className="text-slate-200">${activeCandle.open}</strong></span>
                  <span>H: <strong className="text-slate-200">${activeCandle.high}</strong></span>
                  <span>L: <strong className="text-slate-200">${activeCandle.low}</strong></span>
                  <span>C: <strong className={activeCandle.close >= activeCandle.open ? 'text-emerald-400' : 'text-rose-400'}>${activeCandle.close}</strong></span>
                  <span>Vol: <strong className="text-slate-200">{activeCandle.volume}</strong></span>
                </div>
              )}

              {/* SVG Candlestick Canvas */}
              <div className="relative flex-1 min-h-[380px] w-full mt-2 bg-[#060a14] rounded-xl border border-slate-900 overflow-hidden flex flex-col justify-end p-2">
                {chartData && (
                  <svg 
                    className="w-full h-full" 
                    viewBox="0 0 640 340" 
                    preserveAspectRatio="none"
                  >
                    {/* Horizontal Price Grid Lines */}
                    {[0.2, 0.4, 0.6, 0.8].map((ratio, i) => {
                      const priceVal = chartData.maxPrice - ratio * chartData.priceRange;
                      const y = ratio * 260 + 10;
                      return (
                        <g key={i}>
                          <line x1="0" y1={y} x2="640" y2={y} stroke="#1e293b" strokeDasharray="3 3" strokeWidth="0.8" />
                          <text x="635" y={y - 4} textAnchor="end" fill="#64748b" fontSize="9" fontFamily="monospace">
                            ${priceVal.toFixed(selectedAsset.price > 100 ? 1 : 3)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Candlesticks & Volume */}
                    {candles.map((candle, idx) => {
                      const total = candles.length;
                      const candleWidth = Math.max(8, 580 / total - 4);
                      const x = idx * (580 / total) + 20;
                      
                      // Coordinate transforms
                      const yHigh = 10 + ((chartData.maxPrice - candle.high) / chartData.priceRange) * 240;
                      const yLow = 10 + ((chartData.maxPrice - candle.low) / chartData.priceRange) * 240;
                      const yOpen = 10 + ((chartData.maxPrice - candle.open) / chartData.priceRange) * 240;
                      const yClose = 10 + ((chartData.maxPrice - candle.close) / chartData.priceRange) * 240;

                      const isBull = candle.close >= candle.open;
                      const bodyY = Math.min(yOpen, yClose);
                      const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));
                      const color = isBull ? '#10b981' : '#ef4444';

                      // Volume Bar
                      const volHeight = (candle.volume / chartData.maxVolume) * 50;
                      const volY = 320 - volHeight;

                      return (
                        <g 
                          key={candle.timestamp} 
                          className="cursor-crosshair transition-opacity hover:opacity-80"
                          onMouseEnter={() => setHoveredCandle(candle)}
                          onMouseLeave={() => setHoveredCandle(null)}
                        >
                          {/* Volume */}
                          {showVolume && (
                            <rect
                              x={x}
                              y={volY}
                              width={candleWidth}
                              height={volHeight}
                              fill={color}
                              opacity="0.25"
                            />
                          )}

                          {/* Wick Line */}
                          <line
                            x1={x + candleWidth / 2}
                            y1={yHigh}
                            x2={x + candleWidth / 2}
                            y2={yLow}
                            stroke={color}
                            strokeWidth="1.5"
                          />

                          {/* Candle Body */}
                          <rect
                            x={x}
                            y={bodyY}
                            width={candleWidth}
                            height={bodyHeight}
                            fill={color}
                            rx="1"
                          />
                        </g>
                      );
                    })}

                    {/* EMA 20 Overlay Line */}
                    {showEma && chartData.ema20.length > 0 && (
                      <path
                        d={chartData.ema20.map((val, idx) => {
                          const total = candles.length;
                          const x = idx * (580 / total) + 20 + Math.max(4, (580 / total - 4) / 2);
                          const y = 10 + ((chartData.maxPrice - val) / chartData.priceRange) * 240;
                          return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="1.8"
                        opacity="0.8"
                      />
                    )}
                  </svg>
                )}

                {/* Current Price Marker Bar */}
                <div className="absolute right-2 top-4 rounded bg-purple-950/90 border border-purple-600/50 px-2 py-0.5 font-mono text-xs text-purple-300 shadow">
                  Live: ${selectedAsset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* CENTER-RIGHT: Order Book & Market Trades (2.5 cols) */}
        <div className="lg:col-span-2 flex flex-col rounded-2xl border border-slate-800/80 bg-[#090e1d]/90 p-3 backdrop-blur-xl shadow-xl space-y-3">
          <div className="text-xs font-bold font-mono text-white flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center space-x-1.5">
              <span>ORDER BOOK</span>
              <button
                type="button"
                id="orderbook-quick-depth-btn"
                onClick={() => setChartViewMode('depth')}
                className="text-xs text-purple-400 hover:text-purple-300 underline font-normal cursor-pointer"
                title="Open Market Depth Chart"
              >
                (Depth)
              </button>
            </div>
            <span className="text-xs text-slate-400">Spread: 0.01%</span>
          </div>

          {/* Quick Buy/Sell Pressure Ratio Bar */}
          <div 
            onClick={() => setChartViewMode('depth')}
            className="cursor-pointer group rounded-lg bg-slate-900/80 p-2 border border-slate-800 hover:border-purple-500/50 transition-all font-mono text-xs"
            title="Click to view real-time Market Depth Chart"
          >
            <div className="flex justify-between items-center text-slate-400 mb-1">
              <span className="text-emerald-400 font-semibold">Buy {quickBuyRatio}%</span>
              <span className="text-slate-400 text-xs group-hover:text-purple-300 transition-colors">Depth Chart ↗</span>
              <span className="text-rose-400 font-semibold">Sell {100 - quickBuyRatio}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-950 overflow-hidden flex">
              <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${quickBuyRatio}%` }} />
              <div className="h-full bg-rose-500 transition-all duration-300" style={{ width: `${100 - quickBuyRatio}%` }} />
            </div>
          </div>

          {/* Asks (Sell Orders - Red) */}
          <div className="space-y-1 font-mono text-xs">
            {orderBook.asks.slice(-5).map((ask, idx) => {
              const depthPct = Math.min(100, (ask.total / 4) * 100);
              return (
                <div 
                  key={idx} 
                  onClick={() => setInputPrice(ask.price.toString())}
                  className="relative flex justify-between items-center px-1.5 py-0.5 rounded cursor-pointer hover:bg-rose-950/30"
                >
                  <div 
                    className="absolute right-0 top-0 bottom-0 bg-rose-500/10 rounded-r"
                    style={{ width: `${depthPct}%` }}
                  />
                  <span className="relative z-10 text-rose-400 font-medium">${ask.price.toFixed(2)}</span>
                  <span className="relative z-10 text-slate-400">{ask.amount.toFixed(3)}</span>
                </div>
              );
            })}
          </div>

          {/* Mid Price Separator */}
          <div className="py-1.5 px-2 bg-slate-900/80 rounded-lg border border-slate-800 flex justify-between items-center font-mono">
            <span className="text-white font-bold text-xs">${selectedAsset.price.toFixed(2)}</span>
            <span className={`text-xs ${selectedAsset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {selectedAsset.change24h >= 0 ? '↑' : '↓'}
            </span>
          </div>

          {/* Bids (Buy Orders - Green) */}
          <div className="space-y-1 font-mono text-xs">
            {orderBook.bids.slice(0, 5).map((bid, idx) => {
              const depthPct = Math.min(100, (bid.total / 4) * 100);
              return (
                <div 
                  key={idx} 
                  onClick={() => setInputPrice(bid.price.toString())}
                  className="relative flex justify-between items-center px-1.5 py-0.5 rounded cursor-pointer hover:bg-emerald-950/30"
                >
                  <div 
                    className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 rounded-r"
                    style={{ width: `${depthPct}%` }}
                  />
                  <span className="relative z-10 text-emerald-400 font-medium">${bid.price.toFixed(2)}</span>
                  <span className="relative z-10 text-slate-400">{bid.amount.toFixed(3)}</span>
                </div>
              );
            })}
          </div>

          {/* Recent Market Trades Mini Feed */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="text-xs font-mono text-slate-400 font-semibold mb-1 uppercase">Recent Trades</div>
            <div className="space-y-1 font-mono text-xs max-h-32 overflow-y-auto">
              {marketTrades.slice(0, 5).map(trade => (
                <div key={trade.id} className="flex justify-between items-center text-slate-400">
                  <span className={trade.type === 'buy' ? 'text-emerald-400' : 'text-rose-400'}>
                    ${trade.price.toFixed(2)}
                  </span>
                  <span>{trade.amount.toFixed(3)}</span>
                  <span className="text-slate-500">{trade.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Order Placement Form (2.5 cols) */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-800/80 bg-[#090e1d]/90 p-4 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <form onSubmit={handleExecuteOrder} className="space-y-4">
            {/* Buy / Sell Tabs */}
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-900/90 p-1 border border-slate-800">
              <button
                type="button"
                id="order-side-buy-btn"
                onClick={() => setOrderSide('buy')}
                className={`rounded-lg py-2 text-xs font-bold font-mono transition-all ${
                  orderSide === 'buy'
                    ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                BUY {selectedAsset.symbol}
              </button>
              <button
                type="button"
                id="order-side-sell-btn"
                onClick={() => setOrderSide('sell')}
                className={`rounded-lg py-2 text-xs font-bold font-mono transition-all ${
                  orderSide === 'sell'
                    ? 'bg-rose-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                SELL {selectedAsset.symbol}
              </button>
            </div>

            {/* Order Type Selector */}
            <div className="flex items-center justify-between text-xs font-mono">
              {['limit', 'market', 'stop_limit'].map(type => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setOrderType(type as any)}
                  className={`capitalize px-2 py-1 rounded transition-colors ${
                    orderType === type ? 'bg-purple-950/80 text-purple-300 font-bold border border-purple-800/50' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {type.replace('_', '-')}
                </button>
              ))}
            </div>

            {/* Available Balance Preview */}
            <div className="flex justify-between text-xs font-mono text-slate-400 pt-1">
              <span>Avail:</span>
              <span className="text-white font-semibold">
                {orderSide === 'buy'
                  ? `$${wallet.usdtBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} USDT`
                  : `${(wallet.assets[selectedAsset.symbol] || 0).toFixed(4)} ${selectedAsset.symbol}`}
              </span>
            </div>

            {/* Price Input (if not Market order) */}
            {orderType !== 'market' ? (
              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-400 uppercase">Order Price (USDT)</label>
                <div className="flex rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs font-mono text-white focus-within:border-purple-500">
                  <input
                    type="number"
                    step="any"
                    value={inputPrice}
                    onChange={e => setInputPrice(e.target.value)}
                    className="w-full bg-transparent outline-none"
                    placeholder="0.00"
                  />
                  <span className="text-slate-400">USDT</span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-800 p-2.5 text-center font-mono text-xs text-slate-400">
                Execute at Best Available Market Price
              </div>
            )}

            {/* Amount Input */}
            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-400 uppercase">Amount ({selectedAsset.symbol})</label>
              <div className="flex rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs font-mono text-white focus-within:border-purple-500">
                <input
                  type="number"
                  step="any"
                  value={inputAmount}
                  onChange={e => setInputAmount(e.target.value)}
                  className="w-full bg-transparent outline-none"
                  placeholder="0.00"
                />
                <span className="text-slate-400">{selectedAsset.symbol}</span>
              </div>
            </div>

            {/* Percentage Quick Select */}
            <div className="grid grid-cols-4 gap-1.5 font-mono text-xs">
              {[25, 50, 75, 100].map(pct => (
                <button
                  type="button"
                  key={pct}
                  onClick={() => handlePercentClick(pct)}
                  className={`rounded-lg py-1 border transition-colors ${
                    sliderPct === pct
                      ? 'bg-purple-900/50 border-purple-500 text-purple-200 font-bold'
                      : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>

            {/* Total Order Value */}
            <div className="rounded-xl border border-slate-800/80 bg-[#060a14] p-3 text-xs font-mono space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>Order Total:</span>
                <span className="text-white font-bold">
                  ${((parseFloat(inputPrice) || selectedAsset.price) * (parseFloat(inputAmount) || 0)).toFixed(2)} USDT
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Trading Fee (0.02%):</span>
                <span>${(((parseFloat(inputPrice) || selectedAsset.price) * (parseFloat(inputAmount) || 0)) * 0.0002).toFixed(4)}</span>
              </div>
            </div>

            {/* Notification alert if triggered */}
            {orderNotification && (
              <div className={`rounded-xl p-2.5 text-xs font-mono flex items-start space-x-2 ${
                orderNotification.success
                  ? 'bg-emerald-950/80 border border-emerald-800/50 text-emerald-300'
                  : 'bg-rose-950/80 border border-rose-800/50 text-rose-300'
              }`}>
                {orderNotification.success ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
                <span>{orderNotification.message}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              id="submit-order-btn"
              disabled={circuitBreakerActive}
              className={`w-full rounded-xl py-3 text-xs font-bold font-mono tracking-wider transition-all shadow-lg ${
                circuitBreakerActive
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : orderSide === 'buy'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:brightness-110'
                    : 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.35)] hover:brightness-110'
              }`}
            >
              {circuitBreakerActive 
                ? 'TRADING HALTED (CIRCUIT BREAKER)' 
                : `${orderSide.toUpperCase()} ${selectedAsset.symbol}`}
            </button>
          </form>
        </div>
      </div>

      {/* 3. Open Orders & Order History Ledger */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#090e1d]/90 p-4 backdrop-blur-xl shadow-xl space-y-3">
        {/* Tab Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-3 gap-2">
          <div className="flex items-center space-x-1.5 bg-[#060a14] p-1 rounded-xl border border-slate-800">
            <button
              id="tab-open-orders"
              onClick={() => setBottomPanelTab('open_orders')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                bottomPanelTab === 'open_orders'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListFilter className="h-3.5 w-3.5 text-purple-400" />
              <span>Open Orders</span>
              <span className={`px-1.5 py-0.2 rounded-full text-xs font-bold ${
                bottomPanelTab === 'open_orders' ? 'bg-purple-900/80 text-purple-200' : 'bg-slate-900 text-slate-400'
              }`}>
                {userOrders.length}
              </span>
            </button>

            <button
              id="tab-order-history"
              onClick={() => setBottomPanelTab('order_history')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                bottomPanelTab === 'order_history'
                  ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.35)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>Order History</span>
              <span className={`px-1.5 py-0.2 rounded-full text-xs font-bold ${
                bottomPanelTab === 'order_history' ? 'bg-purple-950 text-purple-200 border border-purple-400/40' : 'bg-slate-900 text-slate-400'
              }`}>
                {orderHistory.length}
              </span>
            </button>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
            <span className="hidden sm:inline">Active Pair:</span>
            <span className="font-bold text-white bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
              {selectedAsset.symbol}/USDT
            </span>
          </div>
        </div>

        {/* Tab Content */}
        {bottomPanelTab === 'open_orders' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-xs">
                  <th className="pb-2 font-semibold">Pair</th>
                  <th className="pb-2 font-semibold">Side</th>
                  <th className="pb-2 font-semibold">Type</th>
                  <th className="pb-2 font-semibold">Price</th>
                  <th className="pb-2 font-semibold">Amount</th>
                  <th className="pb-2 font-semibold">Filled</th>
                  <th className="pb-2 font-semibold">Time</th>
                  <th className="pb-2 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {userOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-500">
                      No active open orders.
                    </td>
                  </tr>
                ) : (
                  userOrders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 font-bold text-white">{order.pair}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          order.type === 'buy' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                        }`}>
                          {order.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 capitalize text-slate-400">{order.orderType}</td>
                      <td className="py-2.5 text-white">${order.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-2.5 text-slate-300">{order.amount}</td>
                      <td className="py-2.5 text-slate-400">{order.filled}%</td>
                      <td className="py-2.5 text-slate-500">{order.createdAt}</td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => cancelOrder(order.id)}
                          className="rounded px-2 py-1 text-xs text-rose-400 hover:bg-rose-950/60 transition-colors"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <OrderHistory filterPair={`${selectedAsset.symbol}/USDT`} />
        )}
      </div>
    </div>
  );
};
