import React from 'react';

export default function QuarantineModalPanel({
  quarantineTable,
  setQuarantineTable,
  quarantineAlertWebhook,
  setQuarantineAlertWebhook,
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-slate-800 mb-1">Quarantine Table Name</label>
        <input
          type="text"
          value={quarantineTable}
          onChange={(e) => setQuarantineTable(e.target.value)}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 font-mono"
        />
      </div>

      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
        <span className="text-xs font-bold text-amber-900 block">Audit-Locked Dead-Letter Storage</span>
        <span className="text-[11px] text-amber-800 block">
          Records violating critical validation rules are preserved here with full violation telemetry for audit review.
        </span>
      </div>

      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-800 block">Spike Alert Webhook</span>
          <span className="text-[11px] text-slate-500">Alert Slack/Email if quarantined rows exceed 10 records</span>
        </div>
        <input
          type="checkbox"
          checked={quarantineAlertWebhook}
          onChange={(e) => setQuarantineAlertWebhook(e.target.checked)}
          className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
        />
      </div>
    </div>
  );
}

