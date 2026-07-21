import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../_app';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../lib/supabaseClient';
import Head from 'next/head';

export default function Withdraw() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { currency = 'NGN' } = router.query;

  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [banks, setBanks] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currencySymbol = { NGN: '₦', USD: '$', GHS: '₵' }[currency] || '₦';

  useEffect(() => {
    if (user) {
      fetchWallet();
      fetchBanks();
    }
  }, [user, currency]);

  const fetchWallet = async () => {
    const field = currency === 'USD' ? 'usd_balance' : currency === 'GHS' ? 'ghs_balance' : 'balance';
    const { data } = await supabase
      .from('wallets')
      .select(field)
      .eq('user_id', user.id)
      .single();
    if (data) setBalance(data[field] || 0);
  };

  const fetchBanks = async () => {
    try {
      const response = await fetch('/api/flutterwave/banks');
      const data = await response.json();
      if (data.status === 'success') {
        setBanks(data.data);
      }
    } catch (err) {
      console.error('Error fetching banks:', err);
    }
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

    try {
      const response = await fetch('/api/flutterwave/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          currency: currency,
          bank_code: bankCode,
          account_number: accountNumber,
          account_name: accountName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Withdrawal of ${currencySymbol}${amt.toLocaleString()} initiated!`);
        setAmount('');
        setBalance(balance - amt);
        // Refresh balance after a delay
        setTimeout(fetchWallet, 3000);
      } else {
        setError(data.message || 'Withdrawal failed. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-text-primary">Loading...</div>;
  if (!user) {
    router.push('/auth/login');
    return null;
  }

  return (
    <>
      <Head><title>Withdraw · KJ Exchange</title></Head>
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Withdraw {currency}</h1>
          <div className="bg-bg-card rounded-2xl p-6 border border-border">
            <div className="flex justify-between items-center mb-4">
              <p className="text-text-muted">Available Balance</p>
              <p className="text-xl font-bold">{currencySymbol}{balance.toLocaleString()}</p>
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

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Bank</label>
                <select
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                  required
                >
                  <option value="">Select a bank</option>
                  {banks.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                  placeholder="Enter account number"
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
