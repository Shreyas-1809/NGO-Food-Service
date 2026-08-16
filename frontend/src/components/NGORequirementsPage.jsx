import React, { useState, useEffect } from 'react';
import { getStoredRequests, subscribeToDonationUpdates } from '../services/donationService';
import { MapPin, Users, Calendar, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NGORequirementsPage = () => {
  const [requests, setRequests] = useState([]);
  const navigate = useNavigate();

  const syncData = () => {
    setRequests(getStoredRequests());
  };

  useEffect(() => {
    syncData();
    return subscribeToDonationUpdates(syncData);
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="inline-flex items-center space-x-2 bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>Active NGO Demand Feed</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          CURRENT REQUIREMENTS
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl mt-1">
          Browse active resource requirements published by verified receiver NGOs in Pune. Fulfill a request directly to create impact.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {requests.map((req) => (
          <div
            key={req.id}
            className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">{req.category}</span>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{req.item}</h3>
                </div>
                <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full ${
                  req.urgency === 'HIGH' || req.priority === 'Urgent'
                    ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  🔴 {req.priority || req.urgency || 'HIGH'} PRIORITY
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center">
                  <span className="font-bold text-slate-900 dark:text-white text-sm mr-2">Needed: {req.quantity} {req.unit}</span>
                </div>
                <div className="flex items-center text-slate-500">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-600" /> {req.location || 'Pune'}
                </div>
                <div className="flex items-center text-slate-500">
                  <Users className="w-3.5 h-3.5 mr-1 text-teal-600" /> {req.beneficiaries || 120} beneficiaries
                </div>
                <div className="flex items-center text-slate-500">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-blue-600" /> Required by: {req.requiredBy}
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/donate')}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-md shadow-emerald-600/20 transition-all text-xs flex items-center justify-center space-x-2"
            >
              <span>FULFILL THIS REQUEST</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
};

export default NGORequirementsPage;
