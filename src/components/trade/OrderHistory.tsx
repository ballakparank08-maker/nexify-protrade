import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Download, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  FileText, 
  Copy, 
  Check, 
  ExternalLink,
  Filter,
  X
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { CompletedSpotTrade } from '../../types';

interface OrderHistoryProps {
  filterPair?: string; // e.g. "BTC/USDT"
  compact?: boolean;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({ 
  filterPair,
  compact = false 
}) => {
  const { 
    orderHistory, 
    clearOrderHistory, 
    formatCurrency, 
    selectedAsset 
  } = useTrading();

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [sideFilter, setSideFilter] = useState<'all' | 'buy' | 'sell'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'filled' | 'canceled'>('all');
  const [pairFilter, setPairFilter] = useState<string>(filterPair || 'all');
  const [onlyCurrentPair, setOnlyCurrentPair] = useState<boolean>(false);

  // Modal / Receipt Detail State
  const [selectedTrade, setSelectedTrade] = useState<CompletedSpotTrade | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync pair filter if external filterPair changes
  React.useEffect(() => {
    if (filterPair && onlyCurrentPair) {
      setPairFilter(filterPair);
    }
  }, [filterPair, onlyCurrentPair]);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Distinct pairs in history
  const distinctPairs = useMemo(() => {
    const pairs = new Set<string>();
    orderHistory.forEach(t => pairs.add(t.pair));
    return Array.from(pairs);
  }, [orderHistory]);

  // Filtered trades
  const filteredTrades = useMemo(() => {
    return orderHistory.filter(trade => {
      // Current pair toggle
      if (onlyCurrentPair && filterPair && trade.pair !== filterPair) {
        return false;
      }
      // Pair filter
      if (!onlyCurrentPair && pairFilter !== 'all' && trade.pair !== pairFilter) {
        return false;
      }
      // Side filter
      if (sideFilter !== 'all' && trade.side !== sideFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && trade.status !== statusFilter) {
        return false;
      }
      // Search query (Pair, ID, TxHash, or Asset)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesPair = trade.pair.toLowerCase().includes(query);
        const matchesAsset = trade.asset.toLowerCase().includes(query);
        const matchesId = trade.id.toLowerCase().includes(query) || trade.orderId.toLowerCase().includes(query);
        const matchesTx = trade.txHash ? trade.txHash.toLowerCase().includes(query) : false;
        return matchesPair || matchesAsset || matchesId || matchesTx;
      }
      return true;
    });
  }, [orderHistory, onlyCurrentPair, filterPair, pairFilter, sideFilter, statusFilter, searchQuery]);

  // Aggregate statistics for filtered list
  const stats = useMemo(() => {
    const filledTrades = filteredTrades.filter(t => t.status === 'filled' || t.status === 'completed');
    const totalVolume = filledTrades.reduce((sum, t) => sum + t.totalValue, 0);
    const totalFees = filledTrades.reduce((sum, t) => sum + t.fee, 0);
    const buyCount = filledTrades.filter(t => t.side === 'buy').length;
    const sellCount = filledTrades.filter(t => t.side === 'sell').length;

    return {
      totalTrades: filteredTrades.length,
      filledCount: filledTrades.length,
      totalVolume,
      totalFees,
      buyCount,
      sellCount
    };
  }, [filteredTrades]);

