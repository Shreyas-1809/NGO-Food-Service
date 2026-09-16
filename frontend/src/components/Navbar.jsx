import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HeartHandshake, 
  UserCircle, 
  Menu, 
  X, 
  LogOut, 
  Settings, 
  MapPin, 
  Home, 
  ClipboardList, 
  User, 
  Moon,
  Sun,
  Bell,
  Activity, 
  Building2, 
  AlertCircle,
  Key,
  LayoutDashboard,
  Globe
} from 'lucide-react';
import MapConfigModal from './MapConfigModal';
import ProfileEditModal from './ProfileEditModal';
import { useLanguage, T } from '../context/LanguageContext';

const Navbar = ({ user, token, onLogout, isDarkMode, toggleTheme, onUserUpdated }) => {
  const [showMapConfig, setShowMapConfig] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const location = useLocation();
  const { currentLanguage, setLanguage, languages } = useLanguage();

  return (
    <nav className="w-full relative z-20 flex items-center justify-between px-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xs border-b border-slate-200 dark:border-slate-800 transition-colors duration-300 h-16">
      <div className="flex items-center space-x-6">
        <Link to="/" className="flex items-center group">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-transform duration-200 group-hover:scale-105 shadow-xs">
            <HeartHandshake className="h-5 w-5" />
          </div>
          <span className="ml-2.5 text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
            FoodBridge
          </span>
        </Link>

        {user && (
          <div className="hidden md:flex items-center space-x-1.5 pl-5 border-l border-slate-200 dark:border-slate-800 text-xs font-semibold">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-[10px] flex items-center space-x-1.5 transition-all ${
                location.pathname === '/' 
                  ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 font-bold shadow-xs' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <LayoutDashboard className={`w-3.5 h-3.5 ${location.pathname === '/' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
              <span><T text="Dashboard" /></span>
            </Link>

            <Link
              to="/ngos"
              className={`px-3 py-1.5 rounded-[10px] flex items-center space-x-1.5 transition-all ${
                location.pathname.startsWith('/ngo') 
                  ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 font-bold shadow-xs' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Building2 className={`w-3.5 h-3.5 ${location.pathname.startsWith('/ngo') ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
              <span><T text="Find NGOs" /></span>
            </Link>

            <Link
              to="/map"
              className={`px-3 py-1.5 rounded-[10px] flex items-center space-x-1.5 transition-all ${
                location.pathname === '/map' 
                  ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 font-bold shadow-xs' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <MapPin className={`w-3.5 h-3.5 ${location.pathname === '/map' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
              <span><T text="Map" /></span>
            </Link>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-3.5">
        {/* Language Selector Dropdown */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
          <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
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

        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
        </button>

        {user && (
          <div className="flex items-center space-x-3 pl-3.5 border-l border-slate-200 dark:border-slate-800">
            <Link 
              to="/activity" 
              className={`flex items-center px-3.5 py-1.5 rounded-[10px] text-xs font-bold transition-all duration-200 ${
                location.pathname === '/activity' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <ClipboardList className="h-3.5 w-3.5 mr-1.5" /> <T text="History" />
            </Link>

            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-[10px] transition-colors cursor-pointer"
              title="Click to edit profile & description"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mr-2 shrink-0">
                <User className="h-4 w-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="truncate max-w-[120px] font-bold text-slate-900 dark:text-slate-100">{user.name || user.fullName || user.orgName || 'User'}</span>
                <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 tracking-wider w-fit">{user.role || user.accountType}</span>
              </div>
            </button>

            <button 
              onClick={onLogout}
              className="flex items-center text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors bg-rose-50 hover:bg-rose-100/80 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 px-3 py-1.5 rounded-[10px] font-bold border border-rose-200/60 dark:border-rose-900/30 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5 mr-1" /> <T text="Logout" />
            </button>
          </div>
        )}
      </div>

      {showMapConfig && (
        <MapConfigModal
          onClose={() => setShowMapConfig(false)}
          onSaved={() => setShowMapConfig(false)}
        />
      )}

      {showProfileModal && (
        <ProfileEditModal
          user={user}
          token={token}
          onClose={() => setShowProfileModal(false)}
          onUserUpdated={(updatedUser) => {
            if (onUserUpdated) onUserUpdated(updatedUser);
          }}
        />
      )}
    </nav>
  );
};

export default Navbar;
