import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
  CheckCircle2,
  Edit2,
  Trash2,
  Check,
  Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import ContactNgoModal from './ContactNgoModal';
import RedirectSurplusModal from './RedirectSurplusModal';

const NGORequirementsPage = ({ user, token: tokenProp, socket }) => {
  const token = tokenProp || localStorage.getItem('token');
  const [requests, setRequests] = useState([]);
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

  const [loadingRequests, setLoadingRequests] = useState(true);
  const [requestsError, setRequestsError] = useState(null);

  const syncData = useCallback(async () => {
    try {
      // Fetch all active needs (ALL tab) and org's own needs (MY tab) in parallel
      const [allRes, myRes] = await Promise.all([
        axios.get(`${API_URL}/api/needs`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
        isOrg && token
          ? axios.get(`${API_URL}/api/needs/my-needs`, { headers: { Authorization: `Bearer ${token}` } })
          : Promise.resolve({ data: [] })
      ]);

      // Normalize backend Need objects to the shape the UI expects
      const normalize = (n) => ({
        id: n._id,
        _id: n._id,
        ngoId: n.ngoId?._id || n.ngoId,
        ngoName: n.ngoId?.orgName || n.ngoId?.fullName || (isOrg ? orgName : 'Verified NGO'),
        item: n.title,
        category: n.category || 'Food',
        quantity: n.quantity,
        unit: n.unit || 'servings',
        urgency: n.urgency || 'HIGH',
        requiredBy: n.neededByDate,
        description: n.description || '',
        status: n.status || 'ACTIVE',
        createdAt: n.createdAt,
        city: n.ngoId?.city || '',
        address: n.ngoId?.address || '',
        contactPhone: n.ngoId?.phone || ''
      });

      // For MY tab, use the my-needs endpoint for precision
      const myNeeds = (isOrg ? myRes.data : []).map(normalize);
      const allNeeds = (allRes.data || []).map(normalize);

      // Merge: for MY tab we'll use myNeeds, for ALL tab use allNeeds
      const combined = [...allNeeds];
      // Ensure own needs are present (may overlap with allNeeds)
      myNeeds.forEach(my => {
        if (!combined.find(r => r.id === my.id)) combined.push(my);
      });

      setRequests(combined);
      setRequestsError(null);
    } catch (err) {
      console.error('Failed to load shortage requests:', err);
      setRequestsError('Failed to load shortage requests. Please try again.');
    } finally {
      setLoadingRequests(false);
    }
  }, [token, isOrg, orgName]);

  useEffect(() => {
    syncData();
    // 8-second polling fallback ensures cross-role sync
    const interval = setInterval(syncData, 8000);
    return () => clearInterval(interval);
  }, [syncData]);

  // Realtime Socket.io listeners
  useEffect(() => {
    if (!socket || typeof socket.on !== 'function') return;

    const handleRealtimeUpdate = () => {
      syncData();
    };

    socket.on('NEED_CREATED', handleRealtimeUpdate);
    socket.on('NEW_NEED_LISTING', handleRealtimeUpdate);
    socket.on('NEED_UPDATED', handleRealtimeUpdate);
    socket.on('NEED_DELETED', handleRealtimeUpdate);

    return () => {
      socket.off('NEED_CREATED', handleRealtimeUpdate);
      socket.off('NEW_NEED_LISTING', handleRealtimeUpdate);
      socket.off('NEED_UPDATED', handleRealtimeUpdate);
      socket.off('NEED_DELETED', handleRealtimeUpdate);
    };
  }, [socket, syncData]);

  const handleDonateForRequirement = (req) => {
    navigate('/donate', {
      state: {
        prefill: {
          needId: req.id || req._id,
          requirementId: req.id || req._id,
          foodType: req.item,
          quantity: req.quantity,
          unit: req.unit,
          targetNgoId: req.ngoId,
          targetNgoName: req.ngoName
        }
      }
    });
  };



  const handleStartEdit = (req) => {
    setEditingId(req.id);
    setEditValues({ quantity: req.quantity, urgency: req.urgency });
  };

  const handleSaveEdit = async (req) => {
    try {
      await axios.patch(
        `${API_URL}/api/needs/${req.id}`,
        {
          quantity: Number(editValues.quantity) || req.quantity,
          urgency: editValues.urgency
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingId(null);
      setEditValues({});
      syncData();
    } catch (err) {
      console.error('Failed to save edit:', err);
      alert(err.response?.data?.message || 'Failed to save changes.');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const handleMarkFulfilled = async (req) => {
    if (!window.confirm(`Mark "${req.item}" as fulfilled? This cannot be undone.`)) return;
    try {
      await axios.patch(
        `${API_URL}/api/needs/${req.id}`,
        { status: 'FULFILLED' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      syncData();
    } catch (err) {
      console.error('Failed to mark fulfilled:', err);
      alert(err.response?.data?.message || 'Failed to mark as fulfilled.');
    }
  };

  const handleDelete = async (req) => {
    if (!window.confirm(`Remove this posting for "${req.item}"?`)) return;
    try {
      await axios.delete(
        `${API_URL}/api/needs/${req.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      syncData();
    } catch (err) {
      console.error('Failed to delete need:', err);
      alert(err.response?.data?.message || 'Failed to delete posting.');
    }
  };

  // Split requests: org's own vs others
  const myPostings = isOrg
    ? requests.filter(req =>
      req.ngoId === orgId ||
      (orgName && req.ngoName && req.ngoName === orgName)
    )
    : [];

  // For "ALL" tab: donors only see ACTIVE; orgs see all (own postings may be fulfilled)
  const filteredAndSortedRequests = activeTab === 'ALL' ? (() => {
    let result = requests.filter(r => {
      // Non-org donors: only show ACTIVE shortages
      if (!isOrg && r.status !== 'ACTIVE') return false;
      if (selectedCategory !== 'ALL' && r.category !== selectedCategory) return false;
      if (selectedUrgency !== 'ALL' && (r.urgency !== selectedUrgency && r.priority !== selectedUrgency)) return false;
      return true;
    });
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
      <div className="bg-white dark:bg-[#0F1A33] p-6 rounded-2xl shadow-xs border border-[#E5E1D8] dark:border-[#1E2D52] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#E5B85C] dark:text-[#D9B65D] uppercase tracking-wider mb-1">
            <AlertCircle className="w-4 h-4" />
            <span>Active Supply Shortages</span>
          </div>
          <h1 className="text-2xl font-bold text-[#18315E] dark:text-white">
            NGO Demands &amp; Immediate Needs
          </h1>
          <p className="text-xs text-[#60708B] dark:text-slate-300 mt-0.5 max-w-xl">
            Verified shelters and distribution hubs with acute food &amp; supply shortages. Fulfill directly to match their needed quantity.
          </p>
        </div>

        {/* Filter Controls (only show on ALL tab) */}
        {activeTab === 'ALL' && (
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-bold text-[#60708B] uppercase">Category:</span>
              <select
                className="p-2 bg-[#F3F0EA] dark:bg-[#0F1A33] text-[#18315E] dark:text-white text-xs rounded-xl border border-[#E5E1D8] dark:border-[#1E2D52] outline-none font-semibold"
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
              <span className="text-[11px] font-bold text-[#60708B] uppercase">Urgency:</span>
              <select
                className="p-2 bg-[#F3F0EA] dark:bg-[#0F1A33] text-[#18315E] dark:text-white text-xs rounded-xl border border-[#E5E1D8] dark:border-[#1E2D52] outline-none font-semibold"
                value={selectedUrgency}
                onChange={(e) => setSelectedUrgency(e.target.value)}
              >
                <option value="ALL">All Urgencies</option>
                <option value="HIGH">Urgent Deficit</option>
                <option value="MEDIUM">Medium Priority</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Org-only Tab Bar */}
      {isOrg && (
        <div className="flex space-x-2 bg-white dark:bg-[#0F1A33] p-2 rounded-2xl border border-[#E5E1D8] dark:border-[#1E2D52] shadow-xs w-fit">
          <button
            onClick={() => setActiveTab('MY')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'MY'
              ? 'bg-[#E5B85C] text-white shadow-sm'
              : 'text-[#60708B] dark:text-slate-300 hover:bg-[#F3F0EA] dark:hover:bg-[#15223F]'
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
              ? 'bg-[#E5B85C] text-white shadow-sm'
              : 'text-[#60708B] dark:text-slate-300 hover:bg-[#F3F0EA] dark:hover:bg-[#15223F]'
              }`}
          >
            <span className="flex items-center space-x-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>All Shortages</span>
            </span>
          </button>
        </div>
      )}

      {/* Error state */}
      {requestsError && (
        <div className="p-4 bg-[#F3F0EA] dark:bg-[#0F1A33]/40 border border-[#E5E1D8] dark:border-[#1E2D52] rounded-2xl text-center text-xs text-[#18315E] dark:text-[#D9B65D]">
          <p>{requestsError}</p>
        </div>
      )}

      {/* Loading state */}
      {loadingRequests && displayRequests.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-[#0F1A33] rounded-2xl border border-[#E5E1D8] dark:border-[#1E2D52] text-[#60708B] dark:text-slate-300">
          <p className="text-sm font-semibold">Loading shortage requests...</p>
        </div>
      )}

      {/* Empty State for My Postings */}
      {activeTab === 'MY' && myPostings.length === 0 && !loadingRequests && (
        <div className="text-center py-16 bg-white dark:bg-[#0F1A33] rounded-2xl border border-dashed border-[#E5E1D8] dark:border-[#1E2D52] text-[#60708B] dark:text-slate-300">
          <Package className="w-10 h-10 mx-auto text-[#60708B] dark:text-slate-300 mb-3" />
          <p className="font-bold text-sm text-[#18315E] dark:text-white mb-1">No postings yet</p>
          <p className="text-xs">Use "Post a Need" from the dashboard sidebar to publish your first shortage.</p>
        </div>
      )}

      {/* Empty State for All Shortages */}
      {activeTab === 'ALL' && displayRequests.length === 0 && !loadingRequests && (
        <div className="text-center py-16 bg-white dark:bg-[#0F1A33] rounded-2xl border border-dashed border-[#E5E1D8] dark:border-[#1E2D52] text-[#60708B] dark:text-slate-300 p-8 space-y-3">
          <Package className="w-10 h-10 mx-auto text-[#60708B] dark:text-slate-300" />
          <h3 className="font-bold text-base text-[#18315E] dark:text-white">No Shortage Requests Found</h3>
          <p className="text-xs max-w-md mx-auto">
            {selectedCategory !== 'ALL' || selectedUrgency !== 'ALL'
              ? 'No shortage requests match the selected filters. Try changing or resetting your filters.'
              : 'There are currently no active shortage requests posted by organisations. Check back soon!'}
          </p>
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
              className={`bg-white dark:bg-[#0F1A33] rounded-2xl p-5 sm:p-6 shadow-xs border transition-all flex flex-col justify-between space-y-4 group ${isMyPosting
                ? 'border-[#1E293B] dark:border-[#1E2D52] ring-1 ring-[#173B78]/50 dark:ring-[#173B78]/50'
                : 'border-[#E5E1D8] dark:border-[#1E2D52] hover:border-[#173B78] dark:hover:border-[#173B78]'
                } ${isFulfilled ? 'opacity-60' : ''}`}
            >
              <div className="space-y-3">

                {/* Top Badge & Item Title */}
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5 flex-1 mr-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] font-extrabold uppercase text-[#60708B] dark:text-slate-300 tracking-wider block">
                        {req.category || 'Food'} Deficit
                      </span>
                      {isMyPosting && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#F3F0EA] dark:bg-[#0F1A33]/80 text-[#18315E] dark:text-[#D9B65D] border border-[#E5E1D8] dark:border-[#D9B65D] uppercase tracking-wide">
                          My Posting
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-[#18315E] dark:text-white leading-snug group-hover:text-[#18315E] dark:group-hover:text-[#D9B65D] transition-colors">
                      {req.item}
                    </h3>
                  </div>

                  {isFulfilled ? (
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase shrink-0 bg-[#F3F0EA] text-[#18315E] dark:bg-[#0F1A33]/80 dark:text-[#D9B65D] border border-[#E5E1D8] dark:border-[#1E2D52]">
                      Fulfilled
                    </span>
                  ) : (
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase shrink-0 ${isUrgent
                      ? 'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-[#E0A84A]/14 dark:text-[#E0A84A] dark:border dark:border-[#E0A84A]/40'
                      : 'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-[#E0A84A]/14 dark:text-[#E0A84A] dark:border dark:border-[#E0A84A]/40'
                      }`}>
                      {isUrgent ? 'Urgent' : 'Moderate'}
                    </span>
                  )}
                </div>

                {/* Organization Details */}
                <div className="p-3 bg-[#F3F0EA] dark:bg-[#0F1A33]/60 rounded-xl border border-[#E5E1D8]/80 dark:border-[#1E2D52] space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#18315E] dark:text-white flex items-center truncate mr-2">
                      <Building2 className="w-3.5 h-3.5 mr-1 text-[#18315E] shrink-0" />
                      <span className="truncate">{req.ngoName || 'Organisation'}</span>
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-[#5BB487]/14 dark:text-[#5BB487] dark:border dark:border-[#5BB487]/40 px-1.5 py-0.5 rounded shrink-0">
                      Verified
                    </span>
                  </div>
                  {(req.address || req.city) && (
                    <p className="text-[#60708B] dark:text-slate-300 flex items-center truncate">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-[#60708B] shrink-0" />
                      {[req.address, req.city].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>

                {/* Quantitative Supply Stats - Editable for My Postings */}
                <div className="space-y-2 pt-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[#60708B] dark:text-slate-300">Target Quantity Needed:</span>
                    {isMyPosting && isEditing ? (
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          min="1"
                          value={editValues.quantity}
                          onChange={(e) => setEditValues(prev => ({ ...prev, quantity: e.target.value }))}
                          className="w-20 px-2 py-1 text-xs bg-white dark:bg-[#0F1A33] border border-[#1E293B] dark:border-[#1E2D52] rounded-lg text-[#18315E] dark:text-white outline-none font-bold"
                        />
                        <span className="text-[#60708B]">{req.unit}</span>
                      </div>
                    ) : (
                      <span className="text-sm font-extrabold text-[#18315E] dark:text-[#D9B65D]">
                        {req.quantity} {req.unit}
                      </span>
                    )}
                  </div>

                  {/* Urgency edit for My Postings */}
                  {isMyPosting && isEditing ? (
                    <div className="flex justify-between items-center">
                      <span className="text-[#60708B] dark:text-slate-300">Urgency:</span>
                      <select
                        value={editValues.urgency}
                        onChange={(e) => setEditValues(prev => ({ ...prev, urgency: e.target.value }))}
                        className="px-2 py-1 text-xs bg-white dark:bg-[#0F1A33] border border-[#1E293B] dark:border-[#1E2D52] rounded-lg text-[#18315E] dark:text-white outline-none font-bold"
                      >
                        <option value="HIGH">Urgent</option>
                        <option value="MEDIUM">Moderate</option>
                      </select>
                    </div>
                  ) : null}

                  {req.beneficiaries ? (
                    <div className="flex justify-between items-center text-[#60708B] dark:text-slate-300">
                      <span className="flex items-center text-[#60708B] dark:text-slate-300">
                        <Users className="w-3.5 h-3.5 mr-1 text-[#18315E]" /> Feeding Capacity:
                      </span>
                      <strong className="text-[#18315E] dark:text-white">{req.beneficiaries} people</strong>
                    </div>
                  ) : null}

                  {req.requiredBy && (
                    <div className="flex justify-between items-center text-[#60708B] dark:text-slate-300">
                      <span className="flex items-center text-[#60708B] dark:text-slate-300">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-[#18315E]" /> Needed By:
                      </span>
                      <strong className="text-[#18315E] dark:text-white">{new Date(req.requiredBy).toLocaleDateString()}</strong>
                    </div>
                  )}
                </div>

                {req.description && (
                  <p className="text-[11px] text-[#60708B] dark:text-slate-300 italic">
                    "{req.description}"
                  </p>
                )}

              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-[#E5E1D8] dark:border-[#1E2D52]">

                {/* My Posting Edit Controls */}
                {isMyPosting && !isFulfilled && (
                  <div className="space-y-2">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(req)}
                          className="flex-1 py-2 bg-[#173B78] hover:bg-[#0F172A] dark:bg-[#3156B5] dark:hover:bg-[#3F66CC] text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="py-2 px-4 bg-[#F3F0EA] hover:bg-[#F3F0EA] dark:bg-[#0F1A33] dark:hover:bg-[#15223F] text-[#18315E] dark:text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStartEdit(req)}
                          className="flex-1 py-2 bg-[#F3F0EA] hover:bg-[#F3F0EA] dark:bg-[#0F1A33] dark:hover:bg-[#15223F] text-[#18315E] dark:text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-[#18315E]" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleMarkFulfilled(req)}
                          className="flex-1 py-2 bg-[#F3F0EA] hover:bg-[#F3F0EA] dark:bg-[#0F1A33]/40 dark:hover:bg-[#15223F]/40 text-[#18315E] dark:text-[#D9B65D] font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1 border border-[#E5E1D8] dark:border-[#1E2D52] cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Fulfilled</span>
                        </button>
                        <button
                          onClick={() => handleDelete(req)}
                          className="py-2 px-3 bg-[#F3F0EA] hover:bg-[#F3F0EA] dark:bg-[#0F1A33]/30 dark:hover:bg-[#15223F]/40 text-[#18315E] dark:text-[#D9B65D] font-bold rounded-xl text-xs transition-colors cursor-pointer"
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
                      onClick={() => navigate('/')}
                      className="flex-1 py-2 bg-[#F3F0EA] hover:bg-[#F3F0EA] dark:bg-[#0F1A33]/40 dark:hover:bg-[#15223F]/40 text-[#18315E] dark:text-[#D9B65D] font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1 border border-[#E5E1D8] dark:border-[#1E2D52] cursor-pointer"
                      title="Check available surplus for this shortage"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#18315E]" />
                      <span>Find Surplus</span>
                    </button>
                  </div>
                )}

                {/* Donate button – only for non-org viewers, non-fulfilled */}
                {!isOrg && !isFulfilled && (
                  <button
                    onClick={() => handleDonateForRequirement(req)}
                    className="w-full py-2.5 bg-emerald-600 dark:bg-[#3156B5] dark:text-white dark:font-semibold dark:shadow-md dark:shadow-sky-500/10 text-white font-extrabold rounded-xl hover:bg-emerald-700 dark:hover:bg-[#3F66CC] shadow-sm transition-all text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
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
                      className="flex-1 py-2.5 bg-[#E5B85C] hover:bg-[#173B78] text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Redirect Surplus Here</span>
                    </button>
                    <button
                      onClick={() => setContactNgo({ id: req.ngoId, name: req.ngoName, phone: req.contactPhone })}
                      className="py-2.5 px-3 bg-[#F3F0EA] hover:bg-[#F3F0EA] dark:bg-[#0F1A33]/40 text-[#18315E] dark:text-[#D9B65D] font-bold rounded-xl text-xs transition-colors border border-[#E5E1D8] dark:border-[#1E2D52] flex items-center space-x-1 cursor-pointer"
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








