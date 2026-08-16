import React, { useState, useEffect } from 'react';
import { Plus, Package, CheckCircle2, Clock, Truck, Users, ShieldCheck, MapPin, Sparkles, AlertCircle, ArrowRight, FileText } from 'lucide-react';
import { getStoredDonations, createDonation, confirmDonationMatch, subscribeToDonationUpdates } from '../services/donationService';
import { findSmartMatches } from '../services/matchingService';
import MatchConfirmationModal from './MatchConfirmationModal';
import SurplusCategorySelector from './SurplusCategorySelector';
import FoodDonationForm from './FoodDonationForm';
import GeneralDonationForm from './GeneralDonationForm';
import WhatCanYouDonate from './WhatCanYouDonate';
import { useNavigate } from 'react-router-dom';

const DonorDashboard = ({ user }) => {
  const [donations, setDonations] = useState([]);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [selectedSurplusCategory, setSelectedSurplusCategory] = useState('Food');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedDonationForMatch, setSelectedDonationForMatch] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const syncData = () => {
    setDonations(getStoredDonations());
  };

  useEffect(() => {
    syncData();
    return subscribeToDonationUpdates(syncData);
  }, []);

  const handleCreateDonationSubmit = (donationPayload) => {
    const newDonation = createDonation(donationPayload, user);
    setShowDonateModal(false);
    setSuccessMessage(`Donation ${newDonation.id} logged successfully! Recommended NGO matches updated.`);
    setTimeout(() => setSuccessMessage(''), 6000);
  };

  const handleConfirmMatchAction = () => {
    if (!selectedMatch || !selectedDonationForMatch) return;
    confirmDonationMatch(selectedDonationForMatch.id, selectedMatch.ngoId, selectedMatch.ngoName);
    const donationId = selectedDonationForMatch.id;
    setSelectedMatch(null);
    setSelectedDonationForMatch(null);
    navigate(`/track/${donationId}`);
  };

  // Metrics
  const totalDonations = donations.length;
  const activeDonations = donations.filter(d => d.status === 'AVAILABLE' || d.status === 'MATCHED' || d.status === 'PICKUP_SCHEDULED').length;
  const completedDonations = donations.filter(d => d.status === 'COMPLETED' || d.status === 'DELIVERED').length;
  const pendingDonations = donations.filter(d => d.status === 'AVAILABLE').length;
  const totalResourcesDonated = donations.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
  const peopleHelped = totalDonations * 45;

  // Active / Recent donation for smart matching display
  const latestActiveDonation = donations.find(d => d.status === 'AVAILABLE') || donations[0] || {
    id: 'DON-2026-00482',
    category: 'Food',
    itemName: 'Rice & Pulses',
    quantity: 50,
    unit: 'kg',
    urgency: 'HIGH'
  };

  const smartMatches = findSmartMatches(latestActiveDonation);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div>
          <div className="inline-flex items-center space-x-2 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <span>DONOR CONTROL DASHBOARD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Welcome Back, {user?.name || 'Donor'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Log surplus items, track active NGO matches, and view verified social impact.
          </p>
        </div>

        <button
          onClick={() => setShowDonateModal(true)}
          className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 text-sm"
        >
          <Plus className="w-5 h-5" />
          <span>DONATE RESOURCE</span>
        </button>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-500 text-emerald-900 dark:text-emerald-200 p-4 rounded-2xl flex items-center justify-between shadow-md animate-in fade-in duration-300">
          <div className="flex items-center space-x-3 text-sm font-bold">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* STATS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Donations</span>
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 block">{totalDonations}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Listings</span>
          <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">{activeDonations}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Completed</span>
          <span className="text-3xl font-extrabold text-teal-600 dark:text-teal-400 mt-1 block">{completedDonations}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pending</span>
          <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 block">{pendingDonations}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Resources</span>
          <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 block">{totalResourcesDonated} units</span>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">People Helped</span>
          <span className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-1 block">{peopleHelped}+</span>
        </div>
      </div>

      {/* SECTION 3: WHAT DO YOU HAVE IN SURPLUS? */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
        <SurplusCategorySelector
          selectedCategory={selectedSurplusCategory}
          onSelectCategory={(catId) => {
            setSelectedSurplusCategory(catId);
            setShowDonateModal(true);
          }}
        />
      </div>

      {/* RECOMMENDED NGOs FOR YOUR DONATION */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Smart Weighted Match Algorithm</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              RECOMMENDED NGOs FOR YOUR DONATION
            </h2>
          </div>
          <span className="text-xs bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            For: {latestActiveDonation.title || latestActiveDonation.id} ({latestActiveDonation.quantity} {latestActiveDonation.unit})
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {smartMatches.slice(0, 3).map((match) => (
            <div
              key={match.ngoId}
              className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                      {match.ngoName}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      {match.verified && (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                          <ShieldCheck className="w-3.5 h-3.5 mr-0.5" /> Verified NGO
                        </span>
                      )}
                      <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center font-medium">
                        <MapPin className="w-3.5 h-3.5 mr-0.5 text-emerald-600" /> {match.distanceKm} km away
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-extrabold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-lg">
                    {match.matchScore}% Match
                  </span>
                </div>

                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Needs: <strong>{match.matchedItem}</strong></span>
                    <span className="font-bold text-slate-900 dark:text-white">{match.requiredQuantity} {match.requiredUnit}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-slate-400">Priority</span>
                    <span className={`font-bold ${match.urgency === 'HIGH' ? 'text-red-600' : 'text-amber-600'}`}>
                      {match.urgency}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedMatch(match);
                  setSelectedDonationForMatch(latestActiveDonation);
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2 text-xs"
              >
                <span>MATCH & DONATE TO THIS NGO</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 6 & 7: WHAT CAN YOU DONATE? & GUIDELINES */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700">
        <WhatCanYouDonate />
      </div>

      {/* DONATION HISTORY LIST */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            My Posted Surplus Resource History
          </h2>
          <span className="text-xs text-slate-500 font-medium">Showing {donations.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Donation ID</th>
                <th className="py-3 px-4">Title / Item</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
              {donations.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="py-4 px-4 font-mono font-bold text-slate-900 dark:text-white">{d.id}</td>
                  <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-200">{d.title || d.itemName}</td>
                  <td className="py-4 px-4">
                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-md text-xs font-bold">
                      {d.category}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-200">{d.quantity} {d.unit}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      d.status === 'COMPLETED' || d.status === 'DELIVERED'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : d.status === 'IN_TRANSIT'
                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                    }`}>
                      {d.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => navigate(`/track/${d.id}`)}
                      className="text-emerald-600 hover:text-emerald-700 font-bold text-xs underline"
                    >
                      Track Listing →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE SURPLUS DONATION FORM MODAL */}
      {showDonateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="w-full max-w-2xl my-8">
            {selectedSurplusCategory === 'Food' ? (
              <FoodDonationForm
                onSubmit={handleCreateDonationSubmit}
                onCancel={() => setShowDonateModal(false)}
              />
            ) : (
              <GeneralDonationForm
                category={selectedSurplusCategory}
                onSubmit={handleCreateDonationSubmit}
                onCancel={() => setShowDonateModal(false)}
              />
            )}
          </div>
        </div>
      )}

      {/* Match Confirmation Modal */}
      {selectedMatch && selectedDonationForMatch && (
        <MatchConfirmationModal
          match={selectedMatch}
          donation={selectedDonationForMatch}
          onConfirm={handleConfirmMatchAction}
          onClose={() => { setSelectedMatch(null); setSelectedDonationForMatch(null); }}
        />
      )}

    </div>
  );
};

export default DonorDashboard;
