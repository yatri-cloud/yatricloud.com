import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3002;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Ollama API URL
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log('💬 Chat request:', message);

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const systemPrompt = `You are Yatri AI, a friendly assistant for Yatri Cloud.
Your goal is to explain technical concepts clearly.

Rules:
1. **Tone**: flexible. Be professional and technical, but use **simple, clear English**. Avoid unnecessary jargon, but don't sound childish.
2. **GREETINGS**: Use "Hello Yatri!" ONLY if the user says "Hi", "Hello", etc. first.
3. **NO REPEATED GREETINGS**: If the user asks a question (like "What is Azure?"), answer the question **IMMEDIATELY**. DO NOT say "Hello" or "Sure". Just answer.
4. Formatting:
   - **NEVER** use bullet points (*), dashes (-), or hyphens for lists.
   - **NEVER** use em-dashes (—) or en-dashes (–) inside sentences. Use commas (,) or parentheses ( ) instead.
   - To make a list, just start a new line with the **bold** word followed by a colon.
   - Example list: "**Networking:** connecting computers..."
   - Keep paragraphs **SHORT** (2-3 sentences max).
   - Add blank lines between paragraphs.

Example Answer: "**Azure** is Microsoft's public cloud computing platform. It provides a wide range of services, including servers, storage, databases, and networking, which you can use over the internet."

User question: ${message}`;

        const ollamaResponse = await fetch(`${OLLAMA_API_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'gemma3',
                prompt: systemPrompt,
                stream: true,
            }),
        });

        if (!ollamaResponse.ok) {
            const errorText = await ollamaResponse.text();
            console.error('Ollama API error:', ollamaResponse.status, errorText);
            res.write(`data: ${JSON.stringify({ error: 'Ollama service unavailable' })}\n\n`);
            res.end();
            return;
        }

        const reader = ollamaResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                console.log('✅ Chat response completed');
                res.write('data: [DONE]\n\n');
                res.end();
                break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const data = JSON.parse(line);
                        if (data.response) {
                            res.write(`data: ${JSON.stringify({ token: data.response })}\n\n`);
                        }
                        if (data.error) {
                            res.write(`data: ${JSON.stringify({ error: data.error })}\n\n`);
                        }
                    } catch (e) {
                        console.error('Error parsing JSON:', e);
                    }
                }
            }
        }
    } catch (err) {
        console.error('Error in chat endpoint:', err);
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Chat server running on http://localhost:${PORT}`);
});
