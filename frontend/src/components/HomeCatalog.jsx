import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function HomeCatalog() {
  const { addToCart, setIsCartOpen } = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [isSpotlightPaused, setIsSpotlightPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [addedProductId, setAddedProductId] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/products`).then((r) => r.json()).catch(() => []),
      fetch(`${API_URL}/api/categories`).then((r) => r.json()).catch(() => ({ categories: [] })),
    ])
      .then(([prods, catData]) => {
        const list = Array.isArray(prods) ? prods : [];
        setProducts(list);
        if (catData?.categories && Array.isArray(catData.categories)) {
          setCategories(catData.categories);
        } else {
          const derived = [...new Set(list.map((p) => p.category).filter(Boolean))];
          setCategories(derived);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load home catalog:', err);
        setIsLoading(false);
      });
  }, [API_URL]);

  // Spotlight items: prioritize in-stock items (up to 5)
  const spotlightItems = (
    products.filter((p) => (p.stock !== undefined ? p.stock > 0 : p.inStock !== false))
  ).slice(0, 5);
  const activeSpotlight = spotlightItems[spotlightIndex] || spotlightItems[0] || null;

  // Auto-rotate spotlight every 5.5s when not hovered
  useEffect(() => {
    if (spotlightItems.length <= 1 || isSpotlightPaused) return;
    const timer = setInterval(() => {
      setSpotlightIndex((prev) => (prev + 1) % spotlightItems.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [spotlightItems.length, isSpotlightPaused]);

  const filteredProducts =
    activeCategory === 'All'
      ? products
      : products.filter((p) => p.category === activeCategory);

  const displayedGrid = filteredProducts.slice(0, 8);

  const handleQuickAdd = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    const stock = product.stock !== undefined ? product.stock : 25;
    if (stock <= 0 || product.inStock === false) return;

    addToCart(product, 1);
    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId(null), 1600);
  };

  if (isLoading) {
    return (
      <section className="w-full bg-white border-t border-stone-200 py-20 px-6 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 w-56 bg-stone-100" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-6 h-80 bg-[#FAF9F6] border border-stone-200" />
              <div className="lg:col-span-6 h-80 bg-[#FAF9F6] border border-stone-200" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-72 bg-[#FAF9F6] border border-stone-200" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-white border-t border-stone-200">
      {/* 1. DYNAMIC FEATURED SPOTLIGHT */}
      {activeSpotlight && (
        <section
          className="bg-[#FAF9F6] border-b border-stone-200 py-16 lg:py-24 px-6 md:px-12"
          onMouseEnter={() => setIsSpotlightPaused(true)}
          onMouseLeave={() => setIsSpotlightPaused(false)}
        >
          <div className="max-w-[1400px] mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-stone-400 block mb-2">
                  Spotlight Pick • Live on Campus
                </span>
                <h2 className="text-3xl md:text-4xl font-serif text-stone-900 tracking-tight">
                  Featured Campus Essential
                </h2>
              </div>

              {spotlightItems.length > 1 && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setSpotlightIndex((prev) => (prev - 1 + spotlightItems.length) % spotlightItems.length)
                    }
                    className="w-10 h-10 bg-white border border-stone-200 hover:border-stone-900 flex items-center justify-center text-stone-700 hover:text-stone-900 transition-colors"
                    aria-label="Previous featured product"
                  >
                    ←
                  </button>
                  <span className="text-[11px] font-mono text-stone-500 px-1">
                    0{spotlightIndex + 1} / 0{spotlightItems.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSpotlightIndex((prev) => (prev + 1) % spotlightItems.length)}
                    className="w-10 h-10 bg-white border border-stone-200 hover:border-stone-900 flex items-center justify-center text-stone-700 hover:text-stone-900 transition-colors"
                    aria-label="Next featured product"
                  >
                    →
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 bg-white border border-stone-200 shadow-sm overflow-hidden">
              {/* Image Side */}
              <Link
                to={`/product/${activeSpotlight.id}`}
                className="lg:col-span-6 bg-[#FAF9F6] border-b lg:border-b-0 lg:border-r border-stone-200 aspect-[4/3] lg:aspect-auto lg:min-h-[420px] overflow-hidden group relative"
              >
                <img
                  key={activeSpotlight.id}
                  src={activeSpotlight.img}
                  alt={activeSpotlight.name}
                  className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-700"
                />
                <span className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm border border-stone-200 px-3 py-1 text-[9px] uppercase tracking-[0.2em] font-semibold text-stone-800">
                  {activeSpotlight.category}
                </span>
              </Link>

              {/* Details Side */}
              <div className="lg:col-span-6 p-8 sm:p-12 lg:p-14 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-medium">
                      Sold by {activeSpotlight.sellerName || 'Cartly Campus Hub'}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {activeSpotlight.stock !== undefined ? `${activeSpotlight.stock} in stock` : 'In Stock'}
                    </span>
                  </div>

                  <Link to={`/product/${activeSpotlight.id}`} className="group">
                    <h3 className="text-3xl sm:text-4xl font-serif text-stone-900 tracking-tight mb-4 group-hover:underline">
                      {activeSpotlight.name}
                    </h3>
                  </Link>

                  <p className="text-2xl font-sans text-stone-900 mb-6">{activeSpotlight.price}</p>

                  <p className="text-stone-500 text-sm leading-relaxed mb-8 line-clamp-3">
                    {activeSpotlight.description ||
                      'Verified campus essential ready for fast hostel and campus delivery.'}
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        handleQuickAdd(e, activeSpotlight);
                        setIsCartOpen(true);
                      }}
                      className="flex-1 bg-stone-900 text-white text-xs uppercase tracking-[0.15em] font-medium py-4 px-6 hover:bg-black transition-colors"
                    >
                      Quick Add to Cart
                    </button>
                    <Link
                      to={`/product/${activeSpotlight.id}`}
                      className="flex-1 text-center border border-stone-300 bg-white text-stone-900 text-xs uppercase tracking-[0.15em] font-medium py-4 px-6 hover:border-stone-900 transition-colors"
                    >
                      View Details →
                    </Link>
                  </div>

                  {/* Progress Indicator Bars */}
                  {spotlightItems.length > 1 && (
                    <div className="flex gap-2 pt-2">
                      {spotlightItems.map((item, idx) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSpotlightIndex(idx)}
                          className={`h-1 flex-1 transition-all ${
                            idx === spotlightIndex ? 'bg-stone-900' : 'bg-stone-200 hover:bg-stone-400'
                          }`}
                          aria-label={`Show featured item ${idx + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. DYNAMIC INTERACTIVE CATALOG EXPLORER */}
      <section className="py-16 lg:py-24 px-6 md:px-12">
        <div className="max-w-[1400px] mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 mb-8 border-b border-stone-200">
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-stone-400 block mb-2">
                Campus Marketplace
              </span>
              <h2 className="text-3xl md:text-4xl font-serif text-stone-900 tracking-tight">
                Fresh on Cartly
              </h2>
            </div>

            <Link
              to="/shop"
              className="text-xs uppercase tracking-[0.15em] font-medium text-stone-900 border-b border-stone-900 pb-1 hover:text-stone-500 hover:border-stone-500 transition-colors self-start md:self-auto"
            >
              Browse Full Catalog ({products.length}) →
            </Link>
          </div>

          {/* Dynamic Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10">
            <button
              type="button"
              onClick={() => setActiveCategory('All')}
              className={`px-4 py-2 text-[11px] uppercase tracking-widest font-medium whitespace-nowrap border transition-colors ${
                activeCategory === 'All'
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-[#FAF9F6] text-stone-600 border-stone-200 hover:border-stone-400 hover:text-stone-900'
              }`}
            >
              All ({products.length})
            </button>

            {categories.map((cat) => {
              const count = products.filter((p) => p.category === cat).length;
              if (count === 0) return null;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 text-[11px] uppercase tracking-widest font-medium whitespace-nowrap border transition-colors ${
                    activeCategory === cat
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-[#FAF9F6] text-stone-600 border-stone-200 hover:border-stone-400 hover:text-stone-900'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {displayedGrid.map((product) => {
              const stockCount = product.stock !== undefined ? product.stock : 25;
              const isAvailable = stockCount > 0 && product.inStock !== false;
              const isJustAdded = addedProductId === product.id;

              return (
                <div
                  key={product.id}
                  className="group bg-white border border-stone-200 hover:border-stone-400 transition-all duration-300 flex flex-col justify-between"
                >
                  <Link to={`/product/${product.id}`} className="block">
                    {/* Thumbnail */}
                    <div className="aspect-[4/5] bg-[#FAF9F6] border-b border-stone-200 overflow-hidden relative">
                      <img
                        src={product.img}
                        alt={product.name}
                        className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-700"
                      />

                      <span
                        className={`absolute top-3 right-3 text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 border ${
                          isAvailable
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-red-50 text-red-800 border-red-200'
                        }`}
                      >
                        {isAvailable ? 'In Stock' : 'Sold Out'}
                      </span>

                      {isAvailable && (
                        <button
                          type="button"
                          onClick={(e) => handleQuickAdd(e, product)}
                          className={`absolute bottom-3 left-3 right-3 py-2.5 text-[10px] uppercase tracking-[0.15em] font-medium transition-all duration-300 ${
                            isJustAdded
                              ? 'bg-emerald-800 text-white opacity-100'
                              : 'bg-stone-900/95 text-white opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-black'
                          }`}
                        >
                          {isJustAdded ? '✓ Added to Cart' : '+ Quick Add'}
                        </button>
                      )}
                    </div>

                    {/* Card Details */}
                    <div className="p-5">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[9px] uppercase tracking-widest text-stone-400 font-semibold truncate">
                          {product.category}
                        </span>
                        <span className="text-[10px] text-stone-400 truncate max-w-[120px]">
                          {product.sellerName || 'Cartly Hub'}
                        </span>
                      </div>

                      <h3 className="font-serif text-base text-stone-900 group-hover:underline truncate">
                        {product.name}
                      </h3>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-sans text-sm font-medium text-stone-900">
                          {product.price}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-stone-400 group-hover:text-stone-900 transition-colors">
                          View →
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 text-center">
            <Link
              to={
                activeCategory === 'All'
                  ? '/shop'
                  : `/shop?category=${encodeURIComponent(activeCategory)}`
              }
              className="inline-block bg-stone-900 text-white text-xs uppercase tracking-[0.2em] font-medium py-4 px-10 hover:bg-black transition-colors"
            >
              {activeCategory === 'All'
                ? 'Explore All Campus Essentials'
                : `View All in ${activeCategory}`}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
