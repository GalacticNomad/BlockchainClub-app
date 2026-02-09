import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TokenBalance from '../components/TokenBalance';
import ActivityCard from '../components/ActivityCard';
import SubmissionList from '../components/SubmissionList';
import { getActivities, getMySubmissions } from '../utils/api';

export default function Dashboard({ auth }) {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [activeTab, setActiveTab] = useState('activities');

  useEffect(() => {
    if (!auth) {
      navigate('/');
      return;
    }
    fetchData();
  }, [auth]);

  const fetchData = async () => {
    try {
      setLoadingActivities(true);
      setLoadingSubmissions(true);

      const [activitiesRes, submissionsRes] = await Promise.all([
        getActivities(),
        getMySubmissions(),
      ]);

      setActivities(activitiesRes.data);
      setSubmissions(submissionsRes.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoadingActivities(false);
      setLoadingSubmissions(false);
    }
  };

  if (!auth) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400 text-sm">
          Wallet: <span className="text-brand-purple font-mono">{auth.walletAddress}</span>
        </p>
      </div>

      {/* Token Balance */}
      <div className="mb-8">
        <TokenBalance walletAddress={auth.walletAddress} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-brand-card rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('activities')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'activities'
              ? 'bg-brand-purple text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Activities
        </button>
        <button
          onClick={() => setActiveTab('submissions')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
            activeTab === 'submissions'
              ? 'bg-brand-purple text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          My Submissions
          {submissions.filter((s) => s.status === 'pending').length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-500 text-[10px] flex items-center justify-center text-black font-bold">
              {submissions.filter((s) => s.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'activities' ? (
        <div>
          {loadingActivities ? (
            <div className="text-center py-12 text-gray-400 animate-pulse">
              Loading activities...
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No activities available yet. Check back soon!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  isAuthenticated={!!auth}
                  onSubmitted={fetchData}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <SubmissionList submissions={submissions} loading={loadingSubmissions} />
      )}
    </div>
  );
}
