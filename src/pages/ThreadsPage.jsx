import React, { useState, useEffect } from 'react';
import { Link, useNavigation } from '../context/NavigationContext';
import { useRuleEngine } from '../context/RuleEngineContext';
import DataXUserMenu from '../components/common/DataXUserMenu';
import NotificationCenter from '../components/common/NotificationCenter';
import GlobalSearchModal from '../components/common/GlobalSearchModal';
import OnboardingWizard from '../components/common/OnboardingWizard';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';

// --- Figma-Exact Icons & Illustrations with User Brand Logo ---

// User-Provided Official DataX Brand Logo Squircle
export const DataXLogo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className="shrink-0">
    <rect width="64" height="64" rx="16" fill="#2D55F5" />
    <polygon points="14.5,49.5 24.5,49.5 49.5,14.5 39.5,14.5" fill="#FFFFFF" />
    <polygon points="14.5,14.5 24.5,14.5 31.5,24.5 21.5,24.5" fill="#D4FF3A" />
    <polygon points="32.5,39.5 42.5,39.5 49.5,49.5 39.5,49.5" fill="#D4FF3A" />
  </svg>
);

// Figma Hero Banner Illustration
const HeroFigmaGraphic = () => (
  <svg width="440" height="210" viewBox="0 0 440 210" fill="none" className="shrink-0">
    <defs>
      <radialGradient id="heroGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#2D55F5" stopOpacity="0.4" />
        <stop offset="70%" stopColor="#1E378A" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#0B1226" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="orbitBeam" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#D4FF3A" stopOpacity="0.7" />
        <stop offset="50%" stopColor="#2D55F5" />
        <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.7" />
      </linearGradient>
    </defs>

    {/* Ambient Glow */}
    <ellipse cx="220" cy="105" rx="170" ry="85" fill="url(#heroGlow)" />

    {/* Orbital Concentric Wireframe Rings */}
    <ellipse cx="220" cy="105" rx="160" ry="75" stroke="#334B80" strokeWidth="1" strokeDasharray="3 5" opacity="0.5" />
    <ellipse cx="220" cy="105" rx="110" ry="50" stroke="#3D5F9E" strokeWidth="1.25" opacity="0.4" />

    {/* Pipeline Axis Line */}
    <line x1="60" y1="105" x2="380" y2="105" stroke="url(#orbitBeam)" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.7" />

    {/* Orbit Packet Dots */}
    <circle cx="135" cy="72" r="3.5" fill="#D4FF3A" />
    <circle cx="135" cy="72" r="7" fill="#D4FF3A" fillOpacity="0.2" />
    <circle cx="170" cy="105" r="3" fill="#D4FF3A" />
    <circle cx="270" cy="105" r="3" fill="#38BDF8" />
    <circle cx="305" cy="138" r="3.5" fill="#38BDF8" />
    <circle cx="305" cy="138" r="7" fill="#38BDF8" fillOpacity="0.2" />

    {/* Left Node: Wireframe Cylinder with Volt Rim */}
    <g transform="translate(60, 105)">
      <path d="M-20 -18 C-20 -25 20 -25 20 -18 V14 C20 21 -20 21 -20 14 Z" fill="#0C1428" stroke="#486299" strokeWidth="1.75" />
      <path d="M-20 -5 C-20 2 20 2 20 -5" stroke="#486299" strokeWidth="1.5" fill="none" />
      <path d="M-20 5 C-20 12 20 12 20 5" stroke="#486299" strokeWidth="1.5" fill="none" />
      <ellipse cx="0" cy="-18" rx="20" ry="7" fill="#132142" stroke="#D4FF3A" strokeWidth="2.5" />
    </g>

    {/* Central Node: Glowing DataX Squircle matching User Brand Logo */}
    <g transform="translate(220, 105)">
      <rect x="-38" y="-38" width="76" height="76" rx="20" fill="#2D55F5" fillOpacity="0.18" />
      <rect x="-32" y="-32" width="64" height="64" rx="16" fill="#2D55F5" stroke="#6084FF" strokeWidth="1.75" />
      <g transform="translate(-32, -32)">
        <polygon points="14.5,49.5 24.5,49.5 49.5,14.5 39.5,14.5" fill="#FFFFFF" />
        <polygon points="14.5,14.5 24.5,14.5 31.5,24.5 21.5,24.5" fill="#D4FF3A" />
        <polygon points="32.5,39.5 42.5,39.5 49.5,49.5 39.5,49.5" fill="#D4FF3A" />
      </g>
    </g>

    {/* Right Node: Wireframe Cylinder with Blue Rim & Success Check Badge */}
    <g transform="translate(380, 105)">
      <path d="M-20 -18 C-20 -25 20 -25 20 -18 V14 C20 21 -20 21 -20 14 Z" fill="#0C1428" stroke="#486299" strokeWidth="1.75" />
      <path d="M-20 -5 C-20 2 20 2 20 -5" stroke="#486299" strokeWidth="1.5" fill="none" />
      <path d="M-20 5 C-20 12 20 12 20 5" stroke="#486299" strokeWidth="1.5" fill="none" />
      <ellipse cx="0" cy="-18" rx="20" ry="7" fill="#132142" stroke="#38BDF8" strokeWidth="2.5" />
      {/* Success Badge */}
      <circle cx="16" cy="12" r="8" fill="#10B981" stroke="#0C1428" strokeWidth="2" />
      <polyline points="13,12 15,14 19,10" stroke="#FFFFFF" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </g>
  </svg>
);

