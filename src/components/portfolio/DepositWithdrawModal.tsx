import React, { useState } from 'react';
import { 
  X, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  QrCode, 
  ShieldCheck,
  ExternalLink 
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

export const DepositWithdrawModal: React.FC = () => {
  const { 
    isDepositModalOpen, 
    setIsDepositModalOpen, 
    isWithdrawModalOpen, 
    setIsWithdrawModalOpen,
    modalTargetAsset,
    setModalTargetAsset,
    cryptoAssets,
    wallet,
    depositFunds,
    withdrawFunds
  } = useTrading();

  const isOpen = isDepositModalOpen || isWithdrawModalOpen;
  const isDeposit = isDepositModalOpen;

  const [selectedAssetSym, setSelectedAssetSym] = useState<string>(modalTargetAsset || 'USDT');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('Arbitrum One');
  const [depositSimAmount, setDepositSimAmount] = useState<string>('5000');
  const [withdrawAddress, setWithdrawAddress] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [notification, setNotification] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const depositAddress = selectedNetwork === 'Solana'
    ? '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'
    : '0x8f3c7a6e19b409cd8b7a9c1e0984ba1029c78fe2';

  const copyDepositAddress = () => {
    navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(depositSimAmount);
    if (isNaN(amt) || amt <= 0) {
      setNotification({ success: false, message: 'Please enter a valid amount.' });
      return;
    }

    depositFunds(selectedAssetSym, amt, selectedNetwork);
    setNotification({ success: true, message: `Deposited ${amt} ${selectedAssetSym} via ${selectedNetwork} successfully!` });
    setTimeout(() => {
      setNotification(null);
      setIsDepositModalOpen(false);
    }, 1500);
  };

  const handleExecuteWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      setNotification({ success: false, message: 'Please enter a valid amount.' });
      return;
    }
    if (!withdrawAddress || withdrawAddress.length < 8) {
      setNotification({ success: false, message: 'Please provide a valid destination address.' });
      return;
    }

    const res = withdrawFunds(selectedAssetSym, amt, withdrawAddress, selectedNetwork);
    setNotification(res);
    if (res.success) {
      setTimeout(() => {
        setNotification(null);
        setIsWithdrawModalOpen(false);
      }, 1500);
    }
  };

  const handleClose = () => {
    setIsDepositModalOpen(false);
    setIsWithdrawModalOpen(false);
    setNotification(null);
  };

  const availableInWallet = selectedAssetSym === 'USDT' 
    ? wallet.usdtBalance 
    : (wallet.assets[selectedAssetSym] || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a0f20] p-6 shadow-2xl relative">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-2">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
            isDeposit ? 'bg-purple-950 text-purple-400 border border-purple-800' : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
          }`}>
            {isDeposit ? <ArrowDownToLine className="h-4.5 w-4.5" /> : <ArrowUpFromLine className="h-4.5 w-4.5" />}
          </div>
          <h3 className="text-lg font-bold text-white font-mono">
            {isDeposit ? 'DEPOSIT DIGITAL ASSETS' : 'WITHDRAW DIGITAL ASSETS'}
          </h3>
        </div>
        <p className="text-xs text-slate-300 mb-5 leading-relaxed">
          {isDeposit 
            ? 'Transfer crypto from your external wallet directly into Nexify ProTrade institutional custody.'
            : 'Transfer assets from Nexify ProTrade to your external decentralized wallet.'
          }
        </p>

        {/* Asset Selector */}
        <div className="space-y-4 font-mono text-xs">
          <div>
            <label className="text-slate-300 text-xs font-medium uppercase block mb-1.5">Select Asset</label>
            <div className="grid grid-cols-4 gap-2">
              {['USDT', 'BTC', 'ETH', 'SOL'].map(sym => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => setSelectedAssetSym(sym)}
                  className={`py-2.5 rounded-xl border text-center font-bold text-xs transition-colors ${
                    selectedAssetSym === sym
                      ? 'bg-purple-950 border-purple-500 text-purple-200'
                      : 'border-white/10 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          {/* Network Selector */}
          <div>
            <label className="text-slate-300 text-xs font-medium uppercase block mb-1.5">Transfer Network</label>
            <div className="grid grid-cols-3 gap-2">
              {['Arbitrum One', 'Ethereum (ERC20)', 'Solana'].map(net => (
                <button
                  key={net}
                  type="button"
                  onClick={() => setSelectedNetwork(net)}
                  className={`py-2 px-2.5 rounded-xl border text-center text-xs font-medium transition-colors ${
                    selectedNetwork === net
                      ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 font-bold'
                      : 'border-white/10 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {net}
                </button>
              ))}
            </div>
          </div>

          {isDeposit ? (
            /* DEPOSIT CONTENT */
            <div className="space-y-4 pt-2">
              {/* Deposit Address Box with QR Simulation */}
              <div className="rounded-xl border border-white/10 bg-[#060a14] p-4 flex flex-col sm:flex-row items-center gap-4">
                {/* SVG QR code simulation */}
                <div className="h-24 w-24 bg-white p-2 rounded-lg flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <rect x="0" y="0" width="30" height="30" fill="#000" />
                    <rect x="5" y="5" width="20" height="20" fill="#fff" />
                    <rect x="10" y="10" width="10" height="10" fill="#000" />
                    <rect x="70" y="0" width="30" height="30" fill="#000" />
                    <rect x="75" y="5" width="20" height="20" fill="#fff" />
                    <rect x="80" y="10" width="10" height="10" fill="#000" />
                    <rect x="0" y="70" width="30" height="30" fill="#000" />
                    <rect x="5" y="75" width="20" height="20" fill="#fff" />
                    <rect x="10" y="80" width="10" height="10" fill="#000" />
                    <rect x="40" y="20" width="20" height="10" fill="#000" />
                    <rect x="50" y="40" width="10" height="20" fill="#000" />
                    <rect x="70" y="70" width="20" height="20" fill="#000" />
                  </svg>
                </div>

                <div className="flex-1 space-y-1.5 w-full">
                  <span className="text-slate-300 text-xs uppercase font-medium">Your Prism Deposit Address</span>
                  <div className="flex items-center justify-between rounded-lg bg-slate-900 border border-white/5 p-2.5 text-xs text-white break-all">
                    <span>{depositAddress}</span>
                    <button
                      type="button"
                      onClick={copyDepositAddress}
                      className="ml-2 text-slate-400 hover:text-purple-300"
                      title="Copy"
                    >
                      {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">Requires 12 network block confirmations.</p>
                </div>
              </div>

              {/* Instant Simulation Action */}
              <form onSubmit={handleSimulateDeposit} className="rounded-xl border border-purple-900/40 bg-purple-950/20 p-4 space-y-2.5">
                <div className="flex justify-between text-slate-300 text-xs font-medium">
                  <span>QUICK SIMULATED CREDIT</span>
                  <span className="text-purple-300">Instant Testnet Balance</span>
                </div>
                <div className="flex rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white">
                  <input
                    type="number"
                    step="any"
                    value={depositSimAmount}
                    onChange={e => setDepositSimAmount(e.target.value)}
                    className="w-full bg-transparent outline-none text-xs text-white placeholder-slate-500"
                    placeholder="5000"
                  />
                  <span className="text-slate-300 text-xs font-bold">{selectedAssetSym}</span>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-bold text-white text-xs shadow-md hover:brightness-110"
                >
                  SIMULATE DEPOSIT OF {depositSimAmount} {selectedAssetSym}
                </button>
              </form>
            </div>
          ) : (
            /* WITHDRAW CONTENT */
            <form onSubmit={handleExecuteWithdrawal} className="space-y-4 pt-2">
              <div className="flex justify-between text-slate-300 text-xs">
                <span>Available to Withdraw:</span>
                <span className="text-white font-bold">
                  {availableInWallet.toLocaleString(undefined, { maximumFractionDigits: 4 })} {selectedAssetSym}
                </span>
              </div>

              <div>
                <label className="text-slate-300 text-xs uppercase font-medium block mb-1.5">Destination Wallet Address</label>
                <input
                  type="text"
                  required
                  placeholder="0x... or solana address"
                  value={withdrawAddress}
                  onChange={e => setWithdrawAddress(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white text-xs outline-none focus:border-purple-500 placeholder-slate-500"
                />
              </div>

              <div>
                <label className="text-slate-300 text-xs uppercase font-medium block mb-1.5">Withdrawal Amount</label>
                <div className="flex rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white text-xs">
                  <input
                    type="number"
                    step="any"
                    required
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-transparent outline-none text-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(availableInWallet.toString())}
                    className="text-purple-400 hover:text-purple-300 font-bold ml-2 text-xs"
                  >
                    MAX
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#060a14] p-3 text-slate-300 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span>Network Gas Fee:</span>
                  <span className="text-slate-200">1.20 USDT</span>
                </div>
                <div className="flex justify-between text-white font-semibold">
                  <span>You Will Receive:</span>
                  <span>
                    {Math.max(0, (parseFloat(withdrawAmount) || 0) - (selectedAssetSym === 'USDT' ? 1.2 : 0))} {selectedAssetSym}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-bold text-white text-xs shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:brightness-110"
              >
                DISPATCH WITHDRAWAL
              </button>
            </form>
          )}

          {notification && (
            <div className={`p-3 rounded-xl flex items-center space-x-2 text-xs font-mono ${
              notification.success ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60' : 'bg-rose-950 text-rose-300 border border-rose-800/60'
            }`}>
              {notification.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <span>{notification.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
