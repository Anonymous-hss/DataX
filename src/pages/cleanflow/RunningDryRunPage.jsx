import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Sparkles, Check, Clock, AlertCircle } from 'lucide-react';

export default function RunningDryRunPage({ onComplete, onCancel }) {
  const [progress, setProgress] = useState(20);
  const [processedRows, setProcessedRows] = useState(248);
  const [phase, setPhase] = useState(1);

  useEffect(() => {
    // Dynamic progressive step animation matching Image 3 (06->07)
    const t1 = setTimeout(() => {
      setPhase(2);
      setProgress(64);
      setProcessedRows(794);
    }, 600);

    const t2 = setTimeout(() => {
      setProgress(100);
      setProcessedRows(1240);
    }, 1400);

    const t3 = setTimeout(() => {
      setPhase(3);
    }, 1800);

    const t4 = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

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
            Checking 1,240 rows from raw_source_users with 5 rules. Nothing is written.
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
                <div className="text-xs font-bold text-slate-900">Read 1,240 rows from raw_source_users</div>
                <div className="text-[11px] text-slate-400">Took 1.2 s</div>
              </div>
            </div>
          </div>

          {/* Step 2: Applying 5 rules (Active with live progress bar) */}
          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin shrink-0" />
                <div>
                  <div className="text-xs font-bold text-blue-950">Applying 5 rules</div>
                  <div className="text-[11px] text-blue-700 font-mono">
                    {processedRows} of 1,240 rows
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
              <div className="text-xs font-medium text-slate-700">Preparing results</div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
            Usually under 10 seconds.
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onComplete}
              className="px-3.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-xs font-semibold transition-colors"
            >
              Skip to results →
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
