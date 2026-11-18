import React, { useState } from 'react';
import { Download, AlertTriangle, CheckCircle2, Code2, Table2, ShieldAlert, Zap } from 'lucide-react';

/**
 * FmdBestDemoScreen - Step 6 (Screenshot 7):
 * - Best Demo Screen 4-column compact comparison
 * - Demo Conclusion callout
 * - Staging Preload Report, Z_ERRORLOG (COLUMNNAME, RULENAME, ERROR_CATEGORY), and Compiled DuckDB SQL
 * - Export to SAP BODS (.xlsx / .csv)
 */
export default function FmdBestDemoScreen({ simulation, onExportBods, onTraceRecord, activeTraceRecordId }) {
  const [activeTab, setActiveTab] = useState('preload'); // 'preload' | 'z_errorlog' | 'sql'

  if (!simulation) return null;

  const bestRows = simulation.best_demo_rows || [];
  const preloadRows = simulation.preload_rows || [];
  const zErrorLog = simulation.z_errorlog || [];
  const summary = simulation.summary || {};

  return (
    <section className="bg-white dark:bg-[#18181C] rounded-[20px] border border-[#E3E6EE] dark:border-white/[0.08] p-5 space-y-5 shadow-xs">
      {/* Header + Export Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#2D55F5] text-white text-[11px] font-bold">4</span>
            <h2 className="text-sm sm:text-base font-bold text-[#0A0F1F] dark:text-white tracking-tight">
              Best Demo Screen · Staging Preload &amp; Z_ERRORLOG for SAP BODS
            </h2>
          </div>
          <p className="text-xs text-[#5F6678] dark:text-slate-400 mt-1">
            Compact consolidated transformation across all 4 legacy sources, backed by live DuckDB execution and BODS staging extracts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onExportBods('xlsx')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0A0F1F] hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#D4FF3A]" />
            <span>Export BODS Bundle (.xlsx)</span>
          </button>
          <button
            type="button"
            onClick={() => onExportBods('csv')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E3E6EE] dark:border-white/10 text-xs font-semibold text-[#0A0F1F] dark:text-white hover:bg-slate-50 dark:hover:bg-white/[0.06] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Preload CSV</span>
          </button>
        </div>
      </div>

      {/* Best Demo Screen 4-Column Compact Comparison (Screenshot 7) */}
      <div className="overflow-x-auto rounded-2xl border-2 border-[#2D55F5]/25 dark:border-blue-500/30">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#0B1228] text-white">
              <th className="px-4 py-3 font-bold">Source</th>
              <th className="px-4 py-3 font-bold">Original description</th>
              <th className="px-4 py-3 font-bold">Rule identified by AI</th>
              <th className="px-4 py-3 font-bold">Final TIME description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E3E6EE] dark:divide-white/10 bg-white dark:bg-[#141418]">
            {bestRows.map((row) => (
              <tr key={row.source} className="hover:bg-blue-50/40 dark:hover:bg-white/[0.03]">
                <td className="px-4 py-3 font-bold text-[#0A0F1F] dark:text-white">{row.source}</td>
                <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">{row.original_description}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      row.rule_identified_by_ai.toLowerCase().includes('xref')
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : row.rule_identified_by_ai.toLowerCase().includes('construction')
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {row.rule_identified_by_ai}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono font-bold text-[#0A0F1F] dark:text-[#D4FF3A]">
                  {row.final_time_description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Demo Conclusion Banner */}
      <div className="p-4 rounded-2xl bg-[#0B1228] text-white border-l-4 border-[#D4FF3A]">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#D4FF3A] mb-1">
          Demo Conclusion
        </div>
        <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-100">
          &ldquo;{simulation.demo_conclusion}&rdquo;
        </p>
      </div>

      {/* Sub-tabs: Preload Report / Z_ERRORLOG / Compiled DuckDB SQL */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 border-b border-[#E3E6EE] dark:border-white/10 pb-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('preload')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              activeTab === 'preload'
                ? 'bg-[#2D55F5] text-white'
                : 'bg-[#F5F6FA] dark:bg-white/[0.06] text-slate-700 dark:text-slate-300'
            }`}
          >
            <Table2 className="w-3.5 h-3.5" />
            <span>Staging Preload Report ({summary.total_records || preloadRows.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('z_errorlog')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              activeTab === 'z_errorlog'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Z_ERRORLOG ({zErrorLog.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
              activeTab === 'sql'
                ? 'bg-[#0A0F1F] text-[#D4FF3A]'
                : 'bg-[#F5F6FA] dark:bg-white/[0.06] text-slate-700 dark:text-slate-300'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Compiled DuckDB SQL</span>
          </button>
        </div>

        {activeTab === 'preload' && (
          <div className="overflow-x-auto rounded-xl border border-[#E3E6EE] dark:border-white/10">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-white/10">
                  <th className="px-3 py-2 font-bold">MATNR</th>
                  <th className="px-3 py-2 font-bold">Source</th>
                  <th className="px-3 py-2 font-bold">Original MAKTX</th>
                  <th className="px-3 py-2 font-bold">Final TIME MAKTX</th>
                  <th className="px-3 py-2 font-bold">Execution Branch</th>
                  <th className="px-3 py-2 font-bold">Staging Status</th>
                  <th className="px-3 py-2 font-bold">FMD ID</th>
                  {onTraceRecord && <th className="px-3 py-2 font-bold text-right">Canvas</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                {preloadRows.map((r, idx) => (
                  <tr key={`${r.matnr}_${idx}`} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    <td className="px-3 py-2 font-mono font-bold text-[#0A0F1F] dark:text-white">{r.matnr}</td>
                    <td className="px-3 py-2 font-semibold">{r.source_system}</td>
                    <td className="px-3 py-2 font-mono text-slate-500 max-w-[180px] truncate">{r.original_description || '(blank)'}</td>
                    <td className="px-3 py-2 font-mono font-bold text-[#0A0F1F] dark:text-white max-w-[200px] truncate">{r.final_time_description || '(empty)'}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{r.execution_branch}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {r.preload_status === 'PRELOAD_READY' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                          <CheckCircle2 className="w-3 h-3" /> PRELOAD_READY
                        </span>
                      ) : r.preload_status === 'STAGED_WITH_WARNING' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">
                          <AlertTriangle className="w-3 h-3" /> STAGED_WARNING
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px]">
                          <ShieldAlert className="w-3 h-3" /> Z_ERRORLOG
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono text-[#2D55F5]">{r.fmd_unique_id}</td>
                    {onTraceRecord && (
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onTraceRecord(r.matnr, r.source_system)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer transition-colors ${
                            activeTraceRecordId === String(r.matnr)
                              ? 'bg-[#0A0F1F] text-[#D4FF3A] border-[#0A0F1F]'
                              : 'bg-blue-50 text-[#2D55F5] border-blue-200 hover:bg-blue-100'
                          }`}
                        >
                          <Zap className="w-2.5 h-2.5" />
                          <span>Trace</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'z_errorlog' && (
          <div className="overflow-x-auto rounded-xl border border-rose-200 dark:border-rose-900/50">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-rose-600 text-white">
                  <th className="px-3 py-2 font-bold">RECORD_KEY</th>
                  <th className="px-3 py-2 font-bold">SOURCE_SYSTEM</th>
                  <th className="px-3 py-2 font-bold">COLUMNNAME</th>
                  <th className="px-3 py-2 font-bold">RULENAME</th>
                  <th className="px-3 py-2 font-bold">ERROR_CATEGORY</th>
                  <th className="px-3 py-2 font-bold">MESSAGE</th>
                  {onTraceRecord && <th className="px-3 py-2 font-bold text-right">Canvas</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100 dark:divide-rose-950/50 bg-white dark:bg-[#141418]">
                {zErrorLog.length === 0 ? (
                  <tr>
                    <td colSpan={onTraceRecord ? 7 : 6} className="px-4 py-6 text-center text-slate-500">
                      Zero Z_ERRORLOG entries for this staging batch.
                    </td>
                  </tr>
                ) : (
                  zErrorLog.map((e, idx) => (
                    <tr key={idx} className="hover:bg-rose-50/40 dark:hover:bg-rose-950/20">
                      <td className="px-3 py-2 font-mono font-bold text-[#0A0F1F] dark:text-white">{e.record_key}</td>
                      <td className="px-3 py-2 font-semibold">{e.source_system}</td>
                      <td className="px-3 py-2 font-mono font-bold text-rose-700 dark:text-rose-400">{e.COLUMNNAME}</td>
                      <td className="px-3 py-2 font-mono text-slate-800 dark:text-slate-200">{e.RULENAME}</td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 font-mono font-bold text-[10px]">
                          {e.ERROR_CATEGORY}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{e.message}</td>
                      {onTraceRecord && (
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onTraceRecord(e.record_key, e.source_system)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 cursor-pointer transition-colors"
                          >
                            <Zap className="w-2.5 h-2.5" />
                            <span>Trace</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'sql' && (
          <pre className="p-4 rounded-xl bg-[#0B1228] text-[#D4FF3A] font-mono text-[11px] overflow-x-auto leading-relaxed">
            {simulation.compiled_sql}
          </pre>
        )}
      </div>
    </section>
  );
}
