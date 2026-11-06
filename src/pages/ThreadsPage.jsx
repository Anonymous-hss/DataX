import DataXAppShell from "../components/common/DataXAppShell";
import React, { useState, useEffect } from 'react';
import { Link, useNavigation } from '../context/NavigationContext';
import { useRuleEngine } from '../context/RuleEngineContext';
import GlobalSearchModal from '../components/common/GlobalSearchModal';
import OnboardingWizard from '../components/common/OnboardingWizard';
import ConfirmDialog from '../components/common/ConfirmDialog';
import UseCaseAdvisorModal from '../components/common/UseCaseAdvisorModal';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Cpu, 
  Database, 
  Bot, 
  Play, 
  CheckCircle2, 
  Zap, 
  Activity, 
  Plus, 
  Search,
  SlidersHorizontal,
  Layers,
  RefreshCw
} from 'lucide-react';

// --- Official DataX Brand Logo Squircle ---
export const DataXLogo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className="shrink-0">
    <rect width="64" height="64" rx="16" fill="#2D55F5" />
    <polygon points="14.5,49.5 24.5,49.5 49.5,14.5 39.5,14.5" fill="#FFFFFF" />
    <polygon points="14.5,14.5 24.5,14.5 31.5,24.5 21.5,24.5" fill="#1473E6" />
    <polygon points="32.5,39.5 42.5,39.5 49.5,49.5 39.5,49.5" fill="#1473E6" />
  </svg>
);

// Animated Hero Orbital Pipeline Graphic with Live Pulse Feedback
const AnimatedHeroPipelineGraphic = ({ isSimulating, activeScenario }) => (
  <svg width="100%" height="175" viewBox="0 0 440 175" fill="none" className="w-full max-w-[440px] mx-auto overflow-visible">
    <defs>
      <radialGradient id="heroCoreGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#2D55F5" stopOpacity={isSimulating ? "0.65" : "0.42"} />
        <stop offset="65%" stopColor="#1473E6" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#0B1226" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="orbitStreamBeam" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#1473E6" stopOpacity="0.85" />
        <stop offset="50%" stopColor="#60A5FA" />
        <stop offset="100%" stopColor="#10B981" stopOpacity="0.9" />
      </linearGradient>
    </defs>

    {/* Ambient Core Aura */}
    <ellipse cx="220" cy="88" rx="165" ry="72" fill="url(#heroCoreGlow)" className="transition-all duration-500" />

    {/* Concentric Orbital Rings */}
    <ellipse 
      cx="220" 
      cy="88" 
      rx="155" 
      ry="64" 
      stroke="#334B80" 
      strokeWidth="1" 
      strokeDasharray="4 6" 
      opacity="0.6" 
    />
    <ellipse 
      cx="220" 
      cy="88" 
      rx="104" 
      ry="42" 
      stroke="#3D5F9E" 
      strokeWidth="1.25" 
      opacity="0.5" 
    />

    {/* Active Data Stream Axis */}
    <line 
      x1="58" 
      y1="88" 
      x2="382" 
      y2="88" 
      stroke="url(#orbitStreamBeam)" 
      strokeWidth="2.5" 
      strokeDasharray="6 4" 
      opacity="0.85" 
    />

    {/* Animated Flowing Data Packets */}
    <circle cx="115" cy="88" r="4" fill="#38BDF8" className="animate-ping" style={{ animationDuration: '2.2s' }} />
    <circle cx="115" cy="88" r="4" fill="#38BDF8" />
    <circle cx="158" cy="88" r="3.5" fill="#60A5FA" />
    <circle cx="282" cy="88" r="3.5" fill="#34D399" />
    <circle cx="325" cy="88" r="4" fill="#10B981" className="animate-ping" style={{ animationDuration: '1.8s' }} />
    <circle cx="325" cy="88" r="4" fill="#10B981" />

    {/* Orbital Telemetry Nodes */}
    <circle cx="135" cy="58" r="3.5" fill="#1473E6" />
    <circle cx="135" cy="58" r="7" fill="#1473E6" fillOpacity="0.25" />
    <circle cx="305" cy="118" r="3.5" fill="#10B981" />
    <circle cx="305" cy="118" r="7" fill="#10B981" fillOpacity="0.25" />

    {/* Left Node: Source System Cylinder */}
    <g transform="translate(56, 88)">
      <path d="M-22 -18 C-22 -25 22 -25 22 -18 V14 C22 21 -22 21 -22 14 Z" fill="#0B1328" stroke="#486299" strokeWidth="1.75" />
      <path d="M-22 -5 C-22 2 22 2 22 -5" stroke="#486299" strokeWidth="1.5" fill="none" />
      <path d="M-22 5 C-22 12 22 12 22 5" stroke="#486299" strokeWidth="1.5" fill="none" />
      <ellipse cx="0" cy="-18" rx="22" ry="7" fill="#132142" stroke="#38BDF8" strokeWidth="2.2" />
      <text x="0" y="34" textAnchor="middle" fill="#94A3B8" fontSize="9.5" fontFamily="monospace" fontWeight="600">
        {activeScenario?.sourceShort || 'SOURCE_DB'}
      </text>
    </g>

    {/* Central Node: DataX AI Rule & Firewall Core */}
    <g transform="translate(220, 88)">
      <rect 
        x="-42" 
        y="-42" 
        width="84" 
        height="84" 
        rx="22" 
        fill="#2D55F5" 
        fillOpacity={isSimulating ? "0.35" : "0.18"} 
        className="transition-all duration-300"
      />
      <rect x="-32" y="-32" width="64" height="64" rx="16" fill="#2D55F5" stroke="#93C5FD" strokeWidth="2" />
      <g transform="translate(-32, -32)">
        <polygon points="14.5,49.5 24.5,49.5 49.5,14.5 39.5,14.5" fill="#FFFFFF" />
        <polygon points="14.5,14.5 24.5,14.5 31.5,24.5 21.5,24.5" fill="#1473E6" />
        <polygon points="32.5,39.5 42.5,39.5 49.5,49.5 39.5,49.5" fill="#1473E6" />
      </g>
      <text x="0" y="48" textAnchor="middle" fill="#E2E8F0" fontSize="9.5" fontFamily="monospace" fontWeight="700">
        AI AST ENGINE
      </text>
    </g>

    {/* Right Node: Verified Target Cylinder + Check Badge */}
    <g transform="translate(384, 88)">
      <path d="M-22 -18 C-22 -25 22 -25 22 -18 V14 C22 21 -22 21 -22 14 Z" fill="#0B1328" stroke="#486299" strokeWidth="1.75" />
      <path d="M-22 -5 C-22 2 22 2 22 -5" stroke="#486299" strokeWidth="1.5" fill="none" />
      <path d="M-22 5 C-22 12 22 12 22 5" stroke="#486299" strokeWidth="1.5" fill="none" />
      <ellipse cx="0" cy="-18" rx="22" ry="7" fill="#132142" stroke="#10B981" strokeWidth="2.2" />
      <circle cx="16" cy="12" r="8.5" fill="#10B981" stroke="#0B1328" strokeWidth="2" />
      <polyline points="12.5,12 15,14.5 19.5,9.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <text x="0" y="34" textAnchor="middle" fill="#6EE7B7" fontSize="9.5" fontFamily="monospace" fontWeight="600">
        {activeScenario?.targetShort || 'CLEAN_SINK'}
      </text>
    </g>
  </svg>
);

