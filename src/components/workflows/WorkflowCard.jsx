import React from 'react';

/**
 * WorkflowCard - Exact Card Layout matching Screenshot
 */
export default function WorkflowCard({
  workflow,
  onOpenCanvas,
  onRunDryRun,
  onDelete
}) {
  const {
    id,
    title,
    domain,
    description,
    status = 'Live',
    pipelineTag,
    health = 96.8,
    runsCount = 24,
    icon: IconComponent
  } = workflow;

  const isBelowThreshold = status.toLowerCase().includes('below');
  const isDraft = status.toLowerCase() === 'draft';
  const isLive = !isBelowThreshold && !isDraft;

  return (
    <div className="bg-white dark:bg-[#18181C] rounded-[22px] border border-[#E3E6EE] dark:border-white/[0.08] p-5 sm:p-6 shadow-2xs hover:shadow-md hover:border-[#2D55F5]/30 transition-all flex flex-col justify-between group">
      <div>
        {/* Top Header: Icon + Domain label & Title */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F5F7FB] dark:bg-white/[0.04] border border-[#E3E6EE] dark:border-white/[0.08] flex items-center justify-center shrink-0">
            {IconComponent ? <IconComponent /> : (
              <div className="w-5 h-5 rounded bg-[#2D55F5]/20 text-[#2D55F5] font-bold text-xs flex items-center justify-center">
                W
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-[#5F6678] dark:text-slate-400 capitalize truncate">
              {domain}
            </p>
            <h3 className="font-bold text-sm sm:text-[14px] text-[#0A0F1F] dark:text-white mt-0.5 group-hover:text-[#2D55F5] transition-colors leading-snug">
              {title}
            </h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-[#5F6678] dark:text-slate-400 leading-relaxed mt-3 min-h-[36px]">
          {description}
        </p>

        {/* Pipeline Summary Tag */}
        <div className="mt-3">
          <span className="inline-block px-2.5 py-1 rounded-md bg-[#F5F6FA] dark:bg-white/[0.04] border border-[#E3E6EE]/80 dark:border-white/[0.06] text-[11px] font-normal text-[#474E61] dark:text-slate-300">
            {pipelineTag}
          </span>
        </div>

        {/* Health Row */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#5F6678] dark:text-slate-400 font-medium">
              Health
            </span>
            <span className="text-[#0A0F1F] dark:text-white font-semibold">
              {health}%
            </span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-1 bg-[#EEF2FF] dark:bg-white/[0.06] rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                isBelowThreshold ? 'bg-[#D97706]' : 'bg-[#2D55F5]'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, health))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer Row: Status Pill on Left, Open Button on Right */}
      <div className="pt-4 mt-3 flex items-center justify-between gap-2">
        {/* Status Pill with dot */}
        {isBelowThreshold ? (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#FEF3C7]/60 text-[#B45309]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
            <span>Below threshold</span>
            <span className="text-slate-500 font-normal ml-0.5">{runsCount} runs</span>
          </div>
        ) : isLive ? (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#EAFBEB] text-[#127A52]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            <span>Live</span>
            <span className="text-slate-500 font-normal ml-0.5">{runsCount} runs</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>Draft</span>
            <span className="text-slate-500 font-normal ml-0.5">{runsCount} runs</span>
          </div>
        )}

        {/* Open Button */}
        <button
          type="button"
          onClick={() => onOpenCanvas(workflow)}
          className="px-4 py-1.5 rounded-full border border-[#CDD2DE] dark:border-white/[0.12] bg-white dark:bg-white/[0.04] hover:border-[#2D55F5] hover:text-[#2D55F5] text-xs font-semibold text-[#0A0F1F] dark:text-white transition-all cursor-pointer shadow-2xs"
        >
          Open
        </button>
      </div>
    </div>
  );
}
