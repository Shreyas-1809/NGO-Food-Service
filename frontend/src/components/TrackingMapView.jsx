import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps, calculateMultiStopRouteInfo } from '../services/mapsService';
import { MapPin, Navigation, Bike, Building2, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';

const TrackingMapView = ({ donation }) => {
  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [apiAvailable, setApiAvailable] = useState(true);
  const [routeStats, setRouteStats] = useState(null);

  const donorCoords = donation.pickupCoords || { lat: 18.5196, lng: 73.8412 };
  const ngoCoords = donation.ngoCoords || { lat: 18.5308, lng: 73.8474 };
  const volunteerCoords = donation.volunteerCoords || {
    lat: (donorCoords.lat + ngoCoords.lat) / 2,
    lng: (donorCoords.lng + ngoCoords.lng) / 2
  };

  const hasVolunteer = Boolean(donation.volunteerName || donation.volunteerId || ['VOLUNTEER_ASSIGNED', 'FOOD_PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(donation.status));

  useEffect(() => {
    calculateMultiStopRouteInfo(donorCoords, hasVolunteer ? volunteerCoords : donorCoords, ngoCoords)
      .then(res => setRouteStats(res))
      .catch(() => {});
  }, [donorCoords, volunteerCoords, ngoCoords, hasVolunteer]);

  useEffect(() => {
    let map = null;

    loadGoogleMaps()
      .then((maps) => {
        if (!mapRef.current) return;
        setApiAvailable(true);

        const bounds = new maps.LatLngBounds();
        bounds.extend(donorCoords);
        bounds.extend(ngoCoords);
        if (hasVolunteer) bounds.extend(volunteerCoords);

        map = new maps.Map(mapRef.current, {
          center: donorCoords,
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          styles: [
            { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }
          ]
        });

        setMapInstance(map);
        map.fitBounds(bounds, 40);

        // 1. Donor Marker (🟢)
        new maps.Marker({
          position: donorCoords,
          map,
          title: `Donor: ${donation.pickupLocation}`,
          icon: {
            path: maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#10B981',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#FFFFFF'
          }
        });

        // 2. NGO Marker (🟠)
        new maps.Marker({
          position: ngoCoords,
          map,
          title: `Receiver NGO: ${donation.matchedNgoName || 'Verified NGO'}`,
          icon: {
            path: maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#D97706',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#FFFFFF'
          }
        });

        // 3. Volunteer Marker (🔵)
        if (hasVolunteer) {
          new maps.Marker({
            position: volunteerCoords,
            map,
            title: `Volunteer: ${donation.volunteerName || 'Rider'}`,
            icon: {
              path: maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 6,
              fillColor: '#2563EB',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#FFFFFF'
            }
          });
        }
      })
      .catch((err) => {
        console.warn('[TrackingMapView] Visual canvas mode active:', err.message);
        setApiAvailable(false);
      });
  }, [donation.id, donation.status, hasVolunteer]);

  return (
    <div className="w-full h-full min-h-[420px] relative rounded-2xl overflow-hidden border border-stone-300 dark:border-stone-700 bg-[#1C1F1E] flex flex-col">
      
      {/* Live Google Map Container OR Functional Logistics Canvas */}
      {apiAvailable ? (
        <div ref={mapRef} className="w-full h-full min-h-[420px]" />
      ) : (
        /* FUNCTIONAL LOGISTICS CANVAS */
        <div className="w-full h-full min-h-[420px] bg-[#1A1D1C] text-stone-100 relative p-5 flex flex-col justify-between overflow-hidden">
          
          {/* Top Status Bar */}
          <div className="bg-[#242928] border border-stone-700 px-3.5 py-2 rounded-xl flex items-center justify-between text-xs z-10">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="font-semibold text-stone-200">
                Logistics Chain: <span className="text-emerald-400">🟢 Donor</span> ➔ <span className="text-blue-400">🔵 Volunteer</span> ➔ <span className="text-amber-400">🟠 Receiver NGO</span>
              </span>
            </div>
            <span className="text-[11px] bg-stone-800 text-stone-300 px-2 py-0.5 rounded font-mono font-bold">
              {routeStats ? routeStats.durationText : 'Active Tracking'}
            </span>
          </div>

          {/* Logistics Routing Area */}
          <div className="relative flex-1 my-3 bg-[#141716] rounded-xl border border-stone-800 p-4 flex items-center justify-center">
            
            {/* SVG Connecting Paths */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              {/* Path 1: Volunteer to Donor */}
              {hasVolunteer && (
                <line
                  x1="25%" y1="65%"
                  x2="48%" y2="30%"
                  stroke="#3B82F6"
                  strokeWidth="3"
                  strokeDasharray="5 5"
                />
              )}

              {/* Path 2: Donor to NGO */}
              <line
                x1="48%" y1="30%"
                x2="78%" y2="55%"
                stroke="#10B981"
                strokeWidth="3"
                strokeDasharray="6 6"
              />
            </svg>

            {/* NODE 1: 🔵 VOLUNTEER POSITION */}
            {hasVolunteer && (
              <div className="absolute bottom-[28%] left-[22%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md border-2 border-white">
                  <Bike className="w-4 h-4" />
                </div>
                <div className="mt-1 text-center bg-stone-900/90 border border-stone-700 px-2 py-0.5 rounded text-[10px]">
                  <span className="text-blue-400 font-bold block">🔵 Volunteer</span>
                  <span className="text-stone-400 font-mono text-[9px]">
                    {volunteerCoords.lat.toFixed(4)}°N, {volunteerCoords.lng.toFixed(4)}°E
                  </span>
                </div>
              </div>
            )}

            {/* NODE 2: 🟢 DONOR PICKUP */}
            <div className="absolute top-[25%] left-[48%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md border-2 border-white">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="mt-1 text-center bg-stone-900/90 border border-stone-700 px-2 py-0.5 rounded text-[10px]">
                <span className="text-emerald-400 font-bold block">🟢 Donor Pickup</span>
                <span className="text-stone-300 text-[9px] max-w-[120px] truncate block">
                  {donation.pickupLocation}
                </span>
              </div>
            </div>

            {/* NODE 3: 🟠 RECEIVER NGO */}
            <div className="absolute bottom-[35%] right-[18%] transform translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20">
              <div className="w-9 h-9 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-md border-2 border-white">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="mt-1 text-center bg-stone-900/90 border border-stone-700 px-2 py-0.5 rounded text-[10px]">
                <span className="text-amber-400 font-bold block">🟠 Receiver NGO</span>
                <span className="text-stone-300 text-[9px] max-w-[120px] truncate block">
                  {donation.matchedNgoName || 'Helping Hands'}
                </span>
              </div>
            </div>

          </div>

          {/* Bottom Route Strip */}
          {routeStats && (
            <div className="bg-[#242928] border border-stone-700 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs z-10 text-stone-300">
              <div className="flex items-center space-x-1.5">
                <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                <span>Total Route: <strong className="text-white">{routeStats.totalKm} km</strong></span>
              </div>
              <div className="flex items-center space-x-3">
                <span>ETA: <strong className="text-blue-300">{routeStats.donorEta}</strong></span>
                <span>•</span>
                <span>Trip Duration: <strong className="text-emerald-300">{routeStats.durationText}</strong></span>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default TrackingMapView;
