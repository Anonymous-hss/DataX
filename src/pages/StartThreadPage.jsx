import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Info, 
  ArrowRight,
  Search,
  HelpCircle,
  Bell
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import DataXUserMenu from '../components/common/DataXUserMenu';

// --- Figma-Exact SVGs ---

const DataXLogo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className="shrink-0">
    <rect width="32" height="32" rx="9" fill="#2D55F5" />
    <path d="M9 9L23 23" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
    <path d="M23 9L18 14" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
    <path d="M14 18L9 23" stroke="#D4FF3A" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const ThreadBranchIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="6" cy="6" r="2.5" stroke="#2D55F5" strokeWidth="2" />
    <circle cx="18" cy="6" r="2.5" stroke="#2D55F5" strokeWidth="2" />
    <circle cx="6" cy="18" r="2.5" stroke="#2D55F5" strokeWidth="2" />
    <path d="M6 8.5v7" stroke="#2D55F5" strokeWidth="2" />
    <path d="M6 12h8a4 4 0 004-4" stroke="#2D55F5" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Card 1: Document with blue plus badge
const ScratchDocIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <rect x="4" y="3" width="16" height="21" rx="3" fill="#EEF2FF" stroke="#2D55F5" strokeWidth="1.5" />
    <line x1="8" y1="8" x2="16" y2="8" stroke="#2D55F5" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="8" y1="12" x2="14" y2="12" stroke="#2D55F5" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="20" cy="19" r="6" fill="#2D55F5" />
    <line x1="20" y1="16.5" x2="20" y2="21.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="17.5" y1="19" x2="22.5" y2="19" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// Card 2: Green 3D stacked database layers
const CustomerLayersIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <polygon points="12 2 2 7 12 12 22 7 12 2" fill="#E6FDF1" stroke="#00A344" strokeWidth="1.75" strokeLinejoin="round" />
    <polyline points="2 12 12 17 22 12" stroke="#00A344" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="2 17 12 22 22 17" stroke="#00A344" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Card 3: Amber SAP BW database cylinder
const SapCylinderIcon = () => (
  <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
    <ellipse cx="14" cy="7" rx="10" ry="3.5" fill="#FFFBEB" stroke="#D97706" strokeWidth="1.75" />
    <path d="M4 7v6c0 1.93 4.48 3.5 10 3.5s10-1.57 10-3.5V7" stroke="#D97706" strokeWidth="1.75" fill="none" />
    <path d="M4 13v6c0 1.93 4.48 3.5 10 3.5s10-1.57 10-3.5v-6" stroke="#D97706" strokeWidth="1.75" fill="none" />
    <circle cx="9" cy="13" r="1.5" fill="#D97706" />
    <circle cx="14" cy="13" r="1.5" fill="#D97706" />
    <circle cx="19" cy="13" r="1.5" fill="#D97706" />
  </svg>
);

// Card 4: Purple Financial Ledger icon
const FinancialLedgerIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="4" fill="#F5F3FF" stroke="#7C3AED" strokeWidth="1.75" />
    <line x1="8" y1="8" x2="16" y2="8" stroke="#7C3AED" strokeWidth="1.75" strokeLinecap="round" />
    <line x1="8" y1="12" x2="16" y2="12" stroke="#7C3AED" strokeWidth="1.75" strokeLinecap="round" />
    <line x1="8" y1="16" x2="13" y2="16" stroke="#7C3AED" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);

