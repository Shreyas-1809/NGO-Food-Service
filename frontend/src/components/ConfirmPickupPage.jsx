import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  CheckCircle2, 
  AlertCircle, 
  Package, 
  UserCheck, 
  Clock, 
  Truck, 
  ArrowRight,
  ShieldCheck,
  Building
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ConfirmPickupPage() {
  const { taskId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [taskData, setTaskData] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [statusAlreadyMoved, setStatusAlreadyMoved] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Missing confirmation token in URL. Please use the complete link provided.');
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/api/confirm/pickup/${taskId}?token=${encodeURIComponent(token)}`);
        setTaskData(res.data);
        if (res.data.statusAlreadyMoved) {
          setStatusAlreadyMoved(true);
        }
      } catch (err) {
        console.error('Pickup link verification failed:', err);
        setError(
          err.response?.data?.message || 
          'This pickup confirmation link is no longer valid, has already been used, or has expired.'
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
      const res = await axios.post(`${API_BASE}/api/confirm/pickup/${taskId}`, { token });
      setSuccess(true);
      if (res.data?.food) {
        setTaskData((prev) => ({
          ...prev,
          status: 'picked_up',
          ...res.data.food
        }));
      }
    } catch (err) {
      console.error('Failed to confirm pickup:', err);
      setError(
        err.response?.data?.message || 
        'Unable to confirm pickup. This link may have already been used or expired.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-medium">Verifying pickup security link...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600/30 via-slate-900 to-slate-900 p-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <span className="text-xs uppercase tracking-widest font-semibold text-emerald-400">Donor Handover</span>
              <h1 className="text-xl font-bold text-white tracking-tight">Confirm Food Handover</h1>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Please confirm only after physically handing over the food parcel to the assigned volunteer.
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
                If the food was already collected, no further action is required.
              </p>
            </div>
          ) : success || statusAlreadyMoved ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Pickup Confirmed!</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Thank you for confirming. The status has been updated to <strong>Picked Up / In Transit</strong>. The receiving NGO has been notified.
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
                  <span className="text-slate-500">Volunteer:</span>
                  <span className="font-semibold text-emerald-300">{taskData?.volunteer?.name || 'Assigned Volunteer'}</span>
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

                {/* Volunteer Identification */}
                <div className="flex items-center gap-3 bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Collecting Volunteer</span>
                    <p className="text-sm font-bold text-emerald-300">
                      {taskData?.volunteer?.name || 'Assigned Volunteer'}
                    </p>
                    {taskData?.volunteer?.phone && (
                      <p className="text-xs text-slate-400">{taskData.volunteer.phone}</p>
                    )}
                  </div>
                </div>

                {/* Receiving NGO */}
                {taskData?.ngo?.name && (
                  <div className="flex items-center gap-3 text-xs text-slate-400 px-1">
                    <Building className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Delivering to: <strong className="text-white">{taskData.ngo.name}</strong></span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                className="w-full py-4 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-lg shadow-emerald-950/50 hover:shadow-emerald-900/60 transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Confirming Handover...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Confirm I Handed This to {taskData?.volunteer?.name ? taskData.volunteer.name.split(' ')[0] : 'Volunteer'}</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-slate-400 leading-tight">
                This signed link is valid for a single confirmation only. Once confirmed, the handover cannot be undone.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
