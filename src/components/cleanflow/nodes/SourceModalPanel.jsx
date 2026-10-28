import React from 'react';
import {
  Upload,
  Plus,
  CheckCircle2,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  RefreshCw,
  Table,
  Loader2,
  Database,
} from 'lucide-react';
import { getTableCatalog } from '../../../data/sampleDatasets';

export default function SourceModalPanel({
  selectedNode,
  connectMethod,
  setConnectMethod,
  handleFileUpload,
  uploadedFileMeta,
  uploadedCols,
  srcDbType,
  applyEngineCredentials,
  srcHost,
  setSrcHost,
  srcPort,
  setSrcPort,
  srcDbName,
  setSrcDbName,
  srcUser,
  setSrcUser,
  srcPass,
  setSrcPass,
  showPassword,
  setShowPassword,
  connString,
  setConnString,
  showConnString,
  setShowConnString,
  readScope,
  setReadScope,
  srcTable,
  setSrcTable,
  srcTestMeta,
  srcTesting,
  handleTestSourceConnection,
  activeEngineKey,
  discoveredColumns,
  previewRows,
  isSamplingLive,
  isLiveSampleActive,
}) {
  const hasLiveTables = Boolean(srcTestMeta?.success && Array.isArray(srcTestMeta?.tables) && srcTestMeta.tables.length > 0);

  return (
    <div className="space-y-5">
      {/* Connection Method Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setConnectMethod('host')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            connectMethod === 'host'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Host & Credentials
        </button>
        <button
          type="button"
          onClick={() => setConnectMethod('string')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            connectMethod === 'string'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Connection URI String
        </button>
        <button
          type="button"
          onClick={() => setConnectMethod('upload')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            connectMethod === 'upload'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Dataset (CSV/Excel/JSON)</span>
        </button>
      </div>

      {connectMethod === 'upload' ? (
        /* BYO FILE INGESTION DROPZONE */
        <div className="space-y-4 p-5 bg-gradient-to-br from-blue-50/50 via-slate-50 to-indigo-50/30 rounded-2xl border-2 border-dashed border-blue-300/80 hover:border-blue-500 transition-all">
          <div className="text-center py-4">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
              <Upload className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">
              Drop your CSV, Excel (.xlsx/.xls), or JSON dataset
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
              Upload client or prospect data on the fly. DataX will infer schema columns, bind them directly into the canvas DAG, and run Safe 3-Tier remediation.
            </p>
            <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg cursor-pointer transition-all">
              <Plus className="w-4 h-4" />
              <span>Browse Local Dataset File</span>
              <input
                type="file"
                accept=".csv, .xlsx, .xls, .json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
          {uploadedFileMeta && (
            <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">{uploadedFileMeta.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {uploadedFileMeta.count ? `${uploadedFileMeta.count.toLocaleString()} records parsed` : uploadedFileMeta.size} · Inferred {uploadedCols.length} columns
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Dataset Parsed & Active
              </span>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Database Engine Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Database Engine</label>
            <select
              value={srcDbType}
              onChange={(e) => applyEngineCredentials(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 cursor-pointer"
            >
              <option value="SAP BW">SAP BW InfoCube (HANA Cloud)</option>
              <option value="PostgreSQL">PostgreSQL Database</option>
              <option value="MongoDB">MongoDB Atlas (NoSQL Document Store)</option>
              <option value="Snowflake">Snowflake Data Cloud</option>
              <option value="Azure">Azure Blob Storage</option>
              <option value="Salesforce">Salesforce CRM</option>
              <option value="AWS S3">AWS S3 Storage</option>
            </select>
          </div>

          {/* Tailored Configuration Form based on System Engine */}
          {connectMethod === 'host' ? (
            srcDbType === 'AWS S3' ? (
              <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">S3 Bucket URI</label>
                    <input
                      type="text"
                      value={srcHost}
                      onChange={(e) => setSrcHost(e.target.value)}
                      placeholder="s3://datax-enterprise-lake/raw-landing/"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">AWS Region</label>
                    <input
                      type="text"
                      value={srcPort}
                      onChange={(e) => setSrcPort(e.target.value)}
                      placeholder="us-east-1"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">AWS Access Key ID</label>
                  <input
                    type="text"
                    value={srcUser}
                    onChange={(e) => setSrcUser(e.target.value)}
                    placeholder="AKIAIOSFODNN7EXAMPLE"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-600">AWS Secret Access Key</label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={srcPass}
                    onChange={(e) => setSrcPass(e.target.value)}
                    placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">File Format / Storage Class</label>
                  <input
                    type="text"
                    value={srcDbName}
                    onChange={(e) => setSrcDbName(e.target.value)}
                    placeholder="Parquet (Snappy) / Delta Lake"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                  />
                </div>
              </div>
            ) : srcDbType === 'Azure' ? (
              <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Storage Account Name</label>
                    <input
                      type="text"
                      value={srcHost}
                      onChange={(e) => setSrcHost(e.target.value)}
                      placeholder="irepazurestorage"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Container Name</label>
                    <input
                      type="text"
                      value={srcPort}
                      onChange={(e) => setSrcPort(e.target.value)}
                      placeholder="telemetry-container"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Microsoft Entra Tenant ID</label>
                  <input
                    type="text"
                    value={srcDbName}
                    onChange={(e) => setSrcDbName(e.target.value)}
                    placeholder="377abd4b-5fbc-4ac2-9b30-f3c03892d087"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Client ID (App ID)</label>
                    <input
                      type="text"
                      value={srcUser}
                      onChange={(e) => setSrcUser(e.target.value)}
                      placeholder="f366a6c8-ae64-4d0b-87cd-dc8fd919997a"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-600">Client Secret</label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={srcPass}
                      onChange={(e) => setSrcPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>
              </div>
            ) : srcDbType === 'Salesforce' ? (
              <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Salesforce Instance URL</label>
                  <input
                    type="text"
                    value={srcHost}
                    onChange={(e) => setSrcHost(e.target.value)}
                    placeholder="sweetdesignhub.my.salesforce.com"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Client ID / Consumer Key</label>
                    <input
                      type="text"
                      value={srcDbName}
                      onChange={(e) => setSrcDbName(e.target.value)}
                      placeholder="3MVG9f366a6c84d0b87cddc8fd919997a"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Username / Email</label>
                    <input
                      type="text"
                      value={srcUser}
                      onChange={(e) => setSrcUser(e.target.value)}
                      placeholder="sweetdesignhub@gmail.com"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-600">Client Secret / Security Token</label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={srcPass}
                    onChange={(e) => setSrcPass(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                  />
                </div>
              </div>
            ) : (
              /* DEFAULT DATABASE FORM (SAP, POSTGRES, MONGO, SNOWFLAKE) */
              <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Host / Server (or Full URI)</label>
                    <input
                      type="text"
                      value={srcHost}
                      onChange={(e) => setSrcHost(e.target.value)}
                      placeholder="cluster0.tb6bhff.mongodb.net"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Port</label>
                    <input
                      type="text"
                      value={srcPort}
                      onChange={(e) => setSrcPort(e.target.value)}
                      placeholder="27017"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Database Name</label>
                    <input
                      type="text"
                      value={srcDbName}
                      onChange={(e) => setSrcDbName(e.target.value)}
                      placeholder="datax_staging"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Username / User</label>
                    <input
                      type="text"
                      value={srcUser}
                      onChange={(e) => setSrcUser(e.target.value)}
                      placeholder="harshal"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-600">Password / Secret</label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={srcPass}
                    onChange={(e) => setSrcPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                  />
                </div>
              </div>
            )
          ) : (
            /* Mode 2: Connection URI String */
            <div className="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-600">Connection URI String</label>
                <button
                  type="button"
                  onClick={() => setShowConnString(!showConnString)}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {showConnString ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showConnString ? 'Mask URI' : 'Reveal URI'}
                </button>
              </div>
              <textarea
                rows={2}
                value={connString}
                onChange={(e) => setConnString(e.target.value)}
                placeholder="mongodb+srv://user:pass@cluster0.mongodb.net/ or postgresql://user:pass@host/db"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
              />
            </div>
          )}

          {/* Test Connection Button with Live Ping Diagnostics */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                {srcDbType === 'AWS S3'
                  ? 'AWS S3 Bucket Connectivity'
                  : srcDbType === 'Azure'
                    ? 'Azure Blob Connectivity'
                    : srcDbType === 'Salesforce'
                      ? 'Salesforce API Connectivity'
                      : 'Database Connectivity'}
              </span>
              <span className="text-[11px] text-slate-500">
                Pings endpoint & discovers live collections/tables
              </span>
            </div>
            <div className="min-w-0 flex items-center gap-3">
              {srcTestMeta && srcTestMeta.nodeId === selectedNode.id && (
                srcTestMeta.success ? (
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 shadow-xs animate-in fade-in">
                    <Check className="w-4 h-4 text-emerald-600" />
                    Connected ({srcTestMeta.latencyMs}ms)
                  </span>
                ) : (
                  <span
                    className="min-w-0 max-w-[340px] text-xs font-bold text-rose-700 flex items-center gap-1.5 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 shadow-xs animate-in fade-in whitespace-nowrap"
                    title={srcTestMeta.error || srcTestMeta.message}
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span className="truncate">
                      {(srcTestMeta.error || srcTestMeta.message || '').toLowerCase().startsWith('missing required credentials')
                        ? 'Missing credentials'
                        : srcTestMeta.error || srcTestMeta.message || 'Connection failed'}
                    </span>
                  </span>
                )
              )}
              <button
                type="button"
                onClick={handleTestSourceConnection}
                disabled={srcTesting}
                className="shrink-0 whitespace-nowrap px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${srcTesting ? 'animate-spin' : ''}`} />
                {srcTesting ? 'Testing...' : 'Test Connection'}
              </button>
            </div>
          </div>

          {/* Read Scope Options */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Read Scope Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setReadScope('selected')}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                  readScope === 'selected'
                    ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="block text-xs">Specific Table(s)</span>
                <span className="block text-[10px] text-slate-400 font-normal">Designate specific table for stream</span>
              </div>
              <div
                onClick={() => setReadScope('all')}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                  readScope === 'all'
                    ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="block text-xs">Full Schema</span>
                <span className="block text-[10px] text-slate-400 font-normal">Batch sync all discovered tables</span>
              </div>
            </div>
          </div>

          {/* Table / Object / Blob Catalog */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                {srcDbType === 'AWS S3' || srcDbType === 'Azure'
                  ? 'Designated Object / Blob File'
                  : srcDbType === 'Salesforce'
                    ? 'Designated Salesforce Object'
                    : 'Designated Source Table / Collection'}
              </label>
              {hasLiveTables ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <Database className="w-3 h-3 text-emerald-600" />
                  ⚡ {srcTestMeta.tables.length} Live Tables ({srcTestMeta.database || srcDbName || 'Connected'})
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  📦 Demo Sandbox Tables Active
                </span>
              )}
            </div>

            {/* Quick-Select Live Table Pills when connected */}
            {hasLiveTables && (
              <div className="mb-2.5 p-2.5 bg-emerald-50/50 border border-emerald-200/80 rounded-xl">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800 mb-1.5">
                  Select Table / Collection from Original Database:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {srcTestMeta.tables.map((tbl) => {
                    const isSelected = srcTable === tbl;
                    return (
                      <button
                        key={tbl}
                        type="button"
                        onClick={() => setSrcTable(tbl)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 border border-emerald-200 hover:bg-emerald-100/60'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>{tbl}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <select
              value={srcTable}
              onChange={(e) => setSrcTable(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 cursor-pointer"
            >
              {hasLiveTables && (
                <optgroup label="⚡ Live Discovered Tables (From Connected Database)">
                  {srcTestMeta.tables.map((tbl) => (
                    <option key={tbl} value={tbl}>
                      [Live DB] {tbl}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="📦 Pre-Loaded Demo Tables (Sandbox Testing & Prototyping)">
                {getTableCatalog(activeEngineKey).map((t) => (
                  <option key={t.name} value={t.name}>
                    [Demo Table] {t.name} — ({t.rows})
                  </option>
                ))}
              </optgroup>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              {hasLiveTables
                ? `✅ Live connection active. Selecting any table above fetches real rows and schema columns directly from '${srcTestMeta.database || srcDbName}'.`
                : 'ℹ️ Click "Test Connection" above to discover and select live tables from your original database.'}
            </p>
          </div>
        </>
      )}

      {/* Discovered Schema Columns Pill Badges */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Discovered Schema Columns ({discoveredColumns.length})
          </label>
          {isSamplingLive && (
            <span className="text-[10px] font-semibold text-blue-600 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Fetching live schema...
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
          {discoveredColumns.length > 0 ? (
            discoveredColumns.map((col, idx) => (
              <span
                key={idx}
                className="font-mono text-[10px] font-bold bg-white text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs"
              >
                {col}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400 italic">No columns discovered yet</span>
          )}
        </div>
      </div>

      {/* Live 5-Row Data Preview Table */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Table className="w-3.5 h-3.5 text-blue-600" />
            <span>Live Data Preview (First 5 Rows — {srcTable})</span>
          </label>
          {isLiveSampleActive ? (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              ⚡ Live Database Stream
            </span>
          ) : (
            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Sandbox Preview
            </span>
          )}
        </div>
        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white max-h-52 overflow-y-auto">
          {isSamplingLive ? (
            <div className="py-8 flex flex-col items-center justify-center text-slate-500 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-xs font-medium">Sampling live records from {srcTable}...</span>
            </div>
          ) : previewRows.length > 0 ? (
            <table className="w-full text-left text-[11px] font-mono">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  {discoveredColumns.slice(0, 7).map((c, i) => (
                    <th key={i} className="px-2.5 py-1.5 font-bold text-slate-600 whitespace-nowrap">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {previewRows.slice(0, 5).map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/80">
                    {discoveredColumns.slice(0, 7).map((colKey, cIdx) => {
                      const val = row[colKey];
                      const isNull = val === null || val === undefined || val === '';
                      return (
                        <td
                          key={cIdx}
                          className={`px-2.5 py-1.5 whitespace-nowrap ${
                            isNull ? 'text-rose-500 font-bold italic' : 'text-slate-800'
                          }`}
                        >
                          {isNull ? 'NULL' : String(val)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-6 text-center text-xs text-slate-400">
              No preview rows available for {srcTable}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

