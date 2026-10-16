import React, { useState } from 'react';
import { Link, useNavigation } from '../context/NavigationContext';
import DataXUserMenu from '../components/common/DataXUserMenu';
import { PostgresLogo, MongoLogo, SnowflakeLogo, SapLogo } from '../components/icons/DatabaseLogos';

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

export default function ConnectTargetPage() {
  const { navigateTo } = useNavigation();
  const [databaseType, setDatabaseType] = useState('PostgreSQL');
  const [targetEndpoint, setTargetEndpoint] = useState('postgres://writer:••••••@db.acme.io/reconciled_db');
  const [targetTable, setTargetTable] = useState('clean_users');
  const [writeMode, setWriteMode] = useState('upsert'); // 'upsert' | 'append' | 'overwrite'
  const [saveStatus, setSaveStatus] = useState('saved just now');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleSaveTarget = () => {
    showToast('Target destination confirmed!');
    setTimeout(() => {
      navigateTo('running-dry-run');
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

      {/* 1. Universal Top Navbar */}
      <header className="w-full bg-white border-b border-[#E3E6EE] sticky top-0 z-40">
        <div className="max-w-[1360px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-7">
            <Link to="threads" className="flex items-center gap-2.5">
              <DataXLogo size={32} />
              <span className="font-bold text-[#0A0F1F] tracking-tight text-[18px]">DataX</span>
            </Link>

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

          <div className="flex items-center gap-4">
            <DataXUserMenu />
          </div>
        </div>
      </header>

      {/* 2. Sub-Header */}
      <div className="w-full bg-white border-b border-[#E3E6EE] px-6 py-3">
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="rules"
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-[#E3E6EE] hover:bg-[#F5F6FA] text-[#474E61] transition-colors cursor-pointer"
              title="Back to Rules"
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

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSaveStatus('saved just now');
                showToast('Target configuration saved!');
              }}
              className="px-3.5 py-1.5 rounded-full border border-[#CDD2DE] bg-white hover:bg-[#F5F6FA] text-xs font-semibold text-[#0A0F1F] flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
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
              className="px-3.5 py-1.5 rounded-full border border-[#CDD2DE] bg-white hover:bg-[#F5F6FA] text-xs font-semibold text-[#0A0F1F] flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" />
                <line x1="8.5" y1="2" x2="15.5" y2="2" />
              </svg>
              Dry run
            </button>
          </div>
        </div>
      </div>

      {/* 3. 3-Step Stepper Cards */}
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
              <div className="w-9 h-9 rounded-xl bg-[#F5F6FA] border border-[#E3E6EE] flex items-center justify-center text-[#5F6678] shrink-0">
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

          {/* Card 2: AI Rules (Ready) */}
          <Link
            to="rules"
            className="border border-[#CDD2DE] hover:border-[#2D55F5] rounded-[18px] p-4 bg-white flex items-center justify-between transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-6 h-6 rounded-full bg-[#0A0F1F] text-white text-xs font-bold flex items-center justify-center shrink-0">
                2
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#F5F6FA] border border-[#E3E6EE] flex items-center justify-center text-[#5F6678] shrink-0">
                <AiSparkleIcon size={20} />
              </div>
              <div>
                <span className="text-[11px] font-medium text-[#5F6678] block leading-none">AI rules</span>
                <span className="text-sm font-bold text-[#0A0F1F] block mt-1 leading-tight">AI rule generator</span>
                <span className="text-[11px] text-[#5F6678] block mt-0.5 leading-none">6 rules configured</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E7F6EE] text-[#127A52] text-[11px] font-semibold border border-[#BFE6D2]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#127A52]" />
              Ready
            </span>
          </Link>

          {/* Card 3: Target (Active - Setting up) */}
          <div className="border-2 border-[#2D55F5] rounded-[18px] p-4 bg-white shadow-xs flex items-center justify-between transition-all">
            <div className="flex items-center gap-3.5">
              <div className="w-6 h-6 rounded-full bg-[#0A0F1F] text-white text-xs font-bold flex items-center justify-center shrink-0">
                3
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] border border-[#DCE4FF] flex items-center justify-center text-[#2D55F5] shrink-0">
                <TargetDatabaseIcon size={20} />
              </div>
              <div>
                <span className="text-[11px] font-medium text-[#5F6678] block leading-none">Target</span>
                <span className="text-sm font-bold text-[#0A0F1F] block mt-1 leading-tight">reconciled_db</span>
                <span className="text-[11px] text-[#5F6678] block mt-0.5 leading-none">clean_users · ready</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EEF2FF] text-[#2D55F5] text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2D55F5]" />
              Setting up
            </span>
          </div>
        </div>
      </section>

      {/* 4. Main Two-Column Layout */}
      <main className="max-w-[1360px] w-full mx-auto px-6 py-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Target Database Settings (5 cols) */}
        <section className="lg:col-span-5 bg-white border border-[#E3E6EE] rounded-[22px] p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-[14px] bg-[#EEF2FF] border border-[#DCE4FF] flex items-center justify-center text-[#2D55F5] shrink-0">
              <TargetDatabaseIcon size={22} />
            </div>
            <div>
              <span className="text-xs text-[#5F6678] font-medium block">Step 3 of 3 · Target</span>
              <h2 className="text-[19px] font-bold text-[#0A0F1F] tracking-tight leading-tight mt-0.5">
                Choose a target
              </h2>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-[#0A0F1F] mb-1.5">Target database engine</label>
              <div className="w-full h-10 px-3 bg-white border border-[#CDD2DE] rounded-xl flex items-center justify-between text-xs text-[#0A0F1F] font-semibold">
                <div className="flex items-center gap-2">
                  <PostgresLogo size={18} />
                  <span>PostgreSQL (reconciled_db)</span>
                </div>
                <span className="text-[11px] text-[#127A52] font-semibold bg-[#E7F6EE] px-2 py-0.5 rounded-full">Active</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0A0F1F] mb-1.5">Target connection URI</label>
              <input
                type="text"
                value={targetEndpoint}
                onChange={(e) => setTargetEndpoint(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#CDD2DE] rounded-xl font-mono text-xs text-[#0A0F1F] focus:outline-none focus:border-[#2D55F5] transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#0A0F1F] mb-1.5">Destination Table</label>
                <input
                  type="text"
                  value={targetTable}
                  onChange={(e) => setTargetTable(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#CDD2DE] rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0A0F1F] mb-1.5">Write Mode</label>
                <select
                  value={writeMode}
                  onChange={(e) => setWriteMode(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#CDD2DE] rounded-xl text-xs font-semibold"
                >
                  <option value="upsert">Upsert (Merge by id)</option>
                  <option value="append">Append Only</option>
                  <option value="overwrite">Overwrite Table</option>
                </select>
              </div>
            </div>

            <div className="bg-[#E7F6EE] border border-[#BFE6D2] rounded-[16px] p-3.5 flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-[#127A52] flex items-center justify-center shrink-0">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="text-xs">
                <strong className="text-[#127A52] block font-semibold">Target Destination Verified</strong>
                <span className="text-[#474E61]">
                  Schema matches source columns. Clean rows will be dispatched to <code className="font-mono text-[#0A0F1F] font-bold">clean_users</code>.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Schema Mapping (7 cols) */}
        <section className="lg:col-span-7 bg-white border border-[#E3E6EE] rounded-[22px] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0F2F6]">
            <div>
              <h3 className="text-base font-bold text-[#0A0F1F]">Schema Alignment & Target Mapping</h3>
              <p className="text-xs text-[#5F6678] mt-0.5">Validated columns from raw_source_users to clean_users</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#2D55F5] text-xs font-semibold">
              5 of 5 Mapped
            </span>
          </div>

          <div className="space-y-2">
            {[
              { src: 'id', dest: 'clean_users.id', rule: 'Unique Identity (Primary Key)', status: 'Mapped' },
              { src: 'email', dest: 'clean_users.email', rule: 'Validated RFC-5322 Format', status: 'Validated' },
              { src: 'full_name', dest: 'clean_users.full_name', rule: 'Required Non-Null String', status: 'Validated' },
              { src: 'role', dest: 'clean_users.role', rule: 'Enum: admin, analyst, manager, viewer', status: 'Validated' },
              { src: 'status', dest: 'clean_users.status', rule: 'Enum: active, inactive (Auto-Fix ready)', status: 'Auto-Fix Ready' },
            ].map((col, idx) => (
              <div key={idx} className="p-3 bg-[#F9FAFC] border border-[#E3E6EE] rounded-xl flex items-center justify-between text-xs hover:border-[#2D55F5]/30 transition-all">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-[#0A0F1F]">{col.src}</span>
                  <span className="text-[#8E95A9]">→</span>
                  <span className="font-mono text-[#2D55F5] font-semibold">{col.dest}</span>
                  <span className="text-[11px] text-[#5F6678] ml-2 hidden sm:inline">({col.rule})</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  col.status === 'Auto-Fix Ready'
                    ? 'bg-[#D4FF3A] text-[#0A0F1F]'
                    : 'bg-[#E7F6EE] text-[#127A52]'
                }`}>
                  {col.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* 5. Bottom Sticky Action Bar */}
      <footer className="w-full bg-white border-t border-[#E3E6EE] px-6 py-3.5 sticky bottom-0 z-30 shadow-xs">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between">
          <Link to="rules">
            <button
              type="button"
              className="px-4 py-2 text-xs font-semibold text-[#5F6678] hover:text-[#0A0F1F] transition-colors cursor-pointer"
            >
              ← Back to AI rules
            </button>
          </Link>

          <button
            type="button"
            onClick={handleSaveTarget}
            className="px-5 py-2 rounded-full bg-[#2D55F5] hover:bg-[#2045DC] active:bg-[#1937B0] text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <span>Proceed to Dry Run Simulation →</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
