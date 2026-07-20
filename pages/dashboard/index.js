import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../_app';
import Layout from '../../components/layout/Layout';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';
import Head from 'next/head';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Get wallet balance
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (wallet) {
        setBalance(wallet.balance);
      }

      // Get recent orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (orders) {
        setRecentOrders(orders);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-primary">
        Loading...
      </div>
    );
  }

  const statusColors = {
    pending: 'text-yellow-400',
    verifying: 'text-blue-400',
    verified: 'text-green-400',
    completed: 'text-green-500',
    failed: 'text-red-400',
  };

  return (
    <>
      <Head>
        <title>Dashboard · KJ Exchange</title>
      </Head>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Welcome back, {user.email?.split('@')[0] || 'User'} 👋</h1>

          {/* Balance Card */}
          <div className="bg-gradient-to-r from-purple/20 to-orange/10 rounded-2xl p-6 border border-border mb-8">
            <p className="text-text-muted text-sm">Total Balance</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold">₦{balance.toLocaleString()}</span>
              <span className="text-text-muted text-sm mb-1">= ${(balance / 1550).toFixed(2)}</span>
            </div>
            <div className="flex gap-2 mt-2">
              <span className="text-xs text-green-400 bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20">
                <i className="fas fa-check-circle mr-1"></i> 0% Fees
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Link href="/dashboard/wallet" className="bg-bg-card p-4 rounded-xl text-center hover:border-orange transition border border-border">
              <div className="text-2xl mb-1">💰</div>
              <p className="text-sm font-semibold">Wallet</p>
            </Link>
            <Link href="/dashboard/sell-gift-card" className="bg-bg-card p-4 rounded-xl text-center hover:border-orange transition border border-border">
              <div className="text-2xl mb-1">🎁</div>
              <p className="text-sm font-semibold">Sell Gift Card</p>
            </Link>
            <Link href="/dashboard/sell-crypto" className="bg-bg-card p-4 rounded-xl text-center hover:border-orange transition border border-border">
              <div className="text-2xl mb-1">₿</div>
              <p className="text-sm font-semibold">Sell Crypto</p>
            </Link>
            <Link href="/dashboard/swap" className="bg-bg-card p-4 rounded-xl text-center hover:border-orange transition border border-border">
              <div className="text-2xl mb-1">🔄</div>
              <p className="text-sm font-semibold">Swap</p>
            </Link>
          </div>

          {/* Recent Orders */}
          <div className="bg-bg-card rounded-2xl p-6 border border-border">
            <h2 className="text-xl font-bold mb-4">Recent Orders</h2>
            {isLoading ? (
              <p className="text-text-muted">Loading orders...</p>
            ) : recentOrders.length === 0 ? (
              <p className="text-text-muted">No orders yet. Start trading today!</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex justify-between items-center border-b border-border pb-3">
                    <div>
                      <p className="font-semibold">
                        {order.type === 'gift_card' ? '🎁' : '₿'} {order.asset}
                      </p>
                      <p className="text-text-muted text-sm">₦{order.value_ngn.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-semibold ${statusColors[order.status] || 'text-text-muted'}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <p className="text-text-muted text-xs">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link href="/dashboard/orders" className="block text-center text-orange hover:text-orange-light mt-4 text-sm">
              View All Orders →
            </Link>
          </div>
        </div>
      </Layout>
    </>
  );
}
