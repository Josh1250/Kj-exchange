import Layout from '../components/layout/Layout';
import Head from 'next/head';
import Link from 'next/link';

export default function Services() {
  const services = [
    {
      id: 'gift-cards',
      icon: 'fa-solid fa-gift',
      title: 'Gift Cards',
      description: 'Sell Apple, Amazon, Google Play, Steam, and more gift cards instantly.',
      features: ['Instant quotes', 'Secure verification', 'Fast payout'],
      link: '/dashboard/sell-gift-card',
      status: 'active',
      color: '#4E1F91',
    },
    {
      id: 'crypto',
      icon: 'fa-brands fa-bitcoin',
      title: 'Crypto Exchange',
      description: 'Sell Bitcoin, USDT, Ethereum, Solana and other cryptocurrencies.',
      features: ['Live rates', '0% hidden fees', '5-15 min payout'],
      link: '/dashboard/sell-crypto',
      status: 'active',
      color: '#f7931a',
    },
    {
      id: 'pay-bills',
      icon: 'fa-regular fa-lightbulb',
      title: 'Pay Bills',
      description: 'Pay electricity, TV subscriptions, internet, and other utilities.',
      features: ['20+ providers', 'Instant processing', 'Cashback rewards'],
      link: '#',
      status: 'soon',
      color: '#FF7300',
    },
    {
      id: 'buy-airtime',
      icon: 'fa-solid fa-mobile-screen',
      title: 'Buy Airtime',
      description: 'Top up MTN, Glo, Airtel, 9mobile and other networks instantly.',
      features: ['All networks', 'Instant delivery', 'Competitive rates'],
      link: '#',
      status: 'soon',
      color: '#26a17b',
    },
  ];

  return (
    <>
      <Head>
        <title>Services · KJ Exchange</title>
        <meta name="description" content="Explore KJ Exchange services — Gift Cards, Crypto, Pay Bills, Buy Airtime. Fast, secure, and transparent." />
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

          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
              Our{' '}
              <span className="bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent">
                Services
              </span>
            </h1>
            <p className="text-text-muted text-lg max-w-2xl mx-auto">
              Everything you need to manage your digital assets — all in one place.
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {services.map((service, idx) => (
              <div
                key={idx}
                className={`bg-bg-card/60 backdrop-blur-sm rounded-2xl p-8 border border-border hover:border-orange transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange/10 ${
                  service.status === 'soon' ? 'opacity-70' : ''
                }`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange/10 flex items-center justify-center text-2xl text-orange">
                    <i className={service.icon}></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{service.title}</h3>
                    {service.status === 'soon' && (
                      <span className="text-xs text-orange font-semibold bg-orange/10 px-2 py-0.5 rounded-full">Coming Soon</span>
                    )}
                  </div>
                </div>
                <p className="text-text-muted text-sm leading-relaxed">{service.description}</p>
                <ul className="mt-4 space-y-2">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-text-muted">
                      <i className="fa-solid fa-check text-green-400 text-xs"></i>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={service.link}
                  className={`inline-block mt-6 text-sm font-semibold transition group ${
                    service.status === 'active'
                      ? 'text-orange hover:underline hover:translate-x-1'
                      : 'text-text-muted cursor-not-allowed'
                  }`}
                >
                  {service.status === 'active' ? (
                    <>
                      Get Started <i className="fa-solid fa-arrow-right ml-1 group-hover:translate-x-1 transition-transform"></i>
                    </>
                  ) : (
                    'Coming Soon'
                  )}
                </Link>
              </div>
            ))}
          </div>

          {/* Why Choose Section */}
          <div className="mt-16 bg-bg-card/40 rounded-2xl p-8 border border-border">
            <h2 className="text-2xl font-bold text-center mb-8">Why Choose KJ Exchange</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: 'fa-solid fa-bolt', title: 'Lightning Fast', desc: 'Get paid in 5-15 minutes' },
                { icon: 'fa-solid fa-shield-halved', title: 'Bank-Grade Secure', desc: 'Encrypted transactions' },
                { icon: 'fa-solid fa-hand-holding-dollar', title: 'Transparent Pricing', desc: 'No hidden fees' },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <i className={`${item.icon} text-3xl text-orange mb-2`}></i>
                  <h4 className="font-semibold">{item.title}</h4>
                  <p className="text-text-muted text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* How It Works */}
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold mb-8">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { step: '01', title: 'Create Account', desc: 'Sign up and verify your identity' },
                { step: '02', title: 'Choose Service', desc: 'Select the service you need' },
                { step: '03', title: 'Get Paid', desc: 'Receive instant payout to your wallet' },
              ].map((item, i) => (
                <div key={i} className="bg-bg-card/30 rounded-xl p-6 border border-border">
                  <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg mb-3">
                    {item.step}
                  </div>
                  <h4 className="font-semibold">{item.title}</h4>
                  <p className="text-text-muted text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center bg-gradient-to-br from-purple-900/20 to-orange-900/20 rounded-2xl p-8 border border-border">
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
      </Layout>
    </>
  );
}
