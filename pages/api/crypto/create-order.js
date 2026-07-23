import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, coin, network, usdAmount, cryptoAmount, rate, payout, walletAddress } = req.body;

    if (!userId || !coin || !network || !usdAmount || !cryptoAmount || !rate || !payout) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: order, error } = await supabase
      .from('crypto_orders')
      .insert({
        user_id: userId,
        coin,
        network,
        address: walletAddress,
        usd_amount: usdAmount,
        crypto_amount: cryptoAmount,
        rate,
        payout_ngn: payout,
        status: 'pending_confirmation',
      })
      .select()
      .single();

    if (error) {
      console.error('DB error:', error);
      return res.status(500).json({ error: 'Failed to create order' });
    }

    res.status(200).json({
      success: true,
      orderId: order.id,
      message: 'Order created! Send crypto and wait for admin confirmation.',
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: error.message });
  }
}
