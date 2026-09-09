import React from 'react';
import { 
  ShieldCheck, 
  Zap, 
  Lock, 
  Cpu, 
  ArrowRight, 
  TrendingUp, 
  Percent, 
  Landmark, 
  Coins, 
  Layers, 
  ChevronRight, 
  CheckCircle2, 
  Globe, 
  Activity
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { NexifyLogo } from '../common/NexifyLogo';

export const LandingPage: React.FC = () => {
  const { setCurrentDomain, setCurrentTab, cryptoAssets } = useTrading();

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 bg-tech-grid">
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Neon Ambient Background Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none -z-10"></div>
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[250px] bg-cyan-600/10 blur-[100px] rounded-full pointer-events-none -z-10"></div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Nexify ProTrade Centered Master Logo */}
            <div className="flex justify-center pb-2">
              <NexifyLogo variant="full" size="xl" showSubtext />
            </div>

            {/* Status pill */}
            <div className="inline-flex items-center space-x-2 rounded-full border border-cyan-500/30 bg-cyan-950/30 px-3.5 py-1 text-xs font-mono text-cyan-300 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span>NEXIFY PROTRADE V3.4 • MULTI-CHAIN OFF-CHAIN MATCHING LIVE</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight font-sans">
              The Enterprise Web3 <br />
              <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                Digital Asset Workstation
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Institutional spot execution, non-custodial staking pools, instant algorithmic crypto loans, and benchmarked quantitative crypto indices—engineered with sub-5ms latency.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                id="landing-launch-app"
                onClick={() => {
                  setCurrentDomain('app');
                  setCurrentTab('spot');
                }}
                className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_0_25px_rgba(168,85,247,0.35)] transition-all hover:scale-105 hover:brightness-110"
              >
                <span>Launch Trading Workstation</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                id="landing-view-portfolio"
                onClick={() => {
                  setCurrentDomain('app');
                  setCurrentTab('portfolio');
                }}
                className="flex items-center space-x-2 rounded-xl border border-slate-700 bg-slate-900/80 px-6 py-3.5 text-sm font-medium text-slate-200 transition-all hover:border-slate-500 hover:bg-slate-800"
              >
                <span>View Asset Portfolio</span>
              </button>

            </div>

            {/* Quick trust metrics row */}
            <div className="pt-8 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center font-mono">
              <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-3 backdrop-blur-sm">
                <div className="text-2xl font-bold text-white tracking-tight">$18.42B</div>
                <div className="text-xs text-slate-400 mt-1">24h Trading Volume</div>
              </div>
              <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-3 backdrop-blur-sm">
                <div className="text-2xl font-bold text-emerald-400 tracking-tight">4.2 ms</div>
                <div className="text-xs text-slate-400 mt-1">Avg Execution Latency</div>
              </div>
              <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-3 backdrop-blur-sm">
                <div className="text-2xl font-bold text-purple-400 tracking-tight">102.4%</div>
                <div className="text-xs text-slate-400 mt-1">Proof of Reserves</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Market Glance Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center">
              <Activity className="h-5 w-5 text-purple-400 mr-2" />
              Live Market Ticker & Order Flows
            </h2>
            <p className="text-xs text-slate-400 mt-1">Real-time WebSocket feed from Nexify ProTrade central limit order book</p>
          </div>
          <button
            onClick={() => {
              setCurrentDomain('app');
              setCurrentTab('market');
            }}
            className="mt-3 md:mt-0 flex items-center space-x-1 text-xs font-mono text-purple-400 hover:text-purple-300"
          >
            <span>Explore All 80+ Markets</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cryptoAssets.slice(0, 3).map(asset => (
            <div
              key={asset.id}
              onClick={() => {
                setCurrentDomain('app');
                setCurrentTab('spot');
              }}
              className="cursor-pointer rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md transition-all hover:border-purple-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-white font-bold font-mono text-sm shadow-md"
                    style={{ backgroundColor: asset.iconBg }}
                  >
                    {asset.symbol.substring(0, 3)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-purple-300 transition-colors">{asset.name}</h3>
                    <span className="text-xs font-mono text-slate-400">{asset.symbol} / USDT</span>
                  </div>
                </div>
                <div className={`rounded-lg px-2.5 py-1 text-xs font-mono font-semibold ${
                  asset.change24h >= 0 ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40' : 'bg-rose-950/80 text-rose-300 border border-rose-800/40'
                }`}>
                  {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
                </div>
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <div className="text-2xl font-bold font-mono text-white">
                  ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Vol: ${(asset.volume24h / 1e9).toFixed(2)}B
                </div>
              </div>

              {/* Sparkline visualization */}
              <div className="mt-4 h-12 w-full flex items-end space-x-1.5 pt-2 border-t border-slate-800/60">
                {asset.sparkline.map((val, idx) => {
                  const min = Math.min(...asset.sparkline);
                  const max = Math.max(...asset.sparkline);
                  const heightPct = Math.max(15, Math.min(100, ((val - min) / (max - min || 1)) * 100));
                  return (
                    <div 
                      key={idx} 
                      className="flex-1 bg-gradient-to-t from-purple-600/30 to-purple-400 rounded-t-sm transition-all group-hover:to-cyan-400"
                      style={{ height: `${heightPct}%` }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4 Architectural Pillars */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-800/70">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Engineered For Institutional Traders
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Multi-threaded high-frequency order processing combined with transparent decentralized Web3 settlement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1 */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur-sm hover:border-purple-500/40 transition-colors">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-950/80 border border-purple-800/50 text-purple-300 mb-4">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Spot Trading Terminal</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Order types including Limit, Market, and Stop-Limit with live depth charts, real-time spread visualization, and crosshairs.
            </p>
            <button
              onClick={() => {
                setCurrentDomain('app');
                setCurrentTab('spot');
              }}
              className="mt-4 flex items-center text-xs font-mono text-purple-400 hover:text-purple-300"
            >
              <span>Open Terminal</span>
              <ArrowRight className="h-3 w-3 ml-1" />
            </button>
          </div>

          {/* Pillar 2 */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur-sm hover:border-emerald-500/40 transition-colors">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-950/80 border border-emerald-800/50 text-emerald-300 mb-4">
              <Percent className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Non-Custodial Staking</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Stake ETH, SOL, AVAX, and PRISM directly into institutional validator nodes with auto-compounding and transparent on-chain rewards.
            </p>
            <button
              onClick={() => {
                setCurrentDomain('app');
                setCurrentTab('staking');
              }}
              className="mt-4 flex items-center text-xs font-mono text-emerald-400 hover:text-emerald-300"
            >
              <span>View Staking APYs</span>
              <ArrowRight className="h-3 w-3 ml-1" />
            </button>
          </div>

          {/* Pillar 3 */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur-sm hover:border-amber-500/40 transition-colors">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-950/80 border border-amber-800/50 text-amber-300 mb-4">
              <Landmark className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Algorithmic Crypto Loans</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Borrow stablecoins against your BTC or ETH collateral with instant approval, real-time LTV margin health monitoring, and zero credit checks.
            </p>
            <button
              onClick={() => {
                setCurrentDomain('app');
                setCurrentTab('loan');
              }}
              className="mt-4 flex items-center text-xs font-mono text-amber-400 hover:text-amber-300"
            >
              <span>Calculate Loan</span>
              <ArrowRight className="h-3 w-3 ml-1" />
            </button>
          </div>

          {/* Pillar 4 */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur-sm hover:border-cyan-500/40 transition-colors">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-950/80 border border-cyan-800/50 text-cyan-300 mb-4">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Quantitative Indices</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Capitalization-weighted baskets across DeFi 10, Mega-Cap L1s, and AI & Machine Intelligence with automated quarterly rebalancing.
            </p>
            <button
              onClick={() => {
                setCurrentDomain('app');
                setCurrentTab('portfolio');
              }}
              className="mt-4 flex items-center text-xs font-mono text-cyan-400 hover:text-cyan-300"
            >
              <span>Explore Indices</span>
              <ArrowRight className="h-3 w-3 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Security Architecture & Institutional Compliance */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-800/70">
        <div className="rounded-3xl border border-purple-900/40 bg-gradient-to-br from-[#0c1122] via-[#070b16] to-[#0d091a] p-8 sm:p-12 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3 py-1 text-xs font-mono text-cyan-300 mb-4">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>CYBERSECURITY & PROOF OF SOLVENCY</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                Military-Grade Key Management & Merkle-Tree Auditing
              </h2>
              <p className="text-sm text-slate-400 mt-4 leading-relaxed">
                Nexify ProTrade operates with Multi-Party Computation (MPC) cold storage architecture with 4-of-7 quorum threshold signers. User deposits are 100% segregated and verifiable on-chain 24/7.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-center space-x-3 text-sm text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Real-time Merkle-Tree Proof of Reserves (102.4% over-collateralized)</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Automated Circuit Breaker stops market manipulations instantaneously</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Comprehensive KYC / AML compliance engine with multi-tier verification</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#080d1a] p-6 font-mono text-xs text-slate-300 space-y-4 shadow-inner">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-slate-400">Reserve Vault Status</span>
                <span className="text-emerald-400 font-bold flex items-center">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
                  HEALTHY & AUDITED
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Total User Liabilities:</span>
                <span className="text-white font-semibold">$1,420,500,000 USDT</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Multi-Sig Cold Reserves:</span>
                <span className="text-emerald-400 font-semibold">$1,454,592,000 USDT</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Coverage Ratio:</span>
                <span className="text-purple-300 font-semibold">102.40%</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Last Merkle Root Verification:</span>
                <span className="text-cyan-400 font-mono text-xs">0x8e2b4...31a9 (14 mins ago)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#040711] py-8 text-xs text-slate-500 font-mono">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <NexifyLogo variant="full" size="sm" showSubtext={false} />
            <span className="text-slate-500 pl-2 border-l border-slate-800">© 2026 Nexify ProTrade Global Ltd. All rights reserved.</span>
          </div>
          <div className="flex space-x-6">
            <button onClick={() => setCurrentDomain('app')} className="hover:text-slate-300">Trading Portal</button>
            <a href="#terms" className="hover:text-slate-300">Terms of Service</a>
            <a href="#privacy" className="hover:text-slate-300">Security Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
