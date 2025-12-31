# ✅ Udemy Instructor API - Complete Setup

Based on official documentation: https://www.udemy.com/developers/instructor/

## 📋 What's Configured

### ✅ Correct API Endpoint
- **Base URL**: `https://www.udemy.com/instructor-api/v1/taught-courses/courses/`
- **Authentication**: `Authorization: bearer {token}`
- **Method**: GET

### ✅ Proper Field Selection
Using `fields[course]` parameter as per API documentation:
- id, title, url, is_paid, price, price_detail
- visible_instructors, image_240x135, image_480x270
- headline, num_subscribers, avg_rating, num_reviews
- locale, created

### ✅ Pagination Support
- `page` parameter (default: 1)
- `page_size` parameter (default: 100, max: 100)

### ✅ Backend Proxy
- Handles CORS issues
- Keeps token secure on server
- Runs on: http://localhost:3001

## 🚀 How to Run

### Step 1: Start Proxy Server

```bash
npm run server
```

You should see:
```
✅ Udemy Instructor Token loaded
🚀 Udemy API Proxy Server running on http://localhost:3001
📚 Courses endpoint: http://localhost:3001/api/udemy/courses
```

### Step 2: Start Frontend

In another terminal:
```bash
npm run dev
```

### Step 3: Refresh Browser

Go to http://localhost:8080 and refresh. Courses will load!

## 🔍 API Request Example

The proxy server makes requests like:

```bash
GET https://www.udemy.com/instructor-api/v1/taught-courses/courses/?page=1&page_size=100&fields[course]=id,title,url,...
Authorization: bearer YrCJK4kzRFSoPjB3tRQLBpEL7LLQOzC7
```

## 📊 Response Structure

The API returns:
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 123456,
      "title": "Course Title",
      "url": "/course/...",
      "num_subscribers": 1000,
      "avg_rating": 4.8,
      ...
    }
  ]
}
```

## ✅ Verification

1. **Check Proxy Server**: http://localhost:3001/health
   - Should return: `{"status":"ok","tokenLoaded":true}`

2. **Check API Endpoint**: http://localhost:3001/api/udemy/courses
   - Should return course data (if server is running)

3. **Check Browser Console**:
   - Should see: "📡 Fetching courses from proxy"
   - Should see courses loading

## 🐛 Troubleshooting

### 401 Unauthorized
- Check token is correct in `.env`
- Verify token format: `bearer {token}` (server adds this automatically)

### 404 Not Found
- Make sure proxy server is running
- Check endpoint URL is correct

### Empty Results
- Verify you have published courses on Udemy
- Check your instructor account is active

### CORS Errors
- Proxy server should handle this
- Make sure proxy is running on port 3001

## 📚 Official Documentation

- **Instructor API**: https://www.udemy.com/developers/instructor/
- **Get Token**: https://www.udemy.com/instructor/account/api/

---

**Everything is now configured according to official Udemy Instructor API documentation! 🎉**

