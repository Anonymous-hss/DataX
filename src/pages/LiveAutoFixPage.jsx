import React from 'react';
import { Link, useNavigation } from '../context/NavigationContext';
import { useRuleEngine } from '../context/RuleEngineContext';
import PipelineHeader from '../components/common/PipelineHeader';
import Button from '../components/ui/Button';
import Tag from '../components/ui/Tag';
import { IconCheck, IconShield, IconBolt } from '../components/icons/ActionIcons';
import { SapLogo } from '../components/icons/DatabaseLogos';

export default function LiveAutoFixPage() {
  const {
    autoFixedRecords,
    passedRecords,
    quarantinedRecords,
    s4hanaDocNumber,
    handleExportExcel,
  } = useRuleEngine();

  const total = passedRecords.length + quarantinedRecords.length || 8;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#474E61] font-sans antialiased flex flex-col">
      {/* Figma Flow Step Header */}
      <PipelineHeader currentStep={5} threadTitle="SAP BW → S/4HANA Clean Core" />

      {/* Main Container */}
      <main className="max-w-[1360px] w-full mx-auto px-6 py-7 flex-1 flex flex-col gap-6">
        {/* Step Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-[#127A52] uppercase">
              Step 6 of 7 · Production Ingestion Complete
            </span>
            <h1 className="text-[26px] font-bold text-[#0A0F1F] tracking-tight leading-tight mt-1">
              Live Auto-Fix & S/4HANA Writeback Confirmed
            </h1>
            <p className="text-[13px] text-[#5F6678] mt-1">
              All 8 procurement orders successfully validated, ontology-mapped, and posted into SAP S/4HANA Clean Core.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Tag variant="success">
              <span className="w-2 h-2 rounded-full bg-[#127A52] inline-block mr-1.5 animate-pulse" />
              S/4HANA Live Writeback Active
            </Tag>
            <Button variant="secondary" size="md" onClick={handleExportExcel}>
              Download Audit XLSX
            </Button>
          </div>
        </div>

        {/* S/4HANA Writeback Confirmation Card */}
        <div className="bg-[#0B1226] text-white rounded-[22px] p-7 shadow-md border border-[#232B45] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[18px] bg-[#2D55F5]/25 flex items-center justify-center shrink-0 border border-[#2D55F5]">
              <SapLogo size={42} />
            </div>
            <div>
              <span className="text-xs text-[#D4FF3A] font-mono font-bold tracking-wider">
                SAP S/4HANA BAPI DISPATCH CONFIRMED
              </span>
              <h2 className="text-2xl font-bold text-white mt-1">
                Purchase Order Document Generated: #{s4hanaDocNumber || '4500019284'}
              </h2>
              <p className="text-xs text-[#A6ADC2] mt-1">
                Target: S4H_PROD (Client 100) · BAPI_PO_CREATE1 · Clean Core Direct Posting Verified
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <span className="text-xs text-[#A6ADC2] block">Writeback Status</span>
              <span className="text-sm font-bold text-[#127A52] bg-[#E7F6EE] px-3.5 py-1 rounded-full inline-block mt-1">
                ✓ POSTED & RECONCILED
              </span>
            </div>
          </div>
        </div>

        {/* Remediated Records Audit Table */}
        <div className="bg-white border border-[#E3E6EE] rounded-[22px] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0F2F6]">
            <div>
              <h3 className="text-base font-bold text-[#0A0F1F]">Clean Core Staged Records (All {total} Items)</h3>
              <p className="text-xs text-[#5F6678]">3 legacy plant records were automatically remediated via ontology graph</p>
            </div>
            <span className="text-xs font-semibold text-[#127A52] bg-[#E7F6EE] px-3 py-1 rounded-full">
              100% Core Ready
            </span>
          </div>

          <div className="border border-[#E3E6EE] rounded-[14px] overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F9FA] text-[#5F6678] font-semibold border-b border-[#E3E6EE]">
                <tr>
                  <th className="py-3 px-3">S/4HANA Status</th>
                  <th className="py-3 px-3">Line #</th>
                  <th className="py-3 px-3">Material Description</th>
                  <th className="py-3 px-3">Order Qty</th>
                  <th className="py-3 px-3">Net Amount</th>
                  <th className="py-3 px-3">Delivery Plant</th>
                  <th className="py-3 px-3">Remediation Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E6EE]">
                {[
                  { line: '0010', desc: 'Surgical Gloves XL', qty: 500, amount: 6250.00, plant: 'P1000', fix: false },
                  { line: '0020', desc: 'Medical Syringes 10ml', qty: 1200, amount: 5040.00, plant: 'P2000', fix: false },
                  { line: '0030', desc: 'Antiseptic Solution 500ml', qty: 350, amount: 6300.00, plant: 'P1000', fix: true },
                  { line: '0040', desc: 'Sterile Gauze Pads', qty: 2500, amount: 4500.00, plant: 'P1000', fix: false },
                  { line: '0050', desc: 'N95 Respirators', qty: 800, amount: 6800.00, plant: 'P3000', fix: false },
                  { line: '0060', desc: 'Diagnostic Catheters', qty: 150, amount: 12750.00, plant: 'P1000', fix: true },
                  { line: '0070', desc: 'Saline Solution 1L', qty: 900, amount: 5400.00, plant: 'P2000', fix: false },
                  { line: '0080', desc: 'IV Infusion Sets', qty: 450, amount: 9900.00, plant: 'P1000', fix: true },
                ].map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#F9FAFC] transition-colors">
                    <td className="py-3 px-3">
                      <Tag variant="success">Dispatched</Tag>
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-[#0A0F1F]">{item.line}</td>
                    <td className="py-3 px-3 text-[#474E61] max-w-[180px] truncate">{item.desc}</td>
                    <td className="py-3 px-3 font-mono">{item.qty}</td>
                    <td className="py-3 px-3 font-mono font-medium text-[#0A0F1F]">${item.amount.toFixed(2)}</td>
                    <td className="py-3 px-3 font-mono">
                      {item.fix ? (
                        <div className="flex items-center gap-1.5">
                          <span className="line-through text-[#8E95A9]">P999</span>
                          <span className="text-[#2D55F5] font-bold">→ {item.plant}</span>
                        </div>
                      ) : (
                        item.plant
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {item.fix ? (
                        <span className="text-[#127A52] font-medium">Ontology Auto-Fixed to Active Plant</span>
                      ) : (
                        <span className="text-[#5F6678]">Clean Core Direct Ingestion</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Bottom Sticky Action Bar linking to Step 7: Run History */}
      <div className="bg-white border-t border-[#E3E6EE] px-6 lg:px-8 py-3 sticky bottom-0 z-30 shadow-sm">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between">
          <Link to="dry-run-results">
            <Button variant="ghost" size="md">
              ← Back to Results
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="threads">
              <Button variant="secondary" size="md">
                Return to Threads
              </Button>
            </Link>
            <Link to="history">
              <Button variant="primary" size="md">
                Next: View Run History & Analytics →
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
