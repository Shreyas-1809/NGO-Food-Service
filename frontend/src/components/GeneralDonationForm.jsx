import React, { useState } from 'react';
import { Package, CheckCircle2 } from 'lucide-react';

const GeneralDonationForm = ({ category = 'Clothes', onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    itemName: '',
    category: category,
    quantity: '10',
    unit: 'Pieces',
    condition: 'Good',
    description: '',
    pickupLocation: 'Kothrud, Pune',
    availabilityDate: new Date().toISOString().slice(0, 10),
    availabilityTime: '10:00 - 17:00',
    urgency: 'MEDIUM',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.itemName || !formData.quantity) return;

    onSubmit({
      ...formData,
      title: formData.title || `${formData.quantity} ${formData.unit} of ${formData.itemName}`
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4 text-xs sm:text-sm">
      
      <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center">
          <Package className="w-5 h-5 mr-2 text-emerald-600" /> {category.toUpperCase()} SURPLUS DONATION FORM
        </h3>
      </div>

      <div>
        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Item Name</label>
        <input
          type="text"
          required
          placeholder="e.g. Children Sweaters, Textbooks, Dell Laptops"
          className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
          value={formData.itemName}
          onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          <input
            type="text"
            required
            placeholder="Pieces, Units, Sets"
            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Item Condition</label>
          <select
            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
            value={formData.condition}
            onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
          >
            <option value="New">New / Sealed</option>
            <option value="Like New">Like New</option>
            <option value="Good">Good</option>
            <option value="Used">Used / Refurbished</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Pickup Location</label>
        <input
          type="text"
          required
          placeholder="e.g., Kothrud, Pune"
          className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
          value={formData.pickupLocation}
          onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
        />
      </div>

      <div>
        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Item Description & Notes</label>
        <textarea
          rows="2"
          placeholder="Include details on size, working condition, accessories included..."
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
            className="flex-1 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold rounded-xl"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
        >
          SUBMIT SURPLUS DONATION
        </button>
      </div>

    </form>
  );
};

export default GeneralDonationForm;