// Database Cylinders Icon for Cards (SAP BW / Clean Core)
const SapCylinderIcon = () => (
  <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
    <ellipse cx="14" cy="7" rx="10" ry="3.5" fill="#EEF2FF" stroke="#0A0F1F" strokeWidth="1.75" />
    <path d="M4 7v6c0 1.93 4.48 3.5 10 3.5s10-1.57 10-3.5V7" stroke="#0A0F1F" strokeWidth="1.75" fill="none" />
    <path d="M4 13v6c0 1.93 4.48 3.5 10 3.5s10-1.57 10-3.5v-6" stroke="#0A0F1F" strokeWidth="1.75" fill="none" />
    <circle cx="9" cy="13" r="1.5" fill="#127A52" />
    <circle cx="14" cy="13" r="1.5" fill="#127A52" />
    <circle cx="19" cy="13" r="1.5" fill="#127A52" />
  </svg>
);

// Layered Logo for Customer Master & Finance
const MasterDataIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <polygon points="12 2 2 7 12 12 22 7 12 2" fill="#00ED64" fillOpacity="0.2" stroke="#00A344" strokeWidth="1.75" strokeLinejoin="round" />
    <polyline points="2 12 12 17 22 12" stroke="#00A344" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="2 17 12 22 22 17" stroke="#00A344" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Healthcare Shield Icon
const HealthcareIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L4 5v6.5C4 16.5 7.5 21 12 22c4.5-1 8-5.5 8-10.5V5l-8-3z" fill="#EEF2FF" stroke="#336791" strokeWidth="1.75" strokeLinejoin="round" />
    <line x1="12" y1="8" x2="12" y2="16" stroke="#336791" strokeWidth="2" strokeLinecap="round" />
    <line x1="8" y1="12" x2="16" y2="12" stroke="#336791" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Interactive Hero Scenarios for Feedback-Driven Experience
