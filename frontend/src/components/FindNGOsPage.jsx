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
import RedirectSurplusModal from './RedirectSurplusModal';
import ContactNgoModal from './ContactNgoModal';

const FindNGOsPage = ({ user }) => {
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
  const [redirectNgo, setRedirectNgo] = useState(null);
  const [contactNgo, setContactNgo] = useState(null);
  const navigate = useNavigate();

  const isOrg = user?.accountType === 'ORGANISATION' || 
                user?.accountType === 'ORGANIZATION' || 
                user?.role === 'ORGANISATION' || 
                user?.role === 'ORGANIZATION' || 
                Boolean(user?.orgName);

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
      return combined.includes('orphan') || combined.includes('child') || combined.includes('youth') || combined.includes('girl');
    }
    if (type === 'Old Age Home') {
      return combined.includes('elder') || combined.includes('senior') || combined.includes('age') || combined.includes('care');
    }
    return true;
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => console.log('Location access not granted:', err.message)
      );
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchNGOs({ city: selectedCity, cause: selectedCause });
        setNgos(data);
      } catch (err) {
        console.error('Error fetching NGOs:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedCity, selectedCause]);

  const filteredNgos = ngos
    .map(ngo => {
      let distanceKm = ngo.distanceKm;
      if (userLocation && ngo.location?.lat && ngo.location?.lng) {
        distanceKm = calculateDistanceKm(userLocation.lat, userLocation.lng, ngo.location.lat, ngo.location.lng);
      }
      return { ...ngo, distanceKm };
    })
    .filter(ngo => {
      const matchSearch =
        ngo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ngo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ngo.causes && ngo.causes.some(c => c.toLowerCase().includes(searchTerm.toLowerCase())));
      const matchArea = !areaSearch || (ngo.area && ngo.area.toLowerCase().includes(areaSearch.toLowerCase()));
      const matchType = matchesType(ngo, selectedType);
      return matchSearch && matchArea && matchType;
    })
    .sort((a, b) => {
      if (sortBy === 'Nearest First') {
        const distA = a.distanceKm !== undefined ? a.distanceKm : 999;
        const distB = b.distanceKm !== undefined ? b.distanceKm : 999;
        return distA - distB;
      }
      if (sortBy === 'Highest Rated') {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === 'Name A-Z') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Verified NGO Directory
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Explore and connect with verified partner organizations, shelters, and food relief centers.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search by Name */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by NGO name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Search by Area */}
          <div className="relative">
            <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by locality (e.g. Kothrud)..."
              value={areaSearch}
              onChange={e => setAreaSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {TYPE_FILTERS.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Sort Filter */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Nearest First">Nearest First</option>
            <option value="Highest Rated">Highest Rated</option>
            <option value="Name A-Z">Name A-Z</option>
          </select>
        </div>
      </div>

      {/* Grid of NGOs */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
          Loading NGO directory...
        </div>
      ) : filteredNgos.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500">
          <Building2 className="w-8 h-8 mx-auto text-slate-400 mb-2" />
          <p className="font-bold text-sm">No organisations found matching your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNgos.map(ngo => (
            <div
              key={ngo.id}
              onClick={() => setSelectedNgo(ngo)}
              className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src={ngo.logo || 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=100&auto=format&fit=crop&q=60'}
                      alt={ngo.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-100 dark:border-slate-700 shrink-0"
                    />
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                        {ngo.name}
                      </h3>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center mt-0.5">
                        <MapPin className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                        {ngo.area || ngo.city} • ~{ngo.distanceKm || 4.2} km
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {ngo.description}
                </p>

                {/* Causes Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(ngo.causes || []).slice(0, 3).map((cause, idx) => (
                    <span key={idx} className="bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                      {cause}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center">
                  View Profile <ArrowRight className="w-3 h-3 ml-1" />
                </span>

                {!isOrg ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/donate', { state: { prefill: { targetNgoName: ngo.name } } });
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors shadow-xs"
                  >
                    Donate
                  </button>
                ) : (
                  <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setRedirectNgo(ngo)}
                      className="px-2.5 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-bold text-[11px] transition-colors flex items-center space-x-1 cursor-pointer"
                      title="Redirect Surplus Here"
                    >
                      <ArrowRight className="w-3 h-3" />
                      <span>Redirect</span>
                    </button>
                    <button
                      onClick={() => setContactNgo(ngo)}
                      className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 rounded-lg font-bold text-[11px] transition-colors border border-teal-200 dark:border-teal-800 flex items-center space-x-1 cursor-pointer"
                      title="Contact NGO"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Contact</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected NGO Detail Drawer / Modal */}
      {selectedNgo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex justify-end animate-in fade-in duration-200" onClick={() => setSelectedNgo(null)}>
          <div className="w-full max-w-md bg-white dark:bg-slate-800 h-full p-6 shadow-2xl overflow-y-auto space-y-6 flex flex-col justify-between animate-in slide-in-from-right duration-300" onClick={e => e.stopPropagation()}>
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Organisation Details</h3>
                <button onClick={() => setSelectedNgo(null)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center space-x-4">
                <img
                  src={selectedNgo.logo || 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=100&auto=format&fit=crop&q=60'}
                  alt={selectedNgo.name}
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                />
                <div>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white">{selectedNgo.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center mt-1">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {selectedNgo.address || `${selectedNgo.area}, ${selectedNgo.city}`}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {selectedNgo.description}
              </p>

              {/* Contact Information */}
              <div className="p-4 bg-slate-50 dark:bg-slate-700/40 rounded-2xl border border-slate-200/80 dark:border-slate-600 space-y-2.5 text-xs">
                <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">Contact Channels</h5>
                {selectedNgo.phone && (
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center"><Phone className="w-3.5 h-3.5 mr-2 text-emerald-500" /> Phone</span>
                    <a href={`tel:${selectedNgo.phone}`} className="font-bold hover:underline">{selectedNgo.phone}</a>
                  </div>
                )}
                {selectedNgo.email && (
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center"><Mail className="w-3.5 h-3.5 mr-2 text-blue-500" /> Email</span>
                    <a href={`mailto:${selectedNgo.email}`} className="font-bold hover:underline">{selectedNgo.email}</a>
                  </div>
                )}
                {selectedNgo.website && (
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center"><Globe className="w-3.5 h-3.5 mr-2 text-purple-500" /> Portal</span>
                    <a href={selectedNgo.website} target="_blank" rel="noreferrer" className="font-bold text-emerald-600 hover:underline truncate max-w-[160px]">
                      Visit ↗
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-2">
              {!isOrg ? (
                <button
                  onClick={() => navigate('/donate', { state: { prefill: { targetNgoName: selectedNgo.name } } })}
                  className="flex-1 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
                >
                  <span>Donate Food</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex-1 flex gap-2">
                  <button
                    onClick={() => setRedirectNgo(selectedNgo)}
                    className="flex-1 py-3 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>Redirect Surplus Here</span>
                  </button>
                  <button
                    onClick={() => setContactNgo(selectedNgo)}
                    className="py-3 px-4 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-bold rounded-xl text-sm transition-colors border border-teal-200 dark:border-teal-800 flex items-center space-x-1 cursor-pointer"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Contact</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {contactNgo && <ContactNgoModal ngo={contactNgo} onClose={() => setContactNgo(null)} />}
      {redirectNgo && <RedirectSurplusModal ngo={redirectNgo} user={user} onClose={() => setRedirectNgo(null)} />}
    </div>
  );
};

export default FindNGOsPage;
