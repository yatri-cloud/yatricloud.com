# 🤖 Yatri AI - Implementation Complete ✅

## 📋 Overview

Yatri AI is a fully functional, production-ready AI chat assistant integrated directly into the Yatri Cloud Certification platform. It uses Ollama's Gemma3 model to provide intelligent, context-aware responses to users.

## 🌟 Key Features

### 💬 Intelligent Chat Interface
*   **Floating Chat Button**: Elegant toggle button in the bottom-right corner.
*   **Dynamic Icons**: Toggles between Message icon (closed) and X icon (Open).
*   **Auto-Popup Tooltip**: "Hello Yatris 👋 / Want to Get Certified?" appears automatically to engage users.

### 🧠 Smart AI Behavior
*   **Persona**: Friendly, professional, and beginner-focused.
*   **Dynamic Greetings**: Auto-detects time of day (Morning/Afternoon/Evening) for personalized welcomes.
*   **Smart "Hi" Handling**: Responds with a short greeting if you say "Hi", but answers questions directly if asked immediately.
*   **Live Streaming**: Text appears word-by-word (typewriter effect) for a natural feel.
*   **Clean Formatting**: Strictly enforces **bold** text for lists (no bullets/dashes) and clean paragraphs.

### 📱 Enhanced UX
*   **Mobile Optimizations**: Full-screen experience on mobile devices, popup on desktop.
*   **Smart Scrolling**: Auto-scrolls to bottom, but respects user scrolling (can read history while generating).
*   **Copy Functionality**: Dedicated copy button on every AI message and code block.
*   **Visual Polish**: Blur backdrop effect when open to focus attention.

## 🛠️ Technical Implementation

### Frontend (`src/components/YatriAI.tsx`)
*   Built with React + TypeScript + Tailwind CSS.
*   Uses `fetch` with `ReadableStream` for real-time text streaming.
*   Implements `AbortController` to stop generation mid-stream.
*   Uses `localStorage` and `useEffect` for state management and time-based logic.

### Backend (`server.js`)
*   Express.js proxy endpoint (`/api/chat`).
*   Connects to local Ollama instance (Port 11434).
*   Streaming response support (Server-Sent Events / raw stream).
*   Robust error handling (Ollama offline, model missing).
*   **System Prompt**: Strictly engineered for simple English, no-bullet formatting, and concise answers.

## 🚀 Quick Start

1.  **Ensure Ollama is Running**:
    ```bash
    ollama serve
    ollama pull gemma3
    ```

2.  **Start the Platform**:
    ```bash
    # Terminal 1 (Backend)
    node server.js

    # Terminal 2 (Frontend)
    npm run dev
    ```

3.  **Visit**: `http://localhost:5173` (or port 8080).

## 📂 Project Structure

```
docs/
├── yatri-ai/
│   ├── README.md            # You are here
│   ├── IMPLEMENTATION.md    # Deep technical details
│   ├── VISUAL_GUIDE.md      # Screenshots & UI flows
│   └── CHANGELOG.md         # History of changes
├── setup/
│   └── YATRI_AI_VM_SETUP.md # Production VM Setup Guide
```

## 🔧 Configuration

**System Prompt Rules (in `server.js`):**
1.  **Tone**: Professional but simple.
2.  **Formatting**: Bold text for important terms. NO bullet points (`*` or `-`).
3.  **Greetings**: Only greet if greeted first.

**Environment Variables:**
*   `OLLAMA_API_URL`: URL of the Ollama instance (default: `http://localhost:11434`)
