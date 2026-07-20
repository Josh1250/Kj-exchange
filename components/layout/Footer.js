import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-border bg-bg-secondary/50 backdrop-blur-sm">
      {/* Animated gradient line at top */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 via-orange-500 to-purple-500 bg-[length:200%_100%] animate-shimmer opacity-60"></div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1: Brand */}
          <div className="space-y-4">
            <Link href="/" className="block group">
              <Image
                src="/logo.png"
                alt="KJ Exchange"
                width={80}
                height={80}
                className="w-20 h-auto transition-transform group-hover:scale-105"
              />
            </Link>
            <p className="text-text-muted text-sm leading-relaxed max-w-xs">
              Trade Smart. Trade Secure.
            </p>
            <p className="text-text-muted text-sm leading-relaxed max-w-xs">
              0% fees on every trade. Trusted by 500+ customers.
            </p>
            <div className="flex gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 text-xs bg-green-400/10 text-green-400 border border-green-400/20 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                100% Secure
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs bg-orange/10 text-orange border border-orange/20 px-3 py-1 rounded-full">
                ⚡ 0% Fees
              </span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-text-secondary font-semibold text-sm uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/" className="text-text-muted hover:text-orange transition text-sm flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-orange rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Home
                </Link>
              </li>
              <li>
                <Link href="#services" className="text-text-muted hover:text-orange transition text-sm flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-orange rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Services
                </Link>
              </li>
              <li>
                <Link href="#assets" className="text-text-muted hover:text-orange transition text-sm flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-orange rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Supported Assets
                </Link>
              </li>
              <li>
                <Link href="#faq" className="text-text-muted hover:text-orange transition text-sm flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-orange rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="#contact" className="text-text-muted hover:text-orange transition text-sm flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-orange rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Services */}
          <div>
            <h4 className="text-text-secondary font-semibold text-sm uppercase tracking-wider mb-4">Our Services</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/dashboard/sell-gift-card" className="text-text-muted hover:text-orange transition text-sm flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-orange rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  🎁 Gift Cards
                </Link>
              </li>
              <li>
                <Link href="/dashboard/sell-crypto" className="text-text-muted hover:text-orange transition text-sm flex items-center gap-2 group">
                  <span className="w-1 h-1 bg-orange rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  ₿ Crypto
                </Link>
              </li>
              <li>
                <span className="text-text-muted text-sm flex items-center gap-2 opacity-60">
                  <span className="w-1 h-1 bg-orange rounded-full opacity-0"></span>
                  💡 Pay Bills <span className="text-[10px] text-orange/60 ml-1">(Soon)</span>
                </span>
              </li>
              <li>
                <span className="text-text-muted text-sm flex items-center gap-2 opacity-60">
                  <span className="w-1 h-1 bg-orange rounded-full opacity-0"></span>
                  📱 Buy Airtime <span className="text-[10px] text-orange/60 ml-1">(Soon)</span>
                </span>
              </li>
            </ul>
          </div>

          {/* Column 4: Connect */}
          <div>
            <h4 className="text-text-secondary font-semibold text-sm uppercase tracking-wider mb-4">Connect With Us</h4>
            <div className="space-y-3">
              <a
                href="https://wa.me/2348160678317"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-text-muted hover:text-orange transition group"
              >
                <span className="w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 group-hover:bg-green-500/20 transition">
                  <i className="fab fa-whatsapp text-lg"></i>
                </span>
                <span className="text-sm">081 606 78317</span>
              </a>
              <a
                href="mailto:support@kjexchange.com"
                className="flex items-center gap-3 text-text-muted hover:text-orange transition group"
              >
                <span className="w-9 h-9 rounded-full bg-orange/10 flex items-center justify-center text-orange group-hover:bg-orange/20 transition">
                  <i className="fas fa-envelope text-lg"></i>
                </span>
                <span className="text-sm">support@kjexchange.com</span>
              </a>
              <div className="flex gap-4 pt-2">
                <a
                  href="https://instagram.com/kj_xchange"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-bg-card border border-border flex items-center justify-center text-text-muted hover:text-orange hover:border-orange transition-all duration-300"
                >
                  <i className="fab fa-instagram text-lg"></i>
                </a>
                <a
                  href="https://tiktok.com/@kj_xchange"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-bg-card border border-border flex items-center justify-center text-text-muted hover:text-orange hover:border-orange transition-all duration-300"
                >
                  <i className="fab fa-tiktok text-lg"></i>
                </a>
                <a
                  href="https://wa.me/2348160678317"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-bg-card border border-border flex items-center justify-center text-text-muted hover:text-orange hover:border-orange transition-all duration-300"
                >
                  <i className="fab fa-whatsapp text-lg"></i>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-text-muted text-sm">
            &copy; {currentYear} <span className="text-text-secondary font-semibold">KJ Exchange</span>. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
              Secure &amp; Trusted
            </span>
            <span className="text-border">|</span>
            <span>0% Fees</span>
            <span className="text-border">|</span>
            <a href="#" className="hover:text-orange transition">Privacy Policy</a>
          </div>
          <a
            href="#top"
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-orange transition border border-border hover:border-orange rounded-full px-4 py-1.5"
          >
            <i className="fas fa-chevron-up text-[10px]"></i>
            Back to Top
          </a>
        </div>
      </div>
    </footer>
  );
}
