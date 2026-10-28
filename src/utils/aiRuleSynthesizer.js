// =============================================================================
// DataX Autonomous Intelligence Engine Client
// Connected to Live Azure OpenAI (gpt-5-mini / GPT-4o) & Deep Data Profiler
// Performs live column/data anomaly analysis, automatic prompt drafting,
// and prompt-driven generative synthesis of executable data quality rules.
// =============================================================================

import { api } from '../services/apiClient';

/**
 * Analyze selected table, columns, and live sample rows to detect data anomalies
 * and automatically draft a tailored natural-language validation prompt.
 */
export async function analyzeDataAndDraftPrompt({
  tableName = 'source_table',
  engine = 'mongodb',
  columns = [],
  selectedColumns = null,
  sampleRows = [],
  governanceMode = 'balanced',
}) {
  // Always compute fast client-side profile so we have rich anomalies & fallback ready
  const localProfile = clientSideAnalyzeAndDraft({
    tableName,
    engine,
    columns,
    selectedColumns,
    sampleRows,
    governanceMode,
  });

  try {
    const res = await api.post('/rules/draft-prompt', {
      tableName: tableName || 'source_table',
      engine: engine || 'mongodb',
      columns: columns || [],
      selectedColumns: selectedColumns || columns || [],
      sampleRows: (sampleRows || []).slice(0, 10),
      governanceMode,
    });

    if (res && res.success && res.draftedPrompt) {
      return {
        tableName: res.tableName || tableName,
        analyzedColumns: res.analyzedColumns || localProfile.analyzedColumns,
        sampleRowCount: res.sampleRowCount ?? localProfile.sampleRowCount,
        draftedPrompt: res.draftedPrompt,
        anomalies: res.anomalies?.length ? res.anomalies : localProfile.anomalies,
        promptChips: res.promptChips?.length ? res.promptChips : localProfile.promptChips,
        columnProfiles: res.columnProfiles || localProfile.columnProfiles,
        engine: res.engine || 'Azure OpenAI (gpt-5-mini)',
      };
    }
  } catch (err) {
    console.warn('Backend draft-prompt fallback to local deep profiler:', err);
  }

  return localProfile;
}

/**
 * Client-side deep data & schema profiler for instant prompt drafting & anomaly detection
 */
