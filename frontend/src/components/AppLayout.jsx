import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  Heart, LayoutDashboard, Package, Search, FileText, 
  BarChart3, MessageSquare, Settings, LogOut, Sun, Moon, Bell, ArrowLeft, Menu, X, Map as MapIcon
} from 'lucide-react';
import { T, useLanguage, useTranslatedString } from '../context/LanguageContext';

import MyPostingsDrawer from './MyPostingsDrawer';
import MyShortagesDrawer from './MyShortagesDrawer';
import NotificationsDrawer from './NotificationsDrawer';
import ActivePickupsDrawer from './ActivePickupsDrawer';
import ProfileEditModal from './ProfileEditModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const AppLayout = ({ socket, user, token, onLogout, isDarkMode, toggleTheme }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentLanguage, setLanguage, languages } = useLanguage();

  const [activeDrawer, setActiveDrawer] = useState(null); // 'POSTINGS', 'SHORTAGES', 'NOTIFICATIONS', 'PICKUPS', null
  const [unreadCount, setUnreadCount] = useState(0);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const fetchNotificationsCount = async () => {
    try {
      const uid = user?.id || user?._id;
      if (uid && token) {
        const res = await axios.get(`${API_URL}/api/notifications/${uid}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const unreadBackend = (res.data || []).filter(n => !n.read).length;
        setUnreadCount(unreadBackend);
      } else {
        setUnreadCount(0);
      }
    } catch (err) {
      setUnreadCount(0);
    }
  };

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
  }, [user, token, isOrg, socket]);

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
        className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
          location.pathname === '/'
            ? 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 shadow-xs border border-emerald-200/50 dark:border-emerald-800/40'
            : 'text-slate-500 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400'
        }`}
      >
        <LayoutDashboard className="w-4 h-4 shrink-0" strokeWidth={1.75} />
        <span><T text="Dashboard" /></span>
      </Link>

      <button
        onClick={() => { setActiveDrawer(activeDrawer === 'POSTINGS' ? null : 'POSTINGS'); closeMobileMenu(); }}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
          activeDrawer === 'POSTINGS'
            ? 'bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400'
            : 'text-slate-500 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400'
        }`}
      >
        <Package className="w-4 h-4 shrink-0" strokeWidth={1.75} />
        <span><T text="NGO Requests" /></span>
      </button>

      <Link
        to="/ngos"
        onClick={closeMobileMenu}
        className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
          location.pathname.startsWith('/ngo')
            ? 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 font-bold shadow-xs'
            : 'text-slate-500 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400'
        }`}
      >
        <Search className="w-4 h-4 shrink-0" strokeWidth={1.75} />
        <span><T text="Find NGOs" /></span>
      </Link>

      <Link
        to="/map"
        onClick={closeMobileMenu}
        className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
          location.pathname === '/map'
            ? 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 font-bold shadow-xs'
            : 'text-slate-500 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400'
        }`}
      >
        <MapIcon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
        <span><T text="Map" /></span>
      </Link>


      <button
        onClick={() => { setActiveDrawer(activeDrawer === (isOrg ? 'SHORTAGES' : 'POSTINGS') ? null : (isOrg ? 'SHORTAGES' : 'POSTINGS')); closeMobileMenu(); }}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
          activeDrawer === (isOrg ? 'SHORTAGES' : 'POSTINGS')
            ? 'bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400'
            : 'text-slate-500 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400'
        }`}
      >
        <FileText className="w-4 h-4 shrink-0" strokeWidth={1.75} />
        <span><T text="Food Listings" /></span>
      </button>

      <Link
        to="/activity"
        onClick={closeMobileMenu}
        className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
          location.pathname === '/activity'
            ? 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 font-bold shadow-xs'
            : 'text-slate-500 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400'
        }`}
      >
        <BarChart3 className="w-4 h-4 shrink-0" strokeWidth={1.75} />
        <span><T text="Analytics" /></span>
      </Link>

      <button
        onClick={() => { setActiveDrawer(activeDrawer === 'NOTIFICATIONS' ? null : 'NOTIFICATIONS'); closeMobileMenu(); }}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
          activeDrawer === 'NOTIFICATIONS'
            ? 'bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400'
            : 'text-slate-500 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400'
        }`}
      >
        <MessageSquare className="w-4 h-4 shrink-0" strokeWidth={1.75} />
        <span><T text="Messages" /></span>
      </button>

      <button
        onClick={() => { setShowProfileModal(true); closeMobileMenu(); }}
        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-left cursor-pointer"
      >
        <Settings className="w-4 h-4 shrink-0" strokeWidth={1.75} />
        <span><T text="Settings" /></span>
      </button>

    </nav>
  );

  return (
    <div className="flex w-full h-screen bg-[#f3faf6] dark:bg-[#061412] font-sans text-slate-900 dark:text-slate-100 overflow-hidden">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex w-60 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col py-6 px-4 shrink-0 z-30 shadow-sm h-screen overflow-hidden">
        <Link to="/" className="flex items-center space-x-3 px-2 mb-8 shrink-0">
          <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-xs border border-emerald-200/50 dark:border-emerald-800/40">
            <Heart className="w-4 h-4 fill-emerald-600 text-emerald-600 dark:fill-emerald-400 dark:text-emerald-400" strokeWidth={1.75} />
          </div>
          <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">FoodBridge</span>
        </Link>
        <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pr-1 -mr-1">
          <NavigationLinks />
        </div>
        
        {onLogout && (
          <div className="pt-4 mt-auto border-t border-slate-100 dark:border-slate-800 shrink-0">
            <button
              onClick={() => { onLogout(); closeMobileMenu(); }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-left cursor-pointer"
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
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeMobileMenu} />
          <div className="relative w-64 bg-white dark:bg-slate-900 h-full flex flex-col py-6 px-4 shadow-2xl animate-in slide-in-from-left duration-300">
            <button onClick={closeMobileMenu} className="absolute top-6 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <Link to="/" onClick={closeMobileMenu} className="flex items-center space-x-3 px-2 mb-8 shrink-0">
              <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Heart className="w-4 h-4 fill-emerald-600 text-emerald-600 dark:fill-emerald-400 dark:text-emerald-400" strokeWidth={1.75} />
              </div>
              <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">FoodBridge</span>
            </Link>
            <div className="overflow-y-auto flex-1"><NavigationLinks /></div>
            
            {onLogout && (
              <div className="pt-4 mt-auto border-t border-slate-100 dark:border-slate-800 shrink-0">
                <button
                  onClick={() => { onLogout(); closeMobileMenu(); }}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-left cursor-pointer"
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
        <header className="h-16 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 z-20">
          
          {/* LEFT: Mobile Menu & Title */}
          <div className="flex items-center space-x-3 shrink-0">
            <button className="lg:hidden text-slate-500 dark:text-slate-400" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="w-5 h-5" strokeWidth={1.75} />
            </button>
            {location.pathname !== '/' && (
              <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors hidden sm:block cursor-pointer">
                <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
              </button>
            )}
            <div className="hidden sm:block text-sm font-bold text-slate-800 dark:text-slate-100">
              {location.pathname === '/' ? <T text="Home" /> : <T text={location.pathname.replace('/', '').replace('-', ' ').toUpperCase()} fallback="Page" />}
            </div>
          </div>

          {/* CENTER: Search */}
          <div className="flex-1 max-w-xl px-2 sm:px-6 hidden md:block">
            <div className="relative group w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" strokeWidth={1.75} />
              <input 
                type="text" 
                placeholder={searchPlaceholder || "Search NGOs, locations..."} 
                className="w-full h-10 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-full pl-10 pr-4 text-sm font-semibold text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* RIGHT: Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0 h-10">
            {toggleTheme && (
              <button
                onClick={toggleTheme}
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shrink-0"
              >
                {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" strokeWidth={1.75} /> : <Moon className="h-4 w-4 text-slate-500" strokeWidth={1.75} />}
              </button>
            )}

            <div className="hidden sm:flex items-center px-3 h-10 rounded-full text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all text-slate-700 dark:text-slate-200 shrink-0">
              <select
                value={currentLanguage}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 border-none outline-none cursor-pointer pr-1 h-full"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                    {lang.nativeName} ({lang.code.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setActiveDrawer(activeDrawer === 'NOTIFICATIONS' ? null : 'NOTIFICATIONS')}
              className="relative w-10 h-10 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shrink-0"
            >
              <Bell className="w-4 h-4" strokeWidth={1.75} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2.5 bg-rose-500 text-white text-[9px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full border border-white dark:border-slate-900">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center space-x-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 p-1 sm:pr-4 h-10 rounded-full border border-slate-200 dark:border-slate-700 transition-all cursor-pointer ml-1 sm:ml-2 shrink-0"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col text-left justify-center">
                <span className="text-[11px] leading-none font-bold text-slate-800 dark:text-slate-100 truncate max-w-[100px]">
                  {userName}
                </span>
                <span className="text-[9px] leading-none mt-1 font-bold text-slate-500 dark:text-slate-400">
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
