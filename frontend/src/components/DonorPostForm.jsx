import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Clock, MapPin, UploadCloud, X, CheckCircle, Building2, CheckCircle2 } from 'lucide-react';
import { T, useTranslatedString } from '../context/LanguageContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const toLocalISOString = (date = new Date()) => {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const DonorPostForm = ({ _socket, user, token, prefill = null, onSuccess }) => {
  const defaultAddress = user?.address || user?.businessDetails?.shopAddress || '';
  
  const [sharedFields, setSharedFields] = useState({
    pickupAddress: defaultAddress,
    startTime: toLocalISOString(new Date()),
    endTime: toLocalISOString(new Date(Date.now() + 2 * 60 * 60 * 1000))
  });

  const createEmptyItem = () => ({
    id: crypto.randomUUID(),
    itemName: prefill?.foodType || prefill?.item || '',
    foodType: 'VEG',
    category: prefill?.category || 'Cooked Meal',
    quantity: prefill?.quantity || '',
    unit: prefill?.unit || 'servings',
    preparedTime: toLocalISOString(new Date()),
    expiryTime: toLocalISOString(new Date(Date.now() + 4 * 60 * 60 * 1000))
  });

  const [items, setItems] = useState([createEmptyItem()]);
  const [photos, setPhotos] = useState([]);
  const [autoDeleteValue, setAutoDeleteValue] = useState('');
  const [autoDeleteUnit, setAutoDeleteUnit] = useState('HOURS');

  // Placeholders
  const addressPlaceholder = useTranslatedString('Street address, city');
  const foodTitlePlaceholder = useTranslatedString('e.g., Veg Fried Rice');
  const quantityPlaceholder = useTranslatedString('Amount');

  useEffect(() => {
    if (prefill) {
      if (prefill.isEdit) {
        setSharedFields({
          pickupAddress: prefill.pickupAddress || defaultAddress,
          startTime: prefill.pickupTimeSlot?.start ? toLocalISOString(new Date(prefill.pickupTimeSlot.start)) : toLocalISOString(new Date()),
          endTime: prefill.pickupTimeSlot?.end ? toLocalISOString(new Date(prefill.pickupTimeSlot.end)) : toLocalISOString(new Date(Date.now() + 2 * 60 * 60 * 1000))
        });
        
        if (prefill.items && prefill.items.length > 0) {
          setItems(prefill.items.map(item => ({
            id: crypto.randomUUID(),
            itemName: item.itemName || '',
            foodType: item.foodType || 'VEG',
            category: item.category || 'Cooked Meal',
            quantity: item.quantity || '',
            unit: item.unit || 'servings',
            preparedTime: item.preparedTime ? toLocalISOString(new Date(item.preparedTime)) : toLocalISOString(new Date()),
            expiryTime: item.expiryTime ? toLocalISOString(new Date(item.expiryTime)) : toLocalISOString(new Date(Date.now() + 4 * 60 * 60 * 1000))
          })));
        }

        if (prefill.photos && prefill.photos.length > 0) {
          setPhotos(prefill.photos);
        }
      } else {
        setItems([{
          id: crypto.randomUUID(),
          itemName: prefill.foodType || prefill.item || '',
          foodType: 'VEG',
          category: prefill.category || 'Cooked Meal',
          quantity: prefill.quantity || '',
          unit: prefill.unit || 'servings',
          preparedTime: toLocalISOString(new Date()),
          expiryTime: toLocalISOString(new Date(Date.now() + 4 * 60 * 60 * 1000))
        }]);
      }
    }
  }, [prefill, defaultAddress]);

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
    if (value === 'raw_produce') hoursToAdd = 48; // 2 days
    else if (value === 'baked_goods') hoursToAdd = 24; // 1 day
    else if (value === 'packaged') hoursToAdd = 720; // 30 days
    
    newItems[index].expiryTime = toLocalISOString(new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000));
    setItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleMultiPhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (indexToRemove) => {
    setPhotos(photos.filter((_, index) => index !== indexToRemove));
  };

  const addItem = () => setItems([...items, createEmptyItem()]);

  const removeItem = (idToRemove) => {
    if (items.length === 1) return;
    setItems(items.filter(item => item.id !== idToRemove));
  };

  const isSubmittingRef = React.useRef(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingRef.current || isSubmitting) return;
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

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    const processedItems = items.map(item => ({
      itemName: item.itemName,
      quantity: Number(item.quantity),
      foodType: item.foodType,
      category: item.category,
      unit: item.unit,
      preparedTime: new Date(item.preparedTime).toISOString(),
      expiryTime: new Date(item.expiryTime).toISOString()
    }));

    const minExpiry = new Date(Math.min(...processedItems.map(i => new Date(i.expiryTime).getTime())));
    const isAnyNonVeg = processedItems.some(i => i.foodType === 'NON-VEG');
    const totalQuantity = processedItems.reduce((acc, curr) => acc + curr.quantity, 0);
    const mainTitle = processedItems.length > 1 ? "Assorted Surplus Batch" : processedItems[0].itemName;

    // Dynamically geocode pickupAddress or use user's real saved profile coordinates
    let pickupCoords = null;
    const userSaved = user?.location;
    if (userSaved?.coordinates && Array.isArray(userSaved.coordinates) && userSaved.coordinates.length >= 2) {
      const lng = Number(userSaved.coordinates[0]);
      const lat = Number(userSaved.coordinates[1]);
      if (Number.isFinite(lat) && Number.isFinite(lng) && !(Math.abs(lat) < 1e-6 && Math.abs(lng) < 1e-6)) {
        pickupCoords = { lat, lng };
      }
    } else if (userSaved && Number.isFinite(userSaved.lat) && Number.isFinite(userSaved.lng) && !(Math.abs(userSaved.lat) < 1e-6 && Math.abs(userSaved.lng) < 1e-6)) {
      pickupCoords = { lat: userSaved.lat, lng: userSaved.lng };
    }

    try {
      if (sharedFields.pickupAddress) {
        const { geocodeAddress } = await import('../services/mapsService');
        const resolved = await geocodeAddress(sharedFields.pickupAddress);
        if (resolved && Number.isFinite(resolved.lat) && Number.isFinite(resolved.lng)) {
          pickupCoords = resolved;
        }
      }
    } catch (geoErr) {
      console.warn('Geocoding pickupAddress failed:', geoErr);
    }

    const targetNeedId = prefill?.requirementId || prefill?.needId;

    const newFood = {
      title: mainTitle,
      quantity: totalQuantity,
      foodType: isAnyNonVeg ? 'NON-VEG' : 'VEG',
      preparedTime: new Date(processedItems[0].preparedTime).toISOString(),
      expiryTime: minExpiry.toISOString(),
      items: processedItems,
      overallExpiry: minExpiry.toISOString(),
      photos: photos,
      autoDeleteValue: autoDeleteValue ? Number(autoDeleteValue) : null,
      autoDeleteUnit: autoDeleteUnit,
      ...(targetNeedId ? { requirementId: targetNeedId, needId: targetNeedId } : {}),
      ...(pickupCoords ? { location: { type: 'Point', coordinates: [pickupCoords.lng, pickupCoords.lat] } } : {}),
      pickupAddress: sharedFields.pickupAddress,
      pickupTimeSlot: {
        start: new Date(sharedFields.startTime).toISOString(),
        end: new Date(sharedFields.endTime).toISOString()
      }
    };
    
    try {
      if (prefill?.isEdit) {
        await axios.patch(`${API_URL}/api/food/${prefill._id}`, newFood, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/api/food`, newFood, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setSuccessToast(true);

      // Reset form state immediately on success
      setItems([createEmptyItem()]);
      setPhotos([]);
      setSharedFields({
        pickupAddress: defaultAddress,
        startTime: toLocalISOString(new Date()),
        endTime: toLocalISOString(new Date(Date.now() + 2 * 60 * 60 * 1000))
      });
      setAutoDeleteValue('');
      setAutoDeleteUnit('HOURS');
      setError('');

      isSubmittingRef.current = false;
      setIsSubmitting(false);
      if (onSuccess) onSuccess();
      setTimeout(() => setSuccessToast(false), 3000);
    } catch (err) {
      console.error("Submit Error:", err);
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      
      if (err.response) {
        if (err.response.status === 413) {
          setError('The attached images are too large. Please upload smaller images or fewer of them.');
        } else {
          setError(err.response.data?.message || `Server Error (${err.response.status}). Please try again.`);
        }
      } else if (err.request) {
        setError('Network error. Please check your connection and ensure the server is running.');
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="w-full bg-white dark:bg-[#0F1A33] p-6 sm:p-8 rounded-2xl shadow-xl border border-[#E5E1D8] dark:border-[#1E2D52] max-h-[90vh] overflow-y-auto relative">
      {/* Success Toast */}
      {successToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#F3F0EA] text-[#18315E] dark:bg-[#0F1A33]/90 dark:text-white px-6 py-3 rounded-full font-bold shadow-xl flex items-center z-50 animate-in slide-in-from-top-4 text-xs sm:text-sm">
          <CheckCircle className="w-5 h-5 mr-2 text-[#18315E] dark:text-[#D9B65D] shrink-0" />
          {prefill?.isEdit ? <T text="Listing updated successfully!" /> : prefill?.targetNgoName ? <T text="Donation posted successfully" /> : <T text="Successfully posted surplus to Live Feed!" />}
        </div>
      )}

      {/* Direct NGO Receiver Target Banner */}
      {prefill?.targetNgoName && (
        <div className="bg-[#F3F0EA] dark:bg-[#0F1A33]/70 p-4 sm:p-5 rounded-2xl border border-[#E5E1D8] dark:border-[#1E2D52]/80 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#173B78] text-white flex items-center justify-center font-black shadow-sm shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-extrabold uppercase text-[#18315E] dark:text-[#D9B65D] tracking-wider">
                  <T text="Direct Receiver Connection" />
                </span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-[#173B78] text-white">
                  <T text="Target NGO" />
                </span>
              </div>
              <h3 className="text-base font-bold text-[#18315E] dark:text-white">
                <T text="Donating Directly for" /> {prefill.targetNgoName}
              </h3>
              <p className="text-xs text-[#60708B] dark:text-slate-300">
                <T text="Fulfilling shortage request:" /> <strong className="text-[#18315E] dark:text-[#D9B65D]">{prefill.quantity} {prefill.unit || 'units'} {prefill.foodType || prefill.item}</strong>
              </p>
            </div>
          </div>
          
          <span className="text-xs font-bold text-[#18315E] dark:text-[#D9B65D] bg-white dark:bg-[#0F1A33] px-3 py-1.5 rounded-xl border border-[#E5E1D8] dark:border-[#1E2D52] shrink-0 text-center">
            <CheckCircle2 size={14} className="inline-block mr-1 align-middle" /> <T text="Shortage Pre-Filled" />
          </span>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#60708B] dark:text-slate-300 block">
            {prefill?.isEdit ? <T text="Edit Surplus Mode" /> : prefill?.targetNgoName ? <T text="Direct Donation Flow" /> : <T text="SURPLUS RESCUE FLOW" />}
          </span>
          <h2 className="text-2xl font-black text-[#18315E] dark:text-white">
            {prefill?.isEdit ? <T text="Edit Surplus Food" /> : prefill?.targetNgoName ? <T text={`Donate to ${prefill.targetNgoName}`} /> : <T text="Log Surplus Food" />}
          </h2>
        </div>
      </div>
      
      {error && (
        <div className="bg-[#F3F0EA] dark:bg-[#0F1A33]/50 text-[#18315E] dark:text-[#D9B65D] p-3 rounded-xl mb-4 text-xs font-semibold text-center border border-[#E5E1D8] dark:border-[#1E2D52]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Shared Logistics Section */}
        <div className="bg-[#F3F0EA] dark:bg-[#0F1A33]/50 p-4 rounded-xl border border-[#E5E1D8] dark:border-[#1E2D52] space-y-4">
          <h3 className="text-sm font-bold text-[#60708B] dark:text-slate-300 uppercase tracking-wider flex items-center">
            <MapPin className="w-4 h-4 mr-1.5 shrink-0" /> <T text="PICKUP DETAILS" />
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#18315E] dark:text-slate-300 mb-1"><T text="Pickup Address" /></label>
              <div className="relative">
                <input 
                  type="text" 
                  required 
                  className="w-full pl-10 pr-4 py-2 border border-[#E5E1D8] dark:border-[#1E2D52] rounded-lg focus:ring-2 focus:ring-[#E5E1D8] outline-none bg-white dark:bg-[#0F1A33] text-[#18315E] dark:text-white"
                  value={sharedFields.pickupAddress}
                  onChange={e => setSharedFields({...sharedFields, pickupAddress: e.target.value})}
                  placeholder={addressPlaceholder}
                />
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#60708B] shrink-0" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#18315E] dark:text-slate-300 mb-1"><T text="Available From" /></label>
                <input 
                  type="datetime-local" 
                  required
                  className="w-full px-4 py-2 border border-[#E5E1D8] dark:border-[#1E2D52] rounded-lg focus:ring-2 focus:ring-[#E5E1D8] outline-none bg-white dark:bg-[#0F1A33] text-[#18315E] dark:text-white"
                  value={sharedFields.startTime}
                  onChange={e => setSharedFields({...sharedFields, startTime: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#18315E] dark:text-slate-300 mb-1"><T text="Available Until" /></label>
                <input 
                  type="datetime-local" 
                  required
                  className="w-full px-4 py-2 border border-[#E5E1D8] dark:border-[#1E2D52] rounded-lg focus:ring-2 focus:ring-[#E5E1D8] outline-none bg-white dark:bg-[#0F1A33] text-[#18315E] dark:text-white"
                  value={sharedFields.endTime}
                  onChange={e => setSharedFields({...sharedFields, endTime: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Item Blocks */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#E5E1D8] dark:border-[#1E2D52] pb-2">
            <h3 className="text-sm font-bold text-[#60708B] dark:text-slate-300 uppercase tracking-wider"><T text="ITEMS" /></h3>
          </div>
          
          <div className="space-y-6">
            {items.map((item, index) => (
              <div key={item.id} className="bg-white dark:bg-[#0F1A33] p-5 rounded-xl border border-[#E5E1D8] dark:border-[#1E2D52] shadow-sm relative group">
                {items.length > 1 && (
                  <button 
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="absolute -top-3 -right-3 bg-[#F3F0EA] text-[#18315E] hover:bg-[#F3F0EA] p-1.5 rounded-full shadow-sm transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                
                <div className="flex flex-col md:flex-row gap-5">
                  {/* Form Fields */}
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-12 sm:col-span-6">
                        <label className="block text-xs font-medium text-[#60708B] dark:text-slate-300 mb-1"><T text="Food Name / Title" /></label>
                        <input 
                          type="text" 
                          required
                          placeholder={foodTitlePlaceholder}
                          className="w-full px-3 py-2 text-sm border border-[#E5E1D8] dark:border-[#1E2D52] rounded-md focus:ring-2 focus:ring-[#E5E1D8] outline-none bg-white dark:bg-[#0F1A33] text-[#18315E] dark:text-white"
                          value={item.itemName}
                          onChange={e => handleItemChange(index, 'itemName', e.target.value)}
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-3">
                        <label className="block text-xs font-medium text-[#60708B] dark:text-slate-300 mb-1"><T text="Type" /></label>
                        <select 
                          className="w-full px-3 py-2 text-sm border border-[#E5E1D8] dark:border-[#1E2D52] rounded-md focus:ring-2 focus:ring-[#E5E1D8] outline-none bg-white dark:bg-[#0F1A33] text-[#18315E] dark:text-white cursor-pointer"
                          value={item.foodType}
                          onChange={e => handleItemChange(index, 'foodType', e.target.value)}
                        >
                          <option value="veg" className="bg-white dark:bg-[#0F1A33]"><T text="category.veg" /></option>
                          <option value="non_veg" className="bg-white dark:bg-[#0F1A33]"><T text="category.non_veg" /></option>
                        </select>
                      </div>
                      <div className="col-span-6 sm:col-span-3">
                        <label className="block text-xs font-medium text-[#60708B] dark:text-slate-300 mb-1"><T text="Category" /></label>
                        <select 
                          className="w-full px-3 py-2 text-sm border border-[#E5E1D8] dark:border-[#1E2D52] rounded-md focus:ring-2 focus:ring-[#E5E1D8] outline-none bg-white dark:bg-[#0F1A33] text-[#18315E] dark:text-white cursor-pointer"
                          value={item.category}
                          onChange={e => handleCategoryChange(index, e.target.value)}
                        >
                          <option value="cooked_meal" className="bg-white dark:bg-[#0F1A33]"><T text="category.cooked_meal" /></option>
                          <option value="raw_produce" className="bg-white dark:bg-[#0F1A33]"><T text="category.raw_produce" /></option>
                          <option value="baked_goods" className="bg-white dark:bg-[#0F1A33]"><T text="category.baked_goods" /></option>
                          <option value="packaged" className="bg-white dark:bg-[#0F1A33]"><T text="category.packaged" /></option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-6 sm:col-span-4">
                        <label className="block text-xs font-medium text-[#60708B] dark:text-slate-300 mb-1"><T text="Quantity" /></label>
                        <input 
                          type="number" 
                          required
                          min="0.1" step="any"
                          placeholder={quantityPlaceholder}
                          className="w-full px-3 py-2 text-sm border border-[#E5E1D8] dark:border-[#1E2D52] rounded-md focus:ring-2 focus:ring-[#E5E1D8] outline-none bg-white dark:bg-[#0F1A33] text-[#18315E] dark:text-white"
                          value={item.quantity}
                          onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-2">
                        <label className="block text-xs font-medium text-[#60708B] dark:text-slate-300 mb-1"><T text="Unit" /></label>
                        <select 
                          className="w-full px-3 py-2 text-sm border border-[#E5E1D8] dark:border-[#1E2D52] rounded-md focus:ring-2 focus:ring-[#E5E1D8] outline-none bg-white dark:bg-[#0F1A33] text-[#18315E] dark:text-white cursor-pointer"
                          value={item.unit}
                          onChange={e => handleItemChange(index, 'unit', e.target.value)}
                        >
                          <option value="servings" className="bg-white dark:bg-[#0F1A33]"><T text="servings" /></option>
                          <option value="kg" className="bg-white dark:bg-[#0F1A33]">kg</option>
                          <option value="plates" className="bg-white dark:bg-[#0F1A33]"><T text="plates" /></option>
                          <option value="Liters" className="bg-white dark:bg-[#0F1A33]"><T text="Liters" /></option>
                          <option value="Dozen" className="bg-white dark:bg-[#0F1A33]"><T text="Dozen" /></option>
                        </select>
                      </div>
                      <div className="col-span-6 sm:col-span-3">
                        <label className="block text-xs font-medium text-[#60708B] dark:text-slate-300 mb-1 flex items-center"><Clock className="w-3 h-3 mr-1 shrink-0"/><T text="Prep Time" /></label>
                        <input 
                          type="datetime-local" 
                          required
                          className="w-full px-3 py-2 text-sm border border-[#E5E1D8] dark:border-[#1E2D52] rounded-md focus:ring-2 focus:ring-[#E5E1D8] outline-none bg-white dark:bg-[#0F1A33] text-[#18315E] dark:text-white"
                          value={item.preparedTime}
                          onChange={e => handleItemChange(index, 'preparedTime', e.target.value)}
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-3">
                        <label className="block text-xs font-medium text-[#60708B] dark:text-slate-300 mb-1 flex items-center"><Clock className="w-3 h-3 mr-1 shrink-0"/><T text="Expiry (Auto-set)" /></label>
                        <input 
                          type="datetime-local" 
                          required
                          className="w-full px-3 py-2 text-sm border border-[#E5E1D8] dark:border-[#1E2D52] rounded-md focus:ring-2 focus:ring-[#E5E1D8] outline-none bg-white dark:bg-[#0F1A33] text-[#18315E] dark:text-white"
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
            className="w-full border-2 border-dashed border-[#E5E1D8] dark:border-[#1E2D52] text-[#60708B] dark:text-slate-300 hover:border-[#173B78] hover:text-[#18315E] dark:hover:text-[#D9B65D] hover:bg-[#F3F0EA] dark:hover:bg-[#15223F]/20 py-3 rounded-xl font-bold flex items-center justify-center transition-colors cursor-pointer"
          >
            <Plus className="w-5 h-5 mr-2 shrink-0" /> <T text="Add More Item" />
          </button>
        </div>

        {/* Global Photo Upload Section */}
        <div className="bg-[#F3F0EA] dark:bg-[#0F1A33]/50 p-4 rounded-xl border border-[#E5E1D8] dark:border-[#1E2D52] space-y-4">
          <h3 className="text-sm font-bold text-[#60708B] dark:text-slate-300 uppercase tracking-wider flex items-center">
            <UploadCloud className="w-4 h-4 mr-1.5 shrink-0" /> <T text="Attach Photos" />
          </h3>
          <p className="text-xs text-[#60708B] dark:text-slate-300 -mt-2 mb-3"><T text="Upload clear photos of the food to help organizations verify quality and quantity." /></p>
          
          <div className="flex flex-wrap gap-4 items-start">
            {photos.map((photo, idx) => (
              <div key={idx} className="w-24 h-24 shrink-0 rounded-xl overflow-hidden border-2 border-[#E5E1D8] dark:border-[#1E2D52] relative group">
                <img src={photo} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-[#0D1830]/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="bg-white/80 p-1.5 rounded-full text-[#18315E] hover:text-[#18315E]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            <label className="w-24 h-24 shrink-0 rounded-xl border-2 border-dashed border-[#E5E1D8] dark:border-[#1E2D52] flex flex-col items-center justify-center cursor-pointer hover:border-[#173B78] hover:bg-[#F3F0EA] dark:hover:bg-[#15223F]/20 transition-colors">
              <UploadCloud className="w-6 h-6 text-[#60708B] mb-1" />
              <span className="text-[10px] text-[#60708B]"><T text="Add Image" /></span>
              <input 
                type="file" 
                accept="image/*" 
                multiple
                className="hidden" 
                onChange={handleMultiPhotoUpload}
              />
            </label>
          </div>
        </div>

        {/* Auto-Delete Option */}
        <div className="bg-[#F3F0EA] dark:bg-[#0F1A33]/50 p-4 rounded-xl border border-[#E5E1D8] dark:border-[#1E2D52] space-y-2 mt-6">
          <label className="block text-xs font-bold text-[#18315E] dark:text-slate-300 uppercase tracking-wider flex items-center">
            <Trash2 className="w-4 h-4 mr-1.5 text-[#18315E] shrink-0" /> <T text="Auto-Delete Listing" />
          </label>
          <p className="text-xs text-[#60708B] dark:text-slate-300"><T text="Specify when this listing should be automatically removed from the system to prevent stale posts." /></p>
          <div className="flex flex-wrap gap-3 items-center pt-1">
            <input
              type="number"
              min="1"
              placeholder="e.g. 12"
              value={autoDeleteValue}
              onChange={e => setAutoDeleteValue(e.target.value)}
              className="w-32 px-3 py-2 text-sm border border-[#E5E1D8] dark:border-[#1E2D52] rounded-md focus:ring-2 focus:ring-[#E5E1D8] outline-none bg-white dark:bg-[#0F1A33] text-[#18315E] dark:text-white"
            />
            <select
              value={autoDeleteUnit}
              onChange={e => setAutoDeleteUnit(e.target.value)}
              className="px-3 py-2 text-sm border border-[#E5E1D8] dark:border-[#1E2D52] rounded-md focus:ring-2 focus:ring-[#E5E1D8] outline-none bg-white dark:bg-[#0F1A33] text-[#18315E] dark:text-white font-semibold cursor-pointer"
            >
              <option value="HOURS" className="bg-white dark:bg-[#0F1A33]"><T text="Hours after posting" /></option>
              <option value="DAYS" className="bg-white dark:bg-[#0F1A33]"><T text="Days after posting" /></option>
            </select>
          </div>
        </div>

        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#173B78] text-white font-bold py-4 px-4 rounded-xl hover:bg-[#0F172A] transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-8 text-lg cursor-pointer"
        >
          {isSubmitting ? <T text="Processing..." /> : prefill?.isEdit ? <T text="Save Changes" /> : <T text="Post Surplus Food Listing" />}
        </button>
      </form>
    </div>
  );
};

export default DonorPostForm;










