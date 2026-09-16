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
// Note: donationService mock imports removed — needs are now fully persisted via /api/needs
import { useNavigate } from 'react-router-dom';
import Modal from './ui/Modal';
import Button from './ui/Button';

import axios from 'axios';
import { T, useTranslatedString } from '../context/LanguageContext';

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
    description: '',
    frequency: 'ONE_TIME'
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdRequest, setCreatedRequest] = useState(null);

  // Placeholders
  const areaPlaceholder = useTranslatedString('e.g. Shivajinagar Hub / Camp');
  const cityPlaceholder = useTranslatedString('e.g. Pune');
  const addressPlaceholder = useTranslatedString('e.g. Gate 2, Community Kitchen, 42 University Road');
  const itemPlaceholder = useTranslatedString('e.g. Fresh Cooked Meals, Rice & Pulses, Dry Rations');
  const qtyPlaceholder = useTranslatedString('e.g. 50');
  const beneficiariesPlaceholder = useTranslatedString('e.g. 120');
  const descPlaceholder = useTranslatedString('e.g. Evening distribution for community shelter. Clean packaging preferred.');

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFrequencyChange = (newFreq) => {
    let newDateStr = formData.requiredBy;
    
    if (newFreq !== 'ONE_TIME') {
      const today = new Date();
      // Handle the math in local timezone to avoid weird day shifts
      const nextDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      if (newFreq === 'DAILY') {
        nextDate.setDate(nextDate.getDate() + 1);
      } else if (newFreq === 'WEEKLY') {
        nextDate.setDate(nextDate.getDate() + 7);
      } else if (newFreq === 'BIWEEKLY') {
        nextDate.setDate(nextDate.getDate() + 14);
      } else if (newFreq === 'MONTHLY') {
        nextDate.setDate(nextDate.getDate() + 30);
      }
      
      const yyyy = nextDate.getFullYear();
      const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
      const dd = String(nextDate.getDate()).padStart(2, '0');
      newDateStr = `${yyyy}-${mm}-${dd}`;
    }

    setFormData(prev => ({
      ...prev,
      frequency: newFreq,
      requiredBy: newDateStr
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.item || !formData.quantity || !formData.area) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (formData.frequency === 'ONE_TIME') {
        const payload = {
          title: formData.item,
          category: formData.category,
          quantity: Number(formData.quantity),
          unit: formData.unit,
          urgency: formData.urgency,
          requiredBy: formData.requiredBy,
          beneficiariesCount: Number(formData.beneficiaries) || 0,
          area: formData.area,
          city: formData.city,
          address: formData.address,
          phone: formData.phone,
          description: formData.description,
          ngoName: user?.orgName || user?.fullName || 'Verified NGO'
        };

        const res = await axios.post(`${API_URL}/api/needs`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setCreatedRequest({
          ...res.data,
          item: res.data.title,
          requiredBy: res.data.requiredBy ? new Date(res.data.requiredBy).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : formData.requiredBy,
          beneficiaries: res.data.beneficiariesCount || formData.beneficiaries
        });

        if (onSuccess) onSuccess(res.data);
      } else {
        // Post to recurring needs API
        const res = await axios.post(`${API_URL}/api/recurring-needs`, {
          title: formData.item,
          category: formData.category,
          quantity: Number(formData.quantity),
          unit: formData.unit,
          urgency: formData.urgency,
          description: formData.description,
          frequency: formData.frequency,
          neededByDate: formData.requiredBy
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setCreatedRequest({
          ...formData,
          _id: res.data._id,
          item: res.data.title || formData.item,
          quantity: res.data.quantity || formData.quantity,
          unit: res.data.unit || formData.unit,
          urgency: res.data.urgency || formData.urgency,
          isRecurring: true
        });

        if (onSuccess) onSuccess(res.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to post shortage need. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={createdRequest ? <T text="Shortage Published Successfully!" /> : <T text="Post an Urgent Need / Shortage" />}
      subtitle={user?.orgName || user?.name || 'Verified Hub'}
      confirmClose={!createdRequest}
    >
      <div className="flex-1 space-y-4">
            
            {/* SUCCESS CONFIRMATION SCREEN */}
            {createdRequest ? (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {createdRequest.isRecurring ? <T text="Recurring Template Created" /> : <T text="Your Shortage is Live for Donors & Volunteers" />}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    {createdRequest.isRecurring 
                      ? <T text={`This request will automatically generate on a ${formData.frequency.toLowerCase()} basis. The first occurrence is live.`} /> 
                      : <T text="Matching surplus food donors will be notified immediately. Donors can also fulfill this demand directly from the shortages feed." />}
                  </p>
                </div>

                {/* Shortage Listing Card Design Confirmation */}
                <div className="max-w-md mx-auto bg-slate-50 dark:bg-slate-900/80 rounded-2xl p-5 shadow-xs border-2 border-emerald-500/80 space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
                          <T text={createdRequest.category || 'Food'} /> <T text="Deficit" />
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
                        {createdRequest.urgency === 'HIGH' ? <T text="🔴 Urgent" /> : <T text="🟡 Moderate" />}
                      </span>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center truncate mr-2">
                          <Building2 className="w-3.5 h-3.5 mr-1 text-teal-600 shrink-0" />
                          <span className="truncate">{createdRequest.ngoName}</span>
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded shrink-0">
                          ✓ <T text="Verified" />
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 flex items-center truncate">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                        {createdRequest.area || createdRequest.city}, {createdRequest.city}
                      </p>
                    </div>

                    <div className="space-y-2 pt-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400"><T text="Target Quantity Needed:" /></span>
                        <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                          {createdRequest.quantity} {createdRequest.unit}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                        <span className="flex items-center text-slate-500 dark:text-slate-400">
                          <Users className="w-3.5 h-3.5 mr-1 text-teal-600 shrink-0" /> <T text="Feeding Capacity:" />
                        </span>
                        <strong className="text-slate-900 dark:text-white">{createdRequest.beneficiaries} <T text="people" /></strong>
                      </div>

                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                        <span className="flex items-center text-slate-500 dark:text-slate-400">
                          <Calendar className="w-3.5 h-3.5 mr-1 text-blue-600 shrink-0" /> <T text="Needed By:" />
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
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={() => {
                      onClose();
                      navigate('/requirements');
                    }}
                    icon={ArrowRight}
                  >
                    <T text="View on Shortages Page" />
                  </Button>
                  <Button
                    variant="secondary"
                    className="px-6"
                    onClick={onClose}
                  >
                    <T text="Done" />
                  </Button>
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
                    <Building2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600 shrink-0" />
                    <T text="Hub & Delivery Details" />
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        <T text="Hub Location / Area" /> <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text"
                        required
                        placeholder={areaPlaceholder}
                        value={formData.area}
                        onChange={(e) => handleChange('area', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        <T text="City" />
                      </label>
                      <input 
                        type="text"
                        placeholder={cityPlaceholder}
                        value={formData.city}
                        onChange={(e) => handleChange('city', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        <T text="Detailed Street / Unloading Address" />
                      </label>
                      <input 
                        type="text"
                        placeholder={addressPlaceholder}
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
                    <Utensils className="w-3.5 h-3.5 mr-1.5 text-emerald-600 shrink-0" />
                    <T text="Item & Quantity Needed" />
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="md:col-span-2">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        <T text="Item Name / Specific Food Need" /> <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text"
                        required
                        placeholder={itemPlaceholder}
                        value={formData.item}
                        onChange={(e) => handleChange('item', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        <T text="Category" />
                      </label>
                      <select 
                        value={formData.category}
                        onChange={(e) => handleChange('category', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium cursor-pointer"
                      >
                        <option value="Food" className="bg-white dark:bg-slate-800"><T text="Food & Rations" /></option>
                        <option value="Cooked Meals" className="bg-white dark:bg-slate-800"><T text="Cooked Meals" /></option>
                        <option value="Clothes" className="bg-white dark:bg-slate-800"><T text="Clothes & Blankets" /></option>
                        <option value="Books" className="bg-white dark:bg-slate-800"><T text="Educational Materials" /></option>
                        <option value="Medical Supplies" className="bg-white dark:bg-slate-800"><T text="Medical Supplies" /></option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        <T text="Target Quantity" /> <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="number"
                        required
                        min="1"
                        placeholder={qtyPlaceholder}
                        value={formData.quantity}
                        onChange={(e) => handleChange('quantity', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        <T text="Unit" />
                      </label>
                      <select 
                        value={formData.unit}
                        onChange={(e) => handleChange('unit', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium cursor-pointer"
                      >
                        <option value="kg" className="bg-white dark:bg-slate-800">kg (Kilograms)</option>
                        <option value="Portions" className="bg-white dark:bg-slate-800"><T text="Portions / Meals" /></option>
                        <option value="Liters" className="bg-white dark:bg-slate-800"><T text="Liters" /></option>
                        <option value="Packs" className="bg-white dark:bg-slate-800"><T text="Packs / Rations" /></option>
                        <option value="Boxes" className="bg-white dark:bg-slate-800"><T text="Boxes" /></option>
                        <option value="Pieces" className="bg-white dark:bg-slate-800"><T text="Pieces / Blankets" /></option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        <T text="Beneficiaries Count" />
                      </label>
                      <input 
                        type="number"
                        placeholder={beneficiariesPlaceholder}
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
                    <T text="Urgency & Schedule" />
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        <T text="Urgency Level" /> <span className="text-red-500">*</span>
                      </label>
                      <select 
                        value={formData.urgency}
                        onChange={(e) => handleChange('urgency', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none font-semibold"
                      >
                        <option value="HIGH">🔴 <T text="High / Urgent Deficit" /></option>
                        <option value="MEDIUM">🟡 <T text="Medium Priority" /></option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        {formData.frequency === 'ONE_TIME' ? <T text="Needed By Date" /> : <T text="First Occurrence Date" />} <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]} // Quick HTML5 validation fallback
                        value={formData.requiredBy}
                        onChange={(e) => handleChange('requiredBy', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        <T text="Frequency" /> <span className="text-red-500">*</span>
                      </label>
                      <select 
                        value={formData.frequency}
                        onChange={(e) => handleFrequencyChange(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none font-semibold"
                      >
                        <option value="ONE_TIME"><T text="One-time Request" /></option>
                        <option value="DAILY"><T text="Daily" /></option>
                        <option value="WEEKLY"><T text="Weekly" /></option>
                        <option value="BIWEEKLY"><T text="Bi-weekly" /></option>
                        <option value="MONTHLY"><T text="Monthly" /></option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        <T text="Special Instructions / Description" />
                      </label>
                      <textarea 
                        rows="2"
                        placeholder={descPlaceholder}
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-2 flex justify-end space-x-3">
                  <Button
                    variant="secondary"
                    onClick={onClose}
                    className="px-5"
                  >
                    <T text="Cancel" />
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="px-6 bg-amber-500 hover:bg-amber-600 text-white"
                    disabled={isSubmitting}
                    loading={isSubmitting}
                    icon={AlertCircle}
                  >
                    <T text="Publish Need / Shortage" />
                  </Button>
                </div>

              </form>
            )}

      </div>
    </Modal>
  );
};

export default OrgPostNeedModal;
