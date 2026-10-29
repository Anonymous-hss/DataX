import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Plus,
  Check,
  X,
  Database,
  FileCode2,
  GitBranch,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  Trash2,
  Copy,
  Settings,
  ArrowRight,
  Sparkles,
  Move,
  Square,
  PenTool,
  MessageSquare,
  ChevronRight,
  Zap,
  Layers,
  FileCheck,
  Play,
  Lock,
  Sliders,
  Users,
  Search,
  RotateCcw,
  FlaskConical,
  Save,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  Eye,
  EyeOff,
  Table,
  Filter,
  Maximize2,
  Hand,
  Loader2,
  Cloud,
  FolderTree,
  UserCheck,
  BookOpen,
  ChevronDown,
  Upload,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import VectorMatcherModalPanel from './nodes/VectorMatcherModalPanel';
import RagModalPanel from './nodes/RagModalPanel';
import ConditionalSwitchModalPanel from './nodes/ConditionalSwitchModalPanel';
import HitlModalPanel from './nodes/HitlModalPanel';
import PineconeModalPanel from './nodes/PineconeModalPanel';
import BigQueryModalPanel from './nodes/BigQueryModalPanel';
import SourceModalPanel from './nodes/SourceModalPanel';
import RulesModalPanel from './nodes/RulesModalPanel';
import RouterModalPanel from './nodes/RouterModalPanel';
import TargetModalPanel from './nodes/TargetModalPanel';
import QuarantineModalPanel from './nodes/QuarantineModalPanel';
import AddNodeCatalogModal from './modals/AddNodeCatalogModal';
import CanvasTelemetryDrawer from './CanvasTelemetryDrawer';
import { OPERATIONAL_CATALOG, sanitizeNode, resolveEngineKey } from './constants/nodeCatalog';
import { addNotification } from '../../services/notificationService';
import { useNavigation } from '../../context/NavigationContext';
import { useRuleEngine } from '../../context/RuleEngineContext';
import { getTableCatalog, getTableData } from '../../data/sampleDatasets';
import { callAiRuleEngine, getDefaultPromptForTable, synthesizeSemanticRules } from '../../utils/aiRuleSynthesizer';
import { TEMPLATE_AUTOFILLS, getWorkflowTemplate } from '../../data/workflowTemplates';

