import { useState, useEffect, useRef } from 'react';
import Layout from '../components/layout/Layout';
import Link from 'next/link';
import Image from 'next/image';
import Head from 'next/head';

export default function Home() {
  const [openFaq, setOpenFaq] = useState(null);

  // Intersection Observer for scroll animations
  const servicesRef = useRef(null);
  const howRef = useRef(null);
  const whyRef = useRef(null);
  const testimonialsRef = useRef(null);
  const faqRef = useRef(null);
  const ctaRef = useRef(null);

  const [servicesVisible, setServicesVisible] = useState(false);
  const [howVisible, setHowVisible] = useState(false);
  const [whyVisible, setWhyVisible] = useState(false);
  const [testimonialsVisible, setTestimonialsVisible] = useState(false);
  const [faqVisible, setFaqVisible] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          if (id === 'services') setServicesVisible(true);
          if (id === 'how') setHowVisible(true);
          if (id === 'why') setWhyVisible(true);
          if (id === 'testimonials') setTestimonialsVisible(true);
          if (id === 'faq') setFaqVisible(true);
          if (id === 'cta') setCtaVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const sections = [servicesRef, howRef, whyRef, testimonialsRef, faqRef, ctaRef];
    sections.forEach(ref => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, []);

  // FAQ data
  const faqs = [
    {
      q: 'What services does KJ Exchange offer?',
      a: 'KJ Exchange is an all-in-one digital finance platform where you can sell gift cards, sell crypto, pay bills, buy airtime & data, convert and save in USD, and access global eSIM services — all in one place.',
    },
    {
      q: 'How fast do I get paid?',
      a: 'Most transactions are completed within <strong>5 to 15 minutes</strong> after confirmation and verification.',
    },
    {
      q: 'What gift cards do you accept?',
      a: 'We accept <strong>Apple, Amazon, Google Play, Steam, Razer Gold, Sephora, Xbox, PlayStation, and many more</strong>. Contact us to confirm yours!',
    },
    {
      q: 'Is my transaction secure?',
      a: 'Absolutely. We use <strong>bank-grade encryption</strong> and a transparent verification process to protect every trade.',
    },
    {
      q: 'Do you charge hidden fees?',
      a: 'Never. We offer a <strong>transparent fee structure</strong>. What you see is exactly what you get — no hidden charges or surprises.',
    },
  ];

  return (
    <>
      <Head>
        <title>KJ Exchange · All-in-One Digital Finance Platform</title>
        <meta
          name="description"
          content="Sell crypto and gift cards, pay bills, buy airtime & data, convert and save in USD — fast, secure, and convenient."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Layout>
        {/* ========== HERO SECTION ========== */}
        <section className="relative overflow-hidden pt-8 pb-16 md:pt-16 md:pb-20 bg-gradient-to-br from-purple-900/10 to-orange-900/5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl animate-float-delayed"></div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
              {/* Left: Phone Mockup */}
              <div className="flex-1 flex justify-center md:justify-start relative">
                <div className="relative group">
                  <div className="absolute inset-0 bg-orange-500/20 rounded-[3rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <div className="relative w-72 md:w-80 lg:w-96 rounded-[3rem] border-2 border-border bg-black/10 p-3 shadow-2xl shadow-orange/5 animate-float-slow">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-b-xl z-20 flex items-center justify-center">
                      <div className="w-2 h-2 bg-black/20 rounded-full"></div>
                    </div>
                    <div className="rounded-[2rem] overflow-hidden border border-border/20">
                      <Image
                        src="/images/dashboard-mockup.png"
                        alt="KJ Exchange Dashboard"
                        width={600}
                        height={1200}
                        className="w-full h-auto"
                        priority
                      />
                    </div>
                    <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-medium border border-green-500/30 shadow-lg">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      Live
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Text & CTA */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight">
                  Your{' '}
                  <span className="bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent">
                    All-in-One
                  </span>{' '}
                  Digital Finance Platform
                </h1>

                <p className="text-text-muted text-lg md:text-xl mt-4 max-w-xl leading-relaxed mx-auto md:mx-0">
                  Sell crypto and gift cards, pay bills, buy airtime & data, convert and save in Naira or USD — all in one place. Fast, secure, and convenient.
                </p>

                <div className="mt-8 flex flex-wrap gap-4 justify-center md:justify-start">
                  <Link
                    href="/auth/register"
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3.5 rounded-full font-bold hover:shadow-lg hover:shadow-orange/30 transition-all duration-300 flex items-center gap-2 btn-pulse"
                  >
                    <i className="fa-solid fa-rocket"></i> Get Started
                  </Link>
                  <Link
                    href="/auth/login"
                    className="border border-border text-text-primary px-8 py-3.5 rounded-full font-semibold hover:border-orange hover:text-orange transition-all duration-300 bg-white/5 backdrop-blur-sm flex items-center gap-2"
                  >
                    <i className="fa-regular fa-circle-user"></i> Log In
                  </Link>
                </div>

                {/* Trust Badges */}
                <div className="mt-8 flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm text-text-muted">
                  <span className="flex items-center gap-1.5">
                    <i className="fa-solid fa-star text-yellow-400"></i>
                    <span>500+ Users</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <i className="fa-solid fa-bolt text-orange"></i>
                    <span>Instant Payouts</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <i className="fa-solid fa-shield text-green-400"></i>
                    <span>Secure</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <i className="fa-solid fa-headset text-blue-400"></i>
                    <span>24/7 Support</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========== PRODUCTS SECTION (7 Cards) ========== */}
        <section
          ref={servicesRef}
          id="services"
          className={`container mx-auto px-4 py-20 border-t border-border transition-all duration-700 ${
            servicesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="text-center mb-14">
            <span className="text-orange text-sm font-semibold uppercase tracking-widest">Services</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">Everything You Need</h2>
            <p className="text-text-muted mt-2 max-w-2xl mx-auto">
              Sell, pay, save, and manage your digital finances all in one place.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Gift Cards */}
            <Link href="/dashboard/sell-gift-card" className="glass rounded-xl p-4 text-center hover:border-orange transition border border-border group">
              <div className="w-10 h-10 mx-auto rounded-full bg-orange/10 flex items-center justify-center text-orange text-xl group-hover:scale-110 transition">
                <i className="fa-solid fa-gift"></i>
              </div>
              <p className="text-sm font-semibold mt-2">Gift Cards</p>
            </Link>

            {/* Crypto */}
            <Link href="/dashboard/sell" className="glass rounded-xl p-4 text-center hover:border-orange transition border border-border group">
              <div className="w-10 h-10 mx-auto rounded-full bg-orange/10 flex items-center justify-center text-orange text-xl group-hover:scale-110 transition">
                <i className="fa-brands fa-bitcoin"></i>
              </div>
              <p className="text-sm font-semibold mt-2">Crypto</p>
            </Link>

            {/* Pay Bills */}
            <Link href="#" className="glass rounded-xl p-4 text-center hover:border-orange transition border border-border group">
              <div className="w-10 h-10 mx-auto rounded-full bg-orange/10 flex items-center justify-center text-orange text-xl group-hover:scale-110 transition">
                <i className="fa-credit-card"></i>
              </div>
              <p className="text-sm font-semibold mt-2">Pay Bills</p>
            </Link>

            {/* Airtime & Data */}
            <Link href="#" className="glass rounded-xl p-4 text-center hover:border-orange transition border border-border group">
              <div className="w-10 h-10 mx-auto rounded-full bg-orange/10 flex items-center justify-center text-orange text-xl group-hover:scale-110 transition">
                <i className="fa-solid fa-wifi"></i>
              </div>
              <p className="text-sm font-semibold mt-2">Airtime & Data</p>
            </Link>

            {/* Rate Calculator */}
            <Link href="/rates" className="glass rounded-xl p-4 text-center hover:border-orange transition border border-border group">
              <div className="w-10 h-10 mx-auto rounded-full bg-orange/10 flex items-center justify-center text-orange text-xl group-hover:scale-110 transition">
                <i className="fa-solid fa-calculator"></i>
              </div>
              <p className="text-sm font-semibold mt-2">Rate Calculator</p>
            </Link>

            {/* USD Wallet — NEW */}
            <Link href="/dashboard/convert" className="glass rounded-xl p-4 text-center hover:border-orange transition border border-border group">
              <div className="w-10 h-10 mx-auto rounded-full bg-green-400/10 flex items-center justify-center text-green-400 text-xl group-hover:scale-110 transition">
                <i className="fa-solid fa-dollar-sign"></i>
              </div>
              <p className="text-sm font-semibold mt-2">USD Wallet</p>
              <p className="text-[10px] text-text-muted mt-0.5">Convert & Save</p>
            </Link>

            {/* eSIM — Coming Soon */}
            <div className="glass rounded-xl p-4 text-center border border-border opacity-60 relative">
              <div className="w-10 h-10 mx-auto rounded-full bg-orange/10 flex items-center justify-center text-text-muted text-xl">
                <i className="fa-solid fa-sim-card"></i>
              </div>
              <p className="text-sm font-semibold mt-2">eSIM</p>
              <span className="text-[10px] text-orange">Soon</span>
              <div className="absolute top-2 right-2 text-text-muted text-xs">
                <i className="fa-solid fa-lock"></i>
              </div>
            </div>
          </div>
        </section>

        {/* ========== HOW IT WORKS ========== */}
        <section
          ref={howRef}
          id="how"
          className={`container mx-auto px-4 py-20 border-t border-border transition-all duration-700 ${
            howVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="text-center mb-14">
            <span className="text-orange text-sm font-semibold uppercase tracking-widest">How It Works</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">Simple Steps to Start</h2>
            <p className="text-text-muted mt-2 max-w-2xl mx-auto">Get started in minutes with our streamlined process</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '01', title: 'Create Account', desc: 'Sign up for free and verify your identity quickly.' },
              { step: '02', title: 'Choose Service', desc: 'Select from gift cards, crypto, bills, airtime & data, or USD wallet.' },
              { step: '03', title: 'Get Paid Instantly', desc: 'Complete your transaction and receive your funds instantly.' },
            ].map((item, idx) => (
              <div key={idx} className="text-center group" style={{ transitionDelay: `${idx * 150}ms` }}>
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-orange-500 flex items-center justify-center text-white font-bold text-xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple/20">
                  {item.step}
                </div>
                <h3 className="font-bold text-xl">{item.title}</h3>
                <p className="text-text-muted text-sm mt-2 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ========== WHY CHOOSE US (Updated with USD Savings) ========== */}
        <section
          ref={whyRef}
          id="why"
          className={`container mx-auto px-4 py-20 border-t border-border transition-all duration-700 ${
            whyVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-orange text-sm font-semibold uppercase tracking-widest">Why Choose Us</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-2">
                Built for <span className="bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent">Trust &amp; Speed</span>
              </h2>
              <ul className="mt-8 space-y-6">
                {[
                  { icon: 'fa-solid fa-bolt', title: 'Lightning Fast', desc: 'Get paid in 5-15 minutes after verification' },
                  { icon: 'fa-solid fa-shield-halved', title: 'Bank-Grade Security', desc: 'All transactions are encrypted and protected' },
                  { icon: 'fa-solid fa-puzzle-piece', title: 'Easy to Use', desc: 'Simple steps from signup to payout' },
                  { icon: 'fa-solid fa-arrows-rotate', title: 'Flexible Options', desc: 'Sell gift cards, crypto, pay bills & buy airtime' },
                  { icon: 'fa-solid fa-dollar-sign', title: 'Save in USD', desc: 'Protect your money from Naira devaluation with our USD wallet.' },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4 group" style={{ transitionDelay: `${i * 100}ms` }}>
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

            <div className="glass rounded-3xl p-8 border border-border text-center shadow-2xl shadow-orange/5">
              <div className="text-6xl font-bold text-orange mb-2">🔒</div>
              <p className="text-text-muted text-sm">Transparent Pricing</p>
              <div className="w-16 h-1 bg-orange mx-auto my-4 rounded-full"></div>
              <p className="text-text-muted text-sm">Join 500+ satisfied customers</p>
              <Link
                href="/auth/register"
                className="inline-block bg-orange text-white px-8 py-3 rounded-full font-bold hover:bg-orange-600 transition-all duration-300 shadow-lg shadow-orange/30 mt-6"
              >
                Get Started Now →
              </Link>
            </div>
          </div>
        </section>

        {/* ========== TESTIMONIALS ========== */}
        <section
          ref={testimonialsRef}
          id="testimonials"
          className={`container mx-auto px-4 py-20 border-t border-border transition-all duration-700 ${
            testimonialsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="text-center mb-14">
            <span className="text-orange text-sm font-semibold uppercase tracking-widest">Testimonials</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">What Our Customers Say</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Chidi O.',
                location: 'Lagos, Nigeria',
                text: '"I sold my BTC and got paid in less than 10 minutes! Best rates in Nigeria. Highly recommend KJ Exchange."',
                avatar: 'CO',
              },
              {
                name: 'Amina K.',
                location: 'Abuja, Nigeria',
                text: '"Trustworthy and super fast. I\'ve exchanged over ₦5M in gift cards here. The support team is amazing!"',
                avatar: 'AK',
              },
              {
                name: 'Emeka J.',
                location: 'Port Harcourt, Nigeria',
                text: '"Reliable service, transparent rates, and instant payment. My go-to platform for crypto and gift cards."',
                avatar: 'EJ',
              },
            ].map((t, i) => (
              <div
                key={i}
                className="glass rounded-2xl p-6 border border-border hover:border-orange transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange/5"
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <div className="text-orange text-lg mb-3">
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                  <i className="fa-solid fa-star"></i>
                </div>
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

        {/* ========== FAQ ========== */}
        <section
          ref={faqRef}
          id="faq"
          className={`container mx-auto px-4 py-20 border-t border-border transition-all duration-700 ${
            faqVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="text-center mb-14">
            <span className="text-orange text-sm font-semibold uppercase tracking-widest">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2">Frequently Asked Questions</h2>
            <p className="text-text-muted mt-2">Click a question to reveal the answer</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className="glass rounded-xl border border-border overflow-hidden transition-all duration-300 hover:border-orange/40"
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left font-semibold hover:bg-white/5 transition-colors duration-200"
                  >
                    <span className="text-text-primary">{faq.q}</span>
                    <span className="text-orange ml-4 flex-shrink-0">
                      <i className={`fa-solid ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'} transition-transform duration-300`}></i>
                    </span>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-6 pb-4 text-text-muted text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: faq.a }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========== FINAL CTA ========== */}
        <section
          ref={ctaRef}
          id="cta"
          className={`container mx-auto px-4 py-20 border-t border-border transition-all duration-700 ${
            ctaVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="glass rounded-3xl p-12 text-center border border-border max-w-4xl mx-auto shadow-2xl shadow-orange/5">
            <h2 className="text-3xl md:text-4xl font-bold">Ready to Get Started?</h2>
            <p className="text-text-muted mt-3 max-w-xl mx-auto leading-relaxed">
              Join 500+ satisfied customers using KJ Exchange to manage their digital finances with ease.
              <br />
              <span className="text-green-400 font-bold">Transparent pricing</span> — No hidden charges.
            </p>
            <Link
              href="/auth/register"
              className="inline-block bg-gradient-to-r from-orange-500 to-orange-600 text-white px-10 py-3.5 rounded-full font-bold hover:shadow-lg hover:shadow-orange/30 transition-all duration-300 mt-6 btn-pulse"
            >
              Get Started Now →
            </Link>
            <p className="text-text-muted text-xs mt-4">Trusted and verified</p>
          </div>
        </section>

        {/* ====== GLOBAL STYLES ====== */}
        <style jsx global>{`
          @keyframes float {
            0%,
            100% {
              transform: translateY(0) scale(1);
            }
            50% {
              transform: translateY(-16px) scale(1.02);
            }
          }
          .animate-float {
            animation: float 8s ease-in-out infinite;
          }
          .animate-float-delayed {
            animation: float 10s ease-in-out infinite 2s;
          }
          .animate-float-slow {
            animation: float 6s ease-in-out infinite;
          }

          @keyframes pulse-cta {
            0% {
              box-shadow: 0 0 0 0 rgba(255, 115, 0, 0.4);
            }
            70% {
              box-shadow: 0 0 0 20px rgba(255, 115, 0, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(255, 115, 0, 0);
            }
          }
          .btn-pulse {
            animation: pulse-cta 2.4s infinite;
          }

          .opacity-0 {
            opacity: 0;
          }
          .translate-y-10 {
            transform: translateY(10px);
          }
          .opacity-100 {
            opacity: 1;
          }
          .translate-y-0 {
            transform: translateY(0);
          }
          .transition-all {
            transition-property: all;
          }
          .duration-700 {
            transition-duration: 700ms;
          }
        `}</style>
      </Layout>
    </>
  );
}
