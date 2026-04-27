# CableQuote-Pro
A fast, professional tool to create, manage, and generate industrial cable quotations for the company GM Industries.

## 🛠 Local Development Setup

**Prerequisites:**
- Node.js (v18 or higher recommended)
- PostgreSQL Database (e.g., Supabase)
- Git

### 1. Database Configuration
1. Obtain your PostgreSQL connection string from Supabase (or another provider).
2. It typically looks like: `postgresql://postgres:[password]@[host]:[port]/[db]?pgbouncer=true&connection_limit=1`.

### 2. Backend Setup (Root Directory)
The backend logic is situated in the root folder of this repository. Open your terminal in the root directory:
```bash
# 1. Install dependencies
npm install

# 2. Copy the sample environment file
cp .env.example .env

# 3. Update the .env file with your specific values (e.g., Database string)

# 4. Start the backend development server
npm run dev
```

### 3. Frontend Setup
The frontend react app is inside the `frontend` folder:
```bash
# 1. Navigate to frontend folder
cd frontend

# 2. Install frontend dependencies
npm install

# 3. Copy the sample local variables
cp .env.example .env

# 4. Start the frontend development server
npm run dev
```

---

## 🚀 Deployment Instructions

### Render Deployment (Backend)
1. Go to [Render Dashboard](https://dashboard.render.com).
2. Connect your GitHub repository and create a new **Web Service**.
3. Select Node environment.
4. Render will automatically detect the settings in `render.yaml`. If configured manually:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Go to the "Environment" tab and add the necessary variables:
   - `DATABASE_URL`: Add your PostgreSQL details.
   - `FRONTEND_URL`: Put your eventual Vercel deployment URL here.
   - `NODE_ENV`: Set to `production`.

### Vercel Deployment (Frontend)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard).
2. Create a new Project by importing this repository securely.
3. Once imported, ensure the **Root Directory** is configured correctly to the `frontend` folder.
4. Expand **Environment Variables** and add:
   - `VITE_API_URL`: Set this to your live Render backend URL.
5. Vercel will automatically use `vercel.json` and build your Vite setup. Deploy!

---

## 🐞 Debugging Guide

### Checking Logs
1. **Frontend (Vercel)**: Look at the "Logs" tab on a specific deployment inside the Vercel dashboard. It will show client build issues and console warnings.
2. **Backend (Render)**: Navigate to your specific web service in the dashboard. The built-in log viewer displays incoming requests, database warnings, or 500 server errors.

### Common Issues
1. **Network Tab "Failed to Fetch" Errors**: 
   - Cause: Usually CORS issues. 
   - Fix: Ensure `FRONTEND_URL` in Render matches *exactly* what your Vercel URL reads (no trailing slashes), and `VITE_API_URL` perfectly matches the backend URL on Vercel.
2. **Database Timeout/Connection Errors**: 
   - Cause: Postgres connection limiting. 
   - Fix: Be sure your database is healthy via Supabase. We utilize a serverless-safe pooling limit (`max: 20`) natively in Prisma config.
3. **Missing PDF Fonts or Content**:
   - Cause: Missing Chromium context.
   - Fix: `puppeteer-core` with `@sparticuz/chromium` is correctly hooked for production. Always specify `NODE_ENV=production` on Render to activate it gracefully.

---

## 📝 Testing Checklist

### Local Testing Before Deploying
- [ ] Backend runs via `npm run dev` in `/` on port 3000.
- [ ] Frontend runs via `npm run dev` in `/frontend/` on port 5173.
- [ ] Database connection functions appropriately locally.
- [ ] You can generate and download Quotation PDF documents.
- [ ] Form validations behave interactively.
- [ ] No CORS warnings generated on Chrome network tools.

### Production Environment Test
- [ ] Commits build cleanly on Vercel without JS typing issues.
- [ ] Commits spin up flawlessly on Render with backend `server.js`.
- [ ] Generate a PDF quotation on the live vercel link and observe Render logs to ensure a seamless headless-chrome output. 
- [ ] API routes process correctly with proper `GET` / `POST` capabilities.
