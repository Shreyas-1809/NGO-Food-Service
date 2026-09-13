import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import {
  MapPin,
  Clock,
  Package,
  Truck,
  Building2,
  Phone,
  CheckCircle2,
  Navigation,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  QrCode,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  AlertTriangle,
  Radio
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

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

  const fetchTask = async () => {
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
      // If already accepted, reflect that in UI immediately
      if (res.data.task?.volunteerStatus === 'accepted') {
        setActionDone('accepted');
      } else if (res.data.task?.volunteerStatus === 'declined') {
        setActionDone('declined');
      }
    } catch (err) {
      console.error('Failed to load volunteer task:', err);
      const msg = err.response?.data?.message || 'This volunteer task link is invalid or expired.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [taskId, token]);

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
        if (payload.volunteerStatus === 'accepted') setActionDone('accepted');
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
      setLocationError('Geolocation is not supported by this device.');
      return;
    }
    setLocationError(null);
    setLocationSharing(true);

    locationWatchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (socketRef.current?.connected) {
          socketRef.current.emit('VOLUNTEER_LOCATION', {
            taskId,
            lat: latitude,
            lng: longitude,
            volunteerName: data?.volunteer?.name || 'Volunteer',
            timestamp: Date.now()
          });
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setLocationError('Unable to get location. Please allow location access in your browser.');
        setLocationSharing(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const stopLocationSharing = () => {
    if (locationWatchRef.current != null) {
      navigator.geolocation.clearWatch(locationWatchRef.current);
      locationWatchRef.current = null;
    }
    setLocationSharing(false);
  };

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
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Loading Pickup Task...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-lg text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Link Invalid or Unavailable
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {error || 'Unable to load task details. Please check with your NGO coordinator for the latest link.'}
          </p>
          <Link
            to="/"
            className="inline-block px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
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

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-900 py-6 px-4 sm:px-6 flex flex-col items-center">
      <div className="w-full max-w-lg space-y-4">

        {/* Header Branding */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-sm shadow-xs">
              FB
            </div>
            <div>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white block leading-tight">
                FoodBridge
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wide uppercase">
                Volunteer Dispatch Task
              </span>
            </div>
          </div>

          <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
            isDelivered
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
              : isPickedUp
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
              : volunteerStatus === 'declined'
              ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-300 dark:border-red-800'
              : volunteerStatus === 'accepted'
              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300 dark:border-sky-800'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
          }`}>
            {isDelivered ? 'Delivered ✓' : isPickedUp ? 'In Transit 🚚' : volunteerStatus === 'declined' ? 'Declined ✗' : volunteerStatus === 'accepted' ? 'Accepted ✓' : 'Awaiting Response'}
          </span>
        </div>

        {/* Task Item Summary Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Food Allocation
              </span>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                {task.title}
              </h1>
            </div>
            <span className="text-sm font-extrabold px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
              {task.quantity} {task.unit}
            </span>
          </div>

          {task.requestedPickupTime && (
            <div className="flex items-center text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800 font-semibold">
              <Clock className="w-4 h-4 mr-2 text-amber-600 shrink-0" />
              <span>Requested Pickup: <strong>{new Date(task.requestedPickupTime).toLocaleString()}</strong></span>
            </div>
          )}

          {volunteer?.name && (
            <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-between">
              <span>Assigned Driver / Volunteer:</span>
              <strong className="text-slate-800 dark:text-slate-200">{volunteer.name} {volunteer.vehicleNumber ? `(${volunteer.vehicleNumber})` : ''}</strong>
            </div>
          )}
        </div>

        {/* ─── ACCEPT / DECLINE SECTION ─────────────────────────────────────── */}
        {!isPickedUp && !isDelivered && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                Your Response
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Can you do this pickup?
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Please respond so the NGO can coordinate the collection.
              </p>
            </div>

            {actionError && (
              <div className="flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{actionError}</span>
              </div>
            )}

            {actionDone === 'accepted' ? (
              <div className="p-4 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-sky-600 dark:text-sky-400 mx-auto" />
                <p className="text-sm font-bold text-sky-900 dark:text-sky-200">Task Accepted!</p>
                <p className="text-xs text-sky-700 dark:text-sky-300">
                  The NGO has been notified. Proceed to the donor pickup location below.
                </p>
                {/* Location sharing toggle */}
                <div className="pt-2 border-t border-sky-200 dark:border-sky-800">
                  {locationSharing ? (
                    <div className="flex items-center justify-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                      <Radio className="w-4 h-4 animate-pulse" />
                      <span>Live location sharing active</span>
                      <button
                        type="button"
                        onClick={stopLocationSharing}
                        className="ml-2 text-red-500 hover:text-red-700 underline font-bold"
                      >
                        Stop
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={startLocationSharing}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      <Navigation className="w-4 h-4" />
                      Share My Live Location
                    </button>
                  )}
                  {locationError && (
                    <p className="text-[11px] text-red-500 mt-1">{locationError}</p>
                  )}
                  {!locationSharing && !locationError && (
                    <p className="text-[11px] text-slate-400 mt-1">Helps the NGO track your progress in real time.</p>
                  )}
                </div>
              </div>
            ) : actionDone === 'declined' ? (
              <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl text-center space-y-2">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
                <p className="text-sm font-bold text-red-800 dark:text-red-200">Task Declined</p>
                <p className="text-xs text-red-600 dark:text-red-300">
                  The NGO has been notified and will arrange another volunteer. Thank you for letting them know.
                </p>
              </div>
            ) : showDeclineForm ? (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Reason for declining <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="e.g. Vehicle unavailable, schedule conflict, too far..."
                  rows={3}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-red-400 outline-none resize-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowDeclineForm(false); setActionError(null); }}
                    className="flex-1 py-2.5 px-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleDecline}
                    disabled={actionLoading}
                    className="flex-1 py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60"
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
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.97] disabled:opacity-60"
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
                  className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-300 text-slate-700 dark:text-slate-200 hover:text-red-700 dark:hover:text-red-300 font-bold text-sm rounded-2xl border border-slate-200 dark:border-slate-600 flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-60"
                >
                  <ThumbsDown className="w-5 h-5" /> Decline
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 1: DONOR PICKUP POINT */}
        <div className={`bg-white dark:bg-slate-800 rounded-3xl p-5 border shadow-xs space-y-3 transition-all ${
          isPickedUp ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/30' : 'border-slate-200 dark:border-slate-700'
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
              Donor Pickup Location
            </span>
            {isPickedUp && (
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Handover Confirmed
              </span>
            )}
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {donor.name}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 flex items-start">
              <MapPin className="w-4 h-4 text-slate-400 mr-1.5 shrink-0 mt-0.5" />
              <span>{donor.address}</span>
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <a
              href={donor.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Open in Google Maps</span>
            </a>
            {donor.phone && (
              <a
                href={`tel:${donor.phone.replace(/[^0-9+]/g, '')}`}
                className="py-2.5 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shrink-0"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call</span>
              </a>
            )}
          </div>

          {/* Show Donor QR code link so donor can scan to confirm right here */}
          {!isPickedUp && links?.confirmPickupUrl && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Ask donor to tap their link or scan your screen:
              </span>
              <button
                type="button"
                onClick={() => setShowQR(prev => prev === 'pickup' ? null : 'pickup')}
                className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{showQR === 'pickup' ? 'Hide QR' : 'Show Donor QR'}</span>
              </button>
            </div>
          )}

          {showQR === 'pickup' && links?.confirmPickupUrl && (
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-2">
              <div className="bg-white p-3 rounded-xl inline-block shadow-xs border">
                <QRCodeSVG value={links.confirmPickupUrl} size={150} level="M" />
              </div>
              <p className="text-[11px] text-slate-500">
                Donor scans this with their phone camera to confirm handover.
              </p>
            </div>
          )}
        </div>

        {/* STEP 2: NGO DROP-OFF POINT */}
        <div className={`bg-white dark:bg-slate-800 rounded-3xl p-5 border shadow-xs space-y-3 transition-all ${
          isDelivered ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/30' : 'border-slate-200 dark:border-slate-700'
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
              NGO Delivery Hub
            </span>
            {isDelivered && (
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-md flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Delivery Confirmed
              </span>
            )}
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {ngo.name}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 flex items-start">
              <Building2 className="w-4 h-4 text-slate-400 mr-1.5 shrink-0 mt-0.5" />
              <span>{ngo.address}</span>
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <a
              href={ngo.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Open in Google Maps</span>
            </a>
            {ngo.phone && (
              <a
                href={`tel:${ngo.phone.replace(/[^0-9+]/g, '')}`}
                className="py-2.5 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shrink-0"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call</span>
              </a>
            )}
          </div>

          {/* Show NGO QR code so NGO staff can scan to confirm receipt */}
          {isPickedUp && !isDelivered && links?.confirmDeliveryUrl && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Ask NGO staff to tap their link or scan your screen:
              </span>
              <button
                type="button"
                onClick={() => setShowQR(prev => prev === 'delivery' ? null : 'delivery')}
                className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{showQR === 'delivery' ? 'Hide QR' : 'Show NGO QR'}</span>
              </button>
            </div>
          )}

          {showQR === 'delivery' && links?.confirmDeliveryUrl && (
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-2">
              <div className="bg-white p-3 rounded-xl inline-block shadow-xs border">
                <QRCodeSVG value={links.confirmDeliveryUrl} size={150} level="M" />
              </div>
              <p className="text-[11px] text-slate-500">
                NGO staff scans this with their phone camera to confirm delivery.
              </p>
            </div>
          )}
        </div>

        {/* Live sync footnote */}
        <div className="text-center py-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Real-time status synced with FoodBridge
          </span>
        </div>

      </div>
    </div>
  );
};

export default VolunteerTaskPage;
