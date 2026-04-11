import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Brain, Check, FileText, Loader2, Mic, Save, Shield, Sparkles, Trash2, User, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../config/api';
import { VOICE_OPTIONS, VoiceId, REALTIME_MODELS, RealtimeModelId } from '../hooks/useVoiceMode';
import { Memory } from '../types';
import AppShell from '../components/layout/AppShell';
import SurfaceCard from '../components/ui/SurfaceCard';

const MAX_BIO_LENGTH = 2000;

const prettifyEmailName = (email?: string | null) => {
  const localPart = email?.split('@')[0] || 'Own AI user';
  const cleaned = localPart.replace(/\d+$/, '').trim();
  const source = cleaned || localPart;

  return source
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const ProfilePage: React.FC = () => {
  const { user } = useAuth();

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
  const [memories, setMemories] = useState<Memory[]>([]);
  const [memoriesLoading, setMemoriesLoading] = useState(true);
  const [deletingMemoryId, setDeletingMemoryId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` }),
    []
  );

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
        toast.error('Failed to load your settings');
      } finally {
        setLoading(false);
        setMemoriesLoading(false);
      }
    })();
  }, [authHeaders]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(
        getApiUrl('/user/bio'),
        { bio: bio.trim() },
        { headers: authHeaders }
      );
      setOriginalBio(bio.trim());
      setSaved(true);
      toast.success('Settings saved');
      window.setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = bio.trim() !== originalBio;
  const displayName = useMemo(() => prettifyEmailName(user?.email), [user?.email]);
  const initials = useMemo(
    () =>
      displayName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('') || 'OA',
    [displayName]
  );
  const profileSegments = ['Profile', 'Billing & Usage', 'Security'];

  return (
    <AppShell
      eyebrow="Personal controls"
      title="Settings"
      description="Manage your identity, reusable instructions, memory, and voice defaults across the Own AI workspace."
      contentWidth="wide"
      contentClassName="space-y-6 lg:space-y-8"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="settings-segment w-fit flex-wrap">
          {profileSegments.map((segment, index) => (
            <span
              key={segment}
              className={`settings-segment-chip ${index === 0 ? 'settings-segment-chip-active' : ''}`}
            >
              {segment}
            </span>
          ))}
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--surface-1)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] shadow-[var(--shadow-card)]">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Synced across web, desktop, and voice sessions
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <SurfaceCard className="xl:col-span-8 overflow-hidden !p-0">
          <div className="relative overflow-hidden rounded-[inherit]">
            <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.3),_transparent_60%),radial-gradient(circle_at_top_right,_rgba(217,70,239,0.22),_transparent_55%)]" />
            <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[auto,1fr] lg:items-center">
              <div className="flex flex-col items-start gap-4">
                <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/10 bg-brand-gradient text-2xl font-bold text-white shadow-glow-sm">
                  {initials}
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(99,102,241,0.18)] bg-[rgba(99,102,241,0.1)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-primary)]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Active workspace profile
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-secondary)]">
                    Profile overview
                  </p>
                  <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
                    {displayName}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
                    This identity powers your instructions, memory, and voice defaults across the Own AI workspace.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Email
                    </p>
                    <p className="mt-2 truncate text-sm font-medium text-[var(--text-primary)]">{user?.email || '—'}</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Memory Budget
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">{memories.length} / 100 saved items</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      Voice Default
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">{selectedVoice}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard
          className="xl:col-span-4"
          title="Workspace Status"
          description="A compact snapshot inspired by the stitched account status cards."
          icon={<Shield className="h-4 w-4" />}
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Plan</p>
                  <p className="mt-2 text-xl font-semibold text-[var(--text-primary)]">Pro Workspace</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-brand-gradient px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                  Active
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                Your preferences apply across chats, analytics, buckets, and voice sessions.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Instruction State</p>
                <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">{hasChanges ? 'Unsaved edits' : 'Synced and current'}</p>
              </div>
              <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Realtime Model</p>
                <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                  {REALTIME_MODELS.find((model) => model.id === selectedModel)?.label || selectedModel}
                </p>
              </div>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard
          className="xl:col-span-7"
          title="Custom Instructions"
          description="Shared context that shapes tone, formatting, and the way Own AI should respond to you."
          icon={<FileText className="h-4 w-4" />}
          actions={<span className="text-xs tabular-nums text-[var(--text-muted)]">{bio.length} / {MAX_BIO_LENGTH}</span>}
        >
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--text-secondary)]" />
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
                placeholder={`Tell the AI about yourself — your role, preferred response style, formatting expectations, or anything it should always remember.\n\nExamples:\n• I'm a founder and prefer concise strategic answers\n• Use bullets before long prose\n• Call out risks and tradeoffs clearly`}
                className="shell-input shell-textarea h-56 text-sm"
              />
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
                  Changes here will shape replies across all new chats and carry into desktop and voice workflows.
                </p>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                  className={
                    hasChanges && !saving
                      ? 'btn-gradient justify-center'
                      : 'inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-3)] px-4 py-2 text-sm font-medium text-[var(--text-muted)]'
                  }
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : saved ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving ? 'Saving...' : saved ? 'Saved!' : 'Save changes'}
                </button>
              </div>
            </>
          )}
        </SurfaceCard>

        <SurfaceCard
          className="xl:col-span-5"
          title="Account & Security"
          description="Your login identity and a lightweight security summary."
          icon={<User className="h-4 w-4" />}
        >
          <div className="space-y-3">
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Display Name</p>
              <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">{displayName}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Email</p>
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-indigo)]">Primary</span>
              </div>
              <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">{user?.email || '—'}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Password</p>
                <span className="text-xs font-medium text-[var(--text-secondary)]">Managed through auth</span>
              </div>
              <p className="mt-2 font-mono text-sm tracking-[0.3em] text-[var(--text-primary)]">••••••••••••</p>
              <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
                Password reset and deeper security controls are the next settings slice after this profile pass.
              </p>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard
          className="xl:col-span-7"
          title="Memory"
          description="Facts the assistant has learned from your conversations and can reuse across future chats."
          icon={<Brain className="h-4 w-4" />}
          actions={
            memories.length > 0 ? (
              <span className="text-xs tabular-nums text-[var(--text-muted)]">{memories.length} / 100</span>
            ) : undefined
          }
        >
          {memoriesLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--text-secondary)]" />
            </div>
          ) : memories.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[var(--border-default)] bg-[var(--surface-1)] py-10 text-center">
              <Brain className="mx-auto mb-3 h-8 w-8 text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-secondary)]">
                No memories yet. Chat naturally and Own AI will start collecting reusable context.
              </p>
            </div>
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto scrollbar-thin pr-1">
              {memories.map((mem) => (
                <div
                  key={mem.id}
                  className="group flex items-start gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3"
                >
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(99,102,241,0.12)] text-[var(--brand-indigo)]">
                    <Brain className="h-4 w-4" />
                  </div>
                  <p className="flex-1 text-sm leading-6 text-[var(--text-secondary)]">{mem.content}</p>
                  <button
                    onClick={async () => {
                      setDeletingMemoryId(mem.id);
                      try {
                        await axios.delete(getApiUrl(`/memories/${mem.id}`), { headers: authHeaders });
                        setMemories((prev) => prev.filter((item) => item.id !== mem.id));
                        toast.success('Memory deleted');
                      } catch {
                        toast.error('Failed to delete memory');
                      } finally {
                        setDeletingMemoryId(null);
                      }
                    }}
                    disabled={deletingMemoryId === mem.id}
                    className="flex-shrink-0 rounded p-1 text-[var(--text-muted)] opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
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

          {memories.length > 0 ? (
            <div className="mt-4 border-t border-[var(--border-subtle)] pt-4">
              {confirmClearAll ? (
                <div className="flex flex-col gap-3 rounded-2xl border border-red-500/20 bg-[rgba(239,68,68,0.08)] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-[var(--text-secondary)]">Delete all memories? This cannot be undone.</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmClearAll(false)}
                      className="inline-flex items-center rounded-xl border border-[var(--border-default)] px-3 py-2 text-sm text-[var(--text-secondary)]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await Promise.all(
                            memories.map((mem) =>
                              axios.delete(getApiUrl(`/memories/${mem.id}`), { headers: authHeaders }).catch(() => null)
                            )
                          );
                          setMemories([]);
                          setConfirmClearAll(false);
                          toast.success('All memories cleared');
                        } catch {
                          toast.error('Failed to clear memories');
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                    >
                      <Trash2 className="h-4 w-4" />
                      Confirm delete
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClearAll(true)}
                  className="flex items-center gap-1.5 text-xs text-red-400 transition-colors hover:text-red-300"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear all memories
                </button>
              )}
            </div>
          ) : null}
        </SurfaceCard>

        <SurfaceCard
          className="xl:col-span-5"
          title="Voice"
          description="Configure the default real-time model and preferred voice for spoken conversations."
          icon={<Mic className="h-4 w-4" />}
        >
          <div className="mb-5">
            <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Model
            </label>
            <div className="grid grid-cols-1 gap-2">
              {REALTIME_MODELS.map((model) => {
                const isSelected = selectedModel === model.id;
                return (
                  <button
                    key={model.id}
                    onClick={() => {
                      setSelectedModel(model.id);
                      localStorage.setItem('voiceMode_model', model.id);
                    }}
                    className={`rounded-2xl border p-3 text-left transition-all ${
                      isSelected
                        ? 'border-[var(--brand-indigo)] bg-[rgba(99,102,241,0.12)] ring-1 ring-[rgba(99,102,241,0.24)]'
                        : 'border-[var(--border-default)] bg-[var(--surface-1)] hover:border-[rgba(99,102,241,0.24)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-[var(--text-primary)]">{model.label}</span>
                      {isSelected ? (
                        <span className="rounded-full bg-[rgba(99,102,241,0.14)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-indigo)]">
                          Active
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[11px] text-[var(--text-secondary)]">{model.description}</p>
                    <p className="mt-1 text-[10px] font-mono text-[var(--text-muted)]">
                      ${model.audioInputPer1M} in / ${model.audioOutputPer1M} out <span className="opacity-60">per 1M</span>
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Voice
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {VOICE_OPTIONS.map((voice) => {
                const isSelected = selectedVoice === voice.id;
                return (
                  <button
                    key={voice.id}
                    onClick={() => {
                      setSelectedVoice(voice.id);
                      localStorage.setItem('voiceMode_voice', voice.id);
                    }}
                    className={`rounded-2xl border p-3 text-left transition-all ${
                      isSelected
                        ? 'border-[var(--brand-indigo)] bg-[rgba(99,102,241,0.12)] ring-1 ring-[rgba(99,102,241,0.24)]'
                        : 'border-[var(--border-default)] bg-[var(--surface-1)] hover:border-[rgba(99,102,241,0.24)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-[var(--text-primary)]">{voice.label}</span>
                      {isSelected ? (
                        <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand-indigo)]" />
                      ) : null}
                    </div>
                    <p className="mt-1 text-[11px] text-[var(--text-secondary)]">{voice.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </SurfaceCard>
      </div>
    </AppShell>
  );
};

export default ProfilePage;
