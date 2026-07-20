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

  // Close menu on route change
  useEffect(() => {
    const handleRouteChange = () => setIsMenuOpen(false);
    router.events?.on('routeChangeStart', handleRouteChange);
    return () => router.events?.off('routeChangeStart', handleRouteChange);
  }, [router.events]);

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
      {isMenuOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={closeMenu}
          ></div>

          {/* Drawer */}
          <div
            ref={menuRef}
            className={`fixed top-0 left-0 h-full w-80 bg-bg-secondary/95 backdrop-blur-xl border-r border-border shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
              isMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="p-6 flex flex-col h-full">
              {/* Header inside drawer */}
              <div className="flex items-center justify-between">
                <Image
                  src="/logo.png"
                  alt="KJ Exchange"
                  width={60}
                  height={60}
                  className="w-16 h-auto"
                />
                <button
                  onClick={closeMenu}
                  className="p-2 rounded-lg hover:bg-white/10 transition text-text-primary text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="border-t border-border my-6"></div>

              {/* Navigation Links */}
              <nav className="flex flex-col gap-2">
                <Link
                  href="/"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-primary hover:bg-orange/10 hover:text-orange transition text-base font-medium"
                  onClick={closeMenu}
                >
                  <span className="text-2xl">🏠</span> Home
                </Link>
                <Link
                  href="/dashboard/sell-gift-card"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-primary hover:bg-orange/10 hover:text-orange transition text-base font-medium"
                  onClick={closeMenu}
                >
                  <span className="text-2xl">🎁</span> Gift Cards
                </Link>
                <Link
                  href="/dashboard/sell-crypto"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-primary hover:bg-orange/10 hover:text-orange transition text-base font-medium"
                  onClick={closeMenu}
                >
                  <span className="text-2xl">₿</span> Crypto
                </Link>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-muted text-base font-medium opacity-60">
                  <span className="text-2xl">💡</span> Pay Bills <span className="text-xs text-orange ml-1">Soon</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-muted text-base font-medium opacity-60">
                  <span className="text-2xl">📱</span> Buy Airtime <span className="text-xs text-orange ml-1">Soon</span>
                </div>
                <Link
                  href="#calculator"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-primary hover:bg-orange/10 hover:text-orange transition text-base font-medium"
                  onClick={closeMenu}
                >
                  <span className="text-2xl">📊</span> Rates
                </Link>
                <Link
                  href="#faq"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-primary hover:bg-orange/10 hover:text-orange transition text-base font-medium"
                  onClick={closeMenu}
                >
                  <span className="text-2xl">❓</span> FAQ
                </Link>
                <Link
                  href="#contact"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-primary hover:bg-orange/10 hover:text-orange transition text-base font-medium"
                  onClick={closeMenu}
                >
                  <span className="text-2xl">📞</span> Contact
                </Link>
              </nav>

              {/* Footer inside drawer */}
              <div className="mt-auto pt-6 border-t border-border">
                <p className="text-text-muted text-sm">Trade Smart. Trade Secure.</p>
                <p className="text-text-muted text-xs mt-1">0% fees · Trusted since 2022</p>
                <div className="flex gap-4 mt-4">
                  <a
                    href="https://instagram.com/kj_xchange"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-text-muted hover:text-orange transition text-xl"
                  >
                    <i className="fab fa-instagram"></i>
                  </a>
                  <a
                    href="https://tiktok.com/@kj_xchange"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-text-muted hover:text-orange transition text-xl"
                  >
                    <i className="fab fa-tiktok"></i>
                  </a>
                  <a
                    href="https://wa.me/2348160678317"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-text-muted hover:text-orange transition text-xl"
                  >
                    <i className="fab fa-whatsapp"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
