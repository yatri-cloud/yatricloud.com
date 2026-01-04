# ⚡ QUICK FIX - Start the Proxy Server

## The Problem
You're seeing `ERR_CONNECTION_REFUSED` because the proxy server isn't running.

## ✅ Solution (30 seconds)

### Step 1: Open a NEW Terminal Window

**Important:** Keep your current terminal running the frontend (`npm run dev`), and open a **NEW** terminal window.

### Step 2: Start the Proxy Server

In the **NEW terminal**, run:

```bash
cd "/Volumes/Yatri Cloud/org/Yatri Cloud/yatri-practice-hub"
npm run server
```

**OR** use the script:
```bash
./start-proxy.sh
```

### Step 3: You Should See

```
✅ Udemy Instructor Token loaded
🚀 Udemy API Proxy Server running on http://localhost:3001
📚 Courses endpoint: http://localhost:3001/api/udemy/courses
```

### Step 4: Refresh Your Browser

Go back to your browser and **refresh the page** (F5 or Cmd+R).

## ✅ Success!

Your courses should now load! 🎉

## 🔍 Verify It's Working

Visit: http://localhost:3001/health

You should see:
```json
{"status":"ok","tokenLoaded":true}
```

## 💡 Keep Both Running

- **Terminal 1**: `npm run server` (proxy server)
- **Terminal 2**: `npm run dev` (frontend)

Keep both terminals open!

---

**That's it! Just start the server and refresh! 🚀**

