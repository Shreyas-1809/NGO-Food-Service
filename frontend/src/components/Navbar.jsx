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
  LayoutDashboard
} from 'lucide-react';
import MapConfigModal from './MapConfigModal';
import ProfileEditModal from './ProfileEditModal';

const Navbar = ({ user, token, onLogout, isDarkMode, toggleTheme, onUserUpdated }) => {
  const [showMapConfig, setShowMapConfig] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const location = useLocation();

  return (
    <nav className="w-full relative z-20 flex items-center justify-between px-6 bg-white/95 dark:bg-[#23201d]/95 backdrop-blur-md shadow-[0_4px_20px_rgba(47,122,77,0.04)] border-b border-[#e8dfd2]/80 dark:border-[#38322c]/80 transition-colors duration-300 h-16">
      <div className="flex items-center space-x-6">
        <Link to="/" className="flex items-center group">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#E8873A]/15 dark:bg-[#E8873A]/25 text-[#E8873A] dark:text-[#FFAE70] transition-transform duration-200 group-hover:scale-105 shadow-xs">
            <HeartHandshake className="h-5 w-5" />
          </div>
          <span className="ml-2.5 text-xl font-extrabold text-[#2F7A4D] dark:text-[#86efac] tracking-tight">
            FoodBridge
          </span>
        </Link>

        {user && (
          <div className="hidden md:flex items-center space-x-1.5 pl-5 border-l border-[#e8dfd2]/80 dark:border-[#38322c]/80 text-xs font-semibold">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-[10px] flex items-center space-x-1.5 transition-all ${
                location.pathname === '/' 
                  ? 'bg-[#E8873A]/15 text-[#C45E16] dark:bg-[#E8873A]/25 dark:text-[#FFAE70] font-bold shadow-xs' 
                  : 'text-stone-600 dark:text-stone-300 hover:bg-[#F5EFE6] dark:hover:bg-[#302b27] hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <LayoutDashboard className={`w-3.5 h-3.5 ${location.pathname === '/' ? 'text-[#E8873A]' : 'text-stone-400 dark:text-stone-500'}`} />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/ngos"
              className={`px-3 py-1.5 rounded-[10px] flex items-center space-x-1.5 transition-all ${
                location.pathname.startsWith('/ngo') 
                  ? 'bg-[#E8873A]/15 text-[#C45E16] dark:bg-[#E8873A]/25 dark:text-[#FFAE70] font-bold shadow-xs' 
                  : 'text-stone-600 dark:text-stone-300 hover:bg-[#F5EFE6] dark:hover:bg-[#302b27] hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <Building2 className={`w-3.5 h-3.5 ${location.pathname.startsWith('/ngo') ? 'text-[#E8873A]' : 'text-stone-400 dark:text-stone-500'}`} />
              <span>Find NGOs</span>
            </Link>

            <Link
              to="/map"
              className={`px-3 py-1.5 rounded-[10px] flex items-center space-x-1.5 transition-all ${
                location.pathname === '/map' 
                  ? 'bg-[#E8873A]/15 text-[#C45E16] dark:bg-[#E8873A]/25 dark:text-[#FFAE70] font-bold shadow-xs' 
                  : 'text-stone-600 dark:text-stone-300 hover:bg-[#F5EFE6] dark:hover:bg-[#302b27] hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <MapPin className={`w-3.5 h-3.5 ${location.pathname === '/map' ? 'text-[#E8873A]' : 'text-stone-400 dark:text-stone-500'}`} />
              <span>Map</span>
            </Link>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-3.5">
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-full flex items-center justify-center text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white bg-[#F5EFE6] hover:bg-[#EFE6DA] dark:bg-[#302b27] dark:hover:bg-[#3b3530] border border-[#e8dfd2]/60 dark:border-[#38322c] transition-all focus:outline-none focus:ring-2 focus:ring-[#E8873A] cursor-pointer"
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
        </button>

        {user && (
          <div className="flex items-center space-x-3 pl-3.5 border-l border-[#e8dfd2]/80 dark:border-[#38322c]/80">
            <Link 
              to="/activity" 
              className={`flex items-center px-3.5 py-1.5 rounded-[10px] text-xs font-bold transition-all duration-200 ${
                location.pathname === '/activity' 
                  ? 'bg-[#E8873A] text-white shadow-md shadow-[#E8873A]/25' 
                  : 'text-stone-600 dark:text-stone-300 hover:bg-[#F5EFE6] dark:hover:bg-[#302b27] hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <ClipboardList className="h-3.5 w-3.5 mr-1.5" /> History
            </Link>

            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-[#F5EFE6] dark:hover:bg-[#302b27] p-1.5 rounded-[10px] transition-colors cursor-pointer"
              title="Click to edit profile & description"
            >
              <div className="w-8 h-8 rounded-full bg-[#2F7A4D]/15 dark:bg-[#2F7A4D]/25 text-[#2F7A4D] dark:text-[#86efac] flex items-center justify-center mr-2 shrink-0">
                <User className="h-4 w-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="truncate max-w-[120px] font-bold text-stone-900 dark:text-stone-100">{user.name || user.fullName || user.orgName || 'User'}</span>
                <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.2 rounded-md bg-[#2F7A4D]/10 text-[#2F7A4D] dark:bg-[#2F7A4D]/25 dark:text-[#86efac] tracking-wider w-fit">{user.role || user.accountType}</span>
              </div>
            </button>

            <button 
              onClick={onLogout}
              className="flex items-center text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-colors bg-rose-50 hover:bg-rose-100/80 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 px-3 py-1.5 rounded-[10px] font-bold border border-rose-200/60 dark:border-rose-900/30 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5 mr-1" /> Logout
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
