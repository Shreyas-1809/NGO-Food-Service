/**
 * /api/maps — Authenticated proxy routes for Google Maps routing and geocoding.
 * The API key is kept strictly on the backend.
 *
 * GET /api/maps/geocode?address=<string>
 *   → { lat, lng, formattedAddress }
 *
 * GET /api/maps/route?origin=lat,lng&destination=lat,lng[&waypoints=lat,lng]
 *   → Per-leg distances, durations (with traffic when available), steps (HTML stripped),
 *     overview polyline, and up to 2 alternative routes.
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// ── helpers ──────────────────────────────────────────────────────────────────
const getKey = () => (process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_SERVER_KEY || '').trim();

const fetchJson = async (url, options = {}, timeoutMs = 8000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  } finally {
    clearTimeout(id);
  }
};

const isValidCoordPair = (str) => {
  if (typeof str !== 'string') return false;
  const parts = str.trim().split(',');
  if (parts.length !== 2) return false;
  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
};

const stripHtml = (html) => {
  if (!html) return '';
  return String(html)
    .replace(/<div[^>]*>/gi, ' - ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
};

// Polyline encoder helper for fallback routes
const encodePolyline = (coords) => {
  let output = '';
  let prevLat = 0;
  let prevLng = 0;

  for (const [lat, lng] of coords) {
    const late5 = Math.round(lat * 1e5);
    const lnge5 = Math.round(lng * 1e5);

    let dLat = late5 - prevLat;
    let dLng = lnge5 - prevLng;

    prevLat = late5;
    prevLng = lnge5;

    for (let val of [dLat, dLng]) {
      val = val < 0 ? ~(val << 1) : val << 1;
      while (val >= 0x20) {
        output += String.fromCharCode((0x20 | (val & 0x1f)) + 63);
        val >>= 5;
      }
      output += String.fromCharCode(val + 63);
    }
  }
  return output;
};

// ── GET /api/maps/geocode?address=... ────────────────────────────────────────
router.get('/geocode', auth, async (req, res) => {
  const address = (req.query.address || '').trim();
  if (!address) {
    return res.status(400).json({ message: 'Query param "address" is required.' });
  }

  const key = getKey();
  // 1. Try Google Geocoding API if key exists
  if (key) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`;
      const { ok, data } = await fetchJson(url);
      if (ok && data?.status === 'OK' && Array.isArray(data.results) && data.results.length > 0) {
        const result = data.results[0];
        const { lat, lng } = result.geometry.location;
        return res.json({
          lat: Number(lat),
          lng: Number(lng),
          formattedAddress: result.formatted_address,
          source: 'google'
        });
      }
      if (data?.error_message) {
        console.warn('[maps/geocode] Google Geocoding error:', data.status, data.error_message);
      }
    } catch (err) {
      console.warn('[maps/geocode] Google Geocoding request failed:', err.message);
    }
  }

  // 2. Fallback to OpenStreetMap Nominatim
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    const { ok, data } = await fetchJson(nomUrl, {
      headers: {
        'User-Agent': 'FoodBridge-App/2.0',
        'Accept-Language': 'en'
      }
    });

    if (ok && Array.isArray(data) && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return res.json({
          lat,
          lng,
          formattedAddress: data[0].display_name,
          source: 'nominatim'
        });
      }
    }
    return res.status(404).json({ message: 'Address location could not be determined.' });
  } catch (err) {
    return res.status(502).json({ message: `Geocoding failed: ${err.message}` });
  }
});

// ── GET /api/maps/route?origin=lat,lng&destination=lat,lng[&waypoints=lat,lng] ──
router.get('/route', auth, async (req, res) => {
  const origin = (req.query.origin || '').trim();
  const destination = (req.query.destination || '').trim();
  const waypoints = (req.query.waypoints || '').trim();

  if (!origin || !destination) {
    return res.status(400).json({
      message: 'Query params "origin" and "destination" are required (format: lat,lng).'
    });
  }

  if (!isValidCoordPair(origin) || !isValidCoordPair(destination)) {
    return res.status(400).json({ message: 'origin and destination must be valid "lat,lng" coordinate pairs.' });
  }

  if (waypoints) {
    const wpList = waypoints.split('|');
    const allValid = wpList.every(isValidCoordPair);
    if (!allValid) {
      return res.status(400).json({ message: 'waypoints must be valid "lat,lng" pairs separated by "|".' });
    }
  }

  const key = getKey();

  // Helper to normalize Google Directions response
  const formatGoogleDirections = (data) => {
    if (data.status !== 'OK' || !Array.isArray(data.routes) || data.routes.length === 0) {
      return null;
    }

    const mainRoute = data.routes[0];
    const legs = (mainRoute.legs || []).map((leg) => {
      const durationSec = leg.duration?.value ?? 0;
      const durationTrafficSec = leg.duration_in_traffic?.value ?? null;

      return {
        distance: {
          text: leg.distance?.text || '',
          value: leg.distance?.value || 0
        },
        duration: {
          text: leg.duration?.text || '',
          value: durationSec
        },
        duration_in_traffic: durationTrafficSec !== null
          ? {
              text: leg.duration_in_traffic?.text || '',
              value: durationTrafficSec
            }
          : null,
        start_address: leg.start_address || '',
        end_address: leg.end_address || '',
        start_location: leg.start_location || null,
        end_location: leg.end_location || null,
        steps: (leg.steps || []).map((step) => ({
          instruction: stripHtml(step.html_instructions || ''),
          distance: {
            text: step.distance?.text || '',
            value: step.distance?.value || 0
          },
          duration: {
            text: step.duration?.text || '',
            value: step.duration?.value || 0
          },
          maneuver: step.maneuver || ''
        }))
      };
    });

    const primaryLeg = legs[0] || {};
    const totalDistanceMeters = legs.reduce((acc, l) => acc + (l.distance?.value || 0), 0);
    const totalDurationSeconds = legs.reduce((acc, l) => acc + (l.duration_in_traffic?.value || l.duration?.value || 0), 0);

    const alternatives = data.routes.slice(1, 3).map((alt) => {
      const altDist = (alt.legs || []).reduce((acc, l) => acc + (l.distance?.value || 0), 0);
      const altDur = (alt.legs || []).reduce((acc, l) => acc + (l.duration_in_traffic?.value || l.duration?.value || 0), 0);
      return {
        summary: alt.summary || '',
        polyline: alt.overview_polyline?.points || '',
        distanceMeters: altDist,
        distanceText: altDist > 1000 ? `${(altDist / 1000).toFixed(1)} km` : `${altDist} m`,
        durationSeconds: altDur,
        durationText: altDur >= 3600
          ? `${Math.floor(altDur / 3600)} hr ${Math.round((altDur % 3600) / 60)} min`
          : `${Math.max(1, Math.round(altDur / 60))} min`
      };
    });

    return {
      source: 'google_directions',
      overview_polyline: mainRoute.overview_polyline?.points || '',
      polyline: mainRoute.overview_polyline?.points || '',
      summary: mainRoute.summary || '',
      legs,
      totalDistanceMeters,
      totalDurationSeconds,
      distanceMeters: totalDistanceMeters,
      durationSeconds: totalDurationSeconds,
      distanceText: primaryLeg.distance?.text || `${(totalDistanceMeters / 1000).toFixed(1)} km`,
      durationText: (primaryLeg.duration_in_traffic?.text || primaryLeg.duration?.text) || `${Math.round(totalDurationSeconds / 60)} min`,
      alternatives
    };
  };

  // 1. Attempt Google Directions API
  if (key) {
    try {
      let url =
        `https://maps.googleapis.com/maps/api/directions/json` +
        `?origin=${encodeURIComponent(origin)}` +
        `&destination=${encodeURIComponent(destination)}` +
        `&mode=driving` +
        `&departure_time=now` +
        `&alternatives=true` +
        `&key=${key}`;

      if (waypoints) {
        url += `&waypoints=${encodeURIComponent(waypoints)}`;
      }

      const { ok, data } = await fetchJson(url);

      if (ok && data?.status === 'OK') {
        const formatted = formatGoogleDirections(data);
        if (formatted) return res.json(formatted);
      } else if (data?.status && data.status !== 'OK') {
        console.warn(`[maps/route] Google Directions returned ${data.status}:`, data.error_message || '');
      }
    } catch (err) {
      console.warn('[maps/route] Google Directions request failed:', err.message);
    }
  }

  // 2. Attempt Google Routes API v2
  if (key) {
    try {
      const [oLat, oLng] = origin.split(',').map(Number);
      const [dLat, dLng] = destination.split(',').map(Number);
      const requestBody = {
        origin: { location: { latLng: { latitude: oLat, longitude: oLng } } },
        destination: { location: { latLng: { latitude: dLat, longitude: dLng } } },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
        computeAlternativeRoutes: true
      };

      if (waypoints) {
        requestBody.intermediates = waypoints.split('|').map((w) => {
          const [wLat, wLng] = w.split(',').map(Number);
          return { location: { latLng: { latitude: wLat, longitude: wLng } } };
        });
      }

      const { ok, data } = await fetchJson('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': key,
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs,routes.description'
        },
        body: JSON.stringify(requestBody)
      });

      if (ok && Array.isArray(data?.routes) && data.routes.length > 0) {
        const primary = data.routes[0];
        const legs = (primary.legs || []).map((leg) => {
          const durSec = parseInt(leg.duration || '0', 10) || 0;
          const distM = leg.distanceMeters || 0;
          return {
            distance: {
              text: distM >= 1000 ? `${(distM / 1000).toFixed(1)} km` : `${distM} m`,
              value: distM
            },
            duration: {
              text: `${Math.max(1, Math.round(durSec / 60))} min`,
              value: durSec
            },
            duration_in_traffic: null,
            start_address: '',
            end_address: '',
            steps: []
          };
        });

        const totalDist = primary.distanceMeters || 0;
        const totalDur = parseInt(primary.duration || '0', 10) || 0;
        const polyline = primary.polyline?.encodedPolyline || '';

        const alternatives = data.routes.slice(1, 3).map((r) => {
          const aDist = r.distanceMeters || 0;
          const aDur = parseInt(r.duration || '0', 10) || 0;
          return {
            summary: r.description || '',
            polyline: r.polyline?.encodedPolyline || '',
            distanceMeters: aDist,
            distanceText: aDist >= 1000 ? `${(aDist / 1000).toFixed(1)} km` : `${aDist} m`,
            durationSeconds: aDur,
            durationText: `${Math.max(1, Math.round(aDur / 60))} min`
          };
        });

        return res.json({
          source: 'google_routes_v2',
          overview_polyline: polyline,
          polyline,
          summary: primary.description || '',
          legs,
          totalDistanceMeters: totalDist,
          totalDurationSeconds: totalDur,
          distanceMeters: totalDist,
          durationSeconds: totalDur,
          distanceText: totalDist >= 1000 ? `${(totalDist / 1000).toFixed(1)} km` : `${totalDist} m`,
          durationText: `${Math.max(1, Math.round(totalDur / 60))} min`,
          alternatives
        });
      }
    } catch (err) {
      console.warn('[maps/route] Google Routes v2 request failed:', err.message);
    }
  }

  // 3. Resilient Fallback: OSRM Driving Router
  // When Google Maps key has not enabled Routes/Directions API in Google Cloud Console,
  // OSRM provides real turn-by-turn road driving directions and polyline.
  try {
    const [oLat, oLng] = origin.split(',');
    const [dLat, dLng] = destination.split(',');

    let osrmCoords = `${oLng},${oLat}`;
    if (waypoints) {
      for (const wp of waypoints.split('|')) {
        const [wLat, wLng] = wp.split(',');
        osrmCoords += `;${wLng},${wLat}`;
      }
    }
    osrmCoords += `;${dLng},${dLat}`;

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${osrmCoords}?overview=full&geometries=geojson&steps=true&alternatives=true`;
    const { ok, data } = await fetchJson(osrmUrl, {}, 6000);

    if (ok && data?.code === 'Ok' && Array.isArray(data.routes) && data.routes.length > 0) {
      const primary = data.routes[0];
      const encodedPolyline = encodePolyline(
        (primary.geometry?.coordinates || []).map(([lng, lat]) => [lat, lng])
      );

      const legs = (primary.legs || []).map((leg) => {
        const distM = Math.round(leg.distance || 0);
        const durSec = Math.round(leg.duration || 0);
        return {
          distance: {
            text: distM >= 1000 ? `${(distM / 1000).toFixed(1)} km` : `${distM} m`,
            value: distM
          },
          duration: {
            text: durSec >= 3600
              ? `${Math.floor(durSec / 3600)} hr ${Math.round((durSec % 3600) / 60)} min`
              : `${Math.max(1, Math.round(durSec / 60))} min`,
            value: durSec
          },
          duration_in_traffic: null,
          start_address: '',
          end_address: '',
          steps: (leg.steps || []).map((step) => ({
            instruction: step.maneuver?.instruction ||
              `${step.maneuver?.type || 'Drive'} ${step.name ? 'on ' + step.name : ''}`.trim(),
            distance: {
              text: step.distance >= 1000 ? `${(step.distance / 1000).toFixed(1)} km` : `${Math.round(step.distance)} m`,
              value: Math.round(step.distance || 0)
            },
            duration: {
              text: `${Math.max(1, Math.round((step.duration || 0) / 60))} min`,
              value: Math.round(step.duration || 0)
            },
            maneuver: step.maneuver?.type || ''
          }))
        };
      });

      const totalDist = Math.round(primary.distance || 0);
      const totalDur = Math.round(primary.duration || 0);

      const alternatives = data.routes.slice(1, 3).map((alt) => {
        const aDist = Math.round(alt.distance || 0);
        const aDur = Math.round(alt.duration || 0);
        const aPoly = encodePolyline(
          (alt.geometry?.coordinates || []).map(([lng, lat]) => [lat, lng])
        );
        return {
          summary: '',
          polyline: aPoly,
          distanceMeters: aDist,
          distanceText: aDist >= 1000 ? `${(aDist / 1000).toFixed(1)} km` : `${aDist} m`,
          durationSeconds: aDur,
          durationText: `${Math.max(1, Math.round(aDur / 60))} min`
        };
      });

      return res.json({
        source: 'osrm_fallback',
        overview_polyline: encodedPolyline,
        polyline: encodedPolyline,
        summary: '',
        legs,
        totalDistanceMeters: totalDist,
        totalDurationSeconds: totalDur,
        distanceMeters: totalDist,
        durationSeconds: totalDur,
        distanceText: totalDist >= 1000 ? `${(totalDist / 1000).toFixed(1)} km` : `${totalDist} m`,
        durationText: totalDur >= 3600
          ? `${Math.floor(totalDur / 3600)} hr ${Math.round((totalDur % 3600) / 60)} min`
          : `${Math.max(1, Math.round(totalDur / 60))} min`,
        alternatives
      });
    }
  } catch (err) {
    console.error('[maps/route] Fallback router error:', err.message);
  }

  return res.status(502).json({
    message: 'Routing service unavailable. Please check Google Maps API configuration or network connectivity.',
    googleStatus: 'ROUTING_UNAVAILABLE'
  });
});

module.exports = router;
