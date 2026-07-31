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
        {/* Rich Brown Leather Main Body Gradient */}
        <linearGradient id="walletBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5C3018" />
          <stop offset="60%" stopColor="#3D1D0D" />
          <stop offset="100%" stopColor="#240F06" />
        </linearGradient>

        {/* Lighter Warm Brown Strap Gradient */}
        <linearGradient id="walletStrapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8C4A25" />
          <stop offset="60%" stopColor="#6B3518" />
          <stop offset="100%" stopColor="#4A220D" />
        </linearGradient>

        {/* Metallic Gold Outline Gradient */}
        <linearGradient id="goldOutline" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE7AB" />
          <stop offset="50%" stopColor="#E0B872" />
          <stop offset="100%" stopColor="#A67624" />
        </linearGradient>

        {/* Button Gold Gradient */}
        <linearGradient id="goldButton" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF2CE" />
          <stop offset="50%" stopColor="#F5C768" />
          <stop offset="100%" stopColor="#C7912E" />
        </linearGradient>

        {/* Drop Shadow */}
        <filter id="walletShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.55" />
        </filter>
      </defs>

      <g filter="url(#walletShadow)">
        {/* Main Wallet Body (Dark Brown Leather with Crisp Gold Outline) */}
        <rect
          x="14"
          y="34"
          width="96"
          height="66"
          rx="16"
          fill="url(#walletBodyGrad)"
          stroke="url(#goldOutline)"
          strokeWidth="3.5"
        />

        {/* Interior Stitching Line Outline */}
        <rect
          x="20"
          y="40"
          width="84"
          height="54"
          rx="11"
          fill="none"
          stroke="#E0B872"
          strokeWidth="1.3"
          strokeDasharray="3.5 2.5"
          opacity="0.7"
        />

        {/* Wallet Strap / Tab (Lighter Brown Leather with Gold Outline) */}
        <path
          d="M 62 53 L 110 53 C 114 53 116 55 116 59 L 116 75 C 116 79 114 81 110 81 L 62 81 C 55 81 50 75 50 67 C 50 59 55 53 62 53 Z"
          fill="url(#walletStrapGrad)"
          stroke="url(#goldOutline)"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* Strap Interior Stitching Accent */}
        <path
          d="M 64 57 L 111 57 M 111 77 L 64 77 C 59 77 55 73 55 67 C 55 61 59 57 64 57 Z"
          fill="none"
          stroke="#E0B872"
          strokeWidth="1"
          strokeDasharray="3 2"
          opacity="0.6"
        />

        {/* Circular Snap Button with Dark Outline */}
        <circle
          cx="68"
          cy="67"
          r="6.5"
          fill="url(#goldButton)"
          stroke="#2B1306"
          strokeWidth="1.8"
        />

        {/* Button Specular Highlight */}
        <circle
          cx="66.5"
          cy="65.5"
          r="1.2"
          fill="#FFFFFF"
          opacity="0.8"
        />
      </g>
    </svg>
  );
}
