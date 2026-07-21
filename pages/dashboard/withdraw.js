import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../_app';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../lib/supabaseClient';
import Head from 'next/head';

export default function Withdraw() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { currency } = router.query; // Get currency from URL

  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Dynamic fields based on currency
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [mobileMoney, setMobileMoney] = useState('');

  const isNGN = currency === 'NGN' || !currency;
  const isUSD = currency === 'USD';
  const isGHS = currency === 'GHS';

  useEffect(() => {
    if (user) {
      fetchWallet();
    }
  }, [user]);

  const fetchWallet = async () => {
    const { data } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();
    if (data) setBalance(data.balance || 0);
  };

  const handleWithdraw = async (e) => {
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
    if (amt > balance) {
      setError('Insufficient balance');
      setSubmitting(false);
      return;
    }

    // Build metadata based on currency
    const metadata = {
      currency,
      bank_name: bankName,
      account_number: accountNumber,
      account_name: accountName,
      routing_number: routingNumber,
      wallet_address: walletAddress,
      mobile_money: mobileMoney,
    };

    // Create withdrawal transaction (pending)
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'withdrawal',
        amount: -amt,
        status: 'pending',
        metadata,
      });

    if (txError) {
      setError('Failed to process withdrawal');
      console.error(txError);
    } else {
      // Deduct balance immediately (or after admin approval)
      await supabase
        .from('wallets')
        .update({ balance: balance - amt })
        .eq('user_id', user.id);
      setSuccess(`Withdrawal of ${currency} ${amt.toLocaleString()} initiated!`);
      setAmount('');
      setBalance(balance - amt);
    }
    setSubmitting(false);
  };

  if (loading) return <div>Loading...</div>;
  if (!user) {
    router.push('/auth/login');
    return null;
  }

  return (
    <>
      <Head><title>Withdraw · KJ Exchange</title></Head>
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Withdraw {currency || 'NGN'}</h1>
          <div className="bg-bg-card rounded-2xl p-6 border border-border">
            <div className="flex justify-between items-center mb-4">
              <p className="text-text-muted">Available Balance</p>
              <p className="text-xl font-bold">{currency || '₦'}{balance.toLocaleString()}</p>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                  placeholder="Enter amount"
                  required
                  min="1"
                  step="any"
                />
              </div>

              {/* NGN Fields */}
              {isNGN && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                      placeholder="e.g., GTBank"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Account Number</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                      placeholder="10-digit account number"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Account Name</label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                      placeholder="Account holder name"
                      required
                    />
                  </div>
                </>
              )}

              {/* USD Fields */}
              {isUSD && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Bank Name (US)</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                      placeholder="e.g., Chase Bank"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Account Number</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                      placeholder="US account number"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Routing Number</label>
                    <input
                      type="text"
                      value={routingNumber}
                      onChange={(e) => setRoutingNumber(e.target.value)}
                      className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                      placeholder="9-digit routing number"
                      required
                    />
                  </div>
                </>
              )}

              {/* GHS Fields */}
              {isGHS && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Bank Name (Ghana)</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                      placeholder="e.g., Ecobank Ghana"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Account Number</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                      placeholder="Ghana account number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Mobile Money (Optional)</label>
                    <input
                      type="text"
                      value={mobileMoney}
                      onChange={(e) => setMobileMoney(e.target.value)}
                      className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                      placeholder="e.g., 0241234567 (MTN MoMo)"
                    />
                  </div>
                </>
              )}

              {error && <p className="text-red-400 text-sm">{error}</p>}
              {success && <p className="text-green-400 text-sm">{success}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-orange text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition disabled:opacity-50 shadow-lg shadow-orange/20"
              >
                {submitting ? 'Processing...' : 'Withdraw Now'}
              </button>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
