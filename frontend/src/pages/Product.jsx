import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Product() {
  const { id } = useParams(); 
  const { user } = useAuth();
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
  
  const { addToCart, setIsCartOpen } = useCart(); 

  // Fetch products from backend, find active product, and extract contextual suggestions
  useEffect(() => {
    setIsLoading(true);
    setQuantity(1);
    setSelectedImageIndex(0);
    setNotifySubmitted(false);
    if (user?.email) setNotifyEmail(user.email);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    fetch(`${import.meta.env.VITE_API_URL}/api/products`)
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) {
          setProduct(null);
          setIsLoading(false);
          return;
        }

        const currentId = parseInt(id);
        const foundProduct = data.find(p => p.id === currentId);
        setProduct(foundProduct);

        if (foundProduct) {
          // Priority 1: Same category, excluding current product
          const sameCategory = data.filter(
            p => p.id !== currentId && p.category === foundProduct.category
          );
          // Priority 2: Other campus products
          const otherProducts = data.filter(
            p => p.id !== currentId && p.category !== foundProduct.category
          );

          // Combine to yield 4 curated suggestions
          const combinedSuggestions = [...sameCategory, ...otherProducts].slice(0, 4);
          setSuggestions(combinedSuggestions);
        }

        setIsLoading(false);
      })
      .catch(error => {
        console.error("Error fetching product:", error);
        setIsLoading(false);
      });
  }, [id]);

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
            <span className="text-[10px] font-medium text-stone-500 tracking-[0.2em] uppercase mb-4 block">
              {product.category}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-stone-900 mb-6 tracking-tighter leading-none">
              {product.name}
            </h1>
            <span className="text-2xl font-sans text-stone-900 mb-10 block">
              {product.price}
            </span>
            
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
                <p className="font-serif text-stone-900 text-base font-medium">
                  {product.sellerName || "Cartly Campus Hub"}
                </p>
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
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!notifyEmail.trim()) return;
                      try {
                        const existing = JSON.parse(localStorage.getItem('cartly_stock_alerts') || '{}');
                        existing[product.id] = notifyEmail.trim();
                        localStorage.setItem('cartly_stock_alerts', JSON.stringify(existing));
                      } catch {
                        // ignore storage errors
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
            <div className="flex flex-col sm:flex-row gap-4 mt-auto">
              <button 
                onClick={handleAddToCart}
                disabled={(product.stock !== undefined ? product.stock : 25) <= 0}
                className="flex-1 bg-stone-900 text-white py-4 px-8 text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-black transition-colors duration-300 disabled:opacity-40 disabled:hover:bg-stone-900"
              >
                {(product.stock !== undefined ? product.stock : 25) > 0 ? 'Add to Cart' : 'Out of Stock'}
              </button>
              <button 
                onClick={() => setIsCartOpen(true)}
                className="flex-1 bg-transparent border border-stone-300 text-stone-900 py-4 px-8 text-[10px] uppercase tracking-[0.2em] font-medium hover:border-stone-900 transition-colors duration-300"
              >
                View Cart
              </button>
            </div>
          </div>
          
        </main>
      </div>

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