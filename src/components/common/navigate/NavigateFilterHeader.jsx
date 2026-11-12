import React from 'react';
import { SlidersHorizontal, Search, X } from 'lucide-react';

/**
 * NavigateFilterHeader - Title, Search Bar & Shortcut Badge (00.12)
 */
export default function NavigateFilterHeader({
  query,
  setQuery,
  onClose,
  inputRef
}) {
  return (
    <div className="space-y-3.5 pb-4 border-b border-[#E3E6EE] dark:border-white/[0.08]">
      {/* Top Title Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-[#0A0F1F] dark:text-white shrink-0">
            <path d="M2.5 4.5H15.5M4.5 9H13.5M7 13.5H11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h2 className="text-base font-bold text-[#0A0F1F] dark:text-white leading-tight">
            Navigate & filter
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <kbd className="px-2 py-0.5 text-xs font-mono text-[#5F6678] dark:text-slate-400 bg-[#F5F6FA] dark:bg-white/[0.06] border border-[#CDD2DE]/60 dark:border-white/[0.08] rounded-[6px] select-none">
            ⌘ /
          </kbd>
          <button
            type="button"
            onClick={onClose}
            className="text-[#5F6678] hover:text-[#0A0F1F] dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            aria-label="Close popover"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-[#5F6678] dark:text-slate-400 absolute left-3.5 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Jump to a module or workflow..."
          className="w-full h-10 pl-10 pr-3.5 rounded-[12px] bg-white dark:bg-white/[0.03] border border-[#CDD2DE] dark:border-white/[0.1] text-xs sm:text-sm text-[#0A0F1F] dark:text-white placeholder:text-[#5F6678]/70 focus:outline-none focus:border-[#2D55F5] focus:ring-1 focus:ring-[#2D55F5] transition-all"
        />
      </div>
    </div>
  );
}
