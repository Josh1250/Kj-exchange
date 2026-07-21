import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/router';
import { useState } from 'react';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: 'fa-solid fa-gauge-high' },
  { name: 'Orders', href: '/admin/orders', icon: 'fa-solid fa-list' },
  { name: 'Users', href: '/admin/users', icon: 'fa-solid fa-users' },
  { name: 'Top-Ups', href: '/admin/topups', icon: 'fa-solid fa-arrow-up' },
  { name: 'Settings', href: '/admin/settings', icon: 'fa-solid fa-gear' },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const isActive = (path) => {
    if (path === '/admin') return router.pathname === '/admin';
    return router.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-bg-secondary border-r border-border transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="flex flex-col h-full p-4">
          <div className="mb-6">
            <Link href="/admin" className="block">
              <Image src="/logo.png" alt="KJ Exchange" width={120} height={120} className="w-20 h-auto" />
            </Link>
            <p className="text-xs text-orange font-semibold mt-1">Admin Panel</p>
          </div>
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
          <div className="border-t border-border pt-4 space-y-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-2 rounded-xl text-text-muted hover:bg-white/5 hover:text-text-primary transition"
            >
              <i className="fa-solid fa-arrow-left text-lg w-6 text-center"></i>
              <span>Back to Dashboard</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition w-full"
            >
              <i className="fa-solid fa-right-from-bracket text-lg w-6 text-center"></i>
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </aside>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      <div className="flex-1 flex flex-col md:ml-64 overflow-y-auto">
        <header className="bg-bg-secondary/80 backdrop-blur-lg border-b border-border px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition"
            onClick={() => setIsSidebarOpen(true)}
          >
            <i className="fa-solid fa-bars text-xl text-text-primary"></i>
          </button>
          <div className="flex items-center gap-4 ml-auto">
            <span className="text-xs text-orange font-semibold bg-orange/10 px-3 py-1 rounded-full">Admin</span>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
