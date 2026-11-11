import React, { useState, useEffect } from 'react';
import DataXAppShell from '../components/common/DataXAppShell';
import { useNavigation } from '../context/NavigationContext';
import { useRuleEngine } from '../context/RuleEngineContext';
import ConfirmDialog from '../components/common/ConfirmDialog';
import UseCaseAdvisorModal from '../components/common/UseCaseAdvisorModal';
import StartThreadModal from '../components/threads/StartThreadModal';

// Modular Subcomponents matching 01.1 Workflows Overview
import {
  WorkflowsHeader,
  WorkflowsHeroBanner,
  UseCasesSection,
  WorkflowsFilterBar,
  WorkflowCard,
  CreateCustomWorkflowCard,
  WorkflowsEmptyState
} from '../components/workflows';

// --- Official DataX Brand Logo Squircle (Preserved for cross-page compatibility) ---
export const DataXLogo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className="shrink-0">
    <rect width="64" height="64" rx="16" fill="#2D55F5" />
    <polygon points="14.5,49.5 24.5,49.5 49.5,14.5 39.5,14.5" fill="#FFFFFF" />
    <polygon points="14.5,14.5 24.5,14.5 31.5,24.5 21.5,24.5" fill="#1473E6" />
    <polygon points="32.5,39.5 42.5,39.5 49.5,49.5 39.5,49.5" fill="#1473E6" />
  </svg>
);

// --- Custom Domain Icons matching 01.1 ---
const ErpModernisationIcon = () => (
  <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
    <ellipse cx="14" cy="7" rx="10" ry="3.5" fill="#D4FF3A" stroke="#0A0F1F" strokeWidth="1.75" />
    <path d="M4 7v6c0 1.93 4.48 3.5 10 3.5s10-1.57 10-3.5V7" stroke="#0A0F1F" strokeWidth="1.75" fill="none" />
    <path d="M4 13v6c0 1.93 4.48 3.5 10 3.5s10-1.57 10-3.5v-6" stroke="#0A0F1F" strokeWidth="1.75" fill="none" />
    <circle cx="9" cy="13" r="1.5" fill="#127A52" />
    <circle cx="14" cy="13" r="1.5" fill="#127A52" />
    <circle cx="19" cy="13" r="1.5" fill="#127A52" />
  </svg>
);

const Customer360Icon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <polygon points="12 2 2 7 12 12 22 7 12 2" fill="#00ED64" fillOpacity="0.25" stroke="#00A344" strokeWidth="1.75" strokeLinejoin="round" />
    <polyline points="2 12 12 17 22 12" stroke="#00A344" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="2 17 12 22 22 17" stroke="#00A344" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FinanceAuditIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <polygon points="12 2 2 7 12 12 22 7 12 2" fill="#EEF2FF" stroke="#2D55F5" strokeWidth="1.75" strokeLinejoin="round" />
    <polyline points="2 12 12 17 22 12" stroke="#2D55F5" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="2 17 12 22 22 17" stroke="#2D55F5" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const HealthcareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L4 5v6.5C4 16.5 7.5 21 12 22c4.5-1 8-5.5 8-10.5V5l-8-3z" fill="#EEF2FF" stroke="#336791" strokeWidth="1.75" strokeLinejoin="round" />
    <line x1="12" y1="8" x2="12" y2="16" stroke="#336791" strokeWidth="2" strokeLinecap="round" />
    <line x1="8" y1="12" x2="16" y2="12" stroke="#336791" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const SupplyChainIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <ellipse cx="12" cy="7" rx="9" ry="3.5" fill="#EEF2FF" stroke="#0A0F1F" strokeWidth="1.75" />
    <path d="M3 7v10c0 1.93 4.03 3.5 9 3.5s9-1.57 9-3.5V7" stroke="#0A0F1F" strokeWidth="1.75" fill="none" />
    <path d="M3 12c0 1.93 4.03 3.5 9 3.5s9-1.57 9-3.5" stroke="#0A0F1F" strokeWidth="1.5" fill="none" />
    <circle cx="8" cy="12" r="1.5" fill="#2D55F5" />
    <circle cx="16" cy="12" r="1.5" fill="#2D55F5" />
  </svg>
);

