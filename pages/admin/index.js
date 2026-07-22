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
    recentOrders: [],
  });
  const [fetching, setFetching] = useState(false);

  // Auth check with localStorage bypass
  useEffect(() => {
    const checkAuth = async () => {
      let { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const storedEmail = localStorage.getItem('sb-user-email');
        if (storedEmail === 'okolijoshua16@gmail.com') {
          setIsAdmin(true);
          setLoading(false);
          fetchStats();
          return;
        }
        const accessToken = localStorage.getItem('sb-access-token');
        const refreshToken = localStorage.getItem('sb-refresh-token');
        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!error && data.session) {
            session = data.session;
          }
        }
      }
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

  const fetchStats = async () => {
    setFetching(true);
    try {
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      const { data: orders, count: totalOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact' });

      const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;
      const totalVolume = orders?.reduce((sum, o) => sum + (o.value_ngn || 0), 0) || 0;

      const { count: pendingTopups } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'deposit')
        .eq('status', 'pending');

      const { count: pendingWithdrawals } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'withdrawal')
        .eq('status', 'pending');

      const { data: recentOrders } = await supabase
        .from('orders')
        .select('*, users(email)')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalUsers: totalUsers || 0,
        totalOrders: totalOrders || 0,
        pendingOrders,
        totalVolume,
        pendingTopups: pendingTopups || 0,
        pendingWithdrawals: pendingWithdrawals || 0,
        recentOrders: recentOrders || [],
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
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <button
              onClick={fetchStats}
              className="flex items-center gap-2 text-text-muted hover:text-text-primary transition text-sm px-4 py-2 rounded-full border border-border hover:border-orange"
            >
              <i className="fa-solid fa-rotate"></i> Refresh
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between">
                <p className="text-text-muted text-sm">Total Users</p>
                <i className="fa-solid fa-users text-2xl text-purple-400"></i>
              </div>
              <p className="text-2xl font-bold mt-2">{stats.totalUsers}</p>
            </div>
            <div className="bg-bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between">
                <p className="text-text-muted text-sm">Total Orders</p>
                <i className="fa-solid fa-receipt text-2xl text-orange-400"></i>
              </div>
              <p className="text-2xl font-bold mt-2">{stats.totalOrders}</p>
            </div>
            <div className="bg-bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between">
                <p className="text-text-muted text-sm">Pending Orders</p>
                <i className="fa-solid fa-clock text-2xl text-yellow-400"></i>
              </div>
              <p className="text-2xl font-bold mt-2 text-yellow-400">{stats.pendingOrders}</p>
            </div>
            <div className="bg-bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between">
                <p className="text-text-muted text-sm">Pending Top-ups</p>
                <i className="fa-solid fa-arrow-up text-2xl text-blue-400"></i>
              </div>
              <p className="text-2xl font-bold mt-2 text-blue-400">{stats.pendingTopups}</p>
            </div>
            <div className="bg-bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between">
                <p className="text-text-muted text-sm">Pending Withdrawals</p>
                <i className="fa-solid fa-arrow-down text-2xl text-red-400"></i>
              </div>
              <p className="text-2xl font-bold mt-2 text-red-400">{stats.pendingWithdrawals}</p>
            </div>
          </div>

          {/* Charts Section */}
          <AdminCharts />

          {/* Pending Top-ups */}
          <div className="bg-bg-card rounded-xl p-4 border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange/10 flex items-center justify-center text-orange text-lg">
                <i className="fa-solid fa-arrow-up"></i>
              </div>
              <div>
                <p className="font-semibold">Pending Top-ups</p>
                <p className="text-text-muted text-sm">Manual bank transfer requests</p>
              </div>
            </div>
            <Link href="/admin/topups" className="text-orange hover:underline text-sm font-semibold flex items-center gap-1">
              View <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>

          {/* Pending Withdrawals */}
          <div className="bg-bg-card rounded-xl p-4 border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange/10 flex items-center justify-center text-orange text-lg">
                <i className="fa-solid fa-arrow-down"></i>
              </div>
              <div>
                <p className="font-semibold">Pending Withdrawals</p>
                <p className="text-text-muted text-sm">User withdrawal requests</p>
              </div>
            </div>
            <Link href="/admin/withdrawals" className="text-orange hover:underline text-sm font-semibold flex items-center gap-1">
              View <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>

          {/* Recent Orders */}
          <div className="bg-bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Recent Orders</h2>
              <Link href="/admin/orders" className="text-sm text-orange hover:underline">View All</Link>
            </div>
            {fetching ? (
              <p className="text-text-muted">Loading...</p>
            ) : stats.recentOrders.length === 0 ? (
              <p className="text-text-muted">No orders yet.</p>
            ) : (
              <div className="space-y-3">
                {stats.recentOrders.map((order) => (
                  <div key={order.id} className="flex justify-between items-center border-b border-border pb-3">
                    <div>
                      <p className="font-medium">{order.asset}</p>
                      <p className="text-text-muted text-xs">{order.type} • {order.users?.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">₦{order.value_ngn.toLocaleString()}</p>
                      <span className={`text-xs ${order.status === 'pending' ? 'text-yellow-400' : order.status === 'completed' ? 'text-green-400' : 'text-red-400'}`}>
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
