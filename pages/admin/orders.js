import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase, getSupabaseServer } from '../../lib/supabaseClient';
import AdminLayout from '../../components/layout/AdminLayout';
import Head from 'next/head';

export default function AdminOrders({ user }) {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    fetchOrders();
  }, [user, router]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const { data } = await supabase
        .from('orders')
        .select('*, users(email, full_name)')
        .order('created_at', { ascending: false });
      if (data) setOrders(data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ... handlers same as before (verify/reject)

  if (!user) return null;

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const statusColors = { pending: 'bg-yellow-400/20 text-yellow-400 border-yellow-400/20', verifying: 'bg-blue-400/20 text-blue-400 border-blue-400/20', verified: 'bg-green-400/20 text-green-400 border-green-400/20', completed: 'bg-green-500/20 text-green-500 border-green-500/20', failed: 'bg-red-400/20 text-red-400 border-red-400/20' };

  return ( ... ); // same JSX as before
}

export async function getServerSideProps({ req }) {
  const supabase = getSupabaseServer(req);
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
