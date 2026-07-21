import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../_app';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../lib/supabaseClient';
import Head from 'next/head';

const SUPPORTED_ASSETS = [
  { id: 'BTC', name: 'Bitcoin', icon: 'fa-brands fa-bitcoin', color: '#f7931a' },
  { id: 'ETH', name: 'Ethereum', icon: 'fa-brands fa-ethereum', color: '#627eea' },
  { id: 'USDT', name: 'Tether', icon: 'fa-solid fa-coins', color: '#26a17b' },
  { id: 'SOL', name: 'Solana', icon: 'fa-solid fa-bolt', color: '#9945FF' },
];

const FEE_PERCENTAGE = 0.01; // 1%

export default function Convert() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [fromAsset, setFromAsset] = useState(SUPPORTED_ASSETS[0]);
  const [toAsset, setToAsset] = useState(SUPPORTED_ASSETS[1]);
  const [amount, setAmount] = useState('');
  const [rates, setRates] = useState({ BTC: 0, ETH: 0, USDT: 0, SOL: 0 });
  const [ngnRate, setNgnRate] = useState(1550);
  const [result, setResult] = useState(0);
  const [fee, setFee] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const fxRes = await fetch('https://api.exchangerate.fun/latest?base=USD');
        const fxData = await fxRes.json();
        const ngn = fxData.rates?.NGN || 1550;
        setNgnRate(ngn);

        const cryptoRes = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,tether,ethereum,solana&vs_currencies=usd'
        );
        const cryptoData = await cryptoRes.json();
        setRates({
          BTC: cryptoData.bitcoin?.usd || 0,
          ETH: cryptoData.ethereum?.usd || 0,
          USDT: cryptoData.tether?.usd || 1,
          SOL: cryptoData.solana?.usd || 0,
        });
      } catch (e) {
        console.warn('Rate fetch failed', e);
      }
    };
    fetchRates();
    const interval = setInterval(fetchRates, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fromUsd = rates[fromAsset.id] || 0;
    const toUsd = rates[toAsset.id] || 1;
    const amt = parseFloat(amount) || 0;
    if (fromUsd > 0 && toUsd > 0) {
      const raw = (amt * fromUsd) / toUsd;
      const feeAmt = raw * FEE_PERCENTAGE;
      setFee(feeAmt);
      setResult(raw - feeAmt);
    } else {
      setResult(0);
      setFee(0);
    }
  }, [amount, fromAsset, toAsset, rates]);

  const handleSwap = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setError('Enter a valid amount');
      setSubmitting(false);
      return;
    }

    // Simulate swap (will be replaced with real exchange logic)
    // Actually, this would involve creating a transaction and using a swap API or manual matching.
    // For now, we'll show success.
    setSuccess(`Swapped ${amt} ${fromAsset.id} to ${result.toFixed(6)} ${toAsset.id}`);
    setAmount('');
    setSubmitting(false);
  };

  if (loading) return <div>Loading...</div>;
  if (!user) {
    router.push('/auth/login');
    return null;
  }

  return (
    <>
      <Head><title>Convert · KJ Exchange</title></Head>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Convert Crypto</h1>
          <div className="bg-bg-card rounded-2xl p-6 border border-border">
            <form onSubmit={handleSwap} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">From</label>
                <div className="grid grid-cols-4 gap-2">
                  {SUPPORTED_ASSETS.map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => setFromAsset(asset)}
                      className={`p-2 rounded-lg border transition text-center ${fromAsset.id === asset.id ? 'border-orange bg-orange/10' : 'border-border bg-black/20'}`}
                    >
                      <i className={`${asset.icon} text-lg`} style={{ color: asset.color }}></i>
                      <p className="text-xs font-semibold mt-1">{asset.id}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">To</label>
                <div className="grid grid-cols-4 gap-2">
                  {SUPPORTED_ASSETS.map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => setToAsset(asset)}
                      className={`p-2 rounded-lg border transition text-center ${toAsset.id === asset.id ? 'border-orange bg-orange/10' : 'border-border bg-black/20'}`}
                    >
                      <i className={`${asset.icon} text-lg`} style={{ color: asset.color }}></i>
                      <p className="text-xs font-semibold mt-1">{asset.id}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Amount ({fromAsset.id})</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                  placeholder="0.00"
                  required
                  step="any"
                  min="0"
                />
              </div>

              <div className="bg-black/20 rounded-xl p-4 border border-border space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Rate</span>
                  <span>1 {fromAsset.id} ≈ {((rates[toAsset.id] || 1) / (rates[fromAsset.id] || 1)).toFixed(4)} {toAsset.id}</span>
                </div>
                <div className="flex justify-between text-sm text-text-muted">
                  <span>Transaction Fee ({FEE_PERCENTAGE * 100}%)</span>
                  <span className="text-orange">- {fee.toFixed(6)} {toAsset.id}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-border pt-2">
                  <span className="text-text-muted">You'll receive</span>
                  <span className="text-green-400 font-bold text-lg">{result.toFixed(6)} {toAsset.id}</span>
                </div>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}
              {success && <p className="text-green-400 text-sm">{success}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3 rounded-xl hover:from-orange-600 hover:to-orange-700 transition shadow-lg shadow-orange/20"
              >
                {submitting ? 'Processing...' : 'Convert Now'}
              </button>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
