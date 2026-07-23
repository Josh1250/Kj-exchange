import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../pages/_app';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';

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

  // Fetch unread count AND notifications on mount
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

  const toggleDropdown = () => setShowDropdown(!showDropdown);

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

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-bg-secondary border-r border-border transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex flex-col h-full p-4">
          <div className="mb-6">
            <Link href="/dashboard" className="block">
              <Image src="/logo.png" alt="KJ Exchange" width={120} height={120} className="w-20 h-auto" />
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
          <div className="flex items-center gap-4 relative" ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className="relative p-2 rounded-full hover:bg-white/10 transition"
            >
              <i className={`fa-regular fa-bell text-xl text-text-muted ${unreadCount > 0 ? 'animate-wiggle' : ''}`}></i>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown - 100% Solid with Inline Styles */}
            {showDropdown && (
              <div
                className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto border border-border rounded-xl shadow-2xl shadow-black/70 z-50 p-2"
                style={{
                  backgroundColor: '#0B0815',
                  backdropFilter: 'none',
                  opacity: 1,
                }}
              >
                <div
                  className="flex justify-between items-center p-2 border-b border-border sticky top-0 z-10 rounded-t-xl"
                  style={{ backgroundColor: '#0B0815' }}
                >
                  <h3 className="font-bold text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-orange hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="text-center text-text-muted py-4 text-sm">No notifications</div>
                ) : (
                  <div className="space-y-2 mt-2">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`flex items-start justify-between p-2 rounded-lg transition ${
                          n.read ? 'opacity-60' : 'bg-orange/5 border border-orange/10'
                        }`}
                      >
                        <div className="flex-1 mr-2">
                          <p className="text-sm text-text-primary">{n.message}</p>
                          <p className="text-xs text-text-muted">{new Date(n.created_at).toLocaleDateString()}</p>
                        </div>
                        {!n.read && (
                          <button
                            onClick={() => markAsRead(n.id)}
                            className="text-xs text-orange hover:underline whitespace-nowrap"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="p-2 border-t border-border mt-2 text-center">
                  <Link href="/dashboard/notifications" className="text-xs text-orange hover:underline">
                    View all notifications
                  </Link>
                </div>
              </div>
            )}

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
    </div>
  );
}
