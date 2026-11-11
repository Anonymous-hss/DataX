import React from 'react';
import { Trash2, Play } from 'lucide-react';

/**
 * WorkflowCard - Interactive CleanFlow Pipeline Card (01.1)
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
    status = 'Ready to run',
    pipelineTag,
    rulesCount = 4,
    schemaMappedPercent = 100,
    icon: IconComponent
  } = workflow;

  const isLive = status.toLowerCase() === 'live';

  return (
    <div className="bg-white dark:bg-[#18181C] rounded-[22px] border border-[#E3E6EE] dark:border-white/[0.08] p-5 sm:p-6 shadow-2xs hover:shadow-md hover:border-[#2D55F5]/30 transition-all flex flex-col justify-between group">
      <div>
        {/* Top Header: Icon + Domain label + Status Pill */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F5F6FA] dark:bg-white/[0.04] border border-[#E3E6EE] dark:border-white/[0.08] flex items-center justify-center shrink-0">
              {IconComponent ? <IconComponent /> : (
                <div className="w-4 h-4 rounded bg-[#2D55F5]/20 text-[#2D55F5] font-bold text-xs flex items-center justify-center">
                  W
                </div>
              )}
            </div>
            <div>
              <p className="text-[11px] font-medium text-[#5F6678] dark:text-slate-400 capitalize">
                {domain}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${
            isLive
              ? 'bg-[#EAFBEB] dark:bg-emerald-950/30 text-[#127A52] dark:text-emerald-400'
              : 'bg-[#EEF2FF] dark:bg-blue-950/30 text-[#2D55F5] dark:text-blue-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-[#127A52]' : 'bg-[#2D55F5]'}`} />
            <span>{status}</span>
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-sm sm:text-[15px] text-[#0A0F1F] dark:text-white mt-3 group-hover:text-[#2D55F5] transition-colors leading-snug">
          {title}
        </h3>

        {/* Description */}
        <p className="text-xs text-[#5F6678] dark:text-slate-400 leading-relaxed mt-2 min-h-[36px]">
          {description}
        </p>

        {/* Pipeline Summary Tag */}
        <div className="mt-3">
          <span className="inline-block px-2.5 py-1 rounded-md bg-[#F5F6FA] dark:bg-white/[0.04] border border-[#E3E6EE]/70 dark:border-white/[0.06] text-[11px] font-mono text-[#474E61] dark:text-slate-300">
            {pipelineTag}
          </span>
        </div>

        {/* Readiness & Progress Row */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#5F6678] dark:text-slate-400 font-medium">
              Readiness · {rulesCount} rules armed
            </span>
            <span className="text-[#2D55F5] dark:text-blue-400 font-semibold">
              {schemaMappedPercent}% schema mapped
            </span>
          </div>
          <div className="w-full h-1 bg-[#EEF2FF] dark:bg-white/[0.06] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#2D55F5] rounded-full transition-all duration-500" 
              style={{ width: `${schemaMappedPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 mt-4 border-t border-[#E3E6EE]/70 dark:border-white/[0.06] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onDelete) onDelete(workflow);
          }}
          className="p-1.5 text-[#8E95A9] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
          title="Delete or archive workflow"
          aria-label="Delete workflow"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onRunDryRun) onRunDryRun(workflow);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#CDD2DE] dark:border-white/[0.1] bg-white dark:bg-white/[0.04] hover:border-[#2D55F5] text-xs font-semibold text-[#0A0F1F] dark:text-white transition-all cursor-pointer shadow-2xs"
          >
            <Play className="w-3 h-3 text-[#5F6678] fill-current" />
            <span>Dry run</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenCanvas) onOpenCanvas(workflow);
            }}
            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#2D55F5] hover:bg-[#2045DC] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <span>Open canvas</span>
          </button>
        </div>
      </div>
    </div>
  );
}
