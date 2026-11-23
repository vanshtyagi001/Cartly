import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminPanel() {
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
  const [notification, setNotification] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Hostel Essentials',
    price: '',
    img: '',
    description: '',
  });
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  const fetchAdminData = async () => {
    if (!token || !user?.isAdmin) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

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
  }, [token, user?.isAdmin]);

  const showNotice = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  // Update order status
  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        showNotice(`Order #${orderId} status set to ${newStatus}.`);
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
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        showNotice(`Product #${productId} deleted.`);
        fetchAdminData();
      }
    } catch (err) {
      console.error('Delete product failed:', err);
    }
  };

  // Create new catalog product
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setIsSubmittingProduct(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newProduct),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add product');

      showNotice(`'${newProduct.name}' added to platform catalog.`);
      setIsAddingProduct(false);
      setNewProduct({ name: '', category: 'Hostel Essentials', price: '', img: '', description: '' });
      fetchAdminData();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // Auth & Admin check
  if (!isAuthenticated) {
    return (
      <main className="flex-1 bg-[#FAF9F6] border-t border-stone-200 py-24 px-6 flex items-center justify-center min-h-[calc(100vh-88px)]">
        <div className="max-w-md w-full bg-white border border-stone-200 p-8 sm:p-12 text-center shadow-sm">
          <span className="text-[10px] uppercase tracking-[0.25em] font-medium text-stone-400 block mb-3">
            Internal Portal
          </span>
          <h1 className="text-3xl font-serif text-stone-900 tracking-tight mb-4">
            Admin Sign In Required
          </h1>
          <p className="text-stone-500 text-xs leading-relaxed mb-8">
            Access to platform operations, campus metrics, and order fulfillment is restricted to authorized personnel.
          </p>
          <Link
            to="/login"
            state={{ from: { pathname: '/admin' } }}
            className="inline-block w-full bg-stone-900 text-white text-xs uppercase tracking-[0.15em] font-medium py-4 hover:bg-black transition-colors"
          >
            Sign In with Admin Account
          </Link>
        </div>
      </main>
    );
  }

  if (!user?.isAdmin) {
    return (
      <main className="flex-1 bg-[#FAF9F6] border-t border-stone-200 py-24 px-6 flex items-center justify-center min-h-[calc(100vh-88px)]">
        <div className="max-w-md w-full bg-white border border-stone-200 p-8 sm:p-12 text-center shadow-sm">
          <span className="text-[10px] uppercase tracking-[0.25em] font-medium text-stone-400 block mb-3">
            Access Restricted
          </span>
          <h1 className="text-2xl font-serif text-stone-900 tracking-tight mb-4">
            Administrator Privileges Required
          </h1>
          <p className="text-stone-500 text-xs leading-relaxed mb-6">
            Signed in as <strong>{user.email}</strong>. This account does not hold administrator access rights for the campus portal.
          </p>
          <Link
            to="/shop"
            className="inline-block bg-stone-900 text-white text-xs uppercase tracking-[0.15em] font-medium py-3 px-8 hover:bg-black transition-colors"
          >
            Return to Shop
          </Link>
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

  return (
    <main className="flex-1 bg-[#FAF9F6] border-t border-stone-200 py-12 lg:py-16 px-6 md:px-12 min-h-[calc(100vh-88px)]">
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
          </div>

          <div className="flex items-center gap-4">
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="p-4 font-medium text-stone-900">{order.id}</td>
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
            
            {/* Modal to Add New Product */}
            {isAddingProduct && (
              <div className="bg-white border border-stone-200 p-8 shadow-md mb-8">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-stone-200">
                  <h3 className="font-serif text-2xl text-stone-900 tracking-tight">
                    Add Item to Official Catalog
                  </h3>
                  <button onClick={() => setIsAddingProduct(false)} className="text-stone-400 hover:text-stone-900 text-sm">
                    ✕ Close
                  </button>
                </div>

                <form onSubmit={handleCreateProduct} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
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
                        value={newProduct.price}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="799"
                        className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-2.5 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                        Image URL
                      </label>
                      <input
                        type="url"
                        value={newProduct.img}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, img: e.target.value }))}
                        placeholder="https://..."
                        className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-2.5 text-stone-900 text-sm focus:border-stone-900 focus:bg-white focus:outline-none"
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

                  <div className="flex justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsAddingProduct(false)}
                      className="px-6 py-2.5 text-xs uppercase tracking-widest text-stone-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingProduct}
                      className="bg-stone-900 text-white text-xs uppercase tracking-[0.15em] font-medium py-2.5 px-8 hover:bg-black transition-colors"
                    >
                      {isSubmittingProduct ? 'Saving...' : 'Add to Catalog'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Catalog search bar */}
            <div className="flex justify-between items-center bg-white border border-stone-200 p-4">
              <input
                type="text"
                placeholder="Search products by title or category..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full sm:w-96 bg-[#FAF9F6] border border-stone-200 px-4 py-2 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
              />
              <span className="text-xs text-stone-400">
                {filteredProducts.length} items
              </span>
            </div>

            {/* Products Table */}
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
                  {filteredProducts.map((p) => (
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
                      <td className="p-4 text-right">
                        <button
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

          </div>
        )}

        {/* TAB 4: USERS & SELLERS */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white border border-stone-200 shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-200 bg-[#FAF9F6] text-[10px] uppercase tracking-widest text-stone-400 font-semibold">
                    <th className="p-4">Student Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Account Type</th>
                    <th className="p-4">Hostel / Store Details</th>
                    <th className="p-4 text-right">Admin Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="p-4 font-medium text-stone-900 flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-stone-900 text-white flex items-center justify-center font-serif text-xs">
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span>{u.name}</span>
                      </td>
                      <td className="p-4 text-stone-600">{u.email}</td>
                      <td className="p-4">
                        {u.isSeller ? (
                          <span className="text-[10px] uppercase tracking-wider bg-stone-100 text-stone-800 px-2 py-0.5 font-medium">
                            Campus Seller
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase tracking-wider text-stone-400">
                            Student Buyer
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-stone-500">
                        {u.sellerProfile?.storeName ? (
                          <span>{u.sellerProfile.storeName} ({u.sellerProfile.campusLocation})</span>
                        ) : u.defaultAddress?.hostelBlock ? (
                          <span>{u.defaultAddress.hostelBlock}, Room {u.defaultAddress.roomNumber}</span>
                        ) : (
                          <span>Standard Account</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {u.isAdmin ? (
                          <span className="text-[10px] uppercase tracking-wider text-emerald-800 font-semibold">
                            Admin Granted
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase tracking-wider text-stone-400">
                            User
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
