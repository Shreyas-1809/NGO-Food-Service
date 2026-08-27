import React, { useState } from 'react';
import { 
  AlertCircle, 
  Building2, 
  MapPin, 
  Users, 
  Calendar, 
  CheckCircle2, 
  ArrowRight, 
  Utensils, 
  Package, 
  X,
  Sparkles,
  Phone
} from 'lucide-react';
import { createReceiverRequest, addNotification, getStoredDonations } from '../services/donationService';
import { useNavigate } from 'react-router-dom';

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const OrgPostNeedModal = ({ user, token, onClose, onSuccess }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    item: '',
    category: 'Food',
    quantity: '',
    unit: 'kg',
    urgency: 'HIGH',
    requiredBy: new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10),
    beneficiaries: '120',
    area: user?.address || user?.city || 'Shivajinagar',
    city: user?.city || 'Pune',
    address: user?.address || '',
    phone: user?.phone || '',
    description: ''
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdRequest, setCreatedRequest] = useState(null);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.item.trim()) {
      setError('Please specify the needed item name.');
      return;
    }
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      setError('Please enter a valid target quantity.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Post to backend API
      const res = await axios.post(`${API_URL}/api/needs`, {
        title: formData.item,
        category: formData.category,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        urgency: formData.urgency,
        description: formData.description
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Local fallback sync
      const newReq = createReceiverRequest(formData, user);
      
      setCreatedRequest({
        ...newReq,
        _id: res.data._id,
        item: res.data.title || formData.item,
        quantity: res.data.quantity || formData.quantity,
        unit: res.data.unit || formData.unit,
        urgency: res.data.urgency || formData.urgency
      });

      if (onSuccess) onSuccess(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to post shortage need. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-center items-center p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-2xl relative animate-in zoom-in-95 duration-300 my-8">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-slate-200 flex items-center font-bold text-sm cursor-pointer"
        >
          Close <span className="text-2xl ml-1.5 font-normal">&times;</span>
        </button>

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 dark:from-amber-500/20 dark:via-emerald-500/20 dark:to-teal-500/20 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-md">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                  Organisation Portal
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {createdRequest ? 'Shortage Published Successfully!' : 'Post an Urgent Need / Shortage'}
                </h2>
              </div>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-white/80 dark:bg-slate-800/80 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
              {user?.orgName || user?.name || 'Verified Hub'}
            </span>
          </div>

          {/* Body Content */}
          <div className="p-6">
            
            {/* SUCCESS CONFIRMATION SCREEN */}
            {createdRequest ? (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Your Shortage is Live for Donors & Volunteers
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Matching surplus food donors will be notified immediately. Donors can also fulfill this demand directly from the shortages feed.
                  </p>
                </div>

                {/* Shortage Listing Card Design Confirmation */}
                <div className="max-w-md mx-auto bg-slate-50 dark:bg-slate-900/80 rounded-2xl p-5 shadow-xs border-2 border-emerald-500/80 space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
                          {createdRequest.category || 'Food'} Deficit
                        </span>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                          {createdRequest.item}
                        </h4>
                      </div>
                      
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase shrink-0 ${
                        createdRequest.urgency === 'HIGH'
                          ? 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-200 dark:border-red-900'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                      }`}>
                        {createdRequest.urgency === 'HIGH' ? '🔴 Urgent' : '🟡 Moderate'}
                      </span>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center truncate mr-2">
                          <Building2 className="w-3.5 h-3.5 mr-1 text-teal-600 shrink-0" />
                          <span className="truncate">{createdRequest.ngoName}</span>
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded shrink-0">
                          ✓ Verified
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 flex items-center truncate">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                        {createdRequest.area || createdRequest.city}, {createdRequest.city}
                      </p>
                    </div>

                    <div className="space-y-2 pt-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400">Target Quantity Needed:</span>
                        <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                          {createdRequest.quantity} {createdRequest.unit}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                        <span className="flex items-center text-slate-500 dark:text-slate-400">
                          <Users className="w-3.5 h-3.5 mr-1 text-teal-600" /> Feeding Capacity:
                        </span>
                        <strong className="text-slate-900 dark:text-white">{createdRequest.beneficiaries} people</strong>
                      </div>

                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                        <span className="flex items-center text-slate-500 dark:text-slate-400">
                          <Calendar className="w-3.5 h-3.5 mr-1 text-blue-600" /> Needed By:
                        </span>
                        <strong className="text-slate-900 dark:text-white">{createdRequest.requiredBy}</strong>
                      </div>
                    </div>

                    {createdRequest.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                        "{createdRequest.description}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 max-w-md mx-auto pt-2">
                  <button
                    onClick={() => {
                      onClose();
                      navigate('/requirements');
                    }}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer"
                  >
                    <span>View on Shortages Page</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onClose}
                    className="py-3 px-6 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* POST NEED FORM */
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Section 1: Pickup / Delivery & Hub Location */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center">
                    <Building2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                    Hub & Delivery Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Hub Location / Area <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Shivajinagar Hub / Camp"
                        value={formData.area}
                        onChange={(e) => handleChange('area', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        City
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g. Pune"
                        value={formData.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Detailed Street / Unloading Address
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g. Gate 2, Community Kitchen, 42 University Road"
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Item & Target Quantity */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center">
                    <Utensils className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                    Item & Quantity Needed
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="md:col-span-2">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Item Name / Specific Food Need <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Fresh Cooked Meals, Rice & Pulses, Dry Rations"
                        value={formData.item}
                        onChange={(e) => handleChange('item', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Category
                      </label>
                      <select 
                        value={formData.category}
                        onChange={(e) => handleChange('category', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                      >
                        <option value="Food">Food & Rations</option>
                        <option value="Cooked Meals">Cooked Meals</option>
                        <option value="Clothes">Clothes & Blankets</option>
                        <option value="Books">Educational Materials</option>
                        <option value="Medical Supplies">Medical Supplies</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Target Quantity <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="number"
                        required
                        min="1"
                        placeholder="e.g. 50"
                        value={formData.quantity}
                        onChange={(e) => handleChange('quantity', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Unit
                      </label>
                      <select 
                        value={formData.unit}
                        onChange={(e) => handleChange('unit', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                      >
                        <option value="kg">kg (Kilograms)</option>
                        <option value="Portions">Portions / Meals</option>
                        <option value="Liters">Liters</option>
                        <option value="Packs">Packs / Rations</option>
                        <option value="Boxes">Boxes</option>
                        <option value="Pieces">Pieces / Blankets</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Beneficiaries Count
                      </label>
                      <input 
                        type="number"
                        placeholder="e.g. 120"
                        value={formData.beneficiaries}
                        onChange={(e) => handleChange('beneficiaries', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Urgency & Needed-By Date */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                    Urgency & Schedule
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Urgency Level <span className="text-red-500">*</span>
                      </label>
                      <select 
                        value={formData.urgency}
                        onChange={(e) => handleChange('urgency', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none font-semibold"
                      >
                        <option value="HIGH">🔴 High / Urgent Deficit</option>
                        <option value="MEDIUM">🟡 Medium Priority</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Needed By Date <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="date"
                        required
                        value={formData.requiredBy}
                        onChange={(e) => handleChange('requiredBy', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Special Instructions / Description
                      </label>
                      <textarea 
                        rows="2"
                        placeholder="e.g. Evening distribution for community shelter. Clean packaging preferred."
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-2 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all flex items-center space-x-2 cursor-pointer"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>{isSubmitting ? 'Publishing Shortage...' : 'Publish Need / Shortage'}</span>
                  </button>
                </div>

              </form>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};

export default OrgPostNeedModal;
