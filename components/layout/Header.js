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

  // Load theme preference
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

  return (
    <header className="sticky top-0 z-50 bg-bg-secondary/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/logo.png"
            alt="KJ Exchange"
            width={48}
            height={48}
            className="h-12 w-auto transition-transform group-hover:scale-105"
            priority
          />
          <span className="text-xl font-bold hidden sm:block">
            <span className="text-purple">KJ</span>
            <span className="text-gray-400">Exchange</span>
          </span>
        </Link>

        {/* Navigation Links (Desktop) */}
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
                className="text-text-muted hover:text-text-primary transition text-sm font-medium"
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
                className="text-text-muted hover:text-text-primary transition text-sm font-medium"
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
        </div>
      </div>
    </header>
  );
}
