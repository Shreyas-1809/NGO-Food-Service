import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  HeartHandshake,
  MapPin,
  Bell,
  Sun,
  Moon,
  LogOut,
  UserCircle,
  Bike,
  Building2,
  Key,
  AlertCircle,
  Menu,
  X
} from 'lucide-react';
import { getStoredNotifications } from '../services/donationService';
import MapConfigModal from './MapConfigModal';

const Navbar = ({ user, onLogout, isDarkMode, toggleTheme, onOpenNotifications }) => {
  const [showMapConfig, setShowMapConfig] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const notifications = getStoredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Donate Surplus', path: '/donate' },
    { name: 'NGO Shortages', path: '/ngo-requirements', alert: true },
    { name: 'Receiver Hub', path: '/request' },
    { name: 'Volunteer', path: '/volunteer', icon: Bike },
    { name: 'Find NGOs', path: '/find-ngos', icon: Building2 },
    { name: 'Live Map', path: '/map', icon: MapPin },
    { name: 'Impact', path: '/impact' }
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#FBFBFA]/95 dark:bg-[#141716]/95 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* LOGO */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="bg-[#1B4332] text-white p-2 rounded-xl shadow-xs transition-transform group-hover:scale-105">
            <HeartHandshake className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-stone-900 dark:text-white block leading-tight">
              FoodBridge
            </span>
            <span className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 block tracking-wider uppercase">
              Surplus & NGO Logistics
            </span>
          </div>
        </Link>

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden lg:flex items-center space-x-1 font-semibold text-xs text-stone-600 dark:text-stone-300">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            const Icon = link.icon;

            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-stone-200/70 text-[#1B4332] dark:bg-stone-800 dark:text-emerald-400 font-bold'
                    : 'hover:text-stone-900 hover:bg-stone-100 dark:hover:text-white dark:hover:bg-stone-800/50'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                {link.alert && <span className="w-2 h-2 rounded-full bg-red-500 mr-0.5 animate-pulse" />}
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* RIGHT CONTROLS */}
        <div className="flex items-center space-x-2">
          
          {/* GOOGLE MAPS API KEY CONFIG MODAL BUTTON */}
          <button
            onClick={() => setShowMapConfig(true)}
            className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 text-xs font-medium transition-colors"
            title="Configure Google Maps API Key"
          >
            <Key className="w-3.5 h-3.5 text-stone-500" />
            <span>Map Key</span>
          </button>

          {/* THEME TOGGLE */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* NOTIFICATION BADGE */}
          <button
            onClick={onOpenNotifications}
            className="p-2 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-[#C85A32] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* USER PROFILE OR AUTH */}
          {user ? (
            <div className="flex items-center space-x-1.5 pl-2 border-l border-stone-200 dark:border-stone-800">
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200/80 dark:hover:bg-stone-700 transition-colors text-xs font-semibold text-stone-900 dark:text-white"
              >
                <UserCircle className="w-4 h-4 text-[#1B4332] dark:text-emerald-400" />
                <span className="truncate max-w-[110px] hidden sm:inline">{user.name}</span>
              </Link>
              <button
                onClick={onLogout}
                className="p-1.5 text-stone-400 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-3.5 py-2 bg-[#1B4332] hover:bg-[#143326] text-white font-semibold text-xs rounded-lg shadow-xs transition-colors"
            >
              Sign In
            </Link>
          )}

          {/* MOBILE MENU TOGGLE */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 lg:hidden text-stone-600 dark:text-stone-300"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>

      </div>

      {/* MOBILE NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pt-2 pb-4 space-y-1 bg-[#FBFBFA] dark:bg-[#141716] border-b border-stone-200 dark:border-stone-800 text-xs font-semibold">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-lg ${
                location.pathname === link.path
                  ? 'bg-stone-200/80 dark:bg-stone-800 text-[#1B4332] dark:text-emerald-400 font-bold'
                  : 'text-stone-600 dark:text-stone-300'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <button
            onClick={() => { setShowMapConfig(true); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2.5 text-stone-600 dark:text-stone-300 flex items-center space-x-2"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Configure Google Maps API Key</span>
          </button>
        </div>
      )}

      {/* Google Maps API Config Modal */}
      {showMapConfig && (
        <MapConfigModal
          onClose={() => setShowMapConfig(false)}
          onSaved={() => setShowMapConfig(false)}
        />
      )}

    </header>
  );
};

export default Navbar;
