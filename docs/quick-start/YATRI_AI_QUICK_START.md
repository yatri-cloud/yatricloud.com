# 🚀 Quick Start: Yatri AI Chat (5 minutes)

## What You Need

- ✅ Ollama installed
- ✅ Gemma3 model downloaded
- ✅ Node.js and npm
- ✅ 3 terminal windows

## Quick Setup

### 1️⃣ Terminal 1: Start Ollama Service

```bash
ollama serve
```

**Output should show:**
```
Listening on 127.0.0.1:11434
```

Keep this running in the background.

### 2️⃣ Terminal 2: Download Gemma3 Model (First time only)

```bash
ollama run gemma3
```

Wait for download to complete, then you can exit (Ctrl+C). The model stays downloaded.

### 3️⃣ Terminal 3: Start Backend Server

```bash
cd certification.yatricloud.com
node server.js
```

**Output should show:**
```
🚀 Udemy API Proxy Server running on http://localhost:3001
💬 Chat endpoint: http://localhost:3001/api/chat (requires Ollama running)
```

### 4️⃣ Terminal 4: Start Frontend Dev Server

```bash
cd certification.yatricloud.com
npm run dev
```

**Output should show:**
```
VITE v... ready in ... ms

➜  Local:   http://localhost:5173/
```

## 🎯 Using Yatri AI

1. Open http://localhost:5173 in your browser
2. Look for the **blue/purple chat bubble** in the bottom-right corner
3. Click it to open the chat window
4. Type your question and press Enter or click Send
5. Wait for the response from Gemma3

## ✨ Example Questions

- "What's the difference between AWS EC2 and Lambda?"
- "How do I prepare for the Azure AZ-900 exam?"
- "Explain cloud computing in simple terms"
- "What is Docker and why is it useful?"

## ⚡ Tips

- First response takes ~5 seconds (model loading)
- Subsequent responses are faster
- Responses are generated locally on your machine
- No internet required after setup

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Chat button not showing | Refresh page, check browser console |
| "Ollama service unavailable" | Run `ollama serve` in Terminal 1 |
| "Model not found" | Run `ollama run gemma3` in Terminal 2 |
| Backend not connecting | Make sure `node server.js` is running |
| Slow responses | Normal on first message, restart Ollama if persistent |

## 📚 Learn More

See [YATRI_AI_SETUP.md](./YATRI_AI_SETUP.md) for detailed configuration and advanced options.

## 🎨 Features

✅ Real-time chat interface  
✅ Message timestamps  
✅ Auto-scroll to latest messages  
✅ Dark/Light mode support  
✅ Error handling with helpful messages  
✅ Loading indicator  
✅ Responsive design  

Enjoy chatting with Yatri AI! 🤖💬
