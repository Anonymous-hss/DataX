import React, { useState } from 'react';
import { 
  Database, 
  ChevronDown, 
  X, 
  Plus, 
  Sparkles, 
  Loader2 
} from 'lucide-react';

export default function DescribeRulesForm({
  columns,
  onRemoveColumn,
  onAddColumn,
  prompt,
  onPromptChange,
  isGenerating,
  onRegenerate,
  tableName = 'raw_source_users',
  dbName = 'production_db'
}) {
  const [newColInput, setNewColInput] = useState('');
  const [showAddCol, setShowAddCol] = useState(false);

  const quickPills = [
    '+ Missing values',
    '+ Duplicates',
    '+ Format checks',
    '+ Allowed values'
  ];

  const handleAddPill = (pill) => {
    const textToAdd = ` ${pill.replace('+ ', '')} are strictly enforced.`;
    onPromptChange(prompt + textToAdd);
  };

  const handleAddNewColumn = (e) => {
    e.preventDefault();
    if (newColInput.trim()) {
      onAddColumn(newColInput.trim().toLowerCase());
      setNewColInput('');
      setShowAddCol(false);
    }
  };

  return (
    <div className="space-y-5 lg:pr-4">
      {/* Input table */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Input table</label>
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 shadow-2xs hover:border-slate-300 transition-colors cursor-pointer">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-slate-500" />
            <span>{tableName} · {dbName}</span>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Columns to check */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Columns to check{' '}
            <span className="font-normal text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
              {columns.length}
            </span>
          </label>
          <span className="text-xs text-blue-600 font-medium inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Auto-detected
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 items-center">
          {columns.map((col) => (
            <span
              key={col}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-mono transition-colors"
            >
              {col}
              <button
                type="button"
                onClick={() => onRemoveColumn(col)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                title={`Remove ${col}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {showAddCol ? (
            <form onSubmit={handleAddNewColumn} className="inline-flex items-center gap-1">
              <input
                type="text"
                autoFocus
                value={newColInput}
                onChange={(e) => setNewColInput(e.target.value)}
                placeholder="col_name"
                className="w-24 px-2 py-0.5 text-xs font-mono bg-white border border-blue-400 rounded-md focus:outline-none"
              />
              <button type="submit" className="text-blue-600 font-bold text-xs">✓</button>
              <button type="button" onClick={() => setShowAddCol(false)} className="text-slate-400 text-xs">✕</button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddCol(true)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-dashed border-slate-300 hover:border-slate-400 text-slate-500 hover:text-slate-700 text-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          )}
        </div>
      </div>

      {/* Describe the rules */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Describe the rules</label>
        
        {/* Quick Pills */}
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {quickPills.map((pill) => (
            <button
              key={pill}
              type="button"
              onClick={() => handleAddPill(pill)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-[11px] font-medium text-slate-600 hover:text-blue-700 transition-colors cursor-pointer shadow-2xs"
            >
              {pill}
            </button>
          ))}
        </div>

        <textarea
          rows={4}
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none shadow-2xs font-sans"
        />
      </div>

      {/* Action Button: Regenerate rules */}
      <button
        type="button"
        disabled={isGenerating}
        onClick={onRegenerate}
        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Regenerating rules...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 fill-current" />
            Regenerate rules
          </>
        )}
      </button>
    </div>
  );
}
