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
  Sliders,
  Upload,
  ShieldCheck,
  PanelBottom,
  Send,
  RefreshCw,
  FileSpreadsheet,
  Database,
  Loader2,
} from 'lucide-react';

// Figma Icons reused from WorkflowCanvasBuilder
import sourceIcon from '../../assets/icons/source.png';
import targetIcon from '../../assets/icons/target.png';
import quarantineIcon from '../../assets/icons/quarantine.png';
import connectIcon from '../../assets/icons/connect.png';
import sandboxIcon from '../../assets/icons/sandbox.png';
import liveIcon from '../../assets/icons/live.png';
import packIcon from '../../assets/icons/pack.png';

const INITIAL_FMD_NODES = [
  { id: 'fmd-library', type: 'source', kind: 'fmd_library', title: 'Excel FMD Library', x: 55, y: 40 },
  { id: 'bw-source', type: 'source', kind: 'bw_source', title: 'SAP BW HANA', x: 55, y: 230 },
  { id: 'fmd-consolidator', type: 'rules', kind: 'consolidator', title: 'FMD Rule Consolidator', x: 335, y: 135 },
  { id: 'xref-router', type: 'conditional', kind: 'xref_router', title: 'XREF & Override Router', x: 610, y: 135 },
  { id: 'hitl-gate', type: 'hitl', kind: 'hitl_gate', title: 'Controller gate', x: 885, y: 40 },
  { id: 'bods-preload', type: 'target', kind: 'bods_preload', title: 'SAP BODS Preload', x: 1160, y: 40 },
  { id: 'z-errorlog', type: 'quarantine', kind: 'z_errorlog', title: 'Z_ERRORLOG Store', x: 885, y: 230 },
];

const INITIAL_FMD_EDGES = [
  { id: 'e-fmd-cons', from: 'fmd-library', to: 'fmd-consolidator', label: 'FMDs + XREF' },
  { id: 'e-bw-cons', from: 'bw-source', to: 'fmd-consolidator', label: 'Legacy MAKT' },
  { id: 'e-cons-xref', from: 'fmd-consolidator', to: 'xref-router', label: '4 Rules' },
  { id: 'e-xref-hitl', from: 'xref-router', to: 'hitl-gate', label: 'TRUE', branch: 'TRUE' },
  { id: 'e-hitl-bods', from: 'hitl-gate', to: 'bods-preload', label: 'Approved' },
  { id: 'e-xref-dlq', from: 'xref-router', to: 'z-errorlog', label: 'FALSE', branch: 'FALSE', variant: 'orange' },
];

const RBAC_ROLES = [
  'Compliance Controller',
  'Data Steward',
  'Lead Data Engineer',
  'SAP Migration Architect',
  'Read-Only Auditor',
];

const PRESET_QUESTIONS = [
  'How is MAKT-MAKTX mapped across all systems?',
  'Which FMD rules have inconsistencies or REWORK status?',
  'Why does CMMS/MAXIMO truncate MAKTX to 30 characters?',
  'Compare MARC-WERKS plant mapping across SUSTAIN and ATLAS',
];

