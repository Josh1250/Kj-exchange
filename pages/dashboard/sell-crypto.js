import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../_app';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../lib/supabaseClient';
import Head from 'next/head';
import Link from 'next/link';

const PLATFORM_WALLETS = {
  BTC: '1HjJpZByFHnhSPZ37qStqCMUqVGaQvKw4i',
  USDT: 'TJpaXiQChRaGHaZzYqb3Qngf26EafH5CbH',
  ETH: '0x61175C09a683755AE00069b20D3CF233Cd02E536',
  SOL: 'HBpjJDV6mh5jSMbmm4ujFYv7q7YzgJZwnt4pJwP6s7qh',
};

const CRYPTO_ASSETS = [
  { id: 'BTC', name: 'Bitcoin', icon: 'fa-brands fa-bitcoin', color: '#f7931a', network: 'Bitcoin Network' },
  { id: 'USDT', name: 'Tether', icon: 'fa-solid fa-coins', color: '#26a17b', network: 'TRC20' },
  { id: 'ETH', name: 'Ethereum', icon: 'fa-brands fa-ethereum', color: '#627eea', network: 'ERC20' },
  { id: 'SOL', name: 'Solana', icon: 'fa-solid fa-bolt', color: '#9945FF', network: 'Solana' },
];

const FEE_PERCENTAGE = 0.01; // 1%

