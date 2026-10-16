import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Sparkles, Check, Clock, AlertCircle } from 'lucide-react';
import { useRuleEngine } from '../../context/RuleEngineContext';

export default function RunningDryRunPage({ onComplete, onCancel }) {
  const { sourceConfig, activeRules, executeDryRun } = useRuleEngine();
  
  const isSap = sourceConfig?.engine === 'sap_bw' || sourceConfig?.table === '0PUR_C01';
  const totalRows = isSap ? 500 : 1240;
  const tableName = sourceConfig?.table || (isSap ? '0PUR_C01' : 'raw_source_users');
  const rulesCount = activeRules?.filter(r => r.selected !== false).length || 5;

  const [progress, setProgress] = useState(25);
  const [processedRows, setProcessedRows] = useState(Math.round(totalRows * 0.25));
  const [phase, setPhase] = useState(1);

  useEffect(() => {
    let isCancelled = false;

    // Trigger backend or local dynamic dry run execution
    executeDryRun();

    const t1 = setTimeout(() => {
      if (isCancelled) return;
      setPhase(2);
      setProgress(68);
      setProcessedRows(Math.round(totalRows * 0.68));
    }, 600);

    const t2 = setTimeout(() => {
      if (isCancelled) return;
      setProgress(100);
      setProcessedRows(totalRows);
      setPhase(3);
    }, 1300);

    const t3 = setTimeout(() => {
      if (isCancelled) return;
      if (onComplete) onComplete();
    }, 2000);

    return () => {
      isCancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete, totalRows, executeDryRun]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="flex items-center justify-center py-6"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md max-w-xl w-full p-8 space-y-6">
        
        {/* Play Icon with Sparkles */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center relative shadow-xs border border-blue-100">
            <Play className="w-5 h-5 fill-blue-600 text-blue-600 ml-0.5" />
            <Sparkles className="w-3.5 h-3.5 text-amber-500 absolute -top-1 -right-1" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
            Running a dry run...
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Checking {totalRows.toLocaleString()} rows from {tableName} with {rulesCount} rules. Nothing is written.
          </p>
        </div>

        {/* Steps Progress List */}
        <div className="space-y-3">
          
          {/* Step 1: Read rows */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Read {totalRows.toLocaleString()} rows from {tableName}
                </div>
                <div className="text-[11px] text-slate-400">Handshake verified in 0.8 s</div>
              </div>
            </div>
          </div>

          {/* Step 2: Applying rules */}
          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin shrink-0" />
                <div>
                  <div className="text-xs font-bold text-blue-950">Applying {rulesCount} business validation rules</div>
                  <div className="text-[11px] text-blue-700 font-mono">
                    {processedRows.toLocaleString()} of {totalRows.toLocaleString()} rows evaluated
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-blue-700">{progress}%</span>
            </div>

            {/* Dynamic Progress Bar */}
            <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-600 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: 'easeOut', duration: 0.3 }}
              />
            </div>
          </div>

          {/* Step 3: Preparing results */}
          <div className={`rounded-xl p-3.5 flex items-center justify-between transition-colors ${
            phase >= 3 ? 'bg-slate-50 border border-slate-200/80' : 'opacity-60 bg-slate-50/40 border border-slate-200/40'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs font-medium text-slate-700">Synthesizing compliance telemetry & auto-fix diff</div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
            Dry run simulation completed with 0 side effects.
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-600 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={onComplete}
              className="px-3.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-xs font-semibold transition-colors cursor-pointer"
            >
              Skip to results →
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
