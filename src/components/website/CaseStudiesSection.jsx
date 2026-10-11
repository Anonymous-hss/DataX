import React from 'react';
import { ShieldCheck, TrendingUp, Clock, CheckCircle2, Building2 } from 'lucide-react';

export default function CaseStudiesSection() {
  const cases = [
    {
      company: "Global Fortune 50 Industrial Conglomerate",
      industry: "Manufacturing & Supply Chain",
      challenge: "Legacy SAP BW procurement infocubes contained 400M+ unmapped rows with fragmented legacy plant abbreviations. Manual rule validation blocked S/4HANA migration.",
      solution: "Deployed DataX Agentic Harness. The Knowledge Graph automatically resolved 99.2% of legacy locations to S/4HANA plant codes and generated 38 business integrity rules.",
      metrics: [
        { label: "Migration Time Saved", value: "7 Months" },
        { label: "Rule Accuracy", value: "99.8%" },
        { label: "Transactions Streamed", value: "1.2M / day" }
      ]
    },
    {
      company: "Top 5 Tier-1 Automotive OEM",
      industry: "Automotive & Discrete Manufacturing",
      challenge: "Critical part stock levels between SAP ECC and Databricks analytical lakehouses drifted constantly, causing stockouts and incorrect automated replenishment.",
      solution: "Integrated DataGlow Continuum with DataX dual-dispatch. Automated Data Quality Indexing verified inventory calculations before triggering S/4HANA writebacks.",
      metrics: [
        { label: "DQI Improvement", value: "+38 pts" },
        { label: "Stockout Reduction", value: "84%" },
        { label: "Writeback Latency", value: "42ms" }
      ]
    }
  ];

  return (
    <section id="case-studies" className="py-24 relative bg-[#060a12] border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400 mb-3">
            <TrendingUp className="w-3.5 h-3.5" />
            PROVEN ENTERPRISE IMPACT
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-display">
            Trusted by Enterprise Leaders
          </h2>
          <p className="text-base text-slate-400 mt-3">
            How Global 2000 enterprises modernize their SAP data architectures and bridge to Databricks Lakehouse with zero downtime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {cases.map((c, idx) => (
            <div 
              key={idx}
              className="glass-panel p-8 rounded-2xl border border-slate-800 bg-gradient-to-b from-[#0c1527] to-[#070c17] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2.5 mb-4 text-xs font-mono text-cyan-400 font-semibold">
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  <span>{c.industry}</span>
                </div>
                <h3 className="text-xl font-bold text-white font-display mb-3">
                  {c.company}
                </h3>
                
                <div className="space-y-3 mb-6 text-xs text-slate-300 leading-relaxed">
                  <p><strong className="text-rose-400 font-mono">CHALLENGE:</strong> {c.challenge}</p>
                  <p><strong className="text-emerald-400 font-mono">SOLUTION:</strong> {c.solution}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-800/80 text-center">
                {c.metrics.map((m, mIdx) => (
                  <div key={mIdx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="text-lg font-bold font-display text-emerald-400">{m.value}</div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase mt-0.5">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
