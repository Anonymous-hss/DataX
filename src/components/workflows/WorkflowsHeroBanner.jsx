import React from 'react';

/**
 * Hero Component Graphic matching exact pixel-perfect vector layout from Screenshot
 */
export const HeroIllustration = () => (
  <svg width="440" height="190" viewBox="0 0 440 190" fill="none" className="w-full max-w-[440px] overflow-visible select-none">
    <defs>
      <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#2D55F5" stopOpacity="0.45" />
        <stop offset="50%" stopColor="#1E3A8A" stopOpacity="0.18" />
        <stop offset="100%" stopColor="#0A0F1F" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Center Ambient Radial Glow */}
    <ellipse cx="220" cy="95" rx="130" ry="85" fill="url(#centerGlow)" />

    {/* Concentric Dashed Circular Orbital Rings */}
    <ellipse cx="220" cy="95" rx="58" ry="58" stroke="#253D80" strokeWidth="1.25" strokeDasharray="3 4" opacity="0.75" />
    <ellipse cx="220" cy="95" rx="98" ry="98" stroke="#1D2E60" strokeWidth="1.2" strokeDasharray="3 5" opacity="0.65" />
    <ellipse cx="220" cy="95" rx="142" ry="142" stroke="#172652" strokeWidth="1.1" strokeDasharray="3 6" opacity="0.45" />

    {/* Orbiting Satellite Dots & Light Lime Squares */}
    <rect x="172" y="24" width="6" height="6" rx="1.5" fill="#D2F442" opacity="0.95" />
    <circle cx="220" cy="37" r="2" fill="#D2F442" opacity="0.8" />
    <circle cx="346" cy="46" r="2.5" fill="#93C5FD" opacity="0.6" />
    <circle cx="338" cy="148" r="3" fill="#38BDF8" opacity="0.85" />
    <circle cx="112" cy="154" r="2" fill="#38BDF8" opacity="0.5" />

    {/* Horizontal Connection Stream Line */}
    <line x1="82" y1="95" x2="358" y2="95" stroke="#1E336A" strokeWidth="1.5" strokeDasharray="3 4" />

    {/* Stream Data Packets: Left stream has light lime #D2F442 squares */}
    <rect x="122" y="92.5" width="5" height="5" rx="1" fill="#D2F442" />
    <rect x="142" y="92.5" width="5" height="5" rx="1" fill="#D2F442" />
    <rect x="162" y="92.5" width="5" height="5" rx="1" fill="#D2F442" />

    {/* Right stream has sky blue #38BDF8 squares */}
    <rect x="274" y="92.5" width="5" height="5" rx="1" fill="#38BDF8" opacity="0.95" />
    <rect x="294" y="92.5" width="5" height="5" rx="1" fill="#38BDF8" opacity="0.8" />
    <rect x="314" y="92.5" width="5" height="5" rx="1" fill="#38BDF8" opacity="0.6" />

    {/* Left Database Cylinder (with Lime Green #D2F442 Top Rim) */}
    <g transform="translate(65, 95)">
      <path d="M-17 -18 V 16 C-17 23, 17 23, 17 16 V -18 Z" fill="#070E22" stroke="#334155" strokeWidth="1.75" />
      <path d="M-17 -6 C-17 1, 17 1, 17 -6" stroke="#475569" strokeWidth="1.25" fill="none" />
      <path d="M-17 6 C-17 13, 17 13, 17 6" stroke="#475569" strokeWidth="1.25" fill="none" />
      <ellipse cx="0" cy="-18" rx="17" ry="7" fill="#D2F442" stroke="#B0DE18" strokeWidth="1.5" />
    </g>

    {/* Center DataX Squircle Logo (X mark features signature Light Lime #D2F442 leg) */}
    <g transform="translate(220, 95)">
      {/* Outer ambient border & squircle */}
      <rect x="-37" y="-37" width="74" height="74" rx="20" fill="#2B55F5" fillOpacity="0.2" />
      <rect x="-34" y="-34" width="68" height="68" rx="18" fill="#2B55F5" stroke="#5E8AFF" strokeWidth="1.75" />
      
      {/* DataX Logo Icon */}
      <g transform="translate(-32, -32)">
        {/* Main white diagonal bar */}
        <polygon points="14.5,49.5 24.5,49.5 49.5,14.5 39.5,14.5" fill="#FFFFFF" />
        {/* Top-left white diagonal branch */}
        <polygon points="14.5,14.5 24.5,14.5 31.5,24.5 21.5,24.5" fill="#FFFFFF" />
        {/* Bottom-right diagonal leg: Exact Light Lime Green #D2F442 */}
        <polygon points="32.5,39.5 42.5,39.5 49.5,49.5 39.5,49.5" fill="#D2F442" />
      </g>
    </g>

    {/* Right Database Cylinder (with Blue Top Rim & Light Lime Checkmark Badge) */}
    <g transform="translate(375, 95)">
      <path d="M-17 -18 V 16 C-17 23, 17 23, 17 16 V -18 Z" fill="#070E22" stroke="#334155" strokeWidth="1.75" />
      <path d="M-17 -6 C-17 1, 17 1, 17 -6" stroke="#475569" strokeWidth="1.25" fill="none" />
      <path d="M-17 6 C-17 13, 17 13, 17 6" stroke="#475569" strokeWidth="1.25" fill="none" />
      <ellipse cx="0" cy="-18" rx="17" ry="7" fill="#2D55F5" stroke="#60A5FA" strokeWidth="1.5" />

      {/* Checkmark Circle Badge at Bottom-Right */}
      <g transform="translate(12, 13)">
        <circle cx="0" cy="0" r="9" fill="#D2F442" stroke="#070E22" strokeWidth="2" />
        <polyline points="-3.5,-0.5 -1,2.5 4,-2.5" fill="none" stroke="#070E22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>
  </svg>
);

