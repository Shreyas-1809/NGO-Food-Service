/**
 * Geocoding helper for backend to resolve real coordinates from address.
 * Uses OpenStreetMap Nominatim with a timeout and fallback to known locations.
 */

// Common landmark/locality coordinates for fallback when external geocoding fails
const LOCALITY_FALLBACKS = [
  { keywords: ['kothrud'], coords: { lat: 18.5074, lng: 73.8077 } },
  { keywords: ['shivajinagar', 'shivaji nagar', 'university'], coords: { lat: 18.5308, lng: 73.8474 } },
  { keywords: ['vimannagar', 'viman nagar', 'viman'], coords: { lat: 18.5679, lng: 73.9143 } },
  { keywords: ['hinjewadi', 'hinjawadi', 'phase 1', 'phase 2'], coords: { lat: 18.5913, lng: 73.7389 } },
  { keywords: ['hadapsar', 'magarpatta'], coords: { lat: 18.5089, lng: 73.9259 } },
  { keywords: ['deccan', 'fc road', 'jm road', 'erandwane'], coords: { lat: 18.5196, lng: 73.8412 } },
  { keywords: ['baner', 'balewadi', 'pashan'], coords: { lat: 18.5590, lng: 73.7868 } },
  { keywords: ['aundh'], coords: { lat: 18.5602, lng: 73.8031 } },
  { keywords: ['katraj', 'pict', 'dhankawadi', 'bharti vidyapeeth'], coords: { lat: 18.4575, lng: 73.8508 } },
  { keywords: ['wakad'], coords: { lat: 18.5987, lng: 73.7684 } },
  { keywords: ['pimpri', 'chinchwad'], coords: { lat: 18.6298, lng: 73.7997 } },
  { keywords: ['swargate'], coords: { lat: 18.5018, lng: 73.8585 } },
  { keywords: ['camp', 'mg road'], coords: { lat: 18.5158, lng: 73.8786 } },
  { keywords: ['koregaon park', 'kp', 'north main road'], coords: { lat: 18.5362, lng: 73.8940 } },
  { keywords: ['kalyani nagar', 'kalyaninagar'], coords: { lat: 18.5463, lng: 73.9034 } },
  { keywords: ['andheri'], coords: { lat: 19.1136, lng: 72.8697 } },
  { keywords: ['bandra'], coords: { lat: 19.0596, lng: 72.8295 } },
  { keywords: ['dadar'], coords: { lat: 19.0178, lng: 72.8478 } },
  { keywords: ['colaba'], coords: { lat: 18.9067, lng: 72.8147 } },
  { keywords: ['thane'], coords: { lat: 19.2183, lng: 72.9781 } },
  { keywords: ['navi mumbai', 'vashi'], coords: { lat: 19.0771, lng: 72.9986 } },
  { keywords: ['pune'], coords: { lat: 18.5204, lng: 73.8567 } },
  { keywords: ['mumbai'], coords: { lat: 19.0760, lng: 72.8777 } }
];

async function geocodeAddressBackend(address) {
  if (!address || typeof address !== 'string' || !address.trim()) {
    return null;
  }

  const cleanAddr = address.trim();

  // 1. Try Nominatim (OpenStreetMap)
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanAddr)}&limit=1`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'FoodBridge-NGO-Service/1.0',
        'Accept-Language': 'en'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
          return { lat, lng };
        }
      }
    }
  } catch (err) {
    // Fall through to known landmarks
  }

  // 2. Keyword fallback for known areas
  const lower = cleanAddr.toLowerCase();
  for (const item of LOCALITY_FALLBACKS) {
    if (item.keywords.some(k => lower.includes(k))) {
      return item.coords;
    }
  }

  return null;
}

module.exports = {
  geocodeAddressBackend
};
