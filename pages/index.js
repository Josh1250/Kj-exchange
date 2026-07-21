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

      {/* Hero */}
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

      {/* Services */}
      <section id="services" className="container mx-auto px-4 py-20 border-t border-border">
        <div className="text-center mb-14">
          <span className="text-orange text-sm font-semibold uppercase tracking-widest">Services</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2">Everything You Need</h2>
          <p className="text-text-muted mt-2 max-w-2xl mx-auto">Buy, sell, and pay all in one place</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: 'fa-solid fa-gift',
              title: 'Gift Cards',
              desc: 'Apple, Amazon, Google Play, Steam & more',
              link: '/dashboard/sell-gift-card',
              cta: 'Sell Gift Card →'
            },
            {
              icon: 'fa-brands fa-bitcoin',
              title: 'Crypto',
              desc: 'BTC, USDT, ETH, SOL & more',
              link: '/dashboard/sell-crypto',
              cta: 'Sell Crypto →'
            },
            {
              icon: 'fa-regular fa-lightbulb',
              title: 'Pay Bills',
              desc: 'Electricity, TV, Internet & more',
              link: '#',
              cta: 'Coming Soon →'
            },
            {
              icon: 'fa-solid fa-mobile-screen',
              title: 'Buy Airtime',
              desc: 'MTN, Glo, Airtel, 9mobile & more',
              link: '#',
              cta: 'Coming Soon →'
            }
          ].map((service, idx) => (
            <div
              key={idx}
              className="group bg-bg-card/60 backdrop-blur-md rounded-2xl p-7 border border-border hover:border-orange transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-orange/10"
            >
              <div className="w-14 h-14 bg-orange/10 rounded-2xl flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform duration-300">
                <i className={service.icon}></i>
              </div>
              <h3 className="font-bold text-xl">{service.title}</h3>
              <p className="text-text-muted text-sm mt-2 leading-relaxed">{service.desc}</p>
              <Link
                href={service.link}
                className="inline-block text-orange text-sm font-semibold mt-4 hover:underline transition-all duration-300 group-hover:translate-x-1"
              >
                {service.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose */}
      <section className="container mx-auto px-4 py-20 border-t border-border">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-orange text-sm font-semibold uppercase tracking-widest">Why Choose Us</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">
              Why People Choose{' '}
              <span className="bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent">
                KJ Exchange
              </span>
            </h2>
            <ul className="mt-8 space-y-6">
              {[
                { icon: 'fa-solid fa-bolt', title: 'Lightning Fast', desc: 'Get paid in 5-15 minutes after verification' },
                { icon: 'fa-solid fa-shield-halved', title: 'Bank-Grade Security', desc: 'All transactions are encrypted and protected' },
                { icon: 'fa-solid fa-puzzle-piece', title: 'Easy to Use', desc: 'Simple steps from signup to payout' },
                { icon: 'fa-solid fa-arrows-rotate', title: 'Flexible Options', desc: 'Sell gift cards, crypto, pay bills & buy airtime' }
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4 group">
                  <span className="text-2xl text-orange group-hover:scale-110 transition-transform duration-300">
                    <i className={item.icon}></i>
                  </span>
                  <div>
                    <h4 className="font-semibold text-lg">{item.title}</h4>
                    <p className="text-text-muted text-sm">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-br from-purple-900/30 to-orange-900/20 rounded-3xl p-8 border border-border backdrop-blur-sm text-center shadow-2xl">
            <div className="text-6xl font-bold text-orange mb-2">0%</div>
            <p className="text-text-muted text-sm">Fees on all trades</p>
            <div className="w-16 h-1 bg-orange mx-auto my-4 rounded-full"></div>
            <p className="text-text-muted text-sm">Join 500+ satisfied customers</p>
            <Link
              href="/auth/signup"
              className="inline-block bg-orange text-white px-8 py-3 rounded-full font-bold hover:bg-orange-600 transition-all duration-300 shadow-lg shadow-orange/30 mt-6"
            >
              Get Started Now →
            </Link>
          </div>
        </div>
      </section>

      {/* Rate Calculator */}
      <section id="calculator" className="container mx-auto px-4 py-20 border-t border-border">
        <div className="text-center mb-14">
          <span className="text-orange text-sm font-semibold uppercase tracking-widest">Calculator</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2">Live Rate Calculator</h2>
          <p className="text-text-muted mt-2">See exactly how much you'll get in Naira</p>
        </div>
        <RateCalculator />
      </section>

      {/* Supported Assets (with real icons) */}
      <section id="assets" className="container mx-auto px-4 py-20 border-t border-border">
        <div className="text-center mb-14">
          <span className="text-orange text-sm font-semibold uppercase tracking-widest">Assets</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2">What We Accept</h2>
          <p className="text-text-muted mt-2">Over 50+ gift cards and crypto assets supported</p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {[
            { icon: 'fa-brands fa-bitcoin', label: 'Bitcoin', sub: 'BTC', color: '#f7931a' },
            { icon: 'fa-solid fa-coins', label: 'Tether', sub: 'USDT', color: '#26a17b' },
            { icon: 'fa-brands fa-ethereum', label: 'Ethereum', sub: 'ETH', color: '#627eea' },
            { icon: 'fa-solid fa-bolt', label: 'Solana', sub: 'SOL', color: '#9945FF' },
            { icon: 'fa-brands fa-apple', label: 'Apple', sub: 'Gift Card', color: '#a2aaad' },
            { icon: 'fa-brands fa-amazon', label: 'Amazon', sub: 'Gift Card', color: '#ff9900' },
            { icon: 'fa-brands fa-google-play', label: 'Google Play', sub: 'Gift Card', color: '#34a853' },
            { icon: 'fa-solid fa-gamepad', label: 'Steam', sub: 'Gift Card', color: '#1b2838' },
            { icon: 'fa-solid fa-spa', label: 'Sephora', sub: 'Gift Card', color: '#e74c3c' },
            { icon: 'fa-solid fa-film', label: 'Netflix', sub: 'Gift Card', color: '#e50914' },
            { icon: 'fa-solid fa-dragon', label: 'Razer Gold', sub: 'Gift Card', color: '#00ff00' },
            { icon: 'fa-solid fa-plus-circle', label: '50+ More', sub: 'Contact us', color: 'text-orange' },
          ].map((asset, i) => (
            <div
              key={i}
              className="bg-bg-card/60 backdrop-blur-sm rounded-xl p-4 text-center border border-border hover:border-orange transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange/10"
            >
              <i className={`${asset.icon} text-3xl block mb-1`} style={{ color: asset.color }}></i>
              <p className="font-semibold text-sm">{asset.label}</p>
              <p className="text-text-muted text-xs">{asset.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-20 border-t border-border">
        <div className="text-center mb-14">
          <span className="text-orange text-sm font-semibold uppercase tracking-widest">Testimonials</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2">Hear From Our Happy Customers</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: 'Chidi O.',
              location: 'Lagos, Nigeria',
              text: '"I sold my BTC and got paid in less than 10 minutes! Best rates in Nigeria. Highly recommend KJ Exchange."',
              avatar: 'CO'
            },
            {
              name: 'Amina K.',
              location: 'Abuja, Nigeria',
              text: '"Trustworthy and super fast. I\'ve exchanged over ₦5M in gift cards here. The support team is amazing!"',
              avatar: 'AK'
            },
            {
              name: 'Emeka J.',
              location: 'Port Harcourt, Nigeria',
              text: '"Reliable service, transparent rates, and instant payment. My go-to platform for crypto and gift cards."',
              avatar: 'EJ'
            }
          ].map((t, i) => (
            <div
              key={i}
              className="bg-bg-card/60 backdrop-blur-sm rounded-2xl p-6 border border-border hover:border-orange transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange/5"
            >
              <div className="text-orange text-lg mb-3"><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i></div>
              <blockquote className="text-text-secondary text-sm italic leading-relaxed">{t.text}</blockquote>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-text-muted text-xs">{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container mx-auto px-4 py-20 border-t border-border">
        <div className="text-center mb-14">
          <span className="text-orange text-sm font-semibold uppercase tracking-widest">FAQ</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2">Frequently Asked Questions</h2>
          <p className="text-text-muted mt-2">Quick answers to common questions</p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {[
            {
              q: 'How fast do I get paid?',
              a: 'Most transactions are completed within <strong>5 to 15 minutes</strong> after confirmation and verification.'
            },
            {
              q: 'What gift cards do you accept?',
              a: 'We accept <strong>Apple, Amazon, Google Play, Steam, Razer Gold, Sephora</strong>, and many more. Contact us on WhatsApp to confirm yours!'
            },
            {
              q: 'Is my transaction secure?',
              a: 'Absolutely. We use <strong>bank-grade encryption</strong> and a transparent verification process to protect every trade.'
            },
            {
              q: 'Do you charge hidden fees?',
              a: 'Never. We offer a <strong>0% fee structure</strong>. What you see is exactly what you get — no hidden charges or surprises.'
            }
          ].map((faq, i) => (
            <div
              key={i}
              className="group bg-bg-card/60 backdrop-blur-sm rounded-xl p-5 border border-border hover:border-orange transition-all duration-300 hover:shadow-lg hover:shadow-orange/5"
            >
              <h4 className="font-semibold group-hover:text-orange transition-colors duration-300">{faq.q}</h4>
              <p className="text-text-muted text-sm mt-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: faq.a }} />
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-20 border-t border-border">
        <div className="bg-gradient-to-br from-purple-900/30 to-orange-900/20 rounded-3xl p-12 text-center border border-border max-w-4xl mx-auto backdrop-blur-sm shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold">Join 500+ Customers</h2>
          <p className="text-text-muted mt-3 max-w-xl mx-auto leading-relaxed">
            You're in good company. Hundreds already use KJ Exchange to trade safely and get paid fast.
            <br />
            <span className="text-green-400 font-bold">0% fees</span> — No hidden charges.
          </p>
          <Link
            href="/auth/signup"
            className="inline-block bg-orange text-white px-10 py-3.5 rounded-full font-bold hover:bg-orange-600 transition-all duration-300 shadow-xl shadow-orange/30 hover:shadow-orange/50 mt-6"
          >
            Sign Up for Free →
          </Link>
          <p className="text-text-muted text-xs mt-4">Trusted and verified</p>
        </div>
      </section>

      {/* Light Mode Styles */}
      <style jsx global>{`
        .light-mode {
          --bg-primary: #FAF8FC;
          --bg-secondary: #F0ECF5;
          --bg-card: rgba(255, 255, 255, 0.85);
          --text-primary: #1A1426;
          --text-secondary: #2D2444;
          --text-muted: #6B5F7A;
          --border-subtle: rgba(78, 31, 145, 0.08);
        }
        .light-mode .bg-bg-primary { background: #FAF8FC; }
        .light-mode .bg-bg-secondary { background: #F0ECF5; }
        .light-mode .bg-bg-card { background: rgba(255,255,255,0.85); backdrop-filter: blur(8px); box-shadow: 0 4px 24px rgba(78,31,145,0.06); }
        .light-mode .border-border { border-color: rgba(78,31,145,0.08); }
        .light-mode .text-text-primary { color: #1A1426; }
        .light-mode .text-text-secondary { color: #2D2444; }
        .light-mode .text-text-muted { color: #6B5F7A; }
        .light-mode .bg-black\\/20 { background: rgba(78,31,145,0.04); }
        .light-mode .bg-black\\/40 { background: rgba(78,31,145,0.03); }
        .light-mode .bg-white\\/5 { background: rgba(78,31,145,0.04); }
        .light-mode .bg-bg-card\\/60 { background: rgba(255,255,255,0.7); }
      `}</style>
    </Layout>
  );
}
