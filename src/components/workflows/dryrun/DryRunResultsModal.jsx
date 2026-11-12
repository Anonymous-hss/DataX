import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { 
  Check, 
  X, 
  RotateCcw, 
  Play, 
  Inbox, 
  Zap, 
  ArrowRight
} from 'lucide-react';
import { useNavigation } from '../../../context/NavigationContext';
import DryRunOrbGraphic from './DryRunOrbGraphic';
export { DryRunOrbGraphic };

export default function DryRunResultsModal({
  isOpen = true,
  onClose,
  onBack,
  onReRun,
  onRunLive,
  totalRows = 1420,
  cleanCount = 1250,
  autoFixedCount = 126,
  quarantinedCount = 170,
  complianceRate = "96.9%",
  tableName = "OPUR_C01",
  targetTableName = "OPUR_C01_clean",
  rulesCount = 5,
  ruleOutcomes,
  elapsedTime = "1.18 s",
  runTime = "16:08:56"
}) {
  const { navigateTo } = useNavigation();
  const [autoFixLive, setAutoFixLive] = useState(true);

  // Keyboard shortcut (Escape) to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (onClose) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll while modal dialog is open to keep background fixed & dulled
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Default high-precision business rules matching SS 4
  const displayRules = (ruleOutcomes && ruleOutcomes.length > 0) ? ruleOutcomes : [
    { name: 'Positive line quantity', rowsAffected: 45, action: 'Quarantined', type: 'quarantine' },
    { name: 'Calculation equality', rowsAffected: 38, action: 'Quarantined', type: 'quarantine' },
    { name: 'Mandatory vendor code', rowsAffected: 41, action: 'Quarantined', type: 'quarantine' },
    { name: 'Authorized S/4HANA plant', rowsAffected: 46, action: 'Auto-fixed', type: 'autofix' },
    { name: 'Sequential line item', rowsAffected: 63, action: 'Auto-fixed', type: 'autofix' },
  ];

  const handleInspectQuarantine = () => {
    if (onClose) onClose();
    navigateTo('quarantine');
  };

  const modalNode = (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-slate-900/60 backdrop-blur-xs font-sans"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#18181C] border border-[#E3E6EE] dark:border-white/[0.08] rounded-[24px] max-w-[780px] w-full max-h-[min(90vh,860px)] shadow-2xl relative text-left flex flex-col overflow-hidden"
      >
        {/* Top Header Row - Fixed/Pinned with Clean Padding */}
        <div className="px-6 sm:px-8 pt-6 pb-4 sm:pt-7 sm:pb-5 border-b border-[#F0F2F6] dark:border-white/[0.06] flex items-start justify-between gap-4 shrink-0 bg-white dark:bg-[#18181C]">
          <div className="flex items-start gap-4 min-w-0">
            <DryRunOrbGraphic />

            <div className="min-w-0">
              {/* Green Passing Status Pill */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ECFDF5] dark:bg-emerald-950/40 border border-[#A7F3D0] dark:border-emerald-800/50 text-[#127A52] dark:text-emerald-400 text-xs font-semibold mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#127A52] dark:bg-emerald-400" />
                Dry run passed · nothing written
              </div>

              {/* Main Modal Title */}
              <h2 className="text-lg sm:text-2xl font-bold text-[#0A0F1F] dark:text-white tracking-tight leading-snug">
                Your rules are ready to run live
              </h2>

              {/* Subtitle */}
              <p className="text-xs sm:text-sm text-[#5F6678] dark:text-slate-400 mt-1 leading-relaxed">
                {rulesCount} rules checked {totalRows.toLocaleString()} rows from {tableName}. Zero unverified rows were written to the target.
              </p>

              {/* Timing Metadata */}
              <div className="text-[11px] font-mono text-[#8E95A9] dark:text-slate-500 mt-1">
                {elapsedTime} elapsed · Run at {runTime}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer shrink-0"
            title="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body - Scrollable with High-Resolution Responsive Padding */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-5 space-y-6 no-scrollbar">
          {/* 5-Column Metric Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {/* 1. Rows checked */}
            <div className="bg-[#F8FAFC] dark:bg-white/[0.02] border border-[#E3E6EE] dark:border-white/[0.08] rounded-2xl p-3.5">
              <div className="text-[11px] font-medium text-[#5F6678] dark:text-slate-400">Rows checked</div>
              <div className="text-xl sm:text-2xl font-bold text-[#0A0F1F] dark:text-white mt-1">
                {totalRows.toLocaleString()}
              </div>
            </div>

            {/* 2. Clean */}
            <div className="bg-[#F8FAFC] dark:bg-white/[0.02] border border-[#E3E6EE] dark:border-white/[0.08] rounded-2xl p-3.5">
              <div className="text-[11px] font-medium text-[#5F6678] dark:text-slate-400">Clean</div>
              <div className="text-xl sm:text-2xl font-bold text-[#127A52] mt-1">
                {cleanCount.toLocaleString()}
              </div>
            </div>

            {/* 3. Auto-fixed */}
            <div className="bg-[#F8FAFC] dark:bg-white/[0.02] border border-[#E3E6EE] dark:border-white/[0.08] rounded-2xl p-3.5">
              <div className="text-[11px] font-medium text-[#5F6678] dark:text-slate-400">Auto-fixed</div>
              <div className="text-xl sm:text-2xl font-bold text-[#2D55F5] mt-1">
                {autoFixedCount.toLocaleString()}
              </div>
            </div>

            {/* 4. Quarantined */}
            <div className="bg-[#F8FAFC] dark:bg-white/[0.02] border border-[#E3E6EE] dark:border-white/[0.08] rounded-2xl p-3.5">
              <div className="text-[11px] font-medium text-[#5F6678] dark:text-slate-400">Quarantined</div>
              <div className="text-xl sm:text-2xl font-bold text-[#C06815] mt-1">
                {quarantinedCount.toLocaleString()}
              </div>
            </div>

            {/* 5. Compliance Rate (Dark Badge with Lime Bar) */}
            <div className="col-span-2 sm:col-span-1 bg-[#0A0F1F] text-white rounded-2xl p-3.5 flex flex-col justify-between shadow-xs">
              <div className="text-[11px] font-medium text-[#8E95A9]">Compliance rate</div>
              <div>
                <div className="text-xl font-bold text-white tracking-tight">
                  {complianceRate}
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1.5">
                  <div 
                    className="h-full bg-[#D4FF3A] rounded-full"
                    style={{ width: complianceRate }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Rule Outcomes Table */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs sm:text-sm font-bold text-[#0A0F1F] dark:text-white">
                Rule outcomes
              </h4>
              <span className="text-[11px] font-mono text-[#5F6678] dark:text-slate-400">
                Engine: DuckDB in-process
              </span>
            </div>

            <div className="border border-[#E3E6EE] dark:border-white/[0.08] rounded-2xl overflow-hidden divide-y divide-[#E3E6EE] dark:divide-white/[0.08]">
              {/* Table Header */}
              <div className="grid grid-cols-12 bg-[#F8FAFC] dark:bg-white/[0.03] px-4 py-2 text-[10px] font-bold text-[#5F6678] dark:text-slate-400 tracking-wider">
                <div className="col-span-6">RULE</div>
                <div className="col-span-3 text-right">ROWS AFFECTED</div>
                <div className="col-span-3 text-right">ACTION TAKEN</div>
              </div>

              {/* Table Body Rows */}
              <div className="max-h-[220px] overflow-y-auto divide-y divide-[#E3E6EE] dark:divide-white/[0.08] no-scrollbar">
                {displayRules.map((r, idx) => (
                  <div 
                    key={idx} 
                    className="grid grid-cols-12 px-4 py-2.5 text-xs items-center hover:bg-[#F9FAFC] dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="col-span-6 font-medium text-[#0A0F1F] dark:text-white truncate">
                      {r.name}
                    </div>
                    <div className="col-span-3 text-right font-mono font-semibold text-[#5F6678] dark:text-slate-300">
                      {r.rowsAffected}
                    </div>
                    <div className="col-span-3 text-right">
                      {r.type === 'quarantine' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFF9F2] dark:bg-amber-950/40 border border-[#FDE5CC] dark:border-amber-900/50 text-[#C06815] text-[11px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C06815]" />
                          Quarantined
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F5F8FF] dark:bg-blue-950/40 border border-[#DCE4FF] dark:border-blue-900/50 text-[#2D55F5] text-[11px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2D55F5]" />
                          Auto-fixed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quarantine Isolation Callout Card */}
          <div className="p-4 rounded-2xl bg-[#FFF9F2] dark:bg-amber-950/20 border border-[#FDE5CC] dark:border-amber-900/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#18181C] border border-[#FDE5CC] dark:border-amber-900/50 flex items-center justify-center text-[#C06815] shrink-0 shadow-2xs">
                <Inbox className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold text-[#0A0F1F] dark:text-white truncate">
                  {quarantinedCount.toLocaleString()} records isolated in quarantine
                </div>
                <div className="text-[11px] text-[#5F6678] dark:text-slate-400 truncate">
                  Held back from {targetTableName} until reviewed
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleInspectQuarantine}
              className="text-xs sm:text-sm font-bold text-[#0A0F1F] dark:text-white hover:text-[#C06815] transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <span>Inspect records</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Live Auto-Fix Toggle Card */}
          <div className="p-4 rounded-2xl bg-[#F5F8FF] dark:bg-blue-950/20 border border-[#DCE4FF] dark:border-blue-900/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#18181C] border border-[#DCE4FF] dark:border-blue-900/50 flex items-center justify-center text-[#2D55F5] shrink-0 shadow-2xs">
                <Zap className="w-4 h-4 fill-current text-[#2D55F5]" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold text-[#0A0F1F] dark:text-white truncate">
                  Keep auto-fix on while live
                </div>
                <div className="text-[11px] text-[#5F6678] dark:text-slate-400 line-clamp-1">
                  Warning rules fix new rows as they arrive. Critical violations go to quarantine for review.
                </div>
              </div>
            </div>

            {/* Interactive Toggle Switch */}
            <button
              type="button"
              onClick={() => setAutoFixLive(!autoFixLive)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                autoFixLive ? 'bg-[#2D55F5]' : 'bg-[#CDD2DE] dark:bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  autoFixLive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Bottom Actions Footer - Sticky at bottom */}
        <div className="px-6 sm:px-8 py-4 bg-[#F9FAFC] dark:bg-white/[0.02] border-t border-[#E3E6EE] dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-[#8E95A9] dark:text-slate-500 hidden sm:inline">
            Live runs stream new rows and enforce verified rules continuously.
          </span>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onBack || onClose}
              className="px-4 py-2 rounded-full border border-transparent hover:bg-slate-200/60 dark:hover:bg-white/[0.05] text-xs font-semibold text-[#5F6678] dark:text-slate-300 transition-colors cursor-pointer"
            >
              ← Back
            </button>

            <button
              type="button"
              onClick={onReRun}
              className="px-4 py-2 rounded-full border border-[#CDD2DE] dark:border-white/[0.12] bg-white dark:bg-white/[0.03] hover:bg-[#F8FAFC] dark:hover:bg-white/[0.06] text-xs font-semibold text-[#0A0F1F] dark:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Re-run</span>
            </button>

            <button
              type="button"
              onClick={onRunLive}
              className="px-5 py-2.5 rounded-full bg-[#2D55F5] hover:bg-[#1E44D6] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run live</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalNode, document.body)
    : modalNode;
}
