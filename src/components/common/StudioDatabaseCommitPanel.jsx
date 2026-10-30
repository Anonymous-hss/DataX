import React, { useState, useEffect } from 'react';
import { Database, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../services/apiClient';

/**
 * Reusable Destination Database Commit Panel for AI Firewall & ML Certification Workbenches.
 * Pushes sanitized RAG chunks or certified ML/SFT datasets directly into PostgreSQL or MongoDB.
 */
export default function StudioDatabaseCommitPanel({
  records = [],
  suggestedTableName = 'datax_certified_output',
  recordLabel = 'records',
}) {
  const [engine, setEngine] = useState('postgres');
  const [useWorkspaceDb, setUseWorkspaceDb] = useState(true);
  const [connectionUri, setConnectionUri] = useState('');
  const [databaseName, setDatabaseName] = useState('');
  const [tableName, setTableName] = useState(suggestedTableName);
  const [writeMode, setWriteMode] = useState('replace');

  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    if (suggestedTableName) {
      setTableName(suggestedTableName);
    }
  }, [suggestedTableName]);

  const handleEngineChange = (nextEng) => {
    setEngine(nextEng);
    if (nextEng !== 'postgres') {
      setUseWorkspaceDb(false);
    }
    setError('');
    setReceipt(null);
  };

  const handleCommit = async () => {
    if (!records || records.length === 0) {
      setError(`No ${recordLabel} available to commit.`);
      return;
    }
    if (!tableName.trim()) {
      setError('Please enter a target table or collection name.');
      return;
    }

    setError('');
    setReceipt(null);
    setCommitting(true);
    try {
      const res = await api.post('/studio/db/commit', {
        engine,
        tableName: tableName.trim(),
        records,
        connectionUri: useWorkspaceDb ? null : connectionUri.trim(),
        database: databaseName.trim() || null,
        writeMode,
        useWorkspaceDb: engine === 'postgres' && useWorkspaceDb,
      });
      setReceipt(res);
    } catch (err) {
      setError(err.message || 'Database commit failed.');
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-[#2D55F5]" />
          <span className="text-xs font-bold text-slate-900">
            Deliver Directly to Target Database ({records.length.toLocaleString()} {recordLabel})
          </span>
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleEngineChange('postgres')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              engine === 'postgres' ? 'bg-[#2D55F5] text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            PostgreSQL
          </button>
          <button
            type="button"
            onClick={() => handleEngineChange('mongodb')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              engine === 'mongodb' ? 'bg-[#2D55F5] text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            MongoDB
          </button>
        </div>
      </div>

      {engine === 'postgres' && (
        <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer select-none">
          <input
            type="checkbox"
            checked={useWorkspaceDb}
            onChange={(e) => setUseWorkspaceDb(e.target.checked)}
            className="rounded border-slate-300 text-[#2D55F5] focus:ring-[#2D55F5]"
          />
          <span>Commit to DataX Workspace PostgreSQL</span>
        </label>
      )}

      {(!useWorkspaceDb || engine === 'mongodb') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <div className={engine === 'mongodb' ? 'md:col-span-2' : 'md:col-span-3'}>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Target {engine === 'mongodb' ? 'MongoDB' : 'PostgreSQL'} Connection URI
            </label>
            <input
              type="password"
              value={connectionUri}
              onChange={(e) => setConnectionUri(e.target.value)}
              placeholder={
                engine === 'mongodb'
                  ? 'mongodb+srv://user:password@cluster.mongodb.net/dbname'
                  : 'postgresql://user:password@host:5432/dbname?sslmode=require'
              }
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono text-slate-800 focus:outline-none focus:border-[#2D55F5]"
            />
          </div>
          {engine === 'mongodb' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Target Database</label>
              <input
                type="text"
                value={databaseName}
                onChange={(e) => setDatabaseName(e.target.value)}
                placeholder="e.g. ai_verified_store"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#2D55F5]"
              />
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
        <div className="sm:col-span-5">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Target {engine === 'mongodb' ? 'Collection' : 'Table'} Name
          </label>
          <input
            type="text"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            placeholder="e.g. certified_training_v1"
            className="w-full h-[34px] px-3 rounded-lg border border-slate-200 bg-white text-xs font-mono text-slate-800 focus:outline-none focus:border-[#2D55F5]"
          />
        </div>

        <div className="sm:col-span-3">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Write Mode</label>
          <select
            value={writeMode}
            onChange={(e) => setWriteMode(e.target.value)}
            className="w-full h-[34px] px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-[#2D55F5]"
          >
            <option value="replace">Replace (Overwrite Table)</option>
            <option value="append">Append Rows</option>
          </select>
        </div>

        <div className="sm:col-span-4">
          <button
            type="button"
            onClick={handleCommit}
            disabled={committing || records.length === 0 || (!useWorkspaceDb && !connectionUri.trim())}
            className="w-full h-[34px] px-3 rounded-lg bg-[#2D55F5] hover:bg-[#2045DC] disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{committing ? 'Committing...' : `Commit ${records.length.toLocaleString()} Rows`}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {receipt && (
        <div className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <div>
            <p className="font-bold">
              Committed {Number(receipt.rowsCommitted).toLocaleString()} rows to {receipt.engine.toUpperCase()} table{' '}
              <code className="px-1.5 py-0.5 rounded bg-white border border-emerald-200 font-mono">
                {receipt.tableName}
              </code>
            </p>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              Verified target row count: <strong>{Number(receipt.totalRowsInTarget).toLocaleString()}</strong> • Mode:{' '}
              {receipt.writeMode} • Latency: {receipt.latencyMs}ms
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
