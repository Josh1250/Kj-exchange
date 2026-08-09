import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from '../../components/layout/AdminLayout';
import Head from 'next/head';
import Link from 'next/link';

export default function AdminSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (error || !data?.is_admin) {
        router.push('/dashboard');
        return;
      }
      setIsAdmin(true);
      setAdminUser(data);
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <i className="fa-solid fa-spinner fa-spin text-3xl text-orange"></i>
          <span className="ml-3 text-text-muted">Loading...</span>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) return null;

  return (
    <>
      <Head><title>Admin Settings · KJ Exchange</title></Head>
      <AdminLayout>
        <div className="max-w-3xl mx-auto px-4 py-4 space-y-6">
          <h1 className="text-2xl font-bold">Admin Settings</h1>
          <p className="text-text-muted text-sm">Account and platform settings</p>

          <div className="glass rounded-2xl p-6 border border-border space-y-4">
            <h2 className="text-lg font-semibold">Profile</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-text-muted text-xs">Email</p>
                <p className="font-medium">{adminUser?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs">Full Name</p>
                <p className="font-medium">{adminUser?.full_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs">Role</p>
                <p className="font-medium text-orange">Administrator</p>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-border space-y-4">
            <h2 className="text-lg font-semibold">Quick Links</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Link href="/admin" className="glass p-3 rounded-xl text-center border border-border hover:border-orange transition">
                <i className="fa-solid fa-chart-pie text-orange text-xl block mb-1"></i>
                <span className="text-sm">Dashboard</span>
              </Link>
              <Link href="/admin/withdrawals" className="glass p-3 rounded-xl text-center border border-border hover:border-orange transition">
                <i className="fa-solid fa-arrow-down text-red-400 text-xl block mb-1"></i>
                <span className="text-sm">Withdrawals</span>
              </Link>
              <Link href="/admin/gift-cards" className="glass p-3 rounded-xl text-center border border-border hover:border-orange transition">
                <i className="fa-solid fa-gift text-pink-400 text-xl block mb-1"></i>
                <span className="text-sm">Gift Cards</span>
              </Link>
              <Link href="/admin/kyc-review" className="glass p-3 rounded-xl text-center border border-border hover:border-orange transition">
                <i className="fa-solid fa-shield-check text-orange text-xl block mb-1"></i>
                <span className="text-sm">KYC Review</span>
              </Link>
              <Link href="/admin/users" className="glass p-3 rounded-xl text-center border border-border hover:border-orange transition">
                <i className="fa-solid fa-users text-purple-400 text-xl block mb-1"></i>
                <span className="text-sm">Users</span>
              </Link>
              <button
                onClick={async () => {
                  if (confirm('Logout?')) {
                    await supabase.auth.signOut();
                    router.push('/auth/login');
                  }
                }}
                className="glass p-3 rounded-xl text-center border border-border hover:border-red-400 transition"
              >
                <i className="fa-solid fa-sign-out-alt text-red-400 text-xl block mb-1"></i>
                <span className="text-sm text-red-400">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
