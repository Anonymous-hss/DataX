import React from 'react';

/**
 * PlatformSettings - Key-Value Settings Rows (00.6)
 */
export default function PlatformSettings({
  onNavigateSettings,
  onNavigatePage
}) {
  return (
    <div className="px-3.5 py-2 space-y-1">
      <span className="block text-[10px] font-bold tracking-wider text-[#737B92] dark:text-slate-400 uppercase mb-1">
        Platform Settings
      </span>

      <div 
        onClick={() => onNavigateSettings('general')}
        className="flex items-center justify-between text-[11px] py-0.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.04] -mx-1 px-1 rounded-md transition-colors"
      >
        <span className="text-[#5F6678] dark:text-slate-400">Account &amp; organization</span>
        <span className="font-mono text-[#0A0F1F] dark:text-white font-medium">⌘ ,</span>
      </div>

      <div 
        onClick={() => onNavigateSettings('schedules')}
        className="flex items-center justify-between text-[11px] py-0.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.04] -mx-1 px-1 rounded-md transition-colors"
      >
        <span className="text-[#5F6678] dark:text-slate-400">Pipeline schedules</span>
        <span className="font-mono text-[#0A0F1F] dark:text-white font-medium">0 */6 * * *</span>
      </div>

      <div 
        onClick={() => onNavigateSettings('webhooks')}
        className="flex items-center justify-between text-[11px] py-0.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.04] -mx-1 px-1 rounded-md transition-colors"
      >
        <span className="text-[#5F6678] dark:text-slate-400">Alerts &amp; webhooks</span>
        <span className="font-mono text-[#0A0F1F] dark:text-white font-medium">Active</span>
      </div>

      <div 
        onClick={() => onNavigateSettings('team')}
        className="flex items-center justify-between text-[11px] py-0.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.04] -mx-1 px-1 rounded-md transition-colors"
      >
        <span className="text-[#5F6678] dark:text-slate-400">Team &amp; RBAC</span>
        <span className="font-mono text-[#0A0F1F] dark:text-white font-medium">3 members</span>
      </div>

      <div 
        onClick={() => onNavigatePage('audit')}
        className="flex items-center justify-between text-[11px] py-0.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.04] -mx-1 px-1 rounded-md transition-colors"
      >
        <span className="text-[#5F6678] dark:text-slate-400">Audit ledger</span>
        <span className="font-mono text-[#0A0F1F] dark:text-white font-medium">SHA-256</span>
      </div>

      <div 
        onClick={() => onNavigatePage('roi')}
        className="flex items-center justify-between text-[11px] py-0.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.04] -mx-1 px-1 rounded-md transition-colors"
      >
        <span className="text-[#5F6678] dark:text-slate-400">Executive ROI</span>
        <span className="font-mono text-[#0A0F1F] dark:text-white font-medium">$1.42M saved</span>
      </div>
    </div>
  );
}
