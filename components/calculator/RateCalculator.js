import { useState, useEffect } from 'react';

// ============================================================
// CRYPTO ASSETS DATA
// ============================================================
const CRYPTO_ASSETS = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', icon: '₿', color: '#f7931a' },
  { id: 'tether', name: 'Tether', symbol: 'USDT', icon: '₮', color: '#26a17b' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', icon: '⟠', color: '#627eea' },
  { id: 'solana', name: 'Solana', symbol: 'SOL', icon: '◎', color: '#9945FF' },
];

// ============================================================
// GIFT CARD ASSETS
// ============================================================
const GIFT_CARD_ASSETS = [
  { id: 'apple', name: 'Apple Gift Card', icon: '🍎', rate: 0.85 },
  { id: 'amazon', name: 'Amazon Gift Card', icon: '📦', rate: 0.82 },
  { id: 'google', name: 'Google Play Gift Card', icon: '▶️', rate: 0.80 },
  { id: 'steam', name: 'Steam Gift Card', icon: '🎮', rate: 0.75 },
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
        // Fetch NGN rate
        const fxRes = await fetch('https://api.exchangerate.fun/latest?base=USD');
        const fxData = await fxRes.json();
        const ngnRate = fxData.rates?.NGN || 1550;

        // Fetch crypto prices
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

  return (
    <div className="bg-bg-card backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-border shadow-card shadow-glow relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-glow rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-glow rounded-full blur-3xl -z-10"></div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-orange/20 flex items-center justify-center text-orange">
            <i className="fas fa-calculator"></i>
          </div>
          <h4 className="text-xl font-bold">Instant Rate Calculator</h4>
        </div>
        <p className="text-text-muted text-sm ml-12 mb-6">
          See exactly how much you'll get in Naira
        </p>

        {/* ============================================
            ASSET TYPE TOGGLE (Crypto / Gift Card)
        ============================================ */}
        <div className="flex bg-black/20 rounded-lg p-1 mb-4">
          <button
            className={`flex-1 py-2 px-4 rounded-lg text-center font-semibold transition text-sm ${
              assetType === 'crypto'
                ? 'bg-orange text-white'
                : 'text-text-muted hover:text-text-primary'
            }`}
            onClick={() => {
              setAssetType('crypto');
              setSelectedAsset(null);
              setSearchTerm('');
            }}
          >
            ₿ Crypto
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded-lg text-center font-semibold transition text-sm ${
              assetType === 'gift_card'
                ? 'bg-orange text-white'
                : 'text-text-muted hover:text-text-primary'
            }`}
            onClick={() => {
              setAssetType('gift_card');
              setSelectedAsset(null);
              setSearchTerm('');
            }}
          >
            🎁 Gift Cards
          </button>
        </div>

        {/* ============================================
            ASSET SELECTOR (Searchable Dropdown)
        ============================================ */}
        <div className="mb-4">
          <label className="text-xs uppercase tracking-wider text-text-muted font-semibold block mb-1">
            Select {assetType === 'crypto' ? 'Crypto' : 'Gift Card'}
          </label>
          <div className="relative">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                🔍
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
                className="w-full bg-black/40 border border-border rounded-lg px-12 py-3 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange-glow/30"
              />
              {selectedAsset && (
                <span
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted cursor-pointer hover:text-text-primary"
                  onClick={() => {
                    setSelectedAsset(null);
                    setSearchTerm('');
                  }}
                >
                  ✕
                </span>
              )}
            </div>

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute z-20 w-full mt-2 bg-bg-card border border-border rounded-lg max-h-60 overflow-y-auto shadow-card">
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
                        className={`px-4 py-3 hover:bg-bg-hover cursor-pointer flex items-center justify-between transition border-b border-border last:border-b-0 ${
                          isSelected ? 'bg-purple/20 border-l-2 border-orange' : ''
                        }`}
                        onClick={() => handleSelectAsset(asset)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">
                            {assetType === 'crypto' ? asset.icon : asset.icon}
                          </span>
                          <div>
                            <p className="font-medium">{asset.name}</p>
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
            <div className="mt-2 bg-black/20 rounded-lg p-2 flex items-center justify-between border border-border">
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {assetType === 'crypto' ? selectedAsset.icon : selectedAsset.icon}
                </span>
                <span className="font-semibold text-sm">{selectedAsset.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-green-400 text-sm font-bold">
                  0% Fees
                </span>
                <span className="text-text-muted text-xs">
                  1 {assetType === 'crypto' ? selectedAsset.symbol : '$'} = ₦{Math.round(getAssetRate(selectedAsset)).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ============================================
            AMOUNT INPUT
        ============================================ */}
        <div className="mb-4">
          <label className="text-xs uppercase tracking-wider text-text-muted font-semibold block mb-1">
            Amount ({selectedAsset ? (assetType === 'crypto' ? selectedAsset.symbol : '$') : 'Units'})
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="w-full bg-black/40 border border-border rounded-lg px-4 py-3 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange-glow/30"
            min="0"
            step={assetType === 'crypto' ? 'any' : '1'}
          />
        </div>

        {/* ============================================
            RESULT
        ============================================ */}
        <div className="mt-4 bg-gradient-to-r from-purple/20 to-orange/10 rounded-lg p-4 border-l-4 border-orange">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-text-muted font-semibold">
              <i className="fas fa-arrow-right mr-2 text-orange"></i> You get approximately
              <span className="ml-2 bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                <i className="fas fa-check-circle mr-1"></i> 0% Fees
              </span>
            </span>
          </div>
          <div className="text-3xl md:text-4xl font-extrabold mt-1">
            <span className="text-text-muted text-xl font-semibold">₦</span>{' '}
            {formatResult()}
          </div>
          {selectedAsset && result > 0 && (
            <p className="text-xs text-text-muted mt-1">
              Rate locked for 5 minutes · No hidden fees
            </p>
          )}
        </div>

        {/* ============================================
            FOOTNOTE & TRUST BADGES
        ============================================ */}
        <p className="text-center text-xs text-text-muted mt-4">
          <i className="fas fa-sync-alt mr-1"></i> Rates update automatically every 60 seconds
        </p>

        <div className="flex justify-center gap-4 md:gap-6 mt-4 text-xs text-text-muted flex-wrap">
          <span><i className="fas fa-lock text-orange mr-1"></i> Secure</span>
          <span><i className="fas fa-bolt text-orange mr-1"></i> Fast</span>
          <span><i className="fas fa-shield-alt text-orange mr-1"></i> Trusted</span>
          <span><i className="fas fa-wallet text-green-400 mr-1"></i> <span className="text-green-400">0% Fees</span></span>
        </div>

        {/* ============================================
            POWERED BY NOTE
        ============================================ */}
        <div className="mt-4 text-center">
          <span className="text-[10px] text-text-muted">
            💡 Real-time rates powered by CoinGecko & ExchangeRate.fun
          </span>
        </div>
      </div>
    </div>
  );
}
