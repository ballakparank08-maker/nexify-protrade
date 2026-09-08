import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Flame, 
  Zap, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  TrendingUp, 
  DollarSign, 
  Activity, 
  Coins, 
  Gauge, 
  RefreshCw, 
  Layers, 
  Plus,
  HelpCircle
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { MiningPlan, ActiveMiningContract } from '../../types';

export const MiningTerminal: React.FC = () => {
  const { 
    miningPlans, 
    activeMiningContracts, 
    startMiningContract, 
    claimMiningReward, 
    terminateMiningContract, 
    wallet, 
    addDemoUsdt,
    formatCurrency
  } = useTrading();

  // Selected plan for modal subscription
  const [selectedPlan, setSelectedPlan] = useState<MiningPlan | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [actionStatus, setActionStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Profit Calculator State
  const [calcPlanId, setCalcPlanId] = useState<string>('mining-5d');
  const [calcInputAmount, setCalcInputAmount] = useState<string>('10000');

  // Live simulation ticker for hashrate
  const [liveHashrateJitter, setLiveHashrateJitter] = useState<number>(0);
  const [liveBlocksMined, setLiveBlocksMined] = useState<number>(849204);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveHashrateJitter((Math.random() - 0.5) * 4.2);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const blockInterval = setInterval(() => {
      setLiveBlocksMined(prev => prev + 1);
    }, 18000);
    return () => clearInterval(blockInterval);
  }, []);

  // Quick Open Modal
  const handleSelectPlan = (plan: MiningPlan) => {
    setSelectedPlan(plan);
    setDepositAmount(plan.minDeposit.toString());
    setActionStatus(null);
  };

  const handleDeployHashrate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      setActionStatus({ success: false, message: 'Please enter a valid deposit amount.' });
      return;
    }

    const res = startMiningContract(selectedPlan.id, amt);
    setActionStatus(res);
    if (res.success) {
      setTimeout(() => {
        setSelectedPlan(null);
        setActionStatus(null);
      }, 1600);
    }
  };

  // Calculator calculations
  const currentCalcPlan = miningPlans.find(p => p.id === calcPlanId) || miningPlans[0];
  const numCalcAmount = parseFloat(calcInputAmount) || 0;
  const calcTotalProfit = numCalcAmount * currentCalcPlan.rewardRate;
  const calcDailyYield = calcTotalProfit / currentCalcPlan.durationDays;
  const calcTotalPayout = numCalcAmount + calcTotalProfit;
  const calcApy = ((currentCalcPlan.rewardRate / currentCalcPlan.durationDays) * 365 * 100).toFixed(1);

  // User Overview Metrics
  const activeContracts = activeMiningContracts.filter(c => c.status === 'mining');
  const totalPrincipalLocked = activeContracts.reduce((sum, c) => sum + c.amount, 0);
  const totalExpectedProfits = activeContracts.reduce((sum, c) => sum + c.totalExpectedProfit, 0);
  const totalClaimedSoFar = activeContracts.reduce((sum, c) => sum + c.claimedProfit, 0);

  // Compute live accrued un-claimed rewards
  const computeAccruedRewards = (contract: ActiveMiningContract) => {
    const now = Date.now();
    const elapsed = Math.min(now - contract.startTime, contract.endTime - contract.startTime);
    const totalDuration = contract.endTime - contract.startTime;
    const progress = totalDuration > 0 ? Math.min(1, elapsed / totalDuration) : 1;
    const accrued = contract.totalExpectedProfit * progress;
    return Math.max(0, parseFloat((accrued - contract.claimedProfit).toFixed(2)));
  };

  const totalUnclaimedNow = activeContracts.reduce((sum, c) => sum + computeAccruedRewards(c), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Overview Card */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#090e1d]/90 p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-1.5 rounded-full border border-amber-500/40 bg-amber-950/40 px-3 py-1 text-xs font-mono text-amber-300 mb-2.5">
              <Cpu className="h-3.5 w-3.5 text-amber-400" />
              <span>CLOUD HASHRATE & LIQUIDITY MINING RIGS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-sans tracking-tight">
              Enterprise Cloud Mining Terminal
            </h1>
            <p className="mt-1 text-sm text-slate-400 max-w-2xl leading-relaxed">
              Rent verified institutional ASIC & GPU hashrate clusters. Fixed daily returns, automated block rewards, and zero hardware maintenance costs settled in USDT.
            </p>

            {/* Quick Live Network Telemetry Ticker */}
            <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-mono text-slate-400">
              <div className="flex items-center space-x-1.5 bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-md">
                <Gauge className="h-3.5 w-3.5 text-cyan-400" />
                <span>Global Hashrate:</span>
                <span className="text-cyan-300 font-semibold">{(348.5 + liveHashrateJitter).toFixed(1)} EH/s</span>
              </div>
              <div className="flex items-center space-x-1.5 bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-md">
                <Layers className="h-3.5 w-3.5 text-purple-400" />
                <span>Current Height:</span>
                <span className="text-purple-300 font-semibold">#{liveBlocksMined.toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-1.5 bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-md">
                <Activity className="h-3.5 w-3.5 text-emerald-400" />
                <span>Pool Uptime:</span>
                <span className="text-emerald-400 font-semibold">99.98% SLA</span>
              </div>
            </div>
          </div>

          {/* User Available Balance & Quick Faucet */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-[#0c1329] border border-slate-800 p-4 rounded-xl">
            <div>
              <span className="text-xs text-slate-400 font-mono">Available Wallet Balance</span>
              <div className="text-xl font-bold font-mono text-white flex items-center space-x-1">
                <span className="text-emerald-400">{formatCurrency(wallet.usdtBalance)}</span>
                <span className="text-xs text-slate-400 font-normal">USDT</span>
              </div>
            </div>
            <div className="flex sm:flex-col gap-2">
              <button
                id="mining-add-test-funds-btn"
                onClick={() => addDemoUsdt(50000)}
                title="Add 50,000 USDT to test high-tier mining plans"
                className="flex items-center space-x-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors"
              >
                <Plus className="h-3 w-3" />
                <span>+50k Demo USDT</span>
              </button>
              <button
                id="mining-add-whale-funds-btn"
                onClick={() => addDemoUsdt(500000)}
                title="Add 500,000 USDT for VIP 90-Day Tier"
                className="flex items-center space-x-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors"
              >
                <Plus className="h-3 w-3" />
                <span>+500k VIP USDT</span>
              </button>
            </div>
          </div>
        </div>

        {/* Global Mining Stats Strip */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-800/80 pt-6">
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-3.5">
            <span className="text-xs text-slate-400 font-mono">Active Mining Contracts</span>
            <div className="mt-1 text-xl font-bold text-white font-mono flex items-center space-x-2">
              <span>{activeContracts.length}</span>
              {activeContracts.length > 0 && (
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-3.5">
            <span className="text-xs text-slate-400 font-mono">Total Capital Deployed</span>
            <div className="mt-1 text-xl font-bold text-amber-300 font-mono">
              ${totalPrincipalLocked.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-3.5">
            <span className="text-xs text-slate-400 font-mono">Accrued Unclaimed Yield</span>
            <div className="mt-1 text-xl font-bold text-emerald-400 font-mono flex items-center justify-between">
              <span>+${totalUnclaimedNow.toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-3.5">
            <span className="text-xs text-slate-400 font-mono">Total Expected Profit</span>
            <div className="mt-1 text-xl font-bold text-cyan-300 font-mono">
              +${totalExpectedProfits.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Official Mining Rules Rules Table Header */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
            <Flame className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-mono">OFFICIAL MINING CONTRACT RULES</h3>
            <p className="text-xs text-amber-200/80">
              Verified tiered yield rates based on lockup duration and principal allocation.
            </p>
          </div>
        </div>

        {/* User rules summary pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md text-slate-300">
            1d: <strong className="text-amber-400">1,000 → 0.01</strong>
          </span>
          <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md text-slate-300">
            5d: <strong className="text-amber-400">10,000 → 0.05</strong>
          </span>
          <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md text-slate-300">
            30d: <strong className="text-amber-400">100,000 → 0.08</strong>
          </span>
          <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md text-slate-300">
            60d: <strong className="text-amber-400">300,000 → 0.10</strong>
          </span>
          <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md text-slate-300">
            90d: <strong className="text-amber-400">500,000 → 0.15</strong>
          </span>
        </div>
      </div>

      {/* Mining Plans Grid (The 5 Tiers) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Zap className="h-4 w-4 text-amber-400" />
            <span>Available Cloud Mining Contracts</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">5 Institutional Tiers Available</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {miningPlans.map((plan) => {
            const minProfit = plan.minDeposit * plan.rewardRate;
            const isAffordable = wallet.usdtBalance >= plan.minDeposit;

            return (
              <div
                key={plan.id}
                className="rounded-xl border border-slate-800 bg-[#090e1d] hover:border-amber-500/50 p-4 flex flex-col justify-between transition-all group relative overflow-hidden"
              >
                {/* Accent glow on hover */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 group-hover:bg-amber-500/10 blur-xl transition-all pointer-events-none"></div>

                <div>
                  {/* Top Badge & Duration */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="rounded bg-amber-950/80 border border-amber-800/60 px-2 py-0.5 text-xs font-mono font-semibold text-amber-300 uppercase">
                      {plan.tag}
                    </span>
                    <span className="flex items-center space-x-1 text-xs font-mono font-bold text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      <Clock className="h-3 w-3" />
                      <span>{plan.durationDays} {plan.durationDays === 1 ? 'Day' : 'Days'}</span>
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                    {plan.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                    {plan.description}
                  </p>

                  {/* Core Yield Metric */}
                  <div className="mt-4 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-400 font-mono">Return Rate:</span>
                      <span className="text-base font-extrabold text-amber-400 font-mono">
                        {plan.rewardRate} <span className="text-xs text-amber-300 font-normal">({plan.totalReturnPct}%)</span>
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between mt-1 pt-1 border-t border-slate-800/60 text-xs font-mono">
                      <span className="text-slate-400">Min Allocation:</span>
                      <span className="text-white font-semibold">${plan.minDeposit.toLocaleString()}</span>
                    </div>
                    <div className="flex items-baseline justify-between mt-1 text-xs font-mono">
                      <span className="text-slate-400">Min Net Profit:</span>
                      <span className="text-emerald-400 font-semibold">+${minProfit.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Hardware & Pool Specs */}
                  <div className="mt-3 space-y-1 text-xs font-mono text-slate-400">
                    <div className="flex justify-between">
                      <span>Hashpower:</span>
                      <span className="text-slate-200">{plan.hashrateStr}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Algorithm:</span>
                      <span className="text-slate-300">{plan.algorithm.split(' ')[0]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mining Pool:</span>
                      <span className="text-slate-300 truncate max-w-[110px]">{plan.poolName}</span>
                    </div>
                  </div>
                </div>

                {/* Deploy Action */}
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <button
                    id={`deploy-plan-${plan.id}`}
                    onClick={() => handleSelectPlan(plan)}
                    className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-mono font-semibold transition-all bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black shadow-lg shadow-amber-900/30 active:scale-[0.98]"
                  >
                    <Cpu className="h-3.5 w-3.5" />
                    <span>Deploy Hashrate</span>
                  </button>

                  {!isAffordable && (
                    <p className="text-xs text-amber-400/80 text-center mt-1.5 font-mono">
                      Req: ${plan.minDeposit.toLocaleString()} USDT
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Mining Rig Positions & Real-Time Monitoring */}
      <div className="rounded-xl border border-slate-800 bg-[#090e1d] p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              <span>Active Mining Hashrate Rigs ({activeMiningContracts.length})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live computing nodes generating real-time block yield for your account.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-mono">Rig Telemetry:</span>
            <span className="flex items-center space-x-1 text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping mr-1" />
              ONLINE (ACTIVE)
            </span>
          </div>
        </div>

        {activeMiningContracts.length === 0 ? (
          <div className="py-12 text-center">
            <Cpu className="mx-auto h-12 w-12 text-slate-600" />
            <h3 className="mt-3 text-sm font-semibold text-slate-300 font-mono">No Active Mining Contracts</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              Select one of the 5 mining contract tiers above to deploy hashrate and start accruing daily yield.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {activeMiningContracts.map((contract) => {
              const now = Date.now();
              const elapsed = Math.min(now - contract.startTime, contract.endTime - contract.startTime);
              const totalDuration = contract.endTime - contract.startTime;
              const progressPct = totalDuration > 0 ? Math.min(100, (elapsed / totalDuration) * 100) : 100;
              const isCompleted = contract.status === 'completed' || progressPct >= 100;
              const accruedClaimable = computeAccruedRewards(contract);
              const timeLeftMs = Math.max(0, contract.endTime - now);
              const daysLeft = Math.floor(timeLeftMs / 86400000);
              const hoursLeft = Math.floor((timeLeftMs % 86400000) / 3600000);

              return (
                <div 
                  key={contract.id}
                  className="rounded-xl border border-slate-800/90 bg-[#070b16] p-4 hover:border-slate-700 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Contract Details */}
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-white font-sans">{contract.planName}</span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/50">
                          {contract.durationDays}D Lock
                        </span>
                        <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                          contract.status === 'completed'
                            ? 'bg-purple-950/80 text-purple-300 border border-purple-800/50'
                            : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                        }`}>
                          {contract.status === 'completed' ? 'COMPLETED' : 'MINING ACTIVE'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-xs font-mono text-slate-400">
                        <span>Invested: <strong className="text-white">${contract.amount.toLocaleString()} USDT</strong></span>
                        <span>Hashpower: <strong className="text-cyan-300">{contract.hashrateStr}</strong></span>
                        <span>Rate: <strong className="text-amber-400">{contract.rewardRate} ({(contract.rewardRate * 100).toFixed(0)}%)</strong></span>
                      </div>
                    </div>

                    {/* Financial Rewards & Progress */}
                    <div className="flex flex-wrap items-center gap-6">
                      <div>
                        <span className="text-xs text-slate-400 font-mono">Expected Total Yield</span>
                        <div className="text-sm font-bold font-mono text-cyan-300">
                          +${contract.totalExpectedProfit.toLocaleString()} USDT
                        </div>
                      </div>

                      <div>
                        <span className="text-xs text-slate-400 font-mono">Claimed / Accrued</span>
                        <div className="text-sm font-bold font-mono text-emerald-400">
                          ${contract.claimedProfit.toFixed(2)} / +${accruedClaimable.toFixed(2)}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2">
                        {contract.status === 'mining' && (
                          <button
                            onClick={() => claimMiningReward(contract.id)}
                            disabled={accruedClaimable <= 0}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                              accruedClaimable > 0 
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/30'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            Claim (${accruedClaimable.toFixed(2)})
                          </button>
                        )}

                        {contract.status === 'mining' && (
                          <button
                            onClick={() => terminateMiningContract(contract.id)}
                            title={isCompleted ? "Redeem full principal and remaining yields" : "Early redeem principal and accrued rewards"}
                            className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                          >
                            {isCompleted ? 'Redeem Principal' : 'End Contract'}
                          </button>
                        )}

                        {contract.status === 'completed' && (
                          <span className="text-xs font-mono text-purple-400 flex items-center space-x-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Principal Settled</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar & Countdown */}
                  <div className="mt-3 pt-3 border-t border-slate-800/60">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
                      <span>Contract Mining Progress ({progressPct.toFixed(1)}%)</span>
                      <span>
                        {isCompleted 
                          ? 'Contract Matured' 
                          : `Remaining: ${daysLeft}d ${hoursLeft}h`
                        }
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-purple-500' : 'bg-gradient-to-r from-amber-500 to-emerald-400'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Mining Profit Forecaster & Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#090e1d] p-6 shadow-xl">
          <div className="flex items-center space-x-2 pb-4 border-b border-slate-800">
            <Gauge className="h-5 w-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-white font-mono">MINING PROFIT FORECASTER</h2>
              <p className="text-xs text-slate-400">
                Simulate your hashrate returns across any tier using the official rules.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Select Contract Duration Tier
              </label>
              <select
                value={calcPlanId}
                onChange={(e) => {
                  setCalcPlanId(e.target.value);
                  const p = miningPlans.find(plan => plan.id === e.target.value);
                  if (p) setCalcInputAmount(p.minDeposit.toString());
                }}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white font-mono focus:border-amber-500 focus:outline-none"
              >
                {miningPlans.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.durationDays} Days (Min ${plan.minDeposit.toLocaleString()} → Rate {plan.rewardRate})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">
                Simulated Deposit Amount (USDT)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={calcInputAmount}
                  onChange={(e) => setCalcInputAmount(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white font-mono focus:border-amber-500 focus:outline-none"
                  placeholder="Enter amount"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">USDT</span>
              </div>
            </div>
          </div>

          {/* Forecasted Results Breakdown */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-xs text-slate-400 font-mono">Daily Yield</span>
              <p className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                +${calcDailyYield.toFixed(2)}
              </p>
            </div>

            <div>
              <span className="text-xs text-slate-400 font-mono">Total Profit ({currentCalcPlan.durationDays}D)</span>
              <p className="text-base font-bold font-mono text-amber-400 mt-0.5">
                +${calcTotalProfit.toFixed(2)}
              </p>
            </div>

            <div>
              <span className="text-xs text-slate-400 font-mono">Total Payout</span>
              <p className="text-base font-bold font-mono text-white mt-0.5">
                ${calcTotalPayout.toFixed(2)}
              </p>
            </div>

            <div>
              <span className="text-xs text-slate-400 font-mono">Annualized APY</span>
              <p className="text-base font-bold font-mono text-cyan-300 mt-0.5">
                {calcApy}% APY
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Rule: {currentCalcPlan.durationDays}d: {currentCalcPlan.minDeposit.toLocaleString()} → {currentCalcPlan.rewardRate}</span>
            <button
              onClick={() => handleSelectPlan(currentCalcPlan)}
              className="text-amber-400 hover:text-amber-300 font-semibold flex items-center space-x-1"
            >
              <span>Deploy this plan</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Live ASIC Subnet Infrastructure Card */}
        <div className="rounded-xl border border-slate-800 bg-[#090e1d] p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
              <ShieldCheck className="h-4 w-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white font-mono">MINING SECURITY & GUARANTEES</h3>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-300">
              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Zero Hardware Risk:</strong>
                  <p className="text-slate-400 text-xs mt-0.5">Hardware malfunctions, electricity costs, and ASIC degradation are 100% absorbed by the platform.</p>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Automated Daily Settlements:</strong>
                  <p className="text-slate-400 text-xs mt-0.5">Yield is accrued continuously and can be claimed anytime to your spot USDT balance.</p>
                </div>
              </div>

              <div className="flex items-start space-x-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Proof of Reserves:</strong>
                  <p className="text-slate-400 text-xs mt-0.5">All computing clusters are backed by institutional multi-sig custody and audited hash output.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Cooling System:</span>
              <span className="text-cyan-300 font-semibold">Submersible Liquid Immersion</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mt-1">
              <span>Energy Source:</span>
              <span className="text-emerald-400 font-semibold">100% Hydroelectric</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription / Hashrate Allocation Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0c1329] p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Cpu className="h-5 w-5 text-amber-400" />
                <h3 className="text-base font-bold text-white font-sans">
                  Deploy Mining Hashrate
                </h3>
              </div>
              <button
                onClick={() => setSelectedPlan(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDeployHashrate} className="mt-4 space-y-4">
              <div className="rounded-lg bg-slate-900/90 border border-slate-800 p-3 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Selected Tier:</span>
                  <span className="text-white font-semibold">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-slate-400">Duration:</span>
                  <span className="text-cyan-300 font-semibold">{selectedPlan.durationDays} Days</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-slate-400">Rule Rate:</span>
                  <span className="text-amber-400 font-bold">{selectedPlan.rewardRate} ({selectedPlan.totalReturnPct}%)</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-slate-400">Minimum Required:</span>
                  <span className="text-white font-semibold">${selectedPlan.minDeposit.toLocaleString()} USDT</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-300">Deposit Amount</span>
                  <span className="text-slate-400">
                    Wallet: <strong className="text-emerald-400">${wallet.usdtBalance.toLocaleString()} USDT</strong>
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    min={selectedPlan.minDeposit}
                    step="100"
                    required
                    className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white font-mono focus:border-amber-500 focus:outline-none"
                    placeholder={`Min: ${selectedPlan.minDeposit}`}
                  />
                  <button
                    type="button"
                    onClick={() => setDepositAmount(selectedPlan.minDeposit.toString())}
                    className="absolute right-14 top-2 text-xs font-mono bg-slate-800 text-slate-300 hover:text-white px-2 py-0.5 rounded border border-slate-700"
                  >
                    MIN
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositAmount(wallet.usdtBalance.toString())}
                    className="absolute right-3 top-2 text-xs font-mono bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 px-2 py-0.5 rounded border border-amber-500/40"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Instant Projected Earnings */}
              {parseFloat(depositAmount) > 0 && (
                <div className="rounded-lg bg-amber-950/20 border border-amber-800/40 p-3 text-xs font-mono space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estimated Profit:</span>
                    <span className="text-emerald-400 font-bold">
                      +${(parseFloat(depositAmount) * selectedPlan.rewardRate).toFixed(2)} USDT
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Return:</span>
                    <span className="text-white font-bold">
                      ${(parseFloat(depositAmount) * (1 + selectedPlan.rewardRate)).toFixed(2)} USDT
                    </span>
                  </div>
                </div>
              )}

              {/* Status Message */}
              {actionStatus && (
                <div className={`p-3 rounded-lg text-xs font-mono flex items-start space-x-2 ${
                  actionStatus.success 
                    ? 'bg-emerald-950/60 border border-emerald-800/80 text-emerald-300'
                    : 'bg-rose-950/60 border border-rose-800/80 text-rose-300'
                }`}>
                  {actionStatus.success ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  )}
                  <span>{actionStatus.message}</span>
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPlan(null)}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800 py-2 text-xs font-mono font-medium text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 py-2 text-xs font-mono font-bold text-black shadow-lg shadow-amber-900/30"
                >
                  Confirm & Start Mining
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
