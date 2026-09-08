import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  QrCode, 
  Key, 
  Copy, 
  Check, 
  Download, 
  AlertTriangle, 
  Smartphone, 
  RefreshCw, 
  X, 
  Clock, 
  User, 
  CheckCircle2, 
  FileText, 
  LogOut,
  HelpCircle
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { 
  generateTOTPSecret, 
  generateTOTPKeyURI, 
  generateQRCodeDataURL, 
  generateBackupCodes, 
  verifyTOTP, 
  computeTOTP,
  getTOTPTimeRemaining 
} from '../../utils/totp';

export const UserSettingsModal: React.FC = () => {
  const { 
    currentUser, 
    isSettingsModalOpen, 
    setIsSettingsModalOpen,
    settingsActiveTab,
    setSettingsActiveTab,
    enable2FA,
    disable2FA,
    updateSecuritySettings,
    securityAuditLogs,
    addSecurityAuditLog,
    logout
  } = useTrading();

  // 2FA Setup Flow State
  const [setupStep, setSetupStep] = useState<'intro' | 'qr' | 'verify' | 'backup' | 'complete'>('intro');
  const [generatedSecret, setGeneratedSecret] = useState<string>('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [hasSavedBackupCodes, setHasSavedBackupCodes] = useState(false);
  const [verifyDigits, setVerifyDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);

  // Disable 2FA state
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);
  const [disableCodeInput, setDisableCodeInput] = useState('');
  const [disableError, setDisableError] = useState<string | null>(null);

  // Live Token Sync & Countdown
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [previewToken, setPreviewToken] = useState<string>('');

  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer loop for TOTP remaining seconds and preview token
  useEffect(() => {
    const update = async () => {
      const { secondsRemaining } = getTOTPTimeRemaining();
      setTimeRemaining(secondsRemaining);

      const secretToUse = generatedSecret || currentUser?.twoFactorSecret;
      if (secretToUse) {
        try {
          const code = await computeTOTP(secretToUse, 0);
          setPreviewToken(code);
        } catch {
          // ignore
        }
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [generatedSecret, currentUser?.twoFactorSecret]);

  if (!isSettingsModalOpen || !currentUser) return null;

  // Initialize new 2FA setup wizard
  const startSetupWizard = async () => {
    setVerifyError(null);
    setVerifyDigits(['', '', '', '', '', '']);
    setHasSavedBackupCodes(false);

    // 1. Generate new 16-character base32 secret
    const secret = generateTOTPSecret(16);
    setGeneratedSecret(secret);

    // 2. Generate URI for Google Authenticator
    const uri = generateTOTPKeyURI(currentUser.email, secret, 'Nexify Pro Trade');

    // 3. Generate QR code data URL
    try {
      const qrUrl = await generateQRCodeDataURL(uri);
      setQrCodeDataUrl(qrUrl);
    } catch (e) {
      console.error('Failed to generate QR code', e);
    }

    // 4. Generate 8 single-use backup recovery codes
    const codes = generateBackupCodes(8);
    setBackupCodes(codes);

    setSetupStep('qr');
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(generatedSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopiedBackupCodes(true);
    setTimeout(() => setCopiedBackupCodes(false), 2000);
  };

  const handleDownloadBackupCodes = () => {
    const text = `NEXIFY PRO TRADE - EMERGENCY 2FA BACKUP RECOVERY CODES\nAccount: ${currentUser.email}\nGenerated: ${new Date().toISOString()}\n\nEach code can only be used once:\n\n${backupCodes.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nKeep these codes in a secure, offline location.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexify-2fa-backup-codes-${currentUser.email.split('@')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setHasSavedBackupCodes(true);
  };

  // 6-digit TOTP input handlers
  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    if (!clean) {
      const newDigits = [...verifyDigits];
      newDigits[index] = '';
      setVerifyDigits(newDigits);
      return;
    }

    const newDigits = [...verifyDigits];
    newDigits[index] = clean.slice(-1);
    setVerifyDigits(newDigits);

    if (index < 5 && clean) {
      digitRefs.current[index + 1]?.focus();
    }

    const fullCode = newDigits.join('');
    if (fullCode.length === 6) {
      handleVerifyCode(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !verifyDigits[index] && index > 0) {
      digitRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!paste) return;

    const newDigits = [...verifyDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = paste[i] || '';
    }
    setVerifyDigits(newDigits);

    if (paste.length === 6) {
      handleVerifyCode(paste);
    } else {
      digitRefs.current[Math.min(5, paste.length)]?.focus();
    }
  };

  const handleVerifyCode = async (codeToCheck?: string) => {
    const code = codeToCheck || verifyDigits.join('');
    if (code.length < 6) {
      setVerifyError('Please enter all 6 digits.');
      return;
    }

    setVerifyError(null);
    setIsVerifying(true);
    try {
      const isValid = await verifyTOTP(generatedSecret, code);
      if (isValid) {
        setSetupStep('backup');
      } else {
        setVerifyError('Invalid authenticator code. Check your Google Authenticator app.');
        setVerifyDigits(['', '', '', '', '', '']);
        digitRefs.current[0]?.focus();
      }
    } catch {
      setVerifyError('Verification error.');
    } finally {
      setIsVerifying(false);
    }
  };

  const finalize2FASetup = () => {
    enable2FA(generatedSecret, backupCodes);
    setSetupStep('complete');
  };

  const handleDisable2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disableCodeInput.trim()) return;

    setDisableError(null);
    const res = await disable2FA(disableCodeInput);
    if (res.success) {
      setIsDisabling2FA(false);
      setDisableCodeInput('');
      setSetupStep('intro');
    } else {
      setDisableError(res.error || 'Failed to disable 2FA');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-[#090e1e] p-6 sm:p-8 shadow-2xl text-slate-200">
        
        {/* Close Button */}
        <button
          type="button"
          id="close-settings-modal-btn"
          onClick={() => setIsSettingsModalOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start space-x-4 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-purple-950/80 border border-purple-800/50 flex items-center justify-center text-purple-400 shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h3 className="text-xl font-bold text-white font-mono">Account Security & Settings</h3>
              <span className={`px-2 py-0.5 rounded text-xs font-mono uppercase font-bold ${
                currentUser.role === 'admin' 
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800/50' 
                  : 'bg-purple-950/80 text-purple-300 border border-purple-800/50'
              }`}>
                {currentUser.role}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {currentUser.email} • {currentUser.institution}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-900/90 p-1 border border-slate-800 text-xs font-mono mb-6">
          <button
            type="button"
            id="settings-tab-2fa"
            onClick={() => setSettingsActiveTab('2fa')}
            className={`py-2 px-3 rounded-lg font-bold transition-all text-center flex items-center justify-center space-x-1.5 ${
              settingsActiveTab === '2fa'
                ? 'bg-purple-950/90 text-purple-300 border border-purple-800/50 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Google 2FA</span>
          </button>
          <button
            type="button"
            id="settings-tab-security"
            onClick={() => setSettingsActiveTab('security')}
            className={`py-2 px-3 rounded-lg font-bold transition-all text-center flex items-center justify-center space-x-1.5 ${
              settingsActiveTab === 'security'
                ? 'bg-purple-950/90 text-purple-300 border border-purple-800/50 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Preferences</span>
          </button>
          <button
            type="button"
            id="settings-tab-sessions"
            onClick={() => setSettingsActiveTab('sessions')}
            className={`py-2 px-3 rounded-lg font-bold transition-all text-center flex items-center justify-center space-x-1.5 ${
              settingsActiveTab === 'sessions'
                ? 'bg-purple-950/90 text-purple-300 border border-purple-800/50 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Audit Trail</span>
          </button>
        </div>

        {/* TAB 1: 2FA MANAGEMENT & GOOGLE AUTHENTICATOR SETUP */}
        {settingsActiveTab === '2fa' && (
          <div className="space-y-6">
            {/* If 2FA is currently ENABLED */}
            {currentUser.twoFactorEnabled ? (
              <div className="space-y-6">
                {/* Active Status Card */}
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-950/80 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white font-mono">
                          Google Authenticator 2FA Active
                        </h4>
                        <p className="text-xs text-emerald-300 font-mono mt-0.5">
                          Enforced for login, withdrawals, and API key generation.
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-900/60 border border-emerald-700/50 text-xs font-mono text-emerald-300 font-semibold">
                      RFC 6238 Verified
                    </span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-emerald-900/40 grid grid-cols-2 gap-4 text-xs font-mono">
                    <div>
                      <span className="text-slate-400 block text-xs">Protected Account:</span>
                      <span className="text-white font-semibold">{currentUser.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-xs">Enforcement Level:</span>
                      <span className="text-emerald-300 font-semibold">Institutional Grade (Time-Based)</span>
                    </div>
                  </div>
                </div>

                {/* Live TOTP Synchronization Inspector */}
                <div className="rounded-xl border border-slate-800 bg-[#060a14] p-4 font-mono text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 text-slate-300">
                      <Clock className="h-4 w-4 text-purple-400" />
                      <span className="font-bold">Live Authenticator Clock Verification</span>
                    </div>
                    <div className="text-xs text-purple-400">
                      Window: <strong className="text-white">{timeRemaining}s</strong>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    Check if your smartphone's Google Authenticator app matches the server time window:
                  </p>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400">Expected 6-Digit Token:</span>
                    <span className="text-lg font-bold tracking-widest text-purple-300 font-mono">
                      {previewToken || '••••••'}
                    </span>
                  </div>
                </div>

                {/* Emergency Backup Codes Section */}
                <div className="rounded-xl border border-slate-800 bg-[#060a14] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Key className="h-4 w-4 text-purple-400" />
                      <span className="text-xs font-bold text-white font-mono">Emergency Backup Codes</span>
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      {currentUser.backupCodes?.length || 0} remaining
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mb-3">
                    Backup codes grant one-time emergency access if your mobile phone is damaged or unavailable.
                  </p>
                  {currentUser.backupCodes && currentUser.backupCodes.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {currentUser.backupCodes.map((c, i) => (
                        <div key={i} className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-800 text-center font-mono text-xs text-purple-300 tracking-wider font-semibold">
                          {c}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-amber-400 font-mono">
                      No active backup codes found. Consider disabling and re-enabling 2FA to generate new codes.
                    </div>
                  )}
                </div>

                {/* Deactivate 2FA Section */}
                <div className="pt-4 border-t border-slate-800/80">
                  {!isDisabling2FA ? (
                    <button
                      type="button"
                      id="start-disable-2fa-btn"
                      onClick={() => setIsDisabling2FA(true)}
                      className="text-xs font-mono text-rose-400 hover:text-rose-300 hover:underline flex items-center space-x-1.5"
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      <span>Disable Google Authenticator 2FA</span>
                    </button>
                  ) : (
                    <form onSubmit={handleDisable2FASubmit} className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-300 font-mono">
                          Confirm 2FA Deactivation
                        </span>
                        <button
                          type="button"
                          onClick={() => { setIsDisabling2FA(false); setDisableError(null); }}
                          className="text-xs font-mono text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 font-mono">
                        Enter your current 6-digit Google Authenticator code or an emergency recovery code:
                      </p>
                      {disableError && (
                        <div className="text-xs text-rose-400 font-mono">{disableError}</div>
                      )}
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={disableCodeInput}
                          onChange={e => setDisableCodeInput(e.target.value)}
                          placeholder="e.g. 123456 or 8F92-4A1B"
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-rose-500"
                        />
                        <button
                          type="submit"
                          id="confirm-disable-2fa-btn"
                          className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold transition-colors"
                        >
                          Confirm
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            ) : (
              /* When 2FA is NOT yet enabled: Setup Wizard Flow */
              <div>
                {setupStep === 'intro' && (
                  <div className="space-y-5">
                    {/* Unprotected Warning Banner */}
                    <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-white font-mono">
                            Two-Factor Authentication is currently OFF
                          </h4>
                          <p className="text-xs text-slate-400 font-mono mt-1 leading-relaxed">
                            Protect your funds and API execution keys. Google Authenticator requires an RFC 6238 TOTP code every time you log in or authorize a withdrawal.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                      <div className="rounded-xl border border-slate-800 bg-[#060a14] p-3.5">
                        <div className="h-8 w-8 rounded-lg bg-purple-950/80 border border-purple-800/50 flex items-center justify-center text-purple-400 mb-2">
                          <Smartphone className="h-4 w-4" />
                        </div>
                        <h5 className="font-bold text-white mb-1">1. Mobile App</h5>
                        <p className="text-xs text-slate-400">
                          Works with Google Authenticator, Authy, or 1Password.
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-[#060a14] p-3.5">
                        <div className="h-8 w-8 rounded-lg bg-purple-950/80 border border-purple-800/50 flex items-center justify-center text-purple-400 mb-2">
                          <QrCode className="h-4 w-4" />
                        </div>
                        <h5 className="font-bold text-white mb-1">2. Scan QR</h5>
                        <p className="text-xs text-slate-400">
                          Instant camera pairing via encrypted SHA-1 seed.
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-[#060a14] p-3.5">
                        <div className="h-8 w-8 rounded-lg bg-purple-950/80 border border-purple-800/50 flex items-center justify-center text-purple-400 mb-2">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <h5 className="font-bold text-white mb-1">3. Institutional</h5>
                        <p className="text-xs text-slate-400">
                          Protects against session hijacking and credential theft.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      id="begin-2fa-setup-btn"
                      onClick={startSetupWizard}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-mono font-bold text-xs text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:brightness-110 active:scale-[0.99] transition-all"
                    >
                      BEGIN GOOGLE AUTHENTICATOR SETUP →
                    </button>
                  </div>
                )}

                {/* STEP 1 & 2: QR CODE SCANNING */}
                {setupStep === 'qr' && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-purple-400 font-mono text-xs uppercase tracking-wider font-bold">
                          Step 1 of 3
                        </span>
                        <h4 className="text-base font-bold text-white font-mono">
                          Scan QR Code with Google Authenticator
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-xs font-mono text-slate-300">
                        RFC 6238 TOTP
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl border border-slate-800 bg-[#060a14]">
                      {/* High-Contrast White Background for crisp QR scanning */}
                      <div className="p-3 bg-white rounded-xl shadow-lg shrink-0">
                        {qrCodeDataUrl ? (
                          <img 
                            src={qrCodeDataUrl} 
                            alt="Google Authenticator QR Code" 
                            className="h-40 w-40 block"
                          />
                        ) : (
                          <div className="h-40 w-40 flex items-center justify-center text-slate-500 font-mono text-xs">
                            Generating QR...
                          </div>
                        )}
                      </div>

                      {/* Manual Entry Details */}
                      <div className="flex-1 space-y-3 font-mono text-xs">
                        <p className="text-slate-300 leading-relaxed">
                          Open <strong className="text-purple-300">Google Authenticator</strong> on your phone, tap the <strong className="text-white">+</strong> button, and choose <strong className="text-white">Scan a QR code</strong>.
                        </p>

                        <div>
                          <span className="text-xs text-slate-400 block mb-1">
                            Cannot scan? Use manual secret key:
                          </span>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              readOnly
                              value={generatedSecret}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-purple-300 font-mono tracking-widest outline-none"
                            />
                            <button
                              type="button"
                              id="copy-secret-key-btn"
                              onClick={handleCopySecret}
                              className="px-3 py-1.5 rounded-lg bg-purple-950 border border-purple-800 text-purple-300 hover:text-white transition-colors flex items-center space-x-1 shrink-0"
                            >
                              {copiedSecret ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                              <span className="text-xs">{copiedSecret ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                        </div>

                        <div className="text-xs text-slate-400 space-y-0.5">
                          <div>• Account: <span className="text-slate-300">{currentUser.email}</span></div>
                          <div>• Key type: <span className="text-slate-300">Time-based (30s interval)</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Step Navigation */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setSetupStep('intro')}
                        className="text-xs font-mono text-slate-400 hover:text-slate-200"
                      >
                        ← Back
                      </button>
                      <button
                        type="button"
                        id="proceed-to-verify-btn"
                        onClick={() => {
                          setSetupStep('verify');
                          setTimeout(() => digitRefs.current[0]?.focus(), 100);
                        }}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-mono font-bold text-xs text-white shadow hover:brightness-110"
                      >
                        NEXT: VERIFY CODE →
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: CODE VERIFICATION */}
                {setupStep === 'verify' && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-purple-400 font-mono text-xs uppercase tracking-wider font-bold">
                          Step 2 of 3
                        </span>
                        <h4 className="text-base font-bold text-white font-mono">
                          Confirm Google Authenticator Code
                        </h4>
                      </div>
                      <div className="flex items-center space-x-1.5 text-purple-400 font-mono text-xs">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{timeRemaining}s remaining</span>
                      </div>
                    </div>

                    <p className="text-xs font-mono text-slate-400">
                      Enter the 6-digit code currently generated in your Google Authenticator app:
                    </p>

                    {verifyError && (
                      <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300 flex items-center space-x-2 font-mono">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                        <span>{verifyError}</span>
                      </div>
                    )}

                    {/* 6-Digit Box Input */}
                    <div className="flex justify-center items-center space-x-2 sm:space-x-3 py-2" onPaste={handlePaste}>
                      {verifyDigits.map((digit, index) => (
                        <input
                          key={index}
                          ref={el => (digitRefs.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={e => handleDigitChange(index, e.target.value)}
                          onKeyDown={e => handleKeyDown(index, e)}
                          className="h-12 w-10 sm:h-14 sm:w-12 rounded-xl border border-slate-700 bg-slate-900 text-center font-mono text-xl sm:text-2xl font-bold text-white focus:border-purple-500 focus:bg-purple-950/30 outline-none transition-all"
                        />
                      ))}
                    </div>

                    {/* Live Preview Sync Helper */}
                    {previewToken && (
                      <div className="rounded-xl border border-purple-800/40 bg-purple-950/20 p-2.5 text-center">
                        <div className="text-xs font-mono text-purple-300">
                          Dev / Testing Helper: Generated Code is <strong className="text-white tracking-widest">{previewToken}</strong>
                        </div>
                        <button
                          type="button"
                          id="autofill-verify-token-btn"
                          onClick={() => {
                            const chars = previewToken.split('');
                            setVerifyDigits(chars);
                            handleVerifyCode(previewToken);
                          }}
                          className="mt-1 text-xs font-mono text-purple-400 hover:text-purple-200 underline font-semibold"
                        >
                          Auto-fill verification code
                        </button>
                      </div>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setSetupStep('qr')}
                        className="text-xs font-mono text-slate-400 hover:text-slate-200"
                      >
                        ← Back to QR
                      </button>
                      <button
                        type="button"
                        id="verify-2fa-token-btn"
                        disabled={isVerifying || verifyDigits.join('').length < 6}
                        onClick={() => handleVerifyCode()}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-mono font-bold text-xs text-white shadow hover:brightness-110 disabled:opacity-50"
                      >
                        {isVerifying ? 'VERIFYING...' : 'CONFIRM CODE →'}
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4: EMERGENCY BACKUP CODES */}
                {setupStep === 'backup' && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-purple-400 font-mono text-xs uppercase tracking-wider font-bold">
                          Step 3 of 3
                        </span>
                        <h4 className="text-base font-bold text-white font-mono">
                          Save Emergency Backup Codes
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800/50 text-xs font-mono text-amber-300 font-semibold">
                        Critical Step
                      </span>
                    </div>

                    <p className="text-xs font-mono text-slate-400 leading-relaxed">
                      If you lose access to your phone or Google Authenticator app, each of these 8 single-use codes can be used once to regain access to your account.
                    </p>

                    {/* Codes Grid */}
                    <div className="p-4 rounded-xl border border-slate-800 bg-[#060a14]">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
                        {backupCodes.map((code, index) => (
                          <div
                            key={index}
                            className="px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-center font-mono text-xs text-purple-300 tracking-wider font-bold select-all"
                          >
                            {code}
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800/80">
                        <button
                          type="button"
                          id="copy-all-backup-codes-btn"
                          onClick={handleCopyBackupCodes}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center space-x-1.5 transition-colors"
                        >
                          {copiedBackupCodes ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                          <span>{copiedBackupCodes ? 'Copied' : 'Copy All'}</span>
                        </button>
                        <button
                          type="button"
                          id="download-backup-codes-btn"
                          onClick={handleDownloadBackupCodes}
                          className="px-3 py-1.5 rounded-lg bg-purple-950 hover:bg-purple-900 border border-purple-800 text-purple-300 text-xs font-mono flex items-center space-x-1.5 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Download .txt</span>
                        </button>
                      </div>
                    </div>

                    {/* Confirmation Checkbox */}
                    <label className="flex items-start space-x-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        id="backup-codes-confirm-chk"
                        checked={hasSavedBackupCodes}
                        onChange={e => setHasSavedBackupCodes(e.target.checked)}
                        className="mt-0.5 rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-xs font-mono text-slate-300">
                        I have downloaded or written down these backup recovery codes in a secure location.
                      </span>
                    </label>

                    <button
                      type="button"
                      id="finalize-2fa-setup-btn"
                      disabled={!hasSavedBackupCodes}
                      onClick={finalize2FASetup}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 font-mono font-bold text-xs text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:brightness-110 disabled:opacity-50 transition-all"
                    >
                      ACTIVATE 2FA PROTECTION NOW
                    </button>
                  </div>
                )}

                {/* COMPLETE SUCCESS SCREEN */}
                {setupStep === 'complete' && (
                  <div className="text-center py-6 space-y-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-950/80 border border-emerald-800/50 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <h4 className="text-lg font-bold text-white font-mono">
                      Google Authenticator 2FA Activated!
                    </h4>
                    <p className="text-xs text-slate-400 font-mono max-w-md mx-auto">
                      Your institutional account is now hardened with Google Authenticator time-based verification.
                    </p>
                    <button
                      type="button"
                      id="finish-2fa-setup-btn"
                      onClick={() => setIsSettingsModalOpen(false)}
                      className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-mono font-bold text-xs text-white shadow transition-all"
                    >
                      Return to Terminal
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SECURITY PREFERENCES */}
        {settingsActiveTab === 'security' && (
          <div className="space-y-5 font-mono text-xs">
            {/* Session Timeout */}
            <div className="rounded-xl border border-slate-800 bg-[#060a14] p-4">
              <label className="block text-white font-bold mb-1">
                Session Inactivity Auto-Lock
              </label>
              <p className="text-xs text-slate-400 mb-2">
                Automatically terminates session after period of no order placement or terminal activity.
              </p>
              <select
                id="session-timeout-select"
                value={currentUser.sessionTimeoutMinutes || 30}
                onChange={e => updateSecuritySettings({ sessionTimeoutMinutes: parseInt(e.target.value) })}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500"
              >
                <option value={15}>15 minutes (Strict Institutional)</option>
                <option value={30}>30 minutes (Standard)</option>
                <option value={60}>60 minutes</option>
                <option value={240}>4 hours</option>
              </select>
            </div>

            {/* Anti-Phishing Security Phrase */}
            <div className="rounded-xl border border-slate-800 bg-[#060a14] p-4">
              <label className="block text-white font-bold mb-1">
                Anti-Phishing Security Passphrase
              </label>
              <p className="text-xs text-slate-400 mb-2">
                This custom phrase appears on all official Nexify Pro Trade system alerts and confirmation modals.
              </p>
              <div className="flex space-x-2">
                <input
                  type="text"
                  id="anti-phishing-input"
                  defaultValue={currentUser.antiPhishingCode || 'NEXIFY-SECURE-99'}
                  onBlur={e => updateSecuritySettings({ antiPhishingCode: e.target.value })}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono uppercase outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  className="px-3 py-2 rounded-lg bg-purple-950 border border-purple-800 text-purple-300 hover:text-white"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Whitelist Withdrawals */}
            <div className="rounded-xl border border-slate-800 bg-[#060a14] p-4 flex items-center justify-between">
              <div>
                <span className="text-white font-bold block">Whitelist Address Lock</span>
                <span className="text-xs text-slate-400">
                  Only allow withdrawals to pre-approved corporate treasury and cold storage addresses.
                </span>
              </div>
              <input
                type="checkbox"
                id="whitelist-toggle"
                checked={currentUser.whitelistWithdrawals !== false}
                onChange={e => updateSecuritySettings({ whitelistWithdrawals: e.target.checked })}
                className="rounded border-slate-700 bg-slate-900 text-purple-600 h-4 w-4"
              />
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT TRAIL */}
        {settingsActiveTab === 'sessions' && (
          <div className="space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Recent Security Operations:</span>
              <span className="text-xs text-purple-400">EIP-4361 Immutable Logs</span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {securityAuditLogs.map(log => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-800/80 bg-[#060a14] text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-bold">{log.action}</span>
                      <span className={`px-1.5 py-0.5 rounded text-xs uppercase font-bold ${
                        log.status === 'success' 
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50' 
                          : log.status === 'warning'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800/50'
                          : 'bg-rose-950 text-rose-300 border border-rose-800/50'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      {log.ip} • {log.location} • {log.device}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0 ml-3">
                    {log.timestamp}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                id="logout-session-btn"
                onClick={() => {
                  logout();
                  setIsSettingsModalOpen(false);
                }}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center space-x-1.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out of Current Session</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
