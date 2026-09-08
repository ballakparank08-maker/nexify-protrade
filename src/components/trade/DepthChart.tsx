import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  ShieldCheck, 
  Layers, 
  Maximize2, 
  SlidersHorizontal,
  ArrowRightLeft,
  Sparkles,
  Zap,
  Info
} from 'lucide-react';
import { CryptoAsset, OrderBookEntry } from '../../types';

interface DepthChartProps {
  selectedAsset: CryptoAsset;
  orderBook: {
    asks: OrderBookEntry[];
    bids: OrderBookEntry[];
  };
  onSelectPrice?: (price: number) => void;
  compact?: boolean;
}

export const DepthChart: React.FC<DepthChartProps> = ({
  selectedAsset,
  orderBook,
  onSelectPrice,
  compact = false
}) => {
  // Zoom / Depth Span filter (percentage distance from mid)
  const [depthSpan, setDepthSpan] = useState<number | 'all'>(2.0);
  // Curve style: stepped (limit order steps) or smooth (monotone)
  const [curveType, setCurveType] = useState<'step' | 'monotone'>('step');
  // Metric unit: 'token' or 'usd'
  const [volumeUnit, setVolumeUnit] = useState<'token' | 'usd'>('token');
  // Price copied feedback
  const [copiedPrice, setCopiedPrice] = useState<number | null>(null);

  const midPrice = selectedAsset.price;

  // Compute processed depth data
  const { 
    chartData, 
    totalBidVol, 
    totalAskVol, 
    totalBidUsd, 
    totalAskUsd, 
    buyPressurePct, 
    sellPressurePct,
    supportWall,
    resistanceWall,
    spreadUsd,
    spreadPct,
    bestBid,
    bestAsk
  } = useMemo(() => {
    // 1. Sort raw asks ascending from lowest to highest
    // In orderBook.asks, it is reversed (highest at top). We need lowest ask first.
    const sortedAsks = [...orderBook.asks].sort((a, b) => a.price - b.price);
    // 2. Sort raw bids descending from highest to lowest
    const sortedBids = [...orderBook.bids].sort((a, b) => b.price - a.price);

    const bBid = sortedBids[0]?.price || midPrice;
    const bAsk = sortedAsks[0]?.price || midPrice;
    const spUsd = Math.max(0, bAsk - bBid);
    const spPct = midPrice > 0 ? (spUsd / midPrice) * 100 : 0;

    // Filter by depthSpan if not 'all'
    const filterBids = depthSpan === 'all' 
      ? sortedBids 
      : sortedBids.filter(b => ((midPrice - b.price) / midPrice) * 100 <= depthSpan);

    const filterAsks = depthSpan === 'all' 
      ? sortedAsks 
      : sortedAsks.filter(a => ((a.price - midPrice) / midPrice) * 100 <= depthSpan);

    const activeBids = filterBids.length >= 4 ? filterBids : sortedBids.slice(0, 10);
    const activeAsks = filterAsks.length >= 4 ? filterAsks : sortedAsks.slice(0, 10);

    // Compute cumulative bids (accumulating downwards from highest bid to lowest bid)
    let bidAccum = 0;
    let bidUsdAccum = 0;
    let maxBidSize = 0;
    let supWall: { price: number; amount: number; totalUsd: number } | null = null;

    const bidPoints = activeBids.map(b => {
      bidAccum += b.amount;
      bidUsdAccum += b.amount * b.price;
      if (b.amount > maxBidSize) {
        maxBidSize = b.amount;
        supWall = { price: b.price, amount: b.amount, totalUsd: b.amount * b.price };
      }
      return {
        price: b.price,
        cumulativeVol: parseFloat(bidAccum.toFixed(4)),
        cumulativeUsd: parseFloat(bidUsdAccum.toFixed(2)),
        amount: b.amount,
        type: 'bid' as const,
        pctFromMid: parseFloat((((b.price - midPrice) / midPrice) * 100).toFixed(2))
      };
    });

    // Compute cumulative asks (accumulating upwards from lowest ask to highest ask)
    let askAccum = 0;
    let askUsdAccum = 0;
    let maxAskSize = 0;
    let resWall: { price: number; amount: number; totalUsd: number } | null = null;

    const askPoints = activeAsks.map(a => {
      askAccum += a.amount;
      askUsdAccum += a.amount * a.price;
      if (a.amount > maxAskSize) {
        maxAskSize = a.amount;
        resWall = { price: a.price, amount: a.amount, totalUsd: a.amount * a.price };
      }
      return {
        price: a.price,
        cumulativeVol: parseFloat(askAccum.toFixed(4)),
        cumulativeUsd: parseFloat(askUsdAccum.toFixed(2)),
        amount: a.amount,
        type: 'ask' as const,
        pctFromMid: parseFloat((((a.price - midPrice) / midPrice) * 100).toFixed(2))
      };
    });

    // To plot properly from left to right:
    // Bids must be ordered by price ASCENDING (lowest bid on far left, highest bid near mid)
    const reversedBids = [...bidPoints].reverse();

    // Pressure percentages
    const totalVol = (bidAccum + askAccum) || 1;
    const bPress = (bidAccum / totalVol) * 100;
    const aPress = (askAccum / totalVol) * 100;

    // Assemble final chart data array
    // We map to uniform keys: bidVolume (for bids), askVolume (for asks)
    const data: Array<{
      price: number;
      bidVolume: number | null;
      askVolume: number | null;
      displayVol: number;
      displayUsd: number;
      amount: number;
      type: 'bid' | 'ask' | 'mid';
      pctFromMid: number;
    }> = [];

    // Add bid points
    reversedBids.forEach(b => {
      data.push({
        price: b.price,
        bidVolume: volumeUnit === 'usd' ? b.cumulativeUsd : b.cumulativeVol,
        askVolume: null,
        displayVol: b.cumulativeVol,
        displayUsd: b.cumulativeUsd,
        amount: b.amount,
        type: 'bid',
        pctFromMid: b.pctFromMid
      });
    });

    // Anchor at mid price (baseline)
    data.push({
      price: midPrice,
      bidVolume: 0,
      askVolume: 0,
      displayVol: 0,
      displayUsd: 0,
      amount: 0,
      type: 'mid',
      pctFromMid: 0
    });

    // Add ask points
    askPoints.forEach(a => {
      data.push({
        price: a.price,
        bidVolume: null,
        askVolume: volumeUnit === 'usd' ? a.cumulativeUsd : a.cumulativeVol,
        displayVol: a.cumulativeVol,
        displayUsd: a.cumulativeUsd,
        amount: a.amount,
        type: 'ask',
        pctFromMid: a.pctFromMid
      });
    });

    return {
      chartData: data,
      totalBidVol: bidAccum,
      totalAskVol: askAccum,
      totalBidUsd: bidUsdAccum,
      totalAskUsd: askUsdAccum,
      buyPressurePct: parseFloat(bPress.toFixed(1)),
      sellPressurePct: parseFloat(aPress.toFixed(1)),
      supportWall: supWall,
      resistanceWall: resWall,
      spreadUsd: spUsd,
      spreadPct: spPct,
      bestBid: bBid,
      bestAsk: bAsk
    };
  }, [orderBook, midPrice, depthSpan, volumeUnit]);

  // Handle clicking on chart or wall pill
  const handlePriceClick = (price: number) => {
    if (onSelectPrice) {
      onSelectPrice(price);
      setCopiedPrice(price);
      setTimeout(() => setCopiedPrice(null), 2500);
    }
  };

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0]?.payload;
    if (!item || item.type === 'mid') return null;

    const isBid = item.type === 'bid';
    const distText = item.pctFromMid === 0 ? 'At Mid Market' : `${item.pctFromMid > 0 ? '+' : ''}${item.pctFromMid}% from mid`;

    return (
      <div className="rounded-xl border border-slate-700/80 bg-[#080d1a]/95 p-3 font-mono text-xs shadow-2xl backdrop-blur-xl z-50 pointer-events-none min-w-[210px] space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
          <span className={`flex items-center space-x-1.5 font-bold ${isBid ? 'text-emerald-400' : 'text-rose-400'}`}>
            <span className={`inline-block h-2 w-2 rounded-full ${isBid ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400 animate-pulse'}`} />
            <span>{isBid ? 'BUY DEPTH (BIDS)' : 'SELL DEPTH (ASKS)'}</span>
          </span>
          <span className="text-xs text-slate-400">{distText}</span>
        </div>

        <div className="space-y-1 text-slate-300">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Price:</span>
            <span className="font-bold text-white">${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Level Size:</span>
            <span className="text-slate-200">{item.amount.toFixed(4)} {selectedAsset.symbol}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Cumulative Vol:</span>
            <span className={`font-bold ${isBid ? 'text-emerald-300' : 'text-rose-300'}`}>
              {item.displayVol.toFixed(3)} {selectedAsset.symbol}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Cumulative USDT:</span>
            <span className="text-purple-300 font-semibold">${item.displayUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        <div className="border-t border-slate-800/80 pt-1 text-xs text-purple-400 flex items-center justify-center space-x-1">
          <Zap className="h-3 w-3" />
          <span>Click to prefill order price</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full space-y-3 font-mono">
      {/* 1. Buy vs Sell Pressure Bar & Primary Analytics */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 space-y-2.5">
        {/* Pressure Ratio & Metrics */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-emerald-400 font-bold flex items-center space-x-1">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>BUY PRESSURE: {buyPressurePct}%</span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400 text-xs">
              Bid Liquidity: <strong className="text-emerald-300">${(totalBidUsd / 1000).toFixed(1)}k</strong> ({totalBidVol.toFixed(2)} {selectedAsset.symbol})
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-400 text-xs">
              Ask Liquidity: <strong className="text-rose-300">${(totalAskUsd / 1000).toFixed(1)}k</strong> ({totalAskVol.toFixed(2)} {selectedAsset.symbol})
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-rose-400 font-bold flex items-center space-x-1">
              <span>SELL PRESSURE: {sellPressurePct}%</span>
              <TrendingDown className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>

        {/* Visual Bid/Ask Balance Meter Bar */}
        <div className="relative h-2.5 w-full rounded-full bg-slate-950 overflow-hidden flex shadow-inner border border-slate-800">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
            style={{ width: `${buyPressurePct}%` }}
          />
          <div 
            className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" 
            style={{ width: `${sellPressurePct}%` }}
          />
          {/* Center Mid-Market Divider */}
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2 bg-white/40 shadow" />
        </div>

        {/* Secondary Info Strip: Sentiment, Spread, and Detected Walls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-400">
          {/* Sentiment Badge */}
          <div className="flex items-center space-x-2">
            <span className="text-slate-500">Market Skew:</span>
            {buyPressurePct > 54 ? (
              <span className="rounded-full bg-emerald-950/80 border border-emerald-700/60 px-2 py-0.5 text-emerald-300 font-semibold flex items-center space-x-1">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                <span>Bullish Depth (+{(buyPressurePct - sellPressurePct).toFixed(1)}% Bids)</span>
              </span>
            ) : sellPressurePct > 54 ? (
              <span className="rounded-full bg-rose-950/80 border border-rose-700/60 px-2 py-0.5 text-rose-300 font-semibold flex items-center space-x-1">
                <ShieldAlert className="h-3 w-3 text-rose-400" />
                <span>Bearish Depth (+{(sellPressurePct - buyPressurePct).toFixed(1)}% Asks)</span>
              </span>
            ) : (
              <span className="rounded-full bg-slate-800/80 border border-slate-700/60 px-2 py-0.5 text-slate-300 font-medium">
                Balanced Order Flow (Equilibrium)
              </span>
            )}
            
            <span className="text-slate-500">Spread:</span>
            <span className="text-slate-300">${spreadUsd.toFixed(2)} ({spreadPct.toFixed(3)}%)</span>
          </div>

          {/* Significant Walls Detection */}
          <div className="flex items-center space-x-2">
            {supportWall && (
              <button
                onClick={() => handlePriceClick(supportWall.price)}
                className="rounded-lg bg-emerald-950/50 border border-emerald-800/50 px-2 py-0.5 text-xs text-emerald-300 hover:bg-emerald-900/60 transition-colors flex items-center space-x-1"
                title="Click to set Order Price to Buy Wall"
              >
                <span>🛡️ Support Wall:</span>
                <strong className="underline">${supportWall.price}</strong>
                <span className="text-emerald-400">({supportWall.amount.toFixed(2)})</span>
              </button>
            )}

            {resistanceWall && (
              <button
                onClick={() => handlePriceClick(resistanceWall.price)}
                className="rounded-lg bg-rose-950/50 border border-rose-800/50 px-2 py-0.5 text-xs text-rose-300 hover:bg-rose-900/60 transition-colors flex items-center space-x-1"
                title="Click to set Order Price to Resistance Wall"
              >
                <span>🧱 Resist Wall:</span>
                <strong className="underline">${resistanceWall.price}</strong>
                <span className="text-rose-400">({resistanceWall.amount.toFixed(2)})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Controls Toolbar: Depth Range, Curve Type, Volume Metric */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
        {/* Depth Range Filter */}
        <div className="flex items-center space-x-1">
          <span className="text-slate-500 text-xs mr-1">Zoom:</span>
          {([0.5, 1.0, 2.0, 5.0, 'all'] as const).map(span => (
            <button
              key={span}
              onClick={() => setDepthSpan(span)}
              className={`rounded px-2 py-0.5 text-xs transition-all ${
                depthSpan === span
                  ? 'bg-purple-900/60 text-purple-200 font-bold border border-purple-600/50 shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-900/50 border border-transparent'
              }`}
            >
              {span === 'all' ? 'Full Book' : `±${span}%`}
            </button>
          ))}
        </div>

        {/* Display Options */}
        <div className="flex items-center space-x-3 text-xs">
          {/* Curve Shape Toggle */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/80 p-0.5">
            <button
              onClick={() => setCurveType('step')}
              className={`rounded px-2 py-0.5 transition-colors ${
                curveType === 'step' ? 'bg-purple-950 text-purple-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Stepped: accurate limit order stairs"
            >
              Steps
            </button>
            <button
              onClick={() => setCurveType('monotone')}
              className={`rounded px-2 py-0.5 transition-colors ${
                curveType === 'monotone' ? 'bg-purple-950 text-purple-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Smooth: continuous curve"
            >
              Smooth
            </button>
          </div>

          {/* Unit Toggle */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/80 p-0.5">
            <button
              onClick={() => setVolumeUnit('token')}
              className={`rounded px-2 py-0.5 transition-colors ${
                volumeUnit === 'token' ? 'bg-purple-950 text-purple-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {selectedAsset.symbol}
            </button>
            <button
              onClick={() => setVolumeUnit('usd')}
              className={`rounded px-2 py-0.5 transition-colors ${
                volumeUnit === 'usd' ? 'bg-purple-950 text-purple-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              USDT
            </button>
          </div>

          {copiedPrice && (
            <span className="rounded bg-purple-900/90 border border-purple-500 px-2 py-0.5 text-xs text-purple-200 animate-fade-in">
              Copied ${copiedPrice} to Order
            </span>
          )}
        </div>
      </div>

      {/* 3. Recharts AreaChart Canvas */}
      <div className="relative flex-1 min-h-[320px] w-full rounded-xl border border-slate-900 bg-[#060a14] p-2 overflow-hidden select-none">
        {/* Mid Price Watermark / Center Badge */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none rounded-lg border border-purple-500/40 bg-purple-950/80 px-2.5 py-1 text-xs font-mono text-purple-200 shadow-lg backdrop-blur-md flex items-center space-x-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-400 animate-ping" />
          <span>Mid: ${midPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 35, right: 10, left: 10, bottom: 5 }}
            onClick={(state: any) => {
              if (state && state.activePayload && state.activePayload.length > 0) {
                const targetPrice = state.activePayload[0].payload.price;
                if (targetPrice) handlePriceClick(targetPrice);
              }
            }}
          >
            <defs>
              {/* Green Gradient for Bids */}
              <linearGradient id="bidDepthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
                <stop offset="60%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
              </linearGradient>

              {/* Red Gradient for Asks */}
              <linearGradient id="askDepthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.45} />
                <stop offset="60%" stopColor="#ef4444" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            {/* X-Axis: Price ($) */}
            <XAxis
              dataKey="price"
              stroke="#475569"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#1e293b' }}
              tickFormatter={(val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: val > 100 ? 0 : 2 })}`}
              domain={['dataMin', 'dataMax']}
              type="number"
            />

            {/* Y-Axis: Cumulative Depth */}
            <YAxis
              orientation="right"
              stroke="#475569"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#1e293b' }}
              tickFormatter={(val: number) => {
                if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
                return val.toFixed(1);
              }}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Reference Line at Mid Price */}
            <ReferenceLine
              x={midPrice}
              stroke="#a855f7"
              strokeDasharray="3 3"
              strokeWidth={1.5}
            />

            {/* Bids Depth Area */}
            <Area
              type={curveType === 'step' ? 'stepAfter' : 'monotone'}
              dataKey="bidVolume"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#bidDepthGradient)"
              isAnimationActive={false}
              connectNulls={false}
            />

            {/* Asks Depth Area */}
            <Area
              type={curveType === 'step' ? 'stepBefore' : 'monotone'}
              dataKey="askVolume"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#askDepthGradient)"
              isAnimationActive={false}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Corner Legend Indicators */}
        <div className="absolute bottom-2 left-3 pointer-events-none flex items-center space-x-2 rounded bg-slate-950/80 px-2 py-1 text-xs text-emerald-400 border border-emerald-900/40">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>BIDS (BUY ORDERS)</span>
        </div>

        <div className="absolute bottom-2 right-12 pointer-events-none flex items-center space-x-2 rounded bg-slate-950/80 px-2 py-1 text-xs text-rose-400 border border-rose-950/40">
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          <span>ASKS (SELL ORDERS)</span>
        </div>
      </div>

      {/* 4. Bottom Order Book Depth Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-2 text-center">
          <div className="text-xs text-slate-400">Best Bid</div>
          <div className="text-emerald-400 font-bold mt-0.5">${bestBid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-2 text-center">
          <div className="text-xs text-slate-400">Best Ask</div>
          <div className="text-rose-400 font-bold mt-0.5">${bestAsk.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-2 text-center">
          <div className="text-xs text-slate-400">Bid/Ask Ratio</div>
          <div className="text-purple-300 font-bold mt-0.5">{(buyPressurePct / (sellPressurePct || 1)).toFixed(2)}x</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-2 text-center">
          <div className="text-xs text-slate-400">Depth Liquidity</div>
          <div className="text-white font-bold mt-0.5">${((totalBidUsd + totalAskUsd) / 1000).toFixed(0)}k USDT</div>
        </div>
      </div>
    </div>
  );
};
