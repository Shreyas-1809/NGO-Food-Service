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
  CheckCheck,
  AlertTriangle,
  Award
} from 'lucide-react';
import { T, useTranslatedString } from '../context/LanguageContext';
import Drawer from './ui/Drawer';
import Button from './ui/Button';
import EmptyState from './ui/EmptyState';
import Modal from './ui/Modal';
import RejectDonationModal from './RejectDonationModal';
import DonationCertificateModal from './DonationCertificateModal';
import { formatPickupTime } from '../utils/formatters';


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

const NotificationsDrawer = ({ isOpen, user, token, socket, onClose, onNotificationChange }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedClaim, setSelectedClaim] = useState(null);
  const [loadingClaim, setLoadingClaim] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineInput, setShowDeclineInput] = useState(false);

  // Inline action state tracking
  const [actionInProgress, setActionInProgress] = useState({}); // notifId -> boolean
  const [claimError, setClaimError] = useState(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [certFoodId, setCertFoodId] = useState(null);

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
    setClaimError(null);

    // Task-progress notifications (accepted/in-transit/confirmed/delivered) deep-link
    // directly into the Active Pickups workspace instead of the inline detail view.
    const taskProgressTypes = ['CLAIM_ACCEPTED', 'NGO_CONFIRMED', 'PICKUP_CONFIRMED'];
    if (taskProgressTypes.includes(notif.type)) {
      onClose(); // close notifications drawer
      // Small timeout lets the close animation finish before opening the pickups drawer
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('OPEN_DRAWER', { detail: 'PICKUPS' }));
      }, 150);
      return;
    }

    if (notif.relatedClaimId) {
      setLoadingClaim(true);
      try {
        const res = await axios.get(`${API_URL}/api/claims/${notif.relatedClaimId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const claimMsg = res.data.message && !res.data.message.includes('requested to claim') 
          ? res.data.message 
          : (notif.message && !notif.message.includes('requested to claim') ? notif.message : '');
        setSelectedClaim({ ...res.data, notificationId: notif._id, notifType: notif.type, stage: notif.stage, message: claimMsg, createdAt: notif.createdAt });
        setShowDeclineInput(false);
        setDeclineReason('');
      } catch (err) {
        console.error('Failed to load claim details:', err);
        if (err.response?.status === 404) {
          setClaimError('This request is no longer available (it may have been deleted or resolved).');
        } else {
          setClaimError('Failed to load claim details.');
        }
        setSelectedClaim({
          _id: notif.relatedClaimId,
          notificationId: notif._id,
          notifType: notif.type,
          stage: notif.stage,
          isError: true,
          errorMsg: err.response?.status === 404 ? 'This request is no longer available.' : 'Failed to load details.'
        });
      } finally {
        setLoadingClaim(false);
      }
    }
  };

  // Accept Action from Detail View
  const handleAcceptClaim = async () => {
    if (!selectedClaim || !selectedClaim._id) return;
    const claimId = selectedClaim._id;
    const notifId = selectedClaim.notificationId;

    setActionInProgress(prev => ({ ...prev, [notifId]: true }));
    setClaimError(null);
    try {
      await axios.patch(`${API_URL}/api/claims/${claimId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotifications(prev => prev.map(n =>
        n._id === notifId
          ? { ...n, stage: 'Accepted — awaiting NGO confirmation', read: true }
          : n
      ));

      fetchNotifications();
      setSelectedClaim(null); // Close modal on success
    } catch (err) {
      console.error('Error accepting claim:', err);
      const errMsg = err.response?.data?.message || 'Failed to accept claim';
      if (err.response?.status === 400 || err.response?.status === 403 || err.response?.status === 404) {
        fetchNotifications();
      }
      setClaimError(errMsg);
    } finally {
      setActionInProgress(prev => ({ ...prev, [notifId]: false }));
    }
  };

  // Decline Action from Detail View
  const handleDeclineClaim = async (reason, notes) => {
    if (!selectedClaim || !selectedClaim._id) return;
    const claimId = selectedClaim._id;
    const notifId = selectedClaim.notificationId;

    setActionInProgress(prev => ({ ...prev, [notifId]: true }));
    setClaimError(null);
    try {
      const fullReason = notes ? `${reason} - ${notes}` : reason;
      await axios.patch(`${API_URL}/api/claims/${claimId}/decline`, { reason: fullReason }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotifications(prev => prev.map(n =>
        n._id === notifId
          ? { ...n, stage: 'Declined', read: true }
          : n
      ));

      fetchNotifications();
      setSelectedClaim(null); // Close modal on success
      setRejectModalOpen(false);
    } catch (err) {
      console.error('Error declining claim:', err);
      const errMsg = err.response?.data?.message || 'Failed to decline claim';
      setClaimError(errMsg);
      throw err; // So RejectDonationModal can handle loading state correctly
    } finally {
      setActionInProgress(prev => ({ ...prev, [notifId]: false }));
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

  const unreadList = notifications.filter(n => !n.read);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={<T text="Notifications" />}
      subtitle={isOrg ? <T text="Donor acceptances, updates & tracking" /> : <T text="Incoming organisation claims & shortage alerts" />}
      icon={Bell}
      width="w-full max-w-md"
    >
      <div className="flex flex-col h-full space-y-3 relative">

      {/* Quick Action Bar (Mark all read & Clear all) */}
      {notifications.length > 0 && !selectedClaim && (
        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700/60 flex justify-between items-center bg-slate-50/70 dark:bg-slate-900/40 text-[11px]">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            {unreadList.length} <T text="unread" /> • {notifications.length} <T text="total" />
          </span>
          <div className="flex gap-2">
            {unreadList.length > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span><T text="Mark all read" /></span>
              </button>
            )}
            <button
              onClick={handleClearAll}
              className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors font-semibold cursor-pointer"
            >
              <T text="Clear all" />
            </button>
          </div>
        </div>
      )}

      <RejectDonationModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onSubmit={handleDeclineClaim}
        isClaim={true}
      />

      {/* Main Notification Stream */}
      <div className="flex-1 space-y-3 relative">
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

            {selectedClaim.isError && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg border border-red-200 dark:border-red-800 text-xs font-semibold">
                {selectedClaim.errorMsg}
              </div>
            )}

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
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
              <span className="font-bold text-[10px] uppercase text-slate-400 tracking-wider block">
                Request Message / Intent
              </span>
              <p className="italic text-slate-700 dark:text-slate-200">
                {(() => {
                  const msg = selectedClaim.message;
                  if (!msg || !msg.trim()) return 'No message provided';
                  if (msg.includes('requested to claim')) {
                    const match = msg.match(/"([^"]+)"\s*$/);
                    if (match && match[1]) return `"${match[1]}"`;
                    return 'No message provided';
                  }
                  return `"${msg}"`;
                })()}
              </p>
            </div>

            {/* Food Listing Details & Separate Requested Pickup Box */}
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
              <p className="text-slate-500 dark:text-slate-400 text-[10px]">
                {selectedClaim.foodId?.foodType || 'Category not specified'}
              </p>

              {/* Separate small box for Requested Pickup */}
              {selectedClaim.requestedPickupTime && (
                <div className="mt-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-emerald-500 shrink-0" />
                  <span>
                    Requested Pickup: <strong>{formatPickupTime(selectedClaim.requestedPickupTime)}</strong>
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                <span>
                  Requested on {new Date(selectedClaim.createdAt || Date.now()).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
            </div>
            
            {/* Volunteer Assignment Section for ACCEPTED claims */}
            {selectedClaim.status === 'ACCEPTED' && (
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[10px] uppercase text-slate-400 tracking-wider">
                    Pickup Assignment
                  </span>
                  <button
                    onClick={() => {
                      const fId = selectedClaim.foodId?._id || selectedClaim.foodId;
                      setVolModalFoodId(fId);
                      const vols = selectedClaim.foodId?.volunteerAssignments || (selectedClaim.foodId?.volunteerAssignment?.name ? [selectedClaim.foodId.volunteerAssignment] : []);
                      setVolModalInitialVolunteers(vols);
                      setVolModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                  >
                    {selectedClaim.foodId?.volunteerAssignments?.length || selectedClaim.foodId?.volunteerAssignment?.name ? 'Edit Volunteers' : 'Arrange Pickup'}
                  </button>
                </div>
                {selectedClaim.foodId?.volunteerAssignments && selectedClaim.foodId.volunteerAssignments.length > 0 ? (
                  <div className="space-y-2">
                    {selectedClaim.foodId.volunteerAssignments.map((v, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        <p><strong className="text-slate-900 dark:text-white">Volunteer #{idx + 1}:</strong> {v.name}</p>
                        <p><strong className="text-slate-900 dark:text-white">Phone:</strong> {v.phone}</p>
                        {v.vehicleNumber && <p><strong className="text-slate-900 dark:text-white">Vehicle:</strong> {v.vehicleNumber}</p>}
                      </div>
                    ))}
                  </div>
                ) : selectedClaim.foodId?.volunteerAssignment?.name ? (
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    <p><strong className="text-slate-900 dark:text-white">Volunteer:</strong> {selectedClaim.foodId.volunteerAssignment.name}</p>
                    <p><strong className="text-slate-900 dark:text-white">Phone:</strong> {selectedClaim.foodId.volunteerAssignment.phone}</p>
                    {selectedClaim.foodId.volunteerAssignment.arrivalTime && <p><strong className="text-slate-900 dark:text-white">Vehicle:</strong> {selectedClaim.foodId.volunteerAssignment.arrivalTime}</p>}
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 text-slate-500 italic text-center">
                    Volunteer not yet assigned
                  </div>
                )}

                {/* Volunteer Status Indicator / Decline Alert */}
                {selectedClaim.foodId?.volunteerStatus === 'declined' ? (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        Volunteer Declined Task
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const fId = selectedClaim.foodId?._id || selectedClaim.foodId;
                          setVolModalFoodId(fId);
                          const vols = selectedClaim.foodId?.volunteerAssignments || (selectedClaim.foodId?.volunteerAssignment?.name ? [selectedClaim.foodId.volunteerAssignment] : []);
                          setVolModalInitialVolunteers(vols);
                          setVolModalOpen(true);
                        }}
                        className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold transition-colors shadow-xs cursor-pointer"
                      >
                        Reassign Volunteer
                      </button>
                    </div>
                    {selectedClaim.foodId?.volunteerDeclineReason && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-300 italic">
                        Reason: "{selectedClaim.foodId.volunteerDeclineReason}"
                      </p>
                    )}
                  </div>
                ) : selectedClaim.foodId?.volunteerStatus === 'accepted' ? (
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Volunteer Accepted & En Route</span>
                  </div>
                ) : selectedClaim.foodId?.volunteerStatus === 'pending' && (selectedClaim.foodId?.volunteerAssignments?.length > 0 || selectedClaim.foodId?.volunteerAssignment?.name) ? (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Awaiting Volunteer Response</span>
                  </div>
                ) : null}
              </div>
            )}

            {/* Expanded Action Buttons */}
            {selectedClaim.status === 'PENDING' && user?.accountType === 'DONOR' ? (
              <div className="flex flex-col gap-2 pt-2">
                {claimError && (
                  <div className="text-red-500 text-xs p-2 bg-red-50 dark:bg-red-900/30 rounded-lg font-medium text-center">
                    {claimError}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    className="flex-1"
                    disabled={actionInProgress[selectedClaim.notificationId]}
                    onClick={handleAcceptClaim}
                    icon={Check}
                  >
                    {actionInProgress[selectedClaim.notificationId] ? 'Accepting...' : 'Accept Request'}
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    disabled={actionInProgress[selectedClaim.notificationId]}
                    onClick={() => setRejectModalOpen(true)}
                    icon={XCircle}
                  >
                    Decline Request
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-center p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold uppercase text-xs border border-emerald-200 dark:border-emerald-800">
                  Claim {selectedClaim.status} ✓
                </div>
                {(selectedClaim.status === 'COMPLETED' || selectedClaim.foodId?.volunteerStatus === 'delivered') && (
                  <button
                    type="button"
                    onClick={() => {
                      const fId = selectedClaim.foodId?._id || selectedClaim.foodId;
                      if (fId) {
                        setCertFoodId(fId);
                        setCertModalOpen(true);
                      }
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <Award className="w-4 h-4" />
                    <span>View Donation Certificate 📜</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : loading ? (
          <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading notifications...</span>
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            message="No active notifications"
            className="py-14"
            action={
              <p className="text-[11px] text-slate-400 leading-relaxed text-center">
                {isOrg
                  ? 'Incoming acceptance notifications and tracking updates from donors will appear here.'
                  : 'Incoming claim requests and updates from verified NGOs will appear here.'}
              </p>
            }
          />
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

                  {/* We removed the inline Accept/Decline buttons to favor the Detail View modal */}

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

                  {/* Delivery Certificate Button for Donor / Recipient */}
                  {(note.type === 'PICKUP_CONFIRMED' || (note.title && note.title.toLowerCase().includes('delivered')) || (note.stage && note.stage.toLowerCase().includes('delivered'))) && (
                    <div className="pt-1 border-t border-emerald-100 dark:border-emerald-900/40" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          const fId = note.foodId?._id || note.foodId || note.relatedClaimId?.foodId?._id || note.relatedClaimId?.foodId;
                          if (fId) {
                            setCertFoodId(fId);
                            setCertModalOpen(true);
                          }
                        }}
                        className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer text-xs transition-colors"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>View Donation Certificate 📜</span>
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
      
      <DonationCertificateModal
        isOpen={certModalOpen}
        onClose={() => setCertModalOpen(false)}
        foodId={certFoodId}
      />
    </Drawer>
  );
};

export default NotificationsDrawer;
