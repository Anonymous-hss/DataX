import React, { useState } from 'react';
import { 
  Database, 
  Workflow, 
  Cpu, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Zap, 
  Terminal,
  FileSpreadsheet
} from 'lucide-react';

export default function ArchitecturePipeline({ setActiveView }) {
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    {
      id: 1,
      title: "Data (SAP BW)",
      badge: "SOURCE EXTRACTION",
      color: "border-blue-500/40 text-blue-400 bg-blue-500/10",
      icon: Database,
      desc: "Simulated SAP BW Infocubes, ADSO, and BEx extract queries (tested with Excel & CSV demo data).",
      details: {
        input: "0PUR_C01 (Procurement InfoCube) / Excel Data",
        payloadType: "Tabular raw order line items, material codes, legacy plant names",
        anomaliesDetected: "Negative quantities, pricing mismatches, unmapped plant codes ('Plant-Dallas')"
      }
    },
    {
      id: 2,
      title: "Agentic Validation & Rule Engine",
      badge: "TOOL CALLING HARNESS",
      color: "border-purple-500/40 text-purple-400 bg-purple-500/10",
      icon: Cpu,
      desc: "Autonomous ReAct Agent orchestrating Knowledge Graph lookups, synthesizing rules, and quarantining violations.",
      details: {
        toolsCalled: "ontology_graph_lookup, dynamic_rule_synthesizer, business_rule_evaluator",
        reasoningLoop: "Thought → Tool Call → Observation → Reflection",
        remediation: "Plant-Dallas auto-resolved to S/4HANA code P1000 via Ontology"
      }
    },
    {
      id: 3,
      title: "SAP S/4HANA",
      badge: "TRANSACTION STAGING & ERP WRITEBACK",
      color: "border-amber-500/40 text-amber-400 bg-amber-500/10",
      icon: ShieldCheck,
      desc: "Validated records constructed into BAPI_PO_CREATE1 / OData payloads with human-in-the-loop governance gates.",
      details: {
        targetAction: "PO_CREATE / STO_CREATE",
        schemaCompliance: "100% strict ERP schema enforcement",
        confirmation: "Simulated confirmation document #4500019284 generated in 38ms"
      }
    },
    {
      id: 4,
      title: "Databricks Lakehouse",
      badge: "UNITY CATALOG GOLD LAYER",
      color: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
      icon: Layers,
      desc: "Simultaneous sync to Databricks Unity Catalog Delta Lake for enterprise analytics and downstream ML features.",
      details: {
        destination: "retaildata.default.sap_bw_modernized_gold",
        dataTypes: "Strict BIGINT, DOUBLE, TIMESTAMP with native SQL NULLs",
        compression: "Snappy Parquet with partition pruning"
      }
    }
  ];

  return (
    <section id="architecture" className="py-24 relative bg-[#070b14] border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-mono text-blue-400 mb-3">
            <Workflow className="w-3.5 h-3.5" />
            END-TO-END ENTERPRISE FLOW
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-display">
            The DataX Transformation Architecture
          </h2>
          <p className="text-base text-slate-400 mt-3">
            An uninterrupted agentic flow from legacy SAP BW extraction to dual writeback: operational S/4HANA ERP posting and analytical Databricks Delta Lake ingestion.
          </p>
        </div>

        {/* 4-Step Interactive Pipeline Flow Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isSelected = activeStep === s.id;
            return (
              <div 
                key={s.id}
                onClick={() => setActiveStep(s.id)}
                className={`p-5 rounded-2xl glass-panel border cursor-pointer transition-all relative ${
                  isSelected 
                    ? 'border-cyan-400/80 bg-slate-900/90 shadow-glow-cyan scale-[1.02]' 
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${s.color}`}>
                    STEP 0{s.id}
                  </span>
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                </div>
                <h3 className="text-sm font-bold text-white font-display mb-1">
                  {s.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {s.desc}
                </p>

                {/* Connecting arrow for desktop */}
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-20 text-slate-600">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Stage Detail Inspector */}
        {(() => {
          const current = steps.find(s => s.id === activeStep) || steps[0];
          return (
            <div className="glass-panel p-8 rounded-2xl border border-cyan-500/30 bg-[#091122]/90 animate-fadeIn shadow-2xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-slate-800/80 gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${current.color}`}>
                      {current.badge}
                    </span>
                    <h3 className="text-2xl font-bold text-white font-display">
                      Stage {current.id}: {current.title}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                    {current.desc}
                  </p>
                </div>

                <button 
                  onClick={() => setActiveView('poc')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-glow-cyan transition-all self-start lg:self-auto"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  Simulate in Live POC
                </button>
              </div>

              {/* Inspector Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                    Telemetry Input / Target
                  </span>
                  <div className="text-xs font-mono text-cyan-300 font-semibold break-all">
                    {current.details.input || current.details.toolsCalled || current.details.targetAction || current.details.destination}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                    Payload & Reasoning Contract
                  </span>
                  <div className="text-xs font-mono text-slate-200">
                    {current.details.payloadType || current.details.reasoningLoop || current.details.schemaCompliance || current.details.dataTypes}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                    Operational Outcome
                  </span>
                  <div className="text-xs font-mono text-emerald-300 font-semibold">
                    {current.details.anomaliesDetected || current.details.remediation || current.details.confirmation || current.details.compression}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      </div>
    </section>
  );
}
