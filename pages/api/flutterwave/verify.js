// pages/api/flutterwave/verify.js
import { verifyPayment } from '../../../lib/flutterwave';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { transaction_id, status } = req.body;

    if (!transaction_id) {
      return res.status(400).json({ error: 'Missing transaction_id' });
    }

    // If Flutterwave says it was cancelled or failed, just return
    if (status === 'cancelled') {
      return res.status(200).json({ success: false, message: 'Payment was cancelled' });
    }

    // 1. Verify with Flutterwave
    const verification = await verifyPayment(transaction_id);

    if (verification.status !== 'success') {
      return res.status(400).json({
        success: false,
        message: verification.message || 'Verification failed',
      });
    }

    const { data } = verification;
    const { tx_ref, amount, currency, customer } = data;

    // 2. Find the transaction in your database using payment_reference
    // We need to create a Supabase client with admin privileges to update
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY, // Use service role for updates
      {
        auth: { persistSession: false, autoRefreshToken: false },
      }
    );

    // Find the transaction
    const { data: txData, error: findError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('payment_reference', tx_ref)
      .single();

    if (findError || !txData) {
      console.error('Transaction not found:', tx_ref);
      return res.status(404).json({
        success: false,
        message: 'Transaction not found in our system.',
      });
    }

    // If already completed, return success
    if (txData.status === 'completed') {
      return res.status(200).json({ success: true, message: 'Already completed.' });
    }

    // 3. Update transaction to completed
    const { error: updateTxError } = await supabaseAdmin
      .from('transactions')
      .update({ status: 'completed' })
      .eq('id', txData.id);

    if (updateTxError) throw updateTxError;

    // 4. Credit wallet
    const field = currency === 'USD' ? 'usd_balance' : currency === 'GHS' ? 'ghs_balance' : 'balance';
    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select(field)
      .eq('user_id', txData.user_id)
      .single();

    const newBalance = (wallet?.[field] || 0) + amount;
    const { error: walletError } = await supabaseAdmin
      .from('wallets')
      .update({ [field]: newBalance })
      .eq('user_id', txData.user_id);

    if (walletError) throw walletError;

    // 5. Create notification
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: txData.user_id,
        message: `💰 Wallet topped up with ${currency} ${amount.toLocaleString()}`,
      });

    return res.status(200).json({
      success: true,
      message: 'Payment verified and wallet credited.',
      amount,
      currency,
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}
