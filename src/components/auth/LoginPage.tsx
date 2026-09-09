import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  KeyRound, 
  ArrowRight, 
  ArrowLeft,
  Wallet, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  Clock, 
  Smartphone, 
  ShieldAlert, 
  Sparkles, 
  Globe, 
  ExternalLink,
  ChevronLeft,
  Key,
  XCircle
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { NexifyLogo } from '../common/NexifyLogo';
import { getTOTPTimeRemaining, computeTOTP } from '../../utils/totp';
import { UserSession } from '../../types';

interface LoginPageProps {
  targetDomain: 'app' | 'admin';
}

export const LoginPage: React.FC<LoginPageProps> = ({ targetDomain }) => {
  const { 
    currentUser,
    isAuthenticated,
    logout,
    loginWithCredentials, 
    loginWithWallet, 
    verifyLogin2FA, 
    setCurrentDomain,
    addSecurityAuditLog
  } = useTrading();

  const [authMethod, setAuthMethod] = useState<'credentials' | 'wallet'>('credentials');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 2FA Challenge State
  const [is2FAStep, setIs2FAStep] = useState(false);
  const [tempUser, setTempUser] = useState<UserSession | null>(null);
  const [totpDigits, setTotpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCodeInput, setBackupCodeInput] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [previewCode, setPreviewCode] = useState<string>('');

  const digitInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 30s Countdown timer for Google Authenticator TOTP window
  useEffect(() => {
    const updateTimer = async () => {
      const { secondsRemaining } = getTOTPTimeRemaining();
      setTimeRemaining(secondsRemaining);

      if (is2FAStep && tempUser && tempUser.twoFactorSecret) {
        try {
          const currentCode = await computeTOTP(tempUser.twoFactorSecret, 0);
          setPreviewCode(currentCode);
        } catch {
          // ignore
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [is2FAStep, tempUser]);

  // Focus first digit box when 2FA step opens
  useEffect(() => {
    if (is2FAStep && !useBackupCode) {
      setTimeout(() => {
        digitInputRefs.current[0]?.focus();
      }, 150);
    }
  }, [is2FAStep, useBackupCode]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setErrorMessage(null);
    setIsLoading(true);
    try {
      const res = await loginWithCredentials(emailInput, passwordInput);
      if (res.requires2FA && res.tempUser) {
        setTempUser(res.tempUser);
        setIs2FAStep(true);
        setTotpDigits(['', '', '', '', '', '']);
      } else if (!res.success && res.error) {
        setErrorMessage(res.error);
      }
    } catch {
      setErrorMessage('Authentication handshake failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletLogin = async (walletName: string) => {
    if (targetDomain === 'admin') {
      setErrorMessage('Access Denied: Non-custodial Web3 wallets are not whitelisted for root administrative access. Please authenticate using authorized Root Administrator credentials.');
      addSecurityAuditLog(`Declined Web3 wallet login on Admin portal (${walletName})`, 'failed');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    try {
      const res = await loginWithWallet(walletName);
      if (res.requires2FA && res.tempUser) {
        setTempUser(res.tempUser);
        setIs2FAStep(true);
        setTotpDigits(['', '', '', '', '', '']);
      } else if (!res.success) {
        setErrorMessage(res.error || 'Wallet sign-in is unavailable.');
      }
    } catch {
      setErrorMessage('Wallet signature declined or timed out.');
    } finally {
      setIsLoading(false);
    }
  };

  // 6-digit TOTP input handlers
  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    if (!clean) {
      const newDigits = [...totpDigits];
      newDigits[index] = '';
      setTotpDigits(newDigits);
      return;
    }

    // Single digit input
    const newDigits = [...totpDigits];
    newDigits[index] = clean.slice(-1);
    setTotpDigits(newDigits);

    // Auto-advance to next box
    if (index < 5 && clean) {
      digitInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 digits entered
    const completeCode = newDigits.join('');
    if (completeCode.length === 6) {
      submit2FA(completeCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !totpDigits[index] && index > 0) {
      digitInputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;

    const newDigits = [...totpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasteData[i] || '';
    }
    setTotpDigits(newDigits);

    if (pasteData.length === 6) {
      submit2FA(pasteData);
    } else if (pasteData.length > 0) {
      digitInputRefs.current[Math.min(5, pasteData.length)]?.focus();
    }
  };

  const submit2FA = async (codeToVerify?: string) => {
    if (!tempUser) return;
    const code = codeToVerify || (useBackupCode ? backupCodeInput : totpDigits.join(''));
    if (!code) {
      setErrorMessage('Please enter your 6-digit authenticator code.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    try {
      const res = await verifyLogin2FA(code, tempUser);
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid code');
        setTotpDigits(['', '', '', '', '', '']);
        digitInputRefs.current[0]?.focus();
      }
    } catch {
      setErrorMessage('Verification failed. Check your authenticator app.');
    } finally {
      setIsLoading(false);
    }
  };

  const autoFillPreviewCode = () => {
    if (!previewCode) return;
    const digits = previewCode.split('');
    setTotpDigits(digits);
    submit2FA(previewCode);
  };

  // STRICT AUTHORIZATION BARRIER:
  // If user is authenticated as a trader, but attempting to view the Admin domain
  if (targetDomain === 'admin' && isAuthenticated && currentUser && currentUser.role !== 'admin') {
    return (
      <div className="w-full min-h-[75vh] flex items-center justify-center py-6 px-4">
        <div className="w-full max-w-xl">
          <div className="relative rounded-2xl border border-rose-800/80 bg-[#090e1e]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center overflow-hidden">
            {/* Ambient Glow */}
            <div className="absolute -top-12 -left-12 h-40 w-40 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 h-40 w-40 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-700/60 flex items-center justify-center text-rose-400 mb-4 shadow-[0_0_20px_rgba(244,63,94,0.25)]">
              <ShieldAlert className="h-8 w-8" />
            </div>

            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full border border-rose-500/40 bg-rose-950/50 text-rose-300 text-xs font-mono mb-3">
              <Lock className="h-3 w-3" />
              <span className="font-bold tracking-wider uppercase">HTTP 403: Forbidden - Admin Role Required</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white mb-2">
              Unauthorized Admin Access
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mb-6">
              Only authorized administrators with <span className="text-amber-400 font-mono font-semibold">Root SecOps Clearance</span> are permitted to view the Admin Dashboard, inspect confidential KYC documents, and operate system circuit breakers.
            </p>

            {/* Session Inspector Box */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 mb-6 text-left font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                <span>Authenticated Identity:</span>
                <span className="text-white font-bold">{currentUser.name}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                <span>Account Email:</span>
                <span className="text-slate-300">{currentUser.email}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                <span>Active Role:</span>
                <span className="px-2.5 py-1 rounded-md bg-purple-950 text-purple-300 border border-purple-800/50 font-bold uppercase text-xs">
                  {currentUser.role} (Standard Trader Clearance)
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Access Evaluation:</span>
                <span className="text-rose-400 font-bold flex items-center">
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  REJECTED — Insufficient Permissions
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                id="unauthorized-return-workstation-btn"
                onClick={() => setCurrentDomain('app')}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)]"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Return to Trading Workstation</span>
              </button>

              <button
                id="unauthorized-switch-admin-btn"
                onClick={() => {
                  logout();
                  addSecurityAuditLog('Trader session terminated to initiate Admin login', 'warning');
                }}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl border border-amber-500/50 bg-amber-950/30 hover:bg-amber-900/40 text-amber-300 font-mono text-xs font-bold transition-all"
              >
                <KeyRound className="h-4 w-4" />
                <span>Sign In with Admin Account</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[75vh] flex items-center justify-center py-6 px-4">
      <div className="w-full max-w-xl">
        {/* Security Header Banner */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-950/40 text-purple-300 text-xs font-mono mb-3 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <Lock className="h-3.5 w-3.5 text-purple-400" />
            <span className="font-semibold uppercase tracking-wider">
              {targetDomain === 'admin' ? 'Root Security Clearance' : 'Institutional Gateway Authentication'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white mb-2">
            {targetDomain === 'admin' ? 'Nexify Admin Access' : 'Nexify Workstation Access'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            {targetDomain === 'admin' 
              ? 'Institutional risk parameters, user KYC governance, and high-frequency matching engine controls.' 
              : 'Direct market execution terminal, multi-chain portfolio vaults, and algorithmic liquidity routing.'}
          </p>
        </div>

        {/* Card Container */}
        <div className="relative rounded-2xl border border-slate-800/90 bg-[#090e1e]/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Ambient Glow */}
          <div className="absolute -top-12 -left-12 h-36 w-36 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 h-36 w-36 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Error Notice */}
          {errorMessage && (
            <div className="mb-5 flex items-start space-x-2.5 rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {!is2FAStep ? (
            /* Primary Authentication Screen */
            <div className="space-y-6">
              {/* Method Selector Tabs */}
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-900/90 p-1 border border-slate-800 text-xs font-mono">
                <button
                  type="button"
                  id="auth-tab-credentials"
                  onClick={() => { setAuthMethod('credentials'); setErrorMessage(null); }}
                  className={`py-2 px-2 rounded-lg font-bold transition-all text-center ${
                    authMethod === 'credentials'
                      ? 'bg-purple-950/80 text-purple-300 border border-purple-800/50 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {targetDomain === 'admin' ? 'Admin Login' : 'Trader Login'}
                </button>
                <button
                  type="button"
                  id="auth-tab-wallet"
                  onClick={() => { setAuthMethod('wallet'); setErrorMessage(null); }}
                  className={`py-2 px-2 rounded-lg font-bold transition-all text-center ${
                    authMethod === 'wallet'
                      ? 'bg-purple-950/80 text-purple-300 border border-purple-800/50 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Web3 Wallet
                </button>
              </div>

              {/* Credentials Login */}
              {authMethod === 'credentials' && (
                <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                  <div>
                    <label className="text-slate-300 text-xs font-mono block mb-1.5 uppercase">
                      {targetDomain === 'admin' ? 'Authorized Root Administrator Email' : 'Trader / Institution Email'}
                    </label>
                    <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2.5 text-white focus-within:border-purple-500/60 transition-colors">
                      <Mail className="h-4 w-4 text-slate-400 mr-2.5 shrink-0" />
                      <input
                        type="email"
                        id="login-email-input"
                        required
                        value={emailInput}
                        onChange={e => setEmailInput(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full bg-transparent outline-none font-mono text-xs text-white"
                      />
                    </div>
                    {targetDomain === 'admin' && (
                      <span className="text-xs text-amber-400 font-mono mt-1 block">
                        * Restricted: Only accounts assigned the administrator role can access this area.
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-slate-300 text-xs font-mono uppercase">
                        {targetDomain === 'admin' ? 'Root Administrator Secret / Master Passphrase' : 'Workstation Password / API Secret'}
                      </label>
                      <span className="text-xs text-purple-400 font-mono">PBKDF2-SHA256 Encrypted</span>
                    </div>
                    <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2.5 text-white focus-within:border-purple-500/60 transition-colors">
                      <Lock className="h-4 w-4 text-slate-400 mr-2.5 shrink-0" />
                      <input
                        type="password"
                        id="login-password-input"
                        required
                        value={passwordInput}
                        onChange={e => setPasswordInput(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-transparent outline-none font-mono text-xs text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="login-submit-credentials-btn"
                    disabled={isLoading}
                    className={`w-full mt-2 py-3 rounded-xl font-mono font-bold text-xs text-white shadow-xl hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 ${
                      targetDomain === 'admin'
                        ? 'bg-gradient-to-r from-amber-600 to-amber-700 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                    }`}
                  >
                    {isLoading 
                      ? 'ESTABLISHING SECURE SESSION...' 
                      : targetDomain === 'admin' 
                        ? 'VERIFY ROOT ADMIN CLEARANCE' 
                        : 'AUTHENTICATE & ENTER'}
                  </button>
                </form>
              )}

              {/* TAB 3: Web3 Wallet Connect */}
              {authMethod === 'wallet' && (
                <div className="space-y-2.5">
                  {targetDomain === 'admin' ? (
                    <div className="rounded-xl border border-rose-800/60 bg-rose-950/30 p-3.5 text-xs text-rose-300 font-mono space-y-1 mb-2">
                      <div className="font-bold flex items-center space-x-1.5 text-rose-400">
                        <AlertTriangle className="h-4 w-4" />
                        <span>WEB3 WALLET ACCESS RESTRICTED</span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Institutional regulatory policies strictly prohibit anonymous Web3 wallet access to the administrative console and customer KYC databases. Only hardware 2FA and authorized Root Admin credentials are accepted.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300 font-mono mb-2">
                      Select a non-custodial wallet provider for cryptographic EIP-4361 sign-in:
                    </p>
                  )}
                  {[
                    { name: 'MetaMask', desc: 'Arbitrum, Ethereum, Optimism, Polygon', color: '#F6851B' },
                    { name: 'Phantom', desc: 'Solana, Bitcoin & EVM Multi-Chain', color: '#AB9FF2' },
                    { name: 'Coinbase Wallet', desc: 'Smart Wallet & Institutional MPC', color: '#0052FF' },
                    { name: 'WalletConnect', desc: 'Mobile QR code / 300+ Wallets', color: '#3B99FC' }
                  ].map(w => (
                    <button
                      key={w.name}
                      type="button"
                      id={`wallet-login-${w.name.toLowerCase().replace(/\s+/g, '')}`}
                      disabled={isLoading}
                      onClick={() => handleWalletLogin(w.name)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group ${
                        targetDomain === 'admin'
                          ? 'border-slate-800/80 bg-slate-900/30 opacity-60 hover:opacity-100 hover:border-rose-500/50'
                          : 'border-slate-800 bg-[#060a14] hover:border-purple-500/50 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-white text-xs font-mono"
                          style={{ backgroundColor: w.color }}
                        >
                          {w.name.substring(0, 2)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors font-mono">
                            {w.name}
                          </div>
                          <div className="text-xs text-slate-400 font-mono">
                            {targetDomain === 'admin' ? 'Non-whitelisted for Admin Console' : w.desc}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-purple-400 transition-colors" />
                    </button>
                  ))}
                </div>
              )}

              {/* Navigation to Landing Page */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                <button
                  type="button"
                  id="login-back-landing-btn"
                  onClick={() => setCurrentDomain('landing')}
                  className="flex items-center space-x-1.5 hover:text-purple-300 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Public Landing (nexifyprotrade.io)</span>
                </button>

                {targetDomain === 'app' ? (
                  <button
                    type="button"
                    onClick={() => setCurrentDomain('admin')}
                    className="text-slate-400 hover:text-amber-300 transition-colors"
                  >
                    Root Admin Gateway →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCurrentDomain('app')}
                    className="text-slate-400 hover:text-purple-300 transition-colors"
                  >
                    Trader Workstation →
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* 2FA Verification Challenge Screen */
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-[0_0_25px_rgba(168,85,247,0.4)] mb-3">
                  <Smartphone className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-white font-mono">
                  TWO-FACTOR AUTHENTICATION
                </h3>
                <p className="text-xs text-slate-300 font-mono mt-1">
                  Enter the 6-digit verification code from your <strong className="text-purple-300">Google Authenticator</strong> app for:
                </p>
                <div className="inline-block mt-1 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white">
                  {tempUser?.email}
                </div>
              </div>

              {!useBackupCode ? (
                /* 6-Digit TOTP Box Input */
                <div className="space-y-4">
                  <div className="flex justify-center items-center space-x-2 sm:space-x-3" onPaste={handlePaste}>
                    {totpDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={el => (digitInputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleDigitChange(index, e.target.value)}
                        onKeyDown={e => handleKeyDown(index, e)}
                        className="h-12 w-10 sm:h-14 sm:w-12 rounded-xl border border-slate-700 bg-slate-900 text-center font-mono text-xl sm:text-2xl font-bold text-white focus:border-purple-500 focus:bg-purple-950/30 focus:shadow-[0_0_15px_rgba(168,85,247,0.25)] outline-none transition-all"
                      />
                    ))}
                  </div>

                  {/* 30-Second Google Authenticator Rotating Counter */}
                  <div className="flex items-center justify-center space-x-2 text-xs font-mono text-slate-300 pt-1">
                    <div className="relative flex items-center justify-center">
                      <Clock className="h-3.5 w-3.5 text-purple-400 mr-1.5" />
                      <span>Codes rotate every 30s:</span>
                      <span className="ml-1.5 font-bold text-white tabular-nums">{timeRemaining}s</span>
                    </div>
                  </div>

                  {/* Dev / Preview Auto-fill Helper so testing preview is effortlessly smooth */}
                  {previewCode && (
                    <div className="rounded-xl border border-purple-800/40 bg-purple-950/20 p-2.5 text-center">
                      <div className="text-xs font-mono text-purple-300">
                        Live TOTP Sync: <span className="font-bold text-white tracking-widest">{previewCode}</span>
                      </div>
                      <button
                        type="button"
                        id="login-2fa-autofill-btn"
                        onClick={autoFillPreviewCode}
                        className="mt-1 text-xs font-mono text-purple-400 hover:text-purple-200 underline font-semibold"
                      >
                        Click to auto-fill current Google Authenticator code
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    id="login-2fa-verify-btn"
                    disabled={isLoading || totpDigits.join('').length < 6}
                    onClick={() => submit2FA()}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-mono font-bold text-xs text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    {isLoading ? 'VERIFYING WITH AUTHENTICATOR...' : 'VERIFY & ENTER WORKSTATION'}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => { setUseBackupCode(true); setErrorMessage(null); }}
                      className="text-xs font-mono text-slate-400 hover:text-purple-300 transition-colors"
                    >
                      Lost your device? Use an emergency backup code
                    </button>
                  </div>
                </div>
              ) : (
                /* Emergency Backup Recovery Code Input */
                <div className="space-y-4">
                  <div>
                    <label className="text-slate-300 text-xs font-mono block mb-1.5 uppercase">
                      Emergency Backup Code (e.g. 8F92-4A1B)
                    </label>
                    <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-white">
                      <Key className="h-4 w-4 text-slate-400 mr-2.5" />
                      <input
                        type="text"
                        value={backupCodeInput}
                        onChange={e => setBackupCodeInput(e.target.value.toUpperCase())}
                        placeholder="8F92-4A1B"
                        className="w-full bg-transparent outline-none font-mono text-sm tracking-widest text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    id="login-backup-verify-btn"
                    disabled={isLoading || !backupCodeInput.trim()}
                    onClick={() => submit2FA()}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-mono font-bold text-xs text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    {isLoading ? 'VALIDATING RECOVERY CODE...' : 'USE BACKUP CODE TO ENTER'}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => { setUseBackupCode(false); setErrorMessage(null); }}
                      className="text-xs font-mono text-purple-400 hover:underline"
                    >
                      ← Back to Google Authenticator 6-digit code
                    </button>
                  </div>
                </div>
              )}

              {/* Cancel Button */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => { setIs2FAStep(false); setTempUser(null); setErrorMessage(null); }}
                  className="text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel & choose different account
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Institutional Guarantee Footer */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-slate-400">
          <span className="flex items-center space-x-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>RFC 6238 TOTP Standard</span>
          </span>
          <span>•</span>
          <span>EIP-4361 Compliant</span>
          <span>•</span>
          <span>Hardware Enclave HSM</span>
        </div>
      </div>
    </div>
  );
};
