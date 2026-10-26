// =========================================================================
// ENTERPRISE WORKFLOW TEMPLATES & AUTOFILL CATALOG
// 10 Prioritized Multi-Node Production Pipelines Across All Enterprise Domains
// =========================================================================

export const TEMPLATE_AUTOFILLS = {
  // -----------------------------------------------------------------------
  // 1. TIER 1: SAP BW -> S/4HANA Clean Core Modernizer (with HITL Approval)
  // -----------------------------------------------------------------------
  sap_bw_s4hana: {
    id: 'sap_bw_s4hana',
    name: 'SAP BW → S/4HANA Clean Core Modernizer',
    category: 'ERP Modernization',
    priority: 'Tier 1 (Mission-Critical)',
    desc: 'Extract InfoCube purchasing lines, resolve legacy plant codes via plant ontology, split high-value purchase orders for human review, and commit verified orders into S/4HANA via BAPI.',
    nodes: [
      {
        id: 'node-source',
        type: 'source',
        x: 80,
        y: 180,
        width: 260,
        height: 135,
        title: 'Source Ingestion',
        system: 'SAP BW InfoCube / HANA',
        table: '0PUR_C01',
        rowCount: '1,420 rows',
        status: 'Ready',
        variant: 'blue'
      },
      {
        id: 'node-rules',
        type: 'rules',
        x: 390,
        y: 180,
        width: 260,
        height: 135,
        title: 'Intelligence Engine',
        system: 'Clean Core Ontologies',
        ruleCount: 5,
        aiModel: 'gpt-5-mini',
        status: 'Auto-Fix Armed',
        variant: 'indigo'
      },
      {
        id: 'node-conditional',
        type: 'conditional',
        x: 700,
        y: 180,
        width: 260,
        height: 135,
        title: 'Conditional Router',
        system: 'Value Threshold (> $50k)',
        table: 'Configured',
        status: 'Active',
        variant: 'purple'
      },
      {
        id: 'node-hitl',
        type: 'hitl',
        x: 1020,
        y: 90,
        width: 260,
        height: 135,
        title: 'Human in Loop',
        system: 'Procurement Controller Gate',
        table: 'SLA: 8 hrs',
        status: 'Armed',
        variant: 'orange'
      },
      {
        id: 'node-router',
        type: 'router',
        x: 1020,
        y: 270,
        width: 260,
        height: 135,
        title: 'CleanFlow Router',
        system: 'Stream Splitter',
        split: 'Clean · Fixed · Quarantined',
        status: 'Active',
        variant: 'purple'
      },
      {
        id: 'node-target',
        type: 'target',
        x: 1340,
        y: 90,
        width: 260,
        height: 135,
        title: 'Target ERP',
        system: 'SAP S/4HANA Clean Core',
        table: '0PUR_C01_clean',
        bapi: 'BAPI_PO_CREATE1',
        status: 'Ready to Commit',
        variant: 'green'
      },
      {
        id: 'node-quarantine',
        type: 'quarantine',
        x: 1340,
        y: 270,
        width: 260,
        height: 135,
        title: 'Quarantine Store',
        system: 'Dead-Letter Isolation',
        table: '0PUR_C01_quarantine',
        status: 'Audit Locked',
        variant: 'orange'
      }
    ],
    edges: [
      { id: 'e-1', from: 'node-source', to: 'node-rules', label: 'Raw Stream' },
      { id: 'e-2', from: 'node-rules', to: 'node-conditional', label: 'Validated Records' },
      { id: 'e-3', from: 'node-conditional', to: 'node-hitl', label: 'High Value (> $50K)', variant: 'orange' },
      { id: 'e-4', from: 'node-conditional', to: 'node-router', label: 'Routine PO Stream', variant: 'purple' },
      { id: 'e-5', from: 'node-hitl', to: 'node-target', label: 'Controller Approved', variant: 'green' },
      { id: 'e-6', from: 'node-router', to: 'node-target', label: 'Compliant & Auto-Fixed', variant: 'green' },
      { id: 'e-7', from: 'node-router', to: 'node-quarantine', label: 'Critical Violations', variant: 'orange' }
    ],
    sourceConfig: {
      engine: 'sap_bw',
      host: 'hana.corp.ondemand.com',
      port: '443',
      database: 'SAP_BW',
      user: 'bwp_rfc_user',
      password: '••••••••',
      table: '0PUR_C01',
      connectionUri: 'jdbc:sap://hana.corp.ondemand.com:443?encrypt=true&validateCertificate=false&user=bwp_rfc_user&databaseName=SAP_BW'
    },
    targetConfig: {
      engine: 's4_hana',
      host: 's4h.corp.ondemand.com',
      port: '443',
      database: 'S4HANA_PRD',
      user: 'bapi_comm_user',
      password: '••••••••',
      table: '0PUR_C01_clean',
      quarantineTable: '0PUR_C01_quarantine',
      writeMode: 'append',
      connectionUri: 'https://s4h.corp.ondemand.com/sap/bc/srt/rfc/sap/z_bapi_po_create1'
    },
    rules: [
      { id: 'r_sap_1', name: 'Positive Line Quantity', field: 'QUANTITY', severity: 'Critical', code: 'QUANTITY > 0', selected: true, desc: 'Reject negative or zero line item quantities' },
      { id: 'r_sap_2', name: 'Calculation Equality', field: 'TOTAL_AMOUNT', severity: 'Critical', code: 'ABS(TOTAL_AMOUNT - (QUANTITY * UNIT_PRICE)) < 0.05', selected: true, desc: 'Line item total must equal quantity times unit price' },
      { id: 'r_sap_3', name: 'Mandatory Vendor Code', field: 'VENDOR_ID', severity: 'Critical', code: 'VENDOR_ID IS NOT NULL AND LENGTH(TRIM(VENDOR_ID)) > 0', selected: true, desc: 'Valid vendor assigned for procurement writeback' },
      { id: 'r_sap_4', name: 'Authorized S/4HANA Plant', field: 'DELIVERY_PLANT', severity: 'Warning', code: "DELIVERY_PLANT IN ('P1000', 'P2000', 'P3000')", selected: true, desc: 'Delivery plant matches active S/4HANA plant via ontology lookup' },
      { id: 'r_sap_5', name: 'Sequential Line Item', field: 'ITEM_NO', severity: 'Warning', code: 'ITEM_NO > 0 AND ITEM_NO % 10 == 0', selected: true, desc: 'SAP purchasing lines must increment predictably' }
    ]
  },

  // -----------------------------------------------------------------------
  // 2. TIER 1: Financial General Ledger & SOX 404 Balance Audit
  // -----------------------------------------------------------------------
  financial_gl_ledger: {
    id: 'financial_gl_ledger',
    name: 'Financial General Ledger & SOX 404 Balance Audit',
    category: 'Finance & Audit',
    priority: 'Tier 1 (Mission-Critical)',
    desc: 'Audit general ledger journal entries across disparate legacy systems, guarantee zero imbalance (Debits = Credits), gate entries exceeding $100K for CFO sign-off, and stage approved entries to BigQuery & financial vault.',
    nodes: [
      {
        id: 'node-source',
        type: 'source',
        x: 80,
        y: 180,
        width: 260,
        height: 135,
        title: 'Source Ingestion',
        system: 'ERP General Ledger',
        table: 'gl_journal_entries',
        rowCount: '2,800 rows',
        status: 'Ready',
        variant: 'blue'
      },
      {
        id: 'node-rules',
        type: 'rules',
        x: 390,
        y: 180,
        width: 260,
        height: 135,
        title: 'SOX 404 Rules',
        system: 'Debits = Credits Validator',
        ruleCount: 4,
        aiModel: 'gpt-5-mini',
        status: 'Strict Check',
        variant: 'indigo'
      },
      {
        id: 'node-conditional',
        type: 'conditional',
        x: 700,
        y: 180,
        width: 260,
        height: 135,
        title: 'Conditional Router',
        system: 'Materiality (> $100k)',
        table: 'Configured',
        status: 'Active',
        variant: 'purple'
      },
      {
        id: 'node-hitl',
        type: 'hitl',
        x: 1020,
        y: 90,
        width: 260,
        height: 135,
        title: 'Human in Loop',
        system: 'CFO / Controller Sign-off',
        table: 'SLA: 4 hrs',
        status: 'Armed',
        variant: 'orange'
      },
      {
        id: 'node-router',
        type: 'router',
        x: 1020,
        y: 270,
        width: 260,
        height: 135,
        title: 'CleanFlow Router',
        system: 'Ledger Balancer',
        split: 'Balanced · Repaired · Imbalanced',
        status: 'Active',
        variant: 'purple'
      },
      {
        id: 'node-bigquery',
        type: 'bigquery',
        x: 1340,
        y: 90,
        width: 260,
        height: 135,
        title: 'Audited Core',
        system: 'Google BigQuery',
        table: 'gl_ledger_audited_gold',
        status: 'SOX Approved',
        variant: 'blue'
      },
      {
        id: 'node-quarantine',
        type: 'quarantine',
        x: 1340,
        y: 270,
        width: 260,
        height: 135,
        title: 'Suspense Account',
        system: 'SOX Imbalance Ledger',
        table: 'gl_suspense_quarantine',
        status: 'Audit Flagged',
        variant: 'orange'
      }
    ],
    edges: [
      { id: 'e-1', from: 'node-source', to: 'node-rules', label: 'Journal Stream' },
      { id: 'e-2', from: 'node-rules', to: 'node-conditional', label: 'SOX Validated' },
      { id: 'e-3', from: 'node-conditional', to: 'node-hitl', label: 'Material Journal (> $100K)', variant: 'orange' },
      { id: 'e-4', from: 'node-conditional', to: 'node-router', label: 'Sub-Threshold Entries', variant: 'purple' },
      { id: 'e-5', from: 'node-hitl', to: 'node-bigquery', label: 'CFO Sign-off', variant: 'green' },
      { id: 'e-6', from: 'node-router', to: 'node-bigquery', label: 'Balanced Journal Entries', variant: 'green' },
      { id: 'e-7', from: 'node-router', to: 'node-quarantine', label: 'Imbalance Suspense', variant: 'orange' }
    ],
    sourceConfig: {
      engine: 'postgres',
      host: 'ep-neon-fin.us-east-2.aws.neon.tech',
      port: '5432',
      database: 'erp_finance',
      user: 'sox_audit_user',
      password: '••••••••',
      table: 'gl_journal_entries',
      connectionUri: 'postgresql://sox_audit_user:••••••••@ep-neon-fin.us-east-2.aws.neon.tech:5432/erp_finance?sslmode=require'
    },
    targetConfig: {
      engine: 'bigquery',
      host: 'bigquery.googleapis.com',
      port: '443',
      database: 'enterprise_analytics_landing',
      user: 'datax_svc@gcp.iam.gserviceaccount.com',
      password: '••••••••',
      table: 'gl_ledger_audited_gold',
      quarantineTable: 'gl_suspense_quarantine',
      writeMode: 'append',
      connectionUri: 'bigquery://datax-enterprise-prd/finance/gl_ledger_audited_gold'
    },
    rules: [
      { id: 'r_gl_1', name: 'Debits Equal Credits', field: 'DEBIT', severity: 'Critical', code: 'ABS(DEBIT - CREDIT) < 0.01', selected: true, desc: 'Zero balance equation required by SOX 404' },
      { id: 'r_gl_2', name: 'Valid ISO Currency', field: 'CURRENCY', severity: 'Critical', code: "CURRENCY IN ('USD', 'EUR', 'GBP', 'CHF')", selected: true, desc: 'Recognized ISO-4217 currency standard' },
      { id: 'r_gl_3', name: 'Valid GL Account Code', field: 'ACCOUNT_CODE', severity: 'Critical', code: 'LENGTH(ACCOUNT_CODE) >= 4', selected: true, desc: 'General ledger account must exist in chart of accounts' },
      { id: 'r_gl_4', name: 'Open Fiscal Period', field: 'FISCAL_PERIOD', severity: 'Warning', code: 'FISCAL_PERIOD >= 1 AND FISCAL_PERIOD <= 12', selected: true, desc: 'Must match active posting period' }
    ]
  },

  // -----------------------------------------------------------------------
  // 3. TIER 2: Customer 360 & Entity Resolution Harmonizer
  // -----------------------------------------------------------------------
  customer_master_reconciliation: {
    id: 'customer_master_reconciliation',
    name: 'Customer 360 & Entity Resolution Harmonizer',
    category: 'Customer 360',
    priority: 'Tier 2 (High Value)',
    desc: 'Harmonize raw customer documents from MongoDB Atlas, apply vector embeddings to resolve duplicate company names (e.g., "IBM Corp" ↔ "International Business Machines"), enforce RFC-5322 syntax, and write Golden Customer records to PostgreSQL Neon.',
    nodes: [
      {
        id: 'node-source',
        type: 'source',
        x: 80,
        y: 180,
        width: 260,
        height: 135,
        title: 'Source Ingestion',
        system: 'MongoDB Atlas Cluster',
        table: 'customers_raw',
        rowCount: '1,000 docs',
        status: 'Ready',
        variant: 'blue'
      },
      {
        id: 'node-vector',
        type: 'vector_matcher',
        x: 390,
        y: 180,
        width: 260,
        height: 135,
        title: 'Vector Matcher',
        system: 'text-embedding-3-small',
        table: 'Similarity > 85%',
        status: 'Fuzzy Deduplication',
        variant: 'indigo'
      },
      {
        id: 'node-rules',
        type: 'rules',
        x: 700,
        y: 180,
        width: 260,
        height: 135,
        title: 'AI Identity Rules',
        system: 'RFC-5322 & Address Cleanse',
        ruleCount: 5,
        aiModel: 'gpt-5-mini',
        status: 'Auto-Fix Armed',
        variant: 'indigo'
      },
      {
        id: 'node-router',
        type: 'router',
        x: 1020,
        y: 180,
        width: 260,
        height: 135,
        title: 'CleanFlow Router',
        system: 'Identity Resolution Split',
        split: 'Golden · Fixed · Unresolved',
        status: 'Active',
        variant: 'purple'
      },
      {
        id: 'node-target',
        type: 'target',
        x: 1340,
        y: 90,
        width: 260,
        height: 135,
        title: 'Target Database',
        system: 'PostgreSQL Neon DB',
        table: 'customers_gold',
        status: 'Ready to Commit',
        variant: 'green'
      },
      {
        id: 'node-quarantine',
        type: 'quarantine',
        x: 1340,
        y: 270,
        width: 260,
        height: 135,
        title: 'Quarantine Store',
        system: 'Identity Sandbox Review',
        table: 'customers_unresolved',
        status: 'Review Required',
        variant: 'orange'
      }
    ],
    edges: [
      { id: 'e-1', from: 'node-source', to: 'node-vector', label: 'Document Stream' },
      { id: 'e-2', from: 'node-vector', to: 'node-rules', label: 'Harmonized Entities' },
      { id: 'e-3', from: 'node-rules', to: 'node-router', label: 'Cleaned Identity' },
      { id: 'e-4', from: 'node-router', to: 'node-target', label: 'Golden Customer Profiles', variant: 'green' },
      { id: 'e-5', from: 'node-router', to: 'node-quarantine', label: 'Ambiguous Matches', variant: 'orange' }
    ],
    sourceConfig: {
      engine: 'mongodb',
      host: 'atlas-cluster0.mongodb.net',
      port: '27017',
      database: 'crm_master',
      user: 'atlas_admin',
      password: '••••••••',
      table: 'customers_raw',
      connectionUri: 'mongodb+srv://atlas_admin:••••••••@atlas-cluster0.mongodb.net/crm_master?retryWrites=true&w=majority'
    },
    targetConfig: {
      engine: 'postgres',
      host: 'ep-neon-datax.us-east-2.aws.neon.tech',
      port: '5432',
      database: 'reconciled_db',
      user: 'neon_postgres',
      password: '••••••••',
      table: 'customers_gold',
      quarantineTable: 'customers_unresolved',
      writeMode: 'append',
      connectionUri: 'postgresql://neon_postgres:••••••••@ep-neon-datax.us-east-2.aws.neon.tech:5432/reconciled_db?sslmode=require'
    },
    rules: [
      { id: 'r_cm_1', name: 'RFC-5322 Email Syntax', field: 'email', severity: 'Critical', code: "REGEX_MATCH(email, '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$')", selected: true, desc: 'Valid corporate email syntax' },
      { id: 'r_cm_2', name: 'Required Full Name', field: 'full_name', severity: 'Critical', code: 'full_name IS NOT NULL AND LENGTH(full_name) >= 2', selected: true, desc: 'Reject null or single character names' },
      { id: 'r_cm_3', name: 'Non-Negative Account Balance', field: 'account_balance', severity: 'Critical', code: 'account_balance >= 0.00', selected: true, desc: 'Disallow corrupt negative balance amounts' },
      { id: 'r_cm_4', name: 'Entity Resolution Cosine Score', field: 'company_name', severity: 'Warning', code: 'VECTOR_SIMILARITY >= 0.85', selected: true, desc: 'Harmonize duplicate legal entity names' }
    ]
  },

  // -----------------------------------------------------------------------
  // 4. TIER 2: Enterprise Policy RAG & Contract Intelligence Pipeline
  // -----------------------------------------------------------------------
  enterprise_rag_knowledge: {
    id: 'enterprise_rag_knowledge',
    name: 'Enterprise Policy RAG & Contract Intelligence Pipeline',
    category: 'Enterprise AI & RAG',
    priority: 'Tier 2 (GenAI & Knowledge Systems)',
    desc: 'Ingest enterprise contract documents from AWS S3, retrieve internal compliance policy context via RAG Enricher, evaluate clause risk scores, route critical clauses to Legal Counsel, and persist embeddings into Pinecone Vector DB.',
    nodes: [
      {
        id: 'node-source',
        type: 'source',
        x: 80,
        y: 180,
        width: 260,
        height: 135,
        title: 'Source Ingestion',
        system: 'AWS S3 Contract Storage',
        table: 'vendor_contracts_q1',
        rowCount: '840 contracts',
        status: 'Ready',
        variant: 'blue'
      },
      {
        id: 'node-rag',
        type: 'rag',
        x: 390,
        y: 180,
        width: 260,
        height: 135,
        title: 'RAG Context Enricher',
        system: 'RAG Policy Library',
        table: 'Azure AI Search Policies',
        status: 'Enrichment Active',
        variant: 'purple'
      },
      {
        id: 'node-vector',
        type: 'vector_matcher',
        x: 700,
        y: 180,
        width: 260,
        height: 135,
        title: 'Vector Matcher',
        system: 'text-embedding-3-small',
        table: 'Clause Similarity > 80%',
        status: 'Indexed',
        variant: 'indigo'
      },
      {
        id: 'node-conditional',
        type: 'conditional',
        x: 1020,
        y: 180,
        width: 260,
        height: 135,
        title: 'Conditional Router',
        system: 'Risk Score Threshold (> 80)',
        table: 'Configured',
        status: 'Active',
        variant: 'purple'
      },
      {
        id: 'node-hitl',
        type: 'hitl',
        x: 1340,
        y: 90,
        width: 260,
        height: 135,
        title: 'Human in Loop',
        system: 'General Counsel Legal Review',
        table: 'SLA: 24 hrs',
        status: 'Armed',
        variant: 'orange'
      },
      {
        id: 'node-pinecone',
        type: 'pinecone',
        x: 1660,
        y: 90,
        width: 260,
        height: 135,
        title: 'Target Vector DB',
        system: 'Pinecone Vector DB',
        table: 'enterprise-knowledge-base',
        status: 'Live Indexing',
        variant: 'green'
      },
      {
        id: 'node-bigquery',
        type: 'bigquery',
        x: 1660,
        y: 270,
        width: 260,
        height: 135,
        title: 'Target Warehouse',
        system: 'Google BigQuery',
        table: 'contracts_index_metadata',
        status: 'Structured Logs',
        variant: 'blue'
      },
      {
        id: 'node-quarantine',
        type: 'quarantine',
        x: 1340,
        y: 270,
        width: 260,
        height: 135,
        title: 'Quarantine Store',
        system: 'Breach Quarantine',
        table: 'contracts_policy_violations',
        status: 'Audit Encrypted',
        variant: 'orange'
      }
    ],
    edges: [
      { id: 'e-1', from: 'node-source', to: 'node-rag', label: 'Raw Contracts' },
      { id: 'e-2', from: 'node-rag', to: 'node-vector', label: 'Enriched Context' },
      { id: 'e-3', from: 'node-vector', to: 'node-conditional', label: 'Risk Scored' },
      { id: 'e-4', from: 'node-conditional', to: 'node-hitl', label: 'High Legal Risk (> 80)', variant: 'orange' },
      { id: 'e-5', from: 'node-conditional', to: 'node-pinecone', label: 'Compliant Clauses', variant: 'green' },
      { id: 'e-6', from: 'node-conditional', to: 'node-quarantine', label: 'Critical Policy Violations', variant: 'orange' },
      { id: 'e-7', from: 'node-hitl', to: 'node-pinecone', label: 'Counsel Approved', variant: 'green' },
      { id: 'e-8', from: 'node-hitl', to: 'node-bigquery', label: 'Audit Records', variant: 'blue' }
    ],
    sourceConfig: {
      engine: 'aws_s3',
      host: 's3.us-east-1.amazonaws.com',
      port: '443',
      database: 'Parquet Snappy',
      user: 's3_contract_reader',
      password: '••••••••',
      table: 'vendor_contracts_q1',
      connectionUri: 's3://datax-enterprise-lake/legal-contracts/vendor_contracts_q1.parquet'
    },
    targetConfig: {
      engine: 'pinecone',
      host: 'pinecone.io',
      port: '443',
      database: 'enterprise-knowledge-base',
      user: 'pinecone_svc',
      password: '••••••••',
      table: 'enterprise-knowledge-base',
      quarantineTable: 'contracts_policy_violations',
      writeMode: 'append',
      connectionUri: 'pinecone://production/enterprise-knowledge-base'
    },
    rules: [
      { id: 'r_rag_1', name: 'Valid Expiration Date', field: 'EXPIRY_DATE', severity: 'Critical', code: 'EXPIRY_DATE > CURRENT_DATE()', selected: true, desc: 'Contract cannot be already expired at execution' },
      { id: 'r_rag_2', name: 'Indemnity Risk Threshold', field: 'INDEMNITY_SCORE', severity: 'Critical', code: 'INDEMNITY_SCORE <= 80', selected: true, desc: 'Gate high-liability indemnity clauses' },
      { id: 'r_rag_3', name: 'Governing Jurisdiction', field: 'JURISDICTION', severity: 'Warning', code: "JURISDICTION IN ('DE', 'NY', 'CA', 'UK', 'EU')", selected: true, desc: 'Approved legal jurisdiction standard' },
      { id: 'r_rag_4', name: 'Mandatory Signatory Title', field: 'SIGNATORY_TITLE', severity: 'Critical', code: 'LENGTH(SIGNATORY_TITLE) > 0', selected: true, desc: 'Authorized officer signature required' }
    ]
  },

  // -----------------------------------------------------------------------
  // 5. TIER 3: Salesforce CRM -> BigQuery Real-Time Revenue Pipeline
  // -----------------------------------------------------------------------
  salesforce_crm_bigquery: {
    id: 'salesforce_crm_bigquery',
    name: 'Salesforce CRM → BigQuery Real-Time Revenue Pipeline',
    category: 'Revenue Operations',
    priority: 'Tier 3 (Cloud Data Warehouse)',
    desc: 'Ingest live Accounts and Opportunities from Salesforce CRM, cleanse lead emails and corporate domains, route enterprise deals exceeding $250K to RevOps Director, and stream golden customer pipeline records to Google BigQuery.',
    nodes: [
      {
        id: 'node-source',
        type: 'source',
        x: 80,
        y: 180,
        width: 260,
        height: 135,
        title: 'Source Ingestion',
        system: 'Salesforce CRM',
        table: 'Opportunity & Account',
        rowCount: '4,200 leads',
        status: 'Ready',
        variant: 'blue'
      },
      {
        id: 'node-rules',
        type: 'rules',
        x: 390,
        y: 180,
        width: 260,
        height: 135,
        title: 'Intelligence Engine',
        system: 'Lead Scoring & RFC-5322',
        ruleCount: 5,
        aiModel: 'gpt-5-mini',
        status: 'Auto-Fix Armed',
        variant: 'indigo'
      },
      {
        id: 'node-conditional',
        type: 'conditional',
        x: 700,
        y: 180,
        width: 260,
        height: 135,
        title: 'Conditional Router',
        system: 'Enterprise Tier (> $250k)',
        table: 'Configured',
        status: 'Active',
        variant: 'purple'
      },
      {
        id: 'node-hitl',
        type: 'hitl',
        x: 1020,
        y: 90,
        width: 260,
        height: 135,
        title: 'Human in Loop',
        system: 'RevOps Director Review',
        table: 'SLA: 6 hrs',
        status: 'Armed',
        variant: 'orange'
      },
      {
        id: 'node-router',
        type: 'router',
        x: 1020,
        y: 270,
        width: 260,
        height: 135,
        title: 'CleanFlow Router',
        system: 'Stream Splitter',
        split: 'Qualified · Enriched · Discard',
        status: 'Active',
        variant: 'purple'
      },
      {
        id: 'node-bigquery',
        type: 'bigquery',
        x: 1340,
        y: 90,
        width: 260,
        height: 135,
        title: 'Target Warehouse',
        system: 'Google BigQuery',
        table: 'sales_pipeline_gold',
        status: 'Analytics Live',
        variant: 'blue'
      },
      {
        id: 'node-quarantine',
        type: 'quarantine',
        x: 1340,
        y: 270,
        width: 260,
        height: 135,
        title: 'Quarantine Store',
        system: 'Junk Lead Sandbox',
        table: 'salesforce_junk_quarantine',
        status: 'Spam Isolated',
        variant: 'orange'
      }
    ],
    edges: [
      { id: 'e-1', from: 'node-source', to: 'node-rules', label: 'CRM Stream' },
      { id: 'e-2', from: 'node-rules', to: 'node-conditional', label: 'Scored Leads' },
      { id: 'e-3', from: 'node-conditional', to: 'node-hitl', label: 'Strategic (> $250K)', variant: 'orange' },
      { id: 'e-4', from: 'node-conditional', to: 'node-router', label: 'Velocity Pipeline', variant: 'purple' },
      { id: 'e-5', from: 'node-hitl', to: 'node-bigquery', label: 'Director Approved', variant: 'green' },
      { id: 'e-6', from: 'node-router', to: 'node-bigquery', label: 'Standard Clean Deals', variant: 'green' },
      { id: 'e-7', from: 'node-router', to: 'node-quarantine', label: 'Unqualified / Spam', variant: 'orange' }
    ],
    sourceConfig: {
      engine: 'salesforce',
      host: 'login.salesforce.com',
      port: '443',
      database: 'Salesforce CRM Enterprise',
      user: 'sfdc_api_user@enterprise.com',
      password: '••••••••',
      table: 'Opportunity',
      connectionUri: 'https://login.salesforce.com/services/oauth2/token'
    },
    targetConfig: {
      engine: 'bigquery',
      host: 'bigquery.googleapis.com',
      port: '443',
      database: 'revops_analytics',
      user: 'datax_svc@gcp.iam.gserviceaccount.com',
      password: '••••••••',
      table: 'sales_pipeline_gold',
      quarantineTable: 'salesforce_junk_quarantine',
      writeMode: 'append',
      connectionUri: 'bigquery://datax-enterprise-prd/revops/sales_pipeline_gold'
    },
    rules: [
      { id: 'r_sfdc_1', name: 'Business Email Domain', field: 'LeadEmail', severity: 'Critical', code: "REGEX_MATCH(LeadEmail, '^[A-Za-z0-9._%+-]+@(?!gmail|yahoo)[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$')", selected: true, desc: 'Disallow freemail domains on enterprise accounts' },
      { id: 'r_sfdc_2', name: 'Positive Opportunity Value', field: 'Amount', severity: 'Critical', code: 'Amount > 0 AND Amount <= 50000000', selected: true, desc: 'Reasonable revenue bounds for deals' },
      { id: 'r_sfdc_3', name: 'Valid Deal Stage', field: 'StageName', severity: 'Critical', code: "StageName IN ('Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won')", selected: true, desc: 'Enforce standard CRM sales stages' },
      { id: 'r_sfdc_4', name: 'Lead Quality Score', field: 'LeadScore', severity: 'Warning', code: 'LeadScore >= 0 AND LeadScore <= 100', selected: true, desc: 'Lead scoring normalization bounds' }
    ]
  },

  // -----------------------------------------------------------------------
  // 6. TIER 3: Cloud Telemetry & Vector Semantic Search
  // -----------------------------------------------------------------------
  support_telemetry_vector: {
    id: 'support_telemetry_vector',
    name: 'Cloud Telemetry & Vector Semantic Search',
    category: 'SRE & Support AI',
    priority: 'Tier 3 (Observability & Vector AI)',
    desc: 'Ingest raw service crash dumps and support telemetry from Azure Blob Storage, scrub internal IP/token credentials, cluster duplicate incident patterns via Semantic Vector Matcher, and index embeddings into Pinecone for autonomous Copilot retrieval.',
    nodes: [
      {
        id: 'node-source',
        type: 'source',
        x: 80,
        y: 180,
        width: 260,
        height: 135,
        title: 'Source Ingestion',
        system: 'Azure Blob Storage',
        table: 'telemetry_logs.parquet',
        rowCount: '15,000 logs',
        status: 'Ready',
        variant: 'blue'
      },
      {
        id: 'node-rules',
        type: 'rules',
        x: 390,
        y: 180,
        width: 260,
        height: 135,
        title: 'Intelligence Engine',
        system: 'Token & PII Anonymizer',
        ruleCount: 4,
        aiModel: 'gpt-5-mini',
        status: 'Scrubber Active',
        variant: 'indigo'
      },
      {
        id: 'node-vector',
        type: 'vector_matcher',
        x: 700,
        y: 180,
        width: 260,
        height: 135,
        title: 'Vector Matcher',
        system: 'text-embedding-3-small',
        table: 'Incident Clustering',
        status: 'Embeddings Gen',
        variant: 'indigo'
      },
      {
        id: 'node-router',
        type: 'router',
        x: 1020,
        y: 180,
        width: 260,
        height: 135,
        title: 'CleanFlow Router',
        system: 'Incident Splitter',
        split: 'Known · Auto-Triaged · Unknown',
        status: 'Active',
        variant: 'purple'
      },
      {
        id: 'node-pinecone',
        type: 'pinecone',
        x: 1340,
        y: 90,
        width: 260,
        height: 135,
        title: 'Target Vector DB',
        system: 'Pinecone Vector DB',
        table: 'incident-embeddings',
        status: 'AI Search Ready',
        variant: 'green'
      },
      {
        id: 'node-quarantine',
        type: 'quarantine',
        x: 1340,
        y: 270,
        width: 260,
        height: 135,
        title: 'Corrupt Log Store',
        system: 'Dead-Letter Parquet',
        table: 'corrupt_telemetry_dlq',
        status: 'Isolated',
        variant: 'orange'
      }
    ],
    edges: [
      { id: 'e-1', from: 'node-source', to: 'node-rules', label: 'Log Stream' },
      { id: 'e-2', from: 'node-rules', to: 'node-vector', label: 'Anonymized Logs' },
      { id: 'e-3', from: 'node-vector', to: 'node-router', label: 'Clustered Incidents' },
      { id: 'e-4', from: 'node-router', to: 'node-pinecone', label: 'Indexed for Copilot', variant: 'green' },
      { id: 'e-5', from: 'node-router', to: 'node-quarantine', label: 'Unparseable Corrupt Lines', variant: 'orange' }
    ],
    sourceConfig: {
      engine: 'azure_blob',
      host: 'azure-storage.blob.core.windows.net',
      port: 'telemetry-container',
      database: 'Azure Blob Snappy',
      user: 'azure_telemetry_client',
      password: '••••••••',
      table: 'telemetry_logs.parquet',
      connectionUri: 'https://azure-storage.blob.core.windows.net/telemetry-container/telemetry_logs.parquet'
    },
    targetConfig: {
      engine: 'pinecone',
      host: 'pinecone.io',
      port: '443',
      database: 'incident-embeddings',
      user: 'pinecone_svc',
      password: '••••••••',
      table: 'incident-embeddings',
      quarantineTable: 'corrupt_telemetry_dlq',
      writeMode: 'append',
      connectionUri: 'pinecone://production/incident-embeddings'
    },
    rules: [
      { id: 'r_tel_1', name: 'IP Anonymization Mask', field: 'client_ip', severity: 'Critical', code: "REGEX_MATCH(client_ip, '^[0-9]{1,3}\\.[0-9]{1,3}\\.XXX\\.XXX$')", selected: true, desc: 'GDPR compliance client IP obfuscation' },
      { id: 'r_tel_2', name: 'Standard Log Level', field: 'log_level', severity: 'Critical', code: "log_level IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL')", selected: true, desc: 'Enforce structured logging levels' },
      { id: 'r_tel_3', name: 'Incident Semantic Match', field: 'incident_summary', severity: 'Warning', code: 'CLUSTER_SIMILARITY >= 0.80', selected: true, desc: 'Correlate with existing known SRE root-cause issues' },
      { id: 'r_tel_4', name: 'Latency Outlier Flag', field: 'latency_ms', severity: 'Warning', code: 'latency_ms >= 0 AND latency_ms <= 30000', selected: true, desc: 'Flag aberrant server latency spikes' }
    ]
  },

  // -----------------------------------------------------------------------
  // 7. TIER 3: Snowflake -> SAP S/4HANA Spend Analytics Harmonizer
  // -----------------------------------------------------------------------
  snowflake_s4hana_procurement: {
    id: 'snowflake_s4hana_procurement',
    name: 'Snowflake → SAP S/4HANA Spend Analytics Harmonizer',
    category: 'Cross-Cloud Spend',
    priority: 'Tier 3 (Enterprise Procurement)',
    desc: 'Ingest procurement lines from Snowflake Data Cloud, resolve vendor naming discrepancies with vector embeddings, validate tax & currency codes, and dispatch clean purchase orders to SAP S/4HANA.',
    nodes: [
      {
        id: 'node-source',
        type: 'source',
        x: 80,
        y: 180,
        width: 260,
        height: 135,
        title: 'Source Ingestion',
        system: 'Snowflake Data Cloud',
        table: 'PURCHASING_STAGE',
        rowCount: '5,200 orders',
        status: 'Ready',
        variant: 'blue'
      },
      {
        id: 'node-vector',
        type: 'vector_matcher',
        x: 390,
        y: 180,
        width: 260,
        height: 135,
        title: 'Vector Matcher',
        system: 'text-embedding-3-small',
        table: 'Vendor Master Resolution',
        status: 'Harmonizing',
        variant: 'indigo'
      },
      {
        id: 'node-rules',
        type: 'rules',
        x: 700,
        y: 180,
        width: 260,
        height: 135,
        title: 'Intelligence Engine',
        system: 'Currency & Tax Compliance',
        ruleCount: 5,
        aiModel: 'gpt-5-mini',
        status: 'Auto-Fix Armed',
        variant: 'indigo'
      },
      {
        id: 'node-router',
        type: 'router',
        x: 1020,
        y: 180,
        width: 260,
        height: 135,
        title: 'CleanFlow Router',
        system: 'Spend Balancer',
        split: 'Compliant · Tax Repaired · Maverick',
        status: 'Active',
        variant: 'purple'
      },
      {
        id: 'node-target',
        type: 'target',
        x: 1340,
        y: 90,
        width: 260,
        height: 135,
        title: 'Target ERP',
        system: 'SAP S/4HANA ERP',
        table: '0PUR_C01_reconciled',
        bapi: 'BAPI_PO_CREATE1',
        status: 'Ready to Commit',
        variant: 'green'
      },
      {
        id: 'node-quarantine',
        type: 'quarantine',
        x: 1340,
        y: 270,
        width: 260,
        height: 135,
        title: 'Quarantine Store',
        system: 'Maverick Spend Store',
        table: 'procurement_maverick_dlq',
        status: 'Review Required',
        variant: 'orange'
      }
    ],
    edges: [
      { id: 'e-1', from: 'node-source', to: 'node-vector', label: 'Snowflake Stream' },
      { id: 'e-2', from: 'node-vector', to: 'node-rules', label: 'Resolved Vendors' },
      { id: 'e-3', from: 'node-rules', to: 'node-router', label: 'Audited Orders' },
      { id: 'e-4', from: 'node-router', to: 'node-target', label: 'ERP Commit', variant: 'green' },
      { id: 'e-5', from: 'node-router', to: 'node-quarantine', label: 'Unauthorized Maverick Spend', variant: 'orange' }
    ],
    sourceConfig: {
      engine: 'snowflake',
      host: 'xy12345.us-east-1.snowflakecomputing.com',
      port: '443',
      database: 'ANALYTICS_LANDING',
      user: 'datax_svc',
      password: '••••••••',
      table: 'PURCHASING_STAGE',
      connectionUri: 'snowflake://datax_svc:••••••••@xy12345.us-east-1.snowflakecomputing.com/ANALYTICS_LANDING?warehouse=COMPUTE_WH'
    },
    targetConfig: {
      engine: 's4_hana',
      host: 's4h.corp.ondemand.com',
      port: '443',
      database: 'S4HANA_PRD',
      user: 'bapi_comm_user',
      password: '••••••••',
      table: '0PUR_C01_reconciled',
      quarantineTable: 'procurement_maverick_dlq',
      writeMode: 'append',
      connectionUri: 'https://s4h.corp.ondemand.com/sap/bc/srt/rfc/sap/z_bapi_po_create1'
    },
    rules: [
      { id: 'r_snw_1', name: 'Spend Ledger Accuracy', field: 'SPEND_AMOUNT', severity: 'Critical', code: 'SPEND_AMOUNT > 0 AND SPEND_AMOUNT == INVOICE_QTY * UNIT_COST', selected: true, desc: 'Snowflake spend matches line item total' },
      { id: 'r_snw_2', name: 'S/4HANA Vendor Ontology Resolution', field: 'VENDOR_NAME', severity: 'Critical', code: 'VECTOR_MATCH_SCORE >= 0.90', selected: true, desc: 'Map informal supplier name to official vendor master code' },
      { id: 'r_snw_3', name: 'Cost Center Code Format', field: 'COST_CENTER', severity: 'Critical', code: 'LENGTH(COST_CENTER) == 10', selected: true, desc: 'Valid 10-digit SAP cost center allocation' },
      { id: 'r_snw_4', name: 'Fiscal Year Alignment', field: 'FISCAL_YEAR', severity: 'Warning', code: 'FISCAL_YEAR == 2026', selected: true, desc: 'Ensure active budget year consistency' }
    ]
  },

  // -----------------------------------------------------------------------
  // 8. TIER 4: Supply Chain Multi-Echelon Inventory & SKU Balancer
  // -----------------------------------------------------------------------
  supply_chain_inventory: {
    id: 'supply_chain_inventory',
    name: 'Supply Chain Multi-Echelon Inventory & SKU Balancer',
    category: 'Supply Chain & Logistics',
    priority: 'Tier 4 (Operations & Logistics)',
    desc: 'Reconcile logistics warehouse counts from AWS S3, verify SKU barcode & unit-of-measure alignment, route critical safety stock deficits to Logistics Controller, and synchronize balanced stock into SAP S/4HANA and Google BigQuery.',
    nodes: [
      {
        id: 'node-source',
        type: 'source',
        x: 80,
        y: 180,
        width: 260,
        height: 135,
        title: 'Source Ingestion',
        system: 'AWS S3 Warehouse WMS',
        table: 'inventory_levels.parquet',
        rowCount: '6,200 SKUs',
        status: 'Ready',
        variant: 'blue'
      },
      {
        id: 'node-rules',
        type: 'rules',
        x: 390,
        y: 180,
        width: 260,
        height: 135,
        title: 'Intelligence Engine',
        system: 'SKU & Safety Stock Rules',
        ruleCount: 4,
        aiModel: 'gpt-5-mini',
        status: 'Auto-Fix Armed',
        variant: 'indigo'
      },
      {
        id: 'node-conditional',
        type: 'conditional',
        x: 700,
        y: 180,
        width: 260,
        height: 135,
        title: 'Conditional Router',
        system: 'Stock Deficit (> 500 units)',
        table: 'Configured',
        status: 'Active',
        variant: 'purple'
      },
      {
        id: 'node-hitl',
        type: 'hitl',
        x: 1020,
        y: 90,
        width: 260,
        height: 135,
        title: 'Human in Loop',
        system: 'Logistics Manager Gate',
        table: 'SLA: 4 hrs',
        status: 'Armed',
        variant: 'orange'
      },
      {
        id: 'node-router',
        type: 'router',
        x: 1020,
        y: 270,
        width: 260,
        height: 135,
        title: 'CleanFlow Router',
        system: 'Stock Balancer',
        split: 'Balanced · Restocked · Variance',
        status: 'Active',
        variant: 'purple'
      },
      {
        id: 'node-target',
        type: 'target',
        x: 1340,
        y: 90,
        width: 260,
        height: 135,
        title: 'Target ERP',
        system: 'SAP S/4HANA Inventory',
        table: 'inventory_reconciled_gold',
        bapi: 'BAPI_GOODSMVT_CREATE',
        status: 'Ready to Commit',
        variant: 'green'
      },
      {
        id: 'node-quarantine',
        type: 'quarantine',
        x: 1340,
        y: 270,
        width: 260,
        height: 135,
        title: 'Variance Store',
        system: 'Discrepancy Store',
        table: 'inventory_variance_dlq',
        status: 'Review Required',
        variant: 'orange'
      }
    ],
    edges: [
      { id: 'e-1', from: 'node-source', to: 'node-rules', label: 'WMS Stream' },
      { id: 'e-2', from: 'node-rules', to: 'node-conditional', label: 'Balanced SKUs' },
      { id: 'e-3', from: 'node-conditional', to: 'node-hitl', label: 'Critical Stock Deficit', variant: 'orange' },
      { id: 'e-4', from: 'node-conditional', to: 'node-router', label: 'Routine Replenishment', variant: 'purple' },
      { id: 'e-5', from: 'node-hitl', to: 'node-target', label: 'Manager Expedited', variant: 'green' },
      { id: 'e-6', from: 'node-router', to: 'node-target', label: 'Stock Reconciled', variant: 'green' },
      { id: 'e-7', from: 'node-router', to: 'node-quarantine', label: 'Count Discrepancies', variant: 'orange' }
    ],
    sourceConfig: {
      engine: 'aws_s3',
      host: 's3.us-east-1.amazonaws.com',
      port: '443',
      database: 'Parquet Snappy',
      user: 's3_wms_agent',
      password: '••••••••',
      table: 'inventory_levels.parquet',
      connectionUri: 's3://datax-enterprise-lake/wms-telemetry/inventory_levels.parquet'
    },
    targetConfig: {
      engine: 's4_hana',
      host: 's4h.corp.ondemand.com',
      port: '443',
      database: 'S4HANA_PRD',
      user: 'bapi_comm_user',
      password: '••••••••',
      table: 'inventory_reconciled_gold',
      quarantineTable: 'inventory_variance_dlq',
      writeMode: 'append',
      connectionUri: 'https://s4h.corp.ondemand.com/sap/bc/srt/rfc/sap/z_bapi_goodsmvt'
    },
    rules: [
      { id: 'r_sc_1', name: 'UPC/EAN Barcode Validity', field: 'sku_barcode', severity: 'Critical', code: "REGEX_MATCH(sku_barcode, '^[0-9]{12,14}$')", selected: true, desc: 'Standard GS1 compliant barcode format' },
      { id: 'r_sc_2', name: 'Stock On Hand Non-Negative', field: 'stock_on_hand', severity: 'Critical', code: 'stock_on_hand >= 0', selected: true, desc: 'Disallow corrupt phantom negative stock' },
      { id: 'r_sc_3', name: 'Safety Stock Threshold', field: 'stock_on_hand', severity: 'Warning', code: 'stock_on_hand >= safety_stock_min', selected: true, desc: 'Trigger reorder warning when stock drops below threshold' },
      { id: 'r_sc_4', name: 'Warehouse Bin Code Syntax', field: 'bin_location', severity: 'Warning', code: "REGEX_MATCH(bin_location, '^[A-Z]{2}-[0-9]{2}-[0-9]{2}$')", selected: true, desc: 'Valid aisle-rack-shelf bin identifier' }
    ]
  },

  // -----------------------------------------------------------------------
  // 9. TIER 4: Healthcare Patient Master & HIPAA Clinical Data Sanitizer
  // -----------------------------------------------------------------------
  healthcare_hipaa_clinical: {
    id: 'healthcare_hipaa_clinical',
    name: 'Healthcare Patient Master & HIPAA Clinical Sanitizer',
    category: 'Healthcare & Life Sciences',
    priority: 'Tier 4 (Regulated Compliance)',
    desc: 'Ingest EHR and clinical patient records from PostgreSQL, execute Safe Harbor PII redaction and National Provider Identifier (NPI) verification, gate records missing patient consent for Privacy Officer approval, and stage HIPAA-compliant clinical data to Google BigQuery.',
    nodes: [
      {
        id: 'node-source',
        type: 'source',
        x: 80,
        y: 180,
        width: 260,
        height: 135,
        title: 'Source Ingestion',
        system: 'PostgreSQL EHR Database',
        table: 'patients_clinical_raw',
        rowCount: '2,400 patients',
        status: 'Ready',
        variant: 'blue'
      },
      {
        id: 'node-rules',
        type: 'rules',
        x: 390,
        y: 180,
        width: 260,
        height: 135,
        title: 'HIPAA Sanitizer',
        system: 'Safe Harbor PII Masking',
        ruleCount: 5,
        aiModel: 'gpt-5-mini',
        status: 'De-Identification Active',
        variant: 'indigo'
      },
      {
        id: 'node-conditional',
        type: 'conditional',
        x: 700,
        y: 180,
        width: 260,
        height: 135,
        title: 'Conditional Router',
        system: 'Consent Status Check',
        table: 'Configured',
        status: 'Active',
        variant: 'purple'
      },
      {
        id: 'node-hitl',
        type: 'hitl',
        x: 1020,
        y: 90,
        width: 260,
        height: 135,
        title: 'Human in Loop',
        system: 'Hospital Privacy Officer',
        table: 'SLA: 12 hrs',
        status: 'Armed',
        variant: 'orange'
      },
      {
        id: 'node-router',
        type: 'router',
        x: 1020,
        y: 270,
        width: 260,
        height: 135,
        title: 'CleanFlow Router',
        system: 'De-Identification Filter',
        split: 'Sanitized · De-Identified · Violation',
        status: 'Active',
        variant: 'purple'
      },
      {
        id: 'node-bigquery',
        type: 'bigquery',
        x: 1340,
        y: 90,
        width: 260,
        height: 135,
        title: 'HIPAA Vault',
        system: 'Google BigQuery',
        table: 'patients_clean_gold',
        status: 'HIPAA Certified',
        variant: 'blue'
      },
      {
        id: 'node-quarantine',
        type: 'quarantine',
        x: 1340,
        y: 270,
        width: 260,
        height: 135,
        title: 'Breach Quarantine',
        system: 'HIPAA Audit Vault',
        table: 'patients_breach_quarantine',
        status: 'Audit Encrypted',
        variant: 'orange'
      }
    ],
    edges: [
      { id: 'e-1', from: 'node-source', to: 'node-rules', label: 'EHR Stream' },
      { id: 'e-2', from: 'node-rules', to: 'node-conditional', label: 'Redacted Records' },
      { id: 'e-3', from: 'node-conditional', to: 'node-hitl', label: 'Missing Consent Form', variant: 'orange' },
      { id: 'e-4', from: 'node-conditional', to: 'node-router', label: 'Consent Verified', variant: 'purple' },
      { id: 'e-5', from: 'node-hitl', to: 'node-bigquery', label: 'Privacy Officer Approved', variant: 'green' },
      { id: 'e-6', from: 'node-router', to: 'node-bigquery', label: 'HIPAA Compliant Gold', variant: 'green' },
      { id: 'e-7', from: 'node-router', to: 'node-quarantine', label: 'PII Exposure Anomalies', variant: 'orange' }
    ],
    sourceConfig: {
      engine: 'postgres',
      host: 'hipaa-vault.internal.net',
      port: '5432',
      database: 'clinical_raw',
      user: 'ehr_sync_agent',
      password: '••••••••',
      table: 'patients_clinical_raw',
      connectionUri: 'postgresql://ehr_sync_agent:••••••••@hipaa-vault.internal.net:5432/clinical_raw?sslmode=require'
    },
    targetConfig: {
      engine: 'bigquery',
      host: 'bigquery.googleapis.com',
      port: '443',
      database: 'clinical_warehouse',
      user: 'datax_svc@gcp.iam.gserviceaccount.com',
      password: '••••••••',
      table: 'patients_clean_gold',
      quarantineTable: 'patients_breach_quarantine',
      writeMode: 'append',
      connectionUri: 'bigquery://datax-healthcare-prd/clinical/patients_clean_gold'
    },
    rules: [
      { id: 'r_hc_1', name: 'HIPAA Safe Harbor De-ID', field: 'SSN', severity: 'Critical', code: 'SSN IS NULL AND CREDIT_CARD IS NULL', selected: true, desc: 'Strict prohibition of raw identifiers in analytics' },
      { id: 'r_hc_2', name: 'MRN Format Validity', field: 'MRN', severity: 'Critical', code: "REGEX_MATCH(MRN, '^MRN-[0-9]{6}$')", selected: true, desc: 'Valid institutional medical record number' },
      { id: 'r_hc_3', name: 'DOB Plausibility Guard', field: 'DOB', severity: 'Critical', code: "DOB < CURRENT_DATE() AND DOB > '1900-01-01'", selected: true, desc: 'Date of birth sanity check' },
      { id: 'r_hc_4', name: 'National Provider Identifier', field: 'NPI', severity: 'Critical', code: "REGEX_MATCH(NPI, '^[0-9]{10}$')", selected: true, desc: '10-digit CMS NPI provider validation' },
      { id: 'r_hc_5', name: 'HL7 Standard Gender Code', field: 'GENDER', severity: 'Warning', code: "GENDER IN ('M', 'F', 'O', 'U')", selected: true, desc: 'HL7 standard administrative sex value' }
    ]
  },

  // -----------------------------------------------------------------------
  // 10. TIER 5: Multi-Cloud Parquet Ingestion (Azure Blob -> BigQuery & Lakehouse)
  // -----------------------------------------------------------------------
  multicloud_parquet_lakehouse: {
    id: 'multicloud_parquet_lakehouse',
    name: 'Multi-Cloud Parquet Ingestion (Azure Blob → BigQuery)',
    category: 'Data Lakehouse & Warehouse',
    priority: 'Tier 5 (Big Data & Lakehouse)',
    desc: 'Ingest high-throughput Snappy-compressed Parquet event streams from Azure Blob Storage, guard against schema drift, deduplicate event timestamps, and multi-dispatch compliant records into Google BigQuery.',
    nodes: [
      {
        id: 'node-source',
        type: 'source',
        x: 80,
        y: 180,
        width: 260,
        height: 135,
        title: 'Source Ingestion',
        system: 'Azure Blob Storage',
        table: 'raw_events_stream.parquet',
        rowCount: '50,000 events',
        status: 'Ready',
        variant: 'blue'
      },
      {
        id: 'node-rules',
        type: 'rules',
        x: 400,
        y: 180,
        width: 260,
        height: 135,
        title: 'Schema Drift Guard',
        system: 'DuckDB Type Enforcer',
        ruleCount: 4,
        aiModel: 'gpt-5-mini',
        status: 'Active Coercion',
        variant: 'indigo'
      },
      {
        id: 'node-router',
        type: 'router',
        x: 720,
        y: 180,
        width: 260,
        height: 135,
        title: 'CleanFlow Router',
        system: 'High-Throughput Splitter',
        split: 'Valid Schema · Coerced · Corrupt',
        status: 'Active',
        variant: 'purple'
      },
      {
        id: 'node-bigquery',
        type: 'bigquery',
        x: 1040,
        y: 90,
        width: 260,
        height: 135,
        title: 'Target Cloud Warehouse',
        system: 'Google BigQuery',
        table: 'enterprise_events_clean',
        status: 'Streaming Ingestion',
        variant: 'blue'
      },
      {
        id: 'node-quarantine',
        type: 'quarantine',
        x: 1040,
        y: 270,
        width: 260,
        height: 135,
        title: 'Dead-Letter Parquet',
        system: 'Schema DLQ',
        table: 'events_corrupt_dlq',
        status: 'Isolated',
        variant: 'orange'
      }
    ],
    edges: [
      { id: 'e-1', from: 'node-source', to: 'node-rules', label: 'Parquet Stream' },
      { id: 'e-2', from: 'node-rules', to: 'node-router', label: 'Validated Stream' },
      { id: 'e-3', from: 'node-router', to: 'node-bigquery', label: 'Clean Analytical Events', variant: 'green' },
      { id: 'e-4', from: 'node-router', to: 'node-quarantine', label: 'Unparseable / Corrupt', variant: 'orange' }
    ],
    sourceConfig: {
      engine: 'azure_blob',
      host: 'azure-storage.blob.core.windows.net',
      port: 'telemetry-container',
      database: 'Azure Blob Snappy',
      user: 'azure_telemetry_client',
      password: '••••••••',
      table: 'raw_events_stream.parquet',
      connectionUri: 'https://azure-storage.blob.core.windows.net/telemetry-container/raw_events_stream.parquet'
    },
    targetConfig: {
      engine: 'bigquery',
      host: 'bigquery.googleapis.com',
      port: '443',
      database: 'enterprise_events',
      user: 'datax_svc@gcp.iam.gserviceaccount.com',
      password: '••••••••',
      table: 'enterprise_events_clean',
      quarantineTable: 'events_corrupt_dlq',
      writeMode: 'append',
      connectionUri: 'bigquery://datax-enterprise-prd/analytics/enterprise_events_clean'
    },
    rules: [
      { id: 'r_pl_1', name: 'Schema Column Count Guard', field: 'COLUMN_COUNT', severity: 'Critical', code: 'COLUMN_COUNT == EXPECTED_SCHEMA_COLUMNS', selected: true, desc: 'Detect upstream parquet schema drift immediately' },
      { id: 'r_pl_2', name: 'Partition Date Sanity', field: 'partition_date', severity: 'Critical', code: 'partition_date <= CURRENT_DATE()', selected: true, desc: 'Reject future-dated partition directories' },
      { id: 'r_pl_3', name: 'Payload MD5 Checksum', field: 'checksum', severity: 'Critical', code: 'checksum == CALCULATED_HASH', selected: true, desc: 'Verify bit-level data transfer integrity' },
      { id: 'r_pl_4', name: 'Primary Key Null Rate Zero', field: 'event_id', severity: 'Critical', code: 'event_id IS NOT NULL', selected: true, desc: 'Zero tolerance for null primary keys in lakehouse' }
    ]
  }
};

