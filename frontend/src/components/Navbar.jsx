import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';

export default function Navbar() {
  const { setIsCartOpen, cartCount } = useCart();
  const { user, token, isAuthenticated, logout } = useAuth();
  const { wishlistIds } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchNotifications = async () => {
    if (!isAuthenticated || !token) return;
    try {
      const res = await fetch(`${API_URL}/api/auth/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [isAuthenticated, token, location.pathname]);

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      await fetch(`${API_URL}/api/auth/notifications`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  // Easter Egg State
  const originalLogo = "Cartly.";
  const [logoText, setLogoText] = useState(originalLogo);
  const [isScrambling, setIsScrambling] = useState(false);

  const [shopCategories, setShopCategories] = useState([
    "All Products",
    "Hostel Essentials",
    "Electronics",
    "Stationery",
    "Trekking Essentials"
  ]);

  // Fetch live categories from backend
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    fetch(`${apiUrl}/api/categories`)
      .then(res => res.json())
      .then(data => {
        if (data?.categories && Array.isArray(data.categories)) {
          setShopCategories(["All Products", ...data.categories]);
        }
      })
      .catch(() => {});
  }, []);

  // Close user & notification dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scramble Animation & Home Navigation
  const triggerCipherAnimation = () => {
    if (isScrambling) return; 
    setIsScrambling(true);

    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let iterations = 0;
    
    const interval = setInterval(() => {
      setLogoText(originalLogo.split("").map((letter, index) => {
        if (index < iterations) {
          return originalLogo[index]; 
        }
        return letters[Math.floor(Math.random() * 26)]; 
      }).join(""));
      
      if (iterations >= originalLogo.length) {
        clearInterval(interval);
        setLogoText(originalLogo);
        setIsScrambling(false);
      }
      
      iterations += 1 / 4; 
    }, 30);
  };

  const handleLogoClick = (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();

    // 1. Navigate to home if on another page
    if (location.pathname !== '/') {
      navigate('/');
    }

    // 2. Scroll smoothly to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 3. Play the signature cipher animation
    setTimeout(() => {
      triggerCipherAnimation();
    }, 60);
  };

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    logout();
    navigate('/');
  };

  return (
    <nav className="flex items-center justify-between px-8 md:px-12 py-5 bg-[#FAF9F6] text-stone-900 sticky top-0 z-50 transition-all duration-300">
      
      {/* Left: Logo with Easter Egg & Navigation */}
      <div className="flex-1 flex items-center justify-start z-20">
        <Link 
          to="/"
          onClick={handleLogoClick}
          className="text-3xl font-serif tracking-tight text-stone-900 cursor-pointer select-none inline-block focus:outline-none"
          title="Cartly Home"
        >
          {logoText}
        </Link>
      </div>

      {/* Center: Navigation Links */}
      <div className="hidden md:flex items-center justify-center space-x-12 z-20">
        <Link 
          to="/" 
          className="text-[11px] uppercase tracking-[0.2em] font-medium text-stone-500 hover:text-stone-900 transition-colors"
        >
          Home
        </Link>
        
        {/* Standard Dropdown */}
        <div className="relative group py-4">
          <Link 
            to="/shop" 
            className="text-[11px] uppercase tracking-[0.2em] font-medium text-stone-500 hover:text-stone-900 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            Shop
            <svg className="w-3 h-3 transition-transform duration-300 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
            </svg>
          </Link>
          
          <div className="absolute top-full left-0 w-full h-2" />

          <div className="absolute top-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out transform group-hover:translate-y-0 translate-y-2 z-50">
            <div className="w-56 bg-[#FAF9F6] border border-stone-200/60 shadow-xl shadow-stone-900/5 py-4">
              <div className="flex flex-col gap-1">
                {shopCategories.map((category, index) => (
                  <Link 
                    key={index}
                    to={category === "All Products" ? "/shop" : `/shop?category=${encodeURIComponent(category)}`}
                    className="group/item flex items-center justify-between px-6 py-2 transition-colors"
                  >
                    <span className={`relative text-[10px] uppercase tracking-widest font-medium text-stone-500 group-hover/item:text-stone-900 transition-colors pb-0.5
                      after:absolute after:bottom-0 after:left-0 after:h-[1px] after:bg-stone-900 after:transition-all after:duration-[400ms] after:ease-[cubic-bezier(0.25,0.1,0.25,1)] after:w-0 group-hover/item:after:w-full
                    `}>
                      {category}
                    </span>
                    <svg className="w-3 h-3 text-stone-900 opacity-0 -translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Link 
          to="/orders" 
          className="text-[11px] uppercase tracking-[0.2em] font-medium text-stone-500 hover:text-stone-900 transition-colors"
        >
          Your Orders
        </Link>
      </div>

      {/* Right: User Account & Cart Icon */}
      <div className="flex-1 flex items-center justify-end gap-5 z-20">
        
        {/* User Account / Auth Trigger */}
        {isAuthenticated && user ? (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(prev => !prev)}
              className="flex items-center gap-2 p-1 text-stone-900 hover:text-stone-600 transition-colors group focus:outline-none"
              aria-label="User menu"
            >
              <div className="w-8 h-8 rounded-full bg-stone-900 text-[#FAF9F6] flex items-center justify-center text-xs font-medium tracking-tight shadow-sm group-hover:bg-black transition-colors">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="hidden lg:inline text-xs font-serif tracking-tight text-stone-800 max-w-[100px] truncate">
                {user.name.split(' ')[0]}
              </span>
              <svg className={`w-3 h-3 text-stone-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* User Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 top-[calc(100%+0.75rem)] w-60 bg-white border border-stone-200 shadow-xl py-3 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-5 py-2 border-b border-stone-100 mb-2">
                  <p className="text-xs font-medium text-stone-900 truncate">{user.name}</p>
                  <p className="text-[11px] text-stone-400 truncate">{user.email}</p>
                </div>

                <Link
                  to="/orders"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center justify-between px-5 py-2 text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
                >
                  <span className="uppercase tracking-widest text-[10px]">Your Orders</span>
                  <svg className="w-3.5 h-3.5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <Link
                  to="/wishlist"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center justify-between px-5 py-2 text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
                >
                  <span className="uppercase tracking-widest text-[10px]">
                    Saved Wishlist {wishlistIds.length > 0 ? `(${wishlistIds.length})` : ''}
                  </span>
                  <svg className="w-3.5 h-3.5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <Link
                  to="/profile"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center justify-between px-5 py-2 text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
                >
                  <span className="uppercase tracking-widest text-[10px]">Profile & Address</span>
                  <svg className="w-3.5 h-3.5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <Link
                  to="/seller"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center justify-between px-5 py-2 text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
                >
                  <span className="uppercase tracking-widest text-[10px]">
                    {user?.isSeller ? "Seller Studio" : "Sell on Cartly"}
                  </span>
                  <svg className="w-3.5 h-3.5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <Link
                  to="/shop"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center justify-between px-5 py-2 text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
                >
                  <span className="uppercase tracking-widest text-[10px]">Explore Catalog</span>
                  <svg className="w-3.5 h-3.5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <div className="border-t border-stone-100 my-2" />

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-5 py-2 text-[10px] uppercase tracking-widest text-red-600 hover:bg-red-50/60 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="text-[11px] uppercase tracking-[0.2em] font-medium text-stone-500 hover:text-stone-900 transition-colors flex items-center gap-1.5"
            title="Sign In"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Sign In</span>
          </Link>
        )}

        {/* Notification Bell for Signed-In Users */}
        {isAuthenticated && (
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setIsNotifOpen((prev) => !prev);
                if (!isNotifOpen) fetchNotifications();
              }}
              className="relative p-2 text-stone-700 hover:text-stone-900 transition-colors"
              aria-label="Notifications"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-stone-900" />
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 top-[calc(100%+0.75rem)] w-80 bg-white border border-stone-200 shadow-xl z-50">
                <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-stone-800">
                    Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}
                  </span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-[10px] uppercase tracking-wider text-stone-400 hover:text-stone-900 underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-stone-100">
                  {notifications.length === 0 ? (
                    <p className="p-6 text-center text-xs text-stone-400 font-serif italic">
                      No notifications yet.
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <Link
                        key={n.id}
                        to={n.link || '/'}
                        onClick={() => setIsNotifOpen(false)}
                        className={`block px-4 py-3 hover:bg-stone-50 transition-colors ${
                          !n.read ? 'bg-[#FAF9F6]' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="text-xs font-medium text-stone-900 truncate">{n.title}</span>
                          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-stone-900 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-stone-500 line-clamp-2">{n.message}</p>
                        {n.date && <span className="text-[9px] text-stone-400 mt-1 block">{n.date}</span>}
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cart Drawer Trigger */}
        <button 
          onClick={() => setIsCartOpen(true)}
          className="relative p-2 text-stone-900 hover:text-stone-500 transition-colors flex items-center group"
          aria-label="Open cart"
        >
          <svg className="w-5 h-5 transition-transform duration-300 group-hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-stone-900 text-white text-[9px] font-medium rounded-full">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
