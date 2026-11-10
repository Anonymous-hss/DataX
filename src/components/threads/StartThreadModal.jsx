import React, { useState } from 'react';
import { useNavigation } from '../../context/NavigationContext';
import { useRuleEngine } from '../../context/RuleEngineContext';
import { X, ArrowRight, Info } from 'lucide-react';

// =========================================================================
// OFFICIAL BRAND LOGOS (High-Fidelity Vectors)
// =========================================================================

// Start from scratch / Custom
const StartFromScratchIcon = () => (
  <div className="relative flex items-center justify-center">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2D55F5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#2D55F5] text-white flex items-center justify-center text-[9px] font-bold shadow-2xs">
      +
    </span>
  </div>
);

// Official SAP Logo
const OfficialSapLogo = ({ size = 26 }) => (
  <svg width={size} height={size * 0.52} viewBox="0 0 54 28" fill="none" className="shrink-0">
    <path d="M0 0h34l20 28H0V0z" fill="#007DB8" />
    <path d="M34 0h20L34 28H14L34 0z" fill="#005B94" opacity="0.6" />
    <text x="6" y="19" fontFamily="Arial, Helvetica, sans-serif" fontSize="13" fontWeight="900" fill="#FFFFFF" letterSpacing="1">
      SAP
    </text>
  </svg>
);

// Official Financial Audit / BigQuery Logo
const FinancialAuditLogo = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0">
    <rect width="24" height="24" rx="6" fill="#EEF2FF" />
    <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z" stroke="#2D55F5" strokeWidth="1.5" />
    <path d="M8 12h8M8 8h5M8 16h4" stroke="#2D55F5" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="17" cy="15" r="4.5" fill="#10B981" />
    <polyline points="15.5 15 16.5 16 18.5 14" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Official MongoDB Leaf Logo
const OfficialMongoLogo = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0">
    <path d="M12 1.5C11.5 2 7 8 7 14c0 3 2 6 5 8.5 3-2.5 5-5.5 5-8.5 0-6-4.5-12-5-12.5z" fill="#00ED64" />
    <path d="M12 1.5v21c3-2.5 5-5.5 5-8.5 0-6-4.5-12-5-12.5z" fill="#00C450" />
    <path d="M12 2.5v19.5c-.3-.2-.6-.4-.9-.7C9.3 19.3 8 16.8 8 14c0-4.8 3.3-9.7 4-11.5z" fill="#00684A" opacity="0.3" />
  </svg>
);

// Official AWS S3 Logo
const OfficialS3Logo = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0">
    <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" fill="#E05243" />
    <path d="M12 2l9 5-9 5-9-5 9-5z" fill="#FF7F66" />
    <path d="M12 12v10l9-5V7l-9 5z" fill="#C93B2B" />
    <path d="M12 12L3 7v10l9 5V12z" fill="#B32B1C" />
    <path d="M7 9l5 2.8L17 9" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

// Official Salesforce Cloud Logo
const OfficialSalesforceLogo = ({ size = 24 }) => (
  <svg width={size} height={size * 0.7} viewBox="0 0 100 70" fill="none" className="shrink-0">
    <path
      d="M41.7 13.5c4.7-6.9 12.8-11.4 22-11.4 12.3 0 22.8 8.1 26.2 19.4 3.7 1.8 6.9 4.6 9.2 8.1 3.2 4.9 4.9 10.7 4.9 16.7 0 16.3-13.2 29.5-29.5 29.5H23.5C10.5 75.8 0 65.3 0 52.3c0-10.4 6.8-19.3 16.3-22.3 0-.7-.1-1.4-.1-2.1 0-14.7 11.9-26.6 26.6-26.6 9.7 0 18.2 5.2 22.8 13"
      fill="#00A1E0"
    />
  </svg>
);

// Healthcare Shield Logo (Extended pack)
const HealthcareShieldLogo = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0">
    <path d="M12 2L4 5v6.5C4 16.5 7.5 21 12 22c4.5-1 8-5.5 8-10.5V5l-8-3z" fill="#EEF2FF" stroke="#336791" strokeWidth="1.75" />
    <line x1="12" y1="8" x2="12" y2="16" stroke="#336791" strokeWidth="2" strokeLinecap="round" />
    <line x1="8" y1="12" x2="16" y2="12" stroke="#336791" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Snowflake Logo (Extended pack)
const SnowflakeLogo = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0">
    <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" stroke="#29B5E8" strokeWidth="1.75" strokeLinecap="round" />
    <circle cx="12" cy="12" r="2.5" fill="#29B5E8" />
  </svg>
);

