import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../_app';
import Layout from '../../components/layout/Layout';
import { supabase } from '../../lib/supabaseClient';
import Head from 'next/head';

export default function Wallet() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [autoSell, setAutoSell] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchWalletData();
      fetchUserProfile();
      fetchAutoSellSettings();
    }
  }, [user]);

  const fetchWalletData = async () => {
    try {
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (wallet) {
        setBalance(wallet.balance);
      }

      const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (txs) {
        setTransactions(txs);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    const { data } = await supabase
      .from('users')
      .select('bank_name, account_number, account_name')
      .eq('id', user.id)
      .single();

    if (data) {
      setBankName(data.bank_name || '');
      setAccountNumber(data.account_number || '');
      setAccountName(data.account_name || '');
    }
  };

  const fetchAutoSellSettings = async () => {
    const { data } = await supabase
      .from('auto_sell_settings')
      .select('enabled')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setAutoSell(data.enabled);
    }
  };

  const toggleAutoSell = async () => {
    const newState = !autoSell;
    setAutoSell(newState);

    await supabase
      .from('auto_sell_settings')
      .upsert({
        user_id: user.id,
        enabled: newState,
      });
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amount > balance) {
      setError('Insufficient balance');
      return;
    }

    if (!bankName || !accountNumber || !accountName) {
      setError('Please update your bank details first');
      return;
    }

    // Create withdrawal transaction
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'withdrawal',
        amount: -amount,
        status: 'pending',
        metadata: {
          bank_name: bankName,
          account_number: accountNumber,
          account_name: accountName,
        },
      })
      .select();

    if (error) {
      setError('Failed to process withdrawal');
      return;
    }

    // Update wallet balance
    const { error: balanceError } = await supabase
      .from('wallets')
      .update({ balance: balance - amount })
      .eq('user_id', user.id);

    if (balanceError) {
      setError('Failed to update balance');
      return;
    }

    setSuccess(`Withdrawal of ₦${amount.toLocaleString()} initiated!`);
    setWithdrawAmount('');
    fetchWalletData();
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-text-primary">Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>Wallet · KJ Exchange</title>
      </Head>
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">My Wallet</h1>

          {/* Balance */}
          <div className="bg-gradient-to-r from-purple/20 to-orange/10 rounded-2xl p-8 border border-border mb-8">
            <p className="text-text-muted text-sm">Total Balance</p>
            <p className="text-5xl font-bold">₦{balance.toLocaleString()}</p>
            <p className="text-text-muted text-sm mt-1">≈ ${(balance / 1550).toFixed(2)} USD</p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-bg-card p-4 rounded-xl text-center border border-border">
              <div className="text-2xl mb-1">🏦</div>
              <p className="text-sm font-semibold">Deposit</p>
            </div>
            <button
              onClick={() => document.getElementById('withdraw-form').scrollIntoView({ behavior: 'smooth' })}
              className="bg-bg-card p-4 rounded-xl text-center hover:border-orange transition border border-border"
            >
              <div className="text-2xl mb-1">💸</div>
              <p className="text-sm font-semibold">Withdraw</p>
            </button>
            <div className="bg-bg-card p-4 rounded-xl text-center border border-border">
              <div className="text-2xl mb-1">🔄</div>
              <p className="text-sm font-semibold">Swap</p>
            </div>
            <div
              className={`bg-bg-card p-4 rounded-xl text-center border border-border cursor-pointer hover:border-orange transition ${autoSell ? 'border-green-400/30' : ''}`}
              onClick={toggleAutoSell}
            >
              <div className="text-2xl mb-1">⚡</div>
              <p className="text-sm font-semibold">Auto Sell</p>
              <span className={`text-xs ${autoSell ? 'text-green-400' : 'text-text-muted'}`}>
                {autoSell ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>

          {/* Auto Sell Status */}
          <div className="bg-bg-card rounded-2xl p-6 border border-border mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">⚡ Auto Sell</h3>
                <p className="text-text-muted text-sm">
                  {autoSell
                    ? 'Your crypto will auto-convert to Naira when received'
                    : 'Auto Sell is disabled'}
                </p>
              </div>
              <button
                onClick={toggleAutoSell}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                  autoSell
                    ? 'bg-green-400/20 text-green-400 border border-green-400/30'
                    : 'bg-gray-400/20 text-text-muted border border-border'
                }`}
              >
                {autoSell ? '✅ On' : '❌ Off'}
              </button>
            </div>
          </div>

          {/* Withdraw Form */}
          <div id="withdraw-form" className="bg-bg-card rounded-2xl p-6 border border-border mb-8">
            <h2 className="text-xl font-bold mb-4">💸 Withdraw Funds</h2>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Amount (₦)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-lg px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                  placeholder="Enter amount"
                  required
                  min="100"
                  step="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-lg px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                  placeholder="e.g., GTBank"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-lg px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                  placeholder="Enter 10-digit account number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Account Name</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-lg px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                  placeholder="Account holder name"
                />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              {success && <p className="text-green-400 text-sm">{success}</p>}
              <button
                type="submit"
                className="w-full bg-orange text-white font-bold py-3 rounded-full hover:bg-orange-light transition"
              >
                Withdraw
              </button>
            </form>
          </div>

          {/* Transaction History */}
          <div className="bg-bg-card rounded-2xl p-6 border border-border">
            <h2 className="text-xl font-bold mb-4">Transaction History</h2>
            {isLoading ? (
              <p className="text-text-muted">Loading transactions...</p>
            ) : transactions.length === 0 ? (
              <p className="text-text-muted">No transactions yet.</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center border-b border-border pb-3">
                    <div>
                      <p className="font-semibold capitalize">{tx.type.replace('_', ' ')}</p>
                      <p className="text-text-muted text-xs">
                        {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                      </p>
                      <span className={`text-xs ${tx.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
}
