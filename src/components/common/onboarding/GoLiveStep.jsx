import React from 'react';
import { Check } from 'lucide-react';

const GO_LIVE_FEATURES = [
  "Zero-downtime staging with atomic commit",
  "SHA-256 audit chain for every run",
  "Durable quarantine with fsync persistence for human approval",
  "Auto-fix for whitespace, casing and legacy codes"
];

/**
 * GoLiveStep - Go live and activate remediation (Step 4 of 4)
 */
export default function GoLiveStep() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-[#5F6678] dark:text-slate-400">
        Auto-fix heals syntax issues while bad records are isolated.
      </p>

      <div className="space-y-3 pt-1 pb-2">
        {GO_LIVE_FEATURES.map((feature, idx) => (
          <div key={idx} className="flex items-center gap-3 text-xs font-medium text-[#0A0F1F] dark:text-slate-200">
            <span className="w-5 h-5 rounded-full bg-[#ECFDF5] border border-[#34D399]/40 flex items-center justify-center text-[#22845E] shrink-0 text-xs font-bold shadow-2xs">
              <Check className="w-3 h-3 stroke-[2.5]" />
            </span>
            <span>{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