// Aliases for legacy compatibility
TEMPLATE_AUTOFILLS.healthcare_hipaa = TEMPLATE_AUTOFILLS.healthcare_hipaa_clinical;
TEMPLATE_AUTOFILLS.supply_chain = TEMPLATE_AUTOFILLS.supply_chain_inventory;

/**
 * Robust template resolver for any thread object, pack key, or string name.
 * Resolves against all 10 prioritized enterprise use cases.
 */
export const getWorkflowTemplate = (threadOrKey) => {
  if (!threadOrKey) return TEMPLATE_AUTOFILLS.sap_bw_s4hana;

  const key = typeof threadOrKey === 'string'
    ? threadOrKey.toLowerCase()
    : String(threadOrKey.packKey || threadOrKey.id || threadOrKey.name || '').toLowerCase();

  if (TEMPLATE_AUTOFILLS[key]) return TEMPLATE_AUTOFILLS[key];

  if (key.includes('rag') || key.includes('contract') || key.includes('policy')) return TEMPLATE_AUTOFILLS.enterprise_rag_knowledge;
  if (key.includes('salesforce') || key.includes('sfdc') || key.includes('lead') || key.includes('opp')) return TEMPLATE_AUTOFILLS.salesforce_crm_bigquery;
  if (key.includes('telemetry') || key.includes('sre') || key.includes('incident') || key.includes('blob')) return TEMPLATE_AUTOFILLS.support_telemetry_vector;
  if (key.includes('snowflake') || key.includes('spend')) return TEMPLATE_AUTOFILLS.snowflake_s4hana_procurement;
  if (key.includes('supply') || key.includes('inventory') || key.includes('wms') || key.includes('sku')) return TEMPLATE_AUTOFILLS.supply_chain_inventory;
  if (key.includes('hipaa') || key.includes('health') || key.includes('patient') || key.includes('clinical') || key.includes('ehr')) return TEMPLATE_AUTOFILLS.healthcare_hipaa_clinical;
  if (key.includes('parquet') || key.includes('lakehouse') || key.includes('multicloud')) return TEMPLATE_AUTOFILLS.multicloud_parquet_lakehouse;
  if (key.includes('customer') || key.includes('mongo') || key.includes('identity')) return TEMPLATE_AUTOFILLS.customer_master_reconciliation;
  if (key.includes('gl') || key.includes('ledger') || key.includes('financial') || key.includes('sox')) return TEMPLATE_AUTOFILLS.financial_gl_ledger;

  return TEMPLATE_AUTOFILLS.sap_bw_s4hana;
};
