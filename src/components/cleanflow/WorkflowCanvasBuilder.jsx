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
  Loader2
} from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { useRuleEngine } from '../../context/RuleEngineContext';
import { getTableCatalog, getTableData } from '../../data/sampleDatasets';
import { callAiRuleEngine, getDefaultPromptForTable } from '../../utils/aiRuleSynthesizer';
import { TEMPLATE_AUTOFILLS, getWorkflowTemplate } from '../../data/workflowTemplates';

// Available node catalog for the Add Node modal
const OPERATIONAL_CATALOG = [
  {
    category: '1. Ingestion Sources',
    items: [
      { type: 'source', name: 'SAP BW InfoCube / HANA Cloud', desc: 'Batch extracts, procurement ledger, inventory', system: 'SAP BW', icon: Database, variant: 'blue' },
      { type: 'source', name: 'PostgreSQL Database / Neon', desc: 'Relational connection pool with SSL security', system: 'PostgreSQL', icon: Database, variant: 'blue' },
      { type: 'source', name: 'MongoDB Atlas (NoSQL)', desc: 'Document store with automated JSON schema discovery', system: 'MongoDB', icon: Database, variant: 'green' },
      { type: 'source', name: 'Snowflake Data Cloud', desc: 'Direct ingestion from Snowflake landing tables', system: 'Snowflake', icon: Database, variant: 'blue' }
    ]
  },
  {
    category: '2. Intelligence Engine & Transformations',
    items: [
      { type: 'rules', name: 'Intelligence Engine (Azure OpenAI)', desc: 'Natural language business rule synthesizer', system: 'gpt-5-mini', icon: FileCode2, variant: 'indigo' },
      { type: 'rules', name: 'RFC-5322 Email Normalizer', desc: 'Auto-repairs syntax, trims whitespace, lowercases domains', system: 'Rule Pack', icon: ShieldCheck, variant: 'green' },
      { type: 'rules', name: 'SAP Plant Ontology Resolver', desc: 'Maps Plant-Dallas string into S/4HANA code P1000', system: 'Ontology Graph', icon: Zap, variant: 'blue' },
      { type: 'rules', name: 'SOX 404 Financial Balancer', desc: 'Strict Debits = Credits balance validation', system: 'SOX Pack', icon: Sliders, variant: 'orange' }
    ]
  },
  {
    category: '3. In-Flight Routing & Execution',
    items: [
      { type: 'router', name: 'CleanFlow In-Flight Router', desc: 'Autonomous 3-way split: Compliant, Auto-Fixed, Quarantined', system: 'Parallel Router', icon: GitBranch, variant: 'purple' }
    ]
  },
  {
    category: '4. Targets & Destinations',
    items: [
      { type: 'target', name: 'SAP S/4HANA (BAPI_PO_CREATE1)', desc: 'Operational ERP writeback with human verification gate', system: 'SAP S/4HANA', icon: Database, variant: 'green' },
      { type: 'target', name: 'Databricks Unity Catalog Lakehouse', desc: 'Persist compliant records into Delta Lake Gold table', system: 'Databricks', icon: Database, variant: 'green' },
      { type: 'quarantine', name: 'Audit Quarantine Store', desc: 'Audit-locked isolation for critical failed records', system: 'Dead-Letter', icon: AlertTriangle, variant: 'orange' }
    ]
  }
];

