import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from '../../components/layout/AdminLayout';
import Head from 'next/head';
import { orderVerifiedTemplate, orderRejectedTemplate } from '../../lib/emailTemplates';

export default function AdminOrders() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null); // For detail modal

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      let { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const storedEmail = localStorage.getItem('sb-user-email');
        if (storedEmail === 'okolijoshua16@gmail.com') {
          setIsAdmin(true);
          setLoading(false);
          fetchOrders();
          return;
        }
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
      setLoading(false);
      fetchOrders();
    };
    checkAuth();
  }, [router]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('orders')
        .select('*, users(email, full_name)')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }
      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }
      if (dateFilter) {
        const start = new Date(dateFilter);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dateFilter);
        end.setHours(23, 59, 59, 999);
        query = query.gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      alert('Failed to fetch orders. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (orderId, userId, valueNgn) => {
    if (processing) return;
    setProcessing(orderId);
    try {
      const order = orders.find(o => o.id === orderId);
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'verified' })
        .eq('id', orderId);
      if (orderError) throw new Error(orderError.message);

      const { data: userData } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', userId)
        .single();

      // Wallet update
      let { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .maybeSingle();
      let newBalance = (wallet?.balance || 0) + valueNgn;
      if (wallet) {
        await supabase.from('wallets').update({ balance: newBalance }).eq('user_id', userId);
      } else {
        await supabase.from('wallets').insert({ user_id: userId, balance: newBalance });
      }

      // Transaction
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'trade_credit',
        amount: valueNgn,
        status: 'completed',
        metadata: { order_id: orderId },
      });

      // Gift Points
      const giftPoints = Math.floor(valueNgn / 60);
      if (giftPoints > 0) {
        const { data: existingPoints } = await supabase
          .from('gift_point_transactions')
          .select('id')
          .eq('metadata->order_id', orderId)
          .maybeSingle();
        if (!existingPoints) {
          await supabase
            .from('gift_point_transactions')
            .insert({
              user_id: userId,
              amount: giftPoints,
              type: 'gift_card_sale',
              metadata: { order_id: orderId },
            });
        }
      }

      // Notification
      await supabase.from('notifications').insert({
        user_id: userId,
        message: `✅ Your order #${orderId.slice(0,8)} has been verified! ₦${valueNgn.toLocaleString()} credited. 🎁 ${giftPoints} gift points earned.`,
      });

      // Email
      if (userData?.email) {
        try {
          await fetch('/api/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: userData.email,
              subject: '✅ Order Verified - KJ Exchange',
              html: orderVerifiedTemplate(orderId, valueNgn, order?.asset || 'asset', userData?.full_name),
            }),
          });
        } catch (emailErr) {
          console.error('Email send error:', emailErr);
        }
      }

      alert('✅ Order verified and wallet credited!');
      await fetchOrders();
    } catch (err) {
      console.error('Verification error:', err);
      alert('❌ Failed to verify order: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (orderId, userId) => {
    if (processing) return;
    setProcessing(orderId);
    try {
      const order = orders.find(o => o.id === orderId);
      const { data: userData } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', userId)
        .single();

      await supabase.from('orders').update({ status: 'rejected' }).eq('id', orderId);
      await supabase.from('notifications').insert({
        user_id: userId,
        message: `❌ Your order #${orderId.slice(0,8)} has been rejected. Contact support.`,
      });

      if (userData?.email) {
        try {
          await fetch('/api/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: userData.email,
              subject: '❌ Order Rejected - KJ Exchange',
              html: orderRejectedTemplate(orderId, order?.asset || 'asset', userData?.full_name),
            }),
          });
        } catch (emailErr) {
          console.error('Email send error:', emailErr);
        }
      }

      alert('❌ Order rejected.');
      await fetchOrders();
    } catch (err) {
      console.error('Rejection error:', err);
      alert('Failed to reject order: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div>Loading admin panel...</div>;
  if (!isAdmin) return null;

  const statusColors = {
    pending: 'bg-yellow-400/20 text-yellow-400 border-yellow-400/20',
    verifying: 'bg-blue-400/20 text-blue-400 border-blue-400/20',
    verified: 'bg-green-400/20 text-green-400 border-green-400/20',
    completed: 'bg-green-500/20 text-green-500 border-green-500/20',
    failed: 'bg-red-400/20 text-red-400 border-red-400/20',
    rejected: 'bg-red-400/20 text-red-400 border-red-400/20',
  };

  return (
    <>
      <Head><title>Admin Orders · KJ Exchange</title></Head>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h1 className="text-2xl font-bold">Manage Orders</h1>
            <button
              onClick={fetchOrders}
              className="flex items-center gap-2 text-text-muted hover:text-text-primary transition text-sm px-4 py-2 rounded-full border border-border hover:border-orange"
            >
              <i className="fa-solid fa-rotate"></i> Refresh
            </button>
          </div>

          <div className="flex flex-wrap gap-2 bg-bg-card rounded-xl p-2 border border-border">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-black/40 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-orange"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="verifying">Verifying</option>
              <option value="verified">Verified</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-black/40 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-orange"
            >
              <option value="all">All Types</option>
              <option value="gift_card">Gift Cards</option>
              <option value="crypto">Crypto</option>
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-black/40 border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:border-orange"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Clear Date
              </button>
            )}
          </div>

          <div className="bg-bg-card rounded-2xl border border-border overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <i className="fa-solid fa-spinner fa-spin text-2xl text-orange"></i>
                <span className="ml-3 text-text-muted">Loading orders...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-text-muted">No orders found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black/30">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs text-text-muted uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs text-text-muted uppercase">Asset</th>
                      <th className="px-4 py-3 text-left text-xs text-text-muted uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs text-text-muted uppercase">Value (NGN)</th>
                      <th className="px-4 py-3 text-left text-xs text-text-muted uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs text-text-muted uppercase">Image</th>
                      <th className="px-4 py-3 text-left text-xs text-text-muted uppercase">Details</th>
                      <th className="px-4 py-3 text-left text-xs text-text-muted uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const details = order.details || {};
                      const frontImg = details.front_image || details.file_image || null;
                      const backImg = details.back_image || null;

                      return (
                        <tr key={order.id} className="border-t border-border hover:bg-white/5 transition">
                          <td className="px-4 py-3 text-sm">
                            {order.users?.full_name || order.users?.email || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm">{order.asset}</td>
                          <td className="px-4 py-3 text-sm">${order.amount?.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm font-bold text-green-400">₦{order.value_ngn?.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-0.5 rounded-full text-xs border ${statusColors[order.status] || 'bg-gray-400/20 text-gray-400'}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {frontImg ? (
                              <img
                                src={frontImg}
                                alt="Card front"
                                className="w-12 h-12 object-cover rounded cursor-pointer"
                                onClick={() => window.open(frontImg, '_blank')}
                              />
                            ) : (
                              <span className="text-text-muted text-xs">No image</span>
                            )}
                            {backImg && (
                              <img
                                src={backImg}
                                alt="Card back"
                                className="w-12 h-12 object-cover rounded cursor-pointer mt-1"
                                onClick={() => window.open(backImg, '_blank')}
                              />
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="text-orange hover:underline text-xs font-medium"
                            >
                              View
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            {order.status === 'pending' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleVerify(order.id, order.user_id, order.value_ngn)}
                                  disabled={processing === order.id}
                                  className="bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-green-600 transition disabled:opacity-50"
                                >
                                  {processing === order.id ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Verify'}
                                </button>
                                <button
                                  onClick={() => handleReject(order.id, order.user_id)}
                                  disabled={processing === order.id}
                                  className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-red-600 transition disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                            {order.status !== 'pending' && (
                              <span className="text-text-muted text-xs">Processed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => {
                if (orders.length === 0) return alert('No orders to export.');
                const headers = ['ID', 'Asset', 'Type', 'Amount', 'Value (NGN)', 'Status', 'User', 'Date'];
                const rows = orders.map(o => [
                  o.id.slice(0,8),
                  o.asset,
                  o.type,
                  o.amount,
                  o.value_ngn,
                  o.status,
                  o.users?.email || '',
                  new Date(o.created_at).toLocaleString(),
                ]);
                const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `orders_${new Date().toISOString().slice(0,10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="bg-orange text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-orange-600 transition"
            >
              <i className="fa-solid fa-file-csv mr-2"></i> Export CSV
            </button>
          </div>
        </div>
      </AdminLayout>

      {/* ===== Order Detail Modal ===== */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Order Details</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-text-muted hover:text-text-primary text-xl"
              >
                <i className="fa-regular fa-xmark"></i>
              </button>
            </div>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-text-muted text-xs uppercase">User</p>
                  <p className="font-medium">{selectedOrder.users?.full_name || selectedOrder.users?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs uppercase">Order ID</p>
                  <p className="font-medium font-mono">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs uppercase">Asset</p>
                  <p className="font-medium">{selectedOrder.asset}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs uppercase">Type</p>
                  <p className="font-medium capitalize">{selectedOrder.type}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs uppercase">Amount</p>
                  <p className="font-medium">${selectedOrder.amount}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs uppercase">Rate</p>
                  <p className="font-medium">₦{selectedOrder.rate}/$</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs uppercase">Payout (NGN)</p>
                  <p className="font-medium text-green-400">₦{selectedOrder.value_ngn?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs uppercase">Status</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${statusColors[selectedOrder.status] || 'bg-gray-400/20 text-gray-400'}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <p className="text-text-muted text-xs uppercase">Created</p>
                  <p className="font-medium">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
                {selectedOrder.completed_at && (
                  <div>
                    <p className="text-text-muted text-xs uppercase">Completed</p>
                    <p className="font-medium">{new Date(selectedOrder.completed_at).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {/* Details from metadata */}
              {selectedOrder.details && (
                <div className="border-t border-border pt-4 mt-4">
                  <h3 className="font-semibold mb-2">Card Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedOrder.details.card_type && (
                      <div>
                        <p className="text-text-muted text-xs uppercase">Card Type</p>
                        <p className="font-medium">{selectedOrder.details.card_type}</p>
                      </div>
                    )}
                    {selectedOrder.details.subcategory && (
                      <div>
                        <p className="text-text-muted text-xs uppercase">Subcategory</p>
                        <p className="font-medium">{selectedOrder.details.subcategory}</p>
                      </div>
                    )}
                    {selectedOrder.details.country && (
                      <div>
                        <p className="text-text-muted text-xs uppercase">Country</p>
                        <p className="font-medium">{selectedOrder.details.country}</p>
                      </div>
                    )}
                    {selectedOrder.details.card_code && (
                      <div>
                        <p className="text-text-muted text-xs uppercase">Card Code</p>
                        <p className="font-mono text-sm">{selectedOrder.details.card_code}</p>
                      </div>
                    )}
                    {selectedOrder.details.pin && (
                      <div>
                        <p className="text-text-muted text-xs uppercase">PIN</p>
                        <p className="font-mono text-sm">{selectedOrder.details.pin}</p>
                      </div>
                    )}
                    {selectedOrder.details.comment && (
                      <div className="col-span-2">
                        <p className="text-text-muted text-xs uppercase">Comment</p>
                        <p className="font-medium">{selectedOrder.details.comment}</p>
                      </div>
                    )}
                    {selectedOrder.details.fee_usd > 0 && (
                      <div>
                        <p className="text-text-muted text-xs uppercase">Fee (USD)</p>
                        <p className="font-medium text-red-400">${selectedOrder.details.fee_usd}</p>
                      </div>
                    )}
                    {selectedOrder.details.chime_name && (
                      <div>
                        <p className="text-text-muted text-xs uppercase">Chime Name</p>
                        <p className="font-medium">{selectedOrder.details.chime_name}</p>
                      </div>
                    )}
                    {selectedOrder.details.moneypak_code && (
                      <div>
                        <p className="text-text-muted text-xs uppercase">MoneyPak Code</p>
                        <p className="font-mono text-sm">{selectedOrder.details.moneypak_code}</p>
                      </div>
                    )}
                  </div>
                  {/* Images */}
                  {(selectedOrder.details.front_image || selectedOrder.details.back_image || selectedOrder.details.file_image) && (
                    <div className="mt-4 border-t border-border pt-4">
                      <h4 className="font-semibold mb-2">Images</h4>
                      <div className="flex flex-wrap gap-4">
                        {selectedOrder.details.front_image && (
                          <div>
                            <p className="text-text-muted text-xs">Front</p>
                            <img src={selectedOrder.details.front_image} alt="Front" className="max-w-[200px] max-h-[150px] object-contain rounded border border-border" />
                          </div>
                        )}
                        {selectedOrder.details.back_image && (
                          <div>
                            <p className="text-text-muted text-xs">Back</p>
                            <img src={selectedOrder.details.back_image} alt="Back" className="max-w-[200px] max-h-[150px] object-contain rounded border border-border" />
                          </div>
                        )}
                        {selectedOrder.details.file_image && (
                          <div>
                            <p className="text-text-muted text-xs">Upload</p>
                            <img src={selectedOrder.details.file_image} alt="Card" className="max-w-[200px] max-h-[150px] object-contain rounded border border-border" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedOrder(null)}
              className="mt-6 w-full bg-orange text-white font-bold py-2 rounded-xl hover:bg-orange-600 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
