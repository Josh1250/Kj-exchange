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

// Fallback rates (different per coin to distinguish them)
const FALLBACK_RATES = {
  BTC: 95200,
  ETH: 4210,
  USDT: 1550,
  SOL: 185,
};

export default function SellCrypto() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedAsset, setSelectedAsset] = useState(CRYPTO_ASSETS[0]);
  const [usdAmount, setUsdAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rates, setRates] = useState(FALLBACK_RATES);
  const [ngnRate, setNgnRate] = useState(1550);
  const [showWalletInfo, setShowWalletInfo] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [isLoadingRates, setIsLoadingRates] = useState(true);

  // Fetch rates (same logic as your Rate Calculator)
  useEffect(() => {
    const fetchRates = async () => {
      try {
        setIsLoadingRates(true);

        // 1. Get NGN rate
        let ngn = 1550;
        try {
          const fxRes = await fetch('https://api.exchangerate.fun/latest?base=USD');
          const fxData = await fxRes.json();
          if (fxData.rates?.NGN) {
            ngn = fxData.rates.NGN * 0.98; // 2% spread
          }
        } catch (e) {
          console.warn('FX API fallback');
        }
        setNgnRate(ngn);

        // 2. Get crypto USD prices (using the same API as Rate Calculator)
        let cryptoUsd = { BTC: 0, ETH: 0, USDT: 1, SOL: 0 };
        try {
          // CoinGecko is reliable for major coins
          const geoRes = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,tether,ethereum,solana&vs_currencies=usd'
          );
          const geoData = await geoRes.json();
          cryptoUsd = {
            BTC: geoData.bitcoin?.usd || 0,
            USDT: geoData.tether?.usd || 1,
            ETH: geoData.ethereum?.usd || 0,
            SOL: geoData.solana?.usd || 0,
          };
          console.log('✅ CoinGecko prices:', cryptoUsd);
        } catch (e) {
          console.warn('CoinGecko failed, trying Binance');
          try {
            const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
            const pricePromises = symbols.map(sym =>
              fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${sym}`)
                .then(res => res.json())
                .then(data => ({ symbol: sym, price: parseFloat(data.price) || 0 }))
                .catch(() => ({ symbol: sym, price: 0 }))
            );
            const prices = await Promise.all(pricePromises);
            cryptoUsd = {
              BTC: prices.find(p => p.symbol === 'BTCUSDT')?.price || 0,
              ETH: prices.find(p => p.symbol === 'ETHUSDT')?.price || 0,
              USDT: 1,
              SOL: prices.find(p => p.symbol === 'SOLUSDT')?.price || 0,
            };
            console.log('✅ Binance prices:', cryptoUsd);
          } catch (binanceErr) {
            console.warn('Binance failed, using fallback');
          }
        }

        // Ensure USDT is 1
        cryptoUsd.USDT = 1;

        // If any price is 0, use fallback (so we don't show 0)
        const finalRates = {
          BTC: (cryptoUsd.BTC || FALLBACK_RATES.BTC) * ngn,
          ETH: (cryptoUsd.ETH || FALLBACK_RATES.ETH) * ngn,
          USDT: (cryptoUsd.USDT || FALLBACK_RATES.USDT) * ngn,
          SOL: (cryptoUsd.SOL || FALLBACK_RATES.SOL) * ngn,
        };

        setRates(finalRates);
        console.log('✅ Final NGN rates:', finalRates);
      } catch (err) {
        console.error('Rate fetch error:', err);
        // Use fallback rates
        setRates({
          BTC: FALLBACK_RATES.BTC * 1550,
          ETH: FALLBACK_RATES.ETH * 1550,
          USDT: FALLBACK_RATES.USDT * 1550,
          SOL: FALLBACK_RATES.SOL * 1550,
        });
      } finally {
        setIsLoadingRates(false);
      }
    };
    fetchRates();
    const interval = setInterval(fetchRates, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen text-text-primary">Loading...</div>;
  if (!user) {
    router.push('/auth/login');
    return null;
  }

  const getAssetRate = () => {
    switch (selectedAsset.id) {
      case 'BTC': return rates.BTC;
      case 'ETH': return rates.ETH;
      case 'USDT': return rates.USDT;
      case 'SOL': return rates.SOL;
      default: return 0;
    }
  };

  const getAssetUsdPrice = () => {
    const rate = getAssetRate();
    return ngnRate > 0 ? rate / ngnRate : 0;
  };

  const usdValue = parseFloat(usdAmount) || 0;
  const cryptoAmount = usdValue > 0 && getAssetUsdPrice() > 0 ? usdValue / getAssetUsdPrice() : 0;
  const beforeFee = usdValue * ngnRate;
  const fee = beforeFee * FEE_PERCENTAGE;
  const afterFee = beforeFee - fee;

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

      const rate = getAssetRate();
      const valueNgn = afterFee;

      const { data, error } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          type: 'crypto',
          asset: selectedAsset.id,
          amount: cryptoAmount,
          rate: rate,
          value_ngn: valueNgn,
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
      setSuccess(`Order submitted! You'll receive ₦${valueNgn.toLocaleString()} after verification.`);
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

  const rate = getAssetRate();
  const usdPrice = getAssetUsdPrice();

  return (
    <>
      <Head>
        <title>Sell Crypto · KJ Exchange</title>
      </Head>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Sell Crypto</h1>

          <div className="bg-bg-card rounded-2xl p-6 border border-border">
            {!showWalletInfo ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {isLoadingRates ? (
                  <div className="text-center py-8">
                    <i className="fa-solid fa-spinner fa-spin text-2xl text-orange"></i>
                    <p className="text-text-muted mt-2">Fetching live rates...</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">Crypto Asset</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {CRYPTO_ASSETS.map((asset) => (
                          <button
                            key={asset.id}
                            type="button"
                            onClick={() => setSelectedAsset(asset)}
                            className={`p-3 rounded-lg border transition text-center ${
                              selectedAsset.id === asset.id ? 'border-orange bg-orange/10' : 'border-border bg-black/20 hover:border-orange/50'
                            }`}
                          >
                            <i className={`${asset.icon} text-2xl`} style={{ color: asset.color }}></i>
                            <p className="text-sm font-semibold mt-1">{asset.id}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-black/20 rounded-lg p-3 flex items-center justify-between border border-border">
                      <div className="flex items-center gap-3">
                        <i className={`${selectedAsset.icon} text-2xl`} style={{ color: selectedAsset.color }}></i>
                        <div>
                          <p className="font-semibold">{selectedAsset.name}</p>
                          <p className="text-xs text-text-muted">{selectedAsset.network}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-bold">₦{rate.toLocaleString()}</p>
                        <p className="text-xs text-text-muted">1 {selectedAsset.id} ≈ ${usdPrice.toFixed(2)}</p>
                        <p className="text-xs text-text-muted">1 USD = ₦{ngnRate.toFixed(2)}</p>
                      </div>
                    </div>

                    {selectedAsset.id === 'USDT' && (
                      <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-3 text-red-400 text-sm">
                        <i className="fa-solid fa-triangle-exclamation mr-2"></i> Send USDT only via TRC20 network.
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">Amount (USD)</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={usdAmount}
                          onChange={(e) => setUsdAmount(e.target.value)}
                          className="w-full bg-black/40 border border-border rounded-lg px-4 py-3 text-text-primary focus:border-orange focus:outline-none text-2xl font-bold"
                          placeholder="0.00 USD"
                          required
                          min="1"
                          step="0.01"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted text-sm">USD</div>
                      </div>
                      {cryptoAmount > 0 && (
                        <p className="text-text-muted text-sm mt-1">
                          ≈ {cryptoAmount.toFixed(6)} {selectedAsset.id}
                        </p>
                      )}
                    </div>

                    <div className="bg-black/20 rounded-lg p-4 border border-border space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">Rate</span>
                        <span>1 {selectedAsset.id} = ₦{rate.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">USD Amount</span>
                        <span>${usdValue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-text-muted">
                        <span>Transaction Fee ({FEE_PERCENTAGE * 100}%)</span>
                        <span className="text-orange">- ₦{fee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm border-t border-border pt-2">
                        <span className="text-text-muted">You'll receive</span>
                        <span className="text-green-400 font-bold text-lg">₦{afterFee.toLocaleString()}</span>
                      </div>
                    </div>

                    {error && <p className="text-red-400 text-sm"><i className="fa-solid fa-triangle-exclamation mr-2"></i>{error}</p>}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-orange text-white font-bold py-3 rounded-full hover:bg-orange-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? <><i className="fa-solid fa-spinner fa-spin"></i> Submitting...</> : <><i className="fa-solid fa-paper-plane"></i> Continue ➤</>}
                    </button>

                    <p className="text-center text-xs text-text-muted">
                      Your order will be verified within 5-15 minutes.
                    </p>
                    <p className="text-center text-xs text-orange font-semibold">
                      🔒 Transparent Pricing — No Hidden Fees
                    </p>
                  </>
                )}
              </form>
            ) : (
              // Order submitted — show wallet address
              <div className="space-y-6">
                <div className="bg-green-400/10 border border-green-400/20 rounded-lg p-4">
                  <p className="text-green-400 font-semibold text-center">
                    <i className="fa-regular fa-circle-check mr-2"></i>Order Submitted!
                  </p>
                  <p className="text-text-muted text-center text-sm mt-1">Order ID: <span className="text-text-primary font-mono">{orderId}</span></p>
                </div>

                <div className="border border-border rounded-lg p-6">
                  <h3 className="font-bold text-lg mb-2">Send Your {selectedAsset.name}</h3>
                  <p className="text-text-muted text-sm mb-4">
                    Send exactly <strong className="text-white">{cryptoAmount.toFixed(6)} {selectedAsset.id}</strong> to:
                  </p>

                  <div className="bg-black/40 rounded-lg p-4 border border-border">
                    <p className="text-xs text-text-muted mb-1">Send to this address</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm break-all flex-1 text-orange">{PLATFORM_WALLETS[selectedAsset.id]}</p>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(PLATFORM_WALLETS[selectedAsset.id])}
                        className="bg-orange/20 hover:bg-orange/30 text-orange px-3 py-1 rounded-lg text-sm transition"
                      >
                        <i className="fa-regular fa-copy mr-1"></i>Copy
                      </button>
                    </div>
                  </div>

                  {selectedAsset.id === 'USDT' && (
                    <div className="mt-3 bg-red-400/10 border border-red-400/20 rounded-lg p-3 text-red-400 text-sm">
                      <i className="fa-solid fa-triangle-exclamation mr-2"></i> Send USDT only via TRC20 network.
                    </div>
                  )}

                  <div className="mt-3 bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-3">
                    <p className="text-yellow-400 text-sm font-semibold">
                      <i className="fa-solid fa-clock mr-1"></i>Important
                    </p>
                    <p className="text-yellow-400/80 text-sm">Once sent, we'll verify and credit your wallet within 5-15 min.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setShowWalletInfo(false)} className="flex-1 border border-border text-text-primary px-4 py-2 rounded-full hover:border-orange transition">
                    <i className="fa-solid fa-arrow-left mr-2"></i>Back
                  </button>
                  <Link href="/dashboard/orders" className="flex-1 bg-orange text-white font-bold py-2 rounded-full hover:bg-orange-600 transition text-center">
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
