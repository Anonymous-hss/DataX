import React, { useState } from 'react';
import { Link, useNavigation } from '../context/NavigationContext';
import { useRuleEngine, PREBUILT_DOMAIN_PACKS } from '../context/RuleEngineContext';
import DataXUserMenu from '../components/common/DataXUserMenu';
import { DataXLogo } from './ThreadsPage';

// Domain Category Icons
const SapIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2D55F5" strokeWidth="1.75">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);

const UserIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2D55F5" strokeWidth="1.75">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const FinanceIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2D55F5" strokeWidth="1.75">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const HealthIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2D55F5" strokeWidth="1.75">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

const SupplyIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2D55F5" strokeWidth="1.75">
    <rect x="1" y="3" width="15" height="13" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const CustomIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2D55F5" strokeWidth="1.75">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const DOMAIN_PACK_CATALOG = [
  {
    id: 'sap_bw_s4hana',
    packKey: 'sap_bw_s4hana',
    name: 'SAP BW → S/4HANA Clean Core Modernizer',
    category: 'ERP Modernization',
    badge: 'SAP Certified Ontology',
    desc: 'Extract InfoCube purchasing lines, resolve legacy plant codes with enterprise ontology knowledge graph, enforce budget bounds, and stage BAPI_PO_CREATE1 orders with Gold Lakehouse replication.',
    pipeline: 'SAP BW / HANA Cloud → Intelligence Engine → S/4HANA Core',
    icon: <SapIcon />,
    rulesCount: 6,
    rules: [
      'Positive Line Quantity (> 0)',
      'Calculation Equality (QTY * PRICE == TOTAL)',
      'Mandatory Vendor Code Verification',
      'Authorized S/4HANA Plant Ontology Lookup',
      'Sequential Line Item Check',
      'ISO Currency Standard Compliance'
    ],
    features: ['Ontology Graph Mappings', 'Automated BAPI Writeback', 'Drift Guard']
  },
  {
    id: 'customer_master_reconciliation',
    packKey: 'customer_master_reconciliation',
    name: 'Customer Master & Identity Harmonizer',
    category: 'Customer 360',
    badge: 'MongoDB ➔ Neon DB',
    desc: 'Harmonize raw customer and user documents from MongoDB Atlas into PostgreSQL Neon DB, enforce RFC-5322 email syntax and non-negative balances, and replicate clean gold records.',
    pipeline: 'MongoDB Atlas → Intelligence Engine → PostgreSQL Neon DB',
    icon: <UserIcon />,
    rulesCount: 5,
    rules: [
      'RFC-5322 Email Syntax Validation',
      'Required Full Name & Capitalization',
      'Non-Negative Account Balance Guard',
      'ISO-3166 Country Code Normalization',
      'Deduplication Hash Enforcement'
    ],
    features: ['Cross-DB Entity Resolution', 'Synthetic Identity Detection', 'Neon Replica']
  },
  {
    id: 'financial_gl_ledger',
    packKey: 'financial_gl_ledger',
    name: 'Financial General Ledger & AP Compliance',
    category: 'Finance & Audit',
    badge: 'SOX & GAAP Compliant',
    desc: 'Audit general ledger and AP entries across disparate legacy systems, guarantee zero imbalance, verify ISO currency standards, and dual-dispatch approved entries to Financial ERP and audit warehouse.',
    pipeline: 'ERP GL → Intelligence Engine → Reconciled Core',
    icon: <FinanceIcon />,
    rulesCount: 4,
    rules: [
      'Debits Equal Credits (Zero Imbalance)',
      'Valid ISO-4217 Currency Standard',
      'General Ledger Code Registry Check',
      'Active Open Fiscal Period Guard'
    ],
    features: ['Audit Trail Immutable Logs', 'SOX 404 Guardrails', 'Multi-Currency Reval']
  },
  {
    id: 'healthcare_hipaa',
    packKey: 'healthcare_hipaa',
    name: 'Healthcare Patient Master & HIPAA Sanitizer',
    category: 'Healthcare & Life Sciences',
    badge: 'HIPAA & HL7 Compliant',
    desc: 'Ingest HL7 and EHR patient records, scrub PII anomalies, cross-verify National Provider Identifiers (NPI), and stage HIPAA-compliant clinical data to analytics warehouse.',
    pipeline: 'HL7 & EHR Records → Intelligence Engine → HIPAA Vault',
    icon: <HealthIcon />,
    rulesCount: 4,
    rules: [
      'Medical Record Number (MRN) Validity',
      'Date of Birth Consistency Guard',
      'HL7 Standard Gender Code Compliance',
      'Safe Harbor PII Masking & Redaction'
    ],
    features: ['Automated De-Identification', 'NPI National Registry Check', 'HIPAA Audit Trail']
  },
  {
    id: 'supply_chain',
    packKey: 'sap_bw_s4hana', // fallback
    name: 'Supply Chain Multi-Echelon Inventory Balancer',
    category: 'Supply Chain & Logistics',
    badge: 'Multi-Echelon Balancer',
    desc: 'Reconcile logistics warehouse counts with distribution center purchase orders, resolve SKU naming discrepancies, and feed real-time supply chain telemetry.',
    pipeline: 'Warehouse WMS → Intelligence Engine → ERP Inventory',
    icon: <SupplyIcon />,
    rulesCount: 4,
    rules: [
      'SKU Naming & Barcode Harmonization',
      'Safety Stock Minimum Threshold',
      'Unit of Measure Alignment',
      'Supplier Lead Time Anomaly Detection'
    ],
    features: ['Real-time Telemetry Sync', 'Inventory Drift Alerting', 'ERP Stock Leveling']
  },
  {
    id: 'custom_builder',
    packKey: null,
    name: 'Blank Canvas Domain Pack',
    category: 'Custom Architecture',
    badge: 'Custom Schema',
    desc: 'Start from scratch with an empty canvas to connect bespoke database endpoints, configure custom LLM transformation rules, and define tailored target schema mappings.',
    pipeline: 'Custom Source → User Rules Engine → Custom Target',
    icon: <CustomIcon />,
    rulesCount: 0,
    rules: [
      'Configure Custom Source Connector',
      'Define Custom Field Constraints',
      'Auto-generate Rules via AI LLM',
      'Deploy to Custom Warehouse Destination'
    ],
    features: ['Custom SQL & Regex Rules', 'Any JDBC / ODBC Connector', 'Automated Profiling']
  }
];

