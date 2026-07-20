import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../_app';
import Layout from '../../components/layout/Layout';
import { supabase } from '../../lib/supabaseClient';
import Head from 'next/head';

// ============================================================
// GIFT CARD DATA
// ============================================================
const GIFT_CARDS = [
  // Popular
  { id: 'apple', name: 'Apple', icon: '🍎', category: 'Popular', rate: 850 },
  { id: 'amazon', name: 'Amazon', icon: '📦', category: 'Popular', rate: 820 },
  { id: 'google', name: 'Google Play', icon: '▶️', category: 'Popular', rate: 800 },
  { id: 'itunes', name: 'iTunes', icon: '🎵', category: 'Popular', rate: 840 },
  
  // Gaming
  { id: 'steam', name: 'Steam', icon: '🎮', category: 'Gaming', rate: 750 },
  { id: 'razer', name: 'Razer Gold', icon: '🐉', category: 'Gaming', rate: 730 },
  { id: 'xbox', name: 'Xbox', icon: '🎮', category: 'Gaming', rate: 740 },
  { id: 'playstation', name: 'PlayStation', icon: '🎮', category: 'Gaming', rate: 745 },
  
  // Shopping
  { id: 'sephora', name: 'Sephora', icon: '💄', category: 'Shopping', rate: 780 },
  { id: 'walmart', name: 'Walmart', icon: '🛒', category: 'Shopping', rate: 790 },
  { id: 'target', name: 'Target', icon: '🎯', category: 'Shopping', rate: 785 },
  
  // Entertainment
  { id: 'netflix', name: 'Netflix', icon: '🎬', category: 'Entertainment', rate: 820 },
  { id: 'spotify', name: 'Spotify', icon: '🎧', category: 'Entertainment', rate: 810 },
  { id: 'hulu', name: 'Hulu', icon: '📺', category: 'Entertainment', rate: 815 },
];

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function SellGiftCard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // State
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
  const [tradeType, setTradeType] = useState('sell');
  
  const fileInputRef = useRef(null);

  // ============================================================
  // FETCH LIVE NGN RATE
  // ============================================================
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await fetch('https://api.exchangerate.fun/latest?base=USD');
        const data = await res.json();
        if (data.rates?.NGN) {
          setNgnRate(data.rates.NGN);
        }
      } catch (e) {
        console.warn('Using fallback NGN rate');
      }
    };
    fetchRate();
  }, []);

  // ============================================================
  // FILTER CARDS
  // ============================================================
  const filteredCards = GIFT_CARDS.filter(card =>
    card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [...new Set(GIFT_CARDS.map(card => card.category))];

  // ============================================================
  // AUTH CHECK
  // ============================================================
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) {
    router.push('/auth/login');
    return null;
  }

  // ============================================================
  // HANDLE SUBMIT
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    // Validation
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

    const rate = selectedCard.rate;
    const valueNgn = cardAmount * rate;

    // Prepare file URLs (you'll need to upload these to Supabase Storage)
    // For now, we'll just store the file names
    const fileNames = files.map(f => f.name);

    // Create order in Supabase
    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        type: 'gift_card',
        asset: selectedCard.name,
        amount: cardAmount,
        rate: rate,
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

  // ============================================================
  // FILE UPLOAD HANDLERS
  // ============================================================
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // ============================================================
  // ESTIMATED PAYOUT
  // ============================================================
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
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">🎁 Gift Cards</h1>
            <p className="text-text-muted mt-1">
              <span className="text-green-400 font-bold">0% fees</span>. No hidden charges.
            </p>
          </div>

          {/* ============================================
              BUY / SELL TOGGLE
          ============================================ */}
          <div className="flex bg-black/20 rounded-lg p-1 mb-6">
            <button
              className={`flex-1 py-3 px-4 rounded-lg text-center font-semibold transition flex items-center justify-center gap-2 ${
                tradeType === 'sell'
                  ? 'bg-orange text-white'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              onClick={() => setTradeType('sell')}
            >
              💰 Sell Gift Card
            </button>
            <button
              className={`flex-1 py-3 px-4 rounded-lg text-center font-semibold transition flex items-center justify-center gap-2 ${
                tradeType === 'buy'
                  ? 'bg-orange text-white'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              onClick={() => setTradeType('buy')}
            >
              🛍️ Buy Gift Card
            </button>
          </div>

          {/* ============================================
              SELL FORM (Active when "Sell" is selected)
          ============================================ */}
          {tradeType === 'sell' && (
            <div className="bg-bg-card rounded-2xl p-6 md:p-8 border border-border">
              <p className="text-text-muted text-sm mb-6">
                Kindly provide your gift card details.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* ============================================
                    STEP 1: GIFT CARD CATEGORY (Searchable Dropdown)
                ============================================ */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Gift Card Category
                  </label>
                  <div className="relative">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                        🔍
                      </span>
                      <input
                        type="text"
                        placeholder="Search gift cards..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        className="w-full bg-black/40 border border-border rounded-lg px-12 py-3 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange-glow/30"
                      />
                      {selectedCard && (
                        <span 
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-green-400 cursor-pointer hover:text-green-300"
                          onClick={() => {
                            setSelectedCard(null);
                            setSearchTerm('');
                          }}
                        >
                          ✕
                        </span>
                      )}
                    </div>

                    {/* Dropdown */}
                    {showDropdown && (
                      <div className="absolute z-20 w-full mt-2 bg-bg-card border border-border rounded-lg max-h-80 overflow-y-auto shadow-card">
                        {filteredCards.length === 0 ? (
                          <div className="px-4 py-6 text-center text-text-muted">
                            No gift cards found.
                          </div>
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
                                      setCardForm('');
                                    }}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-xl">{card.icon}</span>
                                      <div>
                                        <p className="font-medium">{card.name}</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-semibold text-green-400">
                                        ₦{card.rate}/$
                                      </p>
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

                  {/* Selected Card Display */}
                  {selectedCard && (
                    <div className="mt-3 bg-black/20 rounded-lg p-3 flex items-center justify-between border border-border">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{selectedCard.icon}</span>
                        <div>
                          <p className="font-semibold">{selectedCard.name}</p>
                          <p className="text-xs text-text-muted">Rate: ₦{selectedCard.rate}/$</p>
                        </div>
                      </div>
                      <span className="text-green-400 font-bold text-sm">0% Fees</span>
                    </div>
                  )}
                </div>

                {/* ============================================
                    STEP 2: GIFT CARD FORM (Physical / Ecode)
                ============================================ */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Gift Card Form (Optional)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setCardForm('Physical Card')}
                      className={`p-3 rounded-lg border transition text-center ${
                        cardForm === 'Physical Card'
                          ? 'border-orange bg-orange/10 text-orange'
                          : 'border-border bg-black/20 text-text-muted hover:border-orange/50'
                      }`}
                    >
                      <p className="font-semibold text-sm">Physical Card</p>
                      <p className="text-xs opacity-70">Card with image</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardForm('Ecode')}
                      className={`p-3 rounded-lg border transition text-center ${
                        cardForm === 'Ecode'
                          ? 'border-orange bg-orange/10 text-orange'
                          : 'border-border bg-black/20 text-text-muted hover:border-orange/50'
                      }`}
                    >
                      <p className="font-semibold text-sm">Ecode</p>
                      <p className="text-xs opacity-70">Code only</p>
                    </button>
                  </div>
                </div>

                {/* ============================================
                    STEP 3: AMOUNT
                ============================================ */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Total Gift Card Amount ($)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-black/40 border border-border rounded-lg px-4 py-3 text-text-primary focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange-glow/30"
                    placeholder="Enter amount (e.g., 100)"
                    required
                    min="1"
                    step="any"
                  />
                  {estimatedPayout && (
                    <div className="mt-2 bg-green-400/5 border border-green-400/20 rounded-lg p-3">
                      <p className="text-sm text-text-muted">
                        You'll receive:{' '}
                        <span className="text-green-400 font-bold text-lg">
                          ₦{estimatedPayout.toLocaleString()}
                        </span>
                      </p>
                      <p className="text-xs text-text-muted">
                        Rate: ₦{selectedCard.rate}/$ · {Math.round((selectedCard.rate / ngnRate) * 100)}% of market rate
                      </p>
                    </div>
                  )}
                </div>

                {/* ============================================
                    STEP 4: CARD CODE & PIN
                ============================================ */}
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
                    This is the code on the back of the card or in the email.
                  </p>
                </div>

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

                {/* ============================================
                    STEP 5: FILE UPLOAD
                ============================================ */}
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
                      <div className="text-4xl">📤</div>
                      <p className="text-text-secondary font-medium">
                        Upload file or drag and drop
                      </p>
                      <p className="text-text-muted text-sm">
                        You can upload multiple files. (PNG, JPG, JPEG)
                      </p>
                    </div>
                  </div>

                  {/* File list */}
                  {files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-black/20 rounded-lg px-4 py-2 border border-border">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">📄</span>
                            <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                            <span className="text-xs text-text-muted">{(file.size / 1024).toFixed(0)} KB</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-400 hover:text-red-300 transition"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ============================================
                    ERROR / SUCCESS
                ============================================ */}
                {error && (
                  <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-3 text-red-400 text-sm">
                    ⚠️ {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-400/10 border border-green-400/20 rounded-lg p-3 text-green-400 text-sm">
                    ✅ {success}
                  </div>
                )}

                {/* ============================================
                    SUBMIT BUTTON
                ============================================ */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-orange text-white font-bold py-3 rounded-full hover:bg-orange-light transition disabled:opacity-50 shadow-orange shadow-lg flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="animate-spin">⏳</span> Submitting...
                    </>
                  ) : (
                    <>
                      <span>🚀</span> Submit Order
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
          )}

          {/* ============================================
              BUY FORM (Coming Soon)
          ============================================ */}
          {tradeType === 'buy' && (
            <div className="bg-bg-card rounded-2xl p-6 md:p-8 border border-border text-center">
              <div className="text-6xl mb-4">🛍️</div>
              <h3 className="text-xl font-bold">Buy Gift Cards Coming Soon</h3>
              <p className="text-text-muted mt-2">
                We're working on adding this feature. Stay tuned!
              </p>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
