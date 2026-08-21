import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { MOCK_NGOS } from '../services/mockData';
import { getStoredRequests } from '../services/donationService';
import MapView from './MapView';
import LocationSearch from './LocationSearch';
import {
  Filter,
  MapPin,
  ShieldCheck,
  ArrowRight,
  Crosshair,
  Check,
  Package,
  AlertCircle,
  Sparkles,
  Building2,
  Phone,
  CheckCircle2,
  Clock,
  MessageSquare
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import ContactNgoModal from './ContactNgoModal';
import RedirectSurplusModal from './RedirectSurplusModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MapPage = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [contactNgo, setContactNgo] = useState(null);
  const [redirectNgo, setRedirectNgo] = useState(null);

  const [ngos, setNgos] = useState(MOCK_NGOS);
  const [selectedNgo, setSelectedNgo] = useState(MOCK_NGOS[0]);
  const [userLocation, setUserLocation] = useState({ lat: 18.5204, lng: 73.8567 }); // Pune center default

  const isOrg = user?.accountType === 'ORGANISATION' || 
                user?.accountType === 'ORGANIZATION' || 
                user?.role === 'ORGANISATION' || 
                user?.role === 'ORGANIZATION' || 
                Boolean(user?.orgName);

  // Donor-specific: Tab to focus on NGOs requesting donor surplus
  const [donorFilterTab, setDonorFilterTab] = useState('ALL'); // 'WANTS_SURPLUS' or 'ALL'
  const [donorClaims, setDonorClaims] = useState([]);
  const [donorFoodListings, setDonorFoodListings] = useState([]);
  const [acceptingClaimId, setAcceptingClaimId] = useState(null);

  // Identify the logged-in org's NGO hub by matching name
  const orgName = user?.orgName || user?.name || user?.fullName;
  const orgNgo = isOrg
    ? MOCK_NGOS.find(n => n.name === orgName) || null
    : null;
  const orgNgoId = orgNgo?.id || null;

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [maxDistance, setMaxDistance] = useState(25);
  const [selectedUrgency, setSelectedUrgency] = useState('ALL');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Fetch Donor's real claims and surplus food
  const fetchDonorSurplusAndClaims = async () => {
    if (isOrg || !user?.id || !token) return;
    try {
      // 1. Fetch donor's food listings
      const foodRes = await axios.get(`${API_URL}/api/food/my-listings`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => ({ data: [] }));
      setDonorFoodListings(foodRes.data || []);

      // 2. Fetch notifications to get incoming CLAIM_REQUESTs
      const notifRes = await axios.get(`${API_URL}/api/notifications/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => ({ data: [] }));

      const claimNotifs = (notifRes.data || []).filter(n => n.type === 'CLAIM_REQUEST' && n.relatedClaimId);
      
      const claimsList = [];
      for (const notif of claimNotifs) {
        try {
          const claimRes = await axios.get(`${API_URL}/api/claims/${notif.relatedClaimId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (claimRes.data) {
            claimsList.push({
              ...claimRes.data,
              notificationId: notif._id,
              notificationRead: notif.read
            });
          }
        } catch (e) {
          // ignore error fetching single claim
        }
      }
      setDonorClaims(claimsList);

      // If donor has incoming claims, default tab to 'WANTS_SURPLUS' so they see them immediately!
      if (claimsList.length > 0) {
        setDonorFilterTab('WANTS_SURPLUS');
      }
    } catch (err) {
      console.error('Error loading donor claims for map:', err);
    }
  };

  useEffect(() => {
    fetchDonorSurplusAndClaims();
  }, [user, token, isOrg]);

  // Combine Mock NGOs with real Claiming NGOs
  const enrichedNgos = useMemo(() => {
    const list = [...MOCK_NGOS];

    // Mark/Inject NGOs that requested the donor's surplus
    donorClaims.forEach(claim => {
      const ngoData = claim.ngoId;
      if (!ngoData) return;

      const existingIndex = list.findIndex(n => n.name === (ngoData.orgName || ngoData.fullName));
      const claimInfo = {
        claimId: claim._id,
        foodTitle: claim.foodId?.title || 'Surplus Food Batch',
        foodQuantity: claim.foodId?.quantity,
        status: claim.status, // 'PENDING', 'ACCEPTED', etc.
        message: claim.message,
        requestedPickupTime: claim.requestedPickupTime,
        isRealClaim: true
      };

      if (existingIndex >= 0) {
        list[existingIndex] = {
          ...list[existingIndex],
          wantsSurplus: true,
          claimInfo
        };
      } else {
        // Insert new NGO entry for the requesting organization
        list.unshift({
          id: ngoData._id || `ngo-claim-${claim._id}`,
          name: ngoData.orgName || ngoData.fullName || 'Partner Organisation',
          category: 'NGO / Food Relief',
          verified: true,
          addressVerified: true,
          description: `Active organization requesting your surplus: ${claim.foodId?.title || ''}`,
          areasOfSupport: ['Food Rescue', 'Direct Feeding'],
          beneficiariesCount: '200+',
          pastDonationsCount: '35+',
          impactScore: '98%',
          distanceKm: 3.5,
          location: ngoData.location?.coordinates
            ? { lat: ngoData.location.coordinates[1], lng: ngoData.location.coordinates[0] }
            : { lat: 18.5304, lng: 73.8467 },
          address: ngoData.address || `${ngoData.city || 'Pune Hub'}`,
          phone: ngoData.phone || '+91 98220 11223',
          email: ngoData.email || 'contact@ngo.org',
          currentRequirements: [],
          wantsSurplus: true,
          claimInfo
        });
      }
    });

    // Also match donor surplus items with registered shortage requirements
    if (!isOrg && donorFoodListings.length > 0) {
      const storedReqs = getStoredRequests();
      donorFoodListings.forEach(food => {
        const title = (food.title || '').toLowerCase();
        storedReqs.forEach(req => {
          const item = (req.item || '').toLowerCase();
          if (title.includes(item) || item.includes(title)) {
            const matchIndex = list.findIndex(n => n.name === req.ngoName);
            if (matchIndex >= 0 && !list[matchIndex].claimInfo) {
              list[matchIndex] = {
                ...list[matchIndex],
                wantsSurplus: true,
                matchingShortage: req
              };
            }
          }
        });
      });
    }

    return list;
  }, [donorClaims, donorFoodListings, isOrg]);

  useEffect(() => {
    setNgos(enrichedNgos);
  }, [enrichedNgos]);

  // Auto-focus NGO if passed through router state from LiveFeed or NGORequirementsPage
  useEffect(() => {
    if (location.state?.selectedNgoId) {
      const match = ngos.find(n => n.id === location.state.selectedNgoId || n.name === location.state.selectedNgoName);
      if (match) {
        setSelectedNgo(match);
      }
    }
  }, [location.state, ngos]);

  const handleSelectLocation = (loc) => {
    setUserLocation({ lat: loc.lat, lng: loc.lng });
  };

  const handleUseCurrentLocation = (loc) => {
    setUserLocation({ lat: loc.lat, lng: loc.lng });
  };

  // Donor 1-click Accept Claim directly from the map
  const handleAcceptClaim = async (claimId) => {
    if (!claimId) return;
    setAcceptingClaimId(claimId);
    try {
      await axios.patch(`${API_URL}/api/claims/${claimId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh donor claims
      await fetchDonorSurplusAndClaims();
    } catch (err) {
      console.error('Error accepting claim on map:', err);
      alert(err.response?.data?.message || 'Failed to accept claim');
    } finally {
      setAcceptingClaimId(null);
    }
  };

  // Filter logic
  const filteredNgos = ngos.filter((ngo) => {
    if (!isOrg && donorFilterTab === 'WANTS_SURPLUS' && !ngo.wantsSurplus) return false;
    if (verifiedOnly && !ngo.verified) return false;
    if (ngo.distanceKm > maxDistance) return false;
    if (selectedCategory !== 'ALL' && !ngo.areasOfSupport.some(a => a.toLowerCase().includes(selectedCategory.toLowerCase()))) return false;
    if (selectedUrgency !== 'ALL' && !ngo.currentRequirements?.some(r => r.urgency === selectedUrgency)) return false;
    return true;
  });

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

      {/* Clean Header */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
            <MapPin className="w-4 h-4" />
            <span>Interactive Logistics Map</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Surplus & NGO Distribution Map
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
            {!isOrg
              ? 'Locate organisations that have requested or need your surplus food, view pickup hubs, and accept claims in real-time.'
              : 'Locate nearby verified receivers, view pickup routes, and coordinate inter-organisation logistics.'}
          </p>
        </div>

        {/* Donor-Specific Tab Filter */}
        {!isOrg && (
          <div className="flex bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl border border-slate-200 dark:border-slate-600 shrink-0">
            <button
              onClick={() => setDonorFilterTab('WANTS_SURPLUS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                donorFilterTab === 'WANTS_SURPLUS'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Wanting Your Surplus ({ngos.filter(n => n.wantsSurplus).length})</span>
            </button>
            <button
              onClick={() => setDonorFilterTab('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                donorFilterTab === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Verified NGOs
            </button>
          </div>
        )}
      </div>

      {/* Location Search Bar Card */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
        <LocationSearch
          onSelectLocation={handleSelectLocation}
          onUseCurrentLocation={handleUseCurrentLocation}
        />
      </div>

      {/* MAIN RESPONSIVE MAP CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[640px]">

        {/* LEFT / MOBILE BOTTOM: FILTERS & NGO LIST */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col space-y-4 overflow-y-auto max-h-[640px]">

          {/* Filters Bar */}
          <div className="space-y-3 pb-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span className="flex items-center"><Filter className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Filter Hubs</span>
              <span className="text-emerald-600 dark:text-emerald-400">{filteredNgos.length} Centers</span>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-1.5">
              {['ALL', 'Food Rescue', 'Shelters', 'Child Welfare', 'Elderly'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Distance Slider */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                <span>Max Distance</span>
                <span className="text-emerald-600">{maxDistance} km</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
            </div>
          </div>

          {/* Scrollable NGO Cards List */}
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {filteredNgos.map((ngo) => {
              const isSelected = selectedNgo?.id === ngo.id;
              const topReq = ngo.currentRequirements?.[0];
              const isClaimant = Boolean(ngo.claimInfo);

              return (
                <div
                  key={ngo.id}
                  onClick={() => setSelectedNgo(ngo)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 text-xs relative ${
                    isSelected
                      ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500 shadow-xs'
                      : ngo.wantsSurplus
                      ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/80 hover:border-amber-400'
                      : 'bg-slate-50 dark:bg-slate-700/40 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  {/* SURPLUS INTEREST BADGE */}
                  {ngo.wantsSurplus && (
                    <div className="bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md inline-flex items-center space-x-1 mb-1">
                      <Sparkles className="w-3 h-3" />
                      <span>{isClaimant ? 'Requested Your Surplus' : 'Matches Your Surplus'}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm line-clamp-1">
                        {ngo.name}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block mt-0.5">
                        {ngo.category}
                      </span>
                    </div>
                    {ngo.verified && (
                      <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center shrink-0">
                        <ShieldCheck className="w-3 h-3 mr-0.5 text-emerald-600" /> Verified
                      </span>
                    )}
                  </div>

                  <p className="text-slate-500 dark:text-slate-400 flex items-center">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" /> {ngo.area}, {ngo.city} • <strong>~{ngo.distanceKm} km</strong>
                  </p>

                  {/* ACTIVE CLAIM DETAILS FOR DONOR */}
                  {isClaimant && (
                    <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-amber-200 dark:border-amber-900/60 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">
                          📦 {ngo.claimInfo.foodTitle}
                        </span>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                          ngo.claimInfo.status === 'ACCEPTED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {ngo.claimInfo.status === 'ACCEPTED' ? 'Accepted ✓' : 'Pending Request'}
                        </span>
                      </div>
                      {ngo.claimInfo.requestedPickupTime && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center">
                          <Clock className="w-3 h-3 mr-1 text-slate-400" />
                          Pickup: <strong>{ngo.claimInfo.requestedPickupTime}</strong>
                        </p>
                      )}
                      {ngo.claimInfo.message && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 italic">
                          "{ngo.claimInfo.message}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* Highlight active requirement (if non-claimant) */}
                  {!isClaimant && topReq && (
                    <div className="p-2 bg-amber-50/80 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-900 dark:text-amber-300 flex items-center justify-between">
                      <span className="truncate">
                        Needs: <strong>{topReq.quantity} {topReq.unit} {topReq.item}</strong>
                      </span>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-600 text-white shrink-0 ml-1">
                        Shortage
                      </span>
                    </div>
                  )}

                  {/* Action Bar on card */}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 dark:border-slate-700">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/requirements');
                      }}
                      className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center text-[11px]"
                    >
                      <AlertCircle className="w-3 h-3 mr-1 text-amber-500" />
                      <span>View Demands</span>
                    </button>

                    {!isOrg ? (
                      isClaimant && ngo.claimInfo.status === 'PENDING' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcceptClaim(ngo.claimInfo.claimId);
                          }}
                          disabled={acceptingClaimId === ngo.claimInfo.claimId}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-bold text-[11px] transition-colors shadow-xs flex items-center space-x-1 cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          <span>{acceptingClaimId === ngo.claimInfo.claimId ? 'Accepting...' : 'Accept Request'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/donate', { state: { prefill: { targetNgoId: ngo.id, targetNgoName: ngo.name } } });
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition-colors shadow-xs cursor-pointer"
                        >
                          Donate
                        </button>
                      )
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); setRedirectNgo(ngo); }}
                          className="px-2.5 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-bold text-[11px] transition-colors flex items-center space-x-1 cursor-pointer shadow-xs"
                          title="Redirect Surplus Here"
                        >
                          <ArrowRight className="w-3 h-3" />
                          <span>Redirect Surplus Here</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setContactNgo(ngo); }}
                          className="px-2 py-1 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 rounded-lg font-bold text-[11px] transition-colors border border-teal-200 dark:border-teal-800 flex items-center space-x-1 cursor-pointer"
                          title="Contact NGO"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Contact NGO</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredNgos.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">
                {!isOrg && donorFilterTab === 'WANTS_SURPLUS'
                  ? 'No organisations have active requests for your surplus yet.'
                  : 'No NGOs match the selected filters.'}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT: MAP VIEW */}
        <div className="lg:col-span-8 h-[450px] lg:h-full rounded-2xl overflow-hidden shadow-xs border border-slate-200 dark:border-slate-700">
          <MapView
            ngos={filteredNgos}
            selectedNgo={selectedNgo}
            onSelectNgo={setSelectedNgo}
            userLocation={userLocation}
            orgNgoId={orgNgoId}
          />
        </div>

      </div>

      {/* Organisation Inter-NGO Action Modals */}
      {contactNgo && <ContactNgoModal ngo={contactNgo} onClose={() => setContactNgo(null)} />}
      {redirectNgo && <RedirectSurplusModal ngo={redirectNgo} user={user} onClose={() => setRedirectNgo(null)} />}
    </div>
  );
};

export default MapPage;
