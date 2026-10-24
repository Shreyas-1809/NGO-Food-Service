import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import {
  MapPin,
  Clock,
  Building2,
  Phone,
  CheckCircle2,
  Navigation,
  AlertCircle,
  ExternalLink,
  QrCode,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  AlertTriangle,
  Radio
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

import Logo from './Logo';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const VolunteerTaskPage = () => {
  const { taskId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showQR, setShowQR] = useState(false);

  // Accept / Decline state
  const [actionLoading, setActionLoading] = useState(false);
  const [actionDone, setActionDone] = useState(null); // 'accepted' | 'declined'
  const [actionError, setActionError] = useState(null);
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  // Location sharing state
  const [locationSharing, setLocationSharing] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const locationWatchRef = useRef(null);
  const socketRef = useRef(null);

const fetchTask = useCallback(async () => {
    if (!taskId) {
      setError('Missing task ID in URL.');
      setLoading(false);
      return;
    }
    if (!token) {
      setError('Missing volunteer access token in link.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_URL}/api/confirm/task/${taskId}?token=${token}`);
      setData(res.data);
      // If already accepted, en route, or picked up (in transit), reflect that in UI immediately
      const vStatus = res.data.task?.volunteerStatus;
      const tStatus = res.data.task?.status;
      if (['accepted', 'en_route', 'picked_up'].includes(vStatus) || tStatus === 'IN_TRANSIT') {
        setActionDone('accepted');
      } else if (vStatus === 'declined') {
        setActionDone('declined');
      }
    } catch (err) {
      console.error('Failed to load volunteer task:', err);
      const msg = err.response?.data?.message || 'This volunteer task link is invalid or expired.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [taskId, token]);

  useEffect(() => {
    fetchTask();
  }, [
	taskId,
	token,
	fetchTask
]);

  // Real-time live status sync via socket
  useEffect(() => {
    const socket = io(API_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('TASK_UPDATED', (payload) => {
      if (payload && (payload.taskId === taskId || payload.taskId === data?.task?.id)) {
        setData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            task: {
              ...prev.task,
              status: payload.status ?? prev.task.status,
              volunteerStatus: payload.volunteerStatus ?? prev.task.volunteerStatus,
              pickupConfirmed: payload.pickupConfirmed ?? prev.task.pickupConfirmed,
              deliveryConfirmed: payload.deliveryConfirmed ?? prev.task.deliveryConfirmed
            }
          };
        });
        if (['accepted', 'en_route', 'picked_up'].includes(payload.volunteerStatus) || payload.status === 'IN_TRANSIT') {
          setActionDone('accepted');
        }
        if (payload.volunteerStatus === 'declined') setActionDone('declined');
      }
    });

    socket.on('LISTING_UPDATED', (food) => {
      if (food && (food._id === taskId || food.id === taskId)) {
        setData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            task: {
              ...prev.task,
              status: food.status,
              volunteerStatus: food.volunteerStatus ?? prev.task.volunteerStatus,
              pickupConfirmed: ['IN_TRANSIT', 'COMPLETED'].includes(food.status),
              deliveryConfirmed: food.status === 'COMPLETED'
            }
          };
        });
        if (food.status === 'IN_TRANSIT' || ['accepted', 'en_route', 'picked_up'].includes(food.volunteerStatus)) {
          setActionDone('accepted');
        }
      }
    });

    return () => {
      socket.disconnect();
      stopLocationSharing();
    };
  }, [taskId, data?.task?.id]);

  // ─── Location sharing helpers ───────────────────────────────────────────────

  const startLocationSharing = () => {
    if (!navigator.geolocation) {
      setLocationError('Please allow location access');
      setLocationSharing(false);
      return;
    }
    if (locationWatchRef.current != null) return; // already sharing

    setLocationError(null);
    setLocationSharing(true);

    locationWatchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setLocationError(null);
        setLocationSharing(true);
        const { latitude, longitude, accuracy } = position.coords;
        if (socketRef.current?.connected) {
          socketRef.current.emit('VOLUNTEER_LOCATION', {
            taskId,
            token,
            lat: latitude,
            lng: longitude,
            accuracy,
            timestamp: position.timestamp || Date.now()
          });
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        // Denied or unavailable: send nothing and tell the volunteer.
        stopLocationSharing();
        setLocationError('Please allow location access');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const stopLocationSharing = () => {
    if (locationWatchRef.current != null) {
      navigator.geolocation.clearWatch(locationWatchRef.current);
      locationWatchRef.current = null;
    }
    setLocationSharing(false);
  };

  // Resume real-time sharing when the task is already accepted (e.g. page reload)
  useEffect(() => {
    if (actionDone === 'accepted' && !data?.task?.deliveryConfirmed && data?.task?.status !== 'COMPLETED') {
      startLocationSharing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionDone, data?.task?.status, data?.task?.deliveryConfirmed]);

  // ─── Accept / Decline handlers ──────────────────────────────────────────────

  const handleAccept = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await axios.post(`${API_URL}/api/confirm/volunteer-accept/${taskId}`, { token });
      setActionDone('accepted');
      // Start location sharing immediately on accept
      startLocationSharing();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to accept task. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!declineReason.trim()) {
      setActionError('Please provide a reason so the NGO can arrange another volunteer quickly.');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      await axios.post(`${API_URL}/api/confirm/volunteer-decline/${taskId}`, { token, reason: declineReason.trim() });
      setActionDone('declined');
    } catch (err) {
      // Show error but don't silently ignore
      setActionError(err.response?.data?.message || 'Failed to decline. Please try again or contact your NGO coordinator.');
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Loading / Error states ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#F3F0EA] dark:bg-[#0F1A33]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#173B78] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-[#60708B] uppercase tracking-wider">
            Loading Pickup Task...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#F3F0EA] dark:bg-[#0F1A33]">
        <div className="max-w-md w-full bg-white dark:bg-[#0F1A33] rounded-3xl p-6 sm:p-8 border border-[#E5E1D8] dark:border-[#1E2D52] shadow-lg text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F3F0EA] dark:bg-[#0F1A33]/60 text-[#18315E] dark:text-[#D9B65D] flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#18315E] dark:text-white">
            Link Invalid or Unavailable
          </h2>
          <p className="text-xs text-[#60708B] dark:text-slate-300 leading-relaxed">
            {error || 'Unable to load task details. Please check with your NGO coordinator for the latest link.'}
          </p>
          <Link
            to="/"
            className="inline-block px-4 py-2 bg-[#F3F0EA] dark:bg-[#0F1A33] text-[#18315E] dark:text-white font-bold text-xs rounded-xl hover:bg-[#F3F0EA] dark:hover:bg-[#15223F] transition-colors"
          >
            Go to FoodBridge
          </Link>
        </div>
      </div>
    );
  }

  const { task, donor, ngo, volunteer, links } = data;
  const isPickedUp = task.status === 'IN_TRANSIT' || task.status === 'COMPLETED' || task.pickupConfirmed;
  const isDelivered = task.status === 'COMPLETED' || task.deliveryConfirmed;
  const volunteerStatus = task.volunteerStatus || 'pending';

  const donorCoords = (donor?.location?.lat && donor?.location?.lng) ? donor.location : null;
  const ngoCoords = (ngo?.location?.lat && ngo?.location?.lng) ? ngo.location : null;

  const donorNavUrl = donor?.navUrl || (donorCoords ? `https://www.google.com/maps/dir/?api=1&destination=${donorCoords.lat},${donorCoords.lng}&travelmode=driving` : '');
  const donorPinUrl = donorCoords ? `https://www.google.com/maps/search/?api=1&query=${donorCoords.lat},${donorCoords.lng}` : (donor?.mapsUrl || '');

  const ngoNavUrl = ngo?.navUrl || (ngoCoords ? `https://www.google.com/maps/dir/?api=1&destination=${ngoCoords.lat},${ngoCoords.lng}&travelmode=driving` : '');
  const ngoPinUrl = ngoCoords ? `https://www.google.com/maps/search/?api=1&query=${ngoCoords.lat},${ngoCoords.lng}` : (ngo?.mapsUrl || '');

  return (
    <div className="min-h-screen w-full bg-[#F3F0EA] dark:bg-[#0F1A33] py-6 px-4 sm:px-6 flex flex-col items-center">
      <div className="w-full max-w-lg space-y-4">

        {/* Header Branding */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Logo size={32} />
            <div>
              <span className="text-sm font-extrabold text-[#18315E] dark:text-white block leading-tight">
                FoodBridge
              </span>
              <span className="text-[10px] font-bold text-[#18315E] dark:text-[#D9B65D] tracking-wide uppercase">
                Volunteer Dispatch Task
              </span>
            </div>
          </div>

          <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
            isDelivered
              ? 'bg-[#F3F0EA] text-[#18315E] dark:bg-[#0F1A33]/60 dark:text-[#D9B65D] border border-[#E5E1D8] dark:border-[#1E2D52]'
              : isPickedUp
              ? 'bg-[#F3F0EA] text-[#18315E] dark:bg-[#0F1A33]/60 dark:text-[#D9B65D] border border-[#E5E1D8] dark:border-[#D9B65D]'
              : volunteerStatus === 'declined'
              ? 'bg-[#F3F0EA] text-[#18315E] dark:bg-[#0F1A33]/60 dark:text-[#D9B65D] border border-[#E5E1D8] dark:border-[#1E2D52]'
              : ['accepted', 'en_route'].includes(volunteerStatus)
              ? 'bg-[#F3F0EA] text-sky-800 dark:bg-[#3156B5]/14 dark:text-[#3156B5] border border-sky-300 dark:border-[#3156B5]/40'
              : 'bg-[#F3F0EA] text-[#18315E] dark:bg-[#0F1A33]/60 dark:text-[#D9B65D] border border-[#E5E1D8] dark:border-[#1E2D52]'
          }`}>
            {isDelivered ? 'Delivered ?' : isPickedUp ? 'In Transit ??' : volunteerStatus === 'declined' ? 'Declined ✗' : ['accepted', 'en_route'].includes(volunteerStatus) ? 'En Route ??' : 'Awaiting Response'}
          </span>
        </div>

        {/* Task Item Summary Card */}
        <div className="bg-white dark:bg-[#0F1A33] rounded-3xl p-5 border border-[#E5E1D8] dark:border-[#1E2D52] shadow-xs space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-extrabold text-[#60708B] uppercase tracking-wider block">
                Food Allocation
              </span>
              <h1 className="text-xl font-extrabold text-[#18315E] dark:text-white mt-0.5">
                {task.title}
              </h1>
            </div>
            <span className="text-sm font-extrabold px-3 py-1.5 rounded-xl bg-[#F3F0EA] dark:bg-[#0F1A33]/50 text-[#18315E] dark:text-[#D9B65D] border border-[#E5E1D8] dark:border-[#1E2D52] shrink-0">
              {task.quantity} {task.unit}
            </span>
          </div>

          {task.requestedPickupTime && (
            <div className="flex items-center text-xs text-[#18315E] dark:text-[#D9B65D] bg-[#F3F0EA] dark:bg-[#0F1A33]/40 p-2.5 rounded-xl border border-[#E5E1D8] dark:border-[#D9B65D] font-semibold">
              <Clock className="w-4 h-4 mr-2 text-[#E5B85C] shrink-0" />
              <span>Requested Pickup: <strong>{new Date(task.requestedPickupTime).toLocaleString()}</strong></span>
            </div>
          )}

          {volunteer?.name && (
            <div className="text-xs text-[#60708B] dark:text-slate-300 pt-2 border-t border-[#E5E1D8] dark:border-[#1E2D52] flex justify-between">
              <span>Assigned Driver / Volunteer:</span>
              <strong className="text-[#18315E] dark:text-white">{volunteer.name} {volunteer.vehicleNumber ? `(${volunteer.vehicleNumber})` : ''}</strong>
            </div>
          )}
        </div>

        {/* ─── 4-DIGIT HANDOVER CODE FOR DONOR VERIFICATION ─── */}
        {!isDelivered && (data?.verificationCode || data?.task?.verificationCode) && (
          <div className="bg-gradient-to-br from-[#F3F0EA]/10 via-[#F3F0EA]/5 to-[#F97316]/10 dark:from-[#0F1A33] dark:to-[#F97316] border-2 border-[#173B78]/40 rounded-3xl p-5 shadow-xs text-center space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#18315E] dark:text-[#D9B65D] block">
              Handover Verification Code
            </span>
            <div className="text-3xl sm:text-4xl font-mono font-extrabold text-[#18315E] dark:text-[#D9B65D] tracking-[0.25em]">
              {data.verificationCode || data.task?.verificationCode}
            </div>
            <p className="text-xs text-[#60708B] dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
              Provide this 4-digit code to the donor upon pickup. The donor will enter it on their screen to verify you and confirm handover.
            </p>
          </div>
        )}

        {/* ─── LIVE LOCATION TRACKING BANNER (Always visible when task is accepted and in progress) ─── */}
        {actionDone === 'accepted' && !isDelivered && (
          <div className="w-full">
            {locationError ? (
              <div className="p-4 bg-[#F3F0EA] dark:bg-[#0F1A33]/50 border-2 border-[#1E293B] dark:border-[#1E2D52] rounded-3xl flex items-start gap-3.5 shadow-sm">
                <div className="w-9 h-9 rounded-2xl bg-[#F3F0EA] dark:bg-[#0F1A33]/60 text-[#18315E] dark:text-[#D9B65D] flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="text-sm font-extrabold text-[#18315E] dark:text-white">
                    Please allow location access
                  </h4>
                  <p className="text-xs text-[#18315E] dark:text-[#D9B65D] leading-relaxed">
                    Live GPS is required so the NGO and donor can track the dispatch in real time. No location updates will be sent until location permissions are granted.
                  </p>
                  <button
                    type="button"
                    onClick={startLocationSharing}
                    className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#173B78] hover:bg-[#173B78] dark:bg-[#3156B5] dark:hover:bg-[#3F66CC] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Retry Location Access</span>
                  </button>
                </div>
              </div>
            ) : locationSharing ? (
              <div className="p-3.5 bg-[#F3F0EA] dark:bg-[#0F1A33]/40 border border-[#E5E1D8] dark:border-[#1E2D52] rounded-2xl flex items-center justify-between text-xs text-[#18315E] dark:text-white shadow-xs">
                <div className="flex items-center gap-2.5 font-bold">
                  <Radio className="w-4 h-4 text-[#18315E] dark:text-[#D9B65D] animate-pulse shrink-0" />
                  <span>Live GPS Sharing Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#18315E] dark:text-[#D9B65D] font-mono">Real-time device tracking</span>
                  <button
                    type="button"
                    onClick={stopLocationSharing}
                    className="text-[11px] font-bold text-[#18315E] hover:text-[#18315E] underline cursor-pointer"
                  >
                    Pause
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-[#F3F0EA] dark:bg-[#0F1A33] border border-[#E5E1D8] dark:border-[#1E2D52] rounded-2xl flex items-center justify-between text-xs">
                <span className="text-[#60708B] dark:text-slate-300 font-medium">Location sharing is paused.</span>
                <button
                  type="button"
                  onClick={startLocationSharing}
                  className="px-3 py-1.5 bg-[#173B78] hover:bg-[#0F172A] dark:bg-[#3156B5] dark:hover:bg-[#3F66CC] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Share Location</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── ACCEPT / DECLINE SECTION ─────────────────────────────────────── */}
        {!isPickedUp && !isDelivered && (
          <div className="bg-white dark:bg-[#0F1A33] rounded-3xl p-5 border border-[#E5E1D8] dark:border-[#1E2D52] shadow-xs space-y-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#60708B] dark:text-slate-300 block mb-1">
                Your Response
              </span>
              <p className="text-sm font-bold text-[#18315E] dark:text-white">
                Can you do this pickup?
              </p>
              <p className="text-xs text-[#60708B] dark:text-slate-300 mt-1">
                Please respond so the NGO can coordinate the collection.
              </p>
            </div>

            {actionError && (
              <div className="flex items-start gap-2.5 p-3 bg-[#F3F0EA] dark:bg-[#0F1A33]/40 border border-[#E5E1D8] dark:border-[#1E2D52] rounded-xl text-[#18315E] dark:text-[#D9B65D] text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{actionError}</span>
              </div>
            )}

            {actionDone === 'accepted' ? (
              <div className="p-4 bg-sky-50 dark:bg-[#3156B5]/14 border border-sky-200 dark:border-[#3156B5]/40 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-sky-600 dark:text-[#3156B5] mx-auto" />
                <p className="text-sm font-bold text-sky-900 dark:text-[#ECE9E1]">Task Accepted!</p>
                <p className="text-xs text-sky-700 dark:text-[#3156B5]">
                  The NGO has been notified. Proceed to the donor pickup location below.
                </p>
              </div>
            ) : actionDone === 'declined' ? (
              <div className="p-4 bg-[#F3F0EA] dark:bg-[#0F1A33]/30 border border-[#E5E1D8] dark:border-[#1E2D52] rounded-2xl text-center space-y-2">
                <AlertCircle className="w-10 h-10 text-[#18315E] mx-auto" />
                <p className="text-sm font-bold text-[#18315E] dark:text-white">Task Declined</p>
                <p className="text-xs text-[#18315E] dark:text-[#D9B65D]">
                  The NGO has been notified and will arrange another volunteer. Thank you for letting them know.
                </p>
              </div>
            ) : showDeclineForm ? (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-[#18315E] dark:text-slate-300">
                  Reason for declining <span className="text-[#18315E]">*</span>
                </label>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="e.g. Vehicle unavailable, schedule conflict, too far..."
                  rows={3}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-[#E5E1D8] dark:border-[#1E2D52] bg-white dark:bg-[#0F1A33] text-[#18315E] dark:text-white focus:ring-2 focus:ring-[#173B78] outline-none resize-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowDeclineForm(false); setActionError(null); }}
                    className="flex-1 py-2.5 px-3 bg-[#F3F0EA] dark:bg-[#0F1A33] hover:bg-[#F3F0EA] dark:hover:bg-[#15223F] text-[#18315E] dark:text-white font-bold text-xs rounded-xl transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleDecline}
                    disabled={actionLoading}
                    className="flex-1 py-2.5 px-3 bg-[#173B78] hover:bg-[#173B78] dark:bg-[#3156B5] dark:hover:bg-[#3F66CC] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60"
                  >
                    {actionLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Declining...</>
                    ) : (
                      <><ThumbsDown className="w-4 h-4" /> Confirm Decline</>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={actionLoading}
                  className="flex-1 py-3 px-4 bg-[#173B78] hover:bg-[#0F172A] dark:bg-[#3156B5] dark:hover:bg-[#3F66CC] text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.97] disabled:opacity-60"
                >
                  {actionLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Accepting...</>
                  ) : (
                    <><ThumbsUp className="w-5 h-5" /> Accept Task</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowDeclineForm(true); setActionError(null); }}
                  disabled={actionLoading}
                  className="flex-1 py-3 px-4 bg-[#F3F0EA] dark:bg-[#0F1A33] hover:bg-[#F3F0EA] dark:hover:bg-[#15223F]/30 hover:border-[#E5E1D8] text-[#18315E] dark:text-white hover:text-[#18315E] dark:hover:text-[#D9B65D] font-bold text-sm rounded-2xl border border-[#E5E1D8] dark:border-[#1E2D52] flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-60"
                >
                  <ThumbsDown className="w-5 h-5" /> Decline
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── PROMINENT GOOGLE MAPS NAVIGATION BANNER ─── */}
        {!isDelivered && (
          <div className="w-full">
            {!isPickedUp && donorNavUrl ? (
              <a
                href={donorNavUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 bg-[#173B78] hover:bg-[#0F172A] dark:bg-[#3156B5] dark:hover:bg-[#3F66CC] text-white font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
              >
                <Navigation className="w-4 h-4" />
                <span>Navigate to Donor (Google Maps)</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            ) : isPickedUp && ngoNavUrl ? (
              <a
                href={ngoNavUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 bg-[#E5B85C] hover:bg-[#173B78] text-white font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
              >
                <Navigation className="w-4 h-4" />
                <span>Navigate to NGO (Google Maps)</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            ) : null}
          </div>
        )}

        {/* STEP 1: DONOR PICKUP POINT */}
        <div className={`bg-white dark:bg-[#0F1A33] rounded-3xl p-5 border shadow-xs space-y-3 transition-all ${
          isPickedUp ? 'border-[#E5E1D8] dark:border-[#1E2D52]/80 bg-[#F3F0EA]/30' : 'border-[#E5E1D8] dark:border-[#1E2D52]'
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#18315E] dark:text-[#D9B65D] flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#173B78] text-white flex items-center justify-center text-[10px] font-bold">1</span>
              Donor Pickup Location
            </span>
            {isPickedUp && (
              <span className="text-[10px] font-bold text-[#18315E] dark:text-[#D9B65D] bg-[#F3F0EA] dark:bg-[#0F1A33] px-2 py-0.5 rounded-md flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Handover Confirmed
              </span>
            )}
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-base text-[#18315E] dark:text-white">
              {donor.name}
            </h3>
            <p className="text-xs text-[#60708B] dark:text-slate-300 flex items-start">
              <MapPin className="w-4 h-4 text-[#60708B] mr-1.5 shrink-0 mt-0.5" />
              <span>{donor.address}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {donorNavUrl ? (
              <a
                href={donorNavUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[140px] py-2.5 px-3 bg-[#173B78] hover:bg-[#0F172A] dark:bg-[#3156B5] dark:hover:bg-[#3F66CC] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Navigate to donor</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            ) : null}
            {donorPinUrl ? (
              <a
                href={donorPinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 bg-[#F3F0EA] dark:bg-[#0F1A33] hover:bg-[#F3F0EA] dark:hover:bg-[#15223F] text-[#18315E] dark:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-[#60708B]" />
                <span>View Pin</span>
              </a>
            ) : null}
            {donor.phone && (
              <a
                href={`tel:${donor.phone.replace(/[^0-9+]/g, '')}`}
                className="py-2.5 px-4 bg-[#F3F0EA] dark:bg-[#0F1A33] hover:bg-[#F3F0EA] dark:hover:bg-[#15223F] text-[#18315E] dark:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shrink-0"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call</span>
              </a>
            )}
          </div>

          {/* Show Donor QR code link so donor can scan to confirm right here */}
          {!isPickedUp && links?.confirmPickupUrl && (
            <div className="pt-2 border-t border-[#E5E1D8] dark:border-[#1E2D52]/60 flex items-center justify-between">
              <span className="text-[11px] text-[#60708B] dark:text-slate-300">
                Ask donor to tap their link or scan your screen:
              </span>
              <button
                type="button"
                onClick={() => setShowQR(prev => prev === 'pickup' ? null : 'pickup')}
                className="text-xs font-bold text-[#18315E] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{showQR === 'pickup' ? 'Hide QR' : 'Show Donor QR'}</span>
              </button>
            </div>
          )}

          {showQR === 'pickup' && links?.confirmPickupUrl && (
            <div className="p-4 bg-[#F3F0EA] dark:bg-[#0F1A33] rounded-2xl border border-[#E5E1D8] dark:border-[#1E2D52] text-center space-y-2">
              <div className="bg-white p-3 rounded-xl inline-block shadow-xs border">
                <QRCodeSVG value={links.confirmPickupUrl} size={150} level="M" />
              </div>
              <p className="text-[11px] text-[#60708B]">
                Donor scans this with their phone camera to confirm handover.
              </p>
            </div>
          )}
        </div>

        {/* STEP 2: NGO DROP-OFF POINT */}
        <div className={`bg-white dark:bg-[#0F1A33] rounded-3xl p-5 border shadow-xs space-y-3 transition-all ${
          isDelivered ? 'border-[#E5E1D8] dark:border-[#1E2D52]/80 bg-[#F3F0EA]/30' : 'border-[#E5E1D8] dark:border-[#1E2D52]'
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#E5B85C] dark:text-[#D9B65D] flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#E5B85C] text-white flex items-center justify-center text-[10px] font-bold">2</span>
              NGO Delivery Hub
            </span>
            {isDelivered && (
              <span className="text-[10px] font-bold text-[#18315E] dark:text-[#D9B65D] bg-[#F3F0EA] dark:bg-[#0F1A33] px-2 py-0.5 rounded-md flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Delivery Confirmed
              </span>
            )}
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-base text-[#18315E] dark:text-white">
              {ngo.name}
            </h3>
            <p className="text-xs text-[#60708B] dark:text-slate-300 flex items-start">
              <Building2 className="w-4 h-4 text-[#60708B] mr-1.5 shrink-0 mt-0.5" />
              <span>{ngo.address}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {ngoNavUrl ? (
              <a
                href={ngoNavUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[140px] py-2.5 px-3 bg-[#E5B85C] hover:bg-[#173B78] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Navigate to NGO</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            ) : null}
            {ngoPinUrl ? (
              <a
                href={ngoPinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 bg-[#F3F0EA] dark:bg-[#0F1A33] hover:bg-[#F3F0EA] dark:hover:bg-[#15223F] text-[#18315E] dark:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-[#60708B]" />
                <span>View Pin</span>
              </a>
            ) : null}
            {ngo.phone && (
              <a
                href={`tel:${ngo.phone.replace(/[^0-9+]/g, '')}`}
                className="py-2.5 px-4 bg-[#F3F0EA] dark:bg-[#0F1A33] hover:bg-[#F3F0EA] dark:hover:bg-[#15223F] text-[#18315E] dark:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shrink-0"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call</span>
              </a>
            )}
          </div>

          {/* Show NGO QR code so NGO staff can scan to confirm receipt */}
          {isPickedUp && !isDelivered && links?.confirmDeliveryUrl && (
            <div className="pt-2 border-t border-[#E5E1D8] dark:border-[#1E2D52]/60 flex items-center justify-between">
              <span className="text-[11px] text-[#60708B] dark:text-slate-300">
                Ask NGO staff to tap their link or scan your screen:
              </span>
              <button
                type="button"
                onClick={() => setShowQR(prev => prev === 'delivery' ? null : 'delivery')}
                className="text-xs font-bold text-[#E5B85C] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{showQR === 'delivery' ? 'Hide QR' : 'Show NGO QR'}</span>
              </button>
            </div>
          )}

          {showQR === 'delivery' && links?.confirmDeliveryUrl && (
            <div className="p-4 bg-[#F3F0EA] dark:bg-[#0F1A33] rounded-2xl border border-[#E5E1D8] dark:border-[#1E2D52] text-center space-y-2">
              <div className="bg-white p-3 rounded-xl inline-block shadow-xs border">
                <QRCodeSVG value={links.confirmDeliveryUrl} size={150} level="M" />
              </div>
              <p className="text-[11px] text-[#60708B]">
                NGO staff scans this with their phone camera to confirm delivery.
              </p>
            </div>
          )}
        </div>

        {/* Live sync footnote */}
        <div className="text-center py-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-[#60708B]">
            <span className="w-2 h-2 rounded-full bg-[#173B78] animate-pulse"></span>
            Real-time status synced with FoodBridge
          </span>
        </div>

      </div>
    </div>
  );
};

export default VolunteerTaskPage;











