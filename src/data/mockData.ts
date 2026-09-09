import { 
  CryptoAsset, 
  CryptoIndex, 
  StakingPool, 
  CryptoLoanPosition, 
  TradingPossibilitySignal, 
  Transaction,
  CandleStick,
  OrderBookEntry,
  MarketTrade,
  MiningPlan,
  ActiveMiningContract,
  CompletedSpotTrade
} from '../types';

export const INITIAL_CRYPTO_ASSETS: CryptoAsset[] = [
  {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 89450.25,
    change24h: 3.42,
    high24h: 90220.00,
    low24h: 86800.50,
    volume24h: 34820194820,
    marketCap: 1765000000000,
    circulatingSupply: '19.82M BTC',
    category: 'Layer 1',
    sparkline: [86800, 87200, 86900, 87600, 88100, 87900, 88800, 89450],
    iconBg: '#F7931A',
    balance: 0,
    lockedBalance: 0
  },
  {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    price: 3342.80,
    change24h: -1.18,
    high24h: 3420.00,
    low24h: 3290.40,
    volume24h: 18450280000,
    marketCap: 402100000000,
    circulatingSupply: '120.3M ETH',
    category: 'Layer 1',
    sparkline: [3380, 3410, 3390, 3350, 3320, 3310, 3360, 3342],
    iconBg: '#627EEA',
    balance: 0,
    lockedBalance: 0
  },
  {
    id: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    price: 188.65,
    change24h: 6.84,
    high24h: 192.40,
    low24h: 175.20,
    volume24h: 6890120000,
    marketCap: 89200000000,
    circulatingSupply: '468.2M SOL',
    category: 'Layer 1',
    sparkline: [175, 178, 181, 179, 183, 185, 187, 188.6],
    iconBg: '#14F195',
    balance: 0,
    lockedBalance: 0
  },
  {
    id: 'prism-token',
    symbol: 'PRISM',
    name: 'Nexify ProTrade Governance',
    price: 12.45,
    change24h: 12.30,
    high24h: 13.10,
    low24h: 10.90,
    volume24h: 840291000,
    marketCap: 1245000000,
    circulatingSupply: '100.0M PRISM',
    category: 'DeFi',
    sparkline: [10.9, 11.2, 11.4, 11.8, 12.0, 12.1, 12.3, 12.45],
    iconBg: '#A855F7',
    balance: 0,
    lockedBalance: 0
  },
  {
    id: 'chainlink',
    symbol: 'LINK',
    name: 'Chainlink',
    price: 18.25,
    change24h: 4.12,
    high24h: 18.90,
    low24h: 17.30,
    volume24h: 1240890000,
    marketCap: 10950000000,
    circulatingSupply: '608.1M LINK',
    category: 'Infrastructure',
    sparkline: [17.3, 17.5, 17.9, 17.8, 18.0, 18.1, 18.3, 18.25],
    iconBg: '#375BD2',
    balance: 0,
    lockedBalance: 0
  },
  {
    id: 'avalanche',
    symbol: 'AVAX',
    name: 'Avalanche',
    price: 36.80,
    change24h: 2.15,
    high24h: 37.90,
    low24h: 35.40,
    volume24h: 890400000,
    marketCap: 14800000000,
    circulatingSupply: '402.1M AVAX',
    category: 'Layer 1',
    sparkline: [35.4, 35.8, 36.1, 35.9, 36.4, 36.5, 36.7, 36.8],
    iconBg: '#E84142',
    balance: 0,
    lockedBalance: 0
  },
  {
    id: 'near-protocol',
    symbol: 'NEAR',
    name: 'NEAR Protocol (AI)',
    price: 6.95,
    change24h: 8.45,
    high24h: 7.20,
    low24h: 6.30,
    volume24h: 920500000,
    marketCap: 8300000000,
    circulatingSupply: '1.2B NEAR',
    category: 'AI & Data',
    sparkline: [6.3, 6.45, 6.6, 6.55, 6.75, 6.85, 6.9, 6.95],
    iconBg: '#00EC97',
    balance: 0,
    lockedBalance: 0
  },
  {
    id: 'uniswap',
    symbol: 'UNI',
    name: 'Uniswap',
    price: 9.85,
    change24h: -2.40,
    high24h: 10.30,
    low24h: 9.60,
    volume24h: 420800000,
    marketCap: 5900000000,
    circulatingSupply: '600.5M UNI',
    category: 'DeFi',
    sparkline: [10.2, 10.1, 9.9, 9.95, 9.7, 9.65, 9.8, 9.85],
    iconBg: '#FF007A',
    balance: 0,
    lockedBalance: 0
  },
  {
    id: 'arbitrum',
    symbol: 'ARB',
    name: 'Arbitrum One',
    price: 0.94,
    change24h: 1.85,
    high24h: 0.98,
    low24h: 0.91,
    volume24h: 310500000,
    marketCap: 3800000000,
    circulatingSupply: '4.0B ARB',
    category: 'Layer 2',
    sparkline: [0.91, 0.92, 0.93, 0.92, 0.94, 0.93, 0.94, 0.94],
    iconBg: '#28A0F0',
    balance: 0,
    lockedBalance: 0
  }
];

