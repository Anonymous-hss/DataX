import React, { useState, useEffect } from 'react';
import { 
  FileCode2, 
  Sparkles, 
  FlaskConical, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import { useRuleEngine } from '../context/RuleEngineContext';
import DataXHeader from '../components/cleanflow/DataXHeader';
import PipelineFlowNodes from '../components/cleanflow/PipelineFlowNodes';
import DescribeRulesForm from '../components/cleanflow/DescribeRulesForm';
import GeneratedRulesList from '../components/cleanflow/GeneratedRulesList';
import { callAiRuleEngine, getDefaultPromptForTable } from '../utils/aiRuleSynthesizer';

export default function GenerateRulesPage({ onSwitchToMarketing } = {}) {
  const { navigateTo } = useNavigation();
  const { 
    sourceConfig, 
    activeRules, 
    setActiveRules, 
    activeThread 
  } = useRuleEngine();

  const currentTable = sourceConfig?.table || (sourceConfig?.selectedTables?.[0]) || '0PUR_C01';
  const defaultCols = sourceConfig?.discoveredColumns?.length 
    ? sourceConfig.discoveredColumns 
    : [];

  const defaultPrompt = getDefaultPromptForTable(currentTable, sourceConfig?.engine, defaultCols);

  const [columns, setColumns] = useState(defaultCols);
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [isGenerating, setIsGenerating] = useState(false);
  const [rules, setRules] = useState(activeRules || []);
  const [aiEngineLabel, setAiEngineLabel] = useState('Azure OpenAI (gpt-5-mini)');

  useEffect(() => {
    if (sourceConfig?.discoveredColumns?.length) {
      setColumns(sourceConfig.discoveredColumns);
    }
  }, [sourceConfig?.discoveredColumns]);

  useEffect(() => {
    if (sourceConfig?.table) {
      const generatedPrompt = getDefaultPromptForTable(sourceConfig.table, sourceConfig.engine, sourceConfig.discoveredColumns);
      setPrompt(generatedPrompt);

      // Check if current activeRules actually match the selected table columns
      const cols = (sourceConfig.discoveredColumns || []).map(c => String(c).toUpperCase());
      const currentRuleFields = (activeRules || []).map(r => String(r.field || '').toUpperCase());
      const isMismatched = cols.length > 0 && currentRuleFields.some(f => f && !cols.includes(f) && !f.includes('/'));

      if (isMismatched || !activeRules || activeRules.length === 0) {
        // Auto-generate fresh rules for the new table!
        setIsGenerating(true);
        callAiRuleEngine({
          prompt: generatedPrompt,
          columns: sourceConfig.discoveredColumns || defaultCols,
          tableName: sourceConfig.table,
          engine: sourceConfig.engine || 'sap_bw'
        }).then(newRules => {
          if (newRules && newRules.length > 0) {
            setRules(newRules);
            setActiveRules(newRules);
            if (newRules[0]?.badge) setAiEngineLabel(newRules[0].badge);
          }
        }).catch(err => {
          console.warn('Auto rule generation error:', err);
        }).finally(() => {
          setIsGenerating(false);
        });
      }
    }
  }, [sourceConfig?.table]);

  useEffect(() => {
    if (activeRules?.length) {
      setRules(activeRules);
    }
  }, [activeRules]);

  const handleToggleRule = (id) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: r.selected === undefined ? false : !r.selected } : r))
    );
  };

  const handleToggleAll = () => {
    const allSelected = rules.every((r) => r.selected !== false);
    setRules((prev) => prev.map((r) => ({ ...r, selected: !allSelected })));
  };

  const handleAddRule = (newRule) => {
    setRules((prev) => [newRule, ...prev]);
  };

  const handleUpdateRule = (updatedRule) => {
    setRules((prev) =>
      prev.map((r) => (r.id === updatedRule.id ? updatedRule : r))
    );
  };

  const handleDeleteRule = (id) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const handleRemoveColumn = (colToRemove) => {
    setColumns((prev) => prev.filter((c) => c !== colToRemove));
  };

  const handleAddColumn = (colToAdd) => {
    if (!columns.includes(colToAdd)) {
      setColumns((prev) => [...prev, colToAdd]);
    }
  };

  const handleRegenerate = async () => {
    setIsGenerating(true);
    try {
      const generated = await callAiRuleEngine({
        prompt,
        columns,
        tableName: sourceConfig?.table || currentTable,
        engine: sourceConfig?.engine || 'sap_bw'
      });

      if (generated && generated.length > 0) {
        setRules(generated);
        setActiveRules(generated);
        if (generated[0]?.badge) {
          setAiEngineLabel(generated[0].badge);
        }
      }
    } catch (e) {
      console.warn('AI generation error:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveRules = () => {
    setActiveRules(rules);
    navigateTo('test-in-sandbox');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col antialiased">
      {/* Top Header & Subheader */}
      <DataXHeader
        currentPage="04"
        onBack={() => navigateTo('connect-source')}
        onDryRun={() => navigateTo('running-dry-run')}
        onRunLive={() => navigateTo('dry-run-results')}
      />

      {/* 3 Pipeline Flow Nodes */}
      <PipelineFlowNodes currentStep="04" />

      {/* Main Card: Step 2 of 3 · AI rules / Create rules with AI */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          
          {/* Step Header */}
          <div className="p-6 pb-4 border-b border-slate-100">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <FileCode2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Step 2 of 3 · AI rules</div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight font-display">
                  Create rules with AI
                </h2>
              </div>
            </div>

            {/* Subtabs: Generate rules | Test in sandbox */}
            <div className="flex items-center gap-2 mt-5">
              <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 transition-all shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Generate rules
              </button>
              <button 
                onClick={handleSaveRules}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <FlaskConical className="w-3.5 h-3.5 text-slate-400" />
                Test in sandbox
                <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-mono font-medium">
                  {rules.length} rules
                </span>
              </button>
            </div>
          </div>

          {/* 2-Column Rules Workspace */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
            
            {/* Left Column: Input Table, Columns & Description */}
            <DescribeRulesForm
              tableName={sourceConfig?.table || 'No table selected'}
              dbName={sourceConfig?.database || 'No database configured'}
              columns={columns}
              onRemoveColumn={handleRemoveColumn}
              onAddColumn={handleAddColumn}
              prompt={prompt}
              onPromptChange={setPrompt}
              isGenerating={isGenerating}
              onRegenerate={handleRegenerate}
            />

            {/* Right Column: Generated rules list with checkboxes & actions */}
            <GeneratedRulesList
              rules={rules}
              columns={columns}
              onToggleRule={handleToggleRule}
              onToggleAll={handleToggleAll}
              onAddRule={handleAddRule}
              onUpdateRule={handleUpdateRule}
              onDeleteRule={handleDeleteRule}
            />

          </div>

          {/* Bottom Footer Bar */}
          <div className="bg-slate-50/70 border-t border-slate-200/80 px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Critical rules send failing rows to quarantine. Warning rules are fixed automatically when possible.</span>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleSaveRules}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <FlaskConical className="w-3.5 h-3.5 text-slate-600" />
                Test in sandbox
              </button>
              <button
                type="button"
                onClick={handleSaveRules}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                Save rules
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
