import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const body = req.body;
    if (body.event === 'charge.completed' && body.data.status === 'successful') {
      const { tx_ref, amount, currency, customer } = body.data;
      // Update transaction
      const { data: txData } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('payment_reference', tx_ref)
        .select()
        .single();
      if (txData) {
        const field = currency === 'USD' ? 'usd_balance' : currency === 'GHS' ? 'ghs_balance' : 'balance';
        const { data: wallet } = await supabase
          .from('wallets')
          .select(field)
          .eq('user_id', txData.user_id)
          .single();
        await supabase
          .from('wallets')
          .update({ [field]: (wallet[field] || 0) + amount })
          .eq('user_id', txData.user_id);
        await supabase
          .from('notifications')
          .insert({ user_id: txData.user_id, message: `💰 Wallet topped up via webhook with ${currency} ${amount.toLocaleString()}` });
      }
    }
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
