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

  // State
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [mobileMoney, setMobileMoney] = useState('');
  const [banks, setBanks] = useState([]);
  const [filteredBanks, setFilteredBanks] = useState([]);
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [kycLevel, setKycLevel] = useState(1);
  const [fetchingAccount, setFetchingAccount] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(false);

  const currencySymbol = { NGN: '₦', USD: '$', GHS: '₵' }[currency] || '₦';
  const isNGN = currency === 'NGN';
  const isUSD = currency === 'USD';
  const isGHS = currency === 'GHS';

  // ============================================
  // 1. Fetch wallet, profile, and banks
  // ============================================
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }
    if (user) {
      fetchWalletAndProfile();
      fetchBanks();
    }
  }, [user, loading, router, currency]);

  const fetchWalletAndProfile = async () => {
    try {
      // Wallet balance
      const field = currency === 'USD' ? 'usd_balance' : currency === 'GHS' ? 'ghs_balance' : 'balance';
      const { data: wallet } = await supabase
        .from('wallets')
        .select(field)
        .eq('user_id', user.id)
        .maybeSingle();
      setBalance(wallet?.[field] || 0);

      // Profile
      const { data: profile } = await supabase
        .from('users')
        .select('bank_code, bank_name, account_number, account_name, kyc_level')
        .eq('id', user.id)
        .single();

      if (profile) {
        setBankCode(profile.bank_code || '');
        setBankName(profile.bank_name || '');
        setAccountNumber(profile.account_number || '');
        setAccountName(profile.account_name || '');
        setKycLevel(profile.kyc_level || 1);
        setBankSearch(profile.bank_name || '');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const fetchBanks = async () => {
    setLoadingBanks(true);
    try {
      const response = await fetch('/api/flutterwave/banks');
      const data = await response.json();
      if (data.status === 'success') {
        setBanks(data.data);
        setFilteredBanks(data.data);
      }
    } catch (err) {
      console.error('Error fetching banks:', err);
    } finally {
      setLoadingBanks(false);
    }
  };

  // ============================================
  // 2. Bank search and account resolution
  // ============================================
  useEffect(() => {
    const filtered = banks.filter(bank =>
      bank.name.toLowerCase().includes(bankSearch.toLowerCase())
    );
    setFilteredBanks(filtered);
  }, [bankSearch, banks]);

  const handleBankSelect = (bank) => {
    setBankCode(bank.code);
    setBankName(bank.name);
    setBankSearch(bank.name);
    setShowBankDropdown(false);
  };

  const fetchAccountName = async () => {
    if (!accountNumber || accountNumber.length < 10) {
      setError('Enter a valid account number');
      return;
    }
    if (!bankCode) {
      setError('Select a bank first');
      return;
    }

    setFetchingAccount(true);
    setError('');

    try {
      const response = await fetch('/api/flutterwave/resolve-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_number: accountNumber, bank_code: bankCode }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        setAccountName(data.data.account_name);
        setSuccess('Account name fetched successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to fetch account name');
      }
    } catch (err) {
      setError('Failed to resolve account. Please try again.');
    } finally {
      setFetchingAccount(false);
    }
  };

  // ============================================
  // 3. Withdraw submission
  // ============================================
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
    if (amt > balance) {
      setError('Insufficient balance');
      setSubmitting(false);
      return;
    }

    if (isNGN && amt > 50000 && kycLevel < 2) {
      setError('KYC Level 2 required for withdrawals above ₦50,000. Complete KYC in your profile.');
      setSubmitting(false);
      return;
    }

    if (!bankCode || !accountNumber) {
      setError('Please select a bank and enter account number');
      setSubmitting(false);
      return;
    }

    const metadata = {
      currency,
      bank_code: bankCode,
      bank_name: bankName,
      account_number: accountNumber,
      account_name: accountName,
      routing_number: routingNumber,
      mobile_money: mobileMoney,
    };

    try {
      // 1. Create transaction
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'withdrawal',
          amount: -amt,
          status: 'pending',
          currency: currency,
          metadata,
        });
      if (txError) throw new Error(txError.message);

      // 2. Update wallet balance
      const field = currency === 'USD' ? 'usd_balance' : currency === 'GHS' ? 'ghs_balance' : 'balance';
      const { data: wallet } = await supabase
        .from('wallets')
        .select(field)
        .eq('user_id', user.id)
        .maybeSingle();

      const newBalance = (wallet?.[field] || 0) - amt;

      if (wallet) {
        const { error: updateErr } = await supabase
          .from('wallets')
          .update({ [field]: newBalance })
          .eq('user_id', user.id);
        if (updateErr) throw new Error(updateErr.message);
      } else {
        const { error: insertErr } = await supabase
          .from('wallets')
          .insert({ user_id: user.id, [field]: newBalance });
        if (insertErr) throw new Error(insertErr.message);
      }

      // 3. Notification
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          message: `💸 Withdrawal of ${currency} ${amt.toLocaleString()} initiated.`,
        });

      setSuccess(`✅ Withdrawal of ${currencySymbol}${amt.toLocaleString()} initiated!`);
      setAmount('');
      setBalance(newBalance);
    } catch (err) {
      console.error('Withdrawal error:', err);
      setError('❌ Failed to process withdrawal: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // 4. UI
  // ============================================
  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  return (
    <>
      <Head><title>Withdraw · KJ Exchange</title></Head>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto">
          {/* Header with back button */}
          <div className="flex items-center gap-2 mb-6">
            <Link href="/dashboard/wallet" className="text-text-muted hover:text-text-primary transition group">
              <i className="fa-solid fa-arrow-left text-sm group-hover:-translate-x-1 transition-transform"></i>
            </Link>
            <h1 className="text-2xl font-bold">Withdraw {currency}</h1>
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-orange/10 text-orange border border-orange/20">
              {currency}
            </span>
          </div>

          <div className="bg-bg-card rounded-2xl p-6 md:p-8 border border-border shadow-2xl shadow-purple/5">
            {/* Balance display */}
            <div className="flex justify-between items-center mb-6 p-4 bg-black/20 rounded-xl border border-border/50">
              <p className="text-text-muted text-sm">Available Balance</p>
              <p className="text-2xl font-bold">{currencySymbol}{balance.toLocaleString()}</p>
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
                {isNGN && (
                  <p className="text-xs text-text-muted mt-1.5">
                    💡 Withdrawals above ₦50,000 require KYC Level 2
                  </p>
                )}
              </div>

              {/* Bank selection with search */}
              <div className="relative">
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Select Bank</label>
                <div className="relative">
                  <input
                    type="text"
                    value={bankSearch}
                    onChange={(e) => {
                      setBankSearch(e.target.value);
                      setShowBankDropdown(true);
                    }}
                    onFocus={() => setShowBankDropdown(true)}
                    className="w-full bg-black/40 border border-border rounded-xl px-4 py-3.5 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20"
                    placeholder="Search for your bank..."
                    required
                  />
                  {loadingBanks && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2">
                      <i className="fa-solid fa-spinner fa-spin text-text-muted"></i>
                    </span>
                  )}
                </div>

                {showBankDropdown && filteredBanks.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-bg-card border border-border rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                    {filteredBanks.map((bank) => (
                      <button
                        key={bank.code}
                        type="button"
                        onClick={() => handleBankSelect(bank)}
                        className="w-full px-4 py-2.5 text-left hover:bg-orange/10 hover:text-orange transition text-sm flex items-center gap-2 border-b border-border/50 last:border-0"
                      >
                        <span>{bank.name}</span>
                        {bank.code === bankCode && (
                          <span className="ml-auto text-xs text-green-400">
                            <i className="fa-regular fa-circle-check"></i>
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {showBankDropdown && filteredBanks.length === 0 && bankSearch && (
                  <div className="absolute z-20 w-full mt-1 bg-bg-card border border-border rounded-xl shadow-2xl p-4 text-center text-text-muted text-sm">
                    No banks found.
                  </div>
                )}
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Account Number</label>
                <div className="relative">
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full bg-black/40 border border-border rounded-xl px-4 py-3.5 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20"
                    placeholder={isNGN ? '10-digit account number' : 'Enter account number'}
                    required
                    onBlur={() => {
                      if (accountNumber && accountNumber.length >= 10 && bankCode) {
                        fetchAccountName();
                      }
                    }}
                  />
                  {bankCode && accountNumber && accountNumber.length >= 10 && (
                    <button
                      type="button"
                      onClick={fetchAccountName}
                      disabled={fetchingAccount}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-orange/10 hover:bg-orange/20 text-orange px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                    >
                      {fetchingAccount ? (
                        <i className="fa-solid fa-spinner fa-spin"></i>
                      ) : (
                        'Fetch Name'
                      )}
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

              {/* Additional fields per currency */}
              {isUSD && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Routing Number</label>
                  <input
                    type="text"
                    value={routingNumber}
                    onChange={(e) => setRoutingNumber(e.target.value)}
                    className="w-full bg-black/40 border border-border rounded-xl px-4 py-3.5 text-text-primary focus:border-orange focus:outline-none"
                    placeholder="9-digit routing number"
                    required
                  />
                </div>
              )}

              {isGHS && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Mobile Money (Optional)</label>
                  <input
                    type="text"
                    value={mobileMoney}
                    onChange={(e) => setMobileMoney(e.target.value)}
                    className="w-full bg-black/40 border border-border rounded-xl px-4 py-3.5 text-text-primary focus:border-orange focus:outline-none"
                    placeholder="e.g., 0241234567 (MTN MoMo)"
                  />
                </div>
              )}

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
                disabled={submitting || !bankCode || !accountNumber}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3.5 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 disabled:opacity-50 shadow-lg shadow-orange/20 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><i className="fa-solid fa-spinner fa-spin"></i> Processing...</>
                ) : (
                  <><i className="fa-solid fa-paper-plane"></i> Withdraw Now</>
                )}
              </button>

              <p className="text-center text-text-muted text-xs">
                Withdrawals are processed within 24 hours.
                <br />
                <span className="text-green-400 font-semibold">🔒 Secure &amp; Transparent</span>
              </p>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
