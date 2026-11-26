# 🎒 Cartly: The Modern Campus Survival Hub

> **Empowering student life, one essential at a time.**  
> Cartly is an editorial, full-stack e-commerce ecosystem purpose-built for campus students. From midnight study stationery to hostel room essentials and weekend trekking gear, Cartly delivers a frictionless, tactile shopping experience tailored for modern university life.

---

## 🌟 The Vision & Design Language

Living on campus comes with unique daily logistics. Cartly was engineered with an editorial, minimalist design language that fuses contemporary Japanese architectural restraint, print magazine typography (*Lora* + *DM Sans*), and an organic warm paper canvas (`#FAF9F6`).

* 🎨 **Full Design Specification**: See [design.md](design.md) for color tokens, typography scales, geometry rules, and motion curves.

---

## 🛍️ Curated Campus Categories

* **🪥 Hostel Essentials:** Non-negotiable daily drivers—laundry hampers, mattress toppers, storage cubes, and desk organizers.
* **📚 Stationery:** Hardcover ruled notebooks, precision gel pens, drafting tools, and highlighters.
* **🔌 Electronics:** Noise-cancelling headphones, scientific calculators, 20,000mAh power banks, and surge protectors.
* **🏕️ Trekking Essentials:** All-weather backpacks, insulated steel flasks, heavy-duty boots, and navigation multi-tools.

---

## ✨ Key Features & User Experience

* **Interactive Hero Showcase:** Dynamic hero panel featuring an expandable viewport reveal with custom cubic-bezier animations and a brand cipher easter egg.
* **Frictionless Catalog & Discovery:** Left-sidebar category filtering, real-time sorting (Name A–Z / Z–A, Price Low–High / High–Low), and clickable full-screen product lightboxes.
* **Sliding Cart Drawer Engine:** Globally accessible sliding drawer managed via React Context API (`CartContext`). Handles live quantity adjustment, zero layout shifts, and real-time subtotal computation.
* **Complete User Authentication System:**
  * User registration and login with encrypted password storage (`PBKDF2/SHA256`).
  * 30-day secure HMAC signed session tokens via Django TimestampSigner.
  * Interactive user account menu in the navbar with user initials, order sync status, and one-click sign out.
* **Transparent Checkout Pipeline:** Itemized order breakdown, automatic 8% tax calculation, free campus shipping, and authenticated user identity tags.
* **Orders Tracking Dashboard:** Dedicated post-purchase order tracking page customized to the signed-in student's account.
* **Campus Seller System:** Decentralized peer marketplace allowing verified students to onboard as sellers, manage store locations, list products, track earnings, and fulfill campus orders.
* **Executive Administrative Console:** Role-gated (`isAdmin`) operations portal strictly adhering to Cartly's architectural minimalism. Offers platform-wide GMV & order metrics, logistics status controls, global catalog curation, and user account management.

---

## 🏗️ The Engine Room (Tech Stack)

Cartly is built on a decoupled full-stack architecture prioritizing component reusability, secure auth, and clean data contracts.

### Client-Side (Frontend)
* **Framework:** React 19 (SPA) with Vite 8 (Ultra-fast HMR and production bundling)
* **Styling:** Tailwind CSS v4 with custom `@theme` typography variables
* **Routing:** React Router DOM v7
* **State Management:** React Context API (`AuthContext`, `CartContext`)
* **Typography:** Lora (Serif Display) & DM Sans (Functional Sans)

