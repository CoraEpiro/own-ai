import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import rehypeKatex from 'rehype-katex';
import mermaid from 'mermaid';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Copy, Check, Volume2, VolumeX, Loader2, ChevronDown,
  ThumbsUp, ThumbsDown, RotateCcw,
} from 'lucide-react';
import { getApiUrl } from '../config/api';

interface ActionTheme {
  actionIcon: string;
  actionIconDark: string;
  actionIconHover: string;
  actionIconHoverDark: string;
}

interface AIMessageProps {
  content: string;
  darkMode?: boolean;
  reasoningContent?: string;
  isStreaming?: boolean;
  actionTheme?: ActionTheme;
  onRetry?: () => void;
}

// ── Copy button inside code blocks ───────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-700/60 hover:bg-gray-600/80 text-gray-300 hover:text-white transition-colors"
      title={copied ? 'Copied!' : 'Copy code'}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function MermaidBlock({ code, darkMode }: { code: string; darkMode: boolean }) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const id = useMemo(() => `mermaid-${Math.random().toString(36).slice(2)}`, []);

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: darkMode ? 'dark' : 'default',
          securityLevel: 'strict',
        });
        const { svg } = await mermaid.render(id, code);
        if (!cancelled) {
          setSvg(svg);
          setError('');
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Failed to render Mermaid diagram');
        }
      }
    };
    render();
    return () => { cancelled = true; };
  }, [code, darkMode, id]);

  if (error) {
    return (
      <div className="my-4">
        <div className="text-xs mb-1 text-red-500">{error}</div>
        <pre className="p-3 rounded-lg bg-zinc-800 text-zinc-200 overflow-x-auto text-sm">{code}</pre>
      </div>
    );
  }

  return (
    <div
      className="my-4 overflow-x-auto rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

// ── TTS Button (used inside action row) ──────────────────────────────────
function TTSButton({ text, iconColor }: { text: string; iconColor: string }) {
  const [ttsState, setTtsState] = useState<'idle' | 'loading' | 'playing'>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleSpeak = useCallback(async () => {
    if (ttsState === 'playing') {
      audioRef.current?.pause();
      audioRef.current = null;
      setTtsState('idle');
      return;
    }

    setTtsState('loading');
    try {
      const voice = localStorage.getItem('tts-voice') || 'nova';
      const response = await fetch(getApiUrl('/audio/speech'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ text: text.substring(0, 4096), voice }),
      });

      if (!response.ok) throw new Error('TTS failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => { setTtsState('idle'); URL.revokeObjectURL(url); audioRef.current = null; };
      audio.onerror = () => { setTtsState('idle'); URL.revokeObjectURL(url); audioRef.current = null; };

      await audio.play();
      setTtsState('playing');
    } catch {
      setTtsState('idle');
    }
  }, [text, ttsState]);

  return (
    <button onClick={handleSpeak} className="action-btn" title={ttsState === 'playing' ? 'Stop' : 'Read aloud'} style={{ color: iconColor }}>
      {ttsState === 'loading' ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : ttsState === 'playing' ? (
        <VolumeX className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
    </button>
  );
}

// ── Action buttons row (copy, thumbs, retry, TTS) ────────────────────────
function MessageActions({ text, theme, darkMode, onRetry }: {
  text: string;
  theme: ActionTheme;
  darkMode: boolean;
  onRetry?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyAll = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  const iconColor = darkMode ? theme.actionIconDark : theme.actionIcon;

  return (
    <div className="flex items-center gap-0.5 mt-3">
      <button onClick={handleCopyAll} className="action-btn" title={copied ? 'Copied!' : 'Copy'} style={{ color: iconColor }}>
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
      <button className="action-btn" title="Good response" style={{ color: iconColor }}>
        <ThumbsUp className="h-4 w-4" />
      </button>
      <button className="action-btn" title="Bad response" style={{ color: iconColor }}>
        <ThumbsDown className="h-4 w-4" />
      </button>
      {onRetry && (
        <button onClick={onRetry} className="action-btn" title="Retry" style={{ color: iconColor }}>
          <RotateCcw className="h-4 w-4" />
        </button>
      )}
      <TTSButton text={text} iconColor={iconColor} />
    </div>
  );
}

// ── Collapsed reasoning block ────────────────────────────────────────────
function ReasoningBlock({ content, darkMode }: { content: string; darkMode: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const lines = content.split(/[.\n]/).filter(l => l.trim().length > 5);
  const thoughtCount = Math.max(1, lines.length);

  return (
    <div className="mb-3">
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-2 text-sm transition-colors hover:opacity-80"
        style={{ color: darkMode ? '#888' : '#999' }}
      >
        <span className="thinking-sparkle" style={{ fontSize: '12px', color: darkMode ? '#666' : '#aaa' }}>✦</span>
        <span>{thoughtCount} thoughts</span>
        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div
          className="mt-2 pl-5 text-sm leading-relaxed border-l-2 overflow-y-auto thinking-text"
          style={{ color: darkMode ? '#777' : '#aaa', borderColor: darkMode ? '#333' : '#e0e0e0', maxHeight: '300px', fontStyle: 'italic' }}
        >
          {content}
        </div>
      )}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────
export default function AIMessage({ content, darkMode = false, reasoningContent, isStreaming = false, actionTheme, onRetry }: AIMessageProps) {
  if (!content) {
    return (
      <span className="inline-block w-2 h-5 bg-gray-400 dark:bg-gray-500 animate-pulse rounded-sm" />
    );
  }

  return (
    <div>
      {/* Collapsed reasoning */}
      {reasoningContent && (
        <ReasoningBlock content={reasoningContent} darkMode={darkMode} />
      )}

      {/* Markdown content */}
      <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert prose-code:before:hidden prose-code:after:hidden prose-pre:bg-transparent prose-pre:p-0 prose-pre:shadow-none prose-table:rounded-lg prose-table:border prose-table:border-gray-200 dark:prose-table:border-zinc-700 prose-th:bg-gray-100 dark:prose-th:bg-zinc-800 prose-blockquote:border-l-4 prose-blockquote:border-blue-400 dark:prose-blockquote:border-blue-600 prose-blockquote:bg-blue-50/50 dark:prose-blockquote:bg-blue-900/10">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
          rehypePlugins={[rehypeKatex]}
          components={{
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || '');
              const codeText = String(children).replace(/\n$/, '');

              if (!inline && match && match[1].toLowerCase() === 'mermaid') {
                return <MermaidBlock code={codeText} darkMode={darkMode} />;
              }

              if (!inline && match) {
                return (
                  <div className="relative group my-4">
                    <div className="flex items-center justify-between bg-gray-800 dark:bg-zinc-700 text-gray-400 text-xs px-4 py-1.5 rounded-t-lg">
                      <span>{match[1]}</span>
                    </div>
                    <CopyButton text={codeText} />
                    <SyntaxHighlighter
                      style={darkMode ? oneDark : oneDark}
                      language={match[1]}
                      PreTag="div"
                      className="!rounded-t-none !mt-0 text-sm !rounded-b-lg"
                      customStyle={{ margin: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
                      {...props}
                    >
                      {codeText}
                    </SyntaxHighlighter>
                  </div>
                );
              }

              if (!inline && !match) {
                return (
                  <div className="relative group my-4">
                    <CopyButton text={codeText} />
                    <SyntaxHighlighter
                      style={oneDark}
                      language="text"
                      PreTag="div"
                      className="text-sm !rounded-lg"
                      customStyle={{ margin: 0 }}
                      {...props}
                    >
                      {codeText}
                    </SyntaxHighlighter>
                  </div>
                );
              }

              return (
                <code className="bg-gray-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              );
            },

            img({ src, alt }: any) {
              return (
                <img
                  src={src} alt={alt}
                  className="max-w-full rounded-lg border border-gray-200 dark:border-zinc-700 my-2 mx-auto"
                  loading="lazy" style={{ maxHeight: 400 }}
                />
              );
            },

            a(props: any) {
              return <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline hover:no-underline" />;
            },

            table(props: any) {
              return (
                <div className="overflow-x-auto my-4">
                  <table className="min-w-full" {...props} />
                </div>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
        {isStreaming && (
          <span
            className="inline-block w-[2px] h-[1em] align-[-0.15em] ml-0.5 animate-blink rounded-sm"
            style={{ background: darkMode ? '#9ca3af' : '#6b7280' }}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Action buttons — always visible, like ChatGPT/Claude/Gemini */}
      {actionTheme && (
        <MessageActions text={content} theme={actionTheme} darkMode={darkMode} onRetry={onRetry} />
      )}
    </div>
  );
}