export const CRYPTO_INDICES: CryptoIndex[] = [
  {
    id: 'idx-defi10',
    name: 'Prism DeFi 10 Index',
    symbol: 'PRISM-DEFI10',
    value: 2485.40,
    change24h: 3.12,
    constituents: ['UNI', 'AAVE', 'MKR', 'LDO', 'CRV', 'SNX', 'RPL', 'PENDLE', 'COMP', 'DYDX'],
    description: 'Capitalization-weighted index tracking the 10 largest decentralized finance protocols with quarterly rebalancing.',
    peRatio: '14.2x (Protocol Rev)',
    marketCap: '$38.4B'
  },
  {
    id: 'idx-l1mega',
    name: 'Mega-Cap Layer 1 Index',
    symbol: 'PRISM-L1MEGA',
    value: 4920.80,
    change24h: 1.84,
    constituents: ['BTC', 'ETH', 'SOL', 'AVAX', 'BNB', 'NEAR', 'SUI', 'APT'],
    description: 'Benchmarked exposure to foundational smart contract settlement layers and sound monetary crypto assets.',
    peRatio: '32.6x (Network Fees)',
    marketCap: '$2.31T'
  },
  {
    id: 'idx-ai-meta',
    name: 'AI & Machine Intelligence Index',
    symbol: 'PRISM-AIX',
    value: 1840.15,
    change24h: 7.92,
    constituents: ['NEAR', 'FET', 'RNDR', 'TAO', 'AKT', 'OCEAN', 'GRT', 'AGIX'],
    description: 'Basket of decentralized compute, data provenance, and machine learning model validation protocols.',
    peRatio: '18.9x (Compute Demand)',
    marketCap: '$29.7B'
  },
  {
    id: 'idx-infra',
    name: 'Web3 Infrastructure Core',
    symbol: 'PRISM-INFRA',
    value: 1120.60,
    change24h: 2.45,
    constituents: ['LINK', 'FIL', 'AR', 'GRT', 'PYTH', 'TIA', 'WORM'],
    description: 'Index covering cross-chain messaging, decentralized storage nodes, and oracle infrastructure.',
    peRatio: '11.5x (Oracle Bandwidth)',
    marketCap: '$24.2B'
  }
];

