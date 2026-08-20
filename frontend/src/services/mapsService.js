// Dynamic Google Maps Platform & Location Service Layer with Graceful Fallback Mode

export const getGoogleMapsApiKey = () => {
  const customKey = localStorage.getItem('google_maps_api_key');
  if (customKey && customKey.trim() !== '') {
    return customKey.trim();
  }
  const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  if (envKey && !envKey.includes('YOUR_GOOGLE_MAPS_API_KEY') && envKey.trim() !== '') {
    return envKey.trim();
  }
  return '';
};

export const setGoogleMapsApiKey = (key) => {
  if (key && key.trim()) {
    localStorage.setItem('google_maps_api_key', key.trim());
  } else {
    localStorage.removeItem('google_maps_api_key');
  }
  googleMapsPromise = null; // Reset promise so new key reloads
};

let googleMapsPromise = null;

/**
 * Dynamically loads Google Maps JavaScript API
 */
export const loadGoogleMaps = () => {
  const API_KEY = getGoogleMapsApiKey();

  if (!API_KEY) {
    return Promise.reject(new Error('Google Maps API key is not configured.'));
  }

  if (window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('google-maps-js-script');
    if (existing) {
      existing.remove(); // Clean up if re-initializing with new key
    }

    const script = document.createElement('script');
    script.id = 'google-maps-js-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places,routes,marker,geometry&v=weekly`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google && window.google.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error('Google Maps script loaded but window.google.maps is undefined'));
      }
    };

    script.onerror = () => {
      reject(new Error('Failed to load Google Maps JS SDK script. Check API key validity & network connectivity.'));
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

/**
 * Obtains current user coordinates via browser Geolocation API
 */
export const getCurrentUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('Geolocation is not supported by your browser.'));
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let msg = 'Unable to retrieve location.';
        if (error.code === error.PERMISSION_DENIED) msg = 'Location permission denied by user. Please allow location access in your browser.';
        else if (error.code === error.POSITION_UNAVAILABLE) msg = 'Location information is unavailable.';
        else if (error.code === error.TIMEOUT) msg = 'Location request timed out.';
        reject(new Error(msg));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
};

/**
 * Reverse Geocodes coordinates to a human-readable address string
 */
export const reverseGeocodeCoords = async (coords) => {
  if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
    return 'Location Coordinates Not Set';
  }

  // 1. Try Google Maps Geocoder if API Key is available
  try {
    const maps = await loadGoogleMaps();
    if (maps && maps.Geocoder) {
      const geocoder = new maps.Geocoder();
      const response = await geocoder.geocode({ location: { lat: coords.lat, lng: coords.lng } });
      if (response.results && response.results[0]) {
        return response.results[0].formatted_address;
      }
    }
  } catch (err) {
    // Proceed to fallback
  }

  // 2. Try OpenStreetMap Nominatim (Free Reverse Geocoding)
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`, {
      headers: { 'Accept-Language': 'en' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        return data.display_name;
      }
    }
  } catch (err) {
    console.warn('[MapsService] Nominatim reverse geocode fallback:', err.message);
  }

  // 3. Fallback to coordinate string
  return `GPS Pin (${coords.lat.toFixed(4)}° N, ${coords.lng.toFixed(4)}° E)`;
};

/**
 * Forward Geocodes an address string to lat/lng coordinates
 */
export const geocodeAddress = async (address) => {
  if (!address || typeof address !== 'string' || address.trim() === '') {
    return { lat: 18.5204, lng: 73.8567 };
  }

  // 1. Try Google Maps Geocoder if available
  try {
    const maps = await loadGoogleMaps();
    if (maps && maps.Geocoder) {
      const geocoder = new maps.Geocoder();
      const response = await geocoder.geocode({ address });
      if (response.results && response.results[0]) {
        const loc = response.results[0].geometry.location;
        return { lat: loc.lat(), lng: loc.lng() };
      }
    }
  } catch (err) {
    // Proceed to fallback
  }

  // 2. Try OpenStreetMap Nominatim
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`, {
      headers: { 'Accept-Language': 'en' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
    }
  } catch (err) {
    console.warn('[MapsService] Nominatim geocode fallback:', err.message);
  }

  // 3. Known city landmarks fallback
  const addrLower = address.toLowerCase();
  if (addrLower.includes('mumbai')) return { lat: 19.0760, lng: 72.8777 };
  if (addrLower.includes('delhi')) return { lat: 28.6139, lng: 77.2090 };
  if (addrLower.includes('bangalore') || addrLower.includes('bengaluru')) return { lat: 12.9716, lng: 77.5946 };
  if (addrLower.includes('hyderabad')) return { lat: 17.3850, lng: 78.4867 };
  if (addrLower.includes('kothrud')) return { lat: 18.5074, lng: 73.8077 };
  if (addrLower.includes('vimannagar') || addrLower.includes('viman nagar')) return { lat: 18.5679, lng: 73.9143 };
  if (addrLower.includes('hinjewadi')) return { lat: 18.5913, lng: 73.7389 };
  if (addrLower.includes('hadapsar')) return { lat: 18.5089, lng: 73.9259 };
  if (addrLower.includes('shivajinagar')) return { lat: 18.5308, lng: 73.8474 };

  return { lat: 18.5204, lng: 73.8567 }; // Default Pune Center
};

/**
 * Direct distance calculator between two lat/lng pairs in Kilometers (Haversine formula)
 */
export const calculateDistanceKm = (coords1, coords2) => {
  if (!coords1 || !coords2) return 2.5;
  const lat1 = coords1.lat ?? coords1.latitude ?? 18.5204;
  const lng1 = coords1.lng ?? coords1.longitude ?? 73.8567;
  const lat2 = coords2.lat ?? coords2.latitude ?? 18.5204;
  const lng2 = coords2.lng ?? coords2.longitude ?? 73.8567;

  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lng2 - lng1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.max(0.2, Math.round(R * c * 10) / 10);
};

/**
 * Route calculation between Donor, Volunteer, and Receiver (3-point delivery chain)
 */
export const calculateMultiStopRouteInfo = async (donorCoords, volunteerCoords, receiverCoords) => {
  const d1 = calculateDistanceKm(volunteerCoords || donorCoords, donorCoords);
  const d2 = calculateDistanceKm(donorCoords, receiverCoords);
  const totalKm = Math.round((d1 + d2) * 10) / 10;
  const totalMins = Math.round(totalKm * 3.2 + 6);

  return {
    leg1Km: d1,
    leg2Km: d2,
    totalKm,
    durationMinutes: totalMins,
    durationText: `${totalMins} mins total trip`,
    donorEta: `${Math.round(d1 * 3 + 4)} mins to donor`,
    receiverEta: `${Math.round((d1 + d2) * 3 + 6)} mins to receiver`
  };
};

export const calculateRouteInfo = async (origin, destination) => {
  const dist = calculateDistanceKm(origin, destination);
  const mins = Math.round(dist * 3 + 5);
  return {
    distanceText: `${dist} km`,
    distanceValueKm: dist,
    durationMinutes: mins,
    durationText: `${mins} mins`,
    startAddress: 'Donor Pickup Point',
    endAddress: 'Receiver NGO Destination'
  };
};
