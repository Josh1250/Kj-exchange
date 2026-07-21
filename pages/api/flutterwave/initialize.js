import { initializePayment } from '../../../lib/flutterwave';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];

    // 2. Create a Supabase client with the token
    const supabaseServer = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // 3. Get the user from the token
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 4. Get amount and currency from request body
    const { amount, currency = 'NGN' } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // 5. Create transaction record in database
    const { data: txRecord, error: dbError } = await supabaseServer
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'deposit',
        amount: amount,
        status: 'pending',
        currency: currency,
        payment_reference: `topup_${user.id}_${Date.now()}`,
        metadata: { purpose: 'wallet_topup' },
      })
      .select()
      .single();

    if (dbError) {
      console.error('DB error:', dbError);
      return res.status(500).json({ error: 'Database error' });
    }

    // 6. Initialize Flutterwave payment
    const txRef = `topup_${user.id}_${Date.now()}`;
    const result = await initializePayment(amount, user.email, txRef, currency);

    if (result.status === 'success') {
      res.status(200).json({
        success: true,
        payment_link: result.data.link,
        reference: txRef,
        transaction_id: txRecord.id,
      });
    } else {
      console.error('Flutterwave error:', result);
      res.status(400).json({
        success: false,
        message: result.message || 'Flutterwave initialization failed',
      });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
