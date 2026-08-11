import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../_app';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';
import Head from 'next/head';
import RateCalculator from '../../components/calculator/RateCalculator';

export default function DashboardOverview() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [balance, setBalance] = useState(0);
  const [bonusBalance, setBonusBalance] = useState(0);
  const [usdBalance, setUsdBalance] = useState(0);
  const [giftPoints, setGiftPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hideBalance, setHideBalance] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('NGN');
  const [kycLevel, setKycLevel] = useState(1);
  const [exchangeRates, setExchangeRates] = useState({ USD: 1500 });
  const [quickStats, setQuickStats] = useState({ orders: 0, pending: 0, earned: 0 });
  const [sparklineData, setSparklineData] = useState([]);
  const [username, setUsername] = useState('');

  // Fetch KYC level and username
  useEffect(() => {
    if (user) {
      const metaUsername = user?.user_metadata?.username;
      if (metaUsername) {
        setUsername(metaUsername);
      } else {
        supabase
          .from('users')
          .select('username')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            if (data?.username) setUsername(data.username);
          });
      }

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
        .select('balance, bonus_balance, usd_balance, gift_points')
        .eq('user_id', user.id)
        .single();

      if (wallet) {
        setBalance(wallet.balance || 0);
        setBonusBalance(wallet.bonus_balance || 0);
        setUsdBalance(wallet.usd_balance || 0);
      }
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

  const getConvertedBalance = () => {
    switch (selectedCurrency) {
      case 'USD': return usdBalance;
      case 'Gift Points': return giftPoints;
      default: return balance + bonusBalance;
    }
  };

  const getCurrencySymbol = () => {
    switch (selectedCurrency) {
      case 'USD': return '$';
      case 'Gift Points': return '🎁';
      default: return '₦';
    }
  };

  const getSparklinePoints = () => {
    if (sparklineData.length === 0) return '';
    const max = Math.max(...sparklineData.map(d => d.balance));
    const min = Math.min(...sparklineData.map(d => d.balance));
    const range = max - min || 1;
    const height = 50;
    const width = 180;
    const step = width / (sparklineData.length - 1);
    return sparklineData.map((d, i) => {
      const x = i * step;
      const y = height - ((d.balance - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');
  };

  const actions = [
    { label: 'Withdraw', icon: 'fa-arrow-down', href: '/dashboard/withdraw' },
    { label: 'Deposit', icon: 'fa-arrow-up', href: '/dashboard/deposit' },
    { label: 'Convert', icon: 'fa-arrow-right-arrow-left', href: '/dashboard/convert' },
    { label: 'Top Up', icon: 'fa-wallet', href: '/dashboard/wallet' },
  ];

  if (loading) return <div className="flex items-center justify-center min-h-screen text-text-primary">Loading...</div>;
  if (!user) return null;

  const totalBalance = balance + bonusBalance;
  const isGiftPoints = selectedCurrency === 'Gift Points';
  const displayBalance = getConvertedBalance();
  const symbol = getCurrencySymbol();
  const displayName = username || user?.email?.split('@')[0] || 'User';

  return (
    <>
      <Head>
        <title>Dashboard · KJ Exchange</title>
      </Head>
      <DashboardLayout>
        <div className="max-w-2xl mx-auto px-4 py-4 pb-24 space-y-6">
          {/* Welcome & Hide Balance */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-text-muted text-sm">Hello {displayName}, 👋</p>
            </div>
            <button
              onClick={() => setHideBalance(!hideBalance)}
              className="flex items-center gap-2 text-text-muted hover:text-text-primary transition text-sm px-4 py-2 rounded-full border border-border hover:border-orange"
            >
              <i className={`fa-regular ${hideBalance ? 'fa-eye' : 'fa-eye-slash'}`}></i>
              {hideBalance ? 'Show' : 'Hide'}
            </button>
          </div>

          {/* Balance Card */}
          <div className="bg-gradient-to-br from-purple-900/40 via-orange-900/20 to-purple-900/40 rounded-2xl p-6 border border-border relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <p className="text-text-muted text-sm font-medium">Available Balance</p>
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

              {!hideBalance && !isGiftPoints && sparklineData.length > 0 && (
                <div className="mt-4">
                  <svg width="200" height="50" className="opacity-80 w-full">
                    <polyline
                      points={getSparklinePoints()}
                      fill="none"
                      stroke="#FF7300"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <polyline
                      points={`${getSparklinePoints()} 200,50`}
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

              <div className="grid grid-cols-4 gap-3 mt-6">
                {actions.map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="glass rounded-2xl p-3 text-center hover:border-orange transition border border-border group"
                  >
                    <div className="w-10 h-10 mx-auto rounded-full bg-orange/10 flex items-center justify-center text-orange text-lg group-hover:scale-110 transition">
                      <i className={`fa-solid ${action.icon}`}></i>
                    </div>
                    <p className="text-xs font-semibold mt-1.5">{action.label}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass rounded-2xl p-4 text-center border border-border">
              <div className="flex items-center justify-center gap-2 text-text-muted text-xs uppercase tracking-wider mb-1">
                <i className="fa-regular fa-clipboard text-orange"></i>
                <span>Orders</span>
              </div>
              <p className="text-2xl font-bold">{quickStats.orders}</p>
            </div>
            <div className="glass rounded-2xl p-4 text-center border border-border">
              <div className="flex items-center justify-center gap-2 text-text-muted text-xs uppercase tracking-wider mb-1">
                <i className="fa-regular fa-clock text-yellow-400"></i>
                <span>Pending</span>
              </div>
              <p className="text-2xl font-bold text-yellow-400">{quickStats.pending}</p>
            </div>
            <div className="glass rounded-2xl p-4 text-center border border-border">
              <div className="flex items-center justify-center gap-2 text-text-muted text-xs uppercase tracking-wider mb-1">
                <i className="fa-regular fa-circle-check text-green-400"></i>
                <span>Earned</span>
              </div>
              <p className="text-2xl font-bold text-green-400">
                {hideBalance ? '••••' : `${getCurrencySymbol()}${quickStats.earned.toLocaleString()}`}
              </p>
            </div>
            <div className="glass rounded-2xl p-4 text-center border border-border">
              <div className="flex items-center justify-center gap-2 text-text-muted text-xs uppercase tracking-wider mb-1">
                <i className="fa-solid fa-gift text-orange"></i>
                <span>Points</span>
              </div>
              <p className="text-2xl font-bold text-orange">
                {hideBalance ? '••••' : giftPoints.toLocaleString()}
              </p>
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
              href="/dashboard/referral"
              className="border border-orange/30 text-orange hover:bg-orange/10 px-4 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap"
            >
              Redeem →
            </Link>
          </div>

          {/* Rate Calculator (Full Widget) */}
          <RateCalculator />

          {/* Products Grid (6 cards — NO Rate Calculator card) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">Products</h2>
              <Link href="/dashboard/products" className="text-sm text-orange hover:underline">View All</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                <p className="text-sm font-semibold mt-2">Sell Crypto</p>
              </Link>
              <Link href="/dashboard/pay-bills" className="glass rounded-xl p-4 text-center hover:border-orange transition border border-border group">
                <div className="w-10 h-10 mx-auto rounded-full bg-orange/10 flex items-center justify-center text-orange text-xl group-hover:scale-110 transition">
                  <i className="fa-credit-card"></i>
                </div>
                <p className="text-sm font-semibold mt-2">Pay Bills</p>
              </Link>
              <Link href="/dashboard/buy-airtime" className="glass rounded-xl p-4 text-center hover:border-orange transition border border-border group">
                <div className="w-10 h-10 mx-auto rounded-full bg-orange/10 flex items-center justify-center text-orange text-xl group-hover:scale-110 transition">
                  <i className="fa-solid fa-wifi"></i>
                </div>
                <p className="text-sm font-semibold mt-2">Airtime & Data</p>
              </Link>
              <Link href="/rates" className="glass rounded-xl p-4 text-center hover:border-orange transition border border-border group">
                <div className="w-10 h-10 mx-auto rounded-full bg-orange/10 flex items-center justify-center text-orange text-xl group-hover:scale-110 transition">
                  <i className="fa-solid fa-calculator"></i>
                </div>
                <p className="text-sm font-semibold mt-2">Rate Calculator</p>
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
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
