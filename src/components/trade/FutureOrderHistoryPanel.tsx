import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Download, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Receipt, 
  Copy, 
  Check, 
  ExternalLink,
  Filter,
  X,
  FileSpreadsheet,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { FutureContractPosition } from '../../types';

interface FutureOrderHistoryPanelProps {
  history: FutureContractPosition[];
  onClearHistory: () => void;
  themeMode?: 'light' | 'dark';
}

export const FutureOrderHistoryPanel: React.FC<FutureOrderHistoryPanelProps> = ({
  history,
  onClearHistory,
  themeMode = 'dark'
}) => {
  // Filter and Search States
  const [statusFilter, setStatusFilter] = useState<'all' | 'filled' | 'cancelled'>('all');
  const [pairFilter, setPairFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Selected Trade for Detail Modal
  const [selectedTrade, setSelectedTrade] = useState<FutureContractPosition | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Copy helper
  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Extract distinct pairs
  const distinctPairs = useMemo(() => {
    const pairs = new Set<string>();
    history.forEach(item => pairs.add(item.symbol));
    return Array.from(pairs);
  }, [history]);

  // Determine if a trade is filled vs cancelled
  const isCancelled = (item: FutureContractPosition) => {
    return item.status === 'cancelled' || item.status === 'canceled';
  };

  const isFilled = (item: FutureContractPosition) => {
    return item.status === 'filled' || item.status === 'won' || item.status === 'lost';
  };

  // Filtered trade list
  const filteredTrades = useMemo(() => {
    return history.filter(item => {
      // Status filter
      if (statusFilter === 'filled' && !isFilled(item)) {
        return false;
      }
      if (statusFilter === 'cancelled' && !isCancelled(item)) {
        return false;
      }

      // Pair filter
      if (pairFilter !== 'all' && item.symbol !== pairFilter) {
        return false;
      }

      // Search query (Order Number, Symbol, TxHash, or Reason)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesOrder = item.orderNumber.toLowerCase().includes(query);
        const matchesSymbol = item.symbol.toLowerCase().includes(query);
        const matchesTx = item.txHash ? item.txHash.toLowerCase().includes(query) : false;
        const matchesReason = item.cancelReason ? item.cancelReason.toLowerCase().includes(query) : false;
        return matchesOrder || matchesSymbol || matchesTx || matchesReason;
      }

      return true;
    });
  }, [history, statusFilter, pairFilter, searchQuery]);

  // Quick statistics
  const stats = useMemo(() => {
    let totalInvested = 0;
    let totalRealizedPnl = 0;
    let filledCount = 0;
    let cancelledCount = 0;
    let wonCount = 0;

    history.forEach(item => {
      if (isCancelled(item)) {
        cancelledCount++;
      } else {
        filledCount++;
        totalInvested += item.investment;
        const pnl = item.pnl ?? (item.status === 'won' ? item.potentialProfit : -item.investment);
        totalRealizedPnl += pnl;
        if (item.status === 'won' || (item.pnl && item.pnl > 0)) {
          wonCount++;
        }
      }
    });

    const winRate = filledCount > 0 ? (wonCount / filledCount) * 100 : 0;

    return {
      totalTrades: history.length,
      filledCount,
      cancelledCount,
      totalInvested,
      totalRealizedPnl,
      winRate
    };
  }, [history]);

  // CSV Export handler
  const handleExportCsv = () => {
    if (history.length === 0) return;

    const headers = [
      'Order Number',
      'Symbol',
      'Direction',
      'Contract Level',
      'Strike Price',
      'Settlement Price',
      'Investment (USDT)',
      'Profit Rate',
      'Realized PnL (USDT)',
      'Status',
      'Created At',
      'Settled/Cancelled At',
      'Tx Hash',
      'Notes'
    ];

    const rows = filteredTrades.map(item => {
      const cancelled = isCancelled(item);
      const won = item.status === 'won' || (item.pnl && item.pnl > 0);
      const statusLabel = cancelled ? 'CANCELLED' : won ? 'FILLED (WON)' : 'FILLED (LOST)';
      const pnlVal = cancelled ? '0.00' : (item.pnl ?? (won ? item.potentialProfit : -item.investment)).toFixed(2);

      return [
        item.orderNumber,
        item.symbol,
        item.direction.toUpperCase(),
        `Level ${item.level || 30}`,
        item.strikePrice.toFixed(2),
        item.settlementPrice ? item.settlementPrice.toFixed(2) : item.strikePrice.toFixed(2),
        item.investment.toFixed(2),
        `${(item.profitRate * 100).toFixed(0)}%`,
        pnlVal,
        statusLabel,
        item.createdAt,
        item.settledAt || item.createdAt,
        item.txHash || 'N/A',
        cancelled ? (item.cancelReason || 'Order cancelled by trader') : 'Smart contract settled'
      ].map(v => `"${v}"`).join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Nexify_Future_Order_History_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isLight = themeMode === 'light';

  return (
    <div id="future-order-history-panel" className="p-4 space-y-4">
      {/* Top Controls & Metrics Ribbon */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-white/5">
        {/* Metric Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className={`px-2.5 py-1 rounded-lg border flex items-center space-x-1.5 ${
            isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-[#080d1a] border-white/10 text-slate-300'
          }`}>
            <span className="text-slate-400">Total Past Trades:</span>
            <span className="font-bold text-white">{stats.totalTrades}</span>
          </div>

          <div className={`px-2.5 py-1 rounded-lg border flex items-center space-x-1.5 ${
            isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
          }`}>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Filled:</span>
            <span className="font-bold">{stats.filledCount}</span>
          </div>

          <div className={`px-2.5 py-1 rounded-lg border flex items-center space-x-1.5 ${
            isLight ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
          }`}>
            <XCircle className="h-3.5 w-3.5 text-amber-400" />
            <span>Cancelled:</span>
            <span className="font-bold">{stats.cancelledCount}</span>
          </div>

          <div className={`px-2.5 py-1 rounded-lg border flex items-center space-x-1.5 ${
            stats.totalRealizedPnl >= 0 
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
              : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
          }`}>
            <span>Realized PnL:</span>
            <span className="font-bold">
              {stats.totalRealizedPnl >= 0 ? '+' : ''}${stats.totalRealizedPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
            </span>
          </div>
        </div>

        {/* Action Controls: Export CSV & Clear */}
        <div className="flex items-center space-x-2">
          {history.length > 0 && (
            <>
              <button
                id="export-future-history-csv-btn"
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-mono font-medium border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition"
                title="Export Order History as CSV"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-cyan-400" />
                <span>Export CSV</span>
              </button>

              <button
                id="clear-future-history-btn"
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear your future contract order history?')) {
                    onClearHistory();
                  }
                }}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-mono font-medium border border-rose-900/40 bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 hover:text-rose-200 transition"
                title="Clear Historical Trades"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                <span>Clear History</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Filter Buttons */}
        <div className="flex items-center space-x-1 bg-[#060a14] p-1 rounded-xl border border-white/10">
          <button
            id="filter-status-all-btn"
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 text-xs font-mono rounded-lg transition ${
              statusFilter === 'all'
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Orders ({history.length})
          </button>

          <button
            id="filter-status-filled-btn"
            type="button"
            onClick={() => setStatusFilter('filled')}
            className={`inline-flex items-center space-x-1 px-3 py-1 text-xs font-mono rounded-lg transition ${
              statusFilter === 'filled'
                ? 'bg-emerald-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <CheckCircle2 className="h-3 w-3" />
            <span>Filled ({stats.filledCount})</span>
          </button>

          <button
            id="filter-status-cancelled-btn"
            type="button"
            onClick={() => setStatusFilter('cancelled')}
            className={`inline-flex items-center space-x-1 px-3 py-1 text-xs font-mono rounded-lg transition ${
              statusFilter === 'cancelled'
                ? 'bg-amber-600 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <XCircle className="h-3 w-3" />
            <span>Cancelled ({stats.cancelledCount})</span>
          </button>
        </div>

        {/* Pair selector & Search Input */}
        <div className="flex items-center space-x-2">
          {distinctPairs.length > 1 && (
            <div className="relative">
              <select
                id="pair-filter-select"
                value={pairFilter}
                onChange={(e) => setPairFilter(e.target.value)}
                className="bg-[#060a14] border border-white/10 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Pairs</option>
                {distinctPairs.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          )}

          <div className="relative w-full md:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              id="search-history-input"
              type="text"
              placeholder="Search Order / Pair..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#060a14] border border-white/10 rounded-lg pl-8 pr-7 py-1 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Order History Table */}
      {filteredTrades.length === 0 ? (
        <div className="py-14 text-center text-slate-400 font-mono text-xs">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-40 text-slate-400" />
          <p className="font-semibold text-slate-300">No past trades found matching the filter.</p>
          <p className="text-xs text-slate-400 mt-1">
            Settled and cancelled contract positions automatically appear in this panel.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-[1150px] w-full text-left font-mono text-xs">
            <thead>
              <tr className={`border-b text-xs text-slate-300 uppercase ${
                isLight ? 'border-slate-200 bg-slate-100' : 'border-white/10 bg-[#060a14]'
              }`}>
                <th className="py-3 px-3 font-semibold">Order Number</th>
                <th className="py-3 px-2 font-semibold">Level</th>
                <th className="py-3 px-2 font-semibold">Pair</th>
                <th className="py-3 px-2 font-semibold">Direction</th>
                <th className="py-3 px-2 font-semibold">Strike Price</th>
                <th className="py-3 px-2 font-semibold">Settled / Closed</th>
                <th className="py-3 px-2 font-semibold">Size</th>
                <th className="py-3 px-2 font-semibold">Realized PnL</th>
                <th className="py-3 px-2 font-semibold">Date & Time</th>
                <th className="py-3 px-2 font-semibold">Status</th>
                <th className="py-3 pr-3 text-right font-semibold">Trade Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTrades.map(item => {
                const cancelled = isCancelled(item);
                const isWon = item.status === 'won' || (item.pnl !== undefined && item.pnl > 0);
                const pnlValue = item.pnl ?? (isWon ? item.potentialProfit : -item.investment);

                return (
                  <tr 
                    key={item.id} 
                    onClick={() => setSelectedTrade(item)}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                  >
                    {/* Order Number */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-semibold text-slate-200 group-hover:text-cyan-400 transition">
                          {item.orderNumber}
                        </span>
                      </div>
                    </td>

                    {/* Contract level */}
                    <td className="py-3.5 px-2">
                      <span className="px-2.5 py-1 rounded-md bg-purple-950/60 border border-purple-800/50 text-purple-300 font-bold text-xs">
                        Level {item.level || 30}
                      </span>
                    </td>

                    {/* Trading Pair */}
                    <td className="py-3.5 px-2 font-bold text-white">
                      {item.symbol}
                    </td>

                    {/* Direction */}
                    <td className="py-3.5 px-2">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-bold ${
                        item.direction === 'bullish'
                          ? 'bg-emerald-950/80 border border-emerald-600/40 text-emerald-300'
                          : 'bg-rose-950/80 border border-rose-600/40 text-rose-300'
                      }`}>
                        {item.direction === 'bullish' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
                        <span>{item.direction === 'bullish' ? 'BUY (CALL)' : 'SELL (PUT)'}</span>
                      </span>
                    </td>

                    {/* Strike Price */}
                    <td className="py-3.5 px-2 text-slate-200">
                      ${item.strikePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Settled Price */}
                    <td className="py-3.5 px-2">
                      {cancelled ? (
                        <span className="text-slate-400 italic">Cancelled</span>
                      ) : (
                        <span className="font-semibold text-slate-200">
                          ${(item.settlementPrice ?? item.currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                    </td>

                    {/* Specific Size */}
                    <td className="py-3.5 px-2 text-slate-200 font-semibold">
                      {item.investment.toLocaleString()} USDT
                    </td>

                    {/* Realized PnL */}
                    <td className="py-3.5 px-2">
                      {cancelled ? (
                        <span className="text-slate-300 font-medium">$0.00 (Refunded)</span>
                      ) : (
                        <span className={`font-bold ${isWon ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isWon ? `+${pnlValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT` : `-${Math.abs(pnlValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`}
                        </span>
                      )}
                    </td>

                    {/* Date / Time */}
                    <td className="py-3.5 px-2 text-slate-300 text-xs">
                      {item.settledAt || item.createdAt}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-2">
                      {cancelled ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-600/40 text-amber-300 text-xs font-bold">
                          <XCircle className="h-3.5 w-3.5" />
                          <span>CANCELLED</span>
                        </span>
                      ) : (
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          isWon
                            ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
                            : 'bg-rose-950/80 border border-rose-500/50 text-rose-300'
                        }`}>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>FILLED ({isWon ? 'WON' : 'LOST'})</span>
                        </span>
                      )}
                    </td>

                    {/* Action: Trade Details */}
                    <td className="py-3.5 pr-3 text-right">
                      <button
                        id={`view-trade-details-${item.id}`}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTrade(item);
                        }}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-cyan-950/60 border border-white/10 hover:border-cyan-500/50 text-slate-200 hover:text-cyan-300 text-xs font-mono transition"
                        title="View Full Trade Details"
                      >
                        <Receipt className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TRADE DETAILS MODAL */}
      {/* ========================================================================= */}
      {selectedTrade && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setSelectedTrade(null)}
        >
          <div 
            className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0c101c] p-6 text-white shadow-2xl space-y-5 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className={`p-2 rounded-xl border ${
                  isCancelled(selectedTrade)
                    ? 'bg-amber-950/50 border-amber-500/40 text-amber-300'
                    : (selectedTrade.status === 'won' || (selectedTrade.pnl && selectedTrade.pnl > 0))
                    ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/50 border-rose-500/40 text-rose-300'
                }`}>
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-mono text-white">
                    Future Trade Details
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
                    <span>Order: {selectedTrade.orderNumber}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedTrade.orderNumber, 'orderNumber')}
                      className="hover:text-cyan-400 transition"
                      title="Copy Order Number"
                    >
                      {copiedField === 'orderNumber' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTrade(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Status Banner */}
            <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isCancelled(selectedTrade)
                ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                : (selectedTrade.status === 'won' || (selectedTrade.pnl && selectedTrade.pnl > 0))
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
            }`}>
              <div className="flex items-center space-x-2">
                {isCancelled(selectedTrade) ? (
                  <XCircle className="h-5 w-5 text-amber-400" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                )}
                <div>
                  <div className="font-bold text-xs font-mono uppercase tracking-wider">
                    {isCancelled(selectedTrade) 
                      ? 'ORDER CANCELLED - CAPITAL REFUNDED' 
                      : (selectedTrade.status === 'won' || (selectedTrade.pnl && selectedTrade.pnl > 0))
                      ? 'ORDER FILLED - CONTRACT WON'
                      : 'ORDER FILLED - CONTRACT EXPIRED'}
                  </div>
                  <div className="text-xs text-slate-300">
                    {isCancelled(selectedTrade)
                      ? (selectedTrade.cancelReason || 'Trader cancelled contract before lock settlement.')
                      : 'Automated contract settlement executed against real-time pricing oracle.'}
                  </div>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                isCancelled(selectedTrade)
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {isCancelled(selectedTrade) ? 'CANCELLED' : 'FILLED'}
              </span>
            </div>

            {/* Trade Details 2-Column Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#060a14] border border-white/5 space-y-1">
                <span className="text-slate-400">Asset / Pair</span>
                <p className="font-bold text-white text-sm">{selectedTrade.symbol}</p>
              </div>

              <div className="p-3 rounded-xl bg-[#060a14] border border-white/5 space-y-1">
                <span className="text-slate-400">Contract Direction</span>
                <p className={`font-bold text-sm ${selectedTrade.direction === 'bullish' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {selectedTrade.direction === 'bullish' ? 'CALL (BULLISH)' : 'PUT (BEARISH)'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#060a14] border border-white/5 space-y-1">
                <span className="text-slate-400">Contract Tier</span>
                <p className="font-bold text-purple-300">
                  Level {selectedTrade.level || 30}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#060a14] border border-white/5 space-y-1">
                <span className="text-slate-400">Fixed Tier Amount</span>
                <p className="font-bold text-white text-sm">
                  {selectedTrade.investment.toLocaleString()} USDT
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#060a14] border border-white/5 space-y-1">
                <span className="text-slate-400">Strike / Order Price</span>
                <p className="font-bold text-slate-200">
                  ${selectedTrade.strikePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#060a14] border border-white/5 space-y-1">
                <span className="text-slate-400">Settlement Price</span>
                <p className="font-bold text-slate-200">
                  {isCancelled(selectedTrade) ? (
                    <span className="text-slate-400 italic">Not Settled (Cancelled)</span>
                  ) : (
                    `$${(selectedTrade.settlementPrice ?? selectedTrade.currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  )}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#060a14] border border-white/5 space-y-1">
                <span className="text-slate-400">Target Reward Rate</span>
                <p className="font-bold text-cyan-400">
                  +{(selectedTrade.profitRate * 100).toFixed(0)}%
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#060a14] border border-white/5 space-y-1">
                <span className="text-slate-400">Realized PnL</span>
                <p className={`font-bold text-sm ${
                  isCancelled(selectedTrade)
                    ? 'text-slate-400'
                    : (selectedTrade.status === 'won' || (selectedTrade.pnl && selectedTrade.pnl > 0))
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}>
                  {isCancelled(selectedTrade) 
                    ? '$0.00 (Refunded)'
                    : (selectedTrade.status === 'won' || (selectedTrade.pnl && selectedTrade.pnl > 0))
                    ? `+${(selectedTrade.pnl || selectedTrade.potentialProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`
                    : `-${selectedTrade.investment.toLocaleString()} USDT`}
                </p>
              </div>
            </div>

            {/* Cryptographic Execution Audit */}
            <div className="p-3.5 rounded-xl bg-[#060a14] border border-white/5 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-300 border-b border-white/5 pb-1.5">
                <span className="flex items-center space-x-1.5 text-slate-200 font-semibold">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Execution Audit Trail</span>
                </span>
                <span className="text-xs text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/40">
                  Verified On-Chain
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-400">Tx Hash:</span>
                <div className="flex items-center space-x-1 text-slate-300">
                  <span>{selectedTrade.txHash || `0x${selectedTrade.id.substring(0, 16)}...`}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedTrade.txHash || selectedTrade.id, 'txHash')}
                    className="hover:text-cyan-400 transition"
                    title="Copy Transaction Hash"
                  >
                    {copiedField === 'txHash' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Order Placed:</span>
                <span className="text-slate-300">{selectedTrade.createdAt}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">{isCancelled(selectedTrade) ? 'Cancelled At:' : 'Settled At:'}</span>
                <span className="text-slate-300">{selectedTrade.settledAt || selectedTrade.createdAt}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Protocol Fee:</span>
                <span className="text-emerald-400 font-semibold">0.00 USDT (Zero Fee)</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedTrade(null)}
                className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-mono font-medium text-slate-300 hover:text-white transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
