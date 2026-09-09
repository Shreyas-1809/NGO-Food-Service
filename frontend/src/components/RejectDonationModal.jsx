import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const REJECTION_REASONS = [
  'Quantity Mismatch',
  'Timing / Pickup Window Conflict',
  'Food Type Not Suitable',
  'Capacity Exceeded',
  'Already Fulfilled',
  'Other'
];

const RejectDonationModal = ({ isOpen, onClose, donation, token, onSuccess }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!donation) return null;

  const isOther = selectedReason === 'Other';
  const isValid = selectedReason && (isOther ? otherReason.trim().length > 0 : true);

  const handleSubmit = async () => {
    if (!isValid) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      const finalReason = isOther ? otherReason.trim() : selectedReason;
      await axios.patch(`${API_URL}/api/food/${donation._id}/reject`, {
        reason: finalReason,
        notes: notes.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to reject donation:', err);
      setError(err.response?.data?.message || 'Failed to reject donation');
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reject Donation"
      icon={AlertTriangle}
      iconClassName="text-red-500 bg-red-100 dark:bg-red-900/30"
      maxWidth="max-w-md"
    >
      <div className="space-y-6">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Please select a reason for rejecting <strong>{donation.title}</strong>. This will remove it from your feed and notify the donor.
        </p>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Reason for Rejection
          </label>
          <div className="space-y-2">
            {REJECTION_REASONS.map(reason => (
              <label key={reason} className="flex items-start space-x-3 cursor-pointer group">
                <input
                  type="radio"
                  name="rejectionReason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="mt-1 w-4 h-4 text-red-600 bg-slate-100 border-slate-300 focus:ring-red-500 dark:focus:ring-red-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  {reason}
                </span>
              </label>
            ))}
          </div>
        </div>

        {isOther && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Please specify <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              maxLength={200}
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value)}
              placeholder="Brief reason (max 200 chars)"
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Additional Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any extra context for the donor..."
            rows={2}
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/50 resize-none"
          />
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          variant="danger" 
          onClick={handleSubmit} 
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Confirm Rejection'}
        </Button>
      </div>
    </Modal>
  );
};

export default RejectDonationModal;
