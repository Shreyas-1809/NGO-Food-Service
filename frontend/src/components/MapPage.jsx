import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Radio, Crosshair, Truck, X, WifiOff, MapPin, Navigation, Compass, AlertCircle } from 'lucide-react';
import { T } from '../context/LanguageContext';
import ErrorBoundary from './ErrorBoundary';
import { calculateDistanceKm } from '../services/mapsService';

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

// Coordinate validator & extractor
export const isValidCoord = (lat, lng) =>
  Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

export const getCoords = (item) => {
  if (!item) return null;
  if (item.lat !== undefined && item.lng !== undefined && isValidCoord(item.lat, item.lng)) {
    return { lat: Number(item.lat), lng: Number(item.lng) };
  }
  if (item.latitude !== undefined && item.longitude !== undefined && isValidCoord(item.latitude, item.longitude)) {
    return { lat: Number(item.latitude), lng: Number(item.longitude) };
  }

  const loc = item.location || item.pickupCoords || item.ngoCoords || item.volunteerCoords || item;
  if (!loc) return null;

  if (loc.coordinates && Array.isArray(loc.coordinates) && loc.coordinates.length >= 2 && isValidCoord(loc.coordinates[1], loc.coordinates[0])) {
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

// Backend GeoJSON fields (Food.location / User.location) default to [0, 0].
// Treat "null island" as "no coordinates saved" so we never draw fake markers.
const hasRealCoords = (coords) =>
  Boolean(coords) &&
  isValidCoord(coords.lat, coords.lng) &&
  !(Math.abs(Number(coords.lat)) < 1e-6 && Math.abs(Number(coords.lng)) < 1e-6);


// Custom Marker Icons
const createDonorIcon = () => {
  const markerHtml = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; width: 36px; height: 36px;">
      <div style="
        background-color: #10b981;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 16px;
      ">📦</div>
    </div>
  `;
  return L.divIcon({
    html: markerHtml,
    className: 'custom-leaflet-marker donor-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

const createNgoIcon = () => {
  const markerHtml = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; width: 36px; height: 36px;">
      <div style="
        background-color: #8b5cf6;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 16px;
      ">🏢</div>
    </div>
  `;
  return L.divIcon({
    html: markerHtml,
    className: 'custom-leaflet-marker ngo-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

const createVolunteerIcon = ({ secondsSinceUpdate = null, isLocationPaused = false } = {}) => {
  const statusLabel = isLocationPaused
    ? 'Paused'
    : secondsSinceUpdate !== null
    ? `${secondsSinceUpdate}s ago`
    : 'Live';

  const markerHtml = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; width: 140px; margin-left: -52px;">
      <div style="position: relative; width: 36px; height: 36px;">
        ${!isLocationPaused ? `
        <div style="
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          background-color: #f97316;
          opacity: 0.4;
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>` : ''}
        <div style="
          position: relative;
          background-color: ${isLocationPaused ? '#64748b' : '#f97316'};
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 17px;
        ">🚚</div>
      </div>
      <div style="
        margin-top: 3px;
        background: ${isLocationPaused ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.92)'};
        color: ${isLocationPaused ? '#fca5a5' : '#fed7aa'};
        font-size: 10px;
        font-weight: 800;
        padding: 2px 8px;
        border-radius: 9999px;
        white-space: nowrap;
        border: 1px solid ${isLocationPaused ? 'rgba(239, 68, 68, 0.6)' : 'rgba(249, 115, 22, 0.6)'};
        box-shadow: 0 2px 8px rgba(0,0,0,0.35);
        backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        gap: 4px;
      ">
        <span style="
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: ${isLocationPaused ? '#ef4444' : '#f97316'};
        "></span>
        <span>Volunteer (Live) • ${statusLabel}</span>
      </div>
    </div>
  `;
  return L.divIcon({
    html: markerHtml,
    className: 'custom-leaflet-marker volunteer-marker',
    iconSize: [36, 56],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const timer = setTimeout(() => map.invalidateSize(), 300);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

// Bounds controller: fits viewport to include Donor, NGO, and Volunteer points
// on page load and when the volunteer first appears, without refitting on every movement.
// Refits when user clicks the "Recenter" button.
const BoundsController = ({ points, recenterTrigger }) => {
  const map = useMap();
  const initialFitDoneRef = useRef(false);
  const volunteerFirstSeenRef = useRef(false);
  const lastTriggerRef = useRef(recenterTrigger);

  const validPoints = useMemo(() => {
    return (points || []).filter(hasRealCoords).map(p => [p.lat, p.lng]);
  }, [points]);

  const fitBoundsNow = useCallback(() => {
    if (validPoints.length === 0) return;
    if (validPoints.length === 1) {
      map.flyTo(validPoints[0], 14, { animate: true });
    } else {
      const bounds = L.latLngBounds(validPoints);
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [70, 70], maxZoom: 15 });
      }
    }
  }, [validPoints, map]);

  // Initial fit on page load once valid points exist
  useEffect(() => {
    if (!initialFitDoneRef.current && validPoints.length > 0) {
      fitBoundsNow();
      initialFitDoneRef.current = true;
    }
  }, [validPoints, fitBoundsNow]);

  // Fit when volunteer marker first appears
  const hasVolunteer = Boolean(points?.find(p => p?.isVolunteer && hasRealCoords(p)));
  useEffect(() => {
    if (!volunteerFirstSeenRef.current && hasVolunteer && validPoints.length > 1) {
      fitBoundsNow();
      volunteerFirstSeenRef.current = true;
    }
  }, [hasVolunteer, validPoints.length, fitBoundsNow]);

  // Manual recenter button trigger
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
      // Real browser geolocation — never a simulated position
      map.locate({ enableHighAccuracy: true });
      map.once('locationfound', (e) => map.flyTo(e.latlng, 15, { animate: true }));
    }
  };

  return (
    <div className="leaflet-bottom leaflet-right mb-6 mr-4 z-[400]">
      <button
        onClick={handleLocate}
        className="bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 w-10 h-10 flex items-center justify-center transition-all rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-700/80 backdrop-blur-md cursor-pointer"
        title="Locate Me"
      >
        <Crosshair className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
      </button>
    </div>
  );
};

// ── Donation stage helpers ──────────────────────────────────────────────────
// Normalizes both vocabularies into one simple stage:
//   DONE      → delivered / cancelled (nothing to track)
//   TO_NGO    → food picked up, volunteer heading to the NGO (draw route)
//   TO_DONOR  → volunteer assigned, food not picked up yet (markers only)
//   WAITING   → donation accepted, no volunteer yet (no volunteer marker)
const getStage = (d) => {
  if (!d) return 'NONE';
  const status = String(d.status || '').toUpperCase();
  const vStatus = String(d.volunteerStatus || '').toLowerCase();
  if (['DELIVERED', 'COMPLETED', 'CANCELLED', 'REJECTED', 'DECLINED', 'NON_CLAIMED'].includes(status) || vStatus === 'delivered') {
    return 'DONE';
  }
  if (['IN_TRANSIT', 'FOOD_PICKED_UP'].includes(status) || vStatus === 'picked_up') {
    return 'TO_NGO';
  }
  if (Array.isArray(d.trackingTimeline) &&
      d.trackingTimeline.some(s => s && s.completed && ['FOOD_PICKED_UP', 'IN_TRANSIT'].includes(String(s.status || '').toUpperCase()))) {
    return 'TO_NGO';
  }
  if (['MATCHED', 'VOLUNTEER_ASSIGNED', 'CLAIMED', 'ACCEPTED'].includes(status) || ['assigned', 'accepted', 'en_route'].includes(vStatus)) {
    return 'TO_DONOR';
  }
  return 'WAITING';
};

// Normalize donation from backend / active-pickups (REAL data only)
export const normalizeApiDonation = (f) => {
  if (!f) return null;
  const donorObj = f.donorId && typeof f.donorId === 'object' ? f.donorId : null;
  const claimantObj = f.claimantId && typeof f.claimantId === 'object' ? f.claimantId : null;
  const volAssignment = (Array.isArray(f.volunteerAssignments) && f.volunteerAssignments[0]) || f.volunteerAssignment || null;

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
    claimantId: claimantObj ? (claimantObj._id || claimantObj.id) : f.claimantId,
    matchedNgoId: claimantObj ? (claimantObj._id || claimantObj.id) : (f.matchedNgoId || f.claimantId),
    matchedNgoName: claimantObj?.orgName || claimantObj?.fullName || f.matchedNgoName || '',
    matchedNgoAddress: claimantObj?.address ? [claimantObj.address, claimantObj.city].filter(Boolean).join(', ') : '',
    matchedNgoPhone: claimantObj?.phone || '',
    ngoCoords: hasRealCoords(rawNgo) ? rawNgo : null,
    volunteerId: volAssignment?.volunteerId || f.volunteerId || null,
    volunteerName: volAssignment?.name || f.volunteerName || 'Assigned Volunteer',
    volunteerPhone: volAssignment?.phone || f.volunteerPhone || '',
    volunteerLiveLocation: f.volunteerLiveLocation && hasRealCoords({ lat: f.volunteerLiveLocation.lat, lng: f.volunteerLiveLocation.lng })
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

const MapPage = ({ user }) => {
  const [searchParams] = useSearchParams();
  const donationParam = searchParams.get('donation');

  const isOrg = user?.accountType === 'ORGANISATION' ||
                user?.accountType === 'ORGANIZATION' ||
                user?.role === 'ORGANISATION' ||
                user?.role === 'ORGANIZATION' ||
                Boolean(user?.orgName);

  const isDonorUser = user?.accountType === 'DONOR' || user?.role === 'DONOR';
  const isVolunteerUser = user?.accountType === 'VOLUNTEER' || user?.role === 'VOLUNTEER';

  const [donations, setDonations] = useState([]);
  const [selectedDonationId, setSelectedDonationId] = useState(donationParam || null);
  const [liveVolunteerLocations, setLiveVolunteerLocations] = useState({});
  const [socketConnected, setSocketConnected] = useState(true);
  const [hintDismissed, setHintDismissed] = useState(false);
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  // NGO location state & saving
  const [savingLocation, setSavingLocation] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [ngoProfileCoords, setNgoProfileCoords] = useState(() => {
    const coords = getCoords(user?.location);
    return hasRealCoords(coords) ? coords : null;
  });

  useEffect(() => {
    const saved = getCoords(user?.location);
    if (hasRealCoords(saved)) {
      setNgoProfileCoords(saved);
    }
  }, [user]);

  // Dark mode detection
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Browser geolocation (for locate-me button only, never substituted for NGO or donor)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setDeviceLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log('Geolocation error:', err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  }, []);

  // Load Donations — REAL data only from backend:
  const loadDonations = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setDonations([]);
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };
    axios.get(`${API_URL}/api/food/active-pickups`, { headers })
      .then(res => {
        const apiDons = Array.isArray(res.data) ? res.data.map(normalizeApiDonation).filter(Boolean) : [];
        setDonations(apiDons);
      })
      .catch(err => {
        console.log('Active pickups fetch failed:', err.message);
        setDonations([]);
      });
  }, []);

  useEffect(() => {
    loadDonations();
  }, [loadDonations]);

  // Handle URL query parameter ?donation=<donationId>
  useEffect(() => {
    if (donationParam) {
      setSelectedDonationId(donationParam);
      const token = localStorage.getItem('token');
      if (token) {
        axios.get(`${API_URL}/api/food/${donationParam}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
          if (res.data) {
            const normalized = normalizeApiDonation(res.data);
            if (normalized) {
              setDonations(prev => {
                const exists = prev.some(d => String(d.id) === String(normalized.id));
                if (exists) {
                  return prev.map(d => String(d.id) === String(normalized.id) ? normalized : d);
                }
                return [normalized, ...prev];
              });
            }
          }
        }).catch(err => {
          console.log('Single donation fetch failed:', err.message);
        });
      }
    }
  }, [donationParam]);

  // "Use my current location" handler for NGO profile
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
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
          setNgoProfileCoords({ lat, lng });
          setLocationSuccess(true);
          setTimeout(() => setLocationSuccess(false), 4000);
          window.dispatchEvent(new Event('user-updated'));
        } catch (err) {
          console.error('Failed to save NGO location:', err);
          alert('Failed to save your location to your profile. Please try again.');
        } finally {
          setSavingLocation(false);
        }
      },
      (err) => {
        setSavingLocation(false);
        console.error('Geolocation error:', err);
        alert('Could not get your browser location. Please allow location access in your browser settings.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Socket.io: subscribe on mount, auto-rejoin and refresh on reconnect.
  useEffect(() => {
    const socket = io(API_URL, { transports: ['websocket', 'polling'] });

    const joinRoom = () => {
      const uid = user?.id || user?._id;
      if (uid) {
        socket.emit('join_room', uid);
        socket.emit('join_room', `room:${uid}`);
      }
    };

    const handleConnect = () => {
      setSocketConnected(true);
      joinRoom();
      loadDonations();

      // If a donation is selected, refetch to guarantee latest persisted volunteer coordinates
      if (selectedDonationId) {
        const token = localStorage.getItem('token');
        if (token) {
          axios.get(`${API_URL}/api/food/${selectedDonationId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }).then(res => {
            if (res.data?.volunteerLiveLocation) {
              const v = res.data.volunteerLiveLocation;
              if (isValidCoord(v.lat, v.lng)) {
                setLiveVolunteerLocations(prev => ({
                  ...prev,
                  [String(selectedDonationId)]: {
                    lat: Number(v.lat),
                    lng: Number(v.lng),
                    accuracy: v.accuracy,
                    receivedAt: v.updatedAt ? Date.parse(v.updatedAt) : Date.now()
                  }
                }));
              }
            }
          }).catch(err => console.log('Re-fetch on reconnect error:', err.message));
        }
      }
    };

    const handleDisconnect = () => {
      setSocketConnected(false); // keep last known position while offline
    };

    socket.on('connect', handleConnect);
    if (socket.io) {
      socket.io.on('reconnect', handleConnect);
    }
    if (socket.connected) handleConnect();

    const handleVolunteerLoc = (payload) => {
      const targetId = payload?.donationId || payload?.taskId;
      if (!targetId) return;
      if (!isValidCoord(payload.lat, payload.lng)) return;
      const lat = Number(payload.lat);
      const lng = Number(payload.lng);
      if (Math.abs(lat) < 1e-6 && Math.abs(lng) < 1e-6) return; // ignore null island

      // Store the real update with the time received
      setLiveVolunteerLocations(prev => ({
        ...prev,
        [String(targetId)]: {
          lat,
          lng,
          accuracy: payload.accuracy,
          receivedAt: Date.now()
        }
      }));
    };

    const handleStatusUpdate = () => loadDonations();

    socket.on('VOLUNTEER_LOCATION', handleVolunteerLoc);
    socket.on('TASK_UPDATED', handleStatusUpdate);
    socket.on('LISTING_UPDATED', handleStatusUpdate);
    socket.on('PICKUP_CONFIRMED', handleStatusUpdate);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      if (socket.io) socket.io.off('reconnect', handleConnect);
      socket.off('VOLUNTEER_LOCATION', handleVolunteerLoc);
      socket.off('TASK_UPDATED', handleStatusUpdate);
      socket.off('LISTING_UPDATED', handleStatusUpdate);
      socket.off('PICKUP_CONFIRMED', handleStatusUpdate);
      socket.off('disconnect', handleDisconnect);
      socket.disconnect();
    };
  }, [loadDonations, user?.id, user?._id, selectedDonationId]);

  // Filter relevant donations for the current user.
  // For NGOs: ONLY donations claimed/matched by this NGO (never other NGOs).
  const relevantDonations = useMemo(() => {
    const uid = user?.id || user?._id ? String(user?.id || user?._id) : null;
    const uName = user?.name || user?.fullName || user?.orgName;

    return donations.filter(d => {
      if (getStage(d) === 'DONE') return false; // hide delivered/cancelled

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
    }).sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  }, [donations, user, isOrg, isDonorUser, isVolunteerUser]);

  // Pick the most interesting donation to track (selected first, or in-transit first)
  const activeDonation = useMemo(() => {
    if (relevantDonations.length === 0) return null;
    if (selectedDonationId) {
      const selected = relevantDonations.find(d => String(d.id) === String(selectedDonationId) || String(d._id) === String(selectedDonationId));
      if (selected) return selected;
    }
    return relevantDonations.find(d => getStage(d) === 'TO_NGO') || relevantDonations[0];
  }, [relevantDonations, selectedDonationId]);

  const stage = getStage(activeDonation);
  const isTrackingActive = Boolean(activeDonation) && (stage === 'TO_DONOR' || stage === 'TO_NGO');

  // ── Centre & markers: NGO's REAL saved location only
  const ngoCoords = useMemo(() => {
    if (ngoProfileCoords && hasRealCoords(ngoProfileCoords)) {
      return ngoProfileCoords;
    }
    if (isOrg) {
      const saved = getCoords(user?.location);
      if (hasRealCoords(saved)) return saved;
    }
    const fromDonation = getCoords(activeDonation?.ngoCoords);
    if (hasRealCoords(fromDonation)) return fromDonation;
    return null;
  }, [ngoProfileCoords, isOrg, user, activeDonation]);

  // Donor pickup point — only for the active (accepted) donation with real coordinates
  const donorCoords = useMemo(() => {
    if (!activeDonation) return null;
    const c = getCoords(activeDonation.pickupCoords || activeDonation.location || activeDonation.donorId);
    return hasRealCoords(c) ? c : null;
  }, [activeDonation]);

  // REAL volunteer position: the last socket update or persisted backend position
  const volunteerUpdate = useMemo(() => {
    if (!activeDonation) return null;
    const donId = String(activeDonation.id);
    const live = liveVolunteerLocations[donId] || (activeDonation._id && liveVolunteerLocations[String(activeDonation._id)]);
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

  const volunteerCoords = volunteerUpdate
    ? { lat: volunteerUpdate.lat, lng: volunteerUpdate.lng }
    : null;

  // Safe camera initial center
  const initialCenter = useMemo(() => {
    if (hasRealCoords(ngoCoords)) return [ngoCoords.lat, ngoCoords.lng];
    if (hasRealCoords(donorCoords)) return [donorCoords.lat, donorCoords.lng];
    if (hasRealCoords(volunteerCoords)) return [volunteerCoords.lat, volunteerCoords.lng];
    if (hasRealCoords(deviceLocation)) return [deviceLocation.lat, deviceLocation.lng];
    return [20.5937, 78.9629]; // Country-level overview if no coords saved yet; no markers placed
  }, [ngoCoords, donorCoords, volunteerCoords, deviceLocation]);

  const initialZoom = useMemo(() => {
    if (hasRealCoords(ngoCoords) || hasRealCoords(donorCoords) || hasRealCoords(volunteerCoords) || hasRealCoords(deviceLocation)) {
      return 13;
    }
    return 4;
  }, [ngoCoords, donorCoords, volunteerCoords, deviceLocation]);

  // Ticking clock for "Xs ago" / staleness
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

  const showDonorMarker = Boolean(donorCoords) && (stage === 'TO_DONOR' || stage === 'TO_NGO');
  const showVolunteerMarker = Boolean(volunteerCoords) && isTrackingActive;

  // Missing-data notices
  const ngoLocationMissing = isOrg && !hasRealCoords(ngoCoords);
  const donorLocationMissing = isTrackingActive && !hasRealCoords(donorCoords);
  const volunteerLocationWaiting = isTrackingActive && !volunteerUpdate;

  // Polyline routes:
  // 1. Volunteer heading to Donor (TO_DONOR)
  const showRouteToDonor = stage === 'TO_DONOR' && Boolean(volunteerCoords) && Boolean(donorCoords);
  // 2. Volunteer heading to NGO (TO_NGO)
  const showRouteToNgo = stage === 'TO_NGO' && Boolean(volunteerCoords) && Boolean(ngoCoords);

  // Distance & ETA calculation
  const routeInfo = useMemo(() => {
    if (showRouteToNgo && volunteerCoords && ngoCoords) {
      const distKm = calculateDistanceKm(volunteerCoords, ngoCoords);
      const etaMins = Math.max(1, Math.round((distKm / 25) * 60));
      return { distKm, etaMins, destination: 'NGO' };
    }
    if (showRouteToDonor && volunteerCoords && donorCoords) {
      const distKm = calculateDistanceKm(volunteerCoords, donorCoords);
      const etaMins = Math.max(1, Math.round((distKm / 25) * 60));
      return { distKm, etaMins, destination: 'Donor' };
    }
    return null;
  }, [showRouteToNgo, showRouteToDonor, volunteerCoords, ngoCoords, donorCoords]);

  const statusChip = useMemo(() => {
    if (!activeDonation) return null;
    if (stage === 'TO_NGO') {
      return routeInfo
        ? `Food on the way to you • ${routeInfo.distKm} km • ~${routeInfo.etaMins} min`
        : 'Food on the way to you';
    }
    if (stage === 'TO_DONOR') {
      return routeInfo
        ? `Volunteer heading to donor • ${routeInfo.distKm} km • ~${routeInfo.etaMins} min`
        : 'Volunteer heading to donor';
    }
    return null;
  }, [activeDonation, stage, routeInfo]);

  // Gather all valid points for BoundsController
  const allMapPoints = useMemo(() => {
    const list = [];
    if (hasRealCoords(donorCoords)) list.push({ ...donorCoords, isDonor: true });
    if (hasRealCoords(ngoCoords)) list.push({ ...ngoCoords, isNgo: true });
    if (hasRealCoords(volunteerCoords)) list.push({ ...volunteerCoords, isVolunteer: true });
    return list;
  }, [donorCoords, ngoCoords, volunteerCoords]);

  const mapTileClassName = isDark ? 'map-tiles-dark' : undefined;

  return (
    <ErrorBoundary>
      <div className="w-full h-[calc(100vh-64px)] relative flex flex-col bg-slate-900 overflow-hidden select-none">

        {/* Dark-mode styling for OpenStreetMap tiles */}
        <style>{`
          .map-tiles-dark,
          .map-tiles-dark img {
            filter: invert(1) hue-rotate(180deg);
          }
        `}</style>

        {/* RECENTER BUTTON (Top-Right) */}
        <div className="absolute top-4 right-4 z-[400] flex items-center gap-2">
          <button
            onClick={() => setRecenterTrigger(prev => prev + 1)}
            className="bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 px-3.5 py-2 rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
            title="Fit all markers in view"
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Recenter</span>
          </button>
        </div>

        {/* SLIM HEADER PILL & NOTICES (Top-Left) */}
        <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2 pointer-events-none max-w-[calc(100%-6rem)]">
          <div className="pointer-events-auto flex items-center space-x-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-2 px-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-lg">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
              <Radio className={`w-4 h-4 ${isTrackingActive ? 'animate-pulse' : ''}`} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
                <T text="LIVE TRACKING" />
                {isTrackingActive && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                )}
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">
                {activeDonation
                  ? `${activeDonation.donorName || 'Donor'} → Your NGO`
                  : 'Your NGO location'}
              </p>
            </div>

            {/* Donation selector — when there is more than one active donation */}
            {relevantDonations.length > 1 && (
              <div className="relative ml-1 pl-2 border-l border-slate-200 dark:border-slate-800">
                <select
                  value={activeDonation ? activeDonation.id : ''}
                  onChange={(e) => setSelectedDonationId(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs py-1.5 pl-3 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500 max-w-[180px]"
                >
                  {relevantDonations.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.title || d.itemName || 'Food Listing'} ({getStage(d) === 'TO_NGO' ? 'On the way' : 'Assigned'})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* NOTICES */}
          {volunteerLocationWaiting && (
            <div className="pointer-events-auto self-start flex items-center space-x-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-lg text-[11px] font-bold text-slate-600 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse shrink-0"></span>
              <span>Waiting for volunteer location...</span>
            </div>
          )}

          {/* NGO Location missing: Use my current location banner */}
          {ngoLocationMissing && (
            <div className="pointer-events-auto self-start max-w-sm bg-purple-50/95 dark:bg-purple-950/90 text-purple-950 dark:text-purple-100 border border-purple-200/80 dark:border-purple-800/80 backdrop-blur-md p-3 rounded-2xl shadow-lg text-[11px] font-bold flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>Your NGO location is not saved to your profile</span>
              </div>
              <p className="text-[10px] text-slate-600 dark:text-slate-300 font-normal">
                Save your location so donors and volunteers can see your hub on the map.
              </p>
              <button
                onClick={handleUseCurrentLocation}
                disabled={savingLocation}
                className="self-start flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Compass className={`w-3.5 h-3.5 ${savingLocation ? 'animate-spin' : ''}`} />
                <span>{savingLocation ? 'Saving location...' : 'Use my current location'}</span>
              </button>
            </div>
          )}

          {locationSuccess && (
            <div className="pointer-events-auto self-start bg-emerald-50/95 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-800/80 backdrop-blur-md px-3.5 py-1.5 rounded-2xl shadow-lg text-[11px] font-bold flex items-center gap-1.5">
              <span>✓ Hub location saved to profile!</span>
            </div>
          )}

          {/* Donor Location Missing notice */}
          {donorLocationMissing && (
            <div className="pointer-events-auto self-start max-w-sm bg-amber-50/95 dark:bg-amber-950/90 text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/80 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg text-[11px] font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Donor pickup location coordinates not available for this donation</span>
            </div>
          )}

          {/* STATUS CHIP */}
          {statusChip && (
            <div className="pointer-events-auto self-start flex items-center space-x-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-lg text-[11px] font-extrabold text-slate-800 dark:text-slate-100">
              {stage === 'TO_NGO'
                ? <Truck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                : <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0"></span>}
              <span>{statusChip}</span>
            </div>
          )}

          {/* RECONNECTING CHIP */}
          {!socketConnected && (
            <div className="pointer-events-auto self-start flex items-center space-x-1.5 bg-amber-50/95 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-900/80 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg text-[10px] font-bold">
              <WifiOff className="w-3 h-3 shrink-0" />
              <span>Reconnecting...</span>
            </div>
          )}
        </div>

        {/* MAP CONTAINER */}
        <div className="w-full flex-1 relative z-10">
          <MapContainer
            center={initialCenter}
            zoom={initialZoom}
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
            <BoundsController points={allMapPoints} recenterTrigger={recenterTrigger} />
            <LocateControl target={hasRealCoords(deviceLocation) ? deviceLocation : (hasRealCoords(ngoCoords) ? ngoCoords : null)} />

            {/* 1. YOUR NGO HUB — with permanent label */}
            {hasRealCoords(ngoCoords) && (
              <Marker position={[ngoCoords.lat, ngoCoords.lng]} icon={createNgoIcon()}>
                <Tooltip
                  permanent
                  direction="top"
                  offset={[0, -18]}
                  className="!bg-purple-700 !text-white !border-none !rounded-full !px-2.5 !py-1 !text-[11px] !font-black !shadow-md"
                >
                  🟣 Your NGO Hub
                </Tooltip>
                <Popup className="foodbridge-custom-popup">
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl max-w-xs text-slate-900 dark:text-white">
                    <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400 font-black text-xs">
                      <span>🏢 Your NGO Hub</span>
                    </div>
                    <h4 className="font-extrabold text-sm mt-1">
                      {user?.orgName || user?.name || activeDonation?.matchedNgoName || 'Your organisation'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {user?.address || activeDonation?.matchedNgoAddress || 'Destination hub location'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-1.5">
                      Lat: {ngoCoords.lat.toFixed(5)}, Lng: {ngoCoords.lng.toFixed(5)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* 2. DONOR PICKUP POINT — with permanent label */}
            {showDonorMarker && hasRealCoords(donorCoords) && (
              <Marker position={[donorCoords.lat, donorCoords.lng]} icon={createDonorIcon()}>
                <Tooltip
                  permanent
                  direction="top"
                  offset={[0, -18]}
                  className="!bg-emerald-700 !text-white !border-none !rounded-full !px-2.5 !py-1 !text-[11px] !font-black !shadow-md"
                >
                  🟢 Donor (Pickup Point)
                </Tooltip>
                <Popup className="foodbridge-custom-popup">
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl max-w-xs text-slate-900 dark:text-white">
                    <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-black text-xs">
                      <span>📦 Donor (Pickup Point)</span>
                    </div>
                    <h4 className="font-extrabold text-sm mt-1">
                      {activeDonation?.donorName || 'Donor'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {activeDonation?.pickupAddress || 'Pickup address on file'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-1.5">
                      Lat: {donorCoords.lat.toFixed(5)}, Lng: {donorCoords.lng.toFixed(5)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* 3. VOLUNTEER — with permanent label and live pulse */}
            {showVolunteerMarker && hasRealCoords(volunteerCoords) && (
              <Marker
                position={[volunteerCoords.lat, volunteerCoords.lng]}
                icon={createVolunteerIcon({ secondsSinceUpdate, isLocationPaused })}
              >
                <Tooltip
                  permanent
                  direction="top"
                  offset={[0, -22]}
                  className="!bg-amber-600 !text-white !border-none !rounded-full !px-2.5 !py-1 !text-[11px] !font-black !shadow-md"
                >
                  🟠 Volunteer (Live)
                </Tooltip>
                <Popup className="foodbridge-custom-popup">
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl max-w-xs text-slate-900 dark:text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-black text-xs">
                        <span className={`w-2 h-2 rounded-full ${isLocationPaused ? 'bg-red-500' : 'bg-emerald-500 animate-ping'}`}></span>
                        <span>🚚 Volunteer Position</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isLocationPaused ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'}`}>
                        {isLocationPaused ? 'Paused' : 'Live'}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm mt-1.5">
                      {activeDonation?.volunteerName || 'Assigned Volunteer'}
                    </h4>
                    {activeDonation?.volunteerPhone && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Phone: {activeDonation.volunteerPhone}
                      </p>
                    )}

                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1 text-[11px]">
                      <div className="text-slate-600 dark:text-slate-300 flex justify-between">
                        <span>Status:</span>
                        <strong className={isLocationPaused ? 'text-red-500 font-bold' : 'text-emerald-500 font-bold'}>
                          {isLocationPaused ? 'Location paused' : `Last updated ${secondsSinceUpdate ?? 0}s ago`}
                        </strong>
                      </div>
                      {volunteerUpdate?.accuracy && (
                        <div className="text-slate-500 dark:text-slate-400 flex justify-between">
                          <span>Accuracy:</span>
                          <span>±{Math.round(volunteerUpdate.accuracy)}m</span>
                        </div>
                      )}
                      <div className="text-slate-400 dark:text-slate-500 font-mono text-[10px] pt-1">
                        Lat: {volunteerCoords.lat.toFixed(5)}, Lng: {volunteerCoords.lng.toFixed(5)}
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* ROUTE LINE: Volunteer → Donor (heading to pickup) */}
            {showRouteToDonor && (
              <Polyline
                positions={[
                  [volunteerCoords.lat, volunteerCoords.lng],
                  [donorCoords.lat, donorCoords.lng]
                ]}
                pathOptions={{
                  color: '#f97316',
                  weight: 4,
                  dashArray: '6, 6',
                  opacity: 0.85
                }}
              />
            )}

            {/* ROUTE LINE: Volunteer → NGO (food picked up, heading to hub) */}
            {showRouteToNgo && (
              <Polyline
                positions={[
                  [volunteerCoords.lat, volunteerCoords.lng],
                  [ngoCoords.lat, ngoCoords.lng]
                ]}
                pathOptions={{
                  color: '#10b981',
                  weight: 4,
                  opacity: 0.9
                }}
              />
            )}

          </MapContainer>
        </div>

        {/* MAP LEGEND */}
        <div className="absolute bottom-6 left-6 z-[400] pointer-events-none">
          <div className="pointer-events-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl space-y-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-200">
            <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Map Legend</div>
            {hasRealCoords(ngoCoords) && (
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-purple-500 border border-white shadow-xs"></span>
                <span>Your NGO Hub</span>
              </div>
            )}
            {showDonorMarker && (
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white shadow-xs"></span>
                <span>Donor (Pickup Point)</span>
              </div>
            )}
            {showVolunteerMarker && (
              <div className="flex items-center space-x-2">
                <span className={`w-3 h-3 rounded-full ${isLocationPaused ? 'bg-slate-400' : 'bg-amber-500 animate-pulse'} border border-white shadow-xs`}></span>
                <span>Volunteer {isLocationPaused ? '(Paused)' : '(Live)'}</span>
              </div>
            )}
          </div>
        </div>

        {/* HINT CHIP */}
        {!isTrackingActive && !hintDismissed && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] max-w-[calc(100%-3rem)]">
            <div className="flex items-center space-x-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pl-4 pr-2 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-lg text-[11px] font-bold text-slate-600 dark:text-slate-300">
              <Radio className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Live tracking starts once a volunteer is assigned</span>
              <button
                onClick={() => setHintDismissed(true)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>
    </ErrorBoundary>
  );
};

export default MapPage;
