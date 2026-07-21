import DashboardLayout from '../../components/layout/DashboardLayout';
import Head from 'next/head';
import Link from 'next/link';

const products = [
  { name: 'Gift Cards', icon: 'fa-solid fa-gift', href: '/dashboard/sell-gift-card', active: true },
  { name: 'Crypto', icon: 'fa-brands fa-bitcoin', href: '/dashboard/sell-crypto', active: true },
  { name: 'eSIM', icon: 'fa-solid fa-sim-card', href: '#', active: false },
  { name: 'Bills', icon: 'fa-solid fa-file-invoice', href: '#', active: false },
];

export default function Products() {
  return (
    <>
      <Head><title>Products · KJ Exchange</title></Head>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Products</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.map((product, idx) => (
              <Link
                key={idx}
                href={product.href}
                className={`bg-bg-card rounded-2xl p-6 border border-border transition hover:border-orange hover:-translate-y-1 ${!product.active ? 'opacity-60 cursor-not-allowed' : ''}`}
                onClick={(e) => !product.active && e.preventDefault()}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange/10 flex items-center justify-center text-orange text-2xl">
                    <i className={product.icon}></i>
                  </div>
                  <div>
                    <p className="font-semibold">{product.name}</p>
                    {!product.active ? (
                      <span className="text-xs text-orange">Coming Soon</span>
                    ) : (
                      <span className="text-xs text-green-400">Active</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
