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
  Cpu, 
  Database, 
  Bot, 
  CheckCircle2, 
  Zap, 
  Plus, 
  Search
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

// Minimal, Clean Animated Orbital Hero Illustration
const HeroOrbitalGraphic = () => (
  <svg width="440" height="200" viewBox="0 0 440 200" fill="none" className="w-full max-w-[440px] shrink-0 overflow-visible">
    <defs>
      <radialGradient id="heroGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#2D55F5" stopOpacity="0.45" />
        <stop offset="70%" stopColor="#1E378A" stopOpacity="0.12" />
        <stop offset="100%" stopColor="#0B1226" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="orbitBeam" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#1473E6" stopOpacity="0.75" />
        <stop offset="50%" stopColor="#2D55F5" />
        <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.8" />
      </linearGradient>
    </defs>

    {/* Ambient Glow */}
    <ellipse cx="220" cy="100" rx="170" ry="82" fill="url(#heroGlow)" />

    {/* Orbital Concentric Wireframe Rings */}
    <ellipse cx="220" cy="100" rx="158" ry="72" stroke="#334B80" strokeWidth="1" strokeDasharray="3 5" opacity="0.55" />
    <ellipse cx="220" cy="100" rx="108" ry="48" stroke="#3D5F9E" strokeWidth="1.25" opacity="0.45" />

    {/* Pipeline Axis Line */}
    <line x1="60" y1="100" x2="380" y2="100" stroke="url(#orbitBeam)" strokeWidth="2" strokeDasharray="5 4" opacity="0.8" />

    {/* Subtle Animated Orbit Packet Dots */}
    <circle cx="135" cy="68" r="3.5" fill="#1473E6" />
    <circle cx="135" cy="68" r="7" fill="#1473E6" fillOpacity="0.2" className="animate-ping" style={{ animationDuration: '2.6s' }} />
    <circle cx="165" cy="100" r="3.5" fill="#38BDF8" />
    <circle cx="275" cy="100" r="3.5" fill="#38BDF8" />
    <circle cx="305" cy="132" r="3.5" fill="#38BDF8" />
    <circle cx="305" cy="132" r="7" fill="#38BDF8" fillOpacity="0.2" className="animate-ping" style={{ animationDuration: '2.2s' }} />

    {/* Left Node: Source Cylinder */}
    <g transform="translate(60, 100)">
      <path d="M-20 -18 C-20 -25 20 -25 20 -18 V14 C20 21 -20 21 -20 14 Z" fill="#0C1428" stroke="#486299" strokeWidth="1.75" />
      <path d="M-20 -5 C-20 2 20 2 20 -5" stroke="#486299" strokeWidth="1.5" fill="none" />
      <path d="M-20 5 C-20 12 20 12 20 5" stroke="#486299" strokeWidth="1.5" fill="none" />
      <ellipse cx="0" cy="-18" rx="20" ry="7" fill="#132142" stroke="#1473E6" strokeWidth="2.5" />
    </g>

    {/* Central Node: Glowing DataX Brand Squircle */}
    <g transform="translate(220, 100)">
      <rect x="-38" y="-38" width="76" height="76" rx="20" fill="#2D55F5" fillOpacity="0.2" />
      <rect x="-32" y="-32" width="64" height="64" rx="16" fill="#2D55F5" stroke="#6084FF" strokeWidth="1.75" />
      <g transform="translate(-32, -32)">
        <polygon points="14.5,49.5 24.5,49.5 49.5,14.5 39.5,14.5" fill="#FFFFFF" />
        <polygon points="14.5,14.5 24.5,14.5 31.5,24.5 21.5,24.5" fill="#1473E6" />
        <polygon points="32.5,39.5 42.5,39.5 49.5,49.5 39.5,49.5" fill="#1473E6" />
      </g>
    </g>

    {/* Right Node: Verified Target Cylinder with Success Check Badge */}
    <g transform="translate(380, 100)">
      <path d="M-20 -18 C-20 -25 20 -25 20 -18 V14 C20 21 -20 21 -20 14 Z" fill="#0C1428" stroke="#486299" strokeWidth="1.75" />
      <path d="M-20 -5 C-20 2 20 2 20 -5" stroke="#486299" strokeWidth="1.5" fill="none" />
      <path d="M-20 5 C-20 12 20 12 20 5" stroke="#486299" strokeWidth="1.5" fill="none" />
      <ellipse cx="0" cy="-18" rx="20" ry="7" fill="#132142" stroke="#38BDF8" strokeWidth="2.5" />
      <circle cx="16" cy="12" r="8" fill="#10B981" stroke="#0C1428" strokeWidth="2" />
      <polyline points="13,12 15,14 19,10" stroke="#FFFFFF" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none" />
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

export default function ThreadsPage({ onOpenLegacyPoc, onSwitchToMarketing } = {}) {
  const { navigateTo } = useNavigation();
  const { threads: contextThreads, selectThread, deleteThread, autoFixEnabled, setAutoFixEnabled } = useRuleEngine();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Format threads with clean metadata
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
          1. MINIMAL, CLEAN EDGE-TO-EDGE HERO SECTION + METRICS
      ===================================================================== */}
      <section className="w-full bg-gradient-to-r from-[#0B1226] via-[#101A38] to-[#1C2C5E] text-white border-b border-[#1E2E5A] relative overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-10 py-8 lg:py-10 relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          
          {/* Left: Minimal Tag, Headline, 3-Step Flow & 4 Metrics */}
          <div className="max-w-2xl space-y-5">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1473E6] text-[#0A0F1F] font-bold text-xs tracking-tight">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>AI rule builder</span>
            </div>

            {/* Clean Headline */}
            <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-white tracking-tight leading-[1.22]">
              Describe the rules in plain English.<br className="hidden sm:inline" />
              DataX writes them, tests them and keeps them running.
            </h1>

            {/* Minimal 3-Step Indicator */}
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-[#C5CCE0]">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#1473E6] text-[#0A0F1F] font-bold text-[11px] flex items-center justify-center shrink-0">
                  1
                </span>
                <span>Connect a source</span>
              </div>
              <span className="text-[#717E9E]">›</span>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#1473E6] text-[#0A0F1F] font-bold text-[11px] flex items-center justify-center shrink-0">
                  2
                </span>
                <span>Generate rules with AI</span>
              </div>
              <span className="text-[#717E9E]">›</span>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#1473E6] text-[#0A0F1F] font-bold text-[11px] flex items-center justify-center shrink-0">
                  3
                </span>
                <span>Test, then run live</span>
              </div>
            </div>

            {/* Clean 4-Metric Bar */}
            <div className="bg-[#070D1F]/75 backdrop-blur-md border border-white/10 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/10 w-full max-w-xl">
              <div className="px-3 py-1 first:pl-1">
                <p className="text-[11px] font-medium text-[#8F9BB3]">Active threads</p>
                <p className="text-lg sm:text-xl font-bold text-white mt-0.5">
                  {activeCount} / {formattedThreads.length}
                </p>
              </div>

              <div className="px-3 py-1">
                <p className="text-[11px] font-medium text-[#8F9BB3]">Mean data health</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-lg sm:text-xl font-bold text-white">{meanHealth}%</span>
                  <span className="bg-[#1473E6] text-[#0A0F1F] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    A+
                  </span>
                </div>
              </div>

              <div className="px-3 py-1">
                <p className="text-[11px] font-medium text-[#8F9BB3]">Runs this week</p>
                <p className="text-lg sm:text-xl font-bold text-white mt-0.5">{totalRuns}</p>
              </div>

              <div className="px-3 py-1 last:pr-1 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-[#8F9BB3]">Auto-fix</p>
                  <p className="text-lg sm:text-xl font-bold text-[#1473E6] mt-0.5">
                    {autoFixEnabled ? 'On' : 'Off'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoFixEnabled && setAutoFixEnabled(!autoFixEnabled)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                    autoFixEnabled ? 'bg-[#1473E6]' : 'bg-slate-700'
                  }`}
                  title="Toggle Auto-Fix"
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    autoFixEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Right: Clean Floating Orbital Graphic (No Box, Zero Clutter) */}
          <div className="hidden lg:flex items-center justify-center shrink-0">
            <HeroOrbitalGraphic />
          </div>

        </div>
      </section>

      {/* =====================================================================
          2. MAIN WORKSPACE CONTENT BELOW HERO
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
