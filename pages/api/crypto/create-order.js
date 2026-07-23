import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, coin, network, usdAmount, cryptoAmount, rate, payout, walletAddress } = req.body;

    console.log('📦 Creating order with:', { userId, coin, network, usdAmount, cryptoAmount, rate, payout, walletAddress });

    const insertData = {
      user_id: userId,
      coin,
      network,
      address: walletAddress,
      usd_amount: usdAmount,
      crypto_amount: cryptoAmount,
      rate,
      payout_ngn: payout,
      status: 'pending_confirmation',
    };

    const { data, error } = await supabase
      .from('crypto_orders')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error:', error);
      return res.status(500).json({ 
        error: 'Failed to create order: ' + error.message,
        details: error,
      });
    }

    res.status(200).json({
      success: true,
      orderId: data.id,
      message: 'Order created! Send crypto and wait for admin confirmation.',
    });
  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
