import { type SVGProps } from 'react';

export function Logo({ className = "w-10 h-10", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        {/* Gold Foil Gradient */}
        <linearGradient id="ledgerGoldFoil" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF2D1" />
          <stop offset="25%" stopColor="#F5D07F" />
          <stop offset="50%" stopColor="#C9943B" />
          <stop offset="75%" stopColor="#FCE4A6" />
          <stop offset="100%" stopColor="#8C5718" />
        </linearGradient>

        <linearGradient id="ledgerGoldLight" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#D49A3C" />
          <stop offset="50%" stopColor="#FFF5D6" />
          <stop offset="100%" stopColor="#B57A24" />
        </linearGradient>

        {/* Deep Rich Leather Gradient */}
        <radialGradient id="ledgerLeatherBg" cx="40%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#4A261A" />
          <stop offset="50%" stopColor="#29130B" />
          <stop offset="100%" stopColor="#0F0503" />
        </radialGradient>

        {/* Soft Drop Shadow Filter */}
        <filter id="ledgerLogoShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.6" />
        </filter>

        {/* Gold Glow Filter */}
        <filter id="ledgerGoldGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#F5D07F" floodOpacity="0.35" />
        </filter>
      </defs>

      <g filter="url(#ledgerLogoShadow)">
        {/* Outer Leather Shield / Badge */}
        <rect x="10" y="10" width="108" height="108" rx="28" fill="url(#ledgerLeatherBg)" stroke="url(#ledgerGoldFoil)" strokeWidth="2.5" />

        {/* Inner Highlight Ring */}
        <rect x="12" y="12" width="104" height="104" rx="26" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

        {/* Precision Gold Stitching */}
        <rect x="18" y="18" width="92" height="92" rx="21" fill="none" stroke="url(#ledgerGoldFoil)" strokeWidth="1.2" strokeDasharray="3.5 3" opacity="0.75" />

        {/* Gold Corner Hardware Brackets */}
        <path d="M 22 32 L 22 26 C 22 23.8 23.8 22 26 22 L 32 22" fill="none" stroke="url(#ledgerGoldFoil)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 106 32 L 106 26 C 106 23.8 104.2 22 102 22 L 96 22" fill="none" stroke="url(#ledgerGoldFoil)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 22 96 L 22 102 C 22 104.2 23.8 106 26 106 L 32 106" fill="none" stroke="url(#ledgerGoldFoil)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 106 96 L 106 102 C 106 104.2 104.2 106 102 106 L 96 106" fill="none" stroke="url(#ledgerGoldFoil)" strokeWidth="2.5" strokeLinecap="round" />

        {/* Center Emblem: Detailed Leather Ledger & Golden "L" Monogram + Coin Clasp */}
        <g filter="url(#ledgerGoldGlow)">
          {/* Leather Ledger Folder Outline */}
          <path d="M 34 38 C 34 34 38 32 42 32 L 86 32 C 90 32 94 34 94 38 L 94 90 C 94 94 90 96 86 96 L 42 96 C 38 96 34 94 34 90 Z" fill="rgba(0,0,0,0.4)" stroke="url(#ledgerGoldFoil)" strokeWidth="1.8" />
          
          {/* Embossed Stitching Line across folder flap */}
          <path d="M 34 48 L 94 48" stroke="url(#ledgerGoldFoil)" strokeWidth="1.2" strokeDasharray="2 2" opacity="0.75" />

          {/* Golden "L" Serif Monogram */}
          <path d="M 46 42 L 55 42 L 55 77 L 76 77 L 76 84 L 46 84 Z" fill="url(#ledgerGoldLight)" stroke="url(#ledgerGoldFoil)" strokeWidth="0.8" />

          {/* Gold Coin Clasp & Diamond Crest */}
          <circle cx="76" cy="62" r="10" fill="url(#ledgerGoldFoil)" stroke="#29130B" strokeWidth="1.2" />
          <circle cx="76" cy="62" r="6" fill="#29130B" />
          <path d="M 76 58 L 78.5 62 L 76 66 L 73.5 62 Z" fill="url(#ledgerGoldLight)" />
        </g>
      </g>
    </svg>
  );
}
