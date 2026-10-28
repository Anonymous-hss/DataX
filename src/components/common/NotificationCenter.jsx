import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Volume2, 
  VolumeX, 
  Zap, 
  ExternalLink 
} from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { 
  getStoredNotifications, 
  markAsRead, 
  markAllAsRead, 
  clearAllNotifications, 
  subscribeToNotifications, 
  syncBackendAlerts, 
  formatRelativeTime,
  addNotification,
  isSoundEnabled,
  setSoundEnabled,
  playNotificationSound
} from '../../services/notificationService';

export default function NotificationCenter() {
  const { navigateTo } = useNavigation();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(getStoredNotifications);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [soundOn, setSoundOn] = useState(isSoundEnabled);
  const [, setTick] = useState(0); // Forces re-render for relative times
  const menuRef = useRef(null);

  // Subscribe to live notification dispatches & storage updates
  useEffect(() => {
    const unsubscribe = subscribeToNotifications((updatedList) => {
      setNotifications(updatedList);
    });
    return unsubscribe;
  }, []);

  // Poll backend for real alerts every 12 seconds
  useEffect(() => {
    syncBackendAlerts();
    const pollInterval = setInterval(() => {
      syncBackendAlerts();
    }, 12000);
    return () => clearInterval(pollInterval);
  }, []);

  // Update relative timestamps ("just now", "2 mins ago") every 25 seconds
  useEffect(() => {
    const tickInterval = setInterval(() => {
      setTick(t => t + 1);
    }, 25000);
    return () => clearInterval(tickInterval);
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

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) {
      playNotificationSound('pop');
    }
  };

  const handleTestAlert = () => {
    addNotification({
      title: 'Real-Time Telemetry Alert',
      message: 'Simulated pipeline anomaly detected on Material Category MARA. Audio alert active.',
      type: 'alert',
      screen: 'quarantine'
    });
  };

  const handleMarkAllRead = () => {
    const updated = markAllAsRead();
    setNotifications(updated);
  };

  const handleClearAll = () => {
    const updated = clearAllNotifications();
    setNotifications(updated);
  };

  const handleItemClick = (notif) => {
    const updated = markAsRead(notif.id);
    setNotifications(updated);
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
      case 'error':
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
          <span className="min-w-4 h-4 px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center absolute -top-1 -right-1 shadow-sm animate-in zoom-in-50 duration-200">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Popover Dropdown (Matches user screenshot) */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0B1226] border border-[#1E293B] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 text-left font-sans">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#1E293B] flex items-center justify-between bg-[#0F172A]">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-slate-400">
              {/* Sound Mute/Unmute Control */}
              <button
                onClick={handleToggleSound}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  soundOn ? 'text-blue-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-800'
                }`}
                title={soundOn ? 'Audio Chimes Active (Click to mute)' : 'Audio Muted (Click to enable)'}
              >
                {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              {/* Trigger Live Test Notification */}
              <button
                onClick={handleTestAlert}
                className="p-1.5 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Simulate Live Production Alert (with sound)"
              >
                <Zap className="w-3.5 h-3.5" />
              </button>

              {/* Mark All Read */}
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="p-1.5 hover:text-emerald-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Clear All */}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="p-1.5 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Clear all notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-[#1E293B] bg-[#0A0F1F] px-4 pt-2 gap-5 text-xs font-semibold">
            <button
              onClick={() => setFilter('all')}
              className={`pb-2 border-b-2 transition-all cursor-pointer ${
                filter === 'all' 
                  ? 'border-blue-500 text-blue-400 font-bold' 
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`pb-2 border-b-2 transition-all cursor-pointer ${
                filter === 'unread' 
                  ? 'border-blue-500 text-blue-400 font-bold' 
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#1E293B]">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-medium">
                No notifications in queue. All pipelines healthy!
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-slate-800/40 transition-colors cursor-pointer ${
                    n.read ? 'opacity-65 bg-transparent' : 'bg-slate-800/25'
                  }`}
                >
                  <div className="p-1.5 rounded-xl bg-slate-950/80 border border-slate-800 flex-shrink-0 mt-0.5">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold text-slate-100 truncate">{n.title}</h4>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                        {n.createdAt ? formatRelativeTime(n.createdAt) : (n.timestamp || 'just now')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
                      {n.message}
                    </p>
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
