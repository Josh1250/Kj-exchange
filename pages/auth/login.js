import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import Image from 'next/image';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const router = useRouter();

  // Check if user just verified their email
  const { verified } = router.query;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowResend(false);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Check if the error is due to unverified email
      if (error.message.includes('Email not confirmed')) {
        setError('Please verify your email address first. Check your inbox for the confirmation link.');
        setShowResend(true);
      } else {
        setError(error.message);
      }
      setLoading(false);
    } else {
      // Store session tokens in localStorage for admin bypass
      const { data: { session, user } } = await supabase.auth.getSession();
      if (session && user) {
        localStorage.setItem('sb-access-token', session.access_token);
        localStorage.setItem('sb-refresh-token', session.refresh_token);
        localStorage.setItem('sb-user-email', user.email);
      }
      router.push('/dashboard');
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    setResendSuccess(false);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify-email`,
        },
      });
      if (error) {
        setError('Failed to resend verification email. Please try again.');
      } else {
        setResendSuccess(true);
        setShowResend(false);
        setError('');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login · KJ Exchange</title>
        <meta name="description" content="Login to KJ Exchange and start trading crypto & gift cards instantly." />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-64 bg-purple-400/10 rounded-full blur-2xl animate-pulse-slow"></div>

        <div className="relative z-10 w-full max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary transition mb-6 group"
          >
            <i className="fa-solid fa-arrow-left text-sm group-hover:-translate-x-1 transition-transform"></i>
            <span className="text-sm font-medium">Back to Home</span>
          </Link>

          <div className="bg-bg-card/70 backdrop-blur-xl rounded-3xl border border-border/50 p-8 shadow-2xl shadow-purple/5">
            <div className="flex justify-center mb-8">
              <Image src="/logo.png" alt="KJ Exchange" width={60} height={60} className="w-16 h-auto" />
            </div>

            <h1 className="text-2xl font-bold text-center">Welcome Back</h1>
            <p className="text-text-muted text-center text-sm mt-1">Login to continue trading</p>

            {/* Success message after verification */}
            {verified && (
              <div className="mt-4 bg-green-400/10 border border-green-400/20 rounded-xl p-3 text-green-400 text-sm flex items-center gap-2">
                <i className="fa-regular fa-circle-check"></i>
                <span>✅ Email verified! You can now log in.</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
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
                    className="w-full bg-black/40 border border-border rounded-xl px-12 py-3.5 text-text-primary placeholder:text-text-muted/60 focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 transition"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-medium text-text-secondary">Password</label>
                  <Link href="/auth/forgot-password" className="text-xs text-orange hover:underline">Forgot Password?</Link>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                    <i className="fa-solid fa-lock"></i>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/40 border border-border rounded-xl px-12 py-3.5 text-text-primary placeholder:text-text-muted/60 focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 transition"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition"
                  >
                    <i className={showPassword ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash'}></i>
                  </button>
                </div>
              </div>

              {/* Error message with Resend button */}
              {error && (
                <div className={`rounded-xl p-3 text-sm flex flex-col gap-2 ${
                  showResend ? 'bg-yellow-400/10 border border-yellow-400/20 text-yellow-400' : 'bg-red-400/10 border border-red-400/20 text-red-400'
                }`}>
                  <div className="flex items-start gap-2">
                    <i className={`fa-solid ${showResend ? 'fa-triangle-exclamation' : 'fa-circle-exclamation'} mt-0.5`}></i>
                    <span>{error}</span>
                  </div>
                  {showResend && (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resending || resendSuccess}
                      className="mt-1 self-start bg-orange/20 hover:bg-orange/30 text-orange px-4 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                    >
                      {resending ? (
                        <><i className="fa-solid fa-spinner fa-spin mr-1"></i> Sending...</>
                      ) : resendSuccess ? (
                        <><i className="fa-regular fa-check-circle mr-1"></i> Sent! Check your email.</>
                      ) : (
                        <><i className="fa-regular fa-paper-plane mr-1"></i> Resend Verification Email</>
                      )}
                    </button>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3.5 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 disabled:opacity-50 shadow-lg shadow-orange/20 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><i className="fa-solid fa-spinner fa-spin"></i> Logging in...</>
                ) : (
                  <><i className="fa-solid fa-arrow-right-to-bracket"></i> Login</>
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-bg-card/70 px-4 text-text-muted">or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 bg-black/40 border border-border rounded-xl py-3 hover:bg-white/5 transition text-text-primary text-sm font-medium">
                <i className="fab fa-google text-xl text-[#ea4335]"></i> Google
              </button>
              <button className="flex items-center justify-center gap-2 bg-black/40 border border-border rounded-xl py-3 hover:bg-white/5 transition text-text-primary text-sm font-medium">
                <i className="fab fa-apple text-xl"></i> Apple
              </button>
            </div>

            <p className="text-center text-text-muted text-sm mt-6">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-orange hover:underline font-medium">Sign Up</Link>
            </p>
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
