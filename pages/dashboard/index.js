import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../_app';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';
import Head from 'next/head';

export default function DashboardOverview() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [bonusBalance, setBonusBalance] = useState(0);
  const [giftPoints, setGiftPoints] = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hideBalance, setHideBalance] = useState(false);

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
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance, bonus_balance, gift_points')
        .eq('user_id', user.id)
        .single();

      if (wallet) {
        setBalance(wallet.balance || 0);
        setBonusBalance(wallet.bonus_balance || 0);
        setGiftPoints(wallet.gift_points || 0);
      }

      const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (txs) setRecentOrders(txs);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-text-primary">Loading...</div>;
  if (!user) return null;

  const totalBalance = balance + bonusBalance;

  return (
    <>
      <Head>
        <title>Dashboard · KJ Exchange</title>
      </Head>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-text-muted">Hello {user?.email?.split('@')[0] || 'User'}, 👋</p>
            </div>
            <button
              onClick={() => setHideBalance(!hideBalance)}
              className="flex items-center gap-2 text-text-muted hover:text-text-primary transition"
            >
              <i className={`fa-regular ${hideBalance ? 'fa-eye' : 'fa-eye-slash'}`}></i>
              {hideBalance ? 'Show Balance' : 'Hide Balance'}
            </button>
          </div>

          <div className="bg-gradient-to-r from-purple-900/30 to-orange-900/20 rounded-2xl p-6 border border-border">
            <p className="text-text-muted text-sm">Available Balance</p>
            <p className="text-4xl font-bold">
              {hideBalance ? '••••••' : `₦${totalBalance.toLocaleString()}`}
            </p>
            <div className="flex gap-4 mt-1 text-sm text-text-muted">
              <span>{hideBalance ? '••••••' : `≈ $${(totalBalance / 1550).toFixed(2)} USD`}</span>
              <span>•</span>
              <span>{hideBalance ? '••••••' : `≈ ₵${(totalBalance / 120).toFixed(2)} GHS`}</span>
            </div>
            {bonusBalance > 0 && (
              <p className="text-sm text-green-400">Includes ₦{bonusBalance.toLocaleString()} welcome bonus</p>
            )}
            <div className="flex flex-wrap gap-3 mt-4">
              <Link href="/dashboard/withdraw" className="bg-orange text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-orange-600 transition">
                <i className="fa-solid fa-arrow-down mr-2"></i>Withdraw
              </Link>
              <Link href="/dashboard/wallet" className="border border-border text-text-primary px-4 py-2 rounded-full text-sm font-semibold hover:border-orange transition">
                <i className="fa-solid fa-arrow-up mr-2"></i>Top Up
              </Link>
              <Link href="/dashboard/convert" className="border border-border text-text-primary px-4 py-2 rounded-full text-sm font-semibold hover:border-orange transition">
                <i className="fa-solid fa-arrow-right-arrow-left mr-2"></i>Convert
              </Link>
            </div>
          </div>

          <div className="bg-bg-card rounded-2xl p-4 border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <i className="fa-solid fa-gift text-2xl text-orange"></i>
              <div>
                <p className="font-semibold">Gift Points</p>
                <p className="text-text-muted text-sm">Earn points from trades</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-orange">
              {hideBalance ? '••••' : giftPoints.toLocaleString()}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">Products</h2>
              <Link href="/dashboard/products" className="text-sm text-orange hover:underline">View All</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/dashboard/sell-gift-card" className="bg-bg-card rounded-xl p-4 text-center hover:border-orange transition border border-border">
                <i className="fa-solid fa-gift text-3xl text-orange mb-1"></i>
                <p className="text-sm font-semibold">Gift Cards</p>
              </Link>
              <Link href="/dashboard/sell-crypto" className="bg-bg-card rounded-xl p-4 text-center hover:border-orange transition border border-border">
                <i className="fa-brands fa-bitcoin text-3xl text-orange mb-1"></i>
                <p className="text-sm font-semibold">Crypto</p>
              </Link>
              <div className="bg-bg-card/50 rounded-xl p-4 text-center border border-border opacity-60">
                <i className="fa-solid fa-sim-card text-3xl text-text-muted mb-1"></i>
                <p className="text-sm font-semibold">eSIM</p>
                <span className="text-[10px] text-orange">Soon</span>
              </div>
              <div className="bg-bg-card/50 rounded-xl p-4 text-center border border-border opacity-60">
                <i className="fa-solid fa-file-invoice text-3xl text-text-muted mb-1"></i>
                <p className="text-sm font-semibold">Bills</p>
                <span className="text-[10px] text-orange">Soon</span>
              </div>
            </div>
          </div>

          <div className="bg-bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Recent Transactions</h2>
              <Link href="/dashboard/orders" className="text-sm text-orange hover:underline">View All</Link>
            </div>
            {isLoading ? (
              <p className="text-text-muted">Loading...</p>
            ) : recentOrders.length === 0 ? (
              <p className="text-text-muted">No transactions yet.</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center border-b border-border pb-3">
                    <div>
                      <p className="capitalize font-medium">{tx.type.replace('_', ' ')}</p>
                      <p className="text-text-muted text-xs">{new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                      </p>
                      <span className={`text-xs ${tx.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
