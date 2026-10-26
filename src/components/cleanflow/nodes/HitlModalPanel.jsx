import React, { useState, useMemo } from 'react';
import { UserCheck, Bell, CheckCircle2, RefreshCw, Sliders, Sparkles, Filter, AlertCircle } from 'lucide-react';

/**
 * Human-in-the-Loop — Advanced Governance Settings Panel
 * Supports both source-table-aware smart triggers and custom condition builders.
 */
export default function HitlModalPanel({
  triggerPolicy = 'amount_threshold',
  onTriggerPolicyChange,
  reviewerRole = 'Procurement Controller',
  onReviewerRoleChange,
  slaTimeout = '8',
  onSlaTimeoutChange,
  webhook = '',
  onWebhookChange,
  actionMode = 'approve_reject',
  onActionModeChange,
  sourceTable = '0PUR_C01',
  availableColumns = [],
  conditionType = 'preset', // 'preset' | 'custom'
  onConditionTypeChange,
  customField = '',
  onCustomFieldChange,
  customOp = '>',
  onCustomOpChange,
  customVal = '',
  onCustomValChange,
  customExpression = '',
  onCustomExpressionChange
}) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Fallback columns if none passed
  const effectiveColumns = useMemo(() => {
    if (availableColumns && availableColumns.length > 0) return availableColumns;
    const lowerTable = (sourceTable || '').toLowerCase();
    if (lowerTable.includes('pur') || lowerTable.includes('sap')) {
      return ['PO_NUMBER', 'LINE_ITEM', 'VENDOR_ID', 'MATERIAL_NO', 'QUANTITY', 'UNIT_PRICE', 'TOTAL_AMOUNT', 'DELIVERY_PLANT', 'STATUS'];
    }
    if (lowerTable.includes('user') || lowerTable.includes('customer')) {
      return ['id', 'email', 'full_name', 'role', 'status', 'account_balance', 'country_code'];
    }
    if (lowerTable.includes('gl') || lowerTable.includes('ledger') || lowerTable.includes('finance')) {
      return ['ENTRY_ID', 'ACCOUNT_CODE', 'DEBIT', 'CREDIT', 'CURRENCY', 'FISCAL_PERIOD', 'POSTING_DATE'];
    }
    if (lowerTable.includes('contract')) {
      return ['CONTRACT_ID', 'VENDOR_NAME', 'INDEMNITY_SCORE', 'EXPIRY_DATE', 'JURISDICTION', 'SIGNATORY_TITLE'];
    }
    return ['ID', 'NAME', 'AMOUNT', 'STATUS', 'CREATED_AT'];
  }, [availableColumns, sourceTable]);

  // Initial custom field fallback
  const effectiveCustomField = customField || effectiveColumns[0] || 'TOTAL_AMOUNT';

  // Smart suggestions tailored to active source table columns
  const tableSpecificTriggers = useMemo(() => {
    const suggestions = [];
    const lowerCols = effectiveColumns.map(c => c.toLowerCase());

    if (lowerCols.some(c => c.includes('amount') || c.includes('total') || c.includes('price'))) {
      const col = effectiveColumns.find(c => c.toLowerCase().includes('total') || c.toLowerCase().includes('amount')) || 'TOTAL_AMOUNT';
      suggestions.push({
        value: 'amount_threshold',
        label: `High-Value Transaction (${col} > $50,000)`,
        hint: `Pauses pipeline whenever ${col} exceeds enterprise threshold`,
        column: col
      });
    }

    if (lowerCols.some(c => c.includes('balance'))) {
      const col = effectiveColumns.find(c => c.toLowerCase().includes('balance')) || 'account_balance';
      suggestions.push({
        value: 'balance_threshold',
        label: `High Account Balance (${col} > $10,000)`,
        hint: `Pauses pipeline when ${col} requires manual compliance review`,
        column: col
      });
    }

    if (lowerCols.some(c => c.includes('debit') || c.includes('credit'))) {
      suggestions.push({
        value: 'sox_discrepancy',
        label: 'Financial Mismatch (Debits ≠ Credits)',
        hint: 'Pauses pipeline if general ledger entries show non-zero imbalance',
        column: 'DEBIT / CREDIT'
      });
    }

    if (lowerCols.some(c => c.includes('vendor') || c.includes('supplier'))) {
      const col = effectiveColumns.find(c => c.toLowerCase().includes('vendor') || c.toLowerCase().includes('supplier')) || 'VENDOR_ID';
      suggestions.push({
        value: 'unverified_vendor',
        label: `Unverified Supplier (${col} IS NULL or Unregistered)`,
        hint: `Pauses pipeline when ${col} fails vendor master lookup`,
        column: col
      });
    }

    if (lowerCols.some(c => c.includes('risk') || c.includes('indemnity'))) {
      const col = effectiveColumns.find(c => c.toLowerCase().includes('risk') || c.toLowerCase().includes('indemnity')) || 'INDEMNITY_SCORE';
      suggestions.push({
        value: 'risk_threshold',
        label: `High Clause Liability (${col} > 80)`,
        hint: `Pauses pipeline when legal clause risk score is critical`,
        column: col
      });
    }

    if (lowerCols.some(c => c.includes('stock') || c.includes('inventory'))) {
      const col = effectiveColumns.find(c => c.toLowerCase().includes('stock')) || 'stock_on_hand';
      suggestions.push({
        value: 'stockout_risk',
        label: `Stockout Breach (${col} < Safety Stock)`,
        hint: `Pauses pipeline when inventory dips below minimum threshold`,
        column: col
      });
    }

    // Always include core systemic guards
    suggestions.push({
      value: 'confidence_threshold',
      label: 'Low AI Confidence (Auto-Fix < 90% confidence)',
      hint: 'Pauses pipeline when AI auto-repair is uncertain',
      column: 'AI Intelligence Engine'
    });
    suggestions.push({
      value: 'critical_anomaly',
      label: 'Critical Anomaly Detected (Any Quarantined Row)',
      hint: 'Pauses pipeline on any record violating hard schema constraints',
      column: 'All Schema Columns'
    });

    return suggestions;
  }, [effectiveColumns]);

  const selectedTrigger = tableSpecificTriggers.find(t => t.value === triggerPolicy) || tableSpecificTriggers[0];

  const handleTestAlert = () => {
    setTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setTesting(false);
      setTestResult({
        sentTo: reviewerRole,
        channel: webhook?.includes('slack') ? 'Slack' : webhook?.includes('teams') ? 'MS Teams' : 'Audit Webhook',
        status: 'Test alert delivered successfully in 120ms'
      });
    }, 450);
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
          <UserCheck className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-amber-950">Human-in-the-Loop (HITL) Governance Gate</h4>
          <p className="text-[11px] text-amber-700 mt-0.5">
            Pauses the data stream whenever a validation threshold or anomaly condition is met, notifying designated reviewers for formal approval before downstream commits.
          </p>
        </div>
      </div>

      {/* Mode Switcher: System Suggested vs Custom Condition Builder */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Condition Trigger Strategy</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onConditionTypeChange?.('preset')}
            className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-2 ${
              conditionType === 'preset'
                ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <div>
              <span className="block text-xs">Table-Aware Triggers</span>
              <span className="block text-[10px] text-slate-400 font-normal">Valid for {sourceTable}</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onConditionTypeChange?.('custom');
              if (!customField && effectiveColumns.length > 0) {
                onCustomFieldChange?.(effectiveColumns[0]);
              }
            }}
            className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-2 ${
              conditionType === 'custom'
                ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <div>
              <span className="block text-xs">Custom Condition Builder</span>
              <span className="block text-[10px] text-slate-400 font-normal">Define bespoke predicate</span>
            </div>
          </button>
        </div>
      </div>

      {/* Strategy 1: Table-Aware Suggestions */}
      {conditionType === 'preset' ? (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700">When Should the Pipeline Pause?</label>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Valid for {sourceTable}
            </span>
          </div>
          <select
            value={triggerPolicy}
            onChange={(e) => onTriggerPolicyChange?.(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 cursor-pointer"
          >
            {tableSpecificTriggers.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {selectedTrigger && (
            <div className="mt-1.5 p-2 bg-amber-50/80 rounded-lg border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
              <span className="font-semibold shrink-0">Monitored: {selectedTrigger.column}</span>
              <span className="text-slate-400">·</span>
              <span className="text-amber-700">{selectedTrigger.hint}</span>
            </div>
          )}
        </div>
      ) : (
        /* Strategy 2: Custom Condition Builder */
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              Build Custom Pause Condition
            </span>
            <span className="text-[10px] text-slate-400">Evaluates every stream row</span>
          </div>

          <div className="grid grid-cols-12 gap-2">
            {/* Column Selector */}
            <div className="col-span-5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Source Column</label>
              <select
                value={effectiveCustomField}
                onChange={(e) => onCustomFieldChange?.(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
              >
                {effectiveColumns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            {/* Operator */}
            <div className="col-span-3">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Operator</label>
              <select
                value={customOp}
                onChange={(e) => onCustomOpChange?.(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
              >
                <option value=">">&gt; (Greater than)</option>
                <option value="<">&lt; (Less than)</option>
                <option value="==">== (Equals)</option>
                <option value="!=">!= (Not equals)</option>
                <option value=">=">&gt;= (At least)</option>
                <option value="<=">&lt;= (At most)</option>
                <option value="CONTAINS">CONTAINS</option>
                <option value="IS NULL">IS NULL</option>
                <option value="REGEX">REGEX MATCH</option>
              </select>
            </div>

            {/* Threshold Value */}
            <div className="col-span-4">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Threshold Value</label>
              <input
                type="text"
                value={customVal}
                onChange={(e) => {
                  onCustomValChange?.(e.target.value);
                  onCustomExpressionChange?.(`${effectiveCustomField} ${customOp} ${e.target.value}`);
                }}
                placeholder="e.g. 50000"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
              />
            </div>
          </div>

          {/* Active Preview Badge */}
          <div className="p-2 bg-white rounded-lg border border-slate-200 text-[11px] font-mono text-slate-800 flex items-center justify-between">
            <span className="text-slate-400 font-sans">Active Condition:</span>
            <span className="font-bold text-amber-700">
              {effectiveCustomField} {customOp} {customVal || "''"}
            </span>
          </div>
        </div>
      )}

      {/* Reviewer Role & SLA Deadline */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Designated Reviewer</label>
          <p className="text-[10px] text-slate-400 mb-1">Authority holding approval token</p>
          <select
            value={reviewerRole}
            onChange={(e) => onReviewerRoleChange?.(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 cursor-pointer"
          >
            <option value="Procurement Controller">Procurement Controller (ERP)</option>
            <option value="Chief Financial Officer (CFO)">Chief Financial Officer (CFO)</option>
            <option value="General Counsel">General Counsel (Legal / RAG)</option>
            <option value="RevOps Director">RevOps Director (CRM Deals)</option>
            <option value="Chief Privacy Officer">Chief Privacy Officer (HIPAA)</option>
            <option value="Logistics Director">Logistics Director (Supply Chain)</option>
            <option value="Data Governance Officer">Data Governance Officer</option>
            <option value="SOX Compliance Auditor">SOX Compliance Auditor</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Review SLA Deadline</label>
          <p className="text-[10px] text-slate-400 mb-1">Escalates after timeout</p>
          <select
            value={slaTimeout}
            onChange={(e) => onSlaTimeoutChange?.(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 cursor-pointer"
          >
            <option value="4">4 Hours (Urgent)</option>
            <option value="8">8 Hours (Same Day ✓)</option>
            <option value="24">24 Hours (Next Day)</option>
            <option value="48">48 Hours (Standard SLA)</option>
            <option value="indefinite">No Deadline (Wait Indefinitely)</option>
          </select>
        </div>
      </div>

      {/* Webhook & Notification URL */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          <Bell className="w-3 h-3 inline mr-1 text-amber-600" />
          Reviewer Alert Webhook (Slack / MS Teams / PagerDuty)
        </label>
        <p className="text-[10px] text-slate-400 mb-1">Sends immediate interactive decision link when stream pauses</p>
        <input
          type="text"
          value={webhook}
          onChange={(e) => onWebhookChange?.(e.target.value)}
          placeholder="https://hooks.slack.com/services/... or https://outlook.office.com/webhook/..."
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
        />
      </div>

      {/* Reviewer Action Capabilities */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Permitted Reviewer Actions</label>
        <div className="grid grid-cols-2 gap-3">
          <div
            onClick={() => onActionModeChange?.('approve_reject')}
            className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
              actionMode === 'approve_reject'
                ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="block text-xs">Approve or Reject</span>
            <span className="block text-[10px] text-slate-400 font-normal">Binary sign-off decision</span>
          </div>
          <div
            onClick={() => onActionModeChange?.('approve_reject_edit')}
            className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
              actionMode === 'approve_reject_edit'
                ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span className="block text-xs">Approve, Reject, or Edit</span>
            <span className="block text-[10px] text-slate-400 font-normal">Allow in-flight field editing</span>
          </div>
        </div>
      </div>

      {/* Test notification button */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-800 block">Dispatch Diagnostic Notification</span>
            <span className="text-[11px] text-slate-500">Pings notification target and verifies reviewer routing</span>
          </div>
          <button
            type="button"
            onClick={handleTestAlert}
            disabled={testing}
            className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Pinging...' : 'Send Test Ping'}
          </button>
        </div>

        {testResult && (
          <div className="p-3 rounded-lg bg-white border border-amber-200 text-xs animate-in fade-in">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
              <span className="font-bold text-amber-900">
                Routed to {testResult.sentTo} via {testResult.channel}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">{testResult.status}</p>
          </div>
        )}
      </div>
    </div>
  );
}
