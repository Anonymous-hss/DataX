import React from 'react';
import { Wrench } from 'lucide-react';

/**
 * WorkflowsHeader - Module 01 Top Title & Use Case Advisor Trigger (01.1)
 */
export default function WorkflowsHeader({ onOpenAdvisor }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-[32px] font-bold text-[#0A0F1F] dark:text-white tracking-tight leading-tight">
          Workflows
        </h1>
        <p className="text-sm text-[#5F6678] dark:text-slate-400 mt-1">
          Each workflow reads from a source, checks every row with rules written by AI, and writes clean rows to a target.
        </p>
      </div>

      <button
        type="button"
        onClick={onOpenAdvisor}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white dark:bg-[#18181C] border border-[#E3E6EE] dark:border-white/[0.08] hover:border-[#2D55F5]/40 text-[#0A0F1F] dark:text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer shrink-0"
      >
        <Wrench className="w-3.5 h-3.5 text-[#5F6678] dark:text-slate-400" />
        <span>Use case advisor</span>
      </button>
    </div>
  );
}

