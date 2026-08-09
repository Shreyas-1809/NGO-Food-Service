import React, { useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, Clock } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DonorPostForm = ({ socket, token, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    foodType: 'VEG',
    quantity: '' // Total servings
  });

  const [useGlobalTiming, setUseGlobalTiming] = useState(true);
  const [globalPrepared, setGlobalPrepared] = useState(new Date().toISOString().slice(0, 16));
  const [globalExpiry, setGlobalExpiry] = useState(new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16));

  const [items, setItems] = useState([
    {
      itemName: '',
      quantity: '',
      unit: 'Portions',
      preparedTime: new Date().toISOString().slice(0, 16),
      expiryTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16)
    }
  ]);

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, {
      itemName: '',
      quantity: '',
      unit: 'Portions',
      preparedTime: new Date().toISOString().slice(0, 16),
      expiryTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16)
    }]);
  };

  const removeItem = (index) => {
    if (items.length === 1) return;
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate
    for (let i = 0; i < items.length; i++) {
      if (!items[i].itemName || !items[i].quantity) {
        setError('Please fill out all item fields.');
        return;
      }
    }

    setIsSubmitting(true);

    const processedItems = items.map(item => ({
      itemName: item.itemName,
      quantity: Number(item.quantity),
      unit: item.unit,
      preparedTime: new Date(useGlobalTiming ? globalPrepared : item.preparedTime).toISOString(),
      expiryTime: new Date(useGlobalTiming ? globalExpiry : item.expiryTime).toISOString()
    }));

    const minExpiry = new Date(Math.min(...processedItems.map(i => new Date(i.expiryTime).getTime())));

    const newFood = {
      title: formData.title,
      quantity: Number(formData.quantity) || processedItems.reduce((acc, curr) => acc + (curr.unit === 'Portions' ? curr.quantity : 0), 0),
      foodType: formData.foodType,
      preparedTime: new Date(processedItems[0].preparedTime).toISOString(),
      expiryTime: minExpiry.toISOString(),
      items: processedItems,
      overallExpiry: minExpiry.toISOString(),
      location: { coordinates: [77.5946, 12.9716] }, // Mock coordinates
    };
    
    try {
      await axios.post(`${API_URL}/api/food`, newFood, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTimeout(() => {
        setIsSubmitting(false);
        if (onSuccess) onSuccess();
      }, 500);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      setError(err.response?.data?.message || 'Failed to post listing. Please try again.');
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Log Surplus Food</h2>
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium text-center border border-red-200">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Listing Overview */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 pb-2">Listing Overview</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Listing Title</label>
            <input 
              type="text" 
              required 
              placeholder="e.g., Buffet Leftovers, Pav Bhaji Dinner"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Food Category</label>
              <select 
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                value={formData.foodType}
                onChange={e => setFormData({...formData, foodType: e.target.value})}
              >
                <option value="VEG">Vegetarian</option>
                <option value="NON-VEG">Non-Vegetarian</option>
                <option value="RAW PRODUCE">Raw Produce</option>
                <option value="BAKED GOODS">Baked Goods</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Total Estimated Servings</label>
              <input 
                type="number" 
                required 
                min="1"
                placeholder="e.g., 50"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Global Timings Toggle */}
        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-200 dark:border-slate-600 space-y-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input 
              type="checkbox"
              className="w-5 h-5 text-green-600 border-slate-300 rounded focus:ring-green-500"
              checked={useGlobalTiming}
              onChange={e => setUseGlobalTiming(e.target.checked)}
            />
            <span className="font-bold text-slate-800 dark:text-slate-200">Apply same Timing & Shelf Life to all items</span>
          </label>
          
          {useGlobalTiming && (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-600">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Global Prepared Time</label>
                <input 
                  type="datetime-local" 
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  value={globalPrepared}
                  onChange={e => setGlobalPrepared(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Global Expiry Time</label>
                <input 
                  type="datetime-local" 
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  value={globalExpiry}
                  onChange={e => setGlobalExpiry(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Itemized Breakdown */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Item Breakdown</h3>
            <button 
              type="button" 
              onClick={addItem}
              className="text-xs font-bold text-green-600 dark:text-green-400 hover:text-green-700 flex items-center bg-green-50 dark:bg-green-900/30 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
            </button>
          </div>
          
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative group">
                {items.length > 1 && (
                  <button 
                    type="button"
                    onClick={() => removeItem(index)}
                    className="absolute -top-3 -right-3 bg-red-100 text-red-600 hover:bg-red-200 p-1.5 rounded-full shadow-sm transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 sm:col-span-6">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Item Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g., Pav, Rice"
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      value={item.itemName}
                      onChange={e => handleItemChange(index, 'itemName', e.target.value)}
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-3">
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
                  <div className="col-span-6 sm:col-span-3">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Unit</label>
                    <select 
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      value={item.unit}
                      onChange={e => handleItemChange(index, 'unit', e.target.value)}
                    >
                      <option value="Portions">Portions</option>
                      <option value="Kilograms">Kilograms</option>
                      <option value="Dozen">Dozen</option>
                      <option value="Liters">Liters</option>
                    </select>
                  </div>
                </div>

                {!useGlobalTiming && (
                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center"><Clock className="w-3 h-3 mr-1"/> Prepared</label>
                      <input 
                        type="datetime-local" 
                        required
                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        value={item.preparedTime}
                        onChange={e => handleItemChange(index, 'preparedTime', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center"><Clock className="w-3 h-3 mr-1"/> Expiry</label>
                      <input 
                        type="datetime-local" 
                        required
                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-green-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        value={item.expiryTime}
                        onChange={e => handleItemChange(index, 'expiryTime', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
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
