# Shreeram Construction Management System (CMS)

A full-stack Enterprise Resource Planning (ERP) and Management application designed specifically for construction site operations. The system helps project managers and administrators seamlessly track multiple construction projects, manage daily labor logs and attendance, monitor material stock levels/usage, and record financial ledger transactions (income vs. expense).

---

## 🚀 Key Features

*   **📊 Dynamic Dashboard**: Instantly view key metrics like total construction budget, total revenue/incomes, labor wage liability, material expenses, and real-time worker attendance counts. Includes interactive Recharts charts showing worker attendance distributions and monthly cash flows.
*   **🏗️ Project Portfolio Management**: Track project parameters including client names, total budgets, location details, timeline dates (start/end), status (Planning, Active, Completed, On Hold), and chronological activity logs.
*   **👷 Labor & Attendance Tracker**: Register workers, define their roles and standard daily wages, log daily attendance (Present, Absent, Half Day, Overtime), calculate wages automatically with pre-set multipliers, and track individual worker payouts (Paid vs. Pending).
*   **🧱 Inventory & Material Distribution**: Real-time stock status monitoring with low-stock warning thresholds. Maintain material usage logs tracking which project utilized what quantity of resources, along with the distribution value.
*   **💰 Financial Ledger**: Log incomes (payments received from clients) and general site expenses (transportation, machine rentals, material purchases, etc.) with support for payment categories and payment modes (UPI, Cash, Bank Transfer).
*   **⚡ Smart Fallback / Offline-First Cache**: Includes a dual-mode service architecture on the frontend. If the Node.js/Express backend server is offline or unreachable, the frontend automatically falls back to in-memory mock data to allow testing and demonstrations.

---

## 📁 Repository Structure

```text
.
├── backend/
│   ├── config/             # DB connection logic (MongoDB Mongoose configuration)
│   ├── models/             # Mongoose schemas (Finance, Material, Project, Worker, etc.)
│   ├── routes/             # Express API router (api.js containing all endpoints)
│   ├── .env                # Environment configuration parameters
│   ├── seed.js             # Database seeding script with realistic dummy data
│   ├── server.js           # Server initialization and Express middlewares
│   └── package.json        # Backend NPM package dependencies
│
├── database/
│   └── schema.sql          # Relational SQL schema reference (DDL and sample records)
│
└── frontend/
    ├── public/             # Static public assets
    ├── src/
    │   ├── assets/         # App stylesheets and images
    │   ├── components/     # Reusable layout and custom UI components
    │   ├── context/        # CMSContext handling state sync and backend-mock transitions
    │   ├── pages/          # Individual screen pages (Dashboard, Projects, Workers, Materials, etc.)
    │   ├── api.js          # Axios wrapper for REST backend integration
    │   ├── mockData.js     # Frontend local mock data fallback set
    │   └── main.jsx        # React application bootstrap entrypoint
    ├── package.json        # Frontend NPM package dependencies
    └── vite.config.js      # Vite compilation configurations
```

---

## 🛠️ Prerequisites

Before setting up the project, ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (v18.x or higher recommended)
*   [MongoDB](https://www.mongodb.com/) (either a local instance or a MongoDB Atlas cloud connection URI)

---

## ⚙️ Installation & Setup

Follow these steps to run the backend and frontend application locally:

### 1. Database & Backend Configuration

1. Navigate to the `backend/` directory:
    ```bash
    cd backend
    ```
2. Install npm dependencies:
    ```bash
    npm install
    ```
3. Set up the environment variables. Open the `.env` file in the `backend` folder and populate it with your port and MongoDB connection URI:
    ```env
    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=shreeram_construction_cms_secret_key_2026
    ```
4. Seed the database with realistic sample records (projects, workers, attendance records, materials, and finances) by running the seed script:
    ```bash
    node seed.js
    ```
5. Start the backend Express server:
    ```bash
    node server.js
    ```
    The backend server will run on `http://localhost:5000`.

### 2. Frontend Configuration & Execution

1. Navigate to the `frontend/` directory (open a new terminal window):
    ```bash
    cd frontend
    ```
2. Install npm dependencies:
    ```bash
    npm install
    ```
3. Start the Vite React development server:
    ```bash
    npm run dev
    ```
    The application will spin up and provide a URL (usually `http://localhost:5173`). Open this URL in your web browser.

---

## 🔑 Login Credentials

The application uses standard admin credentials for authentication:

*   **Username**: `admin`
*   **Password**: `admin123`

*(Note: Auth is verified on login to access the dashboard and client management workflows.)*
