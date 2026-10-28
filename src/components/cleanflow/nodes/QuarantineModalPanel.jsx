import React from 'react';
import { AlertTriangle, Database, ShieldAlert, Sparkles } from 'lucide-react';

/**
 * Audit Quarantine Store — Settings Panel
 * Dead-letter isolation vault for records violating critical quality and integrity rules.
 * Dynamically binds to the active source table.
 */
export default function QuarantineModalPanel({
  sourceTable = '',
  quarantineTable,
  setQuarantineTable,
  quarantineAlertWebhook,
  setQuarantineAlertWebhook,
}) {
  const defaultQuarantineName = sourceTable ? `${sourceTable}_quarantine` : 'quarantine_dlq';

  const quickPresets = sourceTable
    ? [
        `${sourceTable}_quarantine`,
        `${sourceTable}_violations_dlq`,
        `${sourceTable}_audit_locked`,
      ]
    : ['audit_quarantine_store', 'quarantine_violations_dlq', 'failed_records_vault'];

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-950 flex items-center gap-2">
              <span>Audit Quarantine Store</span>
              <span className="text-[10px] font-semibold text-amber-800 bg-white px-2 py-0.5 rounded-full border border-amber-200">
                Dead-Letter Isolation
              </span>
            </h4>
            <p className="text-[11px] text-amber-700 mt-0.5">
              Records violating critical validation rules are isolated in this tamper-proof store with full row-level violation telemetry for Data Steward audit review.
            </p>
          </div>
        </div>

        {sourceTable && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-md bg-white border border-amber-200 text-slate-700 self-center">
            <Database className="w-3 h-3 text-amber-600" />
            <span className="text-slate-500">Source:</span>
            <span className="font-mono font-bold text-amber-900">{sourceTable}</span>
          </span>
        )}
      </div>

      {/* Quarantine Table Configuration */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-bold text-slate-800">
            Quarantine Table / Storage Key
          </label>
          <button
            type="button"
            onClick={() => setQuarantineTable(defaultQuarantineName)}
            className="text-[10px] font-semibold text-amber-700 hover:text-amber-900 cursor-pointer"
          >
            Reset to Source Default
          </button>
        </div>
        <input
          type="text"
          value={quarantineTable}
          onChange={(e) => setQuarantineTable(e.target.value)}
          placeholder={`e.g. ${defaultQuarantineName}`}
          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
        />

        {/* Quick Name Presets */}
        <div className="mt-2 space-y-1">
          <span className="text-[10px] font-semibold text-slate-500 block">
            Suggested Table Names (bound to {sourceTable || 'active source'}):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {quickPresets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setQuarantineTable(preset)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition-colors cursor-pointer border ${
                  quarantineTable === preset
                    ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* DLQ Durability Card */}
      <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-amber-700" />
          <span className="text-xs font-bold text-amber-950">
            Synchronous Disk Flush (fsync) & Audit Locking
          </span>
        </div>
        <p className="text-[11px] text-amber-800 leading-relaxed">
          Quarantined rows are written atomically to disk before committing golden rows. Each quarantined payload preserves source timestamps, failure rule IDs, and original values so you can remediate or replay them from the Quarantine Workbench.
        </p>
      </div>

      {/* Spike Alert Webhook */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-800 block">Anomaly Spike Alert Webhook</span>
          <span className="text-[11px] text-slate-500">
            Dispatch urgent Slack / Webhook notification if quarantined count exceeds 10 records
          </span>
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
