import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from '../../components/layout/AdminLayout';
import Head from 'next/head';

export default function PendingDeposits() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
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
    fetchOrders();
  };

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('crypto_orders')
      .select('*, users(email, full_name)')
      .eq('status', 'pending_confirmation')
      .order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  const approveDeposit = async (orderId) => {
    if (!confirm('Approve this deposit?')) return;
    setProcessing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/admin/approve-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, adminId: session.user.id }),
      });
      const data = await response.json();
      if (data.success) {
        alert(data.message);
        fetchOrders();
      } else {
        alert('Failed: ' + data.error);
      }
    } catch (err) {
      alert('Error approving deposit');
    } finally {
      setProcessing(false);
    }
  };

  if (!isAdmin) return <div>Loading...</div>;

  return (
    <>
      <Head><title>Pending Deposits · Admin</title></Head>
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Pending Crypto Deposits</h1>

          {loading ? (
            <p>Loading...</p>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <i className="fa-regular fa-clock text-4xl mb-3 block"></i>
              <p>No pending deposits.</p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-bg-card rounded-2xl border border-border">
              <table className="w-full">
                <thead className="bg-black/30">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs text-text-muted uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs text-text-muted uppercase">Coin</th>
                    <th className="px-4 py-3 text-left text-xs text-text-muted uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs text-text-muted uppercase">Rate</th>
                    <th className="px-4 py-3 text-left text-xs text-text-muted uppercase">Payout</th>
                    <th className="px-4 py-3 text-left text-xs text-text-muted uppercase">Network</th>
                    <th className="px-4 py-3 text-left text-xs text-text-muted uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-t border-border">
                      <td className="px-4 py-3 text-sm">
                        {order.users?.full_name || order.users?.email || 'N/A'}
                      </td>
                      <td className="px-4 py-3 font-medium">{order.coin}</td>
                      <td className="px-4 py-3">${order.usd_amount?.toFixed(2)}</td>
                      <td className="px-4 py-3">₦{order.rate?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-green-400 font-bold">₦{order.payout_ngn?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs">{order.network}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => approveDeposit(order.id)}
                          disabled={processing}
                          className="bg-green-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-600 transition disabled:opacity-50"
                        >
                          Approve
                        </button>
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
