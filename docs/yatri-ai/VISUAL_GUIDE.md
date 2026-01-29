# Yatri AI - Visual Guide

## 🎨 UI Layout

```
┌─────────────────────────────────────────────────────────┐
│                    Your App                             │
│                                                         │
│                                                         │
│                                                         │
│                                                         │
│                                                         │
│                                          ┌────────────┐ │
│                                          │ Yatri AI   │ │
│                                          │ Chat Window│ │
│                                          │            │ │
│                                          │ [Messages] │ │
│                                          │ [Input]    │ │
│                                          │ [Send]     │ │
│                                          └────────────┘ │
│                                          ╱               │
│                        ┌─────────────────╯                │
│                        │  💬 Chat        │                │
│                        │  Button         │                │
│                        └─────────────────╯ (Bottom-Right) │
└─────────────────────────────────────────────────────────┘
```

## 📊 Message Flow

```
User Types Message
      │
      ▼
┌──────────────┐
│ React State  │ (YatriAI.tsx)
└──────────────┘
      │
      ▼
┌──────────────────────────────┐
│ HTTP POST                    │
│ http://localhost:3001/api/chat
│ { message: "user input" }
└──────────────────────────────┘
      │
      ▼
┌──────────────────────────────┐
│ Express Server (server.js)   │
│ - Validate input             │
│ - Log request                │
└──────────────────────────────┘
      │
      ▼
┌──────────────────────────────┐
│ HTTP POST                    │
│ http://localhost:11434/api/generate
│ { model: "gemma3",           │
│   prompt: "user input" }
└──────────────────────────────┘
      │
      ▼
┌──────────────────────────────┐
│ Ollama Service               │
│ - Load Gemma3 model          │
│ - Generate response          │
│ - Return tokens              │
└──────────────────────────────┘
      │
      ▼
┌──────────────────────────────┐
│ Response to Backend          │
│ { response: "AI response" }
└──────────────────────────────┘
      │
      ▼
┌──────────────────────────────┐
│ Response to Frontend         │
│ { response: "AI response" }
└──────────────────────────────┘
      │
      ▼
┌──────────────────────────────┐
│ Update React State           │
│ Display message              │
│ Auto-scroll to bottom        │
└──────────────────────────────┘
      │
      ▼
User Sees AI Response
```

## 🖼️ Chat Window Anatomy

```
┌─────────────────────────────────────────┐
│  Yatri AI          [X] Close             │  ← Header (Gradient)
│  Powered by Gemma3                      │
├─────────────────────────────────────────┤
│                                         │
│  ✓ Hello! I'm Yatri AI. How can I      │  ← AI Message
│    help you today?                     │
│                                    14:32│
│                                         │
│                                         │
│                             What is AWS?│  ← User Message (Blue)
│                                    14:33│
│                                         │
│  AWS (Amazon Web Services) is a cloud   │  ← AI Response
│  computing platform that provides...   │
│                                    14:34│
│                                         │
├─────────────────────────────────────────┤
│  [Ask me anything...        ] [→ Send]  │  ← Input Area
└─────────────────────────────────────────┘
```

## 🔄 Component Hierarchy

```
App (src/App.tsx)
│
├─── Routes
│    ├─── Index
│    ├─── PrivacyPolicy
│    ├─── CertifiedYatris
│    └─── ... other routes
│
├─── YatriAI ← NEW
│    ├─── Chat Button (bottom-right)
│    │    └─── onClick: toggleChatWindow
│    │
│    ├─── Chat Window (conditional render)
│    │    ├─── Header
│    │    │    ├─── Title "Yatri AI"
│    │    │    ├─── Subtitle "Powered by Gemma3"
│    │    │    └─── Close Button (X)
│    │    │
│    │    ├─── ScrollArea (Messages)
│    │    │    └─── Message[] (mapped)
│    │    │        ├─── User Messages (blue, right)
│    │    │        ├─── AI Messages (gray, left)
│    │    │        └─── Timestamps
│    │    │
│    │    └─── Input Area
│    │         ├─── Input Field
│    │         └─── Send Button
│    │
│    └─── State
│         ├─── isOpen (boolean)
│         ├─── messages (Message[])
│         ├─── input (string)
│         └─── isLoading (boolean)
│
└─── Other Components (unchanged)
```

## 🌐 Network Diagram

```
┌─────────────────────┐
│   Web Browser       │
│  (Port 5173)        │
│                     │
│ ┌─────────────────┐ │
│ │   React App     │ │
│ │   + YatriAI     │ │
│ └────────┬────────┘ │
└──────────┼──────────┘
           │ HTTP
           │ POST /api/chat
           │ Port 3001
           ▼
┌─────────────────────┐
│  Express Server     │
│  (Port 3001)        │
│                     │
│ ┌─────────────────┐ │
│ │  /api/chat      │ │
│ │  Endpoint       │ │
│ └────────┬────────┘ │
└──────────┼──────────┘
           │ HTTP
           │ POST /api/generate
           │ Port 11434
           ▼
┌─────────────────────┐
│  Ollama Service     │
│  (Port 11434)       │
│                     │
│ ┌─────────────────┐ │
│ │  Gemma3 Model   │ │
│ │  (3B params)    │ │
│ └─────────────────┘ │
└─────────────────────┘
```

