import React, { useState } from 'react';
import { AlertTriangle, ArrowLeft, Lock, Mail, ShieldAlert, User } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

interface LoginPageProps {
  targetDomain: 'app' | 'admin';
}

type AuthMode = 'signin' | 'signup';

export const LoginPage: React.FC<LoginPageProps> = ({ targetDomain }) => {
  const {
    currentUser,
    isAuthenticated,
    logout,
    loginWithCredentials,
    registerUser,
    setCurrentDomain,
    addSecurityAuditLog
  } = useTrading();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [emailOrMemberId, setEmailOrMemberId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sign up is only available for the trading workstation, never admin.
  const canSignUp = targetDomain === 'app';

  const handleModeSwitch = (nextMode: AuthMode) => {
    setMode(nextMode);
    setErrorMessage(null);
  };

  const handleCredentialsSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          setErrorMessage('Passwords do not match.');
          return;
        }
        const result = await registerUser({ name: fullName, email: emailOrMemberId, password });
        if (!result.success) {
          setErrorMessage(result.error || 'Unable to create your account.');
        }
        return;
      }

      const result = await loginWithCredentials(emailOrMemberId, password);
      if (!result.success) {
        setErrorMessage(result.error || 'Unable to sign in with those credentials.');
      }
    } catch {
      setErrorMessage(mode === 'signup' ? 'Sign up failed. Please try again.' : 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (targetDomain === 'admin' && isAuthenticated && currentUser?.role !== 'admin') {
    return (
      <div className="flex min-h-[75vh] w-full items-center justify-center px-4 py-6">
        <div className="w-full max-w-lg rounded-2xl border border-rose-800/80 bg-[#090e1e]/95 p-8 text-center shadow-2xl">
          <ShieldAlert className="mx-auto mb-4 h-8 w-8 text-rose-400" />
          <h2 className="mb-2 font-mono text-2xl font-bold text-white">Administrator access required</h2>
          <p className="mb-6 text-sm text-slate-300">Your account does not have permission to access the Admin Dashboard.</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button onClick={() => setCurrentDomain('app')} className="rounded-xl bg-purple-600 px-5 py-2.5 font-mono text-xs font-bold text-white hover:bg-purple-500">
              Return to workstation
            </button>
            <button onClick={() => { logout(); addSecurityAuditLog('Trader session ended to switch accounts', 'warning'); }} className="rounded-xl border border-slate-700 px-5 py-2.5 font-mono text-xs font-bold text-slate-300 hover:bg-slate-800">
              Sign in with another account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isSignUp = mode === 'signup' && canSignUp;

  return (
    <div className="flex min-h-[75vh] w-full items-center justify-center px-4 py-6">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/40 px-3 py-1 font-mono text-xs text-purple-300">
            <Lock className="h-3.5 w-3.5" />
            <span>{targetDomain === 'admin' ? 'Administrator sign in' : (isSignUp ? 'Create your member account' : 'Secure member sign in')}</span>
          </div>
          <h2 className="font-mono text-2xl font-bold text-white">
            {targetDomain === 'admin' ? 'Nexify Admin Access' : (isSignUp ? 'Join Nexify ProTrade' : 'Nexify Workstation Access')}
          </h2>
        </div>

        {canSignUp && (
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl border border-slate-800 bg-slate-900/60 p-1 font-mono text-xs">
            <button
              type="button"
              onClick={() => handleModeSwitch('signin')}
              className={`rounded-lg py-2 transition-all ${mode === 'signin' ? 'bg-purple-600/80 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch('signup')}
              className={`rounded-lg py-2 transition-all ${mode === 'signup' ? 'bg-purple-600/80 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Sign up
            </button>
          </div>
        )}

        <form onSubmit={handleCredentialsSubmit} className="rounded-2xl border border-slate-800/90 bg-[#090e1e]/90 p-6 shadow-2xl sm:p-8">
          {errorMessage && (
            <div className="mb-5 flex gap-2.5 rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isSignUp && (
            <label className="mb-4 block">
              <span className="mb-1.5 block font-mono text-xs uppercase text-slate-300">Full name</span>
              <span className="flex items-center rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2.5 focus-within:border-purple-500/60">
                <User className="mr-2.5 h-4 w-4 shrink-0 text-slate-400" />
                <input type="text" required autoComplete="name" value={fullName} onChange={event => setFullName(event.target.value)} placeholder="Your full name" className="w-full bg-transparent font-mono text-xs text-white outline-none" />
              </span>
            </label>
          )}

          <label className="mb-4 block">
            <span className="mb-1.5 block font-mono text-xs uppercase text-slate-300">Email address</span>
            <span className="flex items-center rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2.5 focus-within:border-purple-500/60">
              <Mail className="mr-2.5 h-4 w-4 shrink-0 text-slate-400" />
              <input type="email" required autoComplete="email" value={emailOrMemberId} onChange={event => setEmailOrMemberId(event.target.value)} placeholder="name@example.com" className="w-full bg-transparent font-mono text-xs text-white outline-none" />
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block font-mono text-xs uppercase text-slate-300">Password</span>
            <span className="flex items-center rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2.5 focus-within:border-purple-500/60">
              <Lock className="mr-2.5 h-4 w-4 shrink-0 text-slate-400" />
              <input type="password" required autoComplete={isSignUp ? 'new-password' : 'current-password'} value={password} onChange={event => setPassword(event.target.value)} placeholder={isSignUp ? 'Create a password (min 8 chars)' : 'Enter your password'} className="w-full bg-transparent font-mono text-xs text-white outline-none" />
            </span>
          </label>

          {isSignUp && (
            <label className="mt-4 block">
              <span className="mb-1.5 block font-mono text-xs uppercase text-slate-300">Confirm password</span>
              <span className="flex items-center rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2.5 focus-within:border-purple-500/60">
                <Lock className="mr-2.5 h-4 w-4 shrink-0 text-slate-400" />
                <input type="password" required autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder="Re-enter your password" className="w-full bg-transparent font-mono text-xs text-white outline-none" />
              </span>
            </label>
          )}

          <button type="submit" disabled={isLoading} className="mt-6 w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 font-mono text-xs font-bold text-white shadow-xl transition-all hover:brightness-110 disabled:opacity-50">
            {isLoading ? (isSignUp ? 'CREATING ACCOUNT...' : 'SIGNING IN...') : (isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN')}
          </button>

          {canSignUp && (
            <p className="mt-4 text-center font-mono text-xs text-slate-400">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => handleModeSwitch(isSignUp ? 'signin' : 'signup')}
                className="text-purple-300 hover:text-purple-200"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          )}

          <button type="button" onClick={() => setCurrentDomain('landing')} className="mt-4 inline-flex w-full items-center justify-center gap-1.5 font-mono text-xs text-slate-400 hover:text-purple-300">
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to landing page
          </button>
        </form>
      </div>
    </div>
  );
};
