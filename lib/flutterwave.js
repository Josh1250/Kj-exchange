const FLUTTERWAVE_PUBLIC_KEY = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;
const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

export const flutterwaveConfig = {
  public_key: FLUTTERWAVE_PUBLIC_KEY,
  secret_key: FLUTTERWAVE_SECRET_KEY,
};

// Initialize payment (for top-up)
export const initializePayment = async (amount, email, txRef, currency = 'NGN') => {
  try {
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: amount,
        currency: currency,
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://kj-exchange.vercel.app'}/dashboard/verify`,
        payment_options: 'card,banktransfer,ussd',
        customer: {
          email: email,
        },
        customizations: {
          title: 'KJ Exchange - Wallet Top-Up',
          description: 'Fund your wallet',
          logo: 'https://kj-exchange.vercel.app/logo.png',
        },
      }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Flutterwave init error:', error);
    return { status: 'error', message: error.message };
  }
};

// Verify payment
export const verifyPayment = async (transactionId) => {
  try {
    const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
      },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Flutterwave verify error:', error);
    return { status: 'error', message: error.message };
  }
};

// Transfer to bank (withdrawal)
export const initiateTransfer = async (amount, bankCode, accountNumber, accountName, currency = 'NGN') => {
  try {
    const response = await fetch('https://api.flutterwave.com/v3/transfers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
      },
      body: JSON.stringify({
        amount: amount,
        currency: currency,
        bank_code: bankCode,
        account_number: accountNumber,
        account_name: accountName,
        reference: `transfer_${Date.now()}`,
        narration: 'KJ Exchange Withdrawal',
      }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Flutterwave transfer error:', error);
    return { status: 'error', message: error.message };
  }
};

// Get bank list
export const getBanks = async (country = 'NG') => {
  try {
    const response = await fetch(`https://api.flutterwave.com/v3/banks/${country}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
      },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Flutterwave get banks error:', error);
    return { status: 'error', message: error.message };
  }
};
