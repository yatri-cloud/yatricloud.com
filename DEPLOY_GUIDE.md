# 🚀 Udemy Frontend - Deployment & Integration Guide

## 📍 Location
```
/Volumes/Yatri Cloud/org/Yatri Cloud/yatri-practice-hub/udemy-frontend/
```

---

## 🎯 What You Got

A **complete, separate web application** for Udemy YatriCloud platform with:
- ✅ 10+ pre-built pages
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Dark/Light mode
- ✅ User authentication system
- ✅ Course management
- ✅ Payment checkout flow
- ✅ User dashboard
- ✅ API integration ready
- ✅ Production-ready code
- ✅ TypeScript + React 18 + Vite

---

## ⚡ Quick Start (1 Minute)

```bash
cd udemy-frontend
npm install
cp .env.example .env.local
npm run dev
```

**Open:** http://localhost:3001 ✅

---

## 🔧 Configuration

### 1. Backend API Setup

Edit `.env.local`:
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_APP_NAME=Udemy YatriCloud
VITE_ENVIRONMENT=development
```

### 2. Backend API Endpoints Required

Your backend must provide:

```javascript
// COURSES
GET    /api/courses?category=cloud&tech=AWS
GET    /api/courses/:id
POST   /api/courses
PUT    /api/courses/:id
DELETE /api/courses/:id
GET    /api/courses/search?q=query

// USERS  
GET    /api/users/profile
PUT    /api/users/profile
GET    /api/users/enrolled-courses
POST   /api/users/enroll/:courseId

// AUTH
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/logout
GET    /api/auth/verify

// PAYMENTS
POST   /api/payments/order
POST   /api/payments/verify
```

---

## 📦 Build & Deployment

### Local Testing

```bash
npm run build         # Create production build
npm run preview       # Test production build locally
```

### Deploy to Vercel (Recommended)

**Option 1: GitHub Integration (Best)**
1. Push to GitHub: `git push origin main`
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your Git repository
5. Set environment variables:
   - `VITE_API_BASE_URL` = your production API URL
   - `VITE_APP_NAME` = Udemy YatriCloud
   - `VITE_ENVIRONMENT` = production
6. Deploy! (Auto-deploys on future pushes)

**Option 2: Vercel CLI**
```bash
npm i -g vercel
vercel
```

### Deploy Elsewhere

1. **Build:** `npm run build`
2. **Upload:** Upload contents of `dist/` folder
3. **Environment:** Set production env variables
4. **Domain:** Point your domain to the deployment

---

## 🎨 Page Structure

```
Home Page
├── Hero section with CTA buttons
├── Stats (500+ courses, 10K+ learners, 98% success)
└── Featured courses carousel

Courses Page
├── Search bar
├── Category & tech filters
└── Course grid with sorting

Course Detail
├── Course info & description
├── Enroll button
└── Course sidebar with price

Add Course
└── Course submission form

Checkout
├── Order summary
├── Billing details
└── Payment form

Dashboard
├── User profile card
└── Enrolled courses with progress

Edit Profile
└── User information form

Legal Pages
├── Privacy Policy
└── Terms of Service
```

---

## 🔐 Authentication Flow

```
User Visits App
    ↓
Check localStorage for auth token
    ↓
If token exists → Restore user session
If token missing → Show public pages
    ↓
User Clicks Login/Register
    ↓
Form submission to /api/auth/login or /api/auth/register
    ↓
Backend returns: { user, token }
    ↓
Store token & user in localStorage
    ↓
Redirect to dashboard
```

---

## 💳 Payment Integration

The checkout page is ready for payment gateway integration:

```typescript
// Currently simulated, integrate your payment provider:
// - Stripe
// - Razorpay
// - PayPal
// - Square

// API expects:
POST /api/payments/order
{
  courseId: string
  email: string
  fullName: string
  amount: number
}

Returns:
{
  success: boolean
  orderId: string
  paymentUrl?: string
}
```

---

## 📊 API Response Format

**Courses:**
```json
{
  "id": "uuid",
  "title": "AWS Fundamentals",
  "description": "...",
  "category": "cloud",
  "tech": "AWS",
  "creator": "yatharth-chauhan",
  "price": 99.99,
  "image": "https://...",
  "rating": 4.5
}
```

**User:**
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "avatar": "https://..."
}
```

