import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, coin, amountUsd, rate, payout } = req.body;

  if (!userId || !coin || !amountUsd || !rate || !payout) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Check user's crypto balance
    const coinLower = coin.toLowerCase();
    const { data: wallet, error: walletError } = await supabase
      .from('crypto_balances')
      .select(coinLower)
      .eq('user_id', userId)
      .single();

    if (walletError || !wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    if (wallet[coinLower] < amountUsd) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // 2. Deduct crypto
    const newBalance = wallet[coinLower] - amountUsd;
    const { error: updateError } = await supabase
      .from('crypto_balances')
      .update({ [coinLower]: newBalance })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Balance update error:', updateError);
      return res.status(500).json({ error: 'Failed to update balance' });
    }

    // 3. Credit Naira wallet
    const { data: nairaWallet, error: nairaError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (nairaError) {
      console.error('Naira wallet error:', nairaError);
      return res.status(500).json({ error: 'Failed to credit Naira wallet' });
    }

    const newNairaBalance = (nairaWallet?.balance || 0) + payout;
    const { error: nairaUpdateError } = await supabase
      .from('wallets')
      .update({ balance: newNairaBalance })
      .eq('user_id', userId);

    if (nairaUpdateError) {
      console.error('Naira update error:', nairaUpdateError);
      // Try to rollback crypto? For now, log it.
      return res.status(500).json({ error: 'Failed to credit Naira wallet' });
    }

    // 4. Create transaction record
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'crypto_sell',
        amount: payout,
        currency: 'NGN',
        status: 'completed',
        metadata: {
          coin: coin,
          amount_usd: amountUsd,
          rate: rate,
          payout: payout,
        },
        description: `Sold ${amountUsd} ${coin} for ₦${payout.toFixed(2)}`,
        created_at: new Date().toISOString(),
      });

    if (txError) {
      console.error('Transaction record error:', txError);
      // Don't fail the request — the money is already moved
    }

    return res.status(200).json({
      success: true,
      newBalance: newBalance,
      newNairaBalance: newNairaBalance,
      payout: payout,
      message: `Successfully sold ${coin}`,
    });

  } catch (error) {
    console.error('Sell error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