export default function StartThreadModal({ isOpen, onClose }) {
  const { navigateTo } = useNavigation();
  const { selectThread, setActiveThread, setWorkflowNodes, setWorkflowEdges } = useRuleEngine();

  const [selectedPack, setSelectedPack] = useState('sap');
  const [threadName, setThreadName] = useState('User records clean-up');
  const [description, setDescription] = useState(
    'Check user records from production_db (email, name, role, status) and write clean rows to reconciled_db.'
  );
  const [showAllPacks, setShowAllPacks] = useState(false);

  // 6 Primary Domain Packs (Requested by User)
  const primaryPacks = [
    {
      id: 'scratch',
      title: 'Start from scratch',
      badge: 'Custom',
      desc: 'Start empty canvas or connect bespoke sources.',
      icon: <StartFromScratchIcon />,
      defaultName: 'Custom Pipeline & Zero-Egress Rules',
      defaultDesc: 'Connect bespoke database endpoints, compile custom deterministic AST validation rules, and configure target sink.'
    },
    {
      id: 'sap',
      title: 'SAP BW → S/4HANA Clean Core',
      badge: 'Tier 1',
      desc: 'InfoCube → S/4HANA BAPI · 5 rules',
      icon: <OfficialSapLogo size={24} />,
      defaultName: 'SAP BW → S/4HANA Clean Core',
      defaultDesc: 'Extract InfoCube purchasing lines, resolve legacy plant codes via plant ontology, split high-value purchase orders for human review, and commit verified orders into S/4HANA via BAPI.'
    },
    {
      id: 'ledger',
      title: 'Financial GL & SOX 404 Audit',
      badge: 'Tier 1',
      desc: 'Debits = Credits → BigQuery · 4 rules',
      icon: <FinancialAuditLogo size={20} />,
      defaultName: 'Financial GL & SOX 404 Audit',
      defaultDesc: 'Audit general ledger journal entries, enforce Debits = Credits zero balance, and stage verified entries to BigQuery.'
    },
    {
      id: 'customer',
      title: 'Customer Master 360 & Vector',
      badge: 'Tier 2',
      desc: 'MongoDB → Vector Matcher → Neon · 4 rules',
      icon: <OfficialMongoLogo size={20} />,
      defaultName: 'Customer Master 360 & Vector',
      defaultDesc: 'Harmonize duplicate customer accounts using cosine vector embeddings and write golden records to Neon PostgreSQL.'
    },
    {
      id: 'rag',
      title: 'Policy RAG & Legal Contracts',
      badge: 'Tier 2',
      desc: 'AWS S3 → RAG Enricher → Pinecone · 4 rules',
      icon: <OfficialS3Logo size={20} />,
      defaultName: 'Policy RAG & Legal Contracts',
      defaultDesc: 'Ingest enterprise contracts from AWS S3, retrieve compliance policy context, and index vector embeddings to Pinecone.'
    },
    {
      id: 'sfdc',
      title: 'Salesforce CRM → BigQuery',
      badge: 'Tier 3',
      desc: 'Salesforce Leads → BigQuery API · 4 rules',
      icon: <OfficialSalesforceLogo size={24} />,
      defaultName: 'Salesforce CRM → BigQuery',
      defaultDesc: 'Cleanse corporate lead emails, route enterprise deals, and stream pipeline records to BigQuery API.'
    }
  ];

  // Extended domain pack options to preserve all existing catalog capabilities
  const extendedPacks = [
    {
      id: 'healthcare',
      title: 'Healthcare Patient Master',
      badge: 'Tier 2',
      desc: 'HIPAA Sanitizer → Redacted Analytics Sink · 5 rules',
      icon: <HealthcareShieldLogo size={20} />,
      defaultName: 'Healthcare Patient Master (HIPAA Safe)',
      defaultDesc: 'Mask MRNs, patient names, and addresses with AES-GCM tokenization before exporting clean data to research sinks.'
    },
    {
      id: 'snowflake',
      title: 'Snowflake Procurement Parity',
      badge: 'Tier 3',
      desc: 'Snowflake RAW → Clean Core Mart · 4 rules',
      icon: <SnowflakeLogo size={20} />,
      defaultName: 'Snowflake Procurement Parity',
      defaultDesc: 'Stream procurement lines from Snowflake RAW schema and enforce vendor ID and payment term compliance.'
    }
  ];

  const allDisplayPacks = showAllPacks ? [...primaryPacks, ...extendedPacks] : primaryPacks;

  const handleSelectPack = (pack) => {
    setSelectedPack(pack.id);
    setThreadName(pack.defaultName);
    setDescription(pack.defaultDesc);
  };

  const handleCreateThread = (e) => {
    if (e) e.preventDefault();

    let targetTemplateKey = 'sap_bw_s4hana';
    if (selectedPack === 'sap') targetTemplateKey = 'sap_bw_s4hana';
    else if (selectedPack === 'ledger') targetTemplateKey = 'financial_gl_ledger';
    else if (selectedPack === 'customer') targetTemplateKey = 'customer_master_reconciliation';
    else if (selectedPack === 'rag') targetTemplateKey = 'enterprise_rag_knowledge';
    else if (selectedPack === 'sfdc') targetTemplateKey = 'salesforce_crm_bigquery';
    else if (selectedPack === 'healthcare') targetTemplateKey = 'healthcare_hipaa_clinical';
    else if (selectedPack === 'snowflake') targetTemplateKey = 'snowflake_s4hana_procurement';
    else if (selectedPack === 'scratch') {
      // Empty canvas mode
      if (setWorkflowNodes) setWorkflowNodes([]);
      if (setWorkflowEdges) setWorkflowEdges([]);
      if (setActiveThread) {
        setActiveThread({
          id: `custom_thread_${Date.now()}`,
          name: threadName || 'Custom Thread',
          desc: description || 'Start empty canvas or connect bespoke sources.',
          nodes: [],
          edges: [],
          status: 'draft',
          statusLabel: 'Draft',
          runCount: 0,
          healthScore: null
        });
      }
      onClose();
      navigateTo('canvas');
      return;
    }

    if (selectThread) {
      selectThread(targetTemplateKey);
    }
    if (setActiveThread) {
      setActiveThread(prev => ({
        ...prev,
        name: threadName || prev?.name,
        desc: description || prev?.desc
      }));
    }

    onClose();
    navigateTo('canvas');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#18181C] rounded-[24px] border border-slate-200/90 dark:border-white/[0.1] shadow-2xl w-full max-w-[680px] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col my-auto max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =====================================================================
            1. MODAL HEADER: COMPACT & RESPONSIVE
        ===================================================================== */}
        <div className="px-5 sm:px-6 pt-5 pb-3.5 flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2D55F5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="6" r="3" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="12" r="3" />
                <path d="M6 9v6" />
                <path d="M9 6h4a5 5 0 0 1 5 5v1" />
              </svg>
            </div>
            <div>
              <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                New thread
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                Start a thread
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* =====================================================================
            2. MODAL BODY (Seamless auto-fit, no awkward overflow)
        ===================================================================== */}
        <div className="px-5 sm:px-6 py-4 overflow-y-auto space-y-3.5">
          
          {/* Thread name input */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Thread name
            </label>
            <input
              type="text"
              value={threadName}
              onChange={(e) => setThreadName(e.target.value)}
              placeholder="e.g. User records clean-up"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#121215] text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-[#2D55F5] focus:ring-2 focus:ring-[#2D55F5]/20 shadow-2xs transition-all"
            />
          </div>

          {/* Description (Optional) */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Description
              </label>
              <span className="text-[10px] text-slate-400 font-normal">
                Optional
              </span>
            </div>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Check user records from production_db (email, name, role, status) and write clean rows to reconciled_db."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#121215] text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#2D55F5] focus:ring-2 focus:ring-[#2D55F5]/20 shadow-2xs transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Starting point Section */}
          <div className="space-y-2 pt-0.5">
            <div>
              <h3 className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Starting point
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Start empty, or pick a domain pack with ready-made steps and rules.
              </p>
            </div>

            {/* Responsive 2-Column Bento Grid matching Reference SVG */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {allDisplayPacks.map((pack) => {
                const isSelected = selectedPack === pack.id;

                return (
                  <div
                    key={pack.id}
                    onClick={() => handleSelectPack(pack)}
                    className={`rounded-xl p-3 border transition-all cursor-pointer relative flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-[#2D55F5] bg-[#F5F8FF] dark:bg-blue-500/10 shadow-xs ring-1 ring-[#2D55F5]'
                        : 'border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141417] hover:border-slate-300 dark:hover:border-white/[0.16] hover:bg-slate-50/50'
                    }`}
                  >
                    {/* Left: Brand Icon */}
                    <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.08] flex items-center justify-center shrink-0">
                      {pack.icon}
                    </div>

                    {/* Center: Title + Tier + Description */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
                          {pack.title}
                        </h4>
                        <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300 shrink-0">
                          {pack.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate leading-tight">
                        {pack.desc}
                      </p>
                    </div>

                    {/* Right: Radio Selection Circle */}
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'border-[#2D55F5] bg-white dark:bg-[#18181C]'
                          : 'border-slate-300 dark:border-white/[0.2]'
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-[#2D55F5]" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Info notice box at bottom */}
            <div className="p-2.5 rounded-xl bg-[#F5F8FF] dark:bg-blue-500/10 border border-[#E0EAFF] dark:border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-[#2D55F5] dark:text-blue-300 mt-2">
              <div className="flex items-center gap-2 text-[11px]">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Don't see your domain? Start with an empty canvas. More domain packs are on the way.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAllPacks(!showAllPacks)}
                className="underline font-semibold hover:text-[#2045DC] text-[11px] shrink-0 self-start sm:self-auto cursor-pointer"
              >
                {showAllPacks ? 'Show standard packs' : 'View all 10 templates'}
              </button>
            </div>

          </div>
        </div>

        {/* =====================================================================
            3. MODAL FOOTER
        ===================================================================== */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 dark:border-white/[0.08] bg-slate-50/60 dark:bg-white/[0.02] flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            You can change everything later.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateThread}
              className="bg-[#2D55F5] hover:bg-[#2045DC] text-white px-4 py-2 rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <span>Create thread</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
