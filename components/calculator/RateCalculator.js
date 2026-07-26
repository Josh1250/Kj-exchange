import { useState, useEffect } from 'react';
import Link from 'next/link';

// ============================================================
// CRYPTO ASSETS DATA
// ============================================================
const CRYPTO_ASSETS = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', icon: 'fa-brands fa-bitcoin', color: '#f7931a' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', icon: 'fa-brands fa-ethereum', color: '#627eea' },
  { id: 'tether', name: 'Tether', symbol: 'USDT', icon: 'fa-solid fa-coins', color: '#26a17b' },
  { id: 'solana', name: 'Solana', symbol: 'SOL', icon: 'fa-solid fa-bolt', color: '#9945FF' },
];

// ============================================================
// GIFT CARD ASSETS
// ============================================================
const GIFT_CARD_ASSETS = [
  { id: 'apple', name: 'Apple & iTunes', icon: 'fa-brands fa-apple', rate: 0.85 },
  { id: 'amazon', name: 'Amazon', icon: 'fa-brands fa-amazon', rate: 0.82 },
  { id: 'google', name: 'Google Play', icon: 'fa-brands fa-google-play', rate: 0.80 },
  { id: 'steam', name: 'Steam', icon: 'fa-solid fa-gamepad', rate: 0.75 },
  { id: 'sephora', name: 'Sephora', icon: 'fa-solid fa-spa', rate: 0.78 },
  { id: 'razer', name: 'Razer Gold', icon: 'fa-solid fa-dragon', rate: 0.72 },
  { id: 'xbox', name: 'Xbox', icon: 'fa-brands fa-xbox', rate: 0.76 },
  { id: 'playstation', name: 'PlayStation', icon: 'fa-solid fa-gamepad', rate: 0.74 },
];

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function RateCalculator() {
  const [assetType, setAssetType] = useState('crypto'); // 'crypto' or 'gift_card'
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [amount, setAmount] = useState(100);
  const [result, setResult] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [rates, setRates] = useState({
    btcUsd: 95200,
    usdtUsd: 1,
    ethUsd: 4210,
    solUsd: 185,
    ngnRate: 1550,
  });

  // ============================================================
  // FETCH LIVE RATES
  // ============================================================
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const fxRes = await fetch('https://api.exchangerate.fun/latest?base=USD');
        const fxData = await fxRes.json();
        const ngnRate = fxData.rates?.NGN || 1550;

        const cryptoRes = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,tether,ethereum,solana&vs_currencies=usd'
        );
        const cryptoData = await cryptoRes.json();

        setRates({
          btcUsd: cryptoData.bitcoin?.usd || 95200,
          usdtUsd: cryptoData.tether?.usd || 1,
          ethUsd: cryptoData.ethereum?.usd || 4210,
          solUsd: cryptoData.solana?.usd || 185,
          ngnRate: ngnRate,
        });
      } catch (error) {
        console.warn('⚠️ Using fallback rates', error);
      }
    };
    fetchRates();
    const interval = setInterval(fetchRates, 60000);
    return () => clearInterval(interval);
  }, []);

  // ============================================================
  // GET ASSETS BASED ON TYPE
  // ============================================================
  const getAssets = () => {
    if (assetType === 'crypto') return CRYPTO_ASSETS;
    return GIFT_CARD_ASSETS;
  };

  const getAssetRate = (asset) => {
    if (assetType === 'crypto') {
      switch (asset.id) {
        case 'bitcoin': return rates.btcUsd * rates.ngnRate;
        case 'tether': return rates.usdtUsd * rates.ngnRate;
        case 'ethereum': return rates.ethUsd * rates.ngnRate;
        case 'solana': return rates.solUsd * rates.ngnRate;
        default: return 0;
      }
    } else {
      return rates.ngnRate * asset.rate;
    }
  };

  const getAssetSymbol = (asset) => {
    if (assetType === 'crypto') return asset.symbol;
    return '$';
  };

  // ============================================================
  // FILTER ASSETS
  // ============================================================
  const filteredAssets = getAssets().filter(asset =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (asset.symbol && asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // ============================================================
  // CALCULATE RESULT
  // ============================================================
  useEffect(() => {
    if (!selectedAsset) {
      setResult(0);
      return;
    }

    const rate = getAssetRate(selectedAsset);
    const total = amount * rate;
    setResult(total);
  }, [selectedAsset, amount, rates, assetType]);

  // ============================================================
  // SELECT ASSET
  // ============================================================
  const handleSelectAsset = (asset) => {
    setSelectedAsset(asset);
    setSearchTerm(asset.name);
    setShowDropdown(false);
  };

  // ============================================================
  // FORMAT RESULT
  // ============================================================
  const formatResult = () => {
    if (result === 0) return '0';
    if (result >= 1000000) return (result / 1000000).toFixed(2) + 'M';
    if (result >= 1000) return result.toLocaleString();
    return result.toFixed(2);
  };

  // Get the link for "Trade Now"
  const getTradeLink = () => {
    if (assetType === 'crypto') return '/dashboard/sell';
    return '/dashboard/sell-gift-card';
  };

  return (
    <div className="glass rounded-3xl p-6 md:p-8 border border-border relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-full bg-orange/10 flex items-center justify-center text-orange">
            <i className="fas fa-calculator"></i>
          </div>
          <h4 className="text-xl font-bold">Rate Calculator</h4>
        </div>
        <p className="text-text-muted text-sm ml-12 mb-6">
          See exactly how much you'll get in Naira
        </p>

        {/* ============================================
            ASSET TYPE TOGGLE
        ============================================ */}
        <div className="flex bg-black/20 rounded-xl p-1 mb-5">
          <button
            className={`flex-1 py-2.5 rounded-lg text-center font-semibold transition text-sm ${
              assetType === 'crypto'
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange/20'
                : 'text-text-muted hover:text-text-primary'
            }`}
            onClick={() => {
              setAssetType('crypto');
              setSelectedAsset(null);
              setSearchTerm('');
            }}
          >
            <i className="fa-brands fa-bitcoin mr-2"></i>Crypto
          </button>
          <button
            className={`flex-1 py-2.5 rounded-lg text-center font-semibold transition text-sm ${
              assetType === 'gift_card'
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange/20'
                : 'text-text-muted hover:text-text-primary'
            }`}
            onClick={() => {
              setAssetType('gift_card');
              setSelectedAsset(null);
              setSearchTerm('');
            }}
          >
            <i className="fa-solid fa-gift mr-2"></i>Gift Cards
          </button>
        </div>

        {/* ============================================
            ASSET SELECTOR (Searchable Dropdown)
        ============================================ */}
        <div className="mb-5">
          <label className="text-xs uppercase tracking-wider text-text-muted font-semibold block mb-1.5">
            Select {assetType === 'crypto' ? 'Crypto' : 'Gift Card'}
          </label>
          <div className="relative">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                <i className="fa-solid fa-magnifying-glass"></i>
              </span>
              <input
                type="text"
                placeholder={`Search ${assetType === 'crypto' ? 'crypto' : 'gift cards'}...`}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="w-full bg-black/30 border border-border rounded-xl px-12 py-3.5 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 placeholder:text-text-muted/50"
              />
              {selectedAsset && (
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition"
                  onClick={() => {
                    setSelectedAsset(null);
                    setSearchTerm('');
                  }}
                >
                  <i className="fa-regular fa-xmark text-lg"></i>
                </button>
              )}
            </div>

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute z-20 w-full mt-2 glass rounded-xl border border-border max-h-60 overflow-y-auto shadow-2xl">
                {filteredAssets.length === 0 ? (
                  <div className="px-4 py-6 text-center text-text-muted">
                    No {assetType === 'crypto' ? 'crypto' : 'gift cards'} found.
                  </div>
                ) : (
                  filteredAssets.map((asset) => {
                    const rate = getAssetRate(asset);
                    const symbol = getAssetSymbol(asset);
                    const isSelected = selectedAsset?.id === asset.id;

                    return (
                      <div
                        key={asset.id}
                        className={`px-4 py-3 hover:bg-orange/5 cursor-pointer flex items-center justify-between transition border-b border-border last:border-b-0 ${
                          isSelected ? 'bg-orange/5 border-l-2 border-orange' : ''
                        }`}
                        onClick={() => handleSelectAsset(asset)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl w-8 text-center">
                            <i className={`${asset.icon} ${assetType === 'crypto' ? '' : 'text-orange'}`}></i>
                          </span>
                          <div>
                            <p className="font-medium text-sm">{asset.name}</p>
                            {asset.symbol && (
                              <p className="text-xs text-text-muted">{asset.symbol}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-green-400">
                            ₦{Math.round(rate).toLocaleString()}/{symbol}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Selected Asset Display */}
          {selectedAsset && (
            <div className="mt-3 bg-black/20 rounded-xl p-3 flex items-center justify-between border border-border/50">
              <div className="flex items-center gap-3">
                <span className="text-2xl w-8 text-center">
                  <i className={`${selectedAsset.icon} ${assetType === 'crypto' ? '' : 'text-orange'}`}></i>
                </span>
                <div>
                  <p className="font-semibold text-sm">{selectedAsset.name}</p>
                  <p className="text-text-muted text-xs">
                    1 {assetType === 'crypto' ? selectedAsset.symbol : '$'} = ₦{Math.round(getAssetRate(selectedAsset)).toLocaleString()}
                  </p>
                </div>
              </div>
              <span className="text-xs bg-orange/10 text-orange px-3 py-1 rounded-full font-medium">
                Live Rate
              </span>
            </div>
          )}
        </div>

        {/* ============================================
            AMOUNT INPUT
        ============================================ */}
        <div className="mb-5">
          <label className="text-xs uppercase tracking-wider text-text-muted font-semibold block mb-1.5">
            Amount ({selectedAsset ? (assetType === 'crypto' ? selectedAsset.symbol : '$') : 'Units'})
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="w-full bg-black/30 border border-border rounded-xl px-4 py-3.5 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 placeholder:text-text-muted/50 text-lg"
            min="0"
            step={assetType === 'crypto' ? 'any' : '1'}
          />
        </div>

        {/* ============================================
            RESULT
        ============================================ */}
        <div className="mt-2 bg-gradient-to-r from-purple-900/10 to-orange-900/10 rounded-xl p-5 border border-border/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs uppercase tracking-wider text-text-muted font-semibold">
              <i className="fa-solid fa-arrow-right text-orange mr-2"></i> You get approximately
            </span>
            <span className="text-[10px] bg-green-400/10 text-green-400 px-2 py-0.5 rounded-full border border-green-400/20">
              <i className="fa-regular fa-circle-check mr-1"></i> Live Rate
            </span>
          </div>
          <div className="text-3xl md:text-4xl font-extrabold mt-1">
            <span className="text-text-muted text-xl font-semibold">₦</span>{' '}
            {formatResult()}
          </div>
          {selectedAsset && result > 0 && (
            <p className="text-xs text-text-muted mt-1">
              <i className="fa-regular fa-clock mr-1"></i> Rate locked for 60s • Updated automatically
            </p>
          )}
        </div>

        {/* ============================================
            ACTION BUTTONS
        ============================================ */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link
            href={getTradeLink()}
            className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3 rounded-xl text-center hover:shadow-lg hover:shadow-orange/20 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-arrow-right"></i> Trade Now
          </Link>
          <Link
            href="/rates"
            className="flex-1 border border-border text-text-primary font-semibold py-3 rounded-xl text-center hover:border-orange hover:text-orange transition-all duration-300 flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-chart-simple"></i> View All Rates
          </Link>
        </div>

        {/* ============================================
            TRUST BADGES
        ============================================ */}
        <div className="flex justify-center gap-4 md:gap-6 mt-5 text-xs text-text-muted flex-wrap">
          <span><i className="fa-solid fa-lock text-orange mr-1"></i> Secure</span>
          <span><i className="fa-solid fa-bolt text-orange mr-1"></i> Fast</span>
          <span><i className="fa-solid fa-shield-alt text-orange mr-1"></i> Trusted</span>
          <span><i className="fa-solid fa-wallet text-green-400 mr-1"></i> <span className="text-green-400">Instant Payout</span></span>
        </div>

        {/* ============================================
            POWERED BY NOTE
        ============================================ */}
        <div className="mt-4 text-center">
          <span className="text-[10px] text-text-muted">
            💡 Real-time rates powered by CoinGecko &amp; ExchangeRate.fun
          </span>
        </div>
      </div>
    </div>
  );
}
