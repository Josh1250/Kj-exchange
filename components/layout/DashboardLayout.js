import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../pages/_app';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

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

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(5);
      if (data) {
        setNotifications(data);
        setUnreadCount(data.length);
      }
    };
    fetchNotifications();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-text-primary">Loading...</div>;
  if (!user) {
    router.push('/auth/login');
    return null;
  }

  const isActive = (path) => {
    if (path === '/dashboard') return router.pathname === '/dashboard';
    return router.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-bg-secondary border-r border-border transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex flex-col h-full p-4">
          {/* Logo */}
          <div className="mb-6">
            <Link href="/dashboard" className="block">
              <Image src="/logo.png" alt="KJ Exchange" width={120} height={120} className="w-20 h-auto" />
            </Link>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 border border-border mb-4">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.email?.split('@')[0]}</p>
              <p className="text-xs text-text-muted truncate">{user?.email}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition ${
                    active
                      ? 'bg-gradient-to-r from-purple-500/20 to-orange-500/20 text-orange border border-orange/20'
                      : 'text-text-muted hover:bg-white/5 hover:text-text-primary'
                  }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <i className={`${item.icon} text-lg w-6 text-center`}></i>
                  <span className="font-medium">{item.name}</span>
                  {active && (
                    <span className="ml-auto w-1.5 h-8 rounded-full bg-orange"></span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition mt-auto"
          >
            <i className="fa-solid fa-right-from-bracket text-lg w-6 text-center"></i>
            <span className="font-medium">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col md:ml-64 overflow-y-auto">
        {/* Header */}
        <header className="bg-bg-secondary/80 backdrop-blur-lg border-b border-border px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition"
            onClick={() => setIsSidebarOpen(true)}
          >
            <i className="fa-solid fa-bars text-xl text-text-primary"></i>
          </button>
          <div className="flex items-center gap-4 ml-auto">
            <Link href="/dashboard/notifications" className="relative p-2 rounded-full hover:bg-white/10 transition">
              <i className="fa-regular fa-bell text-xl text-text-muted"></i>
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>
            <Link href="/dashboard/profile" className="flex items-center gap-2 hover:bg-white/10 rounded-full px-3 py-1 transition">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
