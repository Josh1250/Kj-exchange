import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const WARNING_TIME = 60 * 1000; // 1 minute before logout

export default function SessionTimeout({ children }) {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [timer, setTimer] = useState(null);
  const [warningTimer, setWarningTimer] = useState(null);

  // Function to logout
  const logout = async () => {
    // Clear localStorage
    localStorage.removeItem('sb-access-token');
    localStorage.removeItem('sb-refresh-token');
    localStorage.removeItem('sb-user-email');

    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  // Reset the inactivity timer
  const resetTimer = () => {
    // Clear existing timers
    if (timer) clearTimeout(timer);
    if (warningTimer) clearTimeout(warningTimer);

    setShowWarning(false);

    // Set new timer for warning
    const warnTimeout = setTimeout(() => {
      setShowWarning(true);
    }, INACTIVITY_TIMEOUT - WARNING_TIME);
    setWarningTimer(warnTimeout);

    // Set new timer for logout
    const logoutTimeout = setTimeout(() => {
      logout();
    }, INACTIVITY_TIMEOUT);
    setTimer(logoutTimeout);
  };

  // Handle user activity
  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    // If user is not logged in, don't run
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
    };
    checkUser();

    // Reset timer on any user activity
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click', 'keyup'];
    const handleActivity = () => resetTimer();

    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Initial start
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (timer) clearTimeout(timer);
      if (warningTimer) clearTimeout(warningTimer);
    };
  }, []);

  // If warning is shown, render modal
  if (showWarning) {
    return (
      <>
        {children}
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card rounded-2xl p-6 max-w-md w-full border border-border shadow-2xl">
            <h2 className="text-xl font-bold mb-2">⚠️ Session Expiring</h2>
            <p className="text-text-muted text-sm mb-4">
              You've been inactive for a while. You'll be logged out in 1 minute. Click "Stay Logged In" to continue.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowWarning(false);
                  resetTimer();
                }}
                className="flex-1 bg-orange text-white font-bold py-2 rounded-xl hover:bg-orange-600 transition"
              >
                Stay Logged In
              </button>
              <button
                onClick={logout}
                className="flex-1 border border-border text-text-primary py-2 rounded-xl hover:border-orange transition"
              >
                Logout Now
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return <>{children}</>;
}
