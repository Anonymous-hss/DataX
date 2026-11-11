import React from 'react';
import { Check } from 'lucide-react';

/**
 * DryRunStep - Run a deterministic dry run (Step 3 of 4)
 * Displays real dynamic numbers computed from the connected source database
 */
export default function DryRunStep({ 
  extracted = 1420, 
  clean = 1140, 
  autoFixed = 219, 
  quarantined = 61, 
  compliance = 98.4,
  batchLatency = 15
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-[#5F6678] dark:text-slate-400">
        Preview rules in memory without touching target databases.
      </p>

      {/* 4 Dynamic Metric Boxes matching 00.10 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Extracted */}
        <div className="bg-white dark:bg-white/[0.03] border border-[#E3E6EE] dark:border-white/[0.08] rounded-[18px] p-4 text-left shadow-2xs">
          <p className="text-xs text-[#5F6678] dark:text-slate-400 font-medium mb-1">
            Extracted
          </p>
          <p className="text-2xl font-bold text-[#0A0F1F] dark:text-white font-sans tracking-tight">
            {extracted.toLocaleString()}
          </p>
        </div>

        {/* Clean */}
        <div className="bg-white dark:bg-white/[0.03] border border-[#E3E6EE] dark:border-white/[0.08] rounded-[18px] p-4 text-left shadow-2xs">
          <p className="text-xs text-[#5F6678] dark:text-slate-400 font-medium mb-1">
            Clean
          </p>
          <p className="text-2xl font-bold text-[#22845E] font-sans tracking-tight">
            {clean.toLocaleString()}
          </p>
        </div>

        {/* Auto-fixed */}
        <div className="bg-white dark:bg-white/[0.03] border border-[#E3E6EE] dark:border-white/[0.08] rounded-[18px] p-4 text-left shadow-2xs">
          <p className="text-xs text-[#5F6678] dark:text-slate-400 font-medium mb-1">
            Auto-fixed
          </p>
          <p className="text-2xl font-bold text-[#2D55F5] font-sans tracking-tight">
            {autoFixed.toLocaleString()}
          </p>
        </div>

        {/* Quarantined */}
        <div className="bg-white dark:bg-white/[0.03] border border-[#E3E6EE] dark:border-white/[0.08] rounded-[18px] p-4 text-left shadow-2xs">
          <p className="text-xs text-[#5F6678] dark:text-slate-400 font-medium mb-1">
            Quarantined
          </p>
          <p className="text-2xl font-bold text-[#D97706] font-sans tracking-tight">
            {quarantined.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Simulation Verified Callout Box matching 00.10 */}
      <div className="p-3.5 rounded-[14px] bg-[#ECFDF5] border border-[#34D399]/40 flex items-start gap-2.5 text-left mt-4 shadow-2xs">
        <Check className="w-4 h-4 text-[#22845E] shrink-0 mt-0.5" strokeWidth={2.5} />
        <div>
          <h4 className="text-xs font-bold text-[#065F46] mb-0.5">
            Simulation verified
          </h4>
          <p className="text-xs text-[#065F46]/90 leading-relaxed">
            Zero dropped rows · {compliance}% compliance · under {batchLatency} ms per batch.
          </p>
        </div>
      </div>
    </div>
  );
}
