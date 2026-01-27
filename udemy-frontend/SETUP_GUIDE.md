# Udemy YatriCloud Frontend - Setup & Installation Guide

## 📋 Overview

This is a complete separate web application for the Udemy YatriCloud platform. It mirrors the design and structure of the certification.yatricloud.com project while providing a dedicated frontend for course management and enrollment.

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ installed
- npm or yarn package manager
- Git (for version control)

### Installation Steps

1. **Navigate to the project directory:**
   ```bash
   cd udemy-frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env.local
   ```

4. **Configure environment variables** in `.env.local`:
   ```
   VITE_API_BASE_URL=http://localhost:5000
   VITE_APP_NAME=Udemy YatriCloud
   VITE_ENVIRONMENT=development
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3001`

## 📁 Project Structure

```
udemy-frontend/
├── src/
│   ├── components/
│   │   ├── ui/                 # Shadcn UI components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── toaster.tsx
│   │   │   └── sonner.tsx
│   │   ├── udemy/              # Udemy-specific components
│   │   ├── sections/           # Page sections (Header, Footer)
│   │   ├── Navbar.tsx
│   │   ├── ThemeProvider.tsx
│   │   └── SEO.tsx
│   ├── pages/                  # Page components
│   │   ├── Index.tsx           # Home page
│   │   ├── CoursesPage.tsx     # Course listing
│   │   ├── CourseDetail.tsx    # Individual course page
│   │   ├── AddCourse.tsx       # Add new course form
│   │   ├── Checkout.tsx        # Payment checkout
│   │   ├── Dashboard.tsx       # User dashboard
│   │   ├── EditProfile.tsx     # Profile settings
│   │   ├── PrivacyPolicy.tsx
│   │   ├── TermsOfService.tsx
│   │   └── NotFound.tsx        # 404 page
│   ├── contexts/
│   │   └── AuthContext.tsx     # Authentication context
│   ├── hooks/
│   │   └── use-toast.ts        # Toast notification hook
│   ├── lib/
│   │   ├── api.ts              # API client and endpoints
│   │   └── utils.ts            # Utility functions
│   ├── data/                   # Static data and constants
│   ├── App.tsx                 # Main App component
│   ├── main.tsx                # Entry point
│   ├── index.css               # Global styles
│   └── vite-env.d.ts           # Vite environment types
├── public/                     # Static assets
├── index.html                  # HTML template
├── package.json
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS configuration
├── .env.example                # Environment variables template
├── .gitignore
├── README.md
└── SETUP_GUIDE.md             # This file
```

## 🔗 Backend API Configuration

The frontend is configured to connect to a backend API. Update the `VITE_API_BASE_URL` environment variable to point to your backend server.

### Supported API Endpoints

**Courses:**
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course by ID
- `POST /api/courses` - Create new course
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course
- `GET /api/courses/search?q=query` - Search courses

**Users:**
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/enrolled-courses` - Get enrolled courses
- `POST /api/users/enroll/:courseId` - Enroll in course

**Authentication:**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify auth token

**Payments:**
- `POST /api/payments/order` - Create payment order
- `POST /api/payments/verify` - Verify payment

## 🎨 Styling

The project uses:
- **Tailwind CSS** for utility-first styling
- **CSS Variables** for theming (dark/light mode)
- **Responsive Design** for mobile, tablet, and desktop

### Theme Configuration

Theme settings are stored in `tailwind.config.ts` and applied via CSS variables in `src/index.css`.

## 🔐 Authentication

The app includes an `AuthContext` for managing user authentication state. It automatically persists the auth token and user data in localStorage.

### Usage:
```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  // Use auth state and methods
}
```

## 📦 Build & Deployment

### Development Build
```bash
npm run build:dev
```

### Production Build
```bash
npm run build
```

### Preview Build
```bash
npm run preview
```

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Set environment variables in Vercel dashboard
4. Vercel will automatically deploy on each push

**Environment variables needed in Vercel:**
- `VITE_API_BASE_URL` - Your production API URL
- `VITE_APP_NAME` - Application name
- `VITE_ENVIRONMENT` - Set to `production`

## 🛠 Development

### Code Quality

**Run ESLint:**
```bash
npm run lint
```

### Adding New Pages

1. Create a new file in `src/pages/`
2. Add the route in `src/App.tsx`
3. Import and use the page component

Example:
```tsx
// src/pages/NewPage.tsx
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/sections/Footer";

const NewPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Page content */}
      <Footer />
    </div>
  );
};

export default NewPage;
```

### Adding New Components

1. Create a new file in `src/components/`
2. Use TypeScript for type safety
3. Follow the existing component structure

## 📱 Mobile Responsiveness

All components are built with mobile-first responsive design using Tailwind CSS breakpoints:
- Mobile: 320px - 639px
- Tablet: 640px - 1023px  (md:)
- Desktop: 1024px+ (lg:)

## 🔄 State Management

- **React Context** for authentication
- **React Query** for server state and API calls
- **useState/useReducer** for component-level state

## 🚨 Error Handling

The app includes error handling for:
- API failures
- Authentication errors
- Network timeouts
- Form validation errors

## 📚 Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [React Router](https://reactrouter.com/)
- [React Query](https://tanstack.com/query/latest)

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Use a different port
npm run dev -- --port 3002
```

### Environment Variables Not Loading
- Restart the development server
- Check that `.env.local` exists in the root directory
- Ensure variables are prefixed with `VITE_`

### API Connection Issues
- Verify `VITE_API_BASE_URL` is correct
- Check backend server is running
- Look for CORS errors in browser console

## 📞 Support

For issues or questions:
- Email: support@yatricloud.com
- GitHub Issues: [yatricloud/udemy.yatricloud.com](https://github.com/yatricloud/udemy.yatricloud.com)

## 📄 License

MIT License - See LICENSE file for details
