# QuickFix Grocery (`no-delivery`) 🛒⚡

**QuickFix Grocery** is a comprehensive, full-stack Quick-Commerce Grocery Order Fulfillment & Delivery Platform built with React, Vite, Node.js/Express, and PostgreSQL / Supabase.

The system manages the end-to-end grocery order lifecycle—from customer catalog selection and cart checkout with substitution preferences, to dark-store picker fulfillment, live delivery partner dispatch, and admin operational analytics.

---

## 🌟 Key Features & Role Workspaces

QuickFix Grocery provides dedicated role-based workspaces for all stakeholders in the order fulfillment chain:

### 🛍️ 1. Customer Workspace
* **Store & Catalog Browsing**: Browse available items, filter by categories, and manage shopping carts across dark store locations.
* **Smart Item Substitution Preferences**: Set substitution strategies per item (`ask` customer first, `auto`-substitute, or `skip` if unavailable).
* **Live Order Lifecycle Tracking**: Real-time order status updates from placement, picking, replacement approval, to final delivery.
* **Interactive Substitution Review**: Receive real-time prompts when items are out-of-stock and approve/reject proposed replacements within a 15-second response window.
* **Issue Reporting**: Submit post-delivery issues (missing items, damaged goods, quality concerns).

### 📦 2. Store Picker Workspace
* **Batch & Active Picking Runs**: Pickers receive orders assigned to their dark store location and process item checklists.
* **Item State Machine Operations**: Mark items as `found`, `not_found`, or trigger customer substitution requests (`awaiting_customer`).
* **Substitution Suggestions**: Select and submit suggested alternative items for customer approval.
* **Real-time Lifecycle Transitions**: Update order status dynamically as picking completes.

### 🚚 3. Delivery Partner Workspace
* **Job Board & Offer Acceptance**: View pending delivery jobs, distance metrics, and accept route assignments.
* **Step-by-Step Delivery Tracking**: Update status across stages: `assigned` → `picked_up` → `en_route` → `delivered`.
* **Earnings & Metrics**: Track completed deliveries, total payout, and customer ratings.

### 📊 4. Admin Dashboard
* **Network & Store Analytics**: Monitor order volumes, active runs, fulfillment speeds, and dark store performance.
* **Operational Oversight**: View live delivery routes, active pickers, and system health metrics.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18/19, Vite, Tailwind CSS v4, Lucide React, Recharts, Canvas Confetti |
| **Backend** | Node.js, Express.js REST API |
| **Database** | PostgreSQL / Supabase DB, SQL Migrations |
| **Authentication** | JWT (JSON Web Tokens) with role-based access control (`customer`, `picker`, `delivery`, `admin`) |
| **Background Services**| Server-side Node.js cron scanner for 15-second substitution timer expiration |

---

## 📁 Project Structure

```text
no-delivery/
├── backend/
│   ├── controllers/      # Express route controllers (auth, customer, picker, delivery, admin, etc.)
│   ├── db/              # Database schema & migrations (SQL DDL & scripts)
│   ├── lib/             # Supabase client & DB connection helper
│   ├── middleware/      # JWT authentication & authorization middleware
│   ├── routes/          # API route definitions (/api/*)
│   ├── scripts/         # Seed data, table inspection & DDL migration execution scripts
│   ├── services/        # Background services (timer expiry scanner)
│   └── server.js        # Main Express server entry point (Port 5001)
├── frontend/
│   ├── src/
│   │   ├── components/  # Role-specific UI components (Customer, Picker, Delivery, Admin)
│   │   ├── context/     # AuthContext & OrderContext React context providers
│   │   ├── pages/       # Workspace page views (Home, PickerRun, DeliveryPortal, AdminDashboard)
│   │   ├── services/    # API client utilities
│   │   ├── App.jsx      # Main application routing & workspace shell
│   │   └── main.jsx     # Vite entry point
│   ├── index.html       # Single Page Application HTML shell
│   └── vite.config.js   # Vite bundler configuration
├── docs/                # Architecture notes, API contracts, stakeholder needs
├── api_contract.md      # Full Frontend ↔ Backend API Contract specification
├── package.json         # Root configuration & scripts
└── README.md            # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v18.x or higher)
* [npm](https://www.npmjs.com/) (v9.x or higher)
* A [Supabase](https://supabase.com/) project or local PostgreSQL instance

---

### Setup Instructions

#### 1. Clone the repository & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/Sweekk/no-delivery.git
cd no-delivery

# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

#### 2. Environment Configuration

Create a `.env` file in the project root (or inside `backend/`):

```env
PORT=5001
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
JWT_SECRET=your-secure-jwt-secret
JWT_EXPIRES_IN=7d
```

#### 3. Database Migration & Seeding

Run the database migration and demo seed scripts to populate initial stores, items, and users:

```bash
# Seed initial demo data (stores, products, demo users)
node backend/scripts/seed-demo-data.js

# (Optional) Run SQL migrations if needed
node backend/scripts/run-migration-04.js
```

---

## 🏃 Running the Application

### 1. Start the Backend API Server

```bash
cd backend
npm run dev
```
* The backend API server will run on `http://localhost:5001`.
* The server automatically initializes the 15-second server-side substitution timer scanner.

### 2. Start the Frontend Development Server

Open a new terminal tab/window and run:

```bash
cd frontend
npm run dev
```
* The Vite frontend dev server will launch at `http://localhost:5173`.

---

## 🔄 Core Workflow & Product Mappings

### Product ID Mapping
The React frontend handles user-friendly product codes (`APPLE-FUJI-01`, `MILK-GAL-02`), which the backend transparently translates to UUIDs (`a0000000-0000-0000-0000-000000000001`) in PostgreSQL:

| Code | Item Name |
| :--- | :--- |
| `APPLE-FUJI-01` | Fuji Apples (1 lb) |
| `MILK-GAL-02` | Whole Milk (1 Gallon) |
| `BANANA-ORG-03` | Organic Bananas (1 Bunch) |
| `BREAD-WW-04` | Whole Wheat Bread |
| `CEREAL-BOX-05` | Honey Nut Cereal Box |
| `EGGS-DOZ-06` | Large Grade A Eggs (1 Dozen) |

### Item Status State Machine
```text
pending  ──►  found          (Picker locates item in store)
         ──►  not_found      (Picker marks missing; sub strategy = skip/auto)
         ──►  awaiting_customer (Picker requests substitute approval; sub strategy = ask)

awaiting_customer ──► not_found (Customer chooses skip or timer expires)
                  ──► replaced  (Customer approves suggested replacement)
```

---

## 📑 Documentation Links

* [API Contract Specification](file:///c:/Users/UJWAL/No-Delivery/no-delivery/api_contract.md) - Detailed request/response schemas for all backend endpoints.
* [Documentation Directory](file:///c:/Users/UJWAL/No-Delivery/no-delivery/docs/) - Architectural assumptions, stakeholder specifications, and notes.

---

## 📜 License

This project is created for demonstration and educational purposes.
