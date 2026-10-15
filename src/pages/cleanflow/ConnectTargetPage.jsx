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
  Archive, 
  AlertCircle, 
  FlaskConical 
} from 'lucide-react';

export default function ConnectTargetPage({ onSaveAndDryRun, onCancel }) {
  const [dbType, setDbType] = useState('PostgreSQL');
  const [connectMethod, setConnectMethod] = useState('string');
  const [connString, setConnString] = useState('postgres://writer:******@db.acme.io/reconciled_db');
  const [showConnString, setShowConnString] = useState(false);
  const [outputOption, setOutputOption] = useState('suffix');
  const [suffixName, setSuffixName] = useState('raw_source_users_clean');
  const [customTableName, setCustomTableName] = useState('users_reconciled_v1');
  const [host, setHost] = useState('db.acme.io');
  const [port, setPort] = useState('5432');
  const [databaseName, setDatabaseName] = useState('reconciled_db');
  const [username, setUsername] = useState('writer');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-4"
    >
      {/* Main White Card Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          
          {/* Left Column: Target Database Connection */}
          <div className="space-y-5 lg:pr-8">
            
            {/* Step title */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Step 3 of 3 · Target</div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight font-display">Connect target database</h2>
              </div>
            </div>

            {/* Form fields */}
            <div className="space-y-4 pt-1">
              
              {/* Database type dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Database type</label>
                <div className="relative">
                  <select
                    value={dbType}
                    onChange={(e) => setDbType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="PostgreSQL">PostgreSQL</option>
                    <option value="Snowflake">Snowflake Data Cloud</option>
                    <option value="Databricks">Databricks Unity Catalog</option>
                    <option value="BigQuery">Google BigQuery</option>
                    <option value="MySQL">MySQL Enterprise</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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

              {/* Conditional Connection Details */}
              {connectMethod === 'string' ? (
                /* Connection string / URI input (Image 2 Match) */
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Connection string</label>
                  <div className="relative">
                    <input
                      type={showConnString ? 'text' : 'password'}
                      value={connString}
                      onChange={(e) => setConnString(e.target.value)}
                      className="w-full pl-3 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                        placeholder="reconciled_db"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="writer"
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
                        Ping database to verify write access and discover target schema.
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsTesting(true);
                        setTimeout(() => {
                          setIsTesting(false);
                          setTestSuccess(true);
                        }, 700);
                      }}
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
                        <div className="text-xs font-bold text-emerald-950">Connected · write access confirmed</div>
                        <div className="text-[11px] text-emerald-700">PostgreSQL 15 · tested just now</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsTesting(true);
                        setTimeout(() => {
                          setIsTesting(false);
                          setTestSuccess(true);
                        }, 500);
                      }}
                      disabled={isTesting}
                      className="px-2.5 py-1 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 text-[11px] font-semibold text-emerald-800 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                      Test again
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

          </div>

          {/* Right Column: Where clean rows go */}
          <div className="space-y-5 pt-6 lg:pt-0 lg:pl-8">
            
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight font-display">Where clean rows go</h3>
              <div className="text-xs font-semibold text-slate-700 mt-1">Output table name</div>
              <div className="text-xs text-slate-500 mt-0.5">Clean rows go to a new table. Your source table is never overwritten.</div>
            </div>

            {/* Radio Cards */}
            <div className="space-y-3">
              
              {/* Option 1: Add a suffix (Recommended) */}
              <div 
                onClick={() => setOutputOption('suffix')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  outputOption === 'suffix'
                    ? 'border-2 border-blue-500 bg-blue-50/20 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      outputOption === 'suffix' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                    }`}>
                      {outputOption === 'suffix' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="text-xs font-bold text-slate-900">Add a suffix</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-mono text-[10px] font-bold">
                    Recommended
                  </span>
                </div>

                <div className="mt-3 pl-6">
                  <input
                    type="text"
                    value={suffixName}
                    onChange={(e) => setSuffixName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Option 2: Custom name */}
              <div 
                onClick={() => setOutputOption('custom')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  outputOption === 'custom'
                    ? 'border-2 border-blue-500 bg-blue-50/20 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    outputOption === 'custom' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                  }`}>
                    {outputOption === 'custom' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="text-xs font-bold text-slate-900">Choose a custom name</span>
                </div>
                <div className="text-[11px] text-slate-500 pl-6 mt-0.5">
                  Pick an existing table or name a new one.
                </div>

                {outputOption === 'custom' && (
                  <div className="mt-3 pl-6">
                    <input
                      type="text"
                      value={customTableName}
                      onChange={(e) => setCustomTableName(e.target.value)}
                      placeholder="Enter custom table name..."
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                )}
              </div>

            </div>

            {/* Quarantine note */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-200/70 text-slate-600 flex items-center justify-center shrink-0">
                <Archive className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-600">
                Rows that fail a critical rule go to <code className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-mono text-[11px]">quarantined_records</code> in the same database.
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Bottom Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
          Saving unlocks Dry run.
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSaveAndDryRun}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all shadow-blue-500/20 flex items-center gap-1.5"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Save & dry run
          </button>
        </div>
      </div>

    </motion.div>
  );
}
