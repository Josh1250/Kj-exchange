import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

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
    const { data: order, error: orderError } = await supabaseAdmin
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

    // 2. Check if autosell was enabled
    const isAutosell = order.autosell || false;

    // 3. Credit user's Naira wallet
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', order.user_id)
      .single();

    if (walletError) {
      console.error('Wallet fetch error:', walletError);
      return res.status(500).json({ error: 'Failed to fetch wallet' });
    }

    const newBalance = (wallet?.balance || 0) + order.payout_ngn;

    const { error: updateError } = await supabaseAdmin
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', order.user_id);

    if (updateError) {
      console.error('Wallet update error:', updateError);
      return res.status(500).json({ error: 'Failed to update wallet' });
    }

    // 4. If NOT autosell → add to crypto_balances (hold crypto)
    if (!isAutosell) {
      const { data: existingBalance } = await supabaseAdmin
        .from('crypto_balances')
        .select('balance')
        .eq('user_id', order.user_id)
        .eq('coin', order.coin)
        .maybeSingle();

      if (existingBalance) {
        await supabaseAdmin
          .from('crypto_balances')
          .update({ balance: existingBalance.balance + order.crypto_amount })
          .eq('user_id', order.user_id)
          .eq('coin', order.coin);
      } else {
        await supabaseAdmin
          .from('crypto_balances')
          .insert({
            user_id: order.user_id,
            coin: order.coin,
            balance: order.crypto_amount || 0,
          });
      }
    }

    // 5. Update order status
    await supabaseAdmin
      .from('crypto_orders')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        approved_by: adminId,
      })
      .eq('id', orderId);

    // 6. Create transaction record
    const txType = isAutosell ? 'crypto_sale' : 'crypto_deposit';
    const txMessage = isAutosell
      ? `✅ Your ${order.coin} was auto-sold for ₦${order.payout_ngn.toLocaleString()}`
      : `✅ Your ${order.coin} deposit of ₦${order.payout_ngn.toLocaleString()} has been confirmed!`;

    await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: order.user_id,
        type: txType,
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
          autosell: isAutosell,
        },
      });

    // 7. Send notification
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: order.user_id,
        message: txMessage,
      });

    res.status(200).json({
      success: true,
      message: isAutosell
        ? `Deposit auto-sold! User credited ₦${order.payout_ngn.toLocaleString()}`
        : `Deposit approved! User credited ₦${order.payout_ngn.toLocaleString()} (crypto held)`,
    });
  } catch (error) {
    console.error('Approve deposit error:', error);
    res.status(500).json({ error: error.message });
  }
}
