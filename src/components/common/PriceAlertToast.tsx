import React from 'react';
import { Bell, X, ArrowUpRight, ArrowDownRight, Sparkles, ExternalLink } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

export const PriceAlertToast: React.FC = () => {
  const { alertToasts, dismissAlertToast, setIsPriceAlertModalOpen } = useTrading();

  if (alertToasts.length === 0) return null;

  return (
    <div 
      id="price-alert-toasts-container"
      className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none"
    >
      {alertToasts.map(toast => {
        const { alert, currentPrice, timestamp } = toast;
        const isAbove = alert.condition === 'above';

        return (
          <div
            key={toast.id}
            className="pointer-events-auto rounded-2xl border border-purple-500/60 bg-[#090e1d]/95 p-4 backdrop-blur-xl shadow-[0_0_25px_rgba(168,85,247,0.3)] animate-in slide-in-from-bottom-5 duration-300 font-mono text-xs relative overflow-hidden"
          >
            {/* Ambient indicator bar */}
            <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${
              isAbove ? 'bg-emerald-500' : 'bg-rose-500'
            }`} />

            <div className="flex items-start justify-between pl-1 gap-2">
              <div className="flex items-center space-x-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-950 border border-purple-700/60 text-purple-300 shadow">
                  <Bell className="h-3.5 w-3.5 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-white text-sm tracking-wide">
                      PRICE ALERT HIT
                    </span>
                    <span className="rounded-md bg-amber-950/80 border border-amber-800/60 px-1.5 py-0.5 text-xs text-amber-300 font-bold">
                      {timestamp}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300">
                    {alert.assetSymbol} crossed your target threshold
                  </div>
                </div>
              </div>

              <button
                onClick={() => dismissAlertToast(toast.id)}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Threshold and actual hit price */}
            <div className="mt-3 rounded-xl bg-[#050813] border border-slate-800/80 p-2.5 flex items-center justify-between pl-3">
              <div>
                <span className="text-xs text-slate-300">Condition Target:</span>
                <div className="text-xs font-bold text-purple-300 flex items-center">
                  {isAbove ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400 mr-0.5" /> : <ArrowDownRight className="h-3.5 w-3.5 text-rose-400 mr-0.5" />}
                  {isAbove ? '≥' : '≤'} ${alert.targetPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-300">Triggered At:</span>
                <div className="text-xs font-bold text-white">
                  ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {alert.note && (
              <div className="mt-2 text-xs text-purple-200/90 italic pl-1">
                "{alert.note}"
              </div>
            )}

            {/* Actions */}
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/60 pl-1">
              <button
                onClick={() => {
                  dismissAlertToast(toast.id);
                  setIsPriceAlertModalOpen(true);
                }}
                className="text-purple-400 hover:text-purple-300 font-bold text-xs flex items-center space-x-1"
              >
                <span>View All Alerts</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => dismissAlertToast(toast.id)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