## 📱 State Management

```
YatriAI Component State:

┌──────────────────────────────────────┐
│ isOpen: boolean                      │
│ └─ Controls Chat Window visibility   │
│    - true: Window visible            │
│    - false: Window hidden            │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ messages: Message[]                  │
│ └─ Array of chat messages            │
│    Message {                         │
│      id: string                      │
│      text: string                    │
│      sender: "user" | "ai"           │
│      timestamp: Date                 │
│    }                                 │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ input: string                        │
│ └─ Current text in input field       │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ isLoading: boolean                   │
│ └─ API request in progress           │
│    - Shows loading indicator         │
│    - Disables input while loading    │
└──────────────────────────────────────┘
```

## 🔄 User Interaction Flow

```
START
  │
  ▼
User sees app with chat button in bottom-right
  │
  ▼
User clicks chat button
  │
  ├─→ if (isOpen == false):
  │   │ ▼
  │   └─→ setIsOpen(true) → Chat window appears
  │
  ├─→ else:
  │   │ ▼
  │   └─→ setIsOpen(false) → Chat window hides
  │
  ▼
Chat window is open
  │
  ▼
User types message in input field
  │
  ▼
User presses Enter or clicks Send button
  │
  ├─→ if (input is empty):
  │   │ ▼
  │   └─→ Ignore (button disabled)
  │
  ├─→ else:
  │   │ ▼
  │   ├─→ Add user message to messages array
  │   │ ▼
  │   ├─→ Clear input field
  │   │ ▼
  │   ├─→ Show loading indicator
  │   │ ▼
  │   ├─→ Send POST request to /api/chat
  │   │ ▼
  │   ├─→ Wait for response (~2-3 seconds)
  │   │ ▼
  │   ├─→ Receive AI response
  │   │ ▼
  │   ├─→ Add AI message to messages array
  │   │ ▼
  │   ├─→ Hide loading indicator
  │   │ ▼
  │   └─→ Auto-scroll to bottom
  │
  ▼
User sees AI response
  │
  ▼
Loop back to "User types message..."
```

## 📦 Dependencies Tree

```
YatriAI.tsx (Component)
│
├─── React Hooks
│    ├─── useState
│    ├─── useRef
│    └─── useEffect
│
├─── Lucide React Icons
│    ├─── MessageCircle (chat button icon)
│    ├─── X (close button icon)
│    └─── Send (send button icon)
│
├─── shadcn/ui Components
│    ├─── Button (from @/components/ui/button)
│    ├─── Input (from @/components/ui/input)
│    └─── ScrollArea (from @/components/ui/scroll-area)
│
└─── Web APIs
     └─── fetch (for HTTP requests)
```

## ⚙️ Configuration Points

```
YatriAI.tsx
├─── API_URL: "http://localhost:3001/api/chat"
├─── Initial Message: "Hello! I'm Yatri AI..."
├─── Chat Window Size: 384px × 384px
├─── Button Colors: blue-500 → purple-600
└─── Position: fixed bottom-6 right-6

server.js
├─── OLLAMA_API: "http://localhost:11434/api/generate"
├─── MODEL: "gemma3"
├─── SERVER_PORT: 3001
└─── STREAM: false

Ollama
├─── PORT: 11434
├─── MODEL: gemma3 (3B parameters)
└─── INFERENCE_SPEED: ~2-3 seconds/response
```

## 🎯 Key Features Visualization

```
┌─────────────────────────────────────────┐
│          Yatri AI Features              │
├─────────────────────────────────────────┤
│                                         │
│  ✓ Floating Chat Button                │
│    └─ Bottom-right corner              │
│       Blue-to-purple gradient          │
│       Hover animations                 │
│                                         │
│  ✓ Chat Window                         │
│    └─ Gradient header                  │
│       Message history                  │
│       Auto-scroll                      │
│       Timestamps                       │
│       Dark/Light mode                  │
│                                         │
│  ✓ AI Integration                      │
│    └─ Ollama backend                   │
│       Gemma3 model                     │
│       Local inference                  │
│       Error handling                   │
│                                         │
│  ✓ User Experience                     │
│    └─ Real-time messages               │
│       Loading indicator                │
│       Responsive design                │
│       Keyboard support (Enter)         │
│       Mobile friendly                  │
│                                         │
└─────────────────────────────────────────┘
```

---

**This visual guide helps understand how Yatri AI works!**

For detailed information, see the documentation files in the `docs/` directory.
