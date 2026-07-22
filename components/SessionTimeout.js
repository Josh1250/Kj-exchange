import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const WARNING_TIME = 60 * 1000; // 1 minute warning

export default function SessionTimeout({ children }) {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const timerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const countdownRef = useRef(null);

  const logout = async () => {
    localStorage.removeItem('sb-access-token');
    localStorage.removeItem('sb-refresh-token');
    localStorage.removeItem('sb-user-email');
    await supabase.auth.signOut();
    // Show a message on the login page
    router.push('/auth/login?expired=true');
  };

  const resetTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setShowWarning(false);
    setTimeLeft(60);

    // Start warning timer (1 minute before logout)
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      // Countdown
      countdownRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, INACTIVITY_TIMEOUT - WARNING_TIME);

    // Start logout timer
    timerRef.current = setTimeout(() => {
      logout();
    }, INACTIVITY_TIMEOUT);
  };

  const extendSession = () => {
    setShowWarning(false);
    setTimeLeft(60);
    if (countdownRef.current) clearInterval(countdownRef.current);
    resetTimers();
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
    };
    checkUser();

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    const handleActivity = () => {
      // Reset timers on any activity
      if (timerRef.current || warningTimerRef.current) {
        resetTimers();
      }
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    resetTimers();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  return (
    <>
      {children}
      {/* Premium Toast-style warning */}
      {showWarning && (
        <div className="fixed bottom-6 right-6 z-50 bg-bg-card border border-orange/30 rounded-2xl p-4 max-w-sm shadow-2xl backdrop-blur-xl animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-orange/10 flex items-center justify-center text-orange flex-shrink-0">
              <i className="fa-regular fa-clock"></i>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Session expiring soon</p>
              <p className="text-text-muted text-xs">
                You'll be logged out in <span className="text-orange font-bold">{timeLeft}s</span> due to inactivity.
              </p>
              <button
                onClick={extendSession}
                className="mt-2 bg-orange text-white text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-orange-600 transition"
              >
                Stay Logged In
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
