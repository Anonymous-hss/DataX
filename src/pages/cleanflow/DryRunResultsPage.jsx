import React from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, AlertCircle, Play } from 'lucide-react';
import GreenTickAnimation from '../../components/cleanflow/GreenTickAnimation';
import { useRuleEngine } from '../../context/RuleEngineContext';

export default function DryRunResultsPage({ onBack, onRunLive }) {
  const { 
    dryRunResult, 
    sourceConfig, 
    targetConfig, 
    activeRules, 
    autoFixEnabled, 
    setAutoFixEnabled,
    executeLiveRun 
  } = useRuleEngine();

  const totalRows = dryRunResult?.totalChecked ?? 50;
  const cleanCount = dryRunResult?.cleanCount ?? 0;
  const fixedCount = dryRunResult?.autoFixedCount ?? 0;
  const heldCount = dryRunResult?.quarantinedCount ?? 0;
  const passRate = dryRunResult?.passRate ?? (totalRows > 0 ? Math.round(((cleanCount + fixedCount) / totalRows) * 1000) / 10 : 94.0);
  const outcomes = dryRunResult?.ruleOutcomes || [];

  const handleRunLiveClick = async () => {
    await executeLiveRun();
    if (onRunLive) onRunLive();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-4"
    >
      {/* Main White Card Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 sm:p-8 space-y-6">
        
        {/* Green Tick Animation & Hero Announcement */}
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6 pt-1 pb-2">
          
          {/* Lottie / Motion Tick Animation on the left */}
          <div className="shrink-0">
            <GreenTickAnimation size={120} />
          </div>

          <div className="space-y-1.5 text-center sm:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 shadow-2xs">
              <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-600" />
              Dry run passed · nothing written
            </span>

            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-display">
              Your rules are ready to run live
            </h2>

            <p className="text-xs text-slate-500 max-w-xl">
              {activeRules?.filter(r => r.selected !== false).length || 5} rules checked {totalRows.toLocaleString()} rows from <span className="font-mono text-slate-700">{sourceConfig?.table || 'source_table'}</span>. No data was written to <span className="font-mono text-slate-700">{targetConfig?.table || 'target_table'}</span>.
            </p>
          </div>

        </div>

        {/* Summary Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          
          {/* Rows checked */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-xs text-slate-500">Rows checked</span>
            <span className="text-xl font-bold text-slate-900 font-display mt-1">{totalRows.toLocaleString()}</span>
          </div>

          {/* Clean */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-xs text-slate-500">Clean</span>
            <span className="text-xl font-bold text-emerald-600 font-display mt-1">{cleanCount.toLocaleString()}</span>
          </div>

          {/* Auto-fixed */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-xs text-slate-500">Auto-fixed</span>
            <span className="text-xl font-bold text-blue-600 font-display mt-1">{fixedCount.toLocaleString()}</span>
          </div>

          {/* Quarantined */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-xs text-slate-500">Quarantined</span>
            <span className="text-xl font-bold text-amber-600 font-display mt-1">{heldCount.toLocaleString()}</span>
          </div>

          {/* Pass rate */}
          <div className="col-span-2 sm:col-span-1 bg-slate-900 rounded-xl p-3 flex flex-col justify-between text-white shadow-xs">
            <span className="text-xs text-slate-400">Pass rate</span>
            <span className="text-xl font-extrabold text-[#a3e635] font-display mt-1 tracking-tight">{passRate}%</span>
          </div>

        </div>

        {/* Rules Evaluation Table */}
        <div className="rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
                <th className="py-2.5 px-4 w-1/2">Rule</th>
                <th className="py-2.5 px-4 w-1/4">Rows affected</th>
                <th className="py-2.5 px-4 w-1/4">What happens</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {outcomes.length > 0 ? (
                outcomes.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-medium text-slate-900">{r.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{r.rowsAffected}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${r.badgeClass}`}>
                        ● {r.outcome}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                activeRules.filter(r => r.selected !== false).map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-medium text-slate-900">{r.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {Math.round(totalRows * (r.severity === 'Warning' ? 0.08 : 0.02))}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${r.severity === 'Warning' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        ● {r.severity === 'Warning' ? 'Auto-fixed' : 'Quarantined'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Auto-fix Toggle Callout Banner */}
        <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="text-xs font-bold text-blue-950">Keep auto-fix on while live</div>
              <div className="text-xs text-blue-700 mt-0.5">
                Warning rules fix new rows as they arrive via ontology & formatting. Critical violations go to quarantine for review.
              </div>
            </div>
          </div>

          {/* Interactive Toggle Switch */}
          <button
            onClick={() => setAutoFixEnabled(!autoFixEnabled)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 cursor-pointer ${
              autoFixEnabled ? 'bg-blue-600' : 'bg-slate-300'
            }`}
          >
            <motion.div
              className="bg-white w-4 h-4 rounded-full shadow-md"
              animate={{ x: autoFixEnabled ? 20 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
          Live runs stream new rows and enforce verified rules continuously.
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
          >
            ← Back
          </button>
          <button
            onClick={handleRunLiveClick}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Run live
          </button>
        </div>
      </div>

    </motion.div>
  );
}
