import React from 'react';
import { LayoutGrid } from 'lucide-react';

/**
 * Custom Workflow Vector Icon matching 01.1
 */
const CustomWorkflowIcon = () => (
  <div className="w-12 h-12 rounded-2xl bg-[#0B1536] text-white flex items-center justify-center relative shadow-sm">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
      <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
    </svg>
    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#2D55F5] border-2 border-white dark:border-[#18181C] flex items-center justify-center text-white text-[11px] font-bold">
      +
    </div>
  </div>
);

/**
 * CreateCustomWorkflowCard - 6th Card in Grid matching 01.1
 */
export default function CreateCustomWorkflowCard({ onOpenCanvas }) {
  return (
    <div 
      onClick={onOpenCanvas}
      className="border-2 border-dashed border-[#CDD2DE] dark:border-white/[0.12] rounded-[22px] p-6 sm:p-7 flex flex-col items-center justify-center text-center bg-[#FBFBFC] dark:bg-white/[0.015] hover:border-[#2D55F5]/50 hover:bg-[#F8FAFF] dark:hover:bg-white/[0.03] transition-all cursor-pointer group min-h-[300px]"
    >
      <CustomWorkflowIcon />

      <h3 className="font-bold text-sm sm:text-base text-[#0A0F1F] dark:text-white mt-4 group-hover:text-[#2D55F5] transition-colors">
        Create a custom workflow
      </h3>

      <p className="text-xs text-[#5F6678] dark:text-slate-400 mt-2 max-w-[260px] leading-relaxed">
        Connect any database, S3 bucket or LLM endpoint and draft rules with AI.
      </p>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenCanvas();
        }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-white/[0.06] border border-[#E3E6EE] dark:border-white/[0.1] text-xs font-semibold text-[#2D55F5] dark:text-blue-400 group-hover:border-[#2D55F5]/40 transition-all mt-6 shadow-2xs cursor-pointer"
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        <span>Open visual canvas</span>
      </button>
    </div>
  );
}
