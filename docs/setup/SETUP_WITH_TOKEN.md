# Quick Setup with Instructor API Token

You have an **Instructor API Token**! This is the easiest way to get started.

## ✅ Step 1: Create `.env` File

Create a file named `.env` in the root of your project (same level as `package.json`):

```env
VITE_UDEMY_INSTRUCTOR_TOKEN=YrCJK4kzRFSoPjB3tRQLBpEL7LLQOzC7
```

**Important**: 
- Replace the token above with your actual token
- Never commit this file to git (it's already in `.gitignore`)
- Keep this token secret - it acts as you!

## ✅ Step 2: Restart Your Dev Server

After creating the `.env` file, restart your development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
# or
bun dev
```

## ✅ Step 3: Switch to API Version

You have two options:

### Option A: Rename Files (Recommended)
```bash
# Backup your current component
mv src/components/CoursesSection.tsx src/components/CoursesSectionStatic.tsx

# Use the API version
mv src/components/CoursesSectionWithAPI.tsx src/components/CoursesSection.tsx
```

### Option B: Update Import
In `src/pages/Index.tsx`, change:
```tsx
// From:
import { CoursesSection } from "@/components/CoursesSection";

// To:
import { CoursesSection } from "@/components/CoursesSectionWithAPI";
```

## 🎯 What Happens Next?

1. The component will automatically fetch **your courses** from Udemy
2. Courses will be displayed with loading states
3. Search and filtering will work automatically

## 🔍 What Courses Will Be Fetched?

With the **Instructor API Token**, you'll fetch:
- ✅ **Your own courses** that you've created/teach
- ✅ All courses you have access to as an instructor

This is different from the public API which fetches all Udemy courses.

## ⚠️ Important Security Notes

1. **Keep Your Token Secret**: This token acts as YOU on Udemy
2. **Don't Share It**: Anyone with this token can access your instructor account
3. **Don't Commit It**: Never push `.env` to git
4. **For Production**: Consider using a backend proxy to keep the token secure

## 🐛 Troubleshooting

### "Credentials not found" error?
- ✅ Check `.env` file exists in root directory
- ✅ Verify the variable name is exactly: `VITE_UDEMY_INSTRUCTOR_TOKEN`
- ✅ Make sure there are no spaces around the `=` sign
- ✅ Restart your dev server

### "401 Unauthorized" error?
- ✅ Double-check your token is correct
- ✅ Make sure there are no extra spaces or quotes in `.env`
- ✅ Verify the token hasn't been revoked

### No courses showing?
- ✅ Check browser console for errors
- ✅ Verify you have courses in your Udemy instructor account
- ✅ Try accessing Udemy directly to confirm your account is active

## 🚀 You're Ready!

That's it! Your courses should now load automatically from Udemy.

---

**Next Steps:**
- Test the integration
- Customize the course display
- Consider adding caching for better performance
- For production, set up a backend proxy (see `backend-proxy-example.js`)

