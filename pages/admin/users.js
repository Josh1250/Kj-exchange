import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import AdminLayout from '../../components/layout/AdminLayout';
import Head from 'next/head';

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

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      let { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const storedEmail = localStorage.getItem('sb-user-email');
        if (storedEmail === 'okolijoshua16@gmail.com') {
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
      const { data, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();
      if (error || !data?.is_admin) {
        router.push('/dashboard');
        return;
      }
      setIsAdmin(true);
      setLoading(false);
      fetchUsers();
    };
    checkAuth();
  }, [router]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      // Get all users with their wallet balances
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Get wallet balances for each user
      const { data: wallets, error: walletsError } = await supabase
        .from('wallets')
        .select('*');
      if (walletsError) throw walletsError;

      // Merge wallet data into users
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
      alert('Failed to fetch users.');
    } finally {
      setIsLoading(false);
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

  return (
    <>
      <Head><title>Admin Users · KJ Exchange</title></Head>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h1 className="text-2xl font-bold">Manage Users</h1>
            <div className="flex gap-2">
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
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black/30">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">KYC</th>
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
                          <div className="flex gap-1">
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

      {/* User Detail Modal */}
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
              {/* Basic Info */}
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
              </div>

              {/* Bank Details */}
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

              {/* BVN */}
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

              {/* Wallet Balances */}
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

              {/* Actions */}
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
