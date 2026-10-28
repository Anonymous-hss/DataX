import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Database,
  CheckSquare,
  Square,
  Eraser,
  Wand2,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';
import {
  callAiRuleEngine,
  analyzeDataAndDraftPrompt,
  clientSideAnalyzeAndDraft,
  evaluateRuleAgainstSample,
} from '../../../utils/aiRuleSynthesizer';

export default function RulesModalPanel({
  rulesPrompt,
  setRulesPrompt,
  autoFixActive,
  setAutoFixActive,
  rulesGenerating,
  setRulesGenerating,
  srcTable,
  activeEngineKey,
  discoveredColumns = [],
  previewRows = [],
  isLiveSampleActive = false,
  rulesList = [],
  setRulesList,
  setActiveRules,
  showAddCustomRule,
  setShowAddCustomRule,
  newRuleField,
  setNewRuleField,
  newRuleSeverity,
  setNewRuleSeverity,
  newRuleCondition,
  setNewRuleCondition,
  handleAddNewCustomRule,
  handleToggleRuleItem,
  handleDeleteRuleItem,
}) {
  // Clean list of schema columns (excluding internal Mongo _id unless it's the only column)
  const availableColumns = useMemo(() => {
    const raw = Array.isArray(discoveredColumns) && discoveredColumns.length > 0
      ? discoveredColumns
      : (Array.isArray(previewRows) && previewRows.length > 0 && typeof previewRows[0] === 'object'
          ? Object.keys(previewRows[0])
          : []);
    const filtered = raw.filter((c) => c !== '_id');
    return filtered.length > 0 ? filtered : raw;
  }, [discoveredColumns, previewRows]);

  const [selectedColumns, setSelectedColumns] = useState(availableColumns);
  const [governanceMode, setGovernanceMode] = useState('balanced'); // 'balanced' | 'strict' | 'remediate'
  const [isDraftingPrompt, setIsDraftingPrompt] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [aiProfile, setAiProfile] = useState(null);
  const [lastAnalyzedSignature, setLastAnalyzedSignature] = useState('');

  // Keep selectedColumns synced when table or discoveredColumns changes
  useEffect(() => {
    setSelectedColumns(availableColumns);
    setIsManualMode(false);
  }, [srcTable, availableColumns.join(',')]);

  // Compute instant local profile whenever table, selectedColumns, or previewRows change
  const localDiagnostics = useMemo(() => {
    return clientSideAnalyzeAndDraft({
      tableName: srcTable,
      engine: activeEngineKey,
      columns: availableColumns,
      selectedColumns: selectedColumns.length > 0 ? selectedColumns : availableColumns,
      sampleRows: previewRows,
      governanceMode,
    });
  }, [srcTable, activeEngineKey, availableColumns, selectedColumns, previewRows, governanceMode]);

  // Automatically analyze table + selected columns + sample rows & draft prompt when context changes
  useEffect(() => {
    const sig = `${srcTable}::${selectedColumns.join(',')}::${previewRows?.length || 0}`;
    if (sig === lastAnalyzedSignature) return;
    setLastAnalyzedSignature(sig);

    setAiProfile(localDiagnostics);
    if (!isManualMode && localDiagnostics?.draftedPrompt) {
      setRulesPrompt(localDiagnostics.draftedPrompt);
    }
  }, [srcTable, selectedColumns, previewRows, localDiagnostics, isManualMode]);

  const handleToggleColumn = (col) => {
    setIsManualMode(false);
    setSelectedColumns((prev) => {
      if (prev.includes(col)) {
        return prev.length > 1 ? prev.filter((c) => c !== col) : prev;
      }
      return [...prev, col];
    });
  };

  const handleSelectAllColumns = () => {
    setIsManualMode(false);
    setSelectedColumns(availableColumns);
  };

  const handleAutoDraftPrompt = async () => {
    setIsManualMode(false);
    setIsDraftingPrompt(true);
    try {
      const profile = await analyzeDataAndDraftPrompt({
        tableName: srcTable,
        engine: activeEngineKey,
        columns: availableColumns,
        selectedColumns: selectedColumns.length > 0 ? selectedColumns : availableColumns,
        sampleRows: previewRows,
        governanceMode,
      });
      setAiProfile(profile);
      if (profile?.draftedPrompt) {
        setRulesPrompt(profile.draftedPrompt);
      }
    } finally {
      setIsDraftingPrompt(false);
    }
  };

  const handleEraseAndWriteManually = () => {
    setIsManualMode(true);
    setRulesPrompt('');
  };

  const handleAppendChip = (clause) => {
    setRulesPrompt((prev) => {
      const trimmed = (prev || '').trim();
      if (!trimmed) return clause;
      if (trimmed.toLowerCase().includes(clause.toLowerCase().slice(0, 24))) return trimmed;
      const sep = trimmed.endsWith('.') ? ' ' : '. ';
      return `${trimmed}${sep}${clause}`;
    });
  };

  const handleGenerateRulesFromPrompt = async () => {
    const effectivePrompt = (rulesPrompt || '').trim() || localDiagnostics.draftedPrompt;
    if (!rulesPrompt?.trim() && effectivePrompt) {
      setRulesPrompt(effectivePrompt);
    }
    setRulesGenerating(true);
    try {
      const targetCols = selectedColumns.length > 0 ? selectedColumns : availableColumns;
      const gen = await callAiRuleEngine({
        prompt: effectivePrompt,
        tableName: srcTable,
        engine: activeEngineKey,
        columns: availableColumns,
        selectedColumns: targetCols,
        sampleRows: previewRows,
        governanceMode,
      });
      if (gen?.length) {
        setRulesList(gen);
        setActiveRules(gen);
      }
    } finally {
      setRulesGenerating(false);
    }
  };

  const activeAnomalies = aiProfile?.anomalies || localDiagnostics?.anomalies || [];
  const activeChips = aiProfile?.promptChips || localDiagnostics?.promptChips || [];

  return (
    <div className="space-y-4">
      {/* =====================================================================
          STEP 1: AI TABLE, COLUMN & LIVE SAMPLE DATA ANALYZER
         ===================================================================== */}
      <div className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/90 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center shadow-2xs">
              1
            </span>
            <span className="text-xs font-bold text-slate-900">
              AI Schema & Live Data Analysis Scope
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
              <Database className="w-3 h-3 text-blue-600" />
              <span className="font-mono font-bold text-slate-900">{srcTable || 'source_table'}</span>
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                isLiveSampleActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              {previewRows?.length || 0} {isLiveSampleActive ? 'Live Rows Profiled' : 'Sample Rows Profiled'}
            </span>
          </div>
        </div>

        {/* Interactive Column Selector Pills */}
        {availableColumns.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-600">
                Select Columns for AI Prompt Drafting & Rule Synthesis ({selectedColumns.length} of {availableColumns.length} selected):
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllColumns}
                  className="text-[10px] font-bold text-purple-600 hover:text-purple-800 cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsManualMode(false);
                    setSelectedColumns([availableColumns[0]]);
                  }}
                  className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Primary Key Only
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availableColumns.map((col) => {
                const isSelected = selectedColumns.includes(col);
                const hasAnomaly = activeAnomalies.some((a) => a.column?.toLowerCase() === col.toLowerCase());
                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => handleToggleColumn(col)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-3 h-3 shrink-0" />
                    ) : (
                      <Square className="w-3 h-3 shrink-0 opacity-60" />
                    )}
                    <span>{col}</span>
                    {hasAnomaly && (
                      <span
                        title="AI detected dirty data in this column"
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-amber-300' : 'bg-amber-500'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Detected Data Anomalies in Sample Rows */}
        {activeAnomalies.length > 0 && (
          <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                AI Data Profiler Discovered {activeAnomalies.length} Anomaly Pattern{activeAnomalies.length === 1 ? '' : 's'} in Selected Columns
              </span>
              <span className="text-[10px] font-medium text-amber-700">
                Auto-included in drafted prompt
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
              {activeAnomalies.map((anom, idx) => (
                <button
                  key={`${anom.column}-${idx}`}
                  type="button"
                  onClick={() =>
                    handleAppendChip(`${anom.column}: remediate ${anom.issue.toLowerCase()}.`)
                  }
                  title={`Sample value: ${anom.sampleValue} — Click to emphasize in prompt`}
                  className="px-2 py-0.5 rounded bg-white border border-amber-200/90 text-[10px] text-slate-700 flex items-center gap-1 hover:border-amber-400 cursor-pointer"
                >
                  <span className="font-mono font-bold text-amber-900">{anom.column}:</span>
                  <span className="truncate max-w-[210px]">{anom.issue}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          STEP 2: DYNAMIC NATURAL LANGUAGE PROMPT STUDIO & RULE GENERATION
         ===================================================================== */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <label className="text-xs font-bold text-slate-900 flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center shadow-2xs">
              2
            </span>
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>AI-Drafted Natural Language Rules Prompt</span>
            {isManualMode ? (
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Manual Prompt Mode
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Auto-Drafted from {srcTable}
              </span>
            )}
          </label>

          {/* Prompt Action Controls: Auto-Draft with AI vs Erase & Write Manually */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleAutoDraftPrompt}
              disabled={isDraftingPrompt}
              className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
              title="Analyze selected columns and sample data to auto-draft prompt"
            >
              <Wand2 className={`w-3 h-3 ${isDraftingPrompt ? 'animate-spin' : ''}`} />
              {isDraftingPrompt ? 'Analyzing Data...' : 'Auto-Draft with AI'}
            </button>
            <button
              type="button"
              onClick={handleEraseAndWriteManually}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              title="Erase prompt and write your own custom validation prompt manually"
            >
              <Eraser className="w-3 h-3" />
              Erase & Write Manually
            </button>
          </div>
        </div>

        <textarea
          rows={3}
          value={rulesPrompt}
          onChange={(e) => {
            setIsManualMode(true);
            setRulesPrompt(e.target.value);
          }}
          placeholder={`Write your custom rules prompt for ${srcTable || 'this table'} (e.g., "${selectedColumns[0] || 'id'} is mandatory and unique. ${selectedColumns[1] || 'email'} must be valid format and trimmed...")`}
          className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/25 focus:border-purple-500 transition-all"
        />

        {/* AI Smart Suggestion Chips */}
        {activeChips.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-500 block">
              AI Smart Enhancements (click to append constraint to prompt):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {activeChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAppendChip(chip.clause)}
                  className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200 hover:border-purple-200 text-[10px] font-semibold transition-colors cursor-pointer"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Governance Preset & Primary Generate Rules Action Bar */}
        <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Auto-Fix Remediation Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoFixActive}
                onChange={(e) => setAutoFixActive(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span className="text-xs font-semibold text-slate-700">
                Enable Autonomous Auto-Fix
              </span>
            </label>

            {/* AI Governance Strictness Mode */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <SlidersHorizontal className="w-3 h-3 text-slate-500 ml-1.5" />
              {[
                { id: 'balanced', label: 'Balanced' },
                { id: 'strict', label: 'Strict Quarantine' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setGovernanceMode(m.id)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                    governanceMode === m.id
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerateRulesFromPrompt}
            disabled={rulesGenerating}
            className="px-4 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
          >
            {rulesGenerating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {rulesGenerating ? 'Generating Rules from Prompt...' : 'Generate Rules from Prompt'}
          </button>
        </div>
      </div>

      {/* =====================================================================
          ACTIVE RULES CATALOG (WITH LIVE SAMPLE IMPACT SIMULATION)
         ===================================================================== */}
      <div className="space-y-2 pt-3 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">
              Generated & Active Rules ({rulesList.filter((r) => r.selected !== false).length} of {rulesList.length} enabled)
            </span>
          </div>
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
                placeholder={`Target Field (e.g. ${selectedColumns[0] || 'email'})`}
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
              placeholder={`Condition Formula (e.g. ${selectedColumns[0] || 'quantity'} > 0)`}
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
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {rulesList.map((rule) => {
            const isChecked = rule.selected !== false && rule.enabled !== false;
            const impact = evaluateRuleAgainstSample(rule, previewRows);
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
                    <div className="flex items-center gap-1.5 shrink-0">
                      {impact && (
                        <span
                          title={`Evaluated against ${impact.total} preview rows`}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 border ${
                            impact.failCount > 0
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {impact.failCount > 0 ? (
                            <>
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                              {impact.failCount}/{impact.total} Caught
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              {impact.passCount}/{impact.total} Pass
                            </>
                          )}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                          rule.severity === 'Critical'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {rule.severity || 'Critical'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                      {rule.field || rule.column || 'GENERAL'}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500 truncate">
                      {rule.condition || rule.code}
                    </span>
                  </div>
                  {rule.desc && (
                    <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                      {rule.desc}
                    </p>
                  )}
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
  );
}
