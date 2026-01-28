# 🚀 Quick Start - Run the Proxy Server

## The Error You're Seeing

`ERR_CONNECTION_REFUSED` means the proxy server is not running.

## ✅ Fix: Start the Server

### Option 1: Using npm script (Recommended)

Open a **NEW terminal window** and run:

```bash
cd "/Volumes/Yatri Cloud/org/Yatri Cloud/yatri-practice-hub"
npm run server
```

### Option 2: Direct node command

```bash
cd "/Volumes/Yatri Cloud/org/Yatri Cloud/yatri-practice-hub"
node server.js
```

## 🎯 What You Should See

When the server starts, you'll see:
```
✅ Udemy Instructor Token loaded
🚀 Udemy API Proxy Server running on http://localhost:3001
📚 Courses endpoint: http://localhost:3001/api/udemy/courses
💚 Health check: http://localhost:3001/health
```

## ✅ Then Refresh Your Browser

Once the server is running:
1. Go back to your browser
2. Refresh the page (F5 or Cmd+R)
3. Courses should load!

## 🔍 Verify Server is Running

Visit: http://localhost:3001/health

You should see:
```json
{
  "status": "ok",
  "timestamp": "...",
  "tokenLoaded": true
}
```

## 💡 Pro Tip: Run Both Servers

**Terminal 1** (Proxy Server):
```bash
npm run server
```

**Terminal 2** (Frontend):
```bash
npm run dev
```

Keep both terminals open!

---

**That's it! Once the server is running, refresh your browser and courses will load! 🎉**

