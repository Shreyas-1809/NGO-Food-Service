import React, { useState, useEffect } from 'react';
import { Package, ArrowRight, CheckCircle2, X, MapPin } from 'lucide-react';
import { getStoredDonations, confirmDonationMatch } from '../services/donationService';

const RedirectSurplusModal = ({ ngo, user, onClose }) => {
  const [myDonations, setMyDonations] = useState([]);
  const [selectedDonationId, setSelectedDonationId] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const orgName = user?.orgName || user?.name || user?.fullName || 'My Organisation';
  const targetNgoName = ngo?.name || ngo?.ngoName || 'Partner Organisation';
  const targetNgoId = ngo?.id || ngo?.ngoId || 'ngo-101';

  useEffect(() => {
    const all = getStoredDonations();
    // Filter to donations created by or associated with this organisation that are still AVAILABLE / CREATED
    const available = all.filter(d => d.status === 'CREATED' || d.status === 'AVAILABLE');
    setMyDonations(available);
    if (available.length > 0) {
      setSelectedDonationId(available[0].id);
    }
  }, [user]);

  const handleConfirmRedirect = () => {
    if (!selectedDonationId) return;

    confirmDonationMatch(selectedDonationId, targetNgoId, targetNgoName);
    setIsSuccess(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[120] flex justify-center items-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-violet-500/10 via-emerald-500/10 to-teal-500/10 dark:from-violet-500/20 dark:to-teal-500/20 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-violet-600 text-white rounded-2xl shadow-sm">
              <ArrowRight className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-violet-700 dark:text-violet-400 block">
                Inter-Organisation Surplus Matching
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Redirect Surplus to {targetNgoName}
              </h3>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {isSuccess ? (
            <div className="py-8 text-center space-y-3 animate-in zoom-in-95">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Surplus Redirected Successfully!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Your surplus allocation has been linked directly to {targetNgoName}.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Select an active surplus batch from your inventory to route directly to <strong>{targetNgoName}</strong>.
              </p>

              {/* Surplus Picker */}
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {myDonations.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-500">
                    <Package className="w-8 h-8 mx-auto text-slate-400 mb-1.5" />
                    <p className="text-xs font-bold">No active surplus inventory available</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Please log a surplus food batch first to redirect.</p>
                  </div>
                ) : (
                  myDonations.map(donation => {
                    const isSelected = selectedDonationId === donation.id;

                    return (
                      <div
                        key={donation.id}
                        onClick={() => setSelectedDonationId(donation.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                          isSelected
                            ? 'bg-violet-50/80 dark:bg-violet-950/40 border-violet-500 ring-1 ring-violet-500'
                            : 'bg-slate-50 dark:bg-slate-700/40 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                              {donation.title || `${donation.quantity} ${donation.unit} ${donation.foodType}`}
                            </span>
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                              {donation.quantity} {donation.unit}
                            </span>
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 flex items-center text-[11px]">
                            <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                            {donation.pickupLocation}
                          </p>
                        </div>

                        <div className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-2 border-violet-500">
                          {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-violet-600" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedDonationId || myDonations.length === 0}
                  onClick={handleConfirmRedirect}
                  className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Confirm Redirection</span>
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default RedirectSurplusModal;
