# 🎒 Cartly: The Modern Campus Survival Hub

> **Empowering student life, one essential at a time.**  
> Cartly is an editorial, full-stack e-commerce ecosystem purpose-built for campus students. From midnight study stationery to hostel room essentials and weekend trekking gear, Cartly delivers a frictionless, tactile shopping experience tailored for modern university life.

---

## 🌟 The Vision & Design Language

Living on campus comes with unique daily logistics. Cartly was engineered with an editorial, minimalist design language that fuses contemporary Japanese architectural restraint, print magazine typography (*Lora* + *DM Sans*), and an organic warm paper canvas (`#FAF9F6`).

* 🎨 **Full Design Specification**: See [design.md](design.md) for color tokens, typography scales, geometry rules, and motion curves.

---

## 🛍️ Curated Campus Categories

* **🩷 Hostel Essentials:** Non-negotiable daily drivers—laundry hampers, mattress toppers, storage cubes, and desk organizers.
* **📚 Stationery:** Hardcover ruled notebooks, precision gel pens, drafting tools, and highlighters.
* **🔌 Electronics:** Noise-cancelling headphones, scientific calculators, 20,000mAh power banks, and surge protectors.
* **🏕️ Trekking Essentials:** All-weather backpacks, insulated steel flasks, heavy-duty boots, and navigation multi-tools.

---

## 🏗️ The Engine Room (Tech Stack)

### Client-Side (Frontend)
* **Framework:** React 19 (SPA) with Vite 8
* **Styling:** Tailwind CSS v4 with custom `@theme` typography variables
* **Routing:** React Router DOM v7
* **State Management:** React Context API (`CartContext`)
* **Typography:** Lora (Serif Display) & DM Sans (Functional Sans)

### Server-Side (Backend & Database)
* **Framework:** Django 5.x & Django REST Framework (DRF)
* **Database:** MongoDB accessed directly via PyMongo
* **CORS:** `django-cors-headers`

---

## 💻 Developer Setup & Running Locally

### Option A: Quick Start (Windows)
1. Double-click `start-backend.bat` to boot Django API on port 5000.
2. Double-click `start-frontend.bat` to launch Vite on port 5173.
