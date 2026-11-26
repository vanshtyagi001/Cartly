import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';

export default function Product() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(user?.email || '');
  const [notifySubmitted, setNotifySubmitted] = useState(false);
  
  // State for fetching the specific product and suggested items from the backend
  const [product, setProduct] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Reviews & Ratings state
  const [reviewSummary, setReviewSummary] = useState({
    averageRating: 0,
    totalReviews: 0,
    distribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
    reviews: [],
  });
  const [reviewRating, setReviewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewError, setReviewError] = useState('');
  
  const { addToCart } = useCart(); 
  const { isWishlisted, toggleWishlist } = useWishlist();

  // Fetch single product, reviews, and contextual suggestions from backend
  useEffect(() => {
    setIsLoading(true);
    setQuantity(1);
    setSelectedImageIndex(0);
    setNotifySubmitted(false);
    setReviewRating(0);
    setHoverRating(0);
    setReviewFeedback('');
    setReviewError('');
    if (user?.email) setNotifyEmail(user.email);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    Promise.all([
      fetch(`${apiUrl}/api/products/${id}`).then(async (res) => {
        if (!res.ok) throw new Error('Product not found');
        return res.json();
      }),
      fetch(`${apiUrl}/api/products/${id}/reviews`)
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null),
    ])
      .then(([data, revData]) => {
        setProduct(data?.product || null);
        setSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []);
        if (revData) {
          setReviewSummary({
            averageRating: revData.averageRating || 0,
            totalReviews: revData.totalReviews || 0,
            distribution: revData.distribution || { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
            reviews: Array.isArray(revData.reviews) ? revData.reviews : [],
          });
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching product:', error);
        setProduct(null);
        setSuggestions([]);
        setIsLoading(false);
      });
  }, [id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewFeedback('');
    if (reviewRating < 1 || reviewRating > 5) {
      setReviewError('Please select a star rating before publishing.');
      return;
    }
    if (!reviewComment.trim()) {
      setReviewError('Please write a brief review comment.');
      return;
    }

    setIsSubmittingReview(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    try {
      const res = await fetch(`${apiUrl}/api/products/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish review.');
      }

      setReviewSummary({
        averageRating: data.averageRating || 0,
        totalReviews: data.totalReviews || 0,
        distribution: data.distribution || { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
        reviews: Array.isArray(data.reviews) ? data.reviews : [],
      });
      setReviewComment('');
      setReviewRating(0);
      setHoverRating(0);
      setReviewFeedback(data.message || 'Your review has been published.');
    } catch (err) {
      setReviewError(err.message || 'Could not submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isFullscreen]);

  // NEW: Handle Loading State
  if (isLoading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center py-32 bg-[#FAF9F6] border-t border-stone-200 w-full">
        <span className="text-stone-400 font-serif italic text-xl mb-6">Loading product details...</span>
      </main>
    );
  }

  // Handle Not Found State
  if (!product) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center py-32 bg-[#FAF9F6] border-t border-stone-200 w-full">
        <span className="text-stone-400 font-serif italic text-xl mb-6">Product not found.</span>
        <Link 
          to="/shop" 
          className="text-[11px] uppercase tracking-widest text-stone-900 border-b border-stone-900 pb-1 hover:text-stone-500 hover:border-stone-500 transition-colors"
        >
          Return to Shop
        </Link>
      </main>
    );
  }

  const galleryImages = (Array.isArray(product.images) && product.images.length > 0)
    ? product.images
    : (product.img ? [product.img] : []);
  const activeImage = galleryImages[selectedImageIndex] || product.img;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setShowToast(true);
    setTimeout(() => { setShowToast(false); }, 3000);
  };

  const handleBuyNow = () => {
    const stockCount = product.stock !== undefined ? product.stock : 25;
    if (stockCount <= 0) return;
    navigate('/checkout', { state: { buyNowItem: { ...product, quantity } } });
  };

  return (
    <>
      {/* Full-width wrapper with top border to separate from Navbar */}
      <div className="w-full bg-white border-t border-stone-200">
        <main className="max-w-[1400px] mx-auto px-8 md:px-12 py-12 lg:py-16 flex flex-col lg:flex-row gap-12 lg:gap-20 items-stretch relative">
          
          {/* Left Column: Constrained Image & Optional Gallery Thumbnails */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            {/* Base Image: 65vh tall */}
            <div 
              onClick={() => setIsFullscreen(true)}
              className="w-full max-h-[65vh] bg-[#FAF9F6] overflow-hidden border border-stone-200 cursor-zoom-in group relative"
            >
              <img 
                src={activeImage} 
                alt={product.name} 
                className="w-full h-full object-cover max-h-[65vh] mix-blend-multiply group-hover:scale-[1.03] transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,0.1,0.25,1)]" 
              />
              {/* Subtle hover hint */}
              <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/[0.02] transition-colors duration-500 flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-white/90 backdrop-blur-sm text-stone-900 text-[9px] uppercase tracking-widest px-4 py-2">
                  Click to Enlarge
                </span>
              </div>
            </div>

            {/* Thumbnail Strip when multiple images exist */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {galleryImages.map((imgUrl, idx) => (
                  <button
                    key={`${imgUrl.slice(0, 24)}-${idx}`}
                    type="button"
                    onMouseEnter={() => setSelectedImageIndex(idx)}
                    onFocus={() => setSelectedImageIndex(idx)}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-[#FAF9F6] border overflow-hidden transition-all cursor-pointer ${
                      selectedImageIndex === idx
                        ? 'border-stone-900 ring-1 ring-stone-900 opacity-100'
                        : 'border-stone-200 opacity-65 hover:opacity-100 hover:border-stone-400'
                    }`}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${product.name} view ${idx + 1}`}
                      className="w-full h-full object-cover mix-blend-multiply"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Information */}
          <div className="w-full lg:w-1/2 flex flex-col pt-4 lg:pt-8">
            <div className="flex items-center justify-between gap-4 mb-4">
              <span className="text-[10px] font-medium text-stone-500 tracking-[0.2em] uppercase">
                {product.category}
              </span>
              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] font-medium px-3 py-1.5 border transition-colors ${
                  isWishlisted(product.id)
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-stone-900 hover:text-stone-900'
                }`}
                aria-label={isWishlisted(product.id) ? 'Remove from wishlist' : 'Save to wishlist'}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill={isWishlisted(product.id) ? 'currentColor' : 'none'}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span>{isWishlisted(product.id) ? 'Saved' : 'Save'}</span>
              </button>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-stone-900 mb-4 tracking-tighter leading-none">
              {product.name}
            </h1>
            <div className="flex items-center gap-4 mb-8">
              <span className="text-2xl font-sans text-stone-900">
                {product.price}
              </span>
              {reviewSummary.totalReviews > 0 && (
                <a
                  href="#reviews"
                  className="text-xs text-stone-500 hover:text-stone-900 border-l border-stone-200 pl-4 transition-colors"
                >
                  <span className="text-stone-900 font-medium">{reviewSummary.averageRating.toFixed(1)} ★</span>
                  <span className="ml-1.5">({reviewSummary.totalReviews} {reviewSummary.totalReviews === 1 ? 'review' : 'reviews'})</span>
                </a>
              )}
            </div>
            
            <p className="text-stone-500 mb-8 leading-relaxed text-sm font-sans max-w-md">
              {product.description || "High-quality, durable campus essential designed to make your daily routine smoother. Built for students, curated by Cartly to ensure form seamlessly meets function."}
            </p>

            {/* Campus Seller Details & Stock Status */}
            <div className="mb-8 p-5 bg-[#FAF9F6] border border-stone-200 max-w-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] uppercase tracking-widest text-stone-400 font-semibold block">
                  Campus Seller
                </span>
                <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 ${
                  (product.stock !== undefined ? product.stock : 25) > 0
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {(product.stock !== undefined ? product.stock : 25) > 0
                    ? `${product.stock !== undefined ? product.stock : 25} in stock`
                    : 'Out of Stock'}
                </span>
              </div>
              <div>
                {product.sellerId ? (
                  <Link
                    to={`/store/${product.sellerId}`}
                    className="font-serif text-stone-900 text-base font-medium hover:underline inline-flex items-center gap-1.5 group"
                  >
                    <span>{product.sellerName || "Cartly Campus Hub"}</span>
                    <span className="text-xs text-stone-400 group-hover:text-stone-900 transition-colors">→</span>
                  </Link>
                ) : (
                  <p className="font-serif text-stone-900 text-base font-medium">
                    {product.sellerName || "Cartly Campus Hub"}
                  </p>
                )}
                <p className="text-stone-500 text-xs mt-1">
                  {product.sellerLocation || "Central Campus Depot"}
                </p>
              </div>
            </div>

            {/* Quantity Selector */}
            {((product.stock !== undefined ? product.stock : 25) > 0) ? (
              <div className="mb-12">
                <div className="flex items-center justify-between max-w-[200px] mb-4">
                  <span className="block text-[9px] font-semibold text-stone-400 uppercase tracking-[0.2em]">
                    Quantity
                  </span>
                  <span className="text-[10px] text-stone-500">
                    Max: {product.stock !== undefined ? product.stock : 25}
                  </span>
                </div>
                <div className="flex items-center border border-stone-300 w-fit">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 flex items-center justify-center text-stone-500 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                  >
                    <span className="text-lg leading-none mb-1">-</span>
                  </button>
                  <span className="w-12 text-center text-sm font-medium text-stone-900">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(Math.min((product.stock !== undefined ? product.stock : 25), quantity + 1))}
                    className="w-12 h-12 flex items-center justify-center text-stone-500 hover:bg-stone-50 hover:text-stone-900 transition-colors disabled:opacity-40"
                    disabled={quantity >= (product.stock !== undefined ? product.stock : 25)}
                  >
                    <span className="text-lg leading-none mb-0.5">+</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-10 p-6 bg-[#FAF9F6] border border-stone-200 max-w-md space-y-4">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-red-700 block mb-1">
                    Currently Out of Stock
                  </span>
                  <p className="text-stone-600 text-xs leading-relaxed">
                    This item is temporarily unavailable. Leave your email below and we will notify you as soon as the campus seller restocks it.
                  </p>
                </div>

                {notifySubmitted ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <span>✓</span>
                    <span>
                      We&apos;ll notify <strong>{notifyEmail}</strong> as soon as <strong>{product.name}</strong> is back in stock.
                    </span>
                  </div>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!notifyEmail.trim()) return;
                      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                      try {
                        await fetch(`${apiUrl}/api/products/${product.id}/stock-alert`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: notifyEmail.trim() }),
                        });
                        const existing = JSON.parse(localStorage.getItem('cartly_stock_alerts') || '{}');
                        existing[product.id] = notifyEmail.trim();
                        localStorage.setItem('cartly_stock_alerts', JSON.stringify(existing));
                      } catch {
                        // ignore network/storage errors
                      }
                      setNotifySubmitted(true);
                    }}
                    className="flex flex-col sm:flex-row gap-2"
                  >
                    <input
                      type="email"
                      required
                      value={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.value)}
                      placeholder="you@campus.edu"
                      className="flex-1 bg-white border border-stone-300 px-3.5 py-2.5 text-xs text-stone-900 focus:border-stone-900 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="bg-stone-900 text-white text-[10px] uppercase tracking-[0.15em] font-medium px-5 py-2.5 hover:bg-black transition-colors shrink-0"
                    >
                      Notify Me
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-auto">
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={(product.stock !== undefined ? product.stock : 25) <= 0}
                className="flex-1 bg-stone-900 text-white py-4 px-8 text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-black transition-colors duration-300 disabled:opacity-40 disabled:hover:bg-stone-900"
              >
                {(product.stock !== undefined ? product.stock : 25) > 0 ? 'Buy Now' : 'Out of Stock'}
              </button>
              <button 
                type="button"
                onClick={handleAddToCart}
                disabled={(product.stock !== undefined ? product.stock : 25) <= 0}
                className="flex-1 bg-white border border-stone-900 text-stone-900 py-4 px-8 text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-stone-50 transition-colors duration-300 disabled:opacity-40 disabled:border-stone-300"
              >
                Add to Cart
              </button>
            </div>
          </div>
          
        </main>
      </div>

      {/* Student Reviews & Ratings Section */}
      <section id="reviews" className="w-full bg-white border-t border-stone-200 py-16 lg:py-20">
        <div className="max-w-[1400px] mx-auto px-8 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Summary & Review Form */}
          <div className="lg:col-span-4 space-y-8">
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-stone-400 font-medium block mb-1">
                Student Feedback
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif text-stone-900 tracking-tight">
                Reviews &amp; Ratings
              </h2>
            </div>

            {reviewSummary.totalReviews > 0 && (
              <div className="p-6 bg-[#FAF9F6] border border-stone-200 space-y-5">
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-4xl text-stone-900">
                    {reviewSummary.averageRating.toFixed(1)}
                  </span>
                  <span className="text-xs text-stone-500 uppercase tracking-widest">
                    out of 5.0 · {reviewSummary.totalReviews} {reviewSummary.totalReviews === 1 ? 'review' : 'reviews'}
                  </span>
                </div>

                <div className="space-y-2">
                  {['5', '4', '3', '2', '1'].map((star) => {
                    const count = reviewSummary.distribution?.[star] || 0;
                    const pct = reviewSummary.totalReviews > 0 ? Math.round((count / reviewSummary.totalReviews) * 100) : 0;
                    return (
                      <div key={star} className="flex items-center gap-3 text-[11px] text-stone-600">
                        <span className="w-7 font-mono">{star}★</span>
                        <div className="flex-1 h-1.5 bg-stone-200 overflow-hidden">
                          <div className="h-full bg-stone-900 transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-6 text-right text-stone-400 font-mono">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Write a Review Card */}
            <div className="p-6 bg-[#FAF9F6] border border-stone-200">
              <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-stone-700 block mb-4">
                Write a Review
              </span>

              {!isAuthenticated ? (
                <div className="space-y-4">
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Sign in with your campus account to share your experience with this item.
                  </p>
                  <Link
                    to="/login"
                    state={{ from: { pathname: `/product/${id}` } }}
                    className="inline-block w-full text-center bg-stone-900 text-white text-[10px] uppercase tracking-[0.2em] font-medium py-3.5 hover:bg-black transition-colors"
                  >
                    Sign In to Review
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="block text-[10px] uppercase tracking-widest text-stone-500">
                        Your Rating
                      </span>
                      {reviewRating > 0 && (
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-stone-700">
                            {reviewRating} / 5
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setReviewRating(0);
                              setHoverRating(0);
                            }}
                            className="text-[10px] uppercase tracking-widest text-stone-400 hover:text-stone-900 underline transition-colors"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>
                    <div
                      className="flex items-center gap-1.5"
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isFilled = star <= (hoverRating || reviewRating);
                        return (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoverRating(star)}
                            onClick={() => {
                              setReviewRating((prev) => (prev === star ? 0 : star));
                              if (reviewError) setReviewError('');
                            }}
                            className={`w-9 h-9 border text-sm transition-colors cursor-pointer ${
                              isFilled
                                ? 'bg-stone-900 text-amber-400 border-stone-900'
                                : 'bg-white text-stone-300 border-stone-200 hover:border-stone-400'
                            }`}
                            aria-label={`Rate ${star} stars`}
                          >
                            ★
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-stone-500 mb-2">
                      Your Review
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="How is the build quality, sizing, or delivery experience?"
                      className="w-full bg-white border border-stone-200 px-3.5 py-2.5 text-xs text-stone-900 focus:border-stone-900 focus:outline-none resize-none"
                    />
                  </div>

                  {reviewError && (
                    <p className="text-[11px] text-red-700 bg-red-50 border border-red-200 px-3 py-2">
                      {reviewError}
                    </p>
                  )}
                  {reviewFeedback && (
                    <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2">
                      {reviewFeedback}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="w-full bg-stone-900 text-white text-[10px] uppercase tracking-[0.2em] font-medium py-3.5 hover:bg-black transition-colors disabled:opacity-50"
                  >
                    {isSubmittingReview ? 'Publishing...' : 'Publish Review'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: Reviews List */}
          <div className="lg:col-span-8">
            {reviewSummary.reviews.length === 0 ? (
              <div className="p-12 bg-[#FAF9F6] border border-stone-200 text-center">
                <span className="font-serif italic text-lg text-stone-400 block mb-2">
                  No student reviews yet.
                </span>
                <p className="text-xs text-stone-500">
                  Be the first to share how this essential fits into your campus routine.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-stone-200 border-t border-b border-stone-200">
                {reviewSummary.reviews.map((rev) => (
                  <article key={rev.id} className="py-6 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="font-serif text-base text-stone-900 font-medium">
                          {rev.userName}
                        </span>
                        {rev.verifiedPurchase && (
                          <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Verified Buyer
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-400">{rev.date}</span>
                    </div>

                    <div className="text-xs tracking-widest text-stone-900">
                      {'★'.repeat(rev.rating)}
                      <span className="text-stone-300">{'★'.repeat(5 - rev.rating)}</span>
                    </div>

                    <p className="text-sm text-stone-600 leading-relaxed">{rev.comment}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* More Suggestions Section */}
      {suggestions.length > 0 && (
        <section className="w-full bg-[#FAF9F6] border-t border-stone-200 py-16 lg:py-24">
          <div className="max-w-[1400px] mx-auto px-8 md:px-12">
            
            {/* Suggestions Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-4 border-b border-stone-200 gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-[0.25em] text-stone-400 font-medium block mb-1">
                  Curated Campus Essentials
                </span>
                <h3 className="text-2xl sm:text-3xl font-serif text-stone-900 tracking-tight">
                  You May Also Need
                </h3>
              </div>
              <Link
                to={product.category ? `/shop?category=${encodeURIComponent(product.category)}` : "/shop"}
                className="text-[10px] uppercase tracking-widest text-stone-500 hover:text-stone-900 border-b border-stone-400 pb-0.5 transition-colors self-start sm:self-auto"
              >
                Browse All {product.category || "Essentials"} →
              </Link>
            </div>

            {/* Suggestions Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
              {suggestions.map((item) => (
                <Link
                  key={item.id}
                  to={`/product/${item.id}`}
                  className="group block bg-white border border-stone-200 p-4 transition-all duration-300 hover:border-stone-400 hover:shadow-sm"
                >
                  {/* Photo Frame */}
                  <div className="aspect-square w-full bg-[#FAF9F6] overflow-hidden border border-stone-100 mb-4 relative">
                    <img
                      src={item.img}
                      alt={item.name}
                      className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="bg-white/90 backdrop-blur-sm border border-stone-200 text-[8px] uppercase tracking-wider font-semibold px-2 py-0.5 text-stone-700">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  {/* Product Metadata */}
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between text-[9px] text-stone-400 uppercase tracking-widest mb-1">
                      <span>{item.sellerName ? item.sellerName.split("'")[0] : 'Campus Store'}</span>
                      <span className={(item.stock !== undefined ? item.stock : 25) > 0 ? 'text-emerald-700 font-medium' : 'text-red-600'}>
                        {(item.stock !== undefined ? item.stock : 25) > 0 ? 'In Stock' : 'Sold Out'}
                      </span>
                    </div>
                    <h4 className="font-serif text-stone-900 text-base leading-snug line-clamp-1 group-hover:text-amber-900 transition-colors">
                      {item.name}
                    </h4>
                    <span className="font-sans text-sm font-medium text-stone-700 mt-2">
                      {item.price}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

          </div>
        </section>
      )}

      {/* Lightbox / Fullscreen Image Overlay */}
      <div 
        className={`fixed inset-0 z-[100] bg-stone-950/95 backdrop-blur-xl transition-opacity duration-500 flex items-center justify-center px-4 py-8 md:p-12 ${
          isFullscreen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsFullscreen(false)} // Close when clicking the dark background
      >
        <button 
          onClick={(e) => { e.stopPropagation(); setIsFullscreen(false); }}
          className="absolute top-6 right-6 md:top-8 md:right-8 text-stone-400 hover:text-white p-4 transition-colors group z-50"
          aria-label="Close fullscreen"
        >
          <span className="text-[10px] uppercase tracking-[0.2em] font-medium mr-3 group-hover:opacity-100 opacity-0 transition-opacity">Close</span>
          <svg className="w-6 h-6 inline-block transition-transform duration-500 group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Previous / Next Controls in Lightbox if multiple images */}
        {galleryImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
              }}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white p-3 bg-stone-900/50 border border-stone-700 transition-colors z-50"
              aria-label="Previous image"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImageIndex((prev) => (prev + 1) % galleryImages.length);
              }}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white p-3 bg-stone-900/50 border border-stone-700 transition-colors z-50"
              aria-label="Next image"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Enlarged Image */}
        <img 
          src={activeImage} 
          alt={product.name} 
          onClick={(e) => e.stopPropagation()} // Prevent click from closing when clicking the image itself
          className={`h-[80vh] md:h-[85vh] w-auto max-w-full object-contain shadow-2xl transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] bg-[#FAF9F6] border border-stone-800 ${
            isFullscreen ? 'scale-100' : 'scale-95'
          }`} 
        />

        {galleryImages.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.25em] text-stone-300 bg-stone-900/70 px-4 py-1.5 border border-stone-700">
            {selectedImageIndex + 1} / {galleryImages.length}
          </div>
        )}
      </div>

      {/* Toast Notification Popup */}
      <div 
        className={`fixed bottom-10 left-1/2 -translate-x-1/2 bg-stone-900 text-white px-8 py-4 shadow-2xl transition-all duration-500 z-50 flex items-center gap-4 ${
          showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <span className="text-[10px] uppercase tracking-[0.2em] font-medium">Added to your cart</span>
      </div>
    </>
  );
}