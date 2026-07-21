import { useEffect, useState } from 'react';
import { useAuth } from '../_app';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

export default function DashboardOverview() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [bonusBalance, setBonusBalance] = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const { data: wallet } = await supabase
          .from('wallets')
          .select('balance, bonus_balance')
          .eq('user_id', user.id)
          .single();
        if (wallet) {
          setBalance(wallet.balance || 0);
          setBonusBalance(wallet.bonus_balance || 0);
        }
        const { data: txs } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        setRecentOrders(txs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const totalBalance = balance + bonusBalance;
  const usdEquivalent = (totalBalance / 1550).toFixed(2);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-text-muted">Hello {user?.email?.split('@')[0] || 'User'}, 👋</p>
          </div>
          <div className="text-right">
            <p className="text-text-muted text-sm">Available Balance</p>
            <p className="text-2xl font-bold">₦{totalBalance.toLocaleString()}</p>
            <p className="text-xs text-text-muted">≈ ${usdEquivalent} USD</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <Link href="/dashboard/withdraw" className="bg-orange text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-orange-600 transition">
            <i className="fa-solid fa-arrow-down mr-2"></i>Withdraw
          </Link>
          <Link href="/dashboard/wallet" className="border border-border text-text-primary px-4 py-2 rounded-full text-sm font-semibold hover:border-orange transition">
            <i className="fa-solid fa-plus mr-2"></i>Top Up
          </Link>
        </div>

        {/* Products Grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Products</h2>
            <Link href="#" className="text-sm text-orange hover:underline">View All</Link>
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

        {/* Promo Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-purple-900/30 to-orange-900/20 rounded-xl p-4 border border-border">
            <div className="flex items-start gap-3">
              <i className="fa-solid fa-handshake text-2xl text-orange"></i>
              <div>
                <h3 className="font-bold">Introducing KJ OTC</h3>
                <p className="text-text-muted text-sm">Execute large crypto trades with competitive rates and fast settlement.</p>
                <Link href="#" className="text-orange text-sm hover:underline inline-block mt-2">Learn More →</Link>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-900/30 to-orange-900/20 rounded-xl p-4 border border-border">
            <div className="flex items-start gap-3">
              <i className="fa-solid fa-arrow-right-arrow-left text-2xl text-orange"></i>
              <div>
                <h3 className="font-bold">Internal Transfer</h3>
                <p className="text-text-muted text-sm">You can now send funds to other KJ Exchange users instantly.</p>
                <Link href="#" className="text-orange text-sm hover:underline inline-block mt-2">Learn More →</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-bg-card rounded-2xl p-6 border border-border">
          <h2 className="text-lg font-bold mb-4">Recent Transactions</h2>
          {loading ? (
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
                    <span className={`text-xs ${tx.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`}>{tx.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
