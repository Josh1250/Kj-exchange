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
  const isActive = (path) => router.pathname === path || router.pathname.startsWith(path + '/');

  // Public nav items (without Services dropdown)
  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Rates', href: '/rates' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Contact', href: '/contact' },
  ];

  // Dashboard nav items (shown when logged in)
  const dashboardNav = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Products', href: '/dashboard/products' },
    { name: 'Wallet', href: '/dashboard/wallet' },
    { name: 'Rates', href: '/rates' },
  ];

  const nav = !loading && user ? dashboardNav : navItems;

  return (
    <header className="sticky top-0 z-50 bg-bg-secondary/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
        {/* Logo - BIGGER */}
        <Link href="/" className="shrink-0 group">
          <Image
            src="/logo.png"
            alt="KJ Exchange"
            width={220}
            height={220}
            className="w-44 md:w-56 h-auto transition-transform group-hover:scale-105"
            priority
          />
        </Link>

        {/* Desktop Navigation - Services dropdown removed */}
        <nav className="hidden md:flex items-center gap-6">
          {nav.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`text-sm font-medium transition relative ${
                isActive(item.href)
                  ? 'text-text-primary after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-0.5 after:bg-orange after:rounded-full'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {item.name}
            </Link>
          ))}
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

          {!loading && user ? (
            <>
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-2 hover:bg-white/10 rounded-full px-3 py-1 transition"
              >
                <div className="w-8 h-8 rounded-full bg-orange/20 flex items-center justify-center text-orange font-bold text-sm">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-sm text-text-muted hidden sm:inline">
                  {user?.email?.split('@')[0]}
                </span>
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
                className="px-4 py-2 text-sm font-semibold text-text-primary hover:text-orange transition border border-border hover:border-orange rounded-full hidden sm:inline-block"
              >
                Log In
              </Link>
              <Link
                href="/auth/register"
                className="bg-orange text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-orange-600 transition shadow-lg shadow-orange/30 whitespace-nowrap"
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

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-bg-card/95 backdrop-blur-xl border-t border-border rounded-b-2xl shadow-2xl overflow-hidden transition-all duration-300">
          <nav className="flex flex-col gap-1 p-4">
            {nav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-4 py-3 rounded-xl hover:bg-orange/10 hover:text-orange transition text-text-primary ${
                  isActive(item.href) ? 'bg-orange/10 text-orange' : ''
                }`}
                onClick={closeMobileMenu}
              >
                {item.name}
              </Link>
            ))}
            {!user && !loading && (
              <>
                <div className="px-4 py-1 text-[10px] uppercase tracking-wider text-text-muted font-semibold mt-2">Services</div>
                <Link href="/dashboard/sell-gift-card" className="px-4 py-2 rounded-xl hover:bg-orange/10 hover:text-orange transition text-text-primary text-sm pl-8" onClick={closeMobileMenu}>
                  <i className="fa-solid fa-gift text-orange w-5 text-center mr-2"></i>Gift Cards
                </Link>
                <Link href="/dashboard/sell-crypto" className="px-4 py-2 rounded-xl hover:bg-orange/10 hover:text-orange transition text-text-primary text-sm pl-8" onClick={closeMobileMenu}>
                  <i className="fa-brands fa-bitcoin text-orange w-5 text-center mr-2"></i>Crypto
                </Link>
                <div className="px-4 py-2 text-sm text-text-muted opacity-60 pl-8">
                  <i className="fa-regular fa-lightbulb w-5 text-center mr-2"></i>Pay Bills <span className="text-[10px] text-orange ml-1">Soon</span>
                </div>
                <div className="px-4 py-2 text-sm text-text-muted opacity-60 pl-8">
                  <i className="fa-solid fa-mobile-screen w-5 text-center mr-2"></i>Buy Airtime <span className="text-[10px] text-orange ml-1">Soon</span>
                </div>
              </>
            )}
            <div className="border-t border-border my-2"></div>
            {!user && !loading ? (
              <>
                <Link href="/auth/login" className="px-4 py-3 rounded-xl hover:bg-orange/10 hover:text-orange transition text-text-primary" onClick={closeMobileMenu}>
                  Login
                </Link>
                <Link href="/auth/register" className="px-4 py-3 rounded-xl bg-orange text-white font-bold hover:bg-orange-600 transition text-center" onClick={closeMobileMenu}>
                  Sign Up Free
                </Link>
              </>
            ) : (
              <button onClick={handleLogout} className="px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition text-left">
                Logout
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
