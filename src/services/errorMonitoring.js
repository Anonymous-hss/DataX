/**
 * DataX Enterprise Frontend Error Monitoring & Telemetry Service
 * Lightweight, production-grade error capture and breadcrumb tracker
 * (Sentry / Datadog equivalent for self-hosted enterprise telemetry)
 */

class ErrorMonitoringService {
  constructor() {
    this.breadcrumbs = [];
    this.recentErrors = [];
    this.maxBreadcrumbs = 30;
    this.maxRecentErrors = 20;
    this.initialized = false;
    const base = (import.meta.env?.VITE_API_BASE || (typeof window !== 'undefined' && window.location.hostname.includes('dataglow.ai') ? '/datax-api' : '')).replace(/\/+$/, '');
    this.endpoint = base ? `${base}/telemetry/errors` : '';
  }

  init() {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    // Capture global unhandled exceptions
    window.addEventListener('error', (event) => {
      this.captureException(event.error || new Error(event.message), {
        context: 'window.onerror',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureException(event.reason || new Error('Unhandled Promise Rejection'), {
        context: 'window.onunhandledrejection'
      });
    });

    this.addBreadcrumb('System', 'DataX Error Monitoring initialized');
  }

  addBreadcrumb(category, message, data = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      category,
      message,
      data
    };
    this.breadcrumbs.push(entry);
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  captureException(error, extraContext = {}) {
    const errorPayload = {
      timestamp: new Date().toISOString(),
      name: error?.name || 'Error',
      message: error?.message || String(error),
      stack: error?.stack || null,
      url: typeof window !== 'undefined' ? window.location.href : '',
      hash: typeof window !== 'undefined' ? window.location.hash : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      breadcrumbs: [...this.breadcrumbs],
      extra: extraContext
    };

    console.warn('[DataX Telemetry] Exception logged:', errorPayload.message, errorPayload);

    // Keep in-memory ring buffer
    this.recentErrors.unshift(errorPayload);
    if (this.recentErrors.length > this.maxRecentErrors) {
      this.recentErrors.pop();
    }

    // Persist to local ring buffer for inspection in Settings or Help Center
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('datax_recent_telemetry_errors') || '[]');
        stored.unshift(errorPayload);
        localStorage.setItem('datax_recent_telemetry_errors', JSON.stringify(stored.slice(0, 20)));
      } catch {
        // Storage quota or privacy sandbox safe fallback
      }
    }

    // Try reporting to backend telemetry endpoint if configured
    if (this.endpoint && !this.endpoint.startsWith('undefined')) {
      try {
        fetch(this.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorPayload),
          keepalive: true
        }).catch(() => {
          // Swallow telemetry reporting failures silently
        });
      } catch {
        // Fallback
      }
    }

    return errorPayload;
  }

  getRecentErrors() {
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = JSON.parse(localStorage.getItem('datax_recent_telemetry_errors') || '[]');
        if (stored.length > 0) return stored;
      } catch {
        // fallback to memory
      }
    }
    return [...this.recentErrors];
  }

  clearErrors() {
    this.recentErrors = [];
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem('datax_recent_telemetry_errors');
      } catch {
        // safe
      }
    }
  }
}

export const errorMonitoring = new ErrorMonitoringService();
if (typeof window !== 'undefined') {
  errorMonitoring.init();
}
