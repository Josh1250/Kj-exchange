import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../_app';
import Layout from '../../components/layout/Layout';
import { supabase } from '../../lib/supabaseClient';
import Head from 'next/head';

export default function Orders() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const statusColors = {
    pending: 'bg-yellow-400/20 text-yellow-400',
    verifying: 'bg-blue-400/20 text-blue-400',
    verified: 'bg-green-400/20 text-green-400',
    completed: 'bg-green-500/20 text-green-500',
    failed: 'bg-red-400/20 text-red-400',
  };

  return (
    <>
      <Head>
        <title>Orders · KJ Exchange</title>
      </Head>
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">📋 My Orders</h1>
          {isLoading ? (
            <p className="text-text-muted">Loading orders...</p>
          ) : orders.length === 0 ? (
            <div className="bg-bg-card rounded-2xl p-8 text-center border border-border">
              <p className="text-text-muted">No orders yet.</p>
              <a href="/dashboard/sell-gift-card" className="text-orange hover:underline mt-2 inline-block">Start trading now</a>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-bg-card rounded-2xl p-6 border border-border">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <p className="font-bold text-lg">
                        {order.type === 'gift_card' ? '🎁' : '₿'} {order.asset}
                      </p>
                      <p className="text-text-muted text-sm">
                        Amount: {order.amount} • Rate: ₦{order.rate.toLocaleString()}
                      </p>
                      <p className="text-text-muted text-sm">
                        Value: ₦{order.value_ngn.toLocaleString()}
                      </p>
                      <p className="text-text-muted text-xs">
                        {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[order.status] || 'bg-gray-400/20 text-gray-400'}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
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
