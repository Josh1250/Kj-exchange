import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 🔐 Verify webhook signature (security)
  const signature = req.headers['verif-hash'];
  const secretHash = process.env.FLUTTERWAVE_WEBHOOK_HASH;
  if (!signature || signature !== secretHash) {
    console.error('Invalid webhook signature');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const body = req.body;
    console.log('Webhook received:', JSON.stringify(body, null, 2));

    // Handle charge.completed events (card payments)
    if (body.event === 'charge.completed' && body.data.status === 'successful') {
      const { tx_ref, amount, currency, customer } = body.data;
      
      // Update transaction
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('payment_reference', tx_ref)
        .select()
        .single();

      if (txError) {
        console.error('Transaction update error:', txError);
        return res.status(200).json({ received: true });
      }

      if (txData) {
        const field = currency === 'USD' ? 'usd_balance' : currency === 'GHS' ? 'ghs_balance' : 'balance';
        const { data: wallet } = await supabase
          .from('wallets')
          .select(field)
          .eq('user_id', txData.user_id)
          .single();

        const newBalance = (wallet?.[field] || 0) + amount;
        await supabase
          .from('wallets')
          .update({ [field]: newBalance })
          .eq('user_id', txData.user_id);

        await supabase
          .from('notifications')
          .insert({
            user_id: txData.user_id,
            message: `💰 Wallet topped up with ${currency} ${amount.toLocaleString()}`,
          });

        console.log(`✅ Credited ${amount} ${currency} to user ${txData.user_id}`);
      }
    }

    // Handle transfer.completed events (bank transfers to virtual account)
    if (body.event === 'transfer.completed' && body.data.status === 'successful') {
      const { account_number, amount, currency, reference } = body.data;

      // Find user by virtual account number
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('virtual_account_number', account_number)
        .single();

      if (userError || !userData) {
        console.error('User not found for account:', account_number);
        return res.status(200).json({ received: true });
      }

      const field = currency === 'USD' ? 'usd_balance' : currency === 'GHS' ? 'ghs_balance' : 'balance';
      const { data: wallet } = await supabase
        .from('wallets')
        .select(field)
        .eq('user_id', userData.id)
        .single();

      const newBalance = (wallet?.[field] || 0) + amount;
      await supabase
        .from('wallets')
        .update({ [field]: newBalance })
        .eq('user_id', userData.id);

      await supabase
        .from('transactions')
        .insert({
          user_id: userData.id,
          type: 'deposit',
          amount: amount,
          currency: currency || 'NGN',
          status: 'completed',
          payment_reference: reference,
        });

      await supabase
        .from('notifications')
        .insert({
          user_id: userData.id,
          message: `💰 Wallet topped up with ${currency} ${amount.toLocaleString()} via bank transfer`,
        });

      console.log(`✅ Credited ${amount} ${currency} to user ${userData.id} via bank transfer`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
