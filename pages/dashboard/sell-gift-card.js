import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../_app';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { supabase } from '../../lib/supabaseClient';
import Head from 'next/head';

// ============================================================
// GIFT CARD DATA
// ============================================================
const GIFT_CARDS = [
  { id: 'apple', name: 'Apple', icon: 'fa-brands fa-apple', category: 'Popular', rate: 850 },
  { id: 'amazon', name: 'Amazon', icon: 'fa-brands fa-amazon', category: 'Popular', rate: 820 },
  { id: 'google', name: 'Google Play', icon: 'fa-brands fa-google-play', category: 'Popular', rate: 800 },
  { id: 'itunes', name: 'iTunes', icon: 'fa-solid fa-music', category: 'Popular', rate: 840 },
  { id: 'steam', name: 'Steam', icon: 'fa-solid fa-gamepad', category: 'Gaming', rate: 750 },
  { id: 'razer', name: 'Razer Gold', icon: 'fa-solid fa-dragon', category: 'Gaming', rate: 730 },
  { id: 'sephora', name: 'Sephora', icon: 'fa-solid fa-spa', category: 'Shopping', rate: 780 },
  { id: 'netflix', name: 'Netflix', icon: 'fa-solid fa-film', category: 'Entertainment', rate: 820 },
];

