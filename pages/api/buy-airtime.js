import { supabase } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, network, phone, amount } = req.body;

  if (!userId || !network || !phone || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Get user's wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (walletError || !wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // 2. Call VTpass API (LIVE)
    const vtpassResponse = await fetch('https://vtpass.com/api/pay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${process.env.VTPASS_EMAIL}:${process.env.VTPASS_PASSWORD}`).toString('base64')}`,
      },
      body: JSON.stringify({
        serviceID: network, // 'mtn', 'glo', 'airtel', '9mobile'
        phone: phone,
        amount: amount,
        request_id: `airtime_${Date.now()}_${userId}`,
      }),
    });

    const vtpassData = await vtpassResponse.json();

    if (!vtpassResponse.ok) {
      console.error('VTpass error:', vtpassData);
      return res.status(500).json({ error: vtpassData.message || 'VTpass transaction failed' });
    }

    // 3. Deduct from wallet (only on success)
    const newBalance = wallet.balance - amount;

    const { error: updateError } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Wallet update error:', updateError);
      return res.status(500).json({ error: 'Failed to update wallet' });
    }

    // 4. Create transaction record
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'airtime',
        amount: -amount,
        currency: 'NGN',
        status: 'completed',
        metadata: {
          network: network,
          phone: phone,
          amount: amount,
          vtpass_reference: vtpassData.data?.transactionId || 'unknown',
        },
        description: `Airtime purchase - ${network} ${phone}`,
        created_at: new Date().toISOString(),
      });

    if (txError) {
      console.error('Transaction record error:', txError);
      // Don't fail the request — the money is already deducted
    }

    return res.status(200).json({
      success: true,
      newBalance: newBalance,
      message: `Airtime purchased successfully`,
      transaction: vtpassData.data,
    });

  } catch (error) {
    console.error('Airtime purchase error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
