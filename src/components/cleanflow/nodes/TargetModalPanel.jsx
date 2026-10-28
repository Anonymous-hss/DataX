import React, { useMemo } from 'react';
import { Check, AlertTriangle, RefreshCw, Database, Sparkles } from 'lucide-react';

export default function TargetModalPanel({
  sourceTable = '',
  tgtDbType,
  setTgtDbType,
  tgtEndpoint,
  setTgtEndpoint,
  tgtTable,
  setTgtTable,
  writeMode,
  setWriteMode,
  targetVerificationGate,
  setTargetVerificationGate,
  tgtTesting,
  tgtTestMeta,
  handleTestTargetConnection,
}) {
  const hasDiscoveredTables = Boolean(
    tgtTestMeta?.success && Array.isArray(tgtTestMeta?.tables) && tgtTestMeta.tables.length > 0
  );

  // Suggested clean target table names based on active source table
  const suggestedNames = useMemo(() => {
    if (!sourceTable) return ['clean_output_table', 'analytics_gold'];
    const bare = sourceTable.replace(/^raw_/, '');
    const list = [bare, `${sourceTable}_clean`, `${bare}_clean`, `${bare}_gold`];
    return [...new Set(list)];
  }, [sourceTable]);

  return (
    <div className="space-y-4">
      {/* Header with Source Detection Context */}
      <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 flex-wrap">
        <div>
          <span className="text-xs font-bold text-emerald-950 block">Target Commitment Destination</span>
          <span className="text-[11px] text-emerald-700">
            Destination system where compliant golden records are committed.
          </span>
        </div>
        {sourceTable && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-md bg-white border border-emerald-200 text-slate-700">
            <Database className="w-3 h-3 text-emerald-600" />
            <span className="text-slate-500">Source:</span>
            <span className="font-mono font-bold text-emerald-900">{sourceTable}</span>
          </span>
        )}
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-800 mb-1">Target System Destination</label>
        <select
          value={tgtDbType}
          onChange={(e) => setTgtDbType(e.target.value)}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 cursor-pointer"
        >
          <option value="SAP S/4HANA">SAP S/4HANA Clean Core (BAPI_PO_CREATE1 / OData)</option>
          <option value="PostgreSQL">PostgreSQL (Neon / Amazon RDS Gold)</option>
          <option value="Databricks Unity Catalog">Databricks Unity Catalog (Delta Lake Gold)</option>
          <option value="Snowflake Data Cloud">Snowflake Modernized Layer</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Target Endpoint / Connection URI</label>
        <input
          type="text"
          value={tgtEndpoint}
          onChange={(e) => setTgtEndpoint(e.target.value)}
          placeholder="postgresql://user:pass@host/neondb?sslmode=require"
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 font-mono"
        />
      </div>

      {/* Target Connectivity Test */}
      {handleTestTargetConnection && (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-800 block">Target Database Connectivity</span>
            <span className="text-[11px] text-slate-500">Verifies write endpoint & discovers target tables</span>
          </div>
          <div className="min-w-0 flex items-center gap-3">
            {tgtTestMeta && (
              tgtTestMeta.success ? (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 shadow-xs">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Connected ({tgtTestMeta.latencyMs}ms)
                </span>
              ) : (
                <span
                  className="max-w-[260px] text-xs font-bold text-rose-700 flex items-center gap-1.5 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 truncate"
                  title={tgtTestMeta.error || tgtTestMeta.message}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span className="truncate">{tgtTestMeta.error || tgtTestMeta.message || 'Failed'}</span>
                </span>
              )
            )}
            <button
              type="button"
              onClick={handleTestTargetConnection}
              disabled={tgtTesting}
              className="shrink-0 whitespace-nowrap px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${tgtTesting ? 'animate-spin' : ''}`} />
              {tgtTesting ? 'Testing...' : 'Test Target'}
            </button>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-semibold text-slate-700">Target Table / Entity</label>
          {hasDiscoveredTables && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <Database className="w-3 h-3 text-emerald-600" />
              {tgtTestMeta.tables.length} Existing Tables Discovered
            </span>
          )}
        </div>
        {hasDiscoveredTables && (
          <select
            value={tgtTestMeta.tables.includes(tgtTable) ? tgtTable : ''}
            onChange={(e) => {
              if (e.target.value) setTgtTable(e.target.value);
            }}
            className="w-full mb-2 px-3 py-2 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-bold text-slate-900 cursor-pointer"
          >
            <option value="">— Quick-Select Existing Table in Target DB (or type custom name below) —</option>
            {tgtTestMeta.tables.map((t) => (
              <option key={t} value={t}>
                [Existing Table] {t}
              </option>
            ))}
          </select>
        )}
        <input
          type="text"
          value={tgtTable}
          onChange={(e) => setTgtTable(e.target.value)}
          placeholder={`e.g. ${suggestedNames[0] || 'customers'}`}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 font-mono"
        />

        {/* Suggested table names */}
        <div className="mt-2 space-y-1">
          <span className="text-[10px] font-semibold text-slate-500 block">
            Suggested Target Tables (bound to {sourceTable || 'active source'}):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {suggestedNames.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => setTgtTable(sug)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition-colors cursor-pointer border ${
                  tgtTable === sug
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Write Mode Tabs */}
      <div>
        <label className="block text-xs font-bold text-slate-800 mb-1.5">Writeback Mode</label>
        <div className="grid grid-cols-3 gap-2">
          <div
            onClick={() => setWriteMode('append')}
            className={`p-2.5 rounded-xl border cursor-pointer text-center transition-all ${
              writeMode === 'append'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <span className="block text-xs">Append</span>
            <span className="block text-[10px] text-slate-400 font-normal">Preserve history</span>
          </div>
          <div
            onClick={() => setWriteMode('upsert')}
            className={`p-2.5 rounded-xl border cursor-pointer text-center transition-all ${
              writeMode === 'upsert'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <span className="block text-xs">Upsert</span>
            <span className="block text-[10px] text-slate-400 font-normal">Update by PK</span>
          </div>
          <div
            onClick={() => setWriteMode('overwrite')}
            className={`p-2.5 rounded-xl border cursor-pointer text-center transition-all ${
              writeMode === 'overwrite'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <span className="block text-xs">Overwrite</span>
            <span className="block text-[10px] text-slate-400 font-normal">Truncate & load</span>
          </div>
        </div>
      </div>

      {/* Human Verification Gate Switch */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-800 block">Commitment Verification Gate</span>
          <span className="text-[11px] text-slate-500">Enforce review before committing live data to ERP</span>
        </div>
        <input
          type="checkbox"
          checked={targetVerificationGate}
          onChange={(e) => setTargetVerificationGate(e.target.checked)}
          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
        />
      </div>
    </div>
  );
}
