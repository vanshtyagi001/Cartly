import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { totalItems, setIsCartOpen } = useCart();
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate('/');
  };

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
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 text-stone-800 hover:text-stone-950 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-800 flex items-center justify-center font-medium text-xs">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+0.75rem)] w-56 bg-white border border-stone-200 shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-stone-100 mb-1">
                    <p className="text-xs font-medium text-stone-900 truncate">{user.name}</p>
                    <p className="text-[10px] text-stone-400 truncate">{user.email}</p>
                  </div>
                  <Link to="/orders" onClick={() => setIsUserMenuOpen(false)} className="block px-4 py-2 text-xs text-stone-700 hover:bg-stone-50">Your Orders</Link>
                  <Link to="/profile" onClick={() => setIsUserMenuOpen(false)} className="block px-4 py-2 text-xs text-stone-700 hover:bg-stone-50">Profile & Address</Link>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-stone-50 border-t border-stone-100 mt-1">Sign Out</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="text-xs uppercase tracking-widest text-stone-700 hover:text-stone-950 font-medium">Sign In</Link>
          )}

          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 text-stone-800 hover:text-stone-950 transition-colors"
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
