import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function PageLoader() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => setTimeout(() => setLoading(false), 400);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-primary/80 backdrop-blur-md">
      {/* Glow orbs */}
      <div className="absolute w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute w-40 h-40 bg-orange-500/20 rounded-full blur-3xl animate-pulse-slow delay-500"></div>

      {/* Orbiting dots */}
      <div className="relative w-20 h-20">
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 bg-orange-500 rounded-full animate-pulse-center"></div>
        </div>

        {/* Orbiting dots */}
        <div className="absolute inset-0 animate-spin-slow">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-purple-400 rounded-full shadow-lg shadow-purple-400/50"></div>
        </div>
        <div className="absolute inset-0 animate-spin-slow-reverse">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-orange-400 rounded-full shadow-lg shadow-orange-400/50"></div>
        </div>
        <div className="absolute inset-0 animate-spin-slow" style={{ animationDuration: '3s' }}>
          <div className="absolute top-1/2 right-0 translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-lg shadow-white/30"></div>
        </div>
      </div>

      {/* Brand tagline */}
      <div className="mt-6 text-center">
        <p className="text-text-muted text-sm tracking-widest">Trade Smart. Trade Secure.</p>
      </div>

      {/* Shimmering progress bar */}
      <div className="mt-8 w-48 h-0.5 bg-border rounded-full overflow-hidden">
        <div className="h-full w-full bg-gradient-to-r from-purple-500 via-orange-500 to-purple-500 bg-[length:200%_100%] animate-shimmer-bar"></div>
      </div>
    </div>
  );
}
