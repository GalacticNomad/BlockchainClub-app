import React, { useState } from 'react';
import { createSubmission } from '../utils/api';
import toast from 'react-hot-toast';

export default function SubmissionForm({ activityId, onCancel, onSubmitted }) {
  const [proofText, setProofText] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!proofText.trim()) {
      toast.error('Please describe what you did');
      return;
    }

    setSubmitting(true);
    try {
      await createSubmission({
        activity_id: activityId,
        proof_text: proofText.trim(),
        proof_url: proofUrl.trim() || null,
      });
      toast.success('Submission sent for review!');
      onSubmitted?.();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mt-2">
      <textarea
        value={proofText}
        onChange={(e) => setProofText(e.target.value)}
        placeholder="Describe what you did..."
        className="w-full bg-brand-dark border border-brand-border rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:border-brand-purple focus:outline-none resize-none"
        rows={3}
        required
      />
      <input
        type="url"
        value={proofUrl}
        onChange={(e) => setProofUrl(e.target.value)}
        placeholder="Link to proof (optional) - e.g. tweet URL, photo link"
        className="w-full bg-brand-dark border border-brand-border rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:border-brand-purple focus:outline-none"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 py-2 rounded-lg bg-gradient-solana text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 text-sm hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
