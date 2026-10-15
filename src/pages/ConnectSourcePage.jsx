import React, { useState, useMemo } from 'react';
import { Link, useNavigation } from '../context/NavigationContext';
import { useRuleEngine } from '../context/RuleEngineContext';
import { PostgresLogo, MongoLogo, SnowflakeLogo, SapLogo } from '../components/icons/DatabaseLogos';

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

// Table Grid Icon
const TableGridIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5F6678" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
  </svg>
);

export default function ConnectSourcePage() {
  const { navigateTo } = useNavigation();

  // Thread Title State
  const [threadTitle, setThreadTitle] = useState('User records clean-up');
  const [saveStatus, setSaveStatus] = useState('saved just now');
  const [toastMessage, setToastMessage] = useState('');

  // Source Connection Form States
  const [databaseType, setDatabaseType] = useState('PostgreSQL');
  const [dbDropdownOpen, setDbDropdownOpen] = useState(false);
  const [connectMethod, setConnectMethod] = useState('connection_string'); // 'connection_string' | 'host_port'
  const [connectionString, setConnectionString] = useState('postgres://reader:••••••@db.acme.io/production_db');
  const [showPassword, setShowPassword] = useState(false);
  const [testState, setTestState] = useState('connected'); // 'connected' | 'testing'
  const [testedAt, setTestedAt] = useState('12:28');
  const [readScope, setReadScope] = useState('selected'); // 'selected' | 'all'

  // Host/Port form inputs (for host_port toggle)
  const [host, setHost] = useState('db.acme.io');
  const [port, setPort] = useState('5432');
  const [dbName, setDbName] = useState('production_db');
  const [dbUser, setDbUser] = useState('reader');
  const [dbPass, setDbPass] = useState('••••••••');

  // Table Selection & Preview States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTables, setSelectedTables] = useState(['raw_source_users']);
  const [activePreviewTable, setActivePreviewTable] = useState('raw_source_users');

  // Available Tables Data
  const tablesList = [
    {
      id: 'purchase_orders',
      name: 'purchase_orders',
      rows: '18,204 rows',
      columns: ['po_id', 'vendor_id', 'order_total', 'status'],
      data: [
        { po_id: 'PO-98201', vendor_id: 'VEND-4011', order_total: '$12,450.00', status: 'Approved' },
        { po_id: 'PO-98202', vendor_id: 'VEND-1092', order_total: '$4,320.50', status: 'Pending' },
        { po_id: 'PO-98203', vendor_id: 'VEND-8840', order_total: '$850.00', status: 'Approved' },
        { po_id: 'PO-98204', vendor_id: 'VEND-2019', order_total: '$28,900.00', status: 'In Review' },
      ],
    },
    {
      id: 'raw_source_users',
      name: 'raw_source_users',
      rows: '1,240 rows',
      columns: ['id', 'email', 'full_name', 'role'],
      data: [
        { id: '101', email: 'sarah.j@acme.com', full_name: 'Sarah Jenkins', role: 'analyst' },
        { id: '102', email: 'malformed.email@bad', full_name: 'Mark Lee', role: 'viewer' },
        { id: '103', email: 'marcus.v@acme.com', full_name: 'empty', role: 'manager', isNull: true },
        { id: '104', email: 'Elena.R@ACME.com', full_name: 'Elena Rostova', role: 'Admin' },
      ],
    },
    {
      id: 'sales',
      name: 'sales',
      rows: '52,019 rows',
      columns: ['sale_id', 'customer_ref', 'region', 'revenue'],
      data: [
        { sale_id: 'SO-3301', customer_ref: 'CUST-9011', region: 'US-East', revenue: '$1,820.00' },
        { sale_id: 'SO-3302', customer_ref: 'CUST-4180', region: 'EMEA-Central', revenue: '$4,500.00' },
        { sale_id: 'SO-3303', customer_ref: 'CUST-7721', region: 'APAC-South', revenue: '$940.00' },
        { sale_id: 'SO-3304', customer_ref: 'CUST-1092', region: 'US-West', revenue: '$15,100.00' },
      ],
    },
  ];

  // Filtered Tables based on Search
  const filteredTables = useMemo(() => {
    if (!searchQuery.trim()) return tablesList;
    return tablesList.filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, tablesList]);

  // Current Preview Data
  const previewData = useMemo(() => {
    return tablesList.find((t) => t.id === activePreviewTable) || tablesList[1];
  }, [activePreviewTable, tablesList]);

  // Toggle Table Checkbox Selection
  const handleToggleTable = (tableId) => {
    setSelectedTables((prev) => {
      if (prev.includes(tableId)) {
        if (prev.length === 1) return prev; // Keep at least one selected
        return prev.filter((id) => id !== tableId);
      } else {
        return [...prev, tableId];
      }
    });
    setActivePreviewTable(tableId);
  };

  // Toggle Select All / Deselect
  const handleSelectAll = () => {
    if (selectedTables.length === tablesList.length) {
      setSelectedTables(['raw_source_users']);
    } else {
      setSelectedTables(tablesList.map((t) => t.id));
    }
  };

  // Trigger Test Connection Dynamic Animation
  const handleTestConnection = () => {
    setTestState('testing');
    setTimeout(() => {
      setTestState('connected');
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setTestedAt(timeStr);
      showToast('Connection verified! 39 tables accessible.');
    }, 650);
  };

  // Save Thread Feedback
  const handleSaveThread = () => {
    setSaveStatus('saving...');
    setTimeout(() => {
      setSaveStatus('saved just now');
      showToast('Thread configuration saved!');
    }, 400);
  };

  // Show Toast
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Proceed to Next Screen (Saves source and advances to rules)
  const handleSaveSource = () => {
    showToast('Source database configured!');
    setTimeout(() => {
      navigateTo('rules');
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

            {/* Help Icon */}
            <button
              onClick={() => showToast('DataX Rule Engine Guide: Connect your source database to begin.')}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#5F6678] hover:text-[#0A0F1F] hover:bg-[#F5F6FA] transition-colors cursor-pointer"
              title="Help"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.5" />
              </svg>
            </button>

            {/* Bell Icon */}
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

            {/* Profile Avatar */}
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
              to="new-thread"
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
                  {threadTitle}
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
          {/* Card 1: Source (Active) */}
          <div className="border-2 border-[#2D55F5] rounded-[18px] p-4 bg-white shadow-xs flex items-center justify-between transition-all">
            <div className="flex items-center gap-3.5">
              <div className="w-6 h-6 rounded-full bg-[#0A0F1F] text-white text-xs font-bold flex items-center justify-center shrink-0">
                1
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] border border-[#DCE4FF] flex items-center justify-center text-[#2D55F5] shrink-0">
                <DatabaseCylinderIcon size={20} />
              </div>
              <div>
                <span className="text-[11px] font-medium text-[#5F6678] block leading-none">Source</span>
                <span className="text-sm font-bold text-[#0A0F1F] block mt-1 leading-tight">production_db</span>
                <span className="text-[11px] text-[#5F6678] block mt-0.5 leading-none">PostgreSQL · pick a table</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EEF2FF] text-[#2D55F5] text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2D55F5]" />
              Setting up
            </span>
          </div>

          {/* Card 2: AI Rules (Clickable To Do) */}
          <div
            onClick={() => navigateTo('rules')}
            className="border border-dashed border-[#CDD2DE] hover:border-[#2D55F5] rounded-[18px] p-4 bg-white/60 hover:bg-white flex items-center justify-between transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-6 h-6 rounded-full border border-[#CDD2DE] group-hover:border-[#2D55F5] text-[#5F6678] group-hover:text-[#2D55F5] text-xs font-semibold flex items-center justify-center shrink-0">
                2
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#F5F6FA] border border-[#E3E6EE] group-hover:bg-[#EEF2FF] group-hover:border-[#DCE4FF] flex items-center justify-center text-[#5F6678] group-hover:text-[#2D55F5] shrink-0 transition-colors">
                <AiSparkleIcon size={20} />
              </div>
              <div>
                <span className="text-[11px] font-medium text-[#5F6678] block leading-none">AI rules</span>
                <span className="text-sm font-bold text-[#0A0F1F] block mt-1 leading-tight">AI rule generator</span>
                <span className="text-[11px] text-[#5F6678] block mt-0.5 leading-none">Waiting for a source</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F0F2F6] text-[#5F6678] text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8E95A9]" />
              To do
            </span>
          </div>

          {/* Card 3: Target (Clickable To Do) */}
          <div
            onClick={() => navigateTo('connect-target')}
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
          </div>
        </div>
      </section>

      {/* 4. Main Two-Column Layout (Figma Exact) */}
      <main className="max-w-[1360px] w-full mx-auto px-6 py-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Connect source database (5 cols) */}
        <section className="lg:col-span-5 bg-white border border-[#E3E6EE] rounded-[22px] p-6 shadow-sm space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-[14px] bg-[#EEF2FF] border border-[#DCE4FF] flex items-center justify-center text-[#2D55F5] shrink-0">
              <DatabaseCylinderIcon size={22} />
            </div>
            <div>
              <span className="text-xs text-[#5F6678] font-medium block">Step 1 of 3 · Source</span>
              <h2 className="text-[19px] font-bold text-[#0A0F1F] tracking-tight leading-tight mt-0.5">
                Connect source database
              </h2>
            </div>
          </div>

          {/* Database Type & Connect With Controls */}
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-end">
              {/* Database type dropdown */}
              <div className="relative">
                <label className="block text-xs font-semibold text-[#0A0F1F] mb-1.5">Database type</label>
                <button
                  type="button"
                  onClick={() => setDbDropdownOpen(!dbDropdownOpen)}
                  className="w-full h-10 px-3 bg-white border border-[#CDD2DE] rounded-xl flex items-center justify-between text-xs text-[#0A0F1F] font-semibold hover:border-[#2D55F5] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2 truncate">
                    {databaseType === 'PostgreSQL' && <PostgresLogo size={18} />}
                    {databaseType === 'MongoDB' && <MongoLogo size={18} />}
                    {databaseType === 'Snowflake' && <SnowflakeLogo size={18} />}
                    {databaseType === 'SAP BW' && <SapLogo size={22} />}
                    <span>{databaseType}</span>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {dbDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white border border-[#E3E6EE] rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                    {['PostgreSQL', 'MongoDB', 'Snowflake', 'SAP BW'].map((db) => (
                      <button
                        key={db}
                        type="button"
                        onClick={() => {
                          setDatabaseType(db);
                          setDbDropdownOpen(false);
                          if (db === 'PostgreSQL') {
                            setConnectionString('postgres://reader:••••••@db.acme.io/production_db');
                          } else if (db === 'MongoDB') {
                            setConnectionString('mongodb+srv://reader:••••••@cluster0.acme.mongodb.net/production_db');
                          } else if (db === 'Snowflake') {
                            setConnectionString('snowflake://acme_reader:••••••@xy12345.us-east-1/PROD_DW');
                          } else {
                            setConnectionString('sap-bw://infocube-0pur_c01.jj-enterprise:3300');
                          }
                          showToast(`Switched source engine to ${db}`);
                        }}
                        className={`w-full px-3 py-2 text-xs text-left flex items-center gap-2 hover:bg-[#F5F8FF] transition-colors cursor-pointer ${
                          databaseType === db ? 'font-bold text-[#2D55F5] bg-[#EEF2FF]' : 'text-[#0A0F1F]'
                        }`}
                      >
                        {db === 'PostgreSQL' && <PostgresLogo size={16} />}
                        {db === 'MongoDB' && <MongoLogo size={16} />}
                        {db === 'Snowflake' && <SnowflakeLogo size={16} />}
                        {db === 'SAP BW' && <SapLogo size={20} />}
                        <span>{db}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Connect with Segmented Pill Toggle */}
              <div>
                <label className="block text-xs font-semibold text-[#0A0F1F] mb-1.5">Connect with</label>
                <div className="bg-[#F0F2F6] p-1 rounded-xl flex items-center gap-1 h-10">
                  <button
                    type="button"
                    onClick={() => setConnectMethod('connection_string')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      connectMethod === 'connection_string'
                        ? 'bg-white text-[#2D55F5] shadow-2xs'
                        : 'text-[#5F6678] hover:text-[#0A0F1F]'
                    }`}
                  >
                    Connection string
                  </button>
                  <button
                    type="button"
                    onClick={() => setConnectMethod('host_port')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      connectMethod === 'host_port'
                        ? 'bg-white text-[#2D55F5] shadow-2xs'
                        : 'text-[#5F6678] hover:text-[#0A0F1F]'
                    }`}
                  >
                    Host & port
                  </button>
                </div>
              </div>
            </div>

            {/* Dynamic Connection Inputs */}
            {connectMethod === 'connection_string' ? (
              <div>
                <label className="block text-xs font-semibold text-[#0A0F1F] mb-1.5">Connection string</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={showPassword ? 'postgres://reader:p@ssw0rd99@db.acme.io/production_db' : connectionString}
                    onChange={(e) => setConnectionString(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-[#CDD2DE] rounded-xl font-mono text-xs text-[#0A0F1F] focus:outline-none focus:border-[#2D55F5] focus:ring-2 focus:ring-[#2D55F5]/15 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E95A9] hover:text-[#0A0F1F] transition-colors cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-[#5F6678] mt-1.5 flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>Encrypted in transit and kept in your vault. Never shown in logs.</span>
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-[#0A0F1F] mb-1">Host</label>
                    <input
                      type="text"
                      value={host}
                      onChange={(e) => setHost(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#CDD2DE] rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#0A0F1F] mb-1">Port</label>
                    <input
                      type="text"
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#CDD2DE] rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#0A0F1F] mb-1">Database</label>
                    <input
                      type="text"
                      value={dbName}
                      onChange={(e) => setDbName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#CDD2DE] rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#0A0F1F] mb-1">Username</label>
                    <input
                      type="text"
                      value={dbUser}
                      onChange={(e) => setDbUser(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#CDD2DE] rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Connection Test Status Box */}
            <div className="bg-[#E7F6EE] border border-[#BFE6D2] rounded-[16px] p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[#127A52] flex items-center justify-center shrink-0">
                  {testState === 'testing' ? (
                    <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0A0F1F] leading-tight">
                    {testState === 'testing' ? 'Verifying connection...' : 'Connected · 39 tables found'}
                  </h4>
                  <p className="text-[11px] text-[#5F6678] mt-0.5">
                    {databaseType} 15 · tested at {testedAt}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testState === 'testing'}
                className="px-3 py-1.5 rounded-full border border-[#CDD2DE] bg-white hover:bg-[#F5F6FA] active:bg-[#EBEFF5] text-xs font-semibold text-[#0A0F1F] flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={testState === 'testing' ? 'animate-spin' : ''}>
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                Test again
              </button>
            </div>

            {/* What to read section */}
            <div className="pt-1">
              <label className="block text-xs font-semibold text-[#0A0F1F] mb-1.5">What to read</label>
              <div className="bg-[#F0F2F6] p-1 rounded-xl flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setReadScope('selected')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    readScope === 'selected'
                      ? 'bg-white text-[#2D55F5] shadow-2xs'
                      : 'text-[#5F6678] hover:text-[#0A0F1F]'
                  }`}
                >
                  Selected tables
                </button>
                <button
                  type="button"
                  onClick={() => setReadScope('all')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    readScope === 'all'
                      ? 'bg-white text-[#2D55F5] shadow-2xs'
                      : 'text-[#5F6678] hover:text-[#0A0F1F]'
                  }`}
                >
                  All tables
                </button>
              </div>
              <p className="text-[11px] text-[#5F6678] mt-2">
                AI uses the columns of the selected table to suggest rules.
              </p>
            </div>
          </div>
        </section>

        {/* Right Column: Choose a table (7 cols) */}
        <section className="lg:col-span-7 bg-white border border-[#E3E6EE] rounded-[22px] p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            {/* Header with Selected Badge & Select All */}
            <div className="flex items-center justify-between pb-3.5 border-b border-[#F0F2F6]">
              <h2 className="text-[19px] font-bold text-[#0A0F1F] tracking-tight">Choose a table</h2>
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-0.5 rounded-full bg-[#2D55F5] text-white text-xs font-semibold">
                  {selectedTables.length} selected
                </span>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs font-semibold text-[#2D55F5] hover:underline cursor-pointer"
                >
                  {selectedTables.length === tablesList.length ? 'Deselect all' : 'Select all (39)'}
                </button>
              </div>
            </div>

            {/* Table Search Input */}
            <div className="relative mt-4">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E95A9]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tables"
                className="w-full pl-9 pr-3.5 py-2 bg-white border border-[#E3E6EE] rounded-xl text-xs sm:text-sm text-[#0A0F1F] placeholder:text-[#8E95A9] focus:outline-none focus:border-[#2D55F5] transition-all"
              />
            </div>

            {/* Tables List */}
            <div className="mt-3 space-y-1.5">
              {filteredTables.map((tbl) => {
                const isChecked = selectedTables.includes(tbl.id);
                const isPreviewing = activePreviewTable === tbl.id;

                return (
                  <div
                    key={tbl.id}
                    onClick={() => setActivePreviewTable(tbl.id)}
                    className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      isPreviewing
                        ? 'bg-[#EEF2FF] border-[#DCE4FF]'
                        : 'bg-white border-transparent hover:bg-[#F9FAFC] hover:border-[#E3E6EE]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTable(tbl.id);
                        }}
                        className={`w-4 h-4 rounded flex items-center justify-center transition-all cursor-pointer ${
                          isChecked ? 'bg-[#2D55F5] text-white' : 'border border-[#CDD2DE] bg-white'
                        }`}
                      >
                        {isChecked && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>

                      {/* Icon & Monospace Table Name */}
                      <div className="flex items-center gap-2">
                        <TableGridIcon />
                        <span className={`font-mono text-xs ${isChecked ? 'font-bold text-[#0A0F1F]' : 'text-[#474E61]'}`}>
                          {tbl.name}
                        </span>
                      </div>
                    </div>

                    <span className="text-xs text-[#5F6678] font-normal">{tbl.rows}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Table Data Preview Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#5F6678]">Preview</span>
                <span className="px-2 py-0.5 bg-[#F0F2F6] border border-[#E3E6EE] rounded-md font-mono text-[11px] font-bold text-[#0A0F1F]">
                  {previewData.name}
                </span>
              </div>
              <span className="text-[11px] text-[#5F6678]">
                first {previewData.data.length} of {previewData.rows}
              </span>
            </div>

            {/* Data Table Preview */}
            <div className="border border-[#E3E6EE] rounded-xl overflow-hidden bg-white shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F8F9FA] border-b border-[#E3E6EE] text-[#5F6678] font-mono text-[11px]">
                      {previewData.columns.map((col) => (
                        <th key={col} className="px-3.5 py-2 font-semibold">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F2F6] font-mono text-xs text-[#0A0F1F]">
                    {previewData.data.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#F9FAFC] transition-colors">
                        {previewData.columns.map((col) => {
                          const val = row[col];
                          const isNullVal = row.isNull && col === 'full_name';

                          return (
                            <td key={col} className="px-3.5 py-2.5 whitespace-nowrap">
                              {isNullVal ? (
                                <span className="text-[#B45309] font-medium bg-[#FEF3C7] px-1.5 py-0.5 rounded text-[11px] italic">
                                  empty
                                </span>
                              ) : (
                                <span className={col === 'email' && val.includes('bad') ? 'text-[#D97706]' : ''}>
                                  {val}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 5. Bottom Sticky Action Bar (Figma Exact) */}
      <footer className="w-full bg-white border-t border-[#E3E6EE] px-6 py-3.5 sticky bottom-0 z-30 shadow-xs">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-[#5F6678] font-medium">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>Next: AI rules</span>
          </div>

          <div className="flex items-center gap-3">
            <Link to="threads">
              <button
                type="button"
                className="px-4 py-2 text-xs font-semibold text-[#5F6678] hover:text-[#0A0F1F] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </Link>
            <button
              type="button"
              onClick={handleSaveSource}
              className="px-5 py-2 rounded-full bg-[#2D55F5] hover:bg-[#2045DC] active:bg-[#1937B0] text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Save source
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
