import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  AppDomain, 
  AppTab, 
  CryptoAsset, 
  CandleStick, 
  OrderBookEntry, 
  MarketTrade, 
  UserOrder, 
  Transaction, 
  StakingPool, 
  CryptoLoanPosition, 
  KYCUserRecord, 
  UserWallet,
  DenominationCurrency,
  PriceAlert,
  PriceAlertCondition,
  PriceAlertToastItem,
  LiveFeedStatus,
  LiveMarketDataStats,
  MiningPlan,
  ActiveMiningContract,
  WebSocketProviderId,
  CompletedSpotTrade,
  UserSession,
  SecurityAuditEntry,
  FutureContractPosition
} from '../types';
import { verifyTOTP } from '../utils/totp';
import { 
  INITIAL_CRYPTO_ASSETS, 
  INITIAL_TRANSACTIONS, 
  STAKING_POOLS, 
  INITIAL_LOANS, 
  INITIAL_KYC_USERS,
  MINING_PLANS,
  INITIAL_MINING_CONTRACTS,
  INITIAL_ORDER_HISTORY,
  generateInitialCandles,
  generateOrderBook,
  generateMarketTrades
} from '../data/mockData';
import {
  marketDataService,
  LiveTickerPayload,
  LiveTradePayload,
  LiveDepthPayload,
  SUPPORTED_MARKET_ASSETS
} from '../services/marketDataService';

interface TradingContextType {
  // Navigation & Domain
  currentDomain: AppDomain;
  setCurrentDomain: (domain: AppDomain) => void;
  currentTab: AppTab;
  setCurrentTab: (tab: AppTab) => void;

  // Global Currency Setting
  currency: DenominationCurrency;
  setCurrency: (c: DenominationCurrency) => void;
  currencySymbol: string;
  currencyRate: number;
  convertUsdToCurrency: (usdAmount: number, overrideCurrency?: DenominationCurrency) => number;
  formatCurrency: (
    usdAmount: number,
    options?: {
      overrideCurrency?: DenominationCurrency;
      showSign?: boolean;
      includeCode?: boolean;
      precision?: number;
    }
  ) => string;
  totalPortfolioConverted: number;
  unrealizedPnl24hConverted: number;

  // Selected Asset & Market
  selectedAsset: CryptoAsset;
  setSelectedAssetId: (id: string) => void;
  cryptoAssets: CryptoAsset[];
  
  // Terminal Live Feeds
  candles: CandleStick[];
  orderBook: { asks: OrderBookEntry[]; bids: OrderBookEntry[] };
  marketTrades: MarketTrade[];
  timeframe: string;
  setTimeframe: (tf: string) => void;

  // User State
  wallet: UserWallet;
  connectWallet: (walletType?: string) => void;
  disconnectWallet: () => void;
  userOrders: UserOrder[];
  orderHistory: CompletedSpotTrade[];
  clearOrderHistory: () => void;
  transactions: Transaction[];
  stakingPools: StakingPool[];
  loans: CryptoLoanPosition[];
  
  // Actions
  placeOrder: (order: {
    type: 'buy' | 'sell';
    orderType: 'limit' | 'market' | 'stop_limit';
    price: number;
    amount: number;
  }) => { success: boolean; message: string };
  cancelOrder: (orderId: string) => void;

  depositFunds: (asset: string, amount: number, network: string) => void;
  withdrawFunds: (asset: string, amount: number, address: string, network: string) => { success: boolean; message: string };
  convertAsset: (fromAsset: string, toAsset: string, amount: number) => { success: boolean; message: string };

  stakeAsset: (poolId: string, amount: number) => { success: boolean; message: string };
  unstakeAsset: (poolId: string, amount: number) => { success: boolean; message: string };

  borrowLoan: (collateralAsset: string, collateralAmount: number, borrowAmount: number) => { success: boolean; message: string };
  repayLoan: (loanId: string) => { success: boolean; message: string };

  claimAllRewards: () => { success: boolean; claimedUsd: number };
  autoCompound: boolean;
  toggleAutoCompound: () => void;

  // Admin Controls
  kycUsers: KYCUserRecord[];
  updateKycStatus: (id: string, status: 'verified' | 'rejected') => void;
  circuitBreakerActive: boolean;
  toggleCircuitBreaker: () => void;
  engineLatencyMs: number;

  // Modals
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isDepositModalOpen: boolean;
  setIsDepositModalOpen: (open: boolean) => void;
  isWithdrawModalOpen: boolean;
  setIsWithdrawModalOpen: (open: boolean) => void;
  modalTargetAsset: string;
  setModalTargetAsset: (sym: string) => void;

  // Price Alerts
  priceAlerts: PriceAlert[];
  activeAlertsCount: number;
  triggeredAlertsCount: number;
  addPriceAlert: (data: { assetSymbol: string; targetPrice: number; condition: PriceAlertCondition; note?: string }) => PriceAlert;
  removePriceAlert: (id: string) => void;
  togglePriceAlert: (id: string) => void;
  rearmPriceAlert: (id: string) => void;
  clearTriggeredAlerts: () => void;
  simulateTriggerAlert: (id: string) => void;
  isPriceAlertModalOpen: boolean;
  setIsPriceAlertModalOpen: (open: boolean) => void;
  targetAlertAsset: CryptoAsset | null;
  setTargetAlertAsset: (asset: CryptoAsset | null) => void;
  openPriceAlertModal: (asset?: CryptoAsset) => void;
  alertToasts: PriceAlertToastItem[];
  dismissAlertToast: (id: string) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;

  // Metrics
  totalPortfolioUsd: number;
  unrealizedPnl24h: number;

  // Real-Time Crypto Market Data Feed (Easy Open WebSockets)
  isLiveFeedActive: boolean;
  toggleLiveFeed: () => void;
  liveFeedStatus: LiveFeedStatus;
  liveFeedSource: string;
  lastLiveUpdate: Date | null;
  refreshMarketData: () => Promise<void>;
  lastPriceTick: { symbol: string; price: number; direction: 'up' | 'down' } | null;
  webSocketProvider: WebSocketProviderId;
  setWebSocketProvider: (provider: WebSocketProviderId) => void;
  
  // Cloud Mining State & Operations
  miningPlans: MiningPlan[];
  activeMiningContracts: ActiveMiningContract[];
  startMiningContract: (planId: string, amount: number) => { success: boolean; message: string };
  claimMiningReward: (contractId: string) => { success: boolean; message: string };
  terminateMiningContract: (contractId: string) => { success: boolean; message: string };
  addDemoUsdt: (amount: number) => void;

  // Authentication & Session
  currentUser: UserSession | null;
  isAuthenticated: boolean;
  loginWithCredentials: (email: string, password?: string) => Promise<{ success: boolean; requires2FA?: boolean; tempUser?: UserSession; error?: string }>;
  loginWithWallet: (walletName?: string) => Promise<{ success: boolean; requires2FA?: boolean; tempUser?: UserSession }>;
  loginWithDemo: (role: 'trader' | 'admin') => Promise<{ success: boolean; requires2FA?: boolean; tempUser?: UserSession }>;
  verifyLogin2FA: (code: string, tempUser: UserSession) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;

  // Security & 2FA Setup
  enable2FA: (secret: string, backupCodes: string[]) => void;
  disable2FA: (verificationCode: string) => Promise<{ success: boolean; error?: string }>;
  updateSecuritySettings: (settings: Partial<UserSession>) => void;
  securityAuditLogs: SecurityAuditEntry[];
  addSecurityAuditLog: (action: string, status?: 'success' | 'failed' | 'warning') => void;

  // Settings Modal
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (open: boolean) => void;
  settingsActiveTab: '2fa' | 'security' | 'sessions' | 'preferences';
  setSettingsActiveTab: (tab: '2fa' | 'security' | 'sessions' | 'preferences') => void;

  // Future Contract Trading
  futurePositions: FutureContractPosition[];
  futureHistory: FutureContractPosition[];
  placeFutureContract: (params: { 
    symbol: string; 
    direction: 'bullish' | 'bearish'; 
    level: number;
  }) => Promise<{ success: boolean; message: string; position?: FutureContractPosition }>;
  settleFuturePositionEarly: (positionId: string) => { success: boolean; message: string };
  cancelFuturePosition: (positionId: string) => { success: boolean; message: string };
  clearFutureHistory: () => void;
}

const FUTURE_CONTRACT_RULES = {
  30: { amount: 100, profitRate: 0.10 },
  60: { amount: 10000, profitRate: 0.15 },
  90: { amount: 50000, profitRate: 0.20 },
  120: { amount: 100000, profitRate: 0.30 },
  180: { amount: 250000, profitRate: 0.40 },
  240: { amount: 400000, profitRate: 0.50 },
  360: { amount: 500000, profitRate: 0.70 }
} as const;

const INITIAL_PRICE_ALERTS: PriceAlert[] = [
  {
    id: 'alert-btc-breakout',
    assetSymbol: 'BTC',
    targetPrice: 68500,
    condition: 'above',
    initialPrice: 67450,
    createdAt: 'Today, 09:30 AM',
    note: 'Resistance breakout watch above $68.5k',
    isActive: true,
    isTriggered: false
  },
  {
    id: 'alert-eth-dip',
    assetSymbol: 'ETH',
    targetPrice: 3450,
    condition: 'below',
    initialPrice: 3520,
    createdAt: 'Today, 10:15 AM',
    note: 'Support dip accumulation retest',
    isActive: true,
    isTriggered: false
  },
  {
    id: 'alert-sol-tp',
    assetSymbol: 'SOL',
    targetPrice: 160,
    condition: 'above',
    initialPrice: 152.8,
    createdAt: 'Yesterday',
    note: 'Tranche 1 TP milestone',
    isActive: false,
    isTriggered: true,
    triggeredAt: 'Yesterday, 18:42 PM',
    triggeredPrice: 160.25
  }
];

export const DEFAULT_DEMO_TRADER: UserSession = {
  id: 'usr-trader-01',
  email: 'marcus.vance@nexifyprotrade.io',
  name: 'Marcus Vance',
  role: 'trader',
  institution: 'Vance Quantitative Alpha (Desk #4)',
  walletAddress: '0x8f3C9e...7B4A',
  loginMethod: 'credentials',
  twoFactorEnabled: false,
  backupCodes: [],
  sessionTimeoutMinutes: 30,
  antiPhishingCode: 'NEXIFY-SECURE-99',
  whitelistWithdrawals: true,
  lastLoginTime: 'Sep 06, 2026, 20:30',
  ipAddress: '198.51.100.42 (Singapore SG1)'
};

export const DEFAULT_DEMO_ADMIN: UserSession = {
  id: 'usr-admin-root',
  email: 'admin@nexifyprotrade.io',
  name: 'Elena Rostova',
  role: 'admin',
  institution: 'Nexify Pro Core Protocol SecOps',
  walletAddress: '0xA4c21...8F99',
  loginMethod: 'credentials',
  twoFactorEnabled: true,
  twoFactorSecret: 'JBSWY3DPEHPK3PXP',
  twoFactorVerifiedAt: 'Sep 01, 2026',
  backupCodes: ['8F92-4A1B', '7C3D-9E5F', '1B2A-3C4D', '5E6F-7A8B'],
  sessionTimeoutMinutes: 15,
  antiPhishingCode: 'ROOT-SECOPS-VIP',
  whitelistWithdrawals: true,
  lastLoginTime: 'Sep 06, 2026, 19:45',
  ipAddress: '198.51.100.42 (Singapore SG1)'
};

