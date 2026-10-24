import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  fetchRegisteredNGOs,
  fetchDiscoverNGOs,
  AVAILABLE_CITIES,
  AVAILABLE_CAUSES
} from '../services/ngoDirectoryService';
import { calculateDistanceKm } from '../services/mapsService';
import {
  Search, MapPin, ExternalLink, Building2, ArrowRight, Globe, Info, X, Phone, Mail, MessageCircle,
  ShieldCheck, AlertTriangle, RefreshCw, Share2, HeartHandshake,
  CheckCircle, Clock, Sparkles
} from 'lucide-react';
import RedirectSurplusModal from './RedirectSurplusModal';
import ContactNgoModal from './ContactNgoModal';
import ClaimProfileModal from './ClaimProfileModal';
import InviteOrgModal from './InviteOrgModal';
import AdminClaimsModal from './AdminClaimsModal';
import Avatar from './ui/Avatar';
import Drawer from './ui/Drawer';
import Button from './ui/Button';
import EmptyState from './ui/EmptyState';

import EmptyStateNoResults from './illustrations/EmptyStateNoResults';
import { T } from '../context/LanguageContext';

const FindNGOsPage = ({ user }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL state synchronization
  const currentTab = searchParams.get('tab') === 'discover' ? 'discover' : 'registered';
  const urlSearchTerm = searchParams.get('q') || searchParams.get('search') || '';
  const selectedCity = searchParams.get('city') || 'All Cities';
  const selectedCategory = searchParams.get('category') || 'All Categories';
  const sortBy = searchParams.get('sort') || 'Nearest';

  // Search input state: local value for immediate typing & focus, debounced value for filtering
  const [inputValue, setInputValue] = useState(urlSearchTerm);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearchTerm);
  const searchInputRef = React.useRef(null);
  const lastSyncedUrlSearchRef = React.useRef(urlSearchTerm);
  const isTypingRef = React.useRef(false);

  // Local data states
  const [registeredNgos, setRegisteredNgos] = useState([]);
  const [discoverNgos, setDiscoverNgos] = useState([]);
  const [loadingRegistered, setLoadingRegistered] = useState(true);
  const [loadingDiscover, setLoadingDiscover] = useState(false);
  const [registeredError, setRegisteredError] = useState(null);
  const [discoverError, setDiscoverError] = useState(null);

  // User location for real distance calculation
  const [userLocation, setUserLocation] = useState(null);

  // Active modals & drawers
  const [selectedNgo, setSelectedNgo] = useState(null);
  const [claimNgo, setClaimNgo] = useState(null);
  const [inviteNgo, setInviteNgo] = useState(null);
  const [redirectNgo, setRedirectNgo] = useState(null);
  const [contactNgo, setContactNgo] = useState(null);
  const [showAdminClaims, setShowAdminClaims] = useState(false);

  const isOrg = user?.accountType === 'ORGANISATION' || 
                user?.accountType === 'ORGANIZATION' || 
                user?.role === 'ORGANISATION' || 
                user?.role === 'ORGANIZATION' || 
                Boolean(user?.orgName);

  // Update URL search parameters helper
  const updateUrlParam = useCallback((key, value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (key === 'q' || key === 'search') {
        const trimmed = (value || '').trim();
        const currentQ = next.get('q') || next.get('search') || '';
        if (currentQ === trimmed) return prev;
        if (!trimmed) {
          next.delete('q');
          next.delete('search');
        } else {
          next.delete('search');
          next.set('q', trimmed);
        }
      } else {
        if (!value || value === 'All Categories' || value === 'All Cities' || (key === 'tab' && value === 'registered') || (key === 'sort' && value === 'Nearest')) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // Sync input value ONLY when URL search query changes externally (e.g. from top bar search, suggestion click, or back/forward)
  useEffect(() => {
    const q = searchParams.get('q') || searchParams.get('search') || '';
    if (q !== lastSyncedUrlSearchRef.current) {
      lastSyncedUrlSearchRef.current = q;
      setInputValue(q);
      setDebouncedSearch(q);
    }
  }, [searchParams]);

  // 300 ms debounce for live filtering and URL sync without losing input focus
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(inputValue);
      lastSyncedUrlSearchRef.current = (inputValue || '').trim();
      updateUrlParam('q', inputValue);
      isTypingRef.current = false;
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, updateUrlParam]);

  // Centralized clear search handler with explicit focus retention
  const handleClearSearch = useCallback(() => {
    setInputValue('');
    setDebouncedSearch('');
    lastSyncedUrlSearchRef.current = '';
    updateUrlParam('q', '');
    searchInputRef.current?.focus();
  }, [updateUrlParam]);

  // Request browser location for real distances
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.log('Location access not granted for distance calculation:', err.message);
        }
      );
    }
  }, []);

  // 1. Fetch Registered NGOs (Tier 1) from real DB
  const loadRegisteredNGOs = useCallback(async () => {
    setLoadingRegistered(true);
    setRegisteredError(null);
    try {
      const data = await fetchRegisteredNGOs();
      setRegisteredNgos(data);
    } catch (err) {
      console.error('Failed to load registered NGOs:', err);
      setRegisteredError('Unable to load registered organisations. Please check backend connection.');
    } finally {
      setLoadingRegistered(false);
    }
  }, []);

  useEffect(() => {
    loadRegisteredNGOs();
  }, [loadRegisteredNGOs]);

  // 2. Fetch Discover NGOs (Tier 2) from real public directory (OpenStreetMap)
  const loadDiscoverNGOs = useCallback(async () => {
    setLoadingDiscover(true);
    setDiscoverError(null);
    try {
      const data = await fetchDiscoverNGOs({
        city: selectedCity === 'All Cities' ? '' : selectedCity,
        lat: userLocation?.lat || null,
        lng: userLocation?.lng || null,
        registeredOrgs: registeredNgos
      });
      setDiscoverNgos(data);
    } catch (err) {
      console.error('Failed to load discover NGOs:', err);
      setDiscoverError(err.message || 'Unable to fetch public directory. Please retry.');
    } finally {
      setLoadingDiscover(false);
    }
  }, [selectedCity, userLocation, registeredNgos]);

  useEffect(() => {
    if (currentTab === 'discover') {
      loadDiscoverNGOs();
    }
  }, [currentTab, selectedCity, loadDiscoverNGOs]);

  // Filter and sort items for the active tab
  const activeList = useMemo(() => {
    const sourceList = currentTab === 'registered' ? registeredNgos : discoverNgos;

    // Attach accurate real distance
    const withDistance = sourceList.map(item => {
      let distanceKm = item.distanceKm;
      if (userLocation && item.lat && item.lng) {
        distanceKm = calculateDistanceKm(userLocation.lat, userLocation.lng, item.lat, item.lng);
      }
      return { ...item, distanceKm };
    });

    // Apply Search Term
    const term = debouncedSearch.trim().toLowerCase();
    const filtered = withDistance.filter(ngo => {
      const name = (ngo.name || '').toLowerCase();
      const addr = (ngo.address || '').toLowerCase();
      const area = (ngo.area || '').toLowerCase();
      const city = (ngo.city || '').toLowerCase();
      const desc = (ngo.description || '').toLowerCase();
      const cat = (ngo.category || '').toLowerCase();

      // Check active needs keywords for registered NGOs
      const needsMatch = (ngo.activeNeeds || []).some(n => 
        (n.title || '').toLowerCase().includes(term) || 
        (n.category || '').toLowerCase().includes(term) ||
        (n.item || '').toLowerCase().includes(term)
      );

      // Check categories in accepted food types or support areas
      const categoriesMatch = cat.includes(term) ||
        (Array.isArray(ngo.foodTypesAccepted) && ngo.foodTypesAccepted.some(c => c.toLowerCase().includes(term))) ||
        (Array.isArray(ngo.areasOfSupport) && ngo.areasOfSupport.some(c => c.toLowerCase().includes(term))) ||
        needsMatch;

      const matchesSearch = !term || 
        name.includes(term) || 
        desc.includes(term) ||
        addr.includes(term) || 
        area.includes(term) || 
        city.includes(term) || 
        categoriesMatch;

      // Category filter
      let matchesCat = true;
      if (selectedCategory && selectedCategory !== 'All Categories') {
        const catTarget = selectedCategory.toLowerCase();
        matchesCat = cat.includes(catTarget) || 
          desc.includes(catTarget) ||
          (ngo.activeNeeds || []).some(n => (n.category || '').toLowerCase().includes(catTarget));
      }

      // City filter
      let matchesCity = true;
      if (selectedCity && selectedCity !== 'All Cities') {
        const cityTarget = selectedCity.toLowerCase();
        matchesCity = city.includes(cityTarget) ||
                      addr.includes(cityTarget) ||
                      area.includes(cityTarget);
      }

      return matchesSearch && matchesCat && matchesCity;
    });

    // Sort
    return filtered.sort((a, b) => {
      if (sortBy === 'Nearest') {
        const distA = a.distanceKm !== null && a.distanceKm !== undefined ? a.distanceKm : 999999;
        const distB = b.distanceKm !== null && b.distanceKm !== undefined ? b.distanceKm : 999999;
        return distA - distB;
      }
      if (sortBy === 'A-Z') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return 0;
    });
  }, [currentTab, registeredNgos, discoverNgos, userLocation, debouncedSearch, selectedCategory, selectedCity, sortBy]);

  const isLoading = currentTab === 'registered' ? loadingRegistered : loadingDiscover;
  const currentError = currentTab === 'registered' ? registeredError : discoverError;
  const retryAction = currentTab === 'registered' ? loadRegisteredNGOs : loadDiscoverNGOs;

  return (
    <div className="w-full max-w-[1400px] mx-auto p-4 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18315E] dark:text-white tracking-tight flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-[#18315E] dark:text-[#D9B65D]" />
            <T text="Find Organisations" />
          </h1>
          <p className="text-xs sm:text-sm text-[#60708B] dark:text-slate-300 mt-1 max-w-2xl">
            <T text="Connect with registered partners fulfilling live needs, or discover local charities, food banks, and shelters nearby." />
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {/* Admin Claims Review Button */}
          <button
            onClick={() => setShowAdminClaims(true)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#F3F0EA] hover:bg-[#F3F0EA] dark:bg-[#0F1A33]/40 dark:hover:bg-[#15223F]/50 text-[#18315E] dark:text-[#D9B65D] border border-[#E5E1D8]/60 dark:border-[#1E2D52]/50 transition-all cursor-pointer shadow-2xs"
            title="Review claims from unverified organisations"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Review Claims</span>
          </button>

          {/* Tab Switcher */}
          <div className="flex items-center bg-[#F3F0EA] dark:bg-[#0F1A33] p-1.5 rounded-2xl border border-[#E5E1D8] dark:border-[#1E2D52] shadow-xs">
            <button
              onClick={() => updateUrlParam('tab', 'registered')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'registered'
                  ? 'bg-white dark:bg-[#0F1A33] text-[#18315E] dark:text-[#D9B65D] shadow-sm'
                  : 'text-[#60708B] dark:text-slate-300 hover:text-[#18315E] dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>On FoodBridge</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                currentTab === 'registered'
                  ? 'bg-[#F3F0EA] dark:bg-[#0F1A33]/50 text-[#18315E] dark:text-[#D9B65D]'
                  : 'bg-[#F3F0EA] dark:bg-[#0F1A33] text-[#60708B] dark:text-slate-300'
              }`}>
                {registeredNgos.length}
              </span>
            </button>

            <button
              onClick={() => updateUrlParam('tab', 'discover')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'discover'
                  ? 'bg-white dark:bg-[#0F1A33] text-[#18315E] dark:text-[#D9B65D] shadow-sm'
                  : 'text-[#60708B] dark:text-slate-300 hover:text-[#18315E] dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Discover NGOs nearby</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                currentTab === 'discover'
                  ? 'bg-[#F3F0EA] dark:bg-[#0F1A33]/50 text-[#18315E] dark:text-[#D9B65D]'
                  : 'bg-[#F3F0EA] dark:bg-[#0F1A33] text-[#60708B] dark:text-slate-300'
              }`}>
                {discoverNgos.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Tier 2 Disclaimer Banner */}
      {currentTab === 'discover' && (
        <div className="p-4 bg-[#E5B85C]/10 border border-[#E5E1D8]/30 dark:border-[#1E2D52]/20 rounded-2xl flex items-start space-x-3 text-[#18315E] dark:text-[#D9B65D] text-xs animate-in slide-in-from-top-2 duration-200">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#E5B85C] dark:text-[#D9B65D]" />
          <div className="space-y-0.5">
            <p className="font-semibold">
              <T text="These organisations are listed from public sources and are not verified or affiliated with FoodBridge." />
            </p>
            <p className="text-[11px] text-[#18315E]/80 dark:text-[#D9B65D]/80">
              Information shown is retrieved live from OpenStreetMap. You can invite them to join FoodBridge or claim an unverified profile if you represent them.
            </p>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-[#0F1A33]/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-sm border border-[#E5E1D8]/80 dark:border-[#1E2D52] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[#60708B] pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by name, cause or area"
              value={inputValue}
              onChange={e => {
                isTypingRef.current = true;
                setInputValue(e.target.value);
              }}
              className="w-full pl-9 pr-9 py-2.5 bg-[#F3F0EA] dark:bg-[#0F1A33]/50 border border-[#E5E1D8] dark:border-[#1E2D52] rounded-xl text-xs text-[#18315E] dark:text-white placeholder:text-[#60708B] focus:outline-none focus:ring-2 focus:ring-[#E5E1D8] transition-all"
            />
            {inputValue && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-[#60708B] hover:text-[#60708B] dark:hover:text-[#ECE9E1] hover:bg-[#F3F0EA]/60 dark:hover:bg-[#15223F]/60 transition-colors cursor-pointer"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* City / Location Filter */}
          <div className="relative">
            <MapPin className="w-4 h-4 absolute left-3 top-3 text-[#60708B]" />
            <select
              value={selectedCity}
              onChange={e => updateUrlParam('city', e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[#F3F0EA] dark:bg-[#0F1A33]/50 border border-[#E5E1D8] dark:border-[#1E2D52] rounded-xl text-xs text-[#18315E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E5E1D8] cursor-pointer transition-all"
            >
              {AVAILABLE_CITIES.map(c => (
                <option key={c} value={c} className="bg-white dark:bg-[#0F1A33] text-[#18315E] dark:text-white">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={e => updateUrlParam('category', e.target.value)}
            className="w-full px-3 py-2.5 bg-[#F3F0EA] dark:bg-[#0F1A33]/50 border border-[#E5E1D8] dark:border-[#1E2D52] rounded-xl text-xs text-[#18315E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E5E1D8] cursor-pointer transition-all"
          >
            {AVAILABLE_CAUSES.map(cat => (
              <option key={cat} value={cat} className="bg-white dark:bg-[#0F1A33] text-[#18315E] dark:text-white">
                {cat}
              </option>
            ))}
          </select>

          {/* Sort Filter */}
          <select
            value={sortBy}
            onChange={e => updateUrlParam('sort', e.target.value)}
            className="w-full px-3 py-2.5 bg-[#F3F0EA] dark:bg-[#0F1A33]/50 border border-[#E5E1D8] dark:border-[#1E2D52] rounded-xl text-xs text-[#18315E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E5E1D8] cursor-pointer transition-all"
          >
            <option value="Nearest" className="bg-white dark:bg-[#0F1A33]">Nearest First</option>
            <option value="A-Z" className="bg-white dark:bg-[#0F1A33]">Name (A–Z)</option>
          </select>
        </div>

        {/* Results Count & Attributions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#60708B] dark:text-slate-300 pt-2 border-t border-[#E5E1D8] dark:border-[#1E2D52]/60 gap-2">
          <span>
            Showing <strong className="text-[#18315E] dark:text-white font-bold">{activeList.length}</strong> organisations {selectedCity !== 'All Cities' ? `in ${selectedCity}` : ''}
          </span>
          {currentTab === 'discover' && (
            <span className="text-[11px] text-[#60708B] dark:text-slate-300">
              Data source: {import.meta.env.VITE_PLACES_API_KEY ? 'Google Places API' : 'OpenStreetMap (© OpenStreetMap contributors)'}
            </span>
          )}
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        /* Skeleton Loading Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white dark:bg-[#0F1A33]/80 rounded-2xl p-5 border border-[#E5E1D8] dark:border-[#1E2D52]/80 space-y-4 animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-[#F3F0EA] dark:bg-[#0F1A33]"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-[#F3F0EA] dark:bg-[#0F1A33] rounded-md w-3/4"></div>
                  <div className="h-3 bg-[#F3F0EA] dark:bg-[#0F1A33] rounded-md w-1/2"></div>
                </div>
              </div>
              <div className="h-10 bg-[#F3F0EA] dark:bg-[#0F1A33]/50 rounded-xl"></div>
              <div className="pt-3 border-t border-[#E5E1D8] dark:border-[#1E2D52] flex justify-between">
                <div className="h-4 bg-[#F3F0EA] dark:bg-[#0F1A33] rounded w-1/4"></div>
                <div className="h-7 bg-[#F3F0EA] dark:bg-[#0F1A33] rounded-lg w-20"></div>
              </div>
            </div>
          ))}
        </div>
      ) : currentError ? (
        /* Error State with Retry Button */
        <div className="p-8 text-center bg-white dark:bg-[#0F1A33] rounded-2xl border border-[#E5E1D8] dark:border-[#1E2D52]/50 space-y-4">
          <div className="w-12 h-12 bg-[#F3F0EA] dark:bg-[#0F1A33]/30 text-[#18315E] dark:text-[#D9B65D] rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-[#18315E] dark:text-white text-base">
              Failed to load directory data
            </h3>
            <p className="text-xs text-[#60708B] dark:text-slate-300 max-w-md mx-auto">
              {currentError}
            </p>
          </div>
          <button
            onClick={retryAction}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-[#173B78] hover:bg-[#0F172A] dark:bg-[#3156B5] dark:hover:bg-[#3F66CC] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
        </div>
      ) : activeList.length === 0 ? (
        /* Empty / No Results State */
        <EmptyState
          illustration={EmptyStateNoResults}
          message={
            debouncedSearch || selectedCategory !== 'All Categories'
              ? "No organisations found matching your filters."
              : currentTab === 'registered'
              ? (selectedCity !== 'All Cities'
                ? `No registered FoodBridge organisations found in ${selectedCity} yet.`
                : `No registered FoodBridge organisations found yet.`)
              : (selectedCity !== 'All Cities'
                ? `No public organisations found in ${selectedCity}.`
                : `No public organisations found.`)
          }
          description={
            currentTab === 'registered'
              ? "Be the first to onboard! Invite nearby charities and food banks to join FoodBridge, or switch to the 'Discover NGOs nearby' tab."
              : "Try adjusting your search terms or selecting another city."
          }
        />
      ) : (
        /* Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeList.map(ngo => {
            const isRegisteredTier = ngo.isRegistered && ngo.tier === 1;

            return (
              <div
                key={ngo.id}
                onClick={() => setSelectedNgo(ngo)}
                className="bg-white dark:bg-[#0F1A33] rounded-2xl p-5 border border-[#E5E1D8]/90 dark:border-[#1E2D52]/80 hover:border-[#173B78]/60 dark:hover:border-[#173B78]/50 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-3.5">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="relative shrink-0">
                        <Avatar name={ngo.name} className="w-12 h-12 rounded-2xl text-sm font-bold shadow-xs" />
                        {isRegisteredTier && ngo.verified && (
                          <span className="absolute -bottom-1 -right-1 bg-[#173B78] text-white p-0.5 rounded-full ring-2 ring-white dark:ring-[#173B78]" title="Verified FoodBridge Partner">
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-sm text-[#18315E] dark:text-white truncate group-hover:text-[#18315E] dark:group-hover:text-[#D9B65D] transition-colors">
                            {ngo.name}
                          </h3>
                        </div>
                        <span className="text-[11px] text-[#60708B] dark:text-slate-300 flex items-center mt-0.5 truncate">
                          <MapPin className="w-3 h-3 mr-1 text-[#60708B] shrink-0" />
                          <span className="truncate">{ngo.area || ngo.city}</span>
                          {ngo.distanceKm !== null && ngo.distanceKm !== undefined && (
                            <span className="ml-1 text-[#18315E] dark:text-[#D9B65D] font-semibold shrink-0">
                              • ~{ngo.distanceKm.toFixed(1)} km away
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {isRegisteredTier ? (
                      ngo.verified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-[#5BB487]/14 dark:text-[#5BB487] dark:border dark:border-[#5BB487]/40 shrink-0">
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F3F0EA] text-[#60708B] dark:bg-[#0F1A33] dark:text-slate-300 shrink-0">
                          Registered
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E5B85C]/10 text-[#18315E] dark:bg-[#D9B65D]/20 dark:text-[#D9B65D] border border-[#E5E1D8]/20 shrink-0">
                        Not on FoodBridge yet
                      </span>
                    )}
                  </div>

                  {/* Description or Category */}
                  <div className="space-y-1.5">
                    {ngo.category && (
                      <span className="inline-block bg-[#F3F0EA] dark:bg-[#0F1A33]/60 text-[#18315E] dark:text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                        {ngo.category}
                      </span>
                    )}
                    <p className="text-xs text-[#60708B] dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {ngo.description || (
                        isRegisteredTier 
                          ? 'Registered partner organization dedicated to community food assistance and zero hunger.'
                          : `Publicly listed charitable organisation located in ${ngo.city}.`
                      )}
                    </p>
                  </div>

                  {/* Tier 1 Feature: Live Active Needs Feed on Card */}
                  {isRegisteredTier && (
                    <div className="pt-2 border-t border-[#E5E1D8] dark:border-[#1E2D52]/60 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[#18315E] dark:text-slate-300 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#18315E]" />
                          Live Needs ({ngo.activeNeedsCount || 0})
                        </span>
                        {ngo.activeNeedsCount > 0 && (
                          <span className="text-[10px] font-extrabold text-[#18315E] uppercase">
                            Urgent
                          </span>
                        )}
                      </div>

                      {ngo.activeNeeds && ngo.activeNeeds.length > 0 ? (
                        <div className="space-y-1.5">
                          {ngo.activeNeeds.slice(0, 2).map((need, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-[#F3F0EA] dark:bg-[#0F1A33]/40 border border-[#E5E1D8]/60 dark:border-[#1E2D52]/60 text-xs">
                              <div className="truncate mr-2">
                                <span className="font-semibold text-[#18315E] dark:text-white truncate block">
                                  {need.title}
                                </span>
                                <span className="text-[10px] text-[#60708B] dark:text-slate-300">
                                  Needed: {need.quantity} {need.unit}
                                </span>
                              </div>
                              {!isOrg && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/donate', { state: { prefill: { targetNgoName: ngo.name, needTitle: need.title, needId: need._id } } });
                                  }}
                                  className="px-2.5 py-1 bg-[#173B78] hover:bg-[#0F172A] dark:bg-[#3156B5] dark:hover:bg-[#3F66CC] text-white text-[10px] font-bold rounded-lg shrink-0 transition-all cursor-pointer"
                                >
                                  Fulfil
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-[#60708B] dark:text-slate-300 italic">
                          No active shortages posted at this moment.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Tier 2: Public Contact & Source Details */}
                  {!isRegisteredTier && (
                    <div className="pt-2 border-t border-[#E5E1D8] dark:border-[#1E2D52]/60 space-y-1.5 text-[11px] text-[#60708B] dark:text-slate-300">
                      {ngo.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-[#60708B]" />
                          <span>{ngo.phone}</span>
                        </div>
                      )}
                      {ngo.website && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Globe className="w-3 h-3 text-[#60708B] shrink-0" />
                          <a 
                            href={ngo.website.startsWith('http') ? ngo.website : `https://${ngo.website}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-[#18315E] dark:text-[#D9B65D] hover:underline truncate"
                          >
                            {ngo.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                  {/* Card Actions Footer */}
                  <div className="pt-4 mt-4 border-t border-[#E5E1D8] dark:border-[#1E2D52]/80">
                    {isRegisteredTier ? (
                      /* Tier 1 Actions */
                      <div className="flex items-center justify-between gap-2" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/ngo/${ngo.id}`);
                          }}
                          className="text-xs font-bold text-[#60708B] dark:text-slate-300 hover:text-[#18315E] dark:hover:text-[#D9B65D] transition-colors flex items-center cursor-pointer"
                        >
                          View Profile <ArrowRight className="w-3 h-3 ml-1" />
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setContactNgo(ngo)}
                            className="px-3 py-1.5 border border-[#E5E1D8] dark:border-[#1E2D52] hover:bg-[#F3F0EA] dark:hover:bg-[#15223F] text-[#18315E] dark:text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                            title="Message this organisation"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Message</span>
                          </button>

                          {!isOrg ? (
                            <button
                              onClick={() => navigate('/donate', { state: { prefill: { targetNgoName: ngo.name } } })}
                              className="px-3.5 py-1.5 bg-[#173B78] hover:bg-[#0F172A] dark:bg-[#3156B5] dark:hover:bg-[#3F66CC] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-1"
                            >
                              <HeartHandshake className="w-3.5 h-3.5" />
                              <span>Donate</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setRedirectNgo(ngo)}
                              className="px-3.5 py-1.5 bg-[#E5B85C] hover:bg-[#173B78] text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                              Redirect
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Tier 2 Actions (Discover NGOs) */
                      <div className="space-y-2" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          {ngo.website && (
                            <a
                              href={ngo.website.startsWith('http') ? ngo.website : `https://${ngo.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 text-center py-1.5 px-2 bg-[#F3F0EA] hover:bg-[#F3F0EA] dark:bg-[#0F1A33] dark:hover:bg-[#15223F] text-[#18315E] dark:text-white rounded-xl text-xs font-semibold transition-all inline-flex items-center justify-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Visit website</span>
                            </a>
                          )}

                          {ngo.phone ? (
                            <a
                              href={`tel:${ngo.phone}`}
                              className="flex-1 text-center py-1.5 px-2 bg-[#F3F0EA] hover:bg-[#F3F0EA] dark:bg-[#0F1A33] dark:hover:bg-[#15223F] text-[#18315E] dark:text-white rounded-xl text-xs font-semibold transition-all inline-flex items-center justify-center gap-1"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Call</span>
                            </a>
                          ) : ngo.email ? (
                            <a
                              href={`mailto:${ngo.email}`}
                              className="flex-1 text-center py-1.5 px-2 bg-[#F3F0EA] hover:bg-[#F3F0EA] dark:bg-[#0F1A33] dark:hover:bg-[#15223F] text-[#18315E] dark:text-white rounded-xl text-xs font-semibold transition-all inline-flex items-center justify-center gap-1"
                            >
                              <Mail className="w-3 h-3" />
                              <span>Email</span>
                            </a>
                          ) : null}

                          <button
                            onClick={() => setInviteNgo(ngo)}
                            className="flex-1 py-1.5 px-2 bg-[#F3F0EA] hover:bg-[#F3F0EA] dark:bg-[#0F1A33]/30 dark:hover:bg-[#15223F]/50 text-[#18315E] dark:text-[#D9B65D] rounded-xl text-xs font-bold transition-all inline-flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Share2 className="w-3 h-3" />
                            <span>Invite to join</span>
                          </button>
                        </div>

                        {/* Claim this profile button */}
                        <button
                          onClick={() => setClaimNgo(ngo)}
                          className="w-full py-2 px-3 text-center text-xs font-bold text-[#18315E] dark:text-[#D9B65D] bg-[#F3F0EA] hover:bg-[#F3F0EA] dark:bg-[#0F1A33]/40 dark:hover:bg-[#15223F]/50 rounded-xl border border-[#E5E1D8]/60 dark:border-[#1E2D52]/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Claim this profile</span>
                        </button>
                      </div>
                    )}
                  </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Drawer for Selected Organisation */}
      <Drawer
        isOpen={!!selectedNgo}
        onClose={() => setSelectedNgo(null)}
        title={selectedNgo?.isRegistered ? "Registered Organisation Profile" : "Public Organisation Details"}
      >
        {selectedNgo && (
          <div className="space-y-6 flex flex-col h-full justify-between">
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar name={selectedNgo.name} className="w-16 h-16 rounded-2xl text-xl font-bold" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-base text-[#18315E] dark:text-white truncate">
                      {selectedNgo.name}
                    </h4>
                  </div>
                  {selectedNgo.isRegistered ? (
                    <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-[#18315E] dark:text-[#D9B65D]">
                      {selectedNgo.verified ? <ShieldCheck className="w-3.5 h-3.5" /> : null}
                      {selectedNgo.verified ? 'Verified FoodBridge Partner' : 'Registered Organisation'}
                    </span>
                  ) : (
                    <span className="inline-block mt-1 text-[11px] font-semibold text-[#E5B85C] dark:text-[#D9B65D]">
                      Not on FoodBridge yet
                    </span>
                  )}
                  <p className="text-xs text-[#60708B] dark:text-slate-300 flex items-center mt-1">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-[#60708B] shrink-0" />
                    {selectedNgo.address || `${selectedNgo.area}, ${selectedNgo.city}`}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h5 className="font-bold text-xs uppercase tracking-wider text-[#60708B]">About</h5>
                <p className="text-xs text-[#60708B] dark:text-slate-300 leading-relaxed">
                  {selectedNgo.description || (
                    selectedNgo.isRegistered 
                      ? 'Registered partner organisation actively working on food surplus redistribution and community support.'
                      : 'This organisation is listed from public OpenStreetMap directories. If you represent them, claim this profile to list verified needs.'
                  )}
                </p>
              </div>

              {/* Active Needs (Tier 1 Only) */}
              {selectedNgo.isRegistered && (
                <div className="space-y-2">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-[#60708B]">
                    Live Needs ({selectedNgo.activeNeedsCount || 0})
                  </h5>
                  {selectedNgo.activeNeeds && selectedNgo.activeNeeds.length > 0 ? (
                    <div className="space-y-2">
                      {selectedNgo.activeNeeds.map((need, idx) => (
                        <div key={idx} className="p-3 bg-[#F3F0EA] dark:bg-[#0F1A33] rounded-xl border border-[#E5E1D8] dark:border-[#1E2D52] flex items-center justify-between">
                          <div>
                            <p className="font-bold text-xs text-[#18315E] dark:text-white">{need.title}</p>
                            <p className="text-[11px] text-[#60708B]">{need.quantity} {need.unit} • Urgency: {need.urgency}</p>
                          </div>
                          {!isOrg && (
                            <button
                              onClick={() => {
                                setSelectedNgo(null);
                                navigate('/donate', { state: { prefill: { targetNgoName: selectedNgo.name, needTitle: need.title, needId: need._id } } });
                              }}
                              className="px-3 py-1 bg-[#173B78] hover:bg-[#0F172A] dark:bg-[#3156B5] dark:hover:bg-[#3F66CC] text-white text-xs font-bold rounded-lg cursor-pointer"
                            >
                              Fulfil Need
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#60708B] italic">No active shortages currently posted.</p>
                  )}
                </div>
              )}

              {/* Public Contact Channels */}
              <div className="p-4 bg-[#F3F0EA] dark:bg-[#0F1A33]/60 rounded-2xl border border-[#E5E1D8] dark:border-[#1E2D52] space-y-2.5 text-xs">
                <h5 className="font-bold text-[#18315E] dark:text-white text-xs uppercase tracking-wider">
                  Contact Information
                </h5>
                {selectedNgo.phone && (
                  <div className="flex items-center justify-between text-[#60708B] dark:text-slate-300">
                    <span className="flex items-center"><Phone className="w-3.5 h-3.5 mr-2 text-[#18315E]" /> Phone</span>
                    <a href={`tel:${selectedNgo.phone}`} className="font-bold hover:underline">{selectedNgo.phone}</a>
                  </div>
                )}
                {selectedNgo.email && (
                  <div className="flex items-center justify-between text-[#60708B] dark:text-slate-300">
                    <span className="flex items-center"><Mail className="w-3.5 h-3.5 mr-2 text-[#18315E]" /> Email</span>
                    <a href={`mailto:${selectedNgo.email}`} className="font-bold hover:underline">{selectedNgo.email}</a>
                  </div>
                )}
                {selectedNgo.website && (
                  <div className="flex items-center justify-between text-[#60708B] dark:text-slate-300">
                    <span className="flex items-center"><Globe className="w-3.5 h-3.5 mr-2 text-[#E5B85C]" /> Website</span>
                    <a 
                      href={selectedNgo.website.startsWith('http') ? selectedNgo.website : `https://${selectedNgo.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="font-bold text-[#18315E] dark:text-[#D9B65D] hover:underline truncate max-w-[180px]"
                    >
                      Visit Website {'\u2197'}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-[#E5E1D8] dark:border-[#1E2D52] space-y-2">
              {selectedNgo.isRegistered ? (
                !isOrg ? (
                  <Button
                    variant="primary"
                    className="w-full bg-[#173B78] hover:bg-[#0F172A] dark:bg-[#3156B5] dark:hover:bg-[#3F66CC] text-white"
                    onClick={() => {
                      setSelectedNgo(null);
                      navigate('/donate', { state: { prefill: { targetNgoName: selectedNgo.name } } });
                    }}
                    icon={ArrowRight}
                  >
                    Donate to {selectedNgo.name}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    className="w-full bg-[#E5B85C] hover:bg-[#173B78] text-white"
                    onClick={() => {
                      const ngo = selectedNgo;
                      setSelectedNgo(null);
                      setRedirectNgo(ngo);
                    }}
                    icon={ArrowRight}
                  >
                    Redirect Surplus Here
                  </Button>
                )
              ) : (
                <div className="space-y-2">
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      const ngo = selectedNgo;
                      setSelectedNgo(null);
                      setInviteNgo(ngo);
                    }}
                    icon={Share2}
                  >
                    Invite to FoodBridge
                  </Button>
                  <Button
                    variant="primary"
                    className="w-full bg-[#173B78] hover:bg-[#0F172A] dark:bg-[#3156B5] dark:hover:bg-[#3F66CC] text-white"
                    onClick={() => {
                      const ngo = selectedNgo;
                      setSelectedNgo(null);
                      setClaimNgo(ngo);
                    }}
                    icon={ShieldCheck}
                  >
                    Claim this Profile
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Claim Profile Modal */}
      {claimNgo && (
        <ClaimProfileModal
          ngo={claimNgo}
          onClose={() => setClaimNgo(null)}
          onSuccess={() => {
            loadRegisteredNGOs();
          }}
        />
      )}

      {/* Invite Modal */}
      {inviteNgo && (
        <InviteOrgModal
          ngo={inviteNgo}
          onClose={() => setInviteNgo(null)}
        />
      )}

      {/* Contact & Redirect Modals */}
      {contactNgo && <ContactNgoModal ngo={contactNgo} onClose={() => setContactNgo(null)} />}
      {redirectNgo && <RedirectSurplusModal ngo={redirectNgo} user={user} onClose={() => setRedirectNgo(null)} />}

      {/* Admin Claims Review Modal */}
      {showAdminClaims && (
        <AdminClaimsModal
          onClose={() => setShowAdminClaims(false)}
          onClaimApproved={() => {
            loadRegisteredNGOs();
          }}
        />
      )}
    </div>
  );
};

export default FindNGOsPage;










