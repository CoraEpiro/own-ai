import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User } from 'lucide-react';
import { getApiUrl } from '../config/api';

const TYPING_DELAY = 50; // ms per character

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const StreamingAIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [typingIndex, setTypingIndex] = useState(0);
  const [currentAssistantId, setCurrentAssistantId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message or streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamedContent, streaming]);

  // Typing simulation effect
  useEffect(() => {
    if (!streaming || !currentAssistantId) return;
    if (typingIndex < streamedContent.length) {
      const timeout = setTimeout(() => {
        setMessages(prev => prev.map(m =>
          m.id === currentAssistantId
            ? { ...m, content: streamedContent.slice(0, typingIndex + 1) }
            : m
        ));
        setTypingIndex(typingIndex + 1);
      }, TYPING_DELAY);
      return () => clearTimeout(timeout);
    }
  }, [typingIndex, streamedContent, streaming, currentAssistantId]);

  // Handle user send
  const handleSend = async () => {
    if (!input.trim() || streaming) return;
    const userMsg: Message = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      role: 'user',
      content: input.trim(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);
    setStreaming(false);
    setStreamedContent('');
    setTypingIndex(0);
    setCurrentAssistantId(null);

    // Add placeholder assistant message
    const assistantId = Date.now().toString() + Math.random().toString(36).slice(2);
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);
    setCurrentAssistantId(assistantId);

    try {
      // Replace '/api/stream-chat' with your backend endpoint
      const response = await fetch(getApiUrl('/stream-chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          prompt: userMsg.content
        })
      });
      if (!response.body) throw new Error('No response body');
      setIsThinking(false);
      setStreaming(true);
      setStreamedContent('');
      setTypingIndex(0);
      let fullText = '';
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value);
          fullText += chunk;
          setStreamedContent(fullText);
        }
      }
      setStreaming(false);
      setTypingIndex(fullText.length); // finish typing
    } catch (err) {
      setIsThinking(false);
      setStreaming(false);
      setStreamedContent('');
      setTypingIndex(0);
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: '❌ Error: Failed to stream response.' }
          : m
      ));
    }
  };

  // Animated thinking dots
  const ThinkingDots = () => {
    const [dotCount, setDotCount] = useState(1);
    useEffect(() => {
      if (!isThinking) return;
      const interval = setInterval(() => {
        setDotCount(c => (c % 3) + 1);
      }, 500);
      return () => clearInterval(interval);
    }, [isThinking]);
    return <span className="ml-2 animate-pulse">{'.'.repeat(dotCount)}</span>;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {messages.map((msg, _idx) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-end space-x-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-200'}`}>
                  {msg.role === 'user' ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-gray-600" />}
                </div>
                <div className={`prose prose-sm max-w-[80vw] min-w-[60px] px-4 py-3 rounded-xl shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-gray-900'}`}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="flex justify-start">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200">
                  <Bot className="h-4 w-4 text-gray-600" />
                </div>
                <div className="px-4 py-3 rounded-xl bg-white text-gray-900 shadow-sm">
                  <span>Thinking</span><ThinkingDots />
                </div>
              </div>
            </div>
          )}
          {streaming && (
            <div className="flex justify-start">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200">
                  <Bot className="h-4 w-4 text-gray-600" />
                </div>
                <div className="px-4 py-3 rounded-xl bg-white text-gray-900 shadow-sm">
                  <span className="opacity-60">Streaming...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="border-t bg-white p-4">
        <form
          className="max-w-2xl mx-auto flex items-center space-x-4"
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            type="text"
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50"
            placeholder="Type your prompt..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={streaming || isThinking}
            autoFocus
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center justify-center disabled:bg-gray-300"
            disabled={!input.trim() || streaming || isThinking}
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default StreamingAIChat; 