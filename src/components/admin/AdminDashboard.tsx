import React, { useState } from 'react';
import { 
  Server, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Users, 
  Activity, 
  Database, 
  Radio, 
  Lock, 
  Unlock, 
  RefreshCw,
  Search,
  Sliders,
  ShieldAlert,
  LogOut,
  ArrowLeft,
  KeyRound
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

export const AdminDashboard: React.FC = () => {
  const { 
    kycUsers, 
    updateKycStatus, 
    circuitBreakerActive, 
    toggleCircuitBreaker, 
    engineLatencyMs,
    transactions,
    setCurrentDomain,
    setCurrentTab,
    currentUser,
    isAuthenticated,
    logout,
    addSecurityAuditLog
  } = useTrading();

  const [filterKyc, setFilterKyc] = useState<'all' | 'pending_review' | 'verified' | 'rejected'>('all');
  const [searchKyc, setSearchKyc] = useState('');
  const [adminActionMsg, setAdminActionMsg] = useState<string | null>(null);

  // Authoritative Security Enforcement: Only authorized administrators can view the Admin Dashboard
  if (!isAuthenticated || currentUser?.role !== 'admin') {
    return (
      <div className="w-full min-h-[70vh] flex items-center justify-center py-8 px-4">
        <div className="w-full max-w-lg rounded-2xl border border-rose-800/80 bg-[#090e1d]/95 p-8 text-center shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute -top-10 -left-10 h-32 w-32 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 h-32 w-32 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-700/60 flex items-center justify-center text-rose-400 mb-4 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full border border-rose-500/40 bg-rose-950/50 text-rose-300 text-xs font-mono mb-3 uppercase font-bold">
            <Lock className="h-3 w-3" />
            <span>HTTP 403: Forbidden</span>
          </div>

          <h2 className="text-2xl font-bold font-mono text-white mb-2">
            Administrator Clearance Required
          </h2>

          <p className="text-xs text-slate-300 mb-6 max-w-md mx-auto">
            The Institutional Admin Dashboard and KYC Compliance Engine are strictly restricted to authorized Root Administrators. Standard trader accounts are blocked from accessing this environment.
          </p>

          {currentUser && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5 mb-6 text-left font-mono text-xs space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>Current Account:</span>
                <span className="text-white font-bold">{currentUser.name}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Account Role:</span>
                <span className="text-amber-400 font-bold uppercase text-xs">{currentUser.role} (Non-Admin)</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Status:</span>
                <span className="text-rose-400 font-bold flex items-center">
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  Access Denied
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setCurrentDomain('app')}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Trading Terminal</span>
            </button>
            <button
              onClick={() => {
                logout();
                addSecurityAuditLog('Trader session closed to switch to Root Admin login', 'warning');
              }}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl border border-amber-500/50 bg-amber-950/30 hover:bg-amber-900/40 text-amber-300 font-mono text-xs font-bold transition-all"
            >
              <KeyRound className="h-4 w-4" />
              <span>Sign In as Admin</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredKyc = kycUsers.filter(u => {
    if (filterKyc !== 'all' && u.kycStatus !== filterKyc) return false;
    if (searchKyc) {
      const q = searchKyc.toLowerCase();
      return u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.country.toLowerCase().includes(q);
    }
    return true;
  });

  const handleApproveKyc = (id: string, name: string) => {
    updateKycStatus(id, 'verified');
    setAdminActionMsg(`Approved KYC verification for ${name}.`);
    setTimeout(() => setAdminActionMsg(null), 3000);
  };

  const handleRejectKyc = (id: string, name: string) => {
    updateKycStatus(id, 'rejected');
    setAdminActionMsg(`Rejected KYC verification for ${name}.`);
    setTimeout(() => setAdminActionMsg(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Root Admin Clearance Verification Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center space-x-2.5">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-xs font-bold text-amber-300">
            AUTHORIZED SEC-OPS SESSION:
          </span>
          <span className="font-mono text-xs text-white font-semibold">
            {currentUser.name} ({currentUser.email})
          </span>
          <span className="hidden md:inline-block rounded-md bg-amber-950 border border-amber-700 px-2 py-0.5 text-xs font-mono font-bold text-amber-300">
            ROOT TIER 0
          </span>
          {currentUser.twoFactorEnabled && (
            <span className="hidden md:inline-flex items-center space-x-1 rounded-md bg-emerald-950 border border-emerald-800 px-2 py-0.5 text-xs font-mono font-bold text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>2FA VERIFIED</span>
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentDomain('app')}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-900/80 text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Trading Terminal</span>
          </button>
          <button
            onClick={() => {
              logout();
              addSecurityAuditLog(`Administrator ${currentUser.email} terminated session`, 'success');
            }}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-rose-900/60 bg-rose-950/40 text-xs font-mono text-rose-300 hover:bg-rose-900/50 transition-colors"
          >
            <LogOut className="h-3 w-3" />
            <span>End Session</span>
          </button>
        </div>
      </div>

      {/* Admin Top Header & Emergency Circuit Breaker Banner */}
      <div className={`rounded-2xl border p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-colors ${
        circuitBreakerActive 
          ? 'border-amber-600/80 bg-amber-950/40' 
          : 'border-slate-800/80 bg-[#090e1d]/90'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-amber-400 mb-1">
              <Server className="h-4 w-4" />
              <span>NEXIFY PROTRADE ADMIN ENGINE GATEWAY</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-mono">
              Institutional Compliance & Risk Operations
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Real-time user KYC approval queue, system order-matching telemetry, AML anomaly detection, and centralized circuit breaker.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={toggleCircuitBreaker}
              className={`flex items-center space-x-2 rounded-xl px-5 py-3 text-xs font-bold font-mono tracking-wider transition-all shadow-xl ${
                circuitBreakerActive
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                  : 'bg-rose-600 text-white hover:bg-rose-500 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse'
              }`}
            >
              {circuitBreakerActive ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              <span>{circuitBreakerActive ? 'RESUME TRADING ENGINE' : 'HALT ALL TRADING (CIRCUIT BREAKER)'}</span>
            </button>
          </div>
        </div>

        {adminActionMsg && (
          <div className="mt-4 p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-800 text-emerald-300 font-mono text-xs flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{adminActionMsg}</span>
          </div>
        )}
      </div>

      {/* Institutional KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        <div className="rounded-2xl border border-white/10 bg-[#090e1d]/90 p-5 backdrop-blur-xl shadow-xl">
          <div className="text-slate-300 text-xs uppercase font-medium">Registered Pro Traders</div>
          <div className="text-white font-bold text-xl mt-1.5">14,820 Users</div>
          <div className="text-emerald-400 text-xs mt-1 font-semibold">+48 today</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#090e1d]/90 p-5 backdrop-blur-xl shadow-xl">
          <div className="text-slate-300 text-xs uppercase font-medium">Cold Reserve Assets</div>
          <div className="text-purple-300 font-bold text-xl mt-1.5">$1.454 Billion</div>
          <div className="text-emerald-400 text-xs mt-1 font-semibold">102.4% Reserve Ratio</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#090e1d]/90 p-5 backdrop-blur-xl shadow-xl">
          <div className="text-slate-300 text-xs uppercase font-medium">Matching Engine Latency</div>
          <div className="text-cyan-300 font-bold text-xl mt-1.5">{engineLatencyMs} ms</div>
          <div className="text-emerald-400 text-xs mt-1 font-semibold">Sub-5ms SLA Target Met</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#090e1d]/90 p-5 backdrop-blur-xl shadow-xl">
          <div className="text-slate-300 text-xs uppercase font-medium">Pending KYC Reviews</div>
          <div className="text-amber-400 font-bold text-xl mt-1.5">
            {kycUsers.filter(u => u.kycStatus === 'pending_review').length} Applications
          </div>
          <div className="text-slate-400 text-xs mt-1 font-semibold">Avg turnaround 12m</div>
        </div>
      </div>

      {/* USER MANAGEMENT & KYC APPROVAL QUEUE */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#090e1d]/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800/70">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white font-mono">USER MANAGEMENT & KYC COMPLIANCE QUEUE</h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search user name or country..."
                value={searchKyc}
                onChange={e => setSearchKyc(e.target.value)}
                className="rounded-xl border border-slate-700/80 bg-slate-900/90 pl-9 pr-4 py-1.5 text-xs font-mono text-white placeholder-slate-500 outline-none focus:border-purple-500 w-52"
              />
            </div>

            <div className="flex items-center space-x-1 font-mono text-xs">
              {(['all', 'pending_review', 'verified', 'rejected'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilterKyc(tab)}
                  className={`capitalize rounded-lg px-2.5 py-1 transition-colors ${
                    filterKyc === tab 
                      ? 'bg-purple-900/60 text-purple-200 font-bold border border-purple-700/50' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* KYC Queue Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-300 uppercase text-xs">
                <th className="pb-3.5 font-semibold">Trader Name & Email</th>
                <th className="pb-3.5 font-semibold">Country</th>
                <th className="pb-3.5 font-semibold">Tier Request</th>
                <th className="pb-3.5 font-semibold">Wallet Address</th>
                <th className="pb-3.5 font-semibold">30d Vol</th>
                <th className="pb-3.5 font-semibold">Status</th>
                <th className="pb-3.5 font-semibold text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredKyc.map(user => (
                <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5">
                    <div className="font-bold text-white text-sm">{user.fullName}</div>
                    <div className="text-xs text-slate-300">{user.email}</div>
                  </td>
                  <td className="py-3.5 text-slate-200">{user.country}</td>
                  <td className="py-3.5">
                    <span className="rounded-md bg-slate-800 px-2.5 py-1 text-xs text-purple-300 border border-slate-700">
                      {user.tier}
                    </span>
                  </td>
                  <td className="py-3.5 text-slate-300 font-mono text-xs">{user.walletAddress}</td>
                  <td className="py-3.5 text-slate-200">${(user.tradingVolumeUsd / 1e6).toFixed(2)}M</td>
                  <td className="py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                      user.kycStatus === 'verified'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                        : user.kycStatus === 'pending_review'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800/50'
                          : 'bg-rose-950 text-rose-300 border border-rose-800/50'
                    }`}>
                      {user.kycStatus === 'verified' && <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
                      {user.kycStatus === 'pending_review' && <Activity className="h-3.5 w-3.5 mr-1 animate-pulse" />}
                      {user.kycStatus === 'rejected' && <XCircle className="h-3.5 w-3.5 mr-1" />}
                      {user.kycStatus.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    {user.kycStatus === 'pending_review' ? (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleApproveKyc(user.id, user.fullName)}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectKyc(user.id, user.fullName)}
                          className="rounded-lg bg-rose-600/80 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-600 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => updateKycStatus(user.id, 'pending_review')}
                        className="text-xs text-slate-400 hover:text-slate-200 underline"
                      >
                        Re-evaluate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TRANSACTION MONITORING & RISK LOG */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#090e1d]/90 p-5 backdrop-blur-xl shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/70">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white font-mono">LIVE TRANSACTION & AML AUDIT FEED</h3>
          </div>
          <span className="text-xs font-mono text-emerald-400">Zero Flagged Exploits</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-300 uppercase text-xs">
                <th className="pb-3 font-semibold">Tx ID</th>
                <th className="pb-3 font-semibold">Type</th>
                <th className="pb-3 font-semibold">Asset / Volume</th>
                <th className="pb-3 font-semibold">Execution Layer</th>
                <th className="pb-3 font-semibold">AML Risk Rating</th>
                <th className="pb-3 text-right font-semibold">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {transactions.slice(0, 5).map(tx => (
                <tr key={tx.id} className="hover:bg-slate-800/20">
                  <td className="py-3 text-slate-300">{tx.txHash}</td>
                  <td className="py-3 uppercase font-bold text-white">{tx.type}</td>
                  <td className="py-3 text-emerald-400 font-bold">${tx.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="py-3 text-slate-200">{tx.network}</td>
                  <td className="py-3">
                    <span className="rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 px-2.5 py-1 text-xs font-medium">
                      LOW RISK (PASSED)
                    </span>
                  </td>
                  <td className="py-3 text-right text-slate-400">{tx.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
