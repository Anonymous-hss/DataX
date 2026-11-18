import React, { useState, useEffect, useCallback, useRef } from 'react';
import DataXAppShell from '../components/common/DataXAppShell';
import { useNavigation } from '../context/NavigationContext';
import { fmdApi } from '../services/apiClient';
import FmdArchitectureBanner from '../components/mapping/FmdArchitectureBanner';
import FmdDocumentLibrary from '../components/mapping/FmdDocumentLibrary';
import FmdConsolidatedTable from '../components/mapping/FmdConsolidatedTable';
import FmdRecordWalkthrough from '../components/mapping/FmdRecordWalkthrough';
import FmdBestDemoScreen from '../components/mapping/FmdBestDemoScreen';
import FmdExcelViewerDrawer from '../components/mapping/FmdExcelViewerDrawer';

export default function MappingStudioPage({ onSwitchToMarketing } = {}) {
  const { navigateTo } = useNavigation();

  const [workspace, setWorkspace] = useState(null);
  const [selectedFieldKey, setSelectedFieldKey] = useState('MAKT-MAKTX');
  const [comparison, setComparison] = useState(null);
  const [askResult, setAskResult] = useState(null);
  const [simulation, setSimulation] = useState(null);

  const [xrefEnabled, setXrefEnabled] = useState(true);
  const [applyCmmsOverride, setApplyCmmsOverride] = useState(false);

  const [loading, setLoading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Excel Viewer Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [sheetData, setSheetData] = useState(null);

  const parseFieldKey = (key) => {
    const [tbl = 'MAKT', ...rest] = String(key || 'MAKT-MAKTX').split('-');
    return { targetTable: tbl, targetField: rest.join('-') || 'MAKTX' };
  };

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
      } catch (err) {
        setErrorMsg(err.message || 'Failed to compute FMD comparison.');
      }
    },
    [xrefEnabled, applyCmmsOverride]
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
        // Auto-seed the 4 synthetic demo FMDs on first visit so demo is immediately live
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
      if (res.comparison) {
        setComparison(res.comparison);
      }
      if (res.target_table && res.target_field) {
        const inferredKey = `${res.target_table}-${res.target_field}`;
        if (inferredKey !== selectedFieldKey) {
          setSelectedFieldKey(inferredKey);
        }
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

  const totalSourceRecords = (workspace?.source_datasets || []).reduce(
    (acc, ds) => acc + (ds.record_count || 0),
    0
  );

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

        {errorMsg && (
          <div className="px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-xs font-semibold text-rose-700 dark:text-rose-300">
            {errorMsg}
          </div>
        )}

        {/* Step 1: FMD Library + Local Computer Excel Upload */}
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

        {/* Steps 2, 3 & 4: Field Picker, Ask Business Question, Consolidated Result & Findings */}
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

        {/* Step 5: Per-Source Record Walkthrough Cards (SUSTAIN, ATLAS, CONS, CMMS/MAXIMO) */}
        <FmdRecordWalkthrough
          walkthroughCards={simulation?.walkthrough_cards || []}
          xrefEnabled={xrefEnabled}
          applyCmmsOverride={applyCmmsOverride}
          onToggleXref={handleToggleXref}
          onToggleCmmsOverride={handleToggleCmmsOverride}
        />

        {/* Step 6: Best Demo Screen + Preload Report + Z_ERRORLOG + BODS Export */}
        <FmdBestDemoScreen
          simulation={simulation}
          onExportBods={handleExportBods}
        />
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
