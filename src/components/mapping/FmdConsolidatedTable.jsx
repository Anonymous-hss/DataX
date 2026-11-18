import React, { useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Lightbulb,
  Loader2,
  Info,
  Send,
} from 'lucide-react';

const DEFAULT_PROMPT =
  'Compare the Material Description mapping, MAKT-MAKTX, across SUSTAIN, ATLAS, CONS, and CMMS/MAXIMO. Show the source field, target field, mapping rule, exceptions, and any review items. Cite the originating document.';

const RULE_PILL_MAP = {
  XREF_OVERRIDE: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/50',
  BUSINESS_CONSTRUCTION: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50',
  DIRECT_COPY: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50',
  INTERNAL: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/10 dark:text-slate-300 dark:border-white/10',
};

const STATUS_PILL_MAP = {
  VALID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REWORK: 'bg-rose-50 text-rose-700 border-rose-200',
  'FINAL REVIEW': 'bg-amber-50 text-amber-700 border-amber-200',
  MISSING: 'bg-red-100 text-red-800 border-red-300',
};

/**
 * FmdConsolidatedTable - Steps 2, 3 & 4 of the client demo script:
 * - Target Field selector (defaults to MAKT-MAKTX)
 * - "Ask one business question" prompt bar + grounded AI explanation
 * - 5-column overview table (Screenshot 2) + 7-column consolidated result table (Screenshot 3)
 * - Highlighted Finding & Inconsistencies/Review items
 */
