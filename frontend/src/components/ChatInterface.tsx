import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Settings, Moon, Sun, LogOut, BarChart3, User as UserIcon, Plus, Trash2, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { LLMModel, Message, Conversation, ConversationWithMessages } from '../types';
import PricingDisplay from './PricingDisplay';
import PricingExplanation from './PricingExplanation';
import { estimateTokens, calculateInputCost, estimateOutputTokens, formatTokens, formatCurrency } from '../utils/pricing';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// import remarkMath from 'remark-math';
// import rehypeHighlight from 'rehype-highlight';
// import rehypeKatex from 'rehype-katex';
// import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import '../styles/markdown-enhanced.css';
import AIMessage from './AIMessage';
import { getApiUrl } from '../config/api';

declare module 'react-syntax-highlighter';
declare module 'react-syntax-highlighter/dist/esm/styles/prism';

// Custom renderer for code blocks
const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  return !inline && match ? (
    <SyntaxHighlighter
      style={document.documentElement.classList.contains('dark') ? atomDark : prism}
      language={match[1]}
      PreTag="div"
      className="rounded-lg text-sm"
      {...props}
    >
      {String(children).replace(/\n$/, '')}
    </SyntaxHighlighter>
  ) : (
    <code className={className} {...props}>
      {children}
    </code>
  );
};

// Custom renderer for images
const ImageRenderer = ({ src, alt }: { src?: string; alt?: string }) => (
  <img
    src={src}
    alt={alt}
    className="max-w-full rounded-lg border border-gray-200 dark:border-zinc-700 my-2 mx-auto"
    loading="lazy"
    style={{ maxHeight: 400 }}
  />
);

