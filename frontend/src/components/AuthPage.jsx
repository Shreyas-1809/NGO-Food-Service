import React, { useState } from 'react';
import { UserCircle2, Building2, ShieldCheck, MapPin, Sparkles, ArrowRight, CheckCircle2, Navigation, Crosshair } from 'lucide-react';
import MapView from './MapView';
import { MOCK_NGOS } from '../services/mockData';
import { useNavigate } from 'react-router-dom';

const AuthPage = ({ setToken, setUser }) => {
  const [role, setRole] = useState('DONOR'); // 'DONOR' or 'RECEIVER'
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [userLocation, setUserLocation] = useState({ lat: 18.5204, lng: 73.8567 }); // Pune default
  const [locating, setLocating] = useState(false);

  const navigate = useNavigate();

  const handleDemoSignInDonor = () => {
    const donorUser = {
      name: 'Ananya Sharma (Donor)',
      email: 'donor@demo.org',
      role: 'DONOR',
      accountType: 'DONOR',
      city: 'Pune'
    };
    if (setToken) setToken('mock-donor-jwt-token-2026');
    if (setUser) setUser(donorUser);
    localStorage.setItem('token', 'mock-donor-jwt-token-2026');
    localStorage.setItem('user', JSON.stringify(donorUser));
    navigate('/donate');
  };

  const handleDemoSignInReceiver = () => {
    const receiverUser = {
      name: 'Helping Hands Foundation',
      email: 'ngo@demo.org',
      role: 'RECEIVER',
      accountType: 'ORGANISATION',
      city: 'Pune'
    };
    if (setToken) setToken('mock-receiver-jwt-token-2026');
    if (setUser) setUser(receiverUser);
    localStorage.setItem('token', 'mock-receiver-jwt-token-2026');
    localStorage.setItem('user', JSON.stringify(receiverUser));
    navigate('/request');
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (role === 'DONOR') {
      const donorUser = {
        name: name || email.split('@')[0] || 'Resource Donor',
        email: email || 'donor@bridge.org',
        role: 'DONOR',
        accountType: 'DONOR',
        city: 'Pune'
      };
      if (setToken) setToken('donor-token');
      if (setUser) setUser(donorUser);
      localStorage.setItem('token', 'donor-token');
      localStorage.setItem('user', JSON.stringify(donorUser));
      navigate('/donate');
    } else {
      const receiverUser = {
        name: orgName || name || 'Verified NGO Partner',
        email: email || 'receiver@ngo.org',
        role: 'RECEIVER',
        accountType: 'ORGANISATION',
        city: 'Pune'
      };
      if (setToken) setToken('receiver-token');
      if (setUser) setUser(receiverUser);
      localStorage.setItem('token', 'receiver-token');
      localStorage.setItem('user', JSON.stringify(receiverUser));
      navigate('/request');
    }
  };

  const handleUseCurrentLocation = () => {
    if ('geolocation' in navigator) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocating(false);
        },
        (err) => {
          console.warn('Geolocation error fallback:', err.message);
          setLocating(false);
        }
      );
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>DONOR ↔ RECEIVER BRIDGE PLATFORM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Join the Smart NGO Matching Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Choose your role to get redirected to your personalized dashboard with live location tracking.
          </p>
        </div>

        <button
          onClick={handleUseCurrentLocation}
          className="px-4 py-2.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-2xl text-xs font-extrabold hover:bg-blue-100 transition-all flex items-center space-x-1.5"
        >
          <Crosshair className={`w-4 h-4 text-blue-600 ${locating ? 'animate-spin' : ''}`} />
          <span>{locating ? 'Locating...' : '📍 USE MY LOCATION'}</span>
        </button>
      </div>

      {/* COMBINED SPLIT SCREEN: AUTH FORM (LEFT) + LIVE MAP (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* LEFT COLUMN: ROLE SELECTION & REGISTRATION FORM */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-6">
          
          <div>
            {/* ROLE SELECTOR TABS */}
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Select Your Role</label>
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setRole('DONOR')}
                  className={`py-3 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-2 transition-all ${
                    role === 'DONOR'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <UserCircle2 className="w-4 h-4" />
                  <span>🙋‍♂️ RESOURCE DONOR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('RECEIVER')}
                  className={`py-3 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-2 transition-all ${
                    role === 'RECEIVER'
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>🏢 RECEIVER NGO</span>
                </button>
              </div>
            </div>

            {/* QUICK 1-CLICK DEMO LOGIN SHORTCUTS */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">⚡ Instant 1-Click Demo Login</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleDemoSignInDonor}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-md text-xs flex items-center justify-center space-x-1.5 transition-all"
                >
                  <span>DONOR DEMO SIGN IN</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleDemoSignInReceiver}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl shadow-md text-xs flex items-center justify-center space-x-1.5 transition-all"
                >
                  <span>NGO RECEIVER DEMO SIGN IN</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* FORM TITLE */}
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {isLogin ? `Sign In as ${role === 'DONOR' ? 'Donor' : 'Receiver NGO'}` : `Create ${role === 'DONOR' ? 'Donor' : 'NGO'} Account`}
              </h2>
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs font-bold text-emerald-600 hover:underline"
              >
                {isLogin ? 'Need an account? Register' : 'Already have account? Sign In'}
              </button>
            </div>

            {/* AUTHENTICATION FORM */}
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs sm:text-sm">
              {!isLogin && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {role === 'DONOR' ? 'Full Name' : 'Organisation Name'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={role === 'DONOR' ? 'Ananya Sharma' : 'Helping Hands Foundation'}
                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
                    value={role === 'DONOR' ? name : orgName}
                    onChange={(e) => role === 'DONOR' ? setName(e.target.value) : setOrgName(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder={role === 'DONOR' ? 'donor@demo.org' : 'ngo@demo.org'}
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className={`w-full py-4 text-white font-extrabold rounded-2xl shadow-lg transition-all text-sm mt-2 ${
                  role === 'DONOR' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30' : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/30'
                }`}
              >
                {isLogin ? `SIGN IN & OPEN ${role} DASHBOARD` : `REGISTER & OPEN ${role} DASHBOARD`}
              </button>
            </form>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 text-slate-400 text-xs flex items-center justify-between font-medium">
            <span>🔒 256-bit Encrypted Safety & Privacy</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Verified Organizations</span>
          </div>

        </div>

        {/* RIGHT COLUMN: LIVE INTERACTIVE MAP PREVIEW */}
        <div className="lg:col-span-6 flex flex-col h-[500px] lg:h-full">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-t-3xl border-t border-x border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
            <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-white">
              <MapPin className="w-4 h-4 text-blue-600 animate-bounce" />
              <span>Live Location & Nearby Receiver NGOs</span>
            </div>
            <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2 py-0.5 rounded">
              Pune Map Feed
            </span>
          </div>

          <div className="flex-1 rounded-b-3xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 min-h-[400px]">
            <MapView
              ngos={MOCK_NGOS}
              selectedNgo={MOCK_NGOS[0]}
              userLocation={userLocation}
            />
          </div>
        </div>

      </div>

    </div>
  );
};

export default AuthPage;
