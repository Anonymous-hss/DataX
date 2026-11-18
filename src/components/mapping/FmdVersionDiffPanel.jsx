import React, { useState, useEffect } from 'react';
import { GitCompare, Sparkles, PlusCircle, MinusCircle, RefreshCw, Loader2 } from 'lucide-react';

const CHANGE_BADGE = {
  ADDED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REMOVED: 'bg-rose-50 text-rose-700 border-rose-200',
  RULE_CHANGED: 'bg-amber-50 text-amber-800 border-amber-200',
  STATUS_CHANGED: 'bg-blue-50 text-blue-700 border-blue-200',
};

/**
 * FmdVersionDiffPanel - Phase 3 FMD Revision Diffing (e.g. SUSTAIN R3.2 vs R3.3)
 */
export default function FmdVersionDiffPanel({
  documents = [],
  diffResult,
  loading = false,
  activeRole = 'Lead Data Engineer',
  onSeedR33,
  onRunDiff,
}) {
  const [baseDocId, setBaseDocId] = useState('');
  const [targetDocId, setTargetDocId] = useState('');

  useEffect(() => {
    if (documents.length >= 2) {
      if (!baseDocId) setBaseDocId(documents[0].doc_id);
      if (!targetDocId) {
        const r33 = documents.find((d) => d.file_name.toUpperCase().includes('R3.3'));
        setTargetDocId(r33 ? r33.doc_id : documents[documents.length - 1].doc_id);
      }
    }
  }, [documents, baseDocId, targetDocId]);

  const counts = diffResult?.counts || {};
  const changes = diffResult?.changes || [];

  return (
    <section className="bg-white dark:bg-[#18181C] rounded-[20px] border border-[#E3E6EE] dark:border-white/[0.08] p-5 space-y-5 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-[#2D55F5]" />
            <h2 className="text-sm sm:text-base font-bold text-[#0A0F1F] dark:text-white tracking-tight">
              FMD Version Diffing (R3.2 → R3.3 Revision Tracker)
            </h2>
          </div>
          <p className="text-xs text-[#5F6678] dark:text-slate-400 mt-1">
            Compare any two FMD workbook revisions field-by-field across all 6 SAP tabs. Every diff is sealed into the SHA-256 Audit Ledger.
          </p>
        </div>

        <button
          type="button"
          onClick={onSeedR33}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2D55F5] hover:bg-blue-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-[#D4FF3A]" />}
          <span>Load SUSTAIN R3.3 Revision &amp; Diff</span>
        </button>
      </div>

      {/* Document Version Pickers */}
      <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-end p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-white/[0.03] border border-[#E3E6EE] dark:border-white/10">
        <div className="md:col-span-4">
          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
            Baseline FMD Version (e.g. R3.2)
          </label>
          <select
            value={baseDocId}
            onChange={(e) => setBaseDocId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#141418] border border-[#E3E6EE] dark:border-white/10 text-xs font-semibold text-[#0A0F1F] dark:text-white"
          >
            {documents.map((d) => (
              <option key={d.doc_id} value={d.doc_id}>
                [{d.source_system}] {d.file_name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-4">
          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
            Target / New FMD Revision (e.g. R3.3)
          </label>
          <select
            value={targetDocId}
            onChange={(e) => setTargetDocId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#141418] border border-[#E3E6EE] dark:border-white/10 text-xs font-semibold text-[#0A0F1F] dark:text-white"
          >
            {documents.map((d) => (
              <option key={d.doc_id} value={d.doc_id}>
                [{d.source_system}] {d.file_name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <button
            type="button"
            onClick={() => onRunDiff(baseDocId, targetDocId)}
            disabled={loading || !baseDocId || !targetDocId || baseDocId === targetDocId}
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A0F1F] hover:bg-slate-800 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#D4FF3A]" />
            <span>Compare Revisions</span>
          </button>
        </div>
      </div>

      {/* Diff Results */}
      {diffResult ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
              <div className="text-[10px] font-bold uppercase flex items-center gap-1"><PlusCircle className="w-3 h-3" /> Added</div>
              <div className="text-lg font-bold">{counts.ADDED || 0}</div>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
              <div className="text-[10px] font-bold uppercase flex items-center gap-1"><MinusCircle className="w-3 h-3" /> Removed</div>
              <div className="text-lg font-bold">{counts.REMOVED || 0}</div>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
              <div className="text-[10px] font-bold uppercase">Rule Changed</div>
              <div className="text-lg font-bold">{counts.RULE_CHANGED || 0}</div>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800">
              <div className="text-[10px] font-bold uppercase">Status Updated</div>
              <div className="text-lg font-bold">{counts.STATUS_CHANGED || 0}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300">
              <div className="text-[10px] font-bold uppercase">Unchanged</div>
              <div className="text-lg font-bold">{counts.UNCHANGED || 0}</div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#E3E6EE] dark:border-white/10">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0B1228] text-white">
                  <th className="px-3 py-2.5 font-bold">Field Key</th>
                  <th className="px-3 py-2.5 font-bold">Change Type</th>
                  <th className="px-3 py-2.5 font-bold">Before (Base)</th>
                  <th className="px-3 py-2.5 font-bold">After (Revision)</th>
                  <th className="px-3 py-2.5 font-bold">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E6EE] dark:divide-white/[0.06]">
                {changes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                      Zero differences detected between the selected workbooks.
                    </td>
                  </tr>
                ) : (
                  changes.map((c) => (
                    <tr key={`${c.field_key}_${c.change_type}`} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      <td className="px-3 py-2.5 font-mono font-bold text-[#2D55F5] whitespace-nowrap">
                        {c.field_key}
                        <div className="text-[10px] font-sans font-normal text-slate-500">{c.target_field_text}</div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${CHANGE_BADGE[c.change_type] || ''}`}>
                          {c.change_type}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-slate-600 dark:text-slate-300">
                        <div>{c.before_rule}</div>
                        <div className="text-[10px] text-slate-400">Status: {c.before_status}</div>
                      </td>
                      <td className="px-3 py-2.5 text-[11px] font-semibold text-[#0A0F1F] dark:text-white">
                        <div>{c.after_rule}</div>
                        <div className="text-[10px] text-emerald-600">Status: {c.after_status}</div>
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-slate-700 dark:text-slate-300 max-w-sm">
                        {c.summary}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-[#E3E6EE] dark:border-white/10 p-6 text-center text-xs text-slate-500">
          Click <strong className="text-[#0A0F1F] dark:text-white">&ldquo;Load SUSTAIN R3.3 Revision &amp; Diff&rdquo;</strong> to see R3.2 $\to$ R3.3 changes (MAKT-MAKTX promoted REWORK $\to$ VALID, MARC-WERKS upgraded to XREF, MARA-BISMT added, MBEW-VPRSV removed).
          <div className="text-[10px] text-slate-400 mt-1">Active RBAC persona: {activeRole}</div>
        </div>
      )}
    </section>
  );
}
