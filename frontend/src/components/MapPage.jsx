import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { io } from 'socket.io-client';
import {
  Radio, Crosshair, Navigation, MapPin, Compass, AlertCircle,
  ExternalLink, Phone, ChevronDown, ChevronUp, Layers, CheckCircle2,
  Clock, ArrowRight
} from 'lucide-react';
import { T } from '../context/LanguageContext';
import ErrorBoundary from './ErrorBoundary';
import { calculateDistanceKm } from '../services/mapsService';
import {
  fetchRoute,
  gmapsFullRouteUrl,
  gmapsPinUrl,
  decodePolyline,
  geocodeAddress,
  computeTrafficCondition
} from '../services/mapApi';

import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon paths in Vite/Webpack
import icon from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: icon,
  shadowUrl: iconShadow
});

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ── Coordinate helpers ───────────────────────────────────────────────────────
const isValidCoord = (lat, lng) =>
  Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) &&
  Math.abs(Number(lat)) <= 90 && Math.abs(Number(lng)) <= 180;

const hasRealCoords = (coords) =>
  Boolean(coords) &&
  isValidCoord(coords.lat, coords.lng) &&
  !(Math.abs(Number(coords.lat)) < 1e-6 && Math.abs(Number(coords.lng)) < 1e-6);

const getCoords = (item) => {
  if (!item) return null;
  if (item.lat !== undefined && item.lng !== undefined && isValidCoord(item.lat, item.lng))
    return { lat: Number(item.lat), lng: Number(item.lng) };
  if (item.latitude !== undefined && item.longitude !== undefined && isValidCoord(item.latitude, item.longitude))
    return { lat: Number(item.latitude), lng: Number(item.longitude) };

  const loc = item.location || item.pickupCoords || item.ngoCoords || item.volunteerCoords || item;
  if (!loc) return null;

  if (loc.coordinates && Array.isArray(loc.coordinates) && loc.coordinates.length >= 2 &&
      isValidCoord(loc.coordinates[1], loc.coordinates[0]))
    return { lat: Number(loc.coordinates[1]), lng: Number(loc.coordinates[0]) };
  if (loc.lat !== undefined && loc.lng !== undefined && isValidCoord(loc.lat, loc.lng))
    return { lat: Number(loc.lat), lng: Number(loc.lng) };
  if (loc.latitude !== undefined && loc.longitude !== undefined && isValidCoord(loc.latitude, loc.longitude))
    return { lat: Number(loc.latitude), lng: Number(loc.longitude) };
  if (Array.isArray(loc) && loc.length >= 2 && isValidCoord(loc[0], loc[1]))
    return { lat: Number(loc[0]), lng: Number(loc[1]) };
  return null;
};

// ── Custom Marker Icons ──────────────────────────────────────────────────────
const createDonorIcon = (name = 'Donor', isApprox = false) => L.divIcon({
  html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center;width:160px;margin-left:-80px;">
    <div style="background:#10b981;width:38px;height:38px;border-radius:12px;border:3px solid white;
      box-shadow:0 4px 14px rgba(16,185,129,0.5);display:flex;align-items:center;justify-content:center;
      color:white;font-size:18px;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
        <line x1="12" y1="22.08" x2="12" y2="12"></line>
      </svg>
    </div>
    <div style="margin-top:4px;background:rgba(15,23,42,0.92);color:#e2e8f0;font-size:11px;font-weight:800;
      padding:2px 8px;border-radius:9999px;white-space:nowrap;border:1px solid rgba(16,185,129,0.7);
      box-shadow:0 2px 8px rgba(0,0,0,0.3);backdrop-filter:blur(6px);display:flex;align-items:center;gap:4px;max-width:150px;">
      <span style="width:6px;height:6px;border-radius:50%;background:#10b981;shrink:0;"></span>
      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${name}${isApprox ? ' (Approx)' : ''}</span>
    </div>
  </div>`,
  className: 'custom-leaflet-marker donor-marker',
  iconSize: [38, 58],
  iconAnchor: [0, 19],
  popupAnchor: [0, -22]
});

const createNgoIcon = (name = 'Your NGO') => L.divIcon({
  html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center;width:160px;margin-left:-80px;">
    <div style="background:#173B78;width:38px;height:38px;border-radius:12px;border:3px solid white;
      box-shadow:0 4px 14px rgba(23,59,120,0.55);display:flex;align-items:center;justify-content:center;
      color:#E5B85C;font-size:18px;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
        <path d="M9 22v-4h6v4"></path>
        <path d="M8 6h.01"></path>
        <path d="M16 6h.01"></path>
        <path d="M8 10h.01"></path>
        <path d="M16 10h.01"></path>
        <path d="M8 14h.01"></path>
        <path d="M16 14h.01"></path>
      </svg>
    </div>
    <div style="margin-top:4px;background:rgba(15,23,42,0.92);color:#e2e8f0;font-size:11px;font-weight:800;
      padding:2px 8px;border-radius:9999px;white-space:nowrap;border:1px solid rgba(229,184,92,0.7);
      box-shadow:0 2px 8px rgba(0,0,0,0.3);backdrop-filter:blur(6px);display:flex;align-items:center;gap:4px;max-width:150px;">
      <span style="width:6px;height:6px;border-radius:50%;background:#E5B85C;shrink:0;"></span>
      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${name}</span>
    </div>
  </div>`,
  className: 'custom-leaflet-marker ngo-marker',
  iconSize: [38, 58],
  iconAnchor: [0, 19],
  popupAnchor: [0, -22]
});

const createVolunteerIcon = ({ name = 'Volunteer', secondsSinceUpdate = null, isLocationPaused = false } = {}) => {
  const statusLabel = isLocationPaused
    ? 'Paused'
    : secondsSinceUpdate !== null ? `${secondsSinceUpdate}s ago` : 'Live';

  return L.divIcon({
    html: `<div style="position:relative;display:flex;flex-direction:column;align-items:center;width:170px;margin-left:-85px;">
      <div style="position:relative;width:38px;height:38px;">
        ${!isLocationPaused ? `<div style="position:absolute;inset:-5px;border-radius:50%;background:#f97316;opacity:0.4;
          animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>` : ''}
        <div style="position:relative;background:${isLocationPaused ? '#64748b' : '#f97316'};width:38px;height:38px;
          border-radius:50%;border:3px solid white;box-shadow:0 4px 14px rgba(0,0,0,0.35);
          display:flex;align-items:center;justify-content:center;color:white;font-size:18px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18.5" cy="17.5" r="3.5"></circle>
            <circle cx="5.5" cy="17.5" r="3.5"></circle>
            <circle cx="15" cy="5" r="1"></circle>
            <path d="M12 17.5V14l-3-3 4-3 2 3h2"></path>
          </svg>
        </div>
      </div>
      <div style="margin-top:4px;background:${isLocationPaused ? 'rgba(30,41,59,0.95)' : 'rgba(15,23,42,0.92)'};
        color:${isLocationPaused ? '#fca5a5' : '#fed7aa'};font-size:11px;font-weight:800;padding:2px 8px;
        border-radius:9999px;white-space:nowrap;border:1px solid ${isLocationPaused ? 'rgba(239,68,68,0.6)' : 'rgba(249,115,22,0.7)'};
        box-shadow:0 2px 8px rgba(0,0,0,0.35);backdrop-filter:blur(6px);display:flex;align-items:center;gap:4px;max-width:160px;">
        <span style="width:6px;height:6px;border-radius:50%;background:${isLocationPaused ? '#ef4444' : '#f97316'};shrink:0;"></span>
        <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${name} • ${statusLabel}</span>
      </div>
    </div>`,
    className: 'custom-leaflet-marker volunteer-marker',
    iconSize: [38, 58],
    iconAnchor: [0, 19],
    popupAnchor: [0, -22]
  });
};

