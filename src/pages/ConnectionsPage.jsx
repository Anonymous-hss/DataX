import DataXAppShell from "../components/common/DataXAppShell";
import React, { useState } from 'react';
import { Link, useNavigation } from '../context/NavigationContext';
import { useRuleEngine } from '../context/RuleEngineContext';
import DataXUserMenu from '../components/common/DataXUserMenu';
import { DataXLogo } from './ThreadsPage';
import { api, API_BASE_URL } from '../services/apiClient';

const INITIAL_CONNECTIONS = [
  {
    id: 'conn_sap_hana',
    name: 'SAP HANA Cloud (Production Enterprise)',
    engine: 'SAP HANA',
    engineCode: 'sap_bw',
    host: '858c7198-93db-4af0-8a9a-5efad6023014.hana.prod-ap21.hanacloud.ondemand.com',
    port: '443',
    database: 'SYSTEMDB',
    username: 'DBADMIN',
    ssl: true,
    status: 'connected',
    latency: '135 ms',
    tablesCount: 8,
    activeThreads: ['SAP BW → S/4HANA Clean Core', 'New Domain'],
    badge: 'Enterprise Gold'
  },
  {
    id: 'conn_postgres_lakehouse',
    name: 'PostgreSQL Enterprise Lakehouse',
    engine: 'PostgreSQL',
    engineCode: 'postgres',
    host: 'pg-lakehouse.internal.net',
    port: '5432',
    database: 'warehouse_db',
    username: 'postgres_svc',
    ssl: true,
    status: 'connected',
    latency: '88 ms',
    tablesCount: 14,
    activeThreads: ['Customer Master & Identity', 'Financial GL & AP Ledger'],
    badge: 'Enterprise Lakehouse'
  },
  {
    id: 'conn_mongo_atlas',
    name: 'MongoDB Atlas Operational Store',
    engine: 'MongoDB',
    engineCode: 'mongodb',
    host: 'cluster0.mongodb.net',
    port: '27017',
    database: 'enterprise_crm',
    username: 'atlas_admin',
    ssl: true,
    status: 'connected',
    latency: '112 ms',
    tablesCount: 6,
    activeThreads: ['Customer Master & Identity'],
    badge: 'NoSQL Document Store'
  },
  {
    id: 'conn_snowflake',
    name: 'Snowflake Enterprise Data Cloud',
    engine: 'Snowflake',
    engineCode: 'snowflake',
    host: 'xy12345.us-east-1.snowflakecomputing.com',
    port: '443',
    database: 'PROD_ANALYTICS',
    username: 'SVC_DATAX',
    ssl: true,
    status: 'configured',
    latency: '145 ms',
    tablesCount: 32,
    activeThreads: [],
    badge: 'Analytical Cloud'
  },
  {
    id: 'conn_databricks',
    name: 'Databricks Unity Catalog Lakehouse',
    engine: 'Databricks',
    engineCode: 'databricks',
    host: 'adb-4920194819.azuredatabricks.net',
    port: '443',
    database: 'gold_clean_core',
    username: 'token_auth',
    ssl: true,
    status: 'available',
    latency: '--',
    tablesCount: 0,
    activeThreads: [],
    badge: 'Delta Lake'
  }
];

