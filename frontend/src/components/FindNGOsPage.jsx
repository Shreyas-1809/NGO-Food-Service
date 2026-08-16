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
    if (urgency === 'HIGH') return 'text-red-600 bg-red-50 border-red-200';
    if (urgency === 'MEDIUM') return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-stone-600 bg-stone-50 border-stone-200';
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

      {/* Header */}
      <div className="bg-white dark:bg-[#161918] p-6 sm:p-8 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
        <div>
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">
            Community Partner Network
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white">
            Find NGOs & Organizations
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-2xl">
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
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, area, or cause..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white text-xs outline-none focus:border-[#1B4332] transition-colors"
            />
          </div>

          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="py-2.5 px-3 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white text-xs outline-none"
          >
            {AVAILABLE_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={selectedCause}
            onChange={(e) => setSelectedCause(e.target.value)}
            className="py-2.5 px-3 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white text-xs outline-none"
          >
            <option value="">All Causes</option>
            {AVAILABLE_CAUSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
        <span>
          {loading ? 'Searching...' : `${ngos.length} organization${ngos.length !== 1 ? 's' : ''} found in ${selectedCity}`}
        </span>
        <span className="font-semibold text-stone-400">Powered by Demo Registry · Connect Real API in Production</span>
      </div>

      {/* NGO Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-white dark:bg-[#161918] rounded-2xl p-6 border border-stone-200 dark:border-stone-800 animate-pulse h-64" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ngos.map(ngo => (
            <div
              key={ngo.id}
              className="bg-white dark:bg-[#161918] rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-stone-300 dark:hover:border-stone-700 transition-colors cursor-pointer"
              onClick={() => setSelectedNgo(selectedNgo?.id === ngo.id ? null : ngo)}
            >
              <div className="space-y-3">
                {/* Demo Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                    {ngo.demoLabel}
                  </span>
                  {ngo.urgency && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${urgencyColor(ngo.urgency)}`}>
                      {ngo.urgency === 'HIGH' ? 'Needs Food Now' : ngo.urgency === 'MEDIUM' ? 'Accepting Donations' : 'Open'}
                    </span>
                  )}
                </div>

                {/* Name */}
                <div>
                  <h3 className="font-bold text-stone-900 dark:text-white text-base leading-snug">
                    {ngo.name}
                  </h3>
                  <p className="text-[11px] font-semibold text-[#1B4332] dark:text-emerald-400 mt-0.5">
                    {ngo.category}
                  </p>
                </div>

                {/* Description */}
                <p className={`text-xs text-stone-600 dark:text-stone-300 leading-relaxed ${selectedNgo?.id === ngo.id ? '' : 'line-clamp-2'}`}>
                  {ngo.description}
                </p>

                {/* Location & Distance */}
                <div className="p-3 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800 space-y-1.5 text-xs">
                  <div className="flex items-center text-stone-600 dark:text-stone-300">
                    <MapPin className="w-3.5 h-3.5 mr-1.5 text-stone-400 shrink-0" />
                    <span className="truncate">{ngo.address}</span>
                  </div>
                  <div className="flex items-center justify-between text-stone-500">
                    <span className="flex items-center">
                      <span className="w-2 h-2 rounded-full bg-stone-300 mr-1.5" />
                      ~{ngo.distanceKm} km from city center
                    </span>
                    {ngo.capacity && (
                      <span className="font-medium text-stone-700 dark:text-stone-300">{ngo.capacity}</span>
                    )}
                  </div>
                </div>

                {/* Accepted Food Types */}
                {ngo.foodTypesAccepted && (
                  <div className="flex flex-wrap gap-1">
                    {ngo.foodTypesAccepted.slice(0, 3).map(f => (
                      <span key={f} className="text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded font-medium">
                        {f}
                      </span>
                    ))}
                    {ngo.foodTypesAccepted.length > 3 && (
                      <span className="text-[10px] text-stone-400 px-1 py-0.5">+{ngo.foodTypesAccepted.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex gap-2">
                <a
                  href={ngo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 py-2 text-center text-xs font-semibold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-colors flex items-center justify-center space-x-1"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Official Site</span>
                </a>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/donate', { state: { prefill: { targetNgoName: ngo.name } } });
                  }}
                  className="flex-1 py-2 text-xs font-bold text-white bg-[#1B4332] hover:bg-[#143326] rounded-lg transition-colors flex items-center justify-center space-x-1"
                >
                  <span>Donate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {ngos.length === 0 && !loading && (
            <div className="col-span-full text-center py-16 text-stone-400">
              <Building2 className="w-10 h-10 mx-auto text-stone-300 dark:text-stone-700 mb-3" />
              <p className="font-semibold text-stone-600 dark:text-stone-300">No organizations found</p>
              <p className="text-xs mt-1">Try adjusting your search term or filters.</p>
            </div>
          )}
        </div>
      )}

      {/* Architecture note at bottom */}
      <div className="bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 text-xs text-stone-500 dark:text-stone-400 space-y-1">
        <p className="font-bold text-stone-700 dark:text-stone-300 flex items-center">
          <Info className="w-3.5 h-3.5 mr-1.5" /> Developer Note: NGO Data Architecture
        </p>
        <p>
          This directory is powered by <code className="bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded font-mono text-stone-700 dark:text-stone-200">ngoDirectoryService.js</code>. 
          To connect real verified NGO data, set <code className="bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded font-mono text-stone-700 dark:text-stone-200">VITE_NGO_API_URL</code> in 
          your <code className="bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded font-mono">frontend/.env</code> and update the <code className="font-mono">fetchNGOs()</code> function to call your backend.
          Real sources: NGO Darpan (Gov India), GuideStar India, or your own verified NGO dataset.
        </p>
      </div>

    </div>
  );
};

export default FindNGOsPage;
