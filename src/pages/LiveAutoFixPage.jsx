import React from 'react';
import { Link, useNavigation } from '../context/NavigationContext';
import { useRuleEngine } from '../context/RuleEngineContext';
import Button from '../components/ui/Button';
import Tag from '../components/ui/Tag';
import Logo from '../components/icons/Logo';
import {
  IconCheck,
  IconArrowLeft,
  IconShield,
  IconBolt,
  IconPause,
} from '../components/icons/ActionIcons';
import { SapLogo } from '../components/icons/DatabaseLogos';

export default function LiveAutoFixPage() {
  const { navigateTo } = useNavigation();
  const {
    autoFixedRecords,
    passedRecords,
    s4hanaDocNumber,
    handleExportExcel,
  } = useRuleEngine();

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 font-sans">
      <header className="bg-white border-b border-[#E3E6EE] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="threads" className="flex items-center gap-2.5">
            <Logo size={32} />
            <span className="font-bold text-[#0A0F1F] tracking-tight text-lg">DataX</span>
          </Link>
          <div className="flex items-center gap-3">
            <Tag variant="success">
              <span className="w-2 h-2 rounded-full bg-[#127A52] inline-block mr-1.5 animate-pulse" />
              Live Pipeline Active
            </Tag>
            <Button variant="secondary" size="md" onClick={handleExportExcel}>
              Download Audit XLSX
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to="dry-run-results" className="text-xs font-medium text-[#2D55F5] hover:underline flex items-center gap-1 mb-2">
            <IconArrowLeft size={14} color="#2D55F5" /> Back to Dry Run Results
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#0A0F1F] tracking-tight">Live Auto-Fix & S/4HANA Dispatch</h1>
            <Tag variant="volt">Core Active</Tag>
          </div>
          <p className="text-sm text-[#5F6678] mt-1">
            Ontology graph resolved legacy entities. Clean core orders successfully dispatched.
          </p>
        </div>

        <Link to="threads">
          <Button variant="primary" size="md">
            Done · Return to Threads
          </Button>
        </Link>
      </div>

      {/* S/4HANA Writeback Confirmation Card */}
      <div className="bg-[#161C30] text-white rounded-[20px] p-6 shadow-md border border-[#232B45] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-[16px] bg-[#2D55F5]/20 flex items-center justify-center shrink-0 border border-[#2D55F5]">
            <SapLogo size={36} />
          </div>
          <div>
            <span className="text-xs text-[#D4FF3A] font-mono font-semibold tracking-wider">
              SAP S/4HANA BAPI DISPATCHED
            </span>
            <h3 className="text-xl font-bold text-white mt-0.5">
              Purchase Order Generated: #{s4hanaDocNumber}
            </h3>
            <p className="text-xs text-[#A6ADC2] mt-1">
              Target System: S4H_PROD · BAPI_PO_CREATE1 · Clean Core Direct Ingestion
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-[#A6ADC2] block">Writeback Status</span>
            <span className="text-sm font-semibold text-[#127A52] bg-[#E7F6EE] px-2.5 py-0.5 rounded-full inline-block mt-0.5">
              CONFIRMED
            </span>
          </div>
        </div>
      </div>

      {/* Auto-Fixed Records Section */}
      <div className="bg-white border border-[#E3E6EE] rounded-[20px] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#0A0F1F]">Ontology Graph Auto-Remediated Records</h3>
            <p className="text-xs text-[#5F6678]">Legacy plant labels resolved to official SAP S/4HANA plant codes</p>
          </div>
          <Tag variant="primary">{autoFixedRecords.length} Rows Remediated</Tag>
        </div>

        <div className="border border-[#E3E6EE] rounded-[14px] overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F6FA] text-[#5F6678] font-semibold border-b border-[#E3E6EE]">
              <tr>
                <th className="py-2.5 px-3">PO #</th>
                <th className="py-2.5 px-3">Material Description</th>
                <th className="py-2.5 px-3">Original Legacy Plant</th>
                <th className="py-2.5 px-3">Remediated S/4HANA Plant</th>
                <th className="py-2.5 px-3">Resolution Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E6EE]">
              {autoFixedRecords.map((r, i) => (
                <tr key={i} className="hover:bg-[#F9FAFC]">
                  <td className="py-2.5 px-3 font-mono font-medium text-[#0A0F1F]">{r.PO_NUMBER}</td>
                  <td className="py-2.5 px-3 text-[#474E61]">{r.MATERIAL_DESC}</td>
                  <td className="py-2.5 px-3">
                    <span className="bg-[#FFF4E3] text-[#A35600] px-2 py-0.5 rounded text-[11px] font-mono line-through">
                      {r._originalPlant}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="bg-[#E7F6EE] text-[#127A52] px-2 py-0.5 rounded text-[11px] font-mono font-bold">
                      {r.DELIVERY_PLANT}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-[#127A52] font-medium flex items-center gap-1">
                    <IconCheck size={12} color="#127A52" />
                    Auto-mapped via Ontology Graph
                  </td>
                </tr>
              ))}
              {autoFixedRecords.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-[#5F6678] italic">
                    All plants matched official S/4HANA specifications without remediation.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
