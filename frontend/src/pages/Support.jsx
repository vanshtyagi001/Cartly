import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const SECTIONS = [
  { id: 'contact', path: '/contact', label: 'Contact Us', category: 'Support' },
  { id: 'care', path: '/customer-care', label: 'Customer Care', category: 'Support' },
  { id: 'delivery', path: '/delivery-info', label: 'Delivery Info', category: 'Shipping & Orders' },
  { id: 'refund', path: '/refund-policy', label: 'Refund Policy', category: 'Legal & Policies' },
  { id: 'privacy', path: '/privacy-policy', label: 'Privacy Policy', category: 'Legal & Policies' },
  { id: 'terms', path: '/terms', label: 'Terms of Service', category: 'Legal & Policies' },
];

const FAQS = [
  {
    q: 'How do I track my campus order?',
    a: 'Sign in and visit your Orders page from the top-right profile menu. You will see live status updates (Confirmed, Preparing, Out for Delivery, Delivered) as the campus seller fulfills your order.',
  },
  {
    q: 'What payment methods are accepted on Cartly?',
    a: 'Cartly operates primarily on Cash on Delivery (COD) so students can inspect their items at their hostel door before paying. Sellers may also accept UPI at the time of doorstep delivery.',
  },
  {
    q: 'How can I become a verified seller on Cartly?',
    a: 'Click "Sell on Cartly" in the footer or your profile dropdown, submit your store name and hostel/campus location, and wait for campus administration approval. Once approved, Seller Studio unlocks automatically.',
  },
  {
    q: 'What if I receive a damaged or wrong item?',
    a: 'You can decline the item at doorstep delivery for Cash on Delivery orders, or raise a return request within 7 days via Customer Care / Contact Us with your Order ID.',
  },
];

