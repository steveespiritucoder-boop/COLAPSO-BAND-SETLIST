import React from 'react';

interface ColapsoLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const ColapsoLogo: React.FC<ColapsoLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = false,
}) => {
  const sizeStyles = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-20',
    xl: 'h-28',
  };

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      {/* Authentic Distressed Rock Logo based on official artwork */}
      <div className={`relative px-4 py-1.5 sm:px-5 sm:py-2 bg-black border-2 sm:border-[3px] border-red-700/90 rounded-xs shadow-lg shadow-red-950/50 flex items-center justify-center tracking-wider overflow-hidden group ${sizeStyles[size]}`}>
        {/* Grunge border texture overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(#dc2626_1px,transparent_1px)] [background-size:12px_12px] opacity-15 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-red-500/50" />
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-red-900" />

        {/* Brand Text with Lightning Bolt "A" */}
        <div className="relative flex items-center justify-center font-black font-rock text-stone-100 uppercase tracking-widest leading-none drop-shadow-md">
          <span className="text-stone-200 text-lg sm:text-2xl lg:text-3xl tracking-[0.18em]">
            COL
          </span>

          {/* Red Electric Lightning Bolt "A" (exact replica of the band's logo) */}
          <div className="relative inline-flex items-center justify-center mx-0.5 sm:mx-1 -translate-y-[1px]">
            <svg
              viewBox="0 0 100 120"
              className="w-5 h-7 sm:w-7 sm:h-9 lg:w-9 lg:h-12 fill-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]"
            >
              {/* Lightning Bolt Shaped 'A' */}
              <polygon points="52,2 24,62 48,62 38,118 78,50 54,50 66,2" />
              {/* Crossbar of A embedded in lightning */}
              <rect x="40" y="52" width="18" height="4" fill="#f5f5f4" opacity="0.4" />
            </svg>
          </div>

          <span className="text-stone-200 text-lg sm:text-2xl lg:text-3xl tracking-[0.18em]">
            PSO
          </span>
        </div>
      </div>

      {showSubtitle && (
        <div className="flex items-center gap-2 mt-1.5 text-[10px] sm:text-xs font-black tracking-widest text-red-500 uppercase font-rock">
          <span>ROCK SIN LÍMITES</span>
          <span className="text-stone-600">•</span>
          <span>MÚSICA QUE CONECTA</span>
        </div>
      )}
    </div>
  );
};
