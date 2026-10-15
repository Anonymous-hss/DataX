import React, { useState } from 'react';
import { Link, useNavigation } from '../context/NavigationContext';
import { useRuleEngine } from '../context/RuleEngineContext';
import Button from '../components/ui/Button';
import Tag from '../components/ui/Tag';
import Input from '../components/ui/Input';
import IconButton from '../components/ui/IconButton';
import Logo from '../components/icons/Logo';
import { SapLogo, PostgresLogo } from '../components/icons/DatabaseLogos';
import {
  IconThreads,
  IconDomainPacks,
  IconConnections,
  IconRuns,
  IconSearch,
  IconBell,
  IconHelp,
  IconArrowLeft,
} from '../components/icons/NavIcons';
import {
  IconCheck,
  IconPlay,
} from '../components/icons/ActionIcons';
import { AvatarDX } from '../components/icons/Illustrations';

export default function ConnectTargetPage() {
  const { navigateTo } = useNavigation();
  const { runAgenticPipeline, activeRules } = useRuleEngine();
  const [targetEndpoint, setTargetEndpoint] = useState('https://s4hana-prod.jj-enterprise.com/sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV');

  const handleStartDryRun = () => {
    navigateTo('running-dry-run');
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
          <Link to="connect-source" className="w-9 h-9 rounded-full flex items-center justify-center bg-white border border-[#E3E6EE] hover:bg-[#F5F6FA] transition-colors">
            <IconArrowLeft />
          </Link>
          <div className="flex flex-col gap-0.5">
            <h2 className="text-[#0A0F1F] text-[18px] font-semibold leading-[130%] tracking-tight">Connect Clean Core Target</h2>
            <div className="flex items-center gap-2">
              <Tag variant="neutral" showDot={false}>
                Step 3 of 3
              </Tag>
              <span className="text-xs text-[#5F6678]">Target destination for reconciled clean records</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" size="md" onClick={handleStartDryRun} className="px-4">
            <IconPlay className="mr-1 inline-block" filled />
            Run Dry Run Simulation
          </Button>
        </div>
      </div>

      <main className="p-8 max-w-3xl mx-auto space-y-6">
        <div className="bg-white border border-[#E3E6EE] rounded-[20px] p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-[#E3E6EE]">
            <div className="w-12 h-12 rounded-[14px] bg-[#ECF0FF] flex items-center justify-center shrink-0">
              <SapLogo size={32} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#0A0F1F]">SAP S/4HANA Writeback Target</h3>
              <p className="text-xs text-[#5F6678]">Staging and dispatching validated purchase orders into S/4HANA clean core</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0A0F1F] mb-1.5">S/4HANA OData API Service</label>
              <Input
                value={targetEndpoint}
                onChange={(e) => setTargetEndpoint(e.target.value)}
                className="font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#0A0F1F] mb-1.5">Client & System ID</label>
                <Input defaultValue="Client 100 · S4H_PROD" readOnly />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0A0F1F] mb-1.5">Writeback Transaction</label>
                <Input defaultValue="ME21N / BAPI_PO_CREATE1" readOnly />
              </div>
            </div>

            <div className="bg-[#E7F6EE] border border-[#BFE6D2] rounded-[14px] p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#127A52] flex items-center justify-center shrink-0">
                <IconCheck size={14} color="#FFFFFF" />
              </div>
              <div className="text-xs">
                <strong className="text-[#127A52] block font-semibold">Ready for Dry Run</strong>
                <span className="text-[#474E61]">Target authorization verified. 4 business rules will be evaluated prior to writeback.</span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-[#E3E6EE]">
            <Link to="rules">
              <Button variant="secondary" size="md">
                Configure Rules
              </Button>
            </Link>
            <Button variant="primary" size="md" onClick={handleStartDryRun}>
              <IconPlay className="mr-1 inline-block" filled />
              Start Dry Run
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
