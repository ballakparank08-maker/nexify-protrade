import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ChevronDown, 
  Clock, 
  DollarSign, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle2, 
  XCircle, 
  Receipt, 
  AlertCircle,
  Sparkles,
  Info,
  Timer,
  FileText,
  RotateCcw,
  PlusCircle,
  Sun,
  Moon,
  Lock,
  ShieldCheck,
  Play
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { BillingTimeOption, FutureContractPosition } from '../../types';
import { FutureOrderHistoryPanel } from './FutureOrderHistoryPanel';

// The 7 fixed contract rules: level, investment amount, and reward rate.
export const CONTRACT_TIERS: BillingTimeOption[] = [
  { level: 30, days: 30, amount: 100, profitRate: 0.10, displayRate: '10%', label: 'Level 30' },
  { level: 60, days: 60, amount: 10000, profitRate: 0.15, displayRate: '15%', label: 'Level 60' },
  { level: 90, days: 90, amount: 50000, profitRate: 0.20, displayRate: '20%', label: 'Level 90' },
  { level: 120, days: 120, amount: 100000, profitRate: 0.30, displayRate: '30%', label: 'Level 120' },
  { level: 180, days: 180, amount: 250000, profitRate: 0.40, displayRate: '40%', label: 'Level 180' },
  { level: 240, days: 240, amount: 400000, profitRate: 0.50, displayRate: '50%', label: 'Level 240' },
  { level: 360, days: 360, amount: 500000, profitRate: 0.70, displayRate: '70%', label: 'Level 360' }
];

const TIMEFRAMES = ['1M', '5M', '15M', '30M', '1H', '4H', '1D'];

const AVAILABLE_SYMBOLS = [
  { symbol: 'BTC/USDT', base: 'BTC', name: 'Bitcoin', defaultPrice: 79780.42, change24h: 0.14, high: 80487.85, low: 79500.00, volume: '2829.870547' },
  { symbol: 'ETH/USDT', base: 'ETH', name: 'Ethereum', defaultPrice: 3412.65, change24h: 1.82, high: 3468.20, low: 3340.00, volume: '18492.12401' },
  { symbol: 'SOL/USDT', base: 'SOL', name: 'Solana', defaultPrice: 184.30, change24h: -0.65, high: 191.40, low: 178.50, volume: '492801.442' },
  { symbol: 'BNB/USDT', base: 'BNB', name: 'BNB', defaultPrice: 592.10, change24h: 0.85, high: 602.00, low: 584.20, volume: '98402.12' },
  { symbol: 'XRP/USDT', base: 'XRP', name: 'Ripple', defaultPrice: 1.4820, change24h: 3.12, high: 1.5400, low: 1.4120, volume: '8492040.11' }
];

