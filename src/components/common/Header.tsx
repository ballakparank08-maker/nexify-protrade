import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ChevronDown, 
  ExternalLink, 
  Radio, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Layers, 
  Globe, 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  LogOut,
  TrendingUp,
  Percent,
  BarChart3,
  Landmark,
  Bell,
  RefreshCw,
  Lock,
  Clock,
  Activity
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { AppDomain, AppTab } from '../../types';
import { NexifyLogo } from './NexifyLogo';
import { MarketTicker } from './MarketTicker';

const logoIconUrl = `${import.meta.env.BASE_URL}logo-icon.png`;
const fallbackLogoUrl = `${import.meta.env.BASE_URL}logo.png`;

export const Header: React.FC = () => {
  const { 
    currentDomain, 
    setCurrentDomain, 
    currentTab, 
    setCurrentTab,
    cryptoAssets,
    wallet,
    disconnectWallet,
    setIsAuthModalOpen,
    setIsDepositModalOpen,
    setIsWithdrawModalOpen,
    circuitBreakerActive,
    engineLatencyMs,
    currency,
    setCurrency,
    openPriceAlertModal,
    activeAlertsCount,
    triggeredAlertsCount,
    isLiveFeedActive,
    toggleLiveFeed,
    liveFeedStatus,
    liveFeedSource,
    refreshMarketData,
    webSocketProvider,
    currentUser,
    isAuthenticated,
    setIsSettingsModalOpen,
    logout
  } = useTrading();

  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#070b16]/95 backdrop-blur-md">
      {/* Multi-Domain Architecture Switcher Bar */}
      <div className="hidden">
        <div className="flex items-center space-x-2">
          <span className="text-slate-300 text-xs font-mono uppercase tracking-wider flex items-center font-medium">
            <Globe className="mr-1.5 h-3.5 w-3.5 text-purple-400" />
            Domain Nodes:
          </span>
          <div className="flex items-center space-x-1.5">
            <button
              id="domain-landing-btn"
              onClick={() => setCurrentDomain('landing')}
              className={`rounded-lg px-2.5 py-1 font-mono text-xs transition-all ${
                currentDomain === 'landing'
                  ? 'bg-purple-600/30 text-purple-300 font-semibold border border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              https://nexifyprotrade.io
            </button>
            <button
              id="domain-app-btn"
              onClick={() => setCurrentDomain('app')}
              className={`rounded-lg px-2.5 py-1 font-mono text-xs transition-all ${
                currentDomain === 'app'
                  ? 'bg-cyan-600/30 text-cyan-300 font-semibold border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              https://app.nexifyprotrade.io
            </button>
            {currentUser?.role === 'admin' && (
              <button
                id="domain-admin-btn"
                onClick={() => setCurrentDomain('admin')}
                className={`rounded-lg px-2.5 py-1 font-mono text-xs transition-all flex items-center space-x-1.5 ${
                  currentDomain === 'admin'
                    ? 'bg-amber-600/30 text-amber-300 font-semibold border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
                title="Authorized Institutional Admin Portal"
              >
                <Lock className="h-3 w-3 text-emerald-400" />
                <span>https://admin.nexifyprotrade.io</span>
                <span className="rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 px-1.5 py-0.5 text-xs font-bold font-mono">
                  ROOT
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Live Crypto Market Feed Control & Indicator */}
          <div className="flex items-center space-x-2">
            <button
              id="header-live-feed-toggle"
              onClick={toggleLiveFeed}
              title={isLiveFeedActive ? `${liveFeedSource} active. Click to pause.` : "Live stream paused. Click to resume live market stream."}
              className={`flex items-center space-x-2 rounded-lg px-2.5 py-1 font-mono text-xs transition-all border ${
                !isLiveFeedActive
                  ? 'border-white/10 bg-slate-900/80 text-slate-300 hover:text-white'
                  : liveFeedStatus === 'connected'
                  ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                  : 'border-amber-500/30 bg-amber-950/40 text-amber-300'
              }`}
            >
              {isLiveFeedActive ? (
                liveFeedStatus === 'connected' ? (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                ) : (
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
                )
              ) : (
                <span className="h-2 w-2 rounded-full bg-slate-500"></span>
              )}
              <span className="hidden sm:inline font-semibold">
                {isLiveFeedActive
                  ? (liveFeedStatus === 'connected' ? (webSocketProvider === 'auto' ? 'Live Stream' : `${webSocketProvider.toUpperCase()} Live`) : 'Connecting Feed...')
                  : 'Feed Paused'}
              </span>
              <span className="text-xs text-slate-300">({engineLatencyMs}ms)</span>
            </button>

            {isLiveFeedActive && (
              <button
                id="header-refresh-feed-btn"
                onClick={() => refreshMarketData()}
                title="Instant Market Refresh (Sync Snapshots)"
                className="text-slate-300 hover:text-cyan-300 p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {circuitBreakerActive ? (
            <span className="flex items-center text-xs text-amber-400 font-mono font-medium animate-pulse border-l border-white/10 pl-3">
              <AlertTriangle className="mr-1 h-3.5 w-3.5" />
              ENGINE HALTED
            </span>
          ) : null}

          <div className="hidden md:flex items-center space-x-2 text-slate-300 text-xs font-mono border-l border-white/10 pl-3">
            <ShieldCheck className="h-4 w-4 text-purple-400" />
            <span>Proof of Reserves: 102.4%</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar Wrapper with flexbox space-between */}
      <nav className="relative z-30 flex items-center justify-between px-4 sm:px-6 py-2.5 bg-[#0b0e14]/90 backdrop-blur-md border-b border-white/10 text-white w-full">
        {/* Sisi Kiri: Logo and Brand Name */}
        <div className="flex items-center shrink-0">
          <div 
            onClick={() => setCurrentDomain('app')}
            className="flex items-center space-x-2.5 cursor-pointer transition hover:opacity-95 group select-none"
          >
            <img 
              src={logoIconUrl}
              alt="Nexify ProTrade Logo" 
              className="w-8 h-8 object-contain transition-transform group-hover:scale-105 filter drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]" 
              onError={(e) => {
                e.currentTarget.src = fallbackLogoUrl;
              }}
            />
            <div className="flex items-center space-x-1.5 font-black tracking-wider text-base sm:text-lg uppercase">
              <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">NEXIFY</span>
              <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent filter drop-shadow-[0_0_10px_rgba(168,85,247,0.4)]">PROTRADE</span>
            </div>
          </div>
        </div>

        {/* Bagian Tengah: Main Navigation Bar (Portfolio, Trade & Markets) */}
        <div className="hidden md:flex items-center justify-center flex-1 mx-4">
          <div className="flex items-center p-1 bg-[#0e1424]/85 border border-white/10 rounded-full shadow-lg shadow-black/40 backdrop-blur-xl">
            {/* Portfolio Button */}
            <button
              id="nav-portfolio-link"
              onClick={() => {
                setCurrentDomain('app');
                setCurrentTab('portfolio');
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200 flex items-center space-x-1.5 ${
                currentTab === 'portfolio' && currentDomain === 'app'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/30 font-semibold shadow-sm shadow-cyan-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5 opacity-80" />
              <span>Portfolio</span>
            </button>

            {/* Trade Button with Submenu */}
            <div className="relative group">
              <button
                id="nav-trade-link"
                onClick={() => {
                  setCurrentDomain('app');
                  setCurrentTab('futures');
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200 flex items-center space-x-1.5 ${
                  ['spot', 'futures', 'staking', 'mining', 'loan'].includes(currentTab) && currentDomain === 'app'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/30 font-semibold shadow-sm shadow-cyan-500/10'
                    : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5 opacity-80" />
                <span>Trade</span>
                <ChevronDown className="h-3 w-3 opacity-60 group-hover:rotate-180 transition-transform" />
              </button>

              {/* Submenu Dropdown */}
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:block group-focus-within:block w-72 sm:w-80 rounded-xl border border-white/10 bg-[#0b0e14]/95 p-1.5 shadow-2xl backdrop-blur-md z-50 before:absolute before:-top-2.5 before:left-0 before:right-0 before:h-2.5 before:content-['']">
                <div className="space-y-1">
                  <button
                    id="nav-sub-futures"
                    onClick={() => {
                      setCurrentDomain('app');
                      setCurrentTab('futures');
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs text-left transition-colors ${
                      currentTab === 'futures' || currentTab === 'staking'
                        ? 'bg-cyan-950/60 text-cyan-300 font-semibold border border-cyan-500/20'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white border border-transparent'
                    }`}
                  >
                    <span className="flex items-center space-x-2.5 min-w-0">
                      <Clock className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="font-medium whitespace-nowrap">Future / Contract Trading</span>
                    </span>
                    <span className="shrink-0 ml-2 rounded-md bg-emerald-950/80 px-2 py-0.5 text-xs text-emerald-300 font-mono font-semibold border border-emerald-800/50">
                      7 Tiers
                    </span>
                  </button>
                  <button
                    id="nav-sub-spot"
                    onClick={() => {
                      setCurrentDomain('app');
                      setCurrentTab('spot');
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs text-left transition-colors ${
                      currentTab === 'spot'
                        ? 'bg-cyan-950/60 text-cyan-300 font-semibold border border-cyan-500/20'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white border border-transparent'
                    }`}
                  >
                    <span className="flex items-center space-x-2.5 min-w-0">
                      <TrendingUp className="h-4 w-4 text-cyan-400 shrink-0" />
                      <span className="font-medium whitespace-nowrap">Spot Trading Terminal</span>
                    </span>
                  </button>
                  <button
                    id="nav-sub-mining"
                    onClick={() => {
                      setCurrentDomain('app');
                      setCurrentTab('mining');
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs text-left transition-colors ${
                      currentTab === 'mining'
                        ? 'bg-cyan-950/60 text-cyan-300 font-semibold border border-cyan-500/20'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white border border-transparent'
                    }`}
                  >
                    <span className="flex items-center space-x-2.5 min-w-0">
                      <Cpu className="h-4 w-4 text-amber-400 shrink-0" />
                      <span className="font-medium whitespace-nowrap">Mining (Hashrate)</span>
                    </span>
                    <span className="shrink-0 ml-2 rounded-md bg-amber-950/80 px-2 py-0.5 text-xs text-amber-300 font-mono font-semibold border border-amber-800/50 whitespace-nowrap">
                      0.01 - 0.15
                    </span>
                  </button>
                  <button
                    id="nav-sub-loan"
                    onClick={() => {
                      setCurrentDomain('app');
                      setCurrentTab('loan');
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs text-left transition-colors ${
                      currentTab === 'loan'
                        ? 'bg-cyan-950/60 text-cyan-300 font-semibold border border-cyan-500/20'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white border border-transparent'
                    }`}
                  >
                    <span className="flex items-center space-x-2.5 min-w-0">
                      <Landmark className="h-4 w-4 text-amber-400 shrink-0" />
                      <span className="font-medium whitespace-nowrap">Crypto Loans (Borrow)</span>
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Markets Button */}
            <button
              id="nav-markets-link"
              onClick={() => {
                setCurrentDomain('app');
                setCurrentTab('market');
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-200 flex items-center space-x-1.5 ${
                currentTab === 'market' && currentDomain === 'app'
                  ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/30 font-semibold shadow-sm shadow-cyan-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Activity className="h-3.5 w-3.5 opacity-80" />
              <span>Markets</span>
            </button>
          </div>
        </div>

        {/* Sisi Kanan: Action Buttons & Unit Selector */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            id="header-security-btn"
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold transition hover:bg-emerald-500/20"
            title="Open account security settings"
          >
            Account Security
          </button>

          <button
            id="header-unit-btn"
            type="button"
            onClick={() => {
              const next = currency === 'USD' ? 'EUR' : currency === 'EUR' ? 'BTC' : 'USD';
              setCurrency(next);
            }}
            className="bg-indigo-600/20 border border-indigo-500/30 px-3 py-1.5 rounded-full text-xs text-indigo-300 font-medium hover:bg-indigo-600/30 transition cursor-pointer"
            title={`Active unit: ${currency} (Click to switch currency)`}
          >
            {currency === 'USD' ? '$ USD' : currency === 'EUR' ? '€ EUR' : '₿ BTC'}
          </button>

          {/* Quick Deposit Button */}
          <button
            id="header-quick-deposit"
            onClick={() => setIsDepositModalOpen(true)}
            className="hidden sm:flex items-center space-x-1 px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 text-xs font-medium hover:bg-cyan-900/40 transition"
          >
            <ArrowDownToLine className="h-3 w-3" />
            <span>Deposit</span>
          </button>

          {/* Web3 Wallet / Authenticated User Dropdown */}
          {wallet.isConnected ? (
            <div className="relative">
              <button
                id="wallet-connect-btn"
                onClick={() => setIsWalletDropdownOpen(!isWalletDropdownOpen)}
                className="flex items-center space-x-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-mono text-slate-200 transition"
              >
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="font-semibold text-cyan-300">
                  {currentUser ? currentUser.name.split(' ')[0] : wallet.address}
                </span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {/* Wallet Dropdown */}
              {isWalletDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-white/10 bg-[#0c1122] p-4 shadow-2xl backdrop-blur-xl z-50">
                  {currentUser && (
                    <div className="border-b border-white/10 pb-3 mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-white font-bold font-mono">{currentUser.name}</span>
                        <span className={`px-2 py-0.5 rounded-md text-xs font-mono uppercase font-bold ${
                          currentUser.role === 'admin' ? 'bg-amber-950 text-amber-300 border border-amber-800/50' : 'bg-purple-950 text-purple-300 border border-purple-800/50'
                        }`}>
                          {currentUser.role}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 font-mono truncate">{currentUser.email}</div>
                    </div>
                  )}

                  <div className="border-b border-white/10 pb-3 mb-3">
                    <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                      <span>Connected Network</span>
                      <span className="font-mono text-cyan-300 font-medium">{wallet.network}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>Available USDT</span>
                      <span className="font-mono font-bold text-white">${wallet.usdtBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <button
                      onClick={() => {
                        setIsWalletDropdownOpen(false);
                        setIsSettingsModalOpen(true);
                      }}
                      className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs text-slate-200 hover:bg-slate-800/80 transition-colors"
                    >
                      <span className="flex items-center space-x-2">
                        <ShieldCheck className="h-4 w-4 text-purple-400" />
                        <span>Account & Security Settings</span>
                      </span>
                    </button>

                    <button
                      onClick={copyAddress}
                      className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs text-slate-300 hover:bg-slate-800/80 transition-colors"
                    >
                      <span className="flex items-center space-x-2">
                        <Copy className="h-4 w-4 text-slate-400" />
                        <span>Copy Wallet Address</span>
                      </span>
                      {copied && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                    </button>

                    {currentUser?.role === 'admin' && (
                      <button
                        onClick={() => {
                          setIsWalletDropdownOpen(false);
                          setCurrentDomain('admin');
                        }}
                        className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs text-amber-300 hover:bg-amber-950/40 transition-colors"
                      >
                        <span className="flex items-center space-x-2">
                          <Layers className="h-4 w-4 text-amber-400" />
                          <span>Admin Console & KYC</span>
                        </span>
                        <span className="text-xs font-mono px-1.5 py-0.5 rounded-md bg-amber-950 border border-amber-800 text-amber-300 font-bold">
                          ROOT
                        </span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsWalletDropdownOpen(false);
                        setCurrentTab('portfolio');
                      }}
                      className="flex w-full items-center space-x-2 rounded-xl px-2.5 py-2 text-xs text-slate-300 hover:bg-slate-800/80 transition-colors"
                    >
                      <BarChart3 className="h-3.5 w-3.5 text-purple-400" />
                      <span>View Asset Portfolio</span>
                    </button>

                    <button
                      onClick={() => {
                        disconnectWallet();
                        setIsWalletDropdownOpen(false);
                      }}
                      className="flex w-full items-center space-x-1.5 rounded-lg px-2 py-1.5 text-xs text-rose-400 hover:bg-rose-950/40 transition-colors mt-1 border-t border-slate-800 pt-2"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>End Session & Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              id="header-connect-btn"
              onClick={() => {
                if (currentDomain === 'landing') {
                  setCurrentDomain('app');
                } else {
                  setIsAuthModalOpen(true);
                }
              }}
              className="flex items-center space-x-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </nav>

      {/* Live Market Ticker below navigation bar */}
      <MarketTicker />
    </header>
  );
};
