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
        {/* Minimal Rich Brown Leather Gradient */}
        <linearGradient id="minLeather" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7B3F1E" />
          <stop offset="60%" stopColor="#4D230D" />
          <stop offset="100%" stopColor="#280F05" />
        </linearGradient>

        {/* Gold Accent Gradient */}
        <linearGradient id="minGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE7AB" />
          <stop offset="50%" stopColor="#E0B872" />
          <stop offset="100%" stopColor="#9E6F22" />
        </linearGradient>

        {/* Subtle Drop Shadow */}
        <filter id="minShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.5" />
        </filter>
      </defs>

      <g filter="url(#minShadow)">
        {/* Main Wallet Body */}
        <rect x="18" y="26" width="92" height="76" rx="22" fill="url(#minLeather)" stroke="#1A0903" strokeWidth="2" />

        {/* Subtle Inner Edge Highlight */}
        <rect x="20" y="28" width="88" height="72" rx="20" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

        {/* Minimal Gold Thread Perimeter Stitching */}
        <rect x="25" y="33" width="78" height="62" rx="15" fill="none" stroke="#E0B872" strokeWidth="1.2" strokeDasharray="3.5 3" opacity="0.65" />

        {/* Minimal Pocket Curved Seam */}
        <path d="M 18 58 C 42 54 86 54 110 58" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" />

        {/* Minimal Wallet Clasp Tab */}
        <rect x="76" y="56" width="34" height="16" rx="8" fill="url(#minLeather)" stroke="url(#minGold)" strokeWidth="1" />

        {/* Minimal Gold Snap Stud */}
        <circle cx="85" cy="64" r="4.5" fill="url(#minGold)" />
      </g>
    </svg>
  );
}
