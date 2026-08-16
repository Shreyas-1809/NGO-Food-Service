import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { HeartHandshake, MapPin, Bell, Sun, Moon, LogOut, ShieldCheck, UserCircle, Plus, Search, Sparkles } from 'lucide-react';
import { getStoredNotifications } from '../services/donationService';

const Navbar = ({ user, onLogout, isDarkMode, toggleTheme, onOpenNotifications }) => {
  const notifications = getStoredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;
  const navigate = useNavigate();
  const location = useLocation();

  const isDonor = user?.accountType === 'DONOR' || user?.role === 'DONOR' || !user;

  return (
    <header className="w-full sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* LOGO */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="bg-emerald-600 dark:bg-emerald-500 text-white p-2.5 rounded-2xl shadow-lg shadow-emerald-600/30 group-hover:scale-105 transition-transform">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
              BRIDGE PLATFORM
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block -mt-1">
              DONOR ↔ RECEIVER NGO
            </span>
          </div>
        </Link>

        {/* CENTER NAVIGATION LINKS */}
        <nav className="hidden lg:flex items-center space-x-1 font-extrabold text-xs">
          <Link to="/" className={`px-3.5 py-2 rounded-xl transition-all ${location.pathname === '/' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}>
            HOME
          </Link>

          <Link to="/donate" className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1 ${location.pathname === '/donate' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}>
            <span>DONATE SURPLUS</span>
          </Link>

          <Link to="/request" className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1 ${location.pathname === '/request' ? 'bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-300' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}>
            <span>NGO REQUESTS</span>
          </Link>

          <Link to="/map" className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1 ${location.pathname === '/map' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}>
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>LIVE MAP</span>
          </Link>

          <Link to="/impact" className={`px-3.5 py-2 rounded-xl transition-all ${location.pathname === '/impact' ? 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-300' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}>
            IMPACT
          </Link>

          <Link to="/about" className={`px-3.5 py-2 rounded-xl transition-all ${location.pathname === '/about' ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}>
            ABOUT
          </Link>
        </nav>

        {/* RIGHT CONTROLS: THEME, NOTIFICATIONS, USER ROLE & AUTH */}
        <div className="flex items-center space-x-3">
          
          {/* DARK MODE TOGGLE */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* NOTIFICATION BADGE */}
          <button
            onClick={onOpenNotifications}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* USER AUTH OR ROLE SHORTCUT */}
          {user ? (
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-700">
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs font-bold text-slate-900 dark:text-white"
              >
                <UserCircle className="w-5 h-5 text-emerald-600" />
                <div className="hidden sm:flex flex-col text-left">
                  <span className="truncate max-w-[110px] font-extrabold">{user.name}</span>
                  <span className="text-[10px] text-emerald-600 font-bold uppercase">{user.role || 'USER'}</span>
                </div>
              </Link>

              <button
                onClick={onLogout}
                className="p-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md shadow-emerald-600/30 transition-all text-xs flex items-center space-x-1"
            >
              <span>SIGN IN / REGISTER</span>
            </Link>
          )}

        </div>

      </div>
    </header>
  );
};

export default Navbar;
