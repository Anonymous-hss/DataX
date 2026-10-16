import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Pause, Zap, X } from 'lucide-react';

export default function LiveNotificationToast({ toast, onClose, onAction }) {
  if (!toast?.visible) return null;

  const isPaused = toast.type === 'paused';
  const isSaved = toast.type === 'saved';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="fixed bottom-5 right-5 z-50 max-w-md w-auto bg-[#0B0F19] text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-800 flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
            isPaused 
              ? 'bg-amber-500 text-slate-900' 
              : isSaved 
              ? 'bg-blue-500 text-white' 
              : 'bg-emerald-500 text-white'
          }`}>
            {isPaused ? (
              <Pause className="w-2.5 h-2.5 fill-current" />
            ) : isSaved ? (
              <Check className="w-3 h-3 stroke-[3]" />
            ) : (
              <Check className="w-3 h-3 stroke-[3]" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white whitespace-nowrap">
              {toast.title}
            </div>
            <div className="text-[11px] text-slate-400 truncate max-w-[240px] sm:max-w-[280px]">
              {toast.message}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {toast.actionText && (
            <button
              onClick={onAction}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                isPaused 
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              {toast.actionText}
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Close notification"
            className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
