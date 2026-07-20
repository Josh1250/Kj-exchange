import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-bg-secondary border-t border-border mt-12">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Image 
                src="/logo.png" 
                alt="KJ Exchange" 
                width={32} 
                height={32} 
                className="h-8 w-auto"
              />
              <h3 className="text-2xl font-bold">
                <span className="text-purple">KJ</span>
                <span className="text-gray-400">Exchange</span>
              </h3>
            </div>
            <p className="text-text-muted text-sm mt-2">Trade Smart. Trade Secure.</p>
            <p className="text-text-muted text-sm mt-2">
              0% fees on every trade. Trusted since 2022.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-text-secondary font-semibold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-text-muted hover:text-orange transition">Home</Link></li>
              <li><Link href="/#services" className="text-text-muted hover:text-orange transition">Services</Link></li>
              <li><Link href="/#faq" className="text-text-muted hover:text-orange transition">FAQ</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-text-secondary font-semibold mb-3">Services</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/dashboard/sell-gift-card" className="text-text-muted hover:text-orange transition">Gift Card Exchange</Link></li>
              <li><Link href="/dashboard/sell-crypto" className="text-text-muted hover:text-orange transition">Crypto Exchange</Link></li>
              <li><Link href="/dashboard/swap" className="text-text-muted hover:text-orange transition">Swap Crypto</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-text-secondary font-semibold mb-3">Connect</h4>
            <div className="flex gap-4">
              <a href="https://instagram.com/kj_xchange" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-orange transition text-xl">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="https://tiktok.com/@kj_xchange" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-orange transition text-xl">
                <i className="fab fa-tiktok"></i>
              </a>
              <a href="https://wa.me/2348160678317" target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-orange transition text-xl">
                <i className="fab fa-whatsapp"></i>
              </a>
            </div>
            <p className="text-text-muted text-sm mt-4">
              <i className="fas fa-phone mr-2 text-orange"></i>
              <a href="tel:+2348160678317" className="hover:text-orange transition">081 606 78317</a>
            </p>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 text-center text-text-muted text-sm">
          &copy; {new Date().getFullYear()} KJ Exchange. All rights reserved.
          <span className="mx-2">•</span>
          <span className="text-green-400">0% Fees</span>
          <span className="mx-2">•</span>
          <span className="text-text-muted">Trade Smart. Trade Secure.</span>
        </div>
      </div>
    </footer>
  );
}
