import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Loader2, MessageSquare, Shield, User, WalletCards } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../config/api';
import AppShell from '../components/layout/AppShell';
import SurfaceCard from '../components/ui/SurfaceCard';
import StatTile from '../components/ui/StatTile';

type AdminOverview = {
  totalUsers: number;
  totalMessages: number;
  totalCost: number;
  openFeedback: number;
  pendingTransactions: number;
};

type AdminUser = {
  id: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  messageCount: number;
  totalTokens: number;
  totalCost: number;
  lastActiveAt: string | null;
  balance: number | null;
};

type FeedbackRow = {
  id: string;
  user_id: string | null;
  type: 'suggestion' | 'report';
  subject: string;
  message: string;
  status: 'open' | 'in_review' | 'resolved' | 'dismissed';
  admin_note: string | null;
  created_at: string;
};

type AdminTransaction = {
  id: string;
  user_id: string | null;
  type: 'usage_charge' | 'credit' | 'refund' | 'adjustment';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  scheduled_for: string | null;
  created_at: string;
};

const currency = (value: number) => `$${value.toFixed(4)}`;

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [savingRoleUserId, setSavingRoleUserId] = useState<string | null>(null);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` }),
    []
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, usersRes, feedbackRes, txRes] = await Promise.all([
        axios.get(getApiUrl('/admin/overview'), { headers: authHeaders }),
        axios.get(getApiUrl('/admin/users'), { headers: authHeaders }),
        axios.get(getApiUrl('/admin/feedback'), { headers: authHeaders }),
        axios.get(getApiUrl('/admin/transactions'), { headers: authHeaders }),
      ]);
      setOverview(overviewRes.data);
      setUsers(usersRes.data || []);
      setFeedback(feedbackRes.data || []);
      setTransactions(txRes.data || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (user && !user.isAdmin) {
      navigate('/chat');
      return;
    }
    load();
  }, [load, navigate, user]);

  const toggleAdminRole = async (target: AdminUser) => {
    setSavingRoleUserId(target.id);
    try {
      await axios.patch(
        getApiUrl(`/admin/users/${target.id}/role`),
        { isAdmin: !target.isAdmin },
        { headers: authHeaders }
      );
      setUsers((prev) => prev.map((current) => (current.id === target.id ? { ...current, isAdmin: !current.isAdmin } : current)));
      toast.success('Role updated');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to update role');
    } finally {
      setSavingRoleUserId(null);
    }
  };

  const updateFeedbackStatus = async (row: FeedbackRow, status: FeedbackRow['status']) => {
    try {
      await axios.patch(
        getApiUrl(`/admin/feedback/${row.id}`),
        { status },
        { headers: authHeaders }
      );
      setFeedback((prev) => prev.map((item) => (item.id === row.id ? { ...item, status } : item)));
      toast.success('Feedback updated');
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to update feedback');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--text-secondary)]" />
      </div>
    );
  }

  return (
    <AppShell
      eyebrow="Control center"
      title="Admin Dashboard"
      description="Monitor users, moderation queues, and future billing operations from one operational command surface."
      contentWidth="wide"
      contentClassName="space-y-6"
    >
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile icon={<User className="h-4 w-4" />} label="Users" value={String(overview?.totalUsers || 0)} />
        <StatTile icon={<MessageSquare className="h-4 w-4" />} label="Messages" value={String(overview?.totalMessages || 0)} />
        <StatTile icon={<WalletCards className="h-4 w-4" />} label="Total Cost" value={currency(overview?.totalCost || 0)} />
        <StatTile icon={<Shield className="h-4 w-4" />} label="Open Feedback" value={String(overview?.openFeedback || 0)} />
        <StatTile icon={<WalletCards className="h-4 w-4" />} label="Pending Tx" value={String(overview?.pendingTransactions || 0)} />
      </div>

      <SurfaceCard title="Users & Usage" description="Inspect access, activity, cost, and role controls across the current user base.">
        <div className="overflow-auto">
          <table className="surface-table text-sm">
            <thead>
              <tr className="text-left">
                <th>Email</th>
                <th>Role</th>
                <th>Msgs</th>
                <th>Tokens</th>
                <th>Cost</th>
                <th>Balance</th>
                <th>Last Active</th>
              </tr>
            </thead>
            <tbody>
              {users.map((entry) => (
                <tr key={entry.id}>
                  <td className="text-[var(--text-primary)]">{entry.email}</td>
                  <td>
                    <button
                      onClick={() => toggleAdminRole(entry)}
                      disabled={savingRoleUserId === entry.id}
                      className="inline-flex items-center rounded-full border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-1 text-xs text-[var(--text-primary)] transition-colors hover:bg-white/5"
                    >
                      {savingRoleUserId === entry.id ? 'Saving...' : entry.isAdmin ? 'Admin' : 'User'}
                    </button>
                  </td>
                  <td>{entry.messageCount}</td>
                  <td>{entry.totalTokens}</td>
                  <td>{currency(entry.totalCost)}</td>
                  <td>{entry.balance === null ? '— (coming soon)' : currency(entry.balance)}</td>
                  <td>{entry.lastActiveAt ? new Date(entry.lastActiveAt).toLocaleString() : 'Never'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SurfaceCard>

      <SurfaceCard title="Suggestions & Reports" description="Review user feedback and keep the response queue under control.">
        <div className="space-y-3">
          {feedback.length === 0 ? <p className="text-sm text-[var(--text-secondary)]">No feedback yet.</p> : null}
          {feedback.map((item) => (
            <div key={item.id} className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-1)] p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  [{item.type}] {item.subject}
                </div>
                <select
                  value={item.status}
                  onChange={(e) => updateFeedbackStatus(item, e.target.value as FeedbackRow['status'])}
                  className="shell-input shell-select w-auto rounded-xl px-3 py-2 text-xs"
                >
                  <option value="open">Open</option>
                  <option value="in_review">In review</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-secondary)]">{item.message}</p>
              <div className="mt-2 text-xs text-[var(--text-muted)]">
                User: {item.user_id || 'anonymous'} · {new Date(item.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard title="Transactions (Future Billing)" description="Early operational ledger for the balance and billing model planned next.">
        <div className="overflow-auto">
          <table className="surface-table text-sm">
            <thead>
              <tr className="text-left">
                <th>Type</th>
                <th>User</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Scheduled</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="text-[var(--text-primary)]">{transaction.type}</td>
                  <td>{transaction.user_id || 'system'}</td>
                  <td>
                    {transaction.currency} {Number(transaction.amount).toFixed(4)}
                  </td>
                  <td>{transaction.status}</td>
                  <td>{transaction.scheduled_for ? new Date(transaction.scheduled_for).toLocaleString() : '—'}</td>
                  <td>{new Date(transaction.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 ? (
            <p className="py-3 text-sm text-[var(--text-secondary)]">
              No transactions yet. This will power balance logic later.
            </p>
          ) : null}
        </div>
      </SurfaceCard>
    </AppShell>
  );
};

export default AdminPage;
