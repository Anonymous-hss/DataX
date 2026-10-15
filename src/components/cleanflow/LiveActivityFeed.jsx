import React from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Save, 
  BarChart3, 
  Zap, 
  Archive, 
  CheckCircle2 
} from 'lucide-react';

function ActivityIcon({ type }) {
  switch (type) {
    case 'resume':
    case 'live':
    case 'play':
      return (
        <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
          <Play className="w-3.5 h-3.5 fill-blue-600" />
        </div>
      );
    case 'pause':
      return (
        <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
          <Pause className="w-3.5 h-3.5 fill-amber-600" />
        </div>
      );
    case 'save':
    case 'config':
      return (
        <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
          <Save className="w-3.5 h-3.5" />
        </div>
      );
    case 'chart':
    case 'checked':
    case 'rows':
      return (
        <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
          <BarChart3 className="w-3.5 h-3.5" />
        </div>
      );
    case 'zap':
    case 'fixed':
    case 'recheck':
      return (
        <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
          <Zap className="w-3.5 h-3.5 fill-amber-500" />
        </div>
      );
    case 'quarantine':
    case 'held':
      return (
        <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
          <Archive className="w-3.5 h-3.5" />
        </div>
      );
    default:
      return (
        <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
        </div>
      );
  }
}

export default function LiveActivityFeed({ activities = [], onViewAll }) {
  return (
    <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-slate-200 pt-4 lg:pt-0 lg:pl-6 space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 font-display">Activity</h3>
        <button 
          onClick={onViewAll}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
        >
          View all
        </button>
      </div>

      <div className="space-y-1 sm:space-y-2">
        {activities.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start justify-between gap-2.5 sm:gap-3 text-xs p-1.5 sm:p-2 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <ActivityIcon type={item.type} />
              <div className="min-w-0 pt-0.5">
                <div className="font-semibold text-slate-900 truncate">{item.title}</div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">{item.subtitle}</div>
              </div>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono shrink-0 pt-1">{item.time}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
