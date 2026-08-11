import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../_app';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../lib/supabaseClient';
import Head from 'next/head';
import Link from 'next/link';

export default function Transactions() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 15;

  useEffect(() => {
    if (!user) return;
    fetchTransactions();
  }, [user, filterType, filterDate]);

  const fetchTransactions = async (reset = true) => {
    if (!user) return;
    setIsLoading(true);

    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Type filter
      if (filterType !== 'all') {
        query = query.eq('type', filterType);
      }

      // Date filter
      if (filterDate === 'today') {
        const today = new Date().toISOString().split('T')[0];
        query = query.gte('created_at', today);
      } else if (filterDate === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('created_at', weekAgo.toISOString());
      } else if (filterDate === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte('created_at', monthAgo.toISOString());
      }

      // Pagination
      const from = reset ? 0 : page * LIMIT;
      query = query.range(from, from + LIMIT - 1);

      const { data, error } = await query;

      if (error) throw error;

      if (reset) {
        setTransactions(data || []);
        setPage(1);
        setHasMore((data || []).length === LIMIT);
      } else {
        setTransactions(prev => [...prev, ...(data || [])]);
        setPage(prev => prev + 1);
        setHasMore((data || []).length === LIMIT);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = () => {
    if (!hasMore || isLoading) return;
    fetchTransactions(false);
  };

  const getTransactionIcon = (type) => {
    if (type === 'crypto_sale') return 'fa-arrow-up text-green-400';
    if (type === 'gift_card_sale') return 'fa-gift text-orange';
    if (type === 'withdrawal') return 'fa-arrow-down text-red-400';
    if (type === 'deposit') return 'fa-arrow-down text-green-400';
    if (type === 'conversion') return 'fa-arrow-right-arrow-left text-purple-400';
    if (type === 'airtime') return 'fa-wifi text-blue-400';
    if (type === 'bill') return 'fa-credit-card text-yellow-400';
    if (type === 'bonus') return 'fa-gift text-orange';
    return 'fa-arrow-right text-text-muted';
  };

  const getTransactionLabel = (tx) => {
    if (tx.type === 'crypto_sale') return 'Crypto Sold';
    if (tx.type === 'gift_card_sale') return 'Gift Card Sold';
    if (tx.type === 'withdrawal') return 'Withdrawal';
    if (tx.type === 'deposit') return 'Deposit';
    if (tx.type === 'conversion') return 'Currency Conversion';
    if (tx.type === 'airtime') return 'Airtime Purchase';
    if (tx.type === 'bill') return 'Bill Payment';
    if (tx.type === 'bonus') return 'Bonus';
    return tx.type?.replace('_', ' ') || 'Transaction';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-400/20 text-green-400';
      case 'pending': return 'bg-yellow-400/20 text-yellow-400';
      case 'processing': return 'bg-blue-400/20 text-blue-400';
      case 'failed': return 'bg-red-400/20 text-red-400';
      default: return 'bg-yellow-400/20 text-yellow-400';
    }
  };

  const filterTypes = [
    { value: 'all', label: 'All' },
    { value: 'crypto_sale', label: 'Crypto' },
    { value: 'gift_card_sale', label: 'Gift Cards' },
    { value: 'deposit', label: 'Deposits' },
    { value: 'withdrawal', label: 'Withdrawals' },
    { value: 'conversion', label: 'Conversions' },
  ];

  const filterDates = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
  ];

  if (loading) return <div>Loading...</div>;
  if (!user) {
    router.push('/auth/login');
    return null;
  }

  return (
    <>
      <Head>
        <title>Transactions · KJ Exchange</title>
      </Head>
      <DashboardLayout>
        <div className="max-w-2xl mx-auto px-4 py-4 pb-24">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-orange/10 flex items-center justify-center text-orange flex-shrink-0">
              <i className="fa-solid fa-credit-card text-lg"></i>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Transactions</h1>
              <p className="text-text-muted text-sm">All your activity in one place</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-5">
            {/* Type Filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar flex-wrap">
              {filterTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFilterType(type.value)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap ${
                    filterType === type.value
                      ? 'bg-orange text-white shadow-lg shadow-orange/20'
                      : 'bg-black/20 text-text-muted hover:text-text-primary border border-border'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Filter */}
          <div className="flex gap-2 mb-5 overflow-x-auto pb-1 no-scrollbar flex-wrap">
            {filterDates.map((date) => (
              <button
                key={date.value}
                onClick={() => setFilterDate(date.value)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap ${
                  filterDate === date.value
                    ? 'bg-orange text-white shadow-lg shadow-orange/20'
                    : 'bg-black/20 text-text-muted hover:text-text-primary border border-border'
                }`}
              >
                {date.label}
              </button>
            ))}
          </div>

          {/* Transactions List */}
          <div className="glass rounded-2xl p-5 border border-border">
            {isLoading && transactions.length === 0 ? (
              <div className="text-center py-8 text-text-muted">
                <i className="fa-solid fa-spinner fa-spin text-2xl block mb-3"></i>
                <p className="text-sm">Loading transactions...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 mx-auto rounded-full bg-orange/5 border border-orange/20 flex items-center justify-center text-2xl text-orange/30 mb-4">
                  <i className="fa-regular fa-clock"></i>
                </div>
                <p className="text-text-muted text-sm">No transactions found</p>
                <p className="text-text-muted text-xs mt-1">
                  {filterType !== 'all' ? `Try changing the filter` : 'Start trading to see your activity'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-border/50 hover:border-orange/20 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-orange/10 flex items-center justify-center flex-shrink-0">
                        <i className={`fa-solid ${getTransactionIcon(tx.type)}`}></i>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{getTransactionLabel(tx)}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs text-text-muted">{new Date(tx.created_at).toLocaleDateString()}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${getStatusBadge(tx.status)}`}>
                            {tx.status || 'pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className={`font-bold text-sm ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.currency || '₦'}{Math.abs(tx.amount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}

                {hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={isLoading}
                    className="w-full mt-3 py-2 text-sm text-orange hover:underline transition disabled:opacity-50"
                  >
                    {isLoading ? (
                      <><i className="fa-solid fa-spinner fa-spin"></i> Loading...</>
                    ) : (
                      'Load More'
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Stats */}
          {transactions.length > 0 && (
            <div className="mt-4 text-center text-text-muted text-xs">
              {transactions.length} transactions shown
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}
