import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Grid3X3, GitCompare, ShieldCheck } from 'lucide-react';
import DataXAppShell from '../components/common/DataXAppShell';
import { useNavigation } from '../context/NavigationContext';
import { fmdApi } from '../services/apiClient';
import FmdArchitectureBanner from '../components/mapping/FmdArchitectureBanner';
import FmdDocumentLibrary from '../components/mapping/FmdDocumentLibrary';
import FmdConsolidatedTable from '../components/mapping/FmdConsolidatedTable';
import FmdRecordWalkthrough from '../components/mapping/FmdRecordWalkthrough';
import FmdBestDemoScreen from '../components/mapping/FmdBestDemoScreen';
import FmdExcelViewerDrawer from '../components/mapping/FmdExcelViewerDrawer';
import FmdCoverageHeatmap from '../components/mapping/FmdCoverageHeatmap';
import FmdVersionDiffPanel from '../components/mapping/FmdVersionDiffPanel';
import FmdGovernanceAuditPanel from '../components/mapping/FmdGovernanceAuditPanel';

export default function MappingStudioPage({ onSwitchToMarketing } = {}) {
  const { navigateTo } = useNavigation();

  const [studioTab, setStudioTab] = useState('studio'); // 'studio' | 'coverage' | 'diff' | 'governance'
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
  const [errorMsg, setErrorMsg] = useState('');

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
        setErrorMsg(err.message || 'Failed to compute FMD comparison.');
      }
    },
    [xrefEnabled, applyCmmsOverride, refreshPhase23State]
  );

  const initializedRef = useRef(false);

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
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
      setErrorMsg(err.message || 'Unable to connect to FMD Mapping Studio API.');
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
    setErrorMsg('');
    try {
      const seeded = await fmdApi.seedDemo();
      setWorkspace(seeded);
      setSelectedFieldKey('MAKT-MAKTX');
      setAskResult(null);
      setDiffResult(null);
      await refreshAnalysis('MAKT-MAKTX', xrefEnabled, applyCmmsOverride);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load demo FMDs.');
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
      setErrorMsg(err.message || 'Failed to delete document.');
    }
  };

  const handleChangeField = async (nextKey) => {
    setSelectedFieldKey(nextKey);
    setAskResult(null);
    await refreshAnalysis(nextKey, xrefEnabled, applyCmmsOverride);
  };

  const handleAskQuestion = async (questionText) => {
    setAsking(true);
    setErrorMsg('');
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
      setErrorMsg(err.message || 'Failed to analyze business question.');
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
      setErrorMsg(err.message || 'Failed to read Excel worksheet.');
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
      } else {
        setActionFeedback(
          `ARC-01 Staging Commit ${res.commit.commit_id} succeeded (${res.commit.mode}) · SHA-256: ${res.commit.sha256_receipt.slice(0, 16)}…`
        );
      }
      await refreshPhase23State();
    } catch (err) {
      setActionError(err.message || 'Staging DB commit failed.');
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

  const totalSourceRecords = (workspace?.source_datasets || []).reduce(
    (acc, ds) => acc + (ds.record_count || 0),
    0
  );

  const pendingReworkCount = (hitlQueue?.items || []).filter(
    (i) => i.raw_status === 'REWORK' && i.decision !== 'APPROVED'
  ).length;

  return (
    <DataXAppShell onSwitchToMarketing={onSwitchToMarketing}>
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 py-6 space-y-6 font-sans">
        {/* Interactive Client Architecture Diagram Banner */}
        <FmdArchitectureBanner
          docCount={workspace?.documents?.length || 0}
          xrefCount={workspace?.xrefs?.length || 0}
          sourceRecordCount={totalSourceRecords}
          stagedCount={(simulation?.summary?.preload_ready || 0) + (simulation?.summary?.staged_with_warning || 0)}
          errorLogCount={simulation?.summary?.z_errorlog_count || 0}
          onOpenCanvas={() => navigateTo('canvas')}
          onExportBods={handleExportBods}
        />

        {/* Phase 1 / 2 / 3 Studio Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-[#18181C] p-2 rounded-2xl border border-[#E3E6EE] dark:border-white/[0.08] shadow-2xs">
          {[
            { id: 'studio', label: 'Demo Studio (MAKT-MAKTX)', icon: Sparkles, badge: 'Phase 1' },
            { id: 'coverage', label: 'Coverage Heatmap (6 Tabs)', icon: Grid3X3, badge: `${coverage?.totals?.total_fields || 0} fields` },
            { id: 'diff', label: 'Version Diff (R3.2 → R3.3)', icon: GitCompare, badge: 'Phase 3' },
            { id: 'governance', label: 'HITL, RBAC & ARC-01 Staging', icon: ShieldCheck, badge: pendingReworkCount > 0 ? `${pendingReworkCount} REWORK` : 'Gate Clear' },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = studioTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStudioTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-[#0A0F1F] text-white shadow-xs'
                    : 'text-[#5F6678] dark:text-slate-300 hover:bg-[#F5F6FA] dark:hover:bg-white/[0.05]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#D4FF3A]' : 'text-[#2D55F5]'}`} />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    active
                      ? 'bg-[#D4FF3A] text-[#0A0F1F]'
                      : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {errorMsg && (
          <div className="px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-xs font-semibold text-rose-700 dark:text-rose-300">
            {errorMsg}
          </div>
        )}

        {studioTab === 'studio' && (
          <>
            <FmdDocumentLibrary
              documents={workspace?.documents || []}
              xrefs={workspace?.xrefs || []}
              sourceDatasets={workspace?.source_datasets || []}
              designSpecRef={workspace?.design_spec_ref}
              loading={loading}
              onSeedDemo={handleSeedDemo}
              onWorkspaceUpdated={handleWorkspaceUpdated}
              onInspectDocument={handleInspectDocument}
              onDeleteDocument={handleDeleteDocument}
            />

            <FmdConsolidatedTable
              availableFields={workspace?.available_fields || []}
              selectedFieldKey={selectedFieldKey}
              onChangeField={handleChangeField}
              comparison={comparison}
              askResult={askResult}
              asking={asking}
              onAskQuestion={handleAskQuestion}
              onOpenSourceLink={handleInspectDocument}
            />

            <FmdRecordWalkthrough
              walkthroughCards={simulation?.walkthrough_cards || []}
              xrefEnabled={xrefEnabled}
              applyCmmsOverride={applyCmmsOverride}
              onToggleXref={handleToggleXref}
              onToggleCmmsOverride={handleToggleCmmsOverride}
            />

            <FmdBestDemoScreen
              simulation={simulation}
              onExportBods={handleExportBods}
            />
          </>
        )}

        {studioTab === 'coverage' && (
          <FmdCoverageHeatmap
            coverage={coverage}
            onSelectCell={(docId, sheetName, rowNum) => handleInspectDocument(docId, sheetName, rowNum)}
            onJumpToField={(fieldKey) => {
              handleChangeField(fieldKey);
              setStudioTab('studio');
            }}
          />
        )}

        {studioTab === 'diff' && (
          <FmdVersionDiffPanel
            documents={workspace?.documents || []}
            diffResult={diffResult}
            loading={busyAction === 'diff'}
            activeRole={activeRole}
            onSeedR33={handleSeedR33}
            onRunDiff={handleRunDiff}
          />
        )}

        {studioTab === 'governance' && (
          <FmdGovernanceAuditPanel
            activeRole={activeRole}
            onChangeRole={setActiveRole}
            hitlQueue={hitlQueue}
            stagingCommits={stagingCommits}
            auditData={auditData}
            busyAction={busyAction}
            actionFeedback={actionFeedback}
            actionError={actionError}
            onDecideHitl={handleDecideHitl}
            onCommitStaging={handleCommitStaging}
            onExtractBw={handleExtractBw}
            onVerifyAudit={handleVerifyAudit}
          />
        )}
      </div>

      {/* Multi-Tab Excel FMD Sheet Viewer Drawer */}
      <FmdExcelViewerDrawer
        isOpen={drawerOpen}
        loading={drawerLoading}
        sheetData={sheetData}
        onSelectTab={(docId, tabName) => handleInspectDocument(docId, tabName, null)}
        onClose={() => setDrawerOpen(false)}
      />
    </DataXAppShell>
  );
}
