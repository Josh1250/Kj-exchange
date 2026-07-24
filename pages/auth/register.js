import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import Image from 'next/image';

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [referralCodeInput, setReferralCodeInput] = useState(''); // Manual input
  const [referralCodeFromUrl, setReferralCodeFromUrl] = useState('');
  const [referrerName, setReferrerName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Capture referral code from URL query
  useEffect(() => {
    const { ref } = router.query;
    if (ref) {
      setReferralCodeFromUrl(ref);
      setReferralCodeInput(ref);
      // Fetch referrer's name
      supabase
        .from('users')
        .select('full_name')
        .eq('referral_code', ref)
        .single()
        .then(({ data }) => {
          if (data) setReferrerName(data.full_name || 'a friend');
        });
    }
  }, [router.query]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

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

    const redirectTo = `${window.location.origin}/auth/verify-email`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Determine which referral code to use (input field or URL)
    const finalReferralCode = referralCodeInput || referralCodeFromUrl;

    // If signup successful, create referral record if referralCode exists
    if (data.user && finalReferralCode) {
      try {
        const { data: referrer, error: refError } = await supabase
          .from('users')
          .select('id')
          .eq('referral_code', finalReferralCode)
          .single();

        if (!refError && referrer) {
          await supabase
            .from('referrals')
            .insert({
              referrer_id: referrer.id,
              referred_email: email,
              referred_user_id: data.user.id,
              status: 'pending',
            });
          console.log('✅ Referral recorded successfully!');
        } else {
          console.log('⚠️ Invalid referral code:', finalReferralCode);
        }
      } catch (refErr) {
        console.error('Referral creation failed:', refErr);
      }
    }

    setSuccess(true);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setReferralCodeInput('');
    setLoading(false);
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
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary transition mb-6 group"
          >
            <i className="fa-solid fa-arrow-left text-sm group-hover:-translate-x-1 transition-transform"></i>
            <span className="text-sm font-medium">Back to Home</span>
          </Link>

          <div className="bg-bg-card/70 backdrop-blur-xl rounded-3xl border border-border/50 p-8 shadow-2xl shadow-purple/5">
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

            {/* Referral Banner (when coming from URL) */}
            {referralCodeFromUrl && referrerName && (
              <div className="mt-4 p-3 bg-orange/10 border border-orange/20 rounded-xl text-center text-sm">
                <i className="fa-solid fa-gift text-orange mr-1"></i>
                You were referred by <span className="font-semibold text-orange">{referrerName}</span>! 🎁
                <br />
                <span className="text-text-muted text-xs">You'll both earn 1,000 gift points when you complete your first trade.</span>
              </div>
            )}

            {success ? (
              <div className="mt-6 p-4 bg-green-400/10 border border-green-400/20 rounded-xl text-center">
                <i className="fa-regular fa-circle-check text-3xl text-green-400 block mb-2"></i>
                <p className="text-green-400 font-semibold">✅ Account created!</p>
                <p className="text-text-muted text-sm mt-1">
                  We've sent a confirmation link to <strong>{email}</strong>.
                  <br />Please check your email and click the link to activate your account.
                </p>
                <p className="text-text-muted text-xs mt-2">
                  After confirmation, you can <Link href="/auth/login" className="text-orange hover:underline">login here</Link>.
                </p>
                <p className="text-text-muted text-xs mt-1">
                  🎁 You'll receive <strong>1,000 gift points</strong> after verification!
                </p>
              </div>
            ) : (
              <form onSubmit={handleSignup} className="mt-8 space-y-4">
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
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Referral Code (optional)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                      <i className="fa-solid fa-gift"></i>
                    </span>
                    <input
                      type="text"
                      value={referralCodeInput}
                      onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                      className="w-full bg-black/40 border border-border rounded-xl px-12 py-3.5 text-text-primary placeholder:text-text-muted/60 focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 transition"
                      placeholder="Enter referral code (if you have one)"
                    />
                  </div>
                  <p className="text-xs text-text-muted mt-1">
                    Enter a friend's referral code to earn 1,000 gift points each after your first trade.
                  </p>
                </div>

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
            )}

            {!success && (
              <p className="text-center text-text-muted text-sm mt-6">
                Already have an account?{' '}
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
