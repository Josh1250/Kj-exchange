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

const FEE_PERCENTAGE = 0.01;

export default function SellCrypto() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // State
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
        console.warn('Fallback rates');
        setRates({ BTC: 88649559, ETH: 2602943, USDT: 1379, SOL: 105626 });
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

  // DERIVED VALUES
  const currentRate = rates[selectedAsset.id] || 0;
  const usdPrice = ngnRate > 0 ? currentRate / ngnRate : 0;
  const usdValue = parseFloat(usdAmount) || 0;
  const cryptoAmount = usdValue > 0 && usdPrice > 0 ? usdValue / usdPrice : 0;
  const beforeFee = usdValue * ngnRate;
  const fee = beforeFee * FEE_PERCENTAGE;
  const afterFee = beforeFee - fee;

  // LOGGING ON CLICK
  const handleAssetClick = (asset) => {
    console.log('🔄 Asset clicked:', asset.id);
    setSelectedAsset(asset);
    setUsdAmount('');
    console.log('📊 Current rate for', asset.id, ':', rates[asset.id]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // ... same as before (submit logic)
  };

  const copyToClipboard = (text) => { /* ... */ };

  return (
    <>
      <Head><title>Sell Crypto · KJ Exchange</title></Head>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Sell Crypto</h1>

          {/* BIG DEBUG BOX */}
          <div className="bg-blue-500/20 border border-blue-500/40 rounded-lg p-4 mb-4 text-sm text-blue-300">
            <p><strong>🔍 SELECTED:</strong> {selectedAsset.id}</p>
            <p><strong>💰 RATE:</strong> ₦{currentRate.toLocaleString()}</p>
            <p><strong>📊 USD PRICE:</strong> ${usdPrice.toFixed(2)}</p>
            <p><strong>📦 RATES OBJECT:</strong> BTC: ₦{rates.BTC.toLocaleString()} | ETH: ₦{rates.ETH.toLocaleString()} | USDT: ₦{rates.USDT.toLocaleString()} | SOL: ₦{rates.SOL.toLocaleString()}</p>
          </div>

          <div className="bg-bg-card rounded-2xl p-6 border border-border">
            {!showWalletInfo ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Crypto Asset</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {CRYPTO_ASSETS.map((asset) => {
                      const isSelected = selectedAsset.id === asset.id;
                      return (
                        <button
                          key={asset.id}
                          type="button"
                          onClick={() => handleAssetClick(asset)}
                          className={`p-3 rounded-lg border transition text-center ${
                            isSelected ? 'border-orange bg-orange/10' : 'border-border bg-black/20 hover:border-orange/50'
                          }`}
                        >
                          <i className={`${asset.icon} text-2xl`} style={{ color: asset.color }}></i>
                          <p className="text-sm font-semibold mt-1">{asset.id}</p>
                        </button>
                      );
                    })}
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
                    <p className="text-green-400 font-bold">₦{currentRate.toLocaleString()}</p>
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
                    <span>1 {selectedAsset.id} = ₦{currentRate.toLocaleString()}</span>
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
              </form>
            ) : (
              // ... wallet info (unchanged)
              <div>Wallet info</div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
