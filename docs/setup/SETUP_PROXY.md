# 🚀 Setup Backend Proxy to Fix CORS Error

The CORS error is happening because Udemy's API doesn't allow direct browser requests. We need a backend proxy server.

## ✅ Quick Setup (3 Steps)

### Step 1: Install Dependencies

```bash
npm install express cors dotenv
# or
bun add express cors dotenv
```

### Step 2: Start the Proxy Server

In a **new terminal window**, run:

```bash
npm run server
# or
node server.js
```

You should see:
```
🚀 Udemy API Proxy Server running on http://localhost:3001
📚 Courses endpoint: http://localhost:3001/api/udemy/courses
```

### Step 3: Start Your Frontend (in another terminal)

```bash
npm run dev
```

## 🎯 What Happens Now

1. **Backend Proxy** (port 3001) - Handles API calls to Udemy
2. **Frontend** (port 8080) - Calls the proxy instead of Udemy directly
3. **No CORS errors** - Proxy server makes the API call (no browser restrictions)

## 📝 Files Created

- **`server.js`** - Backend proxy server
- **`.env`** - Updated with `UDEMY_INSTRUCTOR_TOKEN` for server

## 🔍 Verify It's Working

1. Check proxy server is running: http://localhost:3001/health
2. Check frontend: http://localhost:8080
3. Courses should load without CORS errors!

## 🛠️ Running Both Servers

### Option 1: Two Terminal Windows (Recommended)

**Terminal 1:**
```bash
npm run server
```

**Terminal 2:**
```bash
npm run dev
```

### Option 2: Single Command (if you have concurrently)

```bash
npm install -g concurrently
npm run dev:all
```

## 🐛 Troubleshooting

### "Cannot find module 'express'"
```bash
npm install express cors dotenv
```

### "Port 3001 already in use"
- Change port in `server.js`: `const PORT = 3002;`
- Update `.env`: `VITE_PROXY_URL=http://localhost:3002`

### Proxy server not starting
- Check `.env` has `UDEMY_INSTRUCTOR_TOKEN`
- Make sure no syntax errors in `server.js`

### Still getting CORS errors
- Make sure proxy server is running
- Check browser console for the actual error
- Verify proxy URL in `.env`: `VITE_PROXY_URL=http://localhost:3001`

## ✅ Success Indicators

- ✅ Proxy server shows: "✅ Fetched X courses"
- ✅ Frontend loads courses without errors
- ✅ No CORS errors in browser console
- ✅ Courses appear on the page

---

**That's it! Your courses should now load! 🎉**

