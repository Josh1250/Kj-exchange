import { createClient } from '@supabase/supabase-js';

// Use service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false },
  }
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, coin, network, usdAmount, cryptoAmount, rate, payout, walletAddress, autosell } = req.body;

    console.log('📦 Creating order:', { userId, coin, network, usdAmount, cryptoAmount, rate, payout, autosell });

    // Validate required fields
    if (!userId || !coin || !network || !usdAmount || !cryptoAmount || !rate || !payout) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Insert using admin client (bypasses RLS)
    const { data, error } = await supabaseAdmin
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
        autosell: autosell || false,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase insert error:', error);
      return res.status(500).json({
        error: 'Failed to create order: ' + error.message,
        details: error,
      });
    }

    res.status(200).json({
      success: true,
      orderId: data.id,
      message: 'Order created! Send crypto and wait for confirmation.',
    });
  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