export default function SellGiftCard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedCard, setSelectedCard] = useState(null);
  const [amount, setAmount] = useState('');
  const [cardCode, setCardCode] = useState('');
  const [pin, setPin] = useState('');
  const [cardForm, setCardForm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [ngnRate, setNgnRate] = useState(1550);

  const fileInputRef = useRef(null);

  // Fetch live NGN rate
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await fetch('https://api.exchangerate.fun/latest?base=USD');
        const data = await res.json();
        if (data.rates?.NGN) setNgnRate(data.rates.NGN);
      } catch (e) {
        console.warn('Using fallback NGN rate');
      }
    };
    fetchRate();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen text-text-primary">Loading...</div>;
  if (!user) {
    router.push('/auth/login');
    return null;
  }

  const filteredCards = GIFT_CARDS.filter(card =>
    card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [...new Set(GIFT_CARDS.map(card => card.category))];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    if (!selectedCard) {
      setError('Please select a gift card');
      setSubmitting(false);
      return;
    }

    const cardAmount = parseFloat(amount);
    if (isNaN(cardAmount) || cardAmount <= 0) {
      setError('Please enter a valid amount');
      setSubmitting(false);
      return;
    }

    if (!cardCode) {
      setError('Please enter the card code');
      setSubmitting(false);
      return;
    }

    if (files.length === 0) {
      setError('Please upload an image of the gift card');
      setSubmitting(false);
      return;
    }

    const valueNgn = cardAmount * selectedCard.rate;
    const fileNames = files.map(f => f.name);

    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        type: 'gift_card',
        asset: selectedCard.name,
        amount: cardAmount,
        rate: selectedCard.rate,
        value_ngn: valueNgn,
        status: 'pending',
        details: {
          card_code: cardCode,
          pin: pin || null,
          card_form: cardForm || 'Not specified',
          card_id: selectedCard.id,
          files: fileNames,
        },
      })
      .select();

    if (error) {
      setError('Failed to submit order. Please try again.');
      console.error(error);
    } else {
      setSuccess(`✅ Order submitted! You'll receive ₦${valueNgn.toLocaleString()} after verification.`);
      setAmount('');
      setCardCode('');
      setPin('');
      setCardForm('');
      setFiles([]);
      setSelectedCard(null);
      setSearchTerm('');
    }
    setSubmitting(false);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getEstimatedPayout = () => {
    if (!selectedCard || !amount) return null;
    const cardAmount = parseFloat(amount);
    if (isNaN(cardAmount) || cardAmount <= 0) return null;
    return cardAmount * selectedCard.rate;
  };

  const estimatedPayout = getEstimatedPayout();

  return (
    <>
      <Head>
        <title>Sell Gift Card · KJ Exchange</title>
      </Head>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Sell Gift Card</h1>

          <div className="bg-bg-card rounded-2xl p-6 border border-border">
            <p className="text-text-muted text-sm mb-6">Kindly provide your gift card details.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Gift Card Selection */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
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
                      className="w-full bg-black/40 border border-border rounded-lg pl-12 pr-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                    />
                    {selectedCard && (
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                        onClick={() => { setSelectedCard(null); setSearchTerm(''); }}
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    )}
                  </div>

                  {showDropdown && (
                    <div className="absolute z-20 w-full mt-2 bg-bg-card border border-border rounded-lg max-h-80 overflow-y-auto shadow-card">
                      {filteredCards.length === 0 ? (
                        <div className="px-4 py-6 text-center text-text-muted">No gift cards found.</div>
                      ) : (
                        categories.map((category) => {
                          const cardsInCategory = filteredCards.filter(c => c.category === category);
                          if (cardsInCategory.length === 0) return null;
                          return (
                            <div key={category}>
                              <div className="px-4 py-2 bg-bg-secondary/50 text-xs uppercase tracking-wider text-text-muted font-semibold">
                                {category}
                              </div>
                              {cardsInCategory.map((card) => (
                                <div
                                  key={card.id}
                                  className={`px-4 py-3 hover:bg-bg-hover cursor-pointer flex items-center justify-between transition border-b border-border last:border-b-0 ${
                                    selectedCard?.id === card.id ? 'bg-purple/20 border-l-2 border-orange' : ''
                                  }`}
                                  onClick={() => {
                                    setSelectedCard(card);
                                    setSearchTerm(card.name);
                                    setShowDropdown(false);
                                  }}
                                >
                                  <div className="flex items-center gap-3">
                                    <i className={`${card.icon} text-xl text-orange w-6 text-center`}></i>
                                    <span className="font-medium">{card.name}</span>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-semibold text-green-400">₦{card.rate}/$</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {selectedCard && (
                  <div className="mt-3 bg-black/20 rounded-lg p-3 flex items-center justify-between border border-border">
                    <div className="flex items-center gap-3">
                      <i className={`${selectedCard.icon} text-2xl text-orange`}></i>
                      <div>
                        <p className="font-semibold">{selectedCard.name}</p>
                        <p className="text-xs text-text-muted">Rate: ₦{selectedCard.rate}/$</p>
                      </div>
                    </div>
                    <span className="text-green-400 font-bold text-sm">
                      <i className="fa-regular fa-circle-check mr-1"></i>0% Fees
                    </span>
                  </div>
                )}
              </div>

              {/* Card Form (Physical / Ecode) */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Gift Card Form (Optional)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['Physical Card', 'Ecode'].map((form) => (
                    <button
                      key={form}
                      type="button"
                      onClick={() => setCardForm(form)}
                      className={`p-3 rounded-lg border transition text-center ${
                        cardForm === form
                          ? 'border-orange bg-orange/10 text-orange'
                          : 'border-border bg-black/20 text-text-muted hover:border-orange/50'
                      }`}
                    >
                      <p className="font-semibold text-sm">{form}</p>
                      <p className="text-xs opacity-70">{form === 'Physical Card' ? 'Card with image' : 'Code only'}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Total Gift Card Amount ($)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-lg px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                  placeholder="Enter amount (e.g., 100)"
                  required
                  min="1"
                  step="any"
                />
                {estimatedPayout && (
                  <div className="mt-2 bg-green-400/5 border border-green-400/20 rounded-lg p-3">
                    <p className="text-sm text-text-muted">
                      <i className="fa-regular fa-circle-check text-green-400 mr-1"></i>
                      You'll receive: <span className="text-green-400 font-bold text-lg">₦{estimatedPayout.toLocaleString()}</span>
                    </p>
                    <p className="text-xs text-text-muted">
                      Rate: ₦{selectedCard.rate}/$ · {Math.round((selectedCard.rate / ngnRate) * 100)}% of market rate
                    </p>
                  </div>
                )}
              </div>

              {/* Card Code */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Card Code / Number
                </label>
                <input
                  type="text"
                  value={cardCode}
                  onChange={(e) => setCardCode(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-lg px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                  placeholder="Enter the gift card code or number"
                  required
                />
                <p className="text-xs text-text-muted mt-1">
                  <i className="fa-regular fa-circle-info mr-1"></i>
                  This is the code on the back of the card or in the email.
                </p>
              </div>

              {/* PIN */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  PIN (if required)
                </label>
                <input
                  type="text"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full bg-black/40 border border-border rounded-lg px-4 py-3 text-text-primary focus:border-orange focus:outline-none"
                  placeholder="Enter PIN (if your card has one)"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Upload Gift Card Image(s)
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition ${
                    dragActive ? 'border-orange bg-orange/5' : 'border-border bg-black/20'
                  }`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="space-y-3">
                    <i className="fa-solid fa-cloud-upload-alt text-4xl text-text-muted"></i>
                    <p className="text-text-secondary font-medium">
                      Upload file or drag and drop
                    </p>
                    <p className="text-text-muted text-sm">
                      You can upload multiple files. (PNG, JPG, JPEG)
                    </p>
                  </div>
                </div>

                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-black/20 rounded-lg px-4 py-2 border border-border">
                        <div className="flex items-center gap-3">
                          <i className="fa-solid fa-file-image text-lg text-orange"></i>
                          <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                          <span className="text-xs text-text-muted">{(file.size / 1024).toFixed(0)} KB</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-400 hover:text-red-300 transition"
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-3 text-red-400 text-sm">
                  <i className="fa-solid fa-triangle-exclamation mr-2"></i>{error}
                </div>
              )}
              {success && (
                <div className="bg-green-400/10 border border-green-400/20 rounded-lg p-3 text-green-400 text-sm">
                  <i className="fa-regular fa-circle-check mr-2"></i>{success}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-orange text-white font-bold py-3 rounded-full hover:bg-orange-600 transition disabled:opacity-50 shadow-orange shadow-lg flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Submitting...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane"></i> Submit Order
                  </>
                )}
              </button>

              <p className="text-center text-xs text-text-muted">
                Your order will be verified within 5-15 minutes.
                <br />
                <span className="text-green-400 font-bold">0% fees</span> — What you see is what you get.
              </p>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
