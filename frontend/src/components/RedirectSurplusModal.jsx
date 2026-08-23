import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Package,
  ArrowRight,
  CheckCircle2,
  X,
  MapPin,
  Clock,
  Navigation,
  Building2,
  Utensils,
  Check
} from 'lucide-react';
import { getStoredDonations, confirmDonationMatch, addNotification } from '../services/donationService';
import { calculateDistanceKm } from '../services/mapsService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const RedirectSurplusModal = ({ ngo, user, userLocation, onClose }) => {
  const [myDonations, setMyDonations] = useState([]);
  const [selectedDonationId, setSelectedDonationId] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Identify names and locations
  const orgName = user?.orgName || user?.businessName || user?.fullName || user?.name || 'My Organisation';
  const orgAddress = user?.address || user?.city || 'Pune Hub';
  
  const targetNgoName = ngo?.name || ngo?.ngoName || 'Partner Organisation';
  const targetNgoId = ngo?.id || ngo?.ngoId || ngo?._id || 'ngo-101';
  const targetNgoAddress = ngo?.address || (ngo?.area && ngo?.city ? `${ngo.area}, ${ngo.city}` : ngo?.city || 'Pune Hub');

  // Coords & Distance calculation
  const donorCoords = userLocation || (user?.location?.coordinates
    ? { lat: user.location.coordinates[1], lng: user.location.coordinates[0] }
    : user?.location || { lat: 18.5204, lng: 73.8567 });

  const receiverCoords = ngo?.location?.lat !== undefined
    ? ngo.location
    : (ngo?.location?.coordinates
      ? { lat: ngo.location.coordinates[1], lng: ngo.location.coordinates[0] }
      : { lat: 18.5308, lng: 73.8474 });

  const distanceKm = ngo?.distanceKm || calculateDistanceKm(donorCoords, receiverCoords);
  const estTransitMins = Math.round(distanceKm * 3.5 + 5);

  useEffect(() => {
    const fetchSurplusBatches = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const batchesMap = new Map();

      // 1. Fetch from Local Storage / donationService (Dashboard & Log Surplus data)
      try {
        const storedDonations = getStoredDonations();
        const activeStored = storedDonations.filter(d =>
          d.status === 'CREATED' || d.status === 'AVAILABLE' || d.status === 'ACTIVE'
        );

        activeStored.forEach(d => {
          batchesMap.set(d.id, {
            id: d.id,
            title: d.title || d.itemName || 'Surplus Food Batch',
            itemName: d.itemName || d.foodType || 'Food Item',
            quantity: d.quantity || 10,
            unit: d.unit || 'servings',
            foodType: d.foodType || 'Cooked Food',
            category: d.category || 'Food',
            expiry: d.expiryTime || d.overallExpiry || d.expiryDate || d.availabilityDate || 'Today',
            pickupLocation: d.pickupLocation || orgAddress,
            source: 'local',
            raw: d
          });
        });
      } catch (err) {
        console.warn('Error reading local donations:', err);
      }

      // 2. Fetch from Backend API (if user has active backend listings)
      if (token) {
        try {
          // Attempt my-listings first
          const myRes = await axios.get(`${API_URL}/api/food/my-listings`, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => null);

          if (myRes && Array.isArray(myRes.data)) {
            myRes.data.filter(f => f.status === 'AVAILABLE').forEach(f => {
              batchesMap.set(f._id, {
                id: f._id,
                title: f.title || (f.items?.[0]?.itemName) || 'Surplus Food Batch',
                itemName: f.items?.[0]?.itemName || f.title || 'Food Item',
                quantity: f.quantity || (f.items?.reduce((s, i) => s + (Number(i.quantity) || 0), 0)) || 10,
                unit: f.items?.[0]?.unit || 'servings',
                foodType: f.foodType || 'VEG',
                category: f.items?.[0]?.category || 'Cooked Meal',
                expiry: f.overallExpiry || f.expiryTime || f.items?.[0]?.expiryTime || 'Today',
                pickupLocation: f.pickupAddress || orgAddress,
                source: 'backend',
                raw: f
              });
            });
          }

          // Also check all available foods in case listings are created under donor user ID
          if (user?.id || user?._id) {
            const currentUserId = String(user.id || user._id);
            const allRes = await axios.get(`${API_URL}/api/food`, {
              headers: { Authorization: `Bearer ${token}` }
            }).catch(() => null);

            if (allRes && Array.isArray(allRes.data)) {
              allRes.data
                .filter(f => f.status === 'AVAILABLE' && (
                  String(f.donorId?._id || f.donorId) === currentUserId ||
                  f.donorId?.orgName === orgName ||
                  f.donorId?.fullName === orgName
                ))
                .forEach(f => {
                  batchesMap.set(f._id, {
                    id: f._id,
                    title: f.title || (f.items?.[0]?.itemName) || 'Surplus Food Batch',
                    itemName: f.items?.[0]?.itemName || f.title || 'Food Item',
                    quantity: f.quantity || 10,
                    unit: f.items?.[0]?.unit || 'servings',
                    foodType: f.foodType || 'VEG',
                    category: f.items?.[0]?.category || 'Cooked Meal',
                    expiry: f.overallExpiry || f.expiryTime || 'Today',
                    pickupLocation: f.pickupAddress || orgAddress,
                    source: 'backend',
                    raw: f
                  });
                });
            }
          }
        } catch (err) {
          console.warn('Backend food query in Redirect modal:', err.message);
        }
      }

      const batchesList = Array.from(batchesMap.values());
      setMyDonations(batchesList);
      if (batchesList.length > 0) {
        setSelectedDonationId(batchesList[0].id);
      }
      setIsLoading(false);
    };

    fetchSurplusBatches();
  }, [user, orgName, orgAddress]);

  const handleConfirmRedirect = () => {
    if (!selectedDonationId) return;

    const selectedBatch = myDonations.find(d => d.id === selectedDonationId);
    
    // Apply redirection in donationService
    confirmDonationMatch(selectedDonationId, targetNgoId, targetNgoName);

    // Record notification
    addNotification({
      title: 'Surplus Redirected 🚀',
      message: `Allocated "${selectedBatch?.title || 'Surplus Batch'}" directly to ${targetNgoName} (${distanceKm} km away).`,
      type: 'SUCCESS'
    });

    setIsSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1800);
  };

  const formatExpiry = (expiryVal) => {
    if (!expiryVal) return 'Today';
    try {
      const date = new Date(expiryVal);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        });
      }
    } catch (e) {}
    return String(expiryVal).slice(0, 16);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[120] flex justify-center items-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="w-full max-w-xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]" onClick={e => e.stopPropagation()}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full bg-white/80 dark:bg-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-violet-600/10 via-emerald-600/10 to-teal-600/10 dark:from-violet-500/20 dark:to-teal-500/20 border-b border-slate-100 dark:border-slate-700">
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
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* TWO-POINT LOCATION & ROUTE SUMMARY CARD */}
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center">
                <Navigation className="w-3.5 h-3.5 mr-1 text-violet-600" /> Dispatch Route Summary
              </span>
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                ~{distanceKm} km • ~{estTransitMins} mins
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Origin / Donor Pin */}
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start space-x-2.5 shadow-2xs">
                <div className="p-2 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded-lg shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                    From (Your Hub)
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white text-xs truncate">
                    {orgName}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {orgAddress}
                  </p>
                </div>
              </div>

              {/* Destination / Receiver NGO Pin */}
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start space-x-2.5 shadow-2xs">
                <div className="p-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-lg shrink-0 mt-0.5">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                    To (Receiver NGO)
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white text-xs truncate">
                    {targetNgoName}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {targetNgoAddress}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {isSuccess ? (
            <div className="py-8 text-center space-y-3 animate-in zoom-in-95">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Surplus Batch Redirected Successfully!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Your surplus allocation has been linked directly to <strong>{targetNgoName}</strong>. The route is now open for volunteer dispatch and pickup coordination.
              </p>
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center">
                    <Package className="w-3.5 h-3.5 mr-1 text-violet-600" />
                    <span>Select Active Surplus Batch ({myDonations.length})</span>
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Live inventory from your dashboard
                  </span>
                </div>

                {/* Surplus Picker List */}
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {isLoading ? (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading your active surplus inventory...
                    </div>
                  ) : myDonations.length === 0 ? (
                    <div className="p-6 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-500">
                      <Package className="w-8 h-8 mx-auto text-slate-400 mb-1.5" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No active surplus inventory available</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs mx-auto">
                        Please log a surplus food batch from your Dashboard first to redirect it directly to {targetNgoName}.
                      </p>
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
                              ? 'bg-violet-50/90 dark:bg-violet-950/40 border-violet-500 ring-1 ring-violet-500 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-700/40 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <div className="space-y-1.5 flex-1 pr-3">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-900 dark:text-white text-sm">
                                {donation.title || donation.itemName}
                              </span>
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                                {donation.quantity} {donation.unit}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                                <span>Expires: <strong>{formatExpiry(donation.expiry)}</strong></span>
                              </span>

                              <span className="flex items-center">
                                <Utensils className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                                <span>{donation.foodType}</span>
                              </span>

                              {donation.pickupLocation && (
                                <span className="flex items-center truncate max-w-[200px]">
                                  <MapPin className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                                  <span className="truncate">{donation.pickupLocation}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Custom Radio Button */}
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'border-violet-600 bg-violet-600 text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
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
