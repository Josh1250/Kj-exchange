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

      // 🔍 Fetch conversion history
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

      // 3. Create transaction record
      const effectiveRate = fromCurrency === 'NGN' 
        ? ngnRate * (1 + SPREAD) 
        : ngnRate * (1 - SPREAD);

      const { data: txData, error: txError } = await supabase
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
            rate: effectiveRate,
            spread_used: SPREAD,
          },
        })
        .select();

      if (txError) {
        console.error('Transaction insert error:', txError);
        // Continue anyway — the conversion already happened
      } else {
        console.log('Transaction created:', txData);
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

      // 🔄 Refresh history immediately
      const { data: txs, error: txsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'conversion')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!txsError) {
        setHistory(txs || []);
        console.log('History refreshed:', txs?.length || 0, 'items');
      } else {
        console.error('Error refreshing history:', txsError);
      }

    } catch (err) {
      setError('Conversion failed. Please try again.');
      console.error(err);
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
          {/* Header and rest of UI (same as before) */}

          {/* ... existing UI ... */}

          {/* Conversion History */}
          <div className="glass rounded-2xl p-5 border border-border mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
                Conversion History
              </h3>
              <Link href="/dashboard/orders" className="text-sm text-orange hover:underline">
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

      {/* Confirmation Modal (same as before) */}
    </>
  );
}
