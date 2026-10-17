import React, { useState } from 'react';
import { Link } from '../context/NavigationContext';
import { useRuleEngine } from '../context/RuleEngineContext';
import Button from '../components/ui/Button';
import Tag from '../components/ui/Tag';
import Input from '../components/ui/Input';
import Segmented from '../components/ui/Segmented';
import DataXUserMenu from '../components/common/DataXUserMenu';

// User-Provided Official DataX Logo
const DataXLogo = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className="shrink-0">
    <rect width="64" height="64" rx="16" fill="#2D55F5" />
    <polygon points="14.5,49.5 24.5,49.5 49.5,14.5 39.5,14.5" fill="#FFFFFF" />
    <polygon points="14.5,14.5 24.5,14.5 31.5,24.5 21.5,24.5" fill="#D4FF3A" />
    <polygon points="32.5,39.5 42.5,39.5 49.5,49.5 39.5,49.5" fill="#D4FF3A" />
  </svg>
);

export default function RunHistoryPage() {
  const { s4hanaDocNumber, dryRunResult, runHistory, activeThread, dynamicHealthScore } = useRuleEngine();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const displayRuns = runHistory || [];

  const totalRunsCount = displayRuns.length;
  const completedRuns = displayRuns.filter(r => r.status === 'Completed' || r.status === 'Clean Core Posted' || r.variant === 'success');
  const writebackRate = totalRunsCount > 0 
    ? `${Math.round((completedRuns.length / totalRunsCount) * 100)}%` 
    : '—';
  const writebackBadge = totalRunsCount > 0 
    ? (completedRuns.length === totalRunsCount ? '0 Failures' : `${totalRunsCount - completedRuns.length} Held`) 
    : 'No runs yet';

  const runsWithHealth = displayRuns.filter(r => r.health !== undefined && r.health !== null && !isNaN(parseFloat(r.health)));
  const meanHealth = runsWithHealth.length > 0
    ? `${(runsWithHealth.reduce((acc, r) => acc + parseFloat(r.health), 0) / runsWithHealth.length).toFixed(1)}%`
    : '—';

  const runsWithDuration = displayRuns.filter(r => r.duration && !isNaN(parseFloat(r.duration)));
  const avgDuration = runsWithDuration.length > 0
    ? `${(runsWithDuration.reduce((acc, r) => acc + parseFloat(r.duration), 0) / runsWithDuration.length).toFixed(1)}s`
    : '—';

  // Honest date grouping: map real runs to days
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const past7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - i));
    const dayName = dayNames[d.getDay()];
    const dateStr = d.toISOString().split('T')[0];
    return { day: dayName, dateStr, clean: 0, remediated: 0, total: 0 };
  });

  displayRuns.forEach(r => {
    const runDate = r.timestampIso ? r.timestampIso.split('T')[0] : (r.date || null);
    if (runDate) {
      const match = past7Days.find(d => d.dateStr === runDate);
      if (match) {
        const clean = Number(r.clean || 0);
        const autoFixed = Number(r.autoFixed || 0);
        match.clean += clean;
        match.remediated += autoFixed;
        match.total += (clean + autoFixed);
      }
    }
  });

  const barChartData = past7Days;
  const hasChartData = barChartData.some(b => b.total > 0);

  const filteredRuns = displayRuns.filter((r) => {
    if (filter === 'success' && r.variant !== 'success') return false;
    if (filter === 'remediated' && r.variant !== 'volt') return false;
    if (
      search.trim() &&
      !r.id.toLowerCase().includes(search.toLowerCase()) &&
      !r.thread.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#474E61] font-sans antialiased flex flex-col">
      {/* Top Navbar */}
      <header className="w-full bg-white border-b border-[#E3E6EE] sticky top-0 z-40">
        <div className="max-w-[1360px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="threads" className="flex items-center gap-2.5">
              <DataXLogo size={32} />
              <span className="font-bold text-[#0A0F1F] tracking-tight text-[18px]">DataX</span>
            </Link>
            <span className="text-[#CDD2DE] font-light">/</span>
            <span className="text-sm font-semibold text-[#0A0F1F]">Execution History & Analytics</span>
          </div>

          <div className="flex items-center gap-3">
            <Link to="threads">
              <Button variant="primary" size="md">
                ← Return to Threads
              </Button>
            </Link>
            <DataXUserMenu />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1360px] w-full mx-auto px-6 py-8 flex-1 flex flex-col gap-7">
        {/* Page Title & KPI Cards */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[30px] font-bold text-[#0A0F1F] tracking-tight leading-none">
              Runs & Analytics
            </h1>
            <p className="text-[14px] text-[#5F6678] mt-2 font-normal">
              Audit trails, execution telemetry, and Clean Core dispatch logs across all active threads.
            </p>
          </div>
        </div>

        {/* 4 Analytics Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E3E6EE] rounded-[18px] p-5 shadow-xs">
            <span className="text-xs font-semibold text-[#5F6678]">Runs Recorded</span>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-2xl font-bold text-[#0A0F1F]">{totalRunsCount}</span>
              <Tag variant={totalRunsCount > 0 ? 'success' : 'neutral'}>
                {totalRunsCount > 0 ? `${totalRunsCount} logged` : '0 runs'}
              </Tag>
            </div>
            <p className="text-[11px] text-[#8E95A9] mt-1">Across active CleanFlow threads</p>
          </div>

          <div className="bg-white border border-[#E3E6EE] rounded-[18px] p-5 shadow-xs">
            <span className="text-xs font-semibold text-[#5F6678]">Mean Data Health</span>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-2xl font-bold text-[#0A0F1F]">
                {meanHealth}
              </span>
              <Tag variant={parseFloat(meanHealth) >= 90 ? 'volt' : 'warning'}>
                {parseFloat(meanHealth) >= 90 ? 'A+ Grade' : parseFloat(meanHealth) >= 75 ? 'B+ Grade' : 'Standard'}
              </Tag>
            </div>
            <p className="text-[11px] text-[#8E95A9] mt-1">Evaluated across all business rules</p>
          </div>

          <div className="bg-white border border-[#E3E6EE] rounded-[18px] p-5 shadow-xs">
            <span className="text-xs font-semibold text-[#5F6678]">S/4HANA Writeback Success</span>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-2xl font-bold text-[#127A52]">{writebackRate}</span>
              <Tag variant={completedRuns.length > 0 ? 'success' : 'neutral'}>{writebackBadge}</Tag>
            </div>
            <p className="text-[11px] text-[#8E95A9] mt-1">Direct BAPI clean ingestion</p>
          </div>

          <div className="bg-white border border-[#E3E6EE] rounded-[18px] p-5 shadow-xs">
            <span className="text-xs font-semibold text-[#5F6678]">Avg Execution Time</span>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-2xl font-bold text-[#2D55F5]">{avgDuration}</span>
              <Tag variant="neutral">{totalRunsCount > 0 ? 'Measured Latency' : 'No telemetry'}</Tag>
            </div>
            <p className="text-[11px] text-[#8E95A9] mt-1">Accelerated ReAct evaluation loop</p>
          </div>
        </div>

        {/* Visual Bar Chart (Figma Frame 10 Match) */}
        <div className="bg-white border border-[#E3E6EE] rounded-[22px] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0F2F6]">
            <div>
              <h3 className="text-sm font-bold text-[#0A0F1F]">Weekly Run Volume & Clean Core Health</h3>
              <p className="text-xs text-[#5F6678]">Breakdown of clean records vs. ontology-remediated orders</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-[3px] bg-[#2D55F5]" /> Clean Ingestion
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-[3px] bg-[#D4FF3A]" /> Auto-Remediated
              </span>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          {!hasChartData ? (
            <div className="h-40 flex flex-col items-center justify-center border border-dashed border-[#E3E6EE] rounded-xl text-center p-6 text-xs text-slate-400 bg-slate-50/50">
              <p className="font-semibold text-slate-600">No execution telemetry recorded this week</p>
              <p className="text-[11px] text-slate-400 mt-1">Run a dry run simulation or start a live thread to populate daily execution volume.</p>
            </div>
          ) : (
            <div className="h-48 flex items-end justify-between gap-6 pt-6 px-4">
              {barChartData.map((d, idx) => {
                const maxVol = Math.max(...barChartData.map(b => b.total), 1);
                const cleanHeight = `${(d.clean / maxVol) * 100}%`;
                const remediatedHeight = `${(d.remediated / maxVol) * 100}%`;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <span className="text-[10px] font-mono font-bold text-[#0A0F1F] opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.total} runs
                    </span>
                    <div className="w-full max-w-[42px] flex flex-col justify-end rounded-[6px] overflow-hidden bg-[#F5F6FA] h-full">
                      <div style={{ height: remediatedHeight }} className="w-full bg-[#D4FF3A] transition-all" />
                      <div style={{ height: cleanHeight }} className="w-full bg-[#2D55F5] transition-all" />
                    </div>
                    <span className="text-xs font-semibold text-[#5F6678] mt-1">{d.day}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Run Audit Log Table */}
        <div className="bg-white border border-[#E3E6EE] rounded-[22px] p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-[#F0F2F6]">
            <Segmented
              options={[
                { label: 'All Executions', value: 'all' },
                { label: 'Clean Success', value: 'success' },
                { label: 'Auto-Remediated', value: 'remediated' },
              ]}
              value={filter}
              onChange={setFilter}
            />
            <div className="w-full sm:w-64">
              <Input
                placeholder="Search run ID or thread..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <div className="border border-[#E3E6EE] rounded-[14px] overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F9FA] text-[#5F6678] font-semibold border-b border-[#E3E6EE]">
                <tr>
                  <th className="py-3 px-4">Run Identifier</th>
                  <th className="py-3 px-4">Pipeline Thread</th>
                  <th className="py-3 px-4">Trigger Engine</th>
                  <th className="py-3 px-4">Volume</th>
                  <th className="py-3 px-4">Target Doc #</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Clean Core Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E6EE]">
                {filteredRuns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-[#5F6678]">
                      <div className="max-w-xs mx-auto space-y-1">
                        <p className="font-semibold text-slate-700">No pipeline runs recorded yet</p>
                        <p className="text-[11px] text-slate-400">
                          Execute a dry run or live stream run from your connected pipeline to see telemetry and execution audit history here.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRuns.map((run) => (
                    <tr key={run.id} className="hover:bg-[#F9FAFC] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0A0F1F]">{run.id}</td>
                      <td className="py-3.5 px-4 font-medium text-[#0A0F1F]">{run.thread}</td>
                      <td className="py-3.5 px-4 text-[#5F6678]">{run.trigger}</td>
                      <td className="py-3.5 px-4 font-mono">{run.records}</td>
                      <td className="py-3.5 px-4 font-mono text-[#2D55F5] font-semibold">{run.docNo}</td>
                      <td className="py-3.5 px-4 text-[#5F6678]">{run.duration}</td>
                      <td className="py-3.5 px-4">
                        <Tag variant={run.variant}>{run.status}</Tag>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Bottom Sticky Action Bar linking back to Threads */}
      <div className="bg-white border-t border-[#E3E6EE] px-6 lg:px-8 py-3 sticky bottom-0 z-30 shadow-sm">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between">
          <span className="text-xs text-[#5F6678]">
            End of Pipeline Flow · Execution history saved to enterprise audit log
          </span>
          <Link to="threads">
            <Button variant="primary" size="md">
              ← Return to Threads Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
