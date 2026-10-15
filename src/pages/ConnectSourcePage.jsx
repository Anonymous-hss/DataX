import React, { useState } from 'react';
import { Link } from '../context/NavigationContext';
import { useRuleEngine } from '../context/RuleEngineContext';
import Button from '../components/ui/Button';
import Tag from '../components/ui/Tag';
import Input from '../components/ui/Input';
import Segmented from '../components/ui/Segmented';
import IconButton from '../components/ui/IconButton';
import Logo from '../components/icons/Logo';
import { PostgresLogo, SapLogo, DatabaseIcon } from '../components/icons/DatabaseLogos';
import {
  IconThreads,
  IconDomainPacks,
  IconConnections,
  IconRuns,
  IconSearch,
  IconBell,
  IconHelp,
  IconChevronDown,
  IconArrowLeft,
} from '../components/icons/NavIcons';
import {
  IconTable,
  IconCheck,
  IconRefresh,
  IconPlay,
  IconLock,
  IconEye,
  IconEyeOff,
} from '../components/icons/ActionIcons';
import { AvatarDX } from '../components/icons/Illustrations';

export default function ConnectSourcePage() {
  const { currentData, selectedDatasetKey, handleDatasetChange } = useRuleEngine();
  const [testStatus, setTestStatus] = useState('success');
  const [connMode, setConnMode] = useState('connection-string');
  const [connString, setConnString] = useState('sap-bw://infocube-0pur_c01.jj-enterprise:3300');
  const [showSecret, setShowSecret] = useState(false);
  const [tableFilter, setTableFilter] = useState('');

  const datasets = [
    { id: 'procurement', name: '0PUR_C01 (Procurement Orders)', rows: '12 records', source: 'SAP BW' },
    { id: 'inventory', name: '0IC_C03 (Inventory Movements)', rows: '10 records', source: 'SAP BW' },
  ];

  const handleTestConnection = () => {
    setTestStatus('testing');
    setTimeout(() => setTestStatus('success'), 600);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <header className="bg-white border-b border-[#E3E6EE] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="threads" className="flex items-center gap-2.5">
              <Logo size={32} />
              <span className="font-bold text-[#0A0F1F] tracking-tight text-lg">DataX</span>
            </Link>

            <nav className="hidden sm:flex items-center gap-1">
              <Link to="threads" className="px-3 py-1.5 text-xs font-medium rounded-full text-[#474E61] hover:text-[#0A0F1F] hover:bg-[#F9FAFC] flex items-center gap-1.5">
                <IconThreads color="#5F6678" /> Threads
              </Link>
              <Link to="connect-source" className="px-3 py-1.5 text-xs font-medium rounded-full text-[#474E61] hover:text-[#0A0F1F] hover:bg-[#F9FAFC] flex items-center gap-1.5">
                <IconDomainPacks color="#5F6678" /> Domain packs
              </Link>
              <Link to="connect-source" className="px-3 py-1.5 text-xs font-medium rounded-full bg-[#ECF0FF] text-[#2D55F5] flex items-center gap-1.5">
                <IconConnections color="#2D55F5" /> Connections
              </Link>
              <Link to="history" className="px-3 py-1.5 text-xs font-medium rounded-full text-[#474E61] hover:text-[#0A0F1F] hover:bg-[#F9FAFC] flex items-center gap-1.5">
                <IconRuns color="#5F6678" /> Runs
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-10">
            <div className="flex items-center gap-8 hidden sm:flex">
              <div className="flex items-center gap-2.5 px-3 py-1.5 bg-[#F9FAFC] border border-[#E3E6EE] rounded-full">
                <IconSearch className="w-4 h-4 text-[#5F6678]" />
                <input
                  type="text"
                  placeholder="Search threads, tables…"
                  className="bg-transparent border-none outline-none text-xs text-[#5F6678] w-52 placeholder:text-[#A6ADC2]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <IconButton variant="default">
                <IconHelp />
              </IconButton>
              <IconButton variant="outlined">
                <IconBell />
              </IconButton>
              <AvatarDX size={34} />
            </div>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-[#E3E6EE] px-8 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="threads" className="w-9 h-9 rounded-full flex items-center justify-center bg-white border border-[#E3E6EE] hover:bg-[#F5F6FA] transition-colors">
            <IconArrowLeft />
          </Link>
          <div className="flex flex-col gap-0.5">
            <h2 className="text-[#0A0F1F] text-[18px] font-semibold leading-[130%] tracking-tight">SAP BW → S/4HANA Clean Core</h2>
            <div className="flex items-center gap-2">
              <Tag variant="neutral" showDot={false}>
                Configuring Source
              </Tag>
              <span className="text-xs text-[#5F6678]">0PUR_C01 InfoCube → S/4HANA Plant Reconciled</span>
            </div>
          </div>
        </div>

        <div className="w-[1px] h-[24px] bg-[#E3E6EE]" />

        <div className="flex items-center gap-2">
          <Link to="connect-target">
            <Button variant="secondary" size="md" className="px-3.5 py-[3px] text-[13px]">
              Next: Target
            </Button>
          </Link>
          <Link to="rules">
            <Button variant="primary" size="md" className="px-3.5 py-[3px] text-[13px]">
              View Rules
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-[#F9FAFC] border-b border-[#E3E6EE] px-8 py-3 flex gap-4">
        <div className="flex items-center gap-3 p-3 rounded-[18px] border w-[360px] border-[#2D55F5] shadow-[0_0_0_4px_rgba(45,85,245,0.16)] bg-white">
          <div className="w-5 h-5 rounded-[10px] bg-[#0A0F1F] flex items-center justify-center flex-shrink-0">
            <span className="text-[12px] font-medium text-[#D4FF3A] leading-[140%]">1</span>
          </div>
          <div className="w-11 h-11 rounded-[12px] bg-[#ECF0FF] flex items-center justify-center shrink-0">
            <SapLogo size={28} />
          </div>
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <span className="text-[#5F6678] text-[12px] font-medium leading-[140%]">Source</span>
            <span className="text-[#0A0F1F] text-[15px] font-semibold leading-[135%] tracking-tight">SAP BW InfoCube</span>
            <span className="text-[#5F6678] text-[12px] font-medium leading-[140%]">{selectedDatasetKey === 'procurement' ? '0PUR_C01' : '0IC_C03'}</span>
          </div>
          <Tag variant="success" showDot={false} className="text-[12px] px-2 py-0.5">
            Connected
          </Tag>
        </div>

        <div className="w-14 h-[16px] flex items-center justify-center shrink-0 self-center">
          <div className="w-[30px] h-[2px] bg-[#CDD2DE]" />
        </div>

        <Link to="rules" className="flex items-center gap-3 p-3 rounded-[18px] border w-[360px] border-[#CDD2DE] shadow-sm bg-white hover:border-[#2D55F5] transition-colors">
          <div className="w-5 h-5 rounded-[10px] bg-[#0A0F1F] flex items-center justify-center flex-shrink-0">
            <span className="text-[12px] font-medium text-[#D4FF3A] leading-[140%]">2</span>
          </div>
          <div className="w-11 h-11 rounded-[12px] bg-[#ECF0FF] flex items-center justify-center shrink-0">
            <DatabaseIcon size={20} className="text-[#2D55F5]" />
          </div>
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <span className="text-[#5F6678] text-[12px] font-medium leading-[140%]">AI rules</span>
            <span className="text-[#0A0F1F] text-[15px] font-semibold leading-[135%] tracking-tight">AI rule generator</span>
            <span className="text-[#5F6678] text-[12px] font-medium leading-[140%]">4 Active Rules</span>
          </div>
          <Tag variant="primary" showDot={false} className="text-[12px] px-2 py-0.5">
            Configured
          </Tag>
        </Link>

        <div className="w-14 h-[16px] flex items-center justify-center shrink-0 self-center">
          <div className="w-[30px] h-[2px] bg-[#CDD2DE]" />
        </div>

        <Link to="connect-target" className="flex items-center gap-3 p-3 rounded-[18px] border w-[360px] border-[#CDD2DE] shadow-sm bg-white hover:border-[#2D55F5] transition-colors">
          <div className="w-5 h-5 rounded-[10px] bg-[#0A0F1F] flex items-center justify-center flex-shrink-0 opacity-70">
            <span className="text-[12px] font-medium text-[#D4FF3A] leading-[140%]">3</span>
          </div>
          <div className="w-11 h-11 rounded-[12px] bg-[#F9FAFC] flex items-center justify-center shrink-0">
            <SapLogo size={24} />
          </div>
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <span className="text-[#5F6678] text-[12px] font-medium leading-[140%]">Target</span>
            <span className="text-[#0A0F1F] text-[15px] font-semibold leading-[135%] tracking-tight">SAP S/4HANA</span>
            <span className="text-[#5F6678] text-[12px] font-medium leading-[140%]">Clean Core Orders</span>
          </div>
          <Tag variant="neutral" showDot={false} className="text-[12px] px-2 py-0.5">
            Ready
          </Tag>
        </Link>
      </div>

      <main className="p-8 flex gap-8 min-h-[644px]">
        <section className="w-[520px] flex-shrink-0 bg-white border border-[#E3E6EE] rounded-[20px] shadow-sm flex flex-col">
          <div className="border-b border-[#E3E6EE] p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-[12px] bg-[#ECF0FF] flex items-center justify-center shrink-0">
              <SapLogo size={28} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[#5F6678] text-[12px] font-medium leading-[140%]">Step 1 of 3 · Source</span>
              <h3 className="text-[#0A0F1F] text-[18px] font-semibold leading-[130%] tracking-tight">Connect SAP BW source</h3>
            </div>
          </div>

          <div className="p-4 flex flex-col gap-3.5 flex-1 min-h-0">
            <div className="flex flex-col gap-1.5">
              <label className="text-[#0A0F1F] text-[13px] font-medium leading-[145%]">Dataset / InfoCube</label>
              <div className="relative">
                <Input
                  icon={<SapLogo size={20} />}
                  value={selectedDatasetKey === 'procurement' ? 'SAP BW 0PUR_C01 (Procurement)' : 'SAP BW 0IC_C03 (Inventory)'}
                  readOnly
                  className="pr-10 cursor-pointer"
                />
                <IconChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5F6678] pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[#0A0F1F] text-[13px] font-medium leading-[145%]">Select Active Source Data</label>
              <Segmented
                options={[
                  { label: 'Procurement (45000101)', value: 'procurement' },
                  { label: 'Inventory Movements', value: 'inventory' },
                ]}
                value={selectedDatasetKey}
                onChange={handleDatasetChange}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[#0A0F1F] text-[13px] font-medium leading-[145%]">Connection Endpoint</label>
              <div className="relative">
                <Input
                  value={connString}
                  onChange={(e) => setConnString(e.target.value)}
                  type={showSecret ? 'text' : 'password'}
                  className="font-mono text-xs pr-10"
                />
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#5F6678] hover:text-[#0A0F1F] rounded hover:bg-[#F5F6FA] transition-colors"
                >
                  {showSecret ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                </button>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <IconLock className="w-4 h-4 text-[#5F6678]" />
                <span className="text-[#5F6678] text-[12px] font-medium leading-[140%]">Encrypted in transit. Never exposed in external logs.</span>
              </div>
            </div>

            <div className="bg-[#E7F6EE] border border-[#BFE6D2] rounded-[14px] p-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#127A52] flex items-center justify-center shrink-0">
                <IconCheck size={14} color="#FFFFFF" />
              </div>
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-[#127A52] text-[13px] font-medium leading-[145%]">Connected · {currentData.length} records ready</span>
                <span className="text-[#474E61] text-[12px] font-medium leading-[140%]">SAP BW Extractor Active · Latency 28ms</span>
              </div>
              <Button variant="secondary" size="sm" onClick={handleTestConnection} className="px-3 py-[3px] text-[13px] min-w-[109px]">
                <IconRefresh className="mr-1 inline-block" />
                Refresh
              </Button>
            </div>
          </div>
        </section>

        <section className="flex-1 bg-white border border-[#E3E6EE] rounded-[20px] shadow-sm flex flex-col">
          <div className="border-b border-[#E3E6EE] p-4 flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <h3 className="text-[#0A0F1F] text-[18px] font-semibold leading-[130%] tracking-tight">Active Source Records</h3>
              <div className="flex items-center gap-2">
                <Tag variant="dark" showDot={false}>
                  {currentData.length} rows loaded
                </Tag>
                <span className="text-[#5F6678] text-xs">Simulating SAP BW Extract</span>
              </div>
            </div>
          </div>

          <div className="p-4 flex flex-col gap-3 flex-1 min-h-0 overflow-x-auto">
            <div className="border border-[#E3E6EE] rounded-[14px] overflow-hidden flex flex-col">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F6FA] text-[#5F6678] font-semibold border-b border-[#E3E6EE]">
                  <tr>
                    <th className="py-2.5 px-3">PO #</th>
                    <th className="py-2.5 px-3">Material</th>
                    <th className="py-2.5 px-3">Qty</th>
                    <th className="py-2.5 px-3">Unit Price</th>
                    <th className="py-2.5 px-3">Total</th>
                    <th className="py-2.5 px-3">Plant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E6EE]">
                  {currentData.slice(0, 8).map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#F9FAFC]">
                      <td className="py-2 px-3 font-mono font-medium text-[#0A0F1F]">{row.PO_NUMBER || row.MAT_DOC}</td>
                      <td className="py-2 px-3 text-[#474E61] truncate max-w-[160px]">{row.MATERIAL_DESC || row.MATERIAL_ID}</td>
                      <td className="py-2 px-3 font-mono">{row.QUANTITY}</td>
                      <td className="py-2 px-3 font-mono">${Number(row.UNIT_PRICE || 0).toFixed(2)}</td>
                      <td className="py-2 px-3 font-mono font-medium text-[#0A0F1F]">${Number(row.TOTAL_AMOUNT || 0).toFixed(2)}</td>
                      <td className="py-2 px-3">
                        <Tag variant={row.DELIVERY_PLANT?.startsWith('P') ? 'success' : 'warning'}>
                          {row.DELIVERY_PLANT || row.LOCATION || 'None'}
                        </Tag>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <div className="bg-white border-t border-[#E3E6EE] px-8 py-2.5 flex items-center justify-between">
        <Link to="threads">
          <Button variant="ghost" size="md">
            Cancel
          </Button>
        </Link>
        <Link to="connect-target">
          <Button variant="primary" size="md">
            Save & Continue to Target
          </Button>
        </Link>
      </div>
    </div>
  );
}
