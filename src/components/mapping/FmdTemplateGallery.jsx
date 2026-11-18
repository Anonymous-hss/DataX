import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Sparkles,
  Search,
  Upload,
  Database,
  FileSpreadsheet,
  Layers,
  ShieldCheck,
  Cloud,
  FileText,
  GitBranch,
  Send,
  Loader2,
} from 'lucide-react';

export const SAAS_PIPELINE_TEMPLATES = [
  {
    id: 'upload-excel-postgres',
    name: 'Upload Excel / CSV / Numbers → PostgreSQL',
    category: 'Upload & Files',
    badge: 'Popular',
    icon: FileSpreadsheet,
    sourceSummary: 'Universal File Upload (.xlsx, .xls, .csv, .numbers)',
    targetSummary: 'PostgreSQL / Neon DB + DLQ',
    description:
      'Upload spreadsheets from your computer into local browser temporary storage, validate & transform rows via AI rules, and push clean tables to PostgreSQL.',
    nodes: [
      { id: 'n-upload-1', type: 'file_upload', kind: 'file_upload', title: 'Spreadsheet Upload', system: 'File Upload', x: 60, y: 120, config: { acceptHint: '.xlsx, .xls, .csv, .numbers', fileRole: 'auto' } },
      { id: 'n-rules-1', type: 'rules', kind: 'consolidator', title: 'AI Schema & Rule Engine', system: 'Rule Engine', x: 345, y: 120, config: { mode: 'auto_validate' } },
      { id: 'n-router-1', type: 'router', kind: 'xref_router', title: 'Clean / Exception Router', system: 'Router', x: 630, y: 120, config: { xrefEnabled: true } },
      { id: 'n-target-1', type: 'target', kind: 'target_db', title: 'PostgreSQL Target', system: 'PostgreSQL', x: 920, y: 40, config: { engine: 'postgres', table: '', writeMode: 'append' } },
      { id: 'n-dlq-1', type: 'quarantine', kind: 'z_errorlog', title: 'Quarantine DLQ', system: 'Dead-Letter', x: 920, y: 215, config: { table: 'z_errorlog' } },
    ],
    edges: [
      { id: 'e-1', from: 'n-upload-1', to: 'n-rules-1' },
      { id: 'e-2', from: 'n-rules-1', to: 'n-router-1' },
      { id: 'e-3', from: 'n-router-1', to: 'n-target-1', branch: 'TRUE' },
      { id: 'e-4', from: 'n-router-1', to: 'n-dlq-1', branch: 'FALSE' },
    ],
  },
  {
    id: 'upload-fmd-sap-bods',
    name: 'Multi-Tab Excel FMDs & XREF → SAP BODS Staging',
    category: 'SAP & ERP',
    badge: 'Enterprise FMD',
    icon: Layers,
    sourceSummary: 'Upload Multi-Tab FMDs + XREF + Source Extracts',
    targetSummary: 'SAP BODS Staging DB + Z_ERRORLOG',
    description:
      'Upload multi-tab Functional Mapping Documents (.xlsx/.xls/.csv/.numbers) & XREF tables, detect cross-system rule discrepancies, gate REWORK via HITL, and stage clean preload tables for SAP BODS.',
    nodes: [
      { id: 'n-fmd-upload', type: 'file_upload', kind: 'file_upload', title: 'Upload FMD & XREF Files', system: 'FMD Upload', x: 55, y: 40, config: { acceptHint: '.xlsx, .xls, .csv, .numbers', fileRole: 'fmd' } },
      { id: 'n-src-upload', type: 'file_upload', kind: 'file_upload', title: 'Upload Source Extract', system: 'Source Upload', x: 55, y: 225, config: { acceptHint: '.xlsx, .xls, .csv, .numbers', fileRole: 'source_data' } },
      { id: 'n-consolidator', type: 'rules', kind: 'consolidator', title: 'FMD Rule Consolidator', system: 'FMD Engine', x: 335, y: 130, config: {} },
      { id: 'n-xref', type: 'conditional', kind: 'xref_router', title: 'XREF & Override Router', system: 'XREF Engine', x: 610, y: 130, config: { xrefEnabled: true } },
      { id: 'n-hitl', type: 'hitl', kind: 'hitl_gate', title: 'Controller Gate (HITL)', system: 'Governance', x: 885, y: 40, config: { enforceGate: true } },
      { id: 'n-bods', type: 'target', kind: 'bods_preload', title: 'SAP BODS Staging DB', system: 'SAP BODS', x: 1155, y: 40, config: { engine: 'sap_bods', writeMode: 'append' } },
      { id: 'n-err', type: 'quarantine', kind: 'z_errorlog', title: 'Z_ERRORLOG Store', system: 'Dead-Letter', x: 885, y: 225, config: { table: 'z_errorlog' } },
    ],
    edges: [
      { id: 'e-f1', from: 'n-fmd-upload', to: 'n-consolidator' },
      { id: 'e-f2', from: 'n-src-upload', to: 'n-consolidator' },
      { id: 'e-f3', from: 'n-consolidator', to: 'n-xref' },
      { id: 'e-f4', from: 'n-xref', to: 'n-hitl', branch: 'TRUE' },
      { id: 'e-f5', from: 'n-hitl', to: 'n-bods' },
      { id: 'e-f6', from: 'n-xref', to: 'n-err', branch: 'FALSE' },
    ],
  },
  {
    id: 's4hana-snowflake',
    name: 'SAP S/4HANA → Snowflake Data Cloud',
    category: 'SAP & ERP',
    badge: 'Cloud Sync',
    icon: Cloud,
    sourceSummary: 'SAP S/4HANA (OData / Table Read)',
    targetSummary: 'Snowflake Data Cloud',
    description:
      'Extract operational ERP master or transactional tables from SAP S/4HANA, apply semantic normalization rules, and load clean analytics tables into Snowflake.',
    nodes: [
      { id: 'n-s4-src', type: 'source', kind: 'db_source', title: 'SAP S/4HANA Source', system: 'SAP S/4HANA', x: 70, y: 120, config: { engine: 'sap_s4hana', host: '', table: '' } },
      { id: 'n-s4-rules', type: 'rules', kind: 'consolidator', title: 'Clean Core Rules', system: 'AI Rules', x: 365, y: 120, config: {} },
      { id: 'n-s4-tgt', type: 'target', kind: 'target_db', title: 'Snowflake Target', system: 'Snowflake', x: 660, y: 55, config: { engine: 'snowflake', table: '', writeMode: 'upsert' } },
      { id: 'n-s4-dlq', type: 'quarantine', kind: 'z_errorlog', title: 'Exception Quarantine', system: 'Dead-Letter', x: 660, y: 215, config: {} },
    ],
    edges: [
      { id: 'es-1', from: 'n-s4-src', to: 'n-s4-rules' },
      { id: 'es-2', from: 'n-s4-rules', to: 'n-s4-tgt', branch: 'TRUE' },
      { id: 'es-3', from: 'n-s4-rules', to: 'n-s4-dlq', branch: 'FALSE' },
    ],
  },
  {
    id: 'sap-bw-s4hana',
    name: 'SAP BW HANA → SAP S/4HANA Clean Core',
    category: 'SAP & ERP',
    badge: 'Migration',
    icon: Database,
    sourceSummary: 'SAP BW / HANA Cloud',
    targetSummary: 'SAP S/4HANA + Controller Gate',
    description:
      'Migrate legacy SAP BW datasets into S/4HANA Clean Core with automated ontology mapping, human controller sign-off, and quarantine isolation.',
    nodes: [
      { id: 'n-bw-1', type: 'source', kind: 'db_source', title: 'SAP BW HANA', system: 'SAP BW', x: 60, y: 120, config: { engine: 'sap_bw', table: '' } },
      { id: 'n-bw-2', type: 'rules', kind: 'consolidator', title: 'Ontology Rule Engine', system: 'AI Rules', x: 345, y: 120, config: {} },
      { id: 'n-bw-3', type: 'hitl', kind: 'hitl_gate', title: 'Controller Gate', system: 'Approval Gate', x: 630, y: 50, config: { enforceGate: true } },
      { id: 'n-bw-4', type: 'target', kind: 'target_db', title: 'SAP S/4HANA', system: 'SAP S/4HANA', x: 920, y: 50, config: { engine: 'sap_s4hana', writeMode: 'stage_swap' } },
      { id: 'n-bw-5', type: 'quarantine', kind: 'z_errorlog', title: 'Quarantine DLQ', system: 'Dead-Letter', x: 630, y: 215, config: {} },
    ],
    edges: [
      { id: 'eb-1', from: 'n-bw-1', to: 'n-bw-2' },
      { id: 'eb-2', from: 'n-bw-2', to: 'n-bw-3', branch: 'TRUE' },
      { id: 'eb-3', from: 'n-bw-3', to: 'n-bw-4' },
      { id: 'eb-4', from: 'n-bw-2', to: 'n-bw-5', branch: 'FALSE' },
    ],
  },
  {
    id: 'upload-docs-bigquery',
    name: 'Upload PDF / PPT / Docs → Google BigQuery',
    category: 'Upload & Files',
    badge: 'Any Format',
    icon: FileText,
    sourceSummary: 'Universal File Upload (.pdf, .pptx, .docx, .xlsx)',
    targetSummary: 'Google BigQuery Warehouse',
    description:
      'Upload unstructured specs, decks, or spreadsheets via client-side temporary storage, extract structured entities with AI, and land validated tables in BigQuery.',
    nodes: [
      { id: 'n-doc-1', type: 'file_upload', kind: 'file_upload', title: 'Document Uploader', system: 'File Upload', x: 65, y: 120, config: { acceptHint: '.pdf, .pptx, .docx, .xlsx, .csv', fileRole: 'auto' } },
      { id: 'n-doc-2', type: 'rules', kind: 'consolidator', title: 'AI Entity & Rule Extractor', system: 'AI Engine', x: 365, y: 120, config: {} },
      { id: 'n-doc-3', type: 'bigquery', kind: 'target_db', title: 'Google BigQuery', system: 'BigQuery', x: 665, y: 120, config: { engine: 'bigquery', table: '', writeMode: 'append' } },
    ],
    edges: [
      { id: 'ed-1', from: 'n-doc-1', to: 'n-doc-2' },
      { id: 'ed-2', from: 'n-doc-2', to: 'n-doc-3' },
    ],
  },
  {
    id: 'mongo-xref-postgres',
    name: 'MongoDB Atlas + Excel XREF → PostgreSQL Hub',
    category: 'Cloud Warehouses',
    badge: 'Hybrid Join',
    icon: GitBranch,
    sourceSummary: 'MongoDB Atlas + Uploaded XREF Sheet',
    targetSummary: 'PostgreSQL Master Hub',
    description:
      'Combine live NoSQL JSON documents from MongoDB Atlas with an uploaded Excel/CSV XREF lookup sheet, reconcile keys, and commit to PostgreSQL.',
    nodes: [
      { id: 'n-mg-1', type: 'source', kind: 'db_source', title: 'MongoDB Atlas', system: 'MongoDB', x: 60, y: 40, config: { engine: 'mongodb', table: '' } },
      { id: 'n-mg-2', type: 'file_upload', kind: 'file_upload', title: 'XREF Lookup Upload', system: 'File Upload', x: 60, y: 220, config: { acceptHint: '.xlsx, .xls, .csv, .numbers', fileRole: 'xref' } },
      { id: 'n-mg-3', type: 'conditional', kind: 'xref_router', title: 'XREF Lookup Joiner', system: 'XREF Join', x: 365, y: 130, config: { xrefEnabled: true } },
      { id: 'n-mg-4', type: 'target', kind: 'target_db', title: 'PostgreSQL Master Hub', system: 'PostgreSQL', x: 675, y: 130, config: { engine: 'postgres', writeMode: 'upsert' } },
    ],
    edges: [
      { id: 'em-1', from: 'n-mg-1', to: 'n-mg-3' },
      { id: 'em-2', from: 'n-mg-2', to: 'n-mg-3' },
      { id: 'em-3', from: 'n-mg-3', to: 'n-mg-4' },
    ],
  },
  {
    id: 'salesforce-csv-databricks',
    name: 'Salesforce CRM + CSV Upload → Databricks Lakehouse',
    category: 'Cloud Warehouses',
    badge: 'Lakehouse',
    icon: Upload,
    sourceSummary: 'Salesforce CRM + CSV / Numbers Upload',
    targetSummary: 'Databricks Unity Catalog',
    description:
      'Enrich Salesforce CRM accounts with local spreadsheet uploads, deduplicate and verify schema health, and write Gold Delta tables to Databricks.',
    nodes: [
      { id: 'n-sf-1', type: 'source', kind: 'db_source', title: 'Salesforce CRM', system: 'Salesforce', x: 60, y: 45, config: { engine: 'salesforce', table: '' } },
      { id: 'n-sf-2', type: 'file_upload', kind: 'file_upload', title: 'CSV / Excel Upload', system: 'File Upload', x: 60, y: 220, config: { acceptHint: '.csv, .xlsx, .numbers', fileRole: 'source_data' } },
      { id: 'n-sf-3', type: 'rules', kind: 'consolidator', title: 'Identity & Dedupe Rules', system: 'AI Rules', x: 365, y: 130, config: {} },
      { id: 'n-sf-4', type: 'target', kind: 'target_db', title: 'Databricks Lakehouse', system: 'Databricks', x: 675, y: 130, config: { engine: 'databricks', writeMode: 'upsert' } },
    ],
    edges: [
      { id: 'esf-1', from: 'n-sf-1', to: 'n-sf-3' },
      { id: 'esf-2', from: 'n-sf-2', to: 'n-sf-3' },
      { id: 'esf-3', from: 'n-sf-3', to: 'n-sf-4' },
    ],
  },
  {
    id: 'multi-source-hitl-audit',
    name: 'Multi-Source Governance + HITL Gate → Audited Target',
    category: 'Governance & Multi-Source',
    badge: 'SHA-256 Sealed',
    icon: ShieldCheck,
    sourceSummary: 'Any Upload / Database Source',
    targetSummary: 'RBAC + HITL Gate → Any Target DB',
    description:
      'Enforce role-based approvals (RBAC), human controller review on flagged rows, and immutable SHA-256 audit receipts before committing to any destination.',
    nodes: [
      { id: 'n-gv-1', type: 'file_upload', kind: 'file_upload', title: 'Universal Upload Source', system: 'File Upload', x: 60, y: 120, config: { acceptHint: '.xlsx, .xls, .csv, .numbers, .json', fileRole: 'auto' } },
      { id: 'n-gv-2', type: 'rules', kind: 'consolidator', title: 'Policy & Rule Engine', system: 'AI Rules', x: 345, y: 120, config: {} },
      { id: 'n-gv-3', type: 'hitl', kind: 'hitl_gate', title: 'HITL Controller Gate', system: 'Governance', x: 630, y: 50, config: { enforceGate: true } },
      { id: 'n-gv-4', type: 'target', kind: 'target_db', title: 'Audited Staging DB', system: 'PostgreSQL', x: 920, y: 50, config: { engine: 'postgres', writeMode: 'append' } },
      { id: 'n-gv-5', type: 'quarantine', kind: 'z_errorlog', title: 'Exception DLQ', system: 'Dead-Letter', x: 630, y: 215, config: {} },
    ],
    edges: [
      { id: 'eg-1', from: 'n-gv-1', to: 'n-gv-2' },
      { id: 'eg-2', from: 'n-gv-2', to: 'n-gv-3', branch: 'TRUE' },
      { id: 'eg-3', from: 'n-gv-3', to: 'n-gv-4' },
      { id: 'eg-4', from: 'n-gv-2', to: 'n-gv-5', branch: 'FALSE' },
    ],
  },
];

