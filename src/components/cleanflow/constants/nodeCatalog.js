import {
  Database,
  Cloud,
  FolderTree,
  Table,
  FileCode2,
  Layers,
  BookOpen,
  ShieldCheck,
  Zap,
  Sliders,
  GitBranch,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';

export const OPERATIONAL_CATALOG = [
  {
    category: '1. Ingestion Sources',
    items: [
      { type: 'source', name: 'SAP BW InfoCube / HANA Cloud', desc: 'Batch extracts, procurement ledger, inventory', system: 'SAP BW', icon: Database, variant: 'blue' },
      { type: 'source', name: 'PostgreSQL Database / Neon', desc: 'Relational connection pool with SSL security', system: 'PostgreSQL', icon: Database, variant: 'blue' },
      { type: 'source', name: 'MongoDB Atlas (NoSQL)', desc: 'Document store with automated JSON schema discovery', system: 'MongoDB', icon: Database, variant: 'green' },
      { type: 'source', name: 'Snowflake Data Cloud', desc: 'Direct ingestion from Snowflake landing tables', system: 'Snowflake', icon: Database, variant: 'blue' },
      { type: 'source', name: 'Azure Blob Storage', desc: 'Enterprise cloud container reader for telemetry & parquet logs', system: 'Azure', icon: Cloud, variant: 'blue' },
      { type: 'source', name: 'Salesforce CRM', desc: 'Live customer accounts, leads, and contact data', system: 'Salesforce', icon: Cloud, variant: 'blue' },
      { type: 'source', name: 'AWS S3 Storage', desc: 'Cloud bucket reader for Parquet, CSV, and Delta lake', system: 'AWS S3', icon: FolderTree, variant: 'blue' },
      { type: 'source', name: 'BYO File Ingestion (CSV / Excel / JSON)', desc: 'Upload custom client or prospect datasets directly onto canvas', system: 'File Ingest', icon: Table, variant: 'blue' },
    ]
  },
  {
    category: '2. Intelligence Engine & Transformations',
    items: [
      { type: 'rules', name: 'Intelligence Engine (Azure OpenAI)', desc: 'Natural language business rule synthesizer', system: 'gpt-5-mini', icon: FileCode2, variant: 'indigo' },
      { type: 'vector_matcher', name: 'Semantic Vector Matcher', desc: 'Finds fuzzy-matching records using AI similarity (e.g. "IBM Corp" ↔ "International Business Machines")', system: 'text-embedding-3-small', icon: Layers, variant: 'indigo' },
      { type: 'rag', name: 'RAG Context Enricher', desc: 'Searches your company knowledge library and attaches relevant context to each data record', system: 'RAG', icon: BookOpen, variant: 'purple' },
      { type: 'rules', name: 'RFC-5322 Email Normalizer', desc: 'Auto-repairs syntax, trims whitespace, lowercases domains', system: 'Rule Pack', icon: ShieldCheck, variant: 'green' },
      { type: 'rules', name: 'SAP Plant Ontology Resolver', desc: 'Maps Plant-Dallas string into S/4HANA code P1000', system: 'Ontology Graph', icon: Zap, variant: 'blue' },
      { type: 'rules', name: 'SOX 404 Financial Balancer', desc: 'Strict Debits = Credits balance validation', system: 'SOX Pack', icon: Sliders, variant: 'orange' }
    ]
  },
  {
    category: '3. In-Flight Routing & Execution',
    items: [
      { type: 'router', name: 'CleanFlow In-Flight Router', desc: 'Autonomous 3-way split: Compliant, Auto-Fixed, Quarantined', system: 'Parallel Router', icon: GitBranch, variant: 'purple' },
      { type: 'conditional', name: 'Conditional Router (If / Else)', desc: 'Routes records to a TRUE or FALSE path based on one condition you define', system: 'If-Else Router', icon: GitBranch, variant: 'purple' },
      { type: 'hitl', name: 'Human in Loop', desc: 'Pauses the pipeline for a human reviewer to Approve or Reject before records continue', system: 'Approval Gate', icon: UserCheck, variant: 'orange' }
    ]
  },
  {
    category: '4. Targets & Destinations',
    items: [
      { type: 'target', name: 'SAP S/4HANA (BAPI_PO_CREATE1)', desc: 'Operational ERP writeback with human verification gate', system: 'SAP S/4HANA', icon: Database, variant: 'green' },
      { type: 'target', name: 'PostgreSQL Database (Neon / RDS)', desc: 'Commit verified records and quarantine tables to PostgreSQL', system: 'PostgreSQL', icon: Database, variant: 'green' },
      { type: 'target', name: 'Databricks Unity Catalog Lakehouse', desc: 'Persist compliant records into Delta Lake Gold table', system: 'Databricks', icon: Database, variant: 'green' },
      { type: 'bigquery', name: 'Google BigQuery', desc: 'Enterprise cloud data warehouse for real-time analytics and SQL pipelines', system: 'Google BigQuery', icon: Database, variant: 'blue' },
      { type: 'pinecone', name: 'Pinecone', desc: 'Vector database store for high-dimensional embeddings and semantic search', system: 'Pinecone Vector DB', icon: Database, variant: 'green' },
      { type: 'quarantine', name: 'Audit Quarantine Store', desc: 'Audit-locked isolation for critical failed records', system: 'Dead-Letter', icon: AlertTriangle, variant: 'orange' }
    ]
  }
];

export const resolveEngineKey = (dbType = '') => {
  if (dbType.includes('SAP')) return 'sap_bw';
  if (dbType.includes('Mongo')) return 'mongodb';
  if (dbType.includes('Azure')) return 'azure';
  if (dbType.includes('Salesforce')) return 'salesforce';
  if (dbType.includes('S3') || dbType.includes('AWS')) return 's3';
  return 'postgres';
};

export const sanitizeNode = (n) => {
  if (!n) return n;
  const node = { ...n };
  if (node.title === 'AI Rules Engine' || node.title === 'AI Rule Engine') {
    node.title = 'Intelligence Engine';
  }
  if (node.type === 'rag' || (node.title && node.title.toLowerCase().includes('rag'))) {
    node.type = 'rag';
    node.title = 'RAG Context Enricher';
    node.system = 'RAG';
    if (node.table && node.table.toLowerCase().includes('hybrid')) {
      node.table = 'Knowledge Store';
    }
  }
  if (node.type === 'conditional' || (node.title && (node.title.includes('Conditional') || node.title.includes('Switch')))) {
    node.type = 'conditional';
    node.title = 'Conditional Router (If / Else)';
    node.system = 'If-Else Router';
    if (node.system && node.system.includes('TOTAL_AMOUNT')) {
      node.system = 'If-Else Router';
    }
    if (node.table && node.table.includes('50000200')) {
      node.table = 'Configured';
    }
  }
  return node;
};
