import React, { useEffect, useRef, useState, useMemo } from 'react';
import { loadGoogleMaps, calculateRouteInfo } from '../services/mapsService';
import { MapPin, Navigation, Building2, Truck, AlertCircle, Radio } from 'lucide-react';

const isValidCoord = (lat, lng) =>
  Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

const hasRealCoords = (coords) =>
  Boolean(coords) &&
  typeof coords === 'object' &&
  isValidCoord(coords.lat, coords.lng) &&
  !(Math.abs(Number(coords.lat)) < 1e-6 && Math.abs(Number(coords.lng)) < 1e-6);

const TrackingMapView = ({ donation }) => {
  const mapRef = useRef(null);
  const [apiAvailable, setApiAvailable] = useState(true);
  const [routeStats, setRouteStats] = useState(null);

  const donorCoords = hasRealCoords(donation?.pickupCoords) ? donation.pickupCoords : null;
  const ngoCoords = hasRealCoords(donation?.ngoCoords) ? donation.ngoCoords : null;

const rawVolLoc = donation?.volunteerLiveLocation;
const volunteerCoords = useMemo(() => (
    hasRealCoords(rawVolLoc)
      ? { lat: Number(rawVolLoc.lat), lng: Number(rawVolLoc.lng) }
      : null
  ), [rawVolLoc]);

  // Real-time ticking clock for "Last updated Xs ago" / "Location paused"
  const [nowTick, setNowTick] = useState(Date.now());
  useEffect(() => {
    if (!rawVolLoc) return;
    const interval = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [rawVolLoc]);

  const receivedAtTime = rawVolLoc?.updatedAt ? Date.parse(rawVolLoc.updatedAt) : null;
  const secondsSinceUpdate = receivedAtTime ? Math.max(0, Math.round((nowTick - receivedAtTime) / 1000)) : null;
  const isLocationPaused = secondsSinceUpdate !== null && secondsSinceUpdate > 60;

  const hasVolunteerAssignment = Boolean(
    donation?.assignedVolunteer ||
    (Array.isArray(donation?.volunteerAssignments) && donation.volunteerAssignments.length > 0)
  );

  useEffect(() => {
    if (donorCoords && ngoCoords) {
      calculateRouteInfo(donorCoords, ngoCoords)
        .then(res => setRouteStats(res))
        .catch(() => setRouteStats(null));
    } else {
      setRouteStats(null);
    }
  }, [donorCoords, ngoCoords]);

  useEffect(() => {
    let map = null;

    loadGoogleMaps()
      .then((maps) => {
        if (!mapRef.current) return;
        setApiAvailable(true);

        const bounds = new maps.LatLngBounds();
        let validPoints = 0;

        if (donorCoords) {
          bounds.extend(donorCoords);
          validPoints++;
        }
        if (ngoCoords) {
          bounds.extend(ngoCoords);
          validPoints++;
        }
        if (volunteerCoords) {
          bounds.extend(volunteerCoords);
          validPoints++;
        }

        const centerPoint = donorCoords || ngoCoords || volunteerCoords || { lat: 20.5937, lng: 78.9629 };

        map = new maps.Map(mapRef.current, {
          center: centerPoint,
          zoom: validPoints > 0 ? 13 : 4,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          styles: [
            { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }
          ]
        });

        if (validPoints > 1) {
          map.fitBounds(bounds, 50);
        }

        // 1. Donor Marker (??) — only if real saved coordinates exist
        if (donorCoords) {
          new maps.Marker({
            position: donorCoords,
            map,
            title: `Donor: ${donation?.pickupLocation || 'Donor Location'}`,
            icon: {
              path: maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#10B981',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#FFFFFF'
            }
          });
        }

        // 2. NGO Marker (??) — only if real saved coordinates exist
        if (ngoCoords) {
          new maps.Marker({
            position: ngoCoords,
            map,
            title: `Receiver NGO: ${donation?.matchedNgoName || 'Verified NGO'}`,
            icon: {
              path: maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#8B5CF6',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#FFFFFF'
            }
          });
        }

        // 3. Volunteer Marker (??) — strictly only if real GPS update has arrived
        if (volunteerCoords) {
          new maps.Marker({
            position: volunteerCoords,
            map,
            title: `Volunteer: ${donation?.assignedVolunteer?.name || 'Assigned Driver'} (${isLocationPaused ? 'Location paused' : `Updated ${secondsSinceUpdate ?? 0}s ago`})`,
            icon: {
              path: maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 6,
              fillColor: isLocationPaused ? '#60708b' : '#F97316',
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
  }, [
	donation?.id,
	donation?.status,
	donorCoords,
	ngoCoords,
	isLocationPaused,
	secondsSinceUpdate,
	donation.assignedVolunteer.name,
	donation.pickupLocation,
	donation.matchedNgoName,
	volunteerCoords
]);

  return (
    <div className="w-full h-full min-h-[420px] relative rounded-3xl overflow-hidden border border-[#E5E1D8] dark:border-[#1E2D52] bg-[#173B78] flex flex-col shadow-sm">
      
      {/* Real-time status / warning overlays */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-none max-w-[calc(100%-1.5rem)]">
        {!donorCoords && (
          <div className="pointer-events-auto bg-[#173B78]/90 border border-[#1E293B]/80 text-[#18315E] px-3 py-1.5 rounded-xl text-[11px] font-bold shadow-lg flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-[#E5B85C] shrink-0" />
            <span>Donor pickup coordinates not saved.</span>
          </div>
        )}
        {!ngoCoords && (
          <div className="pointer-events-auto bg-[#173B78]/90 border border-[#1E293B]/80 text-[#18315E] px-3 py-1.5 rounded-xl text-[11px] font-bold shadow-lg flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-[#E5B85C] shrink-0" />
            <span>NGO coordinates not saved.</span>
          </div>
        )}
        {hasVolunteerAssignment && !volunteerCoords && (
          <div className="pointer-events-auto bg-[#173B78]/95 border border-[#1E293B] text-[#60708B] px-3 py-1.5 rounded-xl text-[11px] font-bold shadow-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#173B78] animate-pulse shrink-0"></span>
            <span>Waiting for volunteer location...</span>
          </div>
        )}
        {volunteerCoords && (
          <div className="pointer-events-auto bg-[#173B78]/95 border border-[#1E293B] px-3 py-1.5 rounded-xl text-[11px] font-bold shadow-lg flex items-center gap-2 text-white">
            <Radio className={`w-3.5 h-3.5 ${isLocationPaused ? 'text-[#E5B85C]' : 'text-[#E5B85C] animate-pulse'}`} />
            <span>
              Volunteer: {isLocationPaused ? (
                <span className="text-[#E5B85C] font-extrabold">Location paused</span>
              ) : (
                <span className="text-[#E5B85C] font-extrabold">Last updated {secondsSinceUpdate ?? 0}s ago</span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Live Google Map Container OR Functional Logistics Canvas */}
      {apiAvailable ? (
        <div ref={mapRef} className="w-full h-full min-h-[420px]" />
      ) : (
        /* FUNCTIONAL LOGISTICS CANVAS */
        <div className="w-full h-full min-h-[420px] bg-[#173B78] text-[#18315E] relative p-5 flex flex-col justify-between overflow-hidden">
          
          {/* Top Status Bar */}
          <div className="bg-[#173B78]/90 border border-[#1E293B] px-4 py-2.5 rounded-2xl flex items-center justify-between text-xs z-10 backdrop-blur-xs">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#173B78] animate-pulse"></span>
              <span className="font-bold text-[#18315E]">
                Logistics Route: <span className="text-[#E5B85C]">Donor Pickup</span> → <span className="text-[#E5B85C]">Receiver NGO Hub</span>
              </span>
            </div>
            <span className="text-[11px] bg-[#173B78] text-[#60708B] px-2.5 py-1 rounded-lg font-mono font-bold">
              {routeStats ? routeStats.durationText : (donorCoords && ngoCoords ? 'Direct Route' : 'Coordinates Pending')}
            </span>
          </div>

          {/* Logistics Routing Area */}
          <div className="relative flex-1 my-4 bg-[#173B78]/50 rounded-2xl border border-[#1E293B]/80 p-4 flex items-center justify-center">
            
            {/* SVG Connecting Paths */}
            {donorCoords && ngoCoords && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                <line
                  x1="30%" y1="50%"
                  x2="70%" y2="50%"
                  stroke="#10B981"
                  strokeWidth="3"
                  strokeDasharray="6 6"
                />
              </svg>
            )}

            {/* NODE 1: ?? DONOR PICKUP */}
            <div className="absolute top-1/2 left-[30%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20">
              <div className={`w-11 h-11 rounded-2xl ${donorCoords ? 'bg-[#173B78]' : 'bg-[#173B78]'} text-white flex items-center justify-center shadow-lg border-2 border-white`}>
                <MapPin className="w-5 h-5" />
              </div>
              <div className="mt-2 text-center bg-[#173B78]/90 border border-[#1E293B] px-3 py-1 rounded-xl text-[11px] shadow-sm">
                <span className="text-[#E5B85C] font-extrabold block">Donor Pickup</span>
                <span className="text-[#60708B] text-[10px] max-w-[140px] truncate block">
                  {donorCoords ? (donation?.pickupLocation || 'Donor Address') : 'Coordinates Missing'}
                </span>
              </div>
            </div>

            {/* NODE 2: ?? RECEIVER NGO */}
            <div className="absolute top-1/2 left-[70%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20">
              <div className={`w-11 h-11 rounded-2xl ${ngoCoords ? 'bg-[#E5B85C]' : 'bg-[#173B78]'} text-white flex items-center justify-center shadow-lg border-2 border-white`}>
                <Building2 className="w-5 h-5" />
              </div>
              <div className="mt-2 text-center bg-[#173B78]/90 border border-[#1E293B] px-3 py-1 rounded-xl text-[11px] shadow-sm">
                <span className="text-[#E5B85C] font-extrabold block">Receiver NGO</span>
                <span className="text-[#60708B] text-[10px] max-w-[140px] truncate block">
                  {ngoCoords ? (donation?.matchedNgoName || 'Helping Hands') : 'Coordinates Missing'}
                </span>
              </div>
            </div>

            {/* NODE 3: ?? VOLUNTEER (if real GPS exists) */}
            {volunteerCoords && (
              <div className="absolute top-1/2 left-[50%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-30">
                <div className={`w-11 h-11 rounded-2xl ${isLocationPaused ? 'bg-[#173B78]' : 'bg-[#E5B85C]'} text-white flex items-center justify-center shadow-lg border-2 border-white`}>
                  <Truck className="w-5 h-5" />
                </div>
                <div className="mt-2 text-center bg-[#173B78]/95 border border-[#1E293B] px-3 py-1 rounded-xl text-[11px] shadow-sm">
                  <span className={`${isLocationPaused ? 'text-[#E5B85C]' : 'text-[#E5B85C]'} font-extrabold block`}>
                    {isLocationPaused ? 'Location Paused' : `Updated ${secondsSinceUpdate ?? 0}s ago`}
                  </span>
                  <span className="text-[#60708B] text-[10px] max-w-[140px] truncate block">
                    {donation?.assignedVolunteer?.name || 'Volunteer Rider'}
                  </span>
                </div>
              </div>
            )}

          </div>

          {/* Bottom Route Strip */}
          {routeStats && (
            <div className="bg-[#173B78]/90 border border-[#1E293B] rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs z-10 text-[#60708B]">
              <div className="flex items-center space-x-2">
                <Navigation className="w-4 h-4 text-[#E5B85C]" />
                <span>Direct Distance: <strong className="text-white">{routeStats.totalKm || routeStats.distanceText} km</strong></span>
              </div>
              <div className="flex items-center space-x-3">
                <span>Estimated Travel: <strong className="text-[#E5B85C]">{routeStats.durationText}</strong></span>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default TrackingMapView;









