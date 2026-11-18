import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { fmdApi } from '../services/apiClient';
import FmdCanvasStudio from '../components/mapping/FmdCanvasStudio';
import FmdCanvasTelemetryDrawer from '../components/mapping/FmdCanvasTelemetryDrawer';
import FmdExcelViewerDrawer from '../components/mapping/FmdExcelViewerDrawer';

export default function MappingStudioPage() {
  const { navigateTo } = useNavigation();

  const [isTelemetryOpen, setIsTelemetryOpen] = useState(true);
  const [telemetryTab, setTelemetryTab] = useState('consensus'); // 'consensus' | 'rules' | 'walkthrough' | 'coverage' | 'diff' | 'governance' | 'library'
  const [telemetryHeight, setTelemetryHeight] = useState(290);
  const [traceRecordId, setTraceRecordId] = useState(null);

  const [activeRole, setActiveRole] = useState('Compliance Controller');

  const [workspace, setWorkspace] = useState(null);
  const [selectedFieldKey, setSelectedFieldKey] = useState('MAKT-MAKTX');
  const [comparison, setComparison] = useState(null);
  const [askResult, setAskResult] = useState(null);
  const [simulation, setSimulation] = useState(null);

  // Phase 2 & 3 state
  const [coverage, setCoverage] = useState(null);
  const [diffResult, setDiffResult] = useState(null);
  const [hitlQueue, setHitlQueue] = useState(null);
  const [stagingCommits, setStagingCommits] = useState([]);
  const [auditData, setAuditData] = useState(null);

  const [xrefEnabled, setXrefEnabled] = useState(true);
  const [applyCmmsOverride, setApplyCmmsOverride] = useState(false);

  const [loading, setLoading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [busyAction, setBusyAction] = useState('');
  const [actionFeedback, setActionFeedback] = useState('');
  const [actionError, setActionError] = useState('');

  // Excel Viewer Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [sheetData, setSheetData] = useState(null);

  const parseFieldKey = (key) => {
    const [tbl = 'MAKT', ...rest] = String(key || 'MAKT-MAKTX').split('-');
    return { targetTable: tbl, targetField: rest.join('-') || 'MAKTX' };
  };

  const refreshPhase23State = useCallback(async () => {
    try {
      const [covRes, appRes, stgRes, audRes] = await Promise.all([
        fmdApi.getCoverage(),
        fmdApi.getApprovals(),
        fmdApi.getStagingCommits(),
        fmdApi.getAuditChain(),
      ]);
      setCoverage(covRes);
      setHitlQueue(appRes);
      setStagingCommits(stgRes?.commits || []);
      setAuditData(audRes);
    } catch {
      // Non-blocking refresh
    }
  }, []);

  const refreshAnalysis = useCallback(
    async (fieldKey, xrefOn = xrefEnabled, cmmsOn = applyCmmsOverride) => {
      const { targetTable, targetField } = parseFieldKey(fieldKey);
      try {
        const [compRes, simRes] = await Promise.all([
          fmdApi.compare(targetTable, targetField),
          fmdApi.simulate({
            targetTable,
            targetField,
            xrefEnabled: xrefOn,
            applyCmmsOverride: cmmsOn,
          }),
        ]);
        setComparison(compRes);
        setSimulation(simRes);
        await refreshPhase23State();
      } catch (err) {
        setActionError(err.message || 'Failed to compute FMD comparison.');
      }
    },
    [xrefEnabled, applyCmmsOverride, refreshPhase23State]
  );

  const initializedRef = useRef(false);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setActionError('');
    try {
      const ws = await fmdApi.getWorkspace();
      setWorkspace(ws);
      if (ws?.documents?.length > 0) {
        await refreshAnalysis('MAKT-MAKTX', true, false);
      } else {
        const seeded = await fmdApi.seedDemo();
        setWorkspace(seeded);
        await refreshAnalysis('MAKT-MAKTX', true, false);
      }
    } catch (err) {
      setActionError(err.message || 'Unable to connect to FMD Mapping Studio API.');
    } finally {
      setLoading(false);
    }
  }, [refreshAnalysis]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    loadWorkspace();
  }, [loadWorkspace]);

  const handleSeedDemo = async () => {
    setLoading(true);
    setActionError('');
    setActionFeedback('');
    try {
      const seeded = await fmdApi.seedDemo();
      setWorkspace(seeded);
      setSelectedFieldKey('MAKT-MAKTX');
      setAskResult(null);
      setDiffResult(null);
      setTraceRecordId(null);
      await refreshAnalysis('MAKT-MAKTX', xrefEnabled, applyCmmsOverride);
      setActionFeedback('Reloaded 4 synthetic TIME R3.2 FMDs + 2 XREF tables.');
    } catch (err) {
      setActionError(err.message || 'Failed to load demo FMDs.');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkspaceUpdated = async (updatedWs) => {
    if (updatedWs) {
      setWorkspace(updatedWs);
    } else {
      const fresh = await fmdApi.getWorkspace();
      setWorkspace(fresh);
    }
    await refreshAnalysis(selectedFieldKey, xrefEnabled, applyCmmsOverride);
  };

  const handleDeleteDocument = async (docId) => {
    try {
      const res = await fmdApi.deleteFmd(docId);
      setWorkspace(res.workspace);
      await refreshAnalysis(selectedFieldKey, xrefEnabled, applyCmmsOverride);
    } catch (err) {
      setActionError(err.message || 'Failed to delete document.');
    }
  };

  const handleChangeField = async (nextKey) => {
    setSelectedFieldKey(nextKey);
    setAskResult(null);
    await refreshAnalysis(nextKey, xrefEnabled, applyCmmsOverride);
  };

  const handleAskQuestion = async (questionText) => {
    setAsking(true);
    setActionError('');
    const { targetTable, targetField } = parseFieldKey(selectedFieldKey);
    try {
      const res = await fmdApi.ask(questionText, targetTable, targetField);
      setAskResult(res);
      if (res.comparison) setComparison(res.comparison);
      if (res.target_table && res.target_field) {
        const inferredKey = `${res.target_table}-${res.target_field}`;
        if (inferredKey !== selectedFieldKey) setSelectedFieldKey(inferredKey);
      }
    } catch (err) {
      setActionError(err.message || 'Failed to analyze business question.');
    } finally {
      setAsking(false);
    }
  };

  const handleToggleXref = async () => {
    const nextVal = !xrefEnabled;
    setXrefEnabled(nextVal);
    await refreshAnalysis(selectedFieldKey, nextVal, applyCmmsOverride);
  };

  const handleToggleCmmsOverride = async () => {
    const nextVal = !applyCmmsOverride;
    setApplyCmmsOverride(nextVal);
    await refreshAnalysis(selectedFieldKey, xrefEnabled, nextVal);
  };

  const handleInspectDocument = async (docId, sheetName = 'Field Mapping - MAKT', highlightRow = null) => {
    setDrawerOpen(true);
    setDrawerLoading(true);
    try {
      const res = await fmdApi.getSheet(docId, sheetName, highlightRow);
      setSheetData(res);
    } catch (err) {
      setActionError(err.message || 'Failed to read Excel worksheet.');
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleExportBods = (format = 'xlsx') => {
    const url = fmdApi.getBodsExportUrl(format);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Phase 2 & 3 Action Handlers
  const handleSeedR33 = async () => {
    setBusyAction('diff');
    setActionError('');
    setActionFeedback('');
    try {
      const res = await fmdApi.seedR33Revision({ actor: 'Harshal Sawatkar', role: activeRole });
      if (res.workspace) setWorkspace(res.workspace);
      setDiffResult(res.diff);
      await refreshPhase23State();
      setActionFeedback('Generated SUSTAIN R3.3 revision and computed semantic field diff.');
    } catch (err) {
      setActionError(err.message || 'Failed to generate R3.3 revision.');
    } finally {
      setBusyAction('');
    }
  };

  const handleRunDiff = async (baseDocId, targetDocId) => {
    setBusyAction('diff');
    setActionError('');
    try {
      const res = await fmdApi.diffVersions({ baseDocId, targetDocId, actor: 'Harshal Sawatkar', role: activeRole });
      setDiffResult(res);
      await refreshPhase23State();
    } catch (err) {
      setActionError(err.message || 'Failed to diff selected workbooks.');
    } finally {
      setBusyAction('');
    }
  };

  const handleDecideHitl = async (uniqueId, decision, comment) => {
    setBusyAction('hitl');
    setActionError('');
    setActionFeedback('');
    try {
      const res = await fmdApi.decideApproval({
        uniqueId,
        decision,
        reviewer: 'Harshal Sawatkar',
        role: activeRole,
        comment,
      });
      setHitlQueue(res.queue);
      setActionFeedback(`Recorded ${decision} for ${uniqueId} as ${activeRole} (SHA-256 sealed).`);
      await refreshPhase23State();
    } catch (err) {
      setActionError(err.message || 'RBAC denied or approval failed.');
    } finally {
      setBusyAction('');
    }
  };

  const handleCommitStaging = async (enforceHitlGate) => {
    setBusyAction('commit');
    setActionError('');
    setActionFeedback('');
    try {
      const res = await fmdApi.commitStaging({
        actor: 'Harshal Sawatkar',
        role: activeRole,
        writeMode: 'append',
        enforceHitlGate,
      });
      if (res.status === 'blocked_by_hitl') {
        setActionError(res.message);
        setTelemetryTab('governance');
        setIsTelemetryOpen(true);
      } else {
        setActionFeedback(
          `ARC-01 Staging Commit ${res.commit.commit_id} succeeded (${res.commit.mode}) · SHA-256: ${res.commit.sha256_receipt.slice(0, 16)}…`
        );
      }
      await refreshPhase23State();
    } catch (err) {
      setActionError(err.message || 'Staging DB commit failed.');
      setTelemetryTab('governance');
      setIsTelemetryOpen(true);
    } finally {
      setBusyAction('');
    }
  };

  const handleExtractBw = async (tableName = 'MAKT', maxRows = 10) => {
    setBusyAction('bw');
    setActionError('');
    setActionFeedback('');
    try {
      const res = await fmdApi.extractBwSubset({
        tableName,
        maxRows,
        actor: 'Harshal Sawatkar',
        role: activeRole,
      });
      if (res.workspace) setWorkspace(res.workspace);
      if (res.simulation) setSimulation(res.simulation);
      setActionFeedback(
        `Extracted ${res.dataset.record_count} rule-filtered ${tableName} records from SAP BW HANA (columns: ${res.projected_fields.join(', ')}).`
      );
      await refreshPhase23State();
    } catch (err) {
      setActionError(err.message || 'BW HANA subset extraction failed.');
    } finally {
      setBusyAction('');
    }
  };

  const handleVerifyAudit = async () => {
    try {
      const ver = await fmdApi.verifyAuditChain();
      setAuditData((prev) => (prev ? { ...prev, verification: ver } : prev));
      setActionFeedback(
        ver.valid
          ? `SHA-256 Audit Ledger verified intact across ${ver.blocks_verified} cryptographic block(s).`
          : `Tamper warning at block #${ver.tampered_seq}: ${ver.reason}`
      );
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleOpenTelemetryTab = (tabId) => {
    setTelemetryTab(tabId);
    setIsTelemetryOpen(true);
  };

  const handleTraceRecord = (matnr) => {
    setTraceRecordId(String(matnr));
    setIsTelemetryOpen(false);
  };

  return (
    <div className="h-[calc(100vh-4rem)] w-full flex flex-col overflow-hidden bg-[#F8FAFC] dark:bg-[#0E1015] font-sans">
      <FmdCanvasStudio
        workspace={workspace}
        selectedFieldKey={selectedFieldKey}
        onChangeField={handleChangeField}
        comparison={comparison}
        askResult={askResult}
        asking={asking}
        onAskQuestion={handleAskQuestion}
        simulation={simulation}
        coverage={coverage}
        hitlQueue={hitlQueue}
        stagingCommits={stagingCommits}
        activeRole={activeRole}
        onRoleChange={setActiveRole}
        xrefEnabled={xrefEnabled}
        applyCmmsOverride={applyCmmsOverride}
        onToggleXref={handleToggleXref}
        onToggleCmmsOverride={handleToggleCmmsOverride}
        onSeedDemo={handleSeedDemo}
        onCommitStaging={handleCommitStaging}
        onExtractBw={handleExtractBw}
        onOpenTelemetryTab={handleOpenTelemetryTab}
        isTelemetryOpen={isTelemetryOpen}
        onToggleTelemetry={() => setIsTelemetryOpen((v) => !v)}
        traceRecordId={traceRecordId}
        onExitTrace={() => setTraceRecordId(null)}
        onBackToWorkflows={() => navigateTo('workflows')}
        busyAction={busyAction}
        loading={loading}
        actionFeedback={actionFeedback}
        actionError={actionError}
        onClearToast={() => {
          setActionFeedback('');
          setActionError('');
        }}
      />

      <FmdCanvasTelemetryDrawer
        isOpen={isTelemetryOpen}
        onClose={() => setIsTelemetryOpen(false)}
        activeTab={telemetryTab}
        onChangeTab={setTelemetryTab}
        height={telemetryHeight}
        onHeightChange={setTelemetryHeight}
        workspace={workspace}
        selectedFieldKey={selectedFieldKey}
        onChangeField={handleChangeField}
        comparison={comparison}
        askResult={askResult}
        asking={asking}
        onAskQuestion={handleAskQuestion}
        simulation={simulation}
        coverage={coverage}
        diffResult={diffResult}
        hitlQueue={hitlQueue}
        stagingCommits={stagingCommits}
        auditData={auditData}
        activeRole={activeRole}
        onRoleChange={setActiveRole}
        xrefEnabled={xrefEnabled}
        applyCmmsOverride={applyCmmsOverride}
        onToggleXref={handleToggleXref}
        onToggleCmmsOverride={handleToggleCmmsOverride}
        onInspectDocument={handleInspectDocument}
        onSeedDemo={handleSeedDemo}
        onWorkspaceUpdated={handleWorkspaceUpdated}
        onDeleteDocument={handleDeleteDocument}
        onExportBods={handleExportBods}
        onSeedR33={handleSeedR33}
        onRunDiff={handleRunDiff}
        onDecideHitl={handleDecideHitl}
        onCommitStaging={handleCommitStaging}
        onExtractBw={handleExtractBw}
        onVerifyAudit={handleVerifyAudit}
        onTraceRecord={handleTraceRecord}
        activeTraceRecordId={traceRecordId}
        busyAction={busyAction}
        actionFeedback={actionFeedback}
        actionError={actionError}
        loading={loading}
      />

      {/* Slide-over Excel Source Viewer Drawer */}
      <FmdExcelViewerDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        loading={drawerLoading}
        sheetData={sheetData}
        onSwitchSheet={(docId, sheetName) => handleInspectDocument(docId, sheetName, null)}
      />
    </div>
  );
}
