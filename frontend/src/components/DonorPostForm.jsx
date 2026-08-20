import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Clock, MapPin, UploadCloud, X, CheckCircle, Building2, Sparkles, HeartHandshake } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DonorPostForm = ({ socket, user, token, prefill = null, onSuccess }) => {
  const defaultAddress = user?.address || user?.businessDetails?.shopAddress || '';
  
  const [sharedFields, setSharedFields] = useState({
    pickupAddress: defaultAddress,
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16)
  });

  const createEmptyItem = () => ({
    id: crypto.randomUUID(),
    photoUrl: '', // Mocked for now
    itemName: prefill?.foodType || prefill?.item || '',
    foodType: 'VEG',
    category: prefill?.category || 'Cooked Meal',
    quantity: prefill?.quantity || '',
    unit: prefill?.unit || 'servings',
    preparedTime: new Date().toISOString().slice(0, 16),
    expiryTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16)
  });

  const [items, setItems] = useState([createEmptyItem()]);

  useEffect(() => {
    if (prefill) {
      setItems([{
        id: crypto.randomUUID(),
        photoUrl: '',
        itemName: prefill.foodType || prefill.item || '',
        foodType: 'VEG',
        category: prefill.category || 'Cooked Meal',
        quantity: prefill.quantity || '',
        unit: prefill.unit || 'servings',
        preparedTime: new Date().toISOString().slice(0, 16),
        expiryTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16)
      }]);
    }
  }, [prefill]);

  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-suggest expiry based on category
  const handleCategoryChange = (index, value) => {
    const newItems = [...items];
    newItems[index].category = value;
    
    // Auto-suggest expiry
    const now = new Date();
    let hoursToAdd = 4; // Default for Cooked Meal
    if (value === 'Raw Produce') hoursToAdd = 48; // 2 days
    else if (value === 'Baked Goods') hoursToAdd = 24; // 1 day
    else if (value === 'Packaged') hoursToAdd = 720; // 30 days
    
    newItems[index].expiryTime = new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000).toISOString().slice(0, 16);
    setItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handlePhotoUpload = (index, e) => {
    e.preventDefault();
    // Option B: Mock UI for photo upload
    // Set a dummy thumbnail immediately
    const newItems = [...items];
    newItems[index].photoUrl = 'uploaded_mock_image'; // This triggers the UI change
    setItems(newItems);
  };

  const addItem = () => setItems([...items, createEmptyItem()]);

  const removeItem = (idToRemove) => {
    if (items.length === 1) return;
    setItems(items.filter(item => item.id !== idToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!sharedFields.pickupAddress.trim()) {
      setError('Pickup address is required.');
      return;
    }
    if (new Date(sharedFields.endTime) <= new Date(sharedFields.startTime)) {
      setError('Pickup end time must be after start time.');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].itemName || !items[i].quantity) {
        setError(`Please fill out all required fields for item #${i + 1}.`);
        return;
      }
      if (new Date(items[i].expiryTime) <= new Date(items[i].preparedTime)) {
        setError(`Expiry time must be after prep time for ${items[i].itemName || 'item ' + (i+1)}.`);
        return;
      }
    }

    setIsSubmitting(true);

    const processedItems = items.map(item => ({
      itemName: item.itemName,
      quantity: Number(item.quantity),
      foodType: item.foodType,
      category: item.category,
      unit: item.unit,
      preparedTime: new Date(item.preparedTime).toISOString(),
      expiryTime: new Date(item.expiryTime).toISOString(),
      photoUrl: item.photoUrl // passed even if it's mock
    }));

    const minExpiry = new Date(Math.min(...processedItems.map(i => new Date(i.expiryTime).getTime())));
    const isAnyNonVeg = processedItems.some(i => i.foodType === 'NON-VEG');
    const totalQuantity = processedItems.reduce((acc, curr) => acc + curr.quantity, 0);
    const mainTitle = processedItems.length > 1 ? "Assorted Surplus Batch" : processedItems[0].itemName;

    const newFood = {
      title: mainTitle,
      quantity: totalQuantity,
      foodType: isAnyNonVeg ? 'NON-VEG' : 'VEG',
      preparedTime: new Date(processedItems[0].preparedTime).toISOString(),
      expiryTime: minExpiry.toISOString(),
      items: processedItems,
      overallExpiry: minExpiry.toISOString(),
      location: { coordinates: [77.5946, 12.9716] }, // Mock coordinates
      pickupAddress: sharedFields.pickupAddress,
      pickupTimeSlot: {
        start: new Date(sharedFields.startTime).toISOString(),
        end: new Date(sharedFields.endTime).toISOString()
      }
    };
    
    try {
      await axios.post(`${API_URL}/api/food`, newFood, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccessToast(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessToast(false);
        if (onSuccess) onSuccess();
      }, 1500); // Wait 1.5s to show toast before closing
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      setError(err.response?.data?.message || 'Failed to post listing. Please try again.');
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto relative">
      {/* Success Toast */}
      {successToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/90 dark:text-emerald-200 px-6 py-3 rounded-full font-bold shadow-xl flex items-center z-50 animate-in slide-in-from-top-4 text-xs sm:text-sm">
          <CheckCircle className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-400" />
          {prefill?.targetNgoName ? `Surplus logged & allocated for ${prefill.targetNgoName}!` : 'Successfully posted surplus to Live Feed!'}
        </div>
      )}

      {/* Direct NGO Receiver Target Banner */}
      {prefill?.targetNgoName && (
        <div className="bg-emerald-50 dark:bg-emerald-950/70 p-4 sm:p-5 rounded-2xl border border-emerald-300 dark:border-emerald-700/80 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-sm shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-extrabold uppercase text-emerald-700 dark:text-emerald-400 tracking-wider">
                  Direct Receiver Connection
                </span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-600 text-white">
                  Target NGO
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Donating Directly for {prefill.targetNgoName}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Fulfilling shortage request: <strong className="text-emerald-700 dark:text-emerald-400">{prefill.quantity} {prefill.unit || 'units'} {prefill.foodType || prefill.item}</strong>
              </p>
            </div>
          </div>
          
          <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-700 shrink-0 text-center">
            ✓ Shortage Pre-Filled
          </span>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
            {prefill?.targetNgoName ? 'Direct Donation Flow' : 'Surplus Rescue Flow'}
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {prefill?.targetNgoName ? `Donate to ${prefill.targetNgoName}` : 'Log Surplus Food'}
          </h2>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-300 p-3 rounded-xl mb-4 text-xs font-semibold text-center border border-red-200 dark:border-red-900">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Shared Logistics Section */}
        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-200 dark:border-slate-600 space-y-4">
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center">
            <MapPin className="w-4 h-4 mr-1.5" /> Pickup Details
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pickup Address</label>
              <div className="relative">
                <input 
                  type="text" 
                  required 
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  value={sharedFields.pickupAddress}
                  onChange={e => setSharedFields({...sharedFields, pickupAddress: e.target.value})}
                  placeholder="Street address, city"
                />
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Available From</label>
                <input 
                  type="datetime-local" 
                  required
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  value={sharedFields.startTime}
                  onChange={e => setSharedFields({...sharedFields, startTime: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Available Until</label>
                <input 
                  type="datetime-local" 
                  required
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  value={sharedFields.endTime}
                  onChange={e => setSharedFields({...sharedFields, endTime: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Item Blocks */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Items</h3>
          </div>
          
          <div className="space-y-6">
            {items.map((item, index) => (
              <div key={item.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative group">
                {items.length > 1 && (
                  <button 
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="absolute -top-3 -right-3 bg-red-100 text-red-600 hover:bg-red-200 p-1.5 rounded-full shadow-sm transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                
                <div className="flex flex-col md:flex-row gap-5">
                  {/* Photo Upload Area */}
                  <div className="w-full md:w-32 shrink-0">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Photo</label>
                    <div 
                      className={`h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors relative overflow-hidden ${item.photoUrl ? 'border-green-500' : 'border-slate-300 dark:border-slate-600 hover:border-green-500 bg-slate-50 dark:bg-slate-700/50'}`}
                      onClick={(e) => handlePhotoUpload(index, e)}
                    >
                      {item.photoUrl ? (
                        <>
                          <div className="absolute inset-0 bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                            <span className="text-xs font-bold text-green-700 dark:text-green-400">Attached</span>
                          </div>
                          <button 
                            type="button"
                            className="absolute top-1 right-1 bg-white/80 dark:bg-slate-800/80 p-0.5 rounded-full text-slate-600 hover:text-red-500"
                            onClick={(e) => { e.stopPropagation(); handleItemChange(index, 'photoUrl', ''); }}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-6 h-6 text-slate-400 mb-1" />
                          <span className="text-[10px] text-slate-500 text-center px-1">Click to browse</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-12 sm:col-span-6">
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Food Name / Title</label>
                        <input 
                          type="text" 
                          required
                          placeholder="e.g., Veg Fried Rice"
                          className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                          value={item.itemName}
                          onChange={e => handleItemChange(index, 'itemName', e.target.value)}
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-3">
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Type</label>
                        <select 
                          className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                          value={item.foodType}
                          onChange={e => handleItemChange(index, 'foodType', e.target.value)}
                        >
                          <option value="VEG">Veg</option>
                          <option value="NON-VEG">Non-Veg</option>
                        </select>
                      </div>
                      <div className="col-span-6 sm:col-span-3">
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Category</label>
                        <select 
                          className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                          value={item.category}
                          onChange={e => handleCategoryChange(index, e.target.value)}
                        >
                          <option value="Cooked Meal">Cooked Meal</option>
                          <option value="Raw Produce">Raw Produce</option>
                          <option value="Baked Goods">Baked Goods</option>
                          <option value="Packaged">Packaged</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-6 sm:col-span-4">
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Quantity</label>
                        <input 
                          type="number" 
                          required
                          min="0.1" step="any"
                          placeholder="Amount"
                          className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                          value={item.quantity}
                          onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Unit</label>
                        <select 
                          className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                          value={item.unit}
                          onChange={e => handleItemChange(index, 'unit', e.target.value)}
                        >
                          <option value="servings">servings</option>
                          <option value="kg">kg</option>
                          <option value="plates">plates</option>
                          <option value="Liters">Liters</option>
                          <option value="Dozen">Dozen</option>
                        </select>
                      </div>
                      <div className="col-span-6 sm:col-span-3">
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center"><Clock className="w-3 h-3 mr-1"/> Prep Time</label>
                        <input 
                          type="datetime-local" 
                          required
                          className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                          value={item.preparedTime}
                          onChange={e => handleItemChange(index, 'preparedTime', e.target.value)}
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-3">
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center"><Clock className="w-3 h-3 mr-1"/> Expiry (Auto-set)</label>
                        <input 
                          type="datetime-local" 
                          required
                          className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                          value={item.expiryTime}
                          onChange={e => handleItemChange(index, 'expiryTime', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
          
          <button 
            type="button" 
            onClick={addItem}
            className="w-full border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-green-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 py-3 rounded-xl font-bold flex items-center justify-center transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" /> Add More Item
          </button>
        </div>

        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-green-600 text-white font-bold py-4 px-4 rounded-xl hover:bg-green-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-8 text-lg"
        >
          {isSubmitting ? 'Posting...' : 'Post Surplus Food Listing'}
        </button>
      </form>
    </div>
  );
};

export default DonorPostForm;
