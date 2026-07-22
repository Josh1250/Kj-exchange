import supabaseAdmin from '../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, ban } = req.body; // ban: true/false
  if (!userId) return res.status(400).json({ error: 'User ID required' });

  try {
    // Update the banned column
    const { error } = await supabaseAdmin
      .from('users')
      .update({ banned: ban })
      .eq('id', userId);
    if (error) throw error;

    // Optionally, also update auth user metadata (to block login)
    // You could also disable the user via auth.admin.updateUserById
    // but this is simpler and works for most cases.

    res.status(200).json({ 
      success: true, 
      message: `User ${ban ? 'banned' : 'unbanned'} successfully.` 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
