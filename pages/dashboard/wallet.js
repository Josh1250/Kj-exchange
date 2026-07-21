import { useEffect, useState } from 'react';
import { useAuth } from '../_app';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

export default function Wallet() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [bonusBalance, setBonusBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpNote, setTopUpNote] = useState('');
  const [topUpStatus, setTopUpStatus] = useState('');

  const BTC_ADDRESS = '1HjJpZByFHnhSPZ37qStqCMUqVGaQvKw4i';
  const USDT_ADDRESS = 'TJpaXiQChRaGHaZzYqb3Qngf26EafH5CbH';

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const { data: wallet } = await supabase
          .from('wallets')
          .select('balance, bonus_balance')
          .eq('user_id', user.id)
          .single();
        if (wallet) {
          setBalance(wallet.balance || 0);
          setBonusBalance(wallet.bonus_balance || 0);
        }
        const { data: txs } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);
        setTransactions(txs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const totalBalance = balance + bonusBalance;

  const handleTopUpSubmit = async (e) => {
    e.preventDefault();
    if (!topUpAmount || parseFloat(topUpAmount) <= 0) {
      setTopUpStatus('Please enter a valid amount');
      return;
    }
    const { error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'deposit',
        amount: parseFloat(topUpAmount),
        status: 'pending',
        metadata: { note: topUpNote || 'Bank transfer deposit' },
      });
    if (error) {
      setTopUpStatus('Failed to submit request. Try again.');
      console.error(error);
    } else {
      setTopUpStatus('✅ Request submitted. We\'ll credit your wallet after verification.');
      setTopUpAmount('');
      setTopUpNote('');
      setTimeout(() => setTopUpStatus(''), 5000);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Wallet</h1>

        <div className="bg-gradient-to-r from-purple-900/30 to-orange-900/20 rounded-2xl p-6 border border-border">
          <p className="text-text-muted text-sm">Total Balance</p>
          <p className="text-4xl font-bold">₦{totalBalance.toLocaleString()}</p>
          {bonusBalance > 0 && (
            <p className="text-sm text-green-400">Includes ₦{bonusBalance.toLocaleString()} welcome bonus</p>
          )}
          <div className="flex gap-3 mt-4">
            <button className="bg-orange text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-orange-600 transition">
              <i className="fa-solid fa-arrow-down mr-2"></i>Withdraw
            </button>
            <button onClick={() => setShowTopUp(!showTopUp)} className="border border-border text-text-primary px-4 py-2 rounded-full text-sm font-semibold hover:border-orange transition">
              <i className="fa-solid fa-arrow-up mr-2"></i>Top Up
            </button>
          </div>
        </div>

        {showTopUp && (
          <div className="bg-bg-card rounded-2xl p-6 border border-border">
            <h3 className="font-bold mb-4">Top Up Your Wallet</h3>
            <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-3 mb-4 text-sm text-yellow-400">
              <p><i className="fa-solid fa-lightbulb mr-2"></i>Transfer to our bank account and submit the request below.</p>
              <p className="text-text-muted text-xs mt-1">Bank: OPay · Account: 6113794255 · Name: JOSHUA CHIMEZIE OKOLI</p>
            </div>
            <form onSubmit={handleTopUpSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Amount (₦)</label>
                <input
                  type="number"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-lg px-4 py-2 text-text-primary focus:border-orange focus:outline-none"
                  placeholder="Enter amount"
                  required
                  min="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Note (optional)</label>
                <input
                  type="text"
                  value={topUpNote}
                  onChange={(e) => setTopUpNote(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-lg px-4 py-2 text-text-primary focus:border-orange focus:outline-none"
                  placeholder="e.g., Transfer reference"
                />
              </div>
              {topUpStatus && <p className="text-sm text-green-400">{topUpStatus}</p>}
              <button type="submit" className="bg-orange text-white px-6 py-2 rounded-full font-semibold hover:bg-orange-600 transition">
                <i className="fa-solid fa-paper-plane mr-2"></i>Submit Top-Up Request
              </button>
            </form>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-bg-card rounded-2xl p-6 border border-border">
            <h3 className="font-bold mb-2"><i className="fa-brands fa-bitcoin text-orange mr-2"></i>Bitcoin (BTC) Wallet</h3>
            <p className="text-text-muted text-sm mb-4">Send BTC to this address. It will be converted to Naira automatically.</p>
            <div className="bg-black/40 rounded-lg p-3 border border-border">
              <p className="text-xs text-text-muted mb-1">Address</p>
              <p className="font-mono text-sm break-all text-orange">{BTC_ADDRESS}</p>
            </div>
            <div className="mt-3 flex justify-center">
              <div className="w-32 h-32 bg-black/40 border border-border rounded-lg flex items-center justify-center text-text-muted">
                <i className="fa-solid fa-qrcode text-4xl"></i>
              </div>
            </div>
            <div className="mt-3 text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-2">
              <i className="fa-solid fa-triangle-exclamation mr-1"></i>Send only BTC on the Bitcoin network. Min: 0.00001 BTC.
            </div>
          </div>

          <div className="bg-bg-card rounded-2xl p-6 border border-border">
            <h3 className="font-bold mb-2"><i className="fa-solid fa-coins text-orange mr-2"></i>USDT (TRC20) Wallet</h3>
            <p className="text-text-muted text-sm mb-4">Send USDT (TRC20) to this address. It will be converted to Naira automatically.</p>
            <div className="bg-black/40 rounded-lg p-3 border border-border">
              <p className="text-xs text-text-muted mb-1">Address</p>
              <p className="font-mono text-sm break-all text-orange">{USDT_ADDRESS}</p>
            </div>
            <div className="mt-3 flex justify-center">
              <div className="w-32 h-32 bg-black/40 border border-border rounded-lg flex items-center justify-center text-text-muted">
                <i className="fa-solid fa-qrcode text-4xl"></i>
              </div>
            </div>
            <div className="mt-3 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-2">
              <i className="fa-solid fa-triangle-exclamation mr-1"></i>Send only USDT on TRC20 network. Min: 10 USDT.
            </div>
          </div>
        </div>

        <div className="bg-bg-card rounded-2xl p-6 border border-border">
          <h2 className="text-lg font-bold mb-4">Transaction History</h2>
          {loading ? (
            <p className="text-text-muted">Loading...</p>
          ) : transactions.length === 0 ? (
            <p className="text-text-muted">No transactions yet.</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex justify-between items-center border-b border-border pb-3">
                  <div>
                    <p className="capitalize font-medium">{tx.type.replace('_', ' ')}</p>
                    <p className="text-text-muted text-xs">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                    </p>
                    <span className={`text-xs ${tx.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`}>{tx.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
