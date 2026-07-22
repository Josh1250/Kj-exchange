import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from '../../components/layout/AdminLayout';
import Head from 'next/head';

export default function AdminTopups() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [topups, setTopups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [filter, setFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    // ... same auth check as before
  }, [router]);

  const fetchTopups = async () => {
    // ... same fetch logic as before
  };

  const verifyTopup = async (txId, userId, amount) => {
    if (processing) return;
    setProcessing(txId);
    try {
      console.log('Verifying top-up:', txId, userId, amount);

      // 1. Update transaction status
      const { error: txError } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', txId);
      if (txError) throw new Error('Transaction update failed: ' + txError.message);

      // 2. Get current wallet balance
      let { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .maybeSingle();

      if (walletError && walletError.code !== 'PGRST116') {
        throw new Error('Wallet fetch error: ' + walletError.message);
      }

      let newBalance;
      if (wallet) {
        newBalance = (wallet.balance || 0) + amount;
        // Update existing wallet
        const { error: updateError } = await supabase
          .from('wallets')
          .update({ balance: newBalance })
          .eq('user_id', userId);
        if (updateError) throw new Error('Wallet update error: ' + updateError.message);
      } else {
        newBalance = amount;
        // Insert new wallet (admin can insert because of RLS policy)
        const { error: insertError } = await supabase
          .from('wallets')
          .insert({ user_id: userId, balance: newBalance });
        if (insertError) throw new Error('Wallet insert error: ' + insertError.message);
      }

      // 3. Send notification
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          message: `💰 Your top-up of ₦${amount.toLocaleString()} has been verified!`,
        });

      alert('✅ Top-up verified and wallet credited!');
      await fetchTopups();
    } catch (err) {
      console.error('Verification error:', err);
      alert('❌ Failed to verify top-up:\n' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  const rejectTopup = async (txId, userId) => {
    if (processing) return;
    setProcessing(txId);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'failed' })
        .eq('id', txId);
      if (error) throw new Error(error.message);

      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          message: `❌ Your top-up request was rejected. Please contact support.`,
        });

      alert('❌ Top-up rejected.');
      await fetchTopups();
    } catch (err) {
      console.error('Rejection error:', err);
      alert('Failed to reject top-up: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  // ... rest of component (UI, filters, export)
}
