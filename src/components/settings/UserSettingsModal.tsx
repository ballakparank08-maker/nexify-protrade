import React from 'react';
import { ShieldCheck, Lock, Clock, X, LogOut, Mail, User as UserIcon } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

export const UserSettingsModal: React.FC = () => {
  const {
    currentUser,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    settingsActiveTab,
    setSettingsActiveTab,
    securityAuditLogs,
    logout,
  } = useTrading();

  if (!isSettingsModalOpen || !currentUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fadeIn">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-[#090e1e] p-6 text-slate-200 shadow-2xl sm:p-8">
        <button
          type="button"
          id="close-settings-modal-btn"
          onClick={() => setIsSettingsModalOpen(false)}
          className="absolute right-5 top-5 rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800/80 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 flex items-start space-x-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-purple-800/50 bg-purple-950/80 text-purple-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h3 className="font-mono text-xl font-bold text-white">Account Security & Settings</h3>
              <span className={`rounded border px-2 py-0.5 text-xs font-bold uppercase ${
                currentUser.role === 'admin'
                  ? 'border-amber-800/50 bg-amber-950/80 text-amber-300'
                  : 'border-purple-800/50 bg-purple-950/80 text-purple-300'
              }`}>
                {currentUser.role}
              </span>
            </div>
            <p className="mt-0.5 font-mono text-xs text-slate-400">
              Backend-backed email/password authentication for {currentUser.email}
            </p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-1 rounded-xl border border-slate-800 bg-slate-900/90 p-1 text-xs font-mono">
          {[
            { id: 'account', label: 'Account', icon: UserIcon },
            { id: 'security', label: 'Security', icon: Lock },
            { id: 'sessions', label: 'Audit Trail', icon: Clock },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSettingsActiveTab(tab.id as 'account' | 'security' | 'sessions')}
              className={`flex items-center justify-center space-x-1.5 rounded-lg px-3 py-2 font-bold transition-all ${
                settingsActiveTab === tab.id
                  ? 'border border-purple-800/50 bg-purple-950/90 text-purple-300 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {settingsActiveTab === 'account' && (
          <div className="space-y-4 font-mono text-xs">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-[#060a14] p-4">
                <div className="mb-1 text-slate-400">Full name</div>
                <div className="text-sm font-semibold text-white">{currentUser.name}</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-[#060a14] p-4">
                <div className="mb-1 text-slate-400">Member ID</div>
                <div className="text-sm font-semibold text-white">{currentUser.id}</div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#060a14] p-4">
              <div className="mb-2 flex items-center space-x-2 text-slate-300">
                <Mail className="h-4 w-4 text-purple-400" />
                <span className="font-bold">Email authentication</span>
              </div>
              <div className="text-sm text-white">{currentUser.email}</div>
              <p className="mt-2 text-slate-400">
                Passwords are verified on the backend and stored only as hashes in the server database.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-[#060a14] p-4">
                <div className="mb-1 text-slate-400">Created</div>
                <div className="text-sm text-white">{currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleString() : 'Unavailable'}</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-[#060a14] p-4">
                <div className="mb-1 text-slate-400">Last profile update</div>
                <div className="text-sm text-white">{currentUser.updatedAt ? new Date(currentUser.updatedAt).toLocaleString() : 'Unavailable'}</div>
              </div>
            </div>
          </div>
        )}

        {settingsActiveTab === 'security' && (
          <div className="space-y-4 font-mono text-xs">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
              <div className="mb-2 flex items-center space-x-2 text-emerald-300">
                <ShieldCheck className="h-4 w-4" />
                <span className="font-bold">Active protections</span>
              </div>
              <ul className="space-y-2 text-slate-300">
                <li>• Authenticated sessions are restored through an HTTP-only cookie.</li>
                <li>• Admin access is confirmed against the backend before the admin console loads.</li>
                <li>• Legacy browser-only demo credentials no longer authorize accounts.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#060a14] p-4 text-slate-400">
              Password changes are not exposed in this demo UI yet. Use the separately hosted backend service to manage account records and bootstrap administrator access.
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center space-x-2 rounded-xl border border-rose-900/60 bg-rose-950/40 px-4 py-2.5 font-mono text-xs font-bold text-rose-300 transition-colors hover:bg-rose-900/50"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out of this session</span>
            </button>
          </div>
        )}

        {settingsActiveTab === 'sessions' && (
          <div className="space-y-3">
            {securityAuditLogs.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-[#060a14] p-4 font-mono text-xs text-slate-400">
                No security activity has been recorded in this browser session yet.
              </div>
            ) : (
              securityAuditLogs.map(log => (
                <div key={log.id} className="rounded-xl border border-slate-800 bg-[#060a14] p-4 font-mono text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-bold text-white">{log.action}</div>
                    <span className={`rounded px-2 py-0.5 uppercase ${
                      log.status === 'success'
                        ? 'bg-emerald-950/70 text-emerald-300'
                        : log.status === 'warning'
                        ? 'bg-amber-950/70 text-amber-300'
                        : 'bg-rose-950/70 text-rose-300'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                  <div className="mt-2 text-slate-400">
                    {log.timestamp} • {log.ip} • {log.location}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
