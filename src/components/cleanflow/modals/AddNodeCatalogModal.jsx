import React from 'react';
import { Plus, X, Search } from 'lucide-react';
import { OPERATIONAL_CATALOG } from '../constants/nodeCatalog';

export default function AddNodeCatalogModal({
  isOpen,
  onClose,
  addNodeSearch,
  setAddNodeSearch,
  handleAddNodeFromCatalog,
}) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add Operational Node</h3>
              <p className="text-xs text-slate-500">Select a verified source, intelligence engine, or target destination</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search operational nodes, SAP, Postgres, intelligence engine..."
              value={addNodeSearch}
              onChange={(e) => setAddNodeSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              autoFocus
            />
          </div>
        </div>

        {/* Catalog Grid */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {OPERATIONAL_CATALOG.map((cat) => {
            const filtered = cat.items.filter(
              (item) =>
                !addNodeSearch ||
                item.name.toLowerCase().includes(addNodeSearch.toLowerCase()) ||
                item.desc.toLowerCase().includes(addNodeSearch.toLowerCase())
            );
            if (filtered.length === 0) return null;

            return (
              <div key={cat.category} className="space-y-2.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {cat.category}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filtered.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={idx}
                        onClick={() => handleAddNodeFromCatalog(item)}
                        className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 transition-all cursor-pointer flex items-start gap-3 group shadow-2xs hover:shadow-xs"
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                            item.variant === 'green'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                              : item.variant === 'orange'
                                ? 'bg-amber-50 text-amber-600 border-amber-200'
                                : item.variant === 'purple'
                                  ? 'bg-purple-50 text-purple-600 border-purple-200'
                                  : item.variant === 'indigo'
                                    ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                                    : 'bg-blue-50 text-blue-600 border-blue-200'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 truncate block">
                            {item.name}
                          </span>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
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
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Click any node to place it directly on the canvas</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
