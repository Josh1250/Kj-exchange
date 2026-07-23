export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Generate a Bitcoin wallet
    const response = await fetch('https://api.tatum.io/v3/bitcoin/wallet', {
      method: 'GET',
      headers: {
        'x-api-key': process.env.TATUM_API_KEY,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to generate wallet');
    }

    // Return the xpub (and mnemonic – keep it safe!)
    res.status(200).json({
      success: true,
      xpub: data.xpub,
      mnemonic: data.mnemonic, // ⚠️ Store this securely, never expose to frontend!
    });
  } catch (error) {
    console.error('Generate wallet error:', error);
    res.status(500).json({ error: error.message });
  }
}
