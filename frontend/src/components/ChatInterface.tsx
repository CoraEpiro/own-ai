import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Send, Bot, Moon, Sun, LogOut, BarChart3,
  User as UserIcon, Plus, Trash2, ChevronDown, MessageSquare,
  Sparkles, Zap, Menu, X, Settings, Brain, Code2, PenLine, GraduationCap, Search,
  Paperclip, FileText, Image as ImageIcon, FileSpreadsheet, FileCode,
  Upload, File, Mic, MicOff, Globe,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { LLMModel, Message, Conversation, ConversationWithMessages, Attachment } from '../types';
import { estimateTokens, formatTokens, formatCurrency } from '../utils/pricing';
import AIMessage from './AIMessage';
import { getApiUrl } from '../config/api';
import { getProviderTheme, ProviderTheme } from '../config/themes';

// ── Suggestion cards ─────────────────────────────────────────────────────
const SUGGESTIONS = [
  { icon: Sparkles, text: 'Explain quantum computing in simple terms' },
  { icon: Zap, text: 'Write a Python function to sort a list' },
  { icon: MessageSquare, text: 'Brainstorm startup ideas for 2025' },
  { icon: Bot, text: 'Help me plan a weekend trip to Baku' },
];

// ── Persona presets ──────────────────────────────────────────────────────
const PERSONAS = [
  { id: 'default', name: 'Default', icon: Bot, prompt: '', description: 'No custom instructions' },
  { id: 'coder', name: 'Code Expert', icon: Code2, prompt: 'You are an expert software engineer. Write clean, efficient, well-documented code. Explain your reasoning step by step. Use best practices and modern patterns.', description: 'Clean code & best practices' },
  { id: 'writer', name: 'Writing Assistant', icon: PenLine, prompt: 'You are a professional writing assistant. Help with grammar, style, tone, and structure. Be constructive and specific in your feedback. Offer alternatives when suggesting changes.', description: 'Grammar, style & structure' },
  { id: 'math', name: 'Math Tutor', icon: GraduationCap, prompt: 'You are a patient math tutor. Explain concepts step by step using clear notation. Use LaTeX for formulas (e.g. $x^2$, $$\\int_0^1 f(x) dx$$). Provide examples and check understanding.', description: 'Step-by-step math explanations' },
  { id: 'analyst', name: 'Research Analyst', icon: Search, prompt: 'You are a thorough research analyst. Provide detailed, well-structured analysis. Consider multiple perspectives and cite sources when possible. Be objective and data-driven.', description: 'In-depth analysis & research' },
  { id: 'brain', name: 'Reasoning Mode', icon: Brain, prompt: 'You are an advanced reasoning assistant. Think step by step through every problem. Break complex questions into sub-problems. Show your chain of thought explicitly before giving final answers.', description: 'Chain-of-thought reasoning' },
];

