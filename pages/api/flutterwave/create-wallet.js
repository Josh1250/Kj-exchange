import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, email, fullName, phone } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ error: 'Missing userId or email' });
    }

    // 1. Check if user already has a virtual account
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('virtual_account_number, virtual_account_reference')
      .eq('id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingUser?.virtual_account_number) {
      return res.status(200).json({
        success: true,
        message: 'Virtual account already exists',
        accountNumber: existingUser.virtual_account_number,
      });
    }

    // 2. Create Payout Subaccount (PSA) via Flutterwave API
    const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
    const response = await fetch('https://api.flutterwave.com/v3/payout-subaccounts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_name: fullName || email.split('@')[0],
        email: email,
        mobilenumber: phone || '08000000000',
        country: 'NG',
        // Optional: bank_code can be set if you want a specific bank
        // bank_code: '035', // Wema Bank
      }),
    });

    const data = await response.json();

    if (data.status !== 'success') {
      console.error('Flutterwave PSA creation failed:', data);
      return res.status(500).json({
        error: 'Failed to create wallet: ' + (data.message || 'Unknown error'),
      });
    }

    const { account_reference, nuban, bank_name, account_name } = data.data;

    // 3. Fetch static virtual account for the subaccount
    const staticResponse = await fetch(
      `https://api.flutterwave.com/v3/payout-subaccounts/${account_reference}/static-account`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const staticData = await staticResponse.json();

    let virtualAccountNumber = nuban;
    let virtualBankName = bank_name;

    if (staticData.status === 'success') {
      virtualAccountNumber = staticData.data.static_account || nuban;
      virtualBankName = staticData.data.bank_name || bank_name;
    }

    // 4. Save virtual account details to user
    const { error: updateError } = await supabase
      .from('users')
      .update({
        virtual_account_number: virtualAccountNumber,
        virtual_bank_name: virtualBankName,
        virtual_account_reference: account_reference,
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    // 5. Return success
    res.status(200).json({
      success: true,
      message: 'Virtual account created successfully',
      accountNumber: virtualAccountNumber,
      bankName: virtualBankName,
      accountName: account_name || fullName || email.split('@')[0],
    });

  } catch (error) {
    console.error('Create wallet error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
