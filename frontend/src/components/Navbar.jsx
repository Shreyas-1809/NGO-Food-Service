import React from 'react';
import { Link } from 'react-router-dom';
import { HeartHandshake, UserCircle, LogOut, Sun, Moon, Activity } from 'lucide-react';

const Navbar = ({ user, onLogout, isDarkMode, toggleTheme }) => {
  return (
    <nav className="w-full relative z-20 flex items-center justify-between px-6 bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-800 transition-colors duration-300 h-16">
      <Link to="/" className="flex items-center">
        <HeartHandshake className="h-8 w-8 text-green-600 dark:text-green-500" />
        <span className="ml-2 text-xl font-bold text-slate-800 dark:text-slate-100">FoodBridge</span>
      </Link>
      <div className="flex items-center space-x-6">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors"
          aria-label="Toggle Dark Mode"
        >
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        {user && (
          <div className="flex items-center space-x-4 border-l pl-6 border-slate-200 dark:border-slate-700">
            <Link 
              to="/activity" 
              className="flex items-center text-sm font-medium text-slate-600 hover:text-green-600 dark:text-slate-300 dark:hover:text-green-400 transition-colors"
            >
              <Activity className="h-5 w-5 mr-1.5" /> History
            </Link>
            <div className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-200">
              <UserCircle className="h-6 w-6 text-slate-400 dark:text-slate-500 mr-2" />
              <div className="flex flex-col text-left">
                <span>{user.name}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{user.role}</span>
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
    </nav>
  );
};

export default Navbar;
