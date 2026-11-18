import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  GitCompare,
  Grid3X3,
  Activity,
  FolderOpen,
  X,
  Maximize2,
  Minimize2,
  PanelBottom,
  PictureInPicture2,
  GripHorizontal,
  Download,
  Lock,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import FmdConsolidatedTable from './FmdConsolidatedTable';
import FmdRecordWalkthrough from './FmdRecordWalkthrough';
import FmdBestDemoScreen from './FmdBestDemoScreen';
import FmdCoverageHeatmap from './FmdCoverageHeatmap';
import FmdVersionDiffPanel from './FmdVersionDiffPanel';
import FmdGovernanceAuditPanel from './FmdGovernanceAuditPanel';
import FmdDocumentLibrary from './FmdDocumentLibrary';

/**
 * FmdCanvasTelemetryDrawer - Resizable / Docked / Floating bottom telemetry drawer
 * modeled directly on CanvasTelemetryDrawer (Figma 02.14 Sandbox results · Consensus guard)
 * with 6 integrated FMD Mapping Studio tabs so users never have to leave the Visual Canvas.
 */
export default function FmdCanvasTelemetryDrawer({
  isOpen,
  onClose,
  activeTab,
  onChangeTab,
  height: externalHeight,
  onHeightChange,
  workspace,
  selectedFieldKey,
  onChangeField,
  comparison,
  askResult,
  asking,
  onAskQuestion,
  simulation,
  coverage,
  diffResult,
  hitlQueue,
  stagingCommits,
  auditData,
  activeRole,
  onRoleChange,
  xrefEnabled,
  applyCmmsOverride,
  onToggleXref,
  onToggleCmmsOverride,
  onInspectDocument,
  onSeedDemo,
  onWorkspaceUpdated,
  onDeleteDocument,
  onExportBods,
  onSeedR33,
  onRunDiff,
  onDecideHitl,
  onCommitStaging,
  onExtractBw,
  onVerifyAudit,
  onTraceRecord,
  activeTraceRecordId,
  busyAction,
  actionFeedback,
  actionError,
  loading,
}) {
  const [windowMode, setWindowMode] = useState('docked'); // 'docked' | 'floating'
  const [internalHeight, setInternalHeight] = useState(310);
  const drawerHeight = externalHeight ?? internalHeight;

  const setDrawerHeight = useCallback(
    (val) => {
      const next = typeof val === 'function' ? val(drawerHeight) : val;
      setInternalHeight(next);
      if (onHeightChange) onHeightChange(next);
    },
    [drawerHeight, onHeightChange]
  );

  const [isMaximized, setIsMaximized] = useState(false);
  const [floatPos, setFloatPos] = useState({ x: 64, y: 96, width: 1120, height: 500 });

  const resizingRef = useRef(false);
  const draggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, startHeight: 310, startX: 64, startY: 96 });

  const handleResizeStart = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      resizingRef.current = true;
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        startHeight: windowMode === 'floating' ? floatPos.height : drawerHeight,
        startX: floatPos.x,
        startY: floatPos.y,
      };
    },
    [windowMode, floatPos.height, floatPos.x, floatPos.y, drawerHeight]
  );

  const handleHeaderDragStart = useCallback(
    (e) => {
      if (windowMode !== 'floating') return;
      if (e.target.closest('button')) return;
      e.preventDefault();
      draggingRef.current = true;
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        startHeight: floatPos.height,
        startX: floatPos.x,
        startY: floatPos.y,
      };
    },
    [windowMode, floatPos]
  );

  useEffect(() => {
    const onMove = (e) => {
      if (resizingRef.current) {
        const deltaY = dragStartRef.current.y - e.clientY;
        const maxH = Math.round(window.innerHeight * 0.8);
        const nextH = Math.max(190, Math.min(maxH, dragStartRef.current.startHeight + deltaY));
        if (windowMode === 'floating') {
          setFloatPos((prev) => ({ ...prev, height: nextH }));
        } else {
          setDrawerHeight(nextH);
          setIsMaximized(nextH >= maxH - 24);
        }
      } else if (draggingRef.current && windowMode === 'floating') {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        const maxX = Math.max(20, window.innerWidth - floatPos.width - 20);
        const maxY = Math.max(20, window.innerHeight - 120);
        setFloatPos((prev) => ({
          ...prev,
          x: Math.max(16, Math.min(maxX, dragStartRef.current.startX + dx)),
          y: Math.max(16, Math.min(maxY, dragStartRef.current.startY + dy)),
        }));
      }
    };
    const onUp = () => {
      resizingRef.current = false;
      draggingRef.current = false;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [windowMode, floatPos.width, setDrawerHeight]);

  if (!isOpen) return null;

  const preloadReady = simulation?.summary?.preload_ready ?? 0;
  const stagedWarn = simulation?.summary?.staged_with_warning ?? 0;
  const totalStaged = preloadReady + stagedWarn;
  const zErrorCount = simulation?.summary?.z_errorlog_count ?? 0;
  const totalFields = coverage?.totals?.total_fields ?? 40;
  const divergentFields = coverage?.totals?.divergent_fields ?? 2;
  const findingsCount = comparison?.findings?.length ?? 0;
  const pendingRework = (hitlQueue?.items || []).filter(
    (i) => i.raw_status === 'REWORK' && i.decision !== 'APPROVED'
  ).length;
  const latestAuditHash =
    auditData?.chain?.[auditData.chain.length - 1]?.hash ||
    stagingCommits?.[0]?.sha256_receipt ||
    '828207d13c48bdb8116a81a5f9e2c10d';

  const layer1Score = totalFields > 0 ? Math.min(10, Math.round(((totalFields - divergentFields * 0.2) / totalFields) * 1000) / 100) : 9.9;
  const layer2Score = pendingRework > 0 ? 9.42 : 9.85;
  const layer3Score = zErrorCount === 0 ? 9.95 : 9.65;

  const tabs = [
    { id: 'consensus', label: 'Consensus & BODS', icon: ShieldCheck, badge: `${totalStaged} staged` },
    { id: 'rules', label: 'Consolidated Rules', icon: Sparkles, badge: `${findingsCount} findings` },
    { id: 'walkthrough', label: 'Record Walkthrough', icon: Activity, badge: `${simulation?.walkthrough_cards?.length || 4}` },
    { id: 'coverage', label: 'Coverage Heatmap', icon: Grid3X3, badge: `${totalFields} fields` },
    { id: 'diff', label: 'Version Diff', icon: GitCompare, badge: 'R3.2 → R3.3' },
    { id: 'governance', label: 'HITL & Audit', icon: Lock, badge: pendingRework > 0 ? `${pendingRework} REWORK` : 'Clear' },
    { id: 'library', label: 'FMD Library', icon: FolderOpen, badge: `${workspace?.documents?.length || 0} docs` },
  ];

  const containerStyle =
    windowMode === 'floating'
      ? {
          position: 'fixed',
          left: `${floatPos.x}px`,
          top: `${floatPos.y}px`,
          width: `${Math.min(floatPos.width, window.innerWidth - 32)}px`,
          height: `${floatPos.height}px`,
          zIndex: 55,
        }
      : {
          height: `${drawerHeight}px`,
        };

  return (
    <div
      style={containerStyle}
      className={`${
        windowMode === 'floating'
          ? 'rounded-2xl shadow-2xl border border-[#CDD2DE] dark:border-white/[0.15]'
          : 'w-full border-t border-[#E2E8F0] dark:border-white/[0.1] shadow-[0_-10px_30px_rgba(15,23,42,0.06)] shrink-0 z-30'
      } bg-white dark:bg-[#141418] flex flex-col overflow-hidden font-sans`}
    >
      {/* Top Resize Grip Handle */}
      <div
        onMouseDown={handleResizeStart}
        className="w-full h-2 cursor-ns-resize flex items-center justify-center hover:bg-blue-50/70 dark:hover:bg-white/[0.04] transition-colors shrink-0 group"
        title="Drag to resize telemetry drawer"
      >
        <GripHorizontal className="w-4 h-3 text-slate-300 group-hover:text-[#2D55F5]" />
      </div>

      {/* Header Row matching Figma 02.14: Run telemetry + KPI pills + window mode controls */}
      <div
        onMouseDown={handleHeaderDragStart}
        className={`px-4 sm:px-6 pb-2 flex flex-wrap items-center justify-between gap-2 border-b border-[#F1F3F7] dark:border-white/[0.08] shrink-0 ${
          windowMode === 'floating' ? 'cursor-move' : ''
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs sm:text-sm font-bold text-[#0A0F1F] dark:text-white tracking-tight">
            Run telemetry
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ECFDF5] text-[#127A52] border border-[#A7F3D0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A]" />
            {totalStaged} preload staged · {Math.round((totalStaged / Math.max(1, totalStaged + zErrorCount)) * 100)}%
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EFF6FF] text-[#2D55F5] border border-[#BFDBFE]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D55F5]" />
            {xrefEnabled ? 'XREF Override ON' : 'XREF Fallback'}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
            {zErrorCount} Z_ERRORLOG held
          </span>
          <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300">
            {selectedFieldKey}
          </span>
        </div>

        {/* Window Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setWindowMode((m) => (m === 'docked' ? 'floating' : 'docked'))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer"
            title={windowMode === 'docked' ? 'Undock to floating window' : 'Dock to bottom'}
          >
            {windowMode === 'docked' ? <PictureInPicture2 className="w-3.5 h-3.5" /> : <PanelBottom className="w-3.5 h-3.5" />}
          </button>
          {windowMode === 'docked' && (
            <button
              type="button"
              onClick={() => {
                if (isMaximized) {
                  setDrawerHeight(310);
                  setIsMaximized(false);
                } else {
                  setDrawerHeight(Math.round(window.innerHeight * 0.72));
                  setIsMaximized(true);
                }
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer"
              title={isMaximized ? 'Restore drawer height' : 'Maximize drawer'}
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer"
            title="Minimize telemetry drawer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs Row matching Figma 02.14 */}
      <div className="px-4 sm:px-6 flex items-center gap-1 overflow-x-auto border-b border-[#F1F3F7] dark:border-white/[0.08] bg-[#FAFBFD] dark:bg-white/[0.02] shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              className={`relative inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                active
                  ? 'text-[#2D55F5] dark:text-blue-400'
                  : 'text-[#5F6678] dark:text-slate-400 hover:text-[#0A0F1F] dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  active
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-[#2D55F5] dark:text-blue-300'
                    : 'bg-slate-100 dark:bg-white/[0.08] text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.badge}
              </span>
              {active && <span className="absolute bottom-0 inset-x-2 h-0.5 rounded-full bg-[#2D55F5]" />}
            </button>
          );
        })}
      </div>

      {/* Main Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 bg-[#F8FAFC]/60 dark:bg-[#0E1015]/60">
        {activeTab === 'consensus' && (
          <div className="space-y-4">
            {/* Figma 02.14: 3-Layer Consensus Guard Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Layer 1 */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#18181C] border border-[#E3E6EE] dark:border-white/[0.08] shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5F6678] dark:text-slate-400">
                    LAYER 1 · Deterministic FMD stats
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Verified
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-[#0A0F1F] dark:text-white">{layer1Score.toFixed(2)}</span>
                  <span className="text-xs text-slate-400 font-semibold">/ 10</span>
                </div>
                <p className="text-[11px] text-[#5F6678] dark:text-slate-400 mt-1">
                  {workspace?.documents?.length || 4} FMDs × 6 SAP tabs · {totalFields} fields · {divergentFields} divergent hotspots
                </p>
              </div>

              {/* Layer 2 */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#18181C] border border-[#E3E6EE] dark:border-white/[0.08] shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5F6678] dark:text-slate-400">
                    LAYER 2 · Multi-system rule voting
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#2D55F5] border border-blue-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2D55F5]" />
                    Converged
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-[#0A0F1F] dark:text-white">{layer2Score.toFixed(2)}</span>
                  <span className="text-xs text-slate-400 font-semibold">/ 10</span>
                </div>
                <p className="text-[11px] text-[#5F6678] dark:text-slate-400 mt-1">
                  4 systems (SUSTAIN, ATLAS, CONS, CMMS) · {comparison?.patterns?.length || 3} patterns · {findingsCount} findings
                </p>
              </div>

              {/* Layer 3 */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#18181C] border border-[#E3E6EE] dark:border-white/[0.08] shadow-2xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5F6678] dark:text-slate-400">
                    LAYER 3 · BODS Preload Gate
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      pendingRework > 0
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${pendingRework > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    {pendingRework > 0 ? `${pendingRework} REWORK Held` : 'Approved'}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-[#0A0F1F] dark:text-white">{layer3Score.toFixed(2)}</span>
                  <span className="text-xs text-slate-400 font-semibold">/ 10</span>
                </div>
                <p className="text-[11px] text-[#5F6678] dark:text-slate-400 mt-1">
                  {preloadReady} PRELOAD_READY · {stagedWarn} warnings · {zErrorCount} Z_ERRORLOG isolated
                </p>
              </div>
            </div>

            {/* 4 Domain Score Sub-Cards matching Figma 02.14 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  title: 'FMD Schema Integrity',
                  score: '10 / 10',
                  conf: 'conf. 96%',
                  badge: 'Pass',
                  detail: `All 6 TIME Material Master tabs parsed across ${workspace?.documents?.length || 4} FMDs.`,
                },
                {
                  title: 'Cross-System Divergence',
                  score: '9.1 / 10',
                  conf: 'conf. 92%',
                  badge: findingsCount > 0 ? 'Flagged' : 'Pass',
                  detail: `${findingsCount} rule discrepancies (CMMS 30-char, SUSTAIN REWORK) isolated.`,
                },
                {
                  title: 'Governance & RBAC',
                  score: '9.8 / 10',
                  conf: 'conf. 98%',
                  badge: 'Pass',
                  detail: `Active persona: ${activeRole} · SHA-256 ledger verified.`,
                },
                {
                  title: 'BODS Staging Quality',
                  score: '9.9 / 10',
                  conf: 'conf. 94%',
                  badge: 'Pass',
                  detail: `DuckDB XREF & TIME_PRELOAD_MAKT ready for SAP BODS load.`,
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="p-3 rounded-xl bg-white dark:bg-[#18181C] border border-[#E3E6EE] dark:border-white/[0.08]"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-[#0A0F1F] dark:text-white truncate">{card.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        card.badge === 'Pass'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {card.badge}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-extrabold text-[#0A0F1F] dark:text-white">{card.score}</span>
                    <span className="text-[10px] text-slate-400">{card.conf}</span>
                  </div>
                  <p className="text-[11px] text-[#5F6678] dark:text-slate-400 mt-1 leading-snug">{card.detail}</p>
                </div>
              ))}
            </div>

            {/* Best Demo Screen + TIME_PRELOAD_MAKT + Z_ERRORLOG + Compiled SQL */}
            <FmdBestDemoScreen
              simulation={simulation}
              onExportBods={onExportBods}
              onTraceRecord={onTraceRecord}
              activeTraceRecordId={activeTraceRecordId}
            />
          </div>
        )}

        {activeTab === 'rules' && (
          <FmdConsolidatedTable
            availableFields={workspace?.available_fields || []}
            selectedFieldKey={selectedFieldKey}
            onChangeField={onChangeField}
            comparison={comparison}
            askResult={askResult}
            asking={asking}
            onAskQuestion={onAskQuestion}
            onOpenSourceLink={onInspectDocument}
          />
        )}

        {activeTab === 'walkthrough' && (
          <FmdRecordWalkthrough
            walkthroughCards={simulation?.walkthrough_cards || []}
            xrefEnabled={xrefEnabled}
            applyCmmsOverride={applyCmmsOverride}
            onToggleXref={onToggleXref}
            onToggleCmmsOverride={onToggleCmmsOverride}
            onTraceRecord={onTraceRecord}
            activeTraceRecordId={activeTraceRecordId}
          />
        )}

        {activeTab === 'coverage' && (
          <FmdCoverageHeatmap
            coverage={coverage}
            onSelectCell={(docId, sheetName, rowNum) => onInspectDocument(docId, sheetName, rowNum)}
            onJumpToField={(fieldKey) => {
              onChangeField(fieldKey);
              onChangeTab('rules');
            }}
          />
        )}

        {activeTab === 'diff' && (
          <FmdVersionDiffPanel
            documents={workspace?.documents || []}
            diffResult={diffResult}
            loading={busyAction === 'diff'}
            onSeedR33={onSeedR33}
            onRunDiff={onRunDiff}
          />
        )}

        {activeTab === 'governance' && (
          <FmdGovernanceAuditPanel
            activeRole={activeRole}
            onRoleChange={onRoleChange}
            hitlQueue={hitlQueue}
            stagingCommits={stagingCommits}
            auditData={auditData}
            busyAction={busyAction}
            actionFeedback={actionFeedback}
            actionError={actionError}
            onDecideHitl={onDecideHitl}
            onCommitStaging={onCommitStaging}
            onExtractBw={onExtractBw}
            onVerifyAudit={onVerifyAudit}
          />
        )}

        {activeTab === 'library' && (
          <FmdDocumentLibrary
            documents={workspace?.documents || []}
            xrefs={workspace?.xrefs || []}
            sourceDatasets={workspace?.source_datasets || []}
            designSpecRef={workspace?.design_spec_ref}
            loading={loading}
            onSeedDemo={onSeedDemo}
            onWorkspaceUpdated={onWorkspaceUpdated}
            onInspectDocument={onInspectDocument}
            onDeleteDocument={onDeleteDocument}
          />
        )}
      </div>

      {/* Footer Seal & CTA Strip matching Figma 02.14 */}
      <div className="px-4 sm:px-6 py-2.5 border-t border-[#E3E6EE] dark:border-white/[0.08] bg-white dark:bg-[#141418] flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 text-[11px] text-[#5F6678] dark:text-slate-400 font-mono">
          <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>SHA-256 seal {String(latestAuditHash).slice(0, 22)}…</span>
          <button
            type="button"
            onClick={onVerifyAudit}
            className="text-[11px] font-sans font-semibold text-[#2D55F5] hover:underline cursor-pointer ml-1"
          >
            Verify ledger
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onChangeTab('consensus')}
            className="px-3 py-1.5 rounded-full border border-[#CDD2DE] dark:border-white/[0.15] bg-white dark:bg-[#18181C] hover:bg-slate-50 dark:hover:bg-white/[0.05] text-xs font-semibold text-[#0A0F1F] dark:text-white inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>Open Z_ERRORLOG ({zErrorCount})</span>
          </button>
          <button
            type="button"
            onClick={() => onExportBods('xlsx')}
            className="px-3 py-1.5 rounded-full border border-[#CDD2DE] dark:border-white/[0.15] bg-white dark:bg-[#18181C] hover:bg-slate-50 dark:hover:bg-white/[0.05] text-xs font-semibold text-[#0A0F1F] dark:text-white inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#5F6678]" />
            <span>Export BODS (.xlsx)</span>
          </button>
          <button
            type="button"
            onClick={() => onCommitStaging(true)}
            disabled={busyAction === 'commit'}
            className="px-4 py-1.5 rounded-full bg-[#2D55F5] hover:bg-[#1E44D6] text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{busyAction === 'commit' ? 'Committing…' : 'Commit to BODS Staging'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
