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
import { ShieldCheck } from 'lucide-react';

const normalizePath = (value: string) => {
  const stripped = value.trim().replace(/^\/+|\/+$/g, '');
  return `/${stripped || 'secure-admin-login'}`;
};

const ADMIN_LOGIN_PATH = normalizePath(import.meta.env.VITE_ADMIN_LOGIN_PATH || '/secure-admin-login');

const MainContent: React.FC = () => {
  const { currentDomain, currentTab, setCurrentTab, isAuthenticated, currentUser } = useTrading();
  const [isAdminRoute, setIsAdminRoute] = React.useState(
    typeof window !== 'undefined' && window.location.pathname === ADMIN_LOGIN_PATH
  );
  const [adminSessionState, setAdminSessionState] = React.useState<'idle' | 'checking' | 'authorized' | 'denied'>('idle');

  React.useEffect(() => {
    const syncFromPath = () => {
      setIsAdminRoute(window.location.pathname === ADMIN_LOGIN_PATH);
    };

    syncFromPath();
    window.addEventListener('popstate', syncFromPath);
    return () => window.removeEventListener('popstate', syncFromPath);
  }, []);

  React.useEffect(() => {
    if (!isAdminRoute) {
      setAdminSessionState('idle');
      return;
    }

    if (!isAuthenticated || currentUser?.role !== 'admin') {
      setAdminSessionState('denied');
      return;
    }

    let cancelled = false;
    setAdminSessionState('checking');

    fetch('/api/admin/session', { credentials: 'include' })
      .then((response) => {
        if (!cancelled) {
          setAdminSessionState(response.ok ? 'authorized' : 'denied');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAdminSessionState('denied');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAdminRoute, isAuthenticated, currentUser]);

  const renderAdminRoute = () => {
    if (!isAuthenticated) {
      return <LoginPage targetDomain="admin" />;
    }

    if (adminSessionState === 'checking') {
      return (
        <div className="flex min-h-[60vh] items-center justify-center font-mono text-sm text-slate-300">
          Verifying administrator session…
        </div>
      );
    }

    if (adminSessionState !== 'authorized') {
      return (
        <div className="flex min-h-[70vh] w-full items-center justify-center px-4 py-6">
          <div className="w-full max-w-lg rounded-2xl border border-rose-800/80 bg-[#090e1e]/95 p-8 text-center shadow-2xl">
            <h2 className="mb-2 font-mono text-2xl font-bold text-white">Access denied</h2>
            <p className="mb-6 text-sm text-slate-300">This area is restricted.</p>
            <button
              onClick={() => window.location.assign('/')}
              className="rounded-xl bg-purple-600 px-5 py-2.5 font-mono text-xs font-bold text-white hover:bg-purple-500"
            >
              Return to application
            </button>
          </div>
        </div>
      );
    }

    return <AdminDashboard />;
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col selection:bg-purple-500 selection:text-white bg-tech-grid">
      {!isAdminRoute && <Header />}

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isAdminRoute ? (
          renderAdminRoute()
        ) : (
          <>
            {currentDomain === 'landing' && <LandingPage />}

            {currentDomain === 'app' && (
              !isAuthenticated ? (
                <LoginPage targetDomain="app" />
              ) : (
                <div className="space-y-6">
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
          </>
        )}
      </main>

      {!isAdminRoute && (
        <footer className="mt-16 border-t border-white/10 bg-[#060a14] py-8 text-xs font-mono text-slate-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center">
              <NexifyLogo variant="full" size="sm" showSubtext />
            </div>

            <div className="flex items-center space-x-6 text-xs text-slate-300">
              <span>nexifyprotrade.io</span>
              <span>app.nexifyprotrade.io</span>
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-300">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>CertiK Audited • Proof of Reserves Verified</span>
            </div>
          </div>
        </footer>
      )}

      {!isAdminRoute && (
        <>
          <AuthModal />
          <UserSettingsModal />
          <DepositWithdrawModal />
          <PriceAlertModal />
          <PriceAlertToast />
        </>
      )}
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
