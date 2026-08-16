import React, { useState, useEffect } from 'react';
import { getStoredDonations, confirmDonationMatch, subscribeToDonationUpdates } from '../services/donationService';
import { MapPin, CheckCircle2, Package, ArrowRight, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AvailableDonationsForNGO = () => {
  const [donations, setDonations] = useState([]);
  const navigate = useNavigate();

  const syncData = () => {
    const all = getStoredDonations();
    setDonations(all.filter(d => d.status === 'AVAILABLE'));
  };

  useEffect(() => {
    syncData();
    return subscribeToDonationUpdates(syncData);
  }, []);

  const handleAcceptDonation = (donation) => {
    confirmDonationMatch(donation.id, 'ngo-101', 'Helping Hands Foundation');
    navigate(`/track/${donation.id}`);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="inline-flex items-center space-x-2 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Receiver NGO Match Portal</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          AVAILABLE DONATIONS NEAR YOU
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl mt-1">
          Review nearby donor surplus listings matched to your organization's area and category requirements.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {donations.map((d) => (
          <div
            key={d.id}
            className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">{d.id}</span>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">{d.title || d.itemName}</h3>
                </div>
                <span className="text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-1 rounded-full">
                  ✓ {d.condition || 'Fresh'}
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-700">
                <div className="flex justify-between font-bold text-slate-900 dark:text-white text-sm">
                  <span>Quantity: {d.quantity} {d.unit}</span>
                  <span className="text-emerald-600">{d.category}</span>
                </div>
                <div className="flex items-center text-slate-500">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-600" /> {d.pickupLocation || 'Deccan Gymkhana, Pune'} (2.8 km away)
                </div>
                <div className="flex items-center text-slate-500">
                  <Package className="w-3.5 h-3.5 mr-1 text-teal-600" /> Available Today • Donor: {d.donorName || 'Anonymous Donor'}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleAcceptDonation(d)}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-md shadow-emerald-600/20 transition-all text-xs flex items-center justify-center space-x-2"
            >
              <span>ACCEPT DONATION</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}

        {donations.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400 text-sm font-medium">
            No active unassigned donations available right now. Check back soon!
          </div>
        )}
      </div>

    </div>
  );
};

export default AvailableDonationsForNGO;
