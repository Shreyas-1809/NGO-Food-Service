import React, { useState, useEffect } from 'react';
import { getStoredRequests, getStoredNgos, subscribeToDonationUpdates, updateReceiverRequest, markRequestFulfilled, deleteReceiverRequest } from '../services/donationService';
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
  HeartHandshake,
  CheckCircle2,
  Edit2,
  Trash2,
  Save,
  X,
  Check,
  Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WorkflowNav from './WorkflowNav';
import ContactNgoModal from './ContactNgoModal';
import RedirectSurplusModal from './RedirectSurplusModal';

const NGORequirementsPage = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [contactNgo, setContactNgo] = useState(null);
  const [redirectNgo, setRedirectNgo] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedUrgency, setSelectedUrgency] = useState('ALL');
  
  const isOrg = user?.accountType === 'ORGANISATION' || 
                user?.accountType === 'ORGANIZATION' || 
                user?.role === 'ORGANISATION' || 
                user?.role === 'ORGANIZATION' || 
                Boolean(user?.orgName);

  // 'ALL' = general feed, 'MY' = org's own postings
  const [activeTab, setActiveTab] = useState(isOrg ? 'MY' : 'ALL');
  // Inline edit state: { requestId, quantity, urgency }
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const navigate = useNavigate();

  const orgId = user?.id || user?._id;
  const orgName = user?.orgName || user?.name || user?.fullName;

  const syncData = () => {
    setRequests(getStoredRequests());
    setNgos(getStoredNgos());
  };

  useEffect(() => {
    syncData();
    return subscribeToDonationUpdates(syncData);
  }, []);

  const handleDonateForRequirement = (req) => {
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

  const handleStartEdit = (req) => {
    setEditingId(req.id);
    setEditValues({ quantity: req.quantity, urgency: req.urgency });
  };

  const handleSaveEdit = (req) => {
    updateReceiverRequest(req.id, {
      quantity: Number(editValues.quantity) || req.quantity,
      urgency: editValues.urgency
    });
    setEditingId(null);
    setEditValues({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleMarkFulfilled = (req) => {
    if (!window.confirm(`Mark "${req.item}" as fulfilled? This cannot be undone.`)) return;
    markRequestFulfilled(req.id);
  };

  const handleDelete = (req) => {
    if (!window.confirm(`Remove this posting for "${req.item}"?`)) return;
    deleteReceiverRequest(req.id);
  };

  // Split requests: org's own vs others
  const myPostings = isOrg
    ? requests.filter(req =>
      req.ngoId === orgId ||
      (orgName && req.ngoName && req.ngoName === orgName)
    )
    : [];

  const generalRequests = activeTab === 'MY' ? myPostings : requests.filter(req => {
    if (selectedCategory !== 'ALL' && req.category !== selectedCategory) return false;
    if (selectedUrgency !== 'ALL' && (req.urgency !== selectedUrgency && req.priority !== selectedUrgency)) return false;
    return true;
  });

  // For "ALL" tab for org: sort org's own first
  const filteredAndSortedRequests = activeTab === 'ALL' ? (() => {
    let result = [...requests];
    if (selectedCategory !== 'ALL') result = result.filter(r => r.category === selectedCategory);
    if (selectedUrgency !== 'ALL') result = result.filter(r => r.urgency === selectedUrgency || r.priority === selectedUrgency);
    if (isOrg) {
      // Sort org's own postings first
      result.sort((a, b) => {
        const aOwn = a.ngoId === orgId || a.ngoName === orgName ? -1 : 0;
        const bOwn = b.ngoId === orgId || b.ngoName === orgName ? -1 : 0;
        return aOwn - bOwn;
      });
    }
    return result;
  })() : myPostings;

  const displayRequests = filteredAndSortedRequests;

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
            NGO Demands &amp; Immediate Needs
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
            Verified shelters and distribution hubs with acute food &amp; supply shortages. Fulfill directly to match their needed quantity.
          </p>
        </div>

        {/* Filter Controls (only show on ALL tab) */}
        {activeTab === 'ALL' && (
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Category:</span>
              <select
                className="p-2 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-xs rounded-xl border border-slate-200 dark:border-slate-600 outline-none font-semibold"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                <option value="Food">Food &amp; Rations</option>
                <option value="Clothes">Clothes &amp; Blankets</option>
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
        )}
      </div>

      {/* Org-only Tab Bar */}
      {isOrg && (
        <div className="flex space-x-2 bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs w-fit">
          <button
            onClick={() => setActiveTab('MY')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'MY'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
          >
            <span className="flex items-center space-x-1.5">
              <Package className="w-3.5 h-3.5" />
              <span>My Postings {myPostings.length > 0 ? `(${myPostings.length})` : ''}</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'ALL'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
          >
            <span className="flex items-center space-x-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>All Shortages</span>
            </span>
          </button>
        </div>
      )}

      {/* Empty State for My Postings */}
      {activeTab === 'MY' && myPostings.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400">
          <Package className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="font-bold text-sm text-slate-700 dark:text-slate-200 mb-1">No postings yet</p>
          <p className="text-xs">Use "Post a Need" from the dashboard sidebar to publish your first shortage.</p>
        </div>
      )}

      {/* REQUIREMENTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayRequests.map((req) => {
          const isUrgent = req.urgency === 'HIGH' || req.priority?.includes('Urgent');
          const isMyPosting = isOrg && (req.ngoId === orgId || req.ngoName === orgName);
          const isFulfilled = req.status === 'FULFILLED';
          const isEditing = editingId === req.id;

          return (
            <div
              key={req.id}
              className={`bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs border transition-all flex flex-col justify-between space-y-4 group ${isMyPosting
                ? 'border-amber-400 dark:border-amber-600 ring-1 ring-amber-400/50 dark:ring-amber-600/50'
                : 'border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500'
                } ${isFulfilled ? 'opacity-60' : ''}`}
            >
              <div className="space-y-3">

                {/* Top Badge & Item Title */}
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5 flex-1 mr-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
                        {req.category || 'Food'} Deficit
                      </span>
                      {isMyPosting && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 uppercase tracking-wide">
                          My Posting
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {req.item}
                    </h3>
                  </div>

                  {isFulfilled ? (
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase shrink-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                      ✓ Fulfilled
                    </span>
                  ) : (
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase shrink-0 ${isUrgent
                      ? 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-200 dark:border-red-900'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                      }`}>
                      {isUrgent ? '🔴 Urgent' : '🟡 Moderate'}
                    </span>
                  )}
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

                {/* Quantitative Supply Stats - Editable for My Postings */}
                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Target Quantity Needed:</span>
                    {isMyPosting && isEditing ? (
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          min="1"
                          value={editValues.quantity}
                          onChange={(e) => setEditValues(prev => ({ ...prev, quantity: e.target.value }))}
                          className="w-20 px-2 py-1 text-xs bg-white dark:bg-slate-700 border border-emerald-400 dark:border-emerald-600 rounded-lg text-slate-900 dark:text-white outline-none font-bold"
                        />
                        <span className="text-slate-500">{req.unit}</span>
                      </div>
                    ) : (
                      <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                        {req.quantity} {req.unit}
                      </span>
                    )}
                  </div>

                  {/* Urgency edit for My Postings */}
                  {isMyPosting && isEditing ? (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400">Urgency:</span>
                      <select
                        value={editValues.urgency}
                        onChange={(e) => setEditValues(prev => ({ ...prev, urgency: e.target.value }))}
                        className="px-2 py-1 text-xs bg-white dark:bg-slate-700 border border-emerald-400 dark:border-emerald-600 rounded-lg text-slate-900 dark:text-white outline-none font-bold"
                      >
                        <option value="HIGH">🔴 Urgent</option>
                        <option value="MEDIUM">🟡 Moderate</option>
                      </select>
                    </div>
                  ) : null}

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

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">

                {/* My Posting Edit Controls */}
                {isMyPosting && !isFulfilled && (
                  <div className="space-y-2">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(req)}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStartEdit(req)}
                          className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleMarkFulfilled(req)}
                          className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1 border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Fulfilled</span>
                        </button>
                        <button
                          onClick={() => handleDelete(req)}
                          className="py-2 px-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                          title="Remove this posting"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* General Action Buttons (non-edit mode for my postings, or for all others) */}
                {(!isMyPosting || isFulfilled) && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewOnMap(req)}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                      title="View this NGO hub on the Logistics Map"
                    >
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                      <span>View on Map</span>
                    </button>

                    <button
                      onClick={() => navigate('/')}
                      className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1 border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                      title="Check available surplus for this shortage"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Find Surplus</span>
                    </button>
                  </div>
                )}

                {/* Donate button – only for non-org viewers, non-fulfilled */}
                {!isOrg && !isFulfilled && (
                  <button
                    onClick={() => handleDonateForRequirement(req)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-xs transition-all text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Utensils className="w-3.5 h-3.5" />
                    <span>DONATE {req.quantity} {req.unit.toUpperCase()} DIRECTLY</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Org-to-Org actions: shown when an Organisation views another NGO's shortage */}
                {isOrg && !isMyPosting && !isFulfilled && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRedirectNgo({ id: req.ngoId, name: req.ngoName })}
                      className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Redirect Surplus Here</span>
                    </button>
                    <button
                      onClick={() => setContactNgo({ id: req.ngoId, name: req.ngoName, phone: req.contactPhone })}
                      className="py-2.5 px-3 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-bold rounded-xl text-xs transition-colors border border-teal-200 dark:border-teal-800 flex items-center space-x-1 cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Contact NGO</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Organisation Inter-NGO Action Modals */}
      {contactNgo && <ContactNgoModal ngo={contactNgo} onClose={() => setContactNgo(null)} />}
      {redirectNgo && <RedirectSurplusModal ngo={redirectNgo} user={user} onClose={() => setRedirectNgo(null)} />}
    </div>
  );
};

export default NGORequirementsPage;
