import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Layers, 
  Network, 
  Clock, 
  ShieldCheck, 
  TrendingUp, 
  Settings, 
  Search, 
  HelpCircle, 
  ArrowRight, 
  CheckCircle2, 
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
  Zap,
  Play
} from 'lucide-react';
import { Link, useNavigation } from '../../context/NavigationContext';
import { useRuleEngine } from '../../context/RuleEngineContext';
import Logo from '../icons/Logo';
import NotificationCenter from './NotificationCenter';
import DataXUserMenu from './DataXUserMenu';
import AmbientBackgroundFlow from './AmbientBackgroundFlow';
import GlobalSearchModal from './GlobalSearchModal';
import OnboardingWizard from './OnboardingWizard';

export default function DataXAppShell({ 
  children, 
  showContextBar = false,
  compact = false,
  onSwitchToMarketing 
}) {
  const { currentScreen, navigateTo } = useNavigation();
  const ruleEngine = useRuleEngine?.() || {};
  const { activeThread, threads = [], selectThread } = ruleEngine;

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [threadPickerOpen, setThreadPickerOpen] = useState(false);

  // Global ⌘K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentThreadName = activeThread?.name || 'SAP BW InfoCube 0PUR_C01 → S/4HANA';

  // Navigation Items Grouped by Operational Lifecycle
  const NAV_ITEMS = [
    { id: 'workflows', label: 'Workflows', screen: 'workflows', icon: Activity },
    { id: 'templates', label: 'Templates', screen: 'templates', icon: Layers },
    { id: 'connections', label: 'Connections', screen: 'connections', icon: Network },
    { id: 'quarantine', label: 'Quarantine', screen: 'quarantine', icon: SlidersHorizontal, badge: '14' },
    { id: 'shadow', label: 'Shadow Parity', screen: 'shadow', icon: Zap },
    { id: 'history', label: 'Runs', screen: 'history', icon: Clock },
    { id: 'audit', label: 'Audit Trail', screen: 'audit', icon: ShieldCheck },
    { id: 'roi', label: 'Executive ROI', screen: 'roi', icon: TrendingUp },
    { id: 'settings', label: 'Settings', screen: 'settings', icon: Settings },
  ];

  const isNavActive = (screenKey) => {
    if (screenKey === 'workflows' && (currentScreen === 'workflows' || currentScreen === 'threads' || currentScreen === 'home' || currentScreen === '')) return true;
    if (screenKey === 'templates' && (currentScreen === 'templates' || currentScreen === 'domain-packs')) return true;
    if (screenKey === 'history' && (currentScreen === 'history' || currentScreen === 'runs')) return true;
    return currentScreen === screenKey;
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#141416] text-slate-800 dark:text-slate-200 font-sans antialiased flex flex-col relative transition-colors duration-200">
      {/* 1. Ambient Background Drifting Mesh Flows */}
      <AmbientBackgroundFlow />

      {/* 2. Top Universal Studio Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-white/85 dark:bg-[#18181C]/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/[0.08] transition-colors">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          
          {/* Brand Logo & Studio Navigation */}
          <div className="flex items-center gap-6 min-w-0">
            {/* Logo */}
            <button
              type="button"
              onClick={() => navigateTo('workflows')}
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition-opacity shrink-0 group text-left"
              title="Return to Workflows"
            >
              <Logo size={28} className="transition-transform group-hover:scale-105" />
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight font-display">
                  DataX
                </span>
                <span className="hidden xl:inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-white/[0.06]">
                  Studio
                </span>
              </div>
            </button>

            {/* Navigation Pills (Lifecycle Lifecycle Grouped) */}
            <nav className="hidden lg:flex items-center gap-1 min-w-0 overflow-x-auto py-1 scrollbar-none">
              {NAV_ITEMS.map((item) => {
                const active = isNavActive(item.screen);
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateTo(item.screen)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
                      active
                        ? 'bg-[#1473E6]/10 text-[#1473E6] dark:bg-[#1473E6]/20 dark:text-[#60A5FA] font-bold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#1473E6] dark:text-[#60A5FA]' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[#B86E24]/15 text-[#B86E24] dark:bg-[#D48B3F]/20 dark:text-[#FBBF24]">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Controls: Command Search, Help, Notifications, User Menu */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Global Search Bar (⌘K) */}
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="relative hidden sm:flex items-center w-44 md:w-52 h-8 px-2.5 rounded-lg bg-slate-100/80 dark:bg-white/[0.05] border border-slate-200/70 dark:border-white/[0.08] text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-white/[0.15] transition-all cursor-pointer text-left"
              title="Search workflows, tables, and settings (⌘K)"
            >
              <Search className="w-3.5 h-3.5 mr-2 shrink-0" />
              <span className="truncate">Search (⌘K)...</span>
              <kbd className="ml-auto text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-white dark:bg-white/[0.08] px-1 py-0.5 rounded border border-slate-200 dark:border-white/[0.06]">
                ⌘K
              </kbd>
            </button>

            {/* Help / Guide Trigger */}
            <button
              type="button"
              onClick={() => setOnboardingOpen(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="First-Run Studio Guide"
              aria-label="Open Onboarding Guide"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* In-App Notification Center */}
            <NotificationCenter />

            {/* Dynamic Governance Profile & Theme Hub */}
            <div className="pl-1 border-l border-slate-200/80 dark:border-white/[0.08]">
              <DataXUserMenu onSwitchToMarketing={onSwitchToMarketing} />
            </div>
          </div>
        </div>
      </header>

      {/* 3. Persistent Active Pipeline Context Ribbon (Studio Sub-Surface) */}
      {showContextBar && (
        <div className="w-full bg-slate-50/90 dark:bg-[#1A1A1E]/90 border-b border-slate-200/60 dark:border-white/[0.06] backdrop-blur-md px-4 sm:px-6 py-2 transition-colors z-30">
          <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Active Workflow Selector */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0">
                Active Pipeline:
              </span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setThreadPickerOpen(!threadPickerOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-[#222226] border border-slate-200 dark:border-white/[0.08] font-semibold text-slate-800 dark:text-slate-200 hover:border-[#1473E6] transition-colors cursor-pointer max-w-[280px] sm:max-w-md truncate"
                >
                  <span className="truncate">{currentThreadName}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
                </button>

                {/* Workflow Dropdown Picker */}
                {threadPickerOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-72 bg-white dark:bg-[#222226] border border-slate-200 dark:border-white/[0.1] rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                    {(threads.length > 0 ? threads : [
                      { id: 'sap_bw_s4hana', name: 'SAP BW InfoCube 0PUR_C01 → S/4HANA' },
                      { id: 'salesforce_snowflake', name: 'Salesforce Opportunity → Snowflake Lakehouse' },
                      { id: 'oracle_neon', name: 'Oracle Financials General Ledger → Neon Postgres' }
                    ]).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          if (selectThread) selectThread(t.id);
                          setThreadPickerOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs truncate transition-colors cursor-pointer ${
                          activeThread?.id === t.id
                            ? 'bg-[#1473E6]/10 text-[#1473E6] dark:text-[#60A5FA] font-bold'
                            : 'hover:bg-slate-50 dark:hover:bg-white/[0.05] text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pipeline Health & Canvas Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                <span className="w-2 h-2 rounded-full bg-[#3B7E74]" />
                Clean Core Armed • 99.01% Parity
              </span>

              {currentScreen !== 'canvas' && (
                <button
                  type="button"
                  onClick={() => navigateTo('canvas')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1473E6] hover:bg-[#1261C4] text-white font-semibold text-[11px] shadow-2xs transition-colors cursor-pointer"
                >
                  <span>Open in Canvas</span>
                  <ArrowRight className="w-3 h-3 ml-0.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Page Main Viewport Container with Smooth Studio Entry */}
      <main className="flex-1 w-full relative z-10 studio-page-enter">
        {children}
      </main>

      {/* Global Command Palette & Onboarding Modal Instances */}
      <GlobalSearchModal 
        isOpen={searchModalOpen} 
        onClose={() => setSearchModalOpen(false)} 
      />
      <OnboardingWizard 
        isOpen={onboardingOpen} 
        onClose={() => setOnboardingOpen(false)} 
      />
    </div>
  );
}

