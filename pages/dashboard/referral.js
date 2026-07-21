import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../_app';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../lib/supabaseClient';
import Head from 'next/head';

export default function Referral() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [referralCode, setReferralCode] = useState('');
  const [referralHistory, setReferralHistory] = useState([]);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Generate referral code from user email
  useEffect(() => {
    if (user) {
      // Generate code from user ID (first 8 chars)
      const code = user.id.substring(0, 8).toUpperCase();
      setReferralCode(code);
      fetchReferralData();
    }
  }, [user]);

  const fetchReferralData = async () => {
    try {
      // Get referrals
      const { data: referrals } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (referrals) {
        setReferralHistory(referrals);
        setTotalReferrals(referrals.length);
        // Calculate points earned from referrals (1000 each)
        const points = referrals.filter(r => r.status === 'completed').length * 1000;
        setPointsEarned(points);
      }
    } catch (err) {
      console.error('Error fetching referrals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    const shareText = `🎉 Join KJ Exchange and get started! Use my referral code: ${referralCode} \n\nTrade Smart. Trade Secure. 0% fees! \n\nSign up at: ${window.location.origin}`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const shareViaWhatsApp = () => {
    const message = `🎉 Join KJ Exchange and get started! Use my referral code: ${referralCode} \n\nTrade Smart. Trade Secure. 0% fees! \n\nSign up at: ${window.location.origin}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-text-primary">Loading...</div>;
  if (!user) {
    router.push('/auth/login');
    return null;
  }

  return (
    <>
      <Head>
        <title>Referral · KJ Exchange</title>
      </Head>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Referral</h1>

          {/* Info Card */}
          <div className="bg-gradient-to-r from-purple-900/30 to-orange-900/20 rounded-2xl p-6 border border-border mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange/20 rounded-full flex items-center justify-center text-2xl">
                🎁
              </div>
              <div>
                <h2 className="font-bold text-lg">Refer your friends and earn <span className="text-orange">1,000 Gift Points!</span></h2>
                <p className="text-text-muted text-sm mt-1">
                  Earn referral bonus when your friends sign up with your referral code and trade successfully.
                </p>
              </div>
            </div>
          </div>

          {/* Referral Code */}
          <div className="bg-bg-card rounded-2xl p-6 border border-border mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 w-full">
                <p className="text-text-muted text-sm mb-1">Your Referral Code</p>
                <div className="bg-black/40 border border-border rounded-lg px-4 py-3 text-center">
                  <code className="text-2xl font-bold tracking-wider text-orange">{referralCode}</code>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 sm:flex-none bg-orange/20 hover:bg-orange/30 text-orange px-4 py-3 rounded-lg transition font-semibold flex items-center justify-center gap-2"
                >
                  <i className={`fa-regular ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={shareViaWhatsApp}
                  className="flex-1 sm:flex-none bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-3 rounded-lg transition font-semibold flex items-center justify-center gap-2"
                >
                  <i className="fab fa-whatsapp"></i> Share
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-bg-card rounded-xl p-4 text-center border border-border">
              <p className="text-2xl font-bold text-orange">{totalReferrals}</p>
              <p className="text-text-muted text-sm">Total Referrals</p>
            </div>
            <div className="bg-bg-card rounded-xl p-4 text-center border border-border">
              <p className="text-2xl font-bold text-green-400">{pointsEarned}</p>
              <p className="text-text-muted text-sm">Points Earned</p>
            </div>
          </div>

          {/* History */}
          <div className="bg-bg-card rounded-2xl p-6 border border-border">
            <h2 className="text-lg font-bold mb-4">Referral History</h2>
            {isLoading ? (
              <p className="text-text-muted">Loading...</p>
            ) : referralHistory.length === 0 ? (
              <div className="text-center py-8">
                <i className="fa-regular fa-user-plus text-4xl text-text-muted mb-2 block"></i>
                <p className="text-text-muted">No referrals yet.</p>
                <p className="text-text-muted text-sm">Share your referral code to start earning!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {referralHistory.map((ref) => (
                  <div key={ref.id} className="flex justify-between items-center border-b border-border pb-3">
                    <div>
                      <p className="font-medium">{ref.referred_email || 'New User'}</p>
                      <p className="text-text-muted text-xs">
                        {new Date(ref.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-semibold ${ref.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`}>
                        {ref.status === 'completed' ? '✅ Completed' : ref.status === 'pending' ? '⏳ Pending' : '❌ Failed'}
                      </span>
                      {ref.status === 'completed' && (
                        <p className="text-xs text-green-400">+1,000 points</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