const CATEGORIES = ['All', 'Upload & Files', 'SAP & ERP', 'Cloud Warehouses', 'Governance & Multi-Source'];

const AI_PROMPT_EXAMPLES = [
  'Upload Excel mapping files and CSV lookup tables, validate fields with AI rules, gate exceptions via HITL, and push to PostgreSQL',
  'Extract from SAP S/4HANA, normalize descriptions with XREF overrides, and stage into Snowflake + Quarantine DLQ',
  'Read uploaded PDF specs and Excel data sheets, extract structured schema, and load into Google BigQuery',
];

/**
 * Synthesizes a clean dynamic DAG pipeline from a user's plain-English prompt.
 */
export function synthesizeAiPipelineFromPrompt(promptText = '') {
  const lower = String(promptText || '').toLowerCase();
  const nodes = [];
  const edges = [];

  // 1. Detect Sources
  const wantsUpload =
    lower.includes('excel') ||
    lower.includes('xls') ||
    lower.includes('csv') ||
    lower.includes('numbers') ||
    lower.includes('upload') ||
    lower.includes('pdf') ||
    lower.includes('ppt') ||
    lower.includes('file') ||
    lower.includes('fmd');
  const wantsS4 = lower.includes('s/4') || lower.includes('s4hana');
  const wantsSapBw = lower.includes('sap bw') || (lower.includes('hana') && !wantsS4);
  const wantsMongo = lower.includes('mongo');
  const wantsSalesforce = lower.includes('salesforce') || lower.includes('crm');
  const wantsPostgresSrc = lower.includes('from postgres');

  const sourceNodes = [];
  if (wantsUpload || (!wantsSapBw && !wantsS4 && !wantsMongo && !wantsSalesforce && !wantsPostgresSrc)) {
    sourceNodes.push({
      id: `ai-src-upload-${Date.now()}`,
      type: 'file_upload',
      kind: 'file_upload',
      title: lower.includes('fmd') ? 'Upload FMD & XREF Files' : 'Universal File Upload',
      system: 'File Upload',
      config: { acceptHint: '.xlsx, .xls, .csv, .numbers, .pdf, .pptx', fileRole: lower.includes('fmd') ? 'fmd' : 'auto' },
    });
  }
  if (wantsSapBw) {
    sourceNodes.push({
      id: `ai-src-bw-${Date.now()}`,
      type: 'source',
      kind: 'db_source',
      title: 'SAP BW HANA Source',
      system: 'SAP BW',
      config: { engine: 'sap_bw', table: '' },
    });
  } else if (wantsS4 && !lower.includes('to s/4') && !lower.includes('into s/4') && !lower.includes('into s4')) {
    sourceNodes.push({
      id: `ai-src-s4-${Date.now()}`,
      type: 'source',
      kind: 'db_source',
      title: 'SAP S/4HANA Source',
      system: 'SAP S/4HANA',
      config: { engine: 'sap_s4hana', table: '' },
    });
  }
  if (wantsMongo) {
    sourceNodes.push({
      id: `ai-src-mongo-${Date.now()}`,
      type: 'source',
      kind: 'db_source',
      title: 'MongoDB Atlas',
      system: 'MongoDB',
      config: { engine: 'mongodb', table: '' },
    });
  }
  if (wantsSalesforce) {
    sourceNodes.push({
      id: `ai-src-sf-${Date.now()}`,
      type: 'source',
      kind: 'db_source',
      title: 'Salesforce CRM',
      system: 'Salesforce',
      config: { engine: 'salesforce', table: '' },
    });
  }

  sourceNodes.forEach((sn, idx) => {
    nodes.push({
      ...sn,
      x: 55,
      y: sourceNodes.length > 1 ? 45 + idx * 185 : 125,
    });
  });

  // 2. Rules / Consolidation Node
  const rulesId = `ai-rules-${Date.now()}`;
  nodes.push({
    id: rulesId,
    type: 'rules',
    kind: 'consolidator',
    title: lower.includes('fmd') ? 'FMD Rule Consolidator' : 'AI Mapping & Rule Engine',
    system: 'AI Engine',
    x: 345,
    y: 125,
    config: { prompt: promptText },
  });
  sourceNodes.forEach((sn, idx) => {
    edges.push({ id: `ai-e-src-${idx}`, from: sn.id, to: rulesId });
  });

  let prevId = rulesId;
  let nextX = 625;

  // 3. Optional XREF / Router
  if (lower.includes('xref') || lower.includes('lookup') || lower.includes('route') || lower.includes('override') || lower.includes('split')) {
    const routerId = `ai-router-${Date.now()}`;
    nodes.push({
      id: routerId,
      type: 'conditional',
      kind: 'xref_router',
      title: lower.includes('xref') ? 'XREF & Override Router' : 'Conditional Split Router',
      system: 'Router',
      x: nextX,
      y: 125,
      config: { xrefEnabled: true },
    });
    edges.push({ id: `ai-e-rtr`, from: prevId, to: routerId });
    prevId = routerId;
    nextX += 280;
  }

  // 4. Optional HITL Governance Gate
  const wantsHitl =
    lower.includes('hitl') ||
    lower.includes('approv') ||
    lower.includes('review') ||
    lower.includes('controller') ||
    lower.includes('sign-off') ||
    lower.includes('gate');
  let cleanUpstreamId = prevId;
  if (wantsHitl) {
    const hitlId = `ai-hitl-${Date.now()}`;
    nodes.push({
      id: hitlId,
      type: 'hitl',
      kind: 'hitl_gate',
      title: 'Controller Gate (HITL)',
      system: 'Governance',
      x: nextX,
      y: 45,
      config: { enforceGate: true },
    });
    edges.push({ id: `ai-e-hitl`, from: prevId, to: hitlId, branch: 'TRUE' });
    cleanUpstreamId = hitlId;
    nextX += 275;
  }

  // 5. Detect Target Destination
  let targetTitle = 'PostgreSQL Target';
  let targetSystem = 'PostgreSQL';
  let targetKind = 'target_db';
  let targetType = 'target';
  if (lower.includes('bods') || lower.includes('time')) {
    targetTitle = 'SAP BODS Staging DB';
    targetSystem = 'SAP BODS';
    targetKind = 'bods_preload';
  } else if (lower.includes('snowflake')) {
    targetTitle = 'Snowflake Data Cloud';
    targetSystem = 'Snowflake';
  } else if (lower.includes('bigquery')) {
    targetTitle = 'Google BigQuery';
    targetSystem = 'BigQuery';
    targetType = 'bigquery';
  } else if (lower.includes('databricks')) {
    targetTitle = 'Databricks Lakehouse';
    targetSystem = 'Databricks';
  } else if (lower.includes('to s/4') || lower.includes('into s/4') || lower.includes('into s4')) {
    targetTitle = 'SAP S/4HANA Target';
    targetSystem = 'SAP S/4HANA';
  }

  const targetId = `ai-tgt-${Date.now()}`;
  nodes.push({
    id: targetId,
    type: targetType,
    kind: targetKind,
    title: targetTitle,
    system: targetSystem,
    x: nextX,
    y: 45,
    config: { engine: targetSystem.toLowerCase().replace(/\s+/g, '_'), writeMode: 'append', table: '' },
  });
  edges.push({ id: `ai-e-tgt`, from: cleanUpstreamId, to: targetId, branch: wantsHitl ? undefined : 'TRUE' });

  // 6. Quarantine / Error Log DLQ
  const dlqId = `ai-dlq-${Date.now()}`;
  nodes.push({
    id: dlqId,
    type: 'quarantine',
    kind: 'z_errorlog',
    title: lower.includes('bods') || lower.includes('errorlog') ? 'Z_ERRORLOG Store' : 'Quarantine DLQ',
    system: 'Dead-Letter',
    x: wantsHitl ? nextX - 275 : nextX,
    y: 220,
    config: { table: 'z_errorlog' },
  });
  edges.push({ id: `ai-e-dlq`, from: prevId, to: dlqId, branch: 'FALSE' });

  return {
    name: promptText.length > 52 ? `${promptText.slice(0, 52)}…` : promptText || 'AI Generated Pipeline',
    nodes,
    edges,
  };
}

