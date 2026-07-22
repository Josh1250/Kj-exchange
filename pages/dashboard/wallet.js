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

  // ===== State =====
  const [balances, setBalances] = useState({ ngn: 0, usd: 0, ghs: 0, gift_points: 0 });
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hideBalance, setHideBalance] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('NGN');
  const [exchangeRates, setExchangeRates] = useState({ USD: 1500, GHS: 120 }); // fallback

  // Top-Up Modal
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpCurrency, setTopUpCurrency] = useState('NGN');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpError, setTopUpError] = useState('');
  const [topUpTab, setTopUpTab] = useState('bank');
  const [verifying, setVerifying] = useState(false);

  // Virtual Account Details
  const [virtualAccount, setVirtualAccount] = useState({
    accountNumber: '',
    bankName: '',
    accountName: '',
  });

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
      fetchVirtualAccount();
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
      // Using a more reliable free API
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
      // Fallback rates (you can adjust these)
      setExchangeRates({ USD: 1500, GHS: 120 });
    }
  };

  const fetchVirtualAccount = async () => {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('virtual_account_number, virtual_bank_name, full_name')
        .eq('id', user.id)
        .single();

      if (userData?.virtual_account_number) {
        setVirtualAccount({
          accountNumber: userData.virtual_account_number,
          bankName: userData.virtual_bank_name || 'Wema Bank',
          accountName: `${userData.full_name || user.email?.split('@')[0]}/KJ Exchange`,
        });
      } else {
        // No virtual account – show "Create Wallet" button
        console.log('No virtual account found for user.');
      }
    } catch (err) {
      console.error('Error fetching virtual account:', err);
    }
  };

  // ===== Create Virtual Account (with debug alerts) =====
  const createVirtualAccount = async () => {
    alert('⏳ Creating virtual account...');
    try {
      const response = await fetch('/api/flutterwave/create-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          fullName: user.full_name,
          phone: user.phone,
        }),
      });
      const data = await response.json();
      console.log('Create wallet response:', data);
      alert('Response: ' + JSON.stringify(data, null, 2));
      if (data.success) {
        setVirtualAccount({
          accountNumber: data.accountNumber,
          bankName: data.bankName || 'Wema Bank',
          accountName: `${user.full_name || user.email?.split('@')[0]}/KJ Exchange`,
        });
        alert('✅ Virtual account created!\nAccount: ' + data.accountNumber);
        // Refresh the page to show the account
        window.location.reload();
      } else {
        alert('❌ Failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('❌ Error: ' + err.message);
      console.error(err);
    }
  };

  // ===== Top-Up Handlers =====
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

  // ===== Copy to Clipboard =====
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('📋 Copied to clipboard!');
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

  // ===== Loading State =====
  if (loading) return <div className="flex items-center justify-center min-h-screen text-text-primary">Loading...</div>;
  if (!user) return null;

  const totalBalance = balances.ngn;

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
          {/* Header with Create Wallet Button */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <i className="fa-solid fa-wallet text-orange"></i>
              Wallet
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              {!virtualAccount.accountNumber && (
                <button
                  onClick={createVirtualAccount}
                  className="bg-orange/20 hover:bg-orange/30 text-orange px-4 py-2 rounded-full text-sm font-semibold transition flex items-center gap-2"
                >
                  <i className="fa-solid fa-plus"></i> Create Wallet
                </button>
              )}
              <button
                onClick={() => setHideBalance(!hideBalance)}
                className="flex items-center gap-2 text-text-muted hover:text-text-primary transition text-sm px-4 py-2 rounded-full border border-border hover:border-orange"
              >
                <i className={`fa-regular ${hideBalance ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                {hideBalance ? 'Show' : 'Hide'}
              </button>
            </div>
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
                  {selectedCurrency !== 'NGN' && <span>≈ ₦{totalBalance.toLocaleString()}</span>}
                  {selectedCurrency !== 'USD' && (
                    <>
                      <span>•</span>
                      <span>≈ ${(totalBalance / exchangeRates.USD).toFixed(2)}</span>
                    </>
                  )}
                  {selectedCurrency !== 'GHS' && (
                    <>
                      <span>•</span>
                      <span>≈ ₵{(totalBalance / exchangeRates.GHS).toFixed(2)}</span>
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
                    <i className="fa-solid fa-arrow-up"></i>
                  </div>
                  <p className="text-sm font-semibold mt-2">Top Up</p>
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

            {/* Filter Tabs */}
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

      {/* ===== Premium Top-Up Modal ===== */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-2xl max-w-lg w-full p-6 border border-border max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <i className="fa-solid fa-circle-arrow-up text-orange"></i>
                Top Up Wallet
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

            {/* Tabs */}
            <div className="flex bg-black/30 rounded-xl p-1 mb-6 border border-border">
              <button
                onClick={() => setTopUpTab('bank')}
                className={`flex-1 py-2.5 rounded-lg font-semibold transition text-sm flex items-center justify-center gap-2 ${
                  topUpTab === 'bank'
                    ? 'bg-orange text-white shadow-lg shadow-orange/20'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <i className="fa-solid fa-building-columns"></i> Bank Transfer
              </button>
              <button
                onClick={() => setTopUpTab('card')}
                className={`flex-1 py-2.5 rounded-lg font-semibold transition text-sm flex items-center justify-center gap-2 ${
                  topUpTab === 'card'
                    ? 'bg-orange text-white shadow-lg shadow-orange/20'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <i className="fa-regular fa-credit-card"></i> Card Payment
              </button>
            </div>

            {topUpTab === 'bank' && (
              // Bank Transfer Tab – Show Virtual Account
              <div className="space-y-6">
                {!virtualAccount.accountNumber ? (
                  <div className="text-center py-8">
                    <i className="fa-regular fa-building-columns text-5xl text-text-muted block mb-4"></i>
                    <p className="text-text-muted">You don't have a virtual account yet.</p>
                    <button
                      onClick={createVirtualAccount}
                      className="mt-4 bg-orange text-white px-6 py-2 rounded-full font-semibold hover:bg-orange-600 transition"
                    >
                      Create Wallet
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="bg-black/20 rounded-xl p-4 border border-border text-center">
                      <p className="text-text-muted text-xs uppercase tracking-wider">Bank Name</p>
                      <p className="text-lg font-bold">{virtualAccount.bankName || 'Wema Bank'}</p>
                    </div>
                    <div className="bg-black/20 rounded-xl p-4 border border-border text-center relative">
                      <p className="text-text-muted text-xs uppercase tracking-wider">Account Number</p>
                      <p className="text-2xl font-bold tracking-wider">{virtualAccount.accountNumber}</p>
                      <button
                        onClick={() => copyToClipboard(virtualAccount.accountNumber)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-orange/10 hover:bg-orange/20 text-orange px-3 py-1.5 rounded-lg text-sm font-semibold transition"
                      >
                        <i className="fa-regular fa-copy"></i> Copy
                      </button>
                    </div>
                    <div className="bg-black/20 rounded-xl p-4 border border-border text-center">
                      <p className="text-text-muted text-xs uppercase tracking-wider">Account Name</p>
                      <p className="text-lg font-semibold">{virtualAccount.accountName}</p>
                    </div>
                    <div className="bg-orange/5 border border-orange/20 rounded-xl p-3 text-center text-sm text-text-muted">
                      <i className="fa-solid fa-info-circle text-orange mr-1"></i>
                      Min. deposit: ₦100 • Funds auto‑credit within 10 minutes
                    </div>
                  </>
                )}
                <div className="text-center text-xs text-text-muted mt-4">
                  <i className="fa-brands fa-gg text-orange mr-1"></i>
                  Powered by Flutterwave
                </div>
              </div>
            )}

            {topUpTab === 'card' && (
              <form onSubmit={handleTopUp} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    <i className="fa-solid fa-naira-sign text-orange mr-1"></i> Amount
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
                    <i className="fa-solid fa-globe text-orange mr-1"></i> Currency
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
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={topUpLoading}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3.5 rounded-xl hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50 shadow-lg shadow-orange/20 flex items-center justify-center gap-2"
                  >
                    {topUpLoading ? (
                      <><i className="fa-solid fa-spinner fa-spin"></i> Processing...</>
                    ) : (
                      <><i className="fa-regular fa-credit-card"></i> Pay with Flutterwave</>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTopUpModal(false)}
                    className="flex-1 border border-border text-text-primary py-3.5 rounded-xl hover:border-orange transition flex items-center justify-center gap-2"
                  >
                    <i className="fa-regular fa-xmark"></i> Cancel
                  </button>
                </div>
                <div className="text-center text-text-muted text-xs flex items-center justify-center gap-2">
                  <i className="fa-brands fa-gg text-orange"></i>
                  <span>Powered by Flutterwave</span>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
