import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuth } from '../_app';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';
import Head from 'next/head';

export default function Verify() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verifying your payment...');
  const [amount, setAmount] = useState(0);
  const [currency, setCurrency] = useState('NGN');

  useEffect(() => {
    const { transaction_id, status: queryStatus } = router.query;
    if (!transaction_id) return;

    if (queryStatus === 'cancelled') {
      setStatus('cancelled');
      setMessage('You cancelled the payment.');
      return;
    }

    const verify = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch('/api/flutterwave/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ transaction_id }),
        });

        const data = await response.json();

        if (data.success) {
          setStatus('success');
          setMessage(data.message || 'Wallet credited successfully!');
          setAmount(data.amount || 0);
          setCurrency(data.currency || 'NGN');
        } else {
          setStatus('failed');
          setMessage(data.message || 'Verification failed. Please contact support.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('An error occurred during verification.');
        console.error(err);
      }
    };

    verify();
  }, [router.query]);

  if (loading) return <div>Loading...</div>;
  if (!user) {
    router.push('/auth/login');
    return null;
  }

  const currencySymbol = { NGN: '₦', USD: '$', GHS: '₵' }[currency] || '₦';

  return (
    <>
      <Head><title>Payment Verification · KJ Exchange</title></Head>
      <DashboardLayout>
        <div className="max-w-lg mx-auto text-center space-y-6">
          <div className="bg-bg-card rounded-2xl p-8 border border-border shadow-2xl">
            {status === 'loading' && (
              <>
                <i className="fa-solid fa-spinner fa-spin text-4xl text-orange"></i>
                <h2 className="text-xl font-bold mt-4">Verifying Payment</h2>
                <p className="text-text-muted text-sm">Please wait while we confirm your transaction.</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-16 h-16 mx-auto rounded-full bg-green-400/20 flex items-center justify-center text-green-400 text-4xl">
                  <i className="fa-regular fa-circle-check"></i>
                </div>
                <h2 className="text-2xl font-bold mt-4 text-green-400">Payment Successful</h2>
                <p className="text-text-muted text-sm mt-2">{message}</p>
                <div className="mt-4 p-4 bg-black/20 rounded-xl border border-border">
                  <p className="text-text-muted text-sm">Amount Credited</p>
                  <p className="text-3xl font-bold text-white">{currencySymbol}{amount.toLocaleString()}</p>
                </div>
                <Link
                  href="/dashboard/wallet"
                  className="inline-block mt-6 bg-orange text-white px-6 py-3 rounded-full font-semibold hover:bg-orange-600 transition shadow-lg shadow-orange/30"
                >
                  <i className="fa-solid fa-wallet mr-2"></i> Go to Wallet
                </Link>
              </>
            )}

            {(status === 'cancelled' || status === 'failed' || status === 'error') && (
              <>
                <div className="w-16 h-16 mx-auto rounded-full bg-red-400/20 flex items-center justify-center text-red-400 text-4xl">
                  <i className="fa-regular fa-circle-xmark"></i>
                </div>
                <h2 className="text-2xl font-bold mt-4 text-red-400">
                  {status === 'cancelled' ? 'Payment Cancelled' : 'Verification Failed'}
                </h2>
                <p className="text-text-muted text-sm mt-2">{message}</p>
                <div className="flex flex-wrap gap-3 justify-center mt-6">
                  <Link
                    href="/dashboard/wallet"
                    className="bg-orange text-white px-6 py-3 rounded-full font-semibold hover:bg-orange-600 transition"
                  >
                    <i className="fa-solid fa-arrow-left mr-2"></i> Back to Wallet
                  </Link>
                  {status === 'cancelled' && (
                    <button
                      onClick={() => window.location.href = '/dashboard/wallet'}
                      className="border border-border text-text-primary px-6 py-3 rounded-full font-semibold hover:border-orange transition"
                    >
                      <i className="fa-solid fa-rotate mr-2"></i> Try Again
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          <p className="text-text-muted text-xs">
            <i className="fa-regular fa-circle-question mr-1"></i> If you have any issues, contact support via WhatsApp.
          </p>
        </div>
      </DashboardLayout>
    </>
  );
}
