import React, { useState } from 'react';
import { MapPin, Key, CheckCircle2, ExternalLink, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { getGoogleMapsApiKey, setGoogleMapsApiKey } from '../services/mapsService';

const MapConfigModal = ({ onClose, onSaved }) => {
  const [apiKey, setApiKey] = useState(getGoogleMapsApiKey());
  const [statusMsg, setStatusMsg] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setGoogleMapsApiKey(apiKey);
    setIsSaved(true);
    setStatusMsg('Google Maps API Key saved! Refreshing map services...');
    if (onSaved) onSaved(apiKey);
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  const handleClear = () => {
    setApiKey('');
    setGoogleMapsApiKey('');
    setIsSaved(true);
    setStatusMsg('API key removed. Running in high-resolution interactive canvas mode.');
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700">
        
        {/* Header */}
        <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5" />
            <h3 className="text-lg font-extrabold">Google Maps Platform Configuration</h3>
          </div>
          <button onClick={onClose} className="text-white text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-4 text-xs sm:text-sm">
          
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Configure your Google Maps JavaScript API key below. You can also define it in <code className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-emerald-600 font-mono">frontend/.env</code> as <code className="font-mono text-emerald-600">VITE_GOOGLE_MAPS_API_KEY</code>.
          </p>

          {statusMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950 border border-emerald-500 text-emerald-900 dark:text-emerald-200 rounded-xl font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Google Maps API Key
              </label>
              <input
                type="text"
                placeholder="AIzaSy..."
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-xs outline-none focus:ring-2 focus:ring-blue-500"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>

            {/* Quick Helper Links */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <span className="font-bold text-slate-900 dark:text-white block">
                How to get a key:
              </span>
              <ul className="space-y-1 text-slate-500 dark:text-slate-400">
                <li>
                  • <a href="https://mapsplatform.google.com/maps-demo-key" target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline inline-flex items-center">
                    Get Free Maps Demo Key (No Credit Card) <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </li>
                <li>
                  • <a href="https://console.cloud.google.com/google/maps-apis/credentials" target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline inline-flex items-center">
                    Google Cloud Console Key Manager <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </li>
              </ul>
            </div>

            <div className="flex space-x-2 pt-2">
              {apiKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Reset / Clear Key
                </button>
              )}
              <button
                type="submit"
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md shadow-blue-600/30 transition-all flex items-center justify-center space-x-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>SAVE & APPLY API KEY</span>
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
};

export default MapConfigModal;
