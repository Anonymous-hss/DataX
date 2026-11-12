import React, { useState, useEffect } from 'react';
import DataXAppShell from '../components/common/DataXAppShell';
import { useNavigation } from '../context/NavigationContext';
import { useRuleEngine } from '../context/RuleEngineContext';
import { api } from '../services/apiClient';
import { addNotification } from '../services/notificationService';
import {
  Search,
  Check,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Copy,
  ChevronDown,
  ArrowRight,
  GitBranch,
  ShieldAlert,
  Terminal,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';

const INITIAL_QUARANTINE_RECORDS = [
  {
    id: 'QR-4500743585',
    recordId: '#PO-4500743585',
    rawRecordId: 'PO-4500743585',
    ruleName: 'PK completeness (VENDOR_ID)',
    failedField: 'VENDOR_ID',
    observedValue: 'EMPTY_STRING',
    severity: 'Critical',
    time: '10:35:51',
    exposureUsd: '$1,045.00',
    aiConfidence: '94% match',
    regulatoryScope: 'BCBS 239 · GDPR',
    regulatoryDetail: 'Principle 3 accuracy · Art 25 privacy by design',
    astExpression: 'UnaryOp(IsNull(VENDOR_ID | CUSTOMER_ID))',
    astDetail: 'Evaluated against VENDOR_ID with value EMPTY_STRING.',
    hypothesis: 'Upstream batch ingest allowed null foreign keys during asynchronous CRM/ERP sync, leaving orphaned transactions that corrupt downstream ledger balances.',
    recommendedAction: 'Resolve the entity alias with the semantic vector matcher, or escalate to a data steward.',
    sourcePayload: {
      PO_NUMBER: '4500743585',
      ITEM_NO: '10',
      MATERIAL_ID: 'MAT-1008',
      QUANTITY: 1,
      UNIT_PRICE: 1045.00,
      DELIVERY_PLANT: 'P2000',
      VENDOR_ID: ''
    },
    sha256: '7f8c28b991ae01bc49...'
  },
  {
    id: 'QR-4500743580',
    recordId: '#PO-4500743580',
    rawRecordId: 'PO-4500743580',
    ruleName: 'Positive quantity (QUANTITY > 0)',
    failedField: 'QUANTITY',
    observedValue: '-20',
    severity: 'Critical',
    time: '10:35:51',
    exposureUsd: '$4,500.00',
    aiConfidence: '98% match',
    regulatoryScope: 'SOX 404 · GAAP',
    regulatoryDetail: 'Negative inventory balance breach · Section 404 internal controls',
    astExpression: 'BinaryOp(QUANTITY <= 0)',
    astDetail: 'Evaluated against QUANTITY with value -20.',
    hypothesis: 'Credit note return transaction ingested without return authorization flag (RMA_FLAG=FALSE), causing negative line items in procurement staging.',
    recommendedAction: 'Apply Clean Core Credit Reversal to split line into dedicated RMA ledger.',
    sourcePayload: {
      PO_NUMBER: '4500743580',
      ITEM_NO: '20',
      MATERIAL_ID: 'MAT-3301',
      QUANTITY: -20,
      UNIT_PRICE: 225.00,
      DELIVERY_PLANT: 'P1000',
      VENDOR_ID: 'V-9012'
    },
    sha256: '8e1b29a002bc11df58...'
  },
  {
    id: 'QR-4500743576',
    recordId: '#PO-4500743576',
    rawRecordId: 'PO-4500743576',
    ruleName: 'Cross-column math (TOTAL = QTY × PRICE)',
    failedField: 'TOTAL_AMOUNT',
    observedValue: '1355.0',
    severity: 'Critical',
    time: '10:35:51',
    exposureUsd: '$1,355.00',
    aiConfidence: '91% match',
    regulatoryScope: 'SOX 404 · GAAP',
    regulatoryDetail: 'Discrepancy between stated line item total and component product',
    astExpression: 'BinaryOp(TOTAL_AMOUNT != QUANTITY * UNIT_PRICE)',
    astDetail: 'Evaluated TOTAL_AMOUNT 1355.0 vs expected 1045.0 (diff $310.00).',
    hypothesis: 'Discretionary shipping surcharge appended to total amount without corresponding surcharge itemized line entry.',
    recommendedAction: 'Normalize total amount to match verified unit price calculation.',
    sourcePayload: {
      PO_NUMBER: '4500743576',
      ITEM_NO: '10',
      MATERIAL_ID: 'MAT-1008',
      QUANTITY: 1,
      UNIT_PRICE: 1045.00,
      TOTAL_AMOUNT: 1355.00,
      DELIVERY_PLANT: 'P1000',
      VENDOR_ID: 'V-1002'
    },
    sha256: '9a2c30b113cd22ef69...'
  },
  {
    id: 'QR-4500743573',
    recordId: '#PO-4500743573',
    rawRecordId: 'PO-4500743573',
    ruleName: 'Positive quantity (QUANTITY > 0)',
    failedField: 'QUANTITY',
    observedValue: '-20',
    severity: 'Critical',
    time: '10:35:51',
    exposureUsd: '$3,800.00',
    aiConfidence: '96% match',
    regulatoryScope: 'SOX 404 · GAAP',
    regulatoryDetail: 'Negative line quantity violates SAP BAPI writeback validation',
    astExpression: 'BinaryOp(QUANTITY <= 0)',
    astDetail: 'Evaluated against QUANTITY with value -20.',
    hypothesis: 'Inventory adjustment feed improperly mapped into active procurement batch.',
    recommendedAction: 'Route to Inventory Accounting lead for manual authorization.',
    sourcePayload: {
      PO_NUMBER: '4500743573',
      ITEM_NO: '10',
      MATERIAL_ID: 'MAT-2041',
      QUANTITY: -20,
      UNIT_PRICE: 190.00,
      DELIVERY_PLANT: 'P2000',
      VENDOR_ID: 'V-4011'
    },
    sha256: 'ab3d41c224de33fa70...'
  },
  {
    id: 'QR-4500743569',
    recordId: '#PO-4500743569',
    rawRecordId: 'PO-4500743569',
    ruleName: 'Cross-column math (TOTAL = QTY × PRICE)',
    failedField: 'TOTAL_AMOUNT',
    observedValue: '693.5',
    severity: 'Critical',
    time: '10:35:51',
    exposureUsd: '$693.50',
    aiConfidence: '89% match',
    regulatoryScope: 'SOX 404 · GAAP',
    regulatoryDetail: 'Mathematical parity violation across financial fields',
    astExpression: 'BinaryOp(TOTAL_AMOUNT != QUANTITY * UNIT_PRICE)',
    astDetail: 'Evaluated TOTAL_AMOUNT 693.5 vs expected 500.0.',
    hypothesis: 'Currency conversion rounding artifact generated in upstream Informix gateway.',
    recommendedAction: 'Apply automated counterfactual price reconciliation.',
    sourcePayload: {
      PO_NUMBER: '4500743569',
      ITEM_NO: '10',
      MATERIAL_ID: 'MAT-5020',
      QUANTITY: 10,
      UNIT_PRICE: 50.00,
      TOTAL_AMOUNT: 693.50,
      DELIVERY_PLANT: 'P1000',
      VENDOR_ID: 'V-8821'
    },
    sha256: 'bc4e52d335ef44ab81...'
  },
  {
    id: 'QR-4500743568',
    recordId: '#PO-4500743568',
    rawRecordId: 'PO-4500743568',
    ruleName: 'Positive quantity (QUANTITY > 0)',
    failedField: 'QUANTITY',
    observedValue: '-1',
    severity: 'Critical',
    time: '10:35:51',
    exposureUsd: '$120.00',
    aiConfidence: '99% match',
    regulatoryScope: 'SOX 404 · GAAP',
    regulatoryDetail: 'Sample test order with negative quantity flag',
    astExpression: 'BinaryOp(QUANTITY <= 0)',
    astDetail: 'Evaluated against QUANTITY with value -1.',
    hypothesis: 'Diagnostic probe transaction sent by legacy monitoring script.',
    recommendedAction: 'Purge test record from dead-letter queue.',
    sourcePayload: {
      PO_NUMBER: '4500743568',
      ITEM_NO: '10',
      MATERIAL_ID: 'MAT-1001',
      QUANTITY: -1,
      UNIT_PRICE: 120.00,
      DELIVERY_PLANT: 'P1000',
      VENDOR_ID: 'V-1001'
    },
    sha256: 'cd5f63e446fa55bc92...'
  }
];

export default function QuarantineWorkbenchPage({ onSwitchToMarketing }) {
  const { navigateTo } = useNavigation();
  const { activeThread } = useRuleEngine();
  const [records, setRecords] = useState(INITIAL_QUARANTINE_RECORDS);
  const [selectedRecordId, setSelectedRecordId] = useState(INITIAL_QUARANTINE_RECORDS[0].id);
  const [activeViewTab, setActiveViewTab] = useState('tree'); // 'tree' | 'json'
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All'); // 'All' | 'Critical' | 'Warning'
  const [copiedJson, setCopiedJson] = useState(false);
  const [workflowDropdownOpen, setWorkflowDropdownOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);

  const selectedRecord = records.find(r => r.id === selectedRecordId) || records[0];

  const filteredRecords = records.filter(r => {
    if (severityFilter !== 'All' && r.severity !== severityFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.recordId.toLowerCase().includes(q) ||
        r.ruleName.toLowerCase().includes(q) ||
        r.failedField.toLowerCase().includes(q) ||
        r.observedValue.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopyJson = () => {
    if (!selectedRecord) return;
    const jsonStr = JSON.stringify({
      record_id: selectedRecord.rawRecordId,
      pipeline: 'SAP BW → S/4HANA Clean Core',
      severity: selectedRecord.severity.toUpperCase(),
      failed_rule: selectedRecord.ruleName,
      expression: selectedRecord.astExpression,
      field: selectedRecord.failedField,
      observed_value: selectedRecord.observedValue === 'EMPTY_STRING' ? '' : selectedRecord.observedValue,
      exposure_usd: parseFloat(selectedRecord.exposureUsd.replace(/[^0-9.]/g, '')),
      isolated_at: '2026-11-10T10:35:51Z',
      source_payload: selectedRecord.sourcePayload,
      sha256: selectedRecord.sha256
    }, null, 2);

    navigator.clipboard?.writeText(jsonStr);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleShowPathOnCanvas = () => {
    if (!selectedRecord) return;
    window.location.hash = `#canvas?trace=${selectedRecord.rawRecordId}`;
  };

  const handleRouteToFinance = () => {
    setActionNotice(`Record ${selectedRecord.recordId} successfully routed to Finance Lead for verification.`);
    addNotification({
      title: 'Routed to Finance Lead',
      description: `${selectedRecord.recordId} placed in AP Lead verification queue ($${selectedRecord.exposureUsd}).`,
      type: 'success',
      link: '#quarantine'
    });
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleApplyReversal = () => {
    setActionNotice(`Clean Core Credit Reversal applied to ${selectedRecord.recordId}. Line staged to RMA ledger.`);
    addNotification({
      title: 'Clean Core Reversal Executed',
      description: `Counterfactual repair applied to ${selectedRecord.recordId}.`,
      type: 'success',
      link: '#quarantine'
    });
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handlePurge = () => {
    const recId = selectedRecord.id;
    setRecords(prev => prev.filter(r => r.id !== recId));
    setActionNotice(`Record ${selectedRecord.recordId} purged from dead-letter queue and alert sent.`);
    if (records.length > 1) {
      const next = records.find(r => r.id !== recId);
      if (next) setSelectedRecordId(next.id);
    }
    setTimeout(() => setActionNotice(null), 3500);
  };

  return (
    <DataXAppShell onSwitchToMarketing={onSwitchToMarketing}>
      <main className="max-w-[1360px] mx-auto px-6 py-6 space-y-6 font-sans">
        {/* Action Notice Toast */}
        {actionNotice && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs font-semibold text-emerald-900 flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{actionNotice}</span>
            </div>
            <button
              onClick={() => setActionNotice(null)}
              className="text-emerald-700 hover:text-emerald-950 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Header Row matching Main.png */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Durable dead-letter queue
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Quarantine workbench
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Review isolated records, trace the exact rule that failed and remediate safely, without blind edits.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setRecords(INITIAL_QUARANTINE_RECORDS)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Refresh queue</span>
            </button>
          </div>
        </div>

        {/* Search & Severity Filter Bar matching Main.png */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by record ID, rule or field..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs transition-all"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-xs font-medium text-slate-500 mr-1">Severity</span>
            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs">
              {['All', 'Critical', 'Warning'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    severityFilter === sev
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2-Column Main Split View matching Main.png & Main-1.png */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Isolated Records List (Col span 4) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs font-bold text-slate-800">
                Isolated records · {filteredRecords.length}
              </span>
              <span className="text-[10px] font-mono text-slate-400 font-medium">
                fsync DLQ
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[620px] overflow-y-auto">
              {filteredRecords.map((r) => {
                const isSelected = selectedRecordId === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRecordId(r.id)}
                    className={`p-3.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/50 border-l-4 border-l-blue-600'
                        : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 font-mono text-[11px]">
                          {r.recordId}
                        </span>
                        <span className={`px-2 py-0.2 rounded-full text-[10px] font-semibold border ${
                          r.severity === 'Critical'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {r.severity}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {r.time}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 font-medium mt-1 truncate">
                      {r.ruleName}
                    </p>

                    <div className="flex items-center justify-between text-[11px] font-mono mt-1 text-slate-400">
                      <span>Field: {r.failedField}</span>
                      <span className="text-rose-600 font-bold">{r.observedValue}</span>
                    </div>
                  </div>
                );
              })}

              {filteredRecords.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">
                  No quarantine records match your search.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Root-cause diagnosis & Remediation (Col span 8) */}
          {selectedRecord && (
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
              {/* Header: Title + Subtitle + Toggle Pill */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-2 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 leading-tight">
                    Root-cause diagnosis · {selectedRecord.recordId}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Upstream ETL failure localization and rule evaluation tree
                  </p>
                </div>

                {/* Tab Pill Toggle: [ Root-cause tree ] [ Raw JSON ] */}
                <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 shrink-0">
                  <button
                    onClick={() => setActiveViewTab('tree')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeViewTab === 'tree'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Root-cause tree
                  </button>
                  <button
                    onClick={() => setActiveViewTab('json')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeViewTab === 'json'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Raw JSON
                  </button>
                </div>
              </div>

              {/* VIEW 1: ROOT-CAUSE TREE matching Main.png */}
              {activeViewTab === 'tree' && (
                <div className="space-y-4">
                  {/* 3 Metric Boxes: Exposure at risk, AI confidence, Regulatory scope */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                    <div className="md:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
                      <span className="text-xs font-medium text-slate-500 block">Exposure at risk</span>
                      <div className="text-2xl font-bold text-rose-600 mt-1">
                        {selectedRecord.exposureUsd}
                      </div>
                    </div>

                    <div className="md:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
                      <span className="text-xs font-medium text-slate-500 block">AI confidence</span>
                      <div className="text-2xl font-bold text-blue-600 mt-1">
                        {selectedRecord.aiConfidence}
                      </div>
                    </div>

                    <div className="md:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
                      <span className="text-xs font-medium text-slate-500 block">Regulatory scope</span>
                      <div className="text-lg font-bold text-slate-900 mt-1">
                        {selectedRecord.regulatoryScope}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                        {selectedRecord.regulatoryDetail}
                      </p>
                    </div>
                  </div>

                  {/* Dark Rule Evaluation Node */}
                  <div className="bg-[#0B1120] text-white rounded-2xl p-4 font-mono text-xs space-y-1.5 shadow-sm">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-sans font-semibold">Rule evaluation node</span>
                      <span className="text-emerald-400 font-semibold">Deterministic rule match</span>
                    </div>
                    <div className="text-emerald-400 font-bold text-sm tracking-wide pt-1">
                      {selectedRecord.astExpression}
                    </div>
                    <p className="text-slate-400 text-[11px] font-sans pt-0.5">
                      {selectedRecord.astDetail}
                    </p>
                  </div>

                  {/* Amber Upstream ETL Failure Hypothesis */}
                  <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Upstream ETL failure hypothesis</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {selectedRecord.hypothesis}
                      </p>
                    </div>
                  </div>

                  {/* Green Recommended Action */}
                  <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-4 flex items-start gap-3">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Recommended action</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {selectedRecord.recommendedAction}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Action Buttons Bar matching Main.png */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleShowPathOnCanvas}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        title="View visual canvas trace for this isolated record"
                      >
                        <GitBranch className="w-3.5 h-3.5 text-slate-500" />
                        <span>Show path on canvas</span>
                      </button>

                      <button
                        onClick={handleRouteToFinance}
                        className="px-4 py-2 rounded-xl bg-[#2D55F5] hover:bg-[#2045DC] text-white text-xs font-semibold shadow-2xs hover:shadow transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>Route to finance lead</span>
                      </button>

                      <button
                        onClick={handleApplyReversal}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                        <span>Apply clean core reversal</span>
                      </button>
                    </div>

                    <button
                      onClick={handlePurge}
                      className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Purge &amp; alert</span>
                    </button>
                  </div>
                </div>
              )}

              {/* VIEW 2: RAW JSON matching Main-1.png */}
              {activeViewTab === 'json' && (
                <div className="space-y-4">
                  <div className="bg-[#0B1120] text-emerald-300 font-mono text-xs rounded-2xl p-5 overflow-x-auto shadow-sm leading-relaxed max-h-[500px]">
                    <pre>
{JSON.stringify({
  record_id: selectedRecord.rawRecordId,
  pipeline: 'SAP BW → S/4HANA Clean Core',
  severity: selectedRecord.severity.toUpperCase(),
  failed_rule: selectedRecord.ruleName,
  expression: selectedRecord.astExpression,
  field: selectedRecord.failedField,
  observed_value: selectedRecord.observedValue === 'EMPTY_STRING' ? '' : selectedRecord.observedValue,
  exposure_usd: parseFloat(selectedRecord.exposureUsd.replace(/[^0-9.]/g, '')),
  isolated_at: '2026-11-10T10:35:51Z',
  source_payload: selectedRecord.sourcePayload,
  sha256: selectedRecord.sha256
}, null, 2)}
                    </pre>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <button
                      onClick={handleCopyJson}
                      className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      {copiedJson ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied JSON!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copy JSON</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </DataXAppShell>
  );
}
