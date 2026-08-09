import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../pages/_app';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const navItems = [
  { name: 'Home', href: '/dashboard', icon: 'fa-solid fa-house' },
  { name: 'Products', href: '/dashboard/products', icon: 'fa-solid fa-box' },
  { name: 'Transactions', href: '/dashboard/orders', icon: 'fa-solid fa-credit-card' },
  { name: 'Wallet', href: '/dashboard/wallet', icon: 'fa-solid fa-wallet' },
  { name: 'Referral', href: '/dashboard/referral', icon: 'fa-solid fa-user-group' },
  { name: 'Profile', href: '/dashboard/profile', icon: 'fa-solid fa-user' },
  { name: 'Settings', href: '/dashboard/settings', icon: 'fa-solid fa-gear' },
];

export default function DashboardLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const bellRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

  // Fetch unread count & notifications on mount
  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();
    fetchAllNotifications();
  }, [user]);

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);
      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const fetchAllNotifications = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      setNotifications(data || []);
      const unread = (data || []).filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  // Real‑time subscription
  useEffect(() => {
    if (!user) return;
    const subscription = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();
    return () => subscription.unsubscribe();
  }, [user]);

  const markAsRead = async (notificationId) => {
    if (!user) return;
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    if (!error) {
      setNotifications(prev => prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  const toggleDropdown = () => {
    if (!showDropdown) {
      if (bellRef.current) {
        const rect = bellRef.current.getBoundingClientRect();
        // Position dropdown on the right edge of the screen
        const dropdownWidth = 360;
        let right = window.innerWidth - rect.right;
        // Ensure it doesn't go off-screen
        if (right < 10) right = 10;
        if (right + dropdownWidth > window.innerWidth - 10) {
          right = 10;
        }
        setDropdownPosition({
          top: rect.bottom + 8,
          right: right,
        });
      }
    }
    setShowDropdown(!showDropdown);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-text-primary">Loading...</div>;
  if (!user) {
    router.push('/auth/login');
    return null;
  }

  // Helper to get notification icon
  const getNotificationIcon = (message) => {
    if (message.includes('✅') || message.includes('completed') || message.includes('processed')) {
      return 'fa-regular fa-circle-check text-green-400';
    }
    if (message.includes('❌') || message.includes('failed') || message.includes('rejected')) {
      return 'fa-regular fa-circle-xmark text-red-400';
    }
    if (message.includes('🛒') || message.includes('order') || message.includes('gift')) {
      return 'fa-solid fa-gift text-orange';
    }
    if (message.includes('💸') || message.includes('withdrawal')) {
      return 'fa-solid fa-arrow-down text-red-400';
    }
    if (message.includes('💰') || message.includes('deposit') || message.includes('funds')) {
      return 'fa-solid fa-arrow-up text-green-400';
    }
    return 'fa-regular fa-bell text-orange';
  };

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-bg-secondary border-r border-border transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex flex-col h-full p-4">
          <div className="mb-6">
            <Link href="/dashboard" className="block">
              <Image
                src="/logo.png"
                alt="KJ Exchange"
                width={160}
                height={160}
                className="w-28 md:w-32 h-auto transition-transform group-hover:scale-105"
                priority
              />
            </Link>
          </div>
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = router.pathname === item.href || router.pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-500/20 to-orange-500/20 text-orange border border-orange/20'
                      : 'text-text-muted hover:bg-white/5 hover:text-text-primary'
                  }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <i className={`${item.icon} text-lg w-6 text-center`}></i>
                  <span>{item.name}</span>
                  {isActive && <span className="ml-auto w-1.5 h-8 rounded-full bg-orange"></span>}
                </Link>
              );
            })}
          </nav>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition mt-auto"
          >
            <i className="fa-solid fa-right-from-bracket text-lg w-6 text-center"></i>
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      <div className="flex-1 flex flex-col md:ml-64 overflow-y-auto">
        <header className="bg-bg-secondary/80 backdrop-blur-lg border-b border-border px-6 py-3 flex justify-between items-center sticky top-0 z-10">
          <button className="md:hidden p-2 rounded-lg hover:bg-white/10 transition" onClick={() => setIsSidebarOpen(true)}>
            <i className="fa-solid fa-bars text-xl text-text-primary"></i>
          </button>
          <div className="flex items-center gap-4 ml-auto">
            <button
              ref={bellRef}
              onClick={toggleDropdown}
              className="relative p-2 rounded-full hover:bg-white/10 transition group"
            >
              <i className={`fa-regular fa-bell text-xl text-text-muted ${unreadCount > 0 ? 'animate-wiggle' : ''}`}></i>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            <Link href="/dashboard/profile" className="flex items-center gap-2 hover:bg-white/10 rounded-full px-3 py-1 transition">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-text-muted hidden sm:inline">{user?.email?.split('@')[0]}</span>
            </Link>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>

      {/* ===== NOTIFICATION DRAWER (Premium, Right-Aligned, Glassmorphism) ===== */}
      {showDropdown && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] glass rounded-2xl border border-border/50 shadow-2xl shadow-black/70 overflow-hidden transition-all duration-200 ease-out"
          style={{
            top: dropdownPosition.top,
            right: dropdownPosition.right,
            width: '360px',
            maxHeight: '480px',
            backgroundColor: 'rgba(11, 8, 21, 0.95)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/50 bg-black/20">
            <div className="flex items-center gap-2">
              <i className="fa-regular fa-bell text-orange text-lg"></i>
              <h3 className="font-bold text-text-primary">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs bg-orange/20 text-orange px-2 py-0.5 rounded-full border border-orange/20">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-orange hover:underline transition"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto max-h-[360px] p-2 space-y-1.5">
            {notifications.length === 0 ? (
              <div className="text-center text-text-muted py-8 text-sm">
                <i className="fa-regular fa-bell-slash text-2xl block mb-2 opacity-30"></i>
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.read;
                const icon = getNotificationIcon(n.message);
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 p-3 rounded-xl transition ${
                      isUnread
                        ? 'bg-orange/5 border border-orange/10'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isUnread ? 'bg-orange/10' : 'bg-black/20'
                    }`}>
                      <i className={`${icon} text-sm`}></i>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${isUnread ? 'font-semibold text-text-primary' : 'text-text-muted'}`}>
                        {n.message}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>

                    {/* Actions */}
                    {isUnread && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="text-xs text-orange hover:underline transition whitespace-nowrap flex-shrink-0"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-border/50 text-center bg-black/10 rounded-b-2xl">
            <Link
              href="/dashboard/notifications"
              className="text-sm text-orange hover:underline transition"
              onClick={() => setShowDropdown(false)}
            >
              View all notifications →
            </Link>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
