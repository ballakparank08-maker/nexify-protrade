import React from 'react';
import { TradingProvider, useTrading } from './context/TradingContext';
import { Header } from './components/common/Header';
import { LandingPage } from './components/landing/LandingPage';
import { PortfolioView } from './components/portfolio/PortfolioView';
import { SpotTradingTerminal } from './components/trade/SpotTradingTerminal';
import { FutureTradingTerminal } from './components/trade/FutureTradingTerminal';
import { StakingTerminal } from './components/trade/StakingTerminal';
import { MiningTerminal } from './components/trade/MiningTerminal';
import { CryptoLoanTerminal } from './components/trade/CryptoLoanTerminal';
import { ConvertTerminal } from './components/trade/ConvertTerminal';
import { MarketOverview } from './components/market/MarketOverview';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AuthModal } from './components/auth/AuthModal';
import { LoginPage } from './components/auth/LoginPage';
import { UserSettingsModal } from './components/settings/UserSettingsModal';
import { DepositWithdrawModal } from './components/portfolio/DepositWithdrawModal';
import { PriceAlertModal } from './components/common/PriceAlertModal';
import { PriceAlertToast } from './components/common/PriceAlertToast';
import { NexifyLogo } from './components/common/NexifyLogo';
import { ShieldCheck, Cpu, Layers, ExternalLink } from 'lucide-react';

const MainContent: React.FC = () => {
  const { currentDomain, currentTab, setCurrentDomain, setCurrentTab, isAuthenticated, currentUser } = useTrading();

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col selection:bg-purple-500 selection:text-white bg-tech-grid">
      <Header />

      {/* Main Domain Router View */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentDomain === 'landing' && <LandingPage />}

        {currentDomain === 'admin' && (
          !isAuthenticated || currentUser?.role !== 'admin' ? (
            <LoginPage targetDomain="admin" />
          ) : (
            <AdminDashboard />
          )
        )}

        {currentDomain === 'app' && (
          !isAuthenticated ? (
            <LoginPage targetDomain="app" />
          ) : (
            <div className="space-y-6">
              {/* Mobile Tab Navigation Bar */}
              <div className="lg:hidden flex items-center space-x-2 overflow-x-auto pb-2 border-b border-white/10 no-scrollbar">
                <button
                  onClick={() => setCurrentTab('portfolio')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium font-mono shrink-0 transition-all ${
                    currentTab === 'portfolio' 
                      ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/30 font-semibold shadow-sm' 
                      : 'bg-slate-900/80 border border-white/5 text-slate-300 hover:text-white'
                  }`}
                >
                  Portfolio
                </button>
                <button
                  onClick={() => setCurrentTab('spot')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium font-mono shrink-0 transition-all ${
                    currentTab === 'spot' 
                      ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/30 font-semibold shadow-sm' 
                      : 'bg-slate-900/80 border border-white/5 text-slate-300 hover:text-white'
                  }`}
                >
                  Trade
                </button>
                <button
                  onClick={() => setCurrentTab('futures')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium font-mono shrink-0 transition-all ${
                    currentTab === 'futures' || currentTab === 'staking' 
                      ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/30 font-semibold shadow-sm' 
                      : 'bg-slate-900/80 border border-white/5 text-slate-300 hover:text-white'
                  }`}
                >
                  Futures Trading
                </button>
                <button
                  onClick={() => setCurrentTab('mining')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium font-mono shrink-0 transition-all ${
                    currentTab === 'mining' 
                      ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/30 font-semibold shadow-sm' 
                      : 'bg-slate-900/80 border border-white/5 text-slate-300 hover:text-white'
                  }`}
                >
                  Mining
                </button>
                <button
                  onClick={() => setCurrentTab('loan')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium font-mono shrink-0 transition-all ${
                    currentTab === 'loan' 
                      ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/30 font-semibold shadow-sm' 
                      : 'bg-slate-900/80 border border-white/5 text-slate-300 hover:text-white'
                  }`}
                >
                  Crypto Loans
                </button>
                <button
                  onClick={() => setCurrentTab('market')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium font-mono shrink-0 transition-all ${
                    currentTab === 'market' 
                      ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/30 font-semibold shadow-sm' 
                      : 'bg-slate-900/80 border border-white/5 text-slate-300 hover:text-white'
                  }`}
                >
                  Markets
                </button>
              </div>

              {/* Tab Views */}
              {currentTab === 'portfolio' && <PortfolioView />}
              {currentTab === 'spot' && <SpotTradingTerminal />}
              {(currentTab === 'staking' || currentTab === 'futures') && <FutureTradingTerminal />}
              {currentTab === 'mining' && <MiningTerminal />}
              {currentTab === 'loan' && <CryptoLoanTerminal />}
              {currentTab === 'market' && <MarketOverview />}
              {currentTab === 'convert' && <ConvertTerminal />}
            </div>
          )
        )}
      </main>

      {/* Global Application Footer */}
      <footer className="mt-16 border-t border-white/10 bg-[#060a14] py-8 text-xs font-mono text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center">
            <NexifyLogo variant="full" size="sm" showSubtext />
          </div>

          <div className="flex items-center space-x-6 text-xs text-slate-300">
            <button onClick={() => setCurrentDomain('landing')} className="hover:text-cyan-300 transition-colors">
              nexifyprotrade.io
            </button>
            <button onClick={() => { setCurrentDomain('app'); setCurrentTab('portfolio'); }} className="hover:text-cyan-300 transition-colors">
              app.nexifyprotrade.io
            </button>
            {currentUser?.role === 'admin' && (
              <button onClick={() => setCurrentDomain('admin')} className="hover:text-cyan-300 transition-colors">
                admin.nexifyprotrade.io
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-300">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>CertiK Audited • Proof of Reserves Verified</span>
          </div>
        </div>
      </footer>

      {/* Global Modals & Notifications */}
      <AuthModal />
      <UserSettingsModal />
      <DepositWithdrawModal />
      <PriceAlertModal />
      <PriceAlertToast />
    </div>
  );
};

export default function App() {
  return (
    <TradingProvider>
      <MainContent />
    </TradingProvider>
  );
}
