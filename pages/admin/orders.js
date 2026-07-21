import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from '../../components/layout/AdminLayout';
import Head from 'next/head';

export default function AdminOrders() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

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
      fetchOrders();
    };
    checkAuth();
  }, [router]);

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

  // ... rest of handlers same as before

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-text-primary">Loading...</div>;
  }

  return ( ... ); // same JSX as before
}
