import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, X, Trash2, CheckCircle2, AlertCircle, Clock, Filter } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MyShortagesDrawer = ({ token, onClose, onNeedUpdated }) => {
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('ALL'); // ALL, ACTIVE, FULFILLED, CANCELLED

  const fetchMyNeeds = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/needs/my-needs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNeeds(res.data);
    } catch (err) {
      console.error('Error fetching my needs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchMyNeeds();
  }, [token]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await axios.patch(`${API_URL}/api/needs/${id}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMyNeeds();
      if (onNeedUpdated) onNeedUpdated();
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this shortage request?')) return;
    try {
      await axios.delete(`${API_URL}/api/needs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMyNeeds();
      if (onNeedUpdated) onNeedUpdated();
    } catch (err) {
      console.error('Failed to delete shortage request:', err);
      alert('Failed to delete shortage request');
    }
  };

  const filteredNeeds = needs.filter(need => {
    if (filterTab === 'ALL') return true;
    return need.status === filterTab;
  });

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
        <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center">
          <Package className="w-5 h-5 mr-2 text-amber-500" /> My Shortages & Needs
        </h3>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-white p-1 cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex space-x-1">
        {[
          { key: 'ALL', label: 'All' },
          { key: 'ACTIVE', label: 'Active' },
          { key: 'FULFILLED', label: 'Fulfilled' },
          { key: 'CANCELLED', label: 'Cancelled' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterTab(tab.key)}
            className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              filterTab === tab.key
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Needs List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center py-8 text-slate-500 text-xs">Loading shortages...</div>
        ) : filteredNeeds.length === 0 ? (
          <div className="text-xs text-slate-500 text-center py-10 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-1">
            <Package className="w-6 h-6 mx-auto text-slate-400 opacity-50" />
            <p className="font-bold">No shortages found</p>
            <p className="text-[11px] text-slate-400">
              {filterTab === 'ALL'
                ? 'You have not posted any shortage requests yet.'
                : `No shortages currently under "${filterTab}" status.`}
            </p>
          </div>
        ) : (
          filteredNeeds.map(need => (
            <div key={need._id} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-200 dark:border-slate-600 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-amber-600 dark:text-amber-400 tracking-wider block">
                    {need.category || 'Food'} Deficit
                  </span>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-snug">{need.title}</h4>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  need.status === 'ACTIVE' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' :
                  need.status === 'FULFILLED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' :
                  'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300'
                }`}>
                  {need.status}
                </span>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <p><strong>Quantity Needed:</strong> {need.quantity} {need.unit || 'servings'}</p>
                {need.description && <p className="italic text-[11px] text-slate-500 dark:text-slate-400">"{need.description}"</p>}
                <div className="flex items-center text-[10px] text-slate-400 pt-1">
                  <Clock className="w-3 h-3 mr-1" />
                  <span>Posted {new Date(need.createdAt).toLocaleDateString([], { dateStyle: 'short' })}</span>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-600 flex gap-2">
                {need.status === 'ACTIVE' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(need._id, 'FULFILLED')}
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Mark Fulfilled
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(need._id, 'CANCELLED')}
                      className="flex-1 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {need.status !== 'ACTIVE' && (
                  <button
                    onClick={() => handleUpdateStatus(need._id, 'ACTIVE')}
                    className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Reopen Need
                  </button>
                )}
                <button
                  onClick={() => handleDelete(need._id)}
                  className="px-2.5 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  title="Delete shortage"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyShortagesDrawer;
