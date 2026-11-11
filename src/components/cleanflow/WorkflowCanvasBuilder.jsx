import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Plus,
  Check,
  X,
  Database,
  FileCode2,
  GitBranch,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Trash2,
  Copy,
  Settings,
  ArrowRight,
  ArrowLeft,
  Inbox,
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
  Info,
  Clock,
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
import BuildWithAiDrawer from './modals/BuildWithAiDrawer';
import PreflightCheckPopover from './modals/PreflightCheckPopover';
import EdgeInsertMenuPopover from './modals/EdgeInsertMenuPopover';
import RuleImpactPreviewModal from './modals/RuleImpactPreviewModal';
import CanvasTelemetryDrawer from './CanvasTelemetryDrawer';
import { OPERATIONAL_CATALOG, sanitizeNode, resolveEngineKey } from './constants/nodeCatalog';
import { RunningDryRunModal, DryRunResultsModal } from '../workflows/dryrun';
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
  const [isRunningDryRunModalOpen, setIsRunningDryRunModalOpen] = useState(false);
  const [isDryRunResultsModalOpen, setIsDryRunResultsModalOpen] = useState(false);
  const [isExecutingLiveRun, setIsExecutingLiveRun] = useState(false);
  const [executionSummary, setExecutionSummary] = useState(null);
  const [isTelemetryDrawerOpen, setIsTelemetryDrawerOpen] = useState(false);
  const [executionError, setExecutionError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Quarantine Visual Canvas Trace State (Matching Main-5.png)
  const [traceRecordId, setTraceRecordId] = useState(() => {
    if (typeof window === 'undefined') return null;
    const match = window.location.hash.match(/trace=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  });

  useEffect(() => {
    const handleHashChange = () => {
      const match = window.location.hash.match(/trace=([^&]+)/);
      setTraceRecordId(match ? decodeURIComponent(match[1]) : null);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleExitTrace = () => {
    setTraceRecordId(null);
    window.location.hash = '#canvas';
  };
  // Phased Multi-Stage Execution States
  const [executionPhase, setExecutionPhase] = useState('idle'); // 'idle' | 'extracting' | 'compiling' | 'routing' | 'committing' | 'completed'
  const [activeStageNodeId, setActiveStageNodeId] = useState(null);
  const [executionStageText, setExecutionStageText] = useState('');
  const [executionProgress, setExecutionProgress] = useState(0);
  const [executionElapsedMs, setExecutionElapsedMs] = useState(0);
  const [liveNodeStats, setLiveNodeStats] = useState({});
  // Selection & Dragging
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [showMinimap, setShowMinimap] = useState(true);
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
  // Enhancement 6.2 - 6.6 Modals & Popovers State
  const [isBuildWithAiOpen, setIsBuildWithAiOpen] = useState(false);
  const [isPreflightOpen, setIsPreflightOpen] = useState(false);
  const [isEdgeInsertMenuOpen, setIsEdgeInsertMenuOpen] = useState(false);
  const [activeEdgeForInsert, setActiveEdgeForInsert] = useState(null);
  const [isRuleImpactModalOpen, setIsRuleImpactModalOpen] = useState(false);
  const [activeRuleForImpact, setActiveRuleForImpact] = useState(null);
  const [isAddNodeMenuOpen, setIsAddNodeMenuOpen] = useState(false);
  const [aiAddedBanner, setAiAddedBanner] = useState(null);
  const [showUndoBar, setShowUndoBar] = useState(false);
  const [undoSnapshot, setUndoSnapshot] = useState(null);
  const [preflightHasBlocking, setPreflightHasBlocking] = useState(true);
  const [aiPrompt, setAiPrompt] = useState('Read purchasing lines from SAP BW, flag orders over $50K for controller review, auto-fix plant codes and write clean rows to S/4HANA.');
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
    setIsRunningDryRunModalOpen(false);
    setIsDryRunResultsModalOpen(false);
    setIsTelemetryDrawerOpen(false);
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
      setIsRunningDryRunModalOpen(false);
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
    if (preflightHasBlocking) {
      setIsPreflightOpen(true);
      addNotification({
        title: 'Pre-flight Check Required',
        description: '1 blocking issue detected. Fix permissions on PostgreSQL target before running live.',
        type: 'error',
        link: '#canvas'
      });
      return;
    }
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
  const handleLiveRun = handleRunLive;
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
    openNodeSettings(node);
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
  // Keyboard Shortcuts (Task 34: Canvas Usability Polish)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          setEdges(prev => prev.filter(ed => ed.from !== selectedNodeId && ed.to !== selectedNodeId));
          setNodes(prev => prev.filter(n => n.id !== selectedNodeId));
          setSelectedNodeId(null);
        } else if (selectedEdgeId) {
          setEdges(prev => prev.filter(ed => ed.id !== selectedEdgeId));
          setSelectedEdgeId(null);
        }
      } else if (e.key === 'Escape') {
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        setDrawingEdge(null);
        setIsTelemetryDrawerOpen(false);
      } else if (e.key === 'f' || e.key === 'F') {
        handleFitToWindow();
      } else if (e.target && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        if (e.key === 'a' || e.key === 'A') {
          setIsAiModalOpen(true);
        } else if (e.key === 'n' || e.key === 'N') {
          setIsAddNodeModalOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, selectedEdgeId, setNodes, setEdges, handleFitToWindow]);

  const handleDeleteEdge = (edgeId) => {
    setEdges(prev => prev.filter(e => e.id !== edgeId));
    setSelectedEdgeId(null);
  };

  // Enhancement 6.2: Accept AI Drafted Workflow
  const handleAcceptAiDraft = (draftResult) => {
    setUndoSnapshot({ nodes: [...nodes], edges: [...edges] });
    const generatedNodes = (draftResult?.nodes || []).map((n, idx) => ({
      ...n,
      id: n.id || `node-${n.type || 'gen'}-${Date.now()}-${idx}`,
      x: n.x ?? (150 + idx * 300),
      y: n.y ?? (240 + (idx % 2) * 40),
      width: n.width || 280,
      height: n.height || 140,
      isSuggested: false,
      needsSetup: n.needs_setup ?? (n.type === 'target' || (n.title || '').toLowerCase().includes('postgresql')),
    }));
    const generatedEdges = (draftResult?.edges || []).map((e, idx) => ({
      ...e,
      id: e.id || `edge-gen-${idx}`,
    }));

    setNodes(generatedNodes);
    setEdges(generatedEdges);

    const setupNode = generatedNodes.find(n => n.needsSetup);
    if (setupNode) {
      setAiAddedBanner({
        show: true,
        message: `${generatedNodes.length} nodes added. ${setupNode.title} needs write mode configuration before running.`,
        targetNodeId: setupNode.id,
      });
    }
    setShowUndoBar(true);

    addNotification({
      type: 'success',
      title: 'Workflow Generated',
      description: `Added ${generatedNodes.length} nodes and wired connections.`,
    });
  };

  const handleUndoAiDraft = () => {
    if (undoSnapshot) {
      setNodes(undoSnapshot.nodes);
      setEdges(undoSnapshot.edges);
      setUndoSnapshot(null);
      setAiAddedBanner(null);
      setShowUndoBar(false);
      addNotification({
        type: 'info',
        title: 'Action Undone',
        description: 'Canvas restored to previous state.',
      });
    }
  };

  // Enhancement 6.4: Insert node between two connected nodes on an edge
  const handleInsertNodeOnEdge = (nodeType) => {
    if (!activeEdgeForInsert) return;
    const fromNode = getNode(activeEdgeForInsert.from);
    const toNode = getNode(activeEdgeForInsert.to);
    if (!fromNode || !toNode) return;

    const newId = `node-${nodeType}-${Date.now()}`;
    const midX = Math.round((fromNode.x + toNode.x) / 2);
    const midY = Math.round((fromNode.y + toNode.y) / 2);

    let newNode;
    if (nodeType === 'rules') {
      newNode = {
        id: newId,
        type: 'rules',
        title: 'AI Rules Engine',
        subtitle: 'Plain-English validation policy',
        category: 'TRANSFORMATION',
        x: midX,
        y: midY,
        width: 280,
        height: 140,
        rules: [
          { id: 'r1', name: 'GL Account Format', field: 'gl_account', severity: 'High', action: 'Quarantine', expression: "regex_match(gl_account, '^[0-9]{4}-[0-9]{4}$')" }
        ]
      };
    } else if (nodeType === 'router') {
      newNode = {
        id: newId,
        type: 'router',
        title: 'Conditional Router',
        subtitle: 'Split stream by confidence or condition',
        category: 'FLOW CONTROL',
        x: midX,
        y: midY,
        width: 280,
        height: 140,
      };
    } else if (nodeType === 'hitl') {
      newNode = {
        id: newId,
        type: 'hitl',
        title: 'Review · Controller Gate',
        subtitle: 'Hold ambiguous rows for sign-off',
        category: 'HUMAN IN THE LOOP',
        x: midX,
        y: midY,
        width: 280,
        height: 140,
      };
    } else {
      newNode = {
        id: newId,
        type: nodeType,
        title: `${nodeType.toUpperCase()} Step`,
        subtitle: 'Pipeline stage',
        category: 'PROCESSING',
        x: midX,
        y: midY,
        width: 280,
        height: 140,
      };
    }

    setNodes(prev => [...prev, newNode]);
    setEdges(prev => [
      ...prev.filter(e => e.id !== activeEdgeForInsert.id),
      { id: `edge-${fromNode.id}-${newId}`, from: fromNode.id, to: newId },
      { id: `edge-${newId}-${toNode.id}`, from: newId, to: toNode.id },
    ]);

    addNotification({
      type: 'success',
      title: `Inserted ${newNode.title}`,
      description: `Added node between ${fromNode.title || fromNode.id} and ${toNode.title || toNode.id}.`,
    });

    setActiveEdgeForInsert(null);
    setIsEdgeInsertMenuOpen(false);
  };

  // Enhancement 6.5: Rule Impact Preview Save
  const handleSaveRuleFromImpact = (updatedRule) => {
    setActiveRules(prev => (prev || []).map(r => r.name === updatedRule.name || r.id === updatedRule.id ? { ...r, ...updatedRule } : r));
    addNotification({
      type: 'success',
      title: `Rule Updated: ${updatedRule.name}`,
      description: 'Impact simulation applied. Quarantine and Sandbox metrics updated.',
    });
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
      rowCount: 'Top Chunks'
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

  const getNodeIndexNumber = (node) => {
    if (!node) return '1';
    if (node.id === 'node-source' || node.type === 'source') return '1';
    if (node.id === 'node-rules' || node.type === 'rules') return '2';
    if (node.id === 'node-conditional' || node.type === 'conditional') return '3';
    if (node.id === 'node-hitl' || node.type === 'hitl') return '4';
    if (node.id === 'node-router' || node.type === 'router') return '5';
    if (node.id === 'node-target' || node.type === 'target') return '6';
    if (node.id === 'node-quarantine' || node.type === 'quarantine') return '7';
    const idx = nodes.findIndex(n => n.id === node.id);
    return idx >= 0 ? String(idx + 1) : '1';
  };

  const getNodeCategoryLabel = (node) => {
    if (!node) return 'Node';
    if (node.type === 'source') return 'Source';
    if (node.type === 'rules') return 'AI rules';
    if (node.type === 'conditional') return 'Router';
    if (node.type === 'hitl') return 'Review';
    if (node.type === 'router') return 'Split';
    if (node.type === 'target') return 'Target';
    if (node.type === 'quarantine') return 'DLQ';
    return node.type.toUpperCase();
  };

  const getNodeStatusLabel = (node) => {
    if (activeStageNodeId === node.id || isExecutingDryRun || isExecutingLiveRun) return 'Running';
    if (dagNodeExecutions[node.id]) return 'Done';
    if (node.type === 'source') return 'Demo';
    if (node.type === 'rules') return 'Auto-fix';
    if (node.type === 'conditional') return 'Active';
    if (node.type === 'hitl') return 'Armed';
    if (node.type === 'router') return 'Active';
    if (node.type === 'target') return 'Ready';
    if (node.type === 'quarantine') return 'Locked';
    return node.status || 'Active';
  };

  const getNodeStatusBadgeClass = (node) => {
    const status = getNodeStatusLabel(node);
    if (status === 'Running') return 'bg-blue-50 text-[#2D55F5] border border-blue-200 animate-pulse';
    if (status === 'Done') return 'bg-emerald-50 text-[#127A52] border border-emerald-200';
    if (status === 'Demo' || status === 'Armed') return 'bg-[#FFF9F2] text-[#C06815] border border-[#FDE5CC]';
    if (status === 'Auto-fix') return 'bg-[#F5F8FF] text-[#2D55F5] border border-[#DCE4FF]';
    if (status === 'Active' || status === 'Ready') return 'bg-[#ECFDF5] text-[#127A52] border border-[#A7F3D0]';
    if (status === 'Locked') return 'bg-slate-100 text-slate-600 border border-slate-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  const getNodeDisplayTitle = (node) => {
    if (!node) return '';
    if (node.type === 'source') return 'SAP BW';
    if (node.type === 'rules') return 'Intelligence engine';
    if (node.type === 'conditional') return 'If / else router';
    if (node.type === 'hitl') return 'Controller gate';
    if (node.type === 'router') return 'CleanFlow router';
    if (node.type === 'target') return 'SAP S/4HANA';
    if (node.type === 'quarantine') return 'Quarantine store';
    return node.title;
  };

  const getNodeDisplaySubtitle = (node) => {
    if (!node) return '';
    if (node.type === 'source') return 'InfoCube · HANA Cloud';
    if (node.type === 'rules') return 'Clean core ontologies';
    if (node.type === 'conditional') return 'TOTAL_AMOUNT > 50,000';
    if (node.type === 'hitl') return 'Procurement controller';
    if (node.type === 'router') return 'Clean · Fixed · Quarantined';
    if (node.type === 'target') return 'Clean core';
    if (node.type === 'quarantine') return 'Dead-letter isolation';
    return node.system || node.desc || '';
  };

  const getNodeIcon = (node) => {
    if (!node) return <Database className="w-4 h-4" />;
    if (node.type === 'source') {
      return (
        <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
          <ellipse cx="14" cy="7" rx="10" ry="3.5" fill="#D4FF3A" stroke="#0A0F1F" strokeWidth="1.75" />
          <path d="M4 7v6c0 1.93 4.48 3.5 10 3.5s10-1.57 10-3.5V7" stroke="#0A0F1F" strokeWidth="1.75" fill="none" />
          <path d="M4 13v6c0 1.93 4.48 3.5 10 3.5s10-1.57 10-3.5v-6" stroke="#0A0F1F" strokeWidth="1.75" fill="none" />
          <circle cx="9" cy="13" r="1.5" fill="#127A52" />
          <circle cx="14" cy="13" r="1.5" fill="#127A52" />
          <circle cx="19" cy="13" r="1.5" fill="#127A52" />
        </svg>
      );
    }
    if (node.type === 'rules') return <Sparkles className="w-4 h-4 text-[#2D55F5]" />;
    if (node.type === 'conditional') {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D55F5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="6" r="3" />
          <circle cx="18" cy="18" r="3" />
          <path d="M18 9v3a6 6 0 0 1-6 6H9" />
        </svg>
      );
    }
    if (node.type === 'hitl') return <GitBranch className="w-4 h-4 text-[#C06815]" />;
    if (node.type === 'router') return <Zap className="w-4 h-4 fill-current text-[#127A52]" />;
    if (node.type === 'target') {
      return (
        <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
          <ellipse cx="14" cy="7" rx="10" ry="3.5" fill="#EEF2FF" stroke="#2D55F5" strokeWidth="1.75" />
          <path d="M4 7v6c0 1.93 4.48 3.5 10 3.5s10-1.57 10-3.5V7" stroke="#2D55F5" strokeWidth="1.75" fill="none" />
          <path d="M4 13v6c0 1.93 4.48 3.5 10 3.5s10-1.57 10-3.5v-6" stroke="#2D55F5" strokeWidth="1.75" fill="none" />
        </svg>
      );
    }
    if (node.type === 'quarantine') return <Inbox className="w-4 h-4 text-[#C06815]" />;
    return <Database className="w-4 h-4" />;
  };

  return (
    <div className="relative w-full h-full min-h-0 bg-[#F8FAFC] select-none flex flex-col">
      {/* 1. Full-Width Sub-Header Bar matching 02.1 Visual canvas · SAP clean core template.png */}
      <div className="w-full bg-white dark:bg-[#18181C] border-b border-[#E3E6EE] dark:border-white/[0.08] px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 z-20">
        {/* Left: Back button + Title + Status Pill + Subtitle */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigateTo('workflows')}
            className="w-8 h-8 rounded-full border border-[#E3E6EE] dark:border-white/[0.08] bg-white dark:bg-[#18181C] hover:bg-[#F5F6FA] dark:hover:bg-white/[0.05] text-[#474E61] dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Back to workflows"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-[#0A0F1F] dark:text-white truncate">
                {activeWorkflowMeta?.name || activeThread?.name || 'SAP BW → S/4HANA Clean Core'}
              </h2>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isExecutingDryRun
                  ? 'bg-blue-50 text-[#2D55F5] border border-blue-200'
                  : executionSummary
                    ? 'bg-emerald-50 text-[#127A52] border border-emerald-200'
                    : 'bg-emerald-50 text-[#127A52] border border-emerald-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isExecutingDryRun ? 'bg-[#2D55F5] animate-ping' : 'bg-[#127A52]'
                }`} />
                {isExecutingDryRun ? 'Running' : executionSummary ? 'Dry run passed' : 'Ready'}
              </span>
            </div>

            <span className="text-[11px] text-[#8E95A9] dark:text-slate-500 font-medium truncate mt-0.5">
              {nodes.length} nodes · {activeRules?.length || 5} active rules · auto-saved just now
            </span>
          </div>
        </div>

        {/* Right: Template Picker + Save + Test in sandbox + Run live */}
        <div className="flex items-center gap-2.5">
          {/* Template Dropdown matching 02.11 Template catalog.png */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsTemplatesDropdownOpen(!isTemplatesDropdownOpen)}
              className="px-3.5 py-2 rounded-full border border-[#CDD2DE] dark:border-white/[0.12] bg-white dark:bg-[#18181C] hover:bg-[#F8FAFC] dark:hover:bg-white/[0.04] text-xs font-semibold text-[#0A0F1F] dark:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <span>Template · {activeWorkflowMeta?.templateName || 'SAP Clean Core'}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isTemplatesDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isTemplatesDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-[420px] max-w-[95vw] bg-white dark:bg-[#18181C] border border-[#E2E8F0] dark:border-white/[0.1] rounded-[22px] shadow-2xl overflow-hidden z-50 flex flex-col font-sans animate-in fade-in zoom-in-95 duration-150">
                <div className="p-4 px-5 border-b border-[#F1F3F7] dark:border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[#0A0F1F] dark:text-white">Enterprise catalog</h4>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-white/10 text-[#5F6678] dark:text-slate-400">
                      {Object.keys(TEMPLATE_AUTOFILLS).length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNodes([]);
                      setEdges([]);
                      setIsTemplatesDropdownOpen(false);
                    }}
                    className="text-xs font-semibold text-[#5F6678] hover:text-[#0A0F1F] dark:hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>+ Empty canvas</span>
                  </button>
                </div>

                <div className="max-h-[380px] overflow-y-auto divide-y divide-[#F1F3F7] dark:divide-white/[0.06]">
                  {Object.entries(TEMPLATE_AUTOFILLS).map(([key, template], idx) => {
                    const isSelected = (defaultTemplateKey === key) || (activeThread?.name && activeThread.name.includes(template.name.split(' ')[0]));
                    const tier = idx < 2 ? 'T1' : idx < 5 ? 'T2' : idx < 8 ? 'T3' : 'T4';
                    return (
                      <div
                        key={key}
                        onClick={() => {
                          handleAutofillTemplate(key);
                          setIsTemplatesDropdownOpen(false);
                        }}
                        className={`p-3 px-5 flex items-center justify-between gap-3 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.04] ${
                          isSelected ? 'bg-[#F0F5FF]/60 dark:bg-[#2D55F5]/10' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-[11px] font-mono font-bold text-[#5F6678] dark:text-slate-400 flex items-center justify-center shrink-0">
                            {tier}
                          </span>
                          <div className="min-w-0">
                            <h5 className={`text-xs font-semibold truncate ${isSelected ? 'text-[#2D55F5]' : 'text-[#0A0F1F] dark:text-white'}`}>
                              {template.name}
                            </h5>
                            <p className="text-[11px] text-[#5F6678] dark:text-slate-400 truncate mt-0.5">
                              {template.category} · {template.nodes?.length || 7} nodes
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-[#2D55F5] shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 px-5 border-t border-[#F1F3F7] dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] text-[11px] text-[#8C93A3]">
                  Showing {Object.keys(TEMPLATE_AUTOFILLS).length} of {Object.keys(TEMPLATE_AUTOFILLS).length} · scroll for more
                </div>
              </div>
            )}
          </div>

          {/* Save Workflow */}
          <button
            type="button"
            onClick={handleSaveWorkflow}
            disabled={isSavingWorkflow}
            className={`px-3.5 py-2 rounded-full border text-xs font-semibold shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 ${
              saveSuccess
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-white dark:bg-[#18181C] hover:bg-slate-50 dark:hover:bg-white/[0.04] border-[#CDD2DE] dark:border-white/[0.12] text-[#0A0F1F] dark:text-white'
            }`}
            title="Save workflow"
          >
            <Save className="w-3.5 h-3.5 text-[#5F6678]" />
            <span>{isSavingWorkflow ? 'Saving...' : saveSuccess ? 'Saved' : 'Save'}</span>
          </button>

          {/* Enhancement 6.3: Pre-flight check trigger button */}
          <button
            type="button"
            onClick={() => setIsPreflightOpen(true)}
            className={`px-3.5 py-2 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
              preflightHasBlocking
                ? 'border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800'
                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
            }`}
            title="Pre-flight validation check"
          >
            <ShieldAlert className={`w-3.5 h-3.5 ${preflightHasBlocking ? 'text-rose-600' : 'text-slate-500'}`} />
            <span>Pre-flight</span>
            {preflightHasBlocking && (
              <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold">
                1
              </span>
            )}
          </button>

          {/* Test in sandbox button */}
          <button
            type="button"
            onClick={handleDryRun}
            disabled={isExecutingDryRun || nodes.length === 0}
            className="px-4 py-2 rounded-full border border-[#CDD2DE] dark:border-white/[0.15] bg-white dark:bg-[#18181C] hover:bg-[#F8FAFC] dark:hover:bg-white/[0.04] text-xs font-semibold text-[#0A0F1F] dark:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-40"
          >
            <FlaskConical className={`w-3.5 h-3.5 ${isExecutingDryRun ? 'animate-bounce text-[#2D55F5]' : 'text-[#5F6678]'}`} />
            <span>{isExecutingDryRun ? 'Testing...' : 'Test in sandbox'}</span>
          </button>

          {/* Run live CTA */}
          <button
            type="button"
            onClick={handleLiveRun}
            disabled={isExecutingLiveRun || nodes.length === 0}
            className="px-5 py-2 rounded-full bg-[#2D55F5] hover:bg-[#1E44D6] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run live</span>
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
        {/* Floating Top-Left Helper Pill or Trace Banner (Matching Main-5.png) */}
        {traceRecordId ? (
          <div className="absolute top-4 left-6 z-30 pointer-events-auto font-sans flex items-center gap-2.5 bg-[#0A0F1F] text-white px-3.5 py-1.5 rounded-full shadow-xl">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-semibold">Tracing #{traceRecordId}</span>
            <button
              type="button"
              onClick={handleExitTrace}
              className="ml-2 text-[11px] text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-0.5 rounded-full transition-colors cursor-pointer"
            >
              Exit trace
            </button>
          </div>
        ) : (
          <div className="absolute top-4 left-6 z-20 pointer-events-none font-sans">
            {nodes.length === 0 ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-[#18181C]/95 backdrop-blur-md border border-[#E2E8F0] dark:border-white/[0.1] shadow-xs text-xs text-[#5F6678] dark:text-slate-300">
                <span>ⓘ This workflow has no nodes yet.</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-[#18181C]/95 backdrop-blur-md border border-[#E2E8F0] dark:border-white/[0.1] shadow-xs text-xs text-[#5F6678] dark:text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-[#2D55F5]" />
                <span>Click a node to configure it. Drag ports to rewire.</span>
              </div>
            )}
          </div>
        )}

        {/* Enhancement N6: Top Alert Banner (Needs setup) */}
        {aiAddedBanner?.show && (
          <div className="absolute top-4 inset-x-8 z-30 pointer-events-auto flex items-center justify-between px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-300 shadow-lg text-xs animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2.5 text-amber-900 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>{aiAddedBanner.message}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const targetNode = nodes.find(n => n.id === aiAddedBanner.targetNodeId) || nodes.find(n => n.type === 'target');
                  if (targetNode) openNodeSettings(targetNode);
                }}
                className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
              >
                Configure target →
              </button>
              <button
                onClick={() => setAiAddedBanner(null)}
                className="p-1 text-amber-700 hover:text-amber-950 rounded hover:bg-amber-100 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Enhancement N1: Empty Canvas Start Options Card */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-6 pointer-events-none">
            <div className="w-full max-w-xl bg-white/95 dark:bg-[#18181C]/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-white/[0.12] shadow-2xl p-8 pointer-events-auto text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 flex items-center justify-center text-[#2D55F5] mb-4 shadow-sm">
                <Sparkles className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Start building your workflow
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-md">
                Choose how you would like to construct this data pipeline. You can use our AI assistant or assemble modular components manually.
              </p>

              {/* 2 Primary Options */}
              <div className="grid grid-cols-2 gap-4 w-full mt-6 text-left">
                {/* Option 1: Build with AI */}
                <button
                  onClick={() => setIsBuildWithAiOpen(true)}
                  className="p-4 rounded-xl border-2 border-blue-200 hover:border-[#2D55F5] bg-blue-50/40 hover:bg-blue-50/70 transition-all flex flex-col justify-between group cursor-pointer text-left"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                        <Sparkles className="w-4 h-4" />
                      </span>
                      <kbd className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-white border border-blue-200 text-blue-800 shadow-2xs">
                        A
                      </kbd>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#2D55F5]">
                      Build with AI
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      Describe what you need in plain English and let AI draft the architecture and rules.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#2D55F5] mt-3 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Start drafting →
                  </span>
                </button>

                {/* Option 2: Browse nodes */}
                <button
                  onClick={() => setIsAddNodeModalOpen(true)}
                  className="p-4 rounded-xl border-2 border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50/80 transition-all flex flex-col justify-between group cursor-pointer text-left"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
                        <Plus className="w-4 h-4" />
                      </span>
                      <kbd className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 border border-slate-200 text-slate-700 shadow-2xs">
                        N
                      </kbd>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#2D55F5]">
                      Browse nodes
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      Pick sources, transformations, AI rules, and targets from the node library.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-700 mt-3 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Open library →
                  </span>
                </button>
              </div>

              {/* Tertiary template link */}
              <button
                onClick={() => setIsTemplatesDropdownOpen(true)}
                className="mt-5 text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Or choose from domain templates</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Enhancement N6: Bottom Undo Bar */}
        {showUndoBar && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-xl bg-[#0A0F1F] text-white shadow-2xl text-xs animate-in slide-in-from-bottom duration-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Added nodes via AI assistant.</span>
            <button
              onClick={handleUndoAiDraft}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 underline cursor-pointer ml-1"
            >
              Undo
            </button>
            <button
              onClick={() => setShowUndoBar(false)}
              className="text-slate-400 hover:text-white p-0.5 cursor-pointer ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
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
              const startX = fromNode.x + (fromNode.width || 250);
              const startY = fromNode.y + 70;
              const endX = toNode.x;
              const endY = toNode.y + 70;
              const dx = Math.abs(endX - startX) * 0.5;
              const pathD = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;
              const isSelected = selectedEdgeId === edge.id;
              
              const isQuarantineEdge = toNode.type === 'quarantine' || toNode.id === 'node-quarantine';
              const isConditionalEdge = fromNode.type === 'conditional' || fromNode.id === 'node-conditional';
              const isTrueBranch = isConditionalEdge && (toNode.type === 'hitl' || toNode.id === 'node-hitl' || edge.label?.includes('TRUE') || edge.label?.includes('High'));
              const isFalseBranch = isConditionalEdge && (toNode.type === 'router' || toNode.id === 'node-router' || edge.label?.includes('FALSE') || edge.label?.includes('Routine'));

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
                    stroke={isQuarantineEdge ? '#CBD5E1' : '#3B82F6'}
                    strokeWidth={isSelected ? 3 : 2}
                    strokeDasharray={isQuarantineEdge ? '4 4' : 'none'}
                    strokeLinecap="round"
                    onClick={() => setSelectedEdgeId(edge.id)}
                  />

                  {/* Branch TRUE pill */}
                  {isTrueBranch && (
                    <g transform={`translate(${startX + 28}, ${startY - 14})`} className="pointer-events-none">
                      <rect width="36" height="18" rx="9" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                      <text x="18" y="12.5" textAnchor="middle" fill="#5F6678" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                        TRUE
                      </text>
                    </g>
                  )}

                  {/* Branch FALSE pill */}
                  {isFalseBranch && (
                    <g transform={`translate(${startX + 28}, ${startY + 2})`} className="pointer-events-none">
                      <rect width="40" height="18" rx="9" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                      <text x="20" y="12.5" textAnchor="middle" fill="#5F6678" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                        FALSE
                      </text>
                    </g>
                  )}

                  {/* Dynamic row counts badge on edges after dry run */}
                  {executionSummary && (edge.from === 'node-source' || fromNode.type === 'source') && (edge.to === 'node-rules' || toNode.type === 'rules') && (
                    <g transform={`translate(${midX - 24}, ${midY - 10})`} className="pointer-events-none">
                      <rect width="48" height="20" rx="10" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                      <text x="24" y="13.5" textAnchor="middle" fill="#0A0F1F" fontSize="10" fontWeight="bold" fontFamily="monospace">
                        {executionSummary.total?.toLocaleString() || '1,420'}
                      </text>
                    </g>
                  )}
                  {executionSummary && (edge.from === 'node-rules' || fromNode.type === 'rules') && (edge.to === 'node-conditional' || toNode.type === 'conditional') && (
                    <g transform={`translate(${midX - 24}, ${midY - 10})`} className="pointer-events-none">
                      <rect width="48" height="20" rx="10" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                      <text x="24" y="13.5" textAnchor="middle" fill="#0A0F1F" fontSize="10" fontWeight="bold" fontFamily="monospace">
                        {executionSummary.clean?.toLocaleString() || '1,267'}
                      </text>
                    </g>
                  )}

                  {/* Enhancement 6.4: Insert node button at edge midpoint */}
                  <g
                    transform={`translate(${midX}, ${midY})`}
                    className="cursor-pointer group/insert"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveEdgeForInsert(edge);
                      setIsEdgeInsertMenuOpen(true);
                    }}
                  >
                    <circle
                      cx="0"
                      cy="0"
                      r="11"
                      fill="#FFFFFF"
                      stroke="#2D55F5"
                      strokeWidth="2"
                      className="hover:scale-125 transition-transform"
                    />
                    <line x1="0" y1="-5" x2="0" y2="5" stroke="#2D55F5" strokeWidth="2" strokeLinecap="round" />
                    <line x1="-5" y1="0" x2="5" y2="0" stroke="#2D55F5" strokeWidth="2" strokeLinecap="round" />
                  </g>

                  {isSelected && (
                    <g transform={`translate(${midX + 22}, ${midY - 10})`} onClick={() => handleDeleteEdge(edge.id)}>
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
              RENDER OPERATIONAL NODES WITH PORTS (Matching Figma 02.1 & 02.14)
             ========================================================================= */}
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isStageActive =
              (activeStageNodeId === node.id) ||
              (activeStageNodeId === 'committing' && (node.type === 'target' || node.type === 'quarantine'));
            const nodeIndex = nodes.findIndex(n => n.id === node.id) + 1;

            const categoryLabel =
              node.type === 'source' ? 'Source' :
              node.type === 'rules' ? 'AI rules' :
              node.type === 'conditional' ? 'Router' :
              node.type === 'hitl' ? 'Review' :
              node.type === 'router' ? 'Split' :
              node.type === 'target' ? 'Target' :
              node.type === 'quarantine' ? 'DLQ' :
              node.type === 'vector_matcher' ? 'Intelligence' :
              node.type === 'rag' ? 'Enrichment' :
              node.type === 'pinecone' ? 'Vector store' :
              node.type === 'bigquery' ? 'Warehouse' : 'Node';

            // Status Badge text and styling
            let statusText = node.status || 'Ready';
            let statusBadgeClass = 'bg-[#EBF0FF] text-[#2D55F5] border-[#2D55F5]/20 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/50';
            let dotClass = 'bg-[#2D55F5]';

            if (isStageActive) {
              statusText = 'Running...';
              statusBadgeClass = 'bg-[#EBF0FF] text-[#2D55F5] border-[#2D55F5]/30 animate-pulse';
              dotClass = 'bg-[#2D55F5] animate-ping';
            } else if (dagNodeExecutions[node.id] || executionSummary) {
              if (node.type === 'hitl') {
                statusText = 'Paused';
                statusBadgeClass = 'bg-[#FEF6EE] text-[#B54708] border-[#FDB022]/40 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50';
                dotClass = 'bg-[#F79009]';
              } else {
                statusText = 'Done';
                statusBadgeClass = 'bg-[#ECFDF3] text-[#027A48] border-[#6CE9A6]/40 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50';
                dotClass = 'bg-[#12B76A]';
              }
            } else {
              if (node.type === 'source') {
                statusText = node.isLive ? 'Live' : 'Demo';
                statusBadgeClass = node.isLive
                  ? 'bg-[#ECFDF3] text-[#027A48] border-[#6CE9A6]/40'
                  : 'bg-[#FEF6EE] text-[#B54708] border-[#FDB022]/40 dark:bg-amber-950/40 dark:text-amber-400';
                dotClass = node.isLive ? 'bg-[#12B76A]' : 'bg-[#F79009]';
              } else if (node.type === 'rules') {
                statusText = 'Auto-fix';
                statusBadgeClass = 'bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]/50';
                dotClass = 'bg-[#2D55F5]';
              } else if (node.type === 'conditional' || node.type === 'router') {
                statusText = 'Active';
                statusBadgeClass = 'bg-[#ECFDF3] text-[#027A48] border-[#6CE9A6]/40';
                dotClass = 'bg-[#12B76A]';
              } else if (node.type === 'hitl') {
                statusText = 'Armed';
                statusBadgeClass = 'bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]/50';
                dotClass = 'bg-[#2D55F5]';
              } else if (node.type === 'target') {
                statusText = 'Ready';
                statusBadgeClass = 'bg-[#F8FAFC] text-[#344054] border-[#D0D5DD] dark:bg-slate-800 dark:text-slate-300';
                dotClass = 'bg-[#667085]';
              } else if (node.type === 'quarantine') {
                statusText = 'Locked';
                statusBadgeClass = 'bg-[#F8FAFC] text-[#344054] border-[#D0D5DD] dark:bg-slate-800 dark:text-slate-300';
                dotClass = 'bg-[#667085]';
              }
            }

            // Subtitle text
            const subtitleText =
              node.type === 'source' ? (node.system || 'InfoCube · HANA Cloud') :
              node.type === 'rules' ? 'Clean core ontologies' :
              node.type === 'conditional' ? `${conditionField || 'TOTAL_AMOUNT'} ${conditionOp || '>'} ${conditionVal || '50,000'}` :
              node.type === 'hitl' ? (hitlReviewerRole || 'Procurement controller') :
              node.type === 'router' ? 'Clean · Fixed · Quarantined' :
              node.type === 'target' ? (node.system || 'Clean core') :
              node.type === 'quarantine' ? 'Dead-letter isolation' :
              (node.system || 'Configured node');

            // Specs Row (Bottom of card)
            let specLeft = `Table: ${node.table || '0PUR_C01'}`;
            let specRight = `Rows: ${(dagNodeExecutions[node.id]?.rowsOut || executionSummary?.total || 1420).toLocaleString()}`;

            if (node.type === 'source') {
              specLeft = `Table: ${node.table || '0PUR_C01'}`;
              specRight = executionSummary
                ? `Out ${(executionSummary.total || 1420).toLocaleString()}`
                : `Rows: ${(node.rowCount || 1420).toLocaleString()}`;
            } else if (node.type === 'rules') {
              specLeft = `Rules: ${activeRules?.length || 5} active`;
              specRight = executionSummary
                ? `Pass / held ${((executionSummary.clean || 0) + (executionSummary.fixed || 0)).toLocaleString()} / ${(executionSummary.quarantined || 0).toLocaleString()}`
                : `Model: ${node.aiModel || 'gpt-5-mini'}`;
            } else if (node.type === 'conditional') {
              specLeft = 'Paths: TRUE · FALSE';
              specRight = executionSummary
                ? 'TRUE / FALSE 111 / 1,156'
                : 'Condition active';
            } else if (node.type === 'hitl') {
              specLeft = `SLA: ${hitlSlaTimeout || 8} h`;
              specRight = executionSummary
                ? 'Awaiting sign-off'
                : 'Role: Controller';
            } else if (node.type === 'router') {
              specLeft = 'Health gate: 90%';
              specRight = executionSummary
                ? `Clean / fixed ${(executionSummary.clean || 0).toLocaleString()} / ${(executionSummary.fixed || 0).toLocaleString()}`
                : '3-way split';
            } else if (node.type === 'target') {
              specLeft = `Table: ${node.table || '0PUR_C01_clean'}`;
              specRight = executionSummary
                ? `Staged ${(executionSummary.clean || 0).toLocaleString()}`
                : 'Write: Append';
            } else if (node.type === 'quarantine') {
              specLeft = `Table: ${node.table || '0PUR_C01_quarantine'}`;
              specRight = executionSummary
                ? `Held ${(executionSummary.quarantined || 0).toLocaleString()}`
                : 'Isolation: Active';
            }

            return (
              <div
                key={node.id}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  handleNodeClick(e, node);
                  openNodeSettings(node);
                }}
                style={{
                  transform: `translate(${node.x}px, ${node.y}px)`,
                  width: node.width || 280,
                  position: 'absolute',
                  zIndex: isStageActive ? 35 : isSelected ? 30 : 20
                }}
                className={`workflow-node-card relative group bg-white dark:bg-[#18181C] rounded-2xl border transition-all select-none p-4 ${
                  activeTool === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                } ${
                  traceRecordId && (node.type === 'hitl' || node.type === 'target')
                    ? 'opacity-35 pointer-events-none border-[#CDD2DE]'
                    : traceRecordId && node.type === 'rules'
                      ? 'border-2 border-rose-500 ring-4 ring-rose-500/20 shadow-xl'
                      : traceRecordId
                        ? 'border-[#2D55F5] ring-2 ring-blue-500/20 shadow-lg'
                        : node.isBlocked || (preflightHasBlocking && (node.type === 'target' || (node.title || '').includes('PostgreSQL')))
                          ? 'border-2 border-rose-600 bg-white shadow-lg'
                          : node.needsSetup
                            ? 'border-2 border-amber-600 bg-white shadow-md'
                            : node.isSuggested
                              ? 'border-2 border-dashed border-[#2D55F5] bg-white shadow-sm'
                              : node.isRejected
                                ? 'border-dashed border-slate-300 bg-white opacity-40 select-none'
                                : isStageActive
                                  ? 'border-[#2D55F5] ring-4 ring-[#2D55F5]/30 shadow-xl scale-[1.02]'
                                  : isSelected
                                    ? 'border-[#2D55F5] ring-3 ring-[#2D55F5]/25 shadow-xl'
                                    : 'border-[#CDD2DE] dark:border-white/[0.12] hover:border-[#2D55F5]/60 hover:shadow-lg shadow-sm'
                }`}
              >
                {/* 1. INPUT PORT (Left Side) */}
                {node.type !== 'source' && (
                  <div
                    onMouseUp={(e) => handleCompleteEdge(e, node.id)}
                    className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white dark:bg-[#18181C] border-2 border-slate-300 dark:border-slate-600 group-hover:border-[#2D55F5] flex items-center justify-center hover:scale-125 transition-all cursor-crosshair z-30 shadow-xs"
                    title="Drop to connect edge here"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 group-hover:bg-[#2D55F5]" />
                  </div>
                )}

                {/* 2. OUTPUT PORT(S) — Conditional gets TRUE+FALSE ports; others get a single port */}
                {node.type === 'conditional' ? (
                  <div className="absolute -right-14 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-30">
                    <div
                      onMouseDown={(e) => handleStartEdge(e, node.id)}
                      className="flex items-center gap-1 cursor-crosshair group/port"
                      title="TRUE path — drag to connect"
                    >
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-1 py-0.5 rounded select-none">TRUE</span>
                      <div className="w-5 h-5 rounded-full bg-white dark:bg-[#18181C] border-2 border-emerald-500 group-hover/port:border-emerald-600 flex items-center justify-center hover:scale-125 transition-transform shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      </div>
                    </div>
                    <div
                      onMouseDown={(e) => handleStartEdge(e, node.id)}
                      className="flex items-center gap-1 cursor-crosshair group/port"
                      title="FALSE path — drag to connect"
                    >
                      <span className="text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-300 px-1 py-0.5 rounded select-none">FALSE</span>
                      <div className="w-5 h-5 rounded-full bg-white dark:bg-[#18181C] border-2 border-slate-400 group-hover/port:border-slate-600 flex items-center justify-center hover:scale-125 transition-transform shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                      </div>
                    </div>
                  </div>
                ) : node.type !== 'quarantine' && node.type !== 'target' ? (
                  <div
                    onMouseDown={(e) => handleStartEdge(e, node.id)}
                    className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white dark:bg-[#18181C] border-2 border-slate-300 dark:border-slate-600 group-hover:border-[#2D55F5] flex items-center justify-center hover:scale-125 transition-all cursor-crosshair z-30 shadow-xs"
                    title="Drag to connect to another node"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 group-hover:bg-[#2D55F5]" />
                  </div>
                ) : null}

                {/* Card Top Row: Circular Index + Category Label + Status Pill + Settings Button */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-100 dark:bg-white/[0.08] text-[10px] font-bold text-[#5F6678] dark:text-slate-400 flex items-center justify-center">
                      {nodeIndex}
                    </span>
                    <span className="text-[10px] font-bold text-[#5F6678] dark:text-slate-400 uppercase tracking-wider">
                      {categoryLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {node.isBlocked || (preflightHasBlocking && (node.type === 'target' || (node.title || '').includes('PostgreSQL'))) ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-rose-50 text-rose-700 border-rose-200/80 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        Blocked by pre-flight
                      </span>
                    ) : node.needsSetup ? (
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-amber-50 text-amber-800 border-amber-200/80 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Needs setup
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openNodeSettings(node);
                          }}
                          className="px-2 py-0.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-semibold flex items-center gap-0.5 shadow-xs transition-colors cursor-pointer"
                        >
                          Set write mode →
                        </button>
                      </div>
                    ) : node.isSuggested ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-blue-50 text-blue-700 border-blue-200/80 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2D55F5]" />
                        Suggested by AI
                      </span>
                    ) : node.isRejected ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-100 text-slate-500 border-slate-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        Rejected
                      </span>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 ${statusBadgeClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                        {statusText}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openNodeSettings(node);
                      }}
                      className="w-6 h-6 rounded-lg text-slate-400 hover:text-[#2D55F5] hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-transparent hover:border-blue-200 dark:hover:border-blue-800/40 flex items-center justify-center transition-all cursor-pointer"
                      title="Configure node properties"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card Middle Row: Squircle Icon + Title + Subtitle */}
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                    node.type === 'source' ? 'bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]' :
                    node.type === 'rules' ? 'bg-[#F9F5FF] text-[#6941C6] border-[#D6BBFB]' :
                    node.type === 'conditional' ? 'bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]' :
                    node.type === 'hitl' ? 'bg-[#FEF6EE] text-[#B54708] border-[#FDB022]' :
                    node.type === 'router' ? 'bg-[#F4EBFF] text-[#7C3AED] border-[#D6BBFB]' :
                    node.type === 'target' ? 'bg-[#ECFDF3] text-[#027A48] border-[#6CE9A6]' :
                    node.type === 'quarantine' ? 'bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]' :
                    'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {node.type === 'source' ? <Database className="w-4 h-4" /> :
                     node.type === 'rules' ? <Sparkles className="w-4 h-4" /> :
                     node.type === 'conditional' ? <GitBranch className="w-4 h-4" /> :
                     node.type === 'hitl' ? <UserCheck className="w-4 h-4" /> :
                     node.type === 'router' ? <Layers className="w-4 h-4" /> :
                     node.type === 'target' ? <CheckCircle2 className="w-4 h-4" /> :
                     node.type === 'quarantine' ? <AlertTriangle className="w-4 h-4" /> :
                     <Database className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-[#0F172A] dark:text-white leading-tight truncate">
                      {node.title}
                    </h4>
                    <p className="text-xs text-[#5F6678] dark:text-slate-400 truncate mt-0.5 font-medium">
                      {subtitleText}
                    </p>
                  </div>
                </div>

                {/* Card Specs Bottom Divider & Spec Line */}
                <div className="border-t border-[#F1F3F7] dark:border-white/[0.06] pt-2.5 mt-3 flex items-center justify-between text-[11px] text-[#5F6678] dark:text-slate-400 font-mono">
                  <span className="truncate max-w-[150px]">{specLeft}</span>
                  <span className="font-semibold text-[#0F172A] dark:text-slate-300 shrink-0">{specRight}</span>
                </div>

                {/* Quarantine Trace Record Pills (Matching Main-5.png) */}
                {traceRecordId && (
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap z-30 pointer-events-none">
                    {node.type === 'source' && (
                      <span className="bg-[#0A0F1F] text-white text-[11px] font-mono px-3 py-1 rounded-full shadow-md">
                        QUANTITY = -20
                      </span>
                    )}
                    {node.type === 'rules' && (
                      <span className="bg-rose-600 text-white text-[11px] font-semibold px-3 py-1 rounded-full shadow-md">
                        Positive quantity · failed
                      </span>
                    )}
                    {node.type === 'conditional' && (
                      <span className="bg-[#0A0F1F] text-white text-[11px] font-semibold px-3 py-1 rounded-full shadow-md">
                        FALSE path
                      </span>
                    )}
                    {node.type === 'router' && (
                      <span className="bg-[#0A0F1F] text-white text-[11px] font-semibold px-3 py-1 rounded-full shadow-md">
                        Quarantined
                      </span>
                    )}
                    {node.type === 'quarantine' && (
                      <span className="bg-[#0A0F1F] text-white text-[11px] font-mono px-3 py-1 rounded-full shadow-md">
                        Stored 10:35:51
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Trace Dock (Matching Main-5.png) or Floating Bottom Toolbar Dock (Matching Figma 02.1) */}
      {traceRecordId ? (
        <div className="absolute bottom-4 inset-x-4 sm:inset-x-6 z-40 bg-white/98 dark:bg-[#18181C]/98 backdrop-blur-md rounded-2xl border border-[#CDD2DE] dark:border-white/[0.12] shadow-2xl p-4 sm:p-5 flex flex-col gap-3 font-sans animate-in slide-in-from-bottom duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-bold text-[#0A0F1F] dark:text-white">
                Path of #{traceRecordId}
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Critical
              </span>
              <span className="text-xs text-[#5F6678] dark:text-slate-400">
                5 of 7 nodes · failed at step 2
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigateTo('quarantine')}
                className="px-3.5 py-1.5 rounded-full border border-[#CDD2DE] dark:border-white/[0.12] bg-white dark:bg-[#18181C] hover:bg-[#F8FAFC] text-xs font-semibold text-[#0A0F1F] dark:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#5F6678]" />
                <span>Back to quarantine</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveRuleForImpact({
                    id: 'rule_gl_format',
                    name: 'GL Account Format',
                    field: 'gl_account',
                    severity: 'High',
                    action: 'Quarantine',
                    expression: "length(gl_account) == 8 AND gl_account != null",
                  });
                  setIsRuleImpactModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-full border border-[#CDD2DE] dark:border-white/[0.12] bg-white dark:bg-[#18181C] hover:bg-[#F8FAFC] text-xs font-semibold text-[#0A0F1F] dark:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <PenTool className="w-3.5 h-3.5 text-[#5F6678]" />
                <span>Edit rule</span>
              </button>
              <button
                type="button"
                onClick={handleDryRun}
                className="px-4 py-1.5 rounded-full bg-[#2D55F5] hover:bg-blue-600 text-xs font-semibold text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Replay row in sandbox</span>
              </button>
            </div>
          </div>

          {/* 5 Step Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-1">
            {/* 1. Source */}
            <div className="bg-[#F8FAFC] dark:bg-white/[0.03] border border-[#E2E8F0] dark:border-white/[0.08] rounded-xl p-3 flex flex-col justify-between text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[#0A0F1F] dark:text-white flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">1</span>
                    Source
                  </span>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="text-[#344054] dark:text-slate-300 font-medium text-[11px]">Read from 0PUR_C01</div>
              </div>
              <div className="text-[10px] text-[#5F6678] dark:text-slate-400 font-mono mt-2">
                QUANTITY -20 · UNIT_PRICE 12.40
              </div>
            </div>

            {/* 2. AI rules */}
            <div className="bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl p-3 flex flex-col justify-between text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-rose-950 dark:text-rose-200 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">2</span>
                    AI rules
                  </span>
                  <X className="w-3.5 h-3.5 text-rose-600" />
                </div>
                <div className="text-rose-800 dark:text-rose-300 font-medium text-[11px]">Positive quantity failed</div>
              </div>
              <div className="text-[10px] text-rose-700 dark:text-rose-400 font-mono mt-2">
                QUANTITY &gt; 0 · got -20 · no safe auto-fix
              </div>
            </div>

            {/* 3. Router */}
            <div className="bg-[#F8FAFC] dark:bg-white/[0.03] border border-[#E2E8F0] dark:border-white/[0.08] rounded-xl p-3 flex flex-col justify-between text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[#0A0F1F] dark:text-white flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">3</span>
                    Router
                  </span>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="text-[#344054] dark:text-slate-300 font-medium text-[11px]">TOTAL_AMOUNT ≤ 50,000</div>
              </div>
              <div className="text-[10px] text-[#5F6678] dark:text-slate-400 font-mono mt-2">
                Took the FALSE path
              </div>
            </div>

            {/* 4. Split */}
            <div className="bg-[#F8FAFC] dark:bg-white/[0.03] border border-[#E2E8F0] dark:border-white/[0.08] rounded-xl p-3 flex flex-col justify-between text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[#0A0F1F] dark:text-white flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">4</span>
                    Split
                  </span>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="text-[#344054] dark:text-slate-300 font-medium text-[11px]">Health gate</div>
              </div>
              <div className="text-[10px] text-[#5F6678] dark:text-slate-400 font-mono mt-2">
                Marked Quarantined
              </div>
            </div>

            {/* 5. DLQ */}
            <div className="bg-[#F8FAFC] dark:bg-white/[0.03] border border-[#E2E8F0] dark:border-white/[0.08] rounded-xl p-3 flex flex-col justify-between text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[#0A0F1F] dark:text-white flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">5</span>
                    DLQ
                  </span>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="text-[#344054] dark:text-slate-300 font-medium text-[11px]">Quarantine store</div>
              </div>
              <div className="text-[10px] text-[#5F6678] dark:text-slate-400 font-mono mt-2">
                Stored with rule and value
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="absolute bottom-4 inset-x-4 sm:inset-x-6 flex items-center justify-between pointer-events-none z-30">
        {/* Left: Zoom Controls Pill */}
        <div className="pointer-events-auto bg-white/95 dark:bg-[#18181C]/95 backdrop-blur-md rounded-2xl border border-[#CDD2DE] dark:border-white/[0.12] shadow-lg px-2.5 py-1.5 flex items-center gap-2 text-xs font-semibold text-[#0F172A] dark:text-white">
          <button
            onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.4))}
            className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-sm"
            title="Zoom out"
          >
            –
          </button>
          <span
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            className="font-mono text-xs px-1 cursor-pointer hover:text-[#2D55F5] transition-colors"
            title="Reset zoom to 100%"
          >
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(prev => Math.min(prev + 0.1, 2.0))}
            className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-sm"
            title="Zoom in"
          >
            +
          </button>
          <span className="h-3.5 w-px bg-slate-200 dark:bg-white/[0.12]" />
          <button
            onClick={handleFitToWindow}
            title="Fit canvas to window"
            className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg text-slate-500 hover:text-[#2D55F5] transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Center Floating Dock: Move | Pan | Fit | Add Node | Ask AI */}
        <div className="pointer-events-auto shrink-0 bg-white/95 dark:bg-[#18181C]/95 backdrop-blur-md rounded-2xl border border-[#CDD2DE] dark:border-white/[0.12] shadow-xl p-1.5 flex items-center gap-1">
          <button
            onClick={() => setActiveTool('move')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTool === 'move'
                ? 'bg-[#2D55F5] text-white shadow-sm'
                : 'text-[#0F172A] dark:text-slate-300 hover:bg-[#F1F3F7] dark:hover:bg-white/[0.06]'
            }`}
            title="Select & move nodes (V)"
          >
            <Move className="w-3.5 h-3.5" />
            <span>Move</span>
          </button>
          <button
            onClick={() => setActiveTool('pan')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTool === 'pan'
                ? 'bg-[#2D55F5] text-white shadow-sm'
                : 'text-[#0F172A] dark:text-slate-300 hover:bg-[#F1F3F7] dark:hover:bg-white/[0.06]'
            }`}
            title="Pan canvas (Space / H)"
          >
            <Hand className="w-3.5 h-3.5" />
            <span>Pan</span>
          </button>
          <span className="h-4 w-px bg-slate-200 dark:bg-white/[0.12] mx-1" />
          <button
            onClick={handleFitToWindow}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#0F172A] dark:text-slate-300 hover:bg-[#F1F3F7] dark:hover:bg-white/[0.06] transition-all cursor-pointer"
            title="Fit canvas (F)"
          >
            <Maximize2 className="w-3.5 h-3.5 text-[#2D55F5]" />
            <span>Fit</span>
          </button>
          {/* Enhancement 6.2: Add Node Menu with 3 options popup */}
          <div className="relative">
            <button
              onClick={() => setIsAddNodeMenuOpen(!isAddNodeMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#0F172A] dark:text-slate-300 hover:bg-[#F1F3F7] dark:hover:bg-white/[0.06] transition-all cursor-pointer"
              title="Add node (N)"
            >
              <Plus className="w-3.5 h-3.5 text-[#2D55F5]" />
              <span>Add node</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isAddNodeMenuOpen && (
              <div 
                className="absolute bottom-full mb-2 left-0 w-60 bg-white dark:bg-[#18181C] rounded-xl shadow-2xl border border-slate-200 dark:border-white/[0.12] p-1.5 z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    setIsAddNodeMenuOpen(false);
                    setIsBuildWithAiOpen(true);
                  }}
                  className="w-full text-left p-2 rounded-lg text-xs font-semibold text-slate-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center gap-2.5 group cursor-pointer transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2D55F5] flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                  </div>
                  <div>
                    <div>Build with AI</div>
                    <div className="text-[10px] text-slate-400 font-normal">Describe pipeline in plain English</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setIsAddNodeMenuOpen(false);
                    setIsAddNodeModalOpen(true);
                  }}
                  className="w-full text-left p-2 rounded-lg text-xs font-semibold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center gap-2.5 group cursor-pointer transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    <Plus className="w-4 h-4 text-[#2D55F5]" />
                  </div>
                  <div>
                    <div>Browse node library</div>
                    <div className="text-[10px] text-slate-400 font-normal">Sources, rules, transforms & sinks</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setIsAddNodeMenuOpen(false);
                    setIsTemplatesDropdownOpen(true);
                  }}
                  className="w-full text-left p-2 rounded-lg text-xs font-semibold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center gap-2.5 group cursor-pointer transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <Layers className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div>Insert from template</div>
                    <div className="text-[10px] text-slate-400 font-normal">Pre-configured industry pipelines</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsBuildWithAiOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#6D28D9] dark:text-[#C4B5FD] bg-[#F5F3FF] dark:bg-[#7C3AED]/20 hover:bg-[#EDE9FE] dark:hover:bg-[#7C3AED]/30 border border-[#DDD6FE] dark:border-[#7C3AED]/30 transition-all cursor-pointer shadow-xs"
            title="Ask AI (A)"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>Ask AI</span>
          </button>
        </div>

        {/* Right: Canvas Radar Mini-Map */}
        <div className="pointer-events-auto bg-white/95 dark:bg-[#18181C]/95 backdrop-blur-md rounded-2xl border border-[#CDD2DE] dark:border-white/[0.12] shadow-lg p-2.5 flex flex-col gap-1.5 text-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold text-[11px] text-[#0F172A] dark:text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#127A52] animate-pulse" />
              Canvas radar · {nodes.length} nodes
            </span>
            <span className="text-[10px] text-[#5F6678] dark:text-slate-400 font-mono">
              F to fit · Del to remove
            </span>
          </div>
          <div className="w-40 h-8 rounded-lg bg-[#F8FAFC] dark:bg-white/[0.03] border border-[#E2E8F0] dark:border-white/[0.06] relative overflow-hidden">
            {nodes.map(n => {
              const minX = 0, maxX = 2200;
              const minY = 0, maxY = 600;
              const dotX = Math.max(4, Math.min(152, ((n.x - minX) / (maxX - minX)) * 150));
              const dotY = Math.max(4, Math.min(28, ((n.y - minY) / (maxY - minY)) * 26));
              return (
                <div
                  key={`radar-${n.id}`}
                  style={{ left: `${dotX}px`, top: `${dotY}px` }}
                  className={`absolute w-1.5 h-1.5 rounded-full transform -translate-x-1/2 -translate-y-1/2 ${
                    selectedNodeId === n.id
                      ? 'bg-[#2D55F5] ring-2 ring-blue-400'
                      : n.type === 'quarantine'
                        ? 'bg-amber-500'
                        : n.type === 'target'
                          ? 'bg-emerald-500'
                          : 'bg-slate-400'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
      )}

      {/* =========================================================================
          EXECUTING PIPELINE BOTTOM DRAWER (Matching Figma 02.13 Sandbox run · Executing)
         ========================================================================= */}
      {isExecutingDryRun && (
        <div className="absolute bottom-4 left-6 right-6 z-40 bg-white/98 dark:bg-[#18181C]/98 backdrop-blur-md rounded-2xl border border-[#CDD2DE] dark:border-white/[0.12] shadow-2xl p-4 flex flex-col gap-3 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700/50 flex items-center justify-center text-[#2D55F5]">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-[#0F172A] dark:text-white">
                    Executing pipeline · stage {executionPhase === 'extracting' ? '1' : executionPhase === 'evaluating' ? '2' : executionPhase === 'routing' ? '3' : '4'} of 4
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
                    DuckDB in-memory simulation
                  </span>
                </div>
                <p className="text-xs text-[#5F6678] dark:text-slate-400">
                  Evaluating {executionProgress}% · 1,420 rows from {srcTable || '0PUR_C01'} with {activeRules?.length || 5} active business rules. Nothing written to destination.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-semibold text-[#5F6678] dark:text-slate-400">
                {(executionElapsedMs / 1000).toFixed(1)}s elapsed
              </span>
              <button
                onClick={() => {
                  setIsExecutingDryRun(false);
                  setActiveStageNodeId(null);
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.12] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-xs font-semibold text-[#5F6678] dark:text-slate-300 transition-colors cursor-pointer"
              >
                Cancel run
              </button>
            </div>
          </div>

          {/* 4 Execution Stages Progress */}
          <div className="grid grid-cols-4 gap-3 pt-2 border-t border-[#F1F3F7] dark:border-white/[0.06]">
            <div className={`p-2.5 rounded-xl border text-xs ${
              executionPhase !== 'idle' ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40' : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.06]'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[#0F172A] dark:text-white">1. Ingest</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <span className="text-[11px] text-[#5F6678] dark:text-slate-400">1,420 rows loaded</span>
            </div>
            <div className={`p-2.5 rounded-xl border text-xs ${
              executionPhase === 'evaluating' || executionPhase === 'routing' || executionPhase === 'committing' ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/40' : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.06]'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[#0F172A] dark:text-white">2. AI Rules AST</span>
                {executionPhase === 'evaluating' ? <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              </div>
              <span className="text-[11px] text-[#5F6678] dark:text-slate-400">5 rules validated</span>
            </div>
            <div className={`p-2.5 rounded-xl border text-xs ${
              executionPhase === 'routing' || executionPhase === 'committing' ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/40' : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.06]'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[#0F172A] dark:text-white">3. Routing</span>
                {executionPhase === 'routing' ? <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" /> : executionPhase === 'committing' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5 text-slate-400" />}
              </div>
              <span className="text-[11px] text-[#5F6678] dark:text-slate-400">Partition clean vs DLQ</span>
            </div>
            <div className={`p-2.5 rounded-xl border text-xs ${
              executionPhase === 'committing' ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/40' : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.06]'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-[#0F172A] dark:text-white">4. Consensus</span>
                {executionPhase === 'committing' ? <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" /> : <Clock className="w-3.5 h-3.5 text-slate-400" />}
              </div>
              <span className="text-[11px] text-[#5F6678] dark:text-slate-400">Telemetry & audit ledger</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          EXECUTION RESULTS COMPACT TOAST / BANNER
         ========================================================================= */}
      {executionSummary && !isExecutingDryRun && !isTelemetryDrawerOpen && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 bg-white/95 dark:bg-[#18181C]/95 backdrop-blur-md rounded-2xl border border-[#CDD2DE] dark:border-white/[0.12] shadow-2xl p-3.5 px-5 flex items-center gap-5 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-[#127A52] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#0F172A] dark:text-white">
                Dry Run Passed · {executionSummary.health}% health
              </h4>
              <p className="text-[11px] text-[#5F6678] dark:text-slate-400">
                {executionSummary.total?.toLocaleString()} rows evaluated ({executionSummary.clean?.toLocaleString()} clean · {executionSummary.quarantined?.toLocaleString()} DLQ)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTelemetryDrawerOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-[#2D55F5] hover:bg-[#1E40AF] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <span>View telemetry</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setExecutionSummary(null)}
              className="w-6 h-6 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
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
          NODE PROPERTIES SIDE DRAWER (Matching Figma 02.2–02.9)
         ========================================================================= */}
      {isPropertyModalOpen && selectedNode && (
        <div
          className="fixed top-0 right-0 h-full w-[500px] max-w-[95vw] bg-white dark:bg-[#18181C] border-l border-[#CDD2DE] dark:border-white/[0.12] shadow-2xl z-40 flex flex-col font-sans animate-in slide-in-from-right duration-200"
        >
          {/* Drawer Header */}
          <div className="px-6 py-4 border-b border-[#F1F3F7] dark:border-white/[0.06] flex items-center justify-between bg-white dark:bg-[#18181C] shrink-0">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border text-white ${selectedNode.variant === 'green' ? 'bg-[#127A52] border-emerald-600' :
                selectedNode.variant === 'orange' ? 'bg-amber-600 border-amber-700' :
                  selectedNode.variant === 'purple' ? 'bg-[#7C3AED] border-purple-700' :
                    selectedNode.variant === 'indigo' ? 'bg-indigo-600 border-indigo-700' :
                      'bg-[#2D55F5] border-blue-700'
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
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-[#5F6678] dark:text-slate-400 uppercase tracking-wider">
                    Node {nodes.findIndex(n => n.id === selectedNode.id) + 1} · {
                      selectedNode.type === 'source' ? 'Source' :
                      selectedNode.type === 'rules' ? 'AI Rules' :
                      selectedNode.type === 'conditional' ? 'Router' :
                      selectedNode.type === 'hitl' ? 'Review' :
                      selectedNode.type === 'router' ? 'Split' :
                      selectedNode.type === 'target' ? 'Target' :
                      selectedNode.type === 'quarantine' ? 'DLQ' : selectedNode.type
                    }
                  </span>
                  <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-[#EBF0FF] dark:bg-blue-950/50 text-[#2D55F5] border border-[#2D55F5]/20">
                    {selectedNode.status || 'Active'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#0F172A] dark:text-white">
                  {selectedNode.title || 'Configure Node'}
                </h3>
              </div>
            </div>
            <button
              onClick={() => setIsPropertyModalOpen(false)}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Properties Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
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
            {/* Drawer Actions Footer (Matching Figma 02.2–02.9) */}
            <div className="px-6 py-4 border-t border-[#F1F3F7] dark:border-white/[0.06] bg-slate-50/70 dark:bg-white/[0.02] flex items-center justify-between gap-3 shrink-0">
              <button
                onClick={() => handleDeleteNode(selectedNode.id)}
                className="px-3.5 py-2 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Node
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPropertyModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#18181C] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Close
                </button>
                {selectedNode.type === 'source' ? (
                  <button
                    onClick={handleSaveSourceConfig}
                    className="px-5 py-2 rounded-xl bg-[#2D55F5] text-white hover:bg-[#1E40AF] text-xs font-bold shadow-xs cursor-pointer transition-all"
                  >
                    Save Source Settings
                  </button>
                ) : selectedNode.type === 'rules' ? (
                  <button
                    onClick={handleSaveRulesConfig}
                    className="px-5 py-2 rounded-xl bg-[#7C3AED] text-white hover:bg-[#6D28D9] text-xs font-bold shadow-xs cursor-pointer transition-all"
                  >
                    Save Rules Settings
                  </button>
                ) : selectedNode.type === 'router' ? (
                  <button
                    onClick={handleSaveRouterConfig}
                    className="px-5 py-2 rounded-xl bg-[#7C3AED] text-white hover:bg-[#6D28D9] text-xs font-bold shadow-xs cursor-pointer transition-all"
                  >
                    Save Router Settings
                  </button>
                ) : selectedNode.type === 'target' ? (
                  <button
                    onClick={handleSaveTargetConfig}
                    className="px-5 py-2 rounded-xl bg-[#127A52] text-white hover:bg-[#0E6242] text-xs font-bold shadow-xs cursor-pointer transition-all"
                  >
                    Save Target Settings
                  </button>
                ) : selectedNode.type === 'vector_matcher' ? (
                  <button
                    onClick={handleSaveVectorMatcherConfig}
                    className="px-5 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold shadow-xs cursor-pointer transition-all"
                  >
                    Save Vector Matcher Settings
                  </button>
                ) : selectedNode.type === 'rag' ? (
                  <button
                    onClick={handleSaveRagConfig}
                    className="px-5 py-2 rounded-xl bg-[#7C3AED] text-white hover:bg-[#6D28D9] text-xs font-bold shadow-xs cursor-pointer transition-all"
                  >
                    Save RAG Settings
                  </button>
                ) : selectedNode.type === 'conditional' ? (
                  <button
                    onClick={handleSaveConditionalConfig}
                    className="px-5 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 text-xs font-bold shadow-xs cursor-pointer transition-all"
                  >
                    Save Switch Settings
                  </button>
                ) : selectedNode.type === 'hitl' ? (
                  <button
                    onClick={handleSaveHitlConfig}
                    className="px-5 py-2 rounded-xl bg-amber-600 text-white hover:bg-amber-700 text-xs font-bold shadow-xs cursor-pointer transition-all"
                  >
                    Save Governance Gate Settings
                  </button>
                ) : selectedNode.type === 'pinecone' ? (
                  <button
                    onClick={handleSavePineconeConfig}
                    className="px-5 py-2 rounded-xl bg-[#127A52] text-white hover:bg-[#0E6242] text-xs font-bold shadow-xs cursor-pointer transition-all"
                  >
                    Save Pinecone Settings
                  </button>
                ) : selectedNode.type === 'bigquery' ? (
                  <button
                    onClick={handleSaveBigQueryConfig}
                    className="px-5 py-2 rounded-xl bg-[#2D55F5] text-white hover:bg-[#1E40AF] text-xs font-bold shadow-xs cursor-pointer transition-all"
                  >
                    Save BigQuery Settings
                  </button>
                ) : (
                  <button
                    onClick={handleSaveQuarantineConfig}
                    className="px-5 py-2 rounded-xl bg-amber-600 text-white hover:bg-amber-700 text-xs font-bold shadow-xs cursor-pointer transition-all"
                  >
                    Save Quarantine Settings
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      {/* =========================================================================
          ENHANCEMENT 6.2: BUILD WITH AI DRAWER (N2-N6)
         ========================================================================= */}
      <BuildWithAiDrawer
        isOpen={isBuildWithAiOpen || isAiModalOpen}
        onClose={() => {
          setIsBuildWithAiOpen(false);
          setIsAiModalOpen(false);
        }}
        onAcceptDraft={handleAcceptAiDraft}
        existingNodes={nodes}
      />

      {/* =========================================================================
          ENHANCEMENT 6.3: PRE-FLIGHT CHECK POPOVER
         ========================================================================= */}
      <PreflightCheckPopover
        isOpen={isPreflightOpen}
        onClose={() => setIsPreflightOpen(false)}
        workflowId={activeThread?.id || 'current'}
        onFixIssue={(nodeId, check) => {
          setIsPreflightOpen(false);
          const targetNode = nodes.find(n => n.id === nodeId || n.type === 'target');
          if (targetNode) {
            openNodeSettings(targetNode);
          }
        }}
        onRunSandbox={() => {
          setIsPreflightOpen(false);
          handleDryRun();
        }}
        onRunLive={() => {
          setIsPreflightOpen(false);
          setPreflightHasBlocking(false);
          handleRunLive();
        }}
        isExecutingSandbox={isExecutingDryRun}
        isExecutingLive={isExecutingLiveRun}
      />

      {/* =========================================================================
          ENHANCEMENT 6.4: INSERT BETWEEN NODES POPOVER
         ========================================================================= */}
      <EdgeInsertMenuPopover
        isOpen={isEdgeInsertMenuOpen}
        onClose={() => {
          setIsEdgeInsertMenuOpen(false);
          setActiveEdgeForInsert(null);
        }}
        edge={activeEdgeForInsert}
        fromNode={activeEdgeForInsert ? getNode(activeEdgeForInsert.from) : null}
        toNode={activeEdgeForInsert ? getNode(activeEdgeForInsert.to) : null}
        onSelectNodeType={handleInsertNodeOnEdge}
        onOpenBuildWithAi={(promptText) => {
          setIsBuildWithAiOpen(true);
        }}
      />

      {/* =========================================================================
          ENHANCEMENT 6.5 & 6.6: RULE IMPACT PREVIEW MODAL
         ========================================================================= */}
      <RuleImpactPreviewModal
        isOpen={isRuleImpactModalOpen}
        onClose={() => {
          setIsRuleImpactModalOpen(false);
          setActiveRuleForImpact(null);
        }}
        rule={activeRuleForImpact || { id: 'rule_gl_format', name: 'GL Account Format', field: 'gl_account', severity: 'High', expression: "length(gl_account) == 8 AND gl_account != null" }}
        onSaveRule={handleSaveRuleFromImpact}
        sampleSize={1420}
      />
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

      {/* SS 3: Running Dry Run Processing Modal Dialog */}
      <RunningDryRunModal
        isOpen={isRunningDryRunModalOpen}
        onClose={() => setIsRunningDryRunModalOpen(false)}
        onCancel={() => setIsRunningDryRunModalOpen(false)}
        onComplete={() => {
          setIsRunningDryRunModalOpen(false);
          setIsDryRunResultsModalOpen(true);
        }}
        totalRows={executionSummary?.total || 1420}
        tableName={executionSummary?.sourceTable || srcTable || 'OPUR_C01'}
        rulesCount={activeRules?.length || 5}
      />

      {/* SS 4: Dry Run Results Outcome Modal Dialog */}
      <DryRunResultsModal
        isOpen={isDryRunResultsModalOpen}
        onClose={() => setIsDryRunResultsModalOpen(false)}
        onBack={() => setIsDryRunResultsModalOpen(false)}
        onReRun={() => {
          setIsDryRunResultsModalOpen(false);
          handleDryRun();
        }}
        onRunLive={() => {
          setIsDryRunResultsModalOpen(false);
          handleLiveRun();
        }}
        totalRows={executionSummary?.total || 1420}
        cleanCount={executionSummary?.clean || 1250}
        autoFixedCount={executionSummary?.fixed || 126}
        quarantinedCount={executionSummary?.quarantined || 170}
        complianceRate={executionSummary?.health ? `${executionSummary.health}%` : '96.9%'}
        tableName={executionSummary?.sourceTable || srcTable || 'OPUR_C01'}
        targetTableName={executionSummary?.targetTable || tgtTable || 'OPUR_C01_clean'}
        rulesCount={activeRules?.length || 5}
      />
    </div>
  );
}
