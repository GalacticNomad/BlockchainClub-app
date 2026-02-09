import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import toast from 'react-hot-toast';

import ModeratorGuard from '../components/ModeratorGuard';
import {
  getPendingSubmissions,
  getAllSubmissions,
  reviewSubmission,
  recordDistribution,
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  getDistributions,
} from '../utils/api';
import { buildTokenTransfer, connection } from '../utils/solana';

export default function ModDashboard({ auth }) {
  const navigate = useNavigate();
  const wallet = useWallet();

  const [activeTab, setActiveTab] = useState('pending');
  const [pending, setPending] = useState([]);
  const [activities, setActivities] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Activity form state
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityForm, setActivityForm] = useState({
    title: '',
    description: '',
    token_reward: 0,
    category: 'general',
  });

  useEffect(() => {
    if (!auth) {
      navigate('/');
      return;
    }
    fetchAll();
  }, [auth]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pendingRes, activitiesRes, distRes] = await Promise.all([
        getPendingSubmissions(),
        getActivities(false),
        getDistributions(),
      ]);
      setPending(pendingRes.data);
      setActivities(activitiesRes.data);
      setDistributions(distRes.data);
    } catch (err) {
      console.error('Failed to load mod data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ---- Approve & send tokens ----
  const handleApprove = async (submission) => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      toast.error('Connect your wallet to approve and send tokens');
      return;
    }

    const toastId = toast.loading('Building transaction...');
    try {
      // 1. Build the token transfer transaction
      const tokenAmount = submission.token_reward || 0;
      const tx = await buildTokenTransfer(
        wallet.publicKey.toBase58(),
        submission.wallet_address,
        tokenAmount
      );

      // 2. Sign the transaction with the moderator's wallet
      toast.loading('Please sign the transaction in your wallet...', { id: toastId });
      const signed = await wallet.signTransaction(tx);

      // 3. Send the transaction
      toast.loading('Sending transaction...', { id: toastId });
      const txSig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(txSig, 'confirmed');

      // 4. Update submission status in the backend
      await reviewSubmission(submission.id, {
        status: 'approved',
        review_note: `Tokens sent. TX: ${txSig}`,
      });

      // 5. Record the distribution
      await recordDistribution({
        submission_id: submission.id,
        from_wallet: wallet.publicKey.toBase58(),
        to_wallet: submission.wallet_address,
        amount: tokenAmount,
        tx_signature: txSig,
      });

      toast.success(`Approved! ${tokenAmount} tokens sent.`, { id: toastId });
      fetchAll();
    } catch (err) {
      console.error('Approve failed:', err);
      toast.error(err.message || 'Failed to approve', { id: toastId });
    }
  };

  // ---- Reject ----
  const handleReject = async (submission) => {
    const note = prompt('Reason for rejection (optional):');
    try {
      await reviewSubmission(submission.id, {
        status: 'rejected',
        review_note: note || null,
      });
      toast.success('Submission rejected');
      fetchAll();
    } catch (err) {
      toast.error('Failed to reject');
    }
  };

  // ---- Create activity ----
  const handleCreateActivity = async (e) => {
    e.preventDefault();
    try {
      await createActivity(activityForm);
      toast.success('Activity created!');
      setShowActivityForm(false);
      setActivityForm({ title: '', description: '', token_reward: 0, category: 'general' });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create activity');
    }
  };

  // ---- Toggle activity active/inactive ----
  const toggleActivity = async (activity) => {
    try {
      await updateActivity(activity.id, { is_active: !activity.is_active });
      toast.success(activity.is_active ? 'Activity deactivated' : 'Activity activated');
      fetchAll();
    } catch (err) {
      toast.error('Failed to update activity');
    }
  };

  if (!auth) return null;

  return (
    <ModeratorGuard isModerator={auth?.isModerator}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Moderator Panel</h1>
          <p className="text-gray-400 text-sm">Manage submissions, activities, and distributions</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-brand-card rounded-lg p-1 w-fit">
          {['pending', 'activities', 'distributions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize relative ${
                activeTab === tab
                  ? 'bg-brand-purple text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'pending' ? 'Pending Submissions' : tab === 'activities' ? 'Activity Manager' : 'Distribution History'}
              {tab === 'pending' && pending.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-500 text-[10px] flex items-center justify-center text-black font-bold">
                  {pending.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400 animate-pulse">Loading...</div>
        ) : (
          <>
            {/* ---- PENDING SUBMISSIONS ---- */}
            {activeTab === 'pending' && (
              <div className="space-y-4">
                {pending.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No pending submissions. All caught up!
                  </div>
                ) : (
                  pending.map((sub) => (
                    <div
                      key={sub.id}
                      className="bg-brand-card border border-brand-border rounded-xl p-5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-sm font-semibold text-white">
                              {sub.activity_title || 'Activity'}
                            </h4>
                            <span className="text-xs text-brand-green font-medium">
                              +{sub.token_reward || 0} tokens
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 font-mono mb-2">
                            From: {sub.wallet_address}
                          </p>
                          <p className="text-sm text-gray-300 mb-2">{sub.proof_text}</p>
                          {sub.proof_url && (
                            <a
                              href={sub.proof_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-brand-purple hover:underline"
                            >
                              View proof link
                            </a>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            Submitted: {new Date(sub.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2 sm:flex-col">
                          <button
                            onClick={() => handleApprove(sub)}
                            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
                          >
                            Approve & Send
                          </button>
                          <button
                            onClick={() => handleReject(sub)}
                            className="px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-medium transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ---- ACTIVITY MANAGER ---- */}
            {activeTab === 'activities' && (
              <div>
                <button
                  onClick={() => setShowActivityForm(!showActivityForm)}
                  className="mb-6 px-4 py-2 rounded-lg bg-gradient-solana text-white font-medium text-sm hover:opacity-90 transition-opacity"
                >
                  {showActivityForm ? 'Cancel' : '+ New Activity'}
                </button>

                {showActivityForm && (
                  <form
                    onSubmit={handleCreateActivity}
                    className="bg-brand-card border border-brand-border rounded-xl p-5 mb-6 space-y-4"
                  >
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Title</label>
                      <input
                        type="text"
                        required
                        value={activityForm.title}
                        onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
                        className="w-full bg-brand-dark border border-brand-border rounded-lg p-3 text-sm text-white focus:border-brand-purple focus:outline-none"
                        placeholder="e.g. Social Media Post"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Description</label>
                      <textarea
                        value={activityForm.description}
                        onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                        className="w-full bg-brand-dark border border-brand-border rounded-lg p-3 text-sm text-white focus:border-brand-purple focus:outline-none resize-none"
                        rows={3}
                        placeholder="Describe what members need to do..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Token Reward</label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={activityForm.token_reward}
                          onChange={(e) =>
                            setActivityForm({ ...activityForm, token_reward: parseInt(e.target.value) || 0 })
                          }
                          className="w-full bg-brand-dark border border-brand-border rounded-lg p-3 text-sm text-white focus:border-brand-purple focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Category</label>
                        <select
                          value={activityForm.category}
                          onChange={(e) => setActivityForm({ ...activityForm, category: e.target.value })}
                          className="w-full bg-brand-dark border border-brand-border rounded-lg p-3 text-sm text-white focus:border-brand-purple focus:outline-none"
                        >
                          <option value="social">Social</option>
                          <option value="event">Event</option>
                          <option value="contribution">Contribution</option>
                          <option value="attendance">Attendance</option>
                          <option value="general">General</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 rounded-lg bg-gradient-solana text-white font-medium text-sm hover:opacity-90 transition-opacity"
                    >
                      Create Activity
                    </button>
                  </form>
                )}

                {/* Activity list */}
                <div className="space-y-3">
                  {activities.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      No activities yet. Create your first one above!
                    </div>
                  ) : (
                    activities.map((act) => (
                      <div
                        key={act.id}
                        className={`bg-brand-card border rounded-xl p-4 flex items-center justify-between ${
                          act.is_active ? 'border-brand-border' : 'border-red-500/30 opacity-60'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-white">{act.title}</h4>
                            <span className="text-xs text-brand-green">+{act.token_reward} tokens</span>
                            <span className="text-xs text-gray-500 bg-brand-dark px-2 py-0.5 rounded">
                              {act.category}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{act.description}</p>
                        </div>
                        <button
                          onClick={() => toggleActivity(act)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            act.is_active
                              ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                              : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                          }`}
                        >
                          {act.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ---- DISTRIBUTION HISTORY ---- */}
            {activeTab === 'distributions' && (
              <div className="space-y-3">
                {distributions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No distributions yet.
                  </div>
                ) : (
                  distributions.map((dist) => (
                    <div
                      key={dist.id}
                      className="bg-brand-card border border-brand-border rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-brand-green">
                          +{dist.amount} tokens
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(dist.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 font-mono mb-1">
                        To: {dist.to_wallet}
                      </p>
                      <a
                        href={`https://solscan.io/tx/${dist.tx_signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-brand-purple hover:underline"
                      >
                        View on Solscan
                      </a>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </ModeratorGuard>
  );
}
