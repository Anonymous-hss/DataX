/**
 * DataX Real-Time Enterprise Notification & Event Service
 * Manages live notification streams, audio chime playback, dynamic relative timestamps,
 * and backend alert synchronization.
 */

import { playNotificationSound, isSoundEnabled, setSoundEnabled } from './soundEngine';
import { api } from './apiClient';

const STORAGE_KEY = 'datax_notifications_curated_v5';
const EVENT_NAME = 'datax_notification_event';

// Exact 6 Clean Notifications matching Figma 00.5
const BASELINE_NOTIFICATIONS = [
  {
    id: 'notif_1',
    title: 'Dry run completed',
    message: '1,420 rows evaluated · 96.7% health · 153 quarantined',
    type: 'success',
    time: '2 min',
    createdAt: Date.now() - 2 * 60 * 1000,
    screen: 'dry-run-results',
    read: false
  },
  {
    id: 'notif_2',
    title: 'Distribution & schema drift alert',
    message: 'Drift anomaly score 44.3%',
    type: 'drift',
    time: '3 min',
    createdAt: Date.now() - 3 * 60 * 1000,
    screen: 'ml-certify',
    read: false
  },
  {
    id: 'notif_3',
    title: 'Quarantine spike alert',
    message: 'Quarantine rate 62.5% breached the 15% threshold',
    type: 'alert',
    time: '6 min',
    createdAt: Date.now() - 6 * 60 * 1000,
    screen: 'quarantine',
    read: false
  },
  {
    id: 'notif_4',
    title: 'Pipeline run completed',
    message: 'SAP PO pipeline · 99.0% health · 1,420 rows validated',
    type: 'success',
    time: '8 min',
    createdAt: Date.now() - 8 * 60 * 1000,
    screen: 'history',
    read: false
  },
  {
    id: 'notif_5',
    title: 'Quarantine review pending',
    message: '14 records in DLQ need Lead Data Steward sign-off · $1.42M held',
    type: 'quarantine',
    time: '21 min',
    createdAt: Date.now() - 21 * 60 * 1000,
    screen: 'quarantine',
    read: false
  },
  {
    id: 'notif_6',
    title: 'Distribution drift detected',
    message: 'MARA material category shifted 24.5% from baseline',
    type: 'drift',
    time: '1 h',
    createdAt: Date.now() - 60 * 60 * 1000,
    screen: 'history',
    read: false
  }
];

export function getStoredNotifications() {
  if (typeof window === 'undefined') return BASELINE_NOTIFICATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(BASELINE_NOTIFICATIONS));
      return BASELINE_NOTIFICATIONS;
    }
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : BASELINE_NOTIFICATIONS;
  } catch {
    return BASELINE_NOTIFICATIONS;
  }
}

export function saveStoredNotifications(notifications) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, 50)));
  } catch (err) {
    console.warn('[NotificationService] Storage save error:', err);
  }
}

export function formatRelativeTime(timestamp) {
  if (!timestamp) return 'just now';
  const time = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
  if (isNaN(time)) return 'just now';

  const diffMs = Date.now() - time;
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSec < 45) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mins ago`;
  if (diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  const days = Math.floor(diffSec / 86400);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export function addNotification({ title, message, description, type = 'info', screen = 'history', link, playSound = true }) {
  const notif = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title,
    message: message || description || '',
    type, // 'success' | 'warning' | 'alert' | 'error' | 'info'
    createdAt: Date.now(),
    screen: screen || (link ? link.replace('#', '') : 'history'),
    read: false
  };

  const current = getStoredNotifications();
  const updated = [notif, ...current].slice(0, 50);
  saveStoredNotifications(updated);

  // Play synthesized audio tone
  if (playSound) {
    playNotificationSound(type);
  }

  // Broadcast custom event for live subscribers
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { notification: notif, all: updated } }));
  }

  return notif;
}

export function markAsRead(id) {
  const current = getStoredNotifications();
  const updated = current.map(n => n.id === id ? { ...n, read: true } : n);
  saveStoredNotifications(updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { all: updated } }));
  }
  return updated;
}

export function markAllAsRead() {
  const current = getStoredNotifications();
  const updated = current.map(n => ({ ...n, read: true }));
  saveStoredNotifications(updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { all: updated } }));
  }
  return updated;
}

export function clearAllNotifications() {
  saveStoredNotifications([]);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { all: [] } }));
  }
  return [];
}

export async function syncBackendAlerts() {
  // Return clean curated notifications - no dummy auto-alert polling
  return getStoredNotifications();
}

export function subscribeToNotifications(callback) {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = (e) => {
    if (e.detail?.all) {
      callback(e.detail.all);
    } else {
      callback(getStoredNotifications());
    }
  };

  const handleStorageEvent = (e) => {
    if (e.key === STORAGE_KEY) {
      callback(getStoredNotifications());
    }
  };

  window.addEventListener(EVENT_NAME, handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener(EVENT_NAME, handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
}

export { isSoundEnabled, setSoundEnabled, playNotificationSound };
