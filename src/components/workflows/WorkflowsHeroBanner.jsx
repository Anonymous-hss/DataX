import React from 'react';
import { Sparkles } from 'lucide-react';

/**
 * Hero Component Graphic matching exact Figma vector layout
 */
export const HeroIllustration = () => (
  <svg width="450" height="200" viewBox="0 0 450 200" fill="none" className="w-full max-w-[450px] overflow-visible select-none">
    <defs>
      <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#2D55F5" stopOpacity="0.45" />
        <stop offset="60%" stopColor="#1E3A8A" stopOpacity="0.14" />
        <stop offset="100%" stopColor="#0B1536" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Center Ambient Glow */}
    <ellipse cx="225" cy="100" rx="140" ry="85" fill="url(#centerGlow)" />

    {/* Concentric Dashed Orbital Rings */}
    <ellipse cx="225" cy="100" rx="135" ry="72" stroke="#1D2E60" strokeWidth="1.2" strokeDasharray="3 5" opacity="0.75" />
    <ellipse cx="225" cy="100" rx="95" ry="50" stroke="#253D80" strokeWidth="1.2" strokeDasharray="3 4" opacity="0.65" />

    {/* Orbiting Satellite Squares & Dots */}
    <rect x="195" y="27" width="6" height="6" rx="1" fill="#CBF841">
      <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
    </rect>
    <rect x="335" y="60" width="5" height="5" rx="1" fill="#38BDF8" opacity="0.8" />
    <circle cx="328" cy="142" r="3" fill="#38BDF8" opacity="0.75" />

    {/* Left Connection Stream Line */}
    <line x1="82" y1="100" x2="190" y2="100" stroke="#1E336A" strokeWidth="1.5" strokeDasharray="4 4" />
    {/* Left Stream Packets */}
    <rect x="135" y="97.5" width="5.5" height="5.5" rx="1" fill="#CBF841">
      <animate attributeName="x" values="90;185" dur="2.4s" repeatCount="indefinite" />
    </rect>
    <rect x="155" y="97.5" width="5" height="5" rx="1" fill="#38BDF8">
      <animate attributeName="x" values="90;185" begin="0.8s" dur="2.4s" repeatCount="indefinite" />
    </rect>
    <rect x="175" y="97.5" width="5" height="5" rx="1" fill="#38BDF8">
      <animate attributeName="x" values="90;185" begin="1.6s" dur="2.4s" repeatCount="indefinite" />
    </rect>

    {/* Right Connection Stream Line */}
    <line x1="260" y1="100" x2="368" y2="100" stroke="#1E336A" strokeWidth="1.5" strokeDasharray="4 4" />
    {/* Right Stream Packets */}
    <rect x="275" y="97.5" width="5" height="5" rx="1" fill="#38BDF8">
      <animate attributeName="x" values="265;360" dur="2.4s" repeatCount="indefinite" />
    </rect>
    <rect x="295" y="97.5" width="5" height="5" rx="1" fill="#38BDF8">
      <animate attributeName="x" values="265;360" begin="0.8s" dur="2.4s" repeatCount="indefinite" />
    </rect>
    <rect x="315" y="97.5" width="5" height="5" rx="1" fill="#38BDF8">
      <animate attributeName="x" values="265;360" begin="1.6s" dur="2.4s" repeatCount="indefinite" />
    </rect>

    {/* Left Database Cylinder (with Lime Green Top Rim) */}
    <g transform="translate(62, 100)">
      <path d="M-18 -20 V 16 C-18 24, 18 24, 18 16 V -20 Z" fill="#070E22" stroke="#334155" strokeWidth="1.75" />
      <path d="M-18 -8 C-18 -1, 18 -1, 18 -8" stroke="#475569" strokeWidth="1.25" fill="none" />
      <path d="M-18 4 C-18 11, 18 11, 18 4" stroke="#475569" strokeWidth="1.25" fill="none" />
      <ellipse cx="0" cy="-20" rx="18" ry="7" fill="#CBF841" stroke="#A3E635" strokeWidth="1.5" />
    </g>

    {/* Center DataX Squircle Logo */}
    <g transform="translate(225, 100)">
      <rect x="-40" y="-40" width="80" height="80" rx="22" fill="#2D55F5" fillOpacity="0.25" />
      <rect x="-34" y="-34" width="68" height="68" rx="18" fill="#2D55F5" stroke="#60A5FA" strokeWidth="1.75" />
      <g transform="translate(-32, -32)">
        <polygon points="14.5,49.5 24.5,49.5 49.5,14.5 39.5,14.5" fill="#FFFFFF" />
        <polygon points="14.5,14.5 24.5,14.5 31.5,24.5 21.5,24.5" fill="#93C5FD" />
        <polygon points="32.5,39.5 42.5,39.5 49.5,49.5 39.5,49.5" fill="#93C5FD" />
      </g>
    </g>

    {/* Right Database Cylinder (with Blue Top Rim & Green Checkmark Badge) */}
    <g transform="translate(388, 100)">
      <path d="M-18 -20 V 16 C-18 24, 18 24, 18 16 V -20 Z" fill="#070E22" stroke="#334155" strokeWidth="1.75" />
      <path d="M-18 -8 C-18 -1, 18 -1, 18 -8" stroke="#475569" strokeWidth="1.25" fill="none" />
      <path d="M-18 4 C-18 11, 18 11, 18 4" stroke="#475569" strokeWidth="1.25" fill="none" />
      <ellipse cx="0" cy="-20" rx="18" ry="7" fill="#1D4ED8" stroke="#38BDF8" strokeWidth="1.5" />

      {/* Checkmark Circle Badge at Bottom-Right */}
      <g transform="translate(13, 14)">
        <circle cx="0" cy="0" r="9" fill="#22C55E" stroke="#070E22" strokeWidth="2" />
        <polyline points="-3.5,-0.5 -1,2.5 4,-2.5" fill="none" stroke="#FFFFFF" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>
  </svg>
);

