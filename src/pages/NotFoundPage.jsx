import DataXAppShell from "../components/common/DataXAppShell";
import React from 'react';
import { Compass, ArrowLeft, Home, HelpCircle, Layers } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

export default function NotFoundPage({ attemptedScreen, onSwitchToMarketing }) {
  const { navigateTo } = useNavigation();

  return (
    <DataXAppShell onSwitchToMarketing={onSwitchToMarketing}>
<div className="min-h-screen bg-transparent text-slate-800 dark:text-slate-200 flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-blue-600 flex items-center justify-center font-bold text-white text-sm shadow-md">
            DX
          </div>
          <span className="font-semibold text-sm tracking-wide text-white">DataX Enterprise</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">404</span>
        </div>
        <button
          onClick={onSwitchToMarketing}
          className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Product Overview</span>
        </button>
      </header>

      {/* Main 404 Hero */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="relative inline-flex items-center justify-center">
            <div className="w-24 h-24 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
              <Compass className="w-12 h-12 stroke-[1.5] animate-pulse" />
            </div>
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              404
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Surface Not Found</h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              The route <code className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-xs border border-slate-700/60">#{attemptedScreen || 'unknown'}</code> does not match any operational studio module or execution pipeline.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-left space-y-2">
            <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Suggested Enterprise Routes
            </div>
            <ul className="text-xs text-slate-400 space-y-1.5 font-mono">
              <li>• <button onClick={() => navigateTo('threads')} className="text-indigo-400 hover:underline">#/threads</button> — Active Pipeline Workflows</li>
              <li>• <button onClick={() => navigateTo('canvas')} className="text-indigo-400 hover:underline">#/canvas</button> — Interactive CleanFlow Canvas</li>
              <li>• <button onClick={() => navigateTo('quarantine')} className="text-indigo-400 hover:underline">#/quarantine</button> — Audit Quarantine Workbench</li>
              <li>• <button onClick={() => navigateTo('history')} className="text-indigo-400 hover:underline">#/runs</button> — Execution Run History</li>
              <li>• <button onClick={() => navigateTo('settings')} className="text-indigo-400 hover:underline">#/settings</button> — Team & Enterprise Settings</li>
            </ul>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigateTo('threads')}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Workflows
            </button>
            <button
              onClick={() => navigateTo('help')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Help & Support
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 px-6 py-4 text-center text-xs text-slate-500">
        DataX Clean Core Pipeline Studio • Autonomous Enterprise Data Operations
      </footer>
    </div>
</DataXAppShell>
  );
}
