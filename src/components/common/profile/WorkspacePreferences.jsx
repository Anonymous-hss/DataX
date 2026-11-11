import React from 'react';

/**
 * WorkspacePreferences - Audio Chimes & Continuous Auto-Save Toggles (00.6)
 */
export default function WorkspacePreferences({
  soundOn,
  onToggleSound,
  autoSave,
  onToggleAutoSave
}) {
  return (
    <div className="p-4 space-y-3">
      <span className="block text-[11px] font-bold tracking-wider text-[#5F6678] dark:text-slate-400 uppercase">
        Workspace Preferences
      </span>

      {/* Audio Chimes Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-[#0A0F1F] dark:text-white leading-tight">
            Studio audio chimes
          </p>
          <p className="text-[11px] text-[#5F6678] dark:text-slate-400 mt-0.5">
            Execution and alert tones
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleSound}
          className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
            soundOn ? 'bg-[#2D55F5]' : 'bg-[#CDD2DE] dark:bg-slate-700'
          }`}
          aria-label="Toggle audio chimes"
        >
          <span 
            className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-150 ${
              soundOn ? 'translate-x-4.5' : 'translate-x-0.5'
            }`} 
          />
        </button>
      </div>

      {/* Continuous Auto-save Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-[#0A0F1F] dark:text-white leading-tight">
            Continuous auto-save
          </p>
          <p className="text-[11px] text-[#5F6678] dark:text-slate-400 mt-0.5">
            Auto-persist canvas nodes and rules
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleAutoSave}
          className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
            autoSave ? 'bg-[#2D55F5]' : 'bg-[#CDD2DE] dark:bg-slate-700'
          }`}
          aria-label="Toggle auto-save"
        >
          <span 
            className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform duration-150 ${
              autoSave ? 'translate-x-4.5' : 'translate-x-0.5'
            }`} 
          />
        </button>
      </div>
    </div>
  );
}

