import React from 'react';
import { Database, FileCode2, ArrowRight } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';

export default function PipelineFlowNodes({ currentStep = '04', onNavigate, isPaused = false }) {
  const { navigateTo } = useNavigation();

  const handleStepClick = (step) => {
    if (onNavigate) {
      onNavigate(step);
    } else {
      if (step === '03') navigateTo('connect-source');
      else if (step === '04') navigateTo('generate-rules');
      else if (step === '05') navigateTo('test-in-sandbox');
      else if (step === '06') navigateTo('connect-target');
      else if (step === '08') navigateTo('live-auto-fix');
    }
  };

  const isLive = currentStep === '08';
  const isStep03 = currentStep === '03';
  const isStep04 = currentStep === '04';
  const isStep05 = currentStep === '05';
  const isStep06 = currentStep === '06';

  return (
    <section className="px-4 sm:px-6 pt-5 pb-2">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2.5 sm:gap-3">
          
          {/* Node 1: Source */}
          <div 
            onClick={() => handleStepClick('03')}
            className={`bg-white rounded-xl p-3.5 shadow-2xs flex items-center justify-between cursor-pointer transition-all ${
              isStep03
                ? 'border-2 border-blue-500 ring-2 ring-blue-500/10'
                : 'border border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center font-mono shrink-0">
                1
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Source</div>
                <div className="text-xs font-bold text-slate-900 truncate">production_db</div>
                <div className="text-[11px] text-slate-500 font-mono truncate">
                  {isLive ? '1,312 rows read' : 'raw_source_users'}
                </div>
              </div>
            </div>
            {isLive ? (
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${isPaused ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'} text-[10px] font-semibold border shrink-0 ml-1`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                {isPaused ? 'Paused' : 'Live'}
              </span>
            ) : isStep03 ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-200 shrink-0 ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                Setting up
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200 shrink-0 ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Ready
              </span>
            )}
          </div>

          {/* Connector Arrow 1 */}
          <div className="hidden md:flex items-center justify-center px-1 text-slate-300">
            <ArrowRight className={`w-4 h-4 ${isLive ? (isPaused ? 'text-amber-500 stroke-[2]' : 'text-blue-600 stroke-[2.5]') : 'text-slate-300'}`} />
          </div>

          {/* Node 2: AI rules */}
          <div 
            onClick={() => handleStepClick('04')}
            className={`bg-white rounded-xl p-3.5 shadow-2xs flex items-center justify-between cursor-pointer transition-all ${
              isStep04
                ? 'border-2 border-blue-500 ring-2 ring-blue-500/10'
                : 'border border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center font-mono shrink-0">
                2
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <FileCode2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">AI rules</div>
                <div className="text-xs font-bold text-slate-900 truncate">AI rule generator</div>
                <div className="text-[11px] text-slate-500 truncate">
                  {isLive 
                    ? '1,148 clean · 128 fixed · 36 held' 
                    : isStep04 
                    ? 'Describe it, AI writes it' 
                    : isStep05 
                    ? 'Testing 5 rules' 
                    : '5 rules · 90% pass'}
                </div>
              </div>
            </div>
            
            {isLive ? (
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${isPaused ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'} text-[10px] font-semibold border shrink-0 ml-1`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                {isPaused ? 'Paused' : 'Live'}
              </span>
            ) : isStep04 ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-200 shrink-0 ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                Setting up
              </span>
            ) : isStep03 ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold border border-slate-200 shrink-0 ml-1">
                To do
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200 shrink-0 ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Ready
              </span>
            )}
          </div>

          {/* Connector Arrow 2 */}
          <div className="hidden md:flex items-center justify-center px-1 text-slate-300">
            <ArrowRight className={`w-4 h-4 ${isLive ? (isPaused ? 'text-amber-500 stroke-[2]' : 'text-blue-600 stroke-[2.5]') : 'text-slate-300'}`} />
          </div>

          {/* Node 3: Target */}
          <div 
            onClick={() => handleStepClick('06')}
            className={`rounded-xl p-3.5 shadow-2xs flex items-center justify-between cursor-pointer transition-all ${
              isStep06
                ? 'bg-white border-2 border-blue-500 ring-2 ring-blue-500/10'
                : (isStep03 || isStep04 || isStep05)
                ? 'border border-dashed border-slate-300 bg-white/60 hover:bg-white hover:border-slate-400'
                : 'bg-white border border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center font-mono shrink-0 ${
                (isStep03 || isStep04 || isStep05) ? 'bg-slate-300 text-slate-700' : 'bg-slate-900 text-white'
              }`}>
                3
              </div>
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Target</div>
                <div className="text-xs font-bold text-slate-900 truncate">
                  {(isStep03 || isStep04 || isStep05) ? 'Choose a target' : 'reconciled_db'}
                </div>
                <div className="text-[11px] text-slate-500 font-mono truncate">
                  {(isStep03 || isStep04 || isStep05) 
                    ? 'Where clean rows go' 
                    : isStep06 
                    ? 'PostgreSQL' 
                    : isLive 
                    ? '1,276 rows written'
                    : 'raw_source_users_clean'}
                </div>
              </div>
            </div>

            {isLive ? (
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${isPaused ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'} text-[10px] font-semibold border shrink-0 ml-1`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                {isPaused ? 'Paused' : 'Live'}
              </span>
            ) : (isStep03 || isStep04 || isStep05) ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold border border-slate-200 shrink-0 ml-1">
                To do
              </span>
            ) : isStep06 ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-200 shrink-0 ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                Setting up
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200 shrink-0 ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Ready
              </span>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}

