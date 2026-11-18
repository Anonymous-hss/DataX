import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  Check,
  X,
  Move,
  Hand,
  Maximize2,
  Sparkles,
  GitBranch,
  Zap,
  Play,
  Plus,
  Upload,
  ShieldCheck,
  PanelBottom,
  Send,
  Database,
  Loader2,
  Trash2,
  ArrowRight,
  HardDrive,
} from 'lucide-react';
import AddNodeCatalogModal from '../cleanflow/modals/AddNodeCatalogModal';
import NodeConfigModal from './NodeConfigModal';
import { synthesizeAiPipelineFromPrompt } from './FmdTemplateGallery';

// Figma Icons reused from WorkflowCanvasBuilder
import sourceIcon from '../../assets/icons/source.png';
import targetIcon from '../../assets/icons/target.png';
import quarantineIcon from '../../assets/icons/quarantine.png';
import connectIcon from '../../assets/icons/connect.png';
import sandboxIcon from '../../assets/icons/sandbox.png';
import liveIcon from '../../assets/icons/live.png';
import packIcon from '../../assets/icons/pack.png';

const RBAC_ROLES = [
  'Compliance Controller',
  'Data Steward',
  'Lead Data Engineer',
  'SAP Migration Architect',
  'Read-Only Auditor',
];

