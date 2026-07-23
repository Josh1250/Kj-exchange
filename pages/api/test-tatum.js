export default async function handler(req, res) {
  const apiKey = process.env.TATUM_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'TATUM_API_KEY missing' });

  const results = [];

  const tests = [
    { url: 'https://api.tatum.io/v3/bitcoin/address', method: 'POST' },
    { url: 'https://api.tatum.io/v3/blockchain/bitcoin/address', method: 'POST' },
    { url: 'https://api-eu1.tatum.io/v3/bitcoin/address', method: 'POST' },
    { url: 'https://api.tatum.io/v3/bitcoin/info', method: 'GET' },
  ];

  for (const test of tests) {
    try {
      const options = {
        headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      };
      if (test.method === 'POST') {
        options.method = 'POST';
        options.body = JSON.stringify({});
      } else {
        options.method = 'GET';
      }
      const response = await fetch(test.url, options);
      const data = await response.json();
      results.push({
        url: test.url,
        method: test.method,
        status: response.status,
        ok: response.ok,
        data,
      });
    } catch (error) {
      results.push({ url: test.url, method: test.method, error: error.message });
    }
  }

  res.status(200).json({ results });
}
