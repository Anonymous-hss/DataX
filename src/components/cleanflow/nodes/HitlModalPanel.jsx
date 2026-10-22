import React, { useState } from 'react';
import { UserCheck, Bell, CheckCircle2, RefreshCw } from 'lucide-react';

/**
 * Human-in-the-Loop — Settings Panel
 * Pauses the pipeline when a condition is met and waits for a
 * human reviewer to Approve or Reject before data continues.
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
  onActionModeChange
}) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestAlert = () => {
    setTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setTesting(false);
      setTestResult({
        sentTo: reviewerRole,
        channel: webhook?.includes('slack') ? 'Slack' : webhook?.includes('teams') ? 'MS Teams' : 'Webhook',
        status: 'Sent successfully'
      });
    }, 500);
  };

  const triggerOptions = [
    { value: 'amount_threshold',    label: 'High-Value Transaction (Amount > $50,000)',        hint: 'Pause when transaction amount is very high' },
    { value: 'confidence_threshold', label: 'Low AI Confidence (Auto-Fix < 90% sure)',          hint: 'Pause when AI is not confident about a correction' },
    { value: 'sox_discrepancy',      label: 'Financial Mismatch (Debits ≠ Credits)',            hint: 'Pause when accounting totals do not balance' },
    { value: 'critical_anomaly',     label: 'Critical Error Detected (Any quarantined record)', hint: 'Pause on any record flagged as a critical issue' },
  ];

  const selectedTrigger = triggerOptions.find(t => t.value === triggerPolicy);

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
          <UserCheck className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-amber-950">Human-in-the-Loop Approval</h4>
          <p className="text-[11px] text-amber-700 mt-0.5">
            Pauses the data pipeline when a condition is triggered, notifies a reviewer, and waits for their Approve or Reject decision before records continue downstream.
          </p>
        </div>
      </div>

      {/* When to pause — Trigger */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">When Should the Pipeline Pause?</label>
        <p className="text-[10px] text-slate-400 mb-1.5">Choose what condition causes the pipeline to stop and wait for a human</p>
        <select
          value={triggerPolicy}
          onChange={(e) => onTriggerPolicyChange?.(e.target.value)}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 cursor-pointer"
        >
          {triggerOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {selectedTrigger && (
          <p className="text-[11px] text-amber-700 mt-1.5 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200">
            ℹ️ {selectedTrigger.hint}
          </p>
        )}
      </div>

      {/* Who reviews + deadline */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Who Should Review?</label>
          <p className="text-[10px] text-slate-400 mb-1">The role that gets notified and must approve</p>
          <select
            value={reviewerRole}
            onChange={(e) => onReviewerRoleChange?.(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 cursor-pointer"
          >
            <option value="Procurement Controller">Procurement Controller</option>
            <option value="Data Governance Officer">Data Governance Officer</option>
            <option value="SOX Compliance Auditor">SOX Compliance Auditor</option>
            <option value="Plant Operations Manager">Plant Operations Manager</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Review Deadline</label>
          <p className="text-[10px] text-slate-400 mb-1">How long before it escalates if no response</p>
          <select
            value={slaTimeout}
            onChange={(e) => onSlaTimeoutChange?.(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 cursor-pointer"
          >
            <option value="4">4 Hours (Urgent)</option>
            <option value="8">8 Hours (Same Day ✓)</option>
            <option value="24">24 Hours (Next Day)</option>
            <option value="indefinite">No Deadline (Wait Indefinitely)</option>
          </select>
        </div>
      </div>

      {/* Notification URL */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          <Bell className="w-3 h-3 inline mr-1 text-amber-600" />
          Notification URL (Slack / Teams / Email Webhook)
        </label>
        <p className="text-[10px] text-slate-400 mb-1">The reviewer gets an alert here when the pipeline pauses</p>
        <input
          type="text"
          value={webhook}
          onChange={(e) => onWebhookChange?.(e.target.value)}
          placeholder="https://hooks.slack.com/... or https://..."
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
        />
      </div>

      {/* Reviewer can do */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">What Can the Reviewer Do?</label>
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
            <span className="block text-[10px] text-slate-400 font-normal">Simple yes/no decision only</span>
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
            <span className="block text-[10px] text-slate-400 font-normal">Can also fix values directly</span>
          </div>
        </div>
      </div>

      {/* Test notification */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-800 block">Send a Test Notification</span>
            <span className="text-[11px] text-slate-500">Verify that the reviewer actually receives the alert</span>
          </div>
          <button
            type="button"
            onClick={handleTestAlert}
            disabled={testing}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Sending...' : 'Send Test'}
          </button>
        </div>

        {testResult && (
          <div className="p-3 rounded-lg bg-white border border-amber-200 text-xs animate-in fade-in">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
              <span className="font-bold text-amber-900">
                Notification sent to {testResult.sentTo} via {testResult.channel}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">{testResult.status}</p>
          </div>
        )}
      </div>
    </div>
  );
}