### Server-Side (Backend & Database)
* **Framework:** Django 5.x & Django REST Framework (DRF)
* **Database:** MongoDB (Cloud Atlas or Local) accessed directly via PyMongo
* **Security & Auth:** Django password hashers (`make_password`, `check_password`) + TimestampSigner session tokens
* **CORS:** `django-cors-headers`

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Service health status string | No |
| `GET` | `/api/health` | JSON health check (`{"status": "OK"}`) | No |
| `GET` | `/api/products` | Retrieves all catalog products formatted with `₹` | No |
| `POST` | `/api/products` | Adds a new product item with payload validation | No |
| `POST` | `/api/auth/register` | Registers a new student account (`name`, `email`, `password`) | No |
| `POST` | `/api/auth/login` | Authenticates credentials and returns a session token | No |
| `GET` | `/api/auth/me` | Fetches active user profile from `Bearer <token>` | Yes |
| `PUT` | `/api/auth/profile` | Updates user profile and default campus delivery address | Yes |
| `GET` | `/api/orders/` | Fetches student order history (filtered by user or email) | Optional |
| `POST` | `/api/orders/` | Places a new order with address and COD payment | Optional |
| `POST` | `/api/seller/onboard` | Onboards authenticated user as a campus seller | Yes |
| `GET` | `/api/seller/dashboard` | Returns seller sales metrics and recent customer orders | Yes |
| `GET` | `/api/seller/products` | Lists products uploaded by this seller | Yes |
| `POST` | `/api/seller/products` | Publishes a new product item into the live catalog | Yes |
| `DELETE`| `/api/seller/products/<id>` | Deletes a listing owned by this seller | Yes |
| `GET` | `/api/seller/orders` | Retrieves orders to fulfill for this seller | Yes |
| `PATCH`| `/api/seller/orders/<id>/status`| Updates order fulfillment status (Preparing/Delivered) | Yes |
| `POST` | `/api/admin/login` | Authenticates administrator credentials defined in `.env` | No |
| `GET` | `/api/admin/me` | Validates active administrative session token | Admin |
| `GET` | `/api/admin/metrics` | Platform overview KPIs (GMV, volume, essentials, users) | Admin |
| `GET` | `/api/admin/orders` | System-wide order logs across all campus sellers | Admin |
| `PATCH`| `/api/admin/orders/<id>/status` | Overrides or updates order fulfillment lifecycle status | Admin |
| `GET` | `/api/admin/products` | System-wide catalog inventory items with seller origins | Admin |
| `POST` | `/api/admin/products` | Publishes platform essentials directly into master catalog | Admin |
| `DELETE`| `/api/admin/products/<id>` | Drops any product item from the active database | Admin |
| `GET` | `/api/admin/users` | Directory of student users, sellers, and admin accounts | Admin |

---

## 💻 Developer Setup & Running Locally

### Prerequisites
* **Python** (3.10+ recommended, tested on Python 3.14)
* **Node.js** (v18+ recommended, tested on Node v24)
* **MongoDB** (Local instance on port `27017` or a MongoDB Atlas URI)

---

### Option A: Unified 1-Command Start (Recommended)
You can boot both the Django backend and Vite frontend concurrently with a single command from the project root:

```bash
npm run dev
```

Alternatively on Windows, double-click:
```bash
start-dev.bat
```

Both servers will start concurrently:
* 🌐 **Frontend (React + Vite):** [http://localhost:5173](http://localhost:5173)
* ⚙️ **Backend API (Django):** [http://localhost:5000](http://localhost:5000)

---

### Option B: Quick Start (Separate Windows)
Cartly includes convenience scripts in the repository root:
1. Double-click `start-backend.bat` to activate the virtual environment and boot the Django API on port `5000`.
2. Double-click `start-frontend.bat` to launch the Vite development server on port `5173`.
3. Open your browser at [http://localhost:5173](http://localhost:5173).

---

### Option C: Manual Setup

#### 1. Backend Setup (Django)
```powershell
cd django_backend

# 1. Create and activate a virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment variables (if not already present)
# Ensure django_backend/.env contains your MongoDB connection:
# MONGO_URI=mongodb://127.0.0.1:27017/cartly
# MONGO_DATABASE=cartly
# MONGO_COLLECTION=products

# 4. (Optional) Seed the catalog with 20 essentials
python manage.py bootstrap_products

# 5. Start the backend server
python manage.py runserver 5000
```
> The API will be active at `http://localhost:5000`.

#### 2. Frontend Setup (React + Vite)
In a second terminal:
```powershell
cd frontend

# 1. Install dependencies
npm install

# 2. Verify environment linking
# Ensure frontend/.env contains:
# VITE_API_URL=http://localhost:5000

# 3. Launch Vite development server
npm run dev
```
> Open [http://127.0.0.1:5173](http://127.0.0.1:5173) in your browser.

---

## 🚀 The Roadmap
1. **💳 Live Payment Gateway:** Integrate Razorpay / UPI intent to complete the instant digital checkout lifecycle.
2. **⭐ Wishlist & Save for Later:** Allow students to pin items to their personal dorm room wishlist.
3. **🔔 Real-time Notifications:** Web push alerts for order dispatch, arrival at campus gates, and stock alerts.
