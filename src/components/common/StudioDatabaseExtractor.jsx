import React, { useState } from 'react';
import { Database, RefreshCw, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../services/apiClient';

/**
 * Reusable Live Database Source Extractor for AI Firewall & ML Certification Workbenches.
 * Connects to user PostgreSQL / MongoDB (or Workspace PostgreSQL), discovers live tables,
 * and extracts up to 25,000 real records.
 */
export default function StudioDatabaseExtractor({
  onExtracted,
  buttonLabel = 'Extract Table Records',
  defaultLimit = 2500,
  compact = false,
}) {
  const [engine, setEngine] = useState('postgres');
  const [useWorkspaceDb, setUseWorkspaceDb] = useState(true);
  const [connectionUri, setConnectionUri] = useState('');
  const [databaseName, setDatabaseName] = useState('');
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [rowLimit, setRowLimit] = useState(defaultLimit);

  const [discovering, setDiscovering] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState('');
  const [statusNote, setStatusNote] = useState('');

  const handleEngineChange = (nextEng) => {
    setEngine(nextEng);
    if (nextEng !== 'postgres') {
      setUseWorkspaceDb(false);
    }
    setTables([]);
    setSelectedTable('');
    setError('');
    setStatusNote('');
  };

  const handleDiscoverTables = async () => {
    setError('');
    setStatusNote('');
    setDiscovering(true);
    try {
      const res = await api.post('/studio/db/tables', {
        engine,
        connectionUri: useWorkspaceDb ? null : connectionUri.trim(),
        database: databaseName.trim() || null,
        useWorkspaceDb: engine === 'postgres' && useWorkspaceDb,
      });
      const list = res.tableDetails || (res.tables || []).map((t) => ({ name: t, approxRows: 0 }));
      setTables(list);
      if (list.length > 0) {
        setSelectedTable(list[0].name);
        setStatusNote(
          `Connected (${res.latencyMs}ms) — discovered ${list.length} ${engine === 'mongodb' ? 'collections' : 'tables'}.`
        );
      } else {
        setSelectedTable('');
        setStatusNote('Connected successfully, but no tables/collections were found.');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect and list tables.');
    } finally {
      setDiscovering(false);
    }
  };

  const handleExtract = async () => {
    if (!selectedTable.trim()) {
      setError('Select or enter a table/collection name first.');
      return;
    }
    setError('');
    setExtracting(true);
    try {
      const res = await api.post('/studio/db/extract', {
        engine,
        tableName: selectedTable.trim(),
        connectionUri: useWorkspaceDb ? null : connectionUri.trim(),
        database: databaseName.trim() || null,
        limit: Number(rowLimit) || 2500,
        useWorkspaceDb: engine === 'postgres' && useWorkspaceDb,
      });
      setStatusNote(
        `Extracted ${res.extractedCount.toLocaleString()} of ${(res.totalRowsInTable || res.extractedCount).toLocaleString()} rows from "${res.table}" in ${res.latencyMs}ms.`
      );
      if (onExtracted) {
        onExtracted({
          records: res.records || [],
          columns: res.columns || [],
          tableName: res.table || selectedTable.trim(),
          engine: res.engine || engine,
          totalRowsInTable: res.totalRowsInTable || (res.records || []).length,
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to extract database records.');
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className={`rounded-xl border border-slate-200 bg-slate-50/70 ${compact ? 'p-3.5' : 'p-4'} space-y-3`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-[#2D55F5]" />
          <span className="text-xs font-bold text-slate-800">Live Database Extraction</span>
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
            onChange={(e) => {
              setUseWorkspaceDb(e.target.checked);
              setTables([]);
              setSelectedTable('');
            }}
            className="rounded border-slate-300 text-[#2D55F5] focus:ring-[#2D55F5]"
          />
          <span>Use active DataX Workspace PostgreSQL connection</span>
        </label>
      )}

      {(!useWorkspaceDb || engine === 'mongodb') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <div className={engine === 'mongodb' ? 'md:col-span-2' : 'md:col-span-3'}>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              {engine === 'mongodb' ? 'MongoDB Connection URI' : 'PostgreSQL Connection URI'}
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
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Database Name (optional)</label>
              <input
                type="text"
                value={databaseName}
                onChange={(e) => setDatabaseName(e.target.value)}
                placeholder="e.g. production_db"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#2D55F5]"
              />
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
        <div className="sm:col-span-3">
          <button
            type="button"
            onClick={handleDiscoverTables}
            disabled={discovering || (!useWorkspaceDb && !connectionUri.trim())}
            className="w-full h-[34px] px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-xs font-semibold text-slate-800 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${discovering ? 'animate-spin text-[#2D55F5]' : ''}`} />
            <span>{discovering ? 'Connecting...' : 'Fetch Tables'}</span>
          </button>
        </div>

        <div className="sm:col-span-5">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            {engine === 'mongodb' ? 'Collection' : 'Table'}
          </label>
          {tables.length > 0 ? (
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="w-full h-[34px] px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-[#2D55F5]"
            >
              {tables.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name} {t.approxRows ? `(~${Number(t.approxRows).toLocaleString()} rows)` : ''}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              placeholder={engine === 'mongodb' ? 'Enter collection or click Fetch Tables' : 'Enter table or click Fetch Tables'}
              className="w-full h-[34px] px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-[#2D55F5]"
            />
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Max Rows</label>
          <input
            type="number"
            min={10}
            max={25000}
            step={500}
            value={rowLimit}
            onChange={(e) => setRowLimit(e.target.value)}
            className="w-full h-[34px] px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-mono text-slate-800 focus:outline-none focus:border-[#2D55F5]"
          />
        </div>

        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={handleExtract}
            disabled={extracting || !selectedTable.trim()}
            className="w-full h-[34px] px-3 rounded-lg bg-[#2D55F5] hover:bg-[#2045DC] disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{extracting ? 'Pulling...' : 'Pull'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {statusNote && !error && (
        <div className="flex items-start gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{statusNote}</span>
        </div>
      )}
    </div>
  );
}
