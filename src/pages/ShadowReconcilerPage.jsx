import React, { useState } from 'react';
import DataXAppShell from '../components/common/DataXAppShell';
import { useNavigation } from '../context/NavigationContext';
import { useRuleEngine } from '../context/RuleEngineContext';
import {
  Activity,
  AlertTriangle,
  ShieldCheck,
  RotateCcw,
  Upload,
  Copy,
  Check,
  ArrowRight,
  Zap,
  X
} from 'lucide-react';

const PREVENTED_DIRTY_RECORDS = [
  {
    id: 'PO-4500018921',
    primaryKey: 'PO-4500018921',
    violation: 'Negative unit price (-$450.00) admitted by legacy; held by financial guard',
    vendor: 'V9012',
    qty: 100,
    total: '-$45,000',
    plant: 'P1000',
    totalColor: 'text-rose-600 font-mono font-bold'
  },
  {
    id: 'PO-4500018944',
    primaryKey: 'PO-4500018944',
    violation: 'Calculation mismatch ($99,500 vs $25,000 expected); isolated for invoice audit',
    vendor: 'V4011',
    qty: 50,
    total: '$99,500',
    plant: 'P2000',
    totalColor: 'text-rose-600 font-mono font-bold'
  },
  {
    id: 'PO-4500019012',
    primaryKey: 'PO-4500019012',
    violation: 'Missing mandatory vendor ID; legacy committed a blank record',
    vendor: '—',
    qty: 20,
    total: '$24,000',
    plant: 'P1000',
    vendorColor: 'text-rose-600 font-mono font-bold'
  },
  {
    id: 'PO-4500019150',
    primaryKey: 'PO-4500019150',
    violation: "Invalid delivery plant 'UNKNOWN_DC'; isolated for ontology mapping",
    vendor: 'V1022',
    qty: 15,
    total: '$1,200',
    plant: 'UNKNOWN_DC',
    plantColor: 'text-rose-600 font-mono font-bold'
  }
];

