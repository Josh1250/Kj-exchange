import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../_app';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../lib/supabaseClient';
import Head from 'next/head';
import Link from 'next/link';

const COINS = [
  { id: 'BTC', name: 'Bitcoin', icon: 'fa-brands fa-bitcoin', color: '#f7931a' },
  { id: 'ETH', name: 'Ethereum', icon: 'fa-brands fa-ethereum', color: '#627eea' },
  { id: 'USDT', name: 'Tether', icon: 'fa-solid fa-coins', color: '#26a17b' },
  { id: 'SOL', name: 'Solana', icon: 'fa-solid fa-bolt', color: '#9945FF' },
  { id: 'BNB', name: 'BNB', icon: 'fa-solid fa-cube', color: '#F3BA2F' },
  { id: 'TRX', name: 'Tron', icon: 'fa-solid fa-bolt', color: '#EF0027' },
  { id: 'LTC', name: 'Litecoin', icon: 'fa-brands fa-litecoin', color: '#345d9d' },
  { id: 'BCH', name: 'Bitcoin Cash', icon: 'fa-brands fa-bitcoin', color: '#8dc351' },
];

// ===== SPREAD CONFIGURATION =====
const SPREAD_CONFIG = {
  BTC: { low: 0.069, high: 0.056 },
  ETH: { low: 0.069, high: 0.056 },
  USDT: { low: 0.052, high: 0.045 },
  SOL: { low: 0.069, high: 0.056 },
  BNB: { low: 0.069, high: 0.056 },
  TRX: { low: 0.076, high: 0.056 },
  LTC: { low: 0.069, high: 0.056 },
  BCH: { low: 0.069, high: 0.056 },
};

const FEE_CONFIG = {
  BTC: 0,
  ETH: 0,
  USDT: 0,
  SOL: 0,
  BNB: 0,
  TRX: 0,
  LTC: 0,
  BCH: 0,
};

const getSpread = (coinId, amount) => {
  const config = SPREAD_CONFIG[coinId];
  if (!config) return 0.06;
  return amount < 500 ? config.low : config.high;
};

const getFee = (coinId) => FEE_CONFIG[coinId] || 0;

