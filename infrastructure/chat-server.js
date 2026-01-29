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
For simple greetings (Hi, Hello, Hey), respond with ONE brief friendly sentence.
For questions, provide helpful responses with engaging formatting:
- Use **bold** for key terms, important concepts, or emphasis
- Break long responses into SHORT paragraphs (2-3 sentences max)
- Add blank lines between paragraphs for breathing room
- Use headings (##) for multi-topic responses
- Keep it conversational and scannable - humans shouldnt feel bored
Example: "**Azure** is Microsofts cloud platform. It offers services like compute, storage, and AI.

You can deploy apps globally and scale automatically. Pretty powerful stuff!"

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
