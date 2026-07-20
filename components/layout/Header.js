import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../pages/_app';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

export default function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isDark, setIsDark] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    <header className="sticky top-0 z-50 bg-bg-secondary/90 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo - BIG AND BOLD */}
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

          {/* Desktop Navigation (visible on md+) */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-text-muted hover:text-text-primary transition text-sm font-medium">
              Home
            </Link>
            <Link href="#services" className="text-text-muted hover:text-text-primary transition text-sm font-medium">
              Services
            </Link>
            <Link href="#assets" className="text-text-muted hover:text-text-primary transition text-sm font-medium">
              Assets
            </Link>
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

            {/* Auth Buttons */}
            {!loading && user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-text-muted hover:text-text-primary transition text-sm font-medium hidden sm:inline"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-orange hover:text-orange-light transition text-sm font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-text-muted hover:text-text-primary transition text-sm font-medium hidden sm:inline"
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-orange text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-orange-600 transition shadow-lg shadow-orange/30"
                >
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

        {/* Mobile Menu (slide down) */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-bg-secondary border-t border-border py-4 px-2 rounded-b-2xl shadow-2xl">
            <nav className="flex flex-col gap-2">
              <Link href="/" className="px-4 py-3 rounded-xl hover:bg-orange/10 hover:text-orange transition text-text-primary" onClick={closeMobileMenu}>
                🏠 Home
              </Link>
              <Link href="#services" className="px-4 py-3 rounded-xl hover:bg-orange/10 hover:text-orange transition text-text-primary" onClick={closeMobileMenu}>
                🎁 Services
              </Link>
              <Link href="#assets" className="px-4 py-3 rounded-xl hover:bg-orange/10 hover:text-orange transition text-text-primary" onClick={closeMobileMenu}>
                📦 Assets
              </Link>
              <Link href="#calculator" className="px-4 py-3 rounded-xl hover:bg-orange/10 hover:text-orange transition text-text-primary" onClick={closeMobileMenu}>
                📊 Rates
              </Link>
              <Link href="#faq" className="px-4 py-3 rounded-xl hover:bg-orange/10 hover:text-orange transition text-text-primary" onClick={closeMobileMenu}>
                ❓ FAQ
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
