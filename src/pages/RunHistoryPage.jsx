import React, { useState, useEffect } from 'react';
import DataXAppShell from '../components/common/DataXAppShell';
import { useRuleEngine } from '../context/RuleEngineContext';
import { useNavigation } from '../context/NavigationContext';
import { 
  ArrowLeft, 
  Search, 
  Play, 
  CheckCircle2, 
  Clock, 
  ExternalLink 
} from 'lucide-react';

export default function RunHistoryPage({ onSwitchToMarketing } = {}) {
  const { navigateTo } = useNavigation();
  const { runHistory } = useRuleEngine?.() || {};
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Default mock runs matching Main-1.png
  const defaultRuns = [
    {
      id: 'run_8f21c0',
      workflow: 'SAP BW → S/4HANA Clean Core',
      trigger: 'Dry run',
      volume: '1,420',
      targetDoc: '—',
      duration: '1.18 s',
      status: 'Clean success',
      statusType: 'success'
    },
    {
      id: 'run_8f1e77',
      workflow: 'SAP BW → S/4HANA Clean Core',
      trigger: 'Live',
      volume: '1,420',
      targetDoc: '4500743585',
      duration: '1.42 s',
      status: 'Auto-remediated',
      statusType: 'remediated'
    },
    {
      id: 'run_8f1a02',
      workflow: 'Customer Master & Identity',
      trigger: 'Cron · 06:00',
      volume: '2,108',
      targetDoc: '—',
      duration: '1.65 s',
      status: 'Clean success',
      statusType: 'success'
    },
    {
      id: 'run_8f17b9',
      workflow: 'Financial GL & AP Ledger',
      trigger: 'Live',
      volume: '964',
      targetDoc: 'GL-20261110-07',
      duration: '0.98 s',
      status: 'Quarantine held',
      statusType: 'quarantine'
    }
  ];

  const runs = (runHistory && runHistory.length > 0) ? runHistory : defaultRuns;

  const filteredRuns = runs.filter((r) => {
    if (filter === 'success' && r.statusType !== 'success') return false;
    if (filter === 'remediated' && r.statusType !== 'remediated') return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const idMatch = (r.id || '').toLowerCase().includes(q);
      const wfMatch = (r.workflow || r.thread || '').toLowerCase().includes(q);
      return idMatch || wfMatch;
    }
    return true;
  });

  // 7-day bar chart values matching Main-1.png
  const daysData = [
    { day: 'Mon', clean: 78, remediated: 12 },
    { day: 'Tue', clean: 95, remediated: 4 },
    { day: 'Wed', clean: 65, remediated: 10 },
    { day: 'Thu', clean: 96, remediated: 0 },
    { day: 'Fri', clean: 88, remediated: 11 },
    { day: 'Sat', clean: 55, remediated: 5 },
    { day: 'Sun', clean: 45, remediated: 4 }
  ];

  return (
    <DataXAppShell onSwitchToMarketing={onSwitchToMarketing}>
      <main className="max-w-[1400px] mx-auto px-6 py-8 font-sans space-y-6">
        {/* Header Block matching Main-1.png */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#0A0F1F] tracking-tight">
              Runs & analytics
            </h1>
            <p className="text-sm text-[#5F6678] mt-1.5 font-medium">
              Execution history, health and S/4HANA dispatch logs across every workflow.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigateTo('workflows')}
            className="px-4 py-2 rounded-full border border-[#CDD2DE] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#0A0F1F] flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#5F6678]" />
            <span>Back to workflows</span>
          </button>
        </div>

        {/* 4 Top Metric Cards (Matching Main-1.png) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="bg-white border border-[#E3E6EE] rounded-[24px] p-6 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-[#5F6678] block">
              Runs recorded
            </span>
            <div className="text-3xl font-extrabold text-[#0A0F1F] font-mono tracking-tight">
              24
            </div>
            <span className="text-xs text-[#5F6678] block pt-1 font-medium">
              This week · 3 workflows
            </span>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-[#E3E6EE] rounded-[24px] p-6 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-[#5F6678] block">
              Mean data health
            </span>
            <div className="text-3xl font-extrabold text-[#0A0F1F] font-mono tracking-tight">
              96.8%
            </div>
            <span className="text-xs text-[#5F6678] block pt-1 font-medium">
              Across all rules
            </span>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-[#E3E6EE] rounded-[24px] p-6 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-[#5F6678] block">
              S/4HANA writeback
            </span>
            <div className="text-3xl font-extrabold text-[#0A0F1F] font-mono tracking-tight">
              99.2%
            </div>
            <span className="text-xs text-[#5F6678] block pt-1 font-medium">
              Direct BAPI ingestion
            </span>
          </div>

          {/* Card 4 */}
          <div className="bg-white border border-[#E3E6EE] rounded-[24px] p-6 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-[#5F6678] block">
              Avg execution time
            </span>
            <div className="text-3xl font-extrabold text-[#0A0F1F] font-mono tracking-tight">
              1.4 s
            </div>
            <span className="text-xs text-[#5F6678] block pt-1 font-medium">
              Per 1,420-row batch
            </span>
          </div>
        </div>

        {/* Weekly Run Volume & Health Bar Chart Card matching Main-1.png */}
        <div className="bg-white border border-[#E3E6EE] rounded-[24px] p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
            <div>
              <h2 className="text-base font-bold text-[#0A0F1F]">
                Weekly run volume & health
              </h2>
              <p className="text-xs text-[#5F6678] mt-0.5 font-medium">
                Clean rows vs auto-remediated rows
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2D55F5]" />
                <span className="text-[#0A0F1F]">Clean</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B2CCFF]" />
                <span className="text-[#0A0F1F]">Auto-remediated</span>
              </span>
            </div>
          </div>

          {/* Bar Chart Bars */}
          <div className="h-56 flex items-end justify-between gap-4 sm:gap-8 pt-6 px-4">
            {daysData.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="w-full max-w-[56px] flex flex-col justify-end rounded-t-lg overflow-hidden h-full">
                  {/* Top: Auto-remediated portion */}
                  {d.remediated > 0 && (
                    <div
                      style={{ height: `${d.remediated}%` }}
                      className="w-full bg-[#B2CCFF] transition-all"
                    />
                  )}
                  {/* Bottom: Clean portion */}
                  <div
                    style={{ height: `${d.clean}%` }}
                    className="w-full bg-[#2D55F5] transition-all"
                  />
                </div>
                <span className="text-xs font-semibold text-[#5F6678] mt-2">
                  {d.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Filter and Search Bar matching Main-1.png */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          {/* Filter Pills */}
          <div className="bg-[#EDEFF5] p-1 rounded-full flex items-center text-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-white text-[#0A0F1F] shadow-2xs'
                  : 'text-[#5F6678] hover:text-[#0A0F1F]'
              }`}
            >
              All executions
            </button>
            <button
              type="button"
              onClick={() => setFilter('success')}
              className={`px-4 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
                filter === 'success'
                  ? 'bg-white text-[#0A0F1F] shadow-2xs'
                  : 'text-[#5F6678] hover:text-[#0A0F1F]'
              }`}
            >
              Clean success
            </button>
            <button
              type="button"
              onClick={() => setFilter('remediated')}
              className={`px-4 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
                filter === 'remediated'
                  ? 'bg-white text-[#0A0F1F] shadow-2xs'
                  : 'text-[#5F6678] hover:text-[#0A0F1F]'
              }`}
            >
              Auto-remediated
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-[320px]">
            <Search className="w-4 h-4 text-[#8E95A9] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search run ID or workflow..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#CDD2DE] rounded-xl text-xs font-medium text-[#0A0F1F] placeholder:text-[#8E95A9] focus:outline-none focus:border-[#2D55F5]"
            />
          </div>
        </div>

        {/* Runs Table matching Main-1.png */}
        <div className="bg-white border border-[#E3E6EE] rounded-[24px] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E3E6EE] bg-white text-[#5F6678] text-[10px] font-bold tracking-wider uppercase">
                <tr>
                  <th className="py-3.5 px-6">RUN ID</th>
                  <th className="py-3.5 px-6">WORKFLOW</th>
                  <th className="py-3.5 px-6">TRIGGER</th>
                  <th className="py-3.5 px-6">VOLUME</th>
                  <th className="py-3.5 px-6">TARGET DOC #</th>
                  <th className="py-3.5 px-6">DURATION</th>
                  <th className="py-3.5 px-6">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F3F7]">
                {filteredRuns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-[#5F6678]">
                      <div className="max-w-xs mx-auto space-y-1">
                        <p className="font-semibold text-slate-700">No pipeline runs yet</p>
                        <p className="text-[11px] text-slate-400">
                          Run a dry run or a live stream from a connected workflow to see history here.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRuns.map((r) => (
                    <tr key={r.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-4 px-6 font-mono text-xs text-[#0A0F1F] whitespace-nowrap">
                        {r.id}
                      </td>
                      <td className="py-4 px-6 font-bold text-[#0A0F1F] text-xs">
                        {r.workflow || r.thread}
                      </td>
                      <td className="py-4 px-6 text-[#5F6678] font-medium text-xs">
                        {r.trigger}
                      </td>
                      <td className="py-4 px-6 font-mono text-[#0A0F1F] text-xs">
                        {r.volume || r.records}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-[#5F6678]">
                        {r.targetDoc || r.docNo || '—'}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-[#0A0F1F]">
                        {r.duration}
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          r.statusType === 'success' || r.status?.toLowerCase().includes('success')
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : r.statusType === 'remediated' || r.status?.toLowerCase().includes('remediated')
                              ? 'bg-blue-50 text-[#2D55F5] border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            r.statusType === 'success' || r.status?.toLowerCase().includes('success')
                              ? 'bg-emerald-500'
                              : r.statusType === 'remediated' || r.status?.toLowerCase().includes('remediated')
                                ? 'bg-[#2D55F5]'
                                : 'bg-amber-500'
                          }`} />
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </DataXAppShell>
  );
}