// Standard 5 Baseline Workflows matching 01.1
export const BASELINE_WORKFLOWS = [
  {
    id: 'sap_bw_s4hana',
    title: 'SAP BW → S/4HANA Clean Core Modernizer',
    domain: 'ERP modernisation',
    description: 'Extract InfoCube purchasing lines, resolve legacy plant codes and stage BAPI_PO_CREATE1 orders.',
    pipelineTag: 'SAP BW → 4 AI rules → S/4HANA',
    rulesCount: 4,
    schemaMappedPercent: 100,
    status: 'Ready to run',
    filterTag: 'live',
    icon: ErpModernisationIcon
  },
  {
    id: 'customer_master_reconciliation',
    title: 'Customer Master & Identity Harmonizer',
    domain: 'Customer 360',
    description: 'Harmonize customer documents from MongoDB Atlas into PostgreSQL and enforce RFC-5322 email syntax.',
    pipelineTag: 'MongoDB → 5 AI rules → PostgreSQL',
    rulesCount: 5,
    schemaMappedPercent: 100,
    status: 'Ready to run',
    filterTag: 'live',
    icon: Customer360Icon
  },
  {
    id: 'financial_gl_ledger',
    title: 'Financial General Ledger & AP Compliance',
    domain: 'Finance & audit',
    description: 'Audit GL and AP entries across legacy systems, guarantee zero imbalance and verify ISO currency codes.',
    pipelineTag: 'ERP GL → 6 AI rules → BigQuery',
    rulesCount: 6,
    schemaMappedPercent: 100,
    status: 'Ready to run',
    filterTag: 'draft',
    icon: FinanceAuditIcon
  },
  {
    id: 'healthcare_hipaa',
    title: 'Healthcare Patient Master & HIPAA Sanitizer',
    domain: 'Healthcare',
    description: 'Ingest HL7 and EHR records, scrub PII and cross-verify National Provider Identifiers.',
    pipelineTag: 'PostgreSQL → 4 AI rules → Warehouse',
    rulesCount: 4,
    schemaMappedPercent: 100,
    status: 'Ready to run',
    filterTag: 'draft',
    icon: HealthcareIcon
  },
  {
    id: 'supply_chain_inventory',
    title: 'Supply Chain Multi-Echelon Inventory Balancer',
    domain: 'Supply chain',
    description: 'Reconcile warehouse counts with distribution-centre POs and resolve SKU naming discrepancies.',
    pipelineTag: 'AWS S3 → 5 AI rules → S/4HANA',
    rulesCount: 5,
    schemaMappedPercent: 100,
    status: 'Ready to run',
    filterTag: 'live',
    icon: SupplyChainIcon
  }
];

