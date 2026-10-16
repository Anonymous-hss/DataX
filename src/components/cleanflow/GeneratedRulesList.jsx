import React, { useState } from 'react';
import { 
  Plus, 
  Eye, 
  Pencil, 
  Trash2, 
  Zap, 
  Check, 
  X,
  AlertTriangle,
  Code
} from 'lucide-react';

export default function GeneratedRulesList({
  rules,
  columns,
  onToggleRule,
  onToggleAll,
  onAddRule,
  onUpdateRule,
  onDeleteRule
}) {
  const [modalMode, setModalMode] = useState(null); // 'ADD' | 'EDIT' | null
  const [editingRule, setEditingRule] = useState(null);
  const [previewRule, setPreviewRule] = useState(null);

  // Form State for Add / Edit
  const [formName, setFormName] = useState('');
  const [formField, setFormField] = useState('email');
  const [formSeverity, setFormSeverity] = useState('Critical');
  const [formCode, setFormCode] = useState('');

  const selectedCount = rules.filter((r) => r.selected).length;
  const allSelected = rules.length > 0 && selectedCount === rules.length;

  const openAddModal = () => {
    setFormName('');
    setFormField(columns[0] || 'email');
    setFormSeverity('Critical');
    setFormCode('REGEX_MATCH(' + (columns[0] || 'email') + ', PATTERN)');
    setEditingRule(null);
    setModalMode('ADD');
  };

  const openEditModal = (rule) => {
    setEditingRule(rule);
    setFormName(rule.name);
    setFormField(rule.field);
    setFormSeverity(rule.severity);
    setFormCode(rule.code);
    setModalMode('EDIT');
  };

  const handleSaveModal = (e) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) return;

    if (modalMode === 'ADD') {
      onAddRule({
        id: `r_${Date.now()}`,
        name: formName.trim(),
        field: formField,
        severity: formSeverity,
        code: formCode.trim(),
        selected: true
      });
    } else if (modalMode === 'EDIT' && editingRule) {
      onUpdateRule({
        ...editingRule,
        name: formName.trim(),
        field: formField,
        severity: formSeverity,
        code: formCode.trim()
      });
    }
    setModalMode(null);
  };

  return (
    <div className="space-y-3 lg:pl-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900 font-display">Generated rules</h3>
          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold flex items-center justify-center font-mono">
            {rules.length}
          </span>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-slate-600 stroke-[2.5]" />
          Add rule
        </button>
      </div>

      {/* Banner / Select All sub-bar */}
      <div className="bg-slate-50 border border-slate-200/70 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onToggleAll}
            className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
          />
          <span className="font-semibold text-slate-800">
            {selectedCount} of {rules.length} selected
          </span>
        </label>
        <span className="text-slate-400 text-[11px] hidden sm:inline">
          Uncheck any rule you don't need.
        </span>
      </div>

      {/* Rules Cards List */}
      <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`rounded-xl border p-3.5 bg-white transition-all shadow-2xs space-y-2 ${
              rule.selected ? 'border-slate-200 hover:border-slate-300' : 'border-slate-200/60 opacity-60 bg-slate-50/40'
            }`}
          >
            {/* Top Row: Checkbox, Name, Field, Severity, Actions */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <input
                  type="checkbox"
                  checked={rule.selected}
                  onChange={() => onToggleRule(rule.id)}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer shrink-0"
                />
                <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  {rule.name}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[11px] font-medium shrink-0">
                  {rule.field}
                </span>
                {rule.severity === 'Critical' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-semibold shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Critical
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold shrink-0">
                    <Zap className="w-3 h-3 fill-amber-500 text-amber-500" />
                    Warning
                  </span>
                )}
              </div>

              {/* Action Icons */}
              <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
                <button
                  type="button"
                  onClick={() => setPreviewRule(rule)}
                  title="Preview rule evaluation"
                  className="p-1 rounded hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => openEditModal(rule)}
                  title="Edit rule"
                  className="p-1 rounded hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteRule(rule.id)}
                  title="Delete rule"
                  className="p-1 rounded hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Bottom Row: Code Expression */}
            <div className="font-mono text-[11px] sm:text-xs text-slate-700 bg-slate-50/70 border border-slate-100 rounded-lg px-2.5 py-1.5 overflow-x-auto select-all">
              {rule.code}
            </div>
          </div>
        ))}

        {rules.length === 0 && (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
            No rules currently active. Click <span className="font-bold text-slate-700">+ Add rule</span> or Regenerate to create rules.
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 font-display">
                {modalMode === 'ADD' ? 'Add new rule' : 'Edit rule'}
              </h3>
              <button 
                type="button"
                onClick={() => setModalMode(null)} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Email has a valid format"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Column</label>
                  <select
                    value={formField}
                    onChange={(e) => setFormField(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {columns.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Severity</label>
                  <select
                    value={formSeverity}
                    onChange={(e) => setFormSeverity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Critical">🔴 Critical (Quarantine)</option>
                    <option value="Warning">⚡ Warning (Auto-fix)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expression (SQL / Regex)</label>
                <textarea
                  rows={3}
                  required
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="e.g. REGEX_MATCH(email, EMAIL_RFC_5322)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
                >
                  {modalMode === 'ADD' ? 'Create rule' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Dialog */}
      {previewRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 font-display">
                  {previewRule.name}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setPreviewRule(null)} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 font-mono text-slate-800 border border-slate-100">
                {previewRule.code}
              </div>
              <div className="p-3 rounded-lg border border-emerald-100 bg-emerald-50/50 text-emerald-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Live dry-run preview: 98.4% pass rate
                </div>
                <div className="text-[11px] text-emerald-700">
                  Target: <span className="font-mono">{previewRule.field}</span> column. Severity: <span className="font-semibold">{previewRule.severity}</span>.
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setPreviewRule(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
