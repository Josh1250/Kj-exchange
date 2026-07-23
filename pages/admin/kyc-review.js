import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from '../../components/layout/AdminLayout';
import Head from 'next/head';
import Link from 'next/link';

export default function KYCReview() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/auth/login');
      return;
    }

    const { data, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();

    if (error || !data?.is_admin) {
      router.push('/dashboard');
      return;
    }

    setIsAdmin(true);
    fetchPendingKYC();
  };

  const fetchPendingKYC = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('users')
      .select('id, full_name, email, phone, bvn, nin, kyc_status, kyc_document_url, created_at')
      .eq('kyc_status', 'Pending')
      .order('created_at', { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  const approveKYC = async (userId) => {
    if (!confirm('Approve this KYC?')) return;
    setProcessing(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({ kyc_status: 'Approved', kyc_level: 2 })
        .eq('id', userId);

      if (error) throw error;

      // Add 1,500 gift points for KYC completion
      await supabase
        .from('gift_point_transactions')
        .insert({
          user_id: userId,
          amount: 1500,
          type: 'kyc',
        });

      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          message: '✅ Your KYC has been approved! You can now withdraw up to ₦50,000 instantly.',
        });

      alert('✅ KYC approved!');
      fetchPendingKYC();
    } catch (err) {
      alert('Failed to approve KYC.');
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const rejectKYC = async (userId) => {
    if (!confirm('Reject this KYC?')) return;
    setProcessing(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({ kyc_status: 'Rejected' })
        .eq('id', userId);

      if (error) throw error;

      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          message: '❌ Your KYC was rejected. Please submit valid documents.',
        });

      alert('❌ KYC rejected.');
      fetchPendingKYC();
    } catch (err) {
      alert('Failed to reject KYC.');
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  if (!isAdmin) return <div>Loading...</div>;

  return (
    <>
      <Head><title>KYC Review · Admin</title></Head>
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">KYC Review</h1>

          {loading ? (
            <p>Loading...</p>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <i className="fa-regular fa-clock text-4xl mb-3 block"></i>
              <p>No pending KYC requests.</p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-bg-card rounded-2xl border border-border">
              <table className="w-full">
                <thead className="bg-black/30">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs text-text-muted uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs text-text-muted uppercase">BVN</th>
                    <th className="px-4 py-3 text-left text-xs text-text-muted uppercase">NIN</th>
                    <th className="px-4 py-3 text-left text-xs text-text-muted uppercase">Document</th>
                    <th className="px-4 py-3 text-left text-xs text-text-muted uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t border-border">
                      <td className="px-4 py-3 text-sm">
                        <p className="font-medium">{user.full_name || 'N/A'}</p>
                        <p className="text-text-muted text-xs">{user.email}</p>
                        <p className="text-text-muted text-xs">{user.phone || 'No phone'}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm">{user.bvn || 'N/A'}</td>
                      <td className="px-4 py-3 font-mono text-sm">{user.nin || 'N/A'}</td>
                      <td className="px-4 py-3">
                        {user.kyc_document_url ? (
                          <a
                            href={user.kyc_document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange hover:underline flex items-center gap-1 text-sm"
                          >
                            <i className="fa-regular fa-eye"></i> View
                          </a>
                        ) : (
                          <span className="text-text-muted text-sm">No file</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveKYC(user.id)}
                            disabled={processing}
                            className="bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-green-600 transition disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectKYC(user.id)}
                            disabled={processing}
                            className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-red-600 transition disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AdminLayout>
    </>
  );
}
