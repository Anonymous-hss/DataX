import React from 'react';

// Hero illustration for Threads dashboard
export const HeroIllustration = ({ className = '' }) => (
  <svg width="480" height="240" viewBox="0 0 480 240" fill="none" className={`max-w-full h-auto ${className}`}>
    <defs>
      <radialGradient id="heroGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#2D55F5" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#0A0F1F" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="pipelineBeam" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#D4FF3A" />
        <stop offset="50%" stopColor="#2D55F5" />
        <stop offset="100%" stopColor="#FFFFFF" />
      </linearGradient>
    </defs>

    <ellipse cx="240" cy="120" rx="180" ry="90" fill="url(#heroGlow)" />
    <ellipse cx="240" cy="120" rx="160" ry="70" stroke="#2D55F5" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
    <ellipse cx="240" cy="120" rx="90" ry="40" stroke="#2D55F5" strokeWidth="1" opacity="0.4" />
    <line x1="80" y1="120" x2="400" y2="120" stroke="url(#pipelineBeam)" strokeWidth="2.5" strokeLinecap="round" />

    <g transform="translate(80, 120)">
      <circle cx="0" cy="0" r="24" fill="#161C30" stroke="#232B45" strokeWidth="2" />
      <circle cx="0" cy="0" r="14" fill="#D4FF3A" />
      <circle cx="0" cy="0" r="6" fill="#0A0F1F" />
      <text x="0" y="38" textAnchor="middle" fill="#A6ADC2" fontSize="10" fontFamily="monospace">SOURCE</text>
    </g>

    <g transform="translate(240, 120)">
      <rect x="-42" y="-36" width="84" height="72" rx="16" fill="#161C30" stroke="#2D55F5" strokeWidth="2" />
      <rect x="-34" y="-28" width="68" height="56" rx="10" fill="#2D55F5" fillOpacity="0.1" />
      <rect x="-24" y="-18" width="48" height="8" rx="4" fill="#2D55F5" />
      <rect x="-24" y="-6" width="36" height="8" rx="4" fill="#D4FF3A" />
      <rect x="-24" y="6" width="48" height="8" rx="4" fill="#FFFFFF" fillOpacity="0.8" />
      <circle cx="28" cy="-22" r="3.5" fill="#D4FF3A" />
      <text x="0" y="52" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="600">AI RULE ENGINE</text>
    </g>

    <g transform="translate(400, 120)">
      <circle cx="0" cy="0" r="24" fill="#161C30" stroke="#232B45" strokeWidth="2" />
      <circle cx="0" cy="0" r="14" fill="#FFFFFF" />
      <polyline points="-4,-1 -1,2 5,-4" stroke="#0A0F1F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <text x="0" y="38" textAnchor="middle" fill="#A6ADC2" fontSize="10" fontFamily="monospace">TARGET</text>
    </g>
  </svg>
);

export const IlloSource = ({ size = 36, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={`shrink-0 ${className}`}>
    <rect width="48" height="48" rx="12" fill="#ECF0FF" />
    <path d="M14 18c0-3.3 4.5-6 10-6s10 2.7 10 6v12c0 3.3-4.5 6-10 6s-10-2.7-10-6V18z" fill="#FFFFFF" stroke="#2D55F5" strokeWidth="2" />
    <ellipse cx="24" cy="18" rx="10" ry="4" fill="#DCE4FF" stroke="#2D55F5" strokeWidth="2" />
    <path d="M14 24c0 2.2 4.5 4 10 4s10-1.8 10-4" stroke="#2D55F5" strokeWidth="2" />
    <path d="M14 30c0 2.2 4.5 4 10 4s10-1.8 10-4" stroke="#2D55F5" strokeWidth="2" />
    <circle cx="34" cy="14" r="3" fill="#D4FF3A" />
  </svg>
);

export const IlloPack = ({ size = 36, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={`shrink-0 ${className}`}>
    <rect width="48" height="48" rx="12" fill="#E7F6EE" />
    <polygon points="24 12 36 18 24 24 12 18 24 12" fill="#FFFFFF" stroke="#127A52" strokeWidth="2" />
    <polygon points="12 22 24 28 36 22 36 26 24 32 12 26 12 22" fill="#BFE6D2" stroke="#127A52" strokeWidth="2" />
    <polygon points="12 28 24 34 36 28 36 32 24 38 12 32 12 28" fill="#127A52" stroke="#127A52" strokeWidth="2" />
  </svg>
);

export const IlloDoc = ({ size = 36, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={`shrink-0 ${className}`}>
    <rect width="48" height="48" rx="12" fill="#F5F6FA" />
    <rect x="14" y="10" width="20" height="28" rx="4" fill="#FFFFFF" stroke="#474E61" strokeWidth="2" />
    <line x1="18" y1="16" x2="26" y2="16" stroke="#2D55F5" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="18" y1="22" x2="30" y2="22" stroke="#A6ADC2" strokeWidth="2" strokeLinecap="round" />
    <line x1="18" y1="28" x2="28" y2="28" stroke="#A6ADC2" strokeWidth="2" strokeLinecap="round" />
    <circle cx="28" cy="32" r="2.5" fill="#D4FF3A" />
  </svg>
);

export const AvatarDX = ({ size = 34, className = '' }) => (
  <div
    className={`rounded-full bg-gradient-to-tr from-[#2D55F5] to-[#6085FF] flex items-center justify-center text-white font-semibold text-xs tracking-tight shrink-0 select-none shadow-sm ${className}`}
    style={{ width: `${size}px`, height: `${size}px` }}
  >
    DX
  </div>
);