interface ChartCandle {
  timeStr: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const FutureTradingTerminal: React.FC = () => {
  const { 
    wallet, 
    cryptoAssets, 
    futurePositions, 
    futureHistory, 
    placeFutureContract, 
    settleFuturePositionEarly,
    cancelFuturePosition,
    clearFutureHistory,
    addDemoUsdt
  } = useTrading();

  // Selected trading pair
  const [selectedSymbolStr, setSelectedSymbolStr] = useState<string>('BTC/USDT');
  const [isSymbolDropdownOpen, setIsSymbolDropdownOpen] = useState<boolean>(false);

  // Timeframe
  const [activeTimeframe, setActiveTimeframe] = useState<string>('1M');

  // Bottom Table Tab
  const [activeBottomTab, setActiveBottomTab] = useState<'positions' | 'history'>('positions');

  // 7 Contract Tiers Selection with locked specific amount (cannot change or edit)
  const [selectedTier, setSelectedTier] = useState<BillingTimeOption>(CONTRACT_TIERS[0]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [orderToast, setOrderToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Helper to format remaining countdown
  const formatRemainingTime = (seconds?: number) => {
    if (!seconds || seconds <= 0) return '0s (Settling)';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  // Instant early settlement handler for testing & demonstration
  const handleSettleEarly = (positionId: string) => {
    const res = settleFuturePositionEarly(positionId);
    setOrderToast({
      message: res.message,
      type: res.success ? 'success' : 'error'
    });
    setTimeout(() => setOrderToast(null), 5000);
  };

  // Cancel active position handler (refunds capital & registers as cancelled trade)
  const handleCancelPosition = (positionId: string) => {
    const res = cancelFuturePosition(positionId);
    setOrderToast({
      message: res.message,
      type: res.success ? 'success' : 'error'
    });
    setTimeout(() => setOrderToast(null), 5000);
  };

  // Bill / Statement Modal
  const [isBillModalOpen, setIsBillModalOpen] = useState<boolean>(false);

  // Theme (default to dark to match the rest of the application)
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');

  // Crosshair / Hover state on chart
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [crosshairPos, setCrosshairPos] = useState<{ x: number; y: number } | null>(null);

  // Matched current symbol info
  const currentSymbolInfo = useMemo(() => {
    return AVAILABLE_SYMBOLS.find(s => s.symbol === selectedSymbolStr) || AVAILABLE_SYMBOLS[0];
  }, [selectedSymbolStr]);

  // Real-time fluctuating current price
  const matchedCryptoAsset = cryptoAssets.find(a => selectedSymbolStr.startsWith(a.symbol));
  const [livePrice, setLivePrice] = useState<number>(currentSymbolInfo.defaultPrice);
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);

  // Sync with context asset price or simulate realistic micro-ticks around default
  useEffect(() => {
    if (matchedCryptoAsset) {
      setLivePrice(matchedCryptoAsset.price);
    } else {
      setLivePrice(currentSymbolInfo.defaultPrice);
    }
  }, [selectedSymbolStr, matchedCryptoAsset, currentSymbolInfo]);

  // Micro-tick simulation for active contract engagement
  useEffect(() => {
    const tickInterval = setInterval(() => {
      setLivePrice(prev => {
        const delta = (Math.random() - 0.49) * (prev * 0.00035);
        const nextPrice = parseFloat((prev + delta).toFixed(2));
        if (nextPrice > prev) {
          setPriceFlash('up');
        } else if (nextPrice < prev) {
          setPriceFlash('down');
        }
        setTimeout(() => setPriceFlash(null), 400);
        return nextPrice;
      });
    }, 1800);

    return () => clearInterval(tickInterval);
  }, []);

  // Effective order investment amount - strictly locked to the selected tier's specific amount
  const effectiveInvestment = selectedTier.amount;

  // Expected payout calculation
  const expectedProfit = parseFloat((effectiveInvestment * selectedTier.profitRate).toFixed(2));
  const expectedPayout = parseFloat((effectiveInvestment + expectedProfit).toFixed(2));

  // Generate realistic candles matching screenshot pattern
  const [candles, setCandles] = useState<ChartCandle[]>(() => {
    const arr: ChartCandle[] = [];
    const baseP = currentSymbolInfo.defaultPrice;
    let curr = baseP - 80;
    const now = Date.now();

    for (let i = 48; i >= 0; i--) {
      const candleTime = new Date(now - i * 60000);
      const hours = candleTime.getHours().toString().padStart(2, '0');
      const mins = candleTime.getMinutes().toString().padStart(2, '0');
      const timeStr = `${candleTime.getFullYear()}-${(candleTime.getMonth()+1).toString().padStart(2,'0')}-${candleTime.getDate().toString().padStart(2,'0')} ${hours}:${mins}`;

      const open = curr;
      const change = (Math.random() - 0.48) * (baseP * 0.0018);
      const close = parseFloat((open + change).toFixed(2));
      const high = parseFloat((Math.max(open, close) + Math.random() * (baseP * 0.0012)).toFixed(2));
      const low = parseFloat((Math.min(open, close) - Math.random() * (baseP * 0.0012)).toFixed(2));
      const volume = parseFloat((15 + Math.random() * 35).toFixed(2));

      arr.push({
        timeStr,
        timestamp: candleTime.getTime(),
        open,
        high,
        low,
        close,
        volume
      });
      curr = close;
    }
    return arr;
  });

  // Keep last candle synced with live price
  useEffect(() => {
    setCandles(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const updatedLast: ChartCandle = {
        ...last,
        close: livePrice,
        high: Math.max(last.high, livePrice),
        low: Math.min(last.low, livePrice)
      };
      return [...prev.slice(0, prev.length - 1), updatedLast];
    });
  }, [livePrice]);

  // Calculate Moving Averages (MA5, MA10, MA30, MA60)
  const ma5Data = useMemo(() => {
    return candles.map((c, idx) => {
      if (idx < 4) return null;
      const slice = candles.slice(idx - 4, idx + 1);
      const avg = slice.reduce((acc, curr) => acc + curr.close, 0) / 5;
      return parseFloat(avg.toFixed(2));
    });
  }, [candles]);

  const ma10Data = useMemo(() => {
    return candles.map((c, idx) => {
      if (idx < 9) return null;
      const slice = candles.slice(idx - 9, idx + 1);
      const avg = slice.reduce((acc, curr) => acc + curr.close, 0) / 10;
      return parseFloat(avg.toFixed(2));
    });
  }, [candles]);

  const ma30Data = useMemo(() => {
    return candles.map((c, idx) => {
      if (idx < 29) return null;
      const slice = candles.slice(idx - 29, idx + 1);
      const avg = slice.reduce((acc, curr) => acc + curr.close, 0) / 30;
      return parseFloat(avg.toFixed(2));
    });
  }, [candles]);

  const ma60Data = useMemo(() => {
    return candles.map((c, idx) => {
      if (idx < 59) {
        // approximate for earlier candles
        const slice = candles.slice(0, idx + 1);
        return parseFloat((slice.reduce((acc, curr) => acc + curr.close, 0) / slice.length).toFixed(2));
      }
      const slice = candles.slice(idx - 59, idx + 1);
      const avg = slice.reduce((acc, curr) => acc + curr.close, 0) / 60;
      return parseFloat(avg.toFixed(2));
    });
  }, [candles]);

  // Volume Moving Averages (VOL MA5, MA10, MA20)
  const volMa5Data = useMemo(() => {
    return candles.map((c, idx) => {
      if (idx < 4) return null;
      const slice = candles.slice(idx - 4, idx + 1);
      return parseFloat((slice.reduce((acc, curr) => acc + curr.volume, 0) / 5).toFixed(2));
    });
  }, [candles]);

  const volMa10Data = useMemo(() => {
    return candles.map((c, idx) => {
      if (idx < 9) return null;
      const slice = candles.slice(idx - 9, idx + 1);
      return parseFloat((slice.reduce((acc, curr) => acc + curr.volume, 0) / 10).toFixed(2));
    });
  }, [candles]);

  const volMa20Data = useMemo(() => {
    return candles.map((c, idx) => {
      if (idx < 19) return null;
      const slice = candles.slice(idx - 19, idx + 1);
      return parseFloat((slice.reduce((acc, curr) => acc + curr.volume, 0) / 20).toFixed(2));
    });
  }, [candles]);

  // Chart dimensions & scaling
  const chartSvgRef = useRef<SVGSVGElement | null>(null);
  const chartWidth = 780;
  const chartHeight = 360;
  const volumeHeight = 85;
  const mainChartHeight = chartHeight - volumeHeight - 30;
  const candlePadding = 4;

  const { minPrice, maxPrice, maxVolume, highestCandle, lowestCandle } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    let maxVol = 0;
    let highestC = candles[0];
    let lowestC = candles[0];

    candles.forEach(c => {
      if (c.low < min) {
        min = c.low;
        lowestC = c;
      }
      if (c.high > max) {
        max = c.high;
        highestC = c;
      }
      if (c.volume > maxVol) maxVol = c.volume;
    });

    const pad = (max - min) * 0.12 || 10;
    return {
      minPrice: min - pad,
      maxPrice: max + pad,
      maxVolume: maxVol * 1.3 || 50,
      highestCandle: highestC,
      lowestCandle: lowestC
    };
  }, [candles]);

  // Coordinate helper functions
  const getY = (price: number) => {
    return mainChartHeight - ((price - minPrice) / (maxPrice - minPrice)) * (mainChartHeight - 20) + 10;
  };

  const candleWidth = (chartWidth - 80) / candles.length;
  const getX = (index: number) => {
    return index * candleWidth + candleWidth / 2 + 10;
  };

  // Inspect candle: either hovered or latest
  const inspectedCandleIndex = hoveredIndex !== null ? hoveredIndex : candles.length - 1;
  const inspectedCandle = candles[inspectedCandleIndex] || candles[candles.length - 1];

