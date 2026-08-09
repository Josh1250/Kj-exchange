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

    } catch (err) {
      console.error('Submit error:', err);
      setError('Failed to submit order: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sell Gift Card · KJ Exchange</title>
      </Head>
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
                  {/* Country */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                      Gift Card Country
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {countryOptions.map((country) => (
                        <button
                          key={country}
                          type="button"
                          onClick={() => { setSelectedCountry(country); setSelectedSubcategory(''); }}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                            selectedCountry === country
                              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange/20'
                              : 'bg-black/20 border border-border text-text-muted hover:border-orange/50'
                          }`}
                        >
                          {country === 'USA' && '🇺🇸 USA'}
                          {country === 'CANADA' && '🇨🇦 Canada'}
                          {country === 'EURO' && '🇪🇺 Euro'}
                          {country === 'UK' && '🇬🇧 UK'}
                          {country === 'OTHER' && '🌍 Other'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Card Type */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                      Gift Card Form
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => { setCardType('physical'); setSelectedSubcategory(''); setCardCode(''); }}
                        className={`p-3 rounded-xl border transition text-center ${
                          cardType === 'physical'
                            ? 'border-orange bg-orange/10 text-orange shadow-lg shadow-orange/10'
                            : 'border-border bg-black/20 text-text-muted hover:border-orange/50'
                        }`}
                      >
                        <i className="fa-solid fa-id-card text-xl block mb-1"></i>
                        <p className="font-semibold text-sm">Physical Card</p>
                        <p className="text-[10px] opacity-70">You have the card</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setCardType('ecode'); setSelectedSubcategory(''); }}
                        className={`p-3 rounded-xl border transition text-center ${
                          cardType === 'ecode'
                            ? 'border-orange bg-orange/10 text-orange shadow-lg shadow-orange/10'
                            : 'border-border bg-black/20 text-text-muted hover:border-orange/50'
                        }`}
                      >
                        <i className="fa-solid fa-code text-xl block mb-1"></i>
                        <p className="font-semibold text-sm">Ecode</p>
                        <p className="text-[10px] opacity-70">You have the code</p>
                      </button>
                    </div>
                  </div>

                  {/* Subcategory */}
                  {subcategories.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">
                        Subcategory
                      </label>
                      <select
                        value={selectedSubcategory}
                        onChange={(e) => setSelectedSubcategory(e.target.value)}
                        className="w-full bg-black/30 border border-border rounded-xl px-4 py-3.5 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 appearance-none"
                      >
                        <option value="">Select subcategory</option>
                        {subcategories.map((sub) => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                      Total Gift Card Amount ($)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-black/30 border border-border rounded-xl px-4 py-3.5 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 placeholder:text-text-muted/50 text-lg"
                        placeholder="Enter amount (e.g., 100)"
                        required
                        min="1"
                        step="any"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted text-sm font-semibold">
                        USD
                      </span>
                    </div>
                  </div>

                  {/* Ecode fields */}
                  {cardType === 'ecode' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1.5">
                          Gift Card Code / Number
                        </label>
                        <input
                          type="text"
                          value={cardCode}
                          onChange={(e) => setCardCode(e.target.value)}
                          className="w-full bg-black/30 border border-border rounded-xl px-4 py-3.5 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 placeholder:text-text-muted/50"
                          placeholder="Enter the gift card code or number"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1.5">
                          PIN (if required)
                        </label>
                        <input
                          type="text"
                          value={pin}
                          onChange={(e) => setPin(e.target.value)}
                          className="w-full bg-black/30 border border-border rounded-xl px-4 py-3.5 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 placeholder:text-text-muted/50"
                          placeholder="Enter PIN if your card has one"
                        />
                      </div>
                    </>
                  )}

                  {/* Chime */}
                  {isChime && (
                    <div className="bg-black/20 rounded-xl p-4 border border-border/50 space-y-3">
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-credit-card text-orange"></i>
                        <span className="font-semibold text-sm">Chime Details</span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1.5">
                          Chime Name
                        </label>
                        <input
                          type="text"
                          value={chimeName}
                          onChange={(e) => setChimeName(e.target.value)}
                          className="w-full bg-black/30 border border-border rounded-xl px-4 py-3.5 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 placeholder:text-text-muted/50"
                          placeholder="Enter the name on the Chime account"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1.5">
                          Chime Value
                        </label>
                        <input
                          type="text"
                          value={chimeValue}
                          onChange={(e) => setChimeValue(e.target.value)}
                          className="w-full bg-black/30 border border-border rounded-xl px-4 py-3.5 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 placeholder:text-text-muted/50"
                          placeholder="Enter the Chime value"
                        />
                      </div>
                      <div className="text-xs text-yellow-400 space-y-1">
                        <p>✅ Only accepts Chime email/tag. Provide the exact value and your name before selling.</p>
                        <p>⏳ Orders will be canceled if payment is not completed within 30 minutes.</p>
                        {selectedSubcategory.includes('Tag') && (
                          <p className="text-red-400">⚠️ If a topup results in an account suspension, you won't be credited.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* MoneyPak */}
                  {isMoneyPak && (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1.5">
                        Code
                      </label>
                      <input
                        type="text"
                        value={moneypakCode}
                        onChange={(e) => setMoneypakCode(e.target.value)}
                        className="w-full bg-black/30 border border-border rounded-xl px-4 py-3.5 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 placeholder:text-text-muted/50"
                        placeholder="Single barcode card has lower rate"
                      />
                    </div>
                  )}

                  {/* Rate & Payout */}
                  {selectedSubcategory && rate > 0 && (
                    <div className="bg-gradient-to-br from-purple-900/10 to-orange-900/10 rounded-xl p-4 border border-border/50 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">Rate</span>
                        <span className="font-bold text-green-400">₦{rate.toFixed(2)} / $</span>
                      </div>
                      {usdAmount > 0 && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-text-muted">Amount</span>
                            <span>${usdAmount.toFixed(2)}</span>
                          </div>
                          {(isGo2bank || isGreenDot) && (
                            <div className="flex justify-between text-sm text-red-400">
                              <span>Fee (${feeUsd} USD)</span>
                              <span>-${feeUsd.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-lg font-bold border-t border-border/50 pt-2 mt-1">
                            <span className="text-text-muted">You Receive</span>
                            <span className="text-green-400">₦{finalPayout.toLocaleString()}</span>
                          </div>
                          {giftPoints > 0 && (
                            <div className="flex justify-between text-sm text-orange">
                              <span>🎁 Gift Points</span>
                              <span>+{giftPoints} points</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                      {isGreenDot ? 'Upload Card Images (Front & Back)' : cardType === 'ecode' ? 'Upload Image (Optional)' : 'Upload Gift Card Image'}
                    </label>

                    {isGreenDot ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-orange/30 transition bg-black/20">
                          <input
                            ref={frontInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFrontUpload}
                            className="hidden"
                          />
                          {frontFile ? (
                            <div className="space-y-2">
                              {previewUrls[0] && (
                                <img src={previewUrls[0]} alt="Front" className="w-full h-24 object-contain rounded" />
                              )}
                              <p className="text-sm text-text-primary truncate">{frontFile.name}</p>
                              <button
                                type="button"
                                onClick={() => removeFile('front')}
                                className="text-red-400 text-xs hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div onClick={() => frontInputRef.current.click()} className="cursor-pointer">
                              <i className="fa-solid fa-cloud-upload-alt text-2xl text-text-muted"></i>
                              <p className="text-sm text-text-secondary mt-1">Upload Front</p>
                            </div>
                          )}
                        </div>
                        <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-orange/30 transition bg-black/20">
                          <input
                            ref={backInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleBackUpload}
                            className="hidden"
                          />
                          {backFile ? (
                            <div className="space-y-2">
                              {previewUrls[1] && (
                                <img src={previewUrls[1]} alt="Back" className="w-full h-24 object-contain rounded" />
                              )}
                              <p className="text-sm text-text-primary truncate">{backFile.name}</p>
                              <button
                                type="button"
                                onClick={() => removeFile('back')}
                                className="text-red-400 text-xs hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div onClick={() => backInputRef.current.click()} className="cursor-pointer">
                              <i className="fa-solid fa-cloud-upload-alt text-2xl text-text-muted"></i>
                              <p className="text-sm text-text-secondary mt-1">Upload Back</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-orange/30 transition bg-black/20">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        {uploadedFile ? (
                          <div className="space-y-2">
                            {previewUrls[0] && (
                              <img src={previewUrls[0]} alt="Upload" className="max-h-32 mx-auto object-contain rounded" />
                            )}
                            <p className="text-sm text-text-primary truncate">{uploadedFile.name}</p>
                            <button
                              type="button"
                              onClick={() => removeFile('single')}
                              className="text-red-400 text-xs hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div onClick={() => fileInputRef.current.click()} className="cursor-pointer">
                            <i className="fa-solid fa-cloud-upload-alt text-3xl text-text-muted"></i>
                            <p className="text-sm text-text-secondary mt-2">
                              {cardType === 'ecode' ? 'Upload image (optional)' : 'Upload file or drag and drop'}
                            </p>
                            <p className="text-xs text-text-muted">PNG, JPG, JPEG</p>
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-text-muted mt-2">
                      {isGreenDot ? 'Both front and back images are required for GreenDot cards.' :
                       cardType === 'ecode' ? 'Uploading an image is optional for Ecode sales.' :
                       'Upload a clear image of your gift card.'}
                    </p>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1.5">
                      Comment (Optional)
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows="2"
                      className="w-full bg-black/30 border border-border rounded-xl px-4 py-3.5 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/20 resize-none placeholder:text-text-muted/50"
                      placeholder="Enter any additional information..."
                    />
                  </div>

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
        </div>
      </DashboardLayout>
    </>
  );
}