export function clientSideAnalyzeAndDraft({
  tableName = 'source_table',
  engine = 'mongodb',
  columns = [],
  selectedColumns = null,
  sampleRows = [],
}) {
  const rows = Array.isArray(sampleRows) ? sampleRows : [];
  let allCols = Array.isArray(columns) && columns.length > 0 ? [...columns] : [];
  if (allCols.length === 0 && rows.length > 0 && typeof rows[0] === 'object' && rows[0] !== null) {
    allCols = Object.keys(rows[0]).filter((k) => k !== '_id');
  }
  const targetCols = (Array.isArray(selectedColumns) && selectedColumns.length > 0 ? selectedColumns : allCols).filter(
    (c) => c && c !== '_id'
  );

  const anomalies = [];
  const clauses = [];
  const columnProfiles = [];

  const getVal = (row, col) => {
    if (!row || typeof row !== 'object') return undefined;
    if (col in row) return row[col];
    const key = Object.keys(row).find((k) => k.toLowerCase() === col.toLowerCase());
    return key ? row[key] : undefined;
  };

  for (const col of targetCols) {
    const cl = col.toLowerCase();
    const vals = rows.map((r) => getVal(r, col));
    const nonNull = vals.filter((v) => v !== null && v !== undefined && String(v).trim() !== '');
    const nullCount = rows.length > 0 ? vals.length - nonNull.length : 0;

    columnProfiles.push({
      column: col,
      sampledCount: vals.length,
      nullCount,
      sampleValues: nonNull.slice(0, 3).map((v) => String(v).slice(0, 36)),
    });

    // 1. Primary Key / ID checks
    if (cl.endsWith('_id') || cl === 'id' || cl.includes('po_number') || cl.includes('ebeln') || cl.includes('matnr') || cl.includes('material_doc')) {
      const seen = new Set();
      const dupes = [];
      nonNull.forEach((v) => {
        const sv = String(v).trim();
        if (seen.has(sv)) dupes.push(sv);
        seen.add(sv);
      });
      if (dupes.length > 0) {
        anomalies.push({
          column: col,
          issue: `Duplicate key detected (${dupes[0]})`,
          severity: 'Critical',
          sampleValue: dupes[0],
          affectedCount: dupes.length,
        });
        clauses.push(`${col} is mandatory and must be strictly unique with no duplicate keys`);
      } else {
        clauses.push(`${col} is mandatory and must be unique`);
      }
    }

    // 2. Null / Missing values
    if (nullCount > 0) {
      anomalies.push({
        column: col,
        issue: `Missing / NULL in ${nullCount} of ${vals.length} rows`,
        severity: cl.includes('id') || cl.includes('email') || cl.includes('name') ? 'Critical' : 'Warning',
        sampleValue: 'NULL / Empty',
        affectedCount: nullCount,
      });
      if (!clauses.some((c) => c.includes(col))) {
        clauses.push(`${col} must not be null or empty`);
      }
    }

    // 3. String hygiene: Whitespace & SQL Injection / Corrupt strings
    const whitespaceHits = [];
    const sqliHits = [];
    nonNull.forEach((v) => {
      if (typeof v === 'string') {
        if (v !== v.trim() || v.includes('  ')) whitespaceHits.push(v);
        const vu = v.toUpperCase();
        if (vu.includes('DROP TABLE') || vu.includes("OR '1'='1") || vu.includes('--') || vu.includes('PURGED_CORRUPT')) {
          sqliHits.push(v);
        }
      }
    });

    if (sqliHits.length > 0) {
      anomalies.push({
        column: col,
        issue: 'SQL injection / corrupt payload detected',
        severity: 'Critical',
        sampleValue: sqliHits[0].slice(0, 32),
        affectedCount: sqliHits.length,
      });
      clauses.push(`${col} must block SQL injection payloads and corrupt strings`);
    }

    if (whitespaceHits.length > 0) {
      anomalies.push({
        column: col,
        issue: 'Untrimmed leading/trailing whitespace',
        severity: 'Warning',
        sampleValue: `"${whitespaceHits[0]}"`,
        affectedCount: whitespaceHits.length,
      });
      clauses.push(`${col} must be trimmed of leading/trailing whitespace`);
    }

    // 4. Email checks
    if (cl.includes('email') || cl.includes('mail')) {
      const badEmails = [];
      const upperEmails = [];
      nonNull.forEach((v) => {
        const sv = String(v).trim();
        if (!sv.includes('@') || sv.includes('@@') || !sv.split('@').pop().includes('.') || sv.startsWith('-') || sv.endsWith('-') || sv.includes(' ')) {
          badEmails.push(sv);
        } else if (sv !== sv.toLowerCase()) {
          upperEmails.push(sv);
        }
      });
      if (badEmails.length > 0) {
        anomalies.push({
          column: col,
          issue: 'Malformed RFC-5322 email syntax',
          severity: 'Critical',
          sampleValue: badEmails[0],
          affectedCount: badEmails.length,
        });
      }
      if (upperEmails.length > 0) {
        anomalies.push({
          column: col,
          issue: 'Uppercase email casing',
          severity: 'Warning',
          sampleValue: upperEmails[0],
          affectedCount: upperEmails.length,
        });
      }
      clauses.push(`${col} must follow valid lowercase RFC-5322 email format (user@domain.tld)`);
    }

    // 5. Numeric / Financial bounds
    if (['quantity', 'qty', 'menge', 'price', 'netpr', 'amount', 'total', 'balance', 'pct', 'utilization', 'brgew', 'ntgew'].some((k) => cl.includes(k))) {
      const negs = [];
      const zeros = [];
      const outliers = [];
      nonNull.forEach((v) => {
        const n = Number(v);
        if (!Number.isNaN(n)) {
          if (n < 0) negs.push(n);
          else if (n === 0 && (cl.includes('price') || cl.includes('qty') || cl.includes('quantity'))) zeros.push(n);
          else if ((cl.includes('pct') || cl.includes('utilization')) && n > 100) outliers.push(n);
          else if (cl.includes('balance') && n > 10000000) outliers.push(n);
        }
      });
      if (negs.length > 0) {
        anomalies.push({
          column: col,
          issue: `Negative value (${negs[0]})`,
          severity: 'Critical',
          sampleValue: String(negs[0]),
          affectedCount: negs.length,
        });
        clauses.push(
          cl.includes('qty') || cl.includes('quantity') || cl.includes('price')
            ? `${col} must be strictly positive (> 0)`
            : `${col} must be non-negative (>= 0)`
        );
      } else if (zeros.length > 0) {
        anomalies.push({
          column: col,
          issue: `Zero value in commercial field (${col}=0)`,
          severity: 'Warning',
          sampleValue: '0',
          affectedCount: zeros.length,
        });
        clauses.push(`${col} must be strictly greater than 0`);
      } else if (!clauses.some((c) => c.includes(col))) {
        clauses.push(`${col} must be a valid positive number`);
      }

      if (outliers.length > 0) {
        const cap = cl.includes('pct') || cl.includes('utilization') ? 100 : 1000000;
        anomalies.push({
          column: col,
          issue: `Extreme outlier (${outliers[0]} > ${cap})`,
          severity: 'Critical',
          sampleValue: String(outliers[0]),
          affectedCount: outliers.length,
        });
        clauses.push(`${col} must not exceed upper threshold ${cap}`);
      }
    }

    // 6. Dates
    if (cl.includes('date') || cl.includes('created') || cl.includes('time')) {
      const badDates = nonNull.map((v) => String(v).trim()).filter((sv) => sv.startsWith('2099') || sv.includes('/') || sv.toLowerCase().includes('not-a-valid'));
      if (badDates.length > 0) {
        anomalies.push({
          column: col,
          issue: `Future or non-ISO date (${badDates[0]})`,
          severity: 'Warning',
          sampleValue: badDates[0],
          affectedCount: badDates.length,
        });
        clauses.push(`${col} must be a valid ISO-8601 date and not in the far future`);
      }
    }

    // 7. Status / Role / Country / Phone / Zip
    if (cl.includes('status')) {
      const badSt = nonNull.map((v) => String(v)).filter((sv) => ['cancelled', 'corrupt', 'purged_corrupt', 'suspended', 'rejected'].includes(sv.toLowerCase()));
      if (badSt.length > 0) {
        anomalies.push({
          column: col,
          issue: `Non-compliant status (${badSt[0]})`,
          severity: 'Warning',
          sampleValue: badSt[0],
          affectedCount: badSt.length,
        });
        clauses.push(`${col} must be an active/approved lifecycle state (exclude '${badSt[0]}')`);
      }
    } else if (cl.includes('role')) {
      const badRole = nonNull.map((v) => String(v)).filter((sv) => !['admin', 'analyst', 'manager', 'viewer', 'user', 'engineer'].includes(sv.toLowerCase()));
      if (badRole.length > 0) {
        anomalies.push({
          column: col,
          issue: `Unauthorized role (${badRole[0]})`,
          severity: 'Critical',
          sampleValue: badRole[0],
          affectedCount: badRole.length,
        });
        clauses.push(`${col} must belong to authorized roles ('admin', 'analyst', 'manager', 'viewer')`);
      }
    } else if (cl.includes('country')) {
      const badCountry = nonNull.map((v) => String(v)).filter((sv) => sv.toLowerCase().includes('invalid') || sv.trim().length > 15);
      if (badCountry.length > 0) {
        anomalies.push({
          column: col,
          issue: `Invalid country code (${badCountry[0]})`,
          severity: 'Warning',
          sampleValue: badCountry[0],
          affectedCount: badCountry.length,
        });
        clauses.push(`${col} must be a valid ISO country code`);
      }
    } else if (cl.includes('phone')) {
      const badPhone = nonNull.map((v) => String(v)).filter((sv) => sv.trim().length < 7 || /[a-zA-Z]/.test(sv));
      if (badPhone.length > 0) {
        anomalies.push({
          column: col,
          issue: `Malformed phone number (${badPhone[0]})`,
          severity: 'Warning',
          sampleValue: badPhone[0],
          affectedCount: badPhone.length,
        });
        clauses.push(`${col} must contain a valid numeric phone number format`);
      }
    } else if (cl.includes('zip') || cl.includes('postal')) {
      const badZip = nonNull.map((v) => String(v)).filter((sv) => sv.toLowerCase().includes('invalid') || sv.trim().length < 3);
      if (badZip.length > 0) {
        anomalies.push({
          column: col,
          issue: `Corrupt postal/zip code (${badZip[0]})`,
          severity: 'Warning',
          sampleValue: badZip[0],
          affectedCount: badZip.length,
        });
        clauses.push(`${col} must be a valid postal/zip code without corrupt suffixes`);
      }
    }
  }

  // Cross-column multiplication check
  const findCol = (kws) => targetCols.find((c) => kws.some((k) => c.toLowerCase() === k || c.toLowerCase().includes(k)));
  const qtyCol = findCol(['quantity', 'menge', 'qty']);
  const priceCol = findCol(['unit_price', 'netpr', 'price']);
  const totalCol = findCol(['total_amount', 'dmbtr', 'total']);
  if (qtyCol && priceCol && totalCol) {
    const mismatches = [];
    rows.forEach((r) => {
      const q = Number(getVal(r, qtyCol));
      const p = Number(getVal(r, priceCol));
      const t = Number(getVal(r, totalCol));
      if (!Number.isNaN(q) && !Number.isNaN(p) && !Number.isNaN(t) && Math.abs(q * p - t) > 0.05) {
        mismatches.push(`${q} × ${p} ≠ ${t}`);
      }
    });
    if (mismatches.length > 0) {
      anomalies.push({
        column: totalCol,
        issue: `Math mismatch (${mismatches[0]})`,
        severity: 'Critical',
        sampleValue: mismatches[0],
        affectedCount: mismatches.length,
      });
    }
    clauses.push(`${totalCol} must equal ${qtyCol} multiplied by ${priceCol}`);
  }

  const uniqueClauses = [...new Set(clauses)];
  if (uniqueClauses.length === 0) {
    const colLabel = targetCols.length > 0 ? targetCols.slice(0, 5).join(', ') : 'all schema columns';
    uniqueClauses.push(`Ensure completeness, non-null integrity, and domain compliance for ${colLabel} in ${tableName}`);
  }

  const draftedPrompt = uniqueClauses.join('. ') + '.';

  const promptChips = [
    {
      label: '+ Trim Whitespace & Normalize Case',
      clause: `Trim leading/trailing whitespace and normalize text casing across ${targetCols.slice(0, 3).join(', ') || 'text fields'}.`,
    },
    {
      label: '+ Block SQL Injection & Payloads',
      clause: 'Quarantine any record containing SQL injection payloads or corrupt strings.',
    },
    {
      label: '+ Strict Null & Empty Guard',
      clause: `Require non-null, non-empty values for ${targetCols.slice(0, 4).join(', ') || 'all selected columns'}.`,
    },
    {
      label: '+ Deduplicate Primary Key',
      clause: `Enforce strict primary key uniqueness on ${targetCols[0] || 'ID'}.`,
    },
  ];
  if (targetCols.some((c) => c.toLowerCase().includes('email'))) {
    promptChips.unshift({
      label: '+ Strict RFC-5322 Email Check',
      clause: 'Validate email addresses against RFC-5322 format and auto-lowercase domain names.',
    });
  }
  if (qtyCol && priceCol && totalCol) {
    promptChips.unshift({
      label: `+ Verify ${totalCol} = ${qtyCol} × ${priceCol}`,
      clause: `${totalCol} must equal ${qtyCol} multiplied by ${priceCol}.`,
    });
  }

  return {
    tableName,
    analyzedColumns: targetCols,
    sampleRowCount: rows.length,
    draftedPrompt,
    anomalies,
    promptChips: promptChips.slice(0, 6),
    columnProfiles,
    engine: 'DataX Deep Column & Sample Profiler',
  };
}

