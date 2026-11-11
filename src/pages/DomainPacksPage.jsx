import React, { useState } from 'react';
import DataXAppShell from '../components/common/DataXAppShell';
import { useNavigation } from '../context/NavigationContext';
import { useRuleEngine } from '../context/RuleEngineContext';
import {
  Search,
  Check,
  ArrowRight
} from 'lucide-react';
import iconSource from '../assets/icons/source.png';
import iconPack from '../assets/icons/pack.png';
import iconTarget from '../assets/icons/target.png';
import iconLive from '../assets/icons/live.png';
import iconSandbox from '../assets/icons/sandbox.png';

// 10 Prioritized Enterprise Domain Templates matching 05.4
const DOMAIN_PACK_CATALOG = [
  {
    id: 'sap_bw_s4hana',
    packKey: 'sap_bw_s4hana',
    name: 'SAP BW → S/4HANA Clean Core Modernizer',
    category: 'ERP modernization',
    tier: 'Tier 1',
    tierLevel: 1,
    badge: 'SAP certified clean core',
    desc: 'Extract InfoCube purchasing lines, resolve legacy plant codes via ontology, split high-value POs for review and commit verified orders via BAPI.',
    pipeline: 'SAP BW InfoCube → Clean core ontologies → S/4HANA BAPI',
    icon: iconSource,
    nodeCount: 7,
    rulesCount: 5,
    rules: [
      'Positive line quantity (> 0)',
      'Calculation equality (QTY × PRICE = TOTAL)',
      'Mandatory vendor code',
      'Authorized S/4HANA plant ontology lookup',
      'Sequential line item check'
    ]
  },
  {
    id: 'financial_gl_ledger',
    packKey: 'financial_gl_ledger',
    name: 'Financial General Ledger & SOX 404 Audit',
    category: 'Finance & compliance',
    tier: 'Tier 1',
    tierLevel: 1,
    badge: 'SOX 404 & GAAP',
    desc: 'Audit journal entries across legacy systems, guarantee zero imbalance and gate entries over $100K for CFO sign-off.',
    pipeline: 'ERP GL → SOX engine → BigQuery gold vault',
    icon: iconPack,
    nodeCount: 7,
    rulesCount: 4,
    rules: [
      'Debits equal credits',
      'Valid ISO-4217 currency',
      'GL code registry check',
      'Active open fiscal period guard'
    ]
  },
  {
    id: 'customer_master_reconciliation',
    packKey: 'customer_master_reconciliation',
    name: 'Customer 360 & Entity Resolution Harmonizer',
    category: 'Customer 360',
    tier: 'Tier 2',
    tierLevel: 2,
    badge: 'MongoDB → vector dedupe',
    desc: 'Resolve duplicate company names with vector embeddings, enforce RFC-5322 syntax and write golden customer records.',
    pipeline: 'MongoDB Atlas → Vector dedupe → PostgreSQL gold',
    icon: iconPack,
    nodeCount: 6,
    rulesCount: 4,
    rules: [
      'RFC-5322 email syntax',
      'Full name & capitalization',
      'Non-negative balance',
      'Vector similarity entity resolution (≥ 85%)'
    ]
  },
  {
    id: 'enterprise_rag_knowledge',
    packKey: 'enterprise_rag_knowledge',
    name: 'Enterprise Policy RAG & Legal Contracts',
    category: 'Enterprise AI & RAG',
    tier: 'Tier 2',
    tierLevel: 2,
    badge: 'AWS S3 → Pinecone',
    desc: 'Ingest contracts, retrieve compliance context via RAG, score clause risk, route critical clauses to counsel and persist embeddings.',
    pipeline: 'AWS S3 → RAG enricher → Vector matcher → Pinecone',
    icon: iconSandbox,
    nodeCount: 8,
    rulesCount: 4,
    rules: [
      'Expiration date in future',
      'Indemnity risk ≤ 80',
      'Governing jurisdiction',
      'Mandatory authorized signatory title'
    ]
  },
  {
    id: 'salesforce_crm_bigquery',
    packKey: 'salesforce_crm_bigquery',
    name: 'Salesforce CRM → BigQuery Revenue Pipeline',
    category: 'RevOps & sales',
    tier: 'Tier 3',
    tierLevel: 3,
    badge: 'Salesforce → BigQuery',
    desc: 'Cleanse lead emails and domains, route deals over $250K to the RevOps director and stream golden pipeline records.',
    pipeline: 'Salesforce CRM → RevOps validator → BigQuery',
    icon: iconSource,
    nodeCount: 7,
    rulesCount: 4,
    rules: [
      'Business email domain',
      'Positive deal value',
      'Valid sales stage sequence',
      'Lead quality score normalization'
    ]
  },
  {
    id: 'support_telemetry_vector',
    packKey: 'support_telemetry_vector',
    name: 'SRE Telemetry & Vector Incident Copilot',
    category: 'DevOps & telemetry',
    tier: 'Tier 3',
    tierLevel: 3,
    badge: 'Azure Blob → Pinecone',
    desc: 'Sanitize client IPs and credentials in logs, embed errors and index incident clusters for a support copilot.',
    pipeline: 'Azure Blob → PII anonymizer → Vector matcher → Pinecone',
    icon: iconLive,
    nodeCount: 6,
    rulesCount: 4,
    rules: [
      'Client IP obfuscation (GDPR)',
      'Standard log level',
      'Incident cluster match ≥ 80%',
      'Server latency outlier threshold'
    ]
  },
  {
    id: 'snowflake_s4hana_procurement',
    packKey: 'snowflake_s4hana_procurement',
    name: 'Snowflake Spend → S/4HANA Vendor Purchasing',
    category: 'Procurement & ERP',
    tier: 'Tier 3',
    tierLevel: 3,
    badge: 'Snowflake → S/4HANA',
    desc: 'Extract spend transactions from Snowflake, match vendor aliases with semantic vector matcher and generate clean purchase requisitions.',
    pipeline: 'Snowflake Cloud → Semantic Vendor Resolver → S/4HANA Purchasing',
    icon: iconSource,
    nodeCount: 7,
    rulesCount: 4,
    rules: [
      'Positive requisition value',
      'Active vendor master mapping',
      'Currency cross-rate tolerance',
      'Purchase org alignment'
    ]
  },
  {
    id: 'supply_chain_inventory',
    packKey: 'supply_chain_inventory',
    name: 'Supply Chain Multi-Echelon Inventory Balancer',
    category: 'Supply chain',
    tier: 'Tier 4',
    tierLevel: 4,
    badge: 'WMS → S/4HANA Inventory',
    desc: 'Reconcile logistics warehouse counts with distribution center purchase orders, resolve SKU discrepancies and balance stock levels.',
    pipeline: 'AWS S3 WMS → SKU Harmonizer → S/4HANA Inventory',
    icon: iconSource,
    nodeCount: 7,
    rulesCount: 4,
    rules: [
      'GS1 Compliant UPC/EAN Barcode',
      'Stock on hand non-negative',
      'Safety stock reorder point alert',
      'Warehouse bin location format'
    ]
  },
  {
    id: 'healthcare_hipaa_clinical',
    packKey: 'healthcare_hipaa_clinical',
    name: 'Healthcare Patient Master & HIPAA Sanitizer',
    category: 'Healthcare',
    tier: 'Tier 4',
    tierLevel: 4,
    badge: 'HL7 → BigQuery HIPAA Vault',
    desc: 'Ingest clinical encounters and patient records, strip all 18 HIPAA Safe Harbor identifiers and validate provider identifiers.',
    pipeline: 'EHR Clinical DB → Safe Harbor Sanitizer → BigQuery HIPAA Vault',
    icon: iconSandbox,
    nodeCount: 7,
    rulesCount: 5,
    rules: [
      'HIPAA Safe Harbor de-identification',
      'Medical Record Number (MRN) validity',
      'Date of birth plausibility guard',
      '10-Digit CMS NPI provider check',
      'HL7 standard administrative sex value'
    ]
  },
  {
    id: 'multicloud_parquet_lakehouse',
    packKey: 'multicloud_parquet_lakehouse',
    name: 'Multi-Cloud Parquet Stream & Schema Drift Guard',
    category: 'Data lakehouse',
    tier: 'Tier 5',
    tierLevel: 5,
    badge: 'Azure Blob → BigQuery & Databricks',
    desc: 'Stream high-throughput Parquet files, detect real-time column evolution and schema drift, and mirror clean micro-batches simultaneously.',
    pipeline: 'Azure Blob Parquet → Schema Drift Guard → BigQuery & Databricks',
    icon: iconTarget,
    nodeCount: 5,
    rulesCount: 4,
    rules: [
      'Schema drift column count guard',
      'Partition date plausibility check',
      'Payload MD5 checksum integrity',
      'Primary key null rate zero tolerance'
    ]
  }
];

