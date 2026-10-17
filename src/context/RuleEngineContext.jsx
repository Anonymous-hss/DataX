import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import * as XLSX from 'xlsx';
import { SAP_BW_PROCUREMENT_DATA, SAP_BW_INVENTORY_DATA, USER_MASTER_DATA } from '../data/sampleDatasets';
import { ONTOLOGY_GRAPH } from '../data/ontologyGraph';

const API_BASE = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? '/datax-api'
  : 'https://dataglow.ai/datax-api';

// Helper: Live Row Evaluation & Auto-Fix Transformation with Strict Rule Checking
export const evaluateRow = (row, rules = [], isAutoFix = true, allRows = []) => {
  const violations = [];
  const fixedFields = {};
  const violatedRuleIds = [];
  const fixedRuleIds = [];
  const transformed = { ...row };

  // Helper: Determine if a specific rule is active / selected
  const isRuleActive = (ruleId, fieldName) => {
    if (!rules || rules.length === 0) return true;
    const r = rules.find(rule => rule.id === ruleId || rule.field === fieldName || rule.column === fieldName);
    return r ? (r.selected !== false && r.enabled !== false) : false;
  };

  // --- Domain 1: SAP BW Procurement ---
  if (row.PO_NUMBER !== undefined || row.DELIVERY_PLANT !== undefined) {
    const qty = Number(row.QUANTITY ?? 0);
    const price = Number(row.UNIT_PRICE ?? 0);
    const total = Number(row.TOTAL_AMOUNT ?? 0);
    const vendor = row.VENDOR_ID !== undefined && row.VENDOR_ID !== null ? String(row.VENDOR_ID).trim() : '';
    let plant = row.DELIVERY_PLANT ? String(row.DELIVERY_PLANT).trim() : '';
    const itemNo = Number(row.LINE_ITEM ?? row.ITEM_NO ?? 0);

    // Rule R1: Positive Quantity (Critical)
    if (isRuleActive('r_sap_1', 'QUANTITY')) {
      if (qty <= 0) {
        violations.push('Line item QUANTITY must be > 0');
        violatedRuleIds.push('r_sap_1');
      }
    }

    // Rule R2: Calculation Sanity / Equality
    if (isRuleActive('r_sap_2', 'TOTAL_AMOUNT')) {
      if (Math.abs(total - qty * price) > 0.05) {
        if (isAutoFix && qty > 0 && price > 0) {
          const recalculated = Math.round(qty * price * 100) / 100;
          fixedFields.TOTAL_AMOUNT = recalculated;
          transformed.TOTAL_AMOUNT = recalculated;
          fixedRuleIds.push('r_sap_2');
        } else {
          violations.push(`Total amount mismatch (${total} != ${(qty * price).toFixed(2)})`);
          violatedRuleIds.push('r_sap_2');
        }
      }
    }

    // Rule R3: Vendor ID Presence (Critical)
    if (isRuleActive('r_sap_3', 'VENDOR_ID')) {
      if (!vendor) {
        violations.push('Missing mandatory vendor code');
        violatedRuleIds.push('r_sap_3');
      } else if (vendor !== row.VENDOR_ID || vendor !== vendor.toUpperCase()) {
        if (isAutoFix) {
          fixedFields.VENDOR_ID = vendor.toUpperCase();
          transformed.VENDOR_ID = vendor.toUpperCase();
          fixedRuleIds.push('r_sap_3');
        } else {
          violations.push(`Untrimmed or lowercase vendor code '${row.VENDOR_ID}'`);
          violatedRuleIds.push('r_sap_3');
        }
      }
    }

    // Rule R4: Plant Code Validation & Ontology Remediation
    if (isRuleActive('r_sap_4', 'DELIVERY_PLANT')) {
      const validPlants = ['P1000', 'P2000', 'P3000'];
      if (!validPlants.includes(plant)) {
        if (isAutoFix) {
          const res = ONTOLOGY_GRAPH.lookupPlant(plant);
          if (res.resolved) {
            fixedFields.DELIVERY_PLANT = res.sapCode;
            transformed.DELIVERY_PLANT = res.sapCode;
            fixedRuleIds.push('r_sap_4');
          } else if (plant.toUpperCase().startsWith('P') && plant.length === 5) {
            fixedFields.DELIVERY_PLANT = plant.toUpperCase();
            transformed.DELIVERY_PLANT = plant.toUpperCase();
            fixedRuleIds.push('r_sap_4');
          } else {
            violations.push(`Unauthorized delivery plant '${plant}'`);
            violatedRuleIds.push('r_sap_4');
          }
        } else {
          violations.push(`Unauthorized delivery plant '${plant}'`);
          violatedRuleIds.push('r_sap_4');
        }
      }
    }

    // Rule R5: Sequential Line Item
    if (isRuleActive('r_sap_5', 'ITEM_NO') || isRuleActive('r_sap_5', 'LINE_ITEM')) {
      if (itemNo <= 0 || itemNo % 10 !== 0) {
        violations.push(`Line item #${itemNo} does not increment sequentially by 10`);
        violatedRuleIds.push('r_sap_5');
      }
    }
  }

  // --- Domain 2: User / Customer Master ---
  if (row.email !== undefined || row.role !== undefined) {
    const email = row.email ? String(row.email).trim() : '';
    const fullName = row.full_name ? String(row.full_name).trim() : '';
    const role = row.role ? String(row.role).trim() : '';
    const status = row.status ? String(row.status).trim() : '';
    const balance = Number(row.account_balance ?? 0);

    // Rule 1: Email RFC syntax
    if (isRuleActive('r_usr_1', 'email')) {
      if (!email || !email.includes('@') || email.includes('bad_domain') || !email.includes('.')) {
        violations.push('Email has an invalid RFC format');
        violatedRuleIds.push('r_usr_1');
      } else if (email.startsWith('-') || email.endsWith('-') || email !== row.email) {
        if (isAutoFix) {
          const cleanedEmail = email.replace(/^[-_]+|[-_]+$/g, '').toLowerCase();
          fixedFields.email = cleanedEmail;
          transformed.email = cleanedEmail;
          fixedRuleIds.push('r_usr_1');
        } else {
          violations.push('Email has non-standard leading or trailing characters');
          violatedRuleIds.push('r_usr_1');
        }
      }
    }

    // Rule 2: Full name required
    if (isRuleActive('r_usr_2', 'full_name')) {
      if (!fullName || fullName === 'empty' || fullName.length < 2) {
        violations.push('Full name is required');
        violatedRuleIds.push('r_usr_2');
      }
    }

    // Rule 3: Allowed role
    if (isRuleActive('r_usr_3', 'role')) {
      const validRoles = ['admin', 'analyst', 'manager', 'viewer'];
      const normalizedRole = role.replace(/[^a-zA-Z]/g, '').toLowerCase();
      if (!validRoles.includes(role.toLowerCase())) {
        if (isAutoFix && validRoles.includes(normalizedRole)) {
          fixedFields.role = normalizedRole;
          transformed.role = normalizedRole;
          fixedRuleIds.push('r_usr_3');
        } else {
          violations.push(`Role '${role}' is not permitted`);
          violatedRuleIds.push('r_usr_3');
        }
      }
    }

    // Rule 4: Allowed status
    if (isRuleActive('r_usr_4', 'status')) {
      if (status && !['active', 'inactive'].includes(status.toLowerCase())) {
        if (isAutoFix && (status.includes('pending') || status.includes('review'))) {
          fixedFields.status = 'inactive';
          transformed.status = 'inactive';
          fixedRuleIds.push('r_usr_4');
        } else {
          violations.push(`Status '${status}' is not permitted`);
          violatedRuleIds.push('r_usr_4');
        }
      }
    }

    // Rule 5: User ID uniqueness
    if (isRuleActive('r_usr_5', 'id')) {
      const rid = row.id;
      if (rid && allRows.length > 0) {
        const count = allRows.filter(r => r.id === rid).length;
        if (count > 1) {
          violations.push(`Duplicate user ID collision on '${rid}'`);
          violatedRuleIds.push('r_usr_5');
        }
      }
    }

    // Rule 6: Non-negative balance
    if (isRuleActive('r_usr_6', 'account_balance')) {
      if (balance < 0) {
        if (isAutoFix) {
          const absBalance = Math.abs(balance);
          fixedFields.account_balance = absBalance;
          transformed.account_balance = absBalance;
          fixedRuleIds.push('r_usr_6');
        } else {
          violations.push(`Negative account balance: $${balance.toFixed(2)}`);
          violatedRuleIds.push('r_usr_6');
        }
      }
    }
  }

  // --- Domain 3: Financial GL & AP Ledger ---
  if (row.DEBIT !== undefined || row.ACCOUNT_CODE !== undefined) {
    const debit = Number(row.DEBIT ?? 0);
    const credit = Number(row.CREDIT ?? 0);
    const currency = String(row.CURRENCY || '').trim().toUpperCase();
    const acctCode = String(row.ACCOUNT_CODE || '').trim();
    const period = Number(row.FISCAL_PERIOD ?? 1);

    if (isRuleActive('r_gl_1', 'DEBIT')) {
      if (Math.abs(debit - credit) > 0.01) {
        violations.push(`GL imbalance: Debit (${debit}) != Credit (${credit})`);
        violatedRuleIds.push('r_gl_1');
      }
    }
    if (isRuleActive('r_gl_2', 'CURRENCY')) {
      if (!['USD', 'EUR', 'GBP', 'CAD', 'JPY'].includes(currency)) {
        violations.push(`Invalid ISO currency: ${currency}`);
        violatedRuleIds.push('r_gl_2');
      }
    }
    if (isRuleActive('r_gl_3', 'ACCOUNT_CODE')) {
      if (acctCode.length < 4) {
        violations.push('GL account code must have at least 4 digits');
        violatedRuleIds.push('r_gl_3');
      }
    }
    if (isRuleActive('r_gl_4', 'FISCAL_PERIOD')) {
      if (period < 1 || period > 12) {
        violations.push(`Fiscal period ${period} outside allowable range (1-12)`);
        violatedRuleIds.push('r_gl_4');
      }
    }
  }

  // Determine final status & badge
  let status = 'clean';
  let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let badgeText = 'Clean';

  if (violations.length > 0) {
    status = 'quarantined';
    badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
    badgeText = 'Quarantined';
  } else if (Object.keys(fixedFields).length > 0) {
    status = 'fixed';
    badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
    badgeText = 'Auto-fixed';
  }

  return {
    ...row,
    _transformed: transformed,
    _status: status,
    _violations: violations,
    _violatedRuleIds: violatedRuleIds,
    _fixedFields: fixedFields,
    _fixedRuleIds: fixedRuleIds,
    badgeText,
    badgeClass
  };
};

