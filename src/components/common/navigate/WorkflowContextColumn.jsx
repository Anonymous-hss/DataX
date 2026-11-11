import React, { useState } from 'react';
import { GitBranch, Check } from 'lucide-react';

export const WORKFLOW_CATALOG = [
  {
    id: 'sap_bw_s4hana',
    title: 'SAP BW → S/4HANA Clean Core',
    rulesCount: 4,
    status: 'Ready',
    filterTag: 'live'
  },
  {
    id: 'customer_master_reconciliation',
    title: 'Customer Master & Identity',
    rulesCount: 5,
    status: 'Ready',
    filterTag: 'live'
  },
  {
    id: 'financial_gl_ledger',
    title: 'Financial GL & AP Compliance',
    rulesCount: 6,
    status: 'Ready',
    filterTag: 'draft'
  },
  {
    id: 'healthcare_hipaa',
    title: 'Healthcare Patient Master',
    rulesCount: 4,
    status: 'Ready',
    filterTag: 'draft'
  },
  {
    id: 'supply_chain_optimization',
    title: 'Supply Chain Inventory Balancer',
    rulesCount: 5,
    status: 'Ready',
    filterTag: 'live'
  }
];

/**
 * WorkflowContextColumn - Right column workflow context and active thread selector (00.12)
 */
export default function WorkflowContextColumn({
  selectedWorkflowId,
  onSelectWorkflow,
  query
}) {
  const [filterTab, setFilterTab] = useState('all');

  const filteredWorkflows = WORKFLOW_CATALOG.filter(wf => {
    // Filter tab
    if (filterTab === 'live' && wf.filterTag !== 'live') return false;
    if (filterTab === 'draft' && wf.filterTag !== 'draft') return false;

    // Search query
    if (query) {
      const q = query.toLowerCase().trim();
      return wf.title.toLowerCase().includes(q) || wf.status.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-3 pl-2">
      {/* Header & Segmented Filter Pill */}
      <div>
        <h3 className="text-[10px] font-bold tracking-wider text-[#5F6678] dark:text-slate-400 uppercase mb-2">
          Workflow Context
        </h3>

        <div className="bg-[#EDEFF5] dark:bg-white/[0.06] p-1 rounded-full flex h-[32px] items-center text-xs">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`flex-1 h-[24px] rounded-full font-semibold transition-all cursor-pointer flex items-center justify-center ${
              filterTab === 'all'
                ? 'bg-white dark:bg-[#2A2B32] text-[#0A0F1F] dark:text-white shadow-2xs'
                : 'text-[#5F6678] dark:text-slate-400 hover:text-[#0A0F1F]'
            }`}
          >
            All (5)
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('live')}
            className={`flex-1 h-[24px] rounded-full font-semibold transition-all cursor-pointer flex items-center justify-center ${
              filterTab === 'live'
                ? 'bg-white dark:bg-[#2A2B32] text-[#0A0F1F] dark:text-white shadow-2xs'
                : 'text-[#5F6678] dark:text-slate-400 hover:text-[#0A0F1F]'
            }`}
          >
            Live
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('draft')}
            className={`flex-1 h-[24px] rounded-full font-semibold transition-all cursor-pointer flex items-center justify-center ${
              filterTab === 'draft'
                ? 'bg-white dark:bg-[#2A2B32] text-[#0A0F1F] dark:text-white shadow-2xs'
                : 'text-[#5F6678] dark:text-slate-400 hover:text-[#0A0F1F]'
            }`}
          >
            Ready · Draft
          </button>
        </div>
      </div>

      {/* Workflows List */}
      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
        {filteredWorkflows.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#5F6678]">
            No workflows match the current filter.
          </div>
        ) : (
          filteredWorkflows.map(wf => {
            const isSelected = selectedWorkflowId === wf.id;

            return (
              <div
                key={wf.id}
                onClick={() => onSelectWorkflow(wf)}
                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[#2D55F5]/40 bg-[#F0F4FF] dark:bg-blue-950/20 text-[#2D55F5] shadow-2xs'
                    : 'border-[#E3E6EE] dark:border-white/[0.08] bg-white dark:bg-white/[0.02] hover:bg-[#F5F6FA] dark:hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <GitBranch className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isSelected ? 'text-[#2D55F5]' : 'text-[#5F6678]'}`} />
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate leading-tight ${isSelected ? 'text-[#2D55F5]' : 'text-[#0A0F1F] dark:text-white'}`}>
                      {wf.title}
                    </p>
                    <p className="text-[11px] text-[#5F6678] dark:text-slate-400 mt-0.5">
                      {wf.status} · {wf.rulesCount} rules
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-4 h-4 text-[#2D55F5] shrink-0 ml-2" strokeWidth={2.5} />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
