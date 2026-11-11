import React from 'react';
import { ArrowRight } from 'lucide-react';

/**
 * OnboardingFooter - Bottom navigation actions matching 00.8-11
 */
export default function OnboardingFooter({
  currentStep,
  onSkip,
  onBack,
  onNext,
  isLoading
}) {
  return (
    <div className="flex items-center justify-between pt-6 border-t border-[#E3E6EE]/80 dark:border-white/[0.08] mt-2">
      <button
        type="button"
        onClick={onSkip}
        disabled={isLoading}
        className="text-xs text-[#5F6678] hover:text-[#0A0F1F] dark:hover:text-white font-medium transition-colors cursor-pointer disabled:opacity-50"
      >
        Skip setup
      </button>

      <div className="flex items-center gap-2.5">
        {currentStep > 1 && (
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="px-4 py-1.5 rounded-full border border-[#CDD2DE] dark:border-white/[0.1] bg-white dark:bg-white/[0.04] hover:bg-[#F5F6FA] dark:hover:bg-white/[0.08] text-xs font-semibold text-[#0A0F1F] dark:text-white transition-all cursor-pointer disabled:opacity-50"
          >
            Back
          </button>
        )}

        <button
          type="button"
          onClick={onNext}
          disabled={isLoading}
          className="px-5 py-2 rounded-full bg-[#2D55F5] hover:bg-blue-600 active:scale-[0.98] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-60"
        >
          <span>{currentStep === 4 ? 'Launch canvas' : 'Continue'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
