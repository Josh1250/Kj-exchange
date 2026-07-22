import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from '../../components/layout/AdminLayout';
import Head from 'next/head';

export default function AdminOrders() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  // Check admin (with localStorage bypass)
  useEffect(() => {
    const checkAuth = async () => {
      let { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        const storedEmail = localStorage.getItem('sb-user-email');
        if (storedEmail === 'okolijoshua16@gmail.com') {
          setIsAdmin(true);
          setLoading(false);
          fetchOrders();
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
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }
      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
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
      console.error('Error fetching orders:', err);
      alert('Failed to fetch orders. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (orderId, userId, valueNgn) => {
    if (processing) return;
    setProcessing(orderId);
    try {
      console.log('Verifying order:', orderId, userId, valueNgn);

      // 1. Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'verified' })
        .eq('id', orderId);
      if (orderError) throw new Error(orderError.message);

      // 2. Get current wallet balance
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();
      if (walletError && walletError.code !== 'PGRST116') {
        throw new Error(walletError.message);
      }
      const currentBalance = wallet?.balance || 0;
      const newBalance = currentBalance + valueNgn;

      // 3. Update wallet balance
      const { error: upsertError } = await supabase
        .from('wallets')
        .upsert(
          { user_id: userId, balance: newBalance },
          { onConflict: 'user_id' }
        );
      if (upsertError) throw new Error(upsertError.message);

      // 4. Insert transaction record
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'trade_credit',
          amount: valueNgn,
          status: 'completed',
          metadata: { order_id: orderId },
        });
      if (txError) throw new Error(txError.message);

      // 5. Send notification
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          message: `✅ Your order #${orderId.slice(0,8)} has been verified! ₦${valueNgn.toLocaleString()} credited.`,
        });

      alert('✅ Order verified and wallet credited!');
      await fetchOrders(); // Refresh list
    } catch (err) {
      console.error('Verification error:', err);
      alert('❌ Failed to verify order: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (orderId, userId) => {
    if (processing) return;
    setProcessing(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'failed' })
        .eq('id', orderId);
      if (error) throw new Error(error.message);

      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          message: `❌ Your order #${orderId.slice(0,8)} has been rejected. Contact support.`,
        });

      alert('❌ Order rejected.');
      await fetchOrders();
    } catch (err) {
      console.error('Rejection error:', err);
      alert('Failed to reject order: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div>Loading admin panel...</div>;
  if (!isAdmin) return null;

  const filteredOrders = orders;

  const statusColors = {
    pending: 'bg-yellow-400/20 text-yellow-400 border-yellow-400/20',
    verifying: 'bg-blue-400/20 text-blue-400 border-blue-400/20',
    verified: 'bg-green-400/20 text-green-400 border-green-400/20',
    completed: 'bg-green-500/20 text-green-500 border-green-500/20',
    failed: 'bg-red-400/20 text-red-400 border-red-400/20',
  };

  return (
    <>
      <Head><title>Admin Orders · KJ Exchange</title></Head>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h1 className="text-2xl font-bold">Manage Orders</h1>
            <button
              onClick={fetchOrders}
              className="flex items-center gap-2 text-text-muted hover:text-text-primary transition text-sm px-4 py-2 rounded-full border border-border hover:border-orange"
            >
              <i className="fa-solid fa-rotate"></i> Refresh
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 bg-bg-card rounded-xl p-2 border border-border">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-black/40 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-orange"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="verifying">Verifying</option>
              <option value="verified">Verified</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-black/40 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-orange"
            >
              <option value="all">All Types</option>
              <option value="gift_card">Gift Cards</option>
              <option value="crypto">Crypto</option>
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

          {/* Orders List */}
          <div className="bg-bg-card rounded-2xl border border-border overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <i className="fa-solid fa-spinner fa-spin text-2xl text-orange"></i>
                <span className="ml-3 text-text-muted">Loading orders...</span>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-text-muted">No orders found.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="p-4 hover:bg-white/5 transition">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold">{order.asset}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[order.status] || 'bg-gray-400/20 text-gray-400'}`}>
                            {order.status.toUpperCase()}
                          </span>
                          <span className="text-xs text-text-muted">{order.type}</span>
                        </div>
                        <p className="text-text-muted text-sm">User: {order.users?.email || order.users?.full_name || 'Unknown'}</p>
                        <p className="text-text-muted text-sm">Amount: {order.amount}</p>
                        <p className="text-text-muted text-sm">Value: ₦{order.value_ngn.toLocaleString()}</p>
                        <p className="text-text-muted text-xs">{new Date(order.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleVerify(order.id, order.user_id, order.value_ngn)}
                              disabled={processing === order.id}
                              className="bg-green-500 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-600 transition disabled:opacity-50 flex items-center gap-1"
                            >
                              {processing === order.id ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-regular fa-circle-check"></i>} Verify
                            </button>
                            <button
                              onClick={() => handleReject(order.id, order.user_id)}
                              disabled={processing === order.id}
                              className="bg-red-500 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-red-600 transition disabled:opacity-50 flex items-center gap-1"
                            >
                              <i className="fa-regular fa-circle-xmark"></i> Reject
                            </button>
                          </>
                        )}
                        <span className="text-xs text-text-muted">ID: {order.id.slice(0,8)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Export CSV Button */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                if (orders.length === 0) return alert('No orders to export.');
                const headers = ['ID', 'Asset', 'Type', 'Amount', 'Value (NGN)', 'Status', 'User', 'Date'];
                const rows = orders.map(o => [
                  o.id.slice(0,8),
                  o.asset,
                  o.type,
                  o.amount,
                  o.value_ngn,
                  o.status,
                  o.users?.email || '',
                  new Date(o.created_at).toLocaleString(),
                ]);
                const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `orders_${new Date().toISOString().slice(0,10)}.csv`;
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
