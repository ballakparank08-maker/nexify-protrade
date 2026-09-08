import React, { useState } from 'react';
import { 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  ArrowLeftRight,
  TrendingUp, 
  TrendingDown, 
  Eye, 
  EyeOff, 
  Layers, 
  Gauge, 
  Activity, 
  Clock, 
  Copy, 
  CheckCircle2, 
  ExternalLink, 
  Search, 
  Filter, 
  Info,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Bell
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { CRYPTO_INDICES } from '../../data/mockData';
import { PortfolioAssetCards } from './PortfolioAssetCards';
import { MiniLineChart } from './MiniLineChart';

export const PortfolioView: React.FC = () => {
  const { 
    totalPortfolioUsd, 
    unrealizedPnl24h, 
    wallet, 
    cryptoAssets, 
    transactions,
    currency,
    setCurrency,
    formatCurrency,
    setIsDepositModalOpen,
    setIsWithdrawModalOpen,
    setModalTargetAsset,
    setSelectedAssetId,
    setCurrentTab,
    openPriceAlertModal,
    activeAlertsCount
  } = useTrading();

  const [showBalances, setShowBalances] = useState(true);
  const [txFilter, setTxFilter] = useState<'all' | 'deposits_withdrawals' | 'trades' | 'staking_loans'>('all');
  const [searchTx, setSearchTx] = useState('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Filtered transactions
  const filteredTransactions = transactions.filter(tx => {
    if (txFilter === 'deposits_withdrawals') {
      if (!['deposit', 'withdraw'].includes(tx.type)) return false;
    } else if (txFilter === 'trades') {
      if (!['spot_buy', 'spot_sell'].includes(tx.type)) return false;
    } else if (txFilter === 'staking_loans') {
      if (!['stake', 'unstake', 'borrow', 'repay', 'claim_reward'].includes(tx.type)) return false;
    }

    if (searchTx) {
      const q = searchTx.toLowerCase();
      return (
        tx.asset.toLowerCase().includes(q) ||
        tx.type.toLowerCase().includes(q) ||
        tx.txHash.toLowerCase().includes(q) ||
        tx.network.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate allocated crypto vs available USDT
  const totalCryptoValue = totalPortfolioUsd - wallet.usdtBalance;
  const pnlPercent = totalPortfolioUsd > 0 ? (unrealizedPnl24h / totalPortfolioUsd) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* 1. Assets Summary Card */}
      <div className="rounded-2xl border border-white/10 bg-[#090e1d]/90 p-6 sm:p-7 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        {/* Glow ambient background accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 blur-[90px] rounded-full pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2.5 text-xs font-mono text-slate-300">
              <span className="font-semibold tracking-wider">TOTAL PORTFOLIO NET WORTH</span>
              <span className="rounded-md bg-purple-950/80 border border-purple-800/60 px-2 py-0.5 text-xs text-purple-300 font-bold">
                {currency}
              </span>
              <button 
                onClick={() => setShowBalances(!showBalances)} 
                className="text-slate-300 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-800/50"
                title={showBalances ? 'Hide Balance' : 'Show Balance'}
              >
                {showBalances ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white">
                {showBalances ? formatCurrency(totalPortfolioUsd) : '••••••••••••'}
              </span>

              {showBalances && currency !== 'USD' && (
                <span className="text-xs font-mono text-slate-300 self-center">
                  ≈ ${totalPortfolioUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </span>
              )}

              <div className={`flex items-center space-x-1.5 rounded-lg px-3 py-1 text-xs font-mono font-semibold ${
                unrealizedPnl24h >= 0 
                  ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/40' 
                  : 'bg-rose-950/70 text-rose-300 border border-rose-800/40'
              }`}>
                {unrealizedPnl24h >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                <span>
                  {unrealizedPnl24h >= 0 ? '+' : ''}{formatCurrency(unrealizedPnl24h)} ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                </span>
                <span className="text-xs opacity-80 ml-1">24h</span>
              </div>
            </div>

            {/* Quick breakdown sub-metrics */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs font-mono">
              <div>
                <span className="text-slate-300 font-medium">Available Liquid Cash:</span>
                <div className="text-white font-bold text-sm mt-0.5">
                  {showBalances ? `${formatCurrency(wallet.usdtBalance)} (${wallet.usdtBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} USDT)` : '••••••'}
                </div>
              </div>
              <div>
                <span className="text-slate-300 font-medium">Allocated Crypto Assets:</span>
                <div className="text-purple-300 font-bold text-sm mt-0.5">
                  {showBalances ? formatCurrency(totalCryptoValue) : '••••••'}
                </div>
              </div>
              <div>
                <span className="text-slate-300 font-medium">Connected Custody:</span>
                <div className="text-cyan-300 font-bold text-sm mt-0.5 flex items-center">
                  <ShieldCheck className="h-4 w-4 mr-1 text-purple-400" />
                  {wallet.network}
                </div>
              </div>
            </div>
          </div>

          {/* Portfolio Action Buttons */}
          <div className="flex flex-row lg:flex-col sm:flex-row gap-3">
            <button
              id="portfolio-deposit-action-btn"
              onClick={() => {
                setModalTargetAsset('USDT');
                setIsDepositModalOpen(true);
              }}
              className="flex-1 flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all hover:scale-105 hover:brightness-110"
            >
              <ArrowDownToLine className="h-4 w-4" />
              <span>Deposit Funds</span>
            </button>

            <button
              id="portfolio-convert-action-btn"
              onClick={() => setCurrentTab('convert')}
              className="flex-1 flex items-center justify-center space-x-2 rounded-xl border border-cyan-500/40 bg-cyan-950/40 px-6 py-3 text-sm font-medium text-cyan-200 transition-all hover:border-cyan-400 hover:bg-cyan-900/50"
            >
              <ArrowLeftRight className="h-4 w-4 text-cyan-300" />
              <span>Convert Assets</span>
            </button>

            <button
              id="portfolio-withdraw-action-btn"
              onClick={() => {
                setModalTargetAsset('USDT');
                setIsWithdrawModalOpen(true);
              }}
              className="flex-1 flex items-center justify-center space-x-2 rounded-xl border border-slate-700 bg-slate-800/80 px-6 py-3 text-sm font-medium text-slate-200 transition-all hover:border-purple-500/50 hover:bg-slate-800"
            >
              <ArrowUpFromLine className="h-4 w-4 text-slate-300" />
              <span>Withdraw Funds</span>
            </button>

            <button
              id="portfolio-price-alerts-action-btn"
              onClick={() => openPriceAlertModal()}
              className="flex items-center justify-center space-x-2 rounded-xl border border-purple-500/40 bg-purple-950/40 px-4 py-3 text-sm font-medium text-purple-200 transition-all hover:border-purple-400 hover:bg-purple-900/50"
              title="Set or view custom price alerts"
            >
              <Bell className="h-4 w-4 text-purple-400" />
              <span>Price Alerts</span>
              {activeAlertsCount > 0 && (
                <span className="rounded-full bg-purple-600 px-2 py-0.5 text-xs font-bold text-white">
                  {activeAlertsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* User Holding Breakdown Badges */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <span className="text-xs font-mono text-slate-300 uppercase tracking-wider block mb-2.5 font-medium">
            Holdings Snapshot:
          </span>
          <div className="flex flex-wrap gap-2.5">
            {(Object.entries(wallet.assets) as [string, number][]).map(([sym, amtRaw]) => {
              const amt = Number(amtRaw) || 0;
              if (amt <= 0) return null;
              const asset = cryptoAssets.find(a => a.symbol === sym);
              const usdVal = asset ? amt * asset.price : 0;
              const isGain = (asset?.change24h || 0) >= 0;
              return (
                <div 
                  key={sym} 
                  onClick={() => {
                    if (asset) {
                      setSelectedAssetId(asset.id);
                      setCurrentTab('spot');
                    }
                  }}
                  className="cursor-pointer flex items-center space-x-2 rounded-xl border border-white/10 bg-[#060a14] px-3.5 py-2 text-xs font-mono transition-all hover:border-purple-500/40 hover:bg-slate-900"
                >
                  <span className="font-bold text-white">{sym}</span>
                  <span className="text-slate-300">{amt.toFixed(amt < 1 ? 4 : 2)}</span>
                  <span className="text-purple-300 font-medium">
                    ({formatCurrency(usdVal, { precision: currency === 'BTC' ? 4 : 0 })})
                  </span>
                  {asset && (
                    <span className={`text-xs font-bold ${isGain ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isGain ? '+' : ''}{asset.change24h}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Portfolio Asset Cards with 24-Hour Performance Trend Mini-Line Charts */}
      <PortfolioAssetCards
        cryptoAssets={cryptoAssets}
        wallet={wallet}
        totalPortfolioUsd={totalPortfolioUsd}
        currency={currency}
        formatCurrency={formatCurrency}
        showBalances={showBalances}
        onTradeAsset={(assetId) => {
          setSelectedAssetId(assetId);
          setCurrentTab('spot');
        }}
        onDepositAsset={(sym) => {
          setModalTargetAsset(sym);
          setIsDepositModalOpen(true);
        }}
        onWithdrawAsset={(sym) => {
          setModalTargetAsset(sym);
          setIsWithdrawModalOpen(true);
        }}
        onAlertAsset={(asset) => {
          openPriceAlertModal(asset);
        }}
      />

      {/* 3. Two Real Market Indicators Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Market Indicator 1: Crypto Fear & Greed Index Gauge */}
        <div className="rounded-2xl border border-white/10 bg-[#090e1d]/90 p-5 sm:p-6 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
            <div className="flex items-center space-x-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-950/80 border border-purple-800/60 text-purple-400">
                <Gauge className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Crypto Fear & Greed Index</h3>
                <p className="text-xs text-slate-300">Real-time market sentiment & volatility gauge</p>
              </div>
            </div>
            <span className="rounded-md bg-emerald-950/80 border border-emerald-800/50 px-2.5 py-1 text-xs font-mono font-bold text-emerald-300">
              GREED (68 / 100)
            </span>
          </div>

          <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-5">
            {/* Visual Gauge Meter */}
            <div className="relative flex flex-col items-center justify-center p-2">
              <svg className="w-36 h-20" viewBox="0 0 160 90">
                <path
                  d="M 15 80 A 65 65 0 0 1 145 80"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="14"
                  strokeLinecap="round"
                />
                <path
                  d="M 15 80 A 65 65 0 0 1 145 80"
                  fill="none"
                  stroke="url(#fearGreedGradient)"
                  strokeWidth="14"
                  strokeDasharray="204"
                  strokeDashoffset={204 - (204 * 0.68)}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="fearGreedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="50%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="text-center -mt-6">
                <div className="text-2xl font-black font-mono text-emerald-400">68</div>
                <div className="text-xs text-slate-300 font-mono uppercase font-medium">Bullish Appetite</div>
              </div>
            </div>

            {/* Historical Sentiment Comparison */}
            <div className="flex-1 w-full space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-slate-300">Yesterday:</span>
                <span className="text-emerald-400 font-medium">64 (Greed)</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-slate-300">Last Week:</span>
                <span className="text-yellow-400 font-medium">55 (Neutral)</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-300">Last Month:</span>
                <span className="text-rose-400 font-medium">42 (Fear)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Market Indicator 2: Volatility & Liquidation Momentum Index */}
        <div className="rounded-2xl border border-white/10 bg-[#090e1d]/90 p-5 sm:p-6 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
            <div className="flex items-center space-x-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
                <Activity className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Volatility & Liquidation Metric</h3>
                <p className="text-xs text-slate-300">24h CVI index & derivative liquidation flows</p>
              </div>
            </div>
            <span className="rounded-md bg-cyan-950/80 border border-cyan-800/50 px-2.5 py-1 text-xs font-mono font-bold text-cyan-300">
              CVI: 58.4 (MODERATE)
            </span>
          </div>

          <div className="mt-5 space-y-3.5 font-mono text-xs">
            {/* Long vs Short Liquidation Bar */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1.5 font-medium">
                <span>Long Liquidations: $42.1M (61.5%)</span>
                <span>Short Liquidations: $26.3M (38.5%)</span>
              </div>
              <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                <div className="bg-emerald-500 h-full" style={{ width: '61.5%' }}></div>
                <div className="bg-rose-500 h-full" style={{ width: '38.5%' }}></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5 pt-2">
              <div className="rounded-xl border border-white/10 bg-[#060a14] p-3">
                <div className="text-slate-300 text-xs font-medium">24H TAKER VOLUME DELTA</div>
                <div className="text-emerald-400 font-bold text-sm mt-1">+8.42% Bullish</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#060a14] p-3">
                <div className="text-slate-300 text-xs font-medium">ANNUALIZED VOLATILITY</div>
                <div className="text-purple-300 font-bold text-sm mt-1">52.8% (Historical)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Crypto Indices Table ("Cripto indics table") */}
      <div className="rounded-2xl border border-white/10 bg-[#090e1d]/90 p-5 sm:p-6 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-950/80 border border-indigo-800/60 text-indigo-400">
              <Layers className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Crypto Market Indices</h3>
              <p className="text-xs text-slate-300">Institutional capital-weighted exposure baskets</p>
            </div>
          </div>

          <div className="text-xs font-mono text-purple-300 flex items-center space-x-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Quarterly Algorithmic Rebalancing</span>
          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-300 uppercase text-xs">
                <th className="pb-3.5 font-semibold">Index Name</th>
                <th className="pb-3.5 font-semibold">Symbol</th>
                <th className="pb-3.5 font-semibold">Current Value ({currency})</th>
                <th className="pb-3.5 font-semibold">24h Change</th>
                <th className="pb-3.5 font-semibold">Market Cap</th>
                <th className="pb-3.5 font-semibold">Top Constituents</th>
                <th className="pb-3.5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {CRYPTO_INDICES.map(idx => (
                <tr key={idx.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 pr-4">
                    <div className="font-bold text-white text-sm">{idx.name}</div>
                    <div className="text-xs text-slate-300 font-sans line-clamp-1 mt-0.5">{idx.description}</div>
                  </td>
                  <td className="py-4 font-bold text-purple-400">{idx.symbol}</td>
                  <td className="py-4 text-white font-semibold">
                    {formatCurrency(idx.value)}
                  </td>
                  <td className="py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                      idx.change24h >= 0 ? 'bg-emerald-950/60 text-emerald-300' : 'bg-rose-950/60 text-rose-300'
                    }`}>
                      {idx.change24h >= 0 ? '+' : ''}{idx.change24h}%
                    </span>
                  </td>
                  <td className="py-4 text-slate-300">{idx.marketCap}</td>
                  <td className="py-4">
                    <div className="flex flex-wrap gap-1.5 max-w-xs">
                      {idx.constituents.slice(0, 4).map(c => (
                        <span key={c} className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-200">
                          {c}
                        </span>
                      ))}
                      {idx.constituents.length > 4 && (
                        <span className="rounded-md bg-slate-800/60 px-2 py-0.5 text-xs text-slate-400">
                          +{idx.constituents.length - 4}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    <button
                      onClick={() => {
                        setCurrentTab('spot');
                      }}
                      className="rounded-lg border border-purple-500/40 bg-purple-950/40 px-3.5 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-900/60 hover:border-purple-400 transition-all"
                    >
                      Trade
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Recent Transactions Ledger */}
      <div className="rounded-2xl border border-white/10 bg-[#090e1d]/90 p-5 sm:p-6 backdrop-blur-xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-950/80 border border-purple-800/60 text-purple-400">
              <Clock className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Recent Transactions</h3>
              <p className="text-xs text-slate-300">Audit trail of deposits, trades, staking, and credit activity</p>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setTxFilter('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-mono transition-colors ${
                txFilter === 'all' ? 'bg-purple-900/60 text-purple-200 border border-purple-700/50 font-semibold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              All ({transactions.length})
            </button>
            <button
              onClick={() => setTxFilter('deposits_withdrawals')}
              className={`rounded-lg px-3 py-1.5 text-xs font-mono transition-colors ${
                txFilter === 'deposits_withdrawals' ? 'bg-purple-900/60 text-purple-200 border border-purple-700/50 font-semibold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Deposits & Withdrawals
            </button>
            <button
              onClick={() => setTxFilter('trades')}
              className={`rounded-lg px-3 py-1.5 text-xs font-mono transition-colors ${
                txFilter === 'trades' ? 'bg-purple-900/60 text-purple-200 border border-purple-700/50 font-semibold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Spot Trades
            </button>
            <button
              onClick={() => setTxFilter('staking_loans')}
              className={`rounded-lg px-3 py-1.5 text-xs font-mono transition-colors ${
                txFilter === 'staking_loans' ? 'bg-purple-900/60 text-purple-200 border border-purple-700/50 font-semibold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Staking & Loans
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-300 uppercase text-xs">
                <th className="pb-3.5 font-semibold">Type</th>
                <th className="pb-3.5 font-semibold">Asset & Amount</th>
                <th className="pb-3.5 font-semibold">Value ({currency})</th>
                <th className="pb-3.5 font-semibold">Network / Engine</th>
                <th className="pb-3.5 font-semibold">Status</th>
                <th className="pb-3.5 font-semibold">Transaction Hash</th>
                <th className="pb-3.5 font-semibold text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No transactions matching this filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => {
                  let typeColor = 'text-slate-300 bg-slate-800';
                  let typeLabel = tx.type;

                  if (tx.type === 'deposit') {
                    typeColor = 'text-emerald-300 bg-emerald-950/80 border border-emerald-800/40';
                    typeLabel = 'DEPOSIT';
                  } else if (tx.type === 'withdraw') {
                    typeColor = 'text-rose-300 bg-rose-950/80 border border-rose-800/40';
                    typeLabel = 'WITHDRAW';
                  } else if (tx.type === 'spot_buy') {
                    typeColor = 'text-cyan-300 bg-cyan-950/80 border border-cyan-800/40';
                    typeLabel = 'SPOT BUY';
                  } else if (tx.type === 'spot_sell') {
                    typeColor = 'text-amber-300 bg-amber-950/80 border border-amber-800/40';
                    typeLabel = 'SPOT SELL';
                  } else if (tx.type === 'stake') {
                    typeColor = 'text-purple-300 bg-purple-950/80 border border-purple-800/40';
                    typeLabel = 'STAKE';
                  } else if (tx.type === 'borrow') {
                    typeColor = 'text-blue-300 bg-blue-950/80 border border-blue-800/40';
                    typeLabel = 'LOAN BORROW';
                  } else if (tx.type === 'claim_reward') {
                    typeColor = 'text-pink-300 bg-pink-950/80 border border-pink-800/40';
                    typeLabel = 'CLAIM REWARD';
                  }

                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold ${typeColor}`}>
                          {typeLabel}
                        </span>
                      </td>
                      <td className="py-3.5 font-semibold text-white">
                        {tx.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {tx.asset}
                      </td>
                      <td className="py-3.5 text-slate-200 font-medium">
                        {formatCurrency(tx.usdValue)}
                      </td>
                      <td className="py-3.5 text-slate-300">{tx.network}</td>
                      <td className="py-3.5">
                        <span className={`inline-flex items-center space-x-1.5 text-xs font-semibold ${
                          tx.status === 'completed' ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span className="capitalize">{tx.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5">
                        <button
                          onClick={() => copyHash(tx.txHash)}
                          className="flex items-center space-x-1.5 text-slate-300 hover:text-purple-300 transition-colors"
                          title="Copy Tx Hash"
                        >
                          <span>{tx.txHash}</span>
                          <Copy className="h-3.5 w-3.5" />
                          {copiedHash === tx.txHash && <span className="text-emerald-400 text-xs font-bold">Copied!</span>}
                        </button>
                      </td>
                      <td className="py-3.5 text-right text-slate-400">{tx.timestamp}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
