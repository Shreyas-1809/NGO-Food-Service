import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, X, Check, XCircle, MapPin, Sparkles, Building2, Utensils, CheckCircle2, Trash2 } from 'lucide-react';
import {
  getStoredNotifications,
  addNotification,
  getStoredDonations,
  confirmDonationMatch,
  subscribeToDonationUpdates
} from '../services/donationService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function getDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const NotificationsDrawer = ({ user, token, socket, onClose }) => {
  const [backendNotifications, setBackendNotifications] = useState([]);
  const [storedNotifications, setStoredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [loadingClaim, setLoadingClaim] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineInput, setShowDeclineInput] = useState(false);
  const [dismissedIds, setDismissedIds] = useState(new Set());

  const isOrg = user?.accountType === 'ORGANISATION' || 
                user?.accountType === 'ORGANIZATION' || 
                user?.role === 'ORGANISATION' || 
                user?.role === 'ORGANIZATION' || 
                Boolean(user?.orgName);

  const fetchNotifications = async () => {
    // 1. Fetch local storage notifications
    try {
      const allStored = getStoredNotifications();
      // Filter out initial static mock demo data (notif-1, notif-2, notif-3)
      const nonMock = allStored.filter(n => !['notif-1', 'notif-2', 'notif-3'].includes(n.id));
      
      // Filter strictly by targetRole:
      // Donors only see notifications created by / targeted from Organisations
      // Organisations only see notifications created by / targeted from Donors
      const roleFiltered = nonMock.filter(note => {
        if (isOrg) {
          return note.targetRole === 'ORGANISATION';
        } else {
          return note.targetRole === 'DONOR';
        }
      });
      setStoredNotifications(roleFiltered);
    } catch (e) {
      console.error('Error reading stored notifications:', e);
    }

    // 2. Fetch backend notifications
    try {
      if (user?.id && token) {
        const res = await axios.get(`${API_URL}/api/notifications/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBackendNotifications(res.data || []);
      }
    } catch (err) {
      // Backend error fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const unsubscribe = subscribeToDonationUpdates(fetchNotifications);

    const handleStorageChange = (e) => {
      if (e.key === 'donor_bridge_notifications_v1' || e.key === 'donor_bridge_donations_v1' || e.key === 'donor_bridge_requests_v1') {
        fetchNotifications();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    const interval = setInterval(fetchNotifications, 10000);
    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [user, token, isOrg]);

  // Combine and exclude dismissed/read notifications so once viewed they disappear
  const combinedNotifications = [
    ...storedNotifications.map(n => ({
      _id: n.id,
      id: n.id,
      message: n.message || n.title,
      title: n.title,
      type: n.type || 'INFO',
      read: Boolean(n.read),
      createdAt: n.createdAt || new Date().toISOString(),
      isStored: true,
      data: n
    })),
    ...backendNotifications.map(n => ({
      ...n,
      isStored: false
    }))
  ]
  .filter(n => !dismissedIds.has(n._id) && !n.read)
  .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  // Dismiss notification once viewed or clicked
  const handleDismissNotification = async (notif) => {
    setDismissedIds(prev => new Set([...prev, notif._id]));
    
    if (notif.isStored) {
      const current = getStoredNotifications();
      const updated = current.map(n => n.id === notif.id ? { ...n, read: true } : n);
      localStorage.setItem('donor_bridge_notifications_v1', JSON.stringify(updated));
    } else {
      try {
        await axios.patch(`${API_URL}/api/notifications/${notif._id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch(e) {}
    }
    fetchNotifications();
  };

  const handleNotificationClick = async (notif) => {
    if (notif.type === 'CLAIM_REQUEST' && notif.relatedClaimId) {
      setLoadingClaim(true);
      try {
        const res = await axios.get(`${API_URL}/api/claims/${notif.relatedClaimId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSelectedClaim({ ...res.data, notificationId: notif._id });
        setShowDeclineInput(false);
        setDeclineReason('');
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingClaim(false);
      }
    } else {
      // For general notifications, once viewed it clears
      handleDismissNotification(notif);
    }
  };

  // Donor accepts a claim or shortage request from notification
  const handleAcceptRequest = async (notif) => {
    const data = notif.data || notif;
    const donorName = user?.name || user?.fullName || 'Personal Donor';

    // If backend claim is associated:
    if (data.relatedClaimId) {
      try {
        await axios.patch(`${API_URL}/api/claims/${data.relatedClaimId}/accept`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (e) {
        console.error('Error accepting backend claim:', e);
      }
    }

    // Local matching if applicable:
    const donations = getStoredDonations();
    let targetDonation = null;
    if (data.matchingDonationId) {
      targetDonation = donations.find(d => d.id === data.matchingDonationId);
    }
    if (!targetDonation) {
      targetDonation = donations.find(d => d.status === 'CREATED' || d.status === 'AVAILABLE') || donations[0];
    }

    if (targetDonation && data.relatedNgoId) {
      confirmDonationMatch(
        targetDonation.id,
        data.relatedNgoId,
        data.relatedNgoName || data.ngoName || 'Partner Organisation'
      );
    }

    // 2-Way Sync: Notify the Organisation immediately!
    addNotification({
      title: 'Request Accepted by Donor! 🤝',
      message: `${donorName} accepted your request for ${data.relatedItem || data.foodTitle || 'food surplus'}. The donation is confirmed!`,
      type: 'SUCCESS',
      targetRole: 'ORGANISATION',
      targetNgoId: data.relatedNgoId || data.ngoId,
      relatedDonationId: targetDonation ? targetDonation.id : null,
      donorName,
      item: data.relatedItem || data.foodTitle
    });

    // Mark as dismissed/read
    handleDismissNotification(notif);
  };

  const handleAcceptBackendClaim = async () => {
    try {
      await axios.patch(`${API_URL}/api/claims/${selectedClaim._id}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const donorName = user?.name || user?.fullName || 'Personal Donor';
      addNotification({
        title: 'Claim Request Accepted! 🤝',
        message: `${donorName} accepted your claim for "${selectedClaim.foodId?.title || 'food surplus'}".`,
        type: 'SUCCESS',
        targetRole: 'ORGANISATION',
        donorName
      });

      if (selectedClaim.notificationId) {
        handleDismissNotification({ _id: selectedClaim.notificationId, isStored: false });
      }

      setSelectedClaim(null);
      fetchNotifications();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to accept claim');
    }
  };

  const handleDeclineBackendClaim = async () => {
    try {
      await axios.patch(`${API_URL}/api/claims/${selectedClaim._id}/decline`, { reason: declineReason }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (selectedClaim.notificationId) {
        handleDismissNotification({ _id: selectedClaim.notificationId, isStored: false });
      }

      setSelectedClaim(null);
      fetchNotifications();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to decline claim');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
        <div>
          <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center">
            <Bell className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-400" /> Notifications
          </h3>
          <span className="text-[11px] text-slate-400 block">
            {isOrg ? 'Donor updates & request acceptances' : 'Organisation claims & shortage requests'}
          </span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-white p-1 rounded-lg cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 relative">
        {selectedClaim ? (
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 animate-in slide-in-from-right-4 space-y-4">
            <button onClick={() => setSelectedClaim(null)} className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center hover:underline cursor-pointer">
               &larr; Back to notifications
            </button>
            <h4 className="font-extrabold text-base text-slate-900 dark:text-white">Organisation Claim Request</h4>
            
            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
              <p className="font-bold text-slate-900 dark:text-white text-sm">{selectedClaim.ngoId?.orgName || selectedClaim.ngoId?.fullName}</p>
              <div className="text-slate-600 dark:text-slate-400 flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {(() => {
                  const donorCoords = selectedClaim.foodId?.location?.coordinates;
                  const ngoCoords = selectedClaim.ngoId?.location?.coordinates;
                  const dist = getDistance(
                    donorCoords?.[1], donorCoords?.[0], 
                    ngoCoords?.[1], ngoCoords?.[0]
                  );
                  return dist !== null ? `${dist.toFixed(1)} km away` : 'Pune Hub';
                })()}
              </div>
              {selectedClaim.message && (
                <p className="mt-1 text-xs italic text-slate-700 dark:text-slate-300">"{selectedClaim.message}"</p>
              )}
            </div>

            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
              <span className="font-bold text-[10px] uppercase text-slate-400 block tracking-wider">Requested Item</span>
              <p className="font-bold text-slate-800 dark:text-white">{selectedClaim.foodId?.title}</p>
              <p className="text-slate-600 dark:text-slate-400">{selectedClaim.foodId?.quantity} servings</p>
            </div>

            {selectedClaim.status === 'PENDING' ? (
              <div className="flex flex-col gap-2 pt-2">
                {!showDeclineInput ? (
                  <>
                    <button onClick={handleAcceptBackendClaim} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer text-xs">
                      <Check className="w-4 h-4" />
                      <span>Accept Request</span>
                    </button>
                    <button onClick={() => setShowDeclineInput(true)} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold flex items-center justify-center space-x-1.5 cursor-pointer text-xs">
                      <XCircle className="w-4 h-4" />
                      <span>Decline</span>
                    </button>
                  </>
                ) : (
                  <div className="space-y-2 animate-in fade-in">
                    <input 
                      type="text" 
                      placeholder="Reason for declining (optional)" 
                      value={declineReason}
                      onChange={e => setDeclineReason(e.target.value)}
                      className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-800 dark:text-white outline-none"
                    />
                    <div className="flex gap-2">
                      <button onClick={handleDeclineBackendClaim} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs cursor-pointer">
                        Confirm Decline
                      </button>
                      <button onClick={() => setShowDeclineInput(false)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs cursor-pointer">
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
           <div className="text-center py-8 text-slate-400 text-xs">Loading notifications...</div>
        ) : combinedNotifications.length === 0 ? (
          <div className="text-xs text-slate-500 text-center py-10 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-1">
            <Bell className="w-6 h-6 mx-auto text-slate-400 mb-1 opacity-50" />
            <p className="font-bold">No active notifications</p>
            <p className="text-[11px] text-slate-400">
              {isOrg
                ? 'Incoming acceptance notifications from donors will appear here.'
                : 'Incoming shortage requests & claims from organisations will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {combinedNotifications.map(note => {
              const isRequest = note.type === 'REQUEST' || note.type === 'CLAIM_REQUEST';

              return (
                <div 
                  key={note._id} 
                  onClick={() => handleNotificationClick(note)}
                  className="p-3.5 rounded-2xl border cursor-pointer transition-all space-y-2 bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-500 relative group"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      {note.title && (
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                          {note.title}
                        </span>
                      )}
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {note.message}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismissNotification(note);
                      }}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                      title="Dismiss notification"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Donor 1-Click Accept Request Button inside Notification */}
                  {!isOrg && isRequest && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex gap-2" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleAcceptRequest(note)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                      >
                        <Check className="w-4 h-4" />
                        <span>Accept Request</span>
                      </button>
                    </div>
                  )}

                  <span className="text-[10px] text-slate-400 block">
                    {note.time || (note.createdAt ? new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently')}
                  </span>
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
