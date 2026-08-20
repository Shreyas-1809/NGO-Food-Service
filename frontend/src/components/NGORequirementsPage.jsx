import React, { useState, useEffect } from 'react';
import { getStoredRequests, getStoredNgos, subscribeToDonationUpdates } from '../services/donationService';
import { 
  MapPin, 
  Users, 
  Calendar, 
  AlertCircle, 
  ArrowRight, 
  Building2, 
  Utensils, 
  Package, 
  Sparkles, 
  HeartHandshake 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WorkflowNav from './WorkflowNav';

const NGORequirementsPage = () => {
  const [requests, setRequests] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedUrgency, setSelectedUrgency] = useState('ALL');
  const navigate = useNavigate();

  const syncData = () => {
    setRequests(getStoredRequests());
    setNgos(getStoredNgos());
  };

  useEffect(() => {
    syncData();
    return subscribeToDonationUpdates(syncData);
  }, []);

  const handleDonateForRequirement = (req) => {
    // Navigate to donor form with pre-filled state
    navigate('/donate', { 
      state: { 
        prefill: { 
          foodType: req.item, 
          quantity: req.quantity, 
          unit: req.unit, 
          targetNgoId: req.ngoId, 
          targetNgoName: req.ngoName 
        } 
      } 
    });
  };

  const handleViewOnMap = (req) => {
    navigate('/map', { 
      state: { 
        selectedNgoId: req.ngoId, 
        selectedNgoName: req.ngoName 
      } 
    });
  };

  const filteredRequests = requests.filter(req => {
    if (selectedCategory !== 'ALL' && req.category !== selectedCategory) return false;
    if (selectedUrgency !== 'ALL' && (req.urgency !== selectedUrgency && req.priority !== selectedUrgency)) return false;
    return true;
  });

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Clean Header with Filters */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
            <AlertCircle className="w-4 h-4" />
            <span>Active Supply Shortages</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            NGO Demands & Immediate Needs
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
            Verified shelters and distribution hubs with acute food & supply shortages. Fulfill directly to match their needed quantity.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Category:</span>
            <select
              className="p-2 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-xs rounded-xl border border-slate-200 dark:border-slate-600 outline-none font-semibold"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              <option value="Food">Food & Rations</option>
              <option value="Clothes">Clothes & Blankets</option>
              <option value="Books">Educational Materials</option>
              <option value="Medical Supplies">Medical Supplies</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Urgency:</span>
            <select
              className="p-2 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-xs rounded-xl border border-slate-200 dark:border-slate-600 outline-none font-semibold"
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
            >
              <option value="ALL">All Urgencies</option>
              <option value="HIGH">🔴 Urgent Deficit</option>
              <option value="MEDIUM">🟡 Medium Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* REQUIREMENTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRequests.map((req) => {
          const isUrgent = req.urgency === 'HIGH' || req.priority?.includes('Urgent');

          return (
            <div
              key={req.id}
              className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                
                {/* Top Badge & Item Title */}
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
                      {req.category || 'Food'} Deficit
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {req.item}
                    </h3>
                  </div>
                  
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase shrink-0 ${
                    isUrgent
                      ? 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-200 dark:border-red-900'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                  }`}>
                    {isUrgent ? '🔴 Urgent' : '🟡 Moderate'}
                  </span>
                </div>

                {/* Organization Details */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center truncate mr-2">
                      <Building2 className="w-3.5 h-3.5 mr-1 text-teal-600 shrink-0" />
                      <span className="truncate">{req.ngoName || 'Helping Hands Foundation'}</span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded shrink-0">
                      ✓ Verified
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 flex items-center truncate">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                    {req.area || req.location || 'Shivajinagar'}, {req.city || 'Pune'}
                  </p>
                </div>

                {/* Quantitative Supply Stats */}
                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Target Quantity Needed:</span>
                    <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                      {req.quantity} {req.unit}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span className="flex items-center text-slate-500 dark:text-slate-400">
                      <Users className="w-3.5 h-3.5 mr-1 text-teal-600" /> Feeding Capacity:
                    </span>
                    <strong className="text-slate-900 dark:text-white">{req.beneficiaries || 120} people</strong>
                  </div>

                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span className="flex items-center text-slate-500 dark:text-slate-400">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-blue-600" /> Needed By:
                    </span>
                    <strong className="text-slate-900 dark:text-white">{req.requiredBy || 'Today'}</strong>
                  </div>
                </div>

                {req.description && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    "{req.description}"
                  </p>
                )}

              </div>

              {/* Action Buttons: 1-Click Map Routing & Donate */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewOnMap(req)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1"
                    title="View this NGO hub on the Logistics Map"
                  >
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    <span>View on Map</span>
                  </button>

                  <button
                    onClick={() => navigate('/')}
                    className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1 border border-emerald-200 dark:border-emerald-800"
                    title="Check available surplus for this shortage"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Find Surplus</span>
                  </button>
                </div>

                <button
                  onClick={() => handleDonateForRequirement(req)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-xs transition-all text-xs flex items-center justify-center space-x-1.5"
                >
                  <Utensils className="w-3.5 h-3.5" />
                  <span>DONATE {req.quantity} {req.unit.toUpperCase()} DIRECTLY</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};

export default NGORequirementsPage;
