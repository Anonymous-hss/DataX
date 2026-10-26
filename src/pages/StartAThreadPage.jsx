import React, { useState } from 'react';
import { Link, useNavigation } from '../context/NavigationContext';
import { useRuleEngine } from '../context/RuleEngineContext';
import DataXUserMenu from '../components/common/DataXUserMenu';
import Button from '../components/ui/Button';
import Tag from '../components/ui/Tag';
import Input from '../components/ui/Input';
import { SapLogo, MongoLogo } from '../components/icons/DatabaseLogos';

// User-Provided Official DataX Logo
const DataXLogo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className="shrink-0">
    <rect width="64" height="64" rx="16" fill="#2D55F5" />
    <polygon points="14.5,49.5 24.5,49.5 49.5,14.5 39.5,14.5" fill="#FFFFFF" />
    <polygon points="14.5,14.5 24.5,14.5 31.5,24.5 21.5,24.5" fill="#D4FF3A" />
    <polygon points="32.5,39.5 42.5,39.5 49.5,49.5 39.5,49.5" fill="#D4FF3A" />
  </svg>
);

// Canvas Document Icon
const CanvasDocIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2D55F5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="18" x2="12" y2="12" />
    <line x1="9" y1="15" x2="15" y2="15" />
  </svg>
);

// Ledger Book Icon
const LedgerIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5F6678" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <line x1="8" y1="10" x2="14" y2="10" />
  </svg>
);

// Brain Icon for RAG starter
const BrainDocIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2D55F5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04z" />
  </svg>
);

// Salesforce Icon for CRM starter
const SalesforceDocIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2D55F5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </svg>
);

