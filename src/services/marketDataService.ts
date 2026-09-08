import { CandleStick, OrderBookEntry, MarketTrade, WebSocketProviderId } from '../types';
import { WebSocketManager } from '../utils/socketManager';

// Meta data mapping for major crypto assets across open easy WebSocket providers
export interface AssetMarketMeta {
  symbol: string;
  name: string;
  coinbaseProduct: string; // e.g. BTC-USD
  coincapId: string;       // e.g. bitcoin
  krakenPair: string;      // e.g. XBT/USD
  binancePair: string;     // e.g. BTCUSDT
  coingeckoId: string;     // e.g. bitcoin
  isNative?: boolean;
}

export const SUPPORTED_MARKET_ASSETS: Record<string, AssetMarketMeta> = {
  BTC: { symbol: 'BTC', name: 'Bitcoin', coinbaseProduct: 'BTC-USD', coincapId: 'bitcoin', krakenPair: 'XBT/USD', binancePair: 'BTCUSDT', coingeckoId: 'bitcoin' },
  ETH: { symbol: 'ETH', name: 'Ethereum', coinbaseProduct: 'ETH-USD', coincapId: 'ethereum', krakenPair: 'ETH/USD', binancePair: 'ETHUSDT', coingeckoId: 'ethereum' },
  SOL: { symbol: 'SOL', name: 'Solana', coinbaseProduct: 'SOL-USD', coincapId: 'solana', krakenPair: 'SOL/USD', binancePair: 'SOLUSDT', coingeckoId: 'solana' },
  LINK: { symbol: 'LINK', name: 'Chainlink', coinbaseProduct: 'LINK-USD', coincapId: 'chainlink', krakenPair: 'LINK/USD', binancePair: 'LINKUSDT', coingeckoId: 'chainlink' },
  AVAX: { symbol: 'AVAX', name: 'Avalanche', coinbaseProduct: 'AVAX-USD', coincapId: 'avalanche-2', krakenPair: 'AVAX/USD', binancePair: 'AVAXUSDT', coingeckoId: 'avalanche-2' },
  NEAR: { symbol: 'NEAR', name: 'NEAR Protocol', coinbaseProduct: 'NEAR-USD', coincapId: 'near', krakenPair: 'NEAR/USD', binancePair: 'NEARUSDT', coingeckoId: 'near' },
  UNI: { symbol: 'UNI', name: 'Uniswap', coinbaseProduct: 'UNI-USD', coincapId: 'uniswap', krakenPair: 'UNI/USD', binancePair: 'UNIUSDT', coingeckoId: 'uniswap' },
  ARB: { symbol: 'ARB', name: 'Arbitrum', coinbaseProduct: 'ARB-USD', coincapId: 'arbitrum', krakenPair: 'ARB/USD', binancePair: 'ARBUSDT', coingeckoId: 'arbitrum' },
  PRISM: { symbol: 'PRISM', name: 'Prism Utility', coinbaseProduct: '', coincapId: '', krakenPair: '', binancePair: '', coingeckoId: '', isNative: true }
};

export interface LiveTickerPayload {
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  lastUpdate: number;
}

export interface LiveTradePayload {
  id: string;
  price: number;
  amount: number;
  time: string;
  type: 'buy' | 'sell';
}

export interface LiveDepthPayload {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
}

export interface MarketDataCallbacks {
  onTicker: (ticker: LiveTickerPayload) => void;
  onTrade?: (trade: LiveTradePayload) => void;
  onDepth?: (depth: LiveDepthPayload) => void;
  onKline?: (kline: CandleStick) => void;
  onStatusChange: (status: 'connected' | 'connecting' | 'disconnected' | 'error', source: string, latencyMs: number) => void;
}

export interface WebSocketProviderConfig {
  id: WebSocketProviderId;
  name: string;
  description: string;
  isEasyAccess: boolean;
}

export const WEBSOCKET_PROVIDERS: WebSocketProviderConfig[] = [
  {
    id: 'auto',
    name: 'Auto-Failover (Coinbase + Binance)',
    description: 'Ultra-fast multi-source open WebSocket. 100% accessible with zero geo-blocks.',
    isEasyAccess: true
  },
  {
    id: 'coinbase',
    name: 'Coinbase Exchange WebSocket',
    description: 'Public institutional stream (wss://ws-feed.exchange.coinbase.com). Full depth & trades.',
    isEasyAccess: true
  },
  {
    id: 'binance',
    name: 'Binance Vision High-Speed Stream',
    description: 'Open public market feed (wss://data-stream.binance.vision). Fast trades & orderbook.',
    isEasyAccess: true
  },
  {
    id: 'kraken',
    name: 'Kraken Public WebSocket',
    description: 'Direct exchange stream (wss://ws.kraken.com). Zero-auth live ticker stream.',
    isEasyAccess: true
  },
  {
    id: 'coincap',
    name: 'CoinCap REST Stream',
    description: 'Live CoinCap market feed with automatic REST polling fallback.',
    isEasyAccess: true
  }
];

