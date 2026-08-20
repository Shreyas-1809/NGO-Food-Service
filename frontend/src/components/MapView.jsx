import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps, calculateRouteInfo } from '../services/mapsService';
import { MapPin, Navigation, ShieldCheck, Phone, CheckCircle, Info, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MapView = ({ ngos = [], selectedNgo = null, onSelectNgo, userLocation = null }) => {
  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [apiAvailable, setApiAvailable] = useState(true);
  const [routeData, setRouteData] = useState(null);
  const [activeNgoCard, setActiveNgoCard] = useState(selectedNgo);
  const navigate = useNavigate();

  useEffect(() => {
    setActiveNgoCard(selectedNgo);
  }, [selectedNgo]);

  useEffect(() => {
    let map = null;

    loadGoogleMaps()
      .then((maps) => {
        if (!mapRef.current) return;
        setApiAvailable(true);

        const center = userLocation || { lat: 18.5204, lng: 73.8567 }; // Pune default

        map = new maps.Map(mapRef.current, {
          center,
          zoom: 12,
          styles: [
            { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }
          ]
        });

        setMapInstance(map);

        // Add Markers for NGOs
        ngos.forEach((ngo) => {
          const marker = new maps.Marker({
            position: ngo.location,
            map,
            title: ngo.name,
            icon: {
              path: maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: ngo.verified ? '#10B981' : '#F59E0B',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#FFFFFF'
            }
          });

          marker.addListener('click', () => {
            if (onSelectNgo) onSelectNgo(ngo);
            setActiveNgoCard(ngo);
          });
        });

        // Add User Location Marker
        if (userLocation) {
          new maps.Marker({
            position: userLocation,
            map,
            title: 'Your Pickup Location',
            icon: {
              path: maps.SymbolPath.BACKWARD_CLOSED_ARROW,
              scale: 6,
              fillColor: '#3B82F6',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#FFFFFF'
            }
          });
        }
      })
      .catch((err) => {
        console.warn('[MapView] Switching to Interactive Demo Canvas Map:', err.message);
        setApiAvailable(false);
      });
  }, [ngos, userLocation]);

  // Route calculation
  useEffect(() => {
    if (activeNgoCard) {
      calculateRouteInfo(userLocation || { lat: 18.5204, lng: 73.8567 }, activeNgoCard.location)
        .then((res) => setRouteData(res));
    }
  }, [activeNgoCard, userLocation]);

  return (
    <div className="w-full h-full min-h-[450px] relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
      
      {/* Live Google Map Container or Fallback Canvas */}
      {apiAvailable ? (
        <div ref={mapRef} className="w-full h-full min-h-[450px]" />
      ) : (
        /* INTERACTIVE DEMO MAP CANVAS FALLBACK */
        <div className="w-full h-full min-h-[450px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white relative p-6 flex flex-col justify-between overflow-hidden">
          
          {/* Top Banner Alert */}
          <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700 p-3 rounded-2xl flex items-center justify-between text-xs z-10 shadow-lg">
            <div className="flex items-center space-x-2">
              <Info className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Map services in demo mode. Configure <code className="text-emerald-300">VITE_GOOGLE_MAPS_API_KEY</code> in <code className="text-emerald-300">.env</code> for Google Maps API rendering.</span>
            </div>
          </div>

          {/* Canvas Interactive Pins */}
          <div className="relative flex-1 my-4 bg-slate-950/50 rounded-2xl border border-slate-800/80 p-4 overflow-hidden flex items-center justify-center">
            
            {/* Simulated Grid Lines */}
            <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-20"></div>

            {/* Donor Marker */}
            <div className="absolute top-1/3 left-1/4 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer z-20">
              <div className="bg-blue-600 text-white p-2.5 rounded-full shadow-xl shadow-blue-600/50 animate-bounce">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow mt-1 whitespace-nowrap">
                📍 Donor Location (Pune)
              </span>
            </div>

            {/* Simulated Route Line */}
            {activeNgoCard && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                <line x1="25%" y1="33%" x2="65%" y2="55%" stroke="#10B981" strokeWidth="4" strokeDasharray="8 6" className="animate-pulse" />
              </svg>
            )}

            {/* NGO Receiver Markers */}
            <div className="absolute top-1/2 left-2/3 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer z-20"
                 onClick={() => { setActiveNgoCard(ngos[0] || selectedNgo); if (onSelectNgo) onSelectNgo(ngos[0]); }}>
              <div className="bg-emerald-500 text-white p-2.5 rounded-full shadow-xl shadow-emerald-500/50 transform group-hover:scale-125 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="bg-emerald-950 text-emerald-200 border border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded shadow mt-1 whitespace-nowrap">
                ✓ {ngos[0]?.name || 'Helping Hands NGO'} (2.4 km)
              </span>
            </div>

            {/* Second NGO Pin */}
            <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer z-20"
                 onClick={() => { setActiveNgoCard(ngos[1] || selectedNgo); if (onSelectNgo) onSelectNgo(ngos[1]); }}>
              <div className="bg-teal-500 text-white p-2 rounded-full shadow-lg shadow-teal-500/50">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="bg-slate-900 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded shadow mt-1 whitespace-nowrap">
                {ngos[1]?.name || 'Food Relief Foundation'} (5.1 km)
              </span>
            </div>

          </div>

        </div>
      )}

      {/* OVERLAY NGO INFO CARD & ROUTE DETAILS */}
      {activeNgoCard && (
        <div className="absolute bottom-4 left-4 right-4 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl animate-in slide-in-from-bottom-4 duration-300 max-w-lg mx-auto">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {activeNgoCard.name}
                </h3>
                {activeNgoCard.verified && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full flex items-center">
                    ✓ Verified NGO
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-600" /> {activeNgoCard.area}, {activeNgoCard.city} • {activeNgoCard.distanceKm} km away
              </p>
            </div>
            
            <button
              onClick={() => navigate(`/ngo/${activeNgoCard.id || activeNgoCard.ngoId}`)}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center"
            >
              VIEW PROFILE <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          {/* Route info strip */}
          {routeData && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
              <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300 font-semibold">
                <Navigation className="w-4 h-4 text-blue-500" />
                <span>Donor ➔ Route ➔ Receiver: <strong>{routeData.distanceText}</strong> ({routeData.durationText})</span>
              </div>
              <span className="font-bold text-red-600 text-[10px] bg-red-50 dark:bg-red-950 px-2 py-0.5 rounded-full">
                HIGH PRIORITY
              </span>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default MapView;
