import React from 'react';
import { Layers, Database, ShieldCheck, Plus, ExternalLink } from 'lucide-react';

/**
 * EmptyState
 * Standardized empty state component guaranteeing no blank screens across DataX.
 */
export default function EmptyState({
  icon: Icon = Layers,
  title = "No items found",
  description = "Get started by creating your first item or importing from catalog.",
  actionLabel = "Create New",
  onAction = null,
  secondaryLabel = null,
  onSecondaryAction = null,
  variant = "default" // 'default' | 'success' | 'database'
}) {
  const getIconTheme = () => {
    switch (variant) {
      case 'success':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'database':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/20 my-6 max-w-xl mx-auto animate-in fade-in duration-300">
      <div className={`p-4 rounded-2xl border ${getIconTheme()} mb-4 relative`}>
        <Icon className="w-8 h-8" />
        <div className="absolute inset-0 rounded-2xl bg-current opacity-10 blur-lg pointer-events-none" />
      </div>

      <h3 className="text-base font-semibold text-slate-100 mb-1.5">
        {title}
      </h3>
      <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      <div className="flex items-center gap-3">
        {onAction && actionLabel && (
          <button
            onClick={onAction}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {actionLabel}
          </button>
        )}

        {onSecondaryAction && secondaryLabel && (
          <button
            onClick={onSecondaryAction}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            {secondaryLabel}
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
