import React, { useState } from 'react';
import { Search, MapPin, ShieldCheck, ArrowRight, Filter } from 'lucide-react';
import { MOCK_NGOS, MOCK_INITIAL_DONATIONS } from '../services/mockData';
import { useNavigate } from 'react-router-dom';

const ExplorePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const navigate = useNavigate();

  const filteredNgos = MOCK_NGOS.filter(ngo => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = ngo.name.toLowerCase().includes(q) || ngo.area.toLowerCase().includes(q) || ngo.city.toLowerCase().includes(q) || ngo.description.toLowerCase().includes(q);
    const matchesCat = categoryFilter === 'ALL' || ngo.areasOfSupport.some(a => a.toLowerCase().includes(categoryFilter.toLowerCase()));
    return matchesSearch && matchesCat;
  });

  const filteredDonations = MOCK_INITIAL_DONATIONS.filter(d => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = d.title.toLowerCase().includes(q) || d.itemName.toLowerCase().includes(q) || d.pickupLocation.toLowerCase().includes(q);
    const matchesCat = categoryFilter === 'ALL' || d.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCat;
  });

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* Header & Global Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            GLOBAL RESOURCE & NGO SEARCH
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Search across verified NGOs, active resource donations, requirements, and locations in Pune.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Search by NGO name, food item, location (e.g., Rice, Kothrud, Clothes)..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm rounded-2xl border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-emerald-500 outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="p-3 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white text-sm rounded-2xl border border-slate-200 dark:border-slate-600 outline-none sm:w-48 font-bold"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            <option value="Food">Food</option>
            <option value="Clothes">Clothes</option>
            <option value="Books">Books</option>
            <option value="Medical">Medical Supplies</option>
            <option value="Electronics">Electronics</option>
            <option value="Educational">Educational</option>
          </select>
        </div>
      </div>

      {/* VERIFIED NGOS RESULTS */}
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
          Verified Receiver NGOs ({filteredNgos.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNgos.map((ngo) => (
            <div
              key={ngo.id}
              onClick={() => navigate(`/ngo/${ngo.id}`)}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-emerald-500 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <img src={ngo.logo} alt={ngo.name} className="w-12 h-12 rounded-xl object-cover" />
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{ngo.name}</h3>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                      ✓ Verified NGO
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {ngo.description}
                </p>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 pt-4 flex justify-between items-center text-xs mt-4">
                <span className="text-slate-500 flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-600" /> {ngo.area}, {ngo.city}
                </span>
                <span className="font-bold text-emerald-600">View NGO →</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ACTIVE RESOURCE DONATIONS RESULTS */}
      <div className="space-y-4 pt-4">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
          Active Resource Listings ({filteredDonations.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredDonations.map((d) => (
            <div key={d.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{d.title}</h3>
                <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">{d.id}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                {d.description}
              </p>
              <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100 dark:border-slate-700">
                <span className="font-bold text-slate-800 dark:text-slate-200">{d.quantity} {d.unit}</span>
                <button onClick={() => navigate(`/track/${d.id}`)} className="text-emerald-600 font-bold hover:underline">
                  Track Listing →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default ExplorePage;
