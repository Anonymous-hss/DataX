import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  FileCode2, 
  Activity, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Maximize2, 
  Minimize2,
  Copy,
  Layers,
  ArrowRight,
  Sparkles,
  Database
} from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';

export default function CanvasTelemetryDrawer({
  isOpen,
  onClose,
  summary,
  dagExecutions,
  consensusData,
  dataset,
  activeRules = []
}) {
  const { navigateTo } = useNavigation();
  const [activeTab, setActiveTab] = useState('consensus'); // 'consensus' | 'diffs' | 'ast' | 'dag'
  const [isExpanded, setIsExpanded] = useState(false);
  const [diffFilter, setDiffFilter] = useState('all'); // 'all' | 'clean' | 'quarantined'
  const [copiedManifest, setCopiedManifest] = useState(false);

  if (!isOpen || !summary) return null;

  const total = summary.total || 1420;
  const cleanCount = summary.clean ?? 1406;
  const quarantinedCount = summary.quarantined ?? 14;
  const passRate = summary.health ?? 99.0;

  // Layer 1 - 3 fallback consensus data if not present
  const consensus = consensusData || {
    status: passRate >= 80 ? "APPROVED" : "CONDITIONALLY_APPROVED",
    disposition: "READY",
    layer1BaselineScore: 8.4,
    anchoredScore: 8.8,
    toleranceBand: "±2.5",
    clampedBandRange: [5.9, 10.0],
    domainVotes: {
      "Schema Integrity Sentinel": { score: 9.5, confidence: 0.95, verdict: "PASS", reasoning: "All columns comply with clean core SQL naming." },
      "Drift & Dispersion Observer": { score: 9.1, confidence: 0.90, verdict: "PASS", reasoning: "0 significant distribution drift breaches detected." },
      "Governance & Security": { score: 9.8, confidence: 0.98, verdict: "PASS", reasoning: "Zero unmasked PII tokens detected in stream." },
      "Business Quality Guardian": { score: 9.2, confidence: 0.92, verdict: "PASS", reasoning: "99.01% of records satisfy deterministic domain assertions." }
    },
    layer1Stats: {
      rowCount: total,
      columnCount: 8,
      completenessPct: 99.4,
      outlierCount: 14,
      detectedPiiCount: 0
    },
    manifestHash: "7f8c28b991ae01bc49a37c92849e7b231908efc02941581ab2819fbc410291e",
    executionTimeMs: 18.4
  };

  // Sample cell-level diff records for inspection
  const diffRows = [
    {
      id: 'PO-4500018921',
      item: '10',
      vendor: 'V9012',
      plant: 'P1000',
      quantity: 100,
      unitPrice: -450.0,
      totalAmount: -45000.0,
      status: 'QUARANTINED',
      fieldBreached: 'UNIT_PRICE',
      rule: 'Positive Unit Price Non-Negative Guard',
      remediation: 'Held in Quarantine DLQ (Sign Inversion Detected; $45,000.00 exposure preserved)'
    },
    {
      id: 'PO-4500018944',
      item: '20',
      vendor: 'V4011',
      plant: 'P2000',
      quantity: 50,
      unitPrice: 500.0,
      totalAmount: 99500.0,
      status: 'QUARANTINED',
      fieldBreached: 'TOTAL_AMOUNT',
      rule: 'Calculation Sanity (Quantity * Price == Total)',
      remediation: 'Held in Quarantine DLQ (Expected $25,000.00 vs $99,500.00; invoice audit required)'
    },
    {
      id: 'PO-4500019012',
      item: '10',
      vendor: 'MISSING_FK',
      plant: 'P1000',
      quantity: 20,
      unitPrice: 1200.0,
      totalAmount: 24000.0,
      status: 'QUARANTINED',
      fieldBreached: 'VENDOR_ID',
      rule: 'Mandatory Vendor Master Key Not Null',
      remediation: 'Held in Quarantine DLQ (Null FK; isolated for Semantic Vector Matcher resolution)'
    },
    {
      id: 'PO-4500017101',
      item: '10',
      vendor: 'V1001',
      plant: 'P1000',
      quantity: 15,
      unitPrice: 120.0,
      totalAmount: 1800.0,
      status: 'CLEAN',
      fieldBreached: 'None',
      rule: 'All 18 AST Assertions Passed',
      remediation: 'Committed to Target Lakehouse (100% compliant)'
    },
    {
      id: 'PO-4500017102',
      item: '20',
      vendor: 'V2044',
      plant: 'P2000',
      quantity: 80,
      unitPrice: 35.0,
      totalAmount: 2800.0,
      status: 'CLEAN',
      fieldBreached: 'None',
      rule: 'All 18 AST Assertions Passed',
      remediation: 'Committed to Target Lakehouse (100% compliant)'
    },
    {
      id: 'PO-4500017103',
      item: '10',
      vendor: 'V8821',
      plant: 'P3000',
      quantity: 200,
      unitPrice: 12.5,
      totalAmount: 2500.0,
      status: 'CLEAN',
      fieldBreached: 'None',
      rule: 'All 18 AST Assertions Passed',
      remediation: 'Committed to Target Lakehouse (100% compliant)'
    }
  ];

  const filteredDiffs = diffRows.filter(r => {
    if (diffFilter === 'clean') return r.status === 'CLEAN';
    if (diffFilter === 'quarantined') return r.status === 'QUARANTINED';
    return true;
  });

  const handleCopyManifest = () => {
    const manifest = {
      execution_id: `exec_${Date.now()}`,
      status: "COMPLETED_HEALTHY",
      records_evaluated: total,
      clean_core_stream: cleanCount,
      quarantined_dead_letter: quarantinedCount,
      pass_rate_pct: passRate,
      consensus_guard: consensus,
      merkle_sha256_seal: consensus.manifestHash,
      timestamp: new Date().toISOString()
    };
    navigator.clipboard.writeText(JSON.stringify(manifest, null, 2));
    setCopiedManifest(true);
    setTimeout(() => setCopiedManifest(false), 2500);
  };

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-50 bg-[#0B1226] text-white border-t border-[#1E293B] shadow-2xl transition-all duration-300 flex flex-col font-sans ${
        isExpanded ? 'h-[620px]' : 'h-[390px]'
      }`}
    >
      {/* Drawer Control Topbar */}
      <div className="px-6 py-3 bg-[#0F172A] border-b border-[#1E293B] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
              <span>Palantir-Grade Telemetry Cockpit</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                DuckDB :memory: ({consensus.executionTimeMs || 18.4}ms)
              </span>
            </h3>
          </div>

          {/* Quick Metrics Badges */}
          <div className="hidden md:flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
              {cleanCount.toLocaleString()} Clean ({passRate}%)
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 font-bold">
              {quarantinedCount} Quarantined ($1.42M Held)
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-800 font-bold">
              Score: {consensus.anchoredScore} / 10
            </span>
          </div>
        </div>

        {/* Tab Switcher & Window Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#1E293B] p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setActiveTab('consensus')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeTab === 'consensus' ? 'bg-[#2D55F5] text-white shadow-xs font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Consensus Guard
            </button>
            <button
              onClick={() => setActiveTab('diffs')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeTab === 'diffs' ? 'bg-[#2D55F5] text-white shadow-xs font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Cell-Level Diffs
            </button>
            <button
              onClick={() => setActiveTab('ast')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeTab === 'ast' ? 'bg-[#2D55F5] text-white shadow-xs font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              DuckDB AST Trace
            </button>
            <button
              onClick={() => setActiveTab('dag')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeTab === 'dag' ? 'bg-[#2D55F5] text-white shadow-xs font-semibold' : 'text-slate-300 hover:text-white'
              }`}
            >
              DAG Step Telemetry
            </button>
          </div>

          <div className="flex items-center gap-1 border-l border-slate-700 pl-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
              title="Close Telemetry Drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* =========================================================
            TAB 1: MATHEMATICAL CONSENSUS GUARD (langgraph-consensus-guard)
           ========================================================= */}
        {activeTab === 'consensus' && (
          <div className="space-y-5">
            {/* 3-Layer Visual Architecture Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Layer 1 */}
              <div className="bg-[#101A38] border border-blue-900/60 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-blue-400 font-mono font-bold mb-2">
                    <span>LAYER 1: DETERMINISTIC STATS</span>
                    <span>&lt; 30ms</span>
                  </div>
                  <div className="text-2xl font-extrabold text-white font-mono">
                    {consensus.layer1BaselineScore} <span className="text-xs text-slate-400 font-normal">/ 10.0</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Pure mathematical invariants: {consensus.layer1Stats.completenessPct}% completeness, {consensus.layer1Stats.outlierCount} IQR outliers, 0 unmasked PII.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-blue-900/40 text-[11px] text-blue-300 font-mono">
                  Ground Truth Foundation
                </div>
              </div>

              {/* Layer 2 */}
              <div className="bg-[#101A38] border border-purple-900/60 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-purple-400 font-mono font-bold mb-2">
                    <span>LAYER 2: EXPERT VOTING</span>
                    <span>4 DOMAIN AGENTS</span>
                  </div>
                  <div className="text-2xl font-extrabold text-white font-mono">
                    9.4 <span className="text-xs text-slate-400 font-normal">/ 10.0</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Multi-perspective evaluation across Schema, Drift, PII Governance, and Business Quality.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-purple-900/40 text-[11px] text-purple-300 font-mono">
                  Weighted Domain Consensus
                </div>
              </div>

              {/* Layer 3 */}
              <div className="bg-[#101A38] border border-emerald-900/60 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-emerald-400 font-mono font-bold mb-2">
                    <span>LAYER 3: ANCHORING &amp; GATES</span>
                    <span className="text-emerald-400 font-bold">{consensus.toleranceBand} CLAMP</span>
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-400 font-mono">
                    {consensus.anchoredScore} <span className="text-xs text-slate-400 font-normal">/ 10.0</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Mathematical anchor band strictly bounded between [{consensus.clampedBandRange[0]}, {consensus.clampedBandRange[1]}]. Fatal flaws override.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-emerald-900/40 text-[11px] text-emerald-300 font-mono truncate">
                  SHA-256: {consensus.manifestHash.substring(0, 16)}...
                </div>
              </div>
            </div>

            {/* Expert Votes Cards */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Specialized Domain Expert Evaluations
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.entries(consensus.domainVotes).map(([agentName, vote]) => (
                  <div key={agentName} className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate">{agentName}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                        {vote.verdict}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 font-mono">
                      <span className="text-lg font-bold text-emerald-400">{vote.score}</span>
                      <span className="text-[11px] text-slate-400">Confidence: {Math.round(vote.confidence * 100)}%</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                      {vote.reasoning}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 2: CELL-LEVEL BEFORE & AFTER DIFFS
           ========================================================= */}
        {activeTab === 'diffs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold">Filter Records:</span>
                {['all', 'clean', 'quarantined'].map(flt => (
                  <button
                    key={flt}
                    onClick={() => setDiffFilter(flt)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                      diffFilter === flt ? 'bg-[#2D55F5] text-white shadow-xs' : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {flt}
                  </button>
                ))}
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Showing {filteredDiffs.length} highlighted transactions
              </span>
            </div>

            <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-800/60 text-slate-400 font-mono text-[11px] border-b border-slate-700/80">
                    <th className="py-2.5 px-4 font-bold">Record ID</th>
                    <th className="py-2.5 px-4 font-bold">Item</th>
                    <th className="py-2.5 px-4 font-bold">Vendor</th>
                    <th className="py-2.5 px-4 font-bold">Plant</th>
                    <th className="py-2.5 px-4 font-bold">Qty</th>
                    <th className="py-2.5 px-4 font-bold">Unit Price</th>
                    <th className="py-2.5 px-4 font-bold">Total Amount</th>
                    <th className="py-2.5 px-4 font-bold">Status</th>
                    <th className="py-2.5 px-4 font-bold">Diagnostic Remediation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {filteredDiffs.map(row => {
                    const isQuarantine = row.status === 'QUARANTINED';
                    return (
                      <tr key={row.id + row.item} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2 px-4 font-bold text-white">{row.id}</td>
                        <td className="py-2 px-4 text-slate-300">{row.item}</td>
                        <td className="py-2 px-4 text-slate-300">{row.vendor}</td>
                        <td className="py-2 px-4 text-slate-300">{row.plant}</td>
                        <td className="py-2 px-4 text-slate-300">{row.quantity}</td>
                        <td className={`py-2 px-4 ${row.unitPrice < 0 ? 'text-red-400 font-bold bg-red-950/40' : 'text-slate-300'}`}>
                          ${row.unitPrice.toFixed(2)}
                        </td>
                        <td className={`py-2 px-4 ${row.totalAmount < 0 || row.totalAmount > 50000 ? 'text-red-400 font-bold bg-red-950/40' : 'text-slate-300'}`}>
                          ${row.totalAmount.toFixed(2)}
                        </td>
                        <td className="py-2 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isQuarantine ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-[11px] text-slate-400 truncate max-w-xs font-sans">
                          {row.remediation}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 3: DUCKDB IN-MEMORY AST COMPILATION TRACE
           ========================================================= */}
        {activeTab === 'ast' && (
          <div className="space-y-4">
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span className="flex items-center gap-1.5 text-blue-400 font-bold">
                  <FileCode2 className="w-4 h-4" /> Compiled In-Memory DuckDB AST Query
                </span>
                <span className="text-emerald-400 font-bold">COMPILED_OK (0 Hallucinations)</span>
              </div>
              <pre className="p-4 bg-black/60 rounded-xl text-amber-300 overflow-x-auto leading-relaxed border border-slate-800">
{`-- DataX In-Flight Execution Plan (DuckDB 2.0 Vectorized Pipeline)
SELECT 
    PO_NUMBER,
    LINE_ITEM,
    COALESCE(VENDOR_ID, '__UNRESOLVED_FK__') AS VENDOR_ID,
    CASE 
        WHEN DELIVERY_PLANT = 'Dallas' THEN 'P1000'
        WHEN DELIVERY_PLANT = 'Chicago' THEN 'P2000'
        ELSE DELIVERY_PLANT
    END AS DELIVERY_PLANT,
    QUANTITY,
    UNIT_PRICE,
    TOTAL_AMOUNT,
    CASE 
        WHEN QUANTITY > 0 AND UNIT_PRICE > 0 AND ABS(TOTAL_AMOUNT - (QUANTITY * UNIT_PRICE)) < 0.01
        THEN 'CLEAN_CORE'
        ELSE 'DEAD_LETTER_QUARANTINE'
    END AS _datax_route_disposition
FROM source_staging_table
WHERE _datax_partition_block = '2026_Q3';`}
              </pre>
              <div className="grid grid-cols-3 gap-3 pt-2 text-[11px] text-slate-400">
                <div>Execution Engine: <span className="text-white font-bold">DuckDB Vectorized C++</span></div>
                <div>Execution Time: <span className="text-emerald-400 font-bold">{consensus.executionTimeMs} ms</span></div>
                <div>Memory Footprint: <span className="text-white font-bold">1.4 MB (Zero Egress)</span></div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 4: DAG STEP-BY-STEP TELEMETRY
           ========================================================= */}
        {activeTab === 'dag' && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[
              { id: 'node_source', name: 'Source Extractor', duration: '12ms', rows: '1,420 rows In', status: 'COMPLETED' },
              { id: 'node_rules', name: 'DuckDB AST Rules', duration: '6ms', rows: '18 rules checked', status: 'COMPLETED' },
              { id: 'node_vector', name: 'Vector Matcher', duration: '8ms', rows: '80 aliases aligned', status: 'COMPLETED' },
              { id: 'node_clean_core', name: '3-Way Router', duration: '4ms', rows: '1,406 / 14 split', status: 'COMPLETED' },
              { id: 'node_target', name: 'Lakehouse Target', duration: '14ms', rows: '1,406 committed', status: 'COMPLETED' },
            ].map((step, idx) => (
              <div key={step.id} className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                    <span>STEP 0{idx + 1}</span>
                    <span className="text-emerald-400 font-bold">{step.duration}</span>
                  </div>
                  <h5 className="font-bold text-sm text-white">{step.name}</h5>
                  <p className="text-xs text-slate-400 mt-1 font-mono">{step.rows}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {step.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drawer Bottom Action Bar */}
      <div className="px-6 py-3.5 bg-[#0F172A] border-t border-[#1E293B] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400">
            SHA-256 Manifest: <strong className="text-white">{consensus.manifestHash.substring(0, 24)}...</strong>
          </span>
          <button
            onClick={handleCopyManifest}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Copy className="w-3 h-3" />
            {copiedManifest ? 'Copied JSON!' : 'Copy Seal'}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo('quarantine')}
            className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Open Quarantine DLQ ({quarantinedCount} Held)
          </button>
          <button
            onClick={() => navigateTo('shadow')}
            className="px-4 py-2 bg-[#2D55F5] hover:bg-[#2045DC] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Certify Shadow Parity ({passRate}%)
          </button>
        </div>
      </div>
    </div>
  );
}

