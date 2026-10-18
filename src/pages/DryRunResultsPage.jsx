import React, { useState } from 'react';
import { Link, useNavigation } from '../context/NavigationContext';
import { useRuleEngine } from '../context/RuleEngineContext';
import PipelineHeader from '../components/common/PipelineHeader';
import Button from '../components/ui/Button';
import Tag from '../components/ui/Tag';
import Segmented from '../components/ui/Segmented';
import { IconCheck, IconPlay } from '../components/icons/ActionIcons';

export default function DryRunResultsPage() {
  const { navigateTo } = useNavigation();
  const {
    passedRecords,
    quarantinedRecords,
    autoFixedRecords,
    handleExportExcel,
  } = useRuleEngine();
  const [tab, setTab] = useState('quarantined');

  const total = passedRecords.length + quarantinedRecords.length || 1;
  const passRate = Math.round((passedRecords.length / total) * 100);

  // Remediated records showing ontology resolution from legacy P999 to active P1000
  const remediatedList = autoFixedRecords.length > 0 ? autoFixedRecords : quarantinedRecords.map(r => ({
    ...r,
    ORIGINAL_PLANT: r.DELIVERY_PLANT,
    DELIVERY_PLANT: 'P1000',
    REMEDIATION: 'Ontology Graph entity resolution: Legacy plant mapped to primary clean core plant P1000',
  }));

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#474E61] font-sans antialiased flex flex-col">
      {/* Figma Flow Step Header */}
      <PipelineHeader currentStep={5} threadTitle="SAP BW → S/4HANA Clean Core" />

      {/* Main Container */}
      <main className="max-w-[1360px] w-full mx-auto px-6 py-7 flex-1 flex flex-col gap-6">
        {/* Step Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-[#2D55F5] uppercase">
              Step 5 of 5 · Results & Remediation
            </span>
            <h1 className="text-[26px] font-bold text-[#0A0F1F] tracking-tight leading-tight mt-1">
              Dry Run Evaluation Results
            </h1>
            <p className="text-[13px] text-[#5F6678] mt-1">
              Inspection of clean core compliance. Review quarantined orders and ontology-remediated plants before S/4HANA writeback.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="md" onClick={handleExportExcel}>
              Export Clean Excel (.xlsx)
            </Button>
            <Link to="live-auto-fix">
              <Button variant="primary" size="md">
                <IconPlay size={13} className="mr-1 inline-block" filled />
                Next: Live Auto-Fix & S/4HANA Writeback →
              </Button>
            </Link>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-[#E3E6EE] rounded-[18px] p-5 shadow-xs">
            <span className="text-xs font-semibold text-[#5F6678]">Clean Core Compliance</span>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-2xl font-bold text-[#0A0F1F]">{passRate}%</span>
              <Tag variant={passRate > 80 ? 'success' : 'warning'}>
                {passedRecords.length} / {total} Valid
              </Tag>
            </div>
            <p className="text-[11px] text-[#8E95A9] mt-1">Directly eligible for S/4HANA ingestion</p>
          </div>

          <div className="bg-white border border-[#E3E6EE] rounded-[18px] p-5 shadow-xs">
            <span className="text-xs font-semibold text-[#5F6678]">Flagged Violations</span>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-2xl font-bold text-[#A35600]">{quarantinedRecords.length}</span>
              <Tag variant="warning">Rule R04 Anomaly</Tag>
            </div>
            <p className="text-[11px] text-[#8E95A9] mt-1">Legacy plant code P999 outside authorization list</p>
          </div>

          <div className="bg-white border border-[#E3E6EE] rounded-[18px] p-5 shadow-xs">
            <span className="text-xs font-semibold text-[#5F6678]">Ontology Auto-Fix Ready</span>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-2xl font-bold text-[#127A52]">{remediatedList.length}</span>
              <Tag variant="volt">100% Remediable</Tag>
            </div>
            <p className="text-[11px] text-[#8E95A9] mt-1">Can be automatically rewritten to P1000</p>
          </div>
        </div>

        {/* Results Data Table Card */}
        <div className="bg-white border border-[#E3E6EE] rounded-[22px] p-6 shadow-sm space-y-4">
          {/* Tabs Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-[#F0F2F6]">
            <Segmented
              options={[
                { label: `Quarantined (${quarantinedRecords.length})`, value: 'quarantined' },
                { label: `Passed Clean (${passedRecords.length})`, value: 'passed' },
                { label: `Auto-Fixed Remediated (${remediatedList.length})`, value: 'remediated' },
              ]}
              value={tab}
              onChange={setTab}
            />
            <span className="text-xs text-[#5F6678]">
              {tab === 'remediated' ? 'Showing ontology-transformed records' : 'Showing evaluated raw BW records'}
            </span>
          </div>

          {/* Table */}
          <div className="border border-[#E3E6EE] rounded-[14px] overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F9FA] text-[#5F6678] font-semibold border-b border-[#E3E6EE]">
                <tr>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">PO #</th>
                  <th className="py-3 px-3">Material Description</th>
                  <th className="py-3 px-3">Qty</th>
                  <th className="py-3 px-3">Total Amount</th>
                  <th className="py-3 px-3">Plant</th>
                  <th className="py-3 px-3">
                    {tab === 'remediated' ? 'Ontology Action' : tab === 'quarantined' ? 'Flagged Violations' : 'Integrity'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E6EE]">
                {(tab === 'quarantined'
                  ? quarantinedRecords
                  : tab === 'passed'
                  ? passedRecords
                  : remediatedList
                ).map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#F9FAFC] transition-colors">
                    <td className="py-3 px-3">
                      <Tag
                        variant={
                          tab === 'remediated'
                            ? 'volt'
                            : tab === 'quarantined'
                            ? 'warning'
                            : 'success'
                        }
                      >
                        {tab === 'remediated'
                          ? 'Auto-Remediated'
                          : tab === 'quarantined'
                          ? 'Quarantined'
                          : 'Clean Core'}
                      </Tag>
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-[#0A0F1F]">
                      {row.PO_NUMBER || row.MAT_DOC}
                    </td>
                    <td className="py-3 px-3 text-[#474E61] max-w-[180px] truncate">
                      {row.MATERIAL_DESC || row.MATERIAL_ID}
                    </td>
                    <td className="py-3 px-3 font-mono">{row.QUANTITY}</td>
                    <td className="py-3 px-3 font-mono font-medium text-[#0A0F1F]">
                      ${Number(row.TOTAL_AMOUNT || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {tab === 'remediated' ? (
                        <div className="flex items-center gap-1.5">
                          <span className="line-through text-[#8E95A9]">P999</span>
                          <span className="text-[#2D55F5] font-bold">→ P1000</span>
                        </div>
                      ) : (
                        row.DELIVERY_PLANT || 'None'
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {tab === 'remediated' ? (
                        <span className="text-[#127A52] font-medium">
                          Ontology mapped to active plant P1000
                        </span>
                      ) : tab === 'quarantined' ? (
                        <span className="text-[#A35600] font-medium">
                          {row.VIOLATION_DESC || row._violation_reasons || (Array.isArray(row.violations) ? row.violations.join(' · ') : 'Clean Core Rule violation')}
                        </span>
                      ) : (
                        <span className="text-[#127A52] font-medium">
                          All R01-R04 Rules Validated
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Bottom Sticky Action Bar linking to Step 6: Live Auto-Fix Writeback */}
      <div className="bg-white border-t border-[#E3E6EE] px-6 lg:px-8 py-3 sticky bottom-0 z-30 shadow-sm">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between">
          <Link to="running-dry-run">
            <Button variant="ghost" size="md">
              ← Re-run Simulation
            </Button>
          </Link>
          <Link to="live-auto-fix">
            <Button variant="primary" size="md">
              Next: Live Auto-Fix & S/4HANA Writeback →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
