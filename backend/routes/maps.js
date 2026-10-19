/**
 * /api/maps — Authenticated proxy routes that keep the Google Maps API key
 * strictly on the backend. The frontend never sees the key.
 *
 * Env var required: GOOGLE_MAPS_API_KEY
 * If missing, the routes return a 503 with a clear message.
 *
 * GET /api/maps/geocode?address=<string>
 *   → { lat, lng, formattedAddress }
 *
 * GET /api/maps/route?origin=<lat,lng>&destination=<lat,lng>
 *   → { polyline, distanceMeters, durationSeconds }
 *
 * All routes require a valid JWT (Bearer token). Additive only — no existing
 * route or field is renamed or removed.
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// ── helper ──────────────────────────────────────────────────────────────────
const getKey = () => process.env.GOOGLE_MAPS_API_KEY || '';

const noKey = (res) =>
  res.status(503).json({
    message:
      'Google Maps API key is not configured on the server. ' +
      'Add GOOGLE_MAPS_API_KEY to the backend .env file.'
  });

// Minimal fetch helper with timeout
const fetchJson = async (url, timeoutMs = 8000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(id);
  }
};

// ── GET /api/maps/geocode?address=... ────────────────────────────────────────
router.get('/geocode', auth, async (req, res) => {
  const key = getKey();
  if (!key) return noKey(res);

  const address = (req.query.address || '').trim();
  if (!address) {
    return res.status(400).json({ message: 'Query param "address" is required.' });
  }

  try {
    const url =
      `https://maps.googleapis.com/maps/api/geocode/json` +
      `?address=${encodeURIComponent(address)}&key=${key}`;

    const data = await fetchJson(url);

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return res.status(404).json({
        message: `Geocode failed: ${data.status || 'NO_RESULTS'}`,
        googleStatus: data.status
      });
    }

    const result = data.results[0];
    const { lat, lng } = result.geometry.location;

    return res.json({
      lat,
      lng,
      formattedAddress: result.formatted_address
    });
  } catch (err) {
    console.error('[maps/geocode] error:', err.message);
    return res.status(502).json({ message: `Google geocode call failed: ${err.message}` });
  }
});

// ── GET /api/maps/route?origin=lat,lng&destination=lat,lng ──────────────────
router.get('/route', auth, async (req, res) => {
  const key = getKey();
  if (!key) return noKey(res);

  const origin = (req.query.origin || '').trim();
  const destination = (req.query.destination || '').trim();

  if (!origin || !destination) {
    return res.status(400).json({
      message: 'Query params "origin" and "destination" are required (format: lat,lng).'
    });
  }

  // Validate both strings look like "lat,lng"
  const pairRe = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;
  if (!pairRe.test(origin) || !pairRe.test(destination)) {
    return res.status(400).json({ message: 'origin and destination must be "lat,lng" pairs.' });
  }

  try {
    const url =
      `https://maps.googleapis.com/maps/api/directions/json` +
      `?origin=${encodeURIComponent(origin)}` +
      `&destination=${encodeURIComponent(destination)}` +
      `&mode=driving` +
      `&key=${key}`;

    const data = await fetchJson(url);

    if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
      return res.status(404).json({
        message: `Directions failed: ${data.status || 'NO_ROUTES'}`,
        googleStatus: data.status
      });
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    return res.json({
      polyline: route.overview_polyline?.points || '',
      distanceMeters: leg.distance?.value ?? null,
      durationSeconds: leg.duration?.value ?? null,
      distanceText: leg.distance?.text || '',
      durationText: leg.duration?.text || ''
    });
  } catch (err) {
    console.error('[maps/route] error:', err.message);
    return res.status(502).json({ message: `Google directions call failed: ${err.message}` });
  }
});

module.exports = router;
