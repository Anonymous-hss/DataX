import React from 'react';
import { X } from 'lucide-react';

/**
 * OnboardingModalHeader - Displays Step Counter, Title & Icon matching 00.8-11
 */
export default function OnboardingModalHeader({ step, title, icon: Icon, onClose }) {
  return (
    <div className="flex items-start justify-between pb-4">
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-2xl bg-[#F5F6FA] dark:bg-white/[0.05] border border-[#CDD2DE]/50 dark:border-white/[0.08] flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-[#0A0F1F] dark:text-white" strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-xs text-[#5F6678] dark:text-slate-400 font-medium">
            First-run setup · Step {step} of 4
          </p>
          <h2 className="text-xl font-bold text-[#0A0F1F] dark:text-white leading-tight mt-0.5">
            {title}
          </h2>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="text-[#5F6678] hover:text-[#0A0F1F] dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        aria-label="Close dialog"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

