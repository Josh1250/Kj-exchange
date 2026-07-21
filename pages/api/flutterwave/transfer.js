import { initiateTransfer } from '../../../lib/flutterwave';
import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { amount, currency, bank_code, account_number, account_name } = req.body;
    const { data: { user } } = await supabase.auth.getUser(req.headers.authorization);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const field = currency === 'USD' ? 'usd_balance' : currency === 'GHS' ? 'ghs_balance' : 'balance';
    const { data: wallet } = await supabase
      .from('wallets')
      .select(field)
      .eq('user_id', user.id)
      .single();
    if (!wallet || wallet[field] < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    const result = await initiateTransfer(amount, bank_code, account_number, account_name, currency);
    if (result.status === 'success') {
      await supabase
        .from('wallets')
        .update({ [field]: wallet[field] - amount })
        .eq('user_id', user.id);
      await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'withdrawal',
          amount: -amount,
          currency: currency,
          status: 'completed',
          metadata: { bank_code, account_number, account_name, reference: result.data.reference },
        });
      res.status(200).json({ success: true, message: 'Withdrawal initiated successfully' });
    } else {
      res.status(400).json({ success: false, message: result.message || 'Withdrawal failed' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
