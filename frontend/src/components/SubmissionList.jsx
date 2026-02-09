import React from 'react';

const statusStyles = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  approved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
};

export default function SubmissionList({ submissions, loading }) {
  if (loading) {
    return (
      <div className="text-center py-8 text-gray-400 animate-pulse">
        Loading submissions...
      </div>
    );
  }

  if (!submissions || submissions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No submissions yet. Submit proof for an activity to get started!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {submissions.map((sub) => (
        <div
          key={sub.id}
          className="bg-brand-card border border-brand-border rounded-xl p-4"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="text-sm font-semibold text-white">
                {sub.activity_title || 'Activity'}
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                {new Date(sub.created_at).toLocaleDateString(undefined, {
                  year: 'numeric', month: 'short', day: 'numeric',
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {sub.token_reward != null && (
                <span className="text-xs text-brand-green font-medium">
                  +{sub.token_reward} tokens
                </span>
              )}
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyles[sub.status]}`}>
                {sub.status}
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-300 mb-1">{sub.proof_text}</p>

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

          {sub.review_note && (
            <div className="mt-2 text-xs text-gray-400 bg-brand-dark rounded-lg p-2">
              <span className="font-medium">Reviewer note:</span> {sub.review_note}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
