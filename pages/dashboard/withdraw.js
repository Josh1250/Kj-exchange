import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../_app';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../lib/supabaseClient';
import Head from 'next/head';
import Link from 'next/link';

export default function Withdraw() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { currency = 'NGN' } = router.query;

  // ===== State =====
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [selectedBankId, setSelectedBankId] = useState('');
  const [banks, setBanks] = useState([]);
  const [kycLevel, setKycLevel] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);

  // ===== Fee Calculation =====
  const [fee, setFee] = useState(0);
  const [vat, setVat] = useState(0);
  const [totalDeduction, setTotalDeduction] = useState(0);

  // ===== Load Data =====
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }
    if (user) {
      fetchData();
    }
  }, [user, loading, router, currency]);

  // ===== Recalculate fee whenever amount changes =====
  useEffect(() => {
    calculateFees();
  }, [amount, currency]);

  const fetchData = async () => {
    try {
      const field = currency === 'USD' ? 'usd_balance' : currency === 'GHS' ? 'ghs_balance' : 'balance';
      const { data: wallet } = await supabase
        .from('wallets')
        .select(field)
        .eq('user_id', user.id)
        .maybeSingle();
      setBalance(wallet?.[field] || 0);

      const { data: profile } = await supabase
        .from('users')
        .select('kyc_level')
        .eq('id', user.id)
        .single();
      setKycLevel(profile?.kyc_level || 1);

      const { data: bankData } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });
      setBanks(bankData || []);

      const defaultBank = bankData?.find(b => b.is_default);
      if (defaultBank) setSelectedBankId(defaultBank.id);

      const { data: history } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'withdrawal')
        .order('created_at', { ascending: false })
        .limit(5);
      setWithdrawalHistory(history || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  // ===== Calculate Fees =====
  const calculateFees = () => {
    const amt = parseFloat(amount) || 0;
    if (amt <= 0) {
      setFee(0);
      setVat(0);
      setTotalDeduction(0);
      return;
    }

    let calculatedFee = 0;
    let calculatedVat = 0;

    // Only apply fees for NGN withdrawals (can extend to other currencies later)
    if (currency === 'NGN') {
      const flatFee = 50; // ₦50 flat fee
      const percentageFee = 0.005; // 0.5%
      const vatRate = 0.075; // 7.5% VAT on fee

      calculatedFee = flatFee + (amt * percentageFee);
      calculatedFee = Math.round(calculatedFee * 100) / 100; // Round to 2 decimal places
      calculatedVat = calculatedFee * vatRate;
      calculatedVat = Math.round(calculatedVat * 100) / 100;
    }

    setFee(calculatedFee);
    setVat(calculatedVat);
    setTotalDeduction(amt + calculatedFee + calculatedVat);
  };

  // ===== Get Selected Bank =====
  const getSelectedBank = () => {
    return banks.find(b => b.id === selectedBankId);
  };

  // ===== Withdraw =====
  const handleWithdraw = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setError('Enter a valid amount');
      setSubmitting(false);
      return;
    }

    if (totalDeduction > balance) {
      setError(`Insufficient balance. Total deduction: ${currencySymbol}${totalDeduction.toFixed(2)}`);
      setSubmitting(false);
      return;
    }

    const selectedBank = getSelectedBank();
    if (!selectedBank) {
      setError('Please select a bank account');
      setSubmitting(false);
      return;
    }

    if (kycLevel < 2 && amt > 50000) {
      setError('KYC Level 2 required for withdrawals above ₦50,000. Complete KYC in your profile.');
      setSubmitting(false);
      return;
    }

    const isAuto = kycLevel >= 2;
    const status = isAuto ? 'processing' : 'pending';
    const withdrawalType = isAuto ? 'auto' : 'manual';

    try {
      // 1. Create transaction with fee and VAT
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'withdrawal',
          amount: -amt,
          fee: fee,
          vat: vat,
          status: status,
          currency: currency,
          metadata: {
            bank_name: selectedBank.bank_name,
            account_number: selectedBank.account_number,
            account_name: selectedBank.account_name,
            bank_code: selectedBank.bank_code,
          },
          withdrawal_type: withdrawalType,
        })
        .select()
        .single();

      if (txError) throw new Error(txError.message);

      // 2. Deduct total (amount + fee + VAT) from wallet
      const field = currency === 'USD' ? 'usd_balance' : currency === 'GHS' ? 'ghs_balance' : 'balance';
      const { data: wallet } = await supabase
        .from('wallets')
        .select(field)
        .eq('user_id', user.id)
        .maybeSingle();

      const newBalance = (wallet?.[field] || 0) - totalDeduction;
      await supabase
        .from('wallets')
        .update({ [field]: newBalance })
        .eq('user_id', user.id);

      // 3. If auto withdrawal – trigger Flutterwave transfer
      if (isAuto) {
        try {
          const transferResponse = await fetch('/api/flutterwave/transfer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: amt, // Send net amount (fees already deducted from wallet)
              currency: currency,
              bank_code: selectedBank.bank_code,
              account_number: selectedBank.account_number,
              account_name: selectedBank.account_name,
              reference: `withdraw_${txData.id}`,
            }),
          });

          const transferData = await transferResponse.json();

          if (transferData.status === 'success') {
            await supabase
              .from('transactions')
              .update({
                status: 'completed',
                processed_at: new Date().toISOString(),
              })
              .eq('id', txData.id);

            setSuccess(`✅ Withdrawal of ${currency} ${amt.toLocaleString()} processed instantly! (Fee: ${currencySymbol}${fee.toFixed(2)}, VAT: ${currencySymbol}${vat.toFixed(2)})`);

            await supabase
              .from('notifications')
              .insert({
                user_id: user.id,
                message: `💸 Instant withdrawal of ${currency} ${amt.toLocaleString()} sent to your bank. Fee: ${currencySymbol}${fee.toFixed(2)}, VAT: ${currencySymbol}${vat.toFixed(2)}`,
              });
          } else {
            setSuccess(`⚠️ Withdrawal recorded but bank transfer failed. Our team will review it.`);
          }
        } catch (transferErr) {
          console.error('Transfer error:', transferErr);
          setSuccess(`⚠️ Withdrawal recorded but bank transfer is pending. Our team will process it shortly.`);
        }
      } else {
        setSuccess(`✅ Withdrawal of ${currency} ${amt.toLocaleString()} initiated for review. (Fee: ${currencySymbol}${fee.toFixed(2)}, VAT: ${currencySymbol}${vat.toFixed(2)})`);

        await supabase
          .from('notifications')
          .insert({
            user_id: user.id,
            message: `💸 Withdrawal of ${currency} ${amt.toLocaleString()} submitted for review. Fee: ${currencySymbol}${fee.toFixed(2)}, VAT: ${currencySymbol}${vat.toFixed(2)}`,
          });
      }

      setAmount('');
      setBalance(newBalance);
      fetchData();

    } catch (err) {
      console.error('Withdrawal error:', err);
      setError('❌ Failed to process withdrawal: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ===== Processing Time =====
  const getProcessingTime = () => {
    if (kycLevel >= 2) {
      return {
        label: '⚡ Instant Processing',
        color: 'text-green-400',
        bg: 'bg-green-400/10',
        icon: 'fa-bolt',
      };
    }
    return {
      label: '⏳ 24-Hour Processing',
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
      icon: 'fa-clock',
    };
  };

  const processingInfo = getProcessingTime();

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  const currencySymbol = { NGN: '₦', USD: '$', GHS: '₵' }[currency] || '₦';

  return (
    <>
      <Head><title>Withdraw · KJ Exchange</title></Head>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-2">
            <Link href="/dashboard/wallet" className="text-text-muted hover:text-text-primary transition group">
              <i className="fa-solid fa-arrow-left text-sm group-hover:-translate-x-1 transition-transform"></i>
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <i className="fa-solid fa-arrow-down text-orange"></i>
              Withdraw {currency}
            </h1>
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-orange/10 text-orange border border-orange/20">
              {currency}
            </span>
          </div>

          <div className="glass rounded-2xl p-6 md:p-8 border border-border">
            <div className="flex justify-between items-center mb-6 p-4 bg-black/20 rounded-xl border border-border/50">
              <p className="text-text-muted text-sm flex items-center gap-2">
                <i className="fa-regular fa-wallet text-orange"></i>
                Available Balance
              </p>
              <p className="text-2xl font-bold">{currencySymbol}{balance.toLocaleString()}</p>
            </div>

            <div className={`${processingInfo.bg} rounded-xl p-3 mb-6 flex items-center gap-2 text-sm`}>
              <i className={`fa-solid ${processingInfo.icon} ${processingInfo.color}`}></i>
              <span className={processingInfo.color}>{processingInfo.label}</span>
              {kycLevel < 2 && (
                <span className="text-text-muted text-xs ml-auto">
                  (Upgrade to KYC Level 2 for instant)
                </span>
              )}
            </div>

            <form onSubmit={handleWithdraw} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-sm font-semibold">
                    {currencySymbol}
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
                {kycLevel < 2 && (
                  <p className="text-xs text-text-muted mt-1.5 flex items-center gap-1">
                    <i className="fa-solid fa-info-circle text-orange"></i>
                    Withdrawals above ₦50,000 require KYC Level 2
                  </p>
                )}
              </div>

              {/* ===== Fee Breakdown ===== */}
              {fee > 0 && (
                <div className="bg-black/20 rounded-xl p-4 border border-border">
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <i className="fa-solid fa-receipt text-orange"></i>
                    Fee Breakdown
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Withdrawal Fee</span>
                      <span>{currencySymbol}{fee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">VAT (7.5%)</span>
                      <span>{currencySymbol}{vat.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t border-border pt-1 mt-1">
                      <span>Total Deduction</span>
                      <span className="text-orange">{currencySymbol}{totalDeduction.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== Bank Selection ===== */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  <i className="fa-solid fa-building-columns text-orange mr-1"></i>
                  Withdraw to
                </label>
                {banks.length === 0 ? (
                  <div className="bg-black/20 border border-border rounded-xl p-4 text-center text-text-muted text-sm">
                    <i className="fa-regular fa-building-columns text-2xl block mb-2 opacity-40"></i>
                    <p>No bank accounts saved.</p>
                    <Link
                      href="/dashboard/profile"
                      className="text-orange hover:underline text-xs mt-1 inline-block"
                    >
                      Add a bank in your profile →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {banks.map((bank) => (
                      <button
                        key={bank.id}
                        type="button"
                        onClick={() => setSelectedBankId(bank.id)}
                        className={`w-full p-4 rounded-xl border transition flex items-center justify-between ${
                          selectedBankId === bank.id
                            ? 'border-orange bg-orange/10'
                            : 'border-border hover:border-orange/30 bg-black/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange/10 flex items-center justify-center text-orange">
                            <i className="fa-solid fa-building-columns"></i>
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-sm">{bank.bank_name}</p>
                            <p className="text-text-muted text-xs">
                              {bank.account_number} • {bank.account_name}
                            </p>
                          </div>
                        </div>
                        <div>
                          {bank.is_default && (
                            <span className="text-[10px] bg-green-400/20 text-green-400 px-2 py-0.5 rounded-full mr-2">
                              Default
                            </span>
                          )}
                          {selectedBankId === bank.id && (
                            <i className="fa-regular fa-circle-check text-orange text-lg"></i>
                          )}
                        </div>
                      </button>
                    ))}
                    <Link
                      href="/dashboard/profile"
                      className="text-xs text-text-muted hover:text-orange transition inline-flex items-center gap-1 mt-2"
                    >
                      <i className="fa-solid fa-plus"></i> Manage banks in profile
                    </Link>
                  </div>
                )}
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
                disabled={submitting || !selectedBankId || totalDeduction === 0}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3.5 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 disabled:opacity-50 shadow-lg shadow-orange/20 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><i className="fa-solid fa-spinner fa-spin"></i> Processing...</>
                ) : (
                  <><i className="fa-solid fa-paper-plane"></i> Withdraw Now</>
                )}
              </button>

              <p className="text-center text-text-muted text-xs flex items-center justify-center gap-2">
                <i className="fa-solid fa-lock text-green-400"></i>
                Secure &amp; Transparent
              </p>
            </form>
          </div>

          {/* ===== Withdrawal History ===== */}
          <div className="glass rounded-2xl p-6 border border-border">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <i className="fa-solid fa-clock-rotate-left text-orange"></i>
              Recent Withdrawals
            </h2>
            {withdrawalHistory.length === 0 ? (
              <div className="text-center py-6 text-text-muted">
                <i className="fa-regular fa-clock text-4xl block mb-3 opacity-40"></i>
                <p className="text-sm">No withdrawal history yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawalHistory.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                        tx.status === 'completed' ? 'bg-green-400/10 text-green-400' :
                        tx.status === 'processing' ? 'bg-blue-400/10 text-blue-400' :
                        'bg-yellow-400/10 text-yellow-400'
                      }`}>
                        <i className={`fa-solid ${
                          tx.status === 'completed' ? 'fa-circle-check' :
                          tx.status === 'processing' ? 'fa-spinner fa-spin' :
                          'fa-clock'
                        }`}></i>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Withdrawal</p>
                        <p className="text-text-muted text-xs">
                          {new Date(tx.created_at).toLocaleDateString()} • {tx.currency}
                          {tx.fee > 0 && ` • Fee: ${currencySymbol}${tx.fee.toFixed(2)}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-400">
                        -{currencySymbol}{Math.abs(tx.amount).toLocaleString()}
                      </p>
                      <span className={`text-xs capitalize ${
                        tx.status === 'completed' ? 'text-green-400' :
                        tx.status === 'processing' ? 'text-blue-400' :
                        'text-yellow-400'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
                <Link
                  href="/dashboard/orders"
                  className="text-xs text-orange hover:underline inline-block mt-2"
                >
                  View all transactions →
                </Link>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
