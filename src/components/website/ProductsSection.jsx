import React, { useState } from 'react';
import { 
  Activity, 
  Workflow, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Layers, 
  Database, 
  Zap, 
  Sparkles,
  BarChart3,
  FileSpreadsheet,
  Cpu
} from 'lucide-react';

export default function ProductsSection({ setActiveView, onOpenDemo }) {
  const [activeTab, setActiveTab] = useState('datax');

  return (
    <section id="products" className="py-24 relative bg-[#070b14] border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-mono text-cyan-400 mb-3">
            <Layers className="w-3.5 h-3.5" />
            ENTERPRISE AI PORTFOLIO
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-display">
            Two Flagship Enterprise Platforms
          </h2>
          <p className="text-base text-slate-400 mt-3">
            Whether ensuring dataset health prior to model training or driving autonomous decision pipelines from SAP to Databricks, DataGlow delivers enterprise certainty.
          </p>

          {/* Toggle Tabs */}
          <div className="mt-8 inline-flex p-1.5 rounded-xl glass-panel border border-slate-700/80">
            <button
              onClick={() => setActiveTab('continuum')}
              className={`px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'continuum' 
                  ? 'bg-cyan-500 text-slate-950 shadow-glow-cyan font-bold' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4" />
              1. DataGlow Continuum (Data Readiness)
            </button>
            <button
              onClick={() => setActiveTab('datax')}
              className={`px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'datax' 
                  ? 'bg-blue-600 text-white shadow-glow-blue font-bold' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Workflow className="w-4 h-4" />
              2. DataX Platform (Decision Intelligence & Transformation)
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px]">Live POC</span>
            </button>
          </div>
        </div>

        {/* Tab 1: DataGlow Continuum */}
        {activeTab === 'continuum' && (
          <div className="glass-panel p-8 sm:p-10 rounded-2xl border border-cyan-500/20 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-fadeIn">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cyan-500/10 text-cyan-400 font-mono text-xs border border-cyan-500/20">
                PRODUCT 01 • CONTINUUM CORE
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white font-display">
                DataGlow Continuum: Enterprise AI Data Readiness
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                DataGlow Continuum automatically assesses, cleanses, monitors, and certifies enterprise datasets across six foundational dimensions before they reach production AI models.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                  <div className="text-cyan-400 font-semibold text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Data Quality Index (DQI)
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Automated 100-point scoring algorithm measuring completeness, validity, uniqueness, and consistency.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                  <div className="text-cyan-400 font-semibold text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Dynamic Drift Forecasting
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Predictive drift telemetry alerting engineering before statistical divergence impacts models.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                  <div className="text-cyan-400 font-semibold text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Meridian Lineage Audit
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Deterministic cryptographically-verifiable audit trail of every transformation and agent remediation.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                  <div className="text-cyan-400 font-semibold text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Autonomous Fixing Agents
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Specialized remediation agents that propose fixes with 1-click human-in-the-loop governance.</p>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-4">
                <button 
                  onClick={onOpenDemo}
                  className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-glow-cyan transition-all"
                >
                  Request Continuum Assessment
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Graphic Preview */}
            <div className="lg:col-span-5 bg-gradient-to-tr from-slate-950 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                <span className="font-mono text-cyan-400 font-bold">CONTINUUM_RADAR_V3</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">Readiness: 94.2%</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Semantic Consistency", val: "98%", status: "OPTIMAL" },
                  { label: "Schema Integrity", val: "96%", status: "OPTIMAL" },
                  { label: "Temporal Freshness", val: "91%", status: "GOOD" },
                  { label: "Entity Resolution", val: "94%", status: "OPTIMAL" },
                  { label: "Audit Verifiability", val: "100%", status: "PERFECT" },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">{item.label}</span>
                      <span className="font-mono text-cyan-300">{item.val}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: item.val }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-2 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Continuum validated 45,000 enterprise features for production deployment.</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: DataX Platform */}
        {activeTab === 'datax' && (
          <div className="glass-panel p-8 sm:p-10 rounded-2xl border border-blue-500/30 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-fadeIn">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-500/10 text-blue-400 font-mono text-xs border border-blue-500/20">
                PRODUCT 02 • DECISION INTELLIGENCE PLATFORM
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white font-display">
                DataX: Enterprise Data Transformation & Decision Engine
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                DataX automates end-to-end modernization pipelines with an <strong className="text-white">Agentic Harness & Tool Calling architecture</strong>. It transforms legacy SAP BW extracts, generates AI business rules dynamically, commits transactions to S/4HANA, and persists gold Delta Lake tables in Databricks.
              </p>

              {/* Pipeline Flow Pill Banner */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/80 font-mono text-xs text-slate-300 flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">SAP BW</span>
                <span className="text-slate-500">→</span>
                <span className="px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">Agentic Rule Engine (Tool Calling)</span>
                <span className="text-slate-500">→</span>
                <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">SAP S/4HANA</span>
                <span className="text-slate-500">→</span>
                <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">Databricks</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                  <div className="text-blue-400 font-semibold text-sm flex items-center gap-2">
                    <Cpu className="w-4 h-4" /> Agentic Tool Calling Harness
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Autonomous orchestration agent invoking ontology lookup, rule synthesis, and BAPI builders in a self-reflective ReAct loop.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                  <div className="text-blue-400 font-semibold text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Dynamic Rule Generation
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Synthesizes domain constraints (quantity sanity, calculation equality, plant code verification) from business intent.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                  <div className="text-blue-400 font-semibold text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> SAP S/4HANA BAPI Gate
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Constructs compliant PO/STO payloads with 1-click human verification and autonomous budget threshold safeguards.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
                  <div className="text-blue-400 font-semibold text-sm flex items-center gap-2">
                    <Database className="w-4 h-4" /> Databricks Unity Catalog
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Direct Lakehouse synchronization writing native SQL types (BIGINT, DOUBLE, TIMESTAMP) into Delta Lake Gold tables.</p>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-4">
                <button 
                  onClick={() => setActiveView('poc')}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center gap-2 shadow-glow-blue transition-all"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  Launch Interactive DataX POC
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Graphic Preview */}
            <div className="lg:col-span-5 bg-gradient-to-tr from-slate-950 to-[#0a1226] p-6 rounded-2xl border border-blue-500/20 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                <span className="font-mono text-blue-400 font-bold">DATAX_PIPELINE_ORCHESTRATOR</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">Active Loop</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/90 font-mono text-[11px] text-slate-300 space-y-2 border border-slate-800">
                <div className="text-cyan-400">&gt; Ingesting SAP BW extract (0PUR_C01)...</div>
                <div className="text-purple-300">&gt; [Tool Call] ontology_graph_lookup("Plant-Dallas") =&gt; P1000</div>
                <div className="text-emerald-300">&gt; [Tool Call] dynamic_rule_synthesizer() =&gt; 4 rules active</div>
                <div className="text-amber-300">&gt; [Tool Call] s4hana_payload_builder() =&gt; PO BAPI staged</div>
                <div className="text-blue-300">&gt; [Tool Call] databricks_delta_writer() =&gt; retaildata.default.orders_gold</div>
                <div className="text-emerald-400 font-semibold">&gt; Transaction complete in 38ms.</div>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 flex items-center justify-between">
                <span>Simulation with realistic Excel data</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 font-mono text-[10px]">Ready to Run</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
