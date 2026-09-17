import React from 'react';

interface GatoBrandProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  showMotto?: boolean;
  variant?: 'dark' | 'light';
  iconOnly?: boolean;
}

export const GatoBrand: React.FC<GatoBrandProps> = ({
  size = 'md',
  showSubtitle = true,
  showMotto = false,
  variant = 'dark',
  iconOnly = false,
}) => {
  const isSm = size === 'sm';
  const isLg = size === 'lg';
  const isDark = variant === 'dark';

  return (
    <div className="flex items-center gap-3 select-none" id="gato-brand-header">
      {/* Orange Cat Silhouette Head from Image */}
      <div 
        className={`relative flex items-center justify-center shrink-0 ${
          isSm ? 'w-8 h-8' : isLg ? 'w-12 h-12' : 'w-10 h-10'
        }`}
      >
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full drop-shadow-sm"
        >
          {/* Main Orange Cat Head Silhouette */}
          <path 
            d="M 22 24 L 36 36 C 40 34 45 33 50 33 C 55 33 60 34 64 36 L 78 24 L 75 48 C 82 56 83 66 78 76 C 72 88 56 92 50 92 C 44 92 28 88 22 76 C 17 66 18 56 25 48 Z" 
            fill="#EA580C" 
          />
          {/* Inner Ear shading */}
          <polygon points="26,30 33,37 28,42" fill="#C2410C" />
          <polygon points="74,30 67,37 72,42" fill="#C2410C" />
          {/* Cat Eyes */}
          <ellipse cx="38" cy="56" rx="4.5" ry="6.5" fill="#FFFFFF" transform="rotate(-6 38 56)" />
          <ellipse cx="62" cy="56" rx="4.5" ry="6.5" fill="#FFFFFF" transform="rotate(6 62 56)" />
          <ellipse cx="38.5" cy="56" rx="2" ry="5.5" fill="#0F172A" />
          <ellipse cx="61.5" cy="56" rx="2" ry="5.5" fill="#0F172A" />
          {/* Subtle Whiskers */}
          <path d="M 22 64 L 32 64 M 21 70 L 32 68 M 78 64 L 68 64 M 79 70 L 68 68" stroke="#FED7AA" strokeWidth="2.5" strokeLinecap="round" />
          {/* Small Nose */}
          <polygon points="50,65 46,61 54,61" fill="#FFFFFF" />
          <path d="M 46 68 Q 50 71 54 68" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      </div>

      {/* Typography: "GATO" + "GESTÃO DE AUTOPEÇAS" */}
      {!iconOnly && (
        <div className="flex flex-col justify-center leading-none">
          <span 
            className={`font-black tracking-tight font-['Outfit'] ${
              isSm ? 'text-lg' : isLg ? 'text-3xl' : 'text-2xl'
            } ${isDark ? 'text-white' : 'text-slate-900'}`}
          >
            GATO
          </span>

          {showSubtitle && (
            <span className={`text-[9px] sm:text-[10px] uppercase font-bold tracking-wider mt-0.5 ${
              isDark ? 'text-[#EA580C]' : 'text-[#EA580C]'
            }`}>
              Gestão de Autopeças
            </span>
          )}

          {showMotto && (
            <span className="text-[9px] font-semibold text-slate-400 tracking-wide mt-0.5">
              Controle hoje. Mais vendas amanhã.
            </span>
          )}
        </div>
      )}
    </div>
  );
};

