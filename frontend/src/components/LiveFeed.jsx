import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, Clock, Utensils, AlertCircle, Phone, Mail, CheckCircle, Package, Search } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const LiveFeed = ({ socket, user, token }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Expiring Soonest');
  const [selectedListing, setSelectedListing] = useState(null);
  const [claimStatus, setClaimStatus] = useState('IDLE'); // 'IDLE', 'FORM', 'SUCCESS'
  const [claimMessage, setClaimMessage] = useState('');
  const [claimTime, setClaimTime] = useState('');

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

  const sortedAndFilteredListings = React.useMemo(() => {
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

  if (loading) return <div className="text-center p-8 text-slate-500">Loading live feed...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white shrink-0">Live Surplus Feed</h2>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-auto">
             <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input type="text" placeholder="Search dishes..." 
               value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
               className="pl-9 pr-4 py-2 w-full sm:w-64 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-green-500 outline-none shadow-sm transition-all text-sm" />
          </div>
          
          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-start sm:justify-center">
            {['ALL', 'VEG', 'NON-VEG', 'RAW PRODUCE', 'BAKED GOODS'].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${filter === f ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'}`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <select 
            value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-green-500 outline-none font-medium text-sm w-full sm:w-auto shadow-sm"
          >
            <option>Expiring Soonest</option>
            <option>Recently Added</option>
            <option>Nearest Location</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedAndFilteredListings.map((listing) => {
           const title = listing.title || 'Untitled';
           const portions = listing.quantity || 0;
           const expiry = listing.overallExpiry || listing.expiryTime;
           
           return (
          <div 
            key={listing._id} 
            onClick={() => { setSelectedListing(listing); setClaimStatus('IDLE'); setClaimMessage(''); setClaimTime(''); }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow relative flex flex-col cursor-pointer hover:border-green-300 dark:hover:border-green-600"
          >
            {listing.status === 'CLAIMED' && (
              <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400 px-4 py-2 rounded-lg font-bold flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" /> CLAIMED
                </div>
              </div>
            )}
            <div className="p-5 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white line-clamp-1" title={title}>{title}</h3>
                {listing.foodType === 'VEG' ? (
                   <span className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" title="Vegetarian"></span>
                ) : listing.foodType === 'NON-VEG' ? (
                   <span className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" title="Non-Vegetarian"></span>
                ) : listing.foodType === 'RAW PRODUCE' ? (
                   <span className="w-3 h-3 rounded-full bg-orange-500 flex-shrink-0" title="Raw Produce"></span>
                ) : (
                   <span className="w-3 h-3 rounded-full bg-yellow-500 flex-shrink-0" title="Baked Goods"></span>
                )}
              </div>
              <div className="space-y-3 mb-4 flex-1">
                <div className="flex items-center text-slate-600 dark:text-slate-400 text-sm">
                  <Utensils className="w-4 h-4 mr-2 flex-shrink-0" />
                  {portions} Portions
                </div>
                <div className="flex items-center text-slate-600 dark:text-slate-400 text-sm">
                  <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="line-clamp-1">{listing.pickupAddress || [listing.donorId?.address, listing.donorId?.city].filter(Boolean).join(', ') || 'Nearby Location'}</span>
                </div>
                <div className="flex items-center text-orange-600 dark:text-orange-400 text-sm font-medium">
                  <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                  {expiry ? `Expires: ${new Date(expiry).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 'Expiring soon'}
                </div>
              </div>
            </div>
          </div>
        )})}
        {sortedAndFilteredListings.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500 dark:text-slate-400">
            No active surplus food available at the moment.
          </div>
        )}
      </div>

      {/* Detailed Modal */}
      {selectedListing && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex justify-center items-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg relative animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 sticky top-0">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white line-clamp-1 pr-4">{selectedListing.title}</h3>
              <button onClick={() => setSelectedListing(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <span className="text-3xl leading-none">&times;</span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {claimStatus === 'SUCCESS' ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h4 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Claim Request Sent!</h4>
                  <p className="text-slate-500 dark:text-slate-400 mb-6">The donor will review your request. Check your notifications for updates.</p>
                </div>
              ) : claimStatus === 'FORM' ? (
                <div className="space-y-4 animate-in fade-in">
                  <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-2">Request to Claim</h4>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Message for Donor (Optional)</label>
                    <textarea 
                      value={claimMessage}
                      onChange={e => setClaimMessage(e.target.value)}
                      placeholder="e.g. We will arrive in 30 mins with a van..."
                      className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                      rows="3"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Estimated Pickup Time (Optional)</label>
                    <input 
                      type="time" 
                      value={claimTime}
                      onChange={e => setClaimTime(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button onClick={() => handleClaim(selectedListing._id)} className="flex-1 bg-green-600 text-white font-bold py-2 rounded-lg hover:bg-green-700 transition-colors">
                      Submit Request
                    </button>
                    <button onClick={() => setClaimStatus('IDLE')} className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-bold py-2 rounded-lg transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Food Breakdown */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                      <Package className="w-4 h-4 mr-2" /> Item Breakdown
                    </h4>
                    {selectedListing.items && selectedListing.items.length > 0 ? (
                      <ul className="space-y-3">
                        {selectedListing.items.map((item, idx) => (
                          <li key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/30 p-3 rounded-lg border border-slate-100 dark:border-slate-600">
                            <span className="font-medium text-slate-800 dark:text-slate-200">{item.itemName}</span>
                            <span className="text-sm font-bold bg-white dark:bg-slate-800 px-3 py-1 rounded shadow-sm text-slate-600 dark:text-slate-300">
                              {item.quantity} {item.unit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="bg-slate-50 dark:bg-slate-700/30 p-3 rounded-lg border border-slate-100 dark:border-slate-600">
                        <span className="font-medium text-slate-800 dark:text-slate-200">Total Available</span>
                        <span className="float-right text-sm font-bold bg-white dark:bg-slate-800 px-3 py-1 rounded shadow-sm text-slate-600 dark:text-slate-300">
                          {selectedListing.quantity} Servings
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Donor Info */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Donor Information</h4>
                    <div className="bg-blue-50 dark:bg-slate-700/50 p-4 rounded-lg border border-blue-100 dark:border-slate-600 space-y-3">
                      <p className="font-bold text-slate-800 dark:text-white">
                        {selectedListing.donorId?.orgName || selectedListing.donorId?.businessName || selectedListing.donorId?.fullName}
                      </p>
                      <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                        <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                        {selectedListing.pickupAddress || [selectedListing.donorId?.address, selectedListing.donorId?.city].filter(Boolean).join(', ')}
                      </div>
                      <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                        <Phone className="w-4 h-4 mr-2 text-slate-400" />
                        {selectedListing.donorId?.phone}
                      </div>
                      <div className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                        <Mail className="w-4 h-4 mr-2 text-slate-400" />
                        {selectedListing.donorId?.email}
                      </div>
                    </div>
                  </div>

                  {/* Timings */}
                  <div className="flex justify-between items-center text-sm border-t border-slate-200 dark:border-slate-700 pt-4">
                    <div className="text-slate-500 dark:text-slate-400">
                      <span className="block font-medium">Prepared</span>
                      <span className="text-slate-800 dark:text-slate-200">
                        {new Date(selectedListing.preparedTime).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    <div className="text-right text-orange-600 dark:text-orange-400">
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
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                {user?.accountType === 'ORGANISATION' && selectedListing.status === 'AVAILABLE' ? (
                  <button 
                    onClick={() => setClaimStatus('FORM')}
                    className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors shadow-sm text-lg"
                  >
                    Request Food
                  </button>
                ) : selectedListing.status !== 'AVAILABLE' ? (
                  <button disabled className="w-full bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold py-3 px-4 rounded-lg cursor-not-allowed text-lg">
                    {selectedListing.status}
                  </button>
                ) : (
                  <div className="text-center text-sm text-slate-500 dark:text-slate-400">
                    Only registered NGOs can claim food.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveFeed;