export default function SellCrypto() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [selectedAsset, setSelectedAsset] = useState(CRYPTO_ASSETS[0]);
  const [usdAmount, setUsdAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showWalletInfo, setShowWalletInfo] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [rates, setRates] = useState({ BTC: 0, ETH: 0, USDT: 0, SOL: 0 });
  const [ngnRate, setNgnRate] = useState(1550);
  const [isLoadingRates, setIsLoadingRates] = useState(true);

  // Fetch rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        setIsLoadingRates(true);

        const fxRes = await fetch('https://api.exchangerate.fun/latest?base=USD');
        const fxData = await fxRes.json();
        const ngn = fxData.rates?.NGN || 1550;
        setNgnRate(ngn);

        const cryptoRes = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,tether,ethereum,solana&vs_currencies=usd'
        );
        const cryptoData = await cryptoRes.json();

        const btcUsd = cryptoData.bitcoin?.usd || 0;
        const usdtUsd = cryptoData.tether?.usd || 1;
        const ethUsd = cryptoData.ethereum?.usd || 0;
        const solUsd = cryptoData.solana?.usd || 0;

        setRates({
          BTC: btcUsd * ngn,
          ETH: ethUsd * ngn,
          USDT: usdtUsd * ngn,
          SOL: solUsd * ngn,
        });
      } catch (error) {
        console.warn('⚠️ Rate fetch failed, using fallback', error);
        setRates({
          BTC: 88649559,
          ETH: 2602943,
          USDT: 1379,
          SOL: 105626,
        });
      } finally {
        setIsLoadingRates(false);
      }
    };

    fetchRates();
    const interval = setInterval(fetchRates, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!user) {
    router.push('/auth/login');
    return null;
  }

  // Derived values
  const coinRate = rates[selectedAsset.id] || 0;
  const usdPerCoin = ngnRate > 0 ? coinRate / ngnRate : 0;

  // Per-asset spreads (NGN/USD rate)
  const getRatePerUsd = () => {
    const spreads = {
      BTC: 0.018,
      ETH: 0.015,
      USDT: 0.002,
      SOL: 0.020,
    };
    const spread = spreads[selectedAsset.id] || 0.01;
    return ngnRate * (1 - spread);
  };

  const ratePerUsd = getRatePerUsd();

  const usdValue = parseFloat(usdAmount) || 0;
  const cryptoAmount = usdValue > 0 && usdPerCoin > 0 ? usdValue / usdPerCoin : 0;
  const beforeFee = usdValue * ratePerUsd;
  const fee = beforeFee * FEE_PERCENTAGE;
  const afterFee = beforeFee - fee;

  const handleAssetClick = (asset) => {
    setSelectedAsset(asset);
    setUsdAmount('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const usd = parseFloat(usdAmount);
      if (isNaN(usd) || usd <= 0) {
        setError('Please enter a valid USD amount');
        setSubmitting(false);
        return;
      }
      if (usd < 1) {
        setError('Minimum amount is $1.00');
        setSubmitting(false);
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          type: 'crypto',
          asset: selectedAsset.id,
          amount: cryptoAmount,
          rate: coinRate,
          value_ngn: afterFee,
          status: 'pending',
          details: {
            asset_name: selectedAsset.name,
            network: selectedAsset.network,
            usd_amount: usd,
            fee: fee,
            fee_percentage: FEE_PERCENTAGE * 100,
          },
        })
        .select();

      if (error) throw error;

      setOrderId(data[0].id);
      setSuccess(`Order submitted! You'll receive ₦${afterFee.toLocaleString()} after verification.`);
      setShowWalletInfo(true);
      setUsdAmount('');
    } catch (err) {
      console.error(err);
      setError('Failed to submit order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    try {
      navigator.clipboard.writeText(text);
      alert('✅ Wallet address copied!');
    } catch (err) {
      alert('Please copy the address manually.');
    }
  };

  return (
    <>
      <Head>
        <title>Sell Crypto · KJ Exchange</title>
      </Head>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Back Button */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary transition mb-6 group"
          >
            <i className="fa-solid fa-arrow-left text-sm group-hover:-translate-x-1 transition-transform"></i>
            <span className="text-sm font-medium">Back to Dashboard</span>
          </Link>

          <h1 className="text-2xl font-bold mb-6">Sell Crypto</h1>

          <div className="bg-bg-card rounded-3xl p-6 md:p-8 border border-border shadow-2xl shadow-purple/5">
            {!showWalletInfo ? (
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Asset Selection */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-3">Select Asset</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {CRYPTO_ASSETS.map((asset) => {
                      const isSelected = selectedAsset.id === asset.id;
                      return (
                        <button
                          key={asset.id}
                          type="button"
                          onClick={() => handleAssetClick(asset)}
                          className={`p-4 rounded-2xl border transition-all duration-200 text-center ${
                            isSelected
                              ? 'border-orange bg-orange/10 shadow-lg shadow-orange/10 scale-[1.02]'
                              : 'border-border bg-black/20 hover:border-orange/50 hover:bg-black/30'
                          }`}
                        >
                          <i className={`${asset.icon} text-3xl`} style={{ color: asset.color }}></i>
                          <p className="text-sm font-semibold mt-1">{asset.id}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Rate Card */}
                <div className="bg-gradient-to-br from-purple-900/20 to-orange-900/10 rounded-2xl p-5 border border-border/50 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text-muted text-xs uppercase tracking-wider">Current Rate</p>
                      <p className="text-2xl font-bold text-green-400">₦{ratePerUsd.toFixed(2)}/$</p>
                    </div>
                    <div className="text-right">
                      <p className="text-text-muted text-xs uppercase tracking-wider">Asset</p>
                      <p className="text-sm font-semibold flex items-center gap-2">
                        <i className={`${selectedAsset.icon}`} style={{ color: selectedAsset.color }}></i>
                        {selectedAsset.name}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-text-muted">
                    1 {selectedAsset.id} ≈ ${usdPerCoin.toFixed(2)}
                  </div>
                </div>

                {selectedAsset.id === 'USDT' && (
                  <div className="bg-red-400/10 border border-red-400/20 rounded-xl p-3 text-red-400 text-sm flex items-start gap-2">
                    <i className="fa-solid fa-triangle-exclamation mt-0.5"></i>
                    <span>Send USDT only via TRC20 network.</span>
                  </div>
                )}

                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Amount (USD)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={usdAmount}
                      onChange={(e) => setUsdAmount(e.target.value)}
                      className="w-full bg-black/40 border border-border rounded-xl px-5 py-4 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 text-2xl font-bold placeholder:text-text-muted/50"
                      placeholder="0.00"
                      required
                      min="1"
                      step="0.01"
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted text-sm font-semibold">USD</div>
                  </div>
                  {cryptoAmount > 0 && (
                    <p className="text-text-muted text-sm mt-2">
                      ≈ {cryptoAmount.toFixed(6)} {selectedAsset.id}
                    </p>
                  )}
                </div>

                {/* Fee and Receive */}
                <div className="bg-black/20 rounded-2xl p-5 border border-border/50 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-muted">Rate</span>
                    <span className="font-medium">₦{ratePerUsd.toFixed(2)}/$</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-muted">USD Amount</span>
                    <span className="font-medium">${usdValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-text-muted border-t border-border/50 pt-3">
                    <span>Transaction Fee ({FEE_PERCENTAGE * 100}%)</span>
                    <span className="text-orange font-medium">- ₦{fee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg border-t border-border/50 pt-3">
                    <span className="text-text-muted">You receive</span>
                    <span className="text-green-400 font-extrabold">₦{afterFee.toLocaleString()}</span>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-400/10 border border-red-400/20 rounded-xl p-3 text-red-400 text-sm flex items-center gap-2">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-4 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-orange/20"
                >
                  {submitting ? (
                    <><i className="fa-solid fa-spinner fa-spin"></i> Submitting...</>
                  ) : (
                    <><i className="fa-solid fa-paper-plane"></i> Continue ➤</>
                  )}
                </button>

                <p className="text-center text-xs text-text-muted">
                  Your order will be verified within 5-15 minutes.
                </p>
                <p className="text-center text-xs text-orange font-semibold">
                  🔒 Transparent Pricing — No Hidden Fees
                </p>
              </form>
            ) : (
              // Order Submitted
              <div className="space-y-6">
                <div className="bg-green-400/10 border border-green-400/20 rounded-2xl p-4 text-center">
                  <p className="text-green-400 font-semibold text-lg">
                    <i className="fa-regular fa-circle-check mr-2"></i>Order Submitted!
                  </p>
                  <p className="text-text-muted text-sm mt-1">Order ID: <span className="text-text-primary font-mono">{orderId}</span></p>
                </div>

                <div className="border border-border rounded-2xl p-6">
                  <h3 className="font-bold text-lg mb-3">Send Your {selectedAsset.name}</h3>
                  <p className="text-text-muted text-sm mb-4">
                    Send exactly <strong className="text-white">{cryptoAmount.toFixed(6)} {selectedAsset.id}</strong> to:
                  </p>

                  <div className="bg-black/40 rounded-xl p-4 border border-border">
                    <p className="text-xs text-text-muted mb-1">Wallet Address</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm break-all flex-1 text-orange">{PLATFORM_WALLETS[selectedAsset.id]}</p>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(PLATFORM_WALLETS[selectedAsset.id])}
                        className="bg-orange/20 hover:bg-orange/30 text-orange px-3 py-1 rounded-lg text-sm transition whitespace-nowrap"
                      >
                        <i className="fa-regular fa-copy mr-1"></i>Copy
                      </button>
                    </div>
                  </div>

                  {selectedAsset.id === 'USDT' && (
                    <div className="mt-3 bg-red-400/10 border border-red-400/20 rounded-xl p-3 text-red-400 text-sm flex items-start gap-2">
                      <i className="fa-solid fa-triangle-exclamation mt-0.5"></i>
                      <span>Send USDT only via TRC20 network.</span>
                    </div>
                  )}

                  <div className="mt-3 bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-3 text-yellow-400 text-sm flex items-start gap-2">
                    <i className="fa-solid fa-clock"></i>
                    <span>Once sent, we'll verify and credit your wallet within 5-15 min.</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowWalletInfo(false)}
                    className="flex-1 border border-border text-text-primary px-4 py-2 rounded-xl hover:border-orange transition"
                  >
                    <i className="fa-solid fa-arrow-left mr-2"></i>Back
                  </button>
                  <Link
                    href="/dashboard/orders"
                    className="flex-1 bg-orange text-white font-bold py-2 rounded-xl hover:bg-orange-600 transition text-center"
                  >
                    <i className="fa-solid fa-list mr-2"></i>View Orders
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