export default function FmdTemplateGallery({
  onSelectTemplate,
  onStartFromScratch,
  onBuildWithAi,
  onBackToWorkflows,
}) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isBuildingAi, setIsBuildingAi] = useState(false);

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return SAAS_PIPELINE_TEMPLATES.filter((t) => {
      const catOk = category === 'All' || t.category === category;
      const qOk =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.sourceSummary.toLowerCase().includes(q) ||
        t.targetSummary.toLowerCase().includes(q);
      return catOk && qOk;
    });
  }, [search, category]);

  const handleAiSubmit = async (e) => {
    e.preventDefault();
    const cleaned = aiPrompt.trim();
    if (!cleaned) return;
    setIsBuildingAi(true);
    try {
      await new Promise((r) => setTimeout(r, 450));
      const generated = synthesizeAiPipelineFromPrompt(cleaned);
      onBuildWithAi(generated, cleaned);
    } finally {
      setIsBuildingAi(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] w-full overflow-y-auto bg-[#F8FAFC] dark:bg-[#0E1015] font-sans">
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 py-6 space-y-6">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToWorkflows}
              className="w-9 h-9 rounded-full border border-[#E3E6EE] dark:border-white/[0.1] bg-white dark:bg-[#18181C] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-[#474E61] dark:text-slate-300 flex items-center justify-center cursor-pointer"
              title="Back to Workflows"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-[#0A0F1F] dark:text-white tracking-tight">
                Choose a Mapping &amp; Transformation Template
              </h1>
              <p className="text-xs text-[#5F6678] dark:text-slate-400 mt-0.5">
                Pick any Source → Destination blueprint, build from a blank canvas with unlimited nodes, or let AI assemble the pipeline for you.
              </p>
            </div>
          </div>
        </div>

        {/* Two Primary SaaS Launch Cards: Start from Scratch + Build with AI */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Card 1: Start from Scratch */}
          <div className="lg:col-span-5 rounded-[22px] bg-white dark:bg-[#18181C] border-2 border-[#E3E6EE] dark:border-white/[0.1] hover:border-[#2D55F5] p-5 flex flex-col justify-between transition-all shadow-2xs">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#0A0F1F] dark:bg-white text-white dark:text-[#0A0F1F] flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300">
                  Blank Canvas · Limitless Nodes
                </span>
              </div>
              <h2 className="text-base font-bold text-[#0A0F1F] dark:text-white">
                Start from Scratch
              </h2>
              <p className="text-xs text-[#5F6678] dark:text-slate-400 mt-1.5 leading-relaxed">
                Open a clean Visual Canvas with full access to the Node Library. Add any Upload Node (.xlsx, .xls, .csv, Apple .numbers, .pdf, .pptx), databases, AI rule engines, XREF routers, HITL gates, and destinations.
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between pt-3 border-t border-[#F1F3F7] dark:border-white/[0.06]">
              <span className="text-[11px] font-medium text-slate-400">Zero pre-configured sources</span>
              <button
                type="button"
                onClick={onStartFromScratch}
                className="px-4 py-2 rounded-full bg-[#0A0F1F] dark:bg-white hover:opacity-90 text-white dark:text-[#0A0F1F] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Open Blank Canvas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2: Build with AI */}
          <div className="lg:col-span-7 rounded-[22px] bg-gradient-to-br from-[#F5F8FF] via-white to-[#F5F3FF] dark:from-[#1B223C] dark:via-[#18181C] dark:to-[#211B33] border-2 border-[#C7D7FE] dark:border-[#2D55F5]/40 p-5 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#2D55F5] text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#0A0F1F] dark:text-white leading-tight">
                      Build with AI
                    </h2>
                    <p className="text-[11px] text-[#5F6678] dark:text-slate-400">
                      Describe your source, files, rules, and target in plain English
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#2D55F5]/10 text-[#2D55F5] border border-[#2D55F5]/20">
                  AI Architect
                </span>
              </div>

              <form onSubmit={handleAiSubmit} className="mt-3 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. Upload Excel FMDs and CSV XREF sheets, compare rules, add HITL review, push to SAP BODS or Postgres..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-[#141418] border border-[#CDD2DE] dark:border-white/[0.15] text-xs text-[#0A0F1F] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D55F5]/30"
                />
                <button
                  type="submit"
                  disabled={isBuildingAi || !aiPrompt.trim()}
                  className="px-4 py-2.5 rounded-xl bg-[#2D55F5] hover:bg-[#1E44D6] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isBuildingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{isBuildingAi ? 'Generating...' : 'Generate Canvas'}</span>
                </button>
              </form>

              <div className="flex flex-wrap gap-1.5 mt-3">
                {AI_PROMPT_EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => setAiPrompt(ex)}
                    className="px-2.5 py-1 rounded-full bg-white/90 dark:bg-white/[0.06] border border-[#E2E8F0] dark:border-white/[0.1] hover:border-[#2D55F5] text-[10px] font-medium text-[#474E61] dark:text-slate-300 truncate max-w-full cursor-pointer transition-colors"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Search & Category Filter Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  category === cat
                    ? 'bg-[#0A0F1F] dark:bg-white text-white dark:text-[#0A0F1F]'
                    : 'bg-white dark:bg-[#18181C] border border-[#E3E6EE] dark:border-white/[0.1] text-[#5F6678] dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Excel, SAP S/4HANA, Snowflake..."
              className="w-full pl-9 pr-3 py-2 rounded-full bg-white dark:bg-[#18181C] border border-[#CDD2DE] dark:border-white/[0.12] text-xs text-[#0A0F1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D55F5]/25"
            />
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-8">
          {filteredTemplates.map((tmpl) => {
            const Icon = tmpl.icon;
            return (
              <div
                key={tmpl.id}
                onClick={() => onSelectTemplate(tmpl)}
                className="group rounded-[20px] bg-white dark:bg-[#18181C] border border-[#E3E6EE] dark:border-white/[0.08] hover:border-[#2D55F5] hover:shadow-md p-5 flex flex-col justify-between cursor-pointer transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F5F8FF] dark:bg-[#2D55F5]/15 border border-[#DCE4FF] dark:border-[#2D55F5]/30 text-[#2D55F5] flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300">
                      {tmpl.badge}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#0A0F1F] dark:text-white group-hover:text-[#2D55F5] transition-colors">
                    {tmpl.name}
                  </h3>
                  <p className="text-xs text-[#5F6678] dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                    {tmpl.description}
                  </p>

                  <div className="mt-3.5 space-y-1.5 text-[11px] bg-[#F8FAFC] dark:bg-white/[0.03] rounded-xl p-2.5 border border-[#EEF2F6] dark:border-white/[0.06]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 font-medium">Source</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">{tmpl.sourceSummary}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 font-medium">Target</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">{tmpl.targetSummary}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F1F3F7] dark:border-white/[0.06] flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {tmpl.nodes.length} customizable nodes
                  </span>
                  <span className="text-xs font-bold text-[#2D55F5] inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Use template
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
