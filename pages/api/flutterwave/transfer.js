import { initiateTransfer } from '../../../lib/flutterwave';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }
    const token = authHeader.split(' ')[1];

    const supabaseServer = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    );

    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { amount, currency, bank_code, account_number, account_name } = req.body;

    // Validate balance
    const field = currency === 'USD' ? 'usd_balance' : currency === 'GHS' ? 'ghs_balance' : 'balance';
    const { data: wallet } = await supabaseServer
      .from('wallets')
      .select(field)
      .eq('user_id', user.id)
      .single();

    if (!wallet || wallet[field] < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    // Initiate transfer
    const result = await initiateTransfer(amount, bank_code, account_number, account_name, currency);

    if (result.status === 'success') {
      // Deduct balance
      await supabaseServer
        .from('wallets')
        .update({ [field]: wallet[field] - amount })
        .eq('user_id', user.id);

      // Record transaction
      await supabaseServer
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
