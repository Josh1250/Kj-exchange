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

  // Currency / Wallet toggle
  const [selectedCurrency, setSelectedCurrency] = useState('NGN');
  const [kycLevel, setKycLevel] = useState(1);

  // Exchange rates for conversion (hardcoded or from API)
  const [exchangeRates, setExchangeRates] = useState({ USD: 1500, GHS: 120 });
  const [quickStats, setQuickStats] = useState({ orders: 0, pending: 0, earned: 0 });
  const [sparklineData, setSparklineData] = useState([]);

  // Fetch KYC level
  useEffect(() => {
    if (user) {
      supabase
        .from('users')
        .select('kyc_level')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setKycLevel(data.kyc_level || 1);
        });
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchExchangeRates();
      fetchQuickStats();
      fetchSparklineData();
      fetchGiftPoints();
    }
  }, [user]);

  const fetchExchangeRates = async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/NGN');
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

  const fetchQuickStats = async () => {
    if (!user) return;
    try {
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { count: pendingCount } = await supabase
        .from('withdrawals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'pending');

      const { data: earnedData } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('type', 'bonus')
        .eq('status', 'completed');

      const totalEarned = earnedData?.reduce((sum, t) => sum + t.amount, 0) || 0;

      setQuickStats({
        orders: ordersCount || 0,
        pending: pendingCount || 0,
        earned: totalEarned,
      });
    } catch (error) {
      console.error('Error fetching quick stats:', error);
    }
  };

  const fetchSparklineData = async () => {
    if (!user) return;
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, created_at')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      const dailyData = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayTransactions = transactions?.filter(t => t.created_at.startsWith(dateStr)) || [];
        const dayTotal = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
        dailyData.push({
          date: dateStr,
          balance: dayTotal,
          day: date.toLocaleDateString('en-US', { weekday: 'short' })
        });
      }
      setSparklineData(dailyData);
    } catch (error) {
      console.error('Error fetching sparkline data:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
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
        // Note: gift_points is in the wallet table, but we'll also fetch from gift_point_transactions for accurate total.
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

  const fetchGiftPoints = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('gift_point_transactions')
        .select('amount')
        .eq('user_id', user.id);
      if (!error && data) {
        const total = data.reduce((sum, t) => sum + t.amount, 0);
        setGiftPoints(total);
      }
    } catch (e) {
      console.error('Error fetching gift points:', e);
    }
  };

  // Convert balance based on selected currency
  const getConvertedBalance = () => {
    const totalBalance = balance + bonusBalance;
    switch (selectedCurrency) {
      case 'USD': return totalBalance / exchangeRates.USD;
      case 'GHS': return totalBalance / exchangeRates.GHS;
      case 'Gift Points': return giftPoints; // special case
      default: return totalBalance;
    }
  };

  const getCurrencySymbol = () => {
    switch (selectedCurrency) {
      case 'USD': return '$';
      case 'GHS': return '₵';
      case 'Gift Points': return '🎁';
      default: return '₦';
    }
  };

  const getSparklinePoints = () => {
    if (sparklineData.length === 0) return '';
    const max = Math.max(...sparklineData.map(d => d.balance));
    const min = Math.min(...sparklineData.map(d => d.balance));
    const range = max - min || 1;
    const height = 40;
    const width = 120;
    const step = width / (sparklineData.length - 1);
    return sparklineData.map((d, i) => {
      const x = i * step;
      const y = height - ((d.balance - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');
  };

  // Determine which actions to show based on currency
  const getActions = () => {
    const isKycDone = kycLevel >= 2;
    const actions = [];
    if (selectedCurrency === 'Gift Points') {
      actions.push({ label: 'Redeem', icon: 'fa-gift', href: '/dashboard/redeem-points' });
      return actions;
    }
    // Fiat currencies
    actions.push({ label: 'Withdraw', icon: 'fa-arrow-down', href: '/dashboard/withdraw' });
    actions.push({ label: 'Top Up', icon: 'fa-arrow-up', href: '/dashboard/wallet' }); // fiat top-up
    if (isKycDone) {
      actions.push({ label: 'Convert', icon: 'fa-arrow-right-arrow-left', href: '/dashboard/convert' });
    }
    return actions;
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-text-primary">Loading...</div>;
  if (!user) return null;

  const totalBalance = balance + bonusBalance;
  const actions = getActions();
  const isGiftPoints = selectedCurrency === 'Gift Points';
  const displayBalance = getConvertedBalance();
  const symbol = getCurrencySymbol();

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
              {/* Currency Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-text-muted text-sm">Available Balance</p>
                <div className="flex bg-black/30 rounded-full p-1 border border-border/50">
                  {['NGN', 'USD', 'GHS', 'Gift Points'].map((curr) => (
                    <button
                      key={curr}
                      onClick={() => setSelectedCurrency(curr)}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                        selectedCurrency === curr
                          ? 'bg-orange text-white'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      {curr === 'Gift Points' ? '🎁 Points' : curr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Balance */}
              <p className="text-4xl font-bold mt-2">
                {hideBalance ? '••••••' : `${symbol}${displayBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </p>

              {/* Equivalents (only for fiat) */}
              {!hideBalance && !isGiftPoints && (
                <div className="flex flex-wrap gap-3 mt-1 text-sm text-text-muted">
                  {selectedCurrency !== 'NGN' && <span>≈ ₦{totalBalance.toLocaleString()}</span>}
                  {selectedCurrency !== 'USD' && <><span>•</span><span>≈ ${(totalBalance / exchangeRates.USD).toFixed(2)}</span></>}
                  {selectedCurrency !== 'GHS' && <><span>•</span><span>≈ ₵{(totalBalance / exchangeRates.GHS).toFixed(2)}</span></>}
                </div>
              )}
              {!hideBalance && isGiftPoints && (
                <p className="text-xs text-text-muted mt-1">10 points = ₦1 (or equivalent)</p>
              )}

              {/* Sparkline (only for fiat) */}
              {!hideBalance && !isGiftPoints && sparklineData.length > 0 && (
                <div className="mt-3">
                  <svg width="120" height="40" className="opacity-80">
                    <polyline
                      points={getSparklinePoints()}
                      fill="none"
                      stroke="#FF7300"
                      strokeWidth="2"
                    />
                    <polyline
                      points={`${getSparklinePoints()} ${120},${40}`}
                      fill="rgba(255, 115, 0, 0.1)"
                      stroke="none"
                    />
                  </svg>
                </div>
              )}

              {bonusBalance > 0 && !isGiftPoints && (
                <p className="text-sm text-green-400 mt-1">
                  🎁 Includes ₦{bonusBalance.toLocaleString()} welcome bonus
                </p>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                {actions.map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="glass rounded-2xl p-4 text-center hover:border-orange transition border border-border group"
                  >
                    <div className="w-10 h-10 mx-auto rounded-full bg-orange/10 flex items-center justify-center text-orange text-lg group-hover:scale-110 transition">
                      <i className={`fa-solid ${action.icon}`}></i>
                    </div>
                    <p className="text-sm font-semibold mt-2">{action.label}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="glass rounded-2xl p-4 text-center border border-border">
              <p className="text-text-muted text-xs uppercase tracking-wider">Total Orders</p>
              <p className="text-2xl font-bold">{quickStats.orders}</p>
            </div>
            <div className="glass rounded-2xl p-4 text-center border border-border">
              <p className="text-text-muted text-xs uppercase tracking-wider">Pending</p>
              <p className="text-2xl font-bold text-yellow-400">{quickStats.pending}</p>
            </div>
            <div className="glass rounded-2xl p-4 text-center border border-border">
              <p className="text-text-muted text-xs uppercase tracking-wider">Earned</p>
              <p className="text-2xl font-bold text-green-400">
                {hideBalance ? '••••' : `₦${quickStats.earned.toLocaleString()}`}
              </p>
            </div>
          </div>

          {/* Gift Points Banner (always visible) */}
          <div className="glass rounded-2xl p-4 border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-full bg-orange/10 flex items-center justify-center text-orange text-lg flex-shrink-0">
                <i className="fa-solid fa-gift"></i>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">Gift Points</p>
                  <p className="text-2xl font-bold text-orange">
                    {hideBalance ? '••••' : giftPoints.toLocaleString()}
                  </p>
                </div>
                <div className="w-full bg-black/30 rounded-full h-2 mt-1">
                  <div 
                    className="bg-gradient-to-r from-orange to-purple-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((giftPoints / 10000) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-text-muted text-xs mt-0.5">
                  {giftPoints >= 10000 ? '🎉 Ready to redeem!' : `${10000 - giftPoints} points to minimum redemption`}
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/redeem-points"
              className="border border-orange/30 text-orange hover:bg-orange/10 px-4 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap"
            >
              Redeem →
            </Link>
          </div>

          {/* Products */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">Products</h2>
              <Link href="/dashboard/products" className="text-sm text-orange hover:underline">View All</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/dashboard/sell-gift-card" className="glass rounded-xl p-4 text-center hover:border-orange transition border border-border group">
                <div className="w-10 h-10 mx-auto rounded-full bg-orange/10 flex items-center justify-center text-orange text-xl group-hover:scale-110 transition">
                  <i className="fa-solid fa-gift"></i>
                </div>
                <p className="text-sm font-semibold mt-2">Gift Cards</p>
              </Link>
              <Link href="/dashboard/sell" className="glass rounded-xl p-4 text-center hover:border-orange transition border border-border group">
                <div className="w-10 h-10 mx-auto rounded-full bg-orange/10 flex items-center justify-center text-orange text-xl group-hover:scale-110 transition">
                  <i className="fa-brands fa-bitcoin"></i>
                </div>
                <p className="text-sm font-semibold mt-2">Crypto</p>
              </Link>
              <div className="glass rounded-xl p-4 text-center border border-border opacity-60 relative">
                <div className="w-10 h-10 mx-auto rounded-full bg-orange/10 flex items-center justify-center text-text-muted text-xl">
                  <i className="fa-solid fa-sim-card"></i>
                </div>
                <p className="text-sm font-semibold mt-2">eSIM</p>
                <span className="text-[10px] text-orange">Soon</span>
                <div className="absolute top-2 right-2 text-text-muted text-xs">
                  <i className="fa-solid fa-lock"></i>
                </div>
              </div>
              <div className="glass rounded-xl p-4 text-center border border-border opacity-60 relative">
                <div className="w-10 h-10 mx-auto rounded-full bg-orange/10 flex items-center justify-center text-text-muted text-xl">
                  <i className="fa-solid fa-file-invoice"></i>
                </div>
                <p className="text-sm font-semibold mt-2">Bills</p>
                <span className="text-[10px] text-orange">Soon</span>
                <div className="absolute top-2 right-2 text-text-muted text-xs">
                  <i className="fa-solid fa-lock"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="glass rounded-2xl p-6 border border-border">
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
                  <div key={tx.id} className="flex justify-between items-center border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="flex-1 min-w-0">
                      <p className="capitalize font-medium text-sm">{tx.type?.replace('_', ' ') || 'Transaction'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-text-muted text-xs">{new Date(tx.created_at).toLocaleDateString()}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          tx.status === 'completed' ? 'bg-green-400/20 text-green-400' :
                          tx.status === 'pending' ? 'bg-yellow-400/20 text-yellow-400' :
                          'bg-red-400/20 text-red-400'
                        }`}>
                          {tx.status || 'pending'}
                        </span>
                      </div>
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
    </>
  );
}
