/**
 * DataX Real-Time Enterprise Notification & Event Service
 * Manages live notification streams, audio chime playback, dynamic relative timestamps,
 * and backend alert synchronization.
 */

import { playNotificationSound, isSoundEnabled, setSoundEnabled } from './soundEngine';
import { api } from './apiClient';

const STORAGE_KEY = 'datax_live_notifications_v2';
const EVENT_NAME = 'datax_notification_event';

// Initial realistic baseline notifications with actual relative timestamps
const BASELINE_NOTIFICATIONS = [
  {
    id: 'notif_init_1',
    title: 'Pipeline Run Completed',
    message: 'Autonomous SAP PO pipeline executed with 99.0% health score (1,420 rows validated).',
    type: 'success',
    createdAt: Date.now() - 2 * 60 * 1000, // 2 mins ago
    screen: 'history',
    read: false
  },
  {
    id: 'notif_init_2',
    title: 'Quarantine Review Pending',
    message: '14 records isolated in DLQ require Lead Data Steward sign-off ($1.42M held).',
    type: 'warning',
    createdAt: Date.now() - 15 * 60 * 1000, // 15 mins ago
    screen: 'quarantine',
    read: false
  },
  {
    id: 'notif_init_3',
    title: 'Distribution Drift Detected',
    message: 'Material Category MARA experienced 24.5% distribution shift from baseline.',
    type: 'alert',
    createdAt: Date.now() - 60 * 60 * 1000, // 1 hour ago
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
  try {
    const res = await api.get('/notifications/feed');
    if (res && Array.isArray(res.notifications)) {
      const current = getStoredNotifications();
      const existingIds = new Set(current.map(n => n.id));
      let hasNew = false;
      const newItems = [];

      for (const item of res.notifications) {
        if (!existingIds.has(item.id)) {
          hasNew = true;
          newItems.push({
            id: item.id,
            title: item.title,
            message: item.message,
            type: item.type || 'info',
            createdAt: item.createdAt || Date.now(),
            screen: item.screen || 'history',
            read: false
          });
        }
      }

      if (hasNew) {
        const merged = [...newItems, ...current].slice(0, 50);
        saveStoredNotifications(merged);
        playNotificationSound(newItems[0].type || 'info');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { all: merged } }));
        }
        return merged;
      }
    }
  } catch (err) {
    // Gracefully handle offline or network delay
  }
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
