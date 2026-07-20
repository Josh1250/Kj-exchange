import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../_app';
import Layout from '../../components/layout/Layout';
import Head from 'next/head';

export default function Swap() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [fromAsset, setFromAsset] = useState('BTC');
  const [toAsset, setToAsset] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rates, setRates] = useState({ btc: 95200, eth: 4210, usdt: 1, sol: 185 });

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,solana&vs_currencies=usd');
        const data = await res.json();
        setRates({
          btc: data.bitcoin?.usd || 95200,
          eth: data.ethereum?.usd || 4210,
          usdt: data.tether?.usd || 1,
          sol: data.solana?.usd || 185,
        });
      } catch (e) {
        console.warn('Using fallback rates');
      }
    };
    fetchRates();
  }, []);

  const getRate = (asset) => {
    switch (asset) {
      case 'BTC': return rates.btc;
      case 'ETH': return rates.eth;
      case 'USDT': return rates.usdt;
      case 'SOL': return rates.sol;
      default: return 0;
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) {
    router.push('/auth/login');
    return null;
  }

  const handleSwap = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    // Simulate swap (no backend yet)
    const fromRate = getRate(fromAsset);
    const toRate = getRate(toAsset);
    const fromAmount = parseFloat(amount);
    if (isNaN(fromAmount) || fromAmount <= 0) {
      setError('Please enter a valid amount');
      setSubmitting(false);
      return;
    }
    const usdValue = fromAmount * fromRate;
    const toAmount = usdValue / toRate;

    setSuccess(`Swapped ${fromAmount} ${fromAsset} to ${toAmount.toFixed(6)} ${toAsset} (0% fees)`);
    setAmount('');
    setSubmitting(false);
  };

  return (
    <>
      <Head>
        <title>Swap · KJ Exchange</title>
      </Head>
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">🔄 Swap Crypto</h1>
          <div className="bg-bg-card rounded-2xl p-6 border border-border">
            <form onSubmit={handleSwap} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">From</label>
                <select
                  value={fromAsset}
                  onChange={(e) => setFromAsset(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-lg px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                >
                  <option>BTC</option>
                  <option>USDT</option>
                  <option>ETH</option>
                  <option>SOL</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">To</label>
                <select
                  value={toAsset}
                  onChange={(e) => setToAsset(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-lg px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                >
                  <option>USDT</option>
                  <option>BTC</option>
                  <option>ETH</option>
                  <option>SOL</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-lg px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                  placeholder="Enter amount"
                  required
                  min="0.0001"
                  step="any"
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              {success && <p className="text-green-400 text-sm">{success}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-orange text-white font-bold py-3 rounded-full hover:bg-orange-light transition disabled:opacity-50"
              >
                {submitting ? 'Swapping...' : 'Swap'}
              </button>
            </form>
          </div>
        </div>
      </Layout>
    </>
  );
}
