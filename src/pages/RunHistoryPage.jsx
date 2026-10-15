import React, { useState } from 'react';
import { Link } from '../context/NavigationContext';
import { useRuleEngine } from '../context/RuleEngineContext';
import Button from '../components/ui/Button';
import Tag from '../components/ui/Tag';
import Input from '../components/ui/Input';
import Segmented from '../components/ui/Segmented';
import IconButton from '../components/ui/IconButton';
import Logo from '../components/icons/Logo';
import { IconArrowLeft, IconSearch } from '../components/icons/NavIcons';

export default function RunHistoryPage() {
  const { s4hanaDocNumber, passedRecords, quarantinedRecords } = useRuleEngine();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const runs = [
    {
      id: `RUN-${s4hanaDocNumber ? s4hanaDocNumber.slice(-5) : '99214'}`,
      thread: 'SAP BW → S/4HANA Clean Core',
      trigger: 'Agentic ReAct Loop',
      time: 'Just now',
      duration: '1.4s',
      records: `${passedRecords.length + quarantinedRecords.length} rows`,
      status: 'Passed',
      variant: 'success',
    },
    {
      id: 'RUN-99213',
      thread: 'Customer Master & Identity',
      trigger: 'Dry Run Simulation',
      time: '1 hour ago',
      duration: '2.8s',
      records: '18 records',
      status: 'Passed',
      variant: 'success',
    },
    {
      id: 'RUN-99212',
      thread: 'Healthcare Patient Master',
      trigger: 'Cron Schedule',
      time: '3 hours ago',
      duration: '4.2s',
      records: '9 records',
      status: 'Warning',
      variant: 'warning',
    },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 font-sans">
      <header className="bg-white border-b border-[#E3E6EE] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="threads" className="flex items-center gap-2.5">
            <Logo size={32} />
            <span className="font-bold text-[#0A0F1F] tracking-tight text-lg">DataX</span>
          </Link>
          <Link to="threads">
            <Button variant="secondary" size="md">
              Return to Threads
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to="threads" className="text-xs font-medium text-[#2D55F5] hover:underline flex items-center gap-1 mb-2">
            <IconArrowLeft size={14} color="#2D55F5" /> Back to Threads
          </Link>
          <h1 className="text-2xl font-bold text-[#0A0F1F] tracking-tight">Execution Run History</h1>
          <p className="text-sm text-[#5F6678] mt-1">Audit log and status records for all evaluated pipelines</p>
        </div>
      </div>

      <div className="bg-white border border-[#E3E6EE] rounded-xl p-6 shadow-sm space-y-5">
        <div className="border border-[#E3E6EE] rounded-lg overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F5F6FA] text-xs font-semibold text-[#5F6678] border-b border-[#E3E6EE]">
              <tr>
                <th className="py-3 px-4">Run ID</th>
                <th className="py-3 px-4">Target Thread</th>
                <th className="py-3 px-4">Trigger Mode</th>
                <th className="py-3 px-4">Records</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E6EE]">
              {runs.map((run) => (
                <tr key={run.id} className="hover:bg-[#F9FAFC] transition-colors">
                  <td className="py-3.5 px-4 font-mono text-xs text-[#0A0F1F] font-semibold">{run.id}</td>
                  <td className="py-3.5 px-4 font-medium text-[#0A0F1F]">{run.thread}</td>
                  <td className="py-3.5 px-4 text-xs text-[#5F6678]">{run.trigger}</td>
                  <td className="py-3.5 px-4 text-xs font-medium text-[#0A0F1F]">{run.records}</td>
                  <td className="py-3.5 px-4 text-xs text-[#5F6678]">{run.duration}</td>
                  <td className="py-3.5 px-4">
                    <Tag variant={run.variant}>{run.status}</Tag>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
