import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../_app';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../lib/supabaseClient';
import Head from 'next/head';

export default function Profile() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // ===== User Profile =====
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [kycLevel, setKycLevel] = useState(1);
  const [kycStatus, setKycStatus] = useState('Not Submitted');
  const [bvn, setBvn] = useState('');
  const [idFile, setIdFile] = useState(null);

  // ===== My Banks =====
  const [banks, setBanks] = useState([]);
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // ===== Add Bank Form =====
  const [bankSearch, setBankSearch] = useState('');
  const [bankList, setBankList] = useState([]);
  const [filteredBankList, setFilteredBankList] = useState([]);
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [fetchingAccount, setFetchingAccount] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(false);

  // ===== Load Data =====
  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchBanks();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data } = await supabase
        .from('users')
        .select('full_name, username, phone, kyc_level, kyc_status, bvn')
        .eq('id', user.id)
        .single();
      if (data) {
        setFullName(data.full_name || '');
        setUsername(data.username || '');
        setPhone(data.phone || '');
        setKycLevel(data.kyc_level || 1);
        setKycStatus(data.kyc_status || 'Not Submitted');
        setBvn(data.bvn || '');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const fetchBanks = async () => {
    try {
      const { data } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setBanks(data || []);
    } catch (err) {
      console.error('Error fetching banks:', err);
    }
  };

  const fetchBankList = async () => {
    setLoadingBanks(true);
    try {
      const response = await fetch('/api/flutterwave/banks');
      const data = await response.json();
      if (data.status === 'success') {
        setBankList(data.data);
        setFilteredBankList(data.data);
      }
    } catch (err) {
      console.error('Error fetching banks:', err);
    } finally {
      setLoadingBanks(false);
    }
  };

  // ===== Username Availability Check =====
  const checkUsername = async (value) => {
    if (!value) return true;
    const { data, error } = await supabase
      .from('users')
      .select('username')
      .eq('username', value)
      .neq('id', user.id)
      .maybeSingle();
    return !data;
  };

  // ===== Save Profile =====
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setMessageType('');

    // Validate username
    if (username) {
      const available = await checkUsername(username);
      if (!available) {
        setMessage('Username already taken. Please choose another.');
        setMessageType('error');
        setSaving(false);
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: fullName,
          username: username,
          phone: phone,
        })
        .eq('id', user.id);

      if (error) throw error;

      setMessage('Profile updated successfully!');
      setMessageType('success');
    } catch (err) {
      setMessage('Error saving profile. Please try again.');
      setMessageType('error');
      console.error(err);
    }
    setSaving(false);
  };

  // ===== KYC Submit =====
  const handleKycSubmit = async (e) => {
    e.preventDefault();
    if (!bvn || bvn.length !== 11) {
      setMessage('Please enter a valid 11-digit BVN.');
      setMessageType('error');
      return;
    }
    if (!idFile) {
      setMessage('Please upload a valid ID document.');
      setMessageType('error');
      return;
    }

    setSaving(true);
    setMessage('');
    setMessageType('');

    try {
      // In production, upload file to Supabase Storage first
      const { error } = await supabase
        .from('users')
        .update({
          bvn: bvn,
          kyc_status: 'Pending',
        })
        .eq('id', user.id);

      if (error) throw error;

      setKycStatus('Pending');
      setMessage('KYC submitted! Our team will review it shortly.');
      setMessageType('success');
    } catch (err) {
      setMessage('Error submitting KYC. Please try again.');
      setMessageType('error');
      console.error(err);
    }
    setSaving(false);
  };

  // ===== Add Bank =====
  const handleAddBank = async (e) => {
    e.preventDefault();
    if (!selectedBank || !accountNumber || !accountName) {
      setMessage('Please fill in all bank details.');
      setMessageType('error');
      return;
    }

    setSaving(true);
    setMessage('');
    setMessageType('');

    try {
      // Check if this is the first bank – set as default
      const isFirst = banks.length === 0;

      const { error } = await supabase
        .from('bank_accounts')
        .insert({
          user_id: user.id,
          bank_code: selectedBank.code,
          bank_name: selectedBank.name,
          account_number: accountNumber,
          account_name: accountName,
          is_default: isFirst,
        });

      if (error) throw error;

      setMessage('Bank account added successfully!');
      setMessageType('success');
      setShowAddBankModal(false);
      fetchBanks();
      // Reset form
      setSelectedBank(null);
      setBankSearch('');
      setAccountNumber('');
      setAccountName('');
    } catch (err) {
      setMessage('Error adding bank. Please try again.');
      setMessageType('error');
      console.error(err);
    }
    setSaving(false);
  };

  const handleSetDefault = async (bankId) => {
    try {
      await supabase
        .from('bank_accounts')
        .update({ is_default: false })
        .eq('user_id', user.id);

      await supabase
        .from('bank_accounts')
        .update({ is_default: true })
        .eq('id', bankId);

      fetchBanks();
    } catch (err) {
      console.error('Error setting default bank:', err);
    }
  };

  const handleDeleteBank = async (bankId) => {
    if (!confirm('Are you sure you want to remove this bank account?')) return;
    try {
      await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', bankId);
      fetchBanks();
    } catch (err) {
      console.error('Error deleting bank:', err);
    }
  };

  const fetchAccountName = async () => {
    if (!accountNumber || accountNumber.length < 10) {
      setMessage('Enter a valid account number');
      setMessageType('error');
      return;
    }
    if (!selectedBank) {
      setMessage('Select a bank first');
      setMessageType('error');
      return;
    }

    setFetchingAccount(true);
    try {
      const response = await fetch('/api/flutterwave/resolve-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_number: accountNumber,
          bank_code: selectedBank.code,
        }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        setAccountName(data.data.account_name);
        setMessage('Account name fetched!');
        setMessageType('success');
      } else {
        setMessage(data.message || 'Failed to fetch account name');
        setMessageType('error');
      }
    } catch (err) {
      setMessage('Failed to resolve account. Please try again.');
      setMessageType('error');
    } finally {
      setFetchingAccount(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-text-primary">Loading...</div>;
  if (!user) {
    router.push('/auth/login');
    return null;
  }

  return (
    <>
      <Head>
        <title>Profile · KJ Exchange</title>
      </Head>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <i className="fa-regular fa-user text-orange"></i>
            Profile
          </h1>

          {/* ===== Profile Form ===== */}
          <div className="glass rounded-2xl p-6 border border-border">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-orange-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-orange/20">
                {fullName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xl font-bold">{fullName || user?.email?.split('@')[0]}</p>
                <p className="text-text-muted text-sm flex items-center gap-1">
                  <i className="fa-regular fa-envelope text-orange"></i>
                  {user?.email}
                </p>
                <p className="text-xs text-orange flex items-center gap-1">
                  <i className="fa-regular fa-shield-check"></i>
                  KYC Level: {kycLevel} — {kycStatus}
                </p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  <i className="fa-regular fa-at text-orange mr-1"></i>
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20"
                  placeholder="Choose a unique username (e.g., josh123)"
                />
                <p className="text-xs text-text-muted mt-1">Must be unique. Only lowercase letters and numbers.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  <i className="fa-solid fa-phone text-orange mr-1"></i>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20"
                  placeholder="e.g., 08012345678"
                />
              </div>

              {message && (
                <div className={`flex items-center gap-2 text-sm ${messageType === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  <i className={`fa-regular ${messageType === 'success' ? 'fa-circle-check' : 'fa-circle-xmark'}`}></i>
                  <span>{message}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3 rounded-xl hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-orange/20"
              >
                {saving ? (
                  <><i className="fa-solid fa-spinner fa-spin"></i> Saving...</>
                ) : (
                  <><i className="fa-regular fa-floppy-disk"></i> Save Changes</>
                )}
              </button>
            </form>
          </div>

          {/* ===== My Banks Section ===== */}
          <div className="glass rounded-2xl p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <i className="fa-solid fa-building-columns text-orange"></i>
                My Banks
              </h2>
              <button
                onClick={() => {
                  setShowAddBankModal(true);
                  fetchBankList();
                }}
                className="bg-orange/10 hover:bg-orange/20 text-orange px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2"
              >
                <i className="fa-solid fa-plus"></i> Add Bank
              </button>
            </div>

            {banks.length === 0 ? (
              <div className="text-center py-6 text-text-muted">
                <i className="fa-regular fa-building-columns text-4xl block mb-3 opacity-40"></i>
                <p>No bank accounts saved yet.</p>
                <button
                  onClick={() => {
                    setShowAddBankModal(true);
                    fetchBankList();
                  }}
                  className="mt-2 text-orange hover:underline text-sm"
                >
                  Add your first bank →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {banks.map((bank) => (
                  <div
                    key={bank.id}
                    className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-border hover:border-orange/30 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange/10 flex items-center justify-center text-orange text-lg">
                        <i className="fa-solid fa-building-columns"></i>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{bank.bank_name}</p>
                        <p className="text-text-muted text-xs">
                          {bank.account_number} • {bank.account_name}
                        </p>
                      </div>
                      {bank.is_default && (
                        <span className="ml-2 text-[10px] bg-green-400/20 text-green-400 px-2 py-0.5 rounded-full border border-green-400/20">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!bank.is_default && (
                        <button
                          onClick={() => handleSetDefault(bank.id)}
                          className="text-text-muted hover:text-orange text-xs transition px-2 py-1 rounded-lg hover:bg-orange/10"
                          title="Set as default"
                        >
                          <i className="fa-regular fa-circle-check"></i>
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteBank(bank.id)}
                        className="text-text-muted hover:text-red-400 text-xs transition px-2 py-1 rounded-lg hover:bg-red-400/10"
                        title="Remove bank"
                      >
                        <i className="fa-regular fa-trash-can"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ===== KYC Section ===== */}
          <div className="glass rounded-2xl p-6 border border-border">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <i className="fa-solid fa-shield-check text-orange"></i>
              KYC Verification
            </h2>
            <p className="text-text-muted text-sm mb-4">Level 2 required for withdrawals above ₦50,000 and instant withdrawals.</p>

            <form onSubmit={handleKycSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">BVN (11 digits)</label>
                <input
                  type="text"
                  value={bvn}
                  onChange={(e) => setBvn(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20"
                  placeholder="Enter your BVN"
                  maxLength="11"
                  pattern="[0-9]{11}"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Upload ID (Passport, Driver's License, or NIN)</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setIdFile(e.target.files[0])}
                  className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                />
                <p className="text-xs text-text-muted mt-1">Supported formats: JPG, PNG, PDF (max 5MB)</p>
              </div>
              <button
                type="submit"
                disabled={saving || kycStatus === 'Pending' || kycStatus === 'Approved'}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3 rounded-xl hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-orange/20"
              >
                {saving ? (
                  <><i className="fa-solid fa-spinner fa-spin"></i> Submitting...</>
                ) : (
                  <><i className="fa-solid fa-upload"></i> Submit KYC</>
                )}
              </button>
              {kycStatus === 'Pending' && (
                <p className="text-yellow-400 text-sm flex items-center gap-2">
                  <i className="fa-regular fa-clock"></i> Your KYC is pending review.
                </p>
              )}
              {kycStatus === 'Approved' && (
                <p className="text-green-400 text-sm flex items-center gap-2">
                  <i className="fa-regular fa-circle-check"></i> Your KYC is approved! You can now withdraw larger amounts instantly.
                </p>
              )}
            </form>
          </div>
        </div>
      </DashboardLayout>

      {/* ===== Add Bank Modal ===== */}
      {showAddBankModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-2xl max-w-md w-full p-6 border border-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <i className="fa-solid fa-building-columns text-orange"></i>
                Add Bank Account
              </h2>
              <button
                onClick={() => setShowAddBankModal(false)}
                className="text-text-muted hover:text-text-primary transition text-xl"
              >
                <i className="fa-regular fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleAddBank} className="space-y-4">
              {/* Bank Search */}
              <div className="relative">
                <label className="block text-sm font-medium text-text-secondary mb-1">Select Bank</label>
                <div className="relative">
                  <input
                    type="text"
                    value={bankSearch}
                    onChange={(e) => {
                      setBankSearch(e.target.value);
                      setShowBankDropdown(true);
                      const filtered = bankList.filter(b =>
                        b.name.toLowerCase().includes(e.target.value.toLowerCase())
                      );
                      setFilteredBankList(filtered);
                    }}
                    onFocus={() => {
                      setShowBankDropdown(true);
                      if (bankList.length === 0) fetchBankList();
                    }}
                    className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20"
                    placeholder="Search for your bank..."
                    required
                  />
                  {loadingBanks && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2">
                      <i className="fa-solid fa-spinner fa-spin text-text-muted"></i>
                    </span>
                  )}
                </div>

                {showBankDropdown && filteredBankList.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-bg-card border border-border rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                    {filteredBankList.map((bank) => (
                      <button
                        key={bank.code}
                        type="button"
                        onClick={() => {
                          setSelectedBank(bank);
                          setBankSearch(bank.name);
                          setShowBankDropdown(false);
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-orange/10 hover:text-orange transition text-sm flex items-center gap-2 border-b border-border/50 last:border-0"
                      >
                        <span>{bank.name}</span>
                        {selectedBank?.code === bank.code && (
                          <span className="ml-auto text-green-400">
                            <i className="fa-regular fa-circle-check"></i>
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Account Number</label>
                <div className="relative">
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20"
                    placeholder="10-digit account number"
                    required
                    maxLength="10"
                  />
                  {selectedBank && accountNumber.length >= 10 && (
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
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Account Name</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20"
                  placeholder="Account holder name"
                  required
                />
              </div>

              {message && (
                <div className={`flex items-center gap-2 text-sm ${messageType === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  <i className={`fa-regular ${messageType === 'success' ? 'fa-circle-check' : 'fa-circle-xmark'}`}></i>
                  <span>{message}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3 rounded-xl hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-orange/20"
                >
                  {saving ? (
                    <><i className="fa-solid fa-spinner fa-spin"></i> Adding...</>
                  ) : (
                    <><i className="fa-solid fa-plus"></i> Add Bank</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddBankModal(false)}
                  className="flex-1 border border-border text-text-primary py-3 rounded-xl hover:border-orange transition flex items-center justify-center gap-2"
                >
                  <i className="fa-regular fa-xmark"></i> Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