// Database Cylinders Icon for Cards (SAP BW / Clean Core)
const SapCylinderIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <ellipse cx="14" cy="7" rx="10" ry="3.5" fill="#EEF2FF" stroke="#0A0F1F" strokeWidth="1.75" />
    <path d="M4 7v6c0 1.93 4.48 3.5 10 3.5s10-1.57 10-3.5V7" stroke="#0A0F1F" strokeWidth="1.75" fill="none" />
    <path d="M4 13v6c0 1.93 4.48 3.5 10 3.5s10-1.57 10-3.5v-6" stroke="#0A0F1F" strokeWidth="1.75" fill="none" />
    {/* Green layer pill dots */}
    <circle cx="9" cy="13" r="1.5" fill="#127A52" />
    <circle cx="14" cy="13" r="1.5" fill="#127A52" />
    <circle cx="19" cy="13" r="1.5" fill="#127A52" />
  </svg>
);

// Green Leaf / Layered Logo for Customer Master
const MasterDataIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <polygon points="12 2 2 7 12 12 22 7 12 2" fill="#00ED64" fillOpacity="0.2" stroke="#00A344" strokeWidth="1.75" strokeLinejoin="round" />
    <polyline points="2 12 12 17 22 12" stroke="#00A344" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="2 17 12 22 22 17" stroke="#00A344" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Healthcare Shield / Database Icon
const HealthcareIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L4 5v6.5C4 16.5 7.5 21 12 22c4.5-1 8-5.5 8-10.5V5l-8-3z" fill="#EEF2FF" stroke="#336791" strokeWidth="1.75" strokeLinejoin="round" />
    <line x1="12" y1="8" x2="12" y2="16" stroke="#336791" strokeWidth="2" strokeLinecap="round" />
    <line x1="8" y1="12" x2="16" y2="12" stroke="#336791" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Start Thread Document Icon with Blue Plus Badge
const StartThreadDocIcon = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
    {/* White folded page */}
    <path d="M11 7h15l8 8v20a3 3 0 01-3 3H11a3 3 0 01-3-3V10a3 3 0 013-3z" fill="#FFFFFF" stroke="#0A0F1F" strokeWidth="1.75" strokeLinejoin="round" />
    <path d="M26 7v8h8" stroke="#0A0F1F" strokeWidth="1.75" strokeLinejoin="round" />
    {/* Page text lines */}
    <line x1="14" y1="20" x2="24" y2="20" stroke="#0A0F1F" strokeWidth="2" strokeLinecap="round" />
    <line x1="14" y1="26" x2="28" y2="26" stroke="#0A0F1F" strokeWidth="2" strokeLinecap="round" />
    <line x1="14" y1="32" x2="22" y2="32" stroke="#0A0F1F" strokeWidth="2" strokeLinecap="round" />
    {/* Blue plus circle badge */}
    <circle cx="31" cy="11" r="7" fill="#2D55F5" />
    <line x1="31" y1="8" x2="31" y2="14" stroke="#FFFFFF" strokeWidth="1.75" strokeLinecap="round" />
    <line x1="28" y1="11" x2="34" y2="11" stroke="#FFFFFF" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);

