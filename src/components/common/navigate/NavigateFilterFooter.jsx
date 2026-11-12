import React from 'react';
import { Wrench } from 'lucide-react';

/**
 * NavigateFilterFooter - Bottom Controls matching 00.12 & second screenshot
 * (Removed 'Vault · AES-GCM · on-prem ready' as requested)
 */
export default function NavigateFilterFooter({
  onOpenAdvisor,
  onClearFilters
}) {
  return (
    <div className="pt-3 border-t border-[#E3E6EE] dark:border-white/[0.08] flex items-center justify-between text-xs mt-2 shrink-0">
      {/* Left: Advisor */}
      <button
        type="button"
        onClick={onOpenAdvisor}
        className="flex items-center gap-1.5 font-medium text-[#0A0F1F] dark:text-white hover:text-[#2D55F5] transition-colors cursor-pointer"
      >
        <Wrench className="w-3.5 h-3.5 text-[#5F6678]" />
        <span>Use case advisor</span>
      </button>

      {/* Right: Clear filters */}
      <button
        type="button"
        onClick={onClearFilters}
        className="text-[#5F6678] hover:text-[#0A0F1F] dark:hover:text-white font-medium transition-colors cursor-pointer"
      >
        Clear filters
      </button>
    </div>
  );
}
