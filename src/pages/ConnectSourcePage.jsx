import React, { useState } from 'react';
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
import PipelineFlowNodes from '../components/cleanflow/PipelineFlowNodes';
import DataXHeader from '../components/cleanflow/DataXHeader';

export default function ConnectSourcePage() {
  const { navigateTo } = useNavigation();
  const [dbType, setDbType] = useState('PostgreSQL');
  const [connectMethod, setConnectMethod] = useState('string');
  const [connString, setConnString] = useState('postgres://reader:******@db.acme.io/production_db');
  const [showConnString, setShowConnString] = useState(false);
  const [host, setHost] = useState('');
  const [port, setPort] = useState('5432');
  const [databaseName, setDatabaseName] = useState('retaildata');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [readScope, setReadScope] = useState('selected');
  const [selectedTables, setSelectedTables] = useState(['raw_source_users']);
  const [tableSearch, setTableSearch] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  const availableTables = [
    { name: 'purchase_orders', rows: '16,204 rows' },
    { name: 'raw_source_users', rows: '1,240 rows' },
    { name: 'sales', rows: '52,019 rows' },
  ];

  const previewRows = [
    { id: '101', email: 'sarah.j@acme.com', full_name: 'Sarah Jenkins', role: 'analyst' },
    { id: '102', email: 'malformed.email@bad', full_name: 'Mark Lee', role: 'viewer' },
    { id: '103', email: 'marcus.v@acme.com', full_name: 'empty', role: 'manager' },
    { id: '104', email: 'Elena.RO@ACME.com', full_name: 'Elena Rostova', role: 'Admin' },
  ];

  const handleTest = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      setTestSuccess(true);
    }, 600);
  };

  const handleSaveSource = () => {
    navigateTo('generate-rules');
  };

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

      {/* Main 2-Column Content: Step 1 Source & Choose Table (Image 4) */}
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
                    onChange={(e) => setDbType(e.target.value)}
                    className="w-full appearance-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 pr-8 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="PostgreSQL">PostgreSQL</option>
                    <option value="SAP BW">SAP BW InfoCube</option>
                    <option value="Snowflake">Snowflake Data Cloud</option>
                    <option value="Databricks">Databricks Lakehouse</option>
                    <option value="MySQL">MySQL 8</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Format / Connect with pills (matching Image 3) */}
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

              {/* Conditional Connection Details: URI vs Host & Credentials */}
              {connectMethod === 'string' ? (
                /* Connection string / URI input (Image 2 Match) */
                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">Connection string</label>
                    <div className="relative">
                      <input
                        type={showConnString ? 'text' : 'password'}
                        value={connString}
                        onChange={(e) => setConnString(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConnString(!showConnString)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showConnString ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                      <Lock className="w-3 h-3" />
                      Encrypted in transit and kept in your vault. Never shown in logs.
                    </div>
                  </div>

                  {/* Connection Ping & Verification Card — also shown in URI mode */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Connection Ping & Verification</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Ping database to verify write access and discover target schema.
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
                /* Host & Credentials Format (Image 3 Exact Match) */
                <div className="space-y-3.5">
                  {/* Host / Address & Port */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Host / Address</label>
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
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                      />
                    </div>
                  </div>

                  {/* Database Name & Username */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Database Name</label>
                      <input
                        type="text"
                        value={databaseName}
                        onChange={(e) => setDatabaseName(e.target.value)}
                        placeholder="production_db"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="reader"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter database password"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Connection Ping & Verification Card (Image 3 Exact Match) */}
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

              {/* Connected Status Box with Spring Tick Animation - ONLY shown after clicking test connection */}
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
                        <div className="text-xs font-bold text-emerald-950">Connected · 39 tables found</div>
                        <div className="text-[11px] text-emerald-700">PostgreSQL 15 · tested just now</div>
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
                  AI uses the columns of the selected table to suggest rules.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Choose a Table & Preview (Image 4) */}
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
            <div className="space-y-1.5">
              {availableTables.map((table) => {
                const isChecked = selectedTables.includes(table.name);
                const toggleTable = () => {
                  setSelectedTables(prev => 
                    prev.includes(table.name)
                      ? prev.filter(t => t !== table.name)
                      : [...prev, table.name]
                  );
                };
                return (
                  <div
                    key={table.name}
                    onClick={toggleTable}
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
                          toggleTable();
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

            {/* Preview Selected Table */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 font-mono">
                  Preview <span className="text-blue-600 underline">raw_source_users</span>
                </span>
                <span className="text-slate-400 font-mono text-[11px]">first 4 of 1,240 rows</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-2.5 font-semibold">id</th>
                      <th className="py-2 px-2.5 font-semibold">email</th>
                      <th className="py-2 px-2.5 font-semibold">full_name</th>
                      <th className="py-2 px-2.5 font-semibold">role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewRows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/70">
                        <td className="py-2 px-2.5 text-slate-500">{row.id}</td>
                        <td className="py-2 px-2.5 text-slate-800 truncate max-w-[140px]">{row.email}</td>
                        <td className="py-2 px-2.5 text-slate-800">{row.full_name}</td>
                        <td className="py-2 px-2.5 text-slate-800">{row.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>

        {/* Bottom Bar: Next AI Rules (Image 4) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-6 mt-4 border-t border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <AlertCircle className="w-3.5 h-3.5 text-blue-500" />
            Next: AI rules
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
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all shadow-blue-500/20 flex items-center gap-1.5"
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
