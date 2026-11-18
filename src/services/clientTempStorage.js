/**
 * clientTempStorage.js — Client-side IndexedDB Temporary File Storage for DataX Upload Nodes.
 *
 * Stores user-uploaded files locally in the browser (IndexedDB `datax_temp_uploads_v1`),
 * never pre-feeding files from the VM. Files are streamed to the backend server only
 * when the user clicks Process / Test in Sandbox / Run Live.
 *
 * Falls back transparently to an in-memory Map in Node/Vitest or restricted browsers.
 */

const DB_NAME = 'datax_temp_uploads_v1';
const STORE_NAME = 'files';
const DB_VERSION = 1;

export const ALLOWED_UPLOAD_EXTENSIONS = [
  '.xlsx',
  '.xls',
  '.csv',
  '.tsv',
  '.numbers',
  '.ods',
  '.json',
  '.pdf',
  '.pptx',
  '.docx',
  '.txt',
  '.md',
];

export const SPREADSHEET_UPLOAD_EXTENSIONS = ['.xlsx', '.xls', '.csv', '.tsv', '.numbers', '.ods'];
export const MAX_CLIENT_FILE_BYTES = 20 * 1024 * 1024; // 20 MB

const memoryStore = new Map();

function hasIndexedDb() {
  try {
    return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
  } catch {
    return false;
  }
}

function openDb() {
  return new Promise((resolve, reject) => {
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('nodeId', 'nodeId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open local temporary storage.'));
  });
}

export function formatBytes(bytes = 0) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export function getFileExtension(fileName = '') {
  const idx = String(fileName).lastIndexOf('.');
  return idx >= 0 ? String(fileName).slice(idx).toLowerCase() : '';
}

export function validateUploadFile(file) {
  if (!file || !file.name) {
    return { valid: false, error: 'No file selected.' };
  }
  const ext = getFileExtension(file.name);
  if (!ALLOWED_UPLOAD_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Unsupported file format "${ext || 'unknown'}". Supported: Excel (.xlsx, .xls), CSV/TSV, Apple Numbers (.numbers), ODS, JSON, PDF, PPTX, DOCX, TXT.`,
    };
  }
  if (file.size > MAX_CLIENT_FILE_BYTES) {
    return {
      valid: false,
      error: `File "${file.name}" (${formatBytes(file.size)}) exceeds the 20 MB limit.`,
    };
  }
  if (file.size === 0) {
    return { valid: false, error: `File "${file.name}" is empty (0 bytes).` };
  }
  return { valid: true, ext };
}

export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192;
  const parts = [];
  for (let i = 0; i < bytes.byteLength; i += chunkSize) {
    parts.push(String.fromCharCode(...bytes.subarray(i, i + chunkSize)));
  }
  return btoa(parts.join(''));
}

export async function saveTempFile(record) {
  const entry = {
    id: record.id || `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    nodeId: record.nodeId || 'default',
    fileName: record.fileName,
    ext: record.ext || getFileExtension(record.fileName),
    mimeType: record.mimeType || 'application/octet-stream',
    size: Number(record.size) || 0,
    fileRole: record.fileRole || 'auto',
    base64: record.base64 || '',
    parsedSheets: record.parsedSheets || null,
    sheetNames: record.sheetNames || [],
    columns: record.columns || [],
    rowCount: Number(record.rowCount) || 0,
    savedAt: record.savedAt || new Date().toISOString(),
    syncedToServer: Boolean(record.syncedToServer),
  };

  if (!hasIndexedDb()) {
    memoryStore.set(entry.id, entry);
    return entry;
  }

  try {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    memoryStore.set(entry.id, entry);
  }
  return entry;
}

export async function listTempFiles(nodeId = null) {
  if (!hasIndexedDb()) {
    const all = Array.from(memoryStore.values());
    return nodeId ? all.filter((f) => f.nodeId === nodeId) : all;
  }

  try {
    const db = await openDb();
    const records = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = nodeId ? store.index('nodeId').getAll(nodeId) : store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return records;
  } catch {
    const all = Array.from(memoryStore.values());
    return nodeId ? all.filter((f) => f.nodeId === nodeId) : all;
  }
}

export async function updateTempFile(id, patch) {
  const existing = (await listTempFiles()).find((f) => f.id === id);
  if (!existing) return null;
  return saveTempFile({ ...existing, ...patch });
}

export async function deleteTempFile(id) {
  memoryStore.delete(id);
  if (!hasIndexedDb()) return;
  try {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // ignore
  }
}

export async function clearTempFiles(nodeId = null) {
  if (nodeId) {
    const matching = await listTempFiles(nodeId);
    for (const item of matching) {
      await deleteTempFile(item.id);
    }
    return;
  }
  memoryStore.clear();
  if (!hasIndexedDb()) return;
  try {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // ignore
  }
}

export async function getTempStorageStats(nodeId = null) {
  const files = await listTempFiles(nodeId);
  const totalBytes = files.reduce((acc, f) => acc + (Number(f.size) || 0), 0);
  return {
    count: files.length,
    totalBytes,
    formattedSize: formatBytes(totalBytes),
  };
}
