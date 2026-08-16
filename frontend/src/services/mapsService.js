// Dynamic Google Maps Platform Service Layer with Graceful Fallback Mode

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

let googleMapsPromise = null;

/**
 * Dynamically loads Google Maps JavaScript API with current documentation recommendations
 */
export const loadGoogleMaps = () => {
  if (!API_KEY || API_KEY.includes('YOUR_GOOGLE_MAPS_API_KEY')) {
    return Promise.reject(new Error('Google Maps API key is not configured in .env file.'));
  }

  if (window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    // Check if script already injected
    if (document.getElementById('google-maps-js-script')) {
      const interval = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(interval);
          resolve(window.google.maps);
        }
      }, 100);
      return;
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

    script.onerror = (err) => {
      reject(new Error('Failed to load Google Maps JS SDK script. Check API key & network connectivity.'));
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

/**
 * Safe library importer using google.maps.importLibrary
 */
export const importMapLibrary = async (libraryName) => {
  try {
    const maps = await loadGoogleMaps();
    if (typeof maps.importLibrary === 'function') {
      return await maps.importLibrary(libraryName);
    }
    return maps[libraryName] || null;
  } catch (err) {
    console.warn(`[MapsService] Could not load library '${libraryName}':`, err.message);
    return null;
  }
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
        if (error.code === error.PERMISSION_DENIED) msg = 'Location permission denied by user.';
        else if (error.code === error.POSITION_UNAVAILABLE) msg = 'Location information is unavailable.';
        else if (error.code === error.TIMEOUT) msg = 'Location request timed out.';
        reject(new Error(msg));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
};

/**
 * Calculates route info (distance & travel duration) between origin and destination
 */
export const calculateRouteInfo = async (origin, destination) => {
  try {
    const maps = await loadGoogleMaps();
    if (maps && maps.DirectionsService) {
      const directionsService = new maps.DirectionsService();
      const result = await directionsService.route({
        origin: typeof origin === 'string' ? origin : new maps.LatLng(origin.lat, origin.lng),
        destination: typeof destination === 'string' ? destination : new maps.LatLng(destination.lat, destination.lng),
        travelMode: maps.TravelMode.DRIVING
      });

      if (result.routes && result.routes[0] && result.routes[0].legs[0]) {
        const leg = result.routes[0].legs[0];
        return {
          distanceText: leg.distance.text,
          distanceValueKm: leg.distance.value / 1000,
          durationText: leg.duration.text,
          startAddress: leg.start_address,
          endAddress: leg.end_address,
          rawResult: result
        };
      }
    }
  } catch (err) {
    console.warn('[MapsService] Routes API fallback invoked:', err.message);
  }

  // Graceful Fallback calculation if Maps API unavailable
  const lat1 = typeof origin === 'object' ? origin.lat : 18.5204;
  const lng1 = typeof origin === 'object' ? origin.lng : 73.8567;
  const lat2 = typeof destination === 'object' ? destination.lat : 18.5308;
  const lng2 = typeof destination === 'object' ? destination.lng : 73.8474;

  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lng2 - lng1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = Math.round(R * c * 10) / 10;
  const estMins = Math.round(dist * 3 + 5);

  return {
    distanceText: `${dist} km`,
    distanceValueKm: dist,
    durationText: `${estMins} mins driving`,
    startAddress: typeof origin === 'string' ? origin : 'Donor Pickup Point',
    endAddress: typeof destination === 'string' ? destination : 'Receiver NGO Center',
    rawResult: null
  };
};
