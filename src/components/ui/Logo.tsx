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
        {/* Warm Gold-Tan Line Art Gradient */}
        <linearGradient id="lineGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFEBB8" />
          <stop offset="40%" stopColor="#E0B872" />
          <stop offset="80%" stopColor="#C68958" />
          <stop offset="100%" stopColor="#8A5229" />
        </linearGradient>

        {/* Deep Leather Background Canvas */}
        <radialGradient id="lineBg" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#3D1D12" />
          <stop offset="70%" stopColor="#210D07" />
          <stop offset="100%" stopColor="#0F0503" />
        </radialGradient>

        <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#E0B872" floodOpacity="0.3" />
          <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#000000" floodOpacity="0.6" />
        </filter>
      </defs>

      <g filter="url(#lineGlow)">
        {/* Dark Leather Shield Canvas */}
        <rect x="12" y="12" width="104" height="104" rx="26" fill="url(#lineBg)" stroke="url(#lineGold)" strokeWidth="1" opacity="0.9" />

        {/* Line 1: Outer Wallet Silhouette */}
        <path
          d="M 28 42 C 28 32 36 26 48 26 L 86 26 C 96 26 104 32 104 42 L 104 84 C 104 94 96 100 86 100 L 42 100 C 30 100 22 92 22 80 L 22 52 C 22 46 25 42 28 42 Z"
          stroke="url(#lineGold)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Line 2: Flowing Wallet Flap Arc */}
        <path
          d="M 22 54 C 42 46 76 46 104 54"
          stroke="url(#lineGold)"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Line 3: Dashed Leather Stitch Line */}
        <path
          d="M 32 34 L 84 34 C 91 34 96 38 96 44 L 96 78 C 96 85 91 89 84 89 L 38 89 C 30 89 28 83 28 76 L 28 48"
          stroke="url(#lineGold)"
          strokeWidth="1.8"
          strokeDasharray="4 3"
          opacity="0.75"
          strokeLinecap="round"
        />

        {/* Line 4: Wallet Strap Loop */}
        <path
          d="M 76 58 L 100 58 C 105 58 108 61 108 66 C 108 71 105 74 100 74 L 76 74"
          stroke="url(#lineGold)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Line 5: Clasp Stud Accent */}
        <circle cx="85" cy="66" r="3.5" fill="url(#lineGold)" />
      </g>
    </svg>
  );
}
