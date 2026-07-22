import supabaseAdmin from '../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'User ID required' });

  try {
    // Delete from auth.users (will cascade? No, we need to delete manually)
    // 1. Delete from public tables (orders, wallets, users)
    await supabaseAdmin.from('orders').delete().eq('user_id', userId);
    await supabaseAdmin.from('wallets').delete().eq('user_id', userId);
    const { error: userError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);
    if (userError) throw userError;

    // 2. Delete from auth.users using admin API
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) throw authError;

    res.status(200).json({ success: true, message: 'User deleted permanently.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
