import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Search, FileText, 
  BarChart3, MessageSquare, Settings, LogOut, Sun, Moon, Bell, ArrowLeft, Menu, X, Map as MapIcon,
  ShieldCheck, MapPin
} from 'lucide-react';
import { T, useLanguage, useTranslatedString } from '../context/LanguageContext';
import { fetchRegisteredNGOs } from '../services/ngoDirectoryService';

import MyPostingsDrawer from './MyPostingsDrawer';
import MyShortagesDrawer from './MyShortagesDrawer';
import NotificationsDrawer from './NotificationsDrawer';
import ActivePickupsDrawer from './ActivePickupsDrawer';
import ProfileEditModal from './ProfileEditModal';
import Logo from './Logo';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AppLayout = ({ socket, user, token, onLogout, isDarkMode, toggleTheme }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentLanguage, setLanguage, languages } = useLanguage();

  const [activeDrawer, setActiveDrawer] = useState(null); // 'POSTINGS', 'SHORTAGES', 'NOTIFICATIONS', 'PICKUPS', null
  const [unreadCount, setUnreadCount] = useState(0);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Top-bar search state & live suggestions
  const [topSearchTerm, setTopSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [registeredOrgs, setRegisteredOrgs] = useState([]);
  const searchDropdownRef = useRef(null);

  // Sync top-bar search value when on /ngos or /find-ngos
  useEffect(() => {
    if (location.pathname === '/ngos' || location.pathname === '/find-ngos') {
      const params = new URLSearchParams(location.search);
      const q = params.get('q') || params.get('search') || '';
      setTopSearchTerm(q);
    }
  }, [location.pathname, location.search]);

  // Preload registered organisations for instant live suggestions
  useEffect(() => {
    fetchRegisteredNGOs()
      .then(data => setRegisteredOrgs(Array.isArray(data) ? data : []))
      .catch(err => console.error('Failed to load registered orgs for top search:', err));
  }, []);

  // Close suggestions when clicking outside or pressing Escape
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Filter matching suggestions
  const matchingOrgs = useMemo(() => {
    const term = topSearchTerm.trim().toLowerCase();
    if (!term) return [];
    return registeredOrgs.filter(org => {
      const name = (org.name || org.orgName || '').toLowerCase();
      const city = (org.city || '').toLowerCase();
      const addr = (org.address || '').toLowerCase();
      const area = (org.area || '').toLowerCase();
      const cat = (org.category || '').toLowerCase();
      const desc = (org.description || '').toLowerCase();
      return name.includes(term) || city.includes(term) || addr.includes(term) || area.includes(term) || cat.includes(term) || desc.includes(term);
    }).slice(0, 6);
  }, [topSearchTerm, registeredOrgs]);

  // Navigate to /ngos?q=<query> on submit
  const handleTopSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setShowSuggestions(false);
    const query = topSearchTerm.trim();
    if (query) {
      navigate(`/ngos?q=${encodeURIComponent(query)}`);
    } else {
      navigate('/ngos');
    }
  };

  const handleSuggestionClick = (org) => {
    setShowSuggestions(false);
    const orgName = org.name || org.orgName || '';
    setTopSearchTerm(orgName);
    navigate(`/ngos?q=${encodeURIComponent(orgName)}`);
  };

  const isOrg = user?.accountType === 'ORGANISATION' || 
                user?.accountType === 'ORGANIZATION' || 
                user?.role === 'ORGANISATION' || 
                user?.role === 'ORGANIZATION' || 
                Boolean(user?.orgName);

  const searchPlaceholder = useTranslatedString('Search NGOs, locations...');

  useEffect(() => {
    const handleOpenDrawer = (e) => {
      if (e.detail) setActiveDrawer(e.detail);
    };
    window.addEventListener('OPEN_DRAWER', handleOpenDrawer);
    return () => window.removeEventListener('OPEN_DRAWER', handleOpenDrawer);
  }, []);

