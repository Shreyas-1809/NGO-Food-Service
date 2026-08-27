import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps, calculateRouteInfo } from '../services/mapsService';
import { MapPin, Navigation, Building2, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';

const TrackingMapView = ({ donation }) => {
  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [apiAvailable, setApiAvailable] = useState(true);
  const [routeStats, setRouteStats] = useState(null);

  const donorCoords = donation.pickupCoords || { lat: 18.5196, lng: 73.8412 };
  const ngoCoords = donation.ngoCoords || { lat: 18.5308, lng: 73.8474 };

  useEffect(() => {
    calculateRouteInfo(donorCoords, ngoCoords)
      .then(res => setRouteStats(res))
      .catch(() => {});
  }, [donorCoords, ngoCoords]);

  useEffect(() => {
    let map = null;

    loadGoogleMaps()
      .then((maps) => {
        if (!mapRef.current) return;
        setApiAvailable(true);

        const bounds = new maps.LatLngBounds();
        bounds.extend(donorCoords);
        bounds.extend(ngoCoords);

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
          title: `Donor: ${donation.pickupLocation || 'Donor Location'}`,
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
      })
      .catch((err) => {
        console.warn('[TrackingMapView] Visual canvas mode active:', err.message);
        setApiAvailable(false);
      });
  }, [donation.id, donation.status, donorCoords, ngoCoords]);

  return (
    <div className="w-full h-full min-h-[420px] relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 flex flex-col shadow-sm">
      
      {/* Live Google Map Container OR Functional Logistics Canvas */}
      {apiAvailable ? (
        <div ref={mapRef} className="w-full h-full min-h-[420px]" />
      ) : (
        /* FUNCTIONAL LOGISTICS CANVAS */
        <div className="w-full h-full min-h-[420px] bg-slate-950 text-slate-100 relative p-5 flex flex-col justify-between overflow-hidden">
          
          {/* Top Status Bar */}
          <div className="bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-2xl flex items-center justify-between text-xs z-10 backdrop-blur-xs">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-bold text-slate-200">
                Logistics Route: <span className="text-emerald-400">🟢 Donor Pickup</span> ➔ <span className="text-amber-400">🟠 Receiver NGO Hub</span>
              </span>
            </div>
            <span className="text-[11px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg font-mono font-bold">
              {routeStats ? routeStats.durationText : 'Direct Pickup Route'}
            </span>
          </div>

          {/* Logistics Routing Area */}
          <div className="relative flex-1 my-4 bg-slate-900/50 rounded-2xl border border-slate-800/80 p-4 flex items-center justify-center">
            
            {/* SVG Connecting Paths */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              {/* Path: Donor to NGO */}
              <line
                x1="30%" y1="50%"
                x2="70%" y2="50%"
                stroke="#10B981"
                strokeWidth="3"
                strokeDasharray="6 6"
              />
            </svg>

            {/* NODE 1: 🟢 DONOR PICKUP */}
            <div className="absolute top-1/2 left-[30%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-white">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="mt-2 text-center bg-slate-900/90 border border-slate-700 px-3 py-1 rounded-xl text-[11px] shadow-sm">
                <span className="text-emerald-400 font-extrabold block">🟢 Donor Pickup</span>
                <span className="text-slate-300 text-[10px] max-w-[140px] truncate block">
                  {donation.pickupLocation || 'Donor Address'}
                </span>
              </div>
            </div>

            {/* NODE 2: 🟠 RECEIVER NGO */}
            <div className="absolute top-1/2 left-[70%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20">
              <div className="w-11 h-11 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-lg border-2 border-white">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="mt-2 text-center bg-slate-900/90 border border-slate-700 px-3 py-1 rounded-xl text-[11px] shadow-sm">
                <span className="text-amber-400 font-extrabold block">🟠 Receiver NGO</span>
                <span className="text-slate-300 text-[10px] max-w-[140px] truncate block">
                  {donation.matchedNgoName || 'Helping Hands'}
                </span>
              </div>
            </div>

          </div>

          {/* Bottom Route Strip */}
          {routeStats && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs z-10 text-slate-300">
              <div className="flex items-center space-x-2">
                <Navigation className="w-4 h-4 text-emerald-400" />
                <span>Direct Distance: <strong className="text-white">{routeStats.totalKm || routeStats.distanceText} km</strong></span>
              </div>
              <div className="flex items-center space-x-3">
                <span>Estimated Travel: <strong className="text-emerald-300">{routeStats.durationText}</strong></span>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default TrackingMapView;
