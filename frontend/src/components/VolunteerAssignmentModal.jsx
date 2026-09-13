import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserCheck, Plus, Trash2, Phone, Truck, User } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const VolunteerAssignmentModal = ({ isOpen, onClose, foodId, initialVolunteers = [], token, onSuccess }) => {
  const [volunteers, setVolunteers] = useState([
    { name: '', phone: '', vehicleNumber: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (Array.isArray(initialVolunteers) && initialVolunteers.length > 0) {
        setVolunteers(initialVolunteers.map(v => ({
          name: v.name || '',
          phone: v.phone || '',
          vehicleNumber: v.vehicleNumber || v.arrivalTime || ''
        })));
      } else {
        setVolunteers([{ name: '', phone: '', vehicleNumber: '' }]);
      }
    }
  }, [isOpen, initialVolunteers]);

  const handleChange = (index, field, value) => {
    const updated = [...volunteers];
    updated[index][field] = value;
    setVolunteers(updated);
  };

  const handleAddRow = () => {
    setVolunteers(prev => [...prev, { name: '', phone: '', vehicleNumber: '' }]);
  };

  const handleRemoveRow = (index) => {
    if (volunteers.length <= 1) return;
    setVolunteers(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!foodId) return;

    // Filter out completely empty rows
    const validVolunteers = volunteers.filter(v => v.name.trim() || v.phone.trim() || v.vehicleNumber.trim());

    if (validVolunteers.length === 0) {
      setError('Please fill in details for at least one volunteer.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await axios.patch(
        `${API_URL}/api/food/${foodId}/assign-volunteer`,
        { volunteers: validVolunteers },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (onSuccess) {
        onSuccess(res.data.food);
      }
      onClose();
    } catch (err) {
      console.error('Failed to assign volunteers:', err);
      setError(err.response?.data?.message || 'Failed to save volunteer assignment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Arrange Pickup Volunteers"
      icon={UserCheck}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Assign one or more volunteers who will be responsible for picking up this surplus food.
        </p>

        {error && (
          <div className="p-3 text-xs bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-xl border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
          {volunteers.map((vol, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5 relative"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Volunteer #{idx + 1}
                </span>
                {volunteers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(idx)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    title="Remove Volunteer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Volunteer Name *
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={vol.name}
                    onChange={(e) => handleChange(idx, 'name', e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border rounded-lg text-xs dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. +91 9823012345"
                      value={vol.phone}
                      onChange={(e) => handleChange(idx, 'phone', e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 border rounded-lg text-xs dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Vehicle Number / Info
                  </label>
                  <div className="relative">
                    <Truck className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. MH 12 AB 1234"
                      value={vol.vehicleNumber}
                      onChange={(e) => handleChange(idx, 'vehicleNumber', e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 border rounded-lg text-xs dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddRow}
          className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 border border-dashed border-slate-300 dark:border-slate-600"
        >
          <Plus className="w-4 h-4" />
          <span>Add Another Volunteer</span>
        </button>

        <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
          <Button
            type="button"
            variant="secondary"
            className="flex-1 justify-center"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1 justify-center bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Volunteer Assignment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default VolunteerAssignmentModal;
