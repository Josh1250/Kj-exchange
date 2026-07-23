import { supabase } from '../../../lib/supabaseClient';

const TATUM_API_KEY = process.env.TATUM_API_KEY;

// Map coin to Tatum chain for balance checks
const getTatumChain = (coin, network) => {
  const map = {
    'BTC': 'BITCOIN',
    'ETH': 'ETHEREUM',
    'USDT': {
      'TRC-20': 'TRON',
      'ERC-20': 'ETHEREUM',
      'BEP-20': 'BSC',
      'Solana': 'SOLANA',
      'Base': 'BASE',
    },
    'SOL': 'SOLANA',
    'BNB': 'BSC',
    'TRX': 'TRON',
    'LTC': 'LITECOIN',
    'BCH': 'BITCOIN_CASH',
  };

  return map[coin]?.[network] || map[coin];
};

export default async function handler(req, res) {
  // Allow GET or POST for cron jobs
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Fetch all pending orders
    const { data: orders, error: fetchError } = await supabase
      .from('crypto_orders')
      .select('*')
      .eq('status', 'awaiting_deposit');

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }

    if (!orders || orders.length === 0) {
      return res.status(200).json({ message: 'No pending orders' });
    }

    let credited = 0;

    // 2. Check each order's address balance
    for (const order of orders) {
      try {
        const chain = getTatumChain(order.coin, order.network);

        if (!chain) {
          console.error(`Unsupported chain for order ${order.id}: ${order.coin}/${order.network}`);
          continue;
        }

        // Get balance from Tatum
        const tatumRes = await fetch(
          `https://api.tatum.io/v3/${chain.toLowerCase()}/address/balance/${order.address}`,
          {
            headers: { 'x-api-key': TATUM_API_KEY },
          }
        );

        const balanceData = await tatumRes.json();

        if (!tatumRes.ok) {
          console.error(`Tatum balance error for order ${order.id}:`, balanceData);
          continue;
        }

        // Extract balance (different response formats per chain)
        let balance = 0;
        if (chain === 'BITCOIN' || chain === 'LITECOIN' || chain === 'BITCOIN_CASH') {
          // UTXO chains return balance in satoshis
          balance = parseFloat(balanceData.balance || 0) / 1e8;
        } else {
          // EVM chains return balance in wei
          balance = parseFloat(balanceData.balance || 0) / 1e18;
        }

        // For USDT/other tokens, we need to check token balance separately
        // This is simplified; in production you'd need to fetch token balance

        if (balance > 0) {
          // 3. Credit the user's Naira wallet
          const { data: wallet, error: walletError } = await supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', order.user_id)
            .single();

          if (walletError) {
            console.error('Wallet fetch error:', walletError);
            continue;
          }

          const newBalance = (wallet?.balance || 0) + order.payout_ngn;

          const { error: updateError } = await supabase
            .from('wallets')
            .update({ balance: newBalance })
            .eq('user_id', order.user_id);

          if (updateError) {
            console.error('Wallet update error:', updateError);
            continue;
          }

          // 4. Update order status
          const { error: orderError } = await supabase
            .from('crypto_orders')
            .update({
              status: 'completed',
              received_amount: balance,
              completed_at: new Date().toISOString(),
            })
            .eq('id', order.id);

          if (orderError) {
            console.error('Order update error:', orderError);
            continue;
          }

          // 5. Send notification
          await supabase
            .from('notifications')
            .insert({
              user_id: order.user_id,
              message: `✅ Your ${order.coin} sale of ₦${order.payout_ngn.toLocaleString()} has been credited to your wallet!`,
            });

          credited++;
        }
      } catch (orderError) {
        console.error(`Error processing order ${order.id}:`, orderError);
      }
    }

    res.status(200).json({
      success: true,
      processed: orders.length,
      credited,
    });
  } catch (error) {
    console.error('Check balance error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
