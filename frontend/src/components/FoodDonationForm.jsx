import React, { useState } from 'react';
import { getCurrentUserLocation, reverseGeocodeCoords, geocodeAddress } from '../services/mapsService';
import { Utensils, Clock, MapPin, ShieldAlert, Crosshair, CheckCircle2, Info, ArrowRight } from 'lucide-react';

const FoodDonationForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    foodType: 'Cooked Meals',
    quantity: '25',
    unit: 'meals',
    excessDetails: '',
    condition: 'Fresh',
    expiryDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10),
    preparedDate: new Date().toISOString().slice(0, 10),
    storageCondition: 'Normal',
    pickupLocation: 'FC Road, Deccan Gymkhana, Pune',
    pickupCoords: { lat: 18.5196, lng: 73.8412 },
    availabilityDate: new Date().toISOString().slice(0, 10),
    availabilityTime: '14:00 - 18:00',
    notes: '',
    urgency: 'HIGH'
  });

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleUseCurrentLocation = async () => {
    try {
      setGpsLoading(true);
      setValidationError('');
      const coords = await getCurrentUserLocation();
      const address = await reverseGeocodeCoords(coords);
      
      setFormData(prev => ({
        ...prev,
        pickupLocation: address,
        pickupCoords: coords
      }));
      setGpsSuccess(true);
      setTimeout(() => setGpsSuccess(false), 4000);
    } catch (err) {
      setValidationError(err.message || 'Unable to retrieve location. Please check browser permissions.');
    } finally {
      setGpsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (formData.expiryDate) {
      const exp = new Date(formData.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (exp < today) {
        setValidationError('Expired food items cannot be accepted. Food donations must be fresh and safe.');
        return;
      }
    }

    if (!formData.title || !formData.quantity || !formData.pickupLocation) {
      setValidationError('Please complete all required fields marked with *.');
      return;
    }

    let resolvedCoords = formData.pickupCoords;
    if (!resolvedCoords || (resolvedCoords.lat === 18.5196 && resolvedCoords.lng === 73.8412)) {
      resolvedCoords = await geocodeAddress(formData.pickupLocation);
    }

    onSubmit({
      ...formData,
      pickupCoords: resolvedCoords,
      category: 'Food',
      itemName: formData.foodType
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-[#161918] p-6 sm:p-8 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 space-y-6 text-xs sm:text-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Surplus Food Logging</span>
          <h3 className="text-lg font-bold text-stone-900 dark:text-white flex items-center mt-0.5">
            <Utensils className="w-4 h-4 mr-2 text-[#1B4332] dark:text-emerald-400" />
            Donate Surplus Food
          </h3>
        </div>
        <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
          Safety Standards
        </span>
      </div>

      {/* Advisory Banner */}
      <div className="bg-stone-50 dark:bg-stone-900/60 p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 flex items-start space-x-2.5 text-xs text-stone-600 dark:text-stone-300">
        <Info className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-stone-900 dark:text-white">Volunteer Pickup Notice: </span>
          The entered pickup address and GPS coordinates will be sent directly to the assigned volunteer rider for physical collection.
        </div>
      </div>

      {validationError && (
        <div className="bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-3.5 rounded-xl flex items-center space-x-2 font-medium text-xs">
          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* SECTION 1: FOOD DETAILS */}
      <div className="space-y-4">
        <div>
          <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">Listing Title *</label>
          <input
            type="text"
            required
            placeholder="e.g. 25 Fresh Cooked Meal Trays (Rice & Veggies)"
            className="w-full p-2.5 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-white outline-none focus:border-[#1B4332]"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">Food Category *</label>
            <select
              className="w-full p-2.5 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-white outline-none"
              value={formData.foodType}
              onChange={(e) => setFormData({ ...formData, foodType: e.target.value })}
            >
              <option value="Cooked Meals">Cooked Meals / Buffet Surplus</option>
              <option value="Rice">Rice & Grains</option>
              <option value="Wheat & Flour">Wheat & Flour</option>
              <option value="Dal & Pulses">Dal & Pulses</option>
              <option value="Vegetables">Fresh Vegetables</option>
              <option value="Fruits">Fresh Fruits</option>
              <option value="Packaged Food">Packaged Goods</option>
              <option value="Bakery & Bread">Bakery & Bread</option>
              <option value="Dairy & Milk">Dairy Products</option>
              <option value="Other">Other Items</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">Quantity *</label>
            <input
              type="number"
              required
              min="1"
              className="w-full p-2.5 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-white outline-none"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">Unit *</label>
            <select
              className="w-full p-2.5 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-white outline-none"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            >
              <option value="meals">meals / portions</option>
              <option value="kg">kg</option>
              <option value="grams">grams</option>
              <option value="litres">litres</option>
              <option value="packets">packets / boxes</option>
              <option value="sacks">sacks / bags</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
            Excess Details (Optional description)
          </label>
          <input
            type="text"
            placeholder="e.g. Unserved buffet trays stored in thermal boxes immediately after event"
            className="w-full p-2.5 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-white outline-none"
            value={formData.excessDetails}
            onChange={(e) => setFormData({ ...formData, excessDetails: e.target.value })}
          />
        </div>
      </div>

      {/* SECTION 2: PICKUP LOCATION & GPS */}
      <div className="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-3">
        <div className="flex justify-between items-center">
          <label className="block font-semibold text-stone-700 dark:text-stone-300">
            Pickup Address & GPS Pin *
          </label>
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={gpsLoading}
            className="inline-flex items-center text-xs font-semibold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 transition-colors"
          >
            <Crosshair className={`w-3.5 h-3.5 mr-1 ${gpsLoading ? 'animate-spin' : ''}`} />
            <span>{gpsLoading ? 'Locating...' : 'Use My Current Location'}</span>
          </button>
        </div>

        <div className="relative">
          <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            required
            placeholder="Enter physical address where food can be picked up..."
            className="w-full pl-9 pr-4 py-2.5 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-white outline-none focus:border-[#1B4332]"
            value={formData.pickupLocation}
            onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
          />
        </div>

        {formData.pickupCoords && (
          <p className="text-[11px] font-mono text-stone-500 flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5" />
            GPS Pin: {formData.pickupCoords.lat.toFixed(4)}° N, {formData.pickupCoords.lng.toFixed(4)}° E
          </p>
        )}

        {gpsSuccess && (
          <p className="text-xs text-emerald-700 font-semibold flex items-center">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            GPS location captured successfully.
          </p>
        )}
      </div>

      {/* SECTION 3: TIMING & HANDLING */}
      <div className="pt-2 border-t border-stone-200 dark:border-stone-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
            Pickup Time Window *
          </label>
          <select
            className="w-full p-2.5 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-white outline-none"
            value={formData.availabilityTime}
            onChange={(e) => setFormData({ ...formData, availabilityTime: e.target.value })}
          >
            <option value="Immediate (Within 1 hour)">Immediate (Within 1 hour)</option>
            <option value="12:00 - 15:00">Afternoon (12:00 - 15:00)</option>
            <option value="15:00 - 18:00">Evening (15:00 - 18:00)</option>
            <option value="18:00 - 21:00">Night (18:00 - 21:00)</option>
            <option value="Anytime Today">Anytime Today</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">Prepared Date</label>
          <input
            type="date"
            className="w-full p-2.5 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-white outline-none"
            value={formData.preparedDate}
            onChange={(e) => setFormData({ ...formData, preparedDate: e.target.value })}
          />
        </div>

        <div>
          <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">Best Before / Expiry *</label>
          <input
            type="date"
            required
            className="w-full p-2.5 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-white outline-none"
            value={formData.expiryDate}
            onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
          />
        </div>
      </div>

      {/* Special Notes */}
      <div>
        <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">
          Special Notes for Volunteer Rider
        </label>
        <textarea
          rows="2"
          placeholder="e.g. Collect from kitchen rear entrance. Call donor upon reaching."
          className="w-full p-2.5 border border-stone-300 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-white outline-none"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 pt-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-semibold rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="flex-1 py-3 bg-[#1B4332] hover:bg-[#143326] text-white font-bold rounded-xl shadow-xs transition-colors"
        >
          Submit Donation & Generate Map Route
        </button>
      </div>

    </form>
  );
};

export default FoodDonationForm;
