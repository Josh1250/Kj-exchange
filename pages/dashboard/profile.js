import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../_app';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../lib/supabaseClient';
import Head from 'next/head';

export default function Profile() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [kycLevel, setKycLevel] = useState(1);
  const [kycStatus, setKycStatus] = useState('Not Submitted');
  const [bvn, setBvn] = useState('');
  const [idFile, setIdFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data } = await supabase
        .from('users')
        .select('full_name, phone, bank_name, account_number, account_name, kyc_level, kyc_status, bvn')
        .eq('id', user.id)
        .single();
      if (data) {
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
        setBankName(data.bank_name || '');
        setAccountNumber(data.account_number || '');
        setAccountName(data.account_name || '');
        setKycLevel(data.kyc_level || 1);
        setKycStatus(data.kyc_status || 'Not Submitted');
        setBvn(data.bvn || '');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

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
          bank_name: bankName,
          account_number: accountNumber,
          account_name: accountName,
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
      // For now, we'll just update the database with BVN and pending status
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
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold">Profile</h1>

          <div className="bg-bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-orange/20 flex items-center justify-center text-orange text-3xl font-bold">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xl font-bold">{fullName || user?.email?.split('@')[0]}</p>
                <p className="text-text-muted text-sm">{user?.email}</p>
                <p className="text-xs text-orange">KYC Level: {kycLevel} — {kycStatus}</p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-lg px-4 py-2 text-text-primary focus:border-orange focus:outline-none"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-lg px-4 py-2 text-text-primary focus:border-orange focus:outline-none"
                  placeholder="e.g., 08012345678"
                />
              </div>
              <div className="border-t border-border pt-4">
                <h3 className="font-semibold mb-3">Bank Details (For Withdrawals)</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full bg-black/40 border border-border rounded-lg px-4 py-2 text-text-primary focus:border-orange focus:outline-none"
                      placeholder="e.g., GTBank"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Account Number</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full bg-black/40 border border-border rounded-lg px-4 py-2 text-text-primary focus:border-orange focus:outline-none"
                      placeholder="10-digit account number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Account Name</label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="w-full bg-black/40 border border-border rounded-lg px-4 py-2 text-text-primary focus:border-orange focus:outline-none"
                      placeholder="Account holder name"
                    />
                  </div>
                </div>
              </div>

              {message && (
                <p className={`text-sm ${messageType === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  <i className={`fa-regular ${messageType === 'success' ? 'fa-circle-check' : 'fa-circle-xmark'} mr-1`}></i>
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-orange text-white font-bold py-3 rounded-full hover:bg-orange-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <><i className="fa-solid fa-spinner fa-spin"></i> Saving...</> : <><i className="fa-regular fa-floppy-disk mr-2"></i> Save Changes</>}
              </button>
            </form>
          </div>

          {/* KYC Section */}
          <div className="bg-bg-card rounded-2xl p-6 border border-border">
            <h2 className="text-lg font-bold mb-4">KYC Verification</h2>
            <p className="text-text-muted text-sm mb-4">Level 2 required for withdrawals above ₦50,000.</p>
            <form onSubmit={handleKycSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">BVN (11 digits)</label>
                <input
                  type="text"
                  value={bvn}
                  onChange={(e) => setBvn(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-lg px-4 py-2 text-text-primary focus:border-orange focus:outline-none"
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
                  className="w-full bg-black/40 border border-border rounded-lg px-4 py-2 text-text-primary focus:border-orange focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={saving || kycStatus === 'Pending' || kycStatus === 'Approved'}
                className="w-full bg-orange text-white font-bold py-3 rounded-full hover:bg-orange-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <><i className="fa-solid fa-spinner fa-spin"></i> Submitting...</> : <><i className="fa-solid fa-upload mr-2"></i> Submit KYC</>}
              </button>
              {kycStatus === 'Pending' && <p className="text-yellow-400 text-sm">⏳ Your KYC is pending review.</p>}
              {kycStatus === 'Approved' && <p className="text-green-400 text-sm">✅ Your KYC is approved! You can now withdraw larger amounts.</p>}
            </form>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
