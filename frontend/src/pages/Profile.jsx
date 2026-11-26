import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, isAuthenticated, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    campus: 'North Campus',
    hostelBlock: '',
    roomNumber: '',
    city: 'Delhi',
    pincode: '110007',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Populate data from user state
  useEffect(() => {
    if (user) {
      const defaultAddr = user.defaultAddress || {};
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || defaultAddr.phone || '',
        campus: defaultAddr.campus || 'North Campus',
        hostelBlock: defaultAddr.hostelBlock || '',
        roomNumber: defaultAddr.roomNumber || '',
        city: defaultAddr.city || 'Delhi',
        pincode: defaultAddr.pincode || '110007',
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
    if (successMessage) setSuccessMessage('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.name.trim()) {
      setErrorMessage('Full name cannot be empty.');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        defaultAddress: {
          fullName: formData.name.trim(),
          phone: formData.phone.trim(),
          campus: formData.campus.trim(),
          hostelBlock: formData.hostelBlock.trim(),
          roomNumber: formData.roomNumber.trim(),
          city: formData.city.trim() || 'Delhi',
          pincode: formData.pincode.trim() || '',
        },
      });

      setSuccessMessage('Profile and campus delivery address saved successfully!');
      setTimeout(() => {
        setSuccessMessage('');
      }, 4000);
    } catch (err) {
      console.error('Failed to save profile:', err);
      setErrorMessage(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // If not logged in, prompt to sign in
  if (!isAuthenticated) {
    return (
      <main className="flex-1 bg-[#FAF9F6] border-t border-stone-200 py-24 px-6 md:px-12 flex items-center justify-center min-h-[calc(100vh-88px)]">
        <div className="max-w-md w-full bg-white border border-stone-200 p-8 sm:p-12 text-center shadow-sm">
          <span className="text-[10px] uppercase tracking-[0.25em] font-medium text-stone-400 block mb-3">
            Authentication Required
          </span>
          <h1 className="text-3xl font-serif text-stone-900 tracking-tight mb-4">
            Sign In to Access Profile
          </h1>
          <p className="text-stone-500 text-xs leading-relaxed mb-8">
            Manage your personal profile, saved campus delivery address, and order records in one place.
          </p>
          <Link
            to="/login"
            state={{ from: { pathname: '/profile' } }}
            className="inline-block w-full bg-stone-900 text-white text-xs uppercase tracking-[0.15em] font-medium py-4 hover:bg-black transition-colors"
          >
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-[#FAF9F6] border-t border-stone-200 py-16 lg:py-24 px-6 md:px-12 min-h-[calc(100vh-88px)]">
      <div className="max-w-[880px] mx-auto">
        
        {/* Page Header */}
        <div className="mb-10 pb-6 border-b border-stone-200 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-stone-400 block mb-2">
              Student Account
            </span>
            <h1 className="text-4xl md:text-5xl font-serif text-stone-900 tracking-tight">
              Your Profile.
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <Link
              to="/orders"
              className="text-[10px] uppercase tracking-widest text-stone-500 hover:text-stone-900 transition-colors border-b border-stone-300 pb-1"
            >
              Your Orders
            </Link>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="text-[10px] uppercase tracking-widest text-red-600 hover:text-red-800 transition-colors border-b border-red-200 pb-1"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Feedback Banners */}
        {successMessage && (
          <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
            <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-3">
            <svg className="w-4 h-4 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-10">
          
          {/* Section 1: Personal Details */}
          <section className="bg-white border border-stone-200 p-8 sm:p-10 shadow-sm">
            <div className="flex items-center gap-4 pb-6 mb-6 border-b border-stone-200">
              <div className="w-12 h-12 rounded-full bg-stone-900 text-white flex items-center justify-center font-serif text-lg shrink-0">
                {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h2 className="text-xl font-serif text-stone-900 tracking-tight">
                  Personal Information
                </h2>
                <p className="text-stone-400 text-xs">
                  Basic details linked to your campus account
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-3 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                  Registered Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full bg-stone-100 border border-stone-200 px-4 py-3 text-stone-500 text-sm cursor-not-allowed"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">Account identity cannot be modified</span>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                  Mobile Number (For Courier Call)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="10-digit mobile number"
                  className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-3 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>
          </section>

          {/* Section 2: Default Campus Delivery Address */}
          <section className="bg-white border border-stone-200 p-8 sm:p-10 shadow-sm">
            <div className="pb-6 mb-6 border-b border-stone-200">
              <h2 className="text-xl font-serif text-stone-900 tracking-tight">
                Default Campus Delivery Address
              </h2>
              <p className="text-stone-400 text-xs">
                Primary campus delivery destination
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              {/* Campus Name */}
              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                  Campus / University
                </label>
                <input
                  type="text"
                  name="campus"
                  value={formData.campus}
                  onChange={handleInputChange}
                  placeholder="e.g. North Campus / Central University"
                  className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-3 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none transition-all"
                />
              </div>

              {/* Hostel / Block */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                  Hostel / Building / Block
                </label>
                <input
                  type="text"
                  name="hostelBlock"
                  value={formData.hostelBlock}
                  onChange={handleInputChange}
                  placeholder="e.g. Tagore Hostel, Block B"
                  className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-3 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none transition-all"
                />
              </div>

              {/* Room Number */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                  Room / Door Number
                </label>
                <input
                  type="text"
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleInputChange}
                  placeholder="e.g. Room 304 / Wing A"
                  className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-3 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none transition-all"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="City"
                  className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-3 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none transition-all"
                />
              </div>

              {/* Pincode */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                  Pincode
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  placeholder="Pincode"
                  className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-3 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none transition-all"
                />
              </div>

            </div>
          </section>

          {/* Submit Action */}
          <div className="flex items-center justify-between pt-2">
            <Link
              to="/shop"
              className="text-[10px] uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors"
            >
              ← Back to Campus Catalog
            </Link>

            <button
              type="submit"
              disabled={isSaving}
              className="bg-stone-900 text-white text-xs uppercase tracking-[0.15em] font-medium py-4 px-10 hover:bg-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
            >
              {isSaving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Saving Changes...</span>
                </>
              ) : (
                <span>Save Profile & Address</span>
              )}
            </button>
          </div>

        </form>

        {/* Registered Campus Seller Company Section */}
        {user?.isSeller && (
          <section className="mt-10 bg-white border border-stone-200 p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-stone-200">
              <div>
                <span className="text-[10px] uppercase tracking-[0.25em] font-medium text-stone-400 block mb-1">
                  Campus Seller Account
                </span>
                <h2 className="font-serif text-2xl text-stone-900">
                  Registered Company & Store Profile
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] uppercase tracking-wider font-semibold self-start sm:self-auto">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                Verified Seller
              </span>
            </div>

            <div className="p-5 bg-[#FAF9F6] border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[9px] uppercase tracking-widest text-stone-400 font-semibold block mb-1">
                  Registered Business Name
                </span>
                <p className="font-serif text-lg text-stone-900 font-medium">
                  {user.sellerProfile?.storeName || user.sellerDetails?.storeName || `${user.name}'s Campus Depot`}
                </p>
                <p className="text-stone-500 text-xs mt-1">
                  {user.sellerProfile?.campusLocation || user.sellerDetails?.campusLocation || 'North Campus'}
                </p>
              </div>
              <Link
                to="/seller"
                state={{ tab: 'settings' }}
                className="bg-stone-900 text-white text-xs uppercase tracking-[0.15em] font-medium py-3 px-6 hover:bg-black transition-colors text-center shrink-0"
              >
                Change Company Name →
              </Link>
            </div>
          </section>
        )}

      </div>
    </main>
  );
}
