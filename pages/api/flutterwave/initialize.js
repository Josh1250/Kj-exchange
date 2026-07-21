import { initializePayment } from '../../../lib/flutterwave';
import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { amount, currency = 'NGN' } = req.body;
    // Get user from auth (you'll need to implement auth middleware)
    // For now, let's assume you pass user via req.user (you can use Supabase auth)
    // We'll simplify: get user from session or token
    const { data: { user }, error } = await supabase.auth.getUser(req.headers.authorization);
    if (error || !user) return res.status(401).json({ error: 'Unauthorized' });

    const txRef = `topup_${user.id}_${Date.now()}`;
    // Create transaction record in database
    const { data: txRecord, error: dbError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'deposit',
        amount: amount,
        status: 'pending',
        currency: currency,
        payment_reference: txRef,
        metadata: { purpose: 'wallet_topup' },
      })
      .select()
      .single();

    if (dbError) throw dbError;

    const result = await initializePayment(amount, user.email, txRef, currency);
    if (result.status === 'success') {
      res.status(200).json({ success: true, payment_link: result.data.link, reference: txRef, transaction_id: txRecord.id });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
