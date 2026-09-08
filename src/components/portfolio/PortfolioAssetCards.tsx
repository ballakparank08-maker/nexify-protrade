import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowRight, 
  Bell, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Search, 
  LayoutGrid, 
  List, 
  Sparkles,
  PieChart,
  Percent
} from 'lucide-react';
import { CryptoAsset, UserWallet } from '../../types';
import { MiniLineChart } from './MiniLineChart';

interface PortfolioAssetCardsProps {
  cryptoAssets: CryptoAsset[];
  wallet: UserWallet;
  totalPortfolioUsd: number;
  currency: string;
  formatCurrency: (amount: number, options?: { precision?: number }) => string;
  showBalances: boolean;
  onTradeAsset: (assetId: string) => void;
  onDepositAsset: (symbol: string) => void;
  onWithdrawAsset: (symbol: string) => void;
  onAlertAsset: (asset: CryptoAsset) => void;
}

export const PortfolioAssetCards: React.FC<PortfolioAssetCardsProps> = ({
  cryptoAssets,
  wallet,
  totalPortfolioUsd,
  currency,
  formatCurrency,
  showBalances,
  onTradeAsset,
  onDepositAsset,
  onWithdrawAsset,
  onAlertAsset,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTrend, setFilterTrend] = useState<'all' | 'gainers' | 'losers'>('all');
  const [sortBy, setSortBy] = useState<'value' | 'change' | 'balance' | 'name'>('value');

  // Map held assets from wallet to enriched asset objects
  const heldAssetList = useMemo(() => {
    const rawEntries = Object.entries(wallet.assets) as [string, number][];
    const items = rawEntries
      .map(([sym, amtRaw]) => {
        const amount = Number(amtRaw) || 0;
        const asset = cryptoAssets.find(a => a.symbol.toUpperCase() === sym.toUpperCase());
        const price = asset?.price || 0;
        const totalUsdValue = amount * price;
        const change24h = asset?.change24h || 0;
        const sparkline = asset?.sparkline || [price * 0.98, price * 1.01, price];
        const portfolioShare = totalPortfolioUsd > 0 ? (totalUsdValue / totalPortfolioUsd) * 100 : 0;

        return {
          symbol: sym,
          amount,
          asset,
          price,
          totalUsdValue,
          change24h,
          sparkline,
          portfolioShare,
          name: asset?.name || sym,
          category: asset?.category || 'Crypto',
          iconBg: asset?.iconBg || '#6366f1',
          assetId: asset?.id || sym.toLowerCase()
        };
      })
      .filter(item => item.amount > 0);

    return items;
  }, [wallet.assets, cryptoAssets, totalPortfolioUsd]);

  // Filter & Search
  const filteredAndSortedAssets = useMemo(() => {
    return heldAssetList
      .filter(item => {
        if (filterTrend === 'gainers' && item.change24h < 0) return false;
        if (filterTrend === 'losers' && item.change24h >= 0) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return (
            item.name.toLowerCase().includes(q) ||
            item.symbol.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'value') return b.totalUsdValue - a.totalUsdValue;
        if (sortBy === 'change') return b.change24h - a.change24h;
        if (sortBy === 'balance') return b.amount - a.amount;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [heldAssetList, filterTrend, searchQuery, sortBy]);

  // Aggregate stats
  const totalHeldCount = heldAssetList.length;
  const bestPerformer = useMemo(() => {
    if (!heldAssetList.length) return null;
    return [...heldAssetList].sort((a, b) => b.change24h - a.change24h)[0];
  }, [heldAssetList]);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#090e1d]/90 p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-5">
      {/* Header: Title, Total assets badge, Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-white/10 gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-950/80 border border-purple-800/60 text-purple-400 shadow-md">
            <PieChart className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white tracking-tight">Held Asset Portfolio</h3>
              <span className="rounded-full bg-purple-900/60 border border-purple-700/50 px-2.5 py-0.5 text-xs font-mono text-purple-200 font-semibold">
                {totalHeldCount} Active {totalHeldCount === 1 ? 'Asset' : 'Assets'}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Interactive 24-hour performance trends, mini-line curves, and real-time holdings
            </p>
          </div>
        </div>

        {/* View Switcher & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search held assets..."
              className="rounded-lg border border-white/10 bg-[#060a14] pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:border-purple-500 focus:outline-none w-36 sm:w-44 font-mono transition-all"
            />
          </div>

          {/* Trend filter pills */}
          <div className="flex items-center rounded-lg bg-[#060a14] p-1 border border-white/10 text-xs font-mono">
            <button
              type="button"
              onClick={() => setFilterTrend('all')}
              className={`rounded-md px-2.5 py-1 transition-colors ${
                filterTrend === 'all' ? 'bg-purple-900/60 text-purple-200 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterTrend('gainers')}
              className={`rounded-md px-2.5 py-1 transition-colors ${
                filterTrend === 'gainers' ? 'bg-emerald-950 text-emerald-300 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Gainers
            </button>
            <button
              type="button"
              onClick={() => setFilterTrend('losers')}
              className={`rounded-md px-2.5 py-1 transition-colors ${
                filterTrend === 'losers' ? 'bg-rose-950 text-rose-300 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Losers
            </button>
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="rounded-lg border border-white/10 bg-[#060a14] px-3 py-1.5 text-xs font-mono text-slate-200 focus:border-purple-500 focus:outline-none"
          >
            <option value="value">Sort: Total Value</option>
            <option value="change">Sort: 24h Change</option>
            <option value="balance">Sort: Balance</option>
            <option value="name">Sort: Token Name</option>
          </select>

          {/* View Mode Toggle: Grid vs Table */}
          <div className="flex items-center rounded-lg bg-[#060a14] p-1 border border-white/10">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Highlights Banner if available */}
      {bestPerformer && (
        <div className="flex flex-wrap items-center justify-between rounded-xl bg-purple-950/30 border border-purple-800/40 px-4 py-2.5 text-xs font-mono text-purple-200">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            <span>24h Portfolio Leader:</span>
            <strong className="text-white">{bestPerformer.name} ({bestPerformer.symbol})</strong>
            <span className="rounded-md bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 text-xs text-emerald-300 font-bold">
              +{bestPerformer.change24h}%
            </span>
          </div>
          <div className="text-slate-300 text-xs hidden sm:block">
            Allocated Value: {showBalances ? formatCurrency(bestPerformer.totalUsdValue) : '••••••'} ({bestPerformer.portfolioShare.toFixed(1)}%)
          </div>
        </div>
      )}

      {/* Grid View of Asset Cards */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAndSortedAssets.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 font-mono text-xs">
              No held assets match the current filters.
            </div>
          ) : (
            filteredAndSortedAssets.map(item => {
              const isGain = item.change24h >= 0;
              return (
                <div
                  key={item.symbol}
                  id={`portfolio-asset-card-${item.symbol.toLowerCase()}`}
                  className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-[#060a14]/90 p-5 transition-all duration-200 hover:border-purple-500/50 hover:bg-[#070d1d] hover:shadow-[0_4px_24px_rgba(168,85,247,0.12)]"
                >
                  {/* Top Bar: Asset Icon, Name, Category & 24h Change Badge */}
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl font-bold text-white text-xs shadow-md transition-transform group-hover:scale-105"
                          style={{ backgroundColor: item.iconBg }}
                        >
                          {item.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                              {item.name}
                            </h4>
                            <span className="text-xs font-mono font-semibold text-slate-300">
                              {item.symbol}
                            </span>
                          </div>
                          <span className="inline-block rounded-md bg-slate-800/80 px-2 py-0.5 text-xs font-mono text-slate-300">
                            {item.category}
                          </span>
                        </div>
                      </div>

                      {/* 24h Change Pill */}
                      <div className={`flex items-center space-x-1.5 rounded-lg px-2.5 py-1 text-xs font-mono font-bold ${
                        isGain
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                          : 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                      }`}>
                        {isGain ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                        <span>{isGain ? '+' : ''}{item.change24h}%</span>
                      </div>
                    </div>

                    {/* Holdings Metrics: Balance, Value, Market Price */}
                    <div className="mt-4 grid grid-cols-2 gap-2 pt-3.5 border-t border-white/10 font-mono">
                      <div>
                        <span className="text-xs uppercase text-slate-300 block font-medium">Holding Balance</span>
                        <div className="text-sm font-bold text-white mt-0.5">
                          {showBalances ? `${item.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${item.symbol}` : '••••••'}
                        </div>
                        <span className="text-xs text-slate-300 block">
                          @ ${item.price.toLocaleString(undefined, { minimumFractionDigits: item.price > 100 ? 2 : 4 })}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs uppercase text-slate-300 block font-medium">Total Value ({currency})</span>
                        <div className="text-sm font-extrabold text-purple-200 mt-0.5">
                          {showBalances ? formatCurrency(item.totalUsdValue) : '••••••'}
                        </div>
                        <span className="text-xs text-slate-300 flex items-center justify-end space-x-1">
                          <Percent className="h-3 w-3 opacity-70" />
                          <span>{item.portfolioShare.toFixed(1)}% share</span>
                        </span>
                      </div>
                    </div>

                    {/* Portfolio Share Micro-Progress Bar */}
                    <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-900 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(3, item.portfolioShare))}%` }}
                      />
                    </div>

                    {/* 24-Hour Trend Mini-Line Chart Section */}
                    <div className="mt-4 pt-2.5 border-t border-white/5">
                      <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-1.5">
                        <span className="flex items-center space-x-1.5">
                          <span className={`inline-block h-2 w-2 rounded-full ${isGain ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          <span className="font-semibold text-slate-200">24h Performance Trend</span>
                        </span>
                        <span className="text-slate-400">Live Tick</span>
                      </div>

                      {/* Embedded Mini-Line Chart Component */}
                      <MiniLineChart
                        data={item.sparkline}
                        change24h={item.change24h}
                        height={52}
                        currentPrice={item.price}
                        symbol={item.symbol}
                        showRange={true}
                        showTooltip={true}
                      />
                    </div>
                  </div>

                  {/* Card Action Buttons Footer */}
                  <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between gap-2 font-mono text-xs">
                    <button
                      type="button"
                      onClick={() => onTradeAsset(item.assetId)}
                      className="flex-1 flex items-center justify-center space-x-1.5 rounded-xl bg-purple-600/90 hover:bg-purple-600 text-white font-semibold py-2 transition-all shadow-[0_0_12px_rgba(168,85,247,0.25)] hover:scale-[1.02]"
                    >
                      <span>Trade</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDepositAsset(item.symbol)}
                      title={`Deposit ${item.symbol}`}
                      className="flex items-center justify-center rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2 text-slate-200 hover:text-white hover:border-slate-700 transition-colors"
                    >
                      <ArrowDownToLine className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onWithdrawAsset(item.symbol)}
                      title={`Withdraw ${item.symbol}`}
                      className="flex items-center justify-center rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2 text-slate-200 hover:text-white hover:border-slate-700 transition-colors"
                    >
                      <ArrowUpFromLine className="h-4 w-4" />
                    </button>

                    {item.asset && (
                      <button
                        type="button"
                        onClick={() => onAlertAsset(item.asset!)}
                        title={`Set Price Alert for ${item.symbol}`}
                        className="flex items-center justify-center rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2 text-slate-200 hover:text-purple-300 hover:border-purple-600/50 transition-colors"
                      >
                        <Bell className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Detailed Table View with embedded Mini-Line Charts */
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-300 uppercase text-xs">
                <th className="pb-3.5 font-semibold">Asset</th>
                <th className="pb-3.5 font-semibold">Price</th>
                <th className="pb-3.5 font-semibold">24h Change</th>
                <th className="pb-3.5 font-semibold">Holdings</th>
                <th className="pb-3.5 font-semibold">Value ({currency})</th>
                <th className="pb-3.5 font-semibold">Allocation</th>
                <th className="pb-3.5 font-semibold w-40">24h Trend</th>
                <th className="pb-3.5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAndSortedAssets.map(item => (
                <tr key={item.symbol} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 pr-3">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg font-bold text-white text-xs"
                        style={{ backgroundColor: item.iconBg }}
                      >
                        {item.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{item.name}</div>
                        <div className="text-xs text-slate-300">{item.symbol} • {item.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 font-bold text-white">
                    ${item.price.toLocaleString(undefined, { minimumFractionDigits: item.price > 100 ? 2 : 4 })}
                  </td>
                  <td className="py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                      item.change24h >= 0 ? 'bg-emerald-950/60 text-emerald-300' : 'bg-rose-950/60 text-rose-300'
                    }`}>
                      {item.change24h >= 0 ? '+' : ''}{item.change24h}%
                    </span>
                  </td>
                  <td className="py-3.5 font-semibold text-white">
                    {showBalances ? `${item.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${item.symbol}` : '••••••'}
                  </td>
                  <td className="py-3.5 font-bold text-purple-200">
                    {showBalances ? formatCurrency(item.totalUsdValue) : '••••••'}
                  </td>
                  <td className="py-3.5 text-slate-200">
                    <div className="flex items-center space-x-2">
                      <span>{item.portfolioShare.toFixed(1)}%</span>
                      <div className="h-1.5 w-12 rounded-full bg-slate-800 overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${Math.min(100, item.portfolioShare)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 w-40">
                    <MiniLineChart
                      data={item.sparkline}
                      change24h={item.change24h}
                      height={34}
                      showRange={false}
                      showTooltip={true}
                      currentPrice={item.price}
                      symbol={item.symbol}
                    />
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onTradeAsset(item.assetId)}
                      className="rounded-lg bg-purple-600/90 hover:bg-purple-600 px-3 py-1 font-semibold text-white text-xs transition-colors"
                    >
                      Trade
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
