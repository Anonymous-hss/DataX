import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
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
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Zap,
  Menu,
  X,
  Shield,
  Cpu,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Workflow
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

// Parent Layout Context so DataXAppShell stays mounted once at the top layout level
const AppShellLayoutContext = createContext(false);

export default function DataXAppShell({ 
  children, 
  showContextBar = false,
  compact = false,
  onSwitchToMarketing 
}) {
  const isAlreadyWrappedInParentShell = useContext(AppShellLayoutContext);

  // If a child page also wraps with <DataXAppShell>, pass children directly
  // so the parent layout sidebar remains 100% constant without duplicating or remounting.
  if (isAlreadyWrappedInParentShell) {
    return <>{children}</>;
  }

  return (
    <AppShellLayoutContext.Provider value={true}>
      <DataXMasterLayout 
        showContextBar={showContextBar} 
        compact={compact} 
        onSwitchToMarketing={onSwitchToMarketing}
      >
        {children}
      </DataXMasterLayout>
    </AppShellLayoutContext.Provider>
  );
}

function DataXMasterLayout({ children, showContextBar = false, onSwitchToMarketing }) {
  const { currentScreen, navigateTo } = useNavigation();
  const ruleEngine = useRuleEngine?.() || {};
  const { activeThread, threads = [], selectThread } = ruleEngine;

  // Persistent sliding sidebar state (defaults to open on desktop)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('datax_sidebar_open');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [advisorModalOpen, setAdvisorModalOpen] = useState(false);
  const [threadPickerOpen, setThreadPickerOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const threadPickerRef = useRef(null);

  const toggleSidebar = () => {
    setSidebarOpen(prev => {
      const next = !prev;
      try {
        localStorage.setItem('datax_sidebar_open', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Close dropdowns on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (threadPickerRef.current && !threadPickerRef.current.contains(e.target)) {
        setThreadPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Global keyboard shortcuts: ⌘K (Search) & ⌘B (Toggle Sliding Sidebar)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentThreadName = activeThread?.name || 'SAP BW ➔ S/4HANA Clean Core';

  // Organized Sidebar Navigation Groups
  const CORE_PILLARS = [
    { id: 'workflows', label: 'Workflows', screen: 'workflows', icon: Activity, badge: threads.length || 5, desc: 'Autonomous Data & AI Pipelines' },
    { id: 'ai-firewall', label: 'AI Firewall', screen: 'ai-firewall', icon: Shield, badge: 'Zero-Egress', badgeColor: 'blue', desc: 'Reverse Proxy & Prompt Guard' },
    { id: 'ml-certify', label: 'ML Certify', screen: 'ml-certify', icon: Cpu, badge: 'PSI Gate', desc: 'Drift, Leakage & SFT Certification' },
    { id: 'connections', label: 'Connections', screen: 'connections', icon: Network, desc: 'Enterprise Data & Secret Vault' },
  ];

  const PIPELINE_OPERATIONS = [
    { id: 'canvas', label: 'Visual Canvas', screen: 'canvas', icon: Workflow, desc: 'Interactive DAG Rule Builder' },
    { id: 'templates', label: 'Domain Templates', screen: 'templates', icon: Layers, desc: 'Certified Industry Blueprints' },
    { id: 'quarantine', label: 'Quarantine DLQ', screen: 'quarantine', icon: SlidersHorizontal, desc: 'Dead-Letter Isolation & Fix' },
    { id: 'shadow', label: 'Shadow Parity', screen: 'shadow', icon: Zap, desc: 'Dual-Twin Reconciliation' },
    { id: 'history', label: 'Run Telemetry', screen: 'history', icon: Clock, desc: 'Execution & Commit History' },
  ];

  const GOVERNANCE_ITEMS = [
    { id: 'audit', label: 'Audit Ledger', screen: 'audit', icon: ShieldCheck, desc: 'SHA-256 Tamper-Evident SIEM' },
    { id: 'roi', label: 'Executive ROI', screen: 'roi', icon: TrendingUp, desc: 'Board Risk & Value Dossier' },
    { id: 'settings', label: 'Settings & RBAC', screen: 'settings', icon: Settings, desc: 'Tenant, SSO, Cron & API Keys' },
  ];

  const isNavActive = (screenKey) => {
    if (screenKey === 'workflows' && (currentScreen === 'workflows' || currentScreen === 'threads' || currentScreen === 'home' || currentScreen === '')) return true;
    if (screenKey === 'ai-firewall' && (currentScreen === 'ai-firewall' || currentScreen === 'firewall' || currentScreen === 'rag-firewall' || currentScreen === 'agent-guard')) return true;
    if (screenKey === 'ml-certify' && (currentScreen === 'ml-certify' || currentScreen === 'ml-certification' || currentScreen === 'ml-gate')) return true;
    if (screenKey === 'canvas' && (currentScreen === 'canvas' || currentScreen === 'workflow-builder' || currentScreen === 'connect-source' || currentScreen === 'generate-rules' || currentScreen === 'rules')) return true;
    if (screenKey === 'templates' && (currentScreen === 'templates' || currentScreen === 'domain-packs')) return true;
    if (screenKey === 'history' && (currentScreen === 'history' || currentScreen === 'runs')) return true;
    return currentScreen === screenKey;
  };

  const allNavItems = [...CORE_PILLARS, ...PIPELINE_OPERATIONS, ...GOVERNANCE_ITEMS];
  const activeNavObj = allNavItems.find(item => isNavActive(item.screen)) || CORE_PILLARS[0];

  // Show active pipeline context bar automatically on studio/operation screens
  const shouldShowPipelinePicker = showContextBar || ['canvas', 'quarantine', 'shadow', 'audit', 'history', 'running-dry-run', 'dry-run-results', 'live-auto-fix'].includes(currentScreen);

  const renderSidebarNavButton = (item) => {
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
        className={`w-full group flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer text-left relative ${
          active
            ? 'bg-[#2D55F5] text-white font-semibold shadow-sm shadow-[#2D55F5]/20'
            : 'text-[#474E61] dark:text-slate-300 hover:bg-[#EEF2FF]/70 dark:hover:bg-white/[0.06] hover:text-[#0A0F1F] dark:hover:text-white font-medium'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
            active 
              ? 'bg-white/20 text-white' 
              : 'bg-[#F5F6FA] dark:bg-white/[0.05] text-[#5F6678] dark:text-slate-400 group-hover:bg-white group-hover:text-[#2D55F5]'
          }`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <div className="leading-tight truncate">{item.label}</div>
            <div className={`text-[10px] truncate mt-0.5 ${
              active ? 'text-blue-100/90 font-normal' : 'text-[#8E95A9] dark:text-slate-500 font-normal'
            }`}>
              {item.desc}
            </div>
          </div>
        </div>

        {item.badge && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
            active
              ? 'bg-white/20 text-white'
              : item.badgeColor === 'blue'
                ? 'bg-[#EEF2FF] text-[#2D55F5] border border-[#2D55F5]/20'
                : 'bg-[#F0F2F6] dark:bg-white/[0.08] text-[#5F6678] dark:text-slate-400'
          }`}>
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#141416] text-slate-800 dark:text-slate-200 font-sans antialiased relative transition-colors duration-200">
      {/* 1. Ambient Background Drifting Mesh Flows */}
      <AmbientBackgroundFlow />

      {/* 2. Constant Fixed Full-Height Left Sidebar (Never scrolls away on long pages) */}
      <aside
        aria-label="Primary Studio Sidebar"
        className={`hidden lg:flex flex-col fixed top-0 bottom-0 left-0 h-screen z-40 bg-white/95 dark:bg-[#18181C]/95 backdrop-blur-xl border-r border-[#E3E6EE] dark:border-white/[0.08] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] select-none shadow-xs w-[280px] xl:w-[292px] ${
          sidebarOpen 
            ? 'translate-x-0' 
            : '-translate-x-full'
        }`}
      >
        <div className="w-full h-full flex flex-col justify-between">
          {/* Sidebar Brand Header + Slide Toggle */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-[#E3E6EE]/80 dark:border-white/[0.08] shrink-0">
            <button
              type="button"
              onClick={() => navigateTo('workflows')}
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity group text-left"
              title="DataX Studio Home"
            >
              <Logo size={30} className="transition-transform group-hover:scale-105" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#0A0F1F] dark:text-white text-base tracking-tight leading-none">
                    DataX
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-[#EEF2FF] text-[#2D55F5] border border-[#2D55F5]/20">
                    STUDIO
                  </span>
                </div>
                <span className="block text-[10px] text-[#5F6678] dark:text-slate-400 font-medium mt-0.5">
                  Zero-Egress AI &amp; Data Plane
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={toggleSidebar}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5F6678] hover:text-[#0A0F1F] dark:hover:text-white hover:bg-[#F0F2F6] dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
              title="Slide sidebar closed (⌘B)"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* Sidebar Quick Actions: Search & Use Case Advisor */}
          <div className="px-3.5 pt-3.5 pb-2 space-y-2 shrink-0">
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#F5F6FA] dark:bg-white/[0.05] border border-[#E3E6EE] dark:border-white/[0.08] text-xs text-[#5F6678] hover:border-[#2D55F5]/50 hover:text-[#0A0F1F] transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-[#8E95A9]" />
                <span>Quick Search...</span>
              </span>
              <kbd className="text-[10px] font-mono text-[#5F6678] bg-white dark:bg-white/[0.08] px-1.5 py-0.5 rounded border border-[#E3E6EE]">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => setAdvisorModalOpen(true)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-[#0B1226] to-[#1C2C5E] hover:from-[#101A38] hover:to-[#243875] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer group"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
                <span>Use Case Advisor</span>
              </span>
              <span className="text-[9px] font-mono bg-white/15 px-1.5 py-0.5 rounded text-blue-200">
                30s Match
              </span>
            </button>
          </div>

          {/* Scrollable Organized Navigation Sections */}
          <div className="flex-1 overflow-y-auto px-3.5 py-2 space-y-5 scrollbar-thin">
            {/* Group 1: Core Pillars */}
            <div className="space-y-1">
              <div className="px-2 pb-1 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E95A9] dark:text-slate-500">
                  Core Engine Pillars
                </span>
              </div>
              {CORE_PILLARS.map(renderSidebarNavButton)}
            </div>

            {/* Group 2: Pipeline Operations */}
            <div className="space-y-1">
              <div className="px-2 pb-1 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E95A9] dark:text-slate-500">
                  Pipeline Operations
                </span>
              </div>
              {PIPELINE_OPERATIONS.map(renderSidebarNavButton)}
            </div>

            {/* Group 3: Governance & Admin */}
            <div className="space-y-1">
              <div className="px-2 pb-1 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E95A9] dark:text-slate-500">
                  Governance &amp; Security
                </span>
              </div>
              {GOVERNANCE_ITEMS.map(renderSidebarNavButton)}
            </div>
          </div>

          {/* Sidebar Footer: Zero-Egress Status & Help Guide */}
          <div className="p-3.5 border-t border-[#E3E6EE]/80 dark:border-white/[0.08] bg-[#F8FAFC]/80 dark:bg-white/[0.02] space-y-2.5 shrink-0">
            <div className="px-3 py-2 rounded-xl bg-white dark:bg-[#222226] border border-[#E3E6EE] dark:border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <div className="truncate">
                  <div className="text-[11px] font-bold text-[#0A0F1F] dark:text-white leading-tight">
                    Zero-Egress Vault
                  </div>
                  <div className="text-[10px] font-mono text-[#5F6678] dark:text-slate-400 truncate">
                    AES-GCM • On-Prem Ready
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOnboardingOpen(true)}
                className="p-1.5 rounded-lg text-[#5F6678] hover:text-[#2D55F5] hover:bg-[#EEF2FF] transition-colors cursor-pointer shrink-0"
                title="Open Studio Guide"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* 3. Right Main Content Viewport (Smoothly Transitions Padding/Width when Sidebar Slides) */}
      <div 
        className={`min-h-screen flex flex-col relative z-10 transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          sidebarOpen ? 'lg:pl-[280px] xl:pl-[292px]' : 'lg:pl-0'
        }`}
      >
        {/* Top Studio Utility Header Bar */}
        <header className="sticky top-0 z-30 w-full h-16 bg-white/90 dark:bg-[#18181C]/90 backdrop-blur-xl border-b border-[#E3E6EE] dark:border-white/[0.08] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 transition-colors shrink-0">
          {/* Left: Sidebar Expand Icon (only when sidebar is closed) + Breadcrumb + Active Pipeline Context */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Desktop Sidebar Expand Button — ONLY rendered when sidebar is collapsed, icon-only (no duplicate button, no "Sidebar" text) */}
            {!sidebarOpen && (
              <button
                type="button"
                onClick={toggleSidebar}
                className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg border border-[#E3E6EE] dark:border-white/[0.08] bg-[#F5F6FA] dark:bg-white/[0.05] text-[#5F6678] hover:text-[#2D55F5] hover:border-[#2D55F5]/40 hover:bg-[#EEF2FF] transition-all cursor-pointer shrink-0"
                title="Expand navigation (⌘B)"
                aria-label="Expand navigation"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}

            {/* Mobile Hamburger Button (< 1024px) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#5F6678] hover:text-[#0A0F1F] rounded-xl border border-[#E3E6EE] bg-white cursor-pointer shrink-0"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Show compact brand logo in top bar when sidebar is slid closed */}
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => navigateTo('workflows')}
                className="hidden lg:flex items-center gap-2 cursor-pointer pr-1"
              >
                <Logo size={26} />
                <span className="font-bold text-[#0A0F1F] dark:text-white text-sm tracking-tight">DataX</span>
              </button>
            )}

            {/* Current Section Breadcrumb */}
            <div className="flex items-center gap-2 text-xs min-w-0">
              <span className="hidden sm:inline text-[#8E95A9] font-medium">Studio</span>
              <ChevronRight className="hidden sm:inline w-3.5 h-3.5 text-[#CDD2DE] shrink-0" />
              <span className="font-bold text-[#0A0F1F] dark:text-white truncate text-sm">
                {activeNavObj.label}
              </span>
            </div>

            {/* Active Pipeline Quick Selector */}
            {shouldShowPipelinePicker && (
              <div className="hidden md:flex items-center gap-2 pl-3 ml-1 border-l border-[#E3E6EE] min-w-0" ref={threadPickerRef}>
                <span className="text-[11px] font-semibold text-[#8E95A9] shrink-0">Pipeline:</span>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setThreadPickerOpen(!threadPickerOpen)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F5F6FA] dark:bg-[#222226] border border-[#E3E6EE] dark:border-white/[0.08] font-semibold text-xs text-[#0A0F1F] dark:text-slate-200 hover:border-[#2D55F5] transition-colors cursor-pointer max-w-[240px] truncate"
                  >
                    <span className="truncate">{currentThreadName}</span>
                    <ChevronDown className={`w-3 h-3 text-slate-400 shrink-0 transition-transform ${threadPickerOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {threadPickerOpen && (
                    <div className="absolute top-full left-0 mt-1.5 w-72 bg-white dark:bg-[#222226] border border-[#E3E6EE] dark:border-white/[0.1] rounded-xl shadow-xl py-1 z-50">
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
                              ? 'bg-[#EEF2FF] text-[#2D55F5] font-bold'
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
            )}
          </div>

          {/* Right: Quick Actions, New Workflow CTA, Notifications & Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-start-thread-modal'));
                if (currentScreen !== 'threads') {
                  navigateTo('threads');
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('open-start-thread-modal'));
                  }, 80);
                }
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#2D55F5] hover:bg-[#2045DC] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New thread</span>
            </button>

            <NotificationCenter />

            <div className="pl-1.5 border-l border-[#E3E6EE] dark:border-white/[0.08]">
              <DataXUserMenu onSwitchToMarketing={onSwitchToMarketing} />
            </div>
          </div>
        </header>

        {/* Mobile Slide-Over Sidebar Drawer (< 1024px) */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div 
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" 
              onClick={() => setMobileMenuOpen(false)} 
            />
            <div className="relative w-72 max-w-[85vw] bg-white dark:bg-[#18181C] h-full flex flex-col justify-between p-4 overflow-y-auto z-10 shadow-2xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E3E6EE]">
                  <div className="flex items-center gap-2">
                    <Logo size={28} />
                    <span className="font-bold text-[#0A0F1F] dark:text-white text-base">DataX Studio</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 pb-1">Core Engine Pillars</div>
                  {CORE_PILLARS.map(renderSidebarNavButton)}
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 pb-1">Pipeline Operations</div>
                  {PIPELINE_OPERATIONS.map(renderSidebarNavButton)}
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 pb-1">Governance &amp; Security</div>
                  {GOVERNANCE_ITEMS.map(renderSidebarNavButton)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Viewport Page Content */}
        <main className="flex-1 w-full relative z-10">
          {children}
        </main>
      </div>

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