export default function Sell() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [selectedCoin, setSelectedCoin] = useState(COINS[0]);
  const [usdAmount, setUsdAmount] = useState('');
  const [availableBalance, setAvailableBalance] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [showAgreement, setShowAgreement] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastPayout, setLastPayout] = useState(0);
  const [lastSoldCoin, setLastSoldCoin] = useState('');

  const [ngnRate, setNgnRate] = useState(1389);
  const [coinPrices, setCoinPrices] = useState({});
  const [isLoadingRates, setIsLoadingRates] = useState(true);
  const [marketRate, setMarketRate] = useState(1389);

  // ===== CRYPTO HISTORY =====
  const [cryptoHistory, setCryptoHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setIsLoadingRates(true);

        let ngn = 1389;
        try {
          const res = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=NGN');
          const data = await res.json();
          if (data.rates?.NGN) ngn = data.rates.NGN;
        } catch (e) {
          try {
            const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=NGN');
            const data = await res.json();
            if (data.rates?.NGN) ngn = data.rates.NGN;
          } catch (e2) {}
        }
        setNgnRate(ngn);
        setMarketRate(ngn);

        const cryptoRes = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,solana,binancecoin,tron,litecoin,bitcoin-cash&vs_currencies=usd'
        );
        const cryptoData = await cryptoRes.json();

        setCoinPrices({
          BTC: cryptoData.bitcoin?.usd || 0,
          ETH: cryptoData.ethereum?.usd || 0,
          USDT: cryptoData.tether?.usd || 1,
          SOL: cryptoData.solana?.usd || 0,
          BNB: cryptoData.binancecoin?.usd || 0,
          TRX: cryptoData.tron?.usd || 0,
          LTC: cryptoData.litecoin?.usd || 0,
          BCH: cryptoData['bitcoin-cash']?.usd || 0,
        });

        const { data: walletData, error: walletError } = await supabase
          .from('crypto_balances')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!walletError && walletData) {
          const balance = walletData[selectedCoin.id?.toLowerCase()] || 0;
          setAvailableBalance(balance);
        } else {
          setAvailableBalance(0);
        }

        // Fetch crypto history
        await fetchCryptoHistory();

      } catch (error) {
        console.warn('⚠️ Data fetch failed', error);
      } finally {
        setIsLoadingRates(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [user, selectedCoin]);

  // ===== Fetch Crypto History =====
  const fetchCryptoHistory = async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'crypto')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setCryptoHistory(data);
      }
    } catch (err) {
      console.error('Error fetching crypto history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const calculatePayout = (coinId, amount) => {
    const parsed = parseFloat(amount) || 0;
    if (parsed <= 0) return { rate: 0, fee: 0, netUsd: 0, payout: 0, spread: 0 };

    const spread = getSpread(coinId, parsed);
    const rate = marketRate * (1 - spread);
    const feePercent = getFee(coinId);
    const fee = parsed * feePercent;
    const netUsd = parsed - fee;
    const payout = netUsd * rate;

    return { rate, fee, netUsd, payout, spread };
  };

  const setQuickAmount = (pct) => {
    const amount = (availableBalance * pct) / 100;
    setUsdAmount(amount.toFixed(2));
  };

  const setSellAll = () => {
    setUsdAmount(availableBalance.toFixed(2));
  };

  const handleContinue = () => {
    const amount = parseFloat(usdAmount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (amount > availableBalance) {
      setError(`Insufficient balance. You have ${availableBalance.toFixed(6)} ${selectedCoin.id}`);
      return;
    }
    setError('');
    setShowAgreement(true);
  };

  const handleSell = async () => {
    setShowAgreement(false);
    setSubmitting(true);
    setError('');

    const amount = parseFloat(usdAmount);
    const { rate, fee, netUsd, payout, spread } = calculatePayout(selectedCoin.id, amount);

    try {
      const response = await fetch('/api/crypto/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          coin: selectedCoin.id,
          amountUsd: amount,
          rate,
          payout,
          network: 'Default',
          spread,
          fee,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to sell');
      }

      // Credit business wallet
      const profitInNGN = amount * spread * marketRate;
      if (profitInNGN > 0) {
        const { data: bizWallet, error: bizError } = await supabase
          .from('business_wallets')
          .select('balance')
          .eq('currency', 'NGN')
          .single();

        if (!bizError && bizWallet) {
          const newBizBalance = (bizWallet.balance || 0) + profitInNGN;
          await supabase
            .from('business_wallets')
            .update({ balance: newBizBalance })
            .eq('currency', 'NGN');
        }
      }

      setLastPayout(payout);
      setLastSoldCoin(selectedCoin.id);
      setShowSuccessModal(true);
      setAvailableBalance(availableBalance - amount);
      setUsdAmount('');

      // Refresh crypto history
      await fetchCryptoHistory();

    } catch (err) {
      setError(err.message || 'Failed to sell. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCoins = COINS.filter((coin) =>
    coin.name.toLowerCase().includes(search.toLowerCase()) ||
    coin.id.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center min-h-screen text-text-primary">Loading...</div>;
  if (!user) {
    router.push('/auth/login');
    return null;
  }

  const amount = parseFloat(usdAmount) || 0;
  const { rate, fee, netUsd, payout, spread } = calculatePayout(selectedCoin.id, amount);
  const showRate = amount > 0;
  const priceUsd = coinPrices[selectedCoin.id] || 0;
  const balanceInUsd = availableBalance * priceUsd;

  const quickAmounts = [10, 25, 50, 100];
  const tierLabel = amount < 500 ? 'Under $500' : '$500+';

  return (
    <>
      <Head>
        <title>Sell Crypto · KJ Exchange</title>
      </Head>
      <DashboardLayout>
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
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-orange/10 flex items-center justify-center text-orange flex-shrink-0">
              <i className="fa-solid fa-arrow-up text-lg"></i>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Sell Crypto</h1>
              <p className="text-text-muted text-sm">Sell your crypto for Naira instantly</p>
            </div>
          </div>

          <div className="glass rounded-2xl p-4 border border-border mb-5">
            <p className="text-text-muted text-sm">Available Balance</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold">{availableBalance.toFixed(6)} {selectedCoin.id}</p>
                <p className="text-text-muted text-sm">≈ ${balanceInUsd.toFixed(2)} USD</p>
              </div>
              <i className={`${selectedCoin.icon} text-3xl opacity-30`} style={{ color: selectedCoin.color }}></i>
            </div>
          </div>

          <div className="relative mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/40 border border-border rounded-xl px-4 py-3.5 pl-12 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 text-base"
              placeholder="Search supported asset"
            />
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"></i>
          </div>

          <
