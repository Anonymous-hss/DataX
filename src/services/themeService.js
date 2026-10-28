/**
 * DataX Enterprise Dynamic Theme Service
 * Manages Dark Mode, Light Mode, and System Theme preferences with live reactivity,
 * system media query listeners, and cross-tab synchronization.
 */

const THEME_STORAGE_KEY = 'datax_theme_mode';
const EVENT_NAME = 'datax_theme_change';

export function getStoredTheme() {
  if (typeof window === 'undefined') return 'dark';
  try {
    const val = localStorage.getItem(THEME_STORAGE_KEY);
    if (val === 'light' || val === 'dark' || val === 'system') {
      return val;
    }
    // Default to dark mode for DataX cyber enterprise aesthetic
    return 'dark';
  } catch {
    return 'dark';
  }
}

export function isDarkMode() {
  if (typeof window === 'undefined') return true;
  const pref = getStoredTheme();
  if (pref === 'dark') return true;
  if (pref === 'light') return false;
  // System mode
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function applyTheme(mode = getStoredTheme()) {
  if (typeof window === 'undefined' || !document?.documentElement) return;

  const root = document.documentElement;
  const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const shouldBeDark = mode === 'dark' || (mode === 'system' && systemPrefersDark);

  if (shouldBeDark) {
    root.classList.add('dark');
    root.classList.remove('light');
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
    root.setAttribute('data-theme', 'light');
    root.style.colorScheme = 'light';
  }

  window.dispatchEvent(new CustomEvent(EVENT_NAME, {
    detail: { mode, isDark: shouldBeDark }
  }));
}

export function setThemePreference(mode) {
  if (typeof window === 'undefined') return;
  if (!['light', 'dark', 'system'].includes(mode)) return;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch (err) {
    console.warn('[ThemeService] Storage write error:', err);
  }

  applyTheme(mode);
}

export function subscribeToThemeChanges(callback) {
  if (typeof window === 'undefined') return () => {};

  const handleCustom = (e) => {
    callback(e.detail || { mode: getStoredTheme(), isDark: isDarkMode() });
  };

  const handleStorage = (e) => {
    if (e.key === THEME_STORAGE_KEY) {
      applyTheme(getStoredTheme());
      callback({ mode: getStoredTheme(), isDark: isDarkMode() });
    }
  };

  window.addEventListener(EVENT_NAME, handleCustom);
  window.addEventListener('storage', handleStorage);

  // Listen to system OS theme changes
  let mediaQuery;
  const handleMedia = () => {
    if (getStoredTheme() === 'system') {
      applyTheme('system');
    }
  };

  if (window.matchMedia) {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleMedia);
  }

  return () => {
    window.removeEventListener(EVENT_NAME, handleCustom);
    window.removeEventListener('storage', handleStorage);
    if (mediaQuery) {
      mediaQuery.removeEventListener('change', handleMedia);
    }
  };
}

// Automatically initialize theme on bundle import
if (typeof window !== 'undefined') {
  applyTheme(getStoredTheme());
}