export default function WorkflowCanvasBuilder({ onMoveToNext }) {
  const { navigateTo } = useNavigation();
  const { 
    sourceConfig, 
    setSourceConfig, 
    targetConfig, 
    setTargetConfig, 
    activeRules, 
    setActiveRules, 
    activeThread, 
    selectThread,
    testConnection,
    executeDryRun,
    executeLiveRun,
    pipelineStatus,
    dryRunResult,
    s4hanaDocNumber,
    // Persistent Canvas Graph & Session State
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
    return rawNodes.map(n => (n.title === 'AI Rules Engine' || n.title === 'AI Rule Engine') ? { ...n, title: 'Intelligence Engine' } : n);
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

  // Synchronized state setters that immediately update context & localStorage session
  const setNodes = useCallback((updater) => {
    setNodesState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      nodesRef.current = next;
      setWorkflowNodes(next);
      return next;
    });
  }, [setWorkflowNodes]);

  const setEdges = useCallback((updater) => {
    setEdgesState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setWorkflowEdges(next);
      return next;
    });
  }, [setWorkflowEdges]);

  // Synchronize when switching workflows from catalog or domain pack
  const lastActiveThreadIdRef = useRef(activeThread?.id);
  useEffect(() => {
    if (activeThread?.id && activeThread.id !== lastActiveThreadIdRef.current) {
      lastActiveThreadIdRef.current = activeThread.id;
      const matchingTmpl = getWorkflowTemplate(activeThread);
      const rawThreadNodes = (Array.isArray(activeThread.nodes) && activeThread.nodes.length >= 2)
        ? activeThread.nodes
        : matchingTmpl.nodes;
      const resolvedNodes = rawThreadNodes.map(n => (n.title === 'AI Rules Engine' || n.title === 'AI Rule Engine') ? { ...n, title: 'Intelligence Engine' } : n);
      const resolvedEdges = (Array.isArray(activeThread.edges) && activeThread.edges.length >= 1)
        ? activeThread.edges
        : matchingTmpl.edges;

      setNodesState(resolvedNodes);
      setWorkflowNodes(resolvedNodes);
      setEdgesState(resolvedEdges);
      setWorkflowEdges(resolvedEdges);
    }
  }, [activeThread, setWorkflowNodes, setWorkflowEdges]);

  // Execution & Live Status State
  const [isExecutingDryRun, setIsExecutingDryRun] = useState(false);
  const [isExecutingLiveRun, setIsExecutingLiveRun] = useState(false);
  const [executionSummary, setExecutionSummary] = useState(null);
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
  const [srcPass, setSrcPass] = useState('CleanCore2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [srcTable, setSrcTable] = useState(sourceConfig?.table || '0PUR_C01');
  const [readScope, setReadScope] = useState('selected'); // 'selected' | 'all'
  const [tableSearch, setTableSearch] = useState('');
  const [srcTesting, setSrcTesting] = useState(false);
  const [srcTestMeta, setSrcTestMeta] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [discoveredColumns, setDiscoveredColumns] = useState([]);

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

  const activeEngineKey = srcDbType.includes('SAP') ? 'sap_bw' : srcDbType.includes('Mongo') ? 'mongodb' : 'postgres';

  // Synchronize table preview data and schema columns
  useEffect(() => {
    const tableData = getTableData(srcTable, activeEngineKey, 5);
    setPreviewRows(tableData.rows || []);
    setDiscoveredColumns(tableData.columns || []);
    if (!rulesPrompt || rulesPrompt.length < 10) {
      setRulesPrompt(getDefaultPromptForTable(srcTable, activeEngineKey, tableData.columns));
    }
  }, [srcTable, srcDbType]);

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
        setSrcDbType(template.sourceConfig.engine === 'sap_bw' ? 'SAP BW' : template.sourceConfig.engine === 'mongodb' ? 'MongoDB' : 'PostgreSQL');
        setSrcHost(template.sourceConfig.host);
        setSrcPort(template.sourceConfig.port);
        setSrcDbName(template.sourceConfig.database);
        setSrcUser(template.sourceConfig.user);
        setSrcTable(template.sourceConfig.table);
      }
      if (template.targetConfig) {
        setTargetConfig(template.targetConfig);
        setTgtDbType(template.targetConfig.engine === 's4_hana' ? 'SAP S/4HANA' : 'PostgreSQL');
        setTgtTable(template.targetConfig.table);
      }
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
        setExecutionSummary({
          total,
          clean: res.cleanCount ?? 0,
          fixed: res.autoFixedCount ?? 0,
          quarantined: res.quarantinedCount ?? 0,
          health: res.passRate ?? 0,
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
      }
      setExecutionProgress(100);
      setExecutionPhase('completed');
    } catch (err) {
      console.warn('Dry run execution error:', err);
      setExecutionError({
        title: 'Dry Run Execution Error',
        message: err.message || 'An unexpected error occurred during dry run execution.'
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
        setExecutionSummary({
          total: res.rows ?? 0,
          clean: res.clean ?? 0,
          fixed: res.autoFixed ?? 0,
          quarantined: res.quarantined ?? 0,
          health: res.health ?? 0,
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
      }
      setExecutionProgress(100);
      setExecutionPhase('completed');
    } catch (err) {
      console.warn('Live run execution error:', err);
      setExecutionError({
        title: 'Live Commit Failed',
        message: err.message || 'Live pipeline commit failed. Check database credentials or node configuration.'
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
    const newNode = {
      id: newId,
      type: item.type,
      title: item.name,
      system: item.system || item.desc,
      x: Math.round(480 + (Math.random() * 60 - 30)),
      y: Math.round(200 + (Math.random() * 60 - 30)),
      width: 260,
      height: 135,
      status: 'Configured',
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

  // Test Connection inside Source Modal
  const handleTestSourceConnection = async () => {
    setSrcTesting(true);
    setSrcTestMeta(null);
    const engineKey = srcDbType.includes('SAP') ? 'sap_bw' : srcDbType.includes('Mongo') ? 'mongodb' : 'postgres';
    const res = await testConnection({
      engine: engineKey,
      host: srcHost,
      port: srcPort,
      database: srcDbName,
      user: srcUser,
      password: srcPass,
      connectionUri: connectMethod === 'string' ? connString : undefined
    });
    setSrcTesting(false);
    if (res && res.success) {
      setSrcTestMeta({
        success: true,
        latencyMs: res.latencyMs || 42,
        tableCount: res.tableCount || (res.tables ? res.tables.length : 6),
        message: res.message || 'Connected successfully'
      });
    } else {
      setSrcTestMeta({
        success: false,
        latencyMs: res?.latencyMs || 0,
        error: res?.error || res?.message || 'Connection failed: Unable to connect to database.',
        message: res?.message || res?.error || 'Connection failed'
      });
    }
  };

  const handleSaveSourceConfig = () => {
    const engineKey = srcDbType.includes('SAP') ? 'sap_bw' : srcDbType.includes('Mongo') ? 'mongodb' : 'postgres';
    const activeData = getTableData(srcTable, engineKey, 5);
    const resolvedUri = connectMethod === 'string' && connString 
      ? connString 
      : (engineKey === 'sap_bw' 
          ? `jdbc:sap://${srcHost}:${srcPort}?encrypt=true&validateCertificate=false&user=${encodeURIComponent(srcUser)}&password=${encodeURIComponent(srcPass)}&databaseName=${encodeURIComponent(srcDbName)}`
          : engineKey === 'mongodb'
          ? `mongodb+srv://${encodeURIComponent(srcUser)}:${encodeURIComponent(srcPass)}@${srcHost}/${srcDbName}?retryWrites=true&w=majority`
          : `postgresql://${encodeURIComponent(srcUser)}:${encodeURIComponent(srcPass)}@${srcHost}:${srcPort}/${srcDbName}?sslmode=require`);

    setSourceConfig(prev => ({
      ...prev,
      engine: engineKey,
      host: srcHost,
      port: srcPort,
      database: srcDbName,
      user: srcUser,
      password: srcPass,
      connectionUri: resolvedUri,
      table: srcTable,
      scopeMode: readScope,
      rowCount: activeData.rowCount,
      totalRows: activeData.rowCount,
      discoveredColumns: activeData.columns
    }));
    setNodes(prev => prev.map(n => n.type === 'source' ? {
      ...n,
      system: srcDbType,
      table: srcTable,
      rowCount: activeData.rowCount
    } : n));
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
    setTargetConfig(prev => ({
      ...prev,
      engine: engineKey,
      table: tgtTable,
      writeMode: writeMode,
      connectionUri: tgtEndpoint,
      host: tgtEndpoint.includes('//') ? tgtEndpoint.split('//')[1].split('/')[0] : 's4h.corp.ondemand.com',
      database: 'reconciled_db',
      user: 'cleanflow_writer',
      password: ''
    }));
    setNodes(prev => prev.map(n => n.type === 'target' ? {
      ...n,
      system: tgtDbType,
      table: tgtTable,
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
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/90 shadow-sm p-1.5 flex items-center gap-1.5">
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
            onClick={() => handleAutofillTemplate('customer_master_reconciliation')}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
          >
            Customer 360
          </button>
          <button
            onClick={() => handleAutofillTemplate('financial_gl_ledger')}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
          >
            Financial SOX
          </button>
          <button
            onClick={() => handleAutofillTemplate('healthcare_hipaa')}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
          >
            Healthcare HIPAA
          </button>
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
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              saveSuccess
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : isSavingWorkflow
                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
            title={lastSavedWorkflowTime ? `Last saved at ${lastSavedWorkflowTime} (Persisted to Cloud & Local State)` : 'Save workflow graph configuration to backend database'}
          >
            {isSavingWorkflow ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
            ) : saveSuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Save className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>
              {isSavingWorkflow ? 'Saving...' : saveSuccess ? 'Saved' : 'Save'}
            </span>
            {lastSavedWorkflowTime && !isSavingWorkflow && !saveSuccess && (
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

            {/* Animated Stream Flow Particles during execution */}
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
                <circle key={`particle-${edge.id}`} r="4" fill={particleColor} opacity="0.9">
                  <animateMotion dur="1.5s" repeatCount="indefinite" path={pathD} />
                </circle>
              );
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
                className={`workflow-node-card relative group bg-white rounded-2xl border-2 shadow-md p-4 space-y-2.5 transition-all select-none hover:shadow-lg ${
                  activeTool === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                } ${
                  isStageActive
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

                {/* 2. OUTPUT PORT (Right Side) */}
                {node.type !== 'quarantine' && (
                  <div
                    onMouseDown={(e) => handleStartEdge(e, node.id)}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-2 border-slate-400 group-hover:border-blue-500 flex items-center justify-center hover:scale-125 transition-transform cursor-crosshair z-30 shadow-xs"
                    title="Drag to connect to another node"
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-600 group-hover:bg-blue-600" />
                  </div>
                )}

                {/* Card Top Row: Icon + Title + Status Pill + Settings Button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 ${
                      node.variant === 'green' ? 'bg-emerald-600' :
                      node.variant === 'orange' ? 'bg-amber-600' :
                      node.variant === 'purple' ? 'bg-purple-600' :
                      node.variant === 'indigo' ? 'bg-indigo-600' : 'bg-blue-600'
                    }`}>
                      {node.type === 'source' ? <Database className="w-4 h-4" /> :
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
                         node.type === 'rules' ? 'Evaluating AST...' :
                         node.type === 'router' ? 'Routing...' :
                         node.type === 'target' ? 'Writing...' : 'Isolating...'}
                      </span>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 ${
                        node.variant === 'green' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        node.variant === 'orange' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {node.status}
                      </span>
                    )}

                    {/* Dedicated Settings Button on Every Node - ONLY place where property modal opens */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNodeId(node.id);
                        setIsPropertyModalOpen(true);
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
                  <span className="font-mono font-bold text-slate-800 truncate">
                    {node.type === 'source' && liveNodeStats.source
                      ? node.table || '0PUR_C01'
                      : node.type === 'target' && liveNodeStats.target
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTool === 'move' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="Select & move nodes"
          >
            <Move className="w-3.5 h-3.5" />
            Move
          </button>

          <button
            onClick={() => setActiveTool('pan')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTool === 'pan' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
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
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              executionSummary.isLive ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
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
              onClick={() => navigateTo('dry-run-results')}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <span>Inspect</span>
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

      {/* =========================================================================
          MODAL 1: ADD NODE MODAL (Clean Operational Catalog)
         ========================================================================= */}
      {isAddNodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Operational Node</h3>
                  <p className="text-xs text-slate-500">Select a verified source, intelligence engine, or target destination</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddNodeModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search operational nodes, SAP, Postgres, intelligence engine..."
                  value={addNodeSearch}
                  onChange={(e) => setAddNodeSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  autoFocus
                />
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {OPERATIONAL_CATALOG.map((cat) => {
                const filtered = cat.items.filter(item => 
                  !addNodeSearch || 
                  item.name.toLowerCase().includes(addNodeSearch.toLowerCase()) || 
                  item.desc.toLowerCase().includes(addNodeSearch.toLowerCase())
                );
                if (filtered.length === 0) return null;

                return (
                  <div key={cat.category} className="space-y-2.5">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {cat.category}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filtered.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                          <div
                            key={idx}
                            onClick={() => handleAddNodeFromCatalog(item)}
                            className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 transition-all cursor-pointer flex items-start gap-3 group shadow-2xs hover:shadow-xs"
                          >
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                              item.variant === 'green' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                              item.variant === 'orange' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                              item.variant === 'purple' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                              item.variant === 'indigo' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                              'bg-blue-50 text-blue-600 border-blue-200'
                            }`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 truncate block">
                                {item.name}
                              </span>
                              <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                                {item.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>Click any node to place it directly on the canvas</span>
              <button
                onClick={() => setIsAddNodeModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border text-white ${
                  selectedNode.variant === 'green' ? 'bg-emerald-600 border-emerald-700' :
                  selectedNode.variant === 'orange' ? 'bg-amber-600 border-amber-700' :
                  selectedNode.variant === 'purple' ? 'bg-purple-600 border-purple-700' :
                  selectedNode.variant === 'indigo' ? 'bg-indigo-600 border-indigo-700' :
                  'bg-blue-600 border-blue-700'
                }`}>
                  {selectedNode.type === 'rules' ? <FileCode2 className="w-5 h-5" /> :
                   selectedNode.type === 'router' ? <GitBranch className="w-5 h-5" /> :
                   selectedNode.type === 'quarantine' ? <AlertTriangle className="w-5 h-5" /> :
                   <Database className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedNode.title || 'Configure Node'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedNode.type === 'source' ? 'Source Database & Table Selection' :
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
              
              {/* =========================================================================
                  1. SOURCE NODE CONFIGURATION PANEL
                 ========================================================================= */}
              {selectedNode.type === 'source' && (
                <div className="space-y-5">
                  {/* Connection Method Tabs */}
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <button
                      type="button"
                      onClick={() => setConnectMethod('host')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        connectMethod === 'host'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Host & Credentials
                    </button>
                    <button
                      type="button"
                      onClick={() => setConnectMethod('string')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        connectMethod === 'string'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Connection URI String
                    </button>
                  </div>

                  {/* Database Engine Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Database Engine</label>
                    <select
                      value={srcDbType}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSrcDbType(val);
                        setSrcPort(val.includes('SAP') ? '443' : val.includes('Mongo') ? '27017' : '5432');
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 cursor-pointer"
                    >
                      <option value="SAP BW">SAP BW InfoCube / HANA Cloud</option>
                      <option value="PostgreSQL">PostgreSQL (Neon / Amazon RDS / Supabase)</option>
                      <option value="MongoDB">MongoDB Atlas (NoSQL Document Store)</option>
                      <option value="Snowflake">Snowflake Data Cloud</option>
                    </select>
                  </div>

                  {/* Mode 1: Host & Credentials */}
                  {connectMethod === 'host' ? (
                    <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Host / Server</label>
                          <input
                            type="text"
                            value={srcHost}
                            onChange={(e) => setSrcHost(e.target.value)}
                            placeholder="hana.corp.ondemand.com"
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Port</label>
                          <input
                            type="text"
                            value={srcPort}
                            onChange={(e) => setSrcPort(e.target.value)}
                            placeholder="443"
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Database Name</label>
                          <input
                            type="text"
                            value={srcDbName}
                            onChange={(e) => setSrcDbName(e.target.value)}
                            placeholder="SAP_BW"
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Username / User</label>
                          <input
                            type="text"
                            value={srcUser}
                            onChange={(e) => setSrcUser(e.target.value)}
                            placeholder="bwp_rfc_user"
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-slate-600">Password / Secret</label>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            {showPassword ? 'Hide' : 'Show'}
                          </button>
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={srcPass}
                          onChange={(e) => setSrcPass(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                        />
                      </div>
                    </div>
                  ) : (
                    /* Mode 2: Connection URI String */
                    <div className="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-slate-600">Connection URI String</label>
                        <button
                          type="button"
                          onClick={() => setShowConnString(!showConnString)}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          {showConnString ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          {showConnString ? 'Mask URI' : 'Reveal URI'}
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={connString}
                        onChange={(e) => setConnString(e.target.value)}
                        placeholder="jdbc:sap://hana.corp.ondemand.com:443?encrypt=true&validateCertificate=false&user=..."
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                      />
                    </div>
                  )}

                  {/* Read Scope Options */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Read Scope Mode</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div 
                        onClick={() => setReadScope('selected')}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                          readScope === 'selected' ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="block text-xs">Specific Table(s)</span>
                        <span className="block text-[10px] text-slate-400 font-normal">Designate specific table for stream</span>
                      </div>
                      <div 
                        onClick={() => setReadScope('all')}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                          readScope === 'all' ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="block text-xs">Full Schema</span>
                        <span className="block text-[10px] text-slate-400 font-normal">Batch sync all discovered tables</span>
                      </div>
                    </div>
                  </div>

                  {/* Table Catalog & Search */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Designated Source Table</label>
                    <select
                      value={srcTable}
                      onChange={(e) => setSrcTable(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 cursor-pointer"
                    >
                      {getTableCatalog(activeEngineKey).map((t) => (
                        <option key={t.name} value={t.name}>
                          {t.name} — ({t.rows})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Test Connection Button with Live Ping Diagnostics */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Database Connectivity</span>
                      <span className="text-[11px] text-slate-500">Pings database endpoint via backend API</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {srcTestMeta && (
                        srcTestMeta.success ? (
                          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            <Check className="w-3.5 h-3.5" />
                            Connected ({srcTestMeta.latencyMs}ms)
                          </span>
                        ) : (
                          <span 
                            className="text-xs font-bold text-rose-700 flex items-center gap-1.5 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 max-w-[280px] truncate"
                            title={srcTestMeta.error || srcTestMeta.message}
                          >
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                            <span className="truncate">{srcTestMeta.error || srcTestMeta.message || 'Connection Failed'}</span>
                          </span>
                        )
                      )}
                      <button
                        type="button"
                        onClick={handleTestSourceConnection}
                        disabled={srcTesting}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${srcTesting ? 'animate-spin' : ''}`} />
                        {srcTesting ? 'Pinging Database...' : 'Test Connection'}
                      </button>
                    </div>
                  </div>

                  {/* Discovered Schema Columns Pill Badges */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Discovered Schema Columns ({discoveredColumns.length})
                    </label>
                    <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      {discoveredColumns.map((col, idx) => (
                        <span key={idx} className="font-mono text-[10px] font-bold bg-white text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs">
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Live 5-Row Data Preview Table */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                      <Table className="w-3.5 h-3.5 text-blue-600" />
                      Live Data Preview (First 5 Rows)
                    </label>
                    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white max-h-48 overflow-y-auto">
                      <table className="w-full text-left text-[11px] font-mono">
                        <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                          <tr>
                            {discoveredColumns.slice(0, 6).map((c, i) => (
                              <th key={i} className="px-2.5 py-1.5 font-bold text-slate-600 whitespace-nowrap">
                                {c}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {previewRows.slice(0, 5).map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-slate-50/80">
                              {discoveredColumns.slice(0, 6).map((colKey, cIdx) => (
                                <td key={cIdx} className="px-2.5 py-1.5 text-slate-800 whitespace-nowrap">
                                  {String(row[colKey] ?? '—')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  2. INTELLIGENCE ENGINE CONFIGURATION PANEL
                 ========================================================================= */}
              {selectedNode.type === 'rules' && (
                <div className="space-y-4">
                  {/* Prompt & Re-synthesize */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        Natural Language Rules Prompt
                      </label>
                      <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                        Azure OpenAI (gpt-5-mini)
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={rulesPrompt}
                      onChange={(e) => setRulesPrompt(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                    <div className="flex items-center justify-between mt-2">
                      {/* Auto-Fix Remediation Toggle */}
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={autoFixActive}
                          onChange={(e) => setAutoFixActive(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        <span className="text-xs font-semibold text-slate-700">Enable Autonomous Auto-Fix Remediations</span>
                      </label>

                      <button
                        type="button"
                        onClick={async () => {
                          setRulesGenerating(true);
                          try {
                            const gen = await callAiRuleEngine({
                              prompt: rulesPrompt,
                              tableName: srcTable,
                              engine: activeEngineKey,
                              columns: discoveredColumns
                            });
                            if (gen?.length) {
                              setRulesList(gen);
                              setActiveRules(gen);
                            }
                          } finally {
                            setRulesGenerating(false);
                          }
                        }}
                        disabled={rulesGenerating}
                        className="px-3.5 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${rulesGenerating ? 'animate-spin' : ''}`} />
                        {rulesGenerating ? 'Synthesizing...' : 'Re-synthesize Rules'}
                      </button>
                    </div>
                  </div>

                  {/* Active Rules Catalog */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Active Rules ({rulesList.filter(r => r.selected !== false).length} of {rulesList.length} enabled)
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAddCustomRule(!showAddCustomRule)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Custom Rule
                      </button>
                    </div>

                    {/* Inline Add Custom Rule Form */}
                    {showAddCustomRule && (
                      <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2.5">
                        <span className="text-xs font-bold text-blue-900 block">Define New Validation Rule</span>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Target Field (e.g. TOTAL_AMOUNT)"
                            value={newRuleField}
                            onChange={(e) => setNewRuleField(e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                          />
                          <select
                            value={newRuleSeverity}
                            onChange={(e) => setNewRuleSeverity(e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            <option value="Critical">Critical (Quarantine on fail)</option>
                            <option value="Warning">Warning (Remediate / Flag)</option>
                          </select>
                        </div>
                        <input
                          type="text"
                          placeholder="Condition Formula (e.g. TOTAL_AMOUNT > 0)"
                          value={newRuleCondition}
                          onChange={(e) => setNewRuleCondition(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowAddCustomRule(false)}
                            className="px-3 py-1 rounded-lg text-xs text-slate-600 hover:bg-slate-200 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleAddNewCustomRule}
                            className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold cursor-pointer shadow-2xs"
                          >
                            Add Rule
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Rules List Cards */}
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {rulesList.map((rule) => {
                        const isChecked = rule.selected !== false && rule.enabled !== false;
                        return (
                          <div
                            key={rule.id}
                            className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                              isChecked ? 'bg-white border-slate-200 shadow-2xs' : 'bg-slate-50 border-slate-200 opacity-60'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleRuleItem(rule.id)}
                              className="mt-1 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-slate-900 truncate">
                                  {rule.name || rule.title}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                                  rule.severity === 'Critical' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {rule.severity || 'Critical'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                                  {rule.field || rule.column || 'GENERAL'}
                                </span>
                                <span className="font-mono text-[10px] text-slate-500 truncate">
                                  {rule.condition || rule.code}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteRuleItem(rule.id)}
                              className="text-slate-300 hover:text-red-500 p-1 cursor-pointer"
                              title="Delete rule"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  3. CLEANFLOW ROUTER CONFIGURATION PANEL
                 ========================================================================= */}
              {selectedNode.type === 'router' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      In-Flight 3-Way Parallel Stream Splitter
                    </label>
                    <p className="text-xs text-slate-500">
                      Evaluates incoming row packets against active rule ontologies and routes each row without data loss.
                    </p>
                  </div>

                  {/* 3 Stream Paths */}
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-emerald-950 block">Compliant Golden Stream</span>
                        <span className="text-[11px] text-emerald-700">100% compliant rows routed immediately to target destination.</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-blue-950 block">AI Remediated Stream</span>
                        <span className="text-[11px] text-blue-700">Auto-fixed rows (plant codes, calculation equalities) committed to target.</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-amber-950 block">Critical Violations Stream</span>
                        <span className="text-[11px] text-amber-700">Failed critical checks isolated to dead-letter quarantine store.</span>
                      </div>
                    </div>
                  </div>

                  {/* Quality Gate Threshold */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">Minimum Health Score Quality Gate</label>
                      <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded font-mono">
                        {routerThreshold}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={70}
                      max={100}
                      step={1}
                      value={routerThreshold}
                      onChange={(e) => setRouterThreshold(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-500 block">
                      Pipeline run pauses if overall health score falls below {routerThreshold}%.
                    </span>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  4. TARGET DESTINATION CONFIGURATION PANEL
                 ========================================================================= */}
              {selectedNode.type === 'target' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Target System Destination</label>
                    <select
                      value={tgtDbType}
                      onChange={(e) => setTgtDbType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 cursor-pointer"
                    >
                      <option value="SAP S/4HANA">SAP S/4HANA Clean Core (BAPI_PO_CREATE1 / OData)</option>
                      <option value="PostgreSQL">PostgreSQL (Neon / Amazon RDS Gold)</option>
                      <option value="Databricks Unity Catalog">Databricks Unity Catalog (Delta Lake Gold)</option>
                      <option value="Snowflake Data Cloud">Snowflake Modernized Layer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Target Endpoint / URI</label>
                    <input
                      type="text"
                      value={tgtEndpoint}
                      onChange={(e) => setTgtEndpoint(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Target Table / Entity</label>
                    <input
                      type="text"
                      value={tgtTable}
                      onChange={(e) => setTgtTable(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 font-mono"
                    />
                  </div>

                  {/* Write Mode Tabs */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">Writeback Mode</label>
                    <div className="grid grid-cols-3 gap-2">
                      <div
                        onClick={() => setWriteMode('append')}
                        className={`p-2.5 rounded-xl border cursor-pointer text-center transition-all ${
                          writeMode === 'append' ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold shadow-2xs' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <span className="block text-xs">Append</span>
                        <span className="block text-[10px] text-slate-400 font-normal">Preserve history</span>
                      </div>
                      <div
                        onClick={() => setWriteMode('upsert')}
                        className={`p-2.5 rounded-xl border cursor-pointer text-center transition-all ${
                          writeMode === 'upsert' ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold shadow-2xs' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <span className="block text-xs">Upsert</span>
                        <span className="block text-[10px] text-slate-400 font-normal">Update by PK</span>
                      </div>
                      <div
                        onClick={() => setWriteMode('overwrite')}
                        className={`p-2.5 rounded-xl border cursor-pointer text-center transition-all ${
                          writeMode === 'overwrite' ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold shadow-2xs' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <span className="block text-xs">Overwrite</span>
                        <span className="block text-[10px] text-slate-400 font-normal">Truncate & load</span>
                      </div>
                    </div>
                  </div>

                  {/* Human Verification Gate Switch */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Commitment Verification Gate</span>
                      <span className="text-[11px] text-slate-500">Enforce review before committing live data to ERP</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={targetVerificationGate}
                      onChange={(e) => setTargetVerificationGate(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* =========================================================================
                  5. QUARANTINE DEAD-LETTER STORE CONFIGURATION PANEL
                 ========================================================================= */}
              {selectedNode.type === 'quarantine' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">Quarantine Table Name</label>
                    <input
                      type="text"
                      value={quarantineTable}
                      onChange={(e) => setQuarantineTable(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 font-mono"
                    />
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
                    <span className="text-xs font-bold text-amber-900 block">Audit-Locked Dead-Letter Storage</span>
                    <span className="text-[11px] text-amber-800 block">
                      Records violating critical validation rules are preserved here with full violation telemetry for audit review.
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Spike Alert Webhook</span>
                      <span className="text-[11px] text-slate-500">Alert Slack/Email if quarantined rows exceed 10 records</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={quarantineAlertWebhook}
                      onChange={(e) => setQuarantineAlertWebhook(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* =========================================================
                  6. CONNECT WITH EDGES OPTION (UI Dropdown Connectors)
                 ========================================================= */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-900">
                  Connect to Target Nodes (Edges):
                </label>
                <p className="text-[11px] text-slate-500">
                  Select nodes to draw edges from this node, or drag from the port directly on the canvas.
                </p>

                <div className="space-y-1.5">
                  {nodes.filter(n => n.id !== selectedNode.id).map((other) => {
                    const isConnected = edges.some(e => e.from === selectedNode.id && e.to === other.id);

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
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                          isConnected ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-blue-600' : 'bg-slate-400'}`} />
                          {other.title || other.name} ({other.system})
                        </span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          isConnected ? 'bg-blue-200 text-blue-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {isConnected ? 'Connected' : 'Click to Link'}
                        </span>
                      </div>
                    );
                  })}
                </div>
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

    </div>
  );
}
