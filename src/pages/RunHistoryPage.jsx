import React, { useState } from 'react';
import { Link } from '../context/NavigationContext';
import { useRuleEngine } from '../context/RuleEngineContext';
import Button from '../components/ui/Button';
import Tag from '../components/ui/Tag';
import Input from '../components/ui/Input';
import Segmented from '../components/ui/Segmented';

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

  // Weekly runs telemetry bar chart data (Figma Frame 10)
  const barChartData = [
    { day: 'Mon', clean: 8, remediated: 2, total: 10 },
    { day: 'Tue', clean: 14, remediated: 3, total: 17 },
    { day: 'Wed', clean: 11, remediated: 1, total: 12 },
    { day: 'Thu', clean: 18, remediated: 4, total: 22 },
    { day: 'Fri', clean: 16, remediated: 2, total: 18 },
    { day: 'Sat', clean: 6, remediated: 1, total: 7 },
    { day: 'Sun', clean: 9, remediated: 2, total: 11 },
  ];

  const displayRuns = runHistory && runHistory.length > 0 ? runHistory : [
    {
      id: `RUN-${s4hanaDocNumber ? s4hanaDocNumber.slice(-5) : '99284'}`,
      thread: activeThread?.name || 'SAP BW → S/4HANA Clean Core',
      trigger: 'ReAct Agentic Loop',
      time: 'Just now',
      duration: '1.4s',
      records: `${dryRunResult?.totalChecked || 50} rows`,
      docNo: s4hanaDocNumber ? `#${s4hanaDocNumber}` : '#4500019284',
      status: 'Clean Core Posted',
      variant: 'success',
    },
    {
      id: 'RUN-99283',
      thread: 'Customer Master & Identity',
      trigger: 'Dry Run Simulation',
      time: '45 mins ago',
      duration: '2.1s',
      records: '50 rows',
      docNo: 'CRM-SYNC-881',
      status: 'Clean Core Posted',
      variant: 'success',
    },
    {
      id: 'RUN-99282',
      thread: 'Healthcare Patient Master',
      trigger: 'Cron Automated Trigger',
      time: '2 hours ago',
      duration: '3.6s',
      records: '50 rows',
      docNo: 'HL7-FHIR-402',
      status: 'Remediated & Posted',
      variant: 'volt',
    },
    {
      id: 'RUN-99281',
      thread: 'SAP BW → S/4HANA Clean Core',
      trigger: 'Manual Dry Run',
      time: 'Yesterday',
      duration: '1.8s',
      records: '50 rows',
      docNo: '#4500019210',
      status: 'Clean Core Posted',
      variant: 'success',
    },
  ];

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

          <Link to="threads">
            <Button variant="primary" size="md">
              ← Return to Threads
            </Button>
          </Link>
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
            <span className="text-xs font-semibold text-[#5F6678]">Runs This Week</span>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-2xl font-bold text-[#0A0F1F]">69</span>
              <Tag variant="success">+18% vs last week</Tag>
            </div>
            <p className="text-[11px] text-[#8E95A9] mt-1">Across 3 active pipelines</p>
          </div>

          <div className="bg-white border border-[#E3E6EE] rounded-[18px] p-5 shadow-xs">
            <span className="text-xs font-semibold text-[#5F6678]">Mean Data Health</span>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-2xl font-bold text-[#0A0F1F]">
                {dynamicHealthScore || activeThread?.successRate || 94.0}%
              </span>
              <Tag variant={(dynamicHealthScore || activeThread?.successRate || 94.0) >= 90 ? 'volt' : 'warning'}>
                {(dynamicHealthScore || activeThread?.successRate || 94.0) >= 90 ? 'A+ Grade' : (dynamicHealthScore || activeThread?.successRate || 94.0) >= 75 ? 'B+ Grade' : 'C Grade'}
              </Tag>
            </div>
            <p className="text-[11px] text-[#8E95A9] mt-1">Evaluated across all business rules</p>
          </div>

          <div className="bg-white border border-[#E3E6EE] rounded-[18px] p-5 shadow-xs">
            <span className="text-xs font-semibold text-[#5F6678]">S/4HANA Writeback Success</span>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-2xl font-bold text-[#127A52]">100%</span>
              <Tag variant="success">0 Failures</Tag>
            </div>
            <p className="text-[11px] text-[#8E95A9] mt-1">Direct BAPI clean ingestion</p>
          </div>

          <div className="bg-white border border-[#E3E6EE] rounded-[18px] p-5 shadow-xs">
            <span className="text-xs font-semibold text-[#5F6678]">Avg Execution Time</span>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-2xl font-bold text-[#2D55F5]">1.8s</span>
              <Tag variant="neutral">Sub-second Latency</Tag>
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
          <div className="h-48 flex items-end justify-between gap-6 pt-6 px-4">
            {barChartData.map((d, idx) => {
              const cleanHeight = `${(d.clean / 24) * 100}%`;
              const remediatedHeight = `${(d.remediated / 24) * 100}%`;

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
                {filteredRuns.map((run) => (
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
                ))}
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
