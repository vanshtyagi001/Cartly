import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const { user, token, isAuthenticated } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const [wishlistIds, setWishlistIds] = useState(() => {
    try {
      const saved = localStorage.getItem('cartly_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync wishlist with backend when signed in
  useEffect(() => {
    if (isAuthenticated && user) {
      const serverIds = Array.isArray(user.wishlist) ? user.wishlist : [];
      setWishlistIds(serverIds);
      localStorage.setItem('cartly_wishlist', JSON.stringify(serverIds));
    }
  }, [isAuthenticated, user]);

  const isWishlisted = (productId) => {
    const numId = Number(productId);
    return wishlistIds.includes(numId);
  };

  const toggleWishlist = async (productId) => {
    const numId = Number(productId);
    if (!numId) return;

    // Optimistic update
    setWishlistIds((prev) => {
      const exists = prev.includes(numId);
      const next = exists ? prev.filter((id) => id !== numId) : [...prev, numId];
      localStorage.setItem('cartly_wishlist', JSON.stringify(next));
      return next;
    });

    if (isAuthenticated && token) {
      try {
        const res = await fetch(`${API_URL}/api/auth/wishlist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId: numId }),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.wishlist)) {
            setWishlistIds(data.wishlist);
            localStorage.setItem('cartly_wishlist', JSON.stringify(data.wishlist));
          }
        }
      } catch (err) {
        console.error('Wishlist sync error:', err);
      }
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        isWishlisted,
        toggleWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return ctx;
};
