import React from 'react';

// Domain Stack Icon from 00.9
const DomainStackIcon = ({ className = "text-[#5F6678]" }) => (
  <svg 
    width="18" 
    height="18" 
    viewBox="0 0 18 18" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M9 1.5L1.5 5.25L9 9L16.5 5.25L9 1.5Z" />
    <path d="M1.5 9L9 12.75L16.5 9" />
    <path d="M1.5 12.75L9 16.5L16.5 12.75" />
  </svg>
);

export const DOMAIN_PACKS_CATALOG = [
  {
    id: 'sap_clean_core',
    name: 'SAP Clean Core & Purchasing',
    badge: '12 rules',
    desc: 'Validates EKKO, EKPO, 0PUR_C01 line items, currency codes and delivery schedules',
    rulesCount: 12
  },
  {
    id: 'customer_360',
    name: 'Customer 360 & Identity Master',
    badge: '9 rules',
    desc: 'Deduplicates users, enforces E.164 phone formats, reconciles credit balances',
    rulesCount: 9
  },
  {
    id: 'financial_gl',
    name: 'Financial General Ledger & SOX',
    badge: '14 rules',
    desc: 'Double-entry balance reconciliation, currency integrity and audit manifests',
    rulesCount: 14
  },
  {
    id: 'policy_rag',
    name: 'Policy RAG & Legal Contracts',
    badge: '8 rules',
    desc: 'Validates legal clauses, PII sanitization, and vector index embeddings',
    rulesCount: 8
  },
  {
    id: 'healthcare_patient',
    name: 'Healthcare Patient Master',
    badge: '10 rules',
    desc: 'Standardises patient records and masks HIPAA identifiers',
    rulesCount: 10
  }
];

/**
 * DomainPackStep - Select a domain pack (Step 2 of 4)
 */
export default function DomainPackStep({ selectedPackId, onSelectPack }) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-[#5F6678] dark:text-slate-400">
        Domain ontologies compile automated quality rules.
      </p>

      <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
        {DOMAIN_PACKS_CATALOG.map(pack => {
          const isSelected = selectedPackId === pack.id;

          return (
            <div
              key={pack.id}
              onClick={() => onSelectPack(pack.id)}
              className={`p-3.5 rounded-[16px] border flex items-center justify-between cursor-pointer transition-all ${
                isSelected
                  ? 'border-2 border-[#2D55F5] bg-[#F0F4FF]/50 dark:bg-blue-950/20 shadow-xs'
                  : 'border-[#E3E6EE] dark:border-white/[0.08] bg-white dark:bg-white/[0.02] hover:border-[#2D55F5]/40'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#F5F6FA] dark:bg-white/[0.06] border border-[#CDD2DE]/50 dark:border-white/[0.08] flex items-center justify-center shrink-0">
                  <DomainStackIcon className={isSelected ? 'text-[#2D55F5]' : 'text-[#5F6678]'} />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs sm:text-sm text-[#0A0F1F] dark:text-white">
                      {pack.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#EDEFF5] dark:bg-white/[0.08] text-[#5F6678] dark:text-slate-300 border border-[#CDD2DE]/60 dark:border-white/[0.08]">
                      {pack.badge}
                    </span>
                  </div>
                  <p className="text-xs text-[#5F6678] dark:text-slate-400 mt-0.5 truncate">
                    {pack.desc}
                  </p>
                </div>
              </div>

              <div className="ml-3 shrink-0">
                {isSelected ? (
                  <span className="w-5 h-5 rounded-full border-2 border-[#2D55F5] bg-[#2D55F5] flex items-center justify-center shrink-0">
                    <span className="w-2 h-2 rounded-full bg-white" />
                  </span>
                ) : (
                  <span className="w-5 h-5 rounded-full border-2 border-[#CDD2DE] dark:border-slate-700 shrink-0 inline-block" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
