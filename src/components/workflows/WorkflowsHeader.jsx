import React from 'react';

/**
 * WorkflowsHeader - Threads Header with "+ New thread" primary action matching Screenshot
 */
export default function WorkflowsHeader({ onNewThread }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-[32px] font-bold text-[#0A0F1F] dark:text-white tracking-tight leading-tight">
          Threads
        </h1>
        <p className="text-sm text-[#5F6678] dark:text-slate-400 mt-1">
          Each thread reads from a source, checks every row with rules written by AI, and writes clean rows to a target.
        </p>
      </div>

      <button
        type="button"
        onClick={onNewThread}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2D55F5] hover:bg-[#2045DC] text-white text-sm font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer shrink-0"
      >
        <span className="text-base leading-none font-normal">+</span>
        <span>New thread</span>
      </button>
    </div>
  );
}
