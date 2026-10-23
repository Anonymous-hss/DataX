import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { API_BASE_URL, ApiError, apiRequest, api } from '../services/apiClient';

describe('apiClient service', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exports API_BASE_URL without trailing slash', () => {
    expect(API_BASE_URL).toBeDefined();
    expect(API_BASE_URL.endsWith('/')).toBe(false);
  });

  it('ApiError instantiates with status, message and details', () => {
    const error = new ApiError('Not found', 404, { resource: 'user' });
    expect(error.message).toBe('Not found');
    expect(error.status).toBe(404);
    expect(error.detail).toEqual({ resource: 'user' });
    expect(error.name).toBe('ApiError');
  });

  it('injects Authorization header when token is stored', async () => {
    const mockResponse = { success: true };
    fetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: (h) => (h === 'content-type' ? 'application/json' : null)
      },
      json: async () => mockResponse
    });

    const res = await apiRequest('/test-auth', {
      token: 'jwt-mock-token-xyz'
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    const [calledUrl, calledOptions] = fetch.mock.calls[0];
    expect(calledUrl).toBe(`${API_BASE_URL}/test-auth`);
    expect(calledOptions.headers['Authorization']).toBe('Bearer jwt-mock-token-xyz');
    expect(res).toEqual(mockResponse);
  });

  it('throws ApiError when response is not ok', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      headers: {
        get: (h) => (h === 'content-type' ? 'application/json' : null)
      },
      json: async () => ({ detail: 'Invalid parameters provided' })
    });

    await expect(apiRequest('/bad-request')).rejects.toThrow('Invalid parameters provided');
  });

  it('provides convenience HTTP verbs (get, post, put, delete)', async () => {
    fetch.mockResolvedValue({
      ok: true,
      headers: {
        get: () => 'application/json'
      },
      json: async () => ({ ok: true })
    });

    await api.get('/items');
    expect(fetch.mock.calls[0][1].method).toBe('GET');

    await api.post('/items', { name: 'Item 1' });
    expect(fetch.mock.calls[1][1].method).toBe('POST');
    expect(fetch.mock.calls[1][1].body).toBe(JSON.stringify({ name: 'Item 1' }));

    await api.delete('/items/1');
    expect(fetch.mock.calls[2][1].method).toBe('DELETE');
  });
});
