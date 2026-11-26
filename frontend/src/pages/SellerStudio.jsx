import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProductImagesInput from '../components/ProductImagesInput';

export default function SellerStudio() {
  const { user, token, isAuthenticated, updateProfile, updateUserState, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const [activeTab, setActiveTab] = useState(location.state?.tab || 'inventory'); // 'inventory' | 'orders' | 'settings'
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: '₹0.00',
  });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [categories, setCategories] = useState([
    'Hostel Essentials',
    'Electronics',
    'Stationery',
    'Trekking Essentials',
  ]);
  const [isLoading, setIsLoading] = useState(true);

  // Store Profile & Registered Company Name State
  const initialSellerProfile = user?.sellerProfile || user?.sellerDetails || {};
  const [storeProfileForm, setStoreProfileForm] = useState({
    storeName: initialSellerProfile.storeName || (user?.name ? `${user.name.split(' ')[0]}'s Campus Depot` : ''),
    campusLocation: initialSellerProfile.campusLocation || (user?.defaultAddress?.hostelBlock ? `${user.defaultAddress.hostelBlock}, Room ${user.defaultAddress.roomNumber}` : 'North Campus'),
    phone: initialSellerProfile.phone || user?.phone || '',
    bio: initialSellerProfile.bio || '',
  });
  const [isUpdatingStoreProfile, setIsUpdatingStoreProfile] = useState(false);
  const [storeProfileSuccess, setStoreProfileSuccess] = useState('');
  const [storeProfileError, setStoreProfileError] = useState('');

  // Keep form synced if user state refreshes
  useEffect(() => {
    const prof = user?.sellerProfile || user?.sellerDetails;
    if (prof) {
      setStoreProfileForm({
        storeName: prof.storeName || (user?.name ? `${user.name.split(' ')[0]}'s Campus Depot` : ''),
        campusLocation: prof.campusLocation || 'North Campus',
        phone: prof.phone || user?.phone || '',
        bio: prof.bio || '',
      });
    }
  }, [user]);

  // Sync tab if user arrives with route state
  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  // Onboarding state
  const [onboardForm, setOnboardForm] = useState({
    storeName: user?.name ? `${user.name.split(' ')[0]}'s Campus Depot` : '',
    campusLocation: user?.defaultAddress?.hostelBlock ? `${user.defaultAddress.hostelBlock}, Room ${user.defaultAddress.roomNumber}` : 'North Campus',
    phone: user?.phone || '',
    bio: '',
  });
  const [isOnboarding, setIsOnboarding] = useState(false);

  // New Product Modal / Form State
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Hostel Essentials',
    price: '',
    stock: 25,
    img: '',
    images: [],
    description: '',
  });
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Sample image presets for student sellers
  const imagePresets = [
    { label: 'Notebook', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800&auto=format&fit=crop' },
    { label: 'Desk Lamp', url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?q=80&w=800&auto=format&fit=crop' },
    { label: 'Calculator', url: 'https://images.unsplash.com/photo-1574607407408-1e681c46041d?q=80&w=800&auto=format&fit=crop' },
    { label: 'Pens Set', url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=800&auto=format&fit=crop' },
    { label: 'Backpack', url: 'https://images.unsplash.com/photo-1760715651666-c3e408bfdda7?auto=format&fit=crop&w=800&q=80' },
    { label: 'Headphones', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop' },
  ];

  // Fetch Seller Dashboard Data
  const loadSellerData = async () => {
    if (!token || !user?.isSeller) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Load stats
      const statsRes = await fetch(`${API_URL}/api/seller/dashboard`, { headers });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats || {});
      }

      // Load products
      const prodsRes = await fetch(`${API_URL}/api/seller/products`, { headers });
      if (prodsRes.ok) {
        const prodsData = await prodsRes.json();
        setProducts(prodsData || []);
      }

      // Load orders
      const ordersRes = await fetch(`${API_URL}/api/seller/orders`, { headers });
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData || []);
      }

      // Load buyer questions
      const qRes = await fetch(`${API_URL}/api/seller/questions`, { headers });
      if (qRes.ok) {
        const qData = await qRes.json();
        setQuestions(qData.questions || []);
      }

      // Load active platform categories
      const catRes = await fetch(`${API_URL}/api/categories`);
      if (catRes.ok) {
        const catData = await catRes.json();
        if (catData?.categories && Array.isArray(catData.categories)) {
          setCategories(catData.categories);
        }
      }
    } catch (err) {
      console.error('Failed to load seller studio data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSellerData();
  }, [token, user?.isSeller]);

  // Handle Seller Onboarding
  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    setIsOnboarding(true);

    try {
      const res = await fetch(`${API_URL}/api/seller/onboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(onboardForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to onboard seller.');
      }

      // Update user in context
      await updateProfile({
        name: user.name,
        phone: onboardForm.phone,
      });

      setActionSuccess(data.message || 'Store registered successfully!');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsOnboarding(false);
    }
  };

  // Add New Product
  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    setActionError('');
    if (!newProduct.img || !newProduct.img.trim()) {
      setActionError('Featured product image is compulsory and will be shown as the thumbnail on /shop.');
      return;
    }
    setIsSavingProduct(true);

    try {
      const res = await fetch(`${API_URL}/api/seller/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newProduct),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add product.');
      }

      setActionSuccess(data.message || 'Product listed successfully!');
      setIsAddingProduct(false);
      setNewProduct({
        name: '',
        category: 'Hostel Essentials',
        price: '',
        stock: 25,
        img: '',
        images: [],
        description: '',
      });
      loadSellerData();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Update Existing Product
  const handleUpdateProductSubmit = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    setActionError('');
    if (!editingProduct.img || !editingProduct.img.trim()) {
      setActionError('Featured product image is compulsory and cannot be empty.');
      return;
    }
    setIsUpdatingProduct(true);

    try {
      const res = await fetch(`${API_URL}/api/seller/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editingProduct.name,
          category: editingProduct.category,
          price: editingProduct.rawPrice !== undefined ? editingProduct.rawPrice : editingProduct.price,
          stock: Math.max(0, parseInt(editingProduct.stock, 10) || 0),
          img: editingProduct.img,
          images: editingProduct.images || [],
          description: editingProduct.description,
          inStock: Number(editingProduct.stock) > 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update product.');
      }

      setActionSuccess(data.message || 'Product updated successfully!');
      setEditingProduct(null);
      loadSellerData();
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsUpdatingProduct(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to remove this item from your campus catalog?')) return;

    try {
      const res = await fetch(`${API_URL}/api/seller/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setActionSuccess('Product removed from catalog.');
        loadSellerData();
        setTimeout(() => setActionSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Update Order Status
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/seller/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setActionSuccess(`Order #${orderId} updated to ${newStatus}.`);
        loadSellerData();
        setTimeout(() => setActionSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Status update error:', err);
    }
  };

  const handleReturnAction = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/seller/orders/${orderId}/return`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setActionSuccess(`Return request on Order #${orderId} marked as ${newStatus}.`);
        loadSellerData();
        setTimeout(() => setActionSuccess(''), 4000);
      }
    } catch (err) {
      console.error('Return action error:', err);
    }
  };

  const handleReplyQuestion = async (questionId) => {
    const answer = (replyDrafts[questionId] || '').trim();
    if (!answer) return;
    try {
      const res = await fetch(`${API_URL}/api/seller/questions/${questionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answer }),
      });
      if (res.ok) {
        setReplyDrafts((prev) => ({ ...prev, [questionId]: '' }));
        setActionSuccess('Reply published to product page.');
        loadSellerData();
        setTimeout(() => setActionSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Reply error:', err);
    }
  };

  // Update Registered Company / Store Profile
  const handleUpdateStoreProfile = async (e) => {
    e.preventDefault();
    setStoreProfileError('');
    setStoreProfileSuccess('');

    const cleanStoreName = storeProfileForm.storeName.trim();
    if (!cleanStoreName) {
      setStoreProfileError('Registered Company / Store name is required.');
      return;
    }

    setIsUpdatingStoreProfile(true);
    try {
      const res = await fetch(`${API_URL}/api/seller/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          storeName: cleanStoreName,
          campusLocation: storeProfileForm.campusLocation.trim() || 'North Campus',
          phone: storeProfileForm.phone.trim(),
          bio: storeProfileForm.bio.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update store company profile.');
      }

      if (data.user && updateUserState) {
        updateUserState(data.user);
      } else if (refreshUser) {
        await refreshUser();
      }

      // Update local products in state with new sellerName and sellerLocation
      setProducts(prev => prev.map(p => ({
        ...p,
        sellerName: cleanStoreName,
        sellerLocation: storeProfileForm.campusLocation.trim() || p.sellerLocation,
      })));

      setStoreProfileSuccess(`Company name successfully updated to "${cleanStoreName}". All your active product listings now display this registered seller name!`);
      setActionSuccess(`Registered company name updated to "${cleanStoreName}".`);
      setTimeout(() => setStoreProfileSuccess(''), 6000);
      setTimeout(() => setActionSuccess(''), 6000);

      // Refresh seller dashboard data
      loadSellerData();
    } catch (err) {
      console.error('Failed to update company name:', err);
      setStoreProfileError(err.message || 'Failed to update company details.');
    } finally {
      setIsUpdatingStoreProfile(false);
    }
  };

  // Require Auth
  if (!isAuthenticated) {
    return (
      <main className="flex-1 bg-[#FAF9F6] border-t border-stone-200 py-24 px-6 flex items-center justify-center min-h-[calc(100vh-88px)]">
        <div className="max-w-md w-full bg-white border border-stone-200 p-8 sm:p-12 text-center shadow-sm">
          <span className="text-[10px] uppercase tracking-[0.25em] font-medium text-stone-400 block mb-3">
            Cartly Seller Hub
          </span>
          <h1 className="text-3xl font-serif text-stone-900 tracking-tight mb-4">
            Sign In to Seller Studio
          </h1>
          <p className="text-stone-500 text-xs leading-relaxed mb-8">
            Access your campus listings, manage customer orders, and view student earnings.
          </p>
          <Link
            to="/login"
            state={{ from: { pathname: '/seller' } }}
            className="inline-block w-full bg-stone-900 text-white text-xs uppercase tracking-[0.15em] font-medium py-4 hover:bg-black transition-colors"
          >
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  const sellerStatus = (user?.sellerStatus || (user?.isSeller ? 'approved' : 'none')).toLowerCase();
  const sellerProfile = user?.sellerProfile || user?.sellerDetails || {};

  // 1. PENDING APPROVAL VIEW: Waiting for Campus Admin Verification
  if (sellerStatus === 'pending') {
    return (
      <main className="flex-1 bg-[#FAF9F6] border-t border-stone-200 py-20 px-6 flex items-center justify-center min-h-[calc(100vh-88px)]">
        <div className="max-w-xl w-full bg-white border border-stone-200 p-8 sm:p-12 shadow-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 text-[10px] uppercase tracking-[0.2em] font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Application Under Review
          </div>

          <h1 className="text-3xl sm:text-4xl font-serif text-stone-900 tracking-tight mb-4">
            Waiting for Campus Approval
          </h1>

          <p className="text-stone-600 font-sans text-sm leading-relaxed mb-6">
            Thank you for applying to sell on Cartly. Your seller application for <strong className="text-stone-900">{sellerProfile.storeName || 'your campus store'}</strong> has been submitted to campus administrators for location and student identity verification.
          </p>

          {/* Application summary receipt */}
          <div className="bg-[#FAF9F6] border border-stone-200 p-5 mb-8 space-y-3 text-xs">
            <div className="flex justify-between border-b border-stone-200/60 pb-2">
              <span className="text-stone-400 uppercase tracking-wider text-[10px]">Store Name</span>
              <span className="font-serif text-stone-900 font-medium">{sellerProfile.storeName || 'Campus Store'}</span>
            </div>
            <div className="flex justify-between border-b border-stone-200/60 pb-2">
              <span className="text-stone-400 uppercase tracking-wider text-[10px]">Pickup Location</span>
              <span className="text-stone-800">{sellerProfile.campusLocation || 'North Campus'}</span>
            </div>
            <div className="flex justify-between border-b border-stone-200/60 pb-2">
              <span className="text-stone-400 uppercase tracking-wider text-[10px]">Contact Phone</span>
              <span className="text-stone-800">{sellerProfile.phone || user?.phone || 'Not provided'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400 uppercase tracking-wider text-[10px]">Application Status</span>
              <span className="text-amber-800 font-semibold uppercase tracking-wider text-[10px]">Pending Verification</span>
            </div>
          </div>

          <div className="p-4 bg-stone-50 border border-stone-200 text-stone-600 text-xs leading-relaxed mb-8">
            <p className="font-medium text-stone-900 mb-1">What happens next?</p>
            Once an administrator reviews your hostel location and verifies your student status, your Seller Studio will be automatically unlocked. You will be able to list items, accept hostel pickups, and fulfill student orders.
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex-1 bg-stone-900 text-white text-xs uppercase tracking-[0.15em] font-medium py-3.5 px-6 hover:bg-black transition-colors text-center"
            >
              Check Status
            </button>
            <Link
              to="/products"
              className="flex-1 border border-stone-200 bg-white text-stone-700 text-xs uppercase tracking-[0.15em] font-medium py-3.5 px-6 hover:border-stone-900 hover:text-stone-900 transition-colors text-center"
            >
              Browse Campus Catalog
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 2. SUSPENDED SELLER VIEW
  if (sellerStatus === 'suspended') {
    return (
      <main className="flex-1 bg-[#FAF9F6] border-t border-stone-200 py-20 px-6 flex items-center justify-center min-h-[calc(100vh-88px)]">
        <div className="max-w-xl w-full bg-white border border-stone-200 p-8 sm:p-12 shadow-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-900 text-white text-[10px] uppercase tracking-[0.2em] font-semibold mb-6">
            Privileges Paused
          </div>

          <h1 className="text-3xl sm:text-4xl font-serif text-stone-900 tracking-tight mb-4">
            Seller Account Suspended
          </h1>

          <p className="text-stone-600 font-sans text-sm leading-relaxed mb-6">
            Your seller studio permissions for <strong className="text-stone-900">{sellerProfile.storeName || 'your store'}</strong> have been temporarily suspended by campus administration.
          </p>

          {sellerProfile.statusReason && (
            <div className="bg-stone-50 border border-stone-200 p-4 mb-6 text-xs text-stone-700">
              <span className="block text-[10px] uppercase tracking-wider text-stone-400 font-semibold mb-1">
                Notice from Administrator
              </span>
              <p>{sellerProfile.statusReason}</p>
            </div>
          )}

          <p className="text-xs text-stone-500 leading-relaxed mb-8">
            Please reach out to the campus administration team or email <span className="font-mono text-stone-800">admin@cartly.com</span> with your student ID to resolve this suspension.
          </p>

          <Link
            to="/products"
            className="inline-block w-full bg-stone-900 text-white text-xs uppercase tracking-[0.15em] font-medium py-3.5 text-center hover:bg-black transition-colors"
          >
            Return to Campus Store
          </Link>
        </div>
      </main>
    );
  }

  // 3. REJECTED / CANCELLED SELLER VIEW
  if (sellerStatus === 'rejected') {
    return (
      <main className="flex-1 bg-[#FAF9F6] border-t border-stone-200 py-20 px-6 flex items-center justify-center min-h-[calc(100vh-88px)]">
        <div className="max-w-xl w-full bg-white border border-stone-200 p-8 sm:p-12 shadow-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-200 text-red-900 text-[10px] uppercase tracking-[0.2em] font-semibold mb-6">
            Application Cancelled
          </div>

          <h1 className="text-3xl sm:text-4xl font-serif text-stone-900 tracking-tight mb-4">
            Application Not Approved
          </h1>

          <p className="text-stone-600 font-sans text-sm leading-relaxed mb-6">
            Your application to become a campus seller was not approved by administration.
          </p>

          {sellerProfile.statusReason && (
            <div className="bg-red-50/50 border border-red-100 p-4 mb-6 text-xs text-red-800">
              <span className="block text-[10px] uppercase tracking-wider text-red-400 font-semibold mb-1">
                Reason Provided
              </span>
              <p>{sellerProfile.statusReason}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => {
                // Allow re-applying by updating onboard form
                setOnboardForm({
                  storeName: sellerProfile.storeName || '',
                  campusLocation: sellerProfile.campusLocation || '',
                  phone: sellerProfile.phone || user?.phone || '',
                  bio: sellerProfile.bio || '',
                });
                // Switch local user status in memory to allow viewing form
                user.sellerStatus = 'none';
                setIsLoading(false);
                window.location.reload();
              }}
              className="flex-1 bg-stone-900 text-white text-xs uppercase tracking-[0.15em] font-medium py-3.5 px-6 hover:bg-black transition-colors text-center"
            >
              Re-apply with Updated Info
            </button>
            <Link
              to="/products"
              className="flex-1 border border-stone-200 bg-white text-stone-700 text-xs uppercase tracking-[0.15em] font-medium py-3.5 px-6 hover:border-stone-900 hover:text-stone-900 transition-colors text-center"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 4. ONBOARDING VIEW (If user has not applied yet: sellerStatus == 'none' and not isSeller)
  if (!user?.isSeller || sellerStatus !== 'approved') {
    return (
      <main className="flex-1 bg-[#FAF9F6] border-t border-stone-200 py-16 lg:py-24 px-6 md:px-12 min-h-[calc(100vh-88px)]">
        <div className="max-w-[760px] mx-auto">
          
          <div className="text-center mb-12">
            <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-stone-400 block mb-2">
              Campus Marketplace
            </span>
            <h1 className="text-4xl md:text-5xl font-serif text-stone-900 tracking-tight mb-4">
              Apply to Sell on Cartly.
            </h1>
            <p className="text-stone-500 font-sans text-sm max-w-lg mx-auto leading-relaxed">
              Start selling study aids, electronics, hostel gear, or handmade essentials directly to fellow students across campus. Applications are verified by administration for student safety.
            </p>
          </div>

          {/* Perks Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 text-center">
            <div className="p-5 bg-white border border-stone-200">
              <span className="block font-serif text-stone-900 text-lg mb-1">0% Commission</span>
              <span className="text-[11px] text-stone-500 font-sans">Keep 100% of your earnings on every campus order</span>
            </div>
            <div className="p-5 bg-white border border-stone-200">
              <span className="block font-serif text-stone-900 text-lg mb-1">Hostel Delivery</span>
              <span className="text-[11px] text-stone-500 font-sans">Direct handoff at your dorm block or campus pickup</span>
            </div>
            <div className="p-5 bg-white border border-stone-200">
              <span className="block font-serif text-stone-900 text-lg mb-1">Admin Verified</span>
              <span className="text-[11px] text-stone-500 font-sans">Verified student sellers build trust with campus buyers</span>
            </div>
          </div>

          {/* Onboarding Form */}
          <div className="bg-white border border-stone-200 p-8 sm:p-12 shadow-sm">
            {actionError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 text-xs">
                {actionError}
              </div>
            )}
            {actionSuccess && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                {actionSuccess}
              </div>
            )}

            <form onSubmit={handleOnboardSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                  Store or Stall Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={onboardForm.storeName}
                  onChange={(e) => setOnboardForm(prev => ({ ...prev, storeName: e.target.value }))}
                  placeholder="e.g. Aarav's Dorm Essentials / Tech Hub"
                  className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-3 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                  Campus Pickup / Hostel Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={onboardForm.campusLocation}
                  onChange={(e) => setOnboardForm(prev => ({ ...prev, campusLocation: e.target.value }))}
                  placeholder="e.g. Tagore Hostel, Room 304 (North Campus)"
                  className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-3 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                  Seller Contact Mobile
                </label>
                <input
                  type="tel"
                  value={onboardForm.phone}
                  onChange={(e) => setOnboardForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="10-digit mobile number for order delivery coordination"
                  className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-3 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                  Store Bio / What You Sell
                </label>
                <textarea
                  rows={3}
                  value={onboardForm.bio}
                  onChange={(e) => setOnboardForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell campus buyers what essentials, gadgets, or gear you provide."
                  className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-3 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="p-4 bg-stone-50 border border-stone-200 text-stone-500 text-xs">
                <span className="font-medium text-stone-800">Verification Process:</span> By submitting this application, your details will be sent to campus administration for approval. Once approved, Seller Studio access will be automatically unlocked.
              </div>

              <button
                type="submit"
                disabled={isOnboarding}
                className="w-full bg-stone-900 text-white text-xs uppercase tracking-[0.15em] font-medium py-4 hover:bg-black transition-all flex items-center justify-center gap-2"
              >
                {isOnboarding ? 'Submitting Application...' : 'Submit Seller Application'}
              </button>
            </form>
          </div>

        </div>
      </main>
    );
  }

  // 5. ACTIVE APPROVED SELLER STUDIO DASHBOARD
  return (
    <main className="flex-1 bg-[#FAF9F6] border-t border-stone-200 py-12 lg:py-16 px-6 md:px-12 min-h-[calc(100vh-88px)]">
      <div className="max-w-[1200px] mx-auto">
        
        {/* Studio Header */}
        <div className="mb-10 pb-6 border-b border-stone-200 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] font-medium text-stone-400 block mb-2">
              Cartly Seller Hub
            </span>
            <h1 className="text-3xl md:text-5xl font-serif text-stone-900 tracking-tight">
              {sellerProfile.storeName || "Your Campus Store"}
            </h1>
            <p className="text-stone-500 text-xs mt-1">
              {sellerProfile.campusLocation || "Main Campus"}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsAddingProduct(true)}
              className="bg-stone-900 text-white text-xs uppercase tracking-[0.15em] font-medium py-3.5 px-6 hover:bg-black transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add New Item</span>
            </button>
            <Link
              to="/shop"
              className="text-xs uppercase tracking-[0.15em] font-medium text-stone-600 hover:text-stone-900 border border-stone-200 bg-white py-3.5 px-5 transition-colors"
            >
              View Shop
            </Link>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {actionSuccess && (
          <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <div className="bg-white border border-stone-200 p-6 shadow-sm">
            <span className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold block mb-2">
              Active Listings
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-serif text-stone-900">{stats.totalProducts || products.length}</span>
              <span className="text-[11px] text-stone-500">Live in catalog</span>
            </div>
          </div>

          <div className="bg-white border border-stone-200 p-6 shadow-sm">
            <span className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold block mb-2">
              Campus Orders Received
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-serif text-stone-900">{stats.totalOrders || orders.length}</span>
              <span className="text-[11px] text-stone-500">To fulfill</span>
            </div>
          </div>

          <div className="bg-white border border-stone-200 p-6 shadow-sm">
            <span className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold block mb-2">
              Total Student Sales
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-serif text-stone-900">{stats.totalRevenue || "₹0.00"}</span>
              <span className="text-[11px] text-stone-500 font-sans">Cash on Delivery</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 mb-8 space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`pb-4 text-xs uppercase tracking-widest font-medium transition-colors whitespace-nowrap relative ${
              activeTab === 'inventory' ? 'text-stone-900 font-semibold' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            My Catalog & Inventory ({products.length})
            {activeTab === 'inventory' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-stone-900" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-4 text-xs uppercase tracking-widest font-medium transition-colors whitespace-nowrap relative ${
              activeTab === 'orders' ? 'text-stone-900 font-semibold' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            Orders to Fulfill ({orders.length})
            {activeTab === 'orders' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-stone-900" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('questions')}
            className={`pb-4 text-xs uppercase tracking-widest font-medium transition-colors whitespace-nowrap relative ${
              activeTab === 'questions' ? 'text-stone-900 font-semibold' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            Buyer Q&amp;A ({questions.filter((q) => !q.answer).length})
            {activeTab === 'questions' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-stone-900" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-4 text-xs uppercase tracking-widest font-medium transition-colors whitespace-nowrap relative ${
              activeTab === 'settings' ? 'text-stone-900 font-semibold' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            Store Profile & Company Name
            {activeTab === 'settings' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-stone-900" />
            )}
          </button>
        </div>

        {/* TAB 1: INVENTORY & LISTINGS */}
        {activeTab === 'inventory' && (
          <div className="space-y-8">
            
            {/* Modal to Edit Existing Product */}
            {editingProduct && (
              <div className="bg-white border border-stone-200 p-8 shadow-md transition-all mb-8">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-200">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-stone-400 block mb-1">
                      Listing #{editingProduct.id}
                    </span>
                    <h3 className="font-serif text-2xl text-stone-900 tracking-tight">
                      Edit Listing & Available Stock
                    </h3>
                  </div>
                  <button
                    onClick={() => { setEditingProduct(null); setActionError(''); }}
                    className="text-stone-400 hover:text-stone-900 text-sm"
                  >
                    ✕ Close
                  </button>
                </div>

                {actionError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-800 text-xs border border-red-200">
                    {actionError}
                  </div>
                )}

                <form onSubmit={handleUpdateProductSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                        Product / Item Name *
                      </label>
                      <input
                        type="text"
                        value={editingProduct.name || ''}
                        onChange={(e) => setEditingProduct(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-2.5 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                        Category *
                      </label>
                      <select
                        value={editingProduct.category || ''}
                        onChange={(e) => setEditingProduct(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-2.5 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                        Price in Rupees (₹) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={editingProduct.rawPrice !== undefined ? editingProduct.rawPrice : (parseFloat(String(editingProduct.price).replace(/[^0-9.-]+/g, '')) || '')}
                        onChange={(e) => setEditingProduct(prev => ({ ...prev, rawPrice: e.target.value, price: `₹${e.target.value}` }))}
                        className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-2.5 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                        Units in Stock *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editingProduct.stock !== undefined ? editingProduct.stock : 25}
                        onChange={(e) => setEditingProduct(prev => ({ ...prev, stock: e.target.value }))}
                        className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-2.5 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none"
                        required
                      />
                      <span className="text-[10px] text-stone-400 mt-1 block">
                        {Number(editingProduct.stock) > 0 ? (
                          <span className="text-emerald-700 font-medium">In Stock ({editingProduct.stock} available)</span>
                        ) : (
                          <span className="text-red-600 font-medium">Sold Out / Out of Stock</span>
                        )}
                      </span>
                    </div>

                    <div className="sm:col-span-2">
                      <ProductImagesInput
                        img={editingProduct.img || ''}
                        images={editingProduct.images || []}
                        onChange={({ img, images }) => setEditingProduct(prev => ({ ...prev, img, images }))}
                        presets={imagePresets}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                      Description / Item Condition
                    </label>
                    <textarea
                      rows={2}
                      value={editingProduct.description || ''}
                      onChange={(e) => setEditingProduct(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-2.5 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setEditingProduct(null)}
                      className="px-6 py-2.5 text-xs uppercase tracking-widest text-stone-500 hover:text-stone-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdatingProduct}
                      className="bg-stone-900 text-white text-xs uppercase tracking-[0.15em] font-medium py-2.5 px-8 hover:bg-black transition-colors"
                    >
                      {isUpdatingProduct ? 'Saving Changes...' : 'Save Listing'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Modal / Slide-down to Add New Product */}
            {isAddingProduct && (
              <div className="bg-white border border-stone-200 p-8 shadow-md transition-all mb-8">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-200">
                  <h3 className="font-serif text-2xl text-stone-900 tracking-tight">
                    Add New Campus Essential
                  </h3>
                  <button
                    onClick={() => setIsAddingProduct(false)}
                    className="text-stone-400 hover:text-stone-900 text-sm"
                  >
                    ✕ Close
                  </button>
                </div>

                {actionError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-800 text-xs border border-red-200">
                    {actionError}
                  </div>
                )}

                <form onSubmit={handleAddProductSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                        Product / Item Name *
                      </label>
                      <input
                        type="text"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Casio Scientific Calculator / Laundry Rack"
                        className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-2.5 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                        Category *
                      </label>
                      <select
                        value={newProduct.category}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-2.5 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                        Price in Rupees (₹) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="e.g. 299"
                        className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-2.5 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                        Units in Stock *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newProduct.stock !== undefined ? newProduct.stock : 25}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, stock: e.target.value }))}
                        placeholder="e.g. 10"
                        className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-2.5 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none"
                        required
                      />
                      <span className="text-[10px] text-stone-400 mt-0.5 block">
                        Auto-updates as students place orders.
                      </span>
                    </div>

                    <div className="sm:col-span-2">
                      <ProductImagesInput
                        img={newProduct.img}
                        images={newProduct.images || []}
                        onChange={({ img, images }) => setNewProduct(prev => ({ ...prev, img, images }))}
                        presets={imagePresets}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                      Description / Item Condition
                    </label>
                    <textarea
                      rows={2}
                      value={newProduct.description}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="e.g. Brand new, unboxed, ready for immediate hostel pickup."
                      className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-2.5 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsAddingProduct(false)}
                      className="px-6 py-2.5 text-xs uppercase tracking-widest text-stone-500 hover:text-stone-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingProduct}
                      className="bg-stone-900 text-white text-xs uppercase tracking-[0.15em] font-medium py-2.5 px-8 hover:bg-black transition-colors"
                    >
                      {isSavingProduct ? 'Publishing...' : 'Publish to Catalog'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Product List */}
            {products.length === 0 ? (
              <div className="bg-white border border-stone-200 p-12 text-center">
                <span className="text-stone-400 font-serif italic text-lg block mb-4">
                  No items listed yet in your store.
                </span>
                <button
                  onClick={() => setIsAddingProduct(true)}
                  className="bg-stone-900 text-white text-xs uppercase tracking-[0.15em] font-medium py-3 px-8 hover:bg-black transition-colors"
                >
                  List Your First Item
                </button>
              </div>
            ) : (
              <div className="bg-white border border-stone-200 divide-y divide-stone-200 shadow-sm">
                <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-4 text-[10px] uppercase tracking-widest font-semibold text-stone-400 border-b border-stone-200">
                  <div className="col-span-5">Item</div>
                  <div className="col-span-2">Category</div>
                  <div className="col-span-2">Price</div>
                  <div className="col-span-2">Stock</div>
                  <div className="col-span-1 text-right">Actions</div>
                </div>

                {products.map((item) => (
                  <div key={item.id} className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-6 items-center group">
                    <div className="sm:col-span-5 flex items-center gap-4">
                      <div className="w-14 h-16 bg-[#FAF9F6] border border-stone-200 overflow-hidden shrink-0">
                        <img src={item.img} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
                      </div>
                      <div>
                        <Link to={`/product/${item.id}`} className="font-serif text-stone-900 text-base hover:underline block">
                          {item.name}
                        </Link>
                        <p className="text-stone-400 text-xs line-clamp-1">{item.description}</p>
                      </div>
                    </div>

                    <div className="sm:col-span-2 text-xs font-sans text-stone-600">
                      {item.category}
                    </div>

                    <div className="sm:col-span-2 text-base font-serif text-stone-900 font-medium">
                      {item.price}
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <span className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold ${
                        (item.stock !== undefined ? item.stock : 25) > 0
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}>
                        {(item.stock !== undefined ? item.stock : 25) > 0 ? `${item.stock !== undefined ? item.stock : 25} in stock` : 'Out of stock'}
                      </span>
                      {item.restockAlertCount > 0 && (
                        <span className="block text-[10px] text-amber-800 font-medium">
                          {item.restockAlertCount} {item.restockAlertCount === 1 ? 'student' : 'students'} waiting for restock
                        </span>
                      )}
                    </div>

                    <div className="sm:col-span-1 flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingProduct({ ...item })}
                        className="text-[10px] uppercase tracking-widest text-stone-700 hover:text-stone-900 underline font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(item.id)}
                        className="text-[10px] uppercase tracking-widest text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* TAB 2: ORDERS TO FULFILL */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="bg-white border border-stone-200 p-12 text-center">
                <span className="text-stone-400 font-serif italic text-lg block mb-2">
                  No customer orders received yet.
                </span>
                <p className="text-stone-500 text-xs">
                  When students order your listed items, their delivery requests will appear here.
                </p>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-white border border-stone-200 p-6 md:p-8 shadow-sm">
                  
                  {/* Order Top Bar */}
                  <div className="flex flex-wrap items-center justify-between pb-6 mb-6 border-b border-stone-200 gap-4">
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-stone-400 font-semibold block mb-1">
                        Order #{order.id} • {order.date}
                      </span>
                      <p className="font-serif text-lg text-stone-900 font-medium">
                        Total Value: {order.total} (Cash on Delivery)
                      </p>
                    </div>

                    {/* Status updater dropdown */}
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] uppercase tracking-widest text-stone-500 font-medium">
                        Fulfillment Status:
                      </span>
                      <select
                        value={order.status || 'Confirmed'}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="bg-[#FAF9F6] border border-stone-200 text-xs font-medium text-stone-900 px-3 py-1.5 focus:outline-none focus:border-stone-900"
                      >
                        <option value="Confirmed">Confirmed</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </div>
                  </div>

                  {/* Customer Hostel Destination */}
                  <div className="mb-6 p-4 bg-[#FAF9F6] border border-stone-200 text-xs">
                    <span className="text-[9px] uppercase tracking-widest text-stone-400 font-semibold block mb-1.5">
                      Hostel Delivery Details
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-stone-700">
                      <div><strong className="text-stone-900">Student:</strong> {order.shippingAddress?.fullName || order.userName}</div>
                      <div><strong className="text-stone-900">Hostel & Room:</strong> {order.shippingAddress?.hostelBlock}, Room {order.shippingAddress?.roomNumber}</div>
                      <div><strong className="text-stone-900">Phone:</strong> {order.shippingAddress?.phone}</div>
                    </div>
                  </div>

                  {/* Buyer Return / Replacement Request */}
                  {order.returnRequest && (
                    <div className="mb-6 p-4 bg-amber-50/60 border border-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest font-semibold text-amber-900 block mb-1">
                          {order.returnRequest.type} Request · {order.returnRequest.status}
                        </span>
                        <p className="text-stone-700">{order.returnRequest.reason}</p>
                      </div>
                      {order.returnRequest.status === 'Requested' && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleReturnAction(order.id, 'Approved')}
                            className="px-3 py-1.5 bg-stone-900 text-white text-[10px] uppercase tracking-wider hover:bg-black"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReturnAction(order.id, 'Declined')}
                            className="px-3 py-1.5 border border-stone-300 bg-white text-stone-700 text-[10px] uppercase tracking-wider hover:text-red-700"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                      {order.returnRequest.status === 'Approved' && (
                        <button
                          type="button"
                          onClick={() => handleReturnAction(order.id, 'Completed')}
                          className="px-3 py-1.5 bg-emerald-800 text-white text-[10px] uppercase tracking-wider hover:bg-emerald-900 shrink-0"
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  )}

                  {/* Items List */}
                  <div className="divide-y divide-stone-100">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="py-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-4">
                          {item.img && (
                            <div className="w-10 h-12 bg-stone-100 border border-stone-200 overflow-hidden shrink-0">
                              <img src={item.img} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
                            </div>
                          )}
                          <div>
                            <p className="font-serif text-stone-900 text-sm">{item.name}</p>
                            <p className="text-stone-400 text-[11px]">Qty: {item.quantity} × {item.price}</p>
                          </div>
                        </div>
                        <span className="font-sans font-medium text-stone-900">{item.price}</span>
                      </div>
                    ))}
                  </div>

                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2B: BUYER Q&A */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            {questions.length === 0 ? (
              <div className="bg-white border border-stone-200 p-12 text-center">
                <span className="text-stone-400 font-serif italic text-lg block mb-2">
                  No buyer questions yet.
                </span>
                <p className="text-stone-500 text-xs">
                  Questions asked by students on your product pages will appear here.
                </p>
              </div>
            ) : (
              questions.map((q) => (
                <div key={q.id} className="bg-white border border-stone-200 p-6 shadow-sm space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] uppercase tracking-widest text-stone-400">
                    <span>{q.productName || `Item #${q.productId}`} · Asked by {q.userName}</span>
                    <span>{q.date}</span>
                  </div>
                  <p className="font-serif text-lg text-stone-900">{q.question}</p>

                  {q.answer ? (
                    <div className="p-4 bg-[#FAF9F6] border-l-2 border-stone-900 text-xs text-stone-700">
                      <span className="text-[9px] uppercase tracking-widest text-stone-400 font-semibold block mb-1">
                        Your Published Reply
                      </span>
                      <p className="text-sm text-stone-800">{q.answer}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <input
                        type="text"
                        value={replyDrafts[q.id] || ''}
                        onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [q.id]: e.target.value }))}
                        placeholder="Write your reply to the student..."
                        className="flex-1 bg-[#FAF9F6] border border-stone-200 px-3.5 py-2 text-xs text-stone-900 focus:border-stone-900 focus:bg-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleReplyQuestion(q.id)}
                        className="px-5 py-2 bg-stone-900 text-white text-[10px] uppercase tracking-widest font-medium hover:bg-black transition-colors shrink-0"
                      >
                        Publish Reply
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: STORE PROFILE & REGISTERED COMPANY NAME */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            <div className="bg-white border border-stone-200 p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-stone-200 gap-4">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.25em] font-medium text-stone-400 block mb-1">
                    Seller Identity & Branding
                  </span>
                  <h2 className="font-serif text-2xl md:text-3xl text-stone-900 tracking-tight">
                    Registered Company & Store Name
                  </h2>
                  <p className="text-stone-500 text-xs mt-1 max-w-xl leading-relaxed">
                    Update the official name of which your campus business or stall is registered. Any changes automatically update across your store badge, product detail pages, and buyer recommendations.
                  </p>
                </div>
                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] uppercase tracking-wider font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    Verified Seller Account
                  </span>
                </div>
              </div>

              {/* Feedback Banners */}
              {storeProfileSuccess && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
                  <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{storeProfileSuccess}</span>
                </div>
              )}

              {storeProfileError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-3">
                  <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{storeProfileError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Form column */}
                <div className="lg:col-span-7">
                  <form onSubmit={handleUpdateStoreProfile} className="space-y-6">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-2">
                        Registered Company / Store Name *
                      </label>
                      <input
                        type="text"
                        value={storeProfileForm.storeName}
                        onChange={(e) => {
                          setStoreProfileForm(prev => ({ ...prev, storeName: e.target.value }));
                          if (storeProfileError) setStoreProfileError('');
                        }}
                        placeholder="e.g., Vansh's Campus Depot, North Hub Books"
                        className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-3 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none transition-colors"
                        required
                      />
                      <p className="text-[11px] text-stone-400 mt-1.5 leading-relaxed">
                        This is the official business name displayed to students on your items, cards, and invoices.
                      </p>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-2">
                        Campus Hub / Stall Location *
                      </label>
                      <input
                        type="text"
                        value={storeProfileForm.campusLocation}
                        onChange={(e) => {
                          setStoreProfileForm(prev => ({ ...prev, campusLocation: e.target.value }));
                          if (storeProfileError) setStoreProfileError('');
                        }}
                        placeholder="e.g., North Campus, Hall 4 Room 204, Central Canteen"
                        className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-3 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none transition-colors"
                        required
                      />
                      <p className="text-[11px] text-stone-400 mt-1.5 leading-relaxed">
                        Where student orders are fulfilled or dispatched from on campus.
                      </p>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-2">
                        Contact Phone / WhatsApp
                      </label>
                      <input
                        type="tel"
                        value={storeProfileForm.phone}
                        onChange={(e) => setStoreProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+91 98765 43210"
                        className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-3 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none transition-colors"
                      />
                      <p className="text-[11px] text-stone-400 mt-1.5 leading-relaxed">
                        Used by campus admins and buyers for urgent delivery or pickup coordination.
                      </p>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-2">
                        Store Bio / Description
                      </label>
                      <textarea
                        rows={3}
                        value={storeProfileForm.bio}
                        onChange={(e) => setStoreProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Student-run campus outlet providing verified electronics, books, and hostel necessities."
                        className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-3 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none transition-colors resize-none"
                      />
                      <p className="text-[11px] text-stone-400 mt-1.5 leading-relaxed">
                        Brief summary of what your business specializes in.
                      </p>
                    </div>

                    <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <p className="text-[11px] text-stone-400">
                        Updates apply instantly to all your active listings.
                      </p>
                      <button
                        type="submit"
                        disabled={isUpdatingStoreProfile}
                        className="w-full sm:w-auto bg-stone-900 text-white text-xs uppercase tracking-[0.15em] font-medium py-3.5 px-8 hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
                      >
                        {isUpdatingStoreProfile ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            <span>Saving Changes...</span>
                          </>
                        ) : (
                          <span>Update Company Name</span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Live Preview column */}
                <div className="lg:col-span-5">
                  <div className="bg-[#FAF9F6] border border-stone-200 p-6 shadow-sm sticky top-28">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200">
                      <span className="text-[9px] uppercase tracking-[0.2em] font-semibold text-stone-400 block">
                        Buyer Preview
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        /product/:id
                      </span>
                    </div>

                    <p className="text-stone-500 text-xs mb-4 leading-relaxed">
                      This is the exact campus seller card buyers see when browsing your listings:
                    </p>

                    {/* Exact Campus Seller Card from Product.jsx */}
                    <div className="p-5 bg-white border border-stone-200 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] uppercase tracking-widest text-stone-400 font-semibold block">
                          Campus Seller
                        </span>
                        <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200">
                          25 in stock
                        </span>
                      </div>
                      <div>
                        <p className="font-serif text-stone-900 text-base font-medium">
                          {storeProfileForm.storeName.trim() || "Your Company Name"}
                        </p>
                        <p className="text-stone-500 text-xs mt-1">
                          {storeProfileForm.campusLocation.trim() || "North Campus"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-stone-200 text-[11px] text-stone-500 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-stone-900 font-medium">✓</span>
                        <span>Catalog listings automatically synchronize</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-stone-900 font-medium">✓</span>
                        <span>Official company name registered under your student ID</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-stone-900 font-medium">✓</span>
                        <span>Visible in cart checkout and order receipts</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </main>
  );
}