export default function FmdConsolidatedTable({
  availableFields = [],
  selectedFieldKey = 'MAKT-MAKTX',
  onChangeField,
  comparison,
  askResult,
  asking = false,
  onAskQuestion,
  onOpenSourceLink,
}) {
  const [question, setQuestion] = useState(DEFAULT_PROMPT);
  const [showOverview, setShowOverview] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    onAskQuestion(question);
  };

  const consolidatedRows = comparison?.consolidated_rows || [];
  const overviewRows = comparison?.overview_rows || [];
  const findings = comparison?.findings || [];

  return (
    <section className="bg-white dark:bg-[#18181C] rounded-[20px] border border-[#E3E6EE] dark:border-white/[0.08] p-5 space-y-5 shadow-xs">
      {/* Header + Target Field Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#2D55F5] text-white text-[11px] font-bold">2</span>
            <h2 className="text-sm sm:text-base font-bold text-[#0A0F1F] dark:text-white tracking-tight">
              Ask One Business Question &amp; Consolidated Cross-FMD Comparison
            </h2>
          </div>
          <p className="text-xs text-[#5F6678] dark:text-slate-400 mt-1">
            Compare how one TIME target field moves from each legacy source, detect inconsistencies, and trace every rule to its exact Excel tab &amp; row.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <label className="text-[11px] font-bold text-[#5F6678] dark:text-slate-400">Target Field:</label>
          <select
            value={selectedFieldKey}
            onChange={(e) => onChangeField(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#F5F6FA] dark:bg-white/[0.06] border border-[#E3E6EE] dark:border-white/10 text-xs font-bold text-[#0A0F1F] dark:text-white cursor-pointer"
          >
            {availableFields.length === 0 ? (
              <option value="MAKT-MAKTX">MAKT-MAKTX · Product Description</option>
            ) : (
              availableFields.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.key} · {f.target_field_text} ({f.source_count} FMDs)
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Step 3: Ask One Business Question Bar */}
      <form onSubmit={handleSubmit} className="p-3.5 rounded-2xl bg-[#F8FAFC] dark:bg-white/[0.03] border border-[#E3E6EE] dark:border-white/[0.08] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#2D55F5]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Business Question Prompt (45s Demo Step)</span>
          </span>
          <button
            type="button"
            onClick={() => setQuestion(DEFAULT_PROMPT)}
            className="text-[11px] font-semibold text-[#5F6678] hover:text-[#2D55F5] cursor-pointer"
          >
            Reset to MAKT-MAKTX prompt
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <textarea
            rows={2}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask how a TIME target field maps across SUSTAIN, ATLAS, CONS, and CMMS/MAXIMO..."
            className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#141418] border border-[#E3E6EE] dark:border-white/10 text-xs text-[#0A0F1F] dark:text-white focus:outline-none focus:border-[#2D55F5] resize-none"
          />
          <button
            type="submit"
            disabled={asking || consolidatedRows.length === 0}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A0F1F] hover:bg-slate-800 text-white text-xs font-bold shrink-0 cursor-pointer disabled:opacity-50"
          >
            {asking ? <Loader2 className="w-4 h-4 animate-spin text-[#D4FF3A]" /> : <Send className="w-3.5 h-3.5 text-[#D4FF3A]" />}
            <span>{asking ? 'Reasoning…' : 'Analyze FMDs'}</span>
          </button>
        </div>

        {askResult?.answer && (
          <div className="mt-2 p-3.5 rounded-xl bg-white dark:bg-[#141418] border border-blue-200/80 dark:border-blue-900/50 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-[#2D55F5] uppercase tracking-wider">
              <span>AI Grounded Business Explanation</span>
              <span className="font-mono text-slate-400">{askResult.engine}</span>
            </div>
            <div className="text-xs text-[#0A0F1F] dark:text-slate-200 whitespace-pre-line leading-relaxed">
              {askResult.answer.replace(/### /g, '').replace(/\*\*/g, '')}
            </div>
          </div>
        )}
      </form>

      {/* Highlight Finding Callout (Screenshot 3) */}
      {comparison?.highlight_finding && (
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#F0F4FF] dark:bg-blue-950/30 border border-blue-200/90 dark:border-blue-800/60">
          <div className="w-8 h-8 rounded-xl bg-[#2D55F5] text-[#D4FF3A] flex items-center justify-center shrink-0">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#0A0F1F] dark:text-white">
              Key Design-Logic Finding ({comparison.pattern_count} Distinct Patterns Detected)
            </p>
            <p className="text-xs text-[#334155] dark:text-slate-300 mt-0.5 leading-relaxed">
              {comparison.highlight_finding}
            </p>
          </div>
        </div>
      )}

      {/* Toggle: 7-Column Consolidated Result (Default) vs 5-Column Initial Overview */}
      {consolidatedRows.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#5F6678] dark:text-slate-400">
              {showOverview
                ? 'Initial Mapping Decision Summary (5 Columns)'
                : 'Consolidated Cross-Source Result (7 Required Columns)'}
            </h3>
            <button
              type="button"
              onClick={() => setShowOverview((p) => !p)}
              className="text-[11px] font-semibold text-[#2D55F5] hover:underline cursor-pointer"
            >
              {showOverview ? 'Switch to 7-Column Consolidated View' : 'Show Simple 5-Column Overview'}
            </button>
          </div>

          {showOverview ? (
            <div className="overflow-x-auto rounded-xl border border-[#E3E6EE] dark:border-white/10">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] dark:bg-white/[0.04] text-[#5F6678] dark:text-slate-400 border-b border-[#E3E6EE] dark:border-white/10">
                    <th className="px-3.5 py-2.5 font-bold">Source</th>
                    <th className="px-3.5 py-2.5 font-bold">Source field</th>
                    <th className="px-3.5 py-2.5 font-bold">Target</th>
                    <th className="px-3.5 py-2.5 font-bold">Mapping decision</th>
                    <th className="px-3.5 py-2.5 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E6EE] dark:divide-white/[0.06]">
                  {overviewRows.map((row) => (
                    <tr key={row.source} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      <td className="px-3.5 py-2.5 font-bold text-[#0A0F1F] dark:text-white">{row.source}</td>
                      <td className="px-3.5 py-2.5 text-slate-700 dark:text-slate-300">{row.source_field}</td>
                      <td className="px-3.5 py-2.5 font-mono font-semibold text-[#2D55F5]">{row.target}</td>
                      <td className="px-3.5 py-2.5 font-medium text-slate-800 dark:text-slate-200">{row.mapping_decision}</td>
                      <td className="px-3.5 py-2.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#E3E6EE] dark:border-white/10">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] dark:bg-white/[0.04] text-[#5F6678] dark:text-slate-400 border-b border-[#E3E6EE] dark:border-white/10">
                    <th className="px-3 py-2.5 font-bold whitespace-nowrap">Source system</th>
                    <th className="px-3 py-2.5 font-bold whitespace-nowrap">Source field</th>
                    <th className="px-3 py-2.5 font-bold whitespace-nowrap">Target field</th>
                    <th className="px-3 py-2.5 font-bold whitespace-nowrap">Mapping rule</th>
                    <th className="px-3 py-2.5 font-bold">Exception or override</th>
                    <th className="px-3 py-2.5 font-bold whitespace-nowrap">Confidence / status</th>
                    <th className="px-3 py-2.5 font-bold whitespace-nowrap">Source-document link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E6EE] dark:divide-white/[0.06]">
                  {consolidatedRows.map((row) => {
                    const ruleCls = RULE_PILL_MAP[row.rule_code] || RULE_PILL_MAP.INTERNAL;
                    const statusCls = STATUS_PILL_MAP[row.status] || STATUS_PILL_MAP.VALID;
                    return (
                      <tr key={row.source_system} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] align-top">
                        <td className="px-3 py-3 font-bold text-[#0A0F1F] dark:text-white whitespace-nowrap">
                          {row.source_system}
                        </td>
                        <td className="px-3 py-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                          {row.source_field}
                        </td>
                        <td className="px-3 py-3 font-mono text-[11px] font-bold text-[#2D55F5] dark:text-blue-400 whitespace-nowrap">
                          {row.target_field}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className={`inline-block px-2 py-0.5 rounded-md border text-[11px] font-bold ${ruleCls}`}>
                            {row.rule_short_label}
                          </span>
                          <div className="text-[10px] text-slate-500 mt-1">{row.mapping_rule}</div>
                        </td>
                        <td className="px-3 py-3 text-[11px] text-slate-700 dark:text-slate-300 max-w-xs leading-relaxed">
                          {row.exception_or_override}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusCls}`}>
                            {row.confidence_label || row.status}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={() =>
                              onOpenSourceLink(
                                row.source_document_link.doc_id,
                                row.source_document_link.sheet_name,
                                row.source_document_link.excel_row
                              )
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2D55F5] hover:underline text-left cursor-pointer"
                          >
                            <span className="max-w-[200px] truncate" title={row.source_document_link.label}>
                              {row.source_document_link.unique_id} · Row {row.source_document_link.excel_row}
                            </span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </button>
                          <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                            {row.source_document_link.sheet_name}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Detected Inconsistencies & Review-Ready Recommendation */}
      {findings.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 rounded-2xl border border-[#E3E6EE] dark:border-white/[0.08] p-3.5 space-y-2">
            <h4 className="text-xs font-bold text-[#0A0F1F] dark:text-white">
              Detected Inconsistencies &amp; Governance Review Items ({findings.length})
            </h4>
            <div className="space-y-1.5">
              {findings.map((f, idx) => (
                <div key={idx} className="flex items-start gap-2 text-[11px] leading-relaxed">
                  {f.severity === 'high' ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                  ) : f.severity === 'medium' ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-3.5 h-3.5 text-[#2D55F5] shrink-0 mt-0.5" />
                  )}
                  <span className="text-slate-700 dark:text-slate-300">
                    <strong className="text-[#0A0F1F] dark:text-white">[{f.category}]</strong> {f.message}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-[#0A0F1F] text-white p-4 flex flex-col justify-between">
            <div>
              <span className="inline-block px-2 py-0.5 rounded bg-[#D4FF3A] text-[#0A0F1F] text-[10px] font-bold uppercase tracking-wider mb-2">
                Review-Ready Recommendation
              </span>
              <p className="text-xs text-slate-200 leading-relaxed">
                {comparison?.recommendation}
              </p>
            </div>
            <div className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-white/10">
              Design Spec Ref: <span className="font-mono text-slate-200">{comparison?.design_spec_ref}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
