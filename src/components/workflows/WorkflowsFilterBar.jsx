import React from 'react';
import { Search } from 'lucide-react';

/**
 * WorkflowsFilterBar - Search, Segmented Status Filter & Counter (01.1)
 */
export default function WorkflowsFilterBar({
  search,
  setSearch,
  filter,
  setFilter,
  filteredCount = 5,
  totalCount = 5
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
      {/* Search Input */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 text-[#8E95A9] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by name, domain or table"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#18181C] border border-[#E3E6EE] dark:border-white/[0.08] rounded-xl text-xs text-[#0A0F1F] dark:text-white placeholder:text-[#5F6678]/70 focus:outline-none focus:border-[#2D55F5] focus:ring-1 focus:ring-[#2D55F5] shadow-2xs transition-all"
        />
      </div>

      {/* Segmented Filter Pill & Counter */}
      <div className="flex items-center gap-4">
        <div className="bg-[#EDEFF5] dark:bg-white/[0.06] p-1 rounded-full inline-flex items-center text-xs">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1 rounded-full font-semibold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-white dark:bg-[#2A2B32] text-[#0A0F1F] dark:text-white shadow-2xs'
                : 'text-[#5F6678] dark:text-slate-400 hover:text-[#0A0F1F]'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('live')}
            className={`px-3.5 py-1 rounded-full font-semibold transition-all cursor-pointer ${
              filter === 'live'
                ? 'bg-white dark:bg-[#2A2B32] text-[#0A0F1F] dark:text-white shadow-2xs'
                : 'text-[#5F6678] dark:text-slate-400 hover:text-[#0A0F1F]'
            }`}
          >
            Live
          </button>
          <button
            type="button"
            onClick={() => setFilter('draft')}
            className={`px-3.5 py-1 rounded-full font-semibold transition-all cursor-pointer ${
              filter === 'draft'
                ? 'bg-white dark:bg-[#2A2B32] text-[#0A0F1F] dark:text-white shadow-2xs'
                : 'text-[#5F6678] dark:text-slate-400 hover:text-[#0A0F1F]'
            }`}
          >
            Ready · Draft
          </button>
        </div>

        <span className="text-xs text-[#5F6678] dark:text-slate-400 font-medium shrink-0">
          {filteredCount} of {totalCount} workflows
        </span>
      </div>
    </div>
  );
}
