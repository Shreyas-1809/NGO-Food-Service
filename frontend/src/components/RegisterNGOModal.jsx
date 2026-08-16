import React, { useState } from 'react';
import { Building2, MapPin, Crosshair, Phone, Mail, Globe, ShieldCheck, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { getCurrentUserLocation, reverseGeocodeCoords, geocodeAddress } from '../services/mapsService';
import { registerNgo } from '../services/donationService';

const RegisterNGOModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '42 University Road, Shivajinagar, Pune',
    area: 'Shivajinagar',
    city: 'Pune',
    location: { lat: 18.5308, lng: 73.8474 },
    phone: '+91 ',
    email: '',
    website: '',
    description: '',
    foodTypesAccepted: ['Cooked Food', 'Raw Grains', 'Packaged Food'],
    capacity: '500 meals/day',
    verificationStatus: 'COMMUNITY_RECEIVER', // Defaults to community until verified
    registrationNumber: ''
  });

  const [gpsLoading, setGpsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUseCurrentLocation = async () => {
    try {
      setGpsLoading(true);
      setError('');
      const coords = await getCurrentUserLocation();
      const addr = await reverseGeocodeCoords(coords);
      setFormData(prev => ({
        ...prev,
        address: addr,
        location: coords
      }));
    } catch (err) {
      setError(err.message || 'Unable to retrieve GPS coordinates.');
    } finally {
      setGpsLoading(false);
    }
  };

  const handleFoodTypeToggle = (type) => {
    const current = formData.foodTypesAccepted;
    if (current.includes(type)) {
      setFormData({ ...formData, foodTypesAccepted: current.filter(t => t !== type) });
    } else {
      setFormData({ ...formData, foodTypesAccepted: [...current, type] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.address || !formData.phone || !formData.email) {
      setError('Please fill out all mandatory fields.');
      return;
    }

    setIsSubmitting(true);

    let finalCoords = formData.location;
    if (!finalCoords || (finalCoords.lat === 18.5308 && finalCoords.lng === 73.8474)) {
      finalCoords = await geocodeAddress(formData.address);
    }

    try {
      const createdNgo = registerNgo({
        ...formData,
        location: finalCoords
      });

      setIsSubmitting(false);
      if (onSuccess) onSuccess(createdNgo);
      if (onClose) onClose();
    } catch (err) {
      setIsSubmitting(false);
      setError(err.message || 'Failed to register organization.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-700 my-8">
        
        {/* Modal Header */}
        <div className="p-6 bg-emerald-600 text-white flex justify-between items-center">
          <div>
            <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-widest text-emerald-100 mb-1">
              <Building2 className="w-4 h-4" />
              <span>Official Organization Onboarding</span>
            </div>
            <h3 className="text-xl font-extrabold">REGISTER NGO / FOOD RECEIVER</h3>
          </div>
          <button onClick={onClose} className="text-white text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-500 text-red-700 dark:text-red-300 rounded-xl font-bold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Notice on Real Verified Partners */}
          <div className="bg-emerald-50 dark:bg-emerald-950/60 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 text-xs text-emerald-900 dark:text-emerald-200">
            <span className="font-bold block">Verified Partner Notice:</span>
            <span>Real organizations (such as Robin Hood Army, Feeding India, or local verified soup kitchens) receive a <strong>"Verified Partner"</strong> badge upon document and location verification.</span>
          </div>

          {/* NGO Name & Registration Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Organization / NGO Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Robin Hood Army / Helping Hands"
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Registration / 80G / Darpan ID</label>
              <input
                type="text"
                placeholder="e.g. MH/2021/008492"
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
              />
            </div>
          </div>

          {/* Address & GPS Location */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                Official Center Address & GPS Pin *
              </label>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={gpsLoading}
                className="inline-flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800"
              >
                <Crosshair className={`w-3.5 h-3.5 mr-1 ${gpsLoading ? 'animate-spin' : ''}`} />
                <span>{gpsLoading ? 'Locating...' : '📍 Use Current GPS'}</span>
              </button>
            </div>

            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                placeholder="Enter complete center address with area and city..."
                className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            {formData.location && (
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Hub Coordinates: {formData.location.lat.toFixed(4)}° N, {formData.location.lng.toFixed(4)}° E
              </p>
            )}
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                placeholder="+91 98220 12345"
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Official Email *</label>
              <input
                type="email"
                required
                placeholder="contact@org.org"
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Website URL</label>
              <input
                type="url"
                placeholder="https://organization.org"
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>
          </div>

          {/* Food Types Accepted & Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Types of Food Accepted
              </label>
              <div className="flex flex-wrap gap-2">
                {['Cooked Food', 'Raw Grains', 'Packaged Food', 'Bakery Items', 'Vegetables'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleFoodTypeToggle(type)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      formData.foodTypesAccepted.includes(type)
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Distribution Capacity
              </label>
              <select
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none font-medium"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              >
                <option value="200 meals/day">200 meals/day (Small Community Center)</option>
                <option value="500 meals/day">500 meals/day (Medium Shelter)</option>
                <option value="1000 meals/day">1000 meals/day (Large Feeding Foundation)</option>
                <option value="2500+ meals/day">2500+ meals/day (City-wide Network)</option>
              </select>
            </div>
          </div>

          {/* Verification Status */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Registration Type / Verification Status
            </label>
            <select
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none font-bold"
              value={formData.verificationStatus}
              onChange={(e) => setFormData({ ...formData, verificationStatus: e.target.value })}
            >
              <option value="COMMUNITY_RECEIVER">Community Receiver (Standard Registration)</option>
              <option value="VERIFIED_PARTNER">Verified Partner (Verified Registration / Partner NGO)</option>
              <option value="PENDING">Pending Verification Audit</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering...' : 'REGISTER ORGANIZATION'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default RegisterNGOModal;
