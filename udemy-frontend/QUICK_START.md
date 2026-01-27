# Quick Start Guide - Udemy YatriCloud Frontend

## Installation & Running (30 seconds)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# Copy example env file
cp .env.example .env.local

# Edit and set your API URL
# VITE_API_BASE_URL=http://localhost:5000
```

### 3. Start Development Server
```bash
npm run dev
```

Open **http://localhost:3001** in your browser ✅

---

## 📖 What's Included?

✨ **Ready-to-use Pages:**
- Home page with hero section
- Course listing & filtering
- Course detail page
- Add new course form
- Checkout/Payment flow
- User dashboard
- Profile management

🎨 **Modern UI:**
- Responsive design
- Dark/Light mode toggle
- Tailwind CSS styling
- Shadcn UI components

🔗 **Backend Integration:**
- API client pre-configured
- Authentication context
- Error handling
- Axios with interceptors

---

## 🚀 Next Steps

1. **Update API endpoints** in `src/lib/api.ts` if needed
2. **Add your backend URL** in `.env.local`
3. **Customize components** to match your branding
4. **Deploy to Vercel** (1 click from GitHub)

---

## 📂 Important Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main app with routes |
| `src/lib/api.ts` | API client & endpoints |
| `src/contexts/AuthContext.tsx` | Auth state management |
| `.env.example` | Environment variables |
| `tailwind.config.ts` | Theme customization |

---

## 🔧 Build Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run preview    # Preview built app
npm run lint       # Check code quality
```

---

## 🎯 For Production Deployment

1. Set environment variables in Vercel/hosting platform
2. Run `npm run build` to test locally
3. Push to GitHub and connect to Vercel
4. Vercel will auto-deploy on each push

---

**Need Help?** See SETUP_GUIDE.md for detailed documentation.
