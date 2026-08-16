import React, { useState, useEffect } from 'react';
import { getStoredRequests, getStoredNgos, subscribeToDonationUpdates } from '../services/donationService';
import { MapPin, Users, Calendar, AlertCircle, ArrowRight, ShieldCheck, CheckCircle2, Building2, Utensils, HeartHandshake, Filter, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
    navigate('/donate', { state: { prefill: { foodType: req.item, quantity: req.quantity, unit: req.unit, targetNgoId: req.ngoId, targetNgoName: req.ngoName } } });
  };

  const filteredRequests = requests.filter(req => {
    if (selectedCategory !== 'ALL' && req.category !== selectedCategory) return false;
    if (selectedUrgency !== 'ALL' && (req.urgency !== selectedUrgency && req.priority !== selectedUrgency)) return false;
    return true;
  });

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="inline-flex items-center space-x-2 bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              <AlertCircle className="w-4 h-4 text-red-600 animate-pulse" />
              <span>Real-Time NGO Supply Demands Feed</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              REAL-TIME NGO SUPPLY SHORTAGES & REQUIREMENTS
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-3xl mt-1">
              Active verified non-profit organizations and distribution centers across Pune experiencing immediate food & essential supply shortages. Fulfill the exact required quantity directly.
            </p>
          </div>

          <button
            onClick={() => navigate('/donate')}
            className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 text-xs"
          >
            <HeartHandshake className="w-4 h-4" />
            <span>DONATE SURPLUS FOOD</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Category:</span>
            <select
              className="p-2 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-xs rounded-xl border border-slate-200 dark:border-slate-600 outline-none font-bold"
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

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Urgency:</span>
            <select
              className="p-2 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-xs rounded-xl border border-slate-200 dark:border-slate-600 outline-none font-bold"
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
          const ngoDetails = ngos.find(n => n.id === req.ngoId || n.name === req.ngoName);
          const isUrgent = req.urgency === 'HIGH' || req.priority?.includes('Urgent');

          return (
            <div
              key={req.id}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition-all flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                
                {/* Top Badge & NGO Tag */}
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                      {req.category || 'Food'} Supply Deficit
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                      {req.item}
                    </h3>
                  </div>
                  
                  <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase shrink-0 ${
                    isUrgent
                      ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-900'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {isUrgent ? '🔴 Urgent Deficit' : '🟡 Moderate Need'}
                  </span>
                </div>

                {/* Organization Details */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-slate-900 dark:text-white flex items-center">
                      <Building2 className="w-3.5 h-3.5 mr-1 text-teal-600" />
                      {req.ngoName || 'Helping Hands Foundation'}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                      ✓ Verified
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
                    {req.area || req.location || 'Shivajinagar'}, {req.city || 'Pune'}
                  </p>
                </div>

                {/* Quantitative Supply Stats */}
                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Exact Quantity Needed:</span>
                    <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                      {req.quantity} {req.unit}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span className="flex items-center text-slate-500">
                      <Users className="w-3.5 h-3.5 mr-1 text-teal-600" /> Feeding Capacity:
                    </span>
                    <strong className="text-slate-900 dark:text-white">{req.beneficiaries || 120} people</strong>
                  </div>

                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span className="flex items-center text-slate-500">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-blue-600" /> Needed By:
                    </span>
                    <strong className="text-slate-900 dark:text-white">{req.requiredBy || '2026-08-20'}</strong>
                  </div>
                </div>

                {req.description && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    "{req.description}"
                  </p>
                )}

              </div>

              {/* Action Button */}
              <button
                onClick={() => handleDonateForRequirement(req)}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-md shadow-emerald-600/20 transition-all text-xs flex items-center justify-center space-x-2"
              >
                <Utensils className="w-4 h-4" />
                <span>DONATE {req.quantity} {req.unit.toUpperCase()} TO THIS NGO</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>
          );
        })}
      </div>

    </div>
  );
};

export default NGORequirementsPage;