export default function StartThreadPage() {
  const { navigateTo } = useNavigation();
  const [threadName, setThreadName] = useState('User records clean-up');
  const [description, setDescription] = useState(
    'Check user records from production_db (email, name, role, status) and write clean rows to reconciled_db.'
  );
  const [selectedDomain, setSelectedDomain] = useState('scratch');

  const domainOptions = [
    {
      id: 'scratch',
      name: 'Start from scratch',
      desc: 'Describe what you need. AI drafts the steps.',
      icon: <ScratchDocIcon />,
      bg: 'bg-[#EEF2FF]',
    },
    {
      id: 'customer',
      name: 'Customer Master 360',
      desc: 'MongoDB → PostgreSQL · 6 rules',
      icon: <CustomerLayersIcon />,
      bg: 'bg-[#E6FDF1]',
    },
    {
      id: 'sap',
      name: 'SAP BW → S/4HANA Clean Core',
      desc: 'InfoCube → S/4HANA · 8 rules',
      icon: <SapCylinderIcon />,
      bg: 'bg-[#FFFBEB]',
    },
    {
      id: 'finance',
      name: 'Financial GL & AP Ledger',
      desc: 'Ledger and payables · 5 rules',
      icon: <FinancialLedgerIcon />,
      bg: 'bg-[#F5F3FF]',
    },
  ];

  const handleCreate = (e) => {
    e.preventDefault();
    navigateTo('connect-source');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0A0F1F] font-sans flex flex-col justify-between antialiased selection:bg-blue-500/20 selection:text-blue-700">
      
      <div>
        {/* Top Universal Navbar */}
        <header className="w-full bg-white border-b border-[#E3E6EE] sticky top-0 z-40">
          <div className="max-w-[1360px] mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-7">
              {/* Logo */}
              <div 
                onClick={() => navigateTo('threads')}
                className="flex items-center gap-2.5 cursor-pointer"
              >
                <DataXLogo size={32} />
                <span className="font-bold text-[#0A0F1F] tracking-tight text-[18px]">DataX</span>
              </div>

              {/* Navigation Pills */}
              <nav className="hidden md:flex items-center gap-1.5">
                <button
                  onClick={() => navigateTo('threads')}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-full bg-[#EEF2FF] text-[#2D55F5] flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  Threads
                </button>
                <button
                  onClick={() => navigateTo('connect-source')}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-full text-[#5F6678] hover:text-[#0A0F1F] hover:bg-[#F5F6FA] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                  Domain packs
                </button>
                <button
                  onClick={() => navigateTo('connect-source')}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-full text-[#5F6678] hover:text-[#0A0F1F] hover:bg-[#F5F6FA] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <circle cx="12" cy="5" r="3" />
                    <line x1="12" y1="8" x2="12" y2="13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="18" r="3" />
                    <path d="M12 13l-4 3" />
                    <path d="M12 13l4 3" />
                  </svg>
                  Connections
                </button>
                <button
                  onClick={() => navigateTo('history')}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-full text-[#5F6678] hover:text-[#0A0F1F] hover:bg-[#F5F6FA] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Runs
                </button>
              </nav>
            </div>

            {/* Search, Notifications & Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative hidden sm:block">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E95A9]">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="Search threads, tables..."
                  className="w-64 pl-9 pr-3.5 py-1.5 bg-[#F5F6FA] border border-[#E3E6EE] rounded-full text-xs text-[#0A0F1F] placeholder:text-[#8E95A9] focus:outline-none focus:border-[#2D55F5] focus:bg-white transition-all"
                />
              </div>

              <button className="w-8 h-8 rounded-full flex items-center justify-center text-[#5F6678] hover:text-[#0A0F1F] hover:bg-[#F5F6FA] transition-colors">
                <HelpCircle className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 rounded-full flex items-center justify-center text-[#5F6678] hover:text-[#0A0F1F] hover:bg-[#F5F6FA] transition-colors relative">
                <Bell className="w-4 h-4" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#2D55F5] absolute top-2 right-2" />
              </button>
              <DataXUserMenu />
            </div>
          </div>
        </header>

        {/* Subheader: New Thread */}
        <section className="w-full bg-white border-b border-[#E3E6EE] px-6 py-3.5">
          <div className="max-w-[1360px] mx-auto flex items-center gap-3.5">
            <button
              onClick={() => navigateTo('threads')}
              className="w-8 h-8 rounded-full border border-[#E3E6EE] bg-white hover:bg-[#F5F6FA] flex items-center justify-center text-[#5F6678] hover:text-[#0A0F1F] transition-colors cursor-pointer"
              title="Back to Threads"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#0A0F1F] text-sm tracking-tight">New thread</span>
              <span className="px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#4B5563] text-[11px] font-medium border border-[#E5E7EB]">
                Draft
              </span>
              <span className="text-xs text-[#9CA3AF] ml-1">Not saved yet</span>
            </div>
          </div>
        </section>

        {/* Main Card Container: Start a Thread (Figma 02 · Start a thread) */}
        <main className="max-w-[760px] mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[24px] border border-[#E3E6EE] shadow-sm p-7 sm:p-8 space-y-6"
          >
            {/* Card Header */}
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-[14px] bg-[#EEF2FF] flex items-center justify-center shrink-0">
                <ThreadBranchIcon />
              </div>
              <div>
                <p className="text-[12px] font-medium text-[#5F6678]">New thread</p>
                <h1 className="text-[22px] font-bold text-[#0A0F1F] tracking-tight leading-tight mt-0.5">
                  Start a thread
                </h1>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-6">
              {/* Thread Name */}
              <div>
                <label className="block text-xs font-semibold text-[#0A0F1F] mb-1.5">
                  Thread name
                </label>
                <input
                  type="text"
                  value={threadName}
                  onChange={(e) => setThreadName(e.target.value)}
                  placeholder="e.g. User records clean-up"
                  className="w-full px-4 py-2.5 bg-white border-2 border-[#2D55F5] rounded-xl text-sm font-semibold text-[#0A0F1F] focus:outline-none focus:ring-4 focus:ring-[#2D55F5]/10 shadow-2xs"
                  required
                />
              </div>

              {/* Description Optional */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#0A0F1F]">
                    Description <span className="text-[#9CA3AF] font-normal">Optional</span>
                  </label>
                </div>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your thread goal..."
                  className="w-full px-4 py-2.5 bg-white border border-[#E3E6EE] rounded-xl text-xs text-[#474E61] focus:bg-white focus:outline-none focus:border-[#2D55F5] transition-all resize-none leading-relaxed"
                />
              </div>

              {/* Starting Point (Grid of 4 domain packs) */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-xs font-semibold text-[#0A0F1F]">
                    Starting point
                  </h3>
                  <p className="text-xs text-[#5F6678] mt-0.5">
                    Start empty, or pick a domain pack with ready-made steps and rules.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {domainOptions.map((opt) => {
                    const isSelected = selectedDomain === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setSelectedDomain(opt.id)}
                        className={`p-4 rounded-[18px] transition-all cursor-pointer flex items-start justify-between min-h-[76px] ${
                          isSelected
                            ? 'border-2 border-[#2D55F5] bg-[#F5F8FF] shadow-2xs'
                            : 'border border-[#E3E6EE] hover:border-[#CBD5E1] bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${opt.bg}`}>
                            {opt.icon}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#0A0F1F]">{opt.name}</div>
                            <div className="text-[11px] text-[#5F6678] mt-0.5 leading-snug">{opt.desc}</div>
                          </div>
                        </div>

                        {/* Radio selection indicator */}
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? 'border-[#2D55F5]' : 'border-[#CBD5E1]'
                        }`}>
                          {isSelected && <span className="w-2 h-2 rounded-full bg-[#2D55F5]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Inline info note without harsh bounding box */}
                <div className="flex items-center gap-2 pt-1 text-xs text-[#5F6678]">
                  <Info className="w-4 h-4 text-[#2D55F5] shrink-0" />
                  <span>Don't see your domain? Start from scratch. More domain packs are on the way.</span>
                </div>
              </div>
            </form>
          </motion.div>
        </main>
      </div>

      {/* Sticky Full-Width Bottom Bar (Figma Exact Match) */}
      <footer className="w-full bg-white border-t border-[#E3E6EE] py-3.5 px-6 sticky bottom-0 z-40">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#5F6678]">
            <Info className="w-3.5 h-3.5 text-[#5F6678]" />
            <span>You can change everything later.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigateTo('threads')}
              className="px-4 py-2 rounded-full text-xs font-medium text-[#5F6678] hover:text-[#0A0F1F] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              className="px-5 py-2.5 rounded-full bg-[#2D55F5] hover:bg-[#2045DC] text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              Create thread
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
