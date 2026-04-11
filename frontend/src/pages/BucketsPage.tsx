import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Database,
  FileText,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';
import { getApiUrl } from '../config/api';
import { Bucket, BucketEntry } from '../types';
import AppShell from '../components/layout/AppShell';
import SurfaceCard from '../components/ui/SurfaceCard';

const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const BucketsPage: React.FC = () => {
  const [buckets, setBuckets] = useState<(Bucket & { entries?: BucketEntry[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBucket, setExpandedBucket] = useState<string | null>(null);
  const [newBucketName, setNewBucketName] = useState('');
  const [newBucketDesc, setNewBucketDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [newEntryTitle, setNewEntryTitle] = useState('');
  const [newEntryContent, setNewEntryContent] = useState('');
  const [savingEntry, setSavingEntry] = useState<string | null>(null);

  useEffect(() => {
    loadBuckets();
  }, []);

  const loadBuckets = async () => {
    try {
      const { data } = await axios.get(getApiUrl('/buckets'), { headers: headers() });
      setBuckets(data);
    } catch {
      toast.error('Failed to load buckets');
    } finally {
      setLoading(false);
    }
  };

  const createBucket = async () => {
    if (!newBucketName.trim()) return;
    setCreating(true);
    try {
      const { data } = await axios.post(
        getApiUrl('/buckets'),
        {
          name: newBucketName.trim(),
          description: newBucketDesc.trim() || undefined,
        },
        { headers: headers() }
      );
      setBuckets((prev) => [data, ...prev]);
      setNewBucketName('');
      setNewBucketDesc('');
      setExpandedBucket(data.id);
      await loadBucketEntries(data.id);
      toast.success('Bucket created');
    } catch {
      toast.error('Failed to create bucket');
    } finally {
      setCreating(false);
    }
  };

  const deleteBucket = async (id: string) => {
    try {
      await axios.delete(getApiUrl(`/buckets/${id}`), { headers: headers() });
      setBuckets((prev) => prev.filter((bucket) => bucket.id !== id));
      if (expandedBucket === id) setExpandedBucket(null);
      toast.success('Bucket deleted');
    } catch {
      toast.error('Failed to delete bucket');
    }
  };

  const loadBucketEntries = async (bucketId: string) => {
    try {
      const { data } = await axios.get(getApiUrl(`/buckets/${bucketId}`), { headers: headers() });
      setBuckets((prev) => prev.map((bucket) => (bucket.id === bucketId ? { ...bucket, entries: data.entries } : bucket)));
    } catch {
      toast.error('Failed to load bucket entries');
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedBucket === id) {
      setExpandedBucket(null);
    } else {
      setExpandedBucket(id);
      const bucket = buckets.find((entry) => entry.id === id);
      if (!bucket?.entries) {
        loadBucketEntries(id);
      }
    }
    setNewEntryTitle('');
    setNewEntryContent('');
  };

  const addEntry = async (bucketId: string) => {
    if (!newEntryTitle.trim() && !newEntryContent.trim()) return;
    try {
      const { data } = await axios.post(
        getApiUrl(`/buckets/${bucketId}/entries`),
        {
          title: newEntryTitle.trim(),
          content: newEntryContent.trim(),
        },
        { headers: headers() }
      );
      setBuckets((prev) =>
        prev.map((bucket) =>
          bucket.id === bucketId ? { ...bucket, entries: [...(bucket.entries || []), data] } : bucket
        )
      );
      setNewEntryTitle('');
      setNewEntryContent('');
      toast.success('Entry added');
    } catch {
      toast.error('Failed to add entry');
    }
  };

  const updateEntry = async (bucketId: string, entryId: string, updates: { title?: string; content?: string }) => {
    setSavingEntry(entryId);
    try {
      await axios.put(getApiUrl(`/buckets/${bucketId}/entries/${entryId}`), updates, { headers: headers() });
      setBuckets((prev) =>
        prev.map((bucket) =>
          bucket.id === bucketId
            ? {
                ...bucket,
                entries: bucket.entries?.map((entry) => (entry.id === entryId ? { ...entry, ...updates } : entry)),
              }
            : bucket
        )
      );
      toast.success('Entry updated');
    } catch {
      toast.error('Failed to update entry');
    } finally {
      window.setTimeout(() => setSavingEntry(null), 500);
    }
  };

  const deleteEntry = async (bucketId: string, entryId: string) => {
    try {
      await axios.delete(getApiUrl(`/buckets/${bucketId}/entries/${entryId}`), { headers: headers() });
      setBuckets((prev) =>
        prev.map((bucket) =>
          bucket.id === bucketId ? { ...bucket, entries: bucket.entries?.filter((entry) => entry.id !== entryId) } : bucket
        )
      );
      toast.success('Entry deleted');
    } catch {
      toast.error('Failed to delete entry');
    }
  };

  return (
    <AppShell
      eyebrow="AI studio"
      title="Knowledge Buckets"
      description="Curate reusable notes and structured context so your chats can draw from a richer reference library."
      contentWidth="medium"
      contentClassName="space-y-6"
    >
      <SurfaceCard
        title="Create a bucket"
        description="Add a new knowledge collection, then attach it to conversations when you want that context in play."
        icon={<Plus className="h-4 w-4" />}
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={newBucketName}
            onChange={(e) => setNewBucketName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') createBucket();
            }}
            placeholder="Bucket name"
            className="shell-input flex-1 text-sm"
          />
          <input
            value={newBucketDesc}
            onChange={(e) => setNewBucketDesc(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') createBucket();
            }}
            placeholder="Description (optional)"
            className="shell-input flex-1 text-sm"
          />
          <button
            onClick={createBucket}
            disabled={!newBucketName.trim() || creating}
            className={
              !newBucketName.trim() || creating
                ? 'inline-flex cursor-not-allowed items-center gap-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-3)] px-4 py-2 text-sm font-medium text-[var(--text-muted)]'
                : 'btn-gradient justify-center'
            }
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create
          </button>
        </div>
      </SurfaceCard>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--text-secondary)]" />
        </div>
      ) : null}

      {!loading && buckets.length === 0 ? (
        <SurfaceCard>
          <div className="py-8 text-center text-sm text-[var(--text-secondary)]">
            No buckets yet. Create one above to start building your reference library.
          </div>
        </SurfaceCard>
      ) : null}

      {buckets.map((bucket) => {
        const expanded = expandedBucket === bucket.id;
        const entries = bucket.entries || [];

        return (
          <div key={bucket.id} className="surface-panel overflow-hidden p-0">
            <div
              className="flex cursor-pointer items-center gap-3 px-5 py-4 transition-colors hover:bg-white/5"
              onClick={() => toggleExpand(bucket.id)}
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
              ) : (
                <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
              )}
              <Database className="h-4 w-4 flex-shrink-0 text-[var(--brand-indigo)]" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-[var(--text-primary)]">{bucket.name}</div>
                {bucket.description ? (
                  <div className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">{bucket.description}</div>
                ) : null}
              </div>
              <span className="text-xs text-[var(--text-muted)]">{entries.length || '…'} entries</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteBucket(bucket.id);
                }}
                className="p-1.5 text-[var(--text-muted)] transition-colors hover:text-red-400"
                title="Delete bucket"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {expanded ? (
              <div className="border-t border-[var(--border-subtle)]">
                {entries.map((entry) => (
                  <div key={entry.id} className="border-b border-[var(--border-subtle)] px-5 py-3 last:border-b-0">
                    <div className="flex items-start gap-3">
                      <FileText className="mt-1 h-4 w-4 flex-shrink-0 text-[var(--text-muted)]" />
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <input
                          value={entry.title}
                          onChange={(e) => {
                            const value = e.target.value;
                            setBuckets((prev) =>
                              prev.map((currentBucket) =>
                                currentBucket.id === bucket.id
                                  ? {
                                      ...currentBucket,
                                      entries: currentBucket.entries?.map((currentEntry) =>
                                        currentEntry.id === entry.id ? { ...currentEntry, title: value } : currentEntry
                                      ),
                                    }
                                  : currentBucket
                              )
                            );
                          }}
                          onBlur={() => updateEntry(bucket.id, entry.id, { title: entry.title })}
                          placeholder="Entry title"
                          className="w-full bg-transparent text-sm font-medium text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-muted)]"
                        />
                        <textarea
                          value={entry.content}
                          onChange={(e) => {
                            const value = e.target.value;
                            setBuckets((prev) =>
                              prev.map((currentBucket) =>
                                currentBucket.id === bucket.id
                                  ? {
                                      ...currentBucket,
                                      entries: currentBucket.entries?.map((currentEntry) =>
                                        currentEntry.id === entry.id ? { ...currentEntry, content: value } : currentEntry
                                      ),
                                    }
                                  : currentBucket
                              )
                            );
                          }}
                          onBlur={() => updateEntry(bucket.id, entry.id, { content: entry.content })}
                          placeholder="Entry content..."
                          className="shell-input w-full resize-none text-sm"
                          rows={3}
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        {savingEntry === entry.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : null}
                        <button
                          onClick={() => deleteEntry(bucket.id, entry.id)}
                          className="p-1 text-[var(--text-muted)] transition-colors hover:text-red-400"
                          title="Delete entry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="bg-white/[0.03] px-5 py-3">
                  <div className="flex items-start gap-3">
                    <Plus className="mt-1 h-4 w-4 flex-shrink-0 text-[var(--text-muted)]" />
                    <div className="flex-1 space-y-1.5">
                      <input
                        value={newEntryTitle}
                        onChange={(e) => setNewEntryTitle(e.target.value)}
                        placeholder="New entry title"
                        className="w-full bg-transparent text-sm font-medium text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-muted)]"
                      />
                      <textarea
                        value={newEntryContent}
                        onChange={(e) => setNewEntryContent(e.target.value)}
                        placeholder="Entry content..."
                        className="shell-input w-full resize-none text-sm"
                        rows={2}
                      />
                      <button
                        onClick={() => addEntry(bucket.id)}
                        disabled={!newEntryTitle.trim() && !newEntryContent.trim()}
                        className={
                          !newEntryTitle.trim() && !newEntryContent.trim()
                            ? 'inline-flex cursor-not-allowed items-center gap-1 rounded-xl border border-[var(--border-default)] bg-[var(--surface-3)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)]'
                            : 'btn-gradient gap-1 px-3 py-1.5 text-xs'
                        }
                      >
                        <Plus className="h-3 w-3" />
                        Add Entry
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </AppShell>
  );
};

export default BucketsPage;