  const currentMA5 = ma5Data[inspectedCandleIndex] || ma5Data[ma5Data.length - 1] || livePrice;
  const currentMA10 = ma10Data[inspectedCandleIndex] || ma10Data[ma10Data.length - 1] || livePrice;
  const currentMA30 = ma30Data[inspectedCandleIndex] || ma30Data[ma30Data.length - 1] || livePrice;
  const currentMA60 = ma60Data[inspectedCandleIndex] || ma60Data[ma60Data.length - 1] || livePrice;

  const currentVolMA5 = volMa5Data[inspectedCandleIndex] || 160.59;
  const currentVolMA10 = volMa10Data[inspectedCandleIndex] || 155.50;
  const currentVolMA20 = volMa20Data[inspectedCandleIndex] || 320.46;

  // Handle placing a contract with the selected fixed tier
  const handlePlaceOrder = async (direction: 'bullish' | 'bearish') => {
    if (effectiveInvestment <= 0) {
      setOrderToast({ message: 'Invalid contract investment tier selected.', type: 'error' });
      return;
    }

    if (wallet.usdtBalance < effectiveInvestment) {
      setOrderToast({ 
        message: `Insufficient USDT balance (${wallet.usdtBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT available). Need ${effectiveInvestment.toLocaleString()} USDT for Level ${selectedTier.level}. Please top up demo balance below.`, 
        type: 'error' 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await placeFutureContract({
        symbol: selectedSymbolStr,
        direction,
        level: selectedTier.level
      });

      if (res.success) {
        setOrderToast({ message: res.message, type: 'success' });
        setActiveBottomTab('positions');
      } else {
        setOrderToast({ message: res.message, type: 'error' });
      }
    } catch {
      setOrderToast({ message: 'Failed to place contract order. Try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setOrderToast(null), 5000);
    }
  };

  // SVG Mouse event handler for crosshair
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!chartSvgRef.current) return;
    const rect = chartSvgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCrosshairPos({ x, y });
    const idx = Math.min(candles.length - 1, Math.max(0, Math.floor((x - 10) / candleWidth)));
    setHoveredIndex(idx);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setCrosshairPos(null);
  };

  // Helper paths for MA lines
  const buildMaPath = (data: (number | null)[]) => {
    let d = '';
    data.forEach((val, i) => {
      if (val === null) return;
      const x = getX(i);
      const y = getY(val);
      if (!d) d += `M ${x} ${y}`;
      else d += ` L ${x} ${y}`;
    });
    return d;
  };

  // Volume MA path
  const buildVolMaPath = (data: (number | null)[]) => {
    let d = '';
    const volBaseY = chartHeight - 15;
    data.forEach((val, i) => {
      if (val === null) return;
      const x = getX(i);
      const y = volBaseY - (val / maxVolume) * (volumeHeight - 15);
      if (!d) d += `M ${x} ${y}`;
      else d += ` L ${x} ${y}`;
    });
    return d;
  };

  const currentPriceY = getY(livePrice);

  return (
    <div className="space-y-4">
      <div className={`w-full transition-colors duration-200 ${themeMode === 'light' ? 'bg-white text-slate-800 border-slate-200 shadow-lg' : 'bg-[#090e1d]/90 text-slate-100 border-slate-800/80 shadow-2xl backdrop-blur-xl'} rounded-2xl border overflow-hidden`}>
        
        {/* ========================================================================= */}
        {/* 1. TOP HEADER / TICKER BAR */}
        {/* ========================================================================= */}
        <div className={`flex flex-wrap items-center justify-between border-b ${themeMode === 'light' ? 'border-slate-200 bg-white' : 'border-slate-800/80 bg-[#0c1122]/90'} px-4 py-3 gap-y-3`}>
          
          {/* Left: Symbol Selector with Dropdown */}
          <div className="flex items-center space-x-6">
            <div className="relative">
              <button
                id="future-symbol-dropdown-btn"
                onClick={() => setIsSymbolDropdownOpen(!isSymbolDropdownOpen)}
                className={`flex items-center space-x-2 text-xl font-bold font-mono tracking-tight transition-colors ${themeMode === 'light' ? 'text-black hover:text-emerald-600' : 'text-white hover:text-emerald-400'}`}
              >
                <span>{selectedSymbolStr}</span>
                <ChevronDown className="h-4 w-4 opacity-70" />
              </button>

              {isSymbolDropdownOpen && (
                <div className={`absolute left-0 top-full mt-2 w-64 rounded-xl border shadow-2xl z-50 py-1.5 ${themeMode === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0c1122] border-slate-800 text-white'}`}>
                  <div className="px-3 py-1.5 text-xs font-semibold uppercase text-slate-400 border-b border-slate-200/50 dark:border-slate-800">
                    Select Contract Market
                  </div>
                  {AVAILABLE_SYMBOLS.map(sym => (
                    <button
                      key={sym.symbol}
                      onClick={() => {
                        setSelectedSymbolStr(sym.symbol);
                        setIsSymbolDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between w-full px-3 py-2 text-xs font-mono transition-colors ${selectedSymbolStr === sym.symbol ? 'bg-emerald-50 text-emerald-600 font-bold dark:bg-emerald-950/60 dark:text-emerald-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}
                    >
                      <span>{sym.symbol}</span>
                      <span className="text-slate-400">${sym.defaultPrice.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Stats Columns matching screenshot */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs">
              {/* Current price */}
              <div>
                <div className="text-xs text-slate-400 font-medium">Current price</div>
                <div className={`text-base font-bold font-mono transition-colors ${
                  priceFlash === 'up' ? 'text-emerald-400 scale-105' : priceFlash === 'down' ? 'text-rose-400 scale-105' : 'text-emerald-400'
                }`}>
                  {livePrice.toFixed(2)}
                </div>
              </div>

              {/* Increase or decrease */}
              <div>
                <div className="text-xs text-slate-400 font-medium">Increase or decrease</div>
                <div className="text-sm font-semibold font-mono text-emerald-400">
                  +{currentSymbolInfo.change24h.toFixed(2)}%
                </div>
              </div>

              {/* 24H Highest */}
              <div>
                <div className="text-xs text-slate-400 font-medium">24H Highest</div>
                <div className={`text-sm font-semibold font-mono ${themeMode === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>
                  {currentSymbolInfo.high.toFixed(2)}
                </div>
              </div>

              {/* 24H Lowest */}
              <div>
                <div className="text-xs text-slate-400 font-medium">24H Lowest</div>
                <div className={`text-sm font-semibold font-mono ${themeMode === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>
                  {currentSymbolInfo.low.toFixed(2)}
                </div>
              </div>

              {/* 24H Volume */}
              <div>
                <div className="text-xs text-slate-400 font-medium">24H Volume</div>
                <div className={`text-sm font-semibold font-mono ${themeMode === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>
                  {currentSymbolInfo.volume}
                </div>
              </div>
            </div>
          </div>

          {/* Right Tool Buttons (Theme Toggle, Live Pulse) */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono dark:bg-emerald-950/60 dark:border-emerald-800/60 dark:text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold">Contract Matching Live</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. MAIN WORKSPACE: LEFT CHART & POSITIONS + RIGHT CONTRACT ORDER SIDEBAR */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12">
          
          {/* ========================================================================= */}
          {/* LEFT 8 OR 9 COLS: TIMEFRAME BAR, CANDLESTICK CHART & CURRENT POSITIONS */}
          {/* ========================================================================= */}
          <div className={`lg:col-span-8 xl:col-span-8 min-w-0 border-r ${themeMode === 'light' ? 'border-slate-200' : 'border-slate-800/80'} flex flex-col`}>
            
            {/* Timeframe Selector Bar */}
            <div className={`flex items-center space-x-2 px-4 py-2 border-b ${themeMode === 'light' ? 'border-slate-200 bg-[#FAFAFA]' : 'border-slate-800/80 bg-[#090e1d]'}`}>
              <span className="text-xs font-mono font-bold text-slate-400 mr-1">TIME</span>
              {TIMEFRAMES.map(tf => {
                const isActive = activeTimeframe === tf;
                return (
                  <button
                    key={tf}
                    onClick={() => setActiveTimeframe(tf)}
                    className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                      isActive 
                        ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]' 
                        : themeMode === 'light' 
                          ? 'border border-slate-200 text-slate-600 hover:bg-slate-200/60' 
                          : 'border border-slate-800 bg-[#060a14] text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    {tf}
                  </button>
                );
              })}
            </div>

            {/* Candle Inspector Strip */}
            <div className={`px-4 py-1.5 text-xs font-mono flex flex-wrap items-center gap-x-4 gap-y-1 border-b ${themeMode === 'light' ? 'border-slate-100 bg-white text-slate-500' : 'border-slate-800/80 bg-[#070c18] text-slate-400'}`}>
              <span>Time:{inspectedCandle.timeStr}</span>
              <span>S:{inspectedCandle.open.toFixed(2)}</span>
              <span>Collect:{inspectedCandle.close.toFixed(2)}</span>
              <span>High:{inspectedCandle.high.toFixed(2)}</span>
              <span>Low:{inspectedCandle.low.toFixed(2)}</span>
              <span>Finished:{inspectedCandle.volume.toFixed(2)}K</span>
            </div>

            {/* MA Indicator Strip */}
            <div className={`px-4 py-1 text-xs font-mono flex flex-wrap items-center gap-x-3 border-b ${themeMode === 'light' ? 'border-slate-100 bg-white text-slate-600' : 'border-slate-800/80 bg-[#070c18] text-slate-300'}`}>
              <span className="font-semibold text-slate-400">MA(5,10,30,60)</span>
              <span className="text-amber-400 font-medium">MA5: {currentMA5.toFixed(2)}</span>
              <span className="text-purple-400 font-medium">MA10: {currentMA10.toFixed(2)}</span>
              <span className="text-sky-400 font-medium">MA30: {currentMA30.toFixed(2)}</span>
              <span className="text-pink-400 font-medium">MA60: {currentMA60.toFixed(2)}</span>
            </div>

            {/* ======================================================================= */}
            {/* THE CANDLESTICK SVG CHART CANVAS */}
            {/* ======================================================================= */}
            <div className={`relative w-full overflow-hidden ${themeMode === 'light' ? 'bg-white' : 'bg-[#060a14]'}`} style={{ minHeight: '380px' }}>
            <svg
              ref={chartSvgRef}
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-[380px] select-none cursor-crosshair"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <defs>
                <pattern id="grid-pattern" width="60" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 60 0 L 0 0 0 40" fill="none" stroke={themeMode === 'light' ? '#F1F5F9' : '#1e293b'} strokeWidth="1" strokeDasharray="3,3" />
                </pattern>
              </defs>

              {/* Background Grid */}
              <rect width={chartWidth} height={chartHeight} fill="url(#grid-pattern)" />

              {/* Horizontal Price Grid Lines & Labels */}
              {[0.1, 0.25, 0.4, 0.55, 0.7, 0.85].map((pct, i) => {
                const y = 10 + pct * (mainChartHeight - 20);
                const priceVal = maxPrice - pct * (maxPrice - minPrice);
                return (
                  <g key={`grid-y-${i}`}>
                    <line x1="0" y1={y} x2={chartWidth - 75} y2={y} stroke={themeMode === 'light' ? '#E2E8F0' : '#1e293b'} strokeDasharray="4 4" strokeWidth="0.8" />
                    <text x={chartWidth - 70} y={y + 3} fill="#94a3b8" fontSize="10" fontFamily="monospace">
                      {priceVal.toFixed(2)}
                    </text>
                  </g>
                );
              })}

              {/* Peak Marker (Highest Candle Label) */}
              <g>
                <line 
                  x1={getX(candles.indexOf(highestCandle)) - 10} 
                  y1={getY(highestCandle.high) - 6} 
                  x2={getX(candles.indexOf(highestCandle)) + 30} 
                  y2={getY(highestCandle.high) - 6} 
                  stroke="#94a3b8" 
                  strokeDasharray="2 2" 
                />
                <text 
                  x={getX(candles.indexOf(highestCandle)) + 34} 
                  y={getY(highestCandle.high) - 3} 
                  fill="#64748b" 
                  fontSize="10" 
                  fontFamily="monospace"
                >
                  {highestCandle.high.toFixed(2)}
                </text>
              </g>

              {/* Trough Marker (Lowest Candle Label) */}
              <g>
                <path 
                  d={`M ${getX(candles.indexOf(lowestCandle))} ${getY(lowestCandle.low) + 4} L ${getX(candles.indexOf(lowestCandle))} ${getY(lowestCandle.low) + 14}`} 
                  stroke="#94a3b8" 
                  strokeWidth="1" 
                />
                <text 
                  x={getX(candles.indexOf(lowestCandle)) + 6} 
                  y={getY(lowestCandle.low) + 18} 
                  fill="#64748b" 
                  fontSize="10" 
                  fontFamily="monospace"
                >
                  {lowestCandle.low.toFixed(2)}
                </text>
              </g>

              {/* Candlesticks Rendering */}
              {candles.map((candle, idx) => {
                const x = getX(idx);
                const isBullish = candle.close >= candle.open;
                const candleColor = isBullish ? '#16A34A' : '#EF4444';
                
                const openY = getY(candle.open);
                const closeY = getY(candle.close);
                const highY = getY(candle.high);
                const lowY = getY(candle.low);

                const bodyTop = Math.min(openY, closeY);
                const bodyHeight = Math.max(2, Math.abs(closeY - openY));
                const bodyWidth = Math.max(3, candleWidth - candlePadding);

                return (
                  <g key={`candle-${idx}`}>
                    {/* Wick Line */}
                    <line
                      x1={x}
                      y1={highY}
                      x2={x}
                      y2={lowY}
                      stroke={candleColor}
                      strokeWidth="1.2"
                    />
                    {/* Candle Body */}
                    <rect
                      x={x - bodyWidth / 2}
                      y={bodyTop}
                      width={bodyWidth}
                      height={bodyHeight}
                      fill={candleColor}
                      rx="1"
                    />
                  </g>
                );
              })}

              {/* Moving Average Paths */}
              <path d={buildMaPath(ma5Data)} fill="none" stroke="#F59E0B" strokeWidth="1.5" />
              <path d={buildMaPath(ma10Data)} fill="none" stroke="#A855F7" strokeWidth="1.5" />
              <path d={buildMaPath(ma30Data)} fill="none" stroke="#0EA5E9" strokeWidth="1.5" />
              <path d={buildMaPath(ma60Data)} fill="none" stroke="#EC4899" strokeWidth="1.5" />

              {/* Live Current Price Horizontal Line & Badge */}
              <g>
                <line
                  x1="0"
                  y1={currentPriceY}
                  x2={chartWidth - 75}
                  y2={currentPriceY}
                  stroke="#16A34A"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                />
                {/* Green Current Price Pill on Right Axis */}
                <rect
                  x={chartWidth - 72}
                  y={currentPriceY - 9}
                  width="70"
                  height="18"
                  rx="3"
                  fill="#16A34A"
                />
                <text
                  x={chartWidth - 37}
                  y={currentPriceY + 3.5}
                  fill="#ffffff"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {livePrice.toFixed(2)}
                </text>
              </g>

              {/* ========================================================= */}
              {/* VOLUME SUB-CHART (PANE AT BOTTOM) */}
              {/* ========================================================= */}
              <g transform={`translate(0, ${chartHeight - volumeHeight - 10})`}>
                <line x1="0" y1="0" x2={chartWidth} y2="0" stroke={themeMode === 'light' ? '#E2E8F0' : '#1e293b'} strokeWidth="1" />
                <text x="12" y="14" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                  VOL(5,10,20)  MA5: {currentVolMA5}K  MA10: {currentVolMA10}K  MA20: {currentVolMA20}K  VOLUME: {inspectedCandle.volume.toFixed(2)}K
                </text>

                {/* Volume Histogram Bars */}
                {candles.map((candle, idx) => {
                  const x = getX(idx);
                  const isBullish = candle.close >= candle.open;
                  const barH = (candle.volume / maxVolume) * (volumeHeight - 25);
                  const barW = Math.max(2, candleWidth - candlePadding);

                  return (
                    <rect
                      key={`vol-${idx}`}
                      x={x - barW / 2}
                      y={volumeHeight - barH}
                      width={barW}
                      height={barH}
                      fill={isBullish ? '#16A34A' : '#EF4444'}
                      opacity="0.85"
                    />
                  );
                })}

                {/* Volume MA Curves */}
                <path d={buildVolMaPath(volMa5Data)} fill="none" stroke="#F59E0B" strokeWidth="1.2" />
                <path d={buildVolMaPath(volMa10Data)} fill="none" stroke="#A855F7" strokeWidth="1.2" />
                <path d={buildVolMaPath(volMa20Data)} fill="none" stroke="#0EA5E9" strokeWidth="1.2" />
              </g>

              {/* Bottom Time Axis Labels */}
              {candles.filter((_, i) => i % 8 === 0).map((c, i) => {
                const idx = candles.indexOf(c);
                const x = getX(idx);
                const timeParts = c.timeStr.split(' ')[1] || '21:50';
                return (
                  <text
                    key={`time-label-${i}`}
                    x={x}
                    y={chartHeight - 4}
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {timeParts}
                  </text>
                );
              })}

              {/* Crosshair & Interactive Hover Line */}
              {crosshairPos && hoveredIndex !== null && (
                <g>
                  {/* Vertical line */}
                  <line
                    x1={crosshairPos.x}
                    y1="0"
                    x2={crosshairPos.x}
                    y2={chartHeight}
                    stroke="#94a3b8"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  {/* Horizontal line */}
                  <line
                    x1="0"
                    y1={crosshairPos.y}
                    x2={chartWidth - 75}
                    y2={crosshairPos.y}
                    stroke="#94a3b8"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  {/* Time Badge at Bottom of Crosshair */}
                  <rect
                    x={crosshairPos.x - 48}
                    y={chartHeight - 16}
                    width="96"
                    height="16"
                    rx="3"
                    fill="#475569"
                  />
                  <text
                    x={crosshairPos.x}
                    y={chartHeight - 4}
                    fill="#ffffff"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {inspectedCandle.timeStr}
                  </text>

                  {/* Price Badge on Right Axis */}
                  <rect
                    x={chartWidth - 72}
                    y={crosshairPos.y - 9}
                    width="70"
                    height="18"
                    rx="3"
                    fill="#475569"
                  />
                  <text
                    x={chartWidth - 37}
                    y={crosshairPos.y + 3.5}
                    fill="#ffffff"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {(maxPrice - ((crosshairPos.y - 10) / (mainChartHeight - 20)) * (maxPrice - minPrice)).toFixed(2)}
                  </text>
                </g>
              )}
            </svg>
          </div>

          {/* ========================================================================= */}
          {/* BOTTOM LEFT: CURRENT POSITION & HISTORICAL ORDERS TABS */}
          {/* ========================================================================= */}
          <div className={`flex-1 border-t ${themeMode === 'light' ? 'border-slate-200 bg-white' : 'border-slate-800/80 bg-[#090e1d]'}`}>
            
            {/* Tabs Header */}
            <div className={`flex items-center space-x-6 px-4 border-b ${themeMode === 'light' ? 'border-slate-200' : 'border-slate-800/80 bg-[#0c1122]/60'}`}>
              <button
                id="tab-current-position-btn"
                onClick={() => setActiveBottomTab('positions')}
                className={`py-3 text-sm font-semibold transition-all relative ${
                  activeBottomTab === 'positions' 
                    ? 'text-emerald-400 font-bold' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Current position</span>
                {futurePositions.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-mono">
                    {futurePositions.length}
                  </span>
                )}
                {activeBottomTab === 'positions' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                )}
              </button>

              <button
                id="tab-order-history-btn"
                onClick={() => setActiveBottomTab('history')}
                className={`py-3 text-sm font-semibold transition-all relative ${
                  activeBottomTab === 'history' 
                    ? 'text-emerald-400 font-bold' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Order History</span>
                {futureHistory.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 text-xs font-mono">
                    {futureHistory.length}
                  </span>
                )}
                {activeBottomTab === 'history' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                )}
              </button>
            </div>

            {/* Tab 1: Current Positions View */}
            {activeBottomTab === 'positions' && (
              <div className="p-4">
                {futurePositions.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 font-mono text-xs">
                    <Timer className="h-8 w-8 mx-auto mb-2 opacity-30 text-slate-400" />
                    <p className="font-semibold text-slate-300">No active contract positions.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Select one of the 7 contract tiers on the right to open an automated contract position.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-[1150px] w-full text-left font-mono text-xs">
                      <thead>
                        <tr className={`border-b text-xs text-slate-400 uppercase ${themeMode === 'light' ? 'border-slate-100 bg-slate-50/50' : 'border-slate-800 bg-[#060a14]'}`}>
                          <th className="py-2 px-2 font-medium">Order Number</th>
                          <th className="py-2 font-medium">Level</th>
                          <th className="py-2 font-medium">Pair</th>
                          <th className="py-2 font-medium">Direction</th>
                          <th className="py-2 font-medium">Strike Price</th>
                          <th className="py-2 font-medium">Current Price</th>
                          <th className="py-2 font-medium">Specific Amount</th>
                          <th className="py-2 font-medium">Est. Payout</th>
                          <th className="py-2 font-medium">Countdown</th>
                          <th className="py-2 font-medium">Status</th>
                          <th className="py-2 font-medium text-right pr-2">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {futurePositions.map(pos => {
                          const isWinNow = pos.direction === 'bullish' 
                            ? livePrice >= pos.strikePrice 
                            : livePrice <= pos.strikePrice;

                          return (
                            <tr key={pos.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="py-3 px-2 font-semibold text-slate-700 dark:text-slate-300">
                                {pos.orderNumber}
                              </td>
                              <td className="py-3">
                                <span className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/50 text-purple-300 font-bold text-xs">
                                  Level {pos.level || 30}
                                </span>
                              </td>
                              <td className="py-3 font-bold text-slate-900 dark:text-white">
                                {pos.symbol}
                              </td>
                              <td className="py-3">
                                <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded font-bold text-xs ${
                                  pos.direction === 'bullish'
                                    ? 'bg-emerald-950/80 border border-emerald-600/40 text-emerald-300'
                                    : 'bg-rose-950/80 border border-rose-600/40 text-rose-300'
                                }`}>
                                  {pos.direction === 'bullish' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                  <span>{pos.direction === 'bullish' ? 'BUY (CALL)' : 'SELL (PUT)'}</span>
                                </span>
                              </td>
                              <td className="py-3 font-semibold text-slate-200">
                                ${pos.strikePrice.toFixed(2)}
                              </td>
                              <td className={`py-3 font-semibold ${isWinNow ? 'text-emerald-400' : 'text-rose-400'}`}>
                                ${livePrice.toFixed(2)}
                              </td>
                              <td className="py-3 font-bold text-slate-800 dark:text-slate-100">
                                {pos.investment.toLocaleString()} USDT
                              </td>
                              <td className="py-3 text-emerald-400 font-bold">
                                +{pos.potentialProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                              </td>
                              <td className="py-3">
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-800/60 text-amber-300 font-bold text-xs">
                                  <Clock className="h-3 w-3 animate-spin" />
                                  <span>{formatRemainingTime(pos.secondsRemaining)}</span>
                                </span>
                              </td>
                              <td className="py-3">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                  isWinNow 
                                    ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                                    : 'bg-rose-600 text-white'
                                }`}>
                                  {isWinNow ? 'IN MONEY (WIN)' : 'OUT OF MONEY'}
                                </span>
                              </td>
                              <td className="py-3 text-right pr-2">
                                <div className="flex items-center justify-end space-x-1.5">
                                  <button
                                    id={`cancel-position-${pos.id}`}
                                    onClick={() => handleCancelPosition(pos.id)}
                                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-white text-xs font-mono font-semibold transition-all border border-rose-800/40 shadow-sm"
                                    title="Cancel contract order and refund capital"
                                  >
                                    <XCircle className="h-3 w-3" />
                                    <span>Cancel</span>
                                  </button>
                                  <button
                                    id={`settle-early-${pos.id}`}
                                    onClick={() => handleSettleEarly(pos.id)}
                                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white text-xs font-mono font-semibold transition-all border border-slate-700 shadow-sm"
                                    title="Test contract settlement now against live market price"
                                  >
                                    <Play className="h-3 w-3" />
                                    <span>Settle Now</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Order History View with Status (filled, cancelled) & Trade Details */}
            {activeBottomTab === 'history' && (
              <FutureOrderHistoryPanel
                history={futureHistory}
                onClearHistory={clearFutureHistory}
                themeMode={themeMode}
              />
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT 4 OR 3 COLS: CONTRACT ORDER SIDEBAR */}
        {/* ========================================================================= */}
        <div className={`lg:col-span-4 xl:col-span-4 min-w-0 p-5 flex flex-col justify-between ${themeMode === 'light' ? 'bg-[#FAFAFA]' : 'bg-[#0c1122]/90 border-l border-slate-800/80'}`}>
          
          <div className="space-y-5">
            {/* Header: "Contract order" + "Bill & Rules" link */}
            <div className="flex items-center justify-between pb-1">
              <h2 className={`text-base font-bold font-mono tracking-tight ${themeMode === 'light' ? 'text-black' : 'text-white'}`}>
                Contract order
              </h2>
              <button
                id="contract-order-bill-btn"
                onClick={() => setIsBillModalOpen(true)}
                className="flex items-center space-x-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors font-medium"
              >
                <Receipt className="h-4 w-4" />
                <span>Bill & Rules</span>
              </button>
            </div>

            {/* Account USDT & Quick Demo Balance Top-up */}
            <div className={`p-4 rounded-xl border ${themeMode === 'light' ? 'bg-[#F4F4F5] border-slate-200' : 'bg-[#060a14] border-slate-800'} space-y-3 shadow-inner`}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono text-xs font-semibold uppercase tracking-wider">Account Balance</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  USDT Wallet
                </span>
              </div>
              
              <div className="flex items-baseline space-x-1.5">
                <div className={`text-2xl font-bold font-mono tracking-tight ${themeMode === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  {wallet.usdtBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <span className="text-xs font-mono font-medium text-slate-400">USDT</span>
              </div>

              {/* Quick deposit buttons */}
              <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
                <span className="block text-[11px] font-mono text-slate-400 whitespace-nowrap">Quick Top-up</span>
                <div className="grid grid-cols-4 gap-1">
                  <button
                    type="button"
                    onClick={() => addDemoUsdt(1000)}
                    className="py-1 px-0.5 text-center rounded bg-emerald-950/80 hover:bg-emerald-800 border border-emerald-700/60 text-emerald-300 font-mono text-[10px] sm:text-[11px] font-bold transition-all shadow-sm truncate"
                    title="Add 1,000 USDT"
                  >
                    +1k
                  </button>
                  <button
                    type="button"
                    onClick={() => addDemoUsdt(10000)}
                    className="py-1 px-0.5 text-center rounded bg-emerald-950/80 hover:bg-emerald-800 border border-emerald-700/60 text-emerald-300 font-mono text-[10px] sm:text-[11px] font-bold transition-all shadow-sm truncate"
                    title="Add 10,000 USDT (Level 60)"
                  >
                    +10k
                  </button>
                  <button
                    type="button"
                    onClick={() => addDemoUsdt(100000)}
                    className="py-1 px-0.5 text-center rounded bg-emerald-950/80 hover:bg-emerald-800 border border-emerald-700/60 text-emerald-300 font-mono text-[10px] sm:text-[11px] font-bold transition-all shadow-sm truncate"
                    title="Add 100,000 USDT (Level 120)"
                  >
                    +100k
                  </button>
                  <button
                    type="button"
                    onClick={() => addDemoUsdt(500000)}
                    className="py-1 px-0.5 text-center rounded bg-emerald-950/80 hover:bg-emerald-800 border border-emerald-700/60 text-emerald-300 font-mono text-[10px] sm:text-[11px] font-bold transition-all shadow-sm truncate"
                    title="Add 500,000 USDT (Level 360)"
                  >
                    +500k
                  </button>
                </div>
              </div>
            </div>

            {/* 1. 7 Contract Selections & Rules Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={`block text-xs font-bold font-mono ${themeMode === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>
                  Contract Tier
                </label>
                <span className="text-xs font-mono text-emerald-400 font-semibold">
                  Level {selectedTier.level}
                </span>
              </div>

              {/* Strict 7 selection table matching user rules image */}
              <div className={`rounded-xl border overflow-hidden ${themeMode === 'light' ? 'border-slate-200 bg-white' : 'border-slate-800 bg-[#060a14]'}`}>
                <div className={`grid grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)_auto] gap-2 py-1.5 px-2 text-[11px] font-mono uppercase tracking-wider font-semibold border-b ${themeMode === 'light' ? 'bg-slate-100/70 border-slate-200 text-slate-500' : 'bg-slate-900/80 border-slate-800 text-slate-400'}`}>
                  <div>Level</div>
                  <div className="text-right">Amount</div>
                  <div className="text-right">Reward</div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[220px] overflow-y-auto">
                  {CONTRACT_TIERS.map(tier => {
                    const isSelected = selectedTier.level === tier.level;
                    return (
                      <button
                        key={tier.level}
                        id={`tier-select-level-${tier.level}`}
                        type="button"
                        onClick={() => setSelectedTier(tier)}
                        className={`w-full grid grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)_auto] items-center gap-2 py-2.5 px-2 text-[11px] font-mono transition-all text-left ${
                          isSelected
                            ? 'bg-emerald-950/70 text-emerald-300 font-bold border-l-4 border-l-emerald-400 shadow-inner'
                            : themeMode === 'light'
                              ? 'hover:bg-slate-50 text-slate-700'
                              : 'hover:bg-slate-800/50 text-slate-300'
                        }`}
                      >
                        <div className="min-w-0">
                          <span className={`whitespace-nowrap ${isSelected ? 'text-emerald-300 font-bold' : ''}`}>
                            Level {tier.level}
                          </span>
                        </div>
                        <div className="whitespace-nowrap text-right font-semibold">
                          <span className={isSelected ? 'text-white' : ''}>
                            {tier.amount.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1">USDT</span>
                        </div>
                        <div className="whitespace-nowrap text-right font-bold text-emerald-400">
                          {tier.displayRate}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 2. Specific Contract Amount (Strictly locked & Non-editable) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={`block text-xs font-bold font-mono ${themeMode === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>
                  Specific Amount
                </label>
                <div className="flex items-center space-x-1 text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                  <Lock className="h-3 w-3" />
                  <span>Locked / Fixed</span>
                </div>
              </div>

              {/* Locked specific amount display - NO EDITING ALLOWED */}
              <div className={`p-3.5 rounded-xl border relative overflow-hidden ${
                themeMode === 'light' 
                  ? 'bg-[#F4F4F5] border-slate-200' 
                  : 'bg-[#060a14] border-slate-800/90'
              }`}>
                <div className="flex flex-col items-start gap-2">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold font-mono tracking-tight text-emerald-400">
                      {selectedTier.amount.toLocaleString()}
                    </span>
                    <span className="text-xs font-mono font-medium text-slate-400">USDT</span>
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
                      {selectedTier.label}
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-start space-x-1.5 text-xs font-mono text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Fixed Amount Rule: Investment amount is fixed and non-editable. It is tied strictly to Level {selectedTier.level} with a {selectedTier.displayRate} reward.
                  </span>
                </div>
              </div>
            </div>

            {/* Order Preview Breakdown */}
            <div className={`p-3.5 rounded-xl border text-xs font-mono space-y-2 ${themeMode === 'light' ? 'bg-[#F4F4F5] border-slate-200 text-slate-600' : 'bg-[#060a14] border-slate-800 text-slate-300'}`}>
              <div className="flex items-center justify-between">
                <span>Contract Tier:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedTier.label}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Specific Investment:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedTier.amount.toLocaleString()} USDT</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Contract Reward Rate:</span>
                <span className="font-bold text-emerald-400">+{selectedTier.displayRate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Expected Profit:</span>
                <span className="font-bold text-emerald-400">+{expectedProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200/80 dark:border-slate-800 pt-2">
                <span>Total Expected Return:</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {expectedPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                </span>
              </div>
            </div>

            {/* Toast Notification */}
            {orderToast && (
              <div className={`p-3 rounded-xl text-xs font-mono flex items-center space-x-2 ${
                orderToast.type === 'success' 
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' 
                  : 'bg-rose-950/80 text-rose-300 border border-rose-800'
              }`}>
                {orderToast.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                <span>{orderToast.message}</span>
              </div>
            )}
          </div>

          {/* Execution Buttons: Buy (Bullish) and Sell (Bearish) */}
          <div className="pt-5 grid grid-cols-2 gap-3">
            <button
              id="future-buy-bullish-btn"
              disabled={isSubmitting}
              onClick={() => handlePlaceOrder('bullish')}
              className="w-full py-3.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 active:scale-[0.98] text-white font-mono font-bold text-xs shadow-[0_0_16px_rgba(16,185,129,0.3)] transition-all flex flex-col items-center justify-center space-y-0.5 disabled:opacity-50"
            >
              <div className="flex items-center space-x-1">
                <ArrowUp className="h-4 w-4" />
                <span>BUY (BULLISH)</span>
              </div>
              <span className="text-xs font-normal opacity-90">Call / Up (+{selectedTier.displayRate})</span>
            </button>

            <button
              id="future-sell-bearish-btn"
              disabled={isSubmitting}
              onClick={() => handlePlaceOrder('bearish')}
              className="w-full py-3.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 active:scale-[0.98] text-white font-mono font-bold text-xs shadow-[0_0_16px_rgba(244,63,94,0.3)] transition-all flex flex-col items-center justify-center space-y-0.5 disabled:opacity-50"
            >
              <div className="flex items-center space-x-1">
                <ArrowDown className="h-4 w-4" />
                <span>SELL (BEARISH)</span>
              </div>
              <span className="text-xs font-normal opacity-90">Put / Down (+{selectedTier.displayRate})</span>
            </button>
          </div>
        </div>
      </div>
    </div>

      {/* ========================================================================= */}
      {/* 3. CONTRACT BILL / STATEMENT & RULES MODAL */}
      {/* ========================================================================= */}
      {isBillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl p-6 ${themeMode === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0c1122] border-slate-800 text-white'}`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Receipt className="h-5 w-5 text-emerald-400" />
                <h3 className="text-lg font-bold font-mono">Contract Statement & 7 Tiers Rules</h3>
              </div>
              <button
                onClick={() => setIsBillModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Info on 7 Tiers */}
            <div className="py-4 space-y-4">
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/40">
                <div className="flex items-center space-x-2 text-purple-300 font-bold font-mono text-xs mb-1">
                  <ShieldCheck className="h-4 w-4 text-purple-400" />
                  <span>Strict 7 Selections Policy</span>
                </div>
                <p className="text-xs font-mono text-slate-300 leading-relaxed">
                  Future trading provides exactly 7 fixed contract levels. Each level determines the fixed investment amount and reward rate.
                </p>
              </div>

              {/* 7 Tiers reference table */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden font-mono text-xs">
                <div className="grid grid-cols-3 py-2 px-3 bg-slate-100 dark:bg-slate-900 text-xs font-bold text-slate-400 uppercase">
                  <span>Level</span>
                  <span className="text-right">Specific Amount</span>
                  <span className="text-right">Reward Rate</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-48 overflow-y-auto">
                  {CONTRACT_TIERS.map(tier => (
                    <div key={tier.level} className="grid grid-cols-3 py-2 px-3 items-center hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <span className="font-bold text-purple-400">Level {tier.level}</span>
                      <span className="text-right font-bold text-slate-100">{tier.amount.toLocaleString()} USDT</span>
                      <span className="text-right font-bold text-emerald-400">+{tier.displayRate}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#060a14]">
                  <div className="text-xs text-slate-400 font-mono">Total Settled</div>
                  <div className="text-lg font-bold font-mono mt-1">{futureHistory.length} Orders</div>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#060a14]">
                  <div className="text-xs text-slate-400 font-mono">Winning Orders</div>
                  <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                    {futureHistory.filter(h => h.status === 'won').length}
                  </div>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#060a14]">
                  <div className="text-xs text-slate-400 font-mono">Net Settled PnL</div>
                  <div className={`text-lg font-bold font-mono mt-1 ${
                    futureHistory.reduce((acc, c) => acc + (c.pnl || 0), 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {futureHistory.reduce((acc, c) => acc + (c.pnl || 0), 0) >= 0 ? '+' : ''}
                    {futureHistory.reduce((acc, c) => acc + (c.pnl || 0), 0).toFixed(2)} USDT
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setIsBillModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold transition-all shadow-[0_0_12px_rgba(168,85,247,0.3)]"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
