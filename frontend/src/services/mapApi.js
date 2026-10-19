/**
 * mapApi.js — Frontend helpers that call the authenticated backend proxy
 * for Google Maps geocoding and route data.
 *
 * The API key never leaves the backend; every call here goes to /api/maps/*.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Geocode an address string → { lat, lng, formattedAddress }
 * Returns null on failure (never throws).
 */
export const geocodeAddress = async (address) => {
  if (!address || !address.trim()) return null;
  try {
    const res = await fetch(
      `${API_URL}/api/maps/geocode?address=${encodeURIComponent(address.trim())}`,
      { headers: authHeaders() }
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
 * Fetch a driving route between two lat/lng points.
 * Returns { polyline, distanceMeters, durationSeconds, distanceText, durationText }
 * or null on failure.
 */
export const fetchRoute = async (origin, destination) => {
  if (!origin || !destination) return null;
  try {
    const o = `${origin.lat},${origin.lng}`;
    const d = `${destination.lat},${destination.lng}`;
    const res = await fetch(
      `${API_URL}/api/maps/route?origin=${encodeURIComponent(o)}&destination=${encodeURIComponent(d)}`,
      { headers: authHeaders() }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.distanceMeters !== undefined) return data;
    return null;
  } catch {
    return null;
  }
};

/**
 * Build a Google Maps "navigate to" deep link (opens in a new tab).
 * travelmode defaults to 'driving'.
 */
export const gmapsNavUrl = (lat, lng, mode = 'driving') =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=${mode}`;

/**
 * Build a Google Maps "pin" link — just shows the location.
 */
export const gmapsPinUrl = (lat, lng) =>
  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

/**
 * Decode a Google Maps encoded polyline into an array of [lat, lng] pairs
 * suitable for Leaflet's Polyline component.
 *
 * Implements the Google polyline encoding algorithm:
 * https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
export const decodePolyline = (encoded) => {
  if (!encoded) return [];
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
