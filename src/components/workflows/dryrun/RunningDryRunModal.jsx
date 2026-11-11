import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Check, Clock, X, Loader2 } from 'lucide-react';

export default function RunningDryRunModal({
  isOpen = true,
  onClose,
  onComplete,
  onCancel,
  totalRows = 1420,
  tableName = 'OPUR_C01',
  rulesCount = 5
}) {
  const [phase, setPhase] = useState(2); // 1 = Read, 2 = Rules (68%), 3 = Done
  const [processedRows, setProcessedRows] = useState(966);
  const [progressPercent, setProgressPercent] = useState(68);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!isOpen) return;

    // Simulate real smooth progress through the 3 phases
    const t1 = setTimeout(() => {
      setPhase(2);
      setProgressPercent(68);
      setProcessedRows(Math.round(totalRows * 0.68));
    }, 400);

    const t2 = setTimeout(() => {
      setPhase(3);
      setProgressPercent(100);
      setProcessedRows(totalRows);
    }, 2200);

    const t3 = setTimeout(() => {
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
    }, 3000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen, totalRows]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs font-sans"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white dark:bg-[#18181C] border border-[#E3E6EE] dark:border-white/[0.08] rounded-[24px] max-w-[560px] w-full p-7 sm:p-8 shadow-2xl relative text-left overflow-hidden"
      >
        {/* Top Header Row with Play Icon & Close */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-white/[0.04] flex items-center justify-center text-slate-800 dark:text-white shrink-0">
              <Play className="w-4 h-4 fill-current text-slate-800 dark:text-white ml-0.5" />
            </div>
            <h2 className="text-xl font-bold text-[#0A0F1F] dark:text-white tracking-tight">
              Running a dry run...
            </h2>
          </div>

          <button
            type="button"
            onClick={onCancel || onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
            title="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-[#5F6678] dark:text-slate-400 mb-6">
          Checking {totalRows.toLocaleString()} rows from {tableName} with {rulesCount} rules. Nothing is written.
        </p>

        {/* 3 Step Cards */}
        <div className="space-y-3">
          {/* Step 1: Handshake & Read Rows */}
          <div className="bg-[#F8FAFC] dark:bg-white/[0.02] border border-[#E3E6EE] dark:border-white/[0.08] rounded-2xl p-4 flex items-center gap-3.5">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-[#127A52] flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-[#0A0F1F] dark:text-white">
                Read {totalRows.toLocaleString()} rows from {tableName}
              </div>
              <div className="text-[11px] text-[#5F6678] dark:text-slate-400 mt-0.5">
                Handshake verified in 0.8 s
              </div>
            </div>
          </div>

          {/* Step 2: Applying Rules with Progress Bar */}
          <div className="bg-white dark:bg-[#18181C] border border-blue-200 dark:border-blue-900/50 rounded-2xl p-4 space-y-2.5 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="w-6 h-6 rounded-full border-2 border-[#2D55F5] border-t-transparent animate-spin shrink-0" />
              <div>
                <div className="text-xs sm:text-sm font-bold text-[#0A0F1F] dark:text-white">
                  Applying {rulesCount} business validation rules
                </div>
                <div className="text-[11px] text-[#5F6678] dark:text-slate-400 mt-0.5">
                  {processedRows.toLocaleString()} of {totalRows.toLocaleString()} rows · {progressPercent}%
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-[#F1F3F9] dark:bg-white/[0.08] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#2D55F5] rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Step 3: Telemetry & auto-fix diff */}
          <div className="bg-white dark:bg-[#18181C] border border-[#E3E6EE] dark:border-white/[0.08] rounded-2xl p-4 flex items-center gap-3.5">
            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/[0.05] text-[#8E95A9] flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-semibold text-[#5F6678] dark:text-slate-300">
                Synthesizing compliance telemetry & auto-fix diff
              </div>
              <div className="text-[11px] text-[#8E95A9] dark:text-slate-500 mt-0.5">
                {phase === 3 ? 'Completed' : 'Waiting'}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-7 pt-4 border-t border-[#F0F2F6] dark:border-white/[0.08] flex items-center justify-between">
          <span className="text-xs text-[#8E95A9] dark:text-slate-500">
            Usually under 10 seconds. No side effects.
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onComplete}
              className="text-xs sm:text-sm font-semibold text-[#0A0F1F] dark:text-white hover:text-[#2D55F5] transition-colors cursor-pointer"
            >
              Skip to results →
            </button>

            <button
              type="button"
              onClick={onCancel || onClose}
              className="px-5 py-2 rounded-full border border-[#CDD2DE] dark:border-white/[0.12] bg-white dark:bg-white/[0.03] hover:bg-[#F8FAFC] dark:hover:bg-white/[0.06] text-xs font-semibold text-[#0A0F1F] dark:text-white transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

