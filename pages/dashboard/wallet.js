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

  const [balances, setBalances] = useState({ ngn: 0, usd: 0, ghs: 0, gift_points: 0 });
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hideBalance, setHideBalance] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('NGN');
  const [exchangeRates, setExchangeRates] = useState({ USD: 1500, GHS: 120 });

  // Top-Up Modal
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpCurrency, setTopUpCurrency] = useState('NGN');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpError, setTopUpError] = useState('');
  const [verifying, setVerifying] = useState(false);

  // ===== Check for Flutterwave return =====
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
          alert('✅ Your wallet has been credited successfully!');
          router.replace('/dashboard/wallet', undefined, { shallow: true });
        } else {
          alert('❌ Payment verification failed. Please contact support.');
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

  // ===== Load Data =====
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchWalletData();
      fetchExchangeRates();
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

      if (txs) {
        setTransactions(txs);
        setFilteredTransactions(txs);
      }
    } catch (err) {
      console.error('Error fetching wallet data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExchangeRates = async () => {
    try {
      const response = await fetch('https://api.frankfurter.app/latest?from=NGN');
      const data = await response.json();
      if (data.rates) {
        setExchangeRates({
          USD: data.rates.USD || 1500,
          GHS: data.rates.GHS || 120,
        });
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      setExchangeRates({ USD: 1500, GHS: 120 });
    }
  };

  // ===== Top-Up Handler =====
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

  // ===== Get Converted Balance =====
  const getConvertedBalance = () => {
    const totalBalance = balances.ngn;
    switch (selectedCurrency) {
      case 'USD': return totalBalance / exchangeRates.USD;
      case 'GHS': return totalBalance / exchangeRates.GHS;
      default: return totalBalance;
    }
  };

  const getCurrencySymbol = () => {
    switch (selectedCurrency) {
      case 'USD': return '$';
      case 'GHS': return '₵';
      default: return '₦';
    }
  };

  // ===== Filter Transactions =====
  const filterTransactions = (type) => {
    if (type === 'all') {
      setFilteredTransactions(transactions);
      return;
    }
    const filtered = transactions.filter(tx => tx.type === type);
    setFilteredTransactions(filtered);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-text-primary">Loading...</div>;
  if (!user) return null;

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
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <i className="fa-solid fa-wallet text-orange"></i>
              Wallet
            </h1>
            <button
              onClick={() => setHideBalance(!hideBalance)}
              className="flex items-center gap-2 text-text-muted hover:text-text-primary transition text-sm px-4 py-2 rounded-full border border-border hover:border-orange"
            >
              <i className={`fa-regular ${hideBalance ? 'fa-eye' : 'fa-eye-slash'}`}></i>
              {hideBalance ? 'Show' : 'Hide'}
            </button>
          </div>

          {/* Balance Card */}
          <div className="glass rounded-2xl p-6 border border-border relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-text-muted text-sm flex items-center gap-2">
                  <i className="fa-regular fa-circle-check text-orange"></i>
                  Available Balance
                </p>
                <div className="flex bg-black/30 rounded-full p-1 border border-border/50">
                  {['NGN', 'USD', 'GHS'].map((currency) => (
                    <button
                      key={currency}
                      onClick={() => setSelectedCurrency(currency)}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                        selectedCurrency === currency
                          ? 'bg-orange text-white'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      {currency}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-4xl font-bold mt-2">
                {hideBalance
                  ? '••••••'
                  : `${getCurrencySymbol()}${getConvertedBalance().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </p>

              {!hideBalance && (
                <div className="flex flex-wrap gap-3 mt-1 text-sm text-text-muted">
                  {selectedCurrency !== 'NGN' && <span>≈ ₦{balances.ngn.toLocaleString()}</span>}
                  {selectedCurrency !== 'USD' && (
                    <>
                      <span>•</span>
                      <span>≈ ${(balances.ngn / exchangeRates.USD).toFixed(2)}</span>
                    </>
                  )}
                  {selectedCurrency !== 'GHS' && (
                    <>
                      <span>•</span>
                      <span>≈ ₵{(balances.ngn / exchangeRates.GHS).toFixed(2)}</span>
                    </>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                <Link
                  href="/dashboard/withdraw"
                  className="glass rounded-2xl p-4 text-center hover:border-orange transition border border-border group"
                >
                  <div className="w-10 h-10 mx-auto rounded-full bg-orange/10 flex items-center justify-center text-orange text-lg group-hover:scale-110 transition">
                    <i className="fa-solid fa-arrow-down"></i>
                  </div>
                  <p className="text-sm font-semibold mt-2">Withdraw</p>
                </Link>
                <button
                  onClick={() => setShowTopUpModal(true)}
                  className="glass rounded-2xl p-4 text-center hover:border-orange transition border border-border group"
                >
                  <div className="w-10 h-10 mx-auto rounded-full bg-orange/10 flex items-center justify-center text-orange text-lg group-hover:scale-110 transition">
                    <i className="fa-solid fa-circle-plus"></i>
                  </div>
                  <p className="text-sm font-semibold mt-2">Fund Wallet</p>
                </button>
                <Link
                  href="/dashboard/convert"
                  className="glass rounded-2xl p-4 text-center hover:border-orange transition border border-border group"
                >
                  <div className="w-10 h-10 mx-auto rounded-full bg-orange/10 flex items-center justify-center text-orange text-lg group-hover:scale-110 transition">
                    <i className="fa-solid fa-arrow-right-arrow-left"></i>
                  </div>
                  <p className="text-sm font-semibold mt-2">Convert</p>
                </Link>
                <Link
                  href="/dashboard/orders"
                  className="glass rounded-2xl p-4 text-center hover:border-orange transition border border-border group"
                >
                  <div className="w-10 h-10 mx-auto rounded-full bg-orange/10 flex items-center justify-center text-orange text-lg group-hover:scale-110 transition">
                    <i className="fa-solid fa-clock-rotate-left"></i>
                  </div>
                  <p className="text-sm font-semibold mt-2">History</p>
                </Link>
              </div>
            </div>
          </div>

          {/* Gift Points Banner */}
          <div className="glass rounded-2xl p-4 border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-full bg-orange/10 flex items-center justify-center text-orange text-lg flex-shrink-0">
                <i className="fa-solid fa-gift"></i>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">Gift Points</p>
                  <p className="text-2xl font-bold text-orange">
                    {hideBalance ? '••••' : balances.gift_points.toLocaleString()}
                  </p>
                </div>
                <div className="w-full bg-black/30 rounded-full h-2 mt-1">
                  <div
                    className="bg-gradient-to-r from-orange to-purple-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((balances.gift_points / 1000) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-text-muted text-xs mt-0.5">
                  {balances.gift_points >= 1000
                    ? '🎉 Reward unlocked!'
                    : `${1000 - balances.gift_points} points to next reward`}
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/referral"
              className="border border-orange/30 text-orange hover:bg-orange/10 px-4 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap"
            >
              View Rewards →
            </Link>
          </div>

          {/* Transaction History */}
          <div className="glass rounded-2xl p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <i className="fa-solid fa-clock-rotate-left text-orange"></i>
                Transaction History
              </h2>
              <Link href="/dashboard/orders" className="text-sm text-orange hover:underline">
                View All
              </Link>
            </div>

            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {['all', 'deposit', 'withdrawal', 'conversion', 'trade'].map((type) => (
                <button
                  key={type}
                  onClick={() => filterTransactions(type)}
                  className="px-4 py-1.5 rounded-full text-xs font-medium transition border border-border hover:border-orange/30 capitalize"
                >
                  {type === 'all' ? 'All' : type}
                </button>
              ))}
            </div>

            {isLoading ? (
              <p className="text-text-muted">Loading...</p>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-6">
                <i className="fa-regular fa-clock text-4xl text-text-muted mb-2 block"></i>
                <p className="text-text-muted">No transactions yet.</p>
                <button
                  onClick={() => setShowTopUpModal(true)}
                  className="text-orange text-sm hover:underline inline-block mt-2"
                >
                  Fund your wallet →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="flex-1 min-w-0">
                      <p className="capitalize font-medium text-sm flex items-center gap-2">
                        {tx.type?.replace('_', ' ')}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          tx.status === 'completed' ? 'bg-green-400/20 text-green-400' :
                          tx.status === 'processing' ? 'bg-blue-400/20 text-blue-400' :
                          tx.status === 'pending' ? 'bg-yellow-400/20 text-yellow-400' :
                          'bg-red-400/20 text-red-400'
                        }`}>
                          {tx.status || 'pending'}
                        </span>
                      </p>
                      <p className="text-text-muted text-xs">{new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className={`font-semibold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.currency || '₦'}{tx.amount?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>

      {/* ===== Simplified Top-Up Modal ===== */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-2xl max-w-md w-full p-6 border border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <i className="fa-solid fa-circle-plus text-orange"></i>
                Fund Wallet
              </h2>
              <button
                onClick={() => {
                  setShowTopUpModal(false);
                  setTopUpError('');
                }}
                className="text-text-muted hover:text-text-primary transition text-xl"
              >
                <i className="fa-regular fa-xmark"></i>
              </button>
            </div>

            <p className="text-text-muted text-sm mb-4">
              Choose an amount below. You'll be redirected to Flutterwave to complete your payment via card, bank transfer, USSD, or QR code.
            </p>

            <form onSubmit={handleTopUp} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Amount
                </label>
                <input
                  type="number"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-xl px-4 py-3.5 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 text-lg"
                  placeholder="Enter amount"
                  required
                  min="100"
                  step="any"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Currency
                </label>
                <select
                  value={topUpCurrency}
                  onChange={(e) => setTopUpCurrency(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-xl px-4 py-3.5 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20"
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
              <button
                type="submit"
                disabled={topUpLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3.5 rounded-xl hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50 shadow-lg shadow-orange/20 flex items-center justify-center gap-2"
              >
                {topUpLoading ? (
                  <><i className="fa-solid fa-spinner fa-spin"></i> Processing...</>
                ) : (
                  <><i className="fa-regular fa-credit-card"></i> Proceed to Payment</>
                )}
              </button>
              <p className="text-center text-text-muted text-xs flex items-center justify-center gap-2">
                <i className="fa-solid fa-lock text-green-400"></i>
                Secure payment via Flutterwave
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
