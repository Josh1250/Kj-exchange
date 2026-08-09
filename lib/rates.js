// lib/rates.js

// ===== FIXED SPREADS (Matches Dtunes) =====
// Low = amount < $500, High = amount >= $501
export const SPREADS = {
  BTC: { low: 0.0286, high: 0.0142 },
  ETH: { low: 0.0286, high: 0.0142 },
  USDT: { low: 0.0106, high: 0.0034 },
  SOL: { low: 0.0286, high: 0.0142 },
  BNB: { low: 0.0286, high: 0.0142 },
  TRX: { low: 0.0358, high: 0.0142 },
  LTC: { low: 0.0286, high: 0.0142 },
  BCH: { low: 0.1079, high: 0.0143 },
};

export const COINS = [
  { id: 'BTC', name: 'Bitcoin', icon: 'fa-brands fa-bitcoin', color: '#f7931a' },
  { id: 'ETH', name: 'Ethereum', icon: 'fa-brands fa-ethereum', color: '#627eea' },
  { id: 'USDT', name: 'Tether', icon: 'fa-solid fa-coins', color: '#26a17b' },
  { id: 'SOL', name: 'Solana', icon: 'fa-solid fa-bolt', color: '#9945FF' },
  { id: 'BNB', name: 'BNB', icon: 'fa-solid fa-cube', color: '#F3BA2F' },
  { id: 'TRX', name: 'Tron', icon: 'fa-solid fa-bolt', color: '#EF0027' },
  { id: 'LTC', name: 'Litecoin', icon: 'fa-brands fa-litecoin', color: '#345d9d' },
  { id: 'BCH', name: 'Bitcoin Cash', icon: 'fa-brands fa-bitcoin', color: '#8dc351' },
];

export const getSpread = (coinId, amount) => {
  const config = SPREADS[coinId];
  if (!config) return 0.0286;
  return amount < 500 ? config.low : config.high;
};

export const calculateRate = (coinId, amount, marketRate) => {
  const parsed = parseFloat(amount) || 0;
  if (parsed <= 0 || !marketRate) return { rate: 0, spread: 0 };

  const spread = getSpread(coinId, parsed);
  const rate = marketRate * (1 - spread);

  return { rate, spread };
};