export const STAKING_POOLS: StakingPool[] = [
  {
    id: 'stake-prism',
    asset: 'PRISM',
    name: 'Prism Platform Staking',
    apy: 14.8,
    lockDays: 90,
    minStake: 50,
    totalStakedUsd: 48200000,
    userStaked: 1000,
    earnedRewards: 36.95,
    riskLevel: 'Low',
    network: 'Arbitrum One'
  },
  {
    id: 'stake-eth',
    asset: 'ETH',
    name: 'Ethereum Validator Pooled',
    apy: 4.25,
    lockDays: 0, // Flexible
    minStake: 0.1,
    totalStakedUsd: 312500000,
    userStaked: 2.0,
    earnedRewards: 0.042,
    riskLevel: 'Low',
    network: 'Ethereum Mainnet'
  },
  {
    id: 'stake-sol',
    asset: 'SOL',
    name: 'Solana High-Yield Validator',
    apy: 7.80,
    lockDays: 30,
    minStake: 1.0,
    totalStakedUsd: 89400000,
    userStaked: 20.0,
    earnedRewards: 0.78,
    riskLevel: 'Medium',
    network: 'Solana'
  },
  {
    id: 'stake-avax',
    asset: 'AVAX',
    name: 'Avalanche Subnet Staking',
    apy: 8.50,
    lockDays: 60,
    minStake: 5.0,
    totalStakedUsd: 42100000,
    userStaked: 40.0,
    earnedRewards: 1.24,
    riskLevel: 'Medium',
    network: 'Avalanche C-Chain'
  }
];

export const INITIAL_LOANS: CryptoLoanPosition[] = [
  {
    id: 'loan-01',
    collateralAsset: 'BTC',
    collateralAmount: 0.15,
    collateralUsdValue: 13417.50,
    borrowedAsset: 'USDT',
    borrowedAmount: 7500.00,
    interestApr: 4.2,
    ltv: 55.9,
    liquidationPrice: 58200.00,
    startDate: '2026-08-14',
    status: 'active'
  },
  {
    id: 'loan-02',
    collateralAsset: 'ETH',
    collateralAmount: 2.0,
    collateralUsdValue: 6685.60,
    borrowedAsset: 'USDC',
    borrowedAmount: 3500.00,
    interestApr: 4.8,
    ltv: 52.3,
    liquidationPrice: 2150.00,
    startDate: '2026-08-28',
    status: 'active'
  }
];

export const TRADING_SIGNALS: TradingPossibilitySignal[] = [
  {
    id: 'sig-01',
    pair: 'BTC/USDT',
    signalType: 'Bullish Breakout',
    probability: 86,
    targetPrice: 94500.00,
    stopLossPrice: 86900.00,
    timeframe: '4H',
    rsi: 61.4,
    macdStatus: 'Bullish Cross',
    riskRewardRatio: '1 : 2.8'
  },
  {
    id: 'sig-02',
    pair: 'SOL/USDT',
    signalType: 'Oversold Bounce',
    probability: 79,
    targetPrice: 210.00,
    stopLossPrice: 178.50,
    timeframe: '1D',
    rsi: 43.2,
    macdStatus: 'Bullish Cross',
    riskRewardRatio: '1 : 3.1'
  },
  {
    id: 'sig-03',
    pair: 'PRISM/USDT',
    signalType: 'Accumulation',
    probability: 91,
    targetPrice: 16.80,
    stopLossPrice: 11.20,
    timeframe: '4H',
    rsi: 58.7,
    macdStatus: 'Bullish Cross',
    riskRewardRatio: '1 : 3.5'
  },
  {
    id: 'sig-04',
    pair: 'ETH/USDT',
    signalType: 'Mean Reversion',
    probability: 74,
    targetPrice: 3600.00,
    stopLossPrice: 3220.00,
    timeframe: '1D',
    rsi: 48.1,
    macdStatus: 'Neutral',
    riskRewardRatio: '1 : 2.1'
  },
  {
    id: 'sig-05',
    pair: 'NEAR/USDT',
    signalType: 'Bullish Breakout',
    probability: 82,
    targetPrice: 8.60,
    stopLossPrice: 6.40,
    timeframe: '4H',
    rsi: 65.8,
    macdStatus: 'Bullish Cross',
    riskRewardRatio: '1 : 3.0'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-001',
    txHash: '0x8f3c...b4a1',
    type: 'deposit',
    asset: 'USDT',
    amount: 15000.00,
    usdValue: 15000.00,
    status: 'completed',
    network: 'Arbitrum One',
    timestamp: '2026-09-04 18:24'
  },
  {
    id: 'tx-002',
    txHash: '0x3e1d...a89c',
    type: 'spot_buy',
    asset: 'BTC',
    amount: 0.12,
    usdValue: 10734.00,
    status: 'completed',
    network: 'Off-chain Engine',
    timestamp: '2026-09-04 20:15'
  },
  {
    id: 'tx-003',
    txHash: '0x77b2...9f3e',
    type: 'stake',
    asset: 'PRISM',
    amount: 1000.00,
    usdValue: 12450.00,
    status: 'completed',
    network: 'Arbitrum One',
    timestamp: '2026-09-03 14:10'
  },
  {
    id: 'tx-004',
    txHash: '0x12a9...5c22',
    type: 'claim_reward',
    asset: 'PRISM',
    amount: 36.95,
    usdValue: 460.02,
    status: 'completed',
    network: 'Arbitrum One',
    timestamp: '2026-09-02 09:33'
  },
  {
    id: 'tx-005',
    txHash: '0x66c8...012d',
    type: 'borrow',
    asset: 'USDT',
    amount: 7500.00,
    usdValue: 7500.00,
    status: 'completed',
    network: 'Prism Credit Vault',
    timestamp: '2026-08-14 11:20'
  },
  {
    id: 'tx-006',
    txHash: '0xaa45...78ef',
    type: 'withdraw',
    asset: 'ETH',
    amount: 1.5,
    usdValue: 5014.20,
    status: 'completed',
    network: 'Ethereum Mainnet',
    timestamp: '2026-08-10 16:45'
  }
];

