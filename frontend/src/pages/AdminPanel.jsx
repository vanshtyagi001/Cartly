import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ImageUploadInput from '../components/ImageUploadInput';

export default function AdminPanel() {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('cartly_admin_token') || '');
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const stored = localStorage.getItem('cartly_admin_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [adminCredentials, setAdminCredentials] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'orders' | 'catalog' | 'users'
  const [metrics, setMetrics] = useState({
    gmv: '₹0.00',
    totalOrders: 0,
    totalProducts: 20,
    totalUsers: 0,
    totalSellers: 0,
  });
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & State
  const [orderSearch, setOrderSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'suspended' | 'buyers'
  const [notification, setNotification] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [addProductError, setAddProductError] = useState('');
  const [selectedAdminOrder, setSelectedAdminOrder] = useState(null);
  const [sellerActionReason, setSellerActionReason] = useState('');
  const [activeSellerActionUser, setActiveSellerActionUser] = useState(null);
  const [pendingActionType, setPendingActionType] = useState('');
  const [isProcessingSellerAction, setIsProcessingSellerAction] = useState(false);
  const [catalogViewMode, setCatalogViewMode] = useState('tiles'); // 'tiles' | 'table'
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogPageSize, setCatalogPageSize] = useState(8);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Hostel Essentials',
    price: '',
    img: '',
    description: '',
  });
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  const adminImagePresets = [
    { label: 'Notebook', url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800&auto=format&fit=crop' },
    { label: 'Desk Lamp', url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?q=80&w=800&auto=format&fit=crop' },
    { label: 'Calculator', url: 'https://images.unsplash.com/photo-1574607407408-1e681c46041d?q=80&w=800&auto=format&fit=crop' },
    { label: 'Pens Set', url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?q=80&w=800&auto=format&fit=crop' },
    { label: 'Backpack', url: 'https://images.unsplash.com/photo-1760715651666-c3e408bfdda7?auto=format&fit=crop&w=800&q=80' },
    { label: 'Headphones', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop' },
  ];

  // Validate active token on mount
  useEffect(() => {
    if (!adminToken) return;
    fetch(`${API_URL}/api/admin/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
      .then((res) => {
        if (!res.ok) {
          handleAdminLogout();
        } else {
          return res.json();
        }
      })
      .then((data) => {
        if (data?.user) setAdminUser(data.user);
      })
      .catch(() => {});
  }, [adminToken]);

  const fetchAdminData = async () => {
    if (!adminToken) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${adminToken}` };

      // 1. Metrics
      const mRes = await fetch(`${API_URL}/api/admin/metrics`, { headers });
      if (mRes.ok) {
        const mData = await mRes.json();
        setMetrics(mData.metrics || {});
      }

      // 2. Orders
      const oRes = await fetch(`${API_URL}/api/admin/orders`, { headers });
      if (oRes.ok) {
        const oData = await oRes.json();
        setOrders(oData || []);
      }

      // 3. Products
      const pRes = await fetch(`${API_URL}/api/admin/products`, { headers });
      if (pRes.ok) {
        const pData = await pRes.json();
        setProducts(pData || []);
      }

      // 4. Users
      const uRes = await fetch(`${API_URL}/api/admin/users`, { headers });
      if (uRes.ok) {
        const uData = await uRes.json();
        setUsers(uData || []);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [adminToken]);

  const showNotice = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminCredentials),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Invalid administrative credentials.');
        return;
      }
      localStorage.setItem('cartly_admin_token', data.token);
      localStorage.setItem('cartly_admin_user', JSON.stringify(data.user));
      setAdminToken(data.token);
      setAdminUser(data.user);
      setAdminCredentials({ email: '', password: '' });
    } catch (err) {
      setLoginError('Unable to connect to administrative authentication service.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('cartly_admin_token');
    localStorage.removeItem('cartly_admin_user');
    setAdminToken('');
    setAdminUser(null);
    setAdminCredentials({ email: '', password: '' });
  };

  // Update order status
  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        showNotice(`Order #${orderId} status set to ${newStatus}.`);
        setSelectedAdminOrder(prev => (prev && prev.id === orderId ? { ...prev, status: newStatus } : prev));
        fetchAdminData();
      }
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  // Delete product
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm(`Delete product #${productId} from the platform catalog?`)) return;

    try {
      const res = await fetch(`${API_URL}/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (res.ok) {
        showNotice(`Product #${productId} deleted.`);
        fetchAdminData();
      }
    } catch (err) {
      console.error('Delete product failed:', err);
    }
  };

  // Update seller approval status (Approve, Suspend, Cancel/Reject)
  const handleSellerStatusChange = async (userId, newStatus, reason = '') => {
    setIsProcessingSellerAction(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/sellers/${userId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: newStatus, reason }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update seller status.');
      }

      showNotice(data.message || `Seller status updated to ${newStatus}.`);
      setActiveSellerActionUser(null);
      setPendingActionType('');
      setSellerActionReason('');
      fetchAdminData();
    } catch (err) {
      showNotice(err.message || 'Error executing seller status change.');
    } finally {
      setIsProcessingSellerAction(false);
    }
  };

  // Toggle user admin role
  const handleToggleAdmin = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/toggle-admin`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        showNotice('User administrative permission updated.');
        fetchAdminData();
      }
    } catch (err) {
      console.error('Toggle admin failed:', err);
    }
  };

  // Create new catalog product
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setAddProductError('');

    if (!newProduct.name.trim()) {
      setAddProductError('Product name is required.');
      return;
    }

    const parsedPrice = parseFloat(newProduct.price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setAddProductError('Please enter a valid price in rupees (greater than 0).');
      return;
    }

    setIsSubmittingProduct(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: newProduct.name.trim(),
          category: newProduct.category,
          price: parsedPrice,
          img: newProduct.img.trim(),
          description: newProduct.description.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add product to catalog.');

      showNotice(`'${newProduct.name}' successfully added to platform catalog.`);
      setIsAddingProduct(false);
      setNewProduct({ name: '', category: 'Hostel Essentials', price: '', img: '', description: '' });
      setActiveTab('catalog');
      fetchAdminData();
    } catch (err) {
      setAddProductError(err.message || 'Error publishing product.');
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // Dedicated Admin Login screen if not authenticated
  if (!adminToken || !adminUser?.isAdmin) {
    return (
      <main className="flex-1 bg-[#FAF9F6] border-t border-stone-200 py-24 px-6 flex items-center justify-center min-h-[calc(100vh-88px)]">
        <div className="max-w-md w-full bg-white border border-stone-200 p-8 sm:p-12 shadow-sm">
          <div className="text-center mb-8">
            <span className="text-[10px] uppercase tracking-[0.25em] font-medium text-stone-400 block mb-2">
              Cartly Operations
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif text-stone-900 tracking-tight">
              Admin Console
            </h1>
            <p className="text-stone-500 text-xs mt-2 leading-relaxed">
              Platform administration, catalog control, and campus fulfillment logs.
            </p>
          </div>

          {loginError && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                Admin Email Address
              </label>
              <input
                type="email"
                required
                value={adminCredentials.email}
                onChange={(e) => setAdminCredentials(prev => ({ ...prev, email: e.target.value }))}
                placeholder="admin@cartly.com"
                className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-3 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                Admin Password
              </label>
              <input
                type="password"
                required
                value={adminCredentials.password}
                onChange={(e) => setAdminCredentials(prev => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••••••"
                className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-3 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-stone-900 text-white text-xs uppercase tracking-[0.15em] font-medium py-3.5 hover:bg-black transition-colors disabled:opacity-50"
            >
              {isLoggingIn ? 'Authenticating...' : 'Sign In to Console'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
            <span>Server-side credentials (.env)</span>
            <Link to="/" className="text-stone-700 hover:text-stone-950 underline">
              Return to Store
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
    (o.shippingAddress?.fullName && o.shippingAddress.fullName.toLowerCase().includes(orderSearch.toLowerCase())) ||
    (o.userName && o.userName.toLowerCase().includes(orderSearch.toLowerCase()))
  );

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  const totalCatalogItems = filteredProducts.length;
  const totalCatalogPages = Math.max(1, Math.ceil(totalCatalogItems / catalogPageSize));
  const validCatalogPage = Math.min(catalogPage, totalCatalogPages);
  const startItemIdx = totalCatalogItems === 0 ? 0 : (validCatalogPage - 1) * catalogPageSize + 1;
  const endItemIdx = Math.min(validCatalogPage * catalogPageSize, totalCatalogItems);
  const paginatedProducts = filteredProducts.slice(
    (validCatalogPage - 1) * catalogPageSize,
    validCatalogPage * catalogPageSize
  );

  return (
    <main className="flex-1 bg-[#FAF9F6] border-t border-stone-200 py-12 lg:py-16 px-6 md:px-12 min-h-[calc(100vh-88px)] relative">
      {/* Modal to Add New Product - Accessible globally from any tab */}
      {isAddingProduct && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-stone-200 p-6 sm:p-8 shadow-2xl max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-200">
              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-stone-400 block mb-1">
                  Catalog Management
                </span>
                <h3 className="font-serif text-2xl text-stone-900 tracking-tight">
                  Add Item to Official Catalog
                </h3>
              </div>
              <button
                type="button"
                onClick={() => { setIsAddingProduct(false); setAddProductError(''); }}
                className="text-stone-400 hover:text-stone-900 text-sm p-1.5 hover:bg-stone-100 transition-colors"
                aria-label="Close modal"
              >
                ✕ Close
              </button>
            </div>

            {addProductError && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 text-xs">
                {addProductError}
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Memory Foam Mattress Topper"
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
                    <option value="Hostel Essentials">Hostel Essentials</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Stationery">Stationery</option>
                    <option value="Trekking Essentials">Trekking Essentials</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="799"
                    className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-2.5 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <ImageUploadInput
                    value={newProduct.img}
                    onChange={(val) => setNewProduct(prev => ({ ...prev, img: val }))}
                    presets={adminImagePresets}
                    label="Product Photo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newProduct.description}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Product details for student catalog."
                  className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-2.5 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => { setIsAddingProduct(false); setAddProductError(''); }}
                  className="px-6 py-2.5 text-xs uppercase tracking-widest text-stone-500 hover:text-stone-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProduct}
                  className="bg-stone-900 text-white text-xs uppercase tracking-[0.15em] font-medium py-2.5 px-8 hover:bg-black transition-colors disabled:opacity-50"
                >
                  {isSubmittingProduct ? 'Saving...' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal to View Order in Full Detail */}
      {selectedAdminOrder && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white border border-stone-200 p-6 sm:p-10 shadow-2xl max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-6 mb-6 border-b border-stone-200">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-stone-400 font-semibold">
                    Platform Master Logistics Record
                  </span>
                  <span className="text-[9px] uppercase tracking-wider bg-stone-900 text-white px-2 py-0.5 font-medium">
                    Order #{selectedAdminOrder.id}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif text-stone-900 tracking-tight">
                  Delivery Oversight & Manifest
                </h2>
                <p className="text-xs text-stone-500 font-sans mt-1">
                  Placed on {selectedAdminOrder.date} • Registered under account {selectedAdminOrder.userEmail || selectedAdminOrder.userName || 'Student'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAdminOrder(null)}
                className="text-stone-400 hover:text-stone-900 text-sm p-2 hover:bg-stone-100 transition-colors"
                aria-label="Close modal"
              >
                ✕ Close
              </button>
            </div>

            {/* Status Management Bar */}
            <div className="mb-8 p-4 bg-[#FAF9F6] border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold">
                  Fulfillment Status:
                </span>
                <span className={`text-xs px-2.5 py-1 font-medium border ${
                  selectedAdminOrder.status === 'Delivered'
                    ? 'bg-stone-900 text-white border-stone-900'
                    : selectedAdminOrder.status === 'Cancelled'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  {selectedAdminOrder.status || 'Confirmed'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-stone-400 font-medium">
                  Update Status:
                </span>
                <select
                  value={selectedAdminOrder.status || 'Confirmed'}
                  onChange={(e) => handleOrderStatusUpdate(selectedAdminOrder.id, e.target.value)}
                  className="bg-white border border-stone-300 text-xs px-3 py-1.5 text-stone-900 focus:outline-none focus:border-stone-900 font-medium cursor-pointer"
                >
                  <option value="Confirmed">Confirmed</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Student & Delivery Destination Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 text-xs">
              <div className="border border-stone-200 p-5 bg-[#FAF9F6]/40">
                <span className="text-[9px] uppercase tracking-widest text-stone-400 font-semibold block mb-3">
                  Student Recipient Details
                </span>
                <p className="font-serif text-stone-900 text-base mb-1">
                  {selectedAdminOrder.shippingAddress?.fullName || selectedAdminOrder.userName || 'Student User'}
                </p>
                <p className="text-stone-600 font-mono text-[11px] mb-1">
                  {selectedAdminOrder.userEmail || 'No account email recorded'}
                </p>
                <p className="text-stone-700 font-mono mt-3 pt-2 border-t border-stone-200/60">
                  Phone: {selectedAdminOrder.shippingAddress?.phone || 'Not provided'}
                </p>
              </div>

              <div className="border border-stone-200 p-5 bg-[#FAF9F6]/40">
                <span className="text-[9px] uppercase tracking-widest text-stone-400 font-semibold block mb-3">
                  Campus Hostel Destination
                </span>
                <p className="font-serif text-stone-900 text-base mb-1">
                  {selectedAdminOrder.shippingAddress?.hostelBlock || 'Hostel Block'}, Room {selectedAdminOrder.shippingAddress?.roomNumber || '—'}
                </p>
                <p className="text-stone-500 mb-2">
                  {selectedAdminOrder.shippingAddress?.campus || 'Campus Grounds'}
                </p>
                <div className="pt-2 border-t border-stone-200/60 space-y-1">
                  <div>
                    <span className="text-stone-400 text-[10px] uppercase">Delivery Window: </span>
                    <span className="text-stone-900 font-medium">
                      {selectedAdminOrder.shippingAddress?.deliverySlot || 'Standard Delivery (within 2 hours)'}
                    </span>
                  </div>
                  {selectedAdminOrder.shippingAddress?.deliveryNotes && (
                    <div>
                      <span className="text-stone-400 text-[10px] uppercase">Resident Note: </span>
                      <span className="text-stone-700 italic">
                        "{selectedAdminOrder.shippingAddress.deliveryNotes}"
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items Table */}
            <div className="mb-8">
              <span className="text-[9px] uppercase tracking-widest text-stone-400 font-semibold block mb-4">
                Ordered Items ({selectedAdminOrder.items?.length || 0})
              </span>

              <div className="border border-stone-200 divide-y divide-stone-100 overflow-hidden">
                {selectedAdminOrder.items?.map((item, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between gap-4 hover:bg-stone-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-16 bg-white border border-stone-200 overflow-hidden shrink-0">
                        {item.img ? (
                          <img src={item.img} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs">Photo</div>
                        )}
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-stone-400 block">
                          {item.category || 'Essential'}
                        </span>
                        <p className="font-serif text-sm text-stone-900 font-medium">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Quantity: {item.quantity} × {item.price}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-sans font-medium text-stone-900">
                        {item.price}
                      </span>
                      {item.id && (
                        <Link
                          to={`/product/${item.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-[10px] text-stone-500 hover:text-stone-900 underline mt-1"
                        >
                          View in Shop ↗
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment & Settlement Summary */}
            <div className="border-t border-stone-200 pt-6 mb-8 flex justify-end">
              <div className="w-full sm:w-72 space-y-2 text-xs">
                <div className="flex justify-between text-stone-500">
                  <span>Items Subtotal</span>
                  <span>{selectedAdminOrder.subtotal ? `₹${Number(selectedAdminOrder.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : selectedAdminOrder.total}</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Campus Courier</span>
                  <span className="text-emerald-700 font-medium">Free</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Handling & Logistics</span>
                  <span>₹0.00</span>
                </div>
                <div className="flex justify-between text-stone-900 font-medium text-sm pt-2 border-t border-stone-200">
                  <span>Gross Order Value</span>
                  <span className="font-serif text-base">{selectedAdminOrder.total}</span>
                </div>
                <div className="text-[10px] text-stone-400 pt-1 text-right">
                  Method: {selectedAdminOrder.paymentMethod || 'Cash on Delivery'}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-stone-200">
              <button
                type="button"
                onClick={() => window.print()}
                className="text-[10px] uppercase tracking-widest text-stone-600 hover:text-stone-900 border border-stone-200 px-4 py-2.5 bg-[#FAF9F6] transition-colors"
              >
                Print Slip / Invoice
              </button>

              <button
                type="button"
                onClick={() => setSelectedAdminOrder(null)}
                className="bg-stone-900 text-white text-[10px] uppercase tracking-widest font-medium px-8 py-2.5 hover:bg-black transition-colors"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      <div className="max-w-[1300px] mx-auto">
        
        {/* Admin Header */}
        <div className="mb-10 pb-6 border-b border-stone-200 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] uppercase tracking-[0.25em] font-medium text-stone-400">
                Cartly Administration
              </span>
              <span className="text-[9px] uppercase tracking-wider bg-stone-900 text-white px-2 py-0.5 font-medium">
                Admin Console
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-serif text-stone-900 tracking-tight">
              Platform Operations.
            </h1>
            <p className="text-[11px] text-stone-500 font-mono mt-1">
              Active Administrator: {adminUser?.email || 'admin@cartly.com'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsAddingProduct(true)}
              className="bg-stone-900 text-white text-xs uppercase tracking-[0.15em] font-medium py-3 px-6 hover:bg-black transition-colors"
            >
              + Add Catalog Item
            </button>
            <Link
              to="/shop"
              className="text-xs uppercase tracking-[0.15em] font-medium text-stone-600 hover:text-stone-900 border border-stone-200 bg-white py-3 px-5 transition-colors"
            >
              Public Catalog
            </Link>
            <button
              onClick={handleAdminLogout}
              className="text-xs uppercase tracking-[0.15em] font-medium text-red-600 hover:text-red-700 border border-red-200 bg-red-50/50 hover:bg-red-50 py-3 px-4 transition-colors"
              title="Sign out of administrative session"
            >
              Exit Console
            </button>
          </div>
        </div>

        {/* Global Alert Notification */}
        {notification && (
          <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
            <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{notification}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 mb-8 space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 text-xs uppercase tracking-widest font-medium transition-colors relative whitespace-nowrap ${
              activeTab === 'overview' ? 'text-stone-900 font-semibold' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            Overview
            {activeTab === 'overview' && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-stone-900" />}
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-4 text-xs uppercase tracking-widest font-medium transition-colors relative whitespace-nowrap ${
              activeTab === 'orders' ? 'text-stone-900 font-semibold' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            Orders Oversight ({orders.length})
            {activeTab === 'orders' && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-stone-900" />}
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`pb-4 text-xs uppercase tracking-widest font-medium transition-colors relative whitespace-nowrap ${
              activeTab === 'catalog' ? 'text-stone-900 font-semibold' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            Catalog & Inventory ({products.length})
            {activeTab === 'catalog' && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-stone-900" />}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`pb-4 text-xs uppercase tracking-widest font-medium transition-colors relative whitespace-nowrap ${
              activeTab === 'users' ? 'text-stone-900 font-semibold' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            Accounts & Sellers ({users.length})
            {users.filter(u => (u.sellerStatus || '').toLowerCase() === 'pending').length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-[9px] bg-amber-500 text-white font-bold rounded-full">
                {users.filter(u => (u.sellerStatus || '').toLowerCase() === 'pending').length}
              </span>
            )}
            {activeTab === 'users' && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-stone-900" />}
          </button>
        </div>

        {/* TAB 1: OVERVIEW METRICS */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white border border-stone-200 p-6 shadow-sm">
                <span className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold block mb-2">
                  Platform Gross Merchandise
                </span>
                <span className="text-3xl font-serif text-stone-900 block mb-1">{metrics.gmv || '₹0.00'}</span>
                <span className="text-[11px] text-stone-500 font-sans">Total transacted volume</span>
              </div>

              <div className="bg-white border border-stone-200 p-6 shadow-sm">
                <span className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold block mb-2">
                  Platform Orders
                </span>
                <span className="text-3xl font-serif text-stone-900 block mb-1">{metrics.totalOrders || 0}</span>
                <span className="text-[11px] text-stone-500 font-sans">Hostel delivery pipeline</span>
              </div>

              <div className="bg-white border border-stone-200 p-6 shadow-sm">
                <span className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold block mb-2">
                  Campus Essentials
                </span>
                <span className="text-3xl font-serif text-stone-900 block mb-1">{metrics.totalProducts || 20}</span>
                <span className="text-[11px] text-stone-500 font-sans">Active catalog items</span>
              </div>

              <div className="bg-white border border-stone-200 p-6 shadow-sm">
                <span className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold block mb-2">
                  Campus Accounts
                </span>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-serif text-stone-900">{metrics.totalUsers || 0}</span>
                  <span className="text-xs text-stone-500">({metrics.totalSellers || 0} sellers)</span>
                </div>
                <span className="text-[11px] text-stone-500 font-sans">Registered student users</span>
              </div>
            </div>

            {/* Platform Quick Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-stone-200 p-8 shadow-sm">
                <h3 className="font-serif text-xl text-stone-900 tracking-tight mb-4">
                  Logistics & Fulfillment Health
                </h3>
                <div className="space-y-3 text-xs text-stone-600">
                  <div className="flex justify-between py-2 border-b border-stone-100">
                    <span>Payment Channel</span>
                    <span className="font-medium text-stone-900">Cash on Delivery (COD) Active</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-stone-100">
                    <span>Campus Shipping Fee</span>
                    <span className="font-medium text-emerald-800">₹0.00 (Free Campus Delivery)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-stone-100">
                    <span>Tax Application Rate</span>
                    <span className="font-medium text-stone-900">8.00%</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span>Database Engine</span>
                    <span className="font-medium text-stone-900">MongoDB Cloud / PyMongo</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-stone-200 p-8 shadow-sm">
                <h3 className="font-serif text-xl text-stone-900 tracking-tight mb-4">
                  Active Categories
                </h3>
                <div className="space-y-2.5 text-xs text-stone-700">
                  <div className="flex justify-between py-1.5 border-b border-stone-100">
                    <span>Hostel Essentials</span>
                    <span className="font-serif font-medium text-stone-900">Daily living, laundry & bedding</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-stone-100">
                    <span>Electronics</span>
                    <span className="font-serif font-medium text-stone-900">Peripherals, power & audio</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-stone-100">
                    <span>Stationery</span>
                    <span className="font-serif font-medium text-stone-900">Notebooks, pens & drafting</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span>Trekking Essentials</span>
                    <span className="font-serif font-medium text-stone-900">Backpacks, bottles & footwear</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS OVERSIGHT */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white border border-stone-200 p-4">
              <input
                type="text"
                placeholder="Search orders by Order ID or Student Name..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full sm:w-96 bg-[#FAF9F6] border border-stone-200 px-4 py-2 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
              />
              <span className="text-xs text-stone-400">
                Showing {filteredOrders.length} of {orders.length} orders
              </span>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="bg-white border border-stone-200 p-16 text-center text-stone-400 font-serif italic text-lg">
                No orders matching the search filter.
              </div>
            ) : (
              <div className="bg-white border border-stone-200 divide-y divide-stone-200 shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 bg-[#FAF9F6] text-[10px] uppercase tracking-widest text-stone-400 font-semibold">
                      <th className="p-4">Order ID</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Student & Hostel</th>
                      <th className="p-4">Phone</th>
                      <th className="p-4">Items</th>
                      <th className="p-4">Total</th>
                      <th className="p-4">Fulfillment Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => setSelectedAdminOrder(order)}
                            className="font-medium text-stone-900 hover:text-amber-900 text-left underline underline-offset-4 decoration-stone-300 hover:decoration-stone-900 transition-colors"
                            title="Open full order details"
                          >
                            {order.id}
                          </button>
                        </td>
                        <td className="p-4 text-stone-500 whitespace-nowrap">{order.date}</td>
                        <td className="p-4">
                          <p className="font-medium text-stone-900">{order.shippingAddress?.fullName || order.userName}</p>
                          <p className="text-stone-400 text-[11px]">
                            {order.shippingAddress?.hostelBlock}, Room {order.shippingAddress?.roomNumber}
                          </p>
                        </td>
                        <td className="p-4 text-stone-600 whitespace-nowrap">{order.shippingAddress?.phone || '—'}</td>
                        <td className="p-4 text-stone-600 max-w-[200px] truncate">
                          {order.items?.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                        </td>
                        <td className="p-4 font-serif text-stone-900 font-medium whitespace-nowrap">{order.total}</td>
                        <td className="p-4">
                          <select
                            value={order.status || 'Confirmed'}
                            onChange={(e) => handleOrderStatusUpdate(order.id, e.target.value)}
                            className="bg-[#FAF9F6] border border-stone-200 text-xs px-2.5 py-1 text-stone-900 focus:outline-none focus:border-stone-900"
                          >
                            <option value="Confirmed">Confirmed</option>
                            <option value="Processing">Processing</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedAdminOrder(order)}
                            className="text-[10px] uppercase tracking-widest font-medium border border-stone-200 hover:border-stone-900 bg-white hover:bg-[#FAF9F6] text-stone-800 px-3 py-1.5 transition-colors"
                            title="View full order manifest"
                          >
                            Details →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CATALOG CONTROL */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            {/* Catalog Toolbar: Search, Page Size, View Switcher & Add Action */}
            <div className="bg-white border border-stone-200 p-4 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 shadow-sm">
              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search products by title or category..."
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setCatalogPage(1);
                  }}
                  className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-2 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 sm:gap-4">
                {/* Items Per Page Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-stone-400 font-medium whitespace-nowrap">
                    Show:
                  </span>
                  <select
                    value={catalogPageSize}
                    onChange={(e) => {
                      setCatalogPageSize(Number(e.target.value));
                      setCatalogPage(1);
                    }}
                    className="bg-[#FAF9F6] border border-stone-200 text-xs px-2.5 py-1.5 text-stone-900 focus:outline-none focus:border-stone-900 font-medium cursor-pointer"
                  >
                    <option value={4}>4 per page</option>
                    <option value={8}>8 per page</option>
                    <option value={12}>12 per page</option>
                    <option value={24}>24 per page</option>
                    <option value={48}>48 per page</option>
                  </select>
                </div>

                {/* View Mode Switcher: Tiles vs Table */}
                <div className="flex border border-stone-200 bg-[#FAF9F6] p-0.5">
                  <button
                    type="button"
                    onClick={() => setCatalogViewMode('tiles')}
                    className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-medium transition-colors flex items-center gap-1.5 ${
                      catalogViewMode === 'tiles'
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                    title="View products in large tiles"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    <span>Tiles</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogViewMode('table')}
                    className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-medium transition-colors flex items-center gap-1.5 ${
                      catalogViewMode === 'table'
                        ? 'bg-stone-900 text-white'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                    title="View products in compact table"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    <span>Table</span>
                  </button>
                </div>

                {/* Add Item Action */}
                <button
                  type="button"
                  onClick={() => setIsAddingProduct(true)}
                  className="bg-stone-900 text-white text-[10px] uppercase tracking-widest font-medium py-2 px-4 hover:bg-black transition-colors shrink-0"
                >
                  + Add Item
                </button>
              </div>
            </div>

            {/* Empty State */}
            {totalCatalogItems === 0 ? (
              <div className="bg-white border border-stone-200 p-16 text-center text-stone-400 font-serif italic text-lg">
                No catalog items matching your search filter.
              </div>
            ) : (
              <>
                {/* 1. Large Tiles View */}
                {catalogViewMode === 'tiles' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {paginatedProducts.map((p) => (
                      <div
                        key={p.id}
                        className="bg-white border border-stone-200 overflow-hidden shadow-sm hover:border-stone-400 transition-all flex flex-col group"
                      >
                        {/* Tile Photo Frame */}
                        <div className="h-64 sm:h-72 bg-[#FAF9F6] border-b border-stone-200 relative overflow-hidden flex items-center justify-center p-6">
                          {p.img ? (
                            <img
                              src={p.img}
                              alt={p.name}
                              className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <span className="text-stone-300 font-serif text-sm">No Photo</span>
                          )}

                          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm border border-stone-200 text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 text-stone-700">
                            {p.category}
                          </span>
                          <span className="absolute top-3 right-3 bg-stone-900 text-white text-[9px] font-mono px-2 py-0.5">
                            #{p.id}
                          </span>
                        </div>

                        {/* Tile Information */}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-serif text-base text-stone-900 font-medium tracking-tight mb-1 line-clamp-1 group-hover:text-amber-900 transition-colors">
                              {p.name}
                            </h4>
                            <p className="text-[11px] text-stone-400 mb-2 truncate">
                              Source: {p.sellerName || 'Cartly Central Hub'}
                            </p>
                            <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed mb-4">
                              {p.description || 'Official campus essential item.'}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                            <span className="font-serif text-lg font-medium text-stone-900">
                              {p.price}
                            </span>
                            <div className="flex items-center gap-3">
                              <Link
                                to={`/product/${p.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] uppercase tracking-widest text-stone-500 hover:text-stone-900 underline"
                                title="Inspect listing in storefront"
                              >
                                View ↗
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(p.id)}
                                className="text-[10px] uppercase tracking-widest text-red-600 hover:text-red-900 font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. Compact Table View */}
                {catalogViewMode === 'table' && (
                  <div className="bg-white border border-stone-200 shadow-sm overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-stone-200 bg-[#FAF9F6] text-[10px] uppercase tracking-widest text-stone-400 font-semibold">
                          <th className="p-4">Item</th>
                          <th className="p-4">Category</th>
                          <th className="p-4">Price</th>
                          <th className="p-4">Seller Source</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {paginatedProducts.map((p) => (
                          <tr key={p.id} className="hover:bg-stone-50/50 transition-colors">
                            <td className="p-4 flex items-center gap-3">
                              <div className="w-10 h-12 bg-stone-100 border border-stone-200 overflow-hidden shrink-0">
                                <img src={p.img} alt={p.name} className="w-full h-full object-cover mix-blend-multiply" />
                              </div>
                              <div>
                                <p className="font-serif text-stone-900 text-sm font-medium">{p.name}</p>
                                <p className="text-stone-400 text-[10px]">ID: #{p.id}</p>
                              </div>
                            </td>
                            <td className="p-4 text-stone-600">{p.category}</td>
                            <td className="p-4 font-serif text-stone-900 font-medium">{p.price}</td>
                            <td className="p-4 text-stone-500">
                              {p.sellerName || 'Cartly Official Hub'}
                            </td>
                            <td className="p-4 text-right space-x-3">
                              <Link
                                to={`/product/${p.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] uppercase tracking-widest text-stone-500 hover:text-stone-900 underline"
                              >
                                View ↗
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(p.id)}
                                className="text-[10px] uppercase tracking-widest text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-stone-200 p-4 shadow-sm">
                  <div className="text-xs text-stone-500">
                    Showing <span className="font-medium text-stone-900">{startItemIdx}</span>–<span className="font-medium text-stone-900">{endItemIdx}</span> of <span className="font-medium text-stone-900">{totalCatalogItems}</span> catalog items
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Previous Button */}
                    <button
                      type="button"
                      disabled={validCatalogPage <= 1}
                      onClick={() => setCatalogPage((prev) => Math.max(1, prev - 1))}
                      className="px-3.5 py-1.5 border border-stone-200 bg-[#FAF9F6] text-xs font-medium text-stone-700 hover:border-stone-900 hover:text-stone-900 disabled:opacity-40 disabled:hover:border-stone-200 disabled:hover:text-stone-700 transition-colors"
                    >
                      Previous
                    </button>

                    {/* Page Number Buttons */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalCatalogPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCatalogPage(pageNum)}
                          className={`w-8 h-8 flex items-center justify-center text-xs font-medium border transition-colors ${
                            pageNum === validCatalogPage
                              ? 'bg-stone-900 text-white border-stone-900'
                              : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>

                    {/* Next Button */}
                    <button
                      type="button"
                      disabled={validCatalogPage >= totalCatalogPages}
                      onClick={() => setCatalogPage((prev) => Math.min(totalCatalogPages, prev + 1))}
                      className="px-3.5 py-1.5 border border-stone-200 bg-[#FAF9F6] text-xs font-medium text-stone-700 hover:border-stone-900 hover:text-stone-900 disabled:opacity-40 disabled:hover:border-stone-200 disabled:hover:text-stone-700 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Action Confirmation Modal for Seller Status Changes (Suspend / Cancel / Reject) */}
        {activeSellerActionUser && (
          <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="bg-white border border-stone-200 p-6 sm:p-8 shadow-2xl max-w-lg w-full my-8 animate-in fade-in zoom-in-95 duration-150">
              <span className="text-[10px] uppercase tracking-[0.25em] text-stone-400 font-semibold block mb-2">
                Seller Account Enforcement
              </span>
              <h2 className="text-xl sm:text-2xl font-serif text-stone-900 tracking-tight mb-2">
                {pendingActionType === 'suspend' && 'Suspend Seller Account'}
                {pendingActionType === 'reject' && 'Cancel / Reject Seller Application'}
                {pendingActionType === 'approve' && 'Approve Seller Account'}
                {pendingActionType === 'none' && 'Revoke Seller Privileges'}
              </h2>
              <p className="text-xs text-stone-600 mb-5 leading-relaxed">
                Target Account: <strong className="text-stone-900">{activeSellerActionUser.name}</strong> ({activeSellerActionUser.email})<br />
                Store: <span className="font-medium text-stone-800">{activeSellerActionUser.sellerProfile?.storeName || 'Campus Store'}</span>
              </p>

              {(pendingActionType === 'suspend' || pendingActionType === 'reject') && (
                <div className="mb-5">
                  <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                    Reason or Notice to Student (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={sellerActionReason}
                    onChange={(e) => setSellerActionReason(e.target.value)}
                    placeholder="e.g. Incomplete hostel verification or policy non-compliance."
                    className="w-full bg-[#FAF9F6] border border-stone-200 px-3.5 py-2.5 text-stone-900 text-xs focus:border-stone-900 focus:bg-white focus:outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSellerActionUser(null);
                    setPendingActionType('');
                    setSellerActionReason('');
                  }}
                  className="px-5 py-2 text-xs uppercase tracking-widest text-stone-500 hover:text-stone-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessingSellerAction}
                  onClick={() => handleSellerStatusChange(activeSellerActionUser.id, pendingActionType, sellerActionReason)}
                  className={`px-6 py-2.5 text-xs uppercase tracking-widest font-medium text-white transition-colors ${
                    pendingActionType === 'approve'
                      ? 'bg-emerald-800 hover:bg-emerald-900'
                      : 'bg-red-700 hover:bg-red-800'
                  }`}
                >
                  {isProcessingSellerAction ? 'Processing...' : 'Confirm Action'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: USERS & SELLERS */}
        {activeTab === 'users' && (() => {
          const pendingCount = users.filter(u => (u.sellerStatus || '').toLowerCase() === 'pending').length;
          const activeSellersCount = users.filter(u => u.isSeller || (u.sellerStatus || '').toLowerCase() === 'approved').length;
          const suspendedCount = users.filter(u => ['suspended', 'rejected'].includes((u.sellerStatus || '').toLowerCase())).length;

          const filteredUsers = users.filter(u => {
            const st = (u.sellerStatus || (u.isSeller ? 'approved' : 'none')).toLowerCase();
            if (userFilter === 'pending') return st === 'pending';
            if (userFilter === 'approved') return st === 'approved' || u.isSeller;
            if (userFilter === 'suspended') return st === 'suspended' || st === 'rejected';
            if (userFilter === 'buyers') return st === 'none' && !u.isSeller;
            return true;
          });

          return (
            <div className="space-y-6">
              
              {/* Filter Tabs & Summary Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-stone-200 p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setUserFilter('all')}
                    className={`px-3.5 py-1.5 text-xs font-medium border transition-colors ${
                      userFilter === 'all'
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-[#FAF9F6] text-stone-600 border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    All Accounts ({users.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setUserFilter('pending')}
                    className={`px-3.5 py-1.5 text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                      userFilter === 'pending'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-amber-50 text-amber-900 border-amber-200 hover:border-amber-400'
                    }`}
                  >
                    <span>Pending Applications</span>
                    {pendingCount > 0 && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        userFilter === 'pending' ? 'bg-white text-amber-700' : 'bg-amber-500 text-white'
                      }`}>
                        {pendingCount}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setUserFilter('approved')}
                    className={`px-3.5 py-1.5 text-xs font-medium border transition-colors ${
                      userFilter === 'approved'
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-[#FAF9F6] text-stone-600 border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    Active Sellers ({activeSellersCount})
                  </button>

                  <button
                    type="button"
                    onClick={() => setUserFilter('suspended')}
                    className={`px-3.5 py-1.5 text-xs font-medium border transition-colors ${
                      userFilter === 'suspended'
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-[#FAF9F6] text-stone-600 border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    Suspended / Cancelled ({suspendedCount})
                  </button>

                  <button
                    type="button"
                    onClick={() => setUserFilter('buyers')}
                    className={`px-3.5 py-1.5 text-xs font-medium border transition-colors ${
                      userFilter === 'buyers'
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-[#FAF9F6] text-stone-600 border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    Buyers Only
                  </button>
                </div>

                <div className="text-xs text-stone-500">
                  Showing <span className="font-semibold text-stone-900">{filteredUsers.length}</span> accounts
                </div>
              </div>

              {/* Accounts & Sellers Table */}
              <div className="bg-white border border-stone-200 shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 bg-[#FAF9F6] text-[10px] uppercase tracking-widest text-stone-400 font-semibold">
                      <th className="p-4">Student Name & Account</th>
                      <th className="p-4">Seller Store Details</th>
                      <th className="p-4">Seller Status</th>
                      <th className="p-4">Admin Role</th>
                      <th className="p-4 text-right">Verification & Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-stone-400 font-sans">
                          No accounts matching the selected filter.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const rawStatus = (u.sellerStatus || (u.isSeller ? 'approved' : 'none')).toLowerCase();
                        const details = u.sellerProfile || u.sellerDetails || {};

                        return (
                          <tr key={u.id} className="hover:bg-stone-50/50 transition-colors">
                            {/* Student info */}
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center font-serif text-xs shrink-0">
                                  {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div>
                                  <p className="font-medium text-stone-900 text-sm">{u.name}</p>
                                  <p className="text-stone-500 text-[11px] font-mono">{u.email}</p>
                                  {u.phone && <p className="text-stone-400 text-[10px]">Ph: {u.phone}</p>}
                                </div>
                              </div>
                            </td>

                            {/* Store details */}
                            <td className="p-4 text-stone-600 max-w-xs">
                              {details.storeName ? (
                                <div>
                                  <p className="font-medium text-stone-900">{details.storeName}</p>
                                  <p className="text-stone-500 text-[11px]">{details.campusLocation || 'Campus Pickup'}</p>
                                  {details.bio && <p className="text-stone-400 text-[10px] truncate">{details.bio}</p>}
                                  {details.statusReason && (
                                    <p className="text-red-700 text-[10px] mt-0.5 font-sans bg-red-50 p-1 border border-red-100">
                                      Note: {details.statusReason}
                                    </p>
                                  )}
                                </div>
                              ) : u.defaultAddress?.hostelBlock ? (
                                <span className="text-stone-500">{u.defaultAddress.hostelBlock}, Room {u.defaultAddress.roomNumber}</span>
                              ) : (
                                <span className="text-stone-400 italic">No store registered</span>
                              )}
                            </td>

                            {/* Status badge */}
                            <td className="p-4">
                              {rawStatus === 'approved' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                  Approved Seller
                                </span>
                              )}
                              {rawStatus === 'pending' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold bg-amber-50 text-amber-900 border border-amber-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                  Pending Review
                                </span>
                              )}
                              {rawStatus === 'suspended' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold bg-stone-100 text-stone-800 border border-stone-300">
                                  Suspended
                                </span>
                              )}
                              {rawStatus === 'rejected' && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold bg-red-50 text-red-800 border border-red-200">
                                  Cancelled
                                </span>
                              )}
                              {rawStatus === 'none' && (
                                <span className="text-[10px] uppercase tracking-wider text-stone-400">
                                  Student Buyer
                                </span>
                              )}
                            </td>

                            {/* Admin Role */}
                            <td className="p-4">
                              {u.isAdmin ? (
                                <span className="inline-block text-[10px] uppercase tracking-wider bg-stone-900 text-white px-2 py-0.5 font-medium">
                                  Admin Granted
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleToggleAdmin(u.id)}
                                  className="text-[10px] uppercase tracking-widest text-stone-400 hover:text-stone-800 underline"
                                  title="Make this student an administrator"
                                >
                                  Make Admin
                                </button>
                              )}
                            </td>

                            {/* Verification & Status Control Actions */}
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2 flex-wrap">
                                
                                {/* Case 1: Pending Application -> Approve OR Reject / Cancel */}
                                {rawStatus === 'pending' && (
                                  <>
                                    <button
                                      type="button"
                                      disabled={isProcessingSellerAction}
                                      onClick={() => handleSellerStatusChange(u.id, 'approved')}
                                      className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-[10px] uppercase tracking-wider font-medium transition-colors shadow-sm"
                                    >
                                      ✓ Approve
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isProcessingSellerAction}
                                      onClick={() => {
                                        setActiveSellerActionUser(u);
                                        setPendingActionType('reject');
                                      }}
                                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 text-[10px] uppercase tracking-wider font-medium transition-colors"
                                    >
                                      Cancel / Reject
                                    </button>
                                  </>
                                )}

                                {/* Case 2: Approved Seller -> Suspend OR Cancel / Revoke */}
                                {rawStatus === 'approved' && (
                                  <>
                                    <button
                                      type="button"
                                      disabled={isProcessingSellerAction}
                                      onClick={() => {
                                        setActiveSellerActionUser(u);
                                        setPendingActionType('suspend');
                                      }}
                                      className="px-3 py-1.5 border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 text-[10px] uppercase tracking-wider font-medium transition-colors"
                                    >
                                      Suspend
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isProcessingSellerAction}
                                      onClick={() => {
                                        setActiveSellerActionUser(u);
                                        setPendingActionType('reject');
                                      }}
                                      className="px-3 py-1.5 text-red-600 hover:text-red-800 text-[10px] uppercase tracking-wider font-medium transition-colors"
                                    >
                                      Revoke
                                    </button>
                                  </>
                                )}

                                {/* Case 3: Suspended / Rejected -> Re-Approve / Reactivate */}
                                {(rawStatus === 'suspended' || rawStatus === 'rejected') && (
                                  <>
                                    <button
                                      type="button"
                                      disabled={isProcessingSellerAction}
                                      onClick={() => handleSellerStatusChange(u.id, 'approved')}
                                      className="px-3 py-1.5 bg-stone-900 hover:bg-black text-white text-[10px] uppercase tracking-wider font-medium transition-colors"
                                    >
                                      Re-Approve
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isProcessingSellerAction}
                                      onClick={() => handleSellerStatusChange(u.id, 'none')}
                                      className="px-2.5 py-1.5 text-stone-400 hover:text-stone-700 text-[10px] uppercase tracking-wider transition-colors"
                                    >
                                      Reset to Buyer
                                    </button>
                                  </>
                                )}

                                {/* Case 4: Student Buyer with no store */}
                                {rawStatus === 'none' && (
                                  <span className="text-[10px] text-stone-400 italic">No Action Needed</span>
                                )}

                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

      </div>
    </main>
  );
}
