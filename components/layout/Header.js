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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

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

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
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

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-bg-secondary/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        {/* Left: Hamburger + Logo */}
        <div className="flex items-center gap-4">
          {/* Hamburger Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg hover:bg-white/10 transition focus:outline-none"
            aria-label="Toggle menu"
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span className={`block h-0.5 bg-text-primary transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
              <span className={`block h-0.5 bg-text-primary transition-all duration-300 ${isMenuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`block h-0.5 bg-text-primary transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
            </div>
          </button>

          {/* Logo - BIG AND BOLD */}
          <Link href="/" className="shrink-0 group">
            <Image
              src="/logo.png"
              alt="KJ Exchange"
              width={100}
              height={100}
              className="w-24 h-auto transition-transform group-hover:scale-105"
              priority
            />
          </Link>
        </div>

        {/* Right: Theme Toggle + Auth */}
        <div className="flex items-center gap-3">
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

          {!loading && user ? (
            <>
              <Link
                href="/dashboard"
                className="text-text-muted hover:text-text-primary transition text-sm font-medium whitespace-nowrap"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="text-orange hover:text-orange-light transition text-sm font-medium whitespace-nowrap"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-text-muted hover:text-text-primary transition text-sm font-medium hidden sm:inline whitespace-nowrap"
              >
                Login
              </Link>
              <Link
                href="/auth/signup"
                className="bg-orange text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-orange-600 transition shadow-lg shadow-orange/30 whitespace-nowrap"
              >
                Sign Up Free
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ========== SLIDE-OUT MENU (DRAWER) ========== */}
      <div
        ref={menuRef}
        className={`fixed top-0 left-0 h-full w-72 bg-bg-card backdrop-blur-xl border-r border-border shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex flex-col h-full">
          {/* Close button */}
          <button
            onClick={closeMenu}
            className="self-end p-2 rounded-lg hover:bg-white/10 transition"
          >
            ✕
          </button>

          {/* Logo inside drawer (optional) */}
          <div className="mt-4 mb-8">
            <Image
              src="/logo.png"
              alt="KJ Exchange"
              width={80}
              height={80}
              className="w-20 h-auto"
            />
          </div>

          <nav className="flex flex-col gap-4">
            <Link href="/" className="text-text-primary hover:text-orange transition text-lg font-medium" onClick={closeMenu}>
              🏠 Home
            </Link>
            <Link href="/dashboard/sell-gift-card" className="text-text-primary hover:text-orange transition text-lg font-medium" onClick={closeMenu}>
              🎁 Gift Cards
            </Link>
            <Link href="/dashboard/sell-crypto" className="text-text-primary hover:text-orange transition text-lg font-medium" onClick={closeMenu}>
              ₿ Crypto
            </Link>
            <div className="text-text-muted text-lg font-medium opacity-60 flex items-center gap-2">
              💡 Pay Bills <span className="text-xs text-orange">Soon</span>
            </div>
            <div className="text-text-muted text-lg font-medium opacity-60 flex items-center gap-2">
              📱 Buy Airtime <span className="text-xs text-orange">Soon</span>
            </div>
            <Link href="#calculator" className="text-text-primary hover:text-orange transition text-lg font-medium" onClick={closeMenu}>
              📊 Rates
            </Link>
            <Link href="#faq" className="text-text-primary hover:text-orange transition text-lg font-medium" onClick={closeMenu}>
              ❓ FAQ
            </Link>
            <Link href="#contact" className="text-text-primary hover:text-orange transition text-lg font-medium" onClick={closeMenu}>
              📞 Contact
            </Link>
          </nav>

          <div className="mt-auto pt-6 border-t border-border">
            <p className="text-text-muted text-sm">Trade Smart. Trade Secure.</p>
            <p className="text-text-muted text-xs mt-1">0% fees · Trusted since 2022</p>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={closeMenu}
        ></div>
      )}
    </header>
  );
}
