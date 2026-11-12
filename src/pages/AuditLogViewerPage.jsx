import React, { useState, useEffect } from 'react';
import DataXAppShell from '../components/common/DataXAppShell';
import { useRuleEngine } from '../context/RuleEngineContext';
import { 
  Download, 
  Search, 
  AlertTriangle, 
  ShieldCheck, 
  Check, 
  ChevronDown 
} from 'lucide-react';
import { api } from '../services/apiClient';

export default function AuditLogViewerPage({ onSwitchToMarketing }) {
  const { activeThread } = useRuleEngine();
  const [filterAction, setFilterAction] = useState('all');
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const defaultLogs = [
    {
      id: 'aud_1',
      timestamp: '10 Nov · 10:35:51',
      action: 'Pipeline executed',
      actionType: 'pipeline',
      actor: 'Harshal Sawatkar',
      actorRole: 'Lead data engineer',
      targetSystem: 'SAP S/4HANA Clean Core',
      hash: '828207d1...a81a5',
      status: 'Verified'
    },
    {
      id: 'aud_2',
      timestamp: '10 Nov · 08:10:25',
      action: 'Rule synthesized',
      actionType: 'rule',
      actor: 'Harshal Sawatkar',
      actorRole: 'Lead data engineer',
      targetSystem: 'Intelligence engine · 0PUR_C01',
      hash: '7f8c28b9...01bc49',
      status: 'Verified'
    },
    {
      id: 'aud_3',
      timestamp: '10 Nov · 08:07:05',
      action: 'Pipeline executed',
      actionType: 'pipeline',
      actor: 'System · cron',
      actorRole: '0 */6 * * *',
      targetSystem: 'PostgreSQL Lakehouse',
      hash: '3c6376...188e',
      status: 'Verified'
    },
    {
      id: 'aud_4',
      timestamp: '6 Nov · 19:39:57',
      action: 'Quarantine resolved',
      actionType: 'quarantine',
      actor: 'Sarah Chen',
      actorRole: 'Data steward',
      targetSystem: 'Quarantine · 0PUR_C01',
      hash: '54d8f4...17b0',
      status: 'Verified'
    }
  ];

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const threadId = activeThread?.id || 'sap_bw_s4hana';
      const data = await api.get(`/threads/${threadId}/audit-logs`);
      if (Array.isArray(data.auditLogs) && data.auditLogs.length > 0) {
        setLogs(data.auditLogs);
      } else {
        setLogs(defaultLogs);
      }
    } catch {
      setLogs(defaultLogs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [activeThread]);

  const filteredLogs = logs.filter((log) => {
    if (filterAction === 'pipeline' && log.actionType !== 'pipeline') return false;
    if (filterAction === 'rule' && log.actionType !== 'rule') return false;
    if (filterAction === 'quarantine' && log.actionType !== 'quarantine') return false;

    if (search) {
      const q = search.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.actor.toLowerCase().includes(q) ||
        log.targetSystem.toLowerCase().includes(q) ||
        log.hash.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Action', 'Actor', 'Role', 'Target System', 'SHA-256 Hash', 'Status'];
    const rows = filteredLogs.map(l => [
      l.timestamp,
      l.action,
      l.actor,
      l.actorRole,
      l.targetSystem,
      l.hash,
      l.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `datax_audit_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DataXAppShell onSwitchToMarketing={onSwitchToMarketing}>
      <main className="max-w-[1400px] mx-auto px-6 py-8 font-sans space-y-6">
        {/* Header Block matching Main-2.png */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#2D55F5] border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2D55F5]" />
              SOC 2 Type II · ISO 27001 ledger
            </span>

            <h1 className="text-3xl font-bold text-[#0A0F1F] tracking-tight">
              Audit trail & lineage
            </h1>

            <p className="text-sm text-[#5F6678] font-medium">
              Tamper-evident record of every pipeline run, rule change and data steward remediation.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-full border border-[#CDD2DE] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#0A0F1F] flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#5F6678]" />
            <span>Export auditor CSV</span>
          </button>
        </div>

        {/* Filter and Search Bar matching Main-2.png */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          {/* Search Input */}
          <div className="relative w-full sm:w-[320px]">
            <Search className="w-4 h-4 text-[#8E95A9] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by action, actor or hash..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#CDD2DE] rounded-xl text-xs font-medium text-[#0A0F1F] placeholder:text-[#8E95A9] focus:outline-none focus:border-[#2D55F5]"
            />
          </div>

          {/* Action Filter Pills */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#5F6678] font-medium mr-1">Action</span>
            <div className="bg-[#EDEFF5] p-1 rounded-full flex items-center">
              <button
                type="button"
                onClick={() => setFilterAction('all')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  filterAction === 'all'
                    ? 'bg-white text-[#0A0F1F] shadow-2xs'
                    : 'text-[#5F6678] hover:text-[#0A0F1F]'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterAction('pipeline')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  filterAction === 'pipeline'
                    ? 'bg-white text-[#0A0F1F] shadow-2xs'
                    : 'text-[#5F6678] hover:text-[#0A0F1F]'
                }`}
              >
                Pipeline executed
              </button>
              <button
                type="button"
                onClick={() => setFilterAction('rule')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  filterAction === 'rule'
                    ? 'bg-white text-[#0A0F1F] shadow-2xs'
                    : 'text-[#5F6678] hover:text-[#0A0F1F]'
                }`}
              >
                Rule synthesized
              </button>
              <button
                type="button"
                onClick={() => setFilterAction('quarantine')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  filterAction === 'quarantine'
                    ? 'bg-white text-[#0A0F1F] shadow-2xs'
                    : 'text-[#5F6678] hover:text-[#0A0F1F]'
                }`}
              >
                Quarantine resolved
              </button>
            </div>
          </div>
        </div>

        {/* Ledger Table matching Main-2.png */}
        <div className="bg-white border border-[#E3E6EE] rounded-[24px] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E3E6EE] bg-white text-[#5F6678] text-[10px] font-bold tracking-wider uppercase">
                <tr>
                  <th className="py-3.5 px-6">TIMESTAMP</th>
                  <th className="py-3.5 px-6">ACTION</th>
                  <th className="py-3.5 px-6">ACTOR & ROLE</th>
                  <th className="py-3.5 px-6">TARGET SYSTEM</th>
                  <th className="py-3.5 px-6">SHA-256 HASH</th>
                  <th className="py-3.5 px-6">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F3F7]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F8FAFC] transition-colors">
                    {/* Timestamp */}
                    <td className="py-4 px-6 font-mono text-xs text-[#0A0F1F] whitespace-nowrap">
                      {log.timestamp}
                    </td>

                    {/* Action Pill */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        log.actionType === 'pipeline'
                          ? 'bg-[#EFF4FF] text-[#2D55F5] border-[#D0E1FD]'
                          : log.actionType === 'quarantine'
                            ? 'bg-[#FEF6EE] text-[#B54708] border-[#FDB022]/40'
                            : 'bg-[#F8FAFC] text-[#344054] border-[#D0D5DD]'
                      }`}>
                        {log.action}
                      </span>
                    </td>

                    {/* Actor & Role */}
                    <td className="py-4 px-6">
                      <p className="font-bold text-[#0A0F1F] text-xs">
                        {log.actor}
                      </p>
                      <p className="text-[11px] text-[#5F6678] mt-0.5 font-medium">
                        {log.actorRole}
                      </p>
                    </td>

                    {/* Target System */}
                    <td className="py-4 px-6 text-[#344054] font-medium text-xs">
                      {log.targetSystem}
                    </td>

                    {/* SHA-256 Hash */}
                    <td className="py-4 px-6 font-mono text-xs text-[#5F6678] whitespace-nowrap">
                      {log.hash}
                    </td>

                    {/* Status Pill */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Data Gap Confirmation Banner (Matching Main-2.png) */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">Data gap</span>
            <p className="leading-relaxed">
              In the live product these rows show only a timestamp and status; action, actor, target and hash render empty. The values above show the intended fields and are flagged for confirmation.
            </p>
          </div>
        </div>
      </main>
    </DataXAppShell>
  );
}
