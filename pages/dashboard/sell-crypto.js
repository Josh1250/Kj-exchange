import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../_app';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../lib/supabaseClient';
import Head from 'next/head';

const CRYPTO_ASSETS = [
  { id: 'BTC', name: 'Bitcoin', icon: 'fa-brands fa-bitcoin', color: '#f7931a', wallet: '1HjJpZByFHnhSPZ37qStqCMUqVGaQvKw4i', network: 'Bitcoin Network', min: 0.001 },
  { id: 'USDT', name: 'Tether', icon: 'fa-solid fa-coins', color: '#26a17b', wallet: 'TJpaXiQChRaGHaZzYqb3Qngf26EafH5CbH', network: 'TRC20', min: 10 },
  { id: 'ETH', name: 'Ethereum', icon: 'fa-brands fa-ethereum', color: '#627eea', wallet: '0x61175C09a683755AE00069b20D3CF233Cd02E536', network: 'ERC20', min: 0.01 },
  { id: 'SOL', name: 'Solana', icon: 'fa-solid fa-bolt', color: '#9945FF', wallet: 'HBpjJDV6mh5jSMbmm4ujFYv7q7YzgJZwnt4pJwP6s7qh', network: 'Solana', min: 0.1 },
];

export default function SellCrypto() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedAsset, setSelectedAsset] = useState(CRYPTO_ASSETS[0]);
  const [amount, setAmount] = useState('');
  const [userWallet, setUserWallet] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rates, setRates] = useState({ btc: 95200, eth: 4210, usdt: 1550, sol: 185 });
  const [showWalletInfo, setShowWalletInfo] = useState(false);
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,solana&vs_currencies=usd');
        const data = await res.json();
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

  if (loading) return <div className="flex items-center justify-center min-h-screen text-text-primary">Loading...</div>;
  if (!user) {
    router.push('/auth/login');
    return null;
  }

  const getRate = () => {
    switch (selectedAsset.id) {
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

    const cryptoAmount = parseFloat(amount);
    if (isNaN(cryptoAmount) || cryptoAmount <= 0) {
      setError('Please enter a valid amount');
      setSubmitting(false);
      return;
    }
    if (cryptoAmount < selectedAsset.min) {
      setError(`Minimum amount is ${selectedAsset.min} ${selectedAsset.id}`);
      setSubmitting(false);
      return;
    }
    if (!userWallet || userWallet.length < 10) {
      setError('Please enter your wallet address');
      setSubmitting(false);
      return;
    }

    const rate = getRate();
    const valueNgn = cryptoAmount * rate;

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
          user_wallet: userWallet,
          asset_name: selectedAsset.name,
          network: selectedAsset.network,
        },
      })
      .select();

    if (error) {
      setError('Failed to submit order. Please try again.');
      console.error(error);
    } else {
      setOrderId(data[0].id);
      setSuccess(`Order submitted! You'll receive ₦${valueNgn.toLocaleString()} after verification.`);
      setShowWalletInfo(true);
      setAmount('');
      setUserWallet('');
    }
    setSubmitting(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('✅ Wallet address copied to clipboard!');
  };

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
                {/* Asset Selection */}
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

                {/* Selected Asset Info */}
                <div className="bg-black/20 rounded-lg p-3 flex items-center justify-between border border-border">
                  <div className="flex items-center gap-3">
                    <i className={`${selectedAsset.icon} text-2xl`} style={{ color: selectedAsset.color }}></i>
                    <div>
                      <p className="font-semibold">{selectedAsset.name} ({selectedAsset.id})</p>
                      <p className="text-xs text-text-muted">{selectedAsset.network}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-bold">₦{getRate().toLocaleString()}</p>
                    <p className="text-xs text-text-muted">per {selectedAsset.id}</p>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Amount ({selectedAsset.id})</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-black/40 border border-border rounded-lg px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                    placeholder={`Enter amount (min ${selectedAsset.min})`}
                    required
                    min={selectedAsset.min}
                    step="any"
                  />
                  {amount && (
                    <p className="text-text-muted text-sm mt-1">
                      You'll receive: <span className="text-green-400 font-bold">₦{(parseFloat(amount) * getRate()).toLocaleString()}</span>
                    </p>
                  )}
                  <p className="text-xs text-text-muted mt-1">Min: {selectedAsset.min} {selectedAsset.id}</p>
                </div>

                {/* User Wallet Address */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Your Wallet Address
                  </label>
                  <input
                    type="text"
                    value={userWallet}
                    onChange={(e) => setUserWallet(e.target.value)}
                    className="w-full bg-black/40 border border-border rounded-lg px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                    placeholder="Enter your wallet address where you'll receive Naira"
                    required
                  />
                  <p className="text-xs text-text-muted mt-1">
                    We'll send your Naira payment to this address after verification.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-3 text-red-400 text-sm">
                    <i className="fa-solid fa-triangle-exclamation mr-2"></i>{error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-orange text-white font-bold py-3 rounded-full hover:bg-orange-600 transition disabled:opacity-50 shadow-orange shadow-lg flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><i className="fa-solid fa-spinner fa-spin"></i> Submitting...</>
                  ) : (
                    <><i className="fa-solid fa-paper-plane"></i> Submit Order</>
                  )}
                </button>

                <p className="text-center text-xs text-text-muted">
                  Your order will be verified within 5-15 minutes.
                  <br />
                  <span className="text-green-400 font-bold">0% fees</span> — What you see is what you get.
                </p>
              </form>
            ) : (
              // Step 2: Show Platform Wallet Address
              <div className="space-y-6">
                <div className="bg-green-400/10 border border-green-400/20 rounded-lg p-4">
                  <p className="text-green-400 font-semibold text-center">
                    <i className="fa-regular fa-circle-check mr-2"></i>Order Submitted Successfully!
                  </p>
                  <p className="text-text-muted text-center text-sm mt-1">Order ID: <span className="text-text-primary font-mono">{orderId}</span></p>
                </div>

                <div className="border border-border rounded-lg p-6">
                  <h3 className="font-bold text-lg mb-2">Send Your {selectedAsset.name}</h3>
                  <p className="text-text-muted text-sm mb-4">
                    Send exactly <strong className="text-white">{amount} {selectedAsset.id}</strong> to the address below:
                  </p>

                  <div className="bg-black/40 rounded-lg p-4 border border-border">
                    <p className="text-xs text-text-muted mb-1">Send to this address</p>
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm break-all flex-1 text-orange">{selectedAsset.wallet}</p>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedAsset.wallet)}
                        className="bg-orange/20 hover:bg-orange/30 text-orange px-3 py-1 rounded-lg text-sm transition whitespace-nowrap"
                      >
                        <i className="fa-regular fa-copy mr-1"></i>Copy
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-3">
                    <p className="text-yellow-400 text-sm font-semibold">
                      <i className="fa-solid fa-clock mr-1"></i>Important
                    </p>
                    <p className="text-yellow-400/80 text-sm">
                      Once you've sent the crypto, we'll verify and credit your wallet within 5-15 minutes.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowWalletInfo(false)} className="flex-1 border border-border text-text-primary px-4 py-2 rounded-full hover:border-orange transition">
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
