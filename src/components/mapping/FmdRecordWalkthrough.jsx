import React from 'react';
import { ToggleLeft, ToggleRight, CheckCircle2, MessageSquareQuote } from 'lucide-react';

/**
 * FmdRecordWalkthrough - Step 5 (Screenshots 4, 5, 6):
 * One simple record from each file (MAKT-MAKTX) with interactive XREF Hit/Miss toggles
 * and per-source condition tables & demo messages.
 */
export default function FmdRecordWalkthrough({
  walkthroughCards = [],
  xrefEnabled = true,
  applyCmmsOverride = false,
  onToggleXref,
  onToggleCmmsOverride,
}) {
  if (!walkthroughCards || walkthroughCards.length === 0) return null;

  return (
    <section className="bg-white dark:bg-[#18181C] rounded-[20px] border border-[#E3E6EE] dark:border-white/[0.08] p-5 space-y-4 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#2D55F5] text-white text-[11px] font-bold">3</span>
            <h2 className="text-sm sm:text-base font-bold text-[#0A0F1F] dark:text-white tracking-tight">
              One Simple Record from Each File: Material Description (MAKT-MAKTX)
            </h2>
          </div>
          <p className="text-xs text-[#5F6678] dark:text-slate-400 mt-1">
            Toggle XREF cross-reference hits live to prove how DataX executes different mapping patterns across SUSTAIN, ATLAS, CONS &amp; CMMS/MAXIMO.
          </p>
        </div>

        {/* Interactive Condition Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleXref}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
              xrefEnabled
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-300'
                : 'bg-slate-100 border-slate-300 text-slate-700 dark:bg-white/10 dark:text-slate-300'
            }`}
          >
            {xrefEnabled ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
            <span>XREF Lookup: {xrefEnabled ? 'HIT (Override Active)' : 'MISS (Fallback Copy)'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleCmmsOverride}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
              applyCmmsOverride
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-white/[0.05] dark:border-white/10 dark:text-slate-300'
            }`}
          >
            {applyCmmsOverride ? <ToggleRight className="w-4 h-4 text-amber-600" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
            <span>CMMS Design-Spec XREF Override: {applyCmmsOverride ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* 4 Walkthrough Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {walkthroughCards.map((card) => (
          <div
            key={card.source_system}
            className="rounded-2xl border border-[#E3E6EE] dark:border-white/[0.08] bg-[#FAFBFD] dark:bg-white/[0.02] p-4 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[#0A0F1F] dark:text-white">{card.title}</h3>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-[#2D55F5] dark:text-blue-300 text-[10px] font-bold">
                  {card.rule_type}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    card.status === 'REWORK'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : card.status === 'FINAL REVIEW'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {card.status}
                </span>
              </div>
            </div>

            {/* Example Source Record Table */}
            <div className="rounded-xl border border-[#E3E6EE] dark:border-white/10 overflow-hidden bg-white dark:bg-[#141418]">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-white/[0.04] text-slate-500 border-b border-slate-200 dark:border-white/10">
                    <th className="px-3 py-1.5 font-bold">Source table</th>
                    <th className="px-3 py-1.5 font-bold">MATNR</th>
                    <th className="px-3 py-1.5 font-bold">MAKTX</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300">{card.example_record.source_table}</td>
                    <td className="px-3 py-2 font-mono font-bold text-[#0A0F1F] dark:text-white">{card.example_record.matnr}</td>
                    <td className="px-3 py-2 font-mono font-semibold text-[#2D55F5] dark:text-blue-400">{card.example_record.maktx}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mapping Logic Bullets */}
            <ul className="space-y-1 text-[11px] text-slate-700 dark:text-slate-300 list-disc pl-4">
              {card.logic_bullets.map((b, i) => (
                <li key={i} className="leading-snug">{b}</li>
              ))}
            </ul>

            {/* Condition -> Target MAKT-MAKTX Table */}
            <div className="rounded-xl border border-[#E3E6EE] dark:border-white/10 overflow-hidden bg-white dark:bg-[#141418]">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-white/[0.04] text-slate-500 border-b border-slate-200 dark:border-white/10">
                    <th className="px-3 py-1.5 font-bold">Condition</th>
                    <th className="px-3 py-1.5 font-bold">Target MAKT-MAKTX</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {card.condition_table.map((cond, idx) => (
                    <tr
                      key={idx}
                      className={cond.active ? 'bg-emerald-50/70 dark:bg-emerald-950/30 font-bold' : 'opacity-65'}
                    >
                      <td className="px-3 py-2 text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        {cond.active && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        <span>{cond.condition}</span>
                      </td>
                      <td className="px-3 py-2 font-mono text-[#0A0F1F] dark:text-white">
                        {cond.target_value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Demo Message */}
            <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-[11px] text-slate-700 dark:text-slate-300 italic">
              <MessageSquareQuote className="w-3.5 h-3.5 text-[#2D55F5] shrink-0 mt-0.5" />
              <span>&ldquo;{card.demo_message}&rdquo;</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
