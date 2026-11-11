import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  Check, 
  AlertTriangle, 
  Activity, 
  Inbox,
  Clock 
} from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { 
  getStoredNotifications, 
  markAsRead, 
  markAllAsRead, 
  subscribeToNotifications, 
  syncBackendAlerts 
} from '../../services/notificationService';

// Exact baseline notifications matching Figma 00.5
const FIGMA_BASELINE_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Dry run completed',
    message: '1,420 rows evaluated · 96.7% health · 153 quarantined',
    type: 'success',
    time: '2 min',
    screen: 'dry-run-results',
    read: false
  },
  {
    id: 'notif-2',
    title: 'Distribution & schema drift alert',
    message: 'Drift anomaly score 44.3%',
    type: 'drift',
    time: '3 min',
    screen: 'ml-certify',
    read: false
  },
  {
    id: 'notif-3',
    title: 'Quarantine spike alert',
    message: 'Quarantine rate 62.5% breached the 15% threshold',
    type: 'alert',
    time: '6 min',
    screen: 'quarantine',
    read: false
  },
  {
    id: 'notif-4',
    title: 'Pipeline run completed',
    message: 'SAP PO pipeline · 99.0% health · 1,420 rows validated',
    type: 'success',
    time: '8 min',
    screen: 'history',
    read: false
  },
  {
    id: 'notif-5',
    title: 'Quarantine review pending',
    message: '14 records in DLQ need Lead Data Steward sign-off · $1.42M held',
    type: 'quarantine',
    time: '21 min',
    screen: 'quarantine',
    read: false
  },
  {
    id: 'notif-6',
    title: 'Distribution drift detected',
    message: 'MARA material category shifted 24.5% from baseline',
    type: 'drift',
    time: '1 h',
    screen: 'history',
    read: false
  }
];

export default function NotificationCenter() {
  const { navigateTo } = useNavigation();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const menuRef = useRef(null);

  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = getStoredNotifications();
      if (Array.isArray(stored) && stored.length > 0) {
        // Filter out any legacy dummy drift alerts
        const cleaned = stored.filter(n => !n.id?.startsWith('alert_') && !n.message?.includes('anomaly score') || n.id === 'notif_2' || n.id === 'notif-2');
        if (cleaned.length > 0) return cleaned;
      }
    } catch {}
    return FIGMA_BASELINE_NOTIFICATIONS;
  });

  // Subscribe to genuine event dispatches (no dummy polling)
  useEffect(() => {
    const unsubscribe = subscribeToNotifications((updatedList) => {
      if (Array.isArray(updatedList) && updatedList.length > 0) {
        setNotifications(updatedList);
      }
    });
    return unsubscribe;
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const totalCount = notifications.length;

  const handleMarkAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    markAllAsRead();
  };

  const handleItemClick = (notif) => {
    const updated = notifications.map(n => n.id === notif.id ? { ...n, read: true } : n);
    setNotifications(updated);
    markAsRead(notif.id);
    setIsOpen(false);
    if (notif.screen) {
      navigateTo(notif.screen);
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read) 
    : notifications;

  // Custom Icon Rendering matching Figma 00.5
  const renderIcon = (type) => {
    switch (type) {
      case 'success':
        return (
          <div className="w-9 h-9 rounded-xl bg-[#EAFBEB] text-[#127A52] flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 stroke-[2.5]" />
          </div>
        );
      case 'drift':
        return (
          <div className="w-9 h-9 rounded-xl bg-[#FEF6E9] text-[#B5740D] flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4 stroke-[2]" />
          </div>
        );
      case 'alert':
      case 'error':
        return (
          <div className="w-9 h-9 rounded-xl bg-[#FDEDEB] text-[#C2362F] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 stroke-[2]" />
          </div>
        );
      case 'quarantine':
        return (
          <div className="w-9 h-9 rounded-xl bg-[#FEF3E8] text-[#C06815] flex items-center justify-center shrink-0">
            <Inbox className="w-4 h-4 stroke-[2]" />
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-xl bg-[#F5F6FA] text-[#5F6678] flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-[#5F6678] hover:text-[#0A0F1F] dark:hover:text-white hover:bg-[#F5F6FA] dark:hover:bg-white/[0.05] rounded-full transition-colors relative cursor-pointer"
        title="Notifications"
        aria-label="Open notifications"
      >
        <Bell className="w-4 h-4 text-[#8E95A9]" />
        {unreadCount > 0 && (
          <span className="min-w-[16px] h-4 px-1 rounded-full bg-[#2D55F5] text-white text-[10px] font-bold flex items-center justify-center absolute -top-1 -right-1 shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Clean White Notification Panel (Figma 00.5) - Dynamically responsive */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-[calc(100vw-24px)] max-w-[360px] sm:max-w-[400px] max-h-[calc(100vh-80px)] sm:max-h-[min(520px,84vh)] bg-white dark:bg-[#18181C] border border-[#E3E6EE] dark:border-white/[0.08] rounded-2xl shadow-2xl shadow-slate-900/15 z-50 overflow-hidden text-left font-sans animate-in fade-in slide-in-from-top-2 duration-180 flex flex-col">
          
          {/* Header */}
          <div className="px-4.5 pt-4 pb-2.5 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#0A0F1F] dark:text-white leading-tight">
                  Notifications
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EEF2FF] text-[#2D55F5] dark:bg-blue-950/40 dark:text-blue-400">
                  {unreadCount} new
                </span>
              </div>

              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-[#5F6678] hover:text-[#0A0F1F] dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
              >
                Mark all read
              </button>
            </div>

            {/* Filter Tabs Capsule */}
            <div className="mt-2.5 bg-[#EDEFF5] dark:bg-white/[0.06] p-0.5 rounded-full inline-flex items-center text-xs">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  filter === 'all'
                    ? 'bg-white dark:bg-[#2A2B32] text-[#2D55F5] shadow-2xs'
                    : 'text-[#5F6678] dark:text-slate-400 hover:text-[#0A0F1F]'
                }`}
              >
                All ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  filter === 'unread'
                    ? 'bg-white dark:bg-[#2A2B32] text-[#2D55F5] shadow-2xs'
                    : 'text-[#5F6678] dark:text-slate-400 hover:text-[#0A0F1F]'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </div>

          {/* Notification List Items - Scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar divide-y divide-[#E3E6EE] dark:divide-white/[0.06] border-t border-[#E3E6EE] dark:border-white/[0.06]">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-6 text-center text-xs text-[#5F6678] dark:text-slate-400">
                No notifications in queue. All pipelines healthy!
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isUnread = !notif.read;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className="px-5 py-3.5 flex items-start gap-3.5 hover:bg-[#F8FAFC] dark:hover:bg-white/[0.03] transition-colors cursor-pointer group"
                  >
                    {renderIcon(notif.type)}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-[#0A0F1F] dark:text-white leading-tight group-hover:text-[#2D55F5] transition-colors">
                          {notif.title}
                        </p>
                        <span className="text-[11px] text-[#8E95A9] dark:text-slate-500 font-mono shrink-0">
                          {notif.time || 'just now'}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#5F6678] dark:text-slate-400 leading-relaxed mt-0.5">
                        {notif.message}
                      </p>
                    </div>

                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-[#2D55F5] shrink-0 mt-1" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="py-3 px-4 bg-[#F9FAFC] dark:bg-white/[0.02] border-t border-[#E3E6EE] dark:border-white/[0.06] text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigateTo('history');
              }}
              className="text-xs font-semibold text-[#474E61] dark:text-slate-300 hover:text-[#2D55F5] transition-colors cursor-pointer"
            >
              View all activity
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
