import { describe, it, expect, beforeEach } from 'vitest';
import { errorMonitoring } from '../services/errorMonitoring';

describe('errorMonitoring service', () => {
  beforeEach(() => {
    errorMonitoring.clearErrors();
  });

  it('records breadcrumbs with timestamps and categories', () => {
    errorMonitoring.addBreadcrumb('Navigation', 'User navigated to #threads');
    errorMonitoring.addBreadcrumb('API', 'POST /rules/generate succeeded', { count: 3 });

    expect(errorMonitoring.breadcrumbs.length).toBeGreaterThanOrEqual(2);
    const last = errorMonitoring.breadcrumbs[errorMonitoring.breadcrumbs.length - 1];
    expect(last.category).toBe('API');
    expect(last.message).toBe('POST /rules/generate succeeded');
    expect(last.data).toEqual({ count: 3 });
  });

  it('captures exception and stores in local ring buffer', () => {
    const error = new Error('Test crash event');
    const payload = errorMonitoring.captureException(error, { action: 'canvas_save' });

    expect(payload.name).toBe('Error');
    expect(payload.message).toBe('Test crash event');
    expect(payload.extra.action).toBe('canvas_save');

    const recent = errorMonitoring.getRecentErrors();
    expect(recent.length).toBeGreaterThan(0);
    expect(recent[0].message).toBe('Test crash event');
  });

  it('clears error ring buffer properly', () => {
    errorMonitoring.captureException(new Error('Sample error'));
    expect(errorMonitoring.getRecentErrors().length).toBeGreaterThan(0);

    errorMonitoring.clearErrors();
    expect(errorMonitoring.getRecentErrors().length).toBe(0);
  });
});
