import React from 'react';
import { Check, Sparkles, AlertTriangle, Database } from 'lucide-react';

export default function RouterModalPanel({
  sourceTable = '',
  rulesCount = 0,
  routerThreshold,
  setRouterThreshold,
}) {
  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl flex items-center justify-between gap-3 flex-wrap">
        <div>
          <span className="text-xs font-bold text-purple-950 block">In-Flight 3-Way Parallel Stream Splitter</span>
          <span className="text-[11px] text-purple-700">
            Evaluates incoming row packets against active rule ontologies and routes each row without data loss.
          </span>
        </div>
        {sourceTable && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-md bg-white border border-purple-200 text-slate-700">
            <Database className="w-3 h-3 text-purple-600" />
            <span className="text-slate-500">Stream:</span>
            <span className="font-mono font-bold text-purple-900">{sourceTable}</span>
          </span>
        )}
      </div>

      {/* 3 Stream Paths */}
      <div className="space-y-2">
        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-950 block">Compliant Golden Stream</span>
            <span className="text-[11px] text-emerald-700">100% compliant rows routed immediately to target destination.</span>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-blue-950 block">AI Remediated Stream</span>
            <span className="text-[11px] text-blue-700">Auto-fixed rows (syntax repairs, normalization, calculation equalities) committed to target.</span>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-950 block">Critical Violations Stream</span>
            <span className="text-[11px] text-amber-700">Failed critical checks isolated to dead-letter quarantine store.</span>
          </div>
        </div>
      </div>

      {/* Quality Gate Threshold */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800">Minimum Health Score Quality Gate</label>
          <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded font-mono">
            {routerThreshold}%
          </span>
        </div>
        <input
          type="range"
          min={70}
          max={100}
          step={1}
          value={routerThreshold}
          onChange={(e) => setRouterThreshold(Number(e.target.value))}
          className="w-full accent-blue-600 cursor-pointer"
        />
        <span className="text-[10px] text-slate-500 block">
          Pipeline run pauses if overall health score falls below {routerThreshold}%.
        </span>
      </div>
    </div>
  );
}