export default function FmdCanvasStudio({
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
  onSeedDemo,
  onCommitStaging,
  onExtractBw,
  onOpenTelemetryTab,
  isTelemetryOpen,
  onToggleTelemetry,
  traceRecordId,
  onExitTrace,
  onBackToWorkflows,
  busyAction,
  loading,
  actionFeedback,
  actionError,
  onClearToast,
}) {
  // Viewport pan & zoom
  const [zoom, setZoom] = useState(0.92);
  const [pan, setPan] = useState({ x: 24, y: 18 });
  const [activeTool, setActiveTool] = useState('move'); // 'move' | 'pan'
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const canvasRef = useRef(null);

  // Interactive graph state
  const [nodes, setNodes] = useState(INITIAL_FMD_NODES);
  const [edges, setEdges] = useState(INITIAL_FMD_EDGES);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const [drawingEdge, setDrawingEdge] = useState(null);

  // Dropdowns & Ask AI modal
  const [isFieldDropdownOpen, setIsFieldDropdownOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isAskAiOpen, setIsAskAiOpen] = useState(false);
  const [questionInput, setQuestionInput] = useState('');

  // 4-Stage Sandbox Execution State (Figma 02.13)
  const [isSimulatingRun, setIsSimulatingRun] = useState(false);
  const [simStage, setSimStage] = useState(0); // 1..4
  const [simElapsedMs, setSimElapsedMs] = useState(0);
  const [hasRunSandbox, setHasRunSandbox] = useState(true);

  const docCount = workspace?.documents?.length || 0;
  const xrefCount = workspace?.xrefs?.length || 0;
  const totalSourceRecords = (workspace?.source_datasets || []).reduce(
    (acc, ds) => acc + (ds.record_count || 0),
    0
  );
  const totalFields = coverage?.totals?.total_fields || 40;
  const divergentFields = coverage?.totals?.divergent_fields || 2;
  const patternsCount = comparison?.patterns?.length || 3;
  const findingsCount = comparison?.findings?.length || 0;
  const preloadReady = simulation?.summary?.preload_ready ?? 0;
  const stagedWarn = simulation?.summary?.staged_with_warning ?? 0;
  const totalStaged = preloadReady + stagedWarn;
  const zErrorCount = simulation?.summary?.z_errorlog_count ?? 0;
  const pendingRework = (hitlQueue?.items || []).filter(
    (i) => i.raw_status === 'REWORK' && i.decision !== 'APPROVED'
  ).length;
  const latestCommit = stagingCommits?.[0] || null;

  // Locate traced record across simulation preload_rows / z_errorlog / walkthrough_cards
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
      sourceSystem: preload?.source_system || errRow?.source_system || card?.source_system || 'LEGACY',
      originalDesc: preload?.original_description || card?.example_record?.maktx || '(blank)',
      finalDesc: preload?.final_time_description || '(routed to Z_ERRORLOG)',
      branch: preload?.execution_branch || errRow?.RULENAME || 'Rule evaluation',
      status: preload?.preload_status || (errRow ? 'Z_ERRORLOG' : 'PRELOAD_READY'),
      fmdId: preload?.fmd_unique_id || 'MM-MAKT-001',
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

  // Fit canvas automatically on mount and window resize
  useEffect(() => {
    const timer = setTimeout(() => handleFitToWindow(), 120);
    window.addEventListener('resize', handleFitToWindow);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleFitToWindow);
    };
  }, [handleFitToWindow]);

  // Keyboard shortcuts matching WorkflowCanvasBuilder (V, H, F, Esc)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.key === 'v' || e.key === 'V') setActiveTool('move');
      if (e.key === 'h' || e.key === 'H') setActiveTool('pan');
      if (e.key === 'f' || e.key === 'F') handleFitToWindow();
      if (e.key === 'a' || e.key === 'A') setIsAskAiOpen(true);
      if (e.key === 'Escape') {
        setSelectedNodeId(null);
        setIsFieldDropdownOpen(false);
        setIsRoleDropdownOpen(false);
        setIsAskAiOpen(false);
        if (traceRecordId && onExitTrace) onExitTrace();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleFitToWindow, traceRecordId, onExitTrace]);

  // Canvas mouse panning, node dragging, and edge drawing
  const handleCanvasMouseDown = (e) => {
    if (e.target.closest('.workflow-node-card')) return;
    setIsFieldDropdownOpen(false);
    setIsRoleDropdownOpen(false);
    setSelectedNodeId(null);
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleNodeMouseDown = (e, nodeId) => {
    if (activeTool === 'pan') return;
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
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
      setEdges((prev) => [
        ...prev,
        { id: `e-${drawingEdge.fromNodeId}-${toNodeId}-${Date.now()}`, from: drawingEdge.fromNodeId, to: toNodeId },
      ]);
    }
    setDrawingEdge(null);
  };

  useEffect(() => {
    const onMouseMove = (e) => {
      if (isPanning) {
        setPan({ x: e.clientX - panStartRef.current.x, y: e.clientY - panStartRef.current.y });
      } else if (draggingNodeId && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const worldX = (e.clientX - rect.left - pan.x) / zoom;
        const worldY = (e.clientY - rect.top - pan.y) / zoom;
        setNodes((prev) =>
          prev.map((n) =>
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
  }, [isPanning, draggingNodeId, drawingEdge, pan.x, pan.y, zoom]);

  // Run 4-Stage Sandbox Dry Run Animation (Figma 02.13 -> 02.14)
  const handleRunSandboxDryRun = async () => {
    if (isSimulatingRun) return;
    setIsSimulatingRun(true);
    setSimStage(1);
    setSimElapsedMs(0);

    const start = Date.now();
    const ticker = setInterval(() => {
      setSimElapsedMs(Date.now() - start);
    }, 80);

    try {
      await new Promise((r) => setTimeout(r, 380));
      setSimStage(2);
      await onChangeField(selectedFieldKey);
      await new Promise((r) => setTimeout(r, 380));
      setSimStage(3);
      await new Promise((r) => setTimeout(r, 380));
      setSimStage(4);
      await new Promise((r) => setTimeout(r, 320));
      setHasRunSandbox(true);
      onOpenTelemetryTab('consensus');
    } finally {
      clearInterval(ticker);
      setIsSimulatingRun(false);
      setSimStage(0);
    }
  };

  // Click any canvas node -> select it & open its matching telemetry workbench tab
  const handleNodeClick = (node) => {
    setSelectedNodeId(node.id);
    if (node.kind === 'fmd_library') onOpenTelemetryTab('library');
    else if (node.kind === 'bw_source') onOpenTelemetryTab('governance');
    else if (node.kind === 'consolidator') onOpenTelemetryTab('rules');
    else if (node.kind === 'xref_router') onOpenTelemetryTab('walkthrough');
    else if (node.kind === 'hitl_gate') onOpenTelemetryTab('governance');
    else if (node.kind === 'bods_preload') onOpenTelemetryTab('consensus');
    else if (node.kind === 'z_errorlog') onOpenTelemetryTab('consensus');
  };

  const getNode = (id) => nodes.find((n) => n.id === id);

  // Determine which node is currently executing in the 4-stage animation
  const isNodeStageActive = (node) => {
    if (!isSimulatingRun) return false;
    if (simStage === 1) return node.kind === 'fmd_library' || node.kind === 'bw_source';
    if (simStage === 2) return node.kind === 'consolidator';
    if (simStage === 3) return node.kind === 'xref_router' || node.kind === 'hitl_gate';
    if (simStage === 4) return node.kind === 'bods_preload' || node.kind === 'z_errorlog';
    return false;
  };

  // Build dynamic metadata for each of the 7 FMD canvas nodes
  const getNodeMeta = (node, idx) => {
    const active = isNodeStageActive(node);
    const base = {
      index: idx + 1,
      category: 'Node',
      statusText: active ? 'Running...' : hasRunSandbox ? 'Done' : 'Ready',
      statusClass: active
        ? 'bg-[#EBF0FF] text-[#2D55F5] border-[#2D55F5]/30 animate-pulse'
        : 'bg-[#ECFDF3] text-[#027A48] border-[#6CE9A6]/40',
      dotClass: active ? 'bg-[#2D55F5] animate-ping' : 'bg-[#12B76A]',
      subtitle: '',
      specs: [],
    };

    if (node.kind === 'fmd_library') {
      base.category = 'Source';
      base.subtitle = 'SUSTAIN · ATLAS · CONS · CMMS';
      base.statusText = active ? 'Parsing...' : `${docCount} FMDs`;
      base.statusClass = active
        ? 'bg-[#EBF0FF] text-[#2D55F5] border-[#2D55F5]/30 animate-pulse'
        : 'bg-[#ECFDF3] text-[#027A48] border-[#6CE9A6]/40';
      base.specs = [
        { label: 'Workbooks', value: `${docCount} R3.2 · ${xrefCount} XREF` },
        { label: 'Fields', value: `${totalFields} across 6 tabs` },
      ];
    } else if (node.kind === 'bw_source') {
      base.category = 'Source';
      base.subtitle = 'Legacy MAKT / MARC Extract';
      base.statusText = active ? 'Extracting...' : `${totalSourceRecords} Rows`;
      base.statusClass = active
        ? 'bg-[#EBF0FF] text-[#2D55F5] border-[#2D55F5]/30 animate-pulse'
        : 'bg-[#FEF6EE] text-[#B54708] border-[#FDB022]/40';
      base.dotClass = active ? 'bg-[#2D55F5] animate-ping' : 'bg-[#F79009]';
      base.specs = [
        { label: 'Table', value: selectedFieldKey.split('-')[0] || 'MAKT' },
        { label: 'Extract', value: `${totalSourceRecords} legacy rows` },
      ];
    } else if (node.kind === 'consolidator') {
      base.category = 'AI rules';
      base.subtitle = `${selectedFieldKey} · ${patternsCount} patterns`;
      base.statusText = active ? 'Analyzing...' : `${findingsCount} Findings`;
      base.statusClass = 'bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]/50';
      base.dotClass = 'bg-[#2D55F5]';
      base.specs = [
        { label: 'Target', value: selectedFieldKey },
        { label: 'Divergent', value: `${divergentFields} hotspots` },
      ];
    } else if (node.kind === 'xref_router') {
      base.category = 'Router';
      base.subtitle = 'MAKTX_XREF · CMMS Override';
      base.statusText = active ? 'Routing...' : xrefEnabled ? 'XREF ON' : 'Fallback';
      base.statusClass = xrefEnabled
        ? 'bg-[#ECFDF3] text-[#027A48] border-[#6CE9A6]/40'
        : 'bg-slate-100 text-slate-600 border-slate-200';
      base.dotClass = xrefEnabled ? 'bg-[#12B76A]' : 'bg-slate-400';
      base.specs = [
        { label: 'XREF Lookup', value: xrefEnabled ? 'HIT Active' : 'MISS Fallback' },
        { label: 'CMMS Override', value: applyCmmsOverride ? 'ON' : 'OFF (30c)' },
      ];
    } else if (node.kind === 'hitl_gate') {
      base.category = 'Review';
      base.subtitle = activeRole;
      base.statusText = pendingRework > 0 ? `${pendingRework} REWORK` : 'Gate Clear';
      base.statusClass =
        pendingRework > 0
          ? 'bg-[#FEF6EE] text-[#B54708] border-[#FDB022]/40'
          : 'bg-[#ECFDF3] text-[#027A48] border-[#6CE9A6]/40';
      base.dotClass = pendingRework > 0 ? 'bg-[#F79009]' : 'bg-[#12B76A]';
      base.specs = [
        { label: 'Pending', value: `${pendingRework} REWORK rule` },
        { label: 'Governance', value: 'RBAC + SHA-256' },
      ];
    } else if (node.kind === 'bods_preload') {
      base.category = 'Target';
      base.subtitle = 'TIME S/4HANA · Staging DB';
      base.statusText = latestCommit ? 'Committed' : `${totalStaged} Staged`;
      base.statusClass = 'bg-[#ECFDF3] text-[#027A48] border-[#6CE9A6]/40';
      base.dotClass = 'bg-[#12B76A]';
      base.specs = [
        { label: 'Table', value: 'time_preload_makt' },
        { label: 'Status', value: `${preloadReady} Ready · ${stagedWarn} Warn` },
      ];
    } else if (node.kind === 'z_errorlog') {
      base.category = 'DLQ';
      base.subtitle = 'BODS Exception Isolation';
      base.statusText = zErrorCount > 0 ? `${zErrorCount} Held` : '0 Errors';
      base.statusClass =
        zErrorCount > 0
          ? 'bg-rose-50 text-rose-700 border-rose-200'
          : 'bg-slate-100 text-slate-600 border-slate-200';
      base.dotClass = zErrorCount > 0 ? 'bg-rose-500' : 'bg-slate-400';
      base.specs = [
        { label: 'Table', value: 'z_errorlog' },
        { label: 'Logged', value: `${zErrorCount} exceptions` },
      ];
    }
    return base;
  };

  const availableFields = workspace?.available_fields || [];

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    const q = questionInput.trim();
    if (!q) return;
    await onAskQuestion(q);
  };

  return (
    <div className="relative flex-1 min-h-0 w-full flex flex-col bg-[#F8FAFC] dark:bg-[#0E1015] select-none overflow-hidden font-sans">
      {/* =========================================================================
          1. FULL-WIDTH SUB-HEADER BAR (Matching Figma 02.1 & 02.14 Canvas Header)
         ========================================================================= */}
      <div className="w-full bg-white dark:bg-[#18181C] border-b border-[#E3E6EE] dark:border-white/[0.08] px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2.5 shrink-0 z-30">
        {/* Left: Back button + Title + Live Status Pill + Subtitle */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBackToWorkflows}
            className="w-8 h-8 rounded-full border border-[#E3E6EE] dark:border-white/[0.08] bg-white dark:bg-[#18181C] hover:bg-[#F5F6FA] dark:hover:bg-white/[0.05] text-[#474E61] dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Back to workflows"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-[#0A0F1F] dark:text-white truncate">
                SAP Material Master · TIME R3.2 FMD Consolidation
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  isSimulatingRun || loading
                    ? 'bg-blue-50 text-[#2D55F5] border-blue-200'
                    : latestCommit
                      ? 'bg-emerald-50 text-[#127A52] border-emerald-200'
                      : 'bg-emerald-50 text-[#127A52] border-emerald-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSimulatingRun || loading ? 'bg-[#2D55F5] animate-ping' : 'bg-[#127A52]'
                  }`}
                />
                {isSimulatingRun
                  ? 'Running'
                  : latestCommit
                    ? `Staged (${latestCommit.commit_id})`
                    : 'Dry run passed'}
              </span>
            </div>
            <span className="text-[11px] text-[#8E95A9] dark:text-slate-400 font-medium truncate mt-0.5">
              {isSimulatingRun
                ? `Sandbox dry run · stage ${simStage} of 4 · evaluating DuckDB XREF rules`
                : `Sandbox dry run · ${docCount} FMD workbooks · ${xrefCount} XREF tables · ${totalFields} fields · ${selectedFieldKey} active`}
            </span>
          </div>
        </div>

        {/* Right: Field Picker + RBAC Role + FMD Library + Test in sandbox + Commit to BODS */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Field Selector Dropdown Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsFieldDropdownOpen((v) => !v);
                setIsRoleDropdownOpen(false);
              }}
              className="px-3 py-1.5 rounded-full border border-[#CDD2DE] dark:border-white/[0.12] bg-white dark:bg-[#18181C] hover:bg-[#F8FAFC] dark:hover:bg-white/[0.04] text-xs font-semibold text-[#0A0F1F] dark:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <img src={packIcon} alt="Field" className="w-3.5 h-3.5 object-contain" />
              <span className="font-mono">{selectedFieldKey}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isFieldDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isFieldDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-[320px] max-w-[92vw] bg-white dark:bg-[#18181C] border border-[#E2E8F0] dark:border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="px-4 py-2.5 border-b border-[#F1F3F7] dark:border-white/[0.08] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0A0F1F] dark:text-white">Target SAP Field</span>
                  <span className="text-[10px] font-semibold text-slate-400">{availableFields.length} fields</span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-[#F1F3F7] dark:divide-white/[0.06]">
                  {availableFields.map((f) => {
                    const fKey = `${f.target_table}-${f.target_field}`;
                    const selected = fKey === selectedFieldKey;
                    return (
                      <button
                        key={fKey}
                        type="button"
                        onClick={() => {
                          onChangeField(fKey);
                          setIsFieldDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/[0.04] cursor-pointer ${
                          selected ? 'bg-[#F0F5FF] dark:bg-[#2D55F5]/15 text-[#2D55F5] font-bold' : 'text-[#0A0F1F] dark:text-slate-200'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-mono font-semibold">{fKey}</div>
                          {f.description && (
                            <div className="text-[10px] text-slate-500 truncate">{f.description}</div>
                          )}
                        </div>
                        {selected && <Check className="w-3.5 h-3.5 text-[#2D55F5] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RBAC Persona Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsRoleDropdownOpen((v) => !v);
                setIsFieldDropdownOpen(false);
              }}
              className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                activeRole === 'Read-Only Auditor'
                  ? 'border-rose-300 bg-rose-50 text-rose-700'
                  : 'border-[#CDD2DE] dark:border-white/[0.12] bg-white dark:bg-[#18181C] text-[#0A0F1F] dark:text-white hover:bg-[#F8FAFC]'
              }`}
              title="Switch Governance RBAC Persona"
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
                        : 'text-[#0A0F1F] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    <span>{role}</span>
                    {activeRole === role && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* FMD Library / Upload Button */}
          <button
            type="button"
            onClick={() => onOpenTelemetryTab('library')}
            className="px-3 py-1.5 rounded-full border border-[#CDD2DE] dark:border-white/[0.12] bg-white dark:bg-[#18181C] hover:bg-slate-50 dark:hover:bg-white/[0.04] text-xs font-semibold text-[#0A0F1F] dark:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            title="Upload Excel FMDs, XREFs, or re-seed synthetic TIME R3.2 demo"
          >
            <Upload className="w-3.5 h-3.5 text-[#5F6678]" />
            <span className="hidden sm:inline">Upload FMDs</span>
          </button>

          {/* Test in sandbox button (triggers 4-stage animated run) */}
          <button
            type="button"
            onClick={handleRunSandboxDryRun}
            disabled={isSimulatingRun}
            className="px-3.5 py-1.5 rounded-full border border-[#CDD2DE] dark:border-white/[0.15] bg-white dark:bg-[#18181C] hover:bg-[#F8FAFC] dark:hover:bg-white/[0.04] text-xs font-semibold text-[#0A0F1F] dark:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <img src={sandboxIcon} alt="Sandbox" className={`w-3.5 h-3.5 object-contain ${isSimulatingRun ? 'animate-bounce' : ''}`} />
            <span>{isSimulatingRun ? 'Testing...' : 'Test in sandbox'}</span>
          </button>

          {/* Commit to BODS (Run live CTA) */}
          <button
            type="button"
            onClick={() => onCommitStaging(true)}
            disabled={busyAction === 'commit'}
            className="px-4 py-1.5 rounded-full bg-[#2D55F5] hover:bg-[#1E44D6] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <img src={liveIcon} alt="Commit" className="w-3.5 h-3.5 object-contain" />
            <span>{busyAction === 'commit' ? 'Committing...' : 'Commit to BODS'}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. MAIN DOTTED-GRID CANVAS VIEWPORT (Pan, Zoom, Draggable Nodes & Edges)
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
        {/* Top-Left Floating Helper Pill or Record Trace Banner (Matching Main-5.png) */}
        {tracedContext ? (
          <div className="absolute top-3.5 left-5 z-30 pointer-events-auto flex items-center gap-2.5 bg-[#0A0F1F] text-white px-3.5 py-1.5 rounded-full shadow-xl">
            <Zap className="w-3.5 h-3.5 text-[#D4FF3A]" />
            <span className="text-xs font-semibold">
              Tracing MATNR #{tracedContext.matnr} ({tracedContext.sourceSystem})
            </span>
            <button
              type="button"
              onClick={onExitTrace}
              className="ml-1 text-[11px] text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-0.5 rounded-full transition-colors cursor-pointer"
            >
              Exit trace
            </button>
          </div>
        ) : (
          <div className="absolute top-3.5 left-5 z-20 pointer-events-none">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-[#18181C]/95 backdrop-blur-md border border-[#E2E8F0] dark:border-white/[0.1] shadow-xs text-xs text-[#5F6678] dark:text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-[#2D55F5]" />
              <span>Click any node to inspect FMDs, XREF rules, or BODS staging. Drag nodes or ports to arrange.</span>
            </div>
          </div>
        )}

        {/* Top-Right Action Toast (Feedback / RBAC / HITL Gate Alerts) */}
        {(actionFeedback || actionError) && (
          <div
            className={`absolute top-3.5 right-5 z-30 max-w-md px-3.5 py-2 rounded-xl border shadow-lg text-xs font-semibold flex items-center gap-2.5 ${
              actionError
                ? 'bg-rose-50 border-rose-300 text-rose-800'
                : 'bg-emerald-50 border-emerald-300 text-emerald-800'
            }`}
          >
            <span className="leading-snug">{actionError || actionFeedback}</span>
            <button
              type="button"
              onClick={onClearToast}
              className="p-0.5 rounded hover:bg-black/5 cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
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
          {/* SVG Cubic Bezier Connectors + Edge Badges + Streaming Particles */}
          <svg className="absolute inset-0 w-[2400px] h-[1200px] pointer-events-none z-10 overflow-visible">
            <defs>
              <marker id="fmd-arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 2 L 7 5 L 0 8 z" fill="#3B82F6" />
              </marker>
              <marker id="fmd-arrow-gray" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
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

              // Compute edge badge text
              let pillText = null;
              let pillColors = { fill: '#FFFFFF', stroke: '#E2E8F0', text: '#0A0F1F' };
              if (edge.from === 'fmd-library' && edge.to === 'fmd-consolidator') {
                pillText = `${docCount} FMDs · ${xrefCount} XREF`;
              } else if (edge.from === 'bw-source' && edge.to === 'fmd-consolidator') {
                pillText = `${totalSourceRecords} rows`;
              } else if (edge.from === 'fmd-consolidator' && edge.to === 'xref-router') {
                pillText = `${patternsCount} patterns`;
              } else if (edge.from === 'hitl-gate' && edge.to === 'bods-preload') {
                pillText = `✓ ${totalStaged} staged`;
                pillColors = { fill: '#ECFDF5', stroke: '#6EE7B7', text: '#065F46' };
              } else if (isDlqEdge) {
                pillText = `⚠ ${zErrorCount} Z_ERRORLOG`;
                pillColors = { fill: '#FFFBEB', stroke: '#FCD34D', text: '#92400E' };
              }

              const pillW = pillText ? Math.max(66, pillText.length * 6.5 + 18) : 0;

              return (
                <g key={edge.id}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isDlqEdge ? '#CBD5E1' : '#3B82F6'}
                    strokeWidth={2}
                    strokeDasharray={isDlqEdge ? '5 4' : 'none'}
                    strokeLinecap="round"
                    markerEnd={isDlqEdge ? 'url(#fmd-arrow-gray)' : 'url(#fmd-arrow-blue)'}
                  />

                  {edge.branch === 'TRUE' && (
                    <g transform={`translate(${startX + 18}, ${startY - 22})`}>
                      <rect width="40" height="17" rx="8.5" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                      <text x="20" y="11.5" textAnchor="middle" fill="#5F6678" fontSize="9" fontWeight="bold">
                        CLEAN
                      </text>
                    </g>
                  )}

                  {edge.branch === 'FALSE' && (
                    <g transform={`translate(${startX + 18}, ${startY + 14})`}>
                      <rect width="46" height="17" rx="8.5" fill="#FFFBEB" stroke="#FDE68A" strokeWidth="1" />
                      <text x="23" y="11.5" textAnchor="middle" fill="#B45309" fontSize="9" fontWeight="bold">
                        ERROR
                      </text>
                    </g>
                  )}

                  {pillText && (
                    <g transform={`translate(${midX - pillW / 2}, ${midY - 10})`}>
                      <rect
                        width={pillW}
                        height="20"
                        rx="10"
                        fill={pillColors.fill}
                        stroke={pillColors.stroke}
                        strokeWidth="1"
                      />
                      <text
                        x={pillW / 2}
                        y="13.5"
                        textAnchor="middle"
                        fill={pillColors.text}
                        fontSize="10"
                        fontWeight="700"
                        fontFamily="monospace"
                      >
                        {pillText}
                      </text>
                    </g>
                  )}

                  {/* Animated Streaming Flow Particles during sandbox execution or commit */}
                  {(isSimulatingRun || busyAction === 'commit' || busyAction === 'bw') && (
                    <g>
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

          {/* =====================================================================
              7 OPERATIONAL FMD NODE CARDS (Exact Figma 02.1 / 02.14 Card Aesthetic)
             ===================================================================== */}
          {nodes.map((node, idx) => {
            const meta = getNodeMeta(node, idx);
            const isSelected = selectedNodeId === node.id;
            const isActiveStage = isNodeStageActive(node);

            const isDimmedInTrace =
              tracedContext &&
              ((tracedContext.hasError && node.kind === 'bods_preload') ||
                (!tracedContext.hasError && node.kind === 'z_errorlog'));
            const isHighlightedErrorInTrace =
              tracedContext && tracedContext.hasError && (node.kind === 'xref_router' || node.kind === 'z_errorlog');

            return (
              <div
                key={node.id}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  handleNodeClick(node);
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
                  isDimmedInTrace
                    ? 'opacity-35 border-slate-200 dark:border-white/10'
                    : isHighlightedErrorInTrace
                      ? 'border-2 border-rose-500 ring-4 ring-rose-500/20 shadow-xl'
                      : tracedContext
                        ? 'border-[#2D55F5] ring-2 ring-blue-500/20 shadow-lg'
                        : isActiveStage
                          ? 'border-[#2D55F5] ring-4 ring-[#2D55F5]/25 shadow-xl scale-[1.02]'
                          : isSelected
                            ? 'border-[#2D55F5] ring-3 ring-[#2D55F5]/20 shadow-lg'
                            : 'border-slate-200/90 dark:border-white/[0.08] hover:border-[#2D55F5]/60 hover:shadow-md'
                }`}
              >
                {/* Left Input Port */}
                {node.type !== 'source' && (
                  <div
                    onMouseUp={(e) => handleCompleteEdge(e, node.id)}
                    className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white dark:bg-[#18181C] border-2 border-slate-300 dark:border-slate-600 group-hover:border-[#2D55F5] flex items-center justify-center hover:scale-125 transition-all cursor-crosshair z-30 shadow-2xs"
                    title="Drop to connect edge here"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 group-hover:bg-[#2D55F5]" />
                  </div>
                )}

                {/* Right Output Port */}
                {node.type !== 'target' && node.type !== 'quarantine' && (
                  <div
                    onMouseDown={(e) => handleStartEdge(e, node.id)}
                    className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white dark:bg-[#18181C] border-2 border-slate-300 dark:border-slate-600 group-hover:border-[#2D55F5] flex items-center justify-center hover:scale-125 transition-all cursor-crosshair z-30 shadow-2xs"
                    title="Drag to connect to another node"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 group-hover:bg-[#2D55F5]" />
                  </div>
                )}

                {/* Top Row: Numbered Circle + Category + Status Pill */}
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

                {/* Middle Row: Squircle Figma Icon + Title + Subtitle */}
                <div className="flex items-start gap-2.5 my-1.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.08] flex items-center justify-center shrink-0">
                    {node.kind === 'fmd_library' ? (
                      <FileSpreadsheet className="w-5 h-5 text-[#2D55F5]" />
                    ) : node.kind === 'bw_source' ? (
                      <img src={sourceIcon} alt="BW Source" className="w-5 h-5 object-contain" />
                    ) : node.kind === 'consolidator' ? (
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
                    ) : node.kind === 'xref_router' ? (
                      <img src={connectIcon} alt="XREF Router" className="w-5 h-5 object-contain" />
                    ) : node.kind === 'hitl_gate' ? (
                      <GitBranch className="w-5 h-5 text-slate-700 dark:text-slate-200" />
                    ) : node.kind === 'bods_preload' ? (
                      <img src={targetIcon} alt="SAP BODS" className="w-5 h-5 object-contain" />
                    ) : node.kind === 'z_errorlog' ? (
                      <img src={quarantineIcon} alt="Z_ERRORLOG" className="w-5 h-5 object-contain" />
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

                {/* Bottom Row: Key-Value Specs */}
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

                {/* Trace Mode Floating Pills Beneath Each Node (Matching Main-5.png) */}
                {tracedContext && !isDimmedInTrace && (
                  <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap z-30 pointer-events-none">
                    {node.kind === 'bw_source' && (
                      <span className="bg-[#0A0F1F] text-white text-[10px] font-mono px-2.5 py-0.5 rounded-full shadow-md">
                        MATNR {tracedContext.matnr}
                      </span>
                    )}
                    {node.kind === 'fmd_library' && (
                      <span className="bg-[#0A0F1F] text-white text-[10px] font-mono px-2.5 py-0.5 rounded-full shadow-md">
                        {tracedContext.fmdId}
                      </span>
                    )}
                    {node.kind === 'consolidator' && (
                      <span className="bg-[#2D55F5] text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full shadow-md">
                        {tracedContext.sourceSystem} rule
                      </span>
                    )}
                    {node.kind === 'xref_router' && (
                      <span
                        className={`text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full shadow-md ${
                          tracedContext.hasError ? 'bg-rose-600' : 'bg-[#0A0F1F]'
                        }`}
                      >
                        {tracedContext.branch.slice(0, 26)}
                      </span>
                    )}
                    {node.kind === 'hitl_gate' && (
                      <span className="bg-[#0A0F1F] text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full shadow-md">
                        {tracedContext.status}
                      </span>
                    )}
                    {node.kind === 'bods_preload' && (
                      <span className="bg-emerald-600 text-white text-[10px] font-mono px-2.5 py-0.5 rounded-full shadow-md">
                        {tracedContext.finalDesc.slice(0, 24)}
                      </span>
                    )}
                    {node.kind === 'z_errorlog' && (
                      <span className="bg-rose-600 text-white text-[10px] font-mono px-2.5 py-0.5 rounded-full shadow-md">
                        {tracedContext.errorCategory || 'Z_ERRORLOG'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* =====================================================================
            3. EXECUTING PIPELINE 4-STAGE DRAWER (Matching Figma 02.13)
           ===================================================================== */}
        {isSimulatingRun && (
          <div className="absolute bottom-3 inset-x-4 sm:inset-x-6 z-40 bg-white/98 dark:bg-[#18181C]/98 backdrop-blur-md rounded-2xl border border-[#CDD2DE] dark:border-white/[0.12] shadow-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border border-slate-300 dark:border-white/20 flex items-center justify-center">
                  <Play className="w-2.5 h-2.5 fill-current text-slate-800 dark:text-white ml-0.5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0F172A] dark:text-white leading-tight">
                    Executing FMD pipeline · stage {simStage} of 4
                  </h4>
                  <p className="text-xs text-[#5F6678] dark:text-slate-400">
                    Evaluating {selectedFieldKey} rules in-process with DuckDB &amp; XREF tables. Nothing is written to SAP BODS yet.
                  </p>
                </div>
              </div>
              <span className="font-mono text-xs font-semibold text-[#5F6678]">
                {(simElapsedMs / 1000).toFixed(1)} s
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-[#F1F3F7] dark:border-white/[0.06]">
              {[
                { num: 1, title: '1. Parse FMD & XREF sheets', desc: `${docCount} workbooks · ${totalFields} fields` },
                { num: 2, title: '2. Consolidate & diff rules', desc: `${patternsCount} patterns for ${selectedFieldKey}` },
                { num: 3, title: '3. DuckDB XREF transform', desc: `${totalSourceRecords} BW HANA legacy rows` },
                { num: 4, title: '4. Stage Preload & ErrorLog', desc: 'TIME_PRELOAD_MAKT + Z_ERRORLOG' },
              ].map((st) => {
                const done = simStage > st.num;
                const running = simStage === st.num;
                return (
                  <div
                    key={st.num}
                    className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                      running
                        ? 'border-blue-200 bg-blue-50/40 dark:bg-blue-950/20'
                        : 'border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#18181C]'
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
            4. TRACE DOCK (Main-5.png) OR FLOATING CANVAS TOOLBARS (Figma 02.1)
           ===================================================================== */}
        {!isSimulatingRun && tracedContext ? (
          <div className="absolute bottom-3 inset-x-4 sm:inset-x-6 z-40 bg-white/98 dark:bg-[#18181C]/98 backdrop-blur-md rounded-2xl border border-[#CDD2DE] dark:border-white/[0.12] shadow-2xl p-3.5 flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <h3 className="text-xs sm:text-sm font-bold text-[#0A0F1F] dark:text-white">
                  Path of MATNR #{tracedContext.matnr} ({tracedContext.sourceSystem})
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    tracedContext.hasError
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {tracedContext.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenTelemetryTab('walkthrough')}
                  className="px-3 py-1 rounded-full border border-[#CDD2DE] text-xs font-semibold text-[#0A0F1F] dark:text-white hover:bg-slate-50 cursor-pointer"
                >
                  Open Walkthrough
                </button>
                <button
                  type="button"
                  onClick={onExitTrace}
                  className="px-3 py-1 rounded-full bg-[#0A0F1F] text-white text-xs font-semibold cursor-pointer"
                >
                  Exit Trace
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-white/[0.03] border border-[#E2E8F0] dark:border-white/[0.08]">
                <div className="font-bold text-[#0A0F1F] dark:text-white text-[11px]">1. BW Source</div>
                <div className="text-[10px] font-mono text-slate-600 dark:text-slate-300 mt-1 truncate">
                  {tracedContext.originalDesc}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-white/[0.03] border border-[#E2E8F0] dark:border-white/[0.08]">
                <div className="font-bold text-[#0A0F1F] dark:text-white text-[11px]">2. FMD Rule</div>
                <div className="text-[10px] font-mono text-[#2D55F5] mt-1 truncate">
                  {tracedContext.fmdId} ({tracedContext.sourceSystem})
                </div>
              </div>
              <div
                className={`p-2.5 rounded-xl border ${
                  tracedContext.hasError
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-[#F8FAFC] dark:bg-white/[0.03] border-[#E2E8F0] dark:border-white/[0.08]'
                }`}
              >
                <div className="font-bold text-[11px]">3. XREF / Router</div>
                <div className="text-[10px] font-mono mt-1 truncate">{tracedContext.branch}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-white/[0.03] border border-[#E2E8F0] dark:border-white/[0.08]">
                <div className="font-bold text-[#0A0F1F] dark:text-white text-[11px]">4. Governance Gate</div>
                <div className="text-[10px] text-slate-600 dark:text-slate-300 mt-1 truncate">
                  {pendingRework > 0 ? `${pendingRework} REWORK pending` : 'All rules cleared'}
                </div>
              </div>
              <div
                className={`p-2.5 rounded-xl border ${
                  tracedContext.hasError
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="font-bold text-[11px]">
                  5. {tracedContext.hasError ? 'Z_ERRORLOG' : 'TIME Preload'}
                </div>
                <div className="text-[10px] font-mono mt-1 truncate">
                  {tracedContext.hasError ? tracedContext.errorMessage || tracedContext.errorCategory : tracedContext.finalDesc}
                </div>
              </div>
            </div>
          </div>
        ) : (
          !isSimulatingRun && (
            <div className="absolute bottom-3 inset-x-4 sm:inset-x-6 flex items-center justify-between gap-2 pointer-events-none z-30">
              {/* Bottom-Left: Zoom Pill */}
              <div className="pointer-events-auto bg-white/95 dark:bg-[#18181C]/95 backdrop-blur-md rounded-2xl border border-[#CDD2DE] dark:border-white/[0.12] shadow-lg px-2.5 py-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#0F172A] dark:text-white">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.5, Math.round((z - 0.1) * 100) / 100))}
                  className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg text-slate-500 cursor-pointer"
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
                  className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg text-slate-500 cursor-pointer"
                  title="Zoom in"
                >
                  +
                </button>
                <span className="h-3.5 w-px bg-slate-200 dark:bg-white/[0.12]" />
                <button
                  type="button"
                  onClick={handleFitToWindow}
                  className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg text-slate-500 hover:text-[#2D55F5] cursor-pointer"
                  title="Fit canvas to window (F)"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Bottom-Center: Floating Tool Dock */}
              <div className="pointer-events-auto bg-white/95 dark:bg-[#18181C]/95 backdrop-blur-md rounded-2xl border border-[#CDD2DE] dark:border-white/[0.12] shadow-xl p-1 flex items-center gap-1 overflow-x-auto max-w-[70vw]">
                <button
                  type="button"
                  onClick={() => setActiveTool('move')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                    activeTool === 'move'
                      ? 'bg-[#2D55F5] text-white shadow-xs'
                      : 'text-[#0F172A] dark:text-slate-300 hover:bg-[#F1F3F7] dark:hover:bg-white/[0.06]'
                  }`}
                  title="Move nodes (V)"
                >
                  <Move className="w-3.5 h-3.5" />
                  <span>Move</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTool('pan')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                    activeTool === 'pan'
                      ? 'bg-[#2D55F5] text-white shadow-xs'
                      : 'text-[#0F172A] dark:text-slate-300 hover:bg-[#F1F3F7] dark:hover:bg-white/[0.06]'
                  }`}
                  title="Pan canvas (H)"
                >
                  <Hand className="w-3.5 h-3.5" />
                  <span>Pan</span>
                </button>

                <span className="h-4 w-px bg-slate-200 dark:bg-white/[0.12] mx-0.5" />

                <button
                  type="button"
                  onClick={onToggleXref}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                    xrefEnabled
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  title="Toggle XREF cross-reference override live"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>XREF: {xrefEnabled ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  type="button"
                  onClick={onToggleCmmsOverride}
                  className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                    applyCmmsOverride
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  title="Toggle CMMS 30-character design-spec override"
                >
                  <span>CMMS: {applyCmmsOverride ? 'ON' : '30c'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAskAiOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#6D28D9] dark:text-[#C4B5FD] bg-[#F5F3FF] dark:bg-[#7C3AED]/20 hover:bg-[#EDE9FE] border border-[#DDD6FE] cursor-pointer transition-all"
                  title="Ask AI about FMD rules (A)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <span>Ask AI</span>
                </button>

                <button
                  type="button"
                  onClick={onToggleTelemetry}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                    isTelemetryOpen
                      ? 'bg-[#0A0F1F] text-white'
                      : 'text-[#0F172A] dark:text-slate-200 hover:bg-[#F1F3F7] dark:hover:bg-white/[0.06]'
                  }`}
                  title="Toggle Run Telemetry & Workbench Drawer"
                >
                  <PanelBottom className="w-3.5 h-3.5" />
                  <span>Telemetry</span>
                </button>
              </div>

              {/* Bottom-Right: Canvas Radar Mini-Map */}
              <div className="hidden lg:flex pointer-events-auto bg-white/95 dark:bg-[#18181C]/95 backdrop-blur-md rounded-2xl border border-[#CDD2DE] dark:border-white/[0.12] shadow-lg p-2 flex-col gap-1 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-[10px] text-[#0F172A] dark:text-white flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#127A52] animate-pulse" />
                    Canvas radar · {nodes.length} nodes
                  </span>
                  <button
                    type="button"
                    onClick={onSeedDemo}
                    className="text-[10px] text-[#2D55F5] hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                    title="Reload 4 synthetic TIME R3.2 FMDs"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    Reset
                  </button>
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
          )
        )}

        {/* =====================================================================
            5. FLOATING ASK AI MODAL (Natural-Language FMD Assistant)
           ===================================================================== */}
        {isAskAiOpen && (
          <div
            className="absolute inset-0 z-50 bg-slate-900/25 backdrop-blur-[2px] flex items-center justify-center p-4"
            onClick={() => setIsAskAiOpen(false)}
          >
            <div
              className="w-full max-w-xl bg-white dark:bg-[#18181C] rounded-2xl border border-[#E2E8F0] dark:border-white/[0.12] shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-3.5 border-b border-[#F1F3F7] dark:border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0A0F1F] dark:text-white">Ask DataX FMD Copilot</h3>
                    <p className="text-[11px] text-slate-500">Query rules, inconsistencies, and XREF overrides across all 4 FMDs</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAskAiOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <form onSubmit={handleSubmitQuestion} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    placeholder="Ask e.g. How is MAKT-MAKTX mapped across all systems?"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#CDD2DE] dark:border-white/[0.15] bg-[#F8FAFC] dark:bg-white/[0.04] text-xs text-[#0A0F1F] dark:text-white focus:outline-none focus:border-[#2D55F5]"
                  />
                  <button
                    type="submit"
                    disabled={asking || !questionInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-[#2D55F5] hover:bg-[#1E44D6] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {asking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Ask</span>
                  </button>
                </form>

                <div className="flex flex-wrap gap-1.5">
                  {PRESET_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => {
                        setQuestionInput(q);
                        onAskQuestion(q);
                      }}
                      className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/[0.06] hover:bg-blue-50 hover:text-[#2D55F5] text-[11px] font-medium text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>

                {askResult && (
                  <div className="p-3.5 rounded-xl bg-[#F0F5FF] dark:bg-[#2D55F5]/10 border border-blue-200 dark:border-blue-800/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#2D55F5]">
                        AI Grounded Summary · {askResult.target_table}-{askResult.target_field}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAskAiOpen(false);
                          onOpenTelemetryTab('rules');
                        }}
                        className="text-[11px] font-semibold text-[#2D55F5] hover:underline cursor-pointer"
                      >
                        Open Consolidated Table →
                      </button>
                    </div>
                    <p className="text-xs text-[#0A0F1F] dark:text-slate-200 leading-relaxed whitespace-pre-line">
                      {askResult.answer}
                    </p>
                  </div>
                )}

                <div className="pt-2 border-t border-[#F1F3F7] dark:border-white/[0.08] flex items-center justify-between text-[11px] text-slate-500">
                  <span>Need fresh SAP BW HANA records?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onExtractBw('MAKT', 8);
                      setIsAskAiOpen(false);
                    }}
                    className="font-semibold text-[#2D55F5] hover:underline cursor-pointer"
                  >
                    Extract BW HANA MAKT subset →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