export function generateInitialCandles(basePrice: number, count: number = 36): CandleStick[] {
  const candles: CandleStick[] = [];
  let currentPrice = basePrice * 0.92;
  const now = Date.now();
  const intervalMs = 15 * 60 * 1000; // 15 min candles

  for (let i = count; i >= 0; i--) {
    const timestamp = now - i * intervalMs;
    const date = new Date(timestamp);
    const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    
    // random volatility
    const change = (Math.random() - 0.48) * (basePrice * 0.015);
    const open = currentPrice;
    const close = Math.max(open + change, basePrice * 0.5);
    const high = Math.max(open, close) + Math.random() * (basePrice * 0.008);
    const low = Math.min(open, close) - Math.random() * (basePrice * 0.008);
    const volume = Math.floor(Math.random() * 450 + 50);

    candles.push({
      time,
      timestamp,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume
    });

    currentPrice = close;
  }

  // Ensure last close matches current price approximately
  if (candles.length > 0) {
    candles[candles.length - 1].close = basePrice;
  }

  return candles;
}

export function generateOrderBook(midPrice: number, count = 24): { asks: OrderBookEntry[]; bids: OrderBookEntry[] } {
  const asks: OrderBookEntry[] = [];
  const bids: OrderBookEntry[] = [];
  const decimals = midPrice > 100 ? 2 : midPrice > 1 ? 3 : 4;

  let askTotal = 0;
  for (let i = 1; i <= count; i++) {
    // Non-linear realistic spread widening further out
    const spreadPct = 0.0004 * i + 0.00003 * (i * i);
    const price = parseFloat((midPrice * (1 + spreadPct)).toFixed(decimals));
    // Occasional liquidity wall at round clusters
    const isWall = i === 6 || i === 14 || i === 20;
    const baseAmount = Math.random() * 1.6 + 0.25;
    const amount = parseFloat((isWall ? baseAmount * (2.8 + Math.random() * 1.5) : baseAmount).toFixed(4));
    askTotal += amount;
    asks.push({ price, amount, total: parseFloat(askTotal.toFixed(4)) });
  }

  let bidTotal = 0;
  for (let i = 1; i <= count; i++) {
    const spreadPct = 0.0004 * i + 0.00003 * (i * i);
    const price = parseFloat((midPrice * (1 - spreadPct)).toFixed(decimals));
    const isWall = i === 5 || i === 13 || i === 19;
    const baseAmount = Math.random() * 1.6 + 0.25;
    const amount = parseFloat((isWall ? baseAmount * (2.8 + Math.random() * 1.5) : baseAmount).toFixed(4));
    bidTotal += amount;
    bids.push({ price, amount, total: parseFloat(bidTotal.toFixed(4)) });
  }

  return {
    asks: asks.reverse(), // highest ask at top for orderbook list view
    bids
  };
}