// ── Map utility sub-components ───────────────────────────────────────────────
const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);
    const t = setTimeout(() => map.invalidateSize(), 300);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(t);
    };
  }, [map]);
  return null;
};

const BoundsController = ({ points, recenterTrigger, browserLocation, routePoints }) => {
  const map = useMap();
  const initialFitDoneRef = useRef(false);
  const volunteerFirstSeenRef = useRef(false);
  const lastTriggerRef = useRef(recenterTrigger);

  const validPoints = useMemo(() => {
    const pts = (points || []).filter(hasRealCoords).map(p => [p.lat, p.lng]);
    if (Array.isArray(routePoints) && routePoints.length > 0) {
      // Include route endpoints / sample
      pts.push(...routePoints);
    }
    return pts;
  }, [points, routePoints]);

  const fitBoundsNow = useCallback(() => {
    if (validPoints.length === 0) {
      if (hasRealCoords(browserLocation)) {
        map.flyTo([browserLocation.lat, browserLocation.lng], 15, { animate: true });
      }
      return;
    }
    if (validPoints.length === 1) {
      map.flyTo(validPoints[0], 15, { animate: true });
    } else {
      const bounds = L.latLngBounds(validPoints);
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [80, 80], maxZoom: 16 });
      }
    }
  }, [validPoints, browserLocation, map]);

  useEffect(() => {
    if (!initialFitDoneRef.current) {
      if (validPoints.length > 0) {
        fitBoundsNow();
        initialFitDoneRef.current = true;
      } else if (hasRealCoords(browserLocation)) {
        map.flyTo([browserLocation.lat, browserLocation.lng], 15, { animate: true });
        initialFitDoneRef.current = true;
      }
    }
  }, [validPoints, browserLocation, fitBoundsNow, map]);

  const hasVolunteer = Boolean(points?.find(p => p?.isVolunteer && hasRealCoords(p)));
  useEffect(() => {
    if (!volunteerFirstSeenRef.current && hasVolunteer && validPoints.length > 1) {
      fitBoundsNow();
      volunteerFirstSeenRef.current = true;
    }
  }, [hasVolunteer, validPoints.length, fitBoundsNow]);

  useEffect(() => {
    if (recenterTrigger !== lastTriggerRef.current) {
      lastTriggerRef.current = recenterTrigger;
      fitBoundsNow();
    }
  }, [recenterTrigger, fitBoundsNow]);

  return null;
};

const LocateControl = ({ target }) => {
  const map = useMap();
  const handleLocate = () => {
    if (hasRealCoords(target)) {
      map.flyTo([target.lat, target.lng], 15, { animate: true });
    } else {
      map.locate({ enableHighAccuracy: true });
      map.once('locationfound', (e) => map.flyTo(e.latlng, 15, { animate: true }));
    }
  };
  return (
    <div className="leaflet-bottom leaflet-right mb-6 mr-4 z-[400]">
      <button
        onClick={handleLocate}
        className="bg-white/95 dark:bg-[#0F1A33]/95 text-[#18315E] dark:text-white hover:bg-white dark:hover:bg-[#15223F] w-10 h-10 flex items-center justify-center transition-all rounded-2xl shadow-lg border border-[#E5E1D8]/80 dark:border-[#1E2D52]/80 backdrop-blur-md cursor-pointer"
        title="Locate Me"
      >
        <Crosshair className="w-5 h-5 text-[#18315E] dark:text-[#D9B65D]" />
      </button>
    </div>
  );
};

const DropPinControl = ({ onPin }) => {
  const map = useMap();
  useEffect(() => {
    const handler = (e) => onPin({ lat: e.latlng.lat, lng: e.latlng.lng });
    map.on('click', handler);
    return () => map.off('click', handler);
  }, [map, onPin]);
  return null;
};

// ── Stage helper ─────────────────────────────────────────────────────────────
const getStage = (d) => {
  if (!d) return 'NONE';
  const status = String(d.status || '').toUpperCase();
  const vStatus = String(d.volunteerStatus || '').toLowerCase();
  if (['DELIVERED', 'COMPLETED', 'CANCELLED', 'REJECTED', 'DECLINED', 'NON_CLAIMED'].includes(status) ||
      vStatus === 'delivered') return 'DONE';
  if (['IN_TRANSIT', 'FOOD_PICKED_UP'].includes(status) || vStatus === 'picked_up') return 'TO_NGO';
  if (Array.isArray(d.trackingTimeline) &&
      d.trackingTimeline.some(s => s?.completed &&
        ['FOOD_PICKED_UP', 'IN_TRANSIT'].includes(String(s.status || '').toUpperCase())))
    return 'TO_NGO';
  if (['MATCHED', 'VOLUNTEER_ASSIGNED', 'CLAIMED', 'ACCEPTED'].includes(status) ||
      ['assigned', 'accepted', 'en_route'].includes(vStatus))
    return 'TO_DONOR';
  return 'WAITING';
};

// ── Normalize donation from backend ──────────────────────────────────────────
const normalizeApiDonation = (f) => {
  if (!f) return null;
  const donorObj = f.donorId && typeof f.donorId === 'object' ? f.donorId : null;
  const claimantObj = f.claimantId && typeof f.claimantId === 'object' ? f.claimantId : null;
  const volAssignment = (Array.isArray(f.volunteerAssignments) && f.volunteerAssignments[0]) ||
    f.volunteerAssignment || null;

  const rawPickup = getCoords(f.location) || getCoords(donorObj?.location) || null;
  const rawNgo = getCoords(claimantObj?.location) || null;

  return {
    ...f,
    id: f._id ? f._id.toString() : (f.id || ''),
    _id: f._id ? f._id.toString() : (f.id || ''),
    title: f.title || f.itemName || 'Food Listing',
    status: f.status,
    volunteerStatus: f.volunteerStatus,
    donorId: donorObj ? (donorObj._id || donorObj.id) : f.donorId,
    donorName: donorObj?.orgName || donorObj?.businessName || donorObj?.fullName || f.donorName || 'Donor',
    donorPhone: donorObj?.phone || f.donorPhone || '',
    donorAddress: donorObj?.address || f.pickupAddress || '',
    pickupAddress: f.pickupAddress || donorObj?.address || '',
    pickupCoords: hasRealCoords(rawPickup) ? rawPickup : null,
    isApproximatePickup: Boolean(f.isApproximateLocation || (!f.location?.coordinates && f.pickupAddress)),
    claimantId: claimantObj ? (claimantObj._id || claimantObj.id) : f.claimantId,
    matchedNgoId: claimantObj ? (claimantObj._id || claimantObj.id) : (f.matchedNgoId || f.claimantId),
    matchedNgoName: claimantObj?.orgName || claimantObj?.fullName || f.matchedNgoName || 'Verified NGO Hub',
    matchedNgoAddress: claimantObj?.address
      ? [claimantObj.address, claimantObj.city].filter(Boolean).join(', ')
      : '',
    matchedNgoPhone: claimantObj?.phone || '',
    ngoCoords: hasRealCoords(rawNgo) ? rawNgo : null,
    volunteerId: volAssignment?.volunteerId || f.volunteerId || null,
    volunteerName: volAssignment?.name || f.volunteerName || 'Assigned Volunteer',
    volunteerPhone: volAssignment?.phone || f.volunteerPhone || '',
    volunteerLiveLocation:
      f.volunteerLiveLocation &&
      hasRealCoords({ lat: f.volunteerLiveLocation.lat, lng: f.volunteerLiveLocation.lng })
        ? {
            lat: Number(f.volunteerLiveLocation.lat),
            lng: Number(f.volunteerLiveLocation.lng),
            accuracy: f.volunteerLiveLocation.accuracy,
            updatedAt: f.volunteerLiveLocation.updatedAt
          }
        : null,
    updatedAt: f.updatedAt,
    createdAt: f.createdAt
  };
};

