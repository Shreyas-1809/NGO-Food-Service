import React, { useState, useEffect } from 'react';
import { Plus, Building2, ShieldCheck, CheckCircle2, Clock, Users, Package, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { getStoredRequests, createReceiverRequest, getStoredDonations, confirmDonationMatch, subscribeToDonationUpdates } from '../services/donationService';
import { findRecommendedDonationsForNGO } from '../services/matchingService';
import { useNavigate } from 'react-router-dom';

const ReceiverDashboard = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [incomingDonations, setIncomingDonations] = useState([]);
  const [availableDonorSurplus, setAvailableDonorSurplus] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    item: 'Rice & Grains',
    category: 'Food',
    quantity: '50',
    unit: 'kg',
    description: 'Required for community kitchen daily feeding program.',
    location: 'Shivajinagar, Pune',
    requiredBy: '2026-08-20',
    priority: '🔴 Urgent',
    urgency: 'HIGH',
    beneficiaries: '120'
  });

  const syncData = () => {
    const storedReqs = getStoredRequests();
    setRequests(storedReqs);
    const allDonations = getStoredDonations();
    setIncomingDonations(allDonations.filter(d => d.matchedNgoId === 'ngo-101' || d.status !== 'AVAILABLE'));
    
    // Recommended donations
    const activeAvailable = allDonations.filter(d => d.status === 'AVAILABLE');
    const recommended = findRecommendedDonationsForNGO(storedReqs[0] || { category: 'Food', item: 'Rice' }, activeAvailable);
    setAvailableDonorSurplus(recommended);
  };

  useEffect(() => {
    syncData();
    return subscribeToDonationUpdates(syncData);
  }, []);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.item || !formData.quantity) return;

    createReceiverRequest(formData, user);
    setShowRequestModal(false);
    setSuccessMessage(`Requirement request for ${formData.quantity} ${formData.unit} of ${formData.item} published!`);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleAcceptDonation = (donation) => {
    confirmDonationMatch(donation.id, 'ngo-101', user?.name || 'Helping Hands Foundation');
    navigate(`/track/${donation.id}`);
  };

  const activeRequestsCount = requests.filter(r => r.status === 'ACTIVE').length;
  const donationsReceivedCount = incomingDonations.length;
  const totalBeneficiaries = requests.reduce((acc, curr) => acc + (Number(curr.beneficiaries) || 0), 0) + 1450;

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* Welcome & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div>
          <div className="inline-flex items-center space-x-2 bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>VERIFIED RECEIVER / NGO DASHBOARD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Welcome, {user?.name || 'Helping Hands Foundation'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Publish resource requirements, track incoming donor matches, and manage beneficiary allocation.
          </p>
        </div>

        <button
          onClick={() => setShowRequestModal(true)}
          className="w-full sm:w-auto px-6 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-2xl shadow-lg shadow-teal-600/30 transition-all flex items-center justify-center space-x-2 text-sm"
        >
          <Plus className="w-5 h-5" />
          <span>CREATE REQUEST</span>
        </button>
      </div>

      {successMessage && (
        <div className="bg-teal-50 dark:bg-teal-950/60 border-2 border-teal-500 text-teal-900 dark:text-teal-200 p-4 rounded-2xl flex items-center space-x-3 text-sm font-bold shadow-md">
          <CheckCircle2 className="w-6 h-6 text-teal-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">ACTIVE REQUESTS</span>
          <span className="text-3xl font-extrabold text-teal-600 dark:text-teal-400 mt-1 block">{activeRequestsCount}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">DONATIONS RECEIVED</span>
          <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">{donationsReceivedCount}</span>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">PENDING DONATIONS</span>
          <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 block">2</span>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">COMPLETED DONATIONS</span>
          <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 block">320+</span>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">BENEFICIARIES HELPED</span>
          <span className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-1 block">{totalBeneficiaries}</span>
        </div>
      </div>

      {/* SECTION 14: NGO RECOMMENDED DONATIONS */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-teal-500" />
              <span>Smart Recommendation Engine</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              RECOMMENDED AVAILABLE DONATIONS
            </h2>
          </div>
          <button
            onClick={() => navigate('/available-donations')}
            className="text-xs font-bold text-teal-600 hover:underline flex items-center"
          >
            View All Available Donations <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableDonorSurplus.slice(0, 3).map((d) => (
            <div
              key={d.id}
              className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-teal-500 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{d.title || d.itemName}</h3>
                  <span className="text-xs font-mono font-extrabold bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-300 px-2 py-0.5 rounded">
                    {d.matchScore}% Match
                  </span>
                </div>
                <div className="text-xs text-slate-500 space-y-1 mt-2">
                  <p>Quantity: <strong>{d.quantity} {d.unit}</strong> • Condition: <strong>{d.condition || 'Fresh'}</strong></p>
                  <p>Proximity: <strong>{d.distanceKm} km away</strong> • Available Today</p>
                </div>
              </div>

              <button
                onClick={() => handleAcceptDonation(d)}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl shadow-md shadow-teal-600/20 transition-all text-xs flex items-center justify-center space-x-2"
              >
                <span>REQUEST / ACCEPT THIS DONATION</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ACTIVE NGO REQUIREMENTS LIST */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Current Active Requirements
          </h2>
          <button onClick={() => navigate('/ngo-requirements')} className="text-xs font-bold text-teal-600 hover:underline">
            View All NGO Requirements →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((req) => (
            <div key={req.id} className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{req.item}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    req.priority === '🔴 Urgent' || req.urgency === 'HIGH' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {req.priority || '🔴 Urgent'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Required: <strong>{req.quantity} {req.unit}</strong> • Location: <strong>{req.location}</strong>
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Required by: {req.requiredBy} • Beneficiaries: {req.beneficiaries} people
                </p>
              </div>

              <span className="text-xs font-bold text-teal-600 bg-teal-50 dark:bg-teal-950 px-3 py-1.5 rounded-xl border border-teal-200 dark:border-teal-800">
                ACTIVE
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 9: NGO CREATE RESOURCE REQUEST MODAL ("WHAT DO YOU NEED?") */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            
            <div className="p-6 bg-teal-600 text-white flex justify-between items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-teal-100">NGO Requirement Form</span>
                <h3 className="text-xl font-extrabold">WHAT DO YOU NEED?</h3>
              </div>
              <button onClick={() => setShowRequestModal(false)} className="text-white text-2xl leading-none">&times;</button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
              
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Required Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Rice, Winter Jackets, Laptops"
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
                  value={formData.item}
                  onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Food">Food</option>
                    <option value="Clothes">Clothes</option>
                    <option value="Books">Books</option>
                    <option value="Medical Supplies">Medical Supplies</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Educational Materials">Educational Materials</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    placeholder="kg, Pieces, Packs"
                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Required By Date</label>
                  <input
                    type="date"
                    required
                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
                    value={formData.requiredBy}
                    onChange={(e) => setFormData({ ...formData, requiredBy: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                  <select
                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value, urgency: e.target.value.includes('Urgent') ? 'HIGH' : 'NORMAL' })}
                  >
                    <option value="🔴 Urgent">🔴 Urgent</option>
                    <option value="🟡 Medium">🟡 Medium</option>
                    <option value="🟢 Normal">🟢 Normal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Delivery / Pickup Location</label>
                  <input
                    type="text"
                    required
                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Number of Beneficiaries</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 120"
                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
                    value={formData.beneficiaries}
                    onChange={(e) => setFormData({ ...formData, beneficiaries: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-2xl shadow-xl shadow-teal-600/30 transition-all text-base mt-2"
              >
                PUBLISH RESOURCE REQUEST
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReceiverDashboard;
