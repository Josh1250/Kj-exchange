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
  { name: 'Settings', href: '/dashboard/settings', icon: 'fa-solid fa-gear' },
];

export default function DashboardLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-bg-secondary border-r border-border transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex flex-col h-full p-4">
          <div className="mb-6">
            <Image src="/logo.png" alt="KJ Exchange" width={120} height={120} className="w-24 h-auto" />
          </div>
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = router.pathname === item.href || router.pathname.startsWith(item.href + '/');
              return (
                <Link key={item.name} href={item.href} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition ${isActive ? 'bg-orange/10 text-orange' : 'text-text-muted hover:bg-white/5 hover:text-text-primary'}`}>
                  <i className={`${item.icon} text-lg w-6 text-center`}></i>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition mt-auto">
            <i className="fa-solid fa-right-from-bracket text-lg w-6 text-center"></i>
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col md:ml-64 overflow-y-auto">
        <header className="bg-bg-secondary/80 backdrop-blur-lg border-b border-border px-6 py-3 flex justify-between items-center sticky top-0 z-10">
          <button className="md:hidden p-2 rounded-lg hover:bg-white/10 transition" onClick={() => setIsSidebarOpen(true)}>
            <i className="fa-solid fa-bars text-xl text-text-primary"></i>
          </button>
          <div className="flex items-center gap-3">
            <i className="fa-regular fa-user text-text-muted"></i>
            <span className="text-sm text-text-muted">{user?.email}</span>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
