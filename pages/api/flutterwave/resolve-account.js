import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { account_number, bank_code } = req.body;
    if (!account_number || !bank_code) {
      return res.status(400).json({ error: 'Missing account_number or bank_code' });
    }

    const response = await fetch('https://api.flutterwave.com/v3/accounts/resolve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
      },
      body: JSON.stringify({
        account_number: account_number,
        bank_code: bank_code,
      }),
    });

    const data = await response.json();

    if (data.status === 'success') {
      res.status(200).json({ status: 'success', data: data.data });
    } else {
      res.status(400).json({ status: 'error', message: data.message || 'Account resolution failed' });
    }
  } catch (error) {
    console.error('Resolve account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
