import { verifyPayment } from '../../../lib/flutterwave';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get auth token from header
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

    const { transaction_id } = req.body;
    if (!transaction_id) {
      return res.status(400).json({ error: 'Missing transaction ID' });
    }

    // Verify with Flutterwave
    const result = await verifyPayment(transaction_id);
    console.log('Flutterwave verify response:', result);

    if (result.status === 'success' && result.data.status === 'successful') {
      // Update transaction record
      const { data: txData, error: txError } = await supabaseServer
        .from('transactions')
        .update({ status: 'completed' })
        .eq('payment_reference', result.data.tx_ref)
        .select()
        .single();

      if (txError) {
        console.error('Transaction update error:', txError);
        return res.status(500).json({ error: 'Failed to update transaction' });
      }

      // Credit wallet
      const field = txData.currency === 'USD' ? 'usd_balance' : txData.currency === 'GHS' ? 'ghs_balance' : 'balance';
      const { data: wallet } = await supabaseServer
        .from('wallets')
        .select(field)
        .eq('user_id', txData.user_id)
        .single();

      await supabaseServer
        .from('wallets')
        .update({ [field]: (wallet[field] || 0) + txData.amount })
        .eq('user_id', txData.user_id);

      // Create notification
      await supabaseServer
        .from('notifications')
        .insert({
          user_id: txData.user_id,
          message: `💰 Wallet topped up with ${txData.currency} ${txData.amount.toLocaleString()}`,
        });

      return res.status(200).json({
        success: true,
        message: 'Payment verified and wallet credited.',
        amount: txData.amount,
        currency: txData.currency,
      });
    } else {
      // Payment failed or pending
      const { data: txData } = await supabaseServer
        .from('transactions')
        .update({ status: 'failed' })
        .eq('payment_reference', result.data?.tx_ref || '')
        .select();

      return res.status(400).json({
        success: false,
        message: result.data?.status || 'Payment verification failed',
      });
    }
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
}
