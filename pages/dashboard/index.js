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
  const [usdBalance, setUsdBalance] = useState(0);
  const [ghsBalance, setGhsBalance] = useState(0);
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
      // Get wallet
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance, bonus_balance, usd_balance, ghs_balance, gift_points')
        .eq('user_id', user.id)
        .single();

      if (wallet) {
        setBalance(wallet.balance || 0);
        setBonusBalance(wallet.bonus_balance || 0);
        setUsdBalance(wallet.usd_balance || 0);
        setGhsBalance(wallet.ghs_balance || 0);
        setGiftPoints(wallet.gift_points || 0);
      }

      // Get recent transactions
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
          {/* Welcome */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-text-muted">Hello {user?.email?.split('@')[0] || 'User'}, 👋</p>
            </div>
            <button
              onClick={() => setHideBalance(!hideBalance)}
              className="flex items-center gap-2 text-text-muted hover:text-text-primary transition text-sm px-4 py-2 rounded-full border border-border hover:border-orange"
            >
              <i className={`fa-regular ${hideBalance ? 'fa-eye' : 'fa-eye-slash'}`}></i>
              {hideBalance ? 'Show Balance' : 'Hide Balance'}
            </button>
          </div>

          {/* Balance Card */}
          <div className="bg-gradient-to-br from-purple-900/40 to-orange-900/30 rounded-2xl p-6 border border-border relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl"></div>

            <div className="relative z-10">
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
                <p className="text-sm text-green-400 mt-1">
                  🎁 Includes ₦{bonusBalance.toLocaleString()} welcome bonus
                </p>
              )}

              <div className="flex flex-wrap gap-3 mt-4">
                <Link href="/dashboard/withdraw" className="bg-orange text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-orange-600 transition shadow-lg shadow-orange/30">
                  <i className="fa-solid fa-arrow-down mr-2"></i>Withdraw
                </Link>
                <Link href="/dashboard/wallet" className="border border-border text-text-primary px-5 py-2 rounded-full text-sm font-semibold hover:border-orange transition">
                  <i className="fa-solid fa-arrow-up mr-2"></i>Top Up
                </Link>
                <Link href="/dashboard/convert" className="border border-border text-text-primary px-5 py-2 rounded-full text-sm font-semibold hover:border-orange transition">
                  <i className="fa-solid fa-arrow-right-arrow-left mr-2"></i>Convert
                </Link>
              </div>
            </div>
          </div>

          {/* Gift Points */}
          <div className="bg-bg-card rounded-2xl p-4 border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange/10 flex items-center justify-center text-orange text-lg">
                <i className="fa-solid fa-gift"></i>
              </div>
              <div>
                <p className="font-semibold">Gift Points</p>
                <p className="text-text-muted text-xs">Earn points from trades</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-orange">
              {hideBalance ? '••••' : giftPoints.toLocaleString()}
            </p>
          </div>

          {/* Products */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">Products</h2>
              <Link href="/dashboard/products" className="text-sm text-orange hover:underline">View All</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/dashboard/sell-gift-card" className="bg-bg-card rounded-xl p-4 text-center hover:border-orange transition border border-border group">
                <div className="w-10 h-10 mx-auto rounded-full bg-orange/10 flex items-center justify-center text-orange text-xl group-hover:scale-110 transition">
                  <i className="fa-solid fa-gift"></i>
                </div>
                <p className="text-sm font-semibold mt-2">Gift Cards</p>
              </Link>
              <Link href="/dashboard/sell-crypto" className="bg-bg-card rounded-xl p-4 text-center hover:border-orange transition border border-border group">
                <div className="w-10 h-10 mx-auto rounded-full bg-orange/10 flex items-center justify-center text-orange text-xl group-hover:scale-110 transition">
                  <i className="fa-brands fa-bitcoin"></i>
                </div>
                <p className="text-sm font-semibold mt-2">Crypto</p>
              </Link>
              <div className="bg-bg-card/50 rounded-xl p-4 text-center border border-border opacity-60">
                <div className="w-10 h-10 mx-auto rounded-full bg-orange/10 flex items-center justify-center text-text-muted text-xl">
                  <i className="fa-solid fa-sim-card"></i>
                </div>
                <p className="text-sm font-semibold mt-2">eSIM</p>
                <span className="text-[10px] text-orange">Soon</span>
              </div>
              <div className="bg-bg-card/50 rounded-xl p-4 text-center border border-border opacity-60">
                <div className="w-10 h-10 mx-auto rounded-full bg-orange/10 flex items-center justify-center text-text-muted text-xl">
                  <i className="fa-solid fa-file-invoice"></i>
                </div>
                <p className="text-sm font-semibold mt-2">Bills</p>
                <span className="text-[10px] text-orange">Soon</span>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Recent Transactions</h2>
              <Link href="/dashboard/orders" className="text-sm text-orange hover:underline">View All</Link>
            </div>
            {isLoading ? (
              <p className="text-text-muted">Loading...</p>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-6">
                <i className="fa-regular fa-clock text-4xl text-text-muted mb-2 block"></i>
                <p className="text-text-muted">No transactions yet.</p>
                <Link href="/dashboard/sell-gift-card" className="text-orange text-sm hover:underline inline-block mt-2">
                  Start trading now →
                </Link>
              </div>
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
