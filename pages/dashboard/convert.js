import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../_app';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../lib/supabaseClient';
import Head from 'next/head';
import Link from 'next/link';

export default function Convert() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // ===== State =====
  const [fromCurrency, setFromCurrency] = useState('NGN');
  const [toCurrency, setToCurrency] = useState('USD');
  const [amount, setAmount] = useState('');
  const [ngnRate, setNgnRate] = useState(1550);
  const [result, setResult] = useState(0);
  const [fee, setFee] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [balances, setBalances] = useState({ NGN: 0, USD: 0 });
  const [history, setHistory] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // ===== Fetch Rates & Balances =====
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // 1. Fetch rate (mid-market)
      const response = await fetch('https://api.frankfurter.app/latest?from=NGN');
      const data = await response.json();
      if (data.rates?.USD) {
        // ✅ Apply a small spread (0.5%) to simulate parallel market
        const spread = 0.005; // 0.5% — your profit margin
        const adjustedRate = data.rates.USD * (1 + spread);
        setNgnRate(adjustedRate);
      }

      // 2. Fetch wallet balances
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance, usd_balance')
        .eq('user_id', user.id)
        .single();

      if (wallet) {
        setBalances({
          NGN: wallet.balance || 0,
          USD: wallet.usd_balance || 0,
        });
      }

      // 3. Fetch conversion history
      const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'conversion')
        .order('created_at', { ascending: false })
        .limit(5);

      if (txs) setHistory(txs);
    } catch (e) {
      console.warn('Data fetch failed:', e);
    }
  };

  // ===== Calculate Conversion =====
  useEffect(() => {
    const amt = parseFloat(amount) || 0;
    if (amt <= 0) {
      setResult(0);
      setFee(0);
      return;
    }

    const feeRate = 0.01; // 1% fee
    let rawResult = 0;
    if (fromCurrency === 'NGN' && toCurrency === 'USD') {
      rawResult = amt / ngnRate;
    } else if (fromCurrency === 'USD' && toCurrency === 'NGN') {
      rawResult = amt * ngnRate;
    } else {
      rawResult = amt;
    }

    const feeAmount = rawResult * feeRate;
    setFee(feeAmount);
    setResult(rawResult - feeAmount);
  }, [amount, fromCurrency, toCurrency, ngnRate]);

  // ===== Swap Currencies =====
  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setAmount('');
    setResult(0);
  };

  // ===== Max Button =====
  const handleMax = () => {
    const balance = balances[fromCurrency] || 0;
    setAmount(balance.toFixed(2));
  };

  // ===== Open Confirm Modal =====
  const handleOpenConfirm = (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (amt > balances[fromCurrency]) {
      setError(`Insufficient ${fromCurrency} balance. You have ${fromCurrency}${balances[fromCurrency].toFixed(2)}`);
      return;
    }
    setError('');
    setShowConfirmModal(true);
  };

  // ===== Execute Conversion =====
  const executeConversion = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    setError('');
    setSuccess('');

    const amt = parseFloat(amount);

    try {
      // 1. Debit source currency
      const fromField = fromCurrency === 'USD' ? 'usd_balance' : 'balance';
      const { data: wallet } = await supabase
        .from('wallets')
        .select(fromField)
        .eq('user_id', user.id)
        .single();

      const currentBalance = wallet?.[fromField] || 0;
      const newBalance = currentBalance - amt;

      const { error: debitError } = await supabase
        .from('wallets')
        .update({ [fromField]: newBalance })
        .eq('user_id', user.id);

      if (debitError) throw debitError;

      // 2. Credit destination currency
      const toField = toCurrency === 'USD' ? 'usd_balance' : 'balance';
      const { data: targetWallet } = await supabase
        .from('wallets')
        .select(toField)
        .eq('user_id', user.id)
        .single();

      const currentTarget = targetWallet?.[toField] || 0;
      const newTarget = currentTarget + result;

      await supabase
        .from('wallets')
        .update({ [toField]: newTarget })
        .eq('user_id', user.id);

      // 3. Create transaction record
      await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'conversion',
          amount: result,
          currency: toCurrency,
          status: 'completed',
          fee: fee,
          metadata: {
            from_currency: fromCurrency,
            to_currency: toCurrency,
            from_amount: amt,
            to_amount: result,
            rate: fromCurrency === 'NGN' ? ngnRate : 1 / ngnRate,
          },
        });

      // 4. Update balances
      setBalances(prev => ({
        ...prev,
        [fromCurrency]: newBalance,
        [toCurrency]: newTarget,
      }));

      setSuccess(`✅ Converted ${fromCurrency} ${amt.toFixed(2)} to ${toCurrency} ${result.toFixed(2)}`);
      setAmount('');
      setResult(0);

      // Refresh history
      const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'conversion')
        .order('created_at', { ascending: false })
        .limit(5);
      if (txs) setHistory(txs);

    } catch (err) {
      setError('Conversion failed. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const symbol = { NGN: '₦', USD: '$' };
  const flag = { NGN: '🇳🇬', USD: '🇺🇸' };
  const rate = fromCurrency === 'NGN' ? ngnRate : 1 / ngnRate;
  const fromBalance = balances[fromCurrency] || 0;

  if (loading) return <div>Loading...</div>;
  if (!user) {
    router.push('/auth/login');
    return null;
  }

  return (
    <>
      <Head><title>Convert · KJ Exchange</title></Head>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            <Link href="/dashboard/wallet" className="text-text-muted hover:text-text-primary transition group">
              <i className="fa-solid fa-arrow-left text-sm group-hover:-translate-x-1 transition-transform"></i>
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <i className="fa-solid fa-arrow-right-arrow-left text-orange"></i>
              Convert Currency
            </h1>
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-orange/10 text-orange border border-orange/20">
              NGN ↔ USD
            </span>
          </div>

          {/* Main Card */}
          <div className="glass rounded-2xl p-6 md:p-8 border border-border">
            <form onSubmit={handleOpenConfirm} className="space-y-6">
              {/* Currency Selection + Swap */}
              <div className="relative">
                <div className="grid grid-cols-5 gap-2 items-center">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">From</label>
                    <div className="relative">
                      <select
                        value={fromCurrency}
                        onChange={(e) => {
                          setFromCurrency(e.target.value);
                          setToCurrency(e.target.value === 'NGN' ? 'USD' : 'NGN');
                          setAmount('');
                        }}
                        className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 pl-12 text-text-primary focus:border-orange focus:outline-none appearance-none"
                      >
                        <option value="NGN">🇳🇬 NGN (₦)</option>
                        <option value="USD">🇺🇸 USD ($)</option>
                      </select>
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">
                        {flag[fromCurrency]}
                      </span>
                    </div>
                    <p className="text-text-muted text-xs mt-1">
                      Balance: {symbol[fromCurrency]}{fromBalance.toLocaleString()}
                    </p>
                  </div>

                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={swapCurrencies}
                      className="w-12 h-12 rounded-full bg-orange/10 hover:bg-orange/20 text-orange text-xl transition flex items-center justify-center hover:scale-110"
                    >
                      <i className="fa-solid fa-arrow-right-arrow-left"></i>
                    </button>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">To</label>
                    <div className="relative">
                      <select
                        value={toCurrency}
                        onChange={(e) => setToCurrency(e.target.value)}
                        className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 pl-12 text-text-primary focus:border-orange focus:outline-none appearance-none"
                      >
                        <option value="USD">🇺🇸 USD ($)</option>
                        <option value="NGN">🇳🇬 NGN (₦)</option>
                      </select>
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">
                        {flag[toCurrency]}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount + Max */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Amount ({fromCurrency})
                </label>
                <div className="relative flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-sm font-semibold">
                      {symbol[fromCurrency]}
                    </span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-black/40 border border-border rounded-xl pl-10 pr-4 py-3.5 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 text-lg"
                      placeholder="0.00"
                      required
                      min="1"
                      step="any"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleMax}
                    className="px-4 py-2 bg-orange/10 hover:bg-orange/20 text-orange rounded-xl text-sm font-semibold transition whitespace-nowrap"
                  >
                    Max
                  </button>
                </div>
                <p className="text-text-muted text-xs mt-1.5">
                  1 {fromCurrency} ≈ {rate.toFixed(4)} {toCurrency}
                </p>
              </div>

              {/* Fee Breakdown */}
              {result > 0 && (
                <div className="bg-black/20 rounded-xl p-4 border border-border space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Rate</span>
                    <span>1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}</span>
                  </div>
                  <div className="flex justify-between text-sm text-text-muted">
                    <span>Fee (1%)</span>
                    <span className="text-orange">- {symbol[toCurrency]}{fee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg border-t border-border pt-2">
                    <span className="text-text-muted">You'll receive</span>
                    <span className="text-green-400 font-extrabold">{symbol[toCurrency]}{result.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-400/10 border border-red-400/20 rounded-xl p-3 text-red-400 text-sm flex items-center gap-2">
                  <i className="fa-solid fa-circle-exclamation"></i>
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="bg-green-400/10 border border-green-400/20 rounded-xl p-3 text-green-400 text-sm flex items-center gap-2">
                  <i className="fa-regular fa-circle-check"></i>
                  <span>{success}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || result <= 0}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3.5 rounded-xl hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50 shadow-lg shadow-orange/20 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><i className="fa-solid fa-spinner fa-spin"></i> Processing...</>
                ) : (
                  <><i className="fa-solid fa-arrow-right-arrow-left"></i> Review & Convert</>
                )}
              </button>

              <p className="text-center text-text-muted text-xs flex items-center justify-center gap-2">
                <i className="fa-solid fa-lock text-green-400"></i>
                Secure &amp; Transparent
              </p>
            </form>
          </div>

          {/* ===== Conversion History ===== */}
          <div className="glass rounded-2xl p-6 border border-border mt-6">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <i className="fa-solid fa-clock-rotate-left text-orange"></i>
              Conversion History
            </h2>
            {history.length === 0 ? (
              <div className="text-center py-6 text-text-muted">
                <i className="fa-regular fa-clock text-4xl block mb-2 opacity-40"></i>
                <p className="text-sm">No conversions yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((tx) => {
                  const meta = tx.metadata || {};
                  const fromSym = meta.from_currency || 'NGN';
                  const toSym = meta.to_currency || 'USD';
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-border"
                    >
                      <div>
                        <p className="font-medium text-sm flex items-center gap-1">
                          <span className="text-orange">{fromSym}</span>
                          <i className="fa-solid fa-arrow-right text-text-muted text-xs"></i>
                          <span className="text-green-400">{toSym}</span>
                        </p>
                        <p className="text-text-muted text-xs">
                          {new Date(tx.created_at).toLocaleDateString()} • {new Date(tx.created_at).toLocaleTimeString()}
                          {tx.fee > 0 && ` • Fee: ${symbol[toSym]}${tx.fee.toFixed(2)}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-400">
                          +{symbol[toSym]}{Math.abs(tx.amount).toFixed(2)}
                        </p>
                        <p className="text-text-muted text-xs">
                          Rate: {meta.rate?.toFixed(4) || '—'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>

      {/* ===== Confirmation Modal ===== */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-2xl max-w-md w-full p-6 border border-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Confirm Conversion</h2>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-text-muted hover:text-text-primary transition text-xl"
              >
                <i className="fa-regular fa-xmark"></i>
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">From</span>
                <span className="font-medium">{flag[fromCurrency]} {fromCurrency} {symbol[fromCurrency]}{parseFloat(amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">To</span>
                <span className="font-medium text-green-400">{flag[toCurrency]} {toCurrency} {symbol[toCurrency]}{result.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Rate</span>
                <span className="font-medium">1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Fee (1%)</span>
                <span className="text-orange">- {symbol[toCurrency]}{fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3 font-bold">
                <span className="text-text-muted">New {toCurrency} balance</span>
                <span className="text-green-400">{symbol[toCurrency]}{(balances[toCurrency] + result).toFixed(2)}</span>
              </div>

              <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-3 text-yellow-400 text-xs flex items-start gap-2">
                <i className="fa-solid fa-triangle-exclamation mt-0.5"></i>
                <span>This action is irreversible. Please confirm the details before proceeding.</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 border border-border text-text-primary px-4 py-2.5 rounded-xl hover:border-orange transition"
              >
                Cancel
              </button>
              <button
                onClick={executeConversion}
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-2.5 rounded-xl hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><i className="fa-solid fa-spinner fa-spin"></i> Processing...</>
                ) : (
                  <><i className="fa-regular fa-check-circle"></i> Confirm</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