// ── File type helpers ─────────────────────────────────────────────────────
function getFileIcon(fileName: string, mimeType?: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return ImageIcon;
  if (['pdf'].includes(ext)) return FileText;
  if (['csv', 'xlsx', 'xls'].includes(ext)) return FileSpreadsheet;
  if (['js', 'ts', 'tsx', 'jsx', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'rb', 'json', 'xml', 'yaml', 'yml'].includes(ext)) return FileCode;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Thinking Indicator ──────────────────────────────────────────────────
const ThinkingIndicator: React.FC<{
  modelName: string;
  reasoningContent: string;
  theme: ProviderTheme;
  darkMode: boolean;
}> = ({ reasoningContent, theme, darkMode }) => {
  const [seconds, setSeconds] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current && expanded) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [reasoningContent, expanded]);

  const formatTime = (s: number) => {
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  return (
    <div className="animate-msg-in py-2">
      <div className="flex items-start gap-4">
        {/* Provider icon */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: darkMode ? theme.aiIconBgDark : theme.aiIconBg }}
        >
          <span className="thinking-sparkle" style={{ color: darkMode ? theme.aiIconColorDark : theme.aiIconColor, fontSize: '16px', lineHeight: 1 }}>
            {theme.aiIcon}
          </span>
        </div>

        <div className="flex-1">
          {/* Header with timer */}
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={() => reasoningContent && setExpanded(e => !e)}
          >
            <span className="text-sm font-medium" style={{ color: darkMode ? theme.textSecondaryDark : theme.textSecondary }}>
              Thinking
            </span>
            <span className="text-xs tabular-nums" style={{ color: darkMode ? '#666' : '#bbb' }}>
              {formatTime(seconds)}
            </span>
            {reasoningContent && (
              <ChevronDown
                className={`h-3 w-3 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                style={{ color: darkMode ? '#666' : '#bbb' }}
              />
            )}
            {!reasoningContent && (
              <div className="flex gap-1 ml-0.5">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-1 h-1 rounded-full animate-bounce" style={{ background: darkMode ? '#555' : '#ccc', animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            )}
          </div>

          {/* Reasoning text (collapsible) */}
          {reasoningContent && expanded && (
            <div
              ref={scrollRef}
              className="mt-2 text-[13px] leading-relaxed overflow-y-auto thinking-text"
              style={{
                color: darkMode ? '#777' : '#aaa',
                maxHeight: '200px',
              }}
            >
              {reasoningContent}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
const ChatInterface: React.FC = () => {
  // ── State ──────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-5.4');
  const [models, setModels] = useState<LLMModel[]>([]);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [modelLoadError, setModelLoadError] = useState<string | null>(null);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState('default');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [reasoningEffort, setReasoningEffort] = useState<'low' | 'medium' | 'high'>('medium');
  const [deepSearch, setDeepSearch] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // ── Derived theme ──────────────────────────────────────────────────────
  const currentModel = models.find(m => m.id === selectedModel);
  const theme: ProviderTheme = useMemo(
    () => getProviderTheme(currentModel?.provider ?? 'OpenAI'),
    [currentModel?.provider],
  );
  const dk = darkMode;

  // ── Token estimation (for message metadata) ────────────────────────────
  const inputTokens = estimateTokens(input);
  const inputCost = currentModel?.costPer1kTokens ? (inputTokens / 1000) * currentModel.costPer1kTokens.input : 0;

  // ── Load models ────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setModelLoadError(null);
        const { data } = await axios.get(getApiUrl('/models'));
        setModels(data.models);
        if (data.models.length > 0) setSelectedModel(data.models[0].id);
      } catch {
        setModelLoadError('Failed to load models.');
        setModels([]);
      }
    })();
  }, []);

  // ── Load conversations ─────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(getApiUrl('/chat'));
        setConversations(data);
      } catch { /* silent */ }
    })();
  }, []);

  // ── Auto-scroll ────────────────────────────────────────────────────────
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ── Auto-resize textarea ───────────────────────────────────────────────
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // ── Drag & Drop ────────────────────────────────────────────────────────
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes('Files')) setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (!droppedFiles.length) return;
    const validFiles = droppedFiles.filter(f => {
      const ok = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'text/csv', 'text/markdown', 'application/json'];
      return ok.includes(f.type) || f.name.endsWith('.md') || f.name.endsWith('.txt') || f.name.endsWith('.csv') || f.name.endsWith('.json');
    });
    if (!validFiles.length) { toast.error('Unsupported file type'); return; }
    if (validFiles.length + pendingFiles.length > 5) { toast.error('Max 5 files'); return; }
    const previews = validFiles.map(f => f.type.startsWith('image/') ? URL.createObjectURL(f) : '');
    setPendingFiles(prev => [...prev, ...validFiles]);
    setPendingPreviews(prev => [...prev, ...previews]);
    toast.success(`${validFiles.length} file${validFiles.length > 1 ? 's' : ''} added`);
  }, [pendingFiles.length]);

  // ── Voice Recording (STT) ─────────────────────────────────────────────
  const handleMicToggle = useCallback(async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (blob.size < 100) return;

        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append('audio', blob, 'recording.webm');
          const resp = await axios.post(getApiUrl('/audio/transcribe'), formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          const text = resp.data?.text?.trim();
          if (text) {
            setInput(prev => (prev ? prev + ' ' + text : text));
            toast.success('Voice transcribed');
          }
        } catch (err: any) {
          toast.error(err.response?.data?.error || 'Transcription failed');
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      toast.error('Microphone access denied');
    }
  }, [isRecording]);

  // ═════════════════════════════════════════════════════════════════════════
  //  SEND MESSAGE
  // ═════════════════════════════════════════════════════════════════════════
  const handleSend = async () => {
    if ((!input.trim() && !pendingFiles.length) || loading) return;

    const currentPendingFiles = [...pendingFiles];
    // Build attachment previews for the user message display
    const fileAttachmentPreviews: Attachment[] = currentPendingFiles.map(f => ({
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      type: f.type.startsWith('image/') ? 'image' as const : 'document' as const,
      mimeType: f.type,
      fileName: f.name,
      url: f.type.startsWith('image/') ? URL.createObjectURL(f) : '',
      size: f.size,
    }));

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
      tokens: inputTokens,
      cost: inputCost,
      attachments: fileAttachmentPreviews.length ? fileAttachmentPreviews : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    const assistantId = Date.now().toString() + Math.random().toString(36).slice(2);
    setMessages(prev => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', timestamp: new Date().toISOString(), model: selectedModel },
    ]);

    try {
      // Upload files if any
      let uploadedAttachments: any[] = [];
      if (currentPendingFiles.length > 0) {
        setUploading(true);
        const formData = new FormData();
        currentPendingFiles.forEach(f => formData.append('files', f));
        try {
          const uploadResp = await axios.post(getApiUrl('/upload'), formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          uploadedAttachments = uploadResp.data.attachments;
        } catch (err: any) {
          throw new Error(err.response?.data?.error || 'File upload failed');
        } finally {
          setUploading(false);
          setPendingFiles([]);
          setPendingPreviews([]);
        }
      } else {
        setPendingFiles([]);
        setPendingPreviews([]);
      }

      const body: Record<string, unknown> = { prompt: userMessage.content, model: selectedModel };
      if (currentConversationId) body.conversationId = currentConversationId;
      if (systemPrompt.trim()) body.systemPrompt = systemPrompt.trim();
      if (uploadedAttachments.length) body.attachments = uploadedAttachments;
      if (currentModel?.capabilities?.includes('reasoning')) body.reasoningEffort = reasoningEffort;
      if (deepSearch) body.deepSearch = true;

      const response = await fetch(getApiUrl('/stream-chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errMsg = `Server error (${response.status})`;
        try { const errBody = await response.json(); errMsg = errBody.error || errMsg; } catch {}
        throw new Error(errMsg);
      }
      if (!response.body) throw new Error('No response body');

      let fullText = '';
      let fullReasoning = '';
      let metaReceived: any = null;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (!value) continue;
        const lines = decoder.decode(value).split('\n').filter(l => l.trim());
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') continue;
          try {
            const parsed = JSON.parse(payload);
            if (parsed.type === 'meta') { metaReceived = parsed; continue; }
            const delta = parsed.choices?.[0]?.delta;
            // Capture reasoning/thinking content (OpenAI reasoning models)
            const reasoning = delta?.reasoning_content || delta?.reasoning;
            if (reasoning) {
              fullReasoning += reasoning;
              setMessages(prev => prev.map(m => (m.id === assistantId ? { ...m, reasoningContent: fullReasoning } : m)));
            }
            const content = delta?.content;
            if (content) {
              fullText += content;
              setMessages(prev => prev.map(m => (m.id === assistantId ? { ...m, content: fullText } : m)));
            }
          } catch {}
        }
      }

      setLoading(false);

      if (metaReceived) {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? { ...m, content: fullText, tokens: metaReceived.assistantMessage.tokens, cost: metaReceived.assistantMessage.cost, model: metaReceived.assistantMessage.model }
              : m,
          ),
        );
        if (!currentConversationId) setCurrentConversationId(metaReceived.conversationId);
      }

      // Refresh sidebar
      try {
        const { data: convos } = await axios.get(getApiUrl('/chat'));
        setConversations(convos);
        if (!currentConversationId && convos.length > 0) setCurrentConversationId(convos[0].id);
      } catch {}
    } catch (error: any) {
      setLoading(false);
      const errorContent = error.message || 'Failed to stream response.';
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: `**Error:** ${errorContent}` } : m));
      toast.error(errorContent);
    }
  };

  // ── Other handlers ─────────────────────────────────────────────────────
  const loadConversation = async (id: string) => {
    try {
      const { data } = await axios.get(getApiUrl(`/chat/${id}`));
      const conv: ConversationWithMessages = data.conversation;
      setMessages(conv.messages);
      setCurrentConversationId(id);
      setSelectedModel(conv.model);
      setMobileSidebar(false);
    } catch { toast.error('Failed to load conversation'); }
  };

  const deleteConversation = async (id: string) => {
    try {
      await axios.delete(getApiUrl(`/chat/${id}`));
      setConversations(prev => prev.filter(c => c.id !== id));
      if (currentConversationId === id) { setCurrentConversationId(null); setMessages([]); }
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleLogout = () => { logout(); navigate('/auth'); };

  const toggleDarkMode = () => {
    setDarkMode(d => !d);
    document.documentElement.classList.toggle('dark');
  };

  const newChat = () => {
    setMessages([]); setInput(''); setCurrentConversationId(null); setMobileSidebar(false);
    setSystemPrompt(''); setSelectedPersona('default');
    setPendingFiles([]); setPendingPreviews([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + pendingFiles.length > 5) { toast.error('Max 5 files at a time'); return; }
    const newPreviews = files.map(f => f.type.startsWith('image/') ? URL.createObjectURL(f) : '');
    setPendingFiles(prev => [...prev, ...files]);
    setPendingPreviews(prev => [...prev, ...newPreviews]);
    e.target.value = '';
  };

  const removeFile = (idx: number) => {
    if (pendingPreviews[idx]) URL.revokeObjectURL(pendingPreviews[idx]);
    setPendingFiles(prev => prev.filter((_, i) => i !== idx));
    setPendingPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  // ── Attachment badges (shown in user messages) ─────────────────────────
  const AttachmentBadges = ({ attachments, variant = 'user' }: { attachments: Attachment[]; variant?: 'user' | 'neutral' }) => {
    if (!attachments?.length) return null;
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {attachments.map((att, i) => {
          const Icon = getFileIcon(att.fileName, att.mimeType);
          return (
            <div
              key={att.id || i}
              className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg ${
                variant === 'user'
                  ? 'bg-white/15 text-white/90'
                  : 'bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              <Icon className="h-3.5 w-3.5 flex-shrink-0 opacity-80" />
              <span className="truncate max-w-[120px] font-medium">{att.fileName}</span>
              {att.size != null && att.size > 0 && (
                <span className="opacity-60 text-[10px]">{formatFileSize(att.size)}</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ═════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div
      className="flex h-screen overflow-hidden"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* ── Drag & Drop overlay ─────────────────────────────────────────── */}
      {isDragOver && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in pointer-events-none">
          <div
            className="flex flex-col items-center gap-4 p-10 rounded-3xl border-2 border-dashed animate-drop-zone"
            style={{ borderColor: theme.accent, background: `${theme.accent}15` }}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: theme.accent }}>
              <Upload className="h-8 w-8 text-white" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-white">Drop files here</p>
              <p className="text-sm text-gray-300 mt-1">Images, PDFs, text files (max 5)</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile overlay ─────────────────────────────────────────────── */}
      {mobileSidebar && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setMobileSidebar(false)} />
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SIDEBAR
         ══════════════════════════════════════════════════════════════════ */}
      <aside
        className={`
          ${mobileSidebar ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
          fixed md:relative z-40 md:z-auto
          ${sidebarOpen ? 'w-[280px]' : 'w-[60px]'}
          h-full flex flex-col transition-all duration-300 ease-in-out
        `}
        style={{ background: theme.sidebar, borderRight: `1px solid ${theme.sidebarBorder}` }}
      >
        {/* Logo */}
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${theme.sidebarBorder}` }}>
          {sidebarOpen ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: theme.accent }}>
                <Bot className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-white text-lg tracking-tight">Own AI</span>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto" style={{ background: theme.accent }}>
              <Bot className="h-4 w-4 text-white" />
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 text-gray-400 hover:text-white transition-colors hidden md:block">
            <ChevronDown className={`h-4 w-4 transition-transform ${sidebarOpen ? '' : '-rotate-90'}`} />
          </button>
          <button onClick={() => setMobileSidebar(false)} className="p-1 text-gray-400 hover:text-white md:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* New Chat */}
        <div className="p-3">
          <button
            onClick={newChat}
            className="w-full text-white rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 font-medium transition-all duration-200 hover:brightness-110"
            style={{ background: theme.accent }}
          >
            <Plus className="h-4 w-4" />
            {sidebarOpen && <span>New Chat</span>}
          </button>
        </div>

        {/* Model Selector */}
        {sidebarOpen && (
          <div className="px-3 pb-3">
            <div className="relative">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Model</label>
              <button
                onClick={() => setShowModelSelector(!showModelSelector)}
                className="w-full rounded-lg px-3 py-2 flex items-center justify-between transition-all duration-200 text-left"
                style={{ background: theme.sidebarHover, border: `1px solid ${showModelSelector ? theme.accent : theme.sidebarBorder}` }}
                disabled={models.length === 0}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: theme.accent }} />
                  <span className="text-sm text-gray-200 truncate">{currentModel?.name || 'Select Model'}</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-500 flex-shrink-0 transition-transform ${showModelSelector ? 'rotate-180' : ''}`} />
              </button>

              {showModelSelector && (
                <div
                  className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto animate-fade-in scrollbar-thin"
                  style={{ background: theme.sidebarActive, border: `1px solid ${theme.sidebarBorder}` }}
                >
                  {modelLoadError ? (
                    <div className="px-4 py-3 text-sm text-red-400">{modelLoadError}</div>
                  ) : (
                    (() => {
                      const grouped = models.reduce<Record<string, typeof models>>((acc, m) => {
                        (acc[m.provider] ??= []).push(m);
                        return acc;
                      }, {});
                      return Object.entries(grouped).map(([provider, providerModels]) => {
                        const pTheme = getProviderTheme(provider);
                        return (
                          <div key={provider}>
                            <div className="flex items-center gap-2 px-3 py-2 sticky top-0" style={{ background: theme.sidebarActive, borderBottom: `1px solid ${theme.sidebarBorder}` }}>
                              <span className="w-2 h-2 rounded-full" style={{ background: pTheme.accent }} />
                              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: pTheme.accent }}>{provider}</span>
                            </div>
                            {providerModels.map(model => {
                              const active = selectedModel === model.id;
                              const cat = (model as any).category;
                              return (
                                <button
                                  key={model.id}
                                  onClick={() => { setSelectedModel(model.id); setShowModelSelector(false); }}
                                  className="w-full text-left px-3 py-2.5 transition-all duration-150"
                                  style={{
                                    background: active ? pTheme.accentSoftDark : undefined,
                                    borderLeft: active ? `3px solid ${pTheme.accent}` : '3px solid transparent',
                                  }}
                                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = theme.sidebarHover; }}
                                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? pTheme.accentSoftDark : 'transparent'; }}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className={`text-sm ${active ? 'text-white font-semibold' : 'text-gray-300'}`}>{model.name}</span>
                                    {cat && (
                                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full" style={{
                                        background: cat === 'reasoning' ? 'rgba(168,85,247,0.15)' : cat === 'flagship' ? 'rgba(234,179,8,0.15)' : 'rgba(34,197,94,0.15)',
                                        color: cat === 'reasoning' ? '#a855f7' : cat === 'flagship' ? '#eab308' : '#22c55e',
                                      }}>{cat}</span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-gray-500 mt-0.5 leading-tight">{model.description}</div>
                                </button>
                              );
                            })}
                          </div>
                        );
                      });
                    })()
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* System Prompt / Persona */}
        {sidebarOpen && (
          <div className="px-3 pb-3">
            <button
              onClick={() => setShowSystemPrompt(!showSystemPrompt)}
              className="w-full rounded-lg px-3 py-2 flex items-center justify-between transition-all duration-200 text-left"
              style={{
                background: systemPrompt ? theme.accentSoftDark : theme.sidebarHover,
                border: `1px solid ${systemPrompt ? theme.accent : theme.sidebarBorder}`,
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Settings className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-sm text-gray-200 truncate">{PERSONAS.find(p => p.id === selectedPersona)?.name || 'System Prompt'}</span>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-gray-500 flex-shrink-0 transition-transform ${showSystemPrompt ? 'rotate-180' : ''}`} />
            </button>

            {showSystemPrompt && (
              <div className="mt-2 rounded-xl p-3 animate-fade-in space-y-2" style={{ background: theme.sidebarHover, border: `1px solid ${theme.sidebarBorder}` }}>
                <div className="flex flex-wrap gap-1.5">
                  {PERSONAS.map(p => {
                    const active = selectedPersona === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedPersona(p.id); setSystemPrompt(p.prompt); }}
                        className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-full transition-all font-medium"
                        style={{ background: active ? theme.accent : theme.sidebarActive, color: active ? '#fff' : '#aaa' }}
                        title={p.description}
                      >
                        <p.icon className="h-3 w-3" />
                        {p.name}
                      </button>
                    );
                  })}
                </div>
                <textarea
                  value={systemPrompt}
                  onChange={e => { setSystemPrompt(e.target.value); setSelectedPersona('custom'); }}
                  placeholder="Custom instructions for the AI..."
                  className="w-full bg-transparent text-xs text-gray-300 placeholder-gray-600 resize-none rounded-lg p-2 focus:outline-none"
                  style={{ border: `1px solid ${theme.sidebarBorder}` }}
                  rows={3}
                />
                {systemPrompt && (
                  <button onClick={() => { setSystemPrompt(''); setSelectedPersona('default'); }} className="text-[10px] text-gray-500 hover:text-red-400 transition-colors">
                    Clear prompt
                  </button>
                )}

                {/* Voice selector for TTS */}
                <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: theme.sidebarBorder }}>
                  <span className="text-[10px] text-gray-500">Voice:</span>
                  <select
                    value={localStorage.getItem('tts-voice') || 'nova'}
                    onChange={e => { localStorage.setItem('tts-voice', e.target.value); }}
                    className="text-[11px] bg-transparent text-gray-300 rounded px-1 py-0.5 focus:outline-none cursor-pointer"
                    style={{ border: `1px solid ${theme.sidebarBorder}` }}
                  >
                    {['alloy', 'ash', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer'].map(v => (
                      <option key={v} value={v} className="bg-gray-800">{v}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Conversations */}
        <div className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-thin">
          {sidebarOpen && conversations.length > 0 && (
            <div className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-2 mt-1">Conversations</div>
          )}
          {conversations.length === 0 && sidebarOpen ? (
            <div className="text-xs text-gray-600 italic mt-2">No conversations yet</div>
          ) : (
            conversations.map(conv => {
              const active = currentConversationId === conv.id;
              return (
                <div
                  key={conv.id}
                  className="group relative cursor-pointer rounded-lg p-2.5 transition-all duration-150"
                  style={{
                    background: active ? theme.sidebarActive : undefined,
                    borderLeft: active ? `3px solid ${theme.accent}` : '3px solid transparent',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = theme.sidebarHover; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? theme.sidebarActive : 'transparent'; }}
                  onClick={() => loadConversation(conv.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-200 truncate font-medium">{conv.title}</div>
                      {sidebarOpen && (
                        <div className="text-[11px] text-gray-500 truncate mt-0.5">
                          {new Date(conv.updatedAt).toLocaleDateString()} &middot; {conv.messageCount} msgs
                        </div>
                      )}
                    </div>
                    {sidebarOpen && (
                      <button
                        onClick={e => { e.stopPropagation(); deleteConversation(conv.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* User footer */}
        <div className="p-3" style={{ borderTop: `1px solid ${theme.sidebarBorder}` }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: theme.accent }}>
              <UserIcon className="h-4 w-4 text-white" />
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-200 truncate">{user?.email || 'User'}</div>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <div className="mt-2.5 flex items-center gap-0.5">
              <button onClick={() => navigate('/dashboard')} className="p-2 text-gray-500 hover:text-gray-300 transition-colors" title="Dashboard"><BarChart3 className="h-4 w-4" /></button>
              <button onClick={() => navigate('/profile')} className="p-2 text-gray-500 hover:text-gray-300 transition-colors" title="Profile"><UserIcon className="h-4 w-4" /></button>
              <button onClick={toggleDarkMode} className="p-2 text-gray-500 hover:text-gray-300 transition-colors" title="Theme">
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-400 transition-colors ml-auto" title="Logout">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════════════════
          MAIN CHAT AREA
         ══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 relative" style={{ background: dk ? theme.mainBgDark : theme.mainBg }}>

        {/* Mobile hamburger — no visible header bar */}
        <div className="md:hidden absolute top-3 left-4 z-20">
          <button onClick={() => setMobileSidebar(true)} className="p-1.5" style={{ color: dk ? theme.textSecondaryDark : theme.textSecondary }}>
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* ── Messages / Welcome ────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-2 pb-48 scrollbar-thin">
          {/* Model name — top center, like ChatGPT */}
          <div className="pt-2 pb-1 text-center">
            <span className="text-sm font-medium" style={{ color: dk ? theme.textSecondaryDark : theme.textSecondary }}>
              {currentModel?.name || 'Own AI'}
            </span>
          </div>

          {messages.length === 0 ? (
            <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-full py-12">
              {/* Provider icon */}
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-6"
                style={{ background: dk ? theme.aiIconBgDark : theme.aiIconBg }}
              >
                <span style={{ color: dk ? theme.aiIconColorDark : theme.aiIconColor, fontSize: '28px', lineHeight: 1 }}>
                  {theme.aiIcon}
                </span>
              </div>
              <h2 className="text-3xl font-semibold mb-2" style={{ color: dk ? theme.textPrimaryDark : theme.textPrimary }}>
                What can I help with?
              </h2>
              <p className="text-sm mb-10" style={{ color: dk ? theme.textSecondaryDark : theme.textSecondary }}>
                {currentModel ? currentModel.name : 'Choose a model to get started'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(s.text); inputRef.current?.focus(); }}
                    className="group flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-sm transition-all duration-200"
                    style={{
                      background: dk ? theme.inputBgDark : theme.inputBg,
                      border: `1px solid ${dk ? theme.inputBorderDark : theme.inputBorder}`,
                      color: dk ? theme.textPrimaryDark : theme.textSecondary,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.color = dk ? theme.textPrimaryDark : theme.textPrimary; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = dk ? theme.inputBorderDark : theme.inputBorder; e.currentTarget.style.color = dk ? theme.textPrimaryDark : theme.textSecondary; }}
                  >
                    <s.icon className="h-4 w-4 flex-shrink-0 transition-colors" style={{ color: dk ? theme.textSecondaryDark : theme.textSecondary }} />
                    <span>{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-[52rem] mx-auto space-y-6">
              {messages.filter(m => !(m.role === 'assistant' && !m.content)).map((message, idx) => (
                <div
                  key={message.id}
                  className="animate-msg-in"
                  style={{ animationDelay: `${Math.min(idx * 25, 200)}ms` }}
                >
                  {message.role === 'assistant' ? (
                    /* ── AI Message — no bubble, clean flowing text ─────── */
                    <div className="group/ai relative py-2">
                      <div className="flex items-start gap-4">
                        {/* Provider icon */}
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                          style={{ background: dk ? theme.aiIconBgDark : theme.aiIconBg }}
                        >
                          <span style={{ color: dk ? theme.aiIconColorDark : theme.aiIconColor, fontSize: '16px', lineHeight: 1 }}>
                            {theme.aiIcon}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <AIMessage
                            content={message.content}
                            darkMode={darkMode}
                            reasoningContent={message.reasoningContent}
                            actionTheme={{
                              actionIcon: theme.actionIcon,
                              actionIconDark: theme.actionIconDark,
                              actionIconHover: theme.actionIconHover,
                              actionIconHoverDark: theme.actionIconHoverDark,
                            }}
                          />
                          {/* Metadata — subtle, below action buttons */}
                          <div className="flex items-center gap-2 mt-1">
                            {message.model && (
                              <span className="text-[11px]" style={{ color: dk ? theme.metaTextDark : theme.metaText }}>
                                {message.model}
                              </span>
                            )}
                            {message.cost != null && (
                              <span className="text-[11px]" style={{ color: dk ? theme.metaTextDark : theme.metaText }}>
                                $ {formatCurrency(message.cost)}
                              </span>
                            )}
                            {message.tokens != null && (
                              <span className="text-[11px]" style={{ color: dk ? theme.metaTextDark : theme.metaText }}>
                                # {formatTokens(message.tokens)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ── User Message — per-provider styling ────────── */
                    <div className="flex justify-end">
                      <div
                        className="max-w-[70%] px-5 py-3"
                        style={{
                          background: dk ? theme.userBubbleDark : theme.userBubble,
                          color: dk ? theme.userBubbleTextDark : theme.userBubbleText,
                          borderRadius: theme.userBubbleRadius,
                        }}
                      >
                        <p className="whitespace-pre-wrap break-words text-[15px]">{message.content}</p>
                        {message.attachments && message.attachments.length > 0 && (
                          <AttachmentBadges attachments={message.attachments} variant="user" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Thinking indicator with reasoning text & timer */}
              {loading && (() => {
                const last = [...messages].reverse().find(m => m.role === 'assistant');
                return !last || !last.content;
              })() && (
                <ThinkingIndicator
                  modelName={currentModel?.name ?? 'AI'}
                  reasoningContent={(() => {
                    const last = [...messages].reverse().find(m => m.role === 'assistant');
                    return last?.reasoningContent || '';
                  })()}
                  theme={theme}
                  darkMode={dk}
                />
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ══ INPUT AREA (floating over messages) ════════════════════════ */}
        <div className="absolute bottom-0 left-0 right-0 z-10 theme-transition">
          {/* Gradient fade */}
          <div className="h-16 pointer-events-none" style={{
            background: `linear-gradient(to bottom, transparent, ${dk ? theme.mainBgDark : theme.mainBg})`,
          }} />
          <div className="px-4 md:px-6 pb-4 pt-0" style={{ background: dk ? theme.mainBgDark : theme.mainBg }}>
          <div className="max-w-[52rem] mx-auto">

            {/* File previews */}
            {pendingFiles.length > 0 && (
              <div className="flex gap-2 mb-3 flex-wrap animate-fade-in">
                {pendingFiles.map((file, i) => (
                  <div key={i} className="relative group animate-scale-in">
                    {file.type.startsWith('image/') ? (
                      <div className="relative">
                        <img src={pendingPreviews[i]} alt={file.name} className="h-16 w-16 object-cover rounded-xl" style={{ border: `2px solid ${dk ? theme.inputBorderDark : theme.inputBorder}` }} />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-b-xl truncate">{file.name}</div>
                      </div>
                    ) : (
                      <div className="h-16 w-24 rounded-xl flex flex-col items-center justify-center gap-1 px-2" style={{ background: dk ? theme.inputBgDark : theme.inputBg, border: `2px solid ${dk ? theme.inputBorderDark : theme.inputBorder}` }}>
                        {(() => { const Icon = getFileIcon(file.name, file.type); return <Icon className="h-5 w-5" style={{ color: theme.accent }} />; })()}
                        <span className="text-[9px] truncate max-w-full font-medium" style={{ color: dk ? '#ccc' : '#555' }}>{file.name}</span>
                      </div>
                    )}
                    <button onClick={() => removeFile(i)} className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* ── Main input box ─────────────────────────────────────── */}
            <div
              className="rounded-3xl transition-all duration-200 overflow-hidden"
              style={{
                background: dk ? theme.inputBgDark : theme.inputBg,
                border: `1px solid ${dk ? theme.inputBorderDark : theme.inputBorder}`,
                boxShadow: dk ? '0 2px 16px rgba(0,0,0,0.3)' : '0 1px 8px rgba(0,0,0,0.06)',
              }}
              onClick={() => inputRef.current?.focus()}
            >
              {/* Textarea row */}
              <div className="flex items-end gap-1 px-4 pt-3 pb-2">
                <button
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors hover:bg-black/5 dark:hover:bg-white/5 mb-0.5"
                  style={{ color: pendingFiles.length > 0 ? theme.accent : dk ? '#666' : '#b0b0b0' }}
                  title="Attach files"
                >
                  <Paperclip className="h-[18px] w-[18px]" />
                </button>
                <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.txt,.csv,.md,.json" className="hidden" onChange={handleFileSelect} />

                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={uploading ? 'Uploading...' : deepSearch ? 'Search the web...' : theme.placeholder}
                  className="flex-1 resize-none bg-transparent px-2 py-1.5 text-[15px] focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600"
                  style={{ color: dk ? theme.textPrimaryDark : theme.textPrimary }}
                  rows={1}
                  maxLength={10000}
                  disabled={uploading}
                />

                {/* Mic button */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleMicToggle(); }}
                  disabled={isTranscribing}
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors hover:bg-black/5 dark:hover:bg-white/5 mb-0.5 ${isRecording ? 'animate-pulse' : ''}`}
                  style={{ color: isRecording ? '#ef4444' : isTranscribing ? theme.accent : dk ? '#666' : '#b0b0b0' }}
                  title={isRecording ? 'Stop recording' : isTranscribing ? 'Transcribing...' : 'Voice input'}
                >
                  {isTranscribing ? (
                    <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  ) : isRecording ? (
                    <MicOff className="h-[18px] w-[18px]" />
                  ) : (
                    <Mic className="h-[18px] w-[18px]" />
                  )}
                </button>

                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && !pendingFiles.length) || loading || uploading}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed mb-0.5"
                  style={{ background: (!input.trim() && !pendingFiles.length) || loading ? (dk ? '#444' : '#d9d9d9') : theme.accent, color: '#fff' }}
                >
                  {uploading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              {/* Bottom toolbar — inside the input box */}
              <div className="flex items-center gap-1.5 px-4 pb-2.5 pt-0.5">
                {/* Reasoning effort toggle */}
                {currentModel?.capabilities?.includes('reasoning') && (
                  <div className="flex items-center gap-1">
                    {(['low', 'medium', 'high'] as const).map(level => (
                      <button
                        key={level}
                        onClick={() => setReasoningEffort(level)}
                        className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200"
                        style={{
                          background: reasoningEffort === level
                            ? theme.accent
                            : dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                          color: reasoningEffort === level
                            ? '#fff'
                            : dk ? '#aaa' : '#888',
                        }}
                      >
                        {level === 'low' ? '⚡ Low' : level === 'medium' ? '🧠 Medium' : '💎 High'}
                      </button>
                    ))}
                  </div>
                )}

                {/* Deep search toggle */}
                {currentModel?.provider === 'OpenAI' && (
                  <button
                    onClick={() => setDeepSearch(prev => !prev)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200"
                    style={{
                      background: deepSearch ? theme.accent : dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                      color: deepSearch ? '#fff' : dk ? '#aaa' : '#888',
                    }}
                    title="Search the web"
                  >
                    <Globe className="h-3 w-3" />
                    Search
                  </button>
                )}
              </div>
            </div>

            <p className="text-center text-[11px] mt-2.5" style={{ color: dk ? '#555' : '#b0b0b0' }}>
              {theme.disclaimer}
            </p>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
