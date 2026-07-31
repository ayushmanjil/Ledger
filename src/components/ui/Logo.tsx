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
        {/* Rich Brown Leather Main Gradient */}
        <radialGradient id="brownLeatherMain" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#8C4A23" />
          <stop offset="45%" stopColor="#5C2D13" />
          <stop offset="85%" stopColor="#361808" />
          <stop offset="100%" stopColor="#1F0D04" />
        </radialGradient>

        {/* Brown Leather Flap / Pocket Gradient */}
        <linearGradient id="brownLeatherPocket" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#733B1A" />
          <stop offset="60%" stopColor="#47220C" />
          <stop offset="100%" stopColor="#2B1306" />
        </linearGradient>

        {/* Leather Strap Gradient */}
        <linearGradient id="brownLeatherStrap" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A05629" />
          <stop offset="50%" stopColor="#6E3516" />
          <stop offset="100%" stopColor="#3D1B09" />
        </linearGradient>

        {/* Metallic Gold/Brass Clasp Gradient */}
        <linearGradient id="goldClasp" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF3D1" />
          <stop offset="30%" stopColor="#F5CF7F" />
          <stop offset="70%" stopColor="#C79339" />
          <stop offset="100%" stopColor="#7A4F13" />
        </linearGradient>

        {/* Card Top Accent Gradient */}
        <linearGradient id="cardAccent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2D483A" />
          <stop offset="100%" stopColor="#17271E" />
        </linearGradient>

        {/* Drop Shadow */}
        <filter id="walletShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#000000" floodOpacity="0.65" />
        </filter>

        {/* Clasp Glow */}
        <filter id="claspGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#F5CF7F" floodOpacity="0.4" />
        </filter>
      </defs>

      <g filter="url(#walletShadow)">
        {/* 1. Peeking Top Card / Cash note */}
        <rect x="40" y="14" width="48" height="24" rx="5" fill="url(#cardAccent)" stroke="url(#goldClasp)" strokeWidth="1" />
        {/* Gold chip / emblem on card */}
        <rect x="46" y="20" width="10" height="8" rx="2" fill="url(#goldClasp)" />
        <line x1="60" y1="22" x2="80" y2="22" stroke="#E0B872" strokeWidth="1.5" opacity="0.6" strokeDasharray="4 2" />
        <line x1="60" y1="26" x2="74" y2="26" stroke="#E0B872" strokeWidth="1.5" opacity="0.4" />

        {/* 2. Main Wallet Body (Brown Leather) */}
        <rect x="14" y="28" width="100" height="86" rx="22" fill="url(#brownLeatherMain)" stroke="#261005" strokeWidth="2" />
        
        {/* Top Highlight Bevel */}
        <rect x="16" y="30" width="96" height="82" rx="20" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

        {/* Outer Perimeter Stitching (Beige Thread) */}
        <rect x="21" y="35" width="86" height="72" rx="16" fill="none" stroke="#E6C594" strokeWidth="1.3" strokeDasharray="3.5 2.5" opacity="0.8" />

        {/* 3. Front Leather Pocket / Curved Fold */}
        <path d="M 14 60 C 35 54 65 54 114 60 L 114 92 C 114 104 104 114 92 114 L 36 114 C 24 114 14 104 14 92 Z" fill="url(#brownLeatherPocket)" stroke="#210D04" strokeWidth="1.5" />

        {/* Pocket Top Edge Crease Line */}
        <path d="M 14 60 C 35 54 65 54 114 60" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        
        {/* Pocket Curved Stitching */}
        <path d="M 21 66 C 38 61 64 61 107 66 L 107 90 C 107 99 99 107 90 107 L 38 107 C 29 107 21 99 21 90 Z" fill="none" stroke="#E6C594" strokeWidth="1.3" strokeDasharray="3.5 2.5" opacity="0.85" />

        {/* 4. Leather Clasp Strap with Brass Snap Button */}
        <g filter="url(#claspGlow)">
          {/* Strap Body */}
          <path d="M 72 58 L 114 58 C 117 58 119 60 119 63 L 119 79 C 119 82 117 84 114 84 L 72 84 C 65 84 60 79 60 71 C 60 63 65 58 72 58 Z" fill="url(#brownLeatherStrap)" stroke="#1A0A03" strokeWidth="1.5" />

          {/* Strap Stitching */}
          <path d="M 73 62 L 113 62 C 114.5 62 115.5 63 115.5 64.5 L 115.5 77.5 C 115.5 79 114.5 80 113 80 L 73 80 C 68 80 64 76 64 71 C 64 66 68 62 73 62 Z" fill="none" stroke="#E6C594" strokeWidth="1.1" strokeDasharray="3 2" opacity="0.85" />

          {/* Gold / Brass Snap Button */}
          <circle cx="76" cy="71" r="9" fill="url(#goldClasp)" stroke="#261005" strokeWidth="1" />
          <circle cx="76" cy="71" r="6" fill="#2B1306" />
          <circle cx="76" cy="71" r="3.5" fill="url(#goldClasp)" />
          <circle cx="74.8" cy="69.8" r="1" fill="#FFFFFF" opacity="0.8" />
        </g>
      </g>
    </svg>
  );
}
