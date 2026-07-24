import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../_app';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../lib/supabaseClient';
import Head from 'next/head';
import Link from 'next/link';

export default function Referral() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [referralCode, setReferralCode] = useState('');
  const [referralHistory, setReferralHistory] = useState([]);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [completedReferrals, setCompletedReferrals] = useState(0);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [appUrl, setAppUrl] = useState('');

  useEffect(() => {
    // Set the app URL only on the client
    if (typeof window !== 'undefined') {
      setAppUrl(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchReferralCode();
      fetchReferralData();
    }
  }, [user]);

  const fetchReferralCode = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('referral_code')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.referral_code) {
        setReferralCode(data.referral_code);
      } else {
        const name = user.email?.split('@')[0] || 'user';
        const random = Math.floor(1000 + Math.random() * 9000);
        const code = `${name.substring(0, 4).toUpperCase()}${random}`;

        await supabase
          .from('users')
          .update({ referral_code: code })
          .eq('id', user.id);

        setReferralCode(code);
      }
    } catch (err) {
      console.error('Error fetching referral code:', err);
    }
  };

  const fetchReferralData = async () => {
    try {
      const { data: referrals } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (referrals) {
        setReferralHistory(referrals);
        setTotalReferrals(referrals.length);
        const completed = referrals.filter(r => r.status === 'completed').length;
        setCompletedReferrals(completed);
        const points = completed * 1000;
        setPointsEarned(points);
      }
    } catch (err) {
      console.error('Error fetching referrals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const shareViaWhatsApp = () => {
    const message = `🎉 Join KJ Exchange and get started! Use my referral code: ${referralCode} \n\nTrade Smart. Trade Secure. \n\nSign up at: ${appUrl}/auth/register?ref=${referralCode}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareViaTwitter = () => {
    const message = `🎉 Join KJ Exchange and get started! Use my referral code: ${referralCode} \n\nTrade Smart. Trade Secure. \n\nSign up at: ${appUrl}/auth/register?ref=${referralCode}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`, '_blank');
  };

  const referralLink = `${appUrl}/auth/register?ref=${referralCode}`;

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
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <i className="fa-solid fa-user-group text-orange"></i>
            Referral
          </h1>

          {/* Hero Card */}
          <div className="glass rounded-2xl p-6 border border-border bg-gradient-to-br from-purple-900/20 to-orange-900/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-orange/20 rounded-full flex items-center justify-center text-3xl flex-shrink-0">
                  🎁
                </div>
                <div>
                  <h2 className="font-bold text-lg">Refer & Earn <span className="text-orange">1,000 Gift Points!</span></h2>
                  <p className="text-text-muted text-sm mt-1">
                    Invite your friends to join KJ Exchange. When they sign up and complete their first trade, you both earn <span className="text-orange font-semibold">1,000 gift points</span>!
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-xs bg-orange/10 text-orange px-3 py-1 rounded-full">🎯 1,000 points per referral</span>
                    <span className="text-xs bg-green-400/10 text-green-400 px-3 py-1 rounded-full">✅ Instant credit</span>
                    <span className="text-xs bg-purple-400/10 text-purple-400 px-3 py-1 rounded-full">♾️ Unlimited referrals</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Referral Code */}
          <div className="glass rounded-2xl p-6 border border-border">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 w-full">
                <p className="text-text-muted text-sm mb-1">Your Referral Code</p>
                <div className="bg-black/40 border border-border rounded-xl px-4 py-3 text-center">
                  <code className="text-2xl font-bold tracking-wider text-orange">{referralCode}</code>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => copyToClipboard(`🎉 Join KJ Exchange and get started! Use my referral code: ${referralCode} \n\nTrade Smart. Trade Secure. \n\nSign up at: ${referralLink}`)}
                  className="flex-1 sm:flex-none glass hover:border-orange transition px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 border border-border"
                >
                  <i className={`fa-regular ${copied ? 'fa-check text-green-400' : 'fa-copy'}`}></i>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={shareViaWhatsApp}
                  className="flex-1 sm:flex-none bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-3 rounded-xl transition font-semibold flex items-center justify-center gap-2"
                >
                  <i className="fab fa-whatsapp"></i> Share
                </button>
                <button
                  onClick={shareViaTwitter}
                  className="flex-1 sm:flex-none bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-3 rounded-xl transition font-semibold flex items-center justify-center gap-2 hidden sm:flex"
                >
                  <i className="fab fa-twitter"></i>
                </button>
              </div>
            </div>

            {/* Referral Link */}
            {appUrl && (
              <div className="mt-4">
                <p className="text-text-muted text-sm mb-1">Your Referral Link</p>
                <div className="bg-black/40 border border-border rounded-xl px-4 py-3 flex items-center justify-between">
                  <code className="text-sm text-text-muted truncate flex-1">{referralLink}</code>
                  <button
                    onClick={() => {
                      copyToClipboard(referralLink);
                    }}
                    className="ml-2 text-orange hover:text-orange-light transition text-sm font-semibold whitespace-nowrap"
                  >
                    {copied ? '✅ Copied' : 'Copy Link'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass rounded-2xl p-4 text-center border border-border">
              <p className="text-2xl font-bold text-orange">{totalReferrals}</p>
              <p className="text-text-muted text-xs uppercase tracking-wider">Total Referrals</p>
            </div>
            <div className="glass rounded-2xl p-4 text-center border border-border">
              <p className="text-2xl font-bold text-green-400">{completedReferrals}</p>
              <p className="text-text-muted text-xs uppercase tracking-wider">Completed</p>
            </div>
            <div className="glass rounded-2xl p-4 text-center border border-border">
              <p className="text-2xl font-bold text-yellow-400">{pointsEarned}</p>
              <p className="text-text-muted text-xs uppercase tracking-wider">Points Earned</p>
            </div>
          </div>

          {/* Referral History */}
          <div className="glass rounded-2xl p-6 border border-border">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <i className="fa-solid fa-clock-rotate-left text-orange"></i>
              Referral History
            </h2>
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
                  <div key={ref.id} className="flex justify-between items-center border-b border-border pb-3 last:border-0">
                    <div>
                      <p className="font-medium">{ref.referred_email || 'New User'}</p>
                      <p className="text-text-muted text-xs">
                        {new Date(ref.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-semibold ${
                        ref.status === 'completed' ? 'text-green-400' : 
                        ref.status === 'pending' ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {ref.status === 'completed' ? '✅ Completed' : 
                         ref.status === 'pending' ? '⏳ Pending' : '❌ Failed'}
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
