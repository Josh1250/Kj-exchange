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

  // ✅ Updated nav items (Home, Products dropdown, Rates, FAQ, Contact)
  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Products', href: '#', dropdown: true },
    { name: 'Rates', href: '/rates' },
    { name: 'FAQ', href: '/#faq' },
    { name: 'Contact', href: '/contact' },
  ];

  // Products dropdown items
  const productItems = [
    { name: 'Gift Cards', href: '/dashboard/sell-gift-card', icon: 'fa-solid fa-gift' },
    { name: 'Crypto', href: '/dashboard/sell', icon: 'fa-brands fa-bitcoin' },
    { name: 'Pay Bills', href: '#', icon: 'fa-credit-card' },
    { name: 'Airtime & Data', href: '#', icon: 'fa-solid fa-wifi' },
    { name: 'USD Wallet', href: '/dashboard/convert', icon: 'fa-solid fa-dollar-sign' },
    { name: 'Rate Calculator', href: '/rates', icon: 'fa-solid fa-calculator' },
  ];

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
        {/* Logo */}
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

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {nav.map((item) => {
            if (item.dropdown) {
              // Products Dropdown
              return (
                <div key={item.name} className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setOpenDropdown(openDropdown === 'products' ? null : 'products')}
                    className={`flex items-center gap-1 text-sm font-medium transition ${
                      openDropdown === 'products' || isActive('/dashboard/sell-gift-card') || isActive('/dashboard/sell') || isActive('/dashboard/convert')
                        ? 'text-text-primary'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    Products
                    <svg className={`w-4 h-4 transition-transform duration-200 ${openDropdown === 'products' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openDropdown === 'products' && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-bg-card backdrop-blur-xl border border-border rounded-xl shadow-2xl py-2 overflow-hidden">
                      {productItems.map((product) => (
                        <Link
                          key={product.name}
                          href={product.href}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-muted hover:bg-orange/10 hover:text-orange transition"
                          onClick={() => setOpenDropdown(null)}
                        >
                          <i className={`${product.icon} text-orange w-5 text-center`}></i>
                          <span>{product.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
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
            );
          })}
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
                className="px-5 py-2 text-sm font-semibold text-text-primary hover:text-orange transition border border-border hover:border-orange rounded-full"
              >
                Log In
              </Link>
              <Link
                href="/auth/register"
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2 rounded-full text-sm font-bold hover:shadow-lg hover:shadow-orange/30 transition-all duration-300"
              >
                Get Started
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
            {/* Home */}
            <Link href="/" className="px-4 py-3 rounded-xl hover:bg-orange/10 hover:text-orange transition text-text-primary" onClick={closeMobileMenu}>
              Home
            </Link>

            {/* Products (with sub-items) */}
            <div className="px-4 py-2 text-sm font-semibold text-text-muted">Products</div>
            {productItems.map((product) => (
              <Link
                key={product.name}
                href={product.href}
                className="px-4 py-2 rounded-xl hover:bg-orange/10 hover:text-orange transition text-text-primary text-sm pl-8"
                onClick={closeMobileMenu}
              >
                <i className={`${product.icon} text-orange w-5 text-center mr-2`}></i>
                {product.name}
              </Link>
            ))}

            <Link href="/rates" className="px-4 py-3 rounded-xl hover:bg-orange/10 hover:text-orange transition text-text-primary" onClick={closeMobileMenu}>
              Rates
            </Link>
            <Link href="/#faq" className="px-4 py-3 rounded-xl hover:bg-orange/10 hover:text-orange transition text-text-primary" onClick={closeMobileMenu}>
              FAQ
            </Link>
            <Link href="/contact" className="px-4 py-3 rounded-xl hover:bg-orange/10 hover:text-orange transition text-text-primary" onClick={closeMobileMenu}>
              Contact
            </Link>

            <div className="border-t border-border my-2"></div>
            {!user && !loading ? (
              <>
                <Link href="/auth/login" className="px-4 py-3 rounded-xl hover:bg-orange/10 hover:text-orange transition text-text-primary" onClick={closeMobileMenu}>
                  Log In
                </Link>
                <Link href="/auth/register" className="px-4 py-3 rounded-xl bg-orange text-white font-bold hover:bg-orange-600 transition text-center" onClick={closeMobileMenu}>
                  Get Started
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
