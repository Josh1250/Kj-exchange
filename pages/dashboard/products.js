import { useRouter } from 'next/router';
import { useAuth } from '../_app';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Head from 'next/head';
import Link from 'next/link';

export default function Products() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) return <div>Loading...</div>;
  if (!user) {
    router.push('/auth/login');
    return null;
  }

  return (
    <>
      <Head>
        <title>Products · KJ Exchange</title>
      </Head>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
          <div className="flex items-center gap-2 mb-6">
            <Link href="/dashboard" className="text-text-muted hover:text-text-primary transition group">
              <i className="fa-solid fa-arrow-left text-sm group-hover:-translate-x-1 transition-transform"></i>
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <i className="fa-solid fa-box text-orange"></i>
              Products
            </h1>
          </div>

          {/* Products */}
          <div>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <i className="fa-solid fa-bag-shopping text-orange"></i>
              Products
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link href="/dashboard/sell-gift-card" className="glass rounded-xl p-4 text-center hover:border-orange transition border border-border group">
                <div className="w-10 h-10 mx-auto rounded-full bg-orange/10 flex items-center justify-center text-orange text-xl group-hover:scale-110 transition">
                  <i className="fa-solid fa-gift"></i>
                </div>
                <p className="text-sm font-semibold mt-2">Sell Gift Card</p>
              </Link>
              <div className="glass rounded-xl p-4 text-center border border-border opacity-60 relative">
                <div className="w-10 h-10 mx-auto rounded-full bg-orange/10 flex items-center justify-center text-text-muted text-xl">
                  <i className="fa-solid fa-gift"></i>
                </div>
                <p className="text-sm font-semibold mt-2">Buy Gift Card</p>
                <span className="text-[10px] text-orange">Soon</span>
                <div className="absolute top-2 right-2 text-text-muted text-xs">
                  <i className="fa-solid fa-lock"></i>
                </div>
              </div>
              <Link href="/dashboard/sell" className="glass rounded-xl p-4 text-center hover:border-orange transition border border-border group">
                <div className="w-10 h-10 mx-auto rounded-full bg-orange/10 flex items-center justify-center text-orange text-xl group-hover:scale-110 transition">
                  <i className="fa-brands fa-bitcoin"></i>
                </div>
                <p className="text-sm font-semibold mt-2">Sell Crypto</p>
              </Link>
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
          </div>

          {/* Bills */}
          <div>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <i className="fa-solid fa-file-invoice text-orange"></i>
              Bills
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Buy Airtime', icon: 'fa-phone', soon: false },
                { label: 'Sell Airtime', icon: 'fa-phone', soon: true },
                { label: 'Cheap Airtime', icon: 'fa-tags', soon: true },
                { label: 'Buy Data', icon: 'fa-wifi', soon: true },
                { label: 'Pay Cable TV', icon: 'fa-tv', soon: true },
                { label: 'Buy Electricity', icon: 'fa-bolt', soon: true },
                { label: 'Fund Betting', icon: 'fa-dice', soon: true },
              ].map((item) => (
                <div key={item.label} className={`glass rounded-xl p-4 text-center border border-border ${item.soon ? 'opacity-60' : 'hover:border-orange transition group'} relative`}>
                  <div className="w-10 h-10 mx-auto rounded-full bg-orange/10 flex items-center justify-center text-orange text-xl">
                    <i className={`fa-solid ${item.icon}`}></i>
                  </div>
                  <p className="text-sm font-semibold mt-2">{item.label}</p>
                  {item.soon && (
                    <>
                      <span className="text-[10px] text-orange">Soon</span>
                      <div className="absolute top-2 right-2 text-text-muted text-xs">
                        <i className="fa-solid fa-lock"></i>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Others */}
          <div>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <i className="fa-solid fa-ellipsis-h text-orange"></i>
              Others
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Link href="/dashboard/rate-calculator" className="glass rounded-xl p-4 text-center hover:border-orange transition border border-border group opacity-60 relative">
                <div className="w-10 h-10 mx-auto rounded-full bg-orange/10 flex items-center justify-center text-text-muted text-xl">
                  <i className="fa-solid fa-calculator"></i>
                </div>
                <p className="text-sm font-semibold mt-2">Rate Calculator</p>
                <span className="text-[10px] text-orange">Soon</span>
                <div className="absolute top-2 right-2 text-text-muted text-xs">
                  <i className="fa-solid fa-lock"></i>
                </div>
              </Link>
              <Link href="/dashboard/crypto-status" className="glass rounded-xl p-4 text-center hover:border-orange transition border border-border group opacity-60 relative">
                <div className="w-10 h-10 mx-auto rounded-full bg-orange/10 flex items-center justify-center text-text-muted text-xl">
                  <i className="fa-solid fa-circle-check"></i>
                </div>
                <p className="text-sm font-semibold mt-2">Crypto Status</p>
                <span className="text-[10px] text-orange">Soon</span>
                <div className="absolute top-2 right-2 text-text-muted text-xs">
                  <i className="fa-solid fa-lock"></i>
                </div>
              </Link>
              <Link href="/dashboard/markets" className="glass rounded-xl p-4 text-center hover:border-orange transition border border-border group opacity-60 relative">
                <div className="w-10 h-10 mx-auto rounded-full bg-orange/10 flex items-center justify-center text-text-muted text-xl">
                  <i className="fa-solid fa-chart-line"></i>
                </div>
                <p className="text-sm font-semibold mt-2">Crypto Markets</p>
                <span className="text-[10px] text-orange">Soon</span>
                <div className="absolute top-2 right-2 text-text-muted text-xs">
                  <i className="fa-solid fa-lock"></i>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
