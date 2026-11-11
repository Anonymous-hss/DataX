import React from 'react';

/**
 * EnvironmentInfo - Cloud Region, Auth Architecture, & Release Version (00.6)
 */
export default function EnvironmentInfo() {
  return (
    <div className="p-4 space-y-2">
      <span className="block text-[11px] font-bold tracking-wider text-[#5F6678] dark:text-slate-400 uppercase mb-2">
        Environment
      </span>

      <div className="flex items-center justify-between text-xs py-0.5">
        <span className="text-[#5F6678] dark:text-slate-400">Region</span>
        <span className="font-mono text-[#0A0F1F] dark:text-white font-medium">AWS us-east-2 · 24 ms</span>
      </div>

      <div className="flex items-center justify-between text-xs py-0.5">
        <span className="text-[#5F6678] dark:text-slate-400">Auth engine</span>
        <span className="font-mono text-[#0A0F1F] dark:text-white font-medium">PostgreSQL JWT (RS256)</span>
      </div>

      <div className="flex items-center justify-between text-xs py-0.5">
        <span className="text-[#5F6678] dark:text-slate-400">Version</span>
        <span className="font-mono text-[#0A0F1F] dark:text-white font-medium">v2.5.0-prod</span>
      </div>
    </div>
  );
}
