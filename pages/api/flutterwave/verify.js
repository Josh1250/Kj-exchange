import { verifyPayment } from '../../../lib/flutterwave';
import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { transaction_id } = req.body;
    const result = await verifyPayment(transaction_id);
    if (result.status === 'success' && result.data.status === 'successful') {
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('payment_reference', result.data.tx_ref)
        .select()
        .single();
      if (txError) throw txError;
      // Credit wallet
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance, usd_balance, ghs_balance')
        .eq('user_id', txData.user_id)
        .single();
      const field = txData.currency === 'USD' ? 'usd_balance' : txData.currency === 'GHS' ? 'ghs_balance' : 'balance';
      await supabase
        .from('wallets')
        .update({ [field]: (wallet[field] || 0) + txData.amount })
        .eq('user_id', txData.user_id);
      await supabase
        .from('notifications')
        .insert({ user_id: txData.user_id, message: `💰 Wallet topped up with ${txData.currency} ${txData.amount.toLocaleString()}` });
      res.status(200).json({ success: true });
    } else {
      res.status(400).json({ success: false, message: 'Payment verification failed' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
