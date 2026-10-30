import React, { useState, useEffect, useRef } from 'react';
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
  SlidersHorizontal,
  ChevronDown,
  Zap,
  Menu,
  X,
  Check,
  Shield,
  Cpu,
  Sparkles
} from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { useRuleEngine } from '../../context/RuleEngineContext';
import Logo from '../icons/Logo';
import NotificationCenter from './NotificationCenter';
import DataXUserMenu from './DataXUserMenu';
import AmbientBackgroundFlow from './AmbientBackgroundFlow';
import GlobalSearchModal from './GlobalSearchModal';
import OnboardingWizard from './OnboardingWizard';
import UseCaseAdvisorModal from './UseCaseAdvisorModal';

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
  const [advisorModalOpen, setAdvisorModalOpen] = useState(false);
  const [threadPickerOpen, setThreadPickerOpen] = useState(false);
  const [opsDropdownOpen, setOpsDropdownOpen] = useState(false);
  const [governDropdownOpen, setGovernDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const opsRef = useRef(null);
  const governRef = useRef(null);
  const threadPickerRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (opsRef.current && !opsRef.current.contains(e.target)) {
        setOpsDropdownOpen(false);
      }
      if (governRef.current && !governRef.current.contains(e.target)) {
        setGovernDropdownOpen(false);
      }
      if (threadPickerRef.current && !threadPickerRef.current.contains(e.target)) {
        setThreadPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

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

  const currentThreadName = activeThread?.name || 'Active Workspace Pipeline';

  // Primary SaaS Pillars (Directly visible on desktop, zero static badges, zero overlap)
  const PRIMARY_NAV_ITEMS = [
    { id: 'workflows', label: 'Workflows', screen: 'workflows', icon: Activity },
    { id: 'ai-firewall', label: 'AI Firewall', screen: 'ai-firewall', icon: Shield },
    { id: 'ml-certify', label: 'ML Certify', screen: 'ml-certify', icon: Cpu },
    { id: 'connections', label: 'Connections', screen: 'connections', icon: Network },
  ];

  // Pipeline Operations Dropdown ("Operations ▾")
  const OPERATIONS_NAV_ITEMS = [
    { id: 'templates', label: 'Templates', screen: 'templates', icon: Layers, desc: 'Certified pipeline blueprints' },
    { id: 'quarantine', label: 'Quarantine DLQ', screen: 'quarantine', icon: SlidersHorizontal, desc: 'Dead-letter isolation & remediation' },
    { id: 'shadow', label: 'Shadow Parity', screen: 'shadow', icon: Zap, desc: 'Legacy vs DataX parity reconciliation' },
    { id: 'history', label: 'Run History', screen: 'history', icon: Clock, desc: 'Execution & commit telemetry' },
  ];

  // Enterprise Governance & Settings Dropdown ("Govern ▾")
  const GOVERN_NAV_ITEMS = [
    { id: 'audit', label: 'Audit Trail', screen: 'audit', icon: ShieldCheck, desc: 'Cryptographic SHA-256 ledger' },
    { id: 'roi', label: 'Executive ROI', screen: 'roi', icon: TrendingUp, desc: 'Financial risk & board dossier' },
    { id: 'settings', label: 'Settings', screen: 'settings', icon: Settings, desc: 'RBAC, cron schedules & vault' },
  ];

  const isNavActive = (screenKey) => {
    if (screenKey === 'workflows' && (currentScreen === 'workflows' || currentScreen === 'threads' || currentScreen === 'home' || currentScreen === '')) return true;
    if (screenKey === 'ai-firewall' && (currentScreen === 'ai-firewall' || currentScreen === 'firewall' || currentScreen === 'rag-firewall' || currentScreen === 'agent-guard')) return true;
    if (screenKey === 'ml-certify' && (currentScreen === 'ml-certify' || currentScreen === 'ml-certification' || currentScreen === 'ml-gate')) return true;
    if (screenKey === 'templates' && (currentScreen === 'templates' || currentScreen === 'domain-packs')) return true;
    if (screenKey === 'history' && (currentScreen === 'history' || currentScreen === 'runs')) return true;
    return currentScreen === screenKey;
  };

  const isOpsActive = OPERATIONS_NAV_ITEMS.some(item => isNavActive(item.screen));
  const activeOpsItem = OPERATIONS_NAV_ITEMS.find(item => isNavActive(item.screen));

  const isGovernActive = GOVERN_NAV_ITEMS.some(item => isNavActive(item.screen));
  const activeGovernItem = GOVERN_NAV_ITEMS.find(item => isNavActive(item.screen));

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#141416] text-slate-800 dark:text-slate-200 font-sans antialiased flex flex-col relative transition-colors duration-200 overflow-x-hidden">
      {/* 1. Ambient Background Drifting Mesh Flows */}
      <AmbientBackgroundFlow />

      {/* 2. Top Universal Studio Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-[#18181C]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/[0.08] transition-colors">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2 lg:gap-4">
          
          {/* Brand Logo & Studio Navigation */}
          <div className="flex items-center gap-3 xl:gap-5 shrink-0">
            {/* Logo */}
            <button
              type="button"
              onClick={() => navigateTo('workflows')}
              className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity shrink-0 group text-left"
              title="Return to Workflows"
            >
              <Logo size={28} className="transition-transform group-hover:scale-105" />
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight font-display">
                  DataX
                </span>
                <span className="hidden 2xl:inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-white/[0.06]">
                  Studio
                </span>
              </div>
            </button>

            {/* Desktop Navigation (Guaranteed zero overlap across all viewport widths) */}
            <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 shrink-0">
              {PRIMARY_NAV_ITEMS.map((item) => {
                const active = isNavActive(item.screen);
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateTo(item.screen)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                      active
                        ? 'bg-[#1473E6]/10 text-[#1473E6] dark:bg-[#1473E6]/20 dark:text-[#60A5FA] font-bold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-[#1473E6] dark:text-[#60A5FA]' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {/* Operations Dropdown Menu (Templates, Quarantine, Shadow Parity, Runs) */}
              <div className="relative shrink-0" ref={opsRef}>
                <button
                  type="button"
                  onClick={() => {
                    setOpsDropdownOpen(!opsDropdownOpen);
                    setGovernDropdownOpen(false);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    isOpsActive
                      ? 'bg-[#1473E6]/10 text-[#1473E6] dark:bg-[#1473E6]/20 dark:text-[#60A5FA] font-bold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <Layers className={`w-3.5 h-3.5 shrink-0 ${isOpsActive ? 'text-[#1473E6] dark:text-[#60A5FA]' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{activeOpsItem ? activeOpsItem.label : 'Operations'}</span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${opsDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {opsDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-64 bg-white dark:bg-[#1C1C22] border border-slate-200/90 dark:border-white/[0.1] rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/[0.06] mb-1">
                      Pipeline Operations
                    </div>
                    {OPERATIONS_NAV_ITEMS.map((item) => {
                      const active = isNavActive(item.screen);
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            navigateTo(item.screen);
                            setOpsDropdownOpen(false);
                          }}
                          className={`w-full flex items-start gap-2.5 px-3 py-2 text-xs transition-colors cursor-pointer text-left ${
                            active
                              ? 'bg-[#1473E6]/10 text-[#1473E6] dark:text-[#60A5FA] font-semibold'
                              : 'hover:bg-slate-50 dark:hover:bg-white/[0.05] text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${active ? 'text-[#1473E6]' : 'text-slate-400'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">{item.label}</span>
                              {active && <Check className="w-3 h-3 text-[#1473E6]" />}
                            </div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                              {item.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Governance & Assurance Dropdown Menu (Audit, ROI, Settings) */}
              <div className="relative shrink-0" ref={governRef}>
                <button
                  type="button"
                  onClick={() => {
                    setGovernDropdownOpen(!governDropdownOpen);
                    setOpsDropdownOpen(false);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    isGovernActive
                      ? 'bg-[#1473E6]/10 text-[#1473E6] dark:bg-[#1473E6]/20 dark:text-[#60A5FA] font-bold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${isGovernActive ? 'text-[#1473E6] dark:text-[#60A5FA]' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{activeGovernItem ? activeGovernItem.label : 'Govern'}</span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${governDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {governDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-60 bg-white dark:bg-[#1C1C22] border border-slate-200/90 dark:border-white/[0.1] rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/[0.06] mb-1">
                      Enterprise Governance
                    </div>
                    {GOVERN_NAV_ITEMS.map((item) => {
                      const active = isNavActive(item.screen);
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            navigateTo(item.screen);
                            setGovernDropdownOpen(false);
                          }}
                          className={`w-full flex items-start gap-2.5 px-3 py-2 text-xs transition-colors cursor-pointer text-left ${
                            active
                              ? 'bg-[#1473E6]/10 text-[#1473E6] dark:text-[#60A5FA] font-semibold'
                              : 'hover:bg-slate-50 dark:hover:bg-white/[0.05] text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${active ? 'text-[#1473E6]' : 'text-slate-400'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">{item.label}</span>
                              {active && <Check className="w-3 h-3 text-[#1473E6]" />}
                            </div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                              {item.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Right Controls: Advisor, Search, Help, Notifications, User Menu, Mobile Toggle */}
          <div className="flex items-center gap-1.5 xl:gap-2 shrink-0">
            {/* Interactive Blueprint & Use Case Advisor Trigger */}
            <button
              type="button"
              onClick={() => setAdvisorModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-[#2D55F5]/8 hover:bg-[#2D55F5]/15 text-[#2D55F5] dark:text-[#60A5FA] border border-[#2D55F5]/25 hover:border-[#2D55F5]/50 text-xs font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap"
              title="Interactive Use Case Blueprint Advisor"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#2D55F5] dark:text-[#60A5FA] shrink-0" />
              <span className="hidden 2xl:inline">Use Case Advisor</span>
              <span className="2xl:hidden">Advisor</span>
            </button>

            {/* Global Search Bar (Compact responsive width) */}
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="relative hidden sm:flex items-center gap-1.5 xl:w-36 h-8 px-2.5 rounded-lg bg-slate-100/80 dark:bg-white/[0.05] border border-slate-200/70 dark:border-white/[0.08] text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-white/[0.15] transition-all cursor-pointer text-left shrink-0"
              title="Search workflows, tables, and settings (⌘K)"
            >
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xl:inline truncate">Search...</span>
              <kbd className="xl:ml-auto text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-white dark:bg-white/[0.08] px-1 py-0.5 rounded border border-slate-200 dark:border-white/[0.06]">
                ⌘K
              </kbd>
            </button>

            {/* Help / Guide Trigger */}
            <button
              type="button"
              onClick={() => setOnboardingOpen(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
              title="First-Run Studio Guide"
              aria-label="Open Onboarding Guide"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* In-App Notification Center */}
            <NotificationCenter />

            {/* Dynamic Governance Profile & Theme Hub */}
            <div className="pl-1 border-l border-slate-200/80 dark:border-white/[0.08] shrink-0">
              <DataXUserMenu onSwitchToMarketing={onSwitchToMarketing} />
            </div>

            {/* Mobile / Tablet Menu Button (< 1024px) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Full Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-[#18181C]/95 backdrop-blur-xl px-4 py-3 space-y-1 animate-in slide-in-from-top-2 duration-150">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setAdvisorModalOpen(true);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 mb-2 rounded-lg text-xs font-bold bg-[#2D55F5]/10 text-[#2D55F5] cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Use Case Advisor</span>
            </button>

            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 px-2">Core Pillars</div>
            {PRIMARY_NAV_ITEMS.map((item) => {
              const active = isNavActive(item.screen);
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    navigateTo(item.screen);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                    active ? 'bg-[#1473E6]/10 text-[#1473E6]' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-3 mb-1 px-2">Pipeline Operations</div>
            {OPERATIONS_NAV_ITEMS.map((item) => {
              const active = isNavActive(item.screen);
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    navigateTo(item.screen);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                    active ? 'bg-[#1473E6]/10 text-[#1473E6]' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-3 mb-1 px-2">Governance & Settings</div>
            {GOVERN_NAV_ITEMS.map((item) => {
              const active = isNavActive(item.screen);
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    navigateTo(item.screen);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                    active ? 'bg-[#1473E6]/10 text-[#1473E6]' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* 3. Persistent Active Pipeline Context Ribbon (Studio Sub-Surface) */}
      {showContextBar && (
        <div className="w-full bg-slate-50/90 dark:bg-[#1A1A1E]/90 border-b border-slate-200/60 dark:border-white/[0.06] backdrop-blur-md px-4 sm:px-6 py-2 transition-colors z-30">
          <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Active Workflow Selector */}
            <div className="flex items-center gap-2 min-w-0" ref={threadPickerRef}>
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
                  <ChevronDown className={`w-3 h-3 text-slate-400 shrink-0 ml-1 transition-transform ${threadPickerOpen ? 'rotate-180' : ''}`} />
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
      <UseCaseAdvisorModal 
        isOpen={advisorModalOpen} 
        onClose={() => setAdvisorModalOpen(false)} 
      />
    </div>
  );
}
