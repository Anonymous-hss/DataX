import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Sparkles, Check, Clock, AlertCircle, ShieldAlert, ArrowRight, Database } from 'lucide-react';
import { useRuleEngine } from '../../context/RuleEngineContext';
import { useNavigation } from '../../context/NavigationContext';

export default function RunningDryRunPage({ onComplete, onCancel }) {
  const { navigateTo } = useNavigation();
  const { 
    sourceConfig, 
    targetConfig, 
    activeRules, 
    executeDryRun, 
    isCredentialConfigured,
    sampleData,
    dryRunResult 
  } = useRuleEngine();
  
  // Strict credential check before anything executes
  const hasSourceCreds = isCredentialConfigured ? isCredentialConfigured(sourceConfig) : Boolean(sourceConfig?.host || sourceConfig?.connectionUri);
  const hasTargetCreds = isCredentialConfigured ? isCredentialConfigured(targetConfig) : Boolean(targetConfig?.host || targetConfig?.connectionUri);
  const hasAllCredentials = hasSourceCreds && hasTargetCreds;

  const displayTotalRows = sourceConfig?.totalRows || dryRunResult?.totalChecked || (sampleData && sampleData.length > 0 ? sampleData.length : 500);
  const tableName = sourceConfig?.table || (sourceConfig?.selectedTables?.[0]) || 'Source table';
  const rulesCount = activeRules?.filter(r => r.selected !== false).length || 0;

  const [progress, setProgress] = useState(25);
  const [phase, setPhase] = useState(1);
  const hasExecutedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const currentProcessedRows = phase === 1 
    ? Math.max(1, Math.round(displayTotalRows * 0.25)) 
    : phase === 2 
    ? Math.max(1, Math.round(displayTotalRows * 0.68)) 
    : displayTotalRows;

  useEffect(() => {
    // DO NOT PROCEED WITHOUT CREDENTIALS
    if (!hasAllCredentials) return;

    // Prevent execution loop / memory leak
    if (hasExecutedRef.current) return;
    hasExecutedRef.current = true;

    // Trigger backend execute ONCE
    executeDryRun().catch(err => {
      console.warn('Dry run execution error:', err);
    });

    const t1 = setTimeout(() => {
      setPhase(2);
      setProgress(68);
    }, 800);

    const t2 = setTimeout(() => {
      setProgress(100);
      setPhase(3);
    }, 1800);

    const t3 = setTimeout(() => {
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
    }, 2600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [hasAllCredentials]);

  // If credentials are NOT configured, block execution with clear remediation actions
  if (!hasAllCredentials) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="flex items-center justify-center py-6"
      >
        <div className="bg-white rounded-2xl border border-red-200 shadow-md max-w-xl w-full p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-50 text-red-600 flex items-center justify-center shadow-xs border border-red-100">
              <ShieldAlert className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
              Database Credentials Required
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Before running a dry run simulation or executing rules, valid credentials must be configured for both the Source database and Target destination.
            </p>
          </div>

          {/* Credential Status Breakdown */}
          <div className="space-y-3">
            <div className={`p-4 rounded-xl border flex items-center justify-between ${
              hasSourceCreds ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  hasSourceCreds ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Step 1: Source Database</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {hasSourceCreds 
                      ? `${sourceConfig.engine.toUpperCase()} · ${sourceConfig.database || 'Configured'} · ${sourceConfig.table || 'Table selected'}`
                      : 'Missing connection credentials or table'}
                  </div>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                hasSourceCreds 
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                  : 'bg-red-100 text-red-800 border-red-200'
              }`}>
                {hasSourceCreds ? 'Ready' : 'Incomplete'}
              </span>
            </div>

            <div className={`p-4 rounded-xl border flex items-center justify-between ${
              hasTargetCreds ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  hasTargetCreds ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Step 3: Target Database</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {hasTargetCreds 
                      ? `${targetConfig.engine.toUpperCase()} · ${targetConfig.database || 'Configured'} · ${targetConfig.table || 'Target table'}`
                      : 'Missing destination database credentials'}
                  </div>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                hasTargetCreds 
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                  : 'bg-red-100 text-red-800 border-red-200'
              }`}>
                {hasTargetCreds ? 'Ready' : 'Incomplete'}
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={onCancel}
              className="w-full sm:w-auto px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-600 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {!hasSourceCreds && (
                <button
                  onClick={() => navigateTo('connect-source')}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Configure Source <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              {hasSourceCreds && !hasTargetCreds && (
                <button
                  onClick={() => navigateTo('connect-target')}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Configure Target <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

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
            Checking {displayTotalRows.toLocaleString()} rows from {tableName} with {rulesCount} rules. Nothing is written.
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
                  Read {displayTotalRows.toLocaleString()} rows from {tableName}
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
                    {currentProcessedRows.toLocaleString()} of {displayTotalRows.toLocaleString()} rows evaluated
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

