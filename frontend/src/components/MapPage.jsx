import React, { useState, useEffect } from 'react';
import { MOCK_NGOS } from '../services/mockData';
import MapView from './MapView';
import LocationSearch from './LocationSearch';
import { 
  Filter, 
  MapPin, 
  ShieldCheck, 
  ArrowRight, 
  Crosshair, 
  Check, 
  Package, 
  AlertCircle, 
  Sparkles, 
  Building2 
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import WorkflowNav from './WorkflowNav';

const MapPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [ngos, setNgos] = useState(MOCK_NGOS);
  const [selectedNgo, setSelectedNgo] = useState(MOCK_NGOS[0]);
  const [userLocation, setUserLocation] = useState({ lat: 18.5204, lng: 73.8567 }); // Pune center default
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [maxDistance, setMaxDistance] = useState(25);
  const [selectedUrgency, setSelectedUrgency] = useState('ALL');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Auto-focus NGO if passed through router state from LiveFeed or NGORequirementsPage
  useEffect(() => {
    if (location.state?.selectedNgoId) {
      const match = ngos.find(n => n.id === location.state.selectedNgoId || n.name === location.state.selectedNgoName);
      if (match) {
        setSelectedNgo(match);
      }
    }
  }, [location.state, ngos]);

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
      
      {/* Clean Header */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
            <MapPin className="w-4 h-4" />
            <span>Interactive Logistics Map</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Surplus & NGO Distribution Map
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
            Locate nearby verified receivers, view pickup routes, and initiate smart donation matching in real-time.
          </p>
        </div>
      </div>

      {/* Location Search Bar Card */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
        <LocationSearch
          onSelectLocation={handleSelectLocation}
          onUseCurrentLocation={handleUseCurrentLocation}
        />
      </div>

      {/* MAIN RESPONSIVE MAP CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[640px]">
        
        {/* LEFT / MOBILE BOTTOM: FILTERS & NGO LIST */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col space-y-4 overflow-y-auto max-h-[640px]">
          
          {/* Filters Bar */}
          <div className="space-y-3 pb-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span className="flex items-center"><Filter className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Filter Hubs</span>
              <span className="text-emerald-600 dark:text-emerald-400">{filteredNgos.length} Centers</span>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <select
                className="w-full p-2 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-xs rounded-xl border border-slate-200 dark:border-slate-600 outline-none font-semibold"
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
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Max Radius</label>
                <select
                  className="w-full p-2 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-xs rounded-xl border border-slate-200 dark:border-slate-600 outline-none font-semibold"
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
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Urgency</label>
                <select
                  className="w-full p-2 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-xs rounded-xl border border-slate-200 dark:border-slate-600 outline-none font-semibold"
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
            <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300 pt-0.5">
              <input
                type="checkbox"
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
              />
              <span>Verified Hubs Only</span>
            </label>
          </div>

          {/* NGO List */}
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {filteredNgos.map((ngo) => {
              const isSelected = selectedNgo?.id === ngo.id;
              const topReq = ngo.currentRequirements?.[0];

              return (
                <div
                  key={ngo.id}
                  onClick={() => setSelectedNgo(ngo)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 text-xs ${
                    isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                      : 'bg-slate-50 dark:bg-slate-700/30 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-900 dark:text-white truncate mr-2">
                      {ngo.name}
                    </h3>
                    {ngo.verified && (
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 shrink-0">
                        ✓ Verified
                      </span>
                    )}
                  </div>

                  <p className="text-slate-500 dark:text-slate-400 flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" /> {ngo.area}, {ngo.city} • <strong>~{ngo.distanceKm} km</strong>
                  </p>

                  {/* Highlight active requirement */}
                  {topReq && (
                    <div className="p-2 bg-amber-50/80 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-900 dark:text-amber-300 flex items-center justify-between">
                      <span className="truncate">
                        Needs: <strong>{topReq.quantity} {topReq.unit} {topReq.item}</strong>
                      </span>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-600 text-white shrink-0 ml-1">
                        Shortage
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 dark:border-slate-700">
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        navigate('/requirements'); 
                      }}
                      className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center text-[11px]"
                    >
                      <AlertCircle className="w-3 h-3 mr-1 text-amber-500" />
                      <span>View Demands</span>
                    </button>
                    
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        navigate('/donate', { state: { prefill: { targetNgoId: ngo.id, targetNgoName: ngo.name } } }); 
                      }}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-colors shadow-xs"
                    >
                      Donate
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredNgos.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">
                No NGOs match the selected filters.
              </div>
            )}
          </div>

        </div>

        {/* RIGHT: MAP VIEW */}
        <div className="lg:col-span-8 h-[450px] lg:h-full rounded-2xl overflow-hidden shadow-xs border border-slate-200 dark:border-slate-700">
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
