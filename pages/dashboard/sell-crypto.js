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
  const [rates, setRates] = useState({ btc: 0, eth: 0, usdt: 0, sol: 0 });
  const [ngnRate, setNgnRate] = useState(1550);
  const [isLoadingRates, setIsLoadingRates] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setIsLoadingRates(true);

        // 1. Get raw NGN rate (no spread)
        const fxRes = await fetch('https://api.exchangerate.fun/latest?base=USD');
        const fxData = await fxRes.json();
        const ngnRaw = fxData.rates?.NGN || 1550;
        setNgnRate(ngnRaw);

        // 2. Get crypto USD prices
        const cryptoRes = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,tether,ethereum,solana&vs_currencies=usd'
        );
        const cryptoData = await cryptoRes.json();

        const btcUsd = cryptoData.bitcoin?.usd || 0;
        const usdtUsd = cryptoData.tether?.usd || 1;
        const ethUsd = cryptoData.ethereum?.usd || 0;
        const solUsd = cryptoData.solana?.usd || 0;

        // Compute NGN rates (raw market rates)
        const btcNgn = btcUsd * ngnRaw;
        const usdtNgn = usdtUsd * ngnRaw;
        const ethNgn = ethUsd * ngnRaw;
        const solNgn = solUsd * ngnRaw;

        setRates({
          btc: btcNgn || 95200,
          eth: ethNgn || 4210,
          usdt: usdtNgn || 1550,
          sol: solNgn || 185,
        });

        console.log('✅ Raw market rates:', { btc: btcNgn, eth: ethNgn, usdt: usdtNgn, sol: solNgn });
      } catch (error) {
        console.warn('⚠️ Rate fetch failed, using fallback', error);
        setRates({
          btc: 95200,
          eth: 4210,
          usdt: 1550,
          sol: 185,
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
      case 'BTC': return rates.btc;
      case 'ETH': return rates.eth;
      case 'USDT': return rates.usdt;
      case 'SOL': return rates.sol;
      default: return 0;
    }
  };

  const rate = getAssetRate();
  const usdPrice = ngnRate > 0 ? rate / ngnRate : 0;
  const usdValue = parseFloat(usdAmount) || 0;
  const cryptoAmount = usdValue > 0 && usdPrice > 0 ? usdValue / usdPrice : 0;
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

  return (
    <>
      <Head>
        <title>Sell Crypto · KJ Exchange</title>
      </Head>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Sell Crypto</h1>

          {/* Debug info (remove after testing) */}
          <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-2 mb-4 text-xs text-yellow-400">
            🔍 BTC = ₦{rates.btc.toLocaleString()} | ETH = ₦{rates.eth.toLocaleString()} | USDT = ₦{rates.usdt.toLocaleString()} | SOL = ₦{rates.sol.toLocaleString()}
          </div>

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
