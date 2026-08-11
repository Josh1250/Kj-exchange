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

      // ===== CREDIT BUSINESS WALLET (SPREAD PROFIT) =====
      // Profit = amount * spread * marketRate (the extra NGN kept)
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
        } else {
          console.warn('Business wallet not found. Please create business_wallets table.');
        }
      }

      setLastPayout(payout);
      setLastSoldCoin(selectedCoin.id);
      setShowSuccessModal(true);
      setAvailableBalance(availableBalance - amount);
      setUsdAmount('');

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
          <div className="flex items-center gap-3 mb-6">
            <Link href="/dashboard" className="text-text-muted hover:text-text-primary transition group">
              <i className="fa-solid fa-arrow-left text-sm group-hover:-translate-x-1 transition-transform"></i>
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <i className="fa-solid fa-arrow-up text-orange"></i>
              Sell Crypto
            </h1>
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {filteredCoins.map((coin) => {
              const isSelected = selectedCoin.id === coin.id;
              const price = coinPrices[coin.id] || 0;

              return (
                <button
                  key={coin.id}
                  onClick={() => {
                    setSelectedCoin(coin);
                    setUsdAmount('');
                    setError('');
                  }}
                  className={`p-4 rounded-2xl border transition-all duration-200 text-left ${
                    isSelected
                      ? 'border-orange bg-orange/10 shadow-lg shadow-orange/10 scale-[1.02]'
                      : 'border-border bg-black/20 hover:border-orange/50 hover:bg-black/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <i className={`${coin.icon} text-xl`} style={{ color: coin.color }}></i>
                    <span className="font-bold text-sm">{coin.id}</span>
                  </div>
                  <p className="text-text-muted text-xs mt-0.5">{coin.name}</p>
                  <p className="text-sm font-semibold mt-1">${price.toFixed(2)}</p>
                </button>
              );
            })}
          </div>

          <div className="glass rounded-2xl p-5 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <i className={`${selectedCoin.icon} text-2xl`} style={{ color: selectedCoin.color }}></i>
              <div>
                <h2 className="text-xl font-bold">Sell {selectedCoin.name}</h2>
                <p className="text-text-muted text-sm">1 {selectedCoin.id} ≈ ${priceUsd.toFixed(2)}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Amount ({selectedCoin.id})</label>
              <div className="relative">
                <input
                  type="number"
                  value={usdAmount}
                  onChange={(e) => setUsdAmount(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-xl px-5 py-4 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 text-2xl font-bold placeholder:text-text-muted/50"
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted text-sm font-semibold">
                  {selectedCoin.id}
                </div>
              </div>

              <div className="flex gap-2 mt-3 flex-wrap">
                {quickAmounts.map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setQuickAmount(pct)}
                    className="px-4 py-1.5 rounded-full text-xs font-medium transition border border-border hover:border-orange/50 hover:text-orange"
                  >
                    {pct}%
                  </button>
                ))}
                <button
                  onClick={setSellAll}
                  className="px-4 py-1.5 rounded-full text-xs font-medium transition border border-orange/30 text-orange hover:bg-orange/10"
                >
                  Sell All
                </button>
              </div>

              <p className="text-text-muted text-xs mt-2">Minimum sell: $1.00</p>
            </div>

            {showRate && (
              <div className="mt-4 bg-black/30 rounded-xl p-4 border border-border/50">
                <div className="flex justify-between items-center">
                  <span className="text-text-muted text-sm">Rate ({tierLabel})</span>
                  <span className="font-bold text-green-400">₦{rate.toFixed(2)} / $</span>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/50">
                  <span className="text-text-muted text-sm">You Receive</span>
                  <span className="text-2xl font-bold text-green-400">
                    ₦{payout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 bg-red-400/10 border border-red-400/20 rounded-xl p-3 text-red-400 text-sm flex items-start gap-2">
                <i className="fa-solid fa-circle-exclamation mt-0.5"></i>
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleContinue}
              disabled={submitting || !usdAmount || parseFloat(usdAmount) <= 0}
              className="w-full mt-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-4 rounded-xl hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-orange/20"
            >
              <i className="fa-solid fa-paper-plane"></i> Continue ➤
            </button>
          </div>
        </div>
      </DashboardLayout>

      {/* Agreement Modal */}
      {showAgreement && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-2xl max-w-md w-full p-6 border border-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <i className="fa-solid fa-triangle-exclamation text-orange"></i>
                Before you sell...
              </h2>
              <button
                onClick={() => setShowAgreement(false)}
                className="text-text-muted hover:text-text-primary transition text-xl"
              >
                <i className="fa-regular fa-xmark"></i>
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <i className="fa-regular fa-circle-check text-green-400 mt-0.5"></i>
                <div>
                  <p className="font-semibold">Minimum sell is $1.00</p>
                  <p className="text-text-muted text-xs">Amounts below $1.00 will not be processed.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <i className="fa-solid fa-shield text-orange mt-0.5"></i>
                <div>
                  <p className="font-semibold">Instant credit</p>
                  <p className="text-text-muted text-xs">Your Naira wallet will be credited immediately.</p>
                </div>
              </div>
              <div className="bg-black/20 rounded-xl p-3 border border-border text-text-muted text-xs">
                By proceeding, you agree to these terms.
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAgreement(false)}
                className="flex-1 border border-border text-text-primary px-4 py-2.5 rounded-xl hover:border-orange transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSell}
                className="flex-1 bg-orange text-white font-bold py-2.5 rounded-xl hover:bg-orange-600 transition flex items-center justify-center gap-2"
              >
                <i className="fa-regular fa-check-circle"></i> I Agree
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-2xl max-w-md w-full p-6 border border-border text-center">
            <div className="w-16 h-16 rounded-full bg-green-400/20 flex items-center justify-center text-green-400 text-3xl mx-auto">
              <i className="fa-regular fa-circle-check"></i>
            </div>
            <h2 className="text-2xl font-bold mt-4">Sale Completed! 🎉</h2>
            <p className="text-text-muted mt-2">
              You have successfully sold {lastSoldCoin} for
            </p>
            <p className="text-3xl font-bold text-green-400 mt-1">
              ₦{lastPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-text-muted text-xs mt-2">
              Funds have been credited to your Naira wallet.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="flex-1 border border-border text-text-primary px-4 py-2.5 rounded-xl hover:border-orange transition"
              >
                Close
              </button>
              <Link
                href="/dashboard/wallet"
                className="flex-1 bg-orange text-white font-bold py-2.5 rounded-xl hover:bg-orange-600 transition text-center"
              >
                View Wallet
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