export const INITIAL_SECURITY_LOGS: SecurityAuditEntry[] = [
  {
    id: 'log-1',
    action: 'Session Initialized (EIP-4361 Standard)',
    ip: '198.51.100.42',
    location: 'Singapore (Equinix SG1)',
    device: 'Chrome 128 / macOS 14.6',
    status: 'success',
    timestamp: 'Today, 09:14 AM'
  },
  {
    id: 'log-2',
    action: 'Institutional Risk Engine Connected',
    ip: '198.51.100.42',
    location: 'Singapore (Equinix SG1)',
    device: 'Trading Desk Terminal #4',
    status: 'success',
    timestamp: 'Today, 09:15 AM'
  }
];

export const INITIAL_FUTURE_HISTORY: FutureContractPosition[] = [
  {
    id: 'f-ord-84291',
    orderNumber: 'NX-FUT-84291',
    symbol: 'BTC/USDT',
    direction: 'bullish',
    strikePrice: 79620.50,
    settlementPrice: 79780.42,
    currentPrice: 79780.42,
    investment: 100,
    level: 30,
    billingDays: 30,
    billingSeconds: 30 * 86400,
    profitRate: 0.10,
    potentialProfit: 10,
    potentialPayout: 110,
    startTime: Date.now() - 3600000,
    endTime: Date.now() - 3540000,
    secondsRemaining: 0,
    status: 'filled',
    pnl: 10,
    fee: 0,
    createdAt: 'Today, 21:15:00',
    settledAt: 'Today, 21:16:00',
    txHash: '0x4f82a9d1c07e6b...c31b',
    executionType: 'automated_contract'
  },
  {
    id: 'f-ord-84289',
    orderNumber: 'NX-FUT-84289',
    symbol: 'BTC/USDT',
    direction: 'bearish',
    strikePrice: 79840.10,
    settlementPrice: 79710.20,
    currentPrice: 79780.42,
    investment: 10000,
    level: 60,
    billingDays: 60,
    billingSeconds: 60 * 86400,
    profitRate: 0.15,
    potentialProfit: 1500,
    potentialPayout: 11500,
    startTime: Date.now() - 7200000,
    endTime: Date.now() - 7080000,
    secondsRemaining: 0,
    status: 'filled',
    pnl: 1500,
    fee: 0,
    createdAt: 'Today, 20:45:00',
    settledAt: 'Today, 20:47:00',
    txHash: '0x8b32e1a90c4f82...77ea',
    executionType: 'automated_contract'
  },
  {
    id: 'f-ord-84282',
    orderNumber: 'NX-FUT-84282',
    symbol: 'ETH/USDT',
    direction: 'bullish',
    strikePrice: 2492.50,
    settlementPrice: 2492.50,
    currentPrice: 2487.23,
    investment: 100,
    level: 30,
    billingDays: 30,
    billingSeconds: 30 * 86400,
    profitRate: 0.10,
    potentialProfit: 10,
    potentialPayout: 100,
    startTime: Date.now() - 8900000,
    endTime: Date.now() - 8840000,
    secondsRemaining: 0,
    status: 'cancelled',
    pnl: 0,
    fee: 0,
    createdAt: 'Today, 20:10:00',
    settledAt: 'Today, 20:12:30',
    txHash: '0x9b18ef4a71c890...4a71',
    cancelReason: 'Cancelled by trader before settlement lock. Capital 100.00 USDT refunded to balance.',
    executionType: 'automated_contract'
  },
  {
    id: 'f-ord-84275',
    orderNumber: 'NX-FUT-84275',
    symbol: 'BTC/USDT',
    direction: 'bullish',
    strikePrice: 79910.00,
    settlementPrice: 79880.50,
    currentPrice: 79780.42,
    investment: 100,
    level: 30,
    billingDays: 30,
    billingSeconds: 30 * 86400,
    profitRate: 0.10,
    potentialProfit: 10,
    potentialPayout: 110,
    startTime: Date.now() - 10800000,
    endTime: Date.now() - 10740000,
    secondsRemaining: 0,
    status: 'filled',
    pnl: -100,
    fee: 0,
    createdAt: 'Today, 19:30:00',
    settledAt: 'Today, 19:31:00',
    txHash: '0x1c447a28e9d110...bf09',
    executionType: 'automated_contract'
  },
  {
    id: 'f-ord-84260',
    orderNumber: 'NX-FUT-84260',
    symbol: 'SOL/USDT',
    direction: 'bearish',
    strikePrice: 105.40,
    settlementPrice: 105.40,
    currentPrice: 103.72,
    investment: 10000,
    level: 60,
    billingDays: 60,
    billingSeconds: 60 * 86400,
    profitRate: 0.15,
    potentialProfit: 1500,
    potentialPayout: 10000,
    startTime: Date.now() - 14400000,
    endTime: Date.now() - 14340000,
    secondsRemaining: 0,
    status: 'cancelled',
    pnl: 0,
    fee: 0,
    createdAt: 'Today, 18:22:10',
    settledAt: 'Today, 18:24:45',
    txHash: '0x7e29fa88cd1145...bc18',
    cancelReason: 'Order cancelled by trader. 10,000.00 USDT refunded.',
    executionType: 'automated_contract'
  }
];

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Domain state: defaults to 'app' for immediate rich trading workflow, but can toggle to 'landing' or 'admin'
  const [currentDomain, setCurrentDomain] = useState<AppDomain>('app');
  const [currentTab, setCurrentTab] = useState<AppTab>('spot');

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('prism_user_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse user session', e);
      }
    }
    return null;
  });

  const isAuthenticated = currentUser !== null;

  // Settings Modal State
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsActiveTab, setSettingsActiveTab] = useState<'2fa' | 'security' | 'sessions' | 'preferences'>('2fa');
  const [securityAuditLogs, setSecurityAuditLogs] = useState<SecurityAuditEntry[]>(() => {
    const saved = localStorage.getItem('prism_security_logs');
    return saved ? JSON.parse(saved) : INITIAL_SECURITY_LOGS;
  });

  // Market & Asset State
  const [cryptoAssets, setCryptoAssets] = useState<CryptoAsset[]>(() => {
    const saved = localStorage.getItem('prism_assets');
    return saved ? JSON.parse(saved) : INITIAL_CRYPTO_ASSETS;
  });

  const [selectedAssetId, setSelectedAssetIdState] = useState<string>('bitcoin');
  const [timeframe, setTimeframe] = useState<string>('15m');

  const selectedAsset = cryptoAssets.find(a => a.id === selectedAssetId) || cryptoAssets[0];

  // Live Chart & Orderbook
  const [candles, setCandles] = useState<CandleStick[]>(() => generateInitialCandles(selectedAsset.price, 32));
  const [orderBook, setOrderBook] = useState(() => generateOrderBook(selectedAsset.price));
  const [marketTrades, setMarketTrades] = useState<MarketTrade[]>(() => generateMarketTrades(selectedAsset.price));

  // User State
  const [wallet, setWallet] = useState<UserWallet>(() => {
    const saved = localStorage.getItem('prism_wallet');
    const baseWallet = saved ? JSON.parse(saved) : {
      isConnected: false,
      address: '0x8f3C9e...7B4A',
      network: 'Arbitrum One',
      usdtBalance: 28450.00,
      assets: {
        'BTC': 0.8542,
        'ETH': 6.25,
        'SOL': 45.8,
        'PRISM': 2450.0,
        'LINK': 180.0,
        'AVAX': 85.0,
        'NEAR': 320.0,
        'UNI': 110.0,
        'ARB': 1500.0
      }
    };
    const savedSession = localStorage.getItem('prism_user_session');
    if (savedSession) {
      baseWallet.isConnected = true;
    }
    return baseWallet;
  });

  const [userOrders, setUserOrders] = useState<UserOrder[]>([
    {
      id: 'ord-101',
      pair: 'BTC/USDT',
      type: 'buy',
      orderType: 'limit',
      price: 87500.00,
      amount: 0.15,
      filled: 0,
      status: 'open',
      createdAt: '10 mins ago'
    },
    {
      id: 'ord-102',
      pair: 'SOL/USDT',
      type: 'sell',
      orderType: 'limit',
      price: 198.00,
      amount: 10.0,
      filled: 0,
      status: 'open',
      createdAt: '1 hour ago'
    }
  ]);

  const [orderHistory, setOrderHistory] = useState<CompletedSpotTrade[]>(() => {
    const saved = localStorage.getItem('prism_order_history');
    return saved ? JSON.parse(saved) : INITIAL_ORDER_HISTORY;
  });

  const clearOrderHistory = useCallback(() => {
    setOrderHistory([]);
  }, []);

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('prism_txs');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [stakingPools, setStakingPools] = useState<StakingPool[]>(() => {
    const saved = localStorage.getItem('prism_staking');
    return saved ? JSON.parse(saved) : STAKING_POOLS;
  });

  const [loans, setLoans] = useState<CryptoLoanPosition[]>(() => {
    const saved = localStorage.getItem('prism_loans');
    return saved ? JSON.parse(saved) : INITIAL_LOANS;
  });

  const [autoCompound, setAutoCompound] = useState<boolean>(true);

  // Admin states
  const [kycUsers, setKycUsers] = useState<KYCUserRecord[]>(INITIAL_KYC_USERS);
  const [circuitBreakerActive, setCircuitBreakerActive] = useState<boolean>(false);
  const [engineLatencyMs, setEngineLatencyMs] = useState<number>(4.2);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [modalTargetAsset, setModalTargetAsset] = useState<string>('USDT');

  // Price Alerts State & Persistence
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>(() => {
    const saved = localStorage.getItem('prism_price_alerts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse price alerts from localStorage', e);
      }
    }
    return INITIAL_PRICE_ALERTS;
  });

  const [isPriceAlertModalOpen, setIsPriceAlertModalOpen] = useState(false);
  const [targetAlertAsset, setTargetAlertAsset] = useState<CryptoAsset | null>(null);
  const [alertToasts, setAlertToasts] = useState<PriceAlertToastItem[]>([]);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem('prism_alert_sound');
    return saved !== null ? saved === 'true' : true;
  });

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    localStorage.setItem('prism_alert_sound', String(enabled));
  };

  const activeAlertsCount = React.useMemo(() => {
    return priceAlerts.filter(a => a.isActive && !a.isTriggered).length;
  }, [priceAlerts]);

  const triggeredAlertsCount = React.useMemo(() => {
    return priceAlerts.filter(a => a.isTriggered).length;
  }, [priceAlerts]);

  const playAlertSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(784, ctx.currentTime); // G5
      osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.12); // C6
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio playback catch
    }
  }, []);

  const openPriceAlertModal = useCallback((asset?: CryptoAsset) => {
    if (asset) {
      setTargetAlertAsset(asset);
    } else {
      setTargetAlertAsset(selectedAsset);
    }
    setIsPriceAlertModalOpen(true);
  }, [selectedAsset]);

  const dismissAlertToast = useCallback((id: string) => {
    setAlertToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addPriceAlert = useCallback((data: { assetSymbol: string; targetPrice: number; condition: PriceAlertCondition; note?: string }) => {
    const asset = cryptoAssets.find(a => a.symbol === data.assetSymbol) || selectedAsset;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newAlert: PriceAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      assetSymbol: data.assetSymbol.toUpperCase(),
      targetPrice: data.targetPrice,
      condition: data.condition,
      initialPrice: asset ? asset.price : data.targetPrice,
      createdAt: `Today, ${timeStr}`,
      note: data.note?.trim() || undefined,
      isActive: true,
      isTriggered: false
    };

    setPriceAlerts(prev => {
      const updated = [newAlert, ...prev];
      localStorage.setItem('prism_price_alerts', JSON.stringify(updated));
      return updated;
    });

    return newAlert;
  }, [cryptoAssets, selectedAsset]);

  const removePriceAlert = useCallback((id: string) => {
    setPriceAlerts(prev => {
      const updated = prev.filter(a => a.id !== id);
      localStorage.setItem('prism_price_alerts', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const togglePriceAlert = useCallback((id: string) => {
    setPriceAlerts(prev => {
      const updated = prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a);
      localStorage.setItem('prism_price_alerts', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const rearmPriceAlert = useCallback((id: string) => {
    setPriceAlerts(prev => {
      const updated = prev.map(a => a.id === id ? {
        ...a,
        isActive: true,
        isTriggered: false,
        triggeredAt: undefined,
        triggeredPrice: undefined
      } : a);
      localStorage.setItem('prism_price_alerts', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearTriggeredAlerts = useCallback(() => {
    setPriceAlerts(prev => {
      const updated = prev.filter(a => !a.isTriggered);
      localStorage.setItem('prism_price_alerts', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const simulateTriggerAlert = useCallback((id: string) => {
    setPriceAlerts(prev => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      let targetAlert: PriceAlert | null = null;

      const updated = prev.map(a => {
        if (a.id === id) {
          const asset = cryptoAssets.find(x => x.symbol === a.assetSymbol);
          const trigPrice = a.condition === 'above' 
            ? Math.max(a.targetPrice * 1.002, (asset?.price || a.targetPrice)) 
            : Math.min(a.targetPrice * 0.998, (asset?.price || a.targetPrice));
          
          targetAlert = {
            ...a,
            isActive: false,
            isTriggered: true,
            triggeredAt: `Just now (${timeStr})`,
            triggeredPrice: parseFloat(trigPrice.toFixed(a.targetPrice > 50 ? 2 : 4))
          };
          return targetAlert;
        }
        return a;
      });

      if (targetAlert) {
        setAlertToasts(toasts => [
          {
            id: `toast-${Date.now()}-${(targetAlert as unknown as PriceAlert).id}`,
            alert: targetAlert as unknown as PriceAlert,
            currentPrice: (targetAlert as unknown as PriceAlert).triggeredPrice || (targetAlert as unknown as PriceAlert).targetPrice,
            timestamp: timeStr
          },
          ...toasts.slice(0, 4)
        ]);

        if (soundEnabled) {
          playAlertSound();
        }
      }

      localStorage.setItem('prism_price_alerts', JSON.stringify(updated));
      return updated;
    });
  }, [cryptoAssets, soundEnabled, playAlertSound]);

  // Evaluate price alerts whenever cryptoAssets update
  useEffect(() => {
    if (priceAlerts.length === 0) return;

    setPriceAlerts(prev => {
      let triggeredAny = false;
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const next = prev.map(alert => {
        if (!alert.isActive || alert.isTriggered) return alert;

        const asset = cryptoAssets.find(a => a.symbol === alert.assetSymbol);
        if (!asset) return alert;

        const isHit = 
          (alert.condition === 'above' && asset.price >= alert.targetPrice) ||
          (alert.condition === 'below' && asset.price <= alert.targetPrice);

        if (isHit) {
          triggeredAny = true;
          const trig: PriceAlert = {
            ...alert,
            isActive: false,
            isTriggered: true,
            triggeredAt: `Today, ${timeStr}`,
            triggeredPrice: asset.price
          };

          setAlertToasts(toasts => [
            {
              id: `toast-${Date.now()}-${alert.id}`,
              alert: trig,
              currentPrice: asset.price,
              timestamp: timeStr
            },
            ...toasts.slice(0, 4)
          ]);

          return trig;
        }
        return alert;
      });

      if (triggeredAny) {
        if (soundEnabled) playAlertSound();
        localStorage.setItem('prism_price_alerts', JSON.stringify(next));
        return next;
      }
      return prev;
    });
  }, [cryptoAssets, soundEnabled, playAlertSound]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('prism_wallet', JSON.stringify(wallet));
  }, [wallet]);

  useEffect(() => {
    localStorage.setItem('prism_assets', JSON.stringify(cryptoAssets));
  }, [cryptoAssets]);

  useEffect(() => {
    localStorage.setItem('prism_txs', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('prism_order_history', JSON.stringify(orderHistory));
  }, [orderHistory]);

  useEffect(() => {
    localStorage.setItem('prism_staking', JSON.stringify(stakingPools));
  }, [stakingPools]);

  useEffect(() => {
    localStorage.setItem('prism_loans', JSON.stringify(loans));
  }, [loans]);

  // Mining Plans & Active Contracts State
  const [miningPlans] = useState<MiningPlan[]>(MINING_PLANS);
  const [activeMiningContracts, setActiveMiningContracts] = useState<ActiveMiningContract[]>(() => {
    const saved = localStorage.getItem('prism_mining_contracts');
    return saved ? JSON.parse(saved) : INITIAL_MINING_CONTRACTS;
  });

  useEffect(() => {
    localStorage.setItem('prism_mining_contracts', JSON.stringify(activeMiningContracts));
  }, [activeMiningContracts]);

  const startMiningContract = useCallback((planId: string, amount: number) => {
    const plan = miningPlans.find(p => p.id === planId);
    if (!plan) {
      return { success: false, message: 'Invalid mining plan selected.' };
    }
    if (amount < plan.minDeposit) {
      return { 
        success: false, 
        message: `Minimum required deposit for ${plan.name} is ${plan.minDeposit.toLocaleString()} USDT.` 
      };
    }
    if (wallet.usdtBalance < amount) {
      return { 
        success: false, 
        message: `Insufficient USDT balance (${wallet.usdtBalance.toLocaleString()} USDT). Please use 'Quick Demo Deposit' to test this contract tier.` 
      };
    }

    // Deduct USDT from wallet
    setWallet(prev => ({
      ...prev,
      usdtBalance: parseFloat((prev.usdtBalance - amount).toFixed(2))
    }));

    const now = Date.now();
    const durationMs = plan.durationDays * 86400000;
    const startDateStr = new Date(now).toISOString().split('T')[0];
    const endDateStr = new Date(now + durationMs).toISOString().split('T')[0];
    const totalExpectedProfit = parseFloat((amount * plan.rewardRate).toFixed(2));
    const dailyYieldUsdt = parseFloat((totalExpectedProfit / plan.durationDays).toFixed(2));

    const newContract: ActiveMiningContract = {
      id: `mine-${Date.now()}`,
      planId: plan.id,
      planName: plan.name,
      durationDays: plan.durationDays,
      amount,
      rewardRate: plan.rewardRate,
      totalExpectedProfit,
      claimedProfit: 0,
      startDate: startDateStr,
      endDate: endDateStr,
      startTime: now,
      endTime: now + durationMs,
      status: 'mining',
      hashrateStr: plan.hashrateStr,
      dailyYieldUsdt
    };

    setActiveMiningContracts(prev => [newContract, ...prev]);

    const newTx: Transaction = {
      id: `tx-mine-${Date.now()}`,
      txHash: `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`,
      type: 'stake',
      asset: 'USDT',
      amount,
      usdValue: amount,
      status: 'completed',
      network: 'Prism Hashrate Subnet',
      timestamp: 'Just now'
    };
    setTransactions(prev => [newTx, ...prev]);

    return {
      success: true,
      message: `Successfully initiated ${plan.durationDays}-Day mining contract with ${amount.toLocaleString()} USDT! Hashrate allocated.`
    };
  }, [miningPlans, wallet.usdtBalance]);

  const claimMiningReward = useCallback((contractId: string) => {
    let claimedAmount = 0;
    let found = false;

    setActiveMiningContracts(prev => prev.map(c => {
      if (c.id === contractId && c.status === 'mining') {
        found = true;
        const now = Date.now();
        const elapsed = Math.min(now - c.startTime, c.endTime - c.startTime);
        const totalDuration = c.endTime - c.startTime;
        const accruedRatio = totalDuration > 0 ? Math.min(1, elapsed / totalDuration) : 1;
        const accruedTotal = parseFloat((c.totalExpectedProfit * accruedRatio).toFixed(2));
        const claimable = parseFloat(Math.max(0, accruedTotal - c.claimedProfit).toFixed(2));

        if (claimable > 0) {
          claimedAmount = claimable;
          return {
            ...c,
            claimedProfit: parseFloat((c.claimedProfit + claimable).toFixed(2))
          };
        }
      }
      return c;
    }));

    if (!found) {
      return { success: false, message: 'Mining contract not found or already completed.' };
    }
    if (claimedAmount <= 0) {
      return { success: false, message: 'No new claimable rewards accrued yet. Hashrate is actively generating yield.' };
    }

    setWallet(prev => ({
      ...prev,
      usdtBalance: parseFloat((prev.usdtBalance + claimedAmount).toFixed(2))
    }));

    const newTx: Transaction = {
      id: `tx-mine-reward-${Date.now()}`,
      txHash: `0x${Math.random().toString(16).substring(2, 10)}...mine`,
      type: 'claim_reward',
      asset: 'USDT',
      amount: claimedAmount,
      usdValue: claimedAmount,
      status: 'completed',
      network: 'Prism Hashrate Subnet',
      timestamp: 'Just now'
    };
    setTransactions(prev => [newTx, ...prev]);

    return {
      success: true,
      message: `Claimed +${claimedAmount.toLocaleString()} USDT mining yield to your wallet!`
    };
  }, []);

  const terminateMiningContract = useCallback((contractId: string) => {
    let returnedPrincipal = 0;
    let remainingProfit = 0;
    let success = false;

    setActiveMiningContracts(prev => prev.map(c => {
      if (c.id === contractId && c.status === 'mining') {
        success = true;
        returnedPrincipal = c.amount;
        const unpaidProfit = Math.max(0, c.totalExpectedProfit - c.claimedProfit);
        remainingProfit = parseFloat(unpaidProfit.toFixed(2));
        return {
          ...c,
          status: 'completed',
          claimedProfit: c.totalExpectedProfit
        };
      }
      return c;
    }));

    if (!success) {
      return { success: false, message: 'Contract not active or not found.' };
    }

    const totalReturn = returnedPrincipal + remainingProfit;
    setWallet(prev => ({
      ...prev,
      usdtBalance: parseFloat((prev.usdtBalance + totalReturn).toFixed(2))
    }));

    return {
      success: true,
      message: `Contract completed: Returned ${returnedPrincipal.toLocaleString()} USDT principal + ${remainingProfit.toLocaleString()} USDT yield!`
    };
  }, []);

  const addDemoUsdt = useCallback((amount: number) => {
    setWallet(prev => ({
      ...prev,
      usdtBalance: parseFloat((prev.usdtBalance + amount).toFixed(2))
    }));
  }, []);

  // Future Contract Trading States & Handlers
  const [futurePositions, setFuturePositions] = useState<FutureContractPosition[]>(() => {
    const saved = localStorage.getItem('prism_future_positions');
    return saved ? JSON.parse(saved) : [];
  });

  const [futureHistory, setFutureHistory] = useState<FutureContractPosition[]>(() => {
    const saved = localStorage.getItem('prism_future_history');
    return saved ? JSON.parse(saved) : INITIAL_FUTURE_HISTORY;
  });

  useEffect(() => {
    localStorage.setItem('prism_future_positions', JSON.stringify(futurePositions));
  }, [futurePositions]);

  useEffect(() => {
    localStorage.setItem('prism_future_history', JSON.stringify(futureHistory));
  }, [futureHistory]);

  const clearFutureHistory = useCallback(() => {
    setFutureHistory([]);
    localStorage.removeItem('prism_future_history');
  }, []);

  const placeFutureContract = useCallback(async (params: {
    symbol: string;
    direction: 'bullish' | 'bearish';
    level: number;
  }) => {
    const { symbol, direction, level } = params;
    const rule = FUTURE_CONTRACT_RULES[level as keyof typeof FUTURE_CONTRACT_RULES];
    if (!rule) {
      return { success: false, message: 'Select one of the 7 available contract levels.' };
    }
    const { amount: investment, profitRate } = rule;
    const billingDays = level;
    const durationSeconds = billingDays * 86400;

    if (wallet.usdtBalance < investment) {
      return { 
        success: false, 
        message: `Insufficient USDT balance. Current available is ${wallet.usdtBalance.toFixed(2)} USDT, but require ${investment.toFixed(2)} USDT.` 
      };
    }

    // Deduct investment from USDT balance
    setWallet(prev => ({
      ...prev,
      usdtBalance: parseFloat((prev.usdtBalance - investment).toFixed(2))
    }));

    // Determine current live strike price
    const asset = cryptoAssets.find(a => symbol.startsWith(a.symbol)) || selectedAsset;
    const strikePrice = asset ? asset.price : 79780.42;

    const now = Date.now();
    const endTime = now + (durationSeconds * 1000);
    const potentialProfit = parseFloat((investment * profitRate).toFixed(2));
    const potentialPayout = parseFloat((investment + potentialProfit).toFixed(2));
    const orderNum = `NX-FUT-${Math.floor(10000 + Math.random() * 90000)}`;

    const dateObj = new Date(now);
    const timeStr = `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}:${dateObj.getSeconds().toString().padStart(2, '0')}`;

    const newPosition: FutureContractPosition = {
      id: `f-pos-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      orderNumber: orderNum,
      symbol,
      direction,
      strikePrice,
      currentPrice: strikePrice,
      investment,
      level,
      billingDays,
      billingSeconds: durationSeconds,
      profitRate,
      potentialProfit,
      potentialPayout,
      startTime: now,
      endTime,
      secondsRemaining: durationSeconds,
      status: 'active',
      fee: 0,
      createdAt: `Today, ${timeStr}`
    };

    setFuturePositions(prev => [newPosition, ...prev]);

    // Record initial order transaction
    const newTx: Transaction = {
      id: `tx-fut-${Date.now()}`,
      txHash: `0x${Math.random().toString(16).substring(2, 10)}...contract`,
      type: 'spot_buy',
      asset: 'USDT',
      amount: investment,
      usdValue: investment,
      status: 'completed',
      network: 'Contract Order Execution Engine',
      timestamp: 'Just now'
    };
    setTransactions(prev => [newTx, ...prev]);

    return {
      success: true,
      message: `Contract order ${orderNum} opened for Level ${level} on ${symbol} (${direction.toUpperCase()}) with ${investment.toLocaleString()} USDT.`,
      position: newPosition
    };
  }, [wallet.usdtBalance, cryptoAssets, selectedAsset]);

  const settleFuturePositionEarly = useCallback((positionId: string) => {
    let settledItem: FutureContractPosition | null = null;
    let wonPayout = 0;

    setFuturePositions(prev => {
      const remaining: FutureContractPosition[] = [];
      prev.forEach(pos => {
        if (pos.id === positionId) {
          const currentAsset = cryptoAssets.find(a => pos.symbol.startsWith(a.symbol)) || selectedAsset;
          const livePrice = currentAsset ? currentAsset.price : pos.currentPrice;
          const won = pos.direction === 'bullish' 
            ? livePrice >= pos.strikePrice 
            : livePrice <= pos.strikePrice;

          const finalStatus: 'won' | 'lost' = won ? 'won' : 'lost';
          const finalPnl = won ? pos.potentialProfit : -pos.investment;

          if (won) {
            wonPayout = pos.potentialPayout;
          }

          const now = Date.now();
          const settledDate = new Date(now);
          const settledTimeStr = `${settledDate.getHours().toString().padStart(2, '0')}:${settledDate.getMinutes().toString().padStart(2, '0')}:${settledDate.getSeconds().toString().padStart(2, '0')}`;

          settledItem = {
            ...pos,
            currentPrice: livePrice,
            settlementPrice: livePrice,
            secondsRemaining: 0,
            status: finalStatus,
            pnl: finalPnl,
            settledAt: `Today, ${settledTimeStr}`
          };
        } else {
          remaining.push(pos);
        }
      });
      return remaining;
    });

    if (settledItem) {
      setFutureHistory(prev => [settledItem!, ...prev]);

      if (wonPayout > 0) {
        setWallet(prev => ({
          ...prev,
          usdtBalance: parseFloat((prev.usdtBalance + wonPayout).toFixed(2))
        }));

        const newTx: Transaction = {
          id: `tx-fut-win-${Date.now()}`,
          txHash: `0x${Math.random().toString(16).substring(2, 10)}...win`,
          type: 'claim_reward',
          asset: 'USDT',
          amount: wonPayout,
          usdValue: wonPayout,
          status: 'completed',
          network: 'Contract Order Settlement Engine',
          timestamp: 'Just now'
        };
        setTransactions(prev => [newTx, ...prev]);
      }

      return {
        success: true,
        message: `Contract ${settledItem.orderNumber} settled early! Result: ${settledItem.status.toUpperCase()} (${settledItem.status === 'won' ? `+${settledItem.potentialProfit.toFixed(2)} USDT` : `-${settledItem.investment.toFixed(2)} USDT`})`
      };
    }

    return { success: false, message: 'Position not found' };
  }, [cryptoAssets, selectedAsset]);

  const cancelFuturePosition = useCallback((positionId: string) => {
    let cancelledItem: FutureContractPosition | null = null;
    let refundedAmount = 0;

    setFuturePositions(prev => {
      const remaining: FutureContractPosition[] = [];
      prev.forEach(pos => {
        if (pos.id === positionId) {
          refundedAmount = pos.investment;
          const now = Date.now();
          const dateObj = new Date(now);
          const timeStr = `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}:${dateObj.getSeconds().toString().padStart(2, '0')}`;

          cancelledItem = {
            ...pos,
            status: 'cancelled',
            pnl: 0,
            secondsRemaining: 0,
            settledAt: `Today, ${timeStr}`,
            cancelReason: 'Cancelled by trader before settlement lock. Capital refunded in full.',
            txHash: `0x${Math.random().toString(16).substring(2, 10)}...cancel`,
            executionType: 'automated_contract'
          };
        } else {
          remaining.push(pos);
        }
      });
      return remaining;
    });

    if (cancelledItem) {
      setFutureHistory(prev => [cancelledItem!, ...prev]);

      if (refundedAmount > 0) {
        setWallet(prev => ({
          ...prev,
          usdtBalance: parseFloat((prev.usdtBalance + refundedAmount).toFixed(2))
        }));

        const newTx: Transaction = {
          id: `tx-fut-cancel-${Date.now()}`,
          txHash: (cancelledItem as FutureContractPosition).txHash || `0x${Math.random().toString(16).substring(2, 10)}...refund`,
          type: 'unstake',
          asset: 'USDT',
          amount: refundedAmount,
          usdValue: refundedAmount,
          status: 'completed',
          network: 'Contract Order Cancellation Engine',
          timestamp: 'Just now'
        };
        setTransactions(prev => [newTx, ...prev]);
      }

      return {
        success: true,
        message: `Contract order ${(cancelledItem as FutureContractPosition).orderNumber} cancelled successfully! ${refundedAmount.toLocaleString()} USDT refunded to balance.`
      };
    }

    return { success: false, message: 'Position not found' };
  }, []);

  // Tick interval for active Future positions: updates countdowns and settles expired contracts
  useEffect(() => {
    if (futurePositions.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      let hasSettled = false;
      const settledItems: FutureContractPosition[] = [];
      let totalWonPayout = 0;

      setFuturePositions(prev => {
        const remaining: FutureContractPosition[] = [];

        prev.forEach(pos => {
          const currentAsset = cryptoAssets.find(a => pos.symbol.startsWith(a.symbol)) || selectedAsset;
          const livePrice = currentAsset ? currentAsset.price : pos.currentPrice;
          const secondsLeft = Math.max(0, Math.ceil((pos.endTime - now) / 1000));

          if (secondsLeft <= 0 || now >= pos.endTime) {
            hasSettled = true;
            const settlementPrice = livePrice;
            const won = pos.direction === 'bullish' 
              ? settlementPrice >= pos.strikePrice 
              : settlementPrice <= pos.strikePrice;

            const finalStatus: 'won' | 'lost' = won ? 'won' : 'lost';
            const finalPnl = won ? pos.potentialProfit : -pos.investment;

            if (won) {
              totalWonPayout += pos.potentialPayout;
            }

            const settledDate = new Date(now);
            const settledTimeStr = `${settledDate.getHours().toString().padStart(2, '0')}:${settledDate.getMinutes().toString().padStart(2, '0')}:${settledDate.getSeconds().toString().padStart(2, '0')}`;

            settledItems.push({
              ...pos,
              currentPrice: livePrice,
              settlementPrice,
              secondsRemaining: 0,
              status: finalStatus,
              pnl: finalPnl,
              settledAt: `Today, ${settledTimeStr}`
            });
          } else {
            remaining.push({
              ...pos,
              currentPrice: livePrice,
              secondsRemaining: secondsLeft
            });
          }
        });

        return remaining;
      });

      if (hasSettled && settledItems.length > 0) {
        setFutureHistory(prev => [...settledItems, ...prev]);

        if (totalWonPayout > 0) {
          setWallet(prev => ({
            ...prev,
            usdtBalance: parseFloat((prev.usdtBalance + totalWonPayout).toFixed(2))
          }));

          const newTx: Transaction = {
            id: `tx-fut-win-${Date.now()}`,
            txHash: `0x${Math.random().toString(16).substring(2, 10)}...win`,
            type: 'claim_reward',
            asset: 'USDT',
            amount: totalWonPayout,
            usdValue: totalWonPayout,
            status: 'completed',
            network: 'Contract Order Settlement Engine',
            timestamp: 'Just now'
          };
          setTransactions(prev => [newTx, ...prev]);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [futurePositions, cryptoAssets, selectedAsset]);


  // Real-Time Crypto Market Data Feed State (Easy Open WebSockets)
  const [webSocketProvider, setWebSocketProviderState] = useState<WebSocketProviderId>(() => {
    const saved = localStorage.getItem('prism_ws_provider') as WebSocketProviderId;
    if (saved === 'coincap') {
      localStorage.setItem('prism_ws_provider', 'auto');
      return 'auto';
    }
    return saved && ['auto', 'coinbase', 'binance', 'kraken', 'coincap'].includes(saved) ? saved : 'auto';
  });

  const [isLiveFeedActive, setIsLiveFeedActive] = useState<boolean>(() => {
    return localStorage.getItem('prism_live_feed') !== 'false';
  });
  const [liveFeedStatus, setLiveFeedStatus] = useState<LiveFeedStatus>('connecting');
  const [liveFeedSource, setLiveFeedSource] = useState<string>('Auto-Failover (Coinbase + Binance)');
  const [lastLiveUpdate, setLastLiveUpdate] = useState<Date | null>(null);
  const [lastPriceTick, setLastPriceTick] = useState<{ symbol: string; price: number; direction: 'up' | 'down' } | null>(null);

  const setWebSocketProvider = useCallback((provider: WebSocketProviderId) => {
    setWebSocketProviderState(provider);
    localStorage.setItem('prism_ws_provider', provider);
    marketDataService.setProvider(provider);
  }, []);

  const toggleLiveFeed = useCallback(() => {
    setIsLiveFeedActive(prev => {
      const next = !prev;
      localStorage.setItem('prism_live_feed', String(next));
      if (!next) {
        marketDataService.disconnect();
        setLiveFeedStatus('disconnected');
        setLiveFeedSource('Offline (Simulation)');
      } else {
        setLiveFeedStatus('connecting');
      }
      return next;
    });
  }, []);

  const refreshMarketData = useCallback(async () => {
    setLiveFeedStatus('connecting');
    try {
      const snapshot = await marketDataService.fetchTickersSnapshot();
      if (snapshot && Object.keys(snapshot).length > 0) {
        setCryptoAssets(prev => prev.map(asset => {
          const tick = snapshot[asset.symbol];
          if (tick) {
            return {
              ...asset,
              price: tick.price,
              change24h: tick.change24h,
              high24h: Math.max(asset.high24h, tick.high24h),
              low24h: Math.min(asset.low24h, tick.low24h),
              volume24h: tick.volume24h > 0 ? tick.volume24h : asset.volume24h,
              sparkline: [...asset.sparkline.slice(1), tick.price]
            };
          }
          return asset;
        }));
        setLastLiveUpdate(new Date());
        setLiveFeedStatus('connected');
      }
    } catch (e) {
      console.warn('Manual market data refresh failed', e);
    }
  }, []);

  // When selected asset changes, update state and subscribe WebSocket streams
  const setSelectedAssetId = useCallback(async (id: string) => {
    setSelectedAssetIdState(id);
    const asset = cryptoAssets.find(a => a.id === id);
    if (asset) {
      // Immediate responsive UI fallback
      setCandles(generateInitialCandles(asset.price, 32));
      setOrderBook(generateOrderBook(asset.price));
      setMarketTrades(generateMarketTrades(asset.price));

      // Switch real-time feed streams to the new active asset
      marketDataService.setActiveSymbol(asset.symbol);

      if (asset.symbol !== 'PRISM') {
        try {
          const [realCandles, realDepth, realTrades] = await Promise.all([
            marketDataService.fetchHistoricalCandles(asset.symbol, '1m', 32),
            marketDataService.fetchOrderBook(asset.symbol, 15),
            marketDataService.fetchRecentTrades(asset.symbol, 20)
          ]);
          if (realCandles && realCandles.length > 0) setCandles(realCandles);
          if (realDepth && realDepth.bids.length > 0) setOrderBook(realDepth);
          if (realTrades && realTrades.length > 0) setMarketTrades(realTrades);
        } catch (e) {
          console.warn('Real-time data snapshot fetch failed for asset', asset.symbol, e);
        }
      }
    }
  }, [cryptoAssets]);

  // Initial Snapshot load on app startup: fetches real market tickers & initial candles/trades
  useEffect(() => {
    let isMounted = true;
    const loadInitialSnapshots = async () => {
      try {
        const [snapshot, initCandles, initDepth, initTrades] = await Promise.all([
          marketDataService.fetchTickersSnapshot(),
          marketDataService.fetchHistoricalCandles('BTC', '1m', 32),
          marketDataService.fetchOrderBook('BTC', 15),
          marketDataService.fetchRecentTrades('BTC', 20)
        ]);

        if (!isMounted) return;

        if (snapshot && Object.keys(snapshot).length > 0) {
          setCryptoAssets(prev => prev.map(asset => {
            const tick = snapshot[asset.symbol];
            if (tick) {
              return {
                ...asset,
                price: tick.price,
                change24h: tick.change24h,
                high24h: Math.max(asset.high24h, tick.high24h),
                low24h: Math.min(asset.low24h, tick.low24h),
                volume24h: tick.volume24h > 0 ? tick.volume24h : asset.volume24h,
                sparkline: [...asset.sparkline.slice(1), tick.price]
              };
            }
            return asset;
          }));
          setLastLiveUpdate(new Date());
        }

        if (initCandles && initCandles.length > 0) {
          setCandles(initCandles);
        }
        if (initDepth && initDepth.bids.length > 0) {
          setOrderBook(initDepth);
        }
        if (initTrades && initTrades.length > 0) {
          setMarketTrades(initTrades);
        }
      } catch (err) {
        console.warn('Initial market snapshot load failed', err);
      }
    };

    loadInitialSnapshots();
    return () => { isMounted = false; };
  }, []);

  // Real-time Easy Open WebSocket Stream Connection
  useEffect(() => {
    if (!isLiveFeedActive) {
      marketDataService.disconnect();
      setLiveFeedStatus('disconnected');
      return;
    }

    marketDataService.setProvider(webSocketProvider);
    marketDataService.connect(
      {
        onTicker: (ticker) => {
          if (circuitBreakerActive) return;

          setCryptoAssets(prev => {
            let changed = false;
            const next = prev.map(asset => {
              if (asset.symbol === ticker.symbol) {
                changed = true;
                const oldPrice = asset.price;
                const dir: 'up' | 'down' = ticker.price >= oldPrice ? 'up' : 'down';
                if (ticker.price !== oldPrice) {
                  setLastPriceTick({ symbol: ticker.symbol, price: ticker.price, direction: dir });
                }

                // Append new price to sparkline
                const spark = [...asset.sparkline];
                if (spark.length > 0 && Math.abs(ticker.price - spark[spark.length - 1]) / spark[spark.length - 1] > 0.0001) {
                  spark.push(ticker.price);
                  if (spark.length > 12) spark.shift();
                }

                return {
                  ...asset,
                  price: ticker.price,
                  change24h: ticker.change24h,
                  high24h: Math.max(asset.high24h, ticker.high24h, ticker.price),
                  low24h: Math.min(asset.low24h, ticker.low24h, ticker.price),
                  volume24h: ticker.volume24h > 0 ? ticker.volume24h : asset.volume24h,
                  sparkline: spark
                };
              }
              return asset;
            });

            // Native token PRISM reacts dynamically to broader market momentum
            if (ticker.symbol === 'BTC' || ticker.symbol === 'ETH') {
              const btcChange = ticker.change24h;
              return next.map(asset => {
                if (asset.symbol === 'PRISM') {
                  const prismPrice = parseFloat((12.45 * (1 + btcChange * 0.008)).toFixed(3));
                  return {
                    ...asset,
                    price: prismPrice,
                    change24h: parseFloat((btcChange * 1.12).toFixed(2))
                  };
                }
                return asset;
              });
            }

            return changed ? next : prev;
          });

          setLastLiveUpdate(new Date());
        },

        onTrade: (trade) => {
          if (circuitBreakerActive) return;

          // Prepend real Binance trade execution print
          setMarketTrades(prev => [
            {
              id: trade.id,
              price: trade.price,
              amount: trade.amount,
              time: trade.time,
              type: trade.type
            },
            ...prev.slice(0, 24)
          ]);

          // Update active candlestick
          setCandles(prev => {
            if (prev.length === 0) return prev;
            const last = { ...prev[prev.length - 1] };
            last.close = trade.price;
            last.high = Math.max(last.high, trade.price);
            last.low = Math.min(last.low, trade.price);
            last.volume += trade.amount;
            return [...prev.slice(0, prev.length - 1), last];
          });
        },

        onDepth: (depth) => {
          if (circuitBreakerActive) return;
          if (depth.bids.length > 0 && depth.asks.length > 0) {
            setOrderBook({ bids: depth.bids, asks: depth.asks });
          }
        },

        onKline: (kline) => {
          if (circuitBreakerActive) return;
          setCandles(prev => {
            if (prev.length === 0) return [kline];
            const last = prev[prev.length - 1];
            if (last.timestamp === kline.timestamp) {
              return [...prev.slice(0, prev.length - 1), kline];
            } else if (kline.timestamp > last.timestamp) {
              return [...prev.slice(1), kline];
            }
            return prev;
          });
        },

        onStatusChange: (status, source, latency) => {
          setLiveFeedStatus(status);
          setLiveFeedSource(source);
          if (latency > 0) {
            setEngineLatencyMs(latency);
          }
        }
      },
      selectedAsset.symbol,
      webSocketProvider
    );

    return () => {
      marketDataService.disconnect();
    };
  }, [isLiveFeedActive, circuitBreakerActive, selectedAsset.symbol, webSocketProvider]);

  // Fallback simulator for offline mode or when live feed is paused
  useEffect(() => {
    if (isLiveFeedActive || circuitBreakerActive) return;

    const interval = setInterval(() => {
      setCryptoAssets(prev => {
        return prev.map(asset => {
          const driftPct = (Math.random() - 0.48) * 0.003;
          const newPrice = parseFloat((asset.price * (1 + driftPct)).toFixed(asset.price > 50 ? 2 : 4));
          const newChange = parseFloat((asset.change24h + (Math.random() - 0.49) * 0.04).toFixed(2));
          return {
            ...asset,
            price: newPrice,
            change24h: newChange,
            high24h: Math.max(asset.high24h, newPrice),
            low24h: Math.min(asset.low24h, newPrice)
          };
        });
      });
      setEngineLatencyMs(parseFloat((20 + Math.random() * 5).toFixed(1)));
    }, 3000);

    return () => clearInterval(interval);
  }, [isLiveFeedActive, circuitBreakerActive]);

  // Security Audit Logging
  const addSecurityAuditLog = useCallback((action: string, status: 'success' | 'failed' | 'warning' = 'success') => {
    const newLog: SecurityAuditEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      action,
      ip: '198.51.100.42',
      location: 'Singapore (Equinix SG1)',
      device: 'Trading Desk Terminal #4 (macOS)',
      status,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setSecurityAuditLogs(prev => {
      const updated = [newLog, ...prev.slice(0, 49)];
      localStorage.setItem('prism_security_logs', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Authentication & 2FA Implementation
  const loginWithDemo = async (role: 'trader' | 'admin') => {
    const baseAccount = role === 'admin' ? DEFAULT_DEMO_ADMIN : DEFAULT_DEMO_TRADER;
    const savedKey = `prism_account_${baseAccount.id}`;
    const savedData = localStorage.getItem(savedKey);
    const account: UserSession = savedData ? JSON.parse(savedData) : baseAccount;

    if (account.twoFactorEnabled) {
      addSecurityAuditLog(`2FA Login challenge requested for ${account.email}`, 'warning');
      return { success: true, requires2FA: true, tempUser: account };
    }

    setCurrentUser(account);
    localStorage.setItem('prism_user_session', JSON.stringify(account));
    setWallet(prev => ({ ...prev, isConnected: true, address: account.walletAddress || prev.address }));
    addSecurityAuditLog(`Authorized Session Initialized: ${account.email} (${account.role})`, 'success');
    return { success: true, requires2FA: false };
  };

  const loginWithCredentials = async (email: string, _password?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const isAdmin = cleanEmail.includes('admin');
    const baseAccount = isAdmin ? DEFAULT_DEMO_ADMIN : DEFAULT_DEMO_TRADER;
    const savedKey = `prism_account_${baseAccount.id}`;
    const savedData = localStorage.getItem(savedKey);
    const account: UserSession = savedData ? JSON.parse(savedData) : {
      ...baseAccount,
      email: cleanEmail,
      name: cleanEmail.split('@')[0].replace('.', ' ').toUpperCase()
    };

    if (account.twoFactorEnabled) {
      addSecurityAuditLog(`2FA Challenge issued to ${cleanEmail}`, 'warning');
      return { success: true, requires2FA: true, tempUser: account };
    }

    setCurrentUser(account);
    localStorage.setItem('prism_user_session', JSON.stringify(account));
    setWallet(prev => ({ ...prev, isConnected: true, address: account.walletAddress || prev.address }));
    addSecurityAuditLog(`Credential Sign-in Success: ${account.email}`, 'success');
    return { success: true, requires2FA: false };
  };

  const loginWithWallet = async (walletName = 'MetaMask') => {
    const walletAccount: UserSession = {
      id: 'usr-wallet-01',
      email: '0x8f3C9e...7B4A@web3.eth',
      name: `${walletName} Trader`,
      role: 'trader',
      institution: 'Non-Custodial Decentralized Workstation',
      walletAddress: '0x8f3C9e...7B4A',
      loginMethod: 'wallet',
      twoFactorEnabled: false,
      backupCodes: [],
      sessionTimeoutMinutes: 60,
      antiPhishingCode: 'WEB3-SIGNATURE-OK',
      whitelistWithdrawals: true,
      lastLoginTime: 'Just now',
      ipAddress: '198.51.100.42 (Singapore SG1)'
    };

    const savedKey = `prism_account_${walletAccount.id}`;
    const savedData = localStorage.getItem(savedKey);
    const account: UserSession = savedData ? JSON.parse(savedData) : walletAccount;

    if (account.twoFactorEnabled) {
      addSecurityAuditLog(`2FA challenge for Web3 Signature (${walletName})`, 'warning');
      return { success: true, requires2FA: true, tempUser: account };
    }

    setCurrentUser(account);
    localStorage.setItem('prism_user_session', JSON.stringify(account));
    setWallet(prev => ({ ...prev, isConnected: true, address: account.walletAddress || prev.address }));
    addSecurityAuditLog(`Web3 Signature Login Verified (${walletName})`, 'success');
    return { success: true, requires2FA: false };
  };

  const verifyLogin2FA = async (code: string, tempUser: UserSession) => {
    const cleanCode = code.trim().replace(/[\s-]/g, '');

    // Check if it matches an emergency backup code
    const isBackupCode = tempUser.backupCodes && tempUser.backupCodes.includes(cleanCode.toUpperCase());

    // Check TOTP code
    let isTotpValid = false;
    if (tempUser.twoFactorSecret) {
      isTotpValid = await verifyTOTP(tempUser.twoFactorSecret, cleanCode);
    }

    if (!isTotpValid && !isBackupCode) {
      addSecurityAuditLog(`Failed 2FA verification attempt for ${tempUser.email}`, 'failed');
      return { success: false, error: 'Invalid 6-digit Google Authenticator code or recovery code. Please check your authenticator app.' };
    }

    // If backup code was used, remove it from remaining list
    const updatedUser: UserSession = { ...tempUser };
    if (isBackupCode) {
      updatedUser.backupCodes = updatedUser.backupCodes.filter(c => c !== cleanCode.toUpperCase());
    }
    updatedUser.lastLoginTime = 'Just now';

    setCurrentUser(updatedUser);
    localStorage.setItem('prism_user_session', JSON.stringify(updatedUser));
    localStorage.setItem(`prism_account_${updatedUser.id}`, JSON.stringify(updatedUser));
    setWallet(prev => ({ ...prev, isConnected: true, address: updatedUser.walletAddress || prev.address }));
    addSecurityAuditLog(`Google Authenticator 2FA Verified for ${updatedUser.email}`, 'success');
    return { success: true };
  };

  const logout = () => {
    if (currentUser) {
      addSecurityAuditLog(`Trader Session Terminated (${currentUser.email})`, 'success');
    }
    setCurrentUser(null);
    localStorage.removeItem('prism_user_session');
    setWallet(prev => ({ ...prev, isConnected: false }));
  };

  const enable2FA = (secret: string, backupCodes: string[]) => {
    if (!currentUser) return;
    const updated: UserSession = {
      ...currentUser,
      twoFactorEnabled: true,
      twoFactorSecret: secret,
      twoFactorVerifiedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      backupCodes
    };
    setCurrentUser(updated);
    localStorage.setItem('prism_user_session', JSON.stringify(updated));
    localStorage.setItem(`prism_account_${updated.id}`, JSON.stringify(updated));
    addSecurityAuditLog(`Google Authenticator 2FA Activated & Enforced`, 'success');
  };

  const disable2FA = async (verificationCode: string) => {
    if (!currentUser) return { success: false, error: 'No active session' };
    const cleanCode = verificationCode.trim().replace(/[\s-]/g, '');

    let isValid = false;
    if (currentUser.twoFactorSecret) {
      isValid = await verifyTOTP(currentUser.twoFactorSecret, cleanCode);
    }
    if (!isValid && currentUser.backupCodes && currentUser.backupCodes.includes(cleanCode.toUpperCase())) {
      isValid = true;
    }

    if (!isValid) {
      addSecurityAuditLog(`Failed 2FA Deactivation Attempt`, 'failed');
      return { success: false, error: 'Incorrect Google Authenticator code or recovery code.' };
    }

    const updated: UserSession = {
      ...currentUser,
      twoFactorEnabled: false,
      twoFactorSecret: undefined,
      twoFactorVerifiedAt: undefined,
      backupCodes: []
    };
    setCurrentUser(updated);
    localStorage.setItem('prism_user_session', JSON.stringify(updated));
    localStorage.setItem(`prism_account_${updated.id}`, JSON.stringify(updated));
    addSecurityAuditLog(`Google Authenticator 2FA Deactivated`, 'warning');
    return { success: true };
  };

  const updateSecuritySettings = (settings: Partial<UserSession>) => {
    if (!currentUser) return;
    const updated: UserSession = { ...currentUser, ...settings };
    setCurrentUser(updated);
    localStorage.setItem('prism_user_session', JSON.stringify(updated));
    localStorage.setItem(`prism_account_${updated.id}`, JSON.stringify(updated));
    addSecurityAuditLog(`Security preferences updated`, 'success');
  };

  // Wallet Connect
  const connectWallet = (walletType: string = 'MetaMask') => {
    loginWithWallet(walletType);
    setIsAuthModalOpen(false);
  };

  const disconnectWallet = () => {
    logout();
  };

  // Place Order
  const placeOrder = useCallback((order: {
    type: 'buy' | 'sell';
    orderType: 'limit' | 'market' | 'stop_limit';
    price: number;
    amount: number;
  }) => {
    if (circuitBreakerActive) {
      return { success: false, message: 'Trading is temporarily halted by the Admin Circuit Breaker.' };
    }

    const costUsd = order.price * order.amount;
    const sym = selectedAsset.symbol;

    if (order.type === 'buy') {
      if (wallet.usdtBalance < costUsd) {
        return { success: false, message: `Insufficient USDT balance. Need $${costUsd.toFixed(2)}, have $${wallet.usdtBalance.toFixed(2)}.` };
      }

      // Execute order
      if (order.orderType === 'market') {
        setWallet(prev => ({
          ...prev,
          usdtBalance: prev.usdtBalance - costUsd,
          assets: {
            ...prev.assets,
            [sym]: (prev.assets[sym] || 0) + order.amount
          }
        }));

        const now = new Date();
        const timestampStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        const tradeId = `trd-${Date.now()}`;
        const orderId = `ord-${Date.now()}`;
        const txHash = `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`;
        const feeAmount = parseFloat((costUsd * 0.0002).toFixed(4));

        const newTx: Transaction = {
          id: `tx-${Date.now()}`,
          txHash,
          type: 'spot_buy',
          asset: sym,
          amount: order.amount,
          usdValue: costUsd,
          status: 'completed',
          network: 'Prism Matching Engine',
          timestamp: 'Just now'
        };
        setTransactions(prev => [newTx, ...prev]);

        const completedTrade: CompletedSpotTrade = {
          id: tradeId,
          orderId,
          pair: `${sym}/USDT`,
          asset: sym,
          side: 'buy',
          orderType: 'market',
          price: order.price,
          amount: order.amount,
          totalValue: costUsd,
          fee: feeAmount,
          feeAsset: 'USDT',
          status: 'filled',
          timestamp: timestampStr,
          rawTimestamp: Date.now(),
          txHash
        };
        setOrderHistory(prev => [completedTrade, ...prev]);

        return { success: true, message: `Market Buy executed: ${order.amount} ${sym} for $${costUsd.toFixed(2)}` };
      } else {
        // Limit order
        setWallet(prev => ({
          ...prev,
          usdtBalance: prev.usdtBalance - costUsd
        }));

        const newOrder: UserOrder = {
          id: `ord-${Date.now()}`,
          pair: `${sym}/USDT`,
          type: 'buy',
          orderType: order.orderType,
          price: order.price,
          amount: order.amount,
          filled: 0,
          status: 'open',
          createdAt: 'Just now'
        };
        setUserOrders(prev => [newOrder, ...prev]);

        return { success: true, message: `Limit Buy placed: ${order.amount} ${sym} @ $${order.price}` };
      }
    } else {
      // SELL
      const curBal = wallet.assets[sym] || 0;
      if (curBal < order.amount) {
        return { success: false, message: `Insufficient ${sym} balance. Available: ${curBal.toFixed(4)}` };
      }

      if (order.orderType === 'market') {
        setWallet(prev => ({
          ...prev,
          usdtBalance: prev.usdtBalance + costUsd,
          assets: {
            ...prev.assets,
            [sym]: prev.assets[sym] - order.amount
          }
        }));

        const now = new Date();
        const timestampStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        const tradeId = `trd-${Date.now()}`;
        const orderId = `ord-${Date.now()}`;
        const txHash = `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`;
        const feeAmount = parseFloat((costUsd * 0.0002).toFixed(4));

        const newTx: Transaction = {
          id: `tx-${Date.now()}`,
          txHash,
          type: 'spot_sell',
          asset: sym,
          amount: order.amount,
          usdValue: costUsd,
          status: 'completed',
          network: 'Prism Matching Engine',
          timestamp: 'Just now'
        };
        setTransactions(prev => [newTx, ...prev]);

        const completedTrade: CompletedSpotTrade = {
          id: tradeId,
          orderId,
          pair: `${sym}/USDT`,
          asset: sym,
          side: 'sell',
          orderType: 'market',
          price: order.price,
          amount: order.amount,
          totalValue: costUsd,
          fee: feeAmount,
          feeAsset: 'USDT',
          status: 'filled',
          timestamp: timestampStr,
          rawTimestamp: Date.now(),
          txHash
        };
        setOrderHistory(prev => [completedTrade, ...prev]);

        return { success: true, message: `Market Sell executed: ${order.amount} ${sym} for $${costUsd.toFixed(2)}` };
      } else {
        setWallet(prev => ({
          ...prev,
          assets: {
            ...prev.assets,
            [sym]: prev.assets[sym] - order.amount
          }
        }));

        const newOrder: UserOrder = {
          id: `ord-${Date.now()}`,
          pair: `${sym}/USDT`,
          type: 'sell',
          orderType: order.orderType,
          price: order.price,
          amount: order.amount,
          filled: 0,
          status: 'open',
          createdAt: 'Just now'
        };
        setUserOrders(prev => [newOrder, ...prev]);

        return { success: true, message: `Limit Sell placed: ${order.amount} ${sym} @ $${order.price}` };
      }
    }
  }, [circuitBreakerActive, selectedAsset.symbol, wallet]);

  const cancelOrder = (orderId: string) => {
    const ord = userOrders.find(o => o.id === orderId);
    if (!ord) return;

    const sym = ord.pair.split('/')[0];
    if (ord.type === 'buy') {
      const refund = ord.price * ord.amount;
      setWallet(prev => ({
        ...prev,
        usdtBalance: prev.usdtBalance + refund
      }));
    } else {
      setWallet(prev => ({
        ...prev,
        assets: {
          ...prev.assets,
          [sym]: (prev.assets[sym] || 0) + ord.amount
        }
      }));
    }

    const now = new Date();
    const timestampStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const canceledTrade: CompletedSpotTrade = {
      id: `trd-${Date.now()}`,
      orderId: ord.id,
      pair: ord.pair,
      asset: sym,
      side: ord.type,
      orderType: ord.orderType,
      price: ord.price,
      amount: ord.amount,
      totalValue: ord.price * ord.amount,
      fee: 0,
      feeAsset: 'USDT',
      status: 'canceled',
      timestamp: timestampStr,
      rawTimestamp: Date.now(),
      txHash: '0x00000000...cancelled'
    };
    setOrderHistory(prev => [canceledTrade, ...prev]);

    setUserOrders(prev => prev.filter(o => o.id !== orderId));
  };

  // Deposit funds
  const depositFunds = (asset: string, amount: number, network: string) => {
    let usdValue = amount;
    if (asset !== 'USDT' && asset !== 'USDC') {
      const found = cryptoAssets.find(a => a.symbol === asset);
      usdValue = found ? amount * found.price : amount;
    }

    if (asset === 'USDT' || asset === 'USDC') {
      setWallet(prev => ({
        ...prev,
        usdtBalance: prev.usdtBalance + amount
      }));
    } else {
      setWallet(prev => ({
        ...prev,
        assets: {
          ...prev.assets,
          [asset]: (prev.assets[asset] || 0) + amount
        }
      }));
    }

    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      txHash: `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`,
      type: 'deposit',
      asset,
      amount,
      usdValue,
      status: 'completed',
      network,
      timestamp: 'Just now'
    };
    setTransactions(prev => [tx, ...prev]);
  };

  // Withdraw funds
  const withdrawFunds = (asset: string, amount: number, address: string, network: string) => {
    if (asset === 'USDT') {
      if (wallet.usdtBalance < amount) {
        return { success: false, message: 'Insufficient USDT balance.' };
      }
      setWallet(prev => ({ ...prev, usdtBalance: prev.usdtBalance - amount }));
    } else {
      const cur = wallet.assets[asset] || 0;
      if (cur < amount) {
        return { success: false, message: `Insufficient ${asset} balance.` };
      }
      setWallet(prev => ({
        ...prev,
        assets: { ...prev.assets, [asset]: cur - amount }
      }));
    }

    const found = cryptoAssets.find(a => a.symbol === asset);
    const usdVal = asset === 'USDT' ? amount : (found ? amount * found.price : amount);

    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      txHash: `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`,
      type: 'withdraw',
      asset,
      amount,
      usdValue: usdVal,
      status: 'processing',
      network,
      timestamp: 'Just now'
    };
    setTransactions(prev => [tx, ...prev]);

    return { success: true, message: `Withdrawal of ${amount} ${asset} dispatched on ${network}.` };
  };

  const convertAsset = (fromAsset: string, toAsset: string, amount: number) => {
    if (circuitBreakerActive) {
      return { success: false, message: 'Conversions are temporarily halted by the Admin Circuit Breaker.' };
    }
    if (fromAsset === toAsset || !Number.isFinite(amount) || amount <= 0) {
      return { success: false, message: 'Select different assets and enter a valid amount.' };
    }

    const fromPrice = fromAsset === 'USDT' ? 1 : cryptoAssets.find(asset => asset.symbol === fromAsset)?.price;
    const toPrice = toAsset === 'USDT' ? 1 : cryptoAssets.find(asset => asset.symbol === toAsset)?.price;
    if (!fromPrice || !toPrice) {
      return { success: false, message: 'A live quote is not available for the selected asset.' };
    }

    const available = fromAsset === 'USDT' ? wallet.usdtBalance : (wallet.assets[fromAsset] || 0);
    if (amount > available) {
      return { success: false, message: `Insufficient ${fromAsset} balance. Available: ${available.toFixed(6)} ${fromAsset}.` };
    }

    const usdValue = amount * fromPrice;
    const receivedAmount = (usdValue * 0.999) / toPrice;
    setWallet(prev => ({
      ...prev,
      usdtBalance: prev.usdtBalance + (toAsset === 'USDT' ? receivedAmount : 0) - (fromAsset === 'USDT' ? amount : 0),
      assets: {
        ...prev.assets,
        ...(fromAsset === 'USDT' ? {} : { [fromAsset]: (prev.assets[fromAsset] || 0) - amount }),
        ...(toAsset === 'USDT' ? {} : { [toAsset]: (prev.assets[toAsset] || 0) + receivedAmount })
      }
    }));

    setTransactions(prev => [{
      id: `tx-${Date.now()}`,
      txHash: `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`,
      type: 'convert',
      asset: `${fromAsset}/${toAsset}`,
      amount,
      usdValue,
      status: 'completed',
      network: 'Prism Convert Engine',
      timestamp: 'Just now'
    }, ...prev]);

    return { success: true, message: `Converted ${amount.toFixed(6)} ${fromAsset} to ${receivedAmount.toFixed(6)} ${toAsset}.` };
  };

  // Staking
  const stakeAsset = (poolId: string, amount: number) => {
    const pool = stakingPools.find(p => p.id === poolId);
    if (!pool) return { success: false, message: 'Pool not found.' };

    const curBal = wallet.assets[pool.asset] || 0;
    if (curBal < amount) {
      return { success: false, message: `Insufficient ${pool.asset} available to stake.` };
    }

    setWallet(prev => ({
      ...prev,
      assets: {
        ...prev.assets,
        [pool.asset]: curBal - amount
      }
    }));

    setStakingPools(prev => prev.map(p => {
      if (p.id === poolId) {
        return {
          ...p,
          userStaked: p.userStaked + amount,
          totalStakedUsd: p.totalStakedUsd + (amount * (cryptoAssets.find(a => a.symbol === pool.asset)?.price || 1))
        };
      }
      return p;
    }));

    const found = cryptoAssets.find(a => a.symbol === pool.asset);
    const usdVal = found ? amount * found.price : amount;

    setTransactions(prev => [{
      id: `tx-${Date.now()}`,
      txHash: `0x${Math.random().toString(16).substring(2, 10)}...`,
      type: 'stake',
      asset: pool.asset,
      amount,
      usdValue: usdVal,
      status: 'completed',
      network: pool.network,
      timestamp: 'Just now'
    }, ...prev]);

    return { success: true, message: `Successfully staked ${amount} ${pool.asset} at ${pool.apy}% APY.` };
  };

  const unstakeAsset = (poolId: string, amount: number) => {
    const pool = stakingPools.find(p => p.id === poolId);
    if (!pool || pool.userStaked < amount) {
      return { success: false, message: 'Invalid unstake amount or insufficient staked balance.' };
    }

    setStakingPools(prev => prev.map(p => {
      if (p.id === poolId) {
        return {
          ...p,
          userStaked: p.userStaked - amount
        };
      }
      return p;
    }));

    setWallet(prev => ({
      ...prev,
      assets: {
        ...prev.assets,
        [pool.asset]: (prev.assets[pool.asset] || 0) + amount
      }
    }));

    const found = cryptoAssets.find(a => a.symbol === pool.asset);
    const usdVal = found ? amount * found.price : amount;

    setTransactions(prev => [{
      id: `tx-${Date.now()}`,
      txHash: `0x${Math.random().toString(16).substring(2, 10)}...`,
      type: 'unstake',
      asset: pool.asset,
      amount,
      usdValue: usdVal,
      status: 'completed',
      network: pool.network,
      timestamp: 'Just now'
    }, ...prev]);

    return { success: true, message: `Successfully unstaked ${amount} ${pool.asset}. Returned to available balance.` };
  };

  // Loans / Borrow
  const borrowLoan = (collateralAsset: string, collateralAmount: number, borrowAmount: number) => {
    const curBal = wallet.assets[collateralAsset] || 0;
    if (curBal < collateralAmount) {
      return { success: false, message: `Insufficient ${collateralAsset} for collateral.` };
    }

    const assetObj = cryptoAssets.find(a => a.symbol === collateralAsset);
    const collateralPrice = assetObj ? assetObj.price : 1;
    const collateralUsd = collateralAmount * collateralPrice;
    const ltv = parseFloat(((borrowAmount / collateralUsd) * 100).toFixed(1));

    if (ltv > 75) {
      return { success: false, message: `LTV ratio ${ltv}% exceeds maximum allowable limit of 75%.` };
    }

    // Lock collateral from balance
    setWallet(prev => ({
      ...prev,
      usdtBalance: prev.usdtBalance + borrowAmount,
      assets: {
        ...prev.assets,
        [collateralAsset]: curBal - collateralAmount
      }
    }));

    const liquidationPrice = parseFloat((collateralPrice * (ltv / 85)).toFixed(2));

    const newLoan: CryptoLoanPosition = {
      id: `loan-${Date.now()}`,
      collateralAsset,
      collateralAmount,
      collateralUsdValue: collateralUsd,
      borrowedAsset: 'USDT',
      borrowedAmount: borrowAmount,
      interestApr: 4.5,
      ltv,
      liquidationPrice,
      startDate: new Date().toISOString().split('T')[0],
      status: 'active'
    };

    setLoans(prev => [newLoan, ...prev]);

    setTransactions(prev => [{
      id: `tx-${Date.now()}`,
      txHash: `0x${Math.random().toString(16).substring(2, 10)}...`,
      type: 'borrow',
      asset: 'USDT',
      amount: borrowAmount,
      usdValue: borrowAmount,
      status: 'completed',
      network: 'Prism Credit Vault',
      timestamp: 'Just now'
    }, ...prev]);

    return { success: true, message: `Loan approved! Borrowed ${borrowAmount} USDT against ${collateralAmount} ${collateralAsset}.` };
  };

  const repayLoan = (loanId: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return { success: false, message: 'Loan not found.' };

    if (wallet.usdtBalance < loan.borrowedAmount) {
      return { success: false, message: `Insufficient USDT balance to repay $${loan.borrowedAmount.toFixed(2)}.` };
    }

    setWallet(prev => ({
      ...prev,
      usdtBalance: prev.usdtBalance - loan.borrowedAmount,
      assets: {
        ...prev.assets,
        [loan.collateralAsset]: (prev.assets[loan.collateralAsset] || 0) + loan.collateralAmount
      }
    }));

    setLoans(prev => prev.map(l => l.id === loanId ? { ...l, status: 'repaid' } : l));

    setTransactions(prev => [{
      id: `tx-${Date.now()}`,
      txHash: `0x${Math.random().toString(16).substring(2, 10)}...`,
      type: 'repay',
      asset: 'USDT',
      amount: loan.borrowedAmount,
      usdValue: loan.borrowedAmount,
      status: 'completed',
      network: 'Prism Credit Vault',
      timestamp: 'Just now'
    }, ...prev]);

    return { success: true, message: `Loan #${loanId} fully repaid. Collateral of ${loan.collateralAmount} ${loan.collateralAsset} returned!` };
  };

  // Rewards
  const claimAllRewards = () => {
    let totalUsd = 0;
    setStakingPools(prev => prev.map(pool => {
      const assetObj = cryptoAssets.find(a => a.symbol === pool.asset);
      const price = assetObj ? assetObj.price : 1;
      const val = pool.earnedRewards * price;
      totalUsd += val;

      if (pool.earnedRewards > 0) {
        setWallet(w => ({
          ...w,
          assets: {
            ...w.assets,
            [pool.asset]: (w.assets[pool.asset] || 0) + pool.earnedRewards
          }
        }));
      }

      return {
        ...pool,
        earnedRewards: 0
      };
    }));

    if (totalUsd > 0) {
      setTransactions(prev => [{
        id: `tx-${Date.now()}`,
        txHash: `0x${Math.random().toString(16).substring(2, 10)}...`,
        type: 'claim_reward',
        asset: 'STAKING_REWARDS',
        amount: totalUsd,
        usdValue: totalUsd,
        status: 'completed',
        network: 'Prism Yield Hub',
        timestamp: 'Just now'
      }, ...prev]);
    }

    return { success: true, claimedUsd: totalUsd };
  };

  const toggleAutoCompound = () => {
    setAutoCompound(prev => !prev);
  };

  // Admin controls
  const updateKycStatus = (id: string, status: 'verified' | 'rejected') => {
    setKycUsers(prev => prev.map(u => u.id === id ? { ...u, kycStatus: status } : u));
  };

  const toggleCircuitBreaker = () => {
    setCircuitBreakerActive(prev => !prev);
  };

  // Calculate Net Worth & PnL
  const totalPortfolioUsd = React.useMemo(() => {
    let sum = wallet.usdtBalance;
    (Object.entries(wallet.assets) as [string, number][]).forEach(([sym, amtRaw]) => {
      const amt = Number(amtRaw) || 0;
      const asset = cryptoAssets.find(a => a.symbol === sym);
      if (asset) {
        sum += amt * asset.price;
      }
    });
    // Add staked amounts
    stakingPools.forEach(p => {
      const asset = cryptoAssets.find(a => a.symbol === p.asset);
      if (asset) {
        sum += p.userStaked * asset.price;
      }
    });
    return sum;
  }, [wallet, cryptoAssets, stakingPools]);

  const unrealizedPnl24h = React.useMemo(() => {
    let pnl = 0;
    (Object.entries(wallet.assets) as [string, number][]).forEach(([sym, amtRaw]) => {
      const amt = Number(amtRaw) || 0;
      const asset = cryptoAssets.find(a => a.symbol === sym);
      if (asset) {
        const val = amt * asset.price;
        pnl += val * (asset.change24h / 100);
      }
    });
    return pnl;
  }, [wallet.assets, cryptoAssets]);

  // Global Currency State (USD, EUR, BTC)
  const [currency, setCurrencyState] = useState<DenominationCurrency>(() => {
    const saved = localStorage.getItem('prism_currency');
    if (saved === 'USD' || saved === 'EUR' || saved === 'BTC') return saved;
    return 'USD';
  });

  const setCurrency = (c: DenominationCurrency) => {
    setCurrencyState(c);
    localStorage.setItem('prism_currency', c);
  };

  const btcAsset = cryptoAssets.find(a => a.symbol === 'BTC');
  const btcPrice = btcAsset && btcAsset.price > 0 ? btcAsset.price : 67450;
  const eurRate = 0.92; // 1 USD = 0.92 EUR

  const getCurrencyRate = useCallback((target: DenominationCurrency) => {
    if (target === 'EUR') return eurRate;
    if (target === 'BTC') return 1 / btcPrice;
    return 1;
  }, [btcPrice]);

  const currencyRate = getCurrencyRate(currency);
  const currencySymbol = currency === 'EUR' ? '€' : currency === 'BTC' ? '₿' : '$';

  const convertUsdToCurrency = useCallback((usdAmount: number, overrideCurrency?: DenominationCurrency) => {
    const curr = overrideCurrency || currency;
    const rate = getCurrencyRate(curr);
    return usdAmount * rate;
  }, [currency, getCurrencyRate]);

  const formatCurrency = useCallback((
    usdAmount: number,
    options?: {
      overrideCurrency?: DenominationCurrency;
      showSign?: boolean;
      includeCode?: boolean;
      precision?: number;
    }
  ) => {
    const curr = options?.overrideCurrency || currency;
    const converted = convertUsdToCurrency(usdAmount, curr);
    const sym = curr === 'EUR' ? '€' : curr === 'BTC' ? '₿' : '$';
    const isNegative = converted < 0;
    const absVal = Math.abs(converted);

    let formattedNum = '';
    if (options?.precision !== undefined) {
      formattedNum = absVal.toLocaleString(undefined, {
        minimumFractionDigits: options.precision,
        maximumFractionDigits: options.precision,
      });
    } else if (curr === 'BTC') {
      if (absVal === 0) {
        formattedNum = '0.0000';
      } else if (absVal >= 1) {
        formattedNum = absVal.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
      } else if (absVal >= 0.001) {
        formattedNum = absVal.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 });
      } else {
        formattedNum = absVal.toLocaleString(undefined, { minimumFractionDigits: 8, maximumFractionDigits: 8 });
      }
    } else {
      formattedNum = absVal.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }

    const sign = options?.showSign && usdAmount > 0 ? '+' : isNegative ? '-' : '';
    const codeStr = options?.includeCode ? ` ${curr}` : '';

    return `${sign}${sym}${formattedNum}${codeStr}`;
  }, [currency, convertUsdToCurrency]);

  const totalPortfolioConverted = convertUsdToCurrency(totalPortfolioUsd);
  const unrealizedPnl24hConverted = convertUsdToCurrency(unrealizedPnl24h);

  return (
    <TradingContext.Provider
      value={{
        currentDomain,
        setCurrentDomain,
        currentTab,
        setCurrentTab,
        currency,
        setCurrency,
        currencySymbol,
        currencyRate,
        convertUsdToCurrency,
        formatCurrency,
        totalPortfolioConverted,
        unrealizedPnl24hConverted,
        selectedAsset,
        setSelectedAssetId,
        cryptoAssets,
        candles,
        orderBook,
        marketTrades,
        timeframe,
        setTimeframe,
        wallet,
        connectWallet,
        disconnectWallet,
        userOrders,
        orderHistory,
        clearOrderHistory,
        transactions,
        stakingPools,
        loans,
        placeOrder,
        cancelOrder,
        depositFunds,
        withdrawFunds,
        convertAsset,
        stakeAsset,
        unstakeAsset,
        borrowLoan,
        repayLoan,
        claimAllRewards,
        autoCompound,
        toggleAutoCompound,
        kycUsers,
        updateKycStatus,
        circuitBreakerActive,
        toggleCircuitBreaker,
        engineLatencyMs,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isDepositModalOpen,
        setIsDepositModalOpen,
        isWithdrawModalOpen,
        setIsWithdrawModalOpen,
        modalTargetAsset,
        setModalTargetAsset,
        priceAlerts,
        activeAlertsCount,
        triggeredAlertsCount,
        addPriceAlert,
        removePriceAlert,
        togglePriceAlert,
        rearmPriceAlert,
        clearTriggeredAlerts,
        simulateTriggerAlert,
        isPriceAlertModalOpen,
        setIsPriceAlertModalOpen,
        targetAlertAsset,
        setTargetAlertAsset,
        openPriceAlertModal,
        alertToasts,
        dismissAlertToast,
        soundEnabled,
        setSoundEnabled,
        totalPortfolioUsd,
        unrealizedPnl24h,
        isLiveFeedActive,
        toggleLiveFeed,
        liveFeedStatus,
        liveFeedSource,
        lastLiveUpdate,
        refreshMarketData,
        lastPriceTick,
        webSocketProvider,
        setWebSocketProvider,
        miningPlans,
        activeMiningContracts,
        startMiningContract,
        claimMiningReward,
        terminateMiningContract,
        addDemoUsdt,
        currentUser,
        isAuthenticated,
        loginWithCredentials,
        loginWithWallet,
        loginWithDemo,
        verifyLogin2FA,
        logout,
        enable2FA,
        disable2FA,
        updateSecuritySettings,
        securityAuditLogs,
        addSecurityAuditLog,
        isSettingsModalOpen,
        setIsSettingsModalOpen,
        settingsActiveTab,
        setSettingsActiveTab,
        futurePositions,
        futureHistory,
        placeFutureContract,
        settleFuturePositionEarly,
        cancelFuturePosition,
        clearFutureHistory
      }}
    >
      {children}
    </TradingContext.Provider>
  );
};

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
};
