import React from 'react';
import { Sparkles, Plus, Trash2 } from 'lucide-react';
import { callAiRuleEngine } from '../../../utils/aiRuleSynthesizer';

export default function RulesModalPanel({
  rulesPrompt,
  setRulesPrompt,
  autoFixActive,
  setAutoFixActive,
  rulesGenerating,
  setRulesGenerating,
  srcTable,
  activeEngineKey,
  discoveredColumns,
  rulesList,
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
  return (
    <div className="space-y-4">
      {/* Prompt & Re-synthesize */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            Natural Language Rules Prompt
          </label>
          <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
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
                  columns: discoveredColumns,
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
            Active Rules ({rulesList.filter((r) => r.selected !== false).length} of {rulesList.length} enabled)
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
  );
}
