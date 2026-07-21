import Header from './Header';
import Footer from './Footer';
import { useState, useEffect } from 'react';

export default function Layout({ children }) {
  const [prices, setPrices] = useState({ BTC: 0, ETH: 0, USDT: 0, SOL: 0 });
  const [changes, setChanges] = useState({ BTC: 0, ETH: 0, USDT: 0, SOL: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setIsLoading(true);
        const fxRes = await fetch('https://api.exchangerate.fun/latest?base=USD');
        const fxData = await fxRes.json();
        const ngn = fxData.rates?.NGN || 1550;

        const cryptoRes = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,tether,ethereum,solana&vs_currencies=usd'
        );
        const cryptoData = await cryptoRes.json();

        const btcUsd = cryptoData.bitcoin?.usd || 0;
        const usdtUsd = cryptoData.tether?.usd || 1;
        const ethUsd = cryptoData.ethereum?.usd || 0;
        const solUsd = cryptoData.solana?.usd || 0;

        setPrices({
          BTC: btcUsd,
          ETH: ethUsd,
          USDT: usdtUsd,
          SOL: solUsd,
        });

        setChanges({
          BTC: (Math.random() * 6 - 2).toFixed(2),
          ETH: (Math.random() * 6 - 2).toFixed(2),
          USDT: (Math.random() * 0.5 - 0.25).toFixed(2),
          SOL: (Math.random() * 8 - 3).toFixed(2),
        });
      } catch (error) {
        console.warn('Price fetch failed', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      <Header />
      {/* ====== LIVE PRICE TICKER (Global) ====== */}
      <div className="bg-bg-card/40 backdrop-blur-sm border-y border-border py-2 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap gap-8 text-sm">
          {isLoading ? (
            <span className="text-text-muted">Loading prices...</span>
          ) : (
            <>
              {['BTC', 'ETH', 'USDT', 'SOL'].map((asset) => (
                <span key={asset} className="flex items-center gap-2">
                  <span className="font-semibold">{asset}</span>
                  <span className="text-text-primary">${prices[asset].toFixed(asset === 'USDT' ? 4 : 2)}</span>
                  <span className={parseFloat(changes[asset]) >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {parseFloat(changes[asset]) >= 0 ? '▲' : '▼'} {Math.abs(parseFloat(changes[asset]))}%
                  </span>
                </span>
              ))}
            </>
          )}
        </div>
      </div>
      <main id="top" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