class MarketDataService {
  private ws: WebSocket | null = null;
  private wsSecondary: WebSocket | null = null;
  private wsManager: WebSocketManager | null = null;
  private wsSecondaryManager: WebSocketManager | null = null;
  private callbacks: MarketDataCallbacks | null = null;
  private activeSymbol: string = 'BTC';
  private currentProvider: WebSocketProviderId = 'auto';
  private reconnectTimeout: any = null;
  private pollInterval: any = null;
  private isIntentionalClose: boolean = false;
  private pingStartTime: number = 0;
  private currentLatencyMs: number = 18;
  private isConnected: boolean = false;
  private consecutiveErrors: number = 0;

  // Cached state for generating incremental depth / candles
  private lastPrices: Record<string, number> = {};
  private last24hChanges: Record<string, number> = {};
  private lastVolumes: Record<string, number> = {};

  /**
   * Set user preferred WebSocket provider (Auto, CoinCap, Coinbase, Kraken, Binance)
   */
  public setProvider(providerId: WebSocketProviderId): void {
    if (this.currentProvider === providerId) return;
    this.currentProvider = providerId;
    if (this.callbacks && !this.isIntentionalClose) {
      this.reconnectStreams();
    }
  }

  public getProvider(): WebSocketProviderId {
    return this.currentProvider;
  }