export function generateMarketTrades(midPrice: number): MarketTrade[] {
  const trades: MarketTrade[] = [];
  const now = new Date();

  for (let i = 0; i < 10; i++) {
    const isBuy = Math.random() > 0.45;
    const offset = (Math.random() - 0.5) * 0.002 * midPrice;
    const price = parseFloat((midPrice + offset).toFixed(2));
    const amount = parseFloat((Math.random() * 1.5 + 0.05).toFixed(4));
    const secondsAgo = i * 4 + Math.floor(Math.random() * 3);
    const timeDate = new Date(now.getTime() - secondsAgo * 1000);
    const time = `${timeDate.getHours().toString().padStart(2, '0')}:${timeDate.getMinutes().toString().padStart(2, '0')}:${timeDate.getSeconds().toString().padStart(2, '0')}`;

    trades.push({
      id: `trd-${i}-${Date.now()}`,
      price,
      amount,
      time,
      type: isBuy ? 'buy' : 'sell'
    });
  }

  return trades;
}

export const MINING_PLANS: MiningPlan[] = [
  {
    id: 'mining-1d',
    name: '1-Day Express Cloud Rig',
    durationDays: 1,
    minDeposit: 1000,
    rewardRate: 0.01,
    dailyReturnPct: 1.0,
    totalReturnPct: 1.0,
    hashrateStr: '25 TH/s',
    algorithm: 'SHA-256 (BTC)',
    poolName: 'Prism Rapid Pool',
    tag: 'Starter',
    description: '1 day contract: 1,000 minimum deposit yielding a 0.01 return rate (1.0% daily payout).'
  },
  {
    id: 'mining-5d',
    name: '5-Day Velocity Cluster',
    durationDays: 5,
    minDeposit: 10000,
    rewardRate: 0.05,
    dailyReturnPct: 1.0,
    totalReturnPct: 5.0,
    hashrateStr: '320 TH/s',
    algorithm: 'SHA-256 (BTC)',
    poolName: 'Foundry Prism Sub-Pool',
    tag: 'Popular',
    description: '5 days contract: 10,000 minimum deposit yielding a 0.05 return rate (5.0% cumulative payout).'
  },
  {
    id: 'mining-30d',
    name: '30-Day Institutional Rig',
    durationDays: 30,
    minDeposit: 100000,
    rewardRate: 0.08,
    dailyReturnPct: 0.267,
    totalReturnPct: 8.0,
    hashrateStr: '3.8 PH/s',
    algorithm: 'SHA-256 (BTC)',
    poolName: 'F2Pool Prism Tier-1',
    tag: 'Growth',
    description: '30 days contract: 100,000 minimum deposit yielding a 0.08 return rate (8.0% cumulative payout).'
  },
  {
    id: 'mining-60d',
    name: '60-Day ASIC Immersion Farm',
    durationDays: 60,
    minDeposit: 300000,
    rewardRate: 0.10,
    dailyReturnPct: 0.167,
    totalReturnPct: 10.0,
    hashrateStr: '14.5 PH/s',
    algorithm: 'SHA-256 (BTC)',
    poolName: 'Binance Pool Prism Cluster',
    tag: 'Institutional',
    description: '60 days contract: 300,000 minimum deposit yielding a 0.10 return rate (10.0% cumulative payout).'
  },
  {
    id: 'mining-90d',
    name: '90-Day Genesis VIP Vault',
    durationDays: 90,
    minDeposit: 500000,
    rewardRate: 0.15,
    dailyReturnPct: 0.167,
    totalReturnPct: 15.0,
    hashrateStr: '28.0 PH/s',
    algorithm: 'SHA-256 (BTC)',
    poolName: 'Prism Genesis Hydro Farm',
    tag: 'Genesis VIP',
    description: '90 days contract: 500,000 minimum deposit yielding a 0.15 return rate (15.0% maximum VIP yield).'
  }
];

