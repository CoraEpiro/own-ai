import { useEffect, useRef } from 'react';
import { Phone } from 'lucide-react';
import { useVoiceMode, VoiceState, VoiceId, RealtimeModelId } from '../hooks/useVoiceMode';
import { ProviderTheme } from '../config/themes';

interface VoiceModeProps {
  onClose: (conversationId?: string | null) => void;
  theme: ProviderTheme;
  darkMode: boolean;
  voice: VoiceId;
  model: RealtimeModelId;
}

const STATE_LABELS: Record<VoiceState, string> = {
  connecting: 'Connecting...',
  ready: 'Listening',
  listening: 'Listening...',
  thinking: 'Thinking...',
  speaking: '',
  error: 'Connection error',
};

function getOrbClass(state: VoiceState): string {
  switch (state) {
    case 'ready':
      return 'voice-orb-breathe';
    case 'connecting':
      return 'voice-orb-breathe';
    case 'listening':
      return 'voice-orb-listen';
    case 'thinking':
      return 'voice-orb-think';
    case 'speaking':
      return 'voice-orb-speak';
    case 'error':
      return '';
    default:
      return 'voice-orb-breathe';
  }
}

export default function VoiceMode({ onClose, theme, darkMode, voice, model }: VoiceModeProps) {
  const { state, transcript, userTranscript, error, conversationId, connect, disconnect } = useVoiceMode();
  const transcriptRef = useRef<HTMLDivElement>(null);

  // Connect on mount with selected voice and model
  useEffect(() => {
    connect(voice, model);
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  const handleClose = () => {
    disconnect();
    onClose(conversationId);
  };

  const orbColor = theme.accent;

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center animate-fade-in"
      style={{
        zIndex: 9999,
        background: darkMode
          ? 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0f 100%)'
          : 'radial-gradient(ellipse at center, #f8f9ff 0%, #e8ecf4 100%)',
      }}
    >
      {/* Centered content */}
      <div className="flex flex-col items-center justify-center flex-1 w-full max-w-lg px-6">

        {/* User transcript — what you said */}
        {userTranscript && state !== 'listening' && (
          <p
            className="mb-8 text-sm text-center opacity-60 max-w-md animate-fade-in"
            style={{ color: darkMode ? '#999' : '#777' }}
          >
            {userTranscript}
          </p>
        )}

        {/* Orb container */}
        <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
          {/* Outer glow ring */}
          <div
            className={`absolute inset-0 rounded-full ${getOrbClass(state)}`}
            style={{
              background: `radial-gradient(circle, ${orbColor}20 0%, transparent 70%)`,
              ['--orb-color' as string]: orbColor + '55',
              transform: 'scale(1.4)',
            }}
          />
          {/* Main orb */}
          <div
            className={`rounded-full ${getOrbClass(state)}`}
            style={{
              width: 140,
              height: 140,
              background: `radial-gradient(circle at 40% 35%, ${orbColor}ee, ${orbColor}aa, ${orbColor}55)`,
              ['--orb-color' as string]: orbColor + '66',
              boxShadow: `0 0 60px ${orbColor}33, 0 0 120px ${orbColor}11`,
            }}
          />
        </div>

        {/* State label */}
        <div className="mt-8 h-8 flex items-center justify-center">
          {state === 'error' ? (
            <p className="text-sm font-medium" style={{ color: '#ef4444' }}>
              {error || 'Connection error'}
            </p>
          ) : state === 'connecting' ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
              <p className="text-sm" style={{ color: darkMode ? '#888' : '#999' }}>
                Connecting...
              </p>
            </div>
          ) : STATE_LABELS[state] ? (
            <p
              className="text-sm font-medium transition-all duration-300"
              style={{ color: darkMode ? '#888' : '#999' }}
            >
              {STATE_LABELS[state]}
            </p>
          ) : null}
        </div>

        {/* AI transcript — what AI is saying */}
        {transcript && (
          <div
            ref={transcriptRef}
            className="mt-6 max-h-40 overflow-y-auto scrollbar-thin animate-fade-in"
            style={{ maxWidth: 480 }}
          >
            <p
              className="text-base leading-relaxed text-center"
              style={{ color: darkMode ? '#ddd' : '#333' }}
            >
              {transcript}
            </p>
          </div>
        )}

        {/* Retry on error */}
        {state === 'error' && (
          <button
            onClick={() => {
              disconnect();
              connect(voice, model);
            }}
            className="mt-6 px-5 py-2 rounded-full text-sm font-medium transition-colors"
            style={{
              backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
              color: darkMode ? '#ccc' : '#555',
            }}
          >
            Try Again
          </button>
        )}
      </div>

      {/* Bottom bar with end call button */}
      <div className="pb-12 flex flex-col items-center gap-3">
        <button
          onClick={handleClose}
          className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            backgroundColor: '#ef4444',
            boxShadow: '0 4px 20px rgba(239,68,68,0.35)',
          }}
          aria-label="End voice conversation"
        >
          <Phone className="h-6 w-6 text-white" style={{ transform: 'rotate(135deg)' }} />
        </button>
        <span className="text-xs" style={{ color: darkMode ? '#555' : '#bbb' }}>
          End
        </span>
      </div>
    </div>
  );
}
