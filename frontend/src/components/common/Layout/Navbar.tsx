import React, { useState, useRef, useEffect } from 'react';
import { Bell, User, Settings, LogOut, ChevronDown, Info, CheckCircle, AlertTriangle, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../UI/ThemeToggle';
import { useAuth } from '../../../hooks/useAuth';
import { useSocket } from '../../../hooks/useSocket';
import { studentApi, type Notification } from '../../../services/studentApi';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Fetch initial notifications
  useEffect(() => {
    if (user) {
      studentApi.getNotifications().then(res => {
        setNotifications(res.data.data || []);
      }).catch(console.error);
    }
  }, [user]);

  // Listen for new notifications via Socket
  useEffect(() => {
    if (!socket) return;

    const handleNewNotif = (notif: Notification) => {
      setNotifications(prev => [notif, ...prev]);
    };

    socket.on('notification', handleNewNotif);

    return () => {
      socket.off('notification', handleNewNotif);
    };
  }, [socket]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await studentApi.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'topic_approved':
      case 'doc_approved':
        return <CheckCircle size={14} className="text-green-500" />;
      case 'topic_rejected':
      case 'doc_rejected':
      case 'revision_requested':
        return <AlertTriangle size={14} className="text-red-500" />;
      case 'new_message':
        return <MessageSquare size={14} className="text-blue-500" />;
      default:
        return <Info size={14} className="text-blue-500" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <header className="w-full border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-3 flex items-center justify-between z-40 sticky top-0">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-black tracking-tight">
          Welcome, <span className="text-blue-600">{user?.name?.split(' ')[0] || 'User'}</span>
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all group"
            aria-label="Notifications"
          >
            <Bell size={20} className="text-gray-500 dark:text-gray-400 group-hover:text-blue-500 transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden transform transition-all animate-in fade-in slide-in-from-top-2">
              <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20 flex items-center justify-between">
                <h3 className="font-black text-sm uppercase tracking-widest text-gray-400">Activity</h3>
                {unreadCount > 0 && <span className="text-[10px] font-black px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-full">{unreadCount} New</span>}
              </div>
              <div className="max-h-96 overflow-y-auto scrollbar-hide">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <Bell size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest">Quiet in here...</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                      className={`px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors ${!notif.is_read ? 'bg-blue-50/40 dark:bg-blue-900/5' : ''}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${!notif.is_read ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
                           {getNotifIcon(notif.type)}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm ${!notif.is_read ? 'font-black' : 'font-medium text-gray-600 dark:text-gray-300'}`}>{notif.title}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                          <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-tighter">{formatTime(notif.created_at)}</p>
                        </div>
                        {!notif.is_read && <span className="w-2 h-2 bg-blue-600 rounded-full mt-2" />}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20">
                <button className="text-[11px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors w-full text-center">
                  Dismiss all
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
          >
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-black shadow-md shadow-blue-500/20">
              {user?.name?.split(' ').map(s => s[0]).slice(0, 2).join('')}
            </div>
            <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${showProfileMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Profile Menu Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden transform transition-all animate-in fade-in slide-in-from-top-2">
              {/* User Info */}
              <div className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20">
                <p className="font-black text-sm tracking-tight truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{user?.email}</p>
                <div className="mt-3">
                  <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-lg">
                    {user?.role}
                  </span>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <button
                  onClick={() => { setShowProfileMenu(false); navigate(`/${user?.role}/profile`); }}
                  className="w-full px-5 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                >
                  <User size={18} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Account Center</span>
                </button>
                <button
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full px-5 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                >
                  <Settings size={18} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">System Preferences</span>
                </button>
              </div>

              {/* Logout */}
              <div className="border-t border-gray-200 dark:border-gray-700 py-2">
                <button
                  onClick={() => { setShowProfileMenu(false); logout(); }}
                  className="w-full px-5 py-2.5 text-left flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400 group"
                >
                  <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
                  <span className="text-sm font-black uppercase tracking-widest">Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
