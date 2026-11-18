import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveTempFile,
  listTempFiles,
  updateTempFile,
  deleteTempFile,
  clearTempFiles,
  getTempStorageStats,
  validateUploadFile,
} from '../services/clientTempStorage';
import { synthesizeAiPipelineFromPrompt } from '../components/mapping/FmdTemplateGallery';

describe('clientTempStorage service', () => {
  beforeEach(async () => {
    await clearTempFiles();
  });

  it('validates supported spreadsheet and document formats and rejects disallowed extensions', () => {
    expect(validateUploadFile({ name: 'mapping.xlsx', size: 1024 }).valid).toBe(true);
    expect(validateUploadFile({ name: 'legacy.xls', size: 1024 }).valid).toBe(true);
    expect(validateUploadFile({ name: 'apple_sheet.numbers', size: 2048 }).valid).toBe(true);
    expect(validateUploadFile({ name: 'extract.csv', size: 512 }).valid).toBe(true);
    expect(validateUploadFile({ name: 'spec.pdf', size: 4096 }).valid).toBe(true);
    expect(validateUploadFile({ name: 'deck.pptx', size: 4096 }).valid).toBe(true);

    expect(validateUploadFile({ name: 'virus.exe', size: 1024 }).valid).toBe(false);
    expect(validateUploadFile({ name: 'empty.xlsx', size: 0 }).valid).toBe(false);
    expect(validateUploadFile({ name: 'huge.xlsx', size: 25 * 1024 * 1024 }).valid).toBe(false);
  });

  it('saves, lists, updates, deletes, and clears local temporary files per node', async () => {
    const f1 = await saveTempFile({
      nodeId: 'node-upload-1',
      fileName: 'fmd_sheet.xlsx',
      size: 2048,
      base64: 'AAAA',
      rowCount: 15,
    });
    await saveTempFile({
      nodeId: 'node-upload-2',
      fileName: 'apple_xref.numbers',
      size: 1024,
      base64: 'BBBB',
      rowCount: 8,
    });

    const all = await listTempFiles();
    expect(all.length).toBe(2);

    const node1Files = await listTempFiles('node-upload-1');
    expect(node1Files.length).toBe(1);
    expect(node1Files[0].fileName).toBe('fmd_sheet.xlsx');

    await updateTempFile(f1.id, { syncedToServer: true });
    const updated = await listTempFiles('node-upload-1');
    expect(updated[0].syncedToServer).toBe(true);

    const stats = await getTempStorageStats();
    expect(stats.count).toBe(2);
    expect(stats.totalBytes).toBe(3072);

    await deleteTempFile(f1.id);
    expect((await listTempFiles()).length).toBe(1);

    await clearTempFiles();
    expect((await listTempFiles()).length).toBe(0);
  });
});

describe('synthesizeAiPipelineFromPrompt', () => {
  it('builds a dynamic Excel + HITL + PostgreSQL pipeline from plain English', () => {
    const res = synthesizeAiPipelineFromPrompt(
      'Upload Excel mapping files and CSV XREF tables, add HITL controller review, push to PostgreSQL'
    );
    expect(res.nodes.some((n) => n.type === 'file_upload')).toBe(true);
    expect(res.nodes.some((n) => n.type === 'hitl')).toBe(true);
    expect(res.nodes.some((n) => n.system === 'PostgreSQL')).toBe(true);
    expect(res.edges.length).toBeGreaterThanOrEqual(4);
  });

  it('builds a dynamic SAP S/4HANA to Snowflake pipeline from plain English', () => {
    const res = synthesizeAiPipelineFromPrompt(
      'Extract from SAP S/4HANA and load normalized rows into Snowflake'
    );
    expect(res.nodes.some((n) => n.system === 'SAP S/4HANA')).toBe(true);
    expect(res.nodes.some((n) => n.system === 'Snowflake')).toBe(true);
  });
});