export default function ShadowReconcilerPage({ onSwitchToMarketing }) {
  const { navigateTo } = useNavigation();
  const { activeThread } = useRuleEngine();
  const [activeTab, setActiveTab] = useState('telemetry'); // 'telemetry' | 'dirty' | 'consensus'
  const [isRunningComparison, setIsRunningComparison] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [toastNotice, setToastNotice] = useState(null);

  const manifestHash = '7f8c28b991ae01bc49a83b204918e92038475819';

  const handleCopyHash = () => {
    navigator.clipboard?.writeText(manifestHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleRunShadowComparison = () => {
    setIsRunningComparison(true);
    setToastNotice('Simulating dual-stream pipeline execution against 1,420 SAP BW rows...');
    setTimeout(() => {
      setIsRunningComparison(false);
      setToastNotice('Shadow comparison complete: 99.014% parity certified. 14 corrupt records intercepted.');
      setTimeout(() => setToastNotice(null), 4000);
    }, 1500);
  };

  const handleExportProof = () => {
    const proofPayload = {
      batchId: 'BATCH-SAP-BW-2026-Q3-0842',
      status: 'CERTIFIED',
      parityRate: 0.99014,
      totalRows: 1420,
      identicalRows: 1406,
      interceptedDirtyRows: 14,
      financialExposurePreventedUsd: 1420000.0,
      sha256MerkleRoot: manifestHash,
      timestamp: '2026-11-10T10:35:51Z'
    };
    const blob = new Blob([JSON.stringify(proofPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shadow_parity_proof_BATCH-SAP-BW-2026-Q3-0842.json';
    a.click();
    URL.revokeObjectURL(url);
    setToastNotice('Cryptographic shadow parity certificate exported successfully.');
    setTimeout(() => setToastNotice(null), 3000);
  };

  return (
    <DataXAppShell onSwitchToMarketing={onSwitchToMarketing}>
      <main className="max-w-[1360px] mx-auto px-6 py-6 space-y-6 font-sans">
        {/* Toast Alert */}
        {toastNotice && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs font-semibold text-emerald-900 flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{toastNotice}</span>
            </div>
            <button
              onClick={() => setToastNotice(null)}
              className="text-emerald-700 hover:text-emerald-950 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Header Row matching Main-2.png */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Certified · BATCH-SAP-BW-2026-Q3-0842
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Shadow parity certification
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Run legacy ETL extracts and DataX side by side. Certify equivalence and catch the corrupt records the legacy pipeline let through before you cut over to S/4HANA.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportProof}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Export proof</span>
            </button>

            <button
              onClick={handleRunShadowComparison}
              disabled={isRunningComparison}
              className="px-4 py-2 rounded-xl bg-[#2D55F5] hover:bg-[#2045DC] text-white text-xs font-semibold shadow-2xs hover:shadow transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRunningComparison ? 'animate-spin' : ''}`} />
              <span>{isRunningComparison ? 'Comparing...' : 'Run shadow comparison'}</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards Row matching Main-2.png */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
            <span className="text-xs font-medium text-slate-500">Parity</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">99.014%</div>
            <p className="text-xs text-slate-500 mt-1">1,406 of 1,420 records identical</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
            <span className="text-xs font-medium text-slate-500">Financial risk prevented</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">$1.42M</div>
            <p className="text-xs text-slate-500 mt-1">Negative balances &amp; phantom PO lines blocked</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
            <span className="text-xs font-medium text-slate-500">Legacy leaks caught</span>
            <div className="text-2xl font-bold text-amber-600 mt-1">14</div>
            <p className="text-xs text-slate-500 mt-1">Held in quarantine</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
            <span className="text-xs font-medium text-slate-500">Audit manifest hash</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-sm font-semibold text-slate-900 truncate">
                {manifestHash.slice(0, 16)}...
              </span>
              <button
                onClick={handleCopyHash}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                title="Copy Merkle hash"
              >
                {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Merkle-linked proof for audit sign-off</p>
          </div>
        </div>

        {/* 3 Horizontal Tabs Row matching Main-2, Main-3, Main-4 */}
        <div className="flex items-center gap-6 border-b border-slate-200 text-xs font-semibold -mt-2">
          <button
            type="button"
            onClick={() => setActiveTab('telemetry')}
            className={`flex items-center gap-2 pb-3 transition-colors cursor-pointer ${
              activeTab === 'telemetry'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-500 hover:text-slate-800 border-b-2 border-transparent'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Dual-pipeline telemetry</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dirty')}
            className={`flex items-center gap-2 pb-3 transition-colors cursor-pointer ${
              activeTab === 'dirty'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-500 hover:text-slate-800 border-b-2 border-transparent'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Prevented dirty records</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === 'dirty' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
            }`}>
              4
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('consensus')}
            className={`flex items-center gap-2 pb-3 transition-colors cursor-pointer ${
              activeTab === 'consensus'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-500 hover:text-slate-800 border-b-2 border-transparent'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Consensus guard</span>
          </button>
        </div>

        {/* TAB 1: DUAL-PIPELINE TELEMETRY matching Main-2.png */}
        {activeTab === 'telemetry' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Column: Legacy ETL Script */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">
                      Legacy ETL script · Python / Informatica
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      4 m 12 s latency
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold shrink-0 mt-0.5">✕</span>
                      <span>No rule parsing: accepts negative totals, zero quantities and corrupted strings</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold shrink-0 mt-0.5">✕</span>
                      <span>No plant ontology: legacy strings like &quot;Dallas&quot; and &quot;Plnt-1&quot; stay unmapped</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold shrink-0 mt-0.5">✕</span>
                      <span>No audit trail: no cryptographic manifest for compliance</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#F8FAFC] rounded-xl border border-slate-100 p-2.5 font-mono text-[11px] text-slate-600">
                  Emitted 1,420 rows · admitted 14 corrupt records
                </div>
              </div>

              {/* Right Column: DataX Clean Core Pipeline */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">
                      DataX clean core pipeline
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      2.82 s latency
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Three-tier remediation: syntax normalization, fuzzy plant ontology, counterfactual proposals</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Durable quarantine isolates 14 corrupt records</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>SHA-256 Merkle manifest certifies zero data loss</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#F8FAFC] rounded-xl border border-slate-100 p-2.5 font-mono text-[11px] text-slate-700 font-semibold">
                  Committed 1,406 verified rows · 14 quarantined
                </div>
              </div>
            </div>

            {/* Bottom 89x Speedup Banner */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs text-blue-900 font-medium">
              <Zap className="w-4 h-4 text-blue-600 shrink-0" />
              <span>DataX finished the same batch 89× faster than the legacy script.</span>
            </div>
          </div>
        )}

        {/* TAB 2: PREVENTED DIRTY RECORDS matching Main-3.png */}
        {activeTab === 'dirty' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs space-y-4 p-5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Dirty records stopped before the target
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Admitted by the legacy pipeline, quarantined by DataX rule validation
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Primary Key</th>
                    <th className="pb-3 font-semibold">Violation Caught by DataX</th>
                    <th className="pb-3 font-semibold">Vendor</th>
                    <th className="pb-3 font-semibold">Qty</th>
                    <th className="pb-3 font-semibold">Total</th>
                    <th className="pb-3 font-semibold">Plant</th>
                    <th className="pb-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {PREVENTED_DIRTY_RECORDS.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 font-mono text-[11px] font-medium text-slate-900">
                        {row.primaryKey}
                      </td>
                      <td className="py-3.5 max-w-md pr-4 text-slate-600">
                        {row.violation}
                      </td>
                      <td className={`py-3.5 font-mono text-[11px] ${row.vendorColor || 'text-slate-800'}`}>
                        {row.vendor}
                      </td>
                      <td className="py-3.5 font-mono text-[11px] text-slate-800">
                        {row.qty}
                      </td>
                      <td className={`py-3.5 font-mono text-[11px] ${row.totalColor || 'text-slate-800'}`}>
                        {row.total}
                      </td>
                      <td className={`py-3.5 font-mono text-[11px] ${row.plantColor || 'text-slate-800'}`}>
                        {row.plant}
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => { window.location.hash = '#quarantine'; }}
                          className="text-xs font-semibold text-slate-700 hover:text-blue-600 flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <span>Review in DLQ</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CONSENSUS GUARD matching Main-4.png */}
        {activeTab === 'consensus' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Three-layer consensus guard
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Agent scores are clamped within ±2.5 of the deterministic layer-1 ground truth
                </p>
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                Anchoring active · ±2.5 band
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Layer 1 Ground Truth */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Layer 1 · Ground Truth
                  </span>
                  <div className="text-3xl font-bold text-slate-900 mt-1">
                    8.8 <span className="text-sm font-normal text-slate-400">/ 10</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100">
                  <p>· Data completeness 99.4%</p>
                  <p>· IQR outlier frequency 0.8%</p>
                  <p>· Critical unmasked PII: 0</p>
                  <p>· Shannon entropy 4.82 bits</p>
                  <p>· Execution &lt; 28 ms</p>
                </div>
              </div>

              {/* Card 2: Layer 2 Domain Agents */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Layer 2 · Domain Agents
                  </span>
                  <div className="text-3xl font-bold text-slate-900 mt-1">
                    9.1 <span className="text-sm font-normal text-slate-400">/ 10</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100">
                  <p>· Schema conformance 9.5</p>
                  <p>· Drift &amp; dispersion 8.8</p>
                  <p>· Governance &amp; security 9.8</p>
                  <p>· Business plant logic 9.2</p>
                  <p>· Unweighted mean 9.32</p>
                </div>
              </div>

              {/* Card 3: Layer 3 Consensus Verdict (Dark) */}
              <div className="bg-[#0B1120] text-white rounded-2xl p-5 shadow-sm space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Layer 3 · Consensus Verdict
                  </span>
                  <div className="text-3xl font-bold text-[#76EF98] mt-1">
                    8.95 <span className="text-sm font-normal text-slate-400">/ 10</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 pt-1 border-t border-slate-800">
                  <p>· Clamped within [6.3, 10.0]</p>
                  <p>· Fatal-flaw overrides: 0</p>
                  <p>· Disposition: ready</p>
                  <p>· Target ERP commit: authorized</p>
                  <p>· Merkle proof: SHA-256 certified</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </DataXAppShell>
  );
}
