import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  getStoredDonations,
  updateDonationStatus,
  subscribeToDonationUpdates,
  markFoodPickedUp,
  markFoodDelivered
} from '../services/donationService';
import TrackingMapView from './TrackingMapView';
import DonationCertificateModal from './DonationCertificateModal';
import {
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  Award,
  ArrowLeft,
  MapPin,
  Building2,
  Package,
  Key,
  Check
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DonationTrackingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCertificate, setShowCertificate] = useState(false);

  const token = localStorage.getItem('token');

  const fetchDonation = useCallback(async () => {
    // 1. Try fetching from Backend API if id exists
    if (id && token) {
      try {
        const res = await axios.get(`${API_URL}/api/food/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const food = res.data;
        if (food) {
          const acceptedClaim = food.acceptedClaim || food.claims?.find(c => c.status === 'ACCEPTED');
          const claimingNgo = acceptedClaim?.ngoId || food.claimantId;
          const donorObj = food.donorId;

          // Coordinates conversion with geocoding fallback
          let donorLat = food.location?.coordinates?.[1];
          let donorLng = food.location?.coordinates?.[0];

          // If coordinates are the old mock Bengaluru coordinates [77.5946, 12.9716] or missing, geocode from pickupAddress
          const isMockBengaluru = Math.abs(donorLat - 12.9716) < 0.1 && Math.abs(donorLng - 77.5946) < 0.1;
          if (!donorLat || !donorLng || isMockBengaluru) {
            try {
              const { geocodeAddress } = await import('../services/mapsService');
              const resolved = await geocodeAddress(food.pickupAddress || donorObj?.address || 'Kothrud, Pune');
              donorLat = resolved.lat;
              donorLng = resolved.lng;
            } catch (e) {
              donorLat = 18.5074; // Kothrud, Pune
              donorLng = 73.8077;
            }
          }

          const donorCoords = { lat: Number(donorLat) || 18.5074, lng: Number(donorLng) || 73.8077 };

          let ngoLng = claimingNgo?.location?.coordinates?.[0];
          let ngoLat = claimingNgo?.location?.coordinates?.[1];
          if (!ngoLat || !ngoLng || (Math.abs(ngoLat - 12.9716) < 0.1 && Math.abs(ngoLng - 77.5946) < 0.1)) {
            try {
              const { geocodeAddress } = await import('../services/mapsService');
              const resolvedNgo = await geocodeAddress(claimingNgo?.address ? `${claimingNgo.address}, ${claimingNgo.city || 'Pune'}` : 'Shivajinagar, Pune');
              ngoLat = resolvedNgo.lat;
              ngoLng = resolvedNgo.lng;
            } catch (e) {
              ngoLat = 18.5308;
              ngoLng = 73.8474;
            }
          }
          const ngoCoords = { lat: Number(ngoLat) || 18.5308, lng: Number(ngoLng) || 73.8474 };

          const mappedDonation = {
            id: food._id,
            title: food.title,
            itemName: food.items?.[0]?.itemName || food.foodType || food.title,
            excessDetails: food.items?.map(i => `${i.itemName} (${i.quantity} ${i.unit})`).join(', ') || `${food.quantity} Servings`,
            quantity: food.quantity || (food.items?.[0]?.quantity) || 1,
            unit: food.items?.[0]?.unit || 'Portions',
            status: food.status === 'COMPLETED' ? 'DELIVERED' : (food.status === 'ACCEPTED' ? 'ACCEPTED' : food.status),
            donorName: donorObj?.orgName || donorObj?.fullName || 'Food Donor',
            donorAddress: donorObj?.address || 'Donor Address, Pune',
            pickupLocation: food.pickupAddress || donorObj?.address || 'Pickup Point, Pune',
            pickupCoords: donorCoords,
            ngoCoords: ngoCoords,
            matchedNgoName: claimingNgo?.orgName || claimingNgo?.fullName || 'Verified NGO Partner',
            matchedNgoAddress: claimingNgo?.address ? [claimingNgo.address, claimingNgo.city].filter(Boolean).join(', ') : 'Registered NGO Distribution Center, Pune',
            matchedNgoPhone: claimingNgo?.phone || '',
            verificationCode: food.verificationCode,
            createdAt: food.createdAt
          };

          setDonation(mappedDonation);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Backend food fetch failed or not found by ID, checking local store:', err.message);
      }
    }

    // 2. Fallback to local stored donations
    const all = getStoredDonations();
    const target = all.find(d => d.id === id) || all[0];
    setDonation(target);
    setLoading(false);
  }, [id, token]);

  useEffect(() => {
    fetchDonation();
    const unsubscribe = subscribeToDonationUpdates(fetchDonation);
    return () => unsubscribe();
  }, [fetchDonation]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-3" />
        <p className="font-semibold text-xs">Loading delivery tracking data...</p>
      </div>
    );
  }

  if (!donation) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
        <Package className="w-10 h-10 text-slate-400 mx-auto" />
        <p className="font-bold text-sm text-slate-700 dark:text-slate-200">No active dispatch found</p>
        <Link to="/" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const handleAdvanceStatus = (nextStatus) => {
    let updated;
    if (nextStatus === 'FOOD_PICKED_UP' || nextStatus === 'IN_TRANSIT') {
      updated = markFoodPickedUp(donation.id);
    } else if (nextStatus === 'DELIVERED' || nextStatus === 'COMPLETED') {
      updated = markFoodDelivered(donation.id);
      setShowCertificate(true);
    } else {
      updated = updateDonationStatus(donation.id, nextStatus);
    }
    if (updated) {
      setDonation(updated);
    } else {
      setDonation(prev => ({ ...prev, status: nextStatus }));
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-200">
      
      {/* Top Navigation Bar */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <Link to="/" className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors bg-white dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" /> Back to Dashboard
        </Link>

        {(donation.status === 'COMPLETED' || donation.status === 'DELIVERED') && (
          <button
            onClick={() => setShowCertificate(true)}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Award className="w-3.5 h-3.5" />
            <span>View Handover Certificate</span>
          </button>
        )}
      </div>

      {/* TITLE & PROGRESS CONTROLS */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg">
              {donation.id?.slice(-8) || donation.id}
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {donation.status === 'DELIVERED' || donation.status === 'COMPLETED' ? 'DELIVERED ✓' : donation.status === 'IN_TRANSIT' || donation.status === 'FOOD_PICKED_UP' ? 'IN TRANSIT' : 'ACCEPTED'}
            </span>
            {donation.verificationCode && (
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                <Key className="w-3 h-3" /> Pickup Code: {donation.verificationCode}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
            {donation.title || donation.itemName}
          </h1>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Donor: <strong className="text-slate-800 dark:text-slate-200">{donation.donorName}</strong> • Quantity: <strong className="text-slate-800 dark:text-slate-200">{donation.quantity} {donation.unit}</strong> • Matched NGO: <strong className="text-emerald-700 dark:text-emerald-400">{donation.matchedNgoName || 'Helping Hands'}</strong>
          </p>
        </div>

        {/* Handover & Pickup Progression Controls */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs w-full lg:w-auto">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            Pickup & Handover Progress
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => handleAdvanceStatus('ACCEPTED')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                donation.status === 'ACCEPTED'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100'
              }`}
            >
              1. Claim Accepted
            </button>
            <button
              onClick={() => handleAdvanceStatus('IN_TRANSIT')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                donation.status === 'IN_TRANSIT' || donation.status === 'FOOD_PICKED_UP'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
              }`}
            >
              2. Out for Pickup
            </button>
            <button
              onClick={() => handleAdvanceStatus('DELIVERED')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                donation.status === 'DELIVERED' || donation.status === 'COMPLETED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
              }`}
            >
              3. Delivered / Received ✓
            </button>
          </div>
        </div>
      </div>

      {/* MAP & LOGISTICS INFORMATION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* MAP VIEW */}
        <div className="lg:col-span-8 min-h-[450px] lg:min-h-[500px]">
          <TrackingMapView donation={donation} />
        </div>

        {/* SIDE INFORMATION PANEL */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-4 text-xs">
          
          <div className="space-y-3.5">
            <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                Pickup & Delivery Summary
              </h2>
            </div>

            {/* Donor */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 block uppercase tracking-wider">
                🟢 Donor Location (Pickup Point)
              </span>
              <p className="font-bold text-slate-900 dark:text-white">{donation.donorName}</p>
              <p className="text-slate-500 dark:text-slate-400">{donation.pickupLocation}</p>
            </div>

            {/* Food */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">
                Food Surplus & Quantity
              </span>
              <p className="font-bold text-slate-900 dark:text-white flex justify-between">
                <span>{donation.itemName || donation.foodType}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{donation.quantity} {donation.unit}</span>
              </p>
              {donation.excessDetails && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">"{donation.excessDetails}"</p>
              )}
            </div>

            {/* Receiver NGO */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-400 block uppercase tracking-wider">
                🟠 Receiver NGO (Delivery Hub)
              </span>
              <p className="font-bold text-slate-900 dark:text-white">
                {donation.matchedNgoName || 'Helping Hands Foundation'}
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                {donation.matchedNgoAddress || 'Shivajinagar Community Kitchen, Pune'}
              </p>
              {donation.matchedNgoPhone && (
                <p className="text-slate-400 text-[11px]">Phone: {donation.matchedNgoPhone}</p>
              )}
            </div>

          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-400 flex justify-between items-center">
            <span>Direct Pickup & Delivery</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Live Route Active
            </span>
          </div>

        </div>

      </div>

      {/* Certificate Modal */}
      {showCertificate && (
        <DonationCertificateModal
          donation={donation}
          onClose={() => setShowCertificate(false)}
        />
      )}

    </div>
  );
};

export default DonationTrackingPage;
