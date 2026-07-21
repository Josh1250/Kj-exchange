import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../_app';
import { supabase } from '../../lib/supabaseClient';

export default function AdminDebug() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      setError('Not logged in');
      setChecking(false);
      return;
    }

    const checkAdmin = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        setIsAdmin(data?.is_admin === true);
      } catch (err) {
        setError(err.message);
      } finally {
        setChecking(false);
      }
    };

    checkAdmin();
  }, [user, loading]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div>Loading... (user: {user?.email || 'none'})</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Debug</h1>
      <div className="space-y-2">
        <p><strong>Logged in:</strong> {user ? 'Yes' : 'No'}</p>
        <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
        <p><strong>User ID:</strong> {user?.id || 'N/A'}</p>
        <p><strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}</p>
        {error && <p className="text-red-400"><strong>Error:</strong> {error}</p>}
      </div>
      <div className="mt-6 flex gap-4">
        {user && isAdmin && (
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="bg-orange text-white px-4 py-2 rounded"
          >
            Go to Admin Dashboard
          </button>
        )}
        {!isAdmin && user && (
          <button
            onClick={async () => {
              await supabase
                .from('users')
                .update({ is_admin: true })
                .eq('id', user.id);
              alert('Updated! Refresh the page.');
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Make Me Admin
          </button>
        )}
      </div>
    </div>
  );
}
