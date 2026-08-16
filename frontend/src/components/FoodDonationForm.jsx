import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Utensils, Calendar, Clock, MapPin, ShieldAlert } from 'lucide-react';

const FoodDonationForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    foodType: 'Rice',
    quantity: '20',
    unit: 'kg',
    condition: 'Fresh',
    expiryDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString().slice(0, 10),
    preparedDate: new Date().toISOString().slice(0, 10),
    storageCondition: 'Normal',
    pickupLocation: 'FC Road, Deccan Gymkhana, Pune',
    availabilityDate: new Date().toISOString().slice(0, 10),
    availabilityTime: '12:00 - 18:00',
    description: '',
    urgency: 'HIGH'
  });

  const [validationError, setValidationError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    // Check if food is expired
    if (formData.expiryDate) {
      const exp = new Date(formData.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (exp < today) {
        setValidationError('⚠️ Cannot submit clearly expired food items. Food donations must be fresh and safe for consumption.');
        return;
      }
    }

    if (!formData.title || !formData.quantity) {
      setValidationError('Please fill out all required fields.');
      return;
    }

    onSubmit({
      ...formData,
      category: 'Food',
      itemName: formData.foodType
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-5 text-xs sm:text-sm">
      
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center">
          <Utensils className="w-5 h-5 mr-2 text-emerald-600" /> Food & Groceries Surplus Form
        </h3>
        <span className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-full font-bold">
          Food Safety Standards Apply
        </span>
      </div>

      {validationError && (
        <div className="bg-red-50 dark:bg-red-950/80 border-2 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-2xl flex items-center space-x-3 font-bold text-xs shadow-sm animate-in fade-in duration-200">
          <ShieldAlert className="w-6 h-6 text-red-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      <div>
        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Listing Title</label>
        <input
          type="text"
          required
          placeholder="e.g., 20 kg Fresh Basmati Rice Stock"
          className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Food Type</label>
          <select
            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
            value={formData.foodType}
            onChange={(e) => setFormData({ ...formData, foodType: e.target.value })}
          >
            <option value="Rice">Rice</option>
            <option value="Wheat">Wheat</option>
            <option value="Dal">Dal</option>
            <option value="Pulses">Pulses</option>
            <option value="Fruits">Fruits</option>
            <option value="Vegetables">Vegetables</option>
            <option value="Packaged Food">Packaged Food</option>
            <option value="Cooked Food">Cooked Food</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Quantity</label>
          <input
            type="number"
            required
            min="1"
            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Unit</label>
          <select
            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
          >
            <option value="kg">kg</option>
            <option value="grams">grams</option>
            <option value="litres">litres</option>
            <option value="packets">packets</option>
            <option value="boxes">boxes</option>
            <option value="meals">meals / portions</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Condition</label>
          <select
            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
            value={formData.condition}
            onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
          >
            <option value="Fresh">Fresh</option>
            <option value="Packaged">Packaged</option>
            <option value="Cooked">Cooked</option>
            <option value="Sealed">Sealed</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Storage Condition</label>
          <select
            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
            value={formData.storageCondition}
            onChange={(e) => setFormData({ ...formData, storageCondition: e.target.value })}
          >
            <option value="Normal">Normal Room Temp</option>
            <option value="Refrigerated">Refrigerated</option>
            <option value="Frozen">Frozen</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Urgency</label>
          <select
            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
            value={formData.urgency}
            onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
          >
            <option value="HIGH">🔴 Urgent / Expires Soon</option>
            <option value="MEDIUM">🟡 Medium</option>
            <option value="NORMAL">🟢 Normal</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Expiry Date</label>
          <input
            type="date"
            required
            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
            value={formData.expiryDate}
            onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Preparation Date (If Cooked)</label>
          <input
            type="date"
            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
            value={formData.preparedDate}
            onChange={(e) => setFormData({ ...formData, preparedDate: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Pickup Location</label>
        <input
          type="text"
          required
          placeholder="e.g., FC Road, Deccan Gymkhana, Pune"
          className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
          value={formData.pickupLocation}
          onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
        />
      </div>

      <div>
        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description & Safety Notes</label>
        <textarea
          rows="2"
          placeholder="Packaging details, vehicle requirement, hygiene certifications..."
          className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        ></textarea>
      </div>

      <div className="flex space-x-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
        >
          SUBMIT SURPLUS FOOD DONATION
        </button>
      </div>

    </form>
  );
};

export default FoodDonationForm;
