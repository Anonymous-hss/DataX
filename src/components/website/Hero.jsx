import React from 'react';
import { 
  ArrowRight, 
  Sparkles, 
  Database, 
  Workflow, 
  Network, 
  ShieldCheck, 
  Cpu, 
  CheckCircle2, 
  Activity, 
  Terminal,
  Zap,
  Layers
} from 'lucide-react';

export default function Hero({ setActiveView, onOpenDemo }) {
  return (
    <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden bg-grid-pattern">
      {/* Background Radial Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-cyan-500/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 left-1/4 w-[450px] h-[450px] bg-blue-600/10 blur-[110px] pointer-events-none rounded-full" />
      <div className="absolute top-1/2 right-1/4 w-[450px] h-[450px] bg-purple-600/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Eyebrow Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full glass-panel border border-cyan-500/30 text-xs font-mono text-cyan-300 shadow-glow-cyan animate-pulse-slow">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold uppercase tracking-wider">Enterprise Semantic Fabric & Decision Intelligence</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span className="text-slate-400">Powered by DataGlow</span>
          </div>
        </div>

        {/* Main Headline */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.08] font-display">
            Make Enterprise Data <br className="hidden sm:block" />
            <span className="gradient-text">AI-Ready & Decision-Driven</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            DataGlow combines <span className="text-white font-semibold">Enterprise Ontologies</span>, <span className="text-white font-semibold">Knowledge Graphs</span>, and <span className="text-white font-semibold">Agentic Tool Calling</span> to bridge legacy ERP data silos directly into production AI and Databricks Lakehouses.
          </p>

          {/* Primary Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => setActiveView('poc')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-glow-cyan hover:scale-[1.02] active:scale-[0.98] transition-all group"
            >
              <Zap className="w-4 h-4 fill-current text-cyan-200" />
              Launch DataX Platform POC
              <ArrowRight className="w-4 h-4 text-cyan-200 group-hover:translate-x-1 transition-transform" />
            </button>

            <button 
              onClick={onOpenDemo}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl glass-panel hover:bg-slate-800/80 text-white font-semibold text-sm flex items-center justify-center gap-2 border border-slate-700/80 transition-all hover:border-slate-500"
            >
              Book Enterprise Demo
            </button>
          </div>

          {/* Metric Badges */}
          <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="glass-panel p-3.5 rounded-xl border border-slate-800">
              <div className="text-2xl font-bold font-display text-cyan-400">3.2B+</div>
              <div className="text-[11px] font-mono text-slate-400 uppercase mt-0.5">Records Assessed</div>
            </div>
            <div className="glass-panel p-3.5 rounded-xl border border-slate-800">
              <div className="text-2xl font-bold font-display text-emerald-400">94%</div>
              <div className="text-[11px] font-mono text-slate-400 uppercase mt-0.5">Readiness Uplift</div>
            </div>
            <div className="glass-panel p-3.5 rounded-xl border border-slate-800">
              <div className="text-2xl font-bold font-display text-blue-400">&lt;40ms</div>
              <div className="text-[11px] font-mono text-slate-400 uppercase mt-0.5">S/4HANA Writeback</div>
            </div>
            <div className="glass-panel p-3.5 rounded-xl border border-slate-800">
              <div className="text-2xl font-bold font-display text-purple-400">100%</div>
              <div className="text-[11px] font-mono text-slate-400 uppercase mt-0.5">Lineage Auditable</div>
            </div>
          </div>
        </div>

        {/* Interactive Dual-Product Hero Showcase Banner */}
        <div className="mt-16 max-w-5xl mx-auto">
          <div className="glass-panel p-2 sm:p-3 rounded-2xl border border-slate-700/60 shadow-2xl relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              
              {/* Product 1 Card: DataGlow Continuum */}
              <div className="p-6 rounded-xl bg-gradient-to-b from-[#0c162d] to-[#080f20] border border-cyan-500/20 relative group hover:border-cyan-500/40 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white font-display">DataGlow Continuum</h3>
                      <p className="text-xs text-cyan-400 font-mono">Enterprise Data Readiness</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                    Core Platform
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Assess, score, and remediate enterprise datasets across 6 dimensions. Automatic Data Quality Index, cross-model drift forecasting, and Meridian audit lineage.
                </p>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-slate-300 mb-5">
                  <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">✓ 6-D Quality Scoring</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">✓ AI Remediation</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">✓ Meridian Audit</span>
                </div>
                <a 
                  href="#products" 
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 group-hover:gap-2 transition-all"
                >
                  Explore Continuum Features <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Product 2 Card: DataX */}
              <div className="p-6 rounded-xl bg-gradient-to-b from-[#0b172a] to-[#070e1c] border border-blue-500/30 relative group hover:border-blue-400/50 transition-all shadow-glow-blue">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30">
                      <Workflow className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white font-display">DataX Platform</h3>
                      <p className="text-xs text-blue-400 font-mono">Decision Intelligence & Transformation</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold animate-pulse">
                    Live Demo
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Autonomous agentic data transformation pipeline: Ingests from <strong className="text-white">SAP BW</strong>, synthesizes AI business rules via <strong className="text-white">Agentic Tool Calling</strong>, stages to <strong className="text-white">SAP S/4HANA</strong>, and writes to <strong className="text-white">Databricks</strong>.
                </p>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-slate-300 mb-5">
                  <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">✓ SAP BW Extractor</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">✓ Agentic Tool Calling</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">✓ S/4HANA & Databricks</span>
                </div>
                <button 
                  onClick={() => setActiveView('poc')}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 group-hover:gap-2 transition-all"
                >
                  Launch Interactive DataX POC <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
