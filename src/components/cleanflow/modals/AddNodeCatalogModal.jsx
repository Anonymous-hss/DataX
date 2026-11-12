import React from 'react';
import { X, Search, Sparkles } from 'lucide-react';
import { OPERATIONAL_CATALOG } from '../constants/nodeCatalog';

export default function AddNodeCatalogModal({
  isOpen,
  onClose,
  addNodeSearch,
  setAddNodeSearch,
  handleAddNodeFromCatalog,
  onOpenAiBuild
}) {
  if (!isOpen) return null;

  const getCategoryTitle = (catStr) => {
    if (catStr.includes('Sources')) return 'SOURCES';
    if (catStr.includes('Intelligence')) return 'INTELLIGENCE & TRANSFORMS';
    if (catStr.includes('Routing')) return 'ROUTING & REVIEW';
    if (catStr.includes('Targets')) return 'TARGETS';
    return catStr.toUpperCase();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#18181C] rounded-[24px] border border-[#E2E8F0] dark:border-white/[0.1] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[88vh] cursor-default font-sans animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="p-6 pb-4 flex items-start justify-between">
          <div>
            <span className="text-xs text-[#5F6678] dark:text-slate-400 block leading-tight">
              Sources, intelligence, routing and targets
            </span>
            <h3 className="text-xl font-bold text-[#0A0F1F] dark:text-white mt-1">
              Add a node
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8C93A3] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search nodes, e.g. SAP, Postgres, router..."
              value={addNodeSearch}
              onChange={(e) => setAddNodeSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/[0.04] border border-[#CDD2DE] dark:border-white/[0.12] rounded-2xl text-xs text-[#0A0F1F] dark:text-white placeholder:text-[#8C93A3] focus:outline-none focus:ring-2 focus:ring-[#2D55F5]/30 font-sans"
              autoFocus
            />
          </div>
        </div>

        {/* AI Helper Banner */}
        <div className="px-6 pb-4">
          <div className="p-3.5 px-4 rounded-2xl bg-[#F0F5FF] dark:bg-[#2D55F5]/10 border border-[#D0E0FF] dark:border-[#2D55F5]/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Sparkles className="w-4 h-4 text-[#2D55F5] shrink-0" />
              <div className="min-w-0 text-xs">
                <span className="font-semibold text-[#0A0F1F] dark:text-white mr-1.5">
                  Not sure which node fits?
                </span>
                <span className="text-[#5F6678] dark:text-slate-300">
                  Describe the step and get suggestions with a reason for each.
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                if (onOpenAiBuild) onOpenAiBuild();
              }}
              className="px-3 py-1.5 rounded-full bg-white dark:bg-[#18181C] hover:bg-blue-50 text-xs font-semibold text-[#2D55F5] border border-[#D0E0FF] shrink-0 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3 h-3 text-[#2D55F5]" />
              <span>Build with AI</span>
            </button>
          </div>
        </div>

        {/* Catalog Grid */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
          {OPERATIONAL_CATALOG.map((cat) => {
            const filtered = cat.items.filter(
              (item) =>
                !addNodeSearch ||
                item.name.toLowerCase().includes(addNodeSearch.toLowerCase()) ||
                item.desc.toLowerCase().includes(addNodeSearch.toLowerCase())
            );
            if (filtered.length === 0) return null;

            return (
              <div key={cat.category} className="space-y-3">
                <h4 className="text-[11px] font-bold tracking-wider text-[#5F6678] dark:text-slate-400">
                  {getCategoryTitle(cat.category)}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filtered.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={idx}
                        onClick={() => handleAddNodeFromCatalog(item)}
                        className="p-3.5 rounded-2xl border border-[#E2E8F0] dark:border-white/[0.1] hover:border-[#2D55F5] hover:bg-[#F0F5FF]/30 dark:hover:bg-[#2D55F5]/10 bg-white dark:bg-[#18181C] transition-all cursor-pointer flex items-start gap-3 group shadow-2xs hover:shadow-xs"
                      >
                        <div className="w-9 h-9 rounded-xl bg-[#F8FAFC] dark:bg-white/[0.05] border border-[#EEF2F6] dark:border-white/[0.08] flex items-center justify-center shrink-0 text-[#2D55F5]">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-semibold text-[#0A0F1F] dark:text-white group-hover:text-[#2D55F5] truncate block">
                            {item.name}
                          </span>
                          <p className="text-[11px] text-[#5F6678] dark:text-slate-400 line-clamp-1 mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#F1F3F7] dark:border-white/[0.08] bg-white dark:bg-[#18181C] flex items-center justify-between text-xs text-[#5F6678] dark:text-slate-400">
          <span>Click a node to place it on the canvas.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full border border-[#CDD2DE] dark:border-white/[0.12] bg-white dark:bg-[#18181C] text-[#0A0F1F] dark:text-white hover:bg-slate-50 font-semibold cursor-pointer transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
