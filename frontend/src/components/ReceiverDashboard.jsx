import React, { useState, useEffect } from 'react';
import {
  Plus,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Users,
  Package,
  AlertCircle,
  ArrowRight,
  Sparkles,
  MapPin,
  Crosshair,
  Truck,
  Bike,
  Navigation,
  Phone
} from 'lucide-react';
import {
  getStoredRequests,
  createReceiverRequest,
  getStoredDonations,
  confirmDonationMatch,
  subscribeToDonationUpdates,
  getStoredNgos,
  updateNgoProfile
} from '../services/donationService';
import { getCurrentUserLocation, reverseGeocodeCoords, geocodeAddress } from '../services/mapsService';
import { findRecommendedDonationsForNGO } from '../services/matchingService';
import { useNavigate } from 'react-router-dom';

const ReceiverDashboard = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [incomingDonations, setIncomingDonations] = useState([]);
  const [availableDonorSurplus, setAvailableDonorSurplus] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const navigate = useNavigate();

  // Current NGO Profile / Location
  const [ngoProfile, setNgoProfile] = useState(() => {
    const ngos = getStoredNgos();
    return ngos.find(n => n.id === user?.id || n.name === user?.name) || ngos[0] || {
      id: 'ngo-101',
      name: user?.name || 'Helping Hands Foundation',
      address: '42 University Road, Shivajinagar, Pune',
      area: 'Shivajinagar',
      city: 'Pune',
      location: { lat: 18.5308, lng: 73.8474 },
      phone: '+91 98220 11223',
      foodTypesAccepted: ['Cooked Food', 'Raw Grains', 'Packaged Food'],
      capacity: '800 meals/day',
      verified: true
    };
  });

  const [formData, setFormData] = useState({
    item: 'Rice & Grains',
    category: 'Food',
    quantity: '50',
    unit: 'kg',
    description: 'Required for community kitchen daily feeding program.',
    location: 'Shivajinagar, Pune',
    requiredBy: '2026-08-20',
    priority: '🔴 Urgent',
    urgency: 'HIGH',
    beneficiaries: '120'
  });

  const syncData = () => {
    const storedReqs = getStoredRequests();
    setRequests(storedReqs);
    const allDonations = getStoredDonations();
    
    // Incoming / Matched donations
    setIncomingDonations(allDonations.filter(d => d.matchedNgoId === ngoProfile.id || d.status !== 'AVAILABLE'));
    
    // Available Surplus donations
    const activeAvailable = allDonations.filter(d => d.status === 'AVAILABLE' || !d.matchedNgoId);
    const recommended = findRecommendedDonationsForNGO(storedReqs[0] || { category: 'Food', item: 'Rice' }, activeAvailable);
    setAvailableDonorSurplus(recommended.length > 0 ? recommended : activeAvailable);

    // Refresh NGO
    const ngos = getStoredNgos();
    const current = ngos.find(n => n.id === ngoProfile.id) || ngos[0];
    if (current) setNgoProfile(current);
  };

  useEffect(() => {
    syncData();
    return subscribeToDonationUpdates(syncData);
  }, [ngoProfile.id]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.item || !formData.quantity) return;

    createReceiverRequest(formData, user || ngoProfile);
    setShowRequestModal(false);
    setSuccessMessage(`Requirement for ${formData.quantity} ${formData.unit} of ${formData.item} published.`);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleAcceptDonation = (donation) => {
    confirmDonationMatch(donation.id, ngoProfile.id, ngoProfile.name);
    navigate(`/track/${donation.id}`);
  };

  const handleUpdateNgoLocation = async () => {
    try {
      setGpsLoading(true);
      const coords = await getCurrentUserLocation();
      const address = await reverseGeocodeCoords(coords);
      const updated = updateNgoProfile(ngoProfile.id, {
        address,
        location: coords
      });
      setNgoProfile(updated);
      setLocationSuccess(true);
      setTimeout(() => setLocationSuccess(false), 4000);
    } catch (err) {
      alert(err.message || 'Unable to update location via GPS.');
    } finally {
      setGpsLoading(false);
    }
  };

  const activeRequestsCount = requests.filter(r => r.status === 'ACTIVE').length;
  const donationsReceivedCount = incomingDonations.length;

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* Welcome & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#161918] p-6 sm:p-8 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-md mb-2 border border-emerald-200 dark:border-emerald-900">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{ngoProfile.verified ? 'Verified Partner NGO' : 'Community Receiver'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white">
            {ngoProfile.name}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Manage your food intake hub, publish shortages, and track volunteer dispatches.
          </p>
        </div>

        <button
          onClick={() => setShowRequestModal(true)}
          className="w-full sm:w-auto px-5 py-3 bg-[#1B4332] hover:bg-[#143326] text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Publish Food Shortage</span>
        </button>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 p-4 rounded-xl flex items-center space-x-3 text-xs font-semibold shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* STATS SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#161918] p-5 rounded-xl border border-stone-200 dark:border-stone-800">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">Active Shortages</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white mt-1 block">{activeRequestsCount}</span>
        </div>
        <div className="bg-white dark:bg-[#161918] p-5 rounded-xl border border-stone-200 dark:border-stone-800">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">Incoming Matches</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 block">{donationsReceivedCount}</span>
        </div>
        <div className="bg-white dark:bg-[#161918] p-5 rounded-xl border border-stone-200 dark:border-stone-800">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">Daily Meal Capacity</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-amber-700 dark:text-amber-400 mt-1 block">{ngoProfile.capacity || '800 meals'}</span>
        </div>
        <div className="bg-white dark:bg-[#161918] p-5 rounded-xl border border-stone-200 dark:border-stone-800">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">Delivered Total</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1 block">320+</span>
        </div>
      </div>

      {/* DISTRIBUTION HUB & LOCATION SETTINGS */}
      <div className="bg-white dark:bg-[#161918] rounded-2xl p-6 sm:p-7 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-white flex items-center">
              <Building2 className="w-4 h-4 mr-2 text-[#1B4332] dark:text-emerald-400" />
              Registered Distribution Hub Address
            </h2>
            <p className="text-xs text-stone-500">
              This address serves as the delivery destination on the live tracking map for volunteer riders.
            </p>
          </div>

          <button
            onClick={handleUpdateNgoLocation}
            disabled={gpsLoading}
            className="px-3.5 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 font-semibold rounded-lg text-xs flex items-center space-x-1.5 transition-colors"
          >
            <Crosshair className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
            <span>{gpsLoading ? 'Locating...' : 'Update via Device GPS'}</span>
          </button>
        </div>

        <div className="p-4 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs">
          <div>
            <p className="font-bold text-stone-900 dark:text-white flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 text-stone-400" />
              {ngoProfile.address}
            </p>
            <p className="text-stone-500 font-mono mt-0.5">
              GPS: {ngoProfile.location?.lat.toFixed(4)}° N, {ngoProfile.location?.lng.toFixed(4)}° E • {ngoProfile.area}, {ngoProfile.city}
            </p>
          </div>
          <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded border border-emerald-200">
            ✓ Destination Active on Map
          </span>
        </div>

        {locationSuccess && (
          <p className="text-xs text-emerald-700 font-semibold flex items-center">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Distribution hub address and GPS coordinates updated.
          </p>
        )}
      </div>

      {/* AVAILABLE DONATIONS NEARBY */}
      <div className="bg-white dark:bg-[#161918] rounded-2xl p-6 sm:p-7 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-white">
              Available Food Surplus Nearby
            </h2>
            <p className="text-xs text-stone-500">Claim unallocated surplus for your community beneficiaries</p>
          </div>
          <button
            onClick={() => navigate('/available-donations')}
            className="text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 flex items-center"
          >
            View All ({availableDonorSurplus.length}) <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {availableDonorSurplus.slice(0, 3).map((d) => (
            <div
              key={d.id}
              className="p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-[#FBFBFA] dark:bg-stone-900/40 flex flex-col justify-between space-y-4 hover:border-stone-300 transition-colors"
            >
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-stone-900 dark:text-white text-sm">{d.title || d.itemName}</h3>
                  <span className="text-[10px] font-semibold bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-2 py-0.5 rounded">
                    {d.category || 'Food'}
                  </span>
                </div>

                <div className="mt-3 p-3 bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 text-xs space-y-1.5">
                  <div className="flex justify-between text-stone-600 dark:text-stone-300">
                    <span>Quantity:</span>
                    <strong className="text-emerald-800 dark:text-emerald-400 font-bold">{d.quantity} {d.unit}</strong>
                  </div>
                  <div className="flex justify-between text-stone-600 dark:text-stone-300">
                    <span>Donor Pickup:</span>
                    <span className="truncate max-w-[130px]">{d.pickupLocation}</span>
                  </div>
                  <div className="flex justify-between text-stone-600 dark:text-stone-300">
                    <span>Distance:</span>
                    <span className="font-semibold text-blue-600">~2.4 km away</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleAcceptDonation(d)}
                className="w-full py-2.5 bg-[#1B4332] hover:bg-[#143326] text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1"
              >
                <span>Claim & Track Delivery</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* INCOMING DELIVERIES TRACKING TABLE */}
      <div className="bg-white dark:bg-[#161918] rounded-2xl p-6 sm:p-7 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-white">
              Incoming Dispatches & Active Deliveries
            </h2>
            <p className="text-xs text-stone-500">Live volunteer rider dispatches delivering to your hub</p>
          </div>
          <span className="text-xs text-stone-400 font-medium">{incomingDonations.length} Active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">ID</th>
                <th className="py-3 px-3">Item</th>
                <th className="py-3 px-3">Quantity</th>
                <th className="py-3 px-3">Pickup Location</th>
                <th className="py-3 px-3">Volunteer Rider</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60 font-medium">
              {incomingDonations.map((d) => (
                <tr key={d.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors">
                  <td className="py-3 px-3 font-mono font-semibold text-stone-600 dark:text-stone-400 text-xs">{d.id}</td>
                  <td className="py-3 px-3 font-bold text-stone-900 dark:text-white">{d.title || d.itemName}</td>
                  <td className="py-3 px-3 font-bold text-emerald-800 dark:text-emerald-400">{d.quantity} {d.unit}</td>
                  <td className="py-3 px-3 text-stone-500 max-w-xs truncate">{d.pickupLocation}</td>
                  <td className="py-3 px-3 text-stone-700 dark:text-stone-300">{d.volunteerName || 'Awaiting Rider'}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                      {d.status.replace('_', ' ')}
                    </span>
                  </td>
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

      {/* CREATE RESOURCE REQUIREMENT MODAL */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-[70] flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#161918] rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-stone-200 dark:border-stone-800">
            <div className="p-6 bg-[#1B4332] text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-200">NGO Shortage Form</span>
                <h3 className="text-lg font-bold">Publish Food Requirement</h3>
              </div>
              <button onClick={() => setShowRequestModal(false)} className="text-white text-2xl leading-none">&times;</button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">Required Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rice, Fresh Meals, Pulses"
                  className="w-full p-2.5 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-white outline-none"
                  value={formData.item}
                  onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="w-full p-2.5 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-white outline-none"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">Unit *</label>
                  <input
                    type="text"
                    required
                    placeholder="kg, meals, packs"
                    className="w-full p-2.5 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-white outline-none"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">Needed By Date *</label>
                  <input
                    type="date"
                    required
                    className="w-full p-2.5 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-white outline-none"
                    value={formData.requiredBy}
                    onChange={(e) => setFormData({ ...formData, requiredBy: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">Beneficiaries Count</label>
                  <input
                    type="number"
                    placeholder="e.g. 120"
                    className="w-full p-2.5 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-white outline-none"
                    value={formData.beneficiaries}
                    onChange={(e) => setFormData({ ...formData, beneficiaries: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 py-2.5 border border-stone-300 dark:border-stone-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#1B4332] hover:bg-[#143326] text-white font-bold rounded-lg"
                >
                  Publish Requirement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReceiverDashboard;
