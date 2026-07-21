import { initializePayment } from '../../../lib/flutterwave';
import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  console.log('🔵 API called: /api/flutterwave/initialize');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency = 'NGN' } = req.body;
    console.log('📦 Request body:', { amount, currency });

    // Get user from session using Supabase's built-in helper
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('❌ Auth error:', authError);
      return res.status(401).json({ error: 'Unauthorized', details: authError.message });
    }

    if (!user) {
      console.error('❌ No user found');
      return res.status(401).json({ error: 'Unauthorized: No user' });
    }

    console.log('✅ User authenticated:', user.email);

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const txRef = `topup_${user.id}_${Date.now()}`;

    // Create transaction record
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

    if (dbError) {
      console.error('❌ DB error:', dbError);
      return res.status(500).json({ error: 'Database error: ' + dbError.message });
    }

    console.log('✅ Transaction record created:', txRecord.id);

    // Initialize Flutterwave
    const result = await initializePayment(amount, user.email, txRef, currency);
    console.log('✅ Flutterwave response:', JSON.stringify(result, null, 2));

    if (result.status === 'success') {
      res.status(200).json({
        success: true,
        payment_link: result.data.link,
        reference: txRef,
        transaction_id: txRecord.id,
      });
    } else {
      console.error('❌ Flutterwave error:', result);
      res.status(400).json({
        success: false,
        message: result.message || 'Flutterwave initialization failed',
        details: result,
      });
    }
  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: error.stack,
    });
  }
}
