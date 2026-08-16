import React, { useState, useEffect } from 'react';
import { Plus, Package, CheckCircle2, Clock, Truck, Users, ShieldCheck, MapPin, Sparkles, AlertCircle, ArrowRight, FileText, Bike } from 'lucide-react';
import { getStoredDonations, createDonation, confirmDonationMatch, subscribeToDonationUpdates } from '../services/donationService';
import { findSmartMatches } from '../services/matchingService';
import MatchConfirmationModal from './MatchConfirmationModal';
import SurplusCategorySelector from './SurplusCategorySelector';
import FoodDonationForm from './FoodDonationForm';
import GeneralDonationForm from './GeneralDonationForm';
import WhatCanYouDonate from './WhatCanYouDonate';
import { useNavigate, useLocation } from 'react-router-dom';

const DonorDashboard = ({ user }) => {
  const [donations, setDonations] = useState([]);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [selectedSurplusCategory, setSelectedSurplusCategory] = useState('Food');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedDonationForMatch, setSelectedDonationForMatch] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const syncData = () => {
    setDonations(getStoredDonations());
  };

  useEffect(() => {
    syncData();
    if (location.state?.prefill) {
      setShowDonateModal(true);
    }
    return subscribeToDonationUpdates(syncData);
  }, [location.state]);

  const handleCreateDonationSubmit = (donationPayload) => {
    const newDonation = createDonation(donationPayload, user);
    setShowDonateModal(false);
    setSuccessMessage(`Donation listing "${newDonation.title}" created successfully! Recommended NGO matches updated.`);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleConfirmMatchAction = () => {
    if (!selectedMatch || !selectedDonationForMatch) return;
    confirmDonationMatch(selectedDonationForMatch.id, selectedMatch.ngoId, selectedMatch.ngoName);
    const donationId = selectedDonationForMatch.id;
    setSelectedMatch(null);
    setSelectedDonationForMatch(null);
    navigate(`/track/${donationId}`);
  };

  // Status Badge Helper
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
      case 'CREATED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">Available</span>;
      case 'MATCHED':
      case 'VOLUNTEER_ASSIGNED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200">Pickup Scheduled</span>;
      case 'FOOD_PICKED_UP':
      case 'IN_TRANSIT':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200">In Transit</span>;
      case 'DELIVERED':
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200">Delivered</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700">{status}</span>;
    }
  };

  // Metrics
  const totalDonations = donations.length;
  const activeDonations = donations.filter(d => ['AVAILABLE', 'CREATED', 'MATCHED', 'VOLUNTEER_ASSIGNED', 'IN_TRANSIT'].includes(d.status)).length;
  const completedDonations = donations.filter(d => ['COMPLETED', 'DELIVERED'].includes(d.status)).length;
  const totalResourcesDonated = donations.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);

  const latestActiveDonation = donations.find(d => d.status === 'AVAILABLE' || d.status === 'CREATED') || donations[0] || {
    id: 'DON-2026-00482',
    category: 'Food',
    itemName: 'Rice & Pulses',
    quantity: 50,
    unit: 'kg',
    urgency: 'HIGH'
  };

  const smartMatches = findSmartMatches(latestActiveDonation);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#161918] p-6 sm:p-8 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">
            Donor Control Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white">
            Welcome, {user?.name || 'Donor'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            Log surplus meals, track assigned volunteer riders, and view verified delivery receipts.
          </p>
        </div>

        <button
          onClick={() => setShowDonateModal(true)}
          className="w-full sm:w-auto px-5 py-3 bg-[#1B4332] hover:bg-[#143326] text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Log Surplus Food</span>
        </button>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 p-4 rounded-xl flex items-center space-x-3 text-xs font-semibold shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* STATS METRICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#161918] p-5 rounded-xl border border-stone-200 dark:border-stone-800">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">Total Donations</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white mt-1 block">{totalDonations}</span>
        </div>
        <div className="bg-white dark:bg-[#161918] p-5 rounded-xl border border-stone-200 dark:border-stone-800">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">Active Dispatches</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 block">{activeDonations}</span>
        </div>
        <div className="bg-white dark:bg-[#161918] p-5 rounded-xl border border-stone-200 dark:border-stone-800">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">Delivered to NGOs</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1 block">{completedDonations}</span>
        </div>
        <div className="bg-white dark:bg-[#161918] p-5 rounded-xl border border-stone-200 dark:border-stone-800">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">Total Food Donated</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white mt-1 block">{totalResourcesDonated} units</span>
        </div>
      </div>

      {/* RECOMMENDED NGOs FOR YOUR ACTIVE DONATION */}
      <div className="bg-white dark:bg-[#161918] rounded-2xl p-6 sm:p-7 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-4">
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Demand Matching</span>
            <h2 className="text-xl font-bold text-stone-900 dark:text-white mt-0.5">
              Recommended NGOs For Your Surplus
            </h2>
          </div>
          <span className="text-xs font-semibold text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-3 py-1 rounded-lg">
            Matching: {latestActiveDonation.title || latestActiveDonation.itemName} ({latestActiveDonation.quantity} {latestActiveDonation.unit})
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {smartMatches.slice(0, 3).map((match) => (
            <div
              key={match.ngoId}
              className="p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-[#FBFBFA] dark:bg-stone-900/40 flex flex-col justify-between space-y-4 hover:border-stone-300 transition-colors"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-stone-900 dark:text-white text-sm">
                      {match.ngoName}
                    </h3>
                    <p className="text-xs text-stone-500 flex items-center mt-0.5">
                      <MapPin className="w-3 h-3 mr-0.5 text-stone-400" /> {match.distanceKm} km away
                    </p>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded">
                    {match.matchScore}% Match
                  </span>
                </div>

                <div className="mt-3 p-3 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 text-xs space-y-1">
                  <div className="flex justify-between text-stone-600 dark:text-stone-300">
                    <span>Target Item:</span>
                    <strong className="text-stone-900 dark:text-white">{match.matchedItem}</strong>
                  </div>
                  <div className="flex justify-between text-stone-600 dark:text-stone-300">
                    <span>Needed Quantity:</span>
                    <strong className="text-stone-900 dark:text-white">{match.requiredQuantity} {match.requiredUnit}</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedMatch(match);
                  setSelectedDonationForMatch(latestActiveDonation);
                }}
                className="w-full py-2.5 bg-[#1B4332] hover:bg-[#143326] text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center space-x-1"
              >
                <span>Match & Donate to this NGO</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* DONATION HISTORY LIST */}
      <div className="bg-white dark:bg-[#161918] rounded-2xl p-6 sm:p-7 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-white">
              My Donation History
            </h2>
            <p className="text-xs text-stone-500">Track all active and past dispatches</p>
          </div>
          <span className="text-xs text-stone-400 font-medium">{donations.length} total listings</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">ID</th>
                <th className="py-3 px-3">Item / Surplus</th>
                <th className="py-3 px-3">Quantity</th>
                <th className="py-3 px-3">Pickup Location</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Tracking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60 font-medium">
              {donations.map((d) => (
                <tr key={d.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors">
                  <td className="py-3 px-3 font-mono font-semibold text-stone-600 dark:text-stone-400 text-xs">{d.id}</td>
                  <td className="py-3 px-3 font-bold text-stone-900 dark:text-white">{d.title || d.itemName}</td>
                  <td className="py-3 px-3 font-semibold text-emerald-800 dark:text-emerald-400">{d.quantity} {d.unit}</td>
                  <td className="py-3 px-3 text-stone-500 max-w-xs truncate">{d.pickupLocation}</td>
                  <td className="py-3 px-3">{renderStatusBadge(d.status)}</td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => navigate(`/track/${d.id}`)}
                      className="text-[#1B4332] dark:text-emerald-400 hover:underline font-bold text-xs"
                    >
                      Track Map →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE SURPLUS DONATION MODAL */}
      {showDonateModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-[70] flex items-center justify-center p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="w-full max-w-2xl my-8">
            <FoodDonationForm
              onSubmit={handleCreateDonationSubmit}
              onCancel={() => setShowDonateModal(false)}
            />
          </div>
        </div>
      )}

      {/* MATCH CONFIRMATION MODAL */}
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
