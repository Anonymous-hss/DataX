import React, { useState } from 'react';
import DataXAppShell from "../components/common/DataXAppShell";
import { useNavigation } from '../context/NavigationContext';
import { useRuleEngine } from '../context/RuleEngineContext';
import { 
  ArrowLeft, 
  GitBranch, 
  Info, 
  FileText, 
  Database, 
  Layers, 
  FlaskConical, 
  Cloud 
} from 'lucide-react';

export default function StartAThreadPage({ onSwitchToMarketing } = {}) {
  const { navigateTo } = useNavigation();
  const { selectThread, setActiveThread } = useRuleEngine();
  
  const [threadName, setThreadName] = useState('SAP BW → S/4HANA Clean Core');
  const [description, setDescription] = useState('Extract InfoCube purchasing lines, fix legacy plant codes and stage clean orders.');
  const [selectedPack, setSelectedPack] = useState('sap');

  const packs = [
    {
      id: 'scratch',
      title: 'Start from scratch',
      desc: 'Empty canvas or bespoke sources',
      badge: 'Custom',
      badgeClass: 'bg-[#F1F3F9] text-[#5F6678] border-[#E3E6EE]',
      icon: <FileText className="w-5 h-5 text-[#5F6678]" />
    },
    {
      id: 'sap',
      title: 'SAP BW → S/4HANA Clean Core',
      desc: 'InfoCube → S/4HANA BAPI · 5 rules',
      badge: null,
      icon: (
        <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
          <ellipse cx="14" cy="7" rx="10" ry="3.5" fill="#D4FF3A" stroke="#0A0F1F" strokeWidth="1.75" />
          <path d="M4 7v6c0 1.93 4.48 3.5 10 3.5s10-1.57 10-3.5V7" stroke="#0A0F1F" strokeWidth="1.75" fill="none" />
          <path d="M4 13v6c0 1.93 4.48 3.5 10 3.5s10-1.57 10-3.5v-6" stroke="#0A0F1F" strokeWidth="1.75" fill="none" />
          <circle cx="9" cy="13" r="1.5" fill="#127A52" />
          <circle cx="14" cy="13" r="1.5" fill="#127A52" />
          <circle cx="19" cy="13" r="1.5" fill="#127A52" />
        </svg>
      )
    },
    {
      id: 'ledger',
      title: 'Financial GL & SOX 404 Audit',
      desc: 'Debits = Credits → BigQuery · 4 rules',
      badge: 'Tier 2',
      badgeClass: 'bg-[#EEF2FF] text-[#2D55F5] border-[#DCE4FF]',
      icon: <Layers className="w-5 h-5 text-[#2D55F5]" />
    },
    {
      id: 'customer',
      title: 'Customer Master 360 & Vector',
      desc: 'MongoDB → Vector matcher → Neon · 4 rules',
      badge: 'Tier 1',
      badgeClass: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <polygon points="12 2 2 7 12 12 22 7 12 2" fill="#00ED64" fillOpacity="0.25" stroke="#00A344" strokeWidth="1.75" strokeLinejoin="round" />
          <polyline points="2 12 12 17 22 12" stroke="#00A344" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="2 17 12 22 22 17" stroke="#00A344" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      id: 'rag',
      title: 'Policy RAG & Legal Contracts',
      desc: 'AWS S3 → RAG enricher → Pinecone · 4 rules',
      badge: 'Tier 3',
      badgeClass: 'bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]',
      icon: <FlaskConical className="w-5 h-5 text-[#7C3AED]" />
    },
    {
      id: 'sfdc',
      title: 'Salesforce CRM → BigQuery',
      desc: 'Salesforce leads → BigQuery API · 4 rules',
      badge: 'Tier 2',
      badgeClass: 'bg-[#EEF2FF] text-[#2D55F5] border-[#DCE4FF]',
      icon: <Cloud className="w-5 h-5 text-[#2D55F5]" />
    }
  ];

  const handleSelectPack = (pack) => {
    setSelectedPack(pack.id);
    if (pack.id === 'sap') {
      setThreadName('SAP BW → S/4HANA Clean Core');
      setDescription('Extract InfoCube purchasing lines, fix legacy plant codes and stage clean orders.');
    } else if (pack.id === 'ledger') {
      setThreadName('Financial GL & SOX 404 Audit');
      setDescription('Debits = Credits zero imbalance verification, ISO currency cross-checks and ledger staging.');
    } else if (pack.id === 'customer') {
      setThreadName('Customer Master 360 & Vector');
      setDescription('Harmonize customer documents from MongoDB Atlas into Neon and enforce RFC-5322 email syntax.');
    } else if (pack.id === 'rag') {
      setThreadName('Policy RAG & Legal Contracts');
      setDescription('Ingest legal PDFs from AWS S3, compute cosine embeddings, and sync vector indices to Pinecone.');
    } else if (pack.id === 'sfdc') {
      setThreadName('Salesforce CRM → BigQuery');
      setDescription('Extract sales leads, enforce enterprise domain rules, and stream verified accounts to BigQuery.');
    } else {
      setThreadName('Custom Data Pipeline');
      setDescription('Connect bespoke database endpoints, configure custom LLM transformation rules, and define target mappings.');
    }
  };

  const handleCreateWorkflow = (e) => {
    e.preventDefault();
    let packKey = 'sap_bw_s4hana';
    if (selectedPack === 'customer') packKey = 'customer_master_reconciliation';
    else if (selectedPack === 'ledger') packKey = 'financial_gl_ledger';
    else if (selectedPack === 'rag') packKey = 'enterprise_rag_knowledge';
    else if (selectedPack === 'sfdc') packKey = 'salesforce_crm_bigquery';
    else if (selectedPack === 'scratch') packKey = 'sap_bw_s4hana';

    if (selectThread) {
      selectThread(packKey);
    }
    if (setActiveThread) {
      setActiveThread(prev => ({
        ...prev,
        name: threadName,
        desc: description
      }));
    }

    // Direct transition to interactive Visual Canvas
    navigateTo('canvas');
  };

  return (
    <DataXAppShell onSwitchToMarketing={onSwitchToMarketing}>
      {/* Sub-header with Back Arrow, Draft Tag, and Not Saved Yet */}
      <div className="w-full bg-white dark:bg-[#18181C] border-b border-[#E3E6EE] dark:border-white/[0.08] px-6 py-3">
        <div className="max-w-[1440px] w-full mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigateTo('workflows')}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#474E61] dark:text-slate-300 hover:bg-[#F5F6FA] dark:hover:bg-white/[0.08] transition-colors cursor-pointer border border-[#E3E6EE] dark:border-white/[0.08]"
            title="Back to workflows"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#0A0F1F] dark:text-white">New workflow</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EDEFF5] dark:bg-white/[0.08] text-[#5F6678] dark:text-slate-300 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8E95A9]" />
                Draft
              </span>
            </div>
            <span className="text-[11px] text-[#8E95A9] dark:text-slate-500 font-medium">Not saved yet</span>
          </div>
        </div>
      </div>

      {/* Main Centered Form Card (Matches SS 2 Frame 01.2 exact layout) */}
      <main className="flex-1 max-w-[700px] w-full mx-auto px-4 sm:px-6 py-8">
        <form 
          onSubmit={handleCreateWorkflow} 
          className="bg-white dark:bg-[#18181C] border border-[#E3E6EE] dark:border-white/[0.08] rounded-[24px] p-7 sm:p-9 shadow-sm space-y-6"
        >
          {/* Header Inside Card */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#EEF2FF] dark:bg-blue-950/40 border border-[#DCE4FF] dark:border-blue-800/40 flex items-center justify-center text-[#2D55F5] shrink-0">
              <GitBranch className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-xs text-[#5F6678] dark:text-slate-400 font-medium">New workflow</span>
              <h1 className="text-2xl font-bold text-[#0A0F1F] dark:text-white tracking-tight leading-tight">
                Start a workflow
              </h1>
            </div>
          </div>

          {/* Form Inputs */}
          <div className="space-y-5">
            {/* Field 1: Workflow name */}
            <div>
              <label className="block text-xs font-semibold text-[#0A0F1F] dark:text-white mb-2">
                Workflow name
              </label>
              <input
                type="text"
                value={threadName}
                onChange={(e) => setThreadName(e.target.value)}
                placeholder="Name your workflow..."
                required
                className="w-full px-4 py-2.5 bg-white dark:bg-[#121215] border border-[#CDD2DE] dark:border-white/[0.12] rounded-xl text-sm font-medium text-[#0A0F1F] dark:text-white focus:outline-none focus:border-[#2D55F5] focus:ring-2 focus:ring-[#2D55F5]/15 transition-all"
              />
            </div>

            {/* Field 2: Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-[#0A0F1F] dark:text-white">
                  Description
                </label>
                <span className="text-xs text-[#8E95A9] dark:text-slate-500 font-medium">Optional</span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Extract InfoCube purchasing lines, fix legacy plant codes and stage clean orders."
                className="w-full px-4 py-2.5 bg-white dark:bg-[#121215] border border-[#CDD2DE] dark:border-white/[0.12] rounded-xl text-xs sm:text-sm text-[#0A0F1F] dark:text-white focus:outline-none focus:border-[#2D55F5] focus:ring-2 focus:ring-[#2D55F5]/15 transition-all resize-none"
              />
            </div>

            {/* Field 3: Starting point */}
            <div>
              <label className="block text-xs font-semibold text-[#0A0F1F] dark:text-white">
                Starting point
              </label>
              <p className="text-xs text-[#5F6678] dark:text-slate-400 mt-0.5 mb-3.5">
                Start empty, or pick a domain pack with ready-made steps and rules.
              </p>

              {/* 2-Column Domain Grid (6 items) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {packs.map((pack) => {
                  const isSelected = selectedPack === pack.id;
                  return (
                    <div
                      key={pack.id}
                      onClick={() => handleSelectPack(pack)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-2.5 select-none ${
                        isSelected
                          ? 'border-[#2D55F5] bg-[#F5F8FF] dark:bg-blue-950/25 shadow-[0_0_0_1px_rgba(45,85,245,0.2)]'
                          : 'border-[#E3E6EE] dark:border-white/[0.08] bg-white dark:bg-[#121215] hover:border-[#CDD2DE] dark:hover:border-white/[0.16] hover:bg-[#F9FAFC] dark:hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-white dark:bg-[#18181C] border border-[#E3E6EE] dark:border-white/[0.08] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          {pack.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs font-bold text-[#0A0F1F] dark:text-white leading-tight truncate">
                              {pack.title}
                            </h4>
                            {pack.badge && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${pack.badgeClass || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                {pack.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#5F6678] dark:text-slate-400 mt-1 leading-snug line-clamp-2">
                            {pack.desc}
                          </p>
                        </div>
                      </div>

                      {/* Radio Selection Indicator */}
                      <div className="shrink-0 mt-0.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'border-[#2D55F5] bg-[#2D55F5]'
                              : 'border-[#CDD2DE] dark:border-white/[0.2] bg-white dark:bg-[#18181C]'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Informational Banner */}
              <div className="mt-3.5 p-3 rounded-xl bg-[#F8FAFC] dark:bg-white/[0.03] border border-[#E3E6EE] dark:border-white/[0.08] flex items-center gap-2.5 text-xs text-[#5F6678] dark:text-slate-400">
                <Info className="w-4 h-4 text-[#8E95A9] shrink-0" />
                <span>Don't see your domain? Start from scratch. More domain packs are on the way.</span>
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="pt-4 flex items-center justify-between border-t border-[#F0F2F6] dark:border-white/[0.08]">
            <span className="text-xs text-[#8E95A9] dark:text-slate-500">
              You can change everything later.
            </span>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => navigateTo('workflows')}
                className="px-4 py-2 rounded-full border border-transparent hover:bg-slate-100 dark:hover:bg-white/[0.05] text-xs font-semibold text-[#5F6678] dark:text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className="px-5 py-2.5 rounded-full bg-[#2D55F5] hover:bg-[#1E44D6] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Create workflow →</span>
              </button>
            </div>
          </div>
        </form>
      </main>
    </DataXAppShell>
  );
}
