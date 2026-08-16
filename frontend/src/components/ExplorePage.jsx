import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Users,
  Search,
  CheckCircle2,
  ShieldCheck,
  Filter,
  Plus,
  Phone,
  ArrowRight
} from 'lucide-react';
import { getStoredNgos, subscribeToDonationUpdates } from '../services/donationService';
import RegisterNGOModal from './RegisterNGOModal';
import { useNavigate } from 'react-router-dom';

const ExplorePage = () => {
  const [ngos, setNgos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const navigate = useNavigate();

  const syncData = () => {
    setNgos(getStoredNgos());
  };

  useEffect(() => {
    syncData();
    return subscribeToDonationUpdates(syncData);
  }, []);

  const filteredNgos = ngos.filter(ngo => {
    const matchesSearch = ngo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ngo.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ngo.city.toLowerCase().includes(searchTerm.toLowerCase());
    if (selectedFilter === 'VERIFIED') return matchesSearch && ngo.verified;
    if (selectedFilter === 'COMMUNITY') return matchesSearch && !ngo.verified;
    return matchesSearch;
  });

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#161918] p-6 sm:p-8 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">
            Community Receiver Network
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white">
            Verified NGO Directory
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            Explore verified non-profit organizations, community kitchens, and shelters distributing meals in Pune.
          </p>
        </div>

        <button
          onClick={() => setShowRegisterModal(true)}
          className="w-full sm:w-auto px-5 py-3 bg-[#1B4332] hover:bg-[#143326] text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2 text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Register New NGO Hub</span>
        </button>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by NGO name, neighborhood (e.g. Kothrud, Shivajinagar), or city..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#161918] border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-white text-xs outline-none focus:border-[#1B4332]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              selectedFilter === 'ALL'
                ? 'bg-[#1B4332] text-white border-[#1B4332]'
                : 'bg-white dark:bg-[#161918] text-stone-600 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:bg-stone-50'
            }`}
          >
            All Centers ({ngos.length})
          </button>
          <button
            onClick={() => setSelectedFilter('VERIFIED')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              selectedFilter === 'VERIFIED'
                ? 'bg-emerald-800 text-white border-emerald-800'
                : 'bg-white dark:bg-[#161918] text-stone-600 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:bg-stone-50'
            }`}
          >
            ✓ Verified Partners
          </button>
        </div>
      </div>

      {/* NGO CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredNgos.map((ngo) => (
          <div
            key={ngo.id}
            className="bg-white dark:bg-[#161918] rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-stone-300 transition-colors"
          >
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <img
                  src={ngo.logo}
                  alt={ngo.name}
                  className="w-12 h-12 rounded-xl object-cover border border-stone-200 dark:border-stone-700"
                />
                <div>
                  <h3 className="font-bold text-stone-900 dark:text-white text-base leading-snug">
                    {ngo.name}
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded inline-block mt-1 ${
                    ngo.verified
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200'
                      : 'bg-stone-100 text-stone-600'
                  }`}>
                    {ngo.verified ? '✓ Verified Partner NGO' : 'Community Center (Pending Audit)'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-2 leading-relaxed">
                {ngo.description}
              </p>

              <div className="p-3 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800 text-xs space-y-1.5">
                <div className="flex items-center text-stone-600 dark:text-stone-300">
                  <MapPin className="w-3.5 h-3.5 mr-1.5 text-stone-400 shrink-0" />
                  <span className="truncate">{ngo.address}</span>
                </div>
                <div className="flex items-center text-stone-600 dark:text-stone-300">
                  <Users className="w-3.5 h-3.5 mr-1.5 text-stone-400 shrink-0" />
                  <span>Capacity: <strong className="text-stone-900 dark:text-white">{ngo.capacity}</strong></span>
                </div>
                {ngo.phone && (
                  <div className="flex items-center text-stone-600 dark:text-stone-300">
                    <Phone className="w-3.5 h-3.5 mr-1.5 text-stone-400 shrink-0" />
                    <span>{ngo.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => navigate('/donate', { state: { prefill: { targetNgoId: ngo.id, targetNgoName: ngo.name } } })}
              className="w-full py-2.5 bg-[#1B4332] hover:bg-[#143326] text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1"
            >
              <span>Donate to this Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* REGISTER NGO MODAL */}
      {showRegisterModal && (
        <RegisterNGOModal
          onClose={() => setShowRegisterModal(false)}
          onSuccess={() => {
            setShowRegisterModal(false);
            syncData();
          }}
        />
      )}

    </div>
  );
};

export default ExplorePage;
