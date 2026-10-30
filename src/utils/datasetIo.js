import * as XLSX from 'xlsx';

/**
 * Extracts ordered union of column names across records.
 */
export function extractColumnsFromRecords(records = []) {
  const seen = new Set();
  const cols = [];
  const sampleLimit = Math.min(records.length, 300);
  for (let i = 0; i < sampleLimit; i += 1) {
    const row = records[i];
    if (row && typeof row === 'object' && !Array.isArray(row)) {
      Object.keys(row).forEach((k) => {
        if (!seen.has(k)) {
          seen.add(k);
          cols.push(k);
        }
      });
    }
  }
  return cols;
}

/**
 * Parses raw JSON or JSONL text into structured records and columns.
 */
export function parseJsonOrJsonlText(rawText) {
  const trimmed = (rawText || '').trim();
  if (!trimmed) {
    throw new Error('Input text is empty.');
  }

  let records = [];
  if (trimmed.startsWith('[')) {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) {
      throw new Error('Expected a JSON array of objects.');
    }
    records = parsed.filter((item) => item && typeof item === 'object');
  } else {
    // Try full JSON object first (e.g. { data: [...] } or single JSON object), else parse line-by-line JSONL
    let parsedWhole = null;
    if (trimmed.startsWith('{') && !trimmed.includes('\n{')) {
      try {
        parsedWhole = JSON.parse(trimmed);
      } catch {
        parsedWhole = null;
      }
    }

    if (parsedWhole && typeof parsedWhole === 'object') {
      const candidateArr =
        parsedWhole.records ||
        parsedWhole.data ||
        parsedWhole.rows ||
        parsedWhole.items ||
        parsedWhole.chunks;
      if (Array.isArray(candidateArr)) {
        records = candidateArr;
      } else {
        records = [parsedWhole];
      }
    } else {
      const lines = trimmed
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      records = lines.map((line, idx) => {
        try {
          return JSON.parse(line);
        } catch (err) {
          throw new Error(`Invalid JSON on line ${idx + 1}: ${err.message}`);
        }
      });
    }
  }

  const columns = extractColumnsFromRecords(records);
  return { records, columns, rowCount: records.length };
}

/**
 * Parses an uploaded tabular or structured dataset file (.csv, .tsv, .xlsx, .xls, .json, .jsonl).
 */
export async function parseUploadedDatasetFile(file) {
  if (!file) {
    throw new Error('No file selected.');
  }

  const name = file.name || 'uploaded_dataset';
  const lower = name.toLowerCase();

  if (lower.endsWith('.jsonl') || lower.endsWith('.ndjson') || lower.endsWith('.json')) {
    const text = await file.text();
    const { records, columns } = parseJsonOrJsonlText(text);
    return {
      fileName: name,
      records,
      columns,
      rowCount: records.length,
    };
  }

  // Spreadsheet / Delimited formats (.csv, .tsv, .xlsx, .xls) via SheetJS
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', raw: false });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error(`No worksheet found in "${name}".`);
  }
  const sheet = workbook.Sheets[firstSheetName];
  const records = XLSX.utils.sheet_to_json(sheet, { defval: null });
  const columns = extractColumnsFromRecords(records);

  return {
    fileName: name,
    sheetNames: workbook.SheetNames,
    records,
    columns,
    rowCount: records.length,
  };
}

/**
 * Converts tabular records into RAG chunks using a chosen text column (and optional document ID/title column).
 */
