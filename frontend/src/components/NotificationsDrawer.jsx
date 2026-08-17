import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, X, Check, XCircle, MapPin } from 'lucide-react';

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
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [loadingClaim, setLoadingClaim] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineInput, setShowDeclineInput] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/notifications/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000); // Poll every 20s
    return () => clearInterval(interval);
  }, [user, token]);

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
      // Mark as read if it's just info
      if (!notif.read) {
        try {
          await axios.patch(`${API_URL}/api/notifications/${notif._id}/read`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          fetchNotifications();
        } catch(e) {}
      }
    }
  };

  const handleAccept = async () => {
    try {
      await axios.patch(`${API_URL}/api/claims/${selectedClaim._id}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedClaim(null);
      fetchNotifications();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to accept claim');
    }
  };

  const handleDecline = async () => {
    try {
      await axios.patch(`${API_URL}/api/claims/${selectedClaim._id}/decline`, { reason: declineReason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedClaim(null);
      fetchNotifications();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to decline claim');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
        <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center">
          <Bell className="w-5 h-5 mr-2 text-green-600" /> Notifications
        </h3>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-white"><X className="w-5 h-5" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 relative">
        {selectedClaim ? (
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 animate-in slide-in-from-right-4">
            <button onClick={() => setSelectedClaim(null)} className="text-sm text-blue-600 dark:text-blue-400 mb-4 flex items-center hover:underline">
               &larr; Back to notifications
            </button>
            <h4 className="font-bold text-lg mb-2 dark:text-white text-slate-800">Claim Request</h4>
            
            <div className="bg-white dark:bg-slate-800 p-3 rounded shadow-sm border border-slate-100 dark:border-slate-600 mb-4">
              <p className="font-semibold text-slate-800 dark:text-white">{selectedClaim.ngoId?.orgName || selectedClaim.ngoId?.fullName}</p>
              <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center mt-1">
                <MapPin className="w-3 h-3 mr-1" />
                {(() => {
                  const donorCoords = selectedClaim.foodId?.location?.coordinates;
                  const ngoCoords = selectedClaim.ngoId?.location?.coordinates;
                  const dist = getDistance(
                    donorCoords?.[1], donorCoords?.[0], 
                    ngoCoords?.[1], ngoCoords?.[0]
                  );
                  return dist !== null ? `${dist.toFixed(1)} km away` : 'Distance not available';
                })()}
              </div>
              {selectedClaim.message && (
                <p className="mt-2 text-sm italic text-slate-700 dark:text-slate-300">"{selectedClaim.message}"</p>
              )}
            </div>

            <div className="bg-white dark:bg-slate-800 p-3 rounded shadow-sm border border-slate-100 dark:border-slate-600 mb-4">
              <p className="text-xs font-bold uppercase text-slate-500 mb-1">Requested Item</p>
              <p className="font-semibold text-slate-800 dark:text-white">{selectedClaim.foodId?.title}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{selectedClaim.foodId?.quantity} servings</p>
            </div>

            {selectedClaim.status === 'PENDING' ? (
              <div className="flex flex-col gap-2">
                {!showDeclineInput ? (
                  <>
                    <button onClick={handleAccept} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold flex items-center justify-center">
                      <Check className="w-4 h-4 mr-2" /> Accept Claim
                    </button>
                    <button onClick={() => setShowDeclineInput(true)} className="w-full py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded font-bold flex items-center justify-center">
                      <XCircle className="w-4 h-4 mr-2" /> Decline
                    </button>
                  </>
                ) : (
                  <div className="space-y-2 animate-in fade-in">
                    <input 
                      type="text" 
                      placeholder="Reason for declining (optional)" 
                      value={declineReason}
                      onChange={e => setDeclineReason(e.target.value)}
                      className="w-full p-2 text-sm border rounded dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                    />
                    <div className="flex gap-2">
                      <button onClick={handleDecline} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-sm">
                        Confirm Decline
                      </button>
                      <button onClick={() => setShowDeclineInput(false)} className="flex-1 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded font-bold text-sm">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase text-sm">
                Claim {selectedClaim.status}
              </div>
            )}
          </div>
        ) : loading ? (
           <div className="text-center py-8 text-slate-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="text-sm text-slate-500 text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
            No new notifications.
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(note => (
              <div 
                key={note._id} 
                onClick={() => handleNotificationClick(note)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  !note.read 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50' 
                    : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
                } hover:border-blue-400 dark:hover:border-blue-500`}
              >
                <div className="flex justify-between items-start">
                  <p className={`text-sm ${!note.read ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                    {note.message}
                  </p>
                  {!note.read && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5 ml-2"></div>}
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {new Date(note.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsDrawer;
