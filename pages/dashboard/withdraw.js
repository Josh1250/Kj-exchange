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

  // ===== State =====
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [selectedBankId, setSelectedBankId] = useState('');
  const [banks, setBanks] = useState([]);
  const [kycTier, setKycTier] = useState(1);
  const [dailyLimit, setDailyLimit] = useState(3000000);
  const [dailyWithdrawnToday, setDailyWithdrawnToday] = useState(0);
  const [remainingLimit, setRemainingLimit] = useState(3000000);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [narration, setNarration] = useState('');
  const [fetchingAccount, setFetchingAccount] = useState(false);
  const [banksList, setBanksList] = useState([]);
  const [selectedBankCode, setSelectedBankCode] = useState('');
  const [showBanks, setShowBanks] = useState(false);
  const [bankSearch, setBankSearch] = useState('');

  // ===== Fee Calculation =====
  const [fee, setFee] = useState(0);
  const [totalDeduction, setTotalDeduction] = useState(0);

  // ===== Load Data =====
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }
    if (user) {
      fetchData();
      fetchBanksList();
    }
  }, [user, loading, router]);

  // ===== Recalculate fee whenever amount changes =====
  useEffect(() => {
    calculateFees();
  }, [amount]);

  const fetchData = async () => {
    try {
      // Wallet balance
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();
      setBalance(wallet?.balance || 0);

      // User profile with KYC tier and daily limits
      const { data: profile } = await supabase
        .from('users')
        .select('kyc_tier, daily_withdrawal_limit, daily_withdrawn_today, withdrawal_limit_reset')
        .eq('id', user.id)
        .single();

      if (profile) {
        // Check if daily limit needs reset
        const today = new Date().toISOString().split('T')[0];
        if (profile.withdrawal_limit_reset !== today) {
          // Reset daily limit
          await supabase
            .from('users')
            .update({
              daily_withdrawn_today: 0,
              withdrawal_limit_reset: today,
            })
            .eq('id', user.id);
          setDailyWithdrawnToday(0);
        } else {
          setDailyWithdrawnToday(profile.daily_withdrawn_today || 0);
        }

        const tier = profile.kyc_tier || 1;
        setKycTier(tier);
        
        // Set limits based on tier (Dtunes style)
        const limits = {
          1: { daily: 3000000, perTx: 500000 },
          2: { daily: 15000000, perTx: 1000000 },
          3: { daily: 50000000, perTx: 2000000 },
        };
        setDailyLimit(limits[tier]?.daily || 3000000);
        setRemainingLimit((limits[tier]?.daily || 3000000) - (profile.daily_withdrawn_today || 0));
      }

      // Saved banks
      const { data: bankData } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });
      setBanks(bankData || []);

      const defaultBank = bankData?.find(b => b.is_default);
      if (defaultBank) {
        setSelectedBankId(defaultBank.id);
        setAccountNumber(defaultBank.account_number);
        setAccountName(defaultBank.account_name);
        setSelectedBankCode(defaultBank.bank_code);
        setBankSearch(defaultBank.bank_name);
      }

      // Withdrawal history
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

  const fetchBanksList = async () => {
    try {
      const response = await fetch('/api/flutterwave/banks');
      const data = await response.json();
      if (data.status === 'success') {
        setBanksList(data.data);
      }
    } catch (err) {
      console.error('Error fetching banks:', err);
    }
  };

  // ===== Calculate Fees =====
  const calculateFees = () => {
    const amt = parseFloat(amount) || 0;
    if (amt <= 0) {
      setFee(0);
      setTotalDeduction(0);
      return;
    }
    const feeAmount = amt >= 50000 ? 100 : 50;
    setFee(feeAmount);
    setTotalDeduction(amt + feeAmount);
  };

  // ===== Get Selected Bank =====
  const getSelectedBank = () => {
    if (selectedBankId) {
      return banks.find(b => b.id === selectedBankId);
    }
    return null;
  };

  // ===== Check Balance and Limits =====
  const checkLimits = (amt) => {
    if (amt > remainingLimit) {
      setError(`Daily withdrawal limit exceeded. You have ₦${remainingLimit.toLocaleString()} remaining today.`);
      return false;
    }
    const limits = { 1: 500000, 2: 1000000, 3: 2000000 };
    const perTxLimit = limits[kycTier] || 500000;
    if (amt > perTxLimit) {
      setError(`Per-transaction limit is ₦${perTxLimit.toLocaleString()} for your KYC tier.`);
      return false;
    }
    return true;
  };

  // ===== Resolve Account Name =====
  const resolveAccount = async () => {
    if (!accountNumber || accountNumber.length < 10) {
      setError('Enter a valid account number');
      return;
    }
    if (!selectedBankCode) {
      setError('Select a bank first');
      return;
    }
    setFetchingAccount(true);
    try {
      const response = await fetch('/api/flutterwave/resolve-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_number: accountNumber,
          account_bank: selectedBankCode,
        }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        setAccountName(data.data.account_name);
      } else {
        setError(data.message || 'Failed to fetch account name');
      }
    } catch (err) {
      setError('Failed to resolve account. Please try again.');
    } finally {
      setFetchingAccount(false);
    }
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

    // Check daily and per-transaction limits
    if (!checkLimits(amt)) {
      setSubmitting(false);
      return;
    }

    if (totalDeduction > balance) {
      setError(`Insufficient balance. Total deduction: ₦${totalDeduction.toFixed(2)}`);
      setSubmitting(false);
      return;
    }

    const selectedBank = getSelectedBank();
    const bankCode = selectedBank?.bank_code || selectedBankCode;
    const bankName = selectedBank?.bank_name || bankSearch;
    const accNumber = selectedBank?.account_number || accountNumber;
    const accName = selectedBank?.account_name || accountName;

    if (!bankCode || !accNumber) {
      setError('Please select a bank and enter account number');
      setSubmitting(false);
      return;
    }

    // KYC Check
    if (kycTier < 2 && amt > 50000) {
      setError('KYC Level 2 required for withdrawals above ₦50,000. Complete KYC in your profile.');
      setSubmitting(false);
      return;
    }

    const isAuto = kycTier >= 2;

    try {
      // 1. Create transaction (status: pending)
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'withdrawal',
          amount: -amt,
          fee: fee,
          vat: 0,
          status: 'pending',
          currency: 'NGN',
          metadata: {
            bank_name: bankName,
            account_number: accNumber,
            account_name: accName,
            bank_code: bankCode,
            narration: narration || null,
          },
          withdrawal_type: isAuto ? 'auto' : 'manual',
        })
        .select()
        .single();

      if (txError) throw new Error(txError.message);

      // 2. If auto withdrawal – trigger Flutterwave transfer
      if (isAuto) {
        try {
          const transferResponse = await fetch('/api/flutterwave/transfer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: amt,
              currency: 'NGN',
              bank_code: bankCode,
              account_number: accNumber,
              account_name: accName,
              reference: `withdraw_${txData.id}`,
              narration: narration || 'KJ Exchange Withdrawal',
            }),
          });

          const transferData = await transferResponse.json();

          if (transferData.status === 'success') {
            // ✅ Transfer successful – NOW deduct wallet
            const { data: wallet } = await supabase
              .from('wallets')
              .select('balance')
              .eq('user_id', user.id)
              .maybeSingle();

            const newBalance = (wallet?.balance || 0) - totalDeduction;
            await supabase
              .from('wallets')
              .update({ balance: newBalance })
              .eq('user_id', user.id);

            // Update daily withdrawal tracking
            await supabase
              .from('users')
              .update({
                daily_withdrawn_today: dailyWithdrawnToday + amt,
              })
              .eq('id', user.id);

            // Update transaction to completed
            await supabase
              .from('transactions')
              .update({
                status: 'completed',
                processed_at: new Date().toISOString(),
              })
              .eq('id', txData.id);

            setBalance(newBalance);
            setDailyWithdrawnToday(dailyWithdrawnToday + amt);
            setRemainingLimit(remainingLimit - amt);

            setSuccess(`✅ Withdrawal of ₦${amt.toLocaleString()} processed instantly! (Fee: ₦${fee.toFixed(2)})`);

            await supabase
              .from('notifications')
              .insert({
                user_id: user.id,
                message: `💸 Instant withdrawal of ₦${amt.toLocaleString()} sent to your bank. Fee: ₦${fee.toFixed(2)}`,
              });

            // Reset form
            setAmount('');
            setNarration('');
          } else {
            // ❌ Transfer failed – keep wallet intact, mark transaction as failed
            await supabase
              .from('transactions')
              .update({ status: 'failed' })
              .eq('id', txData.id);

            setError(`❌ Bank transfer failed: ${transferData.message || 'Unknown error'}. Please try again or contact support.`);
          }
        } catch (transferErr) {
          console.error('Transfer error:', transferErr);
          await supabase
            .from('transactions')
            .update({ status: 'failed' })
            .eq('id', txData.id);
          setError('❌ Bank transfer failed. Please try again or contact support.');
        }
      } else {
        // Manual withdrawal – deduct wallet immediately (since it's pending approval)
        const { data: wallet } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', user.id)
          .maybeSingle();

        const newBalance = (wallet?.balance || 0) - totalDeduction;
        await supabase
          .from('wallets')
          .update({ balance: newBalance })
          .eq('user_id', user.id);

        setBalance(newBalance);

        setSuccess(`✅ Withdrawal of ₦${amt.toLocaleString()} initiated for review. (Fee: ₦${fee.toFixed(2)})`);

        await supabase
          .from('notifications')
          .insert({
            user_id: user.id,
            message: `💸 Withdrawal of ₦${amt.toLocaleString()} submitted for review. Fee: ₦${fee.toFixed(2)}`,
          });

        setAmount('');
        setNarration('');
      }

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
    if (kycTier >= 2) {
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

  // KYC tier labels
  const kycTierLabels = {
    1: 'Tier 1',
    2: 'Tier 2',
    3: 'Tier 3',
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  const currencySymbol = '₦';
  const isAccountSelected = selectedBankId || (selectedBankCode && accountNumber);

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
              Withdraw Naira
            </h1>
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-orange/10 text-orange border border-orange/20">
              NGN
            </span>
          </div>

          {/* KYC Tier Info Card */}
          <div className="glass rounded-2xl p-4 border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
                  kycTier >= 2 ? 'bg-green-400/20 text-green-400' : 'bg-yellow-400/20 text-yellow-400'
                }`}>
                  {kycTierLabels[kycTier] || 'Tier 1'}
                </span>
                <span className="text-text-muted text-xs">Current Tier</span>
              </div>
              <Link href="/dashboard/profile" className="text-orange text-sm hover:underline">
                Upgrade KYC →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
              <div>
                <p className="text-text-muted text-xs">Daily Limit</p>
                <p className="font-bold text-text-primary">{currencySymbol}{dailyLimit.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs">Remaining Today</p>
                <p className={`font-bold ${remainingLimit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {currencySymbol}{remainingLimit.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-text-muted text-xs">Per Transaction</p>
                <p className="font-bold text-text-primary">
                  {currencySymbol}{kycTier === 1 ? '500,000' : kycTier === 2 ? '1,000,000' : '2,000,000'}
                </p>
              </div>
              <div>
                <p className="text-text-muted text-xs">Processing</p>
                <p className={`font-bold ${kycTier >= 2 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {kycTier >= 2 ? '⚡ Instant' : '⏳ 24 Hours'}
                </p>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 md:p-8 border border-border">
            {/* Balance */}
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
              {kycTier < 2 && (
                <span className="text-text-muted text-xs ml-auto">
                  (Upgrade to KYC Level 2 for instant)
                </span>
              )}
            </div>

            <form onSubmit={handleWithdraw} className="space-y-5">
              {/* Amount */}
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
                <div className="flex justify-between mt-1">
                  <p className="text-text-muted text-xs">Min: ₦1</p>
                  <p className="text-text-muted text-xs">Max per tx: {currencySymbol}{kycTier === 1 ? '500,000' : kycTier === 2 ? '1,000,000' : '2,000,000'}</p>
                </div>
              </div>

              {/* Fee */}
              {fee > 0 && (
                <div className="bg-black/20 rounded-xl p-3 border border-border flex justify-between text-sm">
                  <span className="text-text-muted">Withdrawal Fee</span>
                  <span className="text-orange">{currencySymbol}{fee.toFixed(2)}</span>
                </div>
              )}

              {/* Bank Selection - Dtunes Style */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  <i className="fa-solid fa-building-columns text-orange mr-1"></i>
                  Select Bank
                </label>

                {/* Saved Banks */}
                {banks.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {banks.map((bank) => (
                      <button
                        key={bank.id}
                        type="button"
                        onClick={() => {
                          setSelectedBankId(bank.id);
                          setAccountNumber(bank.account_number);
                          setAccountName(bank.account_name);
                          setSelectedBankCode(bank.bank_code);
                          setBankSearch(bank.bank_name);
                        }}
                        className={`w-full p-3 rounded-xl border transition text-left flex items-center justify-between ${
                          selectedBankId === bank.id
                            ? 'border-orange bg-orange/10'
                            : 'border-border hover:border-orange/30 bg-black/20'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-sm">{bank.bank_name}</p>
                          <p className="text-text-muted text-xs">
                            {bank.account_number} • {bank.account_name}
                          </p>
                        </div>
                        {selectedBankId === bank.id && (
                          <i className="fa-regular fa-circle-check text-orange text-lg"></i>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Add New Bank - Searchable Dropdown */}
                <div className={`${banks.length > 0 ? 'border-t border-border pt-3 mt-3' : ''}`}>
                  <p className="text-text-muted text-xs mb-2">
                    {banks.length > 0 ? 'Or add a new bank' : 'Add your bank details'}
                  </p>
                  <div className="relative">
                    <input
                      type="text"
                      value={bankSearch}
                      onChange={(e) => {
                        setBankSearch(e.target.value);
                        setShowBanks(true);
                        setSelectedBankId('');
                      }}
                      onFocus={() => setShowBanks(true)}
                      className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20"
                      placeholder="Search for your bank..."
                    />
                    {showBanks && banksList.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-bg-card border border-border rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                        {banksList
                          .filter(b => b.name.toLowerCase().includes(bankSearch.toLowerCase()))
                          .map((bank) => (
                            <button
                              key={bank.code}
                              type="button"
                              onClick={() => {
                                setSelectedBankCode(bank.code);
                                setBankSearch(bank.name);
                                setShowBanks(false);
                                setSelectedBankId('');
                              }}
                              className="w-full px-4 py-2.5 text-left hover:bg-orange/10 hover:text-orange transition text-sm flex items-center justify-between border-b border-border/50 last:border-0"
                            >
                              <span>{bank.name}</span>
                              {selectedBankCode === bank.code && (
                                <i className="fa-regular fa-circle-check text-orange"></i>
                              )}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Account Number</label>
                <div className="relative">
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    onBlur={() => {
                      if (accountNumber.length >= 10 && selectedBankCode) {
                        resolveAccount();
                      }
                    }}
                    className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20"
                    placeholder="Enter account number"
                    required
                    maxLength="10"
                  />
                  {selectedBankCode && accountNumber.length >= 10 && (
                    <button
                      type="button"
                      onClick={resolveAccount}
                      disabled={fetchingAccount}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-orange/10 hover:bg-orange/20 text-orange px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                    >
                      {fetchingAccount ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Verify'}
                    </button>
                  )}
                </div>
              </div>

              {/* Account Name (auto-filled) */}
              {accountName && (
                <div className="bg-green-400/5 border border-green-400/20 rounded-xl p-3 flex items-center gap-2">
                  <i className="fa-regular fa-circle-check text-green-400"></i>
                  <span className="text-text-secondary text-sm">Account Name: <strong className="text-text-primary">{accountName}</strong></span>
                </div>
              )}

              {/* Narration (Dtunes style) */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Narration (Optional)</label>
                <input
                  type="text"
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20"
                  placeholder="Add a note (e.g., Savings withdrawal)"
                  maxLength="50"
                />
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
                disabled={submitting || !isAccountSelected || totalDeduction === 0 || amount <= 0}
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

          {/* Saved Beneficiaries */}
          {banks.length > 0 && (
            <div className="glass rounded-2xl p-4 border border-border">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <i className="fa-regular fa-bookmark text-orange"></i>
                Saved Beneficiaries
              </h3>
              <div className="space-y-2">
                {banks.map((bank) => (
                  <div
                    key={bank.id}
                    className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-border"
                  >
                    <div>
                      <p className="font-semibold text-sm">{bank.bank_name}</p>
                      <p className="text-text-muted text-xs">
                        {bank.account_number} • {bank.account_name}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBankId(bank.id);
                        setAccountNumber(bank.account_number);
                        setAccountName(bank.account_name);
                        setSelectedBankCode(bank.bank_code);
                        setBankSearch(bank.bank_name);
                      }}
                      className="text-xs text-orange hover:underline"
                    >
                      Select
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Withdrawal History */}
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
                    <div>
                      <p className="font-medium text-sm">Withdrawal</p>
                      <p className="text-text-muted text-xs">
                        {new Date(tx.created_at).toLocaleDateString()} • {tx.currency}
                        {tx.fee > 0 && ` • Fee: ₦${tx.fee.toFixed(2)}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-400">
                        -₦{Math.abs(tx.amount).toLocaleString()}
                      </p>
                      <span className={`text-xs capitalize ${
                        tx.status === 'completed' ? 'text-green-400' :
                        tx.status === 'pending' ? 'text-yellow-400' :
                        tx.status === 'processing' ? 'text-blue-400' :
                        'text-red-400'
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
