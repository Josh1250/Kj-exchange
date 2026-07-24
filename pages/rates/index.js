import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Head from 'next/head';
import Link from 'next/link';
import { GIFT_CARD_RATES } from '../../config/giftCardRates';

const formatRate = (rate) => {
  if (!rate || rate === 0) return '₦0.00';
  return `₦${rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Spreads from your sell-crypto config
const SPREADS = {
  BTC: { low: 0.0286, high: 0.0142, fee: 0.01 },
  ETH: { low: 0.0287, high: 0.0143, fee: 0.01 },
  USDT: { low: 0.0106, high: 0.0034, fee: 0 },
  SOL: { low: 0.0286, high: 0.0142, fee: 0.01 },
  BNB: { low: 0.0286, high: 0.0142, fee: 0.01 },
  TRX: { low: 0.0358, high: 0.0142, fee: 0.01 },
  LTC: { low: 0.0286, high: 0.0142, fee: 0.01 },
  BCH: { low: 0.1079, high: 0.0143, fee: 0.01 },
};

// FAQ data
const faqs = [
  {
    q: 'What cryptocurrencies can I convert to Naira?',
    a: 'You can convert Bitcoin (BTC), Tether (USDT), Ethereum (ETH), Solana (SOL), BNB, Tron (TRX), Litecoin (LTC), and Bitcoin Cash (BCH) to Naira on KJ Exchange.',
  },
  {
    q: 'How do I convert BTC to Naira?',
    a: 'Simply select Bitcoin, enter the USD amount you want to convert, and our calculator will show you the Naira equivalent. You can then proceed to trade.',
  },
  {
    q: 'How fast is the crypto to Naira conversion?',
    a: 'Orders are typically processed and funds credited to your wallet within 5-15 minutes after verification.',
  },
  {
    q: 'What is the current USDT to Naira rate?',
    a: 'Our live rate calculator shows the current USDT/NGN rate. It updates every 60 seconds to reflect market conditions.',
  },
  {
    q: 'Are there any fees for crypto conversion?',
    a: 'We charge a transparent 1% transaction fee on crypto trades. Gift card trades have 0% fees. No hidden charges.',
  },
];

export default function Rates() {
  const [rates, setRates] = useState({});
  const [ngnRate, setNgnRate] = useState(1550);
  const [giftCardRates, setGiftCardRates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [selectedGiftCard, setSelectedGiftCard] = useState('apple');
  const [amount, setAmount] = useState(100);
  const [payout, setPayout] = useState(0);
  const [activeTab, setActiveTab] = useState('crypto');
  const [openFaq, setOpenFaq] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayRate, setDisplayRate] = useState(0);
  const [cryptoUsdPrices, setCryptoUsdPrices] = useState({});

  // Build top 8 gift cards with highest rate
  useEffect(() => {
    const cards = [];
    Object.keys(GIFT_CARD_RATES).forEach((brandId) => {
      const brand = GIFT_CARD_RATES[brandId];
      const countryData = brand.countries?.USA || {};
      const physicalRates = countryData.physical || {};
      let rate = 0;
      const keys = Object.keys(physicalRates);
      const exact100 = keys.find(k => k.includes('100') || k.includes('$100'));
      if (exact100) {
        rate = physicalRates[exact100];
      } else if (keys.length > 0) {
        rate = Math.max(...Object.values(physicalRates));
      }
      if (rate > 0) {
        cards.push({ id: brandId, name: brand.name, icon: brand.icon, rate });
      }
    });
    cards.sort((a, b) => b.rate - a.rate);
    setGiftCardRates(cards.slice(0, 8));
  }, []);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setIsLoading(true);
        const fxRes = await fetch('https://api.exchangerate.fun/latest?base=USD');
        const fxData = await fxRes.json();
        const ngn = fxData.rates?.NGN || 1550;
        setNgnRate(ngn);

        const cryptoRes = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,solana,binancecoin,tron,litecoin,bitcoin-cash&vs_currencies=usd'
        );
        const cryptoData = await cryptoRes.json();

        const calculateUserRate = (usdPrice, spread, ngn) => {
          const marketNgn = usdPrice * ngn;
          return marketNgn * (1 - spread);
        };

        setRates({
          BTC: calculateUserRate(cryptoData.bitcoin?.usd || 0, SPREADS.BTC.low, ngn),
          ETH: calculateUserRate(cryptoData.ethereum?.usd || 0, SPREADS.ETH.low, ngn),
          USDT: calculateUserRate(cryptoData.tether?.usd || 1, SPREADS.USDT.low, ngn),
          SOL: calculateUserRate(cryptoData.solana?.usd || 0, SPREADS.SOL.low, ngn),
          BNB: calculateUserRate(cryptoData.binancecoin?.usd || 0, SPREADS.BNB.low, ngn),
          TRX: calculateUserRate(cryptoData.tron?.usd || 0, SPREADS.TRX.low, ngn),
          LTC: calculateUserRate(cryptoData.litecoin?.usd || 0, SPREADS.LTC.low, ngn),
          BCH: calculateUserRate(cryptoData['bitcoin-cash']?.usd || 0, SPREADS.BCH.low, ngn),
        });

        setCryptoUsdPrices({
          BTC: cryptoData.bitcoin?.usd || 0,
          ETH: cryptoData.ethereum?.usd || 0,
          USDT: cryptoData.tether?.usd || 1,
          SOL: cryptoData.solana?.usd || 0,
          BNB: cryptoData.binancecoin?.usd || 0,
          TRX: cryptoData.tron?.usd || 0,
          LTC: cryptoData.litecoin?.usd || 0,
          BCH: cryptoData['bitcoin-cash']?.usd || 0,
        });
      } catch (error) {
        console.warn('Rate fetch failed, using fallback', error);
        const ngn = 1550;
        setRates({
          BTC: 88649559 * (1 - SPREADS.BTC.low),
          ETH: 2602943 * (1 - SPREADS.ETH.low),
          USDT: 1379 * (1 - SPREADS.USDT.low),
          SOL: 105626 * (1 - SPREADS.SOL.low),
          BNB: 456789 * (1 - SPREADS.BNB.low),
          TRX: 12345 * (1 - SPREADS.TRX.low),
          LTC: 67890 * (1 - SPREADS.LTC.low),
          BCH: 23456 * (1 - SPREADS.BCH.low),
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchRates();
    const interval = setInterval(fetchRates, 60000);
    return () => clearInterval(interval);
  }, []);

  // Calculate payout and display rate
  useEffect(() => {
    let ratePerUsd = 0;
    if (activeTab === 'crypto') {
      const spread = SPREADS[selectedAsset]?.low || 0;
      ratePerUsd = ngnRate * (1 - spread);
    } else {
      const card = giftCardRates.find(c => c.id === selectedGiftCard);
      if (card) ratePerUsd = card.rate;
    }
    setDisplayRate(ratePerUsd);
    const usdValue = parseFloat(amount) || 0;
    setPayout(usdValue * ratePerUsd);
  }, [amount, selectedAsset, selectedGiftCard, rates, giftCardRates, ngnRate, activeTab]);

  const getCryptoRate = (id) => rates[id] || 0;
  const cryptoAssets = [
    { id: 'BTC', name: 'Bitcoin', icon: 'fa-brands fa-bitcoin', color: '#f7931a' },
    { id: 'ETH', name: 'Ethereum', icon: 'fa-brands fa-ethereum', color: '#627eea' },
    { id: 'USDT', name: 'Tether', icon: 'fa-solid fa-coins', color: '#26a17b' },
    { id: 'SOL', name: 'Solana', icon: 'fa-solid fa-bolt', color: '#9945FF' },
    { id: 'BNB', name: 'BNB', icon: 'fa-solid fa-cube', color: '#F3BA2F' },
    { id: 'TRX', name: 'Tron', icon: 'fa-solid fa-bolt', color: '#EF0027' },
    { id: 'LTC', name: 'Litecoin', icon: 'fa-brands fa-litecoin', color: '#345d9d' },
    { id: 'BCH', name: 'Bitcoin Cash', icon: 'fa-brands fa-bitcoin', color: '#8dc351' },
  ];

  return (
    <>
      <Head>
        <title>Live Rates · KJ Exchange</title>
        <meta name="description" content="Live crypto and gift card exchange rates in Naira. Updated every 60 seconds." />
      </Head>
      <Layout>
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary transition mb-6 group"
          >
            <i className="fa-solid fa-arrow-left text-sm group-hover:-translate-x-1 transition-transform"></i>
            <span className="text-sm font-medium">Back to Home</span>
          </Link>

          <h1 className="text-3xl font-bold mb-2">Live Rate Calculator</h1>
          <p className="text-text-muted mb-8">Get live crypto and gift card rates in Naira. Updated every 60 seconds.</p>

          {/* Calculator */}
          <div className="glass rounded-3xl p-6 md:p-8 border border-border shadow-2xl shadow-purple/5 mb-10">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => { setActiveTab('crypto'); setSelectedAsset('BTC'); }}
                    className={`flex-1 py-2.5 rounded-xl font-semibold transition ${
                      activeTab === 'crypto' 
                        ? 'bg-gradient-to-r from-orange to-orange-light text-white shadow-lg shadow-orange/20' 
                        : 'bg-black/20 text-text-muted hover:text-text-primary border border-border'
                    }`}
                  >
                    <i className="fa-brands fa-bitcoin mr-2"></i>Crypto
                  </button>
                  <button
                    onClick={() => { setActiveTab('giftcard'); setSelectedGiftCard('apple'); }}
                    className={`flex-1 py-2.5 rounded-xl font-semibold transition ${
                      activeTab === 'giftcard' 
                        ? 'bg-gradient-to-r from-orange to-orange-light text-white shadow-lg shadow-orange/20' 
                        : 'bg-black/20 text-text-muted hover:text-text-primary border border-border'
                    }`}
                  >
                    <i className="fa-solid fa-gift mr-2"></i>Gift Cards
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Select Asset</label>
                    {activeTab === 'crypto' ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {cryptoAssets.map((asset) => {
                          const isSelected = selectedAsset === asset.id;
                          return (
                            <button
                              key={asset.id}
                              type="button"
                              onClick={() => setSelectedAsset(asset.id)}
                              className={`p-3 rounded-xl border transition text-center ${
                                isSelected 
                                  ? 'border-orange bg-orange/10 shadow-lg shadow-orange/10' 
                                  : 'border-border bg-black/20 hover:border-orange/50'
                              }`}
                            >
                              <i className={`${asset.icon} text-2xl block`} style={{ color: asset.color }}></i>
                              <p className="text-xs font-semibold mt-1 truncate">{asset.name}</p>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {giftCardRates.slice(0, 8).map((card) => {
                          const isSelected = selectedGiftCard === card.id;
                          const imagePath = `/images/cards/${card.id}.png`;
                          return (
                            <button
                              key={card.id}
                              type="button"
                              onClick={() => setSelectedGiftCard(card.id)}
                              className={`p-2 rounded-xl border transition text-center relative ${
                                isSelected 
                                  ? 'border-orange bg-orange/10 shadow-lg shadow-orange/10' 
                                  : 'border-border bg-black/20 hover:border-orange/50'
                              }`}
                            >
                              <img
                                src={imagePath}
                                alt={card.name}
                                className="w-8 h-8 mx-auto object-contain"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  const parent = e.target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `<i class="${card.icon} text-xl text-orange block"></i>`;
                                  }
                                }}
                              />
                              <p className="text-xs font-semibold mt-0.5 truncate">{card.name}</p>
                            </button>
                          );
                        })}
                        <Link
                          href="/dashboard/sell-gift-card"
                          className="p-2 rounded-xl border border-dashed border-border bg-black/10 flex flex-col items-center justify-center text-center hover:border-orange transition"
                        >
                          <i className="fa-solid fa-arrow-right text-orange text-xl"></i>
                          <p className="text-[10px] text-text-muted mt-1">View All</p>
                        </Link>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Amount (USD)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                        className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-text-primary focus:border-orange focus:outline-none text-2xl font-bold"
                        min="1"
                        step="0.01"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted text-sm font-semibold">USD</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Result */}
              <div className="flex-1 bg-gradient-to-br from-purple-900/20 to-orange-900/10 rounded-2xl p-6 border border-border/50 flex flex-col justify-center items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>
                <div className="relative z-10 text-center">
                  {isLoading ? (
                    <>
                      <p className="text-text-muted text-sm animate-pulse">Loading rates...</p>
                      <p className="text-2xl font-bold text-green-400 animate-pulse">Loading...</p>
                    </>
                  ) : displayRate > 0 ? (
                    <>
                      <p className="text-text-muted text-sm">Rate</p>
                      <p className="text-2xl font-bold text-orange">1 USD = ₦{displayRate.toFixed(2)}</p>
                      <div className="w-16 h-0.5 bg-orange/30 mx-auto my-3"></div>
                      <p className="text-text-muted text-sm uppercase tracking-wider">You'll receive</p>
                      <p className="text-4xl font-extrabold text-green-400">
                        ₦{payout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </>
                  ) : (
                    <p className="text-text-muted text-sm">Select an asset to see rate</p>
                  )}
                  <Link
                    href={activeTab === 'crypto' ? '/dashboard/sell' : '/dashboard/sell-gift-card'}
                    className="mt-4 inline-block bg-gradient-to-r from-orange to-orange-light text-white px-8 py-2.5 rounded-full font-semibold hover:shadow-lg hover:shadow-orange/30 transition-all duration-300"
                  >
                    Trade Now →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Crypto Rates Table */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Crypto Rates</h2>
            <div className="glass rounded-2xl border border-border overflow-hidden shadow-lg shadow-purple/5">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black/30">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Asset</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Rate (NGN)</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">USD Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {cryptoAssets.map((asset) => {
                      const rateNgn = getCryptoRate(asset.id);
                      const usdPrice = cryptoUsdPrices[asset.id] || 0;
                      return (
                        <tr key={asset.id} className="hover:bg-white/5 transition">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <i className={`${asset.icon} text-xl`} style={{ color: asset.color }}></i>
                              <span className="font-semibold">{asset.id}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right font-medium">{formatRate(rateNgn)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-text-muted">${usdPrice.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Top Gift Card Rates Table */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              Top Gift Card Rates
              <span className="text-sm font-normal text-text-muted">(based on $100 amount)</span>
            </h2>
            <div className="glass rounded-2xl border border-border overflow-hidden shadow-lg shadow-purple/5">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black/30">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Card</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Rate (NGN)</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Rate (USD)</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">% Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {giftCardRates.map((card, index) => {
                      const rateNgn = card.rate || 0;
                      const rateUsd = ngnRate > 0 ? rateNgn / ngnRate : 0;
                      const isTop = index < 3;
                      const imagePath = `/images/cards/${card.id}.png`;
                      return (
                        <tr key={card.id} className="hover:bg-white/5 transition">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <img
                                src={imagePath}
                                alt={card.name}
                                className="w-6 h-6 object-contain"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.innerHTML = `<i class="${card.icon} text-xl text-orange"></i>`;
                                }}
                              />
                              <span className="font-semibold">{card.name}</span>
                              {isTop && (
                                <span className="text-[10px] bg-orange/20 text-orange px-2 py-0.5 rounded-full font-bold">
                                  🔥 High Rate
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right font-medium">{formatRate(rateNgn)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-text-muted">${rateUsd.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-green-400">
                            {ngnRate > 0 ? Math.round((rateNgn / ngnRate) * 100) : 0}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="p-4 text-center border-t border-border">
                <Link href="/dashboard/sell-gift-card" className="inline-block glass px-6 py-2 rounded-full text-orange border border-orange/30 hover:bg-orange/10 transition text-sm font-semibold">
                  View all gift cards →
                </Link>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
            <div className="glass rounded-2xl border border-border overflow-hidden shadow-lg shadow-purple/5 divide-y divide-border/50">
              {faqs.map((faq, index) => (
                <div key={index} className="p-4">
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="flex items-center justify-between w-full text-left group"
                  >
                    <span className="font-medium text-text-primary group-hover:text-orange transition">{faq.q}</span>
                    <span className="text-orange ml-4 flex-shrink-0 transition-transform duration-300">
                      <i className={`fa-solid ${openFaq === index ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                    </span>
                  </button>
                  <div className={`mt-2 text-sm text-text-muted overflow-hidden transition-all duration-300 ease-in-out ${openFaq === index ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <p className="leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-text-muted text-xs mt-6">
            Rates updated every 60 seconds. Powered by CoinGecko &amp; ExchangeRate.fun.
          </p>
        </div>
      </Layout>
    </>
  );
}
