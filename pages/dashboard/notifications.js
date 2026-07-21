import { useEffect, useState } from 'react';
import { useAuth } from '../_app';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../lib/supabaseClient';
import Head from 'next/head';

export default function Notifications() {
  const { user, loading } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setNotifications(data || []);
  };

  const markAllAsRead = async () => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
    fetchNotifications();
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return null;

  return (
    <>
      <Head>
        <title>Notifications · KJ Exchange</title>
      </Head>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Notifications</h1>
            <button onClick={markAllAsRead} className="text-sm text-orange hover:underline">
              Mark all as read
            </button>
          </div>

          <div className="bg-bg-card rounded-2xl border border-border divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-text-muted">
                <i className="fa-regular fa-bell-slash text-4xl mb-2 block"></i>
                <p>No notifications yet.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className={`p-4 ${notif.read ? 'opacity-60' : ''}`}>
                  <p className="text-sm text-text-muted">{new Date(notif.created_at).toLocaleString()}</p>
                  <p className="text-text-primary">{notif.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
