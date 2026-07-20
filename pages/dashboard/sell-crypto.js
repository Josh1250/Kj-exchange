import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../_app';
import Layout from '../../components/layout/Layout';
import { supabase } from '../../lib/supabaseClient';
import Head from 'next/head';

export default function SellCrypto() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [asset, setAsset] = useState('BTC');
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rates, setRates] = useState({ btc: 95200, eth: 4210, usdt: 1550, sol: 185 });

  useEffect(() => {
    // Fetch live rates (simple version)
    const fetchRates = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,solana&vs_currencies=usd');
        const data = await res.json();
        // Convert to NGN (assuming 1 USD = 1550 NGN)
        const ngnRate = 1550;
        setRates({
          btc: data.bitcoin?.usd * ngnRate || 95200,
          eth: data.ethereum?.usd * ngnRate || 4210,
          usdt: data.tether?.usd * ngnRate || 1550,
          sol: data.solana?.usd * ngnRate || 185,
        });
      } catch (e) {
        console.warn('Using fallback rates');
      }
    };
    fetchRates();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) {
    router.push('/auth/login');
    return null;
  }

  const getRate = () => {
    switch (asset) {
      case 'BTC': return rates.btc;
      case 'ETH': return rates.eth;
      case 'USDT': return rates.usdt;
      case 'SOL': return rates.sol;
      default: return 0;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    const rate = getRate();
    const valueNgn = parseFloat(amount) * rate;

    if (isNaN(valueNgn) || valueNgn <= 0) {
      setError('Please enter a valid amount');
      setSubmitting(false);
      return;
    }

    // Create order
    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        type: 'crypto',
        asset: asset,
        amount: parseFloat(amount),
        rate: rate,
        value_ngn: valueNgn,
        details: {
          wallet_address: walletAddress,
        },
        status: 'pending',
      })
      .select();

    if (error) {
      setError('Failed to submit order. Please try again.');
      console.error(error);
    } else {
      setSuccess(`Order submitted! You'll receive ₦${valueNgn.toLocaleString()} after verification.`);
      setAmount('');
      setWalletAddress('');
    }
    setSubmitting(false);
  };

  return (
    <>
      <Head>
        <title>Sell Crypto · KJ Exchange</title>
      </Head>
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">₿ Sell Crypto</h1>
          <div className="bg-bg-card rounded-2xl p-6 border border-border">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Crypto Asset</label>
                <select
                  value={asset}
                  onChange={(e) => setAsset(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-lg px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                >
                  <option>BTC</option>
                  <option>USDT</option>
                  <option>ETH</option>
                  <option>SOL</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Amount (in {asset})</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-lg px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                  placeholder="e.g., 0.5"
                  required
                  min="0.0001"
                  step="any"
                />
                <p className="text-text-muted text-xs mt-1">Rate: ₦{getRate().toLocaleString()} / {asset}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Your Wallet Address</label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-lg px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                  placeholder="Enter your wallet address"
                  required
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              {success && <p className="text-green-400 text-sm">{success}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-orange text-white font-bold py-3 rounded-full hover:bg-orange-light transition disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Order'}
              </button>
            </form>
          </div>
        </div>
      </Layout>
    </>
  );
}