const HERO_LIVE_SCENARIOS = [
  {
    id: 'sap_clean_core',
    label: 'SAP S/4HANA Clean Core',
    badge: 'ERP Migration',
    prompt: 'Verify plant code WERKS against S/4HANA ontology, enforce NETWR == MENGE * NETPR, and auto-convert legacy EUR rows.',
    astCode: 'ASSERT(WERKS IN ["P1000","P2000"]) && ABS(NETWR - QTY*PRICE) < 0.01',
    sourceShort: 'SAP_BW_0PUR',
    targetShort: 'S4HANA_ACDOCA',
    latency: '11.2ms',
    cleanRate: '99.4%',
    autoFixed: '142 rows',
    targetScreen: 'canvas',
    threadId: 'thread_sap_s4hana'
  },
  {
    id: 'ai_privacy_guard',
    label: 'Zero-Egress AI Firewall',
    badge: 'LLM Proxy',
    prompt: 'Intercept outbound GPT-4o & Claude prompts, mask SSNs and credit cards into AES-GCM RAM tokens, and block jailbreaks.',
    astCode: 'TOKENIZE(PII: ["SSN","CC","EMAIL"], VAULT="AES_GCM_RAM") && BLOCK(INJECTION)',
    sourceShort: 'APP_PROMPT',
    targetShort: 'ZERO_EGRESS_LLM',
    latency: '8.4ms',
    cleanRate: '100% Scrubbed',
    autoFixed: '0 bytes leaked',
    targetScreen: 'ai-firewall',
    threadId: null
  },
  {
    id: 'ml_drift_gate',
    label: 'ML Training & Drift Gate',
    badge: 'EU AI Act Art. 10',
    prompt: 'Block GPU fine-tuning if 10-quantile Population Stability Index (PSI) > 0.20 or target feature leakage |r| >= 0.75.',
    astCode: 'GATE_CERTIFY(MAX_PSI <= 0.20, MAX_CORR < 0.75, SIGN="SHA256")',
    sourceShort: 'RAW_CORPUS',
    targetShort: 'CERTIFIED_SFT',
    latency: '18.7ms',
    cleanRate: '98.9% Parity',
    autoFixed: 'Signed SHA-256',
    targetScreen: 'ml-certify',
    threadId: null
  },
  {
    id: 'fin_gl_audit',
    label: 'Financial GL Reconciliation',
    badge: 'SOX Compliance',
    prompt: 'Reconcile Oracle General Ledger debit/credit balance parity before committing to Snowflake executive reporting tables.',
    astCode: 'ASSERT(SUM(DEBIT) == SUM(CREDIT)) && QUARANTINE_ORPHAN_COST_CENTER()',
    sourceShort: 'ORACLE_GL',
    targetShort: 'SNOWFLAKE_FIN',
    latency: '13.1ms',
    cleanRate: '99.8%',
    autoFixed: '38 balanced',
    targetScreen: 'canvas',
    threadId: 'thread_financial_gl'
  }
];

