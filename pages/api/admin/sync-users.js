import supabaseAdmin from '../../../lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ✅ Use the ADMIN client here
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) throw authError;

    let insertedCount = 0;
    let walletCount = 0;

    for (const user of authUsers.users) {
      // Check if user exists in public.users
      const { data: existing } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existing) {
        // Insert into public.users
        await supabaseAdmin
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email,
          });
        insertedCount++;

        // Insert wallet
        await supabaseAdmin
          .from('wallets')
          .insert({
            user_id: user.id,
            balance: 0,
            usd_balance: 0,
            ghs_balance: 0,
            gift_points: 0,
          });
        walletCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `✅ Synced ${insertedCount} users and ${walletCount} wallets.`,
      inserted: insertedCount,
      wallets: walletCount,
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: error.message });
  }
}
