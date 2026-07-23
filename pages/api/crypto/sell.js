import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, coin, amountUsd, rate, payout, network } = req.body;

    if (!userId || !coin || !amountUsd || !rate || !payout) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Check if user has enough crypto balance
    // (We'll add a crypto_balances table later – for now, we skip this check)
    // For now, we'll just credit their Naira wallet

    // 2. Credit Naira wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (walletError) {
      console.error('Wallet fetch error:', walletError);
      return res.status(500).json({ error: 'Failed to fetch wallet' });
    }

    const newBalance = (wallet?.balance || 0) + payout;

    const { error: updateError } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Wallet update error:', updateError);
      return res.status(500).json({ error: 'Failed to update wallet' });
    }

    // 3. Create transaction record
    await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'crypto_sale',
        amount: payout,
        currency: 'NGN',
        status: 'completed',
        metadata: { coin, amountUsd, rate, network },
      });

    // 4. Notification
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        message: `✅ ${coin} sale of ₦${payout.toLocaleString()} credited to your wallet!`,
      });

    res.status(200).json({
      success: true,
      message: `Sold ${coin} for ₦${payout.toLocaleString()}`,
      newBalance,
    });
  } catch (error) {
    console.error('Sell error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