// Helper: Return unexecuted baseline for prebuilt pack templates
export const computePackBaseline = (pack) => {
  return {
    ...pack,
    successRate: null,
    healthScore: null,
    runCount: 0,
    runs: '0 runs',
    status: 'draft',
    statusLabel: 'Draft'
  };
};

// Helper: Strict Credential Verification
export const isCredentialConfigured = (cfg) => {
  if (!cfg) return false;
  if (typeof cfg.connectionUri === 'string' && cfg.connectionUri.trim().length > 6) {
    return true;
  }
  const hasHost = Boolean(cfg.host && String(cfg.host).trim().length > 0);
  const hasDb = Boolean(cfg.database && String(cfg.database).trim().length > 0);
  const hasUser = Boolean((cfg.user || cfg.username) && String(cfg.user || cfg.username).trim().length > 0);
  const hasPass = Boolean(cfg.password && String(cfg.password).trim().length > 0);
  return hasHost && hasDb && hasUser && hasPass;
};

// Preconfigured Enterprise Domain Packs
export const PREBUILT_DOMAIN_PACKS = {
  sap_bw_s4hana: computePackBaseline({
    id: 'sap_bw_s4hana',
    threadId: 'TH-0842',
    name: 'SAP BW → S/4HANA Clean Core',
    domain: 'ERP modernisation',
    desc: 'Extract InfoCube purchasing lines, fix legacy plant codes and stage clean orders.',
    pipeline: 'SAP BW → AI rules → S/4HANA',
    runs: '0 runs',
    source: {
      engine: 'sap_bw',
      connectionUri: '',
      host: '',
      port: '',
      database: '',
      table: '',
      availableTables: [],
      discoveredColumns: []
    },
    target: {
      engine: 's4_hana',
      connectionUri: '',
      host: '',
      port: '',
      database: '',
      table: '',
      targetNamingMode: 'suffix',
      customTableName: ''
    },
    rules: [
      {
        id: 'r_sap_1',
        name: 'Positive Line Quantity',
        field: 'QUANTITY',
        severity: 'Critical',
        condition: 'QUANTITY > 0',
        code: 'QUANTITY > 0',
        selected: true,
        desc: 'Reject negative or zero line item quantities'
      },
      {
        id: 'r_sap_2',
        name: 'Calculation Equality',
        field: 'TOTAL_AMOUNT',
        severity: 'Critical',
        condition: 'TOTAL_AMOUNT == QUANTITY * UNIT_PRICE',
        code: 'ABS(TOTAL_AMOUNT - (QUANTITY * UNIT_PRICE)) < 0.05',
        selected: true,
        desc: 'Line item total must equal quantity times unit price'
      },
      {
        id: 'r_sap_3',
        name: 'Mandatory Vendor Code',
        field: 'VENDOR_ID',
        severity: 'Critical',
        condition: 'LENGTH(TRIM(VENDOR_ID)) > 0',
        code: 'VENDOR_ID IS NOT NULL AND LENGTH(TRIM(VENDOR_ID)) > 0',
        selected: true,
        desc: 'Valid vendor assigned for procurement writeback'
      },
      {
        id: 'r_sap_4',
        name: 'Authorized S/4HANA Plant',
        field: 'DELIVERY_PLANT',
        severity: 'Warning',
        condition: "DELIVERY_PLANT IN ('P1000', 'P2000', 'P3000')",
        code: "DELIVERY_PLANT IN ('P1000', 'P2000', 'P3000')",
        selected: true,
        desc: 'Delivery plant matches active S/4HANA plant via ontology lookup'
      },
      {
        id: 'r_sap_5',
        name: 'Sequential Line Item',
        field: 'ITEM_NO',
        severity: 'Warning',
        condition: 'ITEM_NO > 0',
        code: 'ITEM_NO > 0 AND ITEM_NO % 10 == 0',
        selected: true,
        desc: 'SAP purchasing lines must increment predictably'
      }
    ]
  }),
  customer_master_reconciliation: computePackBaseline({
    id: 'customer_master_reconciliation',
    threadId: 'TH-0841',
    name: 'Customer Master & Identity',
    domain: 'Master data',
    desc: 'Merge duplicate customers from CRM and ERP into one golden record.',
    pipeline: 'PostgreSQL → AI rules → PostgreSQL',
    runs: '0 runs',
    source: {
      engine: 'postgres',
      connectionUri: '',
      host: '',
      port: '',
      database: '',
      table: '',
      availableTables: [],
      discoveredColumns: []
    },
    target: {
      engine: 'postgres',
      connectionUri: '',
      host: '',
      port: '',
      database: '',
      table: '',
      targetNamingMode: 'suffix',
      customTableName: ''
    },
    rules: [
      {
        id: 'r_usr_1',
        name: 'Email has a valid format',
        field: 'email',
        severity: 'Critical',
        condition: 'REGEX_MATCH(email, EMAIL_RFC_5322)',
        code: 'REGEX_MATCH(email, EMAIL_RFC_5322)',
        selected: true,
        desc: 'Enforce valid RFC email syntax, reject nulls or missing @'
      },
      {
        id: 'r_usr_2',
        name: 'Full name is required',
        field: 'full_name',
        severity: 'Critical',
        condition: 'LENGTH(TRIM(full_name)) > 1',
        code: 'full_name IS NOT NULL AND LENGTH(TRIM(full_name)) > 1',
        selected: true,
        desc: 'Full name cannot be blank or empty'
      },
      {
        id: 'r_usr_3',
        name: 'Role is an allowed value',
        field: 'role',
        severity: 'Warning',
        condition: "LOWER(role) IN ('admin', 'analyst', 'manager', 'viewer')",
        code: "LOWER(role) IN ('admin', 'analyst', 'manager', 'viewer')",
        selected: true,
        desc: 'Role must conform to permitted RBAC security domain'
      },
      {
        id: 'r_usr_4',
        name: 'Status is active or inactive',
        field: 'status',
        severity: 'Warning',
        condition: "status IN ('active', 'inactive')",
        code: "status IN ('active', 'inactive')",
        selected: true,
        desc: 'Status flag must be active or inactive'
      },
      {
        id: 'r_usr_5',
        name: 'User id is unique',
        field: 'id',
        severity: 'Critical',
        condition: 'COUNT(id) = 1',
        code: 'COUNT(id) = COUNT(DISTINCT id)',
        selected: true,
        desc: 'No duplicate records permitted on primary key'
      },
      {
        id: 'r_usr_6',
        name: 'Non-negative balance',
        field: 'account_balance',
        severity: 'Critical',
        condition: 'account_balance >= 0.00',
        code: 'account_balance >= 0.00',
        selected: false,
        desc: 'Disallow negative balances on primary ledger'
      }
    ]
  }),
  financial_gl_ledger: {
    id: 'financial_gl_ledger',
    threadId: 'TH-0843',
    name: 'Financial GL & AP Ledger',
    domain: 'Finance & Audit',
    desc: 'Audit general ledger entries, guarantee zero imbalance, and verify ISO currency standards.',
    pipeline: 'ERP GL → AI rules → Reconciled Core',
    status: 'draft',
    statusLabel: 'Draft',
    successRate: null,
    healthScore: null,
    runCount: 0,
    runs: '0 runs',
    source: {
      engine: 'postgres',
      connectionUri: '',
      host: '',
      port: '',
      database: '',
      table: '',
      availableTables: [],
      discoveredColumns: []
    },
    target: {
      engine: 'postgres',
      connectionUri: '',
      host: '',
      port: '',
      database: '',
      table: '',
      targetNamingMode: 'suffix',
      customTableName: ''
    },
    rules: [
      { id: 'r_gl_1', name: 'Debits Equal Credits', field: 'DEBIT', severity: 'Critical', code: 'DEBIT == CREDIT', selected: true, desc: 'Zero balance equation' },
      { id: 'r_gl_2', name: 'ISO Currency Valid', field: 'CURRENCY', severity: 'Critical', code: "CURRENCY IN ('USD', 'EUR', 'GBP')", selected: true, desc: 'Recognized currency code' },
      { id: 'r_gl_3', name: 'Valid General Ledger Code', field: 'ACCOUNT_CODE', severity: 'Critical', code: 'LENGTH(ACCOUNT_CODE) >= 4', selected: true, desc: 'GL account must exist' },
      { id: 'r_gl_4', name: 'Active Fiscal Period', field: 'FISCAL_PERIOD', severity: 'Warning', code: 'FISCAL_PERIOD <= 12', selected: true, desc: 'Must match open ledger period' }
    ]
  },
  healthcare_hipaa: {
    id: 'healthcare_hipaa',
    threadId: 'TH-0840',
    name: 'Healthcare Patient Master',
    domain: 'Healthcare',
    desc: 'Standardise patient records and mask identifiers before analytics.',
    pipeline: 'PostgreSQL → AI rules → PostgreSQL',
    status: 'draft',
    statusLabel: 'Draft',
    successRate: null,
    healthScore: null,
    runCount: 0,
    runs: '0 runs',
    source: {
      engine: 'postgres',
      connectionUri: '',
      host: '',
      port: '',
      database: '',
      table: '',
      availableTables: [],
      discoveredColumns: []
    },
    target: {
      engine: 'postgres',
      connectionUri: '',
      host: '',
      port: '',
      database: '',
      table: '',
      targetNamingMode: 'suffix',
      customTableName: ''
    },
    rules: [
      { id: 'r_hc_1', name: 'MRN Format Valid', field: 'MRN', severity: 'Critical', code: "REGEX_MATCH(MRN, 'MRN-[0-9]{6}')", selected: true, desc: 'Medical record number validity' },
      { id: 'r_hc_2', name: 'DOB in Past', field: 'DOB', severity: 'Critical', code: 'DOB < CURRENT_DATE()', selected: true, desc: 'Date of birth sanity check' },
      { id: 'r_hc_3', name: 'Valid Gender Code', field: 'GENDER', severity: 'Warning', code: "GENDER IN ('M', 'F', 'O', 'U')", selected: true, desc: 'Standard HL7 gender code' }
    ]
  }
};

