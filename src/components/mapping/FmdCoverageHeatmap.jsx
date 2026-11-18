import React, { useState } from 'react';
import { Grid3X3, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';

const CELL_STYLE = {
  XREF_OVERRIDE: 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/50',
  BUSINESS_CONSTRUCTION: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50',
  DIRECT_COPY: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50',
  INTERNAL: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/10 dark:text-slate-300 dark:border-white/10',
  DEFAULT: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/50',
  NOT_MAPPED: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50',
};

/**
 * FmdCoverageHeatmap - Phase 2 Full-Workbook Multi-Tab Coverage Matrix
 * Compares all fields across MARA, MARC, MAKT, MBEW, MARD & Classification simultaneously.
 */
export default function FmdCoverageHeatmap({
  coverage,
  onSelectCell,
  onJumpToField,
}) {
  const [activeTable, setActiveTable] = useState('ALL');
  const [onlyFlagged, setOnlyFlagged] = useState(false);

  if (!coverage || coverage.status === 'empty') {
    return (
      <div className="bg-white dark:bg-[#18181C] rounded-[20px] border border-[#E3E6EE] dark:border-white/[0.08] p-8 text-center text-xs text-slate-500">
        Load FMD workbooks to generate the 6-tab coverage heatmap.
      </div>
    );
  }

  const sources = coverage.sources || [];
  const tabSummaries = coverage.tab_summaries || [];
  const totals = coverage.totals || {};

  const filteredRows = (coverage.matrix_rows || []).filter((row) => {
    if (activeTable !== 'ALL' && row.target_table !== activeTable) return false;
    if (onlyFlagged && !row.divergent && !row.has_gap && !row.needs_review) return false;
    return true;
  });

  return (
    <section className="bg-white dark:bg-[#18181C] rounded-[20px] border border-[#E3E6EE] dark:border-white/[0.08] p-5 space-y-5 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Grid3X3 className="w-4 h-4 text-[#2D55F5]" />
            <h2 className="text-sm sm:text-base font-bold text-[#0A0F1F] dark:text-white tracking-tight">
              Full-Workbook Multi-Tab Coverage Heatmap (MARA / MARC / MAKT / MBEW / MARD / Classification)
            </h2>
          </div>
          <p className="text-xs text-[#5F6678] dark:text-slate-400 mt-1">
            Inspect mapping rule consistency across all {totals.total_fields || 0} SAP target fields and {sources.length} legacy sources. Click any cell to open its exact Excel row.
          </p>
        </div>

        <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F5F6FA] dark:bg-white/[0.06] border border-[#E3E6EE] dark:border-white/10 text-xs font-semibold text-[#0A0F1F] dark:text-white cursor-pointer">
          <input
            type="checkbox"
            checked={onlyFlagged}
            onChange={(e) => setOnlyFlagged(e.target.checked)}
            className="rounded accent-[#2D55F5]"
          />
          <span>Only divergent / REWORK / gaps</span>
        </label>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-[#F8FAFC] dark:bg-white/[0.03] border border-[#E3E6EE] dark:border-white/10">
          <div className="text-[10px] font-bold uppercase text-slate-500">Total Target Fields</div>
          <div className="text-lg font-bold text-[#0A0F1F] dark:text-white mt-0.5">{totals.total_fields || 0}</div>
        </div>
        <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50">
          <div className="text-[10px] font-bold uppercase text-indigo-700 dark:text-indigo-300">Divergent Rules</div>
          <div className="text-lg font-bold text-indigo-800 dark:text-indigo-200 mt-0.5">{totals.divergent || 0}</div>
        </div>
        <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
          <div className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">REWORK / Review</div>
          <div className="text-lg font-bold text-amber-800 dark:text-amber-200 mt-0.5">{totals.rework_or_review || 0}</div>
        </div>
        <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50">
          <div className="text-[10px] font-bold uppercase text-rose-700 dark:text-rose-300">Unmapped Gaps</div>
          <div className="text-lg font-bold text-rose-800 dark:text-rose-200 mt-0.5">{totals.gaps || 0}</div>
        </div>
      </div>

      {/* Tab Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setActiveTable('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
            activeTable === 'ALL'
              ? 'bg-[#0A0F1F] text-[#D4FF3A]'
              : 'bg-[#F5F6FA] dark:bg-white/[0.06] text-slate-700 dark:text-slate-300'
          }`}
        >
          All Tabs ({totals.total_fields || 0})
        </button>
        {tabSummaries.map((tab) => (
          <button
            key={tab.table}
            type="button"
            onClick={() => setActiveTable(tab.table)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              activeTable === tab.table
                ? 'bg-[#2D55F5] text-white'
                : 'bg-[#F5F6FA] dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 hover:bg-slate-200/70'
            }`}
          >
            {tab.table} ({tab.total_fields})
            {tab.divergent_fields > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] bg-[#D4FF3A] text-[#0A0F1F]">
                {tab.divergent_fields} diff
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Heatmap Matrix Table */}
      <div className="overflow-x-auto rounded-xl border border-[#E3E6EE] dark:border-white/10">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#0B1228] text-white">
              <th className="px-3 py-2.5 font-bold whitespace-nowrap">Target Field</th>
              <th className="px-3 py-2.5 font-bold whitespace-nowrap">Description</th>
              <th className="px-3 py-2.5 font-bold whitespace-nowrap">Alignment</th>
              {sources.map((src) => (
                <th key={src} className="px-3 py-2.5 font-bold whitespace-nowrap text-center">
                  {src}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E3E6EE] dark:divide-white/[0.06]">
            {filteredRows.map((row) => (
              <tr key={row.key} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02]">
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onJumpToField && onJumpToField(row.key)}
                    className="font-mono font-bold text-[#2D55F5] hover:underline cursor-pointer"
                  >
                    {row.key}
                  </button>
                </td>
                <td className="px-3 py-2.5 text-[11px] text-slate-700 dark:text-slate-300 max-w-[180px] truncate" title={row.target_field_text}>
                  {row.target_field_text}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {row.has_gap ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      <AlertTriangle className="w-3 h-3" /> Gap
                    </span>
                  ) : row.divergent ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      <AlertTriangle className="w-3 h-3" /> {row.distinct_patterns} Patterns
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Aligned
                    </span>
                  )}
                </td>
                {sources.map((src) => {
                  const cell = row.cells[src];
                  const style = CELL_STYLE[cell?.rule_code] || CELL_STYLE.NOT_MAPPED;
                  return (
                    <td key={src} className="px-2 py-2 text-center">
                      {cell?.present ? (
                        <button
                          type="button"
                          onClick={() => onSelectCell && onSelectCell(cell.doc_id, cell.sheet_name, cell.excel_row)}
                          className={`w-full px-2 py-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-transform hover:scale-[1.02] ${style}`}
                          title={`${cell.file_name} › ${cell.sheet_name} › Row ${cell.excel_row} (${cell.unique_id})`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span className="truncate">{cell.rule_label}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-60" />
                          </div>
                          <div className="text-[9px] font-semibold opacity-80 mt-0.5">
                            {cell.status}
                          </div>
                        </button>
                      ) : (
                        <span className="inline-block px-2 py-1 rounded-lg border text-[10px] font-bold bg-rose-50 text-rose-700 border-rose-200">
                          Missing
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
