import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  UserCheck, 
  Plus, 
  Trash2, 
  Phone, 
  Truck, 
  User, 
  CheckCircle2, 
  Copy, 
  Check, 
  Share2, 
  QrCode, 
  ExternalLink,
  MessageCircle,
  Navigation
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Modal from './ui/Modal';
import { T, useTranslatedString } from '../context/LanguageContext';
import Button from './ui/Button';
import DirectContactButtons from './ui/DirectContactButtons';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const VolunteerAssignmentModal = ({ isOpen, onClose, foodId, initialVolunteers = [], token, onSuccess, initialStatus }) => {
  const [volunteers, setVolunteers] = useState([
    { name: '', phone: '', vehicleNumber: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [assignmentSuccess, setAssignmentSuccess] = useState(false);
  const [savedData, setSavedData] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [showDonorQr, setShowDonorQr] = useState(false);
  const [showDeliveryQr, setShowDeliveryQr] = useState(false);
  const [showTaskQr, setShowTaskQr] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setAssignmentSuccess(false);
      setSavedData(null);
      setCopiedKey(null);
      setShowDonorQr(false);
      setShowDeliveryQr(false);
      setShowTaskQr(false);

      if (Array.isArray(initialVolunteers) && initialVolunteers.length > 0) {
        setVolunteers(initialVolunteers.map(v => ({
          name: v.name || '',
          phone: v.phone || '',
          vehicleNumber: v.vehicleNumber || v.arrivalTime || ''
        })));
      } else {
        setVolunteers([{ name: '', phone: '', vehicleNumber: '' }]);
      }
    }
  }, [isOpen, initialVolunteers]);

  const handleChange = (index, field, value) => {
    const updated = [...volunteers];
    updated[index][field] = value;
    setVolunteers(updated);
  };

  const handleAddRow = () => {
    setVolunteers(prev => [...prev, { name: '', phone: '', vehicleNumber: '' }]);
  };

  const handleRemoveRow = (index) => {
    if (volunteers.length <= 1) return;
    setVolunteers(prev => prev.filter((_, i) => i !== index));
  };

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!foodId) {
      setError('Missing food ID for volunteer assignment.');
      return;
    }

    const authToken = token || localStorage.getItem('token');
    if (!authToken) {
      setError('Authentication token missing. Please sign in again.');
      return;
    }

    const validVolunteers = volunteers.filter(v => v.name.trim() || v.phone.trim() || v.vehicleNumber.trim());

    if (validVolunteers.length === 0) {
      setError('Please fill in details for at least one volunteer.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await axios.patch(
        `${API_URL}/api/food/${foodId}/assign-volunteer`,
        { volunteers: validVolunteers },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      const clientOrigin = window.location.origin;
      const updatedFood = res.data.food;
      const links = res.data.confirmationLinks || {
        confirmPickupUrl: `${clientOrigin}/confirm-pickup/${updatedFood?._id}?token=${updatedFood?.confirmationTokens?.pickupToken}`,
        confirmDeliveryUrl: `${clientOrigin}/confirm-delivery/${updatedFood?._id}?token=${updatedFood?.confirmationTokens?.deliveryToken}`,
        volunteerTaskUrl: `${clientOrigin}/pickup/${updatedFood?._id}?token=${updatedFood?.confirmationTokens?.volunteerToken}`
      };

      setSavedData({
        food: updatedFood,
        links,
        volunteer: validVolunteers[0]
      });
      setAssignmentSuccess(true);

      if (onSuccess) {
        onSuccess(updatedFood);
      }
    } catch (err) {
      console.error('Failed to assign volunteers:', err);
      let errMsg = 'Failed to save volunteer assignment.';
      if (!err.response) {
        errMsg = `Network error: Could not reach the server (${err.message}). Please check backend connection.`;
      } else if (err.response.status === 404) {
        errMsg = `Not Found (404): The volunteer assignment endpoint or listing was not found.`;
      } else if (err.response.status === 403) {
        errMsg = `Forbidden (403): You are not authorized to assign volunteers for this donation.`;
      } else if (err.response.data?.message) {
        errMsg = err.response.data.message;
      } else {
        errMsg = `Error (${err.response?.status || '500'}): ${err.message || 'Failed to save volunteer assignment.'}`;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={assignmentSuccess ? "Volunteer Assigned & Links Ready" : "Arrange Pickup Volunteers"}
      icon={assignmentSuccess ? CheckCircle2 : UserCheck}
      maxWidth={assignmentSuccess ? "max-w-xl" : "max-w-lg"}
    >
      {assignmentSuccess && savedData ? (
        <div className="space-y-5 py-1">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold">Volunteer assignment saved successfully!</p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300/80">
                Single-use signed confirmation links and the volunteer navigation link are generated below.
              </p>
            </div>
          </div>

          {/* 1. DONOR CONFIRM-PICKUP LINK */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Step 1: Donor Handover Verification
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Donor Confirm-Pickup Link
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Share this link with the donor. The donor will click this to confirm handing over the food to <strong>{savedData.volunteer?.name || 'the volunteer'}</strong>.
                </p>
              </div>
            </div>

            {/* Link & Copy Box */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 break-all select-all">
              <span className="truncate flex-1 text-[11px]">{savedData.links.confirmPickupUrl}</span>
              <button
                type="button"
                onClick={() => handleCopy(savedData.links.confirmPickupUrl, 'donor-link')}
                className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-sans font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 shrink-0 transition-colors"
              >
                {copiedKey === 'donor-link' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>

            {/* Action Buttons: WhatsApp & QR */}
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Hello! Please use this link to confirm handing over the food donation to our volunteer (${savedData.volunteer?.name || 'Volunteer'}): ${savedData.links.confirmPickupUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[150px] py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Share via WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => setShowDonorQr(prev => !prev)}
                className="py-2 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{showDonorQr ? 'Hide QR' : 'Show Static QR'}</span>
              </button>
            </div>

            {/* Static QR Code Display */}
            {showDonorQr && (
              <div className="pt-2 flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95">
                <div className="p-3 bg-white rounded-lg shadow-sm border border-slate-200 inline-block">
                  <QRCodeSVG value={savedData.links.confirmPickupUrl} size={150} level="M" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 text-center">
                  Scannable by the donor with any phone's camera app (no scanner app needed)
                </p>
              </div>
            )}
          </div>

          {/* 2. VOLUNTEER TASK / DIRECTIONS LINK */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  Volunteer Mission Link
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Volunteer Mobile Task Page
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Send this mobile-first page to <strong>{savedData.volunteer?.name || 'the volunteer'}</strong> with Google Maps navigation and contact details.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 break-all select-all">
              <span className="truncate flex-1 text-[11px]">{savedData.links.volunteerTaskUrl}</span>
              <button
                type="button"
                onClick={() => handleCopy(savedData.links.volunteerTaskUrl, 'vol-link')}
                className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-sans font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 shrink-0 transition-colors"
              >
                {copiedKey === 'vol-link' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {savedData.volunteer?.phone ? (
                <a
                  href={`https://wa.me/${savedData.volunteer.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${savedData.volunteer.name || 'Volunteer'}, here is your food pickup task and directions: ${savedData.links.volunteerTaskUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[150px] py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send to Volunteer WhatsApp</span>
                </a>
              ) : (
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Hello, here is your food pickup task and directions: ${savedData.links.volunteerTaskUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[150px] py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Share via WhatsApp</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => setShowTaskQr(prev => !prev)}
                className="py-2 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <QrCode className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>{showTaskQr ? 'Hide QR' : 'Show Static QR'}</span>
              </button>
            </div>

            {showTaskQr && (
              <div className="pt-2 flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95">
                <div className="p-3 bg-white rounded-lg shadow-sm border border-slate-200 inline-block">
                  <QRCodeSVG value={savedData.links.volunteerTaskUrl} size={150} level="M" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 text-center">
                  Volunteer can scan this to open their task view
                </p>
              </div>
            )}
          </div>

          {/* 3. NGO CONFIRM-DELIVERY LINK (If already en_route or ready) */}
          {savedData.links.confirmDeliveryUrl && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Step 2: NGO Receiving Verification
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    NGO Confirm-Delivery Link
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    For the NGO receiving staff to confirm physical receipt once the volunteer arrives at drop-off.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 break-all select-all">
                <span className="truncate flex-1 text-[11px]">{savedData.links.confirmDeliveryUrl}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(savedData.links.confirmDeliveryUrl, 'delivery-link')}
                  className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-sans font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 shrink-0 transition-colors"
                >
                  {copiedKey === 'delivery-link' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Hello! Please use this link to confirm delivery receipt from volunteer (${savedData.volunteer?.name || 'Volunteer'}): ${savedData.links.confirmDeliveryUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[150px] py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Share via WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={() => setShowDeliveryQr(prev => !prev)}
                  className="py-2 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <QrCode className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>{showDeliveryQr ? 'Hide QR' : 'Show Static QR'}</span>
                </button>
              </div>

              {showDeliveryQr && (
                <div className="pt-2 flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95">
                  <div className="p-3 bg-white rounded-lg shadow-sm border border-slate-200 inline-block">
                    <QRCodeSVG value={savedData.links.confirmDeliveryUrl} size={150} level="M" />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 text-center">
                    Scannable by the receiving NGO staff with any camera app
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end">
            <Button
              type="button"
              variant="primary"
              className="w-full justify-center bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold"
              onClick={onClose}
            >
              Done / Close
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Assign one or more volunteers who will be responsible for picking up this surplus food.
          </p>

          {error && (
            <div className="p-3 text-xs bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            {volunteers.map((vol, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5 relative"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Volunteer #{idx + 1}
                  </span>
                  {volunteers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                      title="Remove Volunteer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Volunteer Name *
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={vol.name}
                      onChange={(e) => handleChange(idx, 'name', e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 border rounded-lg text-xs dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. +91 9823012345"
                        value={vol.phone}
                        onChange={(e) => handleChange(idx, 'phone', e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 border rounded-lg text-xs dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Vehicle Number / Info
                    </label>
                    <div className="relative">
                      <Truck className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. MH 12 AB 1234"
                        value={vol.vehicleNumber}
                        onChange={(e) => handleChange(idx, 'vehicleNumber', e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 border rounded-lg text-xs dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {vol.phone && vol.phone.trim().length >= 7 && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Direct Contact Actions:</span>
                    <DirectContactButtons
                      phone={vol.phone}
                      name={vol.name || `Volunteer #${idx + 1}`}
                      waMessage={`Hello ${vol.name || 'Volunteer'}, coordinating food pickup on FoodBridge.`}
                      size="xs"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddRow}
            className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 border border-dashed border-slate-300 dark:border-slate-600"
          >
            <Plus className="w-4 h-4" />
            <span>Add Another Volunteer</span>
          </button>

          <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            <Button
              type="button"
              variant="secondary"
              className="flex-1 justify-center"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1 justify-center bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Volunteer Assignment'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default VolunteerAssignmentModal;
