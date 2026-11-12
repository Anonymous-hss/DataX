import React, { useState, useEffect } from 'react';
import DataXAppShell from '../components/common/DataXAppShell';
import { useNavigation } from '../context/NavigationContext';
import { useRuleEngine } from '../context/RuleEngineContext';
import ConfirmDialog from '../components/common/ConfirmDialog';
import UseCaseAdvisorModal from '../components/common/UseCaseAdvisorModal';
import StartThreadModal from '../components/threads/StartThreadModal';

// Modular Subcomponents matching exact Screenshot
import {
  WorkflowsHeader,
  WorkflowsHeroBanner,
  UseCasesSection,
  WorkflowsFilterBar,
  WorkflowCard,
  CreateCustomWorkflowCard,
  WorkflowsEmptyState
} from '../components/workflows';

// --- Domain Icons matching Screenshot (strictly uniform 20x20) ---
const ErpModernisationIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2D55F5" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <ellipse cx="12" cy="5" rx="8" ry="3" fill="#EEF2FF" />
    <path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
    <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
  </svg>
);

const Customer360Icon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <polygon points="12 2 2 7 12 12 22 7 12 2" fill="#ECFDF5" />
    <polyline points="2 12 12 17 22 12" />
    <polyline points="2 17 12 22 22 17" />
  </svg>
);

const FinanceAuditIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <rect width="20" height="14" x="2" y="5" rx="2" fill="#EEF2FF" />
    <line x1="2" x2="22" y1="10" y2="10" />
  </svg>
);

const HealthcareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <circle cx="12" cy="7" r="4" fill="#FEF3C7" />
    <path d="M6 21v-2a6 6 0 0 1 12 0v2" />
  </svg>
);

const SupplyChainIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <ellipse cx="12" cy="7" rx="9" ry="3.5" fill="#E0F2FE" />
    <path d="M3 7v10c0 1.93 4.03 3.5 9 3.5s9-1.57 9-3.5V7" />
  </svg>
);

// Standard 5 Baseline Workflows matching exact Screenshot
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
    filterTag: 'live',
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
    filterTag: 'live',
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
    executeDryRun 
  } = ruleEngine;

  // Defaults to 'all' to show all 5 ready workflows matching screenshot
  const [filter, setFilter] = useState('all'); 
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
          health: 95.0,
          runsCount: 1,
          status: t.status === 'live' ? 'Live' : 'Draft',
          filterTag: t.status === 'live' ? 'live' : 'draft',
          icon: ErpModernisationIcon
        });
      }
    });
  }

  // Filter workflows matching active tab ('all' | 'live' | 'draft')
  const filteredWorkflows = activeWorkflows.filter((wf) => {
    if (filter === 'live') {
      const isLiveOrBelow = wf.filterTag === 'live' || wf.status.toLowerCase() === 'live' || wf.status.toLowerCase().includes('below');
      if (!isLiveOrBelow) return false;
    }
    if (filter === 'draft') {
      const isDraft = wf.filterTag === 'draft' || wf.status.toLowerCase() === 'draft';
      if (!isDraft) return false;
    }

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

  return (
    <DataXAppShell onSwitchToMarketing={onSwitchToMarketing}>
      <div className="max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-10 py-8 space-y-7 font-sans">
        
        {/* 1. Page Header: Title, Subtitle & + New thread CTA matching Screenshot */}
        <WorkflowsHeader 
          onNewThread={() => setIsStartThreadModalOpen(true)}
          onOpenAdvisor={() => setAdvisorOpen(true)} 
        />

        {/* 2. Hero Dark Banner with exact background gradient and metrics matching Screenshot */}
        <WorkflowsHeroBanner 
          activeCount={3}
          totalCount={activeWorkflows.length || 5}
          meanHealth="87.1"
          totalRuns={69}
          autoFixEnabled={autoFixEnabled ?? true}
        />

        {/* 2.5 Start from a use case section matching Image 1 */}
        <UseCasesSection 
          onOpenCanvas={handleOpenCanvas}
          onOpenFirewall={() => navigateTo('ai-firewall')}
          onOpenMlGate={() => navigateTo('ml-certification')}
          onOpenAdvisor={() => setAdvisorOpen(true)}
        />

        {/* 3. Search & Segmented Filter Bar directly below banner matching Screenshot */}
        <WorkflowsFilterBar 
          search={search}
          setSearch={setSearch}
          filter={filter}
          setFilter={setFilter}
          filteredCount={filteredWorkflows.length}
          totalCount={activeWorkflows.length}
        />

        {/* 4. Workflow Content Area: 4-Column Cards Grid matching Screenshot */}
        {filteredWorkflows.length === 0 && search ? (
          <WorkflowsEmptyState 
            onShowReady={() => {
              setFilter('all');
              setSearch('');
            }}
            onNewWorkflow={() => setIsStartThreadModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredWorkflows.map((workflow) => (
              <WorkflowCard 
                key={workflow.id}
                workflow={workflow}
                onOpenCanvas={handleOpenCanvas}
                onRunDryRun={handleRunDryRun}
                onDelete={(wf) => setThreadToDelete(wf)}
              />
            ))}

            {/* 4th Slot: Start a new thread Action Card */}
            <CreateCustomWorkflowCard 
              onOpenCanvas={() => navigateTo('canvas')}
              onNewThread={() => setIsStartThreadModalOpen(true)}
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
