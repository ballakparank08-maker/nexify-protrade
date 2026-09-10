export type AppDomain = 'landing' | 'app' | 'admin';

export type AppTab = 
  | 'portfolio' 
  | 'spot' 
  | 'staking' 
  | 'futures'
  | 'mining'
  | 'loan' 
  | 'rewards' 
  | 'market'
  | 'convert';

export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap: number;
  circulatingSupply: string;
  category: 'Layer 1' | 'DeFi' | 'AI & Data' | 'Layer 2' | 'Infrastructure';
  sparkline: number[];
  iconBg: string;
  balance?: number;
  lockedBalance?: number;
}

export interface CandleStick {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

export interface MarketTrade {
  id: string;
  price: number;
  amount: number;
  time: string;
  type: 'buy' | 'sell';
}

export interface UserOrder {
  id: string;
  pair: string;
  type: 'buy' | 'sell';
  orderType: 'limit' | 'market' | 'stop_limit';
  price: number;
  amount: number;
  filled: number;
  status: 'open' | 'filled' | 'canceled';
  createdAt: string;
}

export interface CompletedSpotTrade {
  id: string;
  orderId: string;
  pair: string;
  asset: string;
  side: 'buy' | 'sell';
  orderType: 'limit' | 'market' | 'stop_limit';
  price: number;
  amount: number;
  totalValue: number;
  fee: number;
  feeAsset: string;
  status: 'filled' | 'completed' | 'canceled' | 'partially_filled';
  timestamp: string;
  rawTimestamp?: number;
  txHash?: string;
}

export type OrderHistoryItem = CompletedSpotTrade;

export interface Transaction {
  id: string;
  txHash: string;
  type: 'deposit' | 'withdraw' | 'spot_buy' | 'spot_sell' | 'convert' | 'stake' | 'unstake' | 'borrow' | 'repay' | 'claim_reward';
  asset: string;
  amount: number;
  usdValue: number;
  status: 'completed' | 'processing' | 'pending';
  network: string;
  timestamp: string;
}

export interface CryptoIndex {
  id: string;
  name: string;
  symbol: string;
  value: number;
  change24h: number;
  constituents: string[];
  description: string;
  peRatio?: string;
  marketCap: string;
}

export interface StakingPool {
  id: string;
  asset: string;
  name: string;
  apy: number;
  lockDays: number;
  minStake: number;
  totalStakedUsd: number;
  userStaked: number;
  earnedRewards: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  network: string;
}

export interface CryptoLoanPosition {
  id: string;
  collateralAsset: string;
  collateralAmount: number;
  collateralUsdValue: number;
  borrowedAsset: string;
  borrowedAmount: number;
  interestApr: number;
  ltv: number; // e.g. 62%
  liquidationPrice: number;
  startDate: string;
  status: 'active' | 'repaid' | 'liquidation_warning';
}

export interface TradingPossibilitySignal {
  id: string;
  pair: string;
  signalType: 'Bullish Breakout' | 'Oversold Bounce' | 'Mean Reversion' | 'Accumulation' | 'Bearish Divergence';
  probability: number; // e.g. 84%
  targetPrice: number;
  stopLossPrice: number;
  timeframe: '4H' | '1D' | '1W';
  rsi: number;
  macdStatus: 'Bullish Cross' | 'Neutral' | 'Bearish Divergence';
  riskRewardRatio: string;
}

export interface KYCUserRecord {
  id: string;
  fullName: string;
  email: string;
  walletAddress: string;
  country: string;
  tier: 'Tier 1 (Basic)' | 'Tier 2 (Pro)' | 'Tier 3 (Institutional)';
  kycStatus: 'verified' | 'pending_review' | 'rejected';
  submittedDate: string;
  tradingVolumeUsd: number;
}

export interface ClientAccount extends KYCUserRecord {
  usdtBalance: number;
  assets: Record<string, number>;
  accountLocked: boolean;
}

export interface UserWallet {
  isConnected: boolean;
  address: string | null;
  network: string;
  usdtBalance: number;
  assets: Record<string, number>; // symbol -> balance
}

export type DenominationCurrency = 'USD' | 'EUR' | 'BTC';

export type PriceAlertCondition = 'above' | 'below';

export interface PriceAlert {
  id: string;
  assetSymbol: string;
  targetPrice: number;
  condition: PriceAlertCondition; // 'above' = price >= targetPrice, 'below' = price <= targetPrice
  initialPrice: number;
  createdAt: string;
  note?: string;
  isActive: boolean;
  isTriggered: boolean;
  triggeredAt?: string;
  triggeredPrice?: number;
}

export interface PriceAlertToastItem {
  id: string;
  alert: PriceAlert;
  currentPrice: number;
  timestamp: string;
}

export type LiveFeedStatus = 'connected' | 'connecting' | 'disconnected' | 'error';
export type WebSocketProviderId = 'auto' | 'coincap' | 'coinbase' | 'kraken' | 'binance';

export interface LiveMarketDataStats {
  status: LiveFeedStatus;
  source: string;
  lastUpdated: Date | null;
  latencyMs: number;
  messageCount: number;
  isPaused: boolean;
}

export interface MiningPlan {
  id: string;
  name: string;
  durationDays: number;
  minDeposit: number;
  rewardRate: number; // e.g. 0.01, 0.05, 0.08, 0.10, 0.15
  dailyReturnPct: number;
  totalReturnPct: number;
  hashrateStr: string;
  algorithm: string;
  poolName: string;
  tag: 'Starter' | 'Popular' | 'Growth' | 'Institutional' | 'Genesis VIP';
  description: string;
}

export interface ActiveMiningContract {
  id: string;
  planId: string;
  planName: string;
  durationDays: number;
  amount: number; // USDT invested
  rewardRate: number; // 0.01 -> 0.15
  totalExpectedProfit: number; // amount * rewardRate
  claimedProfit: number;
  startDate: string;
  endDate: string;
  startTime: number;
  endTime: number;
  status: 'mining' | 'completed' | 'terminated';
  hashrateStr: string;
  dailyYieldUsdt: number;
}

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: 'trader' | 'admin';
  institution?: string;
  walletAddress?: string;
  loginMethod: 'credentials';
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  twoFactorVerifiedAt?: string;
  backupCodes?: string[];
  sessionTimeoutMinutes?: number;
  antiPhishingCode?: string;
  whitelistWithdrawals?: boolean;
  lastLoginTime?: string;
  ipAddress?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SecurityAuditEntry {
  id: string;
  action: string;
  ip: string;
  location: string;
  device: string;
  status: 'success' | 'failed' | 'warning';
  timestamp: string;
}

export interface FutureContractPosition {
  id: string;
  orderNumber: string;
  symbol: string; // e.g. 'BTC/USDT'
  direction: 'bullish' | 'bearish'; // 'bullish' (Call/Up) or 'bearish' (Put/Down)
  strikePrice: number;
  currentPrice: number;
  settlementPrice?: number;
  investment: number; // in USDT
  level?: number; // 30, 60, 90, 120, 180, 240, 360
  durationSeconds?: number;
  profitRate: number; // e.g. 0.10 (10%)
  potentialProfit: number; // investment * profitRate
  potentialPayout: number; // investment + potentialProfit
  startTime: number; // timestamp ms
  endTime: number; // timestamp ms
  secondsRemaining: number;
  status: 'active' | 'pending_settlement' | 'won' | 'lost' | 'filled' | 'cancelled' | 'canceled';
  pnl?: number;
  fee: number;
  createdAt: string;
  settledAt?: string;
  txHash?: string;
  cancelReason?: string;
  executionType?: 'market' | 'limit' | 'automated_contract';
}

export interface BillingTimeOption {
  level: number; // 30, 60, 90, 120, 180, 240, 360
  durationSeconds: number;
  amount: number; // Minimum amount: 100, 10000, 50000, 100000, 250000, 400000, 500000
  profitRate: number; // 0.10, 0.15, 0.20, 0.30, 0.40, 0.50, 0.70
  displayRate: string; // "10%", "15%", "20%", "30%", "40%", "50%", "70%"
  label: string;
  seconds?: number;
}
