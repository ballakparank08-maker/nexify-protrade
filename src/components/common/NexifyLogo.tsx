import React from 'react';

const logoIconUrl = `${import.meta.env.BASE_URL}logo-icon.png`;

interface NexifyLogoProps {
  variant?: 'full' | 'icon' | 'text' | 'badge';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSubtext?: boolean;
}

export const NexifyLogo: React.FC<NexifyLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  showSubtext = false
}) => {
  // Dimensions mapping
  const sizeConfig = {
    xs: { iconSize: 22, textClass: 'text-xs', tracking: 'tracking-tight', gap: 'gap-1.5' },
    sm: { iconSize: 28, textClass: 'text-sm', tracking: 'tracking-tight', gap: 'gap-2' },
    md: { iconSize: 36, textClass: 'text-lg', tracking: 'tracking-tight', gap: 'gap-2.5' },
    lg: { iconSize: 46, textClass: 'text-2xl', tracking: 'tracking-normal', gap: 'gap-3' },
    xl: { iconSize: 58, textClass: 'text-3xl', tracking: 'tracking-normal', gap: 'gap-3.5' }
  }[size];

  // Hexagonal Icon component with 3D Arrow, Neon Glow, and Candlestick Elements
  const renderHexIcon = (dim: number) => {
    return (
      <div 
        className="relative inline-flex items-center justify-center select-none flex-shrink-0"
        style={{ width: dim, height: dim }}
      >
        {/* Outer ambient blur glow */}
        <div 
          className="absolute inset-0 rounded-full blur-md opacity-75 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(0,240,255,0.45) 0%, rgba(147,51,234,0.4) 60%, transparent 80%)'
          }}
        />

        <img 
          src={logoIconUrl}
          alt="Nexify ProTrade" 
          className="w-full h-full object-contain relative z-10 filter drop-shadow-[0_2px_8px_rgba(0,240,255,0.4)]"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
    );
  };

  // Typography Wordmark: NEXIFY PROTRADE
  const renderWordmark = () => {
    return (
      <div className="flex flex-col justify-center leading-none select-none">
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* NEXIFY: Sleek metallic silver/white with subtle cyan aura */}
          <span 
            className={`font-black font-sans uppercase ${sizeConfig.textClass} ${sizeConfig.tracking}`}
            style={{
              color: '#F1F5F9',
              textShadow: '0 0 12px rgba(6, 182, 212, 0.4), 0 1px 2px rgba(0, 0, 0, 0.9)'
            }}
          >
            NEXIFY
          </span>

          {/* PROTRADE: Violet to Cyan vibrant gradient with futuristic bevel */}
          <span 
            className={`font-black font-sans uppercase ${sizeConfig.textClass} ${sizeConfig.tracking} bg-gradient-to-r from-purple-500 via-indigo-400 to-cyan-400 bg-clip-text text-transparent`}
            style={{
              filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.35))'
            }}
          >
            PROTRADE
          </span>
        </div>

        {showSubtext && (
          <span className="text-xs font-mono tracking-wider text-slate-300 uppercase mt-0.5 opacity-90">
            Enterprise Digital Asset Workstation
          </span>
        )}
      </div>
    );
  };

  // Badge Variant for Small Pills / Status Bars
  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#090e1e] border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)] ${className}`}>
        {renderHexIcon(16)}
        <span className="text-xs font-bold tracking-wider font-sans text-white">NEXIFY</span>
        <span className="text-xs font-bold tracking-wider font-sans bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">PROTRADE</span>
      </div>
    );
  }

  // Icon only
  if (variant === 'icon') {
    return <div className={className}>{renderHexIcon(sizeConfig.iconSize)}</div>;
  }

  // Text only
  if (variant === 'text') {
    return <div className={className}>{renderWordmark()}</div>;
  }

  // Full: Icon + Wordmark
  return (
    <div className={`inline-flex items-center ${sizeConfig.gap} ${className}`}>
      {renderHexIcon(sizeConfig.iconSize)}
      {renderWordmark()}
    </div>
  );
};
