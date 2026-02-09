import React, { useState } from 'react';
import SubmissionForm from './SubmissionForm';

const categoryColors = {
  social: 'bg-blue-500/20 text-blue-400',
  event: 'bg-purple-500/20 text-purple-400',
  contribution: 'bg-green-500/20 text-green-400',
  attendance: 'bg-yellow-500/20 text-yellow-400',
  general: 'bg-gray-500/20 text-gray-400',
};

export default function ActivityCard({ activity, isAuthenticated, onSubmitted }) {
  const [showForm, setShowForm] = useState(false);

  const colorClass = categoryColors[activity.category] || categoryColors.general;

  return (
    <div className="bg-brand-card border border-brand-border rounded-xl p-5 hover:border-brand-purple/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${colorClass}`}>
          {activity.category}
        </span>
        <div className="text-right">
          <span className="text-lg font-bold text-brand-green">{activity.token_reward}</span>
          <span className="text-xs text-gray-400 block">tokens</span>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">{activity.title}</h3>
      <p className="text-sm text-gray-400 mb-4 leading-relaxed">{activity.description}</p>

      {isAuthenticated && (
        <>
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-2 px-4 rounded-lg bg-brand-purple/20 text-brand-purple hover:bg-brand-purple/30 transition-colors font-medium text-sm"
            >
              Submit Proof
            </button>
          ) : (
            <SubmissionForm
              activityId={activity.id}
              onCancel={() => setShowForm(false)}
              onSubmitted={() => {
                setShowForm(false);
                onSubmitted?.();
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
