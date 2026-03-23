import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Shield, User, MessageSquare, WalletCards } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../config/api';

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

  const load = async () => {
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
      alert(error?.response?.data?.error || 'Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !user.isAdmin) {
      navigate('/chat');
      return;
    }
    load();
  }, [user?.id, user?.isAdmin]);

  const toggleAdminRole = async (target: AdminUser) => {
    setSavingRoleUserId(target.id);
    try {
      await axios.patch(
        getApiUrl(`/admin/users/${target.id}/role`),
        { isAdmin: !target.isAdmin },
        { headers: authHeaders }
      );
      setUsers(prev => prev.map(u => (u.id === target.id ? { ...u, isAdmin: !u.isAdmin } : u)));
    } catch (error: any) {
      alert(error?.response?.data?.error || 'Failed to update role');
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
      setFeedback(prev => prev.map(f => (f.id === row.id ? { ...f, status } : f)));
    } catch (error: any) {
      alert(error?.response?.data?.error || 'Failed to update feedback');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/chat')}
              className="p-2 rounded-lg border border-gray-300 dark:border-zinc-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatCard icon={<User className="h-4 w-4" />} label="Users" value={String(overview?.totalUsers || 0)} />
          <StatCard icon={<MessageSquare className="h-4 w-4" />} label="Messages" value={String(overview?.totalMessages || 0)} />
          <StatCard icon={<WalletCards className="h-4 w-4" />} label="Total Cost" value={currency(overview?.totalCost || 0)} />
          <StatCard icon={<Shield className="h-4 w-4" />} label="Open Feedback" value={String(overview?.openFeedback || 0)} />
          <StatCard icon={<WalletCards className="h-4 w-4" />} label="Pending Tx" value={String(overview?.pendingTransactions || 0)} />
        </div>

        <section className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Users & Usage</h2>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-zinc-800">
                  <th className="py-2 pr-2">Email</th>
                  <th className="py-2 pr-2">Role</th>
                  <th className="py-2 pr-2">Msgs</th>
                  <th className="py-2 pr-2">Tokens</th>
                  <th className="py-2 pr-2">Cost</th>
                  <th className="py-2 pr-2">Balance</th>
                  <th className="py-2 pr-2">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-gray-50 dark:border-zinc-800/70">
                    <td className="py-2 pr-2 text-gray-800 dark:text-gray-200">{u.email}</td>
                    <td className="py-2 pr-2">
                      <button
                        onClick={() => toggleAdminRole(u)}
                        disabled={savingRoleUserId === u.id}
                        className="px-2 py-1 rounded border border-gray-300 dark:border-zinc-700 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
                      >
                        {savingRoleUserId === u.id ? 'Saving...' : u.isAdmin ? 'Admin' : 'User'}
                      </button>
                    </td>
                    <td className="py-2 pr-2 text-gray-700 dark:text-gray-300">{u.messageCount}</td>
                    <td className="py-2 pr-2 text-gray-700 dark:text-gray-300">{u.totalTokens}</td>
                    <td className="py-2 pr-2 text-gray-700 dark:text-gray-300">{currency(u.totalCost)}</td>
                    <td className="py-2 pr-2 text-gray-700 dark:text-gray-300">{u.balance === null ? '— (coming soon)' : currency(u.balance)}</td>
                    <td className="py-2 pr-2 text-gray-700 dark:text-gray-300">
                      {u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleString() : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Suggestions & Reports</h2>
          <div className="space-y-3">
            {feedback.length === 0 && <p className="text-sm text-gray-500">No feedback yet.</p>}
            {feedback.map(item => (
              <div key={item.id} className="rounded-lg border border-gray-200 dark:border-zinc-700 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    [{item.type}] {item.subject}
                  </div>
                  <select
                    value={item.status}
                    onChange={(e) => updateFeedbackStatus(item, e.target.value as FeedbackRow['status'])}
                    className="text-xs rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-gray-700 dark:text-gray-300"
                  >
                    <option value="open">Open</option>
                    <option value="in_review">In review</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap">{item.message}</p>
                <div className="text-xs text-gray-500 mt-2">
                  User: {item.user_id || 'anonymous'} · {new Date(item.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Transactions (Future Billing)</h2>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-zinc-800">
                  <th className="py-2 pr-2">Type</th>
                  <th className="py-2 pr-2">User</th>
                  <th className="py-2 pr-2">Amount</th>
                  <th className="py-2 pr-2">Status</th>
                  <th className="py-2 pr-2">Scheduled</th>
                  <th className="py-2 pr-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id} className="border-b border-gray-50 dark:border-zinc-800/70">
                    <td className="py-2 pr-2 text-gray-800 dark:text-gray-200">{tx.type}</td>
                    <td className="py-2 pr-2 text-gray-700 dark:text-gray-300">{tx.user_id || 'system'}</td>
                    <td className="py-2 pr-2 text-gray-700 dark:text-gray-300">
                      {tx.currency} {Number(tx.amount).toFixed(4)}
                    </td>
                    <td className="py-2 pr-2 text-gray-700 dark:text-gray-300">{tx.status}</td>
                    <td className="py-2 pr-2 text-gray-700 dark:text-gray-300">
                      {tx.scheduled_for ? new Date(tx.scheduled_for).toLocaleString() : '—'}
                    </td>
                    <td className="py-2 pr-2 text-gray-700 dark:text-gray-300">{new Date(tx.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactions.length === 0 && (
              <p className="text-sm text-gray-500 py-3">No transactions yet. This will power balance logic later.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4">
    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1">
      {icon}
      <span>{label}</span>
    </div>
    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{value}</div>
  </div>
);

export default AdminPage;
