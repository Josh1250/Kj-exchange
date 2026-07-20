import Link from 'next/link';
import Layout from '../components/layout/Layout';
import RateCalculator from '../components/calculator/RateCalculator';

export default function Home() {
  return (
    <Layout>
      <section className="pt-20 pb-16 px-4 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-block bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-full text-sm font-semibold mb-4">
            <i className="fas fa-check-circle mr-1"></i> 0% Fees — No Hidden Charges
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
            Sell Crypto & <br />
            <span className="text-purple-light">Gift Cards</span><br />
            With <span className="text-orange">Confidence</span>
          </h1>
          <p className="text-text-muted text-lg mt-4 max-w-md">
            Sell your crypto & gift cards instantly. <strong className="text-green-400">0% fees</strong>. No delays. Just the best rate.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/auth/signup" className="bg-orange text-white px-8 py-3 rounded-full font-bold hover:bg-orange-light transition shadow-orange shadow-lg flex items-center gap-2">
              <i className="fas fa-rocket"></i> Get Started
            </Link>
            <Link href="#assets" className="border border-border text-text-primary px-8 py-3 rounded-full font-semibold hover:border-orange transition">
              View Supported Assets
            </Link>
          </div>
          <div className="mt-10 flex gap-8 border-t border-border pt-8">
            <div><span className="text-2xl font-bold">500+</span><div className="text-text-muted text-sm">Customers</div></div>
            <div><span className="text-2xl font-bold">2022</span><div className="text-text-muted text-sm">Established</div></div>
            <div><span className="text-2xl font-bold text-green-400">0%</span><div className="text-text-muted text-sm">Fees</div></div>
          </div>
        </div>
        <div>
          <RateCalculator />
        </div>
      </section>
      {/* Other sections (services, why choose, how it works, FAQ) can be added here later */}
    </Layout>
  );
}
