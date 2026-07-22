useEffect(() => {
  const checkAuth = async () => {
    // First try to get session from Supabase
    let { data: { session } } = await supabase.auth.getSession();

    // If no session, try to restore from localStorage
    if (!session) {
      const accessToken = localStorage.getItem('sb-access-token');
      const refreshToken = localStorage.getItem('sb-refresh-token');
      if (accessToken && refreshToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!error && data.session) {
          session = data.session;
        }
      }
    }

    if (!session) {
      router.push('/auth/login');
      return;
    }

    // Check admin status...
    const { data, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();

    if (error || !data?.is_admin) {
      router.push('/dashboard');
      return;
    }

    // Proceed...
    setIsAdmin(true);
    setLoading(false);
    fetchStats();
  };
  checkAuth();
}, [router]);
