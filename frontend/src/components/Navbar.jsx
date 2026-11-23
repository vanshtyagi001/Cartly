import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { totalItems, setIsCartOpen } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link to="/" className="font-serif text-2xl font-bold tracking-tight text-stone-900">
            Cartly<span className="text-amber-800">.</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-widest text-stone-600 font-medium">
            <Link to="/shop" className="hover:text-stone-900 transition-colors">Shop Catalog</Link>
            <Link to="/#categories" className="hover:text-stone-900 transition-colors">Categories</Link>
            <Link to="/#about" className="hover:text-stone-900 transition-colors">Manifesto</Link>
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 text-stone-800 hover:text-stone-950 transition-colors group"
            aria-label="Shopping Cart"
          >
            <span className="text-xs uppercase tracking-widest font-medium hidden sm:inline-block">Bag</span>
            <div className="relative p-1">
              <svg className="w-5 h-5 text-stone-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-900 text-stone-100 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-semibold">
                  {totalItems}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
