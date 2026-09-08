import React, { useState } from 'react';
import { 
  Landmark, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Coins, 
  ArrowRight, 
  Percent, 
  RefreshCw,
  Info,
  Layers
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

export const CryptoLoanTerminal: React.FC = () => {
  const { 
    loans, 
    borrowLoan, 
    repayLoan, 
    wallet, 
    cryptoAssets 
  } = useTrading();

  // Borrow Form State
  const [collateralAsset, setCollateralAsset] = useState<string>('BTC');
  const [collateralAmt, setCollateralAmt] = useState<string>('0.2');
  const [borrowAmt, setBorrowAmt] = useState<string>('10000');
  const [loanStatus, setLoanStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Selected Collateral calculations
  const assetObj = cryptoAssets.find(a => a.symbol === collateralAsset);
  const collateralPrice = assetObj ? assetObj.price : 1;
  const numCollateral = parseFloat(collateralAmt) || 0;
  const numBorrow = parseFloat(borrowAmt) || 0;
  const collateralUsdValue = numCollateral * collateralPrice;
  const ltvRatio = collateralUsdValue > 0 ? (numBorrow / collateralUsdValue) * 100 : 0;
  const liquidationPrice = collateralPrice * (ltvRatio / 85);

  const handleExecuteBorrow = (e: React.FormEvent) => {
    e.preventDefault();
    if (numCollateral <= 0 || numBorrow <= 0) {
      setLoanStatus({ success: false, message: 'Please enter valid positive amounts.' });
      return;
    }

    const res = borrowLoan(collateralAsset, numCollateral, numBorrow);
    setLoanStatus(res);
    setTimeout(() => setLoanStatus(null), 4000);
  };

  const handleRepay = (loanId: string) => {
    const res = repayLoan(loanId);
    setLoanStatus(res);
    setTimeout(() => setLoanStatus(null), 4000);
  };

  // Total active debt
  const totalBorrowedUsd = loans
    .filter(l => l.status === 'active')
    .reduce((acc, l) => acc + l.borrowedAmount, 0);

  const totalCollateralLockedUsd = loans
    .filter(l => l.status === 'active')
    .reduce((acc, l) => acc + l.collateralUsdValue, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Credit Line Overview */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#090e1d]/90 p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-600/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-1.5 rounded-full border border-amber-500/30 bg-amber-950/40 px-3 py-1 text-xs font-mono text-amber-300 mb-2">
              <Landmark className="h-3.5 w-3.5" />
              <span>ALGORITHMIC OVER-COLLATERALIZED CREDIT</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-sans">
              Instant Crypto Loans (Borrow)
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Lock your crypto holdings as collateral to borrow instant liquid USDT/USDC stablecoins with no credit check, flexible repayment, and automated risk liquidation protection.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-mono text-xs">
            <div className="rounded-xl border border-slate-800/80 bg-[#060a14] p-3">
              <span className="text-slate-400">Total Active Debt:</span>
              <div className="text-amber-400 font-bold text-base mt-0.5">
                ${totalBorrowedUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-[#060a14] p-3">
              <span className="text-slate-400">Locked Collateral:</span>
              <div className="text-white font-bold text-base mt-0.5">
                ${totalCollateralLockedUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-[#060a14] p-3 col-span-2 sm:col-span-1">
              <span className="text-slate-400">Base Borrow APR:</span>
              <div className="text-emerald-400 font-bold text-base mt-0.5">
                4.20% Variable
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Borrow Application (6 cols) + Active Loans Monitor (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* BORROW APPLICATION FORM */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-800/80 bg-[#090e1d]/90 p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/70 pb-3">
              <div className="flex items-center space-x-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-950/80 border border-amber-800/60 text-amber-400">
                  <Landmark className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-white font-mono">NEW LOAN REQUEST</h3>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-semibold">Instant Approval</span>
            </div>

            <form onSubmit={handleExecuteBorrow} className="mt-4 space-y-4 font-mono text-xs">
              {/* Select Collateral */}
              <div>
                <label className="text-slate-300 text-xs uppercase block mb-1.5 font-semibold">Select Collateral Asset</label>
                <div className="grid grid-cols-3 gap-2">
                  {['BTC', 'ETH', 'SOL'].map(sym => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => setCollateralAsset(sym)}
                      className={`py-2 rounded-xl border text-center font-bold transition-colors ${
                        collateralAsset === sym
                          ? 'bg-amber-900/40 border-amber-500 text-amber-300'
                          : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>

              {/* Collateral Amount */}
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Collateral Amount:</span>
                  <span>Wallet Avail: {(wallet.assets[collateralAsset] || 0).toFixed(4)} {collateralAsset}</span>
                </div>
                <div className="flex rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white">
                  <input
                    type="number"
                    step="any"
                    value={collateralAmt}
                    onChange={e => setCollateralAmt(e.target.value)}
                    className="w-full bg-transparent outline-none"
                    placeholder="0.00"
                  />
                  <span className="text-slate-400">{collateralAsset}</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Collateral Valuation: ~${collateralUsdValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Borrow Amount */}
              <div>
                <label className="text-slate-300 text-xs uppercase block mb-1.5 font-semibold">Borrow Amount (USDT)</label>
                <div className="flex rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white">
                  <input
                    type="number"
                    step="any"
                    value={borrowAmt}
                    onChange={e => setBorrowAmt(e.target.value)}
                    className="w-full bg-transparent outline-none"
                    placeholder="0.00"
                  />
                  <span className="text-slate-400">USDT</span>
                </div>
              </div>

              {/* LTV Health Factor Meter */}
              <div className="rounded-xl border border-slate-800 bg-[#060a14] p-3 space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Loan-To-Value (LTV):</span>
                  <span className={`font-bold ${
                    ltvRatio <= 65 ? 'text-emerald-400' : ltvRatio <= 75 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {ltvRatio.toFixed(1)}% {ltvRatio <= 65 ? '(Safe)' : ltvRatio <= 75 ? '(Moderate)' : '(Danger)'}
                  </span>
                </div>

                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      ltvRatio <= 65 ? 'bg-emerald-500' : ltvRatio <= 75 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, ltvRatio)}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div>
                    <span className="text-slate-400">Estimated Liquidation Price:</span>
                    <div className="text-white font-semibold">${liquidationPrice.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Interest Rate (APR):</span>
                    <div className="text-purple-300 font-semibold">4.50% Fixed</div>
                  </div>
                </div>
              </div>

              {loanStatus && (
                <div className={`p-2.5 rounded-xl flex items-center space-x-2 ${
                  loanStatus.success ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                }`}>
                  {loanStatus.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  <span>{loanStatus.message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={ltvRatio > 75}
                className={`w-full py-3 rounded-xl font-bold font-mono text-white transition-all shadow-lg ${
                  ltvRatio > 75
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:brightness-110 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                }`}
              >
                {ltvRatio > 75 ? 'EXCEEDS 75% MAX LTV' : 'BORROW USDT INSTANTLY'}
              </button>
            </form>
          </div>
        </div>

        {/* ACTIVE BORROW POSITIONS */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-800/80 bg-[#090e1d]/90 p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/70 pb-3">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white font-mono">ACTIVE LOAN POSITIONS</h3>
                <span className="rounded-full bg-amber-950 px-2 py-0.5 text-xs font-mono text-amber-300 border border-amber-800/50 font-bold">
                  {loans.filter(l => l.status === 'active').length}
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-3 font-mono text-xs">
              {loans.map(loan => (
                <div 
                  key={loan.id}
                  className="rounded-xl border border-slate-800 bg-[#060a14] p-4 transition-all hover:border-slate-700"
                >
                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-sm">Loan #{loan.id}</span>
                      <span className="text-xs text-slate-400">{loan.startDate}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      loan.status === 'active' ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {loan.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-1">
                    <div>
                      <div className="text-slate-300 text-xs">COLLATERAL LOCKED</div>
                      <div className="text-white font-bold">
                        {loan.collateralAmount} {loan.collateralAsset} (${loan.collateralUsdValue.toFixed(2)})
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-300 text-xs">BORROWED DEBT</div>
                      <div className="text-amber-400 font-bold">
                        ${loan.borrowedAmount.toFixed(2)} USDT
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-300 text-xs">HEALTH FACTOR (LTV)</div>
                      <div className="text-emerald-400 font-bold">{loan.ltv}%</div>
                    </div>
                    <div>
                      <div className="text-slate-300 text-xs">LIQUIDATION THRESHOLD</div>
                      <div className="text-rose-400 font-bold">${loan.liquidationPrice.toFixed(2)}</div>
                    </div>
                  </div>

                  {loan.status === 'active' && (
                    <div className="mt-3 pt-3 border-t border-slate-800/60 flex justify-end">
                      <button
                        onClick={() => handleRepay(loan.id)}
                        className="rounded-lg bg-purple-950/80 border border-purple-800/60 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-900/60 transition-colors"
                      >
                        Repay Loan & Unlock Collateral
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 text-xs text-slate-400 font-mono">
            Repaying releases 100% of your collateral back into your available spot wallet instantaneously.
          </div>
        </div>
      </div>
    </div>
  );
};
