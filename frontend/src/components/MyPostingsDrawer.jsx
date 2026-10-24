import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Clock, Utensils, Trash2, Edit } from 'lucide-react';
import Drawer from './ui/Drawer';
import Button from './ui/Button';
import StatusBadge from './ui/StatusBadge';
import EmptyState from './ui/EmptyState';
import { T } from '../context/LanguageContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

const MyPostingsDrawer = ({ isOpen, user, token, onClose, onEdit }) => {
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
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={<T text="Edit Postings" />}
        icon={Package}
      >
        <div className="p-6 text-center text-[#60708B]"><T text="Only donors have active postings." /></div>
      </Drawer>
    );
  }

  const activePostings = (Array.isArray(myPostings) ? myPostings : []).filter(post => post.status === 'AVAILABLE' || post.status === 'ACTIVE');

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={<T text="Edit Postings" />}
      subtitle={<T text="Active surplus listings (Edit within 12h or Delete)" />}
      icon={Package}
      width="w-full max-w-md"
    >
      <div className="flex-1 space-y-4">
        {loading ? (
          <div className="text-center py-8 text-[#60708B]"><T text="Loading active postings..." /></div>
        ) : activePostings.length === 0 ? (
          <EmptyState
            icon={Package}
            message={<T text="No Active Postings Found" />}
            className="py-12"
          />
        ) : (
          activePostings.map(post => {
            const isEditable = (Date.now() - new Date(post.createdAt).getTime()) <= TWELVE_HOURS_MS;
            return (
              <div key={post._id} className="bg-[#F3F0EA] dark:bg-[#0F1A33]/50 p-4 rounded-xl border border-[#E5E1D8] dark:border-[#1E2D52] space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-[#18315E] dark:text-white line-clamp-1">{post.title}</h4>
                  <StatusBadge status={post.status} />
                </div>
                
                <div className="space-y-1 text-xs text-[#60708B] dark:text-slate-300">
                  <div className="flex items-center">
                    <Utensils className="w-3.5 h-3.5 mr-1.5 text-[#60708B] shrink-0" /> {post.quantity} <T text="servings" /> • <T text={post.foodType} />
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1.5 text-[#60708B] shrink-0" /> 
                    {post.status === 'AVAILABLE' ? `<T text="Expires:" /> ${new Date(post.expiryTime).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}` : `<T text="Updated:" /> ${new Date(post.updatedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}`}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E5E1D8] dark:border-[#1E2D52] space-y-2">
                  <div className="flex gap-2">
                    {isEditable && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          onClose();
                          if (onEdit) onEdit(post);
                        }}
                        icon={Edit}
                      >
                        <T text="Edit" />
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      className={isEditable ? 'flex-1' : 'w-full'}
                      onClick={() => handleDelete(post._id)}
                      icon={Trash2}
                    >
                      <T text="Delete" />
                    </Button>
                  </div>
                  {!isEditable && (
                    <div className="text-[10px] text-[#E5B85C] dark:text-[#D9B65D] font-medium text-center bg-[#F3F0EA] dark:bg-[#0F1A33]/40 p-1 rounded-lg border border-[#E5E1D8] dark:border-[#D9B65D]">
                      <T text="Edit window closed (only allowed within 12 hours of posting)" />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Drawer>
  );
};

export default MyPostingsDrawer;








