import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Clock, Utensils, X, Trash2, Edit, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MyPostingsDrawer = ({ user, token, onClose, onEdit }) => {
  const [myPostings, setMyPostings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyPostings = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/food/my-listings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMyPostings(res.data);
      } catch (err) {
        console.error('Failed to fetch postings', err);
      } finally {
        setLoading(false);
      }
    };
    if (user.accountType === 'DONOR') {
      fetchMyPostings();
    }
  }, [user, token]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await axios.delete(`${API_URL}/api/food/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyPostings(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete');
    }
  };

  if (user.accountType !== 'DONOR') {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center">
            <Package className="w-5 h-5 mr-2 text-green-600" /> Edit Postings
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 text-center text-slate-500">Only donors have active postings.</div>
      </div>
    );
  }

  const activePostings = (Array.isArray(myPostings) ? myPostings : []).filter(post => post.status === 'AVAILABLE' || post.status === 'ACTIVE');

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
        <div>
          <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center">
            <Package className="w-5 h-5 mr-2 text-emerald-600" /> Edit Postings
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Active surplus listings (Edit within 12h or Delete)
          </p>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer p-1">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading active postings...</div>
        ) : activePostings.length === 0 ? (
          <div className="text-xs text-slate-500 text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2 p-6">
            <Package className="w-8 h-8 mx-auto text-slate-400 opacity-50" />
            <p className="font-bold text-slate-700 dark:text-slate-300">No Active Postings Found</p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              You do not have any active surplus food postings available for editing or deletion right now.
            </p>
          </div>
        ) : (
          activePostings.map(post => {
            const isEditable = (Date.now() - new Date(post.createdAt).getTime()) <= TWELVE_HOURS_MS;
            return (
              <div key={post._id} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-200 dark:border-slate-600 space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{post.title}</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0 ml-2 ${
                    post.status === 'AVAILABLE' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' : 
                    post.status === 'CLAIMED' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400' :
                    'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300'
                  }`}>
                    {post.status}
                  </span>
                </div>
                
                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center">
                    <Utensils className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" /> {post.quantity} servings • {post.foodType}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" /> 
                    {post.status === 'AVAILABLE' ? `Expires: ${new Date(post.expiryTime).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}` : `Updated: ${new Date(post.updatedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}`}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-600 space-y-2">
                  <div className="flex gap-2">
                    {isEditable && (
                      <button
                        onClick={() => {
                          onClose();
                          onEdit && onEdit(post);
                        }}
                        className="flex-1 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-800 dark:text-white rounded-lg flex justify-center items-center text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(post._id)}
                      className={`${isEditable ? 'flex-1' : 'w-full'} py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg flex justify-center items-center text-xs font-bold transition-colors cursor-pointer`}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                    </button>
                  </div>
                  {!isEditable && (
                    <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium text-center bg-amber-50 dark:bg-amber-950/40 p-1 rounded-lg border border-amber-200 dark:border-amber-900">
                      Edit window closed (only allowed within 12 hours of posting)
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MyPostingsDrawer;
