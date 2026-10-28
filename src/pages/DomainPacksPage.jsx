import React, { useState } from 'react';
import { Link, useNavigation } from '../context/NavigationContext';
import { useRuleEngine } from '../context/RuleEngineContext';
import DataXUserMenu from '../components/common/DataXUserMenu';
import { DataXLogo } from './ThreadsPage';

// =========================================================================
// Domain Category Icons
// =========================================================================
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

const BrainIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2D55F5" strokeWidth="1.75">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04z" />
  </svg>
);

const SalesforceIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2D55F5" strokeWidth="1.75">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </svg>
);

const TelemetryIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2D55F5" strokeWidth="1.75">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
    <path d="M6 8l4 4 3-3 5 5" />
  </svg>
);

const SnowflakeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2D55F5" strokeWidth="1.75">
    <line x1="12" y1="2" x2="12" y2="22" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    <line x1="4.93" y1="19.07" x2="19.07" y2="4.93" />
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

const HealthIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2D55F5" strokeWidth="1.75">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

const LakehouseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2D55F5" strokeWidth="1.75">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

const CustomIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2D55F5" strokeWidth="1.75">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

// =========================================================================
// 10 PRIORITIZED ENTERPRISE DOMAIN USE CASES CATALOG
// =========================================================================
const DOMAIN_PACK_CATALOG = [
  // 1. SAP BW -> S/4HANA (Tier 1)
  {
    id: 'sap_bw_s4hana',
    packKey: 'sap_bw_s4hana',
    name: 'SAP BW → S/4HANA Clean Core Modernizer',
    category: 'ERP Modernization',
    tier: 'Tier 1 (Mission-Critical)',
    tierLevel: 1,
    badge: 'SAP Certified Clean Core',
    desc: 'Extract InfoCube purchasing lines, resolve legacy plant codes via plant ontology, split high-value purchase orders for human review, and commit verified orders into S/4HANA via BAPI.',
    pipeline: 'SAP BW InfoCube → Clean Core Ontologies → S/4HANA BAPI',
    icon: <SapIcon />,
    nodeCount: 7,
    rulesCount: 5,
    rules: [
      'Positive Line Quantity (> 0)',
      'Calculation Equality (QTY * PRICE == TOTAL)',
      'Mandatory Vendor Code Verification',
      'Authorized S/4HANA Plant Ontology Lookup',
      'Sequential Line Item Check'
    ],
    features: ['Ontology Graph Mappings', 'Automated BAPI Writeback', 'HITL Controller Gate']
  },

  // 2. Financial GL & SOX 404 (Tier 1)
  {
    id: 'financial_gl_ledger',
    packKey: 'financial_gl_ledger',
    name: 'Financial General Ledger & SOX 404 Audit',
    category: 'Finance & Compliance',
    tier: 'Tier 1 (Mission-Critical)',
    tierLevel: 1,
    badge: 'SOX 404 & GAAP Compliant',
    desc: 'Audit general ledger journal entries across disparate legacy systems, guarantee zero imbalance (Debits = Credits), gate entries exceeding $100K for CFO sign-off, and stage approved entries to BigQuery & financial vault.',
    pipeline: 'ERP GL → SOX Intelligence Engine → BigQuery Gold Vault',
    icon: <FinanceIcon />,
    nodeCount: 7,
    rulesCount: 4,
    rules: [
      'Debits Equal Credits (Zero Imbalance)',
      'Valid ISO-4217 Currency Standard',
      'General Ledger Code Registry Check',
      'Active Open Fiscal Period Guard'
    ],
    features: ['Audit Trail Immutable Logs', 'SOX 404 Guardrails', 'CFO Approval Gate']
  },

  // 3. Customer Master 360 (Tier 2)
  {
    id: 'customer_master_reconciliation',
    packKey: 'customer_master_reconciliation',
    name: 'Customer 360 & Entity Resolution Harmonizer',
    category: 'Customer 360',
    tier: 'Tier 2 (High Value)',
    tierLevel: 2,
    badge: 'MongoDB ➔ Vector Deduplication',
    desc: 'Harmonize raw customer documents from MongoDB Atlas, apply vector embeddings to resolve duplicate company names (e.g., "IBM Corp" ↔ "International Business Machines"), enforce RFC-5322 syntax, and write Golden Customer records to PostgreSQL Neon.',
    pipeline: 'MongoDB Atlas → Vector Deduplication → PostgreSQL Gold',
    icon: <UserIcon />,
    nodeCount: 6,
    rulesCount: 4,
    rules: [
      'RFC-5322 Email Syntax Validation',
      'Required Full Name & Capitalization',
      'Non-Negative Account Balance Guard',
      'Vector Similarity Entity Resolution (>= 85%)'
    ],
    features: ['Cross-DB Entity Resolution', 'Synthetic Identity Detection', 'Neon Replica']
  },

  // 4. Enterprise Policy RAG & Legal Contracts (Tier 2)
  {
    id: 'enterprise_rag_knowledge',
    packKey: 'enterprise_rag_knowledge',
    name: 'Enterprise Policy RAG & Legal Contracts',
    category: 'Enterprise AI & RAG',
    tier: 'Tier 2 (GenAI & Knowledge)',
    tierLevel: 2,
    badge: 'AWS S3 ➔ Pinecone Vector DB',
    desc: 'Ingest enterprise contract documents from AWS S3, retrieve internal compliance policy context via RAG Enricher, evaluate clause risk scores, route critical clauses to Legal Counsel, and persist embeddings into Pinecone Vector DB.',
    pipeline: 'AWS S3 → RAG Enricher → Vector Matcher → Pinecone Vector DB',
    icon: <BrainIcon />,
    nodeCount: 8,
    rulesCount: 4,
    rules: [
      'Valid Expiration Date in Future',
      'Indemnity Risk Threshold (<= 80)',
      'Governing Jurisdiction Standard',
      'Mandatory Authorized Signatory Title'
    ],
    features: ['RAG Policy Augmentation', 'Pinecone Vector Store (1536d)', 'Legal Counsel HITL']
  },

  // 5. Salesforce CRM -> BigQuery Lakehouse (Tier 3)
  {
    id: 'salesforce_crm_bigquery',
    packKey: 'salesforce_crm_bigquery',
    name: 'Salesforce CRM → BigQuery Revenue Pipeline',
    category: 'RevOps & Sales',
    tier: 'Tier 3 (Cloud Data Warehouse)',
    tierLevel: 3,
    badge: 'Salesforce ➔ Google BigQuery',
    desc: 'Ingest live Accounts and Opportunities from Salesforce CRM, cleanse lead emails and corporate domains, route enterprise deals exceeding $250K to RevOps Director, and stream golden customer pipeline records to Google BigQuery.',
    pipeline: 'Salesforce CRM → RevOps Validator → Google BigQuery',
    icon: <SalesforceIcon />,
    nodeCount: 7,
    rulesCount: 4,
    rules: [
      'Business Email Domain Validation',
      'Positive Opportunity Deal Value',
      'Valid CRM Sales Stage Sequence',
      'Lead Quality Score Normalization'
    ],
    features: ['BigQuery Storage Write API', 'RevOps Director HITL', 'FREEMAIL Domain Filter']
  },

  // 6. SRE Telemetry & Vector Search Copilot (Tier 3)
  {
    id: 'support_telemetry_vector',
    packKey: 'support_telemetry_vector',
    name: 'SRE Support Telemetry & Vector Incident Copilot',
    category: 'DevOps & Telemetry',
    tier: 'Tier 3 (Observability)',
    tierLevel: 3,
    badge: 'Azure Blob ➔ Pinecone Copilot',
    desc: 'Ingest raw application and system logs from Azure Blob Storage, sanitize client IPs and PII credentials, generate semantic error embeddings with OpenAI text-embedding-3-small, and index incident clusters into Pinecone.',
    pipeline: 'Azure Blob → PII Anonymizer → Vector Matcher → Pinecone Index',
    icon: <TelemetryIcon />,
    nodeCount: 6,
    rulesCount: 4,
    rules: [
      'Client IP Obfuscation Mask (GDPR)',
      'Structured Standard Log Level',
      'Incident Semantic Cluster Match (>= 80%)',
      'Server Latency Outlier Threshold'
    ],
    features: ['Parquet Log Stream Parsing', 'Vector Root Cause Indexing', 'GDPR Masking']
  },

  // 7. Snowflake Spend -> S/4HANA Procurement (Tier 3)
  {
    id: 'snowflake_s4hana_procurement',
    packKey: 'snowflake_s4hana_procurement',
    name: 'Snowflake Spend → S/4HANA Vendor Purchasing',
    category: 'Procurement & ERP',
    tier: 'Tier 3 (Cloud Procurement)',
    tierLevel: 3,
    badge: 'Snowflake ➔ S/4HANA BAPI',
    desc: 'Extract historical vendor spend transactions from Snowflake Data Cloud, match vendor aliases against SAP master suppliers using Semantic Vector Matcher, and generate reconciled purchase requisitions in SAP S/4HANA.',
    pipeline: 'Snowflake Cloud → Semantic Vendor Resolver → S/4HANA Purchasing',
    icon: <SnowflakeIcon />,
    nodeCount: 6,
    rulesCount: 4,
    rules: [
      'Spend Ledger Calculation Accuracy',
      'S/4HANA Vendor Ontology Resolution',
      '10-Digit Cost Center Allocation Syntax',
      'Active Fiscal Year Budget Alignment'
    ],
    features: ['Snowflake Warehouse Query', 'Fuzzy Vendor Entity Resolution', 'BAPI Purchase Commit']
  },

  // 8. Supply Chain & Warehouse Balancer (Tier 4)
  {
    id: 'supply_chain_inventory',
    packKey: 'supply_chain_inventory',
    name: 'Multi-Echelon Supply Chain & Warehouse Balancer',
    category: 'Supply Chain & Logistics',
    tier: 'Tier 4 (Industry & Logistics)',
    tierLevel: 4,
    badge: 'WMS ➔ Multi-Echelon Balancer',
    desc: 'Reconcile logistics warehouse counts with distribution center purchase orders from AWS S3, resolve SKU naming discrepancies, detect stockout risks below safety thresholds, and route stock transfer orders.',
    pipeline: 'AWS S3 WMS → SKU Harmonizer → S/4HANA Inventory',
    icon: <SupplyIcon />,
    nodeCount: 7,
    rulesCount: 4,
    rules: [
      'GS1 Compliant UPC/EAN Barcode Syntax',
      'Stock On Hand Non-Negative Guard',
      'Safety Stock Reorder Point Breach Alert',
      'Warehouse Bin Location Code Format'
    ],
    features: ['Inventory Drift Detection', 'Logistics Director HITL', 'Automated Stock Leveling']
  },

  // 9. Healthcare Clinical HIPAA Vault (Tier 4)
  {
    id: 'healthcare_hipaa_clinical',
    packKey: 'healthcare_hipaa_clinical',
    name: 'Healthcare Clinical Records & HIPAA Safe Harbor Vault',
    category: 'Healthcare & Life Sciences',
    tier: 'Tier 4 (Healthcare & Compliance)',
    tierLevel: 4,
    badge: 'HIPAA & HL7 Safe Harbor',
    desc: 'Ingest EHR clinical encounters and patient staging records, strip all 18 HIPAA Safe Harbor direct identifiers, validate Medical Record Numbers (MRN) and National Provider Identifiers (NPI), and isolate questionable records.',
    pipeline: 'EHR Clinical DB → Safe Harbor Sanitizer → BigQuery HIPAA Vault',
    icon: <HealthIcon />,
    nodeCount: 7,
    rulesCount: 5,
    rules: [
      'HIPAA Safe Harbor De-Identification (No SSN/CC)',
      'Institutional Medical Record Number (MRN) Validity',
      'Date of Birth Plausibility Guard',
      '10-Digit CMS National Provider Identifier (NPI)',
      'HL7 Standard Administrative Sex Value'
    ],
    features: ['Safe Harbor De-Identification', 'NPI National Registry Check', 'Privacy Officer HITL']
  },

  // 10. Multi-Cloud Parquet Lakehouse (Tier 5)
  {
    id: 'multicloud_parquet_lakehouse',
    packKey: 'multicloud_parquet_lakehouse',
    name: 'Multi-Cloud Parquet Stream & Schema Drift Guard',
    category: 'Data Lakehouse',
    tier: 'Tier 5 (Multi-Cloud Infrastructure)',
    tierLevel: 5,
    badge: 'Parquet Stream ➔ Drift Guard',
    desc: 'Stream high-throughput Parquet files from Azure Blob Storage, detect real-time column evolution and schema drift, isolate corrupt Snappy blocks, and mirror clean micro-batches simultaneously into BigQuery and Databricks.',
    pipeline: 'Azure Blob Parquet → Schema Drift Guard → Google BigQuery & Databricks',
    icon: <LakehouseIcon />,
    nodeCount: 5,
    rulesCount: 4,
    rules: [
      'Schema Drift Column Count Guard',
      'Partition Date Plausibility Check',
      'Payload MD5 Checksum Integrity',
      'Primary Key Null Rate Zero Tolerance'
    ],
    features: ['Dual Cloud Writeback', 'Dead-Letter Parquet DLQ', 'Automated Schema Evolution']
  },

  // 11. Custom Builder (Blank Canvas)
  {
    id: 'custom_builder',
    packKey: null,
    name: 'Blank Canvas Custom Pipeline',
    category: 'Custom Architecture',
    tier: 'Custom Canvas',
    tierLevel: 0,
    badge: 'Custom Schema Canvas',
    desc: 'Start from scratch with an empty canvas to connect bespoke database endpoints, configure custom LLM transformation rules, and define tailored target schema mappings.',
    pipeline: 'Custom Source → User Rules Engine → Custom Target',
    icon: <CustomIcon />,
    nodeCount: 0,
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
  const [selectedTier, setSelectedTier] = useState('All');
  const [search, setSearch] = useState('');

  const categories = [
    'All',
    'ERP Modernization',
    'Finance & Compliance',
    'Customer 360',
    'Enterprise AI & RAG',
    'RevOps & Sales',
    'DevOps & Telemetry',
    'Procurement & ERP',
    'Supply Chain & Logistics',
    'Healthcare & Life Sciences',
    'Data Lakehouse'
  ];

  const tiers = [
    { label: 'All Tiers', value: 'All' },
    { label: 'Tier 1: Mission-Critical', value: 1 },
    { label: 'Tier 2: AI & Identity', value: 2 },
    { label: 'Tier 3: Cloud & RevOps', value: 3 },
    { label: 'Tier 4: Industry & Health', value: 4 },
    { label: 'Tier 5: Multi-Cloud', value: 5 }
  ];

  const filteredPacks = DOMAIN_PACK_CATALOG.filter(pack => {
    if (selectedCategory !== 'All' && pack.category !== selectedCategory) return false;
    if (selectedTier !== 'All' && pack.tierLevel !== selectedTier) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        pack.name.toLowerCase().includes(q) ||
        pack.desc.toLowerCase().includes(q) ||
        pack.category.toLowerCase().includes(q) ||
        pack.pipeline.toLowerCase().includes(q) ||
        (pack.tier && pack.tier.toLowerCase().includes(q))
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
              <Link
                to="quarantine"
                className="px-3.5 py-1.5 text-xs font-medium rounded-full text-[#5F6678] hover:text-[#0A0F1F] hover:bg-[#F5F6FA] flex items-center gap-1.5 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Quarantine
              </Link>
              <Link
                to="audit"
                className="px-3.5 py-1.5 text-xs font-medium rounded-full text-[#5F6678] hover:text-[#0A0F1F] hover:bg-[#F5F6FA] flex items-center gap-1.5 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Audit Trail
              </Link>
              <Link
                to="shadow"
                className="px-3.5 py-1.5 text-xs font-medium rounded-full text-[#5F6678] hover:text-[#0A0F1F] hover:bg-[#F5F6FA] flex items-center gap-1.5 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
                Shadow Parity
              </Link>
              <Link
                to="roi"
                className="px-2 2xl:px-3.5 py-1.5 text-xs font-medium rounded-full text-[#5F6678] hover:text-[#0A0F1F] hover:bg-[#F5F6FA] flex items-center gap-1.5 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
                Executive ROI
              </Link>
              <Link
                to="settings"
                className="px-3.5 py-1.5 text-xs font-medium rounded-full text-[#5F6678] hover:text-[#0A0F1F] hover:bg-[#F5F6FA] flex items-center gap-1.5 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
                Settings
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
              <span className="text-[#0A0F1F] font-semibold">Templates Catalog (10)</span>
            </div>
            <h1 className="text-2xl font-bold text-[#0A0F1F] tracking-tight mt-1">
              Enterprise Use Cases & Topology Catalog
            </h1>
            <p className="text-sm text-[#5F6678] mt-1 max-w-3xl">
              10 prioritized production pipelines spanning ERP, SOX 404 compliance, GenAI RAG, vector search, cloud data warehouses, and multi-cloud lakehouses — ready for 1-click deployment.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E95A9]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by domain, tier, connector..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-[#F5F6FA] border border-[#E3E6EE] rounded-full text-xs text-[#0A0F1F] placeholder:text-[#8E95A9] focus:outline-none focus:border-[#2D55F5] focus:bg-white transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* Priority Tier Switcher */}
        <div className="max-w-[1360px] mx-auto mt-5 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Priority:</span>
          {tiers.map((t) => (
            <button
              key={t.label}
              onClick={() => setSelectedTier(t.value)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedTier === t.value
                  ? 'bg-[#2D55F5] text-white shadow-2xs'
                  : 'bg-white text-[#5F6678] hover:text-[#0A0F1F] hover:bg-[#F5F6FA] border border-[#E3E6EE]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Category Filter Pills */}
        <div className="max-w-[1360px] mx-auto mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer ${
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
              className="bg-white rounded-[22px] border border-[#E3E6EE] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header: Icon + Category + Priority Tier */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-[14px] bg-[#EEF2FF] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
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

                {/* Badges: Priority + Certification */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {pack.tier && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      pack.tierLevel === 1 ? 'bg-amber-50 text-amber-800 border-amber-200' :
                      pack.tierLevel === 2 ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                      pack.tierLevel === 3 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      pack.tierLevel === 4 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      'bg-purple-50 text-purple-700 border-purple-200'
                    }`}>
                      {pack.tier}
                    </span>
                  )}
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#EBF0FF] text-[#2D55F5] text-[10px] font-medium border border-[#D5E1FF]">
                    {pack.badge}
                  </span>
                  {pack.nodeCount > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200">
                      {pack.nodeCount} Nodes
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-[#5F6678] leading-relaxed mt-3 line-clamp-3">
                  {pack.desc}
                </p>

                {/* Pipeline Flow Pill */}
                <div className="mt-3.5 p-2 rounded-lg bg-[#F5F6FA] border border-[#E3E6EE] text-[11px] font-mono text-[#474E61]">
                  <span className="text-[#8E95A9] mr-1">Flow:</span>
                  <span className="text-slate-800 font-medium">{pack.pipeline}</span>
                </div>

                {/* Rules List Preview */}
                <div className="mt-4 pt-3 border-t border-[#F2F4F7]">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-[#0A0F1F]">Pre-Configured Domain Rules</span>
                    <span className="text-[11px] font-medium text-[#2D55F5] bg-blue-50 px-2 py-0.5 rounded-full">
                      {pack.rulesCount > 0 ? `${pack.rulesCount} Rules` : 'Configurable'}
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {pack.rules.slice(0, 3).map((rule, idx) => (
                      <li key={idx} className="text-[11px] text-[#5F6678] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2D55F5] shrink-0" />
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

                {/* Feature Chips */}
                {pack.features && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {pack.features.map((feat, fIdx) => (
                      <span key={fIdx} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-50 text-slate-600 border border-slate-200">
                        {feat}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="mt-6 pt-4 border-t border-[#F2F4F7] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[11px] text-[#8E95A9]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  <span>Production Ready</span>
                </div>

                <button
                  onClick={() => handleDeployPack(pack)}
                  className="px-4 py-2 rounded-xl bg-[#2D55F5] hover:bg-[#1E3EB8] text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5 group-hover:bg-[#1E3EB8]"
                >
                  <span>Load Template</span>
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
