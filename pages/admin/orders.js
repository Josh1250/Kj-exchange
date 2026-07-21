import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from '../../components/layout/AdminLayout';
import Head from 'next/head';

export default function AdminOrders() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }
      const { data } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();
      if (!data?.is_admin) {
        router.push('/dashboard');
        return;
      }
      setLoading(false);
      fetchOrders();
    };
    checkAuth();
  }, [router]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const { data } = await supabase
        .from('orders')
        .select('*, users(email, full_name)')
        .order('created_at', { ascending: false });
      if (data) setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (orderId, userId, valueNgn) => {
    setProcessing(orderId);
    try {
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'verified' })
        .eq('id', orderId);
      if (orderError) throw orderError;

      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();
      const newBalance = (wallet?.balance || 0) + valueNgn;
      await supabase
        .from('wallets')
        .upsert({ user_id: userId, balance: newBalance });

      await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'trade_credit',
          amount: valueNgn,
          status: 'completed',
          metadata: { order_id: orderId },
        });

      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          message: `✅ Your order #${orderId.slice(0,8)} has been verified! ₦${valueNgn.toLocaleString()} credited.`,
        });

      await fetchOrders();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (orderId, userId) => {
    setProcessing(orderId);
    try {
      await supabase
        .from('orders')
        .update({ status: 'failed' })
        .eq('id', orderId);
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          message: `❌ Your order #${orderId.slice(0,8)} has been rejected. Contact support.`,
        });
      await fetchOrders();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-text-primary">Loading...</div>;
  }

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

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
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Manage Orders</h1>
            <button
              onClick={fetchOrders}
              className="flex items-center gap-2 text-text-muted hover:text-text-primary transition text-sm px-4 py-2 rounded-full border border-border hover:border-orange"
            >
              <i className="fa-solid fa-rotate"></i> Refresh
            </button>
          </div>

          <div className="flex flex-wrap gap-2 bg-bg-card rounded-xl p-1 border border-border">
            {['all', 'pending', 'verifying', 'verified', 'completed', 'failed'].map((status) => (
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
        </div>
      </AdminLayout>
    </>
  );
}
