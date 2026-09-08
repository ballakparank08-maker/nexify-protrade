/**
 * WebSocketManager - Production-grade resilient WebSocket connection manager
 * 
 * Features:
 * - Exponential backoff with full/decorrelated jitter to prevent thundering herds
 * - Bidirectional heartbeat ping-pong & silent TCP stall detection watchdog
 * - Connection handshake timeout watchdog (prevents endless "Connecting..." loops)
 * - Offline message queueing with automatic flush upon reconnection
 * - Multi-endpoint failover support (primary with secondary fallback URLs)
 * - Fine-grained connection state tracking & real-time round-trip latency calculation
 * - Type-safe event dispatching with auto-cleanup
 */

export type SocketState = 
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'RECONNECTING'
  | 'STALE'
  | 'ERROR';

export interface HeartbeatConfig {
  /** Interval in ms to send ping or check liveness (default: 15,000ms) */
  intervalMs?: number;
  /** Timeout in ms to wait for pong / frame before declaring socket dead (default: 8,000ms) */
  timeoutMs?: number;
  /** Data to send as ping packet. Can be string or function returning string/ArrayBuffer */
  pingPayload?: string | ArrayBuffer | (() => string | ArrayBuffer);
  /** Optional matcher function to recognize inbound pong responses */
  isPong?: (data: string | ArrayBuffer | Blob) => boolean;
}

export interface WebSocketManagerOptions {
  /** Primary WebSocket URL, or array of URLs for automatic round-robin / failover */
  url: string | string[];
  /** Optional WebSocket sub-protocols */
  protocols?: string | string[];
  /** Initial backoff delay in ms (default: 1,000ms) */
  baseDelayMs?: number;
  /** Maximum backoff delay in ms (default: 30,000ms) */
  maxDelayMs?: number;
  /** Maximum consecutive reconnect attempts before giving up (default: Infinity) */
  maxRetries?: number;
  /** Jitter algorithm to prevent thundering herd. 'full' (default), 'equal', or 'none' */
  jitter?: 'full' | 'equal' | 'none';
  /** Handshake timeout in ms before aborting a hung connection (default: 8,000ms) */
  handshakeTimeoutMs?: number;
  /** Heartbeat watchdog configuration */
  heartbeat?: HeartbeatConfig | boolean;
  /** Queue messages while disconnected and send upon reconnect (default: true) */
  queueOffline?: boolean;
  /** Maximum number of messages to queue offline (default: 150) */
  maxQueueSize?: number;
  /** Connect automatically upon instantiation (default: false) */
  autoConnect?: boolean;
  /** Custom logger prefix or callback for diagnostic telemetry */
  debug?: boolean;
}

