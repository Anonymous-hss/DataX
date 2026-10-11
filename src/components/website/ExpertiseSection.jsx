import React from 'react';
import { 
  Network, 
  Cpu, 
  Layers, 
  Database, 
  Sparkles, 
  Workflow, 
  ShieldCheck, 
  CheckCircle2, 
  Search,
  Code2,
  Terminal,
  Share2
} from 'lucide-react';

export default function ExpertiseSection() {
  const expertiseItems = [
    {
      icon: Network,
      title: "Enterprise Ontologies & Knowledge Graphs",
      subtitle: "SEMANTIC DATA FABRIC",
      color: "from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-400",
      description: "We model complex enterprise domains into high-dimensional ontologies and knowledge graphs. Eliminates semantic ambiguity across disparate ERP systems, translating legacy terminology (e.g. 'Plant-Dallas' → S/4HANA 'P1000') with deterministic entity resolution.",
      features: [
        "Multi-source ontology harmonization",
        "Semantic Entity Linking & Concept Resolution",
        "GraphRAG: Graph-augmented retrieval for AI agents",
        "Automated taxonomies for supply chain & finance"
      ]
    },
    {
      icon: Cpu,
      title: "Agentic Harness & Tool-Calling Architecture",
      subtitle: "AUTONOMOUS GOAL-ORIENTED REASONING",
      color: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400",
      description: "Rather than brittle procedural rule engines, DataGlow leverages an Agentic Harness with dynamic tool calling. Our autonomous data agents plan, reason through ReAct loops, invoke specialized tools, and self-reflect before committing high-stakes ERP transactions.",
      features: [
        "ReAct: Reasoning + Action execution loops",
        "Standardized Tool Calling (Ontology, Validator, ERP BAPI)",
        "Self-correcting validation & quarantine routing",
        "Structured execution telemetry & audit traces"
      ]
    },
    {
      icon: Layers,
      title: "SAP BW to Databricks Modernization",
      subtitle: "ENTERPRISE TRANSFORMATION PIPELINE",
      color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400",
      description: "Turn stagnant SAP BW InfoCubes and legacy ECC tables into live, modern enterprise data assets. Simultaneously validate data for transactional writeback into S/4HANA while publishing curated Delta Lake tables in Databricks Unity Catalog.",
      features: [
        "Seamless SAP BW extraction mapping",
        "Dual-target dispatch: S/4HANA OLTP + Databricks OLAP",
        "Schema preservation: Native SQL types & clean NULL handling",
        "Sub-50ms transaction latency with budget safeguards"
      ]
    }
  ];

  return (
    <section id="expertise" className="py-24 relative bg-[#060a12] border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-mono text-purple-400 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            CORE TECHNICAL FOUNDATION
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-display">
            Built on Semantics, Graphs & Autonomous Agents
          </h2>
          <p className="text-base text-slate-400 mt-3">
            Enterprise AI cannot rely on probabilistic guesswork. DataGlow fuses formal ontological structures with agile agentic reasoning to deliver mathematical trust and transactional precision.
          </p>
        </div>

        {/* 3 Major Pillars */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {expertiseItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx}
                className="glass-panel p-8 rounded-2xl border bg-gradient-to-b from-[#0c1426] to-[#070c17] relative flex flex-col justify-between hover:border-slate-600 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${item.color} border`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="font-mono text-[11px] text-slate-500 tracking-wider">
                      0{idx + 1}
                    </span>
                  </div>

                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 block mb-1">
                    {item.subtitle}
                  </span>
                  <h3 className="text-xl font-bold text-white font-display mb-3 group-hover:text-cyan-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-6">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80">
                  <h4 className="text-[11px] font-mono uppercase text-slate-400 font-semibold mb-3">
                    Key Capabilities:
                  </h4>
                  <ul className="space-y-2">
                    {item.features.map((feat, fIdx) => (
                      <li key={fIdx} className="text-xs text-slate-300 flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Visual Graph & Agentic Loop Showcase Card */}
        <div className="mt-16 glass-panel p-8 rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0a1224] via-[#070d1a] to-[#0a1224]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-6 space-y-4">
              <span className="px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-400 font-mono text-xs border border-cyan-500/20">
                THE DATAGLOW DIFFERENCE
              </span>
              <h3 className="text-2xl font-bold text-white font-display">
                Why Ontologies + Agentic Tool Calling Beat Traditional Rule Engines
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Traditional rule engines require thousands of hardcoded scripts that break whenever schemas drift. With DataGlow:
              </p>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <strong>Knowledge Graphs</strong> provide persistent, self-describing business domain context.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <strong>Autonomous Agents</strong> dynamically generate validation rules from natural language specifications.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <strong>Tool Calling</strong> guarantees strict, deterministic outputs (like valid SAP BAPI JSON payloads).
                </li>
              </ul>
            </div>

            <div className="lg:col-span-6 bg-[#04070e] p-6 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-3">
              <div className="text-slate-500 text-[10px] uppercase tracking-wider pb-2 border-b border-slate-800 flex justify-between">
                <span>ONTOLOGY_TOOL_HARNESS.PY</span>
                <span className="text-cyan-400">AGENT_ACTIVE</span>
              </div>
              <div className="text-slate-400">
                <span className="text-purple-400">class</span> <span className="text-blue-400">EnterpriseAgentHarness</span>:
              </div>
              <div className="pl-4 text-slate-400">
                <span className="text-purple-400">def</span> <span className="text-cyan-400">orchestrate</span>(self, sap_bw_extract):
              </div>
              <div className="pl-8 text-slate-300">
                plants = self.<span className="text-yellow-400">call_tool</span>(<span className="text-emerald-300">"ontology_graph_lookup"</span>, sap_bw_extract.locations)
              </div>
              <div className="pl-8 text-slate-300">
                rules = self.<span className="text-yellow-400">call_tool</span>(<span className="text-emerald-300">"dynamic_rule_synthesizer"</span>, intent=<span className="text-emerald-300">"PO_Sanity"</span>)
              </div>
              <div className="pl-8 text-slate-300">
                validated = self.<span className="text-yellow-400">call_tool</span>(<span className="text-emerald-300">"business_rule_evaluator"</span>, rows, rules)
              </div>
              <div className="pl-8 text-emerald-400 font-semibold">
                return self.dual_dispatch(s4hana=validated, databricks=validated)
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
