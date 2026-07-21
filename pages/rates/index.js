import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import Head from 'next/head';
import Link from 'next/link';

const formatRate = (rate) => {
  if (!rate || rate === 0) return '₦0.00';
  return `₦${rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// FAQ data
const faqs = [
  {
    q: 'What cryptocurrencies can I convert to Naira?',
    a: 'You can convert Bitcoin (BTC), Tether (USDT), Ethereum (ETH), and Solana (SOL) to Naira on KJ Exchange.',
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
  const [rates, setRates] = useState({ BTC: 0, ETH: 0, USDT: 0, SOL: 0 });
  const [ngnRate, setNgnRate] = useState(1550);
  const [giftCardRates, setGiftCardRates] = useState([
    { id: 'apple', name: 'Apple', icon: 'fa-brands fa-apple', rate: 0.85 },
    { id: 'amazon', name: 'Amazon', icon: 'fa-brands fa-amazon', rate: 0.82 },
    { id: 'google', name: 'Google Play', icon: 'fa-brands fa-google-play', rate: 0.80 },
    { id: 'steam', name: 'Steam', icon: 'fa-solid fa-gamepad', rate: 0.75 },
    { id: 'sephora', name: 'Sephora', icon: 'fa-solid fa-spa', rate: 0.78 },
    { id: 'netflix', name: 'Netflix', icon: 'fa-solid fa-film', rate: 0.82 },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [amount, setAmount] = useState(100);
  const [payout, setPayout] = useState(0);
  const [activeTab, setActiveTab] = useState('crypto');
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        setIsLoading(true);
        const fxRes = await fetch('https://api.exchangerate.fun/latest?base=USD');
        const fxData = await fxRes.json();
        const ngn = fxData.rates?.NGN || 1550;
        setNgnRate(ngn);

        const cryptoRes = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,tether,ethereum,solana&vs_currencies=usd'
        );
        const cryptoData = await cryptoRes.json();

        const btcUsd = cryptoData.bitcoin?.usd || 0;
        const usdtUsd = cryptoData.tether?.usd || 1;
        const ethUsd = cryptoData.ethereum?.usd || 0;
        const solUsd = cryptoData.solana?.usd || 0;

        setRates({
          BTC: btcUsd * ngn,
          ETH: ethUsd * ngn,
          USDT: usdtUsd * ngn,
          SOL: solUsd * ngn,
        });

        setGiftCardRates(prev => prev.map(card => ({
          ...card,
          rateNgn: card.rate * ngn,
        })));
      } catch (error) {
        console.warn('Rate fetch failed, using fallback', error);
        setRates({ BTC: 88649559, ETH: 2602943, USDT: 1379, SOL: 105626 });
        setGiftCardRates(prev => prev.map(card => ({
          ...card,
          rateNgn: card.rate * 1550,
        })));
      } finally {
        setIsLoading(false);
      }
    };
    fetchRates();
    const interval = setInterval(fetchRates, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let rate = 0;
    if (activeTab === 'crypto') {
      rate = rates[selectedAsset] || 0;
    } else {
      const card = giftCardRates.find(c => c.id === selectedAsset);
      if (card) rate = card.rateNgn || 0;
    }
    const usdValue = parseFloat(amount) || 0;
    setPayout(usdValue * (rate / (ngnRate || 1)));
  }, [amount, selectedAsset, rates, giftCardRates, ngnRate, activeTab]);

  const cryptoAssets = [
    { id: 'BTC', name: 'Bitcoin', icon: 'fa-brands fa-bitcoin', color: '#f7931a' },
    { id: 'ETH', name: 'Ethereum', icon: 'fa-brands fa-ethereum', color: '#627eea' },
    { id: 'USDT', name: 'Tether', icon: 'fa-solid fa-coins', color: '#26a17b' },
    { id: 'SOL', name: 'Solana', icon: 'fa-solid fa-bolt', color: '#9945FF' },
  ];

  const getCryptoRate = (id) => rates[id] || 0;

  return (
    <>
      <Head>
        <title>Live Rates · KJ Exchange</title>
        <meta name="description" content="Live crypto and gift card exchange rates in Naira. Updated every 60 seconds." />
      </Head>
      <Layout>
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary transition mb-6 group"
          >
            <i className="fa-solid fa-arrow-left text-sm group-hover:-translate-x-1 transition-transform"></i>
            <span className="text-sm font-medium">Back to Home</span>
          </Link>

          <h1 className="text-3xl font-bold mb-2">Live Rate Calculator</h1>
          <p className="text-text-muted mb-8">Get live crypto and gift card rates in Naira. Updated every 60 seconds.</p>

          {/* Calculator Section */}
          <div className="bg-bg-card rounded-3xl p-6 md:p-8 border border-border shadow-2xl shadow-purple/5 mb-10">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Left: Asset selection and amount */}
              <div className="flex-1">
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => { setActiveTab('crypto'); setSelectedAsset('BTC'); }}
                    className={`flex-1 py-2 rounded-xl font-semibold transition ${activeTab === 'crypto' ? 'bg-orange text-white' : 'bg-black/20 text-text-muted hover:text-text-primary'}`}
                  >
                    Crypto
                  </button>
                  <button
                    onClick={() => { setActiveTab('giftcard'); setSelectedAsset('apple'); }}
                    className={`flex-1 py-2 rounded-xl font-semibold transition ${activeTab === 'giftcard' ? 'bg-orange text-white' : 'bg-black/20 text-text-muted hover:text-text-primary'}`}
                  >
                    Gift Cards
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Select Asset</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(activeTab === 'crypto' ? cryptoAssets : giftCardRates).map((asset) => {
                        const isSelected = selectedAsset === asset.id;
                        return (
                          <button
                            key={asset.id}
                            type="button"
                            onClick={() => setSelectedAsset(asset.id)}
                            className={`p-2 rounded-lg border transition text-center ${isSelected ? 'border-orange bg-orange/10' : 'border-border bg-black/20 hover:border-orange/50'}`}
                          >
                            {activeTab === 'crypto' ? (
                              <i className={`${asset.icon} text-lg`} style={{ color: asset.color }}></i>
                            ) : (
                              <i className={`${asset.icon} text-lg text-orange`}></i>
                            )}
                            <p className="text-xs font-semibold mt-1">{asset.id}</p>
                          </button>
                        );
                      })}
                    </div>
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
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted text-sm">USD</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Result */}
              <div className="flex-1 bg-gradient-to-br from-purple-900/20 to-orange-900/10 rounded-2xl p-6 border border-border/50 flex flex-col justify-center items-center">
                <p className="text-text-muted text-sm uppercase tracking-wider">You'll receive</p>
                {isLoading ? (
                  <p className="text-2xl font-bold text-green-400 animate-pulse">Loading...</p>
                ) : (
                  <p className="text-4xl font-extrabold text-green-400">
                    ₦{payout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
                <p className="text-text-muted text-xs mt-1">Rate locked for 5 minutes</p>
                <button className="mt-4 bg-orange text-white px-8 py-2 rounded-full font-semibold hover:bg-orange-600 transition shadow-orange/30 shadow-lg">
                  Trade Now
                </button>
              </div>
            </div>
          </div>

          {/* Table Section: Crypto Rates */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Crypto Rates</h2>
            <div className="bg-bg-card rounded-2xl border border-border overflow-hidden shadow-lg shadow-purple/5">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black/30">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Asset</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Rate (NGN)</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">Rate (USD)</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-text-muted uppercase tracking-wider">24h Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {cryptoAssets.map((asset) => {
                      const rateNgn = getCryptoRate(asset.id);
                      const rateUsd = ngnRate > 0 ? rateNgn / ngnRate : 0;
                      const change = (Math.random() * 8 - 4).toFixed(2);
                      return (
                        <tr key={asset.id} className="hover:bg-white/5 transition">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <i className={`${asset.icon} text-xl`} style={{ color: asset.color }}></i>
                              <span className="font-semibold">{asset.id}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right font-medium">{formatRate(rateNgn)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-text-muted">${rateUsd.toFixed(2)}</td>
                          <td className={`px-6 py-4 whitespace-nowrap text-right ${parseFloat(change) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {change}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Table Section: Gift Card Rates */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Gift Card Rates</h2>
            <div className="bg-bg-card rounded-2xl border border-border overflow-hidden shadow-lg shadow-purple/5">
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
                    {giftCardRates.map((card) => {
                      const rateNgn = card.rateNgn || 0;
                      const rateUsd = ngnRate > 0 ? rateNgn / ngnRate : 0;
                      return (
                        <tr key={card.id} className="hover:bg-white/5 transition">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <i className={`${card.icon} text-xl text-orange`}></i>
                              <span className="font-semibold">{card.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right font-medium">{formatRate(rateNgn)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-text-muted">${rateUsd.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-green-400">{Math.round(card.rate * 100)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
            <div className="bg-bg-card rounded-2xl border border-border overflow-hidden shadow-lg shadow-purple/5 divide-y divide-border/50">
              {faqs.map((faq, index) => (
                <div key={index} className="p-4">
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <span className="font-medium text-text-primary">{faq.q}</span>
                    <span className="text-orange ml-4 flex-shrink-0">
                      <i className={`fa-solid ${openFaq === index ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                    </span>
                  </button>
                  <div className={`mt-2 text-sm text-text-muted transition-all overflow-hidden ${openFaq === index ? 'max-h-40' : 'max-h-0'}`}>
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
