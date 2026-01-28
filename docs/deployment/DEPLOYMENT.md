# Deployment Guide

## Deploy on Render (Free Tier)

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub (recommended)

### Step 2: Deploy Frontend
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `yatricloud/certification.yatricloud.com`
3. Configure:
   - **Name**: `certification-yatricloud` (or your choice)
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: Leave empty (or `.` if needed)
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run preview` (for Vite preview) or use a static server
   - **Environment**: `Node`

4. **Environment Variables** (Add in Render dashboard):
   ```
   NODE_ENV=production
   ```
   (Note: Frontend doesn't need Udemy tokens - those are for backend)

5. Click **"Create Web Service"**

### Step 3: Deploy Backend Proxy (Optional but Recommended)
Since your frontend calls `http://localhost:3001/api/udemy/courses`, you have two options:

#### Option A: Deploy Backend Separately
1. Create a new **Web Service** in Render
2. Configure:
   - **Name**: `certification-api`
   - **Root Directory**: Leave empty
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment**: `Node`

3. **Environment Variables**:
   ```
   UDEMY_INSTRUCTOR_TOKEN=your_yatharth_token
   UDEMY_INSTRUCTOR_TOKEN_NENSI=your_nensi_token
   PORT=3001
   ```

4. Update frontend API URL to use the backend service URL:
   - In `src/lib/udemy-api.ts`, change proxy URL to your Render backend URL

#### Option B: Use Vercel Serverless Functions (Alternative)
- Deploy frontend on Vercel
- Create API routes in `/api` folder for Udemy proxy

### Step 4: Update Frontend API URL
After deploying backend, update the frontend to use the backend URL:

1. In Render, get your backend service URL (e.g., `https://certification-api.onrender.com`)
2. Update `src/lib/udemy-api.ts`:
   ```typescript
   const proxyUrl = import.meta.env.VITE_API_URL || 'https://your-backend-url.onrender.com';
   ```
3. Add to Render frontend environment variables:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   ```

### Step 5: Custom Domain (Optional)
1. In Render dashboard → Settings → Custom Domains
2. Add: `certification.yatricloud.com`
3. Update DNS records as instructed by Render

---

## Deploy on Vercel (Alternative - Free Tier)

### Step 1: Deploy Frontend
1. Go to [vercel.com](https://vercel.com)
2. Import GitHub repository
3. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. Add environment variables (if needed)
5. Click **"Deploy"**

### Step 2: Backend (Vercel Serverless)
Create `/api/udemy/courses.ts` in your project for serverless functions.

---

## Deploy on Netlify (Alternative - Free Tier)

### Step 1: Deploy Frontend
1. Go to [netlify.com](https://netlify.com)
2. Connect GitHub repository
3. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Base directory**: Leave empty

4. Add environment variables
5. Click **"Deploy site"**

---

## Important Notes

1. **Backend Proxy**: Your frontend needs the backend proxy server running. Render's free tier spins down after 15 minutes of inactivity, so consider:
   - Using a paid tier for always-on backend
   - Using Vercel serverless functions
   - Using a different service for backend

2. **Environment Variables**: Never commit `.env` file. Add all secrets in the hosting platform's dashboard.

3. **CORS**: Make sure your backend allows requests from your frontend domain.

4. **Free Tier Limitations**:
   - **Render**: 15 min spin-down, 750 hours/month
   - **Vercel**: 100GB bandwidth, serverless functions
   - **Netlify**: 100GB bandwidth, 300 build minutes/month

---

## Quick Deploy Commands

### Render CLI (if installed)
```bash
render deploy
```

### Vercel CLI
```bash
npm i -g vercel
vercel
```

### Netlify CLI
```bash
npm i -g netlify-cli
netlify deploy --prod
```