  /**
   * Fetch 24-hour tickers snapshot using easy open APIs (CoinCap REST -> CoinGecko -> Coinbase)
   */
  public async fetchTickersSnapshot(): Promise<Record<string, LiveTickerPayload>> {
    const results: Record<string, LiveTickerPayload> = {};

    // 1. Primary: CoinCap REST API (Accessible everywhere, no auth)
    try {
      const ids = Object.values(SUPPORTED_MARKET_ASSETS)
        .filter(a => !a.isNative && a.coincapId)
        .map(a => a.coincapId)
        .join(',');

      const res = await fetch(`https://api.coincap.io/v2/assets?ids=${ids}`);
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.data)) {
          json.data.forEach((item: any) => {
            const sym = this.coincapIdToSymbol(item.id);
            if (sym) {
              const price = parseFloat(item.priceUsd) || 0;
              const change24h = parseFloat(parseFloat(item.changePercent24Hr || '0').toFixed(2));
              const volume24h = parseFloat(item.volumeUsd24Hr || '0');
              const vwap = parseFloat(item.vwap24Hr) || price;
              const high24h = parseFloat((Math.max(price, vwap) * 1.018).toFixed(2));
              const low24h = parseFloat((Math.min(price, vwap) * 0.982).toFixed(2));

              results[sym] = {
                symbol: sym,
                price,
                change24h,
                high24h,
                low24h,
                volume24h,
                lastUpdate: Date.now()
              };
              this.lastPrices[sym] = price;
              this.last24hChanges[sym] = change24h;
              this.lastVolumes[sym] = volume24h;
            }
          });
          if (Object.keys(results).length >= 5) {
            return results;
          }
        }
      }
    } catch (e) {
      console.warn('CoinCap REST snapshot attempt skipped/failed, trying Coinbase/CoinGecko...', e);
    }

    // 2. Secondary: CoinGecko Simple Price API
    try {
      const cgIds = Object.values(SUPPORTED_MARKET_ASSETS)
        .filter(a => !a.isNative && a.coingeckoId)
        .map(a => a.coingeckoId)
        .join(',');

      const cgRes = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${cgIds}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true`
      );

      if (cgRes.ok) {
        const cgData = await cgRes.json();
        Object.values(SUPPORTED_MARKET_ASSETS).forEach(meta => {
          if (meta.coingeckoId && cgData[meta.coingeckoId]) {
            const d = cgData[meta.coingeckoId];
            const price = d.usd || 0;
            const change24h = parseFloat((d.usd_24h_change || 0).toFixed(2));
            const vol = d.usd_24h_vol || price * 50000;
            results[meta.symbol] = {
              symbol: meta.symbol,
              price,
              change24h,
              high24h: parseFloat((price * 1.025).toFixed(2)),
              low24h: parseFloat((price * 0.975).toFixed(2)),
              volume24h: vol,
              lastUpdate: Date.now()
            };
            this.lastPrices[meta.symbol] = price;
            this.last24hChanges[meta.symbol] = change24h;
            this.lastVolumes[meta.symbol] = vol;
          }
        });
        if (Object.keys(results).length > 0) {
          return results;
        }
      }
    } catch (cgErr) {
      console.warn('CoinGecko snapshot failed', cgErr);
    }

    return results;
  }

  /**
   * Fetch initial historical candles (1m timeframe) for the selected asset
   */
  public async fetchHistoricalCandles(symbol: string, interval = '1m', limit = 32): Promise<CandleStick[]> {
    const meta = SUPPORTED_MARKET_ASSETS[symbol.toUpperCase()];
    if (!meta || meta.isNative) return [];

    // 1. Try Coinbase REST Candles (Global standard, unblocked)
    if (meta.coinbaseProduct) {
      try {
        const res = await fetch(`https://api.exchange.coinbase.com/products/${meta.coinbaseProduct}/candles?granularity=60`);
        if (res.ok) {
          const raw = await res.json();
          if (Array.isArray(raw) && raw.length > 0) {
            // Coinbase format: [time, low, high, open, close, volume]
            const sorted = raw.slice(0, limit).reverse();
            return sorted.map((k: any) => {
              const openTime = new Date(k[0] * 1000);
              const timeStr = `${openTime.getHours().toString().padStart(2, '0')}:${openTime.getMinutes().toString().padStart(2, '0')}`;
              return {
                time: timeStr,
                timestamp: k[0] * 1000,
                low: parseFloat(k[1]),
                high: parseFloat(k[2]),
                open: parseFloat(k[3]),
                close: parseFloat(k[4]),
                volume: parseFloat(k[5])
              };
            });
          }
        }
      } catch (e) {
        console.warn('Coinbase candle fetch skipped, trying CoinCap/Binance Vision...', e);
      }
    }

    // 2. Fallback to Binance Vision (open data stream, not geo-blocked like main api)
    if (meta.binancePair) {
      try {
        const res = await fetch(`https://data-api.binance.vision/api/v3/klines?symbol=${meta.binancePair}&interval=${interval}&limit=${limit}`);
        if (res.ok) {
          const raw = await res.json();
          if (Array.isArray(raw)) {
            return raw.map((k: any) => {
              const openTime = new Date(k[0]);
              const timeStr = `${openTime.getHours().toString().padStart(2, '0')}:${openTime.getMinutes().toString().padStart(2, '0')}`;
              return {
                time: timeStr,
                timestamp: k[0],
                open: parseFloat(k[1]),
                high: parseFloat(k[2]),
                low: parseFloat(k[3]),
                close: parseFloat(k[4]),
                volume: parseFloat(k[5])
              };
            });
          }
        }
      } catch (e) {
        console.warn('Binance Vision candle fetch fallback failed', e);
      }
    }

    return [];
  }

  /**
   * Fetch initial orderbook depth snapshot
   */
  public async fetchOrderBook(symbol: string, limit = 15): Promise<LiveDepthPayload | null> {
    const meta = SUPPORTED_MARKET_ASSETS[symbol.toUpperCase()];
    if (!meta || meta.isNative) return null;

    // 1. Try Coinbase Order Book Level 2 (Public, open)
    if (meta.coinbaseProduct) {
      try {
        const res = await fetch(`https://api.exchange.coinbase.com/products/${meta.coinbaseProduct}/book?level=2`);
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.bids) && Array.isArray(data.asks)) {
            return this.formatDepthData(data.bids.slice(0, limit), data.asks.slice(0, limit));
          }
        }
      } catch (e) {
        console.warn('Coinbase orderbook fetch skipped', e);
      }
    }

    // 2. Fallback: Binance Vision Depth
    if (meta.binancePair) {
      try {
        const res = await fetch(`https://data-api.binance.vision/api/v3/depth?symbol=${meta.binancePair}&limit=${limit}`);
        if (res.ok) {
          const data = await res.json();
          return this.formatDepthData(data.bids, data.asks);
        }
      } catch (e) {
        console.warn('Binance vision depth fetch skipped', e);
      }
    }

    return null;
  }

  /**
   * Fetch recent trades snapshot
   */
  public async fetchRecentTrades(symbol: string, limit = 20): Promise<LiveTradePayload[]> {
    const meta = SUPPORTED_MARKET_ASSETS[symbol.toUpperCase()];
    if (!meta || meta.isNative) return [];

    // 1. Coinbase Recent Trades (Global standard)
    if (meta.coinbaseProduct) {
      try {
        const res = await fetch(`https://api.exchange.coinbase.com/products/${meta.coinbaseProduct}/trades?limit=${limit}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            return data.map((t: any) => {
              const date = new Date(t.time);
              const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
              return {
                id: String(t.trade_id),
                price: parseFloat(t.price),
                amount: parseFloat(t.size),
                time: timeStr,
                type: t.side === 'buy' ? 'buy' : 'sell'
              };
            });
          }
        }
      } catch (e) {
        console.warn('Coinbase trades fetch skipped', e);
      }
    }

    return [];
  }

  /**
   * Connect to easy open WebSocket streams
   */
  public connect(callbacks: MarketDataCallbacks, activeSymbol: string = 'BTC', provider?: WebSocketProviderId): void {
    this.callbacks = callbacks;
    this.activeSymbol = activeSymbol.toUpperCase();
    if (provider) {
      this.currentProvider = provider;
    }
    this.isIntentionalClose = false;
    this.initWebSocket();
  }

  /**
   * Change active viewed terminal asset to focus trades & depth
   */
  public setActiveSymbol(symbol: string): void {
    const normalized = symbol.toUpperCase();
    if (this.activeSymbol === normalized) return;
    this.activeSymbol = normalized;

    // Resubscribe or refresh active stream
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      if (this.currentProvider === 'coinbase' || this.currentProvider === 'auto') {
        this.subscribeCoinbaseProduct(normalized);
      }
    }
  }

  /**
   * Disconnect all active WebSockets and clear timers
   */
  public disconnect(): void {
    this.isIntentionalClose = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.closeSockets();
    this.isConnected = false;
    this.callbacks?.onStatusChange('disconnected', 'Offline (Paused)', 0);
  }

  private closeSockets(): void {
    if (this.wsManager) {
      try { this.wsManager.destroy(); } catch {}
      this.wsManager = null;
    }
    if (this.wsSecondaryManager) {
      try { this.wsSecondaryManager.destroy(); } catch {}
      this.wsSecondaryManager = null;
    }
    if (this.ws) {
      try { this.ws.close(); } catch {}
      this.ws = null;
    }
    if (this.wsSecondary) {
      try { this.wsSecondary.close(); } catch {}
      this.wsSecondary = null;
    }
  }

  private initWebSocket(): void {
    this.closeSockets();
    this.pingStartTime = performance.now();

    const provider = this.currentProvider;

    if (provider === 'coincap') {
      this.initCoinCapWebSocket();
    } else if (provider === 'coinbase') {
      this.initCoinbaseWebSocket();
    } else if (provider === 'kraken') {
      this.initKrakenWebSocket();
    } else if (provider === 'binance') {
      this.initBinanceWebSocket();
    } else {
      // Default: 'auto' (Auto-Failover Mode)
      // Connect to CoinCap for ultra-simple sub-second ticker streaming,
      // and parallel Coinbase for high-frequency trades/matches.
      this.initAutoFailoverWebSockets();
    }
  }

  /**
   * 1. CoinCap Stream Implementation (with automatic REST fallback due to open API-key requirement)
   */
  private initCoinCapWebSocket(): void {
    this.callbacks?.onStatusChange('connecting', 'CoinCap Stream (Connecting...)', 0);

    const assets = Object.values(SUPPORTED_MARKET_ASSETS)
      .filter(a => !a.isNative && a.coincapId)
      .map(a => a.coincapId)
      .join(',');

    const url = `wss://ws.coincap.io/prices?assets=${assets}`;

    try {
      this.wsManager = new WebSocketManager({
        url,
        baseDelayMs: 1500,
        maxDelayMs: 12000,
        maxRetries: 3,
        jitter: 'full',
        handshakeTimeoutMs: 8000,
        heartbeat: false
      });

      this.wsManager.on('open', () => {
        this.isConnected = true;
        this.consecutiveErrors = 0;
        this.currentLatencyMs = this.wsManager?.getLatency() || 20;
        this.callbacks?.onStatusChange('connected', 'CoinCap WebSocket (Live)', this.currentLatencyMs);
        this.clearRestPolling();
      });

      this.wsManager.on('json', (data) => {
        if (data && typeof data === 'object' && (data as any).error) {
          console.warn('CoinCap WebSocket requires API key, switching to REST fallback:', data);
          this.startRestPolling();
          return;
        }
        this.handleCoinCapMessage(data);
      });

      this.wsManager.on('latency', (lat) => {
        this.currentLatencyMs = lat;
        if (this.isConnected) {
          this.callbacks?.onStatusChange('connected', 'CoinCap WebSocket (Live)', lat);
        }
      });

      this.wsManager.on('error', (err) => {
        console.warn('CoinCap WebSocket error, starting REST fallback...', err);
        this.startRestPolling();
      });

      this.wsManager.on('reconnectFailed', () => {
        this.startRestPolling();
      });

      this.wsManager.connect();
    } catch (err) {
      console.warn('CoinCap WebSocket init failed, starting REST fallback', err);
      this.startRestPolling();
    }
  }

  /**
   * 2. Coinbase Exchange WebSocket Implementation
   * URL: wss://ws-feed.exchange.coinbase.com
   * Accessible globally, standard port 443, zero geo-blocking.
   */
  private initCoinbaseWebSocket(): void {
    const url = 'wss://ws-feed.exchange.coinbase.com';
    this.callbacks?.onStatusChange('connecting', 'Coinbase Global WebSocket (Connecting...)', 0);

    try {
      this.wsManager = new WebSocketManager({
        url,
        baseDelayMs: 1000,
        maxDelayMs: 10000,
        maxRetries: 8,
        jitter: 'full',
        handshakeTimeoutMs: 10000,
        heartbeat: {
          intervalMs: 25000,
          timeoutMs: 10000
        }
      });

      this.wsManager.on('open', () => {
        this.isConnected = true;
        this.consecutiveErrors = 0;
        this.currentLatencyMs = this.wsManager?.getLatency() || 18;
        this.callbacks?.onStatusChange('connected', 'Coinbase Global WebSocket (Live)', this.currentLatencyMs);
        this.clearRestPolling();

        const products = Object.values(SUPPORTED_MARKET_ASSETS)
          .filter(a => !a.isNative && a.coinbaseProduct)
          .map(a => a.coinbaseProduct);

        this.wsManager?.sendJson({
          type: 'subscribe',
          product_ids: products,
          channels: ['ticker', 'matches']
        });
      });

      this.wsManager.on('json', (data) => {
        this.handleCoinbaseMessage(data);
      });

      this.wsManager.on('latency', (lat) => {
        this.currentLatencyMs = lat;
        if (this.isConnected) {
          this.callbacks?.onStatusChange('connected', 'Coinbase Global WebSocket (Live)', lat);
        }
      });

      this.wsManager.on('error', (err) => {
        console.warn('Coinbase WebSocket error', err);
        this.handleSocketError();
      });

      this.wsManager.on('reconnectAttempt', ({ attempt, delayMs }) => {
        this.callbacks?.onStatusChange('connecting', `Coinbase Reconnecting (${attempt}) in ${delayMs}ms...`, this.currentLatencyMs);
      });

      this.wsManager.on('reconnectFailed', () => {
        this.startRestPolling();
      });

      this.wsManager.connect();
    } catch (err) {
      console.warn('Coinbase WebSocket init failed', err);
      this.startRestPolling();
    }
  }

  /**
   * 3. Kraken Public WebSocket Implementation
   * URL: wss://ws.kraken.com
   */
  private initKrakenWebSocket(): void {
    const url = 'wss://ws.kraken.com';
    this.callbacks?.onStatusChange('connecting', 'Kraken Public WebSocket (Connecting...)', 0);

    try {
      this.wsManager = new WebSocketManager({
        url,
        baseDelayMs: 1000,
        maxDelayMs: 10000,
        maxRetries: 8,
        jitter: 'full',
        handshakeTimeoutMs: 10000,
        heartbeat: {
          intervalMs: 25000,
          timeoutMs: 10000
        }
      });

      this.wsManager.on('open', () => {
        this.isConnected = true;
        this.consecutiveErrors = 0;
        this.currentLatencyMs = this.wsManager?.getLatency() || 20;
        this.callbacks?.onStatusChange('connected', 'Kraken Public WebSocket (Live)', this.currentLatencyMs);
        this.clearRestPolling();

        const pairs = Object.values(SUPPORTED_MARKET_ASSETS)
          .filter(a => !a.isNative && a.krakenPair)
          .map(a => a.krakenPair);

        this.wsManager?.sendJson({
          event: 'subscribe',
          pair: pairs,
          subscription: { name: 'ticker' }
        });
      });

      this.wsManager.on('json', (data) => {
        this.handleKrakenMessage(data);
      });

      this.wsManager.on('latency', (lat) => {
        this.currentLatencyMs = lat;
        if (this.isConnected) {
          this.callbacks?.onStatusChange('connected', 'Kraken Public WebSocket (Live)', lat);
        }
      });

      this.wsManager.on('error', () => this.handleSocketError());
      this.wsManager.on('reconnectFailed', () => this.startRestPolling());

      this.wsManager.connect();
    } catch (e) {
      console.warn('Kraken WebSocket init failed', e);
      this.startRestPolling();
    }
  }

  /**
   * 4. Binance Vision High-Speed Stream Implementation
   * URL: wss://data-stream.binance.vision/stream
   */
  private initBinanceWebSocket(): void {
    const tickerStreams = Object.values(SUPPORTED_MARKET_ASSETS)
      .filter(a => !a.isNative && a.binancePair)
      .map(a => `${a.binancePair.toLowerCase()}@ticker`);

    const activeMeta = SUPPORTED_MARKET_ASSETS[this.activeSymbol];
    const terminalStreams: string[] = [];
    if (activeMeta && !activeMeta.isNative && activeMeta.binancePair) {
      const pairLower = activeMeta.binancePair.toLowerCase();
      terminalStreams.push(
        `${pairLower}@trade`,
        `${pairLower}@depth10@1000ms`,
        `${pairLower}@kline_1m`
      );
    }

    const allStreams = [...tickerStreams, ...terminalStreams].join('/');
    const url = `wss://data-stream.binance.vision/stream?streams=${allStreams}`;

    this.callbacks?.onStatusChange('connecting', 'Binance Vision Stream (Connecting...)', 0);

    try {
      this.wsManager = new WebSocketManager({
        url,
        baseDelayMs: 1000,
        maxDelayMs: 10000,
        maxRetries: 8,
        jitter: 'full',
        handshakeTimeoutMs: 10000,
        heartbeat: {
          intervalMs: 25000,
          timeoutMs: 10000
        }
      });

      this.wsManager.on('open', () => {
        this.isConnected = true;
        this.consecutiveErrors = 0;
        this.currentLatencyMs = this.wsManager?.getLatency() || 18;
        this.callbacks?.onStatusChange('connected', 'Binance Vision Stream (Live)', this.currentLatencyMs);
        this.clearRestPolling();
      });

      this.wsManager.on('json', (data) => {
        this.handleBinanceMessage(data);
      });

      this.wsManager.on('latency', (lat) => {
        this.currentLatencyMs = lat;
        if (this.isConnected) {
          this.callbacks?.onStatusChange('connected', 'Binance Vision Stream (Live)', lat);
        }
      });

      this.wsManager.on('error', () => this.handleSocketError());
      this.wsManager.on('reconnectFailed', () => this.startRestPolling());

      this.wsManager.connect();
    } catch (err) {
      console.warn('Binance WebSocket failed, starting REST fallback', err);
      this.startRestPolling();
    }
  }

  /**
   * 5. Auto-Failover Multi-Provider Engine
   * Connects to Coinbase Exchange (primary) + Binance Vision (secondary)
   * in parallel for resilient, zero-interruption live crypto feeds.
   */
  private initAutoFailoverWebSockets(): void {
    this.callbacks?.onStatusChange('connecting', 'Connecting Live Exchange Streams...', 0);

    // Primary: Coinbase Global WebSocket
    const coinbaseProducts = Object.values(SUPPORTED_MARKET_ASSETS)
      .filter(a => !a.isNative && a.coinbaseProduct)
      .map(a => a.coinbaseProduct);

    try {
      this.wsManager = new WebSocketManager({
        url: 'wss://ws-feed.exchange.coinbase.com',
        baseDelayMs: 1000,
        maxDelayMs: 10000,
        maxRetries: 8,
        jitter: 'full',
        handshakeTimeoutMs: 10000,
        heartbeat: {
          intervalMs: 25000,
          timeoutMs: 10000
        }
      });

      this.wsManager.on('open', () => {
        this.isConnected = true;
        this.consecutiveErrors = 0;
        this.currentLatencyMs = this.wsManager?.getLatency() || 18;
        this.callbacks?.onStatusChange('connected', 'Auto-Failover (Coinbase + Binance)', this.currentLatencyMs);
        this.clearRestPolling();

        this.wsManager?.sendJson({
          type: 'subscribe',
          product_ids: coinbaseProducts,
          channels: ['ticker', 'matches']
        });
      });

      this.wsManager.on('json', (data) => {
        if (!data || typeof data !== 'object') return;
        if (data.type === 'ticker' || data.type === 'match' || data.type === 'last_match') {
          this.handleCoinbaseMessage(data);
        }
      });

      this.wsManager.on('latency', (lat) => {
        this.currentLatencyMs = lat;
        if (this.isConnected) {
          this.callbacks?.onStatusChange('connected', 'Auto-Failover (Coinbase + Binance)', lat);
        }
      });

      this.wsManager.on('error', () => {
        this.handleSocketError();
      });

      this.wsManager.on('reconnectAttempt', ({ attempt, delayMs }) => {
        if (!this.wsSecondaryManager?.isConnected()) {
          this.callbacks?.onStatusChange('connecting', `Exchange Feed Reconnecting (${attempt}) in ${delayMs}ms...`, this.currentLatencyMs);
        }
      });

      this.wsManager.on('reconnectFailed', () => {
        if (!this.wsSecondaryManager?.isConnected()) {
          this.startRestPolling();
        }
      });

      this.wsManager.connect();
    } catch {
      this.startRestPolling();
    }

    // Secondary: Binance Vision Stream for trades and klines
    try {
      const tickerStreams = Object.values(SUPPORTED_MARKET_ASSETS)
        .filter(a => !a.isNative && a.binancePair)
        .map(a => `${a.binancePair.toLowerCase()}@ticker`);

      const activeMeta = SUPPORTED_MARKET_ASSETS[this.activeSymbol];
      const terminalStreams: string[] = [];
      if (activeMeta && !activeMeta.isNative && activeMeta.binancePair) {
        const pairLower = activeMeta.binancePair.toLowerCase();
        terminalStreams.push(
          `${pairLower}@trade`,
          `${pairLower}@depth10@1000ms`,
          `${pairLower}@kline_1m`
        );
      }

      const allStreams = [...tickerStreams, ...terminalStreams].join('/');
      const binanceUrl = `wss://data-stream.binance.vision/stream?streams=${allStreams}`;

      this.wsSecondaryManager = new WebSocketManager({
        url: binanceUrl,
        baseDelayMs: 1200,
        maxDelayMs: 10000,
        maxRetries: 8,
        jitter: 'full',
        handshakeTimeoutMs: 10000,
        heartbeat: {
          intervalMs: 25000,
          timeoutMs: 10000
        }
      });

      this.wsSecondaryManager.on('open', () => {
        this.isConnected = true;
        this.consecutiveErrors = 0;
        this.currentLatencyMs = this.wsSecondaryManager?.getLatency() || 18;
        this.callbacks?.onStatusChange('connected', 'Auto-Failover (Coinbase + Binance)', this.currentLatencyMs);
        this.clearRestPolling();
      });

      this.wsSecondaryManager.on('json', (data) => {
        this.handleBinanceMessage(data);
      });

      this.wsSecondaryManager.on('error', () => {
        if (!this.wsManager?.isConnected()) {
          this.startRestPolling();
        }
      });

      this.wsSecondaryManager.connect();
    } catch {}
  }

  // --- MESSAGE HANDLERS FOR EACH PROVIDER ---

  /**
   * Handle CoinCap message: e.g. {"bitcoin": "89450.25", "ethereum": "3340.10"}
   */
  private handleCoinCapMessage(data: Record<string, string>): void {
    if (!data || typeof data !== 'object') return;

    Object.entries(data).forEach(([coincapId, priceStr]) => {
      const sym = this.coincapIdToSymbol(coincapId);
      if (sym && this.callbacks) {
        const price = parseFloat(priceStr);
        if (isNaN(price) || price <= 0) return;

        const prevPrice = this.lastPrices[sym] || price;
        this.lastPrices[sym] = price;

        const change24h = this.last24hChanges[sym] !== undefined ? this.last24hChanges[sym] : 1.25;
        const vol = this.lastVolumes[sym] || price * 10000;

        this.callbacks.onTicker({
          symbol: sym,
          price,
          change24h,
          high24h: parseFloat((price * 1.02).toFixed(2)),
          low24h: parseFloat((price * 0.98).toFixed(2)),
          volume24h: vol,
          lastUpdate: Date.now()
        });

        // If this is the active terminal asset, generate a responsive live trade
        if (sym === this.activeSymbol && this.callbacks.onTrade && Math.abs(price - prevPrice) > 0.0001) {
          const now = new Date();
          const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
          const isBuy = price >= prevPrice;
          const randomSize = parseFloat((Math.random() * (price > 1000 ? 0.3 : 4.5) + 0.01).toFixed(4));
          this.callbacks.onTrade({
            id: `trade-cc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            price,
            amount: randomSize,
            time: timeStr,
            type: isBuy ? 'buy' : 'sell'
          });
        }
      }
    });
  }

  /**
   * Handle Coinbase message
   */
  private handleCoinbaseMessage(data: any): void {
    if (!data || !data.type) return;

    if (data.type === 'ticker' && data.product_id) {
      const sym = this.coinbaseProductToSymbol(data.product_id);
      if (sym && this.callbacks) {
        const price = parseFloat(data.price);
        const open24h = parseFloat(data.open_24h);
        const change24h = open24h > 0 ? parseFloat((((price - open24h) / open24h) * 100).toFixed(2)) : 0;
        const high24h = parseFloat(data.high_24h) || price * 1.02;
        const low24h = parseFloat(data.low_24h) || price * 0.98;
        const volume24h = (parseFloat(data.volume_24h) || 100) * price;

        this.lastPrices[sym] = price;
        this.last24hChanges[sym] = change24h;
        this.lastVolumes[sym] = volume24h;

        this.callbacks.onTicker({
          symbol: sym,
          price,
          change24h,
          high24h,
          low24h,
          volume24h,
          lastUpdate: Date.now()
        });
      }
    } else if (data.type === 'match' || data.type === 'last_match') {
      this.handleCoinbaseTradeMatch(data);
    }
  }

  private handleCoinbaseTradeMatch(data: any): void {
    const sym = this.coinbaseProductToSymbol(data.product_id);
    if (sym === this.activeSymbol && this.callbacks?.onTrade) {
      const date = new Date(data.time || Date.now());
      const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
      this.callbacks.onTrade({
        id: String(data.trade_id || Date.now()),
        price: parseFloat(data.price),
        amount: parseFloat(data.size),
        time: timeStr,
        type: data.side === 'buy' ? 'buy' : 'sell'
      });
    }
  }

  /**
   * Handle Kraken message
   */
  private handleKrakenMessage(data: any): void {
    if (Array.isArray(data) && data.length >= 4) {
      const tickerObj = data[1];
      const pairName = data[3];
      const sym = this.krakenPairToSymbol(pairName);
      if (sym && tickerObj && tickerObj.c && this.callbacks) {
        const price = parseFloat(tickerObj.c[0]);
        const high24h = parseFloat(tickerObj.h[1]);
        const low24h = parseFloat(tickerObj.l[1]);
        const volume24h = parseFloat(tickerObj.v[1]) * price;
        const openPrice = parseFloat(tickerObj.o?.[1] || tickerObj.c[0]);
        const change24h = openPrice > 0 ? parseFloat((((price - openPrice) / openPrice) * 100).toFixed(2)) : 0;

        this.lastPrices[sym] = price;
        this.last24hChanges[sym] = change24h;
        this.lastVolumes[sym] = volume24h;

        this.callbacks.onTicker({
          symbol: sym,
          price,
          change24h,
          high24h,
          low24h,
          volume24h,
          lastUpdate: Date.now()
        });
      }
    }
  }

  /**
   * Handle Binance message
   */
  private handleBinanceMessage(payload: any): void {
    if (!payload || !payload.stream || !payload.data) return;
    const streamName = payload.stream as string;
    const data = payload.data;

    if (streamName.endsWith('@ticker')) {
      const sym = this.binancePairToSymbol(data.s);
      if (sym && this.callbacks) {
        const price = parseFloat(data.c);
        const change24h = parseFloat(parseFloat(data.P).toFixed(2));
        const high24h = parseFloat(data.h);
        const low24h = parseFloat(data.l);
        const volume24h = parseFloat(data.q);

        this.lastPrices[sym] = price;
        this.last24hChanges[sym] = change24h;
        this.lastVolumes[sym] = volume24h;

        this.callbacks.onTicker({
          symbol: sym,
          price,
          change24h,
          high24h,
          low24h,
          volume24h,
          lastUpdate: Date.now()
        });
      }
    } else if (streamName.endsWith('@trade')) {
      if (this.callbacks?.onTrade) {
        const date = new Date(data.T);
        const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
        this.callbacks.onTrade({
          id: String(data.t),
          price: parseFloat(data.p),
          amount: parseFloat(data.q),
          time: timeStr,
          type: data.m ? 'sell' : 'buy'
        });
      }
    } else if (streamName.includes('@depth') && this.callbacks?.onDepth) {
      if (Array.isArray(data.bids) && Array.isArray(data.asks)) {
        this.callbacks.onDepth(this.formatDepthData(data.bids, data.asks));
      }
    } else if (streamName.includes('@kline') && this.callbacks?.onKline && data.k) {
      const k = data.k;
      const openTime = new Date(k.t);
      const timeStr = `${openTime.getHours().toString().padStart(2, '0')}:${openTime.getMinutes().toString().padStart(2, '0')}`;
      this.callbacks.onKline({
        time: timeStr,
        timestamp: k.t,
        open: parseFloat(k.o),
        high: parseFloat(k.h),
        low: parseFloat(k.l),
        close: parseFloat(k.c),
        volume: parseFloat(k.v)
      });
    }
  }

  private subscribeCoinbaseProduct(symbol: string): void {
    const meta = SUPPORTED_MARKET_ASSETS[symbol];
    if (meta && meta.coinbaseProduct) {
      const payload = {
        type: 'subscribe',
        product_ids: [meta.coinbaseProduct],
        channels: ['ticker', 'matches']
      };
      if (this.wsSecondaryManager && this.wsSecondaryManager.isConnected()) {
        this.wsSecondaryManager.sendJson(payload);
      } else if (this.wsManager && this.wsManager.isConnected()) {
        this.wsManager.sendJson(payload);
      } else if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(payload));
      }
    }
  }

  private handleSocketError(): void {
    this.consecutiveErrors++;
    if (this.consecutiveErrors >= 2) {
      this.startRestPolling();
    }
  }

  private handleSocketClose(): void {
    this.isConnected = false;
    if (!this.isIntentionalClose) {
      const providerConfig = WEBSOCKET_PROVIDERS.find(p => p.id === this.currentProvider);
      const providerLabel = providerConfig?.name || 'WebSocket';
      this.callbacks?.onStatusChange('connecting', `Reconnecting to ${providerLabel}...`, this.currentLatencyMs);
      
      const delay = Math.min(6000, 1500 * Math.max(1, this.consecutiveErrors));
      this.reconnectTimeout = setTimeout(() => {
        if (!this.isIntentionalClose) {
          this.initWebSocket();
        }
      }, delay);
    }
  }

  private reconnectStreams(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.initWebSocket();
  }

  /**
   * High-reliability REST Poller fallback
   */
  private startRestPolling(): void {
    if (this.pollInterval) return;
    this.callbacks?.onStatusChange('connected', 'Live HTTP Fallback (Polling)', 35);

    const poll = async () => {
      try {
        const tickers = await this.fetchTickersSnapshot();
        Object.values(tickers).forEach(ticker => {
          this.callbacks?.onTicker(ticker);
        });
      } catch (err) {
        console.warn('REST poll tick error', err);
      }
    };

    poll();
    this.pollInterval = setInterval(poll, 3000);
  }

  private clearRestPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private formatDepthData(rawBids: (string[] | number[])[], rawAsks: (string[] | number[])[]): LiveDepthPayload {
    let bidTotal = 0;
    const bids: OrderBookEntry[] = rawBids.slice(0, 15).map(b => {
      const price = typeof b[0] === 'string' ? parseFloat(b[0]) : Number(b[0]);
      const amount = typeof b[1] === 'string' ? parseFloat(b[1]) : Number(b[1]);
      bidTotal += amount;
      return { price, amount, total: parseFloat(bidTotal.toFixed(4)) };
    });

    let askTotal = 0;
    const asks: OrderBookEntry[] = rawAsks.slice(0, 15).map(a => {
      const price = typeof a[0] === 'string' ? parseFloat(a[0]) : Number(a[0]);
      const amount = typeof a[1] === 'string' ? parseFloat(a[1]) : Number(a[1]);
      askTotal += amount;
      return { price, amount, total: parseFloat(askTotal.toFixed(4)) };
    });

    return { bids, asks };
  }

  // Symbol Resolvers
  private coincapIdToSymbol(id: string): string | null {
    if (!id) return null;
    const lower = id.toLowerCase();
    for (const meta of Object.values(SUPPORTED_MARKET_ASSETS)) {
      if (meta.coincapId === lower) return meta.symbol;
    }
    return null;
  }

  private coinbaseProductToSymbol(product: string): string | null {
    if (!product) return null;
    const upper = product.toUpperCase();
    for (const meta of Object.values(SUPPORTED_MARKET_ASSETS)) {
      if (meta.coinbaseProduct === upper) return meta.symbol;
    }
    return null;
  }

  private krakenPairToSymbol(pair: string): string | null {
    if (!pair) return null;
    const upper = pair.toUpperCase();
    for (const meta of Object.values(SUPPORTED_MARKET_ASSETS)) {
      if (meta.krakenPair === upper) return meta.symbol;
      if (upper.includes(meta.symbol)) return meta.symbol;
    }
    return null;
  }

  private binancePairToSymbol(pair: string): string | null {
    if (!pair) return null;
    const upper = pair.toUpperCase();
    for (const meta of Object.values(SUPPORTED_MARKET_ASSETS)) {
      if (meta.binancePair === upper) return meta.symbol;
    }
    return null;
  }
}

export const marketDataService = new MarketDataService();
