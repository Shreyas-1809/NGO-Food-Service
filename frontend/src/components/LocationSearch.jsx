import React, { useState, useEffect, useRef } from 'react';
import { Search, Crosshair } from 'lucide-react';
import { loadGoogleMaps, getCurrentUserLocation } from '../services/mapsService';

const LocationSearch = ({ onSelectLocation, onUseCurrentLocation }) => {
  const [query, setQuery] = useState('');
  const [loadingLoc, setLoadingLoc] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    let autocomplete = null;

    loadGoogleMaps()
      .then((maps) => {
        if (inputRef.current && maps.places) {
          autocomplete = new maps.places.Autocomplete(inputRef.current, {
            types: ['geocode', 'establishment'],
            componentRestrictions: { country: 'in' }
          });

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.geometry && place.geometry.location) {
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              const formatted = place.formatted_address || place.name;
              setQuery(formatted);
              if (onSelectLocation) {
                onSelectLocation({ lat, lng, address: formatted });
              }
            }
          });
        }
      })
      .catch((err) => {
        console.warn('[LocationSearch] Google Places fallback mode:', err.message);
      });
  }, [onSelectLocation]);

  const handleUseMyLocation = async () => {
    setLoadingLoc(true);
    try {
      const loc = await getCurrentUserLocation();
      setQuery('Current Location (Pune)');
      if (onUseCurrentLocation) {
        onUseCurrentLocation(loc);
      }
    } catch (err) {
      alert(err.message || 'Could not fetch current location.');
    } finally {
      setLoadingLoc(false);
    }
  };

  return (
    <div className="w-full space-y-2">
      <div className="relative flex items-center">
        <Search className="w-5 h-5 text-[#60708B] absolute left-3.5 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search for pickup location or NGO area (e.g. Kothrud, Pune)..."
          className="w-full pl-11 pr-32 py-3 bg-white dark:bg-[#0F1A33] text-[#18315E] dark:text-white rounded-2xl border border-[#E5E1D8] dark:border-[#1E2D52] shadow-sm focus:ring-2 focus:ring-[#E5E1D8] outline-none text-xs sm:text-sm font-medium"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={loadingLoc}
          className="absolute right-2.5 px-3 py-1.5 bg-[#F3F0EA] hover:bg-[#F3F0EA] dark:bg-[#0F1A33]/80 dark:hover:bg-[#15223F] text-[#18315E] dark:text-[#D9B65D] rounded-xl text-xs font-bold transition-colors flex items-center space-x-1"
        >
          <Crosshair className="w-3.5 h-3.5 text-[#18315E]" />
          <span>{loadingLoc ? 'Locating...' : '📍 USE MY LOCATION'}</span>
        </button>
      </div>
    </div>
  );
};

export default LocationSearch;









