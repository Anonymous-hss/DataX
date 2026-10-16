import React from 'react';

// Dynamic live bars data (15 intervals)
const defaultBarData = [
  { clean: 60, fixed: 8, quarantined: 4, height: 45 },
  { clean: 75, fixed: 12, quarantined: 3, height: 60 },
  { clean: 40, fixed: 6, quarantined: 2, height: 35 },
  { clean: 95, fixed: 20, quarantined: 6, height: 78 },
  { clean: 50, fixed: 10, quarantined: 4, height: 42 },
  { clean: 65, fixed: 15, quarantined: 5, height: 55 },
  { clean: 110, fixed: 24, quarantined: 8, height: 88 },
  { clean: 80, fixed: 14, quarantined: 4, height: 65 },
  { clean: 70, fixed: 18, quarantined: 7, height: 62 },
  { clean: 120, fixed: 28, quarantined: 9, height: 95 },
  { clean: 85, fixed: 16, quarantined: 6, height: 70 },
  { clean: 135, fixed: 32, quarantined: 10, height: 108 },
  { clean: 90, fixed: 12, quarantined: 5, height: 72 },
  { clean: 140, fixed: 30, quarantined: 8, height: 112 },
  { clean: 95, fixed: 15, quarantined: 4, height: 76 },
];

export default function LiveChart({ timeRange, setTimeRange, barData = defaultBarData }) {
  return (
    <div className="lg:col-span-8 space-y-4">
      {/* Chart Title, Legend & Interval Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <h3 className="text-sm font-bold text-slate-900 font-display">Rows per minute</h3>
          
          {/* Legend */}
          <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#bfdbfe]" /> Clean
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2563eb]" /> Auto-fixed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#92400e]" /> Quarantined
            </span>
          </div>
        </div>

        {/* Interval Filter Pills */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 text-xs shrink-0">
          {['15 min', '1h', '24h'].map((pill) => (
            <button
              key={pill}
              onClick={() => setTimeRange(pill)}
              className={`px-2.5 sm:px-3 py-1 rounded-md transition-all cursor-pointer ${
                timeRange === pill 
                  ? 'bg-white font-semibold text-slate-900 shadow-2xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {pill}
            </button>
          ))}
        </div>
      </div>

      {/* Stacked Bars Visual Chart */}
      <div className="pt-6 sm:pt-8 pb-6 relative h-[240px] sm:h-[280px]">
        {/* Background horizontal grid lines */}
        <div className="absolute inset-x-0 top-6 bottom-10 flex flex-col justify-between pointer-events-none opacity-40">
          <div className="border-b border-slate-200 border-dashed w-full" />
          <div className="border-b border-slate-200 border-dashed w-full" />
          <div className="border-b border-slate-200 border-dashed w-full" />
          <div className="border-b border-slate-200 w-full" />
        </div>

        {/* Bars Row */}
        {barData.length === 0 ? (
          <div className="relative z-10 flex flex-col items-center justify-center h-[calc(100%-28px)] text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <p className="font-semibold text-slate-600">Awaiting row telemetry</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Run a dry run or execute rules to stream real-time validation bars.</p>
          </div>
        ) : (
          <div className="relative z-10 flex items-stretch gap-[2%] px-1 sm:px-2 h-[calc(100%-28px)]">
            {barData.map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group">
                <div 
                  className="w-full rounded-t-sm flex flex-col overflow-hidden transition-all group-hover:brightness-95 cursor-pointer shadow-2xs"
                  style={{ height: `${Math.min(100, Math.max(15, bar.height * 0.78))}%`, maxWidth: '32px' }}
                >
                  {/* Quarantined (Brown/Amber - Top segment) */}
                  <div 
                    className="w-full bg-[#92400e]" 
                    style={{ height: `${(bar.quarantined / Math.max(1, bar.clean + bar.fixed + bar.quarantined)) * 100}%`, minHeight: bar.quarantined > 0 ? '3px' : '0px' }} 
                    title={`Quarantined: ${bar.quarantined}`}
                  />
                  {/* Auto-fixed (Blue - Middle segment) */}
                  <div 
                    className="w-full bg-[#2563eb]" 
                    style={{ height: `${(bar.fixed / Math.max(1, bar.clean + bar.fixed + bar.quarantined)) * 100}%`, minHeight: bar.fixed > 0 ? '3px' : '0px' }} 
                    title={`Auto-fixed: ${bar.fixed}`}
                  />
                  {/* Clean (Light Blue - Base segment) */}
                  <div 
                    className="w-full bg-[#93c5fd] flex-1" 
                    style={{ minHeight: bar.clean > 0 ? '6px' : '0px' }}
                    title={`Clean: ${bar.clean}`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dynamic Time Label */}
        {(() => {
          const now = new Date();
          const formatT = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
          const tCurrent = formatT(now);
          const tMid = formatT(new Date(now.getTime() - 8 * 60000));
          const tStart = formatT(new Date(now.getTime() - 15 * 60000));
          return (
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] sm:text-[11px] text-slate-400 font-mono pt-2 px-1 border-t border-slate-200">
              <span>{tStart}</span>
              <span>{tMid}</span>
              <span className="hidden sm:inline">{tCurrent} (current)</span>
              <span className="sm:hidden">{tCurrent}</span>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
