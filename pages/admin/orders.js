import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../_app';
import Layout from '../../components/layout/Layout';
import { supabase } from '../../lib/supabaseClient';
import Head from 'next/head';

export default function AdminOrders() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  // Check if user is admin
  useEffect(() => {
    if (!loading && user) {
      checkAdmin();
    }
  }, [user, loading]);

  const checkAdmin = async () => {
    const { data } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!data?.is_admin) {
      router.push('/dashboard');
    } else {
      fetchOrders();
    }
  };

  const fetchOrders = async () => {
    try {
      const { data } = await supabase
        .from('orders')
        .select('*, users(full_name, email)')
        .eq('type', 'gift_card')
        .order('created_at', { ascending: false });

      if (data) setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (orderId, userId, valueNgn) => {
    setProcessing(orderId);

    try {
      // 1. Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // 2. Credit user's wallet
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();

      const newBalance = (wallet?.balance || 0) + valueNgn;

      const { error: walletError } = await supabase
        .from('wallets')
        .upsert({
          user_id: userId,
          balance: newBalance,
        });

      if (walletError) throw walletError;

      // 3. Create transaction record
      await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'trade_credit',
          amount: valueNgn,
          status: 'completed',
          metadata: { order_id: orderId },
        });

      // 4. Refresh orders
      await fetchOrders();
      setProcessing(null);

    } catch (error) {
      console.error('Error verifying order:', error);
      setProcessing(null);
    }
  };

  const handleReject = async (orderId) => {
    setProcessing(orderId);

    try {
      await supabase
        .from('orders')
        .update({ status: 'failed', admin_notes: 'Rejected by admin' })
        .eq('id', orderId);

      await fetchOrders();
      setProcessing(null);
    } catch (error) {
      console.error('Error rejecting order:', error);
      setProcessing(null);
    }
  };

  if (loading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const statusColors = {
    pending: 'bg-yellow-400/20 text-yellow-400',
    verifying: 'bg-blue-400/20 text-blue-400',
    completed: 'bg-green-400/20 text-green-400',
    failed: 'bg-red-400/20 text-red-400',
  };

  return (
    <>
      <Head>
        <title>Admin · Orders</title>
      </Head>
      <Layout>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">📋 Gift Card Orders</h1>
            <span className="text-text-muted text-sm">
              {orders.filter(o => o.status === 'pending').length} pending
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="bg-bg-card rounded-2xl p-8 text-center border border-border">
              <p className="text-text-muted">No orders yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-bg-card rounded-2xl p-6 border border-border">
                  <div className="grid md:grid-cols-4 gap-4">
                    {/* Order Info */}
                    <div>
                      <p className="font-bold text-lg">
                        🎁 {order.asset}
                      </p>
                      <p className="text-text-muted text-sm">
                        {order.users?.full_name || order.users?.email}
                      </p>
                      <p className="text-text-muted text-xs">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>

                    {/* Amount */}
                    <div>
                      <p className="text-text-muted text-sm">Amount</p>
                      <p className="font-semibold">${order.amount}</p>
                      <p className="text-green-400 font-bold">₦{order.value_ngn.toLocaleString()}</p>
                    </div>

                    {/* Details */}
                    <div>
                      <p className="text-text-muted text-sm">Details</p>
                      <p className="text-sm">Code: {order.details?.card_code || 'N/A'}</p>
                      <p className="text-sm">Form: {order.details?.card_form || 'N/A'}</p>
                      <p className="text-xs text-text-muted">
                        Files: {order.details?.files?.length || 0}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold text-center ${statusColors[order.status] || 'bg-gray-400/20 text-gray-400'}`}>
                        {order.status.toUpperCase()}
                      </span>

                      {order.status === 'pending' && (
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={() => handleVerify(order.id, order.user_id, order.value_ngn)}
                            disabled={processing === order.id}
                            className="flex-1 bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-semibold hover:bg-green-600 transition disabled:opacity-50"
                          >
                            {processing === order.id ? '...' : '✅ Verify'}
                          </button>
                          <button
                            onClick={() => handleReject(order.id)}
                            disabled={processing === order.id}
                            className="flex-1 bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-semibold hover:bg-red-600 transition disabled:opacity-50"
                          >
                            ❌ Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
