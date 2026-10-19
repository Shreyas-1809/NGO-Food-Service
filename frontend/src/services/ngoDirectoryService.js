/**
 * NGO Directory Service Layer
 * 
 * Provides two distinct real-world data sources:
 * 1. Tier 1: Registered FoodBridge NGOs (queried live from our backend database)
 * 2. Tier 2: Discover NGOs (swappable adapter: default OpenStreetMap Overpass/Nominatim,
 *            or Google Places API when VITE_PLACES_API_KEY is configured)
 * 
 * NO mock or fake data anywhere.
 */
import axios from 'axios';
import { calculateDistanceKm } from './mapsService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// In-memory cache for Tier 2 discover queries to avoid hitting rate limits (TTL: 5 minutes)
const DISCOVER_CACHE = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Fetch Registered NGOs (Tier 1) from FoodBridge database
 */
export const fetchRegisteredNGOs = async () => {
  try {
    const res = await axios.get(`${API_URL}/api/auth/organizations`);
    const data = Array.isArray(res.data) ? res.data : [];
    
    return data.map(org => {
      let lat = null;
      let lng = null;
      if (org.location && Array.isArray(org.location.coordinates) && org.location.coordinates.length >= 2) {
        lng = org.location.coordinates[0];
        lat = org.location.coordinates[1];
      }

      return {
        id: org._id || org.id,
        _id: org._id || org.id,
        name: org.orgName || org.name || 'Registered Organisation',
        email: org.email,
        phone: org.phone,
        address: org.address || '',
        area: org.address ? org.address.split(',')[0].trim() : (org.city || ''),
        city: org.city || '',
        pincode: org.pincode || '',
        description: org.description || '',
        location: (lat !== null && lng !== null) ? { lat, lng } : null,
        lat,
        lng,
        verified: Boolean(org.verified),
        activeNeeds: org.activeNeeds || [],
        activeNeedsCount: org.activeNeedsCount || (org.activeNeeds ? org.activeNeeds.length : 0),
        isRegistered: true,
        tier: 1,
        createdAt: org.createdAt
      };
    });
  } catch (err) {
    console.error('Error fetching registered NGOs from database:', err);
    throw new Error('Unable to connect to FoodBridge database. Please try again.');
  }
};

/**
 * Adapter: Google Places API (when VITE_PLACES_API_KEY is set)
 */
