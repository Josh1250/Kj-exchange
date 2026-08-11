import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../_app';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../lib/supabaseClient';
import Head from 'next/head';
import Link from 'next/link';
import { GIFT_CARD_RATES } from '../../config/giftCardRates';

export default function SellGiftCard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState('USA');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [cardType, setCardType] = useState('physical');
  const [amount, setAmount] = useState('');
  const [cardCode, setCardCode] = useState('');
  const [pin, setPin] = useState('');
  const [comment, setComment] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [chimeName, setChimeName] = useState('');
  const [chimeValue, setChimeValue] = useState('');
  const [moneypakCode, setMoneypakCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [ngnRate, setNgnRate] = useState(1410);
  const [orderId, setOrderId] = useState(null);

  // ===== GIFT CARD HISTORY =====
  const [giftCardHistory, setGiftCardHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const fileInputRef = useRef(null);
  const frontInputRef = useRef(null);
  const backInputRef = useRef(null);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=NGN');
        const data = await res.json();
        if (data.rates?.NGN) setNgnRate(data.rates.NGN);
      } catch (e) {
        console.warn('Using fallback NGN rate');
      }
    };
    fetchRate();
  }, []);

  // ===== Fetch Gift Card History =====
  useEffect(() => {
    if (user) {
      fetchGiftCardHistory();
    }
  }, [user]);

  const fetchGiftCardHistory = async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'gift_card')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setGiftCardHistory(data);
      }
    } catch (err) {
      console.error('Error fetching gift card history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) {
    router.push('/auth/login');
    return null;
  }

  const brandKeys = Object.keys(GIFT_CARD_RATES);
  const brands = brandKeys.map(key => ({
    id: key,
    ...GIFT_CARD_RATES[key],
  }));

  const filteredBrands = brands.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCurrentBrand = () => {
    if (!selectedBrand) return null;
    return GIFT_CARD_RATES[selectedBrand] || null;
  };

  const brandData = getCurrentBrand();
  const countryOptions = brandData ? Object.keys(brandData.countries) : [];
  const isChime = selectedBrand === 'chime';
  const isGo2bank = selectedBrand === 'go2bank';
  const isGreenDot = selectedBrand === 'greendot';
  const isMoneyPak = selectedBrand === 'moneypak';

  const getSubcategories = () => {
    if (!brandData || !selectedCountry) return [];
    const countryData = brandData.countries[selectedCountry];
    if (!countryData) return [];
    const typeData = cardType === 'physical' ? countryData.physical : countryData.ecode;
    if (!typeData) return [];
    return Object.keys(typeData);
  };

  const subcategories = getSubcategories();

  const getRate = () => {
    if (!brandData || !selectedCountry || !selectedSubcategory) return 0;
    const countryData = brandData.countries[selectedCountry];
    if (!countryData) return 0;
    const typeData = cardType === 'physical' ? countryData.physical : countryData.ecode;
    if (!typeData) return 0;
    return typeData[selectedSubcategory] || 0;
  };

  const rate = getRate();
  const usdAmount = parseFloat(amount) || 0;
  const payoutBeforeFee = usdAmount * rate;
  let feeUsd = 0;
  if (isGo2bank || isGreenDot) feeUsd = 5;
  const payoutNgn = payoutBeforeFee - (feeUsd * ngnRate);
  const finalPayout = payoutNgn > 0 ? payoutNgn : 0;
  const giftPoints = Math.floor(finalPayout / 60);

  const [previewUrls, setPreviewUrls] = useState([]);

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrls([reader.result]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFrontUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFrontFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrls(prev => {
          const newUrls = [...prev];
          newUrls[0] = reader.result;
          return newUrls;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBackFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrls(prev => {
          const newUrls = [...prev];
          newUrls[1] = reader.result;
          return newUrls;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (type) => {
    if (type === 'front') {
      setFrontFile(null);
      if (frontInputRef.current) frontInputRef.current.value = '';
      setPreviewUrls(prev => prev.filter((_, i) => i !== 0));
    } else if (type === 'back') {
      setBackFile(null);
      if (backInputRef.current) backInputRef.current.value = '';
      setPreviewUrls(prev => prev.filter((_, i) => i !== 1));
    } else {
      setUploadedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setPreviewUrls([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    if (!selectedBrand) {
      setError('Please select a gift card');
      setSubmitting(false);
      return;
    }
    if (!selectedSubcategory) {
      setError('Please select a subcategory');
      setSubmitting(false);
      return;
    }
    if (usdAmount <= 0) {
      setError('Please enter a valid amount');
      setSubmitting(false);
      return;
    }
    if (isChime && !chimeName) {
      setError('Please enter the Chime name');
      setSubmitting(false);
      return;
    }
    if (isMoneyPak && !moneypakCode) {
      setError('Please enter the MoneyPak code');
      setSubmitting(false);
      return;
    }

    if (cardType === 'ecode') {
      if (!cardCode) {
        setError('Please enter the gift card code');
        setSubmitting(false);
        return;
      }
    } else {
      if (isGreenDot) {
        if (!frontFile || !backFile) {
          setError('Please upload both front and back images');
          setSubmitting(false);
          return;
        }
      } else {
        if (!uploadedFile) {
          setError('Please upload an image of the gift card');
          setSubmitting(false);
          return;
        }
      }
    }

    try {
      let frontUrl = null, backUrl = null, fileUrl = null;

      if (isGreenDot) {
        if (frontFile) {
          const ext = frontFile.name.split('.').pop();
          const fileName = `${user.id}_${Date.now()}_front.${ext}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('gift-card-images')
            .upload(fileName, frontFile);
          if (uploadError) throw uploadError;
          const { data: { publicUrl } } = supabase.storage
            .from('gift-card-images')
            .getPublicUrl(fileName);
          frontUrl = publicUrl;
        }
        if (backFile) {
          const ext = backFile.name.split('.').pop();
          const fileName = `${user.id}_${Date.now()}_back.${ext}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('gift-card-images')
            .upload(fileName, backFile);
          if (uploadError) throw uploadError;
          const { data: { publicUrl } } = supabase.storage
            .from('gift-card-images')
            .getPublicUrl(fileName);
          backUrl = publicUrl;
        }
      } else if (uploadedFile) {
        const ext = uploadedFile.name.split('.').pop();
        const fileName = `${user.id}_${Date.now()}.${ext}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('gift-card-images')
          .upload(fileName, uploadedFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage
          .from('gift-card-images')
          .getPublicUrl(fileName);
        fileUrl = publicUrl;
      }

      const { data, error } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          type: 'gift_card',
          asset: `${brandData.name} - ${selectedSubcategory}`,
          amount: usdAmount,
          rate: rate,
          value_ngn: finalPayout,
          status: 'pending',
          details: {
            brand: selectedBrand,
            country: selectedCountry,
            card_type: cardType,
            subcategory: selectedSubcategory,
            card_code: cardType === 'ecode' ? cardCode : null,
            pin: pin || null,
            comment: comment || null,
            chime_name: isChime ? chimeName : null,
            chime_value: isChime ? chimeValue : null,
            moneypak_code: isMoneyPak ? moneypakCode : null,
            front_image: frontUrl,
            back_image: backUrl,
            file_image: fileUrl,
            fee_usd: feeUsd,
          },
        })
        .select();

      if (error) throw error;

      const newOrderId = data[0].id;
      setOrderId(newOrderId);

      if (giftPoints > 0) {
        await supabase
          .from('gift_point_transactions')
          .insert({
            user_id: user.id,
            amount: giftPoints,
            type: 'gift_card_sale',
            metadata: { order_id: newOrderId },
          });
      }

      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          message: `🛒 Gift card order submitted: ${brandData.name} - ₦${finalPayout.toLocaleString()} (pending verification)`,
        });

      setSuccess(`✅ Order submitted! You'll receive ₦${finalPayout.toLocaleString()} after verification. Order #${newOrderId.slice(0,8)}`);
      
      // Reset form
      setAmount('');
      setCardCode('');
      setPin('');
      setComment('');
      setUploadedFile(null);
      setFrontFile(null);
      setBackFile(null);
      setPreviewUrls([]);
      setChimeName('');
      setChimeValue('');
      setMoneypakCode('');
      setSelectedSubcategory('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (frontInputRef.current) frontInputRef.current.value = '';
      if (backInputRef.current) backInputRef.current.value = '';

      // Refresh history
      fetchGiftCardHistory();

    } catch (err) {
      console.error('Submit error:', err);
      setError('Failed to submit order: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head><title>Sell Gift Card · KJ Exchange</title></Head>
      <DashboardLayout>
        <div className="max-w-2xl mx-auto px-4 py-4 pb-24">
          {/* Back Button */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary transition mb-4 group"
          >
            <i className="fa-solid fa-arrow-left text-sm group-hover:-translate-x-1 transition-transform"></i>
            <span className="text-sm font-medium">Back to Dashboard</span>
          </Link>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-orange/10 flex items-center justify-center text-orange flex-shrink-0">
              <i className="fa-solid fa-gift text-lg"></i>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Sell Gift Card</h1>
              <p className="text-text-muted text-sm">Get instant Naira for your gift cards</p>
            </div>
          </div>

          <div className="glass rounded-2xl p-5 md:p-6 border border-border">
            {/* Error / Success Messages */}
            {error && (
              <div className="mb-6 bg-red-400/10 border border-red-400/20 rounded-xl p-3 text-red-400 text-sm flex items-start gap-2">
                <i className="fa-solid fa-triangle-exclamation mt-0.5"></i>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-6 bg-green-400/10 border border-green-400/20 rounded-xl p-3 text-green-400 text-sm flex items-start gap-2">
                <i className="fa-regular fa-circle-check mt-0.5"></i>
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Gift Card Selection */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Gift Card Category
                </label>
                <div className="relative">
                  <div className="relative">
                    <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"></i>
                    <input
                      type="text"
                      placeholder="Search gift cards..."
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
                      onFocus={() => setShowDropdown(true)}
                      className="w-full bg-black/30 border border-border rounded-xl pl-12 pr-4 py-3.5 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 placeholder:text-text-muted/50 text-base"
                    />
                    {selectedBrand && (
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition"
                        onClick={() => { setSelectedBrand(null); setSelectedSubcategory(''); setSearchTerm(''); }}
                      >
                        <i className="fa-solid fa-xmark text-lg"></i>
                      </button>
                    )}
                  </div>

                  {showDropdown && (
                    <div className="absolute z-20 w-full mt-2 glass rounded-xl border border-border max-h-60 overflow-y-auto shadow-2xl">
                      {filteredBrands.length === 0 ? (
                        <div className="px-4 py-6 text-center text-text-muted text-sm">No gift cards found.</div>
                      ) : (
                        filteredBrands.map((brand) => {
                          const cardImage = `/images/cards/${brand.id}.png`;
                          return (
                            <div
                              key={brand.id}
                              className={`px-4 py-3 hover:bg-orange/5 cursor-pointer flex items-center justify-between transition border-b border-border last:border-0 ${
                                selectedBrand === brand.id ? 'bg-orange/5 border-l-2 border-orange' : ''
                              }`}
                              onClick={() => {
                                setSelectedBrand(brand.id);
                                setSearchTerm(brand.name);
                                setShowDropdown(false);
                                setSelectedCountry('USA');
                                setSelectedSubcategory('');
                              }}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-lg bg-black/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                                  <img
                                    src={cardImage}
                                    alt={brand.name}
                                    className="w-8 h-8 object-contain"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.parentElement.innerHTML = `<i class="${brand.icon} text-xl text-orange"></i>`;
                                    }}
                                  />
                                </div>
                                <span className="font-medium text-sm truncate">{brand.name}</span>
                              </div>
                              {selectedBrand === brand.id && (
                                <i className="fa-regular fa-circle-check text-orange flex-shrink-0 ml-2"></i>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              {selectedBrand && (
                <>
                  {/* Country, Card Type, Subcategory, Amount, Upload fields — keep as is */}

                  {/* ... rest of your existing form fields ... */}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3.5 rounded-xl hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50 shadow-lg shadow-orange/20 flex items-center justify-center gap-2 touch-manipulation"
                  >
                    {submitting ? (
                      <><i className="fa-solid fa-spinner fa-spin"></i> Submitting...</>
                    ) : (
                      <><i className="fa-solid fa-paper-plane"></i> Proceed</>
                    )}
                  </button>
                </>
              )}
            </form>
          </div>

          {/* ===== GIFT CARD HISTORY ===== */}
          <div className="glass rounded-2xl p-5 border border-border mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
                Recent Gift Card Sales
              </h3>
              <Link href="/dashboard/orders" className="text-sm text-orange hover:underline">
                View All
              </Link>
            </div>

            {historyLoading ? (
              <div className="text-center py-6 text-text-muted">
                <i className="fa-solid fa-spinner fa-spin"></i> Loading...
              </div>
            ) : giftCardHistory.length === 0 ? (
              <div className="text-center py-6 text-text-muted">
                <i className="fa-regular fa-clock text-4xl block mb-2 opacity-40"></i>
                <p className="text-sm">No gift card sales yet.</p>
                <p className="text-xs mt-1">Sell your first gift card to see history here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {giftCardHistory.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-border/50 hover:border-orange/20 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{order.asset}</p>
                      <p className="text-text-muted text-xs">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="font-bold text-green-400">₦{order.value_ngn?.toLocaleString()}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        order.status === 'completed' ? 'bg-green-400/20 text-green-400' :
                        order.status === 'pending' ? 'bg-yellow-400/20 text-yellow-400' :
                        'bg-red-400/20 text-red-400'
                      }`}>
                        {order.status || 'pending'}
                      </span>
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
