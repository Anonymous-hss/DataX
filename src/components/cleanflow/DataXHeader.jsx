import React from 'react';
import { 
  Activity, 
  Layers, 
  Network, 
  Zap, 
  Search, 
  HelpCircle, 
  Bell, 
  ArrowLeft, 
  FileCheck, 
  FlaskConical, 
  Play,
  Save 
} from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { useRuleEngine } from '../../context/RuleEngineContext';
import DataXUserMenu from '../common/DataXUserMenu';

export default function DataXHeader({ 
  currentPage, 
  onNavigate, 
  onBack, 
  onDryRun, 
  onRunLive, 
  onSwitchToMarketing,
  hideSubheader = false
}) {
  const { navigateTo } = useNavigation();
  const { activeThread, sourceConfig, targetConfig } = useRuleEngine();
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  const handleSaveClick = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <>
      {/* Top Global Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto h-14 flex items-center justify-between gap-4">
          
          {/* Logo & Main Nav Tabs */}
          <div className="flex items-center gap-6">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity" 
              onClick={() => navigateTo('threads')}
              title="Return to Threads dashboard"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-xs shadow-blue-500/30">
                <span className="text-white font-black text-sm tracking-tight font-display">X</span>
              </div>
              <span className="font-bold text-slate-900 tracking-tight text-base font-display">DataX</span>
            </div>

            {/* Navigation Pills */}
            <nav className="hidden md:flex items-center gap-1">
              <button 
                onClick={() => navigateTo('threads')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 transition-colors cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5 text-blue-600" />
                Threads
              </button>
              <button 
                onClick={() => navigateTo('new-thread')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                Domain packs
              </button>
              <button 
                onClick={() => navigateTo('connect-source')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Network className="w-3.5 h-3.5 text-slate-400" />
                Connections
              </button>
              <button 
                onClick={() => navigateTo('history')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-slate-400" />
                Runs
              </button>
            </nav>
          </div>

          {/* Search, Notifications & User */}
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block w-48 md:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search threads, tables..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <HelpCircle className="w-4 h-4" />
            </button>
            <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 absolute top-1.5 right-1.5" />
            </button>

            {/* Dynamic Clerk Profile Avatar & Profile Details */}
            <div className="flex items-center pl-1 border-l border-slate-200">
              <DataXUserMenu />
            </div>

            {onSwitchToMarketing && (
              <button 
                onClick={onSwitchToMarketing}
                className="hidden xl:block text-xs font-mono text-slate-400 hover:text-slate-600 underline pl-1"
              >
                Website →
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Subheader: Flow Title & Top Actions */}
      {!hideSubheader && (
        <section className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                title="Go back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-slate-900 tracking-tight">
                    {activeThread?.name || 'User records clean-up'}
                  </h1>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                    activeThread?.status === 'healthy' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : activeThread?.status === 'warning'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {activeThread?.statusLabel || (activeThread?.status === 'healthy' ? 'Live' : 'Draft')}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {sourceConfig?.table || 'source_data'} → {targetConfig?.table || 'target_data'} · active cleanflow
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button 
                onClick={handleSaveClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
              >
                <Save className={`w-3.5 h-3.5 ${saveSuccess ? 'text-emerald-600' : 'text-slate-500'}`} />
                {saveSuccess ? 'Saved!' : 'Save'}
              </button>

              <button
                onClick={onDryRun}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer shadow-2xs ${
                  currentPage === '06_07' || currentPage === '07'
                    ? 'border-blue-300 bg-blue-50 text-blue-700 font-semibold'
                    : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5 text-slate-500" />
                Dry run
              </button>

              <button
                onClick={onRunLive}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
              >
                <Play className="w-3.5 h-3.5 text-slate-500 fill-slate-500" />
                Run live
              </button>
            </div>

          </div>
        </section>
      )}
    </>
  );
}
