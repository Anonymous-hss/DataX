import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Trash2, AlertTriangle, CheckCircle2, Clock, X, ExternalLink } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif_1',
    title: 'Pipeline Run Completed',
    message: 'Autonomous SAP PO pipeline executed with 98.4% health score (1,420 rows validated).',
    type: 'success',
    timestamp: '2 mins ago',
    screen: 'history',
    read: false
  },
  {
    id: 'notif_2',
    title: 'Quarantine Review Pending',
    message: '7 records isolated in quarantine require Lead Data Steward sign-off.',
    type: 'warning',
    timestamp: '15 mins ago',
    screen: 'live-auto-fix',
    read: false
  },
  {
    id: 'notif_3',
    title: 'Distribution Drift Detected',
    message: 'Material Category MARA experienced 24.5% distribution shift from baseline.',
    type: 'alert',
    timestamp: '1 hour ago',
    screen: 'history',
    read: false
  }
];

export default function NotificationCenter() {
  const { navigateTo } = useNavigation();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('datax_notifications');
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const menuRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('datax_notifications', JSON.stringify(notifications));
  }, [notifications]);

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

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const handleItemClick = (notif) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    setIsOpen(false);
    if (notif.screen) {
      navigateTo(notif.screen);
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read) 
    : notifications;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors relative cursor-pointer"
        title="Notifications"
        aria-label="Open notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="min-w-4 h-4 px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center absolute -top-1 -right-1 shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Popover Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 text-left">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold text-slate-100">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-400 font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded text-[11px] flex items-center gap-1 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded text-[11px] flex items-center gap-1 transition-colors"
                  title="Clear all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/30 px-3 pt-2 gap-4 text-xs font-medium">
            <button
              onClick={() => setFilter('all')}
              className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                filter === 'all' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                filter === 'unread' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No notifications to display.
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-slate-800/50 transition-colors cursor-pointer ${
                    n.read ? 'opacity-70 bg-transparent' : 'bg-slate-800/20'
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 flex-shrink-0 mt-0.5">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="text-xs font-semibold text-slate-200 truncate">{n.title}</h4>
                      <span className="text-[10px] text-slate-500 font-mono">{n.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">{n.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