export function recordsToRagChunks(records = [], { textColumn = '', titleColumn = '', defaultSource = 'dataset' } = {}) {
  const cols = extractColumnsFromRecords(records);
  const guessedTextCol =
    textColumn && cols.includes(textColumn)
      ? textColumn
      : cols.find((c) =>
          ['text', 'content', 'chunk', 'body', 'document', 'passage', 'description', 'message', 'notes', 'answer'].includes(
            c.toLowerCase()
          )
        ) || '';

  const guessedTitleCol =
    titleColumn && cols.includes(titleColumn)
      ? titleColumn
      : cols.find((c) =>
          ['docname', 'doc_name', 'title', 'source', 'filename', 'file_name', 'id', 'url'].includes(c.toLowerCase())
        ) || '';

  return records
    .map((row, idx) => {
      let text = '';
      if (guessedTextCol && row[guessedTextCol] !== null && row[guessedTextCol] !== undefined) {
        text = String(row[guessedTextCol]);
      } else {
        // Serialize all non-empty fields into key: value document text
        text = Object.entries(row)
          .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== '')
          .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
          .join('\n');
      }

      const docName =
        guessedTitleCol && row[guessedTitleCol]
          ? `${defaultSource} :: ${String(row[guessedTitleCol])}`
          : `${defaultSource}#row_${idx + 1}`;

      return {
        docName,
        text: text.trim(),
        metadata: row,
      };
    })
    .filter((c) => c.text.length > 0);
}

/**
 * Parses one or more uploaded files for the RAG Pre-Embedding Firewall.
 * Supports unstructured documents (.txt, .md, .log, .html) AND structured files (.csv, .tsv, .xlsx, .json, .jsonl).
 */
export async function parseUploadedRagFiles(fileList) {
  const files = Array.from(fileList || []);
  if (files.length === 0) {
    throw new Error('No files selected.');
  }

  const chunks = [];
  let lastTabular = null;

  for (const file of files) {
    const name = file.name || 'document';
    const lower = name.toLowerCase();

    if (
      lower.endsWith('.csv') ||
      lower.endsWith('.tsv') ||
      lower.endsWith('.xlsx') ||
      lower.endsWith('.xls') ||
      lower.endsWith('.json') ||
      lower.endsWith('.jsonl') ||
      lower.endsWith('.ndjson')
    ) {
      const parsed = await parseUploadedDatasetFile(file);
      lastTabular = parsed;
      const derived = recordsToRagChunks(parsed.records, { defaultSource: name });
      chunks.push(...derived);
    } else {
      const rawText = await file.text();
      if (rawText && rawText.trim()) {
        chunks.push({
          docName: name,
          text: rawText.trim(),
          metadata: { fileName: name, sizeBytes: file.size },
        });
      }
    }
  }

  return {
    chunks,
    tabularSource: files.length === 1 ? lastTabular : null,
    fileNames: files.map((f) => f.name),
  };
}

/**
 * Triggers a browser download of arbitrary text/JSON content.
 */
export function downloadTextFile(content, fileName, mimeType = 'application/json;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * Exports an array of records into .csv, .jsonl, .json, or .xlsx and downloads in the browser.
 */
export function exportRecordsToFile(records = [], baseFileName = 'datax_output', format = 'csv') {
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error('No records available to export.');
  }

  const cleanBase = (baseFileName || 'datax_output').replace(/\.(csv|jsonl|json|xlsx|xls|tsv)$/i, '');
  const fmt = (format || 'csv').toLowerCase();

  if (fmt === 'jsonl') {
    const lines = records.map((r) => JSON.stringify(r)).join('\n');
    downloadTextFile(lines, `${cleanBase}.jsonl`, 'application/x-ndjson;charset=utf-8');
    return;
  }

  if (fmt === 'json') {
    downloadTextFile(JSON.stringify(records, null, 2), `${cleanBase}.json`, 'application/json;charset=utf-8');
    return;
  }

  // Flatten nested objects/arrays cleanly for CSV / XLSX spreadsheet cells
  const flatRecords = records.map((row) => {
    const out = {};
    Object.entries(row || {}).forEach(([k, v]) => {
      out[k] = v !== null && typeof v === 'object' ? JSON.stringify(v) : v;
    });
    return out;
  });

  const worksheet = XLSX.utils.json_to_sheet(flatRecords);
  if (fmt === 'xlsx') {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Certified_Data');
    XLSX.writeFile(workbook, `${cleanBase}.xlsx`);
    return;
  }

  // Default: UTF-8 CSV with BOM for seamless Excel & pandas compatibility
  const csvContent = '\uFEFF' + XLSX.utils.sheet_to_csv(worksheet);
  downloadTextFile(csvContent, `${cleanBase}.csv`, 'text/csv;charset=utf-8');
}
