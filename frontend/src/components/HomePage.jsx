import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartHandshake, ShieldCheck, ArrowRight, MapPin, Truck, Award, Sparkles, CheckCircle2, Search, Users, Building2, PackageCheck } from 'lucide-react';
import { MOCK_NGOS, IMPACT_METRICS } from '../services/mockData';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-200/60 dark:border-slate-800">
        
        {/* Background Subtle Gradient Blobs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-teal-500/10 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          {/* Top Pill */}
          <div className="inline-flex items-center space-x-2 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border border-emerald-300 dark:border-emerald-800 shadow-sm animate-pulse">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>AI-Driven Resource Matching & Delivery Pipeline</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Connecting Resources With <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500">People Who Need Them.</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
            Resources shouldn't go to waste when someone nearby needs them. Our platform connects donors, verified NGOs, and delivery networks in real-time.
          </p>

          {/* Call To Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
            <Link
              to="/donate"
              className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-xl shadow-emerald-600/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center space-x-2 text-base"
            >
              <span>DONATE NOW</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/request"
              className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 font-extrabold rounded-2xl border border-slate-300 dark:border-slate-700 shadow-md transition-all flex items-center justify-center text-base"
            >
              REQUEST SUPPORT
            </Link>
            <Link
              to="/ngos"
              className="w-full sm:w-auto px-8 py-4 bg-teal-50 dark:bg-slate-800/80 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-slate-700 font-extrabold rounded-2xl border border-teal-200 dark:border-slate-700 transition-all flex items-center justify-center text-base"
            >
              FIND AN NGO
            </Link>
          </div>

          {/* Verification Assurance Tag */}
          <div className="mt-8 flex items-center justify-center space-x-6 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-1 text-emerald-500" /> 100% Verified NGOs</span>
            <span className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-1 text-emerald-500" /> Live Route Tracking</span>
            <span className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-1 text-emerald-500" /> Tax Receipt Certificates</span>
          </div>

        </div>
      </section>

      {/* HOW IT WORKS PROCESS FLOW */}
      <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Simple 4-Step Process</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-1">
            How The Donor ↔ Receiver Bridge Works
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-sm mt-2">
            Seamlessly bridging donor surplus with verified community organizations in minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          
          {/* Step 1 */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-emerald-500 transition-all group relative">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 font-extrabold text-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              1
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Donate</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Log surplus resources (Food, Clothes, Books, Medical, Electronics) with your location and availability time.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-emerald-500 transition-all group relative">
            <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 font-extrabold text-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              2
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Get Matched</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Our Smart Matching Engine identifies verified local NGOs based on distance, urgency, and requirement capacity.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-emerald-500 transition-all group relative">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-extrabold text-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              3
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Deliver</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Track live pickup and transit on Google Maps with route optimization and estimated travel times.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-emerald-500 transition-all group relative">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 font-extrabold text-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              4
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Create Impact</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Receive verified delivery confirmation and download your digital donation certificate instantly.
            </p>
          </div>

        </div>

      </section>

      {/* IMPACT STATISTICS COUNTER */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Verified Platform Statistics</span>
            <h2 className="text-3xl font-extrabold text-white mt-1">Real Startup Impact Across Pune</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            
            <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10">
              <PackageCheck className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
              <div className="text-4xl font-extrabold text-emerald-400 font-mono">12,450 kg</div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Resources Donated</div>
            </div>

            <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10">
              <Users className="w-8 h-8 text-teal-400 mx-auto mb-3" />
              <div className="text-4xl font-extrabold text-teal-400 font-mono">3,820</div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Families Helped</div>
            </div>

            <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10">
              <HeartHandshake className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <div className="text-4xl font-extrabold text-blue-400 font-mono">126</div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Active Donors</div>
            </div>

            <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10">
              <Building2 className="w-8 h-8 text-amber-400 mx-auto mb-3" />
              <div className="text-4xl font-extrabold text-amber-400 font-mono">48</div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1">Partner NGOs</div>
            </div>

          </div>

        </div>
      </section>

      {/* VERIFIED NGOS PREVIEW */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Verified Organizations</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Partner Receiver NGOs Nearby
            </h2>
          </div>
          <Link
            to="/ngos"
            className="text-sm font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center"
          >
            View All Partner NGOs <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {MOCK_NGOS.slice(0, 3).map((ngo) => (
            <div
              key={ngo.id}
              onClick={() => navigate(`/ngo/${ngo.id}`)}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-emerald-500 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <img src={ngo.logo} alt={ngo.name} className="w-12 h-12 rounded-xl object-cover" />
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center">
                      {ngo.name}
                    </h3>
                    <div className="flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Verified Organization
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                  {ngo.description}
                </p>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 pt-4 flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 flex items-center font-medium">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-600" /> {ngo.area}, {ngo.city}
                </span>
                <span className="font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                  {ngo.distanceKm} km away
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default HomePage;