// Custom renderer for video (future-proof)
const VideoRenderer = ({ src }: { src?: string }) => (
  <video
    src={src}
    controls
    className="max-w-full rounded-lg my-2 mx-auto border border-gray-200 dark:border-zinc-700"
    style={{ maxHeight: 400 }}
  />
);

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4o');
  const [models, setModels] = useState<LLMModel[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [modelLoadError, setModelLoadError] = useState<string | null>(null);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Calculate real-time pricing for current input
  const currentModel = models.find(m => m.id === selectedModel);
  const inputTokens = estimateTokens(input);
  const estimatedOutputTokens = estimateOutputTokens(inputTokens);
  const inputCost = (currentModel && currentModel.costPer1kTokens) ? calculateInputCost(inputTokens, currentModel) : 0;
  const estimatedOutputCost = (currentModel && currentModel.costPer1kTokens) ? (estimatedOutputTokens / 1000) * currentModel.costPer1kTokens.output : 0;
  const estimatedTotalCost = inputCost + estimatedOutputCost;

  // Load available models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setModelLoadError(null);
        const apiUrl = getApiUrl('/models');
        const response = await axios.get(apiUrl);
        setModels(response.data.models);
        if (response.data.models.length > 0) {
          setSelectedModel(response.data.models[0].id);
        }
      } catch (error) {
        console.error('Failed to load models:', error);
        setModelLoadError('Failed to load models. Please check your API or network connection.');
        setModels([]);
      }
    };
    loadModels();
  }, []);

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const response = await axios.get(getApiUrl('/chat'));
        setConversations(response.data);
      } catch (error) {
        console.error('Failed to load conversations:', error);
      }
    };
    loadConversations();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
      tokens: inputTokens,
      cost: inputCost,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Add placeholder assistant message
    const assistantId = Date.now().toString() + Math.random().toString(36).slice(2);
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', timestamp: new Date().toISOString(), model: selectedModel }]);

    try {
      // Only include conversationId if it exists
      const requestBody: any = {
        prompt: userMessage.content,
        model: selectedModel,
      };
      if (currentConversationId) {
        requestBody.conversationId = currentConversationId;
      }

      // Use fetch for streaming
      const response = await fetch(getApiUrl('/stream-chat'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody),
      });
      if (!response.body) throw new Error('No response body');
      let fullText = '';
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          // Parse OpenAI streaming chunks
          const lines = decoder.decode(value).split('\n').filter(line => line.trim() !== '');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.replace('data: ', '');
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullText += content;
                  setMessages(prev => prev.map(m =>
                    m.id === assistantId
                      ? { ...m, content: fullText }
                      : m
                  ));
                }
              } catch (e) {
                // Ignore JSON parse errors
              }
            }
          }
        }
      }
      setLoading(false);
      
      console.log('Full response text:', fullText);
      
      // Parse conversation data from backend for badge display
      const conversationDataMatch = fullText.match(/<!--CONVERSATION_DATA:(.*?)-->/);
      if (conversationDataMatch) {
        try {
          const conversationData = JSON.parse(conversationDataMatch[1]);
          console.log('Parsed conversation data:', conversationData);
          // Remove the data marker from the displayed content
          const cleanContent = fullText.replace(/<!--CONVERSATION_DATA:.*?-->/, '').trim();
          
          // Update the assistant message with actual tokens and cost
          setMessages(prev => {
            const updatedMessages = prev.map(m =>
              m.id === assistantId
                ? { 
                    ...m, 
                    content: cleanContent,
                    tokens: conversationData.assistantMessage.tokens,
                    cost: conversationData.assistantMessage.cost,
                    model: conversationData.assistantMessage.model
                  }
                : m
            );
            console.log('Updated messages:', updatedMessages);
            return updatedMessages;
          });
          
          // Update conversation ID if it's a new conversation
          if (!currentConversationId) {
            setCurrentConversationId(conversationData.conversationId);
          }
        } catch (error) {
          console.error('Failed to parse conversation data:', error);
        }
      } else {
        console.log('No conversation data found in response');
      }
      
      // Reload conversations to get updated list
      const conversationsResponse = await axios.get(getApiUrl('/chat'));
      setConversations(conversationsResponse.data);
      if (!currentConversationId && conversationsResponse.data.length > 0) {
        setCurrentConversationId(conversationsResponse.data[0].id);
      }
    } catch (error: any) {
      setLoading(false);
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: `❌ Error: ${error.message || 'Failed to stream response.'}` }
          : m
      ));
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const response = await axios.get(getApiUrl(`/chat/${conversationId}`));
      const conversation: ConversationWithMessages = response.data.conversation;
      
      setMessages(conversation.messages);
      setCurrentConversationId(conversationId);
      setSelectedModel(conversation.model);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      toast.error('Failed to load conversation');
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      await axios.delete(getApiUrl(`/chat/${conversationId}`));
      
      // Remove from local state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      // If this was the current conversation, clear it
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
        setMessages([]);
      }
      
      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const clearChat = () => {
    setMessages([]);
  };

  const newChat = () => {
    setMessages([]);
    setInput('');
    setCurrentConversationId(null);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-zinc-950">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-16'} bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-700 transition-all duration-300 flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center justify-between">
            <h1 className={`font-bold text-gray-900 dark:text-white ${sidebarOpen ? 'text-lg' : 'text-sm'}`}>
              {sidebarOpen ? 'Own AI' : 'AI'}
            </h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={newChat}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 flex items-center justify-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {sidebarOpen && <span>New Chat</span>}
          </button>
        </div>

        {/* Model Selector */}
        <div className="px-4 pb-4">
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Model</label>
            <button
              onClick={() => setShowModelSelector(!showModelSelector)}
              className="w-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg px-3 py-2 flex items-center justify-between transition-colors border border-gray-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-haspopup="listbox"
              aria-expanded={showModelSelector}
              disabled={models.length === 0}
            >
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {models.length > 0 ? (models.find(m => m.id === selectedModel)?.name || 'Select Model') : 'No models available'}
                </span>
              </div>
              <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showModelSelector ? 'rotate-180' : ''}`} />
            </button>
            {showModelSelector && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto animate-fade-in">
                {modelLoadError ? (
                  <div className="px-4 py-2 text-sm text-red-500 flex flex-col gap-2">
                    {modelLoadError}
                    <button
                      onClick={() => window.location.reload()}
                      className="text-blue-600 underline text-xs mt-1"
                    >
                      Retry
                    </button>
                  </div>
                ) : models.length === 0 ? (
                  <div className="px-4 py-2 text-sm text-red-500">No models available. Check your API.</div>
                ) : (
                  models.map(model => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id);
                        setShowModelSelector(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors ${
                        selectedModel === model.id ? 'bg-blue-50 dark:bg-blue-900/20 font-semibold' : ''
                      }`}
                      role="option"
                      aria-selected={selectedModel === model.id}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{model.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{model.provider}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">{model.description}</div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 px-4 space-y-2 overflow-y-auto">
          {sidebarOpen && (
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
              Conversations
            </div>
          )}
          
          {conversations.length === 0 ? (
            <div className="text-xs text-gray-400 dark:text-gray-500 italic">
              {sidebarOpen ? 'No conversations yet' : ''}
            </div>
          ) : (
            conversations.map(conversation => (
              <div
                key={conversation.id}
                className={`group relative cursor-pointer rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors ${
                  currentConversationId === conversation.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
                onClick={() => loadConversation(conversation.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {conversation.title}
                    </div>
                    {sidebarOpen && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {new Date(conversation.updatedAt).toLocaleDateString()} • {conversation.messageCount} messages
                      </div>
                    )}
                  </div>
                  
                  {sidebarOpen && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conversation.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all"
                      title="Delete conversation"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* User Menu */}
        <div className="p-4 border-t border-gray-200 dark:border-zinc-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <UserIcon className="h-4 w-4 text-white" />
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.email || 'User'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </div>
              </div>
            )}
          </div>
          
          {sidebarOpen && (
            <div className="mt-3 flex items-center space-x-1">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                title="Dashboard"
              >
                <BarChart3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                title="Profile"
              >
                <UserIcon className="h-4 w-4" />
              </button>
              <button
                onClick={toggleDarkMode}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                title="Toggle Theme"
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {messages.length === 0 ? 'New Chat' : 'Chat'}
              </h2>
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                  title="Clear Chat"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {models.find(m => m.id === selectedModel)?.name}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-20">
              <Bot className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-medium mb-2">Welcome to Own AI Assistant</h3>
              <p className="text-sm">Start a conversation with your AI assistant</p>
            </div>
          ) : (
            messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {message.role === 'assistant' ? (
                      <>
                        <Bot className="h-5 w-5 mt-0.5 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                        <div className="flex-1">
                          <AIMessage content={message.content} />
                          <div className="flex items-center justify-between mt-2">
                            {message.model && (
                              <div className="text-xs opacity-70">{message.model}</div>
                            )}
                            {message.tokens && message.cost && (
                              <PricingDisplay
                                inputTokens={0}
                                inputCost={0}
                                outputTokens={message.tokens}
                                outputCost={message.cost}
                                variant="assistant"
                                showDetails={true}
                              />
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <User className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="prose prose-sm max-w-none dark:prose-invert prose-code:before:hidden prose-code:after:hidden prose-pre:bg-transparent prose-pre:p-0 prose-pre:shadow-none prose-table:rounded-lg prose-table:border prose-table:border-gray-200 dark:prose-table:border-zinc-700 prose-th:bg-gray-100 dark:prose-th:bg-zinc-800 prose-td:bg-white dark:prose-td:bg-zinc-900 prose-blockquote:border-l-4 prose-blockquote:border-blue-400 dark:prose-blockquote:border-blue-600 prose-blockquote:bg-blue-50/50 dark:prose-blockquote:bg-blue-900/10">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                code: CodeBlock,
                                img: ImageRenderer,
                                video: VideoRenderer,
                                a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                          {message.role === 'user' ? (
                            <div className="flex flex-col items-end mt-2 space-y-1">
                              {message.tokens && message.cost && (
                                <PricingDisplay
                                  inputTokens={message.tokens}
                                  inputCost={message.cost}
                                  totalTokens={(() => {
                                    // If assistant has responded, show total tokens (input+output)
                                    const assistantMsg = messages.find((m, idx) => idx > 0 && m.role === 'assistant');
                                    if (assistantMsg && assistantMsg.tokens) {
                                      return message.tokens + assistantMsg.tokens;
                                    }
                                    return message.tokens;
                                  })()}
                                  variant="user"
                                  showDetails={false}
                                />
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-between mt-2">
                              {message.model && (
                                <div className="text-xs opacity-70">{message.model}</div>
                              )}
                              {message.tokens && message.cost && (
                                <PricingDisplay
                                  inputTokens={0}
                                  inputCost={0}
                                  outputTokens={message.tokens}
                                  outputCost={message.cost}
                                  variant="assistant"
                                  showDetails={true}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-4 py-3">
                <div className="flex items-center space-x-3">
                  <Bot className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 dark:border-zinc-700 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Real-time Pricing Display */}
            {input.trim() && currentModel && currentModel.costPer1kTokens && (
              <div className="mb-3 bg-gray-50 dark:bg-zinc-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cost Estimate
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Based on {formatTokens(inputTokens)} tokens
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <PricingDisplay
                    inputTokens={inputTokens}
                    outputTokens={estimatedOutputTokens}
                    totalTokens={inputTokens + estimatedOutputTokens}
                    inputCost={inputCost}
                    outputCost={estimatedOutputCost}
                    isEstimate={true}
                    showDetails={true}
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                    <div>Input: {formatCurrency(inputCost)}</div>
                    <div>Est. Output: {formatCurrency(estimatedOutputCost)}</div>
                  </div>
                </div>
                
                {/* Pricing Explanation */}
                <div className="mt-3">
                  <PricingExplanation
                    model={currentModel}
                    inputTokens={inputTokens}
                    estimatedOutputTokens={estimatedOutputTokens}
                    inputCost={inputCost}
                    estimatedOutputCost={estimatedOutputCost}
                    totalCost={estimatedTotalCost}
                  />
                </div>
              </div>
            )}
            
            <div className="flex space-x-4">
              <div className="flex-1">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="w-full resize-none border border-gray-300 dark:border-zinc-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                  rows={1}
                  maxLength={10000}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface; 