export default function ThreadsPage({ onOpenLegacyPoc, onSwitchToMarketing } = {}) {
  const { navigateTo } = useNavigation();
  const ruleEngine = useRuleEngine?.() || {};
  const { 
    threads: contextThreads, 
    selectThread, 
    deleteThread, 
    autoFixEnabled, 
    setAutoFixEnabled,
    executeDryRun 
  } = ruleEngine;

  const [filter, setFilter] = useState('all'); // 'all' | 'live' | 'draft'
  const [search, setSearch] = useState('');
  const [isStartThreadModalOpen, setIsStartThreadModalOpen] = useState(false);
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState(null);

  // Listen for global custom events to open start workflow modal
  useEffect(() => {
    const handleOpenModal = () => setIsStartThreadModalOpen(true);
    window.addEventListener('open-start-thread-modal', handleOpenModal);
    return () => window.removeEventListener('open-start-thread-modal', handleOpenModal);
  }, []);

  // Map baseline workflows with any user-customized threads in context
  const activeWorkflows = BASELINE_WORKFLOWS.map((base) => {
    const matchedThread = contextThreads?.find(
      t => t.id === base.id || t.domainPackId === base.id || t.name === base.title
    );
    if (!matchedThread) return base;

    return {
      ...base,
      rulesCount: matchedThread.rules?.length || base.rulesCount,
      status: matchedThread.status === 'live' ? 'Live' : base.status
    };
  });

  // Also include any user-created custom threads that aren't in the baseline 5
  if (Array.isArray(contextThreads)) {
    contextThreads.forEach(t => {
      const isBaseline = BASELINE_WORKFLOWS.some(b => b.id === t.id || b.id === t.domainPackId);
      if (!isBaseline && t.id) {
        activeWorkflows.push({
          id: t.id,
          title: t.name || 'Custom Workflow',
          domain: t.domain || 'Custom Domain',
          description: t.desc || 'Custom autonomous CleanFlow pipeline with node-based orchestration.',
          pipelineTag: t.pipeline || 'Source → AI rules → Target',
          rulesCount: t.rules?.length || 4,
          schemaMappedPercent: 100,
          status: t.status === 'live' ? 'Live' : 'Ready to run',
          filterTag: t.status === 'live' ? 'live' : 'draft',
          icon: ErpModernisationIcon
        });
      }
    });
  }

  // Filter workflows
  const filteredWorkflows = activeWorkflows.filter((wf) => {
    if (filter === 'live' && wf.filterTag !== 'live' && wf.status.toLowerCase() !== 'live') return false;
    if (filter === 'draft' && wf.filterTag !== 'draft' && wf.status.toLowerCase() === 'live') return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = wf.title.toLowerCase().includes(q);
      const matchDomain = wf.domain.toLowerCase().includes(q);
      const matchDesc = wf.description.toLowerCase().includes(q);
      const matchTag = wf.pipelineTag.toLowerCase().includes(q);
      return matchTitle || matchDomain || matchDesc || matchTag;
    }

    return true;
  });

  const handleOpenCanvas = (wf) => {
    if (selectThread && wf?.id) {
      selectThread(wf.id);
    }
    navigateTo('canvas');
  };

  const handleRunDryRun = async (wf) => {
    if (selectThread && wf?.id) {
      selectThread(wf.id);
    }
    if (executeDryRun) {
      executeDryRun();
    }
    navigateTo('running-dry-run');
  };

  const handleConfirmDelete = async () => {
    if (!threadToDelete) return;
    try {
      if (deleteThread) {
        await deleteThread(threadToDelete.id);
      }
    } catch (e) {
      console.warn('Delete workflow error:', e);
    }
    setThreadToDelete(null);
  };

  const handleToggleAutoFix = () => {
    if (setAutoFixEnabled) {
      setAutoFixEnabled(!autoFixEnabled);
    }
  };

  return (
    <DataXAppShell onSwitchToMarketing={onSwitchToMarketing}>
      <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-10 py-8 space-y-8 font-sans">
        
        {/* 1. Page Header: Title, Subtitle & Use Case Advisor CTA */}
        <WorkflowsHeader 
          onOpenAdvisor={() => setAdvisorOpen(true)} 
        />

        {/* 2. Hero Dark Banner with AI Rule Builder & Live Metrics (Shown on All overview) */}
        {filter === 'all' && !search && (
          <WorkflowsHeroBanner 
            activeCount={0}
            totalCount={activeWorkflows.length}
            meanHealth="99.2"
            totalRuns={0}
            autoFixEnabled={autoFixEnabled ?? true}
            onToggleAutoFix={handleToggleAutoFix}
          />
        )}

        {/* 3. "Start from a use case" 3-Column Pillar Section (Shown on All overview) */}
        {filter === 'all' && !search && (
          <UseCasesSection 
            onOpenCanvas={() => {
              if (selectThread) selectThread('sap_bw_s4hana');
              navigateTo('canvas');
            }}
            onOpenFirewall={() => navigateTo('ai-firewall')}
            onOpenMlGate={() => navigateTo('ml-certify')}
            onOpenAdvisor={() => setAdvisorOpen(true)}
          />
        )}

        {/* 4. Search & Segmented Filter Bar */}
        <WorkflowsFilterBar 
          search={search}
          setSearch={setSearch}
          filter={filter}
          setFilter={setFilter}
          filteredCount={filteredWorkflows.length}
          totalCount={activeWorkflows.length}
        />

        {/* 5. Workflow Content Area: Empty State vs Cards Grid */}
        {filteredWorkflows.length === 0 ? (
          <WorkflowsEmptyState 
            onShowReady={() => {
              setFilter('all');
              setSearch('');
            }}
            onNewWorkflow={() => navigateTo('new-workflow')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkflows.map((workflow) => (
              <WorkflowCard 
                key={workflow.id}
                workflow={workflow}
                onOpenCanvas={handleOpenCanvas}
                onRunDryRun={handleRunDryRun}
                onDelete={(wf) => setThreadToDelete(wf)}
              />
            ))}

            {/* 6th Slot: Create Custom Workflow Card */}
            <CreateCustomWorkflowCard 
              onOpenCanvas={() => {
                navigateTo('new-workflow');
              }}
            />
          </div>
        )}

      </div>

      {/* Floating Modals */}
      <UseCaseAdvisorModal 
        isOpen={advisorOpen} 
        onClose={() => setAdvisorOpen(false)} 
      />

      <StartThreadModal 
        isOpen={isStartThreadModalOpen} 
        onClose={() => setIsStartThreadModalOpen(false)} 
      />

      <ConfirmDialog 
        isOpen={!!threadToDelete}
        title="Archive Workflow"
        message={`Are you sure you want to archive "${threadToDelete?.title}"? You can restore it anytime from settings.`}
        confirmLabel="Archive"
        onConfirm={handleConfirmDelete}
        onCancel={() => setThreadToDelete(null)}
      />
    </DataXAppShell>
  );
}
