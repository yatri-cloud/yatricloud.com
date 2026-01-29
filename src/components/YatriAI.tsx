import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

// Simple markdown rendering for common formatting
const renderMarkdown = (text: string) => {
  return text
    .split('\n')
    .map((line, idx) => {
      // Bold text
      let rendered = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Italic text
      rendered = rendered.replace(/\*(.*?)\*/g, '<em>$1</em>');
      return <div key={idx} dangerouslySetInnerHTML={{ __html: rendered }} className="mb-1" />;
    });
};

export const YatriAI = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hello Yatris 👋

How may I help you today?`,
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = input;
    setInput('');
    setIsLoading(true);

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    // Add placeholder for AI response
    const aiMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: aiMessageId,
        text: '',
        sender: 'ai',
        timestamp: new Date(),
      },
    ]);

    try {
      // Use environment variable for API URL, fallback to localhost for development
      const apiUrl = import.meta.env.VITE_OLLAMA_API_URL || 'http://localhost:3001/api/chat';

      // Use fetch with streaming for real-time response
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageText }),
        signal: abortControllerRef.current?.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      // Read the stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Stream not available');
      }

      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Decode the chunk
        const chunk = decoder.decode(value, { stream: true });

        // Parse SSE format (data: {json}\n\n)
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6); // Remove 'data: ' prefix

            if (data === '[DONE]') {
              break;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed.token) {
                // Add token to accumulated text
                accumulatedText += parsed.token;

                // Update message immediately for smooth streaming
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessageId
                      ? { ...msg, text: accumulatedText }
                      : msg
                  )
                );
              } else if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              // Ignore parsing errors for incomplete data
              if (data.trim()) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      // Don't show error if request was aborted by user
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request was cancelled by user');
      } else {
        const errorText = error instanceof Error ? error.message : 'Sorry, I encountered an error. Please make sure Ollama is running.';
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, text: errorText }
              : msg
          )
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 rounded-full bg-blue-500 text-white p-4 shadow-lg hover:shadow-xl hover:scale-110 hover:bg-blue-600 transition-all duration-300"
        aria-label="Open Yatri AI chat"
      >
        <MessageCircle size={24} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-96 h-96 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          {/* Header */}
          <div className="bg-blue-500 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <img
                src="https://raw.githubusercontent.com/yatricloud/yatri-images/refs/heads/main/Logo/yatricloud-round-transparent.png"
                alt="Yatri Cloud Logo"
                className="w-8 h-8"
              />
              <h3 className="font-bold text-lg">Yatri AI</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-1 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${msg.sender === 'user'
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-bl-none'
                      }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {msg.sender === 'ai' ? renderMarkdown(msg.text) : msg.text}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && !messages[messages.length - 1]?.text && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-slate-800 px-4 py-2 rounded-lg rounded-bl-none">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-slate-800 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              disabled={isLoading}
              className="dark:bg-slate-900 dark:border-slate-700"
            />
            {isLoading ? (
              <Button
                type="button"
                onClick={handleStopGeneration}
                size="sm"
                className="bg-red-500 hover:bg-red-600"
              >
                <StopCircle size={18} />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={!input.trim()}
                size="sm"
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Send size={18} />
              </Button>
            )}
          </form>
        </div>
      )}
    </>
  );
};
