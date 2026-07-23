import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId, adminId } = req.body;

    if (!orderId || !adminId) {
      return res.status(400).json({ error: 'Missing orderId or adminId' });
    }

    // 1. Get the order
    const { data: order, error: orderError } = await supabase
      .from('crypto_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'pending_confirmation') {
      return res.status(400).json({ error: 'Order already processed' });
    }

    // 2. Credit user's Naira wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', order.user_id)
      .single();

    if (walletError) {
      console.error('Wallet fetch error:', walletError);
      return res.status(500).json({ error: 'Failed to fetch wallet' });
    }

    const newBalance = (wallet?.balance || 0) + order.payout_ngn;

    const { error: updateError } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', order.user_id);

    if (updateError) {
      console.error('Wallet update error:', updateError);
      return res.status(500).json({ error: 'Failed to update wallet' });
    }

    // 3. Add to crypto_balances (so user can keep coins)
    const { data: existingBalance } = await supabase
      .from('crypto_balances')
      .select('balance')
      .eq('user_id', order.user_id)
      .eq('coin', order.coin)
      .maybeSingle();

    if (existingBalance) {
      await supabase
        .from('crypto_balances')
        .update({ balance: existingBalance.balance + order.crypto_amount })
        .eq('user_id', order.user_id)
        .eq('coin', order.coin);
    } else {
      await supabase
        .from('crypto_balances')
        .insert({
          user_id: order.user_id,
          coin: order.coin,
          balance: order.crypto_amount || 0,
        });
    }

    // 4. Update order status
    await supabase
      .from('crypto_orders')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        approved_by: adminId,
      })
      .eq('id', orderId);

    // 5. Create transaction record
    await supabase
      .from('transactions')
      .insert({
        user_id: order.user_id,
        type: 'crypto_deposit',
        amount: order.payout_ngn,
        currency: 'NGN',
        status: 'completed',
        metadata: {
          coin: order.coin,
          network: order.network,
          usd_amount: order.usd_amount,
          rate: order.rate,
          order_id: order.id,
          crypto_amount: order.crypto_amount,
        },
      });

    // 6. Send notification
    await supabase
      .from('notifications')
      .insert({
        user_id: order.user_id,
        message: `✅ Your ${order.coin} deposit of ₦${order.payout_ngn.toLocaleString()} has been confirmed!`,
      });

    res.status(200).json({
      success: true,
      message: `Deposit approved! User credited ₦${order.payout_ngn.toLocaleString()}`,
    });
  } catch (error) {
    console.error('Approve deposit error:', error);
    res.status(500).json({ error: error.message });
  }
}
