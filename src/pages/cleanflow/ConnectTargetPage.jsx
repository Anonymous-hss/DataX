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
  Archive, 
  AlertCircle, 
  FlaskConical 
} from 'lucide-react';
import { useRuleEngine } from '../../context/RuleEngineContext';

export default function ConnectTargetPage({ onSaveAndDryRun, onCancel }) {
  const { targetConfig, setTargetConfig, sourceConfig, testConnection, isCredentialConfigured } = useRuleEngine();

  const isSap = sourceConfig?.engine === 'sap_bw';

  const [dbType, setDbType] = useState(
    targetConfig?.engine === 's4_hana' || isSap ? 'SAP S/4HANA' : 'PostgreSQL'
  );
  const [connectMethod, setConnectMethod] = useState(targetConfig?.connectionUri ? 'string' : 'host');
  const [connString, setConnString] = useState(targetConfig?.connectionUri || '');
  const [showConnString, setShowConnString] = useState(false);
  const [outputOption, setOutputOption] = useState(targetConfig?.targetNamingMode || 'suffix');
  const [suffixName, setSuffixName] = useState(
    targetConfig?.table || (sourceConfig?.table ? `${sourceConfig.table}_clean` : '')
  );
  const [customTableName, setCustomTableName] = useState(targetConfig?.customTableName || '');
  const [host, setHost] = useState(targetConfig?.host || '');
  const [port, setPort] = useState(targetConfig?.port || (isSap ? '443' : '5432'));
  const [databaseName, setDatabaseName] = useState(targetConfig?.database || '');
  const [username, setUsername] = useState(targetConfig?.user || targetConfig?.username || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [testError, setTestError] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [testLatency, setTestLatency] = useState(42);

  // Sync if source or target config updates
  useEffect(() => {
    if (sourceConfig?.table) {
      setSuffixName(`${sourceConfig.table}_clean`);
    }
  }, [sourceConfig]);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestError(null);
    setValidationError(null);
    setTestSuccess(false);

    const engineKey = dbType.includes('SAP') ? 's4_hana' : dbType.includes('Databricks') ? 'databricks' : dbType.includes('Snowflake') ? 'snowflake' : 'postgres';
    const effectiveUri = connectMethod === 'string' && connString.trim()
      ? connString.trim()
      : (engineKey.includes('hana') || engineKey.includes('sap')) && host.trim()
      ? `jdbc:sap://${host.trim()}:${port || '443'}?encrypt=true&validateCertificate=false&user=${username || ''}&password=${password || ''}`
      : (engineKey === 'mongodb' && host.trim())
      ? `mongodb://${username || ''}:${password || ''}@${host.trim()}:${port || '27017'}/${databaseName || ''}`
      : (host.trim() ? `postgresql://${username || ''}:${password || ''}@${host.trim()}:${port || '5432'}/${databaseName || ''}` : connString);

    const res = await testConnection({
      engine: engineKey,
      connectionUri: effectiveUri,
      host,
      port,
      database: databaseName,
      user: username,
      password: password
    }, true);

    setIsTesting(false);
    if (res.success) {
      setTestSuccess(true);
      setTestLatency(res.latencyMs || 42);
    } else {
      setTestSuccess(false);
      setTestError(res.error || res.message || 'Target database connection failed.');
    }
  };

  const handleSave = () => {
    setValidationError(null);
    const finalTable = outputOption === 'suffix' ? suffixName : customTableName;
    const engineKey = dbType.includes('SAP') ? 's4_hana' : dbType.includes('Databricks') ? 'databricks' : dbType.includes('Snowflake') ? 'snowflake' : 'postgres';

    const effectiveUri = connectMethod === 'string' && connString.trim()
      ? connString.trim()
      : (engineKey.includes('hana') || engineKey.includes('sap')) && host.trim()
      ? `jdbc:sap://${host.trim()}:${port || '443'}?encrypt=true&validateCertificate=false&user=${username || ''}&password=${password || ''}`
      : (engineKey === 'mongodb' && host.trim())
      ? `mongodb://${username || ''}:${password || ''}@${host.trim()}:${port || '27017'}/${databaseName || ''}`
      : (host.trim() ? `postgresql://${username || ''}:${password || ''}@${host.trim()}:${port || '5432'}/${databaseName || ''}` : connString);

    const candidateCreds = {
      engine: engineKey,
      connectionUri: effectiveUri,
      host,
      port,
      database: databaseName,
      user: username,
      password
    };

    if (isCredentialConfigured && !isCredentialConfigured(candidateCreds)) {
      setValidationError('Target credentials required: Please enter connection URI or Host, Database, Username, and Password.');
      return;
    }

    if (!finalTable || !finalTable.trim()) {
      setValidationError('Target table name required: Please specify the staging destination table name.');
      return;
    }

    setTargetConfig(prev => ({
      ...prev,
      engine: engineKey,
      connectionUri: effectiveUri,
      host,
      port,
      database: databaseName,
      user: username,
      password,
      table: finalTable.trim(),
      targetNamingMode: outputOption,
      customTableName
    }));

    if (onSaveAndDryRun) {
      onSaveAndDryRun();
    }
  };

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
                    onChange={(e) => {
                      const newT = e.target.value;
                      setDbType(newT);
                      if (newT.includes('SAP')) {
                        setDatabaseName('S4_HANA');
                        setCustomTableName('staged_purchase_orders');
                      } else {
                        setDatabaseName('reconciled_db');
                        setCustomTableName('users_reconciled_v1');
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                  >
                    <option value="SAP S/4HANA">SAP S/4HANA (BAPI_PO_CREATE1 / Clean Core)</option>
                    <option value="PostgreSQL">PostgreSQL (Neon / Amazon RDS / Cloud)</option>
                    <option value="Databricks">Databricks Unity Catalog (Delta Lake Gold)</option>
                    <option value="Snowflake">Snowflake Data Cloud</option>
                    <option value="BigQuery">Google BigQuery</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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

              {/* Conditional Connection Details */}
              {connectMethod === 'string' ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Connection string</label>
                  <div className="relative">
                    <input
                      type={showConnString ? 'text' : 'password'}
                      value={connString}
                      onChange={(e) => setConnString(e.target.value)}
                      placeholder={
                        dbType.includes('SAP') ? 'jdbc:sap://<s4hana-host>:443' :
                        dbType.includes('Databricks') ? 'https://<workspace>.azuredatabricks.net' :
                        dbType.includes('Snowflake') ? 'https://<account>.snowflakecomputing.com' :
                        'postgresql://<user>:<password>@<host>:5432/<database>?sslmode=require'
                      }
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
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Host</label>
                      <input
                        type="text"
                        value={host}
                        onChange={(e) => setHost(e.target.value)}
                        placeholder={dbType.includes('SAP') ? 's4hana-core.corp.ondemand.com' : 'target-db.company.com'}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Port</label>
                      <input
                        type="text"
                        value={port}
                        onChange={(e) => setPort(e.target.value)}
                        placeholder={dbType.includes('SAP') ? '443' : '5432'}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Database name</label>
                    <input
                      type="text"
                      value={databaseName}
                      onChange={(e) => setDatabaseName(e.target.value)}
                      placeholder={dbType.includes('SAP') ? 'S4_HANA' : 'clean_core_db'}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="db_user"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                  </div>
                </div>
              )}

              {/* Ping & Verification Action */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs mt-3">
                <div>
                  <div className="text-xs font-bold text-slate-900">Connection Verification</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Verify write permissions and destination schema before dry run.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTestConnection}
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

              {/* Verified Status Box */}
              <AnimatePresence>
                {testSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="bg-[#ecfdf5] border border-[#a7f3d0] rounded-xl p-3 flex items-center justify-between shadow-2xs mt-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-[#059669] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-emerald-950">Target Destination Connected</div>
                        <div className="text-[11px] text-emerald-700">{dbType} · {testLatency}ms write handshake verified</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {testError && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center justify-between shadow-2xs mt-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <AlertCircle className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-rose-950">Connection Failed</div>
                        <div className="text-[11px] text-rose-700">{testError}</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

          </div>

          {/* Right Column: Output Table & Configuration */}
          <div className="space-y-6 lg:pl-8 pt-6 lg:pt-0">
            
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Output table in target</h3>
              
              <div className="space-y-3">
                {/* Option 1: Add a suffix */}
                <div 
                  onClick={() => setOutputOption('suffix')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    outputOption === 'suffix'
                      ? 'border-blue-500 bg-blue-50/40 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="outputTable"
                    checked={outputOption === 'suffix'}
                    onChange={() => setOutputOption('suffix')}
                    className="mt-0.5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-slate-900">Add a suffix to the source table name</div>
                    <div className="text-[11px] text-slate-500">
                      Creates a dedicated table alongside your source (e.g. <span className="font-mono">{sourceConfig?.table || 'source'}_clean</span>)
                    </div>
                  </div>
                </div>

                {outputOption === 'suffix' && (
                  <div className="pl-6 space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-600">Table name</label>
                    <input
                      type="text"
                      value={suffixName}
                      onChange={(e) => setSuffixName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                )}

                {/* Option 2: Pick a table or create new */}
                <div 
                  onClick={() => setOutputOption('custom')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    outputOption === 'custom'
                      ? 'border-blue-500 bg-blue-50/40 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="outputTable"
                    checked={outputOption === 'custom'}
                    onChange={() => setOutputOption('custom')}
                    className="mt-0.5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-slate-900">Custom target entity / writeback BAPI</div>
                    <div className="text-[11px] text-slate-500">
                      Specify an explicit staging table, OData entity or BAPI interface.
                    </div>
                  </div>
                </div>

                {outputOption === 'custom' && (
                  <div className="pl-6 space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-600">Entity name</label>
                    <input
                      type="text"
                      value={customTableName}
                      onChange={(e) => setCustomTableName(e.target.value)}
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
                Rows that fail a critical rule go to <code className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-mono text-[11px]">quarantined_records</code> in the target database.
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Bottom Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
          Saving unlocks Dry run simulation.
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Save & dry run
          </button>
        </div>
      </div>

    </motion.div>
  );
}