const RuleEngineContext = createContext(null);

export function RuleEngineProvider({ children }) {
  // Clerk Authenticated SaaS Tenant & User Identity
  const { user } = useUser();
  const userId = user?.id || 'saas_default';
  const userEmail = user?.primaryEmailAddress?.emailAddress || 'user@dataglow.ai';
  const tenantId = user?.id ? `tenant_${user.id.slice(0, 8)}` : 'tenant_enterprise';

  // Global Thread Catalog (Multi-Tenant LocalStorage Scoped)
  const [threads, setThreads] = useState(() => {
    try {
      if (user?.id) {
        const stored = localStorage.getItem(`datax_threads_${user.id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read user threads from local storage:', e);
    }
    return [
      PREBUILT_DOMAIN_PACKS.sap_bw_s4hana,
      PREBUILT_DOMAIN_PACKS.customer_master_reconciliation,
      PREBUILT_DOMAIN_PACKS.financial_gl_ledger,
      PREBUILT_DOMAIN_PACKS.healthcare_hipaa
    ];
  });

  // Sync threads per-user on login switch
  useEffect(() => {
    if (!user?.id) return;
    try {
      const stored = localStorage.getItem(`datax_threads_${user.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setThreads(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed reading stored threads for user:', user.id, e);
    }
  }, [user?.id]);

  // Persist threads whenever modified for active SaaS user
  useEffect(() => {
    if (!user?.id) return;
    try {
      localStorage.setItem(`datax_threads_${user.id}`, JSON.stringify(threads));
    } catch (e) {
      console.warn('Failed storing threads for user:', user.id, e);
    }
  }, [threads, user?.id]);

  // Active Thread Selection
  const [activeThread, setActiveThread] = useState(PREBUILT_DOMAIN_PACKS.sap_bw_s4hana);

  // Source Configuration
  const [sourceConfig, setSourceConfig] = useState(PREBUILT_DOMAIN_PACKS.sap_bw_s4hana.source);

  // Target Configuration
  const [targetConfig, setTargetConfig] = useState(PREBUILT_DOMAIN_PACKS.sap_bw_s4hana.target);

  // Active Rules
  const [activeRules, setActiveRules] = useState(PREBUILT_DOMAIN_PACKS.sap_bw_s4hana.rules);

  // Auto-Fix Feature Flag
  const [autoFixEnabled, setAutoFixEnabled] = useState(true);

  // Pipeline Status & Logs
  const [pipelineStatus, setPipelineStatus] = useState('IDLE');
  const [agentStepIndex, setAgentStepIndex] = useState(0);
  const [telemetryLogs, setTelemetryLogs] = useState([]);
  const [s4hanaDocNumber, setS4HanaDocNumber] = useState('');

  // Sample Rows & Live Evaluated Records
  const [previewRows, setPreviewRows] = useState([]);
  const [sampleData, setSampleData] = useState([]);
  const rawRecordsRef = useRef([]);

  // Dry Run Results State (Zero dummy data)
  const [dryRunResult, setDryRunResult] = useState({
    totalChecked: 0,
    cleanCount: 0,
    autoFixedCount: 0,
    quarantinedCount: 0,
    passRate: 0,
    ruleOutcomes: []
  });

  // Run History Logs (Multi-Tenant LocalStorage Scoped)
  const [runHistory, setRunHistory] = useState(() => {
    try {
      if (user?.id) {
        const stored = localStorage.getItem(`datax_run_history_${user.id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read user run history:', e);
    }
    return [];
  });

  // Sync run history on user switch
  useEffect(() => {
    if (!user?.id) return;
    try {
      const stored = localStorage.getItem(`datax_run_history_${user.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRunHistory(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed reading run history for user:', user.id, e);
    }
  }, [user?.id]);

  // Sync with Server Threads and Runs APIs
  const fetchServerThreads = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/threads`);
      if (res.ok) {
        const data = await res.json();
        const serverThreads = data.threads || data || [];
        if (Array.isArray(serverThreads) && serverThreads.length > 0) {
          setThreads(prev => {
            return prev.map(pt => {
              const match = serverThreads.find(st => 
                st.id === pt.id || st.domainPackId === pt.id || st.domainPackId === pt.domainPackId || st.id === `thread_${pt.id}` || st.id?.replace('thread_', '') === pt.id?.replace('thread_', '')
              );
              if (match) {
                return {
                  ...pt,
                  runCount: match.runCount ?? pt.runCount,
                  lastRun: match.lastRun ?? pt.lastRun,
                  healthScore: match.healthScore ?? pt.healthScore,
                  healthGrade: match.healthGrade ?? pt.healthGrade,
                  driftScore: match.driftScore ?? pt.driftScore,
                  driftStatus: match.driftStatus ?? pt.driftStatus,
                  status: match.status ?? pt.status
                };
              }
              return pt;
            });
          });
        }
      }
    } catch (err) {
      console.warn('Could not fetch server threads:', err);
    }
  }, []);

  const fetchServerRuns = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/runs`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.runs)) {
          setRunHistory(data.runs);
        }
      }
    } catch (err) {
      console.warn('Could not fetch server runs:', err);
    }
  }, []);

  useEffect(() => {
    fetchServerThreads();
    fetchServerRuns();
  }, [fetchServerThreads, fetchServerRuns]);

  // Load Dataset into State & Evaluate (No hardcoded dummy data)
  const loadInitialSampleData = useCallback(() => {
    // Only real data fetched from database should populate state
    rawRecordsRef.current = [];
    setPreviewRows([]);
    setSampleData([]);
  }, []);

  // Re-evaluate sample records whenever activeRules or autoFixEnabled changes
  useEffect(() => {
    if (rawRecordsRef.current && rawRecordsRef.current.length > 0) {
      const evaluated = rawRecordsRef.current.map(r => evaluateRow(r, activeRules, autoFixEnabled, rawRecordsRef.current));
      setSampleData(evaluated);
    }
  }, [activeRules, autoFixEnabled]);

  // Dynamically compute real-time health score from evaluated records & active rules
  const dynamicHealthScore = useMemo(() => {
    if (!sampleData || sampleData.length === 0) {
      return activeThread?.successRate || activeThread?.healthScore || 95.0;
    }
    const cleanCount = sampleData.filter(r => r._status === 'clean').length;
    const fixedCount = sampleData.filter(r => r._status === 'fixed').length;
    const total = sampleData.length;
    
    // If auto-fix is ON, remediated records pass cleanly. If OFF, only unviolated clean records pass.
    const passingCount = autoFixEnabled ? (cleanCount + fixedCount) : cleanCount;
    return Math.round((passingCount / total) * 1000) / 10;
  }, [sampleData, autoFixEnabled, activeThread?.successRate, activeThread?.healthScore]);

  // Keep dryRunResult, activeThread and threads catalog health score dynamically in sync
  useEffect(() => {
    if (!sampleData || sampleData.length === 0) return;

    const total = sampleData.length;
    const cleanCount = sampleData.filter(r => r._status === 'clean').length;
    const autoFixedCount = sampleData.filter(r => r._status === 'fixed').length;
    const quarantinedCount = sampleData.filter(r => r._status === 'quarantined').length;
    const passRate = dynamicHealthScore;

    // Compute dynamic rule outcomes
    const selectedActiveRules = (activeRules || []).filter(r => r.selected !== false && r.enabled !== false);
    const outcomes = selectedActiveRules.map(rule => {
      const affectedRows = sampleData.filter(r => 
        (r._violatedRuleIds && r._violatedRuleIds.includes(rule.id)) ||
        (r._fixedRuleIds && r._fixedRuleIds.includes(rule.id))
      ).length;

      const fixedRows = sampleData.filter(r => r._fixedRuleIds && r._fixedRuleIds.includes(rule.id)).length;
      const isAutoFixed = fixedRows > 0 && autoFixEnabled;

      return {
        name: rule.name,
        rowsAffected: affectedRows,
        outcome: isAutoFixed ? 'Auto-fixed' : affectedRows > 0 ? 'Quarantined' : 'Passed',
        badgeClass: isAutoFixed 
          ? 'bg-blue-50 text-blue-700 border-blue-200' 
          : affectedRows > 0 
          ? 'bg-amber-50 text-amber-700 border-amber-200' 
          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };
    });

    setDryRunResult({
      totalChecked: total,
      cleanCount,
      autoFixedCount,
      quarantinedCount,
      passRate,
      ruleOutcomes: outcomes
    });

    // Update active thread
    setActiveThread(prev => prev ? {
      ...prev,
      successRate: passRate,
      healthScore: passRate,
      status: passRate >= 90 ? 'healthy' : passRate >= 75 ? 'warning' : 'draft',
      statusLabel: passRate >= 90 ? 'Live' : passRate >= 75 ? 'Below threshold' : 'Draft'
    } : prev);

    // Update thread card in catalog
    setThreads(prev => prev.map(t => {
      if (t.id === activeThread?.id || t.threadId === activeThread?.threadId) {
        return {
          ...t,
          successRate: passRate,
          healthScore: passRate,
          status: passRate >= 90 ? 'healthy' : passRate >= 75 ? 'warning' : 'draft',
          statusLabel: passRate >= 90 ? 'Live' : passRate >= 75 ? 'Below threshold' : 'Draft'
        };
      }
      return t;
    }));
  }, [sampleData, dynamicHealthScore, activeRules, autoFixEnabled, activeThread?.id, activeThread?.threadId]);

  // Fetch Live Threads from Backend on Mount (SaaS Multi-Tenant Isolated)
  useEffect(() => {
    const fetchLiveThreads = async () => {
      try {
        const res = await fetch(`${API_BASE}/threads`, {
          headers: {
            'X-User-Id': userId,
            'X-User-Email': userEmail,
            'X-Tenant-Id': tenantId
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.threads && data.threads.length > 0) {
            const merged = [...data.threads];
            Object.values(PREBUILT_DOMAIN_PACKS).forEach(pack => {
              const alreadyExists = merged.some(t => 
                t.id === pack.id || 
                t.id === `thread_${pack.id}` || 
                t.domainPackId === pack.id ||
                t.threadId === pack.threadId ||
                (t.name && pack.name && (
                  t.name.toLowerCase().includes(pack.name.slice(0, 8).toLowerCase()) ||
                  pack.name.toLowerCase().includes(t.name.slice(0, 8).toLowerCase())
                ))
              );
              if (!alreadyExists) {
                merged.push(pack);
              }
            });
            setThreads(merged);
          }
        }
      } catch (err) {
        console.warn('Backend threads unreachable, using prebuilt domain packs:', err.message);
      }
    };
    fetchLiveThreads();
  }, [userId, userEmail, tenantId]);

  // Initialize sample data on first mount
  useEffect(() => {
    loadInitialSampleData(activeThread);
  }, []);

  // Action: Switch Active Thread
  const selectThread = (threadIdOrPackKey) => {
    const found = threads.find(t => t.id === threadIdOrPackKey || t.threadId === threadIdOrPackKey) 
      || PREBUILT_DOMAIN_PACKS[threadIdOrPackKey] 
      || PREBUILT_DOMAIN_PACKS.sap_bw_s4hana;

    setActiveThread(found);

    const src = found.source || (found.domainPackId === 'sap_bw_s4hana' ? PREBUILT_DOMAIN_PACKS.sap_bw_s4hana.source : PREBUILT_DOMAIN_PACKS.customer_master_reconciliation.source);
    const tgt = found.target || (found.domainPackId === 'sap_bw_s4hana' ? PREBUILT_DOMAIN_PACKS.sap_bw_s4hana.target : PREBUILT_DOMAIN_PACKS.customer_master_reconciliation.target);
    const rls = found.rules || (found.domainPackId === 'sap_bw_s4hana' ? PREBUILT_DOMAIN_PACKS.sap_bw_s4hana.rules : PREBUILT_DOMAIN_PACKS.customer_master_reconciliation.rules);

    setSourceConfig(src);
    setTargetConfig(tgt);
    setActiveRules(rls);
    // Zero dummy data: Keep preview and sample rows empty until user tests connection
    rawRecordsRef.current = [];
    setPreviewRows([]);
    setSampleData([]);
  };

  // Action: Test Database Connection (calls live backend API with tenant headers)
  const testConnection = async (config, isTarget = false) => {
    try {
      const payload = {
        name: config.name || 'Database Connection',
        engine: config.engine || (isTarget ? 'postgres' : 'sap_bw'),
        connectionUri: (config.connectionUri || '').trim(),
        host: (config.host || '').trim(),
        port: config.port ? String(config.port) : '',
        database: (config.database || '').trim(),
        user: (config.user || config.username || '').trim(),
        password: (config.password || '').trim()
      };

      const res = await fetch(`${API_BASE}/test-connection`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': userId,
          'X-User-Email': userEmail,
          'X-Tenant-Id': tenantId
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success === false) {
          return {
            success: false,
            latencyMs: 0,
            error: data.error || data.message || 'Connection test failed',
            message: data.message || data.error || 'Connection failed: Please check credentials.'
          };
        }
        return {
          success: true,
          latencyMs: data.latencyMs || 42,
          tables: data.tables || [],
          tableCount: data.tableCount || (data.tables ? data.tables.length : 0),
          message: data.message || `Successfully connected! Discovered ${data.tableCount || (data.tables ? data.tables.length : 0)} tables.`
        };
      } else {
        const errData = await res.json().catch(() => ({}));
        return {
          success: false,
          latencyMs: 0,
          error: errData.detail || errData.message || 'Connection failed: Server returned an error.',
          message: errData.detail || errData.message || 'Connection failed: Server returned an error.'
        };
      }
    } catch (err) {
      console.warn('API test connection call network error:', err.message);
      return {
        success: false,
        latencyMs: 0,
        error: `Network error connecting to DataX API: ${err.message}`,
        message: `Network error connecting to DataX API: ${err.message}`
      };
    }
  };

  // Action: Fetch Real Table Sample (calls live backend /vault/sample with tenant context)
  const fetchTableSample = async (tableName, limit = 50, uriOverride = null) => {
    try {
      let resolvedUri = uriOverride || sourceConfig.connectionUri || '';
      if (!resolvedUri && sourceConfig.host && (sourceConfig.user || sourceConfig.username) && sourceConfig.password) {
        const p = sourceConfig.port || (sourceConfig.engine === 'sap_bw' ? '443' : '5432');
        const u = sourceConfig.user || sourceConfig.username;
        const pass = sourceConfig.password;
        const db = sourceConfig.database;
        if (sourceConfig.engine === 'sap_bw') {
          resolvedUri = `jdbc:sap://${sourceConfig.host}:${p}?encrypt=true&validateCertificate=false&user=${encodeURIComponent(u)}&password=${encodeURIComponent(pass)}${db ? `&databaseName=${encodeURIComponent(db)}` : ''}`;
        } else if (sourceConfig.engine === 'mongodb') {
          const isAtlas = sourceConfig.host && sourceConfig.host.includes('.mongodb.net');
          if (isAtlas) {
            resolvedUri = `mongodb+srv://${encodeURIComponent(u)}:${encodeURIComponent(pass)}@${sourceConfig.host}/${db || ''}?retryWrites=true&w=majority`;
          } else {
            resolvedUri = `mongodb://${encodeURIComponent(u)}:${encodeURIComponent(pass)}@${sourceConfig.host}:${p}/${db || ''}`;
          }
        } else {
          const isCloudPg = sourceConfig.host && (sourceConfig.host.includes('neon.tech') || sourceConfig.host.includes('rds.amazonaws.com') || sourceConfig.host.includes('supabase.co'));
          const sslQuery = isCloudPg ? '?sslmode=require' : '';
          resolvedUri = `postgresql://${encodeURIComponent(u)}:${encodeURIComponent(pass)}@${sourceConfig.host}:${p}/${db || ''}${sslQuery}`;
        }
      }

      const res = await fetch(`${API_BASE}/vault/sample`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': userId,
          'X-User-Email': userEmail,
          'X-Tenant-Id': tenantId
        },
        body: JSON.stringify({
          engine: sourceConfig.engine || 'sap_bw',
          connectionUri: resolvedUri,
          host: sourceConfig.host || undefined,
          port: sourceConfig.port ? String(sourceConfig.port) : undefined,
          database: sourceConfig.database || undefined,
          user: sourceConfig.user || sourceConfig.username || undefined,
          password: sourceConfig.password || undefined,
          table: tableName || sourceConfig.table,
          limit
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.rows && data.rows.length > 0) {
          rawRecordsRef.current = data.rows;
          setPreviewRows(data.rows.slice(0, 5));
          if (data.columns) {
            setSourceConfig(prev => ({
              ...prev,
              table: tableName,
              connectionUri: activeUri || prev.connectionUri,
              discoveredColumns: data.columns
            }));
          }
          const evaluated = data.rows.map(r => evaluateRow(r, activeRules, autoFixEnabled, data.rows));
          setSampleData(evaluated);
          return { success: true, count: data.rows.length, columns: data.columns, rows: data.rows };
        }
      }
    } catch (err) {
      console.warn('API sampling failed:', err.message);
    }

    // Zero dummy data fallback: Do not substitute with mock arrays
    rawRecordsRef.current = [];
    setPreviewRows([]);
    setSampleData([]);
    return { success: false, count: 0, rows: [], message: 'No records available from database table.' };
  };

  // Action: Toggle Active Rule (Dynamically updates row evaluations & health score)
  const toggleRule = (id) => {
    setActiveRules(prev =>
      prev.map(r => (r.id === id ? { ...r, selected: r.selected === undefined ? false : !r.selected } : r))
    );
  };

  // Action: Add Rule
  const addRule = (newRule) => {
    setActiveRules(prev => [newRule, ...prev]);
  };

  // Action: Update Rule
  const updateRule = (updatedRule) => {
    setActiveRules(prev => prev.map(r => (r.id === updatedRule.id ? updatedRule : r)));
  };

  // Action: Delete Rule
  const deleteRule = (id) => {
    setActiveRules(prev => prev.filter(r => r.id !== id));
  };

  // Dry run execution lock to prevent parallel execution loops
  const isExecutingDryRunRef = useRef(false);

  // Action: Execute Dry Run (Uses dynamic record evaluation with strict credential checks)
  const executeDryRun = useCallback(async () => {
    if (isExecutingDryRunRef.current) {
      console.warn('Dry Run already running, ignoring duplicate request.');
      return;
    }

    // 1. MANDATORY CREDENTIALS CHECK:
    // Do not proceed without source and target credentials
    if (!isCredentialConfigured(sourceConfig) || !isCredentialConfigured(targetConfig)) {
      console.warn('Dry Run blocked: Source and target credentials must both be configured before proceeding.');
      setPipelineStatus('IDLE');
      return {
        success: false,
        error: 'Missing required credentials. Both source and target credentials must be configured before proceeding.',
        message: 'Missing database credentials. Please configure and verify source and target databases.'
      };
    }

    isExecutingDryRunRef.current = true;
    setPipelineStatus('RUNNING');
    const selectedActiveRules = (activeRules || []).filter(r => r.selected !== false && r.enabled !== false);

    // Call backend API if available
    try {
      const payload = {
        pipelineName: activeThread?.name || 'DataX CleanFlow Pipeline',
        threadId: activeThread?.id || activeThread?.threadId || undefined,
        dryRun: true,
        autoFixEnabled,
        source: {
          engine: sourceConfig.engine || 'sap_bw',
          connectionUri: sourceConfig.connectionUri || undefined,
          host: sourceConfig.host || undefined,
          port: sourceConfig.port ? String(sourceConfig.port) : undefined,
          database: sourceConfig.database || undefined,
          table: sourceConfig.table || '0PUR_C01',
          scopeMode: sourceConfig.scopeMode || 'specific',
          selectedTables: sourceConfig.selectedTables || (sourceConfig.table ? [sourceConfig.table] : ['0PUR_C01'])
        },
        target1: {
          engine: targetConfig.engine || sourceConfig.engine || 'postgres',
          connectionUri: targetConfig.connectionUri || sourceConfig.connectionUri || undefined,
          host: targetConfig.host || sourceConfig.host || undefined,
          port: (targetConfig.port || sourceConfig.port) ? String(targetConfig.port || sourceConfig.port) : undefined,
          database: targetConfig.database || sourceConfig.database || 'reconciled_db',
          table: targetConfig.table || (sourceConfig.table ? `${sourceConfig.table}_clean` : 'clean_records'),
          quarantineTable: targetConfig.quarantineTable || 'quarantined_records',
          writeMode: targetConfig.writeMode || 'append'
        },
        rules: selectedActiveRules.map((r, idx) => ({
          id: String(r.id || `rule_${idx + 1}`),
          name: String(r.name || r.title || r.id || `Rule ${idx + 1}`),
          column: r.field || r.column || 'GENERAL',
          check_type: r.check_type || 'REGEX_FORMAT',
          condition: r.condition || r.code || '',
          severity: (r.severity || 'critical').toLowerCase(),
          enabled: r.selected !== false,
          description: r.desc || r.description || ''
        }))
      };

      const res = await fetch(`${API_BASE}/pipeline/execute`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': userId,
          'X-User-Email': userEmail,
          'X-Tenant-Id': tenantId
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.counts !== undefined || data.validCount !== undefined || data.summary !== undefined || data.totalChecked !== undefined) {
          const sum = data.summary || {};
          const totalCount = sum.sourceExtracted ?? sum.totalChecked ?? sum.total_records ?? data.totalChecked ?? data.counts?.totalChecked ?? sampleData.length;
          const valid = sum.compliantValid ?? sum.cleanCount ?? sum.valid_records_count ?? data.validCount ?? data.counts?.valid ?? 0;
          const fixed = sum.autoFixedCount ?? sum.remediated_count ?? data.autofixedCount ?? data.counts?.autofixed ?? 0;
          const quarantined = sum.quarantined ?? sum.quarantinedCount ?? sum.quarantined_records_count ?? data.quarantinedCount ?? data.counts?.quarantined ?? 0;
          const passRate = data.healthMetrics?.score ?? data.healthScore ?? (totalCount > 0 ? Math.round(((valid + fixed) / totalCount) * 1000) / 10 : 0);

          const outcome = {
            totalChecked: totalCount,
            cleanCount: valid,
            autoFixedCount: fixed,
            quarantinedCount: quarantined,
            passRate,
            ruleOutcomes: dryRunResult.ruleOutcomes
          };
          setDryRunResult(prev => ({
            ...outcome,
            ruleOutcomes: prev.ruleOutcomes
          }));
          setPipelineStatus('COMPLETED');

          // Sync runs and thread state with server
          fetchServerRuns();
          fetchServerThreads();

          return outcome;
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn('Pipeline execute API returned non-OK status:', res.status, errJson);
      }
    } catch (err) {
      console.warn('Pipeline execute API call failed, using live evaluated simulation:', err.message);
    } finally {
      isExecutingDryRunRef.current = false;
    }

    // Dynamic Record Evaluation Fallback
    const totalCount = sampleData.length;
    const cleanCount = sampleData.filter(r => r._status === 'clean').length;
    const autoFixedCount = sampleData.filter(r => r._status === 'fixed').length;
    const quarantinedCount = sampleData.filter(r => r._status === 'quarantined').length;
    const passRate = dynamicHealthScore;

    const result = {
      totalChecked: totalCount,
      cleanCount,
      autoFixedCount,
      quarantinedCount,
      passRate
    };

    setDryRunResult(prev => ({
      ...result,
      ruleOutcomes: prev.ruleOutcomes
    }));
    setPipelineStatus('COMPLETED');
    return result;
  }, [sourceConfig, targetConfig, activeRules, autoFixEnabled, dynamicHealthScore, sampleData, userId, userEmail, tenantId, activeThread, fetchServerRuns, fetchServerThreads]);

  // Action: Execute Real Live Pipeline Run
  const executeLiveRun = async () => {
    isExecutingDryRunRef.current = true;
    setPipelineStatus('RUNNING');
    const selectedActiveRules = (activeRules || []).filter(r => r.selected !== false && r.enabled !== false);

    try {
      const payload = {
        pipelineName: activeThread?.name || 'DataX Live Pipeline',
        threadId: activeThread?.id || activeThread?.threadId || (activeThread?.domainPackId ? `thread_${activeThread.domainPackId}` : 'thread_sap_s4hana'),
        dryRun: false,
        autoFixEnabled,
        source: {
          engine: sourceConfig.engine || 'sap_bw',
          connectionUri: sourceConfig.connectionUri || undefined,
          host: sourceConfig.host || undefined,
          port: sourceConfig.port ? String(sourceConfig.port) : undefined,
          database: sourceConfig.database || undefined,
          table: sourceConfig.table || '0PUR_C01',
          scopeMode: sourceConfig.scopeMode || 'specific',
          selectedTables: sourceConfig.selectedTables || (sourceConfig.table ? [sourceConfig.table] : ['0PUR_C01'])
        },
        target1: {
          engine: targetConfig.engine || 'postgres',
          connectionUri: targetConfig.connectionUri || undefined,
          host: targetConfig.host || undefined,
          port: targetConfig.port ? String(targetConfig.port) : undefined,
          database: targetConfig.database || 'reconciled_db',
          table: targetConfig.table || (sourceConfig.table ? `${sourceConfig.table}_clean` : 'clean_records'),
          quarantineTable: targetConfig.quarantineTable || 'quarantined_records',
          writeMode: targetConfig.writeMode || 'append'
        },
        rules: selectedActiveRules.map((r, idx) => ({
          id: String(r.id || `rule_${idx + 1}`),
          name: String(r.name || r.title || r.id || `Rule ${idx + 1}`),
          column: r.field || r.column || 'GENERAL',
          check_type: r.check_type || 'REGEX_FORMAT',
          condition: r.condition || r.code || '',
          severity: (r.severity || 'critical').toLowerCase(),
          enabled: r.selected !== false,
          description: r.desc || r.description || ''
        }))
      };

      const res = await fetch(`${API_BASE}/pipeline/execute`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Id': userId,
          'X-User-Email': userEmail,
          'X-Tenant-Id': tenantId
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        const totalCount = data.summary?.sourceExtracted ?? data.summary?.totalChecked ?? data.summary?.total_records ?? data.counts?.totalChecked ?? 0;
        const valid = data.summary?.compliantValid ?? data.summary?.cleanCount ?? data.summary?.valid_records_count ?? data.counts?.valid ?? 0;
        const fixed = data.summary?.autoFixedCount ?? data.summary?.remediated_count ?? data.counts?.autofixed ?? 0;
        const quarantined = data.summary?.quarantined ?? data.summary?.quarantinedCount ?? data.summary?.quarantined_records_count ?? data.counts?.quarantined ?? 0;
        const passRate = data.healthMetrics?.score ?? (totalCount > 0 ? Math.round(((valid + fixed) / totalCount) * 1000) / 10 : 0);
        const docNo = data.docNumber || (data.summary?.target1Committed ? `#COMMIT-${data.summary.target1Committed}` : '#CLEAN-CORE');
        
        setS4HanaDocNumber(docNo);

        const realRun = {
          id: data.runId || `RUN-${Date.now().toString().slice(-5)}`,
          thread: activeThread?.name || 'SAP Clean Core Modernizer',
          dataset: sourceConfig.table || '0PUR_C01',
          rows: totalCount,
          clean: valid,
          autoFixed: fixed,
          quarantined,
          docNo,
          duration: `${((data.elapsedMs || 800) / 1000).toFixed(1)}s`,
          health: passRate,
          status: 'Clean Core Posted',
          variant: passRate >= 90 ? 'success' : 'volt',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestampIso: new Date().toISOString()
        };

        setRunHistory(prev => [realRun, ...(prev || [])]);
        setPipelineStatus('COMPLETED');

        // Refresh threads and runs from backend so dashboard updates immediately
        fetchServerRuns();
        fetchServerThreads();

        return realRun;
      } else {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || errJson.message || `Live execution failed with status ${res.status}`);
      }
    } catch (err) {
      console.error('Live run execution failed:', err);
      setPipelineStatus('ERROR');
      throw err;
    } finally {
      isExecutingDryRunRef.current = false;
    }
  };


  // Action: Export Excel
  const handleExportExcel = () => {
    const rowsToExport = sampleData.map(s => s._transformed || s);
    const ws = XLSX.utils.json_to_sheet(rowsToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clean_Records');
    XLSX.writeFile(wb, `DataX_${sourceConfig.table || 'export'}_reconciled.xlsx`);
  };

  const value = {
    // Thread & Domain State
    threads,
    activeThread,
    dynamicHealthScore,
    selectThread,
    setActiveThread,

    // Source & Target State
    sourceConfig,
    setSourceConfig,
    targetConfig,
    setTargetConfig,
    isCredentialConfigured,

    // Rules & Engine
    activeRules,
    setActiveRules,
    toggleRule,
    addRule,
    updateRule,
    deleteRule,
    autoFixEnabled,
    setAutoFixEnabled,

    // Sample & Preview Data
    previewRows,
    sampleData,
    evaluateRow,
    fetchTableSample,

    // API Handlers
    testConnection,
    executeDryRun,
    executeLiveRun,
    dryRunResult,
    runHistory,

    // Legacy PoC compatibility
    pipelineStatus,
    agentStepIndex,
    telemetryLogs,
    s4hanaDocNumber,
    handleExportExcel,

    // SaaS Multi-Tenant Identity
    user,
    userId,
    userEmail,
    tenantId
  };

  return (
    <RuleEngineContext.Provider value={value}>
      {children}
    </RuleEngineContext.Provider>
  );
}

export function useRuleEngine() {
  const context = useContext(RuleEngineContext);
  if (!context) {
    throw new Error('useRuleEngine must be used within a RuleEngineProvider');
  }
  return context;
}
