import { describe, it, expect, beforeEach, vi } from 'vitest';

// Provide browser localStorage and window mocks for Node test runner
const storage = {};
const mockLocalStorage = {
  getItem: (key) => storage[key] ?? null,
  setItem: (key, val) => { storage[key] = String(val); },
  removeItem: (key) => { delete storage[key]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

vi.stubGlobal('localStorage', mockLocalStorage);
vi.stubGlobal('window', {
  dispatchEvent: vi.fn(),
  localStorage: mockLocalStorage
});

import { 
  getStoredNotifications, 
  addNotification, 
  markAsRead, 
  markAllAsRead, 
  clearAllNotifications, 
  formatRelativeTime 
} from '../services/notificationService';
import { isSoundEnabled, setSoundEnabled } from '../services/soundEngine';

describe('notificationService', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('formats relative timestamps accurately', () => {
    const now = Date.now();
    expect(formatRelativeTime(now - 10000)).toBe('just now');
    expect(formatRelativeTime(now - 2 * 60 * 1000)).toBe('2 mins ago');
    expect(formatRelativeTime(now - 15 * 60 * 1000)).toBe('15 mins ago');
    expect(formatRelativeTime(now - 2 * 60 * 60 * 1000)).toBe('2 hours ago');
    expect(formatRelativeTime(now - 24 * 60 * 60 * 1000)).toBe('1 day ago');
    expect(formatRelativeTime(now - 48 * 60 * 60 * 1000)).toBe('2 days ago');
    expect(formatRelativeTime(null)).toBe('just now');
  });

  it('adds dynamic notifications and retrieves them', () => {
    const notif = addNotification({
      title: 'Test Anomaly Alert',
      message: 'Distribution drift observed on SAP PO.',
      type: 'warning',
      screen: 'quarantine',
      playSound: false
    });

    expect(notif.id).toBeDefined();
    expect(notif.title).toBe('Test Anomaly Alert');
    expect(notif.read).toBe(false);

    const stored = getStoredNotifications();
    expect(stored.length).toBeGreaterThan(0);
    expect(stored[0].id).toBe(notif.id);
  });

  it('marks notifications as read individually and in bulk', () => {
    const notif1 = addNotification({ title: 'Task 1', message: 'Test 1', playSound: false });
    const notif2 = addNotification({ title: 'Task 2', message: 'Test 2', playSound: false });

    markAsRead(notif1.id);
    let stored = getStoredNotifications();
    const item1 = stored.find(n => n.id === notif1.id);
    expect(item1?.read).toBe(true);

    markAllAsRead();
    stored = getStoredNotifications();
    expect(stored.every(n => n.read)).toBe(true);
  });

  it('clears notifications cleanly', () => {
    addNotification({ title: 'Temp', message: 'Temp msg', playSound: false });
    const cleared = clearAllNotifications();
    expect(cleared).toEqual([]);
    expect(getStoredNotifications()).toEqual([]);
  });

  it('toggles audio sound preferences in localStorage', () => {
    setSoundEnabled(false);
    expect(isSoundEnabled()).toBe(false);
    setSoundEnabled(true);
    expect(isSoundEnabled()).toBe(true);
  });
});
