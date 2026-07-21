import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from '../../components/layout/AdminLayout';
import Head from 'next/head';

export default function AdminUsers() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }
      const { data } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();
      if (!data?.is_admin) {
        router.push('/dashboard');
        return;
      }
      setLoading(false);
      fetchUsers();
    };
    checkAuth();
  }, [router]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const approveKyc = async (userId) => {
    try {
      await supabase
        .from('users')
        .update({ kyc_status: 'Approved', kyc_level: 2 })
        .eq('id', userId);
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          message: '✅ Your KYC has been approved! You can now withdraw up to ₦50,000.',
        });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const rejectKyc = async (userId) => {
    try {
      await supabase
        .from('users')
        .update({ kyc_status: 'Rejected' })
        .eq('id', userId);
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          message: '❌ Your KYC was rejected. Please submit a valid ID and BVN.',
        });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-text-primary">Loading...</div>;
  }

  return (
    <>
      <Head><title>Admin Users · KJ Exchange</title></Head>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Manage Users</h1>
            <button
              onClick={fetchUsers}
              className="flex items-center gap-2 text-text-muted hover:text-text-primary transition text-sm px-4 py-2 rounded-full border border-border hover:border-orange"
            >
              <i className="fa-solid fa-rotate"></i> Refresh
            </button>
          </div>

          <div className="bg-bg-card rounded-2xl border border-border overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <i className="fa-solid fa-spinner fa-spin text-2xl text-orange"></i>
                <span className="ml-3 text-text-muted">Loading users...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-text-muted">No users found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black/30">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">KYC</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Joined</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-white/5 transition">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-orange/20 flex items-center justify-center text-orange font-bold text-sm">
                              {u.full_name?.charAt(0) || u.email?.charAt(0) || 'U'}
                            </div>
                            <span className="font-medium">{u.full_name || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-text-muted text-sm">{u.email}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${
                            u.kyc_status === 'Approved' ? 'bg-green-400/20 text-green-400 border-green-400/20' :
                            u.kyc_status === 'Pending' ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400/20' :
                            u.kyc_status === 'Rejected' ? 'bg-red-400/20 text-red-400 border-red-400/20' :
                            'bg-gray-400/20 text-gray-400 border-gray-400/20'
                          }`}>
                            {u.kyc_status || 'Not Submitted'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-text-muted text-sm">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {u.kyc_status === 'Pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => approveKyc(u.id)}
                                className="bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-green-600 transition"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => rejectKyc(u.id)}
                                className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-red-600 transition"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {u.kyc_status === 'Approved' && (
                            <span className="text-green-400 text-xs">✅ Approved</span>
                          )}
                          {(!u.kyc_status || u.kyc_status === 'Not Submitted') && (
                            <span className="text-text-muted text-xs">No KYC</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
