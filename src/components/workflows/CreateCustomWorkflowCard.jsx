import React from 'react';

/**
 * 4th Card in Threads Grid: "Start a new thread" matching Screenshot
 */
export default function CreateCustomWorkflowCard({ onNewThread }) {
  return (
    <div 
      onClick={onNewThread}
      className="border-2 border-dashed border-[#D2D6E2] dark:border-white/[0.12] rounded-[22px] p-6 flex flex-col items-center justify-center text-center bg-white dark:bg-white/[0.015] hover:border-[#2D55F5]/40 transition-all cursor-pointer group min-h-[290px]"
    >
      {/* Document Icon with folded corner and Blue Plus Badge */}
      <div className="relative w-12 h-12 flex items-center justify-center">
        <svg width="32" height="38" viewBox="0 0 32 38" fill="none" className="text-[#0A0F1F] dark:text-white">
          <path 
            d="M3 6C3 4.34315 4.34315 3 6 3H20L29 12V32C29 33.6569 27.6569 35 26 35H6C4.34315 35 3 33.6569 3 32V6Z" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            fill="none"
          />
          <path 
            d="M20 3V12H29" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <line x1="8" y1="20" x2="20" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <line x1="8" y1="26" x2="24" y2="26" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>

        {/* Blue Plus Badge */}
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#2D55F5] border-2 border-white dark:border-[#18181C] flex items-center justify-center text-white text-[11px] font-bold shadow-2xs">
          +
        </div>
      </div>

      {/* Heading */}
      <h3 className="font-bold text-sm text-[#0A0F1F] dark:text-white mt-4 group-hover:text-[#2D55F5] transition-colors">
        Start a new thread
      </h3>

      {/* Subtitle */}
      <p className="text-xs text-[#5F6678] dark:text-slate-400 mt-1">
        Empty canvas or a domain pack
      </p>

      {/* Action Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onNewThread();
        }}
        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#EFF4FF] hover:bg-[#E0EAFF] text-[#2D55F5] text-xs font-semibold transition-all mt-4 cursor-pointer"
      >
        <span>+ New thread</span>
      </button>
    </div>
  );
}
