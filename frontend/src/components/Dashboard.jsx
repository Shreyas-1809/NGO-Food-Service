import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LiveFeed from './LiveFeed';
import DonorPostForm from './DonorPostForm';
import OrgPostNeedModal from './OrgPostNeedModal';
import { 
  Plus, Package, Truck, Bell, Clock, Users, Leaf, ChevronRight, TrendingUp, Sun, CloudSun, Moon 
} from 'lucide-react';
import { T, useLanguage } from '../context/LanguageContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Dashboard = ({ socket, user, token, autoOpenDonate = false }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [showPostForm, setShowPostForm] = useState(autoOpenDonate || location.pathname === '/donate' || Boolean(location.state?.prefill));
  const [showOrgNeedModal, setShowOrgNeedModal] = useState(false);
  const [prefillData, setPrefillData] = useState(location.state?.prefill || null);
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
      return;
    }
    
    if (post.isRepost) {
      setPrefillData({ ...post, isEdit: false });
    } else {
      setPrefillData({ ...post, isEdit: true });
    }
    setShowPostForm(true);
  };

  const triggerDrawer = (drawerName) => {
    window.dispatchEvent(new CustomEvent('OPEN_DRAWER', { detail: drawerName }));
  };

  const userName = user?.name || user?.fullName || user?.orgName || 'User';
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';
  const GreetingIcon = currentHour < 12 ? Sun : currentHour < 17 ? CloudSun : Moon;

  const { language } = useLanguage();
  const localeMap = {
    en: 'en-IN',
    hi: 'hi-IN',
    mr: 'mr-IN',
    gu: 'gu-IN',
    ta: 'ta-IN',
    te: 'te-IN'
  };
  const currentLocale = localeMap[language] || 'en-IN';
  const formattedDate = new Intl.DateTimeFormat(currentLocale, {
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric'
  }).format(new Date());

  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:py-8 sm:pl-8 sm:pr-[104px] w-full flex flex-col sm:flex-row gap-6 sm:gap-8 relative">
      
      {/* MAIN CONTENT AREA */}
      <div className="flex-1 space-y-6 sm:space-y-8 min-w-0">
        
        {/* MOBILE QUICK ACTIONS */}
        <div className="flex sm:hidden items-center justify-around bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 shadow-sm rounded-2xl mb-2">
          {!isOrg ? (
            <button onClick={() => setShowPostForm(true)} className="flex flex-col items-center gap-1.5 text-emerald-600 dark:text-emerald-400 p-2">
              <Plus className="w-4 h-4" strokeWidth={1.75} />
              <span className="text-[10px] font-bold"><T text="Log Food" /></span>
            </button>
          ) : (
            <button onClick={() => setShowOrgNeedModal(true)} className="flex flex-col items-center gap-1.5 text-emerald-600 dark:text-emerald-400 p-2">
              <Plus className="w-4 h-4" strokeWidth={1.75} />
              <span className="text-[10px] font-bold"><T text="Post Need" /></span>
            </button>
          )}
          <button onClick={() => triggerDrawer('PICKUPS')} className="flex flex-col items-center gap-1.5 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 p-2">
            <Truck className="w-4 h-4" strokeWidth={1.75} />
            <span className="text-[10px] font-bold"><T text="Pickups" /></span>
          </button>
          <button onClick={() => triggerDrawer('NOTIFICATIONS')} className="flex flex-col items-center gap-1.5 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 p-2">
            <Bell className="w-4 h-4" strokeWidth={1.75} />
            <span className="text-[10px] font-bold"><T text="Alerts" /></span>
          </button>
        </div>

        {/* TOP GREETING BANNER */}
        {isOrg ? (
          <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-6 sm:p-8 mb-4 border border-slate-800 shadow-lg">
            {/* Soft decorative glow behind the block */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-emerald-500/20 blur-3xl rounded-full mix-blend-screen pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-48 h-48 bg-teal-500/20 blur-3xl rounded-full mix-blend-screen pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-[0_0_20px_rgba(16,185,129,0.4)] shrink-0">
                <GreetingIcon className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight break-words">
                  <T text={greeting} />,<br className="sm:hidden" /> <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">{userName}</span>
                </h1>
                <p className="text-sm font-medium text-slate-300 mt-2 break-words">
                  <span className="text-emerald-400 font-semibold">{formattedDate}</span> <span className="mx-1.5 opacity-50">•</span> <T text="greetingSubtitle" fallback="Here is what is available for your organisation today." />
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <span><T text={greeting} />, {userName}</span>
                <span className="text-lg">👋</span>
              </h1>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-2 max-w-md">
                <T text="Your support helps feed communities and build a healthier tomorrow." />
              </p>
            </div>
          </div>
        )}

        {/* ALERTS & MODALS */}
        {showPostForm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-2xl relative animate-in zoom-in-95 duration-300">
              <button
                onClick={handleClosePostForm}
                className="absolute -top-10 right-0 text-white hover:text-slate-200 flex items-center font-bold text-sm cursor-pointer"
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

        {showOrgNeedModal && (
          <OrgPostNeedModal
            user={user}
            token={token}
            onClose={() => setShowOrgNeedModal(false)}
            onSuccess={() => {}}
          />
        )}

        {/* DASHBOARD CONTENT */}
        <div className="w-full">
          <LiveFeed socket={socket} user={user} token={token} onEdit={handleEditPosting} />
        </div>
      </div>

      {/* DESKTOP QUICK ACTIONS RAIL */}
      <div className="hidden sm:flex flex-col w-16 fixed right-6 top-1/2 -translate-y-1/2 z-40">
        <div className="flex flex-col gap-5 bg-white dark:bg-slate-900 py-5 px-2 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md items-center">
          
          {!isOrg ? (
            <div className="relative group">
              <button
                onClick={() => setShowPostForm(true)}
                className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Plus className="w-5 h-5" strokeWidth={1.75} />
              </button>
              <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-800 dark:bg-slate-700 text-white text-[10px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                <T text="Log Surplus Food" />
              </div>
            </div>
          ) : (
            <div className="relative group">
              <button
                onClick={() => setShowOrgNeedModal(true)}
                className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Plus className="w-5 h-5" strokeWidth={1.75} />
              </button>
              <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-800 dark:bg-slate-700 text-white text-[10px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                <T text="Post Shortage / Need" />
              </div>
            </div>
          )}

          <div className="w-8 h-px bg-slate-100 dark:bg-slate-800 my-1"></div>

          <div className="relative group">
            <button
              onClick={() => triggerDrawer('PICKUPS')}
              className="w-12 h-12 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Truck className="w-5 h-5" strokeWidth={1.75} />
            </button>
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-800 dark:bg-slate-700 text-white text-[10px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              <T text="Track Active Pickups" />
            </div>
          </div>

          <div className="relative group">
            <button
              onClick={() => triggerDrawer('NOTIFICATIONS')}
              className="w-12 h-12 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Bell className="w-5 h-5" strokeWidth={1.75} />
            </button>
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-800 dark:bg-slate-700 text-white text-[10px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              <T text="Recent Notifications" />
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Dashboard;
