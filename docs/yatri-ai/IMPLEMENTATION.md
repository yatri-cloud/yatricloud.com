# Yatri AI Implementation Details 🛠️

## ✅ Completed Features

### 1. ⚡ Real-Time Streaming (Server-Sent Events)
*   **Implementation**: Changed from simple JSON response to `response.body.getReader()` in frontend and `res.write()` in backend.
*   **UX Benefit**: Users see text appearing instantly instead of waiting 3-5s for the whole block.
*   **Technical**:
    *   **Frontend**: Decodes chunks on the fly and updates state incrementally.

### Backend (`server.js` / `infrastructure/chat-server.js`)
*   Express.js proxy endpoint (`/api/chat`).
*   Connects to local Ollama instance (Port 11434).
*   Streaming response support (Server-Sent Events / raw stream).
*   Robust error handling (Ollama offline, model missing).
*   **Systemd Integration**: Uses `ollama.service`, `chat-server.service`, and `yatri-frontend.service` for auto-restart and high availability.

### 2. 🧠 Smart Prompt Engineering
*   **System Prompt**: Strictly engineered for simple English, no-bullet formatting, and concise answers.
*   **Rules Enforced**:
    *   **Simple English**: ELI5 (Explain Like I'm 5) style for beginners.
    *   **Strict Formatting**: **NO** bullet points (`*` or `-`) or dashes. Lists use **Bold Term:** syntax.
    *   **Greeting Logic**: Only greets if user says "Hi/Hello". Direct questions get direct answers.
    *   **Dynamic Context**: Prompt is structured with clear `### INSTRUCTIONS` and `### USER QUESTION` headers to improve model adherence and avoid accidental hardcoded output.
    *   **Tone**: Professional, technical, but accessible.

### 3. 🖱️ Advanced interaction
*   **Smart Scrolling**:
    *   Auto-scrolls to bottom when new text arrives.
    *   **Intelligent Lock**: Detects if user scrolls up (`onScrollCapture`) and *pauses* auto-scroll so you can read history while generating.
*   **Copy to Clipboard**:
    *   Added `CopyButton` component to every AI message.
    *   Copies raw markdown text.
    *   Visual feedback (Checkmark icon) on click.

### 4. 📱 Responsive UI
*   **Desktop**: Floating Popup (384w x 384h).
*   **Mobile**: Full-screen overlay (`fixed inset-0`) for better usability on small screens.
*   **Blur Backdrop**: Adds `backdrop-blur-sm` when open to focus user attention.

### 5. 🕒 Dynamic Personalization
*   **Time-Aware Greetings**:
    *   Frontend calculates local time on mount.
    *   Sets initial message to "Good Morning", "Good Afternoon", or "Good Evening".
    *   Varies the sub-message (e.g., "Late night study session?" for evening).

## 🏗️ Architecture Update

```
Frontend (React)                               Backend (Node/Express)                    AI (Ollama)
[YatriAI.tsx]                                  [server.js]                               [Gemma3]
     │                                              │                                         │
     │ (1) POST /api/chat (stream: true)            │                                         │
     ├─────────────────────────────────────────────►│                                         │
     │                                              │ (2) POST /api/generate (stream)         │
     │                                              ├────────────────────────────────────────►│
     │                                              │                                         │
     │                                              │ (3) Stream Chunks                       │
     │        (4) Stream Chunks (SSE)               │◄────────────────────────────────────────┤
     │◄─────────────────────────────────────────────┤                                         │
     │                                              │                                         │
   (5) Update UI State                              │                                         │
   (Typewriter Effect)                              │                                         │
```

## 📦 File Structure (Current)

```
infrastructure/         # Setup files for VM deployment
├── chat-server.js      # Backend server handling chat
├── ollama-api.nginx    # Nginx config for production
├── package.json        # Dependencies
└── setup-yatri-ai-vm.sh # Full automation script

src/components/
└── YatriAI.tsx         # Main Chat Component

docs/
├── yatri-ai/           # AI Specific documentation
└── setup/              # Deployment guides
```

## 🔧 Future Improvements
*   **Conversation History**: Currently, context resets on reload. Ideally, persist to `localStorage` or DB.
*   **Voice Input**: Add speech-to-text for accessibility.
*   **RAG (Retrieval Augmented Generation)**: Feed Yatri Cloud documentation into the context for more specific answers.
