import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../_app';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../lib/supabaseClient';
import Head from 'next/head';
import Link from 'next/link';

export default function Orders() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, failed: 0 });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        setOrders(data);
        // Calculate stats
        const total = data.length;
        const pending = data.filter(o => o.status === 'pending').length;
        const completed = data.filter(o => o.status === 'completed' || o.status === 'verified').length;
        const failed = data.filter(o => o.status === 'failed').length;
        setStats({ total, pending, completed, failed });
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter);

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return 'fa-regular fa-clock';
      case 'verifying': return 'fa-solid fa-spinner fa-spin';
      case 'verified': return 'fa-regular fa-circle-check';
      case 'completed': return 'fa-regular fa-circle-check';
      case 'failed': return 'fa-regular fa-circle-xmark';
      default: return 'fa-regular fa-clock';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'verifying': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'verified': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'completed': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'failed': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-text-muted bg-black/20 border-border';
    }
  };

  const getTypeIcon = (type) => {
    return type === 'gift_card' ? 'fa-solid fa-gift' : 'fa-brands fa-bitcoin';
  };

  const getTypeColor = (type) => {
    return type === 'gift_card' ? 'text-purple-400' : 'text-[#f7931a]';
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-text-primary">Loading...</div>;
  if (!user) return null;

  return (
    <>
      <Head>
        <title>Transactions · KJ Exchange</title>
      </Head>
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Transactions</h1>
              <p className="text-text-muted text-sm">View all your trades and activity</p>
            </div>
            <button
              onClick={fetchOrders}
              className="flex items-center gap-2 text-text-muted hover:text-text-primary transition text-sm px-4 py-2 rounded-full border border-border hover:border-orange"
            >
              <i className="fa-solid fa-rotate"></i>
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-bg-card rounded-xl p-4 border border-border text-center">
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-text-muted text-xs uppercase tracking-wider">Total Orders</p>
            </div>
            <div className="bg-bg-card rounded-xl p-4 border border-border text-center">
              <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
              <p className="text-text-muted text-xs uppercase tracking-wider">Pending</p>
            </div>
            <div className="bg-bg-card rounded-xl p-4 border border-border text-center">
              <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
              <p className="text-text-muted text-xs uppercase tracking-wider">Completed</p>
            </div>
            <div className="bg-bg-card rounded-xl p-4 border border-border text-center">
              <p className="text-2xl font-bold text-red-400">{stats.failed}</p>
              <p className="text-text-muted text-xs uppercase tracking-wider">Failed</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 bg-bg-card rounded-xl p-1 border border-border">
            {['all', 'pending', 'verifying', 'completed', 'failed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  filter === status
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange/20'
                    : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* Orders List */}
          <div className="bg-bg-card rounded-2xl border border-border overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <i className="fa-solid fa-spinner fa-spin text-2xl text-orange"></i>
                <span className="ml-3 text-text-muted">Loading transactions...</span>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto rounded-full bg-bg-card border border-border flex items-center justify-center text-text-muted text-3xl">
                  <i className="fa-regular fa-receipt"></i>
                </div>
                <p className="text-text-muted mt-4">No transactions found.</p>
                <p className="text-text-muted text-sm">Start trading to see your orders here.</p>
                <Link
                  href="/dashboard/sell-gift-card"
                  className="inline-block mt-4 text-orange hover:underline text-sm font-semibold"
                >
                  Start Trading <i className="fa-solid fa-arrow-right ml-1"></i>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="p-4 hover:bg-white/5 transition">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full ${getStatusColor(order.status)} flex items-center justify-center text-lg border`}>
                          <i className={getStatusIcon(order.status)}></i>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <i className={`${getTypeIcon(order.type)} ${getTypeColor(order.type)}`}></i>
                            <p className="font-semibold">{order.asset}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(order.status)} border`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-text-muted text-sm">
                            {order.type === 'gift_card' ? 'Gift Card' : 'Crypto'} • {order.amount} • ₦{order.value_ngn.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-text-muted">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-text-muted">
                          {new Date(order.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-center text-text-muted text-xs">
            <i className="fa-regular fa-circle-check mr-1 text-green-400"></i>
            Showing {filteredOrders.length} {filter === 'all' ? 'transactions' : filter} orders
          </p>
        </div>
      </DashboardLayout>
    </>
  );
}
