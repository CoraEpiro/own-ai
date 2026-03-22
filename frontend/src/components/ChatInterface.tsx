import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Send, Bot, Moon, Sun, LogOut, BarChart3,
  User as UserIcon, Plus, Trash2, ChevronDown, ChevronRight, MessageSquare,
  Sparkles, Zap, Menu, X, Settings, Brain, Code2, PenLine, GraduationCap, Search,
  Paperclip, FileText, Image as ImageIcon, FileSpreadsheet, FileCode,
  Upload, File, Mic, MicOff, Globe, Waves,
  FolderPlus, Folder as FolderIcon, FolderOpen, MoreHorizontal, Database,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { LLMModel, Message, Conversation, ConversationWithMessages, Attachment, Folder, Bucket } from '../types';
import { estimateTokens, formatTokens, formatCurrency } from '../utils/pricing';
import AIMessage from './AIMessage';
import VoiceMode from './VoiceMode';
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

function normalizeModelId(modelId: string): string {
  const id = (modelId || '').trim();
  const aliases: Record<string, string> = {
    'claude-3.5-sonnet': 'claude-sonnet-4-6',
    'claude-3-5-sonnet-latest': 'claude-sonnet-4-6',
    'claude-3-5-haiku-latest': 'claude-haiku-4-5-20251001',
  };
  return aliases[id] || id;
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
  const [voiceModeActive, setVoiceModeActive] = useState(false);
  const [showPdfAudioPanel, setShowPdfAudioPanel] = useState(false);
  const [pdfAudioMode, setPdfAudioMode] = useState<'summary' | 'narration' | 'podcast'>('summary');
  const [pdfAudioVoice, setPdfAudioVoice] = useState('nova');
  const [pdfAudioSecondaryVoice, setPdfAudioSecondaryVoice] = useState('ash');
  const [pdfAudioLoading, setPdfAudioLoading] = useState(false);
  const [ttsVoice, setTtsVoice] = useState(() => localStorage.getItem('tts-voice') || 'nova');
  // Search Modes
  const [searchMode, setSearchMode] = useState<'auto' | 'human' | 'pre_ai' | 'custom'>('auto');
  const [showSearchOptions, setShowSearchOptions] = useState(false);
  const [customSearchSites, setCustomSearchSites] = useState<string[]>([]);
  const [customSiteInput, setCustomSiteInput] = useState('');
  // Folders
  const [folders, setFolders] = useState<Folder[]>([]);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [moveMenuConvId, setMoveMenuConvId] = useState<string | null>(null);
  // Buckets
  const [availableBuckets, setAvailableBuckets] = useState<Bucket[]>([]);
  const [attachedBucketIds, setAttachedBucketIds] = useState<Set<string>>(new Set());
  const [showBucketSelector, setShowBucketSelector] = useState(false);
  // Cost tracking
  const [todayCost, setTodayCost] = useState(0);
  const [currentChatCost, setCurrentChatCost] = useState(0);
  const [streamingAssistantId, setStreamingAssistantId] = useState<string | null>(null);
  // Model recommendation
  const [modelRecommendation, setModelRecommendation] = useState<any>(null);
  const [showRecommendation, setShowRecommendation] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfAudioInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const typingTargetRef = useRef<Record<string, string>>({});
  const typingRafRef = useRef<Record<string, number>>({});

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const scheduleTypewriter = useCallback((assistantId: string, chunk: string) => {
    if (!chunk) return;
    typingTargetRef.current[assistantId] = (typingTargetRef.current[assistantId] || '') + chunk;

    if (!typingRafRef.current[assistantId]) {
      const tick = () => {
        let shouldContinue = false;
        let changed = false;

        setMessages(prevMsgs => prevMsgs.map(m => {
          if (m.id !== assistantId) return m;
          const target = typingTargetRef.current[assistantId] || '';
          const current = m.content || '';
          if (!target || current.length >= target.length) return m;

          const backlog = target.length - current.length;
          const burst = backlog > 240 ? 18 : backlog > 120 ? 10 : backlog > 40 ? 6 : 3;
          const nextLen = Math.min(target.length, current.length + burst);

          shouldContinue = nextLen < target.length;
          changed = true;
          return { ...m, content: target.slice(0, nextLen) };
        }));

        if (!changed) {
          delete typingRafRef.current[assistantId];
          return;
        }

        if (shouldContinue) {
          typingRafRef.current[assistantId] = window.requestAnimationFrame(tick);
        } else {
          delete typingRafRef.current[assistantId];
        }
      };

      typingRafRef.current[assistantId] = window.requestAnimationFrame(tick);
    }
  }, []);

  // ── Derived theme ──────────────────────────────────────────────────────
  const currentModel = models.find(m => m.id === normalizeModelId(selectedModel));
  const theme: ProviderTheme = useMemo(
    () => getProviderTheme(currentModel?.provider ?? 'OpenAI'),
    [currentModel?.provider],
  );

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

  // ── Load conversations, folders, buckets ────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [convRes, folderRes, bucketRes] = await Promise.all([
          axios.get(getApiUrl('/chat'), { headers: authHeaders }),
          axios.get(getApiUrl('/folders'), { headers: authHeaders }),
          axios.get(getApiUrl('/buckets'), { headers: authHeaders }),
        ]);
        setConversations(convRes.data);
        setFolders(folderRes.data);
        setAvailableBuckets(bucketRes.data);
      } catch { /* silent */ }
    })();
  }, []);

  // ── Load today's cost ──────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(getApiUrl('/dashboard/today-cost'), { headers: authHeaders });
        setTodayCost(data.todayCost || 0);
      } catch { /* silent */ }
    })();
    // Refresh every 30 seconds
    const interval = setInterval(async () => {
      try {
        const { data } = await axios.get(getApiUrl('/dashboard/today-cost'), { headers: authHeaders });
        setTodayCost(data.todayCost || 0);
      } catch { /* silent */ }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // ── Load conversation cost ─────────────────────────────────────────────────
  useEffect(() => {
    if (!currentConversationId) {
      setCurrentChatCost(0);
      return;
    }
    (async () => {
      try {
        const { data } = await axios.get(getApiUrl(`/dashboard/conversation-cost/${currentConversationId}`), { headers: authHeaders });
        setCurrentChatCost(data.cost || 0);
      } catch { /* silent */ }
    })();
  }, [currentConversationId]);

  // ── Get model recommendation as user types ────────────────────────────────
  useEffect(() => {
    if (!input.trim() || input.length < 10) {
      setModelRecommendation(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const { data } = await axios.post(getApiUrl('/recommend-model'), {
          prompt: input,
          attachments: pendingFiles.length > 0 ? pendingFiles.map(f => ({ type: f.type, name: f.name })) : undefined,
          conversationContext: messages.slice(-5), // Last 5 messages for context
          currentModel: selectedModel,
        }, { headers: authHeaders });
        setModelRecommendation(data);
      } catch { /* silent */ }
    }, 800); // Debounce 800ms

    return () => clearTimeout(timer);
  }, [input, pendingFiles, messages, selectedModel]);
  const shouldScrollRef = useRef(false);
  useEffect(() => {
    if (shouldScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      shouldScrollRef.current = false;
    }
  }, [messages]);

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

  const handlePdfAudioFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }

    setPdfAudioLoading(true);
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('mode', pdfAudioMode);
      formData.append('voice', pdfAudioVoice);
      formData.append('secondaryVoice', pdfAudioSecondaryVoice);

      const { data } = await axios.post(getApiUrl('/audio/pdf-podcast'), formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      let audioUrl = data.audioUrl as string | undefined;
      if (!audioUrl && data.audioBase64) {
        const bytes = Uint8Array.from(atob(data.audioBase64), c => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: data.mimeType || 'audio/wav' });
        audioUrl = URL.createObjectURL(blob);
      }

      if (!audioUrl) throw new Error('Audio generation completed but no output URL returned');

      const info = `Generated ${data.mode} audio from **${file.name}** (${data.chunks} chunks).`;
      const msg: Message = {
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        role: 'assistant',
        content: `${info}\n\n[Open / Download audio](${audioUrl})`,
        timestamp: new Date().toISOString(),
        model: 'pdf-audio-generator',
      };
      setMessages(prev => [...prev, msg]);
      shouldScrollRef.current = true;
      toast.success('PDF audio generated');
      setShowPdfAudioPanel(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.message || 'Failed to generate PDF audio');
    } finally {
      setPdfAudioLoading(false);
    }
  }, [pdfAudioMode, pdfAudioSecondaryVoice, pdfAudioVoice]);

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
    shouldScrollRef.current = true; // scroll to show user's message, then stop

    const assistantId = Date.now().toString() + Math.random().toString(36).slice(2);
    setStreamingAssistantId(assistantId);
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
      if (deepSearch) {
        body.deepSearch = true;
        body.searchMode = searchMode;
        if (searchMode === 'custom' && customSearchSites.length > 0) {
          body.customSites = customSearchSites;
        }
      }
      if (!currentConversationId && attachedBucketIds.size > 0) body.bucketIds = Array.from(attachedBucketIds);

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
      let sseBuffer = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (!value) continue;
        sseBuffer += decoder.decode(value, { stream: !doneReading });
        const lines = sseBuffer.split('\n');
        sseBuffer = lines.pop() || '';

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
              scheduleTypewriter(assistantId, content);
            }
          } catch {}
        }
      }

      setLoading(false);
      setStreamingAssistantId(null);

      if (metaReceived) {
        if (typingRafRef.current[assistantId]) {
          cancelAnimationFrame(typingRafRef.current[assistantId]);
          delete typingRafRef.current[assistantId];
        }
        delete typingTargetRef.current[assistantId];
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? { ...m, content: fullText, tokens: metaReceived.assistantMessage.tokens, cost: metaReceived.assistantMessage.cost, model: metaReceived.assistantMessage.model }
              : m,
          ),
        );
        if (!currentConversationId) setCurrentConversationId(metaReceived.conversationId);
      }

      // Refresh sidebar and update costs
      try {
        const { data: convos } = await axios.get(getApiUrl('/chat'));
        setConversations(convos);
        if (!currentConversationId && convos.length > 0) setCurrentConversationId(convos[0].id);
        // Update costs
        const { data: todayData } = await axios.get(getApiUrl('/dashboard/today-cost'), { headers: authHeaders });
        setTodayCost(todayData.todayCost || 0);
        if (currentConversationId || (metaReceived && metaReceived.conversationId)) {
          const convId = currentConversationId || metaReceived.conversationId;
          const { data: convCostData } = await axios.get(getApiUrl(`/dashboard/conversation-cost/${convId}`), { headers: authHeaders });
          setCurrentChatCost(convCostData.cost || 0);
        }
      } catch {}
    } catch (error: any) {
      if (typingRafRef.current[assistantId]) {
        cancelAnimationFrame(typingRafRef.current[assistantId]);
        delete typingRafRef.current[assistantId];
      }
      delete typingTargetRef.current[assistantId];
      setLoading(false);
      setStreamingAssistantId(null);
      const errorContent = error.message || 'Failed to stream response.';
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: `**Error:** ${errorContent}` } : m));
      toast.error(errorContent);
    }
  };

  useEffect(() => {
    return () => {
      Object.values(typingRafRef.current).forEach(id => cancelAnimationFrame(id));
      typingRafRef.current = {};
      typingTargetRef.current = {};
    };
  }, []);

  // ── Other handlers ─────────────────────────────────────────────────────
  const loadConversation = async (id: string) => {
    try {
      const { data } = await axios.get(getApiUrl(`/chat/${id}`), {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const conv: ConversationWithMessages = data.conversation;
      setMessages(conv.messages);
      shouldScrollRef.current = true;
      setCurrentConversationId(id);
      setSelectedModel(normalizeModelId(conv.model));
      setAttachedBucketIds(new Set(conv.buckets?.map(b => b.id) || []));
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

  // ── Auth headers helper ─────────────────────────────────────────────
  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${localStorage.getItem('token')}` }), []);

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const { data } = await axios.post(getApiUrl('/folders'), { name: newFolderName.trim() }, { headers: authHeaders });
      setFolders(prev => [...prev, data]);
      setNewFolderName('');
      setShowNewFolder(false);
    } catch { toast.error('Failed to create folder'); }
  };

  const renameFolder = async (id: string) => {
    if (!editingFolderName.trim()) return;
    try {
      await axios.put(getApiUrl(`/folders/${id}`), { name: editingFolderName.trim() }, { headers: authHeaders });
      setFolders(prev => prev.map(f => f.id === id ? { ...f, name: editingFolderName.trim() } : f));
      setEditingFolderId(null);
    } catch { toast.error('Failed to rename folder'); }
  };

  const removeFolder = async (id: string) => {
    try {
      await axios.delete(getApiUrl(`/folders/${id}`), { headers: authHeaders });
      setFolders(prev => prev.filter(f => f.id !== id));
      setConversations(prev => prev.map(c => c.folderId === id ? { ...c, folderId: null } : c));
    } catch { toast.error('Failed to delete folder'); }
  };

  const moveToFolder = async (conversationId: string, folderId: string | null) => {
    try {
      await axios.put(getApiUrl('/folders/move'), { conversationId, folderId }, { headers: authHeaders });
      setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, folderId } : c));
      setMoveMenuConvId(null);
    } catch { toast.error('Failed to move'); }
  };

  const toggleBucket = async (bucketId: string) => {
    const next = new Set(attachedBucketIds);
    if (next.has(bucketId)) {
      next.delete(bucketId);
      if (currentConversationId) {
        axios.post(getApiUrl('/buckets/detach'), { conversationId: currentConversationId, bucketId }, { headers: authHeaders }).catch(() => {});
      }
    } else {
      next.add(bucketId);
      if (currentConversationId) {
        axios.post(getApiUrl('/buckets/attach'), { conversationId: currentConversationId, bucketId }, { headers: authHeaders }).catch(() => {});
      }
    }
    setAttachedBucketIds(next);
  };

  // Grouped conversations by folder
  const conversationsByFolder = useMemo(() => {
    const grouped: Record<string, Conversation[]> = { __unfiled: [] };
    folders.forEach(f => { grouped[f.id] = []; });
    conversations.forEach(conv => {
      const key = conv.folderId && grouped[conv.folderId] ? conv.folderId : '__unfiled';
      grouped[key].push(conv);
    });
    return grouped;
  }, [conversations, folders]);

  const toggleDarkMode = () => {
    setDarkMode(d => !d);
    document.documentElement.classList.toggle('dark');
  };

  /** Shared conversation item renderer for sidebar (used in both folder and unfiled sections) */
  const renderConversationItem = (conv: Conversation, inFolder: boolean) => {
    const active = currentConversationId === conv.id;
    const moveTargets = inFolder
      ? folders.filter(f => f.id !== conv.folderId)
      : folders;
    const showMoveMenu = moveMenuConvId === conv.id && (inFolder || folders.length > 0);
    return (
      <div
        key={conv.id}
        className={`group relative cursor-pointer rounded-lg transition-all duration-150 ${inFolder ? 'p-2 pl-7' : 'p-2.5'}`}
        style={{
          background: active ? theme.sidebarActive : undefined,
          borderLeft: active ? `3px solid ${theme.accent}` : '3px solid transparent',
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = theme.sidebarHover; }}
        onMouseLeave={e => { e.currentTarget.style.background = active ? theme.sidebarActive : 'transparent'; }}
        onClick={() => loadConversation(conv.id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="text-sm text-gray-200 truncate font-medium">{conv.title}</div>
            {sidebarOpen && <div className="text-[11px] text-gray-500 truncate mt-0.5">{new Date(conv.updatedAt).toLocaleDateString()} &middot; {conv.messageCount} msgs</div>}
          </div>
          {sidebarOpen && (
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-all">
              {(inFolder || folders.length > 0) && (
                <button onClick={e => { e.stopPropagation(); setMoveMenuConvId(moveMenuConvId === conv.id ? null : conv.id); }} className="p-1 text-gray-500 hover:text-gray-300" title="Move"><MoreHorizontal className="h-3.5 w-3.5" /></button>
              )}
              <button onClick={e => { e.stopPropagation(); deleteConversation(conv.id); }} className="p-1 text-gray-500 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          )}
        </div>
        {showMoveMenu && (
          <div className="absolute right-0 top-full mt-1 z-50 rounded-lg shadow-xl py-1 text-xs min-w-[140px]" style={{ background: darkMode ? '#2a2a2a' : '#fff', border: `1px solid ${darkMode ? '#444' : '#ddd'}` }}>
            {inFolder && (
              <button onClick={e => { e.stopPropagation(); moveToFolder(conv.id, null); }} className="w-full text-left px-3 py-1.5 hover:bg-white/10" style={{ color: darkMode ? '#ccc' : '#333' }}>Remove from folder</button>
            )}
            {moveTargets.map(f => (
              <button key={f.id} onClick={e => { e.stopPropagation(); moveToFolder(conv.id, f.id); }} className="w-full text-left px-3 py-1.5 hover:bg-white/10" style={{ color: darkMode ? '#ccc' : '#333' }}>
                Move to {f.name}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const newChat = () => {
    setMessages([]); setInput(''); setCurrentConversationId(null); setMobileSidebar(false);
    setSystemPrompt(''); setSelectedPersona('default');
    setPendingFiles([]); setPendingPreviews([]);
    setAttachedBucketIds(new Set());
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
    <>
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
                    value={ttsVoice}
                    onChange={e => { setTtsVoice(e.target.value); localStorage.setItem('tts-voice', e.target.value); }}
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

        {/* Conversations grouped by folders */}
        <div className="flex-1 px-3 overflow-y-auto scrollbar-thin">

          {/* New Folder button */}
          {sidebarOpen && (
            <div className="mb-1 mt-1">
              {showNewFolder ? (
                <div className="flex items-center gap-1 px-1">
                  <input
                    autoFocus
                    value={newFolderName}
                    onChange={e => setNewFolderName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') createFolder(); if (e.key === 'Escape') setShowNewFolder(false); }}
                    placeholder="Folder name..."
                    className="flex-1 text-xs bg-transparent text-gray-200 placeholder-gray-600 rounded px-2 py-1 focus:outline-none"
                    style={{ border: `1px solid ${theme.sidebarBorder}` }}
                  />
                  <button onClick={createFolder} className="p-1 text-gray-400 hover:text-green-400"><Plus className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setShowNewFolder(false)} className="p-1 text-gray-400 hover:text-red-400"><X className="h-3.5 w-3.5" /></button>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewFolder(true)}
                  className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-300 transition-colors px-1 py-1"
                >
                  <FolderPlus className="h-3.5 w-3.5" /> New Folder
                </button>
              )}
            </div>
          )}

          {/* Render each folder */}
          {folders.map(folder => {
            const folderConvs = conversationsByFolder[folder.id] || [];
            const collapsed = collapsedFolders.has(folder.id);
            return (
              <div key={folder.id} className="mb-1">
                {/* Folder header */}
                <div
                  className="group flex items-center gap-1 px-1.5 py-1.5 rounded-md cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setCollapsedFolders(prev => {
                    const next = new Set(prev);
                    next.has(folder.id) ? next.delete(folder.id) : next.add(folder.id);
                    return next;
                  })}
                >
                  {collapsed ? <ChevronRight className="h-3 w-3 text-gray-500 flex-shrink-0" /> : <ChevronDown className="h-3 w-3 text-gray-500 flex-shrink-0" />}
                  {collapsed ? <FolderIcon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" /> : <FolderOpen className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />}
                  {editingFolderId === folder.id ? (
                    <input
                      autoFocus
                      value={editingFolderName}
                      onChange={e => setEditingFolderName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') renameFolder(folder.id); if (e.key === 'Escape') setEditingFolderId(null); }}
                      onBlur={() => renameFolder(folder.id)}
                      onClick={e => e.stopPropagation()}
                      className="flex-1 text-xs bg-transparent text-gray-200 rounded px-1 py-0 focus:outline-none min-w-0"
                      style={{ border: `1px solid ${theme.accent}` }}
                    />
                  ) : (
                    <span className="flex-1 text-xs text-gray-300 truncate font-medium">{folder.name}</span>
                  )}
                  <span className="text-[10px] text-gray-600 mr-1">{folderConvs.length}</span>
                  {sidebarOpen && editingFolderId !== folder.id && (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                      <button onClick={e => { e.stopPropagation(); setEditingFolderId(folder.id); setEditingFolderName(folder.name); }} className="p-0.5 text-gray-500 hover:text-gray-300">
                        <PenLine className="h-3 w-3" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); removeFolder(folder.id); }} className="p-0.5 text-gray-500 hover:text-red-400">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
                {/* Folder conversations */}
                {!collapsed && folderConvs.map(conv => renderConversationItem(conv, true))}
              </div>
            );
          })}

          {/* Unfiled conversations */}
          {(conversationsByFolder['__unfiled'] || []).length > 0 && (
            <div className="mt-1">
              {sidebarOpen && folders.length > 0 && (
                <div className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold px-1.5 py-1">Chats</div>
              )}
              {(conversationsByFolder['__unfiled'] || []).map(conv => renderConversationItem(conv, false))}
            </div>
          )}

          {conversations.length === 0 && sidebarOpen && (
            <div className="text-xs text-gray-600 italic mt-2 px-1">No conversations yet</div>
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
              <button onClick={() => navigate('/buckets')} className="p-2 text-gray-500 hover:text-gray-300 transition-colors" title="Knowledge Buckets"><Database className="h-4 w-4" /></button>
              <button onClick={() => navigate('/profile')} className="p-2 text-gray-500 hover:text-gray-300 transition-colors" title="Settings"><UserIcon className="h-4 w-4" /></button>
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
      <div className="flex-1 flex flex-col min-w-0 relative" style={{ background: darkMode ? theme.mainBgDark : theme.mainBg }}>

        {/* Mobile hamburger — no visible header bar */}
        <div className="md:hidden absolute top-3 left-4 z-20">
          <button onClick={() => setMobileSidebar(true)} className="p-1.5" style={{ color: darkMode ? theme.textSecondaryDark : theme.textSecondary }}>
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* ── Messages / Welcome ────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-2 pb-48 scrollbar-thin relative">
          {/* Model name — top center, like ChatGPT */}
          <div className="pt-2 pb-1 text-center relative">
            <span className="text-sm font-medium inline-block" style={{ color: darkMode ? theme.textSecondaryDark : theme.textSecondary }}>
              {currentModel?.name || 'Own AI'}
            </span>
            
            {/* Cost display — top right absolute */}
            <div className="absolute right-0 top-2 text-[10px] opacity-40 hover:opacity-100 transition-opacity flex flex-col items-end gap-0.5" style={{ color: darkMode ? theme.textSecondaryDark : theme.textSecondary }}>
              {currentConversationId && currentChatCost > 0 && (
                <span>Chat: ${formatCurrency(currentChatCost)}</span>
              )}
              {todayCost > 0 && (
                <span>Today: ${formatCurrency(todayCost)}</span>
              )}
            </div>
          </div>

          {messages.length === 0 ? (
            <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-full py-12">
              {/* Provider icon */}
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-6"
                style={{ background: darkMode ? theme.aiIconBgDark : theme.aiIconBg }}
              >
                <span style={{ color: darkMode ? theme.aiIconColorDark : theme.aiIconColor, fontSize: '28px', lineHeight: 1 }}>
                  {theme.aiIcon}
                </span>
              </div>
              <h2 className="text-3xl font-semibold mb-2" style={{ color: darkMode ? theme.textPrimaryDark : theme.textPrimary }}>
                What can I help with?
              </h2>
              <p className="text-sm mb-10" style={{ color: darkMode ? theme.textSecondaryDark : theme.textSecondary }}>
                {currentModel ? currentModel.name : 'Choose a model to get started'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(s.text); inputRef.current?.focus(); }}
                    className="group flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-sm transition-all duration-200"
                    style={{
                      background: darkMode ? theme.inputBgDark : theme.inputBg,
                      border: `1px solid ${darkMode ? theme.inputBorderDark : theme.inputBorder}`,
                      color: darkMode ? theme.textPrimaryDark : theme.textSecondary,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.color = darkMode ? theme.textPrimaryDark : theme.textPrimary; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = darkMode ? theme.inputBorderDark : theme.inputBorder; e.currentTarget.style.color = darkMode ? theme.textPrimaryDark : theme.textSecondary; }}
                  >
                    <s.icon className="h-4 w-4 flex-shrink-0 transition-colors" style={{ color: darkMode ? theme.textSecondaryDark : theme.textSecondary }} />
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
                          style={{ background: darkMode ? theme.aiIconBgDark : theme.aiIconBg }}
                        >
                          <span style={{ color: darkMode ? theme.aiIconColorDark : theme.aiIconColor, fontSize: '16px', lineHeight: 1 }}>
                            {theme.aiIcon}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <AIMessage
                            content={message.content}
                            darkMode={darkMode}
                            reasoningContent={message.reasoningContent}
                            isStreaming={streamingAssistantId === message.id}
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
                              <span className="text-[11px]" style={{ color: darkMode ? theme.metaTextDark : theme.metaText }}>
                                {models.find(m => m.id === normalizeModelId(message.model || ''))?.name || normalizeModelId(message.model)}
                              </span>
                            )}
                            {message.cost != null && (
                              <span className="text-[11px]" style={{ color: darkMode ? theme.metaTextDark : theme.metaText }}>
                                $ {formatCurrency(message.cost)}
                              </span>
                            )}
                            {message.tokens != null && (
                              <span className="text-[11px]" style={{ color: darkMode ? theme.metaTextDark : theme.metaText }}>
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
                          background: darkMode ? theme.userBubbleDark : theme.userBubble,
                          color: darkMode ? theme.userBubbleTextDark : theme.userBubbleText,
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
              {(() => {
                if (!loading) return null;
                const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
                if (lastAssistant?.content) return null;
                return (
                  <ThinkingIndicator
                    modelName={currentModel?.name ?? 'AI'}
                    reasoningContent={lastAssistant?.reasoningContent || ''}
                    theme={theme}
                    darkMode={darkMode}
                  />
                );
              })()}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ══ INPUT AREA (floating over messages) ════════════════════════ */}
        <div className="absolute bottom-0 left-0 right-0 z-10 theme-transition">
          {/* Gradient fade */}
          <div className="h-16 pointer-events-none" style={{
            background: `linear-gradient(to bottom, transparent, ${darkMode ? theme.mainBgDark : theme.mainBg})`,
          }} />
          <div className="px-4 md:px-6 pb-4 pt-0" style={{ background: darkMode ? theme.mainBgDark : theme.mainBg }}>
          <div className="max-w-[52rem] mx-auto">

            {/* File previews */}
            {pendingFiles.length > 0 && (
              <div className="flex gap-2 mb-3 flex-wrap animate-fade-in">
                {pendingFiles.map((file, i) => (
                  <div key={i} className="relative group animate-scale-in">
                    {file.type.startsWith('image/') ? (
                      <div className="relative">
                        <img src={pendingPreviews[i]} alt={file.name} className="h-16 w-16 object-cover rounded-xl" style={{ border: `2px solid ${darkMode ? theme.inputBorderDark : theme.inputBorder}` }} />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-b-xl truncate">{file.name}</div>
                      </div>
                    ) : (
                      <div className="h-16 w-24 rounded-xl flex flex-col items-center justify-center gap-1 px-2" style={{ background: darkMode ? theme.inputBgDark : theme.inputBg, border: `2px solid ${darkMode ? theme.inputBorderDark : theme.inputBorder}` }}>
                        {(() => { const Icon = getFileIcon(file.name, file.type); return <Icon className="h-5 w-5" style={{ color: theme.accent }} />; })()}
                        <span className="text-[9px] truncate max-w-full font-medium" style={{ color: darkMode ? '#ccc' : '#555' }}>{file.name}</span>
                      </div>
                    )}
                    <button onClick={() => removeFile(i)} className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Model Recommendation Badge */}
            {modelRecommendation && showRecommendation && (selectedModel !== modelRecommendation.recommendedModel || (modelRecommendation.enableDeepSearch && !deepSearch)) && (
              <div className="mb-3 p-3 rounded-2xl animate-fade-in" style={{ background: `${theme.accent}15`, border: `1px solid ${theme.accent}40` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ color: theme.accent }} className="text-lg">💡</span>
                      <span className="text-sm font-semibold" style={{ color: darkMode ? theme.textPrimaryDark : theme.textPrimary }}>
                        {selectedModel === modelRecommendation.recommendedModel && modelRecommendation.enableDeepSearch
                          ? 'Enable Deep Search?'
                          : `Recommended: ${models.find(m => m.id === modelRecommendation.recommendedModel)?.name || modelRecommendation.recommendedModel}`}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${theme.accent}25`, color: theme.accent }}>
                        {Math.round(modelRecommendation.confidence * 100)}%
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: darkMode ? theme.textSecondaryDark : theme.textSecondary }}>
                      {modelRecommendation.reasoning}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        setSelectedModel(modelRecommendation.recommendedModel);
                        if (modelRecommendation.enableDeepSearch) setDeepSearch(true);
                        setShowRecommendation(false);
                      }}
                      className="px-2 py-1 rounded-lg text-xs font-medium transition-colors"
                      style={{ background: theme.accent, color: '#fff' }}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => setShowRecommendation(false)}
                      className="px-2 py-1 rounded-lg text-xs font-medium transition-colors"
                      style={{ background: darkMode ? '#333' : '#e0e0e0', color: darkMode ? '#ccc' : '#666' }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Main input box ─────────────────────────────────────── */}
            <div
              className="rounded-3xl transition-all duration-200"
              style={{
                background: darkMode ? theme.inputBgDark : theme.inputBg,
                border: `1px solid ${darkMode ? theme.inputBorderDark : theme.inputBorder}`,
                boxShadow: darkMode ? '0 2px 16px rgba(0,0,0,0.3)' : '0 1px 8px rgba(0,0,0,0.06)',
              }}
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (
                  target.closest('button') ||
                  target.closest('select') ||
                  target.closest('input') ||
                  target.closest('textarea') ||
                  target.closest('a')
                ) {
                  return;
                }
                inputRef.current?.focus();
              }}
            >
              {/* Textarea row */}
              <div className="flex items-end gap-1 px-4 pt-3 pb-2">
                <button
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors hover:bg-black/5 dark:hover:bg-white/5 mb-0.5"
                  style={{ color: pendingFiles.length > 0 ? theme.accent : darkMode ? '#666' : '#b0b0b0' }}
                  title="Attach files"
                >
                  <Paperclip className="h-[18px] w-[18px]" />
                </button>
                <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.txt,.csv,.md,.json" className="hidden" onChange={handleFileSelect} />
                <input ref={pdfAudioInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handlePdfAudioFileSelect} />

                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={uploading ? 'Uploading...' : deepSearch ? 'Search the web...' : theme.placeholder}
                  className="flex-1 resize-none bg-transparent px-2 py-1.5 text-[15px] focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600"
                  style={{ color: darkMode ? theme.textPrimaryDark : theme.textPrimary }}
                  rows={1}
                  maxLength={10000}
                  disabled={uploading}
                />

                {/* Mic button (speech-to-text) */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleMicToggle(); }}
                  disabled={isTranscribing}
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors hover:bg-black/5 dark:hover:bg-white/5 mb-0.5 ${isRecording ? 'animate-pulse' : ''}`}
                  style={{ color: isRecording ? '#ef4444' : isTranscribing ? theme.accent : darkMode ? '#666' : '#b0b0b0' }}
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

                {/* Real-time voice mode button */}
                <button
                  onClick={(e) => { e.stopPropagation(); setVoiceModeActive(true); }}
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors hover:bg-black/5 dark:hover:bg-white/5 mb-0.5"
                  style={{ color: darkMode ? '#666' : '#b0b0b0' }}
                  title="Real-time voice conversation"
                >
                  <Waves className="h-[18px] w-[18px]" />
                </button>

                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && !pendingFiles.length) || loading || uploading}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed mb-0.5"
                  style={{ background: (!input.trim() && !pendingFiles.length) || loading ? (darkMode ? '#444' : '#d9d9d9') : theme.accent, color: '#fff' }}
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
                <div className="relative">
                  <button
                    onClick={() => setShowPdfAudioPanel(prev => !prev)}
                    disabled={pdfAudioLoading}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200"
                    style={{
                      background: showPdfAudioPanel ? theme.accent : darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                      color: showPdfAudioPanel ? '#fff' : darkMode ? '#aaa' : '#888',
                    }}
                    title="PDF to audio/podcast generator"
                  >
                    <FileText className="h-3 w-3" />
                    PDF Audio
                  </button>
                  {showPdfAudioPanel && (
                    <div
                      className="absolute bottom-full mb-2 left-0 rounded-xl shadow-2xl p-3 min-w-[280px] z-50 animate-fade-in"
                      style={{ background: darkMode ? '#2a2a2a' : '#fff', border: `1px solid ${darkMode ? '#444' : '#ddd'}` }}
                    >
                      <div className="text-[11px] font-semibold mb-2" style={{ color: darkMode ? '#bbb' : '#666' }}>
                        PDF → Audio / Podcast
                      </div>
                      <div className="grid grid-cols-3 gap-1 mb-2">
                        {(['summary', 'narration', 'podcast'] as const).map(mode => (
                          <button
                            key={mode}
                            onClick={() => setPdfAudioMode(mode)}
                            className="px-2 py-1 rounded text-[10px] font-medium"
                            style={{
                              background: pdfAudioMode === mode ? theme.accent : darkMode ? '#3a3a3a' : '#f3f4f6',
                              color: pdfAudioMode === mode ? '#fff' : darkMode ? '#bbb' : '#555',
                            }}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2 mb-2">
                        <select
                          value={pdfAudioVoice}
                          onChange={e => setPdfAudioVoice(e.target.value)}
                          className="flex-1 text-xs rounded px-2 py-1 bg-transparent"
                          style={{ border: `1px solid ${darkMode ? '#555' : '#ddd'}`, color: darkMode ? '#ddd' : '#333' }}
                        >
                          {['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer'].map(v => (
                            <option key={v} value={v} className="bg-gray-800">{v}</option>
                          ))}
                        </select>
                        {pdfAudioMode === 'podcast' && (
                          <select
                            value={pdfAudioSecondaryVoice}
                            onChange={e => setPdfAudioSecondaryVoice(e.target.value)}
                            className="flex-1 text-xs rounded px-2 py-1 bg-transparent"
                            style={{ border: `1px solid ${darkMode ? '#555' : '#ddd'}`, color: darkMode ? '#ddd' : '#333' }}
                          >
                            {['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer'].map(v => (
                              <option key={v} value={v} className="bg-gray-800">{v}</option>
                            ))}
                          </select>
                        )}
                      </div>
                      <button
                        onClick={() => pdfAudioInputRef.current?.click()}
                        disabled={pdfAudioLoading}
                        className="w-full px-2 py-1.5 rounded text-xs font-medium"
                        style={{ background: theme.accent, color: '#fff', opacity: pdfAudioLoading ? 0.6 : 1 }}
                      >
                        {pdfAudioLoading ? 'Generating…' : 'Choose PDF & Generate'}
                      </button>
                    </div>
                  )}
                </div>
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
                            : darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                          color: reasoningEffort === level
                            ? '#fff'
                            : darkMode ? '#aaa' : '#888',
                        }}
                      >
                        {level === 'low' ? '⚡ Low' : level === 'medium' ? '🧠 Medium' : '💎 High'}
                      </button>
                    ))}
                  </div>
                )}

                {/* Deep search toggle and modes */}
                {(currentModel?.provider === 'OpenAI' || currentModel?.provider === 'Google' || currentModel?.provider === 'Anthropic') && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        if (!deepSearch) { setDeepSearch(true); setSearchMode('auto'); }
                        else { setDeepSearch(false); setShowSearchOptions(false); }
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200"
                      style={{
                        background: deepSearch ? theme.accent : darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        color: deepSearch ? '#fff' : darkMode ? '#aaa' : '#888',
                      }}
                      title="Search the web"
                    >
                      <Globe className="h-3 w-3" />
                      Search
                    </button>
                    {deepSearch && (
                      <div className="relative">
                        <button
                          onClick={() => setShowSearchOptions(prev => !prev)}
                          className="px-1.5 py-1 rounded-full text-[10px] font-medium transition-all duration-200 hover:bg-black/10 dark:hover:bg-white/10"
                          style={{ color: darkMode ? '#aaa' : '#666' }}
                          title="Search Options"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        {showSearchOptions && (
                          <div
                            className="fixed bottom-20 left-1/2 -translate-x-1/2 rounded-xl shadow-2xl p-2 min-w-[320px] max-h-[60vh] overflow-y-auto z-[100] animate-fade-in"
                            style={{ background: darkMode ? '#2a2a2a' : '#fff', border: `1px solid ${darkMode ? '#444' : '#ddd'}` }}
                          >
                            <div className="flex items-center justify-between px-2 py-1 mb-1">
                              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: darkMode ? '#888' : '#999' }}>Search Mode</span>
                              <button onClick={() => setShowSearchOptions(false)} className="text-gray-400 hover:text-gray-200"><X className="h-3 w-3" /></button>
                            </div>
                            
                            <button
                              onClick={() => setSearchMode('auto')}
                              className={`w-full text-left px-2 py-2 rounded-lg text-xs mb-1 transition-colors ${searchMode === 'auto' ? 'bg-blue-500/10 text-blue-500' : 'hover:bg-black/5 dark:hover:bg-white/5 text-gray-500'}`}
                            >
                              <div className="font-medium">✨ Auto (Normal)</div>
                              <div className="text-[10px] opacity-70 mt-0.5">Best results from all sources</div>
                            </button>

                            <button
                              onClick={() => setSearchMode('human')}
                              className={`w-full text-left px-2 py-2 rounded-lg text-xs mb-1 transition-colors ${searchMode === 'human' ? 'bg-orange-500/10 text-orange-500' : 'hover:bg-black/5 dark:hover:bg-white/5 text-gray-500'}`}
                            >
                              <div className="font-medium">👤 Human-First</div>
                              <div className="text-[10px] opacity-70 mt-0.5">Forums, Reddit, real discussions only</div>
                            </button>

                            <button
                              onClick={() => setSearchMode('pre_ai')}
                              className={`w-full text-left px-2 py-2 rounded-lg text-xs mb-1 transition-colors ${searchMode === 'pre_ai' ? 'bg-green-500/10 text-green-500' : 'hover:bg-black/5 dark:hover:bg-white/5 text-gray-500'}`}
                            >
                              <div className="font-medium">🕰️ Pre-AI Era</div>
                              <div className="text-[10px] opacity-70 mt-0.5">Content before 2023 (No AI slop)</div>
                            </button>

                            <button
                              onClick={() => setSearchMode('custom')}
                              className={`w-full text-left px-2 py-2 rounded-lg text-xs mb-1 transition-colors ${searchMode === 'custom' ? 'bg-purple-500/10 text-purple-500' : 'hover:bg-black/5 dark:hover:bg-white/5 text-gray-500'}`}
                            >
                              <div className="font-medium">🎯 Custom Collection</div>
                              <div className="text-[10px] opacity-70 mt-0.5 whitespace-normal">Search only specific websites</div>
                            </button>

                            {searchMode === 'custom' && (
                              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                <div className="text-[10px] mb-1 font-medium text-gray-500">Allowed Sites (e.g. arxiv.org):</div>
                                <div className="flex gap-1 mb-2">
                                  <input
                                    value={customSiteInput}
                                    onChange={e => setCustomSiteInput(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter' && customSiteInput.trim()) {
                                        setCustomSearchSites(prev => [...prev, customSiteInput.trim()]);
                                        setCustomSiteInput('');
                                      }
                                    }}
                                    className="flex-1 text-xs bg-transparent border rounded px-1.5 py-1 focus:outline-none focus:border-blue-500"
                                    style={{ borderColor: darkMode ? '#555' : '#ddd', color: darkMode ? '#ddd' : '#333' }}
                                    placeholder="Add domain..."
                                  />
                                  <button
                                    onClick={() => {
                                      if (customSiteInput.trim()) {
                                        setCustomSearchSites(prev => [...prev, customSiteInput.trim()]);
                                        setCustomSiteInput('');
                                      }
                                    }}
                                    className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
                                  >
                                    +
                                  </button>
                                </div>
                                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                                  {customSearchSites.map((site, idx) => (
                                    <span key={idx} className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                      {site}
                                      <button onClick={() => setCustomSearchSites(prev => prev.filter((_, i) => i !== idx))} className="hover:text-red-500">×</button>
                                    </span>
                                  ))}
                                  {customSearchSites.length === 0 && <span className="text-[10px] text-gray-400 italic">No sites added yet</span>}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Bucket selector */}
                {availableBuckets.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowBucketSelector(prev => !prev)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200"
                      style={{
                        background: attachedBucketIds.size > 0 ? theme.accent : darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        color: attachedBucketIds.size > 0 ? '#fff' : darkMode ? '#aaa' : '#888',
                      }}
                      title="Attach knowledge buckets"
                    >
                      <Database className="h-3 w-3" />
                      {attachedBucketIds.size > 0 ? `${attachedBucketIds.size} bucket${attachedBucketIds.size > 1 ? 's' : ''}` : 'Buckets'}
                    </button>
                    {showBucketSelector && (
                      <div
                        className="absolute bottom-full mb-2 left-0 rounded-xl shadow-2xl py-2 min-w-[200px] z-50"
                        style={{ background: darkMode ? '#2a2a2a' : '#fff', border: `1px solid ${darkMode ? '#444' : '#ddd'}` }}
                      >
                        <div className="px-3 py-1 text-[11px] font-semibold" style={{ color: darkMode ? '#888' : '#999' }}>
                          Attach Knowledge
                        </div>
                        {availableBuckets.map(bucket => (
                          <label
                            key={bucket.id}
                            className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-white/5 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={attachedBucketIds.has(bucket.id)}
                              onChange={() => toggleBucket(bucket.id)}
                              className="rounded accent-blue-500"
                            />
                            <span className="text-xs truncate" style={{ color: darkMode ? '#ddd' : '#333' }}>{bucket.name}</span>
                          </label>
                        ))}
                        <div className="border-t mt-1 pt-1 px-3" style={{ borderColor: darkMode ? '#444' : '#eee' }}>
                          <button onClick={() => { setShowBucketSelector(false); navigate('/buckets'); }} className="text-[11px] hover:underline" style={{ color: theme.accent }}>
                            Manage buckets →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <p className="text-center text-[11px] mt-2.5" style={{ color: darkMode ? '#555' : '#b0b0b0' }}>
              {theme.disclaimer}
            </p>
          </div>
          </div>
        </div>
      </div>
    </div>

      {/* Voice Mode Overlay */}
      {voiceModeActive && (
        <VoiceMode
          onClose={(convId) => {
            setVoiceModeActive(false);
            // Refresh sidebar to show the new voice conversation
            if (convId) {
              axios.get(getApiUrl('/chat'), { headers: authHeaders }).then(({ data }) => {
                setConversations(data);
              }).catch(() => {});
            }
          }}
          theme={theme}
          darkMode={darkMode}
          // Intelligently select voice model based on current chat model
          model={(() => {
            if (currentModel?.provider === 'Google') return 'gemini-2.5-flash';
            if (currentModel?.provider === 'Anthropic') {
              if (currentModel?.id.includes('opus')) return 'claude-opus-4-6';
              if (currentModel?.id.includes('haiku')) return 'claude-haiku-4-5-20251001';
              return 'claude-sonnet-4-6';
            }
            if (currentModel?.id === 'gpt-5-mini') return 'gpt-realtime-mini';
            return 'gpt-realtime-1.5';
          })()}
          // Intelligently select default voice
          voice={(() => {
            if (currentModel?.provider === 'Google') return 'coral'; // Bright
            if (currentModel?.provider === 'Anthropic') return 'verse'; // Dynamic
            return 'ash'; // Default OpenAI
          })()}
        />
      )}
    </>
  );
};

export default ChatInterface;
