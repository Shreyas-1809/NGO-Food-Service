import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { MOCK_NGOS } from '../services/mockData';
import { ShieldCheck, MapPin, Phone, Mail, Globe, Users, HeartHandshake, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';

const NGOProfilePage = () => {
  const { id } = useParams();
  const ngo = MOCK_NGOS.find(n => n.id === id) || MOCK_NGOS[0];

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* Back Link */}
      <Link to="/ngos" className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to NGOs Directory
      </Link>

      {/* Header Profile Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <img src={ngo.logo} alt={ngo.name} className="w-24 h-24 rounded-2xl object-cover border-2 border-emerald-500/20 shadow-md" />
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{ngo.name}</h1>
              {ngo.verified && (
                <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold px-3 py-1 rounded-full flex items-center border border-emerald-300 dark:border-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" /> ✓ Verified Organization
                </span>
              )}
              {ngo.addressVerified && (
                <span className="bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-xs font-extrabold px-3 py-1 rounded-full flex items-center border border-teal-300 dark:border-teal-800">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-teal-600" /> ✓ Address Verified
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl mt-2 leading-relaxed">
              {ngo.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 mt-4">
              <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1 text-emerald-600" /> {ngo.address}</span>
              <span className="flex items-center"><Phone className="w-3.5 h-3.5 mr-1 text-emerald-600" /> {ngo.phone}</span>
              <span className="flex items-center"><Mail className="w-3.5 h-3.5 mr-1 text-emerald-600" /> {ngo.email}</span>
            </div>
          </div>
        </div>

        <Link
          to="/donate"
          className="w-full md:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/30 transition-all text-sm text-center shrink-0"
        >
          DONATE TO THIS NGO
        </Link>
      </div>

      {/* STATS STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
          <Users className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white block">{ngo.beneficiariesCount}</span>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Beneficiaries</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
          <HeartHandshake className="w-6 h-6 text-teal-500 mx-auto mb-1" />
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white block">{ngo.pastDonationsCount}</span>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Donations Received</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
          <ShieldCheck className="w-6 h-6 text-blue-500 mx-auto mb-1" />
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white block">{ngo.impactScore}</span>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Impact Audit Score</span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
          <MapPin className="w-6 h-6 text-purple-500 mx-auto mb-1" />
          <span className="text-2xl font-extrabold text-slate-900 dark:text-white block">{ngo.distanceKm} km</span>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Proximity Distance</span>
        </div>

      </div>

      {/* CURRENT REQUIREMENTS & AREAS OF SUPPORT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Active Requirements */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Current Resource Requirements
          </h2>

          <div className="space-y-4">
            {ngo.currentRequirements.map((req) => (
              <div key={req.id} className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{req.item}</h3>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      req.urgency === 'HIGH' ? 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {req.urgency} PRIORITY
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Needed: <strong>{req.quantity} {req.unit}</strong> • Target Date: <strong>{req.requiredBy}</strong>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Direct Impact: <strong>{req.beneficiaries} children/families</strong>
                  </p>
                </div>

                <Link
                  to="/donate"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shrink-0"
                >
                  MATCH & DONATE
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Areas of Support */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Areas of Support
          </h2>

          <div className="flex flex-wrap gap-2">
            {ngo.areasOfSupport.map((area, idx) => (
              <span key={idx} className="bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold px-3.5 py-2 rounded-xl text-xs border border-emerald-200 dark:border-emerald-800">
                {area}
              </span>
            ))}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-700 pt-6 space-y-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Official Website</span>
              <a href={ngo.website} target="_blank" rel="noreferrer" className="text-emerald-600 font-bold hover:underline">
                Visit Website ↗
              </a>
            </div>
            <div className="flex justify-between">
              <span>Verification Audit</span>
              <span className="text-emerald-600 font-bold">Passed 2026 Audit</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default NGOProfilePage;
