import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('cartly_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('cartly_auth_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Validate session on initial load if token exists
  useEffect(() => {
    const verifyUser = async () => {
      const savedToken = localStorage.getItem('cartly_auth_token');
      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${savedToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          localStorage.setItem('cartly_user', JSON.stringify(data.user));
        } else {
          // Token expired or invalid
          logout();
        }
      } catch (error) {
        console.error('Session validation error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    verifyUser();
  }, [API_URL]);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed. Please check your credentials.');
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('cartly_auth_token', data.token);
      localStorage.setItem('cartly_user', JSON.stringify(data.user));

      return { success: true, user: data.user };
    } catch (error) {
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed. Please try again.');
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('cartly_auth_token', data.token);
      localStorage.setItem('cartly_user', JSON.stringify(data.user));

      return { success: true, user: data.user };
    } catch (error) {
      throw error;
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const savedToken = localStorage.getItem('cartly_auth_token') || token;
      if (!savedToken) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedToken}`,
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile.');
      }

      setUser(data.user);
      localStorage.setItem('cartly_user', JSON.stringify(data.user));

      if (data.user.defaultAddress) {
        localStorage.setItem('cartly_shipping_address', JSON.stringify(data.user.defaultAddress));
      }

      return { success: true, user: data.user, message: data.message };
    } catch (error) {
      throw error;
    }
  };

  const updateUserState = (newUser) => {
    setUser(newUser);
    localStorage.setItem('cartly_user', JSON.stringify(newUser));
  };

  const refreshUser = async () => {
    const savedToken = localStorage.getItem('cartly_auth_token') || token;
    if (!savedToken) return null;
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem('cartly_user', JSON.stringify(data.user));
        return data.user;
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
    return null;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('cartly_auth_token');
    localStorage.removeItem('cartly_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        updateProfile,
        updateUserState,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
