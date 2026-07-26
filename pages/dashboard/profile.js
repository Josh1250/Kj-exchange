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
  const [kycTier, setKycTier] = useState(1);
  const [kycStatus, setKycStatus] = useState('Not Submitted');
  const [bvn, setBvn] = useState('');
  const [nin, setNin] = useState('');
  const [idFile, setIdFile] = useState(null);

  // ===== KYC Modal =====
  const [showKycModal, setShowKycModal] = useState(false);
  const [kycOption, setKycOption] = useState(''); // 'bvn', 'nin', 'document'
  const [kycNumber, setKycNumber] = useState('');
  const [documentFile, setDocumentFile] = useState(null);
  const [documentType, setDocumentType] = useState('');

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
      // Get username from user metadata or fallback to users table
      const metaUsername = user?.user_metadata?.username;
      
      const { data } = await supabase
        .from('users')
        .select('full_name, phone, kyc_level, kyc_tier, kyc_status, bvn, nin, username')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setFullName(data.full_name || '');
        setUsername(data.username || metaUsername || '');
        setPhone(data.phone || '');
        setKycLevel(data.kyc_level || 1);
        setKycTier(data.kyc_tier || 1);
        setKycStatus(data.kyc_status || 'Not Submitted');
        setBvn(data.bvn || '');
        setNin(data.nin || '');
      } else if (metaUsername) {
        setUsername(metaUsername);
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

  // ===== Save Profile =====
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setMessageType('');

    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: fullName,
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
  const handleKycSubmit = async () => {
    if (kycTier === 1) {
      // Tier 2: BVN or NIN
      if (!kycOption || !kycNumber || kycNumber.length !== 11) {
        setMessage('Please enter a valid 11-digit number.');
        setMessageType('error');
        return;
      }

      setSaving(true);
      setMessage('');
      setMessageType('');

      try {
        const updateData = { kyc_status: 'Pending' };
        if (kycOption === 'bvn') updateData.bvn = kycNumber;
        if (kycOption === 'nin') updateData.nin = kycNumber;

        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', user.id);

        if (error) throw error;

        setKycStatus('Pending');
        setMessage('KYC submitted for review!');
        setMessageType('success');
        setShowKycModal(false);
        setKycOption('');
        setKycNumber('');
        fetchProfile();
      } catch (err) {
        setMessage('Error submitting KYC. Please try again.');
        setMessageType('error');
        console.error(err);
      } finally {
        setSaving(false);
      }
    } else if (kycTier === 2) {
      // Tier 3: Valid ID Document
      if (!documentFile) {
        setMessage('Please upload a valid ID document.');
        setMessageType('error');
        return;
      }
      if (!documentType) {
        setMessage('Please select a document type (e.g., Passport, Driver\'s License, NIN Slip).');
        setMessageType('error');
        return;
      }

      setSaving(true);
      setMessage('');
      setMessageType('');

      try {
        const fileExt = documentFile.name.split('.').pop();
        const fileName = `${user.id}-tier3-${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('kyc-documents')
          .upload(fileName, documentFile);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('kyc-documents')
          .getPublicUrl(fileName);

        const { error } = await supabase
          .from('users')
          .update({
            kyc_status: 'Pending',
            kyc_document_type: documentType,
            kyc_document_url: publicUrl,
          })
          .eq('id', user.id);

        if (error) throw error;

        setKycStatus('Pending');
        setMessage('Tier 3 KYC submitted for review!');
        setMessageType('success');
        setShowKycModal(false);
        setDocumentFile(null);
        setDocumentType('');
        fetchProfile();
      } catch (err) {
        setMessage('Error submitting Tier 3 KYC. Please try again.');
        setMessageType('error');
        console.error(err);
      } finally {
        setSaving(false);
      }
    }
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
          account_bank: selectedBank.code,
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

  const canUpgradeToTier3 = kycTier === 2 && kycStatus === 'Approved';

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
                  KYC Tier: {kycTier} — {kycStatus}
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

              {/* Username — Read-Only */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  <i className="fa-regular fa-at text-orange mr-1"></i>
                  Username (Permanent)
                </label>
                <div className="w-full bg-black/20 border border-border rounded-xl px-4 py-3 text-text-muted cursor-not-allowed flex items-center gap-2">
                  <i className="fa-regular fa-circle-check text-green-400"></i>
                  {username || 'Not set'}
                </div>
                <p className="text-xs text-text-muted mt-1">Username cannot be changed after registration.</p>
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

            {/* Tier Display */}
            <div className="flex gap-3 mb-4">
              {[1, 2, 3].map((tier) => (
                <div
                  key={tier}
                  className={`flex-1 text-center p-3 rounded-xl border ${
                    kycTier >= tier
                      ? 'border-green-400 bg-green-400/10 text-green-400'
                      : 'border-border bg-black/20 text-text-muted'
                  }`}
                >
                  <p className="font-bold text-sm">Tier {tier}</p>
                  {kycTier >= tier && <i className="fa-regular fa-circle-check text-xs"></i>}
                </div>
              ))}
            </div>

            {/* Tier Benefits */}
            <div className="bg-black/20 rounded-xl p-4 border border-border mb-4">
              <h3 className="font-semibold text-sm mb-2">Benefits</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Daily Cash Limit</span>
                  <span className="font-bold">
                    {kycTier === 1 && '₦3,000,000'}
                    {kycTier === 2 && '₦15,000,000'}
                    {kycTier >= 3 && '₦50,000,000'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Per Transaction</span>
                  <span className="font-bold">
                    {kycTier === 1 && '₦500,000'}
                    {kycTier === 2 && '₦1,000,000'}
                    {kycTier >= 3 && '₦2,000,000'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Deposit & Sell Crypto</span>
                  <span className="text-green-400">✅ Unlimited</span>
                </div>
              </div>
            </div>

            {/* Current Tier Status */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-muted">
                Your current tier is <span className="font-bold text-text-primary">{kycTier}</span>
              </p>
              {kycTier >= 2 && kycStatus === 'Approved' ? (
                <span className="text-green-400 text-sm font-semibold">✅ Verified</span>
              ) : kycStatus === 'Pending' ? (
                <span className="text-yellow-400 text-sm font-semibold">⏳ Pending Review</span>
              ) : (
                <button
                  onClick={() => setShowKycModal(true)}
                  className="bg-orange text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-orange-600 transition"
                >
                  Get started
                </button>
              )}
            </div>

            {/* Upgrade to Tier 3 (if eligible) */}
            {canUpgradeToTier3 && kycTier === 2 && (
              <div className="mt-4 p-4 bg-orange/5 border border-orange/20 rounded-xl">
                <p className="text-sm text-text-muted">You are Tier 2 verified.</p>
                <button
                  onClick={() => {
                    setKycOption('document');
                    setShowKycModal(true);
                  }}
                  className="mt-2 bg-orange text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-orange-600 transition"
                >
                  Upgrade to Tier 3
                </button>
              </div>
            )}

            {/* KYC Status Messages */}
            {kycStatus === 'Pending' && (
              <p className="text-yellow-400 text-sm flex items-center gap-2 mt-3">
                <i className="fa-regular fa-clock"></i> Your KYC is pending review.
              </p>
            )}
            {kycStatus === 'Approved' && kycTier >= 2 && (
              <p className="text-green-400 text-sm flex items-center gap-2 mt-3">
                <i className="fa-regular fa-circle-check"></i> KYC verified! You are now Tier {kycTier} with higher withdrawal limits.
              </p>
            )}
          </div>
        </div>
      </DashboardLayout>

      {/* ===== KYC Modal ===== */}
      {showKycModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-2xl max-w-md w-full p-6 border border-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {kycTier === 1 ? 'KYC Verification' : kycTier === 2 ? 'Upgrade to Tier 3' : 'KYC Verification'}
              </h2>
              <button
                onClick={() => setShowKycModal(false)}
                className="text-text-muted hover:text-text-primary transition text-xl"
              >
                <i className="fa-regular fa-xmark"></i>
              </button>
            </div>

            <p className="text-text-muted text-sm mb-4">
              {kycTier === 1 && 'Select an option below. Your data is encrypted and managed with strict confidentiality.'}
              {kycTier === 2 && 'Upload a valid ID document (Passport, Driver\'s License, or NIN Slip) to upgrade to Tier 3.'}
            </p>

            {kycTier === 1 ? (
              <div className="space-y-3">
                <button
                  onClick={() => setKycOption('bvn')}
                  className={`w-full p-4 rounded-xl border text-left transition ${
                    kycOption === 'bvn'
                      ? 'border-orange bg-orange/10'
                      : 'border-border bg-black/20 hover:border-orange/50'
                  }`}
                >
                  <p className="font-semibold">BVN</p>
                  <p className="text-text-muted text-xs">Bank Verification Number</p>
                </button>
                <button
                  onClick={() => setKycOption('nin')}
                  className={`w-full p-4 rounded-xl border text-left transition ${
                    kycOption === 'nin'
                      ? 'border-orange bg-orange/10'
                      : 'border-border bg-black/20 hover:border-orange/50'
                  }`}
                >
                  <p className="font-semibold">NIN</p>
                  <p className="text-text-muted text-xs">National Identification Number</p>
                </button>
              </div>
            ) : kycTier === 2 ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Document Type</label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                  >
                    <option value="">Select document type</option>
                    <option value="Passport">International Passport</option>
                    <option value="DriversLicense">Driver's License</option>
                    <option value="NIN">NIN Slip</option>
                    <option value="VotersCard">Voter's Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Upload ID Document</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setDocumentFile(e.target.files[0])}
                    className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                  />
                  <p className="text-text-muted text-xs mt-1">Supported: JPG, PNG, PDF (max 5MB)</p>
                </div>
              </div>
            ) : null}

            {kycOption && kycTier === 1 && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Enter {kycOption.toUpperCase()}
                  </label>
                  <input
                    type="text"
                    value={kycNumber}
                    onChange={(e) => setKycNumber(e.target.value)}
                    className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                    placeholder={`${kycOption.toUpperCase()} number (11 digits)`}
                    maxLength="11"
                    pattern="[0-9]{11}"
                  />
                  <p className="text-text-muted text-xs mt-1">
                    Your {kycOption.toUpperCase()} is safely encrypted and only used to verify your identity.
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleKycSubmit}
              disabled={saving || (kycTier === 1 && !kycOption) || (kycTier === 2 && !documentFile)}
              className="w-full bg-orange text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition shadow-lg shadow-orange/20 flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              {saving ? <><i className="fa-solid fa-spinner fa-spin"></i> Submitting...</> : 'Proceed'}
            </button>

            <p className="text-text-muted text-xs mt-4 text-center">
              {kycTier === 1 && `You consent to identity verification using your ${kycOption ? kycOption.toUpperCase() : 'selected option'}, by clicking proceed.`}
              {kycTier === 2 && 'By uploading your document, you consent to identity verification.'}
            </p>
          </div>
        </div>
      )}

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
                      {fetchingAccount ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Fetch Name'}
                    </button>
                  )}
                </div>
              </div>

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
                  {saving ? <><i className="fa-solid fa-spinner fa-spin"></i> Adding...</> : <><i className="fa-solid fa-plus"></i> Add Bank</>}
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
