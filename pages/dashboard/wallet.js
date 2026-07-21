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

  // Top-Up Modal state
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpCurrency, setTopUpCurrency] = useState('NGN');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpError, setTopUpError] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Check if we just returned from Flutterwave
  useEffect(() => {
    const { transaction_id, status } = router.query;
    if (transaction_id && status) {
      verifyPayment(transaction_id, status);
    }
  }, [router.query]);

  const verifyPayment = async (transactionId, status) => {
    if (status === 'successful') {
      setVerifying(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const response = await fetch('/api/flutterwave/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ transaction_id: transactionId }),
        });
        const data = await response.json();
        if (data.success) {
          fetchWalletData();
          alert('Your wallet has been credited successfully.');
          router.replace('/dashboard/wallet', undefined, { shallow: true });
        } else {
          alert('Payment verification failed. Please contact support.');
        }
      } catch (err) {
        console.error(err);
        alert('Error verifying payment.');
      } finally {
        setVerifying(false);
      }
    } else if (status === 'cancelled') {
      alert('You cancelled the payment.');
      router.replace('/dashboard/wallet', undefined, { shallow: true });
    }
  };

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

  const handleTopUp = async (e) => {
    e.preventDefault();
    setTopUpLoading(true);
    setTopUpError('');

    try {
      const amount = parseFloat(topUpAmount);
      if (!amount || amount <= 0) {
        setTopUpError('Enter a valid amount');
        setTopUpLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setTopUpError('You need to be logged in.');
        setTopUpLoading(false);
        return;
      }

      const response = await fetch('/api/flutterwave/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount, currency: topUpCurrency }),
      });

      const data = await response.json();

      if (data.success && data.payment_link) {
        window.location.href = data.payment_link;
      } else {
        setTopUpError(data.message || 'Failed to initialize payment.');
      }
    } catch (err) {
      setTopUpError('An error occurred.');
      console.error(err);
    } finally {
      setTopUpLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-text-primary">Loading...</div>;
  if (!user) return null;

  const currencySymbols = { ngn: '₦', usd: '$', ghs: '₵' };
  const currencyLabels = { ngn: 'Naira', usd: 'USD', ghs: 'Cedis' };
  const currencyNames = { ngn: 'NGN', usd: 'USD', ghs: 'GHS' };

  return (
    <>
      <Head>
        <title>Wallet · KJ Exchange</title>
      </Head>
      <DashboardLayout>
        {verifying && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="text-white text-center">
              <i className="fa-solid fa-spinner fa-spin text-4xl"></i>
              <p className="mt-2">Verifying your payment...</p>
            </div>
          </div>
        )}
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Wallet</h1>
            <button
              onClick={() => setHideBalance(!hideBalance)}
              className="flex items-center gap-2 text-text-muted hover:text-text-primary transition text-sm px-4 py-2 rounded-full border border-border hover:border-orange"
            >
              <i className={`fa-regular ${hideBalance ? 'fa-eye' : 'fa-eye-slash'}`}></i>
              {hideBalance ? 'Show' : 'Hide'}
            </button>
          </div>

          <div className="flex gap-2 bg-bg-card rounded-xl p-1 border border-border">
            {['ngn', 'usd', 'ghs'].map((cur) => (
              <button
                key={cur}
                onClick={() => setActiveCurrency(cur)}
                className={`flex-1 py-2 rounded-lg font-semibold transition ${
                  activeCurrency === cur
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange/20'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {currencyLabels[cur]} ({currencySymbols[cur]})
              </button>
            ))}
          </div>

          <div className="bg-gradient-to-br from-purple-900/40 to-orange-900/30 rounded-2xl p-6 border border-border relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <p className="text-text-muted text-sm">{currencyLabels[activeCurrency]} Balance</p>
              <p className="text-4xl font-bold">
                {hideBalance
                  ? '••••••'
                  : `${currencySymbols[activeCurrency]}${balances[activeCurrency].toLocaleString()}`}
              </p>

              <div className="flex flex-wrap gap-3 mt-4">
                <Link
                  href={`/dashboard/withdraw?currency=${currencyNames[activeCurrency]}`}
                  className="bg-orange text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-orange-600 transition shadow-lg shadow-orange/30"
                >
                  <i className="fa-solid fa-arrow-down mr-2"></i>Withdraw {currencyNames[activeCurrency]}
                </Link>
                <button
                  onClick={() => setShowTopUpModal(true)}
                  className="border border-border text-text-primary px-5 py-2 rounded-full text-sm font-semibold hover:border-orange transition"
                >
                  <i className="fa-solid fa-arrow-up mr-2"></i>Top Up
                </button>
                <Link
                  href="/dashboard/convert"
                  className="border border-border text-text-primary px-5 py-2 rounded-full text-sm font-semibold hover:border-orange transition"
                >
                  <i className="fa-solid fa-arrow-right-arrow-left mr-2"></i>Convert
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-bg-card rounded-2xl p-4 border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange/10 flex items-center justify-center text-orange text-lg">
                <i className="fa-solid fa-gift"></i>
              </div>
              <div>
                <p className="font-semibold">Gift Points</p>
                <p className="text-text-muted text-xs">10 points = ₦1</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-orange">
              {hideBalance ? '••••' : balances.gift_points.toLocaleString()}
            </p>
          </div>

          <div className="bg-bg-card rounded-2xl p-6 border border-border">
            <h2 className="text-lg font-bold mb-4">Transaction History</h2>
            {isLoading ? (
              <p className="text-text-muted">Loading...</p>
            ) : transactions.length === 0 ? (
              <div className="text-center py-6">
                <i className="fa-regular fa-clock text-4xl text-text-muted mb-2 block"></i>
                <p className="text-text-muted">No transactions yet.</p>
              </div>
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

      {/* Premium Top-Up Modal */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card rounded-2xl p-6 max-w-md w-full border border-border shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange/10 flex items-center justify-center text-orange text-xl">
                  <i className="fa-solid fa-wallet"></i>
                </div>
                <h2 className="text-xl font-bold">Top Up Wallet</h2>
              </div>

              <form onSubmit={handleTopUp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    <i className="fa-solid fa-naira-sign mr-1 text-orange"></i> Amount
                  </label>
                  <input
                    type="number"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                    placeholder="Enter amount"
                    required
                    min="100"
                    step="any"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    <i className="fa-solid fa-globe mr-1 text-orange"></i> Currency
                  </label>
                  <select
                    value={topUpCurrency}
                    onChange={(e) => setTopUpCurrency(e.target.value)}
                    className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                  >
                    <option value="NGN">Naira (₦)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GHS">Cedis (₵)</option>
                  </select>
                </div>
                {topUpError && (
                  <div className="bg-red-400/10 border border-red-400/20 rounded-xl p-3 text-red-400 text-sm flex items-center gap-2">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>{topUpError}</span>
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={topUpLoading}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3 rounded-xl hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50 shadow-lg shadow-orange/20 flex items-center justify-center gap-2"
                  >
                    {topUpLoading ? (
                      <><i className="fa-solid fa-spinner fa-spin"></i> Processing...</>
                    ) : (
                      <><i className="fa-solid fa-credit-card"></i> Pay with Flutterwave</>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTopUpModal(false)}
                    className="flex-1 border border-border text-text-primary py-3 rounded-xl hover:border-orange transition flex items-center justify-center gap-2"
                  >
                    <i className="fa-solid fa-xmark"></i> Cancel
                  </button>
                </div>
              </form>
              <div className="mt-4 text-center text-text-muted text-xs flex items-center justify-center gap-2">
                <i className="fa-brands fa-gg text-orange"></i>
                <span>Powered by Flutterwave</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
