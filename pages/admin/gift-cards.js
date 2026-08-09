import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from '../../components/layout/AdminLayout';
import Head from 'next/head';
import Link from 'next/link';

export default function AdminGiftCards() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [dateFilter, setDateFilter] = useState('');

  // Auth check
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
      fetchOrders();
    };
    checkAuth();
  }, [router]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('orders')
        .select('*, users(email, full_name)')
        .eq('type', 'gift_card')
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('status', 'pending');
      } else if (filter === 'completed') {
        query = query.eq('status', 'completed');
      } else if (filter === 'failed') {
        query = query.eq('status', 'failed');
      }

      if (dateFilter) {
        const start = new Date(dateFilter);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dateFilter);
        end.setHours(23, 59, 59, 999);
        query = query.gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching gift card orders:', err);
      alert('Failed to fetch gift card orders.');
    } finally {
      setIsLoading(false);
    }
  };

  const markCompleted = async (orderId, userId) => {
    if (processing) return;
    setProcessing(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', orderId);
      if (error) throw new Error(error.message);

      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          message: `✅ Your gift card order has been verified and completed.`,
        });

      alert('✅ Gift card order marked as completed.');
      await fetchOrders();
    } catch (err) {
      console.error('Error:', err);
      alert('❌ Failed to mark as completed: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  const markFailed = async (orderId, userId, amount) => {
    if (processing) return;
    setProcessing(orderId);
    try {
      // Refund the user's wallet? Here we could add the amount back to wallet
      // Get wallet balance and add back the order value_ngn
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();

      const newBalance = (wallet?.balance || 0) + (amount || 0);
      await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('user_id', userId);

      // Update order status to failed
      await supabase
        .from('orders')
        .update({ status: 'failed' })
        .eq('id', orderId);

      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          message: `❌ Your gift card order has been rejected. Your wallet has been refunded.`,
        });

      alert('✅ Gift card order marked as failed and wallet refunded.');
      await fetchOrders();
    } catch (err) {
      console.error('Error:', err);
      alert('❌ Failed to mark as failed: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div>Loading admin panel...</div>;
  if (!isAdmin) return null;

  const statusColors = {
    pending: 'bg-yellow-400/20 text-yellow-400 border-yellow-400/20',
    completed: 'bg-green-400/20 text-green-400 border-green-400/20',
    failed: 'bg-red-400/20 text-red-400 border-red-400/20',
  };

  return (
    <>
      <Head><title>Admin Gift Cards · KJ Exchange</title></Head>
      <AdminLayout>
        <div className="max-w-6xl mx-auto px-4 py-4 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h1 className="text-2xl font-bold">Gift Card Orders</h1>
            <button
              onClick={fetchOrders}
              className="flex items-center gap-2 text-text-muted hover:text-text-primary transition text-sm px-4 py-2 rounded-full border border-border hover:border-orange"
            >
              <i className="fa-solid fa-rotate"></i> Refresh
            </button>
          </div>

          <div className="flex flex-wrap gap-2 bg-bg-card rounded-xl p-2 border border-border">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-black/40 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-orange"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-black/40 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-orange"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Clear Date
              </button>
            )}
          </div>

          <div className="bg-bg-card rounded-2xl border border-border overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <i className="fa-solid fa-spinner fa-spin text-2xl text-orange"></i>
                <span className="ml-3 text-text-muted">Loading gift card orders...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto rounded-full bg-bg-card border border-border flex items-center justify-center text-text-muted text-3xl">
                  <i className="fa-regular fa-circle-check"></i>
                </div>
                <p className="text-text-muted mt-4">No gift card orders found.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {orders.map((order) => {
                  const details = order.details || {};
                  const imageUrl = details.file_image || details.front_image || null;
                  return (
                    <div key={order.id} className="p-4 hover:bg-white/5 transition">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold">{order.asset}</p>
                          <p className="text-text-muted text-sm">User: {order.users?.email || order.users?.full_name || 'Unknown'}</p>
                          <p className="text-text-muted text-sm">Amount: ${order.amount} • Rate: ₦{order.rate}/$</p>
                          <p className="text-text-muted text-sm">Payout: ₦{order.value_ngn?.toLocaleString()}</p>
                          <p className="text-text-muted text-xs">{new Date(order.created_at).toLocaleString()}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[order.status] || 'bg-gray-400/20 text-gray-400'}`}>
                            {order.status}
                          </span>
                        </div>
                        {imageUrl && (
                          <div className="flex-shrink-0">
                            <img src={imageUrl} alt="Gift Card" className="w-20 h-20 object-cover rounded-lg border border-border" />
                          </div>
                        )}
                        {order.status === 'pending' && (
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => markCompleted(order.id, order.user_id)}
                              disabled={processing === order.id}
                              className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-semibold hover:bg-green-600 transition disabled:opacity-50 flex items-center gap-1"
                            >
                              {processing === order.id ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-regular fa-circle-check"></i>} Verify
                            </button>
                            <button
                              onClick={() => markFailed(order.id, order.user_id, order.value_ngn)}
                              disabled={processing === order.id}
                              className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-semibold hover:bg-red-600 transition disabled:opacity-50 flex items-center gap-1"
                            >
                              <i className="fa-regular fa-circle-xmark"></i> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => {
                if (orders.length === 0) return alert('No orders to export.');
                const headers = ['ID', 'User', 'Asset', 'Amount', 'Rate', 'Payout', 'Status', 'Date'];
                const rows = orders.map(o => {
                  return [
                    o.id.slice(0,8),
                    o.users?.email || '',
                    o.asset,
                    o.amount,
                    o.rate,
                    o.value_ngn,
                    o.status,
                    new Date(o.created_at).toLocaleString(),
                  ];
                });
                const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `giftcards_${new Date().toISOString().slice(0,10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="bg-orange text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-orange-600 transition"
            >
              <i className="fa-solid fa-file-csv mr-2"></i> Export CSV
            </button>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