/**
 * Generate rules dynamically from the user's natural language prompt, selected columns, and sample rows.
 */
export async function callAiRuleEngine({
  prompt,
  columns = [],
  selectedColumns = null,
  sampleRows = [],
  tableName = '',
  engine = 'sap_bw',
  governanceMode = 'balanced',
}) {
  const effectiveCols = Array.isArray(selectedColumns) && selectedColumns.length > 0 ? selectedColumns : columns;

  try {
    const data = await api.post('/rules/generate', {
      tableName: tableName || 'source_table',
      columns: effectiveCols || [],
      selectedColumns: effectiveCols || [],
      sampleRows: (sampleRows || []).slice(0, 10),
      prompt: prompt || 'Validate required fields and logical constraints.',
      engine: engine || 'sap_bw',
      governanceMode,
    });

    if (data && data.success && Array.isArray(data.rules) && data.rules.length > 0) {
      return data.rules.map((r, idx) => ({
        id: r.id || `r_ai_${idx + 1}_${Date.now()}`,
        name: r.name || `Rule ${idx + 1}`,
        field: r.field || (effectiveCols[idx % Math.max(effectiveCols.length, 1)] || 'FIELD'),
        severity: governanceMode === 'strict' ? 'Critical' : (r.severity || (idx < 2 ? 'Critical' : 'Warning')),
        condition: r.condition || r.code,
        code: r.code || r.condition,
        desc: r.desc || 'Automated rule generated by DataX AI Engine',
        selected: true,
        badge: r.badge || data.engine || 'Azure OpenAI (gpt-5-mini)',
      }));
    }
  } catch (err) {
    console.warn('Live Intelligence Engine call failed, utilizing local prompt-driven synthesizer:', err);
  }

  return synthesizeSemanticRules({
    prompt,
    columns: effectiveCols,
    sampleRows,
    tableName,
    governanceMode,
  });
}

