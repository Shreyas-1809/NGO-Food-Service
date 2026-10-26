import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Clock, Utensils, Trash2, Edit, Sparkles } from 'lucide-react';
import Drawer from './ui/Drawer';
import Button from './ui/Button';
import StatusBadge from './ui/StatusBadge';
import EmptyState from './ui/EmptyState';
import { T } from '../context/LanguageContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

// Statuses where the listing is still in-progress — delete is hidden
const IN_PROGRESS_STATUSES = new Set(['ACTIVE', 'AVAILABLE', 'PENDING', 'Requests Sent', 'Accepted']);
// Terminal statuses where the owner can soft-delete (remove from dashboard)
// Matches the StatusBadge vocabulary: Pending, Requests Sent, Accepted, Completed, Declined, Awaiting NGO
const TERMINAL_STATUSES = new Set(['COMPLETED', 'Awaiting NGO', 'Requests Sent', 'Pending', 'Accepted', 'DECLINED']);

const MyPostingsDrawer = ({ isOpen, user, token, onClose, onEdit }) => {
  const [myPostings, setMyPostings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchMyPostings = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/food/my-listings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyPostings(res.data);
    } catch (err) {
      console.error('Failed to fetch postings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.accountType === 'DONOR' && isOpen) {
      fetchMyPostings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token, isOpen]);

  // Hard delete: only for unclaimed/available listings (original behavior)
  const handleHardDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    setDeletingId(id);
    try {
      await axios.delete(`${API_URL}/api/food/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyPostings(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  // Soft delete: for terminal-state listings — hides from dashboard, stays in history
  const handleSoftDelete = async (id) => {
    if (!window.confirm(
      'Delete this posting?\nIt will stay in your history and certificates.'
    )) return;
    setDeletingId(id);
    try {
      await axios.patch(`${API_URL}/api/food/${id}/owner-delete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyPostings(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to remove from dashboard');
    } finally {
      setDeletingId(null);
    }
  };

  // Clear all finished postings at once
  const handleClearAllFinished = async () => {
    const finished = myPostings.filter(p => {
      const s = p.computedStatus || p.status;
      return TERMINAL_STATUSES.has(s);
    });
    if (finished.length === 0) return;
    if (!window.confirm(
      `Remove all ${finished.length} finished posting(s) from your dashboard?\nThey will stay in your history and certificates.`
    )) return;
    try {
      await Promise.all(
        finished.map(p =>
          axios.patch(`${API_URL}/api/food/${p._id}/owner-delete`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => {})
        )
      );
      setMyPostings(prev => prev.filter(p => {
        const s = p.computedStatus || p.status;
        return !TERMINAL_STATUSES.has(s);
      }));
    } catch (err) {
      console.error(err);
    }
  };

  if (user?.accountType !== 'DONOR') {
    return (
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={<T text="My Active Listings" />}
        icon={Package}
      >
        <div className="p-6 text-center text-[#60708B]"><T text="Only donors have active postings." /></div>
      </Drawer>
    );
  }

  const allPostings = Array.isArray(myPostings) ? myPostings : [];
  const activePostings = allPostings.filter(p => {
    const s = p.computedStatus || p.status;
    return IN_PROGRESS_STATUSES.has(s);
  });
  const finishedPostings = allPostings.filter(p => {
    const s = p.computedStatus || p.status;
    return TERMINAL_STATUSES.has(s);
  });

  const renderCard = (post) => {
    const computedStatus = post.computedStatus || post.status;
    const isActive = IN_PROGRESS_STATUSES.has(computedStatus);
    const isTerminal = TERMINAL_STATUSES.has(computedStatus);
    const isEditable = isActive &&
      ['AVAILABLE', 'ACTIVE'].includes(post.status) &&
      (Date.now() - new Date(post.createdAt).getTime()) <= TWELVE_HOURS_MS;
    const isDeleting = deletingId === post._id;

    return (
      <div key={post._id} className="bg-[#F3F0EA] dark:bg-[#0F1A33]/50 p-4 rounded-xl border border-[#E5E1D8] dark:border-[#1E2D52] space-y-3">
        <div className="flex justify-between items-start">
          <h4 className="font-bold text-[#18315E] dark:text-white line-clamp-1 flex-1 pr-2">{post.title}</h4>
          <StatusBadge status={computedStatus} />
        </div>

        <div className="space-y-1 text-xs text-[#60708B] dark:text-slate-300">
          <div className="flex items-center">
            <Utensils className="w-3.5 h-3.5 mr-1.5 text-[#60708B] shrink-0" />
            {post.quantity} <T text="servings" /> • <T text={post.foodType} />
          </div>
          <div className="flex items-center">
            <Clock className="w-3.5 h-3.5 mr-1.5 text-[#60708B] shrink-0" />
            {post.status === 'AVAILABLE' || post.status === 'ACTIVE'
              ? `Expires: ${new Date(post.expiryTime).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}`
              : `Updated: ${new Date(post.updatedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}`}
          </div>
        </div>

        <div className="pt-2 border-t border-[#E5E1D8] dark:border-[#1E2D52]">
          {isActive ? (
            /* In-progress: only edit (if within 12h) and hard-delete (if unclaimed) */
            <div className="flex gap-2">
              {isEditable && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    onClose();
                    if (onEdit) onEdit(post);
                  }}
                  icon={Edit}
                >
                  <T text="Edit" />
                </Button>
              )}
              {['AVAILABLE', 'ACTIVE'].includes(post.status) && (
                <Button
                  variant="danger"
                  size="sm"
                  className={isEditable ? 'flex-1' : 'w-full'}
                  onClick={() => handleHardDelete(post._id)}
                  icon={Trash2}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting…' : <T text="Delete" />}
                </Button>
              )}
              {!isEditable && !['AVAILABLE', 'ACTIVE'].includes(post.status) && (
                <div className="text-[10px] text-[#60708B] dark:text-slate-400 italic text-center w-full py-1">
                  In progress — cannot delete while claimed
                </div>
              )}
              {!isEditable && ['AVAILABLE', 'ACTIVE'].includes(post.status) && (
                <div className="text-[10px] text-[#E5B85C] dark:text-[#D9B65D] font-medium text-center bg-[#F3F0EA] dark:bg-[#0F1A33]/40 p-1 rounded-lg border border-[#E5E1D8] dark:border-[#D9B65D] w-full mt-1">
                  <T text="Edit window closed (only allowed within 12 hours of posting)" />
                </div>
              )}
            </div>
          ) : isTerminal ? (
            /* Finished: small outlined trash icon — soft delete */
            <div className="flex justify-end">
              <button
                onClick={() => handleSoftDelete(post._id)}
                disabled={isDeleting}
                title="Remove from dashboard (stays in history)"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-[#1E2D52] hover:border-red-300 dark:hover:border-[#E5707A]/50 hover:text-red-500 dark:hover:text-[#E5707A] px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeleting ? 'Removing…' : 'Remove'}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={<T text="My Active Listings" />}
      subtitle={<T text="Manage your surplus food postings" />}
      icon={Package}
      width="w-full max-w-md"
    >
      <div className="flex-1 space-y-6">
        {loading ? (
          <div className="text-center py-8 text-[#60708B]"><T text="Loading postings..." /></div>
        ) : allPostings.length === 0 ? (
          <EmptyState
            icon={Package}
            message={<T text="No postings yet" />}
            className="py-12"
          />
        ) : (
          <>
            {/* In-progress section */}
            {activePostings.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#173B78] dark:text-[#D9B65D] px-0.5">
                  Active & In Progress
                </p>
                {activePostings.map(renderCard)}
              </div>
            )}

            {/* Finished section */}
            {finishedPostings.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-0.5">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Finished
                  </p>
                  <button
                    onClick={handleClearAllFinished}
                    className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-red-500 dark:hover:text-[#E5707A] transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    Clear all finished
                  </button>
                </div>
                {finishedPostings.map(renderCard)}
              </div>
            )}
          </>
        )}
      </div>
    </Drawer>
  );
};

export default MyPostingsDrawer;
