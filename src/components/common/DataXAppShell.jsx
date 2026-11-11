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
  Workflow,
  GitBranch
} from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { useRuleEngine } from '../../context/RuleEngineContext';
import Logo from '../icons/Logo';
import NotificationCenter from './NotificationCenter';
import DataXUserMenu from './DataXUserMenu';
import AmbientBackgroundFlow from './AmbientBackgroundFlow';
import GlobalSearchModal from './GlobalSearchModal';
import NavigateFilterModal from './NavigateFilterModal';
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
  const [navigateModalOpen, setNavigateModalOpen] = useState(false);
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

  // Global keyboard shortcuts: ⌘K (Search), ⌘/ (Navigate & Filter), ⌘B (Toggle Sidebar)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setNavigateModalOpen(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setNavigateModalOpen(prev => !prev);
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

  const getBreadcrumbLabel = () => {
    if (currentScreen === 'new-workflow' || currentScreen === 'start-workflow' || currentScreen === 'new-thread' || currentScreen === 'start-thread') {
      return 'New workflow';
    }
    if (currentScreen === 'canvas' || currentScreen === 'workflow-builder') {
      return 'Visual Canvas';
    }
    return activeNavObj.label;
  };

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

      {/* 2. Full-Width Main Content Viewport */}
      <div className="min-h-screen flex flex-col relative z-10 w-full">
        {/* Top Studio Utility Header Bar */}
        <header className="sticky top-0 z-30 w-full h-16 bg-white/90 dark:bg-[#18181C]/90 backdrop-blur-xl border-b border-[#E3E6EE] dark:border-white/[0.08] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 transition-colors shrink-0">
          {/* Left: Brand Logo & Section Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigateTo('workflows')}
              className="flex items-center gap-2 cursor-pointer pr-1 shrink-0"
              title="DataX Home"
            >
              <Logo size={28} />
              <span className="font-bold text-[#0A0F1F] dark:text-white text-base tracking-tight">DataX</span>
            </button>

            {/* Current Section Breadcrumb */}
            <div className="flex items-center gap-2 text-xs min-w-0">
              <span className="text-[#8E95A9] font-medium">Studio</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#CDD2DE] shrink-0" />
              <span className="font-bold text-[#0A0F1F] dark:text-white truncate text-sm">
                {getBreadcrumbLabel()}
              </span>
            </div>

            {/* Active Pipeline Quick Selector */}
            {shouldShowPipelinePicker && (
              <div className="hidden md:flex items-center pl-2 ml-1 min-w-0" ref={threadPickerRef}>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setThreadPickerOpen(!threadPickerOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#222226] border border-[#CDD2DE] dark:border-white/[0.12] font-semibold text-xs text-[#0A0F1F] dark:text-slate-200 hover:border-[#2D55F5] transition-colors cursor-pointer max-w-[260px] truncate shadow-2xs"
                  >
                    <GitBranch className="w-3.5 h-3.5 text-[#2D55F5] shrink-0" />
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

          {/* Center: Quick Search Trigger (Matches Figma 01.1 exact layout) */}
          <div className="hidden md:flex flex-1 max-w-sm mx-4">
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-full bg-[#F5F6FA] dark:bg-white/[0.05] border border-[#E3E6EE] dark:border-white/[0.08] text-xs text-[#5F6678] hover:border-[#2D55F5]/40 hover:text-[#0A0F1F] transition-all cursor-pointer shadow-2xs"
              title="Search workflows, rules (⌘K)"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-[#8E95A9]" />
                <span>Search workflows, rules...</span>
              </div>
              <kbd className="text-[10px] font-mono text-[#5F6678] bg-white dark:bg-white/[0.08] px-1.5 py-0.5 rounded border border-[#E3E6EE]">⌘K</kbd>
            </button>
          </div>

          {/* Right: Navigate, Help, Notifications (Single instance), New Workflow, Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Enhancement 6.1 & 6.7: Navigate & filter trigger button with 4 distinct states */}
            <button
              type="button"
              onClick={() => setNavigateModalOpen(prev => !prev)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                navigateModalOpen
                  ? 'bg-[#EFF4FF] border border-[#2D55F5] text-[#2D55F5]'
                  : 'bg-white dark:bg-[#18181C] border border-[#E3E6EE] dark:border-white/[0.08] text-[#0A0F1F] dark:text-white hover:bg-[#F8FAFC] hover:border-[#CDD2DE]'
              }`}
              title="Navigate & filter (⌘/)"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className={navigateModalOpen ? 'text-[#2D55F5]' : 'text-[#5F6678] dark:text-slate-400'}>
                <path d="M2 4h12M2 8h9M2 12h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              <span className="font-semibold text-xs">Navigate</span>
              <span className="w-4 h-4 rounded-full bg-[#2D55F5] text-white text-[10px] font-bold flex items-center justify-center">2</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${navigateModalOpen ? 'rotate-180 text-[#2D55F5]' : 'text-[#8E95A9]'}`} />
            </button>

            <button
              type="button"
              onClick={() => navigateTo('help')}
              className="p-1.5 text-[#5F6678] hover:text-[#0A0F1F] dark:hover:text-white hover:bg-[#F5F6FA] dark:hover:bg-white/[0.05] rounded-full transition-colors cursor-pointer"
              title="Help & Documentation"
              aria-label="Help & Documentation"
            >
              <HelpCircle className="w-4 h-4 text-[#8E95A9]" />
            </button>

            {/* Exactly One Notification Center Instance */}
            <NotificationCenter />

            <button
              type="button"
              onClick={() => {
                navigateTo('new-workflow');
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#2D55F5] hover:bg-[#2045DC] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New workflow</span>
            </button>

            <div className="pl-1 border-l border-[#E3E6EE] dark:border-white/[0.08]">
              <DataXUserMenu onSwitchToMarketing={onSwitchToMarketing} />
            </div>
          </div>
        </header>

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
      <NavigateFilterModal 
        isOpen={navigateModalOpen} 
        onClose={() => setNavigateModalOpen(false)} 
        onOpenAdvisor={() => setAdvisorModalOpen(true)} 
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
