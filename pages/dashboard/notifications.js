import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../_app';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../lib/supabaseClient';
import Head from 'next/head';
import Link from 'next/link';

export default function Notifications() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
      fetchNotifications();
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAsRead = async (id) => {
    setProcessing(prev => ({ ...prev, [id]: true }));
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
      fetchNotifications();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    } finally {
      setProcessing(prev => ({ ...prev, [id]: false }));
    }
  };

  const deleteNotification = async (id) => {
    if (!confirm('Delete this notification?')) return;
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
      fetchNotifications();
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-text-primary">Loading...</div>;
  if (!user) {
    router.push('/auth/login');
    return null;
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <Head>
        <title>Notifications · KJ Exchange</title>
      </Head>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <i className="fa-regular fa-bell text-orange"></i>
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 text-xs bg-orange/20 text-orange px-2 py-0.5 rounded-full border border-orange/20">
                    {unreadCount} unread
                  </span>
                )}
              </h1>
              <p className="text-text-muted text-sm">Stay updated with your account activity</p>
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="bg-orange/10 hover:bg-orange/20 text-orange px-4 py-2 rounded-full text-sm font-semibold transition flex items-center gap-2"
                >
                  <i className="fa-regular fa-check-circle"></i>
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="glass rounded-2xl border border-border divide-y divide-border/50">
            {notifications.length === 0 ? (
              <div className="py-16 text-center text-text-muted">
                <i className="fa-regular fa-bell-slash text-5xl block mb-4 opacity-30"></i>
                <p className="text-lg font-medium">All caught up!</p>
                <p className="text-sm">No notifications to show.</p>
                <Link href="/dashboard" className="mt-4 inline-block text-orange hover:underline text-sm">
                  Go to Dashboard →
                </Link>
              </div>
            ) : (
              notifications.map((notif) => {
                const isUnread = !notif.read;
                return (
                  <div
                    key={notif.id}
                    className={`p-5 transition-all duration-300 ${
                      isUnread
                        ? 'bg-orange/5 border-l-4 border-l-orange'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-orange flex-shrink-0"></span>
                          )}
                          <p className={`text-sm ${isUnread ? 'font-semibold text-text-primary' : 'text-text-muted'}`}>
                            {notif.message}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-text-muted">
                          <span className="flex items-center gap-1">
                            <i className="fa-regular fa-clock"></i>
                            {new Date(notif.created_at).toLocaleString()}
                          </span>
                          {isUnread && (
                            <span className="bg-orange/10 text-orange px-2 py-0.5 rounded-full text-[10px] font-medium">
                              New
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isUnread && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            disabled={processing[notif.id]}
                            className="text-xs text-orange hover:underline transition disabled:opacity-50"
                          >
                            {processing[notif.id] ? (
                              <i className="fa-solid fa-spinner fa-spin"></i>
                            ) : (
                              'Mark read'
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className="text-text-muted hover:text-red-400 transition text-xs"
                        >
                          <i className="fa-regular fa-trash-can"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with stats */}
          {notifications.length > 0 && (
            <div className="mt-4 text-center text-text-muted text-xs">
              {notifications.length} notifications total · {unreadCount} unread
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}