**Auth Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... },
  "success": true
}
```

---

## 🔍 Testing Checklist

- [ ] Home page loads correctly
- [ ] Courses list displays and filters work
- [ ] Course detail page shows all info
- [ ] User can add a course
- [ ] Login/Register works
- [ ] Dashboard shows enrolled courses
- [ ] Dark/Light mode toggles
- [ ] Mobile responsive (test on phone)
- [ ] All links work correctly
- [ ] API calls are successful

---

## 📱 Responsive Testing

Test on all breakpoints:
```
Mobile:  375px (iPhone)
Tablet:  768px (iPad)
Desktop: 1920px (Desktop)
```

All pages are mobile-first responsive.

---

## 🚨 Common Issues & Fixes

### API 404 Error
```
❌ Error: 404 Not Found
✅ Fix: Check VITE_API_BASE_URL in .env.local
✅ Fix: Ensure backend is running
✅ Fix: Verify endpoint exists in backend
```

### CORS Error
```
❌ Error: Access-Control-Allow-Origin
✅ Fix: Backend must allow requests from frontend domain
✅ Fix: Configure CORS in backend
```

### Page Blank
```
❌ Error: Blank white page
✅ Fix: Check browser console for errors
✅ Fix: Restart dev server (npm run dev)
✅ Fix: Clear browser cache
```

### Styles Not Loading
```
❌ Error: No styles applied
✅ Fix: Check tailwind.config.ts paths
✅ Fix: Rebuild (npm run build)
✅ Fix: Clear node_modules (rm -rf node_modules && npm install)
```

---

## 🔄 CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run lint
      - run: npm run build
      - uses: vercel/actions/deploy@main
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

---

## 📈 Performance Optimization

### Bundle Analysis
```bash
npm install --save-dev vite-plugin-visualizer
```

### Deployment Checklist
- [ ] Environment variables set
- [ ] Build completes without errors
- [ ] No console errors or warnings
- [ ] Lighthouse score > 90
- [ ] Mobile-friendly test passes
- [ ] API endpoints verified
- [ ] Rate limiting configured
- [ ] Error logging enabled

---

## 🌐 Domain Setup

### For Vercel
1. Go to Vercel project settings
2. Add domain under "Domains"
3. Update DNS records with Vercel's nameservers
4. Wait for propagation (5-48 hours)

### Environment Variables (Production)
```
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_APP_NAME=Udemy YatriCloud
VITE_ENVIRONMENT=production
```

---

## 📚 Documentation Files

Inside `udemy-frontend/`:
- **QUICK_START.md** - 30-second setup
- **SETUP_GUIDE.md** - Detailed configuration
- **STRUCTURE.md** - File organization
- **README.md** - Project overview
- **INDEX.md** - Documentation hub
- **vercel.json** - Vercel config

---

## 🎓 Next Steps

1. **Configure Backend** - Create API endpoints
2. **Test Locally** - Run `npm run dev`
3. **Push to GitHub** - Version control
4. **Connect to Vercel** - Auto-deployment
5. **Set Up Domain** - Custom domain
6. **Monitor** - Set up error logging
7. **Scale** - Add more features

---

## 💬 Need Help?

**Files to Read:**
- Problems with setup? → [QUICK_START.md](udemy-frontend/QUICK_START.md)
- Want details? → [SETUP_GUIDE.md](udemy-frontend/SETUP_GUIDE.md)
- Understanding structure? → [STRUCTURE.md](udemy-frontend/STRUCTURE.md)

**Contact:**
- Email: support@yatricloud.com
- GitHub: [yatricloud/udemy.yatricloud.com](https://github.com/yatricloud/udemy.yatricloud.com)

---

## ✅ Summary

You have a **production-ready frontend** that:
- ✅ Works standalone as separate web app
- ✅ Integrates with any backend API
- ✅ Deploys to Vercel in 1 click
- ✅ Responds to all devices
- ✅ Supports dark mode
- ✅ Includes authentication
- ✅ Ready for payment integration
- ✅ TypeScript + Modern Stack

**Next:** `npm install && npm run dev` 🚀

---

*Version: 1.0.0 Complete*  
*Status: Production Ready ✅*  
*Last Updated: January 27, 2026*
