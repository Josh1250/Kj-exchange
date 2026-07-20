import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
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
        <title>Login · KJ Exchange</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
        <div className="bg-bg-card backdrop-blur-xl p-8 rounded-lg border border-border w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold">
              <span className="text-purple">KJ</span>
              <span className="text-gray-400">Exchange</span>
            </h1>
            <p className="text-text-muted text-sm mt-1">Trade Smart. Trade Secure.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-border rounded-lg px-4 py-3 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange-glow/30"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-border rounded-lg px-4 py-3 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange-glow/30"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange text-white font-bold py-3 rounded-full hover:bg-orange-light transition disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="text-center text-text-muted mt-4 text-sm">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-orange hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
