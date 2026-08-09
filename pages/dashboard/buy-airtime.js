import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../_app';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../lib/supabaseClient';
import Head from 'next/head';

export default function BuyAirtime() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [balance, setBalance] = useState(0);
  const [network, setNetwork] = useState('mtn');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isWalletLoading, setIsWalletLoading] = useState(true);

  const networks = [
    { id: 'mtn', name: 'MTN', icon: 'fa-solid fa-tower-cell', color: '#FFD700' },
    { id: 'glo', name: 'Glo', icon: 'fa-solid fa-tower-cell', color: '#00A651' },
    { id: 'airtel', name: 'Airtel', icon: 'fa-solid fa-tower-cell', color: '#FF0000' },
    { id: '9mobile', name: '9mobile', icon: 'fa-solid fa-tower-cell', color: '#660099' },
  ];

  const amountPresets = [100, 200, 500, 1000, 2000, 5000];

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchBalance();
    }
  }, [user]);

  const fetchBalance = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setBalance(data.balance || 0);
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
    } finally {
      setIsWalletLoading(false);
    }
  };

  const handleAmountSelect = (value) => {
    setAmount(value);
    setCustomAmount('');
  };

  const handleCustomAmount = (e) => {
    const val = e.target.value;
    setCustomAmount(val);
    setAmount(val);
  };

  const handleBuyAirtime = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validation
    if (!phone || phone.length < 10) {
      setMessage({ type: 'error', text: 'Please enter a valid phone number' });
      return;
    }

    const amountToSend = parseFloat(amount);
    if (!amountToSend || amountToSend <= 0) {
      setMessage({ type: 'error', text: 'Please select or enter a valid amount' });
      return;
    }

    if (amountToSend > balance) {
      setMessage({ type: 'error', text: `Insufficient balance. You have ₦${balance.toLocaleString()}` });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/buy-airtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          network: network,
          phone: phone,
          amount: amountToSend,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to buy airtime');
      }

      setMessage({ type: 'success', text: `✅ Success! ₦${amountToSend} airtime sent to ${phone}` });
      setBalance(data.newBalance);
      setPhone('');
      setAmount('');
      setCustomAmount('');
      fetchBalance(); // Refresh balance

    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Something went wrong' });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-text-primary">Loading...</div>;
  if (!user) return null;

  return (
    <>
      <Head>
        <title>Buy Airtime · KJ Exchange</title>
      </Head>
      <DashboardLayout>
        <div className="max-w-md mx-auto space-y-6 pb-20">
          <div>
            <h1 className="text-2xl font-bold">Buy Airtime</h1>
            <p className="text-text-muted text-sm">Instant airtime top-up for all networks</p>
          </div>

          {/* Balance Card */}
          <div className="glass rounded-2xl p-4 border border-border">
            <p className="text-text-muted text-sm">Wallet Balance</p>
            <p className="text-2xl font-bold">
              {isWalletLoading ? '...' : `₦${balance.toLocaleString()}`}
            </p>
          </div>

          {/* Message */}
          {message.text && (
            <div className={`p-4 rounded-xl ${
              message.type === 'success' ? 'bg-green-400/10 text-green-400 border border-green-400/20' : 'bg-red-400/10 text-red-400 border border-red-400/20'
            }`}>
              {message.text}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleBuyAirtime} className="space-y-5">
            {/* Network Selection */}
            <div>
              <label className="block text-text-muted text-sm font-medium mb-2">Select Network</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {networks.map((net) => (
                  <button
                    key={net.id}
                    type="button"
                    onClick={() => setNetwork(net.id)}
                    className={`p-3 rounded-xl border text-center transition ${
                      network === net.id
                        ? 'border-orange bg-orange/10 text-orange'
                        : 'border-border text-text-muted hover:border-orange/50'
                    }`}
                  >
                    <i className={`${net.icon} text-xl block mb-1`} style={{ color: network === net.id ? '#FF7300' : net.color }}></i>
                    <span className="text-sm font-semibold">{net.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-text-muted text-sm font-medium mb-2">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="08012345678"
                className="w-full px-4 py-3 rounded-xl bg-black/30 border border-border focus:border-orange outline-none transition text-text-primary placeholder-text-muted"
                maxLength="11"
              />
            </div>

            {/* Amount Selection */}
            <div>
              <label className="block text-text-muted text-sm font-medium mb-2">Select Amount</label>
              <div className="grid grid-cols-3 gap-2">
                {amountPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleAmountSelect(preset)}
                    className={`p-2 rounded-xl border text-sm font-semibold transition ${
                      amount === preset.toString()
                        ? 'border-orange bg-orange/10 text-orange'
                        : 'border-border text-text-muted hover:border-orange/50'
                    }`}
                  >
                    ₦{preset.toLocaleString()}
                  </button>
                ))}
              </div>

              <div className="mt-2">
                <input
                  type="number"
                  value={customAmount}
                  onChange={handleCustomAmount}
                  placeholder="Custom amount"
                  className="w-full px-4 py-3 rounded-xl bg-black/30 border border-border focus:border-orange outline-none transition text-text-primary placeholder-text-muted"
                  min="1"
                />
              </div>
            </div>

            {/* Buy Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 rounded-xl font-bold transition ${
                isLoading
                  ? 'bg-orange/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-lg hover:shadow-orange/30'
              } text-white`}
            >
              {isLoading ? (
                <i className="fa-solid fa-spinner fa-spin"></i>
              ) : (
                'Buy Airtime'
              )}
            </button>

            <p className="text-xs text-text-muted text-center">
              <i className="fa-solid fa-shield-alt text-green-400 mr-1"></i>
              Secure transaction. Deducted from your wallet.
            </p>
          </form>
        </div>
      </DashboardLayout>
    </>
  );
}
