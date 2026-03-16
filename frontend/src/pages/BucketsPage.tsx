import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getApiUrl } from '../config/api';
import { Bucket, BucketEntry } from '../types';
import {
  ArrowLeft, Plus, Trash2, ChevronDown, ChevronRight,
  Database, FileText, Loader2, Check,
} from 'lucide-react';

const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const BucketsPage: React.FC = () => {
  const navigate = useNavigate();
  const [buckets, setBuckets] = useState<(Bucket & { entries?: BucketEntry[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBucket, setExpandedBucket] = useState<string | null>(null);
  const [newBucketName, setNewBucketName] = useState('');
  const [newBucketDesc, setNewBucketDesc] = useState('');
  const [creating, setCreating] = useState(false);
  // Entry editing
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
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const createBucket = async () => {
    if (!newBucketName.trim()) return;
    setCreating(true);
    try {
      const { data } = await axios.post(getApiUrl('/buckets'), {
        name: newBucketName.trim(),
        description: newBucketDesc.trim() || undefined,
      }, { headers: headers() });
      setBuckets(prev => [data, ...prev]);
      setNewBucketName('');
      setNewBucketDesc('');
      setExpandedBucket(data.id);
      loadBucketEntries(data.id);
    } catch { /* silent */ }
    finally { setCreating(false); }
  };

  const deleteBucket = async (id: string) => {
    try {
      await axios.delete(getApiUrl(`/buckets/${id}`), { headers: headers() });
      setBuckets(prev => prev.filter(b => b.id !== id));
      if (expandedBucket === id) setExpandedBucket(null);
    } catch { /* silent */ }
  };

  const loadBucketEntries = async (bucketId: string) => {
    try {
      const { data } = await axios.get(getApiUrl(`/buckets/${bucketId}`), { headers: headers() });
      setBuckets(prev => prev.map(b => b.id === bucketId ? { ...b, entries: data.entries } : b));
    } catch { /* silent */ }
  };

  const toggleExpand = (id: string) => {
    if (expandedBucket === id) {
      setExpandedBucket(null);
    } else {
      setExpandedBucket(id);
      const bucket = buckets.find(b => b.id === id);
      if (!bucket?.entries) loadBucketEntries(id);
    }
    setNewEntryTitle('');
    setNewEntryContent('');
  };

  const addEntry = async (bucketId: string) => {
    if (!newEntryTitle.trim() && !newEntryContent.trim()) return;
    try {
      const { data } = await axios.post(getApiUrl(`/buckets/${bucketId}/entries`), {
        title: newEntryTitle.trim(),
        content: newEntryContent.trim(),
      }, { headers: headers() });
      setBuckets(prev => prev.map(b =>
        b.id === bucketId ? { ...b, entries: [...(b.entries || []), data] } : b
      ));
      setNewEntryTitle('');
      setNewEntryContent('');
    } catch { /* silent */ }
  };

  const updateEntry = async (bucketId: string, entryId: string, updates: { title?: string; content?: string }) => {
    setSavingEntry(entryId);
    try {
      await axios.put(getApiUrl(`/buckets/${bucketId}/entries/${entryId}`), updates, { headers: headers() });
      setBuckets(prev => prev.map(b =>
        b.id === bucketId
          ? { ...b, entries: b.entries?.map(e => e.id === entryId ? { ...e, ...updates } : e) }
          : b
      ));
    } catch { /* silent */ }
    finally { setTimeout(() => setSavingEntry(null), 500); }
  };

  const deleteEntry = async (bucketId: string, entryId: string) => {
    try {
      await axios.delete(getApiUrl(`/buckets/${bucketId}/entries/${entryId}`), { headers: headers() });
      setBuckets(prev => prev.map(b =>
        b.id === bucketId ? { ...b, entries: b.entries?.filter(e => e.id !== entryId) } : b
      ));
    } catch { /* silent */ }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/chat')} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-500" />
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Knowledge Buckets</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Info */}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Create knowledge buckets with text notes. Attach them to any chat so the AI has access to that knowledge as context.
        </p>

        {/* Create bucket */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Plus className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">New Bucket</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={newBucketName}
              onChange={e => setNewBucketName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createBucket(); }}
              placeholder="Bucket name"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            <input
              value={newBucketDesc}
              onChange={e => setNewBucketDesc(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createBucket(); }}
              placeholder="Description (optional)"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
            <button
              onClick={createBucket}
              disabled={!newBucketName.trim() || creating}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 dark:disabled:bg-zinc-700 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        )}

        {/* Bucket list */}
        {!loading && buckets.length === 0 && (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
            No buckets yet. Create one above to get started.
          </div>
        )}

        {buckets.map(bucket => {
          const expanded = expandedBucket === bucket.id;
          const entries = bucket.entries || [];
          return (
            <div key={bucket.id} className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
              {/* Bucket header */}
              <div
                className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                onClick={() => toggleExpand(bucket.id)}
              >
                {expanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                <Database className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{bucket.name}</div>
                  {bucket.description && <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{bucket.description}</div>}
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">{entries.length || '…'} entries</span>
                <button
                  onClick={e => { e.stopPropagation(); deleteBucket(bucket.id); }}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete bucket"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Entries */}
              {expanded && (
                <div className="border-t border-gray-100 dark:border-zinc-700">
                  {entries.map(entry => (
                    <div key={entry.id} className="border-b border-gray-100 dark:border-zinc-800 px-5 py-3 last:border-b-0">
                      <div className="flex items-start gap-3">
                        <FileText className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <input
                            value={entry.title}
                            onChange={e => {
                              const val = e.target.value;
                              setBuckets(prev => prev.map(b =>
                                b.id === bucket.id ? { ...b, entries: b.entries?.map(en => en.id === entry.id ? { ...en, title: val } : en) } : b
                              ));
                            }}
                            onBlur={() => updateEntry(bucket.id, entry.id, { title: entry.title })}
                            placeholder="Entry title"
                            className="w-full text-sm font-medium text-gray-900 dark:text-white bg-transparent focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                          />
                          <textarea
                            value={entry.content}
                            onChange={e => {
                              const val = e.target.value;
                              setBuckets(prev => prev.map(b =>
                                b.id === bucket.id ? { ...b, entries: b.entries?.map(en => en.id === entry.id ? { ...en, content: val } : en) } : b
                              ));
                            }}
                            onBlur={() => updateEntry(bucket.id, entry.id, { content: entry.content })}
                            placeholder="Entry content..."
                            className="w-full text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-zinc-800 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/30 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                            rows={3}
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          {savingEntry === entry.id && <Check className="h-3.5 w-3.5 text-green-500" />}
                          <button
                            onClick={() => deleteEntry(bucket.id, entry.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete entry"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add new entry */}
                  <div className="px-5 py-3 bg-gray-50/50 dark:bg-zinc-800/30">
                    <div className="flex items-start gap-3">
                      <Plus className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <input
                          value={newEntryTitle}
                          onChange={e => setNewEntryTitle(e.target.value)}
                          placeholder="New entry title"
                          className="w-full text-sm font-medium text-gray-900 dark:text-white bg-transparent focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        />
                        <textarea
                          value={newEntryContent}
                          onChange={e => setNewEntryContent(e.target.value)}
                          placeholder="Entry content..."
                          className="w-full text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/30 border border-gray-200 dark:border-zinc-600 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                          rows={2}
                        />
                        <button
                          onClick={() => addEntry(bucket.id)}
                          disabled={!newEntryTitle.trim() && !newEntryContent.trim()}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 dark:disabled:bg-zinc-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" /> Add Entry
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BucketsPage;
