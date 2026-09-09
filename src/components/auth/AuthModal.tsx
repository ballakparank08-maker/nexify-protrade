import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  KeyRound, 
  Mail, 
  Lock
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { NexifyLogo } from '../common/NexifyLogo';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, loginWithCredentials } = useTrading();
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const result = await loginWithCredentials(emailInput, passwordInput);
    if (!result.success) setErrorMessage(result.error || 'Unable to sign in with those credentials.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0a0f20] p-6 shadow-2xl relative">
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4">
          <NexifyLogo variant="full" size="sm" showSubtext />
        </div>

        <div className="flex items-center space-x-2.5 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-950/80 border border-purple-800/50 text-purple-400">
            <Lock className="h-4 w-4" />
          </div>
          <h3 className="text-lg font-bold text-white font-mono">AUTHENTICATE WORKSTATION</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Sign in with your registered member ID or email and password.
        </p>

        {errorMessage && <p className="mb-3 rounded-lg border border-rose-800/60 bg-rose-950/30 p-2.5 text-xs text-rose-300">{errorMessage}</p>}
        <form onSubmit={handleCredentialsSubmit} className="space-y-3 font-mono text-xs">
            <div>
              <label className="text-slate-300 text-xs font-medium uppercase block mb-1">Member ID or email</label>
              <div className="flex items-center rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white">
                <Mail className="h-4 w-4 text-slate-500 mr-2" />
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-transparent outline-none text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 text-xs font-medium uppercase block mb-1">Password</label>
              <div className="flex items-center rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white">
                <KeyRound className="h-4 w-4 text-slate-500 mr-2" />
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-transparent outline-none text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-bold text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:brightness-110 transition-all text-xs"
            >
              SIGN IN
            </button>
        </form>

        <div className="mt-5 pt-3 border-t border-slate-800 text-xs text-slate-400 text-center font-mono flex items-center justify-center space-x-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span>Secure credential authentication</span>
        </div>
      </div>
    </div>
  );
};
