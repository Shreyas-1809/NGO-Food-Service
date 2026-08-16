import React, { useState } from 'react';
import {
  UserCircle2,
  Building2,
  Bike,
  ArrowRight,
  MapPin,
  Crosshair,
  ShieldCheck,
  HeartHandshake,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import MapView from './MapView';
import { MOCK_NGOS } from '../services/mockData';
import { useNavigate } from 'react-router-dom';

const ROLES = [
  {
    id: 'DONOR',
    label: 'Resource Donor',
    description: 'Log surplus food, track donations, match with NGOs.',
    icon: UserCircle2,
    color: 'emerald',
    redirectTo: '/donate'
  },
  {
    id: 'VOLUNTEER',
    label: 'Volunteer Rider',
    description: 'Accept pickup assignments, share live GPS, deliver to NGOs.',
    icon: Bike,
    color: 'blue',
    redirectTo: '/volunteer'
  },
  {
    id: 'RECEIVER',
    label: 'Receiver / NGO',
    description: 'Publish food shortages, claim surplus, manage your hub.',
    icon: Building2,
    color: 'teal',
    redirectTo: '/request'
  }
];

const roleColors = {
  DONOR: {
    active: 'bg-[#1B4332] text-white',
    accent: 'bg-emerald-700 hover:bg-emerald-800',
    badge: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
  },
  VOLUNTEER: {
    active: 'bg-blue-700 text-white',
    accent: 'bg-blue-700 hover:bg-blue-800',
    badge: 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
  },
  RECEIVER: {
    active: 'bg-teal-700 text-white',
    accent: 'bg-teal-700 hover:bg-teal-800',
    badge: 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800'
  }
};

const AuthPage = ({ setToken, setUser }) => {
  const [role, setRole] = useState('DONOR');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [userLocation, setUserLocation] = useState({ lat: 18.5204, lng: 73.8567 });
  const [locating, setLocating] = useState(false);
  const navigate = useNavigate();

  const selectedRole = ROLES.find(r => r.id === role);
  const colors = roleColors[role];

  const handleDemoSignIn = (targetRole) => {
    let demoUser;
    let token;
    let redirectPath;

    if (targetRole === 'DONOR') {
      demoUser = { name: 'Ananya Sharma', email: 'donor@demo.org', role: 'DONOR', accountType: 'DONOR', city: 'Pune' };
      token = 'mock-donor-jwt-2026';
      redirectPath = '/donate';
    } else if (targetRole === 'VOLUNTEER') {
      demoUser = { name: 'Rahul Verma', email: 'volunteer@demo.org', role: 'VOLUNTEER', accountType: 'VOLUNTEER', city: 'Pune' };
      token = 'mock-volunteer-jwt-2026';
      redirectPath = '/volunteer';
    } else {
      demoUser = { name: 'Helping Hands Foundation', email: 'ngo@demo.org', role: 'RECEIVER', accountType: 'ORGANISATION', city: 'Pune' };
      token = 'mock-receiver-jwt-2026';
      redirectPath = '/request';
    }

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(demoUser));
    if (setToken) setToken(token);
    if (setUser) setUser(demoUser);
    navigate(redirectPath);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    let newUser;
    let token;

    if (role === 'VOLUNTEER') {
      newUser = {
        name: name || email.split('@')[0] || 'Volunteer Rider',
        email,
        role: 'VOLUNTEER',
        accountType: 'VOLUNTEER',
        city: 'Pune'
      };
      token = 'volunteer-token';
    } else if (role === 'RECEIVER') {
      newUser = {
        name: orgName || name || 'Verified NGO',
        email,
        role: 'RECEIVER',
        accountType: 'ORGANISATION',
        city: 'Pune'
      };
      token = 'receiver-token';
    } else {
      newUser = {
        name: name || email.split('@')[0] || 'Resource Donor',
        email,
        role: 'DONOR',
        accountType: 'DONOR',
        city: 'Pune'
      };
      token = 'donor-token';
    }

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(newUser));
    if (setToken) setToken(token);
    if (setUser) setUser(newUser);
    navigate(selectedRole.redirectTo);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false)
    );
  };

  const isVolunteer = role === 'VOLUNTEER';
  const isReceiver = role === 'RECEIVER';

  return (
    <div className="w-full min-h-[calc(100vh-72px)] bg-[#FBFBFA] dark:bg-[#121514] flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-5xl space-y-6">

        {/* Platform Intro */}
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center space-x-2 bg-stone-100 dark:bg-stone-800 px-3 py-1 rounded-full text-xs font-semibold text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
            <HeartHandshake className="w-3.5 h-3.5 text-[#1B4332] dark:text-emerald-400" />
            <span>FoodBridge — Real-Time Food Rescue & Logistics</span>
          </div>
          <h1 className="text-3xl font-extrabold text-stone-900 dark:text-white">
            Join the Platform
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Select your role and sign in. Each role has a dedicated dashboard and workflow.
          </p>
        </div>

        {/* ROLE SELECTOR */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ROLES.map(r => {
            const Icon = r.icon;
            const isSelected = role === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? `${roleColors[r.id].active} border-transparent shadow-sm`
                    : 'bg-white dark:bg-[#161918] border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 text-stone-700 dark:text-stone-300'
                }`}
              >
                <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-white opacity-90' : 'text-stone-500'}`} />
                <p className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-stone-900 dark:text-white'}`}>
                  {r.label}
                </p>
                <p className={`text-[11px] mt-0.5 leading-relaxed ${isSelected ? 'text-white/80' : 'text-stone-500 dark:text-stone-400'}`}>
                  {r.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* MAIN SPLIT LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* LEFT: AUTH FORM */}
          <div className="lg:col-span-5 bg-white dark:bg-[#161918] rounded-2xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">

            {/* Role badge */}
            <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${colors.badge}`}>
              {React.createElement(selectedRole.icon, { className: 'w-3.5 h-3.5' })}
              <span>Continue as {selectedRole.label}</span>
            </div>

            {/* 1-click demo */}
            <div className="p-4 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                ⚡ 1-Click Demo Access
              </span>
              <div className="grid grid-cols-1 gap-2">
                {ROLES.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleDemoSignIn(r.id)}
                    className={`w-full py-2.5 text-white font-semibold rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-colors ${roleColors[r.id].accent}`}
                  >
                    {React.createElement(r.icon, { className: 'w-3.5 h-3.5' })}
                    <span>Demo: {r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Form header */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-stone-900 dark:text-white">
                {isLogin ? 'Sign In' : 'Create Account'}
              </h2>
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs font-semibold text-[#1B4332] dark:text-emerald-400 hover:underline"
              >
                {isLogin ? 'Register instead' : 'Sign in instead'}
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs sm:text-sm">
              {!isLogin && (
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    {isReceiver ? 'Organisation Name' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isReceiver ? 'e.g. Helping Hands Foundation' : isVolunteer ? 'e.g. Rahul Verma' : 'e.g. Ananya Sharma'}
                    className="w-full p-2.5 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-white outline-none focus:border-[#1B4332] transition-colors"
                    value={isReceiver ? orgName : name}
                    onChange={(e) => isReceiver ? setOrgName(e.target.value) : setName(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder={isVolunteer ? 'volunteer@email.com' : isReceiver ? 'ngo@organisation.org' : 'donor@email.com'}
                  className="w-full p-2.5 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-white outline-none focus:border-[#1B4332] transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    className="w-full p-2.5 pr-10 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-white outline-none focus:border-[#1B4332] transition-colors"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-3 text-white font-bold rounded-xl shadow-xs transition-colors text-sm ${colors.accent}`}
              >
                {isLogin ? `Sign In as ${selectedRole.label}` : `Register & Open ${selectedRole.label} Dashboard`}
              </button>
            </form>

            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
              <span className="flex items-center"><ShieldCheck className="w-3.5 h-3.5 mr-1 text-stone-400" /> Secure & Encrypted</span>
              <span className="text-[#1B4332] dark:text-emerald-400 font-semibold">✓ Verified Partner Network</span>
            </div>
          </div>

          {/* RIGHT: MAP PREVIEW */}
          <div className="lg:col-span-7 space-y-3">
            <div className="bg-white dark:bg-[#161918] p-3 rounded-t-2xl border-t border-x border-stone-200 dark:border-stone-800 flex justify-between items-center text-xs">
              <div className="flex items-center space-x-2 font-semibold text-stone-700 dark:text-stone-300">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Live Nearby NGOs — Pune</span>
              </div>
              <button
                onClick={handleUseCurrentLocation}
                className="flex items-center space-x-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
              >
                <Crosshair className={`w-3 h-3 ${locating ? 'animate-spin' : ''}`} />
                <span>{locating ? 'Locating...' : 'Use My Location'}</span>
              </button>
            </div>
            <div className="h-[420px] rounded-b-2xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-xs">
              <MapView
                ngos={MOCK_NGOS}
                selectedNgo={MOCK_NGOS[0]}
                userLocation={userLocation}
              />
            </div>

            {/* Workflow indicators */}
            <div className="bg-white dark:bg-[#161918] rounded-2xl p-4 border border-stone-200 dark:border-stone-800 shadow-xs">
              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Donation Journey</div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-stone-600 dark:text-stone-300">
                <span className="flex flex-col items-center text-center">
                  <span className="w-7 h-7 rounded-full bg-[#1B4332] text-white flex items-center justify-center text-xs mb-1">D</span>
                  Donor
                </span>
                <span className="flex-1 border-t border-dashed border-stone-300 mx-2" />
                <span className="flex flex-col items-center text-center">
                  <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs mb-1">V</span>
                  Volunteer
                </span>
                <span className="flex-1 border-t border-dashed border-stone-300 mx-2" />
                <span className="flex flex-col items-center text-center">
                  <span className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs mb-1">N</span>
                  NGO
                </span>
                <span className="flex-1 border-t border-dashed border-stone-300 mx-2" />
                <span className="flex flex-col items-center text-center">
                  <span className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                  Delivered
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AuthPage;