/**
 * WorkflowsHeroBanner - Dark Hero Banner with AI Rule Builder flow & live metrics (01.1)
 */
export default function WorkflowsHeroBanner({
  activeCount = 0,
  totalCount = 5,
  meanHealth = '99.2',
  totalRuns = 0,
  autoFixEnabled = true,
  onToggleAutoFix
}) {
  return (
    <div className="w-full bg-[#0B1536] border border-slate-800/80 rounded-[28px] p-8 lg:p-10 relative overflow-hidden shadow-sm">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
        {/* Left Column: Lime Badge, Headline, 3-Step Flow, Metrics Container */}
        <div className="max-w-xl space-y-4">
          {/* Lime Green AI rule builder Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4FF3A] text-[#0A0F1F] font-bold text-xs tracking-tight shadow-sm">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>AI rule builder</span>
          </div>

          {/* Headline */}
          <h2 className="text-2xl sm:text-[28px] lg:text-[32px] font-bold text-white tracking-tight leading-snug">
            Describe the rules in plain English.<br />
            DataX writes them, tests them and keeps them running.
          </h2>

          {/* 3-Step Indicator with Lime Numbers */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-slate-300 pt-1">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#D4FF3A] text-[#0A0F1F] font-bold text-[11px] flex items-center justify-center shrink-0">
                1
              </span>
              <span>Connect a source</span>
            </div>
            <span className="text-slate-500 font-semibold">›</span>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#D4FF3A] text-[#0A0F1F] font-bold text-[11px] flex items-center justify-center shrink-0">
                2
              </span>
              <span>Generate rules with AI</span>
            </div>
            <span className="text-slate-500 font-semibold">›</span>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#D4FF3A] text-[#0A0F1F] font-bold text-[11px] flex items-center justify-center shrink-0">
                3
              </span>
              <span>Test, then run live</span>
            </div>
          </div>

          {/* Metrics Box */}
          <div className="bg-[#060D24]/90 backdrop-blur-md border border-white/5 rounded-2xl px-6 py-3.5 flex flex-wrap items-center gap-8 mt-5 max-w-xl">
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Active workflows</p>
              <p className="text-xl font-bold text-white mt-0.5">{activeCount} / {totalCount}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Mean data health</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xl font-bold text-white">{meanHealth}%</span>
                <span className="bg-[#D4FF3A] text-[#0A0F1F] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  A+
                </span>
              </div>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Runs this week</p>
              <p className="text-xl font-bold text-white mt-0.5">{totalRuns}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Auto-fix</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-bold text-white">{autoFixEnabled ? 'On' : 'Off'}</span>
                <button
                  type="button"
                  onClick={onToggleAutoFix}
                  className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                    autoFixEnabled ? 'bg-[#2D55F5]' : 'bg-slate-700'
                  }`}
                  aria-label="Toggle autonomous remediation"
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      autoFixEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Graphic */}
        <div className="w-full lg:w-auto flex justify-center shrink-0">
          <HeroIllustration />
        </div>
      </div>
    </div>
  );
}