export default function ConnectionsPage() {
  const { navigateTo } = useNavigation();
  const { setSourceConfig } = useRuleEngine();
  const [connections, setConnections] = useState(INITIAL_CONNECTIONS);
  const [testingId, setTestingId] = useState(null);
  const [testResult, setTestResult] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');

  // Add form state
  const [newConn, setNewConn] = useState({
    name: '',
    engine: 'postgres',
    host: '',
    port: '5432',
    database: '',
    username: '',
    password: '',
    ssl: true
  });

  const handleTestConnection = async (conn) => {
    setTestingId(conn.id);
    setTestResult(prev => ({ ...prev, [conn.id]: { status: 'testing', message: 'Pinging database endpoint...' } }));

    try {
      const payload = {
        engine: conn.engineCode || 'sap_bw',
        host: conn.host,
        port: conn.port,
        database: conn.database,
        user: conn.username,
        password: conn.password || ''
      };

      const data = await api.post('/test-connection', payload);
      if (data && data.status === 'success') {
        setTestResult(prev => ({
          ...prev,
          [conn.id]: {
            status: 'success',
            message: `Connection Verified! Latency: ${data.latency_ms || 120}ms (${data.availableTables?.length || conn.tablesCount} tables discovered)`
          }
        }));
      } else {
        setTestResult(prev => ({
          ...prev,
          [conn.id]: {
            status: 'error',
            message: data.detail || data.message || `Connection failed (HTTP ${res.status}): Server rejected authentication`
          }
        }));
      }
    } catch (err) {
      setTestResult(prev => ({
        ...prev,
        [conn.id]: {
          status: 'error',
          message: err.message || `Network error connecting to ${conn.host}`
        }
      }));
    } finally {
      setTestingId(null);
    }
  };

  const handleUseConnection = (conn) => {
    setSourceConfig(prev => ({
      ...prev,
      engine: conn.engineCode || 'sap_bw',
      host: conn.host,
      port: conn.port,
      database: conn.database,
      user: conn.username
    }));
    navigateTo('canvas');
  };

  const handleCreateConnection = (e) => {
    e.preventDefault();
    const created = {
      id: `conn_${Date.now()}`,
      name: newConn.name || `${newConn.engine.toUpperCase()} Custom Connection`,
      engine: newConn.engine.toUpperCase(),
      engineCode: newConn.engine,
      host: newConn.host || 'localhost',
      port: newConn.port || '5432',
      database: newConn.database || 'defaultdb',
      username: newConn.username || 'admin',
      ssl: newConn.ssl,
      status: 'connected',
      latency: '95 ms',
      tablesCount: 4,
      activeThreads: [],
      badge: 'Custom Vault'
    };
    setConnections([created, ...connections]);
    setShowAddModal(false);
  };

  const filteredConnections = connections.filter(c => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.engine.toLowerCase().includes(q) ||
        c.host.toLowerCase().includes(q) ||
        c.database.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <DataXAppShell onSwitchToMarketing={onSwitchToMarketing}>

      {/* Subheader Banner */}
      <section className="bg-white border-b border-[#E3E6EE] py-6 px-6">
        <div className="max-w-[1360px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#5F6678]">
              <Link to="threads" className="hover:text-[#2D55F5]">Threads</Link>
              <span>/</span>
              <span className="text-[#0A0F1F] font-semibold">Connections & Vault</span>
            </div>
            <h1 className="text-2xl font-bold text-[#0A0F1F] tracking-tight mt-1">
              Enterprise Data Connections & Vault
            </h1>
            <p className="text-sm text-[#5F6678] mt-1">
              Manage authenticated database sources, data warehouses, and secure target lakehouses with live health diagnostics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E95A9]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search connections, hosts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-[#F5F6FA] border border-[#E3E6EE] rounded-full text-xs text-[#0A0F1F] placeholder:text-[#8E95A9] focus:outline-none focus:border-[#2D55F5] focus:bg-white transition-all"
              />
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-[#2D55F5] hover:bg-[#1E3EB8] text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Add Connection</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredConnections.map((conn) => (
            <div
              key={conn.id}
              className="bg-white rounded-[22px] border border-[#E3E6EE] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header: Name, Badge, Status */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-[#0A0F1F] tracking-tight">
                        {conn.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#EBF0FF] text-[#2D55F5] border border-[#D5E1FF]">
                        {conn.badge}
                      </span>
                    </div>
                    <p className="text-xs text-[#5F6678] mt-1 font-mono">
                      {conn.engine} · {conn.host}:{conn.port}
                    </p>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {conn.status === 'connected' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E7F6EE] text-[#127A52] text-[11px] font-medium border border-[#BFE6D2]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#127A52] animate-pulse" />
                        Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F3F4F6] text-[#5F6678] text-[11px] font-medium border border-[#E5E7EB]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF]" />
                        Ready
                      </span>
                    )}
                  </div>
                </div>

                {/* Connection Specs */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#F2F4F7]">
                  <div className="bg-[#F8F9FA] p-2.5 rounded-xl border border-[#E3E6EE]">
                    <span className="text-[10px] uppercase font-semibold text-[#8E95A9]">Database</span>
                    <p className="text-xs font-mono font-medium text-[#0A0F1F] truncate mt-0.5">{conn.database}</p>
                  </div>
                  <div className="bg-[#F8F9FA] p-2.5 rounded-xl border border-[#E3E6EE]">
                    <span className="text-[10px] uppercase font-semibold text-[#8E95A9]">Username</span>
                    <p className="text-xs font-mono font-medium text-[#0A0F1F] truncate mt-0.5">{conn.username}</p>
                  </div>
                  <div className="bg-[#F8F9FA] p-2.5 rounded-xl border border-[#E3E6EE]">
                    <span className="text-[10px] uppercase font-semibold text-[#8E95A9]">Latency</span>
                    <p className="text-xs font-mono font-medium text-[#0A0F1F] truncate mt-0.5">{conn.latency}</p>
                  </div>
                </div>

                {/* Active Workflows utilizing connection */}
                {conn.activeThreads && conn.activeThreads.length > 0 && (
                  <div className="mt-4">
                    <span className="text-[11px] font-medium text-[#5F6678]">Active in Workflows:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {conn.activeThreads.map((t, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#F5F6FA] text-[#474E61] text-[10px] border border-[#E3E6EE]">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ping Result Feedback */}
                {testResult[conn.id] && (
                  <div className={`mt-3 p-2.5 rounded-xl text-xs flex items-center justify-between border ${
                    testResult[conn.id].status === 'success' 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                      : 'bg-blue-50 border-blue-200 text-blue-800'
                  }`}>
                    <span>{testResult[conn.id].message}</span>
                    <span className="text-[10px] font-mono text-slate-400">Live API</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-4 border-t border-[#F2F4F7] flex items-center justify-between gap-3">
                <button
                  onClick={() => handleTestConnection(conn)}
                  disabled={testingId === conn.id}
                  className="px-3.5 py-1.5 rounded-xl border border-[#CDD2DE] bg-white hover:bg-[#F5F6FA] text-xs font-semibold text-[#0A0F1F] transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                  <span>{testingId === conn.id ? 'Pinging...' : 'Test Ping'}</span>
                </button>

                <button
                  onClick={() => handleUseConnection(conn)}
                  className="px-4 py-1.5 rounded-xl bg-[#2D55F5] hover:bg-[#1E3EB8] text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>Use in Workflow</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Add Connection Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-[#E3E6EE] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#0A0F1F]">Add Database Connection</h3>
                <p className="text-xs text-[#5F6678]">Connect a source database or analytical warehouse.</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateConnection} className="space-y-3.5 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#0A0F1F] mb-1">Connection Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. Analytics SAP HANA Production"
                  value={newConn.name}
                  onChange={(e) => setNewConn({ ...newConn, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E3E6EE] rounded-xl focus:outline-none focus:border-[#2D55F5]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0A0F1F] mb-1">Engine</label>
                  <select
                    value={newConn.engine}
                    onChange={(e) => setNewConn({ ...newConn, engine: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#E3E6EE] rounded-xl focus:outline-none focus:border-[#2D55F5]"
                  >
                    <option value="sap_bw">SAP HANA Cloud</option>
                    <option value="postgres">PostgreSQL / Neon</option>
                    <option value="mongodb">MongoDB Atlas</option>
                    <option value="snowflake">Snowflake</option>
                    <option value="mysql">MySQL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0A0F1F] mb-1">Port</label>
                  <input
                    type="text"
                    value={newConn.port}
                    onChange={(e) => setNewConn({ ...newConn, port: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#E3E6EE] rounded-xl focus:outline-none focus:border-[#2D55F5]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0A0F1F] mb-1">Host Endpoint</label>
                <input
                  type="text"
                  placeholder="e.g. host.ondemand.com or localhost"
                  value={newConn.host}
                  onChange={(e) => setNewConn({ ...newConn, host: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E3E6EE] rounded-xl focus:outline-none focus:border-[#2D55F5]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0A0F1F] mb-1">Database Name</label>
                  <input
                    type="text"
                    placeholder="e.g. SYSTEMDB or prod"
                    value={newConn.database}
                    onChange={(e) => setNewConn({ ...newConn, database: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#E3E6EE] rounded-xl focus:outline-none focus:border-[#2D55F5]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0A0F1F] mb-1">Username</label>
                  <input
                    type="text"
                    placeholder="e.g. DBADMIN"
                    value={newConn.username}
                    onChange={(e) => setNewConn({ ...newConn, username: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#E3E6EE] rounded-xl focus:outline-none focus:border-[#2D55F5]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0A0F1F] mb-1">Password / Token</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={newConn.password}
                  onChange={(e) => setNewConn({ ...newConn, password: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-[#E3E6EE] rounded-xl focus:outline-none focus:border-[#2D55F5]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#F2F4F7]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E3E6EE] text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2D55F5] hover:bg-[#1E3EB8] text-white text-xs font-semibold shadow-xs"
                >
                  Save Connection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DataXAppShell>
  );
}