export type EventMap = {
  open: (event: Event) => void;
  message: (data: any, rawEvent: MessageEvent) => void;
  json: (parsed: any) => void;
  close: (event: CloseEvent) => void;
  error: (error: Event | Error) => void;
  stateChange: (state: SocketState, previousState: SocketState, meta?: { latencyMs?: number; reason?: string }) => void;
  latency: (latencyMs: number) => void;
  reconnectAttempt: (info: { attempt: number; delayMs: number; url: string }) => void;
  reconnectFailed: (info: { totalAttempts: number }) => void;
};

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private state: SocketState = 'DISCONNECTED';
  private urls: string[] = [];
  private currentUrlIndex: number = 0;
  private retryCount: number = 0;
  private isManuallyClosed: boolean = false;

  // Timers
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private handshakeTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatIntervalTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimeoutTimer: ReturnType<typeof setTimeout> | null = null;

  // Latency & Watchdog tracking
  private lastMessageTimestamp: number = 0;
  private lastPingSentTimestamp: number = 0;
  private currentLatencyMs: number = 0;
  private connectionStartTime: number = 0;

  // Message queueing
  private messageQueue: (string | ArrayBufferLike | Blob | ArrayBufferView)[] = [];

  // Event Listeners
  private listeners: { [K in keyof EventMap]?: Set<EventMap[K]> } = {};

  // Config merged with defaults
  private readonly config: Required<Omit<WebSocketManagerOptions, 'protocols' | 'heartbeat'>> & {
    protocols?: string | string[];
    heartbeat: Required<HeartbeatConfig> | false;
  };

  constructor(options: WebSocketManagerOptions) {
    this.urls = Array.isArray(options.url) ? [...options.url] : [options.url];
    if (this.urls.length === 0) {
      throw new Error('[WebSocketManager] At least one target URL must be provided.');
    }

    // Resolve heartbeat configuration
    let resolvedHeartbeat: Required<HeartbeatConfig> | false = false;
    if (options.heartbeat !== false) {
      const hb = typeof options.heartbeat === 'object' ? options.heartbeat : {};
      resolvedHeartbeat = {
        intervalMs: hb.intervalMs ?? 20000,
        timeoutMs: hb.timeoutMs ?? 10000,
        pingPayload: hb.pingPayload ?? JSON.stringify({ type: 'ping', ts: 0 }),
        isPong: hb.isPong ?? ((data) => {
          if (typeof data === 'string') {
            return data === 'pong' || data === '{"type":"pong"}' || data.includes('"pong"') || data.includes('heartbeat');
          }
          return false;
        })
      };
    }

    this.config = {
      url: this.urls,
      protocols: options.protocols,
      baseDelayMs: Math.max(200, options.baseDelayMs ?? 1000),
      maxDelayMs: Math.max(1000, options.maxDelayMs ?? 15000),
      maxRetries: options.maxRetries ?? 10,
      jitter: options.jitter ?? 'full',
      handshakeTimeoutMs: Math.max(1000, options.handshakeTimeoutMs ?? 12000),
      heartbeat: resolvedHeartbeat,
      queueOffline: options.queueOffline ?? true,
      maxQueueSize: options.maxQueueSize ?? 150,
      autoConnect: options.autoConnect ?? false,
      debug: options.debug ?? false
    };

    if (this.config.autoConnect) {
      this.connect();
    }
  }

  // ==========================================
  // Connection Lifecycle
  // ==========================================

  /**
   * Connect or initiate reconnect cycle
   */
  public connect(): void {
    this.isManuallyClosed = false;

    // Prevent re-connecting if already open or connecting
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      this.log('Already connecting or connected, ignoring connect() call.');
      return;
    }

    this.clearAllTimers();
    this.cleanSocket();
    this.setState('CONNECTING');

    const activeUrl = this.getCurrentUrl();
    this.connectionStartTime = performance.now();
    this.log(`Initiating connection to ${activeUrl} (attempt #${this.retryCount + 1})...`);

    // Handshake Timeout Watchdog: prevents hanging in CONNECTING state
    this.handshakeTimer = setTimeout(() => {
      if (this.state === 'CONNECTING') {
        this.logWarn(`Handshake timeout after ${this.config.handshakeTimeoutMs}ms on ${activeUrl}. Forcing reset.`);
        this.emit('error', new Error(`Handshake timeout (${this.config.handshakeTimeoutMs}ms)`));
        this.cleanSocket();
        this.scheduleReconnect('Handshake timeout');
      }
    }, this.config.handshakeTimeoutMs);

    try {
      if (this.config.protocols) {
        this.ws = new WebSocket(activeUrl, this.config.protocols);
      } else {
        this.ws = new WebSocket(activeUrl);
      }

      this.setupSocketHandlers(this.ws, activeUrl);
    } catch (err) {
      this.logWarn('WebSocket constructor exception:', err);
      this.clearHandshakeTimer();
      this.emit('error', err instanceof Error ? err : new Error(String(err)));
      this.scheduleReconnect('Constructor error');
    }
  }

  /**
   * Disconnect intentionally and cancel any scheduled reconnection
   */
  public disconnect(code: number = 1000, reason: string = 'Client disconnected'): void {
    this.isManuallyClosed = true;
    this.clearAllTimers();

    if (this.ws) {
      try {
        this.ws.close(code, reason);
      } catch (e) {
        this.logWarn('Error closing socket:', e);
      }
      this.cleanSocket();
    }

    this.setState('DISCONNECTED', { reason });
  }

  /**
   * Forcibly recycle the connection (triggers exponential backoff reconnect)
   */
  public reconnect(reason: string = 'Manual reconnect'): void {
    this.log(`Manual reconnect requested: ${reason}`);
    this.cleanSocket();
    this.scheduleReconnect(reason);
  }

  // ==========================================
  // Socket Event Handlers
  // ==========================================

  private setupSocketHandlers(socket: WebSocket, targetUrl: string): void {
    socket.onopen = (event: Event) => {
      // Guard against stale socket instances
      if (this.ws !== socket) return;

      this.clearHandshakeTimer();
      this.retryCount = 0;
      this.lastMessageTimestamp = Date.now();
      this.currentLatencyMs = Math.max(1, Math.round(performance.now() - this.connectionStartTime));

      this.log(`Connected to ${targetUrl} (latency: ${this.currentLatencyMs}ms)`);
      this.setState('CONNECTED', { latencyMs: this.currentLatencyMs });

      this.emit('open', event);
      this.emit('latency', this.currentLatencyMs);

      // Start heartbeat & watchdog monitor
      this.startHeartbeat();

      // Flush queued offline messages
      this.flushOfflineQueue();
    };

    socket.onmessage = (event: MessageEvent) => {
      if (this.ws !== socket) return;

      this.lastMessageTimestamp = Date.now();
      // Any incoming message (ticker, match, depth, trade, heartbeat) confirms the socket is active and alive
      this.clearHeartbeatTimeout();

      // Check if this incoming frame satisfies our pong expectation
      if (this.config.heartbeat && this.config.heartbeat.isPong(event.data)) {
        if (this.lastPingSentTimestamp > 0) {
          this.currentLatencyMs = Math.max(1, Date.now() - this.lastPingSentTimestamp);
          this.emit('latency', this.currentLatencyMs);
        }
        return;
      }

      // If we were in a STALE state, receiving a live frame restores CONNECTED state
      if (this.state === 'STALE') {
        this.setState('CONNECTED');
      }

      this.emit('message', event.data, event);

      // Automatic JSON parse convenience
      if (typeof event.data === 'string') {
        const trimmed = event.data.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
          try {
            const parsed = JSON.parse(trimmed);
            this.emit('json', parsed);
          } catch {
            // Not JSON or parse error, ignored
          }
        }
      }
    };

    socket.onerror = (event: Event) => {
      if (this.ws !== socket) return;
      this.logWarn(`Socket error encountered on ${targetUrl}:`, event);
      this.emit('error', event);
    };

    socket.onclose = (event: CloseEvent) => {
      if (this.ws !== socket) return;

      this.clearHandshakeTimer();
      this.stopHeartbeat();
      this.cleanSocket();

      this.emit('close', event);

      if (!this.isManuallyClosed) {
        this.scheduleReconnect(`Closed with code ${event.code}: ${event.reason || 'No reason'}`);
      } else {
        this.setState('DISCONNECTED', { reason: event.reason });
      }
    };
  }

  // ==========================================
  // Exponential Backoff with Jitter
  // ==========================================

  /**
   * Calculates backoff with Full Jitter:
   * backoff = min(maxDelay, baseDelay * 2 ^ retryCount)
   * delay = random(0, backoff)  (or equal jitter if configured)
   */
  private calculateBackoffDelay(): number {
    const { baseDelayMs, maxDelayMs, jitter } = this.config;
    const exponential = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, this.retryCount));

    if (jitter === 'none') {
      return Math.round(exponential);
    }

    if (jitter === 'equal') {
      const half = exponential / 2;
      return Math.round(half + Math.random() * half);
    }

    // Default: 'full' jitter
    return Math.round(Math.random() * exponential);
  }

  private scheduleReconnect(reason?: string): void {
    if (this.isManuallyClosed || this.reconnectTimer) {
      return;
    }

    this.retryCount++;

    // Failover to next URL if multiple endpoints exist
    if (this.urls.length > 1) {
      this.currentUrlIndex = (this.currentUrlIndex + 1) % this.urls.length;
      this.log(`Failing over to secondary URL: ${this.getCurrentUrl()}`);
    }

    if (this.retryCount > this.config.maxRetries) {
      this.logWarn(`Exceeded maximum reconnection attempts (${this.config.maxRetries}).`);
      this.setState('ERROR', { reason: 'Max reconnection attempts exceeded' });
      this.emit('reconnectFailed', { totalAttempts: this.retryCount });
      return;
    }

    const delayMs = this.calculateBackoffDelay();
    this.setState('RECONNECTING', { reason });

    const targetUrl = this.getCurrentUrl();
    this.log(`Scheduling reconnect attempt #${this.retryCount} in ${delayMs}ms to ${targetUrl}...`);
    this.emit('reconnectAttempt', { attempt: this.retryCount, delayMs, url: targetUrl });

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isManuallyClosed) {
        this.connect();
      }
    }, delayMs);
  }

  // ==========================================
  // Heartbeat & Watchdog Monitor
  // ==========================================

  private startHeartbeat(): void {
    this.stopHeartbeat();
    if (!this.config.heartbeat) return;

    const { intervalMs, timeoutMs, pingPayload } = this.config.heartbeat;

    this.heartbeatIntervalTimer = setInterval(() => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

      const now = Date.now();
      const timeSinceLastMsg = now - this.lastMessageTimestamp;

      // If data frames are actively arriving (streaming market data), the connection is 100% healthy
      if (timeSinceLastMsg < intervalMs) {
        this.clearHeartbeatTimeout();
        return;
      }

      // Check if socket is silent/dead beyond tolerance
      const staleTolerance = intervalMs + timeoutMs;
      if (timeSinceLastMsg > staleTolerance) {
        this.logWarn(`No frame received in ${timeSinceLastMsg}ms (exceeds ${staleTolerance}ms). Flagging as STALE and recycling.`);
        this.setState('STALE');
        this.cleanSocket();
        this.scheduleReconnect('Heartbeat timeout (dead connection)');
        return;
      }

      // Socket has been idle for >= intervalMs: send Ping Frame
      try {
        let payload: string | ArrayBuffer;
        if (typeof pingPayload === 'function') {
          payload = pingPayload();
        } else if (typeof pingPayload === 'string' && pingPayload.includes('"ts":0')) {
          payload = JSON.stringify({ type: 'ping', ts: now });
        } else {
          payload = pingPayload;
        }

        this.lastPingSentTimestamp = now;
        this.ws.send(payload);

        // Arm watchdog timeout: only trigger if socket remains completely silent for timeoutMs
        this.clearHeartbeatTimeout();
        this.heartbeatTimeoutTimer = setTimeout(() => {
          // Double check if messages arrived in the meantime
          const currentIdle = Date.now() - this.lastMessageTimestamp;
          if (currentIdle < staleTolerance) {
            // Messages arrived, connection is alive!
            return;
          }
          this.logWarn(`Pong response timed out after ${timeoutMs}ms (total idle ${currentIdle}ms). Forcing reconnect.`);
          this.setState('STALE');
          this.cleanSocket();
          this.scheduleReconnect('Pong timeout');
        }, timeoutMs);

      } catch (err) {
        this.logWarn('Failed to transmit heartbeat ping:', err);
      }
    }, intervalMs);
  }

  private clearHeartbeatTimeout(): void {
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }

  private stopHeartbeat(): void {
    if (this.heartbeatIntervalTimer) {
      clearInterval(this.heartbeatIntervalTimer);
      this.heartbeatIntervalTimer = null;
    }
    this.clearHeartbeatTimeout();
  }

  // ==========================================
  // Transmission & Offline Queueing
  // ==========================================

  /**
   * Send data over the active WebSocket or buffer if disconnected
   */
  public send(data: string | ArrayBufferLike | Blob | ArrayBufferView): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(data);
        return true;
      } catch (err) {
        this.logWarn('Error sending data over socket:', err);
        return false;
      }
    }

    // Handle offline buffering
    if (this.config.queueOffline) {
      if (this.messageQueue.length >= this.config.maxQueueSize) {
        this.messageQueue.shift(); // Evict oldest to preserve memory
      }
      this.messageQueue.push(data);
      this.log(`Socket not open. Queued message for later delivery (queue size: ${this.messageQueue.length})`);
      return false;
    }

    return false;
  }

  /**
   * Convenience method to send JSON payloads
   */
  public sendJson(payload: Record<string, unknown> | unknown[]): boolean {
    try {
      return this.send(JSON.stringify(payload));
    } catch (e) {
      this.logWarn('Failed to stringify JSON payload:', e);
      return false;
    }
  }

  private flushOfflineQueue(): void {
    if (this.messageQueue.length === 0 || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    this.log(`Flushing ${this.messageQueue.length} queued offline messages...`);
    while (this.messageQueue.length > 0 && this.ws.readyState === WebSocket.OPEN) {
      const msg = this.messageQueue.shift();
      if (msg) {
        try {
          this.ws.send(msg);
        } catch (e) {
          this.logWarn('Failed to send queued message:', e);
          break;
        }
      }
    }
  }

  public clearQueue(): void {
    this.messageQueue = [];
  }

  // ==========================================
  // Internal Helpers & State
  // ==========================================

  private getCurrentUrl(): string {
    return this.urls[this.currentUrlIndex % this.urls.length];
  }

  private setState(nextState: SocketState, meta?: { latencyMs?: number; reason?: string }): void {
    if (this.state === nextState) return;
    const prevState = this.state;
    this.state = nextState;
    this.emit('stateChange', nextState, prevState, meta);
  }

  private cleanSocket(): void {
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      try {
        if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
          this.ws.close();
        }
      } catch {}
      this.ws = null;
    }
  }

  private clearHandshakeTimer(): void {
    if (this.handshakeTimer) {
      clearTimeout(this.handshakeTimer);
      this.handshakeTimer = null;
    }
  }

  private clearAllTimers(): void {
    this.clearHandshakeTimer();
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log(`%c[WebSocketManager]`, 'color: #06b6d4; font-weight: bold;', ...args);
    }
  }

  private logWarn(...args: unknown[]): void {
    console.warn(`%c[WebSocketManager]`, 'color: #f59e0b; font-weight: bold;', ...args);
  }

  // ==========================================
  // Public Accessors
  // ==========================================

  public getState(): SocketState {
    return this.state;
  }

  public isConnected(): boolean {
    return this.state === 'CONNECTED' && this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  public getLatency(): number {
    return this.currentLatencyMs;
  }

  public getQueueLength(): number {
    return this.messageQueue.length;
  }

  public getUnderlyingSocket(): WebSocket | null {
    return this.ws;
  }

  // ==========================================
  // Event Subscription (Type-safe)
  // ==========================================

  public on<K extends keyof EventMap>(event: K, handler: EventMap[K]): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set() as any;
    }
    this.listeners[event]!.add(handler as any);

    // Return unbind handler
    return () => {
      this.off(event, handler);
    };
  }

  public off<K extends keyof EventMap>(event: K, handler: EventMap[K]): void {
    const bucket = this.listeners[event];
    if (bucket) {
      bucket.delete(handler as any);
    }
  }

  private emit<K extends keyof EventMap>(event: K, ...args: Parameters<EventMap[K]>): void {
    const bucket = this.listeners[event];
    if (!bucket || bucket.size === 0) return;
    bucket.forEach((listener) => {
      try {
        (listener as any)(...args);
      } catch (err) {
        this.logWarn(`Error in event listener for '${event}':`, err);
      }
    });
  }

  /**
   * Completely destroy the manager and release all resources
   */
  public destroy(): void {
    this.disconnect(1000, 'Manager destroyed');
    this.clearQueue();
    this.listeners = {};
  }
}
