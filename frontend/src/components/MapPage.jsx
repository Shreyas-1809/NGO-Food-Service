import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import axios from 'axios';
import { io } from 'socket.io-client';
import { calculateDistanceKm } from '../services/mapsService';
import { calculateListingUrgency } from '../utils/urgency';
import { Map as MapIcon, List as ListIcon, MapPin, X, ArrowRight, ShieldCheck, Navigation, Crosshair, AlertCircle, Truck, MapPinOff } from 'lucide-react';
import { T, useTranslatedString } from '../context/LanguageContext';
import ErrorBoundary from './ErrorBoundary';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default marker icon paths in Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: icon,
  shadowUrl: iconShadow
});

// Coordinate validation and extraction
import { MOCK_INITIAL_DONATIONS, MOCK_DONORS } from '../services/mockData';
import { fetchNGOs } from '../services/ngoDirectoryService';

export const isValidCoord = (lat, lng) => Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

export const getCoords = (item) => {
  if (!item) return null;
  // If item itself has lat/lng
  if (item.lat !== undefined && item.lng !== undefined && isValidCoord(item.lat, item.lng)) {
    return { lat: Number(item.lat), lng: Number(item.lng) };
  }
  if (item.latitude !== undefined && item.longitude !== undefined && isValidCoord(item.latitude, item.longitude)) {
    return { lat: Number(item.latitude), lng: Number(item.longitude) };
  }
  
  // Extract from location or pickupCoords
  const loc = item.location || item.pickupCoords || item;
  if (!loc) return null;
  
  if (loc.coordinates && loc.coordinates.length >= 2 && isValidCoord(loc.coordinates[1], loc.coordinates[0])) {
    return { lat: Number(loc.coordinates[1]), lng: Number(loc.coordinates[0]) };
  }
  if (loc.lat !== undefined && loc.lng !== undefined && isValidCoord(loc.lat, loc.lng)) {
    return { lat: Number(loc.lat), lng: Number(loc.lng) };
  }
  if (loc.latitude !== undefined && loc.longitude !== undefined && isValidCoord(loc.latitude, loc.longitude)) {
    return { lat: Number(loc.latitude), lng: Number(loc.longitude) };
  }
  if (Array.isArray(loc) && loc.length >= 2 && isValidCoord(loc[0], loc[1])) {
    return { lat: Number(loc[0]), lng: Number(loc[1]) };
  }
  return null;
};

// Bounds Updater
const BoundsUpdater = ({ markers }) => {
  const map = useMap();
  useEffect(() => {
    if (markers && markers.length > 0) {
      const bounds = L.latLngBounds(markers);
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [markers, map]);
  return null;
};

// Auto-resize Map when container size changes
const MapUpdater = () => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const timer = setTimeout(() => map.invalidateSize(), 250);
    return () => clearTimeout(timer);
  }, [map]);
  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);
  return null;
};

