import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';
import Head from 'next/head';

export default function VerifyEmail() {
  const router = useRouter();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'

  useEffect(() => {
    // Supabase automatically handles the verification via the token in the URL.
    // We just need to check if the user is now confirmed.
    const checkVerification = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setStatus('success');
        // Store email in localStorage for admin bypass (if needed)
        localStorage.setItem('sb-user-email', session.user.email);
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } else {
        // If no session, they might have clicked the link but need to log in manually.
        // Check if the URL has a hash (Supabase adds #access_token) or if there's an error.
        const { error } = router.query;
        if (error) {
          setStatus('error');
        } else {
          // Wait a bit and check again
          setTimeout(() => {
            checkVerification();
          }, 2000);
        }
      }
    };
    checkVerification();
  }, [router]);

  return (
    <>
      <Head>
        <title>Email Verification · KJ Exchange</title>
        <meta name="description" content="Verify your email address to complete registration on KJ Exchange." />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl animate-float-delayed"></div>

        <div className="relative z-10 w-full max-w-md bg-bg-card/70 backdrop-blur-xl rounded-3xl border border-border/50 p-8 shadow-2xl shadow-purple/5 text-center">
          {status === 'loading' && (
            <>
              <i className="fa-solid fa-spinner fa-spin text-4xl text-orange mb-4"></i>
              <h2 className="text-xl font-bold">Verifying your email...</h2>
              <p className="text-text-muted text-sm mt-2">Please wait while we confirm your account.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-green-400/20 flex items-center justify-center text-green-400 text-3xl mb-4">
                <i className="fa-regular fa-circle-check"></i>
              </div>
              <h2 className="text-2xl font-bold text-green-400">✅ Email Verified!</h2>
              <p className="text-text-muted text-sm mt-2">
                Your email has been successfully verified. You will be redirected to your dashboard shortly.
              </p>
              <div className="mt-4">
                <Link
                  href="/dashboard"
                  className="inline-block bg-orange text-white px-6 py-2 rounded-full font-semibold hover:bg-orange-600 transition"
                >
                  Go to Dashboard
                </Link>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-red-400/20 flex items-center justify-center text-red-400 text-3xl mb-4">
                <i className="fa-regular fa-circle-xmark"></i>
              </div>
              <h2 className="text-2xl font-bold text-red-400">Verification Failed</h2>
              <p className="text-text-muted text-sm mt-2">
                Something went wrong. Please try signing up again or contact support.
              </p>
              <div className="mt-4 flex flex-wrap gap-3 justify-center">
                <Link
                  href="/auth/signup"
                  className="bg-orange text-white px-6 py-2 rounded-full font-semibold hover:bg-orange-600 transition"
                >
                  Sign Up Again
                </Link>
                <Link
                  href="/"
                  className="border border-border text-text-primary px-6 py-2 rounded-full font-semibold hover:border-orange transition"
                >
                  Go Home
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
