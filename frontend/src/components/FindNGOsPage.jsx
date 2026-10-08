import React, { useState, useEffect } from 'react';
import {
  fetchNGOs,
  AVAILABLE_CITIES,
  AVAILABLE_CAUSES
} from '../services/ngoDirectoryService';
import { calculateDistanceKm } from '../services/mapsService';
import {
  Search, MapPin, ExternalLink, Building2, ChevronDown,
  ArrowRight, Globe, Info, X, Phone, Mail, MessageCircle, HeartHandshake, BookOpen, Users, Utensils
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MapView from './MapView';
import RedirectSurplusModal from './RedirectSurplusModal';
import ContactNgoModal from './ContactNgoModal';
import Avatar from './ui/Avatar';
import Drawer from './ui/Drawer';
import Button from './ui/Button';
import EmptyState from './ui/EmptyState';
import IconCircleBadge from './ui/IconCircleBadge';
import EmptyStateNoResults from './illustrations/EmptyStateNoResults';
import { T, useTranslatedString } from '../context/LanguageContext';

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

  const searchNamePlaceholder = useTranslatedString('Search by NGO name...');
  const searchAreaPlaceholder = useTranslatedString('Filter by locality (e.g. Kothrud)...');

  const TYPE_FILTERS = [
    'All Types', 'Hunger Relief', 'Food Rescue', 'Education', 
    'Child Welfare', 'Mid-Day Meals', 'Community Service', 
    'Volunteering', 'Food', 'Disaster Relief'
  ];

  const matchesType = (ngo, type) => {
    if (type === 'All Types') return true;
    const cat = (ngo.category || '').toLowerCase();
    const causes = (ngo.causes || []).map(c => c.toLowerCase()).join(' ');
    const combined = cat + ' ' + causes;
    const searchType = type.toLowerCase();
    
    if (combined.includes(searchType)) return true;
    
    if (type === 'Food Rescue' || type === 'Hunger Relief' || type === 'Food' || type === 'Mid-Day Meals') {
      return combined.includes('food') || combined.includes('hunger') || combined.includes('relief') || combined.includes('rescue') || combined.includes('meal');
    }
    if (type === 'Child Welfare' || type === 'Education') {
      return combined.includes('child') || combined.includes('youth') || combined.includes('education') || combined.includes('school') || combined.includes('orphan');
    }
    if (type === 'Community Service' || type === 'Volunteering' || type === 'Disaster Relief') {
      return combined.includes('community') || combined.includes('volunteer') || combined.includes('disaster') || combined.includes('welfare');
    }
    return false;
  };

  const getNgoIdentity = (name) => {
    const n = name.toLowerCase();
    if (n.includes('robin hood')) return { icon: HeartHandshake, color: '#F97316', bg: 'rgba(249, 115, 22, 0.15)' }; // Orange
    if (n.includes('muktangan')) return { icon: BookOpen, color: '#6366F1', bg: 'rgba(99, 102, 241, 0.15)' }; // Indigo
    if (n.includes('goonj')) return { icon: Users, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' }; // Amber
    if (n.includes('ivolunteer')) return { icon: Users, color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)' }; // Cyan
    if (n.includes('feeding india') || n.includes('zomato')) return { icon: Utensils, color: '#FB923C', bg: 'rgba(251, 146, 60, 0.15)' }; // Orange-400
    if (n.includes('akshaya patra')) return { icon: Utensils, color: '#A855F7', bg: 'rgba(168, 85, 247, 0.15)' }; // Purple
    return { icon: Building2, color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' }; // Default Emerald
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
      const distA = a.distanceKm !== undefined ? a.distanceKm : 999;
      const distB = b.distanceKm !== undefined ? b.distanceKm : 999;
      
      if (sortBy === 'Nearest First') return distA - distB;
      if (sortBy === 'Farthest First') return distB - distA;
      if (sortBy === 'Name A-Z') return a.name.localeCompare(b.name);
      if (sortBy === 'Name Z-A') return b.name.localeCompare(a.name);
      return 0;
    });

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 pt-6 sm:pt-8 pb-8">
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          <T text="Find NGOs" />
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          <T text="Explore and connect with verified partner organizations, shelters, and food relief centers." />
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 space-y-3 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search by Name */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder={searchNamePlaceholder || "Search by NGO name..."}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Search by Area */}
          <div className="relative">
            <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder={searchAreaPlaceholder || "Filter by locality (e.g. Kothrud)..."}
              value={areaSearch}
              onChange={e => setAreaSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            {TYPE_FILTERS.map(t => (
              <option key={t} value={t} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
                <T text={t} />
              </option>
            ))}
          </select>

          {/* Sort Filter */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="Nearest First" className="bg-white dark:bg-slate-800"><T text="Nearest First" /></option>
            <option value="Farthest First" className="bg-white dark:bg-slate-800"><T text="Farthest First" /></option>
            <option value="Name A-Z" className="bg-white dark:bg-slate-800"><T text="Name A-Z" /></option>
            <option value="Name Z-A" className="bg-white dark:bg-slate-800"><T text="Name Z-A" /></option>
          </select>
        </div>
      </div>

      {/* Grid of NGOs */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
          <T text="Loading NGO directory..." />
        </div>
      ) : filteredNgos.length === 0 ? (
        <EmptyState
          illustration={EmptyStateNoResults}
          message={<T text="No organisations found matching your filters." />}
          description={<T text="Try adjusting your search terms, cause filter, or locality to discover nearby verified food relief partners." />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNgos.map(ngo => (
            <div
              key={ngo.id}
              onClick={() => setSelectedNgo(ngo)}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/60 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col h-full"
            >
              {/* TOP: Logo, Name, Location */}
              <div className="flex items-start space-x-4">
                {ngo.logo && !ngo.logo.includes('images.unsplash.com') ? (
                  <Avatar name={ngo.name} src={ngo.logo} className="w-12 h-12 rounded-full shrink-0" />
                ) : (
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-xs" 
                    style={{ backgroundColor: getNgoIdentity(ngo.name).bg, color: getNgoIdentity(ngo.name).color }}
                  >
                    {React.createElement(getNgoIdentity(ngo.name).icon, { className: "w-6 h-6" })}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight">
                    <T text={ngo.name} />
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center mt-1 truncate">
                    <MapPin className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                    <span className="truncate">{ngo.area || ngo.city} • ~{ngo.distanceKm?.toFixed(1) || 4.2} km</span>
                  </span>
                </div>
              </div>

              {/* MIDDLE: Category tags (flex-1 pushes footer to bottom) */}
              <div className="flex-1 flex flex-col justify-end mt-4">
                <div className="flex flex-wrap gap-1.5">
                  {(ngo.causes || []).slice(0, 3).map((cause, idx) => (
                    <span key={idx} className="bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      <T text={cause} />
                    </span>
                  ))}
                </div>
              </div>

              {/* BOTTOM: Footer Actions */}
              <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors flex items-center whitespace-nowrap">
                  <T text="View Profile" /> <ArrowRight className="w-3 h-3 ml-1 shrink-0" />
                </span>

                {!isOrg ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/donate', { state: { prefill: { targetNgoName: ngo.name } } });
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-[10px] shadow-sm shadow-emerald-600/20 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <T text="Donate" />
                  </button>
                ) : (
                  <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setRedirectNgo(ngo)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      title="Request Food"
                      icon={Utensils}
                    >
                      <T text="Request Food" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setContactNgo(ngo)}
                      title="Contact NGO"
                      icon={Phone}
                    >
                      <T text="Contact" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected NGO Detail Drawer / Modal */}
      <Drawer
        isOpen={!!selectedNgo}
        onClose={() => setSelectedNgo(null)}
        title={<T text="Organisation Details" />}
      >
        {selectedNgo && (
          <div className="space-y-6 flex flex-col h-full justify-between">
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar name={selectedNgo.name} src={selectedNgo.logo} className="w-16 h-16 rounded-2xl text-xl" />
                <div>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white"><T text={selectedNgo.name} /></h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center mt-1">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {selectedNgo.address || `${selectedNgo.area}, ${selectedNgo.city}`}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <T text={selectedNgo.description} />
              </p>

              {/* Contact Information */}
              <div className="p-4 bg-slate-50 dark:bg-slate-700/40 rounded-2xl border border-slate-200/80 dark:border-slate-600 space-y-2.5 text-xs">
                <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider"><T text="Contact Channels" /></h5>
                {selectedNgo.phone && (
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center"><Phone className="w-3.5 h-3.5 mr-2 text-emerald-500" /><T text="Phone" /></span>
                    <a href={`tel:${selectedNgo.phone}`} className="font-bold hover:underline">{selectedNgo.phone}</a>
                  </div>
                )}
                {selectedNgo.email && (
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center"><Mail className="w-3.5 h-3.5 mr-2 text-blue-500" /><T text="Email" /></span>
                    <a href={`mailto:${selectedNgo.email}`} className="font-bold hover:underline">{selectedNgo.email}</a>
                  </div>
                )}
                {selectedNgo.website && (
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="flex items-center"><Globe className="w-3.5 h-3.5 mr-2 text-purple-500" /><T text="Portal" /></span>
                    <a href={selectedNgo.website} target="_blank" rel="noreferrer" className="font-bold text-emerald-600 hover:underline truncate max-w-[160px]">
                      <T text="Visit" /> ↗
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 mt-6 border-t border-slate-100 dark:border-slate-700 flex gap-2">
              {!isOrg ? (
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => {
                    setSelectedNgo(null);
                    navigate('/donate', { state: { prefill: { targetNgoName: selectedNgo.name } } });
                  }}
                  icon={ArrowRight}
                >
                  <T text="Donate Food" />
                </Button>
              ) : (
                <div className="flex-1 flex gap-2">
                  <Button
                    variant="primary"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => {
                      setRedirectNgo(selectedNgo);
                    }}
                    icon={Utensils}
                  >
                    <T text="Request Food" />
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setContactNgo(selectedNgo);
                    }}
                    icon={Phone}
                  >
                    <T text="Contact" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Modals */}
      {contactNgo && <ContactNgoModal ngo={contactNgo} onClose={() => setContactNgo(null)} />}
      {redirectNgo && <RedirectSurplusModal ngo={redirectNgo} user={user} onClose={() => setRedirectNgo(null)} />}
    </div>
  );
};

export default FindNGOsPage;
