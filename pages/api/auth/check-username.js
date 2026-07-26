export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username } = req.body;
  if (!username || username.length < 3) {
    return res.status(400).json({ available: false });
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (error) throw error;
    res.status(200).json({ available: !data });
  } catch (error) {
    console.error('Error checking username:', error);
    res.status(500).json({ available: false });
  }
}
