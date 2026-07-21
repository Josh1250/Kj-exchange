import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from '../../components/layout/AdminLayout';
import Head from 'next/head';

export default function AdminTopups({ user }) {
  const router = useRouter();
  const [topups, setTopups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    fetchTopups();
  }, [user, router]);

  const fetchTopups = async () => {
    try {
      setIsLoading(true);
      const { data } = await supabase
        .from('transactions')
        .select('*, users(email, full_name)')
        .eq('type', 'deposit')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (data) setTopups(data);
    } catch (err) {
      console.error('Error fetching top-ups:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyTopup = async (txId, userId, amount) => {
    try {
      await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', txId);

      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();
      await supabase
        .from('wallets')
        .update({ balance: (wallet?.balance || 0) + amount })
        .eq('user_id', userId);

      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          message: `💰 Your top-up of ₦${amount.toLocaleString()} has been verified!`,
        });

      fetchTopups();
    } catch (err) {
      console.error(err);
    }
  };

  const rejectTopup = async (txId, userId) => {
    try {
      await supabase
        .from('transactions')
        .update({ status: 'failed' })
        .eq('id', txId);
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          message: `❌ Your top-up request was rejected. Please contact support.`,
        });
      fetchTopups();
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  return (
    <>
      <Head><title>Admin Top-Ups · KJ Exchange</title></Head>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Manage Top-Ups</h1>
            <button
              onClick={fetchTopups}
              className="flex items-center gap-2 text-text-muted hover:text-text-primary transition text-sm px-4 py-2 rounded-full border border-border hover:border-orange"
            >
              <i className="fa-solid fa-rotate"></i> Refresh
            </button>
          </div>

          <div className="bg-bg-card rounded-2xl border border-border overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <i className="fa-solid fa-spinner fa-spin text-2xl text-orange"></i>
                <span className="ml-3 text-text-muted">Loading top-ups...</span>
              </div>
            ) : topups.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto rounded-full bg-bg-card border border-border flex items-center justify-center text-text-muted text-3xl">
                  <i className="fa-regular fa-circle-check"></i>
                </div>
                <p className="text-text-muted mt-4">No pending top-ups.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {topups.map((tx) => (
                  <div key={tx.id} className="p-4 hover:bg-white/5 transition">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-bold">₦{tx.amount.toLocaleString()}</p>
                        <p className="text-text-muted text-sm">User: {tx.users?.email || tx.users?.full_name || 'Unknown'}</p>
                        <p className="text-text-muted text-xs">{new Date(tx.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => verifyTopup(tx.id, tx.user_id, tx.amount)}
                          className="bg-green-500 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-600 transition flex items-center gap-1"
                        >
                          <i className="fa-regular fa-circle-check"></i> Verify
                        </button>
                        <button
                          onClick={() => rejectTopup(tx.id, tx.user_id)}
                          className="bg-red-500 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-red-600 transition flex items-center gap-1"
                        >
                          <i className="fa-regular fa-circle-xmark"></i> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </>
  );
}

export async function getServerSideProps({ req }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { redirect: { destination: '/auth/login', permanent: false } };
  }
  const { data } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', session.user.id)
    .single();
  if (!data?.is_admin) {
    return { redirect: { destination: '/dashboard', permanent: false } };
  }
  return { props: { user: session.user } };
}
