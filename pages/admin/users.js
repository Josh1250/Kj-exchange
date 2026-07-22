import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from '../../components/layout/AdminLayout';
import Head from 'next/head';

// 🔥 Set your admin email here – change if different
const ADMIN_EMAIL = 'okolijoshua16@gmail.com';

export default function AdminUsers() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // 1. Get session
      let { data: { session } } = await supabase.auth.getSession();

      // 2. If no session, try localStorage (as before)
      if (!session) {
        const storedEmail = localStorage.getItem('sb-user-email');
        if (storedEmail === ADMIN_EMAIL) {
          setIsAdmin(true);
          setLoading(false);
          fetchUsers();
          return;
        }
        const accessToken = localStorage.getItem('sb-access-token');
        const refreshToken = localStorage.getItem('sb-refresh-token');
        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!error && data.session) {
            session = data.session;
          }
        }
      }

      if (!session) {
        router.push('/auth/login');
        return;
      }

      // 3. 🔥 FORCE ADMIN IF EMAIL MATCHES – SKIP ANY DATABASE QUERY
      const userEmail = session.user?.email;
      if (userEmail === ADMIN_EMAIL) {
        console.log('✅ Admin email matched – granting access without DB check.');
        setIsAdmin(true);
        setLoading(false);
        fetchUsers();

        // (Optional) Update DB in background so it works later
        supabase
          .from('users')
          .update({ is_admin: true })
          .eq('id', session.user.id)
          .then(({ error }) => {
            if (error) console.warn('Could not update admin flag:', error);
          });
        return;
      }

      // 4. For other users, do the normal admin check
      let isAdminUser = false;
      try {
        const { data, error } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();
        if (!error && data?.is_admin === true) {
          isAdminUser = true;
        }
      } catch (e) {
        console.error('Admin query error:', e);
      }

      if (!isAdminUser) {
        router.push('/dashboard');
        return;
      }

      setIsAdmin(true);
      setLoading(false);
      fetchUsers();
    };

    checkAuth();
  }, [router]);

  // ... the rest of your component (fetchUsers, syncUsers, handlers, etc.) stays exactly as before.
  // To save space, I'll include it all – but you already have the full code from the last message.
  // For brevity here, I'll assume you copy the full file from the last message and just replace the checkAuth part.
  // But since we're providing a complete file, I'll include everything.

  // ----- All your existing functions (fetchUsers, syncUsers, handleApproveKyc, handleBanUser, etc.) -----
  // They are the same as the previous version – I'll include them for completeness.

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      const { data: wallets, error: walletsError } = await supabase
        .from('wallets')
        .select('*');
      if (walletsError) throw walletsError;

      const usersWithWallets = usersData.map(user => {
        const wallet = wallets?.find(w => w.user_id === user.id);
        return {
          ...user,
          wallet_balance: wallet?.balance || 0,
          usd_balance: wallet?.usd_balance || 0,
          ghs_balance: wallet?.ghs_balance || 0,
          gift_points: wallet?.gift_points || 0,
        };
      });

      setUsers(usersWithWallets);
      setFilteredUsers(usersWithWallets);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const syncUsers = async () => {
    if (!confirm('Sync all users from auth to your admin panel?')) return;
    setSyncing(true);
    try {
      const response = await fetch('/api/admin/sync-users', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        alert(data.message || 'Users synced successfully!');
        fetchUsers();
      } else {
        alert('Sync failed: ' + data.error);
      }
    } catch (err) {
      alert('Failed to sync users.');
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  // Search handler
  useEffect(() => {
    if (search.trim() === '') {
      setFilteredUsers(users);
    } else {
      const lower = search.toLowerCase();
      setFilteredUsers(users.filter(u =>
        u.email?.toLowerCase().includes(lower) ||
        u.full_name?.toLowerCase().includes(lower) ||
        u.phone?.includes(search)
      ));
    }
  }, [search, users]);

  const handleApproveKyc = async (userId) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ kyc_status: 'Approved', kyc_level: 2 })
        .eq('id', userId);
      if (error) throw error;
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          message: '✅ Your KYC has been approved! You can now withdraw up to ₦50,000.',
        });
      alert('✅ KYC approved.');
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('❌ Failed to approve KYC.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectKyc = async (userId) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ kyc_status: 'Rejected' })
        .eq('id', userId);
      if (error) throw error;
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          message: '❌ Your KYC was rejected. Please submit valid documents.',
        });
      alert('❌ KYC rejected.');
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Failed to reject KYC.');
    } finally {
      setProcessing(false);
    }
  };

  const handleBanUser = async (userId, ban) => {
    if (!confirm(`Are you sure you want to ${ban ? 'ban' : 'unban'} this user?`)) return;
    setProcessing(true);
    try {
      const res = await fetch('/api/admin/ban-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ban }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchUsers();
      } else {
        alert('Failed: ' + data.error);
      }
    } catch (err) {
      alert('Error banning user.');
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('⚠️ This will permanently delete the user and all their data. Are you sure?')) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/delete-user?userId=${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchUsers();
      } else {
        alert('Failed: ' + data.error);
      }
    } catch (err) {
      alert('Error deleting user.');
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const openUserModal = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  if (loading) return <div>Loading admin panel...</div>;
  if (!isAdmin) return null;

  // ----- The JSX is identical to the previous version – I'll include it here for completeness -----
  return (
    <>
      <Head><title>Admin Users · KJ Exchange</title></Head>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h1 className="text-2xl font-bold">Manage Users</h1>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"></i>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, phone..."
                  className="bg-black/40 border border-border rounded-xl pl-10 pr-4 py-2 text-text-primary focus:border-orange focus:outline-none text-sm"
                />
              </div>
              <button
                onClick={fetchUsers}
                className="flex items-center gap-2 text-text-muted hover:text-text-primary transition text-sm px-4 py-2 rounded-full border border-border hover:border-orange"
              >
                <i className="fa-solid fa-rotate"></i> Refresh
              </button>
              <button
                onClick={syncUsers}
                disabled={syncing}
                className="flex items-center gap-2 text-orange hover:text-orange-light transition text-sm px-4 py-2 rounded-full border border-orange/30 hover:border-orange"
              >
                <i className="fa-solid fa-cloud-upload-alt"></i>
                {syncing ? 'Syncing...' : 'Sync Users'}
              </button>
            </div>
          </div>

          <div className="bg-bg-card rounded-2xl border border-border overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <i className="fa-solid fa-spinner fa-spin text-2xl text-orange"></i>
                <span className="ml-3 text-text-muted">Loading users...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-text-muted">No users found.</p>
                <button
                  onClick={syncUsers}
                  className="mt-2 text-orange hover:underline text-sm"
                >
                  Sync users from auth
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black/30">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">KYC</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Wallet</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Joined</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-white/5 transition">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-orange/20 flex items-center justify-center text-orange font-bold text-sm">
                              {u.full_name?.charAt(0) || u.email?.charAt(0) || 'U'}
                            </div>
                            <span className="font-medium">{u.full_name || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-text-muted text-sm">{u.email}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${
                            u.kyc_status === 'Approved' ? 'bg-green-400/20 text-green-400 border-green-400/20' :
                            u.kyc_status === 'Pending' ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400/20' :
                            u.kyc_status === 'Rejected' ? 'bg-red-400/20 text-red-400 border-red-400/20' :
                            'bg-gray-400/20 text-gray-400 border-gray-400/20'
                          }`}>
                            {u.kyc_status || 'Not Submitted'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${
                            u.banned ? 'bg-red-400/20 text-red-400 border-red-400/20' : 'bg-green-400/20 text-green-400 border-green-400/20'
                          }`}>
                            {u.banned ? 'Banned' : 'Active'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex gap-1 text-xs">
                            <span className="text-green-400">₦{u.wallet_balance.toLocaleString()}</span>
                            <span className="text-blue-400">${u.usd_balance.toFixed(2)}</span>
                            <span className="text-yellow-400">₵{u.ghs_balance.toFixed(2)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-text-muted text-sm">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex gap-1 flex-wrap">
                            <button
                              onClick={() => openUserModal(u)}
                              className="bg-orange/10 hover:bg-orange/20 text-orange px-3 py-1 rounded-lg text-xs font-semibold transition"
                            >
                              <i className="fa-regular fa-eye mr-1"></i>View
                            </button>
                            {u.kyc_status === 'Pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveKyc(u.id)}
                                  disabled={processing}
                                  className="bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-green-600 transition disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectKyc(u.id)}
                                  disabled={processing}
                                  className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-red-600 transition disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleBanUser(u.id, !u.banned)}
                              disabled={processing}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold transition disabled:opacity-50 ${
                                u.banned 
                                  ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                              }`}
                            >
                              {u.banned ? 'Unban' : 'Ban'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              disabled={processing}
                              className="bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-red-700 transition disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>

      {/* Modal – same as before */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border shadow-2xl">
            <div className="sticky top-0 bg-bg-card/90 backdrop-blur-sm p-4 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-bold">User Details</h2>
              <button onClick={closeModal} className="text-text-muted hover:text-text-primary transition">
                <i className="fa-solid fa-xmark text-2xl"></i>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wider">Full Name</p>
                  <p className="font-medium">{selectedUser.full_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wider">Email</p>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wider">Phone</p>
                  <p className="font-medium">{selectedUser.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wider">KYC Status</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    selectedUser.kyc_status === 'Approved' ? 'bg-green-400/20 text-green-400 border-green-400/20' :
                    selectedUser.kyc_status === 'Pending' ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400/20' :
                    selectedUser.kyc_status === 'Rejected' ? 'bg-red-400/20 text-red-400 border-red-400/20' :
                    'bg-gray-400/20 text-gray-400 border-gray-400/20'
                  }`}>
                    {selectedUser.kyc_status || 'Not Submitted'}
                  </span>
                </div>
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wider">Account Status</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    selectedUser.banned ? 'bg-red-400/20 text-red-400 border-red-400/20' : 'bg-green-400/20 text-green-400 border-green-400/20'
                  }`}>
                    {selectedUser.banned ? 'Banned' : 'Active'}
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="font-semibold mb-2">Bank Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-text-muted text-xs uppercase tracking-wider">Bank</p>
                    <p className="font-medium">{selectedUser.bank_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-text-muted text-xs uppercase tracking-wider">Account Number</p>
                    <p className="font-medium">{selectedUser.account_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-text-muted text-xs uppercase tracking-wider">Account Name</p>
                    <p className="font-medium">{selectedUser.account_name || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="font-semibold mb-2">KYC Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-text-muted text-xs uppercase tracking-wider">BVN</p>
                    <p className="font-medium">{selectedUser.bvn || 'Not Provided'}</p>
                  </div>
                  <div>
                    <p className="text-text-muted text-xs uppercase tracking-wider">KYC Level</p>
                    <p className="font-medium">Level {selectedUser.kyc_level || 1}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="font-semibold mb-2">Wallet Balances</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-black/20 rounded-xl p-3 text-center">
                    <p className="text-text-muted text-xs">Naira</p>
                    <p className="text-lg font-bold text-green-400">₦{selectedUser.wallet_balance.toLocaleString()}</p>
                  </div>
                  <div className="bg-black/20 rounded-xl p-3 text-center">
                    <p className="text-text-muted text-xs">USD</p>
                    <p className="text-lg font-bold text-blue-400">${selectedUser.usd_balance.toFixed(2)}</p>
                  </div>
                  <div className="bg-black/20 rounded-xl p-3 text-center">
                    <p className="text-text-muted text-xs">GHS</p>
                    <p className="text-lg font-bold text-yellow-400">₵{selectedUser.ghs_balance.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4 flex flex-wrap gap-3">
                {selectedUser.kyc_status === 'Pending' && (
                  <>
                    <button
                      onClick={() => {
                        handleApproveKyc(selectedUser.id);
                        closeModal();
                      }}
                      disabled={processing}
                      className="bg-green-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-600 transition disabled:opacity-50"
                    >
                      Approve KYC
                    </button>
                    <button
                      onClick={() => {
                        handleRejectKyc(selectedUser.id);
                        closeModal();
                      }}
                      disabled={processing}
                      className="bg-red-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-red-600 transition disabled:opacity-50"
                    >
                      Reject KYC
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    handleBanUser(selectedUser.id, !selectedUser.banned);
                    closeModal();
                  }}
                  disabled={processing}
                  className={`px-4 py-2 rounded-xl font-semibold transition disabled:opacity-50 ${
                    selectedUser.banned 
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  {selectedUser.banned ? 'Unban User' : 'Ban User'}
                </button>
                <button
                  onClick={() => {
                    handleDeleteUser(selectedUser.id);
                    closeModal();
                  }}
                  disabled={processing}
                  className="bg-red-700 text-white px-4 py-2 rounded-xl font-semibold hover:bg-red-800 transition disabled:opacity-50"
                >
                  Delete Permanently
                </button>
                <button
                  onClick={closeModal}
                  className="border border-border text-text-primary px-4 py-2 rounded-xl hover:border-orange transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
