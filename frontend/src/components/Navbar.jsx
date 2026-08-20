import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HeartHandshake, 
  UserCircle, 
  LogOut, 
  Sun, 
  Moon, 
  Activity, 
  Building2, 
  MapPin, 
  AlertCircle,
  Key,
  LayoutDashboard
} from 'lucide-react';
import MapConfigModal from './MapConfigModal';

const Navbar = ({ user, onLogout, isDarkMode, toggleTheme }) => {
  const [showMapConfig, setShowMapConfig] = useState(false);
  const location = useLocation();

  return (
    <nav className="w-full relative z-20 flex items-center justify-between px-6 bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-800 transition-colors duration-300 h-16">
      <div className="flex items-center space-x-6">
        <Link to="/" className="flex items-center">
          <HeartHandshake className="h-8 w-8 text-green-600 dark:text-green-500" />
          <span className="ml-2 text-xl font-bold text-slate-800 dark:text-slate-100">FoodBridge</span>
        </Link>

        {user && (
          <div className="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-200 dark:border-slate-700 text-xs font-semibold">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-colors ${
                location.pathname === '/' 
                  ? 'bg-green-50 dark:bg-slate-800 text-green-700 dark:text-green-400 font-bold' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/ngos"
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-colors ${
                location.pathname.startsWith('/ngo') 
                  ? 'bg-green-50 dark:bg-slate-800 text-green-700 dark:text-green-400 font-bold' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Find NGOs</span>
            </Link>

            <Link
              to="/requirements"
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-colors ${
                location.pathname === '/requirements' 
                  ? 'bg-green-50 dark:bg-slate-800 text-green-700 dark:text-green-400 font-bold' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>Shortages</span>
            </Link>

            <Link
              to="/map"
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1 transition-colors ${
                location.pathname === '/map' 
                  ? 'bg-green-50 dark:bg-slate-800 text-green-700 dark:text-green-400 font-bold' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Map</span>
            </Link>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {user && (
          <button
            onClick={() => setShowMapConfig(true)}
            className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium transition-colors"
            title="Configure Google Maps API Key"
          >
            <Key className="w-3.5 h-3.5 text-slate-400" />
            <span>Map Key</span>
          </button>
        )}

        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
        </button>

        {user && (
          <div className="flex items-center space-x-4 border-l pl-4 border-slate-200 dark:border-slate-700">
            <Link 
              to="/activity" 
              className={`flex items-center text-sm font-medium transition-colors ${
                location.pathname === '/activity' 
                  ? 'text-green-600 dark:text-green-400 font-bold' 
                  : 'text-slate-600 hover:text-green-600 dark:text-slate-300 dark:hover:text-green-400'
              }`}
            >
              <Activity className="h-4 w-4 mr-1" /> History
            </Link>
            <div className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-200">
              <UserCircle className="h-6 w-6 text-slate-400 dark:text-slate-500 mr-2" />
              <div className="flex flex-col text-left">
                <span className="truncate max-w-[120px]">{user.name || user.fullName || user.orgName || 'User'}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{user.role || user.accountType}</span>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="flex items-center text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 px-3 py-1.5 rounded-lg font-medium"
            >
              <LogOut className="h-4 w-4 mr-1.5" /> Logout
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
    </nav>
  );
};

export default Navbar;