export default function ThreadsPage() {
  const { navigateTo } = useNavigation();
  const { threads: contextThreads, selectThread, deleteThread, autoFixEnabled } = useRuleEngine();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Map icons and ensure consistent card formatting
  const formattedThreads = (contextThreads || []).map(t => {
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

    return {
      id: t.id || t.threadId || 'TH-001',
      name: t.name || 'Enterprise Pipeline',
      source: t.source?.engine ? t.source.engine.toUpperCase() : 'SOURCE',
      target: t.target?.engine ? t.target.engine.toUpperCase() : 'TARGET',
      domain: t.domain || t.category || 'Data Intelligence',
      desc: t.desc || t.description || 'Automated data reconciliation, verification, and transformation.',
      pipeline: t.pipeline || `${t.source?.database || 'source'} → AI rules → ${t.target?.table || 'target'}`,
      runCount,
      hasExecuted,
      status: isHealthy ? 'healthy' : isWarning ? 'warning' : 'draft',
      statusLabel: isLive 
        ? 'Live' 
        : hasExecuted 
          ? (t.healthScore >= 80 ? 'Healthy' : t.healthScore >= 60 ? 'Needs Attention' : 'Below threshold')
          : (runCount === 0 ? 'Draft' : 'Not evaluated'),
      successRate: hasExecuted && t.healthScore !== null && t.healthScore !== undefined ? Number(t.healthScore) : (t.successRate ? Number(t.successRate) : null),
      runs: `${runCount} ${runCount === 1 ? 'run' : 'runs'}`,
      icon
    };
  });

  const evaluatedThreads = formattedThreads.filter(t => t.hasExecuted && t.successRate != null);
  const activeCount = formattedThreads.filter(t => t.hasExecuted && t.status === 'healthy').length;
  const meanHealth = evaluatedThreads.length 
    ? Math.round(evaluatedThreads.reduce((acc, t) => acc + Number(t.successRate), 0) / evaluatedThreads.length * 10) / 10 
    : '—';

  const totalRuns = formattedThreads.reduce((acc, t) => acc + (t.runCount || 0), 0);

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 7;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  const filteredThreads = formattedThreads.filter((t) => {
    if (filter === 'live' && t.status !== 'healthy') return false;
    if (filter === 'draft' && t.status !== 'draft') return false;
    if (
      search.trim() &&
      !t.name.toLowerCase().includes(search.toLowerCase()) &&
      !t.domain.toLowerCase().includes(search.toLowerCase())
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
    <div className="min-h-screen bg-[#F8F9FA] text-[#474E61] font-sans antialiased">
      {/* Top Universal Navbar */}
      <header className="w-full bg-white border-b border-[#E3E6EE] sticky top-0 z-40">
        <div className="max-w-[1360px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-7">
            {/* User Provided Brand Logo */}
            <Link to="threads" className="flex items-center gap-2.5">
              <DataXLogo size={32} />
              <span className="font-bold text-[#0A0F1F] tracking-tight text-[18px]">DataX</span>
            </Link>

            {/* Navigation Pills */}
            <nav className="hidden md:flex items-center gap-1.5">
              <Link
                to="workflows"
                className="px-3.5 py-1.5 text-xs font-semibold rounded-full bg-[#EEF2FF] text-[#2D55F5] flex items-center gap-1.5 transition-all"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                Workflows
              </Link>
              <Link
                to="templates"
                className="px-3.5 py-1.5 text-xs font-medium rounded-full text-[#5F6678] hover:text-[#0A0F1F] hover:bg-[#F5F6FA] flex items-center gap-1.5 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
                Templates
              </Link>
              <Link
                to="connections"
                className="px-3.5 py-1.5 text-xs font-medium rounded-full text-[#5F6678] hover:text-[#0A0F1F] hover:bg-[#F5F6FA] flex items-center gap-1.5 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <rect x="2" y="2" width="6" height="6" rx="1.5" />
                  <rect x="16" y="2" width="6" height="6" rx="1.5" />
                  <rect x="9" y="16" width="6" height="6" rx="1.5" />
                  <path d="M5 8v3a2 2 0 002 2h10a2 2 0 002-2V8" />
                  <path d="M12 13v3" />
                </svg>
                Connections
              </Link>
              <Link
                to="history"
                className="px-3.5 py-1.5 text-xs font-medium rounded-full text-[#5F6678] hover:text-[#0A0F1F] hover:bg-[#F5F6FA] flex items-center gap-1.5 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Runs
              </Link>
              <Link
                to="quarantine"
                className="px-3.5 py-1.5 text-xs font-medium rounded-full text-[#5F6678] hover:text-[#0A0F1F] hover:bg-[#F5F6FA] flex items-center gap-1.5 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Quarantine
              </Link>
              <Link
                to="audit"
                className="px-3.5 py-1.5 text-xs font-medium rounded-full text-[#5F6678] hover:text-[#0A0F1F] hover:bg-[#F5F6FA] flex items-center gap-1.5 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Audit Trail
              </Link>
              <Link
                to="settings"
                className="px-3.5 py-1.5 text-xs font-medium rounded-full text-[#5F6678] hover:text-[#0A0F1F] hover:bg-[#F5F6FA] flex items-center gap-1.5 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
                Settings
              </Link>
              <Link
                to="help"
                className="px-3.5 py-1.5 text-xs font-medium rounded-full text-[#5F6678] hover:text-[#0A0F1F] hover:bg-[#F5F6FA] flex items-center gap-1.5 transition-colors"
              >
                <span className="w-3.5 h-3.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 font-bold flex items-center justify-center text-[10px]">
                  ?
                </span>
                Help
              </Link>
            </nav>
          </div>

          {/* Search, Notifications & Avatar */}
          <div className="flex items-center gap-3">
            <div 
              onClick={() => setSearchModalOpen(true)}
              className="relative hidden sm:flex items-center cursor-pointer"
            >
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E95A9]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                readOnly
                placeholder="Search workflows, tables (⌘K)..."
                className="w-64 pl-9 pr-10 py-1.5 bg-[#F5F6FA] border border-[#E3E6EE] rounded-full text-xs text-[#0A0F1F] placeholder:text-[#8E95A9] hover:bg-slate-100 cursor-pointer transition-all"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#8E95A9] bg-[#E3E6EE] px-1 py-0.5 rounded">
                ⌘K
              </kbd>
            </div>

            {/* Help / Onboarding Icon */}
            <button
              onClick={() => setOnboardingOpen(true)}
              title="First-Run Onboarding Guide"
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#5F6678] hover:text-[#0A0F1F] hover:bg-[#F5F6FA] transition-colors cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.5" />
              </svg>
            </button>

            {/* In-App Notification Center */}
            <NotificationCenter />

            {/* Dynamic Enterprise User Profile Section */}
            <DataXUserMenu />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1360px] mx-auto px-6 py-8 space-y-7">
        {/* Top Header Title & New Workflow Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-bold text-[#0A0F1F] tracking-tight leading-none">Workflows</h1>
            <p className="text-[14px] text-[#5F6678] mt-2 font-normal">
              Each workflow reads from a source, checks every row with rules written by AI, and writes clean rows to a target.
            </p>
          </div>
          <Link to="new-workflow">
            <button className="bg-[#2D55F5] hover:bg-[#2045DC] active:bg-[#1937B0] text-white px-5 py-2.5 rounded-full font-medium text-sm flex items-center gap-1.5 shadow-sm transition-all cursor-pointer">
              <span className="text-base font-bold leading-none">+</span> New workflow
            </button>
          </Link>
        </div>

        {/* Hero Banner: AI Rule Builder */}
        <section className="bg-gradient-to-r from-[#0B1226] via-[#101A38] to-[#1C2C5E] rounded-[24px] p-7 md:p-9 relative overflow-hidden text-white border border-[#1E293B] shadow-sm">
          {/* Right SVG Graphic (Figma Match) */}
          <div className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <HeroFigmaGraphic />
          </div>

          <div className="max-w-2xl relative z-10">
            {/* Tag */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4FF3A] text-[#0A0F1F] font-bold text-xs tracking-tight">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#0A0F1F">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span>AI rule builder</span>
            </div>

            {/* Banner Heading */}
            <h2 className="text-[26px] md:text-[28px] font-bold text-white tracking-tight leading-[1.25] mt-4 max-w-lg">
              Describe the rules in plain English.<br className="hidden sm:inline" />
              DataX writes them, tests them and keeps them running.
            </h2>

            {/* Stepper */}
            <div className="flex flex-wrap items-center gap-3 mt-5 text-xs md:text-sm text-[#C5CCE0]">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#D4FF3A] text-[#0A0F1F] font-bold text-[11px] flex items-center justify-center shrink-0">
                  1
                </span>
                <span>Connect a source</span>
              </div>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#717E9E" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#D4FF3A] text-[#0A0F1F] font-bold text-[11px] flex items-center justify-center shrink-0">
                  2
                </span>
                <span>Generate rules with AI</span>
              </div>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#717E9E" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#D4FF3A] text-[#0A0F1F] font-bold text-[11px] flex items-center justify-center shrink-0">
                  3
                </span>
                <span>Test, then run live</span>
              </div>
            </div>

            {/* Integrated Stats Bar Inside Card */}
            <div className="bg-[#070D1F]/75 backdrop-blur-md border border-white/10 rounded-2xl p-4 mt-7 inline-grid grid-cols-4 divide-x divide-white/10 w-full max-w-xl">
              <div className="px-3 first:pl-1">
                <p className="text-[11px] font-medium text-[#8F9BB3]">Active threads</p>
                <p className="text-[18px] md:text-[20px] font-bold text-white mt-0.5">{activeCount} / {formattedThreads.length}</p>
              </div>
              <div className="px-3">
                <p className="text-[11px] font-medium text-[#8F9BB3]">Mean data health</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[18px] md:text-[20px] font-bold text-white">{meanHealth}%</span>
                  <span className="bg-[#D4FF3A] text-[#0A0F1F] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {meanHealth >= 90 ? 'A+' : meanHealth >= 80 ? 'B+' : 'C'}
                  </span>
                </div>
              </div>
              <div className="px-3">
                <p className="text-[11px] font-medium text-[#8F9BB3]">Runs this week</p>
                <p className="text-[18px] md:text-[20px] font-bold text-white mt-0.5">{totalRuns}</p>
              </div>
              <div className="px-3 last:pr-1">
                <p className="text-[11px] font-medium text-[#8F9BB3]">Auto-fix</p>
                <p className="text-[18px] md:text-[20px] font-bold text-[#D4FF3A] mt-0.5">
                  {autoFixEnabled ? 'On' : 'Off'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Search, Filter Tabs & Count Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div className="relative w-full sm:w-80 lg:w-96">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E95A9]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search workflows by name, system or owner"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#E3E6EE] rounded-xl text-xs sm:text-sm text-[#0A0F1F] placeholder:text-[#9CA3AF] shadow-2xs focus:outline-none focus:border-[#2D55F5] transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Filter Pills */}
            <div className="bg-[#F0F2F6] p-1 rounded-xl inline-flex items-center gap-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  filter === 'all'
                    ? 'bg-white text-[#0A0F1F] shadow-2xs font-semibold'
                    : 'text-[#5F6678] hover:text-[#0A0F1F] font-medium'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('live')}
                className={`px-4 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  filter === 'live'
                    ? 'bg-white text-[#2D55F5] shadow-2xs font-semibold'
                    : 'text-[#5F6678] hover:text-[#0A0F1F] font-medium'
                }`}
              >
                Live
              </button>
              <button
                onClick={() => setFilter('draft')}
                className={`px-4 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  filter === 'draft'
                    ? 'bg-white text-[#0A0F1F] shadow-2xs font-semibold'
                    : 'text-[#5F6678] hover:text-[#0A0F1F] font-medium'
                }`}
              >
                Draft
              </button>
            </div>

            <span className="text-xs text-[#9CA3AF] font-medium ml-2">
              {filteredThreads.length} of {formattedThreads.length} workflows
            </span>
          </div>
        </div>

        {/* 4-Column Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {pagedThreads.map((thread) => (
            <div
              key={thread.id}
              className="bg-white rounded-[22px] border border-[#E3E6EE] p-5 lg:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-[12px] bg-[#EEF2FF] flex items-center justify-center shrink-0">
                    {thread.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-[#5F6678]">{thread.domain}</p>
                    <h3 className="text-[14px] font-bold text-[#0A0F1F] tracking-tight leading-snug truncate">
                      {thread.name}
                    </h3>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[12px] lg:text-[13px] text-[#5F6678] leading-relaxed mt-3.5 line-clamp-2">
                  {thread.desc}
                </p>

                {/* Pipeline Code Tag */}
                <div className="mt-3.5 inline-flex items-center px-2.5 py-1 rounded-[6px] bg-[#F5F6FA] border border-[#E3E6EE] text-[11px] font-mono text-[#474E61] max-w-full truncate">
                  {thread.pipeline}
                </div>
              </div>

              {/* Progress & Bottom Info */}
              <div className="mt-5 pt-3">
                {/* Health Metric & Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#5F6678] font-normal">Health</span>
                    {thread.hasExecuted && thread.successRate != null ? (
                      <span className="text-[#0A0F1F] font-semibold">{thread.successRate}%</span>
                    ) : (
                      <span className="text-[#8E95A9] font-medium text-[11px]">— Not evaluated</span>
                    )}
                  </div>
                  <div className="w-full h-1.5 bg-[#E3E6EE] rounded-full overflow-hidden">
                    {thread.hasExecuted && thread.successRate != null ? (
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          thread.status === 'warning' ? 'bg-[#D97706]' : 'bg-[#2D55F5]'
                        }`}
                        style={{ width: `${Math.min(100, thread.successRate)}%` }}
                      />
                    ) : (
                      <div className="h-full rounded-full bg-slate-200" style={{ width: '0%' }} />
                    )}
                  </div>
                </div>

                {/* Status Badge & Open Button */}
                <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#F2F4F7]">
                  <div className="flex items-center gap-1.5">
                    {thread.hasExecuted ? (
                      thread.status === 'warning' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFF4E3] text-[#A35600] text-[11px] font-medium border border-[#F7D9AE]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#A35600]" />
                          {thread.statusLabel}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E7F6EE] text-[#127A52] text-[11px] font-medium border border-[#BFE6D2]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#127A52]" />
                          {thread.statusLabel}
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#5F6678] text-[11px] font-medium border border-[#E5E7EB]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF]" />
                        {thread.statusLabel}
                      </span>
                    )}
                    <span className="text-[11px] text-[#5F6678] ml-1">{thread.runs}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => setThreadToDelete(thread)}
                      className="p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete Workflow"
                      aria-label="Delete Workflow"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => {
                        selectThread(thread.id);
                        navigateTo('canvas');
                      }}
                      className="px-4 py-1 rounded-full border border-[#CDD2DE] bg-white hover:bg-[#EEF2FF] hover:border-[#2D55F5] hover:text-[#2D55F5] text-xs font-semibold text-[#0A0F1F] transition-all cursor-pointer shadow-2xs"
                    >
                      Open Canvas
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Card 4: Start a New Flow (Dashed Border Card) */}
          <Link
            to="canvas"
            className="border-2 border-dashed border-[#CDD2DE] hover:border-[#2D55F5] rounded-[22px] bg-white/40 hover:bg-white/80 p-5 lg:p-6 flex flex-col items-center justify-center text-center group cursor-pointer transition-all min-h-[300px]"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#EEF2FF] group-hover:bg-[#E0E7FF] flex items-center justify-center transition-colors">
              <StartThreadDocIcon />
            </div>
            <h3 className="text-[15px] font-bold text-[#0A0F1F] mt-4">Start a new flow</h3>
            <p className="text-[12px] text-[#5F6678] mt-1">Interactive node canvas studio</p>
            <button className="mt-5 px-4 py-1.5 rounded-full border border-[#CDD2DE] group-hover:border-[#2D55F5] group-hover:text-[#2D55F5] bg-white text-[#2D55F5] text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all pointer-events-none">
              <span className="font-bold text-sm leading-none">+</span> Open Canvas
            </button>
          </Link>
        </section>

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
      </main>

      {/* Global Command Modals & Dialogs */}
      <GlobalSearchModal 
        isOpen={searchModalOpen} 
        onClose={() => setSearchModalOpen(false)} 
      />
      <OnboardingWizard 
        isOpen={onboardingOpen} 
        onClose={() => setOnboardingOpen(false)} 
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
    </div>
  );
}
