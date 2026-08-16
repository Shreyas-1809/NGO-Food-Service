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
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Header & Location Search */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            DONOR ↔ NGO LIVE MAP EXPLORER
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Locate nearby verified receivers, view pickup routes, and initiate smart matching in real-time.
          </p>
        </div>

        <LocationSearch
          onSelectLocation={handleSelectLocation}
          onUseCurrentLocation={handleUseCurrentLocation}
        />
      </div>

      {/* MAIN RESPONSIVE MAP CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[650px]">
        
        {/* LEFT / MOBILE BOTTOM: FILTERS & NGO LIST */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col space-y-6 overflow-y-auto max-h-[650px]">
          
          {/* Filters Bar */}
          <div className="space-y-4 pb-4 border-b border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span className="flex items-center"><Filter className="w-4 h-4 mr-1 text-emerald-600" /> Filter Locations</span>
              <span>{filteredNgos.length} NGOs Found</span>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Resource Category</label>
              <select
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-xs rounded-xl border border-slate-200 dark:border-slate-600 outline-none"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                <option value="Food">Food</option>
                <option value="Clothes">Clothes</option>
                <option value="Books">Books</option>
                <option value="Medical">Medical Supplies</option>
                <option value="Electronics">Electronics</option>
                <option value="Educational">Educational Materials</option>
              </select>
            </div>

            {/* Distance & Urgency */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Max Distance</label>
                <select
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-xs rounded-xl border border-slate-200 dark:border-slate-600 outline-none"
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
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Urgency</label>
                <select
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-xs rounded-xl border border-slate-200 dark:border-slate-600 outline-none"
                  value={selectedUrgency}
                  onChange={(e) => setSelectedUrgency(e.target.value)}
                >
                  <option value="ALL">All Urgency</option>
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="NORMAL">Normal</option>
                </select>
              </div>
            </div>

            {/* Verified Only Checkbox */}
            <label className="flex items-center space-x-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300 pt-1">
              <input
                type="checkbox"
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
              />
              <span>Verified Only</span>
            </label>
          </div>

          {/* NGO List */}
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {filteredNgos.map((ngo) => (
              <div
                key={ngo.id}
                onClick={() => setSelectedNgo(ngo)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                  selectedNgo?.id === ngo.id
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                    {ngo.name}
                  </h3>
                  {ngo.verified && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-emerald-200">
                      ✓ Verified
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center font-medium">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-600" /> {ngo.area}, {ngo.city} • <strong>{ngo.distanceKm} km away</strong>
                </p>

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedNgo(ngo); }}
                    className="text-xs font-bold text-emerald-600 hover:underline flex items-center"
                  >
                    VIEW ON MAP <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate('/donate'); }}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700"
                  >
                    MATCH & DONATE
                  </button>
                </div>
              </div>
            ))}

            {filteredNgos.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs font-medium">
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
