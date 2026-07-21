import Layout from '../components/layout/Layout';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';

export default function About() {
  return (
    <>
      <Head>
        <title>About Us · KJ Exchange</title>
        <meta name="description" content="Learn about KJ Exchange — your trusted platform for buying and selling crypto and gift cards in Nigeria." />
      </Head>
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary transition mb-6 group"
          >
            <i className="fa-solid fa-arrow-left text-sm group-hover:-translate-x-1 transition-transform"></i>
            <span className="text-sm font-medium">Back to Home</span>
          </Link>

          <div className="space-y-12">
            {/* Hero */}
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
                About{' '}
                <span className="bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent">
                  KJ Exchange
                </span>
              </h1>
              <p className="text-text-muted text-lg max-w-2xl mx-auto">
                Your Ultimate Exchange Hub for crypto and gift cards in Nigeria.
              </p>
            </div>

            {/* Mission */}
            <div className="bg-bg-card/60 backdrop-blur-sm rounded-2xl p-8 border border-border">
              <div className="flex items-center gap-3 mb-4">
                <i className="fa-solid fa-bullseye text-3xl text-orange"></i>
                <h2 className="text-2xl font-bold">Our Mission</h2>
              </div>
              <p className="text-text-muted leading-relaxed">
                To provide a secure, fast, and transparent platform where individuals can easily buy and sell digital assets
                — including cryptocurrencies and gift cards — with confidence. We're building the most trusted exchange hub
                in Nigeria, powered by live rates, instant payouts, and zero hidden fees.
              </p>
            </div>

            {/* Why Choose */}
            <div>
              <h2 className="text-2xl font-bold text-center mb-8">Why Choose KJ Exchange</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { icon: 'fa-solid fa-bolt', title: 'Lightning Fast', desc: 'Get paid in 5-15 minutes after verification' },
                  { icon: 'fa-solid fa-shield-halved', title: 'Bank-Grade Security', desc: 'All transactions are encrypted and protected' },
                  { icon: 'fa-solid fa-hand-holding-dollar', title: 'Transparent Pricing', desc: 'No hidden fees. What you see is what you get' },
                ].map((item, i) => (
                  <div key={i} className="bg-bg-card/40 rounded-xl p-6 text-center border border-border hover:border-orange transition">
                    <i className={`${item.icon} text-4xl text-orange mb-3`}></i>
                    <h3 className="font-bold text-lg">{item.title}</h3>
                    <p className="text-text-muted text-sm mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { number: '500+', label: 'Satisfied Customers', icon: 'fa-regular fa-user' },
                { number: '2022', label: 'Year Established', icon: 'fa-regular fa-calendar' },
                { number: '⭐ 4.9', label: 'Average Rating', icon: 'fa-regular fa-star' },
                { number: '🔒', label: 'No Hidden Fees', icon: '' },
              ].map((item, i) => (
                <div key={i} className="bg-bg-card/40 rounded-xl p-4 border border-border">
                  {item.icon && <i className={`${item.icon} text-2xl text-orange block mb-2`}></i>}
                  <p className="text-2xl font-bold">{item.number}</p>
                  <p className="text-text-muted text-sm">{item.label}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center bg-gradient-to-br from-purple-900/20 to-orange-900/20 rounded-2xl p-8 border border-border">
              <h2 className="text-2xl font-bold mb-2">Ready to Get Started?</h2>
              <p className="text-text-muted mb-4">Join 500+ satisfied customers today.</p>
              <Link
                href="/auth/signup"
                className="inline-block bg-orange text-white px-8 py-3 rounded-full font-bold hover:bg-orange-600 transition shadow-lg shadow-orange/30"
              >
                Create Free Account →
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
