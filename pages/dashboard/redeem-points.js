import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../_app';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../lib/supabaseClient';
import Head from 'next/head';
import Link from 'next/link';

export default function RedeemPoints() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [points, setPoints] = useState(0);
  const [amount, setAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('NGN');
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [exchangeRates, setExchangeRates] = useState({ USD: 1500, GHS: 120 });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }
    if (user) {
      fetchPoints();
      fetchRates();
    }
  }, [user, loading]);

  const fetchPoints = async () => {
    try {
      const { data, error } = await supabase
        .from('gift_point_transactions')
        .select('amount')
        .eq('user_id', user.id);

      if (error) throw error;
      const total = data?.reduce((sum, t) => sum + t.amount, 0) || 0;
      setPoints(total);
    } catch (err) {
      console.error('Error fetching points:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchRates = async () => {
    try {
      const res = await fetch('https://api.exchangerate-api.com/v4/latest/NGN');
      const data = await res.json();
      if (data.rates) {
        setExchangeRates({
          USD: data.rates.USD || 1500,
          GHS: data.rates.GHS || 120,
        });
      }
    } catch (error) {
      console.error('Error fetching rates:', error);
    }
  };

  const getNairaEquivalent = (pointsAmount) => {
    return pointsAmount / 10; // 10 points = ₦1
  };

  const getConvertedPayout = (pointsAmount) => {
    const ngnValue = getNairaEquivalent(pointsAmount);
    switch (payoutMethod) {
      case 'USD':
        return ngnValue / exchangeRates.USD;
      case 'GHS':
        return ngnValue / exchangeRates.GHS;
      default:
        return ngnValue;
    }
  };

  const getCurrencySymbol = () => {
    switch (payoutMethod) {
      case 'USD': return '$';
      case 'GHS': return '₵';
      default: return '₦';
    }
  };

  const handleRedeem = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    const pointsToRedeem = parseInt(amount);
    if (!pointsToRedeem || pointsToRedeem <= 0) {
      setError('Enter a valid amount of points');
      setSubmitting(false);
      return;
    }

    if (pointsToRedeem < 10000) {
      setError('Minimum redemption is 10,000 points');
      setSubmitting(false);
      return;
    }

    if (pointsToRedeem > points) {
      setError('You don\'t have enough points');
      setSubmitting(false);
      return;
    }

    const ngnValue = getNairaEquivalent(pointsToRedeem);
    const payoutValue = getConvertedPayout(pointsToRedeem);

    try {
      // 1. Deduct points
      const { error: deductError } = await supabase
        .from('gift_point_transactions')
        .insert({
          user_id: user.id,
          amount: -pointsToRedeem,
          type: 'redemption',
          metadata: {
            payout_method: payoutMethod,
            ngn_value: ngnValue,
            payout_value: payoutValue,
          },
        });

      if (deductError) throw deductError;

      // 2. Credit user's wallet
      const field = payoutMethod === 'USD' ? 'usd_balance' : payoutMethod === 'GHS' ? 'ghs_balance' : 'balance';
      const { data: wallet } = await supabase
        .from('wallets')
        .select(field)
        .eq('user_id', user.id)
        .single();

      const newBalance = (wallet?.[field] || 0) + ngnValue;
      await supabase
        .from('wallets')
        .update({ [field]: newBalance })
        .eq('user_id', user.id);

      // 3. Transaction record
      await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'gift_point_redemption',
          amount: ngnValue,
          currency: payoutMethod,
          status: 'completed',
          metadata: {
            points_redeemed: pointsToRedeem,
            rate: '10 points = ₦1',
          },
        });

      // 4. Notification
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          message: `🎁 Redeemed ${pointsToRedeem} points for ${getCurrencySymbol()}${payoutValue.toFixed(2)}`,
        });

      setSuccess(`✅ Successfully redeemed ${pointsToRedeem.toLocaleString()} points for ${getCurrencySymbol()}${payoutValue.toFixed(2)}`);
      setAmount('');
      fetchPoints();
    } catch (err) {
      setError('Failed to redeem points. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || loadingData) return <div>Loading...</div>;
  if (!user) return null;

  const pointsToRedeem = parseInt(amount) || 0;
  const payoutValue = getConvertedPayout(pointsToRedeem);
  const isValid = pointsToRedeem >= 10000 && pointsToRedeem <= points;

  return (
    <>
      <Head>
        <title>Redeem Points · KJ Exchange</title>
      </Head>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 mb-6">
            <Link href="/dashboard" className="text-text-muted hover:text-text-primary transition group">
              <i className="fa-solid fa-arrow-left text-sm group-hover:-translate-x-1 transition-transform"></i>
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <i className="fa-solid fa-gift text-orange"></i>
              Redeem Points
            </h1>
          </div>

          <div className="glass rounded-2xl p-6 border border-border space-y-6">
            {/* Points Balance */}
            <div className="bg-black/20 rounded-xl p-4 border border-border text-center">
              <p className="text-text-muted text-sm">Points Balance</p>
              <p className="text-3xl font-bold text-orange">{points.toLocaleString()}</p>
            </div>

            {/* Redemption Rate */}
            <div className="bg-black/20 rounded-xl p-4 border border-border text-center">
              <p className="text-text-muted text-sm">Redemption Rate</p>
              <p className="text-lg font-semibold">10 points = ₦1</p>
              <p className="text-xs text-text-muted mt-1">Minimum redemption: 10,000 points (₦1,000)</p>
            </div>

            {/* Payout Method */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Payout Method</label>
              <div className="flex gap-2 flex-wrap">
                {['NGN', 'USD', 'GHS'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPayoutMethod(method)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                      payoutMethod === method
                        ? 'bg-orange text-white shadow-lg shadow-orange/20'
                        : 'bg-black/20 border border-border text-text-muted hover:border-orange/50'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            <form onSubmit={handleRedeem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Points to Redeem
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-black/40 border border-border rounded-xl px-5 py-4 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 text-2xl font-bold"
                    placeholder="0"
                    min="10000"
                    step="100"
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted text-sm font-semibold">Points</div>
                </div>
                {pointsToRedeem > 0 && (
                  <p className="text-text-muted text-sm mt-2">
                    You receive: <span className="text-green-400 font-bold">{getCurrencySymbol()}{payoutValue.toFixed(2)}</span>
                  </p>
                )}
                {pointsToRedeem > 0 && pointsToRedeem < 10000 && (
                  <p className="text-red-400 text-xs mt-1">Minimum redemption is 10,000 points</p>
                )}
                {pointsToRedeem > points && (
                  <p className="text-red-400 text-xs mt-1">You only have {points.toLocaleString()} points</p>
                )}
                <div className="flex gap-2 mt-3 flex-wrap">
                  {[10000, 25000, 50000, 100000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset.toString())}
                      className="px-4 py-1.5 rounded-full text-xs font-medium transition border border-border hover:border-orange/50 hover:text-orange"
                    >
                      {preset.toLocaleString()}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAmount(points.toString())}
                    className="px-4 py-1.5 rounded-full text-xs font-medium transition border border-orange/30 text-orange hover:bg-orange/10"
                  >
                    All Points
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-400/10 border border-red-400/20 rounded-xl p-3 text-red-400 text-sm flex items-start gap-2">
                  <i className="fa-solid fa-circle-exclamation mt-0.5"></i>
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="bg-green-400/10 border border-green-400/20 rounded-xl p-3 text-green-400 text-sm flex items-start gap-2">
                  <i className="fa-regular fa-circle-check mt-0.5"></i>
                  <span>{success}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !isValid}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-4 rounded-xl hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-orange/20"
              >
                {submitting ? (
                  <><i className="fa-solid fa-spinner fa-spin"></i> Processing...</>
                ) : (
                  <><i className="fa-solid fa-gift"></i> Redeem Now</>
                )}
              </button>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