export const INITIAL_MINING_CONTRACTS: ActiveMiningContract[] = [
  {
    id: 'mine-001',
    planId: 'mining-5d',
    planName: '5-Day Velocity Cluster',
    durationDays: 5,
    amount: 10000,
    rewardRate: 0.05,
    totalExpectedProfit: 500,
    claimedProfit: 200,
    startDate: '2026-09-04',
    endDate: '2026-09-09',
    startTime: Date.now() - 2 * 86400000,
    endTime: Date.now() + 3 * 86400000,
    status: 'mining',
    hashrateStr: '320 TH/s',
    dailyYieldUsdt: 100
  }
];

export const INITIAL_ORDER_HISTORY: CompletedSpotTrade[] = [
  {
    id: 'trd-1001',
    orderId: 'ord-982',
    pair: 'BTC/USDT',
    asset: 'BTC',
    side: 'buy',
    orderType: 'market',
    price: 89450.00,
    amount: 0.1200,
    totalValue: 10734.00,
    fee: 2.1468,
    feeAsset: 'USDT',
    status: 'filled',
    timestamp: '2026-09-04 20:15:32',
    rawTimestamp: Date.now() - 144000000,
    txHash: '0x3e1da89c...9f12'
  },
  {
    id: 'trd-1002',
    orderId: 'ord-981',
    pair: 'ETH/USDT',
    asset: 'ETH',
    side: 'sell',
    orderType: 'limit',
    price: 3340.50,
    amount: 1.5000,
    totalValue: 5010.75,
    fee: 1.0021,
    feeAsset: 'USDT',
    status: 'filled',
    timestamp: '2026-09-03 16:42:10',
    rawTimestamp: Date.now() - 230000000,
    txHash: '0x88f219ac...44c1'
  },
  {
    id: 'trd-1003',
    orderId: 'ord-979',
    pair: 'SOL/USDT',
    asset: 'SOL',
    side: 'buy',
    orderType: 'market',
    price: 192.40,
    amount: 15.0000,
    totalValue: 2886.00,
    fee: 0.5772,
    feeAsset: 'USDT',
    status: 'filled',
    timestamp: '2026-09-02 11:28:45',
    rawTimestamp: Date.now() - 316000000,
    txHash: '0x491ba63e...09da'
  },
  {
    id: 'trd-1004',
    orderId: 'ord-974',
    pair: 'LINK/USDT',
    asset: 'LINK',
    side: 'buy',
    orderType: 'limit',
    price: 18.25,
    amount: 100.0000,
    totalValue: 1825.00,
    fee: 0.3650,
    feeAsset: 'USDT',
    status: 'filled',
    timestamp: '2026-09-01 09:14:02',
    rawTimestamp: Date.now() - 402000000,
    txHash: '0x17c093aa...12eb'
  },
  {
    id: 'trd-1005',
    orderId: 'ord-968',
    pair: 'AVAX/USDT',
    asset: 'AVAX',
    side: 'buy',
    orderType: 'limit',
    price: 28.50,
    amount: 50.0000,
    totalValue: 1425.00,
    fee: 0.00,
    feeAsset: 'USDT',
    status: 'canceled',
    timestamp: '2026-08-30 14:05:18',
    rawTimestamp: Date.now() - 570000000,
    txHash: '0x00000000...cancelled'
  },
  {
    id: 'trd-1006',
    orderId: 'ord-961',
    pair: 'NEAR/USDT',
    asset: 'NEAR',
    side: 'sell',
    orderType: 'market',
    price: 4.85,
    amount: 400.0000,
    totalValue: 1940.00,
    fee: 0.3880,
    feeAsset: 'USDT',
    status: 'filled',
    timestamp: '2026-08-28 17:50:22',
    rawTimestamp: Date.now() - 734000000,
    txHash: '0x992cb410...ff42'
  }
];
