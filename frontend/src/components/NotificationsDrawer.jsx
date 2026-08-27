import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Bell,
  X,
  Check,
  XCircle,
  MapPin,
  Sparkles,
  Building2,
  Utensils,
  CheckCircle2,
  Trash2,
  Clock,
  ChevronRight,
  ShieldCheck,
  Send,
  Truck,
  CheckCheck
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getStageBadgeColor = (stage, type) => {
  if (!stage) {
    if (type === 'CLAIM_REQUEST') return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800';
    if (type === 'CLAIM_ACCEPTED') return 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800';
    if (type === 'CLAIM_DECLINED') return 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800';
    if (type === 'NGO_CONFIRMED') return 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800';
    if (type === 'PICKUP_CONFIRMED') return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
    return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  }

  const s = stage.toLowerCase();
  if (s.includes('delivered') || s.includes('completed') || s.includes('✓')) {
    return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
  }
  if (s.includes('declined') || s.includes('rejected')) {
    return 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800';
  }
  if (s.includes('confirmed') || s.includes('arranging') || s.includes('volunteer')) {
    return 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800';
  }
  if (s.includes('accepted')) {
    return 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800';
  }
  if (s.includes('awaiting') || s.includes('pending') || s.includes('decision')) {
    return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800';
  }
  return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
};

