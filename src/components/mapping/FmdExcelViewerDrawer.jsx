import React from 'react';
import { X, FileSpreadsheet, Loader2 } from 'lucide-react';

/**
 * FmdExcelViewerDrawer - Multi-tab Excel sheet inspector replicating the client's
 * red-header FMD workbook (Field Mapping - MARA / MARC / MAKT / MBEW / MARD / Classification)
 * with exact row highlighting when opened from a Source-document link.
 */
export default function FmdExcelViewerDrawer({
  isOpen,
  loading,
  sheetData,
  onSelectTab,
  onClose,
}) {
  if (!isOpen) return null;

  const tabs = sheetData?.tabs || [];
  const rows = sheetData?.rows || [];
  const highlightRow = sheetData?.highlight_row;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-[2px]">
      <div className="w-full max-w-5xl bg-white dark:bg-[#141418] h-full shadow-2xl border-l border-[#E3E6EE] dark:border-white/10 flex flex-col">
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-[#E3E6EE] dark:border-white/10 flex items-center justify-between gap-3 bg-[#F8FAFC] dark:bg-[#18181C]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#0A0F1F] text-[#D4FF3A] text-[10px] font-bold">
                  {sheetData?.source_system || 'FMD'}
                </span>
                <h3 className="text-sm font-bold text-[#0A0F1F] dark:text-white truncate">
                  {sheetData?.file_name || 'Excel Workbook Inspector'}
                </h3>
              </div>
              <p className="text-[11px] text-[#5F6678] dark:text-slate-400">
                Header detected at Excel Row {sheetData?.header_row || 2} · {rows.length} mapping rows in active tab
                {highlightRow ? ` · Highlighted Row ${highlightRow}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-200/70 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Excel Multi-Tab Strip */}
        <div className="px-5 py-2.5 border-b border-[#E3E6EE] dark:border-white/10 bg-[#F1F5F9] dark:bg-[#1A1A20] flex items-center gap-1.5 overflow-x-auto">
          {tabs.map((tab) => {
            const active = tab === sheetData?.active_tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onSelectTab(sheetData.doc_id, tab)}
                className={`px-3 py-1.5 rounded-t-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer border-b-2 ${
                  active
                    ? 'bg-white dark:bg-[#141418] text-emerald-700 dark:text-emerald-400 border-emerald-600 shadow-2xs'
                    : 'bg-red-600/90 hover:bg-red-600 text-white border-transparent'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Sheet Table Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-48 gap-2 text-sm text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin text-[#2D55F5]" />
              <span>Reading Excel worksheet…</span>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
              <div className="px-3 py-2 bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 text-sm font-bold text-[#0A0F1F] dark:text-white">
                Field Mapping — {sheetData?.active_tab}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-[#DC2626] text-white">
                      <th className="px-2.5 py-2 font-bold border-r border-red-400/50">Row</th>
                      <th className="px-2.5 py-2 font-bold border-r border-red-400/50">UNIQUE_ID</th>
                      <th className="px-2.5 py-2 font-bold border-r border-red-400/50">DATA_LEVEL</th>
                      <th className="px-2.5 py-2 font-bold border-r border-red-400/50">TARGET_TABLE</th>
                      <th className="px-2.5 py-2 font-bold border-r border-red-400/50">TARGET_FIELD_NAME</th>
                      <th className="px-2.5 py-2 font-bold border-r border-red-400/50">TARGET_FIELD_TEXT</th>
                      <th className="px-2.5 py-2 font-bold border-r border-red-400/50">MAPPING_RULE</th>
                      <th className="px-2.5 py-2 font-bold border-r border-red-400/50">SOURCE_TABLE</th>
                      <th className="px-2.5 py-2 font-bold border-r border-red-400/50">SOURCE_FIELD</th>
                      <th className="px-2.5 py-2 font-bold border-r border-red-400/50">XREF_TABLE</th>
                      <th className="px-2.5 py-2 font-bold">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                    {rows.map((r) => {
                      const isHighlighted = highlightRow && Number(r.excel_row) === Number(highlightRow);
                      return (
                        <tr
                          key={`${r.unique_id}_${r.excel_row}`}
                          className={
                            isHighlighted
                              ? 'bg-[#D4FF3A]/35 dark:bg-[#D4FF3A]/20 font-semibold'
                              : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]'
                          }
                        >
                          <td className="px-2.5 py-2 font-mono text-slate-500 border-r border-slate-100 dark:border-white/5">{r.excel_row}</td>
                          <td className="px-2.5 py-2 font-mono text-slate-800 dark:text-slate-100 whitespace-nowrap border-r border-slate-100 dark:border-white/5">{r.unique_id}</td>
                          <td className="px-2.5 py-2 text-slate-700 dark:text-slate-300 whitespace-nowrap border-r border-slate-100 dark:border-white/5">{r.data_level}</td>
                          <td className="px-2.5 py-2 font-mono font-bold text-slate-900 dark:text-white border-r border-slate-100 dark:border-white/5">{r.target_table}</td>
                          <td className="px-2.5 py-2 font-mono font-bold text-[#2D55F5] dark:text-blue-400 border-r border-slate-100 dark:border-white/5">{r.target_field_name}</td>
                          <td className="px-2.5 py-2 text-slate-700 dark:text-slate-200 border-r border-slate-100 dark:border-white/5">{r.target_field_text}</td>
                          <td className="px-2.5 py-2 whitespace-nowrap border-r border-slate-100 dark:border-white/5">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 font-semibold text-slate-800 dark:text-slate-100">
                              {r.mapping_rule}
                            </span>
                          </td>
                          <td className="px-2.5 py-2 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap border-r border-slate-100 dark:border-white/5">{r.source_table}</td>
                          <td className="px-2.5 py-2 font-mono text-slate-700 dark:text-slate-200 whitespace-nowrap border-r border-slate-100 dark:border-white/5">{r.source_field}</td>
                          <td className="px-2.5 py-2 font-mono text-[10px] text-amber-800 dark:text-amber-300 max-w-[220px] truncate border-r border-slate-100 dark:border-white/5" title={r.xref_table}>
                            {r.xref_table || 'N/A'}
                          </td>
                          <td className="px-2.5 py-2 whitespace-nowrap font-bold text-slate-800 dark:text-slate-100">{r.status}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
