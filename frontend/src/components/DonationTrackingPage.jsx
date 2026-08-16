import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getStoredDonations, updateDonationStatus, subscribeToDonationUpdates } from '../services/donationService';
import { CheckCircle2, Clock, Truck, ShieldCheck, Award, ArrowLeft, RefreshCw, MapPin } from 'lucide-react';
import DonationCertificateModal from './DonationCertificateModal';

const DonationTrackingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);
  const [showCertificate, setShowCertificate] = useState(false);

  const fetchDonation = () => {
    const all = getStoredDonations();
    const target = all.find(d => d.id === id) || all[0];
    setDonation(target);
  };

  useEffect(() => {
    fetchDonation();
    return subscribeToDonationUpdates(fetchDonation);
  }, [id]);

  if (!donation) return <div className="p-8 text-center text-slate-500">Loading donation status...</div>;

  const handleAdvanceStatus = (nextStatus) => {
    const updated = updateDonationStatus(donation.id, nextStatus);
    setDonation(updated);
    if (nextStatus === 'COMPLETED') {
      setShowCertificate(true);
    }
  };

  const steps = [
    { key: 'CREATED', title: 'Donation Created', icon: CheckCircle2 },
    { key: 'MATCHED', title: 'Receiver Matched', icon: ShieldCheck },
    { key: 'PICKUP_SCHEDULED', title: 'Pickup Scheduled', icon: Clock },
    { key: 'IN_TRANSIT', title: 'In Transit', icon: Truck },
    { key: 'DELIVERED', title: 'Delivered', icon: MapPin },
    { key: 'COMPLETED', title: 'Donation Completed 🎉', icon: Award }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* Top Bar */}
      <div className="flex justify-between items-center">
        <Link to="/dashboard" className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-emerald-600 dark:text-slate-400">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>
        
        {(donation.status === 'COMPLETED' || donation.status === 'DELIVERED') && (
          <button
            onClick={() => setShowCertificate(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-600/30"
          >
            <Award className="w-4 h-4" />
            <span>VIEW DONATION CERTIFICATE</span>
          </button>
        )}
      </div>

      {/* Main Status Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-3 py-1 rounded-lg">
              {donation.id}
            </span>
            <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-full uppercase">
              {donation.status.replace('_', ' ')}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {donation.title || donation.itemName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Matched with: <strong>{donation.matchedNgoName || 'Helping Hands Foundation'}</strong> • Quantity: <strong>{donation.quantity} {donation.unit}</strong>
          </p>
        </div>

        {/* Demo Advance Control */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs w-full sm:w-auto">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Demo Status Control</span>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => handleAdvanceStatus('PICKUP_SCHEDULED')} className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-[10px]">
              Scheduled
            </button>
            <button onClick={() => handleAdvanceStatus('IN_TRANSIT')} className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[10px]">
              In Transit 🚚
            </button>
            <button onClick={() => handleAdvanceStatus('DELIVERED')} className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-[10px]">
              Delivered
            </button>
            <button onClick={() => handleAdvanceStatus('COMPLETED')} className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px]">
              Complete 🎉
            </button>
          </div>
        </div>

      </div>

      {/* TIMELINE PROGRESS CARD */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200 dark:border-slate-700 space-y-8">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
          Live Tracking Timeline
        </h2>

        <div className="relative border-l-4 border-slate-200 dark:border-slate-700 ml-4 sm:ml-6 space-y-8">
          {steps.map((step, idx) => {
            const isCompleted = donation.trackingTimeline?.some(t => t.status === step.key && t.completed) || (idx === 0);
            const isCurrent = donation.status === step.key;

            return (
              <div key={step.key} className="relative pl-8 sm:pl-10 group">
                
                {/* Timeline Pin */}
                <div className={`absolute -left-[19px] top-0.5 w-9 h-9 rounded-full flex items-center justify-center border-4 transition-colors ${
                  isCompleted 
                    ? 'bg-emerald-600 border-white dark:border-slate-800 text-white shadow-md'
                    : 'bg-slate-200 dark:bg-slate-700 border-white dark:border-slate-800 text-slate-400'
                }`}>
                  <step.icon className="w-4 h-4" />
                </div>

                <div>
                  <h3 className={`text-base font-extrabold ${isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {isCompleted ? 'Verified and confirmed step completed.' : 'Pending step execution.'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Certificate Modal */}
      {showCertificate && (
        <DonationCertificateModal
          donation={donation}
          onClose={() => setShowCertificate(false)}
        />
      )}

    </div>
  );
};

export default DonationTrackingPage;
