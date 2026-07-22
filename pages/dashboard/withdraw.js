import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../_app';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../lib/supabaseClient';
import Head from 'next/head';
import Link from 'next/link';

export default function Withdraw() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { currency = 'NGN' } = router.query;

  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [mobileMoney, setMobileMoney] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [kycLevel, setKycLevel] = useState(1);

  const currencySymbol = { NGN: '₦', USD: '$', GHS: '₵' }[currency] || '₦';
  const isNGN = currency === 'NGN';
  const isUSD = currency === 'USD';
  const isGHS = currency === 'GHS';

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }
    if (user) {
      fetchWalletAndProfile();
    }
  }, [user, loading, router, currency]);

  const fetchWalletAndProfile = async () => {
    try {
      const field = currency === 'USD' ? 'usd_balance' : currency === 'GHS' ? 'ghs_balance' : 'balance';
      const { data: wallet, error: wErr } = await supabase
        .from('wallets')
        .select(field)
        .eq('user_id', user.id)
        .maybeSingle();
      if (wErr) throw wErr;
      setBalance(wallet?.[field] || 0);

      const { data: profile, error: pErr } = await supabase
        .from('users')
        .select('bank_name, account_number, account_name, kyc_level')
        .eq('id', user.id)
        .single();
      if (pErr) throw pErr;
      if (profile) {
        setBankName(profile.bank_name || '');
        setAccountNumber(profile.account_number || '');
        setAccountName(profile.account_name || '');
        setKycLevel(profile.kyc_level || 1);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load your details. Please refresh.');
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

    // KYC check for amounts > ₦50,000 (only for NGN)
    if (isNGN && amt > 50000 && kycLevel < 2) {
      setError('KYC Level 2 required for withdrawals above ₦50,000. Complete KYC in your profile.');
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
      mobile_money: mobileMoney,
    };

    try {
      // 1. Create withdrawal transaction (pending)
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'withdrawal',
          amount: -amt,
          status: 'pending',
          currency: currency,
          metadata,
        });
      if (txError) throw new Error(txError.message);

      // 2. Deduct balance from wallet (use separate update/insert)
      const field = currency === 'USD' ? 'usd_balance' : currency === 'GHS' ? 'ghs_balance' : 'balance';
      const { data: wallet, error: wErr } = await supabase
        .from('wallets')
        .select(field)
        .eq('user_id', user.id)
        .maybeSingle();
      if (wErr) throw new Error(wErr.message);

      let newBalance = (wallet?.[field] || 0) - amt;
      if (wallet) {
        const { error: updateErr } = await supabase
          .from('wallets')
          .update({ [field]: newBalance })
          .eq('user_id', user.id);
        if (updateErr) throw new Error(updateErr.message);
      } else {
        // Should not happen, but just in case
        const { error: insertErr } = await supabase
          .from('wallets')
          .insert({ user_id: user.id, [field]: newBalance });
        if (insertErr) throw new Error(insertErr.message);
      }

      // 3. Notification
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          message: `💸 Withdrawal of ${currency} ${amt.toLocaleString()} initiated.`,
        });

      setSuccess(`Withdrawal of ${currencySymbol}${amt.toLocaleString()} initiated!`);
      setAmount('');
      setBalance(newBalance);
    } catch (err) {
      console.error('Withdrawal error:', err);
      setError('Failed to process withdrawal: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  return (
    <>
      <Head><title>Withdraw · KJ Exchange</title></Head>
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/dashboard/wallet" className="text-text-muted hover:text-text-primary transition group">
              <i className="fa-solid fa-arrow-left text-sm group-hover:-translate-x-1 transition-transform"></i>
            </Link>
            <h1 className="text-2xl font-bold">Withdraw {currency}</h1>
          </div>

          <div className="bg-bg-card rounded-2xl p-6 border border-border">
            <div className="flex justify-between items-center mb-4">
              <p className="text-text-muted text-sm">Available Balance</p>
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
                {isNGN && (
                  <p className="text-xs text-text-muted mt-1">Withdrawals above ₦50,000 require KYC Level 2.</p>
                )}
              </div>

              {/* Dynamic fields per currency */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                  placeholder={isNGN ? 'e.g., GTBank' : isUSD ? 'e.g., Chase Bank' : 'e.g., Ecobank Ghana'}
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
                  placeholder={isNGN ? '10-digit account number' : 'US account number'}
                  required
                />
              </div>

              {isNGN && (
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
              )}

              {isUSD && (
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
              )}

              {isGHS && (
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
