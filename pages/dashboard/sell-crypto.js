import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../_app';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../lib/supabaseClient';
import Head from 'next/head';
import Link from 'next/link';

// ============================================
// CONFIGURATION
// ============================================

const COINS = [
  { id: 'BTC', name: 'Bitcoin', icon: 'fa-brands fa-bitcoin', color: '#f7931a', networks: ['Bitcoin'] },
  { id: 'ETH', name: 'Ethereum', icon: 'fa-brands fa-ethereum', color: '#627eea', networks: ['Ethereum'] },
  {
    id: 'USDT',
    name: 'Tether',
    icon: 'fa-solid fa-coins',
    color: '#26a17b',
    networks: ['TRC-20', 'ERC-20', 'BEP-20'],
    defaultNetwork: 'TRC-20',
  },
  { id: 'SOL', name: 'Solana', icon: 'fa-solid fa-bolt', color: '#9945FF', networks: ['Solana'] },
  { id: 'BNB', name: 'BNB', icon: 'fa-solid fa-cube', color: '#F3BA2F', networks: ['BSC'] },
  { id: 'TRX', name: 'Tron', icon: 'fa-solid fa-bolt', color: '#EF0027', networks: ['Tron'] },
  { id: 'LTC', name: 'Litecoin', icon: 'fa-brands fa-litecoin', color: '#345d9d', networks: ['Litecoin'] },
  { id: 'BCH', name: 'Bitcoin Cash', icon: 'fa-brands fa-bitcoin', color: '#8dc351', networks: ['Bitcoin Cash'] },
];

const SPREADS = {
  BTC: { low: 0.0286, high: 0.0142, fee: 0.01 },
  ETH: { low: 0.0287, high: 0.0143, fee: 0.01 },
  USDT: { low: 0.0106, high: 0.0034, fee: 0 },
  SOL: { low: 0.0286, high: 0.0142, fee: 0.01 },
  BNB: { low: 0.0286, high: 0.0142, fee: 0.01 },
  TRX: { low: 0.0358, high: 0.0142, fee: 0.01 },
  LTC: { low: 0.0286, high: 0.0142, fee: 0.01 },
  BCH: { low: 0.1079, high: 0.0143, fee: 0.01 },
};

