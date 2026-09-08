import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

export interface CoinTickerItem {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
}

// Fallback initial values for at least 8 live cryptocurrency prices
const FALLBACK_TICKER_DATA: CoinTickerItem[] = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 79154.00, change24h: -0.94 },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', price: 2490.30, change24h: -0.64 },
  { id: 'solana', symbol: 'SOL', name: 'Solana', price: 103.87, change24h: -1.90 },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB', price: 739.11, change24h: -1.58 },
  { id: 'ripple', symbol: 'XRP', name: 'XRP', price: 1.40, change24h: -1.92 },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', price: 0.2203, change24h: -0.51 },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', price: 8.10, change24h: 4.11 },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', price: 0.0903, change24h: -0.12 },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', price: 12.75, change24h: -1.00 },
];

const COIN_IDS = 'bitcoin,ethereum,solana,binancecoin,ripple,cardano,avalanche-2,dogecoin,chainlink';
const COINGECKO_API_URL = `https://api.coingecko.com/api/v3/simple/price?ids=${COIN_IDS}&vs_currencies=usd&include_24hr_change=true`;

export const MarketTicker: React.FC = () => {
  const { setSelectedSymbol, setCurrentTab, setCurrentDomain, cryptoAssets } = useTrading();
  const [tickers, setTickers] = useState<CoinTickerItem[]>(FALLBACK_TICKER_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [, setFetchError] = useState<string | null>(null);

  // Fetch live cryptocurrency prices from public CoinGecko API
  const fetchPrices = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const response = await fetch(COINGECKO_API_URL, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      const updatedTickers: CoinTickerItem[] = [
        {
          id: 'bitcoin',
          symbol: 'BTC',
          name: 'Bitcoin',
          price: data.bitcoin?.usd ?? FALLBACK_TICKER_DATA[0].price,
          change24h: data.bitcoin?.usd_24h_change ?? FALLBACK_TICKER_DATA[0].change24h,
        },
        {
          id: 'ethereum',
          symbol: 'ETH',
          name: 'Ethereum',
          price: data.ethereum?.usd ?? FALLBACK_TICKER_DATA[1].price,
          change24h: data.ethereum?.usd_24h_change ?? FALLBACK_TICKER_DATA[1].change24h,
        },
        {
          id: 'solana',
          symbol: 'SOL',
          name: 'Solana',
          price: data.solana?.usd ?? FALLBACK_TICKER_DATA[2].price,
          change24h: data.solana?.usd_24h_change ?? FALLBACK_TICKER_DATA[2].change24h,
        },
        {
          id: 'binancecoin',
          symbol: 'BNB',
          name: 'BNB',
          price: data.binancecoin?.usd ?? FALLBACK_TICKER_DATA[3].price,
          change24h: data.binancecoin?.usd_24h_change ?? FALLBACK_TICKER_DATA[3].change24h,
        },
        {
          id: 'ripple',
          symbol: 'XRP',
          name: 'XRP',
          price: data.ripple?.usd ?? FALLBACK_TICKER_DATA[4].price,
          change24h: data.ripple?.usd_24h_change ?? FALLBACK_TICKER_DATA[4].change24h,
        },
        {
          id: 'cardano',
          symbol: 'ADA',
          name: 'Cardano',
          price: data.cardano?.usd ?? FALLBACK_TICKER_DATA[5].price,
          change24h: data.cardano?.usd_24h_change ?? FALLBACK_TICKER_DATA[5].change24h,
        },
        {
          id: 'avalanche-2',
          symbol: 'AVAX',
          name: 'Avalanche',
          price: data['avalanche-2']?.usd ?? FALLBACK_TICKER_DATA[6].price,
          change24h: data['avalanche-2']?.usd_24h_change ?? FALLBACK_TICKER_DATA[6].change24h,
        },
        {
          id: 'dogecoin',
          symbol: 'DOGE',
          name: 'Dogecoin',
          price: data.dogecoin?.usd ?? FALLBACK_TICKER_DATA[7].price,
          change24h: data.dogecoin?.usd_24h_change ?? FALLBACK_TICKER_DATA[7].change24h,
        },
        {
          id: 'chainlink',
          symbol: 'LINK',
          name: 'Chainlink',
          price: data.chainlink?.usd ?? FALLBACK_TICKER_DATA[8].price,
          change24h: data.chainlink?.usd_24h_change ?? FALLBACK_TICKER_DATA[8].change24h,
        },
      ];

      setTickers(updatedTickers);
      setLastUpdated(new Date());
      setFetchError(null);
    } catch (err: any) {
      console.warn('CoinGecko ticker fetch fallback:', err?.message);
      // Fallback to active crypto assets from TradingContext
      const updated = FALLBACK_TICKER_DATA.map(fb => {
        const match = cryptoAssets.find(a => a.symbol === fb.symbol);
        if (match) {
          return { ...fb, price: match.price, change24h: match.change24h };
        }
        return fb;
      });
      setTickers(updated);
      setLastUpdated(new Date());
      setFetchError(err?.message || 'Failed to update');
    } finally {
      setIsLoading(false);
      if (manual) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  }, [cryptoAssets]);

  // Requirement: React useEffect hook with interval (every 30 to 60 seconds)
  useEffect(() => {
    let isMounted = true;

    // Initial fetch on mount
    fetchPrices();

    // 30-second interval timer for live price refreshes
    const intervalId = setInterval(() => {
      if (isMounted) {
        fetchPrices();
      }
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [fetchPrices]);

  const handleCoinClick = (symbol: string) => {
    setSelectedSymbol(symbol);
    setCurrentDomain('app');
    setCurrentTab('spot');
  };

  return (
    <div 
      id="sub-nav-market-ticker"
      className="relative z-10 w-full bg-[#080d1a]/95 border-b border-white/10 px-4 sm:px-6 py-2 backdrop-blur-md flex items-center justify-between text-xs select-none shadow-sm gap-4"
    >
      {/* Left indicator: Live Feed Badge */}
      <div className="flex items-center space-x-2 shrink-0 pr-3 border-r border-white/10">
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </div>
        <span className="text-xs font-semibold tracking-wider uppercase text-slate-300 font-mono hidden sm:inline">
          Live Markets
        </span>
      </div>

      {/* Center items: At least 7-9 live tickers with Up & Down logos in Green and Red */}
      <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar scroll-smooth flex-1 py-0.5">
        {isLoading && !lastUpdated ? (
          // Loading placeholders
          <div className="flex items-center space-x-3 animate-pulse py-0.5">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex items-center space-x-2 bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/5">
                <div className="h-3.5 w-8 bg-slate-700/60 rounded"></div>
                <div className="h-3.5 w-16 bg-slate-700/40 rounded"></div>
                <div className="h-4 w-12 bg-slate-700/30 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          tickers.map((item) => {
            const isPositive = item.change24h >= 0;
            // Green (emerald) for Up, Red for Down
            const changeColorClass = isPositive ? 'text-emerald-400' : 'text-red-400';
            const badgeBgClass = isPositive 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400';

            const formattedPrice = item.price.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: item.price < 1 ? 4 : 2,
            });

            return (
              <button
                key={item.id}
                id={`ticker-${item.symbol.toLowerCase()}`}
                type="button"
                onClick={() => handleCoinClick(item.symbol)}
                className="group shrink-0 flex items-center space-x-2.5 px-3 py-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer"
                title={`Click to trade ${item.name} (${item.symbol}/USDT)`}
              >
                {/* Coin Symbol */}
                <span className="font-semibold text-slate-200 group-hover:text-cyan-300 font-mono text-xs">
                  {item.symbol}
                </span>

                {/* Coin Live Price */}
                <span className="font-mono font-medium text-white text-xs">
                  ${formattedPrice}
                </span>

                {/* Up and Down Logo with Green and Red colour */}
                <div className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md border text-xs font-mono font-semibold ${badgeBgClass}`}>
                  {isPositive ? (
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-400 shrink-0 stroke-[2.5]" aria-label="Price Up" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-red-400 shrink-0 stroke-[2.5]" aria-label="Price Down" />
                  )}
                  <span className={changeColorClass}>
                    {isPositive ? '+' : ''}
                    {item.change24h.toFixed(2)}%
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Right controls: Last updated timestamp & manual refresh */}
      <div className="flex items-center space-x-2.5 shrink-0 pl-3 border-l border-white/10 text-xs text-slate-300 font-mono">
        {lastUpdated && (
          <span className="hidden xl:inline text-slate-400">
            {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
        <button
          id="ticker-refresh-btn"
          type="button"
          onClick={() => fetchPrices(true)}
          disabled={isRefreshing}
          className="p-1 hover:text-cyan-400 transition-colors text-slate-400 hover:bg-white/5 rounded-md"
          title="Refresh prices now"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
        </button>
      </div>
    </div>
  );
};

