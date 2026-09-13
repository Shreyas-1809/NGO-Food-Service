import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  MapPin,
  Clock,
  Utensils,
  AlertCircle,
  Phone,
  CheckCircle,
  Package,
  Search,
  Sparkles,
  Edit,
  Trash2,
  Truck,
  CheckCircle2,
  XCircle,
  Building2,
  Mail,
  UserCheck,
  QrCode,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EmptyState from './ui/EmptyState';
import RejectDonationModal from './RejectDonationModal';
import VolunteerAssignmentModal from './VolunteerAssignmentModal';
import DeliveryConfirmationModal from './DeliveryConfirmationModal';
import DirectContactButtons from './ui/DirectContactButtons';
// donationService mock calls removed — all data now comes from real API endpoints
import { calculateMatchScore } from '../services/matchingService';
import { calculateListingUrgency } from '../utils/urgency';
import { formatPickupTime } from '../utils/formatters';

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
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 60000); // Trigger re-render every minute for live countdowns
    return () => clearInterval(timer);
  }, []);

  // Local datetime-local helper (YYYY-MM-DDTHH:mm)
  const formatDateTimeLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const getDefaultPickupTime = () => {
    const d = new Date(Date.now() + 30 * 60 * 1000);
    return formatDateTimeLocal(d);
  };

  const getMinPickupTime = () => {
    return formatDateTimeLocal(new Date());
  };

  const [claimTime, setClaimTime] = useState(getDefaultPickupTime());
  const [claimFormError, setClaimFormError] = useState('');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [listingToReject, setListingToReject] = useState(null);

  // Donor claim status filter & Volunteer assignment modal state
  const [donorClaimStatusFilter, setDonorClaimStatusFilter] = useState('ALL');
  const [volModalOpen, setVolModalOpen] = useState(false);
  const [volModalFoodId, setVolModalFoodId] = useState(null);
  const [volModalInitialVolunteers, setVolModalInitialVolunteers] = useState([]);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [deliveryModalFood, setDeliveryModalFood] = useState(null);

  // Modal states for Claims (Donors)
  const [rejectClaimModalOpen, setRejectClaimModalOpen] = useState(false);
  const [claimToReject, setClaimToReject] = useState(null);

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
    setClaimTime(formatDateTimeLocal(d));
    if (claimFormError) setClaimFormError('');
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

      // Two-way sync notification
      const donorName = user?.orgName || user?.fullName || user?.name || 'Donor';
      fetchDonorClaims();
      fetchDonorPostings();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to accept claim');
    }
  };

  const handleDeclineClaim = async (reason, notes) => {
    if (!claimToReject) return;
    try {
      const fullReason = notes ? `${reason} - ${notes}` : reason;
      await axios.patch(`${API_URL}/api/claims/${claimToReject._id}/decline`, { reason: fullReason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Claim request declined.');
      setClaimToReject(null);
      setRejectClaimModalOpen(false);
      fetchDonorClaims();
      fetchDonorPostings();
    } catch (err) {
      console.error(err);
      throw err; // So the modal catches it
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

    const handleTaskUpdated = () => {
      fetchListings();
      if (isDonor) {
        fetchDonorClaims();
        fetchDonorPostings();
      }
    };

    if (socket && typeof socket.on === 'function') {
      socket.on('NEW_FOOD_LISTING', handleNewListing);
      socket.on('LISTING_UPDATED', handleUpdateListing);
      socket.on('TASK_UPDATED', handleTaskUpdated);
      socket.on('PICKUP_CONFIRMED', handleTaskUpdated);
      socket.on('NGO_CONFIRMED', handleTaskUpdated);
      socket.on('CLAIM_REQUEST_RECEIVED', handleClaimRequestReceived);
      socket.on('CLAIM_ACCEPTED', handleClaimAccepted);
      socket.on('CLAIM_DECLINED', handleClaimDeclined);
    }

    return () => {
      if (socket && typeof socket.off === 'function') {
        socket.off('NEW_FOOD_LISTING', handleNewListing);
        socket.off('LISTING_UPDATED', handleUpdateListing);
        socket.off('TASK_UPDATED', handleTaskUpdated);
        socket.off('PICKUP_CONFIRMED', handleTaskUpdated);
        socket.off('NGO_CONFIRMED', handleTaskUpdated);
        socket.off('CLAIM_REQUEST_RECEIVED', handleClaimRequestReceived);
        socket.off('CLAIM_ACCEPTED', handleClaimAccepted);
        socket.off('CLAIM_DECLINED', handleClaimDeclined);
      }
    };
  }, [socket, token, selectedListing, isDonor, user]);

  const handleClaim = async (id) => {
    if (user?.accountType !== 'ORGANISATION' && user?.accountType !== 'ORGANIZATION') {
      setClaimFormError('Only verified organisations can claim food.');
      return;
    }

    const trimmedMsg = (claimMessage || '').trim();
    if (trimmedMsg.length < 10) {
      setClaimFormError('Please enter a request message of at least 10 characters explaining your intent and pickup plan.');
      return;
    }

    if (!claimTime) {
      setClaimFormError('Please select an estimated pickup date and time.');
      return;
    }

    setClaimFormError('');
    const authToken = token || localStorage.getItem('token');

    try {
      const res = await axios.post(`${API_URL}/api/food/${id}/claim`, {
        message: trimmedMsg,
        requestedPickupTime: claimTime
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      setClaimStatus('SUCCESS');
      
      // Immediately remove the claimed listing from the active feed
      setListings((prev) => prev.filter(l => l._id !== id));
      setTimeout(() => setSelectedListing(null), 2000); // Close modal after 2 seconds
    } catch (err) {
      console.error('Claim submission error:', err);
      const msg = err.response?.data?.message || 'Failed to submit claim. Please try again.';
      setClaimFormError(msg);
    }
  };

  // Fetch real needs from backend for match scoring
  const [activeNeeds, setActiveNeeds] = useState([]);
  useEffect(() => {
    axios.get(`${API_URL}/api/needs`)
      .then(res => setActiveNeeds(res.data || []))
      .catch(() => {}); // Silently fail — match badges are non-critical
  }, []);

  // Keep a memoized normalized list for scoring
  const storedRequests = useMemo(() => activeNeeds.map(n => ({
    id: n._id,
    ngoId: n.ngoId,
    item: n.title,
    category: n.category || 'Food',
    quantity: n.quantity,
    unit: n.unit || 'servings',
    urgency: n.urgency
  })), [activeNeeds]);

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
        const uA = calculateListingUrgency(a);
        const uB = calculateListingUrgency(b);
        const tA = uA.earliestDeadline ? new Date(uA.earliestDeadline).getTime() : Infinity;
        const tB = uB.earliestDeadline ? new Date(uB.earliestDeadline).getTime() : Infinity;
        return tA - tB;
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                <Package className="w-5 h-5 mr-2 text-emerald-600" />
                NGO Claim Requests ({donorClaims.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Review and manage incoming claim requests from verified NGOs.
              </p>
            </div>
            <button
              onClick={fetchDonorClaims}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              Refresh Requests
            </button>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 w-fit text-xs font-bold">
            {[
              { id: 'ALL', label: `All (${donorClaims.length})` },
              { id: 'PENDING', label: `Pending (${donorClaims.filter(c => c.status === 'PENDING').length})` },
              { id: 'ACCEPTED', label: `Accepted (${donorClaims.filter(c => c.status === 'ACCEPTED').length})` },
              { id: 'REJECTED', label: `Rejected (${donorClaims.filter(c => c.status === 'DECLINED' || c.status === 'REJECTED').length})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setDonorClaimStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  donorClaimStatusFilter === tab.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loadingDonorClaims ? (
            <div className="text-center py-12 text-slate-500">Loading claim requests...</div>
          ) : (() => {
            const filteredDonorClaims = donorClaims.filter((claim) => {
              if (donorClaimStatusFilter === 'ALL') return true;
              if (donorClaimStatusFilter === 'PENDING') return claim.status === 'PENDING';
              if (donorClaimStatusFilter === 'ACCEPTED') return claim.status === 'ACCEPTED';
              if (donorClaimStatusFilter === 'REJECTED') return claim.status === 'DECLINED' || claim.status === 'REJECTED';
              return true;
            });

            if (filteredDonorClaims.length === 0) {
              return (
                <EmptyState
                  icon={AlertCircle}
                  message="No Matching Claim Requests"
                  description={donorClaimStatusFilter === 'ALL'
                    ? "When verified NGOs request to claim your surplus food listings, their requests will appear here for your direct review."
                    : `No claim requests with status "${donorClaimStatusFilter.toLowerCase()}" were found.`
                  }
                />
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDonorClaims.map((claim) => {
                  const cleanMsg = (() => {
                    const msg = claim.message;
                    if (!msg || !msg.trim()) return 'No message provided';
                    if (msg.includes('requested to claim')) {
                      const match = msg.match(/"([^"]+)"\s*$/);
                      if (match && match[1]) return `"${match[1]}"`;
                      return 'No message provided';
                    }
                    return `"${msg}"`;
                  })();

                  const vols = claim.foodId?.volunteerAssignments || (claim.foodId?.volunteerAssignment?.name ? [claim.foodId.volunteerAssignment] : []);

                  return (
                    <div key={claim._id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                            NGO Request
                          </span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            claim.status === 'ACCEPTED' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' :
                            claim.status === 'DECLINED' || claim.status === 'REJECTED' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400' :
                            'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
                          }`}>
                            {claim.status}
                          </span>
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="font-bold text-slate-900 dark:text-white text-base">
                              {claim.ngoId?.orgName || claim.ngoId?.fullName || 'Verified NGO'}
                            </h4>
                            <DirectContactButtons
                              phone={claim.ngoId?.phone}
                              email={claim.ngoId?.email}
                              name={claim.ngoId?.orgName || claim.ngoId?.fullName || 'NGO'}
                              waMessage={`Hello ${claim.ngoId?.orgName || 'NGO Partner'}, contacting you regarding your request for "${claim.foodId?.title || 'Surplus Listing'}".`}
                              emailSubject={`FoodBridge Request Coordination: ${claim.foodId?.title || 'Food Donation'}`}
                              size="xs"
                            />
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Requesting: <strong className="text-slate-800 dark:text-slate-200">{claim.foodId?.title || 'Surplus Listing'}</strong> ({claim.foodId?.quantity || 0} servings)
                          </p>
                        </div>

                        {/* Request Message Box */}
                        <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                          <span className="font-bold text-[10px] uppercase text-slate-400 block">Request Message / Intent</span>
                          <p className="italic">{cleanMsg}</p>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 gap-2 text-xs text-slate-500 dark:text-slate-400">
                          {claim.requestedPickupTime && (
                            <div className="flex items-center text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-100 dark:border-emerald-800 font-semibold">
                              <Clock className="w-3.5 h-3.5 mr-1.5 text-emerald-600 shrink-0" />
                              <span>Requested Pickup: <strong>{formatPickupTime(claim.requestedPickupTime)}</strong></span>
                            </div>
                          )}
                          <div className="flex items-center pt-1">
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
                            onClick={() => {
                              setClaimToReject(claim);
                              setRejectClaimModalOpen(true);
                            }}
                            className="flex-1 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-400 font-bold rounded-xl text-xs transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      ) : claim.status === 'ACCEPTED' ? (
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-700 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">✓ Accepted Request</span>
                            <button
                              onClick={() => {
                                const fId = claim.foodId?._id || claim.foodId;
                                setVolModalFoodId(fId);
                                setVolModalInitialVolunteers(vols);
                                setVolModalOpen(true);
                              }}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                            >
                              {vols.length > 0 ? 'Edit Volunteers' : 'Arrange Pickup'}
                            </button>
                          </div>
                          {vols.length > 0 ? (
                            <div className="space-y-2 text-xs bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                              {vols.map((v, idx) => (
                                <div key={idx} className="flex flex-wrap items-center justify-between gap-1.5 py-1 border-b border-slate-200/50 dark:border-slate-700/50 last:border-none">
                                  <div>
                                    <strong className="text-slate-900 dark:text-white">Volunteer #{idx + 1}:</strong> {v.name}
                                    {v.vehicleNumber ? ` (${v.vehicleNumber})` : ''}
                                    {v.phone && <span className="text-slate-500 dark:text-slate-400 block text-[11px]">{v.phone}</span>}
                                  </div>
                                  <DirectContactButtons
                                    phone={v.phone}
                                    name={v.name}
                                    waMessage={`Hello ${v.name}, contacting you regarding pickup for "${claim.foodId?.title || 'Food Donation'}".`}
                                    size="xs"
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500 italic bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700 text-center">
                              Volunteer not yet assigned
                            </div>
                          )}

                          {/* Volunteer Status Indicator / Decline Alert */}
                          {claim.foodId?.volunteerStatus === 'declined' ? (
                            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                  Volunteer Declined Task
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const fId = claim.foodId?._id || claim.foodId;
                                    setVolModalFoodId(fId);
                                    setVolModalInitialVolunteers(vols);
                                    setVolModalOpen(true);
                                  }}
                                  className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold transition-colors shadow-xs cursor-pointer"
                                >
                                  Reassign Volunteer
                                </button>
                              </div>
                              {claim.foodId?.volunteerDeclineReason && (
                                <p className="text-[11px] text-rose-600 dark:text-rose-300 italic">
                                  Reason: "{claim.foodId.volunteerDeclineReason}"
                                </p>
                              )}
                            </div>
                          ) : claim.foodId?.volunteerStatus === 'accepted' ? (
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Volunteer Accepted & En Route</span>
                            </div>
                          ) : vols.length > 0 && claim.foodId?.volunteerStatus === 'pending' ? (
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>Awaiting Volunteer Response</span>
                            </div>
                          ) : null}

                          {/* Live Status indicator & Confirm Delivery Link */}
                          {(claim.foodId?.status === 'IN_TRANSIT' || claim.foodId?.status === 'picked_up') ? (
                            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                                  <Truck className="w-3.5 h-3.5 text-amber-600" /> Food En Route
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeliveryModalFood(claim.foodId);
                                    setDeliveryModalOpen(true);
                                  }}
                                  className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 shadow-xs"
                                >
                                  <QrCode className="w-3 h-3" />
                                  <span>Delivery Link & QR</span>
                                </button>
                              </div>
                              <p className="text-[10px] text-amber-700 dark:text-amber-300/80">
                                Donor confirmed food handover. Share or open the delivery confirmation link once the volunteer reaches the drop-off location.
                              </p>
                            </div>
                          ) : (claim.foodId?.status === 'COMPLETED' || claim.foodId?.status === 'delivered') ? (
                            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Food Delivered & Verified ✓</span>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-700 text-xs font-semibold text-center text-slate-500">
                          Decline Processed
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      ) : isDonor && showMyUploads ? (
        /* VIEW 2: INLINE DONOR POSTINGS & UPLOADS VIEW */
        <div className="space-y-6">
          {/* Header & Status Filter Tabs Bar */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                <Package className="w-5 h-5 mr-2 text-emerald-600" />
                My Active Listings ({donorPostings.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage your posted surplus listings, edit postings within the 12-hour window, or track their statuses.
              </p>
            </div>

            {/* Filter Tabs with Counts */}
            {(() => {
              const counts = {
                ALL: donorPostings.length,
                ACTIVE: 0,
                RESERVED: 0,
                COLLECTED: 0,
                EXPIRED: 0,
                CANCELLED: 0
              };

              donorPostings.forEach(p => {
                if (p.computedStatus === 'ACTIVE') counts.ACTIVE++;
                else if (p.computedStatus === 'ACCEPTED') counts.RESERVED++;
                else if (p.computedStatus === 'COMPLETED') counts.COLLECTED++;
                else if (p.computedStatus === 'NON_CLAIMED') counts.EXPIRED++;
                else if (p.computedStatus === 'REJECTED') counts.CANCELLED++;
              });

              return (
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 w-full md:w-auto overflow-x-auto gap-1">
                  {[
                    { key: 'ALL', label: 'All', count: counts.ALL },
                    { key: 'ACTIVE', label: 'Active', count: counts.ACTIVE },
                    { key: 'RESERVED', label: 'Reserved', count: counts.RESERVED },
                    { key: 'COLLECTED', label: 'Collected', count: counts.COLLECTED },
                    { key: 'EXPIRED', label: 'Expired', count: counts.EXPIRED },
                    { key: 'CANCELLED', label: 'Cancelled', count: counts.CANCELLED }
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
            const filteredPostings = donorPostings.filter(post => {
              if (donorPostingsTab === 'ALL') return true;
              if (donorPostingsTab === 'ACTIVE') return post.computedStatus === 'ACTIVE';
              if (donorPostingsTab === 'RESERVED') return post.computedStatus === 'ACCEPTED';
              if (donorPostingsTab === 'COLLECTED') return post.computedStatus === 'COMPLETED';
              if (donorPostingsTab === 'EXPIRED') return post.computedStatus === 'NON_CLAIMED';
              if (donorPostingsTab === 'CANCELLED') return post.computedStatus === 'REJECTED';
              return true;
            });

            if (loadingDonorPostings) {
              return <div className="text-center py-12 text-slate-500">Loading your food postings...</div>;
            }

            if (filteredPostings.length === 0) {
              return (
                <EmptyState
                  icon={Package}
                  message="No Postings Found"
                  description={
                    donorPostingsTab === 'ALL'
                      ? 'You have not uploaded any surplus food listings yet.'
                      : `No postings currently under "${donorPostingsTab}" status.`
                  }
                  action={donorPostingsTab === 'ALL' ? (
                      <button
                        onClick={() => {
                          if (onEdit) onEdit({ isNewPostSignal: true });
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
                      >
                        Post a Surplus
                      </button>
                    ) : null}
                />
              );
            }

            const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

            const handleCancelListing = async (id, isReserved) => {
              if (isReserved) {
                if (!window.confirm('An NGO has already claimed this listing. Are you sure you want to cancel it?')) return;
              } else {
                if (!window.confirm('Are you sure you want to cancel this listing?')) return;
              }
              try {
                await axios.patch(`${API_URL}/api/food/${id}/cancel`, {}, { headers: { Authorization: `Bearer ${token}` } });
                fetchDonorPostings();
              } catch (e) {
                alert('Failed to cancel listing');
              }
            };

            const handleMarkCollected = async (id) => {
              try {
                await axios.patch(`${API_URL}/api/food/${id}/collected`, {}, { headers: { Authorization: `Bearer ${token}` } });
                fetchDonorPostings();
              } catch (e) {
                alert('Failed to mark collected');
              }
            };

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPostings.map(post => {
                  const isEditable = (Date.now() - new Date(post.createdAt).getTime()) <= TWELVE_HOURS_MS;
                  
                  let statusLabel = 'ACTIVE';
                  let statusBadgeClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';

                  if (post.computedStatus === 'ACCEPTED') {
                    statusLabel = 'RESERVED';
                    statusBadgeClass = 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800';
                  } else if (post.computedStatus === 'COMPLETED') {
                    statusLabel = 'COLLECTED';
                    statusBadgeClass = 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200 dark:border-purple-800';
                  } else if (post.computedStatus === 'REJECTED') {
                    statusLabel = 'CANCELLED';
                    statusBadgeClass = 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 border-rose-200 dark:border-rose-800';
                  } else if (post.computedStatus === 'NON_CLAIMED') {
                    statusLabel = 'EXPIRED';
                    statusBadgeClass = 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600';
                  }

                  const isReserved = post.computedStatus === 'ACCEPTED';
                  const isExpired = post.computedStatus === 'NON_CLAIMED';
                  const isCancelled = post.computedStatus === 'REJECTED';
                  const isCollected = post.computedStatus === 'COMPLETED';
                  const isActive = post.computedStatus === 'ACTIVE';
                  const urgency = calculateListingUrgency(post);

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
                        
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Posted: {new Date(post.createdAt).toLocaleDateString()}
                        </div>

                        {urgency.level !== 'EXPIRED' && isActive && (
                          <div className="pt-1">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold ${
                              urgency.level === 'HIGH' ? 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-900/50' :
                              urgency.level === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/50' :
                              'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                            }`}>
                              <Clock className="w-3.5 h-3.5" />
                              {urgency.text}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap gap-2">
                        {isActive && (
                          <>
                            <button
                              onClick={() => onEdit && onEdit(post)}
                              className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                            >
                              <Edit className="w-3.5 h-3.5" /> Edit Listing
                            </button>
                            <button
                              onClick={() => handleCancelListing(post._id, false)}
                              className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-red-600 dark:text-red-300 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Cancel
                            </button>
                          </>
                        )}

                        {isReserved && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedListing(post);
                                setIsLightboxOpen(true);
                              }}
                              className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                            >
                              <Search className="w-3.5 h-3.5" /> View Details
                            </button>
                            <button
                              onClick={() => handleMarkCollected(post._id)}
                              className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Mark Collected
                            </button>
                            <button
                              onClick={() => handleCancelListing(post._id, true)}
                              className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-red-600 dark:text-red-300 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Cancel
                            </button>
                          </>
                        )}

                        {isExpired && (
                          <button
                            onClick={() => onEdit && onEdit({ ...post, _id: undefined, isRepost: true })}
                            className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Package className="w-3.5 h-3.5" /> Repost
                          </button>
                        )}

                        {(isCancelled || isCollected) && (
                          <button
                            onClick={() => {
                              setSelectedListing(post);
                              setIsLightboxOpen(true);
                            }}
                            className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Search className="w-3.5 h-3.5" /> View Details
                          </button>
                        )}
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
            <EmptyState
              icon={Package}
              message="No Shortage Requests Found"
              description='Use the "+ Post Shortage" button in the right sidebar to publish your food and ration needs.'
            />
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
      {(!user || (user.accountType !== 'DONOR' && !showMyShortages)) && (
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
                      {(() => {
                        const urgency = calculateListingUrgency(listing);
                        if (urgency.level === 'EXPIRED') {
                          return (
                            <div className="flex items-center text-slate-500 dark:text-slate-500 font-medium">
                              <Clock className="w-3.5 h-3.5 mr-2 shrink-0" />
                              <span>Expired</span>
                            </div>
                          );
                        }
                        return (
                          <div className="pt-0.5">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-bold ${
                              urgency.level === 'HIGH' ? 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-900/50' :
                              urgency.level === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/50' :
                              'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50'
                            }`}>
                              <Clock className="w-3.5 h-3.5" />
                              {urgency.text}
                            </span>
                          </div>
                        );
                      })()}
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

                    {/* Accept and Reject Buttons for Org accounts */}
                    {user?.accountType === 'ORGANISATION' && listing.status !== 'CLAIMED' && (
                      <div className="w-full mt-3 flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setListingToReject(listing);
                            setRejectModalOpen(true);
                          }}
                          className="flex-1 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject Donation</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedListing(listing);
                            setClaimStatus('FORM');
                            setClaimMessage('');
                            setClaimTime(getDefaultPickupTime());
                          }}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                        >
                          <Utensils className="w-3.5 h-3.5" />
                          <span>Send Claim Request</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {sortedAndFilteredListings.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={Package}
                message="No surplus food available right now"
                description="Check back soon for new food listings."
              />
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
                  <h4 className="font-bold text-base text-slate-800 dark:text-white mb-1">Request Food as Verified NGO</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Coordinate your pickup time and state your intent so the donor can review and accept.
                  </p>

                  {claimFormError && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                      <span>{claimFormError}</span>
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Request Message / Intent <span className="text-red-500">*</span>
                      </label>
                      <span className={`text-[10px] font-bold ${claimMessage.trim().length < 10 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {claimMessage.trim().length}/10 chars min
                      </span>
                    </div>
                    <textarea
                      value={claimMessage}
                      onChange={e => {
                        setClaimMessage(e.target.value);
                        if (claimFormError) setClaimFormError('');
                      }}
                      placeholder="e.g. We will arrive with an insulated van at 2:30 PM to collect and distribute to 50 families at our shelter."
                      className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-600 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                      rows="3"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Estimated Pickup Date & Time <span className="text-red-500">*</span>
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
                      type="datetime-local"
                      min={getMinPickupTime()}
                      value={claimTime}
                      onChange={e => {
                        setClaimTime(e.target.value);
                        if (claimFormError) setClaimFormError('');
                      }}
                      className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-600 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button onClick={() => handleClaim(selectedListing._id)} className="flex-1 bg-emerald-600 text-white font-bold py-2.5 rounded-xl hover:bg-emerald-700 transition-colors text-xs cursor-pointer shadow-xs">
                      Submit Request
                    </button>
                    <button onClick={() => setClaimStatus('IDLE')} className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-bold py-2.5 rounded-xl transition-colors text-xs cursor-pointer">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
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
                        className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 px-4 rounded-xl transition-colors border border-slate-200 dark:border-slate-600 flex items-center justify-center space-x-2 text-sm shadow-sm cursor-pointer"
                      >
                        <Search className="w-4 h-4" />
                        <span>View {selectedListing.photos.length} Image{selectedListing.photos.length !== 1 ? 's' : ''}</span>
                      </button>
                    </div>
                  )}

                  {/* Donor Info */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                      <Building2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Donor Information
                    </h4>
                    {(() => {
                      const donor = (typeof selectedListing.donorId === 'object' && selectedListing.donorId !== null) ? selectedListing.donorId : {};
                      const displayName = donor.businessName || donor.orgName || donor.fullName || 'Not provided';
                      const address = selectedListing.pickupAddress || [donor.address, donor.city].filter(Boolean).join(', ') || 'Not provided';
                      const phone = donor.phone || 'Not provided';
                      const email = donor.email || donor.businessDetails?.shopEmail || 'Not provided';

                      return (
                        <div className="bg-slate-50 dark:bg-slate-700/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-600 space-y-2.5 text-xs">
                          <div className="flex items-center text-slate-800 dark:text-white font-bold">
                            <Building2 className="w-3.5 h-3.5 mr-2 text-emerald-600 shrink-0" />
                            <span>Name: {displayName}</span>
                          </div>
                          <div className="flex items-center text-slate-600 dark:text-slate-300">
                            <MapPin className="w-3.5 h-3.5 mr-2 text-slate-400 shrink-0" />
                            <span>Address: {address}</span>
                          </div>
                          
                          {/* Contact Actions for NGO -> Donor */}
                          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-600/60 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <div className="flex items-center text-slate-600 dark:text-slate-300">
                                <Phone className="w-3.5 h-3.5 mr-2 text-slate-400 shrink-0" />
                                <span>Phone: {phone}</span>
                              </div>
                              {phone !== 'Not provided' && (
                                <DirectContactButtons
                                  phone={phone}
                                  email={email !== 'Not provided' ? email : null}
                                  name={displayName}
                                  waMessage={`Hello ${displayName}, I am contacting you regarding your donation "${selectedListing.title}" on FoodBridge.`}
                                  emailSubject={`FoodBridge Surplus Inquiry: ${selectedListing.title}`}
                                  size="xs"
                                />
                              )}
                            </div>
                            {email !== 'Not provided' && (
                              <div className="flex items-center text-slate-600 dark:text-slate-300 text-[11px]">
                                <Mail className="w-3.5 h-3.5 mr-2 text-slate-400 shrink-0" />
                                <span>Email: {email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
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
                  <>
                    <button
                      onClick={() => {
                        setListingToReject(selectedListing);
                        setRejectModalOpen(true);
                      }}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 font-bold py-2.5 px-4 rounded-xl transition-colors shadow-xs text-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject Donation
                    </button>
                    <button
                      onClick={() => {
                        setClaimStatus('FORM');
                        setClaimMessage('');
                        setClaimTime(getDefaultPickupTime());
                        setClaimFormError('');
                      }}
                      className="flex-1 bg-emerald-600 text-white font-bold py-2.5 px-4 rounded-xl hover:bg-emerald-700 transition-colors shadow-xs text-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Utensils className="w-4 h-4" />
                      Send Claim Request
                    </button>
                  </>
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

      {/* Reject Donation Modal */}
      <RejectDonationModal
        isOpen={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setListingToReject(null);
        }}
        donation={listingToReject}
        token={token}
        onSuccess={() => {}}
      />

      {/* Reject Claim Modal (For Donors) */}
      <RejectDonationModal
        isOpen={rejectClaimModalOpen}
        onClose={() => {
          setRejectClaimModalOpen(false);
          setClaimToReject(null);
        }}
        donation={{ _id: claimToReject?.foodId?._id || 'temp' }}
        token={token}
        onSubmit={handleDeclineClaim}
      />

      {/* Volunteer Assignment Modal */}
      <VolunteerAssignmentModal
        isOpen={volModalOpen}
        onClose={() => setVolModalOpen(false)}
        foodId={volModalFoodId}
        initialVolunteers={volModalInitialVolunteers}
        token={token}
        onSuccess={() => {
          if (fetchDonorClaims) fetchDonorClaims();
        }}
      />

      {/* NGO Delivery Confirmation Link & QR Modal */}
      <DeliveryConfirmationModal
        isOpen={deliveryModalOpen}
        onClose={() => {
          setDeliveryModalOpen(false);
          setDeliveryModalFood(null);
        }}
        food={deliveryModalFood}
      />
    </div>
  );
};

export default LiveFeed;
