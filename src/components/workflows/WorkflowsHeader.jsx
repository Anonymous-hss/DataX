import React from 'react';
import { IconAdvisor } from '../icons';

/**
 * WorkflowsHeader - Header with "Use case advisor" pill button matching Image 1 & 3
 */
export default function WorkflowsHeader({ onNewThread, onOpenAdvisor }) {
  const handleAdvisorClick = onOpenAdvisor || onNewThread;

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
        onClick={handleAdvisorClick}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D0D5DD] dark:border-slate-700 bg-transparent hover:bg-slate-100/60 dark:hover:bg-slate-800/40 text-[#0A0F1F] dark:text-white text-[13px] sm:text-sm font-medium transition-colors cursor-pointer shrink-0"
      >
        <IconAdvisor size={14} className="text-[#0A0F1F] dark:text-white" />
        <span>Use case advisor</span>
      </button>
    </div>
  );
}
