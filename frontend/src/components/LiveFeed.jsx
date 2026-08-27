import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  MapPin,
  Clock,
  Utensils,
  AlertCircle,
  Phone,
  Mail,
  CheckCircle,
  Package,
  Search,
  Sparkles,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Edit,
  Trash2,
  Truck,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WorkflowNav from './WorkflowNav';
import { getStoredRequests, addNotification, confirmDonationMatch, assignVolunteerToDonation } from '../services/donationService';
import { calculateMatchScore } from '../services/matchingService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const LiveFeed = ({ socket, user, token, onEdit }) => {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Expiring Soonest');
  const [selectedListing, setSelectedListing] = useState(null);
  const [claimStatus, setClaimStatus] = useState('IDLE'); // 'IDLE', 'FORM', 'SUCCESS'
  const [claimMessage, setClaimMessage] = useState('');

  // Default clean time helper (30 mins from current time formatted as HH:mm)
  const getDefaultPickupTime = () => {
    const d = new Date(Date.now() + 30 * 60 * 1000);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const [claimTime, setClaimTime] = useState(getDefaultPickupTime());
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const isOrg = user?.accountType === 'ORGANISATION' || 
                user?.accountType === 'ORGANIZATION' || 
                user?.role === 'ORGANISATION' || 
                user?.role === 'ORGANIZATION' || 
                Boolean(user?.orgName);
  const isDonor = !isOrg;

  // Part 1: Donor Dashboard toggle, claims & postings state
  const [showMyUploads, setShowMyUploads] = useState(false);
  const [donorClaims, setDonorClaims] = useState([]);
  const [loadingDonorClaims, setLoadingDonorClaims] = useState(false);
  const [donorPostingsTab, setDonorPostingsTab] = useState('ALL'); // ALL, ACTIVE, ACCEPTED, REJECTED, NON_CLAIMED
  const [donorPostings, setDonorPostings] = useState([]);
  const [loadingDonorPostings, setLoadingDonorPostings] = useState(false);

  // Part 2: NGO Dashboard toggle & shortages state
  const [showMyShortages, setShowMyShortages] = useState(false);
  const [myNeeds, setMyNeeds] = useState([]);
  const [loadingMyNeeds, setLoadingMyNeeds] = useState(false);

  const setPresetTime = (minutesToAdd) => {
    const d = new Date(Date.now() + minutesToAdd * 60 * 1000);
    setClaimTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
  };

  const fetchDonorClaims = async () => {
    if (!isDonor || !token) return;
    setLoadingDonorClaims(true);
    try {
      const res = await axios.get(`${API_URL}/api/claims/donor/my-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDonorClaims(res.data || []);
    } catch (err) {
      console.error('Failed to fetch donor claims:', err);
    } finally {
      setLoadingDonorClaims(false);
    }
  };

  const fetchDonorPostings = async () => {
    if (!isDonor || !token) return;
    setLoadingDonorPostings(true);
    try {
      const res = await axios.get(`${API_URL}/api/food/my-listings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Raw API Response from /api/food/my-listings:', res.data);
      setDonorPostings(res.data || []);
    } catch (err) {
      console.error('Failed to fetch donor postings:', err);
    } finally {
      setLoadingDonorPostings(false);
    }
  };

  const fetchMyNeeds = async () => {
    if (!isOrg || !token) return;
    setLoadingMyNeeds(true);
    try {
      const res = await axios.get(`${API_URL}/api/needs/my-needs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyNeeds(res.data || []);
    } catch (err) {
      console.error('Failed to fetch my needs:', err);
    } finally {
      setLoadingMyNeeds(false);
    }
  };

  useEffect(() => {
    if (isDonor) {
      fetchDonorClaims();
      if (showMyUploads) {
        fetchDonorPostings();
      }
    } else if (isOrg) {
      fetchMyNeeds();
    }
  }, [user, token, isDonor, isOrg, showMyUploads]);

  const handleAcceptClaim = async (claimId, claimData = null) => {
    try {
      const res = await axios.patch(`${API_URL}/api/claims/${claimId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const code = res.data?.verificationCode;
      alert(`Claim request accepted successfully! Verification Code: ${code || 'Generated'}`);

      // Trigger the existing further pickup workflow (assignVolunteerToDonation / tracking timeline)
      const targetClaim = claimData || donorClaims.find(c => c._id === claimId) || res.data?.claim;
      const ngoId = targetClaim?.ngoId?._id || targetClaim?.ngoId?.id || targetClaim?.ngoId;
      const ngoName = targetClaim?.ngoId?.orgName || targetClaim?.ngoId?.fullName || 'Partner Organisation';
      const foodId = targetClaim?.foodId?._id || targetClaim?.foodId || res.data?.food?._id;

      if (foodId) {
        confirmDonationMatch(foodId, ngoId, ngoName);
        assignVolunteerToDonation(foodId, {
          name: 'Rahul Verma (Rider)',
          phone: '+91 98233 44112',
          coords: { lat: 18.5240, lng: 73.8445 }
        });
      }

      // Two-way sync notification
      const donorName = user?.orgName || user?.fullName || user?.name || 'Donor';
      addNotification({
        title: 'Claim Request Accepted! 🤝',
        message: `${donorName} accepted your claim request. Volunteer assigned for pickup!`,
        type: 'SUCCESS',
        targetRole: 'ORGANISATION',
        targetNgoId: ngoId,
        donorName
      });

      fetchDonorClaims();
      fetchDonorPostings();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to accept claim');
    }
  };

  const handleDeclineClaim = async (claimId) => {
    const reason = window.prompt('Reason for declining (optional):');
    if (reason === null) return;
    try {
      await axios.patch(`${API_URL}/api/claims/${claimId}/decline`, { reason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Claim request declined.');
      fetchDonorClaims();
      fetchDonorPostings();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to decline claim');
    }
  };

  const handleDeletePosting = async (foodId) => {
    if (!window.confirm('Are you sure you want to delete this food posting?')) return;
    try {
      await axios.delete(`${API_URL}/api/food/${foodId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDonorPostings();
      const res = await axios.get(`${API_URL}/api/food`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setListings(res.data || []);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete posting');
    }
  };

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/food`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setListings(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();

    const handleNewListing = (listing) => {
      setListings((prev) => [listing, ...prev]);
    };
    const handleUpdateListing = (updatedListing) => {
      setListings((prev) =>
        prev.map(l => l._id === updatedListing._id ? updatedListing : l)
      );
      if (selectedListing && selectedListing._id === updatedListing._id) {
        setSelectedListing(updatedListing);
      }
      if (isDonor) {
        fetchDonorPostings();
        fetchDonorClaims();
      }
    };

    const handleClaimRequestReceived = (data) => {
      if (isDonor && (data.donorId === user?.id || data.donorId === user?._id)) {
        fetchDonorClaims();
        fetchDonorPostings();
        addNotification({
          title: 'New NGO Claim Request! 🍽️',
          message: `${data.ngoName || 'An NGO'} requested to claim "${data.foodTitle || 'your surplus food'}".`,
          type: 'INFO'
        });
      }
    };

    const handleClaimAccepted = () => {
      if (isDonor) {
        fetchDonorClaims();
        fetchDonorPostings();
      }
    };

    const handleClaimDeclined = () => {
      if (isDonor) {
        fetchDonorClaims();
        fetchDonorPostings();
      }
    };

    if (socket && typeof socket.on === 'function') {
      socket.on('NEW_FOOD_LISTING', handleNewListing);
      socket.on('LISTING_UPDATED', handleUpdateListing);
      socket.on('CLAIM_REQUEST_RECEIVED', handleClaimRequestReceived);
      socket.on('CLAIM_ACCEPTED', handleClaimAccepted);
      socket.on('CLAIM_DECLINED', handleClaimDeclined);
    }

    return () => {
      if (socket && typeof socket.off === 'function') {
        socket.off('NEW_FOOD_LISTING', handleNewListing);
        socket.off('LISTING_UPDATED', handleUpdateListing);
        socket.off('CLAIM_REQUEST_RECEIVED', handleClaimRequestReceived);
        socket.off('CLAIM_ACCEPTED', handleClaimAccepted);
        socket.off('CLAIM_DECLINED', handleClaimDeclined);
      }
    };
  }, [socket, token, selectedListing, isDonor, user]);

  const handleClaim = async (id) => {
    if (user?.accountType !== 'ORGANISATION') return alert('Only organisations can claim food');
    console.log('[DEBUG handleClaim] Initiating claim for food id:', id, {
      message: claimMessage,
      requestedPickupTime: claimTime,
      user,
      hasToken: Boolean(token)
    });
    try {
      const res = await axios.post(`${API_URL}/api/food/${id}/claim`, {
        message: claimMessage,
        requestedPickupTime: claimTime
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('[DEBUG handleClaim] Claim response:', res.status, res.data);
      setClaimStatus('SUCCESS');
    } catch (err) {
      console.error('[DEBUG handleClaim ERROR]', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        headers: err.response?.headers,
        message: err.message
      });
      alert(err.response?.data?.message || 'Failed to submit claim. Please try again.');
    }
  };

  const storedRequests = useMemo(() => getStoredRequests(), []);

  // Compute matched shortage for a given listing
  const getListingMatch = (listing) => {
    if (!storedRequests || storedRequests.length === 0) return null;
    const title = listing.title || '';
    const firstItem = listing.items?.[0]?.itemName || '';
    const itemName = `${title} ${firstItem}`.trim();

    let bestMatch = null;
    let highestScore = 0;

    storedRequests.forEach((req) => {
      if (req.category === 'Food' || !req.category) {
        const score = calculateMatchScore(
          { category: 'Food', itemName, quantity: listing.quantity || 30 },
          req,
          3.0
        );
        if (score > highestScore) {
          highestScore = score;
          bestMatch = { ...req, score };
        }
      }
    });

    return bestMatch && highestScore >= 50 ? bestMatch : null;
  };

  const getAllListingMatches = (listing) => {
    if (!storedRequests || storedRequests.length === 0) return [];
    const title = listing.title || '';
    const firstItem = listing.items?.[0]?.itemName || '';
    const itemName = `${title} ${firstItem}`.trim();

    return storedRequests
      .filter(req => req.category === 'Food' || !req.category)
      .map(req => {
        const score = calculateMatchScore(
          { category: 'Food', itemName, quantity: listing.quantity || 30 },
          req,
          3.0
        );
        return { ...req, score };
      })
      .sort((a, b) => b.score - a.score);
  };

  const sortedAndFilteredListings = useMemo(() => {
    let result = [...listings];

    // Filter by Category
    if (filter !== 'ALL') {
      result = result.filter(l => l.foodType === filter);
    }

    // Filter by Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l => {
        if (l.title && l.title.toLowerCase().includes(q)) return true;
        if (l.items && l.items.some(item => item.itemName && item.itemName.toLowerCase().includes(q))) return true;
        return false;
      });
    }

    // Sort
    if (sortBy === 'Expiring Soonest') {
      result.sort((a, b) => {
        const aExpiry = a.overallExpiry || a.expiryTime;
        const bExpiry = b.overallExpiry || b.expiryTime;
        return new Date(aExpiry) - new Date(bExpiry);
      });
    } else if (sortBy === 'Recently Added') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'Nearest Location') {
      result.sort((a, b) => {
        const hasLocA = a.location && a.location.coordinates && a.location.coordinates.length === 2;
        const hasLocB = b.location && b.location.coordinates && b.location.coordinates.length === 2;
        if (!hasLocA && !hasLocB) return 0;
        if (!hasLocA) return 1;
        if (!hasLocB) return -1;
        // Calculate distance relative to Pune center (73.8567° E, 18.5204° N)
        const distA = Math.pow(a.location.coordinates[0] - 73.8567, 2) + Math.pow(a.location.coordinates[1] - 18.5204, 2);
        const distB = Math.pow(b.location.coordinates[0] - 73.8567, 2) + Math.pow(b.location.coordinates[1] - 18.5204, 2);
        return distA - distB;
      });
    }

    return result;
  }, [listings, filter, searchQuery, sortBy]);

  if (loading) return <div className="text-center p-8 text-slate-500 dark:text-slate-400">Loading live feed...</div>;

  return (
    <div className="space-y-6">
      {/* Donor View Mode Toggle */}
      {isDonor && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Donor Command Dashboard</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {!showMyUploads ? 'Default View: Active NGO claim requests submitted on your food listings.' : 'Toggled View: Managing your uploaded surplus food listings.'}
            </p>
          </div>
          <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${!showMyUploads ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}>
              NGO Requests
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showMyUploads}
                onChange={e => setShowMyUploads(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-slate-600 peer-checked:bg-emerald-600"></div>
            </label>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${showMyUploads ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}>
              Show My Uploads/Postings
            </span>
          </div>
        </div>
      )}

      {/* NGO View Mode Toggle */}
      {isOrg && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Organisation Demand Hub</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {!showMyShortages ? 'Default View: Active surplus food listings available for claiming.' : 'Toggled View: Managing your organisation shortage requests.'}
            </p>
          </div>
          <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${!showMyShortages ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}>
              Surplus Feed
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showMyShortages}
                onChange={e => setShowMyShortages(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-slate-600 peer-checked:bg-amber-500"></div>
            </label>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${showMyShortages ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}>
              Show My Shortages/Needs
            </span>
          </div>
        </div>
      )}

      {isDonor && !showMyUploads ? (
        /* VIEW 1: NGO Claim Requests View for Donors */
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
              <Package className="w-5 h-5 mr-2 text-emerald-600" />
              NGO Claim Requests ({donorClaims.length})
            </h3>
            <button
              onClick={fetchDonorClaims}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              Refresh Requests
            </button>
          </div>

          {loadingDonorClaims ? (
            <div className="text-center py-12 text-slate-500">Loading claim requests...</div>
          ) : donorClaims.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 space-y-2">
              <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-700 dark:text-slate-300">No Claim Requests Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">When verified NGOs request to claim your surplus food listings, their requests will appear here for your direct review.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {donorClaims.map((claim) => (
                <div key={claim._id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                        NGO Request
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        claim.status === 'ACCEPTED' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' :
                        claim.status === 'DECLINED' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
                      }`}>
                        {claim.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">
                        {claim.ngoId?.orgName || claim.ngoId?.fullName || 'Verified NGO'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Requesting: <strong className="text-slate-800 dark:text-slate-200">{claim.foodId?.title || 'Surplus Listing'}</strong> ({claim.foodId?.quantity || 0} servings)
                      </p>
                    </div>

                    {claim.message && (
                      <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-xs italic text-slate-600 dark:text-slate-300">
                        "{claim.message}"
                      </div>
                    )}

                    <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                      {claim.requestedPickupTime && (
                        <div className="flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1.5 text-emerald-600 shrink-0" />
                          <span>Requested Pickup: <strong>{new Date(claim.requestedPickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" />
                        <span>Address: {claim.ngoId?.address || claim.ngoId?.city || 'Pune'}</span>
                      </div>
                    </div>
                  </div>

                  {claim.status === 'PENDING' ? (
                    <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                      <button
                        onClick={() => handleAcceptClaim(claim._id)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
                      >
                        Accept Request
                      </button>
                      <button
                        onClick={() => handleDeclineClaim(claim._id)}
                        className="flex-1 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-400 font-bold rounded-xl text-xs transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700 text-xs font-semibold text-center text-slate-500">
                      {claim.status === 'ACCEPTED' ? '✓ Accepted — Arranging Pickup' : 'Decline Processed'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : isDonor && showMyUploads ? (
        /* VIEW 2: INLINE DONOR POSTINGS & UPLOADS VIEW */
        <div className="space-y-6">
          {/* Header & Status Filter Tabs Bar */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                <Package className="w-5 h-5 mr-2 text-emerald-600" />
                My Food Postings & Uploads ({donorPostings.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage your active surplus listings, edit postings within the 12-hour window, or remove completed items.
              </p>
            </div>

            {/* Filter Tabs with Counts */}
            {(() => {
              const now = new Date();
              const counts = {
                ALL: donorPostings.length,
                ACTIVE: 0,
                ACCEPTED: 0,
                REJECTED: 0,
                NON_CLAIMED: 0
              };

              donorPostings.forEach(p => {
                const expiryDate = new Date(p.expiryTime || p.overallExpiry || p.createdAt);
                const isExpired = expiryDate <= now;
                const hasAcceptedClaim = Boolean(p.acceptedClaim) || p.status === 'ACCEPTED' || p.status === 'CLAIMED' || p.status === 'COMPLETED';
                const allClaimsDeclined = p.claims && p.claims.length > 0 && p.claims.every(c => c.status === 'DECLINED');
                const isRejected = p.status === 'REJECTED' || p.status === 'DECLINED' || allClaimsDeclined;

                if (hasAcceptedClaim) {
                  counts.ACCEPTED++;
                } else if (isRejected) {
                  counts.REJECTED++;
                } else if (isExpired && (!p.claims || p.claims.length === 0)) {
                  counts.NON_CLAIMED++;
                } else if (!isExpired) {
                  counts.ACTIVE++;
                } else {
                  counts.NON_CLAIMED++;
                }
              });

              return (
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 w-full md:w-auto overflow-x-auto gap-1">
                  {[
                    { key: 'ALL', label: 'All Postings', count: counts.ALL },
                    { key: 'ACTIVE', label: 'Active', count: counts.ACTIVE },
                    { key: 'ACCEPTED', label: 'Accepted', count: counts.ACCEPTED },
                    { key: 'REJECTED', label: 'Rejected', count: counts.REJECTED },
                    { key: 'NON_CLAIMED', label: 'Non-Claimed', count: counts.NON_CLAIMED }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setDonorPostingsTab(tab.key)}
                      className={`flex-1 md:flex-none py-1.5 px-3 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5 ${
                        donorPostingsTab === tab.key
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        donorPostingsTab === tab.key
                          ? 'bg-emerald-700 text-emerald-100'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Postings Grid */}
          {(() => {
            const now = new Date();
            const filteredPostings = donorPostings.filter(post => {
              const expiryDate = new Date(post.expiryTime || post.overallExpiry || post.createdAt);
              const isExpired = expiryDate <= now;
              const hasAcceptedClaim = Boolean(post.acceptedClaim) || post.status === 'ACCEPTED' || post.status === 'CLAIMED' || post.status === 'COMPLETED';
              const allClaimsDeclined = post.claims && post.claims.length > 0 && post.claims.every(c => c.status === 'DECLINED');
              const isRejected = post.status === 'REJECTED' || post.status === 'DECLINED' || allClaimsDeclined;

              // 1. All Postings — show every surplus item the logged-in donor has posted, regardless of status
              if (donorPostingsTab === 'ALL') return true;

              // 2. Active — show the logged-in donor's postings that are still within their valid window (not expired) and have NOT yet been claimed/accepted by any NGO
              if (donorPostingsTab === 'ACTIVE') {
                return !isExpired && !hasAcceptedClaim && !isRejected;
              }

              // 3. Accepted — show the logged-in donor's postings where an NGO has claimed/requested the item and the donor (or system) has accepted that claim
              if (donorPostingsTab === 'ACCEPTED') {
                return hasAcceptedClaim;
              }

              // 4. Rejected — show the logged-in donor's postings where an NGO's claim request was explicitly rejected/declined by the donor, OR the donor rejected all incoming requests for that item
              if (donorPostingsTab === 'REJECTED') {
                return isRejected && !hasAcceptedClaim;
              }

              // 5. Non-Claimed — show the logged-in donor's postings that have expired (past their expiry time) without any NGO ever claiming/requesting them
              if (donorPostingsTab === 'NON_CLAIMED') {
                return isExpired && !hasAcceptedClaim && (!post.claims || post.claims.length === 0);
              }

              return true;
            });

            if (loadingDonorPostings) {
              return <div className="text-center py-12 text-slate-500">Loading your food postings...</div>;
            }

            if (filteredPostings.length === 0) {
              return (
                <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 space-y-2">
                  <Package className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
                  <h4 className="font-bold text-slate-700 dark:text-slate-300">No Postings Found</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {donorPostingsTab === 'ALL'
                      ? 'You have not uploaded any surplus food listings yet.'
                      : `No postings currently under "${donorPostingsTab}" status.`}
                  </p>
                </div>
              );
            }

            const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPostings.map(post => {
                  const isEditable = (Date.now() - new Date(post.createdAt).getTime()) <= TWELVE_HOURS_MS;
                  const expiryDate = new Date(post.expiryTime || post.overallExpiry || post.createdAt);
                  const isExpired = expiryDate <= now;
                  const hasAcceptedClaim = Boolean(post.acceptedClaim) || post.status === 'ACCEPTED' || post.status === 'CLAIMED' || post.status === 'COMPLETED';
                  const allClaimsDeclined = post.claims && post.claims.length > 0 && post.claims.every(c => c.status === 'DECLINED');
                  const isRejected = post.status === 'REJECTED' || post.status === 'DECLINED' || allClaimsDeclined;
                  const isNonClaimed = isExpired && !hasAcceptedClaim && (!post.claims || post.claims.length === 0);

                  // Derived label & color
                  let statusLabel = 'ACTIVE';
                  let statusBadgeClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';

                  if (hasAcceptedClaim) {
                    statusLabel = 'ACCEPTED';
                    statusBadgeClass = 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800';
                  } else if (isRejected) {
                    statusLabel = 'REJECTED';
                    statusBadgeClass = 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 border-rose-200 dark:border-rose-800';
                  } else if (isNonClaimed || isExpired) {
                    statusLabel = 'NON-CLAIMED';
                    statusBadgeClass = 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600';
                  }

                  const claimingNgo = post.acceptedClaim?.ngoId || post.claimantId;

                  return (
                    <div key={post._id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {post.foodType}
                          </span>
                          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider border ${statusBadgeClass}`}>
                            {statusLabel}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-base leading-snug">{post.title}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Servings: <strong className="text-slate-800 dark:text-slate-200">{post.quantity} Portions</strong>
                          </p>
                        </div>

                        <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                          <div className="flex items-center">
                            <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" />
                            <span>
                              {isExpired ? 'Expired: ' : 'Expires: '}
                              <strong>{new Date(post.expiryTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</strong>
                            </span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" />
                            <span>Pickup: {post.pickupAddress || 'Address on file'}</span>
                          </div>
                        </div>

                        {/* Incoming Pending Claim Request Callout */}
                        {post.pendingClaim && (
                          <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center">
                                🔔 Incoming Request
                              </span>
                              <span className="text-[10px] bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 font-bold px-2 py-0.5 rounded-full">
                                Pending Review
                              </span>
                            </div>
                            <p className="text-xs text-slate-700 dark:text-slate-300">
                              <strong>{post.pendingClaim.ngoId?.orgName || post.pendingClaim.ngoId?.fullName || 'Verified NGO'}</strong> requested this item.
                              {post.pendingClaim.requestedPickupTime && (
                                <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  Pickup: {new Date(post.pendingClaim.requestedPickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </p>
                            {post.pendingClaim.message && (
                              <p className="text-[11px] italic text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg">
                                "{post.pendingClaim.message}"
                              </p>
                            )}
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => handleAcceptClaim(post.pendingClaim._id, post.pendingClaim)}
                                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                              </button>
                              <button
                                onClick={() => handleDeclineClaim(post.pendingClaim._id)}
                                className="flex-1 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Decline
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Accepted Claim Details & Tracking Link */}
                        {hasAcceptedClaim && (
                          <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200 dark:border-blue-900/60 space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-blue-800 dark:text-blue-300 flex items-center">
                                🤝 Matched Receiver
                              </span>
                              {post.verificationCode && (
                                <span className="font-mono font-bold text-[11px] bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 px-2 py-0.5 rounded">
                                  Code: {post.verificationCode}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-700 dark:text-slate-300">
                              Claimed by: <strong>{claimingNgo?.orgName || claimingNgo?.fullName || 'Verified NGO Partner'}</strong>
                            </p>
                            <button
                              onClick={() => navigate(`/track/${post._id || post.id}`)}
                              className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Truck className="w-3.5 h-3.5" /> View Delivery Tracking
                            </button>
                          </div>
                        )}

                        {/* Items breakdown if present */}
                        {post.items && post.items.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Itemized Details</span>
                            {post.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded-lg">
                                <span>{item.itemName}</span>
                                <span className="font-semibold">{item.quantity} {item.unit}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Card Bottom Actions */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-2">
                        {isEditable && (
                          <button
                            onClick={() => onEdit && onEdit(post)}
                            className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Edit className="w-3.5 h-3.5" /> Edit
                          </button>
                        )}
                        <button
                          onClick={() => handleDeletePosting(post._id)}
                          className={`${isEditable ? 'flex-1' : 'w-full'} py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-red-600 dark:text-red-300 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1`}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      ) : isOrg && showMyShortages ? (
        /* VIEW 3: INLINE NGO SHORTAGES & NEEDS VIEW */
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                <Package className="w-5 h-5 mr-2 text-amber-500" />
                My Organisation Shortages & Needs ({myNeeds.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage your posted shortage requests, track fulfillment status, or update demand.
              </p>
            </div>
            <button
              onClick={fetchMyNeeds}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400"
            >
              Refresh Shortages
            </button>
          </div>

          {loadingMyNeeds ? (
            <div className="text-center py-12 text-slate-500">Loading shortages...</div>
          ) : myNeeds.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 space-y-2">
              <Package className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
              <h4 className="font-bold text-slate-700 dark:text-slate-300">No Shortage Requests Found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">Use the "+ Post Shortage" button in the right sidebar to publish your food and ration needs.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myNeeds.map(need => (
                <div key={need._id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300">
                        {need.category || 'Food'} Deficit
                      </span>
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        need.status === 'ACTIVE' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' :
                        need.status === 'FULFILLED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' :
                        'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300'
                      }`}>
                        {need.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-base leading-snug">{need.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Needed Quantity: <strong className="text-slate-800 dark:text-slate-200">{need.quantity} {need.unit || 'servings'}</strong>
                      </p>
                    </div>

                    {need.description && (
                      <p className="text-xs italic text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                        "{need.description}"
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex gap-2">
                    {need.status === 'ACTIVE' && (
                      <button
                        onClick={async () => {
                          try {
                            await axios.patch(`${API_URL}/api/needs/${need._id}`, { status: 'FULFILLED' }, { headers: { Authorization: `Bearer ${token}` } });
                            fetchMyNeeds();
                          } catch (e) { alert('Failed to update status'); }
                        }}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                      >
                        Mark Fulfilled
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        if (!window.confirm('Delete this shortage request?')) return;
                        try {
                          await axios.delete(`${API_URL}/api/needs/${need._id}`, { headers: { Authorization: `Bearer ${token}` } });
                          fetchMyNeeds();
                        } catch (e) { alert('Failed to delete'); }
                      }}
                      className="py-2 px-3 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Regular Surplus Feed View */
        <>
          {/* Clean Header & Filters */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {user?.accountType === 'ORGANISATION' ? 'Surplus Available For You' : 'Live Surplus Food Feed'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {user?.accountType === 'ORGANISATION'
                  ? 'Claim surplus food matching your needs and arrange fast pickup.'
                  : 'Browse available food donations.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              {/* Search */}
              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search dishes or items..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none shadow-xs transition-all text-xs"
                />
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-1.5 justify-start">
                {['ALL', 'VEG', 'NON-VEG', 'RAW PRODUCE', 'BAKED GOODS'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${filter === f ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-xs shadow-xs"
              >
                <option>Expiring Soonest</option>
                <option>Recently Added</option>
                <option>Nearest Location</option>
              </select>
            </div>
          </div>
        </>
      )}

      {/* Grid of Surplus Listings — visible to NGOs and unauthenticated users only.
           Donors have their own scoped "My Postings" view (donorPostings) from /api/food/my-listings
           which is already filtered server-side by donorId, so they must NOT see this all-donors grid. */}
      {(!user || user.accountType !== 'DONOR') && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedAndFilteredListings.map((listing) => {
            const title = listing.title || 'Untitled';
            const portions = listing.quantity || 0;
            const expiry = listing.overallExpiry || listing.expiryTime;
            const match = getListingMatch(listing);

            return (
              <div
                key={listing._id}
                onClick={() => { setSelectedListing(listing); setClaimStatus('IDLE'); setClaimMessage(''); setClaimTime(''); }}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all relative flex flex-col cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-500 group"
              >
                {listing.status === 'CLAIMED' && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs z-10 flex items-center justify-center">
                    <div className="bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400 px-4 py-2 rounded-xl font-bold flex items-center text-xs">
                      <AlertCircle className="w-4 h-4 mr-1.5" /> CLAIMED
                    </div>
                  </div>
                )}
                <div className="p-5 flex flex-col flex-1 justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-base font-bold text-slate-800 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" title={title}>{title}</h3>
                      {listing.foodType === 'VEG' ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0 mt-1" title="Vegetarian"></span>
                      ) : listing.foodType === 'NON-VEG' ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 mt-1" title="Non-Vegetarian"></span>
                      ) : listing.foodType === 'RAW PRODUCE' ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0 mt-1" title="Raw Produce"></span>
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shrink-0 mt-1" title="Baked Goods"></span>
                      )}
                    </div>

                    <div className="space-y-2.5 mb-3 text-xs">
                      <div className="flex items-center text-slate-600 dark:text-slate-300">
                        <Utensils className="w-3.5 h-3.5 mr-2 text-emerald-600 shrink-0" />
                        <strong>{portions} Portions</strong>
                      </div>
                      <div className="flex items-center text-slate-600 dark:text-slate-400">
                        <MapPin className="w-3.5 h-3.5 mr-2 text-slate-400 shrink-0" />
                        <span className="line-clamp-1">{listing.pickupAddress || [listing.donorId?.address, listing.donorId?.city].filter(Boolean).join(', ') || 'Pune Location'}</span>
                      </div>
                      <div className="flex items-center text-amber-600 dark:text-amber-400 font-medium">
                        <Clock className="w-3.5 h-3.5 mr-2 shrink-0" />
                        <span>Expires: {new Date(expiry).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                    </div>

                    {/* Matched shortage pill */}
                    {match ? (
                      <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-[11px]">
                        <span className="font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center mb-0.5">
                          <Sparkles className="w-3 h-3 mr-1 text-emerald-600" />
                          Matches {match.ngoName}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400 line-clamp-1">
                          Needs: {match.quantity} {match.unit} {match.item}
                        </span>
                      </div>
                    ) : null}

                    {/* Claim / Request Pickup Button for Org accounts */}
                    {user?.accountType === 'ORGANISATION' && listing.status !== 'CLAIMED' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedListing(listing);
                          setClaimStatus('FORM');
                          setClaimMessage('');
                          setClaimTime(getDefaultPickupTime());
                        }}
                        className="w-full mt-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <Utensils className="w-3.5 h-3.5" />
                        <span>Claim / Request Pickup</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {sortedAndFilteredListings.length === 0 && (
            <div className="col-span-full text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
              <Package className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="font-bold text-sm text-slate-700 dark:text-slate-200">No surplus food available right now</p>
              <p className="text-xs mt-1">Check back soon for new food listings.</p>
            </div>
          )}
        </div>
      )}

      {/* Detailed Surplus Modal with Matched NGO Shortages */}
      {selectedListing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[60] flex justify-center items-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg relative animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-700">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 sticky top-0">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 tracking-wider block">
                  Surplus Food Details
                </span>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white line-clamp-1 pr-4">{selectedListing.title}</h3>
              </div>
              <button onClick={() => setSelectedListing(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-2xl leading-none">
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {claimStatus === 'SUCCESS' ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h4 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Claim Request Sent!</h4>
                  <p className="text-slate-500 dark:text-slate-400 mb-6 text-xs">The donor will review your request. Check your notifications for updates.</p>
                </div>
              ) : claimStatus === 'FORM' ? (
                <div className="space-y-4 animate-in fade-in">
                  <h4 className="font-bold text-base text-slate-800 dark:text-white mb-2">Request Food as Verified NGO</h4>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Message for Donor (Optional)</label>
                    <textarea
                      value={claimMessage}
                      onChange={e => setClaimMessage(e.target.value)}
                      placeholder="e.g. We will arrive in 30 mins with an insulated van..."
                      className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-600 dark:text-white text-xs"
                      rows="3"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Estimated Pickup Time
                    </label>
                    <div className="flex gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => setPresetTime(30)}
                        className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 dark:bg-slate-700 hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900/50 dark:hover:text-emerald-300 text-slate-700 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                      >
                        +30 mins
                      </button>
                      <button
                        type="button"
                        onClick={() => setPresetTime(60)}
                        className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 dark:bg-slate-700 hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900/50 dark:hover:text-emerald-300 text-slate-700 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                      >
                        +1 hour
                      </button>
                      <button
                        type="button"
                        onClick={() => setPresetTime(120)}
                        className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 dark:bg-slate-700 hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900/50 dark:hover:text-emerald-300 text-slate-700 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                      >
                        +2 hours
                      </button>
                    </div>
                    <input
                      type="time"
                      value={claimTime}
                      onChange={e => setClaimTime(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-600 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button onClick={() => handleClaim(selectedListing._id)} className="flex-1 bg-emerald-600 text-white font-bold py-2.5 rounded-xl hover:bg-emerald-700 transition-colors text-xs">
                      Submit Request
                    </button>
                    <button onClick={() => setClaimStatus('IDLE')} className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-bold py-2.5 rounded-xl transition-colors text-xs">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* SURFACED SHORTAGE CONNECTION BOX */}
                  {(() => {
                    const matches = getAllListingMatches(selectedListing);
                    if (matches.length === 0) return null;
                    return (
                      <div className="bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center">
                            <Sparkles className="w-4 h-4 mr-1.5 text-emerald-600" />
                            Connected NGO Shortages
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-700">
                            {matches.length} Matches Found
                          </span>
                        </div>

                        <div className="space-y-2">
                          {matches.slice(0, 2).map((m) => (
                            <div key={m.id || m.ngoId} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-emerald-100 dark:border-slate-700 flex justify-between items-center text-xs">
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white">{m.ngoName}</div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                  Needs: <strong className="text-emerald-600 dark:text-emerald-400">{m.quantity} {m.unit} {m.item}</strong>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedListing(null);
                                    navigate('/map', { state: { selectedNgoId: m.ngoId, selectedNgoName: m.ngoName } });
                                  }}
                                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[10px] flex items-center space-x-1 transition-colors"
                                  title="View on Logistics Map"
                                >
                                  <MapPin className="w-3 h-3" />
                                  <span>Map</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedListing(null);
                                    navigate('/requirements');
                                  }}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] flex items-center space-x-1 transition-colors"
                                  title="View Shortage Requirements"
                                >
                                  <AlertCircle className="w-3 h-3" />
                                  <span>Shortage</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Food Breakdown */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                      <Package className="w-3.5 h-3.5 mr-1.5" /> Item Breakdown
                    </h4>
                    {selectedListing.items && selectedListing.items.length > 0 ? (
                      <ul className="space-y-2">
                        {selectedListing.items.map((item, idx) => (
                          <li key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 text-xs">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{item.itemName}</span>
                            <span className="text-xs font-bold bg-white dark:bg-slate-800 px-2.5 py-1 rounded shadow-xs text-slate-700 dark:text-slate-300">
                              {item.quantity} {item.unit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="bg-slate-50 dark:bg-slate-700/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Total Portions</span>
                        <span className="float-right font-bold bg-white dark:bg-slate-800 px-2.5 py-1 rounded shadow-xs text-slate-700 dark:text-slate-300">
                          {selectedListing.quantity} Servings
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Food Images Lightbox Trigger */}
                  {selectedListing.photos && selectedListing.photos.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                        <Search className="w-3.5 h-3.5 mr-1.5" /> Attached Images
                      </h4>
                      <button
                        onClick={() => {
                          setCurrentPhotoIndex(0);
                          setIsLightboxOpen(true);
                        }}
                        className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 px-4 rounded-xl transition-colors border border-slate-200 dark:border-slate-600 flex items-center justify-center space-x-2 text-sm shadow-sm"
                      >
                        <Search className="w-4 h-4" />
                        <span>View {selectedListing.photos.length} Image{selectedListing.photos.length !== 1 ? 's' : ''}</span>
                      </button>
                    </div>
                  )}

                  {/* Donor Info */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Donor Information</h4>
                    <div className="bg-slate-50 dark:bg-slate-700/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-600 space-y-2 text-xs">
                      <p className="font-bold text-slate-800 dark:text-white">
                        {selectedListing.donorId?.orgName || selectedListing.donorId?.businessName || selectedListing.donorId?.fullName}
                      </p>
                      <div className="flex items-center text-slate-600 dark:text-slate-300">
                        <MapPin className="w-3.5 h-3.5 mr-2 text-slate-400 shrink-0" />
                        {selectedListing.pickupAddress || [selectedListing.donorId?.address, selectedListing.donorId?.city].filter(Boolean).join(', ') || 'Pune City'}
                      </div>
                      {selectedListing.donorId?.phone && (
                        <div className="flex items-center text-slate-600 dark:text-slate-300">
                          <Phone className="w-3.5 h-3.5 mr-2 text-slate-400 shrink-0" />
                          {selectedListing.donorId?.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timings */}
                  <div className="flex justify-between items-center text-xs border-t border-slate-200 dark:border-slate-700 pt-3">
                    <div className="text-slate-500 dark:text-slate-400">
                      <span className="block font-medium">Prepared</span>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold">
                        {selectedListing.preparedTime ? new Date(selectedListing.preparedTime).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : 'Recently'}
                      </span>
                    </div>
                    <div className="text-right text-amber-600 dark:text-amber-400">
                      <span className="block font-medium">Expires</span>
                      <span className="font-bold">
                        {new Date(selectedListing.overallExpiry || selectedListing.expiryTime).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar */}
            {claimStatus === 'IDLE' && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex gap-2">
                {user?.accountType === 'ORGANISATION' && selectedListing.status === 'AVAILABLE' ? (
                  <button
                    onClick={() => setClaimStatus('FORM')}
                    className="w-full bg-emerald-600 text-white font-bold py-2.5 px-4 rounded-xl hover:bg-emerald-700 transition-colors shadow-xs text-xs cursor-pointer"
                  >
                    Request Food
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedListing(null)}
                    className="w-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-bold py-2.5 px-4 rounded-xl transition-colors text-xs cursor-pointer"
                  >
                    Close
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && selectedListing?.photos && selectedListing.photos.length > 0 && (
        <div
          className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-black/95 p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="relative w-full max-w-4xl max-h-[85vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedListing.photos[currentPhotoIndex]}
              className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl border border-slate-800"
              alt={`Food ${currentPhotoIndex + 1}`}
            />

            {selectedListing.photos.length > 1 && (
              <>
                <button
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPhotoIndex((prev) => (prev === 0 ? selectedListing.photos.length - 1 : prev - 1));
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPhotoIndex((prev) => (prev === selectedListing.photos.length - 1 ? 0 : prev + 1));
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-1.5 rounded-full text-white text-xs font-bold">
                  {currentPhotoIndex + 1} / {selectedListing.photos.length}
                </div>
              </>
            )}
          </div>
          <button
            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-slate-400 hover:text-white transition-colors bg-black/50 p-2.5 rounded-full"
            onClick={() => setIsLightboxOpen(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default LiveFeed;
