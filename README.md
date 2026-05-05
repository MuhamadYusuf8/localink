# Economic Survival 🌾

Economic Survival is an advanced, two-sided agricultural marketplace platform designed to connect local Indonesian farmers directly with retail and wholesale buyers. The platform cuts out the middleman, ensuring fairer prices for buyers and higher profit margins for farmers.

## Architecture

This project is structured as a **Monorepo** using Turborepo to efficiently manage dependencies, linting, and build pipelines across the frontend and backend.

### Tech Stack
- **Frontend (`apps/web`)**: Next.js 14 (App Router), React, Tailwind CSS, TypeScript, Zustand (State Management), React Hook Form + Zod, Recharts.
- **Backend (`apps/api`)**: Laravel 11, PostgreSQL 16 (or SQLite for local dev), Redis 7.
- **Infrastructure**: Docker Compose (Database, Redis, MailHog).

### Design System: "Premium Agrarian Dark"
The application utilizes a custom-built design system emphasizing a modern, trustworthy, and luxurious aesthetic:
- **Color Palette**: `dark-void` (#0a0c10), `emerald` (Primary success), `harvest/amber` (Wholesale highlights).
- **Typography**: `Bricolage Grotesque` for dynamic headings, `Inter` for clean body text.
- **Glassmorphism**: Subtle translucent backgrounds (`backdrop-blur`) and border highlights to create depth.

---

## Key Features

### 1. Advanced Authentication & RBAC
- Separate registration flows for **Farmers** (3-step wizard with GPS location) and **Buyers** (Retail vs Wholesale companies).
- Secure JWT/Sanctum based authentication synced to Next.js via Context/Zustand.

### 2. Farmer Dashboard & Inventory Management
- Real-time **Market Price Alignment Widget** comparing a farmer's set price against regional averages.
- Subscription-tier enforced product limits (Free, Basic, Pro).
- Complex SQL aggregated Dashboard for revenue tracking, growth percentages, and top product identification.

### 3. Public Catalog & Smart Cart
- High-performance product exploration with robust filtering (by category, province, pricing).
- Cart system that automatically detects and flags out-of-stock items or wholesale minimum quantity violations.

### 4. Multi-Farmer Checkout Engine
- Orders split automatically by farmer origin.
- Atomic stock decrements to prevent race conditions during checkout.
- Immutable order snapshots protecting historical records against product changes.
- Midtrans Payment Gateway Webhook integration prepared for automated state machine transitions.

---

## Getting Started (Local Development)

### Prerequisites
- Node.js (v18+)
- PHP 8.2+ & Composer
- Docker (optional, but recommended for PostgreSQL & Redis)

### 1. Setup Backend (Laravel API)
```bash
cd apps/api
cp .env.example .env
# Edit .env to set DB_CONNECTION=sqlite or use docker setup
touch database/database.sqlite
composer install
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve --port=8000
```
*(The seed command will populate 5 demo farmers, 3 buyers, and sample products).*

### 2. Setup Frontend (Next.js Web)
```bash
cd apps/web
cp .env.example .env.local
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000` and will proxy requests to `http://localhost:8000/api/v1`.

### Demo Credentials
- **Admin**: `admin@economic-survival.id` | `admin_secure_123`
- **Farmer (Pro)**: `budi@petani.test` | `password123`
- **Buyer (Wholesale)**: `restoran@buyer.test` | `password123`

---

## Monorepo Commands
From the root directory, you can utilize Turborepo commands:
- `npm run dev` - Starts all development servers in parallel.
- `npm run build` - Builds all applications caching unchanged outputs.
- `npm run lint` - Runs ESLint across all workspaces.

---

*Designed and engineered for maximum economic survival.*
