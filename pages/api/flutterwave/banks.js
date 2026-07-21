import { getBanks } from '../../../lib/flutterwave';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const result = await getBanks('NG');
    if (result.status === 'success') {
      res.status(200).json({ status: 'success', data: result.data });
    } else {
      res.status(400).json({ status: 'error', message: result.message });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
