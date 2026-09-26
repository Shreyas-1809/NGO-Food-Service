import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import LiveFeed from './LiveFeed';
import DonorPostForm from './DonorPostForm';
import MyPostingsDrawer from './MyPostingsDrawer';
import MyShortagesDrawer from './MyShortagesDrawer';
import NotificationsDrawer from './NotificationsDrawer';
import OrgPostNeedModal from './OrgPostNeedModal';
import ActivePickupsDrawer from './ActivePickupsDrawer';
import ProfileEditModal from './ProfileEditModal';
import { 
  Plus, 
  Package, 
  Truck, 
  Bell, 
  Edit, 
  Search, 
  LayoutDashboard, 
  Building2, 
  MapPin, 
  Activity, 
  Settings, 
  Heart, 
  Globe, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  User,
  FileText,
  Users,
  Leaf,
  ChevronRight,
  MessageSquare,
  BarChart3,
  ListFilter,
  Check,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import { T, useLanguage } from '../context/LanguageContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Dashboard = ({ socket, user, token, autoOpenDonate = false, role, onLogout, isDarkMode, toggleTheme }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentLanguage, setLanguage, languages } = useLanguage();

  const [showPostForm, setShowPostForm] = useState(autoOpenDonate || location.pathname === '/donate' || Boolean(location.state?.prefill));
  const [showOrgNeedModal, setShowOrgNeedModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [prefillData, setPrefillData] = useState(location.state?.prefill || null);
  const [activeDrawer, setActiveDrawer] = useState(null); // 'POSTINGS', 'SHORTAGES', 'NOTIFICATIONS', 'PICKUPS', null
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const isOrg = user?.accountType === 'ORGANISATION' || 
                user?.accountType === 'ORGANIZATION' || 
                user?.role === 'ORGANISATION' || 
                user?.role === 'ORGANIZATION' || 
                Boolean(user?.orgName);

  useEffect(() => {
    if (autoOpenDonate || location.pathname === '/donate' || location.state?.prefill) {
      setShowPostForm(true);
      if (location.state?.prefill) {
        setPrefillData(location.state.prefill);
      }
    }
  }, [autoOpenDonate, location.pathname, location.state]);

  useEffect(() => {
    const handleOpenDrawer = (e) => {
      if (e.detail) setActiveDrawer(e.detail);
    };
    window.addEventListener('OPEN_DRAWER', handleOpenDrawer);
    return () => window.removeEventListener('OPEN_DRAWER', handleOpenDrawer);
  }, []);

  const handleClosePostForm = () => {
    setShowPostForm(false);
    setPrefillData(null);
    if (location.pathname === '/donate') {
      navigate('/', { replace: true });
    }
  };

  const handleEditPosting = (post) => {
    if (post.isNewPostSignal) {
      setPrefillData(null);
      setShowPostForm(true);
      setActiveDrawer(null);
      return;
    }
    
    if (post.isRepost) {
      setPrefillData({ ...post, isEdit: false });
    } else {
      setPrefillData({ ...post, isEdit: true });
    }
    
    setShowPostForm(true);
    setActiveDrawer(null);
  };

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
      const handleNewNotification = () => {
        fetchNotificationsCount();
      };
      socket.on('NEW_NOTIFICATION', handleNewNotification);
      socket.on('CLAIM_REQUEST_RECEIVED', handleNewNotification);
      socket.on('CLAIM_ACCEPTED', (data) => {
        handleNewNotification();
        if (isOrg) {
          setActiveDrawer('PICKUPS');
        }
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

  const userName = user?.name || user?.fullName || user?.orgName || 'Tanvi';

  // Greeting based on hour
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="flex flex-1 w-full min-h-screen bg-[#f3faf6] dark:bg-[#061412] font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="w-60 bg-white dark:bg-[#0a1d1a] border-r border-emerald-100/80 dark:border-[#133832] flex flex-col justify-between py-6 px-4 shrink-0 z-30 shadow-xs hidden lg:flex">
        <div className="space-y-6">
          
          {/* Brand Header */}
          <Link to="/" className="flex items-center space-x-3 px-2 group">
            <div className="w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-xs border border-emerald-200/50 dark:border-emerald-800/40">
              <Heart className="w-5 h-5 fill-emerald-600 text-emerald-600 dark:fill-emerald-400 dark:text-emerald-400" />
            </div>
            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              FoodBridge
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1.5 pt-1">
            <Link
              to="/"
              className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                location.pathname === '/'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 shadow-xs border border-emerald-200/50 dark:border-emerald-800/40'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span><T text="Dashboard" /></span>
            </Link>

            <button
              onClick={() => setActiveDrawer(activeDrawer === 'POSTINGS' ? null : 'POSTINGS')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                activeDrawer === 'POSTINGS'
                  ? 'bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600'
              }`}
            >
              <Package className="w-4 h-4 text-slate-400" />
              <span><T text="NGO Requests" /></span>
            </button>

            <Link
              to="/ngos"
              className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                location.pathname.startsWith('/ngo')
                  ? 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600'
              }`}
            >
              <Search className="w-4 h-4 text-slate-400" />
              <span><T text="Find NGOs" /></span>
            </Link>

            <Link
              to="/map"
              className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                location.pathname === '/map'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600'
              }`}
            >
              <MapPin className="w-4 h-4 text-slate-400" />
              <span><T text="Map" /></span>
            </Link>

            <button
              onClick={() => setActiveDrawer(activeDrawer === (isOrg ? 'SHORTAGES' : 'POSTINGS') ? null : (isOrg ? 'SHORTAGES' : 'POSTINGS'))}
              className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600 transition-colors text-left cursor-pointer"
            >
              <FileText className="w-4 h-4 text-slate-400" />
              <span><T text="Food Listings" /></span>
            </button>

            <Link
              to="/activity"
              className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600 transition-colors"
            >
              <BarChart3 className="w-4 h-4 text-slate-400" />
              <span><T text="Analytics" /></span>
            </Link>

            <button
              onClick={() => setActiveDrawer('NOTIFICATIONS')}
              className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600 transition-colors text-left cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <span><T text="Messages" /></span>
            </button>

            <button
              onClick={() => setShowProfileModal(true)}
              className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-600 transition-colors text-left cursor-pointer"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span><T text="Settings" /></span>
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left cursor-pointer mt-4 border border-rose-100 dark:border-rose-900/30"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span><T text="Logout" /></span>
              </button>
            )}
          </nav>
        </div>
      </aside>

      {/* MAIN WORKSPACE CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* TOP INTEGRATED HEADER */}
        <header className="h-16 bg-white dark:bg-[#0a1d1a] border-b border-emerald-100/80 dark:border-[#133832] px-6 flex items-center justify-between gap-4 z-20 shrink-0">
          
          {/* Search Input Box */}
          <div className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search NGOs, locations..."
              className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-[#f3faf6] dark:bg-slate-800/80 border border-emerald-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-slate-800 dark:text-slate-100 placeholder-slate-400"
            />
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle Button */}
            {toggleTheme && (
              <button
                onClick={toggleTheme}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-[#f3faf6] hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-emerald-100 dark:border-slate-700 transition-all cursor-pointer"
                title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-emerald-600" />}
              </button>
            )}

            {/* Language Selector */}
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-[#e6f7ef] dark:bg-slate-800/80 border border-emerald-200/60 dark:border-slate-700 text-slate-700 dark:text-slate-200">
              <Globe className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <select
                value={currentLanguage}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 border-none outline-none cursor-pointer pr-1"
                aria-label="Select Language"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                    {lang.nativeName} ({lang.code.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => setActiveDrawer(activeDrawer === 'NOTIFICATIONS' ? null : 'NOTIFICATIONS')}
              className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-rose-500 text-white text-[9px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* User Profile Avatar Pill */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center space-x-2 bg-[#e6f7ef] dark:bg-slate-800/80 hover:bg-emerald-100/60 dark:hover:bg-slate-700 p-1.5 pr-3 rounded-xl border border-emerald-200/60 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[100px] sm:max-w-[140px]">
                  {userName}
                </span>
                <span className="text-[9px] uppercase font-extrabold text-emerald-600 dark:text-emerald-400">
                  {user?.role || user?.accountType || 'DONOR'}
                </span>
              </div>
            </button>
          </div>
        </header>

        {/* SCROLLABLE MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* TOP GREETING BANNER (Matching Reference Dashboard Screenshot) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>{greeting}, {userName}</span>
                  <span className="text-xl">👋</span>
                </h1>
                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                  <T text="Your support helps feed communities and build a healthier tomorrow." />
                </p>
              </div>

              <div className="hidden md:flex items-center space-x-2 px-4 py-2 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-emerald-600" />
                <span>Real Food • Real Impact 🌿</span>
              </div>
            </div>

            {/* 3 STAT CARDS (Matching Reference Screenshot) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Stat 1: Active Requests */}
              <div className="bg-white dark:bg-[#0a1d1a] p-5 rounded-3xl border border-emerald-100/80 dark:border-[#133832] shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span>Active Requests</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-[10px]">Live</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    12
                  </div>
                  <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    NGOs currently waiting food
                  </div>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Clock className="w-5.5 h-5.5" />
                </div>
              </div>

              {/* Stat 2: Food Donated */}
              <div className="bg-white dark:bg-[#0a1d1a] p-5 rounded-3xl border border-emerald-100/80 dark:border-[#133832] shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span>Food Donated</span>
                    <span className="flex items-center text-emerald-600 text-[10px] font-extrabold">
                      <TrendingUp className="w-3 h-3 mr-0.5" /> +14%
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    3,462 <span className="text-sm font-bold text-slate-500">kg</span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    Total food rescued & distributed
                  </div>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Package className="w-5.5 h-5.5" />
                </div>
              </div>

              {/* Stat 3: People Helped */}
              <div className="bg-white dark:bg-[#0a1d1a] p-5 rounded-3xl border border-emerald-100/80 dark:border-[#133832] shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span>People Helped</span>
                    <span className="flex items-center text-emerald-600 text-[10px] font-extrabold">
                      <TrendingUp className="w-3 h-3 mr-0.5" /> +22%
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    96
                  </div>
                  <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    Families nourished in 12 locations
                  </div>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Users className="w-5.5 h-5.5" />
                </div>
              </div>

            </div>

            {/* TWO COLUMN GRID CONTENT AREA */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* MAIN FEED AREA (2 Columns wide) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Donor Post Overlay Modal */}
                {showPostForm && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-2xl relative animate-in zoom-in-95 duration-300">
                      <button
                        onClick={handleClosePostForm}
                        className="absolute -top-10 right-0 text-white hover:text-slate-200 flex items-center font-bold text-sm"
                      >
                        <T text="Close" /> <span className="text-2xl ml-1.5 font-normal">&times;</span>
                      </button>
                      <DonorPostForm
                        socket={socket}
                        user={user}
                        token={token}
                        prefill={prefillData}
                        onSuccess={handleClosePostForm}
                      />
                    </div>
                  </div>
                )}

                {/* Organisation Need Overlay Modal */}
                {showOrgNeedModal && (
                  <OrgPostNeedModal
                    user={user}
                    token={token}
                    onClose={() => setShowOrgNeedModal(false)}
                    onSuccess={() => {}}
                  />
                )}

                {/* LIVE FEED COMPONENT */}
                <LiveFeed socket={socket} user={user} token={token} onEdit={handleEditPosting} />
              </div>

              {/* RIGHT SIDE PANEL: QUICK ACTIONS */}
              <div className="space-y-6">
                
                <div className="bg-white dark:bg-[#0a1d1a] p-5 rounded-3xl border border-emerald-100/80 dark:border-[#133832] shadow-xs space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    <T text="Quick Actions" />
                  </h3>

                  <div className="space-y-2.5">
                    {!isOrg ? (
                      <button
                        onClick={() => { closeDrawer(); setShowPostForm(true); }}
                        className="w-full py-3 px-4 bg-[#f3faf6] hover:bg-[#e6f7ef] dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-2xl text-xs flex items-center justify-between transition-colors border border-emerald-100 dark:border-slate-700 cursor-pointer"
                      >
                        <div className="flex items-center space-x-2.5">
                          <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span><T text="Log Surplus Food" /></span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    ) : (
                      <button
                        onClick={() => { closeDrawer(); setShowOrgNeedModal(true); }}
                        className="w-full py-3 px-4 bg-[#f3faf6] hover:bg-[#e6f7ef] dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-2xl text-xs flex items-center justify-between transition-colors border border-emerald-100 dark:border-slate-700 cursor-pointer"
                      >
                        <div className="flex items-center space-x-2.5">
                          <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span><T text="Post Shortage / Need" /></span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    )}

                    <button
                      onClick={() => setActiveDrawer('PICKUPS')}
                      className="w-full py-3 px-4 bg-[#f3faf6] hover:bg-[#e6f7ef] dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-2xl text-xs flex items-center justify-between transition-colors border border-emerald-100 dark:border-slate-700 cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5">
                        <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span><T text="Track Active Pickups" /></span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    <button
                      onClick={() => setActiveDrawer('NOTIFICATIONS')}
                      className="w-full py-3 px-4 bg-[#f3faf6] hover:bg-[#e6f7ef] dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-2xl text-xs flex items-center justify-between transition-colors border border-emerald-100 dark:border-slate-700 cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5">
                        <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span><T text="Recent Notifications" /></span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* Decorative Slogan Card (Matching Reference Screenshots) */}
                <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-200/60 dark:border-emerald-800/40 text-center space-y-2">
                  <p className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-widest">
                    Small Actions • Big Change
                  </p>
                  <p className="text-[11px] font-medium text-emerald-700/80 dark:text-emerald-400 italic">
                    "Every surplus meal shared brings local communities closer together." 🌿
                  </p>
                </div>

              </div>

            </div>

          </div>
        </main>

      </div>

      {/* DRAWERS CONTAINER */}
      <>
        <MyPostingsDrawer isOpen={activeDrawer === 'POSTINGS'} user={user} token={token} onClose={closeDrawer} onEdit={handleEditPosting} />
        <MyShortagesDrawer isOpen={activeDrawer === 'SHORTAGES'} token={token} onClose={closeDrawer} />
        <NotificationsDrawer isOpen={activeDrawer === 'NOTIFICATIONS'} user={user} token={token} socket={socket} onClose={closeDrawer} onNotificationChange={fetchNotificationsCount} />
        <ActivePickupsDrawer isOpen={activeDrawer === 'PICKUPS'} user={user} token={token} socket={socket} onClose={closeDrawer} />
      </>

      {/* PROFILE EDIT MODAL */}
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

export default Dashboard;



