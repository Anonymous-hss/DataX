import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * ConfirmDialog
 * Enterprise confirmation dialog for destructive actions (pipeline deletion, DLQ purging).
 */
export default function ConfirmDialog({
  isOpen,
  title = "Confirm Destructive Action",
  message = "Are you sure you want to proceed? This operation cannot be undone.",
  confirmLabel = "Delete",
  confirmTextMatch = "", // If provided, user must type this exact word to confirm
  isDestructive = true,
  onConfirm,
  onCancel
}) {
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTypedText("");
      const handleKeyDown = (e) => {
        if (e.key === "Escape") onCancel();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isConfirmDisabled = confirmTextMatch
    ? typedText.trim().toUpperCase() !== confirmTextMatch.toUpperCase()
    : false;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl relative text-left">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4 mb-4">
          <div className={`p-2.5 rounded-lg flex-shrink-0 ${isDestructive ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 id="confirm-dialog-title" className="text-base font-semibold text-slate-100 mb-1">
              {title}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {confirmTextMatch && (
          <div className="my-4 p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
            <label className="block text-[11px] text-slate-400 mb-1.5 font-medium">
              To confirm, type <span className="font-mono text-red-400 font-bold">{confirmTextMatch}</span> below:
            </label>
            <input
              type="text"
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              placeholder={`Type "${confirmTextMatch}" to confirm`}
              className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded text-slate-200 font-mono focus:outline-none focus:border-red-500"
              autoFocus
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 mt-6 pt-3 border-t border-slate-800/80">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isConfirmDisabled}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-sm ${
              isConfirmDisabled
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                : isDestructive
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/20'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
