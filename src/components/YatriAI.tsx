import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, StopCircle, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

// Copy Button Component
const CopyButton = ({ text }: { text: string }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors opacity-0 group-hover:opacity-100"
      title="Copy to clipboard"
    >
      {isCopied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
};

// Enhanced markdown rendering for beautiful formatting
const renderMarkdown = (text: string) => {
  if (!text) return null;

  const lines = text.split('\n');
  const elements: JSX.Element[] = [];
  let inCodeBlock = false;
  let codeContent = '';

  lines.forEach((line, idx) => {
    // Code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        elements.push(
          <div key={`code-wrapper-${idx}`} className="relative group">
            <pre className="bg-gray-800 text-gray-100 p-3 rounded mt-2 mb-2 overflow-x-auto">
              <code className="text-sm">{codeContent}</code>
            </pre>
            <div className="absolute top-2 right-2">
              <CopyButton text={codeContent} />
            </div>
          </div>
        );
        codeContent = '';
      }
      inCodeBlock = !inCodeBlock;
      return;
    }

    if (inCodeBlock) {
      codeContent += line + '\n';
      return;
    }

    // Headings
    if (line.startsWith('### ')) {
      const text = line.slice(4);
      elements.push(<h3 key={idx} className="font-bold text-base mt-3 mb-2">{text}</h3>);
      return;
    }
    if (line.startsWith('## ')) {
      const text = line.slice(3);
      elements.push(<h2 key={idx} className="font-bold text-lg mt-3 mb-2">{text}</h2>);
      return;
    }

    // Empty lines for spacing
    if (!line.trim()) {
      elements.push(<div key={`space-${idx}`} className="h-4">&nbsp;</div>);
      return;
    }

    // Regular text with inline formatting
    let rendered = line;
    // Bold text
    rendered = rendered.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');
    // Italic text  
    rendered = rendered.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    // Inline code
    rendered = rendered.replace(/`([^`]+)`/g, '<code class="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">$1</code>');

    elements.push(
      <div
        key={idx}
        dangerouslySetInnerHTML={{ __html: rendered }}
        className="leading-relaxed"
      />
    );
  });

  return <div className="text-sm space-y-1">{elements}</div>;
};

export const YatriAI = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  // Set initial greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    let greeting = 'Good Morning';
    let subMessage = 'Ready to start your learning journey?';

    if (hour >= 12 && hour < 17) {
      greeting = 'Good Afternoon';
      subMessage = 'Hope your day is going well! What shall we learn?';
    } else if (hour >= 17) {
      greeting = 'Good Evening';
      subMessage = 'Late night study session? I\'m here to help!';
    }

    setMessages([
      {
        id: '1',
        text: `Hi, ${greeting} Yatri 👋\n\n${subMessage}`,
        sender: 'ai',
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Handle scroll events to detect if user is at bottom
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    // We use onScrollCapture on the ScrollArea Root, so e.target is the Viewport that actually scrolls
    const target = e.target as HTMLDivElement;

    // Ignore if the target doesn't look like a scrolling container (safety check)
    if (!target.scrollHeight) return;

    const isAtBottom = Math.abs(target.scrollHeight - target.scrollTop - target.clientHeight) < 50;

    if (isAtBottom) {
      setUserScrolledUp(false);
    } else {
      setUserScrolledUp(true);
    }
  };

  // Auto-scroll only if user hasn't scrolled up or it's a fresh message start
  useEffect(() => {
    if (!userScrolledUp && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, userScrolledUp]);

  // Force scroll to bottom when opening chat or sending new message
  useEffect(() => {
    if (isLoading && !userScrolledUp && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isLoading]);

  // Auto-show tooltip for 5 seconds on page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Suggestions based on generic "business" context + possibly page context in future
  const [suggestions] = useState([
    "What is Yatri Cloud?",
    "Certification Paths",
    "Pricing & Plans",
    "Contact Support"
  ]);

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();

    const messageText = customText || input;
    if (!messageText.trim()) return;

    // Reset scroll state to ensure we scroll to bottom for new interaction
    setUserScrolledUp(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
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
                console.log('📝 Token received:', parsed.token, '| Total:', accumulatedText.substring(0, 50));

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
      {/* Blur Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 transition-all duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Chat Button with Tooltip */}
      <div className="fixed bottom-6 right-6 z-40">
        {/* Tooltip Popup */}
        <div
          className={`absolute bottom-full right-0 mb-2 transition-all duration-500 ${showTooltip ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
            }`}
        >
          <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-5 py-3 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 min-w-max">
            <div className="text-sm font-medium text-center">
              <div>Hello Yatris 👋</div>
              <div>Want to Get Certified?</div>
            </div>
          </div>
          {/* Arrow pointing down */}
          <div className="absolute top-full right-6 -mt-2">
            <div className="w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-white dark:border-t-gray-800" />
          </div>
        </div>

        {/* Chat Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          onMouseEnter={() => setShowTooltip(true)}
          className="rounded-full bg-blue-500 text-white p-4 shadow-lg hover:shadow-xl hover:scale-110 hover:bg-blue-600 transition-all duration-300"
          aria-label="Open Yatri AI chat"
        >
          {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 z-50 sm:z-40 w-full h-full sm:w-96 sm:h-[32rem] bg-white dark:bg-slate-950 border-none sm:border border-gray-200 dark:border-slate-800 rounded-none sm:rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2">
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
          <ScrollArea className="flex-1 p-4" onScrollCapture={handleScroll}>
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`relative max-w-xs px-4 py-3 rounded-lg group ${msg.sender === 'user'
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-bl-none pr-8'
                      }`}
                  >
                    {/* Copy Button for AI messages */}
                    {msg.sender === 'ai' && msg.text && !isLoading && (
                      <div className="absolute top-1 right-1">
                        <CopyButton text={msg.text} />
                      </div>
                    )}

                    {msg.sender === 'ai' && !msg.text && isLoading ? (
                      <div className="flex space-x-1.5 items-center h-4">
                        <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    ) : (
                      msg.sender === 'ai' ? (
                        renderMarkdown(msg.text)
                      ) : (
                        <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                          {msg.text}
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))}

              {/* Suggestions Chips (shown only when messages length is 1 i.e., greeting only, or at bottom) */}
              {messages.length < 3 && !isLoading && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(undefined, suggestion)}
                      className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-full transition-colors border border-gray-200 dark:border-gray-700"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <form onSubmit={(e) => handleSendMessage(e)} className="p-4 border-t border-gray-200 dark:border-slate-800 flex gap-2">
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

