import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data: authUsers, error: authError } = await supabase
      .auth
      .admin
      .listUsers();

    if (authError) throw authError;

    let insertedCount = 0;
    let walletCount = 0;

    for (const user of authUsers.users) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existing) {
        await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email,
          });
        insertedCount++;

        await supabase
          .from('wallets')
          .insert({
            user_id: user.id,
            balance: 0,
          });
        walletCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `✅ Synced ${insertedCount} users and created ${walletCount} wallets.`,
      inserted: insertedCount,
      wallets: walletCount,
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: error.message });
  }
}
