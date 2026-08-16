import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  HeartHandshake,
  ShieldCheck,
  ArrowRight,
  MapPin,
  Truck,
  Award,
  CheckCircle2,
  Users,
  Building2,
  Package,
  Bike,
  Clock,
  AlertCircle
} from 'lucide-react';
import { MOCK_NGOS, MOCK_INITIAL_DONATIONS } from '../services/mockData';

const HomePage = () => {
  const navigate = useNavigate();

  const activeShortages = [
    { ngo: 'Helping Hands Foundation', item: 'Rice & Pulses', quantity: '50 kg', area: 'Shivajinagar', urgency: 'Urgent Deficit' },
    { ngo: 'Food Relief Foundation', item: 'Fresh Cooked Meals', quantity: '100 Portions', area: 'Kothrud', urgency: 'Urgent Deficit' },
    { ngo: 'Robin Hood Army (Pune)', item: 'Event Buffet Surplus', quantity: '150 Meals', area: 'Deccan Hub', urgency: 'High Need' },
    { ngo: 'Feeding India (Zomato Giving)', item: 'Dry Ration Packets', quantity: '200 Packs', area: 'Kharadi', urgency: 'Urgent Deficit' }
  ];

  return (
    <div className="w-full bg-[#FBFBFA] dark:bg-[#121514] text-stone-900 dark:text-stone-100 transition-colors duration-200">
      
      {/* HERO SECTION */}
      <section className="border-b border-stone-200 dark:border-stone-800 pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          
          {/* Subtle Tag */}
          <div className="inline-flex items-center space-x-2 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-3.5 py-1 rounded-full text-xs font-semibold border border-stone-200 dark:border-stone-700">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>Real-Time Food Rescue & Logistics Network</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-6xl font-extrabold text-stone-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-tight">
            Turn Surplus Into Support.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Connect surplus food from restaurants, catered events, and households directly with verified community kitchens and shelters in real-time.
          </p>

          {/* Primary Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <Link
              to="/donate"
              className="w-full sm:w-auto px-7 py-3.5 bg-[#1B4332] hover:bg-[#143326] text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 text-sm"
            >
              <span>Donate Surplus</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/request"
              className="w-full sm:w-auto px-7 py-3.5 bg-white dark:bg-stone-800 text-stone-800 dark:text-white hover:bg-stone-50 dark:hover:bg-stone-700 font-semibold rounded-xl border border-stone-300 dark:border-stone-700 shadow-xs transition-all flex items-center justify-center text-sm"
            >
              <span>Request Food</span>
            </Link>
            <Link
              to="/volunteer"
              className="w-full sm:w-auto px-6 py-3.5 bg-stone-100 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 font-semibold rounded-xl border border-stone-200 dark:border-stone-700 transition-all flex items-center justify-center text-sm space-x-1.5"
            >
              <Bike className="w-4 h-4 text-blue-600" />
              <span>Volunteer Rider</span>
            </Link>
          </div>

          {/* Trust Guarantees */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-stone-500 dark:text-stone-400">
            <span className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-700" /> Verified NGO Partners</span>
            <span className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-700" /> Live GPS Dispatch Tracking</span>
            <span className="flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-700" /> Safe Food Handling Certified</span>
          </div>

        </div>
      </section>

      {/* 3-STEP DONATION LOGISTICS CHAIN STRIP */}
      <section className="bg-white dark:bg-[#161918] border-b border-stone-200 dark:border-stone-800 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
              Live Donation Journey
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            
            {/* Step 1: Donor */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0">
                1
              </div>
              <div>
                <h4 className="font-bold text-sm text-stone-900 dark:text-white flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Donor Logs Surplus
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Enter quantity, food category, and pickup address with GPS pin.
                </p>
              </div>
            </div>

            {/* Step 2: Volunteer */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold flex items-center justify-center text-xs shrink-0">
                2
              </div>
              <div>
                <h4 className="font-bold text-sm text-stone-900 dark:text-white flex items-center">
                  <Bike className="w-3.5 h-3.5 mr-1 text-blue-600" /> Volunteer Collects
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Rider accepts pickup, shares live GPS, and transports meals.
                </p>
              </div>
            </div>

            {/* Step 3: NGO */}
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold flex items-center justify-center text-xs shrink-0">
                3
              </div>
              <div>
                <h4 className="font-bold text-sm text-stone-900 dark:text-white flex items-center">
                  <Building2 className="w-3.5 h-3.5 mr-1 text-amber-600" /> NGO Receives & Feeds
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Community center accepts food and distributes to beneficiaries.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* REAL-TIME NGO SUPPLY SHORTAGES SECTION */}
      <section className="py-14 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-red-600 uppercase tracking-wider">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Real-Time NGO Supply Needs</span>
            </div>
            <h2 className="text-2xl font-bold text-stone-900 dark:text-white mt-0.5">
              Verified Organizations Needing Food Right Now
            </h2>
          </div>
          <Link
            to="/ngo-requirements"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 flex items-center"
          >
            View All Shortages <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {activeShortages.map((item, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-[#161918] p-5 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-stone-300 transition-colors"
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950 px-2 py-0.5 rounded">
                    {item.urgency}
                  </span>
                  <span className="text-xs text-stone-400 flex items-center">
                    <MapPin className="w-3 h-3 mr-0.5" /> {item.area}
                  </span>
                </div>

                <h3 className="font-bold text-stone-900 dark:text-white text-base mt-2">
                  {item.item}
                </h3>
                <p className="text-xs text-stone-500 font-medium">
                  {item.ngo}
                </p>
                <div className="mt-2 text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                  Required: {item.quantity}
                </div>
              </div>

              <Link
                to="/donate"
                className="w-full py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 font-semibold text-xs rounded-lg text-center transition-colors"
              >
                Fulfill This Need
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* VERIFIED PARTNER NGOS */}
      <section className="bg-white dark:bg-[#161918] border-t border-stone-200 dark:border-stone-800 py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              Trusted Network
            </span>
            <h2 className="text-2xl font-bold text-stone-900 dark:text-white mt-1">
              Verified Partner Organizations
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              All partner organizations are registered with location verification and safety compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {MOCK_NGOS.slice(0, 3).map((ngo) => (
              <div
                key={ngo.id}
                className="p-5 rounded-xl border border-stone-200 dark:border-stone-800 bg-[#FBFBFA] dark:bg-stone-900/40 space-y-3"
              >
                <div className="flex items-center space-x-3">
                  <img src={ngo.logo} alt={ngo.name} className="w-10 h-10 rounded-lg object-cover border border-stone-200" />
                  <div>
                    <h3 className="font-bold text-sm text-stone-900 dark:text-white">{ngo.name}</h3>
                    <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                      ✓ Verified Partner
                    </span>
                  </div>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-2 leading-relaxed">
                  {ngo.description}
                </p>
                <div className="pt-2 border-t border-stone-200/80 dark:border-stone-800 flex justify-between items-center text-xs text-stone-500">
                  <span>Capacity: {ngo.capacity}</span>
                  <Link to="/explore" className="font-semibold text-stone-700 dark:text-stone-300 hover:underline">
                    View Hub →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* IMPACT METRICS */}
      <section className="py-14 border-t border-stone-200 dark:border-stone-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            
            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#161918]">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#1B4332] dark:text-emerald-400 block">
                12,450+
              </span>
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400 mt-1 block">
                Meals Rescued & Distributed
              </span>
            </div>

            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#161918]">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#1B4332] dark:text-emerald-400 block">
                48
              </span>
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400 mt-1 block">
                Verified NGO Centers
              </span>
            </div>

            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#161918]">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#1B4332] dark:text-emerald-400 block">
                24 mins
              </span>
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400 mt-1 block">
                Average Pickup Dispatch
              </span>
            </div>

            <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#161918]">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#1B4332] dark:text-emerald-400 block">
                4.2 tons
              </span>
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400 mt-1 block">
                CO2 Emissions Prevented
              </span>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
