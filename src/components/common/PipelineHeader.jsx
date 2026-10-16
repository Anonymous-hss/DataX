import React from 'react';
import { Link } from '../../context/NavigationContext';

// User-Provided Official DataX Logo
const DataXLogo = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className="shrink-0">
    <rect width="64" height="64" rx="16" fill="#2D55F5" />
    <polygon points="14.5,49.5 24.5,49.5 49.5,14.5 39.5,14.5" fill="#FFFFFF" />
    <polygon points="14.5,14.5 24.5,14.5 31.5,24.5 21.5,24.5" fill="#D4FF3A" />
    <polygon points="32.5,39.5 42.5,39.5 49.5,49.5 39.5,49.5" fill="#D4FF3A" />
  </svg>
);

export default function PipelineHeader({ currentStep = 1, threadTitle = 'SAP BW → S/4HANA Clean Core' }) {
  const steps = [
    { num: 1, label: 'Source', screen: 'connect-source', desc: 'SAP BW InfoCube' },
    { num: 2, label: 'Target', screen: 'connect-target', desc: 'S/4HANA Clean Core' },
    { num: 3, label: 'Rules', screen: 'rules', desc: 'AI Rule Builder' },
    { num: 4, label: 'Dry run', screen: 'running-dry-run', desc: 'Live Simulation' },
    { num: 5, label: 'Results', screen: 'dry-run-results', desc: 'Auto-Fix & Writeback' },
  ];

  return (
    <div className="w-full bg-white border-b border-[#E3E6EE] sticky top-0 z-40 shadow-xs font-sans">
      {/* Top Navbar Row */}
      <div className="max-w-[1360px] mx-auto px-6 h-14 flex items-center justify-between border-b border-[#F0F2F6]">
        {/* Breadcrumbs with Logo */}
        <div className="flex items-center gap-3">
          <Link to="threads" className="flex items-center gap-2 hover:opacity-85 transition-opacity">
            <DataXLogo size={28} />
            <span className="font-bold text-[#0A0F1F] tracking-tight text-base">DataX</span>
          </Link>
          <span className="text-[#CDD2DE] font-light">/</span>
          <Link to="threads" className="text-xs text-[#5F6678] hover:text-[#0A0F1F] font-medium transition-colors">
            Threads
          </Link>
          <span className="text-[#CDD2DE] font-light">/</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#0A0F1F] truncate max-w-[280px] sm:max-w-md">
              {threadTitle}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E7F6EE] text-[#127A52] text-[10px] font-semibold border border-[#BFE6D2]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#127A52]" /> Live
            </span>
          </div>
        </div>

        {/* Right Action: Quick Exit to Threads */}
        <div className="flex items-center gap-3">
          <Link
            to="history"
            className="text-xs text-[#5F6678] hover:text-[#0A0F1F] font-medium px-3 py-1.5 rounded-full hover:bg-[#F5F6FA] transition-colors"
          >
            Run History
          </Link>
          <Link
            to="threads"
            className="text-xs font-medium text-[#474E61] hover:text-[#0A0F1F] px-3.5 py-1.5 rounded-full border border-[#CDD2DE] hover:bg-[#F5F6FA] transition-all"
          >
            Exit to Threads
          </Link>
        </div>
      </div>

      {/* Interactive 5-Step Stepper matching Figma */}
      <div className="bg-[#F8F9FA] px-6 py-2.5">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-3 overflow-x-auto">
          {steps.map((s, idx) => {
            const isActive = currentStep === s.num;
            const isDone = currentStep > s.num;

            return (
              <React.Fragment key={s.num}>
                <Link
                  to={s.screen}
                  className={`flex items-center gap-3 px-3.5 py-2 rounded-[14px] border transition-all cursor-pointer flex-1 min-w-[170px] ${
                    isActive
                      ? 'border-[#2D55F5] bg-white shadow-[0_0_0_3px_rgba(45,85,245,0.12)]'
                      : isDone
                      ? 'border-[#BFE6D2] bg-white hover:border-[#2D55F5]'
                      : 'border-[#E3E6EE] bg-white/70 hover:bg-white hover:border-[#CDD2DE] opacity-80'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-[7px] flex items-center justify-center text-xs font-bold shrink-0 ${
                      isActive
                        ? 'bg-[#2D55F5] text-white'
                        : isDone
                        ? 'bg-[#127A52] text-white'
                        : 'bg-[#EDEFF5] text-[#5F6678]'
                    }`}
                  >
                    {isDone ? '✓' : s.num}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-medium text-[#5F6678] leading-none">Step {s.num}</span>
                    <span className="text-[12px] font-bold text-[#0A0F1F] leading-tight truncate mt-0.5">
                      {s.label}
                    </span>
                    <span className="text-[10px] text-[#5F6678] leading-none truncate mt-0.5">
                      {s.desc}
                    </span>
                  </div>
                  {isDone && (
                    <span className="ml-auto text-[10px] font-semibold text-[#127A52] bg-[#E7F6EE] px-1.5 py-0.5 rounded-full shrink-0">
                      Done
                    </span>
                  )}
                  {isActive && (
                    <span className="ml-auto text-[10px] font-bold text-[#2D55F5] bg-[#EEF2FF] px-1.5 py-0.5 rounded-full shrink-0">
                      Active
                    </span>
                  )}
                </Link>

                {idx < steps.length - 1 && (
                  <div className="hidden lg:flex items-center text-[#CDD2DE] shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