const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Just now';
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 45) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const NotificationsDrawer = ({ user, token, socket, onClose, onNotificationChange }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedClaim, setSelectedClaim] = useState(null);
  const [loadingClaim, setLoadingClaim] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineInput, setShowDeclineInput] = useState(false);

  // Inline action state tracking
  const [actionInProgress, setActionInProgress] = useState({}); // notifId -> boolean
  const [inlineDeclineId, setInlineDeclineId] = useState(null);
  const [inlineDeclineReason, setInlineDeclineReason] = useState('');

  const isOrg = user?.accountType === 'ORGANISATION' ||
                user?.accountType === 'ORGANIZATION' ||
                user?.role === 'ORGANISATION' ||
                user?.role === 'ORGANIZATION' ||
                Boolean(user?.orgName);

  const userId = user?.id || user?._id;

  // Fetch strictly authenticated notifications from backend for current user
  const fetchNotifications = useCallback(async () => {
    try {
      if (userId && token) {
        const res = await axios.get(`${API_URL}/api/notifications/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const list = res.data || [];
        setNotifications(list);
        if (onNotificationChange) onNotificationChange();
      }
    } catch (err) {
      console.error('Error fetching backend notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, token, onNotificationChange]);

  useEffect(() => {
    fetchNotifications();

    // Socket listeners for real-time live updates
    if (socket) {
      const handleLiveNotification = () => {
        fetchNotifications();
      };

      socket.on('NEW_NOTIFICATION', handleLiveNotification);
      socket.on('CLAIM_REQUEST_RECEIVED', handleLiveNotification);
      socket.on('CLAIM_ACCEPTED', handleLiveNotification);
      socket.on('CLAIM_DECLINED', handleLiveNotification);
      socket.on('NGO_CONFIRMED', handleLiveNotification);
      socket.on('PICKUP_CONFIRMED', handleLiveNotification);

      return () => {
        socket.off('NEW_NOTIFICATION', handleLiveNotification);
        socket.off('CLAIM_REQUEST_RECEIVED', handleLiveNotification);
        socket.off('CLAIM_ACCEPTED', handleLiveNotification);
        socket.off('CLAIM_DECLINED', handleLiveNotification);
        socket.off('NGO_CONFIRMED', handleLiveNotification);
        socket.off('PICKUP_CONFIRMED', handleLiveNotification);
      };
    }
  }, [socket, fetchNotifications]);

  // Persistent Delete / Dismiss single Notification
  const handleDeleteNotification = async (notif, e) => {
    if (e) e.stopPropagation();
    setNotifications(prev => prev.filter(n => n._id !== notif._id));
    if (onNotificationChange) setTimeout(onNotificationChange, 50);
    try {
      await axios.delete(`${API_URL}/api/notifications/${notif._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error('Error soft-deleting notification:', err);
    }
  };

  // Clear all notifications
  const handleClearAll = async () => {
    setNotifications([]);
    if (onNotificationChange) setTimeout(onNotificationChange, 50);
    try {
      await axios.delete(`${API_URL}/api/notifications/clear-all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error('Error clearing all notifications:', err);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (onNotificationChange) setTimeout(onNotificationChange, 50);
    try {
      await axios.patch(`${API_URL}/api/notifications/mark-all-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // Mark single as read when clicking
  const markAsRead = async (notif) => {
    if (notif.read) return;
    setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n));
    if (onNotificationChange) setTimeout(onNotificationChange, 50);
    try {
      await axios.patch(`${API_URL}/api/notifications/${notif._id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (e) {}
  };

  const handleNotificationClick = async (notif) => {
    markAsRead(notif);

    if (notif.relatedClaimId) {
      setLoadingClaim(true);
      try {
        const res = await axios.get(`${API_URL}/api/claims/${notif.relatedClaimId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSelectedClaim({ ...res.data, notificationId: notif._id, notifType: notif.type, stage: notif.stage });
        setShowDeclineInput(false);
        setDeclineReason('');
      } catch (err) {
        console.error('Failed to load claim details:', err);
      } finally {
        setLoadingClaim(false);
      }
    }
  };

  // Inline Accept Action directly from Notification Card
  const handleInlineAccept = async (notif, e) => {
    if (e) e.stopPropagation();
    const claimId = notif.relatedClaimId;
    if (!claimId) return;

    setActionInProgress(prev => ({ ...prev, [notif._id]: true }));
    try {
      await axios.patch(`${API_URL}/api/claims/${claimId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotifications(prev => prev.map(n =>
        n._id === notif._id
          ? { ...n, stage: 'Accepted — awaiting NGO confirmation', read: true }
          : n
      ));

      fetchNotifications();
    } catch (err) {
      console.error('Error accepting claim inline:', err);
      const errMsg = err.response?.data?.message || 'Failed to accept claim';
      if (err.response?.status === 400 || err.response?.status === 403) {
        // Refresh notifications to show current actual state
        fetchNotifications();
      }
      alert(errMsg);
    } finally {
      setActionInProgress(prev => ({ ...prev, [notif._id]: false }));
    }
  };

  // Inline Decline Action directly from Notification Card
  const handleInlineDecline = async (notif, e) => {
    if (e) e.stopPropagation();
    const claimId = notif.relatedClaimId;
    if (!claimId) return;

    setActionInProgress(prev => ({ ...prev, [notif._id]: true }));
    try {
      await axios.patch(`${API_URL}/api/claims/${claimId}/decline`, { reason: inlineDeclineReason }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotifications(prev => prev.map(n =>
        n._id === notif._id
          ? { ...n, stage: 'Declined', read: true }
          : n
      ));

      setInlineDeclineId(null);
      setInlineDeclineReason('');
      fetchNotifications();
    } catch (err) {
      console.error('Error declining claim inline:', err);
      const errMsg = err.response?.data?.message || 'Failed to decline claim';
      fetchNotifications();
      alert(errMsg);
    } finally {
      setActionInProgress(prev => ({ ...prev, [notif._id]: false }));
    }
  };

  // NGO Confirm Step directly from Notification
  const handleNgoConfirm = async (notif, e) => {
    if (e) e.stopPropagation();
    const claimId = notif.relatedClaimId;
    if (!claimId) return;

    setActionInProgress(prev => ({ ...prev, [notif._id]: true }));
    try {
      await axios.patch(`${API_URL}/api/claims/${claimId}/ngo-confirm`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotifications(prev => prev.map(n =>
        n._id === notif._id
          ? { ...n, stage: 'Confirmed — preparing for pickup', read: true }
          : n
      ));

      fetchNotifications();
    } catch (err) {
      console.error('Error confirming pickup on NGO side:', err);
      alert(err.response?.data?.message || 'Failed to confirm pickup');
    } finally {
      setActionInProgress(prev => ({ ...prev, [notif._id]: false }));
    }
  };

  // Expanded View Accept Handler
  const handleAcceptBackendClaim = async () => {
    if (!selectedClaim) return;
    try {
      await axios.patch(`${API_URL}/api/claims/${selectedClaim._id}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSelectedClaim(prev => ({ ...prev, status: 'ACCEPTED' }));
      fetchNotifications();
    } catch (err) {
      console.error('Error accepting claim:', err);
      alert(err.response?.data?.message || 'Failed to accept claim');
    }
  };

  // Expanded View Decline Handler
  const handleDeclineBackendClaim = async () => {
    if (!selectedClaim) return;
    try {
      await axios.patch(`${API_URL}/api/claims/${selectedClaim._id}/decline`, { reason: declineReason }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSelectedClaim(prev => ({ ...prev, status: 'DECLINED' }));
      fetchNotifications();
    } catch (err) {
      console.error('Error declining claim:', err);
      alert(err.response?.data?.message || 'Failed to decline claim');
    }
  };

  const unreadList = notifications.filter(n => !n.read);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800 select-none">

      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xs z-10">
        <div>
          <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center">
            <Bell className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-400" />
            Notifications
          </h3>
          <span className="text-[11px] text-slate-400 block">
            {isOrg ? 'Donor acceptances, updates & tracking' : 'Incoming organisation claims & shortage alerts'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          title="Close panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Action Bar (Mark all read & Clear all) */}
      {notifications.length > 0 && !selectedClaim && (
        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700/60 flex justify-between items-center bg-slate-50/70 dark:bg-slate-900/40 text-[11px]">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            {unreadList.length} unread • {notifications.length} total
          </span>
          <div className="flex gap-2">
            {unreadList.length > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
            <button
              onClick={handleClearAll}
              className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors font-semibold cursor-pointer"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Main Notification Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
        {selectedClaim ? (
          /* Expanded Claim Details View */
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 animate-in slide-in-from-right-4 space-y-4">
            <button
              onClick={() => setSelectedClaim(null)}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center hover:underline cursor-pointer"
            >
              &larr; Back to notifications
            </button>

            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                Organisation Claim Details
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStageBadgeColor(selectedClaim.status, 'CLAIM_REQUEST')}`}>
                {selectedClaim.status}
              </span>
            </div>

            {/* NGO Information Box */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <span className="font-bold text-[10px] uppercase text-emerald-600 dark:text-emerald-400 tracking-wider block">
                NGO Information
              </span>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {selectedClaim.ngoId?.orgName || selectedClaim.ngoId?.fullName || 'Verified NGO'}
              </p>
              {selectedClaim.ngoId?.address && (
                <div className="text-slate-600 dark:text-slate-300 flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" />
                  <span>{[selectedClaim.ngoId.address, selectedClaim.ngoId.city].filter(Boolean).join(', ')}</span>
                </div>
              )}
              {selectedClaim.ngoId?.phone && (
                <div className="text-slate-600 dark:text-slate-300 flex items-center">
                  <span className="font-semibold text-slate-500 mr-1.5">Phone:</span>
                  <span>{selectedClaim.ngoId.phone}</span>
                </div>
              )}
              {selectedClaim.ngoId?.email && (
                <div className="text-slate-600 dark:text-slate-300 flex items-center">
                  <span className="font-semibold text-slate-500 mr-1.5">Email:</span>
                  <span>{selectedClaim.ngoId.email}</span>
                </div>
              )}
            </div>

            {/* Request Description / Message Box */}
            {selectedClaim.message && (
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                <span className="font-bold text-[10px] uppercase text-slate-400 tracking-wider block">
                  Request Message / Intent
                </span>
                <p className="italic text-slate-700 dark:text-slate-200">
                  "{selectedClaim.message}"
                </p>
              </div>
            )}

            {/* Food Listing & Pickup Time Box */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <span className="font-bold text-[10px] uppercase text-slate-400 tracking-wider block">
                Listing Details
              </span>
              <p className="font-bold text-slate-800 dark:text-white text-sm">
                {selectedClaim.foodId?.title || 'Surplus Food'}
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                {selectedClaim.foodId?.quantity || 0} Servings
              </p>
              {selectedClaim.requestedPickupTime && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 font-semibold flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-emerald-500 shrink-0" />
                  <span>
                    Requested Pickup: {new Date(selectedClaim.requestedPickupTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              )}
            </div>

            {/* Expanded Action Buttons */}
            {selectedClaim.status === 'PENDING' && user?.accountType === 'DONOR' ? (
              <div className="flex flex-col gap-2 pt-2">
                {!showDeclineInput ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleAcceptBackendClaim}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer text-xs transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      <span>Accept Request</span>
                    </button>
                    <button
                      onClick={() => setShowDeclineInput(true)}
                      className="flex-1 py-2.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 rounded-xl font-bold flex items-center justify-center space-x-1.5 cursor-pointer text-xs transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Decline Request</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 animate-in fade-in">
                    <input
                      type="text"
                      placeholder="Reason for declining (optional)"
                      value={declineReason}
                      onChange={e => setDeclineReason(e.target.value)}
                      className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-800 dark:text-white outline-none focus:border-red-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleDeclineBackendClaim}
                        className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs cursor-pointer transition-colors"
                      >
                        Confirm Decline
                      </button>
                      <button
                        onClick={() => setShowDeclineInput(false)}
                        className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold uppercase text-xs border border-emerald-200 dark:border-emerald-800">
                Claim {selectedClaim.status} ✓
              </div>
            )}
          </div>
        ) : loading ? (
          <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading notifications...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-xs text-slate-500 text-center py-14 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2 p-6">
            <Bell className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-40" />
            <p className="font-bold text-sm text-slate-700 dark:text-slate-200">No active notifications</p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {isOrg
                ? 'Incoming acceptance notifications and tracking updates from donors will appear here.'
                : 'Incoming claim requests and updates from verified NGOs will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(note => {
              const stageLabel = note.stage || (
                note.type === 'CLAIM_REQUEST' ? 'Awaiting your decision' :
                note.type === 'CLAIM_ACCEPTED' ? 'Accepted — awaiting NGO confirmation' :
                note.type === 'CLAIM_DECLINED' ? 'Declined' :
                note.type === 'NGO_CONFIRMED' ? 'NGO Confirmed' :
                note.type === 'PICKUP_CONFIRMED' ? 'Delivered ✓' : null
              );

              const isPendingDonorClaim =
                user?.accountType === 'DONOR' &&
                note.type === 'CLAIM_REQUEST' &&
                note.relatedClaimId &&
                (!note.stage || note.stage.toLowerCase().includes('awaiting'));

              const isAcceptedNgoNotification =
                isOrg &&
                note.type === 'CLAIM_ACCEPTED' &&
                note.relatedClaimId &&
                (!note.stage || !note.stage.toLowerCase().includes('confirmed') && !note.stage.toLowerCase().includes('delivered'));

              const isActing = actionInProgress[note._id];

              return (
                <div
                  key={note._id}
                  onClick={() => handleNotificationClick(note)}
                  className={`p-3.5 rounded-2xl border transition-all space-y-2.5 relative group cursor-pointer ${
                    note.read
                      ? 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                      : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-500'
                  }`}
                >
                  {/* Top Bar: Title, Stage Badge, Dismiss/Delete Button */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {note.title && (
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 truncate block">
                            {note.title}
                          </span>
                        )}
                        {stageLabel && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStageBadgeColor(stageLabel, note.type)}`}>
                            {stageLabel}
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-slate-900 dark:text-white leading-relaxed">
                        {note.message}
                      </p>
                    </div>

                    {/* Delete / Dismiss Button */}
                    <button
                      onClick={(e) => handleDeleteNotification(note, e)}
                      className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors shrink-0 cursor-pointer"
                      title="Delete notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* INLINE ACTIONS FOR DONOR: Accept / Decline directly from list */}
                  {isPendingDonorClaim && (
                    <div className="pt-1 border-t border-emerald-100 dark:border-emerald-900/40" onClick={e => e.stopPropagation()}>
                      {inlineDeclineId !== note._id ? (
                        <div className="flex gap-2">
                          <button
                            disabled={isActing}
                            onClick={(e) => handleInlineAccept(note, e)}
                            className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center space-x-1 shadow-xs cursor-pointer text-xs transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isActing ? 'Accepting...' : 'Accept'}</span>
                          </button>
                          <button
                            disabled={isActing}
                            onClick={(e) => {
                              e.stopPropagation();
                              setInlineDeclineId(note._id);
                            }}
                            className="flex-1 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 rounded-xl font-bold flex items-center justify-center space-x-1 cursor-pointer text-xs transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Decline</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2 pt-1 animate-in fade-in">
                          <input
                            type="text"
                            placeholder="Reason for declining (optional)"
                            value={inlineDeclineReason}
                            onChange={e => setInlineDeclineReason(e.target.value)}
                            className="w-full p-2 text-xs border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-800 dark:text-white outline-none focus:border-red-500"
                          />
                          <div className="flex gap-2">
                            <button
                              disabled={isActing}
                              onClick={(e) => handleInlineDecline(note, e)}
                              className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs cursor-pointer transition-colors"
                            >
                              {isActing ? 'Declining...' : 'Confirm Decline'}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setInlineDeclineId(null);
                                setInlineDeclineReason('');
                              }}
                              className="py-1.5 px-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* INLINE ACTION FOR NGO: Confirm Collection after being accepted */}
                  {isAcceptedNgoNotification && (
                    <div className="pt-1 border-t border-blue-100 dark:border-blue-900/40" onClick={e => e.stopPropagation()}>
                      <button
                        disabled={isActing}
                        onClick={(e) => handleNgoConfirm(note, e)}
                        className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer text-xs transition-colors"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>{isActing ? 'Confirming...' : 'Confirm Pickup Arrangement'}</span>
                      </button>
                    </div>
                  )}

                  {/* Bottom Bar: Timestamp and subtle Read Indicator */}
                  <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {formatTimeAgo(note.createdAt)}
                    </span>

                    {note.relatedClaimId && (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center group-hover:underline">
                        Details <ChevronRight className="w-3 h-3 ml-0.5" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsDrawer;
