import React from 'react';
import { Search } from 'lucide-react';

/**
 * WorkflowsFilterBar - Search, 3-tab Segmented Control ('All', 'Live', 'Draft') and Counter matching Screenshot
 */
export default function WorkflowsFilterBar({
  search,
  setSearch,
  filter,
  setFilter,
  filteredCount = 3,
  totalCount = 5
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
      {/* Search Input matching Screenshot */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 text-[#8E95A9] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search threads by name, system or owner"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#18181C] border border-[#E3E6EE] dark:border-white/[0.08] rounded-xl text-xs text-[#0A0F1F] dark:text-white placeholder:text-[#8E95A9] focus:outline-none focus:border-[#2D55F5] focus:ring-1 focus:ring-[#2D55F5] shadow-2xs transition-all"
        />
      </div>

      {/* Segmented Filter Pill & Counter matching Screenshot */}
      <div className="flex items-center gap-4">
        <div className="bg-[#EDEFF5] dark:bg-white/[0.06] p-1 rounded-full inline-flex items-center text-xs">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-4 py-1 rounded-full font-semibold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-white dark:bg-[#2A2B32] text-[#0A0F1F] dark:text-white shadow-2xs'
                : 'text-[#5F6678] dark:text-slate-400 hover:text-[#0A0F1F]'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter('live')}
            className={`px-4 py-1 rounded-full font-semibold transition-all cursor-pointer ${
              filter === 'live'
                ? 'bg-white dark:bg-[#2A2B32] text-[#2D55F5] dark:text-white shadow-2xs'
                : 'text-[#5F6678] dark:text-slate-400 hover:text-[#0A0F1F]'
            }`}
          >
            Live
          </button>
          <button
            type="button"
            onClick={() => setFilter('draft')}
            className={`px-4 py-1 rounded-full font-semibold transition-all cursor-pointer ${
              filter === 'draft'
                ? 'bg-white dark:bg-[#2A2B32] text-[#0A0F1F] dark:text-white shadow-2xs'
                : 'text-[#5F6678] dark:text-slate-400 hover:text-[#0A0F1F]'
            }`}
          >
            Draft
          </button>
        </div>

        <span className="text-xs text-[#5F6678] dark:text-slate-400 font-medium shrink-0">
          {filteredCount} of {totalCount} threads
        </span>
      </div>
    </div>
  );
}