async function fetchGooglePlacesNGOs({ city, lat, lng, radiusMeters = 15000, apiKey }) {
  // Uses backend proxy or Google Places Text Search endpoint
  const query = encodeURIComponent(`NGO charities food bank non profit in ${city || 'Pune'}`);
  let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${apiKey}`;
  if (lat && lng) {
    url += `&location=${lat},${lng}&radius=${radiusMeters}`;
  }

  const res = await fetch(url);
  const data = await res.json();
  if (!data.results) return [];

  return data.results.map(place => ({
    id: `places-${place.place_id}`,
    externalId: place.place_id,
    name: place.name,
    address: place.formatted_address || '',
    area: place.formatted_address ? place.formatted_address.split(',')[0] : '',
    city: city || '',
    category: (place.types || []).includes('food') ? 'Food Bank / Relief' : 'Charity / Non-Profit',
    lat: place.geometry?.location?.lat,
    lng: place.geometry?.location?.lng,
    phone: null,
    website: null,
    isRegistered: false,
    tier: 2,
    source: 'google_places',
    attribution: 'Google Places API'
  }));
}

/**
 * Adapter: OpenStreetMap (Default free provider)
 * Combines Overpass API query with Nominatim fallback for resilience.
 */
async function fetchOpenStreetMapNGOs({ city = 'Pune', lat, lng, radiusMeters = 20000 }) {
  // 1. Try Overpass API with quick timeout
  let centerLat = lat || 18.5204;
  let centerLng = lng || 73.8567;

  // If city is specified and no lat/lng provided, geocode city first using Nominatim
  if ((!lat || !lng) && city) {
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
        { headers: { 'User-Agent': 'FoodBridgeApp/1.0' } }
      );
      const geoData = await geoRes.json();
      if (geoData && geoData[0]) {
        centerLat = parseFloat(geoData[0].lat);
        centerLng = parseFloat(geoData[0].lon);
      }
    } catch (e) {
      console.warn('City geocoding fallback error:', e);
    }
  }

  const overpassQuery = `[out:json][timeout:8];
(
  node["office"="ngo"](around:${radiusMeters},${centerLat},${centerLng});
  way["office"="ngo"](around:${radiusMeters},${centerLat},${centerLng});
  node["amenity"="social_facility"](around:${radiusMeters},${centerLat},${centerLng});
  way["amenity"="social_facility"](around:${radiusMeters},${centerLat},${centerLng});
  node["social_facility"](around:${radiusMeters},${centerLat},${centerLng});
);
out center tags 30;`;

  // Try Overpass first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const opRes = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(overpassQuery),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (opRes.ok) {
      const opData = await opRes.json();
      if (Array.isArray(opData.elements) && opData.elements.length > 0) {
        const valid = opData.elements
          .filter(el => el.tags && el.tags.name)
          .map(el => {
            const itemLat = el.lat || el.center?.lat;
            const itemLng = el.lon || el.center?.lon;
            const tags = el.tags || {};
            
            // Derive clean category
            let category = 'Charity / Non-Profit';
            if (tags.social_facility === 'food_bank' || tags['social_facility:for']?.includes('food')) {
              category = 'Food Bank & Relief';
            } else if (tags.amenity === 'social_facility' || tags.social_facility) {
              category = 'Social Facility / Shelter';
            }

            return {
              id: `osm-${el.id}`,
              externalOsmId: `${el.type}/${el.id}`,
              name: tags.name,
              address: tags['addr:full'] || tags['addr:street'] || `${tags['addr:suburb'] || city}`,
              area: tags['addr:suburb'] || tags['addr:district'] || tags['addr:street'] || city,
              city: tags['addr:city'] || city,
              category,
              website: tags.website || tags['contact:website'] || tags['contact:facebook'] || null,
              phone: tags.phone || tags['contact:phone'] || tags['contact:mobile'] || null,
              email: tags.email || tags['contact:email'] || null,
              lat: itemLat,
              lng: itemLng,
              location: (itemLat && itemLng) ? { lat: itemLat, lng: itemLng } : null,
              isRegistered: false,
              tier: 2,
              source: 'openstreetmap',
              attribution: '© OpenStreetMap contributors'
            };
          });

        if (valid.length > 0) {
          return valid;
        }
      }
    }
  } catch (err) {
    console.warn('Overpass API unavailable, falling back to OpenStreetMap Nominatim:', err.message);
  }

  // 2. Fallback to Nominatim structured search (fast, reliable, free OSM)
  try {
    const searchKeywords = [
      `foundation in ${city}`,
      `trust in ${city}`,
      `orphanage in ${city}`,
      `social welfare in ${city}`,
      `charity in ${city}`
    ];

    const results = [];
    const seenNames = new Set();

    // Fetch parallel queries
    const responses = await Promise.allSettled(
      searchKeywords.map(kw => 
        fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(kw)}&format=json&addressdetails=1&limit=6`, {
          headers: { 'User-Agent': 'FoodBridgeApp/1.0 (contact: info@foodbridge.org)' }
        }).then(r => r.json())
      )
    );

    for (const res of responses) {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        for (const item of res.value) {
          const rawName = item.name || (item.display_name ? item.display_name.split(',')[0].trim() : '');
          if (!rawName || seenNames.has(rawName.toLowerCase())) continue;
          
          // Exclude purely commercial shops or generic road labels
          if (item.type === 'highway' || item.class === 'highway') continue;

          seenNames.add(rawName.toLowerCase());
          const addr = item.address || {};
          const area = addr.suburb || addr.neighbourhood || addr.city_district || addr.road || city;
          const fullAddress = item.display_name || `${area}, ${city}`;

          let category = 'Charity / Non-Profit';
          const lowerName = rawName.toLowerCase();
          if (lowerName.includes('orphan') || lowerName.includes('child')) {
            category = 'Orphanage & Child Care';
          } else if (lowerName.includes('ashram') || lowerName.includes('old age') || lowerName.includes('elder')) {
            category = 'Old Age Home & Elder Care';
          } else if (lowerName.includes('food') || lowerName.includes('meal') || lowerName.includes('hunger')) {
            category = 'Food Security & Relief';
          } else if (lowerName.includes('trust') || lowerName.includes('foundation') || lowerName.includes('mandal')) {
            category = 'Charitable Trust & Foundation';
          }

          results.push({
            id: `nom-${item.osm_type || 'node'}-${item.osm_id}`,
            externalOsmId: `${item.osm_type || 'node'}/${item.osm_id}`,
            name: rawName,
            address: fullAddress,
            area,
            city: addr.city || addr.town || city,
            category,
            website: null,
            phone: null,
            email: null,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            location: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) },
            isRegistered: false,
            tier: 2,
            source: 'openstreetmap',
            attribution: '© OpenStreetMap contributors'
          });
        }
      }
    }

    return results;
  } catch (nomErr) {
    console.error('Nominatim search failed:', nomErr);
    throw new Error('Could not fetch nearby organisations from public directory. Please check your connection and retry.');
  }
}

