# Udemy API Integration Setup Guide

This guide will walk you through setting up the Udemy API to fetch courses dynamically.

## Step 1: Get Udemy API Credentials

1. **Go to Udemy API Settings**
   - Visit: https://www.udemy.com/user/edit-api-clients/
   - You need to be logged into your Udemy account

2. **Create a New API Client**
   - Click "Create a new API client" or similar button
   - Fill in the required information:
     - **Name**: Your application name (e.g., "Yatri Practice Hub")
     - **Description**: Brief description of your app
   - Submit the form

3. **Copy Your Credentials**
   - After creating, you'll see:
     - **Client ID**: A long string of characters
     - **Client Secret**: Another long string of characters
   - **Important**: Copy these immediately - you won't be able to see the secret again!

## Step 2: Set Up Environment Variables

1. **Create a `.env` file** in the root of your project (same level as `package.json`)

2. **Add your credentials**:
   ```env
   VITE_UDEMY_CLIENT_ID=your_client_id_here
   VITE_UDEMY_CLIENT_SECRET=your_client_secret_here
   ```

3. **Important Notes**:
   - Never commit your `.env` file to git (it's already in `.gitignore`)
   - The `VITE_` prefix is required for Vite to expose these variables to your frontend
   - Restart your dev server after creating/updating `.env`

## Step 3: Install Dependencies (if needed)

The project already has all necessary dependencies. However, if you encounter issues, you may need:

```bash
npm install
# or
bun install
```

## Step 4: Update Your Components

The code has been set up to use the Udemy API. You have two options:

### Option A: Use the Hook (Recommended)

Update `src/components/CoursesSection.tsx` to use the `useUdemyCourses` hook:

```tsx
import { useUdemyCourses } from '@/hooks/use-udemy-courses';

export const CoursesSection = () => {
  const { courses, isLoading, error } = useUdemyCourses();
  // ... rest of your component
};
```

### Option B: Fetch on Demand

You can also fetch courses manually:

```tsx
import { fetchAllUdemyCourses } from '@/lib/udemy-api';

const loadCourses = async () => {
  const courses = await fetchAllUdemyCourses();
  // Use courses...
};
```

## Step 5: Test the Integration

1. **Start your development server**:
   ```bash
   npm run dev
   # or
   bun dev
   ```

2. **Check the browser console** for any errors

3. **Verify courses are loading** - You should see courses fetched from Udemy

## Troubleshooting

### Error: "Udemy API credentials not found"
- Make sure your `.env` file exists in the root directory
- Verify the variable names start with `VITE_`
- Restart your dev server after creating/updating `.env`

### Error: "Udemy API error: 401"
- Your credentials are incorrect or expired
- Double-check your Client ID and Client Secret
- Make sure there are no extra spaces in your `.env` file

### Error: "Udemy API error: 403"
- Your API client may not have the necessary permissions
- Check your Udemy account settings
- You may need to request API access from Udemy

### CORS Errors
- Udemy API may block direct browser requests
- Consider creating a backend proxy server
- Or use a service like CORS Anywhere (for development only)

### Rate Limiting
- Udemy API has rate limits
- If you hit the limit, wait a few minutes before retrying
- Consider implementing caching

## API Limitations

- **Rate Limits**: Udemy API has rate limits. Don't make too many requests too quickly.
- **Data Available**: Not all course data may be available through the API
- **Authentication**: Requires valid API credentials
- **CORS**: May require a backend proxy for production use

## Alternative: Backend Proxy (Recommended for Production)

For production, it's recommended to create a backend API that:
1. Stores your Udemy credentials securely (server-side only)
2. Fetches courses from Udemy API
3. Serves them to your frontend

This prevents exposing your API credentials in the frontend code.

## Next Steps

1. ✅ Get Udemy API credentials
2. ✅ Create `.env` file with credentials
3. ✅ Update components to use the hook
4. ✅ Test the integration
5. ⚠️ Consider backend proxy for production

## Support

If you encounter issues:
1. Check the browser console for detailed error messages
2. Verify your API credentials are correct
3. Check Udemy's API documentation: https://www.udemy.com/developers/
4. Ensure your API client is active in your Udemy account