const userIcon = L.divIcon({
  className: 'user-location-marker',
  html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg relative"><div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75"></div></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

// Custom Locate Control
const LocateControl = ({ userLocation, locationError }) => {
  const map = useMap();
  
  const handleLocate = () => {
    if (locationError) {
      alert("Location access denied or unavailable: " + locationError);
      return;
    }
    if (userLocation && isValidCoord(userLocation.lat, userLocation.lng)) {
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

const MapEffect = ({ view }) => {
  const map = useMap();
  useEffect(() => {
    if (view === 'map') {
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  }, [view, map]);
  return null;
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
    return L.divIcon({ html: markerHtml, className: 'custom-leaflet-marker', iconSize: [18, 18], iconAnchor: [9, 9], popupAnchor: [0, -9] });
  } else if (type === 'ngo') {
    // NGO Marker
    let color = '#a855f7'; // purple
    const iType = (item.type || '').toLowerCase();
    const iName = (item.name || '').toLowerCase();
    
    if (iType === 'orphanage' || iName.includes('orphanage')) color = '#f97316'; // orange
    else if (iType === 'shelter' || iName.includes('shelter') || iName.includes('old age') || iName.includes('vriddhashram')) color = '#14b8a6'; // teal
    else if (iType === 'food bank' || iType === 'community kitchen' || iName.includes('kitchen')) color = '#10b981'; // green
    
    // Heart/Building shape
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
    return L.divIcon({ html: markerHtml, className: 'custom-leaflet-marker', iconSize: [24, 24], iconAnchor: [12, 24], popupAnchor: [0, -24] });
  } else if (type === 'donor') {
    let color = '#9ca3af'; // grey for donors with no active listing
    let animate = false;
    if (item.hasActiveListing) {
      color = '#10b981'; // green for active listing
      if (item.isUrgent) {
        animate = true; // pulsing if urgent
      }
    }
    const markerHtml = `
      <div style="
        background-color: ${color}; 
        width: 20px; 
        height: 20px; 
        border-radius: 50%; 
        border: 2px solid white; 
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        position: relative;
      ">
        ${animate ? `<div class="absolute inset-0 rounded-full animate-ping opacity-75" style="background-color: ${color};"></div>` : ''}
      </div>
    `;
    return L.divIcon({ html: markerHtml, className: 'custom-leaflet-marker', iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -10] });
  }
  return L.Icon.Default;
};

// Volunteer location marker (truck icon)
const createVolunteerIcon = () => {
  const markerHtml = `
    <div style="
      background-color: #f97316;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    "><span style="font-size: 14px;">🚚</span></div>
  `;
  return L.divIcon({
    html: markerHtml,
    className: 'custom-leaflet-marker volunteer-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
};

const MapPage = ({ user }) => {
  const isOrg = user?.accountType === 'ORGANISATION' || 
                user?.accountType === 'ORGANIZATION' || 
                user?.role === 'ORGANISATION' || 
                user?.role === 'ORGANIZATION' || 
                Boolean(user?.orgName);

  const isDonorUser = user?.accountType === 'DONOR' || user?.role === 'DONOR';
  const isVolunteerUser = user?.accountType === 'VOLUNTEER' || user?.role === 'VOLUNTEER';

  const [showSurplus, setShowSurplus] = useState(true);
  const [showNgos, setShowNgos] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [showDonors, setShowDonors] = useState(true);
  const [showVolunteers, setShowVolunteers] = useState(true);
  const [view, setView] = useState('map'); // 'map' | 'list'
  
  // Helper to determine if an NGO item is a shelter/orphanage
  const isShelterOrOrphanage = (item) => {
    const iType = (item.type || '').toLowerCase();
    const iName = (item.name || '').toLowerCase();
    return iType === 'orphanage' || iName.includes('orphanage') || 
           iType === 'shelter' || iName.includes('shelter') || 
           iName.includes('old age') || iName.includes('vriddhashram');
  };
  
  // Live volunteer locations: { [taskId]: { lat, lng, volunteerName, timestamp } }
  const [volunteerLocations, setVolunteerLocations] = useState({});
  const socketRef = useRef(null);

  // Theme detection for map tiles
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const [donations, setDonations] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filteredDonations, setFilteredDonations] = useState([]);
  const [filteredNgos, setFilteredNgos] = useState([]);
  const [filteredDonors, setFilteredDonors] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [userLocation, setUserLocation] = useState({ lat: 18.5204, lng: 73.8567 }); // Pune default
  const [locationError, setLocationError] = useState(null);
  
  // Filters (Surplus)
  const tCatAll = useTranslatedString('category.all') || 'All';
  const tCatVeg = useTranslatedString('category.veg') || 'Veg';
  const tCatNonVeg = useTranslatedString('category.non_veg') || 'Non-Veg';
  const tCatRaw = useTranslatedString('category.raw_produce') || 'Raw Produce';
  const tCatBaked = useTranslatedString('category.baked_goods') || 'Baked Goods';

  const [radius, setRadius] = useState('All');
  const [category, setCategory] = useState('all');
  const [urgency, setUrgency] = useState('All');
  const [status, setStatus] = useState('All');
  const [minQty, setMinQty] = useState('');

  // Filters (NGO)
  const [ngoCategory, setNgoCategory] = useState('All');
  const [ngoStatus, setNgoStatus] = useState('All');

  const visibleCoords = useMemo(() => {
    const coords = [];
    if (showSurplus && (isOrg || isVolunteerUser)) {
      filteredDonations.filter(i => i.location && isValidCoord(i.location.lat, i.location.lng)).forEach(i => coords.push([i.location.lat, i.location.lng]));
    }
    if (isDonorUser) {
      filteredDonations.filter(i => i.location && isValidCoord(i.location.lat, i.location.lng) && (i.donorId === user?.id || i.donorId?._id === user?.id)).forEach(i => coords.push([i.location.lat, i.location.lng]));
    }
    if (showDonors && (isOrg || isVolunteerUser)) {
      filteredDonors.filter(i => i.location && isValidCoord(i.location.lat, i.location.lng)).forEach(i => coords.push([i.location.lat, i.location.lng]));
    }
    if ((isDonorUser || isVolunteerUser) || isOrg) {
      filteredNgos.filter(item => {
        if (!item.location || !isValidCoord(item.location.lat, item.location.lng)) return false;
        if (isOrg) return item.id === user?.id || item._id === user?.id; // NGO only sees their own
        const isShelter = isShelterOrOrphanage(item);
        if (isShelter && !showShelters) return false;
        if (!isShelter && !showNgos) return false;
        return true;
      }).forEach(i => coords.push([i.location.lat, i.location.lng]));
    }
    // Also include user location if available
    if (userLocation && isValidCoord(userLocation.lat, userLocation.lng)) {
      coords.push([userLocation.lat, userLocation.lng]);
    }
    return coords;
  }, [showSurplus, showDonors, showNgos, showShelters, filteredDonations, filteredDonors, filteredNgos, isOrg, isDonorUser, isVolunteerUser, userLocation, user]);

  // "Best Matches" layer for NGOs
  const [showBestMatches, setShowBestMatches] = useState(false);

  // Placeholders & Translations
  const minQtyPlaceholder = useTranslatedString('Min Qty');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationError(null);
        },
        (err) => {
          console.log('Location error:', err);
          setLocationError("Could not access your location.");
        }
      );
    } else {
      setLocationError("Geolocation is not supported by this browser.");
    }
  }, []);

  const handleUseProfileAddress = () => {
    if (user?.location?.coordinates && user.location.coordinates.length === 2) {
      setUserLocation({ lat: user.location.coordinates[1], lng: user.location.coordinates[0] });
      setLocationError(null);
    } else if (user?.location?.lat && user?.location?.lng) {
      setUserLocation({ lat: user.location.lat, lng: user.location.lng });
      setLocationError(null);
    } else {
      setLocationError("No saved location found in your profile.");
    }
  };

  // Socket listener for live volunteer locations
  useEffect(() => {
    const socket = io(API_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('VOLUNTEER_LOCATION', (payload) => {
      if (!payload?.taskId || !payload?.lat || !payload?.lng) return;
      // Only track locations for in-transit tasks
      const activeStatuses = ['IN_TRANSIT', 'en_route', 'picked_up'];
      if (payload.status && !activeStatuses.includes(payload.status)) return;
      setVolunteerLocations(prev => ({
        ...prev,
        [payload.taskId]: {
          lat: payload.lat,
          lng: payload.lng,
          volunteerName: payload.volunteerName || 'Volunteer',
          timestamp: payload.timestamp || Date.now(),
          status: payload.status || 'IN_TRANSIT'
        }
      }));
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        // Fetch surplus food
        const foodRes = await axios.get(`${API_URL}/api/food`, { headers });
        let foodData = foodRes.data && foodRes.data.length > 0 ? foodRes.data : MOCK_INITIAL_DONATIONS;
        
        if (!isMounted) return;
        let dons = foodData.map(d => ({
          ...d, 
          id: d._id || d.id,
          type: 'surplus',
          location: getCoords(d)
        }));
        setDonations(dons);

        // Extract donors from surplus listings, or use MOCK_DONORS
        const uniqueDonors = new Map();
        
        if (foodRes.data && foodRes.data.length > 0) {
          foodRes.data.forEach(item => {
            if (item.donorId && item.donorId._id) {
              const dId = item.donorId._id;
              const isUrgent = calculateListingUrgency(item).level === 'HIGH';
              if (!uniqueDonors.has(dId)) {
                uniqueDonors.set(dId, {
                  id: dId,
                  name: item.donorId.orgName || item.donorId.fullName || 'Donor',
                  verified: true,
                  location: getCoords(item.donorId) || getCoords(item),
                  city: item.donorId.city,
                  address: item.donorId.address,
                  type: 'donor', 
                  hasActiveListing: true,
                  isUrgent: isUrgent
                });
              } else {
                 const existing = uniqueDonors.get(dId);
                 if (isUrgent) existing.isUrgent = true;
              }
            }
          });
        } else {
          // Use MOCK_DONORS
          MOCK_DONORS.forEach(donor => {
             // Check if mock donations have listings for this donor
             const donorListings = foodData.filter(d => d.donorId === donor.id);
             const hasActiveListing = donorListings.length > 0;
             const isUrgent = donorListings.some(d => calculateListingUrgency(d).level === 'HIGH');
             
             uniqueDonors.set(donor.id, {
                ...donor,
                location: getCoords(donor),
                hasActiveListing,
                isUrgent
             });
          });
        }
        
        if (isMounted) {
          setDonors(Array.from(uniqueDonors.values()));
        }

        // Fetch NGOs by extracting from needs, or use DEMO_NGOS
        const needsRes = await axios.get(`${API_URL}/api/needs`, { headers });
        const uniqueNgos = new Map();
        
        if (needsRes.data && needsRes.data.length > 0) {
          needsRes.data.forEach(need => {
            if (need.ngoId && need.ngoId._id) {
              if (!uniqueNgos.has(need.ngoId._id)) {
                uniqueNgos.set(need.ngoId._id, {
                  id: need.ngoId._id,
                  name: need.ngoId.orgName || need.ngoId.fullName || 'NGO',
                  verified: true,
                  location: getCoords(need.ngoId),
                  city: need.ngoId.city,
                  address: need.ngoId.address,
                  phone: need.ngoId.phone,
                  type: 'ngo'
                });
              }
            }
          });
        } else {
           // Use DEMO_NGOS
           const demoNgos = await fetchNGOs();
           demoNgos.forEach(ngo => {
              uniqueNgos.set(ngo.id, {
                 ...ngo,
                 location: getCoords(ngo),
              });
           });
        }
        
        if (isMounted) {
          setNgos(Array.from(uniqueNgos.values()));
        }
      } catch (err) {
        if (isMounted) {
          console.error('Map data fetch error:', err);
          setError('Failed to load map data. Please try again later.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    // Process Donations
    let resultDons = donations.map(item => ({
      ...item,
      distanceKm: item.location && userLocation && isValidCoord(userLocation.lat, userLocation.lng) 
        ? calculateDistanceKm(userLocation, item.location) 
        : undefined
    }));

    if (radius !== 'All') {
      const maxDist = parseInt(radius, 10);
      resultDons = resultDons.filter(item => item.distanceKm !== undefined && item.distanceKm <= maxDist);
    }
    if (category !== 'all') {
      resultDons = resultDons.filter(item => {
        const itemCat = item.category ? item.category.replace('-', '_').replace(' ', '_').toLowerCase() : '';
        const itemType = item.foodType ? item.foodType.replace('-', '_').replace(' ', '_').toLowerCase() : '';
        return itemCat === category || itemType === category;
      });
    }
    if (urgency !== 'All') resultDons = resultDons.filter(item => calculateListingUrgency(item).level === urgency);
    if (status !== 'All') resultDons = resultDons.filter(item => item.status === status);
    if (minQty) resultDons = resultDons.filter(item => item.quantity >= parseInt(minQty, 10));

    
    const skippedDonations = donations.filter(d => !resultDons.some(rd => rd.id === d.id));
    console.log(`[DEV-MAP-LOG] SURPLUS: ${donations.length} loaded, ${resultDons.length} rendered. Skipped: ${skippedDonations.length}.`);
    if (skippedDonations.length > 0) {
      console.log('[DEV-MAP-LOG] SURPLUS SKIPPED REASONS:');
      skippedDonations.forEach(d => {
        let reason = [];
        if (!getCoords(d)) reason.push('Missing/invalid coordinates');
        if (showSurplus === false && !isDonorUser) reason.push('Hidden by toggle (showSurplus is off)');
        if (category !== 'All' && !((d.category || '').toLowerCase() === category.toLowerCase() || (d.foodType || '').toLowerCase() === category.toLowerCase())) reason.push('Filtered by category');
        if (urgency !== 'All' && calculateListingUrgency(d).level !== urgency) reason.push('Filtered by urgency');
        if (status !== 'All' && d.status !== status) reason.push('Filtered by status');
        if (minQty && d.quantity < parseInt(minQty, 10)) reason.push('Filtered by minQty');
        console.log(`  - ${d.id} (${d.title || d.itemName}): ${reason.join(', ')}`);
      });
    }

    setFilteredDonations(resultDons);

    // Process NGOs
    let resultNgos = ngos.map(item => ({
      ...item,
      distanceKm: item.location && userLocation && isValidCoord(userLocation.lat, userLocation.lng) 
        ? calculateDistanceKm(userLocation, item.location) 
        : undefined
    }));

    if (radius !== 'All') {
      const maxDist = parseInt(radius, 10);
      resultNgos = resultNgos.filter(item => item.distanceKm !== undefined && item.distanceKm <= maxDist);
    }
    if (ngoCategory !== 'All') resultNgos = resultNgos.filter(item => (item.foodTypesAccepted || []).includes(ngoCategory) || (item.areasOfSupport || []).includes(ngoCategory));
    if (ngoStatus !== 'All') {
      const isVerified = ngoStatus === 'Verified';
      resultNgos = resultNgos.filter(item => item.verified === isVerified);
    }

    
    const skippedNgos = ngos.filter(n => !resultNgos.some(rn => rn.id === n.id));
    console.log(`[DEV-MAP-LOG] NGOs: ${ngos.length} loaded, ${resultNgos.length} rendered. Skipped: ${skippedNgos.length}.`);
    if (skippedNgos.length > 0) {
      console.log('[DEV-MAP-LOG] NGO SKIPPED REASONS:');
      skippedNgos.forEach(n => {
        let reason = [];
        if (!getCoords(n)) reason.push('Missing/invalid coordinates');
        const isShelter = isShelterOrOrphanage(n);
        if (isShelter && !showShelters) reason.push('Hidden by toggle (showShelters is off)');
        if (!isShelter && !showNgos) reason.push('Hidden by toggle (showNgos is off)');
        if (radius !== 'All' && n.distanceKm > parseInt(radius, 10)) reason.push('Filtered by radius');
        if (ngoCategory !== 'All' && !(n.foodTypesAccepted || []).includes(ngoCategory) && !(n.areasOfSupport || []).includes(ngoCategory)) reason.push('Filtered by category');
        if (ngoStatus !== 'All' && n.verified !== (ngoStatus === 'Verified')) reason.push('Filtered by status');
        console.log(`  - ${n.id} (${n.name}): ${reason.join(', ')}`);
      });
    }

    setFilteredNgos(resultNgos);

    // Process Donors
    let resultDonors = donors.map(item => ({
      ...item,
      distanceKm: item.location && userLocation && isValidCoord(userLocation.lat, userLocation.lng) 
        ? calculateDistanceKm(userLocation, item.location) 
        : undefined
    }));
    if (radius !== 'All') {
      const maxDist = parseInt(radius, 10);
      resultDonors = resultDonors.filter(item => item.distanceKm !== undefined && item.distanceKm <= maxDist);
    }
    
    const skippedDonors = donors.filter(d => !resultDonors.some(rd => rd.id === d.id));
    console.log(`[DEV-MAP-LOG] DONORS: ${donors.length} loaded, ${resultDonors.length} rendered. Skipped: ${skippedDonors.length}.`);
    if (skippedDonors.length > 0) {
      console.log('[DEV-MAP-LOG] DONOR SKIPPED REASONS:');
      skippedDonors.forEach(d => {
        let reason = [];
        if (!getCoords(d)) reason.push('Missing/invalid coordinates');
        if (!showDonors) reason.push('Hidden by toggle (showDonors is off)');
        if (radius !== 'All' && d.distanceKm > parseInt(radius, 10)) reason.push('Filtered by radius');
        console.log(`  - ${d.id} (${d.name}): ${reason.join(', ')}`);
      });
    }

    setFilteredDonors(resultDonors);
  }, [donations, ngos, donors, radius, category, urgency, status, minQty, ngoCategory, ngoStatus, userLocation]);


  const ItemCard = ({ item, isPopup = false }) => {
    const [travelMode, setTravelMode] = useState('driving');
    
    const isSurplus = item.type === 'surplus';
    const isDonor = item.type === 'donor';
    const isNgo = item.type === 'ngo';
    
    const handleNavigation = (e) => {
      e.stopPropagation();
      const dest = `${item.location.lat},${item.location.lng}`;
      let url = `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=${travelMode}`;
      if (item.name || item.title) {
        url += `&destination_place_id=${encodeURIComponent(item.name || item.title)}`;
      }
      if (!locationError && userLocation && isValidCoord(userLocation.lat, userLocation.lng)) {
        url += `&origin=${userLocation.lat},${userLocation.lng}`;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleGoogleMapsLink = (e) => {
      e.stopPropagation();
      const dest = `${item.location.lat},${item.location.lng}`;
      const url = `https://www.google.com/maps/search/?api=1&query=${dest}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
      <div className={`${isPopup ? 'w-72 -m-4 p-5' : 'p-5 hover:border-emerald-500 h-full flex flex-col'} bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors text-slate-900 dark:text-white`}>
        {isPopup && (
           <h3 className="font-bold text-sm leading-tight pr-4 mb-2">
             {item.title || item.name}
           </h3>
        )}
        {!isPopup && (
           <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{item.name || item.title}</h3>
        )}
        
        {isPopup && item.area && (
           <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">{item.area}</p>
        )}
        {isPopup && item.locality && !item.area && (
           <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">{item.locality}</p>
        )}
        
        <div className="mt-2 space-y-1.5 text-xs text-slate-600 dark:text-slate-300 flex-1 flex flex-col">
          {item.quantity && (
            <p className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
              {item.quantity} {item.unit}
            </p>
          )}
          {item.distanceKm !== undefined ? (
            <p className="flex items-center font-medium">
              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
              ~{item.distanceKm.toFixed(1)} km <T text="Distance" />
            </p>
          ) : (
            <p className="flex items-center font-medium text-slate-400">
              <MapPinOff className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
              <T text="Location unavailable" />
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
                    <T text={urgencyInfo.level} /> <T text="URGENCY" /> - <T text={urgencyInfo.text} />
                  </span>
                );
              })()}
            </div>
          )}
          
          {(isNgo || isDonor) && item.verified && (
            <div className="mt-2 pt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <ShieldCheck className="w-3 h-3 mr-1 shrink-0" /> <T text="VERIFIED PARTNER" />
              </span>
            </div>
          )}
          
          {(isNgo || isDonor) && item.description && (
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">{item.description}</p>
          )}
        </div>
        
        <div className={`mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-col space-y-2 ${isPopup ? '' : 'mt-auto'}`}>
          <button className={`w-full py-2.5 rounded-xl font-bold text-xs transition-colors flex justify-center items-center shadow-sm ${
            isSurplus
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
              : isNgo ? 'bg-violet-600 hover:bg-violet-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}>
            {isSurplus ? <T text="Claim Listing" /> : isNgo ? <T text="Donate" /> : <T text="View Profile" />}
            <ArrowRight className="w-3 h-3 ml-1.5 shrink-0" />
          </button>
          
          <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
            <button
              onClick={(e) => { e.stopPropagation(); setTravelMode('driving'); }}
              className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-colors ${travelMode === 'driving' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
            >
              <T text="Driving" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setTravelMode('walking'); }}
              className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-colors ${travelMode === 'walking' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
            >
              <T text="Walking" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setTravelMode('transit'); }}
              className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-colors ${travelMode === 'transit' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
            >
              <T text="Transit" />
            </button>
          </div>

          <button 
            onClick={handleNavigation}
            className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors flex justify-center items-center shadow-sm"
          >
            <Navigation className="w-3 h-3 mr-1.5 shrink-0" />
            <T text="Navigate" />
          </button>
          
          {isPopup && (
            <button 
              onClick={handleGoogleMapsLink}
              className="w-full py-1.5 text-[10px] text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors text-center"
            >
              <T text="Open in Google Maps" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const hasNoResults = (showSurplus && filteredDonations.length === 0) || (showNgos && filteredNgos.length === 0);

  return (
    <div className="w-full max-w-[1400px] h-full flex flex-col mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Header & Toggles */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            <T text="Contextual Map" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            <T text="Discover local surplus and verified NGOs around you." />
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {locationError && (
            <button 
              onClick={handleUseProfileAddress}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/50 dark:text-orange-300 transition-colors flex items-center"
            >
              <MapPinOff className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              <T text="Use Profile Address" />
            </button>
          )}

          {/* Layer Visibility Toggles */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-200 dark:bg-slate-800 p-1.5 rounded-xl">
            {(isOrg || isVolunteerUser) && (
              <label className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center whitespace-nowrap ${
                  showSurplus ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}>
                <input type="checkbox" checked={showSurplus} onChange={e => setShowSurplus(e.target.checked)} className="hidden" />
                <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500 mr-1.5 border border-emerald-600 shrink-0"></div>
                <T text="Show Surplus" />
              </label>
            )}
            {(isOrg || isVolunteerUser) && (
              <label className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center whitespace-nowrap ${
                  showDonors ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}>
                <input type="checkbox" checked={showDonors} onChange={e => setShowDonors(e.target.checked)} className="hidden" />
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-1.5 border border-blue-600 shrink-0"></div>
                <T text="Show Donors" />
              </label>
            )}
            {(isDonorUser || isVolunteerUser) && (
              <label className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center whitespace-nowrap ${
                  showNgos ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}>
                <input type="checkbox" checked={showNgos} onChange={e => setShowNgos(e.target.checked)} className="hidden" />
                <div className="w-2.5 h-2.5 rounded-full bg-violet-500 mr-1.5 border border-violet-600 shrink-0" style={{ transform: 'rotate(-45deg)', borderRadius: '50% 50% 50% 0' }}></div>
                <T text="Show NGOs" />
              </label>
            )}
            {(isDonorUser || isVolunteerUser) && (
              <label className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center whitespace-nowrap ${
                  showShelters ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}>
                <input type="checkbox" checked={showShelters} onChange={e => setShowShelters(e.target.checked)} className="hidden" />
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500 mr-1.5 border border-orange-600 shrink-0" style={{ transform: 'rotate(-45deg)', borderRadius: '50% 50% 50% 0' }}></div>
                <T text="Show Shelters" />
              </label>
            )}
            <label className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center whitespace-nowrap ${
                showVolunteers ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}>
              <input type="checkbox" checked={showVolunteers} onChange={e => setShowVolunteers(e.target.checked)} className="hidden" />
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500 mr-1.5 border border-orange-600 shrink-0"></div>
              <T text="Show Volunteers" />
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

      {loading && (
        <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 px-4 py-2 rounded-xl flex items-center text-sm">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600 mr-2"></div>
          <T text="Loading map data..." />
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-4 py-2 rounded-xl flex items-center justify-between text-sm">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
            <T text={error} />
          </div>
          <button onClick={() => window.location.reload()} className="px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-800/50 rounded-lg font-bold transition-colors">
            <T text="Retry" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-4">
           <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0"><T text="Global Filter" /></span>
           <select value={radius} onChange={e => setRadius(e.target.value)} className="w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer transition-colors">
             <option value="All" className="bg-white dark:bg-slate-800"><T text="Radius: All" /></option>
             <option value="1" className="bg-white dark:bg-slate-800">1 km</option>
             <option value="5" className="bg-white dark:bg-slate-800">5 km</option>
             <option value="10" className="bg-white dark:bg-slate-800">10 km</option>
             <option value="25" className="bg-white dark:bg-slate-800">25 km</option>
           </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Surplus Filters */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider"><T text="Surplus Filters" /></span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer h-10 transition-colors">
                <option value="all" className="bg-white dark:bg-slate-800">Category: {tCatAll}</option>
                <option value="veg" className="bg-white dark:bg-slate-800">{tCatVeg}</option>
                <option value="non_veg" className="bg-white dark:bg-slate-800">{tCatNonVeg}</option>
                <option value="raw_produce" className="bg-white dark:bg-slate-800">{tCatRaw}</option>
                <option value="baked_goods" className="bg-white dark:bg-slate-800">{tCatBaked}</option>
              </select>
              <select value={urgency} onChange={e => setUrgency(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer h-10 transition-colors">
                <option value="All" className="bg-white dark:bg-slate-800"><T text="Urgency: All" /></option>
                <option value="HIGH" className="bg-white dark:bg-slate-800"><T text="High" /></option>
                <option value="MEDIUM" className="bg-white dark:bg-slate-800"><T text="Medium" /></option>
                <option value="LOW" className="bg-white dark:bg-slate-800"><T text="Low" /></option>
              </select>
              <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer h-10 transition-colors">
                <option value="All" className="bg-white dark:bg-slate-800"><T text="Status: All" /></option>
                <option value="AVAILABLE" className="bg-white dark:bg-slate-800"><T text="Available" /></option>
                <option value="CLAIMED" className="bg-white dark:bg-slate-800"><T text="Claimed" /></option>
              </select>
              <input 
                type="number" 
                placeholder={minQtyPlaceholder}
                value={minQty}
                onChange={e => setMinQty(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 h-10 transition-colors"
              />
            </div>
            {isOrg && (
               <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 pt-1 cursor-pointer">
                 <input type="checkbox" checked={showBestMatches} onChange={e => setShowBestMatches(e.target.checked)} className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer" />
                 <span><T text="Show Best Matches (Highlight)" /></span>
               </label>
            )}
          </div>

          {/* NGO Filters */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider"><T text="NGO Filters" /></span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select value={ngoCategory} onChange={e => setNgoCategory(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer h-10 transition-colors">
                <option value="All" className="bg-white dark:bg-slate-800"><T text="Accepts: All" /></option>
                <option value="Cooked Food" className="bg-white dark:bg-slate-800"><T text="Accepts Cooked Food" /></option>
                <option value="Raw Grains" className="bg-white dark:bg-slate-800"><T text="Accepts Raw Grains" /></option>
              </select>
              <select value={ngoStatus} onChange={e => setNgoStatus(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer h-10 transition-colors">
                <option value="All" className="bg-white dark:bg-slate-800"><T text="Status: All" /></option>
                <option value="Verified" className="bg-white dark:bg-slate-800"><T text="Verified Partner" /></option>
                <option value="Unverified" className="bg-white dark:bg-slate-800"><T text="Unverified" /></option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Map or List */}
      {hasNoResults ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[480px] h-[calc(100vh-250px)] bg-slate-100 dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 text-center p-6">
          <MapIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
            {showSurplus && filteredDonations.length === 0 && showNgos && filteredNgos.length === 0 
              ? <T text="No surplus or NGOs match your current filters." />
              : showSurplus && filteredDonations.length === 0 
                ? <T text="No surplus nearby yet." />
                : <T text="No NGOs match your filters." />}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
            <T text="Try adjusting your filters or expanding the search radius." />
          </p>
        </div>
      ) : (
        <div className="relative w-full flex-1 min-h-[480px] h-[calc(100vh-250px)] bg-slate-100 dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700">
        {view === 'map' ? (
          <ErrorBoundary>
            <MapContainer 
              center={userLocation && isValidCoord(userLocation.lat, userLocation.lng) ? [userLocation.lat, userLocation.lng] : [18.5204, 73.8567]} 
              zoom={12} 
              className="w-full h-full z-0"
              whenReady={(e) => { e.target.invalidateSize(); }}
            >
            <MapUpdater visibleCoords={visibleCoords} />
            <LocateControl userLocation={userLocation} locationError={locationError} />
            <TileLayer
              key={isDark ? 'dark' : 'light'}
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              maxZoom={19}
              className={isDark ? 'map-tiles-dark' : ''}
            />
            {/* SURPLUS LISTINGS (NGO sees all if showSurplus; Donor sees ONLY their own) */}
            {((showSurplus && (isOrg || isVolunteerUser)) || isDonorUser) && (
              <MarkerClusterGroup chunkedLoading maxClusterRadius={40}>
                {filteredDonations.filter(item => {
                  if (!item.location || !isValidCoord(item.location.lat, item.location.lng)) return false;
                  if (isDonorUser) return item.donorId === user?.id || item.donorId?._id === user?.id; // Donor only sees their own
                  return true;
                }).map(item => (
                  <Marker 
                    key={`surplus-${item.id}`} 
                    position={[item.location.lat, item.location.lng]}
                    icon={createMarkerIcon(item, 'surplus')}
                  >
                    <Popup className="foodbridge-custom-popup">
                      {isDonorUser && <div className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 text-center rounded-t-md"><T text="Your listing" /></div>}
                      <ItemCard item={item} isPopup={true} />
                    </Popup>
                  </Marker>
                ))}
              </MarkerClusterGroup>
            )}
            
            {/* DONORS (NGO sees all if showDonors) */}
            {showDonors && (isOrg || isVolunteerUser) && (
              <MarkerClusterGroup chunkedLoading maxClusterRadius={40}>
                {filteredDonors.filter(item => item.location && isValidCoord(item.location.lat, item.location.lng)).map(item => (
                  <Marker 
                    key={`donor-${item.id}`} 
                    position={[item.location.lat, item.location.lng]}
                    icon={createMarkerIcon(item, 'donor')}
                  >
                    <Popup className="foodbridge-custom-popup">
                      <ItemCard item={item} isPopup={true} />
                    </Popup>
                  </Marker>
                ))}
              </MarkerClusterGroup>
            )}

            {/* NGOS & SHELTERS (Donor sees all if showNgos/showShelters; NGO sees ONLY themselves) */}
            {((isDonorUser || isVolunteerUser) || isOrg) && (
              <MarkerClusterGroup chunkedLoading maxClusterRadius={40}>
                {filteredNgos.filter(item => {
                  if (!item.location || !isValidCoord(item.location.lat, item.location.lng)) return false;
                  if (isOrg) return item.id === user?.id || item._id === user?.id; // NGO only sees their own
                  const isShelter = isShelterOrOrphanage(item);
                  if (isShelter && !showShelters) return false;
                  if (!isShelter && !showNgos) return false;
                  return true;
                }).map(item => (
                  <Marker 
                    key={`ngo-${item.id}`} 
                    position={[item.location.lat, item.location.lng]}
                    icon={createMarkerIcon(item, 'ngo')}
                  >
                    <Popup className="foodbridge-custom-popup">
                      {isOrg && <div className="bg-violet-100 text-violet-800 text-xs font-bold px-2 py-1 text-center rounded-t-md"><T text="Your organisation" /></div>}
                      <ItemCard item={item} isPopup={true} />
                    </Popup>
                  </Marker>
                ))}
              </MarkerClusterGroup>
            )}
            {userLocation && isValidCoord(userLocation.lat, userLocation.lng) && (
              <>
                <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                  <Popup>Your Location</Popup>
                </Marker>
                {radius !== 'All' && (
                  <Circle 
                    center={[userLocation.lat, userLocation.lng]} 
                    radius={parseInt(radius, 10) * 1000} 
                    pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1 }}
                  />
                )}
              </>
            )}
            <BoundsUpdater markers={visibleCoords} />
            {/* Live Volunteer Location Markers — only shown when IN_TRANSIT and fresh (≤5 min) */}
            {showVolunteers && Object.entries(volunteerLocations)
              .filter(([, loc]) => {
                const isActiveStatus = ['IN_TRANSIT', 'en_route', 'picked_up'].includes(loc.status);
                const isFresh = Date.now() - (loc.timestamp || 0) <= 5 * 60 * 1000;
                return isActiveStatus && isFresh && isValidCoord(loc.lat, loc.lng);
              })
              .map(([taskId, loc]) => (
              <Marker
                key={`volunteer-${taskId}`}
                position={[loc.lat, loc.lng]}
                icon={createVolunteerIcon()}
              >
                <Popup>
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-orange-600">🚚 {loc.volunteerName}</p>
                    <p className="text-slate-500"><T text="Live location — in transit" /></p>
                    <p className="text-[11px] text-slate-400">
                      <T text="Updated" />: {new Date(loc.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
            {/* Current Location Marker */}
            {!locationError && userLocation && isValidCoord(userLocation.lat, userLocation.lng) && userLocation.lat !== 18.5204 && (
              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={L.divIcon({
                  html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
                  className: 'custom-leaflet-marker',
                  iconSize: [16, 16],
                  iconAnchor: [8, 8]
                })}
              >
                <Popup><T text="You are here" /></Popup>
              </Marker>
            )}
            <MapEffect view={view} />
          </MapContainer>
          </ErrorBoundary>
        ) : (
          <div className="p-6 overflow-y-auto h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr items-stretch content-start">
            {showSurplus && (isOrg || isVolunteerUser) && filteredDonations.map(item => <React.Fragment key={`list-surplus-${item.id}`}><ItemCard item={item} isPopup={false} /></React.Fragment>)}
            {showDonors && (isOrg || isVolunteerUser) && filteredDonors.map(item => <React.Fragment key={`list-donor-${item.id}`}><ItemCard item={item} isPopup={false} /></React.Fragment>)}
            {showNgos && (isDonorUser || isVolunteerUser) && filteredNgos.map(item => <React.Fragment key={`list-ngo-${item.id}`}><ItemCard item={item} isPopup={false} /></React.Fragment>)}
          </div>
        )}

        {/* Legend */}
        {view === 'map' && (
          <div className="absolute bottom-6 left-6 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 z-[400] text-xs max-w-sm">
            <h4 className="font-bold mb-3 border-b pb-1 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"><T text="Map Legend" /></h4>
            
            <div className="grid grid-cols-2 gap-4">
              {showSurplus && (
                <div>
                  <h5 className="font-bold text-[10px] uppercase text-emerald-600 dark:text-emerald-400 mb-1.5"><T text="Surplus (Square)" /></h5>
                  <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
                    <li className="flex items-center">
                      <div className="w-3 h-3 rounded-sm bg-red-500 mr-2 border border-slate-200"></div> <T text="High" />
                    </li>
                    <li className="flex items-center">
                      <div className="w-3 h-3 rounded-sm bg-yellow-500 mr-2 border border-slate-200"></div> <T text="Medium" />
                    </li>
                    <li className="flex items-center">
                      <div className="w-3 h-3 rounded-sm bg-green-500 mr-2 border border-slate-200"></div> <T text="Low/Fresh" />
                    </li>
                  </ul>
                </div>
              )}
              
              {showNgos && (
                <div>
                  <h5 className="font-bold text-[10px] uppercase text-violet-600 dark:text-violet-400 mb-1.5"><T text="NGOs (Pin)" /></h5>
                  <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
                    <li className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 mr-2 border border-slate-200" style={{ borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)' }}></div> <T text="Verified" />
                    </li>
                    <li className="flex items-center">
                      <div className="w-3 h-3 bg-purple-500 mr-2 border border-slate-200" style={{ borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)' }}></div> <T text="Unverified" />
                    </li>
                  </ul>
                </div>
              )}

              {showVolunteers && Object.keys(volunteerLocations).length > 0 && (
                <div>
                  <h5 className="font-bold text-[10px] uppercase text-orange-600 dark:text-orange-400 mb-1.5"><T text="Live Volunteers (🚚)" /></h5>
                  <ul className="space-y-1.5 text-slate-600 dark:text-slate-400">
                    <li className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-orange-500 mr-2 border border-slate-200"></div>
                      <T text="In Transit" />
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
};

export default MapPage;
