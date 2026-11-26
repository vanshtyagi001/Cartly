import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function Store() {
  const { sellerId } = useParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    setIsLoading(true);
    setError('');
    setActiveCategory('All');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    fetch(`${API_URL}/api/seller/store/${sellerId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Store not found.');
        }
        return data;
      })
      .then((data) => {
        setStore(data.store || null);
        setProducts(Array.isArray(data.products) ? data.products : []);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Could not load campus store.');
        setIsLoading(false);
      });
  }, [sellerId, API_URL]);

  if (isLoading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center py-32 bg-[#FAF9F6] border-t border-stone-200 w-full min-h-[calc(100vh-88px)]">
        <span className="text-stone-400 font-serif italic text-xl">Loading campus storefront...</span>
      </main>
    );
  }

  if (error || !store) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center py-32 bg-[#FAF9F6] border-t border-stone-200 w-full min-h-[calc(100vh-88px)] px-6 text-center">
        <span className="text-stone-400 font-serif italic text-xl mb-6">
          {error || 'Campus storefront not found.'}
        </span>
        <Link
          to="/shop"
          className="text-[11px] uppercase tracking-widest text-stone-900 border-b border-stone-900 pb-1 hover:text-stone-500 hover:border-stone-500 transition-colors"
        >
          Browse All Essentials
        </Link>
      </main>
    );
  }

  const categories = ['All', ...new Set(products.map((p) => p.category).filter(Boolean))];
  const filteredProducts =
    activeCategory === 'All'
      ? products
      : products.filter((p) => p.category === activeCategory);

  return (
    <main className="flex-1 bg-white border-t border-stone-200 w-full min-h-[calc(100vh-88px)]">
      {/* Storefront Header */}
      <section className="bg-[#FAF9F6] border-b border-stone-200 py-14 lg:py-20 px-6 md:px-12">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-stone-400">
                Campus Storefront
              </span>
              {store.isVerified && (
                <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Verified Seller
                </span>
              )}
            </div>

            <h1 className="text-4xl sm:text-5xl font-serif text-stone-900 tracking-tight mb-3">
              {store.storeName}
            </h1>

            <p className="text-stone-500 text-xs uppercase tracking-[0.15em] font-medium mb-4">
              {store.campusLocation}
            </p>

            {store.bio && (
              <p className="text-stone-600 text-sm leading-relaxed max-w-xl">
                {store.bio}
              </p>
            )}
          </div>

          <div className="flex items-center gap-8 border-t md:border-t-0 pt-6 md:pt-0 border-stone-200 shrink-0">
            <div>
              <span className="text-[9px] uppercase tracking-widest text-stone-400 font-semibold block mb-1">
                Active Listings
              </span>
              <span className="font-serif text-3xl text-stone-900">{products.length}</span>
            </div>
            <Link
              to="/shop"
              className="text-[10px] uppercase tracking-[0.2em] font-medium text-stone-700 hover:text-stone-900 border border-stone-300 bg-white px-5 py-3 transition-colors"
            >
              All Campus Items →
            </Link>
          </div>
        </div>
      </section>

      {/* Catalog Section */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-12 py-12 lg:py-16">
        {categories.length > 2 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 border-b border-stone-200">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 text-[10px] uppercase tracking-widest font-medium whitespace-nowrap border transition-colors ${
                  activeCategory === cat
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-[#FAF9F6] text-stone-600 border-stone-200 hover:border-stone-400 hover:text-stone-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {filteredProducts.length === 0 ? (
          <div className="py-24 text-center bg-[#FAF9F6] border border-stone-200">
            <span className="text-stone-400 font-serif italic text-xl block mb-2">
              No items listed in this category yet.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {filteredProducts.map((product) => (
              <Link
                to={`/product/${product.id}`}
                key={product.id}
                className="group cursor-pointer block"
              >
                <div className="aspect-square w-full bg-[#FAF9F6] overflow-hidden border border-stone-200 mb-4 relative">
                  <img
                    src={product.img}
                    alt={product.name}
                    className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,0.1,0.25,1)]"
                  />
                  {product.stock <= 0 && (
                    <span className="absolute top-3 right-3 bg-white/95 border border-stone-200 text-red-700 text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5">
                      Out of Stock
                    </span>
                  )}
                </div>

                <div className="flex flex-col pr-2">
                  <span className="text-[9px] uppercase tracking-widest text-stone-400 block mb-1.5">
                    {product.category}
                  </span>
                  <h4 className="text-stone-900 font-serif text-base leading-tight line-clamp-2 group-hover:underline">
                    {product.name}
                  </h4>
                  <span className="text-stone-500 font-sans text-sm tracking-wide mt-1">
                    {product.price}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
