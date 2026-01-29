# Yatri AI Setup Guide

## Overview

Yatri AI is an AI-powered chat assistant integrated into the certification platform. It uses **Ollama** with the **Gemma3** model to provide intelligent responses about certifications, cloud technologies, and general topics.

## Features

- 💬 Real-time chat interface in the bottom-right corner
- 🤖 Powered by Gemma3 LLM via Ollama
- 🎨 Beautiful UI with dark/light mode support
- 📱 Responsive design
- ⚡ Fast local inference (no external API calls)

## Prerequisites

1. **Ollama** installed on your system
2. **Gemma3** model downloaded in Ollama
3. Backend server running (`node server.js`)

## Installation Steps

### Step 1: Install Ollama

**On Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**On macOS:**
```bash
brew install ollama
```

**On Windows:**
Download from [ollama.com](https://ollama.com)

### Step 2: Start Ollama Service

```bash
# Start Ollama (runs on http://localhost:11434)
ollama serve
```

Keep this terminal open. Ollama needs to be running for the chat to work.

### Step 3: Download Gemma3 Model

In a new terminal:
```bash
ollama run gemma3
```

This will download and start the Gemma3 model. You can exit after it finishes (the model will remain downloaded).

### Step 4: Start the Backend Server

In another terminal, from your project directory:
```bash
cd certification.yatricloud.com
node server.js
```

The server will start on `http://localhost:3001`

### Step 5: Start the Frontend

In another terminal:
```bash
npm run dev
```

## Usage

1. **Open the app** - Navigate to http://localhost:5173 (or your dev server URL)
2. **Click the Yatri AI button** - Located in the bottom-right corner (blue/purple chat bubble)
3. **Type your message** - Ask any question about certifications or any topic
4. **Get responses** - The AI will respond using the Gemma3 model

## Architecture

### Frontend (React Component)
- **File**: `src/components/YatriAI.tsx`
- **Features**:
  - Chat message display with timestamps
  - User message vs AI response differentiation
  - Loading state with animated dots
  - Smooth scroll to latest messages
  - Error handling with user-friendly messages

### Backend (Express API)
- **File**: `server.js` (new endpoint: `/api/chat`)
- **Endpoint**: `POST http://localhost:3001/api/chat`
- **Request**: `{ message: string }`
- **Response**: `{ response: string }`
- **Features**:
  - Proxies requests to Ollama API
  - Handles errors gracefully
  - Provides detailed error messages

### Ollama Integration
- **Service**: Ollama running locally on port 11434
- **Model**: Gemma3 (3B parameter language model)
- **API Endpoint**: `http://localhost:11434/api/generate`

## Configuration

### API Port
The backend server runs on port 3001 by default. To change:
```javascript
// In server.js
const PORT = process.env.PORT || 3001;
```

### Ollama Port
Ollama runs on port 11434 by default. The chat endpoint expects this.

### Model Configuration
To use a different model, edit `server.js`:
```javascript
body: JSON.stringify({
  model: 'gemma3',  // Change this to another model
  prompt: message,
  stream: false,
}),
```

Available models can be listed with:
```bash
ollama list
```

## Troubleshooting

### Issue: "Ollama service unavailable"
**Solution:**
- Make sure Ollama is running: `ollama serve`
- Check if Ollama is listening on `http://localhost:11434`
- Run a test: `curl http://localhost:11434/api/tags`

### Issue: "Model not found"
**Solution:**
- Download the model: `ollama run gemma3`
- List available models: `ollama list`
- Check spelling in server.js

### Issue: Chat takes too long to respond
**Solution:**
- This is normal for first response (model is loading into memory)
- Subsequent responses will be faster
- If consistently slow, check system resources (RAM, CPU)

### Issue: Backend server not running
**Solution:**
- Make sure you're in the project directory
- Run: `node server.js`
- Check if port 3001 is not already in use

### Issue: API endpoint not found
**Solution:**
- Make sure backend is running on port 3001
- Check browser console for the exact error
- Verify API URL in YatriAI.tsx component

## Running Multiple Services

The easiest way is to use three terminals:

**Terminal 1 - Ollama:**
```bash
ollama serve
```

**Terminal 2 - Backend Server:**
```bash
cd certification.yatricloud.com
node server.js
```

**Terminal 3 - Frontend Dev Server:**
```bash
cd certification.yatricloud.com
npm run dev
```

Or use a process manager like `pm2` or `concurrently` for automation.

## Production Deployment

For production, you would need to:

1. Host Ollama on a separate machine or container
2. Update the API endpoint to point to production Ollama instance
3. Secure the API with authentication
4. Consider using a GPU instance for faster inference
5. Implement rate limiting

Example environment variable:
```env
VITE_OLLAMA_API_URL=https://ollama.yourdomain.com
```

Then update server.js to use:
```javascript
const ollamaUrl = process.env.VITE_OLLAMA_API_URL || 'http://localhost:11434';
const response = await fetch(`${ollamaUrl}/api/generate`, { ... });
```

## Performance Tips

1. **Increase Ollama context** - Modify Ollama settings for longer conversations
2. **Use quantized models** - Smaller models are faster (e.g., mistral, neural-chat)
3. **Enable GPU acceleration** - If available, Ollama will use GPU automatically
4. **Add conversation history** - Currently, each message is independent. You could extend it to maintain context.

## Development

To modify the chat behavior:

### Update System Prompt
Edit `server.js` to add a system context:
```javascript
body: JSON.stringify({
  model: 'gemma3',
  prompt: `You are Yatri AI, a helpful assistant for cloud certification preparation. User: ${message}`,
  stream: false,
}),
```

### Add Streaming Responses
Set `stream: true` and handle streaming responses from Ollama.

### Store Chat History
Implement a database (PostgreSQL, MongoDB) to persist conversations.

## Files Modified

1. **src/components/YatriAI.tsx** - New chat component
2. **src/App.tsx** - Added YatriAI component to app
3. **server.js** - Added `/api/chat` endpoint

## References

- [Ollama Documentation](https://ollama.ai)
- [Gemma3 Model](https://ollama.ai/library/gemma3)
- [Ollama API](https://github.com/ollama/ollama/blob/main/docs/api.md)
