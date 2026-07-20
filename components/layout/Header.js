import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../pages/_app';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';

export default function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isDark, setIsDark] = useState(true);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isAssetsOpen, setIsAssetsOpen] = useState(false);
  const servicesRef = useRef(null);
  const assetsRef = useRef(null);

  // Load theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('kj-theme');
    if (savedTheme === 'light') {
      setIsDark(false);
      document.documentElement.classList.add('light-mode');
    } else {
      setIsDark(true);
      document.documentElement.classList.remove('light-mode');
    }
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (servicesRef.current && !servicesRef.current.contains(event.target)) {
        setIsServicesOpen(false);
      }
      if (assetsRef.current && !assetsRef.current.contains(event.target)) {
        setIsAssetsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.remove('light-mode');
      localStorage.setItem('kj-theme', 'dark');
    } else {
      document.documentElement.classList.add('light-mode');
      localStorage.setItem('kj-theme', 'light');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-bg-secondary/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        {/* Logo - ONLY IMAGE, BIGGER */}
        <Link href="/" className="shrink-0 group">
          <Image
            src="/logo.png"
            alt="KJ Exchange"
            width={64}
            height={64}
            className="h-16 w-auto transition-transform group-hover:scale-105"
            priority
          />
        </Link>

        {/* Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-text-muted hover:text-text-primary transition text-sm font-medium">
            Home
          </Link>

          {/* Services Dropdown */}
          <div ref={servicesRef} className="relative">
            <button
              onClick={() => setIsServicesOpen(!isServicesOpen)}
              className="flex items-center gap-1 text-text-muted hover:text-text-primary transition text-sm font-medium"
            >
              Services
              <svg className={`w-4 h-4 transition-transform duration-200 ${isServicesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isServicesOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-bg-card backdrop-blur-xl border border-border rounded-xl shadow-2xl py-2 overflow-hidden">
                <Link href="/dashboard/sell-gift-card" className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-muted hover:bg-orange/10 hover:text-orange transition" onClick={() => setIsServicesOpen(false)}>
                  <span className="text-lg">🎁</span>
                  <div><p className="font-medium">Gift Cards</p><p className="text-xs text-text-muted">Sell Apple, Amazon & more</p></div>
                </Link>
                <Link href="/dashboard/sell-crypto" className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-muted hover:bg-orange/10 hover:text-orange transition" onClick={() => setIsServicesOpen(false)}>
                  <span className="text-lg">₿</span>
                  <div><p className="font-medium">Crypto</p><p className="text-xs text-text-muted">Sell BTC, USDT, ETH & more</p></div>
                </Link>
                <div className="border-t border-border my-1"></div>
                <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-muted opacity-60">
                  <span className="text-lg">💡</span>
                  <div><p className="font-medium">Pay Bills <span className="text-[10px] text-orange ml-1">Soon</span></p><p className="text-xs text-text-muted">Electricity, TV, Internet</p></div>
                </div>
                <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-muted opacity-60">
                  <span className="text-lg">📱</span>
                  <div><p className="font-medium">Buy Airtime <span className="text-[10px] text-orange ml-1">Soon</span></p><p className="text-xs text-text-muted">MTN, Glo, Airtel, 9mobile</p></div>
                </div>
              </div>
            )}
          </div>

          {/* Assets Dropdown */}
          <div ref={assetsRef} className="relative">
            <button
              onClick={() => setIsAssetsOpen(!isAssetsOpen)}
              className="flex items-center gap-1 text-text-muted hover:text-text-primary transition text-sm font-medium"
            >
              Assets
              <svg className={`w-4 h-4 transition-transform duration-200 ${isAssetsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isAssetsOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-bg-card backdrop-blur-xl border border-border rounded-xl shadow-2xl py-2 overflow-hidden">
                <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-text-muted font-semibold">Crypto</div>
                <Link href="#assets" className="flex items-center gap-3 px-4 py-2 text-sm text-text-muted hover:bg-orange/10 hover:text-orange transition" onClick={() => setIsAssetsOpen(false)}>
                  <span className="text-lg text-[#f7931a]">₿</span><span>Bitcoin (BTC)</span>
                </Link>
                <Link href="#assets" className="flex items-center gap-3 px-4 py-2 text-sm text-text-muted hover:bg-orange/10 hover:text-orange transition" onClick={() => setIsAssetsOpen(false)}>
                  <span className="text-lg text-[#26a17b]">₮</span><span>Tether (USDT)</span>
                </Link>
                <Link href="#assets" className="flex items-center gap-3 px-4 py-2 text-sm text-text-muted hover:bg-orange/10 hover:text-orange transition" onClick={() => setIsAssetsOpen(false)}>
                  <span className="text-lg text-[#627eea]">⟠</span><span>Ethereum (ETH)</span>
                </Link>
                <Link href="#assets" className="flex items-center gap-3 px-4 py-2 text-sm text-text-muted hover:bg-orange/10 hover:text-orange transition" onClick={() => setIsAssetsOpen(false)}>
                  <span className="text-lg text-[#9945FF]">◎</span><span>Solana (SOL)</span>
                </Link>
                <div className="border-t border-border my-1"></div>
                <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-text-muted font-semibold">Gift Cards</div>
                <Link href="#assets" className="flex items-center gap-3 px-4 py-2 text-sm text-text-muted hover:bg-orange/10 hover:text-orange transition" onClick={() => setIsAssetsOpen(false)}>
                  <span className="text-lg text-[#a2aaad]">🍎</span><span>Apple</span>
                </Link>
                <Link href="#assets" className="flex items-center gap-3 px-4 py-2 text-sm text-text-muted hover:bg-orange/10 hover:text-orange transition" onClick={() => setIsAssetsOpen(false)}>
                  <span className="text-lg text-[#ff9900]">📦</span><span>Amazon</span>
                </Link>
                <Link href="#assets" className="flex items-center gap-3 px-4 py-2 text-sm text-text-muted hover:bg-orange/10 hover:text-orange transition" onClick={() => setIsAssetsOpen(false)}>
                  <span className="text-lg text-[#34a853]">▶️</span><span>Google Play</span>
                </Link>
                <Link href="#assets" className="flex items-center gap-3 px-4 py-2 text-sm text-text-muted hover:bg-orange/10 hover:text-orange transition" onClick={() => setIsAssetsOpen(false)}>
                  <span className="text-lg">🎮</span><span>Steam</span>
                </Link>
                <div className="border-t border-border my-1"></div>
                <Link href="#assets" className="flex items-center gap-3 px-4 py-2.5 text-sm text-orange hover:bg-orange/10 transition" onClick={() => setIsAssetsOpen(false)}>
                  <span>View All Assets →</span>
                </Link>
              </div>
            )}
          </div>

          <Link href="#calculator" className="text-text-muted hover:text-text-primary transition text-sm font-medium">Rates</Link>
          <Link href="#faq" className="text-text-muted hover:text-text-primary transition text-sm font-medium">FAQ</Link>
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-white/10 transition" aria-label="Toggle theme">
            {isDark ? <span className="text-yellow-400 text-lg">☀️</span> : <span className="text-indigo-400 text-lg">🌙</span>}
          </button>

          {!loading && user ? (
            <>
              <Link href="/dashboard" className="text-text-muted hover:text-text-primary transition text-sm font-medium">Dashboard</Link>
              <button onClick={handleLogout} className="text-orange hover:text-orange-light transition text-sm font-medium">Logout</button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-text-muted hover:text-text-primary transition text-sm font-medium hidden sm:inline">Login</Link>
              <Link href="/auth/signup" className="bg-orange text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-orange-600 transition shadow-lg shadow-orange/30">Sign Up Free</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
