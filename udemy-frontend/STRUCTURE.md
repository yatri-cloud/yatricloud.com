# Udemy Frontend - Project Structure Tree

```
udemy-frontend/
│
├── 📁 src/
│   ├── 📁 components/
│   │   ├── 📁 ui/
│   │   │   ├── button.tsx           ⭐ Button component
│   │   │   ├── input.tsx            ⭐ Input field component
│   │   │   ├── label.tsx            ⭐ Form label component
│   │   │   ├── select.tsx           ⭐ Select dropdown component
│   │   │   ├── tooltip.tsx          💡 Tooltip component
│   │   │   ├── toaster.tsx          🔔 Toast notifications
│   │   │   └── sonner.tsx           🔔 Sonner notifications
│   │   │
│   │   ├── 📁 sections/
│   │   │   └── Footer.tsx           📋 Page footer
│   │   │
│   │   ├── 📁 udemy/
│   │   │   └── (udemy-specific components)
│   │   │
│   │   ├── Navbar.tsx               🧭 Navigation bar
│   │   └── ThemeProvider.tsx        🎨 Dark/Light mode
│   │
│   ├── 📁 pages/
│   │   ├── Index.tsx                🏠 Home page
│   │   ├── CoursesPage.tsx          📚 Course listing
│   │   ├── CourseDetail.tsx         📖 Course details
│   │   ├── AddCourse.tsx            ➕ Add course form
│   │   ├── Checkout.tsx             💳 Payment page
│   │   ├── Dashboard.tsx            👤 User dashboard
│   │   ├── EditProfile.tsx          ⚙️ Profile page
│   │   ├── PrivacyPolicy.tsx        📋 Privacy page
│   │   ├── TermsOfService.tsx       📋 Terms page
│   │   └── NotFound.tsx             ❌ 404 page
│   │
│   ├── 📁 contexts/
│   │   └── AuthContext.tsx          🔐 Authentication
│   │
│   ├── 📁 hooks/
│   │   └── use-toast.ts             🔔 Toast hook
│   │
│   ├── 📁 lib/
│   │   ├── api.ts                   🔗 API client
│   │   └── utils.ts                 🛠️ Utilities
│   │
│   ├── 📁 data/
│   │   └── (constants & static data)
│   │
│   ├── App.tsx                      🎯 Main app
│   ├── main.tsx                     ⚡ Entry point
│   ├── index.css                    🎨 Global styles
│   └── vite-env.d.ts                📝 Types
│
├── 📁 public/
│   └── (static assets)
│
├── 📄 index.html                    🌐 HTML template
├── 📄 package.json                  📦 Dependencies
├── 📄 tsconfig.json                 📝 TypeScript config
├── 📄 tsconfig.node.json            📝 Node TypeScript config
├── 📄 tsconfig.app.json             📝 App TypeScript config
├── 📄 vite.config.ts                ⚙️ Build config
├── 📄 tailwind.config.ts            🎨 Theme config
├── 📄 postcss.config.js             🎨 PostCSS config
├── 📄 eslint.config.js              ✅ Linting config
├── 📄 .prettierrc                   📐 Code format
├── 📄 .prettierignore               📐 Format ignore
├── 📄 .gitignore                    🚫 Git ignore
├── 📄 .env.example                  🔑 Env template
├── 📄 .env.local                    🔑 Local env vars
│
├── 📄 README.md                     📖 Project README
├── 📄 QUICK_START.md                ⚡ Quick setup guide
├── 📄 SETUP_GUIDE.md                📚 Detailed docs
├── 📄 vercel.json                   🚀 Vercel config
│
└── 📄 STRUCTURE.md                  📋 This file
```

## 🎯 Component Hierarchy

```
App
├── ThemeProvider
│   └── QueryClientProvider
│       └── TooltipProvider
│           └── BrowserRouter
│               ├── Routes
│               │   ├── Index
│               │   │   ├── Navbar
│               │   │   ├── Hero Section
│               │   │   ├── Stats Section
│               │   │   ├── Featured Courses
│               │   │   └── Footer
│               │   │
│               │   ├── CoursesPage
│               │   │   ├── Navbar
│               │   │   ├── Search & Filters
│               │   │   ├── Course Grid
│               │   │   └── Footer
│               │   │
│               │   ├── CourseDetail
│               │   │   ├── Navbar
│               │   │   ├── Course Info
│               │   │   ├── Course Sidebar
│               │   │   └── Footer
│               │   │
│               │   ├── AddCourse
│               │   │   ├── Navbar
│               │   │   ├── Course Form
│               │   │   └── Footer
│               │   │
│               │   ├── Checkout
│               │   │   ├── Navbar
│               │   │   ├── Order Summary
│               │   │   ├── Payment Form
│               │   │   └── Footer
│               │   │
│               │   ├── Dashboard
│               │   │   ├── Navbar
│               │   │   ├── Profile Card
│               │   │   ├── Enrolled Courses
│               │   │   └── Footer
│               │   │
│               │   ├── EditProfile
│               │   │   ├── Navbar
│               │   │   ├── Profile Form
│               │   │   └── Footer
│               │   │
│               │   ├── PrivacyPolicy
│               │   ├── TermsOfService
│               │   └── NotFound
│               │
│               └── Toaster
```

## 📊 API Structure

```
API Client (apiClient - Axios instance)
│
├── courseAPI
│   ├── getAll(filters)
│   ├── getById(id)
│   ├── create(data)
│   ├── update(id, data)
│   ├── delete(id)
│   └── search(query)
│
├── userAPI
│   ├── getProfile()
│   ├── updateProfile(data)
│   ├── enrollCourse(courseId)
│   └── getEnrolledCourses()
│
├── authAPI
│   ├── login(email, password)
│   ├── register(email, password, name)
│   ├── logout()
│   └── verifyToken()
│
└── paymentAPI
    ├── createOrder(data)
    └── verifyPayment(data)
```

## 🔄 State Management

```
App State
│
├── Theme State (ThemeProvider)
│   └── localStorage: theme
│
├── Auth State (AuthContext)
│   ├── user: User | null
│   ├── isAuthenticated: boolean
│   ├── localStorage: auth_token, user_data
│   └── Methods: login, logout, updateUser
│
├── Server State (React Query)
│   ├── courses
│   ├── course details
│   ├── user profile
│   ├── enrolled courses
│   └── Auto caching & refetching
│
└── Component State (useState/useReducer)
    ├── Form data
    ├── Loading states
    ├── UI toggles
    └── Local filters
```

## 📁 File Organization Principles

**By Type (What we use):**
- `components/` - React components
- `pages/` - Page-level components
- `lib/` - Utilities and helpers
- `hooks/` - Custom React hooks
- `contexts/` - React contexts
- `data/` - Static data

**Benefits:**
- ✅ Clear organization
- ✅ Easy to locate files
- ✅ Scalable structure
- ✅ Matches industry standards

## 🚀 Quick Navigation

```
Want to...                          Go to...
────────────────────────────────────────────────────────
Add a new page                      src/pages/
Create a new component              src/components/
Add API endpoint                    src/lib/api.ts
Customize theme                     tailwind.config.ts
Change global styles                src/index.css
Manage authentication               src/contexts/AuthContext.tsx
Handle notifications                src/hooks/use-toast.ts
Add utility functions               src/lib/utils.ts
Configure build                     vite.config.ts
Set environment variables           .env.local
Deploy to Vercel                    vercel.json
```

---

**Created:** January 27, 2026
**Last Updated:** January 27, 2026
**Version:** 1.0.0
