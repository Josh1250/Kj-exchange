import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../_app';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../lib/supabaseClient';
import Head from 'next/head';
import Link from 'next/link';

// ============================================
// YOUR REAL WALLET ADDRESSES
// ============================================

const WALLETS = {
  BTC: 'bc1qacxpfqr7huu0qgw2xyhd2gd0k78a4z2fz3w0rf',
  ETH: '0xD866089A82223C520A8503f7315BeF0Ff2e531A2',
  USDT: {
    'TRC-20': 'TWEbVbemQUQR98TYBFMAWyjMhLgQyubF6g',
    'ERC-20': '0xD866089A82223C520A8503f7315BeF0Ff2e531A2',
    'BEP-20': '0xD866089A82223C520A8503f7315BeF0Ff2e531A2',
  },
  SOL: 'FJ6CRFLWiFV2zfY2c5E147BvQVDVqKXNHAb8NNuGZUnZ',
  BNB: '0xD866089A82223C520A8503f7315BeF0Ff2e531A2',
  TRX: 'TWEbVbemQUQR98TYBFMAWyjMhLgQyubF6g',
  LTC: 'ltc1qyx7j563wzd99wpl77xchd5kt7x2zuwavsgqz20',
  BCH: 'qrsluzh9r24sa7306l9qpzwhd58ewerq0qnh47qjqh',
};

// ============================================
// COIN CONFIG
// ============================================

const COINS = [
  { id: 'BTC', name: 'Bitcoin', icon: 'fa-brands fa-bitcoin', color: '#f7931a', networks: ['Bitcoin'] },
  { id: 'ETH', name: 'Ethereum', icon: 'fa-brands fa-ethereum', color: '#627eea', networks: ['Ethereum'] },
  {
    id: 'USDT',
    name: 'Tether',
    icon: 'fa-solid fa-coins',
    color: '#26a17b',
    networks: ['TRC-20', 'ERC-20', 'BEP-20'],
    defaultNetwork: 'TRC-20',
  },
  { id: 'SOL', name: 'Solana', icon: 'fa-solid fa-bolt', color: '#9945FF', networks: ['Solana'] },
  { id: 'BNB', name: 'BNB', icon: 'fa-solid fa-cube', color: '#F3BA2F', networks: ['BSC'] },
  { id: 'TRX', name: 'Tron', icon: 'fa-solid fa-bolt', color: '#EF0027', networks: ['Tron'] },
  { id: 'LTC', name: 'Litecoin', icon: 'fa-brands fa-litecoin', color: '#345d9d', networks: ['Litecoin'] },
  { id: 'BCH', name: 'Bitcoin Cash', icon: 'fa-brands fa-bitcoin', color: '#8dc351', networks: ['Bitcoin Cash'] },
];

