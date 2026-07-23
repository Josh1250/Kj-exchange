export default async function handler(req, res) {
  const apiKey = process.env.TATUM_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'TATUM_API_KEY missing' });

  try {
    // Test Bitcoin address generation (lightweight)
    const response = await fetch('https://api.tatum.io/v3/bitcoin/address', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    const data = await response.json();
    res.status(200).json({
      status: response.status,
      ok: response.ok,
      data,
      apiKeyPresent: !!apiKey,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
