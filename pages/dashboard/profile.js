import { useEffect, useState } from 'react';
import { useAuth } from '../_app';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../lib/supabaseClient';
import Head from 'next/head';

export default function Profile() {
  const { user, loading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('users')
      .select('full_name, phone, bank_name, account_number, account_name')
      .eq('id', user.id)
      .single();
    if (data) {
      setFullName(data.full_name || '');
      setPhone(data.phone || '');
      setBankName(data.bank_name || '');
      setAccountNumber(data.account_number || '');
      setAccountName(data.account_name || '');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
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
    if (error) {
      setMessage('Error saving profile.');
      console.error(error);
    } else {
      setMessage('Profile updated successfully!');
    }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return null;

  return (
    <>
      <Head>
        <title>Profile · KJ Exchange</title>
      </Head>
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Profile</h1>

          <div className="bg-bg-card rounded-2xl p-6 border border-border">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-orange/20 flex items-center justify-center text-orange text-3xl font-bold">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xl font-bold">{fullName || user?.email?.split('@')[0]}</p>
                <p className="text-text-muted text-sm">{user?.email}</p>
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
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-lg px-4 py-2 text-text-primary focus:border-orange focus:outline-none"
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
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Account Number</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full bg-black/40 border border-border rounded-lg px-4 py-2 text-text-primary focus:border-orange focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Account Name</label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="w-full bg-black/40 border border-border rounded-lg px-4 py-2 text-text-primary focus:border-orange focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {message && <p className="text-green-400 text-sm">{message}</p>}

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-orange text-white font-bold py-3 rounded-full hover:bg-orange-600 transition disabled:opacity-50"
              >
                {saving ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Saving...</> : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