export default function FmdCanvasStudio({
  pipelineName,
  nodes = [],
  edges = [],
  onNodesChange,
  onEdgesChange,
  onApplyAiDraft,
  onOpenTemplateGallery,
  workspace,
  selectedFieldKey,
  onChangeField,
  comparison,
  askResult,
  asking,
  onAskQuestion,
  simulation,
  coverage,
  hitlQueue,
  stagingCommits,
  activeRole,
  onRoleChange,
  xrefEnabled,
  applyCmmsOverride,
  onToggleXref,
  onToggleCmmsOverride,
  tempFiles = [],
  onRefreshTempFiles,
  onProcessAllTempFiles,
  onProcessNodeFiles,
  onCommitStaging,
  onOpenTelemetryTab,
  isTelemetryOpen,
  onToggleTelemetry,
  traceRecordId,
  onExitTrace,
  busyAction,
  loading,
  onNotify,
  activeConfigNodeId,
  onSetActiveConfigNodeId,
}) {
  // Viewport pan & zoom
  const [zoom, setZoom] = useState(0.95);
  const [pan, setPan] = useState({ x: 24, y: 18 });
  const [activeTool, setActiveTool] = useState('move'); // 'move' | 'pan'
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const canvasRef = useRef(null);

  // Interactive selection, drag, edge drawing
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dragMovedRef = useRef(false);
  const [drawingEdge, setDrawingEdge] = useState(null);

  // Modals & Popovers
  const [isAddNodeModalOpen, setIsAddNodeModalOpen] = useState(false);
  const [addNodeSearch, setAddNodeSearch] = useState('');
  const [isFieldDropdownOpen, setIsFieldDropdownOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isAiArchitectOpen, setIsAiArchitectOpen] = useState(false);
  const [aiMode, setAiMode] = useState('build'); // 'build' | 'ask'
  const [aiInput, setAiInput] = useState('');

  // 4-Stage Sandbox Execution State (Figma 02.13)
  const [isSimulatingRun, setIsSimulatingRun] = useState(false);
  const [simStage, setSimStage] = useState(0);
  const [simElapsedMs, setSimElapsedMs] = useState(0);
  const [hasCompletedRun, setHasCompletedRun] = useState(false);

  // Dynamic live metrics (ZERO hardcoded fallbacks)
  const docs = workspace?.documents || [];
  const xrefs = workspace?.xrefs || [];
  const sourceDatasets = workspace?.source_datasets || [];
  const referenceDocs = workspace?.reference_docs || [];
  const availableFields = workspace?.available_fields || [];

  const totalSourceRecords = sourceDatasets.reduce((acc, ds) => acc + (ds.record_count || 0), 0);
  const totalFields = coverage?.totals?.total_fields ?? 0;
  const divergentFields = coverage?.totals?.divergent_fields ?? 0;
  const patternsCount = comparison?.patterns?.length ?? 0;
  const findingsCount = comparison?.findings?.length ?? 0;
  const preloadReady = simulation?.summary?.preload_ready ?? 0;
  const stagedWarn = simulation?.summary?.staged_with_warning ?? 0;
  const totalStaged = preloadReady + stagedWarn;
  const zErrorCount = simulation?.summary?.z_errorlog_count ?? 0;
  const pendingRework = (hitlQueue?.items || []).filter(
    (i) => i.raw_status === 'REWORK' && i.decision !== 'APPROVED'
  ).length;
  const latestCommit = stagingCommits?.[0] || null;
  const totalUploadedArtifacts = docs.length + xrefs.length + sourceDatasets.length + referenceDocs.length;

  const activeConfigNode = useMemo(
    () => nodes.find((n) => n.id === activeConfigNodeId) || null,
    [nodes, activeConfigNodeId]
  );

  // Traced record details
  const tracedContext = useMemo(() => {
    if (!traceRecordId) return null;
    const key = String(traceRecordId);
    const preload = (simulation?.preload_rows || []).find((r) => String(r.matnr) === key);
    const errRow = (simulation?.z_errorlog || []).find((e) => String(e.record_key) === key);
    const card = (simulation?.walkthrough_cards || []).find(
      (c) => String(c.example_record?.matnr) === key
    );
    const hasError = Boolean(errRow) || preload?.preload_status === 'ERROR_LOGGED';
    return {
      matnr: key,
      sourceSystem: preload?.source_system || errRow?.source_system || card?.source_system || 'SOURCE',
      originalDesc: preload?.original_description || card?.example_record?.maktx || '(blank)',
      finalDesc: preload?.final_time_description || '(routed to DLQ)',
      branch: preload?.execution_branch || errRow?.RULENAME || 'Rule evaluation',
      status: preload?.preload_status || (errRow ? 'Z_ERRORLOG' : 'PRELOAD_READY'),
      fmdId: preload?.fmd_unique_id || 'RULE',
      errorCategory: errRow?.ERROR_CATEGORY || null,
      errorMessage: errRow?.message || null,
      hasError,
    };
  }, [traceRecordId, simulation]);

  const handleFitToWindow = useCallback(() => {
    const el = canvasRef.current;
    if (!el || nodes.length === 0) return;
    const rect = el.getBoundingClientRect();
    const minX = Math.min(...nodes.map((n) => n.x));
    const maxX = Math.max(...nodes.map((n) => n.x + 215));
    const minY = Math.min(...nodes.map((n) => n.y));
    const maxY = Math.max(...nodes.map((n) => n.y + 150));
    const graphW = Math.max(400, maxX - minX + 100);
    const graphH = Math.max(260, maxY - minY + 110);
    const nextZoom = Math.min(1.05, Math.max(0.55, Math.min(rect.width / graphW, rect.height / graphH)));
    const nextPanX = Math.round((rect.width - graphW * nextZoom) / 2 - minX * nextZoom + 24);
    const nextPanY = Math.round((rect.height - graphH * nextZoom) / 2 - minY * nextZoom + 12);
    setZoom(Math.round(nextZoom * 100) / 100);
    setPan({ x: nextPanX, y: Math.max(12, nextPanY) });
  }, [nodes]);

  useEffect(() => {
    if (nodes.length > 0) {
      const timer = setTimeout(() => handleFitToWindow(), 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [nodes.length, handleFitToWindow]);

  // Add node from universal OPERATIONAL_CATALOG (Start from Scratch & limitless expansion)
  const handleAddNodeFromCatalog = (item) => {
    const newId = `node-${item.type}-${Date.now()}`;
    const lastNode = nodes[nodes.length - 1];
    const nextX = lastNode ? Math.min(1300, lastNode.x + 275) : 70;
    const nextY = lastNode ? lastNode.y : 120;

    const kind =
      item.type === 'file_upload'
        ? 'file_upload'
        : item.type === 'source'
          ? 'db_source'
          : item.type === 'rules'
            ? 'consolidator'
            : item.type === 'conditional' || item.type === 'router'
              ? 'xref_router'
              : item.type === 'hitl'
                ? 'hitl_gate'
                : item.type === 'quarantine'
                  ? 'z_errorlog'
                  : 'target_db';

    const newNode = {
      id: newId,
      type: item.type,
      kind,
      title: item.name.length > 26 ? `${item.name.slice(0, 26)}…` : item.name,
      system: item.system || item.name,
      x: nextX,
      y: nextY,
      config: {
        fileRole: 'auto',
        writeMode: 'append',
        table: '',
        host: '',
      },
    };

    const nextNodes = [...nodes, newNode];
    onNodesChange(nextNodes);

    // Auto-connect sensibly if adding sequentially to a non-source node
    if (lastNode && item.type !== 'file_upload' && item.type !== 'source' && lastNode.type !== 'target' && lastNode.type !== 'quarantine') {
      onEdgesChange([...edges, { id: `e-${lastNode.id}-${newId}`, from: lastNode.id, to: newId }]);
    }

    setSelectedNodeId(newId);
    setIsAddNodeModalOpen(false);
    setAddNodeSearch('');
    onSetActiveConfigNodeId(newId);

    if (onNotify) {
      onNotify({
        type: 'success',
        title: 'Node Added to Canvas',
        message: `Added "${newNode.title}". Configure it now or drag ports to connect.`,
      });
    }
  };

  const handleUpdateNode = (nodeId, patch) => {
    onNodesChange(nodes.map((n) => (n.id === nodeId ? { ...n, ...patch } : n)));
  };

  const handleDeleteNode = useCallback(
    (nodeId) => {
      const target = nodes.find((n) => n.id === nodeId);
      onNodesChange(nodes.filter((n) => n.id !== nodeId));
      onEdgesChange(edges.filter((e) => e.from !== nodeId && e.to !== nodeId));
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
      if (activeConfigNodeId === nodeId) onSetActiveConfigNodeId(null);
      if (target && onNotify) {
        onNotify({ type: 'info', title: 'Node Removed', message: `Removed "${target.title}" from the canvas.` });
      }
    },
    [nodes, edges, onNodesChange, onEdgesChange, selectedNodeId, activeConfigNodeId, onSetActiveConfigNodeId, onNotify]
  );

  const handleDeleteEdge = useCallback(
    (edgeId) => {
      onEdgesChange(edges.filter((e) => e.id !== edgeId));
      setSelectedEdgeId(null);
    },
    [edges, onEdgesChange]
  );

  // Keyboard shortcuts (V, H, F, N, A, Del, Esc)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.key === 'v' || e.key === 'V') setActiveTool('move');
      if (e.key === 'h' || e.key === 'H') setActiveTool('pan');
      if (e.key === 'f' || e.key === 'F') handleFitToWindow();
      if (e.key === 'n' || e.key === 'N') setIsAddNodeModalOpen(true);
      if (e.key === 'a' || e.key === 'A') {
        setAiMode('build');
        setIsAiArchitectOpen(true);
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !activeConfigNodeId) {
        if (selectedEdgeId) handleDeleteEdge(selectedEdgeId);
        else if (selectedNodeId) handleDeleteNode(selectedNodeId);
      }
      if (e.key === 'Escape') {
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        setIsAddNodeModalOpen(false);
        setIsAiArchitectOpen(false);
        setIsFieldDropdownOpen(false);
        setIsRoleDropdownOpen(false);
        if (traceRecordId && onExitTrace) onExitTrace();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    handleFitToWindow,
    selectedNodeId,
    selectedEdgeId,
    activeConfigNodeId,
    handleDeleteNode,
    handleDeleteEdge,
    traceRecordId,
    onExitTrace,
  ]);

  // Canvas mouse handlers
  const handleCanvasMouseDown = (e) => {
    if (e.target.closest('.workflow-node-card')) return;
    setIsFieldDropdownOpen(false);
    setIsRoleDropdownOpen(false);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleNodeMouseDown = (e, nodeId) => {
    if (activeTool === 'pan') return;
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    dragMovedRef.current = false;
    setDraggingNodeId(nodeId);
    const rect = canvasRef.current?.getBoundingClientRect();
    const mouseWorldX = (e.clientX - (rect?.left || 0) - pan.x) / zoom;
    const mouseWorldY = (e.clientY - (rect?.top || 0) - pan.y) / zoom;
    dragOffsetRef.current = { x: mouseWorldX - node.x, y: mouseWorldY - node.y };
  };

  const handleStartEdge = (e, fromNodeId) => {
    e.stopPropagation();
    const fromNode = nodes.find((n) => n.id === fromNodeId);
    if (!fromNode) return;
    const startX = fromNode.x + 215;
    const startY = fromNode.y + 72;
    setDrawingEdge({ fromNodeId, startX, startY, currentX: startX + 20, currentY: startY });
  };

  const handleCompleteEdge = (e, toNodeId) => {
    e.stopPropagation();
    if (!drawingEdge || drawingEdge.fromNodeId === toNodeId) {
      setDrawingEdge(null);
      return;
    }
    const exists = edges.some((ed) => ed.from === drawingEdge.fromNodeId && ed.to === toNodeId);
    if (!exists) {
      onEdgesChange([
        ...edges,
        { id: `e-${drawingEdge.fromNodeId}-${toNodeId}-${Date.now()}`, from: drawingEdge.fromNodeId, to: toNodeId },
      ]);
      if (onNotify) {
        onNotify({ type: 'success', title: 'Nodes Connected', message: 'Wired pipeline edge between nodes.' });
      }
    }
    setDrawingEdge(null);
  };

  useEffect(() => {
    const onMouseMove = (e) => {
      if (isPanning) {
        setPan({ x: e.clientX - panStartRef.current.x, y: e.clientY - panStartRef.current.y });
      } else if (draggingNodeId && canvasRef.current) {
        dragMovedRef.current = true;
        const rect = canvasRef.current.getBoundingClientRect();
        const worldX = (e.clientX - rect.left - pan.x) / zoom;
        const worldY = (e.clientY - rect.top - pan.y) / zoom;
        onNodesChange(
          nodes.map((n) =>
            n.id === draggingNodeId
              ? { ...n, x: Math.round(worldX - dragOffsetRef.current.x), y: Math.round(worldY - dragOffsetRef.current.y) }
              : n
          )
        );
      } else if (drawingEdge && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const worldX = (e.clientX - rect.left - pan.x) / zoom;
        const worldY = (e.clientY - rect.top - pan.y) / zoom;
        setDrawingEdge((prev) => (prev ? { ...prev, currentX: worldX, currentY: worldY } : null));
      }
    };
    const onMouseUp = () => {
      setIsPanning(false);
      setDraggingNodeId(null);
      setDrawingEdge(null);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isPanning, draggingNodeId, drawingEdge, pan.x, pan.y, zoom, nodes, onNodesChange]);

  // Execute Sandbox Run: streams client-side IndexedDB temp files -> server processing -> live results!
  const handleRunSandboxDryRun = async () => {
    if (isSimulatingRun) return;
    if (nodes.length === 0) {
      if (onNotify) {
        onNotify({
          type: 'error',
          title: 'Canvas is Empty',
          message: 'Add at least one Source / Upload node and a Target node before running.',
          actionLabel: 'Add node',
          onAction: () => setIsAddNodeModalOpen(true),
        });
      }
      return;
    }

    const uploadNodes = nodes.filter((n) => n.type === 'file_upload' || n.kind === 'file_upload');
    const hasPendingLocalFiles = tempFiles.length > 0;
    const hasDbSources = nodes.some((n) => n.type === 'source' && n.config?.host);

    if (!hasPendingLocalFiles && totalUploadedArtifacts === 0 && !hasDbSources) {
      const firstUpload = uploadNodes[0];
      if (onNotify) {
        onNotify({
          type: 'warning',
          title: 'No Input Data Uploaded Yet',
          message:
            'Upload Excel (.xlsx, .xls), CSV, Apple Numbers (.numbers), or document files into an Upload Node first (zero files are pre-loaded on the server).',
          actionLabel: firstUpload ? `Open ${firstUpload.title}` : 'Add Upload Node',
          onAction: () => {
            if (firstUpload) onSetActiveConfigNodeId(firstUpload.id);
            else setIsAddNodeModalOpen(true);
          },
        });
      }
      return;
    }

    setIsSimulatingRun(true);
    setSimStage(1);
    setSimElapsedMs(0);
    const start = Date.now();
    const ticker = setInterval(() => setSimElapsedMs(Date.now() - start), 75);

    try {
      await new Promise((r) => setTimeout(r, 320));
      setSimStage(2);
      if (hasPendingLocalFiles) {
        await onProcessAllTempFiles();
      } else if (selectedFieldKey) {
        await onChangeField(selectedFieldKey);
      }
      setSimStage(3);
      await new Promise((r) => setTimeout(r, 320));
      setSimStage(4);
      await new Promise((r) => setTimeout(r, 260));
      setHasCompletedRun(true);
      onOpenTelemetryTab('consensus');
    } catch (err) {
      if (onNotify) {
        onNotify({
          type: 'error',
          title: 'Sandbox Execution Failed',
          message: err.message || 'Unable to process pipeline on server.',
        });
      }
    } finally {
      clearInterval(ticker);
      setIsSimulatingRun(false);
      setSimStage(0);
    }
  };

  const handleAiModalSubmit = async (e) => {
    e.preventDefault();
    const text = aiInput.trim();
    if (!text) return;
    if (aiMode === 'build') {
      const generated = synthesizeAiPipelineFromPrompt(text);
      onApplyAiDraft(generated);
      setAiInput('');
      setIsAiArchitectOpen(false);
    } else {
      await onAskQuestion(text);
    }
  };

  const getNode = (id) => nodes.find((n) => n.id === id);

  const isNodeStageActive = (node) => {
    if (!isSimulatingRun) return false;
    if (simStage === 1) return node.type === 'file_upload' || node.type === 'source';
    if (simStage === 2) return node.type === 'rules' || node.type === 'vector_matcher' || node.type === 'rag';
    if (simStage === 3) return node.type === 'conditional' || node.type === 'router' || node.type === 'hitl';
    if (simStage === 4) return node.type === 'target' || node.type === 'bigquery' || node.type === 'quarantine';
    return false;
  };

  // Compute 100% dynamic metadata for any node on the canvas
  const getNodeMeta = (node, idx) => {
    const active = isNodeStageActive(node);
    const nodeLocalFiles = tempFiles.filter((f) => f.nodeId === node.id);

    const meta = {
      index: idx + 1,
      category: 'Node',
      statusText: active ? 'Running…' : 'Ready',
      statusClass: active
        ? 'bg-[#EBF0FF] text-[#2D55F5] border-[#2D55F5]/30 animate-pulse'
        : 'bg-slate-100 text-slate-600 border-slate-200',
      dotClass: active ? 'bg-[#2D55F5] animate-ping' : 'bg-slate-400',
      subtitle: node.system || 'Click to configure',
      specs: [],
    };

    if (node.type === 'file_upload' || node.kind === 'file_upload') {
      meta.category = 'Upload';
      meta.subtitle = node.config?.acceptHint || '.xlsx · .xls · .csv · .numbers · .pdf';
      if (active) {
        meta.statusText = 'Streaming…';
      } else if (nodeLocalFiles.length > 0) {
        const allSynced = nodeLocalFiles.every((f) => f.syncedToServer);
        meta.statusText = allSynced ? `${nodeLocalFiles.length} Processed` : `${nodeLocalFiles.length} Staged Local`;
        meta.statusClass = allSynced
          ? 'bg-[#ECFDF3] text-[#027A48] border-[#6CE9A6]/40'
          : 'bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]/50';
        meta.dotClass = allSynced ? 'bg-[#12B76A]' : 'bg-[#2D55F5]';
      } else {
        meta.statusText = 'Upload file';
        meta.statusClass = 'bg-amber-50 text-amber-800 border-amber-200';
        meta.dotClass = 'bg-amber-500';
      }
      const totalLocalRows = nodeLocalFiles.reduce((acc, f) => acc + (f.rowCount || 0), 0);
      meta.specs = [
        { label: 'Temp Storage', value: nodeLocalFiles.length > 0 ? `${nodeLocalFiles.length} file(s)` : 'Empty — click' },
        { label: 'Parsed Rows', value: totalLocalRows > 0 ? totalLocalRows.toLocaleString() : '—' },
      ];
    } else if (node.type === 'source') {
      meta.category = 'Source';
      meta.subtitle = node.config?.host ? node.config.host : `${node.system || 'Database'} connector`;
      const configured = Boolean(node.config?.host || node.config?.table);
      meta.statusText = active ? 'Reading…' : configured ? 'Configured' : 'Needs setup';
      meta.statusClass = configured
        ? 'bg-[#ECFDF3] text-[#027A48] border-[#6CE9A6]/40'
        : 'bg-amber-50 text-amber-800 border-amber-200';
      meta.dotClass = configured ? 'bg-[#12B76A]' : 'bg-amber-500';
      meta.specs = [
        { label: 'Table', value: node.config?.table || 'Not set' },
        { label: 'Rows', value: totalSourceRecords > 0 ? totalSourceRecords.toLocaleString() : '—' },
      ];
    } else if (node.type === 'rules' || node.type === 'vector_matcher' || node.type === 'rag') {
      meta.category = 'AI rules';
      meta.subtitle = docs.length > 0 ? `${selectedFieldKey} · ${patternsCount} pattern(s)` : 'Awaiting input data';
      meta.statusText = active ? 'Evaluating…' : docs.length > 0 ? `${findingsCount} Findings` : 'Idle';
      meta.statusClass =
        docs.length > 0
          ? 'bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]/50'
          : 'bg-slate-100 text-slate-600 border-slate-200';
      meta.dotClass = docs.length > 0 ? 'bg-[#2D55F5]' : 'bg-slate-400';
      meta.specs = [
        { label: 'Fields', value: totalFields > 0 ? `${totalFields} mapped` : '—' },
        { label: 'Hotspots', value: divergentFields > 0 ? `${divergentFields} divergent` : '0' },
      ];
    } else if (node.type === 'conditional' || node.type === 'router') {
      meta.category = 'Router';
      meta.subtitle = 'XREF lookup · Conditional split';
      meta.statusText = active ? 'Routing…' : xrefEnabled ? 'XREF ON' : 'Fallback';
      meta.statusClass = xrefEnabled
        ? 'bg-[#ECFDF3] text-[#027A48] border-[#6CE9A6]/40'
        : 'bg-slate-100 text-slate-600 border-slate-200';
      meta.dotClass = xrefEnabled ? 'bg-[#12B76A]' : 'bg-slate-400';
      meta.specs = [
        { label: 'XREF Tables', value: `${xrefs.length} loaded` },
        { label: 'Override', value: applyCmmsOverride ? 'ON' : 'OFF' },
      ];
    } else if (node.type === 'hitl') {
      meta.category = 'Review';
      meta.subtitle = activeRole;
      meta.statusText = pendingRework > 0 ? `${pendingRework} REWORK` : 'Gate Clear';
      meta.statusClass =
        pendingRework > 0
          ? 'bg-[#FEF6EE] text-[#B54708] border-[#FDB022]/40'
          : 'bg-[#ECFDF3] text-[#027A48] border-[#6CE9A6]/40';
      meta.dotClass = pendingRework > 0 ? 'bg-[#F79009]' : 'bg-[#12B76A]';
      meta.specs = [
        { label: 'Pending', value: `${pendingRework} item(s)` },
        { label: 'Audit', value: 'RBAC + SHA-256' },
      ];
    } else if (node.type === 'target' || node.type === 'bigquery' || node.type === 'pinecone') {
      meta.category = 'Target';
      meta.subtitle = `${node.system || 'Target'} · ${(node.config?.writeMode || 'append').toUpperCase()}`;
      meta.statusText = active
        ? 'Writing…'
        : latestCommit
          ? 'Committed'
          : totalStaged > 0
            ? `${totalStaged} Staged`
            : 'Ready';
      meta.statusClass =
        latestCommit || totalStaged > 0
          ? 'bg-[#ECFDF3] text-[#027A48] border-[#6CE9A6]/40'
          : 'bg-slate-100 text-slate-600 border-slate-200';
      meta.dotClass = latestCommit || totalStaged > 0 ? 'bg-[#12B76A]' : 'bg-slate-400';
      meta.specs = [
        { label: 'Table', value: node.config?.table || 'Auto-derived' },
        { label: 'Staged', value: totalStaged > 0 ? `${preloadReady} ready · ${stagedWarn} warn` : '—' },
      ];
    } else if (node.type === 'quarantine') {
      meta.category = 'DLQ';
      meta.subtitle = 'Exception & error isolation';
      meta.statusText = zErrorCount > 0 ? `${zErrorCount} Held` : '0 Errors';
      meta.statusClass =
        zErrorCount > 0
          ? 'bg-rose-50 text-rose-700 border-rose-200'
          : 'bg-slate-100 text-slate-600 border-slate-200';
      meta.dotClass = zErrorCount > 0 ? 'bg-rose-500' : 'bg-slate-400';
      meta.specs = [
        { label: 'Table', value: node.config?.table || 'z_errorlog' },
        { label: 'Isolated', value: `${zErrorCount} row(s)` },
      ];
    }

    return meta;
  };

  return (
    <div className="relative flex-1 min-h-0 w-full flex flex-col bg-[#F8FAFC] dark:bg-[#0E1015] select-none overflow-hidden font-sans">
      {/* =========================================================================
          1. TOP SUB-HEADER BAR (100% Dynamic — Matching Figma 02.1 & 02.14)
         ========================================================================= */}
      <div className="w-full bg-white dark:bg-[#18181C] border-b border-[#E3E6EE] dark:border-white/[0.08] px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2.5 shrink-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenTemplateGallery}
            className="w-8 h-8 rounded-full border border-[#E3E6EE] dark:border-white/[0.08] bg-white dark:bg-[#18181C] hover:bg-[#F5F6FA] dark:hover:bg-white/[0.05] text-[#474E61] dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Back to Template Gallery"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-[#0A0F1F] dark:text-white truncate">
                {pipelineName || 'Custom Data Pipeline'}
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  isSimulatingRun || loading
                    ? 'bg-blue-50 text-[#2D55F5] border-blue-200'
                    : latestCommit
                      ? 'bg-emerald-50 text-[#127A52] border-emerald-200'
                      : hasCompletedRun && totalUploadedArtifacts > 0
                        ? 'bg-emerald-50 text-[#127A52] border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSimulatingRun || loading
                      ? 'bg-[#2D55F5] animate-ping'
                      : latestCommit || (hasCompletedRun && totalUploadedArtifacts > 0)
                        ? 'bg-[#127A52]'
                        : 'bg-slate-400'
                  }`}
                />
                {isSimulatingRun
                  ? 'Running'
                  : latestCommit
                    ? `Committed (${latestCommit.commit_id})`
                    : hasCompletedRun && totalUploadedArtifacts > 0
                      ? 'Dry run passed'
                      : nodes.length === 0
                        ? 'Blank canvas'
                        : 'Ready'}
              </span>
            </div>

            <span className="text-[11px] text-[#8E95A9] dark:text-slate-400 font-medium truncate mt-0.5">
              {nodes.length} node(s) · {tempFiles.length} local temp file(s) · {totalUploadedArtifacts} server artifact(s)
              {totalSourceRecords > 0 ? ` · ${totalSourceRecords.toLocaleString()} source rows` : ''}
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Templates Button */}
          <button
            type="button"
            onClick={onOpenTemplateGallery}
            className="px-3 py-1.5 rounded-full border border-[#CDD2DE] dark:border-white/[0.12] bg-white dark:bg-[#18181C] hover:bg-[#F8FAFC] text-xs font-semibold text-[#0A0F1F] dark:text-white flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <img src={packIcon} alt="Templates" className="w-3.5 h-3.5 object-contain" />
            <span>Templates</span>
          </button>

          {/* Dynamic Field Selector (ONLY when FMD fields are loaded) */}
          {availableFields.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsFieldDropdownOpen((v) => !v);
                  setIsRoleDropdownOpen(false);
                }}
                className="px-3 py-1.5 rounded-full border border-[#CDD2DE] dark:border-white/[0.12] bg-white dark:bg-[#18181C] hover:bg-[#F8FAFC] text-xs font-semibold text-[#0A0F1F] dark:text-white flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span className="font-mono">{selectedFieldKey}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isFieldDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-[#18181C] border border-[#E2E8F0] dark:border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden z-50">
                  <div className="px-4 py-2 border-b border-[#F1F3F7] dark:border-white/[0.08] flex items-center justify-between text-xs font-bold">
                    <span>Mapped Field</span>
                    <span className="text-[10px] text-slate-400">{availableFields.length} fields</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-[#F1F3F7] dark:divide-white/[0.06]">
                    {availableFields.map((f) => {
                      const fKey = f.key || `${f.target_table}-${f.target_field_name || f.target_field}`;
                      const selected = fKey === selectedFieldKey;
                      return (
                        <button
                          key={fKey}
                          type="button"
                          onClick={() => {
                            onChangeField(fKey);
                            setIsFieldDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer ${
                            selected ? 'bg-[#F0F5FF] text-[#2D55F5] font-bold' : 'text-[#0A0F1F] dark:text-slate-200'
                          }`}
                        >
                          <span className="font-mono">{fKey}</span>
                          {selected && <Check className="w-3.5 h-3.5 text-[#2D55F5]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* RBAC Persona Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsRoleDropdownOpen((v) => !v);
                setIsFieldDropdownOpen(false);
              }}
              className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                activeRole === 'Read-Only Auditor'
                  ? 'border-rose-300 bg-rose-50 text-rose-700'
                  : 'border-[#CDD2DE] dark:border-white/[0.12] bg-white dark:bg-[#18181C] text-[#0A0F1F] dark:text-white hover:bg-[#F8FAFC]'
              }`}
              title="Switch RBAC Governance Role"
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${activeRole === 'Read-Only Auditor' ? 'text-rose-600' : 'text-[#2D55F5]'}`} />
              <span className="hidden xl:inline">{activeRole}</span>
              <span className="xl:hidden">{activeRole.split(' ')[0]}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isRoleDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#18181C] border border-[#E2E8F0] dark:border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden z-50 p-1">
                {RBAC_ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      onRoleChange(role);
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between cursor-pointer ${
                      activeRole === role
                        ? 'bg-[#F0F5FF] text-[#2D55F5] font-bold'
                        : 'text-[#0A0F1F] dark:text-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>{role}</span>
                    {activeRole === role && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Test in sandbox */}
          <button
            type="button"
            onClick={handleRunSandboxDryRun}
            disabled={isSimulatingRun || nodes.length === 0}
            className="px-3.5 py-1.5 rounded-full border border-[#CDD2DE] dark:border-white/[0.15] bg-white dark:bg-[#18181C] hover:bg-[#F8FAFC] text-xs font-semibold text-[#0A0F1F] dark:text-white flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-40"
          >
            <img src={sandboxIcon} alt="Sandbox" className={`w-3.5 h-3.5 object-contain ${isSimulatingRun ? 'animate-bounce' : ''}`} />
            <span>{isSimulatingRun ? 'Processing…' : 'Test in sandbox'}</span>
          </button>

          {/* Run live / Push to Target */}
          <button
            type="button"
            onClick={() => onCommitStaging(true)}
            disabled={busyAction === 'commit' || nodes.length === 0}
            className="px-4 py-1.5 rounded-full bg-[#2D55F5] hover:bg-[#1E44D6] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <img src={liveIcon} alt="Run live" className="w-3.5 h-3.5 object-contain" />
            <span>{busyAction === 'commit' ? 'Pushing…' : 'Run live'}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. MAIN DOTTED-GRID CANVAS VIEWPORT
         ========================================================================= */}
      <div
        ref={canvasRef}
        onMouseDown={handleCanvasMouseDown}
        onWheel={(e) => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setZoom((z) => Math.min(1.6, Math.max(0.5, Math.round((z - e.deltaY * 0.001) * 100) / 100)));
          }
        }}
        className={`relative flex-1 w-full min-h-0 overflow-hidden ${
          activeTool === 'pan' || isPanning ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
        }`}
        style={{
          backgroundImage: 'radial-gradient(#CBD5E1 1.25px, transparent 1.25px)',
          backgroundSize: '24px 24px',
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      >
        {/* Top-Left Helper Pill or Trace Banner */}
        {tracedContext ? (
          <div className="absolute top-3.5 left-5 z-30 pointer-events-auto flex items-center gap-2.5 bg-[#0A0F1F] text-white px-3.5 py-1.5 rounded-full shadow-xl">
            <Zap className="w-3.5 h-3.5 text-[#D4FF3A]" />
            <span className="text-xs font-semibold">
              Tracing #{tracedContext.matnr} ({tracedContext.sourceSystem})
            </span>
            <button
              type="button"
              onClick={onExitTrace}
              className="ml-1 text-[11px] text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-0.5 rounded-full cursor-pointer"
            >
              Exit trace
            </button>
          </div>
        ) : (
          <div className="absolute top-3.5 left-5 z-20 pointer-events-none flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-[#18181C]/95 backdrop-blur-md border border-[#E2E8F0] dark:border-white/[0.1] shadow-xs text-xs text-[#5F6678] dark:text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-[#2D55F5]" />
              <span>
                {nodes.length === 0
                  ? 'Blank canvas — add any Source, Upload Node, Transform, or Target.'
                  : 'Click any node to upload files or configure. Drag ports to connect. Press N to add nodes.'}
              </span>
            </div>
            {tempFiles.length > 0 && (
              <div className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50/95 border border-blue-200 text-[11px] font-semibold text-[#2D55F5] shadow-xs">
                <HardDrive className="w-3 h-3" />
                <span>{tempFiles.length} file(s) in browser temp storage</span>
              </div>
            )}
          </div>
        )}

        {/* EMPTY CANVAS START CARD (When Started from Scratch — Matching WorkflowCanvasBuilder) */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-6 pointer-events-none">
            <div className="w-full max-w-xl bg-white/95 dark:bg-[#18181C]/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-white/[0.12] shadow-2xl p-8 pointer-events-auto text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 flex items-center justify-center text-[#2D55F5] mb-4 shadow-sm">
                <Sparkles className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Start building your pipeline
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-md">
                Add any combination of File Uploaders (.xlsx, .xls, .csv, Apple .numbers, .pdf, .pptx), Databases, AI Rules, XREF Routers, HITL Gates, and Destinations.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-6 text-left">
                <button
                  type="button"
                  onClick={() => {
                    setAiMode('build');
                    setIsAiArchitectOpen(true);
                  }}
                  className="p-4 rounded-xl border-2 border-blue-200 hover:border-[#2D55F5] bg-blue-50/40 hover:bg-blue-50/70 transition-all flex flex-col justify-between group cursor-pointer text-left"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-8 h-8 rounded-lg bg-[#2D55F5] text-white flex items-center justify-center shadow-xs">
                        <Sparkles className="w-4 h-4" />
                      </span>
                      <kbd className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-white border border-blue-200 text-blue-800">
                        A
                      </kbd>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#2D55F5]">Build with AI</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Describe your sources, spreadsheets, rules, and target in plain English.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#2D55F5] mt-3 inline-flex items-center gap-1">
                    Draft pipeline →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddNodeModalOpen(true)}
                  className="p-4 rounded-xl border-2 border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50 transition-all flex flex-col justify-between group cursor-pointer text-left"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
                        <Plus className="w-4 h-4" />
                      </span>
                      <kbd className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 border border-slate-200 text-slate-700">
                        N
                      </kbd>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#2D55F5]">Browse node library</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Pick Upload Nodes, SAP, Postgres, Snowflake, AI rules, routers &amp; targets.
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-700 mt-3 inline-flex items-center gap-1">
                    Open node catalog →
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={onOpenTemplateGallery}
                className="mt-5 text-xs font-semibold text-slate-500 hover:text-[#2D55F5] inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Or browse ready-made templates</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* World Transform Container */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: '100%',
            height: '100%',
            position: 'absolute',
            left: 0,
            top: 0,
          }}
        >
          {/* SVG Cubic Bezier Connectors */}
          <svg className="absolute inset-0 w-[2600px] h-[1400px] pointer-events-none z-10 overflow-visible">
            <defs>
              <marker id="saas-arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 2 L 7 5 L 0 8 z" fill="#3B82F6" />
              </marker>
              <marker id="saas-arrow-gray" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 2 L 7 5 L 0 8 z" fill="#94A3B8" />
              </marker>
            </defs>

            {edges.map((edge) => {
              const fromNode = getNode(edge.from);
              const toNode = getNode(edge.to);
              if (!fromNode || !toNode) return null;
              const startX = fromNode.x + 215;
              const startY = fromNode.y + 72;
              const endX = toNode.x;
              const endY = toNode.y + 72;
              const dx = Math.max(45, Math.abs(endX - startX) * 0.5);
              const pathD = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;
              const midX = (startX + endX) / 2;
              const midY = (startY + endY) / 2;
              const isDlqEdge = toNode.type === 'quarantine';
              const isEdgeSelected = selectedEdgeId === edge.id;

              return (
                <g key={edge.id} className="pointer-events-auto cursor-pointer">
                  <path
                    d={pathD}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={14}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEdgeId(edge.id);
                    }}
                  />
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isEdgeSelected ? '#EF4444' : isDlqEdge ? '#CBD5E1' : '#3B82F6'}
                    strokeWidth={isEdgeSelected ? 3 : 2}
                    strokeDasharray={isDlqEdge ? '5 4' : 'none'}
                    strokeLinecap="round"
                    markerEnd={isDlqEdge ? 'url(#saas-arrow-gray)' : 'url(#saas-arrow-blue)'}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEdgeId(edge.id);
                    }}
                  />

                  {edge.branch === 'TRUE' && (
                    <g transform={`translate(${startX + 18}, ${startY - 22})`} className="pointer-events-none">
                      <rect width="42" height="17" rx="8.5" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                      <text x="21" y="11.5" textAnchor="middle" fill="#5F6678" fontSize="9" fontWeight="bold">
                        CLEAN
                      </text>
                    </g>
                  )}

                  {edge.branch === 'FALSE' && (
                    <g transform={`translate(${startX + 18}, ${startY + 14})`} className="pointer-events-none">
                      <rect width="44" height="17" rx="8.5" fill="#FFFBEB" stroke="#FDE68A" strokeWidth="1" />
                      <text x="22" y="11.5" textAnchor="middle" fill="#B45309" fontSize="9" fontWeight="bold">
                        ERROR
                      </text>
                    </g>
                  )}

                  {isEdgeSelected && (
                    <g
                      transform={`translate(${midX - 10}, ${midY - 10})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEdge(edge.id);
                      }}
                    >
                      <circle cx="10" cy="10" r="10" fill="#EF4444" />
                      <line x1="7" y1="7" x2="13" y2="13" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                      <line x1="13" y1="7" x2="7" y2="13" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                    </g>
                  )}

                  {(isSimulatingRun || busyAction === 'commit') && (
                    <g className="pointer-events-none">
                      <circle r="4" fill={isDlqEdge ? '#F59E0B' : '#2D55F5'} opacity="0.95">
                        <animateMotion dur="1.4s" repeatCount="indefinite" path={pathD} />
                      </circle>
                      <circle r="2.5" fill="#FFFFFF" opacity="0.9">
                        <animateMotion dur="1.4s" begin="0.45s" repeatCount="indefinite" path={pathD} />
                      </circle>
                    </g>
                  )}
                </g>
              );
            })}

            {drawingEdge && (
              <path
                d={`M ${drawingEdge.startX} ${drawingEdge.startY} C ${drawingEdge.startX + 60} ${drawingEdge.startY}, ${drawingEdge.currentX - 60} ${drawingEdge.currentY}, ${drawingEdge.currentX} ${drawingEdge.currentY}`}
                fill="none"
                stroke="#2D55F5"
                strokeWidth="2.5"
                strokeDasharray="4 4"
                strokeLinecap="round"
              />
            )}
          </svg>

          {/* DYNAMIC CANVAS NODE CARDS */}
          {nodes.map((node, idx) => {
            const meta = getNodeMeta(node, idx);
            const isSelected = selectedNodeId === node.id;
            const isActiveStage = isNodeStageActive(node);

            return (
              <div
                key={node.id}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (dragMovedRef.current) return;
                  setSelectedNodeId(node.id);
                  onSetActiveConfigNodeId(node.id);
                }}
                style={{
                  transform: `translate(${node.x}px, ${node.y}px)`,
                  width: 215,
                  position: 'absolute',
                  zIndex: isActiveStage ? 35 : isSelected ? 30 : 20,
                }}
                className={`workflow-node-card relative group bg-white dark:bg-[#18181C] rounded-[20px] border transition-all select-none p-3.5 flex flex-col justify-between shadow-2xs ${
                  activeTool === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                } ${
                  isActiveStage
                    ? 'border-[#2D55F5] ring-4 ring-[#2D55F5]/25 shadow-xl scale-[1.02]'
                    : isSelected
                      ? 'border-[#2D55F5] ring-3 ring-[#2D55F5]/20 shadow-lg'
                      : 'border-slate-200/90 dark:border-white/[0.08] hover:border-[#2D55F5]/60 hover:shadow-md'
                }`}
              >
                {/* Quick Delete Icon on Hover */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNode(node.id);
                  }}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white dark:bg-[#18181C] border border-slate-200 hover:border-rose-400 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xs cursor-pointer z-40"
                  title="Remove node"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>

                {/* Left Input Port */}
                {node.type !== 'source' && node.type !== 'file_upload' && (
                  <div
                    onMouseUp={(e) => handleCompleteEdge(e, node.id)}
                    className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white dark:bg-[#18181C] border-2 border-slate-300 dark:border-slate-600 group-hover:border-[#2D55F5] flex items-center justify-center hover:scale-125 transition-all cursor-crosshair z-30 shadow-2xs"
                    title="Drop to connect edge here"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 group-hover:bg-[#2D55F5]" />
                  </div>
                )}

                {/* Right Output Port */}
                {node.type !== 'target' && node.type !== 'quarantine' && node.type !== 'bigquery' && (
                  <div
                    onMouseDown={(e) => handleStartEdge(e, node.id)}
                    className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white dark:bg-[#18181C] border-2 border-slate-300 dark:border-slate-600 group-hover:border-[#2D55F5] flex items-center justify-center hover:scale-125 transition-all cursor-crosshair z-30 shadow-2xs"
                    title="Drag to connect to another node"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 group-hover:bg-[#2D55F5]" />
                  </div>
                )}

                {/* Card Top Row */}
                <div className="flex items-center justify-between mb-2 gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-[#0A0F1F] dark:bg-white text-white dark:text-[#0A0F1F] text-[10px] font-bold flex items-center justify-center shrink-0">
                      {meta.index}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {meta.category}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 shrink-0 ${meta.statusClass}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dotClass}`} />
                    <span>{meta.statusText}</span>
                  </span>
                </div>

                {/* Card Middle Row */}
                <div className="flex items-start gap-2.5 my-1.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.08] flex items-center justify-center shrink-0">
                    {node.type === 'file_upload' ? (
                      <Upload className="w-5 h-5 text-[#2D55F5]" />
                    ) : node.type === 'source' ? (
                      <img src={sourceIcon} alt="Source" className="w-5 h-5 object-contain" />
                    ) : node.type === 'rules' ? (
                      <div className="relative w-5 h-5 flex items-center justify-center">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700 dark:text-slate-200">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#2D55F5] border border-white flex items-center justify-center text-white text-[9px] font-bold">
                          +
                        </div>
                      </div>
                    ) : node.type === 'conditional' || node.type === 'router' ? (
                      <img src={connectIcon} alt="Router" className="w-5 h-5 object-contain" />
                    ) : node.type === 'hitl' ? (
                      <GitBranch className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                    ) : node.type === 'target' || node.type === 'bigquery' ? (
                      <img src={targetIcon} alt="Target" className="w-5 h-5 object-contain" />
                    ) : node.type === 'quarantine' ? (
                      <img src={quarantineIcon} alt="DLQ" className="w-5 h-5 object-contain" />
                    ) : (
                      <Database className="w-5 h-5 text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
                      {node.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5 line-clamp-2">
                      {meta.subtitle}
                    </p>
                  </div>
                </div>

                {/* Card Bottom Specs */}
                <div className="border-t border-slate-100 dark:border-white/[0.06] pt-2 mt-1 space-y-1">
                  {meta.specs.map((spec) => (
                    <div key={spec.label} className="flex items-center justify-between text-[11px] leading-tight">
                      <span className="text-slate-400 dark:text-slate-500 font-medium">{spec.label}</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200 text-right truncate max-w-[125px]">
                        {spec.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* =====================================================================
            3. EXECUTING PIPELINE 4-STAGE BAR (Figma 02.13)
           ===================================================================== */}
        {isSimulatingRun && (
          <div className="absolute bottom-3 inset-x-4 sm:inset-x-6 z-40 bg-white/98 dark:bg-[#18181C]/98 backdrop-blur-md rounded-2xl border border-[#CDD2DE] dark:border-white/[0.12] shadow-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center">
                  <Play className="w-2.5 h-2.5 fill-current text-slate-800 dark:text-white ml-0.5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0F172A] dark:text-white leading-tight">
                    Executing pipeline · stage {simStage} of 4
                  </h4>
                  <p className="text-xs text-[#5F6678] dark:text-slate-400">
                    Streaming files from client temporary storage to server for parsing &amp; sandbox evaluation.
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs font-semibold text-[#5F6678]">
                {(simElapsedMs / 1000).toFixed(1)} s
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-[#F1F3F7] dark:border-white/[0.06]">
              {[
                { num: 1, title: '1. Read Local Temp Storage', desc: `${tempFiles.length} local file(s)` },
                { num: 2, title: '2. Parse & Consolidate', desc: 'Server ingestion & schema detection' },
                { num: 3, title: '3. Evaluate Rules & XREF', desc: 'In-process DuckDB transformation' },
                { num: 4, title: '4. Stage Clean & DLQ', desc: 'Prepare target batch & audit hash' },
              ].map((st) => {
                const done = simStage > st.num;
                const running = simStage === st.num;
                return (
                  <div
                    key={st.num}
                    className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                      running ? 'border-blue-200 bg-blue-50/40' : 'border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#18181C]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">{st.title}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          done
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : running
                              ? 'bg-blue-50 text-[#2D55F5] border-blue-200'
                              : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                      >
                        {done ? 'Done' : running ? 'Running' : 'Queued'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5F6678] dark:text-slate-400 mb-1.5">{st.desc}</p>
                    <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          done ? 'w-full bg-emerald-500' : running ? 'w-2/3 bg-[#2D55F5] animate-pulse' : 'w-0'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =====================================================================
            4. FLOATING BOTTOM CONTROLS (Zoom | Move/Pan/Add Node/AI/Telemetry | Radar)
           ===================================================================== */}
        {!isSimulatingRun && (
          <div className="absolute bottom-3 inset-x-4 sm:inset-x-6 flex items-center justify-between gap-2 pointer-events-none z-30">
            {/* Zoom Pill */}
            <div className="pointer-events-auto bg-white/95 dark:bg-[#18181C]/95 backdrop-blur-md rounded-2xl border border-[#CDD2DE] dark:border-white/[0.12] shadow-lg px-2.5 py-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#0F172A] dark:text-white">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.5, Math.round((z - 0.1) * 100) / 100))}
                className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
                title="Zoom out"
              >
                –
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoom(0.95);
                  setPan({ x: 24, y: 18 });
                }}
                className="font-mono text-xs px-1 hover:text-[#2D55F5] cursor-pointer"
                title="Reset zoom"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(1.6, Math.round((z + 0.1) * 100) / 100))}
                className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
                title="Zoom in"
              >
                +
              </button>
              <span className="h-3.5 w-px bg-slate-200" />
              <button
                type="button"
                onClick={handleFitToWindow}
                className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 rounded-lg text-slate-500 hover:text-[#2D55F5] cursor-pointer"
                title="Fit canvas (F)"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Center Tool Dock */}
            <div className="pointer-events-auto bg-white/95 dark:bg-[#18181C]/95 backdrop-blur-md rounded-2xl border border-[#CDD2DE] dark:border-white/[0.12] shadow-xl p-1 flex items-center gap-1 overflow-x-auto max-w-[70vw]">
              <button
                type="button"
                onClick={() => setActiveTool('move')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  activeTool === 'move' ? 'bg-[#2D55F5] text-white shadow-xs' : 'text-[#0F172A] dark:text-slate-300 hover:bg-[#F1F3F7]'
                }`}
                title="Move nodes (V)"
              >
                <Move className="w-3.5 h-3.5" />
                <span>Move</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTool('pan')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  activeTool === 'pan' ? 'bg-[#2D55F5] text-white shadow-xs' : 'text-[#0F172A] dark:text-slate-300 hover:bg-[#F1F3F7]'
                }`}
                title="Pan canvas (H)"
              >
                <Hand className="w-3.5 h-3.5" />
                <span>Pan</span>
              </button>

              <span className="h-4 w-px bg-slate-200 dark:bg-white/[0.12] mx-0.5" />

              <button
                type="button"
                onClick={() => setIsAddNodeModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#0F172A] dark:text-slate-200 hover:bg-[#F1F3F7] cursor-pointer"
                title="Add any Source, Upload Node, Transform, or Target (N)"
              >
                <Plus className="w-3.5 h-3.5 text-[#2D55F5]" />
                <span>Add node</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAiMode('build');
                  setIsAiArchitectOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#6D28D9] dark:text-[#C4B5FD] bg-[#F5F3FF] dark:bg-[#7C3AED]/20 hover:bg-[#EDE9FE] border border-[#DDD6FE] cursor-pointer"
                title="Build pipeline or Ask AI (A)"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Build / Ask AI</span>
              </button>

              <button
                type="button"
                onClick={onToggleTelemetry}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  isTelemetryOpen ? 'bg-[#0A0F1F] text-white' : 'text-[#0F172A] dark:text-slate-200 hover:bg-[#F1F3F7]'
                }`}
                title="Toggle Run Telemetry Drawer"
              >
                <PanelBottom className="w-3.5 h-3.5" />
                <span>Telemetry</span>
              </button>
            </div>

            {/* Canvas Radar Mini-Map */}
            <div className="hidden lg:flex pointer-events-auto bg-white/95 dark:bg-[#18181C]/95 backdrop-blur-md rounded-2xl border border-[#CDD2DE] dark:border-white/[0.12] shadow-lg p-2 flex-col gap-1 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-[10px] text-[#0F172A] dark:text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#127A52] animate-pulse" />
                  Canvas radar · {nodes.length} node(s)
                </span>
                <span className="text-[9px] text-slate-400 font-mono">N add · Del remove</span>
              </div>
              <div className="w-36 h-7 rounded-lg bg-[#F8FAFC] dark:bg-white/[0.03] border border-[#E2E8F0] dark:border-white/[0.06] relative overflow-hidden">
                {nodes.map((n) => {
                  const dotX = Math.max(4, Math.min(138, (n.x / 1450) * 134));
                  const dotY = Math.max(4, Math.min(24, (n.y / 380) * 22));
                  return (
                    <div
                      key={`radar-${n.id}`}
                      style={{ left: `${dotX}px`, top: `${dotY}px` }}
                      className={`absolute w-1.5 h-1.5 rounded-full -translate-x-1/2 -translate-y-1/2 ${
                        selectedNodeId === n.id
                          ? 'bg-[#2D55F5] ring-2 ring-blue-300'
                          : n.type === 'quarantine'
                            ? 'bg-amber-500'
                            : n.type === 'target' || n.type === 'bigquery'
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

        {/* =====================================================================
            5. ADD NODE CATALOG MODAL (Reused from WorkflowCanvasBuilder!)
           ===================================================================== */}
        <AddNodeCatalogModal
          isOpen={isAddNodeModalOpen}
          onClose={() => setIsAddNodeModalOpen(false)}
          addNodeSearch={addNodeSearch}
          setAddNodeSearch={setAddNodeSearch}
          handleAddNodeFromCatalog={handleAddNodeFromCatalog}
          onOpenAiBuild={() => {
            setAiMode('build');
            setIsAiArchitectOpen(true);
          }}
        />

        {/* =====================================================================
            6. DYNAMIC NODE CONFIGURATION MODAL (Upload / DB / Target / Rules)
           ===================================================================== */}
        <NodeConfigModal
          key={activeConfigNode?.id || 'none'}
          node={activeConfigNode}
          onClose={() => onSetActiveConfigNodeId(null)}
          onUpdateNode={handleUpdateNode}
          onDeleteNode={handleDeleteNode}
          tempFiles={tempFiles}
          onRefreshTempFiles={onRefreshTempFiles}
          onProcessNodeFiles={onProcessNodeFiles}
          onCommitTarget={onCommitStaging}
          onOpenTelemetryTab={onOpenTelemetryTab}
          onNotify={onNotify}
          xrefEnabled={xrefEnabled}
          applyCmmsOverride={applyCmmsOverride}
          onToggleXref={onToggleXref}
          onToggleCmmsOverride={onToggleCmmsOverride}
          isProcessing={busyAction === 'upload'}
        />

        {/* =====================================================================
            7. BUILD WITH AI / ASK AI MODAL
           ===================================================================== */}
        {isAiArchitectOpen && (
          <div
            className="fixed inset-0 z-[65] bg-slate-900/35 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setIsAiArchitectOpen(false)}
          >
            <div
              className="w-full max-w-xl bg-white dark:bg-[#18181C] rounded-2xl border border-[#E2E8F0] dark:border-white/[0.12] shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-3.5 border-b border-[#F1F3F7] dark:border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAiMode('build')}
                    className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${
                      aiMode === 'build' ? 'bg-[#2D55F5] text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Build Pipeline with AI
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiMode('ask')}
                    className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${
                      aiMode === 'ask' ? 'bg-[#2D55F5] text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Ask AI About Uploaded Rules
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAiArchitectOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <form onSubmit={handleAiModalSubmit} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder={
                      aiMode === 'build'
                        ? 'Describe sources, file uploads, rules, HITL gates, and target DB...'
                        : 'Ask a question about your uploaded FMD spreadsheets or rules...'
                    }
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#CDD2DE] dark:border-white/[0.15] bg-[#F8FAFC] dark:bg-white/[0.04] text-xs text-[#0A0F1F] dark:text-white focus:outline-none focus:border-[#2D55F5]"
                  />
                  <button
                    type="submit"
                    disabled={asking || !aiInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-[#2D55F5] hover:bg-[#1E44D6] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {asking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{aiMode === 'build' ? 'Generate' : 'Ask'}</span>
                  </button>
                </form>

                {aiMode === 'build' ? (
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Upload Excel and CSV files, apply XREF lookup rules, add HITL review, push to PostgreSQL',
                      'Read SAP S/4HANA master data, run AI normalization rules, load into Snowflake and DLQ',
                      'Upload multi-tab Excel FMDs and source extract, consolidate rules, stage to SAP BODS',
                    ].map((ex) => (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => setAiInput(ex)}
                        className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/[0.06] hover:bg-blue-50 hover:text-[#2D55F5] text-[11px] font-medium text-slate-700 dark:text-slate-300 cursor-pointer text-left"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                ) : (
                  askResult && (
                    <div className="p-3.5 rounded-xl bg-[#F0F5FF] border border-blue-200 space-y-1.5">
                      <div className="text-[11px] font-bold text-[#2D55F5]">
                        AI Summary · {askResult.target_table}-{askResult.target_field}
                      </div>
                      <p className="text-xs text-[#0A0F1F] leading-relaxed whitespace-pre-line">{askResult.answer}</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