export default function Deposit() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [selectedCoin, setSelectedCoin] = useState(COINS[0]);
  const [selectedNetwork, setSelectedNetwork] = useState(COINS[0].networks[0]);
  const [usdAmount, setUsdAmount] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState(0);
  const [search, setSearch] = useState('');
  const [step, setStep] = useState('select'); // 'select' | 'generating' | 'deposit'
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAgreement, setShowAgreement] = useState(false);
  const [rates, setRates] = useState({});
  const [coinPrices, setCoinPrices] = useState({});
  const [ngnRate, setNgnRate] = useState(1389);
  const [isLoadingRates, setIsLoadingRates] = useState(true);

  // Fetch rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        setIsLoadingRates(true);
        const res = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=NGN');
        const data = await res.json();
        const ngn = data.rates?.NGN || 1389;
        setNgnRate(ngn);

        const cryptoRes = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,solana,binancecoin,tron,litecoin,bitcoin-cash&vs_currencies=usd'
        );
        const cryptoData = await cryptoRes.json();

        setCoinPrices({
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
        console.warn('⚠️ Rate fetch failed', error);
      } finally {
        setIsLoadingRates(false);
      }
    };

    fetchRates();
    const interval = setInterval(fetchRates, 60000);
    return () => clearInterval(interval);
  }, []);

  // Get wallet address
  const getWalletAddress = () => {
    const coin = selectedCoin.id;
    if (coin === 'USDT') {
      return WALLETS.USDT[selectedNetwork] || 'Address not available';
    }
    return WALLETS[coin] || 'Address not available';
  };

  // Handle agreement → simulate wallet generation
  const handleAgreeAndGenerate = async () => {
    setShowAgreement(false);
    setStep('generating');

    // Simulate 2-3 second loading animation
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const amount = parseFloat(usdAmount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      setStep('select');
      return;
    }

    const priceUsd = coinPrices[selectedCoin.id] || 0;
    if (priceUsd <= 0) {
      setError('Unable to fetch current price. Please try again.');
      setStep('select');
      return;
    }

    const calculatedCryptoAmount = amount / priceUsd;
    setCryptoAmount(calculatedCryptoAmount);

    try {
      const response = await fetch('/api/crypto/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          coin: selectedCoin.id,
          network: selectedNetwork,
          usdAmount: amount,
          cryptoAmount: calculatedCryptoAmount,
          rate: ngnRate,
          payout: amount * ngnRate,
          walletAddress: getWalletAddress(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create order');
      }

      setOrder(data);
      setStep('deposit');
      setSuccess('✅ Wallet generated! Send crypto to the address below.');
    } catch (err) {
      setError(err.message || 'Failed to create order. Please try again.');
      setStep('select');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('✅ Address copied to clipboard!');
  };

  const handleReset = () => {
    setStep('select');
    setOrder(null);
    setError('');
    setSuccess('');
  };

  const filteredCoins = COINS.filter((coin) =>
    coin.name.toLowerCase().includes(search.toLowerCase()) ||
    coin.id.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div>Loading...</div>;
  if (!user) {
    router.push('/auth/login');
    return null;
  }

  const amount = parseFloat(usdAmount) || 0;
  const priceUsd = coinPrices[selectedCoin.id] || 0;
  const cryptoAmt = amount > 0 ? amount / priceUsd : 0;
  const walletAddress = getWalletAddress();

  return (
    <>
      <Head>
        <title>Deposit Crypto · KJ Exchange</title>
      </Head>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            <Link href="/dashboard" className="text-text-muted hover:text-text-primary transition group">
              <i className="fa-solid fa-arrow-left text-sm group-hover:-translate-x-1 transition-transform"></i>
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <i className="fa-solid fa-arrow-down text-orange"></i>
              Deposit Crypto
            </h1>
          </div>

          {step === 'select' ? (
            // ============================================
            // SELECT ASSET + AMOUNT
            // ============================================
            <div className="space-y-6">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 pl-12 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20"
                  placeholder="Search supported asset"
                />
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"></i>
              </div>

              {/* Asset Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {filteredCoins.map((coin) => {
                  const isSelected = selectedCoin.id === coin.id;
                  const price = coinPrices[coin.id] || 0;

                  return (
                    <button
                      key={coin.id}
                      onClick={() => {
                        setSelectedCoin(coin);
                        setSelectedNetwork(coin.networks[0]);
                        setUsdAmount('');
                      }}
                      className={`p-4 rounded-2xl border transition-all duration-200 text-left ${
                        isSelected
                          ? 'border-orange bg-orange/10 shadow-lg shadow-orange/10 scale-[1.02]'
                          : 'border-border bg-black/20 hover:border-orange/50 hover:bg-black/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <i className={`${coin.icon} text-xl`} style={{ color: coin.color }}></i>
                        <span className="font-bold text-sm">{coin.id}</span>
                      </div>
                      <p className="text-text-muted text-xs mt-1">{coin.name}</p>
                      <p className="text-sm font-semibold mt-1">${price.toFixed(2)}</p>
                    </button>
                  );
                })}
              </div>

              {/* Coin Detail */}
              <div className="glass rounded-2xl p-6 border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <i className={`${selectedCoin.icon} text-2xl`} style={{ color: selectedCoin.color }}></i>
                  <div>
                    <h2 className="text-xl font-bold">Deposit {selectedCoin.name}</h2>
                    <p className="text-text-muted text-sm">Price: ${priceUsd.toFixed(2)}</p>
                  </div>
                </div>

                {/* Network Selection */}
                {selectedCoin.networks.length > 1 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">Select Network</label>
                    <div className="flex gap-2 flex-wrap">
                      {selectedCoin.networks.map((net) => (
                        <button
                          key={net}
                          onClick={() => setSelectedNetwork(net)}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                            selectedNetwork === net
                              ? 'bg-orange text-white shadow-lg shadow-orange/20'
                              : 'bg-black/20 border border-border text-text-muted hover:border-orange/50'
                          }`}
                        >
                          {net}
                        </button>
                      ))}
                    </div>
                    {selectedCoin.id === 'USDT' && selectedNetwork === 'TRC-20' && (
                      <p className="text-xs text-green-400 mt-1">✅ Recommended — lowest fees</p>
                    )}
                  </div>
                )}

                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Amount (USD)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={usdAmount}
                      onChange={(e) => setUsdAmount(e.target.value)}
                      className="w-full bg-black/40 border border-border rounded-xl px-5 py-4 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 text-2xl font-bold placeholder:text-text-muted/50"
                      placeholder="0.00"
                      min="1"
                      step="0.01"
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted text-sm font-semibold">USD</div>
                  </div>
                  {amount > 0 && priceUsd > 0 && (
                    <p className="text-text-muted text-sm mt-2">
                      ≈ {cryptoAmt.toFixed(6)} {selectedCoin.id}
                    </p>
                  )}
                  <p className="text-text-muted text-xs mt-1">Minimum deposit: $1.00</p>
                </div>

                {error && (
                  <div className="mt-4 bg-red-400/10 border border-red-400/20 rounded-xl p-3 text-red-400 text-sm flex items-start gap-2">
                    <i className="fa-solid fa-circle-exclamation mt-0.5"></i>
                    <span>{error}</span>
                  </div>
                )}

                <button
                  onClick={() => setShowAgreement(true)}
                  disabled={!usdAmount || parseFloat(usdAmount) <= 0}
                  className="w-full mt-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-4 rounded-xl hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-orange/20"
                >
                  <i className="fa-solid fa-arrow-down"></i> Continue ➤
                </button>
              </div>
            </div>
          ) : step === 'generating' ? (
            // ============================================
            // GENERATING WALLET ANIMATION
            // ============================================
            <div className="glass rounded-2xl p-12 border border-border text-center">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 border-4 border-orange/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-orange rounded-full animate-spin border-t-transparent"></div>
              </div>
              <h2 className="text-2xl font-bold mt-6">Generating Your Wallet...</h2>
              <p className="text-text-muted mt-3 max-w-sm mx-auto">
                Sit tight while we set things up securely for you.
              </p>
              <p className="text-text-muted text-xs mt-2">This usually takes a few seconds.</p>
            </div>
          ) : (
            // ============================================
            // DEPOSIT ADDRESS (Premium Dtunes Style)
            // ============================================
            <div className="glass rounded-2xl p-6 border border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-green-400/10 flex items-center justify-center text-green-400 text-xl">
                  <i className="fa-regular fa-circle-check"></i>
                </div>
                <div>
                  <h2 className="text-xl font-bold">Deposit {selectedCoin.name}</h2>
                  <p className="text-text-muted text-sm">Order #{order?.orderId}</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Network */}
                <div className="bg-black/20 rounded-xl p-4 border border-border flex items-center justify-between">
                  <span className="text-text-muted text-sm">Network</span>
                  <span className="font-bold">{selectedNetwork}</span>
                </div>

                {/* Wallet Address */}
                <div className="bg-black/20 rounded-xl p-4 border border-border">
                  <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Wallet Address</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-mono text-sm break-all flex-1 text-orange">{walletAddress}</p>
                    <button
                      onClick={() => copyToClipboard(walletAddress)}
                      className="bg-orange/20 hover:bg-orange/30 text-orange px-3 py-1.5 rounded-lg text-sm transition whitespace-nowrap flex items-center gap-1"
                    >
                      <i className="fa-regular fa-copy"></i> Copy
                    </button>
                  </div>
                </div>

                {/* Deposit Info */}
                <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-3 text-yellow-400 text-sm flex items-start gap-2">
                  <i className="fa-solid fa-clock mt-0.5"></i>
                  <div>
                    <p className="font-semibold">Send exactly:</p>
                    <p className="text-lg font-bold text-white">
                      {cryptoAmount.toFixed(6)} {selectedCoin.id}
                    </p>
                    <p className="text-xs text-yellow-400/70 mt-1">
                      Your wallet will be credited after admin confirmation.
                    </p>
                  </div>
                </div>

                {/* Network Warning */}
                {selectedCoin.id === 'USDT' && (
                  <div className="bg-red-400/10 border border-red-400/20 rounded-xl p-3 text-red-400 text-sm flex items-start gap-2">
                    <i className="fa-solid fa-triangle-exclamation mt-0.5"></i>
                    <span>Send USDT only via <strong>{selectedNetwork}</strong> network.</span>
                  </div>
                )}

                {/* Minimum Deposit */}
                <div className="bg-black/20 rounded-xl p-3 border border-border text-center text-text-muted text-xs">
                  Minimum deposit: $1.00 • Lower amounts may not be processed.
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleReset}
                  className="flex-1 border border-border text-text-primary px-4 py-2.5 rounded-xl hover:border-orange transition flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-arrow-left"></i> Back
                </button>
                <Link
                  href="/dashboard/orders"
                  className="flex-1 bg-orange text-white font-bold py-2.5 rounded-xl hover:bg-orange-600 transition text-center flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-list"></i> View Orders
                </Link>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>

      {/* ===== Agreement Modal (Premium Dtunes Style) ===== */}
      {showAgreement && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-2xl max-w-md w-full p-6 border border-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <i className="fa-solid fa-triangle-exclamation text-orange"></i>
                Before you deposit...
              </h2>
              <button
                onClick={() => setShowAgreement(false)}
                className="text-text-muted hover:text-text-primary transition text-xl"
              >
                <i className="fa-regular fa-xmark"></i>
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <i className="fa-regular fa-circle-check text-green-400 mt-0.5"></i>
                <div>
                  <p className="font-semibold">Minimum deposit is $1.00</p>
                  <p className="text-text-muted text-xs">Lower amounts may not be processed.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <i className="fa-solid fa-clock text-yellow-400 mt-0.5"></i>
                <div>
                  <p className="font-semibold">Admin confirmation required</p>
                  <p className="text-text-muted text-xs">Funds will be credited after our team confirms your deposit.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <i className="fa-solid fa-shield text-orange mt-0.5"></i>
                <div>
                  <p className="font-semibold">Funds held in your crypto balance</p>
                  <p className="text-text-muted text-xs">You can sell or keep your crypto anytime.</p>
                </div>
              </div>

              <div className="bg-black/20 rounded-xl p-3 border border-border text-text-muted text-xs">
                By proceeding, you agree to these terms and acknowledge that KJ Exchange is not liable for issues arising from non-compliance.
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAgreement(false)}
                className="flex-1 border border-border text-text-primary px-4 py-2.5 rounded-xl hover:border-orange transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAgreeAndGenerate}
                className="flex-1 bg-orange text-white font-bold py-2.5 rounded-xl hover:bg-orange-600 transition flex items-center justify-center gap-2"
              >
                <i className="fa-regular fa-check-circle"></i> I Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
