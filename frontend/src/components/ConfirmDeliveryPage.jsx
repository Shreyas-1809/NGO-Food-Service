import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { 
  CheckCircle2, 
  AlertCircle, 
  Package, 
  UserCheck, 
  Building2, 
  HeartHandshake,
  ShieldCheck,
  MapPin
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ConfirmDeliveryPage() {
  const { taskId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [taskData, setTaskData] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [alreadyDelivered, setAlreadyDelivered] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Missing confirmation token in URL. Please use the complete link provided.');
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/api/confirm/delivery/${taskId}?token=${encodeURIComponent(token)}`);
        setTaskData(res.data);
        if (res.data.statusAlreadyMoved) {
          setAlreadyDelivered(true);
        }
      } catch (err) {
        console.error('Delivery link verification failed:', err);
        setError(
          err.response?.data?.message || 
          'This delivery confirmation link is no longer valid, has already been used, or has expired.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [taskId, token]);

  const handleConfirm = async () => {
    if (!token || submitting) return;

    try {
      setSubmitting(true);
      setError(null);
      const res = await axios.post(`${API_BASE}/api/confirm/delivery/${taskId}`, { token });
      setSuccess(true);
      if (res.data?.food) {
        setTaskData((prev) => ({
          ...prev,
          status: 'delivered',
          ...res.data.food
        }));
      }
    } catch (err) {
      console.error('Failed to confirm delivery:', err);
      setError(
        err.response?.data?.message || 
        'Unable to confirm delivery. This link may have already been used or expired.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-medium">Verifying delivery security link...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600/30 via-slate-900 to-slate-900 p-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <span className="text-xs uppercase tracking-widest font-semibold text-sky-400">NGO Drop-Off</span>
              <h1 className="text-xl font-bold text-white tracking-tight">Confirm Food Received</h1>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Please confirm only after the volunteer has safely handed over the food parcel at your NGO location.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-rose-200">Link Invalid or Already Used</h3>
                  <p className="text-xs text-rose-300/80 mt-1 leading-relaxed">{error}</p>
                </div>
              </div>
              <p className="text-[11px] text-rose-400/80 pt-2 border-t border-rose-500/20">
                If the delivery was already confirmed, the record is safely archived in your NGO history.
              </p>
            </div>
          ) : success || alreadyDelivered ? (
            <div className="p-6 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-center space-y-4">
              <div className="w-16 h-16 bg-sky-500/20 text-sky-400 rounded-full flex items-center justify-center mx-auto border border-sky-500/30">
                <HeartHandshake className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Delivery Confirmed!</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Food receipt has been successfully verified and marked as <strong>Delivered / Completed</strong>. The donor and volunteer have been notified.
                </p>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-left text-xs space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Item:</span>
                  <span className="font-semibold text-white">{taskData?.itemTitle || taskData?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Quantity:</span>
                  <span className="font-semibold text-white">{taskData?.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivered by:</span>
                  <span className="font-semibold text-sky-300">{taskData?.volunteer?.name || 'Assigned Volunteer'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Original Donor:</span>
                  <span className="font-semibold text-slate-200">{taskData?.donor?.name || 'Donor'}</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Task Details Card */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-bold text-white truncate">
                      {taskData?.itemTitle || taskData?.title || 'Food Donation'}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Quantity: <span className="text-amber-300 font-medium">{taskData?.quantity || 'As specified'}</span>
                    </p>
                  </div>
                </div>

                <div className="h-px bg-slate-800" />

                {/* Delivering Volunteer */}
                <div className="flex items-center gap-3 bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                  <div className="w-9 h-9 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Delivering Volunteer</span>
                    <p className="text-sm font-bold text-sky-300">
                      {taskData?.volunteer?.name || 'Assigned Volunteer'}
                    </p>
                    {taskData?.volunteer?.phone && (
                      <p className="text-xs text-slate-400">{taskData.volunteer.phone}</p>
                    )}
                  </div>
                </div>

                {/* Donor Organization / Individual */}
                {taskData?.donor?.name && (
                  <div className="flex items-center gap-3 text-xs text-slate-400 px-1">
                    <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Donated by: <strong className="text-white">{taskData.donor.name}</strong></span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                className="w-full py-4 px-5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-base shadow-lg shadow-sky-950/50 hover:shadow-sky-900/60 transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Confirming Delivery...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Confirm I Received This from {taskData?.volunteer?.name ? taskData.volunteer.name.split(' ')[0] : 'Volunteer'}</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-slate-400 leading-tight">
                This signed link verifies genuine physical food delivery. Once confirmed, the donation will be marked completed.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
