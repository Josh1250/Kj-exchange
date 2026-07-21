import { useState, useEffect } from 'react';
import { useRouter } from 'next/router'; // ✅ ADD THIS
import { useAuth } from '../_app';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';
import Head from 'next/head';

export default function Withdraw() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWalletAndProfile();
    }
  }, [user]);

  const fetchWalletAndProfile = async () => {
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();
    if (wallet) setBalance(wallet.balance || 0);

    const { data: profile } = await supabase
      .from('users')
      .select('bank_name, account_number, account_name')
      .eq('id', user.id)
      .single();
    if (profile) {
      setBankName(profile.bank_name || '');
      setAccountNumber(profile.account_number || '');
      setAccountName(profile.account_name || '');
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError('Enter a valid amount');
      setSubmitting(false);
      return;
    }
    if (amt > balance) {
      setError('Insufficient balance');
      setSubmitting(false);
      return;
    }
    if (!bankName || !accountNumber || !accountName) {
      setError('Please update your bank details in settings first.');
      setSubmitting(false);
      return;
    }

    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'withdrawal',
        amount: -amt,
        status: 'pending',
        metadata: {
          bank_name: bankName,
          account_number: accountNumber,
          account_name: accountName,
        },
      });

    if (txError) {
      setError('Failed to process withdrawal.');
      console.error(txError);
    } else {
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ balance: balance - amt })
        .eq('user_id', user.id);
      if (updateError) {
        setError('Failed to update balance.');
      } else {
        setSuccess(`Withdrawal of ₦${amt.toLocaleString()} initiated!`);
        setAmount('');
        setBalance(balance - amt);
      }
    }
    setSubmitting(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-text-primary">Loading...</div>;
  if (!user) {
    router.push('/auth/login');
    return null;
  }

  return (
    <>
      <Head>
        <title>Withdraw · KJ Exchange</title>
      </Head>
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Withdraw</h1>

          <div className="bg-bg-card rounded-2xl p-6 border border-border space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-text-muted text-sm">Available Balance</p>
              <p className="text-2xl font-bold">₦{balance.toLocaleString()}</p>
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="font-semibold mb-4">Withdraw to Bank Account</h3>
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full bg-black/40 border border-border rounded-lg px-4 py-2 text-text-primary focus:border-orange focus:outline-none"
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
                    className="w-full bg-black/40 border border-border rounded-lg px-4 py-2 text-text-primary focus:border-orange focus:outline-none"
                    placeholder="Enter 10-digit account number"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Account Name</label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="w-full bg-black/40 border border-border rounded-lg px-4 py-2 text-text-primary focus:border-orange focus:outline-none"
                    placeholder="Account holder name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Amount (₦)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-black/40 border border-border rounded-lg px-4 py-2 text-text-primary focus:border-orange focus:outline-none"
                    placeholder="Enter amount"
                    required
                    min="100"
                  />
                </div>

                {error && <p className="text-red-400 text-sm"><i className="fa-solid fa-triangle-exclamation mr-1"></i>{error}</p>}
                {success && <p className="text-green-400 text-sm"><i className="fa-regular fa-circle-check mr-1"></i>{success}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-orange text-white font-bold py-3 rounded-full hover:bg-orange-600 transition disabled:opacity-50"
                >
                  {submitting ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Processing...</> : 'Withdraw Now'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
