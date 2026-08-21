import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../services/mapsService';
import { MapPin, ShieldCheck, Info, Sparkles } from 'lucide-react';

const MapView = ({ ngos = [], selectedNgo = null, onSelectNgo, userLocation = null, orgNgoId = null }) => {
  const mapRef = useRef(null);
  const [apiAvailable, setApiAvailable] = useState(true);

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

        // Add Markers for NGOs
        ngos.forEach((ngo) => {
          const isOwnHub = orgNgoId && ngo.id === orgNgoId;
          const isSurplusClaimant = Boolean(ngo.wantsSurplus);

          let fillColor = ngo.verified ? '#10B981' : '#F59E0B';
          let scale = 10;

          if (isOwnHub) {
            fillColor = '#F59E0B';
            scale = 14;
          } else if (isSurplusClaimant) {
            fillColor = '#8B5CF6'; // Violet for surplus claimant
            scale = 14;
          }

          new maps.Marker({
            position: ngo.location,
            map,
            title: isOwnHub
              ? `${ngo.name} (Your Hub)`
              : isSurplusClaimant
              ? `🎯 ${ngo.name} (Wants Your Surplus)`
              : ngo.name,
            icon: {
              path: maps.SymbolPath.CIRCLE,
              scale,
              fillColor,
              fillOpacity: 1,
              strokeWeight: isSurplusClaimant || isOwnHub ? 3 : 2,
              strokeColor: '#FFFFFF'
            }
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

        // If a specific NGO is selected, pan to it
        if (selectedNgo?.location) {
          map.panTo(selectedNgo.location);
          map.setZoom(14);
        }
      })
      .catch((err) => {
        console.warn('[MapView] Switching to Interactive Demo Canvas Map:', err.message);
        setApiAvailable(false);
      });
  }, [ngos, userLocation, selectedNgo]);

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
              <span>Map rendering mode. Configure <code className="text-emerald-300">VITE_GOOGLE_MAPS_API_KEY</code> in <code className="text-emerald-300">.env</code> for Google Maps API.</span>
            </div>
          </div>

          {/* Canvas Pins */}
          <div className="relative flex-1 my-4 bg-slate-950/50 rounded-2xl border border-slate-800/80 p-4 overflow-hidden flex items-center justify-center">
            
            {/* Simulated Grid Lines */}
            <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-20"></div>

            {/* Donor Marker */}
            <div className="absolute top-1/3 left-1/4 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20">
              <div className="bg-blue-600 text-white p-2.5 rounded-full shadow-xl shadow-blue-600/50 animate-bounce">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow mt-1 whitespace-nowrap">
                📍 Your Location (Pune)
              </span>
            </div>

            {/* NGO Receiver Markers */}
            {ngos[0] && (() => {
              const isOwnHub = orgNgoId && ngos[0].id === orgNgoId;
              const isSurplusClaimant = Boolean(ngos[0].wantsSurplus);

              return (
                <div className="absolute top-1/2 left-2/3 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20">
                  <div className={`text-white p-2.5 rounded-full shadow-xl ${
                    isOwnHub
                      ? 'bg-amber-500 shadow-amber-500/60 ring-2 ring-white'
                      : isSurplusClaimant
                      ? 'bg-violet-600 shadow-violet-600/70 ring-2 ring-white animate-pulse'
                      : 'bg-emerald-500 shadow-emerald-500/50'
                  }`}>
                    {isSurplusClaimant ? <Sparkles className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded shadow mt-1 whitespace-nowrap border ${
                    isOwnHub
                      ? 'bg-amber-950 text-amber-200 border-amber-700'
                      : isSurplusClaimant
                      ? 'bg-violet-950 text-violet-200 border-violet-700'
                      : 'bg-emerald-950 text-emerald-200 border-emerald-800'
                  }`}>
                    {isOwnHub ? '📍 This is you · ' : isSurplusClaimant ? '🎯 Wants Surplus · ' : '✓ '}{ngos[0].name}
                  </span>
                </div>
              );
            })()}

            {/* Second NGO Pin */}
            {ngos[1] && (() => {
              const isOwnHub = orgNgoId && ngos[1].id === orgNgoId;
              const isSurplusClaimant = Boolean(ngos[1].wantsSurplus);

              return (
                <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20">
                  <div className={`text-white p-2 rounded-full shadow-lg ${
                    isOwnHub
                      ? 'bg-amber-500 shadow-amber-500/50 ring-2 ring-white'
                      : isSurplusClaimant
                      ? 'bg-violet-600 shadow-violet-600/70 ring-2 ring-white'
                      : 'bg-teal-500 shadow-teal-500/50'
                  }`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded shadow mt-1 whitespace-nowrap ${
                    isOwnHub ? 'bg-amber-950 text-amber-200' : isSurplusClaimant ? 'bg-violet-950 text-violet-200' : 'bg-slate-900 text-slate-300'
                  }`}>
                    {isOwnHub ? '📍 This is you · ' : isSurplusClaimant ? '🎯 Wants Surplus · ' : ''}{ngos[1].name}
                  </span>
                </div>
              );
            })()}

          </div>

        </div>
      )}

    </div>
  );
};

export default MapView;
