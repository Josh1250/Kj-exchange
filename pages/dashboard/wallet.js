import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../_app';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';
import Head from 'next/head';

export default function Wallet() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [balances, setBalances] = useState({
    ngn: 0,
    usd: 0,
    ghs: 0,
    gift_points: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hideBalance, setHideBalance] = useState(false);
  const [activeCurrency, setActiveCurrency] = useState('ngn');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  const fetchWalletData = async () => {
    try {
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance, usd_balance, ghs_balance, gift_points')
        .eq('user_id', user.id)
        .single();

      if (wallet) {
        setBalances({
          ngn: wallet.balance || 0,
          usd: wallet.usd_balance || 0,
          ghs: wallet.ghs_balance || 0,
          gift_points: wallet.gift_points || 0,
        });
      }

      const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (txs) setTransactions(txs);
    } catch (err) {
      console.error('Error fetching wallet data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-text-primary">Loading...</div>;
  if (!user) return null;

  const currencySymbols = { ngn: '₦', usd: '$', ghs: '₵' };
  const currencyLabels = { ngn: 'Naira', usd: 'USD', ghs: 'Cedis' };

  return (
    <>
      <Head>
        <title>Wallet · KJ Exchange</title>
      </Head>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Wallet</h1>
            <button
              onClick={() => setHideBalance(!hideBalance)}
              className="flex items-center gap-2 text-text-muted hover:text-text-primary transition"
            >
              <i className={`fa-regular ${hideBalance ? 'fa-eye' : 'fa-eye-slash'}`}></i>
              {hideBalance ? 'Show' : 'Hide'}
            </button>
          </div>

          {/* Currency Tabs */}
          <div className="flex gap-2 bg-bg-card rounded-xl p-1 border border-border">
            {['ngn', 'usd', 'ghs'].map((cur) => (
              <button
                key={cur}
                onClick={() => setActiveCurrency(cur)}
                className={`flex-1 py-2 rounded-lg font-semibold transition ${activeCurrency === cur ? 'bg-orange text-white' : 'text-text-muted hover:text-text-primary'}`}
              >
                {currencyLabels[cur]} ({currencySymbols[cur]})
              </button>
            ))}
          </div>

          {/* Balance Display */}
          <div className="bg-gradient-to-r from-purple-900/30 to-orange-900/20 rounded-2xl p-6 border border-border">
            <p className="text-text-muted text-sm">{currencyLabels[activeCurrency]} Balance</p>
            <p className="text-4xl font-bold">
              {hideBalance ? '••••••' : `${currencySymbols[activeCurrency]}${balances[activeCurrency].toLocaleString()}`}
            </p>
            <div className="flex gap-3 mt-4">
              <Link href="/dashboard/withdraw" className="bg-orange text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-orange-600 transition">
                <i className="fa-solid fa-arrow-down mr-2"></i>Withdraw
              </Link>
              <Link href="/dashboard/topup" className="border border-border text-text-primary px-4 py-2 rounded-full text-sm font-semibold hover:border-orange transition">
                <i className="fa-solid fa-arrow-up mr-2"></i>Top Up
              </Link>
            </div>
          </div>

          {/* Gift Points Section */}
          <div className="bg-bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <i className="fa-solid fa-gift text-2xl text-orange"></i>
                <div>
                  <p className="font-bold">Gift Points</p>
                  <p className="text-text-muted text-sm">10 points = ₦1</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-orange">
                {hideBalance ? '••••' : balances.gift_points.toLocaleString()}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="bg-orange/20 text-orange px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-orange/30 transition">
                Redeem Points
              </button>
              <button className="border border-border text-text-muted px-4 py-1.5 rounded-full text-sm hover:border-orange transition">
                View History
              </button>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-bg-card rounded-2xl p-6 border border-border">
            <h2 className="text-lg font-bold mb-4">Transaction History</h2>
            {isLoading ? (
              <p className="text-text-muted">Loading...</p>
            ) : transactions.length === 0 ? (
              <p className="text-text-muted">No transactions yet.</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
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
