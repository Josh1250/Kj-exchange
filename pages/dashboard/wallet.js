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

  const [balances, setBalances] = useState({ ngn: 0, usd: 0, gift_points: 0 });
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hideBalance, setHideBalance] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('NGN');
  const [exchangeRates, setExchangeRates] = useState({ USD: 1500 });
  const [filterStatus, setFilterStatus] = useState('all'); // all, completed, pending, failed

  // Top-Up Modal
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpCurrency, setTopUpCurrency] = useState('NGN');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpError, setTopUpError] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Preset amounts for top-up
  const presetAmounts = [1000, 5000, 10000, 25000, 50000, 100000];

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
        .select('balance, usd_balance, gift_points')
        .eq('user_id', user.id)
        .single();

      if (wallet) {
        setBalances({
          ngn: wallet.balance || 0,
          usd: wallet.usd_balance || 0,
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
        });
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      setExchangeRates({ USD: 1500 });
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
    switch (selectedCurrency) {
      case 'USD': return balances.usd;
      case 'Gift Points': return balances.gift_points;
      default: return balances.ngn;
    }
  };

  const getCurrencySymbol = () => {
    switch (selectedCurrency) {
      case 'USD': return '$';
      case 'Gift Points': return '🎁';
      default: return '₦';
    }
  };

  // ===== Filter Transactions by Status =====
  const filterTransactions = (status) => {
    setFilterStatus(status);
    if (status === 'all') {
      setFilteredTransactions(transactions);
      return;
    }
    const filtered = transactions.filter(tx => tx.status === status);
    setFilteredTransactions(filtered);
  };

  // ===== Get Status Badge =====
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-400/20 text-green-400';
      case 'pending': return 'bg-yellow-400/20 text-yellow-400';
      case 'processing': return 'bg-blue-400/20 text-blue-400';
      case 'failed': return 'bg-red-400/20 text-red-400';
      default: return 'bg-yellow-400/20 text-yellow-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return 'fa-regular fa-circle-check';
      case 'pending': return 'fa-regular fa-clock';
      case 'processing': return 'fa-solid fa-spinner fa-spin';
      case 'failed': return 'fa-solid fa-circle-exclamation';
      default: return 'fa-regular fa-clock';
    }
  };

  const getTransactionIcon = (type) => {
    if (type === 'crypto_sale' || type === 'gift_card_sale' || type === 'trade') return 'fa-arrow-up text-green-400';
    if (type === 'withdrawal') return 'fa-arrow-down text-red-400';
    if (type === 'deposit') return 'fa-arrow-down text-green-400';
    if (type === 'bonus') return 'fa-gift text-orange';
    if (type === 'airtime') return 'fa-wifi text-blue-400';
    if (type === 'conversion') return 'fa-arrow-right-arrow-left text-purple-400';
    return 'fa-arrow-right text-text-muted';
  };

  const getTransactionLabel = (tx) => {
    if (tx.type === 'crypto_sale') return 'Crypto Sold';
    if (tx.type === 'gift_card_sale') return 'Gift Card Sold';
    if (tx.type === 'withdrawal') return 'Withdrawal';
    if (tx.type === 'deposit') return 'Deposit';
    if (tx.type === 'bonus') return 'Bonus';
    if (tx.type === 'airtime') return 'Airtime Purchase';
    if (tx.type === 'conversion') return 'Currency Conversion';
    if (tx.type === 'trade') return 'Trade';
    return tx.type?.replace('_', ' ') || 'Transaction';
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-text-primary">Loading...</div>;
  if (!user) return null;

  const totalBalance = balances.ngn;
  const displayBalance = getConvertedBalance();
  const symbol = getCurrencySymbol();
  const isGiftPoints = selectedCurrency === 'Gift Points';

  // Quick actions
  const actions = [
    { label: 'Deposit', icon: 'fa-circle-plus', href: '#', onClick: () => setShowTopUpModal(true), color: 'text-green-400' },
    { label: 'Withdraw', icon: 'fa-arrow-down', href: '/dashboard/withdraw', color: 'text-orange' },
    { label: 'Convert', icon: 'fa-arrow-right-arrow-left', href: '/dashboard/convert', color: 'text-purple-400' },
    { label: 'History', icon: 'fa-clock-rotate-left', href: '/dashboard/orders', color: 'text-blue-400' },
  ];

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

        <div className="max-w-2xl mx-auto px-4 py-4 pb-24">
          {/* Back Button */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary transition mb-4 group"
          >
            <i className="fa-solid fa-arrow-left text-sm group-hover:-translate-x-1 transition-transform"></i>
            <span className="text-sm font-medium">Back to Dashboard</span>
          </Link>

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange/10 flex items-center justify-center text-orange flex-shrink-0">
                <i className="fa-solid fa-wallet text-lg"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Wallet</h1>
                <p className="text-text-muted text-sm">Manage your funds</p>
              </div>
            </div>
            <button
              onClick={() => setHideBalance(!hideBalance)}
              className="flex items-center gap-2 text-text-muted hover:text-text-primary transition text-sm px-3 py-2 rounded-full border border-border hover:border-orange"
            >
              <i className={`fa-regular ${hideBalance ? 'fa-eye' : 'fa-eye-slash'}`}></i>
              {hideBalance ? 'Show' : 'Hide'}
            </button>
          </div>

          {/* Balance Card */}
          <div className="bg-gradient-to-br from-purple-900/40 via-orange-900/20 to-purple-900/40 rounded-2xl p-6 border border-border relative overflow-hidden mb-5">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                <p className="text-text-muted text-sm font-medium">Total Balance</p>
                <div className="flex bg-black/30 rounded-full p-1 border border-border/50">
                  {['NGN', 'USD', 'Gift Points'].map((curr) => (
                    <button
                      key={curr}
                      onClick={() => setSelectedCurrency(curr)}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                        selectedCurrency === curr
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange/30'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      {curr === 'Gift Points' ? '🎁' : curr}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-4xl md:text-5xl font-bold tracking-tight">
                {hideBalance ? '••••••' : `${symbol}${displayBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </p>

              {!hideBalance && !isGiftPoints && (
                <div className="flex flex-wrap gap-3 mt-1 text-sm text-text-muted">
                  {selectedCurrency !== 'NGN' && <span>≈ ₦{totalBalance.toLocaleString()}</span>}
                  {selectedCurrency !== 'USD' && <><span>•</span><span>≈ ${(totalBalance / exchangeRates.USD).toFixed(2)}</span></>}
                </div>
              )}
              {!hideBalance && isGiftPoints && (
                <p className="text-xs text-text-muted mt-1">10 points = ₦1</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            {actions.map((action) => (
              action.onClick ? (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  className="glass rounded-2xl p-4 text-center hover:border-orange transition border border-border group"
                >
                  <div className="w-10 h-10 mx-auto rounded-full bg-orange/10 flex items-center justify-center text-orange text-lg group-hover:scale-110 transition">
                    <i className={`fa-solid ${action.icon}`}></i>
                  </div>
                  <p className="text-xs font-semibold mt-1.5">{action.label}</p>
                </button>
              ) : (
                <Link
                  key={action.label}
                  href={action.href}
                  className="glass rounded-2xl p-4 text-center hover:border-orange transition border border-border group"
                >
                  <div className="w-10 h-10 mx-auto rounded-full bg-orange/10 flex items-center justify-center text-orange text-lg group-hover:scale-110 transition">
                    <i className={`fa-solid ${action.icon}`}></i>
                  </div>
                  <p className="text-xs font-semibold mt-1.5">{action.label}</p>
                </Link>
              )
            ))}
          </div>

          {/* Balance Breakdown */}
          <div className="glass rounded-2xl p-5 border border-border mb-5">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
              Balance Breakdown
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400"></span>
                  <span className="text-sm">NGN Balance</span>
                </div>
                <span className="font-bold text-sm">
                  {hideBalance ? '••••••' : `₦${balances.ngn.toLocaleString()}`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  <span className="text-sm">USD Balance</span>
                </div>
                <span className="font-bold text-sm">
                  {hideBalance ? '••••••' : `$${balances.usd.toFixed(2)}`}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange"></span>
                  <span className="text-sm">Gift Points</span>
                </div>
                <span className="font-bold text-sm text-orange">
                  {hideBalance ? '••••••' : balances.gift_points.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Gift Points Banner */}
          <div className="glass rounded-2xl p-4 border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
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
                    style={{ width: `${Math.min((balances.gift_points / 10000) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-text-muted text-xs mt-0.5">
                  {balances.gift_points >= 10000
                    ? '🎉 Ready to redeem!'
                    : `${10000 - balances.gift_points} points to minimum redemption`}
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
          <div className="glass rounded-2xl p-5 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
                Recent Transactions
              </h3>
              <Link href="/dashboard/orders" className="text-sm text-orange hover:underline">
                View All
              </Link>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
              {['all', 'completed', 'pending', 'failed'].map((status) => (
                <button
                  key={status}
                  onClick={() => filterTransactions(status)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap ${
                    filterStatus === status
                      ? 'bg-orange text-white shadow-lg shadow-orange/20'
                      : 'bg-black/20 text-text-muted hover:text-text-primary border border-border'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="text-center py-6 text-text-muted">Loading transactions...</div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <i className="fa-regular fa-clock text-4xl text-text-muted mb-3 block"></i>
                <p className="text-text-muted text-sm">No transactions found.</p>
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
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-border/50 hover:border-orange/20 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-orange/10 flex items-center justify-center flex-shrink-0">
                        <i className={`fa-solid ${getTransactionIcon(tx.type)}`}></i>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{getTransactionLabel(tx)}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-text-muted">{new Date(tx.created_at).toLocaleDateString()}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${getStatusBadge(tx.status)} flex items-center gap-1`}>
                            <i className={`${getStatusIcon(tx.status)} text-[8px]`}></i>
                            {tx.status || 'pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className={`font-bold text-sm ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.currency || '₦'}{Math.abs(tx.amount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>

      {/* ===== TOP-UP MODAL ===== */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-2xl max-w-md w-full p-6 border border-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
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
              Choose an amount below. You'll be redirected to Flutterwave to complete your payment.
            </p>

            <form onSubmit={handleTopUp} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Amount
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {presetAmounts.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTopUpAmount(preset.toString())}
                      className={`py-2 rounded-xl text-sm font-semibold transition border ${
                        parseFloat(topUpAmount) === preset
                          ? 'border-orange bg-orange/10 text-orange'
                          : 'border-border bg-black/20 text-text-muted hover:border-orange/50'
                      }`}
                    >
                      ₦{preset.toLocaleString()}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full bg-black/30 border border-border rounded-xl px-4 py-3.5 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 placeholder:text-text-muted/50 text-lg"
                  placeholder="Enter custom amount"
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
                  className="w-full bg-black/30 border border-border rounded-xl px-4 py-3.5 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 appearance-none"
                >
                  <option value="NGN">Naira (₦)</option>
                  <option value="USD">USD ($)</option>
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
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3.5 rounded-xl hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50 shadow-lg shadow-orange/20 flex items-center justify-center gap-2 touch-manipulation"
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
