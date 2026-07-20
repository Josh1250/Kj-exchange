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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
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

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-bg-secondary border-b border-border">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="shrink-0 group">
            <Image
              src="/logo.png"
              alt="KJ Exchange"
              width={100}
              height={100}
              className="w-20 md:w-24 h-auto transition-transform group-hover:scale-105"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6" ref={dropdownRef}>
            <Link href="/" className="text-text-muted hover:text-text-primary transition text-sm font-medium">
              Home
            </Link>

            {/* Crypto Dropdown */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'crypto' ? null : 'crypto')}
                className="flex items-center gap-1 text-text-muted hover:text-text-primary transition text-sm font-medium"
              >
                Crypto
                <svg className={`w-4 h-4 transition-transform duration-200 ${openDropdown === 'crypto' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openDropdown === 'crypto' && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-bg-card border border-border rounded-xl shadow-2xl py-2">
                  <Link href="/dashboard/sell-crypto" className="block px-4 py-2.5 text-sm text-text-muted hover:bg-orange/10 hover:text-orange transition" onClick={() => setOpenDropdown(null)}>
                    Sell Crypto
                  </Link>
                  <Link href="#" className="block px-4 py-2.5 text-sm text-text-muted hover:bg-orange/10 hover:text-orange transition opacity-60" onClick={() => setOpenDropdown(null)}>
                    Buy Crypto <span className="text-[10px] text-orange ml-1">Soon</span>
                  </Link>
                  <div className="border-t border-border my-1"></div>
                  <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-text-muted font-semibold">Popular Assets</div>
                  <Link href="#assets" className="block px-4 py-2 text-sm text-text-muted hover:bg-orange/10 hover:text-orange transition" onClick={() => setOpenDropdown(null)}>
                    Bitcoin (BTC)
                  </Link>
                  <Link href="#assets" className="block px-4 py-2 text-sm text-text-muted hover:bg-orange/10 hover:text-orange transition" onClick={() => setOpenDropdown(null)}>
                    Tether (USDT)
                  </Link>
                  <Link href="#assets" className="block px-4 py-2 text-sm text-text-muted hover:bg-orange/10 hover:text-orange transition" onClick={() => setOpenDropdown(null)}>
                    Ethereum (ETH)
                  </Link>
                  <Link href="#assets" className="block px-4 py-2 text-sm text-text-muted hover:bg-orange/10 hover:text-orange transition" onClick={() => setOpenDropdown(null)}>
                    Solana (SOL)
                  </Link>
                </div>
              )}
            </div>

            {/* Gift Cards Dropdown */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'giftcards' ? null : 'giftcards')}
                className="flex items-center gap-1 text-text-muted hover:text-text-primary transition text-sm font-medium"
              >
                Gift Cards
                <svg className={`w-4 h-4 transition-transform duration-200 ${openDropdown === 'giftcards' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openDropdown === 'giftcards' && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-bg-card border border-border rounded-xl shadow-2xl py-2">
                  <Link href="/dashboard/sell-gift-card" className="block px-4 py-2.5 text-sm text-text-muted hover:bg-orange/10 hover:text-orange transition" onClick={() => setOpenDropdown(null)}>
                    Sell Gift Cards
                  </Link>
                  <Link href="#" className="block px-4 py-2.5 text-sm text-text-muted hover:bg-orange/10 hover:text-orange transition opacity-60" onClick={() => setOpenDropdown(null)}>
                    Buy Gift Cards <span className="text-[10px] text-orange ml-1">Soon</span>
                  </Link>
                  <div className="border-t border-border my-1"></div>
                  <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-text-muted font-semibold">Popular Cards</div>
                  <Link href="#assets" className="block px-4 py-2 text-sm text-text-muted hover:bg-orange/10 hover:text-orange transition" onClick={() => setOpenDropdown(null)}>
                    Apple
                  </Link>
                  <Link href="#assets" className="block px-4 py-2 text-sm text-text-muted hover:bg-orange/10 hover:text-orange transition" onClick={() => setOpenDropdown(null)}>
                    Amazon
                  </Link>
                  <Link href="#assets" className="block px-4 py-2 text-sm text-text-muted hover:bg-orange/10 hover:text-orange transition" onClick={() => setOpenDropdown(null)}>
                    Google Play
                  </Link>
                  <Link href="#assets" className="block px-4 py-2 text-sm text-text-muted hover:bg-orange/10 hover:text-orange transition" onClick={() => setOpenDropdown(null)}>
                    Steam
                  </Link>
                </div>
              )}
            </div>

            <Link href="#calculator" className="text-text-muted hover:text-text-primary transition text-sm font-medium">
              Rates
            </Link>
            <Link href="#faq" className="text-text-muted hover:text-text-primary transition text-sm font-medium">
              FAQ
            </Link>
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-white/10 transition"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <span className="text-yellow-400 text-lg">☀️</span>
              ) : (
                <span className="text-indigo-400 text-lg">🌙</span>
              )}
            </button>

            {/* Auth */}
            {!loading && user ? (
              <>
                <Link href="/dashboard" className="text-text-muted hover:text-text-primary transition text-sm font-medium hidden sm:inline">
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="text-orange hover:text-orange-light transition text-sm font-medium">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-text-muted hover:text-text-primary transition text-sm font-medium hidden sm:inline">
                  Login
                </Link>
                <Link href="/auth/signup" className="bg-orange text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-orange-600 transition shadow-lg shadow-orange/30">
                  Sign Up Free
                </Link>
              </>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition focus:outline-none"
              aria-label="Toggle menu"
            >
              <div className="w-6 h-5 flex flex-col justify-between">
                <span className={`block h-0.5 bg-text-primary transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                <span className={`block h-0.5 bg-text-primary transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`block h-0.5 bg-text-primary transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-bg-secondary border-t border-border py-4 px-2 rounded-b-2xl shadow-2xl">
            <nav className="flex flex-col gap-1">
              <Link href="/" className="px-4 py-3 rounded-xl hover:bg-orange/10 hover:text-orange transition text-text-primary" onClick={closeMobileMenu}>
                Home
              </Link>
              <div className="px-4 py-1 text-[10px] uppercase tracking-wider text-text-muted font-semibold">Crypto</div>
              <Link href="/dashboard/sell-crypto" className="px-4 py-2 rounded-xl hover:bg-orange/10 hover:text-orange transition text-text-primary text-sm pl-8" onClick={closeMobileMenu}>
                Sell Crypto
              </Link>
              <Link href="#" className="px-4 py-2 rounded-xl hover:bg-orange/10 hover:text-orange transition text-text-primary text-sm pl-8 opacity-60" onClick={closeMobileMenu}>
                Buy Crypto <span className="text-[10px] text-orange">Soon</span>
              </Link>
              <div className="px-4 py-1 text-[10px] uppercase tracking-wider text-text-muted font-semibold">Gift Cards</div>
              <Link href="/dashboard/sell-gift-card" className="px-4 py-2 rounded-xl hover:bg-orange/10 hover:text-orange transition text-text-primary text-sm pl-8" onClick={closeMobileMenu}>
                Sell Gift Cards
              </Link>
              <Link href="#" className="px-4 py-2 rounded-xl hover:bg-orange/10 hover:text-orange transition text-text-primary text-sm pl-8 opacity-60" onClick={closeMobileMenu}>
                Buy Gift Cards <span className="text-[10px] text-orange">Soon</span>
              </Link>
              <div className="border-t border-border my-2"></div>
              <Link href="#calculator" className="px-4 py-3 rounded-xl hover:bg-orange/10 hover:text-orange transition text-text-primary" onClick={closeMobileMenu}>
                Rates
              </Link>
              <Link href="#faq" className="px-4 py-3 rounded-xl hover:bg-orange/10 hover:text-orange transition text-text-primary" onClick={closeMobileMenu}>
                FAQ
              </Link>
              <div className="border-t border-border my-2"></div>
              <Link href="/auth/login" className="px-4 py-3 rounded-xl hover:bg-orange/10 hover:text-orange transition text-text-primary" onClick={closeMobileMenu}>
                Login
              </Link>
              <Link href="/auth/signup" className="px-4 py-3 rounded-xl bg-orange text-white font-bold hover:bg-orange-600 transition text-center" onClick={closeMobileMenu}>
                Sign Up Free
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
