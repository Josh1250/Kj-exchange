import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';
import '../styles/globals.css';
import Head from 'next/head';

// Auth Context
const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

function MyApp({ Component, pageProps }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => listener?.subscription?.unsubscribe();
  }, []);

  const value = { user, loading };

  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#4E1F91" />
        <meta name="description" content="Sell your crypto and gift cards instantly with KJ Exchange. 0% fees. No hidden charges. Trusted since 2022." />
        <meta property="og:title" content="KJ Exchange · Trade Smart. Trade Secure." />
        <meta property="og:description" content="Sell your crypto and gift cards instantly with KJ Exchange. 0% fees. No hidden charges." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://kjexchange.com" />
        <meta name="twitter:card" content="summary_large_image" />
        <title>KJ Exchange · Trade Smart. Trade Secure.</title>
      </Head>
      <AuthContext.Provider value={value}>
        <Component {...pageProps} />
      </AuthContext.Provider>
    </>
  );
}

export default MyApp;
