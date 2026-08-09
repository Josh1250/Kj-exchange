import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pendingCounts, setPendingCounts] = useState({
    withdrawals: 0,
    giftCards: 0,
    kyc: 0,
    deposits: 0,
  });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const { count: withdrawals } = await supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .eq('type', 'withdrawal')
          .eq('status', 'pending');

        const { count: giftCards } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('type', 'gift_card')
          .eq('status', 'pending');

        const { count: kyc } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('kyc_status', 'Pending');

        const { count: deposits } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('type', 'crypto')
          .eq('status', 'pending');

        setPendingCounts({
          withdrawals: withdrawals || 0,
          giftCards: giftCards || 0,
          kyc: kyc || 0,
          deposits: deposits || 0,
        });
      } catch (err) {
        console.error('Error fetching pending counts:', err);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const isActive = (path) => {
    if (path === '/admin') return router.pathname === '/admin';
    return router.pathname.startsWith(path);
  };

  const navSections = [
    {
      label: 'Overview',
      items: [
        { name: 'Dashboard', href: '/admin', icon: 'fa-solid fa-gauge-high' },
      ],
    },
    {
      label: 'Orders & Users',
      items: [
        { name: 'Orders', href: '/admin/orders', icon: 'fa-solid fa-list' },
        { name: 'Gift Cards', href: '/admin/gift-cards', icon: 'fa-solid fa-gift', badge: pendingCounts.giftCards },
        { name: 'Users', href: '/admin/users', icon: 'fa-solid fa-users' },
      ],
    },
    {
      label: 'Payments & Approvals',
      items: [
        {
          name: 'KYC Review',
          href: '/admin/kyc-review',
          icon: 'fa-solid fa-shield-check',
          badge: pendingCounts.kyc,
        },
        {
          name: 'Pending Deposits',
          href: '/admin/pending-deposits',
          icon: 'fa-solid fa-coins',
          badge: pendingCounts.deposits,
        },
        {
          name: 'Withdrawals',
          href: '/admin/withdrawals',
          icon: 'fa-solid fa-arrow-down',
          badge: pendingCounts.withdrawals,
        },
        { name: 'Top-Ups', href: '/admin/topups', icon: 'fa-solid fa-arrow-up' },
      ],
    },
    {
      label: 'Finance',
      items: [
        { name: 'Business Wallet', href: '/admin/business-wallet', icon: 'fa-solid fa-wallet' },
      ],
    },
    {
      label: 'Settings',
      items: [
        { name: 'Settings', href: '/admin/settings', icon: 'fa-solid fa-gear' },
      ],
    },
  ];

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

          <nav className="flex-1 overflow-y-auto space-y-4">
            {navSections.map((section) => (
              <div key={section.label}>
                <p className="text-[10px] uppercase tracking-wider text-text-muted/60 px-3 mb-1 font-semibold">
                  {section.label}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                          active
                            ? 'bg-gradient-to-r from-purple-500/20 to-orange-500/20 text-orange border border-orange/20'
                            : 'text-text-muted hover:bg-white/5 hover:text-text-primary'
                        }`}
                        onClick={() => setIsSidebarOpen(false)}
                      >
                        <i className={`${item.icon} text-base w-5 text-center`}></i>
                        <span className="text-sm font-medium flex-1">{item.name}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="bg-orange text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                            {item.badge}
                          </span>
                        )}
                        {active && (
                          <span className="w-1 h-6 rounded-full bg-orange ml-1"></span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-border pt-4 space-y-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-text-muted hover:bg-white/5 hover:text-text-primary transition text-sm"
            >
              <i className="fa-solid fa-arrow-left text-base w-5 text-center"></i>
              <span>Back to Dashboard</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition w-full text-sm"
            >
              <i className="fa-solid fa-right-from-bracket text-base w-5 text-center"></i>
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