export default function StartAThreadPage() {
  const { navigateTo } = useNavigation();
  const { selectThread, setActiveThread } = useRuleEngine();
  const [threadName, setThreadName] = useState('SAP BW → S/4HANA Clean Core');
  const [description, setDescription] = useState('Extract InfoCube purchasing lines, fix legacy plant codes and stage clean orders.');
  const [selectedPack, setSelectedPack] = useState('sap');

  const packs = [
    {
      id: 'scratch',
      title: 'Start from scratch',
      desc: 'Start empty canvas or connect bespoke sources.',
      icon: <CanvasDocIcon />,
      badge: 'Custom'
    },
    {
      id: 'sap',
      title: 'SAP BW → S/4HANA Clean Core',
      desc: 'InfoCube → S/4HANA BAPI · 5 rules',
      icon: <SapLogo size={26} />,
      badge: 'Tier 1'
    },
    {
      id: 'ledger',
      title: 'Financial GL & SOX 404 Audit',
      desc: 'Debits = Credits → BigQuery · 4 rules',
      icon: <LedgerIcon />,
      badge: 'Tier 1'
    },
    {
      id: 'customer',
      title: 'Customer Master 360 & Vector',
      desc: 'MongoDB → Vector Matcher → Neon · 4 rules',
      icon: <MongoLogo size={22} />,
      badge: 'Tier 2'
    },
    {
      id: 'rag',
      title: 'Policy RAG & Legal Contracts',
      desc: 'AWS S3 → RAG Enricher → Pinecone · 4 rules',
      icon: <BrainDocIcon />,
      badge: 'Tier 2'
    },
    {
      id: 'sfdc',
      title: 'Salesforce CRM → BigQuery',
      desc: 'Salesforce Leads → BigQuery API · 4 rules',
      icon: <SalesforceDocIcon />,
      badge: 'Tier 3'
    }
  ];

  const handleSelectPack = (pack) => {
    setSelectedPack(pack.id);
    if (pack.id === 'sap') {
      setThreadName('SAP BW → S/4HANA Clean Core');
      setDescription('Extract InfoCube purchasing lines, fix legacy plant codes and stage clean orders.');
    } else if (pack.id === 'ledger') {
      setThreadName('Financial General Ledger & SOX 404 Audit');
      setDescription('Audit general ledger journal entries, enforce Debits = Credits zero balance, and stage audited entries.');
    } else if (pack.id === 'customer') {
      setThreadName('Customer Master & Identity Harmonizer');
      setDescription('Harmonize duplicate customer accounts using cosine vector embeddings and write golden records.');
    } else if (pack.id === 'rag') {
      setThreadName('Enterprise Policy RAG & Legal Contracts');
      setDescription('Ingest contracts from AWS S3, retrieve compliance policy context, and index vector embeddings to Pinecone.');
    } else if (pack.id === 'sfdc') {
      setThreadName('Salesforce CRM → BigQuery Revenue Pipeline');
      setDescription('Cleanse corporate lead emails, route enterprise deals, and stream pipeline records to BigQuery.');
    } else {
      setThreadName('Custom Data Pipeline');
      setDescription('Connect bespoke database endpoints, configure custom LLM transformation rules, and define target mappings.');
    }
  };

  const handleCreateThread = (e) => {
    e.preventDefault();
    let packKey = 'sap_bw_s4hana';
    if (selectedPack === 'customer') packKey = 'customer_master_reconciliation';
    else if (selectedPack === 'ledger') packKey = 'financial_gl_ledger';
    else if (selectedPack === 'rag') packKey = 'enterprise_rag_knowledge';
    else if (selectedPack === 'sfdc') packKey = 'salesforce_crm_bigquery';
    else if (selectedPack === 'scratch') packKey = 'customer_master_reconciliation';

    selectThread(packKey);
    setActiveThread(prev => ({
      ...prev,
      name: threadName,
      desc: description
    }));

    // Navigates directly to Interactive Node Canvas
    navigateTo('canvas');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#474E61] font-sans antialiased flex flex-col justify-between">
      {/* Top Universal Navbar */}
      <header className="w-full bg-white border-b border-[#E3E6EE] sticky top-0 z-40">
        <div className="max-w-[1360px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-7">
            {/* Logo */}
            <Link to="threads" className="flex items-center gap-2.5">
              <DataXLogo size={32} />
              <span className="font-bold text-[#0A0F1F] tracking-tight text-[18px]">DataX</span>
            </Link>

            {/* Navigation Pills */}
            <nav className="hidden md:flex items-center gap-1.5">
              <Link
                to="workflows"
                className="px-3.5 py-1.5 text-xs font-medium rounded-full text-[#5F6678] hover:text-[#0A0F1F] hover:bg-[#F5F6FA] flex items-center gap-1.5 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                Workflows
              </Link>
              <Link
                to="templates"
                className="px-3.5 py-1.5 text-xs font-semibold rounded-full bg-[#EEF2FF] text-[#2D55F5] flex items-center gap-1.5 transition-all"
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
            </nav>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3">
            <DataXUserMenu />
          </div>
        </div>
      </header>

      {/* Sub-header with Back Arrow, Draft Tag, and Not Saved Yet */}
      <div className="w-full bg-white border-b border-[#E3E6EE] px-6 h-12 flex items-center">
        <div className="max-w-[1360px] w-full mx-auto flex items-center gap-3">
          <Link
            to="workflows"
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#474E61] hover:bg-[#F5F6FA] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <span className="text-sm font-semibold text-[#0A0F1F]">New workflow</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EDEFF5] text-[#5F6678] text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8E95A9]" /> Draft
          </span>
          <span className="text-xs text-[#8E95A9]">Not saved yet</span>
        </div>
      </div>

      {/* Main Center Card (Figma Frame 02 Match) */}
      <main className="flex-1 max-w-[660px] w-full mx-auto px-6 py-8">
        <form onSubmit={handleCreateThread} className="bg-white border border-[#E3E6EE] rounded-[24px] p-7 md:p-8 shadow-sm space-y-6">
          {/* Header Inside Card */}
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-[14px] bg-[#EEF2FF] border border-[#DCE4FF] flex items-center justify-center text-[#2D55F5] shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="6" r="3" />
                <circle cx="18" cy="18" r="3" />
                <path d="M18 9v3a6 6 0 0 1-6 6H9" />
              </svg>
            </div>
            <div>
              <span className="text-xs text-[#5F6678] font-medium">New workflow</span>
              <h1 className="text-[24px] font-bold text-[#0A0F1F] tracking-tight leading-tight mt-0.5">
                Start a workflow
              </h1>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0A0F1F] mb-1.5">Workflow name</label>
              <Input
                value={threadName}
                onChange={(e) => setThreadName(e.target.value)}
                placeholder="Name your workflow..."
                className="w-full text-sm font-medium"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#0A0F1F]">Description</label>
                <span className="text-xs text-[#8E95A9]">Optional</span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe what you want to extract, validate and write..."
                className="w-full px-3.5 py-2.5 bg-white border border-[#CDD2DE] rounded-xl text-xs sm:text-sm text-[#0A0F1F] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#2D55F5] focus:ring-2 focus:ring-[#2D55F5]/15 transition-all resize-none"
              />
            </div>

            {/* Start to point section */}
            <div>
              <label className="block text-xs font-semibold text-[#0A0F1F]">Start to point:</label>
              <p className="text-xs text-[#5F6678] mt-0.5 mb-3">
                Start empty, or pick a domain pack with ready-made steps and rules.
              </p>

              {/* 2x2 Domain Packs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {packs.map((pack) => {
                  const isSelected = selectedPack === pack.id;
                  return (
                    <div
                      key={pack.id}
                      onClick={() => handleSelectPack(pack)}
                      className={`p-3.5 rounded-[16px] border transition-all cursor-pointer flex items-start justify-between gap-2.5 ${
                        isSelected
                          ? 'border-[#2D55F5] bg-[#F5F8FF] shadow-[0_0_0_3px_rgba(45,85,245,0.12)]'
                          : 'border-[#E3E6EE] bg-white hover:border-[#CDD2DE] hover:bg-[#F9FAFC]'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-[10px] bg-white border border-[#E3E6EE] flex items-center justify-center shrink-0 mt-0.5">
                          {pack.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-[#0A0F1F] leading-tight truncate">
                              {pack.title}
                            </h4>
                            {pack.badge && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-600 border border-blue-200 shrink-0">
                                {pack.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#5F6678] mt-1 leading-snug">
                            {pack.desc}
                          </p>
                        </div>
                      </div>

                      {/* Radio Indicator */}
                      <div className="shrink-0 mt-0.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-[#2D55F5] bg-[#2D55F5]'
                              : 'border-[#CDD2DE] bg-white'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Help Note */}
              <p className="text-[11px] text-[#5F6678] mt-3 flex items-center gap-1.5">
                <span>💡</span> Don't see your domain? Start from scratch. More domain packs are on the way.
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#F0F2F6]">
            <Link to="workflows">
              <Button variant="ghost" size="md">
                Cancel
              </Button>
            </Link>
            <Button variant="primary" size="md" type="submit">
              Create workflow →
            </Button>
          </div>
        </form>
      </main>

      {/* Bottom Footer Note */}
      <footer className="w-full bg-white border-t border-[#E3E6EE] px-6 py-3">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between text-xs text-[#8E95A9]">
          <span>💡 You can change everything later.</span>
          <div className="flex items-center gap-4">
            <Link to="workflows" className="hover:text-[#0A0F1F] transition-colors">Workflows</Link>
            <span>·</span>
            <Link to="history" className="hover:text-[#0A0F1F] transition-colors">Runs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
