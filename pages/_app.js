import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from '../lib/supabaseClient';
import SessionTimeout from '../components/SessionTimeout';
import PageLoader from '../components/PageLoader';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={pageProps.initialSession}>
      <PageLoader />
      <SessionTimeout>
        <Component {...pageProps} />
      </SessionTimeout>
    </SessionContextProvider>
  );
}

export default MyApp;
