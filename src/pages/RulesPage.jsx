import React, { useState, useEffect } from 'react';
import { Link, useNavigation } from '../context/NavigationContext';
import { useRuleEngine } from '../context/RuleEngineContext';

// --- Figma-Exact Icons ---

// User-Provided Official DataX Logo Squircle
const DataXLogo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className="shrink-0">
    <rect width="64" height="64" rx="16" fill="#2D55F5" />
    <polygon points="14.5,49.5 24.5,49.5 49.5,14.5 39.5,14.5" fill="#FFFFFF" />
    <polygon points="14.5,14.5 24.5,14.5 31.5,24.5 21.5,24.5" fill="#D4FF3A" />
    <polygon points="32.5,39.5 42.5,39.5 49.5,49.5 39.5,49.5" fill="#D4FF3A" />
  </svg>
);

// Database Cylinder Icon (Source)
const DatabaseCylinderIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);

// AI Sparkles Icon (AI Rules)
const AiSparkleIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.64 5.64l2.12 2.12M16.24 16.24l2.12 2.12M5.64 18.36l2.12-2.12M16.24 7.76l2.12-2.12" />
  </svg>
);

// Target Database Icon with Checkmark
const TargetDatabaseIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 6c0-1.66 3.58-3 8-3s8 1.34 8 3v12c0 1.66-3.58 3-8 3s-8-1.34-8-3V6z" />
    <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
    <circle cx="17" cy="17" r="4.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
    <path d="m15.5 17 1 1 2-2" stroke="#FFFFFF" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Document with Sparkle Badge Icon
const DocSparkleBadge = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

