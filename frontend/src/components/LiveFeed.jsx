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
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WorkflowNav from './WorkflowNav';
import { getStoredRequests } from '../services/donationService';
import { calculateMatchScore } from '../services/matchingService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const LiveFeed = ({ socket, user, token }) => {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Expiring Soonest');
  const [selectedListing, setSelectedListing] = useState(null);
  const [claimStatus, setClaimStatus] = useState('IDLE'); // 'IDLE', 'FORM', 'SUCCESS'
  const [claimMessage, setClaimMessage] = useState('');
  const [claimTime, setClaimTime] = useState('');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/food`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setListings(res.data);
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
    };

    socket.on('NEW_FOOD_LISTING', handleNewListing);
    socket.on('LISTING_UPDATED', handleUpdateListing);

    return () => {
      socket.off('NEW_FOOD_LISTING', handleNewListing);
      socket.off('LISTING_UPDATED', handleUpdateListing);
    };
  }, [socket, token, selectedListing]);

  const handleClaim = async (id) => {
    if (user?.accountType !== 'ORGANISATION') return alert('Only organisations can claim food');
    try {
      const res = await axios.post(`${API_URL}/api/food/${id}/claim`, {
        message: claimMessage,
        requestedPickupTime: claimTime
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClaimStatus('SUCCESS');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to claim');
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
        const distA = Math.pow(a.location.coordinates[0] - 77.59, 2) + Math.pow(a.location.coordinates[1] - 12.97, 2);
        const distB = Math.pow(b.location.coordinates[0] - 77.59, 2) + Math.pow(b.location.coordinates[1] - 12.97, 2);
        return distA - distB;
      });
    }

    return result;
  }, [listings, filter, searchQuery, sortBy]);

  if (loading) return <div className="text-center p-8 text-slate-500 dark:text-slate-400">Loading live feed...</div>;

  return (
    <div className="space-y-6">
      {/* Clean Header & Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {user?.accountType === 'ORGANISATION' ? 'Surplus Available For You' : 'Live Surplus Food Feed'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {user?.accountType === 'ORGANISATION'
              ? 'Claim surplus food matching your needs and arrange fast pickup.'
              : 'Browse available food donations or match with real-time NGO shortage demands.'}
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

      {/* Grid of Surplus Listings */}
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
                      {expiry ? `Expires: ${new Date(expiry).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Expiring soon'}
                    </div>
                  </div>
                </div>

                {/* Match Indicator / Actions */}
                <div className="space-y-2 pt-1">
                  {/* Surfaced Shortage Match Banner */}
                  {match ? (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/map', { state: { selectedNgoId: match.ngoId, selectedNgoName: match.ngoName } });
                      }}
                      className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/80 text-[11px] flex items-center justify-between hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
                      title="Click to view NGO location on Map"
                    >
                      <div className="flex items-center text-emerald-800 dark:text-emerald-300 font-bold truncate mr-1.5">
                        <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
                        <span className="truncate">Matches Shortage at {match.ngoName}</span>
                      </div>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-600 text-white shrink-0 shadow-xs">
                        {match.score}%
                      </span>
                    </div>
                  ) : (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/requirements');
                      }}
                      className="p-2.5 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] flex items-center justify-between text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center">
                        <AlertCircle className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        Check NGO Requirements
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Claim / Request Pickup Button for Org accounts */}
                  {user?.accountType === 'ORGANISATION' && listing.status !== 'CLAIMED' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedListing(listing);
                        setClaimStatus('FORM');
                        setClaimMessage('');
                        setClaimTime('');
                      }}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Utensils className="w-3.5 h-3.5" />
                      <span>Claim / Request Pickup</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {sortedAndFilteredListings.length === 0 && (
          <div className="col-span-full text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
            <Package className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="font-bold text-sm text-slate-700 dark:text-slate-200">No surplus food available right now</p>
            <p className="text-xs mt-1">Check back soon or explore NGO shortages to donate directly.</p>
          </div>
        )}
      </div>

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
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Estimated Pickup Time (Optional)</label>
                    <input
                      type="time"
                      value={claimTime}
                      onChange={e => setClaimTime(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl dark:bg-slate-800 dark:border-slate-600 dark:text-white text-xs"
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
                <button
                  onClick={() => {
                    const match = getListingMatch(selectedListing);
                    setSelectedListing(null);
                    if (match) {
                      navigate('/map', { state: { selectedNgoId: match.ngoId, selectedNgoName: match.ngoName } });
                    } else {
                      navigate('/map');
                    }
                  }}
                  className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>View on Map</span>
                </button>

                {user?.accountType === 'ORGANISATION' && selectedListing.status === 'AVAILABLE' ? (
                  <button
                    onClick={() => setClaimStatus('FORM')}
                    className="flex-1 bg-emerald-600 text-white font-bold py-2.5 px-4 rounded-xl hover:bg-emerald-700 transition-colors shadow-xs text-xs"
                  >
                    Request Food
                  </button>
                ) : selectedListing.status !== 'AVAILABLE' ? (
                  <button disabled className="flex-1 bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold py-2.5 px-4 rounded-xl cursor-not-allowed text-xs">
                    {selectedListing.status}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedListing(null);
                      navigate('/requirements');
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors shadow-xs text-xs flex items-center justify-center space-x-1"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>See All Shortages</span>
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
