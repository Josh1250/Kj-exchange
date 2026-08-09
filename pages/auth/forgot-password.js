import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import Image from 'next/image';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
    };
    checkAuth();
  }, [router]);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (!email) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    const redirectTo = `${window.location.origin}/auth/update-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Reset Password · KJ Exchange</title>
        <meta name="description" content="Reset your KJ Exchange account password." />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4 relative overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-64 bg-purple-400/10 rounded-full blur-2xl animate-pulse-slow"></div>

        <div className="relative z-10 w-full max-w-md">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary transition mb-6 group"
          >
            <i className="fa-solid fa-arrow-left text-sm group-hover:-translate-x-1 transition-transform"></i>
            <span className="text-sm font-medium">Back to Login</span>
          </Link>

          <div className="glass rounded-3xl p-6 md:p-8 border border-border/50 shadow-2xl shadow-purple/5">
            <div className="flex justify-center mb-6">
              <Image
                src="/logo.png"
                alt="KJ Exchange"
                width={60}
                height={60}
                className="w-14 md:w-16 h-auto"
              />
            </div>

            <h1 className="text-2xl font-bold text-center">Reset Password</h1>
            <p className="text-text-muted text-center text-sm mt-1">
              Enter your email to receive a password reset link
            </p>

            {success ? (
              <div className="mt-6 p-4 bg-green-400/10 border border-green-400/20 rounded-xl text-center">
                <i className="fa-regular fa-circle-check text-3xl text-green-400 block mb-2"></i>
                <p className="text-green-400 font-semibold">✅ Check your email</p>
                <p className="text-text-muted text-sm mt-1">
                  We've sent a password reset link to <strong>{email}</strong>.
                  <br />Click the link in the email to create a new password.
                </p>
                <p className="text-text-muted text-xs mt-3">
                  Didn't receive it?{' '}
                  <button
                    onClick={() => {
                      setSuccess(false);
                      setError('');
                    }}
                    className="text-orange hover:underline"
                  >
                    Try again
                  </button>
                </p>
                <Link
                  href="/auth/login"
                  className="inline-block mt-4 text-orange hover:underline text-sm"
                >
                  Back to Login →
                </Link>
              </div>
            ) : (
              <form onSubmit={handleReset} className="mt-8 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Email Address</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                      <i className="fa-regular fa-envelope"></i>
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black/30 border border-border rounded-xl px-12 py-3.5 text-text-primary placeholder:text-text-muted/60 focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 transition text-base"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-400/10 border border-red-400/20 rounded-xl p-3 text-red-400 text-sm flex items-center gap-2">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3.5 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 disabled:opacity-50 shadow-lg shadow-orange/20 flex items-center justify-center gap-2 touch-manipulation"
                >
                  {loading ? (
                    <><i className="fa-solid fa-spinner fa-spin"></i> Sending...</>
                  ) : (
                    <><i className="fa-solid fa-paper-plane"></i> Send Reset Link</>
                  )}
                </button>
              </form>
            )}

            {!success && (
              <p className="text-center text-text-muted text-sm mt-6">
                Remember your password?{' '}
                <Link href="/auth/login" className="text-orange hover:underline font-medium">Login</Link>
              </p>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        .animate-float { animation: float 8s ease-in-out infinite; }
        .animate-float-delayed { animation: float 10s ease-in-out infinite 2s; }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        .animate-pulse-slow { animation: pulse-slow 6s ease-in-out infinite; }
      `}</style>
    </>
  );
}
