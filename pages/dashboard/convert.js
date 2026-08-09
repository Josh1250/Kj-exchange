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

  const [fromCurrency, setFromCurrency] = useState('NGN');
  const [toCurrency, setToCurrency] = useState('USD');
  const [amount, setAmount] = useState('');
  const [ngnRate, setNgnRate] = useState(1389);
  const [result, setResult] = useState(0);
  const [fee, setFee] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [balances, setBalances] = useState({ NGN: 0, USD: 0 });
  const [history, setHistory] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const SPREAD = 0.015;

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      let ngn = 1389;
      try {
        const res = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=NGN');
        const data = await res.json();
        if (data.rates?.NGN) ngn = data.rates.NGN;
      } catch (e) {
        try {
          const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=NGN');
          const data = await res.json();
          if (data.rates?.NGN) ngn = data.rates.NGN;
        } catch (e2) {}
      }
      setNgnRate(ngn);

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

      // ✅ Fetch conversion history — use 'conversion' as type
      const { data: txs, error: txsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'conversion')
        .order('created_at', { ascending: false })
        .limit(5);

      if (txsError) {
        console.error('Error fetching history:', txsError);
      } else {
        setHistory(txs || []);
        console.log('✅ History loaded:', txs?.length || 0, 'items');
      }
    } catch (e) {
      console.warn('Data fetch failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate conversion
  useEffect(() => {
    const amt = parseFloat(amount) || 0;
    if (amt <= 0) {
      setResult(0);
      setFee(0);
      return;
    }

    let effectiveRate = 0;
    let rawResult = 0;

    if (fromCurrency === 'NGN' && toCurrency === 'USD') {
      effectiveRate = ngnRate * (1 + SPREAD);
      rawResult = amt / effectiveRate;
    } else if (fromCurrency === 'USD' && toCurrency === 'NGN') {
      effectiveRate = ngnRate * (1 - SPREAD);
      rawResult = amt * effectiveRate;
    } else {
      rawResult = amt;
    }

    const feeRate = 0.01;
    const feeAmount = rawResult * feeRate;
    setFee(feeAmount);
    setResult(Math.max(0, rawResult - feeAmount));
  }, [amount, fromCurrency, toCurrency, ngnRate]);

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setAmount('');
    setResult(0);
  };

  const handleMax = () => {
    const balance = balances[fromCurrency] || 0;
    setAmount(balance.toFixed(2));
  };

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

  const executeConversion = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    setError('');
    setSuccess('');

    const amt = parseFloat(amount);

    try {
      // 1. Debit source
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

      // 2. Credit destination
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

      // 3. Create transaction record — ✅ FIX: Use type 'conversion'
      const effectiveRate = fromCurrency === 'NGN' 
        ? ngnRate * (1 + SPREAD) 
        : ngnRate * (1 - SPREAD);

      const insertData = {
        user_id: user.id,
        type: 'conversion', // ✅ MUST be 'conversion'
        amount: result,
        currency: toCurrency,
        status: 'completed',
        fee: fee,
        metadata: {
          from_currency: fromCurrency,
          to_currency: toCurrency,
          from_amount: amt,
          to_amount: result,
          rate: effectiveRate,
          spread_used: SPREAD,
        },
      };

      console.log('📝 Inserting transaction:', insertData);

      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .insert(insertData)
        .select();

      if (txError) {
        console.error('❌ Transaction insert error:', txError);
      } else {
        console.log('✅ Transaction created:', txData);
      }

      // 4. Credit business wallet (profit)
      let profitInNGN = 0;
      if (fromCurrency === 'NGN' && toCurrency === 'USD') {
        profitInNGN = amt * SPREAD;
      } else if (fromCurrency === 'USD' && toCurrency === 'NGN') {
        const effectiveRateNGN = ngnRate * (1 - SPREAD);
        profitInNGN = amt * effectiveRateNGN * SPREAD;
      }
      const feeInNGN = fee * ngnRate;
      const totalProfit = profitInNGN + feeInNGN;

      if (totalProfit > 0) {
        const { data: bizWallet, error: bizError } = await supabase
          .from('business_wallets')
          .select('balance')
          .eq('currency', 'NGN')
          .single();

        if (!bizError && bizWallet) {
          const newBizBalance = (bizWallet.balance || 0) + totalProfit;
          await supabase
            .from('business_wallets')
            .update({ balance: newBizBalance })
            .eq('currency', 'NGN');
        }
      }

      // 5. Update local balances
      setBalances(prev => ({
        ...prev,
        [fromCurrency]: newBalance,
        [toCurrency]: newTarget,
      }));

      setSuccess(`✅ Converted ${fromCurrency} ${amt.toFixed(2)} to ${toCurrency} ${result.toFixed(2)}`);
      setAmount('');
      setResult(0);

      // ✅ Refresh history immediately
      const { data: txs, error: txsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'conversion')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!txsError) {
        setHistory(txs || []);
        console.log('✅ History refreshed:', txs?.length || 0, 'items');
      } else {
        console.error('❌ Error refreshing history:', txsError);
      }

    } catch (err) {
      setError('Conversion failed. Please try again.');
      console.error('❌ Conversion error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const symbol = { NGN: '₦', USD: '$' };
  const flag = { NGN: '🇳🇬', USD: '🇺🇸' };
  const effectiveRate = fromCurrency === 'NGN' 
    ? ngnRate * (1 + SPREAD) 
    : ngnRate * (1 - SPREAD);
  const fromBalance = balances[fromCurrency] || 0;

  if (loading) return <div>Loading...</div>;
  if (!user) {
    router.push('/auth/login');
    return null;
  }

  return (
    <>
      <Head><title>Convert & Save · KJ Exchange</title></Head>
      <DashboardLayout>
        <div className="max-w-2xl mx-auto px-4 py-4 pb-24">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link href="/dashboard/wallet" className="text-text-muted hover:text-text-primary transition group">
              <i className="fa-solid fa-arrow-left text-sm group-hover:-translate-x-1 transition-transform"></i>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <i className="fa-solid fa-arrow-right-arrow-left text-orange"></i>
                Convert & Save
              </h1>
              <p className="text-text-muted text-sm">Protect your money — convert Naira to USD</p>
            </div>
          </div>

          {/* Why Save in USD Banner */}
          <div className="glass rounded-2xl p-4 border border-orange/20 bg-orange/5 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-orange/10 flex items-center justify-center text-orange text-lg flex-shrink-0">
                <i className="fa-solid fa-shield"></i>
              </div>
              <div>
                <p className="font-semibold text-sm">Why save in USD?</p>
                <p className="text-text-muted text-xs">
                  Protect your savings from Naira devaluation. Convert Naira to USD and hold your value in a stable currency.
                </p>
              </div>
            </div>
          </div>

          {/* Main Card */}
          <div className="glass rounded-2xl p-5 md:p-6 border border-border">
            <form onSubmit={handleOpenConfirm} className="space-y-6">
              {/* Currency Selection + Swap */}
              <div className="relative">
                <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-start">
                  <div>
                    <label className="block text-text-muted text-xs font-medium mb-1.5">From</label>
                    <select
                      value={fromCurrency}
                      onChange={(e) => {
                        setFromCurrency(e.target.value);
                        setToCurrency(e.target.value === 'NGN' ? 'USD' : 'NGN');
                        setAmount('');
                      }}
                      className="w-full bg-black/30 border border-border rounded-xl px-4 py-3.5 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 appearance-none text-base"
                    >
                      <option value="NGN">🇳🇬 NGN (₦)</option>
                      <option value="USD">🇺🇸 USD ($)</option>
                    </select>
                    <p className="text-text-muted text-xs mt-1">
                      Bal: {symbol[fromCurrency]}{fromBalance.toLocaleString()}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={swapCurrencies}
                    className="mt-6 w-12 h-12 rounded-full bg-orange/10 hover:bg-orange/20 text-orange text-xl transition flex items-center justify-center hover:scale-110 flex-shrink-0"
                  >
                    <i className="fa-solid fa-arrow-right-arrow-left"></i>
                  </button>

                  <div>
                    <label className="block text-text-muted text-xs font-medium mb-1.5">To</label>
                    <select
                      value={toCurrency}
                      onChange={(e) => setToCurrency(e.target.value)}
                      className="w-full bg-black/30 border border-border rounded-xl px-4 py-3.5 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 appearance-none text-base"
                    >
                      <option value="USD">🇺🇸 USD ($)</option>
                      <option value="NGN">🇳🇬 NGN (₦)</option>
                    </select>
                    <p className="text-text-muted text-xs mt-1">
                      Bal: {symbol[toCurrency]}{balances[toCurrency]?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Amount + Max */}
              <div>
                <label className="block text-text-muted text-xs font-medium mb-1.5">
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
                      className="w-full bg-black/30 border border-border rounded-xl pl-10 pr-4 py-4 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 text-2xl font-bold placeholder:text-text-muted/50"
                      placeholder="0.00"
                      required
                      min="1"
                      step="any"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleMax}
                    className="px-4 py-2.5 bg-orange/10 hover:bg-orange/20 text-orange rounded-xl text-sm font-semibold transition whitespace-nowrap"
                  >
                    Max
                  </button>
                </div>
                <p className="text-text-muted text-xs mt-1.5">
                  1 {fromCurrency} ≈ {effectiveRate.toFixed(4)} {toCurrency}
                </p>
              </div>

              {/* Rate Breakdown */}
              {result > 0 && (
                <div className="bg-black/20 rounded-xl p-4 border border-border space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Rate</span>
                    <span className="font-medium">1 {fromCurrency} = {effectiveRate.toFixed(4)} {toCurrency}</span>
                  </div>
                  <div className="flex justify-between text-xs text-text-muted">
                    <span>Spread (1.5%)</span>
                    <span>Included in rate</span>
                  </div>
                  <div className="flex justify-between text-sm text-text-muted">
                    <span>Fee (1%)</span>
                    <span className="text-orange">- {symbol[toCurrency]}{fee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg border-t border-border pt-2">
                    <span className="text-text-muted">You'll receive</span>
                    <span className="text-2xl font-bold text-green-400">{symbol[toCurrency]}{result.toFixed(2)}</span>
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
                disabled={submitting || result <= 0 || isLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-4 rounded-xl hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50 shadow-lg shadow-orange/20 flex items-center justify-center gap-2 touch-manipulation"
              >
                {submitting ? (
                  <><i className="fa-solid fa-spinner fa-spin"></i> Processing...</>
                ) : (
                  <><i className="fa-solid fa-arrow-right-arrow-left"></i> Review & Convert</>
                )}
              </button>

              <div className="flex items-center justify-center gap-4 text-text-muted text-xs">
                <span className="flex items-center gap-1"><i className="fa-solid fa-lock text-green-400"></i> Secure</span>
                <span className="flex items-center gap-1"><i className="fa-solid fa-bolt text-orange"></i> Instant</span>
                <span className="flex items-center gap-1"><i className="fa-solid fa-wallet text-green-400"></i> Transparent</span>
              </div>
            </form>
          </div>

          {/* ===== Conversion History ===== */}
          <div className="glass rounded-2xl p-5 border border-border mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
                Conversion History
              </h3>
              {/* ✅ FIX: Link to orders page with conversion filter */}
              <Link href="/dashboard/orders?type=conversion" className="text-sm text-orange hover:underline">
                View All
              </Link>
            </div>
            {isLoading ? (
              <div className="text-center py-6 text-text-muted">
                <i className="fa-solid fa-spinner fa-spin"></i> Loading...
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-6 text-text-muted">
                <i className="fa-regular fa-clock text-4xl block mb-2 opacity-40"></i>
                <p className="text-sm">No conversions yet.</p>
                <p className="text-xs mt-1">Convert your Naira to USD to save.</p>
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
                      <div className="min-w-0 flex-1">
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
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="font-bold text-green-400">
                          +{symbol[toSym]}{Math.abs(tx.amount).toFixed(2)}
                        </p>
                        <p className="text-text-muted text-xs">
                          {meta.rate?.toFixed(2) || '—'}
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

      {/* Confirmation Modal */}
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
                <span className="font-medium">1 {fromCurrency} = {effectiveRate.toFixed(4)} {toCurrency}</span>
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