const fetchNotificationsCount = useCallback(async () => {
    try {
      const uid = user?.id || user?._id;
      if (uid && token) {
        const res = await axios.get(`${API_URL}/api/notifications/${uid}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const now = Date.now();
        const HIGH_TYPES = new Set(['CLAIM_REQUEST', 'CLAIM_DECLINED', 'NGO_CONFIRMED']);
        const TERMINAL = new Set(['delivered', 'COMPLETED', 'cancelled', 'CANCELLED', 'expired', 'NON_CLAIMED']);
        const highUnread = (res.data || []).filter(n => {
          if (n.read) return false;
          const foodStatus = n.relatedFoodId?.status || n.relatedFoodId?.computedStatus;
          if (foodStatus && TERMINAL.has(foodStatus)) return false;
          if (HIGH_TYPES.has(n.type)) return true;
          // CLAIM_ACCEPTED becomes HIGH when pickup time is overdue
          if (n.type === 'CLAIM_ACCEPTED') {
            const pt = n.relatedFoodId?.pickupTime || n.relatedFoodId?.expiryTime;
            return pt && new Date(pt) < new Date(now);
          }
          return false;
        }).length;
        setUnreadCount(highUnread);
      } else {
        setUnreadCount(0);
      }
    } catch  {
      setUnreadCount(0);
    }
  }, [user, token]);

  useEffect(() => {
    fetchNotificationsCount();
    if (socket) {
      const handleNewNotification = () => fetchNotificationsCount();
      socket.on('NEW_NOTIFICATION', handleNewNotification);
      socket.on('CLAIM_REQUEST_RECEIVED', handleNewNotification);
      socket.on('CLAIM_ACCEPTED', () => {
        handleNewNotification();
        if (isOrg) setActiveDrawer('PICKUPS');
      });
      socket.on('CLAIM_DECLINED', handleNewNotification);
      socket.on('NGO_CONFIRMED', handleNewNotification);
      socket.on('PICKUP_CONFIRMED', handleNewNotification);

      return () => {
        socket.off('NEW_NOTIFICATION', handleNewNotification);
        socket.off('CLAIM_REQUEST_RECEIVED', handleNewNotification);
        socket.off('CLAIM_ACCEPTED', handleNewNotification);
        socket.off('CLAIM_DECLINED', handleNewNotification);
        socket.off('NGO_CONFIRMED', handleNewNotification);
        socket.off('PICKUP_CONFIRMED', handleNewNotification);
      };
    }
  }, [
	user,
	token,
	isOrg,
	socket,
	fetchNotificationsCount
]);

  const closeDrawer = () => {
    setActiveDrawer(null);
    fetchNotificationsCount();
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const userName = user?.name || user?.fullName || user?.orgName || 'User';

  const NavigationLinks = () => (
    <nav className="space-y-2 pt-2">
      <Link
        to="/"
        onClick={closeMobileMenu}
        className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300 ease-in-out focus:outline-none focus-visible:outline-none ${
          location.pathname === '/'
            ? 'bg-slate-700 text-white font-medium shadow-sm dark:bg-[#0A1328] dark:text-white shadow-xs border-2 border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.45)] ring-1 ring-blue-400/50 dark:border dark:border-amber-400/80 dark:shadow-[0_0_10px_rgba(245,158,11,0.2)] dark:ring-0'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#15223F] hover:text-slate-900 dark:hover:text-[#D9B65D] border-2 border-transparent'
        }`}
      >
        <LayoutDashboard className="w-4 h-4 shrink-0" strokeWidth={1.75} />
        <span><T text="Dashboard" /></span>
      </Link>

      <Link
        to="/ngo-requests"
        onClick={closeMobileMenu}
        className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-300 ease-in-out focus:outline-none focus-visible:outline-none ${
          location.pathname === '/ngo-requests'
            ? 'bg-slate-700 text-white font-medium shadow-sm dark:bg-[#0A1328] dark:text-white shadow-xs border-2 border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.45)] ring-1 ring-blue-400/50 dark:border dark:border-amber-400/80 dark:shadow-[0_0_10px_rgba(245,158,11,0.2)] dark:ring-0'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#15223F] hover:text-slate-900 dark:hover:text-[#D9B65D] border-2 border-transparent'
        }`}
      >
        <Package className="w-4 h-4 shrink-0" strokeWidth={1.75} />
        <span><T text="NGO Requests" /></span>
      </Link>

      <Link
        to="/ngos"
        onClick={closeMobileMenu}
        className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-300 ease-in-out focus:outline-none focus-visible:outline-none ${
          location.pathname === '/ngos'
            ? 'bg-slate-700 text-white font-medium shadow-sm dark:bg-[#0A1328] dark:text-white shadow-xs border-2 border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.45)] ring-1 ring-blue-400/50 dark:border dark:border-amber-400/80 dark:shadow-[0_0_10px_rgba(245,158,11,0.2)] dark:ring-0'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#15223F] hover:text-slate-900 dark:hover:text-[#D9B65D] border-2 border-transparent'
        }`}
      >
        <Search className="w-4 h-4 shrink-0" strokeWidth={1.75} />
        <span><T text="Find NGOs" /></span>
      </Link>

      <Link
        to="/map"
        onClick={closeMobileMenu}
        className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-300 ease-in-out focus:outline-none focus-visible:outline-none ${
          location.pathname === '/map'
            ? 'bg-slate-700 text-white font-medium shadow-sm dark:bg-[#0A1328] dark:text-white shadow-xs border-2 border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.45)] ring-1 ring-blue-400/50 dark:border dark:border-amber-400/80 dark:shadow-[0_0_10px_rgba(245,158,11,0.2)] dark:ring-0'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#15223F] hover:text-slate-900 dark:hover:text-[#D9B65D] border-2 border-transparent'
        }`}
      >
        <MapIcon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
        <span><T text="Map" /></span>
      </Link>


      <button
        onClick={() => { setActiveDrawer(activeDrawer === (isOrg ? 'SHORTAGES' : 'POSTINGS') ? null : (isOrg ? 'SHORTAGES' : 'POSTINGS')); closeMobileMenu(); }}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-300 ease-in-out text-left cursor-pointer focus:outline-none focus-visible:outline-none ${
          activeDrawer === (isOrg ? 'SHORTAGES' : 'POSTINGS')
            ? 'bg-slate-700 text-white font-medium shadow-sm dark:bg-[#0A1328] dark:text-white border-2 border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.45)] ring-1 ring-blue-400/50 dark:border dark:border-amber-400/80 dark:shadow-[0_0_10px_rgba(245,158,11,0.2)] dark:ring-0'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#15223F] hover:text-slate-900 dark:hover:text-[#D9B65D] border-2 border-transparent'
        }`}
      >
        <FileText className="w-4 h-4 shrink-0" strokeWidth={1.75} />
        <span><T text="Food Listings" /></span>
      </button>

      <Link
        to="/activity"
        onClick={closeMobileMenu}
        className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-300 ease-in-out focus:outline-none focus-visible:outline-none ${
          location.pathname === '/activity'
            ? 'bg-slate-700 text-white font-medium shadow-sm dark:bg-[#0A1328] dark:text-white shadow-xs border-2 border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.45)] ring-1 ring-blue-400/50 dark:border dark:border-amber-400/80 dark:shadow-[0_0_10px_rgba(245,158,11,0.2)] dark:ring-0'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#15223F] hover:text-slate-900 dark:hover:text-[#D9B65D] border-2 border-transparent'
        }`}
      >
        <BarChart3 className="w-4 h-4 shrink-0" strokeWidth={1.75} />
        <span><T text="Analytics" /></span>
      </Link>

      <button
        onClick={() => { setActiveDrawer(activeDrawer === 'NOTIFICATIONS' ? null : 'NOTIFICATIONS'); closeMobileMenu(); }}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all duration-300 ease-in-out text-left cursor-pointer focus:outline-none focus-visible:outline-none ${
          activeDrawer === 'NOTIFICATIONS'
            ? 'bg-slate-700 text-white font-medium shadow-sm dark:bg-[#0A1328] dark:text-white border-2 border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.45)] ring-1 ring-blue-400/50 dark:border dark:border-amber-400/80 dark:shadow-[0_0_10px_rgba(245,158,11,0.2)] dark:ring-0'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#15223F] hover:text-slate-900 dark:hover:text-[#D9B65D] border-2 border-transparent'
        }`}
      >
        <MessageSquare className="w-4 h-4 shrink-0" strokeWidth={1.75} />
        <span><T text="Messages" /></span>
      </button>

      <button
        onClick={() => { setShowProfileModal(true); closeMobileMenu(); }}
        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold text-[#60708B] dark:text-slate-300 hover:bg-[#F3F0EA] dark:hover:bg-[#15223F] hover:text-[#18315E] dark:hover:text-[#D9B65D] transition-all duration-300 ease-in-out text-left cursor-pointer focus:outline-none focus-visible:outline-none"
      >
        <Settings className="w-4 h-4 shrink-0" strokeWidth={1.75} />
        <span><T text="Settings" /></span>
      </button>

    </nav>
  );

  return (
    <div className="flex w-full h-screen bg-[#FAF8F3] dark:bg-[#0F1A33] font-sans text-[#18315E] dark:text-white overflow-hidden">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex w-60 bg-white dark:bg-[#0A1328] border-r border-[#E5E1D8] dark:border-[#1E2D52] flex-col py-6 px-4 shrink-0 z-30 shadow-sm h-screen overflow-hidden">
        <Link to="/" className="flex items-center space-x-3 px-2 mb-8 shrink-0">
          <Logo size={32} />
          <span className="text-xl font-black text-[#18315E] dark:text-white tracking-tight">FoodBridge</span>
        </Link>
        <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pr-1 -mr-1">
          <NavigationLinks />
        </div>
        
        {onLogout && (
          <div className="pt-4 mt-auto border-t border-[#E5E1D8] dark:border-[#1E2D52] shrink-0">
            <button
              onClick={() => { onLogout(); closeMobileMenu(); }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:text-[#E5707A] dark:hover:bg-[#E5707A]/14 border border-transparent hover:border-rose-200 dark:hover:border-rose-800/40 transition-all duration-300 ease-in-out text-left cursor-pointer focus:outline-none focus-visible:outline-none"
            >
              <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              <span><T text="Logout" /></span>
            </button>
          </div>
        )}
      </aside>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-[#173B78]/40 backdrop-blur-sm" onClick={closeMobileMenu} />
          <div className="relative w-64 bg-white dark:bg-[#0A1328] h-full flex flex-col py-6 px-4 shadow-2xl animate-in slide-in-from-left duration-300">
            <button onClick={closeMobileMenu} className="absolute top-6 right-4 text-[#60708B] hover:text-[#60708B]">
              <X className="w-5 h-5" />
            </button>
            <Link to="/" onClick={closeMobileMenu} className="flex items-center space-x-3 px-2 mb-8 shrink-0">
              <Logo size={32} />
              <span className="text-xl font-black text-[#18315E] dark:text-white tracking-tight">FoodBridge</span>
            </Link>
            <div className="overflow-y-auto flex-1"><NavigationLinks /></div>
            
            {onLogout && (
              <div className="pt-4 mt-auto border-t border-[#E5E1D8] dark:border-[#1E2D52] shrink-0">
                <button
                  onClick={() => { onLogout(); closeMobileMenu(); }}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:text-[#E5707A] dark:hover:bg-[#E5707A]/14 border border-transparent hover:border-rose-200 dark:hover:border-rose-800/40 transition-all duration-300 ease-in-out text-left cursor-pointer focus:outline-none focus-visible:outline-none"
                >
                  <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  <span><T text="Logout" /></span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* TOP BAR */}
        <header className="h-16 shrink-0 bg-white dark:bg-[#0A1328] border-b border-[#E5E1D8] dark:border-[#1E2D52] px-4 sm:px-6 flex items-center justify-between gap-4 z-20">
          
          {/* LEFT: Mobile Menu & Title */}
          <div className="flex items-center space-x-3 shrink-0">
            <button className="lg:hidden text-[#60708B] dark:text-slate-300" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="w-5 h-5" strokeWidth={1.75} />
            </button>
            {location.pathname !== '/' && (
              <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[#60708B] dark:text-slate-300 hover:bg-[#F3F0EA] dark:hover:bg-[#15223F] rounded-xl transition-colors hidden sm:block cursor-pointer">
                <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
              </button>
            )}
            <div className="hidden xl:block text-sm font-bold text-[#18315E]">
              {location.pathname === '/' ? <T text="Home" /> : <T text={location.pathname.replace('/', '').replace('-', ' ').toUpperCase()} fallback="Page" />}
            </div>
          </div>

          {/* CENTER: Search */}
          <div className="flex-1 max-w-xl px-1 sm:px-4 min-w-0">
            <div ref={searchDropdownRef} className="relative group w-full">
              <form onSubmit={handleTopSearchSubmit} className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#60708B] group-focus-within:text-[#18315E] transition-colors pointer-events-none" strokeWidth={1.75} />
                <input 
                  type="text" 
                  value={topSearchTerm}
                  onChange={(e) => {
                    setTopSearchTerm(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    if (topSearchTerm.trim().length > 0) setShowSuggestions(true);
                  }}
                  placeholder={searchPlaceholder || "Search NGOs, locations..."} 
                  className="w-full h-10 bg-[#F3F0EA] dark:bg-[#0F1A33]/50 border border-[#E5E1D8] dark:border-[#1E2D52] focus:border-[#173B78] focus:ring-1 focus:ring-[#E5E1D8] rounded-full pl-10 pr-9 text-sm font-semibold text-[#18315E] dark:text-white placeholder-[#60708B] dark:placeholder-[#60708B] outline-none transition-all"
                />
                {topSearchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setTopSearchTerm('');
                      setShowSuggestions(false);
                      if (location.pathname === '/ngos' || location.pathname === '/find-ngos') {
                        navigate('/ngos');
                      }
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-[#60708B] hover:text-[#60708B] dark:hover:text-[#ECE9E1] hover:bg-[#F3F0EA]/50 dark:hover:bg-[#15223F] transition-colors cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>

              {/* Live Suggestions Dropdown */}
              {showSuggestions && topSearchTerm.trim().length > 0 && (
                <div className="absolute top-12 left-0 right-0 bg-white dark:bg-[#0F1A33] rounded-2xl shadow-xl border border-[#E5E1D8]/90 dark:border-[#1E2D52] overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="p-2 border-b border-[#E5E1D8] dark:border-[#1E2D52]/60 bg-[#F3F0EA]/70 dark:bg-[#0F1A33]/50 flex items-center justify-between text-[11px] font-bold text-[#60708B] dark:text-slate-300 uppercase tracking-wider px-3">
                    <span>Registered Organisations</span>
                    <span className="text-[10px] lowercase font-normal">{matchingOrgs.length} matching</span>
                  </div>

                  <div className="divide-y divide-[#E5E1D8] dark:divide-[#2A426B]/50 max-h-72 overflow-y-auto">
                    {matchingOrgs.length > 0 ? (
                      matchingOrgs.map((org) => (
                        <div
                          key={org.id || org._id}
                          onClick={() => handleSuggestionClick(org)}
                          className="p-3 hover:bg-[#F3F0EA] dark:hover:bg-[#15223F]/60 transition-colors cursor-pointer flex items-center justify-between group/item"
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-[#173B78]/10 text-[#18315E] dark:text-[#D9B65D] flex items-center justify-center font-bold text-xs shrink-0">
                              {(org.name || 'O').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-[#18315E] dark:text-white truncate group-hover/item:text-[#18315E] dark:group-hover/item:text-[#D9B65D] transition-colors">
                                  {org.name}
                                </span>
                                {org.verified && (
                                  <ShieldCheck className="w-3.5 h-3.5 text-[#18315E] shrink-0" title="Verified Partner" />
                                )}
                              </div>
                              <p className="text-[11px] text-[#60708B] dark:text-slate-300 flex items-center truncate mt-0.5">
                                <MapPin className="w-3 h-3 mr-1 text-[#60708B] shrink-0" />
                                <span className="truncate">{org.area || org.city || 'Pune'}</span>
                              </p>
                            </div>
                          </div>

                          {org.activeNeedsCount > 0 ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F3F0EA] text-[#18315E] dark:bg-[#0F1A33]/40 dark:text-[#D9B65D] shrink-0 ml-2">
                              {org.activeNeedsCount} need{org.activeNeedsCount > 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#60708B] shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity ml-2">
                              View in NGOs →
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-[#60708B] dark:text-slate-300">
                        No registered organisations match "<strong className="text-[#18315E] dark:text-slate-300">{topSearchTerm}</strong>"
                      </div>
                    )}
                  </div>

                  {/* Press Enter Footer */}
                  <div 
                    onClick={handleTopSearchSubmit}
                    className="p-2.5 bg-[#F3F0EA] dark:bg-[#0F1A33]/40 border-t border-[#E5E1D8] dark:border-[#1E2D52] flex items-center justify-between text-xs font-semibold text-[#18315E] dark:text-[#D9B65D] hover:bg-[#F3F0EA] dark:hover:bg-[#15223F] cursor-pointer px-4 transition-colors"
                  >
                    <span>Press Enter to search all organisations for "<span className="font-bold">{topSearchTerm}</span>"</span>
                    <span></span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0 h-10">
            {toggleTheme && (
              <button
                onClick={toggleTheme}
                className="w-10 h-10 rounded-full flex items-center justify-center text-[#60708B] hover:text-[#18315E] dark:text-slate-300 dark:hover:text-white hover:bg-[#F3F0EA] dark:hover:bg-[#15223F] transition-all cursor-pointer shrink-0"
              >
                {isDarkMode ? <Sun className="h-4 w-4 text-[#E5B85C]" strokeWidth={1.75} /> : <Moon className="h-4 w-4 text-[#60708B]" strokeWidth={1.75} />}
              </button>
            )}

            <div className="hidden sm:flex items-center px-3 h-10 rounded-full text-xs font-semibold hover:bg-[#F3F0EA] dark:hover:bg-[#15223F] border border-transparent hover:border-[#E5E1D8] dark:hover:border-[#1E293B] transition-all text-[#18315E] dark:text-white shrink-0">
              <select
                value={currentLanguage}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#60708B] border-none outline-none cursor-pointer pr-1 h-full"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-white text-[#18315E]">
                    {lang.nativeName} ({lang.code.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setActiveDrawer(activeDrawer === 'NOTIFICATIONS' ? null : 'NOTIFICATIONS')}
              className="relative w-10 h-10 flex items-center justify-center rounded-full text-[#60708B] hover:bg-[#F3F0EA] dark:hover:bg-[#15223F] transition-all cursor-pointer shrink-0"
            >
              <Bell className="w-4 h-4" strokeWidth={1.75} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2.5 bg-[#E5B85C] text-white text-[9px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full border border-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center space-x-2.5 hover:bg-[#F3F0EA] p-1 sm:pr-4 h-10 rounded-full border border-[#E5E1D8] transition-all cursor-pointer ml-1 sm:ml-2 shrink-0"
            >
              <div className="w-8 h-8 rounded-full bg-[#173B78] text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col text-left justify-center">
                <span className="text-[11px] leading-none font-bold text-[#18315E] truncate max-w-[100px]">
                  {userName}
                </span>
                <span className="text-[9px] leading-none mt-1 font-bold text-[#60708B]">
                  <T text={(user?.role || user?.accountType || 'DONOR').toUpperCase()} />
                </span>
              </div>
            </button>
          </div>
        </header>

        {/* SCROLLABLE OUTLET (PAGE CONTENT) */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>

      </div>

      {/* DRAWERS */}
      <MyPostingsDrawer isOpen={activeDrawer === 'POSTINGS'} user={user} token={token} onClose={closeDrawer} onEdit={() => {}} />
      <MyShortagesDrawer isOpen={activeDrawer === 'SHORTAGES'} token={token} onClose={closeDrawer} />
      <NotificationsDrawer isOpen={activeDrawer === 'NOTIFICATIONS'} user={user} token={token} socket={socket} onClose={closeDrawer} onNotificationChange={fetchNotificationsCount} />
      <ActivePickupsDrawer isOpen={activeDrawer === 'PICKUPS'} user={user} token={token} socket={socket} onClose={closeDrawer} />

      {showProfileModal && (
        <ProfileEditModal
          user={user}
          token={token}
          onClose={() => setShowProfileModal(false)}
          onUserUpdated={() => {}}
        />
      )}
    </div>
  );
};

export default AppLayout;









