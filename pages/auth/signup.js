import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import Image from 'next/image';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <>
      <Head>
        <title>Sign Up · KJ Exchange</title>
        <meta name="description" content="Create your KJ Exchange account and start trading crypto & gift cards instantly." />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4 relative overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-64 bg-purple-400/10 rounded-full blur-2xl animate-pulse-slow"></div>

        <div className="relative z-10 w-full max-w-md">
          {/* Back to Home */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary transition mb-6 group"
          >
            <i className="fa-solid fa-arrow-left text-sm group-hover:-translate-x-1 transition-transform"></i>
            <span className="text-sm font-medium">Back to Home</span>
          </Link>

          {/* Card */}
          <div className="bg-bg-card/70 backdrop-blur-xl rounded-3xl border border-border/50 p-8 shadow-2xl shadow-purple/5">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <Image
                src="/logo.png"
                alt="KJ Exchange"
                width={60}
                height={60}
                className="w-16 h-auto"
              />
            </div>

            <h1 className="text-2xl font-bold text-center">Create Account</h1>
            <p className="text-text-muted text-center text-sm mt-1">
              Start trading crypto & gift cards today
            </p>

            <form onSubmit={handleSignup} className="mt-8 space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Full Name</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                    <i className="fa-regular fa-user"></i>
                  </span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-black/40 border border-border rounded-xl px-12 py-3.5 text-text-primary placeholder:text-text-muted/60 focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 transition"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              {/* Email */}
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

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Password</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                    <i className="fa-solid fa-lock"></i>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/40 border border-border rounded-xl px-12 py-3.5 text-text-primary placeholder:text-text-muted/60 focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 transition"
                    placeholder="Create a password (min 6 chars)"
                    required
                    minLength="6"
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

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Confirm Password</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                    <i className="fa-solid fa-lock"></i>
                  </span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-black/40 border border-border rounded-xl px-12 py-3.5 text-text-primary placeholder:text-text-muted/60 focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 transition"
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition"
                  >
                    <i className={showConfirmPassword ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash'}></i>
                  </button>
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
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3.5 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 disabled:opacity-50 shadow-lg shadow-orange/20 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><i className="fa-solid fa-spinner fa-spin"></i> Creating account...</>
                ) : (
                  <><i className="fa-solid fa-user-plus"></i> Create Account</>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-bg-card/70 px-4 text-text-muted">or continue with</span>
              </div>
            </div>

            {/* Social Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 bg-black/40 border border-border rounded-xl py-3 hover:bg-white/5 transition text-text-primary text-sm font-medium">
                <i className="fab fa-google text-xl text-[#ea4335]"></i>
                Google
              </button>
              <button className="flex items-center justify-center gap-2 bg-black/40 border border-border rounded-xl py-3 hover:bg-white/5 transition text-text-primary text-sm font-medium">
                <i className="fab fa-apple text-xl"></i>
                Apple
              </button>
            </div>

            <p className="text-center text-text-muted text-sm mt-6">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-orange hover:underline font-medium">
                Login
              </Link>
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
