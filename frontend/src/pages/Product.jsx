import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Product() {
  const { id } = useParams(); 
  const [quantity, setQuantity] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // NEW: State for fetching the specific product from the backend
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { addToCart, setIsCartOpen } = useCart(); 

  // NEW: Fetch products from backend and find the matching one
  useEffect(() => {
    setIsLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/api/products`)
      .then(res => res.json())
      .then(data => {
        // Find the specific product matching the URL id
        const foundProduct = data.find(p => p.id === parseInt(id));
        setProduct(foundProduct);
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
          
          {/* Left Column: Constrained Image */}
          <div className="w-full lg:w-1/2 flex items-start justify-center">
            {/* Base Image: 65vh tall */}
            <div 
              onClick={() => setIsFullscreen(true)}
              className="w-full max-h-[65vh] bg-[#FAF9F6] overflow-hidden border border-stone-200 cursor-zoom-in group relative"
            >
              <img 
                src={product.img} 
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

            {/* Campus Seller Details */}
            <div className="mb-10 p-5 bg-[#FAF9F6] border border-stone-200 max-w-md">
              <span className="text-[9px] uppercase tracking-widest text-stone-400 font-semibold block mb-2">
                Campus Seller
              </span>
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
            <div className="mb-12">
              <span className="block text-[9px] font-semibold text-stone-400 uppercase tracking-[0.2em] mb-4">
                Quantity
              </span>
              <div className="flex items-center border border-stone-300 w-fit">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 flex items-center justify-center text-stone-500 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                >
                  <span className="text-lg leading-none mb-1">-</span>
                </button>
                <span className="w-12 text-center text-sm font-medium text-stone-900">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 flex items-center justify-center text-stone-500 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                >
                  <span className="text-lg leading-none mb-0.5">+</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-auto">
              <button 
                onClick={handleAddToCart}
                className="flex-1 bg-stone-900 text-white py-4 px-8 text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-black transition-colors duration-300"
              >
                Add to Cart
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

        {/* Enlarged Image */}
        <img 
          src={product.img} 
          alt={product.name} 
          onClick={(e) => e.stopPropagation()} // Prevent click from closing when clicking the image itself
          className={`h-[80vh] md:h-[85vh] w-auto max-w-full object-contain shadow-2xl transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] bg-[#FAF9F6] border border-stone-800 ${
            isFullscreen ? 'scale-100' : 'scale-95'
          }`} 
        />
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