import React, { useEffect } from 'react';
import { Link, useNavigation } from '../context/NavigationContext';
import { useRuleEngine } from '../context/RuleEngineContext';
import PipelineHeader from '../components/common/PipelineHeader';
import Button from '../components/ui/Button';
import Tag from '../components/ui/Tag';
import ProgressBar from '../components/ui/ProgressBar';
import { IconCheck, IconSpinner, IconRefresh, IconPlay } from '../components/icons/ActionIcons';

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
    { num: 2, title: 'Ontology Graph Entity Resolution', desc: 'Resolving legacy plant and location identifiers (e.g. P999 → P1000)' },
    { num: 3, title: 'Evaluating Business Rules', desc: 'Testing R01-R04 constraints against purchase order lines' },
    { num: 4, title: 'Staging S/4HANA Writeback', desc: 'Isolating clean orders and preparing BAPI writeback payload' },
  ];

  const progressPercent = Math.min(100, Math.round((agentStepIndex / 4) * 100));

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#474E61] font-sans antialiased flex flex-col">
      {/* Figma Flow Step Header */}
      <PipelineHeader currentStep={4} threadTitle="SAP BW → S/4HANA Clean Core" />

      {/* Main Container */}
      <main className="max-w-[1360px] w-full mx-auto px-6 py-7 flex-1 flex flex-col gap-6">
        {/* Step Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-[#2D55F5] uppercase">
              Step 4 of 5 · Simulation Execution
            </span>
            <h1 className="text-[26px] font-bold text-[#0A0F1F] tracking-tight leading-tight mt-1">
              Dry Run Simulation & Agent Telemetry
            </h1>
            <p className="text-[13px] text-[#5F6678] mt-1">
              Executing the ReAct decision intelligence loop over active SAP BW procurement records.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Tag variant={pipelineStatus === 'COMPLETED' ? 'success' : 'primary'}>
              {pipelineStatus === 'COMPLETED' ? (
                <>✓ Evaluation Complete</>
              ) : (
                <>
                  <IconSpinner size={12} color="#2D55F5" className="mr-1 inline-block" /> Running Loop...
                </>
              )}
            </Tag>
            <Button variant="secondary" size="sm" onClick={() => runAgenticPipeline()}>
              <IconRefresh size={13} className="mr-1" /> Re-run
            </Button>
          </div>
        </div>

        {/* Progress & Simulation Stepper Card */}
        <div className="bg-white border border-[#E3E6EE] rounded-[22px] p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-[#0A0F1F]">Overall Simulation Progress</span>
            <span className="text-[#2D55F5] font-mono text-sm">{progressPercent}%</span>
          </div>
          <ProgressBar value={progressPercent} color="primary" />

          {/* 4 Pipeline Stages */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3">
            {steps.map((s) => {
              const isDone = agentStepIndex > s.num || pipelineStatus === 'COMPLETED';
              const isCurrent = agentStepIndex === s.num && pipelineStatus === 'RUNNING';

              return (
                <div
                  key={s.num}
                  className={`p-4 rounded-[16px] border transition-all ${
                    isDone
                      ? 'border-[#BFE6D2] bg-[#E7F6EE]/30'
                      : isCurrent
                      ? 'border-[#2D55F5] bg-[#EEF2FF]/40 shadow-xs ring-2 ring-[#2D55F5]/20'
                      : 'border-[#E3E6EE] bg-[#F9FAFC] opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-[#5F6678]">Stage 0{s.num}</span>
                    {isDone ? (
                      <span className="w-5 h-5 rounded-full bg-[#127A52] flex items-center justify-center text-white text-[10px] font-bold">
                        ✓
                      </span>
                    ) : isCurrent ? (
                      <IconSpinner size={14} color="#2D55F5" />
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-[#E3E6EE] flex items-center justify-center text-[#5F6678] text-[10px]">
                        {s.num}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-[#0A0F1F] leading-snug">{s.title}</h4>
                  <p className="text-[11px] text-[#5F6678] mt-1 leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live ReAct Agent Telemetry Terminal */}
        <div className="bg-[#0A0F1F] rounded-[22px] border border-[#232B45] p-6 text-slate-100 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-[#232B45]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#EF4444]" />
              <span className="w-3 h-3 rounded-full bg-[#F59E0B]" />
              <span className="w-3 h-3 rounded-full bg-[#10B981]" />
              <span className="text-xs font-mono text-[#A6ADC2] ml-2">ReAct Telemetry Stream · TH-0842</span>
            </div>
            <span className="text-[11px] font-mono text-[#D4FF3A]">Live Trace Active</span>
          </div>

          <div className="mt-4 font-mono text-xs space-y-2 max-h-64 overflow-y-auto">
            {telemetryLogs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-3 text-slate-300">
                <span className="text-[#5F6678] shrink-0 select-none">[{idx + 1}]</span>
                <span className={log.includes('PASSED') ? 'text-[#10B981]' : log.includes('QUARANTINED') ? 'text-[#F59E0B]' : 'text-slate-200'}>
                  {log}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* When Simulation Complete Card */}
        {pipelineStatus === 'COMPLETED' && (
          <div className="bg-[#E7F6EE] border border-[#BFE6D2] rounded-[22px] p-5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#127A52] flex items-center justify-center text-white shrink-0">
                <IconCheck size={18} color="#FFFFFF" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#127A52]">
                  Simulation Complete · 8 Records Evaluated
                </h3>
                <p className="text-xs text-[#474E61]">
                  5 passed cleanly. 3 quarantined with automatic ontology plant remediation ready.
                </p>
              </div>
            </div>
            <Link to="dry-run-results">
              <Button variant="primary" size="md" className="bg-[#127A52] hover:bg-[#0E6342] text-white">
                View Detailed Results & Remediation →
              </Button>
            </Link>
          </div>
        )}
      </main>

      {/* Bottom Sticky Action Bar linking to Step 5: Results */}
      <div className="bg-white border-t border-[#E3E6EE] px-6 lg:px-8 py-3 sticky bottom-0 z-30 shadow-sm">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between">
          <Link to="rules">
            <Button variant="ghost" size="md">
              ← Back to Rule Settings
            </Button>
          </Link>
          <Link to="dry-run-results">
            <Button variant="primary" size="md">
              Next: View Dry Run Results →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
