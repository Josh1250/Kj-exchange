import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from '../../components/layout/AdminLayout';
import AdminCharts from '../../components/AdminCharts';
import Head from 'next/head';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalVolume: 0,
    pendingTopups: 0,
    pendingWithdrawals: 0,
    pendingCryptoDeposits: 0,
    pendingKYC: 0,
    pendingGiftCards: 0,
    recentOrders: [],
    pendingWithdrawalList: [],
    pendingGiftCardList: [],
  });
  const [fetching, setFetching] = useState(false);

  // ===== Auth Check =====
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

      if (error || !data?.is_admin) {
        router.push('/dashboard');
        return;
      }

      setIsAdmin(true);
      setLoading(false);
      fetchStats();
    };
    checkAuth();
  }, [router]);

  // ===== Fetch All Stats =====
  const fetchStats = async () => {
    setFetching(true);
    try {
      // Total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Orders
      const { data: orders, count: totalOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact' });

      const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;
      const totalVolume = orders?.reduce((sum, o) => sum + (o.value_ngn || 0), 0) || 0;

      // Pending gift cards
      const { count: pendingGiftCards } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'gift_card')
        .eq('status', 'pending');

      // Pending fiat top-ups
      const { count: pendingTopups } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'deposit')
        .eq('status', 'pending');

      // Pending fiat withdrawals
      const { count: pendingWithdrawals } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'withdrawal')
        .eq('status', 'pending');

      // Pending crypto deposits
      const { count: pendingCryptoDeposits } = await supabase
        .from('crypto_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_confirmation');

      // Pending KYC
      const { count: pendingKYC } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('kyc_status', 'Pending');

      // Recent orders
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('*, users(email)')
        .order('created_at', { ascending: false })
        .limit(5);

      // 🆕 Pending withdrawal list (with user details)
      const { data: pendingWithdrawalList } = await supabase
        .from('transactions')
        .select('*, users(email)')
        .eq('type', 'withdrawal')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      // 🆕 Pending gift card list
      const { data: pendingGiftCardList } = await supabase
        .from('orders')
        .select('*, users(email)')
        .eq('type', 'gift_card')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalUsers: totalUsers || 0,
        totalOrders: totalOrders || 0,
        pendingOrders,
        totalVolume,
        pendingTopups: pendingTopups || 0,
        pendingWithdrawals: pendingWithdrawals || 0,
        pendingCryptoDeposits: pendingCryptoDeposits || 0,
        pendingKYC: pendingKYC || 0,
        pendingGiftCards: pendingGiftCards || 0,
        recentOrders: recentOrders || [],
        pendingWithdrawalList: pendingWithdrawalList || [],
        pendingGiftCardList: pendingGiftCardList || [],
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setFetching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-text-primary">
        <div className="text-center">
          <i className="fa-solid fa-spinner fa-spin text-3xl text-orange"></i>
          <p className="mt-3 text-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <>
      <Head><title>Admin Dashboard · KJ Exchange</title></Head>
      <AdminLayout>
        <div className="max-w-6xl mx-auto px-4 py-4 pb-24 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-text-muted text-sm">Overview of your platform</p>
            </div>
            <button
              onClick={fetchStats}
              disabled={fetching}
              className="flex items-center gap-2 text-text-muted hover:text-text-primary transition text-sm px-4 py-2 rounded-full border border-border hover:border-orange disabled:opacity-50"
            >
              <i className={`fa-solid fa-rotate ${fetching ? 'fa-spin' : ''}`}></i> 
              {fetching ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* Stats Cards - 8 cards (4x2 grid) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between">
                <p className="text-text-muted text-sm">Total Users</p>
                <i className="fa-solid fa-users text-xl text-purple-400"></i>
              </div>
              <p className="text-2xl font-bold mt-2">{stats.totalUsers}</p>
            </div>
            <div className="glass rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between">
                <p className="text-text-muted text-sm">Total Orders</p>
                <i className="fa-solid fa-receipt text-xl text-orange-400"></i>
              </div>
              <p className="text-2xl font-bold mt-2">{stats.totalOrders}</p>
            </div>
            <div className="glass rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between">
                <p className="text-text-muted text-sm">Pending Orders</p>
                <i className="fa-solid fa-clock text-xl text-yellow-400"></i>
              </div>
              <p className="text-2xl font-bold mt-2 text-yellow-400">{stats.pendingOrders}</p>
            </div>
            <div className="glass rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between">
                <p className="text-text-muted text-sm">Total Volume</p>
                <i className="fa-solid fa-chart-line text-xl text-green-400"></i>
              </div>
              <p className="text-xl font-bold mt-2 text-green-400">₦{stats.totalVolume.toLocaleString()}</p>
            </div>
            <div className="glass rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between">
                <p className="text-text-muted text-sm">Pending Top-ups</p>
                <i className="fa-solid fa-arrow-up text-xl text-blue-400"></i>
              </div>
              <p className="text-2xl font-bold mt-2 text-blue-400">{stats.pendingTopups}</p>
            </div>
            <div className="glass rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between">
                <p className="text-text-muted text-sm">Pending Withdrawals</p>
                <i className="fa-solid fa-arrow-down text-xl text-red-400"></i>
              </div>
              <p className="text-2xl font-bold mt-2 text-red-400">{stats.pendingWithdrawals}</p>
            </div>
            <div className="glass rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between">
                <p className="text-text-muted text-sm">Pending Crypto Deposits</p>
                <i className="fa-solid fa-coins text-xl text-green-400"></i>
              </div>
              <p className="text-2xl font-bold mt-2 text-green-400">{stats.pendingCryptoDeposits}</p>
            </div>
            <div className="glass rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between">
                <p className="text-text-muted text-sm">Pending KYC</p>
                <i className="fa-solid fa-shield-check text-xl text-orange-400"></i>
              </div>
              <p className="text-2xl font-bold mt-2 text-orange-400">{stats.pendingKYC}</p>
            </div>
          </div>

          {/* Charts Section */}
          <AdminCharts />

          {/* Quick Action Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/admin/kyc-review"
              className="glass rounded-2xl p-4 border border-border hover:border-orange transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange/10 flex items-center justify-center text-orange text-lg group-hover:scale-110 transition">
                  <i className="fa-solid fa-shield-check"></i>
                </div>
                <div>
                  <p className="font-semibold text-sm">KYC Review</p>
                  <p className="text-text-muted text-xs">{stats.pendingKYC} pending</p>
                </div>
              </div>
            </Link>
            <Link
              href="/admin/pending-deposits"
              className="glass rounded-2xl p-4 border border-border hover:border-orange transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange/10 flex items-center justify-center text-orange text-lg group-hover:scale-110 transition">
                  <i className="fa-solid fa-coins"></i>
                </div>
                <div>
                  <p className="font-semibold text-sm">Pending Deposits</p>
                  <p className="text-text-muted text-xs">{stats.pendingCryptoDeposits} pending</p>
                </div>
              </div>
            </Link>
            <Link
              href="/admin/gift-cards"
              className="glass rounded-2xl p-4 border border-border hover:border-orange transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange/10 flex items-center justify-center text-orange text-lg group-hover:scale-110 transition">
                  <i className="fa-solid fa-gift"></i>
                </div>
                <div>
                  <p className="font-semibold text-sm">Gift Cards</p>
                  <p className="text-text-muted text-xs">{stats.pendingGiftCards} pending</p>
                </div>
              </div>
            </Link>
            <Link
              href="/admin/users"
              className="glass rounded-2xl p-4 border border-border hover:border-orange transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange/10 flex items-center justify-center text-orange text-lg group-hover:scale-110 transition">
                  <i className="fa-solid fa-users"></i>
                </div>
                <div>
                  <p className="font-semibold text-sm">Manage Users</p>
                  <p className="text-text-muted text-xs">{stats.totalUsers} total</p>
                </div>
              </div>
            </Link>
          </div>

          {/* ===== PENDING WITHDRAWALS SECTION ===== */}
          <div className="glass rounded-2xl p-5 border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-arrow-down text-red-400"></i>
                <h2 className="text-lg font-bold">Pending Withdrawals</h2>
                {stats.pendingWithdrawals > 0 && (
                  <span className="text-xs bg-red-400/20 text-red-400 px-2 py-0.5 rounded-full">
                    {stats.pendingWithdrawals}
                  </span>
                )}
              </div>
              <Link href="/admin/withdrawals" className="text-sm text-orange hover:underline">
                View All
              </Link>
            </div>

            {fetching ? (
              <p className="text-text-muted text-sm">Loading...</p>
            ) : stats.pendingWithdrawalList.length === 0 ? (
              <div className="text-center py-4 text-text-muted">
                <i className="fa-regular fa-check-circle text-2xl block mb-2 text-green-400"></i>
                <p className="text-sm">All withdrawals processed</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.pendingWithdrawalList.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-border/50 hover:border-red-400/30 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">₦{Math.abs(tx.amount).toLocaleString()}</p>
                        <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">Pending</span>
                      </div>
                      <p className="text-text-muted text-xs truncate">
                        {tx.metadata?.bank_name || 'Bank'} • {tx.metadata?.account_number || 'N/A'}
                      </p>
                      <p className="text-text-muted text-xs truncate">
                        {tx.users?.email || 'Unknown user'} • {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Link
                      href={`/admin/withdrawals/${tx.id}`}
                      className="text-orange text-xs hover:underline whitespace-nowrap ml-3"
                    >
                      Process →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ===== PENDING GIFT CARDS SECTION ===== */}
          <div className="glass rounded-2xl p-5 border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-gift text-pink-400"></i>
                <h2 className="text-lg font-bold">Pending Gift Cards</h2>
                {stats.pendingGiftCards > 0 && (
                  <span className="text-xs bg-pink-400/20 text-pink-400 px-2 py-0.5 rounded-full">
                    {stats.pendingGiftCards}
                  </span>
                )}
              </div>
              <Link href="/admin/gift-cards" className="text-sm text-orange hover:underline">
                View All
              </Link>
            </div>

            {fetching ? (
              <p className="text-text-muted text-sm">Loading...</p>
            ) : stats.pendingGiftCardList.length === 0 ? (
              <div className="text-center py-4 text-text-muted">
                <i className="fa-regular fa-check-circle text-2xl block mb-2 text-green-400"></i>
                <p className="text-sm">All gift cards processed</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.pendingGiftCardList.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-border/50 hover:border-pink-400/30 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{order.asset}</p>
                        <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">Pending</span>
                      </div>
                      <p className="text-text-muted text-xs">
                        ₦{order.value_ngn?.toLocaleString()} • {order.users?.email || 'Unknown user'}
                      </p>
                      <p className="text-text-muted text-xs">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-orange text-xs hover:underline whitespace-nowrap ml-3"
                    >
                      Review →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="glass rounded-2xl p-5 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Recent Orders</h2>
              <Link href="/admin/orders" className="text-sm text-orange hover:underline">View All</Link>
            </div>
            {fetching ? (
              <p className="text-text-muted text-sm">Loading...</p>
            ) : stats.recentOrders.length === 0 ? (
              <p className="text-text-muted text-sm">No orders yet.</p>
            ) : (
              <div className="space-y-3">
                {stats.recentOrders.map((order) => (
                  <div key={order.id} className="flex justify-between items-center p-3 bg-black/20 rounded-xl border border-border/50">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{order.asset}</p>
                      <p className="text-text-muted text-xs">{order.type} • {order.users?.email}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="text-sm font-semibold">₦{order.value_ngn?.toLocaleString()}</p>
                      <span className={`text-xs ${
                        order.status === 'pending' ? 'text-yellow-400' : 
                        order.status === 'completed' ? 'text-green-400' : 
                        'text-red-400'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