// ── MapPage Component ────────────────────────────────────────────────────────
const MapPage = ({ user }) => {
  const [searchParams] = useSearchParams();
  const donationParam = searchParams.get('donation');

  const isOrg = user?.accountType === 'ORGANISATION' ||
                user?.accountType === 'ORGANIZATION' ||
                user?.role === 'ORGANISATION' ||
                user?.role === 'ORGANIZATION' ||
                Boolean(user?.orgName);
  const isDonorUser = !isOrg && (user?.accountType === 'DONOR' || user?.role === 'DONOR' || Boolean(user));
  const isVolunteerUser = user?.accountType === 'VOLUNTEER' || user?.role === 'VOLUNTEER';

  // ── State ──────────────────────────────────────────────────────────────────
  const [donations, setDonations] = useState([]);
  const [selectedDonationId, setSelectedDonationId] = useState(donationParam || null);
  const [liveVolunteerLocations, setLiveVolunteerLocations] = useState({});
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  const [routeDetailsOpen, setRouteDetailsOpen] = useState(false);
  const [activeAltIndex, setActiveAltIndex] = useState(0); // 0 = primary route

  const donationsRef = useRef(donations);
  const selectedDonationIdRef = useRef(selectedDonationId);
  const userRef = useRef(user);
  donationsRef.current = donations;
  selectedDonationIdRef.current = selectedDonationId;
  userRef.current = user;

  // Profile coords
  const [savingLocation, setSavingLocation] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [ngoProfileCoords, setNgoProfileCoords] = useState(() => {
    const c = getCoords(user?.location);
    return hasRealCoords(c) ? c : null;
  });
  const [donorProfileCoords, setDonorProfileCoords] = useState(() => {
    const c = getCoords(user?.location);
    return hasRealCoords(c) ? c : null;
  });

  // Drop-pin state (for both NGO and Donor)
  const [dropPinMode, setDropPinMode] = useState(false);
  const [dropPinRole, setDropPinRole] = useState(isOrg ? 'ngo' : 'donor');
  const [droppedPin, setDroppedPin] = useState(null);
  const [savingPin, setSavingPin] = useState(false);

  // Routing state
  const [activeLegRoute, setActiveLegRoute] = useState(null);
  const [nextLegRoute, setNextLegRoute] = useState(null);
  const [routeError, setRouteError] = useState(null);

  const lastActiveRouteFetchRef = useRef(0);
  const lastNextRouteFetchRef = useRef(0);
  const lastVolPosRef = useRef(null);
  const routeAbortControllerRef = useRef(null);
  const routeCacheRef = useRef({});

  const socketRef = useRef(null);

  // Dark mode observer
  useEffect(() => {
    const observer = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains('dark'))
    );
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Sync profile coords from user prop
  useEffect(() => {
    const saved = getCoords(user?.location);
    if (hasRealCoords(saved)) {
      if (isOrg) setNgoProfileCoords(saved);
      else setDonorProfileCoords(saved);
    }
  }, [user, isOrg]);

  // Browser geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setDeviceLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log('Geolocation error:', err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  }, []);

  // Load active pickups
  const loadDonations = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) { setDonations([]); return; }
    axios.get(`${API_URL}/api/food/active-pickups`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        const apiDons = Array.isArray(res.data)
          ? res.data.map(normalizeApiDonation).filter(Boolean)
          : [];
        setDonations(apiDons);
      })
      .catch(err => {
        console.log('Active pickups fetch failed:', err.message);
        setDonations([]);
      });
  }, []);

  useEffect(() => { loadDonations(); }, [loadDonations]);

  // Handle ?donation= URL param
  useEffect(() => {
    if (!donationParam) return;
    setSelectedDonationId(donationParam);
    const token = localStorage.getItem('token');
    if (!token) return;
    axios.get(`${API_URL}/api/food/${donationParam}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      if (res.data) {
        const normalized = normalizeApiDonation(res.data);
        if (normalized) {
          setDonations(prev => {
            const exists = prev.some(d => String(d.id) === String(normalized.id));
            if (exists) return prev.map(d => String(d.id) === String(normalized.id) ? normalized : d);
            return [normalized, ...prev];
          });
        }
      }
    }).catch(err => console.log('Single donation fetch failed:', err.message));
  }, [donationParam]);

  // Filter relevant donations
  const relevantDonations = useMemo(() => {
    const uid = user?.id || user?._id ? String(user?.id || user?._id) : null;
    const uName = user?.name || user?.fullName || user?.orgName;

    return donations.filter(d => {
      if (getStage(d) === 'DONE') return false;

      if (isOrg) {
        const claimantId = d.matchedNgoId || d.claimedBy ||
          (d.claimantId && typeof d.claimantId === 'object' ? d.claimantId._id : d.claimantId);
        const isMatchedNgo = (claimantId && uid && String(claimantId) === uid) ||
          (d.matchedNgoName && uName && d.matchedNgoName === uName);
        if (!isMatchedNgo) return false;
      } else if (isDonorUser) {
        const donorId = d.donorId && typeof d.donorId === 'object' ? d.donorId._id : d.donorId;
        const isOwnerDonor = (donorId && uid && String(donorId) === uid) ||
          (d.donorName && uName && d.donorName === uName);
        if (!isOwnerDonor) return false;
      } else if (isVolunteerUser) {
        const isAssignedVol = (d.volunteerId && uid && String(d.volunteerId) === uid) ||
          (d.volunteerName && uName && d.volunteerName === uName);
        if (!isAssignedVol) return false;
      }
      return true;
    }).sort((a, b) =>
      new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
    );
  }, [donations, user, isOrg, isDonorUser, isVolunteerUser]);

  const activeDonation = useMemo(() => {
    if (relevantDonations.length === 0) return null;
    if (selectedDonationId) {
      const sel = relevantDonations.find(
        d => String(d.id) === String(selectedDonationId) || String(d._id) === String(selectedDonationId)
      );
      if (sel) return sel;
    }
    return relevantDonations.find(d => getStage(d) === 'TO_NGO') || relevantDonations[0];
  }, [relevantDonations, selectedDonationId]);

  const stage = getStage(activeDonation);
  const isTrackingActive = Boolean(activeDonation) && (stage === 'TO_DONOR' || stage === 'TO_NGO');

  // Socket.io connection & listener cleanup
  useEffect(() => {
    const socket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;

    const joinAllRooms = () => {
      const u = userRef.current;
      const uid = u?.id || u?._id;
      if (uid) {
        socket.emit('join_room', uid);
        socket.emit('join_room', `room:${uid}`);
      }
      const ds = donationsRef.current || [];
      ds.forEach(d => {
        if (d?.id) {
          socket.emit('join_room', d.id);
          socket.emit('join_room', `room:${d.id}`);
        }
      });
      const sel = selectedDonationIdRef.current;
      if (sel) {
        socket.emit('join_room', sel);
        socket.emit('join_room', `room:${sel}`);
      }
    };

    const handleConnect = () => {
      joinAllRooms();
      loadDonations();
    };

    socket.on('connect', handleConnect);
    if (socket.connected) handleConnect();

    const handleVolunteerLoc = (payload) => {
      const targetId = payload?.donationId || payload?.taskId;
      if (!targetId) return;
      if (!isValidCoord(payload.lat, payload.lng)) return;
      const lat = Number(payload.lat);
      const lng = Number(payload.lng);
      if (Math.abs(lat) < 1e-6 && Math.abs(lng) < 1e-6) return;

      setLiveVolunteerLocations(prev => {
        const old = prev[String(targetId)];
        // Jitter filter: ignore updates under ~3 meters
        if (old && Math.abs(old.lat - lat) < 0.00003 && Math.abs(old.lng - lng) < 0.00003) {
          return prev;
        }
        return {
          ...prev,
          [String(targetId)]: {
            lat,
            lng,
            accuracy: payload.accuracy,
            receivedAt: Date.now()
          }
        };
      });
    };

    const handleStatusUpdate = () => loadDonations();

    socket.on('VOLUNTEER_LOCATION', handleVolunteerLoc);
    socket.on('TASK_UPDATED', handleStatusUpdate);
    socket.on('LISTING_UPDATED', handleStatusUpdate);
    socket.on('PICKUP_CONFIRMED', handleStatusUpdate);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('VOLUNTEER_LOCATION', handleVolunteerLoc);
      socket.off('TASK_UPDATED', handleStatusUpdate);
      socket.off('LISTING_UPDATED', handleStatusUpdate);
      socket.off('PICKUP_CONFIRMED', handleStatusUpdate);
      socket.disconnect();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [loadDonations]);

  // Keep rooms updated when active selection or list changes
  useEffect(() => {
    if (socketRef.current && socketRef.current.connected) {
      donations.forEach(d => {
        if (d?.id) {
          socketRef.current.emit('join_room', d.id);
          socketRef.current.emit('join_room', `room:${d.id}`);
        }
      });
      if (selectedDonationId) {
        socketRef.current.emit('join_room', selectedDonationId);
        socketRef.current.emit('join_room', `room:${selectedDonationId}`);
      }
    }
  }, [donations, selectedDonationId]);

  // Coordinates resolution
  // NGO coords: donation.ngoCoords > user.location (if org) > saved profile
  const ngoCoords = useMemo(() => {
    const fromDon = getCoords(activeDonation?.ngoCoords);
    if (hasRealCoords(fromDon)) return fromDon;
    if (isOrg) {
      const saved = getCoords(user?.location);
      if (hasRealCoords(saved)) return saved;
      if (hasRealCoords(ngoProfileCoords)) return ngoProfileCoords;
    }
    return null;
  }, [activeDonation, isOrg, user, ngoProfileCoords]);

  // Donor coords: donation.pickupCoords > donor profile
  const donorCoords = useMemo(() => {
    if (activeDonation) {
      const c = getCoords(activeDonation.pickupCoords || activeDonation.location);
      if (hasRealCoords(c)) return c;
    }
    if (isDonorUser && hasRealCoords(donorProfileCoords)) return donorProfileCoords;
    if (hasRealCoords(droppedPin) && dropPinRole === 'donor') return droppedPin;
    return null;
  }, [activeDonation, isDonorUser, donorProfileCoords, droppedPin, dropPinRole]);

  // Geocode donor address fallback if coordinates missing
  const donorGeocodedRef = useRef(false);
  useEffect(() => {
    if (!isDonorUser || hasRealCoords(donorCoords) || donorGeocodedRef.current) return;
    const address = user?.address || user?.city;
    if (!address) return;
    donorGeocodedRef.current = true;
    geocodeAddress(address).then(result => {
      if (result && hasRealCoords(result)) {
        setDonorProfileCoords({ ...result, isApprox: true });
      }
    });
  }, [isDonorUser, donorCoords, user]);

  // Live volunteer coordinates
  const volunteerUpdate = useMemo(() => {
    if (!activeDonation) return null;
    const donId = String(activeDonation.id);
    const live = liveVolunteerLocations[donId] ||
      (activeDonation._id && liveVolunteerLocations[String(activeDonation._id)]);
    if (live && hasRealCoords({ lat: live.lat, lng: live.lng })) return live;
    const saved = activeDonation.volunteerLiveLocation;
    if (saved && hasRealCoords({ lat: saved.lat, lng: saved.lng })) {
      return {
        lat: Number(saved.lat),
        lng: Number(saved.lng),
        accuracy: saved.accuracy,
        receivedAt: saved.updatedAt ? Date.parse(saved.updatedAt) : null
      };
    }
    return null;
  }, [activeDonation, liveVolunteerLocations]);

  const volunteerCoords = useMemo(() => (
    volunteerUpdate ? { lat: volunteerUpdate.lat, lng: volunteerUpdate.lng } : null
  ), [volunteerUpdate]);

  // Ticking second counter for volunteer timestamp
  const [nowTick, setNowTick] = useState(Date.now());
  useEffect(() => {
    if (!volunteerUpdate) return;
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, [volunteerUpdate]);

  const secondsSinceUpdate = volunteerUpdate?.receivedAt
    ? Math.max(0, Math.round((nowTick - volunteerUpdate.receivedAt) / 1000))
    : null;
  const isLocationPaused = secondsSinceUpdate !== null && secondsSinceUpdate > 60;

  // ── ROUTING LOGIC (Part 2) ─────────────────────────────────────────────────
  // Legs:
  // Before pickup (TO_DONOR): Active leg = Volunteer -> Donor; Next leg = Donor -> NGO.
  // After pickup (TO_NGO): Active leg = Volunteer -> NGO; Next leg = null.
  // Delivered / Done: Remove everything.
  useEffect(() => {
    if (!isTrackingActive) {
      setActiveLegRoute(null);
      setNextLegRoute(null);
      return;
    }

    const abortController = new AbortController();
    routeAbortControllerRef.current = abortController;

    const activeOrigin = volunteerCoords;
    const activeDest = stage === 'TO_DONOR' ? donorCoords : ngoCoords;

    if (!activeOrigin || !activeDest) {
      setActiveLegRoute(null);
      return;
    }

    const now = Date.now();
    const timeSinceLast = now - lastActiveRouteFetchRef.current;
    const prevPos = lastVolPosRef.current;
    const movedEnough = !prevPos ||
      Math.abs(prevPos.lat - activeOrigin.lat) > 0.0009 ||
      Math.abs(prevPos.lng - activeOrigin.lng) > 0.0009; // ~100m

    // Key for leg caching
    const legKey = `${activeOrigin.lat.toFixed(3)},${activeOrigin.lng.toFixed(3)}->${activeDest.lat.toFixed(4)},${activeDest.lng.toFixed(4)}`;

    if (timeSinceLast < 30000 && !movedEnough && routeCacheRef.current[legKey]) {
      setActiveLegRoute(routeCacheRef.current[legKey]);
      return;
    }

    lastActiveRouteFetchRef.current = now;
    lastVolPosRef.current = { lat: activeOrigin.lat, lng: activeOrigin.lng };

    fetchRoute(activeOrigin, activeDest, null, abortController.signal).then(result => {
      if (result) {
        const primaryLeg = result.legs?.[0] || {};
        const decodedPoints = decodePolyline(result.polyline || result.overview_polyline);
        const traffic = computeTrafficCondition(
          primaryLeg.duration_in_traffic?.value,
          primaryLeg.duration?.value
        );

        const routeData = {
          positions: decodedPoints,
          polyline: result.polyline || result.overview_polyline,
          distanceText: primaryLeg.distance?.text || result.distanceText || '',
          durationText: (primaryLeg.duration_in_traffic?.text || primaryLeg.duration?.text) || result.durationText || '',
          distanceMeters: primaryLeg.distance?.value ?? result.distanceMeters ?? 0,
          durationSeconds: primaryLeg.duration_in_traffic?.value ?? primaryLeg.duration?.value ?? result.durationSeconds ?? 0,
          traffic,
          steps: primaryLeg.steps || [],
          alternatives: (result.alternatives || []).map(alt => ({
            ...alt,
            positions: decodePolyline(alt.polyline)
          })),
          isReal: true
        };

        routeCacheRef.current[legKey] = routeData;
        setActiveLegRoute(routeData);
        setRouteError(null);
      } else {
        // Approximate straight line fallback
        const straightDistKm = calculateDistanceKm(activeOrigin, activeDest);
        setActiveLegRoute({
          positions: [[activeOrigin.lat, activeOrigin.lng], [activeDest.lat, activeDest.lng]],
          distanceText: straightDistKm ? `${straightDistKm} km (approx.)` : '',
          durationText: '',
          distanceMeters: straightDistKm ? Math.round(straightDistKm * 1000) : 0,
          durationSeconds: 0,
          traffic: null,
          steps: [],
          alternatives: [],
          isReal: false
        });
        setRouteError('Route service unavailable (showing approx. straight line)');
      }
    }).catch(err => {
      if (err.name !== 'AbortError') {
        console.warn('Active route fetch error:', err.message);
      }
    });

    // If before pickup, fetch next leg: Donor -> NGO
    if (stage === 'TO_DONOR' && donorCoords && ngoCoords) {
      const nextKey = `${donorCoords.lat.toFixed(4)},${donorCoords.lng.toFixed(4)}->${ngoCoords.lat.toFixed(4)},${ngoCoords.lng.toFixed(4)}`;
      if (routeCacheRef.current[nextKey]) {
        setNextLegRoute(routeCacheRef.current[nextKey]);
      } else {
        const nextTimeSince = now - lastNextRouteFetchRef.current;
        if (nextTimeSince > 30000 || !lastNextRouteFetchRef.current) {
          lastNextRouteFetchRef.current = now;
          fetchRoute(donorCoords, ngoCoords, null, abortController.signal).then(nextResult => {
            if (nextResult) {
              const leg = nextResult.legs?.[0] || {};
              const nextData = {
                positions: decodePolyline(nextResult.polyline || nextResult.overview_polyline),
                distanceText: leg.distance?.text || nextResult.distanceText || '',
                durationText: (leg.duration_in_traffic?.text || leg.duration?.text) || nextResult.durationText || '',
                distanceMeters: leg.distance?.value ?? nextResult.distanceMeters ?? 0,
                durationSeconds: leg.duration_in_traffic?.value ?? leg.duration?.value ?? nextResult.durationSeconds ?? 0,
                isReal: true
              };
              routeCacheRef.current[nextKey] = nextData;
              setNextLegRoute(nextData);
            }
          }).catch(() => {});
        }
      }
    } else {
      setNextLegRoute(null);
    }

    return () => {
      abortController.abort();
    };
  }, [isTrackingActive, stage, volunteerCoords, donorCoords, ngoCoords]);

  // Reset routes on donation delivery or change
  useEffect(() => {
    setActiveAltIndex(0);
    setRouteDetailsOpen(false);
  }, [activeDonation?.id, stage]);

  // Marker visibility
  const showDonorMarker = hasRealCoords(donorCoords) &&
    (isDonorUser || stage === 'TO_DONOR' || stage === 'TO_NGO' || Boolean(activeDonation));
  const showNgoMarker = hasRealCoords(ngoCoords) &&
    (isOrg || stage === 'TO_NGO' || stage === 'TO_DONOR' || Boolean(activeDonation));
  const showVolunteerMarker = Boolean(volunteerCoords) && isTrackingActive;

  // Single Missing Location Card state
  const showSetNgoLocation = isOrg && !hasRealCoords(ngoCoords);
  const showSetDonorLocation = isDonorUser && !hasRealCoords(donorCoords);

  // Computed ETA arrival time string
  const arrivalTimeString = useMemo(() => {
    if (!activeLegRoute || !activeLegRoute.durationSeconds) return null;
    const arrivalDate = new Date(Date.now() + activeLegRoute.durationSeconds * 1000);
    return arrivalDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }, [activeLegRoute]);

  // Handlers for "Set Location"
  const handleUseCurrentLocation = (role = 'ngo') => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setSavingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const token = localStorage.getItem('token');
          await axios.put(
            `${API_URL}/api/auth/profile`,
            { latitude: lat, longitude: lng },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (role === 'ngo') setNgoProfileCoords({ lat, lng });
          else setDonorProfileCoords({ lat, lng });
          setLocationSuccess(true);
          setDropPinMode(false);
          setTimeout(() => setLocationSuccess(false), 4000);
          window.dispatchEvent(new Event('user-updated'));
        } catch (err) {
          alert('Failed to save your location. Please try again.');
        } finally {
          setSavingLocation(false);
        }
      },
      () => {
        setSavingLocation(false);
        alert('Could not retrieve browser location. Please allow location permissions.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleDroppedPin = useCallback((coords) => {
    if (!dropPinMode) return;
    setDroppedPin(coords);
  }, [dropPinMode]);

  const handleSaveDroppedPin = async () => {
    if (!droppedPin) return;
    setSavingPin(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/auth/profile`,
        { latitude: droppedPin.lat, longitude: droppedPin.lng },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (dropPinRole === 'ngo') {
        setNgoProfileCoords(droppedPin);
      } else {
        setDonorProfileCoords(droppedPin);
      }
      setDropPinMode(false);
      setDroppedPin(null);
      setLocationSuccess(true);
      setTimeout(() => setLocationSuccess(false), 4000);
      window.dispatchEvent(new Event('user-updated'));
    } catch {
      alert('Failed to save pin location. Please try again.');
    } finally {
      setSavingPin(false);
    }
  };

  // Primary single Google Maps Full Route URL
  const primaryFullRouteUrl = useMemo(() => {
    if (!isTrackingActive || !volunteerCoords || !ngoCoords) return '';
    if (stage === 'TO_DONOR' && donorCoords) {
      return gmapsFullRouteUrl({
        origin: volunteerCoords,
        waypoints: [donorCoords],
        destination: ngoCoords
      });
    }
    if (stage === 'TO_NGO') {
      return gmapsFullRouteUrl({
        origin: volunteerCoords,
        destination: ngoCoords
      });
    }
    return '';
  }, [isTrackingActive, stage, volunteerCoords, donorCoords, ngoCoords]);

  // Points for bounds controller
  const allMapPoints = useMemo(() => {
    const list = [];
    if (showDonorMarker && hasRealCoords(donorCoords)) list.push({ ...donorCoords, isDonor: true });
    if (showNgoMarker && hasRealCoords(ngoCoords)) list.push({ ...ngoCoords, isNgo: true });
    if (showVolunteerMarker && hasRealCoords(volunteerCoords)) list.push({ ...volunteerCoords, isVolunteer: true });
    return list;
  }, [showDonorMarker, donorCoords, showNgoMarker, ngoCoords, showVolunteerMarker, volunteerCoords]);

  // Initial camera
  const initialCenter = useMemo(() => {
    if (hasRealCoords(donorCoords)) return [donorCoords.lat, donorCoords.lng];
    if (hasRealCoords(ngoCoords)) return [ngoCoords.lat, ngoCoords.lng];
    if (hasRealCoords(volunteerCoords)) return [volunteerCoords.lat, volunteerCoords.lng];
    if (hasRealCoords(deviceLocation)) return [deviceLocation.lat, deviceLocation.lng];
    return [18.5204, 73.8567]; // Regional Pune default
  }, [donorCoords, ngoCoords, volunteerCoords, deviceLocation]);

  const mapTileClassName = isDark ? 'map-tiles-dark' : undefined;

  // Active displayed polyline positions (switches if user clicked an alternative)
  const displayedActivePositions = useMemo(() => {
    if (!activeLegRoute) return [];
    if (activeAltIndex > 0 && activeLegRoute.alternatives?.[activeAltIndex - 1]?.positions) {
      return activeLegRoute.alternatives[activeAltIndex - 1].positions;
    }
    return activeLegRoute.positions || [];
  }, [activeLegRoute, activeAltIndex]);

  return (
    <ErrorBoundary>
      <div className="w-full h-[calc(100vh-64px)] relative flex flex-col bg-[#173B78] overflow-hidden select-none">
        {/* Dark-mode tile styling & animations */}
        <style>{`
          .map-tiles-dark, .map-tiles-dark img { filter: invert(1) hue-rotate(180deg); }
          @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
          .custom-leaflet-marker { background: none; border: none; }
        `}</style>

        {/* ── TOP-RIGHT: Recenter Control ─────────────────────────────────── */}
        <div className="absolute top-4 right-4 z-[400] flex items-center gap-2">
          <button
            onClick={() => setRecenterTrigger(prev => prev + 1)}
            className="bg-white/95 dark:bg-[#0F1A33]/95 text-[#18315E] dark:text-white hover:bg-white dark:hover:bg-[#15223F] px-3.5 py-2 rounded-2xl shadow-lg border border-[#E5E1D8]/80 dark:border-[#1E2D52]/80 backdrop-blur-md flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer hover:shadow-xl"
            title="Fit route & markers in view"
          >
            <Navigation className="w-3.5 h-3.5 text-[#18315E] dark:text-[#D9B65D]" />
            <span>Recenter</span>
          </button>
        </div>

        {/* ── TOP-LEFT: ONE COMPACT STATUS CARD (Part 1 & 2) ──────────────── */}
        <div className="absolute top-4 left-4 z-[400] w-[340px] max-w-[calc(100vw-5rem)] pointer-events-auto">
          {isTrackingActive ? (
            <div className="bg-white/95 dark:bg-[#0F1A33]/95 backdrop-blur-md rounded-2xl border border-[#E5E1D8]/80 dark:border-[#1E2D52]/80 shadow-xl p-3.5 space-y-3">
              {/* Header: Live Tracking + Stage + Updated Xs ago */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#f97316]/15 text-[#f97316] flex items-center justify-center font-bold shrink-0">
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-xs font-black text-[#18315E] dark:text-white flex items-center gap-1.5">
                      <span>LIVE TRACKING</span>
                      <span className="w-2 h-2 rounded-full bg-[#f97316] animate-ping" />
                    </h2>
                    <span className="text-[10px] font-bold text-[#60708B] dark:text-slate-300">
                      {secondsSinceUpdate !== null
                        ? `Updated ${secondsSinceUpdate}s ago`
                        : 'Connecting...'}
                    </span>
                  </div>
                </div>

                {/* Stage Badge */}
                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  stage === 'TO_NGO'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                }`}>
                  {stage === 'TO_NGO' ? 'Picked up' : 'Heading to donor'}
                </span>
              </div>

              {/* Donation selector when multiple active */}
              {relevantDonations.length > 1 && (
                <div className="pt-1">
                  <select
                    value={activeDonation ? activeDonation.id : ''}
                    onChange={(e) => setSelectedDonationId(e.target.value)}
                    className="w-full bg-[#F3F0EA] dark:bg-[#0F1A33] text-[#18315E] dark:text-white font-bold text-xs py-1.5 px-2.5 rounded-xl border border-[#E5E1D8] dark:border-[#1E2D52] outline-none cursor-pointer"
                  >
                    {relevantDonations.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.title || 'Donation'} ({getStage(d) === 'TO_NGO' ? 'Heading to NGO' : 'Heading to pickup'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Active Leg Metrics: Distance, ETA, Arrival, Traffic */}
              {activeLegRoute && (
                <div className="bg-[#F3F0EA]/70 dark:bg-[#15223F]/60 rounded-xl p-2.5 space-y-1.5 border border-[#E5E1D8]/60 dark:border-[#1E2D52]/60">
                  <div className="flex items-center justify-between text-xs font-black text-[#18315E] dark:text-white">
                    <div className="flex items-center gap-1.5">
                      <span>{activeLegRoute.distanceText}</span>
                      {activeLegRoute.durationText && (
                        <span>• ~{activeLegRoute.durationText}</span>
                      )}
                    </div>
                    {activeLegRoute.traffic && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${activeLegRoute.traffic.color}`}>
                        {activeLegRoute.traffic.label} traffic
                      </span>
                    )}
                  </div>

                  {arrivalTimeString && (
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#60708B] dark:text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-[#E5B85C]" />
                      <span>Arrives {arrivalTimeString}</span>
                    </div>
                  )}

                  {/* Next Leg Preview (Before pickup: Volunteer -> Donor is active, Donor -> NGO is next) */}
                  {stage === 'TO_DONOR' && nextLegRoute && (
                    <div className="pt-1 border-t border-[#E5E1D8] dark:border-[#1E2D52] text-[10px] font-bold text-[#60708B] dark:text-slate-400 flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 text-[#173B78] dark:text-[#E5B85C]" />
                      <span>Then to NGO: {nextLegRoute.durationText} ({nextLegRoute.distanceText})</span>
                    </div>
                  )}

                  {routeError && (
                    <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold pt-0.5">
                      {routeError}
                    </div>
                  )}
                </div>
              )}

              {/* ONE Primary Button: "Open full route in Google Maps" (Part 3) */}
              {primaryFullRouteUrl && (
                <a
                  href={primaryFullRouteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 bg-[#173B78] hover:bg-[#0F172A] dark:bg-[#3156B5] dark:hover:bg-[#3F66CC] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Open full route in Google Maps</span>
                  <ExternalLink className="w-3 h-3 opacity-75" />
                </a>
              )}

              {/* Collapsible Route Details (Turn-by-turn steps) */}
              {activeLegRoute && (
                <div className="border-t border-[#E5E1D8] dark:border-[#1E2D52] pt-2">
                  <button
                    onClick={() => setRouteDetailsOpen(prev => !prev)}
                    className="w-full flex items-center justify-between text-[11px] font-bold text-[#18315E] dark:text-[#D9B65D] hover:underline cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Route details ({activeLegRoute.steps?.length || 0} steps)</span>
                    </span>
                    {routeDetailsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {routeDetailsOpen && (
                    <div className="mt-2 max-h-48 overflow-y-auto space-y-1.5 pr-1 text-[11px]">
                      {/* Alternative route selectors if available */}
                      {activeLegRoute.alternatives?.length > 0 && (
                        <div className="flex gap-1 mb-2">
                          <button
                            onClick={() => setActiveAltIndex(0)}
                            className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                              activeAltIndex === 0
                                ? 'bg-[#173B78] text-white border-[#173B78]'
                                : 'bg-[#F3F0EA] dark:bg-[#0F1A33] text-[#18315E] dark:text-white border-[#E5E1D8]'
                            }`}
                          >
                            Main ({activeLegRoute.distanceText})
                          </button>
                          {activeLegRoute.alternatives.map((alt, idx) => (
                            <button
                              key={idx}
                              onClick={() => setActiveAltIndex(idx + 1)}
                              className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                                activeAltIndex === idx + 1
                                  ? 'bg-[#173B78] text-white border-[#173B78]'
                                  : 'bg-[#F3F0EA] dark:bg-[#0F1A33] text-[#18315E] dark:text-white border-[#E5E1D8]'
                              }`}
                            >
                              Alt {idx + 1} ({alt.distanceText})
                            </button>
                          ))}
                        </div>
                      )}

                      {activeLegRoute.steps && activeLegRoute.steps.length > 0 ? (
                        activeLegRoute.steps.map((st, i) => (
                          <div key={i} className="flex items-start gap-2 py-1 border-b border-[#E5E1D8]/40 dark:border-[#1E2D52]/40 last:border-b-0">
                            <span className="w-4 h-4 rounded-full bg-[#173B78]/10 text-[#173B78] dark:text-[#D9B65D] flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[#18315E] dark:text-white font-medium leading-tight">{st.instruction}</p>
                              <span className="text-[9px] text-[#60708B] dark:text-slate-400">
                                {st.distance?.text} {st.duration?.text ? `• ${st.duration.text}` : ''}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-[#60708B] py-1">Direct path instructions mapped on the orange road line.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* NO ACTIVE DONATION CARD */
            <div className="bg-white/95 dark:bg-[#0F1A33]/95 backdrop-blur-md rounded-2xl border border-[#E5E1D8]/80 dark:border-[#1E2D52]/80 shadow-xl p-3.5 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#173B78]/15 text-[#173B78] dark:text-[#D9B65D] flex items-center justify-center font-bold shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h2 className="text-xs font-black text-[#18315E] dark:text-white uppercase tracking-wider">
                    {isOrg ? 'Your NGO Hub' : isDonorUser ? 'Your Pickup Spot' : 'Map View'}
                  </h2>
                  <p className="text-[10px] text-[#60708B] dark:text-slate-300 font-semibold truncate max-w-[220px]">
                    {isOrg
                      ? (user?.orgName || 'NGO Organisation')
                      : (user?.name || user?.fullName || 'Donor Account')}
                  </p>
                </div>
              </div>

              {/* One small hint */}
              <div className="p-2 rounded-xl bg-[#F3F0EA]/80 dark:bg-[#15223F]/50 border border-[#E5E1D8]/60 dark:border-[#1E2D52]/60 text-[10px] text-[#60708B] dark:text-slate-300">
                Live tracking starts once a volunteer is assigned to an active pickup.
              </div>
            </div>
          )}

          {/* ── SET NGO LOCATION CARD (When NGO coords missing) ──────────── */}
          {showSetNgoLocation && !dropPinMode && (
            <div className="mt-2.5 bg-[#F3F0EA]/95 dark:bg-[#0F1A33]/95 text-[#18315E] dark:text-white border border-[#E5E1D8] dark:border-[#1E2D52] backdrop-blur-md p-3.5 rounded-2xl shadow-xl space-y-2">
              <div className="flex items-center gap-1.5 text-[#18315E] dark:text-[#D9B65D] font-extrabold text-xs">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>Set your NGO location</span>
              </div>
              <p className="text-[10px] text-[#60708B] dark:text-slate-300">
                Save your hub's real location so volunteers and donors can route deliveries accurately.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => handleUseCurrentLocation('ngo')}
                  disabled={savingLocation}
                  className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#173B78] hover:bg-[#0F172A] text-white text-[11px] font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  <Compass className={`w-3.5 h-3.5 ${savingLocation ? 'animate-spin' : ''}`} />
                  <span>{savingLocation ? 'Saving...' : 'Use my current location'}</span>
                </button>
                <button
                  onClick={() => { setDropPinRole('ngo'); setDropPinMode(true); }}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#0F1A33] border border-[#E5E1D8] dark:border-[#1E2D52] text-[#18315E] dark:text-[#D9B65D] text-[11px] font-bold rounded-xl transition-all cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Drop a pin</span>
                </button>
              </div>
            </div>
          )}

          {/* ── SET DONOR LOCATION CARD (When Donor coords missing) ────────── */}
          {showSetDonorLocation && !dropPinMode && !showSetNgoLocation && (
            <div className="mt-2.5 bg-[#F3F0EA]/95 dark:bg-[#0F1A33]/95 text-[#18315E] dark:text-white border border-[#E5E1D8] dark:border-[#1E2D52] backdrop-blur-md p-3.5 rounded-2xl shadow-xl space-y-2">
              <div className="flex items-center gap-1.5 text-[#18315E] dark:text-[#D9B65D] font-extrabold text-xs">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>Set your pickup location</span>
              </div>
              <p className="text-[10px] text-[#60708B] dark:text-slate-300">
                Save where volunteers should collect donations.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => handleUseCurrentLocation('donor')}
                  disabled={savingLocation}
                  className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#173B78] hover:bg-[#0F172A] text-white text-[11px] font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  <Compass className={`w-3.5 h-3.5 ${savingLocation ? 'animate-spin' : ''}`} />
                  <span>{savingLocation ? 'Saving...' : 'Use my current location'}</span>
                </button>
                <button
                  onClick={() => { setDropPinRole('donor'); setDropPinMode(true); }}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#0F1A33] border border-[#E5E1D8] dark:border-[#1E2D52] text-[#18315E] dark:text-[#D9B65D] text-[11px] font-bold rounded-xl transition-all cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Drop a pin</span>
                </button>
              </div>
            </div>
          )}

          {/* Drop pin banner active */}
          {dropPinMode && (
            <div className="mt-2.5 bg-[#F3F0EA]/95 dark:bg-[#0F1A33]/95 text-[#18315E] dark:text-white border border-[#E5E1D8] dark:border-[#D9B65D] backdrop-blur-md p-3.5 rounded-2xl shadow-xl space-y-2">
              <div className="flex items-center gap-1.5 text-[#18315E] dark:text-[#D9B65D] font-extrabold text-xs">
                <MapPin className="w-4 h-4 shrink-0 animate-bounce" />
                <span>Click anywhere on the map to place your pin</span>
              </div>
              {hasRealCoords(droppedPin) ? (
                <button
                  onClick={handleSaveDroppedPin}
                  disabled={savingPin}
                  className="w-full py-2 px-3 bg-[#E5B85C] hover:bg-[#173B78] text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingPin ? 'Saving...' : `Save pin (${droppedPin.lat.toFixed(5)}, ${droppedPin.lng.toFixed(5)})`}
                </button>
              ) : (
                <p className="text-[10px] text-[#60708B] dark:text-slate-300">Tap anywhere on the map to drop the marker, then drag to adjust.</p>
              )}
              <button
                onClick={() => { setDropPinMode(false); setDroppedPin(null); }}
                className="text-[10px] text-[#E5B85C] dark:text-[#D9B65D] underline cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Location save success banner */}
          {locationSuccess && (
            <div className="mt-2 bg-emerald-500 text-white p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Location successfully saved to profile!</span>
            </div>
          )}
        </div>

        {/* ── MAP CONTAINER ───────────────────────────────────────────────── */}
        <div className="w-full flex-1 relative z-10">
          <MapContainer
            center={initialCenter}
            zoom={13}
            scrollWheelZoom={true}
            className="w-full h-full"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
              className={mapTileClassName}
            />

            <MapResizer />
            <BoundsController
              points={allMapPoints}
              recenterTrigger={recenterTrigger}
              browserLocation={deviceLocation}
              routePoints={displayedActivePositions}
            />
            <LocateControl target={
              hasRealCoords(donorCoords) ? donorCoords :
              hasRealCoords(ngoCoords) ? ngoCoords :
              hasRealCoords(deviceLocation) ? deviceLocation : null
            } />
            {dropPinMode && <DropPinControl onPin={handleDroppedPin} />}

            {/* ── 1. DONOR MARKER (Green, Box, Always-visible label) ──────── */}
            {showDonorMarker && hasRealCoords(donorCoords) && (
              <Marker
                position={[donorCoords.lat, donorCoords.lng]}
                icon={createDonorIcon(
                  isDonorUser ? 'Your pickup location' : (activeDonation?.donorName || 'Donor'),
                  activeDonation?.isApproximatePickup || donorProfileCoords?.isApprox
                )}
              >
                <Popup className="foodbridge-custom-popup">
                  <div className="bg-white dark:bg-[#0F1A33] p-3.5 rounded-2xl border border-[#E5E1D8] dark:border-[#1E2D52] shadow-xl max-w-xs text-[#18315E] dark:text-white space-y-2">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">
                      <span>{isDonorUser ? 'Your Pickup Location' : 'Donor Pickup Location'}</span>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-[#18315E] dark:text-white">
                        {isDonorUser ? (user?.name || user?.fullName || 'You') : (activeDonation?.donorName || 'Donor')}
                      </h4>
                      <p className="text-xs text-[#60708B] dark:text-slate-300 mt-0.5 line-clamp-2">
                        {activeDonation?.pickupAddress || user?.address || 'Pickup address on file'}
                      </p>
                      {(activeDonation?.isApproximatePickup || donorProfileCoords?.isApprox) && (
                        <span className="inline-block mt-1 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                          Approximate location (from address text)
                        </span>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#E5E1D8] dark:border-[#1E2D52] flex flex-wrap gap-1.5">
                      {activeDonation?.donorPhone && (
                        <a
                          href={`tel:${activeDonation.donorPhone.replace(/[^0-9+]/g, '')}`}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-[#F3F0EA] dark:bg-[#0F1A33] text-[#18315E] dark:text-white text-[11px] font-bold rounded-lg border border-[#E5E1D8] dark:border-[#1E2D52] hover:bg-[#E5E1D8] transition-colors"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                      )}
                      <a
                        href={gmapsPinUrl(donorCoords.lat, donorCoords.lng)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-[#173B78] text-white text-[11px] font-bold rounded-lg hover:bg-[#0F172A] transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open in Google Maps</span>
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* ── 2. YOUR NGO MARKER (Navy, Building, Always-visible label) ─ */}
            {showNgoMarker && hasRealCoords(ngoCoords) && (
              <Marker
                position={[ngoCoords.lat, ngoCoords.lng]}
                icon={createNgoIcon(
                  isOrg ? 'Your NGO' : (activeDonation?.matchedNgoName || 'Destination NGO')
                )}
              >
                <Popup className="foodbridge-custom-popup">
                  <div className="bg-white dark:bg-[#0F1A33] p-3.5 rounded-2xl border border-[#E5E1D8] dark:border-[#1E2D52] shadow-xl max-w-xs text-[#18315E] dark:text-white space-y-2">
                    <div className="flex items-center gap-1.5 text-[#173B78] dark:text-[#D9B65D] font-extrabold text-xs">
                      <span>{isOrg ? 'Your NGO Hub' : 'Destination NGO'}</span>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-[#18315E] dark:text-white">
                        {isOrg
                          ? (user?.orgName || user?.name || 'Your Organisation')
                          : (activeDonation?.matchedNgoName || 'Verified NGO')}
                      </h4>
                      <p className="text-xs text-[#60708B] dark:text-slate-300 mt-0.5">
                        {(isOrg ? user?.address : activeDonation?.matchedNgoAddress) || 'Hub location on file'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#E5E1D8] dark:border-[#1E2D52] flex flex-wrap gap-1.5">
                      {activeDonation?.matchedNgoPhone && (
                        <a
                          href={`tel:${activeDonation.matchedNgoPhone.replace(/[^0-9+]/g, '')}`}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-[#F3F0EA] dark:bg-[#0F1A33] text-[#18315E] dark:text-white text-[11px] font-bold rounded-lg border border-[#E5E1D8] dark:border-[#1E2D52] hover:bg-[#E5E1D8] transition-colors"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                      )}
                      <a
                        href={gmapsPinUrl(ngoCoords.lat, ngoCoords.lng)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-[#173B78] text-white text-[11px] font-bold rounded-lg hover:bg-[#0F172A] transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open in Google Maps</span>
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* ── 3. VOLUNTEER MARKER (Orange, Bike, Live moving) ──────────── */}
            {showVolunteerMarker && hasRealCoords(volunteerCoords) && (
              <Marker
                position={[volunteerCoords.lat, volunteerCoords.lng]}
                icon={createVolunteerIcon({
                  name: activeDonation?.volunteerName || 'Volunteer',
                  secondsSinceUpdate,
                  isLocationPaused
                })}
              >
                <Popup className="foodbridge-custom-popup">
                  <div className="bg-white dark:bg-[#0F1A33] p-3.5 rounded-2xl border border-[#E5E1D8] dark:border-[#1E2D52] shadow-xl max-w-xs text-[#18315E] dark:text-white space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[#f97316] font-extrabold text-xs">
                        <span className={`w-2 h-2 rounded-full ${isLocationPaused ? 'bg-slate-400' : 'bg-[#f97316] animate-ping'}`} />
                        <span>Volunteer Live Position</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F3F0EA] text-[#18315E] dark:bg-[#0F1A33]/60 dark:text-[#D9B65D]">
                        {isLocationPaused ? 'Paused' : 'Live'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-sm">
                        {activeDonation?.volunteerName || 'Assigned Volunteer'}
                      </h4>
                      {activeDonation?.volunteerPhone && (
                        <p className="text-xs text-[#60708B] dark:text-slate-300 mt-0.5">
                          Phone: {activeDonation.volunteerPhone}
                        </p>
                      )}
                    </div>

                    <div className="text-[10px] text-[#60708B] dark:text-slate-400 space-y-0.5">
                      <div>Status: {isLocationPaused ? 'Location paused' : `Last updated ${secondsSinceUpdate ?? 0}s ago`}</div>
                      {volunteerUpdate?.accuracy && <div>Accuracy: ±{Math.round(volunteerUpdate.accuracy)}m</div>}
                      <div className="font-mono pt-0.5">{volunteerCoords.lat.toFixed(5)}, {volunteerCoords.lng.toFixed(5)}</div>
                    </div>

                    <div className="pt-2 border-t border-[#E5E1D8] dark:border-[#1E2D52] flex flex-wrap gap-1.5">
                      {activeDonation?.volunteerPhone && (
                        <a
                          href={`tel:${activeDonation.volunteerPhone.replace(/[^0-9+]/g, '')}`}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-[#F3F0EA] dark:bg-[#0F1A33] text-[#18315E] dark:text-white text-[11px] font-bold rounded-lg border border-[#E5E1D8] dark:border-[#1E2D52] hover:bg-[#E5E1D8] transition-colors"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                      )}
                      <a
                        href={gmapsPinUrl(volunteerCoords.lat, volunteerCoords.lng)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-[#f97316] text-white text-[11px] font-bold rounded-lg hover:bg-[#ea580c] transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open in Google Maps</span>
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* ── DROPPED PIN PREVIEW ─────────────────────────────────────── */}
            {dropPinMode && hasRealCoords(droppedPin) && (
              <Marker
                position={[droppedPin.lat, droppedPin.lng]}
                icon={createDonorIcon('Dropped Pin', false)}
                draggable
                eventHandlers={{
                  dragend: (e) => {
                    const latlng = e.target.getLatLng();
                    setDroppedPin({ lat: latlng.lat, lng: latlng.lng });
                  }
                }}
              >
                <Tooltip permanent direction="top" offset={[0, -20]}
                  className="!bg-[#173B78] !text-white !border-none !rounded-full !px-2.5 !py-1 !text-[11px] !font-black !shadow-md">
                  📍 Pin dropped (drag to adjust)
                </Tooltip>
              </Marker>
            )}

            {/* ── ROUTE POLYLINES (Part 2) ─────────────────────────────────── */}
            {/* Alternative routes (thin grey lines, click to switch) */}
            {activeLegRoute?.alternatives?.map((alt, i) => {
              if (activeAltIndex === i + 1 || !alt.positions || alt.positions.length < 2) return null;
              return (
                <Polyline
                  key={`alt-${i}`}
                  positions={alt.positions}
                  eventHandlers={{
                    click: () => setActiveAltIndex(i + 1)
                  }}
                  pathOptions={{
                    color: '#94a3b8',
                    weight: 3.5,
                    opacity: 0.65,
                    dashArray: '3, 6'
                  }}
                />
              );
            })}

            {/* Next leg (lighter dashed line: donor to NGO before pickup) */}
            {nextLegRoute && nextLegRoute.positions?.length >= 2 && (
              <Polyline
                positions={nextLegRoute.positions}
                pathOptions={{
                  color: '#fb923c',
                  weight: 4,
                  dashArray: '6, 8',
                  opacity: 0.8
                }}
              />
            )}

            {/* Active leg (solid orange line, or straight dashed if approx.) */}
            {displayedActivePositions.length >= 2 && (
              <Polyline
                positions={displayedActivePositions}
                pathOptions={{
                  color: '#f97316',
                  weight: 5,
                  opacity: 0.9,
                  dashArray: activeLegRoute?.isReal ? undefined : '6, 6'
                }}
              />
            )}
          </MapContainer>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default MapPage;
