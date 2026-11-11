/**
 * DataX Real-Time Enterprise Notification & Event Service
 * Manages live notification streams, audio chime playback, dynamic relative timestamps,
 * and backend alert synchronization.
 */

import { playNotificationSound, isSoundEnabled, setSoundEnabled } from './soundEngine';
import { api } from './apiClient';

const STORAGE_KEY = 'datax_live_notifications_v3';
const EVENT_NAME = 'datax_notification_event';

// Initial realistic baseline notifications matching Figma 00.5
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
  },
  // Additional historical items to establish 20 in queue
  {
    id: 'notif_7',
    title: 'Zero-Egress Vault Rotation',
    message: 'AES-256-GCM symmetric session keys successfully cycled.',
    type: 'success',
    time: '2 h',
    createdAt: Date.now() - 120 * 60 * 1000,
    screen: 'connections',
    read: false
  },
  {
    id: 'notif_8',
    title: 'AST Parser Optimization',
    message: 'DuckDB vectorized micro-batch throughput improved by 14%.',
    type: 'success',
    time: '3 h',
    createdAt: Date.now() - 180 * 60 * 1000,
    screen: 'history',
    read: false
  },
  {
    id: 'notif_9',
    title: 'PostgreSQL Pool Handshake',
    message: 'Active connection pool steady at 12 active / 20 max idle.',
    type: 'success',
    time: '4 h',
    createdAt: Date.now() - 240 * 60 * 1000,
    screen: 'connections',
    read: false
  },
  {
    id: 'notif_10',
    title: 'Snowflake Egress Gate Verified',
    message: 'Zero raw plaintext egress detected during batch transform.',
    type: 'success',
    time: '5 h',
    createdAt: Date.now() - 300 * 60 * 1000,
    screen: 'ai-firewall',
    read: false
  },
  {
    id: 'notif_11',
    title: 'Audit Ledger Merkle Root',
    message: 'SHA-256 hash chain sealed for batch #9402.',
    type: 'success',
    time: '6 h',
    createdAt: Date.now() - 360 * 60 * 1000,
    screen: 'audit',
    read: false
  },
  {
    id: 'notif_12',
    title: 'LangGraph Consensus Verified',
    message: 'Multi-agent consensus achieved on 4 syntax remediation fixes.',
    type: 'success',
    time: '7 h',
    createdAt: Date.now() - 420 * 60 * 1000,
    screen: 'canvas',
    read: false
  },
  {
    id: 'notif_13',
    title: 'Schema Parity Reconciled',
    message: 'Shadow twin verified 100% column parity on OPUR_C01.',
    type: 'success',
    time: '8 h',
    createdAt: Date.now() - 480 * 60 * 1000,
    screen: 'shadow',
    read: false
  },
  {
    id: 'notif_14',
    title: 'Auto-Fix Cache Purge',
    message: 'Cleaned 48 expired synthetic simulation tokens.',
    type: 'success',
    time: '9 h',
    createdAt: Date.now() - 540 * 60 * 1000,
    screen: 'settings',
    read: false
  },
  {
    id: 'notif_15',
    title: 'S3 Stage Checkpoint',
    message: 'Readiness check passed for supply chain parquet lakehouse.',
    type: 'success',
    time: '10 h',
    createdAt: Date.now() - 600 * 60 * 1000,
    screen: 'connections',
    read: false
  },
  {
    id: 'notif_16',
    title: 'RBAC Permission Review',
    message: 'Lead Data Engineer persona privileges verified against IAM.',
    type: 'success',
    time: '12 h',
    createdAt: Date.now() - 720 * 60 * 1000,
    screen: 'settings',
    read: false
  },
  {
    id: 'notif_17',
    title: 'DuckDB In-Memory Snapshot',
    message: 'Scratch database memory compacted under 42 MB.',
    type: 'success',
    time: '14 h',
    createdAt: Date.now() - 840 * 60 * 1000,
    screen: 'canvas',
    read: false
  },
  {
    id: 'notif_18',
    title: 'Executive ROI Computation',
    message: 'Estimated engineering hours saved: 142.5 hrs this month.',
    type: 'success',
    time: '16 h',
    createdAt: Date.now() - 960 * 60 * 1000,
    screen: 'roi',
    read: false
  },
  {
    id: 'notif_19',
    title: 'DLQ Retry Schedule',
    message: 'Automated retry worker initialized for next cron window.',
    type: 'quarantine',
    time: '18 h',
    createdAt: Date.now() - 1080 * 60 * 1000,
    screen: 'quarantine',
    read: false
  },
  {
    id: 'notif_20',
    title: 'Tenant Isolation Health',
    message: 'PostgreSQL schema namespace isolation 100% compliant.',
    type: 'success',
    time: '1 d',
    createdAt: Date.now() - 1440 * 60 * 1000,
    screen: 'settings',
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