export default function DomainPacksPage() {
  const { navigateTo } = useNavigation();
  const { selectThread } = useRuleEngine();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');

  const categories = ['All', 'ERP Modernization', 'Customer 360', 'Finance & Audit', 'Healthcare & Life Sciences', 'Supply Chain & Logistics'];

  const filteredPacks = DOMAIN_PACK_CATALOG.filter(pack => {
    if (selectedCategory !== 'All' && pack.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        pack.name.toLowerCase().includes(q) ||
        pack.desc.toLowerCase().includes(q) ||
        pack.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleDeployPack = (pack) => {
    if (pack.id === 'custom_builder') {
      navigateTo('canvas');
      return;
    }
    if (pack.packKey) {
      selectThread(pack.packKey);
    }
    navigateTo('canvas');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#474E61] font-sans antialiased flex flex-col">
      {/* Universal Top Navbar */}
      <header className="w-full bg-white border-b border-[#E3E6EE] sticky top-0 z-40">
        <div className="max-w-[1360px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-7">
            {/* Logo */}
            <Link to="threads" className="flex items-center gap-2.5">
              <DataXLogo size={32} />
              <span className="font-bold text-[#0A0F1F] tracking-tight text-[18px]">DataX</span>
            </Link>

            {/* Navigation Pills */}
            <nav className="hidden md:flex items-center gap-1.5">
              <Link
                to="workflows"
                className="px-3.5 py-1.5 text-xs font-medium rounded-full text-[#5F6678] hover:text-[#0A0F1F] hover:bg-[#F5F6FA] flex items-center gap-1.5 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                Workflows
              </Link>
              <Link
                to="templates"
                className="px-3.5 py-1.5 text-xs font-semibold rounded-full bg-[#EEF2FF] text-[#2D55F5] flex items-center gap-1.5 transition-all"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
                Templates
              </Link>
              <Link
                to="connections"
                className="px-3.5 py-1.5 text-xs font-medium rounded-full text-[#5F6678] hover:text-[#0A0F1F] hover:bg-[#F5F6FA] flex items-center gap-1.5 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <rect x="2" y="2" width="6" height="6" rx="1.5" />
                  <rect x="16" y="2" width="6" height="6" rx="1.5" />
                  <rect x="9" y="16" width="6" height="6" rx="1.5" />
                  <path d="M5 8v3a2 2 0 002 2h10a2 2 0 002-2V8" />
                  <path d="M12 13v3" />
                </svg>
                Connections
              </Link>
              <Link
                to="history"
                className="px-3.5 py-1.5 text-xs font-medium rounded-full text-[#5F6678] hover:text-[#0A0F1F] hover:bg-[#F5F6FA] flex items-center gap-1.5 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Runs
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <DataXUserMenu />
          </div>
        </div>
      </header>

      {/* Subheader Banner */}
      <section className="bg-white border-b border-[#E3E6EE] py-6 px-6">
        <div className="max-w-[1360px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#5F6678]">
              <Link to="workflows" className="hover:text-[#2D55F5]">Workflows</Link>
              <span>/</span>
              <span className="text-[#0A0F1F] font-semibold">Templates Catalog</span>
            </div>
            <h1 className="text-2xl font-bold text-[#0A0F1F] tracking-tight mt-1">
              Enterprise Templates
            </h1>
            <p className="text-sm text-[#5F6678] mt-1">
              Pre-configured data workflow templates with certified ontology schemas, automated AI validation rules, and destination writebacks.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E95A9]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search templates, rules, schemas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-[#F5F6FA] border border-[#E3E6EE] rounded-full text-xs text-[#0A0F1F] placeholder:text-[#8E95A9] focus:outline-none focus:border-[#2D55F5] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="max-w-[1360px] mx-auto mt-5 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#0A0F1F] text-white shadow-2xs'
                  : 'bg-[#F5F6FA] text-[#5F6678] hover:text-[#0A0F1F] hover:bg-[#EBEEF5] border border-[#E3E6EE]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Main Grid */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPacks.map((pack) => (
            <div
              key={pack.id}
              className="bg-white rounded-[22px] border border-[#E3E6EE] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header: Icon + Category + Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-[14px] bg-[#EEF2FF] flex items-center justify-center shrink-0">
                      {pack.icon}
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#2D55F5]">
                        {pack.category}
                      </span>
                      <h3 className="text-[15px] font-bold text-[#0A0F1F] tracking-tight leading-snug">
                        {pack.name}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#EBF0FF] text-[#2D55F5] text-[10px] font-medium border border-[#D5E1FF]">
                    {pack.badge}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-[#5F6678] leading-relaxed mt-3">
                  {pack.desc}
                </p>

                {/* Pipeline Flow Pill */}
                <div className="mt-3.5 p-2 rounded-lg bg-[#F5F6FA] border border-[#E3E6EE] text-[11px] font-mono text-[#474E61]">
                  <span className="text-[#8E95A9] mr-1">Flow:</span>
                  {pack.pipeline}
                </div>

                {/* Rules List Preview */}
                <div className="mt-4 pt-3 border-t border-[#F2F4F7]">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-[#0A0F1F]">Pre-Configured Rules</span>
                    <span className="text-[11px] font-medium text-[#2D55F5] bg-blue-50 px-2 py-0.5 rounded-full">
                      {pack.rulesCount > 0 ? `${pack.rulesCount} Rules` : 'Configurable'}
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {pack.rules.slice(0, 3).map((rule, idx) => (
                      <li key={idx} className="text-[11px] text-[#5F6678] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2D55F5]" />
                        <span className="truncate">{rule}</span>
                      </li>
                    ))}
                    {pack.rules.length > 3 && (
                      <li className="text-[10px] text-[#8E95A9] italic pl-3">
                        + {pack.rules.length - 3} more domain rules included
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-6 pt-4 border-t border-[#F2F4F7] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-[#8E95A9]">
                  <span>Template</span>
                  <span>·</span>
                  <span>Unexecuted</span>
                </div>

                <button
                  onClick={() => handleDeployPack(pack)}
                  className="px-4 py-2 rounded-xl bg-[#2D55F5] hover:bg-[#1E3EB8] text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>Use Template</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
