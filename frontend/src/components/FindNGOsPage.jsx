import React, { useState, useEffect } from 'react';
import {
  getAllDemoNGOs,
  fetchNGOs,
  AVAILABLE_CITIES,
  AVAILABLE_CAUSES
} from '../services/ngoDirectoryService';
import {
  Search,
  MapPin,
  ExternalLink,
  Building2,
  Filter,
  ChevronDown,
  AlertCircle,
  ArrowRight,
  Globe,
  Info,
  Users,
  Utensils,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WorkflowNav from './WorkflowNav';

const FindNGOsPage = () => {
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('Pune');
  const [selectedCause, setSelectedCause] = useState('');
  const [selectedNgo, setSelectedNgo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetchNGOs({ city: selectedCity, searchTerm, category: selectedCause })
      .then(data => {
        setNgos(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedCity, selectedCause, searchTerm]);

  const urgencyColor = (urgency) => {
    if (urgency === 'HIGH') return 'text-red-700 bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900';
    if (urgency === 'MEDIUM') return 'text-amber-700 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900';
    return 'text-slate-600 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
            Community Partner Network
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Find NGOs & Verified Hubs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Discover food rescue organizations, community kitchens, and shelters in your city. Donate directly, volunteer, or track live deliveries.
          </p>
        </div>

        {/* Demo Data Notice */}
        <div className="flex items-start space-x-2.5 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <strong>Demo Directory:</strong> The organizations listed below are representative profiles for development purposes, clearly marked as "Demo Organization." In production, this page connects to a verified NGO registry API. Visit each organization's official website for real contact information.
          </div>
        </div>

        {/* Search & Filters Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, area, or cause..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="py-2.5 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs outline-none font-semibold"
          >
            {AVAILABLE_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={selectedCause}
            onChange={(e) => setSelectedCause(e.target.value)}
            className="py-2.5 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs outline-none font-semibold"
          >
            <option value="">All Causes</option>
            {AVAILABLE_CAUSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>
          {loading ? 'Searching...' : `${ngos.length} organization${ngos.length !== 1 ? 's' : ''} found in ${selectedCity}`}
        </span>
        <span className="font-semibold text-slate-400">Powered by Verified Directory · Seamless Flow Integration</span>
      </div>

      {/* NGO Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 animate-pulse h-64" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ngos.map(ngo => (
            <div
              key={ngo.id}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-500 transition-all cursor-pointer group"
              onClick={() => setSelectedNgo(selectedNgo?.id === ngo.id ? null : ngo)}
            >
              <div className="space-y-3">
                {/* Demo Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                    {ngo.demoLabel || 'Verified Hub'}
                  </span>
                  {ngo.urgency && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${urgencyColor(ngo.urgency)}`}>
                      {ngo.urgency === 'HIGH' ? '🔴 Needs Food Now' : ngo.urgency === 'MEDIUM' ? '🟡 Accepting Donations' : 'Open'}
                    </span>
                  )}
                </div>

                {/* Name */}
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {ngo.name}
                  </h3>
                  <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {ngo.category}
                  </p>
                </div>

                {/* Description */}
                <p className={`text-xs text-slate-600 dark:text-slate-300 leading-relaxed ${selectedNgo?.id === ngo.id ? '' : 'line-clamp-2'}`}>
                  {ngo.description}
                </p>

                {/* Location & Distance */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-1.5 text-xs">
                  <div className="flex items-center text-slate-600 dark:text-slate-300">
                    <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" />
                    <span className="truncate">{ngo.address}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="flex items-center">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
                      ~{ngo.distanceKm} km from center
                    </span>
                    {ngo.capacity && (
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{ngo.capacity}</span>
                    )}
                  </div>
                </div>

                {/* Accepted Food Types */}
                {ngo.foodTypesAccepted && (
                  <div className="flex flex-wrap gap-1">
                    {ngo.foodTypesAccepted.slice(0, 3).map(f => (
                      <span key={f} className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-medium">
                        {f}
                      </span>
                    ))}
                    {ngo.foodTypesAccepted.length > 3 && (
                      <span className="text-[10px] text-slate-400 px-1 py-0.5">+{ngo.foodTypesAccepted.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/map', { state: { selectedNgoId: ngo.id, selectedNgoName: ngo.name } });
                  }}
                  className="flex-1 py-2 text-center text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors flex items-center justify-center space-x-1"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  <span>Map</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/donate', { state: { prefill: { targetNgoName: ngo.name } } });
                  }}
                  className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center justify-center space-x-1 shadow-xs"
                >
                  <span>Donate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {ngos.length === 0 && !loading && (
            <div className="col-span-full text-center py-16 text-slate-400">
              <Building2 className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">No organizations found</p>
              <p className="text-xs mt-1">Try adjusting your search term or filters.</p>
            </div>
          )}
        </div>
      )}

      {/* Architecture note at bottom */}
      <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center">
          <Info className="w-3.5 h-3.5 mr-1.5" /> Developer Note: NGO Data Architecture
        </p>
        <p>
          This directory connects directly with the live matching engine and logistics map.
        </p>
      </div>

    </div>
  );
};

export default FindNGOsPage;
