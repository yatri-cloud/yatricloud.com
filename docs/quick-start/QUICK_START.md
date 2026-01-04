# Quick Start: Fetching Courses from Udemy API

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Udemy API Credentials

**Option A: Instructor API Token (Easiest - You have this!)**
1. You already have your token: `YrCJK4kzRFSoPjB3tRQLBpEL7LLQOzC7`
2. Create `.env` file with:
   ```env
   VITE_UDEMY_INSTRUCTOR_TOKEN=YrCJK4kzRFSoPjB3tRQLBpEL7LLQOzC7
   ```
3. ✅ Done! This fetches YOUR courses.

**Option B: Client ID/Secret (Alternative)**
1. Go to: https://www.udemy.com/user/edit-api-clients/
2. Click "Create a new API client"
3. Copy your **Client ID** and **Client Secret**
4. Create `.env` file with:
   ```env
   VITE_UDEMY_CLIENT_ID=your_client_id_here
   VITE_UDEMY_CLIENT_SECRET=your_client_secret_here
   ```

### Step 2: Create `.env` File
Create a file named `.env` in the root directory with your credentials (see Step 1 above).

### Step 3: Choose Your Approach

#### Option A: Direct API (Simple, but exposes credentials)
The code is already set up! Just:
1. Add your credentials to `.env`
2. Restart your dev server
3. The `CoursesSectionWithAPI.tsx` component will fetch courses automatically

#### Option B: Backend Proxy (Recommended for production)
1. Use the `backend-proxy-example.js` file
2. Install: `npm install express cors dotenv`
3. Run: `node backend-proxy-example.js`
4. Update frontend to call your proxy endpoint

### Step 4: Update Your Component

**To use the API version**, replace the import in `src/pages/Index.tsx`:

```tsx
// Change from:
import { CoursesSection } from "@/components/CoursesSection";

// To:
import { CoursesSection } from "@/components/CoursesSectionWithAPI";
```

Or rename the files:
- `CoursesSection.tsx` → `CoursesSectionStatic.tsx` (backup)
- `CoursesSectionWithAPI.tsx` → `CoursesSection.tsx`

## 📁 Files Created

1. **`src/lib/udemy-api.ts`** - Core API functions
2. **`src/hooks/use-udemy-courses.ts`** - React hook for fetching courses
3. **`src/components/CoursesSectionWithAPI.tsx`** - Component using API
4. **`backend-proxy-example.js`** - Backend proxy server example
5. **`UDEMY_API_SETUP.md`** - Detailed setup guide

## 🔧 Usage Examples

### Using the Hook
```tsx
import { useUdemyCourses } from '@/hooks/use-udemy-courses';

function MyComponent() {
  const { courses, isLoading, error } = useUdemyCourses({
    search: 'AWS',
    category: 'Cloud Computing',
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{courses.map(c => <div key={c.id}>{c.title}</div>)}</div>;
}
```

### Direct API Call
```tsx
import { fetchAllUdemyCourses } from '@/lib/udemy-api';

const loadCourses = async () => {
  const courses = await fetchAllUdemyCourses('AWS', 'Cloud Computing');
  console.log(courses);
};
```

## ⚠️ Important Notes

1. **Never commit `.env` file** - It contains sensitive credentials
2. **Restart dev server** after creating/updating `.env`
3. **Rate limits** - Don't make too many requests too quickly
4. **CORS issues** - May need backend proxy for production
5. **API access** - You need an active Udemy account with API access

## 🐛 Troubleshooting

**"Credentials not found" error?**
- Check `.env` file exists in root directory
- Verify variable names start with `VITE_`
- Restart your dev server

**401 Unauthorized?**
- Double-check your Client ID and Secret
- Make sure no extra spaces in `.env` file

**CORS errors?**
- Use the backend proxy example
- Or use a CORS proxy (development only)

## 📚 Next Steps

1. Read `UDEMY_API_SETUP.md` for detailed instructions
2. Test with a few courses first
3. Implement caching to reduce API calls
4. Set up backend proxy for production

## 🆘 Need Help?

- Check browser console for detailed errors
- Verify credentials at: https://www.udemy.com/user/edit-api-clients/
- Review Udemy API docs: https://www.udemy.com/developers/

