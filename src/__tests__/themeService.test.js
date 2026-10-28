import { describe, it, expect, beforeEach, vi } from 'vitest';

// Provide browser localStorage and window mocks for Node test runner
const storage = {};
const mockLocalStorage = {
  getItem: (key) => storage[key] ?? null,
  setItem: (key, val) => { storage[key] = String(val); },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

const classListSet = new Set(['dark']);
const mockClassList = {
  add: (cls) => classListSet.add(cls),
  remove: (cls) => classListSet.delete(cls),
  contains: (cls) => classListSet.has(cls)
};

const mockDocumentElement = {
  classList: mockClassList,
  setAttribute: vi.fn(),
  style: {}
};

vi.stubGlobal('localStorage', mockLocalStorage);
vi.stubGlobal('document', {
  documentElement: mockDocumentElement
});
vi.stubGlobal('window', {
  dispatchEvent: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  matchMedia: vi.fn(() => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  })),
  localStorage: mockLocalStorage
});

import { 
  getStoredTheme, 
  setThemePreference, 
  isDarkMode, 
  applyTheme 
} from '../services/themeService';

describe('themeService', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    classListSet.clear();
  });

  it('defaults to dark mode when no preference stored', () => {
    expect(getStoredTheme()).toBe('dark');
  });

  it('switches to light mode and updates root element classList', () => {
    setThemePreference('light');
    expect(getStoredTheme()).toBe('light');
    expect(isDarkMode()).toBe(false);
    expect(classListSet.has('light')).toBe(true);
    expect(classListSet.has('dark')).toBe(false);
  });

  it('switches to dark mode and updates root element classList', () => {
    setThemePreference('dark');
    expect(getStoredTheme()).toBe('dark');
    expect(isDarkMode()).toBe(true);
    expect(classListSet.has('dark')).toBe(true);
    expect(classListSet.has('light')).toBe(false);
  });

  it('handles system preference using matchMedia', () => {
    setThemePreference('system');
    expect(getStoredTheme()).toBe('system');
    expect(isDarkMode()).toBe(true);
  });
});
