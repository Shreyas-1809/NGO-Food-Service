import React, { useState, useEffect, useRef } from 'react';
import {
  Bike,
  MapPin,
  CheckCircle2,
  Navigation,
  Clock,
  Phone,
  Package,
  Building2,
  ArrowRight,
  Crosshair,
  AlertCircle,
  Award,
  ChevronRight,
  Truck,
  ShieldCheck
} from 'lucide-react';
import {
  getStoredDonations,
  assignVolunteerToDonation,
  markFoodPickedUp,
  markFoodDelivered,
  updateVolunteerLocation,
  subscribeToDonationUpdates
} from '../services/donationService';
import { getCurrentUserLocation, reverseGeocodeCoords, calculateDistanceKm, loadGoogleMaps } from '../services/mapsService';
import { useNavigate } from 'react-router-dom';

// ─────────────────────────────────────────────
// Mini Volunteer Map Component (inline)
// ─────────────────────────────────────────────
const VolunteerMapPanel = ({ donation, volunteerCoords }) => {
  const mapRef = useRef(null);

  const donorCoords = donation?.pickupCoords || { lat: 18.5196, lng: 73.8412 };
  const ngoCoords = donation?.ngoCoords || { lat: 18.5308, lng: 73.8474 };
  const volCoords = volunteerCoords || { lat: 18.5240, lng: 73.8445 };

  useEffect(() => {
    loadGoogleMaps()
      .then((maps) => {
        if (!mapRef.current) return;
        const bounds = new maps.LatLngBounds();
        bounds.extend(donorCoords);
        bounds.extend(ngoCoords);
        bounds.extend(volCoords);

        const map = new maps.Map(mapRef.current, {
          zoom: 13,
          center: volCoords,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControlOptions: { position: maps.ControlPosition.RIGHT_BOTTOM },
          styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }]
        });

        map.fitBounds(bounds, 30);

        // Volunteer (🔵 Blue Arrow)
        new maps.Marker({
          position: volCoords, map,
          title: 'You (Volunteer Rider)',
          icon: { path: maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 6, fillColor: '#2563EB', fillOpacity: 1, strokeWeight: 2, strokeColor: '#fff' }
        });

        // Donor (🟢 Green Circle)
        new maps.Marker({
          position: donorCoords, map,
          title: `Pickup: ${donation?.pickupLocation || 'Donor Location'}`,
          icon: { path: maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#10B981', fillOpacity: 1, strokeWeight: 2, strokeColor: '#fff' }
        });

        // NGO (🟠 Orange Circle)
        new maps.Marker({
          position: ngoCoords, map,
          title: `Drop-off: ${donation?.matchedNgoName || 'Receiver NGO'}`,
          icon: { path: maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#D97706', fillOpacity: 1, strokeWeight: 2, strokeColor: '#fff' }
        });
      })
      .catch(() => {
        // Fallback canvas rendered below
      });
  }, [donation?.id, volunteerCoords?.lat, volunteerCoords?.lng]);

  return (
    <div className="w-full h-[260px] rounded-xl overflow-hidden border border-stone-300 dark:border-stone-700 bg-[#1A1D1C] relative">
      <div ref={mapRef} className="w-full h-full" />
      {/* Canvas fallback overlay (hidden when google maps loads) */}
      <div className="absolute inset-0 bg-[#1A1D1C] flex flex-col p-3 z-0">
        <div className="text-[10px] text-stone-500 font-mono mb-2 flex justify-between">
          <span>Logistics Map</span>
          <span className="text-emerald-400">● Route Active</span>
        </div>
        <div className="flex-1 flex items-center justify-around text-xs font-bold">
          <div className="flex flex-col items-center space-y-1">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white"><Bike className="w-4 h-4" /></div>
            <span className="text-blue-300">You</span>
          </div>
          <div className="border-t-2 border-dashed border-stone-600 flex-1 mx-2" />
          <div className="flex flex-col items-center space-y-1">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white"><MapPin className="w-4 h-4" /></div>
            <span className="text-emerald-300">Pickup</span>
          </div>
          <div className="border-t-2 border-dashed border-stone-600 flex-1 mx-2" />
          <div className="flex flex-col items-center space-y-1">
            <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white"><Building2 className="w-4 h-4" /></div>
            <span className="text-amber-300">NGO</span>
          </div>
        </div>
        <p className="text-center text-[10px] text-stone-600 mt-2">
          Add Google Maps API Key via "Map Key" in navbar for live routing
        </p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Delivery Status Badge
// ─────────────────────────────────────────────
const DeliveryStatusBadge = ({ status }) => {
  const map = {
    CREATED: { label: 'Pickup Pending', color: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300' },
    AVAILABLE: { label: 'Pickup Pending', color: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300' },
    VOLUNTEER_ASSIGNED: { label: 'Pickup Accepted', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    FOOD_PICKED_UP: { label: 'Food Collected', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
    IN_TRANSIT: { label: 'In Transit', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' },
    DELIVERED: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
    COMPLETED: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' }
  };
  const s = map[status] || map.CREATED;
  return <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${s.color}`}>{s.label}</span>;
};

// ─────────────────────────────────────────────
// Progress Timeline Steps
// ─────────────────────────────────────────────
const DeliveryTimeline = ({ status }) => {
  const steps = [
    { key: ['CREATED', 'AVAILABLE'], label: 'Pickup Pending' },
    { key: ['VOLUNTEER_ASSIGNED'], label: 'Accepted' },
    { key: ['FOOD_PICKED_UP'], label: 'Food Collected' },
    { key: ['IN_TRANSIT'], label: 'In Transit' },
    { key: ['DELIVERED', 'COMPLETED'], label: 'Delivered' }
  ];

  const currentIndex = steps.findIndex(s => s.key.includes(status));

  return (
    <div className="flex items-center w-full overflow-x-auto py-2 gap-0">
      {steps.map((step, idx) => {
        const isDone = idx <= currentIndex;
        const isCurrent = idx === currentIndex;
        return (
          <React.Fragment key={idx}>
            <div className="flex flex-col items-center shrink-0">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isDone ? 'bg-[#1B4332] border-[#1B4332]' : 'bg-white dark:bg-stone-900 border-stone-300 dark:border-stone-700'}`}>
                {isDone && <CheckCircle2 className="w-3 h-3 text-white" />}
              </div>
              <span className={`text-[10px] mt-1 font-semibold text-center max-w-[60px] leading-tight ${isCurrent ? 'text-[#1B4332] dark:text-emerald-400' : isDone ? 'text-stone-700 dark:text-stone-300' : 'text-stone-400'}`}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mb-4 ${idx < currentIndex ? 'bg-[#1B4332]' : 'bg-stone-200 dark:bg-stone-800'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────
// Main Volunteer Dashboard
// ─────────────────────────────────────────────
const VolunteerDashboard = ({ user }) => {
  const [donations, setDonations] = useState([]);
  const [volunteerLocation, setVolunteerLocation] = useState({ lat: 18.5240, lng: 73.8445 });
  const [volunteerAddress, setVolunteerAddress] = useState('Deccan Gymkhana, Pune');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [activeDonationId, setActiveDonationId] = useState(null);
  const navigate = useNavigate();

  const profile = {
    name: user?.name || 'Rahul Verma',
    role: 'Volunteer Rider',
    phone: '+91 98233 44112',
    vehicle: 'Motorbike + Thermal Carrier',
    joinedDate: 'March 2026',
    deliveriesCount: 42
  };

  const syncData = () => setDonations(getStoredDonations());

  useEffect(() => {
    syncData();
    return subscribeToDonationUpdates(syncData);
  }, []);

  const showMsg = (msg) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(''), 5000);
  };

  const handleShareGps = async () => {
    try {
      setGpsLoading(true);
      const coords = await getCurrentUserLocation();
      const addr = await reverseGeocodeCoords(coords);
      setVolunteerLocation(coords);
      setVolunteerAddress(addr);
      activeAssigned.forEach(d => updateVolunteerLocation(d.id, coords));
      showMsg('Live GPS coordinates shared with Donor & Receiver successfully.');
    } catch (err) {
      showMsg(err.message || 'Unable to get GPS location.');
    } finally {
      setGpsLoading(false);
    }
  };

  const handleAcceptPickup = (donationId) => {
    assignVolunteerToDonation(donationId, {
      name: profile.name,
      phone: profile.phone,
      coords: volunteerLocation
    });
    setActiveDonationId(donationId);
    showMsg('Pickup accepted! Navigate to donor pickup address.');
  };

  const handleMarkPickedUp = (donationId) => {
    markFoodPickedUp(donationId);
    showMsg('Food marked as collected. Now deliver to receiver NGO.');
  };

  const handleMarkDelivered = (donationId) => {
    markFoodDelivered(donationId);
    showMsg('Delivery completed! Thank you for rescuing this food.');
  };

  const activeAssigned = donations.filter(d =>
    ['VOLUNTEER_ASSIGNED', 'FOOD_PICKED_UP', 'IN_TRANSIT'].includes(d.status)
  );
  const availablePickups = donations.filter(d =>
    ['CREATED', 'MATCHED', 'AVAILABLE'].includes(d.status) && !d.volunteerId
  );
  const completedDeliveries = donations.filter(d =>
    ['DELIVERED', 'COMPLETED'].includes(d.status)
  );

  const activeDonationForMap = activeAssigned[0] || availablePickups[0] || null;

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#161918] p-6 sm:p-8 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800 mb-2">
            <Bike className="w-3.5 h-3.5" />
            <span>Volunteer Rider Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white">
            Welcome, {profile.name}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Accept pickups, share live GPS, and deliver surplus food to verified community hubs.
          </p>
        </div>

        <button
          onClick={handleShareGps}
          disabled={gpsLoading}
          className="w-full md:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
        >
          <Crosshair className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
          <span>{gpsLoading ? 'Getting Location...' : 'Share Live GPS'}</span>
        </button>
      </div>

      {/* Action Message */}
      {actionMessage && (
        <div className="bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 p-3.5 rounded-xl flex items-center space-x-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* STATS + GPS CARD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#161918] p-5 rounded-xl border border-stone-200 dark:border-stone-800">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">Total Pickups</span>
          <span className="text-2xl font-extrabold text-stone-900 dark:text-white mt-1 block">
            {profile.deliveriesCount + completedDeliveries.length}
          </span>
        </div>
        <div className="bg-white dark:bg-[#161918] p-5 rounded-xl border border-stone-200 dark:border-stone-800">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">Active Now</span>
          <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 block">{activeAssigned.length}</span>
        </div>
        <div className="bg-white dark:bg-[#161918] p-5 rounded-xl border border-stone-200 dark:border-stone-800">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">Completed</span>
          <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1 block">{completedDeliveries.length}</span>
        </div>
        {/* Live GPS card */}
        <div className="bg-[#1B4332] text-white p-5 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between text-[10px] font-bold text-emerald-200 uppercase tracking-wider mb-1">
              <span>Your GPS</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <p className="text-xs font-bold truncate">{volunteerAddress}</p>
            <p className="text-[10px] font-mono text-emerald-300 mt-0.5">
              {volunteerLocation.lat.toFixed(4)}° N, {volunteerLocation.lng.toFixed(4)}° E
            </p>
          </div>
          <button onClick={handleShareGps} className="text-[11px] text-emerald-200 hover:text-white underline mt-2 text-left">
            Refresh →
          </button>
        </div>
      </div>

      {/* MAIN CONTENT: Active dispatch + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT: Active Dispatch Steps */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-lg font-bold text-stone-900 dark:text-white flex items-center">
            <Truck className="w-4 h-4 mr-2 text-blue-600" />
            Active Dispatches ({activeAssigned.length})
          </h2>

          {activeAssigned.length === 0 ? (
            <div className="bg-white dark:bg-[#161918] rounded-2xl p-8 border border-stone-200 dark:border-stone-800 text-center">
              <Bike className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-600 mb-2" />
              <p className="font-semibold text-sm text-stone-700 dark:text-stone-300">No active dispatches right now.</p>
              <p className="text-xs text-stone-500 mt-0.5">Accept a pickup below to start a delivery.</p>
            </div>
          ) : (
            activeAssigned.map((d) => {
              const isPickedUp = ['FOOD_PICKED_UP', 'IN_TRANSIT'].includes(d.status);
              return (
                <div key={d.id} className="bg-white dark:bg-[#161918] rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
                  {/* Card Header */}
                  <div className="p-5 border-b border-stone-100 dark:border-stone-800 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-mono bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded">{d.id}</span>
                        <DeliveryStatusBadge status={d.status} />
                      </div>
                      <button
                        onClick={() => navigate(`/track/${d.id}`)}
                        className="text-xs font-semibold text-[#1B4332] dark:text-emerald-400 hover:underline flex items-center"
                      >
                        <Navigation className="w-3.5 h-3.5 mr-1" /> Open Tracking Map
                      </button>
                    </div>
                    <h3 className="font-bold text-stone-900 dark:text-white">
                      {d.title || d.itemName}
                      <span className="ml-2 text-xs font-normal text-emerald-700 dark:text-emerald-400">
                        {d.quantity} {d.unit}
                      </span>
                    </h3>
                    <DeliveryTimeline status={d.status} />
                  </div>

                  {/* 2-step route cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-stone-100 dark:divide-stone-800">
                    {/* Step 1: Pickup */}
                    <div className={`p-4 space-y-2 text-xs ${!isPickedUp ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : 'opacity-60'}`}>
                      <p className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center text-xs">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        Step 1 — Collect from Donor
                        {isPickedUp && <CheckCircle2 className="w-3.5 h-3.5 ml-1 text-emerald-600" />}
                      </p>
                      <p className="font-semibold text-stone-900 dark:text-white">{d.donorName || 'Donor'}</p>
                      <p className="text-stone-500">{d.pickupLocation}</p>
                      {!isPickedUp && (
                        <button
                          onClick={() => handleMarkPickedUp(d.id)}
                          className="w-full mt-1 py-2.5 bg-[#1B4332] hover:bg-[#143326] text-white font-bold rounded-lg transition-colors flex items-center justify-center space-x-1"
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>Confirm Food Picked Up</span>
                        </button>
                      )}
                    </div>

                    {/* Step 2: Drop-off */}
                    <div className={`p-4 space-y-2 text-xs ${isPickedUp ? 'bg-amber-50/40 dark:bg-amber-950/20' : 'opacity-60'}`}>
                      <p className="font-bold text-amber-900 dark:text-amber-300 flex items-center text-xs">
                        <Building2 className="w-3.5 h-3.5 mr-1 text-amber-600" />
                        Step 2 — Deliver to Receiver
                      </p>
                      <p className="font-semibold text-stone-900 dark:text-white">
                        {d.matchedNgoName || 'Helping Hands Foundation'}
                      </p>
                      <p className="text-stone-500">Shivajinagar Community Kitchen, Pune</p>
                      {isPickedUp && (
                        <button
                          onClick={() => handleMarkDelivered(d.id)}
                          className="w-full mt-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition-colors flex items-center justify-center space-x-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm Delivered</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* AVAILABLE PICKUPS */}
          <div className="space-y-3 mt-2">
            <h2 className="text-lg font-bold text-stone-900 dark:text-white">
              Available Pickups Nearby ({availablePickups.length})
            </h2>

            {availablePickups.length === 0 ? (
              <div className="bg-white dark:bg-[#161918] rounded-2xl p-6 border border-stone-200 dark:border-stone-800 text-center text-xs text-stone-400">
                No unassigned pickups available right now.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {availablePickups.map((d) => (
                  <div
                    key={d.id}
                    className="bg-white dark:bg-[#161918] rounded-xl border border-stone-200 dark:border-stone-800 p-5 flex flex-col justify-between space-y-4 hover:border-stone-300 transition-colors"
                  >
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[11px] bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded">{d.id}</span>
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950 px-2 py-0.5 rounded border border-red-200">{d.urgency || 'HIGH'}</span>
                      </div>
                      <h3 className="font-bold text-stone-900 dark:text-white text-base">{d.title || d.itemName}</h3>
                      <div className="p-3 bg-stone-50 dark:bg-stone-900/60 rounded-lg border border-stone-200 dark:border-stone-800 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-stone-400">Quantity:</span>
                          <strong className="text-emerald-800 dark:text-emerald-400">{d.quantity} {d.unit}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">Pickup point:</span>
                          <span className="truncate max-w-[120px]">{d.pickupLocation}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-400">Distance:</span>
                          <span className="text-blue-600 font-semibold">~1.8 km</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAcceptPickup(d.id)}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center justify-center space-x-1 transition-colors"
                    >
                      <Bike className="w-3.5 h-3.5" />
                      <span>Accept Pickup</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COMPLETED DELIVERIES TABLE */}
          {completedDeliveries.length > 0 && (
            <div className="bg-white dark:bg-[#161918] rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center">
                <h2 className="font-bold text-stone-900 dark:text-white flex items-center">
                  <Award className="w-4 h-4 mr-2 text-amber-600" />
                  Completed Deliveries
                </h2>
                <span className="text-xs text-stone-400">{completedDeliveries.length} deliveries</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-stone-100 dark:border-stone-800 text-stone-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">Food Item</th>
                      <th className="py-3 px-4">Quantity</th>
                      <th className="py-3 px-4">Receiver</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                    {completedDeliveries.map((d) => (
                      <tr key={d.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                        <td className="py-3 px-4 font-mono text-stone-500">{d.id}</td>
                        <td className="py-3 px-4 font-semibold text-stone-900 dark:text-white">{d.title || d.itemName}</td>
                        <td className="py-3 px-4 text-emerald-700 dark:text-emerald-400 font-semibold">{d.quantity} {d.unit}</td>
                        <td className="py-3 px-4 text-stone-500">{d.matchedNgoName || '—'}</td>
                        <td className="py-3 px-4"><DeliveryStatusBadge status={d.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Volunteer Map Panel */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-lg font-bold text-stone-900 dark:text-white flex items-center">
            <Navigation className="w-4 h-4 mr-2 text-blue-600" />
            Your Delivery Route
          </h2>

          <div className="bg-white dark:bg-[#161918] rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs p-4 space-y-3">

            {/* Map */}
            <VolunteerMapPanel donation={activeDonationForMap} volunteerCoords={volunteerLocation} />

            {/* Map Legend */}
            <div className="flex items-center justify-around text-[11px] font-semibold text-stone-600 dark:text-stone-300 border-t border-stone-100 dark:border-stone-800 pt-3">
              <span className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
                <span>You</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
                <span>Pickup</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded-full bg-amber-600 inline-block" />
                <span>Drop-off NGO</span>
              </span>
            </div>

            {/* Where to go guide */}
            <div className="space-y-2 text-xs">
              <p className="font-bold text-stone-700 dark:text-stone-300 text-sm">
                Where do I go?
              </p>
              <div className="space-y-1.5">
                <div className="flex items-start space-x-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-emerald-900 dark:text-emerald-300">1. Go to Pickup Point</p>
                    <p className="text-stone-600 dark:text-stone-400">
                      {activeDonationForMap?.pickupLocation || 'Accept a pickup to see donor address'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2 p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800">
                  <Building2 className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-900 dark:text-amber-300">2. Deliver to NGO</p>
                    <p className="text-stone-600 dark:text-stone-400">
                      {activeDonationForMap?.matchedNgoName || 'NGO will show once donation is matched'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Profile card */}
          <div className="bg-white dark:bg-[#161918] rounded-2xl border border-stone-200 dark:border-stone-800 p-5 space-y-3 text-xs">
            <h3 className="font-bold text-stone-900 dark:text-white">My Rider Profile</h3>
            <div className="space-y-1.5 text-stone-600 dark:text-stone-300">
              <div className="flex justify-between">
                <span>Name:</span>
                <strong className="text-stone-900 dark:text-white">{profile.name}</strong>
              </div>
              <div className="flex justify-between">
                <span>Vehicle:</span>
                <strong className="text-stone-900 dark:text-white">{profile.vehicle}</strong>
              </div>
              <div className="flex justify-between">
                <span>Joined:</span>
                <strong className="text-stone-900 dark:text-white">{profile.joinedDate}</strong>
              </div>
              <div className="flex justify-between">
                <span>Total deliveries:</span>
                <strong className="text-emerald-700 dark:text-emerald-400">{profile.deliveriesCount + completedDeliveries.length}</strong>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default VolunteerDashboard;
