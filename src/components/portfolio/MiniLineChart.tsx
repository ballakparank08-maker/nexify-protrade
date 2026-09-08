import React, { useState, useId } from 'react';

interface MiniLineChartProps {
  data: number[];
  change24h: number;
  height?: number;
  width?: number | string;
  className?: string;
  showTooltip?: boolean;
  showEndpoints?: boolean;
  showRange?: boolean;
  currentPrice?: number;
  symbol?: string;
}

export const MiniLineChart: React.FC<MiniLineChartProps> = ({
  data,
  change24h,
  height = 54,
  width = '100%',
  className = '',
  showTooltip = true,
  showEndpoints = true,
  showRange = true,
  currentPrice,
  symbol = ''
}) => {
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Fallback if data is empty or single point
  const points = data && data.length > 1 
    ? data 
    : [currentPrice || 100, (currentPrice || 100) * (1 + (change24h || 0) / 100)];

  const isPositive = change24h >= 0;
  const strokeColor = isPositive ? '#10b981' : '#f43f5e';
  const fillColor = isPositive ? '#10b981' : '#f43f5e';

  const minVal = Math.min(...points);
  const maxVal = Math.max(...points);
  const range = maxVal - minVal || 1;

  // Viewbox coordinate space
  const svgWidth = 200;
  const svgHeight = 60;
  const paddingX = 6;
  const paddingY = 8;
  const innerWidth = svgWidth - paddingX * 2;
  const innerHeight = svgHeight - paddingY * 2;

  // Calculate coordinates
  const coords = points.map((val, idx) => {
    const x = paddingX + (idx / (points.length - 1)) * innerWidth;
    const y = paddingY + innerHeight - ((val - minVal) / range) * innerHeight;
    return { x, y, val };
  });

  // Generate smooth cubic bezier SVG path
  const buildSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;

      // Catmull-Rom to Cubic Bezier conversion
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const linePath = buildSmoothPath(coords);
  const lastPoint = coords[coords.length - 1];
  const firstPoint = coords[0];

  // Area under curve
  const areaPath = linePath 
    ? `${linePath} L ${lastPoint.x.toFixed(1)} ${svgHeight} L ${firstPoint.x.toFixed(1)} ${svgHeight} Z`
    : '';

  // Calculate hover tooltip
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!showTooltip) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = (e.clientX - rect.left) / rect.width;
    const clampedIndex = Math.min(
      coords.length - 1,
      Math.max(0, Math.round(relativeX * (coords.length - 1)))
    );
    setHoverIndex(clampedIndex);
  };

  const activeCoord = hoverIndex !== null ? coords[hoverIndex] : null;

  // Approximate time offset for data points across 24h
  const getTimeLabel = (idx: number) => {
    const totalPoints = points.length;
    if (idx === totalPoints - 1) return 'Now';
    if (idx === 0) return '24h ago';
    const hoursAgo = Math.round(((totalPoints - 1 - idx) / (totalPoints - 1)) * 24);
    return `-${hoursAgo}h`;
  };

  return (
    <div className={`relative flex flex-col justify-end select-none ${className}`}>
      {/* Interactive Tooltip Overlay */}
      {showTooltip && activeCoord && hoverIndex !== null && (
        <div 
          className="absolute -top-8 left-0 right-0 pointer-events-none flex justify-center z-10"
        >
          <div className="flex items-center space-x-1.5 rounded-lg bg-slate-900/95 border border-white/10 px-2.5 py-1 text-xs font-mono text-white shadow-lg backdrop-blur-md">
            <span className="text-slate-300">{getTimeLabel(hoverIndex)}:</span>
            <span className="font-bold text-slate-100">
              ${activeCoord.val.toLocaleString(undefined, { 
                minimumFractionDigits: activeCoord.val > 100 ? 2 : 4,
                maximumFractionDigits: activeCoord.val > 100 ? 2 : 4
              })}
            </span>
            {symbol && <span className="text-purple-300 font-semibold">{symbol}</span>}
          </div>
        </div>
      )}

      {/* SVG Canvas */}
      <div 
        className="w-full relative overflow-hidden rounded-lg bg-slate-950/40 border border-slate-800/40 p-1"
        style={{ height }}
      >
        <svg
          className="w-full h-full cursor-crosshair overflow-visible"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={fillColor} stopOpacity={0.28} />
              <stop offset="50%" stopColor={fillColor} stopOpacity={0.08} />
              <stop offset="100%" stopColor={fillColor} stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {/* Area fill */}
          {areaPath && (
            <path
              d={areaPath}
              fill={`url(#${gradientId})`}
            />
          )}

          {/* Main Trend Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />
          )}

          {/* Hover Crosshair Vertical Line & Active Point */}
          {activeCoord && (
            <g>
              <line
                x1={activeCoord.x}
                y1={paddingY}
                x2={activeCoord.x}
                y2={svgHeight}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.6"
              />
              <circle
                cx={activeCoord.x}
                cy={activeCoord.y}
                r="4"
                fill={strokeColor}
                stroke="#0f172a"
                strokeWidth="2"
              />
            </g>
          )}

          {/* Glowing pulse on latest current price point */}
          {showEndpoints && lastPoint && activeCoord === null && (
            <g>
              <circle
                cx={lastPoint.x}
                cy={lastPoint.y}
                r="6"
                fill={strokeColor}
                opacity="0.25"
                className="animate-ping origin-center"
              />
              <circle
                cx={lastPoint.x}
                cy={lastPoint.y}
                r="3"
                fill={strokeColor}
                stroke="#060a14"
                strokeWidth="1.5"
              />
            </g>
          )}
        </svg>
      </div>

      {/* 24h Low / High or Timeline Range footer */}
      {showRange && (
        <div className="mt-1.5 flex items-center justify-between text-xs font-mono text-slate-300">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">24h Low:</span>
            <span className="text-slate-200">
              ${minVal.toLocaleString(undefined, { minimumFractionDigits: minVal > 100 ? 1 : 3 })}
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">24h High:</span>
            <span className="text-slate-200">
              ${maxVal.toLocaleString(undefined, { minimumFractionDigits: maxVal > 100 ? 1 : 3 })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
