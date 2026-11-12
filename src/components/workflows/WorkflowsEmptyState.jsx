import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

/**
 * PulseMonitorIcon matches the custom monitor badge in 01.1 Empty State (SS 1)
 */
export function PulseMonitorIcon({ className = "w-16 h-14" }) {
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg 
        className={className} 
        viewBox="0 0 64 52" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Monitor Screen Frame */}
        <rect 
          x="3" 
          y="4" 
          width="58" 
          height="42" 
          rx="12" 
          fill="#0B132B" 
          stroke="#0A0F1F" 
          strokeWidth="3.5" 
        />
        {/* ECG / Heartbeat Pulse Line */}
        <path 
          d="M10 25H21L25 15L31 35L36 21L40 27H54" 
          stroke="#2D55F5" 
          strokeWidth="3.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </svg>
      {/* Lime / Yellow Status Dot on top-right corner */}
      <span className="absolute top-0 -right-1 w-3.5 h-3.5 rounded-full bg-[#D4FF3A] border-2 border-white dark:border-[#18181C] shadow-xs" />
    </div>
  );
}

export default function WorkflowsEmptyState({ onShowReady, onNewWorkflow }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-[#18181C] border border-[#E3E6EE] dark:border-white/[0.08] rounded-[24px] p-12 sm:p-20 text-center flex flex-col items-center justify-center shadow-xs"
    >
      {/* Pulse Monitor Illustration */}
      <div className="mb-4">
        <PulseMonitorIcon />
      </div>

      {/* Main Empty State Header */}
      <h3 className="text-xl sm:text-[22px] font-bold text-[#0A0F1F] dark:text-white tracking-tight">
        No live workflows yet
      </h3>

      {/* Descriptive Subtitle */}
      <p className="text-sm text-[#5F6678] dark:text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
        A workflow goes live after a passing dry run. Open a ready workflow and run it, or start a new one.
      </p>

      {/* Action Buttons Row */}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onShowReady}
          className="px-5 py-2.5 rounded-full border border-[#CDD2DE] dark:border-white/[0.12] bg-white dark:bg-white/[0.04] hover:bg-[#F8FAFC] dark:hover:bg-white/[0.08] text-[#0A0F1F] dark:text-white text-sm font-medium transition-all shadow-xs cursor-pointer"
        >
          Show ready workflows
        </button>

        <button
          type="button"
          onClick={onNewWorkflow}
          className="px-5 py-2.5 rounded-full bg-[#2D55F5] hover:bg-[#1E44D6] text-white text-sm font-medium transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New workflow</span>
        </button>
      </div>
    </motion.div>
  );
}

