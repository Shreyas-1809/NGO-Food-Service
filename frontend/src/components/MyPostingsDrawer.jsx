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
            <Package className="w-5 h-5 mr-2 text-green-600" /> My Postings
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 text-center text-slate-500">Only donors have active postings.</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
        <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center">
          <Package className="w-5 h-5 mr-2 text-green-600" /> My Postings
        </h3>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-white"><X className="w-5 h-5" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading postings...</div>
        ) : !Array.isArray(myPostings) || myPostings.length === 0 ? (
          <div className="text-sm text-slate-500 text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
            No active postings found.
          </div>
        ) : (
          myPostings.map(post => (
            <div key={post._id} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{post.title}</h4>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider flex-shrink-0 ml-2 ${
                  post.status === 'AVAILABLE' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' : 
                  post.status === 'CLAIMED' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400' :
                  'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-300'
                }`}>
                  {post.status}
                </span>
              </div>
              <div className="flex items-center text-xs text-slate-600 dark:text-slate-300 mb-1.5">
                <Utensils className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> {post.quantity} servings • {post.foodType}
              </div>
              <div className="flex items-center text-xs text-slate-600 dark:text-slate-300 mb-3">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> 
                {post.status === 'AVAILABLE' ? `Expires: ${new Date(post.expiryTime).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}` : `Updated: ${new Date(post.updatedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}`}
              </div>

              {post.status === 'AVAILABLE' && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-600 flex justify-between items-center">
                  {post.pendingClaimId ? (
                    <div className="w-full text-center py-2 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 rounded-lg text-sm font-bold flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 mr-2" /> Pending Claim (Check Notifications)
                    </div>
                  ) : (
                    <div className="flex gap-2 w-full">
                      <button onClick={() => onEdit && onEdit(post)} className="flex-1 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-700 dark:text-white rounded flex justify-center items-center text-sm font-medium transition-colors">
                        <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
                      </button>
                      <button onClick={() => handleDelete(post._id)} className="flex-1 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded flex justify-center items-center text-sm font-medium transition-colors">
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyPostingsDrawer;
