import React from 'react';
import { Link } from 'react-router-dom';

export default function ModeratorGuard({ isModerator, children }) {
  if (!isModerator) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-6V7a4 4 0 00-8 0v4m12 0a2 2 0 01-2 2H6a2 2 0 01-2-2v0a2 2 0 012-2h12a2 2 0 012 2v0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-gray-400 mb-6 max-w-md">
          This area is restricted to moderators only. Your wallet is not registered as a moderator.
        </p>
        <Link
          to="/dashboard"
          className="px-6 py-2 rounded-lg bg-brand-purple/20 text-brand-purple hover:bg-brand-purple/30 transition-colors font-medium"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return children;
}