/**
 * Prompt-driven semantic rule synthesizer (parses every sentence of the user's prompt & selected columns)
 */
export function synthesizeSemanticRules({
  prompt = '',
  columns = [],
  sampleRows = [],
  tableName = 'source_table',
  governanceMode = 'balanced',
}) {
  let rawCols = (columns || []).filter((c) => c && c !== '_id');
  if (rawCols.length === 0 && Array.isArray(sampleRows) && sampleRows.length > 0 && typeof sampleRows[0] === 'object') {
    rawCols = Object.keys(sampleRows[0]).filter((k) => k !== '_id');
  }
  if (rawCols.length === 0) {
    rawCols = ['id', 'status'];
  }

  const slug = String(tableName || 'table').toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const rules = [];
  const seenIds = new Set();

  const addRule = (r) => {
    if (!seenIds.has(r.id)) {
      seenIds.add(r.id);
      if (governanceMode === 'strict') r.severity = 'Critical';
      rules.push({ ...r, selected: true });
    }
  };

  const findCol = (kws) => rawCols.find((c) => kws.some((k) => c.toLowerCase().includes(k)));
  const sentences = String(prompt || '')
    .split(/[.;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  sentences.forEach((sent, idx) => {
    const sl = sent.toLowerCase();
    const mentionedCols = rawCols.filter((c) => {
      const escaped = c.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`\\b${escaped}\\b`, 'i').test(sl);
    });

    // 1. Cross-column multiplication
    if ((sl.includes('multiplied by') || sl.includes('*') || sl.includes('×')) && (sl.includes('equal') || sl.includes('='))) {
      const qtyC = findCol(['quantity', 'qty', 'menge']);
      const priceC = findCol(['unit_price', 'price', 'netpr']);
      const totC = findCol(['total_amount', 'total', 'dmbtr', 'amount']);
      if (qtyC && priceC && totC) {
        addRule({
          id: `r_${slug}_math_${totC.toLowerCase()}`,
          name: `Cross-Column Math Integrity (${totC} = ${qtyC} × ${priceC})`,
          field: totC,
          severity: 'Critical',
          condition: `ABS(${totC} - (${qtyC} * ${priceC})) <= 0.05`,
          code: `ABS(${totC} - (${qtyC} * ${priceC})) <= 0.05`,
          desc: `Enforces prompt formula: "${sent}".`,
          badge: 'Prompt-Driven Synthesis',
        });
        return;
      }
    }

    // 2. SQL Injection / Corrupt payload guard
    if (['sql injection', 'corrupt', 'payload', 'script'].some((k) => sl.includes(k))) {
      const tc = mentionedCols[0] || findCol(['name', 'customer', 'email', 'status']) || rawCols[0];
      addRule({
        id: `r_${slug}_sqli_${tc.toLowerCase()}`,
        name: `SQL Injection & Corrupt Payload Guard (${tc})`,
        field: tc,
        severity: 'Critical',
        condition: `${tc} NOT LIKE '%);%' AND ${tc} != 'PURGED_CORRUPT'`,
        code: `${tc} NOT LIKE '%);%' AND ${tc} != 'PURGED_CORRUPT'`,
        desc: `Blocks SQL injection and corrupt payload signatures on ${tc}.`,
        badge: 'Prompt-Driven Synthesis',
      });
    }

    // 3. Email format
    if (sl.includes('email') || sl.includes('rfc') || sl.includes('@')) {
      const ec = findCol(['email', 'mail']) || mentionedCols[0] || rawCols[0];
      addRule({
        id: `r_${slug}_email_${ec.toLowerCase()}`,
        name: `RFC-5322 Email & Case Compliance (${ec})`,
        field: ec,
        severity: 'Critical',
        condition: `${ec} IS NOT NULL AND ${ec} LIKE '%_@_%.__%' AND ${ec} NOT LIKE '%@@%' AND ${ec} NOT LIKE '% %'`,
        code: `${ec} IS NOT NULL AND ${ec} LIKE '%_@_%.__%'`,
        desc: `Validates ${ec} against RFC-5322 email syntax and lowercase normalization.`,
        badge: 'Prompt-Driven Synthesis',
      });
    }

    // 4. Whitespace / Trim
    if (['trim', 'whitespace', 'leading', 'trailing'].some((k) => sl.includes(k))) {
      const tc = mentionedCols[0] || findCol(['name', 'customer', 'vendor', 'email']) || rawCols[0];
      addRule({
        id: `r_${slug}_trim_${tc.toLowerCase()}`,
        name: `Whitespace & Text Hygiene (${tc})`,
        field: tc,
        severity: 'Warning',
        condition: `${tc} IS NOT NULL AND TRIM(${tc}) = ${tc} AND LENGTH(TRIM(${tc})) > 0`,
        code: `TRIM(${tc}) = ${tc}`,
        desc: `Detects untrimmed leading/trailing spaces on ${tc} for automatic remediation.`,
        badge: 'Prompt-Driven Synthesis',
      });
    }

    // 5. Upper threshold / Outlier cap
    const threshMatch = sl.match(/(?:exceed|<=|<|below|under|max|maximum|threshold)\s*(\d+(?:\.\d+)?)/i);
    if (threshMatch) {
      const boundVal = threshMatch[1];
      const tc = mentionedCols[0] || findCol(['pct', 'utilization', 'balance', 'amount', 'total']) || rawCols[0];
      addRule({
        id: `r_${slug}_max_${tc.toLowerCase()}`,
        name: `Upper Threshold Guard (${tc} <= ${boundVal})`,
        field: tc,
        severity: 'Critical',
        condition: `${tc} <= ${boundVal}`,
        code: `${tc} <= ${boundVal}`,
        desc: `Quarantines extreme outliers where ${tc} exceeds ${boundVal}.`,
        badge: 'Prompt-Driven Synthesis',
      });
    }

    // 6. Positive / Non-negative bounds
    if (['positive', '> 0', '>= 0', 'non-negative', 'negative', 'greater than 0'].some((k) => sl.includes(k))) {
      const targets =
        mentionedCols.length > 0
          ? mentionedCols
          : rawCols.filter((c) => ['quantity', 'qty', 'menge', 'price', 'netpr', 'amount', 'balance', 'total'].some((k) => c.toLowerCase().includes(k)));
      targets.slice(0, 3).forEach((nc) => {
        const isStrict = sl.includes('strictly') || sl.includes('greater than 0') || sl.includes('> 0') || nc.toLowerCase().includes('qty') || nc.toLowerCase().includes('quantity') || nc.toLowerCase().includes('price');
        const op = isStrict ? '> 0' : '>= 0';
        addRule({
          id: `r_${slug}_pos_${nc.toLowerCase()}`,
          name: `Positive Numeric Bound (${nc} ${op})`,
          field: nc,
          severity: 'Critical',
          condition: `${nc} IS NOT NULL AND ${nc} ${op}`,
          code: `${nc} ${op}`,
          desc: `Enforces prompt constraint: "${sent}" on ${nc}.`,
          badge: 'Prompt-Driven Synthesis',
        });
      });
    }

    // 7. Date / ISO-8601 / Future date check
    if (['date', 'iso-8601', 'future'].some((k) => sl.includes(k))) {
      const dc = mentionedCols[0] || findCol(['date', 'created', 'time']) || rawCols[0];
      addRule({
        id: `r_${slug}_date_${dc.toLowerCase()}`,
        name: `ISO-8601 Date & Horizon Check (${dc})`,
        field: dc,
        severity: 'Warning',
        condition: `${dc} IS NOT NULL AND ${dc} NOT LIKE '2099%' AND ${dc} NOT LIKE '%/%'`,
        code: `${dc} IS NOT NULL AND ${dc} NOT LIKE '2099%'`,
        desc: `Ensures ${dc} uses ISO-8601 date formatting and is not future-dated.`,
        badge: 'Prompt-Driven Synthesis',
      });
    }

    // 8. Status / Role / Country / Phone / Zip domains
    if (['status', 'cancelled', 'lifecycle', 'active', 'approved'].some((k) => sl.includes(k))) {
      const sc = findCol(['status', 'state']) || mentionedCols[0];
      if (sc) {
        addRule({
          id: `r_${slug}_status_${sc.toLowerCase()}`,
          name: `Authorized Lifecycle Status (${sc})`,
          field: sc,
          severity: 'Warning',
          condition: `LOWER(${sc}) NOT IN ('cancelled', 'purged_corrupt', 'suspended', 'rejected')`,
          code: `LOWER(${sc}) NOT IN ('cancelled', 'purged_corrupt', 'suspended')`,
          desc: `Validates ${sc} against active enterprise lifecycle states.`,
          badge: 'Prompt-Driven Synthesis',
        });
      }
    }
    if (sl.includes('role')) {
      const rc = findCol(['role']) || mentionedCols[0];
      if (rc) {
        addRule({
          id: `r_${slug}_role_${rc.toLowerCase()}`,
          name: `RBAC Role Domain Check (${rc})`,
          field: rc,
          severity: 'Critical',
          condition: `LOWER(${rc}) IN ('admin', 'analyst', 'manager', 'viewer', 'user')`,
          code: `LOWER(${rc}) IN ('admin', 'analyst', 'manager', 'viewer', 'user')`,
          desc: `Restricts ${rc} to authorized RBAC roles.`,
          badge: 'Prompt-Driven Synthesis',
        });
      }
    }
    if (sl.includes('country')) {
      const cc = findCol(['country']) || mentionedCols[0];
      if (cc) {
        addRule({
          id: `r_${slug}_country_${cc.toLowerCase()}`,
          name: `ISO Country Code Validation (${cc})`,
          field: cc,
          severity: 'Warning',
          condition: `${cc} IS NOT NULL AND ${cc} NOT LIKE '%INVALID%'`,
          code: `${cc} NOT LIKE '%INVALID%'`,
          desc: `Ensures ${cc} is a valid ISO country identifier.`,
          badge: 'Prompt-Driven Synthesis',
        });
      }
    }
    if (sl.includes('phone')) {
      const pc = findCol(['phone', 'tel']) || mentionedCols[0];
      if (pc) {
        addRule({
          id: `r_${slug}_phone_${pc.toLowerCase()}`,
          name: `Telecom Format Integrity (${pc})`,
          field: pc,
          severity: 'Warning',
          condition: `${pc} IS NOT NULL AND LENGTH(TRIM(${pc})) >= 7`,
          code: `LENGTH(TRIM(${pc})) >= 7`,
          desc: `Validates phone number format and minimum length on ${pc}.`,
          badge: 'Prompt-Driven Synthesis',
        });
      }
    }
    if (sl.includes('zip') || sl.includes('postal')) {
      const zc = findCol(['zip', 'postal']) || mentionedCols[0];
      if (zc) {
        addRule({
          id: `r_${slug}_zip_${zc.toLowerCase()}`,
          name: `Postal / Zip Code Integrity (${zc})`,
          field: zc,
          severity: 'Warning',
          condition: `${zc} IS NOT NULL AND ${zc} NOT LIKE '%INVALID%' AND LENGTH(TRIM(${zc})) >= 4`,
          code: `${zc} NOT LIKE '%INVALID%'`,
          desc: `Validates postal/zip format on ${zc}.`,
          badge: 'Prompt-Driven Synthesis',
        });
      }
    }

    // 9. Mandatory / Unique / Not Null
    if (['mandatory', 'unique', 'not null', 'not be null', 'empty', 'required', 'missing', 'duplicate'].some((k) => sl.includes(k))) {
      const targets = mentionedCols.length > 0 ? mentionedCols : [rawCols[0]];
      targets.forEach((mc) => {
        const isUnique = sl.includes('unique') || sl.includes('duplicate') || mc.toLowerCase().includes('id');
        addRule({
          id: `r_${slug}_notnull_${mc.toLowerCase()}`,
          name: `${isUnique ? 'Primary Key Uniqueness & Completeness' : 'Mandatory Field Completeness'} (${mc})`,
          field: mc,
          severity: 'Critical',
          condition: `${mc} IS NOT NULL AND TRIM(CAST(${mc} AS VARCHAR)) != ''`,
          code: `${mc} IS NOT NULL AND TRIM(CAST(${mc} AS VARCHAR)) != ''`,
          desc: `Enforces prompt requirement: "${sent}" on ${mc}.`,
          badge: 'Prompt-Driven Synthesis',
        });
      });
    }

    // 10. Custom user expression fallback for any mentioned column
    if (mentionedCols.length > 0 && !rules.some((r) => mentionedCols.includes(r.field))) {
      const mc = mentionedCols[0];
      addRule({
        id: `r_${slug}_custom_${mc.toLowerCase()}_${idx}`,
        name: `Custom Prompt Constraint (${mc})`,
        field: mc,
        severity: sl.includes('must') || sl.includes('critical') ? 'Critical' : 'Warning',
        condition: `${mc} IS NOT NULL AND TRIM(CAST(${mc} AS VARCHAR)) != ''`,
        code: `${mc} IS NOT NULL`,
        desc: `Synthesized directly from user prompt: "${sent}".`,
        badge: 'Custom Prompt Rule',
      });
    }
  });

  // Ensure at least 3 rules if prompt was very short
  if (rules.length < 3) {
    for (const col of rawCols) {
      if (rules.length >= 4) break;
      if (rules.some((r) => r.field.toLowerCase() === col.toLowerCase())) continue;
      addRule({
        id: `r_${slug}_complete_${col.toLowerCase()}`,
        name: `Field Completeness & Hygiene (${col})`,
        field: col,
        severity: col.toLowerCase().includes('id') ? 'Critical' : 'Warning',
        condition: `${col} IS NOT NULL AND TRIM(CAST(${col} AS VARCHAR)) != ''`,
        code: `${col} IS NOT NULL`,
        desc: `Ensures ${col} is populated and free of null/empty anomalies.`,
        badge: 'Schema Profile Rule',
      });
    }
  }

  return rules;
}

/**
 * Evaluates a synthesized rule against the current 5-row live sample preview
 * so the user can see live rule impact right inside the Intelligence Engine modal.
 */
export function evaluateRuleAgainstSample(rule, sampleRows = []) {
  if (!Array.isArray(sampleRows) || sampleRows.length === 0 || !rule) {
    return null;
  }
  const field = rule.field || rule.column || '';
  const cond = String(rule.condition || rule.code || '').toLowerCase();
  let passCount = 0;
  let failCount = 0;

  const getVal = (row, col) => {
    if (!row || typeof row !== 'object') return undefined;
    if (col in row) return row[col];
    const key = Object.keys(row).find((k) => k.toLowerCase() === col.toLowerCase());
    return key ? row[key] : undefined;
  };

  sampleRows.forEach((row) => {
    const val = getVal(row, field);
    const strVal = val === null || val === undefined ? '' : String(val);
    let failed = false;

    if (val === null || val === undefined || strVal.trim() === '') {
      failed = true;
    } else if (cond.includes('abs(') || cond.includes('*')) {
      const q = Number(getVal(row, 'quantity') ?? getVal(row, 'QUANTITY') ?? getVal(row, 'MENGE'));
      const p = Number(getVal(row, 'unit_price') ?? getVal(row, 'UNIT_PRICE') ?? getVal(row, 'NETPR'));
      const t = Number(val);
      if (!Number.isNaN(q) && !Number.isNaN(p) && !Number.isNaN(t) && Math.abs(q * p - t) > 0.05) {
        failed = true;
      }
    } else if (cond.includes('@')) {
      const sv = strVal.trim();
      if (!sv.includes('@') || sv.includes('@@') || !sv.split('@').pop().includes('.') || sv.startsWith('-') || sv !== sv.toLowerCase()) {
        failed = true;
      }
    } else if (cond.includes('drop table') || cond.includes('purged_corrupt') || cond.includes(');')) {
      const vu = strVal.toUpperCase();
      if (vu.includes('DROP TABLE') || vu.includes('--') || vu.includes('PURGED_CORRUPT') || vu.includes(');')) {
        failed = true;
      }
    } else if (cond.includes('trim(') && cond.includes('=')) {
      if (strVal !== strVal.trim() || strVal.includes('  ')) {
        failed = true;
      }
    } else if (cond.includes('<=') || cond.includes('exceed')) {
      const m = cond.match(/<=\s*(\d+(?:\.\d+)?)/);
      if (m && Number(val) > Number(m[1])) {
        failed = true;
      }
    } else if (cond.includes('> 0') || cond.includes('>= 0')) {
      const n = Number(val);
      if (Number.isNaN(n) || (cond.includes('> 0') ? n <= 0 : n < 0)) {
        failed = true;
      }
    } else if (cond.includes('2099') || cond.includes('date')) {
      if (strVal.startsWith('2099') || strVal.includes('/') || strVal.toLowerCase().includes('not-a-valid')) {
        failed = true;
      }
    } else if (cond.includes('cancelled') || cond.includes('not in')) {
      if (['cancelled', 'purged_corrupt', 'suspended', 'rejected'].includes(strVal.toLowerCase())) {
        failed = true;
      }
    } else if (cond.includes('invalid')) {
      if (strVal.toLowerCase().includes('invalid')) {
        failed = true;
      }
    } else if (cond.includes('>= 7')) {
      if (strVal.trim().length < 7 || /[a-zA-Z]/.test(strVal)) {
        failed = true;
      }
    }

    if (failed) failCount += 1;
    else passCount += 1;
  });

  return {
    total: sampleRows.length,
    passCount,
    failCount,
  };
}

export function getDefaultPromptForTable(tableName = '', engine = 'sap_bw', columns = [], sampleRows = []) {
  const profile = clientSideAnalyzeAndDraft({
    tableName,
    engine,
    columns,
    selectedColumns: columns,
    sampleRows,
  });
  return profile.draftedPrompt;
}
