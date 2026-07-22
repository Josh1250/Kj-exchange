import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from '../../components/layout/AdminLayout';
import Head from 'next/head';

export default function AdminOrders() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  // ... auth check same as before (localStorage bypass)

  const fetchOrders = async () => { /* ... */ };

  const handleVerify = async (orderId, userId, valueNgn) => {
    if (processing) return;
    setProcessing(orderId);
    try {
      // 1. Update order
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'verified' })
        .eq('id', orderId);
      if (orderError) throw new Error(orderError.message);

      // 2. Wallet update (same as before)
      let { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .maybeSingle();
      let newBalance = (wallet?.balance || 0) + valueNgn;
      if (wallet) {
        await supabase.from('wallets').update({ balance: newBalance }).eq('user_id', userId);
      } else {
        await supabase.from('wallets').insert({ user_id: userId, balance: newBalance });
      }

      // 3. Transaction record
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'trade_credit',
        amount: valueNgn,
        status: 'completed',
        metadata: { order_id: orderId },
      });

      // 4. Notification with logging
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          message: `✅ Your order #${orderId.slice(0,8)} has been verified! ₦${valueNgn.toLocaleString()} credited.`,
        });
      if (notifError) console.error('Notification insert error:', notifError);

      alert('✅ Order verified and wallet credited!');
      await fetchOrders();
    } catch (err) {
      console.error('Verification error:', err);
      alert('❌ Failed to verify order: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (orderId, userId) => {
    if (processing) return;
    setProcessing(orderId);
    try {
      await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId);
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          message: `❌ Your order #${orderId.slice(0,8)} has been rejected. Contact support.`,
        });
      if (notifError) console.error('Notification insert error:', notifError);
      alert('❌ Order rejected.');
      await fetchOrders();
    } catch (err) {
      console.error('Rejection error:', err);
      alert('Failed to reject order: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  // ... render (same as before)
}
