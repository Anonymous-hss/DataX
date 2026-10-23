// =========================================================================
// ENTERPRISE WORKFLOW TEMPLATES & AUTOFILL CATALOG
// Standard 5-node complete operational pipelines for all domain packs
// =========================================================================

export const TEMPLATE_AUTOFILLS = {
  // 1. SAP BW -> S/4HANA Clean Core
  sap_bw_s4hana: {
    name: 'SAP BW → S/4HANA Clean Core',
    category: 'ERP Modernization',
    nodes: [
      {
        id: 'node-source',
        type: 'source',
        x: 80,
        y: 160,
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
        x: 410,
        y: 160,
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
        id: 'node-router',
        type: 'router',
        x: 740,
        y: 160,
        width: 240,
        height: 135,
        title: 'CleanFlow Router',
        system: '3-Way Stream Splitter',
        split: 'Clean · Fixed · Quarantined',
        status: 'Active',
        variant: 'purple'
      },
      {
        id: 'node-target',
        type: 'target',
        x: 1060,
        y: 80,
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
        x: 1060,
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
      { id: 'e-2', from: 'node-rules', to: 'node-router', label: 'Evaluated' },
      { id: 'e-3', from: 'node-router', to: 'node-target', label: 'Compliant & Auto-Fixed', variant: 'green' },
      { id: 'e-4', from: 'node-router', to: 'node-quarantine', label: 'Critical Violations', variant: 'orange' }
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
    }
  },

  // 2. Customer Master & Identity Harmonizer
  customer_master_reconciliation: {
    name: 'Customer Master & Identity Harmonizer',
    category: 'Customer 360',
    nodes: [
      {
        id: 'node-source',
        type: 'source',
        x: 80,
        y: 160,
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
        id: 'node-rules',
        type: 'rules',
        x: 410,
        y: 160,
        width: 260,
        height: 135,
        title: 'AI Identity Rules',
        system: 'RFC-5322 & Deduplication',
        ruleCount: 5,
        aiModel: 'gpt-5-mini',
        status: 'Auto-Fix Armed',
        variant: 'indigo'
      },
      {
        id: 'node-router',
        type: 'router',
        x: 740,
        y: 160,
        width: 240,
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
        x: 1060,
        y: 80,
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
        x: 1060,
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
      { id: 'e-1', from: 'node-source', to: 'node-rules' },
      { id: 'e-2', from: 'node-rules', to: 'node-router' },
      { id: 'e-3', from: 'node-router', to: 'node-target', label: 'Golden Records', variant: 'green' },
      { id: 'e-4', from: 'node-router', to: 'node-quarantine', label: 'Unresolved Duplicates', variant: 'orange' }
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
    }
  },

  // 3. Financial GL & AP Compliance (SOX)
  financial_gl_ledger: {
    name: 'Financial GL & AP Compliance',
    category: 'Finance & Audit',
    nodes: [
      {
        id: 'node-source',
        type: 'source',
        x: 80,
        y: 160,
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
        x: 410,
        y: 160,
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
        id: 'node-router',
        type: 'router',
        x: 740,
        y: 160,
        width: 240,
        height: 135,
        title: 'CleanFlow Router',
        system: 'Ledger Balancer',
        split: 'Balanced · Repaired · Imbalanced',
        status: 'Active',
        variant: 'purple'
      },
      {
        id: 'node-target',
        type: 'target',
        x: 1060,
        y: 80,
        width: 260,
        height: 135,
        title: 'Reconciled Core',
        system: 'Financial Core ERP & Audit',
        table: 'gl_ledger_gold',
        status: 'Audit Approved',
        variant: 'green'
      },
      {
        id: 'node-quarantine',
        type: 'quarantine',
        x: 1060,
        y: 270,
        width: 260,
        height: 135,
        title: 'Suspense Account',
        system: 'SOX Imbalance Ledger',
        table: 'gl_suspense_quarantine',
        status: 'CFO Approval Needed',
        variant: 'orange'
      }
    ],
    edges: [
      { id: 'e-1', from: 'node-source', to: 'node-rules' },
      { id: 'e-2', from: 'node-rules', to: 'node-router' },
      { id: 'e-3', from: 'node-router', to: 'node-target', label: 'Balanced Journal Entries', variant: 'green' },
      { id: 'e-4', from: 'node-router', to: 'node-quarantine', label: 'Imbalance Suspense', variant: 'orange' }
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
      engine: 'postgres',
      host: 'ep-neon-fin.us-east-2.aws.neon.tech',
      port: '5432',
      database: 'erp_finance',
      user: 'sox_audit_user',
      password: '••••••••',
      table: 'gl_ledger_gold',
      quarantineTable: 'gl_suspense_quarantine',
      writeMode: 'append',
      connectionUri: 'postgresql://sox_audit_user:••••••••@ep-neon-fin.us-east-2.aws.neon.tech:5432/erp_finance?sslmode=require'
    }
  },

  // 4. Healthcare Patient Master & HIPAA Sanitizer
  healthcare_hipaa: {
    name: 'Healthcare Patient Master & HIPAA Sanitizer',
    category: 'Healthcare & Life Sciences',
    nodes: [
      {
        id: 'node-source',
        type: 'source',
        x: 80,
        y: 160,
        width: 260,
        height: 135,
        title: 'Source Ingestion',
        system: 'HL7 & EHR Clinical Data',
        table: 'patients_raw',
        rowCount: '500 records',
        status: 'Ready',
        variant: 'blue'
      },
      {
        id: 'node-rules',
        type: 'rules',
        x: 410,
        y: 160,
        width: 260,
        height: 135,
        title: 'HIPAA Sanitizer',
        system: 'Safe Harbor PII Masking',
        ruleCount: 4,
        aiModel: 'gpt-5-mini',
        status: 'Redaction Active',
        variant: 'indigo'
      },
      {
        id: 'node-router',
        type: 'router',
        x: 740,
        y: 160,
        width: 240,
        height: 135,
        title: 'CleanFlow Router',
        system: 'De-Identification Filter',
        split: 'Sanitized · De-Identified · Violation',
        status: 'Active',
        variant: 'purple'
      },
      {
        id: 'node-target',
        type: 'target',
        x: 1060,
        y: 80,
        width: 260,
        height: 135,
        title: 'HIPAA Vault',
        system: 'Analytics Lakehouse Gold',
        table: 'patients_sanitized',
        status: 'HIPAA Compliant',
        variant: 'green'
      },
      {
        id: 'node-quarantine',
        type: 'quarantine',
        x: 1060,
        y: 270,
        width: 260,
        height: 135,
        title: 'PII Isolation Store',
        system: 'HIPAA Breach Quarantine',
        table: 'patients_quarantine',
        status: 'Audit Encrypted',
        variant: 'orange'
      }
    ],
    edges: [
      { id: 'e-1', from: 'node-source', to: 'node-rules' },
      { id: 'e-2', from: 'node-rules', to: 'node-router' },
      { id: 'e-3', from: 'node-router', to: 'node-target', label: 'Masked HIPAA Vault', variant: 'green' },
      { id: 'e-4', from: 'node-router', to: 'node-quarantine', label: 'Breach Anomalies', variant: 'orange' }
    ],
    sourceConfig: {
      engine: 'postgres',
      host: 'hipaa-vault.internal.net',
      port: '5432',
      database: 'clinical_raw',
      user: 'ehr_sync_agent',
      password: '••••••••',
      table: 'patients_raw',
      connectionUri: 'postgresql://ehr_sync_agent:••••••••@hipaa-vault.internal.net:5432/clinical_raw?sslmode=require'
    },
    targetConfig: {
      engine: 'postgres',
      host: 'hipaa-vault.internal.net',
      port: '5432',
      database: 'clinical_sanitized',
      user: 'ehr_sync_agent',
      password: '••••••••',
      table: 'patients_gold',
      quarantineTable: 'patients_quarantine',
      writeMode: 'append',
      connectionUri: 'postgresql://ehr_sync_agent:••••••••@hipaa-vault.internal.net:5432/clinical_sanitized?sslmode=require'
    }
  },

  // 5. Supply Chain Multi-Echelon Inventory Balancer
  supply_chain: {
    name: 'Supply Chain Multi-Echelon Inventory Balancer',
    category: 'Supply Chain & Logistics',
    nodes: [
      {
        id: 'node-source',
        type: 'source',
        x: 80,
        y: 160,
        width: 260,
        height: 135,
        title: 'Source Ingestion',
        system: 'WMS Logistics Warehouse',
        table: 'inventory_counts_raw',
        rowCount: '3,450 SKUs',
        status: 'Ready',
        variant: 'blue'
      },
      {
        id: 'node-rules',
        type: 'rules',
        x: 410,
        y: 160,
        width: 260,
        height: 135,
        title: 'Inventory Rules',
        system: 'SKU Discrepancy & Safety Stock',
        ruleCount: 4,
        aiModel: 'gpt-5-mini',
        status: 'Auto-Fix Armed',
        variant: 'indigo'
      },
      {
        id: 'node-router',
        type: 'router',
        x: 740,
        y: 160,
        width: 240,
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
        x: 1060,
        y: 80,
        width: 260,
        height: 135,
        title: 'Target ERP',
        system: 'SAP S/4HANA Supply Chain',
        table: 'inventory_reconciled',
        status: 'Ready to Commit',
        variant: 'green'
      },
      {
        id: 'node-quarantine',
        type: 'quarantine',
        x: 1060,
        y: 270,
        width: 260,
        height: 135,
        title: 'Discrepancy Store',
        system: 'Shrinkage & Audit Vault',
        table: 'inventory_variance_quarantine',
        status: 'Review Required',
        variant: 'orange'
      }
    ],
    edges: [
      { id: 'e-1', from: 'node-source', to: 'node-rules' },
      { id: 'e-2', from: 'node-rules', to: 'node-router' },
      { id: 'e-3', from: 'node-router', to: 'node-target', label: 'Balanced Stock', variant: 'green' },
      { id: 'e-4', from: 'node-router', to: 'node-quarantine', label: 'High Variance SKUs', variant: 'orange' }
    ],
    sourceConfig: {
      engine: 'postgres',
      host: 'wms.supplychain.internal',
      port: '5432',
      database: 'wms_inventory',
      user: 'wms_reader',
      password: '••••••••',
      table: 'inventory_counts_raw',
      connectionUri: 'postgresql://wms_reader:••••••••@wms.supplychain.internal:5432/wms_inventory?sslmode=require'
    },
    targetConfig: {
      engine: 's4_hana',
      host: 's4h.corp.ondemand.com',
      port: '443',
      database: 'S4HANA_PRD',
      user: 'bapi_comm_user',
      password: '••••••••',
      table: 'inventory_reconciled',
      quarantineTable: 'inventory_variance_quarantine',
      writeMode: 'append',
      connectionUri: 'https://s4h.corp.ondemand.com/sap/bc/srt/rfc/sap/z_bapi_inventory'
    }
  }
};

/**
 * Robust template resolver for any thread object, pack key, or string name.
 * Always guarantees returning a rich 5-node complete operational pipeline.
 */
export const getWorkflowTemplate = (threadOrKey) => {
  if (!threadOrKey) return TEMPLATE_AUTOFILLS.sap_bw_s4hana;

  if (typeof threadOrKey === 'string') {
    const k = threadOrKey.toLowerCase();
    if (TEMPLATE_AUTOFILLS[k]) return TEMPLATE_AUTOFILLS[k];
    if (k.includes('customer') || k.includes('user')) return TEMPLATE_AUTOFILLS.customer_master_reconciliation;
    if (k.includes('gl') || k.includes('ledger') || k.includes('finan') || k.includes('sox')) return TEMPLATE_AUTOFILLS.financial_gl_ledger;
    if (k.includes('hipaa') || k.includes('health') || k.includes('patient')) return TEMPLATE_AUTOFILLS.healthcare_hipaa;
    if (k.includes('supply') || k.includes('inventory')) return TEMPLATE_AUTOFILLS.supply_chain;
    return TEMPLATE_AUTOFILLS.sap_bw_s4hana;
  }

  // Object
  const id = String(threadOrKey.id || '').toLowerCase();
  const packKey = String(threadOrKey.packKey || threadOrKey.domainPackId || '').toLowerCase();
  const name = String(threadOrKey.name || '').toLowerCase();

  if (packKey && TEMPLATE_AUTOFILLS[packKey]) return TEMPLATE_AUTOFILLS[packKey];
  if (id && TEMPLATE_AUTOFILLS[id]) return TEMPLATE_AUTOFILLS[id];

  if (packKey.includes('customer') || id.includes('customer') || name.includes('customer')) {
    return TEMPLATE_AUTOFILLS.customer_master_reconciliation;
  }
  if (packKey.includes('gl') || packKey.includes('ledger') || packKey.includes('financial') || id.includes('financial') || name.includes('ledger') || name.includes('financial') || name.includes('sox')) {
    return TEMPLATE_AUTOFILLS.financial_gl_ledger;
  }
  if (packKey.includes('hipaa') || packKey.includes('health') || id.includes('health') || id.includes('hipaa') || name.includes('health') || name.includes('patient')) {
    return TEMPLATE_AUTOFILLS.healthcare_hipaa;
  }
  if (packKey.includes('supply') || id.includes('supply') || name.includes('supply') || name.includes('inventory')) {
    return TEMPLATE_AUTOFILLS.supply_chain;
  }

  return TEMPLATE_AUTOFILLS.sap_bw_s4hana;
};
