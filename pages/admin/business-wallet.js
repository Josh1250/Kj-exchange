import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from '../../components/layout/AdminLayout';
import Head from 'next/head';
import Link from 'next/link';

export default function BusinessWallet() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [balances, setBalances] = useState({ NGN: 0, USD: 0 });
  const [withdrawals, setWithdrawals] = useState([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBank, setWithdrawBank] = useState('');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [withdrawName, setWithdrawName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }
      const { data, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();
      if (error || !data?.is_admin) {
        router.push('/dashboard');
        return;
      }
      setIsAdmin(true);
      setLoading(false);
      fetchBusinessWallet();
      fetchWithdrawals();
    };
    checkAuth();
  }, [router]);

  const fetchBusinessWallet = async () => {
    try {
      const { data, error } = await supabase
        .from('business_wallets')
        .select('*');
      if (!error && data) {
        const balancesObj = {};
        data.forEach(item => {
          balancesObj[item.currency] = item.balance || 0;
        });
        setBalances(balancesObj);
      }
    } catch (err) {
      console.error('Error fetching business wallet:', err);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from('business_withdrawals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (!error && data) {
        setWithdrawals(data);
      }
    } catch (err) {
      console.error('Error fetching withdrawals:', err);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0) {
      setError('Enter a valid amount');
      setSubmitting(false);
      return;
    }
    if (amt > balances.NGN) {
      setError(`Insufficient balance. You have ₦${balances.NGN.toLocaleString()}`);
      setSubmitting(false);
      return;
    }

    try {
      // 1. Deduct from business wallet
      const newBalance = balances.NGN - amt;
      await supabase
        .from('business_wallets')
        .update({ balance: newBalance })
        .eq('currency', 'NGN');

      // 2. Create withdrawal record
      await supabase
        .from('business_withdrawals')
        .insert({
          amount: amt,
          currency: 'NGN',
          bank_name: withdrawBank || 'Manual Transfer',
          account_number: withdrawAccount || 'N/A',
          account_name: withdrawName || 'Admin',
          status: 'pending',
        });

      // 3. Update local state
      setBalances(prev => ({ ...prev, NGN: newBalance }));
      setSuccess(`✅ Withdrawal of ₦${amt.toLocaleString()} initiated!`);
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      fetchWithdrawals();
    } catch (err) {
      setError('Failed to process withdrawal: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!isAdmin) return null;

  return (
    <>
      <Head><title>Business Wallet · Admin</title></Head>
      <AdminLayout>
        <div className="max-w-3xl mx-auto px-4 py-4 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Business Wallet</h1>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="bg-orange text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-orange-600 transition flex items-center gap-2"
            >
              <i className="fa-solid fa-arrow-down"></i> Withdraw
            </button>
          </div>

          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass rounded-2xl p-6 border border-border">
              <div className="flex items-center justify-between">
                <p className="text-text-muted text-sm">NGN Balance</p>
                <span className="text-xs bg-orange/10 text-orange px-2 py-0.5 rounded-full">Revenue</span>
              </div>
              <p className="text-3xl font-bold mt-2">₦{balances.NGN.toLocaleString()}</p>
            </div>
            <div className="glass rounded-2xl p-6 border border-border">
              <div className="flex items-center justify-between">
                <p className="text-text-muted text-sm">USD Balance</p>
                <span className="text-xs bg-orange/10 text-orange px-2 py-0.5 rounded-full">Revenue</span>
              </div>
              <p className="text-3xl font-bold mt-2">${balances.USD.toFixed(2)}</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="glass rounded-2xl p-4 border border-border">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-text-muted text-xs">Total Withdrawals</p>
                <p className="text-xl font-bold">{withdrawals.length}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs">Pending</p>
                <p className="text-xl font-bold text-yellow-400">
                  {withdrawals.filter(w => w.status === 'pending').length}
                </p>
              </div>
              <div>
                <p className="text-text-muted text-xs">Completed</p>
                <p className="text-xl font-bold text-green-400">
                  {withdrawals.filter(w => w.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>

          {/* Withdrawal History */}
          <div className="glass rounded-2xl p-5 border border-border">
            <h2 className="text-lg font-bold mb-4">Withdrawal History</h2>
            {withdrawals.length === 0 ? (
              <div className="text-center py-6 text-text-muted">
                <i className="fa-regular fa-clock text-3xl block mb-2 opacity-40"></i>
                <p>No withdrawals yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawals.map((w) => (
                  <div key={w.id} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-border">
                    <div>
                      <p className="font-semibold">₦{w.amount.toLocaleString()}</p>
                      <p className="text-text-muted text-xs">{w.bank_name} • {w.account_number}</p>
                      <p className="text-text-muted text-xs">{new Date(w.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        w.status === 'completed' ? 'bg-green-400/20 text-green-400' :
                        w.status === 'pending' ? 'bg-yellow-400/20 text-yellow-400' :
                        'bg-red-400/20 text-red-400'
                      }`}>
                        {w.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className="glass rounded-2xl p-4 border border-border bg-green-400/5">
            <div className="flex items-start gap-3">
              <i className="fa-solid fa-circle-info text-green-400 text-lg mt-0.5"></i>
              <div>
                <p className="font-semibold text-sm">How business wallet works</p>
                <p className="text-text-muted text-xs">
                  All fees and spreads from user conversions are automatically credited here. 
                  You can withdraw to your bank account at any time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>

      {/* ===== Withdraw Modal ===== */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-2xl max-w-md w-full p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Withdraw from Business Wallet</h2>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="text-text-muted hover:text-text-primary transition text-xl"
              >
                <i className="fa-regular fa-xmark"></i>
              </button>
            </div>

            <p className="text-text-muted text-sm mb-4">
              Available balance: <span className="font-bold text-green-400">₦{balances.NGN.toLocaleString()}</span>
            </p>

            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Amount (NGN)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full bg-black/30 border border-border rounded-xl px-4 py-3.5 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 text-base"
                  placeholder="Enter amount"
                  required
                  min="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Bank Name</label>
                <input
                  type="text"
                  value={withdrawBank}
                  onChange={(e) => setWithdrawBank(e.target.value)}
                  className="w-full bg-black/30 border border-border rounded-xl px-4 py-3.5 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 text-base"
                  placeholder="GTBank, Access Bank, etc."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Account Number</label>
                <input
                  type="text"
                  value={withdrawAccount}
                  onChange={(e) => setWithdrawAccount(e.target.value)}
                  className="w-full bg-black/30 border border-border rounded-xl px-4 py-3.5 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 text-base"
                  placeholder="Enter account number"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Account Name</label>
                <input
                  type="text"
                  value={withdrawName}
                  onChange={(e) => setWithdrawName(e.target.value)}
                  className="w-full bg-black/30 border border-border rounded-xl px-4 py-3.5 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 text-base"
                  placeholder="Enter account name"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-400/10 border border-red-400/20 rounded-xl p-3 text-red-400 text-sm flex items-center gap-2">
                  <i className="fa-solid fa-circle-exclamation"></i>
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="bg-green-400/10 border border-green-400/20 rounded-xl p-3 text-green-400 text-sm flex items-center gap-2">
                  <i className="fa-regular fa-circle-check"></i>
                  <span>{success}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 border border-border text-text-primary px-4 py-2.5 rounded-xl hover:border-orange transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-2.5 rounded-xl hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <><i className="fa-solid fa-spinner fa-spin"></i> Processing...</> : 'Withdraw'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
