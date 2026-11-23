import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated, user, logout } = useAuth();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Destination after successful login
  const from = location.state?.from?.pathname || '/shop';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (isRegisterMode) {
      if (!formData.name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (!formData.email.trim()) {
        setError('Please enter your email address.');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      setIsSubmitting(true);
      try {
        await register(formData.name, formData.email, formData.password);
        setSuccessMessage('Welcome! Your account has been created.');
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 1200);
      } catch (err) {
        setError(err.message || 'Registration failed. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!formData.email.trim() || !formData.password) {
        setError('Please enter both email and password.');
        return;
      }

      setIsSubmitting(true);
      try {
        await login(formData.email, formData.password);
        setSuccessMessage('Welcome back! Signing you in...');
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 1000);
      } catch (err) {
        setError(err.message || 'Invalid email or password.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // If already authenticated and not redirecting
  if (isAuthenticated && !successMessage) {
    return (
      <main className="flex-1 bg-[#FAF9F6] border-t border-stone-200 py-20 px-6 sm:px-12 flex items-center justify-center min-h-[calc(100vh-88px)]">
        <div className="max-w-md w-full bg-white border border-stone-200 p-8 sm:p-12 shadow-sm text-center">
          <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-6 text-stone-800 font-serif text-2xl">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <h1 className="text-3xl font-serif text-stone-900 tracking-tight mb-2">
            You're Signed In
          </h1>
          <p className="text-stone-500 text-sm mb-1">{user?.name}</p>
          <p className="text-stone-400 text-xs mb-8">{user?.email}</p>

          <div className="flex flex-col gap-3">
            <Link
              to="/orders"
              className="w-full bg-stone-900 text-white text-xs uppercase tracking-[0.15em] font-medium py-3.5 hover:bg-black transition-colors"
            >
              View Your Orders
            </Link>
            <Link
              to="/shop"
              className="w-full bg-stone-100 text-stone-800 text-xs uppercase tracking-[0.15em] font-medium py-3.5 hover:bg-stone-200 transition-colors"
            >
              Continue Shopping
            </Link>
            <button
              onClick={logout}
              className="text-xs uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors mt-3 py-2"
            >
              Sign Out
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-[#FAF9F6] border-t border-stone-200 py-16 sm:py-24 px-6 sm:px-12 flex flex-col items-center justify-center min-h-[calc(100vh-88px)]">
      <div className="max-w-[440px] w-full">
        
        {/* Brand Header */}
        <div className="text-center mb-10">
          <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-stone-400 block mb-2">
            Campus Survival Hub
          </span>
          <h1 className="text-4xl font-serif text-stone-900 tracking-tight mb-3">
            {isRegisterMode ? 'Create Account.' : 'Welcome Back.'}
          </h1>
          <p className="text-stone-500 font-sans text-xs tracking-wide">
            {isRegisterMode
              ? 'Join Cartly to track campus orders and save essentials.'
              : 'Sign in to access your orders and checkout seamlessly.'}
          </p>
        </div>

        {/* Tab Toggle: Sign In / Create Account */}
        <div className="grid grid-cols-2 border-b border-stone-200 mb-8">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(false);
              setError('');
              setSuccessMessage('');
            }}
            className={`pb-3 text-xs uppercase tracking-widest font-medium transition-colors relative ${
              !isRegisterMode
                ? 'text-stone-900'
                : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            Sign In
            {!isRegisterMode && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-stone-900" />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(true);
              setError('');
              setSuccessMessage('');
            }}
            className={`pb-3 text-xs uppercase tracking-widest font-medium transition-colors relative ${
              isRegisterMode
                ? 'text-stone-900'
                : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            Create Account
            {isRegisterMode && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-stone-900" />
            )}
          </button>
        </div>

        {/* Form Container */}
        <div className="bg-white border border-stone-200 p-8 sm:p-10 shadow-sm">
          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200/60 text-red-800 text-xs flex items-start gap-2.5">
              <svg className="w-4 h-4 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
              <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name Field (Register Mode Only) */}
            {isRegisterMode && (
              <div>
                <label 
                  htmlFor="name" 
                  className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Aarav Sharma"
                  required={isRegisterMode}
                  className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-3 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none transition-all duration-200"
                />
              </div>
            )}

            {/* Email Field */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="student@campus.edu"
                required
                className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-3 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none transition-all duration-200"
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label 
                  htmlFor="password" 
                  className="block text-[10px] uppercase tracking-widest font-medium text-stone-500"
                >
                  Password
                </label>
                {!isRegisterMode && (
                  <span className="text-[10px] uppercase tracking-widest text-stone-400 cursor-not-allowed">
                    Min 6 characters
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-3 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none transition-all duration-200 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field (Register Mode Only) */}
            {isRegisterMode && (
              <div>
                <label 
                  htmlFor="confirmPassword" 
                  className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required={isRegisterMode}
                  className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-3 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none transition-all duration-200"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-stone-900 text-white text-xs uppercase tracking-[0.15em] font-medium py-3.5 hover:bg-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                <span>{isRegisterMode ? 'Create Account' : 'Sign In'}</span>
              )}
            </button>
          </form>

          {/* Mode Switch Helper */}
          <div className="mt-6 pt-6 border-t border-stone-100 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(prev => !prev);
                setError('');
                setSuccessMessage('');
              }}
              className="text-stone-500 hover:text-stone-900 text-xs transition-colors"
            >
              {isRegisterMode ? (
                <>Already have an account? <span className="underline font-medium text-stone-900">Sign In</span></>
              ) : (
                <>Need an account? <span className="underline font-medium text-stone-900">Create one</span></>
              )}
            </button>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-8">
          <Link
            to="/shop"
            className="text-[10px] uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors"
          >
            ← Return to Campus Catalog
          </Link>
        </div>
      </div>
    </main>
  );
}