/**
 * 4-Point Sparkle Icon for the AI rule builder Badge
 */
const SparkleIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="shrink-0">
    <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z" />
  </svg>
);

/**
 * WorkflowsHeroBanner - Dark Hero Banner matching exact Screenshot design
 */
export default function WorkflowsHeroBanner({
  activeCount = 3,
  totalCount = 5,
  meanHealth = '87.1',
  totalRuns = 69,
  autoFixEnabled = true
}) {
  return (
    <div 
      style={{
        background: 'linear-gradient(268.87deg, #0A0F1F 43.11%, #2B4085 96.75%)'
      }}
      className="w-full border border-white/[0.08] rounded-[24px] px-7 py-6 sm:px-9 sm:py-7 relative overflow-hidden shadow-md font-sans"
    >
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8 relative z-10">
        {/* Left Column: Lime Badge, Headline, 3-Step Flow, Metrics Container */}
        <div className="max-w-xl space-y-3.5">
          {/* Lime Green AI rule builder Badge with 4-point sparkle icon */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#D2F442] text-[#0A0F1F] font-bold text-[11px] tracking-tight shadow-sm">
            <SparkleIcon />
            <span>AI rule builder</span>
          </div>

          {/* Headline matching exact font, size and weights */}
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
            Describe the rules in plain English.<br />
            DataX writes them, tests them and keeps them running.
          </h2>

          {/* 3-Step Indicator with Lime Numbers */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 pt-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-4.5 h-4.5 rounded-full bg-[#D2F442] text-[#0A0F1F] font-bold text-[10px] flex items-center justify-center shrink-0">
                1
              </span>
              <span className="font-normal text-slate-200">Connect a source</span>
            </div>
            <span className="text-slate-400 font-light px-0.5">›</span>
            <div className="flex items-center gap-1.5">
              <span className="w-4.5 h-4.5 rounded-full bg-[#D2F442] text-[#0A0F1F] font-bold text-[10px] flex items-center justify-center shrink-0">
                2
              </span>
              <span className="font-normal text-slate-200">Generate rules with AI</span>
            </div>
            <span className="text-slate-400 font-light px-0.5">›</span>
            <div className="flex items-center gap-1.5">
              <span className="w-4.5 h-4.5 rounded-full bg-[#D2F442] text-[#0A0F1F] font-bold text-[10px] flex items-center justify-center shrink-0">
                3
              </span>
              <span className="font-normal text-slate-200">Test, then run live</span>
            </div>
          </div>

          {/* Metrics Box with exact vertical dividers matching Screenshot */}
          <div className="bg-[#060D24]/85 border border-white/[0.08] rounded-2xl px-5 py-3 flex flex-wrap items-center divide-x divide-white/10 mt-5 max-w-xl">
            <div className="pr-6">
              <p className="text-[11px] text-slate-400 font-medium">Active workflows</p>
              <p className="text-lg sm:text-xl font-bold text-white mt-0.5">{activeCount} / {totalCount}</p>
            </div>
            <div className="px-6">
              <p className="text-[11px] text-slate-400 font-medium">Mean data health</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-lg sm:text-xl font-bold text-white">{meanHealth}%</span>
                <span className="bg-[#D2F442] text-[#0A0F1F] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  A+
                </span>
              </div>
            </div>
            <div className="px-6">
              <p className="text-[11px] text-slate-400 font-medium">Runs this week</p>
              <p className="text-lg sm:text-xl font-bold text-white mt-0.5">{totalRuns}</p>
            </div>
            <div className="pl-6">
              <p className="text-[11px] text-slate-400 font-medium">Auto-fix</p>
              <p className="text-lg sm:text-xl font-bold text-[#D2F442] mt-0.5">
                {autoFixEnabled ? 'On' : 'Off'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Graphic (Static exact colors, no motion graphics) */}
        <div className="w-full lg:w-auto flex justify-center shrink-0">
          <HeroIllustration />
        </div>
      </div>
    </div>
  );
}
