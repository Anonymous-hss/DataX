import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { API_BASE_URL, fmdApi } from '../services/apiClient';
import { OPERATIONAL_CATALOG } from '../components/cleanflow/constants/nodeCatalog';
import { DIRECTORY_SECTIONS } from '../components/common/navigate/PlatformDirectoryColumn';

describe('FMD Mapping Studio API & Catalog Integration', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('builds correct download and BODS export URLs', () => {
    expect(fmdApi.getDemoDownloadUrl('all_zip')).toBe(`${API_BASE_URL}/fmd/demo/download/all_zip`);
    expect(fmdApi.getBodsExportUrl('xlsx')).toBe(`${API_BASE_URL}/fmd/export/bods?format=xlsx`);
    expect(fmdApi.getBodsExportUrl('csv')).toBe(`${API_BASE_URL}/fmd/export/bods?format=csv`);
  });

  it('posts compare, ask, and simulate requests with expected payloads', async () => {
    fetch.mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ status: 'success' }),
    });

    await fmdApi.seedDemo();
    expect(fetch.mock.calls[0][0]).toBe(`${API_BASE_URL}/fmd/demo/seed`);
    expect(fetch.mock.calls[0][1].method).toBe('POST');

    await fmdApi.compare('MAKT', 'MAKTX');
    expect(fetch.mock.calls[1][0]).toBe(`${API_BASE_URL}/fmd/compare`);
    expect(fetch.mock.calls[1][1].body).toBe(JSON.stringify({ targetTable: 'MAKT', targetField: 'MAKTX' }));

    await fmdApi.simulate({ targetTable: 'MAKT', targetField: 'MAKTX', xrefEnabled: false, applyCmmsOverride: true });
    expect(fetch.mock.calls[2][0]).toBe(`${API_BASE_URL}/fmd/simulate`);
    const simBody = JSON.parse(fetch.mock.calls[2][1].body);
    expect(simBody.xrefEnabled).toBe(false);
    expect(simBody.applyCmmsOverride).toBe(true);
  });

  it('includes dedicated FMD & Multi-Tab Excel Source node in Visual Canvas catalog', () => {
    const ingestion = OPERATIONAL_CATALOG.find((c) => c.category.includes('Ingestion Sources'));
    expect(ingestion).toBeDefined();
    const excelFmdNode = ingestion.items.find((i) => i.name.includes('FMD & Multi-Tab Excel Source'));
    expect(excelFmdNode).toBeDefined();
    expect(excelFmdNode.type).toBe('source');
  });

  it('registers FMD Mapping Studio in the platform navigation directory', () => {
    const ops = DIRECTORY_SECTIONS.find((s) => s.group === 'OPERATIONS');
    expect(ops).toBeDefined();
    const studio = ops.items.find((i) => i.screen === 'mapping-studio');
    expect(studio).toBeDefined();
    expect(studio.label).toBe('FMD Mapping Studio');
  });
});
