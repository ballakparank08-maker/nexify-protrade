import React, { useState } from 'react';
import { 
  X, 
  Wallet, 
  ShieldCheck, 
  CheckCircle2, 
  KeyRound, 
  Mail, 
  Lock, 
  Layers, 
  ArrowRight 
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { NexifyLogo } from '../common/NexifyLogo';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, connectWallet } = useTrading();
  const [authTab, setAuthTab] = useState<'web3' | 'institutional'>('web3');
  const [emailInput, setEmailInput] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');

  if (!isAuthModalOpen) return null;

  const handleConnect = (walletName: string) => {
    connectWallet(walletName);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    connectWallet('Institutional Key');
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
            <Wallet className="h-4 w-4" />
          </div>
          <h3 className="text-lg font-bold text-white font-mono">AUTHENTICATE WORKSTATION</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Connect your non-custodial Web3 wallet or institutional API credentials.
        </p>

        {/* Tab switch: Web3 Wallet vs Email / Key */}
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-900 p-1 border border-slate-800 mb-5 font-mono text-xs">
          <button
            onClick={() => setAuthTab('web3')}
            className={`py-2 rounded-lg font-bold transition-all ${
              authTab === 'web3'
                ? 'bg-purple-950/80 text-purple-300 border border-purple-800/40 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Web3 Wallets
          </button>
          <button
            onClick={() => setAuthTab('institutional')}
            className={`py-2 rounded-lg font-bold transition-all ${
              authTab === 'institutional'
                ? 'bg-purple-950/80 text-purple-300 border border-purple-800/40 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Institutional Access
          </button>
        </div>

        {authTab === 'web3' ? (
          <div className="space-y-2.5">
            {[
              { name: 'MetaMask', desc: 'Popular Ethereum & EVM browser extension', color: '#F6851B' },
              { name: 'Phantom', desc: 'Solana, Bitcoin & Ethereum multi-chain', color: '#AB9FF2' },
              { name: 'WalletConnect', desc: 'Connect with mobile QR code / 300+ wallets', color: '#3B99FC' },
              { name: 'Coinbase Wallet', desc: 'Institutional MPC secure enclave', color: '#0052FF' }
            ].map(w => (
              <button
                key={w.name}
                onClick={() => handleConnect(w.name)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-[#060a14] hover:border-purple-500/50 hover:bg-slate-900 transition-all group text-left"
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-white text-xs font-mono"
                    style={{ backgroundColor: w.color }}
                  >
                    {w.name.substring(0, 2)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                      {w.name}
                    </div>
                    <div className="text-xs text-slate-400">{w.desc}</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-purple-400 transition-colors" />
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={handleEmailSubmit} className="space-y-3 font-mono text-xs">
            <div>
              <label className="text-slate-300 text-xs font-medium uppercase block mb-1">Trader Work Email</label>
              <div className="flex items-center rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white">
                <Mail className="h-4 w-4 text-slate-500 mr-2" />
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="trader@hedgefund.com"
                  className="w-full bg-transparent outline-none text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 text-xs font-medium uppercase block mb-1">Prism API Session Key</label>
              <div className="flex items-center rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white">
                <KeyRound className="h-4 w-4 text-slate-500 mr-2" />
                <input
                  type="password"
                  required
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                  placeholder="prsm_live_9832..."
                  className="w-full bg-transparent outline-none text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-bold text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:brightness-110 transition-all text-xs"
            >
              INITIALIZE SESSION
            </button>
          </form>
        )}

        <div className="mt-5 pt-3 border-t border-slate-800 text-xs text-slate-400 text-center font-mono flex items-center justify-center space-x-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span>Non-Custodial Cryptographic Handshake • EIP-4361 Standard</span>
        </div>
      </div>
    </div>
  );
};
