import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../../lib/supabaseClient';
import AdminLayout from '../../../components/layout/AdminLayout';
import Head from 'next/head';
import Link from 'next/link';

export default function WithdrawalDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [withdrawal, setWithdrawal] = useState(null);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  // ===== Auth Check =====
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
      if (id) fetchWithdrawal();
    };
    checkAuth();
  }, [router, id]);

  // ===== Fetch Withdrawal =====
  const fetchWithdrawal = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      // Get withdrawal with user details
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          users (
            id,
            email,
            full_name,
            phone,
            kyc_tier,
            kyc_status,
            daily_withdrawn_today
          )
        `)
        .eq('id', id)
        .eq('type', 'withdrawal')
        .single();

      if (error) throw new Error(error.message);
      if (!data) throw new Error('Withdrawal not found');

      setWithdrawal(data);
      setUserInfo(data.users);
    } catch (err) {
      setError(err.message || 'Failed to load withdrawal');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ===== Mark as Completed =====
  const markCompleted = async () => {
    if (processing || !withdrawal) return;
    if (!confirm('Mark this withdrawal as completed?')) return;

    setProcessing(true);
    try {
      // Update transaction status
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'completed', processed_at: new Date().toISOString() })
        .eq('id', withdrawal.id);
      if (error) throw new Error(error.message);

      // Send notification to user
      await supabase
        .from('notifications')
        .insert({
          user_id: withdrawal.user_id,
          message: `✅ Your withdrawal of ₦${Math.abs(withdrawal.amount).toLocaleString()} has been processed successfully.`,
        });

      alert('✅ Withdrawal marked as completed.');
      fetchWithdrawal(); // reload
    } catch (err) {
      alert('❌ Failed to mark as completed: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  // ===== Mark as Failed (With Refund) =====
  const markFailed = async () => {
    if (processing || !withdrawal) return;
    if (!confirm('Mark this withdrawal as failed? This will refund the user\'s wallet.')) return;

    setProcessing(true);
    try {
      const amt = Math.abs(withdrawal.amount);
      const fee = withdrawal.fee || 0;
      const totalRefund = amt + fee; // we deduct totalDeduction from user's wallet, so refund that

      // 1. Refund user's wallet
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', withdrawal.user_id)
        .single();

      const newBalance = (wallet?.balance || 0) + totalRefund;
      await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('user_id', withdrawal.user_id);

      // 2. Update daily withdrawal tracking (decrease daily_withdrawn_today)
      const { data: user } = await supabase
        .from('users')
        .select('daily_withdrawn_today')
        .eq('id', withdrawal.user_id)
        .single();

      const newDaily = Math.max(0, (user?.daily_withdrawn_today || 0) - amt);
      await supabase
        .from('users')
        .update({ daily_withdrawn_today: newDaily })
        .eq('id', withdrawal.user_id);

      // 3. Update transaction status to failed
      await supabase
        .from('transactions')
        .update({ status: 'failed' })
        .eq('id', withdrawal.id);

      // 4. Send notification
      await supabase
        .from('notifications')
        .insert({
          user_id: withdrawal.user_id,
          message: `❌ Your withdrawal of ₦${amt.toLocaleString()} has been rejected. Your funds have been refunded to your wallet.`,
        });

      alert('✅ Withdrawal marked as failed and funds refunded.');
      fetchWithdrawal(); // reload
    } catch (err) {
      alert('❌ Failed to mark as failed: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <i className="fa-solid fa-spinner fa-spin text-3xl text-orange"></i>
          <span className="ml-3 text-text-muted">Loading withdrawal...</span>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin || error) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto rounded-full bg-bg-card border border-border flex items-center justify-center text-text-muted text-3xl">
            <i className="fa-regular fa-circle-xmark"></i>
          </div>
          <p className="text-text-muted mt-4">{error || 'Unauthorized'}</p>
          <Link href="/admin/withdrawals" className="text-orange hover:underline mt-4 inline-block">
            ← Back to Withdrawals
          </Link>
        </div>
      </AdminLayout>
    );
  }

  if (!withdrawal) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-text-muted">Withdrawal not found.</p>
          <Link href="/admin/withdrawals" className="text-orange hover:underline mt-4 inline-block">
            ← Back to Withdrawals
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const meta = withdrawal.metadata || {};
  const currencySymbol = withdrawal.currency === 'USD' ? '$' : '₦';
  const statusColors = {
    pending: 'bg-yellow-400/20 text-yellow-400 border-yellow-400/20',
    completed: 'bg-green-400/20 text-green-400 border-green-400/20',
    failed: 'bg-red-400/20 text-red-400 border-red-400/20',
  };
  const statusIcon = {
    pending: 'fa-clock',
    completed: 'fa-circle-check',
    failed: 'fa-circle-xmark',
  };

  return (
    <>
      <Head><title>Withdrawal #{withdrawal.id.slice(0,8)} · Admin</title></Head>
      <AdminLayout>
        <div className="max-w-3xl mx-auto px-4 py-4 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link
              href="/admin/withdrawals"
              className="text-text-muted hover:text-text-primary transition group"
            >
              <i className="fa-solid fa-arrow-left text-sm group-hover:-translate-x-1 transition-transform"></i>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Withdrawal Details</h1>
              <p className="text-text-muted text-sm">Transaction #{withdrawal.id.slice(0,8)}</p>
            </div>
            <span className={`ml-auto text-xs px-3 py-1 rounded-full border ${statusColors[withdrawal.status] || 'bg-gray-400/20 text-gray-400'}`}>
              <i className={`fa-regular ${statusIcon[withdrawal.status] || 'fa-clock'} mr-1`}></i>
              {withdrawal.status || 'pending'}
            </span>
          </div>

          {/* User Info */}
          <div className="glass rounded-2xl p-5 border border-border">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">User Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-text-muted text-xs">Email</p>
                <p className="font-medium text-sm">{userInfo?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs">Full Name</p>
                <p className="font-medium text-sm">{userInfo?.full_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs">Phone</p>
                <p className="font-medium text-sm">{userInfo?.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs">KYC Tier</p>
                <p className="font-medium text-sm">Tier {userInfo?.kyc_tier || 1}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs">Today's Withdrawn</p>
                <p className="font-medium text-sm">₦{(userInfo?.daily_withdrawn_today || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Withdrawal Details */}
          <div className="glass rounded-2xl p-5 border border-border">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Transaction Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-text-muted text-xs">Amount</p>
                <p className="text-2xl font-bold">{currencySymbol}{Math.abs(withdrawal.amount).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs">Fee</p>
                <p className="font-medium text-sm">{currencySymbol}{(withdrawal.fee || 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs">Currency</p>
                <p className="font-medium text-sm">{withdrawal.currency || 'NGN'}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs">Created</p>
                <p className="font-medium text-sm">{new Date(withdrawal.created_at).toLocaleString()}</p>
              </div>
              {withdrawal.processed_at && (
                <div>
                  <p className="text-text-muted text-xs">Processed</p>
                  <p className="font-medium text-sm">{new Date(withdrawal.processed_at).toLocaleString()}</p>
                </div>
              )}
              <div>
                <p className="text-text-muted text-xs">Type</p>
                <p className="font-medium text-sm">Withdrawal</p>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="glass rounded-2xl p-5 border border-border">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Bank Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-text-muted text-xs">Bank Name</p>
                <p className="font-medium text-sm">{meta.bank_name || meta.bank_code || 'N/A'}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs">Account Number</p>
                <p className="font-medium text-sm">{meta.account_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs">Account Name</p>
                <p className="font-medium text-sm">{meta.account_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs">Narration</p>
                <p className="font-medium text-sm">{meta.narration || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          {withdrawal.status === 'pending' && (
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <button
                onClick={markCompleted}
                disabled={processing}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-green-500/20"
              >
                {processing ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-regular fa-circle-check"></i>}
                Complete & Notify User
              </button>
              <button
                onClick={markFailed}
                disabled={processing}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-red-500/20"
              >
                {processing ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-regular fa-circle-xmark"></i>}
                Reject & Refund
              </button>
            </div>
          )}

          {/* Status Info */}
          {withdrawal.status === 'completed' && (
            <div className="bg-green-400/10 border border-green-400/20 rounded-xl p-4 text-center text-green-400">
              <i className="fa-regular fa-circle-check mr-2"></i>
              This withdrawal has been completed. User has been notified.
            </div>
          )}
          {withdrawal.status === 'failed' && (
            <div className="bg-red-400/10 border border-red-400/20 rounded-xl p-4 text-center text-red-400">
              <i className="fa-regular fa-circle-xmark mr-2"></i>
              This withdrawal has been rejected. Funds have been refunded to user's wallet.
            </div>
          )}
        </div>
      </AdminLayout>
    </>
  );
}