/**
 * Fetch Discover NGOs (Tier 2)
 * Live search based on donor location / searched city.
 * Excludes organisations already registered on FoodBridge.
 */
export const fetchDiscoverNGOs = async ({ city = 'Pune', lat = null, lng = null, registeredOrgs = [] } = {}) => {
  const queryCity = (!city || city === 'All Cities') ? (lat && lng ? '' : 'Pune') : city;
  const cacheKey = `${(queryCity || 'nearby').toLowerCase()}_${lat || ''}_${lng || ''}`;
  const cached = DISCOVER_CACHE.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  const placesApiKey = import.meta.env.VITE_PLACES_API_KEY;
  let items = [];

  if (placesApiKey && placesApiKey.trim() !== '') {
    // Swappable Google Places API
    items = await fetchGooglePlacesNGOs({ city: queryCity, lat, lng, apiKey: placesApiKey });
  } else {
    // Default free OpenStreetMap provider
    items = await fetchOpenStreetMapNGOs({ city: queryCity || 'Pune', lat, lng });
  }

  // Filter out any organisations that already exist on FoodBridge (Tier 1)
  const registeredNames = new Set(
    registeredOrgs.map(o => (o.name || o.orgName || '').toLowerCase().trim())
  );

  const filtered = items.filter(item => {
    const itemNorm = (item.name || '').toLowerCase().trim();
    if (registeredNames.has(itemNorm)) return false;
    for (const reg of registeredNames) {
      if (reg.length > 4 && (itemNorm.includes(reg) || reg.includes(itemNorm))) {
        return false;
      }
    }
    return true;
  });

  // Calculate real distance if coordinates exist
  const enriched = filtered.map(item => {
    let distanceKm = null;
    if (lat && lng && item.lat && item.lng) {
      distanceKm = calculateDistanceKm(lat, lng, item.lat, item.lng);
    }
    return { ...item, distanceKm };
  });

  DISCOVER_CACHE.set(cacheKey, { timestamp: Date.now(), data: enriched });
  return enriched;
};

/**
 * Submit Profile Claim for an external NGO (Tier 2 -> Admin approval -> Tier 1)
 */
export const submitProfileClaim = async (claimData, token) => {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await axios.post(`${API_URL}/api/profile-claims`, claimData, { headers });
  return res.data;
};

/**
 * Fetch profile claims for admin review
 */
export const fetchProfileClaims = async (status = 'pending', token) => {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await axios.get(`${API_URL}/api/profile-claims?status=${status}`, { headers });
  return res.data;
};

/**
 * Review (approve / reject) a profile claim
 */
export const reviewProfileClaim = async (claimId, { status, adminNotes }, token) => {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await axios.patch(`${API_URL}/api/profile-claims/${claimId}`, { status, adminNotes }, { headers });
  return res.data;
};

export const AVAILABLE_CITIES = ['All Cities', 'Pune', 'Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Chennai', 'Kolkata'];
export const AVAILABLE_CAUSES = [
  'All Categories',
  'Food Security & Relief',
  'Charity / Non-Profit',
  'Social Facility / Shelter',
  'Orphanage & Child Care',
  'Old Age Home & Elder Care',
  'Charitable Trust & Foundation'
];
