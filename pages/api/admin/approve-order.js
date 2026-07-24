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
    const { orderId, adminId, action } = req.body; // action: 'approve' or 'reject'

    if (!orderId || !adminId) {
      return res.status(400).json({ error: 'Missing orderId or adminId' });
    }

    // 1. Get the order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Order already processed' });
    }

    if (action === 'reject') {
      // Reject order
      await supabaseAdmin
        .from('orders')
        .update({ status: 'rejected' })
        .eq('id', orderId);

      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: order.user_id,
          message: `❌ Your ${order.asset} gift card sale was rejected. Please contact support.`,
        });

      return res.status(200).json({ success: true, message: 'Order rejected.' });
    }

    // 2. Approve: credit user's Naira wallet
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', order.user_id)
      .single();

    if (walletError) {
      console.error('Wallet fetch error:', walletError);
      return res.status(500).json({ error: 'Failed to fetch wallet' });
    }

    const newBalance = (wallet?.balance || 0) + order.value_ngn;

    const { error: updateError } = await supabaseAdmin
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', order.user_id);

    if (updateError) {
      console.error('Wallet update error:', updateError);
      return res.status(500).json({ error: 'Failed to update wallet' });
    }

    // 3. Add gift points if not already added
    // Check if points were already added (we add them on order submission)
    // We'll check if there's a gift_point_transaction for this order
    const { data: existingPoints } = await supabaseAdmin
      .from('gift_point_transactions')
      .select('id')
      .eq('metadata->order_id', order.id)
      .maybeSingle();

    if (!existingPoints) {
      const giftPoints = Math.floor(order.value_ngn / 60);
      if (giftPoints > 0) {
        await supabaseAdmin
          .from('gift_point_transactions')
          .insert({
            user_id: order.user_id,
            amount: giftPoints,
            type: 'gift_card_sale',
            metadata: { order_id: order.id },
          });
      }
    }

    // 4. Update order status
    await supabaseAdmin
      .from('orders')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        approved_by: adminId,
      })
      .eq('id', orderId);

    // 5. Create transaction record
    await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: order.user_id,
        type: 'gift_card_sale',
        amount: order.value_ngn,
        currency: 'NGN',
        status: 'completed',
        metadata: {
          order_id: order.id,
          asset: order.asset,
          amount_usd: order.amount,
          rate: order.rate,
        },
      });

    // 6. Send notification
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: order.user_id,
        message: `✅ Your ${order.asset} gift card sale of ₦${order.value_ngn.toLocaleString()} has been approved!`,
      });

    res.status(200).json({
      success: true,
      message: 'Order approved and user credited.',
    });
  } catch (error) {
    console.error('Approve order error:', error);
    res.status(500).json({ error: error.message });
  }
}
