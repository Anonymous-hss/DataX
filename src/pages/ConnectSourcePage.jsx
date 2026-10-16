import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, 
  ChevronDown, 
  Lock, 
  Eye, 
  EyeOff, 
  Check, 
  RefreshCw, 
  Search, 
  AlertCircle, 
  ArrowRight,
  ArrowLeft,
  FileCheck,
  FlaskConical,
  Play
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { useRuleEngine } from '../context/RuleEngineContext';
import PipelineFlowNodes from '../components/cleanflow/PipelineFlowNodes';
import DataXHeader from '../components/cleanflow/DataXHeader';

export default function ConnectSourcePage() {
  const { navigateTo } = useNavigation();
  const { 
    sourceConfig, 
    setSourceConfig, 
    testConnection, 
    fetchTableSample, 
    previewRows: contextPreviewRows 
  } = useRuleEngine();

  const [dbType, setDbType] = useState(
    sourceConfig?.engine === 'sap_bw' ? 'SAP BW' : 
    sourceConfig?.engine === 'mongodb' ? 'MongoDB' : 'PostgreSQL'
  );
  const [connectMethod, setConnectMethod] = useState(sourceConfig?.connectionUri ? 'string' : 'host');
  const [connString, setConnString] = useState(sourceConfig?.connectionUri || '');
  const [showConnString, setShowConnString] = useState(false);
  const [host, setHost] = useState(sourceConfig?.host || '');
  const [port, setPort] = useState(sourceConfig?.port || '5432');
  const [databaseName, setDatabaseName] = useState(sourceConfig?.database || 'production_db');
  const [username, setUsername] = useState('reader');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [readScope, setReadScope] = useState('selected');
  const [selectedTables, setSelectedTables] = useState([sourceConfig?.table || '0PUR_C01']);
  const [tableSearch, setTableSearch] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [testMeta, setTestMeta] = useState({ latencyMs: 38, tableCount: 6 });
  const [availableTables, setAvailableTables] = useState(
    (sourceConfig?.availableTables || ['0PUR_C01', '0IC_C03', 'BAPI_PO_CREATE1', 'MARA']).map(name => ({
      name,
      rows: name === '0PUR_C01' ? '500 rows' : name.includes('users') ? '1,240 rows' : '16,204 rows'
    }))
  );

  const [previewRows, setPreviewRows] = useState(contextPreviewRows || []);

  // Sync state if sourceConfig changes
  useEffect(() => {
    if (sourceConfig) {
      setDbType(
        sourceConfig.engine === 'sap_bw' ? 'SAP BW' : 
        sourceConfig.engine === 'mongodb' ? 'MongoDB' : 'PostgreSQL'
      );
      if (sourceConfig.connectionUri) setConnString(sourceConfig.connectionUri);
      if (sourceConfig.host) setHost(sourceConfig.host);
      if (sourceConfig.database) setDatabaseName(sourceConfig.database);
      if (sourceConfig.table) setSelectedTables([sourceConfig.table]);
      if (sourceConfig.availableTables) {
        setAvailableTables(
          sourceConfig.availableTables.map(name => ({
            name,
            rows: name === '0PUR_C01' ? '500 rows' : name.includes('users') ? '1,240 rows' : '16,204 rows'
          }))
        );
      }
    }
  }, [sourceConfig]);

  // Sync preview rows with context
  useEffect(() => {
    if (contextPreviewRows && contextPreviewRows.length > 0) {
      setPreviewRows(contextPreviewRows);
    }
  }, [contextPreviewRows]);

  const handleTest = async () => {
    setIsTesting(true);
    const engineKey = dbType === 'SAP BW' ? 'sap_bw' : dbType === 'MongoDB' ? 'mongodb' : 'postgres';
    const result = await testConnection({
      engine: engineKey,
      connectionUri: connString,
      host,
      port,
      database: databaseName,
      availableTables: availableTables.map(t => t.name)
    });

    setIsTesting(false);
    setTestSuccess(result.success);
    setTestMeta({
      latencyMs: result.latencyMs || 42,
      tableCount: result.tableCount || availableTables.length
    });

    if (result.tables && result.tables.length > 0) {
      setAvailableTables(
        result.tables.map(name => ({
          name,
          rows: name === '0PUR_C01' ? '500 rows' : name.includes('users') ? '1,240 rows' : '16,204 rows'
        }))
      );
    }
  };

  const handleSelectTable = async (tableName) => {
    setSelectedTables([tableName]);
    const sampleRes = await fetchTableSample(tableName, 5);
    if (sampleRes && sampleRes.rows) {
      setPreviewRows(sampleRes.rows);
    }
  };

  const handleSaveSource = () => {
    const primaryTable = selectedTables[0] || sourceConfig.table;
    const engineKey = dbType === 'SAP BW' ? 'sap_bw' : dbType === 'MongoDB' ? 'mongodb' : 'postgres';
    
    // Auto-discover columns from sample data if available
    let discoveredCols = sourceConfig.discoveredColumns || [];
    if (previewRows.length > 0) {
      discoveredCols = Object.keys(previewRows[0]).filter(k => !k.startsWith('_'));
    }

    setSourceConfig(prev => ({
      ...prev,
      engine: engineKey,
      connectionUri: connString,
      host,
      port,
      database: databaseName,
      table: primaryTable,
      availableTables: availableTables.map(t => t.name),
      discoveredColumns: discoveredCols
    }));

    navigateTo('generate-rules');
  };

  const filteredAvailableTables = availableTables.filter(t => 
    !tableSearch.trim() || t.name.toLowerCase().includes(tableSearch.toLowerCase())
  );

  // Discover display columns for preview
  const displayCols = previewRows.length > 0 
    ? Object.keys(previewRows[0]).filter(k => !k.startsWith('_')).slice(0, 4)
    : (sourceConfig.discoveredColumns || ['id', 'email', 'full_name', 'role']).slice(0, 4);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col antialiased">
      {/* Top Header & Subheader */}
      <DataXHeader
        currentPage="03"
        onBack={() => navigateTo('start-thread')}
        onDryRun={() => navigateTo('running-dry-run')}
        onRunLive={() => navigateTo('dry-run-results')}
      />

      {/* 3 Pipeline Flow Nodes */}
      <PipelineFlowNodes currentStep="03" />

      {/* Main 2-Column Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* Left Column: Connect Source Database */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-5">
            {/* Step title */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Step 1 of 3 · Source</div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight font-display">Connect source database</h2>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              {/* Database type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Database type</label>
                <div className="relative">
                  <select
                    value={dbType}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setDbType(newType);
                      if (newType === 'SAP BW') {
                        setConnString('jdbc:sap://858c7198-93db-4af0-8a9a-5efad6023014.hana.prod-ap21.hanacloud.ondemand.com:443');
                        setDatabaseName('SAP_BW');
                        setSelectedTables(['0PUR_C01']);
                      } else if (newType === 'MongoDB') {
                        setConnString('mongodb+srv://harshal:harshal@cluster0.tb6bhff.mongodb.net/');
                        setDatabaseName('datax_staging');
                        setSelectedTables(['raw_users']);
                      } else {
                        setConnString('postgresql://analyser%20_owner:npg_mWphq7u0eLHr@ep-solitary-cake-a5vcih0r-pooler.us-east-2.aws.neon.tech/analyser%20?sslmode=require');
                        setDatabaseName('PostgreSQL');
                        setSelectedTables(['raw_source_users']);
                      }
                    }}
                    className="w-full appearance-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 pr-8 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="SAP BW">SAP BW InfoCube / HANA Cloud</option>
                    <option value="PostgreSQL">PostgreSQL (Neon / Amazon RDS)</option>
                    <option value="MongoDB">MongoDB Atlas (NoSQL)</option>
                    <option value="Snowflake">Snowflake Data Cloud</option>
                    <option value="Databricks">Databricks Lakehouse</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Format / Connect with pills */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Format</label>
                  <span className="text-[11px] text-slate-400">Connection method</span>
                </div>
                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg max-w-xs text-xs mb-3">
                  <button
                    type="button"
                    onClick={() => setConnectMethod('string')}
                    className={`py-1.5 rounded-md font-medium transition-all cursor-pointer text-center ${
                      connectMethod === 'string'
                        ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Connection URI
                  </button>
                  <button
                    type="button"
                    onClick={() => setConnectMethod('host')}
                    className={`py-1.5 rounded-md font-medium transition-all cursor-pointer text-center ${
                      connectMethod === 'host'
                        ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Host & Credentials
                  </button>
                </div>
              </div>

              {/* Conditional Inputs */}
              {connectMethod === 'string' ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Connection string</label>
                  <div className="relative">
                    <input
                      type={showConnString ? 'text' : 'password'}
                      value={connString}
                      onChange={(e) => setConnString(e.target.value)}
                      placeholder="Enter connection string"
                      className="w-full pl-3 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConnString(!showConnString)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConnString ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                    <Lock className="w-3 h-3 text-slate-400" />
                    Encrypted in transit and kept in your vault. Never shown in logs.
                  </div>

                  {/* Ping & Verification Button */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Connection Ping & Verification</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Ping database to verify connectivity and discover schema tables.
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleTest}
                      disabled={isTesting}
                      className="px-4 py-2 rounded-xl bg-[#2D55F5] hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
                    >
                      {isTesting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          Test Connection
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Host</label>
                      <input
                        type="text"
                        value={host}
                        onChange={(e) => setHost(e.target.value)}
                        placeholder="db.acme.io"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Port</label>
                      <input
                        type="text"
                        value={port}
                        onChange={(e) => setPort(e.target.value)}
                        placeholder="5432"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Database name</label>
                    <input
                      type="text"
                      value={databaseName}
                      onChange={(e) => setDatabaseName(e.target.value)}
                      placeholder="production_db"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>

                  {/* Ping Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Connection Ping & Verification</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Ping database to verify connectivity and discover schema tables.
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleTest}
                      disabled={isTesting}
                      className="px-4 py-2 rounded-xl bg-[#2D55F5] hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
                    >
                      {isTesting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          Test Connection
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Connected Status Box with Spring Animation */}
              <AnimatePresence>
                {testSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="bg-[#ecfdf5] border border-[#a7f3d0] rounded-xl p-3 flex items-center justify-between shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <motion.div
                        initial={{ scale: 0, rotate: -25 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 450, damping: 18, delay: 0.08 }}
                        className="w-6 h-6 rounded-full bg-[#059669] text-white flex items-center justify-center shrink-0 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </motion.div>
                      <div>
                        <div className="text-xs font-bold text-emerald-950">
                          Connected · {testMeta.tableCount} tables discovered
                        </div>
                        <div className="text-[11px] text-emerald-700">
                          {dbType} · {testMeta.latencyMs}ms latency · tested just now
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleTest}
                      disabled={isTesting}
                      className="px-2.5 py-1 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 text-[11px] font-semibold text-emerald-800 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                      Test again
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* What to read */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">What to read</label>
                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg max-w-xs text-xs mb-1.5">
                  <button
                    type="button"
                    onClick={() => setReadScope('selected')}
                    className={`py-1 rounded-md font-medium transition-all ${
                      readScope === 'selected'
                        ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Selected tables
                  </button>
                  <button
                    type="button"
                    onClick={() => setReadScope('all')}
                    className={`py-1 rounded-md font-medium transition-all ${
                      readScope === 'all'
                        ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All tables
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  AI uses the columns of the selected table to generate and optimize rules.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Choose a Table & Live Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Choose a table</h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                  {selectedTables.length} selected
                </span>
                <button 
                  onClick={() => {
                    const allSelected = availableTables.length === selectedTables.length;
                    setSelectedTables(allSelected ? [] : availableTables.map(t => t.name));
                  }}
                  className="text-blue-600 hover:underline font-medium text-xs cursor-pointer"
                >
                  {availableTables.length === selectedTables.length ? 'Deselect all' : `Select all (${availableTables.length})`}
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tables"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Tables List */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {filteredAvailableTables.map((table) => {
                const isChecked = selectedTables.includes(table.name);
                return (
                  <div
                    key={table.name}
                    onClick={() => handleSelectTable(table.name)}
                    className={`px-3 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isChecked
                        ? 'border-blue-500 bg-blue-50/50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectTable(table.name);
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="font-mono text-xs font-semibold text-slate-800">{table.name}</span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">{table.rows}</span>
                  </div>
                );
              })}
            </div>

            {/* Live Preview Selected Table */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 font-mono">
                  Preview <span className="text-blue-600 underline">{selectedTables[0] || 'table'}</span>
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {previewRows.length} sample rows
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                      {displayCols.map(col => (
                        <th key={col} className="py-2 px-2.5 font-semibold capitalize truncate max-w-[120px]">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewRows.slice(0, 4).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        {displayCols.map(col => (
                          <td key={col} className="py-2 px-2.5 text-slate-700 truncate max-w-[140px]">
                            {row[col] !== null && row[col] !== undefined ? String(row[col]) : <span className="text-slate-300 italic">null</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>

        {/* Bottom Bar: Next AI Rules */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-6 mt-4 border-t border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <AlertCircle className="w-3.5 h-3.5 text-blue-500" />
            Next: AI rules synthesis
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigateTo('start-thread')}
              className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSource}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              Save source
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
