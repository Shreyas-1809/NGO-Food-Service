import React, { useState, useEffect } from 'react';
import {
  fetchNGOs,
  AVAILABLE_CITIES,
  AVAILABLE_CAUSES
} from '../services/ngoDirectoryService';
import { calculateDistanceKm } from '../services/mapsService';
import {
  Search, MapPin, ExternalLink, Building2, ChevronDown, 
  ArrowRight, Globe, Info, X, Phone, Mail, MessageCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MapView from './MapView';

const FindNGOsPage = () => {
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [areaSearch, setAreaSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('Pune');
  const [selectedCause, setSelectedCause] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');
  const [sortBy, setSortBy] = useState('Nearest First');
  const [selectedNgo, setSelectedNgo] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [contactMenuOpenId, setContactMenuOpenId] = useState(null);
  const navigate = useNavigate();

  const TYPE_FILTERS = ['All Types', 'NGO / Food Rescue', 'Orphanage', 'Old Age Home'];

  const matchesType = (ngo, type) => {
    if (type === 'All Types') return true;
    const cat = (ngo.category || '').toLowerCase();
    const causes = (ngo.causes || []).map(c => c.toLowerCase()).join(' ');
    const combined = cat + ' ' + causes;
    if (type === 'NGO / Food Rescue') {
      return combined.includes('food') || combined.includes('hunger') || combined.includes('relief') || combined.includes('rescue') || combined.includes('volunteer') || combined.includes('education') || combined.includes('nutrition');
    }
    if (type === 'Orphanage') {
      return combined.includes('orphan') || combined.includes('child care');
    }
    if (type === 'Old Age Home') {
      return combined.includes('elder') || combined.includes('old age') || combined.includes('senior');
    }
    return true;
  };

  useEffect(() => {
    setLoading(true);
    fetchNGOs({ city: selectedCity, searchTerm, category: selectedCause, areaSearch })
      .then(data => {
        // Compute distances
        let processedData = userLocation
          ? data.map(ngo => ({ ...ngo, distanceKm: calculateDistanceKm(userLocation, ngo.location) }))
          : data;

        // Type filter
        if (selectedType !== 'All Types') {
          processedData = processedData.filter(ngo => matchesType(ngo, selectedType));
        }

        // Sorting
        processedData.sort((a, b) => {
          if (sortBy === 'Name (A–Z)') {
            return (a.name || '').localeCompare(b.name || '');
          }
          if (sortBy === 'Category') {
            return (a.category || '').localeCompare(b.category || '');
          }
          // Default: Nearest First
          const distA = a.distanceKm === 'N/A' || a.distanceKm == null ? Infinity : Number(a.distanceKm);
          const distB = b.distanceKm === 'N/A' || b.distanceKm == null ? Infinity : Number(b.distanceKm);
          return distA - distB;
        });

        setNgos(processedData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedCity, selectedCause, searchTerm, areaSearch, userLocation, selectedType, sortBy]);

  // Auto-request geolocation on mount for distance sorting
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          // Permission denied or unavailable — silently fall back to default distances
        }
      );
    }
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 relative">
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
            <strong>Demo Directory:</strong> The organizations listed below are representative profiles for development purposes.
          </div>
        </div>

        {/* Search & Filters Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, cause..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="relative flex-1">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Area (e.g., Kharadi)"
              value={areaSearch}
              onChange={(e) => setAreaSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Type & Sort Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs outline-none focus:border-emerald-500 transition-colors appearance-none cursor-pointer"
            >
              {TYPE_FILTERS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="relative flex-1">
            <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs outline-none focus:border-emerald-500 transition-colors appearance-none cursor-pointer"
            >
              <option value="Nearest First">Sort: Nearest First</option>
              <option value="Name (A–Z)">Sort: Name (A–Z)</option>
              <option value="Category">Sort: Category</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>
          {loading ? 'Searching...' : `${ngos.length} organization${ngos.length !== 1 ? 's' : ''} found`}
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
              onClick={() => setSelectedNgo(ngo)}
            >
              <div className="space-y-3">
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
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
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
                      {userLocation ? '' : '~'}{ngo.distanceKm} km {userLocation ? 'from you' : 'from center'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNgo(ngo);
                    setIsMapModalOpen(true);
                  }}
                  className="flex-1 py-2 text-center text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors flex items-center justify-center space-x-1"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  <span>Locate on Map</span>
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

      {/* NGO Detail Modal */}
      {selectedNgo && !isMapModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedNgo(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedNgo.name}</h2>
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{selectedNgo.category}</p>
                </div>
                <button onClick={() => setSelectedNgo(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-700 p-1.5 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-sm text-slate-600 dark:text-slate-300">{selectedNgo.description}</p>
              
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-sm">
                <div className="flex items-start space-x-3 text-slate-600 dark:text-slate-300">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
                  <span>{selectedNgo.address}</span>
                </div>
                {selectedNgo.phone && (
                  <div className="flex items-center space-x-3 text-slate-600 dark:text-slate-300">
                    <Phone className="w-4 h-4 shrink-0 text-slate-400" />
                    <span>{selectedNgo.phone}</span>
                  </div>
                )}
                {selectedNgo.email && (
                  <div className="flex items-center space-x-3 text-slate-600 dark:text-slate-300">
                    <Mail className="w-4 h-4 shrink-0 text-slate-400" />
                    <span>{selectedNgo.email}</span>
                  </div>
                )}
                {selectedNgo.website && (
                  <div className="flex items-center space-x-3 text-slate-600 dark:text-slate-300">
                    <Globe className="w-4 h-4 shrink-0 text-slate-400" />
                    <a href={selectedNgo.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      {selectedNgo.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>
              
              <div className="pt-5 flex gap-3 relative">
                <button
                  onClick={() => navigate('/donate', { state: { prefill: { targetNgoName: selectedNgo.name } } })}
                  className="flex-1 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center justify-center space-x-2 shadow-xs"
                >
                  <span>Donate Food</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                
                <div className="relative">
                  <button
                    onClick={() => setContactMenuOpenId(contactMenuOpenId === selectedNgo.id ? null : selectedNgo.id)}
                    className="py-3 px-4 text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>Contact</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  
                  {contactMenuOpenId === selectedNgo.id && (
                    <div className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-[110] py-1">
                      {selectedNgo.phone && (
                        <a href={`tel:${selectedNgo.phone}`} className="flex items-center px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                          <Phone className="w-4 h-4 mr-3 text-emerald-500" /> Call
                        </a>
                      )}
                      {selectedNgo.phone && (
                        <a href={`https://wa.me/${selectedNgo.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                          <MessageCircle className="w-4 h-4 mr-3 text-green-500" /> WhatsApp
                        </a>
                      )}
                      {selectedNgo.website && (
                        <a href={selectedNgo.website} target="_blank" rel="noopener noreferrer" className="flex items-center px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                          <Globe className="w-4 h-4 mr-3 text-blue-500" /> Website
                        </a>
                      )}
                      {selectedNgo.socials?.instagram && (
                        <a href={selectedNgo.socials.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                          <ExternalLink className="w-4 h-4 mr-3 text-pink-500" /> Instagram
                        </a>
                      )}
                      {selectedNgo.socials?.facebook && (
                        <a href={selectedNgo.socials.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                          <ExternalLink className="w-4 h-4 mr-3 text-blue-600" /> Facebook
                        </a>
                      )}
                      {selectedNgo.socials?.twitter && (
                        <a href={selectedNgo.socials.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                          <ExternalLink className="w-4 h-4 mr-3 text-sky-500" /> Twitter
                        </a>
                      )}
                      {selectedNgo.socials?.linkedin && (
                        <a href={selectedNgo.socials.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                          <ExternalLink className="w-4 h-4 mr-3 text-blue-700" /> LinkedIn
                        </a>
                      )}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => setIsMapModalOpen(true)}
                  className="py-3 px-4 text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors flex items-center justify-center space-x-2"
                >
                  <MapPin className="w-4 h-4 text-blue-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Modal */}
      {isMapModalOpen && selectedNgo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-black/80 backdrop-blur-sm" onClick={() => setIsMapModalOpen(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl h-[80vh] shadow-2xl flex flex-col relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="absolute top-4 right-4 z-10">
              <button onClick={() => setIsMapModalOpen(false)} className="bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:bg-red-500 hover:text-white p-2 rounded-full shadow-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* The MapView is only rendered when the modal is open, to prevent API key issues on load */}
            <MapView ngos={[selectedNgo]} userLocation={userLocation} />
          </div>
        </div>
      )}
    </div>
  );
};

export default FindNGOsPage;
