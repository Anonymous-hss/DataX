import React from 'react';

/**
 * PlatformSettings - Key-Value Settings Rows (00.6)
 */
export default function PlatformSettings({
  onNavigateSettings,
  onNavigatePage
}) {
  return (
    <div className="p-4 space-y-2">
      <span className="block text-[11px] font-bold tracking-wider text-[#5F6678] dark:text-slate-400 uppercase mb-2">
        Platform Settings
      </span>

      <div 
        onClick={() => onNavigateSettings('general')}
        className="flex items-center justify-between text-xs py-0.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.04] -mx-1.5 px-1.5 rounded-lg transition-colors"
      >
        <span className="text-[#5F6678] dark:text-slate-400">Account & organization</span>
        <span className="font-mono text-[#0A0F1F] dark:text-white font-medium">⌘ ,</span>
      </div>

      <div 
        onClick={() => onNavigateSettings('schedules')}
        className="flex items-center justify-between text-xs py-0.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.04] -mx-1.5 px-1.5 rounded-lg transition-colors"
      >
        <span className="text-[#5F6678] dark:text-slate-400">Pipeline schedules</span>
        <span className="font-mono text-[#0A0F1F] dark:text-white font-medium">0 */6 * * *</span>
      </div>

      <div 
        onClick={() => onNavigateSettings('webhooks')}
        className="flex items-center justify-between text-xs py-0.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.04] -mx-1.5 px-1.5 rounded-lg transition-colors"
      >
        <span className="text-[#5F6678] dark:text-slate-400">Alerts & webhooks</span>
        <span className="font-mono text-[#0A0F1F] dark:text-white font-medium">Active</span>
      </div>

      <div 
        onClick={() => onNavigateSettings('team')}
        className="flex items-center justify-between text-xs py-0.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.04] -mx-1.5 px-1.5 rounded-lg transition-colors"
      >
        <span className="text-[#5F6678] dark:text-slate-400">Team & RBAC</span>
        <span className="font-mono text-[#0A0F1F] dark:text-white font-medium">3 members</span>
      </div>

      <div 
        onClick={() => onNavigatePage('audit')}
        className="flex items-center justify-between text-xs py-0.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.04] -mx-1.5 px-1.5 rounded-lg transition-colors"
      >
        <span className="text-[#5F6678] dark:text-slate-400">Audit ledger</span>
        <span className="font-mono text-[#0A0F1F] dark:text-white font-medium">SHA-256</span>
      </div>

      <div 
        onClick={() => onNavigatePage('roi')}
        className="flex items-center justify-between text-xs py-0.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.04] -mx-1.5 px-1.5 rounded-lg transition-colors"
      >
        <span className="text-[#5F6678] dark:text-slate-400">Executive ROI</span>
        <span className="font-mono text-[#0A0F1F] dark:text-white font-medium">$1.42M saved</span>
      </div>
    </div>
  );
}

