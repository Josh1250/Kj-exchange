import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../_app';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../lib/supabaseClient';
import Head from 'next/head';
import Link from 'next/link';

export default function Settings() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [kycLevel, setKycLevel] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      // Get user data
      setEmail(user.email || '');
      setUsername(user.user_metadata?.username || '');

      // Get phone from users table
      const { data, error } = await supabase
        .from('users')
        .select('phone, kyc_level, username')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setPhone(data.phone || '');
        setKycLevel(data.kyc_level || 1);
        if (data.username) setUsername(data.username);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setIsSaving(true);

    try {
      // Update username in auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { username: username }
      });

      if (authError) throw authError;

      // Update phone and username in users table
      const { error: dbError } = await supabase
        .from('users')
        .update({
          phone: phone,
          username: username,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (dbError) throw dbError;

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setIsChangingPassword(true);

    try {
      // Update password using Supabase
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to change password' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const getKycBadge = (level) => {
    switch (level) {
      case 0: return { label: 'Unverified', color: 'bg-red-400/20 text-red-400' };
      case 1: return { label: 'Basic', color: 'bg-yellow-400/20 text-yellow-400' };
      case 2: return { label: 'Verified', color: 'bg-green-400/20 text-green-400' };
      default: return { label: 'Basic', color: 'bg-yellow-400/20 text-yellow-400' };
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-text-primary">Loading...</div>;
  if (!user) return null;

  const kycInfo = getKycBadge(kycLevel);

  return (
    <>
      <Head>
        <title>Settings · KJ Exchange</title>
      </Head>
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6 pb-24">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-text-muted text-sm">Manage your account and preferences</p>
          </div>

          {/* Message */}
          {message.text && (
            <div className={`p-4 rounded-xl ${
              message.type === 'success' 
                ? 'bg-green-400/10 text-green-400 border border-green-400/20' 
                : 'bg-red-400/10 text-red-400 border border-red-400/20'
            }`}>
              {message.text}
            </div>
          )}

          {/* Profile Section */}
          <div className="glass rounded-2xl p-6 border border-border">
            <h2 className="text-lg font-bold mb-4">Profile Information</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-text-muted text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-4 py-3 rounded-xl bg-black/30 border border-border text-text-muted cursor-not-allowed"
                />
                <p className="text-xs text-text-muted mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-text-muted text-sm font-medium mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your username"
                  className="w-full px-4 py-3 rounded-xl bg-black/30 border border-border focus:border-orange outline-none transition text-text-primary placeholder-text-muted"
                />
              </div>

              <div>
                <label className="block text-text-muted text-sm font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08012345678"
                  className="w-full px-4 py-3 rounded-xl bg-black/30 border border-border focus:border-orange outline-none transition text-text-primary placeholder-text-muted"
                />
              </div>

              <div>
                <label className="block text-text-muted text-sm font-medium mb-1">KYC Level</label>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${kycInfo.color}`}>
                    {kycInfo.label}
                  </span>
                  {kycLevel < 2 && (
                    <Link href="/dashboard/kyc" className="text-orange text-sm hover:underline">
                      Upgrade →
                    </Link>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3 rounded-xl font-semibold transition bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-lg hover:shadow-orange/30 disabled:opacity-50"
              >
                {isSaving ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Security Section */}
          <div className="glass rounded-2xl p-6 border border-border">
            <h2 className="text-lg font-bold mb-4">Security</h2>
            <div className="space-y-3">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-black/30 border border-border hover:border-orange transition group"
              >
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-lock text-orange"></i>
                  <span className="font-medium text-sm">Change Password</span>
                </div>
                <i className="fa-solid fa-chevron-right text-text-muted text-sm group-hover:text-orange transition"></i>
              </button>

              <button
                onClick={() => setShowLogoutModal(true)}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-black/30 border border-border hover:border-red-500/50 transition group"
              >
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-sign-out-alt text-red-400"></i>
                  <span className="font-medium text-sm text-red-400">Logout</span>
                </div>
                <i className="fa-solid fa-chevron-right text-text-muted text-sm group-hover:text-red-400 transition"></i>
              </button>
            </div>
          </div>

          {/* Account Section */}
          <div className="glass rounded-2xl p-6 border border-border">
            <h2 className="text-lg font-bold mb-4">Account</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-xl bg-black/30 border border-border">
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-user text-text-muted"></i>
                  <div>
                    <p className="font-medium text-sm">Account Status</p>
                    <p className="text-xs text-text-muted">Active</p>
                  </div>
                </div>
                <span className="text-xs bg-green-400/20 text-green-400 px-2 py-0.5 rounded-full">Active</span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-black/30 border border-border">
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-calendar text-text-muted"></i>
                  <div>
                    <p className="font-medium text-sm">Member Since</p>
                    <p className="text-xs text-text-muted">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="glass rounded-2xl p-6 border border-red-500/20 bg-red-500/5">
            <h2 className="text-lg font-bold text-red-400 mb-2">Danger Zone</h2>
            <p className="text-text-muted text-sm mb-4">These actions are irreversible. Proceed with caution.</p>
            <button className="w-full py-3 rounded-xl font-semibold transition border border-red-500/30 text-red-400 hover:bg-red-500/10">
              <i className="fa-solid fa-triangle-exclamation mr-2"></i>
              Deactivate Account
            </button>
          </div>
        </div>

        {/* ===== CHANGE PASSWORD MODAL ===== */}
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="glass rounded-2xl p-6 border border-border max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Change Password</h2>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-text-muted hover:text-text-primary transition"
                >
                  <i className="fa-solid fa-xmark text-2xl"></i>
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-text-muted text-sm font-medium mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-4 py-3 rounded-xl bg-black/30 border border-border focus:border-orange outline-none transition text-text-primary placeholder-text-muted"
                    minLength="6"
                    required
                  />
                </div>

                <div>
                  <label className="block text-text-muted text-sm font-medium mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-3 rounded-xl bg-black/30 border border-border focus:border-orange outline-none transition text-text-primary placeholder-text-muted"
                    minLength="6"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 py-3 rounded-xl font-semibold border border-border text-text-muted hover:text-text-primary transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="flex-1 py-3 rounded-xl font-semibold transition bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-lg hover:shadow-orange/30 disabled:opacity-50"
                  >
                    {isChangingPassword ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===== LOGOUT MODAL ===== */}
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="glass rounded-2xl p-6 border border-border max-w-sm w-full">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-red-400/10 flex items-center justify-center text-red-400 text-3xl mb-4">
                  <i className="fa-solid fa-sign-out-alt"></i>
                </div>
                <h2 className="text-xl font-bold mb-2">Logout?</h2>
                <p className="text-text-muted text-sm mb-6">Are you sure you want to logout?</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="flex-1 py-3 rounded-xl font-semibold border border-border text-text-muted hover:text-text-primary transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 py-3 rounded-xl font-semibold transition bg-red-500 text-white hover:bg-red-600"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </>
  );
}
