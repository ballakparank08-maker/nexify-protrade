import React, { useMemo, useState } from 'react';
import { ArrowDownUp, ArrowLeftRight, CheckCircle2, Info, Wallet } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

const CONVERSION_FEE = 0.001;

export const ConvertTerminal: React.FC = () => {
  const { cryptoAssets, wallet, convertAsset } = useTrading();
  const assets = useMemo(() => ['USDT', ...cryptoAssets.map(asset => asset.symbol)], [cryptoAssets]);
  const [fromAsset, setFromAsset] = useState('USDT');
  const [toAsset, setToAsset] = useState('BTC');
  const [amount, setAmount] = useState('');
  const [notice, setNotice] = useState<{ success: boolean; message: string } | null>(null);

  const fromPrice = fromAsset === 'USDT' ? 1 : cryptoAssets.find(asset => asset.symbol === fromAsset)?.price ?? 0;
  const toPrice = toAsset === 'USDT' ? 1 : cryptoAssets.find(asset => asset.symbol === toAsset)?.price ?? 0;
  const numericAmount = Number(amount) || 0;
  const receiveAmount = fromPrice && toPrice ? (numericAmount * fromPrice * (1 - CONVERSION_FEE)) / toPrice : 0;
  const available = fromAsset === 'USDT' ? wallet.usdtBalance : wallet.assets[fromAsset] || 0;

  const formatAmount = (value: number) => value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: value < 1 ? 6 : 4
  });

  const swapAssets = () => {
    setFromAsset(toAsset);
    setToAsset(fromAsset);
    setAmount('');
    setNotice(null);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const result = convertAsset(fromAsset, toAsset, numericAmount);
    setNotice(result);
    if (result.success) setAmount('');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-950/50">
          <ArrowLeftRight className="h-5 w-5 text-cyan-300" />
        </div>
        <h1 className="text-2xl font-bold text-white">Convert Assets</h1>
        <p className="mt-2 text-sm text-slate-400">Exchange supported assets instantly at the current market rate.</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-[#090e1d]/90 p-5 shadow-2xl sm:p-6">
        <AssetAmountField
          label="From"
          value={fromAsset}
          amount={amount}
          available={available}
          assets={assets}
          onAssetChange={(asset) => {
            setFromAsset(asset);
            if (asset === toAsset) setToAsset(fromAsset);
          }}
          onAmountChange={setAmount}
          onMax={() => setAmount(available.toString())}
        />

        <div className="relative my-3 flex justify-center border-t border-white/10">
          <button type="button" onClick={swapAssets} aria-label="Swap conversion assets" className="-mt-4 rounded-xl border border-slate-700 bg-slate-900 p-2 text-cyan-300 transition-colors hover:border-cyan-500 hover:bg-cyan-950/50">
            <ArrowDownUp className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#060a14] p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>To</span>
            <span>Estimated received</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-2xl font-semibold tabular-nums text-white">{numericAmount > 0 ? formatAmount(receiveAmount) : '0.00'}</span>
            <select value={toAsset} onChange={(event) => { setToAsset(event.target.value); if (event.target.value === fromAsset) setFromAsset(toAsset); }} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-cyan-500">
              {assets.filter(asset => asset !== fromAsset).map(asset => <option key={asset}>{asset}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-xs text-slate-400">
          <div className="flex justify-between"><span>Market rate</span><span className="tabular-nums text-slate-200">1 {fromAsset} ≈ {formatAmount(fromPrice / toPrice)} {toAsset}</span></div>
          <div className="flex justify-between"><span>Conversion fee</span><span className="text-emerald-400">0.10%</span></div>
          <div className="flex items-center gap-1.5 pt-1 text-slate-500"><Info className="h-3.5 w-3.5 shrink-0" /> Quotes refresh with live market data.</div>
        </div>

        {notice && <div className={`mt-4 flex items-center gap-2 rounded-lg border p-3 text-sm ${notice.success ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300' : 'border-rose-500/30 bg-rose-950/40 text-rose-300'}`}><CheckCircle2 className="h-4 w-4 shrink-0" />{notice.message}</div>}

        <button type="submit" disabled={numericAmount <= 0 || fromAsset === toAsset} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
          <ArrowLeftRight className="h-4 w-4" /> Convert {fromAsset} to {toAsset}
        </button>
      </form>
    </div>
  );
};

interface AssetAmountFieldProps {
  label: string;
  value: string;
  amount: string;
  available: number;
  assets: string[];
  onAssetChange: (asset: string) => void;
  onAmountChange: (amount: string) => void;
  onMax: () => void;
}

const AssetAmountField: React.FC<AssetAmountFieldProps> = ({ label, value, amount, available, assets, onAssetChange, onAmountChange, onMax }) => (
  <div className="rounded-xl border border-slate-800 bg-[#060a14] p-4">
    <div className="flex items-center justify-between text-xs text-slate-400">
      <span>{label}</span>
      <span className="flex items-center gap-1"><Wallet className="h-3.5 w-3.5" /> Available: {available.toLocaleString(undefined, { maximumFractionDigits: 6 })} {value}</span>
    </div>
    <div className="mt-2 flex items-center gap-3">
      <input type="number" min="0" step="any" inputMode="decimal" value={amount} onChange={(event) => onAmountChange(event.target.value)} placeholder="0.00" className="min-w-0 flex-1 bg-transparent text-2xl font-semibold tabular-nums text-white outline-none placeholder:text-slate-600" />
      <button type="button" onClick={onMax} className="rounded-md bg-cyan-950/70 px-2 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-900">MAX</button>
      <select value={value} onChange={(event) => onAssetChange(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-cyan-500">
        {assets.map(asset => <option key={asset}>{asset}</option>)}
      </select>
    </div>
  </div>
);
