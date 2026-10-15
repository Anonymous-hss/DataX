import React, { useState } from 'react';
import { Link, useNavigation } from '../context/NavigationContext';
import { useRuleEngine } from '../context/RuleEngineContext';
import Button from '../components/ui/Button';
import Tag from '../components/ui/Tag';
import Segmented from '../components/ui/Segmented';
import Logo from '../components/icons/Logo';
import {
  IconCheck,
  IconArrowLeft,
  IconPlay,
} from '../components/icons/NavIcons';

export default function DryRunResultsPage() {
  const { navigateTo } = useNavigation();
  const {
    passedRecords,
    quarantinedRecords,
    handleExportExcel,
    s4hanaDocNumber,
  } = useRuleEngine();
  const [tab, setTab] = useState('quarantined');

  const total = passedRecords.length + quarantinedRecords.length || 1;
  const passRate = Math.round((passedRecords.length / total) * 100);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 font-sans">
      <header className="bg-white border-b border-[#E3E6EE] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="threads" className="flex items-center gap-2.5">
            <Logo size={32} />
            <span className="font-bold text-[#0A0F1F] tracking-tight text-lg">DataX</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="md" onClick={handleExportExcel}>
              Export Clean Excel (.xlsx)
            </Button>
            <Button variant="primary" size="md" onClick={() => navigateTo('live-auto-fix')}>
              <IconPlay className="mr-1 inline-block" filled /> Live Auto-Fix & Writeback
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to="running-dry-run" className="text-xs font-medium text-[#2D55F5] hover:underline flex items-center gap-1 mb-2">
            <IconArrowLeft size={14} color="#2D55F5" /> Back to Simulation
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#0A0F1F] tracking-tight">Dry Run Results Summary</h1>
            <Tag variant={passRate > 80 ? 'success' : 'warning'}>{passRate}% Clean</Tag>
          </div>
          <p className="text-sm text-[#5F6678] mt-1">
            <strong>{passedRecords.length}</strong> passed validation · <strong>{quarantinedRecords.length}</strong> quarantined for inspection
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Segmented
            options={[
              { label: `Quarantine (${quarantinedRecords.length})`, value: 'quarantined' },
              { label: `Passed Clean (${passedRecords.length})`, value: 'passed' },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>
      </div>

      {/* Main Results Table */}
      <div className="bg-white border border-[#E3E6EE] rounded-[20px] p-6 shadow-sm space-y-4">
        <div className="border border-[#E3E6EE] rounded-[14px] overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F6FA] text-[#5F6678] font-semibold border-b border-[#E3E6EE]">
              <tr>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">PO #</th>
                <th className="py-3 px-3">Material Description</th>
                <th className="py-3 px-3">Qty</th>
                <th className="py-3 px-3">Total Amount</th>
                <th className="py-3 px-3">Plant</th>
                <th className="py-3 px-3">{tab === 'quarantined' ? 'Flagged Violations' : 'Integrity'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E6EE]">
              {(tab === 'quarantined' ? quarantinedRecords : passedRecords).map((row, idx) => (
                <tr key={idx} className="hover:bg-[#F9FAFC]">
                  <td className="py-3 px-3">
                    <Tag variant={tab === 'quarantined' ? 'warning' : 'success'}>
                      {tab === 'quarantined' ? 'Quarantined' : 'Clean Core'}
                    </Tag>
                  </td>
                  <td className="py-3 px-3 font-mono font-medium text-[#0A0F1F]">{row.PO_NUMBER || row.MAT_DOC}</td>
                  <td className="py-3 px-3 text-[#474E61] max-w-[180px] truncate">{row.MATERIAL_DESC || row.MATERIAL_ID}</td>
                  <td className="py-3 px-3 font-mono">{row.QUANTITY}</td>
                  <td className="py-3 px-3 font-mono font-medium text-[#0A0F1F]">
                    ${Number(row.TOTAL_AMOUNT || 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-mono text-xs">{row.DELIVERY_PLANT || row.LOCATION}</span>
                  </td>
                  <td className="py-3 px-3">
                    {tab === 'quarantined' ? (
                      <div className="flex flex-wrap gap-1">
                        {row._violations?.map((v, vi) => (
                          <span key={vi} className="bg-[#FDEDEB] text-[#C2362F] text-[11px] font-medium px-2 py-0.5 rounded">
                            {v}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[#127A52] font-semibold flex items-center gap-1">
                        <IconCheck size={12} color="#127A52" /> Validated
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {(tab === 'quarantined' ? quarantinedRecords : passedRecords).length === 0 && (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-[#5F6678] italic">
                    No {tab} records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-center pt-2">
        <Link to="threads">
          <Button variant="ghost" size="md">
            &larr; Return to Dashboard
          </Button>
        </Link>
        <Button variant="primary" size="md" onClick={() => navigateTo('live-auto-fix')}>
          Proceed to Auto-Fix & S/4HANA Writeback &rarr;
        </Button>
      </div>
    </div>
  );
}
