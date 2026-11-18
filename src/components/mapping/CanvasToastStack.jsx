import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

/**
 * CanvasToastStack - Standardized stacked success / error / warning / info notifications
 * rendered in the top-right corner of the SaaS Canvas Studio.
 */
export default function CanvasToastStack({ toasts = [], onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      className="fixed top-20 right-5 z-[70] flex flex-col gap-2 w-[360px] max-w-[calc(100vw-2rem)] pointer-events-none font-sans"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => {
        const type = toast.type || 'info';
        const styles =
          type === 'success'
            ? {
                wrap: 'bg-white dark:bg-[#18181C] border-emerald-300 dark:border-emerald-700/60',
                iconWrap: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
                title: 'text-emerald-900 dark:text-emerald-200',
                Icon: CheckCircle2,
              }
            : type === 'error'
              ? {
                  wrap: 'bg-white dark:bg-[#18181C] border-rose-300 dark:border-rose-700/60',
                  iconWrap: 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400',
                  title: 'text-rose-900 dark:text-rose-200',
                  Icon: AlertCircle,
                }
              : type === 'warning'
                ? {
                    wrap: 'bg-white dark:bg-[#18181C] border-amber-300 dark:border-amber-700/60',
                    iconWrap: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400',
                    title: 'text-amber-900 dark:text-amber-200',
                    Icon: AlertTriangle,
                  }
                : {
                    wrap: 'bg-white dark:bg-[#18181C] border-blue-200 dark:border-blue-800/60',
                    iconWrap: 'bg-blue-50 dark:bg-blue-950/50 text-[#2D55F5] dark:text-blue-400',
                    title: 'text-slate-900 dark:text-white',
                    Icon: Info,
                  };

        const Icon = styles.Icon;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-2xl border shadow-xl p-3.5 flex items-start gap-3 transition-all ${styles.wrap}`}
          >
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${styles.iconWrap}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              {toast.title && (
                <div className={`text-xs font-bold leading-tight ${styles.title}`}>{toast.title}</div>
              )}
              {toast.message && (
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug break-words">
                  {toast.message}
                </p>
              )}
              {toast.actionLabel && toast.onAction && (
                <button
                  type="button"
                  onClick={() => {
                    toast.onAction();
                    onDismiss(toast.id);
                  }}
                  className="mt-1.5 text-[11px] font-bold text-[#2D55F5] hover:underline cursor-pointer"
                >
                  {toast.actionLabel} →
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
