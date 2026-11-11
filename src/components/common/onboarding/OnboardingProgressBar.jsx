import React from 'react';

/**
 * OnboardingProgressBar - 4-Segment Pill Progress Bar matching 00.8-11
 */
export default function OnboardingProgressBar({ currentStep }) {
  return (
    <div className="flex items-center gap-2 w-full pt-1 pb-4">
      {[1, 2, 3, 4].map(s => {
        const isCompletedOrActive = s <= currentStep;
        return (
          <div
            key={s}
            className={`h-[3px] rounded-full flex-1 transition-all duration-300 ${
              isCompletedOrActive 
                ? 'bg-[#2D55F5]' 
                : 'bg-[#E3E6EE] dark:bg-white/[0.08]'
            }`}
          />
        );
      })}
    </div>
  );
}

