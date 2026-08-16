import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getStoredDonations,
  updateDonationStatus,
  subscribeToDonationUpdates,
  assignVolunteerToDonation,
  markFoodPickedUp,
  markFoodDelivered,
  updateVolunteerLocation
} from '../services/donationService';
import { getCurrentUserLocation } from '../services/mapsService';
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
  Bike,
  Building2,
  Package,
  Navigation,
  Phone
} from 'lucide-react';

const DonationTrackingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const fetchDonation = () => {
    const all = getStoredDonations();
    const target = all.find(d => d.id === id) || all[0];
    setDonation(target);
  };

  useEffect(() => {
    fetchDonation();
    return subscribeToDonationUpdates(fetchDonation);
  }, [id]);

  if (!donation) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center text-stone-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B4332] mb-3" />
        <p className="font-semibold text-xs">Loading logistics tracking data...</p>
      </div>
    );
  }

  const handleAdvanceStatus = (nextStatus) => {
    let updated;
    if (nextStatus === 'VOLUNTEER_ASSIGNED') {
      updated = assignVolunteerToDonation(donation.id, {
        name: 'Rahul Verma (Volunteer Rider)',
        phone: '+91 98233 44112',
        coords: { lat: 18.5240, lng: 73.8445 }
      });
    } else if (nextStatus === 'FOOD_PICKED_UP' || nextStatus === 'IN_TRANSIT') {
      updated = markFoodPickedUp(donation.id);
    } else if (nextStatus === 'DELIVERED' || nextStatus === 'COMPLETED') {
      updated = markFoodDelivered(donation.id);
      setShowCertificate(true);
    } else {
      updated = updateDonationStatus(donation.id, nextStatus);
    }
    setDonation(updated);
  };

  const handleShareVolunteerGps = async () => {
    try {
      setGpsLoading(true);
      const coords = await getCurrentUserLocation();
      const updated = updateVolunteerLocation(donation.id, coords);
      setDonation(updated);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 4000);
    } catch (err) {
      alert(err.message || 'Unable to fetch GPS coordinates.');
    } finally {
      setGpsLoading(false);
    }
  };

  const steps = [
    { key: 'CREATED', title: 'Donation Created', desc: 'Donor published surplus food listing' },
    { key: 'VOLUNTEER_ASSIGNED', title: 'Volunteer Assigned', desc: 'Rider en route to donor pickup point' },
    { key: 'FOOD_PICKED_UP', title: 'Food Picked Up', desc: 'Food safely collected by volunteer' },
    { key: 'IN_TRANSIT', title: 'Out for Delivery', desc: 'In transit to receiver NGO hub' },
    { key: 'DELIVERED', title: 'Delivered to NGO', desc: 'Accepted by community center' }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Top Bar */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <Link to="/dashboard" className="inline-flex items-center text-xs font-semibold text-stone-500 hover:text-stone-900 dark:hover:text-white">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Dashboard
        </Link>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleShareVolunteerGps}
            disabled={gpsLoading}
            className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-200 font-semibold rounded-lg text-xs flex items-center space-x-1.5 transition-colors"
          >
            <Navigation className={`w-3 h-3 ${gpsLoading ? 'animate-spin' : ''}`} />
            <span>{gpsLoading ? 'Locating...' : 'Share Device GPS'}</span>
          </button>

          {(donation.status === 'COMPLETED' || donation.status === 'DELIVERED') && (
            <button
              onClick={() => setShowCertificate(true)}
              className="px-3.5 py-1.5 bg-[#1B4332] hover:bg-[#143326] text-white font-bold rounded-lg text-xs flex items-center space-x-1.5 transition-colors"
            >
              <Award className="w-3.5 h-3.5" />
              <span>View Certificate</span>
            </button>
          )}
        </div>
      </div>

      {shareSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 p-3 rounded-xl flex items-center space-x-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>Live volunteer GPS coordinates synchronized with map.</span>
        </div>
      )}

      {/* TITLE & PROGRESS CONTROLS */}
      <div className="bg-white dark:bg-[#161918] rounded-2xl p-6 sm:p-7 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-2 py-0.5 rounded">
              {donation.id}
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              {donation.status.replace('_', ' ')}
            </span>
          </div>

          <h1 className="text-2xl font-extrabold text-stone-900 dark:text-white mt-1">
            {donation.title || donation.itemName}
          </h1>

          <p className="text-xs text-stone-500 mt-0.5">
            Donor: <strong className="text-stone-800 dark:text-stone-200">{donation.donorName}</strong> • Quantity: <strong className="text-stone-800 dark:text-stone-200">{donation.quantity} {donation.unit}</strong> • Receiver: <strong className="text-emerald-800 dark:text-emerald-400">{donation.matchedNgoName || 'Helping Hands'}</strong>
          </p>
        </div>

        {/* Status Stepper Controls */}
        <div className="p-3 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800 space-y-1.5 text-xs w-full lg:w-auto">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
            Dispatch Progression
          </span>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => handleAdvanceStatus('VOLUNTEER_ASSIGNED')}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-[11px]"
            >
              1. Assign Rider
            </button>
            <button
              onClick={() => handleAdvanceStatus('FOOD_PICKED_UP')}
              className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded text-[11px]"
            >
              2. Food Picked Up
            </button>
            <button
              onClick={() => handleAdvanceStatus('IN_TRANSIT')}
              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded text-[11px]"
            >
              3. In Transit
            </button>
            <button
              onClick={() => handleAdvanceStatus('DELIVERED')}
              className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded text-[11px]"
            >
              4. Delivered
            </button>
          </div>
        </div>
      </div>

      {/* MAP & LOGISTICS INFORMATION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* MAP VIEW */}
        <div className="lg:col-span-8 h-[450px] lg:h-[500px]">
          <TrackingMapView donation={donation} />
        </div>

        {/* SIDE INFORMATION PANEL */}
        <div className="lg:col-span-4 bg-white dark:bg-[#161918] rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between space-y-4 text-xs">
          
          <div className="space-y-4">
            <div className="border-b border-stone-200 dark:border-stone-800 pb-2">
              <h2 className="font-bold text-sm text-stone-900 dark:text-white">
                Dispatch Summary
              </h2>
            </div>

            {/* Donor */}
            <div className="p-3 bg-stone-50 dark:bg-stone-900/50 rounded-xl border border-stone-200 dark:border-stone-800 space-y-1">
              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 block uppercase">
                🟢 Donor Pickup Point
              </span>
              <p className="font-bold text-stone-900 dark:text-white">{donation.donorName}</p>
              <p className="text-stone-500">{donation.pickupLocation}</p>
            </div>

            {/* Food */}
            <div className="p-3 bg-stone-50 dark:bg-stone-900/50 rounded-xl border border-stone-200 dark:border-stone-800 space-y-1">
              <span className="text-[10px] font-bold text-stone-400 block uppercase">
                Food & Quantity
              </span>
              <p className="font-bold text-stone-900 dark:text-white flex justify-between">
                <span>{donation.itemName || donation.foodType}</span>
                <span className="text-emerald-700 dark:text-emerald-400">{donation.quantity} {donation.unit}</span>
              </p>
              {donation.excessDetails && (
                <p className="text-[11px] text-stone-500 italic">"{donation.excessDetails}"</p>
              )}
            </div>

            {/* Volunteer */}
            <div className="p-3 bg-stone-50 dark:bg-stone-900/50 rounded-xl border border-stone-200 dark:border-stone-800 space-y-1">
              <span className="text-[10px] font-bold text-blue-800 dark:text-blue-400 block uppercase">
                🔵 Volunteer Rider
              </span>
              <p className="font-bold text-stone-900 dark:text-white">
                {donation.volunteerName || 'Awaiting Rider Assignment'}
              </p>
              {donation.volunteerPhone && (
                <p className="text-stone-500">{donation.volunteerPhone}</p>
              )}
            </div>

            {/* Receiver */}
            <div className="p-3 bg-stone-50 dark:bg-stone-900/50 rounded-xl border border-stone-200 dark:border-stone-800 space-y-1">
              <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 block uppercase">
                🟠 Receiver Center
              </span>
              <p className="font-bold text-stone-900 dark:text-white">
                {donation.matchedNgoName || 'Helping Hands Foundation'}
              </p>
              <p className="text-stone-500">Shivajinagar Community Kitchen, Pune</p>
            </div>

          </div>

          <div className="pt-2 border-t border-stone-200 dark:border-stone-800 text-[11px] text-stone-400 flex justify-between">
            <span>Verified Logistics Chain</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">● Live Synced</span>
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