  // Export CSV functionality
  const handleExportCSV = () => {
    if (filteredTrades.length === 0) return;

    const headers = ['Trade ID', 'Order ID', 'Timestamp', 'Pair', 'Side', 'Type', 'Status', 'Price (USDT)', 'Amount', 'Total Value (USDT)', 'Fee (USDT)', 'Tx Hash'];
    const rows = filteredTrades.map(t => [
      t.id,
      t.orderId,
      `"${t.timestamp}"`,
      t.pair,
      t.side.toUpperCase(),
      t.orderType.toUpperCase(),
      t.status.toUpperCase(),
      t.price.toFixed(4),
      t.amount.toFixed(4),
      t.totalValue.toFixed(2),
      t.fee.toFixed(4),
      t.txHash || 'N/A'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `spot_order_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-3 font-mono text-xs">
      {/* 1. Header Toolbar & Quick Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#060a14]/60 p-3 rounded-xl border border-slate-800/80">
        {/* Left: Summary Metrics */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs">
          <div className="flex items-center space-x-1.5 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-slate-400">Total Completed:</span>
            <span className="text-white font-bold">{stats.filledCount}</span>
            <span className="text-slate-500">({stats.buyCount} Buy / {stats.sellCount} Sell)</span>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-slate-400">Total Volume:</span>
            <span className="text-emerald-400 font-bold">{formatCurrency(stats.totalVolume)}</span>
          </div>

          <div className="hidden sm:flex items-center space-x-1.5 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-slate-400">Fees Paid:</span>
            <span className="text-purple-300 font-bold">${stats.totalFees.toFixed(4)} USDT</span>
          </div>
        </div>

        {/* Right: Actions (Pair Toggle, Export, Clear) */}
        <div className="flex flex-wrap items-center gap-2">
          {filterPair && (
            <button
              id="order-history-current-pair-toggle"
              onClick={() => setOnlyCurrentPair(!onlyCurrentPair)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                onlyCurrentPair
                  ? 'bg-purple-900/50 border-purple-500 text-purple-200'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Filter order history to only the currently selected trading pair"
            >
              {onlyCurrentPair ? `Current Pair (${filterPair})` : 'All Pairs'}
            </button>
          )}

          <button
            id="order-history-export-btn"
            onClick={handleExportCSV}
            disabled={filteredTrades.length === 0}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-xs"
            title="Download CSV export of your executed spot orders"
          >
            <Download className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {orderHistory.length > 0 && (
            <button
              id="order-history-clear-btn"
              onClick={() => {
                if (window.confirm('Are you sure you want to clear your local spot order history?')) {
                  clearOrderHistory();
                }
              }}
              className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-500 hover:text-rose-400 hover:border-rose-900/60 transition-colors text-xs"
              title="Clear all recorded spot order history"
            >
              <Trash2 className="h-3 w-3" />
              <span className="hidden md:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            id="order-history-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pair, ID, or hash..."
            className="w-full bg-[#060a14] border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Pair Filter Dropdown */}
        <div className="flex items-center space-x-1.5 bg-[#060a14] border border-slate-800 rounded-xl px-2.5 py-1.5">
          <Filter className="h-3.5 w-3.5 text-slate-500 shrink-0" />
          <select
            id="order-history-pair-select"
            value={onlyCurrentPair && filterPair ? filterPair : pairFilter}
            onChange={(e) => {
              setOnlyCurrentPair(false);
              setPairFilter(e.target.value);
            }}
            className="w-full bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-[#090e1d] text-white">All Pairs ({distinctPairs.length})</option>
            {distinctPairs.map(pair => (
              <option key={pair} value={pair} className="bg-[#090e1d] text-white">
                {pair}
              </option>
            ))}
          </select>
        </div>

        {/* Side Filter */}
        <div className="flex items-center bg-[#060a14] border border-slate-800 rounded-xl p-0.5">
          <button
            onClick={() => setSideFilter('all')}
            className={`flex-1 py-1 text-center rounded-lg font-medium transition-colors ${
              sideFilter === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSideFilter('buy')}
            className={`flex-1 py-1 text-center rounded-lg font-medium transition-colors ${
              sideFilter === 'buy' ? 'bg-emerald-950 text-emerald-300 font-bold' : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => setSideFilter('sell')}
            className={`flex-1 py-1 text-center rounded-lg font-medium transition-colors ${
              sideFilter === 'sell' ? 'bg-rose-950 text-rose-300 font-bold' : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            Sell
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex items-center bg-[#060a14] border border-slate-800 rounded-xl p-0.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex-1 py-1 text-center rounded-lg font-medium transition-colors ${
              statusFilter === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Status
          </button>
          <button
            onClick={() => setStatusFilter('filled')}
            className={`flex-1 py-1 text-center rounded-lg font-medium transition-colors ${
              statusFilter === 'filled' ? 'bg-emerald-950 text-emerald-300 font-bold' : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            Filled
          </button>
          <button
            onClick={() => setStatusFilter('canceled')}
            className={`flex-1 py-1 text-center rounded-lg font-medium transition-colors ${
              statusFilter === 'canceled' ? 'bg-slate-800 text-slate-300 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Canceled
          </button>
        </div>
      </div>

      {/* 3. Spot Order History Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-[#060a14]/40">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-800/80 bg-slate-900/60 text-slate-400 uppercase text-xs tracking-wider">
              <th className="py-2.5 px-3 font-semibold">Time</th>
              <th className="py-2.5 px-3 font-semibold">Pair</th>
              <th className="py-2.5 px-3 font-semibold">Side</th>
              <th className="py-2.5 px-3 font-semibold">Type</th>
              <th className="py-2.5 px-3 font-semibold text-right">Executed Price</th>
              <th className="py-2.5 px-3 font-semibold text-right">Executed Amount</th>
              <th className="py-2.5 px-3 font-semibold text-right">Total Value</th>
              <th className="py-2.5 px-3 font-semibold text-right">Fee</th>
              <th className="py-2.5 px-3 font-semibold text-center">Status</th>
              <th className="py-2.5 px-3 font-semibold text-right">Receipt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {filteredTrades.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-10">
                  <div className="flex flex-col items-center justify-center space-y-2 text-slate-500">
                    <FileText className="h-8 w-8 text-slate-600" />
                    <p className="text-slate-300 font-medium">No completed spot trades found</p>
                    <p className="text-xs text-slate-500 max-w-sm">
                      {orderHistory.length === 0
                        ? 'Submit a Market or Limit order above to execute and track your trades in real-time.'
                        : 'No records match the active filter criteria. Try resetting your search or filter options.'}
                    </p>
                    {(searchQuery || sideFilter !== 'all' || statusFilter !== 'all' || pairFilter !== 'all' || onlyCurrentPair) && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSideFilter('all');
                          setStatusFilter('all');
                          setPairFilter('all');
                          setOnlyCurrentPair(false);
                        }}
                        className="mt-2 text-xs text-purple-400 hover:text-purple-300 underline"
                      >
                        Reset All Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredTrades.map(trade => {
                const isBuy = trade.side === 'buy';
                const isFilled = trade.status === 'filled' || trade.status === 'completed';

                return (
                  <tr 
                    key={trade.id} 
                    className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                    onClick={() => setSelectedTrade(trade)}
                  >
                    {/* Timestamp */}
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="h-3 w-3 text-slate-500 shrink-0" />
                        <span className="text-slate-300">{trade.timestamp}</span>
                      </div>
                    </td>

                    {/* Pair */}
                    <td className="py-2.5 px-3 font-bold text-white whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
                        <span>{trade.pair}</span>
                      </div>
                    </td>

                    {/* Side */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-bold ${
                        isBuy 
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50' 
                          : 'bg-rose-950/80 text-rose-400 border border-rose-800/50'
                      }`}>
                        {isBuy ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                        <span>{trade.side.toUpperCase()}</span>
                      </span>
                    </td>

                    {/* Type */}
                    <td className="py-2.5 px-3 capitalize text-slate-400 whitespace-nowrap">
                      {trade.orderType}
                    </td>

                    {/* Executed Price */}
                    <td className="py-2.5 px-3 text-right font-bold text-white whitespace-nowrap">
                      ${trade.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </td>

                    {/* Executed Amount */}
                    <td className="py-2.5 px-3 text-right text-slate-200 whitespace-nowrap">
                      {trade.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                      <span className="text-slate-500 ml-1 text-xs">{trade.asset}</span>
                    </td>

                    {/* Total Value */}
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-200 whitespace-nowrap">
                      ${trade.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <span className="text-slate-500 ml-1 text-xs">USDT</span>
                    </td>

                    {/* Trading Fee */}
                    <td className="py-2.5 px-3 text-right text-slate-400 whitespace-nowrap">
                      ${trade.fee.toFixed(4)}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-semibold ${
                        isFilled
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40'
                          : 'bg-slate-800/80 text-slate-400 border border-slate-700/60'
                      }`}>
                        {isFilled ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <XCircle className="h-3 w-3 text-rose-400" />
                        )}
                        <span>{trade.status.toUpperCase()}</span>
                      </span>
                    </td>

                    {/* Receipt Action */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTrade(trade);
                        }}
                        className="inline-flex items-center space-x-1 text-xs text-purple-400 hover:text-purple-300 px-2 py-1 rounded hover:bg-slate-800 transition-colors"
                        title="View Order Settlement Receipt"
                      >
                        <FileText className="h-3 w-3" />
                        <span className="hidden sm:inline">Receipt</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Detailed Order Settlement Modal */}
      {selectedTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-[#090e1d] p-6 shadow-2xl font-mono text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-xl border ${
                  selectedTrade.side === 'buy'
                    ? 'bg-emerald-950/60 border-emerald-800/50 text-emerald-400'
                    : 'bg-rose-950/60 border-rose-800/50 text-rose-400'
                }`}>
                  {selectedTrade.side === 'buy' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Spot Order Settlement Receipt</h3>
                  <p className="text-xs text-slate-400">ID: {selectedTrade.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTrade(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body: Key Data Grid */}
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 bg-[#060a14] p-3 rounded-xl border border-slate-800/80">
                <div>
                  <span className="text-slate-400 text-xs uppercase font-medium">Trading Pair</span>
                  <p className="text-white font-bold text-sm mt-0.5">{selectedTrade.pair}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-xs uppercase font-medium">Side / Order Type</span>
                  <p className="text-white font-bold text-sm mt-0.5">
                    <span className={selectedTrade.side === 'buy' ? 'text-emerald-400' : 'text-rose-400'}>
                      {selectedTrade.side.toUpperCase()}
                    </span>
                    <span className="text-slate-400 font-normal ml-1.5 capitalize">({selectedTrade.orderType})</span>
                  </p>
                </div>
              </div>

              <div className="space-y-2 divide-y divide-slate-800/60 text-xs">
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Execution Status:</span>
                  <span className={`font-semibold inline-flex items-center space-x-1 ${
                    selectedTrade.status === 'filled' || selectedTrade.status === 'completed'
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}>
                    {selectedTrade.status === 'filled' || selectedTrade.status === 'completed' ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    <span>{selectedTrade.status.toUpperCase()}</span>
                  </span>
                </div>

                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Execution Price:</span>
                  <span className="text-white font-bold">
                    ${selectedTrade.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} USDT
                  </span>
                </div>

                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Filled Amount:</span>
                  <span className="text-white font-bold">
                    {selectedTrade.amount} {selectedTrade.asset}
                  </span>
                </div>

                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Total Settlement Value:</span>
                  <span className="text-white font-bold">
                    ${selectedTrade.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                  </span>
                </div>

                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Trading Fee (0.02%):</span>
                  <span className="text-purple-300 font-semibold">
                    ${selectedTrade.fee.toFixed(4)} {selectedTrade.feeAsset}
                  </span>
                </div>

                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Timestamp:</span>
                  <span className="text-slate-200">{selectedTrade.timestamp}</span>
                </div>

                <div className="flex justify-between py-1.5 items-center">
                  <span className="text-slate-400">Order Reference:</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-slate-300 font-mono">{selectedTrade.orderId}</span>
                    <button
                      onClick={() => handleCopy(selectedTrade.orderId, 'orderId')}
                      className="text-slate-500 hover:text-white p-0.5"
                      title="Copy Order ID"
                    >
                      {copiedId === 'orderId' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>

                {selectedTrade.txHash && (
                  <div className="flex justify-between py-1.5 items-center">
                    <span className="text-slate-400">Engine Match Hash:</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-slate-300 font-mono">{selectedTrade.txHash}</span>
                      <button
                        onClick={() => handleCopy(selectedTrade.txHash!, 'txHash')}
                        className="text-slate-500 hover:text-white p-0.5"
                        title="Copy Tx Hash"
                      >
                        {copiedId === 'txHash' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-5 flex items-center justify-end space-x-2 border-t border-slate-800 pt-3">
              <button
                onClick={() => setSelectedTrade(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
