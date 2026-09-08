import React, { useState } from 'react';
import { 
  Coins, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw, 
  Zap, 
  ShieldCheck, 
  Award, 
  Gift 
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

export const RewardsTerminal: React.FC = () => {
  const { 
    stakingPools, 
    claimAllRewards, 
    autoCompound, 
    toggleAutoCompound, 
    cryptoAssets 
  } = useTrading();

  const [claimNotification, setClaimNotification] = useState<{ success: boolean; message: string } | null>(null);

  // Calculate accrued rewards
  const totalClaimableUsd = stakingPools.reduce((acc, pool) => {
    const assetObj = cryptoAssets.find(a => a.symbol === pool.asset);
    const price = assetObj ? assetObj.price : 1;
    return acc + (pool.earnedRewards * price);
  }, 0);

  const handleClaim = () => {
    if (totalClaimableUsd <= 0) {
      setClaimNotification({ success: false, message: 'No rewards currently accrued to claim.' });
      setTimeout(() => setClaimNotification(null), 3000);
      return;
    }

    const res = claimAllRewards();
    setClaimNotification({ 
      success: true, 
      message: `Successfully claimed $${res.claimedUsd.toFixed(2)} in rewards to your wallet!` 
    });
    setTimeout(() => setClaimNotification(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#090e1d]/90 p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/15 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-1.5 rounded-full border border-purple-500/30 bg-purple-950/40 px-3 py-1 text-xs font-mono text-purple-300 mb-2">
              <Gift className="h-3.5 w-3.5" />
              <span>NEXIFY PROTOCOL REWARDS & INCENTIVES</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-sans">
              Yield Rewards & Fee Rebates
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Harvest continuous staking yields, trading volume fee rebates, and NEXIFY governance dividends directly to your spot wallet.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleClaim}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all hover:scale-105 hover:brightness-110"
            >
              <Sparkles className="h-4 w-4" />
              <span>Claim All Rewards (${totalClaimableUsd.toFixed(2)})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Rewards Balance & Auto-Compound (6 cols) + VIP Tier & Fee Discounts (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* REWARDS BREAKDOWN */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-800/80 bg-[#090e1d]/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/70 pb-3">
            <div className="flex items-center space-x-2">
              <Coins className="h-4 w-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white font-mono">UNCLAIMED STAKING YIELDS</h3>
            </div>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {stakingPools.map(pool => {
              const assetObj = cryptoAssets.find(a => a.symbol === pool.asset);
              const price = assetObj ? assetObj.price : 1;
              const usdVal = pool.earnedRewards * price;

              return (
                <div key={pool.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-[#060a14]">
                  <div>
                    <div className="text-white font-bold">{pool.name}</div>
                    <div className="text-slate-400 text-xs">{pool.network}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-400 font-bold">
                      +{pool.earnedRewards.toFixed(4)} {pool.asset}
                    </div>
                    <div className="text-slate-400 text-xs">
                      (${usdVal.toFixed(2)})
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Auto Compound Toggle Card */}
          <div className="rounded-xl border border-purple-900/40 bg-purple-950/20 p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-white font-mono flex items-center space-x-1.5">
                <RefreshCw className="h-3.5 w-3.5 text-purple-400" />
                <span>Auto-Compounding Protocol</span>
              </div>
              <p className="text-xs text-slate-400">
                Automatically re-stakes harvested yields back into validator pools to compound APY returns.
              </p>
            </div>

            <button
              onClick={toggleAutoCompound}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoCompound ? 'bg-purple-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  autoCompound ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {claimNotification && (
            <div className={`p-2.5 rounded-xl font-mono text-xs flex items-center space-x-2 ${
              claimNotification.success ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
            }`}>
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{claimNotification.message}</span>
            </div>
          )}
        </div>

        {/* VIP TRADING TIER & FEE DISCOUNTS */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-800/80 bg-[#090e1d]/90 p-5 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/70 pb-3">
              <div className="flex items-center space-x-2">
                <Award className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-mono">VIP TRADING FEE TIER</h3>
              </div>
              <span className="rounded bg-cyan-950 px-2 py-0.5 text-xs font-mono font-bold text-cyan-300 border border-cyan-800/50">
                VIP LEVEL 2 (PRO)
              </span>
            </div>

            <div className="mt-4 space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-800 bg-[#060a14] p-3">
                  <div className="text-slate-400 text-xs">MAKER FEE</div>
                  <div className="text-emerald-400 font-black text-base mt-0.5">0.020%</div>
                  <div className="text-slate-400 text-xs">Base 0.050% (-60%)</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-[#060a14] p-3">
                  <div className="text-slate-400 text-xs">TAKER FEE</div>
                  <div className="text-cyan-400 font-black text-base mt-0.5">0.040%</div>
                  <div className="text-slate-400 text-xs">Base 0.080% (-50%)</div>
                </div>
              </div>

              {/* Progress to next tier */}
              <div className="rounded-xl border border-slate-800 bg-[#060a14] p-3.5 space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Progress to VIP 3 (Institutional):</span>
                  <span className="text-white font-semibold">68%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full" style={{ width: '68%' }}></div>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>30d Volume: $3.4M</span>
                  <span>Target: $5.0M</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 text-xs text-slate-400 font-mono">
            Hold 5,000+ NEXIFY tokens to unlock zero-maker fees on all high-liquidity spot pairs automatically.
          </div>
        </div>
      </div>
    </div>
  );
};
