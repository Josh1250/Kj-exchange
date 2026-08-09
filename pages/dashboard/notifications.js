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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
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

  // Get icon based on message content
  const getIcon = (message) => {
    if (message.includes('✅') || message.includes('completed') || message.includes('processed')) {
      return 'fa-regular fa-circle-check text-green-400';
    }
    if (message.includes('❌') || message.includes('failed') || message.includes('rejected')) {
      return 'fa-regular fa-circle-xmark text-red-400';
    }
    if (message.includes('🛒') || message.includes('order') || message.includes('gift')) {
      return 'fa-solid fa-gift text-orange';
    }
    if (message.includes('💸') || message.includes('withdrawal')) {
      return 'fa-solid fa-arrow-down text-red-400';
    }
    if (message.includes('💰') || message.includes('deposit') || message.includes('funds')) {
      return 'fa-solid fa-arrow-up text-green-400';
    }
    return 'fa-regular fa-bell text-orange';
  };

  return (
    <>
      <Head>
        <title>Notifications · KJ Exchange</title>
      </Head>
      <DashboardLayout>
        <div className="max-w-2xl mx-auto px-4 py-4 pb-24">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/dashboard"
              className="text-text-muted hover:text-text-primary transition group"
            >
              <i className="fa-solid fa-arrow-left text-sm group-hover:-translate-x-1 transition-transform"></i>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <i className="fa-regular fa-bell text-orange"></i>
                Notifications
                {unreadCount > 0 && (
                  <span className="text-xs bg-orange/20 text-orange px-2 py-0.5 rounded-full border border-orange/20">
                    {unreadCount} new
                  </span>
                )}
              </h1>
              <p className="text-text-muted text-sm">Stay updated with your account activity</p>
            </div>
          </div>

          {/* Action Bar */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-text-muted">
                {notifications.length} total · {unreadCount} unread
              </p>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-orange hover:underline transition flex items-center gap-1"
                >
                  <i className="fa-regular fa-check-circle"></i>
                  Mark all read
                </button>
              )}
            </div>
          )}

          {/* Notifications List */}
          <div className="glass rounded-2xl border border-border overflow-hidden">
            {isLoading ? (
              <div className="py-12 text-center text-text-muted">
                <i className="fa-solid fa-spinner fa-spin text-2xl block mb-3"></i>
                <p className="text-sm">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-16 text-center text-text-muted">
                <div className="w-20 h-20 mx-auto rounded-full bg-orange/5 border border-orange/20 flex items-center justify-center text-3xl text-orange/30 mb-4">
                  <i className="fa-regular fa-bell-slash"></i>
                </div>
                <p className="text-lg font-medium text-text-primary">All caught up!</p>
                <p className="text-sm">No notifications to show.</p>
                <Link
                  href="/dashboard"
                  className="mt-4 inline-block text-orange hover:underline text-sm"
                >
                  Go to Dashboard →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {notifications.map((notif) => {
                  const isUnread = !notif.read;
                  const icon = getIcon(notif.message);

                  return (
                    <div
                      key={notif.id}
                      className={`p-4 md:p-5 transition-all duration-300 ${
                        isUnread
                          ? 'bg-orange/5'
                          : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isUnread ? 'bg-orange/10' : 'bg-black/20'
                        }`}>
                          <i className={`${icon} text-lg`}></i>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <p className={`text-sm ${isUnread ? 'font-semibold text-text-primary' : 'text-text-muted'}`}>
                              {notif.message}
                            </p>
                            {isUnread && (
                              <span className="w-2 h-2 rounded-full bg-orange flex-shrink-0 mt-1.5"></span>
                            )}
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

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {isUnread && (
                            <button
                              onClick={() => markAsRead(notif.id)}
                              disabled={processing[notif.id]}
                              className="text-xs text-text-muted hover:text-orange transition p-1 disabled:opacity-50"
                              title="Mark as read"
                            >
                              {processing[notif.id] ? (
                                <i className="fa-solid fa-spinner fa-spin"></i>
                              ) : (
                                <i className="fa-regular fa-circle-check"></i>
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notif.id)}
                            className="text-text-muted hover:text-red-400 transition p-1"
                            title="Delete"
                          >
                            <i className="fa-regular fa-trash-can text-xs"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
