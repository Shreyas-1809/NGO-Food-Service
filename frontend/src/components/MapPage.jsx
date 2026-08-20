import React, { useState } from 'react';
import { MOCK_NGOS } from '../services/mockData';
import MapView from './MapView';
import LocationSearch from './LocationSearch';
import { Filter, MapPin, ShieldCheck, ArrowRight, Crosshair, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MapPage = () => {
  const [ngos, setNgos] = useState(MOCK_NGOS);
  const [selectedNgo, setSelectedNgo] = useState(MOCK_NGOS[0]);
  const [userLocation, setUserLocation] = useState({ lat: 18.5204, lng: 73.8567 }); // Pune center default
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [maxDistance, setMaxDistance] = useState(25);
  const [selectedUrgency, setSelectedUrgency] = useState('ALL');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const navigate = useNavigate();

  const handleSelectLocation = (loc) => {
    setUserLocation({ lat: loc.lat, lng: loc.lng });
  };

  const handleUseCurrentLocation = (loc) => {
    setUserLocation({ lat: loc.lat, lng: loc.lng });
  };

  // Filter logic
  const filteredNgos = ngos.filter((ngo) => {
    if (verifiedOnly && !ngo.verified) return false;
    if (ngo.distanceKm > maxDistance) return false;
    if (selectedCategory !== 'ALL' && !ngo.areasOfSupport.some(a => a.toLowerCase().includes(selectedCategory.toLowerCase()))) return false;
    if (selectedUrgency !== 'ALL' && !ngo.currentRequirements.some(r => r.urgency === selectedUrgency)) return false;
    return true;
  });

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Header & Location Search */}
      <div className="bg-white dark:bg-[#161918] p-6 sm:p-8 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
        <div>
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">
            Real-Time Logistics Map
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white">
            Surplus & NGO Logistics Explorer
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Locate nearby verified receivers, view pickup routes, and initiate smart matching in real-time.
          </p>
        </div>

        <LocationSearch
          onSelectLocation={handleSelectLocation}
          onUseCurrentLocation={handleUseCurrentLocation}
        />
      </div>

      {/* MAIN RESPONSIVE MAP CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[620px]">
        
        {/* LEFT / MOBILE BOTTOM: FILTERS & NGO LIST */}
        <div className="lg:col-span-4 bg-white dark:bg-[#161918] rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col space-y-5 overflow-y-auto max-h-[620px]">
          
          {/* Filters Bar */}
          <div className="space-y-3 pb-3 border-b border-stone-200 dark:border-stone-800">
            <div className="flex justify-between items-center text-xs font-semibold text-stone-500 uppercase tracking-wider">
              <span className="flex items-center"><Filter className="w-3.5 h-3.5 mr-1 text-[#1B4332]" /> Filter Hubs</span>
              <span>{filteredNgos.length} Centers</span>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Category</label>
              <select
                className="w-full p-2 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-xs rounded-lg border border-stone-200 dark:border-stone-700 outline-none"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                <option value="Food">Food Surplus</option>
                <option value="Clothes">Clothes & Blankets</option>
                <option value="Books">Educational Materials</option>
                <option value="Medical">Medical Supplies</option>
              </select>
            </div>

            {/* Distance & Urgency */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Max Distance</label>
                <select
                  className="w-full p-2 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-xs rounded-lg border border-stone-200 dark:border-stone-700 outline-none"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(Number(e.target.value))}
                >
                  <option value={5}>Within 5 km</option>
                  <option value={10}>Within 10 km</option>
                  <option value={25}>Within 25 km</option>
                  <option value={100}>Any distance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Urgency</label>
                <select
                  className="w-full p-2 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white text-xs rounded-lg border border-stone-200 dark:border-stone-700 outline-none"
                  value={selectedUrgency}
                  onChange={(e) => setSelectedUrgency(e.target.value)}
                >
                  <option value="ALL">All Urgency</option>
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                </select>
              </div>
            </div>

            {/* Verified Only Checkbox */}
            <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-stone-700 dark:text-stone-300 pt-1">
              <input
                type="checkbox"
                className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-800"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
              />
              <span>Verified Centers Only</span>
            </label>
          </div>

          {/* NGO List */}
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {filteredNgos.map((ngo) => (
              <div
                key={ngo.id}
                onClick={() => setSelectedNgo(ngo)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 text-xs ${
                  selectedNgo?.id === ngo.id
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-xs'
                    : 'bg-[#FBFBFA] dark:bg-stone-900/40 border-stone-200 dark:border-stone-800 hover:border-stone-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-stone-900 dark:text-white">
                    {ngo.name}
                  </h3>
                  {ngo.verified && (
                    <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 bg-white dark:bg-stone-800 px-1.5 py-0.5 rounded border border-emerald-200">
                      ✓ Verified
                    </span>
                  )}
                </div>

                <p className="text-stone-500 flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-stone-400" /> {ngo.area}, {ngo.city} • <strong>{ngo.distanceKm} km</strong>
                </p>

                <div className="flex justify-between items-center pt-1 border-t border-stone-200/60 dark:border-stone-800">
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedNgo(ngo); }}
                    className="font-semibold text-emerald-800 dark:text-emerald-400 hover:underline"
                  >
                    View on Map →
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate('/donate'); }}
                    className="px-2.5 py-1 bg-[#1B4332] hover:bg-[#143326] text-white rounded-md font-semibold text-[11px]"
                  >
                    Donate
                  </button>
                </div>
              </div>
            ))}

            {filteredNgos.length === 0 && (
              <div className="text-center py-8 text-stone-400 text-xs">
                No NGOs match the selected filters.
              </div>
            )}
          </div>

        </div>

        {/* RIGHT: MAP VIEW */}
        <div className="lg:col-span-8 h-[450px] lg:h-full">
          <MapView
            ngos={filteredNgos}
            selectedNgo={selectedNgo}
            onSelectNgo={setSelectedNgo}
            userLocation={userLocation}
          />
        </div>

      </div>

    </div>
  );
};

export default MapPage;
