import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortDropdownRef = useRef(null);
  
  // State to hold products and categories from backend
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([
    "All Products", "Hostel Essentials", "Electronics", "Stationery", "Trekking Essentials"
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    try {
      const saved = localStorage.getItem('cartly_recently_viewed');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleClearRecentlyViewed = () => {
    localStorage.removeItem('cartly_recently_viewed');
    setRecentlyViewed([]);
  };

  // Fetch products and categories from backend on component mount
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    Promise.all([
      fetch(`${apiUrl}/api/products`).then(r => r.json()).catch(() => []),
      fetch(`${apiUrl}/api/categories`).then(r => r.json()).catch(() => ({ categories: [] }))
    ])
      .then(([prods, catData]) => {
        setProducts(Array.isArray(prods) ? prods : []);
        if (catData?.categories && Array.isArray(catData.categories)) {
          setCategories(["All Products", ...catData.categories]);
        }
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Error fetching shop data:", error);
        setIsLoading(false);
      });
  }, []);
  
  // Read current states from the URL, defaulting to Name: A to Z
  const activeCategory = searchParams.get("category") || "All Products";
  const activeSort = searchParams.get("sort") || "name-asc";
  const searchQuery = searchParams.get("search") || "";
  const activePriceRange = searchParams.get("price") || "all";
  const inStockOnly = searchParams.get("inStock") === "1";

  const priceRanges = [
    { id: "all", label: "All Prices" },
    { id: "under-500", label: "Under ₹500" },
    { id: "500-1500", label: "₹500 – ₹1,500" },
    { id: "1500-plus", label: "₹1,500 & Above" },
  ];

  const sortOptions = [
    { id: 'name-asc', label: 'Name: A to Z' },
    { id: 'name-desc', label: 'Name: Z to A' },
    { id: 'price-asc', label: 'Price: Low to High' },
    { id: 'price-desc', label: 'Price: High to Low' }
  ];

  // 1. Filter by Category, Availability, Price Range & Search Query
  let displayedProducts = products.filter(product => {
    const matchesCategory = activeCategory === "All Products" || product.category === activeCategory;
    if (!matchesCategory) return false;

    if (inStockOnly) {
      const stockCount = product.stock !== undefined ? product.stock : 25;
      if (stockCount <= 0 || product.inStock === false) return false;
    }

    if (activePriceRange !== "all") {
      const numPrice = typeof product.rawPrice === 'number'
        ? product.rawPrice
        : parseFloat(String(product.price).replace(/[^0-9.-]+/g, '')) || 0;
      if (activePriceRange === "under-500" && numPrice >= 500) return false;
      if (activePriceRange === "500-1500" && (numPrice < 500 || numPrice > 1500)) return false;
      if (activePriceRange === "1500-plus" && numPrice <= 1500) return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = product.name?.toLowerCase().includes(q);
    const descMatch = product.description?.toLowerCase().includes(q);
    const sellerMatch = product.sellerName?.toLowerCase().includes(q);
    const catMatch = product.category?.toLowerCase().includes(q);
    return Boolean(nameMatch || descMatch || sellerMatch || catMatch);
  });

  // 2. Sort the Filtered Products
  displayedProducts.sort((a, b) => {
    // Safety check: if price is missing while loading, skip sorting
    if (a.price === undefined || b.price === undefined) return 0; 

    // This handles BOTH strings ("$45") and raw numbers (45) safely without crashing
    const priceA = typeof a.price === 'string' ? parseFloat(a.price.replace(/[^0-9.-]+/g, '')) : a.price;
    const priceB = typeof b.price === 'string' ? parseFloat(b.price.replace(/[^0-9.-]+/g, '')) : b.price;

    if (activeSort === 'price-asc') return priceA - priceB;
    if (activeSort === 'price-desc') return priceB - priceA;
    if (activeSort === 'name-desc') return b.name.localeCompare(a.name);
    
    // Default fallback is Name: A to Z
    return a.name.localeCompare(b.name); 
  });

  // Smart URL parameter updating
  const handleCategoryClick = (cat) => {
    const newParams = new URLSearchParams(searchParams);
    if (cat === "All Products") {
      newParams.delete("category");
    } else {
      newParams.set("category", cat);
    }
    setSearchParams(newParams);
  };

  const handleSortClick = (sortId) => {
    const newParams = new URLSearchParams(searchParams);
    // If selecting the default sort, remove it from the URL to keep it clean
    if (sortId === "name-asc") {
      newParams.delete("sort");
    } else {
      newParams.set("sort", sortId);
    }
    setSearchParams(newParams);
    setIsSortOpen(false);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    const newParams = new URLSearchParams(searchParams);
    if (!val.trim()) {
      newParams.delete("search");
    } else {
      newParams.set("search", val);
    }
    setSearchParams(newParams, { replace: true });
  };

  const handleClearSearch = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("search");
    setSearchParams(newParams, { replace: true });
  };

  const handlePriceRangeClick = (rangeId) => {
    const newParams = new URLSearchParams(searchParams);
    if (rangeId === "all") {
      newParams.delete("price");
    } else {
      newParams.set("price", rangeId);
    }
    setSearchParams(newParams, { replace: true });
  };

  const handleToggleInStock = () => {
    const newParams = new URLSearchParams(searchParams);
    if (inStockOnly) {
      newParams.delete("inStock");
    } else {
      newParams.set("inStock", "1");
    }
    setSearchParams(newParams, { replace: true });
  };

  const handleResetAllFilters = () => {
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilters =
    activeCategory !== "All Products" ||
    activePriceRange !== "all" ||
    inStockOnly ||
    Boolean(searchQuery.trim());

  // Close the sort dropdown if the user clicks outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentSortLabel = sortOptions.find(opt => opt.id === activeSort)?.label || "Name: A to Z";

  return (
    <main className="flex-1 w-full bg-white border-t border-stone-200 min-h-[calc(100vh-88px)]">
      <div className="max-w-[1600px] mx-auto px-8 md:px-12 flex flex-col md:flex-row items-stretch">
        
        {/* Left Sidebar - Architectural Sticky Vertical Column */}
        <aside className="w-full md:w-56 shrink-0 md:border-r border-stone-200">
          <div className="md:sticky md:top-[88px] flex flex-col pt-12 md:pt-16 pb-12 pr-8 md:pr-12 max-h-[calc(100vh-88px)] overflow-y-auto">
            <h3 className="text-[9px] font-semibold text-stone-400 uppercase tracking-[0.2em] mb-8">Categories</h3>
            <ul className="flex flex-col space-y-5">
              {categories.map((cat) => (
                <li key={cat}>
                  {/* Custom Left-to-Right Underline Hover Interaction */}
                  <button 
                    onClick={() => handleCategoryClick(cat)}
                    className={`relative text-left w-fit text-[11px] uppercase tracking-[0.15em] transition-colors duration-300 pb-1 
                      after:absolute after:bottom-0 after:left-0 after:h-[1px] after:bg-stone-900 after:transition-all after:duration-[400ms] after:ease-[cubic-bezier(0.25,0.1,0.25,1)]
                      ${
                      activeCategory === cat 
                        ? 'text-stone-900 font-semibold after:w-full' 
                        : 'text-stone-400 hover:text-stone-900 after:w-0 hover:after:w-full'
                    }`}
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>

            {/* Price Range Filter */}
            <div className="border-t border-stone-200 pt-8 mt-8">
              <h3 className="text-[9px] font-semibold text-stone-400 uppercase tracking-[0.2em] mb-5">
                Price Range
              </h3>
              <ul className="flex flex-col space-y-3.5">
                {priceRanges.map((range) => (
                  <li key={range.id}>
                    <button
                      type="button"
                      onClick={() => handlePriceRangeClick(range.id)}
                      className={`text-left text-[11px] uppercase tracking-[0.12em] transition-colors flex items-center gap-2.5 ${
                        activePriceRange === range.id
                          ? 'text-stone-900 font-semibold'
                          : 'text-stone-400 hover:text-stone-900'
                      }`}
                    >
                      <span
                        className={`w-2.5 h-2.5 border flex items-center justify-center shrink-0 ${
                          activePriceRange === range.id ? 'border-stone-900' : 'border-stone-300'
                        }`}
                      >
                        {activePriceRange === range.id && <span className="w-1.5 h-1.5 bg-stone-900" />}
                      </span>
                      <span>{range.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Availability Toggle */}
            <div className="border-t border-stone-200 pt-8 mt-8">
              <h3 className="text-[9px] font-semibold text-stone-400 uppercase tracking-[0.2em] mb-4">
                Availability
              </h3>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={handleToggleInStock}
                  className="sr-only"
                />
                <span
                  className={`w-4 h-4 border flex items-center justify-center transition-colors shrink-0 ${
                    inStockOnly
                      ? 'bg-stone-900 border-stone-900 text-white'
                      : 'bg-white border-stone-300 group-hover:border-stone-600'
                  }`}
                >
                  {inStockOnly && (
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className="text-[11px] uppercase tracking-[0.12em] text-stone-600 group-hover:text-stone-900">
                  In Stock Only
                </span>
              </label>
            </div>

            {hasActiveFilters && (
              <div className="pt-6 mt-6 border-t border-stone-200">
                <button
                  type="button"
                  onClick={handleResetAllFilters}
                  className="text-[10px] uppercase tracking-widest text-stone-500 hover:text-stone-900 underline transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Right Content Area */}
        <section className="flex-1 flex flex-col min-w-0 md:pl-12 pt-12 md:pt-16 pb-24">
          
          {/* Top Header / Filters - Structural Horizontal Axis */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-10 pb-5 border-b border-stone-200 gap-5">
            
            {/* Search Input Box */}
            <div className="relative w-full sm:w-80 md:w-96">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-stone-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input 
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search campus essentials, gear, sellers..."
                className="w-full bg-[#FAF9F6] border border-stone-200 pl-9 pr-8 py-2 text-xs text-stone-900 placeholder:text-stone-400 font-sans focus:outline-none focus:border-stone-900 focus:bg-white transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-900 text-xs transition-colors"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Right Controls: Item Count & Sort Dropdown */}
            <div className="flex items-center justify-between lg:justify-end gap-6 sm:gap-8">
              <div className="text-stone-500 font-sans text-xs tracking-wide">
                Showing {displayedProducts.length} {displayedProducts.length === 1 ? 'Product' : 'Products'}
                {searchQuery && (
                  <span className="text-stone-400 text-[11px] ml-1">
                    for "<span className="text-stone-700 font-medium">{searchQuery}</span>"
                  </span>
                )}
              </div>
              
              {/* Custom Sort Dropdown */}
              <div className="relative" ref={sortDropdownRef}>
                <button 
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-medium text-stone-500 hover:text-stone-900 transition-colors focus:outline-none"
                >
                  <span>Sort: {currentSortLabel}</span>
                  <svg className={`w-3 h-3 transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                <div 
                  className={`absolute right-0 mt-4 w-52 bg-white border border-stone-200/80 shadow-xl shadow-stone-900/5 z-20 transition-all duration-300 origin-top-right ${
                    isSortOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible pointer-events-none'
                  }`}
                >
                  <div className="py-2 flex flex-col">
                    {sortOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleSortClick(option.id)}
                        className={`w-full text-left px-5 py-3 text-[10px] uppercase tracking-wider transition-colors ${
                          activeSort === option.id 
                            ? 'text-stone-900 bg-stone-50 font-medium' 
                            : 'text-stone-400 hover:bg-stone-50 hover:text-stone-900'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Grid or Loading State */}
          {isLoading ? (
            <div className="py-32 text-center text-stone-400 font-serif italic text-xl">Loading essentials...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-12">
              {displayedProducts.map((product) => (
                <Link 
                  to={`/product/${product.id}`} 
                  key={product.id} 
                  className="group cursor-pointer block"
                >
                  {/* Image Frame - Warm paper tone against the pure white page */}
                  <div className="aspect-square w-full bg-[#FAF9F6] overflow-hidden border border-stone-200 mb-4 relative">
                    <img 
                      src={product.img} 
                      alt={product.name} 
                      className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-[1.5s] ease-[cubic-bezier(0.25,0.1,0.25,1)]" 
                    />
                    {/* Minimalist hover overlay */}
                    <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/[0.02] transition-colors duration-500" />
                  </div>
                  
                  {/* Product Info - Flush Left Alignment */}
                  <div className="flex flex-col pr-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] uppercase tracking-widest text-stone-400 block">
                        {product.category}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <h4 className="text-stone-900 font-serif text-base leading-tight line-clamp-2">
                        {product.name}
                      </h4>
                      <span className="text-stone-500 font-sans text-sm tracking-wide mt-1">
                        {product.price}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
              
              {displayedProducts.length === 0 && (
                <div className="col-span-full py-32 text-center">
                  <span className="text-stone-400 font-serif italic text-xl block mb-3">
                    No products found matching your criteria.
                  </span>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="text-[10px] uppercase tracking-widest text-stone-900 border-b border-stone-900 pb-0.5 hover:text-stone-500 hover:border-stone-500 transition-colors"
                    >
                      Clear search "{searchQuery}"
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Recently Viewed Strip */}
          {recentlyViewed.length > 0 && (
            <div className="mt-20 pt-12 border-t border-stone-200">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <span className="text-[9px] uppercase tracking-[0.25em] text-stone-400 font-semibold block mb-1">
                    Browsing History
                  </span>
                  <h3 className="text-2xl font-serif text-stone-900 tracking-tight">
                    Recently Viewed
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleClearRecentlyViewed}
                  className="text-[10px] uppercase tracking-widest text-stone-400 hover:text-stone-900 underline transition-colors"
                >
                  Clear History
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {recentlyViewed.map((item) => (
                  <Link
                    key={item.id}
                    to={`/product/${item.id}`}
                    className="group block bg-[#FAF9F6] border border-stone-200 p-3.5 hover:border-stone-400 transition-colors"
                  >
                    <div className="aspect-square bg-white border border-stone-100 overflow-hidden mb-3">
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                    <span className="text-[9px] uppercase tracking-widest text-stone-400 block mb-1">
                      {item.category}
                    </span>
                    <h4 className="font-serif text-sm text-stone-900 group-hover:underline truncate">
                      {item.name}
                    </h4>
                    <span className="text-xs text-stone-500 mt-0.5 block">{item.price}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}