// pages/dashboard/verify.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Head from 'next/head';

export default function VerifyPayment() {
  const router = useRouter();
  const { transaction_id, status } = router.query;
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!transaction_id || !status) return;

    const verify = async () => {
      try {
        // Call your verify API
        const response = await fetch('/api/flutterwave/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transaction_id, status }),
        });
        const data = await response.json();
        setResult(data);
        setLoading(false);

        // If successful, redirect to wallet after 3 seconds
        if (data.success) {
          setTimeout(() => router.push('/dashboard/wallet'), 3000);
        }
      } catch (err) {
        setResult({ success: false, error: err.message });
        setLoading(false);
      }
    };

    verify();
  }, [transaction_id, status, router]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <i className="fa-solid fa-spinner fa-spin text-4xl text-orange"></i>
            <p className="text-text-primary mt-4">Verifying your payment...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Head><title>Payment Verification · KJ Exchange</title></Head>
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto">
            {result?.success ? (
              <>
                <div className="w-20 h-20 rounded-full bg-green-400/20 flex items-center justify-center text-green-400 text-4xl mx-auto">
                  <i className="fa-regular fa-circle-check"></i>
                </div>
                <h2 className="text-2xl font-bold text-text-primary mt-4">Payment Successful! 🎉</h2>
                <p className="text-text-muted">Your wallet has been credited.</p>
                <p className="text-text-muted text-sm mt-1">Redirecting to wallet...</p>
                <Link href="/dashboard/wallet" className="mt-6 inline-block bg-orange text-white px-6 py-2 rounded-full hover:bg-orange-600 transition">
                  Go to Wallet Now
                </Link>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-red-400/20 flex items-center justify-center text-red-400 text-4xl mx-auto">
                  <i className="fa-regular fa-circle-xmark"></i>
                </div>
                <h2 className="text-2xl font-bold text-text-primary mt-4">Verification Failed</h2>
                <p className="text-text-muted">{result?.error || 'Verification failed. Please contact support.'}</p>
                <Link href="/dashboard/wallet" className="mt-6 inline-block border border-border text-text-primary px-6 py-2 rounded-full hover:border-orange transition">
                  ← Back to Wallet
                </Link>
              </>
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
