import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { 
  CheckCircle2, 
  AlertCircle, 
  Package, 
  UserCheck, 
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
  const [code, setCode] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState(null);

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

  const handleConfirm = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!token || submitting) return;
    if (!code || code.trim().length !== 4) {
      setError('Please enter the 4-digit verification code provided by the volunteer.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await axios.post(`${API_BASE}/api/confirm/pickup/${taskId}`, {
        token,
        code: code.trim()
      });
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
      const msg = err.response?.data?.message || 'Unable to confirm pickup. Please verify the code.';
      if (err.response?.data?.remainingAttempts !== undefined) {
        setRemainingAttempts(err.response.data.remainingAttempts);
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#173B78] flex flex-col items-center justify-center p-4 text-white">
        <div className="w-12 h-12 border-4 border-[#173B78] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[#60708B] text-sm font-medium">Verifying pickup security link...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#173B78] text-[#18315E] flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-[#173B78] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#173B78]/30 via-[#0F172A] to-[#F97316] p-6 border-b border-[#1E293B]">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="p-2 rounded-xl bg-[#173B78]/20 text-[#E5B85C] border border-[#173B78]/30">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <span className="text-xs uppercase tracking-widest font-semibold text-[#E5B85C]">Donor Handover</span>
              <h1 className="text-xl font-bold text-white tracking-tight">Confirm Food Handover</h1>
            </div>
          </div>
          <p className="text-xs text-[#60708B] leading-relaxed">
            Please confirm only after physically handing over the food parcel to the assigned volunteer.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {error ? (
            <div className="p-4 rounded-xl bg-[#173B78]/10 border border-[#E5E1D8]/30 text-[#E5B85C] space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#E5B85C] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-[#18315E]">Link Invalid or Already Used</h3>
                  <p className="text-xs text-[#E5B85C]/80 mt-1 leading-relaxed">{error}</p>
                </div>
              </div>
              <p className="text-[11px] text-[#E5B85C]/80 pt-2 border-t border-[#E5E1D8]/20">
                If the food was already collected, no further action is required.
              </p>
            </div>
          ) : success || statusAlreadyMoved ? (
            <div className="p-6 rounded-2xl bg-[#173B78]/10 border border-[#173B78]/30 text-center space-y-4">
              <div className="w-16 h-16 bg-[#173B78]/20 text-[#E5B85C] rounded-full flex items-center justify-center mx-auto border border-[#173B78]/30">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Pickup Confirmed!</h3>
                <p className="text-xs text-[#60708B] mt-1">
                  Thank you for confirming. The status has been updated to <strong>Picked Up / In Transit</strong>. The receiving NGO has been notified.
                </p>
              </div>
              <div className="p-3 bg-[#173B78]/60 rounded-xl border border-[#1E293B] text-left text-xs space-y-1.5 text-[#60708B]">
                <div className="flex justify-between">
                  <span className="text-[#60708B]">Item:</span>
                  <span className="font-semibold text-white">{taskData?.itemTitle || taskData?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#60708B]">Quantity:</span>
                  <span className="font-semibold text-white">{taskData?.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#60708B]">Volunteer:</span>
                  <span className="font-semibold text-[#E5B85C]">{taskData?.volunteer?.name || 'Assigned Volunteer'}</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Task Details Card */}
              <div className="bg-[#173B78]/70 border border-[#1E293B]/80 rounded-xl p-4 space-y-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E5B85C]/10 border border-[#E5E1D8]/20 flex items-center justify-center text-[#E5B85C] shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-bold text-white truncate">
                      {taskData?.itemTitle || taskData?.title || 'Food Donation'}
                    </h2>
                    <p className="text-xs text-[#60708B]">
                      Quantity: <span className="text-[#E5B85C] font-medium">{taskData?.quantity || 'As specified'}</span>
                    </p>
                  </div>
                </div>

                <div className="h-px bg-[#173B78]" />

                {/* Volunteer Identification */}
                <div className="flex items-center gap-3 bg-[#173B78]/90 p-3 rounded-lg border border-[#1E293B]">
                  <div className="w-9 h-9 rounded-lg bg-[#173B78]/20 text-[#E5B85C] flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-[#60708B] tracking-wider">Collecting Volunteer</span>
                    <p className="text-sm font-bold text-[#E5B85C]">
                      {taskData?.volunteer?.name || 'Assigned Volunteer'}
                    </p>
                    {taskData?.volunteer?.phone && (
                      <p className="text-xs text-[#60708B]">{taskData.volunteer.phone}</p>
                    )}
                  </div>
                </div>

                {/* Receiving NGO */}
                {taskData?.ngo?.name && (
                  <div className="flex items-center gap-3 text-xs text-[#60708B] px-1">
                    <Building className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Delivering to: <strong className="text-white">{taskData.ngo.name}</strong></span>
                  </div>
                )}
              </div>

              {/* 4-Digit Handover Code Verification Form */}
              <form onSubmit={handleConfirm} className="space-y-4">
                <div className="bg-[#173B78]/80 border border-[#1E293B] rounded-2xl p-4 text-center space-y-2.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#E5B85C] block">
                    Volunteer Handover Verification Code
                  </span>
                  <p className="text-xs text-[#60708B]">
                    Ask the volunteer for their 4-digit handover code and enter it below:
                  </p>
                  <input
                    id="handover-code-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength="4"
                    autoFocus
                    placeholder="• • • •"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.replace(/\D/g, '').slice(0, 4));
                      setError(null);
                    }}
                    className="w-48 mx-auto px-4 py-2.5 bg-[#173B78] border-2 border-[#173B78]/50 focus:border-[#173B78] rounded-xl text-center font-mono text-2xl font-bold tracking-[0.3em] text-white outline-none shadow-inner transition-all placeholder:text-[#60708B]"
                  />
                  {remainingAttempts !== null && (
                    <p className="text-[11px] text-[#E5B85C] font-medium">
                      Attempts remaining: {remainingAttempts} / 5
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting || code.length !== 4}
                  className="w-full py-4 px-5 rounded-xl bg-[#173B78] hover:bg-[#173B78] dark:bg-[#3156B5] dark:hover:bg-[#3F66CC] text-white font-bold text-base shadow-lg shadow-[#173B78]$3 hover:shadow-[#173B78]/60 transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying Code & Handover...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Verify Code & Confirm Handover</span>
                    </>
                  )}
                </button>
              </form>

              <p className="text-[11px] text-center text-[#60708B] leading-tight">
                This verification updates the task status to in-transit and notifies the receiving NGO in real time.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}











