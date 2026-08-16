import React from 'react';
import { CheckCircle2, ShieldCheck, MapPin, Truck, AlertCircle, X } from 'lucide-react';

const MatchConfirmationModal = ({ match, donation, onConfirm, onClose }) => {
  if (!match || !donation) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white relative">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2 text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-200" /> Smart NGO Match Confirmation
          </div>
          <h3 className="text-xl font-extrabold text-white">
            Confirm Resource Allocation
          </h3>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Main Info Callout */}
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-start space-x-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                You are about to donate <span className="text-emerald-700 dark:text-emerald-400 font-bold">{donation.quantity} {donation.unit || 'kg'} of {donation.itemName || donation.title}</span> to:
              </p>
              <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
                {match.ngoName}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                {match.verified && (
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-800/50 px-2 py-0.5 rounded-full flex items-center">
                    ✓ Verified Organization
                  </span>
                )}
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
                  <MapPin className="w-3 h-3 mr-0.5" /> {match.distanceKm} km away
                </span>
              </div>
            </div>
          </div>

          {/* Details Breakdown */}
          <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 dark:bg-slate-700/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-xs block font-medium">Donor Pickup Location</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{donation.pickupLocation || 'Deccan Gymkhana, Pune'}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-xs block font-medium">Receiver Location</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{match.address || match.area || 'Shivajinagar, Pune'}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-xs block font-medium flex items-center"><Truck className="w-3.5 h-3.5 mr-1 text-slate-400"/> Distance & Route</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{match.distanceKm} km (~{Math.round(match.distanceKm * 3 + 5)} mins)</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-xs block font-medium flex items-center"><AlertCircle className="w-3.5 h-3.5 mr-1 text-slate-400"/> Urgency Level</span>
              <span className={`font-bold ${match.urgency === 'HIGH' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {match.urgency || 'MEDIUM'} PRIORITY
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            By confirming, a unique tracking code will be generated and pickup coordination will begin immediately.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm"
          >
            CANCEL
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-600/30 transition-all text-sm flex items-center justify-center space-x-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>CONFIRM DONATION</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default MatchConfirmationModal;