export default function Support({ defaultSection = 'contact' }) {
  const location = useLocation();
  const matchedSection =
    SECTIONS.find((s) => s.path === location.pathname)?.id || defaultSection;

  const [openFaq, setOpenFaq] = useState(0);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    orderId: '',
    topic: 'Order & Delivery Inquiry',
    message: '',
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      return;
    }
    setContactSubmitted(true);
    setContactForm({
      name: '',
      email: '',
      orderId: '',
      topic: 'Order & Delivery Inquiry',
      message: '',
    });
  };

  return (
    <main className="flex-1 bg-[#FAF9F6] border-t border-stone-200 w-full py-14 lg:py-20 px-6 md:px-12">
      <div className="max-w-[1280px] mx-auto flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
        {/* Sticky Left Navigation */}
        <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-28">
          <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-stone-400 block mb-3">
            Cartly Help Center
          </span>
          <h2 className="font-serif text-2xl text-stone-900 tracking-tight mb-6">
            Support &amp; Policies
          </h2>

          <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 border-b lg:border-b-0 border-stone-200">
            {SECTIONS.map((item) => {
              const isActive = matchedSection === item.id;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`px-4 py-2.5 text-xs uppercase tracking-widest whitespace-nowrap transition-colors border-l-2 ${
                    isActive
                      ? 'bg-white border-stone-900 text-stone-900 font-semibold shadow-sm'
                      : 'border-transparent text-stone-500 hover:text-stone-900 hover:bg-white/60'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:block mt-8 p-5 bg-white border border-stone-200 text-xs space-y-2">
            <span className="text-[9px] uppercase tracking-widest text-stone-400 font-semibold block">
              Campus Operations Desk
            </span>
            <p className="text-stone-700 font-medium">North Campus Central Hub</p>
            <p className="text-stone-500">Mon – Sat, 9:00 AM – 8:00 PM</p>
            <p className="text-stone-500 font-mono text-[11px] pt-1">support@cartly.campus</p>
          </div>
        </aside>

        {/* Right Main Content */}
        <div className="flex-1 w-full bg-white border border-stone-200 p-8 sm:p-12 shadow-sm">
          {/* 1. CONTACT US */}
          {matchedSection === 'contact' && (
            <div className="space-y-8">
              <div className="pb-6 border-b border-stone-200">
                <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-stone-400 block mb-2">
                  Get in Touch
                </span>
                <h1 className="text-3xl sm:text-4xl font-serif text-stone-900 tracking-tight mb-3">
                  Contact Us
                </h1>
                <p className="text-stone-500 text-sm leading-relaxed max-w-xl">
                  Have a question about an order, seller verification, or campus delivery? Reach out to our campus operations team and we will respond within 4 business hours.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 bg-[#FAF9F6] border border-stone-200">
                  <span className="text-[9px] uppercase tracking-widest text-stone-400 font-semibold block mb-1.5">
                    Email Support
                  </span>
                  <p className="text-sm font-medium text-stone-900">support@cartly.campus</p>
                  <p className="text-[11px] text-stone-500 mt-1">General &amp; order inquiries</p>
                </div>
                <div className="p-5 bg-[#FAF9F6] border border-stone-200">
                  <span className="text-[9px] uppercase tracking-widest text-stone-400 font-semibold block mb-1.5">
                    Campus Hub
                  </span>
                  <p className="text-sm font-medium text-stone-900">North Campus Center</p>
                  <p className="text-[11px] text-stone-500 mt-1">Student Activity Block, Room 12</p>
                </div>
                <div className="p-5 bg-[#FAF9F6] border border-stone-200">
                  <span className="text-[9px] uppercase tracking-widest text-stone-400 font-semibold block mb-1.5">
                    Support Hours
                  </span>
                  <p className="text-sm font-medium text-stone-900">9:00 AM – 8:00 PM</p>
                  <p className="text-[11px] text-stone-500 mt-1">Monday through Saturday</p>
                </div>
              </div>

              {contactSubmitted ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                  <h3 className="font-serif text-lg">Inquiry Received</h3>
                  <p className="text-xs leading-relaxed">
                    Thank you for contacting Cartly. Your ticket has been logged with our campus support desk, and a representative will reach out shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => setContactSubmitted(false)}
                    className="mt-2 text-[10px] uppercase tracking-widest font-semibold underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-5 max-w-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Your name"
                        className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-3 text-sm text-stone-900 focus:border-stone-900 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                        Campus Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))}
                        placeholder="you@campus.edu"
                        className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-3 text-sm text-stone-900 focus:border-stone-900 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                        Topic
                      </label>
                      <select
                        value={contactForm.topic}
                        onChange={(e) => setContactForm((p) => ({ ...p, topic: e.target.value }))}
                        className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-3 text-sm text-stone-900 focus:border-stone-900 focus:bg-white focus:outline-none"
                      >
                        <option>Order &amp; Delivery Inquiry</option>
                        <option>Return or Refund Request</option>
                        <option>Seller Account &amp; Verification</option>
                        <option>Report a Product Listing</option>
                        <option>General Feedback</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                        Order ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={contactForm.orderId}
                        onChange={(e) => setContactForm((p) => ({ ...p, orderId: e.target.value }))}
                        placeholder="e.g., ORD-1024"
                        className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-3 text-sm text-stone-900 focus:border-stone-900 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-medium text-stone-500 mb-1.5">
                      Message *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={contactForm.message}
                      onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))}
                      placeholder="Describe how we can help..."
                      className="w-full bg-[#FAF9F6] border border-stone-200 px-4 py-3 text-sm text-stone-900 focus:border-stone-900 focus:bg-white focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-stone-900 text-white text-xs uppercase tracking-[0.15em] font-medium py-4 px-8 hover:bg-black transition-colors"
                  >
                    Submit Inquiry
                  </button>
                </form>
              )}
            </div>
          )}

          {/* 2. CUSTOMER CARE */}
          {matchedSection === 'care' && (
            <div className="space-y-8">
              <div className="pb-6 border-b border-stone-200">
                <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-stone-400 block mb-2">
                  Student Support
                </span>
                <h1 className="text-3xl sm:text-4xl font-serif text-stone-900 tracking-tight mb-3">
                  Customer Care
                </h1>
                <p className="text-stone-500 text-sm leading-relaxed max-w-xl">
                  Answers to common questions about ordering, hostel delivery, seller verification, and buyer protection on Cartly.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  to="/orders"
                  className="p-6 bg-[#FAF9F6] border border-stone-200 hover:border-stone-900 transition-colors group"
                >
                  <span className="text-[9px] uppercase tracking-widest text-stone-400 font-semibold block mb-1">
                    Self-Service
                  </span>
                  <h3 className="font-serif text-lg text-stone-900 group-hover:underline">
                    Track Your Orders →
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Check live fulfillment status and hostel delivery details.
                  </p>
                </Link>

                <Link
                  to="/contact"
                  className="p-6 bg-[#FAF9F6] border border-stone-200 hover:border-stone-900 transition-colors group"
                >
                  <span className="text-[9px] uppercase tracking-widest text-stone-400 font-semibold block mb-1">
                    Direct Assistance
                  </span>
                  <h3 className="font-serif text-lg text-stone-900 group-hover:underline">
                    Message Support Desk →
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    Need help with an active issue? Open a support ticket.
                  </p>
                </Link>
              </div>

              <div>
                <h2 className="font-serif text-2xl text-stone-900 mb-4">Frequently Asked Questions</h2>
                <div className="divide-y divide-stone-200 border-t border-b border-stone-200">
                  {FAQS.map((faq, idx) => (
                    <div key={idx} className="py-4">
                      <button
                        type="button"
                        onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                        className="w-full flex items-center justify-between text-left gap-4 py-1"
                      >
                        <span className="font-serif text-base text-stone-900">{faq.q}</span>
                        <span className="text-stone-400 text-lg shrink-0">
                          {openFaq === idx ? '−' : '+'}
                        </span>
                      </button>
                      {openFaq === idx && (
                        <p className="text-stone-600 text-xs leading-relaxed pt-2 pr-6">
                          {faq.a}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. DELIVERY INFO */}
          {matchedSection === 'delivery' && (
            <div className="space-y-8">
              <div className="pb-6 border-b border-stone-200">
                <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-stone-400 block mb-2">
                  Campus Logistics
                </span>
                <h1 className="text-3xl sm:text-4xl font-serif text-stone-900 tracking-tight mb-3">
                  Delivery Information
                </h1>
                <p className="text-stone-500 text-sm leading-relaxed max-w-xl">
                  Fast, predictable campus fulfillment directly to your hostel block, room, or designated campus pickup point.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-6 bg-[#FAF9F6] border border-stone-200">
                  <span className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold block mb-2">
                    Standard Campus
                  </span>
                  <p className="font-serif text-2xl text-stone-900 mb-1">Same Day – 24h</p>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Orders placed before 4:00 PM from in-campus sellers are typically delivered the same evening.
                  </p>
                </div>

                <div className="p-6 bg-[#FAF9F6] border border-stone-200">
                  <span className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold block mb-2">
                    Delivery Fee
                  </span>
                  <p className="font-serif text-2xl text-stone-900 mb-1">Free on Campus</p>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Zero shipping charges for deliveries across North Campus, South Campus, and Hostel Blocks.
                  </p>
                </div>

                <div className="p-6 bg-[#FAF9F6] border border-stone-200">
                  <span className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold block mb-2">
                    Payment Mode
                  </span>
                  <p className="font-serif text-2xl text-stone-900 mb-1">Cash on Delivery</p>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Pay in cash or UPI upon inspecting your package at your hostel room or block gate.
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-stone-600 leading-relaxed">
                <h2 className="font-serif text-xl text-stone-900">Coverage Zones</h2>
                <p>
                  We deliver across all recognized university hostels, residential blocks, and academic departments (North Campus, South Campus, and Central Depot). Please ensure your Hostel Block, Room Number, and active phone number are up to date in your <Link to="/profile" className="text-stone-900 underline">Profile</Link>.
                </p>
                <h2 className="font-serif text-xl text-stone-900 pt-2">Order Verification at Doorstep</h2>
                <p>
                  To protect student buyers, please verify item quantity and physical condition at the time of delivery before completing your Cash on Delivery payment.
                </p>
              </div>
            </div>
          )}

          {/* 4. REFUND POLICY */}
          {matchedSection === 'refund' && (
            <div className="space-y-6 text-sm text-stone-600 leading-relaxed">
              <div className="pb-6 border-b border-stone-200">
                <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-stone-400 block mb-2">
                  Buyer Protection
                </span>
                <h1 className="text-3xl sm:text-4xl font-serif text-stone-900 tracking-tight mb-2">
                  Refund &amp; Return Policy
                </h1>
                <p className="text-xs text-stone-400">Last updated: November 2026</p>
              </div>

              <h2 className="font-serif text-xl text-stone-900">1. 7-Day Campus Return Window</h2>
              <p>
                Most items purchased on Cartly are eligible for return or replacement within <strong>7 days</strong> of delivery if the product is unused, in its original packaging, and accompanied by your Order ID.
              </p>

              <h2 className="font-serif text-xl text-stone-900 pt-2">2. Eligible Reasons for Return</h2>
              <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
                <li>Item arrived damaged, defective, or physically broken.</li>
                <li>Incorrect product, size, or model delivered compared to the listing.</li>
                <li>Missing parts or accessories advertised in the product description.</li>
              </ul>

              <h2 className="font-serif text-xl text-stone-900 pt-2">3. Non-Returnable Items</h2>
              <p>
                Opened personal hygiene products, consumables (such as opened coffee or stationery refills), and custom-made items are not eligible for return unless received damaged or defective.
              </p>

              <h2 className="font-serif text-xl text-stone-900 pt-2">4. How Refunds Are Processed</h2>
              <p>
                Since Cartly orders are fulfilled via Cash on Delivery / doorstep UPI, approved refunds are issued immediately upon item pickup via UPI transfer or cash settlement at your campus hub within 24–48 hours.
              </p>

              <div className="pt-4">
                <Link
                  to="/contact"
                  className="inline-block bg-stone-900 text-white text-xs uppercase tracking-[0.15em] font-medium py-3.5 px-7 hover:bg-black transition-colors"
                >
                  Request a Return
                </Link>
              </div>
            </div>
          )}

          {/* 5. PRIVACY POLICY */}
          {matchedSection === 'privacy' && (
            <div className="space-y-6 text-sm text-stone-600 leading-relaxed">
              <div className="pb-6 border-b border-stone-200">
                <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-stone-400 block mb-2">
                  Data &amp; Trust
                </span>
                <h1 className="text-3xl sm:text-4xl font-serif text-stone-900 tracking-tight mb-2">
                  Privacy Policy
                </h1>
                <p className="text-xs text-stone-400">Effective Date: November 2026</p>
              </div>

              <h2 className="font-serif text-xl text-stone-900">1. Information We Collect</h2>
              <p>
                When you create a Cartly account, place an order, or apply as a campus seller, we collect only the details necessary to operate the campus marketplace: your name, campus email address, phone number, hostel block / room number, and seller store profile information.
              </p>

              <h2 className="font-serif text-xl text-stone-900 pt-2">2. How We Use Your Information</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>To process and deliver your campus orders accurately to your hostel room.</li>
                <li>To verify student seller applications and maintain marketplace safety.</li>
                <li>To communicate order status updates and restock notifications you opt into.</li>
              </ul>

              <h2 className="font-serif text-xl text-stone-900 pt-2">3. Data Sharing &amp; Storage</h2>
              <p>
                We never sell student data to third parties. Your delivery name, hostel block, and contact phone are shared strictly with the verified seller fulfilling your order. Authentication tokens and cart state are stored securely in your browser for session continuity.
              </p>

              <h2 className="font-serif text-xl text-stone-900 pt-2">4. Your Rights</h2>
              <p>
                You may update your profile and hostel delivery address anytime from your <Link to="/profile" className="text-stone-900 underline">Profile</Link>, or contact <span className="font-mono text-stone-800">support@cartly.campus</span> to request account deletion.
              </p>
            </div>
          )}

          {/* 6. TERMS OF SERVICE */}
          {matchedSection === 'terms' && (
            <div className="space-y-6 text-sm text-stone-600 leading-relaxed">
              <div className="pb-6 border-b border-stone-200">
                <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-stone-400 block mb-2">
                  Platform Guidelines
                </span>
                <h1 className="text-3xl sm:text-4xl font-serif text-stone-900 tracking-tight mb-2">
                  Terms of Service
                </h1>
                <p className="text-xs text-stone-400">Effective Date: November 2026</p>
              </div>

              <h2 className="font-serif text-xl text-stone-900">1. Campus Marketplace Conduct</h2>
              <p>
                Cartly is a curated university commerce platform. All buyers and sellers agree to conduct transactions honestly, provide accurate hostel delivery information, and adhere to campus policies.
              </p>

              <h2 className="font-serif text-xl text-stone-900 pt-2">2. Seller Responsibilities</h2>
              <p>
                Approved campus sellers must list accurate product descriptions, genuine photos, up-to-date stock quantities, and fulfill confirmed orders promptly. Cartly administration reserves the right to suspend or revoke seller privileges for policy violations.
              </p>

              <h2 className="font-serif text-xl text-stone-900 pt-2">3. Orders &amp; Availability</h2>
              <p>
                Product availability is tracked dynamically. In the rare event an item goes out of stock before fulfillment, sellers will notify the buyer and cancel any pending Cash on Delivery obligation.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
