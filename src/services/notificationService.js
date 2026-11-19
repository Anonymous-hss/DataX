/**
 * DataX Real-Time Enterprise Notification & Event Service
 * Manages live notification streams, audio chime playback, dynamic relative timestamps,
 * and backend alert synchronization.
 */

import { playNotificationSound, isSoundEnabled, setSoundEnabled } from './soundEngine';
import { api } from './apiClient';

const STORAGE_KEY = 'datax_notifications_v6';
const EVENT_NAME = 'datax_notification_event';

// Zero dummy notifications by default for new accounts
const BASELINE_NOTIFICATIONS = [];
const LEGACY_DUMMY_IDS = new Set([
  'notif_1', 'notif_2', 'notif_3', 'notif_4', 'notif_5', 'notif_6',
  'notif-1', 'notif-2', 'notif-3', 'notif-4', 'notif-5', 'notif-6'
]);

export function getStoredNotifications() {
  if (typeof window === 'undefined') return [];
  try {
    // Purge old legacy dummy storage keys if present
    if (localStorage.getItem('datax_notifications_curated_v5')) {
      localStorage.removeItem('datax_notifications_curated_v5');
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    // Ensure no legacy dummy mock notifications slip through
    return list.filter(n => !LEGACY_DUMMY_IDS.has(n.id));
  } catch {
    return [];
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