export default function WorkflowCanvasBuilder({ onMoveToNext }) {
  const { navigateTo } = useNavigation();
  const {
    sourceConfig,
    setSourceConfig,
    setUploadedDataset,
    targetConfig,
    setTargetConfig,
    activeRules,
    setActiveRules,
    activeThread,
    selectThread,
    testConnection,
    fetchTableSample,
    executeDryRun,
    executeLiveRun,
    pipelineStatus,
    dryRunResult,
    s4hanaDocNumber,
    workflowNodes,
    setWorkflowNodes,
    workflowEdges,
    setWorkflowEdges,
    activeWorkflowMeta,
    setActiveWorkflowMeta,
    saveWorkflow,
    isSavingWorkflow,
    lastSavedWorkflowTime
  } = useRuleEngine();

  // Determine initial template key
  const isScratchInitial = activeThread?.id === 'scratch' || activeThread?.packKey === 'scratch' || activeThread?.name?.toLowerCase().includes('scratch');
  const defaultTemplateKey = activeThread?.packKey || activeThread?.domainPackId || (activeThread?.name?.includes('Customer') ? 'customer_master_reconciliation' : activeThread?.name?.includes('Ledger') ? 'financial_gl_ledger' : activeThread?.name?.includes('HIPAA') ? 'healthcare_hipaa' : 'sap_bw_s4hana');

  // Viewport State: Pan & Zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const canvasRef = useRef(null);

  // Workflow Graph State: Nodes & Edges (backed by persistent memory & localStorage session)
  const tmpl = getWorkflowTemplate(activeThread || defaultTemplateKey);
  const initialSetup = isScratchInitial ? { nodes: [], edges: [] } : tmpl;
  const [nodes, setNodesState] = useState(() => {
    const rawNodes = (Array.isArray(workflowNodes) && workflowNodes.length >= 2)
      ? workflowNodes
      : initialSetup.nodes;
    const sanitized = (rawNodes || []).map(sanitizeNode);
    // Deduplicate identical type + title nodes that were duplicated in local storage
    const seen = new Set();
    const deduped = [];
    for (const n of sanitized) {
      const key = `${n.type}__${n.title}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(n);
      }
    }
    return deduped;
  });
  const [edges, setEdgesState] = useState(() => {
    if (Array.isArray(workflowEdges) && workflowEdges.length >= 1) {
      return workflowEdges;
    }
    return initialSetup.edges;
  });
  // Track latest nodes in a ref for fast drag performance & mouse release persistence
  const nodesRef = useRef(nodes);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);
  const [isDirty, setIsDirty] = useState(false);
  // Synchronized state setters that immediately update context & localStorage session
  const setNodes = useCallback((updater) => {
    setIsDirty(true);
    setNodesState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      nodesRef.current = next;
      setWorkflowNodes(next);
      return next;
    });
  }, [setWorkflowNodes]);
  const setEdges = useCallback((updater) => {
    setIsDirty(true);
    setEdgesState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setWorkflowEdges(next);
      return next;
    });
  }, [setWorkflowEdges]);
  // Window beforeunload prompt when unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes in your workflow canvas. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);
  // Synchronize when switching workflows from catalog or domain pack
  const lastActiveThreadIdRef = useRef(activeThread?.id);
  useEffect(() => {
    if (activeThread?.id && activeThread.id !== lastActiveThreadIdRef.current) {
      lastActiveThreadIdRef.current = activeThread.id;
      const matchingTmpl = getWorkflowTemplate(activeThread);
      const rawThreadNodes = (Array.isArray(activeThread.nodes) && activeThread.nodes.length >= 2)
        ? activeThread.nodes
        : matchingTmpl.nodes;
      const sanitizedThreadNodes = (rawThreadNodes || []).map(sanitizeNode);
      const seenThread = new Set();
      const resolvedNodes = [];
      for (const n of sanitizedThreadNodes) {
        const key = `${n.type}__${n.title}`;
        if (!seenThread.has(key)) {
          seenThread.add(key);
          resolvedNodes.push(n);
        }
      }
      const resolvedEdges = (Array.isArray(activeThread.edges) && activeThread.edges.length >= 1)
        ? activeThread.edges
        : matchingTmpl.edges;
      setNodesState(resolvedNodes);
      setWorkflowNodes(resolvedNodes);
      setEdgesState(resolvedEdges);
      setWorkflowEdges(resolvedEdges);
      setIsDirty(false);
    }
  }, [activeThread, setWorkflowNodes, setWorkflowEdges]);
  // Execution & Live Status State
  const [isExecutingDryRun, setIsExecutingDryRun] = useState(false);
  const [isExecutingLiveRun, setIsExecutingLiveRun] = useState(false);
  const [executionSummary, setExecutionSummary] = useState(null);
  const [isTelemetryDrawerOpen, setIsTelemetryDrawerOpen] = useState(false);
  const [executionError, setExecutionError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  // Phased Multi-Stage Execution States
  const [executionPhase, setExecutionPhase] = useState('idle'); // 'idle' | 'extracting' | 'compiling' | 'routing' | 'committing' | 'completed'
  const [activeStageNodeId, setActiveStageNodeId] = useState(null);
  const [executionStageText, setExecutionStageText] = useState('');
  const [executionProgress, setExecutionProgress] = useState(0);
  const [executionElapsedMs, setExecutionElapsedMs] = useState(0);
  const [liveNodeStats, setLiveNodeStats] = useState({});
  // Selection & Dragging
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  // Interactive Edge Drawing State (from port to port)
  const [drawingEdge, setDrawingEdge] = useState(null); // { fromNodeId, startX, startY, currentX, currentY }
  // Modals State
  const [isAddNodeModalOpen, setIsAddNodeModalOpen] = useState(false);
  const [isTemplatesDropdownOpen, setIsTemplatesDropdownOpen] = useState(false);
  const [addNodeSearch, setAddNodeSearch] = useState('');
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [activeTool, setActiveTool] = useState('move');
  // Node Property States (for editing inside modal)
  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;
  const [srcDbType, setSrcDbType] = useState('SAP BW');
  const [connectMethod, setConnectMethod] = useState('host'); // 'host' | 'string'
  const [connString, setConnString] = useState(sourceConfig?.connectionUri || '');
  const [showConnString, setShowConnString] = useState(false);
  const [srcHost, setSrcHost] = useState(sourceConfig?.host || 'hana.corp.ondemand.com');
  const [srcPort, setSrcPort] = useState(sourceConfig?.port || '443');
  const [srcDbName, setSrcDbName] = useState(sourceConfig?.database || 'SAP_BW');
  const [srcUser, setSrcUser] = useState(sourceConfig?.user || 'bwp_rfc_user');
  const [srcPass, setSrcPass] = useState(sourceConfig?.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [srcTable, setSrcTable] = useState(sourceConfig?.table || '0PUR_C01');
  // BYO File Ingest State & Live DAG Execution Metrics
  const [uploadedRecords, setUploadedRecords] = useState(sourceConfig?.fileData || null);
  const [uploadedFileName, setUploadedFileName] = useState(sourceConfig?.fileName || '');
  const [uploadedCols, setUploadedCols] = useState(sourceConfig?.discoveredColumns || []);
  const [uploadedFileMeta, setUploadedFileMeta] = useState(sourceConfig?.fileName ? { name: sourceConfig.fileName, count: sourceConfig.fileData?.length || 0 } : null);
  const [dagNodeExecutions, setDagNodeExecutions] = useState({});
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileMeta({ name: file.name, size: (file.size / 1024).toFixed(1) + ' KB', loading: true });
    const reader = new FileReader();
    const isJson = file.name.endsWith('.json');
    if (isJson) {
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          const records = Array.isArray(parsed) ? parsed : (parsed.records || parsed.data || [parsed]);
          const cols = Object.keys(records[0] || {});
          setUploadedRecords(records);
          setUploadedFileName(file.name);
          setUploadedCols(cols);
          setDiscoveredColumns(cols);
          setPreviewRows(records.slice(0, 10));
          setUploadedFileMeta({ name: file.name, size: (file.size / 1024).toFixed(1) + ' KB', count: records.length, loading: false });
        } catch (err) {
          alert('Failed to parse JSON file: ' + err.message);
          setUploadedFileMeta(null);
        }
      };
      reader.readAsText(file);
    } else {
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const records = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          if (records.length === 0) {
            alert('Uploaded file is empty.');
            setUploadedFileMeta(null);
            return;
          }
          const cols = Object.keys(records[0] || {});
          setUploadedRecords(records);
          setUploadedFileName(file.name);
          setUploadedCols(cols);
          setDiscoveredColumns(cols);
          setPreviewRows(records.slice(0, 10));
          setUploadedFileMeta({ name: file.name, size: (file.size / 1024).toFixed(1) + ' KB', count: records.length, loading: false });
        } catch (err) {
          alert('Failed to parse file: ' + err.message);
          setUploadedFileMeta(null);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };
  const [readScope, setReadScope] = useState('selected'); // 'selected' | 'all'
  const [tableSearch, setTableSearch] = useState('');
  const [srcTesting, setSrcTesting] = useState(false);
  const [srcTestMeta, setSrcTestMeta] = useState(null);
  const sourceTestRunIdRef = useRef(0);
  const [previewRows, setPreviewRows] = useState([]);
  const [discoveredColumns, setDiscoveredColumns] = useState([]);
  const [isSamplingLive, setIsSamplingLive] = useState(false);
  const [isLiveSampleActive, setIsLiveSampleActive] = useState(false);
  const [liveTotalRows, setLiveTotalRows] = useState(null);
  const [tgtTesting, setTgtTesting] = useState(false);
  const [tgtTestMeta, setTgtTestMeta] = useState(null);

  const applyEngineCredentials = (engineName, tableName, isManualSwitch = false) => {
    const norm = (engineName || '').toLowerCase();
    if (isManualSwitch) {
      setSrcTestMeta(null);
      setIsLiveSampleActive(false);
      setLiveTotalRows(null);
    }
    if (norm.includes('azure') || norm.includes('blob')) {
      setSrcDbType('Azure');
      setSrcHost(import.meta.env.VITE_AZURE_STORAGE_ACCOUNT || import.meta.env.AZURE_STORAGE_ACCOUNT || 'irepazurestorage');
      setSrcPort(import.meta.env.VITE_AZURE_STORAGE_CONTAINER || import.meta.env.AZURE_STORAGE_CONTAINER || 'telemetry-container');
      setSrcDbName(import.meta.env.VITE_AZURE_TENANT_ID || import.meta.env.AZURE_TENANT_ID || '');
      setSrcUser(import.meta.env.VITE_AZURE_CLIENT_ID || import.meta.env.AZURE_CLIENT_ID || '');
      setSrcPass(import.meta.env.VITE_AZURE_STORAGE_KEY || import.meta.env.AZURE_STORAGE_KEY || '');
      setSrcTable(tableName || 'telemetry_logs.parquet');
    } else if (norm.includes('s3') || norm.includes('aws')) {
      setSrcDbType('AWS S3');
      setSrcPort(import.meta.env.VITE_AWS_DEFAULT_REGION || import.meta.env.AWS_DEFAULT_REGION || 'us-east-1');
      setSrcHost(import.meta.env.VITE_AWS_S3_BUCKET_URI || import.meta.env.AWS_S3_BUCKET_URI || 's3://datax-enterprise-lake/raw-landing/');
      setSrcDbName('Parquet (Snappy)');
      setSrcUser(import.meta.env.VITE_AWS_ACCESS_KEY_ID || import.meta.env.AWS_ACCESS_KEY_ID || '');
      setSrcPass(import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || import.meta.env.AWS_SECRET_ACCESS_KEY || '');
      setSrcTable(tableName || 'orders_2026_q1.parquet');
    } else if (norm.includes('salesforce') || norm.includes('crm')) {
      setSrcDbType('Salesforce');
      setSrcPort('443');
      setSrcHost(import.meta.env.VITE_SALESFORCE_INSTANCE_URL || import.meta.env.SALESFORCE_INSTANCE_URL || 'login.salesforce.com');
      setSrcDbName(import.meta.env.VITE_SALESFORCE_CLIENT_ID || import.meta.env.SALESFORCE_CLIENT_ID || '');
      setSrcUser(import.meta.env.VITE_SALESFORCE_USERNAME || import.meta.env.SALESFORCE_USERNAME || '');
      setSrcPass(import.meta.env.VITE_SALESFORCE_PASSWORD || import.meta.env.SALESFORCE_PASSWORD || '');
      setSrcTable(tableName || 'Account');
    } else if (norm.includes('mongo')) {
      setSrcDbType('MongoDB');
      if (!isManualSwitch && sourceConfig?.engine === 'mongodb' && (sourceConfig?.host || sourceConfig?.connectionUri)) {
        setSrcPort(sourceConfig.port || '27017');
        setSrcHost(sourceConfig.host || 'cluster0.tb6bhff.mongodb.net');
        setSrcDbName(sourceConfig.database || 'datax_staging');
        setSrcUser(sourceConfig.user || 'harshal');
        setSrcPass(sourceConfig.password || '');
        if (sourceConfig.connectionUri) setConnString(sourceConfig.connectionUri);
        setSrcTable(tableName || sourceConfig.table || 'raw_customers');
      } else {
        setSrcPort('27017');
        setSrcHost(import.meta.env.VITE_MONGO_HOST || 'cluster0.tb6bhff.mongodb.net');
        setSrcDbName('datax_staging');
        setSrcUser(import.meta.env.VITE_MONGO_USER || 'harshal');
        setSrcPass(import.meta.env.VITE_MONGO_PASSWORD || '');
        setSrcTable(tableName || 'raw_customers');
      }
    } else if (norm.includes('postgres')) {
      setSrcDbType('PostgreSQL');
      if (!isManualSwitch && sourceConfig?.engine === 'postgres' && (sourceConfig?.host || sourceConfig?.connectionUri)) {
        setSrcPort(sourceConfig.port || '5432');
        setSrcHost(sourceConfig.host || 'postgres.internal.net');
        setSrcDbName(sourceConfig.database || 'neondb');
        setSrcUser(sourceConfig.user || 'neondb_owner');
        setSrcPass(sourceConfig.password || '');
        if (sourceConfig.connectionUri) setConnString(sourceConfig.connectionUri);
        setSrcTable(tableName || sourceConfig.table || 'customers');
      } else {
        setSrcPort('5432');
        setSrcHost(import.meta.env.VITE_POSTGRES_HOST || 'postgres.internal.net');
        setSrcDbName('neondb');
        setSrcUser(import.meta.env.VITE_POSTGRES_USER || 'ruleengineadmin');
        setSrcPass(import.meta.env.VITE_POSTGRES_PASSWORD || '');
        setSrcTable(tableName || 'users');
      }
    } else if (norm.includes('snowflake')) {
      setSrcDbType('Snowflake');
      setSrcPort('443');
      setSrcHost(import.meta.env.VITE_SNOWFLAKE_HOST || 'xy12345.us-east-1.snowflakecomputing.com');
      setSrcDbName('ANALYTICS_LANDING');
      setSrcUser(import.meta.env.VITE_SNOWFLAKE_USER || 'datax_svc');
      setSrcPass(import.meta.env.VITE_SNOWFLAKE_PASSWORD || '');
      setSrcTable(tableName || '0PUR_C01');
    } else {
      setSrcDbType('SAP BW');
      setSrcPort('443');
      setSrcHost(import.meta.env.VITE_SAP_HOST || 'hana.corp.ondemand.com');
      setSrcDbName('SAP_BW');
      setSrcUser(import.meta.env.VITE_SAP_USER || 'bwp_rfc_user');
      setSrcPass(import.meta.env.VITE_SAP_PASSWORD || '');
      setSrcTable(tableName || '0PUR_C01');
    }
  };

  const openNodeSettings = (node) => {
    setSelectedNodeId(node.id);
    if (node.type === 'source') {
      sourceTestRunIdRef.current += 1;
      setSrcTesting(false);
      if (node.system?.includes('File') || sourceConfig?.engine === 'file_upload' || sourceConfig?.fileData) {
        setConnectMethod('upload');
      } else {
        applyEngineCredentials(node.system || node.title, node.table, false);
      }
    }
    setIsPropertyModalOpen(true);
  };

  // Rules Modal states
  const [rulesPrompt, setRulesPrompt] = useState(getDefaultPromptForTable(srcTable, 'sap_bw'));
  const [rulesList, setRulesList] = useState(activeRules || []);
  const [rulesGenerating, setRulesGenerating] = useState(false);
  const [autoFixActive, setAutoFixActive] = useState(true);
  const [showAddCustomRule, setShowAddCustomRule] = useState(false);
  const [newRuleField, setNewRuleField] = useState('');
  const [newRuleCondition, setNewRuleCondition] = useState('');
  const [newRuleSeverity, setNewRuleSeverity] = useState('Critical');
  const [newRuleDesc, setNewRuleDesc] = useState('');
  // Router Modal states
  const [routerThreshold, setRouterThreshold] = useState(90);
  const [routerAutoFixPolicy, setRouterAutoFixPolicy] = useState('autonomous'); // 'autonomous' | 'strict_quarantine'
  // Semantic Vector Matcher states
  const [vectorModel, setVectorModel] = useState('text-embedding-3-small');
  const [vectorTargetField, setVectorTargetField] = useState('VENDOR_NAME');
  const [vectorThreshold, setVectorThreshold] = useState(85);
  const [vectorIndex, setVectorIndex] = useState('Azure AI Search (enterprise-vendors)');
  const [vectorAutoResolve, setVectorAutoResolve] = useState(true);
  // RAG Context Enricher states
  const [ragKnowledgeBase, setRagKnowledgeBase] = useState('Azure AI Search (enterprise-policies)');
  const [ragQueryKey, setRagQueryKey] = useState('ITEM_DESCRIPTION');
  const [ragTopK, setRagTopK] = useState(3);
  const [ragTargetField, setRagTargetField] = useState('RAG_CONTEXT_METADATA');
  const [ragFallback, setRagFallback] = useState('pass_thru');
  // Conditional Router states (simple IF / ELSE — exactly 2 outputs)
  const [conditionField, setConditionField] = useState('TOTAL_AMOUNT');
  const [conditionOp, setConditionOp] = useState('>');
  const [conditionVal, setConditionVal] = useState('50000');
  const [condTrueDest, setCondTrueDest] = useState('High-Value Review');
  const [condFalseDest, setCondFalseDest] = useState('Standard Flow');
  // Human-in-the-Loop states
  const [hitlTriggerPolicy, setHitlTriggerPolicy] = useState('amount_threshold');
  const [hitlReviewerRole, setHitlReviewerRole] = useState('Procurement Controller');
  const [hitlSlaTimeout, setHitlSlaTimeout] = useState('8');
  const [hitlWebhook, setHitlWebhook] = useState('');
  const [hitlActionMode, setHitlActionMode] = useState('approve_reject');
  const [hitlConditionType, setHitlConditionType] = useState('preset');
  const [hitlCustomField, setHitlCustomField] = useState('TOTAL_AMOUNT');
  const [hitlCustomOp, setHitlCustomOp] = useState('>');
  const [hitlCustomVal, setHitlCustomVal] = useState('50000');
  const [hitlCustomExpression, setHitlCustomExpression] = useState('TOTAL_AMOUNT > 50000');
  // Pinecone Vector DB states (loaded securely from .env)
  const [pineconeIndex, setPineconeIndex] = useState(import.meta.env.VITE_PINECONE_INDEX || import.meta.env.PINECONE_INDEX || 'enterprise-knowledge-base');
  const [pineconeHost, setPineconeHost] = useState(import.meta.env.VITE_PINECONE_HOST || import.meta.env.PINECONE_HOST || '');
  const [pineconeApiKey, setPineconeApiKey] = useState(import.meta.env.VITE_PINECONE_API_KEY || import.meta.env.PINECONE_API_KEY || '');
  const [pineconeNamespace, setPineconeNamespace] = useState(import.meta.env.VITE_PINECONE_NAMESPACE || import.meta.env.PINECONE_NAMESPACE || 'production');
  const [pineconeDimension, setPineconeDimension] = useState(import.meta.env.VITE_PINECONE_DIMENSION || import.meta.env.PINECONE_DIMENSION || '1024');
  const [pineconeMetric, setPineconeMetric] = useState('cosine');
  // Google BigQuery states (loaded securely from .env)
  const [bqProject, setBqProject] = useState(import.meta.env.VITE_BIGQUERY_PROJECT_ID || import.meta.env.BIGQUERY_PROJECT_ID || '');
  const [bqDataset, setBqDataset] = useState(import.meta.env.VITE_BIGQUERY_DATASET_ID || import.meta.env.BIGQUERY_DATASET_ID || '');
  const [bqTable, setBqTable] = useState('0PUR_C01_clean');
  const [bqLocation, setBqLocation] = useState(import.meta.env.VITE_BIGQUERY_LOCATION || import.meta.env.BIGQUERY_LOCATION || 'US');
  const [bqEmail, setBqEmail] = useState(import.meta.env.VITE_BIGQUERY_CLIENT_EMAIL || import.meta.env.BIGQUERY_CLIENT_EMAIL || '');
  const [bqKeyId, setBqKeyId] = useState(import.meta.env.VITE_BIGQUERY_PRIVATE_KEY_ID || import.meta.env.BIGQUERY_PRIVATE_KEY_ID || '');
  const [bqWriteMode, setBqWriteMode] = useState('append');
  // Target Modal states
  const [tgtDbType, setTgtDbType] = useState('SAP S/4HANA');
  const [tgtEndpoint, setTgtEndpoint] = useState(targetConfig?.connectionUri || 'https://s4h.corp.ondemand.com/sap/bc/srt/rfc/sap/z_bapi_po_create1');
  const [tgtTable, setTgtTable] = useState(targetConfig?.table || '0PUR_C01_clean');
  const [writeMode, setWriteMode] = useState(targetConfig?.writeMode || 'append'); // 'append' | 'upsert' | 'overwrite'
  const [targetVerificationGate, setTargetVerificationGate] = useState(true);
  // Quarantine Modal states
  const [quarantineTable, setQuarantineTable] = useState(targetConfig?.quarantineTable || '0PUR_C01_quarantine');
  const [quarantinePolicy, setQuarantinePolicy] = useState('audit_locked'); // 'audit_locked' | 'review_required'
  const [quarantineAlertWebhook, setQuarantineAlertWebhook] = useState(true);
  const activeEngineKey = resolveEngineKey(srcDbType);

  const loadLiveTablePreview = useCallback(async (tableNameToSample, dbOverride, customConfig = null) => {
    setIsSamplingLive(true);
    try {
      const rawHost = (customConfig?.host ?? srcHost ?? '').trim();
      const isHostFullUri = /^(mongodb(\+srv)?:\/\/|postgres(ql)?:\/\/|jdbc:)/i.test(rawHost);
      const effectiveUri = connectMethod === 'string'
        ? (connString || '').trim()
        : (isHostFullUri ? rawHost : (customConfig?.connectionUri || undefined));

      const sampleRes = await fetchTableSample(
        tableNameToSample,
        25,
        effectiveUri,
        {
          engine: customConfig?.engine || activeEngineKey,
          connectionUri: effectiveUri,
          host: rawHost,
          port: customConfig?.port ?? srcPort,
          database: dbOverride || customConfig?.database || srcTestMeta?.database || srcDbName,
          user: customConfig?.user ?? srcUser,
          password: customConfig?.password ?? srcPass,
          table: tableNameToSample,
        }
      );
      if (sampleRes && sampleRes.success && Array.isArray(sampleRes.rows) && sampleRes.rows.length > 0) {
        const cols = sampleRes.columns && sampleRes.columns.length > 0
          ? sampleRes.columns
          : Object.keys(sampleRes.rows[0]);
        const sampleSlice = sampleRes.rows.slice(0, 5);
        setPreviewRows(sampleSlice);
        setDiscoveredColumns(cols);
        setLiveTotalRows(sampleRes.totalRows || sampleRes.count || sampleRes.rows.length);
        setIsLiveSampleActive(true);
        if (sampleRes.database && sampleRes.database !== srcDbName) {
          setSrcDbName(sampleRes.database);
        }
        const drafted = getDefaultPromptForTable(
          tableNameToSample,
          customConfig?.engine || activeEngineKey,
          cols,
          sampleSlice
        );
        setRulesPrompt(drafted);
        const synthesized = synthesizeSemanticRules({
          prompt: drafted,
          columns: cols,
          sampleRows: sampleSlice,
          tableName: tableNameToSample,
        });
        if (synthesized?.length) {
          setRulesList(synthesized);
          setActiveRules(synthesized);
        }
        return true;
      }
    } catch (err) {
      console.warn('Live table preview sampling error:', err);
    } finally {
      setIsSamplingLive(false);
    }
    return false;
  }, [connectMethod, connString, srcHost, srcPort, srcDbName, srcUser, srcPass, activeEngineKey, srcTestMeta, fetchTableSample]);

  // Synchronize table preview data and schema columns (Live DB when connected, Demo Sandbox fallback otherwise)
  useEffect(() => {
    let cancelled = false;
    const syncPreview = async () => {
      if (srcTestMeta?.success && Array.isArray(srcTestMeta?.tables) && srcTestMeta.tables.includes(srcTable)) {
        const ok = await loadLiveTablePreview(srcTable, srcTestMeta.database);
        if (ok || cancelled) return;
      }
      const tableData = getTableData(srcTable, activeEngineKey, 5);
      if (!cancelled) {
        const rows = tableData.rows || [];
        const cols = tableData.columns || [];
        setPreviewRows(rows);
        setDiscoveredColumns(cols);
        setIsLiveSampleActive(false);
        const drafted = getDefaultPromptForTable(srcTable, activeEngineKey, cols, rows);
        setRulesPrompt(drafted);
        const synthesized = synthesizeSemanticRules({
          prompt: drafted,
          columns: cols,
          sampleRows: rows,
          tableName: srcTable,
        });
        if (synthesized?.length) {
          setRulesList(synthesized);
          setActiveRules(synthesized);
        }
      }
    };
    syncPreview();
    return () => {
      cancelled = true;
    };
  }, [srcTable, srcDbType, srcTestMeta?.success]);

  useEffect(() => {
    if (activeRules && activeRules.length > 0) {
      setRulesList(activeRules);
    }
  }, [activeRules]);
  // Auto-seed credentials on mount if not already present
  useEffect(() => {
    if (!isScratchInitial) {
      const tmpl = TEMPLATE_AUTOFILLS[defaultTemplateKey] || TEMPLATE_AUTOFILLS.sap_bw_s4hana;
      if ((!sourceConfig?.host && !sourceConfig?.connectionUri) && tmpl?.sourceConfig) {
        setSourceConfig(tmpl.sourceConfig);
      }
      if ((!targetConfig?.host && !targetConfig?.connectionUri) && tmpl?.targetConfig) {
        setTargetConfig(tmpl.targetConfig);
      }
    }
  }, []);
  // Synchronize local modal & context states with persisted canvas nodes on mount
  useEffect(() => {
    const srcNode = nodes.find(n => n.type === 'source');
    if (srcNode) {
      if (srcNode.table && srcNode.table !== '0PUR_C01' && srcTable === '0PUR_C01') {
        setSrcTable(srcNode.table);
      }
      const sysLower = String(srcNode.system || '').toLowerCase();
      if (sysLower.includes('mongo') && srcDbType === 'SAP BW') {
        setSrcDbType('MongoDB');
        setSourceConfig(prev => ({
          ...prev,
          engine: 'mongodb',
          table: srcNode.table || prev.table || 'raw_invoices',
          database: prev.database || 'datax_staging'
        }));
      } else if (sysLower.includes('postgres') && srcDbType === 'SAP BW') {
        setSrcDbType('PostgreSQL');
        setSourceConfig(prev => ({
          ...prev,
          engine: 'postgres',
          table: srcNode.table || prev.table
        }));
      }
    }
    const tgtNode = nodes.find(n => n.type === 'target');
    if (tgtNode) {
      if (tgtNode.table && tgtNode.table !== '0PUR_C01_clean' && tgtTable === '0PUR_C01_clean') {
        setTgtTable(tgtNode.table);
      }
      const tSysLower = String(tgtNode.system || '').toLowerCase();
      if (tSysLower.includes('postgres') && tgtDbType.includes('SAP')) {
        setTgtDbType('PostgreSQL');
        setTargetConfig(prev => ({
          ...prev,
          engine: 'postgres',
          table: tgtNode.table || prev.table || 'raw_invoices_clean'
        }));
      }
    }
  }, [nodes, srcTable, srcDbType, tgtTable, tgtDbType, setSourceConfig, setTargetConfig]);

  // Hash synchronization: Select relevant node without auto-popping modal (popup only on settings icon click)
  useEffect(() => {
    const hash = (window.location.hash || '').toLowerCase();
    if (hash.includes('source') || hash.includes('connect-source')) {
      const srcNode = nodes.find(n => n.type === 'source');
      if (srcNode) {
        setSelectedNodeId(srcNode.id);
      }
    } else if (hash.includes('rule')) {
      const ruleNode = nodes.find(n => n.type === 'rules');
      if (ruleNode) {
        setSelectedNodeId(ruleNode.id);
      }
    } else if (hash.includes('target') || hash.includes('connect-target')) {
      const tgtNode = nodes.find(n => n.type === 'target');
      if (tgtNode) {
        setSelectedNodeId(tgtNode.id);
      }
    }
  }, [nodes]);
  // Fit Canvas and all nodes within window viewport
  const handleFitToWindow = useCallback(() => {
    if (!canvasRef.current || nodes.length === 0) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }
    const rect = canvasRef.current.getBoundingClientRect();
    const padding = 70;
    const minX = Math.min(...nodes.map(n => n.x));
    const maxX = Math.max(...nodes.map(n => n.x + (n.width || 260)));
    const minY = Math.min(...nodes.map(n => n.y));
    const maxY = Math.max(...nodes.map(n => n.y + (n.height || 135)));
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    if (rect.width > 0 && rect.height > 0 && contentWidth > 0 && contentHeight > 0) {
      const scaleX = (rect.width - padding * 2) / contentWidth;
      const scaleY = (rect.height - padding * 2) / contentHeight;
      const newZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.55), 1.05);
      const centeredX = (rect.width - contentWidth * newZoom) / 2 - minX * newZoom;
      const centeredY = (rect.height - contentHeight * newZoom) / 2 - minY * newZoom;
      setZoom(Number(newZoom.toFixed(2)));
      setPan({ x: Math.round(centeredX), y: Math.round(centeredY) });
    }
  }, [nodes]);
  // Initial Auto-fit to window when canvas mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFitToWindow();
    }, 120);
    return () => clearTimeout(timer);
  }, [handleFitToWindow]);
  // Autofill Template Action
  const handleAutofillTemplate = (templateKey) => {
    const template = TEMPLATE_AUTOFILLS[templateKey];
    if (template) {
      setNodes(template.nodes);
      setEdges(template.edges);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setExecutionSummary(null);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      // Synchronize with RuleEngineContext and APIs!
      if (selectThread) selectThread(templateKey);
      if (template.sourceConfig) {
        setSourceConfig(template.sourceConfig);
        const engineMap = {
          sap_bw: 'SAP BW',
          mongodb: 'MongoDB',
          postgres: 'PostgreSQL',
          aws_s3: 'AWS S3',
          s3: 'AWS S3',
          salesforce: 'Salesforce CRM',
          azure: 'Azure Blob',
          snowflake: 'Snowflake Data Cloud'
        };
        setSrcDbType(engineMap[template.sourceConfig.engine] || 'PostgreSQL');
        setSrcHost(template.sourceConfig.host || '');
        setSrcPort(template.sourceConfig.port || '5432');
        setSrcDbName(template.sourceConfig.database || '');
        setSrcUser(template.sourceConfig.user || '');
        setSrcTable(template.sourceConfig.table || '');
      }
      if (template.targetConfig) {
        setTargetConfig(template.targetConfig);
        const tgtEngineMap = {
          s4_hana: 'SAP S/4HANA',
          postgres: 'PostgreSQL',
          bigquery: 'Google BigQuery',
          pinecone: 'Pinecone Vector DB',
          databricks: 'Databricks Lakehouse'
        };
        setTgtDbType(tgtEngineMap[template.targetConfig.engine] || 'PostgreSQL');
        setTgtTable(template.targetConfig.table || '');
      }
      if (template.rules && template.rules.length > 0) {
        setActiveRules(template.rules);
        setRulesList(template.rules);
      }
      // Auto-fit to viewport after template loads
      setTimeout(() => {
        handleFitToWindow();
      }, 100);
    }
  };
  // Clear Canvas (Empty Canvas Flow)
  const handleClearCanvas = () => {
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setExecutionSummary(null);
  };
  // Helper to step visually through the pipeline nodes with enterprise latency
  const runPhasedStages = async (isLive = false) => {
    // Stage 1: Source Ingestion
    setExecutionPhase('extracting');
    setActiveStageNodeId('node-source');
    setExecutionProgress(25);
    setExecutionStageText('Stage 1/4: Ingesting raw stream (1,420 rows) from SAP BW InfoCube 0PUR_C01...');
    await new Promise(r => setTimeout(r, 900));
    // Stage 2: Intelligence Engine & DuckDB AST
    setExecutionPhase('compiling');
    setActiveStageNodeId('node-rules');
    setExecutionProgress(50);
    setExecutionStageText('Stage 2/4: Compiling AI Clean Core ontologies & evaluating rules in-process via Intelligence Engine (DuckDB AST)...');
    await new Promise(r => setTimeout(r, 1000));
    // Stage 3: CleanFlow Router
    setExecutionPhase('routing');
    setActiveStageNodeId('node-router');
    setExecutionProgress(75);
    setExecutionStageText('Stage 3/4: CleanFlow Router splitting evaluated stream: Compliant vs Auto-Fix vs Quarantine...');
    await new Promise(r => setTimeout(r, 850));
    // Stage 4: Target Write & Quarantine Vault
    setExecutionPhase('committing');
    setActiveStageNodeId('committing');
    setExecutionProgress(90);
    setExecutionStageText(isLive
      ? 'Stage 4/4: Committing verified clean stream live to S/4HANA (BAPI_PO_CREATE1) & locking quarantine vault...'
      : 'Stage 4/4: Dry Run verification: Staging clean stream & isolating non-compliant records in quarantine store...'
    );
    await new Promise(r => setTimeout(r, 800));
  };
  // Execution Handlers (Dry Run & Live Run)
  const handleDryRun = async () => {
    setIsExecutingDryRun(true);
    setExecutionSummary(null);
    setExecutionError(null);
    setExecutionProgress(5);
    setExecutionPhase('extracting');
    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      setExecutionElapsedMs(Date.now() - startTime);
    }, 100);
    try {
      const tmpl = TEMPLATE_AUTOFILLS[defaultTemplateKey] || TEMPLATE_AUTOFILLS.sap_bw_s4hana;
      if ((!sourceConfig?.host && !sourceConfig?.connectionUri) && tmpl.sourceConfig) {
        setSourceConfig(tmpl.sourceConfig);
      }
      if ((!targetConfig?.host && !targetConfig?.connectionUri) && tmpl.targetConfig) {
        setTargetConfig(tmpl.targetConfig);
      }
      // Execute backend API and visual stage transitions concurrently
      const [res] = await Promise.all([
        executeDryRun(),
        runPhasedStages(false)
      ]);
      if (res && res.error) {
        setExecutionError({
          title: 'Dry Run Blocked',
          message: res.message || res.error || 'Pipeline execution failed. Please verify credentials and rule configuration.'
        });
      } else if (res) {
        const total = res.totalChecked ?? ((res.cleanCount || 0) + (res.autoFixedCount || 0) + (res.quarantinedCount || 0));
        // Store DAG node executions from backend (supports both Array and Object map)
        let normalizedDagExecs = {};
        if (res.nodeExecutions) {
          if (Array.isArray(res.nodeExecutions)) {
            res.nodeExecutions.forEach(ne => {
              if (ne && ne.nodeId) normalizedDagExecs[ne.nodeId] = ne;
            });
          } else if (typeof res.nodeExecutions === 'object') {
            normalizedDagExecs = res.nodeExecutions;
          }
          setDagNodeExecutions(normalizedDagExecs);
        }
        setExecutionSummary({
          total,
          clean: res.cleanCount ?? 0,
          fixed: res.autoFixedCount ?? 0,
          quarantined: res.quarantinedCount ?? 0,
          health: res.passRate ?? 0,
          financialExposureHeld: res.financialExposureHeld ?? null,
          monetaryColumn: res.monetaryColumn ?? null,
          consensusGuard: res.consensusGuard || null,
          healthMetrics: res.healthMetrics || null,
          driftMetrics: res.driftMetrics || null,
          ruleOutcomes: res.ruleOutcomes || [],
          sampleValidRecords: res.sampleValidRecords || [],
          sampleAutofixedRecords: res.sampleAutofixedRecords || [],
          sampleQuarantinedRecords: res.sampleQuarantinedRecords || [],
          nodeExecutions: normalizedDagExecs,
          traceLogs: res.traceLogs || [],
          elapsedMs: res.elapsedMs || null,
          sourceTable: (nodes.find(n => n.type === 'source')?.table && nodes.find(n => n.type === 'source')?.table !== '0PUR_C01') ? nodes.find(n => n.type === 'source').table : srcTable,
          sourceEngine: nodes.find(n => n.type === 'source')?.system || srcDbType,
          targetTable: (nodes.find(n => n.type === 'target')?.table && nodes.find(n => n.type === 'target')?.table !== '0PUR_C01_clean') ? nodes.find(n => n.type === 'target').table : tgtTable,
          targetEngine: nodes.find(n => n.type === 'target')?.system || tgtDbType,
          columns: discoveredColumns,
          isLive: false
        });
        // Update live stats across canvas node cards
        setLiveNodeStats({
          source: `${total.toLocaleString()} rows`,
          rules: `${activeRules.length} Active Rules`,
          router: `${res.cleanCount} Clean · ${res.autoFixedCount} Fixed · ${res.quarantinedCount} Quarantined`,
          target: `${(res.cleanCount ?? 0).toLocaleString()} clean`,
          quarantine: `${(res.quarantinedCount ?? 0).toLocaleString()} held`
        });
        addNotification({
          title: 'Pipeline Dry-Run Completed',
          description: `Evaluated ${total.toLocaleString()} rows with ${res.passRate ?? 98.4}% health (${res.quarantinedCount ?? 0} quarantined).`,
          type: (res.quarantinedCount && res.quarantinedCount > 0) ? 'warning' : 'success',
          link: '#history'
        });
      }
      setIsTelemetryDrawerOpen(true);
      setExecutionProgress(100);
      setExecutionPhase('completed');
    } catch (err) {
      console.warn('Dry run execution error:', err);
      setExecutionError({
        title: 'Dry Run Execution Error',
        message: err.message || 'An unexpected error occurred during dry run execution.'
      });
      addNotification({
        title: 'Dry Run Execution Error',
        description: err.message || 'An unexpected error occurred during dry run.',
        type: 'error',
        link: '#canvas'
      });
    } finally {
      clearInterval(timerInterval);
      setIsExecutingDryRun(false);
      setActiveStageNodeId(null);
    }
  };
  const handleRunLive = async () => {
    setIsExecutingLiveRun(true);
    setExecutionSummary(null);
    setExecutionError(null);
    setExecutionProgress(5);
    setExecutionPhase('extracting');
    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      setExecutionElapsedMs(Date.now() - startTime);
    }, 100);
    try {
      const [res] = await Promise.all([
        executeLiveRun(),
        runPhasedStages(true)
      ]);
      if (res) {
        // Store DAG node executions from backend (supports both Array and Object map)
        let normalizedDagExecs = {};
        if (res.nodeExecutions) {
          if (Array.isArray(res.nodeExecutions)) {
            res.nodeExecutions.forEach(ne => {
              if (ne && ne.nodeId) normalizedDagExecs[ne.nodeId] = ne;
            });
          } else if (typeof res.nodeExecutions === 'object') {
            normalizedDagExecs = res.nodeExecutions;
          }
          setDagNodeExecutions(normalizedDagExecs);
        }
        setExecutionSummary({
          total: res.rows ?? 0,
          clean: res.clean ?? 0,
          fixed: res.autoFixed ?? 0,
          quarantined: res.quarantined ?? 0,
          health: res.health ?? 0,
          financialExposureHeld: res.financialExposureHeld ?? null,
          monetaryColumn: res.monetaryColumn ?? null,
          consensusGuard: res.consensusGuard || null,
          healthMetrics: res.healthMetrics || null,
          driftMetrics: res.driftMetrics || null,
          ruleOutcomes: res.ruleOutcomes || [],
          sampleValidRecords: res.sampleValidRecords || [],
          sampleAutofixedRecords: res.sampleAutofixedRecords || [],
          sampleQuarantinedRecords: res.sampleQuarantinedRecords || [],
          nodeExecutions: normalizedDagExecs,
          traceLogs: res.traceLogs || [],
          elapsedMs: res.elapsedMs || null,
          sourceTable: (nodes.find(n => n.type === 'source')?.table && nodes.find(n => n.type === 'source')?.table !== '0PUR_C01') ? nodes.find(n => n.type === 'source').table : srcTable,
          sourceEngine: nodes.find(n => n.type === 'source')?.system || srcDbType,
          targetTable: (nodes.find(n => n.type === 'target')?.table && nodes.find(n => n.type === 'target')?.table !== '0PUR_C01_clean') ? nodes.find(n => n.type === 'target').table : tgtTable,
          targetEngine: nodes.find(n => n.type === 'target')?.system || tgtDbType,
          columns: discoveredColumns,
          docNo: res.docNo || s4hanaDocNumber || '#COMMIT-SUCCESS',
          isLive: true
        });
        setLiveNodeStats({
          source: `${(res.rows || 1420).toLocaleString()} rows`,
          rules: `${activeRules.length} Active Rules`,
          router: `${res.clean} Clean · ${res.autoFixed} Fixed · ${res.quarantined} Quarantined`,
          target: `${(res.clean ?? 0).toLocaleString()} committed`,
          quarantine: `${(res.quarantined ?? 0).toLocaleString()} isolated`
        });
        addNotification({
          title: 'Production Pipeline Committed',
          description: `Committed ${res.clean ?? 0} rows to target ledger (Doc: ${res.docNo || s4hanaDocNumber || '#COMMIT-SUCCESS'}).`,
          type: 'success',
          link: '#history'
        });
        if (res.quarantined && res.quarantined > 0) {
          addNotification({
            title: 'Quarantine Review Required',
            description: `${res.quarantined} anomalous records isolated for Data Steward review.`,
            type: 'warning',
            link: '#quarantine'
          });
        }
      }
      setIsTelemetryDrawerOpen(true);
      setExecutionProgress(100);
      setExecutionPhase('completed');
    } catch (err) {
      console.warn('Live run execution error:', err);
      setExecutionError({
        title: 'Live Commit Failed',
        message: err.message || 'Live pipeline commit failed. Check database credentials or node configuration.'
      });
      addNotification({
        title: 'Live Commit Failed',
        description: err.message || 'Live pipeline commit failed.',
        type: 'error',
        link: '#canvas'
      });
    } finally {
      clearInterval(timerInterval);
      setIsExecutingLiveRun(false);
      setActiveStageNodeId(null);
    }
  };
  const handleSaveWorkflow = async () => {
    try {
      const res = await saveWorkflow({
        nodes,
        edges,
        sourceConfig,
        targetConfig,
        rules: activeRules,
        meta: {
          id: activeThread?.id || activeWorkflowMeta?.id || 'thread_sap_s4hana',
          name: activeThread?.name || activeWorkflowMeta?.name || 'Enterprise CleanFlow Pipeline',
          category: activeThread?.category || activeWorkflowMeta?.category || 'ERP Modernization',
          badge: activeThread?.badge || activeWorkflowMeta?.badge || 'CleanFlow Dynamic Graph',
          status: 'active'
        }
      });
      if (res && res.success) {
        setIsDirty(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Save workflow failed:', err);
    }
  };
  // =========================================================================
  // MOUSE CONTROLS: WHEEL PANNING & CTRL-WHEEL ZOOM (No auto-zoom on scroll)
  // Native non-passive wheel listener guarantees prevention of browser window scroll/zoom
  // =========================================================================
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheelNative = (e) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        // Zooming only with Ctrl / Cmd (or trackpad pinch)
        const zoomFactor = -e.deltaY * 0.002;
        setZoom(prev => Math.min(Math.max(prev + zoomFactor, 0.4), 2.0));
      } else {
        // Smooth panning on normal mouse wheel / trackpad scroll — NO AUTO-ZOOMING!
        setPan(prev => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY
        }));
      }
    };
    el.addEventListener('wheel', onWheelNative, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheelNative);
    };
  }, []);
  const handleCanvasMouseDown = (e) => {
    // If clicking on an input, button, port, do not pan canvas
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select') || e.target.closest('textarea')) {
      return;
    }
    if (e.target.closest('.workflow-node-card') && activeTool !== 'pan') {
      return;
    }
    if (activeTool !== 'pan') {
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
    }
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX - pan.x,
      y: e.clientY - pan.y
    };
  };
  const handleMouseMove = useCallback((e) => {
    if (draggingNodeId) {
      const newX = Math.round((e.clientX - pan.x) / zoom - dragOffsetRef.current.x);
      const newY = Math.round((e.clientY - pan.y) / zoom - dragOffsetRef.current.y);
      setNodesState(prev => {
        const next = prev.map(n => n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n);
        nodesRef.current = next;
        return next;
      });
    } else if (drawingEdge) {
      setDrawingEdge(prev => prev ? ({
        ...prev,
        currentX: Math.round((e.clientX - pan.x) / zoom),
        currentY: Math.round((e.clientY - pan.y) / zoom)
      }) : null);
    } else if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      });
    }
  }, [draggingNodeId, drawingEdge, isPanning, pan, zoom]);
  const handleMouseUp = useCallback(() => {
    if (draggingNodeId) {
      // Commit final dragged node coordinates to memory session and storage
      setWorkflowNodes(nodesRef.current);
    }
    setDraggingNodeId(null);
    setIsPanning(false);
    setDrawingEdge(null);
  }, [draggingNodeId, setWorkflowNodes]);
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);
  // =========================================================================
  // NODE DRAGGING & SELECTION (Popup opens ONLY when settings icon is clicked)
  // =========================================================================
  const handleNodeMouseDown = (e, nodeId) => {
    if (activeTool === 'pan') {
      // In pan mode, let canvas pan instead of dragging node
      return;
    }
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
    setDraggingNodeId(nodeId);
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    dragOffsetRef.current = {
      x: (e.clientX - pan.x) / zoom - node.x,
      y: (e.clientY - pan.y) / zoom - node.y
    };
  };
  const handleNodeClick = (e, node) => {
    e.stopPropagation();
    setSelectedNodeId(node.id);
    // Popup appears ONLY when settings icon is clicked, NOT on node click!
  };
  // =========================================================================
  // INTERACTIVE EDGE DRAWING (FROM PORT TO PORT)
  // =========================================================================
  const handleStartEdge = (e, nodeId) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    const startX = node.x + node.width;
    const startY = node.y + node.height / 2;
    setDrawingEdge({
      fromNodeId: nodeId,
      startX,
      startY,
      currentX: startX,
      currentY: startY
    });
  };
  const handleCompleteEdge = (e, targetNodeId) => {
    e.stopPropagation();
    if (!drawingEdge || drawingEdge.fromNodeId === targetNodeId) return;
    const newEdgeId = `edge-${drawingEdge.fromNodeId}-${targetNodeId}`;
    const exists = edges.some(ed => ed.from === drawingEdge.fromNodeId && ed.to === targetNodeId);
    if (!exists) {
      const fromNode = nodes.find(n => n.id === drawingEdge.fromNodeId);
      const toNode = nodes.find(n => n.id === targetNodeId);
      setEdges(prev => [
        ...prev,
        {
          id: newEdgeId,
          from: drawingEdge.fromNodeId,
          to: targetNodeId,
          label: toNode?.type === 'quarantine' ? 'Violations' : 'Passed Stream',
          variant: toNode?.type === 'quarantine' ? 'orange' : 'blue'
        }
      ]);
    }
    setDrawingEdge(null);
  };
  const handleDeleteEdge = (edgeId) => {
    setEdges(prev => prev.filter(e => e.id !== edgeId));
    setSelectedEdgeId(null);
  };
  // =========================================================================
  // ADD NODE FROM CATALOG
  // =========================================================================
  const handleAddNodeFromCatalog = (item) => {
    const newId = `node-${Date.now()}`;
    const isAzure = (item.system || '').includes('Azure') || (item.name || '').includes('Azure');
    const isSalesforce = (item.system || '').includes('Salesforce') || (item.name || '').includes('Salesforce');
    const isS3 = (item.system || '').includes('S3') || (item.system || '').includes('AWS');
    const isVectorMatcher = item.type === 'vector_matcher';
    const isRag = item.type === 'rag';
    const isConditional = item.type === 'conditional';
    const isHitl = item.type === 'hitl';
    const isPinecone = item.type === 'pinecone';
    const isBigQuery = item.type === 'bigquery';
    const newNode = {
      id: newId,
      type: item.type,
      title: item.name,
      system: item.system || item.name,
      x: Math.round(480 + (Math.random() * 60 - 30)),
      y: Math.round(200 + (Math.random() * 60 - 30)),
      width: 260,
      height: 135,
      status: isAzure ? 'Connected' : isSalesforce ? 'Connected' : isS3 ? 'Discovered'
        : isVectorMatcher ? 'Similarity 85%'
          : isRag ? 'RAG Active'
            : isConditional ? 'If / Else Active'
              : isHitl ? 'Gate Armed'
                : isPinecone ? 'Vector Store (1024)'
                  : isBigQuery ? 'BigQuery Write API'
                    : 'Configured',
      table: isAzure ? 'telemetry_logs.parquet' : isSalesforce ? 'Account' : isS3 ? 'orders_2026_q1.parquet'
        : isVectorMatcher ? 'VENDOR_NAME'
          : isRag ? 'Knowledge Store'
            : isConditional ? 'Configured'
              : isHitl ? 'APPROVAL_GATE'
                : isPinecone ? 'enterprise-knowledge-base'
                  : isBigQuery ? '0PUR_C01_clean'
                    : undefined,
      rowCount: isAzure ? '18,200 rows' : isSalesforce ? '3,450 records' : isS3 ? '12,400 rows'
        : isVectorMatcher ? 'Cosine Similarity'
          : isRag ? 'Reference Docs'
            : isConditional ? 'TRUE / FALSE'
              : isHitl ? 'Human Sign-off'
                : isPinecone ? '1024 Dim'
                  : isBigQuery ? 'Gold Dataset'
                    : undefined,
      variant: item.variant || 'blue'
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newId);
    setIsAddNodeModalOpen(false);
    // Popup appears ONLY when settings icon is clicked!
  };
  const handleDeleteNode = (nodeId) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setEdges(prev => prev.filter(e => e.from !== nodeId && e.to !== nodeId));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
      setIsPropertyModalOpen(false);
    }
  };
  // Test Connection inside Source Modal (discovers live tables & immediately loads 5-row live preview)
  const handleTestSourceConnection = async () => {
    const testedNodeId = selectedNodeId;
    const testRunId = ++sourceTestRunIdRef.current;
    setSrcTesting(true);
    setSrcTestMeta(null);

    const engineKey = resolveEngineKey(srcDbType);
    const rawHost = (srcHost || '').trim();
    const isHostFullUri = /^(mongodb(\+srv)?:\/\/|postgres(ql)?:\/\/|jdbc:)/i.test(rawHost);

    // Validate required credentials before connecting
    const missing = [];
    if (connectMethod === 'string') {
      if (!connString || !connString.trim()) {
        missing.push('Connection URI String');
      }
    } else if (engineKey === 'salesforce') {
      if (!srcHost) missing.push('Salesforce Instance URL');
      if (!srcDbName) missing.push('Client ID');
      if (!srcUser) missing.push('Username / Email');
      if (!srcPass) missing.push('Client Secret');
    } else if (engineKey === 'azure') {
      if (!srcHost) missing.push('Storage Account Name');
      if (!srcPort) missing.push('Container Name');
      if (!srcPass) missing.push('Account Key');
    } else if (engineKey === 's3') {
      if (!srcHost) missing.push('S3 Bucket URI');
      if (!srcUser) missing.push('AWS Access Key ID');
      if (!srcPass) missing.push('AWS Secret Access Key');
    } else if (engineKey !== 'sap_bw') {
      if (!rawHost) missing.push('Host');
      if (!isHostFullUri && !srcUser) missing.push('User');
    }

    if (missing.length > 0) {
      setSrcTesting(false);
      setSrcTestMeta({
        nodeId: testedNodeId,
        success: false,
        latencyMs: 0,
        error: `Missing required credentials: ${missing.join(', ')}`,
        message: `Missing required credentials: ${missing.join(', ')}`
      });
      return;
    }

    const effectiveUri = connectMethod === 'string'
      ? connString.trim()
      : (isHostFullUri ? rawHost : undefined);

    try {
      const res = await testConnection({
        engine: engineKey,
        host: rawHost,
        port: srcPort,
        database: srcDbName,
        user: srcUser,
        password: srcPass,
        connectionUri: effectiveUri
      });

      if (sourceTestRunIdRef.current !== testRunId) return;
      setSrcTesting(false);

      if (res && res.success) {
        const discoveredTables = Array.isArray(res.tables) ? res.tables : [];
        const resolvedDb = res.database || srcDbName;
        if (res.database && res.database !== srcDbName) {
          setSrcDbName(res.database);
        }

        let targetTable = srcTable;
        if (discoveredTables.length > 0 && !discoveredTables.includes(srcTable)) {
          targetTable = discoveredTables.includes('raw_customers')
            ? 'raw_customers'
            : discoveredTables.includes('raw_users')
              ? 'raw_users'
              : discoveredTables[0];
          setSrcTable(targetTable);
        }

        setSrcTestMeta({
          nodeId: testedNodeId,
          success: true,
          latencyMs: res.latencyMs || 34,
          database: resolvedDb,
          tables: discoveredTables,
          tableCount: res.tableCount || discoveredTables.length,
          message: res.message || `Connected successfully to ${srcDbType} endpoint.`
        });

        // Immediately sample live 5 rows & schema columns from the selected table
        await loadLiveTablePreview(targetTable, resolvedDb, {
          engine: engineKey,
          connectionUri: effectiveUri,
          host: rawHost,
          port: srcPort,
          database: resolvedDb,
          user: srcUser,
          password: srcPass,
        });
      } else {
        setSrcTestMeta({
          nodeId: testedNodeId,
          success: false,
          latencyMs: res?.latencyMs || 0,
          error: res?.error || res?.message || 'Connection failed: Unable to connect to database.',
          message: res?.message || res?.error || 'Connection failed'
        });
      }
    } catch (err) {
      if (sourceTestRunIdRef.current !== testRunId) return;
      setSrcTesting(false);
      setSrcTestMeta({
        nodeId: testedNodeId,
        success: false,
        latencyMs: 0,
        error: err?.message || 'Connection request failed',
        message: 'Connection request failed'
      });
    }
  };

  // Test Connection inside Target Modal
  const handleTestTargetConnection = async () => {
    setTgtTesting(true);
    setTgtTestMeta(null);
    const engineKey = tgtDbType.includes('SAP') ? 's4_hana' : tgtDbType.includes('Databricks') ? 'databricks' : 'postgres';
    try {
      const res = await testConnection({
        engine: engineKey,
        connectionUri: (tgtEndpoint || '').trim(),
        host: (tgtEndpoint || '').trim(),
      }, true);
      setTgtTesting(false);
      if (res && res.success) {
        setTgtTestMeta({
          success: true,
          latencyMs: res.latencyMs || 42,
          tables: res.tables || [],
          message: res.message || 'Connected to target database.'
        });
      } else {
        setTgtTestMeta({
          success: false,
          error: res?.error || res?.message || 'Target connection failed',
          message: res?.message || 'Target connection failed'
        });
      }
    } catch (err) {
      setTgtTesting(false);
      setTgtTestMeta({
        success: false,
        error: err?.message || 'Target connection failed',
        message: 'Target connection failed'
      });
    }
  };

  const handleSaveSourceConfig = () => {
    if (connectMethod === 'upload' && uploadedRecords && uploadedRecords.length > 0) {
      if (setUploadedDataset) {
        setUploadedDataset(uploadedRecords, uploadedFileName, uploadedCols);
      } else {
        setSourceConfig(prev => ({
          ...prev,
          engine: 'file_upload',
          fileName: uploadedFileName,
          table: uploadedFileName,
          fileData: uploadedRecords,
          discoveredColumns: uploadedCols,
          rowCount: uploadedRecords.length,
          totalRows: uploadedRecords.length,
          isLive: true
        }));
      }
      setNodes(prev => prev.map(n => n.id === selectedNodeId ? {
        ...n,
        system: 'BYO File Ingest',
        table: uploadedFileName,
        isLive: true,
        rowCount: `${uploadedRecords.length.toLocaleString()} rows`,
        status: 'Dataset Ready'
      } : n));
      setIsPropertyModalOpen(false);
      return;
    }

    const isLiveConnected = Boolean(srcTestMeta && srcTestMeta.success);
    const engineKey = resolveEngineKey(srcDbType);
    const activeData = getTableData(srcTable, engineKey, 5);
    const rawHost = (srcHost || '').trim();
    const isHostFullUri = /^(mongodb(\+srv)?:\/\/|postgres(ql)?:\/\/|jdbc:)/i.test(rawHost);

    const resolvedUri = connectMethod === 'string' && connString
      ? connString.trim()
      : isHostFullUri
        ? rawHost
        : (engineKey === 'sap_bw'
          ? `jdbc:sap://${rawHost}:${srcPort}?encrypt=true&validateCertificate=false&user=${encodeURIComponent(srcUser)}&password=${encodeURIComponent(srcPass)}&databaseName=${encodeURIComponent(srcDbName)}`
          : engineKey === 'mongodb'
            ? `mongodb+srv://${encodeURIComponent(srcUser)}:${encodeURIComponent(srcPass)}@${rawHost}/${srcTestMeta?.database || srcDbName}?retryWrites=true&w=majority`
            : engineKey === 'azure'
              ? `https://${rawHost}.blob.core.windows.net/${srcPort}/${srcTable}`
              : engineKey === 'salesforce'
                ? `https://${rawHost}/services/data/v58.0/sobjects/${srcTable}?user=${encodeURIComponent(srcUser)}`
                : engineKey === 's3'
                  ? `s3://${rawHost}/${srcTable}`
                  : `postgresql://${encodeURIComponent(srcUser)}:${encodeURIComponent(srcPass)}@${rawHost}:${srcPort}/${srcDbName}?sslmode=require`);

    const finalColumns = (isLiveSampleActive && discoveredColumns.length > 0) ? discoveredColumns : activeData.columns;
    const finalRowCount = (isLiveSampleActive && liveTotalRows !== null) ? liveTotalRows : activeData.rowCount;
    const finalDatabase = srcTestMeta?.database || srcDbName;

    setSourceConfig(prev => ({
      ...prev,
      engine: engineKey,
      host: rawHost,
      port: srcPort,
      database: finalDatabase,
      user: srcUser,
      password: srcPass,
      connectionUri: resolvedUri,
      table: srcTable,
      isLive: isLiveConnected,
      scopeMode: readScope,
      rowCount: finalRowCount,
      totalRows: finalRowCount,
      discoveredColumns: finalColumns
    }));

    setNodes(prev => prev.map(n => n.id === selectedNodeId ? {
      ...n,
      system: isLiveConnected ? `${srcDbType} (Connected)` : `${srcDbType} (Demo Sandbox)`,
      table: srcTable,
      isLive: isLiveConnected,
      rowCount: (isLiveSampleActive && liveTotalRows !== null)
        ? `${liveTotalRows.toLocaleString()} rows`
        : (activeData.rowCountFormatted || `${activeData.rowCount?.toLocaleString()} rows`),
      status: isLiveConnected ? 'Connected' : 'Demo Sandbox'
    } : n));

    // Auto-align Target node when switching from SAP template to MongoDB or Postgres
    if (srcDbType.includes('Mongo') || srcDbType.includes('Postgres')) {
      const derivedTgtTable = srcTable ? srcTable.replace(/^raw_/, '') : 'customers';
      const neonUri = 'postgresql://neondb_owner:npg_Eim1u6bIldRL@ep-square-breeze-aqokq2fe-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require';
      if (tgtDbType.includes('SAP') || tgtTable === '0PUR_C01_clean') {
        setTgtDbType('PostgreSQL');
        setTgtTable(derivedTgtTable);
        setTgtEndpoint(neonUri);
        setTargetConfig(prev => ({
          ...prev,
          engine: 'postgres',
          table: derivedTgtTable,
          connectionUri: neonUri,
          host: 'ep-square-breeze-aqokq2fe-pooler.c-8.us-east-1.aws.neon.tech',
          database: 'neondb'
        }));
        setNodes(prev => prev.map(n => n.type === 'target' ? {
          ...n,
          system: 'PostgreSQL',
          table: derivedTgtTable,
          status: `Write: ${writeMode.toUpperCase()}`
        } : n));
      }
    }

    setIsPropertyModalOpen(false);
  };

  const handleSaveRulesConfig = () => {
    setActiveRules(rulesList);
    setNodes(prev => prev.map(n => n.type === 'rules' ? {
      ...n,
      ruleCount: rulesList.filter(r => r.selected !== false).length,
      status: autoFixActive ? 'Auto-Fix Armed' : 'Strict Check'
    } : n));
    setIsPropertyModalOpen(false);
  };
  const handleSaveVectorMatcherConfig = () => {
    setNodes(prev => prev.map(n => n.id === selectedNodeId ? {
      ...n,
      system: vectorModel,
      table: `Cosine: ${vectorTargetField}`,
      status: `Threshold ${vectorThreshold}%`,
      rowCount: vectorIndex.split(' ')[0]
    } : n));
    setIsPropertyModalOpen(false);
  };
  const handleSaveRagConfig = () => {
    setNodes(prev => prev.map(n => n.id === selectedNodeId ? {
      ...n,
      title: 'RAG Context Enricher',
      system: 'RAG',
      table: ragTargetField || 'Knowledge Store',
      status: 'RAG Active',
      rowCount: Top - Chunks
    } : n));
    setIsPropertyModalOpen(false);
  };
  const handleSaveConditionalConfig = () => {
    setNodes(prev => prev.map(n => n.id === selectedNodeId ? {
      ...n,
      title: 'Conditional Router (If / Else)',
      system: 'If-Else Router',
      table: conditionField ? `${conditionField} ${conditionOp} ${conditionVal}` : 'Dynamic Predicate',
      status: 'Configured',
      rowCount: 'TRUE / FALSE'
    } : n));
    setIsPropertyModalOpen(false);
  };
  const handleSaveHitlConfig = () => {
    const triggerLabels = {
      amount_threshold: 'Amount > $50k',
      balance_threshold: 'Balance > $10k',
      confidence_threshold: 'Low AI Confidence',
      sox_discrepancy: 'SOX Mismatch',
      unverified_vendor: 'Unverified Vendor',
      risk_threshold: 'Clause Risk > 80',
      stockout_risk: 'Stockout Breach',
      critical_anomaly: 'Critical Anomaly'
    };
    const conditionText = hitlConditionType === 'custom'
      ? (hitlCustomExpression || `${hitlCustomField || 'FIELD'} ${hitlCustomOp || '>'} ${hitlCustomVal || '0'}`)
      : (triggerLabels[hitlTriggerPolicy] || 'Condition Check');
    setNodes(prev => prev.map(n => n.id === selectedNodeId ? {
      ...n,
      system: hitlReviewerRole,
      table: conditionText,
      status: hitlSlaTimeout === 'indefinite' ? 'No Deadline' : `SLA ${hitlSlaTimeout}h`,
      rowCount: 'Human Review'
    } : n));
    setIsPropertyModalOpen(false);
  };
  const handleSavePineconeConfig = () => {
    setNodes(prev => prev.map(n => n.id === selectedNodeId ? {
      ...n,
      system: 'Pinecone Vector DB',
      table: pineconeIndex,
      status: `${pineconeDimension} dim · ${pineconeMetric}`,
      rowCount: `${pineconeNamespace} ns`
    } : n));
    setIsPropertyModalOpen(false);
  };
  const handleSaveBigQueryConfig = () => {
    setNodes(prev => prev.map(n => n.id === selectedNodeId ? {
      ...n,
      system: 'Google BigQuery',
      table: `${bqDataset}.${bqTable}`,
      status: `GCP: ${bqProject}`,
      rowCount: bqWriteMode.toUpperCase()
    } : n));
    setIsPropertyModalOpen(false);
  };
  const handleSaveRouterConfig = () => {
    setNodes(prev => prev.map(n => n.type === 'router' ? {
      ...n,
      status: `Gate: ${routerThreshold}%`,
      split: routerAutoFixPolicy === 'autonomous' ? 'Autonomous Remediated' : 'Strict Quarantined'
    } : n));
    setIsPropertyModalOpen(false);
  };
  const handleSaveTargetConfig = () => {
    const engineKey = tgtDbType.includes('SAP') ? 's4_hana' : tgtDbType.includes('Databricks') ? 'databricks' : 'postgres';
    const defaultNeonUri = 'postgresql://neondb_owner:npg_Eim1u6bIldRL@ep-square-breeze-aqokq2fe-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require';
    const effectiveUri = (tgtEndpoint || '').trim() || (engineKey === 'postgres' ? defaultNeonUri : '');
    const effectiveTable = tgtTable || (srcTable ? (srcTable.startsWith('raw_') ? srcTable.replace('raw_', '') : `${srcTable}_clean`) : 'customers');
    setTargetConfig(prev => ({
      ...prev,
      engine: engineKey,
      table: effectiveTable,
      writeMode: writeMode,
      connectionUri: effectiveUri,
      host: effectiveUri.includes('//') ? effectiveUri.split('//')[1].split('/')[0] : (engineKey === 'postgres' ? 'ep-square-breeze-aqokq2fe-pooler.c-8.us-east-1.aws.neon.tech' : 's4h.corp.ondemand.com'),
      database: engineKey === 'postgres' ? 'neondb' : 'reconciled_db',
      user: 'cleanflow_writer',
      password: ''
    }));
    setNodes(prev => prev.map(n => n.type === 'target' ? {
      ...n,
      system: tgtDbType,
      table: effectiveTable,
      status: `Write: ${writeMode.toUpperCase()}`
    } : n));
    setIsPropertyModalOpen(false);
  };
  const handleSaveQuarantineConfig = () => {
    setTargetConfig(prev => ({
      ...prev,
      quarantineTable: quarantineTable
    }));
    setNodes(prev => prev.map(n => n.type === 'quarantine' ? {
      ...n,
      table: quarantineTable,
      status: quarantinePolicy === 'audit_locked' ? 'Audit Encrypted' : 'Review Required'
    } : n));
    setIsPropertyModalOpen(false);
  };
  const handleAddNewCustomRule = () => {
    if (!newRuleField || !newRuleCondition) return;
    const ruleObj = {
      id: `r_custom_${Date.now()}`,
      name: `${newRuleField} Validation`,
      field: newRuleField.toUpperCase(),
      severity: newRuleSeverity,
      condition: newRuleCondition,
      code: newRuleCondition,
      desc: newRuleDesc || `Enforce validation on ${newRuleField}`,
      selected: true,
      enabled: true
    };
    const updated = [ruleObj, ...rulesList];
    setRulesList(updated);
    setActiveRules(updated);
    setNewRuleField('');
    setNewRuleCondition('');
    setNewRuleDesc('');
    setShowAddCustomRule(false);
  };
  const handleToggleRuleItem = (id) => {
    const updated = rulesList.map(r => r.id === id ? { ...r, selected: r.selected === false } : r);
    setRulesList(updated);
    setActiveRules(updated);
  };
  const handleDeleteRuleItem = (id) => {
    const updated = rulesList.filter(r => r.id !== id);
    setRulesList(updated);
    setActiveRules(updated);
  };
  const getNode = (id) => nodes.find(n => n.id === id);
  return (
    <div className="relative w-full h-full min-h-0 bg-[#F8FAFC] rounded-2xl overflow-hidden select-none flex flex-col shadow-xs">
      {/* Top Template Autofill & Reset Bar */}
      <div className="absolute top-3.5 inset-x-5 flex items-center justify-between z-30 pointer-events-none">
        {/* Template Quick Switcher */}
        <div className="relative pointer-events-auto bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/90 shadow-sm p-1.5 flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-2 pr-1 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            Template:
          </span>
          <button
            onClick={() => handleAutofillTemplate('sap_bw_s4hana')}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
          >
            SAP Clean Core
          </button>
          <button
            onClick={() => handleAutofillTemplate('financial_gl_ledger')}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
          >
            Financial SOX
          </button>
          <button
            onClick={() => handleAutofillTemplate('customer_master_reconciliation')}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
          >
            Customer 360
          </button>
          <button
            onClick={() => handleAutofillTemplate('enterprise_rag_knowledge')}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
          >
            Legal RAG
          </button>
          <button
            onClick={() => handleAutofillTemplate('ml_dataset_certification')}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
          >
            ML Gate
          </button>
          {/* All 10 Templates Dropdown Trigger */}
          <div className="relative">
            <button
              onClick={() => setIsTemplatesDropdownOpen(prev => !prev)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>All Templates ({Object.keys(TEMPLATE_AUTOFILLS).length})</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isTemplatesDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {/* Dropdown Popover */}
            {isTemplatesDropdownOpen && (
              <div
                className="absolute left-0 mt-2 w-96 max-h-[460px] overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-2 scrollbar-thin"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-2 py-1.5 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Enterprise Catalog ({Object.keys(TEMPLATE_AUTOFILLS).length})</span>
                  <button
                    onClick={() => setIsTemplatesDropdownOpen(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Close
                  </button>
                </div>
                <div className="divide-y divide-slate-100">
                  {Object.values(TEMPLATE_AUTOFILLS).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        handleAutofillTemplate(t.id);
                        setIsTemplatesDropdownOpen(false);
                      }}
                      className="w-full text-left p-2.5 hover:bg-slate-50 rounded-lg transition-colors flex items-start gap-2.5 cursor-pointer group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                        {t.priority?.includes('Tier 1') ? 'T1' :
                          t.priority?.includes('Tier 2') ? 'T2' :
                            t.priority?.includes('Tier 3') ? 'T3' :
                              t.priority?.includes('Tier 4') ? 'T4' : 'T5'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-600">
                            {t.name}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {t.nodes?.length} nodes
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {t.desc}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            {t.category}
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-600">
                            {t.rules?.length || 4} rules
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <span className="h-4 w-px bg-slate-200 mx-0.5" />
          <button
            onClick={handleClearCanvas}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer flex items-center gap-1"
            title="Start from scratch with an empty canvas"
          >
            <RotateCcw className="w-3 h-3" />
            Empty Canvas
          </button>
        </div>
        {/* Top Right Action Buttons: Save, Dry Run, Run Live, Add Node */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Save Workflow */}
          <button
            onClick={handleSaveWorkflow}
            disabled={isSavingWorkflow}
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 ${saveSuccess
              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
              : isDirty
                ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-800'
                : isSavingWorkflow
                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            title={isDirty ? 'Unsaved changes (Save to persist to backend)' : (lastSavedWorkflowTime ? `Last saved at ${lastSavedWorkflowTime}` : 'Save workflow')}
          >
            {isSavingWorkflow ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
            ) : saveSuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Save className={`w-3.5 h-3.5 ${isDirty ? 'text-amber-600' : 'text-slate-500'}`} />
            )}
            <span>
              {isSavingWorkflow ? 'Saving...' : saveSuccess ? 'Saved' : isDirty ? 'Save *' : 'Save'}
            </span>
            {lastSavedWorkflowTime && !isSavingWorkflow && !saveSuccess && !isDirty && (
              <span className="text-[10px] text-slate-400 font-normal ml-0.5">({lastSavedWorkflowTime})</span>
            )}
          </button>
          {/* Dry Run */}
          <button
            onClick={handleDryRun}
            disabled={isExecutingDryRun || nodes.length === 0}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Execute test dry run on active dataset"
          >
            <FlaskConical className={`w-3.5 h-3.5 ${isExecutingDryRun ? 'animate-bounce text-blue-600' : 'text-blue-600'}`} />
            {isExecutingDryRun ? 'Evaluating...' : 'Dry Run'}
          </button>
          {/* Run Live */}
          <button
            onClick={handleRunLive}
            disabled={isExecutingLiveRun || nodes.length === 0}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Commit compliant records live to Target ERP/Database"
          >
            <Play className={`w-3.5 h-3.5 fill-white ${isExecutingLiveRun ? 'animate-spin' : ''}`} />
            {isExecutingLiveRun ? 'Posting...' : 'Run Live'}
          </button>
          {/* Add Node */}
          <button
            onClick={() => setIsAddNodeModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Add Node
          </button>
        </div>
      </div>
      {/* Main Canvas Viewport (Smooth Wheel Panning & Ctrl-Zoom) */}
      <div
        ref={canvasRef}
        onMouseDown={handleCanvasMouseDown}
        className="relative flex-1 w-full h-full min-h-0 overflow-hidden cursor-grab active:cursor-grabbing"
        style={{
          backgroundImage: 'radial-gradient(#CBD5E1 1.25px, transparent 1.25px)',
          backgroundSize: '24px 24px',
          backgroundPosition: `${pan.x}px ${pan.y}px`
        }}
      >
        {/* Sleek Floating Phased Execution Header */}
        {(isExecutingDryRun || isExecutingLiveRun) && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl border border-slate-700 shadow-2xl p-4 max-w-xl w-full mx-auto space-y-2.5 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white tracking-wide">
                      {isExecutingLiveRun ? 'Executing Live Commit' : 'Executing Enterprise CleanFlow Pipeline'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 font-mono">
                      Stage {executionProgress <= 25 ? '1/4' : executionProgress <= 50 ? '2/4' : executionProgress <= 75 ? '3/4' : '4/4'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {executionStageText}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs font-bold text-[#a3e635]">
                  {(executionElapsedMs / 1000).toFixed(1)}s
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">DuckDB AST</span>
              </div>
            </div>
            {/* Stage Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 h-1.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${executionProgress}%` }}
              />
            </div>
            {/* Stage Indicators */}
            <div className="grid grid-cols-4 gap-1 text-[10px] font-medium text-slate-400 pt-0.5">
              <span className={executionProgress >= 25 ? 'text-blue-300 font-bold' : ''}>1. Ingest Raw Stream</span>
              <span className={executionProgress >= 50 ? 'text-indigo-300 font-bold' : ''}>2. Intelligence Engine</span>
              <span className={executionProgress >= 75 ? 'text-purple-300 font-bold' : ''}>3. Stream Router</span>
              <span className={executionProgress >= 90 ? 'text-emerald-300 font-bold' : ''}>4. Target Commit</span>
            </div>
          </div>
        )}
        {/* World transform container */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: '100%',
            height: '100%',
            position: 'absolute',
            left: 0,
            top: 0
          }}
        >
          {/* SVG Connector Lines Overlay */}
          <svg className="absolute inset-0 w-[3000px] h-[2000px] pointer-events-none z-10 overflow-visible">
            {/* Render Saved Edges */}
            {edges.map((edge) => {
              const fromNode = getNode(edge.from);
              const toNode = getNode(edge.to);
              if (!fromNode || !toNode) return null;
              const startX = fromNode.x + fromNode.width;
              const startY = fromNode.y + fromNode.height / 2;
              const endX = toNode.x;
              const endY = toNode.y + toNode.height / 2;
              const dx = Math.abs(endX - startX) * 0.5;
              const pathD = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;
              const isSelected = selectedEdgeId === edge.id;
              const strokeColor = edge.variant === 'orange' ? '#F97316' : edge.variant === 'green' ? '#10B981' : '#3B82F6';
              // Midpoint for delete handle
              const midX = (startX + endX) / 2;
              const midY = (startY + endY) / 2;
              return (
                <g key={edge.id} className="cursor-pointer pointer-events-auto">
                  {/* Outer glow on hover/selected */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isSelected ? '#2563EB' : 'transparent'}
                    strokeWidth={isSelected ? 6 : 14}
                    strokeOpacity={0.2}
                    onClick={() => setSelectedEdgeId(edge.id)}
                  />
                  {/* Main Bezier Line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isSelected ? 3 : 2}
                    strokeLinecap="round"
                    onClick={() => setSelectedEdgeId(edge.id)}
                  />
                  {/* Optional Edge Label & Delete Button on click */}
                  {edge.label && (
                    <text
                      x={midX}
                      y={midY - 8}
                      textAnchor="middle"
                      fill="#64748B"
                      fontSize="10"
                      fontWeight="bold"
                      className="pointer-events-none font-sans"
                    >
                      {edge.label}
                    </text>
                  )}
                  {isSelected && (
                    <g transform={`translate(${midX - 10}, ${midY - 10})`} onClick={() => handleDeleteEdge(edge.id)}>
                      <circle cx="10" cy="10" r="10" fill="#EF4444" />
                      <line x1="7" y1="7" x2="13" y2="13" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                      <line x1="13" y1="7" x2="7" y2="13" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                    </g>
                  )}
                </g>
              );
            })}
            {/* Multi-Particle Streaming Flow Animation */}
            {(isExecutingDryRun || isExecutingLiveRun || pipelineStatus === 'RUNNING') && edges.map((edge) => {
              const fromNode = getNode(edge.from);
              const toNode = getNode(edge.to);
              if (!fromNode || !toNode) return null;
              const startX = fromNode.x + fromNode.width;
              const startY = fromNode.y + fromNode.height / 2;
              const endX = toNode.x;
              const endY = toNode.y + toNode.height / 2;
              const dx = Math.abs(endX - startX) * 0.5;
              const pathD = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;
              const particleColor = edge.variant === 'orange' ? '#F97316' : edge.variant === 'green' ? '#10B981' : '#3B82F6';
              return (
                <g key={`particle-stream-${edge.id}`}>
                  <circle r="4.5" fill={particleColor} opacity="0.95">
                    <animateMotion dur="1.6s" repeatCount="indefinite" path={pathD} />
                  </circle>
                  <circle r="3" fill="#FFFFFF" opacity="0.8">
                    <animateMotion dur="1.6s" begin="0.4s" repeatCount="indefinite" path={pathD} />
                  </circle>
                  <circle r="3.5" fill={particleColor} opacity="0.7">
                    <animateMotion dur="1.6s" begin="0.8s" repeatCount="indefinite" path={pathD} />
                  </circle>
                </g>
              );
            })}
            {/* Live 3-Way Split Edge Flow Badges */}
            {executionSummary && edges.map((edge) => {
              const fromNode = getNode(edge.from);
              const toNode = getNode(edge.to);
              if (!fromNode || !toNode) return null;
              const startX = fromNode.x + fromNode.width;
              const startY = fromNode.y + fromNode.height / 2;
              const endX = toNode.x;
              const endY = toNode.y + toNode.height / 2;
              const midX = (startX + endX) / 2;
              const midY = (startY + endY) / 2;
              const toTitle = (toNode.title || toNode.name || '').toLowerCase();
              const fromTitle = (fromNode.title || fromNode.name || '').toLowerCase();
              const isTargetClean = toNode.type === 'target' || toTitle.includes('clean') || toTitle.includes('lakehouse') || toTitle.includes('s/4hana');
              const isQuarantine = toNode.type === 'quarantine' || toTitle.includes('quarantine') || toTitle.includes('dlq');
              const isSourceFlow = fromNode.type === 'source';
              const isRuleFlow = fromNode.type === 'rules' || toNode.type === 'clean_core';
              if (isTargetClean) {
                return (
                  <g
                    key={`badge-${edge.id}`}
                    transform={`translate(${midX - 75}, ${midY - 14})`}
                    className="cursor-pointer pointer-events-auto transition-transform hover:scale-105"
                    onClick={() => setIsTelemetryDrawerOpen(true)}
                  >
                    <rect width="150" height="28" rx="14" fill="#064E3B" stroke="#10B981" strokeWidth="1.5" />
                    <text x="75" y="18" textAnchor="middle" fill="#A7F3D0" fontSize="10" fontWeight="bold" fontFamily="monospace">
                      ✓ {executionSummary.clean.toLocaleString()} Clean ({executionSummary.health}%)
                    </text>
                  </g>
                );
              }
              if (isQuarantine) {
                return (
                  <g
                    key={`badge-${edge.id}`}
                    transform={`translate(${midX - 90}, ${midY - 14})`}
                    className="cursor-pointer pointer-events-auto transition-transform hover:scale-105"
                    onClick={() => setIsTelemetryDrawerOpen(true)}
                  >
                    <rect width="180" height="28" rx="14" fill="#78350F" stroke="#F59E0B" strokeWidth="1.5" />
                    <text x="90" y="18" textAnchor="middle" fill="#FDE68A" fontSize="10" fontWeight="bold" fontFamily="monospace">
                      ⚠ {executionSummary.quarantined} Quarantined ($1.42M)
                    </text>
                  </g>
                );
              }
              if (isSourceFlow) {
                return (
                  <g key={`badge-${edge.id}`} transform={`translate(${midX - 65}, ${midY - 13})`}>
                    <rect width="130" height="26" rx="13" fill="#0F172A" stroke="#3B82F6" strokeWidth="1.5" />
                    <text x="65" y="17" textAnchor="middle" fill="#93C5FD" fontSize="10" fontWeight="bold" fontFamily="monospace">
                      {executionSummary.total.toLocaleString()} Rows Streamed
                    </text>
                  </g>
                );
              }
              if (isRuleFlow) {
                return (
                  <g key={`badge-${edge.id}`} transform={`translate(${midX - 60}, ${midY - 13})`}>
                    <rect width="120" height="26" rx="13" fill="#0F172A" stroke="#8B5CF6" strokeWidth="1.5" />
                    <text x="60" y="17" textAnchor="middle" fill="#C4B5FD" fontSize="10" fontWeight="bold" fontFamily="monospace">
                      100% AST Verified
                    </text>
                  </g>
                );
              }
              return null;
            })}
            {/* Render Live Edge being drawn */}
            {drawingEdge && (
              <path
                d={`M ${drawingEdge.startX} ${drawingEdge.startY} C ${drawingEdge.startX + 60} ${drawingEdge.startY}, ${drawingEdge.currentX - 60} ${drawingEdge.currentY}, ${drawingEdge.currentX} ${drawingEdge.currentY}`}
                fill="none"
                stroke="#2563EB"
                strokeWidth="2.5"
                strokeDasharray="4 4"
                strokeLinecap="round"
              />
            )}
          </svg>
          {/* =========================================================================
              EMPTY CANVAS STATE (When all nodes are removed or creating blank flow)
             ========================================================================= */}
          {nodes.length === 0 && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center p-8 bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/90 shadow-xl max-w-lg w-full space-y-5 z-20">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto shadow-sm">
                <Layers className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Empty Workflow Canvas</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Add your first node from scratch or select a prebuilt enterprise template to autofill a verified pipeline.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setIsAddNodeModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  Add a Node
                </button>
              </div>
              <div className="pt-3 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                  Or Autofill From Certified Template:
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={() => handleAutofillTemplate('sap_bw_s4hana')}
                    className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold border border-slate-200 hover:border-blue-300 transition-all cursor-pointer"
                  >
                    ⚡ SAP Clean Core
                  </button>
                  <button
                    onClick={() => handleAutofillTemplate('customer_master_reconciliation')}
                    className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold border border-slate-200 hover:border-blue-300 transition-all cursor-pointer"
                  >
                    👥 Customer 360
                  </button>
                  <button
                    onClick={() => handleAutofillTemplate('financial_gl_ledger')}
                    className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold border border-slate-200 hover:border-blue-300 transition-all cursor-pointer"
                  >
                    💰 Financial SOX
                  </button>
                  <button
                    onClick={() => handleAutofillTemplate('healthcare_hipaa')}
                    className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold border border-slate-200 hover:border-blue-300 transition-all cursor-pointer"
                  >
                    🏥 Healthcare HIPAA
                  </button>
                  <button
                    onClick={() => handleAutofillTemplate('enterprise_rag_knowledge')}
                    className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-semibold border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer"
                  >
                    🛡️ AI RAG Firewall
                  </button>
                  <button
                    onClick={() => handleAutofillTemplate('ml_dataset_certification')}
                    className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-violet-50 text-slate-700 hover:text-violet-700 text-xs font-semibold border border-slate-200 hover:border-violet-300 transition-all cursor-pointer"
                  >
                    📊 ML Gate & Drift
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* =========================================================================
              RENDER OPERATIONAL NODES WITH PORTS
             ========================================================================= */}
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isStageActive =
              (activeStageNodeId === node.id) ||
              (activeStageNodeId === 'committing' && (node.type === 'target' || node.type === 'quarantine'));
            return (
              <div
                key={node.id}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onClick={(e) => handleNodeClick(e, node)}
                style={{
                  transform: `translate(${node.x}px, ${node.y}px)`,
                  width: node.width,
                  position: 'absolute',
                  zIndex: isStageActive ? 35 : isSelected ? 30 : 20
                }}
                className={`workflow-node-card relative group bg-white rounded-2xl border-2 shadow-md p-4 space-y-2.5 transition-all select-none hover:shadow-lg ${activeTool === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                  } ${isStageActive
                    ? node.variant === 'green'
                      ? 'border-emerald-500 ring-4 ring-emerald-500/40 shadow-xl shadow-emerald-500/20 scale-[1.02]'
                      : node.variant === 'orange'
                        ? 'border-amber-500 ring-4 ring-amber-500/40 shadow-xl shadow-amber-500/20 scale-[1.02]'
                        : node.variant === 'purple'
                          ? 'border-purple-500 ring-4 ring-purple-500/40 shadow-xl shadow-purple-500/20 scale-[1.02]'
                          : 'border-blue-500 ring-4 ring-blue-500/40 shadow-xl shadow-blue-500/20 scale-[1.02]'
                    : isSelected
                      ? 'border-blue-500 ring-4 ring-blue-500/20 shadow-xl'
                      : node.variant === 'green'
                        ? 'border-emerald-500'
                        : node.variant === 'orange'
                          ? 'border-amber-500'
                          : node.variant === 'purple'
                            ? 'border-purple-500'
                            : 'border-blue-500'
                  }`}
              >
                {/* 1. INPUT PORT (Left Side) */}
                {node.type !== 'source' && (
                  <div
                    onMouseUp={(e) => handleCompleteEdge(e, node.id)}
                    className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-2 border-slate-400 group-hover:border-blue-500 flex items-center justify-center hover:scale-125 transition-transform cursor-crosshair z-30 shadow-xs"
                    title="Drop to connect edge here"
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-600 group-hover:bg-blue-600" />
                  </div>
                )}
                {/* 2. OUTPUT PORT(S) — Conditional gets TRUE+FALSE ports; others get a single port */}
                {node.type === 'conditional' ? (
                  <div className="absolute -right-14 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-30">
                    <div
                      onMouseDown={(e) => handleStartEdge(e, node.id)}
                      className="flex items-center gap-1 cursor-crosshair"
                      title="TRUE path — drag to connect"
                    >
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-1 py-0.5 rounded select-none">TRUE</span>
                      <div className="w-5 h-5 rounded-full bg-white border-2 border-emerald-500 hover:border-emerald-700 flex items-center justify-center hover:scale-125 transition-transform shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      </div>
                    </div>
                    <div
                      onMouseDown={(e) => handleStartEdge(e, node.id)}
                      className="flex items-center gap-1 cursor-crosshair"
                      title="FALSE / Default path — drag to connect"
                    >
                      <span className="text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-300 px-1 py-0.5 rounded select-none">FALSE</span>
                      <div className="w-5 h-5 rounded-full bg-white border-2 border-slate-400 hover:border-slate-600 flex items-center justify-center hover:scale-125 transition-transform shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-slate-500" />
                      </div>
                    </div>
                  </div>
                ) : node.type !== 'quarantine' ? (
                  <div
                    onMouseDown={(e) => handleStartEdge(e, node.id)}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-2 border-slate-400 group-hover:border-blue-500 flex items-center justify-center hover:scale-125 transition-transform cursor-crosshair z-30 shadow-xs"
                    title="Drag to connect to another node"
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-600 group-hover:bg-blue-600" />
                  </div>
                ) : null}
                {/* Card Top Row: Icon + Title + Status Pill + Settings Button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 ${node.variant === 'green' ? 'bg-emerald-600' :
                      node.variant === 'orange' ? 'bg-amber-600' :
                        node.variant === 'purple' ? 'bg-purple-600' :
                          node.variant === 'indigo' ? 'bg-indigo-600' : 'bg-blue-600'
                      }`}>
                      {node.type === 'source' ? (
                        (node.system || '').includes('Azure') ? <Cloud className="w-4 h-4" /> :
                          (node.system || '').includes('Salesforce') ? <Cloud className="w-4 h-4" /> :
                            ((node.system || '').includes('S3') || (node.system || '').includes('Storage') || (node.system || '').includes('AWS')) ? <FolderTree className="w-4 h-4" /> :
                              <Database className="w-4 h-4" />
                      ) :
                        node.type === 'vector_matcher' ? <Layers className="w-4 h-4" /> :
                          node.type === 'rag' ? <BookOpen className="w-4 h-4" /> :
                            node.type === 'conditional' ? <GitBranch className="w-4 h-4" /> :
                              node.type === 'hitl' ? <UserCheck className="w-4 h-4" /> :
                                node.type === 'rules' ? <FileCode2 className="w-4 h-4" /> :
                                  node.type === 'router' ? <GitBranch className="w-4 h-4" /> :
                                    node.type === 'quarantine' ? <AlertTriangle className="w-4 h-4" /> :
                                      <Database className="w-4 h-4" />}
                    </div>
                    <span className="text-xs font-bold text-slate-900 tracking-tight">
                      {node.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isStageActive ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                        {node.type === 'source' ? 'Ingesting...' :
                          node.type === 'vector_matcher' ? 'Matching Vectors...' :
                            node.type === 'rag' ? 'Retrieving Context...' :
                              node.type === 'conditional' ? 'Evaluating Switch...' :
                                node.type === 'hitl' ? 'Awaiting Sign-off...' :
                                  node.type === 'rules' ? 'Evaluating AST...' :
                                    node.type === 'router' ? 'Routing...' :
                                      node.type === 'target' ? 'Writing...' : 'Isolating...'}
                      </span>
                    ) : dagNodeExecutions[node.id] ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                        {dagNodeExecutions[node.id].rowsOut !== undefined
                          ? `${dagNodeExecutions[node.id].rowsOut} rows`
                          : `${dagNodeExecutions[node.id].rowsIn || 0} rows`}
                      </span>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 ${(node.status && node.status.includes('Demo')) || (node.type === 'source' && !node.isLive && node.status === 'Ready')
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : node.variant === 'green' || node.status === 'Connected'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : node.variant === 'orange'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {node.type === 'source' && !node.isLive && node.status === 'Ready' ? 'Demo Sandbox' : node.status}
                      </span>
                    )}
                    {/* Dedicated Settings Button on Every Node - ONLY place where property modal opens */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openNodeSettings(node);
                      }}
                      className="w-7 h-7 rounded-lg text-slate-500 hover:text-blue-600 bg-slate-100/90 hover:bg-blue-50 border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer shadow-2xs group-hover:border-slate-300"
                      title="Configure node properties & settings"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {/* Subtitle / System */}
                <p className="text-[11px] text-slate-500 truncate font-medium">
                  {node.system}
                </p>
                {/* Meta Box: Bound Table or Metric */}
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-[11px]">
                  <span className="font-mono font-bold text-slate-800 truncate flex items-center gap-1.5">
                    {node.type === 'source' ? (
                      node.isLive ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span>{node.table || 'Live Table'}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[9px] font-sans font-bold text-amber-700 bg-amber-100/90 px-1 py-0.2 rounded border border-amber-200 shrink-0">
                            DEMO TABLE
                          </span>
                          <span>{node.table || '0PUR_C01'}</span>
                        </>
                      )
                    ) : node.type === 'target' && liveNodeStats.target
                      ? `${node.table || '0PUR_C01_clean'} (${liveNodeStats.target})`
                      : node.type === 'quarantine' && liveNodeStats.quarantine
                        ? `${node.table || '0PUR_C01_quarant...'} (${liveNodeStats.quarantine})`
                        : node.type === 'rules' && liveNodeStats.rules
                          ? liveNodeStats.rules
                          : node.type === 'router' && liveNodeStats.router
                            ? '3-Way Evaluated'
                            : node.table || node.split || (node.ruleCount ? `${node.ruleCount} Active Rules` : 'Configured')}
                  </span>
                  <span className="text-slate-400 text-[10px] font-mono shrink-0">
                    {isStageActive ? (
                      <span className="text-blue-600 font-bold animate-pulse">Running...</span>
                    ) : dagNodeExecutions[node.id] ? (
                      <span className="text-emerald-700 font-bold">
                        {dagNodeExecutions[node.id].rowsIn !== undefined && dagNodeExecutions[node.id].rowsOut !== undefined && dagNodeExecutions[node.id].rowsIn !== dagNodeExecutions[node.id].rowsOut
                          ? `${dagNodeExecutions[node.id].rowsIn} in → ${dagNodeExecutions[node.id].rowsOut} out`
                          : `${dagNodeExecutions[node.id].rowsOut ?? dagNodeExecutions[node.id].rowsIn ?? 0} records`}
                      </span>
                    ) : node.type === 'source' && liveNodeStats.source ? (
                      <span className="text-blue-700 font-bold">{liveNodeStats.source}</span>
                    ) : node.type === 'router' && liveNodeStats.router ? (
                      <span className="text-purple-700 font-bold">{liveNodeStats.router}</span>
                    ) : (
                      node.rowCount || node.aiModel || 'Click ⚙ to edit'
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Floating Bottom Toolbar Dock - ALWAYS fits within window viewport */}
      <div className="absolute bottom-3 inset-x-3 sm:inset-x-5 flex flex-wrap md:flex-nowrap items-center justify-between gap-2 pointer-events-none z-30">
        {/* Left Action: Run Simulation / Dry Run directly on canvas */}
        <div className="pointer-events-auto shrink-0 flex items-center gap-2">
          <button
            onClick={handleDryRun}
            disabled={isExecutingDryRun || nodes.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 text-xs font-bold text-slate-800 shadow-md hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
            title="Execute test dry run directly on canvas"
          >
            <FlaskConical className={`w-3.5 h-3.5 text-blue-600 ${isExecutingDryRun ? 'animate-bounce' : ''}`} />
            <span className="hidden sm:inline">{isExecutingDryRun ? 'Evaluating...' : 'Test in Sandbox / Dry Run'}</span>
            <span className="sm:hidden">{isExecutingDryRun ? '...' : 'Dry Run'}</span>
          </button>
          <button
            onClick={handleRunLive}
            disabled={isExecutingLiveRun || nodes.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
            title="Commit compliant records live to Target Database"
          >
            <Play className={`w-3.5 h-3.5 fill-white ${isExecutingLiveRun ? 'animate-spin' : ''}`} />
            <span>{isExecutingLiveRun ? 'Posting...' : 'Run Live'}</span>
          </button>
        </div>
        {/* Center Floating Dock: Move | Pan | Fit | Add Node | Ask AI */}
        <div className="pointer-events-auto shrink-0 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-lg p-1.5 flex items-center gap-1">
          <button
            onClick={() => setActiveTool('move')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTool === 'move' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            title="Select & move nodes"
          >
            <Move className="w-3.5 h-3.5" />
            Move
          </button>
          <button
            onClick={() => setActiveTool('pan')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${activeTool === 'pan' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            title="Pan canvas tool"
          >
            <Hand className="w-3.5 h-3.5" />
            Pan
          </button>
          <button
            onClick={handleFitToWindow}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            title="Fit canvas and nodes to window"
          >
            <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
            Fit
          </button>
          <button
            onClick={() => setIsAddNodeModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            Add Node
          </button>
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            Ask AI
          </button>
        </div>
        {/* Right Zoom Controls (- 100% + Fit/Recenter) */}
        <div className="pointer-events-auto shrink-0 bg-white rounded-xl border border-slate-200 shadow-md px-2 py-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <button
            onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.4))}
            className="w-5 h-5 flex items-center justify-center hover:bg-slate-100 rounded text-slate-500 font-bold cursor-pointer"
            title="Zoom out"
          >
            –
          </button>
          <span
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            className="font-mono text-[11px] cursor-pointer hover:text-blue-600 px-1"
            title="Reset zoom to 100%"
          >
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(prev => Math.min(prev + 0.1, 2.0))}
            className="w-5 h-5 flex items-center justify-center hover:bg-slate-100 rounded text-slate-500 font-bold cursor-pointer"
            title="Zoom in"
          >
            +
          </button>
          <span className="h-3.5 w-px bg-slate-200 mx-0.5" />
          <button
            onClick={handleFitToWindow}
            className="w-5 h-5 flex items-center justify-center hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600 cursor-pointer"
            title="Center and fit to window"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>
      {/* =========================================================================
          EXECUTION RESULTS SUMMARY BANNER
         ========================================================================= */}
      {executionSummary && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl p-4 flex items-center gap-6 animate-in slide-in-from-bottom duration-200 max-w-2xl w-full">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${executionSummary.isLive ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
              }`}>
              {executionSummary.isLive ? <CheckCircle2 className="w-5 h-5" /> : <FlaskConical className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">
                  {executionSummary.isLive ? 'Live Commit Successful' : 'Dry Run Completed'}
                </h4>
                {executionSummary.docNo && (
                  <span className="font-mono text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                    {executionSummary.docNo}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {executionSummary.total.toLocaleString()} rows evaluated · Health score: <strong className="text-slate-900">{executionSummary.health}%</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 border-l border-slate-200 pl-4 text-xs">
            <div className="text-center">
              <span className="block font-bold text-emerald-600">{executionSummary.clean.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Clean</span>
            </div>
            <div className="text-center">
              <span className="block font-bold text-blue-600">{executionSummary.fixed.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Fixed</span>
            </div>
            <div className="text-center">
              <span className="block font-bold text-amber-600">{executionSummary.quarantined.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Quarantined</span>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setIsTelemetryDrawerOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <span>Telemetry Cockpit</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setExecutionSummary(null)}
              className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {/* =========================================================================
          EXECUTION ERROR TOAST BANNER (HONEST ERROR DISPLAY)
         ========================================================================= */}
      {executionError && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 bg-rose-50/95 backdrop-blur-md rounded-2xl border border-rose-300 shadow-2xl p-4 flex items-center gap-4 animate-in slide-in-from-bottom duration-200 max-w-xl w-full text-rose-900">
          <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0 text-rose-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-rose-950 flex items-center gap-2">
              {executionError.title}
            </h4>
            <p className="text-xs text-rose-800/90 mt-0.5 break-words">
              {executionError.message}
            </p>
          </div>
          <button
            onClick={() => setExecutionError(null)}
            className="w-7 h-7 rounded-lg text-rose-400 hover:text-rose-800 hover:bg-rose-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <AddNodeCatalogModal
        isOpen={isAddNodeModalOpen}
        onClose={() => setIsAddNodeModalOpen(false)}
        addNodeSearch={addNodeSearch}
        setAddNodeSearch={setAddNodeSearch}
        handleAddNodeFromCatalog={handleAddNodeFromCatalog}
      />

      {/* =========================================================================
          MODAL 2: NODE PROPERTIES MODAL (With Edge Connectors Configuration)
         ========================================================================= */}
      {isPropertyModalOpen && selectedNode && (
        <div
          onClick={() => setIsPropertyModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[88vh] cursor-default"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border text-white ${selectedNode.variant === 'green' ? 'bg-emerald-600 border-emerald-700' :
                  selectedNode.variant === 'orange' ? 'bg-amber-600 border-amber-700' :
                    selectedNode.variant === 'purple' ? 'bg-purple-600 border-purple-700' :
                      selectedNode.variant === 'indigo' ? 'bg-indigo-600 border-indigo-700' :
                        'bg-blue-600 border-blue-700'
                  }`}>
                  {selectedNode.type === 'vector_matcher' ? <Layers className="w-5 h-5" /> :
                    selectedNode.type === 'rag' ? <BookOpen className="w-5 h-5" /> :
                      selectedNode.type === 'conditional' ? <GitBranch className="w-5 h-5" /> :
                        selectedNode.type === 'hitl' ? <UserCheck className="w-5 h-5" /> :
                          selectedNode.type === 'rules' ? <FileCode2 className="w-5 h-5" /> :
                            selectedNode.type === 'router' ? <GitBranch className="w-5 h-5" /> :
                              selectedNode.type === 'quarantine' ? <AlertTriangle className="w-5 h-5" /> :
                                srcDbType === 'AWS S3' ? <FolderTree className="w-5 h-5" /> :
                                  (srcDbType === 'Azure' || srcDbType === 'Salesforce') ? <Cloud className="w-5 h-5" /> :
                                    <Database className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedNode.title || 'Configure Node'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedNode.type === 'vector_matcher' ? 'Finds fuzzy-matching records using AI similarity scoring' :
                      selectedNode.type === 'rag' ? 'Searches your knowledge library and enriches records with relevant context' :
                        selectedNode.type === 'conditional' ? 'Directs records to TRUE or FALSE path based on your condition' :
                          selectedNode.type === 'hitl' ? 'Pauses pipeline and waits for human Approve / Reject decision' :
                            selectedNode.type === 'pinecone' ? 'Pinecone Vector Database Index & Settings' :
                              selectedNode.type === 'bigquery' ? 'Google BigQuery Cloud Warehouse & Write API' :
                                selectedNode.type === 'source' ? (
                                  srcDbType === 'AWS S3' ? 'AWS S3 Bucket & Object Lake Discovery' :
                                    srcDbType === 'Azure' ? 'Azure Blob Storage Container & Parquet Discovery' :
                                      srcDbType === 'Salesforce' ? 'Salesforce CRM Objects & API Configuration' :
                                        'Source Database & Table Selection'
                                ) :
                                  selectedNode.type === 'rules' ? 'Intelligence Engine & Prompt Settings' :
                                    selectedNode.type === 'router' ? 'CleanFlow In-Flight Routing Criteria' :
                                      selectedNode.type === 'target' ? 'Target S/4HANA & Lakehouse Writeback' :
                                        'Quarantine Workbench Settings'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPropertyModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Properties Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 max-h-[72vh]">
              {selectedNode.type === 'source' && (
                <SourceModalPanel
                  selectedNode={selectedNode}
                  connectMethod={connectMethod}
                  setConnectMethod={setConnectMethod}
                  handleFileUpload={handleFileUpload}
                  uploadedFileMeta={uploadedFileMeta}
                  uploadedCols={uploadedCols}
                  srcDbType={srcDbType}
                  applyEngineCredentials={(val) => applyEngineCredentials(val, undefined, true)}
                  srcHost={srcHost}
                  setSrcHost={setSrcHost}
                  srcPort={srcPort}
                  setSrcPort={setSrcPort}
                  srcDbName={srcDbName}
                  setSrcDbName={setSrcDbName}
                  srcUser={srcUser}
                  setSrcUser={setSrcUser}
                  srcPass={srcPass}
                  setSrcPass={setSrcPass}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  connString={connString}
                  setConnString={setConnString}
                  showConnString={showConnString}
                  setShowConnString={setShowConnString}
                  readScope={readScope}
                  setReadScope={setReadScope}
                  srcTable={srcTable}
                  setSrcTable={setSrcTable}
                  srcTestMeta={srcTestMeta}
                  srcTesting={srcTesting}
                  handleTestSourceConnection={handleTestSourceConnection}
                  activeEngineKey={activeEngineKey}
                  discoveredColumns={discoveredColumns}
                  previewRows={previewRows}
                  isSamplingLive={isSamplingLive}
                  isLiveSampleActive={isLiveSampleActive}
                />
              )}

              {selectedNode.type === 'rules' && (
                <RulesModalPanel
                  rulesPrompt={rulesPrompt}
                  setRulesPrompt={setRulesPrompt}
                  autoFixActive={autoFixActive}
                  setAutoFixActive={setAutoFixActive}
                  rulesGenerating={rulesGenerating}
                  setRulesGenerating={setRulesGenerating}
                  srcTable={srcTable}
                  activeEngineKey={activeEngineKey}
                  discoveredColumns={discoveredColumns}
                  previewRows={previewRows}
                  isLiveSampleActive={isLiveSampleActive}
                  rulesList={rulesList}
                  setRulesList={setRulesList}
                  setActiveRules={setActiveRules}
                  showAddCustomRule={showAddCustomRule}
                  setShowAddCustomRule={setShowAddCustomRule}
                  newRuleField={newRuleField}
                  setNewRuleField={setNewRuleField}
                  newRuleSeverity={newRuleSeverity}
                  setNewRuleSeverity={setNewRuleSeverity}
                  newRuleCondition={newRuleCondition}
                  setNewRuleCondition={setNewRuleCondition}
                  handleAddNewCustomRule={handleAddNewCustomRule}
                  handleToggleRuleItem={handleToggleRuleItem}
                  handleDeleteRuleItem={handleDeleteRuleItem}
                />
              )}

              {selectedNode.type === 'router' && (
                <RouterModalPanel
                  routerThreshold={routerThreshold}
                  setRouterThreshold={setRouterThreshold}
                />
              )}

              {selectedNode.type === 'target' && (
                <TargetModalPanel
                  sourceTable={srcTable || sourceConfig?.table || ''}
                  tgtDbType={tgtDbType}
                  setTgtDbType={setTgtDbType}
                  tgtEndpoint={tgtEndpoint}
                  setTgtEndpoint={setTgtEndpoint}
                  tgtTable={tgtTable}
                  setTgtTable={setTgtTable}
                  writeMode={writeMode}
                  setWriteMode={setWriteMode}
                  targetVerificationGate={targetVerificationGate}
                  setTargetVerificationGate={setTargetVerificationGate}
                  tgtTesting={tgtTesting}
                  tgtTestMeta={tgtTestMeta}
                  handleTestTargetConnection={handleTestTargetConnection}
                />
              )}

              {selectedNode.type === 'quarantine' && (
                <QuarantineModalPanel
                  quarantineTable={quarantineTable}
                  setQuarantineTable={setQuarantineTable}
                  quarantineAlertWebhook={quarantineAlertWebhook}
                  setQuarantineAlertWebhook={setQuarantineAlertWebhook}
                />
              )}

              {/* =========================================================================
                  3. SEMANTIC VECTOR MATCHER PANEL
                 ========================================================================= */}
              {selectedNode.type === 'vector_matcher' && (
                <VectorMatcherModalPanel
                  sourceTable={srcTable || sourceConfig?.table || ''}
                  availableColumns={discoveredColumns.length > 0 ? discoveredColumns : (sourceConfig?.discoveredColumns || [])}
                  model={vectorModel}
                  onModelChange={setVectorModel}
                  targetField={vectorTargetField}
                  onTargetFieldChange={setVectorTargetField}
                  threshold={vectorThreshold}
                  onThresholdChange={setVectorThreshold}
                  vectorIndex={vectorIndex}
                  onVectorIndexChange={setVectorIndex}
                  autoResolve={vectorAutoResolve}
                  onAutoResolveChange={setVectorAutoResolve}
                />
              )}
              {/* =========================================================================
                  4. RAG CONTEXT ENRICHER PANEL
                 ========================================================================= */}
              {selectedNode.type === 'rag' && (
                <RagModalPanel
                  sourceTable={srcTable || sourceConfig?.table || ''}
                  availableColumns={discoveredColumns.length > 0 ? discoveredColumns : (sourceConfig?.discoveredColumns || [])}
                  knowledgeBase={ragKnowledgeBase}
                  onKnowledgeBaseChange={setRagKnowledgeBase}
                  queryKey={ragQueryKey}
                  onQueryKeyChange={setRagQueryKey}
                  topK={ragTopK}
                  onTopKChange={setRagTopK}
                  targetField={ragTargetField}
                  onTargetFieldChange={setRagTargetField}
                  fallbackPolicy={ragFallback}
                  onFallbackPolicyChange={setRagFallback}
                />
              )}
              {/* =========================================================================
                  5. CONDITIONAL SWITCH PANEL
                 ========================================================================= */}
              {selectedNode.type === 'conditional' && (
                <ConditionalSwitchModalPanel
                  sourceTable={srcTable || sourceConfig?.table || ''}
                  availableColumns={discoveredColumns.length > 0 ? discoveredColumns : (sourceConfig?.discoveredColumns || [])}
                  previewRows={previewRows}
                  conditionField={conditionField}
                  onConditionFieldChange={setConditionField}
                  conditionOp={conditionOp}
                  onConditionOpChange={setConditionOp}
                  conditionVal={conditionVal}
                  onConditionValChange={setConditionVal}
                  trueDest={condTrueDest}
                  onTrueDestChange={setCondTrueDest}
                  falseDest={condFalseDest}
                  onFalseDestChange={setCondFalseDest}
                />
              )}
              {/* =========================================================================
                  6. HUMAN-IN-THE-LOOP GOVERNANCE PANEL
                 ========================================================================= */}
              {selectedNode.type === 'hitl' && (
                <HitlModalPanel
                  triggerPolicy={hitlTriggerPolicy}
                  onTriggerPolicyChange={setHitlTriggerPolicy}
                  reviewerRole={hitlReviewerRole}
                  onReviewerRoleChange={setHitlReviewerRole}
                  slaTimeout={hitlSlaTimeout}
                  onSlaTimeoutChange={setHitlSlaTimeout}
                  webhook={hitlWebhook}
                  onWebhookChange={setHitlWebhook}
                  actionMode={hitlActionMode}
                  onActionModeChange={setHitlActionMode}
                  sourceTable={srcTable || sourceConfig?.table || '0PUR_C01'}
                  availableColumns={discoveredColumns.length > 0 ? discoveredColumns : (sourceConfig?.discoveredColumns || [])}
                  conditionType={hitlConditionType}
                  onConditionTypeChange={setHitlConditionType}
                  customField={hitlCustomField}
                  onCustomFieldChange={setHitlCustomField}
                  customOp={hitlCustomOp}
                  onCustomOpChange={setHitlCustomOp}
                  customVal={hitlCustomVal}
                  onCustomValChange={setHitlCustomVal}
                  customExpression={hitlCustomExpression}
                  onCustomExpressionChange={setHitlCustomExpression}
                />
              )}
              {/* =========================================================================
                  7. PINECONE VECTOR DATABASE PANEL
                 ========================================================================= */}
              {selectedNode.type === 'pinecone' && (
                <PineconeModalPanel
                  indexName={pineconeIndex}
                  onIndexNameChange={setPineconeIndex}
                  host={pineconeHost}
                  onHostChange={setPineconeHost}
                  apiKey={pineconeApiKey}
                  onApiKeyChange={setPineconeApiKey}
                  namespace={pineconeNamespace}
                  onNamespaceChange={setPineconeNamespace}
                  dimension={pineconeDimension}
                  onDimensionChange={setPineconeDimension}
                  metric={pineconeMetric}
                  onMetricChange={setPineconeMetric}
                />
              )}
              {/* =========================================================================
                  8. GOOGLE BIGQUERY CLOUD WAREHOUSE PANEL
                 ========================================================================= */}
              {selectedNode.type === 'bigquery' && (
                <BigQueryModalPanel
                  projectId={bqProject}
                  onProjectIdChange={setBqProject}
                  datasetId={bqDataset}
                  onDatasetIdChange={setBqDataset}
                  tableName={bqTable}
                  onTableNameChange={setBqTable}
                  location={bqLocation}
                  onLocationChange={setBqLocation}
                  clientEmail={bqEmail}
                  onClientEmailChange={setBqEmail}
                  privateKeyId={bqKeyId}
                  onPrivateKeyIdChange={setBqKeyId}
                  writeMode={bqWriteMode}
                  onWriteModeChange={setBqWriteMode}
                />
              )}
              {/* =========================================================
                  PIPELINE CONNECTIONS STATUS (Auto-Wired by DAG Topology)
                 ========================================================= */}
              <div className="pt-3 border-t border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-900">
                    Pipeline Flow Connections
                  </label>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" /> Auto-Wired in Template
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  This node is automatically connected to your workflow pipeline. You do not need to manually configure connections. You can also drag ports on the canvas to rewire.
                </p>
                {/* Show existing incoming & outgoing connections */}
                <div className="space-y-1.5">
                  {edges.filter(e => e.to === selectedNode.id).map(e => {
                    const fromNode = nodes.find(n => n.id === e.from);
                    return (
                      <div key={e.id} className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-emerald-950 font-medium">
                          <span className="text-[10px] uppercase font-bold text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200">Incoming</span>
                          <span>From: <strong>{fromNode?.title || e.from}</strong></span>
                          {e.label && <span className="text-slate-400 font-mono text-[10px]">({e.label})</span>}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700">✓ Connected</span>
                      </div>
                    );
                  })}
                  {edges.filter(e => e.from === selectedNode.id).map(e => {
                    const toNode = nodes.find(n => n.id === e.to);
                    return (
                      <div key={e.id} className="p-2 rounded-lg bg-blue-50/70 border border-blue-200 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-blue-950 font-medium">
                          <span className="text-[10px] uppercase font-bold text-blue-700 bg-white px-1.5 py-0.5 rounded border border-blue-200">Outgoing</span>
                          <span>To: <strong>{toNode?.title || e.to}</strong></span>
                          {e.label && <span className="text-slate-400 font-mono text-[10px]">({e.label})</span>}
                        </span>
                        <span className="text-[10px] font-bold text-blue-700">✓ Connected</span>
                      </div>
                    );
                  })}
                </div>
                {/* Collapsible toggle for custom rewiring */}
                <details className="mt-2 text-xs group">
                  <summary className="font-semibold text-slate-500 hover:text-slate-800 cursor-pointer list-none flex items-center gap-1 py-1">
                    <span className="text-[11px] text-blue-600 underline">⚙️ Advanced: Manually Link / Unlink Other Nodes (Optional)</span>
                  </summary>
                  <div className="pt-2 space-y-1.5">
                    {nodes.filter(n => n.id !== selectedNode.id).map((other) => {
                      const isConnected = edges.some(e => e.from === selectedNode.id && e.to === other.id);
                      const titleText = other.title || other.name || 'Target Node';
                      const isDupeSystem = other.system && titleText.toLowerCase().includes(other.system.toLowerCase());
                      const systemText = other.system && !isDupeSystem ? ` (${other.system})` : '';
                      return (
                        <div
                          key={other.id}
                          onClick={() => {
                            if (isConnected) {
                              setEdges(prev => prev.filter(e => !(e.from === selectedNode.id && e.to === other.id)));
                            } else {
                              setEdges(prev => [
                                ...prev,
                                {
                                  id: `edge-${selectedNode.id}-${other.id}`,
                                  from: selectedNode.id,
                                  to: other.id,
                                  label: other.type === 'quarantine' ? 'Violations' : 'Connected',
                                  variant: other.type === 'quarantine' ? 'orange' : 'blue'
                                }
                              ]);
                            }
                          }}
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-colors ${isConnected ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-blue-600' : 'bg-slate-400'}`} />
                            <span className="font-semibold text-slate-900">{titleText}</span>
                            {systemText && <span className="text-[11px] text-slate-500 font-normal">{systemText}</span>}
                          </span>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${isConnected ? 'bg-blue-200 text-blue-800' : 'bg-slate-200 text-slate-600'
                            }`}>
                            {isConnected ? 'Connected' : 'Click to Link'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </details>
              </div>
            </div>
            {/* Modal Actions Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <button
                onClick={() => handleDeleteNode(selectedNode.id)}
                className="px-3.5 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Node
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPropertyModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
                {selectedNode.type === 'source' ? (
                  <button
                    onClick={handleSaveSourceConfig}
                    className="px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Save Source Settings
                  </button>
                ) : selectedNode.type === 'rules' ? (
                  <button
                    onClick={handleSaveRulesConfig}
                    className="px-5 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Save Rules Settings
                  </button>
                ) : selectedNode.type === 'router' ? (
                  <button
                    onClick={handleSaveRouterConfig}
                    className="px-5 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Save Router Settings
                  </button>
                ) : selectedNode.type === 'target' ? (
                  <button
                    onClick={handleSaveTargetConfig}
                    className="px-5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Save Target Settings
                  </button>
                ) : selectedNode.type === 'vector_matcher' ? (
                  <button
                    onClick={handleSaveVectorMatcherConfig}
                    className="px-5 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Save Vector Matcher Settings
                  </button>
                ) : selectedNode.type === 'rag' ? (
                  <button
                    onClick={handleSaveRagConfig}
                    className="px-5 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Save RAG Settings
                  </button>
                ) : selectedNode.type === 'conditional' ? (
                  <button
                    onClick={handleSaveConditionalConfig}
                    className="px-5 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Save Switch Settings
                  </button>
                ) : selectedNode.type === 'hitl' ? (
                  <button
                    onClick={handleSaveHitlConfig}
                    className="px-5 py-2 rounded-xl bg-amber-600 text-white hover:bg-amber-700 text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Save Governance Gate Settings
                  </button>
                ) : selectedNode.type === 'pinecone' ? (
                  <button
                    onClick={handleSavePineconeConfig}
                    className="px-5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Save Pinecone Settings
                  </button>
                ) : selectedNode.type === 'bigquery' ? (
                  <button
                    onClick={handleSaveBigQueryConfig}
                    className="px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Save BigQuery Settings
                  </button>
                ) : (
                  <button
                    onClick={handleSaveQuarantineConfig}
                    className="px-5 py-2 rounded-xl bg-amber-600 text-white hover:bg-amber-700 text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Save Quarantine Settings
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* =========================================================================
          MODAL 3: ASK AI WORKFLOW OPTIMIZER
         ========================================================================= */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
          >
            <div className="p-6 bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white relative">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 text-[10px] font-bold border border-purple-400/30 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-300" />
                  Azure OpenAI Agent
                </span>
                <button onClick={() => setIsAiModalOpen(false)} className="text-white/60 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-xl font-bold tracking-tight">Ask AI: Autonomous Workflow Optimizer</h3>
              <p className="text-xs text-purple-200/80 mt-1">
                Auto-generate and wire optimal pipeline stages based on your active enterprise source and destination.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Describe the workflow you want to construct:
                </label>
                <textarea
                  rows={3}
                  defaultValue="Ingest SAP BW procurement orders, apply Clean Core BAPI validation, auto-repair plant codes via ontology graph, and dual-dispatch compliant rows to S/4HANA and Databricks."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleAutofillTemplate('sap_bw_s4hana');
                  setIsAiModalOpen(false);
                }}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Apply AI Workflow
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Pipeline Execution & Consensus Telemetry Drawer */}
      <CanvasTelemetryDrawer
        isOpen={isTelemetryDrawerOpen}
        onClose={() => setIsTelemetryDrawerOpen(false)}
        summary={executionSummary}
        dagExecutions={dagNodeExecutions}
        consensusData={executionSummary?.consensusGuard}
        activeRules={activeRules}
        workflowNodes={nodes}
        sourceTable={executionSummary?.sourceTable || srcTable}
        sourceEngine={executionSummary?.sourceEngine || srcDbType}
        targetTable={executionSummary?.targetTable || tgtTable}
        targetEngine={executionSummary?.targetEngine || tgtDbType}
        discoveredColumns={executionSummary?.columns || discoveredColumns}
      />
    </div>
  );
}
