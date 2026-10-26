/**
 * mapApi.js — Frontend helpers for geocoding, detailed Google routing,
 * and precise Google Maps URL creation.
 *
 * All external API keys remain strictly on the backend.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Geocode an address string -> { lat, lng, formattedAddress }
 * Returns null on failure (never throws).
 */
export const geocodeAddress = async (address, signal = null) => {
  if (!address || !address.trim()) return null;
  try {
    const res = await fetch(
      `${API_URL}/api/maps/geocode?address=${encodeURIComponent(address.trim())}`,
      { headers: authHeaders(), signal: signal || undefined }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data.lat === 'number' && typeof data.lng === 'number') return data;
    return null;
  } catch {
    return null;
  }
};

/**
 * Fetch a detailed driving route between two lat/lng points (with optional waypoints).
 * Returns { polyline, legs, distanceMeters, durationSeconds, distanceText, durationText, alternatives, source }
 * or null on failure.
 */
export const fetchRoute = async (origin, destination, waypoints = null, signal = null) => {
  if (!origin || !destination) return null;
  if (!Number.isFinite(origin.lat) || !Number.isFinite(origin.lng) ||
      !Number.isFinite(destination.lat) || !Number.isFinite(destination.lng)) {
    return null;
  }

  try {
    const o = `${Number(origin.lat).toFixed(6)},${Number(origin.lng).toFixed(6)}`;
    const d = `${Number(destination.lat).toFixed(6)},${Number(destination.lng).toFixed(6)}`;
    let url = `${API_URL}/api/maps/route?origin=${encodeURIComponent(o)}&destination=${encodeURIComponent(d)}`;

    if (Array.isArray(waypoints) && waypoints.length > 0) {
      const wpStr = waypoints
        .filter(w => w && Number.isFinite(w.lat) && Number.isFinite(w.lng))
        .map(w => `${Number(w.lat).toFixed(6)},${Number(w.lng).toFixed(6)}`)
        .join('|');
      if (wpStr) {
        url += `&waypoints=${encodeURIComponent(wpStr)}`;
      }
    } else if (typeof waypoints === 'string' && waypoints.trim()) {
      url += `&waypoints=${encodeURIComponent(waypoints.trim())}`;
    }

    const res = await fetch(url, { headers: authHeaders(), signal: signal || undefined });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && (data.polyline || data.overview_polyline || data.distanceMeters !== undefined)) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Format coordinate to at least 6 decimal places.
 */
export const formatCoord = (val) => Number(val).toFixed(6);

/**
 * Build the single primary Google Maps full route URL.
 * Built only from exact stored coordinates (at least 6 decimals, latitude first, URL-encoded).
 */
export const gmapsFullRouteUrl = ({ origin, destination, waypoints = null }) => {
  if (!origin || !destination) return '';
  if (!Number.isFinite(Number(origin.lat)) || !Number.isFinite(Number(origin.lng))) return '';
  if (!Number.isFinite(Number(destination.lat)) || !Number.isFinite(Number(destination.lng))) return '';

  const origStr = `${formatCoord(origin.lat)},${formatCoord(origin.lng)}`;
  const destStr = `${formatCoord(destination.lat)},${formatCoord(destination.lng)}`;

  let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origStr)}&destination=${encodeURIComponent(destStr)}&travelmode=driving`;

  if (Array.isArray(waypoints) && waypoints.length > 0) {
    const validWps = waypoints.filter(w => w && Number.isFinite(Number(w.lat)) && Number.isFinite(Number(w.lng)));
    if (validWps.length > 0) {
      const wpStr = validWps.map(w => `${formatCoord(w.lat)},${formatCoord(w.lng)}`).join('|');
      url += `&waypoints=${encodeURIComponent(wpStr)}`;
    }
  } else if (waypoints && Number.isFinite(Number(waypoints.lat)) && Number.isFinite(Number(waypoints.lng))) {
    const wpStr = `${formatCoord(waypoints.lat)},${formatCoord(waypoints.lng)}`;
    url += `&waypoints=${encodeURIComponent(wpStr)}`;
  }

  return url;
};

/**
 * Build a Google Maps spot search URL for popups.
 * Built strictly from stored coordinates (at least 6 decimals).
 */
export const gmapsPinUrl = (lat, lng, placeId = null) => {
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return '';
  const query = `${formatCoord(lat)},${formatCoord(lng)}`;
  let url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  if (placeId) {
    url += `&query_place_id=${encodeURIComponent(placeId)}`;
  }
  return url;
};

/**
 * Legacy navigation URL helper (for volunteer pickup page).
 */
export const gmapsNavUrl = (lat, lng, mode = 'driving') => {
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return '';
  return `https://www.google.com/maps/dir/?api=1&destination=${formatCoord(lat)},${formatCoord(lng)}&travelmode=${mode}&dir_action=navigate`;
};

/**
 * Compute traffic condition label (Light, Moderate, Heavy).
 * Only returns when durationInTraffic and normalDuration are present and positive.
 */
export const computeTrafficCondition = (durationInTrafficSec, normalDurationSec) => {
  if (!durationInTrafficSec || !normalDurationSec || normalDurationSec <= 0) return null;
  const ratio = durationInTrafficSec / normalDurationSec;
  if (ratio >= 1.35) return { label: 'Heavy', color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800' };
  if (ratio >= 1.15) return { label: 'Moderate', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' };
  return { label: 'Light', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' };
};

/**
 * Decode a Google Maps encoded polyline into an array of [lat, lng] pairs.
 */
export const decodePolyline = (encoded) => {
  if (!encoded || typeof encoded !== 'string') return [];
  const points = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
};