export default function SellCrypto() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [selectedCoin, setSelectedCoin] = useState(COINS[0]);
  const [selectedNetwork, setSelectedNetwork] = useState(COINS[0].networks[0]);
  const [usdAmount, setUsdAmount] = useState('');
  const [step, setStep] = useState('select'); // 'select' | 'deposit'
  const [order, setOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  // Agreement modal
  const [showAgreement, setShowAgreement] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // Rates
  const [ngnRate, setNgnRate] = useState(1389);
  const [coinPrices, setCoinPrices] = useState({});
  const [rates, setRates] = useState({});
  const [isLoadingRates, setIsLoadingRates] = useState(true);

  // Fetch rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        setIsLoadingRates(true);
        const res = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=NGN');
        const data = await res.json();
        const ngn = data.rates?.NGN || 1389;
        setNgnRate(ngn);

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

        const calculatedRates = {};
        for (const coin of COINS) {
          const spread = SPREADS[coin.id];
          if (spread) {
            const lowRate = ngn * (1 - spread.low);
            const highRate = ngn * (1 - spread.high);
            calculatedRates[coin.id] = { low: lowRate, high: highRate };
          }
        }
        setRates(calculatedRates);
      } catch (error) {
        console.warn('⚠️ Rate fetch failed, using fallback', error);
        setNgnRate(1389);
        setCoinPrices({
          BTC: 67000,
          ETH: 3500,
          USDT: 1,
          SOL: 180,
          BNB: 600,
          TRX: 0.12,
          LTC: 85,
          BCH: 350,
        });
        const fallbackRates = {};
        for (const coin of COINS) {
          const spread = SPREADS[coin.id];
          if (spread) {
            fallbackRates[coin.id] = { low: 1389 * (1 - spread.low), high: 1389 * (1 - spread.high) };
          }
        }
        setRates(fallbackRates);
      } finally {
        setIsLoadingRates(false);
      }
    };

    fetchRates();
    const interval = setInterval(fetchRates, 60000);
    return () => clearInterval(interval);
  }, []);

  // Helpers
  const getRateForCoin = (coinId, amount) => {
    const rate = rates[coinId];
    if (!rate) return 0;
    const parsed = parseFloat(amount) || 0;
    return parsed <= 500 ? rate.low : rate.high;
  };

  const calculatePayout = (coinId, amount) => {
    const parsed = parseFloat(amount) || 0;
    if (parsed <= 0) return { rate: 0, fee: 0, netUsd: 0, payout: 0 };

    const rate = getRateForCoin(coinId, parsed);
    const feePercent = SPREADS[coinId]?.fee || 0;
    const fee = parsed * feePercent;
    const netUsd = parsed - fee;
    const payout = netUsd * rate;

    return { rate, fee, netUsd, payout };
  };

  // Quick amount buttons
  const setQuickAmount = (pct) => {
    const maxAmount = 1000;
    const amount = (maxAmount * pct) / 100;
    setUsdAmount(amount.toFixed(2));
  };

  const setSellAll = () => {
    setUsdAmount('1000');
  };

  // Handle "I agree" → generate address
  const handleAgreeAndGenerate = async () => {
    setAgreed(true);
    setShowAgreement(false);
    await generateAddress();
  };

  // Generate address
  const generateAddress = async () => {
    const amount = parseFloat(usdAmount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (amount < 1) {
      setError('Minimum amount is $1.00');
      return;
    }

    setLoadingOrder(true);
    setError('');
    setSuccess('');

    const { rate, fee, netUsd, payout } = calculatePayout(selectedCoin.id, amount);

    try {
      const response = await fetch('/api/crypto/generate-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          coin: selectedCoin.id,
          network: selectedNetwork,
          usdAmount: amount,
          rate,
          payout,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate address');
      }

      setOrder(data);
      setStep('deposit');
      setSuccess('✅ Address generated! Send crypto to the address below.');
    } catch (err) {
      setError(err.message || 'Failed to generate address. Please try again.');
    } finally {
      setLoadingOrder(false);
    }
  };

  // Handle "Continue" click → show agreement modal
  const handleContinueClick = () => {
    const amount = parseFloat(usdAmount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (amount < 1) {
      setError('Minimum amount is $1.00');
      return;
    }
    setShowAgreement(true);
    setError('');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('✅ Address copied to clipboard!');
  };

  const handleReset = () => {
    setStep('select');
    setOrder(null);
    setUsdAmount('');
    setError('');
    setSuccess('');
    setAgreed(false);
  };

  const filteredCoins = COINS.filter((coin) =>
    coin.name.toLowerCase().includes(search.toLowerCase()) ||
    coin.id.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div>Loading...</div>;
  if (!user) {
    router.push('/auth/login');
    return null;
  }

  const amount = parseFloat(usdAmount) || 0;
  const { rate, fee, netUsd, payout } = calculatePayout(selectedCoin.id, amount);
  const showRate = amount > 0;

  return (
    <>
      <Head>
        <title>Sell Crypto · KJ Exchange</title>
      </Head>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            <Link
              href="/dashboard"
              className="text-text-muted hover:text-text-primary transition group"
            >
              <i className="fa-solid fa-arrow-left text-sm group-hover:-translate-x-1 transition-transform"></i>
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <i className="fa-solid fa-arrow-trend-up text-orange"></i>
              Sell Crypto
            </h1>
          </div>

          {step === 'select' ? (
            // ============================================
            // SELECT ASSET + AMOUNT
            // ============================================
            <div className="space-y-6">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 pl-12 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20"
                  placeholder="Search supported asset"
                />
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"></i>
              </div>

              {/* Asset Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {filteredCoins.map((coin) => {
                  const isSelected = selectedCoin.id === coin.id;
                  const price = coinPrices[coin.id] || 0;
                  const coinRate = rates[coin.id]?.low || 0;

                  return (
                    <button
                      key={coin.id}
                      onClick={() => {
                        setSelectedCoin(coin);
                        setSelectedNetwork(coin.networks[0]);
                        setUsdAmount('');
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
                      <p className="text-text-muted text-xs mt-1">{coin.name}</p>
                      <p className="text-sm font-semibold mt-1">${price.toFixed(2)}</p>
                      <p className="text-xs text-text-muted">₦{coinRate.toFixed(0)}/$</p>
                    </button>
                  );
                })}
              </div>

              {/* Coin Detail */}
              <div className="glass rounded-2xl p-6 border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <i className={`${selectedCoin.icon} text-2xl`} style={{ color: selectedCoin.color }}></i>
                  <div>
                    <h2 className="text-xl font-bold">Sell {selectedCoin.name}</h2>
                    <p className="text-text-muted text-sm">{selectedCoin.id}</p>
                  </div>
                </div>

                {/* Network Selection */}
                {selectedCoin.networks.length > 1 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                      Select Network
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {selectedCoin.networks.map((net) => (
                        <button
                          key={net}
                          onClick={() => setSelectedNetwork(net)}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                            selectedNetwork === net
                              ? 'bg-orange text-white shadow-lg shadow-orange/20'
                              : 'bg-black/20 border border-border text-text-muted hover:border-orange/50'
                          }`}
                        >
                          {net}
                        </button>
                      ))}
                    </div>
                    {selectedCoin.id === 'USDT' && selectedNetwork === 'TRC-20' && (
                      <p className="text-xs text-green-400 mt-1">✅ Recommended — lowest fees</p>
                    )}
                  </div>
                )}

                {/* Rate Display – Only show if amount > 0 */}
                {showRate && (
                  <div className="bg-black/20 rounded-xl p-4 mb-4 border border-border/50">
                    <div className="flex justify-between items-center">
                      <span className="text-text-muted text-sm">Rate</span>
                      <span className="font-bold text-green-400">
                        1 USD = ₦{rate.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-text-muted text-sm">Fee</span>
                      <span className="text-text-muted text-sm">
                        {SPREADS[selectedCoin.id]?.fee === 0 ? '0%' : '1%'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Amount (USD)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={usdAmount}
                      onChange={(e) => setUsdAmount(e.target.value)}
                      className="w-full bg-black/40 border border-border rounded-xl px-5 py-4 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 text-2xl font-bold placeholder:text-text-muted/50"
                      placeholder="0.00"
                      min="1"
                      step="0.01"
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted text-sm font-semibold">
                      USD
                    </div>
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {[10, 25, 50, 100].map((pct) => (
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

                  <p className="text-text-muted text-xs mt-2">
                    Minimum sell is $1.00
                  </p>
                </div>

                {/* You Receive – Only show if amount > 0 */}
                {showRate && (
                  <div className="mt-4 bg-orange/5 border border-orange/20 rounded-xl p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-text-muted text-sm">You Receive</span>
                      <span className="text-2xl font-bold text-green-400">
                        ₦{payout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    {fee > 0 && (
                      <div className="flex justify-between items-center mt-1 text-xs text-text-muted">
                        <span>Fee deducted</span>
                        <span>-${fee.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <div className="mt-4 bg-red-400/10 border border-red-400/20 rounded-xl p-3 text-red-400 text-sm flex items-start gap-2">
                    <i className="fa-solid fa-circle-exclamation mt-0.5"></i>
                    <span>{error}</span>
                  </div>
                )}

                <button
                  onClick={handleContinueClick}
                  disabled={loadingOrder || !usdAmount || parseFloat(usdAmount) <= 0}
                  className="w-full mt-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-4 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-orange/20"
                >
                  <i className="fa-solid fa-paper-plane"></i> Continue ➤
                </button>
              </div>
            </div>
          ) : (
            // ============================================
            // DEPOSIT ADDRESS
            // ============================================
            <div className="space-y-6">
              <div className="glass rounded-2xl p-6 border border-border">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-green-400/10 flex items-center justify-center text-green-400">
                    <i className="fa-regular fa-circle-check"></i>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Send {selectedCoin.name}</h2>
                    <p className="text-text-muted text-sm">Order #{order?.orderId}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-black/20 rounded-xl p-4 border border-border">
                    <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Network</p>
                    <p className="font-bold">{selectedNetwork}</p>
                  </div>

                  <div className="bg-black/20 rounded-xl p-4 border border-border">
                    <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Wallet Address</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm break-all flex-1 text-orange">
                        {order?.address || 'Loading...'}
                      </p>
                      <button
                        onClick={() => copyToClipboard(order?.address)}
                        className="bg-orange/20 hover:bg-orange/30 text-orange px-3 py-1.5 rounded-lg text-sm transition whitespace-nowrap"
                      >
                        <i className="fa-regular fa-copy mr-1"></i>Copy
                      </button>
                    </div>
                  </div>

                  <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-3 text-yellow-400 text-sm flex items-start gap-2">
                    <i className="fa-solid fa-clock mt-0.5"></i>
                    <span>
                      Send exactly the amount you specified. Your wallet will be credited within 5–15 minutes after confirmation.
                    </span>
                  </div>

                  {selectedCoin.id === 'USDT' && (
                    <div className="bg-red-400/10 border border-red-400/20 rounded-xl p-3 text-red-400 text-sm flex items-start gap-2">
                      <i className="fa-solid fa-triangle-exclamation mt-0.5"></i>
                      <span>Send USDT only via {selectedNetwork} network.</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleReset}
                    className="flex-1 border border-border text-text-primary px-4 py-2.5 rounded-xl hover:border-orange transition flex items-center justify-center gap-2"
                  >
                    <i className="fa-solid fa-arrow-left"></i> Back
                  </button>
                  <Link
                    href="/dashboard/orders"
                    className="flex-1 bg-orange text-white font-bold py-2.5 rounded-xl hover:bg-orange-600 transition text-center flex items-center justify-center gap-2"
                  >
                    <i className="fa-solid fa-list"></i> View Orders
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>

      {/* ===== Agreement Modal ===== */}
      {showAgreement && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-2xl max-w-md w-full p-6 border border-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <i className="fa-solid fa-triangle-exclamation text-orange"></i>
                Before you deposit...
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
                  <p className="font-semibold">Minimum deposit is $1.00</p>
                  <p className="text-text-muted text-xs">
                    Lower amounts may not be processed.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <i className="fa-solid fa-clock text-yellow-400 mt-0.5"></i>
                <div>
                  <p className="font-semibold">Crypto will only be sold after 1 blockchain confirmation</p>
                  <p className="text-text-muted text-xs">
                    This ensures the transaction is secure and irreversible.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <i className="fa-solid fa-shield text-orange mt-0.5"></i>
                <div>
                  <p className="font-semibold">KYC Level 2 required for withdrawals</p>
                  <p className="text-text-muted text-xs">
                    To withdraw cash, please complete your KYC verification in your profile.
                  </p>
                </div>
              </div>

              <div className="bg-black/20 rounded-xl p-3 border border-border text-text-muted text-xs">
                By proceeding, you agree to these terms and acknowledge that KJ Exchange is not liable for issues arising from non-compliance.
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
                onClick={handleAgreeAndGenerate}
                className="flex-1 bg-orange text-white font-bold py-2.5 rounded-xl hover:bg-orange-600 transition flex items-center justify-center gap-2"
              >
                <i className="fa-regular fa-check-circle"></i> I Agree
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Loading / Generating Wallet Overlay ===== */}
      {loadingOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center text-white">
            <i className="fa-solid fa-spinner fa-spin text-5xl text-orange"></i>
            <h3 className="text-xl font-bold mt-4">Generating Your Wallet...</h3>
            <p className="text-text-muted text-sm mt-2 max-w-xs">
              Sit tight while we set things up securely for you.
            </p>
            <p className="text-text-muted text-xs mt-1">
              This usually takes a few seconds.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
