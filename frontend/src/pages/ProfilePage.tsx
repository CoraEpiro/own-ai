import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../config/api';
import { Save, User, ArrowLeft, Check, Loader2, FileText, Mic, Brain, X, Trash2 } from 'lucide-react';
import { VOICE_OPTIONS, VoiceId, REALTIME_MODELS, RealtimeModelId } from '../hooks/useVoiceMode';
import { Memory } from '../types';

const MAX_BIO_LENGTH = 2000;

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [bio, setBio] = useState('');
  const [originalBio, setOriginalBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceId>(
    () => (localStorage.getItem('voiceMode_voice') as VoiceId) || 'ash'
  );
  const [selectedModel, setSelectedModel] = useState<RealtimeModelId>(
    () => (localStorage.getItem('voiceMode_model') as RealtimeModelId) || 'gpt-realtime-1.5'
  );
  // Memories
  const [memories, setMemories] = useState<Memory[]>([]);
  const [memoriesLoading, setMemoriesLoading] = useState(true);
  const [deletingMemoryId, setDeletingMemoryId] = useState<string | null>(null);

  const authHeaders = { Authorization: `Bearer ${localStorage.getItem('token')}` };

  // Fetch bio + memories on mount
  useEffect(() => {
    (async () => {
      try {
        const [bioRes, memRes] = await Promise.all([
          axios.get(getApiUrl('/user/bio'), { headers: authHeaders }).catch(() => ({ data: { bio: '' } })),
          axios.get(getApiUrl('/memories'), { headers: authHeaders }).catch(() => ({ data: [] })),
        ]);
        setBio(bioRes.data.bio || '');
        setOriginalBio(bioRes.data.bio || '');
        setMemories(memRes.data || []);
      } catch {
        // fallback
      } finally {
        setLoading(false);
        setMemoriesLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(
        getApiUrl('/user/bio'),
        { bio: bio.trim() },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setOriginalBio(bio.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const hasChanges = bio.trim() !== originalBio;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/chat')}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h1>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* User Info */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-base font-medium text-gray-900 dark:text-white">Account</h2>
          </div>
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Email</label>
            <p className="text-sm text-gray-900 dark:text-gray-100">{user?.email || '—'}</p>
          </div>
        </div>

        {/* Custom Instructions */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 p-6">
          <div className="flex items-center space-x-3 mb-1">
            <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-base font-medium text-gray-900 dark:text-white">Custom Instructions</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 ml-8">
            This information is shared with all your chats to personalize responses.
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              <textarea
                value={bio}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_BIO_LENGTH) {
                    setBio(e.target.value);
                  }
                }}
                placeholder={`Tell the AI about yourself — your name, role, preferences, how you'd like responses formatted, or anything else you want it to always know...\n\nExamples:\n• My name is Alex, I'm a software engineer\n• I prefer concise, technical answers\n• Always respond in English`}
                className="w-full h-44 px-4 py-3 rounded-lg border border-gray-200 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:ring-blue-400/30 dark:focus:border-blue-400 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {bio.length} / {MAX_BIO_LENGTH}
                </span>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    hasChanges && !saving
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                      : 'bg-gray-200 dark:bg-zinc-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : saved ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
                </button>
              </div>
            </>
          )}
        </div>
        {/* Memory */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 p-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-3">
              <Brain className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <h2 className="text-base font-medium text-gray-900 dark:text-white">Memory</h2>
            </div>
            {memories.length > 0 && (
              <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                {memories.length} / 100
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 ml-8">
            Facts the AI has learned about you from conversations. These are included in every chat.
          </p>

          {memoriesLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : memories.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400 dark:text-gray-500">
                No memories yet. Chat with the AI and it will automatically learn about you.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-80 overflow-y-auto scrollbar-thin">
              {memories.map((mem) => (
                <div
                  key={mem.id}
                  className="flex items-start gap-2 group px-3 py-2 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700"
                >
                  <p className="flex-1 text-sm text-gray-700 dark:text-gray-300 leading-snug">
                    {mem.content}
                  </p>
                  <button
                    onClick={async () => {
                      setDeletingMemoryId(mem.id);
                      try {
                        await axios.delete(getApiUrl(`/memories/${mem.id}`), { headers: authHeaders });
                        setMemories(prev => prev.filter(m => m.id !== mem.id));
                      } catch {
                        // ignore
                      } finally {
                        setDeletingMemoryId(null);
                      }
                    }}
                    disabled={deletingMemoryId === mem.id}
                    className="flex-shrink-0 p-1 rounded text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete memory"
                  >
                    {deletingMemoryId === mem.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {memories.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-700">
              <button
                onClick={async () => {
                  if (!confirm('Delete all memories? This cannot be undone.')) return;
                  for (const mem of memories) {
                    await axios.delete(getApiUrl(`/memories/${mem.id}`), { headers: authHeaders }).catch(() => {});
                  }
                  setMemories([]);
                }}
                className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                Clear all memories
              </button>
            </div>
          )}
        </div>

        {/* Voice Settings */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 p-6">
          <div className="flex items-center space-x-3 mb-1">
            <Mic className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-base font-medium text-gray-900 dark:text-white">Voice</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 ml-8">
            Configure real-time voice conversations.
          </p>

          {/* Model selection */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 ml-1 uppercase tracking-wide">
              Model
            </label>
            <div className="grid grid-cols-3 gap-2">
              {REALTIME_MODELS.map((m) => {
                const isSelected = selectedModel === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedModel(m.id);
                      localStorage.setItem('voiceMode_model', m.id);
                    }}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-400 ring-1 ring-blue-500/30'
                        : 'border-gray-200 dark:border-zinc-600 hover:border-gray-300 dark:hover:border-zinc-500 bg-gray-50 dark:bg-zinc-800'
                    }`}
                  >
                    <span className={`text-sm font-medium ${
                      isSelected
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {m.label}
                    </span>
                    <p className="text-[11px] mt-0.5 text-gray-500 dark:text-gray-400">
                      {m.description}
                    </p>
                    <p className="text-[10px] mt-1 font-mono text-gray-400 dark:text-gray-500">
                      ${m.audioInputPer1M} in / ${m.audioOutputPer1M} out <span className="opacity-60">per 1M</span>
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice selection */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 ml-1 uppercase tracking-wide">
              Voice
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {VOICE_OPTIONS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setSelectedVoice(v.id);
                    localStorage.setItem('voiceMode_voice', v.id);
                  }}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedVoice === v.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-400 ring-1 ring-blue-500/30'
                      : 'border-gray-200 dark:border-zinc-600 hover:border-gray-300 dark:hover:border-zinc-500 bg-gray-50 dark:bg-zinc-800'
                  }`}
                >
                  <span className={`text-sm font-medium ${
                    selectedVoice === v.id
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {v.label}
                  </span>
                  <p className="text-[11px] mt-0.5 text-gray-500 dark:text-gray-400">
                    {v.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
