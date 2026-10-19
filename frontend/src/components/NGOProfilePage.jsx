import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchRegisteredNGOs } from '../services/ngoDirectoryService';
import { ShieldCheck, MapPin, Phone, Mail, Globe, Users, HeartHandshake, ArrowLeft, AlertCircle, ArrowRight, Clock, Building2 } from 'lucide-react';
import ContactNgoModal from './ContactNgoModal';
import RedirectSurplusModal from './RedirectSurplusModal';
import Avatar from './ui/Avatar';
import { T } from '../context/LanguageContext';

const NGOProfilePage = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ngo, setNgo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isOrg = user?.accountType === 'ORGANISATION' || 
                user?.accountType === 'ORGANIZATION' || 
                user?.role === 'ORGANISATION' || 
                user?.role === 'ORGANIZATION' || 
                Boolean(user?.orgName);

  const [contactNgo, setContactNgo] = useState(null);
  const [redirectNgo, setRedirectNgo] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const orgs = await fetchRegisteredNGOs();
        const found = orgs.find(o => o.id === id || o._id === id);
        if (found) {
          setNgo(found);
        } else {
          setError('Organisation not found in registered directory.');
        }
      } catch (err) {
        console.error('Error loading NGO profile:', err);
        setError('Failed to load profile. Please check connection.');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="w-full max-w-[1400px] mx-auto p-8 text-center py-20 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
        <p className="text-xs">Loading organisation profile...</p>
      </div>
    );
  }

  if (error || !ngo) {
    return (
      <div className="w-full max-w-[1400px] mx-auto p-8 space-y-4">
        <Link to="/ngos" className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-emerald-600">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to NGOs Directory
        </Link>
        <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h3 className="font-bold text-base text-slate-800 dark:text-white">{error || 'Organisation Not Found'}</h3>
          <p className="text-xs text-slate-500">The organisation may have updated their profile or may not be registered yet.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-[1400px] mx-auto p-4 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-200">

        {/* Back Link */}
        <Link to="/ngos" className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> <T text="Back to NGOs Directory" />
        </Link>

        {/* Header Profile Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <Avatar name={ngo.name} className="w-20 h-20 rounded-2xl text-xl font-bold shadow-md" />
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white"><T text={ngo.name} /></h1>
                {ngo.verified && (
                  <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold px-3 py-1 rounded-full flex items-center border border-emerald-300 dark:border-emerald-800">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" /> ✓ <T text="Verified Partner" />
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl mt-2 leading-relaxed">
                {ngo.description || 'Registered organisation dedicated to food security, surplus redistribution, and community relief on FoodBridge.'}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 mt-4">
                <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1 text-emerald-600" /> {ngo.address || `${ngo.area}, ${ngo.city}`}</span>
                {ngo.phone && <span className="flex items-center"><Phone className="w-3.5 h-3.5 mr-1 text-emerald-600" /> {ngo.phone}</span>}
                {ngo.email && <span className="flex items-center"><Mail className="w-3.5 h-3.5 mr-1 text-emerald-600" /> {ngo.email}</span>}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {!isOrg ? (
            <button
              onClick={() => navigate('/donate', { state: { prefill: { targetNgoName: ngo.name } } })}
              className="w-full md:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/30 transition-all text-sm text-center shrink-0 cursor-pointer"
            >
              <T text="DONATE TO THIS NGO" />
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2.5 shrink-0 w-full md:w-auto">
              <button
                onClick={() => setRedirectNgo(ngo)}
                className="px-5 py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl shadow-lg shadow-violet-600/30 transition-all text-sm text-center flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span><T text="Redirect Surplus Here" /></span>
              </button>
              <button
                onClick={() => setContactNgo(ngo)}
                className="px-5 py-3.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-bold rounded-2xl border border-teal-200 dark:border-teal-800 transition-all text-sm text-center flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span><T text="Contact NGO" /></span>
              </button>
            </div>
          )}
        </div>

        {/* Live Active Needs */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center">
            <Clock className="w-5 h-5 mr-2 text-emerald-600" />
            <T text="Live Active Needs" /> ({ngo.activeNeedsCount || 0})
          </h2>

          {ngo.activeNeeds && ngo.activeNeeds.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ngo.activeNeeds.map((need, idx) => (
                <div key={idx} className="p-5 bg-slate-50 dark:bg-slate-700/40 rounded-2xl border border-slate-200/80 dark:border-slate-600 flex justify-between items-center gap-4">
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white text-base block">
                      {need.title}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block">
                      Quantity: <strong>{need.quantity} {need.unit}</strong> • Urgency: <strong>{need.urgency}</strong>
                    </span>
                  </div>

                  {!isOrg && (
                    <button
                      onClick={() => navigate('/donate', { state: { prefill: { targetNgoName: ngo.name, needTitle: need.title, needId: need._id } } })}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shrink-0 cursor-pointer"
                    >
                      <T text="FULFIL NEED" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400 text-xs italic bg-slate-50 dark:bg-slate-700/20 rounded-2xl">
              No active shortages or food deficit needs posted by this organisation right now.
            </div>
          )}
        </div>

      </div>

      {/* Modals */}
      {contactNgo && <ContactNgoModal ngo={contactNgo} onClose={() => setContactNgo(null)} />}
      {redirectNgo && <RedirectSurplusModal ngo={redirectNgo} user={user} onClose={() => setRedirectNgo(null)} />}
    </>
  );
};

export default NGOProfilePage;
