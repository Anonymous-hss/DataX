import React, { useEffect } from 'react';
import { Link, useNavigation } from '../context/NavigationContext';
import { useRuleEngine } from '../context/RuleEngineContext';
import Button from '../components/ui/Button';
import Tag from '../components/ui/Tag';
import ProgressBar from '../components/ui/ProgressBar';
import Logo from '../components/icons/Logo';
import {
  IconCheck,
  IconSpinner,
  IconPlay,
  IconRefresh,
} from '../components/icons/ActionIcons';
import {
  IconSparkles,
  IconArrowLeft,
} from '../components/icons/NavIcons';

export default function RunningDryRunPage() {
  const { navigateTo } = useNavigation();
  const {
    pipelineStatus,
    agentStepIndex,
    telemetryLogs,
    runAgenticPipeline,
    currentData,
    passedRecords,
    quarantinedRecords,
  } = useRuleEngine();

  useEffect(() => {
    if (pipelineStatus === 'IDLE') {
      runAgenticPipeline();
    }
  }, [pipelineStatus]);

  const steps = [
    { num: 1, title: 'Extracting SAP BW Records', desc: `Loaded ${currentData.length} records from InfoCube 0PUR_C01` },
    { num: 2, title: 'Ontology Graph Entity Resolution', desc: 'Resolving legacy plant and location identifiers' },
    { num: 3, title: 'Evaluating Business Rules', desc: 'Testing against line item and calculations constraints' },
    { num: 4, title: 'Staging S/4HANA Writeback', desc: 'Isolating clean orders and preparing writeback doc' },
  ];

  const progressPercent = Math.min(100, Math.round((agentStepIndex / 4) * 100));

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 font-sans">
      <header className="bg-white border-b border-[#E3E6EE] sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="threads" className="flex items-center gap-2.5">
            <Logo size={32} />
            <span className="font-bold text-[#0A0F1F] tracking-tight text-lg">DataX</span>
          </Link>
          <div className="flex items-center gap-3">
            {pipelineStatus === 'COMPLETED' ? (
              <Button variant="primary" size="md" onClick={() => navigateTo('dry-run-results')}>
                View Results ({passedRecords.length} Passed, {quarantinedRecords.length} Quarantined)
              </Button>
            ) : (
              <Tag variant="primary">
                <IconSpinner size={12} color="#2D55F5" className="mr-1 inline-block" />
                Executing Pipeline...
              </Tag>
            )}
          </div>
        </div>
      </header>

      <div className="flex items-center justify-between">
        <div>
          <Link to="connect-target" className="text-xs font-medium text-[#2D55F5] hover:underline flex items-center gap-1 mb-2">
            <IconArrowLeft size={14} color="#2D55F5" /> Back to Target
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#0A0F1F] tracking-tight">Dry Run Execution Simulation</h1>
            <Tag variant={pipelineStatus === 'COMPLETED' ? 'success' : 'primary'}>
              {pipelineStatus === 'COMPLETED' ? 'Completed Successfully' : 'In Progress'}
            </Tag>
          </div>
          <p className="text-sm text-[#5F6678] mt-1">Executing agentic ReAct loop over active SAP BW dataset</p>
        </div>

        <Button variant="secondary" size="md" onClick={() => runAgenticPipeline()}>
          <IconRefresh className="mr-1 inline-block" /> Re-run
        </Button>
      </div>

      <div className="bg-white border border-[#E3E6EE] rounded-[20px] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between text-xs text-[#5F6678] font-semibold">
          <span>Simulation Progress</span>
          <span>{progressPercent}%</span>
        </div>
        <ProgressBar value={progressPercent} color="primary" />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-3">
          {steps.map((s) => {
            const isDone = agentStepIndex > s.num || pipelineStatus === 'COMPLETED';
            const isCurrent = agentStepIndex === s.num && pipelineStatus === 'RUNNING';

            return (
              <div
                key={s.num}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  isCurrent
                    ? 'border-[#2D55F5] bg-[#ECF0FF]/40 ring-2 ring-[#2D55F5]/20'
                    : isDone
                    ? 'border-[#BFE6D2] bg-[#E7F6EE]/40'
                    : 'border-[#E3E6EE] bg-white opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-[#5F6678]">Step {s.num}</span>
                  {isDone ? (
                    <span className="w-5 h-5 rounded-full bg-[#127A52] flex items-center justify-center text-white">
                      <IconCheck size={11} color="#FFFFFF" />
                    </span>
                  ) : isCurrent ? (
                    <IconSpinner size={14} color="#2D55F5" />
                  ) : null}
                </div>
                <h4 className="text-xs font-semibold text-[#0A0F1F]">{s.title}</h4>
                <p className="text-[11px] text-[#5F6678] mt-0.5 line-clamp-2">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Terminal Telemetry Log Console */}
      <div className="bg-[#0A0F1F] rounded-xl p-5 text-white font-mono text-xs space-y-2 shadow-lg border border-[#232B45]">
        <div className="flex items-center justify-between pb-3 border-b border-[#232B45] text-[#A6ADC2]">
          <div className="flex items-center gap-2">
            <IconSparkles size={14} color="#D4FF3A" />
            <span>Agentic Execution Log Stream</span>
          </div>
          <span className="text-[#D4FF3A] font-semibold">
            {pipelineStatus === 'COMPLETED' ? 'EXECUTION VERIFIED' : 'STREAMING'}
          </span>
        </div>

        <div className="pt-2 space-y-1.5 max-h-64 overflow-y-auto leading-relaxed">
          {telemetryLogs.map((log, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-[#5F6678] shrink-0 font-mono">[{log.time}]</span>
              <span
                className={`font-semibold shrink-0 ${
                  log.role === 'AGENT_HARNESS'
                    ? 'text-[#D4FF3A]'
                    : log.role === 'THOUGHT'
                    ? 'text-[#2D55F5]'
                    : log.role === 'TOOL_CALL'
                    ? 'text-[#C9D5FF]'
                    : 'text-[#127A52]'
                }`}
              >
                [{log.role}]
              </span>
              <span className="text-[#E3E6EE]">{log.message}</span>
            </div>
          ))}
          {telemetryLogs.length === 0 && (
            <div className="text-[#5F6678] italic">Initializing execution telemetry...</div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Link to="threads">
          <Button variant="ghost" size="md">
            Exit
          </Button>
        </Link>
        <Button
          variant="primary"
          size="md"
          disabled={pipelineStatus !== 'COMPLETED'}
          onClick={() => navigateTo('dry-run-results')}
        >
          Inspect Quarantine & Passed Rows &rarr;
        </Button>
      </div>
    </div>
  );
}