// Center Writing Illustration (Figma Exact)
const WritingRulesGraphic = () => (
  <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
    {/* Concentric dotted ambient ring */}
    <div className="absolute inset-0 rounded-full border border-dashed border-[#CDD2DE] animate-spin-slow opacity-60" />
    
    {/* Sheet of Paper */}
    <div className="w-16 h-20 bg-white rounded-xl border border-[#CDD2DE] shadow-sm flex flex-col justify-between p-2.5 relative z-10">
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full border border-[#2D55F5]" />
          <div className="h-1.5 w-7 bg-[#EEF2FF] rounded-full" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full border border-[#10B981]" />
          <div className="h-1.5 w-6 bg-[#E7F6EE] rounded-full" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full border border-[#F59E0B]" />
          <div className="h-1.5 w-5 bg-[#FEF3C7] rounded-full" />
        </div>
      </div>
    </div>

    {/* Sparkle badge in blue squircle with yellow cross/star */}
    <div className="absolute -top-1 -right-1 w-9 h-9 rounded-full bg-[#2D55F5] border-2 border-white shadow-md flex items-center justify-center z-20">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#D4FF3A">
        <polygon points="12 2 15 9 22 12 15 15 12 22 9 15 2 12 9 9" />
      </svg>
    </div>
  </div>
);

export default function RulesPage() {
  const { navigateTo } = useNavigation();

  // Screen Mode: 'generating' (Screen 4) or 'generated' (Screen 5)
  const [screenMode, setScreenMode] = useState('generated');
  const [progressWidth, setProgressWidth] = useState(100);
  const [activeTab, setActiveTab] = useState('generate'); // 'generate' | 'sandbox'
  const [toastMessage, setToastMessage] = useState('');

  // Top Subheader state
  const [saveStatus, setSaveStatus] = useState('saved just now');

  // Columns to Check
  const [columns, setColumns] = useState([
    'id', 'email', 'full_name', 'role', 'status', 'created_at', 'total_rows'
  ]);

  // Describe the rules prompt
  const [promptText, setPromptText] = useState(
    'Every user needs a valid email and a full name. Role must be admin, analyst, manager or viewer. Status must be active or inactive. No two users can share an id.'
  );

  // Generated Rules List (Figma Exact)
  const [rules, setRules] = useState([
    {
      id: 'rule-1',
      title: 'Email has a valid format',
      column: 'email',
      severity: 'Critical',
      code: 'REGEX_MATCH(email, EMAIL_RFC_5322)',
      selected: true,
    },
    {
      id: 'rule-2',
      title: 'Full name is required',
      column: 'full_name',
      severity: 'Critical',
      code: 'full_name IS NOT NULL AND LENGTH(TRIM(full_name)) > 1',
      selected: true,
    },
    {
      id: 'rule-3',
      title: 'Role is an allowed value',
      column: 'role',
      severity: 'Warning',
      code: "LOWER(role) IN ('admin', 'analyst', 'manager', 'viewer')",
      selected: true,
    },
    {
      id: 'rule-4',
      title: 'Status is active or inactive',
      column: 'status',
      severity: 'Warning',
      code: "status IN ('active', 'inactive')",
      selected: true,
    },
    {
      id: 'rule-5',
      title: 'User id is unique',
      column: 'id',
      severity: 'Critical',
      code: 'COUNT(id) = COUNT(DISTINCT id)',
      selected: true,
    },
    {
      id: 'rule-6',
      title: 'Created date is valid ISO',
      column: 'created_at',
      severity: 'Warning',
      code: "IS_DATE(created_at, 'YYYY-MM-DD')",
      selected: false,
    },
  ]);

  // Add Custom Rule Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRuleTitle, setNewRuleTitle] = useState('');
  const [newRuleCol, setNewRuleCol] = useState('email');
  const [newRuleSeverity, setNewRuleSeverity] = useState('Warning');
  const [newRuleCode, setNewRuleCode] = useState('');

  // Editing Rule State
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  // Simulate Initial Generation: Screen 4 -> Screen 5
  useEffect(() => {
    let p = 25;
    const interval = setInterval(() => {
      p += 25;
      if (p <= 100) {
        setProgressWidth(p);
      }
    }, 300);

    const timer = setTimeout(() => {
      setScreenMode('generated');
    }, 1400);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  // Trigger Regenerate Rules
  const handleRegenerate = () => {
    setScreenMode('generating');
    setProgressWidth(20);
    let p = 20;
    const interval = setInterval(() => {
      p += 30;
      if (p <= 100) {
        setProgressWidth(p);
      }
    }, 280);

    setTimeout(() => {
      clearInterval(interval);
      setScreenMode('generated');
      showToast('AI regenerated 6 rules from description!');
    }, 1200);
  };

  // Toggle Rule Selection
  const handleToggleRule = (id) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  };

  // Toggle Master Selection
  const selectedCount = rules.filter((r) => r.selected).length;
  const handleToggleAll = () => {
    const allSelected = selectedCount === rules.length;
    setRules((prev) => prev.map((r) => ({ ...r, selected: !allSelected })));
  };

  // Delete Rule
  const handleDeleteRule = (id) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
    showToast('Rule removed');
  };

  // Add Rule Submission
  const handleAddRule = (e) => {
    e.preventDefault();
    if (!newRuleTitle.trim()) return;
    const newR = {
      id: `rule-${Date.now()}`,
      title: newRuleTitle.trim(),
      column: newRuleCol,
      severity: newRuleSeverity,
      code: newRuleCode.trim() || `${newRuleCol} IS NOT NULL`,
      selected: true,
    };
    setRules((prev) => [...prev, newR]);
    setNewRuleTitle('');
    setNewRuleCode('');
    setShowAddModal(false);
    showToast('Custom rule added!');
  };

  // Save Rule Title Edit
  const handleSaveEdit = (id) => {
    if (!editTitle.trim()) return;
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, title: editTitle.trim() } : r))
    );
    setEditingRuleId(null);
    showToast('Rule updated');
  };

  // Remove Column Pill
  const handleRemoveColumn = (colToRemove) => {
    if (columns.length === 1) return;
    setColumns((prev) => prev.filter((c) => c !== colToRemove));
  };

  // Restore All Columns
  const handleRestoreColumns = () => {
    setColumns(['id', 'email', 'full_name', 'role', 'status', 'created_at', 'total_rows']);
    showToast('Restored 7 auto-detected columns');
  };

  // Append Quick Prompt Pill to Textarea
  const handleAddQuickPrompt = (snippet) => {
    setPromptText((prev) => `${prev.trim()} ${snippet}.`);
  };

  // Toast Helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Save Thread Action
  const handleSaveThread = () => {
    setSaveStatus('saving...');
    setTimeout(() => {
      setSaveStatus('saved just now');
      showToast('Thread configuration saved!');
    }, 400);
  };

  // Save Rules and Advance to Step 3: Target System
  const handleSaveRules = () => {
    showToast('AI rules saved successfully!');
    setTimeout(() => {
      navigateTo('connect-target');
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#474E61] font-sans antialiased flex flex-col justify-between relative selection:bg-[#2D55F5]/15 selection:text-[#2D55F5]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-6 z-50 bg-[#0A0F1F] text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg border border-white/10 flex items-center gap-2 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-[#D4FF3A]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Universal Top Navbar (Figma Exact) */}
      <header className="w-full bg-white border-b border-[#E3E6EE] sticky top-0 z-40">
        <div className="max-w-[1360px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-7">
            {/* Logo */}
            <Link to="threads" className="flex items-center gap-2.5">
              <DataXLogo size={32} />
              <span className="font-bold text-[#0A0F1F] tracking-tight text-[18px]">DataX</span>
            </Link>

            {/* Nav Pills */}
            <nav className="hidden md:flex items-center gap-1.5">
              <Link
                to="threads"
                className="px-3.5 py-1.5 text-xs font-semibold rounded-full bg-[#EEF2FF] text-[#2D55F5] flex items-center gap-1.5 transition-all"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                Threads
              </Link>
              <Link
                to="new-thread"
                className="px-3.5 py-1.5 text-xs font-medium rounded-full text-[#5F6678] hover:text-[#0A0F1F] hover:bg-[#F5F6FA] flex items-center gap-1.5 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
                Domain packs
              </Link>
              <Link
                to="connect-source"
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
            </nav>
          </div>

          {/* Right: Search, Notifications & Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E95A9]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search threads, tables…"
                className="w-64 pl-9 pr-3.5 py-1.5 bg-[#F5F6FA] border border-[#E3E6EE] rounded-full text-xs text-[#0A0F1F] placeholder:text-[#8E95A9] focus:outline-none focus:border-[#2D55F5] focus:bg-white transition-all"
              />
            </div>

            <button
              onClick={() => showToast('AI Rule Engine: Describe your validation rules in plain English.')}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#5F6678] hover:text-[#0A0F1F] hover:bg-[#F5F6FA] transition-colors cursor-pointer"
              title="Help"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.5" />
              </svg>
            </button>

            <button
              onClick={() => showToast('No unread notifications.')}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#5F6678] hover:text-[#0A0F1F] hover:bg-[#F5F6FA] transition-colors cursor-pointer"
              title="Notifications"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>

            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#D1D5DB] shrink-0 bg-slate-200">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80"
                alt="User Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentNode.innerHTML = '<div class="w-full h-full bg-[#2D55F5] text-white flex items-center justify-center text-xs font-bold">DX</div>';
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* 2. Thread Sub-header Bar (Figma Exact) */}
      <div className="w-full bg-white border-b border-[#E3E6EE] px-6 py-3">
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="connect-source"
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-[#E3E6EE] hover:bg-[#F5F6FA] text-[#474E61] transition-colors cursor-pointer"
              title="Back"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-[18px] font-bold text-[#0A0F1F] tracking-tight leading-tight">
                  User records clean-up
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EDEFF5] text-[#5F6678] text-[11px] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8E95A9]" /> Draft
                </span>
              </div>
              <p className="text-[11px] text-[#5F6678] mt-0.5">
                production_db → reconciled_db · {saveStatus}
              </p>
            </div>
          </div>

          {/* Action Buttons: Save, Dry run, Run live */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveThread}
              className="px-3.5 py-1.5 rounded-full border border-[#CDD2DE] bg-white hover:bg-[#F5F6FA] active:bg-[#EBEFF5] text-xs font-semibold text-[#0A0F1F] flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Save
            </button>
            <button
              onClick={() => navigateTo('running-dry-run')}
              className="px-3.5 py-1.5 rounded-full border border-[#CDD2DE] bg-white hover:bg-[#F5F6FA] active:bg-[#EBEFF5] text-xs font-semibold text-[#0A0F1F] flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" />
                <line x1="8.5" y1="2" x2="15.5" y2="2" />
                <line x1="7" y1="16" x2="17" y2="16" />
              </svg>
              Dry run
            </button>
            <button
              onClick={() => navigateTo('live-auto-fix')}
              className="px-3.5 py-1.5 rounded-full border border-[#CDD2DE] bg-white hover:bg-[#F5F6FA] active:bg-[#EBEFF5] text-xs font-semibold text-[#0A0F1F] flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Run live
            </button>
          </div>
        </div>
      </div>

      {/* 3. 3-Step Stepper Cards (Figma Exact Match) */}
      <section className="max-w-[1360px] w-full mx-auto px-6 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Card 1: Source (Ready) */}
          <Link
            to="connect-source"
            className="border border-[#CDD2DE] hover:border-[#2D55F5] rounded-[18px] p-4 bg-white flex items-center justify-between transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-6 h-6 rounded-full bg-[#0A0F1F] text-white text-xs font-bold flex items-center justify-center shrink-0">
                1
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#F5F6FA] border border-[#E3E6EE] group-hover:bg-[#EEF2FF] group-hover:border-[#DCE4FF] flex items-center justify-center text-[#5F6678] group-hover:text-[#2D55F5] shrink-0 transition-colors">
                <DatabaseCylinderIcon size={20} />
              </div>
              <div>
                <span className="text-[11px] font-medium text-[#5F6678] block leading-none">Source</span>
                <span className="text-sm font-bold text-[#0A0F1F] block mt-1 leading-tight">production_db</span>
                <span className="text-[11px] text-[#5F6678] block mt-0.5 leading-none">raw_source_users</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E7F6EE] text-[#127A52] text-[11px] font-semibold border border-[#BFE6D2]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#127A52]" />
              Ready
            </span>
          </Link>

          {/* Card 2: AI Rules (Active - Setting up) */}
          <div className="border-2 border-[#2D55F5] rounded-[18px] p-4 bg-white shadow-xs flex items-center justify-between transition-all">
            <div className="flex items-center gap-3.5">
              <div className="w-6 h-6 rounded-full bg-[#0A0F1F] text-white text-xs font-bold flex items-center justify-center shrink-0">
                2
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] border border-[#DCE4FF] flex items-center justify-center text-[#2D55F5] shrink-0">
                <AiSparkleIcon size={20} />
              </div>
              <div>
                <span className="text-[11px] font-medium text-[#5F6678] block leading-none">AI rules</span>
                <span className="text-sm font-bold text-[#0A0F1F] block mt-1 leading-tight">AI rule generator</span>
                <span className="text-[11px] text-[#5F6678] block mt-0.5 leading-none">Describe it, AI writes it</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EEF2FF] text-[#2D55F5] text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2D55F5]" />
              Setting up
            </span>
          </div>

          {/* Card 3: Target (To Do) */}
          <Link
            to="connect-target"
            className="border border-dashed border-[#CDD2DE] hover:border-[#2D55F5] rounded-[18px] p-4 bg-white/60 hover:bg-white flex items-center justify-between transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-6 h-6 rounded-full border border-[#CDD2DE] group-hover:border-[#2D55F5] text-[#5F6678] group-hover:text-[#2D55F5] text-xs font-semibold flex items-center justify-center shrink-0">
                3
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#F5F6FA] border border-[#E3E6EE] group-hover:bg-[#EEF2FF] group-hover:border-[#DCE4FF] flex items-center justify-center text-[#5F6678] group-hover:text-[#2D55F5] shrink-0 transition-colors">
                <TargetDatabaseIcon size={20} />
              </div>
              <div>
                <span className="text-[11px] font-medium text-[#5F6678] block leading-none">Target</span>
                <span className="text-sm font-bold text-[#0A0F1F] block mt-1 leading-tight">Choose a target</span>
                <span className="text-[11px] text-[#5F6678] block mt-0.5 leading-none">Where clean rows go</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F0F2F6] text-[#5F6678] text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8E95A9]" />
              To do
            </span>
          </Link>
        </div>
      </section>

      {/* 4. Main White Container (Create rules with AI) */}
      <main className="max-w-[1360px] w-full mx-auto px-6 py-6 flex-1">
        <div className="bg-white border border-[#E3E6EE] rounded-[24px] p-6 md:p-7 shadow-sm">
          {/* Header Inside Card */}
          <div className="flex items-center gap-3.5 pb-4">
            <div className="w-11 h-11 rounded-[14px] bg-[#EEF2FF] border border-[#DCE4FF] flex items-center justify-center text-[#2D55F5] shrink-0">
              <DocSparkleBadge />
            </div>
            <div>
              <span className="text-xs text-[#5F6678] font-medium block">Step 2 of 3 · AI rules</span>
              <h2 className="text-[20px] font-bold text-[#0A0F1F] tracking-tight leading-tight mt-0.5">
                Create rules with AI
              </h2>
            </div>
          </div>

          {/* Top Tabs: Generate rules vs Test in sandbox */}
          <div className="flex items-center gap-6 border-b border-[#E3E6EE] pt-1">
            <button
              type="button"
              onClick={() => setActiveTab('generate')}
              className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'generate'
                  ? 'border-[#2D55F5] text-[#2D55F5]'
                  : 'border-transparent text-[#5F6678] hover:text-[#0A0F1F]'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 15 9 22 12 15 15 12 22 9 15 2 12 9 9" />
              </svg>
              Generate rules
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('sandbox');
                showToast('Switching to sandbox test evaluation...');
              }}
              className={`pb-3 text-xs font-medium flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'sandbox'
                  ? 'border-[#2D55F5] text-[#2D55F5] font-semibold'
                  : 'border-transparent text-[#5F6678] hover:text-[#0A0F1F]'
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" />
                <line x1="8.5" y1="2" x2="15.5" y2="2" />
              </svg>
              <span>Test in sandbox</span>
              <span className="px-1.5 py-0.5 rounded-full bg-[#F0F2F6] text-[10px] text-[#5F6678] font-mono">
                20 rows
              </span>
            </button>
          </div>

          {/* Two-Column Grid: Form Left, Preview/Results Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 items-start">
            {/* Left Column (5 cols, Form) */}
            <div className="lg:col-span-5 lg:border-r lg:border-[#E3E6EE] lg:pr-8 space-y-5">
              {/* Input table */}
              <div>
                <label className="block text-xs font-semibold text-[#0A0F1F] mb-1.5">Input table</label>
                <div className="w-full h-10 px-3 bg-white border border-[#CDD2DE] rounded-xl flex items-center justify-between text-xs text-[#0A0F1F] font-mono font-semibold">
                  <div className="flex items-center gap-2">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5F6678" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M3 9h18M3 15h18M9 3v18" />
                    </svg>
                    <span>raw_source_users · production_db</span>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>

              {/* Columns to check */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs font-semibold text-[#0A0F1F]">Columns to check</label>
                    <span className="px-1.5 py-0.5 rounded-full bg-[#F0F2F6] text-[10px] text-[#5F6678] font-bold">
                      {columns.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRestoreColumns}
                    className="text-xs font-medium text-[#2D55F5] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="23 4 23 10 17 10" />
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                    Auto-detected
                  </button>
                </div>

                {/* Column Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {columns.map((col) => (
                    <span
                      key={col}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#CDD2DE] rounded-full text-xs font-mono text-[#0A0F1F] shadow-2xs hover:border-[#2D55F5] transition-all"
                    >
                      {col}
                      <button
                        type="button"
                        onClick={() => handleRemoveColumn(col)}
                        className="text-[#8E95A9] hover:text-[#DC2626] font-bold text-xs cursor-pointer leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Describe the rules */}
              <div>
                <label className="block text-xs font-semibold text-[#0A0F1F] mb-1.5">Describe the rules</label>
                
                {/* Quick Snippet Pills */}
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {[
                    { label: '+ Missing values', text: 'Check for missing or empty values' },
                    { label: '+ Duplicates', text: 'Ensure uniqueness without duplicates' },
                    { label: '+ Format checks', text: 'Verify email and string format consistency' },
                    { label: '+ Allowed values', text: 'Enforce allowed enum values' },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => handleAddQuickPrompt(chip.text)}
                      className="px-2.5 py-1 rounded-full bg-[#F0F2F6] hover:bg-[#EEF2FF] hover:text-[#2D55F5] border border-[#E3E6EE] hover:border-[#DCE4FF] text-xs font-medium text-[#474E61] transition-all cursor-pointer"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Prompt Textarea */}
                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  rows={4}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#CDD2DE] rounded-xl text-xs sm:text-sm text-[#0A0F1F] focus:outline-none focus:border-[#2D55F5] focus:ring-2 focus:ring-[#2D55F5]/15 transition-all resize-none leading-relaxed"
                />

                {/* Regenerate Action Button */}
                <div className="mt-3">
                  {screenMode === 'generating' ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-2.5 px-4 rounded-full bg-[#2D55F5] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-sm cursor-wait"
                    >
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Generating rules...
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRegenerate}
                      className="w-full py-2.5 px-4 rounded-full bg-[#2D55F5] hover:bg-[#2045DC] active:bg-[#1937B0] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12 2 15 9 22 12 15 15 12 22 9 15 2 12 9 9" />
                      </svg>
                      Regenerate rules
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column (7 cols): State 1 (Writing) OR State 2 (Generated rules) */}
            <div className="lg:col-span-7">
              {screenMode === 'generating' ? (
                /* SCREEN 4: Writing your rules... */
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <WritingRulesGraphic />
                  
                  <h3 className="text-[19px] font-bold text-[#0A0F1F] tracking-tight mt-5">
                    Writing your rules...
                  </h3>
                  <p className="text-xs text-[#5F6678] mt-1 max-w-sm">
                    DataX is turning your description into checks for each column.
                  </p>

                  {/* Progress Line */}
                  <div className="w-64 h-1.5 bg-[#EEF2FF] rounded-full overflow-hidden mt-5">
                    <div
                      className="h-full bg-[#2D55F5] rounded-full transition-all duration-300"
                      style={{ width: `${progressWidth}%` }}
                    />
                  </div>

                  {/* Skeleton Placeholders */}
                  <div className="w-full max-w-md mt-8 space-y-3">
                    <div className="p-3.5 rounded-xl border border-[#E3E6EE] bg-[#F9FAFC] animate-pulse space-y-2">
                      <div className="h-3 w-40 bg-[#E3E6EE] rounded-full" />
                      <div className="h-2.5 w-64 bg-[#F0F2F6] rounded-full" />
                    </div>
                    <div className="p-3.5 rounded-xl border border-[#E3E6EE] bg-[#F9FAFC] animate-pulse space-y-2">
                      <div className="h-3 w-48 bg-[#E3E6EE] rounded-full" />
                      <div className="h-2.5 w-72 bg-[#F0F2F6] rounded-full" />
                    </div>
                  </div>
                </div>
              ) : (
                /* SCREEN 5: Generated rules (6) */
                <div className="space-y-4">
                  {/* Generated rules top toolbar */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#F0F2F6]">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-[#0A0F1F]">Generated rules</h3>
                      <span className="px-2 py-0.5 rounded-full bg-[#F0F2F6] text-xs font-bold text-[#0A0F1F]">
                        {rules.length}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAddModal(true)}
                      className="px-3 py-1.5 rounded-full border border-[#CDD2DE] bg-white hover:bg-[#F5F6FA] text-xs font-semibold text-[#0A0F1F] flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                    >
                      <span className="text-sm font-bold leading-none">+</span> Add rule
                    </button>
                  </div>

                  {/* Selection counter & notice */}
                  <div className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleToggleAll}
                        className={`w-4 h-4 rounded flex items-center justify-center transition-all cursor-pointer ${
                          selectedCount === rules.length ? 'bg-[#2D55F5] text-white' : 'border border-[#CDD2DE] bg-white'
                        }`}
                      >
                        {selectedCount > 0 && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                      <span className="font-semibold text-[#0A0F1F]">
                        {selectedCount} of {rules.length} selected
                      </span>
                    </div>
                    <span className="text-[#8E95A9]">Uncheck any rule you don't need.</span>
                  </div>

                  {/* Rules Cards List */}
                  <div className="space-y-2.5">
                    {rules.map((rule) => {
                      const isEditing = editingRuleId === rule.id;

                      return (
                        <div
                          key={rule.id}
                          className={`p-3.5 rounded-[16px] border transition-all ${
                            rule.selected
                              ? 'bg-white border-[#CDD2DE] shadow-2xs hover:border-[#2D55F5]'
                              : 'bg-[#F9FAFC] border-[#E3E6EE] opacity-75'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              {/* Checkbox */}
                              <button
                                type="button"
                                onClick={() => handleToggleRule(rule.id)}
                                className={`w-4 h-4 rounded mt-0.5 shrink-0 flex items-center justify-center transition-all cursor-pointer ${
                                  rule.selected ? 'bg-[#2D55F5] text-white' : 'border border-[#CDD2DE] bg-white'
                                }`}
                              >
                                {rule.selected && (
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </button>

                              {/* Rule Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  {isEditing ? (
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        className="text-xs font-semibold px-2 py-0.5 border border-[#2D55F5] rounded-md"
                                      />
                                      <button
                                        onClick={() => handleSaveEdit(rule.id)}
                                        className="text-[11px] font-bold text-[#2D55F5] hover:underline"
                                      >
                                        Save
                                      </button>
                                    </div>
                                  ) : (
                                    <h4 className="text-xs sm:text-[13px] font-bold text-[#0A0F1F] leading-snug">
                                      {rule.title}
                                    </h4>
                                  )}

                                  {/* Column Tag */}
                                  <span className="px-2 py-0.5 rounded-md bg-[#F0F2F6] border border-[#E3E6EE] text-[10px] font-mono font-medium text-[#474E61]">
                                    {rule.column}
                                  </span>

                                  {/* Severity Badge */}
                                  {rule.severity === 'Critical' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] text-[10px] font-bold">
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                      </svg>
                                      Critical
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] text-[10px] font-bold">
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                      </svg>
                                      Warning
                                    </span>
                                  )}
                                </div>

                                {/* Monospace Code String */}
                                <div className="mt-1 text-xs font-mono text-[#5F6678] bg-[#F8F9FA] px-2.5 py-1.5 rounded-lg border border-[#E3E6EE] truncate">
                                  {rule.code}
                                </div>
                              </div>
                            </div>

                            {/* Actions: View, Edit, Delete */}
                            <div className="flex items-center gap-1 shrink-0 text-[#8E95A9]">
                              <button
                                type="button"
                                onClick={() => showToast(`Previewing ${rule.title}`)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#F0F2F6] hover:text-[#0A0F1F] transition-colors cursor-pointer"
                                title="Inspect Rule"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRuleId(rule.id);
                                  setEditTitle(rule.title);
                                }}
                                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#F0F2F6] hover:text-[#0A0F1F] transition-colors cursor-pointer"
                                title="Edit Title"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                                </svg>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteRule(rule.id)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#FEE2E2] hover:text-[#DC2626] transition-colors cursor-pointer"
                                title="Delete Rule"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 5. Bottom Sticky Action Bar (Figma Exact) */}
      <footer className="w-full bg-white border-t border-[#E3E6EE] px-6 py-3.5 sticky bottom-0 z-30 shadow-xs">
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#5F6678] font-medium">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>Critical rules send failing rows to quarantine. Warning rules are fixed automatically when possible.</span>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => {
                showToast('Running sandbox test against 20 rows...');
                setTimeout(() => navigateTo('running-dry-run'), 400);
              }}
              className="px-4 py-2 rounded-full border border-[#CDD2DE] bg-white hover:bg-[#F5F6FA] active:bg-[#EBEFF5] text-xs font-semibold text-[#0A0F1F] flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" />
                <line x1="8.5" y1="2" x2="15.5" y2="2" />
              </svg>
              Test in sandbox
            </button>

            <button
              type="button"
              onClick={handleSaveRules}
              className="px-5 py-2 rounded-full bg-[#2D55F5] hover:bg-[#2045DC] active:bg-[#1937B0] text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Save rules
            </button>
          </div>
        </div>
      </footer>

      {/* Add Custom Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#0A0F1F]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleAddRule} className="bg-white border border-[#E3E6EE] rounded-[22px] max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F2F6]">
              <h3 className="text-base font-bold text-[#0A0F1F]">Add Custom Rule</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[#8E95A9] hover:bg-[#F0F2F6] text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#0A0F1F] mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ensure email is lowercase"
                  value={newRuleTitle}
                  onChange={(e) => setNewRuleTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CDD2DE] rounded-xl text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0A0F1F] mb-1">Target Column</label>
                  <select
                    value={newRuleCol}
                    onChange={(e) => setNewRuleCol(e.target.value)}
                    className="w-full px-3 py-2 border border-[#CDD2DE] rounded-xl text-xs font-mono font-medium"
                  >
                    {columns.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0A0F1F] mb-1">Severity</label>
                  <select
                    value={newRuleSeverity}
                    onChange={(e) => setNewRuleSeverity(e.target.value)}
                    className="w-full px-3 py-2 border border-[#CDD2DE] rounded-xl text-xs font-medium"
                  >
                    <option value="Critical">Critical (Quarantine)</option>
                    <option value="Warning">Warning (Auto-Fix)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0A0F1F] mb-1">Validation Expression</label>
                <input
                  type="text"
                  placeholder="e.g. email == LOWER(email)"
                  value={newRuleCode}
                  onChange={(e) => setNewRuleCode(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CDD2DE] rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0F2F6]">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#5F6678] hover:text-[#0A0F1F]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-full bg-[#2D55F5] text-white text-xs font-semibold shadow-xs"
              >
                Add Rule
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