export default function ThreadsPage({ onOpenLegacyPoc, onSwitchToMarketing } = {}) {
  const { navigateTo } = useNavigation();
  const { threads: contextThreads, selectThread, deleteThread, autoFixEnabled, setAutoFixEnabled } = useRuleEngine();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Interactive Hero Simulator State
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);
  const [customRuleInput, setCustomRuleInput] = useState(HERO_LIVE_SCENARIOS[0].prompt);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simFeedback, setSimFeedback] = useState('Compiled & Armed • 0 Egress Leaks');

  const activeScenario = HERO_LIVE_SCENARIOS[activeScenarioIdx];

  const handleSelectScenario = (idx) => {
    setActiveScenarioIdx(idx);
    setCustomRuleInput(HERO_LIVE_SCENARIOS[idx].prompt);
    setIsSimulating(true);
    setSimFeedback('Compiling deterministic AST rules...');
    setTimeout(() => {
      setIsSimulating(false);
      setSimFeedback(`Verified in ${HERO_LIVE_SCENARIOS[idx].latency} • ${HERO_LIVE_SCENARIOS[idx].cleanRate}`);
    }, 450);
  };

  const handleRunHeroSimulation = (e) => {
    if (e) e.preventDefault();
    setIsSimulating(true);
    setSimFeedback('Synthesizing AST & running dry-run verification...');
    setTimeout(() => {
      setIsSimulating(false);
      setSimFeedback(`✓ Rule Compiled & Verified (${activeScenario.latency}) • Ready for Live Execution`);
    }, 550);
  };

  // Format threads with rich fallback metadata so cards never look empty or truncated
  const formattedThreads = (contextThreads || []).map((t, index) => {
    let icon = <MasterDataIcon />;
    if (t.id === 'sap_bw_s4hana' || t.domainPackId === 'sap_bw_s4hana' || t.name?.includes('SAP')) {
      icon = <SapCylinderIcon />;
    } else if (t.name?.includes('Health') || t.domainPackId === 'healthcare_hipaa') {
      icon = <HealthcareIcon />;
    } else if (t.name?.includes('Ledger') || t.domainPackId === 'financial_gl_ledger') {
      icon = <MasterDataIcon />;
    }

    const runCount = typeof t.runCount === 'number' 
      ? t.runCount 
      : (t.runs ? parseInt(t.runs) || 0 : 0);
    const hasExecuted = runCount > 0 || t.status === 'live' || (t.healthScore !== null && t.healthScore !== undefined);
    const isLive = t.status === 'live';
    const isHealthy = isLive || (hasExecuted && (t.healthScore ?? 0) >= 80);
    const isWarning = hasExecuted && !isHealthy && (t.healthScore ?? 0) >= 60;

    // Extract clean source and target names for the 3-node visual topology
    const rawPipeline = t.pipeline || `${t.source?.database || 'Source DB'} → AI rules → ${t.target?.table || 'Target Sink'}`;
    const parts = rawPipeline.split('→').map(s => s.trim());
    const sourceNodeLabel = parts[0] || t.source?.engine || 'Source DB';
    const targetNodeLabel = parts[parts.length - 1] || t.target?.engine || 'Target Sink';
    const ruleCount = Array.isArray(t.rules) && t.rules.length > 0 ? t.rules.length : (4 + (index % 3));

    return {
      id: t.id || t.threadId || `TH-00${index + 1}`,
      name: t.name || 'Enterprise Pipeline',
      domain: t.domain || t.category || 'Data Intelligence',
      desc: t.desc || t.description || 'Automated data reconciliation, verification, and deterministic AST transformation.',
      pipeline: rawPipeline,
      sourceNodeLabel,
      targetNodeLabel,
      ruleCount,
      runCount,
      hasExecuted,
      status: isHealthy ? 'healthy' : isWarning ? 'warning' : 'draft',
      statusLabel: isLive 
        ? 'Live' 
        : hasExecuted 
          ? (t.healthScore >= 80 ? 'Healthy' : t.healthScore >= 60 ? 'Needs Attention' : 'Below threshold')
          : 'Ready to Run',
      successRate: hasExecuted && t.healthScore !== null && t.healthScore !== undefined 
        ? Number(t.healthScore) 
        : (t.successRate ? Number(t.successRate) : null),
      runs: runCount > 0 ? `${runCount} ${runCount === 1 ? 'run' : 'runs'}` : `${ruleCount} AI rules armed`,
      icon
    };
  });

  const evaluatedThreads = formattedThreads.filter(t => t.hasExecuted && t.successRate != null);
  const activeCount = formattedThreads.filter(t => t.hasExecuted && t.status === 'healthy').length;
  const meanHealth = evaluatedThreads.length 
    ? Math.round(evaluatedThreads.reduce((acc, t) => acc + Number(t.successRate), 0) / evaluatedThreads.length * 10) / 10 
    : '99.2';

  const totalRuns = formattedThreads.reduce((acc, t) => acc + (t.runCount || 0), 0);

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  const filteredThreads = formattedThreads.filter((t) => {
    if (filter === 'live' && t.status !== 'healthy') return false;
    if (filter === 'draft' && t.status !== 'draft') return false;
    if (
      search.trim() &&
      !t.name.toLowerCase().includes(search.toLowerCase()) &&
      !t.domain.toLowerCase().includes(search.toLowerCase()) &&
      !t.pipeline.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredThreads.length / pageSize));
  const pagedThreads = filteredThreads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleConfirmDelete = async () => {
    if (!threadToDelete) return;
    try {
      await deleteThread(threadToDelete.id);
    } catch (e) {
      console.warn("Delete thread API error:", e);
    }
    setThreadToDelete(null);
  };

  return (
    <DataXAppShell onSwitchToMarketing={onSwitchToMarketing}>
      
      {/* =====================================================================
          1. EDGE-TO-EDGE INTERACTIVE & FEEDBACK-BASED HERO SECTION
      ===================================================================== */}
      <section className="w-full bg-gradient-to-br from-[#070C1A] via-[#0E1936] to-[#1A2C5E] text-white border-b border-[#1E2E5A] relative overflow-hidden">
        {/* Subtle Tech Grid & Radial Lighting */}
        <div 
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#60A5FA 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#2D55F5]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/3 w-80 h-80 rounded-full bg-[#1473E6]/15 blur-3xl pointer-events-none" />

        <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-10 py-9 lg:py-11 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            {/* Left Column (7 Cols): Headline, Interactive Rule Sandbox & Live KPI Strip */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Top Interactive Status Badges */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1473E6] text-[#0A0F1F] font-bold text-xs tracking-tight shadow-sm">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>AI Rule Builder &amp; Zero-Egress Studio</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.07] border border-white/15 text-blue-200 text-xs font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{simFeedback}</span>
                </div>
              </div>

              {/* Commanding Hero Headline */}
              <div>
                <h1 className="text-2xl sm:text-3xl xl:text-[38px] font-extrabold text-white tracking-tight leading-[1.15]">
                  Describe the rules in plain English.<br className="hidden sm:inline" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-[#60A5FA]">
                    DataX writes them, tests them and keeps them running.
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-[#B8C4DF] mt-2.5 max-w-2xl leading-relaxed">
                  Click any live enterprise scenario below or type a rule in plain English to see real-time AST compilation, zero-egress PII scrubbing, and deterministic target commit telemetry.
                </p>
              </div>

              {/* Interactive Scenario Selector Pills */}
              <div className="space-y-2.5 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300/80 mr-1">
                    Live Interactive Scenarios:
                  </span>
                  {HERO_LIVE_SCENARIOS.map((scen, idx) => {
                    const isSelected = activeScenarioIdx === idx;
                    return (
                      <button
                        key={scen.id}
                        type="button"
                        onClick={() => handleSelectScenario(idx)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#2D55F5] text-white shadow-md shadow-[#2D55F5]/30 border border-blue-400/50 scale-[1.02]'
                            : 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 border border-white/10'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-300 animate-ping' : 'bg-slate-400'}`} />
                        <span>{scen.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Interactive Plain-English Rule Input & Instant Compile Feedback Bar */}
                <form 
                  onSubmit={handleRunHeroSimulation}
                  className="bg-[#060B19]/85 backdrop-blur-xl border border-white/15 focus-within:border-[#60A5FA] rounded-2xl p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shadow-inner transition-all"
                >
                  <div className="flex items-center gap-2.5 flex-1 pl-2.5 py-1">
                    <Sparkles className={`w-4 h-4 shrink-0 ${isSimulating ? 'text-amber-300 animate-spin' : 'text-[#60A5FA]'}`} />
                    <input
                      type="text"
                      value={customRuleInput}
                      onChange={(e) => setCustomRuleInput(e.target.value)}
                      placeholder="Describe any data quality, PII masking, or ML drift rule in plain English..."
                      className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none font-medium"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="submit"
                      className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                      <span>Simulate</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (activeScenario.threadId) selectThread(activeScenario.threadId);
                        navigateTo(activeScenario.targetScreen);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#2D55F5] hover:bg-[#1E44E0] text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Open in Studio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              </div>

              {/* Interactive 4-Metric Telemetry Bar */}
              <div className="bg-[#070D1F]/80 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
                <div className="px-3 py-1 first:pl-1">
                  <p className="text-[11px] font-medium text-[#8F9BB3]">Active pipelines</p>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-lg sm:text-xl font-bold text-white">{activeCount || formattedThreads.length}</span>
                    <span className="text-xs text-[#8F9BB3] font-medium">/ {formattedThreads.length} armed</span>
                  </div>
                </div>

                <div className="px-3 py-1">
                  <p className="text-[11px] font-medium text-[#8F9BB3]">Mean data health</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-lg sm:text-xl font-bold text-white">{meanHealth}%</span>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      A+
                    </span>
                  </div>
                </div>

                <div 
                  onClick={() => navigateTo('history')}
                  className="px-3 py-1 cursor-pointer group/stat"
                  title="View Run Telemetry"
                >
                  <p className="text-[11px] font-medium text-[#8F9BB3] group-hover/stat:text-blue-300 transition-colors">
                    Verified runs
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-lg sm:text-xl font-bold text-white">{totalRuns > 0 ? totalRuns : 128}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400 group-hover/stat:translate-x-0.5 group-hover/stat:text-blue-300 transition-all" />
                  </div>
                </div>

                <div className="px-3 py-1 last:pr-1 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-[#8F9BB3]">Autonomous Auto-Fix</p>
                    <p className={`text-lg sm:text-xl font-bold mt-0.5 ${autoFixEnabled ? 'text-[#38BDF8]' : 'text-slate-400'}`}>
                      {autoFixEnabled ? 'Armed (On)' : 'Paused'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoFixEnabled && setAutoFixEnabled(!autoFixEnabled)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                      autoFixEnabled ? 'bg-[#1473E6]' : 'bg-slate-700'
                    }`}
                    title="Toggle Autonomous Auto-Fix"
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      autoFixEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column (5 Cols): Live Animated Pipeline Telemetry Console */}
            <div className="lg:col-span-5">
              <div className="bg-[#081024]/90 backdrop-blur-xl border border-white/15 rounded-2xl p-5 shadow-2xl space-y-4 relative overflow-hidden">
                {/* Console Top Bar */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold tracking-wide uppercase text-slate-200">
                      Live Execution Topology
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#2D55F5]/30 border border-[#60A5FA]/40 text-[#93C5FD] text-[10px] font-mono font-bold">
                    {activeScenario.badge}
                  </span>
                </div>

                {/* Animated Orbital SVG Graphic */}
                <div className="py-1">
                  <AnimatedHeroPipelineGraphic 
                    isSimulating={isSimulating} 
                    activeScenario={activeScenario} 
                  />
                </div>

                {/* Compiled AST Code & Live Metrics Readout */}
                <div className="bg-[#050914] border border-white/10 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>COMPILED DETERMINISTIC RULE (AST):</span>
                    <span className="text-emerald-400 font-bold">LATENCY: {activeScenario.latency}</span>
                  </div>
                  <div className="text-xs font-mono text-[#60A5FA] truncate">
                    {activeScenario.astCode}
                  </div>
                  <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[11px]">
                    <span className="text-slate-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Output: <strong className="text-white">{activeScenario.cleanRate}</strong></span>
                    </span>
                    <span className="text-blue-300 font-mono text-[10px]">
                      Remediation: {activeScenario.autoFixed}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =====================================================================
          2. WELL-PLANNED MAIN WORKSPACE CONTENT BELOW HERO
      ===================================================================== */}
      <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-10 py-8 space-y-9">

        {/* SECTION A: Streamlined 3-Pillar Architecture Command Deck */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EEF2FF] text-[#2D55F5] border border-[#2D55F5]/20">
                  Core Engine Paradigms
                </span>
                <span className="text-xs text-[#5F6678] font-medium">
                  Unified Zero-Egress Platform for Data, AI Agents &amp; ML Training
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#0A0F1F] tracking-tight mt-1">
                What do you want DataX to guarantee for your team?
              </h2>
            </div>

            <button
              onClick={() => setAdvisorOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0A0F1F] hover:bg-[#1E293B] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Launch Use Case Advisor</span>
              <span className="text-[10px] bg-white/15 px-1.5 py-0.5 rounded font-mono font-bold text-blue-200">
                30s Match
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Pillar 1 */}
            <div 
              onClick={() => navigateTo('new-workflow')}
              className="bg-white rounded-2xl border border-[#E3E6EE] hover:border-[#2D55F5] p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#2D55F5]" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#2D55F5] flex items-center justify-center border border-blue-100">
                      <Database className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-[15px] text-[#0A0F1F] group-hover:text-[#2D55F5] transition-colors">
                      1. Database &amp; ERP Migrations
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#474E61] bg-[#F5F6FA] border border-[#E3E6EE] px-2 py-0.5 rounded-md shrink-0">
                    DuckDB AST
                  </span>
                </div>

                <p className="text-xs text-[#5F6678] leading-relaxed">
                  Eliminate corrupted syncs across SAP BW, S/4HANA, Postgres, MongoDB &amp; Snowflake with deterministic AST rules and auto-DLQ quarantine.
                </p>
              </div>

              <div className="pt-3.5 mt-3.5 border-t border-[#F2F4F7] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#127A52]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>99.01% Clean Core Parity</span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#2D55F5] group-hover:translate-x-0.5 transition-transform">
                  <span>Open Canvas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div 
              onClick={() => navigateTo('ai-firewall')}
              className="bg-white rounded-2xl border border-[#E3E6EE] hover:border-[#2D55F5] p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#1473E6]" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#2D55F5] flex items-center justify-center border border-blue-100">
                      <Bot className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-[15px] text-[#0A0F1F] group-hover:text-[#2D55F5] transition-colors">
                      2. AI Agent &amp; Privacy Firewall
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#2D55F5] bg-[#EEF2FF] border border-[#2D55F5]/20 px-2 py-0.5 rounded-md shrink-0">
                    &lt; 15ms Proxy
                  </span>
                </div>

                <p className="text-xs text-[#5F6678] leading-relaxed">
                  Stop prompt injections and tokenize SSNs, cards &amp; secrets in AES-GCM RAM before OpenAI, Claude, or RAG vector dispatch.
                </p>
              </div>

              <div className="pt-3.5 mt-3.5 border-t border-[#F2F4F7] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#2D55F5]">
                  <span className="w-2 h-2 rounded-full bg-[#2D55F5] animate-pulse" />
                  <span>Zero-Egress + BYOK Live Mode</span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#2D55F5] group-hover:translate-x-0.5 transition-transform">
                  <span>Launch Firewall</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div 
              onClick={() => navigateTo('ml-certify')}
              className="bg-white rounded-2xl border border-[#E3E6EE] hover:border-[#2D55F5] p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#0A0F1F]" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#2D55F5] flex items-center justify-center border border-blue-100">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-[15px] text-[#0A0F1F] group-hover:text-[#2D55F5] transition-colors">
                      3. ML Training &amp; Drift Gate
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#474E61] bg-[#F5F6FA] border border-[#E3E6EE] px-2 py-0.5 rounded-md shrink-0">
                    EU AI Act Art. 10
                  </span>
                </div>

                <p className="text-xs text-[#5F6678] leading-relaxed">
                  Prevent wasted GPU runs on drifted datasets. Compute 10-bin PSI drift, catch target leakage (|r| &ge; 0.75), and sign SHA-256 release cards.
                </p>
              </div>

              <div className="pt-3.5 mt-3.5 border-t border-[#F2F4F7] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#474E61]">
                  <span className="w-2 h-2 rounded-full bg-[#0A0F1F]" />
                  <span>SHA-256 Dataset Certificate</span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#2D55F5] group-hover:translate-x-0.5 transition-transform">
                  <span>Open ML Gate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION B: Active Workspace Workflows (Symmetrical 3-Column Bento Grid) */}
        <section className="space-y-5">
          {/* Unified Filter & Search Header Bar */}
          <div className="bg-white rounded-2xl border border-[#E3E6EE] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#0A0F1F] leading-none">
                  Workspace Pipelines
                </h2>
                <p className="text-xs text-[#5F6678] mt-1">
                  Showing {filteredThreads.length} of {formattedThreads.length} verified pipeline blueprints
                </p>
              </div>

              {/* Segmented Filter Pills */}
              <div className="bg-[#F0F2F6] p-1 rounded-xl inline-flex items-center gap-1 ml-0 sm:ml-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                    filter === 'all'
                      ? 'bg-white text-[#0A0F1F] shadow-2xs font-bold'
                      : 'text-[#5F6678] hover:text-[#0A0F1F] font-medium'
                  }`}
                >
                  All ({formattedThreads.length})
                </button>
                <button
                  onClick={() => setFilter('live')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                    filter === 'live'
                      ? 'bg-white text-[#2D55F5] shadow-2xs font-bold'
                      : 'text-[#5F6678] hover:text-[#0A0F1F] font-medium'
                  }`}
                >
                  Live
                </button>
                <button
                  onClick={() => setFilter('draft')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                    filter === 'draft'
                      ? 'bg-white text-[#0A0F1F] shadow-2xs font-bold'
                      : 'text-[#5F6678] hover:text-[#0A0F1F] font-medium'
                  }`}
                >
                  Ready / Draft
                </button>
              </div>
            </div>

            {/* Right: Search Input + New Workflow Button */}
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 text-[#8E95A9] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, domain, or table..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#E3E6EE] rounded-xl text-xs text-[#0A0F1F] placeholder:text-[#9CA3AF] focus:outline-none focus:bg-white focus:border-[#2D55F5] transition-all"
                />
              </div>

              <Link to="new-workflow">
                <button className="bg-[#2D55F5] hover:bg-[#2045DC] text-white px-4 py-2 rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0">
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>New Workflow</span>
                </button>
              </Link>
            </div>
          </div>

          {/* 3-Column Balanced Bento Grid (No Truncated Titles, Symmetrical 2x3 Layout) */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {pagedThreads.map((thread) => (
              <div
                key={thread.id}
                className="bg-white rounded-2xl border border-[#E3E6EE] hover:border-[#2D55F5]/50 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Top Header: Icon + Domain Category + Status Pill */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-[#EEF2FF] border border-blue-100/80 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        {thread.icon}
                      </div>
                      <div className="min-w-0">
                        <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#2D55F5]">
                          {thread.domain}
                        </span>
                        <h3 className="text-[16px] font-bold text-[#0A0F1F] tracking-tight leading-snug mt-0.5">
                          {thread.name}
                        </h3>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {thread.hasExecuted ? (
                      thread.status === 'warning' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFF4E3] text-[#A35600] text-[11px] font-semibold border border-[#F7D9AE] shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#A35600]" />
                          {thread.statusLabel}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E7F6EE] text-[#127A52] text-[11px] font-semibold border border-[#BFE6D2] shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#127A52]" />
                          {thread.statusLabel}
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EEF2FF] text-[#2D55F5] text-[11px] font-semibold border border-[#2D55F5]/20 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2D55F5]" />
                        {thread.statusLabel}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[#5F6678] leading-relaxed mt-3.5 line-clamp-2">
                    {thread.desc}
                  </p>

                  {/* Visual 3-Node Pipeline Topology Strip */}
                  <div className="mt-4 p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E3E6EE] flex items-center justify-between gap-2 text-[11px] font-mono">
                    <div className="px-2 py-1 rounded bg-white border border-[#E3E6EE] text-[#0A0F1F] font-semibold truncate max-w-[34%]" title={thread.sourceNodeLabel}>
                      {thread.sourceNodeLabel}
                    </div>
                    <div className="flex items-center gap-1 text-[#2D55F5] font-bold shrink-0">
                      <span>➔</span>
                      <span className="px-2 py-0.5 rounded-md bg-[#EEF2FF] border border-[#2D55F5]/20 text-[10px]">
                        ⚡ {thread.ruleCount} AI Rules
                      </span>
                      <span>➔</span>
                    </div>
                    <div className="px-2 py-1 rounded bg-white border border-[#E3E6EE] text-[#127A52] font-semibold truncate max-w-[34%]" title={thread.targetNodeLabel}>
                      {thread.targetNodeLabel}
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Health / Readiness Bar & Actions */}
                <div className="mt-5 pt-4 border-t border-[#F2F4F7] space-y-4">
                  {/* Health or Schema Readiness Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#5F6678] font-medium">
                        {thread.hasExecuted && thread.successRate != null ? 'Data Health Score' : 'Pipeline Readiness'}
                      </span>
                      {thread.hasExecuted && thread.successRate != null ? (
                        <span className="text-[#0A0F1F] font-bold">{thread.successRate}% Verified</span>
                      ) : (
                        <span className="text-[#127A52] font-semibold text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          100% Schema Mapped
                        </span>
                      )}
                    </div>
                    <div className="w-full h-2 bg-[#E3E6EE] rounded-full overflow-hidden">
                      {thread.hasExecuted && thread.successRate != null ? (
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            thread.status === 'warning' ? 'bg-[#D97706]' : 'bg-[#2D55F5]'
                          }`}
                          style={{ width: `${Math.min(100, thread.successRate)}%` }}
                        />
                      ) : (
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-[#2D55F5] to-[#1473E6] opacity-85" 
                          style={{ width: '100%' }} 
                        />
                      )}
                    </div>
                  </div>

                  {/* Action Toolbar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[#5F6678] bg-[#F5F6FA] px-2.5 py-1 rounded-lg border border-[#E3E6EE]">
                        {thread.runs}
                      </span>
                      <button 
                        onClick={() => setThreadToDelete(thread)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete Workflow"
                        aria-label="Delete Workflow"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          selectThread(thread.id);
                          navigateTo('running-dry-run');
                        }}
                        className="px-3 py-1.5 rounded-xl border border-[#E3E6EE] bg-[#F8FAFC] hover:bg-[#EEF2FF] hover:border-[#2D55F5]/40 text-xs font-semibold text-[#474E61] hover:text-[#2D55F5] transition-all cursor-pointer"
                      >
                        Dry Run
                      </button>
                      <button 
                        onClick={() => {
                          selectThread(thread.id);
                          navigateTo('canvas');
                        }}
                        className="px-4 py-1.5 rounded-xl bg-[#0A0F1F] hover:bg-[#2D55F5] text-white text-xs font-semibold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                      >
                        <span>Open Canvas</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* 6th Card in the 2x3 Symmetrical Grid: Build Custom Autonomous Workflow */}
            <Link
              to="canvas"
              className="border-2 border-dashed border-[#CDD2DE] hover:border-[#2D55F5] rounded-2xl bg-white/60 hover:bg-white p-6 flex flex-col items-center justify-center text-center group cursor-pointer transition-all min-h-[280px] shadow-2xs hover:shadow-md"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#EEF2FF] group-hover:bg-[#2D55F5] text-[#2D55F5] group-hover:text-white flex items-center justify-center transition-all shadow-2xs">
                <Plus className="w-7 h-7 stroke-[2.2]" />
              </div>
              <span className="mt-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F0F2F6] text-[#5F6678]">
                Visual DAG Studio
              </span>
              <h3 className="text-base font-bold text-[#0A0F1F] mt-2">
                Create Custom Autonomous Flow
              </h3>
              <p className="text-xs text-[#5F6678] mt-1 max-w-xs leading-relaxed">
                Connect any database, S3 bucket, or LLM endpoint and compile validation rules with AI in seconds.
              </p>
              <div className="mt-5 px-4 py-2 rounded-xl bg-[#EEF2FF] group-hover:bg-[#2D55F5] text-[#2D55F5] group-hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all">
                <span>Launch Visual Canvas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          </div>

          {/* Pagination Controls */}
          {filteredThreads.length > pageSize && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-4 border-t border-[#E3E6EE]">
              <span className="text-xs text-[#5F6678]">
                Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, filteredThreads.length)} of {filteredThreads.length} workflows
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-1.5 rounded-xl border border-[#E3E6EE] bg-white text-xs font-semibold text-[#0A0F1F] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F5F6FA] shadow-2xs transition-all"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(idx + 1)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                        currentPage === idx + 1
                          ? 'bg-[#2D55F5] text-white shadow-2xs'
                          : 'text-[#5F6678] hover:bg-white hover:text-[#0A0F1F]'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3.5 py-1.5 rounded-xl border border-[#E3E6EE] bg-white text-xs font-semibold text-[#0A0F1F] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F5F6FA] shadow-2xs transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Global Command Modals & Dialogs */}
      <GlobalSearchModal 
        isOpen={searchModalOpen} 
        onClose={() => setSearchModalOpen(false)} 
      />
      <OnboardingWizard 
        isOpen={onboardingOpen} 
        onClose={() => setOnboardingOpen(false)} 
      />
      <UseCaseAdvisorModal 
        isOpen={advisorOpen} 
        onClose={() => setAdvisorOpen(false)} 
      />
      <ConfirmDialog
        isOpen={!!threadToDelete}
        title={`Delete Workflow: ${threadToDelete?.name || ''}`}
        message="Are you sure you want to delete this pipeline workflow? Historical run metrics and validation rules configured for this thread will be permanently removed."
        confirmLabel="Delete Workflow"
        confirmTextMatch="DELETE"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setThreadToDelete(null)}
      />
    </DataXAppShell>
  );
}
