import { supabase } from '../../../lib/supabaseClient';

const getTatumChain = (coin, network) => {
  const map = {
    'BTC': { 'Bitcoin': 'BITCOIN' },
    'ETH': { 'Ethereum': 'ETHEREUM' },
    'USDT': {
      'TRC-20': 'TRON',
      'ERC-20': 'ETHEREUM',
      'BEP-20': 'BSC',
    },
    'SOL': { 'Solana': 'SOLANA' },
    'BNB': { 'BSC': 'BSC' },
    'TRX': { 'Tron': 'TRON' },
    'LTC': { 'Litecoin': 'LITECOIN' },
    'BCH': { 'Bitcoin Cash': 'BITCOIN_CASH' },
  };
  const chain = map[coin]?.[network];
  if (!chain) throw new Error(`Unsupported coin/network: ${coin} / ${network}`);
  return chain;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, coin, network, usdAmount, rate, payout } = req.body;

    if (!userId || !coin || !network) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const chain = getTatumChain(coin, network);

    // Build the correct URL
    const url = `https://api.tatum.io/v3/${chain.toLowerCase()}/address`;
    console.log('Tatum URL:', url);

    const tatumRes = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': process.env.TATUM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const tatumData = await tatumRes.json();

    if (!tatumRes.ok || !tatumData.address) {
      console.error('Tatum error:', tatumData);
      return res.status(500).json({
        error: `Tatum API error: ${tatumData.message || 'Failed to generate address'}`,
        details: tatumData,
      });
    }

    const address = tatumData.address;

    // Save order
    const { data: order, error: dbError } = await supabase
      .from('crypto_orders')
      .insert({
        user_id: userId,
        coin,
        network,
        address,
        usd_amount: usdAmount || 0,
        rate: rate || 0,
        payout_ngn: payout || 0,
        status: 'awaiting_deposit',
      })
      .select()
      .single();

    if (dbError) {
      console.error('DB error:', dbError);
      return res.status(500).json({ error: 'Failed to save order' });
    }

    res.status(200).json({
      success: true,
      address,
      network,
      coin,
      orderId: order.id,
    });
  } catch (error) {
    console.error('Generate address error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
