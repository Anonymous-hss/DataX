import React from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

// Use Case 1: Cylinder with Lime Green Rim
const ErpMigrationIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <ellipse cx="12" cy="6" rx="8" ry="3" fill="#D4FF3A" stroke="#0A0F1F" strokeWidth="1.5" />
    <path d="M4 6v5c0 1.66 3.58 3 8 3s8-1.34 8-3V6" stroke="#0A0F1F" strokeWidth="1.5" fill="none" />
    <path d="M4 11v5c0 1.66 3.58 3 8 3s8-1.34 8-3v-5" stroke="#0A0F1F" strokeWidth="1.5" fill="none" />
    <circle cx="8" cy="11" r="1.2" fill="#127A52" />
    <circle cx="12" cy="11" r="1.2" fill="#127A52" />
    <circle cx="16" cy="11" r="1.2" fill="#127A52" />
  </svg>
);

// Use Case 2: AI Agent & Privacy Robot Icon
const AiAgentIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="5" y="7" width="14" height="12" rx="4" fill="#EEF2FF" stroke="#0A0F1F" strokeWidth="1.5" />
    <circle cx="9.5" cy="12" r="1.5" fill="#2D55F5" />
    <circle cx="14.5" cy="12" r="1.5" fill="#2D55F5" />
    <path d="M9 15.5h6" stroke="#0A0F1F" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 3v4" stroke="#0A0F1F" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="3" r="1.5" fill="#D4FF3A" stroke="#0A0F1F" strokeWidth="1.2" />
  </svg>
);

// Use Case 3: ML Training Beaker Icon
const MlGateIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M9 3h6M10 3v5l-5 9.5A2 2 0 006.75 21h10.5a2 2 0 001.75-3.5L14 8V3" stroke="#0A0F1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 16h10" stroke="#2D55F5" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="13" r="1.5" fill="#D4FF3A" />
    <circle cx="9.5" cy="18" r="1" fill="#2D55F5" />
    <circle cx="14" cy="18" r="1" fill="#2D55F5" />
  </svg>
);

/**
 * UseCasesSection - "Start from a use case" 3-column cards matching 01.1
 */
export default function UseCasesSection({
  onOpenCanvas,
  onOpenFirewall,
  onOpenMlGate,
  onOpenAdvisor
}) {
  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#0A0F1F] dark:text-white tracking-tight">
            Start from a use case
          </h2>
          <p className="text-xs text-[#5F6678] dark:text-slate-400 mt-0.5">
            Three ways teams use DataX. Each opens the matching studio.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAdvisor}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#5F6678] hover:text-[#2D55F5] dark:text-slate-400 dark:hover:text-blue-400 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span>Not sure? Ask the advisor</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3 Use Case Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Database & ERP Migrations */}
        <div 
          onClick={onOpenCanvas}
          className="bg-white dark:bg-[#18181C] rounded-[20px] border border-[#E3E6EE] dark:border-white/[0.08] p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-[#2D55F5]/30 transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#F5F6FA] dark:bg-white/[0.04] border border-[#E3E6EE] dark:border-white/[0.08] flex items-center justify-center shrink-0 mb-4">
              <ErpMigrationIcon />
            </div>

            <h3 className="font-bold text-sm sm:text-base text-[#0A0F1F] dark:text-white group-hover:text-[#2D55F5] transition-colors tracking-tight">
              Database & ERP migrations
            </h3>

            <p className="text-xs text-[#5F6678] dark:text-slate-400 leading-relaxed mt-2">
              Stop corrupted syncs across SAP BW, S/4HANA, Postgres, MongoDB and Snowflake. Rules run as deterministic checks and failing rows go to quarantine.
            </p>
          </div>

          <div className="pt-4 mt-5 border-t border-[#E3E6EE]/70 dark:border-white/[0.06] flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#EAFBEB] dark:bg-emerald-950/30 text-[#127A52] dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-[#127A52] dark:bg-emerald-400" />
              <span>99.01% clean core parity</span>
            </span>

            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2D55F5] group-hover:translate-x-0.5 transition-transform shrink-0">
              <span>Open canvas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Card 2: AI Agent & Privacy Firewall */}
        <div 
          onClick={onOpenFirewall}
          className="bg-white dark:bg-[#18181C] rounded-[20px] border border-[#E3E6EE] dark:border-white/[0.08] p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-[#2D55F5]/30 transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#F5F6FA] dark:bg-white/[0.04] border border-[#E3E6EE] dark:border-white/[0.08] flex items-center justify-center shrink-0 mb-4">
              <AiAgentIcon />
            </div>

            <h3 className="font-bold text-sm sm:text-base text-[#0A0F1F] dark:text-white group-hover:text-[#2D55F5] transition-colors tracking-tight">
              AI agent & privacy firewall
            </h3>

            <p className="text-xs text-[#5F6678] dark:text-slate-400 leading-relaxed mt-2">
              Block prompt injections and tokenize SSNs, cards and secrets before they reach OpenAI, Claude or a vector index.
            </p>
          </div>

          <div className="pt-4 mt-5 border-t border-[#E3E6EE]/70 dark:border-white/[0.06] flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#EAFBEB] dark:bg-emerald-950/30 text-[#127A52] dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-[#127A52] dark:bg-emerald-400" />
              <span>Zero-egress · BYOK live mode</span>
            </span>

            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2D55F5] group-hover:translate-x-0.5 transition-transform shrink-0">
              <span>Open firewall</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Card 3: ML Training & Drift Gate */}
        <div 
          onClick={onOpenMlGate}
          className="bg-white dark:bg-[#18181C] rounded-[20px] border border-[#E3E6EE] dark:border-white/[0.08] p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-[#2D55F5]/30 transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#F5F6FA] dark:bg-white/[0.04] border border-[#E3E6EE] dark:border-white/[0.08] flex items-center justify-center shrink-0 mb-4">
              <MlGateIcon />
            </div>

            <h3 className="font-bold text-sm sm:text-base text-[#0A0F1F] dark:text-white group-hover:text-[#2D55F5] transition-colors tracking-tight">
              ML training & drift gate
            </h3>

            <p className="text-xs text-[#5F6678] dark:text-slate-400 leading-relaxed mt-2">
              Check training data for drift (10-bin PSI) and target leakage before a GPU run, then sign a release card.
            </p>
          </div>

          <div className="pt-4 mt-5 border-t border-[#E3E6EE]/70 dark:border-white/[0.06] flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#EAFBEB] dark:bg-emerald-950/30 text-[#127A52] dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-[#127A52] dark:bg-emerald-400" />
              <span>SHA-256 dataset certificate</span>
            </span>

            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2D55F5] group-hover:translate-x-0.5 transition-transform shrink-0">
              <span>Open ML gate</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

