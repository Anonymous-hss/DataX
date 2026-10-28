import React, { useMemo, useEffect } from 'react';
import {
  GitBranch,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Database,
  Sparkles,
  Layers,
  HelpCircle,
} from 'lucide-react';

/**
 * Conditional Router — Settings Panel
 * Splits source stream rows into TRUE path or FALSE / Default path
 * based on a condition dynamically bound to discovered schema columns and live data.
 */
export default function ConditionalSwitchModalPanel({
  sourceTable = '',
  availableColumns = [],
  previewRows = [],
  conditionField = '',
  onConditionFieldChange,
  conditionOp = '>',
  onConditionOpChange,
  conditionVal = '50000',
  onConditionValChange,
  trueDest = 'High-Value Review',
  onTrueDestChange,
  falseDest = 'Standard Flow',
  onFalseDestChange,
}) {
  // Extract and clean columns from availableColumns or previewRows
  const effectiveColumns = useMemo(() => {
    let cols = Array.isArray(availableColumns) && availableColumns.length > 0 ? [...availableColumns] : [];
    if (cols.length === 0 && Array.isArray(previewRows) && previewRows.length > 0 && typeof previewRows[0] === 'object') {
      cols = Object.keys(previewRows[0]);
    }
    const clean = cols.filter((c) => c && c !== '_id');
    return clean.length > 0 ? clean : cols.length > 0 ? cols : ['TOTAL_AMOUNT', 'STATUS', 'QUANTITY'];
  }, [availableColumns, previewRows]);

  // Infer data types for columns
  const columnTypeMap = useMemo(() => {
    const map = {};
    effectiveColumns.forEach((col) => {
      const cl = col.toLowerCase();
      if (['amount', 'total', 'price', 'quantity', 'qty', 'balance', 'pct', 'utilization', 'revenue'].some((k) => cl.includes(k))) {
        map[col] = 'NUMBER';
      } else if (['date', 'time', 'created', 'updated'].some((k) => cl.includes(k))) {
        map[col] = 'DATE';
      } else if (cl.includes('email') || cl.includes('mail')) {
        map[col] = 'EMAIL';
      } else if (cl.includes('status') || cl.includes('state') || cl.includes('role') || cl.includes('country')) {
        map[col] = 'CATEGORY';
      } else {
        map[col] = 'TEXT';
      }
    });
    return map;
  }, [effectiveColumns]);

  // If current conditionField does not exist in discovered columns, auto-default to a relevant column
  useEffect(() => {
    if (effectiveColumns.length === 0) return;
    const exists = effectiveColumns.some((c) => c.toLowerCase() === (conditionField || '').toLowerCase());
    if (!exists) {
      // Prefer numeric or high-value categorical column
      const numericCol = effectiveColumns.find((c) => columnTypeMap[c] === 'NUMBER');
      const catCol = effectiveColumns.find((c) => columnTypeMap[c] === 'CATEGORY');
      const nextCol = numericCol || catCol || effectiveColumns[0];
      onConditionFieldChange?.(nextCol);

      // Set sensible default operator & value based on the column type
      if (numericCol) {
        onConditionOpChange?.('>');
        onConditionValChange?.(numericCol.toLowerCase().includes('balance') ? '1000' : '50000');
        onTrueDestChange?.('High-Value Stream');
        onFalseDestChange?.('Standard Stream');
      } else if (catCol) {
        onConditionOpChange?.('==');
        const sampleVal = previewRows?.[0]?.[catCol] || 'active';
        onConditionValChange?.(String(sampleVal));
        onTrueDestChange?.(`${String(sampleVal).toUpperCase()} Priority`);
        onFalseDestChange?.('Secondary Flow');
      }
    }
  }, [effectiveColumns, conditionField]);

  // Helper to fetch row value with case-insensitive column match
  const getRowVal = (row, field) => {
    if (!row || typeof row !== 'object') return undefined;
    if (field in row) return row[field];
    const key = Object.keys(row).find((k) => k.toLowerCase() === String(field).toLowerCase());
    return key ? row[key] : undefined;
  };

  // Live simulation: evaluate condition against current previewRows
  const simulation = useMemo(() => {
    if (!Array.isArray(previewRows) || previewRows.length === 0) {
      return null;
    }

    const field = conditionField || effectiveColumns[0];
    const op = conditionOp || '>';
    const rawVal = conditionVal ?? '';

    let trueMatches = [];
    let falseMatches = [];

    previewRows.forEach((row, idx) => {
      const cellVal = getRowVal(row, field);
      const strCell = cellVal === null || cellVal === undefined ? '' : String(cellVal).trim();
      const numCell = Number(cellVal);
      const numVal = Number(rawVal);
      const rowId = row.customer_id || row.po_id || row.id || row.PO_NUMBER || `Row #${idx + 1}`;

      let isTrue = false;
      if (op === 'is_empty') {
        isTrue = cellVal === null || cellVal === undefined || strCell === '';
      } else if (op === 'is_not_empty') {
        isTrue = cellVal !== null && cellVal !== undefined && strCell !== '';
      } else if (op === 'contains') {
        isTrue = strCell.toLowerCase().includes(String(rawVal).toLowerCase());
      } else if (op === 'starts_with') {
        isTrue = strCell.toLowerCase().startsWith(String(rawVal).toLowerCase());
      } else if (op === '==' || op === '=') {
        if (!Number.isNaN(numCell) && !Number.isNaN(numVal)) {
          isTrue = numCell === numVal;
        } else {
          isTrue = strCell.toLowerCase() === String(rawVal).trim().toLowerCase();
        }
      } else if (op === '!=') {
        if (!Number.isNaN(numCell) && !Number.isNaN(numVal)) {
          isTrue = numCell !== numVal;
        } else {
          isTrue = strCell.toLowerCase() !== String(rawVal).trim().toLowerCase();
        }
      } else if (op === '>') {
        isTrue = !Number.isNaN(numCell) && !Number.isNaN(numVal) && numCell > numVal;
      } else if (op === '>=') {
        isTrue = !Number.isNaN(numCell) && !Number.isNaN(numVal) && numCell >= numVal;
      } else if (op === '<') {
        isTrue = !Number.isNaN(numCell) && !Number.isNaN(numVal) && numCell < numVal;
      } else if (op === '<=') {
        isTrue = !Number.isNaN(numCell) && !Number.isNaN(numVal) && numCell <= numVal;
      }

      if (isTrue) {
        trueMatches.push({ id: rowId, val: strCell });
      } else {
        falseMatches.push({ id: rowId, val: strCell });
      }
    });

    return {
      total: previewRows.length,
      trueMatches,
      falseMatches,
    };
  }, [previewRows, conditionField, conditionOp, conditionVal, effectiveColumns]);

  // Smart presets tailored to the active columns
  const smartPresets = useMemo(() => {
    const list = [];
    const lowerCols = effectiveColumns.map((c) => c.toLowerCase());

    const numCol = effectiveColumns.find((c) =>
      ['amount', 'total', 'price', 'quantity', 'balance'].some((k) => c.toLowerCase().includes(k))
    );
    if (numCol) {
      const isBalance = numCol.toLowerCase().includes('balance');
      const threshold = isBalance ? '1000' : '50000';
      list.push({
        label: `${numCol} > ${threshold}`,
        field: numCol,
        op: '>',
        val: threshold,
        trueLabel: 'High-Value Priority',
        falseLabel: 'Standard Processing',
      });
    }

    const catCol = effectiveColumns.find((c) =>
      ['country', 'status', 'role', 'type'].some((k) => c.toLowerCase().includes(k))
    );
    if (catCol) {
      const sample = previewRows?.[0] ? getRowVal(previewRows[0], catCol) : 'USA';
      const valStr = String(sample || 'USA');
      list.push({
        label: `${catCol} == '${valStr}'`,
        field: catCol,
        op: '==',
        val: valStr,
        trueLabel: `${valStr.toUpperCase()} Stream`,
        falseLabel: 'Default Stream',
      });
    }

    const emailCol = effectiveColumns.find((c) => c.toLowerCase().includes('email'));
    if (emailCol) {
      list.push({
        label: `${emailCol} contains '@acme.com'`,
        field: emailCol,
        op: 'contains',
        val: '@acme.com',
        trueLabel: 'Internal Enterprise',
        falseLabel: 'External Partner',
      });
    }

    const idCol = effectiveColumns.find((c) => c.toLowerCase().includes('id') || c.toLowerCase().includes('name'));
    if (idCol) {
      list.push({
        label: `${idCol} is not empty`,
        field: idCol,
        op: 'is_not_empty',
        val: '',
        trueLabel: 'Populated Records',
        falseLabel: 'Orphan Records',
      });
    }

    return list.slice(0, 4);
  }, [effectiveColumns, previewRows]);

  const activeField = conditionField || effectiveColumns[0] || 'FIELD';
  const isEmptinessOp = conditionOp === 'is_empty' || conditionOp === 'is_not_empty';
  const conditionLabel = isEmptinessOp
    ? `${activeField} ${conditionOp === 'is_empty' ? 'IS NULL' : 'IS NOT NULL'}`
    : `${activeField} ${conditionOp} ${conditionVal}`;

  return (
    <div className="space-y-4">
      {/* Header with Source Detection Context */}
      <div className="p-3.5 bg-violet-50/70 border border-violet-200 rounded-xl flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-violet-950 flex items-center gap-2">
              <span>Conditional Router (If / Else)</span>
              <span className="text-[10px] font-semibold text-violet-700 bg-white px-2 py-0.5 rounded-full border border-violet-200">
                2-Way Flow Split
              </span>
            </h4>
            <p className="text-[11px] text-violet-700 mt-0.5">
              Splits stream records into two dedicated paths based on your business predicate. Records meeting the condition route to <strong>TRUE</strong>; others take the <strong>FALSE / Default</strong> path.
            </p>
          </div>
        </div>

        {/* Source Table & Column Detection Badge */}
        <div className="flex items-center gap-1.5 self-center">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-md bg-white border border-violet-200 text-slate-700 shadow-2xs">
            <Database className="w-3 h-3 text-violet-600" />
            <span className="text-slate-500">Source:</span>
            <span className="font-mono font-bold text-violet-900">{sourceTable || 'source_table'}</span>
          </span>
          <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-violet-100 text-violet-800 border border-violet-200">
            {effectiveColumns.length} Columns Detected
          </span>
        </div>
      </div>

      {/* Visual routing diagram */}
      <div className="flex items-center justify-center gap-2 py-1">
        <div className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700 text-center">
          Input Record ({sourceTable || 'stream'})
        </div>
        <ArrowRight className="w-4 h-4 text-slate-400" />
        <div className="px-3 py-1.5 rounded-lg bg-violet-100 border border-violet-300 text-xs font-bold text-violet-900 text-center font-mono">
          IF {activeField} {conditionOp} {isEmptinessOp ? '' : conditionVal}
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
            <span className="px-2 py-1 rounded-md bg-emerald-100 border border-emerald-300 text-[10px] font-bold text-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> TRUE Path ({trueDest || 'TRUE'})
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="px-2 py-1 rounded-md bg-slate-100 border border-slate-300 text-[10px] font-bold text-slate-600 flex items-center gap-1">
              <XCircle className="w-3 h-3" /> FALSE Path ({falseDest || 'Default'})
            </span>
          </div>
        </div>
      </div>

      {/* Smart Column-Aware Quick Presets */}
      {smartPresets.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              Quick Condition Presets (Detected from {sourceTable || 'Schema'}):
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {smartPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onConditionFieldChange?.(preset.field);
                  onConditionOpChange?.(preset.op);
                  onConditionValChange?.(preset.val);
                  onTrueDestChange?.(preset.trueLabel);
                  onFalseDestChange?.(preset.falseLabel);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-violet-50 text-slate-700 hover:text-violet-800 border border-slate-200 hover:border-violet-300 text-[11px] font-mono font-medium transition-colors cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Condition builder */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
        <label className="block text-xs font-bold text-slate-800">
          Define the Routing Condition
        </label>
        <p className="text-[11px] text-slate-500 -mt-2">
          Select a column from the detected schema and set the threshold or value to test against.
        </p>

        <div className="grid grid-cols-3 gap-2">
          {/* Dynamic Column Selector from Discovered Source Columns */}
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-1 flex items-center justify-between">
              <span>Source Column</span>
              <span className="text-[9px] text-violet-700 font-semibold font-mono">
                {columnTypeMap[activeField] || 'TEXT'}
              </span>
            </label>
            <select
              value={activeField}
              onChange={(e) => onConditionFieldChange?.(e.target.value)}
              className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 cursor-pointer focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            >
              {effectiveColumns.map((col) => (
                <option key={col} value={col}>
                  {col} {columnTypeMap[col] ? `(${columnTypeMap[col]})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Operator Selector */}
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-1">
              Operator
            </label>
            <select
              value={conditionOp}
              onChange={(e) => onConditionOpChange?.(e.target.value)}
              className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 cursor-pointer focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            >
              <option value=">">&gt; Greater than</option>
              <option value=">=">&gt;= Greater or equal</option>
              <option value="<">&lt; Less than</option>
              <option value="<=">&lt;= Less or equal</option>
              <option value="==">== Equals</option>
              <option value="!=">!= Not equal</option>
              <option value="contains">contains (Text)</option>
              <option value="starts_with">starts with (Text)</option>
              <option value="is_empty">is NULL or empty</option>
              <option value="is_not_empty">is populated / not null</option>
            </select>
          </div>

          {/* Value Input */}
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-1">
              Comparison Value
            </label>
            <input
              type="text"
              disabled={isEmptinessOp}
              value={isEmptinessOp ? '(Not needed for empty test)' : conditionVal}
              onChange={(e) => onConditionValChange?.(e.target.value)}
              placeholder={columnTypeMap[activeField] === 'NUMBER' ? 'e.g. 1000' : 'e.g. active / USA'}
              className={`w-full px-2.5 py-2 border rounded-lg text-xs font-mono text-slate-900 ${
                isEmptinessOp
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed italic'
                  : 'bg-white border-slate-300 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500'
              }`}
            />
          </div>
        </div>

        {/* Live preview of condition expression */}
        <div className="px-3 py-2 rounded-lg bg-violet-50 border border-violet-200 text-xs font-mono text-violet-900 flex items-center justify-between">
          <span>
            IF <strong>{conditionLabel}</strong> → <span className="text-emerald-700 font-bold">{trueDest || 'TRUE'}</span> | else → <span className="text-slate-600 font-bold">{falseDest || 'FALSE'}</span>
          </span>
          <span className="text-[10px] uppercase font-bold text-violet-600 bg-white px-2 py-0.5 rounded border border-violet-200">
            DuckDB Evaluated
          </span>
        </div>
      </div>

      {/* Live Sample Stream Simulation */}
      {simulation && (
        <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-violet-600" />
              Live Routing Simulation ({simulation.total} Sample Records Evaluated)
            </span>
            <span className="text-[10px] text-slate-500">
              Evaluated against first {simulation.total} rows of {sourceTable}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* TRUE path matches */}
            <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Routes to "{trueDest || 'TRUE'}"
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                  {simulation.trueMatches.length} / {simulation.total} rows
                </span>
              </div>
              <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                {simulation.trueMatches.length > 0 ? (
                  simulation.trueMatches.map((m, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 rounded bg-white border border-emerald-200 text-[10px] font-mono text-emerald-800"
                      title={`${activeField}: "${m.val}"`}
                    >
                      {m.id} ({m.val || 'empty'})
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-emerald-600 italic">No sample rows match condition</span>
                )}
              </div>
            </div>

            {/* FALSE path matches */}
            <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <XCircle className="w-3 h-3 text-slate-500" />
                  Routes to "{falseDest || 'Default'}"
                </span>
                <span className="text-[10px] font-bold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                  {simulation.falseMatches.length} / {simulation.total} rows
                </span>
              </div>
              <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                {simulation.falseMatches.length > 0 ? (
                  simulation.falseMatches.map((m, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-700"
                      title={`${activeField}: "${m.val}"`}
                    >
                      {m.id} ({m.val || 'empty'})
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-slate-500 italic">All sample rows routed to TRUE path</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Output destination labels */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <label className="text-xs font-bold text-emerald-900">TRUE Path Output Label</label>
          </div>
          <input
            type="text"
            value={trueDest}
            onChange={(e) => onTrueDestChange?.(e.target.value)}
            placeholder="e.g. High-Value Review"
            className="w-full px-2.5 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <p className="text-[10px] text-emerald-700">Records where condition evaluates to TRUE</p>
        </div>

        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-slate-500" />
            <label className="text-xs font-bold text-slate-700">FALSE / Default Path Output Label</label>
          </div>
          <input
            type="text"
            value={falseDest}
            onChange={(e) => onFalseDestChange?.(e.target.value)}
            placeholder="e.g. Standard Flow"
            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
          <p className="text-[10px] text-slate-500">All other fallback records</p>
        </div>
      </div>
    </div>
  );
}
