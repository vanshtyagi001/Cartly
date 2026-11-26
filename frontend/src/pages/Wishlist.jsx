import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

export default function Wishlist() {
  const { wishlistIds, toggleWishlist } = useWishlist();
  const { addToCart, setIsCartOpen } = useCart();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetch(`${API_URL}/api/products`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [API_URL]);

  const savedProducts = products.filter((p) => wishlistIds.includes(Number(p.id)));

  const handleMoveToCart = (product) => {
    addToCart(product, 1);
    toggleWishlist(product.id);
    setIsCartOpen(true);
  };

  return (
    <main className="flex-1 bg-[#FAF9F6] border-t border-stone-200 py-14 lg:py-20 px-6 md:px-12 min-h-[calc(100vh-88px)]">
      <div className="max-w-[1280px] mx-auto">
        <div className="mb-10 pb-6 border-b border-stone-200 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-stone-400 block mb-2">
              Personal Collection
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif text-stone-900 tracking-tight">
              Saved Wishlist ({savedProducts.length})
            </h1>
          </div>
          <Link
            to="/shop"
            className="text-[10px] uppercase tracking-[0.2em] font-medium text-stone-700 hover:text-stone-900 border-b border-stone-400 pb-0.5 transition-colors self-start sm:self-auto"
          >
            Continue Browsing →
          </Link>
        </div>

        {isLoading ? (
          <div className="py-24 text-center text-stone-400 font-serif italic text-xl">
            Loading saved items...
          </div>
        ) : savedProducts.length === 0 ? (
          <div className="bg-white border border-stone-200 p-14 text-center shadow-sm">
            <span className="font-serif italic text-xl text-stone-400 block mb-3">
              Your wishlist is empty.
            </span>
            <p className="text-xs text-stone-500 max-w-md mx-auto mb-8 leading-relaxed">
              Bookmark hostel, stationery, or electronics essentials while browsing to keep track of items for later.
            </p>
            <Link
              to="/shop"
              className="inline-block bg-stone-900 text-white text-[10px] uppercase tracking-[0.2em] font-medium py-3.5 px-8 hover:bg-black transition-colors"
            >
              Explore Campus Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {savedProducts.map((product) => {
              const inStock = (product.stock !== undefined ? product.stock : 25) > 0;
              return (
                <div
                  key={product.id}
                  className="bg-white border border-stone-200 flex flex-col justify-between group hover:border-stone-400 transition-colors"
                >
                  <Link to={`/product/${product.id}`} className="block">
                    <div className="aspect-square bg-[#FAF9F6] border-b border-stone-200 overflow-hidden relative">
                      <img
                        src={product.img}
                        alt={product.name}
                        className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                    <div className="p-5">
                      <span className="text-[9px] uppercase tracking-widest text-stone-400 block mb-1">
                        {product.category}
                      </span>
                      <h3 className="font-serif text-base text-stone-900 group-hover:underline line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="font-sans text-sm text-stone-600 mt-1.5">{product.price}</p>
                    </div>
                  </Link>

                  <div className="px-5 pb-5 pt-2 flex items-center gap-2 border-t border-stone-100">
                    <button
                      type="button"
                      disabled={!inStock}
                      onClick={() => handleMoveToCart(product)}
                      className="flex-1 bg-stone-900 text-white text-[10px] uppercase tracking-[0.15em] font-medium py-2.5 hover:bg-black transition-colors disabled:opacity-40"
                    >
                      {inStock ? 'Move to Cart' : 'Out of Stock'}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleWishlist(product.id)}
                      className="px-3 py-2.5 border border-stone-200 text-stone-500 hover:text-red-700 hover:border-red-200 text-[10px] uppercase tracking-wider transition-colors"
                      aria-label="Remove from wishlist"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