export default function DomainPacksPage({ onSwitchToMarketing } = {}) {
  const { navigateTo } = useNavigation();
  const { selectThread } = useRuleEngine();
  const [selectedTier, setSelectedTier] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');

  const priorityTiers = [
    { label: 'All tiers', value: 'All' },
    { label: 'Tier 1 · Mission-critical', value: 1 },
    { label: 'Tier 2 · AI & identity', value: 2 },
    { label: 'Tier 3 · Cloud & RevOps', value: 3 },
    { label: 'Tier 4 · Industry', value: 4 },
    { label: 'Tier 5 · Multi-cloud', value: 5 }
  ];

  const domainCategories = [
    { label: 'All', value: 'All' },
    { label: 'ERP modernization', value: 'ERP modernization' },
    { label: 'Finance & compliance', value: 'Finance & compliance' },
    { label: 'Customer 360', value: 'Customer 360' },
    { label: 'Enterprise AI & RAG', value: 'Enterprise AI & RAG' },
    { label: 'RevOps & sales', value: 'RevOps & sales' },
    { label: 'DevOps & telemetry', value: 'DevOps & telemetry' },
    { label: 'Procurement & ERP', value: 'Procurement & ERP' },
    { label: 'Supply chain', value: 'Supply chain' },
    { label: 'Healthcare', value: 'Healthcare' },
    { label: 'Data lakehouse', value: 'Data lakehouse' }
  ];

  const filteredPacks = DOMAIN_PACK_CATALOG.filter(pack => {
    if (selectedTier !== 'All' && pack.tierLevel !== selectedTier) return false;
    if (selectedCategory !== 'All' && pack.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        pack.name.toLowerCase().includes(q) ||
        pack.desc.toLowerCase().includes(q) ||
        pack.category.toLowerCase().includes(q) ||
        pack.pipeline.toLowerCase().includes(q) ||
        pack.tier.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleDeployPack = (pack) => {
    if (pack.packKey) {
      selectThread(pack.packKey);
    }
    window.location.hash = '#canvas';
  };

  return (
    <DataXAppShell onSwitchToMarketing={onSwitchToMarketing}>
      <main className="max-w-[1360px] mx-auto px-6 py-6 space-y-6 font-sans">
        {/* Top Header Row matching 05.4 */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Domain templates
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              10 production pipelines across ERP, SOX 404, GenAI RAG, vector search, warehouses and lakehouses. Load one onto the canvas in a click.
            </p>
          </div>

          {/* Search Box on the Right */}
          <div className="relative w-full sm:w-80 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by domain, tier, connector..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs transition-all"
            />
          </div>
        </div>

        {/* Filter Rows matching 05.4 */}
        <div className="space-y-2.5 pt-1">
          {/* Row 1 - Priority */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-xs font-medium text-slate-500 shrink-0 mr-1">Priority</span>
            {priorityTiers.map((t) => (
              <button
                key={t.label}
                onClick={() => setSelectedTier(t.value)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedTier === t.value
                    ? 'border border-blue-200 bg-blue-50 text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Row 2 - Domain */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-xs font-medium text-slate-500 shrink-0 mr-1">Domain</span>
            {domainCategories.map((cat) => (
              <button
                key={cat.label}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.value
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3-Column Template Cards Grid matching 05.4 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPacks.map((pack) => (
            <div
              key={pack.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between hover:shadow-md transition-all space-y-4"
            >
              <div className="space-y-3.5">
                {/* Top Row: Icon + Category + Title */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    <img src={pack.icon} alt={pack.name} className="w-6 h-6 object-contain" />
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-slate-500 block">
                      {pack.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {pack.name}
                    </h3>
                  </div>
                </div>

                {/* Badges Row: Tier + Sub-badge + Nodes */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold text-blue-700 bg-blue-50/60 border border-blue-200">
                    {pack.tier}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium text-slate-600 bg-slate-100 border border-slate-200/60">
                    {pack.badge}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium text-slate-600 bg-slate-100 border border-slate-200/60">
                    {pack.nodeCount} nodes
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed">
                  {pack.desc}
                </p>

                {/* Pipeline Flow Box */}
                <div className="bg-slate-50 rounded-xl border border-slate-100 p-2.5 font-mono text-[11px] text-slate-700 truncate">
                  {pack.pipeline}
                </div>

                {/* Pre-configured rules section */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Pre-configured rules</span>
                    <span className="font-semibold text-blue-600 font-mono">{pack.rulesCount} rules</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    {pack.rules.slice(0, 3).map((rule, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{rule}</span>
                      </div>
                    ))}
                    {pack.rules.length > 3 && (
                      <p className="text-[11px] text-slate-400 font-medium pl-5">
                        + {pack.rules.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer: Status Badge + Load Template Button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Production ready
                </span>

                <button
                  onClick={() => handleDeployPack(pack)}
                  className="px-4 py-2 rounded-xl bg-[#2D55F5] hover:bg-[#2045DC] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <span>Load template</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note matching 05.4 */}
        <p className="text-xs text-slate-400 text-center pt-4">
          Showing {filteredPacks.length} of 10 · Procurement, Supply chain, Healthcare and Lakehouse templates continue below.
        </p>
      </main>
    </DataXAppShell>
  );
}
