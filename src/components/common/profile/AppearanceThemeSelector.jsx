import React from 'react';

/**
 * AppearanceThemeSelector - Segmented Pill Theme Switcher with Smooth Blending (00.6)
 */
export default function AppearanceThemeSelector({ themeMode, onThemeChange }) {
  return (
    <div className="p-4 space-y-2">
      <span className="block text-[11px] font-bold tracking-wider text-[#5F6678] dark:text-slate-400 uppercase">
        Appearance
      </span>

      <div className="bg-[#EDEFF5] dark:bg-white/[0.06] p-1 rounded-full flex h-[36px] items-center">
        <button
          type="button"
          onClick={() => onThemeChange('light')}
          className={`flex-1 h-[28px] text-xs font-semibold rounded-full flex items-center justify-center transition-all cursor-pointer ${
            themeMode === 'light'
              ? 'bg-white dark:bg-[#2A2B32] text-[#2D55F5] dark:text-white shadow-sm'
              : 'text-[#5F6678] dark:text-slate-400 hover:text-[#0A0F1F] dark:hover:text-white font-medium'
          }`}
        >
          Light
        </button>
        <button
          type="button"
          onClick={() => onThemeChange('dark')}
          className={`flex-1 h-[28px] text-xs font-semibold rounded-full flex items-center justify-center transition-all cursor-pointer ${
            themeMode === 'dark'
              ? 'bg-white dark:bg-[#2A2B32] text-[#2D55F5] dark:text-white shadow-sm'
              : 'text-[#5F6678] dark:text-slate-400 hover:text-[#0A0F1F] dark:hover:text-white font-medium'
          }`}
        >
          Dark
        </button>
        <button
          type="button"
          onClick={() => onThemeChange('system')}
          className={`flex-1 h-[28px] text-xs font-semibold rounded-full flex items-center justify-center transition-all cursor-pointer ${
            themeMode === 'system'
              ? 'bg-white dark:bg-[#2A2B32] text-[#2D55F5] dark:text-white shadow-sm'
              : 'text-[#5F6678] dark:text-slate-400 hover:text-[#0A0F1F] dark:hover:text-white font-medium'
          }`}
        >
          System
        </button>
      </div>
    </div>
  );
}
