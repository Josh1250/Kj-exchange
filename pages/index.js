import Link from 'next/link';
import Layout from '../components/layout/Layout';
import RateCalculator from '../components/calculator/RateCalculator';
import { useState, useEffect } from 'react';

export default function Home() {
  const [isDark, setIsDark] = useState(true);
  const [tradeType, setTradeType] = useState('sell');

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

  return (
    <Layout>
      {/* Theme Toggle */}
      <div className="container mx-auto px-4 pt-4 flex justify-end">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 bg-bg-card/60 backdrop-blur-sm border border-border rounded-full px-4 py-2 text-sm hover:border-orange transition-all duration-300 shadow-lg"
        >
          {isDark ? (
            <>
              <span className="text-yellow-400">☀️</span>
              <span className="text-text-muted">Light</span>
            </>
          ) : (
            <>
              <span className="text-indigo-400">🌙</span>
              <span className="text-text-muted">Dark</span>
            </>
          )}
        </button>
      </div>

      <section className="container mx-auto px-4 pt-8 pb-16">
        <div className="text-center max-w-5xl mx-auto">
          <span className="inline-block bg-orange/10 text-orange border border-orange/20 px-5 py-1.5 rounded-full text-sm font-semibold mb-6 backdrop-blur-sm">
            ⚡ 0% Fees — No Hidden Charges
          </span>

          <div className="flex bg-black/20 dark:bg-white/5 rounded-xl p-1 max-w-xs mx-auto mb-8 backdrop-blur-sm border border-border">
            <button
              className={`flex-1 py-2.5 px-6 rounded-lg text-center font-semibold transition-all duration-300 ${
                tradeType === 'sell'
                  ? 'bg-orange text-white shadow-lg shadow-orange/30'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              onClick={() => setTradeType('sell')}
            >
              <i className="fa-solid fa-coins mr-2"></i>Sell
            </button>
            <button
              className={`flex-1 py-2.5 px-6 rounded-lg text-center font-semibold transition-all duration-300 ${
                tradeType === 'buy'
                  ? 'bg-orange text-white shadow-lg shadow-orange/30'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              onClick={() => setTradeType('buy')}
            >
              <i className="fa-solid fa-cart-shopping mr-2"></i>Buy
            </button>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight">
            {tradeType === 'sell' ? 'Sell' : 'Buy'} Crypto &amp;{' '}
            <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              Gift Cards
            </span>
            <br />
            With{' '}
            <span className="bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
              Confidence
            </span>
          </h1>

          <p className="text-text-muted text-lg md:text-xl mt-6 max-w-2xl mx-auto leading-relaxed">
            {tradeType === 'sell'
              ? 'Sell your crypto & gift cards instantly. 0% fees. No delays. Just the best rate.'
              : 'Buy gift cards at the best rates. 0% fees. Instant delivery.'}
          </p>

          <div className="flex flex-wrap gap-4 justify-center mt-8">
            <Link
              href="/auth/signup"
              className="group relative bg-orange text-white px-10 py-3.5 rounded-full font-bold hover:bg-orange-600 transition-all duration-300 shadow-xl shadow-orange/30 hover:shadow-orange/50 flex items-center gap-2 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                <i className="fas fa-rocket"></i> Get Started
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </Link>
            <Link
              href="/rates"
              className="border border-border text-text-primary px-10 py-3.5 rounded-full font-semibold hover:border-orange hover:text-orange transition-all duration-300 backdrop-blur-sm bg-white/5"
            >
              <i className="fa-solid fa-chart-simple mr-2"></i>View Rates →
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-8 md:gap-16 border-t border-border mt-10 pt-10 max-w-2xl mx-auto">
            <div className="text-center">
              <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent">500+</p>
              <p className="text-text-muted text-sm mt-1">Satisfied Customers</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-400">0%</p>
              <p className="text-text-muted text-sm mt-1">Fees</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white dark:text-black">⭐ 4.9</p>
              <p className="text-text-muted text-sm mt-1">Average Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Rest of the page (services, why choose, etc.) - keep unchanged */}
      {/* ... existing sections ... */}
    </Layout>
  );
}
