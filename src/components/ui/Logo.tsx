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
        {/* Rich Obsidian Leather Gradient */}
        <linearGradient id="logoLeatherGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4A2312" />
          <stop offset="50%" stopColor="#2A1208" />
          <stop offset="100%" stopColor="#150803" />
        </linearGradient>

        {/* Metallic Gold Gradient */}
        <linearGradient id="logoGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF0C7" />
          <stop offset="45%" stopColor="#E4BA75" />
          <stop offset="100%" stopColor="#9E7020" />
        </linearGradient>

        {/* Bright Gold Node Gradient */}
        <linearGradient id="logoGoldNode" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF8E0" />
          <stop offset="60%" stopColor="#F5C768" />
          <stop offset="100%" stopColor="#B88222" />
        </linearGradient>
      </defs>

      {/* Outer Squircle Container with Subtle Gold Ring */}
      <rect
        x="10"
        y="10"
        width="108"
        height="108"
        rx="30"
        fill="url(#logoLeatherGrad)"
        stroke="url(#logoGoldGrad)"
        strokeWidth="2.5"
      />

      {/* Minimalist Symbolic Geometry */}
      {/* 1. Base 'L' Monogram & Leather Spine */}
      <path
        d="M 38 36 V 92 H 88"
        stroke="url(#logoGoldGrad)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 2. Wallet Flap Loop */}
      <path
        d="M 44 48 H 70 C 78.8 48 86 55.2 86 64 C 86 72.8 78.8 80 70 80 H 52 C 47.6 80 44 76.4 44 72 V 48 Z"
        fill="none"
        stroke="url(#logoGoldGrad)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />

      {/* 3. Symbolic Clasp/Node Emblem */}
      <circle
        cx="70"
        cy="64"
        r="6"
        fill="url(#logoGoldNode)"
        stroke="#1D0B04"
        strokeWidth="1.5"
      />
    </svg>
  );
}
