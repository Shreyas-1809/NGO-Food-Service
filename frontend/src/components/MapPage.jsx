import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getStoredDonations, getStoredNgos } from '../services/donationService';
import { calculateDistanceKm } from '../services/mapsService';
import { calculateListingUrgency } from '../utils/urgency';
import { Map as MapIcon, List as ListIcon, MapPin, X, ArrowRight, ShieldCheck, Navigation, Crosshair, AlertCircle } from 'lucide-react';

// Fix Leaflet's default marker icon paths in Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Locate Control
const LocateControl = ({ userLocation, locationError }) => {
  const map = useMap();
  
  const handleLocate = () => {
    if (locationError) {
      alert("Location access denied or unavailable: " + locationError);
      return;
    }
    if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 14, { animate: true });
    } else {
      alert("Fetching location...");
    }
  };

  return (
    <div className="leaflet-top leaflet-right">
      <div className="leaflet-control leaflet-bar mt-2 mr-2 border-none shadow-sm">
        <button 
          onClick={handleLocate}
          className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 w-8 h-8 flex items-center justify-center transition-colors rounded-lg border border-slate-200 dark:border-slate-700"
          title="Locate Me"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const createMarkerIcon = (item, type) => {
  if (type === 'surplus') {
    let color = '#10b981'; // green
    const urgency = calculateListingUrgency(item).level;
    if (urgency === 'HIGH') color = '#ef4444'; // red
    else if (urgency === 'MEDIUM') color = '#eab308'; // yellow
    
    // Package/Box shape
    const markerHtml = `
      <div style="
        background-color: ${color}; 
        width: 18px; 
        height: 18px; 
        border-radius: 4px; 
        border: 2px solid white; 
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `;
    
    return L.divIcon({
      html: markerHtml,
      className: 'custom-leaflet-marker',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      popupAnchor: [0, -9]
    });
  } else {
    // NGO Marker
    let color = item.verified ? '#3b82f6' : '#a855f7'; // blue or purple
    
    // Heart/Building shape (using circular shape for now as building representation)
    const markerHtml = `
      <div style="
        background-color: ${color}; 
        width: 24px; 
        height: 24px; 
        border-radius: 50% 50% 50% 0; 
        transform: rotate(-45deg); 
        border: 2px solid white; 
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `;
    
    return L.divIcon({
      html: markerHtml,
      className: 'custom-leaflet-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 24],
      popupAnchor: [0, -24]
    });
  }
};

const MapPage = ({ user }) => {
  const isOrg = user?.accountType === 'ORGANISATION' || 
                user?.accountType === 'ORGANIZATION' || 
                user?.role === 'ORGANISATION' || 
                user?.role === 'ORGANIZATION' || 
                Boolean(user?.orgName);

  const [showSurplus, setShowSurplus] = useState(true);
  const [showNgos, setShowNgos] = useState(true);
  const [view, setView] = useState('map'); // 'map' | 'list'
  
  const [donations, setDonations] = useState([]);
  const [ngos, setNgos] = useState([]);
  
  const [filteredDonations, setFilteredDonations] = useState([]);
  const [filteredNgos, setFilteredNgos] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [userLocation, setUserLocation] = useState({ lat: 18.5204, lng: 73.8567 }); // Pune default
  const [locationError, setLocationError] = useState(null);
  
  // Filters (Surplus)
  const [radius, setRadius] = useState('All');
  const [category, setCategory] = useState('All');
  const [urgency, setUrgency] = useState('All');
  const [status, setStatus] = useState('All');
  const [minQty, setMinQty] = useState('');

  // Filters (NGO)
  const [ngoCategory, setNgoCategory] = useState('All');
  const [ngoStatus, setNgoStatus] = useState('All');

  // "Best Matches" layer for NGOs
  const [showBestMatches, setShowBestMatches] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.log('lat:', pos.coords.latitude, 'lng:', pos.coords.longitude);
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationError(null);
        },
        (err) => {
          console.log('Location error:', err);
          setLocationError(err.message);
        }
      );
    } else {
      setLocationError("Geolocation is not supported by this browser.");
    }
  }, []);

  useEffect(() => {
    // Load Donations
    let dons = getStoredDonations();
    dons = dons.map(d => ({
      ...d, 
      type: 'surplus',
      location: d.pickupCoords || { lat: 18.5204 + (Math.random()-0.5)*0.1, lng: 73.8567 + (Math.random()-0.5)*0.1 }
    }));
    setDonations(dons);

    // Load NGOs
    let ngosData = getStoredNgos();
    ngosData = ngosData.map(n => ({
      ...n,
      type: 'ngo',
      location: n.location || { lat: 18.5204 + (Math.random()-0.5)*0.1, lng: 73.8567 + (Math.random()-0.5)*0.1 }
    }));
    setNgos(ngosData);
  }, []);

  useEffect(() => {
    // Process Donations
    let resultDons = donations.map(item => ({
      ...item,
      distanceKm: calculateDistanceKm(userLocation, item.location)
    }));

    if (radius !== 'All') {
      const maxDist = parseInt(radius, 10);
      resultDons = resultDons.filter(item => item.distanceKm <= maxDist);
    }
    if (category !== 'All') resultDons = resultDons.filter(item => item.category === category || item.foodType === category);
    if (urgency !== 'All') resultDons = resultDons.filter(item => calculateListingUrgency(item).level === urgency);
    if (status !== 'All') resultDons = resultDons.filter(item => item.status === status);
    if (minQty) resultDons = resultDons.filter(item => item.quantity >= parseInt(minQty, 10));

    setFilteredDonations(resultDons);

    // Process NGOs
    let resultNgos = ngos.map(item => ({
      ...item,
      distanceKm: calculateDistanceKm(userLocation, item.location)
    }));

    if (radius !== 'All') {
      const maxDist = parseInt(radius, 10);
      resultNgos = resultNgos.filter(item => item.distanceKm <= maxDist);
    }
    if (ngoCategory !== 'All') resultNgos = resultNgos.filter(item => (item.foodTypesAccepted || []).includes(ngoCategory) || (item.areasOfSupport || []).includes(ngoCategory));
    if (ngoStatus !== 'All') {
      const isVerified = ngoStatus === 'Verified';
      resultNgos = resultNgos.filter(item => item.verified === isVerified);
    }

    setFilteredNgos(resultNgos);
  }, [donations, ngos, radius, category, urgency, status, minQty, ngoCategory, ngoStatus, userLocation]);

  const handleNavigate = (item) => {
    const dest = `${item.location.lat},${item.location.lng}`;
    let url = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
    if (!locationError) {
      url += `&origin=${userLocation.lat},${userLocation.lng}`;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const renderItemCard = (item, isPopup = false) => {
    const isSurplus = item.type === 'surplus';
    return (
      <div className={`${isPopup ? 'w-72 -m-4 p-5' : 'p-5 hover:border-emerald-500'} bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors text-slate-900 dark:text-white`}>
        {isPopup && (
           <h3 className="font-bold text-sm leading-tight pr-4 mb-2">
             {item.title || item.name}
           </h3>
        )}
        {!isPopup && (
           <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{item.name || item.title}</h3>
        )}
        
        <div className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
          {item.quantity && (
            <p className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
              {item.quantity} {item.unit}
            </p>
          )}
          {item.distanceKm !== undefined && (
            <p className="flex items-center font-medium">
              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
              ~{item.distanceKm.toFixed(1)} km away
            </p>
          )}
          
          {isSurplus && calculateListingUrgency(item).level !== 'EXPIRED' && (
            <div className="mt-2 pt-1">
              {(() => {
                const urgencyInfo = calculateListingUrgency(item);
                return (
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                    urgencyInfo.level === 'HIGH' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border border-red-200 dark:border-red-800' :
                    urgencyInfo.level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800' :
                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  }`}>
                    {urgencyInfo.level} URGENCY - {urgencyInfo.text}
                  </span>
                );
              })()}
            </div>
          )}
          
          {!isSurplus && item.verified && (
            <div className="mt-2 pt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <ShieldCheck className="w-3 h-3 mr-1" /> VERIFIED PARTNER
              </span>
            </div>
          )}
          
          {!isPopup && !isSurplus && item.city && (
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">{item.description}</p>
          )}
        </div>
        
        {isPopup && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-col space-y-2">
            <button className={`w-full py-2.5 rounded-xl font-bold text-xs transition-colors flex justify-center items-center shadow-sm ${
              isSurplus
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                : 'bg-violet-600 hover:bg-violet-700 text-white'
            }`}>
              {isSurplus ? 'View Details' : 'View Profile'}
              <ArrowRight className="w-3 h-3 ml-1.5" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleNavigate(item); }}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors flex justify-center items-center shadow-sm"
            >
              <Navigation className="w-3 h-3 mr-1.5" />
              Navigate
            </button>
          </div>
        )}
      </div>
    );
  };

  const hasNoResults = (showSurplus && filteredDonations.length === 0) || (showNgos && filteredNgos.length === 0);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Header & Toggles */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Contextual Map
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Discover local surplus and verified NGOs around you.
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Layer Visibility Toggles */}
          <div className="flex items-center space-x-2 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
            <label className={`cursor-pointer px-3 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center ${
                showSurplus ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}>
              <input type="checkbox" checked={showSurplus} onChange={e => setShowSurplus(e.target.checked)} className="hidden" />
              <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500 mr-1.5 border border-emerald-600"></div>
              Show Surplus
            </label>
            <label className={`cursor-pointer px-3 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center ${
                showNgos ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}>
              <input type="checkbox" checked={showNgos} onChange={e => setShowNgos(e.target.checked)} className="hidden" />
              <div className="w-2.5 h-2.5 rounded-full bg-violet-500 mr-1.5 border border-violet-600" style={{ transform: 'rotate(-45deg)', borderRadius: '50% 50% 50% 0' }}></div>
              Show NGOs
            </label>
          </div>

          <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setView('list')}
              className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
              title="List View"
            >
              <ListIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setView('map')}
              className={`p-2 rounded-lg transition-all ${view === 'map' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
              title="Map View"
            >
              <MapIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Warning if no results */}
      {hasNoResults && (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-xl flex items-center text-sm">
          <AlertCircle className="w-4 h-4 mr-2" />
          {showSurplus && filteredDonations.length === 0 && showNgos && filteredNgos.length === 0 
            ? "No surplus or NGOs match your current filters." 
            : showSurplus && filteredDonations.length === 0 
              ? "No surplus matches your filters." 
              : "No NGOs match your filters."}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
        
        <div className="flex items-center mb-1 border-b border-slate-100 dark:border-slate-700 pb-2">
           <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-4">Global Filter</span>
           <select value={radius} onChange={e => setRadius(e.target.value)} className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500">
             <option value="All">Radius: All</option>
             <option value="1">1 km</option>
             <option value="5">5 km</option>
             <option value="10">10 km</option>
             <option value="25">25 km</option>
           </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Surplus Filters */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Surplus Filters</span>
            <div className="grid grid-cols-2 gap-2">
              <select value={category} onChange={e => setCategory(e.target.value)} className="px-2 py-1.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-none">
                <option value="All">Category: All</option>
                <option value="Cooked Food">Cooked Food</option>
                <option value="Raw Produce">Raw Produce</option>
                <option value="Packaged">Packaged</option>
              </select>
              <select value={urgency} onChange={e => setUrgency(e.target.value)} className="px-2 py-1.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-none">
                <option value="All">Urgency: All</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              <select value={status} onChange={e => setStatus(e.target.value)} className="px-2 py-1.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-none">
                <option value="All">Status: All</option>
                <option value="AVAILABLE">Available</option>
                <option value="CLAIMED">Claimed</option>
              </select>
              <input 
                type="number" 
                placeholder="Min Qty"
                value={minQty}
                onChange={e => setMinQty(e.target.value)}
                className="px-2 py-1.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
              />
            </div>
            {isOrg && (
               <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 pt-1">
                 <input type="checkbox" checked={showBestMatches} onChange={e => setShowBestMatches(e.target.checked)} className="rounded text-emerald-600 focus:ring-emerald-500" />
                 <span>Show Best Matches (Highlight)</span>
               </label>
            )}
          </div>

          {/* NGO Filters */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-violet-600 dark:text-violet-400">NGO Filters</span>
            <div className="grid grid-cols-2 gap-2">
              <select value={ngoCategory} onChange={e => setNgoCategory(e.target.value)} className="px-2 py-1.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-none">
                <option value="All">Accepts: All</option>
                <option value="Cooked Food">Accepts Cooked Food</option>
                <option value="Raw Grains">Accepts Raw Grains</option>
              </select>
              <select value={ngoStatus} onChange={e => setNgoStatus(e.target.value)} className="px-2 py-1.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-none">
                <option value="All">Status: All</option>
                <option value="Verified">Verified Partner</option>
                <option value="Unverified">Unverified</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Map or List */}
      <div className="relative w-full h-[600px] bg-slate-100 dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700">
        {view === 'map' ? (
          <MapContainer 
            center={[userLocation.lat, userLocation.lng]} 
            zoom={12} 
            className="w-full h-full z-0"
          >
            <LocateControl userLocation={userLocation} locationError={locationError} />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {showSurplus && filteredDonations.map(item => (
              <Marker 
                key={`surplus-${item.id}`} 
                position={[item.location.lat, item.location.lng]}
                icon={createMarkerIcon(item, 'surplus')}
              >
                <Popup className="foodbridge-custom-popup">
                  {renderItemCard(item, true)}
                </Popup>
              </Marker>
            ))}
            {showNgos && filteredNgos.map(item => (
              <Marker 
                key={`ngo-${item.id}`} 
                position={[item.location.lat, item.location.lng]}
                icon={createMarkerIcon(item, 'ngo')}
              >
                <Popup className="foodbridge-custom-popup">
                  {renderItemCard(item, true)}
                </Popup>
              </Marker>
            ))}
            {/* Current Location Marker */}
            {!locationError && userLocation.lat !== 18.5204 && (
              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={L.divIcon({
                  html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
                  className: 'custom-leaflet-marker',
                  iconSize: [16, 16],
                  iconAnchor: [8, 8]
                })}
              >
                <Popup>You are here</Popup>
              </Marker>
            )}
          </MapContainer>
        ) : (
          <div className="p-6 overflow-y-auto h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {showSurplus && filteredDonations.map(item => <React.Fragment key={`list-surplus-${item.id}`}>{renderItemCard(item, false)}</React.Fragment>)}
            {showNgos && filteredNgos.map(item => <React.Fragment key={`list-ngo-${item.id}`}>{renderItemCard(item, false)}</React.Fragment>)}
          </div>
        )}

        {/* Legend */}
        {view === 'map' && (
          <div className="absolute bottom-6 left-6 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 z-[400] text-xs max-w-sm">
            <h4 className="font-bold mb-3 border-b pb-1 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">Map Legend</h4>
            
            <div className="grid grid-cols-2 gap-4">
              {showSurplus && (
                <div>
                  <h5 className="font-bold text-[10px] uppercase text-emerald-600 dark:text-emerald-400 mb-1.5">Surplus (Square)</h5>
                  <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
                    <li className="flex items-center">
                      <div className="w-3 h-3 rounded-sm bg-red-500 mr-2 border border-slate-200"></div> High
                    </li>
                    <li className="flex items-center">
                      <div className="w-3 h-3 rounded-sm bg-yellow-500 mr-2 border border-slate-200"></div> Medium
                    </li>
                    <li className="flex items-center">
                      <div className="w-3 h-3 rounded-sm bg-green-500 mr-2 border border-slate-200"></div> Low/Fresh
                    </li>
                  </ul>
                </div>
              )}
              
              {showNgos && (
                <div>
                  <h5 className="font-bold text-[10px] uppercase text-violet-600 dark:text-violet-400 mb-1.5">NGOs (Pin)</h5>
                  <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
                    <li className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 mr-2 border border-slate-200" style={{ borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)' }}></div> Verified
                    </li>
                    <li className="flex items-center">
                      <div className="w-3 h-3 bg-purple-500 mr-2 border border-slate-200" style={{ borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)' }}></div> Unverified
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default MapPage;
